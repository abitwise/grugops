// context-freshness.test.ts — behavioral oracle for the SCTX-03 / SC-4 context index drift gate.
//
// Drives the COMMITTED compiled artifact scripts/context-freshness.js as a child
// process (never the .ts) and asserts the exit-code-as-signal contract:
//   exit 0 = every committed .grugops/context/<task>/index.{md,jsonl} matches a fresh
//            regeneration from notes/ ("fresh")
//   exit 1 = a committed index drifted from a fresh regen, OR the regen itself failed
//
// MARKDOWN WINS, FAIL-CLOSED, NO FABRICATION: the gate must both PASS on a true render
// AND FAIL on planted drift / a broken regen. This oracle proves all three.
//
// Hermetic fixture (never mutates the committed tree): a mkdtempSync root holding
// <fixture>/.grugops/context/<task>/{notes/<note>.md, index.md, index.jsonl}, where the
// committed index files are a TRUE render of the notes (produced by running the same
// compiled context-io.js render the gate mirror-spawns). The gate is pointed at the
// fixture via the CHECK_ROOT env override. Mirrors catalog-freshness.test.ts in shape.
//
// Vitest globals:false → import explicitly.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const FRESHNESS_JS = join(ROOT, "scripts", "context-freshness.js");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");

const TASK = "ABC-001";

let fixtureRoot: string;
let contextRoot: string; // <fixtureRoot>/.grugops/context
let taskDir: string; // <contextRoot>/<task>
let notesDir: string; // <taskDir>/notes
let indexJsonl: string; // committed derived file
let indexMd: string; // committed derived file

// Run the gate against the fixture via the CHECK_ROOT override.
function runFreshness() {
  return spawnSync("node", [FRESHNESS_JS], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: fixtureRoot },
  });
}

// Render index.{md,jsonl} into the fixture by spawning the SAME compiled render the
// gate uses — guaranteeing the committed index is a true render of notes/.
function render() {
  return spawnSync("node", [CONTEXT_IO_JS, "render", TASK, contextRoot], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

describe("context-freshness.js (SCTX-03 / SC-4 context index drift gate)", () => {
  beforeAll(() => {
    fixtureRoot = mkdtempSync(join(tmpdir(), "grugops-context-fresh-fixture-"));
    contextRoot = join(fixtureRoot, ".grugops", "context");
    taskDir = join(contextRoot, TASK);
    notesDir = join(taskDir, "notes");
    indexJsonl = join(taskDir, "index.jsonl");
    indexMd = join(taskDir, "index.md");

    // One well-formed note (the full provenance fence; a `finding` kind).
    mkdirSync(notesDir, { recursive: true });
    writeFileSync(
      join(notesDir, "20260617T120000Z-grug-finding-aaaaaaaa.md"),
      [
        "---",
        "kind: finding",
        "by: grug",
        "at: 2026-06-17T12:00:00Z",
        "verified_by: ",
        "confidence: high",
        "refs:",
        "  - SCTX-03",
        "supersedes: ",
        "---",
        "",
        "the index regenerates byte-identically from notes/.",
        "",
      ].join("\n"),
      "utf8",
    );

    // Produce a TRUE committed render so Test 1 has something to pass against.
    const r = render();
    expect(r.status).toBe(0);
  });

  afterAll(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("Test 1 (fresh PASS): exits 0 and reports fresh when the committed index matches a regeneration", () => {
    const r = runFreshness();
    expect(r.status).toBe(0);
    expect(r.stdout.toLowerCase()).toContain("fresh");
  });

  it("Test 2 (planted-drift STALE): exits non-zero and names the drifted file", () => {
    // Plant one byte of drift into the committed index.jsonl, then restore it so the
    // fixture stays a true render for the other tests.
    const original = readFileSync(indexJsonl);
    try {
      writeFileSync(
        indexJsonl,
        Buffer.concat([original, Buffer.from('{"drift":true}\n')]),
      );

      const r = runFreshness();
      expect(r.status).not.toBe(0);
      expect(r.stdout).toContain("STALE:");
      expect(r.stdout).toContain("index.jsonl");
      // Markdown-wins evidence: the gate points the fix at re-rendering, never at editing notes/.
      expect(r.stdout.toLowerCase()).toContain("source of truth");
    } finally {
      writeFileSync(indexJsonl, original);
    }
    // Sanity: the restore returns the fixture to fresh.
    expect(runFreshness().status).toBe(0);
  });

  // (27-60 / WR-04) The test-inclusive typecheck target's FIRST catch in this file: `indexMd` was
  // declared and assigned in beforeAll and then read by nothing. The gate's own derived set is
  // `["index.md", "index.jsonl"]` (context-freshness.ts:125) — BOTH halves are compared — but only
  // the .jsonl half had a planted-drift case. The unused local was the tell for a missing case, not
  // dead weight to delete: this is the .md twin of Test 2, and it makes the local load-bearing.
  it("Test 2b (planted-drift STALE, the .md half): exits non-zero and names index.md", () => {
    const original = readFileSync(indexMd);
    try {
      writeFileSync(indexMd, Buffer.concat([original, Buffer.from("\ndrift\n")]));

      const r = runFreshness();
      expect(r.status).not.toBe(0);
      expect(r.stdout).toContain("STALE:");
      expect(r.stdout).toContain("index.md");
    } finally {
      writeFileSync(indexMd, original);
    }
    // Sanity: the restore returns the fixture to fresh.
    expect(runFreshness().status).toBe(0);
  });

  it("Test 3 (fail-closed): exits non-zero and never reports fresh when the regeneration fails", () => {
    // Break the regen itself: add a per-task context dir whose NAME fails the render's
    // task-name allowlist (a space → assertSafeTask throws → `context-io.js render`
    // exits 1). The gate enumerates this dir, mirror-spawns the render, gets a non-zero
    // status, and MUST refuse to report fresh (fail-closed). Restore in finally.
    const badTask = "bad name";
    const badTaskNotes = join(contextRoot, badTask, "notes");
    mkdirSync(badTaskNotes, { recursive: true });
    writeFileSync(
      join(badTaskNotes, "20260617T130000Z-grug-finding-bbbbbbbb.md"),
      [
        "---",
        "kind: finding",
        "by: grug",
        "at: 2026-06-17T13:00:00Z",
        "confidence: high",
        "---",
        "",
        "broken-regen trigger.",
        "",
      ].join("\n"),
      "utf8",
    );
    try {
      const r = runFreshness();
      expect(r.status).not.toBe(0);
      // The success-only marker must be ABSENT — a broken regen must never read as fresh.
      expect(r.stdout.toLowerCase()).not.toContain(
        "matches a fresh regeneration",
      );
    } finally {
      rmSync(join(contextRoot, badTask), { recursive: true, force: true });
    }
  });
});
