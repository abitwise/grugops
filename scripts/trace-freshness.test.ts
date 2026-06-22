// trace-freshness.test.ts — behavioral oracle for the MIGR-03 trace render freshness gate (D-03).
//
// Drives the COMMITTED compiled artifacts (never the .ts): spawns scripts/trace-freshness.js as the
// gate against mkdtempSync CHECK_ROOT mirrors, and uses scripts/trace-render.js to commit a fresh
// render into the same mirror. Nothing is written into the committed tree. NOT in the e2e lane
// (project memory: bare `npm test` triggers the live claude-CLI lane; this is a hermetic temp test).
//
// Proves (D-03 — fail-closed; the trace is the proof):
//   fresh   : committed plans/traceability.md matches a fresh regen from the notes → exit 0.
//   STALE   : the committed render edited without re-rendering → exit 1, stdout names the file + STALE.
//   greenfield : no .grugops/context/ notes tree yet → exit 0 (vacuous pass, honest).
//   fail-closed : notes exist but the committed render is absent/unreadable → the gate NEVER reports
//                 fresh; exit 1 (a non-clean situation is never a silent pass).
//
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  appendFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const RENDER_JS = join(ROOT, "scripts", "trace-render.js");
const GATE_JS = join(ROOT, "scripts", "trace-freshness.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Plant a valid note carrying the given refs under <ctxRoot>/<task>/notes/<name>.md.
function plantNote(ctxRoot: string, task: string, name: string, at: string, refs: string[]): void {
  const notesDir = join(ctxRoot, task, "notes");
  mkdirSync(notesDir, { recursive: true });
  const refsBlock = refs.map((r) => `  - ${r}`).join("\n");
  const text =
    "---\n" +
    `id: ${name}\n` +
    "kind: artifact-ref\n" +
    "by: engineer\n" +
    `at: ${at}\n` +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    refsBlock +
    "\n" +
    "supersedes: \n" +
    "---\n\n" +
    "an artifact-ref note carrying trace refs.\n";
  writeFileSync(join(notesDir, `${name}.md`), text, "utf8");
}

// A CHECK_ROOT holding .grugops/context/ + plans/.
function makeCheckRoot(prefix: string): { checkRoot: string; ctxRoot: string; plansRoot: string } {
  const checkRoot = freshTmp(prefix);
  const ctxRoot = join(checkRoot, ".grugops", "context");
  const plansRoot = join(checkRoot, "plans");
  mkdirSync(ctxRoot, { recursive: true });
  mkdirSync(plansRoot, { recursive: true });
  return { checkRoot, ctxRoot, plansRoot };
}

// Commit a fresh render into the CHECK_ROOT (drives the committed trace-render.js CLI).
function commitFreshRender(ctxRoot: string, plansRoot: string): void {
  const r = spawnSync("node", [RENDER_JS, ctxRoot, plansRoot], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`render failed to seed the fixture: ${r.stderr}`);
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

describe("trace-freshness gate — fail-closed on drift (D-03)", () => {
  it("exits 0 when the committed render is fresh", () => {
    const { checkRoot, ctxRoot, plansRoot } = makeCheckRoot("trace-gate-clean-");
    plantNote(ctxRoot, "taskA", "n1", "2026-06-21T10:00:00Z", ["ABC-001", "src/a.ts"]);
    commitFreshRender(ctxRoot, plansRoot); // commit a fresh render
    const r = runGate(checkRoot);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/fresh/i);
  });

  it("exits non-zero (naming the file + STALE) when the committed render is edited without re-rendering", () => {
    const { checkRoot, ctxRoot, plansRoot } = makeCheckRoot("trace-gate-drift-");
    plantNote(ctxRoot, "taskA", "n1", "2026-06-21T10:00:00Z", ["ABC-001", "src/a.ts"]);
    commitFreshRender(ctxRoot, plansRoot);
    // A hand-edit to the committed render that diverges from the notes.
    appendFileSync(join(plansRoot, "traceability.md"), "| TAMPER-001 | | | | |\n");
    const r = runGate(checkRoot);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/traceability\.md/);
    expect(r.stdout).toMatch(/STALE/);
  });

  it("greenfield: no .grugops/context/ notes tree → vacuous pass (exit 0)", () => {
    const checkRoot = freshTmp("trace-gate-greenfield-");
    mkdirSync(join(checkRoot, "plans"), { recursive: true }); // plans exists, no .grugops/context/
    const r = runGate(checkRoot);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/vacuous pass/i);
  });

  it("fail-closed: notes exist but the committed render is absent → never reports fresh (exit 1)", () => {
    const { checkRoot, ctxRoot } = makeCheckRoot("trace-gate-failclosed-");
    // Notes exist (NOT greenfield), but no committed plans/traceability.md was ever rendered.
    plantNote(ctxRoot, "taskA", "n1", "2026-06-21T10:00:00Z", ["ABC-001", "src/a.ts"]);
    const r = runGate(checkRoot);
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toMatch(/Traceability fresh:/); // never the fresh verdict
    expect(r.stdout).toMatch(/FAILED|could not be read/);
  });
});
