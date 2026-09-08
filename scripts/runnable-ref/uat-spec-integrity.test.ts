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
  readdirSync,
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
  readonly BANNED_CONSTRUCTS: readonly string[];
  readonly BANNED_MODIFIER_HEADS: readonly string[];
  readonly BANNED_MODIFIER_TAILS: readonly string[];
  readonly BANNED_EXACT_PATHS: readonly string[];
  isBannedModifierPath(dottedPath: string | null): boolean;
  readonly UNRESOLVABLE_CALLEE_RESIDUALS: readonly string[];
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
  //
  // 31-06: the set is now DOTTED PATHS and has nine members — D-14's six, with its arm (c) names
  // re-expressed as paths, PLUS the three `test.describe.*` spellings @playwright/test actually
  // produces. Nothing D-14 named stopped being banned; the two bare-describe names are retained.
  it("exports BANNED_CONSTRUCTS as the nine dotted paths, a strict superset of D-14's six", async () => {
    const { BANNED_CONSTRUCTS, UAT_SPEC_GLOB_SUFFIX } = await loadChecker();
    expect(UAT_SPEC_GLOB_SUFFIX).toBe(".uat.spec.ts");
    expect(BANNED_CONSTRUCTS.every((b) => typeof b === "string")).toBe(true);
    expect([...BANNED_CONSTRUCTS].sort()).toEqual([
      "describe.only",
      "describe.skip",
      "expect.soft",
      "test.describe.fixme",
      "test.describe.only",
      "test.describe.skip",
      "test.fixme",
      "test.only",
      "test.skip",
    ]);
    // D-14's letter is PRESERVED: every name it enumerated is still decided.
    for (const d14 of [
      "test.skip",
      "test.fixme",
      "test.only",
      "describe.skip",
      "describe.only",
      "expect.soft",
    ]) {
      expect(BANNED_CONSTRUCTS, `D-14 named ${d14} and it must stay banned`).toContain(d14);
    }
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
    "element-access-modifier.uat.spec.ts",
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-06 GAP 2 — arm (c) against the spellings @playwright/test actually has.
//
// 31-VERIFICATION.md reproduced this live: a spec carrying `test.describe.only(...)`,
// `test.describe.skip(...)` and `test["skip"](...)` was run through the committed
// uat-spec-integrity.js and reported `0 findings over 1/1 uat specs checked`, exit 0. The matcher
// required the callee to be PropertyAccessExpression(Identifier, member) — a BARE `describe.only`,
// a spelling @playwright/test cannot produce, because it exports no top-level `describe`.
//
// The cases below are the coordinates of that bypass. Each one FAILED before the dotted-path
// normaliser landed; that is what makes them evidence rather than decoration.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity.js — 31-06 gap 2: the real Playwright modifier spellings (UATX-06)", () => {
  function plantSpec(body: string): string {
    const root = mkTargetRepo({});
    const dest = join(root, "e2e", "uat", "subject.uat.spec.ts");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
    return root;
  }

  function findingsOf(body: string): string[] {
    const r = runCheck(plantSpec(body), "--json");
    if (r.status === 0) return [];
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    return parsed.findings;
  }

  const IMPORT = 'import { test, expect } from "@playwright/test";';

  // ── RED 1/2: the three-segment dotted modifiers Playwright actually supports ─────────────────
  for (const modifier of ["only", "skip", "fixme"] as const) {
    it(`refuses test.describe.${modifier} and names the dotted path`, () => {
      const findings = findingsOf(
        [IMPORT, `test.describe.${modifier}("billing", () => {`, "});", ""].join("\n"),
      );
      expect(findings.length).toBe(1);
      expect(findings[0]).toContain(`test.describe.${modifier}`);
      expect(findings[0]).toContain("banned modifier call");
    });
  }

  // ── RED 3: bracket notation normalises to the SAME dotted path as its dotted spelling ────────
  it("refuses a bracket-notation modifier call and resolves it to the same dotted path", () => {
    const bracket = findingsOf([IMPORT, 'test["skip"]("a scenario", async () => {});', ""].join("\n"));
    const dotted = findingsOf([IMPORT, 'test.skip("a scenario", async () => {});', ""].join("\n"));
    expect(bracket.length).toBe(1);
    expect(dotted.length).toBe(1);
    // Same path, same sentence — one normaliser feeds one comparison, so the two spellings cannot
    // be decided differently.
    expect(bracket[0]).toBe(dotted[0]);
    expect(bracket[0]).toContain("test.skip");
  });

  it("refuses a bracket-notation modifier written with a no-substitution template literal", () => {
    const findings = findingsOf([IMPORT, "test[`only`](\"a scenario\", async () => {});", ""].join("\n"));
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.only");
  });

  // ── RED 4: the verifier's own spec, end to end, through the committed .js ────────────────────
  it("the spec 31-VERIFICATION.md ran exits 1 with one finding per construct", () => {
    const findings = findingsOf(
      [
        IMPORT,
        "",
        'test.describe.only("billing", () => {',
        '  test("an invoice is shown", async ({ page }) => {',
        '    await page.goto("/billing");',
        '    await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");',
        "  });",
        "});",
        "",
        'test.describe.skip("refunds", () => {',
        '  test("a refund is issued", async ({ page }) => {',
        '    await page.goto("/refunds");',
        '    await expect(page.getByTestId("refund-status")).toHaveText("Issued");',
        "  });",
        "});",
        "",
        'test["skip"]("a skipped scenario", async ({ page }) => {',
        '  await page.goto("/x");',
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(3);
    const joined = findings.join("\n");
    for (const path of ["test.describe.only", "test.describe.skip", "test.skip"]) {
      expect(joined).toContain(path);
    }
  });

  // ── GREEN 1: every member is exercised FROM the constant, never from a typed-out name ────────
  it("refuses every member of BANNED_CONSTRUCTS, iterated from the exported constant", async () => {
    const { BANNED_CONSTRUCTS } = await loadChecker();
    // PREMISE: the set is non-empty, so the loop below is not a vacuous pass.
    expect(BANNED_CONSTRUCTS.length, "PREMISE: BANNED_CONSTRUCTS is empty").toBeGreaterThan(0);
    for (const path of BANNED_CONSTRUCTS) {
      const findings = findingsOf([IMPORT, `${path}("a scenario", async () => {});`, ""].join("\n"));
      expect(findings.length, `${path}: expected exactly one finding`).toBe(1);
      expect(findings[0]).toContain(path);
    }
  });

  // ── GREEN 2: the UNION of the arms, not the first hit ────────────────────────────────────────
  it("reports one finding per member when every member appears in ONE spec", async () => {
    const { BANNED_CONSTRUCTS } = await loadChecker();
    const body = [
      IMPORT,
      ...BANNED_CONSTRUCTS.map((path, i) => `${path}("scenario ${i}", async () => {});`),
      "",
    ].join("\n");
    const findings = findingsOf(body);
    expect(findings.length).toBe(BANNED_CONSTRUCTS.length);
    for (const path of BANNED_CONSTRUCTS) {
      expect(findings.some((f) => f.includes(path)), `${path}: absent from the union`).toBe(true);
    }
  });

  // ── GREEN 3: every callee shape the normaliser claims to resolve ─────────────────────────────
  it("resolves a parenthesised, non-null-asserted, type-asserted and optional-chained callee", () => {
    for (const callee of ["(test).skip", "test!.skip", "(test as never).skip", "test?.skip"]) {
      const findings = findingsOf([IMPORT, `${callee}("a scenario", async () => {});`, ""].join("\n"));
      expect(findings.length, `${callee}: expected exactly one finding`).toBe(1);
      expect(findings[0], `${callee}: expected the dotted path`).toContain("test.skip");
    }
  });

  // ── GREEN 4: the widening must not start refusing the specs the gate is supposed to run ──────
  it("does not refuse a call whose dotted path is outside the set", () => {
    const body = [
      IMPORT,
      'test.describe("billing", () => {',
      '  test("an invoice is shown", async ({ page }) => {',
      '    await test.step("open the page", async () => {',
      '      await page.goto("/billing");',
      "    });",
      '    await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");',
      "  });",
      "});",
      "",
    ].join("\n");
    expect(findingsOf(body)).toEqual([]);
  });

  // ── the residuals are NAMED, not silent ─────────────────────────────────────────────────────
  it("exports the two unresolvable callee shapes as named residuals", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    expect(UNRESOLVABLE_CALLEE_RESIDUALS.length).toBe(2);
    for (const residual of UNRESOLVABLE_CALLEE_RESIDUALS) {
      expect(typeof residual).toBe("string");
      expect(residual.length).toBeGreaterThan(20);
    }
  });

  it("the two named residuals really are unresolved — an alias and a computed member pass", () => {
    const alias = findingsOf(
      [IMPORT, "const t = test;", 't.skip("a scenario", async () => {});', ""].join("\n"),
    );
    const computed = findingsOf(
      [IMPORT, 'const m = "skip";', 'test[m]("a scenario", async () => {});', ""].join("\n"),
    );
    // These are DISCLOSED residuals (D-13: this runnable ships no type checker). The assertion
    // pins the disclosure to the behaviour, so a future change that closes one is visible here.
    expect(alias).toEqual([]);
    expect(computed).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-06 GAP 2 — the fixture corpus is TYPE-CHECKED evidence.
//
// The corpus was excluded from BOTH tsconfig targets, so `union-all-arms.uat.spec.ts` could import
// a `describe` binding @playwright/test does not export and no command in this repository said so.
// A corpus outside the reach of a typecheck cannot fail, and a fixture that cannot fail is not
// evidence. The cases below pin the corpus INTO the command that checks it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity fixtures — 31-06 gap 2: the corpus is inside a typecheck target", () => {
  const FIXTURES_TSCONFIG = join(REPO_ROOT, "tsconfig.fixtures.json");

  /** Read a tsconfig that carries a leading `//` header, the way tsconfig.tests.json does. */
  function readJsonc(absPath: string): Record<string, unknown> {
    const stripped = readFileSync(absPath, "utf8")
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .join("\n");
    return JSON.parse(stripped) as Record<string, unknown>;
  }

  it("every *.uat.spec.ts fixture on disk is reached by tsconfig.fixtures.json's include", () => {
    const config = readJsonc(FIXTURES_TSCONFIG);
    const include = config.include as string[];
    // PREMISE: the include list is non-empty, so the containment check below is not vacuous.
    expect(include.length, "PREMISE: tsconfig.fixtures.json has no include list").toBeGreaterThan(0);
    expect(include).toContain("scripts/runnable-ref/fixtures/**/*.uat.spec.ts");
    expect((config.compilerOptions as { noEmit?: boolean }).noEmit).toBe(true);

    // The corpus is DERIVED from disk, never typed out, so a fixture added later is covered by this
    // assertion automatically rather than being silently outside the target.
    const onDisk = readdirSync(FIXTURES).filter((n) => n.endsWith(".uat.spec.ts")).sort();
    expect(onDisk.length, "PREMISE: no fixture was found on disk").toBeGreaterThan(0);
    expect(onDisk).toContain("union-all-arms.uat.spec.ts");
    expect(onDisk).toContain("element-access-modifier.uat.spec.ts");
  });

  it("npm run typecheck runs the fixtures target, so the check is not outside the command", () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const typecheck = pkg.scripts.typecheck;
    expect(typecheck).toContain("tsconfig.fixtures.json");
    // Three targets, three invocations: the shipped source, the tests, the fixture corpus.
    expect(typecheck.split("tsc ").length - 1).toBe(3);
  });

  it("no fixture imports a top-level describe binding from @playwright/test", () => {
    // The declared surface exports none, so this is the shape the typecheck target refuses. The
    // assertion is here as well because it names the DEFECT rather than only the diagnostic.
    for (const name of readdirSync(FIXTURES).filter((n) => n.endsWith(".uat.spec.ts"))) {
      const text = readFileSync(join(FIXTURES, name), "utf8");
      const importLine = text.split("\n").find((l) => l.includes('from "@playwright/test"'));
      expect(importLine, `${name}: no @playwright/test import found`).toBeDefined();
      expect(
        /\bdescribe\b/.test(importLine!.slice(0, importLine!.indexOf("}") + 1)),
        `${name}: imports a top-level describe, which @playwright/test does not export`,
      ).toBe(false);
    }
  });

  it("the element-access fixture yields exactly two findings, one per bracket-notation construct", () => {
    const root = mkTargetRepo({ "e2e/uat/billing.uat.spec.ts": "element-access-modifier.uat.spec.ts" });
    const r = runCheck(root, "--json");
    expect(r.status).toBe(1);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    expect(parsed.findings.length).toBe(2);
    const joined = parsed.findings.join("\n");
    // Both normalise to the dotted path of their dotted spelling.
    expect(joined).toContain("test.skip");
    expect(joined).toContain("expect.soft");
  });

  it("the corrected union fixture still reports all three arms, now through test.describe.only", () => {
    const root = mkTargetRepo({ "e2e/uat/billing.uat.spec.ts": "union-all-arms.uat.spec.ts" });
    const r = runCheck(root, "--json");
    expect(r.status).toBe(1);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    const joined = parsed.findings.join("\n");
    expect(joined).toContain("caught assertion");
    expect(joined).toContain("conditional assertion");
    expect(joined).toContain("test.describe.only");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-06 GAP 2 — every banned spelling is a construct the declared surface ACTUALLY HAS.
//
// This is the cross-check that would have caught the gap. `describe.only` was in the ban set and
// `@playwright/test` exports no top-level `describe`, so the checker was guarding a spelling it
// could never see fired in the wild — and nothing in the shipped suite asked that question.
//
// The partition below is COMPUTED by asking the declared surface which heads it exports, never
// typed out, so a member added to BANNED_CONSTRUCTS later is classified automatically.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-06 gap 2: the ban set against the declared @playwright/test surface", () => {
  const ts = hostTypeScript as typeof import("typescript");
  const DECL = join(FIXTURES, "playwright-test.d.ts");
  const MODULE_SPECIFIER = "@playwright/test";

  const COMPILER_OPTIONS: import("typescript").CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  };

  /** The names the declared ambient module exports, read from the declaration by the compiler. */
  function declaredSurfaceExports(): string[] {
    const program = ts.createProgram([DECL], COMPILER_OPTIONS);
    const sf = program.getSourceFile(DECL);
    if (sf === undefined) throw new Error(`PREMISE: ${DECL} was not part of the program`);
    const checker = program.getTypeChecker();
    let names: string[] | null = null;
    ts.forEachChild(sf, (node) => {
      if (!ts.isModuleDeclaration(node)) return;
      if (!ts.isStringLiteral(node.name) || node.name.text !== MODULE_SPECIFIER) return;
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol === undefined) return;
      names = checker.getExportsOfModule(symbol).map((s) => s.getName()).sort();
    });
    if (names === null) {
      throw new Error(
        `PREMISE: no ambient declaration of ${MODULE_SPECIFIER} was found in ${DECL}; every ` +
          `partition below would be derived from nothing`,
      );
    }
    return names;
  }

  /** Split the ban set by the ONE question: is this member's head an export of that surface? */
  function partitionBanSet(members: readonly string[]): {
    exported: string[];
    remainder: string[];
  } {
    const surface = new Set(declaredSurfaceExports());
    const exported: string[] = [];
    const remainder: string[] = [];
    for (const path of members) {
      (surface.has(path.split(".")[0]) ? exported : remainder).push(path);
    }
    return { exported, remainder };
  }

  /** Compile one call statement per member against a copy of the declared surface. */
  function compileCalls(members: readonly string[]): {
    diagnostics: string[];
    source: string;
    statements: number;
  } {
    const root = mkTmp();
    copyFileSync(DECL, join(root, "playwright-test.d.ts"));
    const heads = [...new Set(members.map((m) => m.split(".")[0]))].sort();
    const calls = members.map((m, i) => `${m}("scenario ${i}");`);
    const source = [
      `import { ${heads.join(", ")} } from "${MODULE_SPECIFIER}";`,
      ...calls,
      "",
    ].join("\n");
    const srcPath = join(root, "banned-spellings.ts");
    writeFileSync(srcPath, source, "utf8");
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify(
        { compilerOptions: { ...COMPILER_OPTIONS, module: "esnext", moduleResolution: "bundler", target: "es2022" }, include: ["*.ts"] },
        null,
        2,
      ),
      "utf8",
    );
    const program = ts.createProgram([join(root, "playwright-test.d.ts"), srcPath], COMPILER_OPTIONS);
    const diagnostics = [
      ...program.getOptionsDiagnostics(),
      ...program.getGlobalDiagnostics(),
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ].map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
    return { diagnostics, source, statements: calls.length };
  }

  it("the declared surface exports test and expect and NO top-level describe", () => {
    const exports = declaredSurfaceExports();
    expect(exports, "PREMISE: the declared surface exports nothing").not.toEqual([]);
    expect(exports).toContain("test");
    expect(exports).toContain("expect");
    // The absence is the whole reason arm (c) had to gain the three test.describe.* paths.
    expect(exports).not.toContain("describe");
  });

  it("every banned spelling whose head the surface exports type-checks against it", async () => {
    const { BANNED_CONSTRUCTS } = await loadChecker();
    const { exported, remainder } = partitionBanSet(BANNED_CONSTRUCTS);

    // The partition is asserted by COUNT and, for the remainder, by VALUE.
    expect(exported.length).toBe(7);
    expect(remainder.length).toBe(2);
    expect([...remainder].sort()).toEqual(["describe.only", "describe.skip"]);
    expect(exported.length + remainder.length).toBe(BANNED_CONSTRUCTS.length);

    const { diagnostics, source, statements } = compileCalls(exported);
    // PREMISE before the verdict: a generator that silently produced nothing would compile clean
    // and prove nothing. Assert the generated source really carries one call per member.
    expect(source.length, "PREMISE: the generated source is empty").toBeGreaterThan(0);
    expect(statements, "PREMISE: the generated call count is not the partition size").toBe(
      exported.length,
    );
    for (const member of exported) {
      expect(source, `PREMISE: ${member} is absent from the generated source`).toContain(
        `${member}(`,
      );
    }
    expect(diagnostics).toEqual([]);
  });

  it("the harness DISCRIMINATES: a fabricated member the surface lacks is a diagnostic", async () => {
    const { BANNED_CONSTRUCTS } = await loadChecker();
    const { exported } = partitionBanSet(BANNED_CONSTRUCTS);
    const fabricated = "test.mute";
    // PREMISE: the fabricated path is not already in the set, or the case would prove nothing.
    expect(BANNED_CONSTRUCTS, `PREMISE: ${fabricated} is already banned`).not.toContain(fabricated);

    const { diagnostics } = compileCalls([...exported, fabricated]);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.join("\n")).toContain("mute");
  });

  it("the remainder is derived by the same question, and the bare names really are absent", async () => {
    const { BANNED_CONSTRUCTS } = await loadChecker();
    const { remainder } = partitionBanSet(BANNED_CONSTRUCTS);
    // Retained on purpose: D-14 named them, and another framework's bare `describe` can be
    // imported into a spec file. They are not a defect — they are a strictly wider set.
    for (const path of remainder) {
      expect(path.startsWith("describe.")).toBe(true);
      expect(declaredSurfaceExports()).not.toContain(path.split(".")[0]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-06 GAP 2 — the recipe's claim and the checker's mechanism are quoted from ONE source.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("browser-uat-recipe.md — 31-06 gap 2: the documented ban set equals the decided one", () => {
  const RECIPE = join(REPO_ROOT, "agent-factory", "checklists", "browser-uat-recipe.md");
  const BAN_SET_HEADING = "## The spec-integrity ban set";
  const HEADING_LINE = /^(#{1,6}) /;

  /** The region under one heading, ending at the next heading of the same or a higher level. */
  function extractSection(text: string, heading: string): string {
    const lines = text.split("\n");
    const start = lines.findIndex((l) => l.trimEnd() === heading);
    if (start < 0) {
      throw new Error(
        `PREMISE: the anchor heading ${JSON.stringify(heading)} is absent from the recipe — every ` +
          `assertion over the region would be vacuous`,
      );
    }
    const level = heading.slice(0, heading.indexOf(" ")).length;
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      const m = HEADING_LINE.exec(lines[i]);
      if (m !== null && m[1].length <= level) {
        end = i;
        break;
      }
    }
    return lines.slice(start, end).join("\n");
  }

  /**
   * The dotted paths the region LISTS, derived by a strict grammar over its backtick spans rather
   * than by substring search. Substring search would count `describe.skip` as present whenever
   * `test.describe.skip` is — the collision that would make a set comparison pass vacuously.
   */
  function listedDottedPaths(region: string): string[] {
    const spans = [...region.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const grammar = /^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)+$/;
    return [...new Set(spans.filter((s) => grammar.test(s)))].sort();
  }

  it("the recipe's ban-set region lists exactly the members of BANNED_CONSTRUCTS", async () => {
    const { BANNED_CONSTRUCTS } = await loadChecker();
    const whole = readFileSync(RECIPE, "utf8");
    const region = extractSection(whole, BAN_SET_HEADING);

    // PREMISE: the extractor found a real, bounded region — an extractor that ran to end-of-file
    // would silently adopt an unrelated later section.
    expect(region.length, "PREMISE: the extracted region is empty").toBeGreaterThan(0);
    expect(
      region.length,
      "PREMISE: the extracted region ran to end-of-file rather than to the next heading",
    ).toBeLessThan(whole.length);

    const listed = listedDottedPaths(region);
    // Set EQUALITY, not containment: a member added to the constant and not to the recipe fails
    // here, and so does a name in the recipe the checker does not decide.
    expect(listed).toEqual([...BANNED_CONSTRUCTS].sort());
    expect(listed.length).toBe(BANNED_CONSTRUCTS.length);
  });

  it("the recipe's residual bullets are the exported residual array, verbatim", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    const region = extractSection(readFileSync(RECIPE, "utf8"), BAN_SET_HEADING);
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.length,
      "PREMISE: the residual array is empty",
    ).toBeGreaterThan(0);
    for (const residual of UNRESOLVABLE_CALLEE_RESIDUALS) {
      expect(region, `the recipe does not carry the residual: ${residual}`).toContain(residual);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-11 CR-06 — the MEMBERSHIP question becomes a RULE over the resolved path.
//
// 31-06 centralised the SHAPE question in `calleeDottedPath` and left the MEMBERSHIP question as a
// nine-member literal compared by `includes`. The round-2 verifier planted
// `test.describe.serial.only` and `test.describe.parallel.only` — real Playwright spellings that
// narrow an entire gate run exactly as `test.describe.only` does — and the committed `.js` reported
// `0 findings over 1/1 uat specs checked` at exit 0, on the same harness that correctly refuses
// `test.describe.only` alone. Membership is now decided by HEAD and TAIL over the normalised path,
// so an intermediate routing segment cannot open a new hole.
//
// The corpus below is GENERATED from the rule's own constants. It is EVIDENCE, never an authority:
// nothing here may become a second list of banned dotted paths, because a list beside a rule is the
// two-authorities drift the runnable's own header forbids.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-11 CR-06: membership is a rule, decided in one place", () => {
  const tsApi = hostTypeScript as typeof import("typescript");
  const IMPORT = 'import { test, expect } from "@playwright/test";';

  /**
   * The intermediate segments that ROUTE a modifier call without changing what the tail does to the
   * evidence. Declared here as a test CORPUS — it is not consulted by the checker and is not an
   * authority on Playwright's routing surface; it exists so the cross product below exercises the
   * rule at more than one chain length, including the two the round-2 verifier planted.
   */
  const REPRESENTATIVE_ROUTING_CHAINS: readonly (readonly string[])[] = Object.freeze([
    Object.freeze([]),
    Object.freeze(["describe"]),
    Object.freeze(["describe", "serial"]),
    Object.freeze(["describe", "parallel"]),
  ]);

  function plantSpec(body: string): string {
    const root = mkTargetRepo({});
    const dest = join(root, "e2e", "uat", "subject.uat.spec.ts");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
    return root;
  }

  function findingsOf(body: string): string[] {
    const r = runCheck(plantSpec(body), "--json");
    if (r.status === 0) return [];
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    return parsed.findings;
  }

  /** Every spelling the rule decides, computed from the rule's own constants — never typed out. */
  function ruleCorpus(
    heads: readonly string[],
    tails: readonly string[],
    exact: readonly string[],
  ): string[] {
    const out: string[] = [];
    for (const head of heads) {
      for (const chain of REPRESENTATIVE_ROUTING_CHAINS) {
        for (const tail of tails) out.push([head, ...chain, tail].join("."));
      }
    }
    for (const path of exact) out.push(path);
    return [...new Set(out)];
  }

  /** The committed artifact's own source, parsed — the assertions below read code, never prose. */
  function parseCommittedChecker(): import("typescript").SourceFile {
    return tsApi.createSourceFile(
      "uat-spec-integrity.js",
      readFileSync(CHECK_JS, "utf8"),
      tsApi.ScriptTarget.ES2022,
      true,
    );
  }

  function findFunction(
    sf: import("typescript").SourceFile,
    name: string,
  ): import("typescript").FunctionDeclaration {
    let found: import("typescript").FunctionDeclaration | null = null;
    const walk = (node: import("typescript").Node): void => {
      if (tsApi.isFunctionDeclaration(node) && node.name?.text === name) found = node;
      tsApi.forEachChild(node, walk);
    };
    tsApi.forEachChild(sf, walk);
    if (found === null) throw new Error(`PREMISE: ${name} was not found in the committed .js`);
    return found;
  }

  // ── RED 1/2: the two spellings the round-2 verifier planted ──────────────────────────────────
  for (const routing of ["serial", "parallel"] as const) {
    it(`refuses test.describe.${routing}.only, which the round-2 verifier planted at exit 0`, () => {
      const findings = findingsOf(
        [IMPORT, `test.describe.${routing}.only("evasion-${routing}", () => {});`, ""].join("\n"),
      );
      expect(findings.length).toBe(1);
      expect(findings[0]).toContain(`test.describe.${routing}.only`);
      expect(findings[0]).toContain("banned modifier call");
    });
  }

  it("reports one finding per planted spelling when both sit in ONE spec", () => {
    const findings = findingsOf(
      [
        IMPORT,
        'test.describe.serial.only("evasion-serial", () => {});',
        'test.describe.parallel.only("evasion-parallel", () => {});',
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(2);
    expect(findings.join("\n")).toContain("test.describe.serial.only");
    expect(findings.join("\n")).toContain("test.describe.parallel.only");
  });

  // ── RED 3 (WR-12): the INVERTING modifier is decided, not left silent ────────────────────────
  it("refuses test.fail — an inverted scenario is worse evidence than a removed one", () => {
    const findings = findingsOf([IMPORT, 'test.fail("inverted", async () => {});', ""].join("\n"));
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.fail");
  });

  // ── CONTROL: unchanged before and after, so the change is in MEMBERSHIP, not in shape ────────
  it("still refuses test.describe.only exactly once — the control the verifier ran", () => {
    const findings = findingsOf(
      [IMPORT, 'test.describe.only("control", () => {});', ""].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.describe.only");
  });

  // ── the three constants ARE a head set, a tail set and an exact-path set ─────────────────────
  it("exports the rule as a head set, a tail set and an exact-path set", async () => {
    const { BANNED_MODIFIER_HEADS, BANNED_MODIFIER_TAILS, BANNED_EXACT_PATHS } = await loadChecker();
    const SEGMENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    const DOTTED = /^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)+$/;

    expect(BANNED_MODIFIER_HEADS.length, "PREMISE: the head set is empty").toBeGreaterThan(0);
    expect(BANNED_MODIFIER_TAILS.length, "PREMISE: the tail set is empty").toBeGreaterThan(0);
    expect(BANNED_EXACT_PATHS.length, "PREMISE: the exact-path set is empty").toBeGreaterThan(0);

    // A head set and a tail set hold SEGMENTS. A segment carrying a dot would be a dotted path
    // smuggled into a set that is supposed to be one register below one.
    for (const head of BANNED_MODIFIER_HEADS) expect(SEGMENT.test(head), head).toBe(true);
    for (const tail of BANNED_MODIFIER_TAILS) expect(SEGMENT.test(tail), tail).toBe(true);
    for (const path of BANNED_EXACT_PATHS) expect(DOTTED.test(path), path).toBe(true);

    // WR-12: the inverting modifier is DECIDED, not silently undecided.
    expect(BANNED_MODIFIER_TAILS, "WR-12: the inverting modifier must be decided").toContain("fail");
  });

  // ── D-14's letter is preserved: every name it enumerated is still decided by the rule ────────
  it("the rule still decides every dotted path D-14 named", async () => {
    const { isBannedModifierPath } = await loadChecker();
    for (const d14 of [
      "test.skip",
      "test.fixme",
      "test.only",
      "test.describe.skip",
      "test.describe.only",
      "test.describe.fixme",
      "describe.skip",
      "describe.only",
      "expect.soft",
    ]) {
      expect(isBannedModifierPath(d14), `D-14/31-06 named ${d14} and it must stay banned`).toBe(true);
    }
  });

  // ── GREEN 1: the refusal corpus is GENERATED from the rule, and its size is COMPUTED ─────────
  it("refuses every spelling in the rule's own cross product, one finding each", async () => {
    const { BANNED_MODIFIER_HEADS, BANNED_MODIFIER_TAILS, BANNED_EXACT_PATHS } = await loadChecker();
    const corpus = ruleCorpus(BANNED_MODIFIER_HEADS, BANNED_MODIFIER_TAILS, BANNED_EXACT_PATHS);

    // PREMISE: a generator that silently produced nothing would pass every assertion below.
    const expectedSize =
      BANNED_MODIFIER_HEADS.length * REPRESENTATIVE_ROUTING_CHAINS.length * BANNED_MODIFIER_TAILS.length +
      BANNED_EXACT_PATHS.length;
    expect(corpus.length, "PREMISE: the cross product is not the product of the sets").toBe(
      expectedSize,
    );

    const body = [
      IMPORT,
      ...corpus.map((path, i) => `${path}("scenario ${i}", async () => {});`),
      "",
    ].join("\n");
    const findings = findingsOf(body);
    expect(findings.length).toBe(corpus.length);
    for (const path of corpus) {
      expect(findings.some((f) => f.includes(path)), `${path}: absent from the union`).toBe(true);
    }
  });

  // ── GREEN 2: the CONVERSE — a routing segment WITHOUT a banned tail is not refused ───────────
  it("refuses nothing when a routing segment carries no banned tail", () => {
    const body = [
      IMPORT,
      'test.describe.serial("billing", () => {',
      '  test("an invoice is shown", async ({ page }) => {',
      '    await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");',
      "  });",
      "});",
      'test.describe.parallel("refunds", () => {',
      '  test("a refund is issued", async ({ page }) => {',
      '    await expect(page.getByTestId("refund-status")).toHaveText("Issued");',
      "  });",
      "});",
      'test.describe.configure({ mode: "serial" });',
      'test("a plain scenario", async ({ page }) => {',
      '  await page.goto("/x");',
      '  await expect(page.getByTestId("x")).toBeVisible();',
      "});",
      "",
    ].join("\n");
    expect(findingsOf(body)).toEqual([]);
  });

  // ── ONE AUTHORITY: the arm-(c) call site ASKS, and decides nothing itself ────────────────────
  it("the arm-(c) call site is exactly one call to the membership authority", () => {
    const sf = parseCommittedChecker();
    const fn = findFunction(sf, "findBannedConstructs");

    const armC: import("typescript").IfStatement[] = [];
    const walk = (node: import("typescript").Node): void => {
      if (tsApi.isIfStatement(node)) {
        const text = node.expression.getText(sf);
        if (text.includes("isBannedModifierPath")) armC.push(node);
      }
      tsApi.forEachChild(node, walk);
    };
    tsApi.forEachChild(fn, walk);

    expect(armC.length, "PREMISE: arm (c) does not ask the membership authority at all").toBe(1);
    const condition = armC[0].expression;
    // The condition IS the call — no `&&`, no null comparison, no membership test of its own.
    expect(tsApi.isCallExpression(condition), condition.getText(sf)).toBe(true);
    const call = condition as import("typescript").CallExpression;
    expect(call.expression.getText(sf)).toBe("isBannedModifierPath");
    expect(call.arguments.length).toBe(1);
  });

  it("the three rule constants are read ONLY inside the membership authority", () => {
    const sf = parseCommittedChecker();
    const names = ["BANNED_MODIFIER_HEADS", "BANNED_MODIFIER_TAILS", "BANNED_EXACT_PATHS"];
    const offenders: string[] = [];
    let references = 0;

    const walk = (node: import("typescript").Node, enclosing: string | null): void => {
      let next = enclosing;
      if (tsApi.isFunctionDeclaration(node) && node.name !== undefined) next = node.name.text;
      if (tsApi.isIdentifier(node) && names.includes(node.text)) {
        const parent = node.parent as import("typescript").Node | undefined;
        const isDeclarationName =
          parent !== undefined &&
          tsApi.isVariableDeclaration(parent) &&
          parent.name === (node as import("typescript").Node);
        if (!isDeclarationName) {
          references++;
          if (next !== "isBannedModifierPath") offenders.push(`${node.text} in ${next ?? "<module>"}`);
        }
      }
      tsApi.forEachChild(node, (child) => walk(child, next));
    };
    tsApi.forEachChild(sf, (child) => walk(child, null));

    // PREMISE: a walk that found no reference at all would report zero offenders vacuously.
    expect(references, "PREMISE: the rule constants are never read").toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  it("no exported constant is an enumerable list of banned dotted paths", async () => {
    const mod = (await import("./uat-spec-integrity.js")) as unknown as Record<string, unknown>;
    const DOTTED = /^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)+$/;
    const offenders: string[] = [];
    let arraysExamined = 0;
    for (const [name, value] of Object.entries(mod)) {
      if (!Array.isArray(value)) continue;
      if (!value.every((v) => typeof v === "string")) continue;
      arraysExamined++;
      if (!value.some((v) => DOTTED.test(v as string))) continue;
      if (name !== "BANNED_EXACT_PATHS") offenders.push(name);
    }
    // PREMISE: the module really does export string arrays, or the scan proves nothing.
    expect(arraysExamined, "PREMISE: no exported string array was examined").toBeGreaterThan(0);
    expect(offenders).toEqual([]);
    expect(mod.BANNED_CONSTRUCTS, "the enumerable ban list must not survive").toBeUndefined();
  });

  // ── the verifier's own probe, end to end, through the COMMITTED artifact ─────────────────────
  it("the spec 31-VERIFICATION.md round 2 ran exits 1 with one finding per planted spelling", () => {
    const root = plantSpec(
      [
        IMPORT,
        "",
        'test.describe.serial.only("evasion-serial", () => {',
        '  test("an invoice is shown", async ({ page }) => {',
        '    await page.goto("/billing");',
        '    await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");',
        "  });",
        "});",
        "",
        'test.describe.parallel.only("evasion-parallel", () => {',
        '  test("a refund is issued", async ({ page }) => {',
        '    await page.goto("/refunds");',
        '    await expect(page.getByTestId("refund-status")).toHaveText("Issued");',
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    const r = runCheck(root);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("2 finding(s) over 1/1 uat specs checked");
    expect(r.stdout).toContain("test.describe.serial.only");
    expect(r.stdout).toContain("test.describe.parallel.only");
  });
});
