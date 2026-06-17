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
  existsSync,
  rmSync,
} from "node:fs";
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
