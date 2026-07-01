// worktree-dogfood.test.ts — the DOGF-02 real-worktree N-agent dogfood (SC2).
//
// Proves, with ZERO tokens and full determinism, the isolation:worktree ↔ shared-context-path
// interaction (the flagged v2.0 UNKNOWN, D-07):
//
//   - N = queue.wip_limit (=3) real `git worktree` checkouts, each a genuine separate worktree of
//     HEAD, each the cwd of its OWN node child process.
//   - Every child imports the MAIN checkout's committed scripts/claim.js + scripts/context-io.js
//     (Open-Q2 resolution) and passes ONE shared absolute queue root and ONE shared absolute context
//     root — both OUTSIDE every worktree — to EVERY claim/context call. The script-relative defaults
//     are NEVER relied upon (D-07: a worktree checkout of context-io.js would resolve its default
//     context root worktree-LOCAL, silently splitting the agents apart).
//   - Assertions: (a) a single-slot task is claimed EXACTLY ONCE (one child sees claimTask===true,
//     the rest see EEXIST→false); (b) a shared multi-writer note task accretes N DISTINCT
//     un-clobbered notes/<id>.md files (appendNote's temp+rename fresh-unique write); (c) the
//     NEGATIVE shadow-check — no worktree grew its own populated .grugops/context for the shared
//     task, so the shared root is authoritative (mirrors convergence-spine.test.ts:175-182).
//   - Plus the sweepStale reclaim PROPERTY: a deliberately stale claim (old `at`) is reclaimed
//     (returned AND moved back to pending/) while a fresh claim is left alone — proven non-vacuous
//     against an injected clock (Pitfall 6).
//
// Drives the COMMITTED .js, never the .ts. Hermetic (mkdtempSync roots), token-free, deterministic;
// NEVER in the e2e lane. This test file is tsconfig-excluded (**/*.test.ts) — no committed .js twin,
// no freshness impact.
//
// Security (this phase's floors, not new surface): all child + git spawns are arg-array spawn/
// execFileSync — never routed through a shell on a data path (V5, T-26-02-T). Task names are
// allowlist-safe (^[A-Za-z0-9._-]+$, T-26-02-F). The harness never sets the prod-deploy approval
// env (T-26-02-E).

import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
import { spawn, execFileSync } from "node:child_process";

const ROOT = join(import.meta.dirname, "..");
// The MAIN checkout's committed .js — the stable path every worktree child imports (Open-Q2). Passed
// as absolute args so the child resolves the SAME implementation regardless of its own cwd/worktree.
const CLAIM_JS = join(ROOT, "scripts", "claim.js");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");

// N honors queue.wip_limit (D-08) — read from the real factory config, not hard-coded.
const FACTORY_CONFIG = JSON.parse(
  readFileSync(join(ROOT, "agent-factory", "config", "factory.config.json"), "utf8"),
) as { queue: { wip_limit: number } };
const N = FACTORY_CONFIG.queue.wip_limit; // = 3

// Allowlist-safe task names (^[A-Za-z0-9._-]+$).
const CLAIM_TASK = "shared-claim-task"; // single-slot: claimed exactly once
const NOTE_TASK = "shared-note-task"; // multi-writer: N un-clobbered notes

// ── Shared, hermetic, absolute roots — created OUTSIDE every worktree (D-06/D-07). ───────────────
let SHARED_ROOT = "";
let SHARED_QUEUE = ""; // ONE absolute queue root, outside all worktrees
let SHARED_CONTEXT = ""; // ONE absolute context root, outside all worktrees
let RUNNER = ""; // the child runner .mjs (also outside all worktrees)
const worktrees: string[] = [];

// A tiny ESM child runner. It imports the MAIN checkout's committed claim.js/context-io.js by
// absolute path and passes the SAME shared absolute roots to every call. It races for the single-slot
// CLAIM_TASK (exactly-once) and, independently, appends one note to the multi-writer NOTE_TASK
// (un-clobbered). It records whether it won the claim to a per-agent result file.
const RUNNER_SRC = `
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const [, , claimJs, contextIoJs, queueRoot, contextRoot, claimTask, noteTask, agentId, at, resultFile] =
  process.argv;
const claim = await import(pathToFileURL(claimJs).href);
const ctx = await import(pathToFileURL(contextIoJs).href);

// (1) Race for the single-slot task — exactly one child's atomic mkdir wins; losers see EEXIST→false.
let won = false;
won = claim.claimTask(queueRoot, claimTask, agentId);
if (won) {
  claim.transition(queueRoot, claimTask, "pending", "claimed");
}

// (2) Every child appends ONE soft note to the shared multi-writer task under the SHARED context
// root — appendNote writes a fresh unique notes/<id>.md (temp+rename), so N writers never clobber.
ctx.appendNote(
  noteTask,
  { kind: "observation", by: agentId, at, verified_by: "", confidence: "high", refs: [], supersedes: null },
  "note from " + agentId + " (cwd=" + process.cwd() + ")",
  contextRoot,
);

if (won) claim.transition(queueRoot, claimTask, "claimed", "done");
writeFileSync(resultFile, JSON.stringify({ agentId, won, cwd: process.cwd() }));
`;

function git(args: string[]): void {
  // Arg-array execFileSync — never routed through a shell on a data path (V5, T-26-02-T).
  execFileSync("git", args, { cwd: ROOT, stdio: "pipe" });
}

function spawnChild(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // process.execPath + arg array — no shell interpolation on the data path (V5).
    const cp = spawn(process.execPath, [RUNNER, ...args], { cwd, stdio: "inherit" });
    cp.on("error", reject);
    cp.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`child ${cwd} exited ${code}`)),
    );
  });
}

beforeAll(() => {
  SHARED_ROOT = mkdtempSync(join(tmpdir(), "wt-dogfood-"));
  SHARED_QUEUE = join(SHARED_ROOT, "queue"); // OUTSIDE every worktree
  SHARED_CONTEXT = join(SHARED_ROOT, "context"); // OUTSIDE every worktree
  for (const stage of ["pending", "claimed", "done"]) {
    mkdirSync(join(SHARED_QUEUE, stage), { recursive: true });
  }
  mkdirSync(SHARED_CONTEXT, { recursive: true });
  // The single-slot claim task must exist in pending/ so the winner can transition it.
  writeFileSync(
    join(SHARED_QUEUE, "pending", `${CLAIM_TASK}.md`),
    `# subtask ${CLAIM_TASK}\nref: context/${CLAIM_TASK}/\n`,
  );

  RUNNER = join(SHARED_ROOT, "runner.mjs");
  writeFileSync(RUNNER, RUNNER_SRC);

  // N real `git worktree add --detach` checkouts of HEAD, each OUTSIDE the shared roots (D-06).
  for (let i = 0; i < N; i++) {
    const wt = join(SHARED_ROOT, `wt-${i}`);
    git(["worktree", "add", "--detach", wt, "HEAD"]);
    worktrees.push(wt);
  }
}, 120_000);

afterAll(() => {
  // Tear down worktrees (arg-array `git worktree remove --force`) then the temp root.
  for (const wt of worktrees) {
    try {
      git(["worktree", "remove", "--force", wt]);
    } catch {
      /* best-effort */
    }
  }
  try {
    git(["worktree", "prune"]);
  } catch {
    /* best-effort */
  }
  if (SHARED_ROOT) rmSync(SHARED_ROOT, { recursive: true, force: true });
});

describe("worktree-dogfood — DOGF-02/SC2 real worktrees, one shared context root", () => {
  it(
    "claims a task exactly once and accretes N un-clobbered notes with no worktree shadowing",
    async () => {
      // Launch N node children CONCURRENTLY, each cwd'd into its own real worktree, all pinned to the
      // SAME shared absolute SHARED_QUEUE + SHARED_CONTEXT.
      const results = worktrees.map((wt, i) => {
        const resultFile = join(SHARED_ROOT, `result-${i}.json`);
        return spawnChild(
          [
            CLAIM_JS,
            CONTEXT_IO_JS,
            SHARED_QUEUE,
            SHARED_CONTEXT,
            CLAIM_TASK,
            NOTE_TASK,
            `agent-${i}`,
            `2026-06-21T10:00:0${i}.000Z`,
            resultFile,
          ],
          wt,
        );
      });
      await Promise.all(results);

      // ── (a) Exactly-once claim: exactly ONE child observed claimTask===true, the rest false. ────
      const observed = worktrees.map((_, i) =>
        JSON.parse(readFileSync(join(SHARED_ROOT, `result-${i}.json`), "utf8")),
      );
      const winners = observed.filter((r) => r.won === true);
      const losers = observed.filter((r) => r.won === false);
      expect(winners).toHaveLength(1); // exactly-once: one atomic mkdir winner
      expect(losers).toHaveLength(N - 1); // the rest lost the claim (EEXIST → false)
      // The claimed task ended in done/ (winner drove it pending→claimed→done).
      expect(existsSync(join(SHARED_QUEUE, "done", `${CLAIM_TASK}.md`))).toBe(true);

      // ── (b) N distinct un-clobbered notes under the SHARED context root for NOTE_TASK. ──────────
      const notesDir = join(SHARED_CONTEXT, NOTE_TASK, "notes");
      const noteFiles = readdirSync(notesDir).filter((f) => f.endsWith(".md"));
      expect(noteFiles).toHaveLength(N); // N writers, N unique notes/<id>.md — none clobbered
      expect(new Set(noteFiles).size).toBe(N); // distinct filenames (nonce ids)

      // ── (c) NEGATIVE shadow-check: no worktree grew its OWN populated context for the shared
      //        task — the shared absolute root is authoritative (D-07; mirrors
      //        convergence-spine.test.ts:175-182). The worktree-local default was never relied upon.
      for (const wt of worktrees) {
        expect(existsSync(join(wt, ".grugops", "context", NOTE_TASK, "notes"))).toBe(false);
        expect(existsSync(join(wt, ".grugops", "context", CLAIM_TASK))).toBe(false);
        expect(existsSync(join(wt, ".grugops", "queue", "claimed", CLAIM_TASK))).toBe(false);
      }
    },
    120_000,
  );

  it("sweepStale reclaims a deliberately stale claim while leaving a fresh claim alone", async () => {
    const claim: typeof import("./claim.js") = await import(pathToFileURL(CLAIM_JS).href);

    const STALE_TASK = "stale-task";
    const FRESH_TASK = "fresh-task";
    const ttlMs = 30 * 60 * 1000; // generous, deterministic (mirrors config stale_ttl_minutes=30)

    // Seed a STALE claim: a claim.md whose `at` is far in the past, plus its subtask file, all under
    // the shared SHARED_QUEUE. Deterministic injected clock — no wall-clock dependency (Pitfall 6).
    const oldAt = "2000-01-01T00:00:00.000Z";
    const injectedNow = Date.parse(oldAt) + ttlMs + 60 * 60 * 1000; // WELL past oldAt + ttl
    const staleClaimDir = join(SHARED_QUEUE, "claimed", STALE_TASK);
    mkdirSync(staleClaimDir, { recursive: true });
    writeFileSync(
      join(staleClaimDir, "claim.md"),
      `---\nby: agent-stale\nat: ${oldAt}\ntask: ${STALE_TASK}\n---\n`,
    );
    writeFileSync(join(staleClaimDir, `${STALE_TASK}.md`), `# subtask ${STALE_TASK}\n`);

    // Seed a FRESH claim: `at` within the TTL of injectedNow — the conservative no-op path must NOT
    // reclaim it (non-vacuity of the TTL boundary).
    const freshAt = new Date(injectedNow - 1000).toISOString(); // now - at = 1s <= ttl
    const freshClaimDir = join(SHARED_QUEUE, "claimed", FRESH_TASK);
    mkdirSync(freshClaimDir, { recursive: true });
    writeFileSync(
      join(freshClaimDir, "claim.md"),
      `---\nby: agent-fresh\nat: ${freshAt}\ntask: ${FRESH_TASK}\n---\n`,
    );
    writeFileSync(join(freshClaimDir, `${FRESH_TASK}.md`), `# subtask ${FRESH_TASK}\n`);

    // Injected-clock sweep (third `now` arg) — deterministic.
    const reclaimed = claim.sweepStale(SHARED_QUEUE, ttlMs, injectedNow);

    // The reclaim is proven NON-VACUOUSLY: the returned array CONTAINS the stale task AND the subtask
    // is actually back in pending/ (a conservative no-op cannot read as a pass, Pitfall 6/T-26-02-R).
    expect(reclaimed).toContain(STALE_TASK);
    expect(existsSync(join(SHARED_QUEUE, "pending", `${STALE_TASK}.md`))).toBe(true);
    expect(existsSync(staleClaimDir)).toBe(false); // claim dir released

    // The FRESH claim was left untouched — not reclaimed, still claimed.
    expect(reclaimed).not.toContain(FRESH_TASK);
    expect(existsSync(freshClaimDir)).toBe(true);
    expect(existsSync(join(SHARED_QUEUE, "pending", `${FRESH_TASK}.md`))).toBe(false);
  });
});
