// convergence-spine.test.ts — the SC3/D-04 dual-path convergence oracle (PAR-03).
//
// "One substrate, two modes converge." The SAME seeded 2-3-subtask decomposition is replayed two
// independent ways against two hermetic temp queue+context roots:
//   (a) PARALLEL-spawn simulation — claim all up to the width budget, each task writes its notes,
//       then mark every task done (interleaved, fan-out order).
//   (b) SEQUENTIAL drain — claim one, write its notes, mark done, repeat (strict serial order).
// Then the final ON-DISK substrate is asserted EQUAL order-independently:
//   - the same set of done/ records, and
//   - the same per-task .grugops/context/<task>/notes/ content, compared via context-io.js
//     currentState() — the deterministic, file-position-independent canonical replay (sort by `at`
//     then id, fold superseded). Per-task note SETS must match regardless of write order.
//
// Drives the COMMITTED .js (claim.js + context-io.js), never the .ts. Hermetic + deterministic;
// NEVER in the e2e lane (project memory: `npm test` runs the live claude-CLI lane).
//
// No-fabrication: the two modes genuinely differ in execution ORDER (parallel fan-out vs serial
// drain); convergence is therefore a real property, not a tautology of identical code paths.

import { describe, it, expect, afterAll } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const CLAIM_JS = join(ROOT, "scripts", "claim.js");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

const claim: typeof import("./claim.js") = await import(pathToFileURL(CLAIM_JS).href);
const ctx: typeof import("./context-io.js") = await import(pathToFileURL(CONTEXT_IO_JS).href);

// A "substrate" = a queue root (pending/claimed/done) PLUS a context root (.grugops/context/<task>/).
interface Substrate {
  queueRoot: string;
  contextRoot: string;
}
function makeSubstrate(prefix: string, subtasks: string[]): Substrate {
  const queueRoot = freshTmp(prefix);
  for (const sub of ["pending", "claimed", "done"]) {
    mkdirSync(join(queueRoot, sub), { recursive: true });
  }
  for (const t of subtasks) {
    writeFileSync(
      join(queueRoot, "pending", `${t}.md`),
      `# subtask ${t}\nref: .grugops/context/${t}/\n`,
    );
  }
  const contextRoot = join(queueRoot, ".grugops", "context");
  mkdirSync(contextRoot, { recursive: true });
  return { queueRoot, contextRoot };
}

// The deterministic per-task work each mode performs — IDENTICAL inputs, IDENTICAL note bodies. Only
// the ORDER in which tasks run differs between the two modes. Notes use soft kinds (observation /
// decision) so no §14-gate stamp is required (WF16 admits soft kinds without a stamp). `at` is a
// fixed deterministic timestamp per task so currentState()'s replay sort is mode-independent.
function workItems(task: string): { kind: "observation" | "decision"; at: string; body: string }[] {
  // Two notes per task; fixed `at` values keyed off the task so replay order is deterministic.
  const n = task.replace(/[^0-9]/g, "") || "0";
  return [
    {
      kind: "observation",
      at: `2026-06-21T10:0${n}:00.000Z`,
      body: `observed work for ${task}`,
    },
    {
      kind: "decision",
      at: `2026-06-21T10:0${n}:30.000Z`,
      body: `decided approach for ${task}`,
    },
  ];
}

function doWork(sub: Substrate, task: string): void {
  for (const w of workItems(task)) {
    ctx.appendNote(
      task,
      {
        kind: w.kind,
        by: "engineer",
        at: w.at,
        verified_by: "",
        confidence: "high",
        refs: [],
        supersedes: null,
      },
      w.body,
      sub.contextRoot,
    );
  }
}

// Canonicalize a substrate: the sorted set of done/ task names + each task's currentState() projected
// to (kind, at, body) sorted — a mode/order-independent fingerprint of the final on-disk state.
function canonical(sub: Substrate, subtasks: string[]): {
  done: string[];
  notes: Record<string, { kind: string; at: string; body: string }[]>;
} {
  const done = readdirSync(join(sub.queueRoot, "done")).sort();
  const notes: Record<string, { kind: string; at: string; body: string }[]> = {};
  for (const t of subtasks) {
    const state = ctx.currentState(ctx.readContext(t, sub.contextRoot));
    notes[t] = state
      .map((nr) => ({ kind: nr.kind, at: nr.at, body: nr.body }))
      .sort((a, b) => (a.at !== b.at ? a.at.localeCompare(b.at) : a.body.localeCompare(b.body)));
  }
  return { done, notes };
}

describe("convergence-spine — SC3/D-04 one substrate, two modes converge (PAR-03)", () => {
  const subtasks = ["t1", "t2", "t3"];

  it("parallel-spawn and sequential-drain replays produce order-independent identical substrate", () => {
    // ── Mode A: PARALLEL-spawn simulation ──────────────────────────────────────────────────────
    // Claim all up to width (here all 3 — width budget large enough to fan out), each writes notes,
    // THEN every task is marked done (interleaved fan-out: claims first, work, then dones).
    const a = makeSubstrate("conv-parallel-", subtasks);
    for (const t of subtasks) {
      expect(claim.claimTask(a.queueRoot, t, "engineer")).toBe(true);
      claim.transition(a.queueRoot, t, "pending", "claimed");
    }
    // Work in a DIFFERENT order than claim/done to stress order-independence.
    for (const t of [...subtasks].reverse()) doWork(a, t);
    for (const t of subtasks) claim.transition(a.queueRoot, t, "claimed", "done");

    // ── Mode B: SEQUENTIAL drain ───────────────────────────────────────────────────────────────
    // Claim one, work, done, repeat — strict serial order, no overlap.
    const b = makeSubstrate("conv-sequential-", subtasks);
    for (const t of subtasks) {
      expect(claim.claimTask(b.queueRoot, t, "engineer")).toBe(true);
      claim.transition(b.queueRoot, t, "pending", "claimed");
      doWork(b, t);
      claim.transition(b.queueRoot, t, "claimed", "done");
    }

    // ── Converge: the final on-disk substrate is EQUAL order-independently ──────────────────────
    const canonA = canonical(a, subtasks);
    const canonB = canonical(b, subtasks);

    // Same set of done records.
    expect(canonA.done).toEqual(["t1.md", "t2.md", "t3.md"]);
    expect(canonA.done).toEqual(canonB.done);

    // Same per-task notes via currentState() canonical replay — regardless of write/run order.
    expect(canonA.notes).toEqual(canonB.notes);

    // Sanity: convergence is non-vacuous — each task actually accreted its two notes.
    for (const t of subtasks) {
      expect(canonA.notes[t]).toHaveLength(2);
    }
  });

  it("each substrate writes notes ONLY under its own context root (no agent-to-agent relay)", () => {
    // Independent roots: neither replay leaks state into the other — coordination is purely on-disk.
    const a = makeSubstrate("conv-isolation-a-", ["x"]);
    const b = makeSubstrate("conv-isolation-b-", ["x"]);
    expect(claim.claimTask(a.queueRoot, "x", "engineer")).toBe(true);
    claim.transition(a.queueRoot, "x", "pending", "claimed");
    doWork(a, "x");
    claim.transition(a.queueRoot, "x", "claimed", "done");

    // b's context root saw NO writes from a's run — the only channel is each root's own filesystem.
    expect(existsSync(join(a.contextRoot, "x", "notes"))).toBe(true);
    expect(existsSync(join(b.contextRoot, "x", "notes"))).toBe(false);
  });
});
