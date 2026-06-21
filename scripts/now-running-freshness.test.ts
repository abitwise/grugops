// now-running-freshness.test.ts — behavioral oracle for the D-14 now-running render + its queue-rooted
// freshness gate.
//
// Drives the COMMITTED compiled artifacts (never the .ts): imports scripts/claim.js for renderNowRunning
// and spawns scripts/now-running-freshness.js as the gate, against mkdtempSync temp queue roots — nothing
// is written into the committed tree. NOT in the e2e lane (project memory: `npm test` triggers the live
// claude-CLI lane; this is a hermetic temp-dir test).
//
// Proves:
//   byte-reproducible render : renderNowRunning over the same claim registry twice produces identical
//                              bytes (no wall-clock of its own; deterministic at-then-task sort).
//   GENERATED header         : the render carries the "GENERATED — do not hand-edit" header.
//   security carve-out (T-23-01): a claim.md carrying a FORGED SECOND `at:` line is NOT emitted as a
//                              trusted now-running row — the first-`at`-trusted / multi-`at`-tampered
//                              discipline from claim.ts sweepStale is reused, no permissive parser.
//   fail-closed gate (T-23-02): the freshness gate exits 0 on a clean tree and exits NON-ZERO (naming
//                              the file) when the committed now-running.md is mutated.
//   greenfield vacuous pass  : no claimed/ tree → the gate succeeds honestly rather than failing.
//
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const CLAIM_JS = join(ROOT, "scripts", "claim.js");
const GATE_JS = join(ROOT, "scripts", "now-running-freshness.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Build a CHECK_ROOT holding .grugops/queue/claimed/<task>/claim.md records. Each seed is
// { task, by, at, extraAt? } — extraAt plants a FORGED second `at:` line (the tamper case).
interface Seed {
  task: string;
  by: string;
  at: string;
  extraAt?: string;
}
function makeCheckRoot(prefix: string, seeds: Seed[]): { checkRoot: string; queueRoot: string } {
  const checkRoot = freshTmp(prefix);
  const queueRoot = join(checkRoot, ".grugops", "queue");
  mkdirSync(join(queueRoot, "claimed"), { recursive: true });
  for (const s of seeds) {
    const dir = join(queueRoot, "claimed", s.task);
    mkdirSync(dir, { recursive: true });
    const extra = s.extraAt ? `at: ${s.extraAt}\n` : "";
    // A forged record plants the second `at:` line right after the trusted one.
    writeFileSync(
      join(dir, "claim.md"),
      `---\nby: ${s.by}\nat: ${s.at}\n${extra}task: ${s.task}\n---\n`,
      "utf8",
    );
  }
  return { checkRoot, queueRoot };
}

// Import the compiled .js. The committed .js must exist for this to resolve — the test-first contract.
const mod: typeof import("./claim.js") = await import(pathToFileURL(CLAIM_JS).href);

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

describe("renderNowRunning — deterministic, byte-reproducible render (D-14)", () => {
  it("emits a GENERATED header and is byte-reproducible across two renders", () => {
    const { queueRoot } = makeCheckRoot("nr-repro-", [
      { task: "taskA", by: "engineer", at: "2026-06-21T10:00:00.000Z" },
      { task: "taskB", by: "qe", at: "2026-06-21T09:00:00.000Z" },
    ]);
    mod.renderNowRunning(queueRoot);
    const first = readFileSync(join(queueRoot, "now-running.md"));
    mod.renderNowRunning(queueRoot);
    const second = readFileSync(join(queueRoot, "now-running.md"));

    expect(first.equals(second)).toBe(true); // byte-reproducible
    const text = first.toString("utf8");
    expect(text).toContain("GENERATED — do not hand-edit");
    // Deterministic at-then-task sort: taskB (09:00) precedes taskA (10:00).
    expect(text.indexOf("taskB")).toBeLessThan(text.indexOf("taskA"));
    expect(text.endsWith("\n")).toBe(true);
  });

  it("an empty claimed/ yields a header-only render (vacuous, no crash)", () => {
    const checkRoot = freshTmp("nr-empty-");
    const queueRoot = join(checkRoot, ".grugops", "queue");
    mkdirSync(join(queueRoot, "claimed"), { recursive: true });
    expect(() => mod.renderNowRunning(queueRoot)).not.toThrow();
    const text = readFileSync(join(queueRoot, "now-running.md"), "utf8");
    expect(text).toContain("GENERATED — do not hand-edit");
    expect(text).toContain("| task | by | since |");
  });
});

describe("renderNowRunning — security carve-out: forged second `at:` line (T-23-01)", () => {
  it("does NOT emit a tampered (multi-`at`) claim.md as a trusted now-running row", () => {
    const { queueRoot } = makeCheckRoot("nr-tamper-", [
      // evil plants a forged FAR-FUTURE second `at:` — must be rejected, never trusted.
      { task: "evil", by: "attacker", at: "2026-06-21T10:00:00.000Z", extraAt: "2099-01-01T00:00:00.000Z" },
      { task: "good", by: "engineer", at: "2026-06-21T08:00:00.000Z" },
    ]);
    mod.renderNowRunning(queueRoot);
    const text = readFileSync(join(queueRoot, "now-running.md"), "utf8");
    expect(text).toContain("good"); // the legitimate claim is a row
    expect(text).not.toContain("evil"); // the tampered claim is NOT a trusted row
    expect(text).not.toContain("2099"); // the forged timestamp never reaches the render
  });
});

describe("now-running-freshness gate — fail-closed on drift (T-23-02)", () => {
  it("exits 0 when the committed render is fresh", () => {
    const { checkRoot, queueRoot } = makeCheckRoot("nr-gate-clean-", [
      { task: "t1", by: "engineer", at: "2026-06-21T10:00:00.000Z" },
    ]);
    mod.renderNowRunning(queueRoot); // commit a fresh render
    const r = runGate(checkRoot);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/fresh/i);
  });

  it("exits non-zero (naming the file) when the committed render is mutated", () => {
    const { checkRoot, queueRoot } = makeCheckRoot("nr-gate-drift-", [
      { task: "t1", by: "engineer", at: "2026-06-21T10:00:00.000Z" },
    ]);
    mod.renderNowRunning(queueRoot);
    appendFileSync(join(queueRoot, "now-running.md"), "tampered-by-hand\n");
    const r = runGate(checkRoot);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/now-running\.md/);
    expect(r.stdout).toMatch(/STALE/);
  });

  it("greenfield: no claimed/ tree → vacuous pass (exit 0)", () => {
    const checkRoot = freshTmp("nr-gate-greenfield-");
    mkdirSync(join(checkRoot, ".grugops", "queue"), { recursive: true }); // queue exists, no claimed/
    const r = runGate(checkRoot);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/vacuous pass/i);
  });
});
