// board-dashboard.test.ts — the D-17 frame and the D-18 process contract, decided from outside.
//
// WHAT THIS FILE IS. Plan 32-07 finishes the projector's surface: the full D-17 terminal frame, the
// TTY and non-TTY branches, the `--once` / `--json` / `--watch` modes, and the exit-code discipline.
// The cases below are in two halves and the halves decide different things:
//
//   • The DIRECT-CALL half calls `renderFrame(result, width)` and `main(argv, io)` with constructed
//     values and an injected io. It decides the LAYOUT and the BRANCH SELECTION, which are
//     properties of a function and are therefore testable without a terminal.
//   • The SPAWNED-PROCESS half (task 3) drives the compiled `scripts/board-dashboard.js` as a child.
//     It decides what a CI consumer actually receives — which bytes land on stdout, which on
//     stderr, and what the exit code is — because those are properties of a process and a direct
//     call cannot observe them.
//
// WHY THE FRAME IS A PURE FUNCTION. `renderFrame` takes the snapshot result and the width and reads
// no `process` state at all, so a case can render a two-stale-source board at 40 columns without a
// pty, without a fake terminal and without mutating global state. The styling escapes are passed in
// as constants that are EMPTY on a non-TTY run, so the two paths are one renderer with two stylings
// rather than two renderers free to disagree.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, vi, afterAll, afterEach } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as ts from "typescript";

import {
  CLEAR_SCREEN,
  INTERVAL_HARD_FLOOR_MS,
  PLAIN_STYLE,
  POLL_FLOOR_MS,
  STYLE,
  createLoop,
  handleInterrupt,
  main,
  renderFrame,
  run,
} from "./board-dashboard.js";
import type { DashboardIo, LoopDeps, Options, WatchHandle } from "./board-dashboard.js";
import { CONFLICT_KINDS, SOURCE_NAMES, readSnapshot } from "./board-read.js";
// The PUBLISHED version, read from the module rather than retyped here (plan 32-33).
import { SCHEMA_VERSION } from "./board-model.js";
import type { SnapshotResult, SourceName } from "./board-read.js";
import type {
  BoardColumn,
  BoardModel,
  BoardRow,
  Conflict,
  FactorySnapshot,
  SourceState,
  UnparsedLine,
} from "./board-model.js";

const ROOT = join(import.meta.dirname, "..");
const FIXTURE = join(ROOT, "scripts", "fixtures", "board-snapshot");

// The control introducers, BUILT rather than typed, so this source file carries no control byte of
// its own. `scripts/check-nul-bytes.ts` is the recorded reason the tree keeps them out of source.
const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);

/** The instant every constructed snapshot below claims to have been read at. */
const READ_AT = "2026-09-14T12:00:00.000Z";

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// CONSTRUCTED RESULTS — the frame's input, built rather than read.
//
// A case that needs two stale sources, or a board over the D-20 ceiling, cannot get one from a
// fixture without manufacturing a filesystem failure on every run. The builders below make the
// INPUT the subject: each case names the one field it is about and inherits the rest.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

function boardRow(id: string, title: string): BoardRow {
  return { id, title, meta: null, trailer: "", line: 1, truncated: false };
}

function boardColumn(partial: Partial<BoardColumn> & { name: string }): BoardColumn {
  return {
    name: partial.name,
    heading: partial.heading ?? `## ${partial.name} (WIP unlimited)`,
    kind: partial.kind ?? "unlimited",
    claimedLive: partial.claimedLive ?? null,
    limit: partial.limit ?? null,
    line: partial.line ?? 1,
    rows: partial.rows ?? [],
  };
}

function boardModel(partial: Partial<BoardModel> = {}): BoardModel {
  return {
    columns: partial.columns ?? [],
    epicRows: partial.epicRows ?? [],
    updates: partial.updates ?? [],
    preamble: partial.preamble ?? [],
    nonColumnSections: partial.nonColumnSections ?? [],
    unparsed: partial.unparsed ?? [],
    bounds: partial.bounds ?? { boardBytes: 2_048, longestLine: 99, exceeded: false },
  };
}

type SourceOverrides = {
  readonly [K in SourceName]?: SourceState<never>;
};

/** Build a result whose sources are all `ok` and empty unless a case names one. */
function makeResult(partial: {
  board?: BoardModel | null;
  conflicts?: readonly Conflict[];
  sources?: SourceOverrides;
  source?: SnapshotResult["source"];
  mode?: string;
  /**
   * The dial's per-column limits, KEYED BY COLUMN NAME — so a case can plant content in a JSON
   * KEY rather than in a value. A sanitizer that only ever visits values answers for half the
   * document, which is why this hook exists (CR-02).
   */
  wipLimits?: Readonly<Record<string, number>>;
}): SnapshotResult {
  const board = partial.board === undefined ? boardModel() : partial.board;
  const config = {
    mode: partial.mode ?? "lean",
    idPrefix: "ABC",
    wipLimits: partial.wipLimits ?? {},
  };
  const defaults = {
    board: { source: "ok", value: board ?? boardModel(), readAt: READ_AT },
    tickets: { source: "ok", value: [], readAt: READ_AT },
    queue: { source: "ok", value: [], readAt: READ_AT },
    context: { source: "ok", value: [], readAt: READ_AT },
    traceability: { source: "ok", value: [], readAt: READ_AT },
    config: { source: "ok", value: config, readAt: READ_AT },
  } as unknown as FactorySnapshot["sources"];

  const sources = { ...defaults, ...(partial.sources ?? {}) } as FactorySnapshot["sources"];

  const snapshot: FactorySnapshot = {
    schemaVersion: SCHEMA_VERSION,
    repoRoot: "/repo",
    generatedAt: READ_AT,
    board,
    config,
    sources,
  };
  return {
    source: partial.source ?? "ok",
    snapshot,
    conflicts: partial.conflicts ?? [],
    readErrors: [],
  };
}

/** A `stale` source state carrying the reason and the instant of its last good read. */
function staleSince(since: string, reason: "enoent" | "torn" = "enoent"): SourceState<never> {
  return {
    source: "stale",
    value: [] as never,
    readAt: since,
    stale: { reason, since },
  };
}

function unparsedAt(column: string, n: number): UnparsedLine[] {
  return Array.from({ length: n }, (_, i) => ({ line: i + 1, text: "prose", column }));
}

/** The frame's lines, blank ones dropped — the shape every layout assertion below reads. */
function frameLines(frame: string): string[] {
  return frame.split("\n").filter((l) => l.trim() !== "");
}

/** The line opening a column, plus every indented line beneath it: the column's whole block. */
function columnBlock(frame: string, name: string): string[] {
  const lines = frameLines(frame);
  const start = lines.findIndex((l) => l.startsWith(name));
  if (start === -1) return [];
  const block = [lines[start] as string];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i] as string;
    if (!line.startsWith("  ")) break;
    block.push(line);
  }
  return block;
}

/** The one line that opens the named column. */
function columnLine(frame: string, name: string): string {
  return columnBlock(frame, name)[0] ?? "";
}

/** The fixture tree read through the real seam — the same input the committed golden is built from. */
function fixtureResult(): SnapshotResult {
  return readSnapshot(FIXTURE);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TASK 1 — THE FULL D-17 LAYOUT (DASH-07, DASH-05, T-32-06).
// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("board-dashboard — the D-17 header (D-12, D-17, D-20)", () => {
  it("names the resolved root, the mode, the read time and the conflict count, with no LARGE BOARD marker", () => {
    const result = fixtureResult();
    expect(
      result.conflicts.length,
      "PREMISE: the fixture produced no conflicts, so 'the header carries the conflict count' " +
        "would be asserted against a zero the renderer could print without counting anything",
    ).toBeGreaterThan(0);

    const header = frameLines(renderFrame(result, 200))[0] as string;
    expect(header).toContain(realpathSync(FIXTURE));
    expect(header).toContain("mode: lean");
    expect(header).toContain(`read: ${result.snapshot.generatedAt}`);
    expect(header).toContain(`${result.conflicts.length} conflicts`);
    expect(
      header,
      "the fixture board is 2 KB, so a LARGE BOARD marker here would be a marker that says nothing",
    ).not.toContain("LARGE BOARD");
  });

  it("adds a LARGE BOARD marker carrying the byte size and the longest line, each in its own unit (D-20, WR-05)", () => {
    const result = makeResult({
      board: boardModel({ bounds: { boardBytes: 389_120, longestLine: 34_494, exceeded: true } }),
    });
    const header = frameLines(renderFrame(result, 200))[0] as string;
    expect(header).toContain("LARGE BOARD (380 KB, longest line 34,494 chars)");
  });

  it("names BOTH stale sources and the age of each last good read in exactly ONE badge (D-12)", () => {
    const result = makeResult({
      source: "stale",
      sources: {
        board: staleSince("2026-09-14T10:00:00.000Z", "enoent"),
        queue: staleSince("2026-09-14T11:55:00.000Z", "torn"),
      },
    });
    const header = frameLines(renderFrame(result, 200))[0] as string;

    // The names are the ones the RESULT carries, not a second list inside the renderer.
    const declared = Object.keys(result.snapshot.sources);
    expect(
      declared,
      "PREMISE: the result's own source keys are not the pinned SOURCE_NAMES tuple, so 'the badge " +
        "uses the declared names' is asserted against something else",
    ).toEqual([...SOURCE_NAMES]);

    expect((header.match(/STALE/g) ?? []).length).toBe(1);
    expect(header).toContain("board");
    expect(header).toContain("queue");
    expect(header).toContain("2h");
    expect(header).toContain("5m");
  });
});

describe("board-dashboard — the D-17 columns (D-03, D-09, D-17)", () => {
  it("renders claimed, counted and limit on a wip-count column, and live over limit on one without", () => {
    const result = fixtureResult();
    expect(
      result.conflicts.some((c) => c.kind === "wip-count" && c.column === "In Development"),
      "PREMISE: the fixture carries no wip-count conflict on In Development, so the case below " +
        "measures the ordinary arm twice",
    ).toBe(true);

    const frame = renderFrame(result, 200);
    const disputed = columnLine(frame, "In Development");
    expect(disputed).toContain("claimed 2");
    expect(disputed).toContain("counted 3");
    expect(disputed).toContain("limit 3");

    const agreed = columnLine(frame, "Ready");
    expect(agreed).toContain("1/5");
    expect(
      agreed,
      "naming a disagreement on a column that has none is noise the reader learns to ignore",
    ).not.toContain("claimed");
  });

  it("collapses an empty column to exactly one line and renders Blocked last whatever its on-disk position", () => {
    const result = makeResult({
      board: boardModel({
        columns: [
          boardColumn({ name: "Blocked", kind: "blocked", rows: [boardRow("ABC-9", "stuck")] }),
          boardColumn({ name: "Empty" }),
          boardColumn({ name: "Full", rows: [boardRow("ABC-1", "a row")] }),
        ],
      }),
    });
    const frame = renderFrame(result, 200);

    expect(columnBlock(frame, "Empty").length).toBe(1);
    expect(columnBlock(frame, "Full").length).toBe(2);

    const lines = frameLines(frame);
    const blockedAt = lines.findIndex((l) => l.startsWith("Blocked"));
    const fullAt = lines.findIndex((l) => l.startsWith("Full"));
    expect(blockedAt).toBeGreaterThan(fullAt);
  });

  it("renders the unparsed-line count on the column's own line (D-03)", () => {
    const result = makeResult({
      board: boardModel({
        columns: [boardColumn({ name: "Done", rows: [boardRow("ABC-1", "shipped")] })],
        unparsed: unparsedAt("Done", 3),
      }),
    });
    expect(columnLine(renderFrame(result, 200), "Done")).toContain("3 unparsed lines");
  });
});

describe("board-dashboard — the frame cannot smuggle an escape sequence (T-32-06)", () => {
  it("sanitizes a title carrying a CSI and an OSC sequence — no ESC byte survives into the frame", () => {
    const hostile = `${ESC}[31mred${ESC}]0;retitled${BEL} title`;
    const result = makeResult({
      board: boardModel({
        columns: [boardColumn({ name: "Backlog", rows: [boardRow("ABC-1", hostile)] })],
      }),
    });
    const frame = renderFrame(result, 200);
    expect(frame.includes(ESC)).toBe(false);
    expect(frame.includes(BEL)).toBe(false);
    expect(frame).toContain("red");
  });

  it("truncates a row line to the supplied width and never splits a surrogate pair", () => {
    // The row line is `  ABC-001  ` (11 chars) followed by the title, so the astral character at
    // title offset 7 straddles the cut a width of 20 would otherwise make.
    const title = `abcdefg\u{1F600}hijklmnopqrstuvwxyz`;
    const result = makeResult({
      board: boardModel({
        columns: [boardColumn({ name: "Backlog", rows: [boardRow("ABC-001", title)] })],
      }),
    });
    const block = columnBlock(renderFrame(result, 20), "Backlog");
    expect(
      block.length,
      "PREMISE: the column rendered no row line at all, so there is nothing for a width to cut",
    ).toBe(2);
    const rowLine = block[1] as string;

    expect(rowLine.length).toBeLessThanOrEqual(20);
    expect(rowLine).toContain("…");
    const loneSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    expect(
      loneSurrogate.test(rowLine),
      "a cut through a surrogate pair puts an unpaired code unit on a terminal, which renders as " +
        "a replacement character and is a broken cell rather than a truncated one",
    ).toBe(false);
  });
});

describe("board-dashboard — Now running and Conflicts (D-10, D-13, D-17)", () => {
  it("renders the literal `no queue` and NO badge when the queue source is unavailable (D-13)", () => {
    const result = makeResult({
      sources: { queue: { source: "unavailable", present: false } as SourceState<never> },
    });
    const frame = renderFrame(result, 200);
    expect(frame).toContain("no queue");
    expect(
      frame,
      "an absent `.grugops/` is a legitimate state: a fresh repository that has never run the " +
        "queue must not be reported as stale forever",
    ).not.toContain("STALE");
  });

  it("groups conflicts by kind in CONFLICT_KINDS declaration order, each naming expected and actual", () => {
    const result = fixtureResult();
    const present = CONFLICT_KINDS.filter((k) => result.conflicts.some((c) => c.kind === k));
    expect(
      present.length,
      "PREMISE: the fixture reaches fewer than two conflict kinds, so 'grouped in declaration " +
        "order' is asserted over a list with no order to get wrong",
    ).toBeGreaterThan(1);

    const frame = renderFrame(result, 200);
    const positions = present.map((k) => frame.indexOf(k));
    expect(
      positions.every((p) => p >= 0),
      `every present kind must be named in the frame; got ${JSON.stringify(positions)}`,
    ).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));

    // And an entry names both sides of the disagreement rather than only the finding.
    expect(frame).toContain("expected");
    expect(frame).toContain("actual");
    expect(frame).toContain("ABC-102");
  });
});

describe("board-dashboard — renderFrame is PURE (D-15, D-17)", () => {
  it("reads no environment variable and no process stream: the width is the argument, nothing else", () => {
    const result = makeResult({
      board: boardModel({
        columns: [
          boardColumn({
            name: "Backlog",
            rows: [boardRow("ABC-001", "a title long enough to be cut at a narrow width")],
          }),
        ],
      }),
    });

    const before = renderFrame(result, 200);
    const previous = process.env["COLUMNS"];
    process.env["COLUMNS"] = "10";
    const after = renderFrame(result, 200);
    if (previous === undefined) delete process.env["COLUMNS"];
    else process.env["COLUMNS"] = previous;

    expect(
      frameLines(before).some((l) => l.length > 10),
      "PREMISE: no line is longer than the COLUMNS value planted below, so an environment read " +
        "would not have changed the output and this case would pass over a renderer that does one",
    ).toBe(true);
    expect(after).toBe(before);
    expect(renderFrame(result, 200)).toBe(before);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TASK 2 — THE MODES AND THE EXIT CONTRACT (D-17, D-18, T-32-08, T-32-10).
//
// THE EXIT CODE IS NOT THE STATE CHANNEL. A stale board and a conflicted board both exit 0, because
// what they have to say is IN the frame and in the JSON document. Exit 2 is reserved for exactly two
// conditions — a usage error and an unreadable root — and the cases below pin both directions: the
// two that DO exit 2, and the two states that deliberately do NOT.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

type Captured = { out: string; err: string; code: number };

/** A capturing io. `columns` is the width the renderer is handed; a pipe reports none. */
function captureIo(isTty: boolean, columns?: number): DashboardIo & { readonly seen: Captured } {
  const seen: Captured = { out: "", err: "", code: -1 };
  return {
    seen,
    stdout: {
      write: (s: string) => {
        seen.out += s;
        return true;
      },
    },
    stderr: {
      write: (s: string) => {
        seen.err += s;
        return true;
      },
    },
    isTty,
    ...(columns === undefined ? {} : { columns }),
  };
}

/** Call `main` with a capturing io and return everything the invocation produced. */
function runMain(argv: readonly string[], isTty: boolean, columns?: number): Captured {
  const io = captureIo(isTty, columns);
  const code = main(argv, io);
  return { ...io.seen, code };
}

/** `LoopDeps` over a constructed result: no filesystem, no watcher, no clock. */
function stubDeps(result: SnapshotResult, onRead?: () => void): LoopDeps {
  return {
    watch: () => ({ close: () => undefined, on: () => undefined }) as WatchHandle,
    exists: () => false,
    read: () => {
      onRead?.();
      return result;
    },
  };
}

/** Every ANSI SGR sequence, so a styled frame can be compared against its plain twin. */
const SGR = new RegExp(`${ESC}\\[[0-9;]*m`, "g");

afterEach(() => {
  vi.useRealTimers();
});

describe("board-dashboard — the render modes (D-17, D-18)", () => {
  it("clears the screen exactly once, writes one frame and exits 0 on a TTY --once run", () => {
    const r = runMain([FIXTURE, "--once"], true);
    expect(r.code).toBe(0);
    expect(r.out.startsWith(CLEAR_SCREEN)).toBe(true);
    expect(r.out.split(CLEAR_SCREEN).length - 1).toBe(1);
    expect(r.out).toContain("grugops board");
  });

  it("writes one frame with NO escape byte and exits 0 on a non-tty --once run (D-18)", () => {
    const r = runMain([FIXTURE, "--once"], false);
    expect(r.code).toBe(0);
    expect(r.out.includes(ESC)).toBe(false);
    expect(r.out).toContain("grugops board");
  });

  it("treats a non-TTY run with NO flags as --once: one frame, exit 0 (D-18)", () => {
    const r = runMain([FIXTURE], false);
    expect(r.code).toBe(0);
    expect(r.out.includes(ESC)).toBe(false);
    expect((r.out.match(/grugops board/g) ?? []).length).toBe(1);
  });

  it("writes exactly ONE JSON document and exits 0 for --json on a TTY — --json implies --once", () => {
    const r = runMain([FIXTURE, "--json"], true);
    expect(r.code).toBe(0);
    expect(
      r.out.includes(CLEAR_SCREEN),
      "a screen clear inside a JSON document is a document a consumer cannot parse",
    ).toBe(false);
    const parsed = JSON.parse(r.out) as { snapshot: { schemaVersion: number } };
    expect(parsed.snapshot.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("writes one COMPLETE JSON document per line per re-read under --json --watch (D-18)", () => {
    vi.useFakeTimers();
    const io = captureIo(false);
    const deps = stubDeps(makeResult({}));
    const started = run(["/repo", "--json", "--watch", "--interval", "1000"], io, deps);
    expect(started.kind).toBe("running");
    if (started.kind !== "running") return;

    vi.advanceTimersByTime(2_000);
    started.loop.stop();

    const lines = io.seen.out.split("\n").filter((l) => l !== "");
    expect(
      lines.length,
      "PREMISE: fewer than two documents were emitted, so 'every line is complete' says almost nothing",
    ).toBeGreaterThanOrEqual(3);
    for (const line of lines) {
      expect(() => JSON.parse(line) as unknown).not.toThrow();
    }
  });

  it("renders the TTY and non-TTY frames through the SAME renderer, identical once the style is empty", () => {
    const result = fixtureResult();
    const styled = renderFrame(result, 120, STYLE);
    const plain = renderFrame(result, 120, PLAIN_STYLE);
    expect(
      styled,
      "PREMISE: the styled frame is byte-identical to the plain one, so the comparison below " +
        "would pass over a renderer that never applied a style at all",
    ).not.toBe(plain);
    expect(styled.replace(SGR, "")).toBe(plain);
  });

  it("falls back to 80 columns when the io reports no width, and honours one when it does", () => {
    const narrow = runMain([FIXTURE, "--once"], false).out;
    const wide = runMain([FIXTURE, "--once"], false, 200).out;
    // The header is deliberately exempt from truncation: it carries the badge that says the frame
    // is not to be trusted, and a cut badge is worse than a wrapped line.
    const body = (frame: string): string[] => frameLines(frame).slice(1);

    expect(
      body(narrow).some((l) => l.endsWith("…")),
      "PREMISE: nothing in the fixture frame is longer than 80 columns, so the fallback below is " +
        "asserted over a frame no width could have changed",
    ).toBe(true);
    expect(Math.max(...body(narrow).map((l) => l.length))).toBeLessThanOrEqual(80);
    expect(Math.max(...body(wide).map((l) => l.length))).toBeGreaterThan(80);
  });
});

describe("board-dashboard — the exit contract (D-18, T-32-08, T-32-10)", () => {
  it("exits 0 for a STALE result and exits 0 for a CONFLICTED result — the code is not the channel", () => {
    const stale = makeResult({
      source: "stale",
      sources: { board: staleSince("2026-09-14T11:00:00.000Z", "torn") },
    });
    const conflicted = makeResult({
      conflicts: [
        {
          kind: "wip-count",
          column: "In Development",
          expected: "claimed 2, limit 3",
          actual: "counted 3",
          source: "board",
        },
      ],
    });

    for (const [name, result] of [
      ["stale", stale],
      ["conflicted", conflicted],
    ] as const) {
      const io = captureIo(false);
      const outcome = run(["/repo", "--once"], io, stubDeps(result));
      expect(outcome.kind).toBe("exit");
      expect(
        outcome.kind === "exit" ? outcome.code : -1,
        `a ${name} board still exits 0: what it has to say is in the frame, and a consumer that ` +
          `pipes the output should not have to decide whether a nonzero code meant "the board says ` +
          `something" or "the tool broke"`,
      ).toBe(0);
    }
  });

  it("exits 2 with a named one-line stderr message and an EMPTY stdout for an unreadable repoRoot", () => {
    const r = runMain([join(ROOT, "no", "such", "tree"), "--once"], false);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).toContain("no/such/tree");
    expect(r.err).not.toContain("    at ");
  });

  it("exits 2 with the usage on stderr and an EMPTY stdout for an unknown flag", () => {
    const r = runMain([FIXTURE, "--nonsense"], false);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).toContain("--nonsense");
    expect(r.err).toContain("usage:");
  });

  it("exits 2 and NAMES the 1000 ms floor for --interval below it, non-integer and negative alike", () => {
    for (const bad of ["999", "0", "abc", "1e4", "1000.5", "-1"]) {
      const r = runMain([FIXTURE, "--interval", bad], false);
      expect(r.code, `--interval ${bad} must be refused rather than coerced`).toBe(2);
      expect(r.out).toBe("");
      expect(
        r.err,
        `--interval ${bad} was refused without naming the ${INTERVAL_HARD_FLOOR_MS} ms floor, so ` +
          `the message does not tell the caller what a legal value is`,
      ).toContain(String(INTERVAL_HARD_FLOOR_MS));
    }
  });

  it("exits 2 with exactly ONE named stderr line when an exception escapes inside main (T-32-08)", () => {
    const seen = { err: "", out: "" };
    const io: DashboardIo = {
      stdout: {
        write: () => {
          throw new Error("the pipe closed\nwith a second line");
        },
      },
      stderr: {
        write: (s: string) => {
          seen.err += s;
          return true;
        },
      },
      isTty: false,
    };

    let escaped = false;
    let code = -1;
    try {
      code = main(["--help"], io);
    } catch {
      escaped = true;
    }

    expect(
      escaped,
      "an exception that escapes `main` reaches the runtime's default handler, which prints a raw " +
        "stack — the last bytes a piped consumer reads (T-32-08)",
    ).toBe(false);
    expect(code).toBe(2);
    expect(seen.out).toBe("");
    expect(seen.err.trimEnd().split("\n").length).toBe(1);
    expect(seen.err).toContain("board-dashboard");
  });
});

describe("board-dashboard — SIGINT closes the loop rather than the process mid-frame", () => {
  it("closes every watcher, clears both timers and exits 0 on interrupt", () => {
    vi.useFakeTimers();
    const closed: boolean[] = [];
    let reads = 0;
    const options: Options = {
      repoRoot: "/repo",
      once: false,
      json: true,
      watch: true,
      intervalMs: null,
    };
    const deps: LoopDeps = {
      watch: () => {
        const at = closed.push(false) - 1;
        return {
          close: () => {
            closed[at] = true;
          },
          on: () => undefined,
        } as WatchHandle;
      },
      exists: () => true,
      read: () => {
        reads += 1;
        return makeResult({});
      },
    };

    const loop = createLoop(options, captureIo(false), deps);
    // SEEDED BEFORE IT IS ARMED, WHICH IS THE ORDER `run` TAKES. The root a watch is armed against
    // comes out of the read the seed carries (IN-01, plan 32-19): `makeResult({})` resolves to
    // `/repo`, the same tree this case's injected `exists` answers for. Arming first would drive an
    // order the shipped program never takes, and the loop states what it does then — it arms
    // nothing, which would make the premise below false for a reason this case is not about.
    loop.seed(makeResult({}));
    loop.armAll();
    loop.start(POLL_FLOOR_MS);
    expect(
      closed.length,
      "PREMISE: no watcher was armed, so 'every watcher is closed' is true of a loop that never " +
        "watched anything",
    ).toBeGreaterThan(0);

    const exits: number[] = [];
    handleInterrupt(loop, (c) => exits.push(c));

    expect(closed.every((c) => c)).toBe(true);
    expect(exits).toEqual([0]);

    const before = reads;
    vi.advanceTimersByTime(POLL_FLOOR_MS * 3);
    expect(
      reads,
      "the poll interval survived the interrupt, so the process would keep re-reading a tree " +
        "nobody is watching any more",
    ).toBe(before);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TASK 3 — THE CONTRACT AS A SPAWNED PROCESS (D-18, T-32-06, T-32-08, T-32-22, T-32-23).
//
// WHAT THIS HALF DECIDES THAT THE HALF ABOVE CANNOT. A direct `main(argv, io)` call proves which
// BRANCH was selected. It cannot prove what a CI consumer receives, because the exit code, the
// separation of stdout from stderr and the absence of a stack are properties of a PROCESS. The
// `check-platform-shapes.ts` drive harness is the in-repo precedent for asserting them from outside.
//
// WHAT IT DOES NOT DECIDE, NAMED RATHER THAN IMPLIED. It measures the process contract, NOT the
// visual result on a real terminal. This suite has no pty, so the live TTY redraw — whether the
// frame refreshes without flicker and reads legibly at a human width — is recorded as a MANUAL-ONLY
// verification in `.planning/phases/32-board-projector-cli-dashboard/32-VALIDATION.md`, with its
// instructions, rather than asserted by a case that would be measuring its own fake terminal. A
// green assertion over a simulated terminal is the weakest possible evidence about a real one.
//
// EVERY MUTATING CASE OPERATES ON A TEMP COPY. The committed fixture tree is an input to the golden
// (plan 32-05); a test run that modified it would move a byte-for-byte comparison from under another
// suite. The `afterAll` below re-decides that from `git status` rather than trusting the discipline.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

const DASHBOARD_JS = join(ROOT, "scripts", "board-dashboard.js");

/** Drive the COMPILED module as a child and capture both streams and the code. */
function spawnDashboard(args: readonly string[]): Captured {
  const r = spawnSync(process.execPath, [DASHBOARD_JS, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 20_000,
  });
  return { out: r.stdout ?? "", err: r.stderr ?? "", code: r.status ?? -1 };
}

/** A throwaway copy of the fixture tree. Nothing here ever writes to the committed one. */
function withFixtureCopy(body: (dir: string) => void): void {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), "grugops-dashboard-"));
  try {
    cpSync(FIXTURE, dir, { recursive: true });
    body(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The fixture's deliberately tampered claim, which the queue reader skips and REPORTS.
 *
 * It exists so plan 32-03's tamper-skip arm is reached by a committed artifact, which means the
 * committed tree always produces one stderr diagnostic. A case asserting "stderr is empty" has to
 * remove it first, or it is asserting that the fixture stopped exercising the arm it was built for.
 */
const TAMPERED_CLAIM = join(".grugops", "queue", "claimed", "abc-105-tampered");

afterAll(() => {
  const status = spawnSync("git", ["status", "--porcelain", "scripts/fixtures/"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  expect(
    (status.stdout ?? "").trim(),
    "a test run left the committed fixture tree modified; the golden in plan 32-05 is a " +
      "byte-for-byte function of exactly these bytes",
  ).toBe("");
});

describe("board-dashboard — the spawned process contract: one document, once (D-18)", () => {
  it("exits 0 with exactly ONE JSON document on stdout and an EMPTY stderr for --once --json", () => {
    withFixtureCopy((dir) => {
      // The tampered claim is removed so "stderr is empty" measures the STREAM DISCIPLINE rather
      // than the fixture's deliberate diagnostic. The committed-tree case below covers the other
      // direction: a diagnostic exists, and it still does not touch stdout.
      rmSync(join(dir, TAMPERED_CLAIM), { recursive: true, force: true });
      const r = spawnDashboard([dir, "--once", "--json"]);
      expect(r.code).toBe(0);
      expect(r.err).toBe("");
      const lines = r.out.split("\n").filter((l) => l !== "");
      expect(lines.length).toBe(1);
      const parsed = JSON.parse(r.out) as { snapshot: { schemaVersion: number } };
      expect(parsed.snapshot.schemaVersion).toBe(SCHEMA_VERSION);
    });
  });

  it("keeps a read diagnostic on stderr and out of the JSON document on stdout", () => {
    const r = spawnDashboard([FIXTURE, "--once", "--json"]);
    expect(r.code).toBe(0);
    expect(
      r.err,
      "PREMISE: the committed fixture produced no diagnostic, so the separation below is asserted " +
        "over a run that had nothing to separate",
    ).toContain("tampered");
    expect(() => JSON.parse(r.out) as unknown).not.toThrow();
  });

  it("emits no ESC byte at all when stdout is a pipe rather than a tty (non-tty, T-32-06)", () => {
    const r = spawnDashboard([FIXTURE, "--once"]);
    expect(r.code).toBe(0);
    expect(r.out.includes(ESC)).toBe(false);
    expect(r.out).toContain("grugops board");
  });
});

describe("board-dashboard — the spawned process refuses by code, never by silence (D-18)", () => {
  it("exits 2 with an EMPTY stdout on an unknown flag", () => {
    const r = spawnDashboard([FIXTURE, "--nonsense"]);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).toContain("--nonsense");
  });

  it("exits 2 with an EMPTY stdout and a NAMED stderr message on a path that does not exist", () => {
    const missing = join(realpathSync(tmpdir()), "grugops-dashboard-no-such-tree-32-07");
    const r = spawnDashboard([missing, "--once", "--json"]);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).toContain(missing);
    expect(r.err).not.toContain("    at ");
  });
});

describe("board-dashboard — a board removed under a live run degrades VISIBLY (DASH-05, T-32-22)", () => {
  it(
    "carries the STALE badge and the PREVIOUS column values rather than zero columns, exiting 0",
    async () => {
      await new Promise<void>((resolve, reject) => {
        const dir = mkdtempSync(join(realpathSync(tmpdir()), "grugops-dashboard-"));
        cpSync(FIXTURE, dir, { recursive: true });

        const proc = spawn(process.execPath, [DASHBOARD_JS, dir, "--watch", "--interval", "1000"], {
          cwd: ROOT,
        });
        let out = "";
        let err = "";
        proc.stdout.setEncoding("utf8");
        proc.stderr.setEncoding("utf8");
        proc.stdout.on("data", (c: string) => {
          out += c;
        });
        proc.stderr.on("data", (c: string) => {
          err += c;
        });

        // The first frame has landed by the time the board is removed, so the loop has a last-good
        // value to carry forward. Without a previous read there is nothing to be stale ABOUT, and
        // the source would be `unavailable` instead — a different, also-honest state.
        const removeAt = setTimeout(() => {
          rmSync(join(dir, "plans", "board.md"), { force: true });
        }, 700);
        const stopAt = setTimeout(() => proc.kill("SIGINT"), 2_600);

        proc.on("error", reject);
        proc.on("close", (code) => {
          clearTimeout(removeAt);
          clearTimeout(stopAt);
          rmSync(dir, { recursive: true, force: true });
          try {
            const frames = out.split("grugops board").filter((f) => f.trim() !== "");
            expect(
              frames.length,
              `PREMISE: fewer than two frames were emitted, so there is no BEFORE and AFTER to ` +
                `compare. stderr was: ${err.slice(0, 400)}`,
            ).toBeGreaterThanOrEqual(2);

            const last = frames[frames.length - 1] as string;
            expect(last).toContain("STALE");
            expect(last).toContain("board");
            expect(
              last,
              "the previous good value is carried forward: a board that went away must never " +
                "render as a board with no columns, which reads as an empty backlog",
            ).toContain("In Development");
            expect(last).toContain("ABC-104");
            expect(err).not.toBe("");
            expect(code).toBe(0);
            resolve();
          } catch (e) {
            reject(e as Error);
          }
        });
      });
    },
    20_000,
  );
});

describe("board-dashboard — NDJSON under --json --watch, measured from outside (D-18, T-32-23)", () => {
  it(
    "emits two or more lines, each parsing INDEPENDENTLY as a complete document, and exits 0 on SIGINT",
    async () => {
      await new Promise<void>((resolve, reject) => {
        const dir = mkdtempSync(join(realpathSync(tmpdir()), "grugops-dashboard-"));
        cpSync(FIXTURE, dir, { recursive: true });
        const proc = spawn(
          process.execPath,
          [DASHBOARD_JS, dir, "--json", "--watch", "--interval", "1000"],
          { cwd: ROOT },
        );
        let out = "";
        let err = "";
        proc.stdout.setEncoding("utf8");
        proc.stderr.setEncoding("utf8");
        proc.stdout.on("data", (c: string) => {
          out += c;
        });
        proc.stderr.on("data", (c: string) => {
          err += c;
        });

        // Touch a watched file, so at least one of the documents below is event-driven rather than
        // all of them being poll ticks.
        const touchAt = setTimeout(() => {
          appendFileSync(join(dir, "plans", "board.md"), "\n");
        }, 600);
        const stopAt = setTimeout(() => proc.kill("SIGINT"), 2_400);

        proc.on("error", reject);
        proc.on("close", (code) => {
          clearTimeout(touchAt);
          clearTimeout(stopAt);
          rmSync(dir, { recursive: true, force: true });
          try {
            const lines = out.split("\n").filter((l) => l !== "");
            expect(
              lines.length,
              `PREMISE: fewer than two documents were emitted, so "every line parses on its own" ` +
                `describes almost nothing. stderr was: ${err.slice(0, 400)}`,
            ).toBeGreaterThanOrEqual(2);
            for (const line of lines) {
              const parsed = JSON.parse(line) as { snapshot: { schemaVersion: number } };
              expect(parsed.snapshot.schemaVersion).toBe(SCHEMA_VERSION);
            }
            // THE ASSERTION THAT WOULD HAVE CAUGHT WR-06. The header and the `USAGE` block used to
            // promise "exactly one JSON document on stdout and nothing else"; this is that promise,
            // stated as a measurement. A consumer that read the help text and did the obvious thing
            // — parse the whole of stdout — got a parse error on frame two, and the failure looked
            // like a tool defect rather than a documentation defect. The corrected sentences now say
            // one document per LINE, and this is the line that holds them to it.
            expect(
              () => JSON.parse(out) as unknown,
              "the whole --watch --json stream parsed as a single document, so this case is no " +
                "longer measuring the streaming contract it exists to measure",
            ).toThrow();
            expect(code).toBe(0);
            resolve();
          } catch (e) {
            reject(e as Error);
          }
        });
      });
    },
    20_000,
  );
});

/** Start a child now and resolve when it closes — so two calls genuinely overlap in time. */
function runConcurrently(): Promise<Captured> {
  return new Promise<Captured>((resolve, reject) => {
    const proc = spawn(process.execPath, [DASHBOARD_JS, FIXTURE, "--once", "--json"], { cwd: ROOT });
    let out = "";
    let err = "";
    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");
    proc.stdout.on("data", (c: string) => {
      out += c;
    });
    proc.stderr.on("data", (c: string) => {
      err += c;
    });
    proc.on("error", reject);
    proc.on("close", (code) => resolve({ out, err, code: code ?? -1 }));
  });
}

describe("board-dashboard — two dashboards on one tree share nothing (edge: concurrency)", () => {
  it("produces two COMPLETE independent documents and exits 0 twice, with no lock between them", async () => {
    // GENUINELY OVERLAPPING, and the distinction matters. `spawnSync` inside a `Promise.all` runs
    // the two children one after the other and would assert nothing about concurrency at all — the
    // second process would start after the first had already exited, which is the very arrangement
    // a shared lock would survive. Both children are started before either is awaited.
    const both = await Promise.all([runConcurrently(), runConcurrently()]);

    for (const r of both) {
      expect(r.code).toBe(0);
      const parsed = JSON.parse(r.out) as { snapshot: { schemaVersion: number } };
      expect(parsed.snapshot.schemaVersion).toBe(SCHEMA_VERSION);
    }
    // Independent, not identical: each read its own clock, so the two documents are two readings of
    // one tree rather than one reading served twice from something shared.
    const generatedAt = both.map(
      (r) => (JSON.parse(r.out) as { snapshot: { generatedAt: string } }).snapshot.generatedAt,
    );
    expect(generatedAt.every((g) => typeof g === "string" && g !== "")).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-13 TASK 1 — CR-05: THE STDERR CHANNEL IS THE SAME TERMINAL, AND IT CARRIES THE UNTRUSTED
// CONTENT.
//
// WHAT THE FINDING WAS. The T-32-06 sanitizer was applied at every string that reaches STDOUT in the
// frame. That is a true statement about stdout and it was the wrong boundary: `readError.message`
// carries bytes read out of a board or ticket file, the root-refusal line carries the raw `repoRoot`
// argument, and both go to stderr — which on an interactive run is the same terminal emulator, and
// is the channel a human watching a live dashboard actually reads. The reviewer retitled the window
// and cleared the screen from a ticket file and again from argv.
//
// WHAT THIS HALF DECIDES. Three things, and they are different questions:
//
//   • THE EFFECT — a spawned process is driven with a planted OSC/CSI sequence and the captured
//     stderr is measured for control code points. This is the only half that observes what a
//     terminal would be handed.
//   • THE ABSENCE OF A SECOND AUTHORITY — the module's own AST is walked and every stderr write
//     expression in it is collected. A chokepoint holds only while it is the ONLY site, so the count
//     is pinned two-sided AND the surviving site's enclosing function is named. A count of one in
//     the wrong function is still a bypass.
//   • THE OVER-REMOVAL DIRECTION — a positive control asserting that ordinary non-ASCII text
//     survives. A sanitizer that deleted the diagnostic would satisfy every assertion above while
//     destroying the thing the operator needs.
//
// THE MEASURING INSTRUMENT IS DELIBERATELY INDEPENDENT OF THE IMPLEMENTATION. `controlCodePoints`
// below re-spells the range rather than importing `board-dashboard.ts`'s own `CONTROL_CODE_POINTS`.
// Importing it would make every assertion here circular: a regression that widened the module's
// class would widen the measurement in the same commit and the cases would stay green. This is the
// one place in this file where a second spelling is the point rather than the defect.
//
// AND IT COUNTS CODE POINTS, NOT BYTES. The diagnostic's own em dash is UTF-8 `E2 80 94`, whose
// continuation bytes sit inside the C1 BYTE range. A raw-byte count would report a nonzero control
// tally for a line carrying no control character at all — an instrument that cannot return zero
// measures nothing.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * C0, DEL and C1 — the same range the module removes, spelled here independently on purpose, and
 * written with `\u` escapes so this source file carries no control byte of its own for
 * `scripts/check-nul-bytes.ts` to trip over.
 */
const CONTROL_CODE_POINT = /[\u0000-\u001F\u007F-\u009F]/;

/**
 * Every control code point in the text, EXCLUDING the newlines that separate diagnostic lines.
 *
 * The newline is the WRITER's structure rather than the content's: `warn` terminates each line it is
 * given, and a newline inside the text a caller passes is removed by the sanitizer like any other C0
 * code point, so a line boundary in the captured stream is always one the module put there.
 */
function controlCodePoints(text: string): readonly string[] {
  const hits: string[] = [];
  for (const ch of text) {
    if (ch === "\n") continue;
    if (CONTROL_CODE_POINT.test(ch)) {
      hits.push(`U+${(ch.codePointAt(0) as number).toString(16).toUpperCase().padStart(4, "0")}`);
    }
  }
  return hits;
}

const OSC_TITLE = `${ESC}]0;PWNED${BEL}`;
const CSI_CLEAR = `${ESC}[2J`;

/** A ticket whose FIRST line is not a `---` delimiter, so the grammar quotes it back on stderr. */
function plantFirstLine(dir: string, id: string, firstLine: string): void {
  writeFileSync(
    join(dir, "plans", "tickets", `${id}.md`),
    `${firstLine}\n---\nid: ${id}\ncolumn: Backlog\nstatus: ready\n---\n`,
    "utf8",
  );
}

// ── The AST census: one derivation, both channels, every reference classified ─────────────────────

/** The two channels this module writes to. The census takes one as a parameter, never a copy. */
type ChannelName = "stdout" | "stderr";

/** One collected write expression, with the two facts a pin is about. */
type ChannelWriteSite = {
  readonly line: number;
  readonly enclosingFunction: string;
  readonly text: string;
};

type ChannelCensus = {
  /** The `.write(...)` calls on the channel — the sites a pin counts and names. */
  readonly sites: readonly ChannelWriteSite[];
  /**
   * Every use of the channel this SYNTACTIC pass cannot name a write call for: `const { write } =
   * io.stdout`, `const w = process.stderr.write`, a computed member on the channel, another method
   * called on it, or a reflective invocation. Each is a route to the channel that the site
   * collector would never see, so each is collected and asserted absent rather than silently
   * producing a short site list. This is the CR-01 shape one register over — a namespace
   * destructure that contributed nothing to the set a guard pinned, and left that guard green over
   * a module that wrote and deleted files.
   */
  readonly opaque: readonly string[];
  /** Named non-`write` property reads on the channel: `process.stdout.isTTY`, `.columns`. */
  readonly reads: readonly string[];
  /**
   * The channel VALUE flowing somewhere this pass does not follow — into an object literal, an
   * argument, a return. `defaultIo`'s `stdout: process.stdout` is the one this module has.
   */
  readonly carried: readonly string[];
  /** Every syntactic reference to the channel. The DENOMINATOR the four buckets must sum to. */
  readonly references: number;
  /** Top-level statement count. Zero means the parse read nothing and every claim below is vacuous. */
  readonly statements: number;
  readonly parseErrors: readonly string[];
};

function parseModule(label: string, text: string): ts.SourceFile {
  return ts.createSourceFile(label, text, ts.ScriptTarget.Latest, true);
}

/** The nearest enclosing function-like node's name, or a named marker when there is none. */
function enclosingFunctionName(node: ts.Node): string {
  for (let cur: ts.Node | undefined = node.parent; cur !== undefined; cur = cur.parent) {
    if (ts.isFunctionDeclaration(cur)) return cur.name?.text ?? "<anonymous function>";
    if (ts.isMethodDeclaration(cur)) return ts.isIdentifier(cur.name) ? cur.name.text : "<method>";
    if (ts.isFunctionExpression(cur) || ts.isArrowFunction(cur)) {
      const owner = cur.parent;
      if (owner !== undefined && ts.isVariableDeclaration(owner) && ts.isIdentifier(owner.name)) {
        return owner.name.text;
      }
      if (owner !== undefined && ts.isPropertyAssignment(owner) && ts.isIdentifier(owner.name)) {
        return owner.name.text;
      }
      return "<anonymous function>";
    }
  }
  return "<module top level>";
}

/**
 * Classify every use of one output channel in a module.
 *
 * WHAT IT IS BOUNDED BY, STATED RATHER THAN LEFT TO BE DISCOVERED. The recurring finding across this
 * phase is a predicate converted from a hand-typed list into a derivation whose INPUT was left in a
 * narrow syntactic form. Each of the three sentences below is a boundary, and each has a
 * discrimination plant in the cases beneath.
 *
 *   • WHICH NODE KINDS IT VISITS. Every node in the tree, through `ts.forEachChild`. Two passes:
 *     the first collects `VariableDeclaration`s that give the channel a NAME, the second classifies
 *     every expression that evaluates to the channel. A name is how a write site stops looking like
 *     one, so the binding pass has to run first.
 *
 *   • WHICH SPELLINGS IT RECOGNIZES AS THE CHANNEL. A `PropertyAccessExpression` named for the
 *     channel (`io.stdout`, `process.stderr`), an `ElementAccessExpression` with a string-literal
 *     key spelling it (`io["stdout"]`), and any identifier bound to one of those — directly
 *     (`const out = io.stdout`) or through an object binding pattern (`const { stdout } = io`,
 *     `const { stdout: out } = io`). A parenthesized, `as`-cast or non-null-asserted receiver is
 *     UNWRAPPED before classification, so `(io.stdout).write(...)` is the same site as
 *     `io.stdout.write(...)` rather than a free bypass.
 *
 *   • WHAT IT DOES WITH A CHANNEL IT CANNOT FOLLOW. It never stays silent. Every reference lands in
 *     exactly one of four buckets — `sites`, `opaque`, `reads`, `carried` — and `references` counts
 *     the references independently of the buckets, so the totality case can compare the two. A
 *     detached `write` capability, a computed member, another method call on the channel and a
 *     reflective `write.call` are all `opaque`, which a pin asserts empty. A shape nobody
 *     anticipated lands in `carried` and is visible, rather than being absent from a short list.
 *
 * THE ANALYZER TAKES A PARSED SOURCE FILE rather than a path, so a discrimination probe can run it
 * over a constructed module without touching the disk, and so it cannot be handed its own file by
 * accident. The CHANNEL is a parameter rather than a second function: a second census over one
 * property is the second-authority shape this phase has already paid for twice, and the two arms
 * would then be free to drift apart in exactly the way CR-02 found.
 */
function channelWriteCensus(source: ts.SourceFile, channel: ChannelName): ChannelCensus {
  const parseErrors = (
    (source as unknown as { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
  ).map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "));

  const bindings = new Set<string>();
  const opaque: string[] = [];
  const reads: string[] = [];
  const carried: string[] = [];
  const sites: ChannelWriteSite[] = [];
  let references = 0;

  /** Strip the wrappers that change nothing about which value the expression denotes. */
  const unwrap = (node: ts.Node): ts.Node => {
    let cur = node;
    while (
      ts.isParenthesizedExpression(cur) ||
      ts.isAsExpression(cur) ||
      ts.isNonNullExpression(cur)
    ) {
      cur = cur.expression;
    }
    return cur;
  };

  const namesChannelMember = (node: ts.Node): boolean => {
    const inner = unwrap(node);
    if (ts.isPropertyAccessExpression(inner)) return inner.name.text === channel;
    if (ts.isElementAccessExpression(inner)) {
      const key = inner.argumentExpression;
      return ts.isStringLiteralLike(key) && key.text === channel;
    }
    return false;
  };

  const isChannel = (node: ts.Node): boolean => {
    const inner = unwrap(node);
    return namesChannelMember(inner) || (ts.isIdentifier(inner) && bindings.has(inner.text));
  };

  const record = (node: ts.CallExpression): void => {
    sites.push({
      line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      enclosingFunction: enclosingFunctionName(node),
      text: node.getText().replace(/\s+/g, " ").slice(0, 120),
    });
  };

  // PASS ONE — the bindings. A channel that has been given a name is still the channel.
  const collectBindings = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined) {
      const init = unwrap(node.initializer);
      if (ts.isIdentifier(node.name) && isChannel(init)) bindings.add(node.name.text);
      if (ts.isObjectBindingPattern(node.name)) {
        for (const element of node.name.elements) {
          const key = element.propertyName ?? element.name;
          const keyText = ts.isIdentifier(key) || ts.isStringLiteralLike(key) ? key.text : null;
          if (keyText === channel && ts.isIdentifier(element.name)) bindings.add(element.name.text);
        }
      }
    }
    ts.forEachChild(node, collectBindings);
  };
  collectBindings(source);

  /** Is `access` in callee position of a call — the thing being invoked rather than an argument? */
  const calledAs = (access: ts.Node): ts.CallExpression | null => {
    let cur: ts.Node = access;
    while (cur.parent !== undefined && ts.isParenthesizedExpression(cur.parent)) cur = cur.parent;
    const parent = cur.parent;
    if (parent !== undefined && ts.isCallExpression(parent) && parent.expression === cur) {
      return parent;
    }
    return null;
  };

  // PASS TWO — classify every reference. Four buckets, and `references` counted beside them.
  const classify = (node: ts.Node): void => {
    // A reference is an expression DENOTING the channel. The wrapper forms are unwrapped above, so
    // they are not counted twice: only the innermost node is classified.
    const isRef =
      (ts.isPropertyAccessExpression(node) && node.name.text === channel) ||
      (ts.isElementAccessExpression(node) &&
        ts.isStringLiteralLike(node.argumentExpression) &&
        node.argumentExpression.text === channel) ||
      (ts.isIdentifier(node) && bindings.has(node.text) && !ts.isBindingElement(node.parent));

    if (isRef) {
      references += 1;

      // The use is whatever encloses the reference once the transparent wrappers are peeled off.
      let ref: ts.Node = node;
      while (ref.parent !== undefined && ts.isParenthesizedExpression(ref.parent)) ref = ref.parent;
      const parent = ref.parent;
      const text = (parent ?? ref).getText().replace(/\s+/g, " ").slice(0, 120);

      let member: string | null = null;
      let computed = false;
      let access: ts.Node | null = null;
      if (parent !== undefined && ts.isPropertyAccessExpression(parent) && parent.expression === ref) {
        member = parent.name.text;
        access = parent;
      } else if (
        parent !== undefined &&
        ts.isElementAccessExpression(parent) &&
        parent.expression === ref
      ) {
        access = parent;
        const key = parent.argumentExpression;
        if (ts.isStringLiteralLike(key)) member = key.text;
        else computed = true;
      }

      if (computed) {
        // A computed member on the channel: this pass cannot say which method it reaches.
        opaque.push(text);
      } else if (member === "write" && access !== null) {
        const call = calledAs(access);
        // A `write` that is reached and not called is a capability detached from any call site.
        if (call !== null) record(call);
        else opaque.push(text);
      } else if (member !== null && access !== null) {
        // Another named member. Called, it is another way out of the process; read, it is inert.
        if (calledAs(access) !== null) opaque.push(text);
        else reads.push(text);
      } else if (
        parent !== undefined &&
        ts.isVariableDeclaration(parent) &&
        parent.initializer === ref &&
        ts.isObjectBindingPattern(parent.name)
      ) {
        // `const { write } = io.stderr` — the CR-01 shape: capabilities taken off the channel by a
        // destructure, each one detached from any call this pass can see.
        opaque.push(text);
      } else if (
        parent !== undefined &&
        (ts.isVariableDeclaration(parent) ||
          ts.isPropertyAssignment(parent) ||
          ts.isBindingElement(parent))
      ) {
        carried.push(text);
      } else {
        // Anything else: the channel flows into an argument, a return, a spread, a template. The
        // pass does not follow it, and says so rather than dropping it.
        carried.push(text);
      }
    }
    ts.forEachChild(node, classify);
  };
  classify(source);

  return {
    sites,
    opaque,
    reads,
    carried,
    references,
    statements: source.statements.length,
    parseErrors,
  };
}

const DASHBOARD_TS = join(ROOT, "scripts", "board-dashboard.ts");

/**
 * How many expressions in `scripts/board-dashboard.ts` write to stderr.
 *
 * ONE IS A DECISION, and it is the decision CR-05 cost this phase a verification round to reach.
 * Before it there were six, each formatting its own line, and the sanitizer the module's header
 * described was applied at none of them. A second write site is a second authority for "what may
 * reach the operator's terminal", and this repository has paid five gap-closure rounds to learn that
 * two authorities for one predicate disagree. Raising this number is that decision being RECORDED —
 * here, and in the phase context — never a constant being bumped to make a suite green.
 */
const STDERR_WRITE_SITE_COUNT = 1;

/** The function the one surviving site must live in. A count of one elsewhere is still a bypass. */
const STDERR_CHOKEPOINT = "warn";

describe("board-dashboard — the stderr write-site census is derived from the module (CR-05)", () => {
  it("PREMISE: the parse read the module and reported no syntactic error", () => {
    const census = channelWriteCensus(
      parseModule(DASHBOARD_TS, readFileSync(DASHBOARD_TS, "utf8")),
      "stderr",
    );
    expect(census.parseErrors).toEqual([]);
    expect(
      census.statements,
      "PREMISE: the AST walk over scripts/board-dashboard.ts found (almost) no top-level " +
        "statements, so every claim below would be a claim about an empty parse",
    ).toBeGreaterThanOrEqual(10);
  });

  it("PREMISE: the collector finds every spelling, and refuses the routes it cannot name", () => {
    // The discrimination. Without it, "exactly one site" is equally true of a collector that can
    // never say yes — and a census that cannot fail proves nothing about the file it walked.
    const census = channelWriteCensus(
      parseModule(
        "probe.ts",
        [
          "function a(io) { io.stderr.write('x'); }",
          "function b() { process.stderr.write('y'); }",
          "function c(io) { const err = io.stderr; err.write('z'); }",
          "function d(io) { const { stderr } = io; stderr.write('w'); }",
          "function e(io) { io.stdout.write('not stderr'); }",
        ].join("\n"),
      ),
      "stderr",
    );
    expect(
      census.sites.map((s) => s.enclosingFunction),
      "the member spelling, the global-process spelling, the aliased channel and the destructured " +
        "channel are all write sites; the stdout call is not",
    ).toEqual(["a", "b", "c", "d"]);

    const opaqueProbe = channelWriteCensus(
      parseModule(
        "opaque.ts",
        [
          "function f(io) { const { write } = io.stderr; write('x'); }",
          "function g() { const w = process.stderr.write; w('y'); }",
          "function h(io, k) { io.stderr[k]('z'); }",
        ].join("\n"),
      ),
      "stderr",
    );
    expect(
      opaqueProbe.opaque.length,
      "a detached write capability and a computed member must be REFUSED rather than silently " +
        "producing a short site list — the CR-01 shape, one register over",
    ).toBe(3);
  });

  it("pins the stderr write-site count two-sided at one, inside `warn`", () => {
    const census = channelWriteCensus(
      parseModule(DASHBOARD_TS, readFileSync(DASHBOARD_TS, "utf8")),
      "stderr",
    );
    // Printed on every run: the number this pin is about is visible without reading the assertion.
    console.log(
      `[32-13] stderr write sites in scripts/board-dashboard.ts: ${census.sites.length} — ` +
        census.sites.map((s) => `${s.enclosingFunction}:${s.line}`).join(", "),
    );

    expect(
      census.opaque,
      "the module acquired a stderr write capability by a route this census cannot name a call " +
        "site for; the chokepoint claim below would be a claim about the sites it happened to see",
    ).toEqual([]);

    expect(
      census.sites.map((s) => `${s.enclosingFunction}:${s.line} ${s.text}`),
      "scripts/board-dashboard.ts writes to stderr from more than one place. Every diagnostic this " +
        "module emits must pass through `warn`, because stderr is the same terminal emulator as " +
        "stdout on an interactive run and it is the channel carrying file content and raw argv " +
        "(CR-05). A second write site is a second authority and a decision somebody records",
    ).toHaveLength(STDERR_WRITE_SITE_COUNT);

    expect(
      census.sites.map((s) => s.enclosingFunction),
      "a count of one in the WRONG function is still a bypass: the surviving site must be the " +
        "sanitizing chokepoint itself",
    ).toEqual([STDERR_CHOKEPOINT]);
  });
});

describe("board-dashboard — content and argv reach stderr INERT (CR-05, T-32-06)", () => {
  it("strips an OSC title and a screen-clear planted in a ticket's first line, keeping the refusal", () => {
    withFixtureCopy((dir) => {
      plantFirstLine(dir, "ABC-900", `${OSC_TITLE}${CSI_CLEAR}not a delimiter`);
      const r = spawnDashboard([dir, "--once", "--json"]);
      expect(r.code).toBe(0);
      expect(
        r.err,
        "PREMISE: the planted ticket produced no refusal at all, so the emptiness measured below " +
          "would be the emptiness of a run that had nothing to sanitize",
      ).toContain("no-opening-delimiter");
      expect(r.err, "the refusal must still NAME the file a human has to go and fix").toContain(
        "ABC-900.md",
      );
      expect(
        controlCodePoints(r.err),
        "a control code point read out of a ticket file reached the operator's terminal",
      ).toEqual([]);
      expect(
        () => JSON.parse(r.out) as unknown,
        "the JSON document on stdout is unaffected: it was never the live channel",
      ).not.toThrow();
    });
  });

  it("strips an OSC sequence carried in the repoRoot argument, keeping the refusal", () => {
    const r = spawnDashboard([`no${OSC_TITLE}such`, "--once"]);
    expect(r.code).toBe(2);
    expect(
      r.err,
      "PREMISE: the bad root produced no refusal line, so there is nothing to have sanitized",
    ).toContain("does not resolve");
    expect(
      controlCodePoints(r.err),
      "a control code point carried in argv reached the operator's terminal",
    ).toEqual([]);
  });

  it("POSITIVE CONTROL: ordinary non-ASCII text survives to stderr unchanged", () => {
    withFixtureCopy((dir) => {
      // An em dash, an accented letter and an emoji. `sanitizeCell` removes control code points; a
      // sanitizer that also removed legible ones would pass every assertion above by destroying the
      // diagnostic the operator needs.
      plantFirstLine(dir, "ABC-901", "Ticket — café \u{1F3AF} not a delimiter");
      const r = spawnDashboard([dir, "--once", "--json"]);
      expect(r.code).toBe(0);
      expect(r.err).toContain("no-opening-delimiter");
      expect(r.err, "an em dash is not a control character").toContain("—");
      expect(r.err, "an accented letter is not a control character").toContain("café");
      expect(r.err, "an emoji is not a control character").toContain("\u{1F3AF}");
      expect(controlCodePoints(r.err)).toEqual([]);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-13 TASK 2 — WR-06: THE JSON FRAMING PROSE, BOUND TO A MEASURED LINE COUNT.
//
// WHAT THE FINDING WAS. Three sentences described the `--json` contract — the file header, the
// `USAGE` block and `emit`'s docblock — and two of them promised "exactly one JSON document on
// stdout and nothing else". With `--watch --json` the program emits one document per LINE. A
// consumer that read the help text and parsed the whole stream got a parse error on the second
// frame, and that failure reads as a tool defect rather than as a documentation defect. D-18's
// BEHAVIOUR was and remains correct; the prose was what was wrong.
//
// WHY THE CASES BELOW AND NOT JUST THE EDIT. A corrected sentence is worth exactly what the case
// behind it is worth. Three things are measured and they are different questions:
//
//   • THE COUNT IN EACH MODE — a spawned `--once --json` emits one non-empty line and the whole
//     stream parses; a spawned `--watch --json` emits more than one, every line parses on its own,
//     and the WHOLE STREAM DOES NOT. That last assertion is the one that would have caught the
//     defect, because it is the exact thing the old sentence promised.
//   • THE HELP TEXT A USER ACTUALLY READS — the `--help` output is spawned and searched for the
//     form's name, so the printed text and the measured contract cannot drift apart without one of
//     them going red.
//   • THE THREE SENTENCES AGREEING — the module's own source is scanned. Three sentences that must
//     agree are three chances to disagree, so the site count is derived from the file and the
//     superseded wording is asserted absent rather than assumed gone.
//
// THE WATCH-MODE LINE COUNT IS MEASURED BY THE NDJSON CASE ABOVE, which plan 32-07 already built
// with a bounded child and a deterministic kill. It is EXTENDED here with the whole-stream
// assertion rather than duplicated: a second live-loop child would add roughly two and a half
// seconds of wall time to measure a contract already under measurement, and the plan's own warning
// about unbounded watch cases is a warning about exactly that cost.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * The per-line contract, as it is stated in `scripts/board-dashboard.ts`.
 *
 * Matched case-insensitively because the header states it in capitals and `USAGE` in lower case —
 * one contract in two registers is still one contract, and a pattern that insisted on a single
 * casing would be measuring typography.
 */
const PER_LINE_CONTRACT = /one complete (json )?document per line/gi;

/** The wording WR-06 found to be false. It describes a program that does not exist under `--watch`. */
const SUPERSEDED_FRAMING = /exactly one JSON document/gi;

/**
 * How many places in the module state the `--json` framing contract.
 *
 * THREE IS A DECISION, and it is the shape of the WR-06 defect: the file header, the `USAGE` block
 * and `emit`'s docblock each describe the same rule to a different reader, and for as long as they
 * were written independently two of the three were false. They are kept as three sentences because
 * they are read in three places a reader arrives at separately — but the count is derived from the
 * file, so a fourth sentence is a fourth chance to disagree that somebody RECORDS rather than a
 * constant somebody bumps.
 */
const JSON_FRAMING_PROSE_SITES = 3;

describe("board-dashboard — the JSON framing prose describes the program (WR-06)", () => {
  it("states the per-line contract at every site, and nowhere promises a single document", () => {
    const source = readFileSync(DASHBOARD_TS, "utf8");
    const stated = source.match(PER_LINE_CONTRACT) ?? [];
    const superseded = source.match(SUPERSEDED_FRAMING) ?? [];
    console.log(
      `[32-13] --json framing prose sites in scripts/board-dashboard.ts: ${stated.length}; ` +
        `superseded "exactly one JSON document" occurrences: ${superseded.length}`,
    );

    expect(
      stated.length,
      "the header, the USAGE block and emit's docblock must each state the one-document-per-line " +
        "contract; a site that states it in its own words is a site free to be wrong in its own " +
        "words, which is what WR-06 found",
    ).toBe(JSON_FRAMING_PROSE_SITES);

    expect(
      superseded,
      'the unqualified "exactly one JSON document" promise is false under --watch: a consumer ' +
        "that follows the help text and parses the whole stream gets a parse error on frame two",
    ).toEqual([]);
  });

  it("prints the form's name in the help text a user actually reads", () => {
    const r = spawnDashboard(["--help"]);
    expect(r.code).toBe(0);
    expect(
      r.out,
      "the printed help and the contract the cases below measure must not be able to drift apart " +
        "without one of them going red",
    ).toContain("JSON Lines");
    expect(r.out).toContain("exactly one frame unless --watch is given");
  });

  it("emits exactly ONE line for --once --json, and the whole stream parses as one document", () => {
    withFixtureCopy((dir) => {
      const r = spawnDashboard([dir, "--once", "--json"]);
      expect(r.code).toBe(0);
      const lines = r.out.split("\n").filter((l) => l !== "");
      expect(
        lines.length,
        "exactly one frame unless --watch is given — this is the half of the contract that lets a " +
          "consumer reading a single frame parse the whole stream",
      ).toBe(1);
      expect(() => JSON.parse(r.out) as unknown).not.toThrow();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-18 TASK 1 — CR-02: THE `--json` DOCUMENT IS SANITIZED AT ONE CHOKEPOINT.
//
// WHAT THE FINDING WAS. Plan 32-13 closed CR-05 by routing every stderr diagnostic through `warn`
// and rewrote the module header to claim that every string reaching EITHER CHANNEL is sanitized
// first. That sentence was false in the direction the original finding did not cover: `emit`'s JSON
// arm wrote `JSON.stringify(withWatch)` straight to stdout, `JSON.stringify` escapes the C0 range
// and NOT the C1 range, and U+009B (the 8-bit CSI introducer) and U+009D (the 8-bit OSC introducer)
// — both of which xterm, iTerm2 and the VTE family act on in UTF-8 mode — travelled from a ticket
// title into the published document verbatim. Independently reproduced against the committed `.js`:
// two C1 code points in captured stdout.
//
// WHY THE KEYS AND NOT ONLY THE VALUES. The chokepoint sanitizes the SERIALIZED TEXT rather than
// walking the value tree, because the document's KEYS are content-derived too: the dial's
// per-column limits are keyed by column name, and a column name is a line an agent wrote into
// `plans/board.md`. A rule that only visits values answers for half the document.
//
// WHY BOTH ARMS. The plain frame path was already clean — its cells and its header go through
// `sanitizeCell` on the way out. That is exactly why it needs a case: a proof that runs only the
// arm that was broken cannot tell a fix from a regression in its sibling.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** The 8-bit CSI introducer, BUILT rather than typed. A terminal in UTF-8 mode acts on it. */
const C1_CSI = String.fromCharCode(0x9b);

/** The 8-bit OSC introducer. The one that retitles the window. */
const C1_OSC = String.fromCharCode(0x9d);

/** Emit one frame through a capturing io and hand back exactly what reached each channel. */
function emitOnce(result: SnapshotResult, json: boolean, isTty = false): Captured {
  const io = captureIo(isTty, 200);
  const options: Options = {
    repoRoot: "/repo",
    once: true,
    json,
    watch: false,
    intervalMs: null,
  };
  const loop = createLoop(options, io, stubDeps(result));
  loop.seed(result);
  loop.emit(result);
  return { ...io.seen, code: 0 };
}

/** A result whose ROW TITLE carries both 8-bit introducers, with legible text on either side. */
function resultWithPlantedTitle(): SnapshotResult {
  return makeResult({
    board: boardModel({
      columns: [
        boardColumn({
          name: "Backlog",
          rows: [boardRow("ABC-101", `Something${C1_CSI}in the${C1_OSC}backlog`)],
        }),
      ],
    }),
  });
}

describe("board-dashboard — the --json document reaches stdout INERT (CR-02, T-32-18-01)", () => {
  it("removes the 8-bit introducers planted in a ROW TITLE, keeping the rest of the title", () => {
    const seen = emitOnce(resultWithPlantedTitle(), true);

    expect(
      controlCodePoints(seen.out),
      "a control code point read out of board content reached the operator's terminal through " +
        "the --json document: JSON.stringify escapes C0 and not C1, so the introducers travel " +
        "verbatim (CR-02)",
    ).toEqual([]);

    const parsed = JSON.parse(seen.out) as {
      snapshot: { schemaVersion: number; board: { columns: { rows: { title: string }[] }[] } };
    };
    expect(parsed.snapshot.schemaVersion, "the document still round-trips and keeps its shape").toBe(
      SCHEMA_VERSION,
    );
    expect(
      parsed.snapshot.board.columns[0]?.rows[0]?.title,
      "the sanitizer removed the control code points and NOT the content: over-removal would " +
        "satisfy every assertion above by destroying the thing the consumer asked for",
    ).toBe("Somethingin thebacklog");
  });

  it("removes an introducer planted in a content-derived JSON KEY, not only in a value", () => {
    const seen = emitOnce(
      makeResult({ wipLimits: { [`Rea${C1_CSI}dy`]: 5 } }),
      true,
    );

    expect(
      controlCodePoints(seen.out),
      "the dial's per-column limits are keyed by COLUMN NAME, which is a line an agent wrote: a " +
        "sanitizer that only walked values would answer for half the document",
    ).toEqual([]);
    expect(() => JSON.parse(seen.out) as unknown).not.toThrow();
  });

  it("PREMISE: the planted introducers are actually in the result the emitter was handed", () => {
    // Without this, "zero control code points on stdout" is equally true of a case whose plant
    // never reached the emitter at all — an instrument measuring its own empty input.
    const planted = resultWithPlantedTitle();
    const raw = JSON.stringify(planted);
    expect(
      [...new Set(controlCodePoints(raw))].sort(),
      "PREMISE: the constructed result carries no C1 code point, so the emptiness measured above " +
        "would be the emptiness of a run that had nothing to sanitize",
    ).toEqual(["U+009B", "U+009D"]);
    expect(
      controlCodePoints(raw).length,
      "PREMISE: the title is serialized on both the `board` field and its `sources.board.value` " +
        "twin, so the unsanitized document carries each introducer more than once",
    ).toBeGreaterThan(2);
  });

  it("keeps the plain frame free of every control code point on the non-TTY path", () => {
    const seen = emitOnce(resultWithPlantedTitle(), false, false);
    expect(
      controlCodePoints(seen.out),
      "the frame path and the document path are two arms of one claim; a proof that runs only " +
        "the arm that was fixed is the shape this round exists to stop",
    ).toEqual([]);
    expect(seen.out, "a redirected run receives plain text with no escape byte").not.toContain(ESC);
  });

  it("still carries the clear-screen sequence on the TTY path — the frame is NOT over-sanitized", () => {
    const seen = emitOnce(resultWithPlantedTitle(), false, true);
    expect(
      seen.out,
      "sanitizing the whole frame would strip the named style escapes and break the live " +
        "renderer (T-32-18-04); what the chokepoint owns is the DOCUMENT, not the frame",
    ).toContain(CLEAR_SCREEN);
  });
});

describe("board-dashboard — each bounds number states its own unit (WR-05)", () => {
  it("renders the board size in bytes and the longest line in characters, distinguishably", () => {
    // The two numbers differ, so a formatter applied to the wrong one cannot coincidentally agree.
    const result = makeResult({
      board: boardModel({ bounds: { boardBytes: 389_120, longestLine: 34_494, exceeded: true } }),
    });
    const header = frameLines(renderFrame(result, 300))[0] as string;

    expect(
      header,
      "the board size is UTF-8 BYTES (agent-factory/contracts/board.md § Bounds), so the byte " +
        "formatter is the right one for it",
    ).toContain("380 KB");
    expect(
      header,
      "`longestLine` is UTF-16 CODE UNITS (board-model.ts, and the contract's Bounds table). " +
        'Rendering it as "34 KB" states the wrong unit — the contract says each number states ' +
        "its own (WR-05)",
    ).toContain("longest line 34,494 chars");
    expect(
      header,
      "a code-unit count rendered through the byte formatter is the defect itself",
    ).not.toContain("longest line 34 KB");
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-18 TASK 2 — ONE CENSUS, BOTH CHANNELS, PINNED TWO-SIDED (CR-02, T-32-18-03).
//
// WHAT THE FINDING WAS. Plan 32-13 derived the write-site rule from the module's own syntax tree and
// pinned it — on stderr. It asked nothing at all about stdout, so the rule was derived on the arm
// that had been fixed and narrated on the arm that had not. A fourth stdout write was free.
//
// WHY A PARAMETER AND NOT A SECOND FUNCTION. A second census over one property is the
// second-authority shape this phase has already paid for twice. The binding tracking, the
// classification and the totality check serve both channels from one implementation, so the two
// arms cannot drift apart.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * How many expressions in `scripts/board-dashboard.ts` write to stdout.
 *
 * THREE IS A DECISION. `run`'s usage write, `emit`'s frame write and `writeDocument`'s document
 * write are three because they carry three different things: a constant the program owns, a frame
 * already sanitized cell by cell, and a serialized document sanitized as a whole. A FOURTH stdout
 * write site is a fourth answer to "what may reach the operator's terminal", and CR-02 is what one
 * unexamined answer cost. Raising this number is that decision being RECORDED, never a constant
 * bumped to make a suite green.
 */
const STDOUT_WRITE_SITE_COUNT = 3;

/** The three functions the stdout sites must live in, in the order the module declares them. */
const STDOUT_WRITERS = ["writeDocument", "emit", "run"] as const;

describe("board-dashboard — the stdout write-site census is derived from the module (CR-02)", () => {
  it("PREMISE: the collector finds every stdout spelling, and refuses the routes it cannot follow", () => {
    const found = channelWriteCensus(
      parseModule(
        "stdout-probe.ts",
        [
          "function a(io) { io.stdout.write('x'); }",
          "function b() { process.stdout.write('y'); }",
          "function c(io) { const out = io.stdout; out.write('z'); }",
          "function d(io) { const { stdout } = io; stdout.write('w'); }",
          "function e(io) { (io.stdout).write('parenthesized'); }",
          "function f(io) { io.stderr.write('not stdout'); }",
        ].join("\n"),
      ),
      "stdout",
    );
    expect(
      found.sites.map((s) => s.enclosingFunction),
      "the member spelling, the global-process spelling, the aliased channel, the destructured " +
        "channel and a parenthesized receiver are all write sites; the stderr call is not",
    ).toEqual(["a", "b", "c", "d", "e"]);

    const unfollowable = channelWriteCensus(
      parseModule(
        "stdout-opaque.ts",
        [
          "function f(io) { const { write } = io.stdout; write('x'); }",
          "function g() { const w = process.stdout.write; w('y'); }",
          "function h(io, k) { io.stdout[k]('z'); }",
          "function i(io) { io.stdout.end('done'); }",
          "function j(io) { io.stdout.write.call(io.stdout, 'x'); }",
        ].join("\n"),
      ),
      "stdout",
    );
    expect(
      unfollowable.opaque.length,
      "a detached write capability, a computed member, another method call on the channel and a " +
        "reflective invocation must each be REFUSED rather than silently producing a short site " +
        "list — a census that returns a short list is a census that says nothing",
    ).toBeGreaterThanOrEqual(5);
    expect(
      unfollowable.sites,
      "none of the five is a call site this pass can name, so none may be counted as one",
    ).toEqual([]);
  });

  it("PREMISE: a module with no stdout write at all yields zero sites", () => {
    // Without this the pin is equally true of a census counting something else entirely.
    const empty = channelWriteCensus(
      parseModule(
        "no-stdout.ts",
        [
          "function a(io) { io.stderr.write('x'); }",
          "function b(io) { const n = io.columns; return n; }",
        ].join("\n"),
      ),
      "stdout",
    );
    expect(empty.sites, "the census counted a write to a channel it was not asked about").toEqual(
      [],
    );
    expect(empty.opaque).toEqual([]);
  });

  it("TOTALITY: every syntactic reference to the channel lands in exactly one named bucket", () => {
    // The recurring finding in this phase is a derived predicate whose INPUT was left in a narrow
    // syntactic form. The defence is not another arm: it is a DENOMINATOR. Every occurrence of the
    // channel is classified, the buckets are summed, and the sum is compared with the count of
    // references the same pass found — so a shape nobody anticipated lands in `opaque` or in
    // `carried` and is visible, rather than being silently absent from a short list.
    const census = channelWriteCensus(
      parseModule(DASHBOARD_TS, readFileSync(DASHBOARD_TS, "utf8")),
      "stdout",
    );
    expect(
      census.references,
      "PREMISE: the pass found no reference to the channel at all, so every bucket below is empty " +
        "for the wrong reason",
    ).toBeGreaterThan(0);
    expect(
      census.sites.length + census.opaque.length + census.reads.length + census.carried.length,
      "a channel reference that fell out of every bucket is a route this census cannot answer for",
    ).toBe(census.references);
  });

  it("pins the stdout write-site count two-sided at three, in the three functions that own them", () => {
    const census = channelWriteCensus(
      parseModule(DASHBOARD_TS, readFileSync(DASHBOARD_TS, "utf8")),
      "stdout",
    );
    console.log(
      `[32-18] stdout write sites in scripts/board-dashboard.ts: ${census.sites.length} — ` +
        census.sites.map((s) => `${s.enclosingFunction}:${s.line}`).join(", "),
    );

    expect(
      census.opaque,
      "the module acquired a stdout write capability by a route this census cannot name a call " +
        "site for; the pin below would be a claim about the sites it happened to see",
    ).toEqual([]);

    expect(
      census.sites.map((s) => `${s.enclosingFunction}:${s.line} ${s.text}`),
      "scripts/board-dashboard.ts writes to stdout from more than three places. The usage block, " +
        "the frame and the serialized document are three because they carry three different " +
        "things; a FOURTH is a fourth answer to what may reach the operator's terminal, and CR-02 " +
        "is what one unexamined answer cost. This is a decision somebody records, never a bumped " +
        "constant",
    ).toHaveLength(STDOUT_WRITE_SITE_COUNT);

    expect(
      census.sites.map((s) => s.enclosingFunction),
      "a count of three in the WRONG functions is still a bypass: the three sites are the usage " +
        "writer, the frame writer and the document writer",
    ).toEqual([...STDOUT_WRITERS]);
  });

  it("keeps the frame write OUTSIDE the document chokepoint — it is not over-sanitized (T-32-18-04)", () => {
    const census = channelWriteCensus(
      parseModule(DASHBOARD_TS, readFileSync(DASHBOARD_TS, "utf8")),
      "stdout",
    );
    const frame = census.sites.filter((s) => s.enclosingFunction === "emit");
    expect(
      frame,
      "PREMISE: no stdout write was found inside `emit`, so the claim below is about nothing",
    ).toHaveLength(1);
    expect(
      frame[0]?.enclosingFunction,
      "the frame carries the named style escapes on the TTY path BY DESIGN. Routing it through " +
        "`writeDocument` would strip the clear-screen sequence and break the live renderer; the " +
        "behavioural pair above measures that the escapes survive on a TTY and are absent on a pipe",
    ).not.toBe("writeDocument");
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-18 TASK 3 — THE PROOF FROM A SPAWNED PROCESS, AGAINST THE ARTIFACT THAT SHIPS.
//
// WHAT THIS HALF DECIDES THAT TASK 1's CASES CANNOT. Task 1 drives `emit` in process, which proves
// the chokepoint is applied. It cannot prove what a CI consumer or an operator's terminal receives,
// because that is a property of the COMPILED artifact after a build: `scripts/board-dashboard.js` is
// what `node` runs, and the verification round that found CR-02 measured exactly that file. A case
// that measured a `.ts` through a loader would be measuring a program nobody installs.
//
// BOTH ARMS, NOT ONE. The `--json` document is the arm that was broken; the plain frame is the arm
// that was already clean. A proof that runs only the arm that was fixed cannot tell a fix from a
// regression in its sibling, and that is the shape this round exists to stop.
//
// THE COUNTING INSTRUMENT IS `controlCodePoints` — re-spelled above independently of the module's
// own class on purpose, and counting CODE POINTS rather than bytes, so the em dash in a diagnostic
// cannot be miscounted as a control character.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * A fixture copy whose board row AND ticket frontmatter title both carry the 8-bit introducers.
 *
 * BOTH, because the two travel by different routes: the row title is read out of `plans/board.md`
 * by the board grammar, and the frontmatter title out of `plans/tickets/ABC-101.md` by the ticket
 * grammar. Neither grammar refuses a C1 code point — the ticket control class is C0 plus DEL — so
 * both reach the join, and the document is where they meet.
 */
function withPlantedC1Copy(body: (dir: string) => void): void {
  withFixtureCopy((dir) => {
    const planted = `Something${C1_CSI}in the${C1_OSC}backlog`;
    const boardPath = join(dir, "plans", "board.md");
    const ticketPath = join(dir, "plans", "tickets", "ABC-101.md");
    writeFileSync(
      boardPath,
      readFileSync(boardPath, "utf8").replace("Something in the backlog", planted),
      "utf8",
    );
    writeFileSync(
      ticketPath,
      readFileSync(ticketPath, "utf8").replace(
        "title: Something in the backlog",
        `title: ${planted}`,
      ),
      "utf8",
    );
    body(dir);
  });
}

describe("board-dashboard — a planted C1 reaches NEITHER channel of the shipped artifact (CR-02)", () => {
  it("PREMISE: names the artifact it measures, and that artifact carries the chokepoint", () => {
    // Which file was measured is part of the result. A transcript that does not name its artifact
    // is a transcript about an unknown program.
    const compiled = readFileSync(DASHBOARD_JS, "utf8");
    expect(compiled.length, `${DASHBOARD_JS} is absent or empty`).toBeGreaterThan(0);
    expect(
      compiled,
      "the committed .js predates the chokepoint, so every capture below would measure the " +
        "program CR-02 was reported against rather than the one this plan ships",
    ).toContain("writeDocument");
  });

  it("PREMISE: the planted introducers survive the grammars and reach the document's input", () => {
    withPlantedC1Copy((dir) => {
      const board = readFileSync(join(dir, "plans", "board.md"), "utf8");
      const ticket = readFileSync(join(dir, "plans", "tickets", "ABC-101.md"), "utf8");
      expect(
        [...new Set([...controlCodePoints(board), ...controlCodePoints(ticket)])].sort(),
        "PREMISE: the plant did not land in the scratch tree, so the zero counts below would be " +
          "the zeros of a run that had nothing to sanitize",
      ).toEqual(["U+009B", "U+009D"]);
    });
  });

  it("removes them from the --json document, keeping the title's remaining text", () => {
    withPlantedC1Copy((dir) => {
      const r = spawnDashboard([dir, "--once", "--json"]);
      expect(r.code, "a planted control code point must not change the exit contract").toBe(0);

      const lines = r.out.split("\n").filter((l) => l !== "");
      expect(lines.length, "one complete document per line, one frame for --once").toBe(1);
      const parsed = JSON.parse(r.out) as { snapshot: { schemaVersion: number } };
      expect(parsed.snapshot.schemaVersion).toBe(SCHEMA_VERSION);

      expect(
        controlCodePoints(r.out),
        "the 8-bit CSI and OSC introducers travelled from board content into the published " +
          "document, which a terminal acts on (CR-02)",
      ).toEqual([]);
      expect(
        controlCodePoints(r.err),
        "the diagnostic channel must stay inert too — it is the same emulator",
      ).toEqual([]);

      expect(
        r.out,
        "the sanitizer removed the control code points and NOT the content: over-removal would " +
          "satisfy every assertion above by destroying what the consumer asked for",
      ).toContain("Somethingin thebacklog");
    });
  });

  it("removes them from the PLAIN FRAME too, on both channels", () => {
    withPlantedC1Copy((dir) => {
      const r = spawnDashboard([dir, "--once"]);
      expect(r.code).toBe(0);
      expect(
        controlCodePoints(r.out),
        "the frame path and the document path are two arms of ONE claim; measuring only the arm " +
          "that was fixed is how a sibling regression ships",
      ).toEqual([]);
      expect(controlCodePoints(r.err)).toEqual([]);
      expect(
        r.out,
        "PREMISE: the frame did not render the planted row at all, so the zero above says nothing",
      ).toContain("ABC-101");
    });
  });
});
