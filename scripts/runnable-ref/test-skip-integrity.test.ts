// test-skip-integrity.test.ts — the un-cheatable test-integrity checker's Vitest harness.
//
// This suite PROVES the D-12 invocation+result contract AND the test-integrity rules end-to-end
// by spawning the COMMITTED test-skip-integrity.js (never the .ts) via spawnSync and asserting the
// exit-code + stdout + --json shape. The "hollow" case is the SC3 keystone (TINT-01): a registry
// row with a placeholder owner makes the checker exit 1. The remaining cases cover the D-05 edge
// lanes (expired blocks, valid quarantine passes, over-count blocks), the fail-closed exit-2 error
// path, the --json block, and host-emulation.
//
// The D-12 contract:
//   exit 0 = pass / no findings   ·   exit 1 = findings / fail (the gate blocks)
//   exit 2 = error (could not run — distinguishable from a clean fail)
//   stdout = human-readable findings in CLEAR PROFESSIONAL VOICE   ·   optional --json block
//
// Pitfall 3 (host-emulation): the checker uses node: builtins ONLY. The last case copies the
// compiled test-skip-integrity.js into a mkdtempSync temp dir with NO node_modules reachable and
// asserts it still exits 1 on the hollow fixture — proving the routine needs only bare Node, the
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
const CHECK_JS = join(HERE, "test-skip-integrity.js");
const CLEAN = join(HERE, "fixtures", "clean-test-skips.md");
const HOLLOW = join(HERE, "fixtures", "hollow-test-skips.md");
const EXPIRED = join(HERE, "fixtures", "expired-test-skips.md");
const QUARANTINE = join(HERE, "fixtures", "quarantine-test-skips.md");

// runCheck — spawn test-skip-integrity.js with the given args, capture { status, stdout, stderr }.
// Mirrors the guard.test idiom (spawnSync node <js> … → assert .status + .stdout).
function runCheck(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync("node", [CHECK_JS, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// Track every mkdtemp dir so afterEach cleans them all (nothing leaks outside tmpdir).
const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-test-integrity-"));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) {
    rmSync(tmpDirs.pop()!, { recursive: true, force: true });
  }
});

describe("test-skip-integrity.js — the un-cheatable test-integrity checker (D-12 + TINT rules)", () => {
  // ── clean — well-formed registry, skips ≤ valid justifications → exit 0 (TINT-01) ────────────
  it("exits 0 on the clean fixture when skip count does not exceed valid justifications", () => {
    const r = runCheck(CLEAN, "--skip-count", "3");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("No findings.");
  });

  // ── hollow — placeholder owner → exit 1 (THE SC3 KEYSTONE, TINT-01) ──────────────────────────
  it("exits 1 on the hollow fixture (placeholder owner) and names the offending row in clear voice", () => {
    const r = runCheck(HOLLOW, "--skip-count", "1");
    expect(r.status).toBe(1);
    // CLEAR PROFESSIONAL VOICE: the finding names the offending Test ID and the no-real-owner reason.
    expect(r.stdout).toContain("auth.login.rate-limit");
    expect(r.stdout.toLowerCase()).toContain("no real owner");
  });

  // ── expired — far-past Expiry → exit 1 even when counts balance (D-05, TINT-02) ───────────────
  it("exits 1 on an expired entry even when the skip count balances", () => {
    // One valid-format row, but expired; even --skip-count 0 must not rescue it (it still blocks).
    const r = runCheck(EXPIRED, "--skip-count", "0");
    expect(r.status).toBe(1);
    expect(r.stdout.toLowerCase()).toContain("expired");
  });

  // ── quarantine — valid+unexpired flaky-quarantine → exit 0 (non-blocking lane, TINT-02) ───────
  it("exits 0 on a valid, unexpired flaky-quarantine row (the non-blocking lane)", () => {
    const r = runCheck(QUARANTINE, "--skip-count", "1");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("No findings.");
  });

  // ── over-count — skip count greater than valid justifications → exit 1 (D-05, TINT-02) ────────
  it("exits 1 when the reported skip count exceeds the valid-justification count", () => {
    const r = runCheck(CLEAN, "--skip-count", "4"); // clean has 3 valid justifications
    expect(r.status).toBe(1);
    expect(r.stdout.toLowerCase()).toContain("unjustified skips");
  });

  // ── missing — nonexistent registry path → exit 2 (error, not a false pass) ────────────────────
  it("exits 2 on a missing registry path (error, distinguishable from a clean fail) and reports to stderr", () => {
    const r = runCheck(join(HERE, "fixtures", "nope.md"), "--skip-count", "0");
    expect(r.status).toBe(2);
    expect(r.stderr.toLowerCase()).toContain("error");
  });

  // ── missing skip count — UNKNOWN - verify → exit 1 (never a silent 0, D-14) ───────────────────
  it("exits 1 when no skip count is provided (UNKNOWN - verify, never a silent pass)", () => {
    const r = runCheck(CLEAN);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("UNKNOWN - verify");
  });

  // ── json — --json on the hollow fixture → { ok:false, findings:[...] } block ──────────────────
  it("emits a machine-readable { ok:false, findings:[...] } block under --json on the hollow fixture", () => {
    const r = runCheck(HOLLOW, "--skip-count", "1", "--json");
    expect(r.status).toBe(1);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    expect(parsed.ok).toBe(false);
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(parsed.findings.length).toBeGreaterThan(0);
  });

  // ── host-emulation (Pitfall 3): run from a bare temp dir with NO node_modules reachable ───────
  // Copy the compiled test-skip-integrity.js into a mkdtemp dir that has no node_modules and run
  // it against the hollow fixture: it must still exit 1, proving the routine needs only bare Node
  // (node: builtins only). This is the D-11 host-CI emulation — the central kit is absent.
  it("host-emulation: the materialized .js runs from a bare temp dir (no node_modules) and exits 1 on the hollow fixture", () => {
    const host = mkTmp();
    const hostJs = join(host, "test-skip-integrity.js");
    copyFileSync(CHECK_JS, hostJs);
    // Run the copied .js against the hollow fixture (absolute path), cwd = the bare host dir.
    const r = spawnSync("node", [hostJs, resolve(HOLLOW), "--skip-count", "1"], {
      encoding: "utf8",
      cwd: host,
    });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("auth.login.rate-limit");
  });
});
