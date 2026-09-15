// board-watch.test.ts — the refresh loop: what triggers a re-read, and what a broken trigger costs.
//
// WHAT THIS FILE IS. Plan 32-03 task 3 gives the dashboard a directory-level watch, a 250 ms
// debounce and a MANDATORY 10-second poll that share exactly one re-read path. The cases below drive
// that loop with an injected watcher and vitest's fake timers, because the alternative — arming a
// real `fs.watch` and sleeping — is a test that passes on an idle machine and fails on a loaded one.
// The `LoopDeps` seam exists for exactly that reason and production passes nothing through it.
//
// THE TWO ARMS THIS FILE EXISTS FOR. Both were measured this session (RESEARCH §Filesystem Watching)
// rather than assumed:
//   1. A single plain write produced FOUR directory events on macOS. Without the debounce the
//      re-read fires two to four times per change, so the coalescing case is the one this file's
//      RED baseline discriminates against a no-op debounce.
//   2. On macOS a directory watch SURVIVES deletion and recreation, so the "a watcher errored,
//      close it and re-arm it on the next poll" arm is unreachable on the developer's machine. It is
//      driven through the named `GRUGOPS_BOARD_FORCE_WATCH_ERROR` seam instead of through a platform
//      behaviour, so the arm is exercised wherever this suite runs.
//
// NOTHING HERE ASSERTS WINDOWS SEMANTICS. `fs.watch` on Windows is `UNKNOWN - verify` pending
// Phase 33 / CAP-02 (32-VALIDATION.md), and a case that asserted it from darwin would be a case
// asserting a platform it never ran on.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, vi, afterEach } from "vitest";
import { spawn } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DEBOUNCE_MS,
  FORCE_WATCH_ERROR_ENV,
  POLL_FLOOR_MS,
  WATCH_DIRS,
  WATCH_DIR_COUNT,
  createLoop,
  defaultDeps,
  deriveWatchDirs,
  run,
} from "./board-dashboard.js";
import { FIXED_SUBPATHS, OUTSIDE_ROOT, QUEUE_STAGES, SOURCE_NAMES } from "./board-read.js";
import type { DashboardIo, Loop, LoopDeps, Options } from "./board-dashboard.js";
import type { SnapshotResult } from "./board-read.js";

/**
 * Is `dir` on the root-to-leaf path of `subpath` — equal to it, its parent, or inside it?
 *
 * THE RELATIONSHIP THE CASES BELOW ASSERT, spelled once. Two of the three shapes are real: a
 * file-shaped source (`plans/board.md`) is covered by its parent directory, and a directory-shaped
 * source with stages (`.grugops/queue`) is covered by the stage directories INSIDE it. A predicate
 * that only looked one way would call the queue unwatched.
 */
function onSamePath(dir: string, subpath: string): boolean {
  return dir === subpath || subpath.startsWith(`${dir}/`) || dir.startsWith(`${subpath}/`);
}

const ROOT = join(import.meta.dirname, "..");
const DASHBOARD_JS = join(ROOT, "scripts", "board-dashboard.js");
const FIXTURE = join(ROOT, "scripts", "fixtures", "board-snapshot");

/**
 * The root as the USER TYPES IT, which is the value `arm` used to join against.
 *
 * `REPO` and a read's `snapshot.repoRoot` are the same string on an ordinary tree and DIFFERENT
 * strings the moment the invocation path runs through a symlink — `resolveRepoRoot` puts every
 * argument through `realpathSync`. The cases below separate the two deliberately.
 */
const REPO = "/repo";

/** A snapshot result with no value in any source — the loop under test never reads a real tree. */
function stubResult(n: number, root: string = REPO): SnapshotResult {
  const absent = { source: "unavailable", present: false } as const;
  return {
    source: "unavailable",
    snapshot: {
      schemaVersion: 1,
      repoRoot: root,
      generatedAt: `2026-09-14T09:00:${String(n).padStart(2, "0")}.000Z`,
      board: null,
      config: null,
      sources: {
        board: absent,
        tickets: absent,
        queue: absent,
        context: absent,
        traceability: absent,
        config: absent,
      },
    },
    conflicts: [],
    readErrors: [],
  };
}

type FakeWatcher = {
  readonly dir: string;
  readonly fire: (eventType: string, filename: string | null) => void;
  error: ((e: Error) => void) | null;
  closed: boolean;
};

type Harness = {
  readonly loop: Loop;
  readonly watchers: FakeWatcher[];
  readonly out: () => string;
  readonly err: () => string;
  readonly writes: () => readonly string[];
  readonly reads: () => number;
  readonly maxDepth: () => number;
  readonly present: Set<string>;
  /**
   * Absolute directories whose `watch()` CALL throws, keyed to the message it throws with.
   *
   * The `error` event on a live handle and a throw from `watch()` itself are two different arms of
   * the same failure — `arm` has a `try` around the call precisely because `fs.watch` throws
   * synchronously on ENOSPC and EMFILE — and only this one lets the SAME directory fail twice
   * without a successful re-arm in between. The map is mutable, so a case can change the reason
   * between two ticks and ask which reason the loop is carrying.
   */
  readonly armFailures: Map<string, string>;
  /** The root the injected read RESOLVES to, which a case can move between two reads. */
  readonly readRoot: { current: string };
  readonly onRead: (fn: ((loop: Loop, n: number) => void) | null) => void;
};

/** Build a loop over an injected watcher, an injected existence check and an injected read. */
function harness(partial: Partial<Options> = {}, presentDirs: readonly string[] = []): Harness {
  const options: Options = {
    repoRoot: REPO,
    once: false,
    json: false,
    watch: true,
    intervalMs: null,
    ...partial,
  };
  const stdoutWrites: string[] = [];
  let err = "";
  const io: DashboardIo = {
    stdout: {
      write: (s: string) => {
        stdoutWrites.push(s);
        return true;
      },
    },
    stderr: {
      write: (s: string) => {
        err += s;
        return true;
      },
    },
    isTty: false,
  };

  const watchers: FakeWatcher[] = [];
  const present = new Set(presentDirs.map((d) => join(REPO, d)));
  const armFailures = new Map<string, string>();
  const readRoot = { current: REPO };
  let reads = 0;
  let depth = 0;
  let maxDepth = 0;
  let onRead: ((loop: Loop, n: number) => void) | null = null;

  const deps: LoopDeps = {
    watch: (dir, listener) => {
      const reason = armFailures.get(dir);
      if (reason !== undefined) throw new Error(reason);
      const w: FakeWatcher = { dir, fire: listener, error: null, closed: false };
      watchers.push(w);
      return {
        close: () => {
          w.closed = true;
        },
        on: (_event, handler) => {
          w.error = handler;
          return undefined;
        },
      };
    },
    exists: (p) => present.has(p),
    read: () => {
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
      reads += 1;
      const n = reads;
      try {
        onRead?.(loop, n);
        return stubResult(n, readRoot.current);
      } finally {
        depth -= 1;
      }
    },
  };

  const loop = createLoop(options, io, deps);
  return {
    loop,
    watchers,
    out: () => stdoutWrites.join(""),
    err: () => err,
    writes: () => [...stdoutWrites],
    reads: () => reads,
    maxDepth: () => maxDepth,
    present,
    armFailures,
    readRoot,
    onRead: (fn) => {
      onRead = fn;
    },
  };
}

/** The live watcher for a relative directory, or undefined when none is armed. */
function liveWatcher(h: Harness, rel: string): FakeWatcher | undefined {
  return h.watchers.find((w) => w.dir === join(REPO, rel) && !w.closed);
}

afterEach(() => {
  vi.useRealTimers();
  delete process.env[FORCE_WATCH_ERROR_ENV];
});

describe("board-dashboard — the watched directory set (D-14)", () => {
  it("pins the watched-directory count two-sided against the derived list", () => {
    expect(WATCH_DIR_COUNT).toBe(WATCH_DIRS.length);
  });

  it("pins the watched-directory count at six", () => {
    expect(
      WATCH_DIRS.length,
      "a seventh watched directory is a D-14 DECISION recorded in the phase context, never a " +
        "bumped constant: each watch is the low-latency path for a named source, and a directory " +
        "nobody assigned a source to is a watch whose failure has nowhere to be reported",
    ).toBe(6);
  });

  it("IS the derivation over the live layout authorities, not a copy of its answer", () => {
    // The second hand-typed list that used to live here is DELETED (WR-07). A list asserted against
    // a list is two spellings of the layout agreeing with each other and with nothing on disk: move
    // `FIXED_SUBPATHS.tickets` and both stay green while the dashboard stops watching tickets.
    expect(WATCH_DIRS).toEqual(deriveWatchDirs());
  });

  it("gives every source except the dial a watched directory on its path", () => {
    const unwatched: string[] = [];
    for (const source of SOURCE_NAMES) {
      if (source === "config") continue; // D-14 does not watch the dial; the poll picks it up
      const covering = WATCH_DIRS.filter((d) => onSamePath(d.rel, FIXED_SUBPATHS[source]));
      if (covering.length === 0) unwatched.push(`${source} (${FIXED_SUBPATHS[source]})`);
    }
    expect(
      unwatched,
      "a source with no watched directory on its path is a surface whose changes reach the screen " +
        "only on the next poll tick — and the mandatory poll is what makes that invisible, which is " +
        "why the relationship is asserted rather than the membership (WR-07)",
    ).toEqual([]);
  });

  it("justifies every watched directory by at least one source", () => {
    const unjustified = WATCH_DIRS.filter(
      (d) =>
        !SOURCE_NAMES.some((source) => source !== "config" && onSamePath(d.rel, FIXED_SUBPATHS[source])),
    );
    expect(
      unjustified.map((d) => d.rel),
      "a watched directory no source justifies is a watch whose failure has nowhere to be " +
        "reported: `noteWatchError` files the record against a source name",
    ).toEqual([]);
    // The converse of the case above. Both directions are asserted because they fail differently:
    // one leaves a surface unwatched, the other leaves a handle nobody needs.
    expect(WATCH_DIRS.every((d) => onSamePath(d.rel, FIXED_SUBPATHS[d.source]))).toBe(true);
  });

  it("MOVES with the layout: a renamed tickets subpath and a fourth queue stage", () => {
    // THE DISCRIMINATION. Without it, `deriveWatchDirs` returning a frozen constant would satisfy
    // every case above — the relationship would hold, the count would hold, and the derivation would
    // be a literal with a function around it.
    const renamed = deriveWatchDirs({ ...FIXED_SUBPATHS, tickets: "plans/cards" });
    expect(renamed.map((d) => d.rel)).toContain("plans/cards");
    expect(renamed.map((d) => d.rel)).not.toContain("plans/tickets");
    expect(renamed.length).toBe(WATCH_DIRS.length);

    const fourStages = deriveWatchDirs(FIXED_SUBPATHS, [...QUEUE_STAGES, "abandoned"]);
    expect(fourStages.map((d) => d.rel)).toContain(".grugops/queue/abandoned");
    expect(fourStages.length).toBe(WATCH_DIRS.length + 1);

    // A file-shaped subpath contributes its PARENT, and a moved file moves the parent with it.
    const movedBoard = deriveWatchDirs({ ...FIXED_SUBPATHS, board: "docs/board.md" });
    expect(movedBoard.map((d) => d.rel)).toContain("docs");
  });

  it("drops the dial, and folds traceability into the directory the board already supplies", () => {
    // The two facts a reader counting six directories against six sources needs, asserted rather
    // than only written down: `config` is watched by nobody, and `traceability` shares `plans/`.
    expect(WATCH_DIRS.map((d) => d.rel)).not.toContain("agent-factory/config");
    expect(WATCH_DIRS.filter((d) => d.rel === "plans").length).toBe(1);
    expect(
      onSamePath("plans", FIXED_SUBPATHS.traceability),
      "traceability lives beside the board, so the board's watched directory covers it and no " +
        "seventh entry is derived for it",
    ).toBe(true);
  });

  it("never passes the recursive watch option — the platform-variable part of the API", () => {
    // `recursive: true` throws ERR_FEATURE_UNAVAILABLE_ON_PLATFORM where it is unsupported, which is
    // precisely why D-14 names six directories instead of one tree.
    const src = readFileSync(join(ROOT, "scripts", "board-dashboard.ts"), "utf8");
    const code = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*"));
    expect(code.filter((l) => l.includes("recursive"))).toEqual([]);
  });
});

describe("board-dashboard — arming (D-14)", () => {
  it("arms one watcher per EXISTING directory and silently skips one that is not there", () => {
    const h = harness({}, ["plans", "plans/tickets"]);
    h.loop.armAll();
    expect(h.loop.watchedDirs()).toEqual(["plans", "plans/tickets"]);
    expect(h.loop.watchErrors()).toEqual([]);
  });

  it("arms a directory that APPEARS later, on a poll tick", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);
    expect(
      h.loop.watchedDirs(),
      "PREMISE: the loop armed something other than the one directory that existed, so the case " +
        "below cannot tell an appearance from a re-arm",
    ).toEqual(["plans"]);

    // The queue appears — an agent claimed the first task on a tree that had never run one.
    h.present.add(join(REPO, ".grugops/queue/claimed"));
    vi.advanceTimersByTime(POLL_FLOOR_MS);

    expect(h.loop.watchedDirs()).toEqual(["plans", ".grugops/queue/claimed"]);
    h.loop.stop();
  });

  it("arms each directory ONCE, however many poll ticks pass", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);
    vi.advanceTimersByTime(POLL_FLOOR_MS * 3);
    expect(h.watchers.length).toBe(1);
    h.loop.stop();
  });
});

describe("board-dashboard — the debounce (D-14, T-32-13)", () => {
  it("coalesces FIVE events inside the window into exactly ONE re-read", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    const w = liveWatcher(h, "plans");
    expect(w, "PREMISE: no watcher was armed on plans/, so no event below was delivered").toBeDefined();

    for (let i = 0; i < 5; i += 1) {
      w?.fire("change", "board.md");
      vi.advanceTimersByTime(10);
    }
    expect(
      h.reads(),
      "nothing has been read yet: the debounce window has not closed, and a re-read per event is " +
        "the two-to-four-reads-per-change behaviour this window exists to remove",
    ).toBe(0);

    vi.advanceTimersByTime(DEBOUNCE_MS);
    expect(h.reads()).toBe(1);
    h.loop.stop();
  });

  it("re-reads AGAIN for a burst that arrives after the window closed", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    const w = liveWatcher(h, "plans");
    w?.fire("change", "board.md");
    vi.advanceTimersByTime(DEBOUNCE_MS);
    w?.fire("change", "board.md");
    vi.advanceTimersByTime(DEBOUNCE_MS);
    expect(h.reads()).toBe(2);
    h.loop.stop();
  });

  it("re-reads for a listener invoked with a NULL filename (Node reports none on some Linux)", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    const w = liveWatcher(h, "plans");
    // The listener ignores both arguments. A re-read that depended on `filename` would be a re-read
    // that silently stops happening on a platform Node documents as reporting none.
    w?.fire("rename", null);
    vi.advanceTimersByTime(DEBOUNCE_MS);
    expect(h.reads()).toBe(1);
    h.loop.stop();
  });
});

describe("board-dashboard — the mandatory poll floor (D-14)", () => {
  it("re-reads on the poll tick with EVERY watcher closed and none re-armed", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans", ".grugops/context"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);
    expect(
      h.loop.watchedDirs().length,
      "PREMISE: nothing was armed, so 'every watcher is closed' is true of a loop that never " +
        "watched anything",
    ).toBe(2);

    // Close every watcher through its own error path, then make every directory report itself
    // absent so the poll tick cannot re-arm any of them. What is left is the poll, alone.
    for (const w of [...h.watchers]) w.error?.(new Error("driven"));
    h.present.clear();
    expect(h.loop.watchedDirs()).toEqual([]);

    const before = h.reads();
    vi.advanceTimersByTime(POLL_FLOOR_MS);
    expect(h.reads()).toBe(before + 1);
    h.loop.stop();
  });

  it("keeps polling — the floor is a period, not a single shot", () => {
    vi.useFakeTimers();
    const h = harness({}, []);
    h.loop.start(POLL_FLOOR_MS);
    vi.advanceTimersByTime(POLL_FLOOR_MS * 3);
    expect(h.reads()).toBe(3);
    h.loop.stop();
  });

  it("polls at the `--interval` override rather than at the floor", () => {
    vi.useFakeTimers();
    const h = harness({ intervalMs: 1_000 }, []);
    h.loop.start(1_000);
    vi.advanceTimersByTime(2_000);
    expect(h.reads()).toBe(2);
    h.loop.stop();
  });

  it("stops both timers and closes every watcher on stop", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);
    h.loop.stop();

    expect(h.watchers.every((w) => w.closed)).toBe(true);
    const before = h.reads();
    vi.advanceTimersByTime(POLL_FLOOR_MS * 2);
    expect(h.reads()).toBe(before);
  });
});

describe("board-dashboard — a watcher that errors is closed, noted and re-armed (D-14)", () => {
  it("closes the watcher, names the directory in readErrors, and re-arms it on the next poll", () => {
    vi.useFakeTimers();
    process.env[FORCE_WATCH_ERROR_ENV] = "plans";
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);
    const armed = liveWatcher(h, "plans");
    expect(
      armed,
      "PREMISE: the seam prevented the watcher from being armed at all, so nothing below measured " +
        "an ERROR on a live watch",
    ).toBeDefined();

    armed?.fire("change", "board.md");

    expect(armed?.closed).toBe(true);
    expect(h.loop.watchedDirs()).toEqual([]);
    const noted = h.loop.watchErrors();
    expect(noted.length).toBe(1);
    expect(noted[0]?.path).toBe("plans");
    expect(noted[0]?.source).toBe("board");
    expect(noted[0]?.code).toBe("watch");

    vi.advanceTimersByTime(POLL_FLOOR_MS);
    expect(
      h.loop.watchedDirs(),
      "the re-arm is what makes a transient watch failure transient rather than permanent",
    ).toEqual(["plans"]);
    h.loop.stop();
  });

  it("carries the watch failure into the emitted document, not only into the loop's own list", () => {
    vi.useFakeTimers();
    process.env[FORCE_WATCH_ERROR_ENV] = "plans";
    const h = harness({ json: true }, ["plans"]);
    h.loop.armAll();
    liveWatcher(h, "plans")?.fire("change", null);
    h.loop.refresh();

    const line = h.writes()[h.writes().length - 1] ?? "";
    const parsed = JSON.parse(line) as { readErrors: { path: string; code: string }[] };
    expect(parsed.readErrors.map((e) => e.code)).toContain("watch");
  });
});

describe("board-dashboard — one CURRENT watch record per directory (WR-06)", () => {
  // WHAT THESE CASES MEASURE, AND WHY A NUMBER RATHER THAN A SHAPE. The record the loop keeps for a
  // failing watch is a STATE — "the watch on this directory is down right now" — and the shipped
  // implementation kept it as a LOG: one entry appended per failure, nothing ever removed. The two
  // are indistinguishable while a watch fails once, and they diverge on the second tick. Every
  // assertion below is therefore a count or an ordering, not a "contains an entry for plans".

  it("reports exactly ONE record for a directory whose watch fails on ten consecutive ticks", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);

    const TICKS = 10;
    for (let i = 0; i < TICKS; i += 1) {
      const w = liveWatcher(h, "plans");
      expect(w, `PREMISE: no live watcher on tick ${i}, so nothing below measured a failure`).toBeDefined();
      w?.error?.(new Error(`inotify watch limit reached (attempt ${i})`));
      // The last failure is NOT followed by a tick: the point of the case is the record a
      // persistently failing watch leaves behind, and a trailing re-arm would clear it.
      if (i < TICKS - 1) vi.advanceTimersByTime(POLL_FLOOR_MS);
    }

    expect(
      h.watchers.length,
      "PREMISE: the poll did not re-arm between failures, so the ten failures below were one " +
        "failure counted ten times by the test rather than by the loop",
    ).toBe(TICKS);
    expect(
      h.loop.watchErrors().length,
      "a directory whose watch keeps failing is ONE current finding. One entry per poll tick is " +
        "8,640 a day at the floor, every one of them printed on every frame and embedded in every " +
        "published document as a current read error (WR-06)",
    ).toBe(1);
    expect(h.loop.watchErrors()[0]?.path).toBe("plans");
    h.loop.stop();
  });

  it("reports ZERO records once the watch is re-armed successfully", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);
    liveWatcher(h, "plans")?.error?.(new Error("transient"));
    expect(
      h.loop.watchErrors().length,
      "PREMISE: the failure was never recorded, so 'cleared on re-arm' is true of a loop that " +
        "recorded nothing",
    ).toBe(1);

    vi.advanceTimersByTime(POLL_FLOOR_MS);

    expect(h.loop.watchedDirs()).toEqual(["plans"]);
    expect(
      h.loop.watchErrors(),
      "the record says the watch is down and will be re-armed on the next poll tick. Once that " +
        "re-arm has happened the sentence is false, and a frame that keeps printing it is a frame " +
        "reporting a failure that is over",
    ).toEqual([]);
    h.loop.stop();
  });

  it("replaces the reason when the same directory fails again for a different reason", () => {
    vi.useFakeTimers();
    const h = harness({}, ["plans"]);
    h.armFailures.set(join(REPO, "plans"), "ENOSPC: inotify watch limit reached");
    h.loop.armAll();
    expect(
      h.loop.watchErrors().map((e) => e.path),
      "PREMISE: a throwing watch() call was not recorded at all",
    ).toEqual(["plans"]);
    expect(h.loop.watchErrors()[0]?.message).toContain("ENOSPC");

    h.armFailures.set(join(REPO, "plans"), "EMFILE: too many open files");
    h.loop.start(POLL_FLOOR_MS);
    vi.advanceTimersByTime(POLL_FLOOR_MS);

    const noted = h.loop.watchErrors();
    expect(
      noted.length,
      "keyed by DIRECTORY, a second failure on one directory is the same finding with a new " +
        "reason. Keyed by reason it would be two findings, both claiming to be current",
    ).toBe(1);
    expect(
      noted[0]?.message,
      "the record names the reason the watch is down NOW, not the reason it was down first",
    ).toContain("EMFILE");
    expect(noted[0]?.message).not.toContain("ENOSPC");
    h.loop.stop();
  });

  it("orders two failing directories by name, so two frames of one state are the same bytes", () => {
    vi.useFakeTimers();
    const h = harness({ json: true }, ["plans", ".grugops/context"]);
    h.loop.armAll();
    // Failed in ARMING order, which is WATCH_DIRS order and is not name order. A list that came
    // out in insertion order would read `plans` first, and a consumer diffing two documents would
    // see a reshuffle whenever the two failures happened in the other sequence.
    liveWatcher(h, "plans")?.error?.(new Error("first"));
    liveWatcher(h, ".grugops/context")?.error?.(new Error("second"));

    expect(h.loop.watchErrors().map((e) => e.path)).toEqual([".grugops/context", "plans"]);

    // THE ORDER IS ASSERTED WHERE A CONSUMER READS IT. The accessor above is the loop's own view;
    // the document below is the artefact somebody diffs, and `emit` is the function that could put
    // the two entries in a different order from the accessor.
    h.loop.refresh();
    const line = h.writes()[h.writes().length - 1] ?? "";
    const parsed = JSON.parse(line) as { readErrors: { path: string; code: string }[] };
    expect(parsed.readErrors.filter((e) => e.code === "watch").map((e) => e.path)).toEqual([
      ".grugops/context",
      "plans",
    ]);
    h.loop.stop();
  });

  it("holds no record after `stop`, so a later emit prints nothing about a watch that is gone", () => {
    vi.useFakeTimers();
    const h = harness({ json: true }, ["plans"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);
    liveWatcher(h, "plans")?.error?.(new Error("driven"));
    expect(
      h.loop.watchErrors().length,
      "PREMISE: nothing was recorded before stop, so the emptiness below is not stop's doing",
    ).toBe(1);

    h.loop.stop();

    // THE INTENDED STATE AFTER `stop` IS EMPTY, and it is a decision rather than a side effect. The
    // record's own sentence promises a re-arm on the next poll tick; `stop` clears the poll, so
    // after it there is no next tick and no watch. A record that survived would be a statement
    // about a loop that no longer exists, printed by whatever emitted next.
    expect(h.loop.watchErrors()).toEqual([]);

    h.loop.refresh();
    const line = h.writes()[h.writes().length - 1] ?? "";
    const parsed = JSON.parse(line) as { readErrors: { code: string }[] };
    expect(parsed.readErrors.map((e) => e.code)).not.toContain("watch");
  });
});

describe("board-dashboard — a watch is armed against the ROOT EVERY READ RESOLVED (IN-01)", () => {
  // THE INCONSISTENCY THESE CASES CLOSE. `readSnapshot` puts the argument through `resolveRepoRoot`
  // and every subpath through the module's single containment authority; `arm` joined the RAW ARGV
  // VALUE. On a symlinked invocation path the two are different strings, so the loop opened handles
  // against a tree the reader had already refused to read — one rule asked in one module and not in
  // its sibling.

  it("arms against the root the READ resolved, not the value the caller typed", () => {
    const RESOLVED = "/private/repo";
    const h = harness({}, []);
    h.present.add(join(RESOLVED, "plans"));
    h.readRoot.current = RESOLVED;
    h.loop.seed(stubResult(1, RESOLVED));

    h.loop.armAll();

    expect(
      h.watchers.map((w) => w.dir),
      "the handle is open on the ARGV path. `options.repoRoot` is the string the user typed; the " +
        "snapshot's repoRoot is what the containment authority resolved it to",
    ).toEqual([join(RESOLVED, "plans")]);
    expect(h.loop.watchedDirs()).toEqual(["plans"]);
  });

  it("follows a later read that resolves to a DIFFERENT root", () => {
    const h = harness({}, ["plans"]);
    h.loop.seed(stubResult(1, REPO));
    h.loop.armAll();
    expect(
      h.watchers.map((w) => w.dir),
      "PREMISE: nothing was armed under the first root, so the move below is a move from nowhere",
    ).toEqual([join(REPO, "plans")]);

    const MOVED = "/private/repo";
    h.present.add(join(MOVED, "plans"));
    h.readRoot.current = MOVED;
    h.loop.refresh();
    h.loop.armAll();

    expect(
      h.watchers.filter((w) => !w.closed).map((w) => w.dir),
      "a resolved root that MOVED leaves every open handle on a tree that is no longer the one " +
        "being projected: the handles go with the root",
    ).toEqual([join(MOVED, "plans")]);
  });

  it("arms NOTHING before a read has resolved a root, and says so once per directory", () => {
    // THE STATED ANSWER TO AN UNSTATED ORDER DEPENDENCE. `run` seeds before it arms, so production
    // never reaches this; `createLoop` is a public function a caller can drive in any order, and an
    // unstated assumption in a loop that opens filesystem handles is what the next round measures.
    const h = harness({}, ["plans"]);

    h.loop.armAll();

    expect(h.watchers.length, "a handle was opened against a root nobody resolved").toBe(0);
    expect(h.loop.watchedDirs()).toEqual([]);
    const noted = h.loop.watchErrors();
    expect(noted.length, "one record per directory, because the skip is per directory").toBe(
      WATCH_DIR_COUNT,
    );
    expect(noted.every((e) => e.message.includes("no read has resolved"))).toBe(true);

    // And the records do not outlive the condition: a seed, a re-arm, and the loop says nothing.
    h.loop.seed(stubResult(1, REPO));
    h.loop.armAll();
    expect(h.loop.watchedDirs()).toEqual(["plans"]);
    expect(
      h.loop.watchErrors(),
      "the five directories that do not exist on this tree kept a record about a condition that " +
        "is over — an absent directory is not a failed watch",
    ).toEqual([]);
  });

  it("refuses a symlinked source directory and opens no handle on it, end to end", () => {
    // THE CR-04 CLASS ASKED IN THE SIBLING MODULE. A real tree, the real reader, the real
    // containment authority; only `watch` is injected, so what is measured is which directories the
    // loop ASKED to watch.
    const scratch = mkdtempSync(join(realpathSync(tmpdir()), "grugops-watch-symlink-"));
    try {
      const tree = join(scratch, "tree");
      cpSync(FIXTURE, tree, { recursive: true });
      const outside = join(scratch, "outside");
      mkdirSync(outside, { recursive: true });
      cpSync(join(tree, "plans"), join(outside, "plans"), { recursive: true });
      rmSync(join(tree, "plans"), { recursive: true, force: true });
      symlinkSync(join(outside, "plans"), join(tree, "plans"), "dir");

      const armed: string[] = [];
      const deps: LoopDeps = {
        ...defaultDeps(),
        watch: (dir) => {
          armed.push(dir);
          return { close: () => undefined, on: () => undefined };
        },
      };
      const out: string[] = [];
      const io: DashboardIo = {
        stdout: {
          write: (s: string) => {
            out.push(s);
            return true;
          },
        },
        stderr: { write: () => true },
        isTty: false,
      };

      const result = run([tree, "--json", "--watch", "--interval", "1000"], io, deps);
      expect(result.kind).toBe("running");
      if (result.kind === "running") result.loop.stop();

      const doc = JSON.parse(out[0] ?? "{}") as {
        readErrors: { source: string; code: string }[];
      };
      // THREE sources, not two: `plans/` carries the board, the ticket directory AND the
      // traceability file, so one symlink refuses all three — and `plans` is the watched directory
      // for the first and the third.
      const refused = doc.readErrors.filter((e) => e.code === OUTSIDE_ROOT);
      expect(
        refused.map((e) => e.source).sort(),
        "PREMISE: the reader did not refuse the symlinked directory, so the watch assertion below " +
          "is about a tree that was never outside the root",
      ).toEqual(["board", "tickets", "traceability"]);

      expect(
        armed.filter((d) => d.includes("plans")),
        "a handle is open on a directory every READ of which is refused. No content crosses — a " +
          "watcher yields names — but the rule is one rule, and it is asked in one module",
      ).toEqual([]);
      expect(
        armed.some((d) => d.includes(".grugops")),
        "PREMISE: the loop armed nothing at all, so 'it did not arm the refused path' is true of a " +
          "loop that did nothing",
      ).toBe(true);
      expect(
        refused.length,
        "the refusal is reported ONCE, by the authority that made it. A second record from the " +
          "watch arm would be the same finding twice in the same list",
      ).toBe(3);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  it("leaves the armed set unchanged on an ordinary tree", () => {
    const h = harness({}, ["plans", "plans/tickets", ".grugops/context"]);
    h.loop.seed(stubResult(1, REPO));
    h.loop.armAll();
    expect(h.loop.watchedDirs()).toEqual(["plans", "plans/tickets", ".grugops/context"]);
    expect(h.loop.watchErrors()).toEqual([]);
  });
});

describe("board-dashboard — refresh is single-flight (edge: concurrency)", () => {
  it("does not start a second read inside the first, and produces two COMPLETE snapshots", () => {
    const h = harness({ json: true }, []);
    // A trigger arriving while a read is in flight. `readSnapshot` is synchronous, so the only way
    // that happens is reentrantly — which is exactly what a watch event delivered from inside the
    // read, or a poll tick on the same turn, would look like.
    h.onRead((loop, n) => {
      if (n === 1) loop.refresh();
    });

    h.loop.refresh();

    expect(h.reads()).toBe(2);
    expect(
      h.maxDepth(),
      "a second read STARTED while the first was in flight: the snapshots can interleave, and the " +
        "document on stdout may describe two different trees at once",
    ).toBe(1);

    const lines = h.writes();
    expect(lines.length).toBe(2);
    for (const line of lines) {
      expect(() => JSON.parse(line) as unknown).not.toThrow();
    }
    // The reads happened in order and each was emitted whole before the next began.
    const first = JSON.parse(lines[0] as string) as { snapshot: { generatedAt: string } };
    const second = JSON.parse(lines[1] as string) as { snapshot: { generatedAt: string } };
    expect(first.snapshot.generatedAt < second.snapshot.generatedAt).toBe(true);
  });

  it("coalesces a THIRD trigger arriving during the re-run into the same re-run", () => {
    const h = harness({ json: true }, []);
    h.onRead((loop, n) => {
      if (n <= 2) loop.refresh();
    });
    h.loop.refresh();
    expect(h.reads()).toBe(3);
    expect(h.maxDepth()).toBe(1);
  });
});

describe("board-dashboard — `--json --watch` emits NDJSON (D-18)", () => {
  it("writes one COMPLETE JSON document per line per re-read, and nothing else on stdout", () => {
    vi.useFakeTimers();
    const h = harness({ json: true }, ["plans"]);
    h.loop.armAll();
    h.loop.start(POLL_FLOOR_MS);
    vi.advanceTimersByTime(POLL_FLOOR_MS * 3);
    h.loop.stop();

    const lines = h.out().split("\n").filter((l) => l !== "");
    expect(lines.length).toBe(3);
    for (const line of lines) {
      const parsed = JSON.parse(line) as { snapshot: { schemaVersion: number } };
      expect(parsed.snapshot.schemaVersion).toBe(1);
    }
    // Every write ended in exactly one newline, so the line boundary IS the document boundary.
    expect(h.writes().every((w) => w.endsWith("\n") && !w.slice(0, -1).includes("\n"))).toBe(true);
  });

  it("routes `run` with --watch into a live loop rather than into one frame", () => {
    vi.useFakeTimers();
    let reads = 0;
    const out: string[] = [];
    const io: DashboardIo = {
      stdout: {
        write: (s: string) => {
          out.push(s);
          return true;
        },
      },
      stderr: { write: () => true },
      isTty: false,
    };
    const deps: LoopDeps = {
      watch: () => ({ close: () => undefined, on: () => undefined }),
      exists: () => false,
      read: () => {
        reads += 1;
        return stubResult(reads);
      },
    };

    const result = run([REPO, "--json", "--watch", "--interval", "1000"], io, deps);
    expect(result.kind).toBe("running");
    if (result.kind !== "running") return;

    expect(out.length, "the first frame is emitted before the loop starts waiting").toBe(1);
    vi.advanceTimersByTime(2_000);
    expect(out.length).toBe(3);
    result.loop.stop();
  });

  it("routes `run` WITHOUT --watch to one document and an exit code", () => {
    let reads = 0;
    const out: string[] = [];
    const io: DashboardIo = {
      stdout: {
        write: (s: string) => {
          out.push(s);
          return true;
        },
      },
      stderr: { write: () => true },
      isTty: false,
    };
    const deps: LoopDeps = {
      watch: () => ({ close: () => undefined, on: () => undefined }),
      exists: () => false,
      read: () => {
        reads += 1;
        return stubResult(reads);
      },
    };

    const result = run([REPO, "--json", "--once"], io, deps);
    expect(result.kind).toBe("exit");
    expect(result.kind === "exit" ? result.code : -1).toBe(0);
    expect(out.length).toBe(1);
  });
});

describe("board-dashboard — the process contract under --watch, driven as a child (D-18)", () => {
  it(
    "emits only complete JSON documents across two poll periods and exits 0 on SIGINT",
    async () => {
      const child = spawn(
        process.execPath,
        [DASHBOARD_JS, ".", "--json", "--watch", "--interval", "1000"],
        { cwd: ROOT },
      );
      let out = "";
      let err = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (c: string) => {
        out += c;
      });
      child.stderr.on("data", (c: string) => {
        err += c;
      });

      const code = await new Promise<number | null>((resolve) => {
        setTimeout(() => child.kill("SIGINT"), 2_300);
        child.on("close", (c) => resolve(c));
      });

      const lines = out.split("\n").filter((l) => l !== "");
      expect(
        lines.length,
        `PREMISE: the child produced fewer than two frames in two poll periods, so "every line is a ` +
          `complete document" describes almost nothing. stderr was: ${err.slice(0, 400)}`,
      ).toBeGreaterThanOrEqual(3);
      for (const line of lines) {
        const parsed = JSON.parse(line) as { snapshot: { schemaVersion: number } };
        expect(parsed.snapshot.schemaVersion).toBe(1);
      }
      expect(code).toBe(0);
    },
    15_000,
  );
});
