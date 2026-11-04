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

const ROOT = join(import.meta.dirname, "..");
const CLAIM_JS = join(ROOT, "scripts", "claim.js");

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

  it.skipIf(process.platform === "win32")(
    "a FIFO at claimed/<task>/claim.md is never opened: the render skips it and the sweep leaves it",
    () => {
      const root = makeQueueRoot("claim-fifo-");
      mkdirSync(join(root, "claimed", "t"));
      const made = spawnSync("mkfifo", [join(root, "claimed", "t", "claim.md")]);
      expect(made.status).toBe(0);

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
