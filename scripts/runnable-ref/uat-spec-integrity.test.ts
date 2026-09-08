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
  readonly BANNED_MODIFIER_HEADS: readonly string[];
  readonly BANNED_MODIFIER_TAILS: readonly string[];
  readonly BANNED_EXACT_PATHS: readonly string[];
  // 31-13 (D-18): the path-plus-enabled-option half of the membership question.
  readonly BANNED_CONFIGURED_PATHS: Readonly<Record<string, string>>;
  isBannedModifierPath(dottedPath: string | null): boolean;
  isBannedModifierCall(
    dottedPath: string | null,
    enabledOptions: ReadonlySet<string> | null,
  ): boolean;
  // 31-12 (WR-13): the SHAPE resolver, read by the reverse cross-check so the fixture corpus is
  // parsed by the artifact that resolves callees in production rather than by a second reader.
  calleeDottedPath(ts: unknown, expr: unknown): string | null;
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

  // ── the ban is ONE exported rule the recipe quotes (D-14 "claim matches mechanism") ───────────
  //
  // 31-11 (D-17): the membership question is no longer a set of dotted paths at all. It is a rule
  // over the resolved path — a banned HEAD segment plus a banned TAIL segment, or one of the exact
  // paths — answered in exactly one place. Nothing D-14 named stopped being banned; the assertion
  // below asks the rule rather than a list, because a list beside the rule is the drift CR-06 was.
  it("exports the membership rule, and it still decides every path D-14 and 31-06 named", async () => {
    const { isBannedModifierPath, UAT_SPEC_GLOB_SUFFIX } = await loadChecker();
    expect(UAT_SPEC_GLOB_SUFFIX).toBe(".uat.spec.ts");
    expect(typeof isBannedModifierPath).toBe("function");
    for (const decided of [
      "describe.only",
      "describe.skip",
      "expect.soft",
      "test.describe.fixme",
      "test.describe.only",
      "test.describe.skip",
      "test.fixme",
      "test.only",
      "test.skip",
    ]) {
      expect(isBannedModifierPath(decided), `${decided} must stay banned`).toBe(true);
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
  //
  // 31-11: the fixture list used to be typed out here, which is this repository's recorded
  // set-literal drift — a fixture added later would carry a mutation region no case ever ran. It is
  // now DERIVED from disk by the one question that decides membership: does the fixture carry a
  // mutation region at all? A fixture with no region is not a mutation subject, and one that gains
  // a region gains a case without anybody remembering to add it here.
  const MUTATION_FIXTURES = readdirSync(FIXTURES)
    .filter((n) => n.endsWith(".uat.spec.ts"))
    .filter((n) =>
      readFileSync(join(FIXTURES, n), "utf8")
        .split("\n")
        .some((l) => l.trim().startsWith(`// ${MUTATE_START}`)),
    )
    .sort();

  it("the mutation corpus is derived from disk and is not empty", () => {
    // PREMISE: a derivation that silently found nothing would make the loop below run zero cases,
    // and a loop that runs zero cases reports green.
    expect(MUTATION_FIXTURES.length, "PREMISE: no fixture carries a mutation region").toBeGreaterThan(
      0,
    );
    // Every fixture on disk is EITHER a mutation subject or a fixture that must not be refused —
    // the partition is asserted, so a fixture cannot fall outside both and be silently unexercised.
    const onDisk = readdirSync(FIXTURES).filter((n) => n.endsWith(".uat.spec.ts"));
    const noRegion = onDisk.filter((n) => !MUTATION_FIXTURES.includes(n)).sort();
    expect(MUTATION_FIXTURES.length + noRegion.length).toBe(onDisk.length);
  });

  for (const fixture of MUTATION_FIXTURES) {
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

  // ── GREEN 1: every spelling is exercised FROM the rule, never from a typed-out name ──────────
  //
  // 31-11 (D-17): this consumer used to iterate a list of banned dotted paths. There is no such
  // list any more, so the spellings are GENERATED from the rule's head and tail sets — the direct
  // head-plus-tail spellings, with the routing-chain cross product covered by the 31-11 block at
  // the end of this file. The generated spellings are evidence, never a second authority.
  async function directRuleSpellings(): Promise<string[]> {
    const { BANNED_MODIFIER_HEADS, BANNED_MODIFIER_TAILS, BANNED_EXACT_PATHS } = await loadChecker();
    const out: string[] = [];
    for (const head of BANNED_MODIFIER_HEADS) {
      for (const tail of BANNED_MODIFIER_TAILS) out.push(`${head}.${tail}`);
    }
    for (const path of BANNED_EXACT_PATHS) out.push(path);
    return [...new Set(out)];
  }

  it("refuses every spelling the rule decides, generated from the exported constants", async () => {
    const spellings = await directRuleSpellings();
    // PREMISE: the generator is non-empty, so the loop below is not a vacuous pass.
    expect(spellings.length, "PREMISE: the rule generated no spelling").toBeGreaterThan(0);
    for (const path of spellings) {
      const findings = findingsOf([IMPORT, `${path}("a scenario", async () => {});`, ""].join("\n"));
      expect(findings.length, `${path}: expected exactly one finding`).toBe(1);
      expect(findings[0]).toContain(path);
    }
  });

  // ── GREEN 2: the UNION of the arms, not the first hit ────────────────────────────────────────
  it("reports one finding per spelling when every spelling appears in ONE spec", async () => {
    const spellings = await directRuleSpellings();
    const body = [
      IMPORT,
      ...spellings.map((path, i) => `${path}("scenario ${i}", async () => {});`),
      "",
    ].join("\n");
    const findings = findingsOf(body);
    expect(findings.length).toBe(spellings.length);
    for (const path of spellings) {
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
  it("exports the unresolvable callee shapes as named residuals, each a written reason", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    // 31-13 (D-18): the COUNT is deliberately not asserted here any more. A hand-typed count is the
    // set-literal axis this phase has now been caught on three times; the register's size is BOUND
    // instead by the both-directions binding against the AST-DERIVED decline-site set at the end of
    // this file — no derived site without a residual, and no residual naming a site the resolver no
    // longer has. What stays here is the non-vacuity floor and the "a label is not a reason" floor.
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.length,
      "PREMISE: the residual register is empty",
    ).toBeGreaterThan(0);
    for (const residual of UNRESOLVABLE_CALLEE_RESIDUALS) {
      expect(typeof residual).toBe("string");
      expect(residual.length).toBeGreaterThan(20);
    }
    expect(new Set(UNRESOLVABLE_CALLEE_RESIDUALS).size).toBe(UNRESOLVABLE_CALLEE_RESIDUALS.length);
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

  // ── 31-11 (D-17): the routed-modifier fixture and its false-positive control ─────────────────

  it("the modifier-family fixture yields exactly two findings, one per routed spelling", () => {
    const root = mkTargetRepo({ "e2e/uat/billing.uat.spec.ts": "modifier-family.uat.spec.ts" });
    const r = runCheck(root, "--json");
    expect(r.status).toBe(1);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; findings: string[] };
    expect(parsed.findings.length).toBe(2);
    const joined = parsed.findings.join("\n");
    expect(joined).toContain("test.describe.serial.only");
    expect(joined).toContain("test.describe.parallel.only");
  });

  it("the clean-group fixture yields zero findings and really carries the shapes it claims", () => {
    const text = readFileSync(join(FIXTURES, "modifier-group-clean.uat.spec.ts"), "utf8");
    // PREMISE: a fixture that silently lost its content would exit 0 and prove nothing. Assert the
    // control actually exercises each shape the rule must not refuse, BEFORE trusting its verdict.
    for (const shape of [
      "test.describe.serial(",
      "test.describe.parallel(",
      "test.describe.configure(",
      "\ntest(",
      "await expect(",
    ]) {
      expect(text, `the control fixture no longer carries ${shape}`).toContain(shape);
    }
    const root = mkTargetRepo({
      "e2e/uat/checkout.uat.spec.ts": "modifier-group-clean.uat.spec.ts",
    });
    const r = runCheck(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1");
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
// typed out, so a spelling the rule starts deciding later is classified automatically. 31-11 (D-17)
// re-pointed its input from the deleted ban list to the rule's own generated spellings.
//
// This check runs in ONE DIRECTION ONLY: it asks whether every banned spelling is real. It cannot
// ask whether every real modifier is banned — that reverse partition lands in plan 31-12.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-06 gap 2: the ban rule against the declared @playwright/test surface", () => {
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

  /**
   * The spellings the RULE decides directly (head plus tail, and the exact paths), generated from
   * the exported constants. 31-11 (D-17) deleted the enumerable ban list, so this partition's input
   * is derived from the rule; the derived list is evidence for this harness and never an authority.
   */
  async function ruleDecidedSpellings(): Promise<string[]> {
    const { BANNED_MODIFIER_HEADS, BANNED_MODIFIER_TAILS, BANNED_EXACT_PATHS } = await loadChecker();
    const out: string[] = [];
    for (const head of BANNED_MODIFIER_HEADS) {
      for (const tail of BANNED_MODIFIER_TAILS) out.push(`${head}.${tail}`);
    }
    for (const path of BANNED_EXACT_PATHS) out.push(path);
    return [...new Set(out)];
  }

  it("every banned spelling whose head the surface exports type-checks against it", async () => {
    const decided = await ruleDecidedSpellings();
    const { exported, remainder } = partitionBanSet(decided);

    // The partition is asserted by COUNT and, for the remainder, by VALUE — and both sides of the
    // count are DERIVED, so a rule that generated a shorter list could not make this pass.
    const { BANNED_MODIFIER_HEADS, BANNED_MODIFIER_TAILS, BANNED_EXACT_PATHS } = await loadChecker();
    expect(decided.length, "PREMISE: the rule generated no spelling").toBe(
      BANNED_MODIFIER_HEADS.length * BANNED_MODIFIER_TAILS.length + BANNED_EXACT_PATHS.length,
    );
    const surface = new Set(declaredSurfaceExports());
    const expectedRemainder = BANNED_MODIFIER_HEADS.filter((h) => !surface.has(h))
      .flatMap((h) => BANNED_MODIFIER_TAILS.map((t) => `${h}.${t}`))
      .sort();
    expect([...remainder].sort()).toEqual(expectedRemainder);
    expect(exported.length).toBeGreaterThan(0);
    expect(exported.length + remainder.length).toBe(decided.length);

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
    const { isBannedModifierPath } = await loadChecker();
    const { exported } = partitionBanSet(await ruleDecidedSpellings());
    const fabricated = "test.mute";
    // PREMISE: the fabricated path is not already decided, or the case would prove nothing.
    expect(isBannedModifierPath(fabricated), `PREMISE: ${fabricated} is already banned`).toBe(false);

    const { diagnostics } = compileCalls([...exported, fabricated]);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.join("\n")).toContain("mute");
  });

  it("the remainder is derived by the same question, and the bare names really are absent", async () => {
    const { remainder } = partitionBanSet(await ruleDecidedSpellings());
    // Retained on purpose: D-14 named the bare `describe` head, and another framework's bare
    // `describe` can be imported into a spec file. It is not a defect — it is a strictly wider rule.
    expect(remainder.length, "PREMISE: the remainder is empty").toBeGreaterThan(0);
    for (const path of remainder) {
      expect(path.startsWith("describe.")).toBe(true);
      expect(declaredSurfaceExports()).not.toContain(path.split(".")[0]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-12 WR-13 — THE REVERSE DIRECTION. The block above asks "is every banned spelling real?" and
// cannot, by its shape, ask "is every real modifier banned?" — the direction CR-01 was and CR-06
// still was. This block asks the reverse question of the DECLARED surface.
//
// THE DENOMINATOR IS READ, NOT WRITTEN. The set of members the reverse question is asked about is
// DERIVED by walking the declared type with the TypeScript checker, rooted at each exported value
// binding. Enumeration is the axis 31-11's head and tail sets are hand-authored on, and it is
// therefore the one axis that must not be hand-authored a second time here: a typed-out member list
// would fail exactly when a member nobody remembered was added, which is the failure this block
// exists to catch.
//
// THE PREMISE IS ASSERTED BEFORE THE COVERAGE CLAIM, AND A SHORT WALK COUNTS AS A FAILED PREMISE.
// A vacuity floor catches an EMPTY denominator; it never catches a silently SHORT one, and the
// modifier family CR-06 was about (`test.describe.<routing group>.<modifier>`) lives at the deepest
// level the surface reaches. So the walk asserts it reached its own declared bound at least once,
// asserts the program compiled with zero diagnostics, asserts both root bindings were found, and
// asserts the derived set contains every member the fixture corpus actually calls — a second,
// independent view of the same surface, so a walk that missed a branch is caught by something other
// than its own count.
//
// WHAT IS AND IS NOT CLAIMED. The claim is coverage of the DECLARED surface. It is NOT coverage of
// the `@playwright/test` package: playwright-test.d.ts is a hand transcription whose drift from a
// released Playwright is an open `UNKNOWN - verify` (`R-07`), stated in that file's own header and
// in browser-uat-recipe.md. This block raises the cost of that drift; it does not close it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-12 WR-13: the declared modifier surface, derived and bounded", () => {
  const ts = hostTypeScript as typeof import("typescript");
  const DECL = join(FIXTURES, "playwright-test.d.ts");
  const MODULE_SPECIFIER = "@playwright/test";

  const WALK_COMPILER_OPTIONS: import("typescript").CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  };

  /**
   * THE DEPTH BOUND, with its reason, because an unstated truncation is indistinguishable from a
   * complete walk.
   *
   * Four is the segment count of the DEEPEST modifier family the declared surface carries:
   * `test` . `describe` . `<routing group>` . `<modifier>` — which is exactly the family CR-06 was
   * about. A bound of three would silently drop `test.describe.serial.only`, the spelling the
   * round-2 verifier planted, and the reverse partition would then report complete over a set that
   * never contained the member it exists to find. The walk therefore asserts it REACHED this bound,
   * not merely that it ran.
   *
   * Raising it is safe and cheap; lowering it below the deepest declared family turns the
   * maximum-depth premise red rather than quietly shrinking the denominator.
   */
  const SURFACE_WALK_MAX_DEPTH = 4;

  interface SurfaceWalk {
    /** Every dotted path reached, sorted. Includes each root binding as a one-segment path. */
    readonly paths: readonly string[];
    /** The shallowest depth each path was reached at, in segments. */
    readonly depths: ReadonlyMap<string, number>;
    /** The exported VALUE bindings the walk rooted at — a spec can only call a value. */
    readonly roots: readonly string[];
    /** Every diagnostic the program backing the walk produced. Non-empty means a rejected input. */
    readonly diagnostics: readonly string[];
  }

  /**
   * Walk the declared ambient module's exported VALUE bindings with the TypeScript checker and emit
   * one dotted path per member reached, bounded by `maxDepth` segments.
   *
   * The roots are selected by "has a value declaration", not by name: an interface exported from the
   * same module is a type a spec cannot call, and naming `test` and `expect` here would re-introduce
   * the hand-authored enumeration this whole block exists to avoid.
   */
  function deriveDeclaredModifierPaths(declPath: string, maxDepth: number): SurfaceWalk {
    const program = ts.createProgram([declPath], WALK_COMPILER_OPTIONS);
    const diagnostics = [
      ...program.getOptionsDiagnostics(),
      ...program.getGlobalDiagnostics(),
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ].map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);

    const sf = program.getSourceFile(declPath);
    if (sf === undefined) throw new Error(`PREMISE: ${declPath} was not part of the program`);
    const checker = program.getTypeChecker();

    let moduleSymbol: import("typescript").Symbol | undefined;
    ts.forEachChild(sf, (node) => {
      if (!ts.isModuleDeclaration(node)) return;
      if (!ts.isStringLiteral(node.name) || node.name.text !== MODULE_SPECIFIER) return;
      moduleSymbol = checker.getSymbolAtLocation(node.name);
    });
    if (moduleSymbol === undefined) {
      throw new Error(
        `PREMISE: no ambient declaration of ${MODULE_SPECIFIER} was found in ${declPath}; the ` +
          `denominator of every coverage assertion below would be derived from nothing`,
      );
    }

    const rootSymbols = checker
      .getExportsOfModule(moduleSymbol)
      .filter((s) => s.valueDeclaration !== undefined);

    const depths = new Map<string, number>();
    const visit = (
      symbol: import("typescript").Symbol,
      segments: readonly string[],
      depth: number,
    ): void => {
      const dotted = segments.join(".");
      const prior = depths.get(dotted);
      if (prior === undefined || depth < prior) depths.set(dotted, depth);
      if (depth >= maxDepth) return;
      const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration ?? sf);
      for (const prop of checker.getPropertiesOfType(type)) {
        visit(prop, [...segments, prop.getName()], depth + 1);
      }
    };
    for (const root of rootSymbols) visit(root, [root.getName()], 1);

    return {
      paths: [...depths.keys()].sort(),
      depths,
      roots: rootSymbols.map((s) => s.getName()).sort(),
      diagnostics,
    };
  }

  /** Memoised: one program per file, read by every case below. */
  let walkCache: SurfaceWalk | null = null;
  function walk(): SurfaceWalk {
    walkCache ??= deriveDeclaredModifierPaths(DECL, SURFACE_WALK_MAX_DEPTH);
    return walkCache;
  }

  /**
   * The dotted paths the fixture corpus actually CALLS, resolved by the runnable's own shape
   * resolver. This is the second, independent view of the same surface: the walk reads the type,
   * this reads the call sites, and a branch missing from one is caught by the other.
   */
  async function fixtureCalledSurfacePaths(): Promise<string[]> {
    const { calleeDottedPath } = await loadChecker();
    const roots = new Set(walk().roots);
    const called = new Set<string>();
    for (const name of readdirSync(FIXTURES).filter((n) => n.endsWith(".uat.spec.ts"))) {
      const sf = ts.createSourceFile(
        name,
        readFileSync(join(FIXTURES, name), "utf8"),
        ts.ScriptTarget.ES2022,
        true,
      );
      const visit = (node: import("typescript").Node): void => {
        if (ts.isCallExpression(node)) {
          const dotted = calleeDottedPath(ts, node.expression);
          // Only calls rooted at a binding this surface declares: `page.goto` is a call on a value
          // the surface returns, not a member of the surface, and is not this block's question.
          //
          // 31-13 (D-18): and only PROPERTY CHAINS. A path carrying a `()` marker segment —
          // `expect.soft().toContain`, `test.info().skip` — is a CALL LINK, and the walk that
          // produces this block's denominator is `checker.getPropertiesOfType`, which descends
          // declared properties and does NOT descend through a call signature's RETURN TYPE. Such a
          // path can therefore never be in the walked set, and comparing it against that set would
          // report a hole in the denominator that is really a boundary of the walk. The boundary is
          // stated here, in browser-uat-recipe.md's completeness paragraph, and in
          // playwright-test.d.ts's header, rather than being absorbed silently — which is exactly
          // the `missing:` item (c) the round-3 verifier raised.
          if (dotted !== null && !dotted.includes("()") && roots.has(dotted.split(".")[0])) {
            called.add(dotted);
          }
        }
        ts.forEachChild(node, visit);
      };
      ts.forEachChild(sf, visit);
    }
    return [...called].sort();
  }

  it("the walk's premises hold: no diagnostics, both roots, a non-empty set, and the bound reached", () => {
    const { paths, depths, roots, diagnostics } = walk();

    // A denominator computed from a file the compiler rejected is not a measurement.
    expect(diagnostics, "PREMISE: the program backing the walk reported diagnostics").toEqual([]);

    // The roots are DERIVED. Asserting the two the surface declares proves the filter selected
    // value bindings rather than silently selecting nothing or selecting the interfaces too.
    expect(roots.length, "PREMISE: the walk found no exported value binding").toBeGreaterThan(0);
    expect(roots).toEqual(["expect", "test"]);

    // The vacuity floor.
    expect(paths.length, "PREMISE: the derived path set is empty").toBeGreaterThan(0);

    // The SHORTNESS floor — the one a vacuity floor cannot give. A walk that stopped one level
    // early would still be non-empty and would still look like a complete measurement.
    const deepest = Math.max(...depths.values());
    expect(
      deepest,
      `PREMISE: the walk never reached its declared bound of ${SURFACE_WALK_MAX_DEPTH} segments — ` +
        `the deepest path it found has ${deepest}, so the deepest modifier family was truncated`,
    ).toBe(SURFACE_WALK_MAX_DEPTH);
  });

  it("the derived set contains every member the fixture corpus actually calls", async () => {
    const called = await fixtureCalledSurfacePaths();
    const derived = new Set(walk().paths);

    // PREMISE: a resolver that returned nothing would make the loop below assert nothing.
    expect(
      called.length,
      "PREMISE: no fixture call resolved to a member of the declared surface",
    ).toBeGreaterThan(0);

    const absent = called.filter((p) => !derived.has(p));
    expect(
      absent,
      `the walk missed members the corpus calls: ${absent.join(", ")} — the denominator has a hole`,
    ).toEqual([]);
  });

  it("the derived count exceeds the count the rule refuses", async () => {
    const { isBannedModifierPath } = await loadChecker();
    const { paths } = walk();
    const refused = paths.filter((p) => isBannedModifierPath(p));

    // PREMISE: a walk that found ONLY banned members would make "every member is decided" true by
    // construction and would read as a coverage measurement while measuring nothing.
    expect(refused.length, "PREMISE: the rule refuses nothing on this surface").toBeGreaterThan(0);
    expect(
      paths.length,
      "PREMISE: every derived path is refused, so there is nothing left to disposition",
    ).toBeGreaterThan(refused.length);
  });

  it("the derived set carries the families this gap is about", () => {
    const { paths } = walk();
    // The two spellings the round-2 verifier planted, at the deepest level.
    expect(paths).toContain("test.describe.serial.only");
    expect(paths).toContain("test.describe.parallel.only");
    // The inverting modifier (WR-12).
    expect(paths).toContain("test.fail");
    // A routing group used WITHOUT a modifier tail — the false-positive side of the rule.
    expect(paths).toContain("test.describe.serial");
  });

  it("the declared surface carries a documented modifier the rule does NOT refuse", async () => {
    const { isBannedModifierPath } = await loadChecker();
    const { paths } = walk();

    // WHY THIS CASE EXISTS. A reverse partition whose non-refused bucket holds only hooks,
    // structure and configuration answers a weaker question than the one WR-13 asked: it never has
    // to decide a member that is a MODIFIER by the framework's own taxonomy and is still not
    // refused. `test.slow` is that member. Playwright documents it in the same modifiers group as
    // `skip`, `only`, `fixme` and `fail`, and it is deliberately NOT refused, because it extends the
    // time budget a scenario is given rather than removing the scenario or inverting its result.
    //
    // Without it the reverse check would be answering a question that could not have gone the other
    // way. `UNKNOWN - verify` at the same strength as the rest of this surface: a hand transcription.
    expect(paths, "the surface carries no modifier outside the ban").toContain("test.slow");
    expect(
      isBannedModifierPath("test.slow"),
      "test.slow must stay OUTSIDE the ban — it changes a timeout, not the evidence",
    ).toBe(false);
  });

  // ── THE PARTITION: every derived member is decided, and the cardinality says so ──────────────
  //
  // The forward direction above is a MEMBERSHIP check. This is a PARTITION with an asserted
  // cardinality, and the difference is the whole point of WR-13: a membership spot-check can only
  // ever confirm members the set already has, while a partition fails when a member lands that
  // nobody decided. The three properties are asserted SEPARATELY so a disjointness failure and a
  // cardinality failure read differently — the second is the one that means a member arrived and
  // no decision was made about it.

  /**
   * The derived paths that are NOT refused by the rule, each with the reason it does not narrow or
   * invert the evidence a quality gate re-runs.
   *
   * These are statements about EVIDENCE, not labels. A member whose reason cannot be written is a
   * member that needs a decision, and the honest outcome is a red suite rather than a padded record
   * (T-31-65): the partition below asserts every key here is a real derived path, so an entry added
   * to make the arithmetic close is caught rather than counted.
   */
  const DISPOSITIONED_SURFACE_MEMBERS: Readonly<Record<string, string>> = Object.freeze({
    test:
      "The scenario itself. It is the call a quality gate re-runs, so refusing it would refuse the " +
      "evidence rather than protect it.",
    expect:
      "The assertion itself. It is what makes a scenario evidence at all; D-14's arms (a) and (b) " +
      "decide WHERE an assertion may sit, and this member is the construct those arms are about.",
    "test.describe":
      "A structural grouping. It gives a set of scenarios a shared title and nothing else: every " +
      "scenario inside still runs and every assertion inside is still read.",
    "test.describe.serial":
      "A routing group. It changes the ORDER scenarios run in and their shared-failure behaviour; " +
      "no scenario is removed from the evidence and no result is inverted. Its modifier tails ARE " +
      "refused by the rule, which is the part that narrows what a gate re-runs.",
    "test.describe.parallel":
      "A routing group. It changes the ISOLATION scenarios run under; no scenario is removed from " +
      "the evidence and no result is inverted. Its modifier tails ARE refused by the rule.",
    "test.describe.configure":
      "A configuration call. It sets options such as mode and retries for the enclosing group; it " +
      "selects no subset of scenarios and inverts no result.",
    "test.beforeEach":
      "A hook. It runs around scenarios and cannot select which of them run, nor change how their " +
      "assertions are read.",
    "test.afterEach":
      "A hook. It runs around scenarios and cannot select which of them run, nor change how their " +
      "assertions are read.",
    "test.step":
      "A structural member INSIDE a scenario. It labels a region of one scenario's body for " +
      "reporting; the body still executes and every assertion in it is still read.",
    "test.info":
      "31-13 (D-18): the ACCESSOR for the runtime modifier surface. `test.info()` returns the " +
      "TestInfo fixture; the accessor call itself selects no subset of scenarios and inverts no " +
      "result, so refusing the path `test.info` would refuse every spec that reads its own title or " +
      "attachments. Its MODIFIER MEMBERS are a different question and they ARE refused — through the " +
      "call-link resolution D-18 decided, at paths like `test.info().skip`, which this walk cannot " +
      "reach because `getPropertiesOfType` does not descend through a call signature's return type. " +
      "That boundary is stated in browser-uat-recipe.md's completeness paragraph.",
    "expect.configure":
      "31-13 (D-18): a configuration call, and the reason the ban is a PAIR rather than a path. " +
      "`expect.configure({ retries: 2 })` re-runs a matcher and changes no result, so the path alone " +
      "must not be refused — and this partition asks the PATH-only authority, which correctly " +
      "answers no. It is refused only when the call ENABLES the `soft` option, which is a property " +
      "of the call site rather than of the path, decided by `isBannedModifierCall` at the arm-(c) " +
      "site and asserted by the configured-soft corpus fixture and its retries control.",
    "test.slow":
      "A time-budget modifier. It triples the timeout a scenario is given, so the scenario still " +
      "runs and every assertion in it is still read — the evidence a gate re-runs is unchanged in " +
      "content. This is the one member of Playwright's own modifiers group that this record holds " +
      "rather than the rule refusing, and the reason is that a longer deadline neither removes a " +
      "scenario nor inverts its result.",
  });

  interface SurfacePartition {
    /** Paths the shipped membership authority refuses. */
    readonly refused: readonly string[];
    /** Paths carrying a written reason for not being refused. */
    readonly dispositioned: readonly string[];
  }

  /**
   * Split a derived path set by asking the RUNNABLE's membership authority — never a copy of it
   * (T-31-64). Nothing here re-implements the head-and-tail decision; a path the authority refuses
   * is refused, and every remaining path must carry a disposition or fall outside both buckets,
   * which is what the totality assertion reports.
   */
  function partitionDeclaredSurface(
    paths: readonly string[],
    isBanned: (dottedPath: string | null) => boolean,
  ): SurfacePartition {
    const refused: string[] = [];
    const dispositioned: string[] = [];
    for (const path of paths) {
      if (isBanned(path)) refused.push(path);
      else if (Object.prototype.hasOwnProperty.call(DISPOSITIONED_SURFACE_MEMBERS, path)) {
        dispositioned.push(path);
      }
    }
    return { refused, dispositioned };
  }

  /** The paths that fell outside BOTH buckets — the members nobody decided. */
  function undecidedMembers(paths: readonly string[], p: SurfacePartition): string[] {
    const decided = new Set([...p.refused, ...p.dispositioned]);
    return paths.filter((path) => !decided.has(path)).sort();
  }

  /**
   * The message the totality assertion prints. Factored out so the discrimination case below proves
   * the REAL assertion names the offending member, rather than proving it about a second string.
   */
  function undecidedMessage(undecided: readonly string[]): string {
    return (
      `${undecided.length} member(s) of the declared surface are neither refused by the rule nor ` +
      `dispositioned with a reason: ${undecided.join(", ")}. A member with no decision is a ` +
      `construct that can change what a quality gate re-runs without anybody being told.`
    );
  }

  it("the buckets are DISJOINT", async () => {
    const { isBannedModifierPath } = await loadChecker();
    const { paths } = walk();
    const partition = partitionDeclaredSurface(paths, isBannedModifierPath);

    // PREMISE: two empty buckets are trivially disjoint.
    expect(
      partition.refused.length,
      "PREMISE: the refused bucket is empty",
    ).toBeGreaterThan(0);

    const both = partition.refused.filter((p) => partition.dispositioned.includes(p));
    expect(
      both,
      `refused AND dispositioned at once: ${both.join(", ")} — a member cannot be both`,
    ).toEqual([]);
  });

  it("the buckets' UNION equals the derived set", async () => {
    const { isBannedModifierPath } = await loadChecker();
    const { paths } = walk();
    const partition = partitionDeclaredSurface(paths, isBannedModifierPath);

    const undecided = undecidedMembers(paths, partition);
    expect(undecided, undecidedMessage(undecided)).toEqual([]);
    expect([...partition.refused, ...partition.dispositioned].sort()).toEqual([...paths].sort());
  });

  it("the buckets' SIZES sum to the derived count", async () => {
    const { isBannedModifierPath } = await loadChecker();
    const { paths } = walk();
    const partition = partitionDeclaredSurface(paths, isBannedModifierPath);

    // Asserted separately from the union on purpose: this is the arithmetic that says nothing was
    // counted twice and nothing went missing, and it reads differently in a failure report.
    expect(partition.refused.length + partition.dispositioned.length).toBe(paths.length);
  });

  it("every dispositioned member carries a reason, and the record holds no member the surface lacks", () => {
    const { paths } = walk();
    const derived = new Set(paths);
    const entries = Object.entries(DISPOSITIONED_SURFACE_MEMBERS);

    // PREMISE: an empty record makes the per-member loop below assert nothing.
    expect(entries.length, "PREMISE: the disposition record is empty").toBeGreaterThan(0);

    for (const [member, reason] of entries) {
      // A padded record is the denial-of-service on this partition (T-31-65): an entry for a member
      // the surface does not carry would make the arithmetic close over a member nobody can reach.
      expect(derived.has(member), `${member} is dispositioned but is not a derived path`).toBe(true);
      expect(reason.trim().length, `${member}: the disposition reason is empty`).toBeGreaterThan(0);
      expect(
        reason.trim().length,
        `${member}: the disposition reason is shorter than a sentence — a label is not a reason`,
      ).toBeGreaterThan(40);
    }
  });

  // ── the two watched failures ─────────────────────────────────────────────────────────────────

  /**
   * Mirror the declared surface with one anchored substitution, following this file's mirror idiom:
   * the anchor is asserted to occur EXACTLY ONCE before the mutation and to be ABSENT after it, so
   * a mutation that matched nothing cannot be measured as a result.
   */
  function mirrorSurface(anchor: string, replacement: string): string {
    const original = readFileSync(DECL, "utf8");
    const occurrences = original.split(anchor).length - 1;
    expect(
      occurrences,
      `PREMISE: the mutation anchor ${JSON.stringify(anchor)} occurs ${occurrences} time(s) in the ` +
        `declared surface, not exactly once`,
    ).toBe(1);

    const mutated = original.replace(anchor, replacement);
    expect(
      mutated.includes(anchor),
      `PREMISE: the anchor survived the mutation — the substitution matched nothing`,
    ).toBe(false);

    const path = join(mkTmp(), "playwright-test.d.ts");
    writeFileSync(path, mutated, "utf8");
    return path;
  }

  it("DISCRIMINATES: a fabricated run-narrowing member turns the partition red and is NAMED", async () => {
    const { isBannedModifierPath } = await loadChecker();
    // `fixme` becomes `mute`: a member whose name is neither a banned tail nor a dispositioned key.
    //
    // 31-13: the anchor carries its PRECEDING LINE. `readonly fixme: TestModifier;` alone stopped
    // being unique the moment the surface declared the runtime modifier interface, which carries a
    // `fixme` of its own — and the mirror's own single-occurrence premise is what reported that,
    // rather than the mutation silently landing on whichever one came first.
    const mirrored = deriveDeclaredModifierPaths(
      mirrorSurface(
        "readonly only: TestModifier;\n    readonly fixme: TestModifier;",
        "readonly only: TestModifier;\n    readonly mute: TestModifier;",
      ),
      SURFACE_WALK_MAX_DEPTH,
    );
    expect(mirrored.diagnostics, "PREMISE: the mirror does not compile").toEqual([]);
    expect(mirrored.paths, "PREMISE: the mirror does not declare the fabricated member").toContain(
      "test.mute",
    );

    // PREMISE: neither bucket claims it, or the case would prove nothing about the partition.
    expect(isBannedModifierPath("test.mute")).toBe(false);
    expect(Object.keys(DISPOSITIONED_SURFACE_MEMBERS)).not.toContain("test.mute");

    const partition = partitionDeclaredSurface(mirrored.paths, isBannedModifierPath);
    const undecided = undecidedMembers(mirrored.paths, partition);

    expect(undecided, "the partition did not see the fabricated member at all").toContain(
      "test.mute",
    );
    // The message the REAL totality assertion would print — the same function, not a second string.
    expect(undecidedMessage(undecided)).toContain("test.mute");
    // And the arithmetic that would have closed silently does not.
    expect(partition.refused.length + partition.dispositioned.length).not.toBe(
      mirrored.paths.length,
    );
  });

  it("GENERALISES: a routing group nobody enumerated is refused with no edit to any set", async () => {
    const { isBannedModifierPath, BANNED_MODIFIER_HEADS, BANNED_MODIFIER_TAILS, BANNED_EXACT_PATHS } =
      await loadChecker();
    // `parallel` becomes `shard`: a routing group that appears in no set, no fixture and no other
    // case in this file. This is the property the deleted enumeration could not have had.
    const mirrored = deriveDeclaredModifierPaths(
      mirrorSurface("readonly parallel: DescribeGroup;", "readonly shard: DescribeGroup;"),
      SURFACE_WALK_MAX_DEPTH,
    );
    expect(mirrored.diagnostics, "PREMISE: the mirror does not compile").toEqual([]);

    const shardPaths = mirrored.paths.filter((p) => p.split(".").includes("shard"));
    expect(
      shardPaths.length,
      "PREMISE: the mirror declares no member under the new routing group",
    ).toBeGreaterThan(0);

    const partition = partitionDeclaredSurface(mirrored.paths, isBannedModifierPath);
    const bannedTailed = shardPaths.filter((p) =>
      BANNED_MODIFIER_TAILS.includes(p.split(".").pop() ?? ""),
    );
    expect(
      bannedTailed.length,
      "PREMISE: the new routing group carries no member ending in a banned tail",
    ).toBeGreaterThan(0);
    for (const path of bannedTailed) {
      expect(partition.refused, `${path}: the rule must refuse it with nothing added`).toContain(
        path,
      );
    }

    // NOTHING WAS EDITED TO ACHIEVE IT. This is the assertion that separates a rule from a list.
    for (const [name, set] of [
      ["BANNED_MODIFIER_HEADS", BANNED_MODIFIER_HEADS],
      ["BANNED_MODIFIER_TAILS", BANNED_MODIFIER_TAILS],
      ["BANNED_EXACT_PATHS", BANNED_EXACT_PATHS],
    ] as const) {
      expect(
        set.some((v) => v.includes("shard")),
        `${name} was widened to refuse the new routing group`,
      ).toBe(false);
    }
    expect(
      Object.keys(DISPOSITIONED_SURFACE_MEMBERS).some((k) => k.includes("shard")),
      "the disposition record was widened to absorb the new routing group",
    ).toBe(false);

    // THE HONEST CONVERSE, asserted rather than left implicit: the rule generalises over TAILS, and
    // it does not generalise over new MEMBERS. The routing group's own root carries no banned tail,
    // so it lands outside both buckets — a new surface member genuinely needs a decision, and the
    // partition says so instead of absorbing it.
    expect(undecidedMembers(mirrored.paths, partition)).toContain("test.describe.shard");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-06 GAP 2 — the recipe's claim and the checker's mechanism are quoted from ONE source.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("browser-uat-recipe.md — the documented ban rule equals the decided one (31-06, 31-11)", () => {
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
   * The values one quoted list carries, by a STRICT grammar over the region rather than by
   * substring search. Substring search would count `skip` as present whenever `test.describe.skip`
   * is — the collision that would make a set comparison pass vacuously.
   *
   * The grammar: the ONE line of the region that quotes the constant's NAME in backticks, read from
   * after its LAST colon; every backtick span in that tail is a quoted value. The line is located by
   * the exported constant's own name, so the anchor cannot drift from the thing it anchors to, and
   * "exactly one such line" is asserted rather than assumed — two lines quoting one constant would
   * be two documented claims for one decided set.
   */
  function quotedListFor(region: string, constantName: string): string[] {
    const lines = region.split("\n").filter((l) => l.includes(`\`${constantName}\``));
    if (lines.length !== 1) {
      throw new Error(
        `PREMISE: the region carries ${lines.length} line(s) quoting \`${constantName}\`, not exactly one`,
      );
    }
    const tail = lines[0].slice(lines[0].lastIndexOf(":") + 1);
    return [...new Set([...tail.matchAll(/`([^`]+)`/g)].map((m) => m[1]))].sort();
  }

  it("the recipe's four quoted lists equal the exported constants, in both directions", async () => {
    const { BANNED_MODIFIER_HEADS, BANNED_MODIFIER_TAILS, BANNED_EXACT_PATHS, BANNED_CONFIGURED_PATHS } =
      await loadChecker();
    const whole = readFileSync(RECIPE, "utf8");
    const region = extractSection(whole, BAN_SET_HEADING);

    // PREMISE: the extractor found a real, bounded region — an extractor that ran to end-of-file
    // would silently adopt an unrelated later section.
    expect(region.length, "PREMISE: the extracted region is empty").toBeGreaterThan(0);
    expect(
      region.length,
      "PREMISE: the extracted region ran to end-of-file rather than to the next heading",
    ).toBeLessThan(whole.length);

    // The pairs are built from the EXPORTED constants, so a fourth constant added to the rule
    // without a fourth quoted line is a missing row here rather than a silence.
    //
    // 31-13 (D-18): the fourth constant is a MAP, so it is flattened to the values a reader has to
    // be told — the path AND the option key that makes the call an escape. Quoting only the path
    // would let the recipe claim `expect.configure` is refused outright, which is exactly the
    // claim-broader-than-the-mechanism defect UATX-06 exists to prevent, since
    // `expect.configure({ retries: 2 })` is admitted.
    const pairs: ReadonlyArray<readonly [string, readonly string[]]> = [
      ["BANNED_MODIFIER_HEADS", BANNED_MODIFIER_HEADS],
      ["BANNED_MODIFIER_TAILS", BANNED_MODIFIER_TAILS],
      ["BANNED_EXACT_PATHS", BANNED_EXACT_PATHS],
      [
        "BANNED_CONFIGURED_PATHS",
        [...new Set(Object.entries(BANNED_CONFIGURED_PATHS).flat())],
      ],
    ];
    for (const [name, exported] of pairs) {
      const quoted = quotedListFor(region, name);
      // PREMISE: the quoted list is non-empty, so the equality below is not two empty sets.
      expect(quoted.length, `PREMISE: the recipe quotes nothing for ${name}`).toBeGreaterThan(0);
      // Set EQUALITY, both directions: a value added to the constant and not to the recipe fails
      // here, and so does a value the recipe names that the checker does not decide.
      expect(quoted, `${name}: the recipe and the constant disagree`).toEqual([...exported].sort());
      expect(quoted.length, `${name}: the recipe and the constant differ in size`).toBe(
        exported.length,
      );
    }
  });

  it("the recipe states the claim at the strength it has: both directions, declared surface only", () => {
    const region = extractSection(readFileSync(RECIPE, "utf8"), BAN_SET_HEADING);

    // 31-12: the sentence 31-11 wrote here promised a reverse partition as PENDING. It is replaced
    // by what is now true, in the same commit as the mechanism that made it true — a recipe that
    // still promised a check that had landed would be a stale claim in the direction that flatters.
    expect(
      region,
      "the recipe still describes the check as one-directional",
    ).not.toContain("ONE DIRECTION only");

    // What the reverse half establishes, and that it is a PARTITION rather than a spot-check.
    expect(region).toContain("BOTH directions");
    expect(region).toContain("total partition");
    expect(region).toContain("disjoint");
    expect(region).toContain("sum to");

    // And what it does NOT establish. The boundary is named, not implied.
    expect(region).toContain("**not** the released package");
    expect(region).toContain("UNKNOWN - verify");
    // The residual sits in the region's existing "deliberately outside" list rather than in a new
    // section, so a reader meets the boundary where they meet the rule.
    expect(region).toContain("outside both directions");

    // 31-13 (missing item (c) of 31-VERIFICATION.md round 3). The "BOTH directions" claim above was
    // read, independently, as true only over PROPERTY CHAINS — and did not say so. The reverse walk
    // is `checker.getPropertiesOfType`, which by construction cannot reach a call-link spelling like
    // `test.info().skip`, so a reader relying on the completeness paragraph would have believed the
    // partition covered a shape it structurally cannot see. The disclosure is asserted here in the
    // same commit as the mechanism it describes.
    expect(
      region,
      "the completeness paragraph does not state that the reverse walk covers property chains only",
    ).toContain("DECLARED PROPERTY CHAINS ONLY");
    expect(
      region,
      "the completeness paragraph does not name what the walk declines to descend",
    ).toContain("does not descend through a call signature's RETURN TYPE");
    expect(region).toContain("test.info().skip");

    // …and that the DECLINE set is derived rather than remembered, which is the other half of what
    // makes the boundary trustworthy: a shape nobody decided reds the suite naming itself.
    expect(region).toContain("DERIVED from the checker's own source");
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
        if (text.includes("isBannedModifierCall")) armC.push(node);
      }
      tsApi.forEachChild(node, walk);
    };
    tsApi.forEachChild(fn, walk);

    expect(armC.length, "PREMISE: arm (c) does not ask the membership authority at all").toBe(1);
    const condition = armC[0].expression;
    // The condition IS the call — no `&&`, no null comparison, no membership test of its own.
    expect(tsApi.isCallExpression(condition), condition.getText(sf)).toBe(true);
    const call = condition as import("typescript").CallExpression;
    // 31-13 (D-18): the authority is now `isBannedModifierCall`, which takes the resolved path AND
    // the call's enabled option keys and DELEGATES the pure-path half to `isBannedModifierPath`.
    // Two arguments, still one authority: the call site asks and compares nothing itself.
    expect(call.expression.getText(sf)).toBe("isBannedModifierCall");
    expect(call.arguments.length).toBe(2);

    // …and the pure-path authority is asked by the joint authority, NOT by the call site. A second
    // membership question put at the call site would be the two-authorities drift D-17 closed.
    // Counted over CALL EXPRESSIONS, never over text: the committed .js carries this file's own
    // comments, and a comment naming an authority is not a call to it.
    const invocations = new Map<string, number>();
    const countCalls = (node: import("typescript").Node): void => {
      if (tsApi.isCallExpression(node) && tsApi.isIdentifier(node.expression)) {
        const name = node.expression.text;
        invocations.set(name, (invocations.get(name) ?? 0) + 1);
      }
      tsApi.forEachChild(node, countCalls);
    };
    tsApi.forEachChild(fn, countCalls);
    expect(
      invocations.get("isBannedModifierPath") ?? 0,
      "arm (c) asks the pure-path authority directly — it must ask only the joint authority, which " +
        "delegates that half itself",
    ).toBe(0);
    expect(
      invocations.get("isBannedModifierCall") ?? 0,
      "the joint authority is asked more or fewer than once inside findBannedConstructs",
    ).toBe(1);
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

    // 31-13 (D-18): the scan now covers exported plain OBJECTS too. D-18 added a Record-shaped
    // constant, and an array-only scan would have let the next round smuggle a ban list back in as
    // `{ "test.mute": true }` while every gate over it stayed green — which is precisely the shape
    // of the drift this whole assertion exists to prevent, one container type over.
    const objectOffenders: string[] = [];
    let objectsExamined = 0;
    for (const [name, value] of Object.entries(mod)) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) continue;
      if (typeof value === "function") continue;
      objectsExamined++;
      const keys = Object.keys(value as Record<string, unknown>);
      if (!keys.some((k) => DOTTED.test(k))) continue;
      // BANNED_CONFIGURED_PATHS is the ONE admitted exception, and it is admitted for a stated
      // reason rather than by name alone: its keys are not a ban list, because a key alone decides
      // nothing. Each key maps to the option that must be ENABLED for the call to be refused, so
      // `expect.configure({ retries: 2 })` stays admitted. That is a rule with a second axis, not an
      // enumeration — and it is asserted to stay small and paired, not merely to exist.
      if (name !== "BANNED_CONFIGURED_PATHS") {
        objectOffenders.push(name);
        continue;
      }
      for (const [path, option] of Object.entries(value as Record<string, unknown>)) {
        expect(typeof option, `${path}: the mapped option key must be a string`).toBe("string");
        expect((option as string).includes("."), `${path}: an option key is a segment, not a path`).toBe(
          false,
        );
      }
    }
    expect(objectsExamined, "PREMISE: no exported plain object was examined").toBeGreaterThan(0);
    expect(objectOffenders).toEqual([]);
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-13 CR-07 / WR-14 — the SHAPE-RESOLUTION register.
//
// 31-11 (D-17) closed the MEMBERSHIP register: `isBannedModifierPath` decides every shape it is
// asked about, by head and tail, with no enumerable list of dotted paths. The round-3 verifier then
// planted five constructs that the rule is NEVER ASKED ABOUT, because `calleeDottedPath` declined
// to resolve them at all — a callee chain containing a call (`test.info().skip()`,
// `expect.configure({ soft: true })(...)`) and an import-renamed head
// (`import { test as it }; it.skip(...)`). All five reported `0 findings over 1/1 uat specs
// checked` at exit 0 against the committed .js.
//
// The register that failed is therefore WHICH CALLS THE RULE IS ASKED ABOUT, one register past the
// one D-17 fixed. The cases below are the verifier's own probe, run through the committed artifact.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-13 CR-07/WR-14: the resolver DECIDES the call-link and rename shapes", () => {
  const tsApi = hostTypeScript as typeof import("typescript");
  const IMPORT = 'import { test, expect } from "@playwright/test";';

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

  /** Every dotted path the committed resolver produces for the calls in one snippet, in source order. */
  async function resolvedPathsOf(source: string): Promise<Array<string | null>> {
    const { calleeDottedPath } = await loadChecker();
    const sf = tsApi.createSourceFile("probe.ts", source, tsApi.ScriptTarget.Latest, true);
    const out: Array<string | null> = [];
    const visit = (node: import("typescript").Node): void => {
      if (tsApi.isCallExpression(node)) out.push(calleeDottedPath(tsApi, node.expression));
      tsApi.forEachChild(node, visit);
    };
    tsApi.forEachChild(sf, visit);
    return out;
  }

  // ── RED 1-3: the three TestInfo modifier spellings the round-3 verifier reproduced ───────────
  //
  // `test.info()` returns the TestInfo fixture at run time, and `skip` / `fail` / `fixme` on it are
  // the documented runtime spelling of exactly the modifiers BANNED_MODIFIER_TAILS names, with the
  // identical effect on the evidence. Each produced `0 findings over 1/1 uat specs checked`, EXIT=0
  // against the pre-fix committed .js.
  for (const [modifier, args] of [
    ["skip", ""],
    ["fail", ""],
    ["fixme", 'true, "later"'],
  ] as const) {
    it(`refuses test.info().${modifier}(${args}) — the TestInfo runtime spelling`, () => {
      const findings = findingsOf(
        [
          IMPORT,
          'test("a scenario", async ({ page }) => {',
          `  test.info().${modifier}(${args});`,
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      );
      expect(findings.length, `test.info().${modifier}: expected exactly one finding`).toBe(1);
      expect(findings[0]).toContain(`test.info().${modifier}`);
      expect(findings[0]).toContain("banned modifier call");
    });
  }

  // ── RED 4: the soft-assertion escape, decided by PATH PLUS AN ENABLED OPTION ─────────────────
  it("refuses expect.configure({ soft: true })(...) — the soft-assertion escape", () => {
    const findings = findingsOf(
      [
        IMPORT,
        'test("a scenario", async ({ page }) => {',
        '  await expect.configure({ soft: true })(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("expect.configure");
    expect(findings[0]).toContain("banned modifier call");
  });

  it("does NOT refuse expect.configure({ retries: 2 }) — the false-positive control", () => {
    const findings = findingsOf(
      [IMPORT, "expect.configure({ retries: 2 });", ""].join("\n"),
    );
    expect(
      findings,
      "a configure call carrying no escape option must stay admitted — the rule is path PLUS " +
        "enabled option, never bare path membership",
    ).toEqual([]);
  });

  it("does NOT refuse expect.configure({ soft: false }) — the option must be ENABLED", () => {
    expect(findingsOf([IMPORT, "expect.configure({ soft: false });", ""].join("\n"))).toEqual([]);
  });

  // ── RED 5 (WR-14): an ImportSpecifier rename is canonicalised before the head is read ────────
  it("refuses a modifier call on an import-renamed head", () => {
    const findings = findingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        'it.skip("a skipped scenario", async ({ page }) => {',
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        'it.describe.only("billing", () => {});',
        "",
      ].join("\n"),
    );
    expect(findings.length, "both renamed modifier calls must be refused").toBe(2);
    const joined = findings.join("\n");
    expect(joined).toContain("test.skip");
    expect(joined).toContain("test.describe.only");
  });

  it("the rename map is MODULE-SCOPED: a rename from another module is not canonicalised", () => {
    // The disclosed boundary, pinned to behaviour. Following a re-export across files needs the
    // resolution D-13 deliberately does not ship, so this stays a NAMED residual rather than a
    // silent difference between what the recipe claims and what the checker decides.
    const findings = findingsOf(
      [
        'import { test as it } from "./fixtures";',
        'it.skip("a skipped scenario", async () => {});',
        "",
      ].join("\n"),
    );
    expect(findings).toEqual([]);
  });

  // ── CONTROL A: unchanged before and after — the change is in SHAPE RESOLUTION ────────────────
  it("CONTROL A: test.describe.serial.only still reports exactly one finding", () => {
    const findings = findingsOf(
      [IMPORT, 'test.describe.serial.only("control", () => {});', ""].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.describe.serial.only");
  });

  // ── CONTROL B: no legitimate construct is newly refused ──────────────────────────────────────
  it("CONTROL B: the six legitimate constructs still produce zero findings", () => {
    const body = [
      IMPORT,
      "expect.configure({ retries: 2 });",
      'test.describe.serial("billing", () => {',
      '  test.describe.configure({ mode: "parallel" });',
      '  test("an invoice is shown", async ({ page }) => {',
      '    await test.step("open the page", async () => {',
      '      await page.goto("/billing");',
      "    });",
      '    await expect(page.getByTestId("invoice-total")).toBeVisible();',
      "  });",
      "});",
      "",
    ].join("\n");
    expect(findingsOf(body)).toEqual([]);
  });

  // ── CONTROL C: a chained assertion resolves to a path the ban set does NOT hold ──────────────
  it("CONTROL C: expect(locator).soft resolves to a path that is NOT the exact path expect.soft", async () => {
    const { BANNED_EXACT_PATHS, isBannedModifierPath } = await loadChecker();
    const resolved = await resolvedPathsOf('expect(locator).soft("still legitimate");');
    // The OUTER call is the chained one; its callee is a property access on a CALL, so the head
    // segment is the MARKED `expect` call rather than the bare `expect` identifier.
    const outer = resolved[0];
    expect(outer, "PREMISE: the chained callee did not resolve at all").not.toBeNull();
    expect(
      BANNED_EXACT_PATHS,
      "a chained assertion must not collide with the exact banned path",
    ).not.toContain(outer);
    expect(isBannedModifierPath(outer)).toBe(false);
    expect(findingsOf([IMPORT, 'expect(locator).soft("x");', ""].join("\n"))).toEqual([]);
    // …while the REAL `expect.soft` spelling stays refused, so the control is not a hole.
    expect(isBannedModifierPath("expect.soft")).toBe(true);
  });

  // ── the call-link path spelling is part of the decided contract ──────────────────────────────
  it("a call link resolves to its inner path plus a parenthesis marker segment", async () => {
    const resolved = await resolvedPathsOf("test.info().skip();");
    expect(resolved[0]).toBe("test.info().skip");
    // The marker lands in the ROUTING position, so the head is `test` and the tail is `skip` —
    // which is why D-17's rule refuses it with NO new member in any set.
    expect("test.info().skip".split(".")[0]).toBe("test");
    expect("test.info().skip".split(".").pop()).toBe("skip");
  });

  it("an UNRESOLVABLE inner call leaves the whole path unresolved", async () => {
    const resolved = await resolvedPathsOf("test[name]().skip();");
    expect(resolved[0], "an inner path that does not resolve must not produce an outer one").toBeNull();
  });

  // ── the position question: at WHICH POSITIONS is the rule even asked? ────────────────────────
  //
  // "Which characters the predicate accepts" and "at which positions it is asked" are different
  // questions, and this repository has been caught by the second one before.
  it("POSITION: a call-link modifier at file top level is reported", () => {
    const findings = findingsOf([IMPORT, "test.info().skip();", ""].join("\n"));
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("POSITION: a call-link modifier inside a test.describe callback is reported", () => {
    const findings = findingsOf(
      [IMPORT, 'test.describe("billing", () => {', "  test.info().skip();", "});", ""].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("POSITION: a call-link modifier inside a nested arrow function is reported", () => {
    const findings = findingsOf(
      [
        IMPORT,
        'test("a scenario", async ({ page }) => {',
        '  await test.step("open the page", async () => {',
        "    test.info().skip();",
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("POSITION: a renamed-head modifier is reported at all three positions in ONE spec", () => {
    const findings = findingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        'it.skip("top level", async () => {});',
        'it.describe("billing", () => {',
        '  it.only("inside a describe callback", async () => {});',
        "});",
        'it("a scenario", async ({ page }) => {',
        '  await it.step("nested", async () => {',
        '    it.fixme("inside a nested arrow", async () => {});',
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(3);
    const joined = findings.join("\n");
    expect(joined).toContain("test.skip");
    expect(joined).toContain("test.only");
    expect(joined).toContain("test.fixme");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-13 CR-07 — THE DECLINE SET IS DERIVED, NOT REMEMBERED.
//
// WHY A DERIVATION AND NOT THREE MORE RESIDUAL STRINGS. Phase 31 has now been caught three times by
// the same class: a predicate closed at the exact coordinates a verifier measured, reappearing one
// register over (round 1 -> gap 2; round 2 -> CR-06; round 3 -> CR-07/WR-14). Every one of those
// rounds left a HAND-MAINTAINED set behind, and the next round found the member nobody remembered.
// Writing five more residual sentences after this round would be the fourth instance.
//
// So the set of shapes the resolver still DECLINES is read off the runnable's own AST: the arm-(c)
// call site's resolver closure is derived by following the membership call's arguments back to the
// functions that produce them, and every position in that closure at which resolution ends without
// producing a path is emitted as a signature. Each derived signature is then BOUND, in BOTH
// directions, to either a decided construct or a NAMED member of UNRESOLVABLE_CALLEE_RESIDUALS.
//
// A sixth undisclosed shape therefore cannot land silently: it arrives as a derived site with no
// binding and reds the case that names it. This is the discipline scripts/context-io-writer-set.test.ts
// established for admit()'s refusal sites, transplanted rather than reinvented.
//
// ONE ADAPTATION, STATED RATHER THAN LEFT TO INFERENCE. admit()'s refusal sites return ARRAYS OF
// LITERAL TEXT, so their signature can be the static text they return. A decline site returns `null`
// or nothing, so its identity has to come from its POSITION and its GUARD instead: the enclosing
// function, the chain of enclosing statement kinds, the guard condition's source text, and the
// return's own text — whitespace collapsed, so the signature is stable against reformatting and
// moves when a branch is added, removed or re-guarded.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-13 CR-07: the resolver's DECLINE set, derived from the source", () => {
  const ts = hostTypeScript as typeof import("typescript");
  const CHECKER_TS = join(HERE, "uat-spec-integrity.ts");

  /** The function whose body carries arm (c). The derivation is rooted here, never in a name list. */
  const ARM_C_HOST = "findBannedConstructs";
  /** The membership authority the arm-(c) condition asks. The closure is seeded from ITS arguments. */
  const MEMBERSHIP_AUTHORITY = "isBannedModifierCall";

  interface DeclineSite {
    readonly fn: string;
    readonly signature: string;
  }

  interface DeclineDerivation {
    /** Every top-level function name the parse found — the premise that it parsed anything at all. */
    readonly declared: readonly string[];
    /** Whether the arm-(c) host declaration was located, and whether it had a body. */
    readonly hostFound: boolean;
    readonly hostHasBody: boolean;
    /** How many arm-(c) conditions were found. Exactly one is the premise. */
    readonly armCSites: number;
    /** The functions the arm-(c) condition reaches directly, through its own arguments. */
    readonly roots: readonly string[];
    /** Those roots plus everything they call, transitively — the set sites are derived over. */
    readonly closure: readonly string[];
    /** One entry per position at which resolution ends without producing a path. */
    readonly sites: readonly DeclineSite[];
  }

  /** Whitespace runs collapsed to one space — the signature must not move when the file is reflowed. */
  function collapse(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  /**
   * A decline site is a `return` whose expression is the `null` KEYWORD, or a bare `return;`.
   *
   * That is the exact shape "resolution ended without producing a path" takes in this module, and it
   * is deliberately narrow. `return dottedPath;` and `return segments.join(".");` return a value the
   * caller can use and are NOT sites — which is why `canonicaliseHeadSegment` contributes none: every
   * one of its exits returns its input or a rewrite of its input. `return keys;` and `return renames;`
   * likewise return an accumulator that may carry information.
   */
  function isDeclineReturn(node: import("typescript").Node): boolean {
    if (!ts.isReturnStatement(node)) return false;
    if (node.expression === undefined) return true;
    return node.expression.kind === ts.SyntaxKind.NullKeyword;
  }

  /**
   * The site's identity: enclosing function, the chain of enclosing statement kinds, the nearest
   * enclosing guard condition, and the return's own text.
   *
   * The CHAIN is what separates two textually identical returns. `calleeDottedPath` ends its loop
   * body with `return null;` and ends the function with another `return null;` — same text, no
   * guard, different structure. A signature that collided them would shrink the derived set
   * silently, and a colliding set comparison passes vacuously.
   */
  function siteSignature(
    fn: import("typescript").FunctionDeclaration,
    ret: import("typescript").Node,
    sf: import("typescript").SourceFile,
  ): string {
    const chain: string[] = [];
    let guard = "";
    let cur: import("typescript").Node | undefined = ret.parent;
    while (cur !== undefined && cur !== fn) {
      chain.push(ts.SyntaxKind[cur.kind]);
      if (guard === "" && ts.isIfStatement(cur)) guard = collapse(cur.expression.getText(sf));
      cur = cur.parent;
    }
    chain.reverse();
    return `${fn.name?.text ?? "<anonymous>"} | ${chain.join(">")} | ${guard} | ${collapse(ret.getText(sf))}`;
  }

  /**
   * THE DERIVATION. Root it at the arm-(c) condition, follow that condition's ARGUMENTS back through
   * the local constants of the host function to the module functions that produce them, close over
   * the call graph, and emit one signature per decline site in the closure.
   *
   * The roots are DERIVED rather than named because a resolver added to the arm-(c) pipeline later
   * must arrive in this set by itself. Naming them here would put the drift axis back exactly where
   * this whole block exists to remove it from.
   */
  function deriveDeclineSites(sourcePath: string): DeclineDerivation {
    const sf = ts.createSourceFile(
      "uat-spec-integrity.ts",
      readFileSync(sourcePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );

    const functions = new Map<string, import("typescript").FunctionDeclaration>();
    const walkTop = (node: import("typescript").Node): void => {
      if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
        functions.set(node.name.text, node);
      }
      ts.forEachChild(node, walkTop);
    };
    ts.forEachChild(sf, walkTop);
    const declared = [...functions.keys()].sort();

    const host = functions.get(ARM_C_HOST);
    if (host === undefined || host.body === undefined) {
      return {
        declared,
        hostFound: host !== undefined,
        hostHasBody: false,
        armCSites: 0,
        roots: [],
        closure: [],
        sites: [],
      };
    }

    // Every local `const` of the host, so an argument that is an identifier can be followed to the
    // expression that produced it — `dottedPath` back to `canonicaliseHeadSegment(calleeDottedPath(...))`
    // and `renames` back to `deriveImportRenames(...)`.
    const locals = new Map<string, import("typescript").Node>();
    const collectLocals = (node: import("typescript").Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer !== undefined
      ) {
        locals.set(node.name.text, node.initializer);
      }
      ts.forEachChild(node, collectLocals);
    };
    collectLocals(host.body);

    // The arm-(c) condition(s): an `if` whose condition asks the membership authority.
    const armC: import("typescript").Expression[] = [];
    const findArmC = (node: import("typescript").Node): void => {
      if (ts.isIfStatement(node) && node.expression.getText(sf).includes(MEMBERSHIP_AUTHORITY)) {
        armC.push(node.expression);
      }
      ts.forEachChild(node, findArmC);
    };
    findArmC(host.body);

    const roots = new Set<string>();
    const seenLocals = new Set<string>();
    const queue: import("typescript").Node[] = [...armC];
    while (queue.length > 0) {
      const expr = queue.pop()!;
      const scan = (node: import("typescript").Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          const name = node.expression.text;
          if (functions.has(name)) roots.add(name);
        }
        if (ts.isIdentifier(node) && !seenLocals.has(node.text) && locals.has(node.text)) {
          seenLocals.add(node.text);
          queue.push(locals.get(node.text)!);
        }
        ts.forEachChild(node, scan);
      };
      scan(expr);
    }

    // Transitive closure over the module's own call graph.
    const closure = new Set<string>(roots);
    const frontier = [...roots];
    while (frontier.length > 0) {
      const name = frontier.pop()!;
      const fn = functions.get(name);
      if (fn?.body === undefined) continue;
      const scan = (node: import("typescript").Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          const callee = node.expression.text;
          if (functions.has(callee) && !closure.has(callee)) {
            closure.add(callee);
            frontier.push(callee);
          }
        }
        ts.forEachChild(node, scan);
      };
      scan(fn.body);
    }

    const sites: DeclineSite[] = [];
    for (const name of [...closure].sort()) {
      const fn = functions.get(name)!;
      if (fn.body === undefined) continue;
      const scan = (node: import("typescript").Node): void => {
        if (isDeclineReturn(node)) sites.push({ fn: name, signature: siteSignature(fn, node, sf) });
        ts.forEachChild(node, scan);
      };
      scan(fn.body);
    }

    return {
      declared,
      hostFound: true,
      hostHasBody: true,
      armCSites: armC.length,
      roots: [...roots].sort(),
      closure: [...closure].sort(),
      sites,
    };
  }

  function derivedSignatures(sourcePath: string): string[] {
    return deriveDeclineSites(sourcePath)
      .sites.map((s) => s.signature)
      .sort();
  }

  /**
   * THE HARNESS ASSERTS ITS OWN PREMISE, as failing assertions rather than assumptions. An empty
   * derivation satisfies every claim below vacuously — "every derived site is bound" is trivially
   * true of no sites — and this repository has recorded a FALSE verification-harness premise six
   * times across four rounds.
   */
  function assertDeclinePremise(d: DeclineDerivation): void {
    expect(
      d.declared.length,
      "PREMISE: the TypeScript parse of the runnable yielded ZERO top-level function declarations, " +
        "so the decline derivation measured nothing at all",
    ).toBeGreaterThan(0);
    expect(
      d.hostFound,
      `PREMISE: no function named "${ARM_C_HOST}" was declared, so the arm-(c) pipeline could not ` +
        `be rooted and the derived set is empty for a reason that says nothing about the resolver`,
    ).toBe(true);
    expect(
      d.hostHasBody,
      `PREMISE: "${ARM_C_HOST}" was declared with no body to walk`,
    ).toBe(true);
    expect(
      d.armCSites,
      `PREMISE: the arm-(c) condition asking "${MEMBERSHIP_AUTHORITY}" was not found EXACTLY once, ` +
        `so the closure was seeded from the wrong expression`,
    ).toBe(1);
    expect(
      d.roots.length,
      "PREMISE: the arm-(c) condition reached no module function through its own arguments, so the " +
        "closure is empty and every binding below is vacuous",
    ).toBeGreaterThan(0);
    expect(
      d.sites.length,
      "PREMISE: ZERO decline sites were derived. Either the resolver declines nothing, or the site " +
        "matcher stopped matching the shape a decline takes",
    ).toBeGreaterThan(0);
  }

  // ── THE BINDING RECORD: one entry per derived site ──────────────────────────────────────────
  //
  // WHICH HALF IS LOAD-BEARING. `signature` is a hand-written copy of what the derivation reads off
  // the module, and it is BOUNDED by being asserted EQUAL to the derived set in both directions —
  // exactly as EXPECTED_NOTE_WRITERS is bounded in scripts/context-io-writer-set.test.ts. The
  // disposition is the human judgment that cannot be read off a parse, and it is attached TO a
  // derived signature rather than standing in for one.
  //
  // `decided`  — the site does not open a shape. Either the shape it used to decline is now resolved
  //              elsewhere and this guard only propagates that decision, or the position is one where
  //              declining is the correct answer and no construct hides behind it.
  // `residual` — the site DOES leave a real construct undecided, and the exact sentence of
  //              UNRESOLVABLE_CALLEE_RESIDUALS that discloses it is named here.

  interface DeclineDisposition {
    readonly kind: "decided" | "residual";
    /** `decided`: the construct the resolver now resolves, or why declining opens nothing. */
    readonly reason: string;
    /** `residual`: the EXACT text of the register member that discloses this site. */
    readonly residual?: string;
  }

  const R_COMPUTED_MEMBER =
    "A member computed from a non-literal expression is not refused: `test[name](...)` where `name` is a variable. The member name is absent from the source text.";
  const R_MODULE_SCOPE =
    "A rename or namespace that arrives through any module other than `@playwright/test` is not canonicalised: `import { test as it } from \"./fixtures\";` then `it.skip(...)`. Following a re-export across files needs module resolution this runnable does not ship, so the rename map is MODULE-SCOPED to the framework's own import declaration.";
  const R_NON_IDENTIFIER_HEAD =
    "A callee whose head is not an identifier is not resolved: a call on an object literal, or on `this`. There is no head segment to read, so no membership question can be put.";
  const R_STEP_BOUND =
    "A callee chain longer than the resolver's 512-step bound is not resolved. The bound stops a pathological chain from spinning. It is a stated LIMIT, not a silence. A chain that reaches it yields no path rather than a truncated one.";
  const R_NON_LITERAL_OPTION =
    "An option is ENABLED only when the call's first argument is an object literal assigning it the `true` keyword. A variable argument enables nothing, and neither does a variable option value. This runnable parses and never evaluates.";
  const R_PARSER_PREDICATES =
    "A parser that does not expose the import or object-literal node predicates yields no rename canonicalisation and no option reading. The parser is the TARGET repository's (D-13), so its surface is not this runnable's to assume. The resolver degrades to the pre-D-18 behaviour for those shapes rather than throwing outside the exit-code contract.";
  const R_ALIAS =
    "An aliased binding is not refused: `const t = test;` then a modifier call on `t`. The alias cannot be followed to its declaration without a type checker.";

  const DECLINE_SITE_DISPOSITIONS: Readonly<Record<string, DeclineDisposition>> = Object.freeze({
    // ── calleeDottedPath ──────────────────────────────────────────────────────────────────────
    "calleeDottedPath | Block>ForStatement>Block>IfStatement>Block>IfStatement | inner === null | return null;":
      {
        kind: "decided",
        reason:
          "D-18 (1) DECIDES the call link: this guard fires only when the INNER path already " +
          "declined, at one of the sites below, so it propagates a decision rather than opening a " +
          "shape of its own. Marking a path whose head the source text does not carry would invent " +
          "a segment.",
      },
    "calleeDottedPath | Block>ForStatement>Block>IfStatement>Block>IfStatement | !ts.isStringLiteralLike(arg) | return null;":
      {
        kind: "residual",
        reason: "A bracket member computed from a variable has no name in the source text.",
        residual: R_COMPUTED_MEMBER,
      },
    "calleeDottedPath | Block>ForStatement>Block |  | return null;": {
      kind: "residual",
      reason:
        "The node kind fell through every descent case, which is the non-identifier head: a call " +
        "on an object literal, on `this`, or on any other root with no name to read.",
      residual: R_NON_IDENTIFIER_HEAD,
    },
    "calleeDottedPath | Block |  | return null;": {
      kind: "residual",
      reason: "The 512-step bound was exhausted; a stated limit, not a silence.",
      residual: R_STEP_BOUND,
    },

    // ── enabledOptionKeys ─────────────────────────────────────────────────────────────────────
    "enabledOptionKeys | Block>IfStatement | !ts.isCallExpression(call) | return null;": {
      kind: "decided",
      reason:
        "The arm-(c) site only ever passes a CallExpression node; this is the narrowing that lets " +
        "the argument list be read at all. A node that is not a call has no option literal by " +
        "definition, so nothing hides here.",
    },
    "enabledOptionKeys | Block>IfStatement | first === undefined | return null;": {
      kind: "decided",
      reason:
        "A call with no arguments enables no option, so the membership authority answers false — " +
        "which is correct: `expect.configure()` is not a soft-assertion escape.",
    },
    'enabledOptionKeys | Block>IfStatement>Block | typeof isObjectLiteral !== "function" || typeof isPropertyAssignment !== "function" | return null;':
      {
        kind: "residual",
        reason:
          "The TARGET repository's parser does not expose the object-literal predicates, so no " +
          "option can be read from any call in this run.",
        residual: R_PARSER_PREDICATES,
      },
    "enabledOptionKeys | Block>IfStatement | !isObjectLiteral(first) | return null;": {
      kind: "residual",
      reason:
        "The options argument is not an object literal — `expect.configure(options)` where " +
        "`options` is a variable. Its contents are absent from the source text.",
      residual: R_NON_LITERAL_OPTION,
    },

    // ── deriveImportRenames ───────────────────────────────────────────────────────────────────
    'deriveImportRenames | Block>IfStatement>Block | typeof isImportDeclaration !== "function" || typeof isNamedImports !== "function" || typeof isNamespaceImport !== "function" || typeof isImportSpecifier !== "function" | return null;':
      {
        kind: "residual",
        reason:
          "The TARGET repository's parser does not expose the import predicates, so no rename is " +
          "canonicalised in this run and the resolver degrades to the pre-D-18 head reading.",
        residual: R_PARSER_PREDICATES,
      },
    "deriveImportRenames | Block>ExpressionStatement>CallExpression>ArrowFunction>Block>IfStatement | !isImportDeclaration(node) | return;":
      {
        kind: "decided",
        reason:
          "A top-level statement that is not an import declaration carries no import binding, so " +
          "skipping it opens no shape.",
      },
    "deriveImportRenames | Block>ExpressionStatement>CallExpression>ArrowFunction>Block>IfStatement | !ts.isStringLiteralLike(node.moduleSpecifier) | return;":
      {
        kind: "decided",
        reason:
          "A parseable import declaration's module specifier is always a string literal; this is " +
          "the narrowing that lets its text be compared, and no real import shape falls through it.",
      },
    "deriveImportRenames | Block>ExpressionStatement>CallExpression>ArrowFunction>Block>IfStatement | node.moduleSpecifier.text !== PLAYWRIGHT_TEST_MODULE | return;":
      {
        kind: "residual",
        reason:
          "THE MODULE SCOPE THIS PLAN'S OWN CHANGE CREATED. A rename or namespace arriving through " +
          "a local fixture-extension module is not canonicalised; following a re-export across " +
          "files needs the module resolution D-13 forbids shipping. What would force it open: a " +
          "reproduced evasion through a fixture-extension re-export, which would make this a " +
          "resolution question rather than a scope choice.",
        residual: R_MODULE_SCOPE,
      },
    "deriveImportRenames | Block>ExpressionStatement>CallExpression>ArrowFunction>Block>IfStatement | clause === undefined | return;":
      {
        kind: "decided",
        reason:
          "A side-effect-only import (`import \"@playwright/test\";`) binds no name, so it can " +
          "carry neither a rename nor a namespace.",
      },
    "deriveImportRenames | Block>ExpressionStatement>CallExpression>ArrowFunction>Block>IfStatement | named === undefined | return;":
      {
        kind: "decided",
        reason:
          "A default-only import binds a name to a default export the declared surface does not " +
          "carry, so a spec written that way does not run and has no evidence to narrow. " +
          "`UNKNOWN - verify` at the declared surface's own strength.",
      },
  });

  // ── the premise and the derived set ──────────────────────────────────────────────────────────

  it("the derivation's PREMISES hold before any binding is asserted", () => {
    assertDeclinePremise(deriveDeclineSites(CHECKER_TS));
  });

  it("the derived closure contains the three resolvers the arm-(c) site asks", () => {
    const { roots, closure } = deriveDeclineSites(CHECKER_TS);
    // The roots are what the arm-(c) CONDITION reaches through its own arguments — derived, never
    // named. Asserting them proves the follow-the-arguments step selected the pipeline rather than
    // silently selecting nothing.
    for (const name of [
      "isBannedModifierCall",
      "calleeDottedPath",
      "canonicaliseHeadSegment",
      "enabledOptionKeys",
      "deriveImportRenames",
    ]) {
      expect(roots, `${name} is not reached from the arm-(c) condition`).toContain(name);
    }
    // …and the transitive half really closed over the call graph.
    expect(closure).toContain("isBannedModifierPath");
    expect(closure).toContain("isTypeAssertionLike");
  });

  it("the canonicaliser contributes ZERO decline sites — every exit returns its input", () => {
    const { closure, sites } = deriveDeclineSites(CHECKER_TS);
    // PREMISE: it is in the walked set, or the claim below is about a function nobody looked at.
    expect(closure, "PREMISE: canonicaliseHeadSegment is outside the derived closure").toContain(
      "canonicaliseHeadSegment",
    );
    expect(
      sites.filter((s) => s.fn === "canonicaliseHeadSegment"),
      "the rename canonicaliser introduced a decline of its own — it must only rewrite a head or " +
        "pass its input through, so that the decline set stays exactly the set of positions where " +
        "no path could be produced",
    ).toEqual([]);
  });

  it("every derived signature is DISTINCT — a prefix collision would pass this block vacuously", () => {
    const signatures = derivedSignatures(CHECKER_TS);
    expect(
      new Set(signatures).size,
      "two decline sites derived the SAME signature, so the set below is smaller than the number " +
        "of positions the resolver really declines at",
    ).toBe(signatures.length);
  });

  it("the derived decline set has exactly the MEMBERS the binding record names", () => {
    expect(derivedSignatures(CHECKER_TS)).toEqual(
      Object.keys(DECLINE_SITE_DISPOSITIONS).sort(),
    );
  });

  it("the derived decline set has the expected CARDINALITY", () => {
    // Asserted separately from the member list on purpose, with its own message: a site whose GUARD
    // was re-worded and a site that was ADDED are different events and must not read as one failure.
    expect(
      derivedSignatures(CHECKER_TS).length,
      "the number of positions at which callee resolution ends without a path CHANGED",
    ).toBe(Object.keys(DECLINE_SITE_DISPOSITIONS).length);
  });

  it("the binding record's KEY SET equals the derived set, in BOTH directions", () => {
    const derived = derivedSignatures(CHECKER_TS);
    const bound = Object.keys(DECLINE_SITE_DISPOSITIONS).sort();

    const unbound = derived.filter((s) => !bound.includes(s));
    expect(
      unbound,
      `${unbound.length} decline site(s) have no binding: ${unbound.join(" ;; ")}. A site with no ` +
        `entry is an UNDISCLOSED shape — a construct the ban rule is never asked about, and nobody ` +
        `was told. This is exactly the state CR-07 found the resolver in.`,
    ).toEqual([]);

    const stale = bound.filter((s) => !derived.includes(s));
    expect(
      stale,
      `${stale.length} binding(s) name a site the resolver no longer has: ${stale.join(" ;; ")}. A ` +
        `stale entry pads the record and would make the arithmetic close over a position nobody ` +
        `can reach.`,
    ).toEqual([]);
  });

  // ── the residual register, bound in both directions ─────────────────────────────────────────

  it("every `residual` disposition names a member of UNRESOLVABLE_CALLEE_RESIDUALS, verbatim", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    const entries = Object.entries(DECLINE_SITE_DISPOSITIONS);
    expect(entries.length, "PREMISE: the binding record is empty").toBeGreaterThan(0);

    const residualEntries = entries.filter(([, d]) => d.kind === "residual");
    expect(
      residualEntries.length,
      "PREMISE: no site is dispositioned as a residual, so the check below asserts nothing",
    ).toBeGreaterThan(0);

    for (const [signature, disposition] of entries) {
      expect(
        disposition.reason.trim().length,
        `${signature}: the disposition reason is shorter than a sentence — a label is not a reason`,
      ).toBeGreaterThan(40);
      if (disposition.kind !== "residual") {
        expect(disposition.residual, `${signature}: a decided site must name no residual`).toBeUndefined();
        continue;
      }
      expect(disposition.residual, `${signature}: a residual site names no residual`).toBeDefined();
      expect(
        UNRESOLVABLE_CALLEE_RESIDUALS,
        `${signature}: its residual text is not a member of the exported register`,
      ).toContain(disposition.residual);
    }
  });

  it("THE CONVERSE: every member of UNRESOLVABLE_CALLEE_RESIDUALS is accounted for", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    const referenced = new Set(
      Object.values(DECLINE_SITE_DISPOSITIONS)
        .map((d) => d.residual)
        .filter((r): r is string => r !== undefined),
    );

    // TWO AXES, KEPT APART BECAUSE THEY ARE DIFFERENT FACTS. A residual can disclose either a
    // position where RESOLUTION ends without a path (the derived set above), or a path that
    // resolves perfectly and is simply NOT A MEMBER of the ban rule. The alias residual is the
    // second kind: `const t = test; t.skip()` resolves to `t.skip` — the resolver declined nothing,
    // the head is just not `test`. Folding the two axes together would let a resolution site hide
    // behind a membership sentence, which is the conflation this phase keeps being caught by.
    const MEMBERSHIP_RESIDUALS: Readonly<Record<string, string>> = Object.freeze({
      [R_ALIAS]:
        "A MEMBERSHIP residual, not a resolution one. The path resolves (`t.skip`); its head is " +
        "simply not a banned head, and binding a local name to its declaration needs the type " +
        "checker D-13 forbids shipping. The same sentence covers a binding reached through a " +
        "fixture parameter (`testInfo.skip()`), which is the shape 31-REVIEW.md listed for " +
        "completeness. Asserted behaviourally by the alias/computed-member case earlier in this file.",
    });

    for (const residual of UNRESOLVABLE_CALLEE_RESIDUALS) {
      const isResolution = referenced.has(residual);
      const isMembership = Object.prototype.hasOwnProperty.call(MEMBERSHIP_RESIDUALS, residual);
      expect(
        isResolution || isMembership,
        `the register discloses a shape no derived decline site and no membership disposition ` +
          `accounts for: ${residual}`,
      ).toBe(true);
      expect(
        isResolution && isMembership,
        `a residual is claimed on BOTH axes at once, so one of the two records is wrong: ${residual}`,
      ).toBe(false);
    }

    // …and the membership record holds no sentence the register lacks — the padding direction.
    for (const member of Object.keys(MEMBERSHIP_RESIDUALS)) {
      expect(
        UNRESOLVABLE_CALLEE_RESIDUALS,
        `the membership record names a residual the register does not carry: ${member}`,
      ).toContain(member);
    }

    // The two axes PARTITION the register: their sizes sum to it, so nothing was counted twice and
    // nothing went missing.
    const resolutionCount = UNRESOLVABLE_CALLEE_RESIDUALS.filter((r) => referenced.has(r)).length;
    expect(resolutionCount + Object.keys(MEMBERSHIP_RESIDUALS).length).toBe(
      UNRESOLVABLE_CALLEE_RESIDUALS.length,
    );
  });

  // ── THE WATCHED FAIL: the derivation is a control, not a coincidence ────────────────────────

  /** The seeded branch's guard, distinctive enough that its signature cannot collide with a real one. */
  const SEEDED_GUARD = "cur === SEEDED_CONTROL_SENTINEL";
  /** The one-occurrence anchor the seeded mirror inserts after, inside calleeDottedPath's loop. */
  const SEED_ANCHOR = "  for (let guard = 0; guard < 512; guard++) {\n    if (ts.isIdentifier(cur)) {";

  function mirrorWithSeededDecline(): string {
    const source = readFileSync(CHECKER_TS, "utf8");
    expect(
      source.split(SEED_ANCHOR).length - 1,
      `PREMISE: the seed anchor was not found EXACTLY once in the runnable, so the mirror is not ` +
        `the source plus one branch — anchor: ${SEED_ANCHOR}`,
    ).toBe(1);
    expect(
      source.includes(SEEDED_GUARD),
      "PREMISE: the seeded guard text is ALREADY in the runnable, so its presence would prove nothing",
    ).toBe(false);
    const mutated = source.replace(
      SEED_ANCHOR,
      `  for (let guard = 0; guard < 512; guard++) {\n    if (${SEEDED_GUARD}) return null;\n    if (ts.isIdentifier(cur)) {`,
    );
    expect(
      mutated.split(SEEDED_GUARD).length - 1,
      "PREMISE: the seeded branch did not land exactly once in the mirror",
    ).toBe(1);
    const path = join(mkTmp(), "uat-spec-integrity.ts");
    writeFileSync(path, mutated, "utf8");
    return path;
  }

  it("a SEEDED extra decline branch moves the count UP by exactly one and arrives UNBOUND", () => {
    const before = derivedSignatures(CHECKER_TS);
    const mirror = mirrorWithSeededDecline();
    const derived = deriveDeclineSites(mirror);

    // PREMISE: the mirror still parses into the same pipeline, or the count difference would be
    // caused by a broken derivation rather than by the seed.
    assertDeclinePremise(derived);

    const after = derivedSignatures(mirror);
    expect(after.length, "the seeded branch did not move the derived cardinality by one").toBe(
      before.length + 1,
    );

    const seeded = after.filter((s) => s.includes(SEEDED_GUARD));
    expect(seeded.length, "the derivation did not see the seeded branch at all").toBe(1);

    // NOTHING ELSE MOVED: the seeded signature is the ONLY difference, so the count change is
    // caused by the seed and not by a derivation that broke and started reporting some other set.
    expect(after.filter((s) => !s.includes(SEEDED_GUARD))).toEqual(before);

    // …and the key-set equality REPORTS IT, naming itself — the behaviour a sixth undisclosed shape
    // would produce.
    const bound = Object.keys(DECLINE_SITE_DISPOSITIONS);
    const unbound = after.filter((s) => !bound.includes(s));
    expect(unbound.length).toBe(1);
    expect(unbound[0]).toContain(SEEDED_GUARD);
  });

  it("a RENAMED arm-(c) host fires the PREMISE, not the member comparison", () => {
    // The distinction: a derivation that found NOTHING must fail as "the harness measured nothing",
    // never as "the members disagree". The second reads like a real finding about the resolver.
    const source = readFileSync(CHECKER_TS, "utf8");
    const anchor = `export function ${ARM_C_HOST}(`;
    expect(source.split(anchor).length - 1, "PREMISE: the host anchor is not unique").toBe(1);
    const path = join(mkTmp(), "uat-spec-integrity.ts");
    writeFileSync(path, source.replace(anchor, "export function findBannedConstructsRenamed("), "utf8");

    const derived = deriveDeclineSites(path);
    expect(derived.sites).toEqual([]);
    expect(() => assertDeclinePremise(derived)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-13 (Rule 2, found BY the decline derivation above) — a NAMESPACE import of the framework.
//
// Working the decline set surfaced a shape no round had named: `import * as pw from
// "@playwright/test"; pw.test.skip(...)` resolves cleanly to `pw.test.skip`, whose head is `pw`, so
// the head-set check declines it — a real evasion of the same D-14 arm (c) ban, in the same register
// CR-07 is about. Unlike the disclosed residuals it IS decidable from the source text alone: the
// local name sits in the import clause's namespace binding, a literal already in the file. Calling
// it a residual would state something false about why it is not decided, so it is DECIDED.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-13: a namespace import of @playwright/test is canonicalised", () => {
  function findingsOf(body: string): string[] {
    const root = mkTargetRepo({});
    const dest = join(root, "e2e", "uat", "subject.uat.spec.ts");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
    const r = runCheck(root, "--json");
    if (r.status === 0) return [];
    return (JSON.parse(r.stdout) as { findings: string[] }).findings;
  }

  it("refuses a modifier call reached through a namespace import", () => {
    const findings = findingsOf(
      [
        'import * as pw from "@playwright/test";',
        'pw.test.skip("a skipped scenario", async () => {});',
        'pw.test.describe.only("billing", () => {});',
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(2);
    const joined = findings.join("\n");
    expect(joined).toContain("test.skip");
    expect(joined).toContain("test.describe.only");
  });

  it("does NOT refuse a namespace import of another module — the same module scope", () => {
    expect(
      findingsOf(
        ['import * as pw from "./fixtures";', 'pw.test.skip("x", async () => {});', ""].join("\n"),
      ),
    ).toEqual([]);
  });

  it("does NOT refuse a legitimate call reached through the namespace", () => {
    expect(
      findingsOf(
        [
          'import * as pw from "@playwright/test";',
          'pw.test.describe.serial("billing", () => {',
          '  pw.test("an invoice is shown", async ({ page }) => {',
          '    await pw.expect(page.getByTestId("x")).toBeVisible();',
          "  });",
          "});",
          "",
        ].join("\n"),
      ),
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-13 — the three NEW corpus fixtures, and their mutation controls.
//
// Each fixture follows the shape modifier-family.uat.spec.ts established: a header stating which
// finding forced it, a marked region holding the planted constructs and nothing else, and a
// structurally identical unmarked twin. Deleting exactly the marked region and asserting zero
// findings is what proves a finding was caused by the PLANTED CONSTRUCT rather than by the scenario,
// the selectors or the assertion.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity fixtures — 31-13: the call-link, rename and configured-soft corpus", () => {
  function findingsFor(fixtureName: string): string[] {
    const root = mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": fixtureName });
    const r = runCheck(root, "--json");
    if (r.status === 0) return [];
    return (JSON.parse(r.stdout) as { findings: string[] }).findings;
  }

  it("modifier-call-link.uat.spec.ts reports one finding per planted TestInfo modifier", () => {
    const findings = findingsFor("modifier-call-link.uat.spec.ts");
    expect(findings.length).toBe(3);
    const joined = findings.join("\n");
    for (const path of ["test.info().skip", "test.info().fail", "test.info().fixme"]) {
      expect(joined, `${path} is absent from the findings`).toContain(path);
    }
  });

  it("modifier-call-link.uat.spec.ts drops to zero findings when its marked region is removed", () => {
    const r = runMutated("modifier-call-link.uat.spec.ts");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1");
  });

  it("import-rename.uat.spec.ts reports one finding per planted renamed modifier", () => {
    const findings = findingsFor("import-rename.uat.spec.ts");
    expect(findings.length).toBe(2);
    const joined = findings.join("\n");
    expect(joined).toContain("test.skip");
    expect(joined).toContain("test.describe.only");
  });

  it("import-rename.uat.spec.ts drops to zero findings when its marked region is removed", () => {
    // The twin uses the SAME renamed binding without a modifier, so a surviving finding would mean
    // the rename itself was being refused rather than the modifier.
    const r = runMutated("import-rename.uat.spec.ts");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1");
  });

  it("configured-soft.uat.spec.ts reports exactly the planted escape", () => {
    const findings = findingsFor("configured-soft.uat.spec.ts");
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("expect.configure");
  });

  it("configured-soft.uat.spec.ts's CONTROL survives: removing the escape leaves zero findings", () => {
    // PREMISE: the legitimate configure call really is still in the file after the mutation, or the
    // zero-finding verdict would be a statement about a file that no longer carries the control.
    const mutated = withBannedConstructsRemoved("configured-soft.uat.spec.ts");
    expect(
      mutated,
      "PREMISE: the false-positive control left the fixture with its marked region",
    ).toContain("expect.configure({ retries: 2 })");

    const r = runMutated("configured-soft.uat.spec.ts");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1");
  });

  it("every new fixture is reached by the fixtures typecheck target's derived corpus", () => {
    const onDisk = readdirSync(FIXTURES).filter((n) => n.endsWith(".uat.spec.ts"));
    for (const name of [
      "modifier-call-link.uat.spec.ts",
      "import-rename.uat.spec.ts",
      "configured-soft.uat.spec.ts",
    ]) {
      expect(onDisk, `${name} is not on disk`).toContain(name);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-13 — THE THREE-WAY CROSS-CHECK: recipe boundary list <-> exported register <-> derived set.
//
// UATX-06's whole content is "the recipe's claim matches exactly what the checker decides". Three
// artifacts carry that claim, and a disagreement between any two of them is the defect — CR-07 was
// found precisely because the recipe's boundary list named two shapes while the resolver declined
// five. The register-to-recipe direction was already asserted (every register member appears in the
// region). This block adds the CONVERSE, which is the direction that catches a recipe bullet
// claiming a callee-shape boundary the mechanism does not have: the boundary list is partitioned
// into register members and a bounded set of NON-residual bullets, and the two must account for
// every bullet with nothing left over.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("browser-uat-recipe.md — 31-13: the boundary list is the register plus a bounded remainder", () => {
  const RECIPE = join(REPO_ROOT, "agent-factory", "checklists", "browser-uat-recipe.md");
  const LIST_OPENER = "Deliberately outside the rule, recorded here so the boundary is written down:";
  const LIST_CLOSER = "Widening the rule is a new decision";

  /** The bullets of the boundary list, each with its wrapped continuation lines folded in. */
  function boundaryBullets(): string[] {
    const lines = readFileSync(RECIPE, "utf8").split("\n");
    const start = lines.findIndex((l) => l.trimEnd() === LIST_OPENER);
    expect(
      start,
      `PREMISE: the boundary list's opener is absent from the recipe, so every assertion below ` +
        `would be over an empty list`,
    ).toBeGreaterThanOrEqual(0);
    const end = lines.findIndex((l, i) => i > start && l.startsWith(LIST_CLOSER));
    expect(end, "PREMISE: the boundary list has no closing paragraph, so it ran to end-of-file")
      .toBeGreaterThan(start);

    const bullets: string[] = [];
    for (const line of lines.slice(start + 1, end)) {
      if (line.startsWith("- ")) bullets.push(line.slice(2).trim());
      else if (line.startsWith("  ") && bullets.length > 0) {
        bullets[bullets.length - 1] = `${bullets[bullets.length - 1]} ${line.trim()}`;
      }
    }
    return bullets;
  }

  /**
   * The bullets that are NOT callee-shape residuals, each with the reason it belongs in this list
   * anyway. Bounded exactly like DISPOSITIONED_SURFACE_MEMBERS: a bullet added to the recipe with no
   * entry here lands outside both buckets and the totality case reports it, so a new boundary claim
   * cannot be written into the recipe without either matching the register or being decided here.
   */
  const NON_RESIDUAL_BOUNDARY_BULLETS: Readonly<Record<string, string>> = Object.freeze({
    "catch-handler": "D-14 names the try block and the catch clause; a promise `.catch()` handler is a third region no rule names.",
    "finally-block": "The same decision, for the third region of a try statement.",
    "zero-assertion-body": "Vacuous evidence, explicitly deferred by D-14 rather than overlooked.",
    "both-directions": "States what the forward and reverse halves establish; a claim about coverage, not a declined shape.",
    "property-chains-only": "States the reverse walk's own boundary — the missing item (c) of round 3.",
    "derived-decline-set": "States that the decline set is derived and bound, which is what makes the list above trustworthy.",
    "declared-surface-not-package": "The hand-transcription `UNKNOWN - verify`; a limit of the DENOMINATOR, not a declined callee shape.",
    "walk-depth-bound": "The reverse walk's depth bound; again a limit of the denominator.",
  });

  /** The opening words that identify each non-residual bullet. Matched as a prefix, never as a substring. */
  const NON_RESIDUAL_OPENERS: Readonly<Record<string, string>> = Object.freeze({
    "catch-handler": "An assertion inside a promise",
    "finally-block": "An assertion inside a `finally` block",
    "zero-assertion-body": "A spec body carrying",
    "both-directions": "Completeness against the DECLARED framework surface",
    "property-chains-only": "The reverse walk covers DECLARED PROPERTY CHAINS ONLY",
    "derived-decline-set": "The set of callee shapes the resolver still declines is DERIVED",
    "declared-surface-not-package": "The declared surface is **not** the released package",
    "walk-depth-bound": "The walk that produces the reverse half's denominator",
  });

  it("the boundary list PARTITIONS into register members and the bounded remainder", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    const bullets = boundaryBullets();

    expect(bullets.length, "PREMISE: the boundary list is empty").toBeGreaterThan(0);
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.length,
      "PREMISE: the residual register is empty",
    ).toBeGreaterThan(0);

    const register = new Set<string>(UNRESOLVABLE_CALLEE_RESIDUALS);
    const openers = Object.entries(NON_RESIDUAL_OPENERS);

    const asRegister: string[] = [];
    const asRemainder: string[] = [];
    const undecided: string[] = [];
    for (const bullet of bullets) {
      if (register.has(bullet)) {
        asRegister.push(bullet);
        continue;
      }
      const match = openers.find(([, opener]) => bullet.startsWith(opener));
      if (match !== undefined) {
        asRemainder.push(match[0]);
        continue;
      }
      undecided.push(bullet);
    }

    expect(
      undecided,
      `${undecided.length} boundary bullet(s) are neither a member of UNRESOLVABLE_CALLEE_RESIDUALS ` +
        `nor a decided non-residual bullet: ${undecided.join(" ;; ")}. A boundary the recipe claims ` +
        `and the mechanism does not carry is the claim-broader-than-the-mechanism defect UATX-06 ` +
        `exists to prevent — and it is how CR-07 stayed undisclosed.`,
    ).toEqual([]);

    // EVERY register member is present as a bullet, verbatim — the direction already asserted
    // earlier in this file, re-asserted here over the PARSED list so a member buried in a paragraph
    // rather than written as a bullet is caught too.
    for (const residual of UNRESOLVABLE_CALLEE_RESIDUALS) {
      expect(asRegister, `the register member is not a boundary BULLET: ${residual}`).toContain(
        residual,
      );
    }

    // …and the remainder record holds no key the recipe lacks — the padding direction.
    expect([...asRemainder].sort()).toEqual(Object.keys(NON_RESIDUAL_OPENERS).sort());
    expect(Object.keys(NON_RESIDUAL_OPENERS).sort()).toEqual(
      Object.keys(NON_RESIDUAL_BOUNDARY_BULLETS).sort(),
    );

    // The arithmetic that says nothing was counted twice and nothing went missing.
    expect(asRegister.length + asRemainder.length).toBe(bullets.length);
  });

  it("every non-residual boundary bullet carries a written reason, not a label", () => {
    const entries = Object.entries(NON_RESIDUAL_BOUNDARY_BULLETS);
    expect(entries.length, "PREMISE: the remainder record is empty").toBeGreaterThan(0);
    for (const [key, reason] of entries) {
      expect(
        reason.trim().length,
        `${key}: the reason is shorter than a sentence — a label is not a reason`,
      ).toBeGreaterThan(40);
    }
  });
});
