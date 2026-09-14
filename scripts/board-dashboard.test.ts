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
import { appendFileSync, cpSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
}): SnapshotResult {
  const board = partial.board === undefined ? boardModel() : partial.board;
  const config = { mode: partial.mode ?? "lean", idPrefix: "ABC", wipLimits: {} };
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
    schemaVersion: 1,
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

  it("adds a LARGE BOARD marker carrying the byte size and the longest line, both human-rounded (D-20)", () => {
    const result = makeResult({
      board: boardModel({ bounds: { boardBytes: 389_120, longestLine: 34_494, exceeded: true } }),
    });
    const header = frameLines(renderFrame(result, 200))[0] as string;
    expect(header).toContain("LARGE BOARD (380 KB, longest line 34 KB)");
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
    expect(parsed.snapshot.schemaVersion).toBe(1);
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
      expect(parsed.snapshot.schemaVersion).toBe(1);
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
              expect(parsed.snapshot.schemaVersion).toBe(1);
            }
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
      expect(parsed.snapshot.schemaVersion).toBe(1);
    }
    // Independent, not identical: each read its own clock, so the two documents are two readings of
    // one tree rather than one reading served twice from something shared.
    const generatedAt = both.map(
      (r) => (JSON.parse(r.out) as { snapshot: { generatedAt: string } }).snapshot.generatedAt,
    );
    expect(generatedAt.every((g) => typeof g === "string" && g !== "")).toBe(true);
  });
});
