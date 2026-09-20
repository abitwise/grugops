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
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
// THE ONE published-path normalizer (plan 33-03), applied here to a TEST-INTERNAL comparison:
// `armedRel` is `relative()` over real directories, compared against POSIX literals, and never
// published by the dashboard. The measured carrier of six windows reds (33-RESEARCH § Windows
// per-file census, `.grugops\context` vs `.grugops/context`) is that line, not a module.
import { toPosix } from "./posix-path.js";

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
// The PUBLISHED version, read from the module rather than retyped here (plan 32-33). A literal in
// every file that checks a document is the set-literal drift class: the pin that a version MOVE was
// a decision lives once, in scripts/board-tracer.test.ts and scripts/board-model.test.ts.
import { SCHEMA_VERSION } from "./board-model.js";
import type { DashboardIo, Loop, LoopDeps, Options, WatchHandle } from "./board-dashboard.js";
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
      schemaVersion: SCHEMA_VERSION,
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
  /**
   * Absolute directories the containment seam refuses, mutable between ticks.
   *
   * A case adds a directory here to say "the containment authority refuses this path NOW" and asks
   * what the arm loop does about it — closes the handle, drops the record, leaves the siblings
   * alone. It is a SET, not a model of the rule; the rule itself is measured end to end over real
   * symlinks by the `withLinkedTree` cases.
   */
  readonly refused: Set<string>;
  /** The refusal CODE a refused directory answers with. Defaults to OUTSIDE-ROOT. */
  readonly refusedCodes: Map<string, string>;
  /** The root the injected read RESOLVES to, which a case can move between two reads. */
  readonly readRoot: { current: string };
  readonly onRead: (fn: ((loop: Loop, n: number) => void) | null) => void;
};

/**
 * Build a loop over an injected watcher, an injected existence check and an injected read.
 *
 * SEEDED BY DEFAULT, BECAUSE THAT IS THE PRODUCTION ORDER. `run` reads once, seeds the loop with the
 * result and only then arms: the resolved root a watch is armed against comes out of that first read
 * (IN-01). A harness that armed before seeding would be driving an order the shipped program never
 * takes. The one case that DOES drive it passes `seeded: false` and asserts what happens.
 */
function harness(
  partial: Partial<Options> = {},
  presentDirs: readonly string[] = [],
  { seeded = true }: { seeded?: boolean } = {},
): Harness {
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
  /** Absolute directories the containment seam refuses. Mutable, so a case can move the condition. */
  const refused = new Set<string>();
  const refusedCodes = new Map<string, string>();
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
    // DELIBERATELY NOT A MODEL OF THE CONTAINMENT RULE (plan 32-34). It is a membership test over a
    // set a case can mutate between ticks, so a case can say "this directory is refused NOW" and
    // ask what the loop does about it. The RULE — that an ENTRY leaving the tree does not refuse
    // its directory, that a directory or any ancestor of it leaving the tree does — lives in
    // `board-read`'s `insideRoot`, and the `withLinkedTree` cases below spread `defaultDeps()` over
    // REAL symlinks so the rule is measured rather than re-implemented here. A harness that modelled
    // the rule would let a case pass against a model while the shipped predicate disagreed.
    // IT RETURNS A CONTAINMENT, IDENTITY-MAPPED (review WR-03). `real` is the directory itself, so
    // this harness still models only MEMBERSHIP and every case's assertion about which path was
    // opened means what it did before. `refusedCodes` lets a case choose the refusal CODE, because
    // the loop now distinguishes a containment refusal (which the reader reports) from an
    // unreadable one (which nothing else reports, so the loop has to).
    contained: (_root, dir) =>
      refused.has(dir)
        ? {
            ok: false as const,
            code: refusedCodes.get(dir) ?? OUTSIDE_ROOT,
            message: `${dir} is refused`,
          }
        : { ok: true as const, real: dir },
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
  if (seeded) loop.seed(stubResult(0, readRoot.current));
  return {
    loop,
    watchers,
    out: () => stdoutWrites.join(""),
    err: () => err,
    writes: () => [...stdoutWrites],
    reads: () => reads,
    maxDepth: () => maxDepth,
    present,
    refused,
    refusedCodes,
    armFailures,
    readRoot,
    onRead: (fn) => {
      onRead = fn;
    },
  };
}

/**
 * A scratch copy of the fixture, mutated by `mutate`, projected once with only `watch` injected.
 *
 * REAL READER, REAL CONTAINMENT AUTHORITY, FAKE HANDLES. What is measured is which directories the
 * loop ASKED to watch and what the reader refused, so both halves of the IN-01 question are answered
 * against one run. `deps` spreads `defaultDeps()`, so `contained` is `board-read`'s own `insideRoot`
 * over real symlinks — the cases below measure the shipped rule rather than a model of it. The tree
 * is removed in a `finally`, including on a failed assertion.
 *
 * ALL THREE QUEUE STAGES ARE CREATED BEFORE `mutate` RUNS (plan 32-34). The committed fixture ships
 * only `claimed`, so on it `pending` and `done` leave through the absent-directory arm and "one
 * escaping claimed task un-armed all three stages" is a question the tree cannot answer — the
 * shortened armed list would be indistinguishable from the fixture's own shape. With the stages
 * present the healthy armed set is SIX, and a shortened one is a measurement.
 */
function withLinkedTree(
  mutate: (tree: string, outside: string) => void,
  body: (seen: {
    readonly refused: readonly { source: string; code: string; path: string }[];
    readonly armed: readonly string[];
    /** The armed directories as repo-relative names, sorted — the `WATCH_DIRS` spelling. */
    readonly armedRel: readonly string[];
  }) => void,
): void {
  const scratch = mkdtempSync(join(realpathSync(tmpdir()), "grugops-watch-symlink-"));
  try {
    const tree = join(scratch, "tree");
    cpSync(FIXTURE, tree, { recursive: true });
    const outside = join(scratch, "outside");
    mkdirSync(outside, { recursive: true });
    for (const stage of QUEUE_STAGES) {
      mkdirSync(join(tree, FIXED_SUBPATHS.queue, stage), { recursive: true });
    }
    mutate(tree, outside);

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
      readErrors: { source: string; code: string; path: string }[];
    };
    // The REAL root, because `run` puts the argument through `resolveRepoRoot` and `mkdtemp` under
    // `/var` on darwin is itself a link to `/private/var`. Relativising against the unresolved
    // string would produce `../../…` names that match nothing.
    const realTree = realpathSync(tree);
    body({
      refused: doc.readErrors.filter((e) => e.code === OUTSIDE_ROOT),
      armed,
      // Spelled the way the literals below spell it: `relative()` joins with the HOST separator,
      // and the expected lists are POSIX (the same spelling `FIXED_SUBPATHS` uses). Test-internal —
      // the dashboard publishes its own `rel` from `WATCH_DIRS`, which is POSIX by construction.
      armedRel: armed.map((d) => toPosix(relative(realTree, d))).sort(),
    });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
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
    const h = harness({}, ["plans"], { seeded: false });

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
    withLinkedTree(
      (tree, outside) => {
        cpSync(join(tree, "plans"), join(outside, "plans"), { recursive: true });
        rmSync(join(tree, "plans"), { recursive: true, force: true });
        symlinkSync(join(outside, "plans"), join(tree, "plans"), "dir");
      },
      ({ refused, armed }) => {
        // THREE sources, not two: `plans/` carries the board, the ticket directory AND the
        // traceability file, so one symlink refuses all three — and `plans` is the watched
        // directory for the first and the third.
        expect(
          refused.map((e) => e.source).sort(),
          "PREMISE: the reader did not refuse the symlinked directory, so the watch assertion " +
            "below is about a tree that was never outside the root",
        ).toEqual(["board", "tickets", "traceability"]);

        expect(
          armed.filter((d) => d.includes("plans")),
          "a handle is open on a directory every READ of which is refused. No content crosses — a " +
            "watcher yields names — but the rule is one rule, and it is asked in one module",
        ).toEqual([]);
        expect(
          armed.some((d) => d.includes(".grugops")),
          "PREMISE: the loop armed nothing at all, so 'it did not arm the refused path' is true " +
            "of a loop that did nothing",
        ).toBe(true);
        expect(
          refused.length,
          "the refusal is reported ONCE, by the authority that made it. A second record from the " +
            "watch arm would be the same finding twice in the same list",
        ).toBe(3);
      },
    );
  });

  it("refuses PER SOURCE: a linked tickets directory leaves the board's own watch armed", () => {
    // THE SIBLING ARM, which is where this repository's findings keep reappearing. The case above
    // proves the loop refuses; this one proves it does not OVER-refuse. `plans/` is inside the root
    // and the board is readable through it, so unwatching it because one child leaves the tree
    // would turn a containment rule into an outage of the live path for an unrelated source.
    withLinkedTree(
      (tree, outside) => {
        cpSync(join(tree, "plans", "tickets"), join(outside, "tickets"), { recursive: true });
        rmSync(join(tree, "plans", "tickets"), { recursive: true, force: true });
        symlinkSync(join(outside, "tickets"), join(tree, "plans", "tickets"), "dir");
      },
      ({ refused, armed }) => {
        expect(
          refused.map((e) => e.source),
          "PREMISE: the ticket directory was not refused, so nothing below is about a refusal",
        ).toEqual(["tickets"]);
        expect(armed.filter((d) => d.endsWith("tickets"))).toEqual([]);
        expect(
          armed.some((d) => d.endsWith("plans")),
          "the board's directory is inside the root and the board reads fine; the refusal belongs " +
            "to the one source whose path left the tree",
        ).toBe(true);
      },
    );
  });

  it("leaves the armed set unchanged on an ordinary tree", () => {
    const h = harness({}, ["plans", "plans/tickets", ".grugops/context"]);
    h.loop.seed(stubResult(1, REPO));
    h.loop.armAll();
    expect(h.loop.watchedDirs()).toEqual(["plans", "plans/tickets", ".grugops/context"]);
    expect(h.loop.watchErrors()).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE REFUSAL IS ABOUT A DIRECTORY, NOT ABOUT A LABEL SEVERAL DIRECTORIES SHARE (plan 32-34,
// DASH-04, CR-01).
//
// The two cases above prove the loop refuses a source it must and does not refuse a SIBLING SOURCE
// it must not. They stop one level short of the shape that was actually shipped: the containment
// authority raises its refusal PER ENTRY — one ticket file, one claimed task directory, one context
// task — and the loop consumed that refusal's `source` LABEL. `deriveWatchDirs` hands several
// directories one label, so one planted symlink took `plans/tickets` off the low-latency path, and
// one inside `claimed` took all three queue stages off it, while `loop.watchErrors()` stayed empty
// and the header printed its ordinary state. `32-34-RED-baseline.txt` probes A, B and C are those
// three, measured through this same harness before the fix.
//
// THE CONVERSE OF A CONVERSE IS WHERE THIS REPOSITORY'S FINDINGS KEEP REAPPEARING. Every case below
// runs `defaultDeps()` over a real tree with real symlinks, so the predicate under test is the
// shipped one — `board-read`'s `insideRoot`, asked about exactly the path a handle would be opened
// on — and not a model of it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-dashboard — an escaping ENTRY leaves its DIRECTORY armed (plan 32-34, DASH-04)", () => {
  /** The healthy armed set for a `withLinkedTree` run: every watched directory exists on it. */
  const ALL_SIX = [
    ".grugops/context",
    ".grugops/queue/claimed",
    ".grugops/queue/done",
    ".grugops/queue/pending",
    "plans",
    "plans/tickets",
  ];

  it("PREMISE: an unmutated tree arms every one of the six watched directories", () => {
    // Without this the shortened lists below are indistinguishable from a tree that never had the
    // directory in the first place — which is exactly what the committed fixture's missing
    // `pending` and `done` stages would have produced.
    withLinkedTree(
      () => undefined,
      ({ armedRel, refused }) => {
        expect(armedRel).toEqual(ALL_SIX);
        expect(armedRel.length).toBe(WATCH_DIR_COUNT);
        expect(refused, "the unmutated fixture refuses nothing for containment").toEqual([]);
      },
    );
  });

  it("keeps `plans/tickets` armed when ONE ticket FILE inside it links out of the tree", () => {
    withLinkedTree(
      (tree, outside) => {
        writeFileSync(join(outside, "ESCAPE-001.md"), "# outside\n", "utf8");
        symlinkSync(join(outside, "ESCAPE-001.md"), join(tree, "plans", "tickets", "ESCAPE-001.md"));
      },
      ({ armedRel, refused }) => {
        expect(
          refused.map((e) => `${e.source}:${e.path.endsWith("ESCAPE-001.md")}`),
          "PREMISE: the reader did not refuse the escaping ticket FILE, so nothing below is about " +
            "a refusal — and if it refused the DIRECTORY instead, the armed assertion is vacuous",
        ).toEqual(["tickets:true"]);
        expect(
          armedRel,
          "one entry that left the tree un-armed the directory holding it. `plans/tickets` is " +
            "inside the root, readable, and holds seven legitimate tickets; taking it off the " +
            "low-latency path turns a live view into a ten-second-granular one under a confident " +
            "header (32-REVIEW.md CR-01)",
        ).toEqual(ALL_SIX);
      },
    );
  });

  it("keeps ALL THREE queue stages armed when one claimed task DIRECTORY links out", () => {
    // THE WORST OF THE THREE, because `pending` and `done` are ordinary empty directories that no
    // symlink was ever planted in: they shared a source LABEL with `claimed` and nothing else.
    withLinkedTree(
      (tree, outside) => {
        mkdirSync(join(outside, "escaping-task"), { recursive: true });
        writeFileSync(
          join(outside, "escaping-task", "claim.md"),
          "by: nobody\nat: 2026-09-16T00:00:00Z\n",
          "utf8",
        );
        symlinkSync(
          join(outside, "escaping-task"),
          join(tree, FIXED_SUBPATHS.queue, "claimed", "escaping-task"),
          "dir",
        );
      },
      ({ armedRel, refused }) => {
        expect(
          refused.map((e) => e.source),
          "PREMISE: the reader did not refuse the escaping claimed task",
        ).toEqual(["queue"]);
        expect(armedRel).toEqual(ALL_SIX);
      },
    );
  });

  it("keeps `.grugops/context` armed when one context task DIRECTORY links out", () => {
    withLinkedTree(
      (tree, outside) => {
        mkdirSync(join(outside, "escaping-context"), { recursive: true });
        writeFileSync(join(outside, "escaping-context", "index.jsonl"), "", "utf8");
        symlinkSync(
          join(outside, "escaping-context"),
          join(tree, FIXED_SUBPATHS.context, "escaping-context"),
          "dir",
        );
      },
      ({ armedRel, refused }) => {
        expect(
          refused.map((e) => e.source),
          "PREMISE: the reader did not refuse the escaping context task",
        ).toEqual(["context"]);
        expect(armedRel).toEqual(ALL_SIX);
      },
    );
  });

  it("still un-arms the tickets DIRECTORY itself when IT is the link — and nothing else", () => {
    // THE CONTROL, and the case the fix must not regress. The per-source case above this block
    // asserts the same behaviour against the round-2 mechanism; this one asserts the whole armed
    // set, so "it did not over-refuse" is a measurement rather than two spot checks.
    withLinkedTree(
      (tree, outside) => {
        cpSync(join(tree, "plans", "tickets"), join(outside, "tickets"), { recursive: true });
        rmSync(join(tree, "plans", "tickets"), { recursive: true, force: true });
        symlinkSync(join(outside, "tickets"), join(tree, "plans", "tickets"), "dir");
      },
      ({ armedRel, refused }) => {
        expect(refused.map((e) => e.source)).toEqual(["tickets"]);
        expect(armedRel).toEqual(ALL_SIX.filter((d) => d !== "plans/tickets"));
      },
    );
  });

  it("un-arms a DESCENDANT of a refused ancestor: `plans` links out, `plans/tickets` goes with it", () => {
    // THE ARM NEXT TO THE FIX, and the one neither review asked about. `32-34-RED-baseline.txt`
    // probe E records that this depth was covered BY ACCIDENT before the fix — `plans` carries
    // three sources, all three labels landed in the refused set, and both directories fell out
    // together. Narrowing the consumed signal to the refused PATHS would have LOST it: the paths
    // this read refuses are `plans/board.md`, `plans/tickets` and `plans/traceability.md`, and none
    // of them is `plans` or an ancestor of it. Asking the authority about the directory keeps it,
    // because `insideRoot` resolves the whole chain in one pass.
    withLinkedTree(
      (tree, outside) => {
        cpSync(join(tree, "plans"), join(outside, "plans"), { recursive: true });
        rmSync(join(tree, "plans"), { recursive: true, force: true });
        symlinkSync(join(outside, "plans"), join(tree, "plans"), "dir");
      },
      ({ armedRel, refused }) => {
        expect(
          refused.map((e) => e.source).sort(),
          "PREMISE: the three sources under `plans/` were not all refused",
        ).toEqual(["board", "tickets", "traceability"]);
        expect(
          // `e.path` is an absolute host LOCATION (plan 33-03 leaves those in the host spelling);
          // the suffix is compared in one spelling so this premise decides the same thing on
          // every host rather than passing vacuously wherever the separator differs.
          refused.some((e) => toPosix(e.path).endsWith("/plans")),
          "PREMISE FOR THE PREVIOUS PARAGRAPH: if the authority DID spell `plans` itself, a path " +
            "set with an ancestor walk would also pass this case, and the comment above would be " +
            "describing a mechanism this tree never exercises",
        ).toBe(false);
        expect(armedRel).toEqual([
          ".grugops/context",
          ".grugops/queue/claimed",
          ".grugops/queue/done",
          ".grugops/queue/pending",
        ]);
      },
    );
  });

  it("produces ONE armed set for two refusals in one read, ancestor and descendant together", () => {
    // DASH-04's concurrency probe, answered as a case. `plans` links out AND the `tickets`
    // directory behind it links out again, so two refusals — one an ancestor of the other — arrive
    // in a single read.
    withLinkedTree(
      (tree, outside) => {
        cpSync(join(tree, "plans"), join(outside, "plans"), { recursive: true });
        rmSync(join(tree, "plans"), { recursive: true, force: true });
        symlinkSync(join(outside, "plans"), join(tree, "plans"), "dir");
        cpSync(join(outside, "plans", "tickets"), join(outside, "tickets2"), { recursive: true });
        rmSync(join(outside, "plans", "tickets"), { recursive: true, force: true });
        symlinkSync(join(outside, "tickets2"), join(outside, "plans", "tickets"), "dir");
      },
      ({ armedRel }) => {
        expect(armedRel).toEqual([
          ".grugops/context",
          ".grugops/queue/claimed",
          ".grugops/queue/done",
          ".grugops/queue/pending",
        ]);
      },
    );
  });
});

describe("board-dashboard — a refusal is not a failed watch, and leaves no record (plan 32-34, DASH-05)", () => {
  it("drops a watch record the moment the SAME directory becomes refused", () => {
    // THE IMMORTAL RECORD, driven end to end through the loop's own state (32-REVIEW.md CR-02,
    // `32-34-RED-baseline.txt` probe F). A genuine watch failure is recorded first — the record's
    // own text promises "it will be re-armed on the next poll tick" — and then the directory is
    // refused for containment, which makes that promise impossible for as long as the refusal
    // stands. Before the fix the record survived and every stderr frame and every `--json` document
    // kept publishing it.
    const h = harness({}, ["plans", "plans/tickets"]);
    h.armFailures.set(join(REPO, "plans/tickets"), "ENOSPC: no space left on device");
    h.loop.seed(stubResult(1, REPO));
    h.loop.armAll();
    expect(
      h.loop.watchErrors().map((e) => e.path),
      "PREMISE: no genuine watch failure was recorded, so 'the record went' is true of a loop " +
        "that never had one",
    ).toEqual(["plans/tickets"]);
    expect(h.loop.watchErrors()[0]?.message).toContain("re-armed on the next poll tick");

    // The throw stops; the containment refusal starts. Only the refusal is now keeping the
    // directory un-armed.
    h.armFailures.clear();
    h.refused.add(join(REPO, "plans/tickets"));
    h.loop.armAll();
    expect(
      h.loop.watchErrors(),
      "the record outlived its cause: a refused directory is not a failed watch, and a record " +
        "promising a re-arm this early return makes impossible is a false statement on a channel " +
        "a human reads (CLAUDE.md, no fabrication)",
    ).toEqual([]);
    expect(h.loop.watchedDirs(), "and the refused directory is not armed").toEqual(["plans"]);
  });

  it("re-arms with NO record left once the containment condition clears", () => {
    const h = harness({}, ["plans", "plans/tickets"]);
    h.refused.add(join(REPO, "plans/tickets"));
    h.loop.seed(stubResult(1, REPO));
    h.loop.armAll();
    expect(h.loop.watchedDirs()).toEqual(["plans"]);
    expect(h.loop.watchErrors()).toEqual([]);

    h.refused.clear();
    h.loop.armAll();
    expect(
      h.loop.watchedDirs(),
      "the condition cleared and the directory did not come back — the poll tick is the re-arm, " +
        "and a refusal that is over must leave nothing behind it",
    ).toEqual(["plans", "plans/tickets"]);
    expect(h.loop.watchErrors()).toEqual([]);
  });

  it("CLOSES a handle opened before the refusal, rather than leaving it pointing outside", () => {
    // The refusal check runs BEFORE the already-armed early return for exactly this reason: a tree
    // can acquire a symlink under a running loop, and the handle opened a tick ago is the one now
    // pointing out of the tree.
    const h = harness({}, ["plans", "plans/tickets"]);
    h.loop.seed(stubResult(1, REPO));
    h.loop.armAll();
    const handle = liveWatcher(h, "plans/tickets");
    expect(handle, "PREMISE: nothing was armed, so there is no handle for the refusal to close")
      .toBeDefined();

    h.refused.add(join(REPO, "plans/tickets"));
    h.loop.armAll();
    expect(handle?.closed, "the handle opened before the refusal was left open").toBe(true);
    expect(h.loop.watchedDirs()).toEqual(["plans"]);
    expect(liveWatcher(h, "plans"), "and the sibling's handle was not closed with it").toBeDefined();
  });

  it("reaches ONE armed set whichever order two refusals arrive in", () => {
    // The same two refusals applied across two reads, in both orders, plus both in one read. All
    // three end on the same armed set — and they must, because nothing about a refusal is
    // accumulated between reads: `arm` asks the authority about each directory every tick.
    const orders = [
      ["plans/tickets", ".grugops/context"],
      [".grugops/context", "plans/tickets"],
    ] as const;
    const ends: string[][] = [];
    for (const order of orders) {
      const h = harness({}, ["plans", "plans/tickets", ".grugops/context"]);
      h.loop.seed(stubResult(1, REPO));
      h.loop.armAll();
      h.refused.add(join(REPO, order[0]));
      h.loop.armAll();
      h.refused.add(join(REPO, order[1]));
      h.loop.armAll();
      ends.push([...h.loop.watchedDirs()].sort());
    }
    const both = harness({}, ["plans", "plans/tickets", ".grugops/context"]);
    both.refused.add(join(REPO, "plans/tickets"));
    both.refused.add(join(REPO, ".grugops/context"));
    both.loop.seed(stubResult(1, REPO));
    both.loop.armAll();

    expect(ends[0]).toEqual(["plans"]);
    expect(
      ends[1],
      "the armed set depends on the order two refusals arrived in, which makes the live path a " +
        "function of filesystem timing (DASH-04)",
    ).toEqual(ends[0]);
    expect(
      [...both.loop.watchedDirs()].sort(),
      "and two refusals in ONE read produce the same set as either ordering across two",
    ).toEqual(ends[0]);
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
      expect(parsed.snapshot.schemaVersion).toBe(SCHEMA_VERSION);
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
      contained: (_root, dir) => ({ ok: true as const, real: dir }),
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
      contained: (_root, dir) => ({ ok: true as const, real: dir }),
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

/**
 * The TWO legitimate outcomes of a SIGINT this test sent, named — and nothing else.
 *
 * Where a signal is delivered, the dashboard's handler closes its handles and the child EXITS 0.
 * Where `kill("SIGINT")` terminates the child abruptly instead (node on win32 has no signal to
 * deliver; the process is ended forcefully), the `close` event carries no exit code and names the
 * signal. Both are the child ending the way this test ended it. A nonzero code, or a signal this
 * test never sent, is still a failure, and the observed pair is printed so a third outcome can be
 * read rather than guessed at. No host branch chooses an arm: the disjunction holds everywhere.
 */
function expectEndedBySigint(code: number | null, signal: NodeJS.Signals | null): void {
  expect(
    (code === 0 && signal === null) || (code === null && signal === "SIGINT"),
    `the child neither exited 0 nor was terminated by the SIGINT this test sent — observed ` +
      `${JSON.stringify({ code, signal })}`,
  ).toBe(true);
}

describe("expectEndedBySigint — both arms, and the third outcome prints the observed pair (33-04)", () => {
  it("accepts an exit 0 with no signal, and a null code carrying the SIGINT this test sends", () => {
    expect(() => expectEndedBySigint(0, null)).not.toThrow();
    expect(() => expectEndedBySigint(null, "SIGINT")).not.toThrow();
  });
  it("refuses a nonzero code and a signal the test never sent, naming what it saw", () => {
    expect(() => expectEndedBySigint(1, null)).toThrow(/observed \{"code":1,"signal":null\}/);
    expect(() => expectEndedBySigint(null, "SIGKILL")).toThrow(/observed \{"code":null,"signal":"SIGKILL"\}/);
    // A code AND a signal together is not one of the two arms either.
    expect(() => expectEndedBySigint(0, "SIGINT")).toThrow(/observed/);
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

      const ended = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
        (resolve) => {
          setTimeout(() => child.kill("SIGINT"), 2_300);
          child.on("close", (code, signal) => resolve({ code, signal }));
        },
      );

      const lines = out.split("\n").filter((l) => l !== "");
      expect(
        lines.length,
        `PREMISE: the child produced fewer than two frames in two poll periods, so "every line is a ` +
          `complete document" describes almost nothing. stderr was: ${err.slice(0, 400)}`,
      ).toBeGreaterThanOrEqual(3);
      for (const line of lines) {
        const parsed = JSON.parse(line) as { snapshot: { schemaVersion: number } };
        expect(parsed.snapshot.schemaVersion).toBe(SCHEMA_VERSION);
      }
      expectEndedBySigint(ended.code, ended.signal);
    },
    15_000,
  );
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// REVIEW WR-03 — THE WATCH ARM CHECKED THE RESOLVED PATH AND THEN OPENED THE UNRESOLVED SPELLING.
//
// `insideRoot`'s own docblock states the rule the rest of this repository follows: "The caller opens
// THAT, not the spelling it started with: opening a second path that merely spells the same thing is
// how a check made before a link swap stops being a check." `repoSubpath` and `childPath` both
// honour it — they return and use `contained.real`. The watch seam threw the answer away
// (`insideRoot(...).ok`) and `arm` then opened `dir`, which is a check-then-open race against the
// exact swap `insideRoot` documents.
//
// The bound on the damage is real and worth stating: `fs.watch` yields names, the listener ignores
// `filename` entirely and only calls `schedule()`, so no CONTENT crosses. What leaked was a handle
// held on an out-of-tree directory, and out-of-tree activity driving re-reads.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("WR-03 — the watch is opened on the path that was CHECKED", () => {
  /** A loop whose containment seam resolves every directory to a DIFFERENT real path. */
  const loopOverSeam = (
    contained: LoopDeps["contained"],
  ): { loop: Loop; opened: string[]; probed: string[] } => {
    const opened: string[] = [];
    // EVERY PATH THE LIVENESS GATE WAS ASKED ABOUT, recorded rather than described. The two
    // consumers of one containment decision are measured from the arm's own calls, so a future
    // edit that re-introduces a second spelling reds against what the arm did (F-20).
    const probed: string[] = [];
    const deps: LoopDeps = {
      watch: (dir) => {
        opened.push(dir);
        return { close: () => undefined, on: () => undefined } as WatchHandle;
      },
      exists: (p) => {
        probed.push(p);
        return true;
      },
      contained,
      read: () => stubResult(1),
    };
    const loop = createLoop(
      { repoRoot: REPO, once: false, json: false, watch: true, intervalMs: null },
      { stdout: { write: () => true }, stderr: { write: () => true }, isTty: false },
      deps,
    );
    loop.seed(stubResult(0));
    return { loop, opened, probed };
  };

  it("opens `contained.real`, not the spelling the check started with", () => {
    // The seam vouches for a DIFFERENT path than it was handed — which is exactly what `insideRoot`
    // does whenever any component of the path is a symlink. RED before the fix: every opened path
    // was the unresolved `dir`, so the handle pointed at the spelling rather than at the thing that
    // had been checked.
    const { loop, opened } = loopOverSeam((_root, dir) => ({
      ok: true as const,
      real: `${dir}__RESOLVED`,
    }));
    loop.armAll();

    expect(
      opened.length,
      "PREMISE: nothing was armed, so 'it opened the resolved path' is true of a loop that opened " +
        "no path at all",
    ).toBeGreaterThan(0);
    expect(
      opened.filter((p) => !p.endsWith("__RESOLVED")),
      "a handle was opened on the UNRESOLVED spelling after the RESOLVED path was the thing " +
        "vouched for. That is the check-then-open race insideRoot's docblock exists to forbid",
    ).toEqual([]);
  });

  it("asks the LIVENESS GATE about the path the handle is opened on (F-20, ledger row 206)", () => {
    // ONE CONTAINMENT DECISION, ONE SPELLING. `insideRoot` resolves the whole target and vouches
    // for `decision.real`; the arm opened that and then asked whether the UNRESOLVED `dir` existed,
    // so one decision had two consumers with a window between them.
    //
    // THE FINDING'S OWN BOUND, MEASURED RATHER THAN OVERSTATED (32-40 § 12). `existsSync` follows
    // links, so for every input except a swap landing between the two calls the two spellings
    // answer identically; the HANDLE — the thing that can hold a path open — was already on the
    // resolved spelling; and the watch callback ignores the `filename` argument, so no content
    // crosses the seam in either case. What this closes is a window, not a live hole.
    //
    // BOTH LISTS ARE RECORDED FROM THE ARM, not asserted in prose: the seam vouches for a path
    // that differs from the one it was handed, which is what `insideRoot` does whenever any
    // component of the path is a symlink, and the two consumers are then compared against each
    // other rather than against a spelling written here.
    const { loop, opened, probed } = loopOverSeam((_root, dir) => ({
      ok: true as const,
      real: `${dir}__RESOLVED`,
    }));
    loop.armAll();

    expect(
      probed.length,
      "PREMISE: the liveness gate was never asked about any path, so 'it asks about the resolved " +
        "one' is true of an arm that asked nothing",
    ).toBeGreaterThan(0);
    expect(
      opened.length,
      "PREMISE: no handle was opened, so the comparison below is between two empty lists",
    ).toBeGreaterThan(0);
    expect(
      [...new Set(probed)].sort(),
      "the liveness gate and the handle consume two DIFFERENT spellings of one containment " +
        "decision. The gate on the left is the path the arm asked about; the handle on the right " +
        "is the path it then opened. A decision taken once and consumed twice is a window between " +
        "the two calls, which is the shape insideRoot's docblock exists to forbid",
    ).toEqual([...new Set(opened)].sort());
  });

  it("a NON-containment refusal is recorded, rather than silently dropping the directory", () => {
    // `insideRoot` returns `ok: false` for OUTSIDE-ROOT, for an `EACCES` on an ancestor and for an
    // `ELOOP`. The written justification for recording nothing — "the reader already reported the
    // refusal against the source it belongs to" — is argued only for the CONTAINMENT code. An
    // EACCES the reader does not independently report left the directory off the low-latency path
    // with no record anywhere: round-2's CR-01, one code over.
    const { loop } = loopOverSeam(() => ({
      ok: false as const,
      code: "EACCES",
      message: "permission denied",
    }));
    loop.armAll();

    expect(loop.watchedDirs(), "nothing is armed on a directory that could not be resolved").toEqual(
      [],
    );
    const records = loop.watchErrors();
    expect(
      records.length,
      "an EACCES on a watched directory produced NO record on any channel. Nothing else reports " +
        "it, so the directory is silently off the low-latency path — a guard that goes quiet " +
        "rather than saying so",
    ).toBeGreaterThan(0);
    expect(
      records.every((r) => r.message.includes("EACCES")),
      "the record must name the CODE, so a reader can tell an unreadable directory from one that " +
        "left the tree",
    ).toBe(true);
  });

  it("a CONTAINMENT refusal stays silent, because the reader reports it against its own source", () => {
    // THE CONVERSE, and the reason the branch is on the code rather than on `ok`. A containment
    // refusal is the reader's finding about that source; a second entry here would be the same
    // finding twice in the list a consumer reads.
    const { loop } = loopOverSeam(() => ({
      ok: false as const,
      code: OUTSIDE_ROOT,
      message: "outside the root",
    }));
    loop.armAll();

    expect(loop.watchedDirs()).toEqual([]);
    expect(
      loop.watchErrors(),
      "a containment refusal was recorded by the LOOP as well as by the reader, so one finding " +
        "appears twice in the list a consumer reads",
    ).toEqual([]);
  });
});
