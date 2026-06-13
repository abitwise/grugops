// reference-check.test.ts — the TOOL-02 kit-shipped-runnable Vitest harness.
//
// This suite PROVES the uniform D-12 invocation+result contract end-to-end by spawning the
// COMMITTED reference-check.js (never the .ts) via spawnSync and asserting the exit-code +
// stdout + --json shape. It is the SC3/TOOL-02 proof Phase 16's cross-platform test-integrity
// checker plugs into (16-PRE-DECISIONS.md): the reference routine demonstrates the exact
// interface (committed, host-local, Node-only, exit-code-as-signal + clear-voice stdout) the
// eventual checker reuses.
//
// The D-12 contract (RESEARCH § "Kit-Shipped-Runnable Convention", Code Examples):
//   exit 0 = pass / no findings   ·   exit 1 = findings / fail (gate blocks)
//   exit 2 = error (could not run — distinguishable from a clean fail)
//   stdout = human-readable findings in CLEAR PROFESSIONAL VOICE   ·   optional --json block
//
// Pitfall 3 (host-emulation): the routine uses node: builtins ONLY. The last case copies the
// compiled reference-check.js into a mkdtempSync temp dir with NO node_modules reachable and
// asserts it still exits 1 on the bad fixture — proving the routine needs only bare Node, the
// whole point of D-11's "the central kit is absent in host CI".
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

// Run the COMMITTED compiled artifact, not the .ts (RESEARCH Pattern 3 / Shared Patterns).
const HERE = import.meta.dirname;
const CHECK_JS = join(HERE, "reference-check.js");
const CLEAN = join(HERE, "fixtures", "clean.txt");
const BAD = join(HERE, "fixtures", "bad.txt");

// runCheck — spawn reference-check.js with the given args, capture { status, stdout, stderr }.
// Mirrors the guard.test idiom (spawnSync node <js> … → assert .status + .stdout).
function runCheck(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync("node", [CHECK_JS, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// Track every mkdtemp dir so afterEach cleans them all (nothing leaks outside tmpdir).
const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-runnable-"));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) {
    rmSync(tmpDirs.pop()!, { recursive: true, force: true });
  }
});

describe("reference-check.js — the TOOL-02 kit-shipped-runnable (D-12 contract proof)", () => {
  // ── Test 1 — clean input → exit 0 + a clear-voice "No findings." line ────────────────────────
  it("exits 0 on a clean fixture and prints a clear-voice 'No findings.' line", () => {
    const r = runCheck(CLEAN);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("No findings.");
  });

  // ── Test 2 — bad input → exit 1 (the RED fixture proof) + a clear-voice finding ──────────────
  it("exits 1 on the planted bad fixture (RED) and names the finding in clear voice", () => {
    const r = runCheck(BAD);
    expect(r.status).toBe(1);
    // CLEAR PROFESSIONAL VOICE: the finding names the planted token, not caveman.
    expect(r.stdout).toContain("FORBIDDEN");
    expect(r.stdout.toLowerCase()).toContain("forbidden token");
  });

  // ── Test 3 — missing/unreadable input → exit 2 (error, distinguishable from a clean fail) ────
  it("exits 2 on a missing input path (error, distinguishable from a clean fail) and reports to stderr", () => {
    const r = runCheck(join(HERE, "fixtures", "does-not-exist.txt"));
    expect(r.status).toBe(2);
    expect(r.stderr.toLowerCase()).toContain("error");
  });

  // ── Test 3b — no input path at all → exit 2 (also an error, not a false pass) ─────────────────
  it("exits 2 when no input path is provided (fail-closed, never a false pass)", () => {
    const r = runCheck();
    expect(r.status).toBe(2);
  });

  // ── Test 4 — --json emits a machine-readable { ok:false, findings:[...] } block ──────────────
  it("emits a machine-readable { ok:false, findings:[...] } block under --json on the bad fixture", () => {
    const r = runCheck(BAD, "--json");
    expect(r.status).toBe(1);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    expect(parsed.ok).toBe(false);
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(parsed.findings.length).toBeGreaterThan(0);
  });

  // ── Test 4b — --json on a clean fixture emits { ok:true, findings:[] } ────────────────────────
  it("emits { ok:true, findings:[] } under --json on a clean fixture", () => {
    const r = runCheck(CLEAN, "--json");
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    expect(parsed.ok).toBe(true);
    expect(parsed.findings).toEqual([]);
  });

  // ── Test 5 — host-emulation (Pitfall 3): runs from a temp dir with NO node_modules reachable ──
  // Copy the compiled reference-check.js into a mkdtemp dir that has no node_modules and run it
  // against the bad fixture: it must still exit 1, proving the routine needs only bare Node
  // (node: builtins only). This is the D-11 host-CI emulation — the central kit is absent.
  it("host-emulation: the materialized .js runs from a bare temp dir (no node_modules) and exits 1 on bad input", () => {
    const host = mkTmp();
    const hostJs = join(host, "reference-check.js");
    copyFileSync(CHECK_JS, hostJs);
    // Run the copied .js against the bad fixture (absolute path), cwd = the bare host dir.
    const r = spawnSync("node", [hostJs, resolve(BAD)], { encoding: "utf8", cwd: host });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("FORBIDDEN");
  });
});
