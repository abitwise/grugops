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
  readFileSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { createRequire } from "node:module";
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
interface SpecAnalysisView {
  readonly visited: number;
  readonly expected: number;
  readonly findings: readonly string[];
  readonly errors: readonly string[];
}

interface CheckerModule {
  readonly UAT_SPEC_GLOB_SUFFIX: string;
  readonly PARSER_ABSENT_MARKER: string;
  readonly BROWSER_ABSENT_MARKER: string;
  readonly BROWSER_ABSENT_STAGES: Readonly<Record<"parser_package" | "browser_binaries", string>>;
  readonly BANNED_CONSTRUCTS: ReadonlyArray<{ readonly object: string; readonly member: string }>;
  readonly SKIPPED_DIRECTORIES: readonly string[];
  emitLoudSkipIfBrowserUnusable(
    repoRoot: string,
    probe?: (repoRoot: string) => "parser_package" | "browser_binaries" | null,
  ): boolean;
  deriveSpecPaths(repoRoot: string): { relPaths: readonly string[]; refusals: readonly string[] };
  analyzeSpecs(
    repoRoot: string,
    specRelPaths: readonly string[],
    ts: unknown,
    readFile?: (absPath: string) => string,
  ): SpecAnalysisView;
  reportMeasured(
    m: { visited: number; expected: number; findings: readonly string[] },
    wantJson: boolean,
    out: (s: string) => void,
    err: (s: string) => void,
  ): number;
}

// The parser this repository provides, reached the same way the runnable reaches the target's.
const requireFromHere = createRequire(import.meta.url);
const hostTypeScript: unknown = requireFromHere("typescript");

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

// ── the mutation harness (D-14 discrimination) ─────────────────────────────────────────────────
//
// Each per-arm fixture marks its banned constructs, and ONLY those, between MUTATE-REMOVE-START and
// MUTATE-REMOVE-END. Deleting exactly the marked lines and asserting the checker then exits 0 is
// what proves a finding was caused by the construct it NAMES: the try block, the catch clause, the
// if/else, the ternary and the straight-line assertions all survive the deletion, so none of them
// can have been the cause. A fixture that still fails after its construct is removed is a fixture
// whose finding came from something else.
const MUTATE_START = "MUTATE-REMOVE-START";
const MUTATE_END = "MUTATE-REMOVE-END";

function withBannedConstructsRemoved(fixtureName: string): string {
  const lines = readFileSync(join(FIXTURES, fixtureName), "utf8").split("\n");
  const kept: string[] = [];
  let dropping = false;
  let regions = 0;
  // A marker is recognised ONLY as a comment line that OPENS with it. `includes` would also match
  // the fixture header's prose description of the markers, which would open a region at the top of
  // the file and silently delete the imports — measured: it produced four parse diagnostics and an
  // exit 2 that looked like a checker defect rather than a harness defect.
  for (const line of lines) {
    const opener = line.trim();
    if (opener.startsWith(`// ${MUTATE_START}`)) {
      dropping = true;
      regions++;
      continue;
    }
    if (opener.startsWith(`// ${MUTATE_END}`)) {
      dropping = false;
      continue;
    }
    if (!dropping) kept.push(line);
  }
  if (regions === 0) {
    throw new Error(`${fixtureName} carries no ${MUTATE_START} region — the mutation would be a no-op`);
  }
  if (dropping) {
    throw new Error(`${fixtureName} has an unterminated ${MUTATE_START} region`);
  }
  return kept.join("\n");
}

/** Plant a mutated spec (banned constructs deleted) in a fresh target repo and run the checker. */
function runMutated(fixtureName: string): { status: number | null; stdout: string; stderr: string } {
  const root = mkTargetRepo({});
  const dest = join(root, "e2e", "uat", "mutated.uat.spec.ts");
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, withBannedConstructsRemoved(fixtureName), "utf8");
  return runCheck(root);
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
    expect(r.stdout).toContain("e2e/uat/refund.uat.spec.ts:13");
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

describe("uat-spec-integrity.js — D-14 arms (a) and (b), and the union of the arms (UATX-06)", () => {
  // ── arm (a): caught assertions, expect AND assert, try block AND catch clause ─────────────────
  it("refuses an expect inside a try block and an assert inside a catch clause", () => {
    const root = mkTargetRepo({ "e2e/uat/orders.uat.spec.ts": "caught-assertion.uat.spec.ts" });
    const r = runCheck(root);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("caught assertion");
    expect(r.stdout).toContain("inside a try block");
    expect(r.stdout).toContain("inside a catch clause");
    // The `assert` head is refused in arm (a), not only `expect`.
    expect(r.stdout).toContain("`assert` call");
  });

  // ── arm (b): every conditional position D-14 names ────────────────────────────────────────────
  it("refuses an expect under an if, an else, a conditional expression, each logical operand and an optional call", () => {
    const root = mkTargetRepo({ "e2e/uat/dashboard.uat.spec.ts": "conditional-assertion.uat.spec.ts" });
    const r = runCheck(root);
    expect(r.status).toBe(1);
    for (const where of [
      "under an if statement",
      "under an else clause",
      "inside a conditional expression",
      "as an operand of a logical operator",
      "as an optional call",
    ]) {
      expect(r.stdout).toContain(where);
    }
    // Both ternary arms and all three logical operators are separate positions, so arm (b) reports
    // more findings than the five distinct phrasings above.
    expect(r.stdout).toContain("conditional assertion");
  });

  // ── the union, not the first hit ──────────────────────────────────────────────────────────────
  it("reports findings from ALL THREE arms on the union fixture, not only the first arm reached", () => {
    const root = mkTargetRepo({ "e2e/uat/billing.uat.spec.ts": "union-all-arms.uat.spec.ts" });
    const r = runCheck(root, "--json");
    expect(r.status).toBe(1);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    expect(parsed.findings.length).toBeGreaterThanOrEqual(3);
    const joined = parsed.findings.join("\n");
    expect(joined).toContain("caught assertion");
    expect(joined).toContain("conditional assertion");
    expect(joined).toContain("banned modifier call");
  });

  // ── the adversarial negative: control flow and assertion-shaped TEXT are not the ban ──────────
  it("accepts the adversarial clean fixture (if, try, finally, a banned name in a comment and in a string)", () => {
    const root = mkTargetRepo({ "e2e/uat/checkout.uat.spec.ts": "clean.uat.spec.ts" });
    const r = runCheck(root);
    expect(r.status).toBe(0);
    // Prove the negative is really adversarial rather than merely empty.
    const text = readFileSync(join(FIXTURES, "clean.uat.spec.ts"), "utf8");
    expect(text).toContain("try {");
    expect(text).toContain("finally {");
    expect(text).toContain("if (");
    expect(text).toContain("test.skip"); // present as prose and inside a string literal only
  });

  // ── mutation: each finding is proven to be caused by the construct it names ────────────────────
  for (const fixture of [
    "caught-assertion.uat.spec.ts",
    "conditional-assertion.uat.spec.ts",
    "modifier-call.uat.spec.ts",
  ]) {
    it(`mutation: ${fixture} is accepted once its banned constructs, and only those, are removed`, () => {
      const before = runCheck(
        mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": fixture }),
      );
      expect(before.status).toBe(1); // the un-mutated fixture is refused
      const after = runMutated(fixture);
      expect(after.status).toBe(0); // removing exactly the construct clears the finding
      expect(after.stdout).toContain("1/1");
    });
  }

  // ── the locked-set boundary: what is deliberately NOT refused ──────────────────────────────────
  it("does not refuse an assertion in a finally block, a promise catch handler, or a spec with no assertions", () => {
    const root = mkTargetRepo({});
    const dest = join(root, "e2e", "uat", "boundary.uat.spec.ts");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(
      dest,
      [
        'import { test, expect } from "@playwright/test";',
        'test("outside the locked set", async ({ page }) => {',
        '  await page.goto("/x");',
        "  try {",
        '    await page.getByTestId("a").click();',
        "  } finally {",
        '    await expect(page.getByTestId("a")).toBeVisible();', // finally: deferred, not refused
        "  }",
        '  await page.goto("/y").catch(() => { expect(page.url()).toContain("/y"); });', // .catch: deferred
        "});",
        'test("no assertions at all", async ({ page }) => {',
        '  await page.goto("/z");', // zero-expect vacuity: deferred, not refused
        "});",
        "",
      ].join("\n"),
      "utf8",
    );
    const r = runCheck(root);
    expect(r.status).toBe(0);
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

describe("uat-spec-integrity.js — the vacuity and short-set floors (UATX-06)", () => {
  // Plant a file at an arbitrary repo-relative path inside a target repo.
  function plant(root: string, relPath: string, body: string): void {
    const dest = join(root, relPath);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
  }
  const TRIVIAL_SPEC = [
    'import { test, expect } from "@playwright/test";',
    'test("a scenario", async ({ page }) => {',
    '  await page.goto("/x");',
    '  await expect(page.getByTestId("x")).toBeVisible();',
    "});",
    "",
  ].join("\n");

  // ── branch (4): the pass line CARRIES the measurement ─────────────────────────────────────────
  it("reports N/N on the pass line for a two-spec target", () => {
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/one.uat.spec.ts", TRIVIAL_SPEC);
    plant(root, "e2e/uat/two.uat.spec.ts", TRIVIAL_SPEC);
    const r = runCheck(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("2/2");
  });

  // ── branch (1): a loop that never runs reports 0 and FAILS its own floor ──────────────────────
  it("a stubbed-out loop (visited 0 of a non-empty derived set) exits 2 rather than passing", async () => {
    const { reportMeasured } = await loadChecker();
    let out = "";
    let err = "";
    const code = reportMeasured(
      { visited: 0, expected: 7, findings: [] },
      false,
      (s) => {
        out += s;
      },
      (s) => {
        err += s;
      },
    );
    expect(code).toBe(2);
    expect(err.toLowerCase()).toContain("zero");
    expect(err).toContain("7");
    expect(out).toBe(""); // no pass line may be printed on this branch
  });

  // ── branch (2): a SHORT scan set, forced through the injectable reader ────────────────────────
  it("forcing the reader to throw on one file yields visited < expected and exit code 2 naming both numbers", async () => {
    const { analyzeSpecs, reportMeasured } = await loadChecker();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/one.uat.spec.ts", TRIVIAL_SPEC);
    plant(root, "e2e/uat/two.uat.spec.ts", TRIVIAL_SPEC);
    plant(root, "e2e/uat/three.uat.spec.ts", TRIVIAL_SPEC);

    const analysis = analyzeSpecs(
      root,
      ["e2e/uat/one.uat.spec.ts", "e2e/uat/two.uat.spec.ts", "e2e/uat/three.uat.spec.ts"],
      hostTypeScript,
      (absPath: string) => {
        if (absPath.endsWith("two.uat.spec.ts")) throw new Error("forced read failure");
        return readFileSync(absPath, "utf8");
      },
    );

    // The unreadable file is a could-not-run reason and did NOT count toward `visited`.
    expect(analysis.expected).toBe(3);
    expect(analysis.visited).toBe(2);
    expect(analysis.errors.join("\n")).toContain("two.uat.spec.ts");

    let out = "";
    let err = "";
    const code = reportMeasured(analysis, false, (s) => {
      out += s;
    }, (s) => {
      err += s;
    });
    expect(code).toBe(2);
    expect(err).toContain("2");
    expect(err).toContain("3");
    expect(out).toBe(""); // never a pass line, and never a bare findings report
  });

  // ── the two counters have two origins ─────────────────────────────────────────────────────────
  it("expected comes from the derived list and visited from the loop, so an empty input yields 0 of 0", async () => {
    const { analyzeSpecs } = await loadChecker();
    const root = mkTargetRepo({});
    const analysis = analyzeSpecs(root, [], hostTypeScript);
    expect(analysis.expected).toBe(0);
    expect(analysis.visited).toBe(0);
  });

  // ── the walker's INPUT BOUNDARY, tested on BOTH sides ─────────────────────────────────────────
  it("does not count a uat spec planted under node_modules", async () => {
    const { SKIPPED_DIRECTORIES, deriveSpecPaths } = await loadChecker();
    expect(SKIPPED_DIRECTORIES).toContain("node_modules");
    const root = mkTmp(); // no node_modules symlink: we create a real one to plant inside
    writeFileSync(join(root, "package.json"), "{}", "utf8");
    plant(root, "node_modules/some-dep/e2e/uat/dep.uat.spec.ts", TRIVIAL_SPEC);
    expect(deriveSpecPaths(root).relPaths).toEqual([]);
  });

  it("counts a uat spec in a legitimate deeply nested uat directory", async () => {
    const { deriveSpecPaths } = await loadChecker();
    const root = mkTmp();
    writeFileSync(join(root, "package.json"), "{}", "utf8");
    plant(root, "packages/web/tests/e2e/uat/deep.uat.spec.ts", TRIVIAL_SPEC);
    expect(deriveSpecPaths(root).relPaths).toEqual(["packages/web/tests/e2e/uat/deep.uat.spec.ts"]);
  });

  // ── the recognition key needs BOTH halves ─────────────────────────────────────────────────────
  it("requires both the uat path segment and the suffix", async () => {
    const { deriveSpecPaths } = await loadChecker();
    const root = mkTmp();
    writeFileSync(join(root, "package.json"), "{}", "utf8");
    plant(root, "e2e/uat/yes.uat.spec.ts", TRIVIAL_SPEC); // both halves
    plant(root, "e2e/regression/no.uat.spec.ts", TRIVIAL_SPEC); // suffix, no uat segment
    plant(root, "e2e/uat/no.spec.ts", TRIVIAL_SPEC); // uat segment, no suffix
    plant(root, "e2e/uat.uat.spec.ts", TRIVIAL_SPEC); // `uat` in the FILE name, not a segment
    expect(deriveSpecPaths(root).relPaths).toEqual(["e2e/uat/yes.uat.spec.ts"]);
  });

  // ── derivation is SORTED, so findings and the pass line are byte-identical across runs ────────
  it("derives the spec set in sorted repo-relative order", async () => {
    const { deriveSpecPaths } = await loadChecker();
    const root = mkTmp();
    writeFileSync(join(root, "package.json"), "{}", "utf8");
    for (const name of ["z", "a", "m"]) {
      plant(root, `e2e/uat/${name}.uat.spec.ts`, TRIVIAL_SPEC);
    }
    expect(deriveSpecPaths(root).relPaths).toEqual([
      "e2e/uat/a.uat.spec.ts",
      "e2e/uat/m.uat.spec.ts",
      "e2e/uat/z.uat.spec.ts",
    ]);
  });

  // ── an unparseable spec is could-not-run (exit 2), never a clean fail ─────────────────────────
  it("treats an unparseable spec as could-not-run and never as a pass", () => {
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/broken.uat.spec.ts", "test('x', async () => { if ( });\n");
    const r = runCheck(root);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("did not parse");
    expect(r.stdout).not.toContain("0 findings");
  });
});
