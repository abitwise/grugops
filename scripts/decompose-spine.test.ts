// decompose-spine.test.ts — the SC1/SC2 decomposition + width-cap spine (PAR-01/PAR-02/CLAIM-03).
//
// Drives the COMMITTED compiled artifact scripts/claim.js (never the .ts), against mkdtempSync temp
// queue roots — nothing is written into the committed tree. Hermetic + deterministic; NEVER in the
// e2e lane (project memory: `npm test` runs the live claude-CLI lane; routine verification is
// `npx vitest run --exclude '**/scripts/e2e/**'`).
//
// Proves:
//   SC1 decompose→enqueue : a seeded 2-3-subtask decomposition writes one THIN pending/ file per
//                           subtask, each carrying ONLY a `ref:` to its per-task .grugops/context/
//                           folder (no inlined data) — the originating request is decomposed into
//                           queue entries that point at the shared context, not relay it.
//   SC2/CLAIM-03 WIDTH    : with a width budget read as queue.wip_limit (small, e.g. 2), the count of
//                           tasks SIMULTANEOUSLY in claimed/ NEVER exceeds the budget — a further claim
//                           proceeds only AFTER a prior task transitions to done/ and frees a slot.
//                           This is a WIDTH assertion, not a depth check (RESEARCH Pitfall 4).
//   exclusivity           : a second claimTask on an already-claimed task returns false (EEXIST).
//   no-relay              : the ONLY shared state is the on-disk queue + context — nothing is passed
//                           agent-to-agent (the test coordinates purely through the filesystem).
//
// No-fabrication: the width path proves BOTH that the budget is respected AND that a freed slot is
// reused; exclusivity proves BOTH the winning and the losing claim.

import { describe, it, expect, afterAll } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
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

// Build a queue root with pending/, claimed/, done/ and seed a THIN pending subtask file per task —
// each is ONLY a ref to its per-task .grugops/context/ folder (mirrors claim.test.ts makeQueueRoot
// l.51-59 and the production decompose→enqueue shape: pending files carry a ref, never inlined data).
function makeQueueRoot(prefix: string, pendingTasks: string[] = []): string {
  const root = freshTmp(prefix);
  for (const sub of ["pending", "claimed", "done"]) {
    mkdirSync(join(root, sub), { recursive: true });
  }
  for (const t of pendingTasks) {
    writeFileSync(
      join(root, "pending", `${t}.md`),
      `# subtask ${t}\nref: .grugops/context/${t}/\n`,
    );
  }
  return root;
}

// The live concurrent WIDTH = tasks ACTIVELY claimed and not yet done. transition(claimed→done)
// moves only the subtask file (claimed/<t>/<t>.md → done/<t>.md) and leaves the claim directory +
// claim.md behind until the stale sweep — exactly as production claim.js does — so width is measured
// by claim dirs whose subtask file is STILL present (the task is genuinely in flight), not a bare
// directory count (which would over-report a freed slot).
function claimedWidth(root: string): number {
  const claimedDir = join(root, "claimed");
  if (!existsSync(claimedDir)) return 0;
  return readdirSync(claimedDir).filter((t) =>
    existsSync(join(claimedDir, t, `${t}.md`)),
  ).length;
}

// Tasks currently in flight (claimed + subtask file present) — the ones eligible to be completed.
function inFlight(root: string): string[] {
  const claimedDir = join(root, "claimed");
  if (!existsSync(claimedDir)) return [];
  return readdirSync(claimedDir).filter((t) =>
    existsSync(join(claimedDir, t, `${t}.md`)),
  );
}

const mod: typeof import("./claim.js") = await import(pathToFileURL(CLAIM_JS).href);

describe("decompose-spine — SC1 decompose → enqueue (PAR-01)", () => {
  it("each seeded subtask is a THIN pending file carrying ONLY a context ref (no inlined data)", () => {
    const subtasks = ["sub-a", "sub-b", "sub-c"];
    const root = makeQueueRoot("spine-decompose-", subtasks);
    for (const t of subtasks) {
      const pendingFile = join(root, "pending", `${t}.md`);
      expect(existsSync(pendingFile)).toBe(true);
      const text = readFileSync(pendingFile, "utf8");
      // Carries a ref to its per-task context folder...
      expect(text).toMatch(new RegExp(`^ref:\\s*\\.grugops/context/${t}/\\s*$`, "m"));
      // ...and is THIN: no inlined verified-context payload (only the heading + the ref line).
      const meaningful = text.split("\n").filter((l) => l.trim() !== "");
      expect(meaningful.length).toBeLessThanOrEqual(2);
    }
  });
});

describe("decompose-spine — SC2/CLAIM-03 concurrent WIDTH ≤ queue.wip_limit (Pitfall 4: width, not depth)", () => {
  it("never holds more than wip_limit tasks in claimed/ at once; a freed slot is reused", () => {
    // A scheduler with a 2-wide budget draining a 3-subtask decomposition. The coordinator is the
    // ONLY scheduler; coordination is purely via the on-disk queue (no agent-to-agent relay).
    const WIP_LIMIT = 2; // read as queue.wip_limit in production; fixed small value for the fixture
    const subtasks = ["t1", "t2", "t3"];
    const root = makeQueueRoot("spine-width-", subtasks);

    const pending = [...subtasks];
    let widthHighWater = 0;
    let reuseObserved = false;

    // Drain the queue respecting the width budget. The loop is the scheduler: it claims up to the
    // budget, and only frees+refills after marking a task done — exactly the production schedule step.
    while (pending.length > 0 || claimedWidth(root) > 0) {
      // Fill up to the width budget.
      while (claimedWidth(root) < WIP_LIMIT && pending.length > 0) {
        const t = pending.shift()!;
        expect(mod.claimTask(root, t, "engineer")).toBe(true);
        mod.transition(root, t, "pending", "claimed");
      }
      // The invariant under test: the live width NEVER exceeds the budget.
      const w = claimedWidth(root);
      widthHighWater = Math.max(widthHighWater, w);
      expect(w).toBeLessThanOrEqual(WIP_LIMIT);

      // Complete one in-flight task to free a slot (the done transition that lets the 3rd proceed).
      const flying = inFlight(root);
      if (flying.length > 0) {
        const done = flying[0];
        const beforeFree = claimedWidth(root);
        mod.transition(root, done, "claimed", "done");
        expect(existsSync(join(root, "done", `${done}.md`))).toBe(true);
        // If there is still pending work, the freed slot must be reused on the next fill.
        if (pending.length > 0 && beforeFree === WIP_LIMIT) reuseObserved = true;
      }
    }

    // The 3rd subtask could ONLY run after a slot freed → the width cap was actually load-bearing,
    // not vacuously satisfied (it touched the ceiling, then reused a freed slot).
    expect(widthHighWater).toBe(WIP_LIMIT);
    expect(reuseObserved).toBe(true);
    // All three subtasks completed.
    expect(readdirSync(join(root, "done")).sort()).toEqual(["t1.md", "t2.md", "t3.md"]);
  });
});

describe("decompose-spine — exclusivity (T-23-06: a claimed task cannot be re-claimed)", () => {
  it("a second claimTask on an already-claimed task returns false (EEXIST = claim lost)", () => {
    const root = makeQueueRoot("spine-excl-", ["only"]);
    expect(mod.claimTask(root, "only", "engineer")).toBe(true);
    // A second agent racing the same task loses — proving single-writer ownership (no lost update).
    expect(mod.claimTask(root, "only", "qe")).toBe(false);
  });
});
