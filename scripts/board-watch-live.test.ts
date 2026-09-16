// board-watch-live.test.ts — the watch chain measured on a wall clock, against a real filesystem
// event, from outside the process.
//
// WHY THIS FILE EXISTS BESIDE `board-watch.test.ts` RATHER THAN INSIDE IT. That file drives the loop
// through the injected `LoopDeps` seam with fake timers, and says so in its own header: a test that
// sleeps for its assertion passes on an idle machine and fails on a loaded one. That argument is
// right about the LOGIC — which trigger calls which function — and it cannot answer the question
// `32-VERIFICATION.md` left open under `human_verification`: whether the directory watch, the
// mandatory poll floor and the debounce actually deliver a real edit onto a real screen inside a
// real multi-second window. Every existing case answers that by agreeing with its own harness. This
// file answers it by spawning the COMMITTED `scripts/board-dashboard.js`, writing the board the way
// this kit's own `atomicWrite` writes files, and timing what comes back on stdout.
//
// THE MEASUREMENT IS THE POINT, SO THE NUMBERS ARE PRINTED. Every case logs a `MEASURED ...` line
// carrying the platform, the node version and the milliseconds it observed. One recorded run of
// those lines is `.planning/phases/32-board-projector-cli-dashboard/32-22-LIVE-TRANSCRIPT.txt`.
//
// THE BUDGET, WITH ITS ARITHMETIC, BECAUSE A FUTURE CASE SPENDS FROM IT. Five spawned processes at
// a one-second poll period (`--interval 1000`, the CLI's hard floor — the ten-second production
// floor is unchanged and is not overridable downward past this):
//
//     premise             ~0.3 s   spawn, first document, stop
//     event path          ~2.1 s   spawn, sync to a tick (~1.0 s), edit, wait ≤ 0.75 s
//     poll path alone     ~3.3 s   spawn, sync to a tick, edit, wait ≤ 2.8 s
//     the watch record    ~3.0 s   spawn, sync, kill one watch, edit, then wait out one re-arm
//     debounce            ~2.5 s   spawn, sync to a tick, five edits, observe a 0.7 s window
//                        ───────
//                         ~11 s    plus process startup, under the ~15 s this file is allowed
//
// The event path's wait is a WORST CASE that is not spent: three consecutive measured runs came in
// at 272, 279 and 276 ms against a 750 ms deadline, so the row above costs ~1.6 s in practice. The
// deadline is derived from the poll period (see `EVENT_DEADLINE_MS`) and was widened from 600 ms in
// plan 32-35, because a case that reds by timeout prints no number and this file exists to print
// numbers.
//
// A live suite that outgrows its budget is one a future run disables, and a disabled measurement is
// worth less than an honest `UNKNOWN - verify`.
//
// EVERY WAIT CARRIES A DEADLINE AND FAILS WITH ITS MEASUREMENTS. There is no unbounded wait in this
// file: `waitForDocument` rejects with the elapsed time, the document count, the arrival offsets and
// the stderr tail, so a red says what it saw rather than timing out into a runner-level message.
//
// NOTHING HERE IS SKIPPED ON A PLATFORM. `process.platform` appears in FAILURE MESSAGES and in the
// printed measurements, never in a condition that decides whether a case runs. A conditional skip
// would convert an unmeasured platform into a green, which is the third threat in this plan's
// register (T-32-22-03). What this file measures is THE PLATFORM IT RAN ON, and it says which one
// that was; Windows `fs.watch` timing stays `UNKNOWN - verify` (Phase 33 / CAP-02) and this file
// neither asserts it nor pretends to have covered it.
//
// EVERY CASE WORKS ON A THROWAWAY COPY OUTSIDE THE REPOSITORY, and the `afterAll` below re-decides
// that from `git status` rather than trusting the discipline — the committed fixture tree is the
// input to plan 32-05's byte-for-byte golden.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DEBOUNCE_MS,
  FORCE_WATCH_ERROR_ENV,
  INTERVAL_HARD_FLOOR_MS,
  WATCH_DIRS,
} from "./board-dashboard.js";
// The PUBLISHED version, read from the module rather than retyped here (plan 32-33).
import { SCHEMA_VERSION } from "./board-model.js";

const ROOT = join(import.meta.dirname, "..");
const FIXTURE = join(ROOT, "scripts", "fixtures", "board-snapshot");
const DASHBOARD_JS = join(ROOT, "scripts", "board-dashboard.js");

/**
 * The poll period every case runs at: the CLI's hard floor, which exists so the poll path is
 * measurable inside a bounded run without weakening the ten-second production floor.
 */
const POLL_MS = INTERVAL_HARD_FLOOR_MS;

/** Process start plus one synchronous read. Generous: it bounds a hang, it does not time a machine. */
const PREMISE_DEADLINE_MS = 5_000;

/** One poll period plus slack, for the wait that synchronises a case against the emit clock. */
const SYNC_DEADLINE_MS = POLL_MS + 1_500;

/**
 * How far below the poll period the event-path deadline sits. A QUARTER OF A PERIOD, AND THE
 * NUMBER IS ARGUED RATHER THAN CHOSEN.
 *
 * It equals `DEBOUNCE_MS` — one debounce quantum of clearance below the tick — which is the jitter
 * allowance the synchronisation step needs to keep meaning what it says: a document arriving inside
 * the deadline should not be one the sync step mis-timed by a fraction of a period.
 */
const EVENT_DEADLINE_MARGIN_MS = 250;

/**
 * The EVENT-PATH deadline, DERIVED from the poll period rather than typed (WR-07).
 *
 * WHAT IT DECIDES, AND WHAT IT DOES NOT. It decides only when the WAIT GIVES UP. The attribution —
 * whether the document that arrived came from the watch or from a poll tick — is decided by the two
 * comparisons in the event-path case below, against `POLL_MS` and against `DEBOUNCE_MS`. Those two
 * are unchanged by this derivation and are what make the case a measurement.
 *
 * WHY DERIVED. The one property the attribution argument needs is that the deadline is STRICTLY
 * BELOW the period: a pass inside this window cannot have been delivered by the poll, because each
 * case synchronises itself against a poll tick before editing, so the next tick is a full period
 * away when the write happens. Expressed as `POLL_MS` minus a margin, that property cannot drift
 * when the period moves; typed as a literal, it could — and a literal is what it was.
 *
 * WHY WIDER THAN THE 600 ms IT REPLACES. The old band `[DEBOUNCE_MS, 600)` is 350 ms, and it has to
 * contain a filesystem event, a 250 ms debounce, a six-source re-read and a write, on whatever
 * machine the shared CI suite step runs on. Three consecutive measured runs on an idle darwin box
 * came in at 272, 279 and 276 ms — 2.15x headroom, recorded in
 * `.planning/phases/32-board-projector-cli-dashboard/32-35-RED-baseline.txt` § 5. A red at that
 * deadline arrives as a TIMEOUT, and a timeout prints no latency: it cannot say whether the watch
 * was slow, whether the poll answered instead, or whether the box was loaded. A red at a deadline
 * the comparisons can reach prints the number that failed, which is the difference between a
 * measurement and a flake. That is the whole of the change; nothing about attribution moves.
 */
const EVENT_DEADLINE_MS = POLL_MS - EVENT_DEADLINE_MARGIN_MS;

/** The poll period plus one period of slack: the safety net's window, with room for a loaded box. */
const POLL_DEADLINE_MS = 2 * POLL_MS + 800;

/** The debounce observation window: under one poll period, so no tick lands inside it. */
const BURST_WINDOW_MS = 700;

/** Five writes inside one debounce window. The assertion over them is an inequality, not a count. */
const BURST_EDITS = 5;

/** The literal the marker is appended to — a Backlog row title in the committed fixture board. */
const BOARD_ANCHOR = "Something in the backlog";

/** Where this run happened. It rides in every printed measurement and every failure message. */
const WHERE = `${process.platform}/${process.arch} node ${process.version}`;

type ReadErrorLike = {
  readonly source: string;
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

type LiveDocument = {
  readonly snapshot: { readonly schemaVersion: number };
  readonly readErrors: readonly ReadErrorLike[];
};

/** One complete `--json --watch` line, with the instant it arrived. */
type Doc = {
  /** Wall-clock arrival, the base every latency below is measured against. */
  readonly atEpoch: number;
  /** Arrival relative to the spawn, for the failure messages and the transcript. */
  readonly sinceStartMs: number;
  readonly text: string;
  /** `null` when the line did not parse — the premise case is what turns that into a red. */
  readonly value: LiveDocument | null;
};

type Waiter = {
  readonly what: string;
  readonly predicate: (doc: Doc) => boolean;
  readonly resolve: (doc: Doc) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
};

type Live = {
  readonly dir: string;
  /** The fixture board as it was before this run touched it; every edit is built from THIS. */
  readonly originalBoard: string;
  readonly docs: readonly Doc[];
  readonly stderrText: () => string;
  /** Wait for the next document satisfying `predicate`, or reject with the measured numbers. */
  readonly waitForDocument: (
    what: string,
    deadlineMs: number,
    predicate: (doc: Doc) => boolean,
  ) => Promise<Doc>;
  /**
   * The documents that arrived AFTER a recorded arrival index and no later than `untilEpoch`.
   *
   * INDEXED AT THE LOWER BOUND RATHER THAN TIMED, AND THE DIFFERENCE WAS MEASURED. A window whose
   * lower bound was the wall clock included the document the case had just synchronised against
   * whenever both landed in the same millisecond — so a mutation that emitted NOTHING for the burst
   * still showed a count of one, and the case failed for the wrong reason with a misleading number.
   * An index taken before the first write cannot be ambiguous about which side of the burst a
   * document fell on.
   */
  readonly docsSince: (index: number, untilEpoch: number) => readonly Doc[];
  /** Kill the child and remove the tree. Bounded; safe to call twice. */
  readonly stop: () => Promise<void>;
};

/** A bounded sleep. The only timer in this file that is not attached to a deadline. */
function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Monotonically increasing, so two temp siblings in one millisecond cannot collide. */
let tempSequence = 0;

/**
 * Spawn the COMPILED dashboard against a throwaway copy of the fixture, following its stdout.
 *
 * THE ARTIFACT A HOST RUNS IS THE ARTIFACT MEASURED. `scripts/board-dashboard.js` is spawned
 * directly with bare node — never the `.ts` through a loader — because the committed `.js` is what
 * a host machine executes and what the build-parity gate pins.
 *
 * `forcedDirs` names watched directories whose watcher throws on its first event, through the
 * module's own `GRUGOPS_BOARD_FORCE_WATCH_ERROR` seam. Production sets nothing and the default here
 * is nothing, so the unforced cases run exactly the program a user runs.
 */
function startLive(forcedDirs: readonly string[] = []): Live {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), "grugops-watch-live-"));
  cpSync(FIXTURE, dir, { recursive: true });
  const originalBoard = readFileSync(join(dir, "plans", "board.md"), "utf8");

  const env: NodeJS.ProcessEnv = { ...process.env };
  if (forcedDirs.length > 0) env[FORCE_WATCH_ERROR_ENV] = forcedDirs.join(",");

  const startedAt = Date.now();
  const proc = spawn(
    process.execPath,
    [DASHBOARD_JS, dir, "--watch", "--json", "--interval", String(POLL_MS)],
    { cwd: ROOT, env },
  );

  const docs: Doc[] = [];
  const waiters = new Set<Waiter>();
  let stderrText = "";
  let pending = "";
  let spawnFailure: string | null = null;

  proc.stdout.setEncoding("utf8");
  proc.stderr.setEncoding("utf8");
  proc.stderr.on("data", (chunk: string) => {
    stderrText += chunk;
  });
  proc.on("error", (e: Error) => {
    spawnFailure = e.message;
  });
  proc.stdout.on("data", (chunk: string) => {
    pending += chunk;
    for (;;) {
      const newline = pending.indexOf("\n");
      if (newline < 0) break;
      const line = pending.slice(0, newline);
      pending = pending.slice(newline + 1);
      if (line === "") continue;
      // A LINE THAT DOES NOT PARSE IS RECORDED, NOT THROWN. Throwing from a stream handler would
      // surface as an unhandled rejection with no measurements attached; the premise case reads
      // `value === null` and fails with the line in hand.
      let value: LiveDocument | null = null;
      try {
        value = JSON.parse(line) as LiveDocument;
      } catch {
        value = null;
      }
      const at = Date.now();
      const doc: Doc = { atEpoch: at, sinceStartMs: at - startedAt, text: line, value };
      docs.push(doc);
      for (const waiter of [...waiters]) {
        if (!waiter.predicate(doc)) continue;
        clearTimeout(waiter.timer);
        waiters.delete(waiter);
        waiter.resolve(doc);
      }
    }
  });

  const measuredFailure = (what: string, deadlineMs: number, waitedFrom: number): string =>
    `${what} did not arrive within ${deadlineMs} ms on ${WHERE}. ` +
    `Measured: ${Date.now() - waitedFrom} ms waited, ${docs.length} document(s) seen at ` +
    `+[${docs.map((d) => d.sinceStartMs).join(", ")}] ms since spawn, poll period ${POLL_MS} ms, ` +
    `debounce ${DEBOUNCE_MS} ms. ` +
    (spawnFailure === null ? "" : `The child reported a spawn error: ${spawnFailure}. `) +
    `stderr tail: ${stderrText.slice(-400)}`;

  const waitForDocument = (
    what: string,
    deadlineMs: number,
    predicate: (doc: Doc) => boolean,
  ): Promise<Doc> =>
    new Promise<Doc>((resolve, reject) => {
      const waitedFrom = Date.now();
      const waiter: Waiter = {
        what,
        predicate,
        resolve,
        reject,
        timer: setTimeout(() => {
          waiters.delete(waiter);
          reject(new Error(measuredFailure(what, deadlineMs, waitedFrom)));
        }, deadlineMs),
      };
      waiters.add(waiter);
    });

  let stopped = false;
  const stop = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;
    for (const waiter of [...waiters]) {
      clearTimeout(waiter.timer);
      waiters.delete(waiter);
    }
    const closed = new Promise<void>((resolve) => {
      if (proc.exitCode !== null || proc.signalCode !== null) {
        resolve();
        return;
      }
      proc.once("close", () => resolve());
    });
    proc.kill("SIGINT");
    // SIGINT EXERCISES THE SHIPPED HANDLER; SIGKILL IS THE BOUND BEHIND IT. A child that ignores the
    // first signal must not become a hung CI leg (T-32-22-02).
    const hardKill = setTimeout(() => proc.kill("SIGKILL"), 1_000);
    await Promise.race([closed, delay(2_500)]);
    clearTimeout(hardKill);
    rmSync(dir, { recursive: true, force: true });
  };

  return {
    dir,
    originalBoard,
    docs,
    stderrText: () => stderrText,
    waitForDocument,
    docsSince: (index, untilEpoch) => docs.slice(index).filter((d) => d.atEpoch <= untilEpoch),
    stop,
  };
}

/**
 * Write the board THE WAY THIS KIT WRITES FILES: a unique temp sibling in the same directory, then a
 * rename over the target (`scripts/context-io.ts` `atomicWrite`).
 *
 * THIS WRITE PATH IS THE REASON THE POLL IS MANDATORY. The RESEARCH probe measured a FILE-level
 * watch dying on the first such rename — it is bound to the replaced inode — while the
 * DIRECTORY-level watch survived. A case that edited in place would exercise neither fact.
 *
 * Returns the instant the atomic write BEGAN, which is the instant every latency below is measured
 * from. The temp-sibling creation is itself a directory event, so measuring from the rename would
 * let a debounce started by the creation look faster than the debounce window.
 */
function atomicEdit(live: Live, marker: string): number {
  const board = join(live.dir, "plans", "board.md");
  const body = live.originalBoard.replace(BOARD_ANCHOR, `${BOARD_ANCHOR} ${marker}`);
  const temp = `${board}.tmp-${process.pid}-${Date.now()}-${(tempSequence += 1)}`;
  const at = Date.now();
  writeFileSync(temp, body, "utf8");
  renameSync(temp, board);
  return at;
}

/** Assert the run started and its first document parsed. Every case begins here (T-32-22-03). */
async function premise(live: Live): Promise<Doc> {
  const first = await live.waitForDocument(
    "the first document of a spawned live run",
    PREMISE_DEADLINE_MS,
    () => true,
  );
  expect(
    first.value,
    `PREMISE: the first line of a live run did not parse on ${WHERE}, so every measurement below ` +
      `would be timing a process that is not the one under test. The line was: ` +
      `${first.text.slice(0, 200)}`,
  ).not.toBeNull();
  expect((first.value as LiveDocument).snapshot.schemaVersion).toBe(SCHEMA_VERSION);
  return first;
}

/**
 * Wait for the next document, whatever it is, so the case that follows starts from a known instant.
 *
 * WHY EVERY TIMING CASE DOES THIS FIRST. The dashboard emits on EVERY poll tick whether or not the
 * board changed, so documents arrive once a second regardless. Editing at an arbitrary moment can
 * therefore land microseconds before a tick, and a poll-delivered document would be credited to the
 * event path. Waiting for a document puts the case immediately AFTER a tick, so the next one is a
 * full period away and the attribution holds.
 *
 * AND THE WAIT NAMES WHAT ITS OWN FAILURE MEANS. Every case reaches this before it edits anything,
 * so a dashboard whose mandatory poll never started fails HERE, in all of them, rather than in each
 * case's own subject — measured under mutation M2 of this file's discrimination proof. The message
 * therefore says what an idle run with no document at all implies, so a reader of that red is not
 * left concluding that the event path depends on the poll.
 */
function syncToEmitClock(live: Live): Promise<Doc> {
  return live.waitForDocument(
    "a poll-tick document to synchronise the case against (an idle live run emits one per poll " +
      "period whether or not the board changed, so NO document at all means the MANDATORY poll " +
      "is not running)",
    SYNC_DEADLINE_MS,
    () => true,
  );
}

/** The watch failures a document is currently reporting. */
function watchRecords(doc: Doc): readonly ReadErrorLike[] {
  return (doc.value?.readErrors ?? []).filter((e) => e.code === "watch");
}

afterAll(() => {
  const status = spawnSync("git", ["status", "--porcelain", "scripts/fixtures/"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  expect(
    (status.stdout ?? "").trim(),
    "a live run left the committed fixture tree modified; every case here works on a temp copy " +
      "outside the repository, and plan 32-05's golden is a byte-for-byte function of exactly " +
      "these bytes",
  ).toBe("");
});

describe("board-dashboard live — the premise, before anything is timed against it", () => {
  it(
    "emits a first parseable document from a spawned process, and NAMES the platform it measured",
    async () => {
      const live = startLive();
      try {
        const first = await premise(live);
        // The platform is PRINTED rather than asserted. This suite measures one platform per run,
        // and the transcript records which one; a case that asserted a platform would be asserting
        // one it never ran on.
        console.log(
          `MEASURED premise: first document +${first.sinceStartMs} ms after spawn on ${WHERE} ` +
            `(poll period ${POLL_MS} ms, debounce ${DEBOUNCE_MS} ms, ` +
            `${WATCH_DIRS.length} watched directories)`,
        );
        expect(first.sinceStartMs).toBeLessThan(PREMISE_DEADLINE_MS);
      } finally {
        await live.stop();
      }
    },
    20_000,
  );
});

describe("board-dashboard live — the derived wait deadline still bounds something (WR-07)", () => {
  it("keeps the event-path deadline strictly below the poll period and strictly above the debounce", () => {
    // WHY THIS CASE EXISTS AT ALL. Deriving the deadline from `POLL_MS` removes one way to get it
    // wrong and adds another: a margin somebody widens later could swallow the property the
    // derivation was for. Without this, `EVENT_DEADLINE_MARGIN_MS = 0` would turn the event-path
    // case into a second poll measurement that still passes, and `= POLL_MS` would turn it into a
    // case that can only ever red. Both are silent. Here they are loud.
    //
    // It asserts the two INEQUALITIES, not the number. Pinning 750 would make this a restatement of
    // the arithmetic one line above it, which proves the arithmetic and nothing else.
    console.log(
      `MEASURED deadline derivation: EVENT_DEADLINE_MS=${EVENT_DEADLINE_MS} ms from ` +
        `POLL_MS=${POLL_MS} ms minus EVENT_DEADLINE_MARGIN_MS=${EVENT_DEADLINE_MARGIN_MS} ms, ` +
        `against DEBOUNCE_MS=${DEBOUNCE_MS} ms on ${WHERE}`,
    );
    expect(
      EVENT_DEADLINE_MS,
      `the event-path wait may run to ${EVENT_DEADLINE_MS} ms, which is at or past the ` +
        `${POLL_MS} ms poll period. A document arriving inside that window could be a poll tick, ` +
        `so the case would no longer separate the watch from the safety net — the property the ` +
        `derivation exists to express is gone`,
    ).toBeLessThan(POLL_MS);
    expect(
      EVENT_DEADLINE_MS,
      `the event-path wait gives up after ${EVENT_DEADLINE_MS} ms, at or before the ` +
        `${DEBOUNCE_MS} ms debounce the watch path must spend before it can deliver anything. The ` +
        `case could then only ever red, and it would red without having measured the watch`,
    ).toBeGreaterThan(DEBOUNCE_MS);
  });
});

describe("board-dashboard live — the EVENT path, through the write this kit actually uses (DASH-04)", () => {
  it(
    "delivers an atomic-rename edit in less than one poll period, and no faster than the debounce",
    async () => {
      const live = startLive();
      try {
        await premise(live);
        await syncToEmitClock(live);

        const marker = "LIVE-MARKER-EVENT";
        const wroteAt = atomicEdit(live, marker);
        const delivered = await live.waitForDocument(
          `a document carrying ${marker} after an atomic-rename write`,
          EVENT_DEADLINE_MS,
          (doc) => doc.text.includes(marker),
        );
        const latency = delivered.atEpoch - wroteAt;
        console.log(`MEASURED event path: ${latency} ms on ${WHERE}`);

        expect(
          latency,
          `the change took ${latency} ms, which is at or past the ${POLL_MS} ms poll period — a ` +
            `pass at that latency could have been a poll tick, so this case would no longer be ` +
            `measuring the watch at all (${WHERE})`,
        ).toBeLessThan(POLL_MS);
        // THE OTHER SIDE OF THE ATTRIBUTION. The debounce is 250 ms, so a WATCH-delivered document
        // cannot arrive sooner than that. Anything faster was delivered by a poll tick that landed
        // in the window, which would mean the synchronisation above failed and the number printed
        // is not the event path's.
        expect(
          latency,
          `the change arrived ${latency} ms after the write, sooner than the ${DEBOUNCE_MS} ms ` +
            `debounce allows for an event-driven re-read. Either the debounce is no longer in the ` +
            `path from an event to a re-read, or a poll tick answered and the synchronisation this ` +
            `case depends on did not hold — the debounce case below separates the two (${WHERE})`,
        ).toBeGreaterThanOrEqual(DEBOUNCE_MS);
      } finally {
        await live.stop();
      }
    },
    20_000,
  );
});

describe("board-dashboard live — the POLL path alone, with every watch forced dead (DASH-04)", () => {
  it(
    "still brings a real edit onto the screen within the poll period plus slack",
    async () => {
      const live = startLive(WATCH_DIRS.map((d) => d.rel));
      try {
        await premise(live);
        await syncToEmitClock(live);

        const marker = "LIVE-MARKER-POLL";
        const wroteAt = atomicEdit(live, marker);
        const delivered = await live.waitForDocument(
          `a document carrying ${marker} with every watch forced to fail`,
          POLL_DEADLINE_MS,
          (doc) => doc.text.includes(marker),
        );
        const latency = delivered.atEpoch - wroteAt;
        console.log(`MEASURED poll path (every watch forced dead): ${latency} ms on ${WHERE}`);

        expect(
          latency,
          `the safety net took ${latency} ms, past the ${POLL_DEADLINE_MS} ms this case allows ` +
            `(one poll period plus one of slack) on ${WHERE}`,
        ).toBeLessThanOrEqual(POLL_DEADLINE_MS);
        // THE SEAM IS PROVED TO HAVE DISABLED THE LOW-LATENCY PATH, rather than assumed to have.
        // If the watch were alive the debounced re-read would land inside the event-path deadline,
        // exactly as the case above measures it — so this is the converse assertion, and without it
        // the case would pass identically with the seam doing nothing.
        expect(
          latency,
          `the change arrived in ${latency} ms, inside the ${EVENT_DEADLINE_MS} ms event-path ` +
            `deadline — so a watch delivered it and the forced-error seam did not disable the ` +
            `low-latency path this case exists to do without (${WHERE})`,
        ).toBeGreaterThan(EVENT_DEADLINE_MS);

        // THE BOUNDARY, PINNED RATHER THAN REMEMBERED. A watch failure that the NEXT TICK REPAIRS
        // reaches no document at all: the poll tick runs `armAll()` and then `refresh()`, and a
        // successful re-arm deletes the directory's record before anything is emitted (WR-06 — the
        // record is a state, and a repaired watch has nothing current to report). Every watch in
        // this run failed and was repaired that way, so every document is recordless. The case
        // below is the other half: a failure observed BEFORE its re-arm, published in the document.
        //
        // This assertion is what makes that a measured property. If it ever reds, the ordering
        // changed or a re-arm is now failing persistently — both are things to look at rather than
        // to absorb by loosening the line.
        const carrying = live.docs.filter((doc) => watchRecords(doc).length > 0);
        expect(
          carrying.map((doc) => doc.sinceStartMs),
          `a document carried a watch record even though every forced failure here is repaired by ` +
            `the same tick that emits — so either the re-arm no longer precedes the emit, or a ` +
            `re-arm is failing for a reason this case did not force (${WHERE})`,
        ).toEqual([]);
      } finally {
        await live.stop();
      }
    },
    20_000,
  );
});

describe("board-dashboard live — a watch failure is a DIAGNOSABLE state in the document (D-14, WR-06)", () => {
  it(
    "publishes the failed directory's record, then DROPS it when the next poll tick re-arms",
    async () => {
      // ONE DIRECTORY FORCED, NOT ALL SIX, AND THE REASON IS A MEASURED ONE. The poll tick runs
      // `armAll()` and THEN `refresh()`, and a successful re-arm deletes the directory's record
      // (WR-06: the record is a state, and a repaired watch has nothing to report). So a failure
      // that the next tick repairs is never carried by a document the poll itself emits — measured
      // in the case above, where every watch is forced and no document carries a record. To OBSERVE
      // the record a document has to be emitted between the failure and the re-arm, and the thing
      // that emits it is a still-living sibling watch: `.grugops/context` is forced dead, `plans`
      // is not, and the edit to `plans` is what publishes the context directory's record.
      const forcedDir = ".grugops/context";
      const live = startLive([forcedDir]);
      try {
        await premise(live);
        await syncToEmitClock(live);

        // Kill the context watch: its first event fires the seam, which closes the handle and
        // records the failure. This write is a plain one — it is the EVENT that matters here, not
        // the write path — and it lands in a scratch copy, never in the committed fixture.
        writeFileSync(join(live.dir, forcedDir, "live-probe.txt"), "live probe\n", "utf8");
        await delay(100);

        const marker = "LIVE-MARKER-WATCHERR";
        const wroteAt = atomicEdit(live, marker);
        const delivered = await live.waitForDocument(
          `a document carrying ${marker} and the ${forcedDir} watch record`,
          EVENT_DEADLINE_MS + 200,
          (doc) => doc.text.includes(marker) && watchRecords(doc).length > 0,
        );
        const records = watchRecords(delivered);
        console.log(
          `MEASURED watch record: published ${delivered.atEpoch - wroteAt} ms after the write, ` +
            `${records.length} record(s), path=${records.map((r) => r.path).join(",")} on ${WHERE}`,
        );

        expect(records.map((r) => r.path)).toContain(forcedDir);
        const record = records.find((r) => r.path === forcedDir) as ReadErrorLike;
        expect(record.code).toBe("watch");
        expect(
          record.message,
          "the record promises a re-arm on the next poll tick, and the next assertion is what " +
            "holds it to that promise",
        ).toContain("re-armed on the next poll tick");
        expect(
          live.stderrText(),
          "a watch failure is a diagnostic, so it reaches stderr as well as the document",
        ).toContain(forcedDir);

        // AND THE PROMISE IS KEPT, MEASURED. The next tick re-arms the directory and the record is
        // gone from the documents that follow — the half of WR-06 that a count of records cannot
        // catch, because a frame that keeps reporting a repaired watch is also "carrying a record".
        const repaired = await live.waitForDocument(
          "a document emitted after the next poll tick re-armed the directory",
          2 * POLL_MS + 800,
          (doc) => doc.text.includes(marker) && watchRecords(doc).length === 0,
        );
        console.log(
          `MEASURED watch record cleared: ${repaired.atEpoch - wroteAt} ms after the write on ${WHERE}`,
        );
      } finally {
        await live.stop();
      }
    },
    25_000,
  );
});

describe("board-dashboard live — the DEBOUNCE, over a burst of real writes (DASH-04)", () => {
  it(
    `coalesces ${BURST_EDITS} atomic-rename writes into FEWER documents, and at least one`,
    async () => {
      const live = startLive();
      try {
        await premise(live);
        const sync = await syncToEmitClock(live);

        // The window opens immediately after a tick and closes before the next one, so every
        // document counted inside it is event-driven. A window that spanned a tick would count a
        // poll emit as a debounce failure.
        const before = live.docs.length;
        const burstStart = Date.now();
        let lastMarker = "";
        for (let i = 1; i <= BURST_EDITS; i += 1) {
          lastMarker = `LIVE-MARKER-BURST-${i}`;
          atomicEdit(live, lastMarker);
        }
        const burstWrittenFor = Date.now() - burstStart;
        await delay(BURST_WINDOW_MS);
        const inWindow = live.docsSince(before, burstStart + BURST_WINDOW_MS);
        console.log(
          `MEASURED debounce: ${BURST_EDITS} writes in ${burstWrittenFor} ms produced ` +
            `${inWindow.length} document(s) in the ${BURST_WINDOW_MS} ms window on ${WHERE} ` +
            `(sync tick at +${sync.sinceStartMs} ms)`,
        );

        expect(
          burstWrittenFor,
          `the ${BURST_EDITS} writes took ${burstWrittenFor} ms, longer than the ${DEBOUNCE_MS} ms ` +
            `debounce window they are supposed to fall inside — this case is no longer measuring ` +
            `coalescing of a burst (${WHERE})`,
        ).toBeLessThan(DEBOUNCE_MS);
        // AN INEQUALITY OVER MEASURED COUNTS, NEVER AN EXACT NUMBER. A wall-clock test that
        // asserted "exactly one" is a flake generator, and a flaky safety test gets deleted.
        expect(
          inWindow.length,
          `no document arrived in the ${BURST_WINDOW_MS} ms after ${BURST_EDITS} real writes, so ` +
            `the burst reached the screen not at all inside the window (${WHERE})`,
        ).toBeGreaterThanOrEqual(1);
        expect(
          inWindow.length,
          `${BURST_EDITS} writes produced ${inWindow.length} documents inside one ` +
            `${BURST_WINDOW_MS} ms window, which is the un-debounced count — the burst was not ` +
            `coalesced (${WHERE})`,
        ).toBeLessThan(BURST_EDITS);
        const last = inWindow[inWindow.length - 1] as Doc;
        expect(
          last.text,
          "the coalesced re-read must carry the FINAL state of the burst, not an intermediate one",
        ).toContain(lastMarker);
      } finally {
        await live.stop();
      }
    },
    20_000,
  );
});
