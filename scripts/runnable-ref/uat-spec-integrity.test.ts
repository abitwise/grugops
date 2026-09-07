// uat-spec-integrity.test.ts — the UAT spec-integrity checker's Vitest harness (UATX-05, UATX-06).
//
// This suite PROVES the D-12 invocation+result contract AND D-14's ban set end-to-end by spawning
// the COMMITTED uat-spec-integrity.js (never the .ts) and asserting exit code + stdout + stderr, and
// it PROVES the two D-15 loud-skip clauses by importing the same committed .js and injecting a
// failing probe. Both halves read the one artifact the installer materializes.
//
// The D-12 contract (a prior phase's decision, uniform across kit-shipped runnables):
//   exit 0 = pass / no findings   ·   exit 1 = findings / the gate blocks
//   exit 2 = error (could not run — distinguishable from a clean fail)
//
// WHERE THE FIXTURES LIVE, AND WHY IT MATTERS. scripts/runnable-ref/fixtures/*.uat.spec.ts sit
// OUTSIDE any `uat/` path segment on purpose. The checker's recognition key is "a `uat` path segment
// AND the .uat.spec.ts suffix" (D-05), so a run of the checker against grugops's OWN repository root
// derives ZERO of them — this tree never becomes an accidental spec corpus, and the fixtures can
// carry the banned constructs safely. Every case below reaches a fixture by COPYING it into a temp
// tree that does have the `uat/` segment. Do not "fix" the fixture location by moving them under a
// uat/ directory: that would put refused constructs into grugops's own derived set.

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";

// Run the COMMITTED compiled artifact, not the .ts (the repo-wide runnable-test convention).
const HERE = import.meta.dirname;
const CHECK_JS = join(HERE, "uat-spec-integrity.js");
const FIXTURES = join(HERE, "fixtures");
const REPO_ROOT = resolve(HERE, "..", "..");
const REPO_NODE_MODULES = join(REPO_ROOT, "node_modules");

// The module surface the injection cases reach. Imported DYNAMICALLY inside the cases that need it
// so that a missing artifact fails those cases on their own terms rather than preventing this file
// from loading at all (which would make every case fail for one unrelated reason).
interface CheckerModule {
  readonly UAT_SPEC_GLOB_SUFFIX: string;
  readonly PARSER_ABSENT_MARKER: string;
  readonly BROWSER_ABSENT_MARKER: string;
  readonly BROWSER_ABSENT_STAGES: Readonly<Record<"parser_package" | "browser_binaries", string>>;
  readonly BANNED_CONSTRUCTS: ReadonlyArray<{ readonly object: string; readonly member: string }>;
  emitLoudSkipIfBrowserUnusable(
    repoRoot: string,
    probe?: (repoRoot: string) => "parser_package" | "browser_binaries" | null,
  ): boolean;
}

async function loadChecker(): Promise<CheckerModule> {
  return (await import("./uat-spec-integrity.js")) as unknown as CheckerModule;
}

function runCheck(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync("node", [CHECK_JS, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// Track every mkdtemp dir so afterEach cleans them all (nothing leaks outside tmpdir).
const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-uat-spec-integrity-"));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) {
    rmSync(tmpDirs.pop()!, { recursive: true, force: true });
  }
});

// mkTargetRepo — build a temp repository that emulates a host target.
//   specs        : { <repo-relative dest> : <fixture file name> }
//   withTypescript: symlink this repo's node_modules so `typescript` resolves FROM THE TARGET
//                   (D-13 — grugops ships no parser; the target supplies it).
function mkTargetRepo(
  specs: Record<string, string>,
  withTypescript = true,
): string {
  const root = mkTmp();
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "target", private: true }), "utf8");
  if (withTypescript) {
    symlinkSync(REPO_NODE_MODULES, join(root, "node_modules"), "dir");
  }
  for (const [destRel, fixtureName] of Object.entries(specs)) {
    const dest = join(root, destRel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(FIXTURES, fixtureName), dest);
  }
  return root;
}

describe("uat-spec-integrity.js — the D-12 contract and D-14 arm (c) (UATX-06)", () => {
  // ── clean corpus → exit 0, and the pass line REPORTS WHAT IT MEASURED ────────────────────────
  it("exits 0 on a clean uat spec and reports the derived count on the pass line", () => {
    const root = mkTargetRepo({ "e2e/uat/checkout.uat.spec.ts": "clean.uat.spec.ts" });
    const r = runCheck(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("1/1");
  });

  // ── arm (c): a banned modifier call → exit 1 naming file, line and member (D-14c) ────────────
  it("exits 1 on a banned modifier call and names the file, the line and the member", () => {
    const root = mkTargetRepo({ "e2e/uat/refund.uat.spec.ts": "modifier-call.uat.spec.ts" });
    const r = runCheck(root);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("e2e/uat/refund.uat.spec.ts:12");
    expect(r.stdout).toContain("test.skip");
  });

  // ── D-13: no typescript in the target → LOUD SKIP, exit 2, and NO pass line ──────────────────
  it("exits 2 with the parser-absent marker when typescript cannot be resolved from the target", async () => {
    const { PARSER_ABSENT_MARKER } = await loadChecker();
    const root = mkTargetRepo({ "e2e/uat/checkout.uat.spec.ts": "clean.uat.spec.ts" }, false);
    const r = runCheck(root);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain(PARSER_ABSENT_MARKER);
    expect(PARSER_ABSENT_MARKER).toContain("typescript");
    expect(r.stdout).not.toContain("0 findings");
  });

  // ── the vacuity floor: a derived set of zero can never print a pass (UATX-06) ─────────────────
  it("exits 2 and states the derived spec set was empty when the target holds no uat spec", () => {
    const root = mkTargetRepo({});
    const r = runCheck(root);
    expect(r.status).toBe(2);
    expect(`${r.stdout}${r.stderr}`.toLowerCase()).toContain("zero");
    expect(r.stdout).not.toContain("0 findings");
  });

  // ── the fixture-location invariant: grugops's OWN root derives zero uat specs ─────────────────
  it("derives zero specs from grugops's own repository root (the fixtures are not a corpus here)", () => {
    const r = runCheck(REPO_ROOT);
    expect(r.status).toBe(2);
    expect(`${r.stdout}${r.stderr}`.toLowerCase()).toContain("zero");
  });

  // ── input errors are exit 2, never a silent pass ──────────────────────────────────────────────
  it("exits 2 when no target path is provided", () => {
    const r = runCheck();
    expect(r.status).toBe(2);
    expect(r.stderr.toLowerCase()).toContain("usage");
  });

  it("exits 2 when the target path does not exist", () => {
    const r = runCheck(join(tmpdir(), "grugops-no-such-target-9d2f1a"));
    expect(r.status).toBe(2);
    expect(r.stderr.toLowerCase()).toContain("error");
  });

  // ── --json on both the pass and the finding path ──────────────────────────────────────────────
  it("emits { ok:true, findings:[] } under --json on the pass path", () => {
    const root = mkTargetRepo({ "e2e/uat/checkout.uat.spec.ts": "clean.uat.spec.ts" });
    const r = runCheck(root, "--json");
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    expect(parsed.ok).toBe(true);
    expect(parsed.findings).toEqual([]);
  });

  it("emits { ok:false, findings:[...] } under --json on the finding path", () => {
    const root = mkTargetRepo({ "e2e/uat/refund.uat.spec.ts": "modifier-call.uat.spec.ts" });
    const r = runCheck(root, "--json");
    expect(r.status).toBe(1);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    expect(parsed.ok).toBe(false);
    expect(parsed.findings.length).toBeGreaterThan(0);
  });

  // ── host-emulation: bare temp dir, no node_modules of grugops's own reachable ──────────────────
  it("host-emulation: the materialized .js runs from a bare temp dir and still exits 1", () => {
    const host = mkTmp();
    const hostJs = join(host, "uat-spec-integrity.js");
    copyFileSync(CHECK_JS, hostJs);
    const root = mkTargetRepo({ "e2e/uat/refund.uat.spec.ts": "modifier-call.uat.spec.ts" });
    const r = spawnSync("node", [hostJs, root], { encoding: "utf8", cwd: host });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("test.skip");
  });

  // ── the ban set is ONE exported constant the recipe quotes (D-14 "claim matches mechanism") ────
  it("exports BANNED_CONSTRUCTS as the six locked member calls", async () => {
    const { BANNED_CONSTRUCTS, UAT_SPEC_GLOB_SUFFIX } = await loadChecker();
    expect(UAT_SPEC_GLOB_SUFFIX).toBe(".uat.spec.ts");
    const pairs = BANNED_CONSTRUCTS.map((b) => `${b.object}.${b.member}`).sort();
    expect(pairs).toEqual([
      "describe.only",
      "describe.skip",
      "expect.soft",
      "test.fixme",
      "test.only",
      "test.skip",
    ]);
  });
});

describe("uat-spec-integrity.js — the D-15 two-stage browser loud skip (UATX-05)", () => {
  // Capture process.stderr.write around the single emission point.
  function captureStderr(fn: () => void): string {
    const chunks: string[] = [];
    const original = process.stderr.write.bind(process.stderr);
    (process.stderr as { write: unknown }).write = (chunk: unknown): boolean => {
      chunks.push(String(chunk));
      return true;
    };
    try {
      fn();
    } finally {
      (process.stderr as { write: unknown }).write = original;
    }
    return chunks.join("");
  }

  it("a usable lane returns true and emits nothing", async () => {
    const mod = await loadChecker();
    let returned = false;
    const written = captureStderr(() => {
      returned = mod.emitLoudSkipIfBrowserUnusable("/nowhere", () => null);
    });
    expect(returned).toBe(true);
    expect(written).toBe("");
  });

  it("stage 1 unavailable emits the marker plus the stage-1 clause byte-for-byte and returns false", async () => {
    const mod = await loadChecker();
    let returned = true;
    const written = captureStderr(() => {
      returned = mod.emitLoudSkipIfBrowserUnusable("/nowhere", () => "parser_package");
    });
    expect(returned).toBe(false);
    expect(written).toBe(
      `${mod.BROWSER_ABSENT_MARKER} (${mod.BROWSER_ABSENT_STAGES.parser_package})\n`,
    );
    // The marker states the honest outcome, not merely that something happened.
    expect(mod.BROWSER_ABSENT_MARKER.startsWith("SKIPPED:")).toBe(true);
    expect(mod.BROWSER_ABSENT_MARKER).toContain("pending");
    expect(mod.BROWSER_ABSENT_STAGES.parser_package).toContain("@playwright/test");
  });

  it("stage 2 unavailable emits the marker plus the stage-2 clause byte-for-byte and returns false", async () => {
    const mod = await loadChecker();
    let returned = true;
    const written = captureStderr(() => {
      returned = mod.emitLoudSkipIfBrowserUnusable("/nowhere", () => "browser_binaries");
    });
    expect(returned).toBe(false);
    expect(written).toBe(
      `${mod.BROWSER_ABSENT_MARKER} (${mod.BROWSER_ABSENT_STAGES.browser_binaries})\n`,
    );
    expect(mod.BROWSER_ABSENT_STAGES.browser_binaries).not.toBe(
      mod.BROWSER_ABSENT_STAGES.parser_package,
    );
  });

  // The real probe reached through the CLI: a target with no @playwright/test fails at stage 1.
  it("--check-browser exits 2 with the stage-1 clause when @playwright/test is absent from the target", async () => {
    const mod = await loadChecker();
    const root = mkTargetRepo({ "e2e/uat/checkout.uat.spec.ts": "clean.uat.spec.ts" });
    const r = runCheck(root, "--check-browser");
    expect(r.status).toBe(2);
    expect(r.stderr).toContain(
      `${mod.BROWSER_ABSENT_MARKER} (${mod.BROWSER_ABSENT_STAGES.parser_package})`,
    );
    expect(r.stdout).not.toContain("0 findings");
  });
});
