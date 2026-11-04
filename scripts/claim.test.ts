// claim.test.ts — behavioral oracle for the SC-3 file-based queue + atomic work-claim primitive.
//
// Drives the COMMITTED compiled artifact scripts/claim.js (never the .ts): imports the compiled
// .js for the exported functions (claimTask / transition / sweepStale) and exercises them against
// mkdtempSync temp queue roots — nothing is written into the committed tree.
//
// Proves, per the Phase-20 Validation Architecture (CLAIM-01/02, SC-3) and the DOGF-02 seed:
//   SC-3a exclusivity      : claimTask(root, "t1", "engineer") → true (mkdirSync succeeds); a SECOND
//                            claimTask(root, "t1", "qe") → false (EEXIST = claim lost, NOT an error).
//   SC-3b real-error       : claiming into a MISSING claimed/ parent throws (ENOENT) — a real error
//                            is NEVER swallowed into a false "lost".
//   SC-3c rename transitions: a subtask file moves pending/<task>.md → claimed/<task>/<task>.md →
//                            done/<task>.md by atomic rename; at each step the file is gone from the
//                            source dir and present in the destination dir.
//   claim.md record        : a won claim writes claimed/<task>/claim.md carrying by / at / task.
//   TTL sweep (DOGF-02)    : sweepStale reclaims a claim whose claim.md `at` is older than the TTL
//                            (claim dir removed, returned list includes the task, subtask back in
//                            pending/) and does NOT reclaim a fresh claim — wall-clock TTL only.
//   Lifecycle (RUN-01)     : claimPending and completeTask take one subtask pending → claimed → done
//                            and release the claim directory, so the in-flight log empties.
//   Queue entries (T-41-03): a link or a FIFO at claim.md is never opened.
//   The record (D-03, D-30): claim.md gains optional agent: and level: lines, and agent equals by.
//   The rules the CLI needs: the owner rule, the free count, the config read, the ref: read, the
//                            note-since-claim comparison and the sweep release.
//
// No-fabrication: every path proves BOTH the winning/pass side AND the losing/fail side.
// Vitest globals:false → import explicitly. Ships RED until the committed claim.js lands
// (correct test-first sequencing).

import { describe, it, expect, afterAll } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { skipLine, stageShapeOrSkip } from "./check-platform-shapes.js";

const ROOT = join(import.meta.dirname, "..");
const CLAIM_JS = join(ROOT, "scripts", "claim.js");
const BOARD_READ_JS = join(ROOT, "scripts", "board-read.js");
const MODEL_TIERS_JS = join(ROOT, "scripts", "model-tiers.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Build a queue root with pending/, claimed/, done/ and (optionally) seed a pending subtask file.
function makeQueueRoot(prefix: string, pendingTasks: string[] = []): string {
  const root = freshTmp(prefix);
  for (const sub of ["pending", "claimed", "done"]) {
    mkdirSync(join(root, sub), { recursive: true });
  }
  for (const t of pendingTasks) {
    writeFileSync(join(root, "pending", `${t}.md`), `# subtask ${t}\nref: .grugops/context/${t}/\n`);
  }
  return root;
}

// Import the compiled .js. The committed .js must exist for this to resolve — the test-first contract.
const mod: typeof import("./claim.js") = await import(pathToFileURL(CLAIM_JS).href);

describe("claim.js — mkdirSync atomic claim exclusivity (SC-3a / CLAIM-02)", () => {
  it("first claimant wins (true); a second claimant on the same task loses (false, EEXIST)", () => {
    const root = makeQueueRoot("claim-excl-");
    expect(mod.claimTask(root, "t1", "engineer")).toBe(true);
    // Second claimant on the SAME task: EEXIST = claim lost, returns false — not an error.
    expect(mod.claimTask(root, "t1", "qe")).toBe(false);
  });

  it("a won claim writes claimed/<task>/claim.md carrying by / at / task", () => {
    const root = makeQueueRoot("claim-record-");
    expect(mod.claimTask(root, "t-rec", "engineer")).toBe(true);
    const claimMd = join(root, "claimed", "t-rec", "claim.md");
    expect(existsSync(claimMd)).toBe(true);
    const text = readFileSync(claimMd, "utf8");
    expect(text).toMatch(/^by:\s*engineer$/m);
    expect(text).toMatch(/^task:\s*t-rec$/m);
    expect(text).toMatch(/^at:\s*.+$/m);
  });
});

describe("claim.js — real-error distinction (SC-3b / no-fabrication)", () => {
  it("claiming into a MISSING claimed/ parent throws (ENOENT) — not swallowed into a false lost", () => {
    // A queue root with NO claimed/ dir: mkdirSync of claimed/<task> throws ENOENT (parent missing).
    const root = freshTmp("claim-noparent-");
    mkdirSync(join(root, "pending"), { recursive: true }); // deliberately omit claimed/
    expect(() => mod.claimTask(root, "t-err", "engineer")).toThrow();
  });

  it("rejects a path-traversal task name before any join (T-20-04)", () => {
    const root = makeQueueRoot("claim-traversal-");
    expect(() => mod.claimTask(root, "../escape", "engineer")).toThrow();
    expect(() => mod.claimTask(root, "..", "engineer")).toThrow();
  });
});

describe("claim.js — pending→claimed→done atomic-rename transitions (SC-3c / CLAIM-01)", () => {
  it("moves the subtask file pending → claimed → done; gone from source, present at destination", () => {
    const root = makeQueueRoot("claim-transitions-", ["job"]);
    const pending = join(root, "pending", "job.md");
    expect(existsSync(pending)).toBe(true);

    // Claim moves the subtask into the claim directory.
    expect(mod.claimTask(root, "job", "engineer")).toBe(true);
    mod.transition(root, "job", "pending", "claimed");
    expect(existsSync(pending)).toBe(false); // gone from pending/
    const claimed = join(root, "claimed", "job", "job.md");
    expect(existsSync(claimed)).toBe(true); // present under claimed/job/

    // Complete moves the subtask into done/.
    mod.transition(root, "job", "claimed", "done");
    expect(existsSync(claimed)).toBe(false); // gone from claimed/job/
    const done = join(root, "done", "job.md");
    expect(existsSync(done)).toBe(true); // present in done/
  });
});

describe("claim.js — explicit generous-TTL stale sweep (DOGF-02 seed)", () => {
  it("reclaims a TTL-expired claim (claim dir gone, returned, subtask back in pending) by wall-clock only", () => {
    const root = makeQueueRoot("claim-sweep-stale-", ["stale-job"]);
    // Claim it and move the subtask into the claim dir.
    expect(mod.claimTask(root, "stale-job", "engineer")).toBe(true);
    mod.transition(root, "stale-job", "pending", "claimed");
    // Backdate the claim.md `at` far into the past so any sane TTL treats it as expired.
    const claimMd = join(root, "claimed", "stale-job", "claim.md");
    const old = readFileSync(claimMd, "utf8").replace(/^at:.*$/m, "at: 2000-01-01T00:00:00.000Z");
    writeFileSync(claimMd, old);

    // Sweep with a generous TTL (1 hour); the 2000-dated claim is far past it.
    const reclaimed = mod.sweepStale(root, 60 * 60 * 1000);
    expect(reclaimed).toContain("stale-job");
    expect(existsSync(join(root, "claimed", "stale-job"))).toBe(false); // claim released
    expect(existsSync(join(root, "pending", "stale-job.md"))).toBe(true); // subtask returned to pending
  });

  it("does NOT reclaim a fresh claim (conservative — proves a real no-op path)", () => {
    const root = makeQueueRoot("claim-sweep-fresh-", ["fresh-job"]);
    expect(mod.claimTask(root, "fresh-job", "engineer")).toBe(true);
    mod.transition(root, "fresh-job", "pending", "claimed");
    // claim.md `at` is "now"; a 1-hour TTL must NOT reclaim it.
    const reclaimed = mod.sweepStale(root, 60 * 60 * 1000);
    expect(reclaimed).not.toContain("fresh-job");
    expect(existsSync(join(root, "claimed", "fresh-job"))).toBe(true); // claim still held
  });
});

describe("claim.js — queue-lock-DoS defense via by-injection (CR-02)", () => {
  // `by` is written RAW into claim.md frontmatter and is never validated. A newline-injected `by`
  // smuggles a far-future `at:` line ahead of the real one; sweepStale's first-match regex returns
  // the forged future timestamp, so the stale claim is NEVER reclaimed — a permanent queue lock.
  // claimTask MUST reject any `by` carrying an embedded newline.
  it("claimTask rejects a newline-injected `by` (no smuggled at: line)", () => {
    const root = makeQueueRoot("claim-by-injection-", ["dos-job"]);
    const injected = "attacker\nat: 2999-01-01T00:00:00.000Z";
    expect(() => mod.claimTask(root, "dos-job", injected)).toThrow(
      /single-line|newline/i,
    );
  });

  // Defense-in-depth: a claim.md that ALREADY carries more than one `at:` line (tampered or
  // malformed — the design writes exactly one) must NOT be trusted to the first match and left
  // un-sweepable. A multi-`at` record is treated as tampered and reclaimed regardless of which
  // timestamp the regex would have matched.
  it("sweepStale reclaims a tampered claim carrying multiple at: lines (not un-sweepable)", () => {
    const root = makeQueueRoot("claim-multi-at-", ["tampered-job"]);
    expect(mod.claimTask(root, "tampered-job", "engineer")).toBe(true);
    mod.transition(root, "tampered-job", "pending", "claimed");
    const claimMd = join(root, "claimed", "tampered-job", "claim.md");
    // Hand-write a tampered record: a forged far-future `at:` placed BEFORE the real stale one,
    // exactly the on-disk shape a by-injection would have produced.
    writeFileSync(
      claimMd,
      "---\nby: attacker\nat: 2999-01-01T00:00:00.000Z\n" +
        "at: 2000-01-01T00:00:00.000Z\ntask: tampered-job\n---\n",
    );
    const reclaimed = mod.sweepStale(root, 60 * 60 * 1000);
    expect(reclaimed).toContain("tampered-job"); // tampered claim is reclaimed, not locked forever
    expect(existsSync(join(root, "claimed", "tampered-job"))).toBe(false); // claim released
  });
});

describe("claim.js — claimPending: one call claims and moves the subtask (RUN-01, D-04)", () => {
  it("claims a pending subtask: the claim record and the subtask sit in claimed/, pending/ is empty", () => {
    const root = makeQueueRoot("claim-pending-", ["t"]);
    const outcome = mod.claimPending(root, "t", "grugops-qe-e2e");
    expect(outcome.kind).toBe("claimed");
    expect(existsSync(join(root, "claimed", "t", "t.md"))).toBe(true);
    expect(existsSync(join(root, "claimed", "t", "claim.md"))).toBe(true);
    expect(existsSync(join(root, "pending", "t.md"))).toBe(false);
    // The outcome carries the same `at` the record holds.
    if (outcome.kind !== "claimed") throw new Error("unreachable");
    expect(readFileSync(join(root, "claimed", "t", "claim.md"), "utf8")).toContain(`at: ${outcome.at}\n`);
  });

  it("a second claim on one task is lost, never a refusal, although the pending file is gone (D-08)", () => {
    const root = makeQueueRoot("claim-pending-lost-", ["t"]);
    expect(mod.claimPending(root, "t", "grugops-qe-e2e").kind).toBe("claimed");
    expect(mod.claimPending(root, "t", "grugops-security-nfr")).toEqual({ kind: "lost" });
    expect(existsSync(join(root, "claimed", "t", "t.md"))).toBe(true); // the winner's claim stands
  });

  it("refuses a task with no pending subtask, names it, and leaves no claim directory", () => {
    const root = makeQueueRoot("claim-pending-missing-");
    const outcome = mod.claimPending(root, "t", "grugops-qe-e2e");
    expect(outcome.kind).toBe("refused");
    if (outcome.kind !== "refused") throw new Error("unreachable");
    expect(outcome.reason).toContain("pending/t.md");
    expect(existsSync(join(root, "claimed", "t"))).toBe(false);
  });

  it("refuses a task already in done/ before it makes a claim directory", () => {
    const root = makeQueueRoot("claim-pending-done-", ["t"]);
    writeFileSync(join(root, "done", "t.md"), "# finished\n");
    expect(mod.claimPending(root, "t", "grugops-qe-e2e").kind).toBe("refused");
    expect(existsSync(join(root, "claimed", "t"))).toBe(false);
    expect(existsSync(join(root, "pending", "t.md"))).toBe(true);
  });

  it("a real failure is a refusal, never a false lost (a missing claimed/ directory)", () => {
    const root = freshTmp("claim-pending-noparent-");
    mkdirSync(join(root, "pending"), { recursive: true });
    writeFileSync(join(root, "pending", "t.md"), "# subtask t\n");
    expect(mod.claimPending(root, "t", "grugops-qe-e2e").kind).toBe("refused");
    expect(existsSync(join(root, "pending", "t.md"))).toBe(true);
  });

  it("throws on a path-traversal task name before any join (T-20-04)", () => {
    const root = makeQueueRoot("claim-pending-traversal-");
    expect(() => mod.claimPending(root, "../escape", "grugops-qe-e2e")).toThrow();
    expect(() => mod.claimPending(root, "..", "grugops-qe-e2e")).toThrow();
  });
});

describe("claim.js — completeTask: done releases the claim (RUN-01, Pitfall 1)", () => {
  it("moves the subtask to done/ and removes the claim directory", () => {
    const root = makeQueueRoot("claim-done-", ["t"]);
    expect(mod.claimPending(root, "t", "grugops-qe-e2e").kind).toBe("claimed");
    expect(mod.completeTask(root, "t")).toEqual({ kind: "done" });
    expect(existsSync(join(root, "done", "t.md"))).toBe(true);
    expect(existsSync(join(root, "claimed", "t"))).toBe(false);
    expect(readdirSync(join(root, "claimed"))).toEqual([]);
  });

  it("refuses a task with no claim directory", () => {
    const root = makeQueueRoot("claim-done-unclaimed-", ["t"]);
    expect(mod.completeTask(root, "t").kind).toBe("refused");
    expect(existsSync(join(root, "pending", "t.md"))).toBe(true);
  });

  it("finishes a crash between the rename and the removal: the claim is released", () => {
    const root = makeQueueRoot("claim-done-crash-");
    mkdirSync(join(root, "claimed", "t"));
    writeFileSync(join(root, "claimed", "t", "claim.md"), "---\nby: a\nat: 2026-06-21T10:00:00.000Z\ntask: t\n---\n");
    writeFileSync(join(root, "done", "t.md"), "# finished\n");
    expect(mod.completeTask(root, "t")).toEqual({ kind: "done" });
    expect(existsSync(join(root, "claimed", "t"))).toBe(false);
    expect(existsSync(join(root, "done", "t.md"))).toBe(true);
  });

  it("refuses when a subtask sits in both claimed/ and done/, and changes neither", () => {
    const root = makeQueueRoot("claim-done-both-", ["t"]);
    expect(mod.claimPending(root, "t", "grugops-qe-e2e").kind).toBe("claimed");
    writeFileSync(join(root, "done", "t.md"), "# an earlier record\n");
    expect(mod.completeTask(root, "t").kind).toBe("refused");
    expect(readFileSync(join(root, "done", "t.md"), "utf8")).toBe("# an earlier record\n");
    expect(existsSync(join(root, "claimed", "t", "t.md"))).toBe(true);
  });

  it("refuses when the subtask is in neither claimed/ nor done/, and keeps the claim", () => {
    const root = makeQueueRoot("claim-done-neither-");
    mkdirSync(join(root, "claimed", "t"));
    expect(mod.completeTask(root, "t").kind).toBe("refused");
    expect(existsSync(join(root, "claimed", "t"))).toBe(true);
  });

  it("throws on a path-traversal task name before any join (T-20-04)", () => {
    const root = makeQueueRoot("claim-done-traversal-");
    expect(() => mod.completeTask(root, "../escape")).toThrow();
  });
});

describe("claim.js — queue entries are asked by lstat, never opened blind (T-41-03)", () => {
  const STALE = "---\nby: a\nat: 2000-01-01T00:00:00.000Z\ntask: t\n---\n";

  // Runs the render and the sweep in a child process with a deadline: a FIFO opened for reading
  // blocks until a writer comes, and a blocked synchronous read inside this worker could never time out.
  function renderAndSweepInChild(root: string): { status: number | null; signal: string | null } {
    const script =
      `const m = await import(${JSON.stringify(pathToFileURL(CLAIM_JS).href)});` +
      `m.renderNowRunning(${JSON.stringify(root)});` +
      `m.sweepStale(${JSON.stringify(root)}, 1);`;
    const r = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8",
      timeout: 10_000,
    });
    return { status: r.status, signal: r.signal };
  }

  it("a link at claimed/<task>/claim.md is never read: the render skips it and the sweep leaves it", () => {
    const root = makeQueueRoot("claim-link-");
    const elsewhere = join(freshTmp("claim-link-target-"), "record.md");
    writeFileSync(elsewhere, STALE);
    mkdirSync(join(root, "claimed", "t"));
    symlinkSync(elsewhere, join(root, "claimed", "t", "claim.md"));

    mod.renderNowRunning(root);
    expect(readFileSync(join(root, "now-running.md"), "utf8")).not.toContain("| t |");
    expect(mod.sweepStale(root, 1)).toEqual([]);
    expect(existsSync(join(root, "claimed", "t"))).toBe(true);
  });

  it(
    "a FIFO at claimed/<task>/claim.md is never opened: the render skips it and the sweep leaves it",
    () => {
      const root = makeQueueRoot("claim-fifo-");
      mkdirSync(join(root, "claimed", "t"));
      const skipped = stageShapeOrSkip(
        "FIFO",
        join(root, "claimed", "t", "claim.md"),
        "scripts/claim.test.ts: a FIFO at the claim record (plan 41-01)",
      );
      if (skipped !== null) {
        console.warn(skipLine(skipped, "the symlink case beside this one (the same lstat rule)"));
        return;
      }

      expect(renderAndSweepInChild(root)).toEqual({ status: 0, signal: null });
      expect(readFileSync(join(root, "now-running.md"), "utf8")).not.toContain("| t |");
      expect(existsSync(join(root, "claimed", "t"))).toBe(true);
    },
    20_000,
  );

  it("a keeper file in claimed/ is no claim: the render and the sweep pass over it", () => {
    const root = makeQueueRoot("claim-keeper-");
    writeFileSync(join(root, "claimed", ".gitkeep"), "");
    expect(() => mod.renderNowRunning(root)).not.toThrow();
    expect(mod.sweepStale(root, 1)).toEqual([]);
    expect(existsSync(join(root, "claimed", ".gitkeep"))).toBe(true);
  });
});

describe("claim.js — the embed hazards are gone (research Pitfall 2)", () => {
  const claimTs = readFileSync(join(ROOT, "scripts", "claim.ts"), "utf8");

  it("the task-name pattern equals the one in scripts/context-io.ts, read as text", () => {
    const contextIo = readFileSync(join(ROOT, "scripts", "context-io.ts"), "utf8");
    const line = /^const TASK_NAME_RE = \/(.+)\/;$/m.exec(contextIo);
    expect(line).not.toBeNull();
    expect(mod.QUEUE_TASK_NAME_RE?.source).toBe(line?.[1]);
  });

  it("scripts/claim.ts holds no existence test: a failed read never reads as nothing there", () => {
    expect(claimTs).not.toMatch(/\bexistsSync\b/);
  });

  it("renderNowRunning takes its queue root from the caller, with no default", () => {
    expect(claimTs).toMatch(/export function renderNowRunning\(queueRoot: string\): void/);
    expect(mod.renderNowRunning.length).toBe(1);
  });
});

describe("claim.js — the record carries agent and level (D-03, D-30, T-41-01)", () => {
  it("claimPending writes by, agent, level, at and task in that order, with one at line", () => {
    const root = makeQueueRoot("claim-record-fields-", ["t"]);
    const outcome = mod.claimPending(root, "t", "grugops-software-engineer-mid", "mid");
    expect(outcome.kind).toBe("claimed");
    const text = readFileSync(join(root, "claimed", "t", "claim.md"), "utf8");
    const keys = text.split("\n").filter((l) => /^[a-z]+:/.test(l)).map((l) => l.split(":")[0]);
    expect(keys).toEqual(["by", "agent", "level", "at", "task"]);
    expect(text).toMatch(/^level: mid$/m);
    expect(text.match(/^at:/gm)).toHaveLength(1);
  });

  it("every record claimPending writes has agent equal to by, with or without a level", () => {
    const root = makeQueueRoot("claim-record-invariant-", ["a", "b"]);
    mod.claimPending(root, "a", "grugops-qe-e2e");
    mod.claimPending(root, "b", "grugops-software-engineer-senior", "senior");
    for (const task of ["a", "b"]) {
      const fields = mod.claimRecordFields(readFileSync(join(root, "claimed", task, "claim.md"), "utf8"));
      expect(fields.kind).toBe("record");
      if (fields.kind !== "record") throw new Error("unreachable");
      expect(fields.agent).not.toBe("");
      expect(fields.agent).toBe(fields.by);
    }
  });

  it("claimPending with no level writes no level line", () => {
    const root = makeQueueRoot("claim-record-nolevel-", ["t"]);
    mod.claimPending(root, "t", "grugops-qe-e2e");
    expect(readFileSync(join(root, "claimed", "t", "claim.md"), "utf8")).not.toMatch(/^level:/m);
  });

  it("a claimTask record with no fields has no agent or level line, and still renders and sweeps", () => {
    const root = makeQueueRoot("claim-record-old-", ["t"]);
    expect(mod.claimTask(root, "t", "engineer")).toBe(true);
    const claimMd = join(root, "claimed", "t", "claim.md");
    const text = readFileSync(claimMd, "utf8");
    expect(text).not.toMatch(/^agent:/m);
    expect(text).not.toMatch(/^level:/m);
    mod.renderNowRunning(root);
    expect(readFileSync(join(root, "now-running.md"), "utf8")).toMatch(/^\| t \| engineer \|  \|  \| /m);
    writeFileSync(claimMd, text.replace(/^at:.*$/m, "at: 2000-01-01T00:00:00.000Z"));
    expect(mod.sweepStale(root, 60_000)).toEqual(["t"]);
  });

  it("claimTask refuses a newline in agent or level, so neither can smuggle an at line (T-41-01)", () => {
    const root = makeQueueRoot("claim-record-injection-");
    const forged = "x\nat: 2999-01-01T00:00:00.000Z";
    expect(() => mod.claimTask(root, "a", "engineer", { agent: forged })).toThrow(/single-line|newline/i);
    expect(() => mod.claimTask(root, "b", "engineer", { level: forged })).toThrow(/single-line|newline/i);
    expect(existsSync(join(root, "claimed", "a"))).toBe(false);
    expect(existsSync(join(root, "claimed", "b"))).toBe(false);
  });

  it("claimPending refuses a level outside CLAIM_LEVELS, and no claim directory exists afterwards", () => {
    const root = makeQueueRoot("claim-record-badlevel-", ["t"]);
    expect(mod.claimPending(root, "t", "grugops-qe-e2e", "principal").kind).toBe("refused");
    expect(mod.claimPending(root, "t", "grugops-qe-e2e", "").kind).toBe("refused");
    expect(existsSync(join(root, "claimed", "t"))).toBe(false);
    expect(existsSync(join(root, "pending", "t.md"))).toBe(true);
  });

  it("CLAIM_LEVELS equals the level rows of scripts/model-tiers.ts", async () => {
    const tiers: typeof import("./model-tiers.js") = await import(pathToFileURL(MODEL_TIERS_JS).href);
    expect([...mod.CLAIM_LEVELS]).toEqual(tiers.LEVELS.map((row) => row.level));
  });

  it("the board reader takes a record with agent and level lines as one row (D-30)", async () => {
    const board: typeof import("./board-read.js") = await import(pathToFileURL(BOARD_READ_JS).href);
    const repo = freshTmp("claim-record-board-");
    const queueRoot = join(repo, ".grugops", "queue");
    for (const sub of ["pending", "claimed", "done"]) mkdirSync(join(queueRoot, sub), { recursive: true });
    writeFileSync(join(queueRoot, "pending", "t.md"), "# subtask t\n");
    const outcome = mod.claimPending(queueRoot, "t", "grugops-software-engineer-mid", "mid");
    if (outcome.kind !== "claimed") throw new Error("the claim was not made");

    const result = board.readSnapshot(repo);
    const queue = result.snapshot.sources.queue;
    expect(queue.source === "ok" ? queue.value : []).toEqual([
      { task: "t", by: "grugops-software-engineer-mid", at: outcome.at },
    ]);
    expect(result.readErrors.filter((e) => e.source === "queue")).toEqual([]);
  });
});

describe("claim.js — claimRecordFields: one reading of a record (T-41-02)", () => {
  it("returns the fields, with an absent optional line as an empty string", () => {
    expect(
      mod.claimRecordFields("---\nby: a\nagent: a\nlevel: mid\nat: 2026-06-21T10:00:00.000Z\ntask: t\n---\n"),
    ).toEqual({ kind: "record", by: "a", agent: "a", level: "mid", at: "2026-06-21T10:00:00.000Z" });
    expect(mod.claimRecordFields("---\nby: a\nat: 2026-06-21T10:00:00.000Z\ntask: t\n---\n")).toEqual({
      kind: "record",
      by: "a",
      agent: "",
      level: "",
      at: "2026-06-21T10:00:00.000Z",
    });
  });

  it("reports two at lines as tampered and none as no-at", () => {
    expect(mod.claimRecordFields("by: a\nat: 2026-01-01\nat: 2099-01-01\n")).toEqual({ kind: "tampered" });
    expect(mod.claimRecordFields("by: a\ntask: t\n")).toEqual({ kind: "no-at" });
  });

  it("an empty value takes no text from the next line", () => {
    expect(mod.claimRecordFields("by:\nat:\ntask: t\n")).toEqual({ kind: "no-at" });
    const fields = mod.claimRecordFields("by:\nat: 2026-06-21T10:00:00.000Z\ntask: t\n");
    expect(fields).toMatchObject({ kind: "record", by: "", at: "2026-06-21T10:00:00.000Z" });
  });
});

describe("claim.js — claimOwnerRefusal: the Orchestrator never owns a claim (D-13, T-41-04)", () => {
  const refused = ["grugops-orchestrator", "orchestrator", "GRUGOPS-Orchestrator", "", "a b", "..", "a/b", "a\n"];

  it.each(refused)("refuses %j", (name) => {
    expect(mod.claimOwnerRefusal(name)).toEqual(expect.any(String));
  });

  it("accepts an adapter name", () => {
    expect(mod.claimOwnerRefusal("grugops-qe-e2e")).toBeNull();
  });

  it.each(refused)("claimPending refuses %j before any directory exists", (name) => {
    const root = makeQueueRoot("claim-owner-", ["t"]);
    expect(mod.claimPending(root, "t", name).kind).toBe("refused");
    expect(existsSync(join(root, "claimed", "t"))).toBe(false);
    expect(existsSync(join(root, "pending", "t.md"))).toBe(true);
  });
});

describe("claim.js — claimedCount: what takes a slot", () => {
  it("counts a task directory and skips a keeper file", () => {
    const root = makeQueueRoot("claim-count-");
    mkdirSync(join(root, "claimed", "t"));
    writeFileSync(join(root, "claimed", ".gitkeep"), "");
    expect(mod.claimedCount(root)).toBe(1);
  });

  it("counts a dot-named directory, a link, and a stray file: over-counting can never over-spawn", () => {
    const root = makeQueueRoot("claim-count-stray-");
    mkdirSync(join(root, "claimed", ".hidden"));
    symlinkSync(join(root, "pending"), join(root, "claimed", ".link"));
    writeFileSync(join(root, "claimed", "stray.txt"), "");
    expect(mod.claimedCount(root)).toBe(3);
  });

  it("is 0 for an empty directory and throws when the directory cannot be read", () => {
    const root = makeQueueRoot("claim-count-empty-");
    expect(mod.claimedCount(root)).toBe(0);
    expect(() => mod.claimedCount(freshTmp("claim-count-none-"))).toThrow();
  });
});

describe("claim.js — freeSlots: never negative (RUN-02)", () => {
  it.each([
    [3, 2, 1],
    [3, 3, 0],
    [3, 4, 0],
  ])("freeSlots(%i, %i) is %i", (wipLimit, claimed, free) => {
    expect(mod.freeSlots(wipLimit, claimed)).toBe(free);
  });
});

describe("claim.js — parseQueueConfig: a value counts only as a positive safe integer (RUN-02)", () => {
  const KEYS = ["wip_limit", "claim_cap", "stale_ttl_minutes"];

  it("a missing file gives the defaults, with a note naming each key", () => {
    const parsed = mod.parseQueueConfig(null);
    expect(parsed).toMatchObject({ wip_limit: 3, claim_cap: 2, stale_ttl_minutes: 30 });
    for (const key of KEYS) expect(parsed.notes.join("\n")).toContain(`queue.${key}`);
  });

  it("a set value is used with no note for it, and a missing key still gets one", () => {
    const parsed = mod.parseQueueConfig('{"queue":{"wip_limit":5}}');
    expect(parsed.wip_limit).toBe(5);
    expect(parsed.notes.join("\n")).not.toContain("queue.wip_limit");
    expect(parsed.notes).toContain("queue.claim_cap not set, default 2");
  });

  it("a config with all three set carries no note", () => {
    const text = '{"queue":{"wip_limit":4,"claim_cap":1,"stale_ttl_minutes":60}}';
    expect(mod.parseQueueConfig(text)).toEqual({ wip_limit: 4, claim_cap: 1, stale_ttl_minutes: 60, notes: [] });
  });

  it.each(["0", "-1", "2.5", '"3"', "1e400", "null", "true", "9007199254740992"])(
    "wip_limit %s falls back to 3 and says so",
    (value) => {
      const parsed = mod.parseQueueConfig(`{"queue":{"wip_limit":${value}}}`);
      expect(parsed.wip_limit).toBe(3);
      expect(parsed.notes).toContain("queue.wip_limit is not a positive integer, default 3");
    },
  );

  it.each(["{not json", "", "null", "[]", "5", '{"queue":null}', '{"queue":[]}', '{"other":1}'])(
    "content %j falls back to the defaults, notes each key and never throws",
    (text) => {
      const parsed = mod.parseQueueConfig(text);
      expect(parsed).toMatchObject({ wip_limit: 3, claim_cap: 2, stale_ttl_minutes: 30 });
      for (const key of KEYS) expect(parsed.notes.join("\n")).toContain(`queue.${key}`);
    },
  );
});

describe("claim.js — subtaskRefFolder: one anchored ref line (T-41-16)", () => {
  it("returns the folder, with or without a trailing slash", () => {
    expect(mod.subtaskRefFolder("# s\nref: .grugops/context/abc-1/\n")).toEqual({ kind: "folder", folder: "abc-1" });
    expect(mod.subtaskRefFolder("# s\nref: .grugops/context/abc-1\n")).toEqual({ kind: "folder", folder: "abc-1" });
    expect(mod.subtaskRefFolder("# s\r\nref: .grugops/context/abc-1/\r\n")).toEqual({ kind: "folder", folder: "abc-1" });
  });

  it.each([
    ["a missing ref line", "# s\n"],
    ["two ref lines", "ref: .grugops/context/a/\nref: .grugops/context/b/\n"],
    ["a good ref line beside a bad one", "ref: .grugops/context/a/\nref: ../../etc\n"],
    ["a traversal", "ref: ../../etc\n"],
    ["a .. folder", "ref: .grugops/context/../\n"],
    ["a . folder", "ref: .grugops/context/./\n"],
    ["a folder outside the allowlist", "ref: .grugops/context/a b/\n"],
    ["a nested folder", "ref: .grugops/context/a/b/\n"],
  ])("refuses %s", (_name, text) => {
    expect(mod.subtaskRefFolder(text).kind).toBe("refused");
  });
});

describe("claim.js — noteSinceClaim: the boundary is inclusive (D-07)", () => {
  const at = "2026-06-21T10:00:00.000Z";

  it("a note at the claim's own instant counts", () => {
    expect(mod.noteSinceClaim(at, [at])).toBe(true);
  });

  it("a note one millisecond earlier does not", () => {
    expect(mod.noteSinceClaim(at, ["2026-06-21T09:59:59.999Z"])).toBe(false);
  });

  it("one later note among earlier ones is enough, and no notes is false", () => {
    expect(mod.noteSinceClaim(at, ["2026-06-20T10:00:00.000Z", "2026-06-21T10:00:00.001Z"])).toBe(true);
    expect(mod.noteSinceClaim(at, [])).toBe(false);
  });

  it("an unparseable note is ignored, and an unparseable claim gives false", () => {
    expect(mod.noteSinceClaim(at, ["not a date"])).toBe(false);
    expect(mod.noteSinceClaim(at, ["not a date", at])).toBe(true);
    expect(mod.noteSinceClaim("not a date", [at])).toBe(false);
  });
});

describe("claim.js — sweepQueue: release what finished, reclaim what went stale", () => {
  const TTL = 60 * 60 * 1000;
  const backdate = (root: string, task: string): void => {
    const claimMd = join(root, "claimed", task, "claim.md");
    writeFileSync(claimMd, readFileSync(claimMd, "utf8").replace(/^at:.*$/m, "at: 2000-01-01T00:00:00.000Z"));
  };

  it("releases a finished claim, reclaims a stale one and leaves a fresh one alone", () => {
    const root = makeQueueRoot("claim-sweep-queue-", ["finished", "stale", "fresh"]);
    for (const t of ["finished", "stale", "fresh"]) {
      expect(mod.claimPending(root, t, "grugops-qe-e2e").kind).toBe("claimed");
    }
    // The crash shape: the subtask reached done/ and claim.md stayed behind.
    mod.transition(root, "finished", "claimed", "done");
    backdate(root, "stale");

    expect(mod.sweepQueue(root, TTL)).toEqual({ released: ["finished"], reclaimed: ["stale"] });
    expect(existsSync(join(root, "claimed", "finished"))).toBe(false);
    expect(existsSync(join(root, "done", "finished.md"))).toBe(true);
    expect(existsSync(join(root, "pending", "finished.md"))).toBe(false);
    expect(existsSync(join(root, "pending", "stale.md"))).toBe(true);
    expect(existsSync(join(root, "claimed", "fresh", "fresh.md"))).toBe(true);
  });

  it("a stale finished claim is released, never reclaimed", () => {
    const root = makeQueueRoot("claim-sweep-queue-stale-done-", ["t"]);
    mod.claimPending(root, "t", "grugops-qe-e2e");
    mod.transition(root, "t", "claimed", "done");
    backdate(root, "t");
    expect(mod.sweepQueue(root, TTL)).toEqual({ released: ["t"], reclaimed: [] });
  });

  it("a claim still holding its subtask is not released, even with a done record beside it", () => {
    const root = makeQueueRoot("claim-sweep-queue-both-", ["t"]);
    mod.claimPending(root, "t", "grugops-qe-e2e");
    writeFileSync(join(root, "done", "t.md"), "# an earlier record\n");
    expect(mod.sweepQueue(root, TTL)).toEqual({ released: [], reclaimed: [] });
    expect(existsSync(join(root, "claimed", "t", "t.md"))).toBe(true);
  });

  it("a link at claim.md is left alone, even with a done record beside it (T-41-03)", () => {
    const root = makeQueueRoot("claim-sweep-queue-link-");
    const elsewhere = join(freshTmp("claim-sweep-queue-target-"), "record.md");
    writeFileSync(elsewhere, "---\nby: a\nat: 2000-01-01T00:00:00.000Z\ntask: t\n---\n");
    mkdirSync(join(root, "claimed", "t"));
    symlinkSync(elsewhere, join(root, "claimed", "t", "claim.md"));
    writeFileSync(join(root, "done", "t.md"), "# finished\n");
    expect(mod.sweepQueue(root, TTL)).toEqual({ released: [], reclaimed: [] });
    expect(existsSync(join(root, "claimed", "t"))).toBe(true);
  });

  it("a keeper in claimed/ and an absent claimed/ are both a no-op", () => {
    const root = makeQueueRoot("claim-sweep-queue-keeper-");
    writeFileSync(join(root, "claimed", ".gitkeep"), "");
    expect(mod.sweepQueue(root, TTL)).toEqual({ released: [], reclaimed: [] });
    expect(mod.sweepQueue(freshTmp("claim-sweep-queue-none-"), TTL)).toEqual({ released: [], reclaimed: [] });
  });
});
