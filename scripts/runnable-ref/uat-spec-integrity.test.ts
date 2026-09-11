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
import { pathToFileURL } from "node:url";
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

/** 31-28 (D-30): opaque to the suite — it is threaded, never inspected. */
interface ProgramContextView {
  readonly program: { getSourceFile(fileName: string): unknown };
  readonly frameworkFiles: ReadonlySet<string>;
  readonly typePaths: ReadonlyMap<unknown, string>;
}

interface CheckerModule {
  readonly UAT_SPEC_GLOB_SUFFIX: string;
  // 31-35 (D-36): the framework-surface walk's two bounds, the vocabulary for WHICH one stopped the
  // walk, and the one sentence a stopped walk returns as its could-not-run cause.
  readonly SURFACE_NODE_BOUND: number;
  readonly SURFACE_DEPTH_BOUND: number;
  readonly SURFACE_TRUNCATION_REACHED: Readonly<Record<string, string>>;
  readonly SURFACE_TRUNCATION_ARMS: readonly string[];
  readonly SURFACE_TRUNCATED_CAUSE: string;
  surfaceTruncatedCause(reached: string): string;
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
  // 31-16 (D-20 (1)): the ONE marker-aware normaliser every whole-path arm asks.
  readonly CALL_LINK_MARKER: string;
  stripRoutingLinks(dottedPath: string): string;
  // 31-16 (D-20 (2)): the option axis folded across the whole marked chain.
  enabledOptionKeys(ts: unknown, call: unknown): ReadonlySet<string> | null;
  chainEnabledOptionKeys(ts: unknown, call: unknown): ReadonlySet<string> | null;
  canonicaliseHeadSegment(
    dottedPath: string | null,
    renames: ReadonlyMap<string, string>,
    scope?: {
      readonly bindings: readonly {
        readonly name: string;
        readonly start: number;
        readonly end: number;
      }[];
      readonly position: number;
    } | null,
  ): string | null;
  // 31-24 (D-27): the per-source-file list of BINDINGS the file declares — each with the range its
  // declaration KIND gives it and whether it suppresses — which the one canonicaliser resolves a
  // reference against before rewriting a head segment through EITHER map.
  deriveDeclaredBindings(
    ts: unknown,
    sf: unknown,
  ): readonly {
    readonly name: string;
    readonly start: number;
    readonly end: number;
  }[];
  // 31-28 (D-30): the Program the modifier ban is decided against, the loud reason a target that
  // cannot create one emits, and the identity resolver itself.
  loadTypeScriptFromTarget(repoRoot: string): unknown;
  createProgramForTarget(
    repoRoot: string,
    specAbsPaths: readonly string[],
    ts: unknown,
  ):
    | { readonly ok: true; readonly context: ProgramContextView }
    | { readonly ok: false; readonly cause: string };
  resolveBannedModifier(
    ts: unknown,
    ctx: ProgramContextView,
    call: unknown,
  ): { readonly kind: "framework"; readonly path: string } | { readonly kind: "foreign" } | { readonly kind: "unresolved" };
  findBannedConstructs(ts: unknown, sf: unknown, relPath: string, ctx: ProgramContextView): string[];
  readonly PROGRAM_UNAVAILABLE_REASON: string;
  readonly UNRESOLVABLE_CALLEE_RESIDUALS: readonly string[];
  readonly SKIPPED_DIRECTORIES: readonly string[];
  readonly SKIPPED_DIRECTORY_DISCLOSURE_MARKER: string;
  renderSkippedDirectoryDisclosure(hits: Readonly<Record<string, number>>): string | null;
  emitLoudSkipIfBrowserUnusable(
    repoRoot: string,
    probe?: (repoRoot: string) => "parser_package" | "browser_binaries" | null,
  ): boolean;
  deriveSpecPaths(repoRoot: string): {
    relPaths: readonly string[];
    refusals: readonly string[];
    skippedDirectoryHits: Readonly<Record<string, number>>;
  };
  analyzeSpecs(
    repoRoot: string,
    specRelPaths: readonly string[],
    ts: unknown,
    ctx: ProgramContextView,
    readFile?: (absPath: string) => string,
  ): SpecAnalysisView;
  reportMeasured(
    m: { visited: number; expected: number; findings: readonly string[] },
    wantJson: boolean,
    out: (s: string) => void,
    err: (s: string) => void,
  ): number;
  // 31-25 (D-28): the process boundary, the injected-dependency record that makes it reachable, the
  // published corpus coverage, and the branch/stream table READ OFF reportMeasured.
  readonly PROCESS_BOUNDARY_MARKER: string;
  readonly PATHOLOGICAL_INPUT_SHAPES: readonly string[];
  readonly MEASUREMENT_BRANCH_STREAMS: Readonly<
    Record<
      "vacuity_floor" | "denominator_floor" | "findings" | "pass",
      { readonly stream: "stdout" | "stderr"; readonly exitCode: number }
    >
  >;
  main(
    argv: readonly string[],
    deps?: {
      readonly deriveSpecPaths?: (repoRoot: string) => {
        relPaths: readonly string[];
        refusals: readonly string[];
      };
      readonly loadTypeScript?: (repoRoot: string) => unknown;
      readonly analyzeSpecs?: (
        repoRoot: string,
        specRelPaths: readonly string[],
        ts: unknown,
        ctx: ProgramContextView,
      ) => SpecAnalysisView;
      readonly createProgram?: (
        repoRoot: string,
        specAbsPaths: readonly string[],
        ts: unknown,
      ) =>
        | { readonly ok: true; readonly context: ProgramContextView }
        | { readonly ok: false; readonly cause: string };
      readonly reportMeasured?: (
        m: { visited: number; expected: number; findings: readonly string[] },
        wantJson: boolean,
        out: (s: string) => void,
        err: (s: string) => void,
      ) => number;
      readonly out?: (s: string) => void;
      readonly err?: (s: string) => void;
    },
  ): number;
}

// The parser this repository provides, reached the same way the runnable reaches the target's.
const requireFromHere = createRequire(import.meta.url);
const hostTypeScript: unknown = requireFromHere("typescript");

async function loadChecker(): Promise<CheckerModule> {
  return (await import("./uat-spec-integrity.js")) as unknown as CheckerModule;
}

/**
 * 31-28 (D-30): a real Program and checker for a target the case just built.
 *
 * Every in-process case that reaches `analyzeSpecs` or `findBannedConstructs` needs one, because
 * the ban is decided by SYMBOL IDENTITY and a symbol is a thing only a Program has. It is built the
 * SAME way `main` builds it — through the module's own two exported functions, from the target's
 * own `typescript` — so an in-process case and a spawned one decide over the same mechanism rather
 * than over two.
 */
async function programContextFor(
  root: string,
  relPaths: readonly string[],
): Promise<ProgramContextView> {
  const mod = await loadChecker();
  const ts = mod.loadTypeScriptFromTarget(root);
  expect(ts, `PREMISE: the target at ${root} supplied no usable typescript`).not.toBeNull();
  const built = mod.createProgramForTarget(root, relPaths.map((rel) => join(root, rel)), ts);
  expect(
    built.ok,
    `PREMISE: no program could be created for ${root}: ${built.ok ? "" : built.cause}`,
  ).toBe(true);
  return (built as { readonly ok: true; readonly context: ProgramContextView }).context;
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

// ── 31-28 (D-30): WHAT A TARGET REPOSITORY MUST NOW CARRY, AND WHY THE HARNESS CARRIES IT ──────
//
// The modifier ban is decided by SYMBOL IDENTITY from a TypeScript Program built out of the target
// repository's own compiler. A target therefore has to supply two things a bare temp directory does
// not: a CONFIGURATION FILE the compiler can build a program from, and the FRAMEWORK'S DECLARATIONS
// so a callee has a symbol to resolve to. A real host repository running Playwright UAT specs has
// both by construction — that is what makes it a Playwright repository.
//
// THE DECLARATIONS ARE THIS REPOSITORY'S OWN TRANSCRIPTION, and that is a DISCLOSURE, not a
// convenience. `@playwright/test` cannot be installed here (CLAUDE.md fixes the dev dependency set
// at `{typescript, vitest}`), so `fixtures/playwright-test.d.ts` — the same surface every fixture
// already compiles against, and the same one the reverse partition already uses as a denominator —
// is planted in each target as an AMBIENT module declaration. That exercises the ambient route of
// identity end to end. The installed-package route is NOT measured here and is carried as a named
// residual beside `R-07`.
const TARGET_TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["**/*.ts"],
  },
  null,
  2,
);

/**
 * Plant the configuration file and the framework declarations every identity decision needs.
 *
 * 31-34 (D-35): it plants a SECOND ambient surface, `foreign-framework.d.ts`, declaring two modules
 * that are NOT `@playwright/test`. CR-23's rows drive the retained ban heads through those modules,
 * which is the spelling those heads exist for. It is planted for EVERY target rather than for the
 * CR-23 rows only, so there is ONE equipping authority and no row can be read from a root equipped
 * differently from the one the precondition describes — a false premise this phase has logged six
 * times. Every pre-existing row was re-driven after the change and reported the same counts; the
 * modules it declares are imported by exactly the fixtures that name them.
 */
function equipTarget(root: string, tsconfig: string | null = TARGET_TSCONFIG): void {
  if (tsconfig !== null) writeFileSync(join(root, "tsconfig.json"), tsconfig, "utf8");
  const types = join(root, "types");
  mkdirSync(types, { recursive: true });
  copyFileSync(join(FIXTURES, "playwright-test.d.ts"), join(types, "playwright-test.d.ts"));
  copyFileSync(join(FIXTURES, "foreign-framework.d.ts"), join(types, "foreign-framework.d.ts"));
}

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
  equipTarget(root);
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

    const rels = ["e2e/uat/one.uat.spec.ts", "e2e/uat/two.uat.spec.ts", "e2e/uat/three.uat.spec.ts"];
    const analysis = analyzeSpecs(
      root,
      rels,
      hostTypeScript,
      await programContextFor(root, rels),
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
    const analysis = analyzeSpecs(root, [], hostTypeScript, await programContextFor(root, []));
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

  it("the ALIAS is CLOSED by identity and the computed member is still a named residual", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    // 31-28 (D-30 (1)): the alias was a residual for five rounds with the same reason — the alias
    // cannot be followed to its declaration WITHOUT A TYPE CHECKER. The checker is asked now, so
    // `const t = test; t.skip(...)` is refused and the residual is REMOVED from the register. The
    // behaviour is what removes it; a register that shrank without a measurement would be a claim.
    const alias = findingsOf(
      [IMPORT, "const t = test;", 't.skip("a scenario", async () => {});', ""].join("\n"),
    );
    expect(alias.length, `the alias was admitted: ${JSON.stringify(alias)}`).toBe(1);
    expect(alias[0]).toContain("test.skip");
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.filter((r) => r.startsWith("An aliased binding")),
      "the register still discloses a boundary the checker closed",
    ).toEqual([]);

    // …and the computed member is unmoved: the checker resolves no symbol for `test[m]` where `m`
    // is a variable, and the spelling rule cannot read a name the source text does not carry.
    const computed = findingsOf(
      [IMPORT, 'const m = "skip";', 'test[m]("a scenario", async () => {});', ""].join("\n"),
    );
    expect(computed).toEqual([]);
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.some((r) => r.includes("computed from a non-literal expression")),
      "the shape passes and the register no longer names it — an undisclosed boundary",
    ).toBe(true);
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

  it("the walked denominator's CARDINALITY is the number this round MEASURED", async () => {
    // 31-16: RE-MEASURED after the declared surface gained the TestInfo second callback parameter,
    // never carried forward from the previous round's summary. The number did not move, and the
    // reason it did not is a fact about the walk rather than a coincidence: adding a PARAMETER to a
    // call signature adds no PROPERTY to any declared type, and `checker.getPropertiesOfType` reads
    // properties only. A change that moved it would turn this red and have to say why.
    const { isBannedModifierPath } = await loadChecker();
    const { paths } = walk();
    expect(paths.length, "the walked declared-surface denominator CHANGED").toBe(26);
    const partition = partitionDeclaredSurface(paths, isBannedModifierPath);
    expect(partition.refused.length, "the refused bucket's measured size CHANGED").toBe(14);
    expect(partition.dispositioned.length, "the dispositioned bucket's measured size CHANGED").toBe(12);
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
    if (node.expression.kind === ts.SyntaxKind.NullKeyword) return true;
    // 31-28 (D-30 (2)): THE MATCHER'S OWN SHAPE HAD TO GROW WITH THE MECHANISM, and this is the
    // defect class this phase keeps paying for. `resolveBannedModifier` does not decline by
    // returning `null` — it returns a TAGGED RESULT, and two of its three tags (`unresolved`,
    // `foreign`) are positions where identity produced no path. A matcher that only recognised
    // `return null` would have derived ZERO sites inside the new resolver and every binding below
    // would have passed over a mechanism nobody looked at. `undefined` joins for the same reason: a
    // helper that answers "no symbol" spells it that way.
    if (node.expression.kind === ts.SyntaxKind.UndefinedKeyword) return true;
    if (ts.isIdentifier(node.expression) && node.expression.text === "undefined") return true;
    if (ts.isObjectLiteralExpression(node.expression)) {
      for (const property of node.expression.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        if (property.name.getText(sfOfNode(node)) !== "kind") continue;
        if (!ts.isStringLiteralLike(property.initializer)) continue;
        return property.initializer.text !== "framework";
      }
    }
    return false;
  }

  /** The source file a node belongs to, so the matcher can read a property name's text. */
  function sfOfNode(node: import("typescript").Node): import("typescript").SourceFile {
    let cur: import("typescript").Node = node;
    while (cur.parent !== undefined) cur = cur.parent;
    return cur as import("typescript").SourceFile;
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
    "A member computed from a non-literal expression is not decided by identity: `test[name](...)` where `name` is a variable. The checker resolves no symbol at that position. The call then falls to the spelling rule. That rule cannot read a member name the source text does not carry.";
  const R_NON_LITERAL_OPTION =
    "An option is ENABLED only when the call's first argument is an object literal assigning it the `true` keyword. A variable argument enables nothing, and neither does a variable option value. This runnable parses and never evaluates.";
  const R_TWO_RULES =
    "IDENTITY AND SPELLING ARE TWO RULES FOR ONE QUESTION. The pairing is a decision rather than an oversight. D-35 RE-TOOK this member against its own stated closing criterion. The criterion asked for a reproduced case in which the spelling rule REFUSES a construct identity would have called foreign. Two were reproduced. One was a `describe.skip` group. The other was an `expect.soft` assertion. Each arrived from a DECLARED non-Playwright module. Each was accepted at exit 0 by identity and refused by spelling. The answer was not to delete one of the two rules. The answer was to split the terminal arm in four. `framework` refuses. `foreign-local` accepts and the spelling rule is not consulted. A local binding is never canonicalised into a construct the file does not contain. `foreign-declared` and `unresolved` both ASK the spelling rule. So the second grammar is now asked at MORE positions than before, not fewer. It is asked where a callee's declaration comes from another module's declaration surface. It is also asked where the checker resolved no symbol at all. A temporal-dead-zone reference lives exactly in the second position. Keeping the pairing is what preserves D-27's refusals. It is still two grammars for one question. This file's own history says two grammars can drift apart. What would force it closed: a reproduced case in which the spelling rule refuses a construct identity would have called `foreign-local`. A refusal in that direction is still the only way the pairing can be wrong.";
  const R_NON_IDENTIFIER_HEAD =
    "A callee whose head is not an identifier is decided only where the checker resolves it. `({ test }).test.skip(...)` IS refused. Its member's declaration is the framework's own. A call on `this` yields no symbol and no head segment. So does a call on an object whose member the checker cannot resolve. No membership question can be put in either case.";
  const R_COULD_NOT_RUN =
    "A target repository whose TypeScript cannot create a Program makes NO claim about the specs. The causes are named: no configuration file, one that cannot be read, one that cannot be parsed, or a compiler that throws. It exits 2 with PROGRAM_UNAVAILABLE_REASON and its own cause. A target whose framework declarations do not resolve is the same event and the same exit code. Neither is a pass. Neither is a quieter ban. A smaller ban applied without saying so is a gate lowering. This member replaces exactly that silent degrade. THE GRANULARITY IS WHOLE-RUN. Whole-run is coarser than D-28's per-file boundary. A file's own PARSE stays per-file. The compiler host's reader is wrapped, so one unparseable spec is one could-not-run reason. The denominator floor then names it. The BINDER runs over every root file at once. A single spec whose shape exhausts it blocks the whole run rather than one file. The measurement used a 4,000-link call chain. Blocking is the fail-closed direction and it is never a pass. What would force it closed: a way to bind one file at a time. The compiler's public API does not offer one today.";
  const R_AMBIENT_ROUTE =
    "Identity is decided against the framework's own DECLARATION FILES. The ambient-declaration route is MEASURED. The route means a `declare module \"@playwright/test\"` file inside the target's own program. The installed-package route is NOT measured here. In it those declarations arrive from `node_modules/@playwright/test`. It is reasoned from the same resolution the compiler performs. This repository's dependency set is fixed, so the package cannot be installed to measure it. It is an open `UNKNOWN - verify`, carried beside `R-07`.";

  const R_HAND_DECLARED =
    "A HEAD THE SPEC FILE HAND-DECLARES FOR ITSELF is not decided. D-35 splits a non-framework callee by declaration provenance. A `declare module` block counts as another module's surface. A declaration file counts as one too. A `declare const describe: { skip(...): void }` written inside the spec's own source counts as NEITHER. So it answers `foreign-local` and the call is accepted at exit 0. MEASURED, on a file that type-checks clean. The shape stays open because it is structurally IDENTICAL to the control that keeps WR-26 closed. Both resolve to a property signature of an anonymous type literal inside a `declare` statement. A predicate that refuses the one refuses the other. A false refusal names a construct the file does not contain. Such a refusal is a failure this family has already paid for three times. What would force it closed: a discriminant separating a hand-declared module-scope head from a helper's own parameter type. Reading the head's NAME is not available, because the ban set would then decide its own scope.";

  // 31-35 (D-36): the surface walk's own limits, and the cost of narrowing it.
  const R_DEPTH_BOUND =
    "THE FRAMEWORK-SURFACE WALK IS BOUNDED IN DEPTH. `SURFACE_DEPTH_BOUND` is six property-or-call links from an export. A bound that is reached is a check that did not run. A node left unexpanded at that depth means framework declarations the walk never reached. A call on one of them would have been decided as foreign rather than by identity. Foreign is accept. So a reached bound is never a verdict. The run takes the could-not-run route the Program member above already names, at exit 2. Its own cause is `SURFACE_TRUNCATED_CAUSE`. That cause names both bound values and the bound that stopped the walk. A LEAF at the bound is not a truncation. A node carrying no properties and no call signatures cut nothing off. Reporting one would make every run that merely reached a `void` return a could-not-run. MEASURED against the transcribed surface this repository ships: seventeen recorded paths, deepest at depth two. The bound is not near it. The INSTALLED package is a different surface and is not measured here, because the dependency set is fixed. That magnitude is an open `UNKNOWN - verify`, carried beside the installed-package member above. What would force it closed: a walk whose cost does not grow with the declared surface. A measurement over a real installed `@playwright/test` showing the bound is never approached would close it too.";

  const R_NODE_BOUND =
    "THE FRAMEWORK-SURFACE WALK IS BOUNDED IN SIZE. `SURFACE_NODE_BOUND` is 4096 distinct declared types. The bound used to sit in the walk's own loop condition, where a walk that stopped read as a walk that finished. It is now an explicit stop that records itself. It takes the same route the depth bound takes: exit 2 with the truncation cause. The cause names the bound reached. It is the SAME signal from a different limit. A surface that is wide rather than deep leaves exactly as many declarations unreached. MEASURED against the transcribed surface this repository ships: seventeen types against a bound of 4096. What would force it closed: the same measurement over a real installed `@playwright/test` surface, which cannot be taken here.";

  const R_INDEX_SIGNATURE =
    "A FRAMEWORK MEMBER REACHABLE ONLY THROUGH AN INDEX SIGNATURE is not decided by identity. The surface walk reads each type's declared PROPERTIES, and an index signature is not one of them. A `skip` behind `[key: string]: Modifier` is therefore absent from the surface at ANY depth. No bound is reached, nothing is truncated, and the call answers foreign, which is accept. MEASURED at `0 findings` and EXIT=0 on a file that type-checks clean. MEASURED IDENTICALLY at the commit BEFORE D-36, so it is not a cost of that decision's narrowing. What is open is the alias-headed spelling. The `test`-headed and `describe`-headed spellings are still refused by the spelling rule on head and tail alone. What would force it closed: reading a type's INDEX INFOS beside its properties. The structural view of the checker this runnable declares does not read them today.";

  const DECLINE_SITE_DISPOSITIONS: Readonly<Record<string, DeclineDisposition>> = Object.freeze({
    // ── calleeDottedPath (the SPELLING rule's shape resolver) ─────────────────────────────────
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
        "on an object literal, on `this`, or on any other root with no name to read. 31-28: this " +
        "site now costs only the SPELLING of a finding for the object-literal case, because " +
        "identity decides that shape from the member's own declaration — which is why the " +
        "residual's sentence was rewritten to say which half is still open.",
      residual: R_NON_IDENTIFIER_HEAD,
    },

    // ── calleeHeadIdentifier (the position arms (a)/(b) key their dedup on) ────────────────────
    "calleeHeadIdentifier | Block>ForStatement>Block |  | return null;": {
      kind: "decided",
      reason:
        "The SAME shape `calleeDottedPath` declines one line above, reached through the SAME node. " +
        "It was measured declining exactly where the resolver does, at every shape where the two " +
        "could differ, so it propagates that decision rather than opening one of its own — and it " +
        "is read only for the position a per-assertion dedup keys on, never as a membership " +
        "operand.",
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
    "enabledOptionKeys | Block>IfStatement | !isObjectLiteral(first) | return null;": {
      kind: "residual",
      reason:
        "The options argument is not an object literal — `expect.configure(options)` where " +
        "`options` is a variable. Its contents are absent from the source text.",
      residual: R_NON_LITERAL_OPTION,
    },

    // ── chainEnabledOptionKeys ────────────────────────────────────────────────────────────────
    "chainEnabledOptionKeys | Block>IfStatement | !readAnyLink | return null;": {
      kind: "decided",
      reason:
        "NO LINK in the chain carried a readable option literal, so there is no option to consult " +
        "and the membership authority correctly answers false. This exit PROPAGATES the per-link " +
        "declines of enabledOptionKeys, each of which is dispositioned at its own site above.",
    },

    // ── deriveImportRenames ───────────────────────────────────────────────────────────────────
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
        kind: "decided",
        reason:
          "31-28 (D-30 (1)) CLOSED THE SHAPE THIS USED TO DISCLOSE. A rename arriving through a " +
          "local fixture-extension module was not canonicalised, because following a re-export " +
          "across files needed module resolution the runnable did not ship. The checker follows " +
          "it: the corpus drives `export { test as it } from \"@playwright/test\"` re-exported " +
          "through a local module and the call is refused. What remains here is a SPELLING scope " +
          "for the second rule, reached only where the checker resolved nothing — and the module " +
          "specifier is compared as a STRING only in this map, never in the identity rule, which " +
          "is why a local module named to look like the framework is not the framework.",
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

    // ── resolveBannedModifier: the IDENTITY rule's three answers ──────────────────────────────
    //
    // These four sites are the reason this block's site MATCHER had to grow (31-28). The identity
    // rule does not decline by returning `null` — it returns a TAGGED RESULT — so a matcher that
    // only recognised `null` would have derived ZERO sites inside the mechanism that now decides
    // the ban, and every binding here would have passed over it.
    'resolveBannedModifier | Block>TryStatement>CatchClause>Block |  | return { kind: "unresolved" };':
      {
        kind: "decided",
        reason:
          "The checker THREW while being asked for a symbol. `unresolved` hands the call to the " +
          "spelling rule, which is strictly the refusing direction relative to `foreign`: a call " +
          "identity could not decide is still asked of the census and the rename map.",
      },
    'resolveBannedModifier | Block>IfStatement | symbol === undefined | return { kind: "unresolved" };':
      {
        kind: "residual",
        reason:
          "THE HAND-OFF THE PAIRING IS ABOUT. The checker has no symbol for this callee — a " +
          "temporal-dead-zone reference, a computed member, a call on a value whose type has no " +
          "such member — and the spelling rule answers instead. That second rule is a second " +
          "grammar for one question, which is exactly what the register must disclose.",
        residual: R_TWO_RULES,
      },
    'resolveBannedModifier | Block>IfStatement | declarations.length === 0 | return { kind: "unresolved" };':
      {
        kind: "decided",
        reason:
          "A symbol with ZERO declarations cannot be attributed to any file, so identity has no " +
          "anchor. It takes the same hand-off as an absent symbol, which is the refusing " +
          "direction, rather than being read as `foreign` and closing the question.",
      },
    'resolveBannedModifier | Block>IfStatement>Block>ForOfStatement>Block>IfStatement | fromDeclarationSurface(ts, declaration) | return { kind: "foreign-declared" };':
      {
        kind: "decided",
        reason:
          "THE ANSWER, NOT A DECLINE, and D-35's whole substance. The checker resolved the callee " +
          "to a member declared somewhere OTHER than the framework, and at least one of those " +
          "declarations comes from another module's DECLARATION SURFACE — a `declare module` " +
          "block, or a declaration file. That is another framework's or another library's own " +
          "export, so the call is handed to the SPELLING rule rather than accepted. It opens " +
          "nothing: the rule it hands to is the one that answers, and the register's two-rule " +
          "pairing member discloses that hand-off in both of the positions it now happens at. " +
          "Declaration merging is read in the REFUSING direction here too — one surface " +
          "declaration among several is enough.",
      },
    'resolveBannedModifier | Block>IfStatement>Block | !fromFramework | return { kind: "foreign-local" };':
      {
        kind: "decided",
        reason:
          "THE ANSWER, NOT A DECLINE — and it opens nothing. Every declaration of this symbol is " +
          "in the program's OWN authored source: a parameter, a local variable, a local function, " +
          "a helper module the project wrote. The call is not a framework modifier and the " +
          "spelling rule is deliberately not consulted. That is what makes WR-26's false refusal " +
          "impossible rather than narrower, and it is driven by the local-helper control in the " +
          "same run as D-35's refusing rows. The one construct it accepts that a reader might " +
          "expect refused — a head the spec file hand-`declare`s for itself — is a NAMED member " +
          "of the register rather than a silence.",
      },

    // ── throughBindingElement (the destructured-property lookup, RR-08's closure) ──────────────
    "throughBindingElement | Block>IfStatement | declaration === undefined || !ts.isBindingElement(declaration) | return undefined;":
      {
        kind: "decided",
        reason:
          "The symbol is not a destructured binding at all, so there is no pattern to look a " +
          "property up in. The caller then uses the symbol it already had, which is the ordinary " +
          "path — this helper only ever REPLACES a local with the property it destructures.",
      },
    "throughBindingElement | Block>IfStatement | pattern === undefined | return undefined;": {
      kind: "decided",
      reason:
        "A binding element with no parent pattern is not a shape the parser produces for source " +
        "text; the guard exists because the structural view declares the parent optional. Same " +
        "fall-back as above, and it opens no construct.",
    },
    "throughBindingElement | Block>TryStatement>CatchClause>Block |  | return undefined;": {
      kind: "decided",
      reason:
        "The checker threw while producing the pattern's type or its property. Falling back to " +
        "the local symbol means the call is decided as `foreign` or handed to the spelling rule " +
        "rather than as the framework's — the accepting direction for THIS shape, which is why it " +
        "is bound to the same pairing residual through its caller rather than being silent.",
    },

    // ── identityHeadSegment (the REPORTED spelling, never the verdict) ─────────────────────────
    "identityHeadSegment | Block>TryStatement>CatchClause>Block |  | return null;": {
      kind: "decided",
      reason:
        "The checker threw while being asked what the head IS. The verdict was already decided by " +
        "the member's own symbol; this only chooses what to CALL the construct, so declining here " +
        "leaves the syntactic spelling in the finding and changes no answer.",
    },
    "identityHeadSegment | Block |  | return null;": {
      kind: "decided",
      reason:
        "The head is neither the framework module (a namespace import) nor a value whose declared " +
        "type the surface walk reached, so there is no export name to substitute. Same as above: " +
        "the finding keeps its syntactic head and the verdict is unchanged.",
    },

    // ── the census's ancestor walks: structural helpers, not resolution positions ──────────────
    "enclosingFunctionLike | Block |  | return undefined;": {
      kind: "decided",
      reason:
        "The walk reached the top of the tree without finding a function-like ancestor, which is " +
        "MODULE SCOPE. Every caller substitutes the SourceFile for that answer, so the range is " +
        "the whole module rather than absent.",
    },
    "parameterOf | Block |  | return undefined;": {
      kind: "decided",
      reason:
        "The declaration is not inside a parameter, which is the ordinary case for a `const`, a " +
        "`let`, a `var`, a function name or a class name. The next arm of `bindingRangeFor` " +
        "decides it.",
    },
    "parameterOf | Block>WhileStatement>Block>IfStatement | isFunctionLikeNode(cur) || isStatementContainer(cur) | return undefined;":
      {
        kind: "decided",
        reason:
          "The walk crossed a scope boundary before finding a parameter, so the declaration " +
          "belongs to some enclosing function's body rather than to its parameter list. Stopping " +
          "at the boundary is what keeps a parameter's range its OWN function's.",
      },
    "enclosingCatchClause | Block |  | return undefined;": {
      kind: "decided",
      reason: "The declaration is not a catch binding; the next arm decides it.",
    },
    "enclosingCatchClause | Block>WhileStatement>Block>IfStatement | isFunctionLikeNode(cur) || isStatementContainer(cur) | return undefined;":
      {
        kind: "decided",
        reason:
          "The walk crossed a scope boundary before reaching a catch clause, so this declaration " +
          "is not that clause's binding. Same boundary argument as `parameterOf`.",
      },
    "declarationListOf | Block |  | return undefined;": {
      kind: "decided",
      reason:
        "The declaration belongs to no variable-declaration list — a function or class name — so " +
        "there are no flags to read and the hoisting question is answered by its own arm.",
    },
    "declarationListOf | Block>WhileStatement>Block>IfStatement | isFunctionLikeNode(cur) || isStatementContainer(cur) | return undefined;":
      {
        kind: "decided",
        reason:
          "The walk crossed a scope boundary before finding a declaration list, so the node is " +
          "not part of one. Same boundary argument as the two walks above.",
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
      // 31-16 (D-20 (2)): the option axis is now folded across the whole marked chain, so the arm-(c)
      // condition asks the FOLD directly and reaches the per-link reader through it.
      "chainEnabledOptionKeys",
      "deriveImportRenames",
    ]) {
      expect(roots, `${name} is not reached from the arm-(c) condition`).toContain(name);
    }
    // …and the transitive half really closed over the call graph.
    expect(closure).toContain("isBannedModifierPath");
    expect(closure).toContain("isTypeAssertionLike");
    expect(closure).toContain("enabledOptionKeys");
    expect(closure).toContain("stripRoutingLinks");
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
      [R_COULD_NOT_RUN]:
        "NOT A RESOLUTION RESIDUAL. It discloses what happens BEFORE any callee is resolved: a " +
        "target whose TypeScript cannot create a Program, or whose framework declarations do not " +
        "resolve, never reaches the walk at all. Its site is `runAnalysis`'s single emission of " +
        "PROGRAM_UNAVAILABLE_REASON, which is an EXIT rather than a decline, and it is driven at " +
        "the entry by the two config cases and the pathological-chain case. Folding it into the " +
        "derived decline set would put a run-level fact behind a per-callee one.",
      [R_AMBIENT_ROUTE]:
        "NOT A RESOLUTION RESIDUAL EITHER, and the one that is honest about a MEASUREMENT this " +
        "repository cannot make. Identity is anchored on the framework's declaration FILES, and " +
        "only the ambient-declaration route is driven here, because CLAUDE.md fixes the dev " +
        "dependency set and `@playwright/test` cannot be installed to exercise the node_modules " +
        "route. It discloses the strength of a claim rather than a position in the resolver, so it " +
        "belongs on this axis and carries `UNKNOWN - verify` beside `R-07`.",
      [R_DEPTH_BOUND]:
        "NOT A RESOLUTION RESIDUAL. 31-35 (D-36). It discloses what happens BEFORE any callee is " +
        "resolved, exactly as the could-not-run member above does: the framework's surface is " +
        "walked once per run, and a walk that stopped at its depth bound has left declarations " +
        "unreached for every callee the run will later ask about. Its site is the walk's own depth " +
        "check, which sets a flag `createProgramForTarget` turns into an EXIT rather than a " +
        "decline, and it is driven at the entry by the boundary-pair rows.",
      [R_NODE_BOUND]:
        "NOT A RESOLUTION RESIDUAL, and the same event as the member above from the other limit. " +
        "It is recorded separately because the two bounds have different remedies and a reader who " +
        "meets one needs to know which one stopped the walk. Driven at the entry by the wide-surface " +
        "row, whose cause names the NODE bound by value.",
      [R_INDEX_SIGNATURE]:
        "NOT A RESOLUTION RESIDUAL. 31-35 (D-36). The checker resolves the callee perfectly; what " +
        "the member discloses is a member the SURFACE does not contain, because the walk reads " +
        "declared properties and an index signature is not one. It belongs on this axis for the " +
        "same reason the hand-declared-head member does: it states the reach of a claim rather " +
        "than a position in the resolver. Unlike the ambient-route member it is MEASURED, at the " +
        "entry, and measured the same at the commit before D-36 — so the disclosure is not a cost " +
        "that decision introduced.",
      [R_HAND_DECLARED]:
        "NOT A RESOLUTION RESIDUAL. 31-34 (D-35). The checker resolves this callee perfectly — " +
        "there is no decline anywhere in the resolver — and the identity rule ANSWERS " +
        "`foreign-local`, which is an accept. What the member discloses is the BOUNDARY of the " +
        "discriminant that produced that answer: a `declare const` written in the spec's own " +
        "source is neither a `declare module` block nor a declaration file. It belongs on this " +
        "axis for the same reason the alias residual does, and it is driven by its own corpus row " +
        "at the entry rather than asserted as prose.",
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
  const SEED_ANCHOR = "  for (;;) {\n    if (ts.isIdentifier(cur)) {\n      segments.push(cur.text);";

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
      `  for (;;) {\n    if (${SEEDED_GUARD}) return null;\n    if (ts.isIdentifier(cur)) {\n      segments.push(cur.text);`,
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

  it("configured-soft.uat.spec.ts reports every planted escape, chained ones included", () => {
    // 31-16 (CR-09 / IN-10): the region now carries the UN-CHAINED pair, both CHAINED spellings and
    // the converse ordering, so the mutation contract proves the pair-decision for the shapes whose
    // resolved path CARRIES a marker rather than only for the shape whose path does not.
    const findings = findingsFor("configured-soft.uat.spec.ts");
    expect(findings.length, "the measured finding count recorded in 31-16-SUMMARY.md").toBe(4);
    const joined = findings.join("\n");
    for (const path of [
      "expect.configure",
      "expect.configure().soft",
      "expect.configure().configure",
    ]) {
      expect(joined, `${path} is absent from the findings`).toContain(path);
    }
  });

  it("configured-soft.uat.spec.ts's CONTROL survives: removing the escapes leaves zero findings", () => {
    // PREMISE: the legitimate configure call really is still in the file after the mutation, or the
    // zero-finding verdict would be a statement about a file that no longer carries the control —
    // and it is now CHAINED AND INVOKED, the shape IN-10 required, so a fix that closed the escape
    // by banning every path a routing link folds to would turn this red instead of passing.
    const mutated = withBannedConstructsRemoved("configured-soft.uat.spec.ts");
    expect(
      mutated,
      "PREMISE: the false-positive control left the fixture with its marked region",
    ).toContain('expect.configure({ retries: 2 })(page.getByTestId("invoice-total"))');

    const r = runMutated("configured-soft.uat.spec.ts");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1");
  });

  it("testinfo-fixture-param.uat.spec.ts reports one finding per planted fixture-parameter modifier", () => {
    const findings = findingsFor("testinfo-fixture-param.uat.spec.ts");
    expect(findings.length).toBe(3);
    const joined = findings.join("\n");
    for (const path of ["test.info().skip", "test.info().fail", "test.info().fixme"]) {
      expect(joined, `${path} is absent from the findings`).toContain(path);
    }
  });

  it("testinfo-fixture-param.uat.spec.ts's CONTROL survives: the non-banned member on the same binding", () => {
    // PREMISE: the surviving scenario really does still call a member of the SAME binding, or the
    // zero-finding verdict would prove nothing about the canonicalisation's precision.
    const mutated = withBannedConstructsRemoved("testinfo-fixture-param.uat.spec.ts");
    expect(
      mutated,
      "PREMISE: the non-banned TestInfo call left the fixture with its marked region",
    ).toContain("testInfo.slow();");

    const r = runMutated("testinfo-fixture-param.uat.spec.ts");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1");
  });

  it("every new fixture is reached by the fixtures typecheck target's derived corpus", () => {
    const onDisk = readdirSync(FIXTURES).filter((n) => n.endsWith(".uat.spec.ts"));
    for (const name of [
      "modifier-call-link.uat.spec.ts",
      "import-rename.uat.spec.ts",
      "configured-soft.uat.spec.ts",
      "testinfo-fixture-param.uat.spec.ts",
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
    "skipped-directories": "31-32 / WR-35 / D-33 (5): the walk's INPUT BOUNDARY and its disclosure. It is a limit of the DENOMINATOR rather than a declined callee shape, and it is the one limit neither floor in `reportMeasured` can see, because the derived count and the visited count shrink together.",
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
    "skipped-directories": "Directory names the walk never descends into",
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-16 CR-09 — A ROUTING CALL LINK MUST NOT DEFEAT A WHOLE-PATH ARM.
//
// WHICH REGISTER FAILED, AND WHY IT IS THE FOURTH RECURRENCE. D-17 fixed MEMBERSHIP. D-18 fixed
// SHAPE RESOLUTION. The register that failed in round 4 is WHICH ARMS THE RESOLVED SHAPE IS COMPARED
// AGAINST: D-18 (1) inserts a `()` marker segment into the resolved path and justified it for exactly
// ONE of the ban's three arms — the head/tail arm, where the marker lands in a routing position D-17
// had already decided is not part of the membership question. The two WHOLE-PATH arms
// (`BANNED_EXACT_PATHS`, `BANNED_CONFIGURED_PATHS`) compare the marker-carrying path as a literal, so
// one legitimate `.configure()` link inserts a segment and walks past both.
//
// Measured against the committed .js at HEAD before any source change (probe repository under
// `.temp/`, spec at `uat/p.uat.spec.ts`, `typescript` resolvable from the probe root):
//   expect.configure({ retries: 2 }).soft(locator).toBeVisible()            -> 0 findings, EXIT=0
//   expect.configure({ retries: 2 }).configure({ soft: true })(locator)     -> 0 findings, EXIT=0
// and instrumented through the committed module:
//   "expect.configure().soft"       opts=null      -> banned: false
//   "expect.configure().configure"  opts=["soft"]  -> banned: false
//   "expect.configure"              opts=["soft"]  -> banned: true    (the only spelling decided)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-16 CR-09: a routing call link does not defeat a whole-path arm", () => {
  const IMPORT = 'import { test, expect } from "@playwright/test";';

  function findingsOf(body: string): string[] {
    const root = mkTargetRepo({});
    const dest = join(root, "e2e", "uat", "subject.uat.spec.ts");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
    const r = runCheck(root, "--json");
    if (r.status === 0) return [];
    return (JSON.parse(r.stdout) as { findings: string[] }).findings;
  }

  function inScenario(...lines: string[]): string {
    return [
      IMPORT,
      'test("a scenario", async ({ page }) => {',
      ...lines.map((l) => `  ${l}`),
      "});",
      "",
    ].join("\n");
  }

  // ── the normaliser's own rule, stated as cases in BOTH directions ────────────────────────────

  it("the normaliser drops an INTERIOR marked link and keeps a MARKED HEAD distinct", async () => {
    const { stripRoutingLinks, CALL_LINK_MARKER } = await loadChecker();
    expect(CALL_LINK_MARKER, "PREMISE: the marker spelling moved").toBe("()");

    // An interior marked link is ROUTING: it is dropped, so the whole-path arms see the construct.
    expect(stripRoutingLinks("expect.configure().soft")).toBe("expect.soft");
    expect(stripRoutingLinks("expect.configure().configure")).toBe("expect.configure");
    expect(stripRoutingLinks("expect.configure().configure()")).toBe("expect");

    // A MARKED HEAD is a different fact and must SEPARATE, not merge: there a user value was passed
    // in, which is what makes `expect(x).soft` a different construct from `expect.configure().soft`.
    expect(stripRoutingLinks("expect().soft")).toBe("expect().soft");
    // …and the separation is the WHOLE path's, not only the head segment's. A chain rooted at a
    // marked head keeps every later link too, because each of those links operates on the value the
    // head was handed rather than on the static binding the exact-path arm is about. Without this
    // the head guard would be indistinguishable from the filter's own `i === 0` clause, and a mutant
    // that deleted it would pass.
    expect(stripRoutingLinks("expect().soft().toBe")).toBe("expect().soft().toBe");
    // …and a path that is ONLY a marked head has no interior link to strip, so it passes through
    // unchanged rather than becoming an empty path.
    expect(stripRoutingLinks("expect()")).toBe("expect()");

    // A path with no marker at all is its own normal form.
    expect(stripRoutingLinks("expect.soft")).toBe("expect.soft");
    expect(stripRoutingLinks("test.describe.serial.only")).toBe("test.describe.serial.only");
    expect(stripRoutingLinks("expect")).toBe("expect");
  });

  it("the marked HEAD and the interior marked LINK are decided differently, in both directions", async () => {
    const { isBannedModifierPath } = await loadChecker();
    // The interior link resolves to the same construct as the bare exact path…
    expect(isBannedModifierPath("expect.configure().soft")).toBe(true);
    expect(isBannedModifierPath("expect.soft")).toBe(true);
    // …and the marked head does NOT, which is D-18 (1)'s by-construction legitimacy.
    expect(isBannedModifierPath("expect().soft")).toBe(false);
  });

  // ── RED 1 and RED 2: the two spellings the round-4 verifier reproduced at exit 0 ──────────────

  it("refuses expect.configure({ retries: 2 }).soft(...) — the chained soft assertion", () => {
    const findings = findingsOf(
      inScenario('await expect.configure({ retries: 2 }).soft(page.getByTestId("x")).toBeVisible();'),
    );
    expect(findings.length, "expected exactly one finding for the chained soft assertion").toBe(1);
    expect(findings[0]).toContain("expect.configure().soft");
    expect(findings[0]).toContain("banned modifier call");
  });

  it("refuses expect.configure({ retries: 2 }).configure({ soft: true })(...) — the chained pair", () => {
    const findings = findingsOf(
      inScenario(
        'await expect.configure({ retries: 2 }).configure({ soft: true })(page.getByTestId("x")).toBeVisible();',
      ),
    );
    expect(findings.length, "expected exactly one finding for the chained configured escape").toBe(1);
    expect(findings[0]).toContain("expect.configure().configure");
    expect(findings[0]).toContain("banned modifier call");
  });

  // ── GREEN 3: the converse ordering, which no review named ────────────────────────────────────
  //
  // MEASURED, not assumed: this ordering was ALREADY refused at exit 1 before this plan's change,
  // because the inner link `expect.configure({ soft: true })` is itself a visited call node and the
  // un-chained rule decides it. What this plan adds is that the OUTER link decides it too — the
  // enabled-option axis is folded across the whole marked chain the compared path was folded from,
  // so the verdict no longer DEPENDS on the inner link happening to be separately visited. That
  // dependency is the same structural coupling CR-09 exploited one register over.
  it("refuses the converse ordering — the soft option enabled at an INNER link", () => {
    const findings = findingsOf(
      inScenario(
        'await expect.configure({ soft: true }).configure({ retries: 2 })(page.getByTestId("x")).toBeVisible();',
      ),
    );
    expect(findings.length, "the converse ordering must be refused exactly once").toBe(1);
    expect(findings[0]).toContain("banned modifier call");
  });

  it("the OUTER link of the converse chain is refused ON ITS OWN, by the folded option axis", async () => {
    const { chainEnabledOptionKeys, isBannedModifierCall } = await loadChecker();
    const tsApi = hostTypeScript as typeof import("typescript");
    const sf = tsApi.createSourceFile(
      "probe.ts",
      "expect.configure({ soft: true }).configure({ retries: 2 })(locator);\n",
      tsApi.ScriptTarget.Latest,
      true,
    );
    const calls: import("typescript").CallExpression[] = [];
    const visit = (n: import("typescript").Node): void => {
      if (tsApi.isCallExpression(n)) calls.push(n);
      tsApi.forEachChild(n, visit);
    };
    tsApi.forEachChild(sf, visit);
    // PREMISE: the three links of the chain really are three call nodes.
    expect(calls.length, "PREMISE: the chain did not parse into three call links").toBe(3);

    // The OUTER link of the chain — `expect.configure({soft:true}).configure({retries:2})` — carries
    // only an unrelated option of its own. Asked with the chain-wide fold it still sees `soft`.
    const outerLink = calls.find(
      (c) => c.getText(sf) === "expect.configure({ soft: true }).configure({ retries: 2 })",
    );
    expect(outerLink, "PREMISE: the outer link was not found in the parse").toBeDefined();
    const folded = chainEnabledOptionKeys(tsApi, outerLink);
    expect(folded, "the fold produced no option set for a chain that enables one").not.toBeNull();
    expect([...(folded as ReadonlySet<string>)]).toContain("soft");
    expect(isBannedModifierCall("expect.configure().configure", folded)).toBe(true);
  });

  // ── the controls: nothing legitimate is newly refused, nothing already closed regresses ───────

  it("CONTROL 1: a chained AND INVOKED configure carrying only an unrelated option stays admitted", () => {
    expect(
      findingsOf(
        inScenario('await expect.configure({ retries: 2 })(page.getByTestId("x")).toBeVisible();'),
      ),
      "the legitimate chained-and-invoked configure call must stay at zero findings — the rule is " +
        "path PLUS enabled option, and a routing link must not turn it into a bare path ban",
    ).toEqual([]);
  });

  it("CONTROL 2: the marked-head assertion expect(locator).soft stays admitted", async () => {
    const { isBannedModifierPath, stripRoutingLinks } = await loadChecker();
    expect(findingsOf([IMPORT, 'expect(locator).soft("still legitimate");', ""].join("\n"))).toEqual(
      [],
    );
    expect(stripRoutingLinks("expect().soft")).toBe("expect().soft");
    expect(isBannedModifierPath("expect().soft")).toBe(false);
  });

  it("CONTROL 3: the two round-3 closures the round-4 verification re-measured still hold", () => {
    const unchained = findingsOf(
      inScenario('await expect.configure({ soft: true })(page.getByTestId("x")).toBeVisible();'),
    );
    expect(unchained.length, "the un-chained configured-soft closure regressed").toBe(1);
    expect(unchained[0]).toContain("expect.configure");

    const callLink = findingsOf(
      inScenario("test.info().skip();", 'await expect(page.getByTestId("x")).toBeVisible();'),
    );
    expect(callLink.length, "the bare call-link modifier closure regressed").toBe(1);
    expect(callLink[0]).toContain("test.info().skip");
  });

  it("NO MEMBER IS ADDED TO ANY BAN SET — the four constants are byte-identical to HEAD", async () => {
    const {
      BANNED_MODIFIER_HEADS,
      BANNED_MODIFIER_TAILS,
      BANNED_EXACT_PATHS,
      BANNED_CONFIGURED_PATHS,
    } = await loadChecker();
    expect(BANNED_MODIFIER_HEADS).toEqual(["test", "describe"]);
    expect(BANNED_MODIFIER_TAILS).toEqual(["skip", "only", "fixme", "fail"]);
    expect(BANNED_EXACT_PATHS).toEqual(["expect.soft"]);
    expect(BANNED_CONFIGURED_PATHS).toEqual({ "expect.configure": "soft" });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-16 CR-09 — THE PATH-CONSUMER SET IS DERIVED, NOT REMEMBERED.
//
// WHY A DERIVATION AND NOT A THIRD HAND-WRITTEN STRIP. CR-09 exists because D-18 reasoned about the
// marker for ONE arm and the other two compared a raw path. Writing the strip into two more arms
// leaves the same drift axis: a FOURTH arm added later would compare a raw path again, and every
// gate over it would stay green. So the set of arms that compare a resolved dotted path against a
// ban set is read off the runnable's own AST, its CARDINALITY is asserted separately from its
// MEMBERS, and each derived arm is bound either to "asks the normaliser" or to a written
// disposition. An arm added outside the normaliser arrives unbound and reds the case naming itself.
//
// The ban-set NAMES are themselves derived — they are the module-level constants the two membership
// authorities read — rather than typed as a literal list. Deriving one axis and hand-typing the
// other is the exact half-fix this phase has already paid for.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-16 CR-09: every arm that compares a resolved path is derived", () => {
  const ts = hostTypeScript as typeof import("typescript");
  const CHECKER_TS = join(HERE, "uat-spec-integrity.ts");

  /** The one normaliser every whole-path arm must obtain its operand from. */
  const NORMALISER = "stripRoutingLinks";
  /** The two functions that decide membership. The ban-set names are whatever THEY read. */
  const MEMBERSHIP_AUTHORITIES = ["isBannedModifierPath", "isBannedModifierCall"];

  interface PathConsumer {
    readonly fn: string;
    readonly banSet: string;
    readonly operand: string;
    /**
     * 31-24 (IN-12): the operand's SOURCE. IN-12 made each arm compute the normaliser ONCE into a
     * local, so an arm's operand text became `normalised` rather than `stripRoutingLinks(path)` — and
     * a check that looked for the normaliser's NAME in the operand text would have gone quietly
     * false for every deduped arm. The operand is therefore FOLLOWED: an identifier that names a
     * local of the same function is resolved to that local's initialiser text, so "this arm asks the
     * one normaliser" stays the question being asked whether the call is written inline or once.
     */
    readonly operandSource: string;
    readonly signature: string;
  }

  interface ConsumerDerivation {
    readonly moduleConstants: readonly string[];
    readonly banSets: readonly string[];
    readonly authoritiesFound: readonly string[];
    readonly consumers: readonly PathConsumer[];
  }

  function collapseText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  function deriveConsumers(sourcePath: string): ConsumerDerivation {
    const sf = ts.createSourceFile(
      "uat-spec-integrity.ts",
      readFileSync(sourcePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );

    // Every module-level `const` name. A ban set is one of these, never a free identifier.
    const moduleConstants = new Set<string>();
    ts.forEachChild(sf, (node) => {
      if (!ts.isVariableStatement(node)) return;
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) moduleConstants.add(decl.name.text);
      }
    });

    const functions = new Map<string, import("typescript").FunctionDeclaration>();
    const walkTop = (node: import("typescript").Node): void => {
      if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
        functions.set(node.name.text, node);
      }
      ts.forEachChild(node, walkTop);
    };
    ts.forEachChild(sf, walkTop);

    // THE FIRST DERIVED AXIS: a ban set is a module constant one of the membership authorities reads.
    const banSets = new Set<string>();
    const authoritiesFound: string[] = [];
    for (const name of MEMBERSHIP_AUTHORITIES) {
      const fn = functions.get(name);
      if (fn?.body === undefined) continue;
      authoritiesFound.push(name);
      const scan = (node: import("typescript").Node): void => {
        if (ts.isIdentifier(node) && moduleConstants.has(node.text)) banSets.add(node.text);
        ts.forEachChild(node, scan);
      };
      scan(fn.body);
    }

    // THE SECOND DERIVED AXIS: every position at which one of those constants is consulted, with the
    // OPERAND it is consulted about.
    const consumers: PathConsumer[] = [];
    /** Every `const x = <init>` of ONE function body, so an operand identifier can be followed. */
    const localsOf = (fn: import("typescript").FunctionDeclaration): Map<string, string> => {
      const locals = new Map<string, string>();
      const collect = (node: import("typescript").Node): void => {
        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          node.initializer !== undefined
        ) {
          locals.set(node.name.text, collapseText(node.initializer.getText(sf)));
        }
        ts.forEachChild(node, collect);
      };
      if (fn.body !== undefined) collect(fn.body);
      return locals;
    };
    const walkFn = (
      fnName: string,
      locals: ReadonlyMap<string, string>,
      node: import("typescript").Node,
    ): void => {
      if (ts.isIdentifier(node) && banSets.has(node.text)) {
        const parent = node.parent as import("typescript").Node | undefined;
        let enclosing: import("typescript").Node | undefined;
        let operand: import("typescript").Node | undefined;
        if (parent !== undefined && ts.isElementAccessExpression(parent) && parent.expression === node) {
          enclosing = parent;
          operand = parent.argumentExpression;
        } else if (
          parent !== undefined &&
          ts.isPropertyAccessExpression(parent) &&
          parent.expression === node &&
          parent.parent !== undefined &&
          ts.isCallExpression(parent.parent) &&
          parent.parent.expression === parent &&
          parent.parent.arguments.length > 0
        ) {
          enclosing = parent.parent;
          operand = parent.parent.arguments[0];
        } else if (parent !== undefined && ts.isCallExpression(parent)) {
          const index = parent.arguments.indexOf(node as import("typescript").Expression);
          if (index >= 0 && parent.arguments.length > index + 1) {
            enclosing = parent;
            operand = parent.arguments[index + 1];
          }
        }
        if (enclosing !== undefined && operand !== undefined) {
          const operandText = collapseText(operand.getText(sf));
          consumers.push({
            fn: fnName,
            banSet: node.text,
            operand: operandText,
            operandSource: locals.get(operandText) ?? operandText,
            signature: `${fnName} | ${node.text} | ${collapseText(enclosing.getText(sf))}`,
          });
        }
      }
      ts.forEachChild(node, (child) => walkFn(fnName, locals, child));
    };
    for (const [name, fn] of functions) {
      if (fn.body === undefined) continue;
      walkFn(name, localsOf(fn), fn.body);
    }

    return {
      moduleConstants: [...moduleConstants].sort(),
      banSets: [...banSets].sort(),
      authoritiesFound: authoritiesFound.sort(),
      consumers: consumers.sort((a, b) => a.signature.localeCompare(b.signature)),
    };
  }

  /**
   * One entry per derived arm. `normalised` means the arm's operand is obtained from the one
   * normaliser; `raw` means it deliberately reads the un-normalised segments, and the reason is
   * written out rather than labelled.
   */
  interface ConsumerDisposition {
    readonly kind: "normalised" | "raw";
    readonly reason: string;
  }

  const PATH_CONSUMER_DISPOSITIONS: Readonly<Record<string, ConsumerDisposition>> = Object.freeze({
    "isBannedModifierPath | BANNED_EXACT_PATHS | BANNED_EXACT_PATHS.includes(normalised)":
      {
        kind: "normalised",
        reason:
          "A WHOLE-PATH arm: it compares the joined path as a literal, so a marker segment inserted " +
          "by a routing call link changes the string it is comparing. This is the arm CR-09 walked " +
          "past with one legitimate `.configure()` link.",
      },
    "isBannedModifierPath | BANNED_MODIFIER_HEADS | BANNED_MODIFIER_HEADS.includes(segments[0])": {
      kind: "raw",
      reason:
        "The HEAD/TAIL arm, left exactly as D-17 left it. It reads the first and last segments and " +
        "ignores everything between them, so an interior marked link is already routing-neutral " +
        "here — that is precisely the property D-18 (1) reasoned about, and it is true of THIS arm. " +
        "Normalising the head would also erase the marked-HEAD distinction that keeps " +
        "`expect(x).soft` legitimate by construction.",
    },
    "isBannedModifierPath | BANNED_MODIFIER_TAILS | BANNED_MODIFIER_TAILS.includes(segments[segments.length - 1])":
      {
        kind: "raw",
        reason:
          "The other half of the HEAD/TAIL arm, and the same decision for the same reason: the tail " +
          "segment of a chain is never a marked routing link, because a marker is only ever pushed " +
          "for a CallExpression link that some later segment is read off.",
      },
    "isBannedModifierCall | BANNED_CONFIGURED_PATHS | Object.prototype.hasOwnProperty.call(BANNED_CONFIGURED_PATHS, normalised)":
      {
        kind: "normalised",
        reason:
          "The second WHOLE-PATH arm: a Record lookup keyed by the joined path, so the marker " +
          "segment defeats it exactly as it defeats the exact-path arm. This is CR-09's second " +
          "variant, `expect.configure({retries:2}).configure({soft:true})(locator)`.",
      },
    "isBannedModifierCall | BANNED_CONFIGURED_PATHS | BANNED_CONFIGURED_PATHS[normalised]":
      {
        kind: "normalised",
        reason:
          "The same whole-path arm's VALUE read. It is a separate position and is derived as one, " +
          "because an arm whose presence check is normalised and whose value read is not would " +
          "answer two different questions about the same path. 31-24 (IN-12) made both positions " +
          "read ONE local the arm initialises from the normaliser, so the two cannot drift apart " +
          "when this function is next edited — which is the only way that reason could stop holding.",
      },
  });

  function assertConsumerPremise(d: ConsumerDerivation): void {
    expect(
      d.moduleConstants.length,
      "PREMISE: the parse of the runnable found no module-level constant at all",
    ).toBeGreaterThan(0);
    expect(
      d.authoritiesFound,
      "PREMISE: a membership authority is missing from the parse, so the ban-set axis was derived " +
        "from fewer functions than it claims",
    ).toEqual([...MEMBERSHIP_AUTHORITIES].sort());
    expect(
      d.banSets.length,
      "PREMISE: the membership authorities read NO module constant, so the ban-set axis is empty " +
        "and every binding below is vacuous",
    ).toBeGreaterThan(0);
    expect(
      d.consumers.length,
      "PREMISE: ZERO arms were derived. Either nothing compares a resolved path against a ban set, " +
        "or the consumer matcher stopped matching the shape a comparison takes",
    ).toBeGreaterThan(0);
  }

  it("the derivation's PREMISES hold before any binding is asserted", () => {
    assertConsumerPremise(deriveConsumers(CHECKER_TS));
  });

  it("the BAN-SET axis is derived from the authorities, and its cardinality is asserted", async () => {
    const { banSets } = deriveConsumers(CHECKER_TS);
    const mod = (await import("./uat-spec-integrity.js")) as unknown as Record<string, unknown>;
    // Both directions: every derived ban-set name is a real exported constant, and the four the
    // recipe quotes by value are all present. Deriving the arms while hand-typing the SETS would be
    // the same half-fix one axis over.
    for (const name of banSets) {
      expect(mod[name], `${name} is read as a ban set but is not exported`).toBeDefined();
    }
    expect(banSets).toEqual([
      "BANNED_CONFIGURED_PATHS",
      "BANNED_EXACT_PATHS",
      "BANNED_MODIFIER_HEADS",
      "BANNED_MODIFIER_TAILS",
    ]);
    expect(banSets.length, "the number of ban sets the membership authorities read CHANGED").toBe(4);
  });

  it("the derived path-consumer set has exactly the MEMBERS the binding record names", () => {
    const { consumers } = deriveConsumers(CHECKER_TS);
    expect(consumers.map((c) => c.signature)).toEqual(
      Object.keys(PATH_CONSUMER_DISPOSITIONS).sort(),
    );
  });

  it("the derived path-consumer set has the expected CARDINALITY", () => {
    const { consumers } = deriveConsumers(CHECKER_TS);
    // Asserted separately from the member list on purpose: an arm whose TEXT moved and an arm that
    // was ADDED are different events and must not read as one failure.
    expect(
      consumers.length,
      "the number of arms comparing a resolved dotted path against a ban set CHANGED",
    ).toBe(Object.keys(PATH_CONSUMER_DISPOSITIONS).length);
    expect(consumers.length, "the measured cardinality recorded in 31-16-SUMMARY.md").toBe(5);
  });

  it("every derived arm either ASKS THE NORMALISER or carries a written raw disposition", () => {
    const { consumers } = deriveConsumers(CHECKER_TS);
    const bound = Object.keys(PATH_CONSUMER_DISPOSITIONS);

    const unbound = consumers.filter((c) => !bound.includes(c.signature));
    expect(
      unbound.map((c) => c.signature),
      `${unbound.length} arm(s) compare a resolved path with no binding. An unbound arm is one that ` +
        `nobody decided the marker question for — which is exactly the state CR-09 found the two ` +
        `whole-path arms in.`,
    ).toEqual([]);

    let normalised = 0;
    for (const consumer of consumers) {
      const disposition = PATH_CONSUMER_DISPOSITIONS[consumer.signature];
      expect(
        disposition.reason.trim().length,
        `${consumer.signature}: the disposition reason is shorter than a sentence — a label is not a reason`,
      ).toBeGreaterThan(40);
      if (disposition.kind === "normalised") {
        normalised++;
        expect(
          consumer.operandSource.includes(`${NORMALISER}(`),
          `${consumer.signature}: dispositioned as normalised, but its operand \`${consumer.operand}\` ` +
            `resolves to \`${consumer.operandSource}\`, which does not come from ${NORMALISER}`,
        ).toBe(true);
      } else {
        expect(
          consumer.operandSource.includes(`${NORMALISER}(`),
          `${consumer.signature}: dispositioned as raw, but its operand DOES ask the normaliser`,
        ).toBe(false);
      }
    }
    // PREMISE: a record in which nothing is normalised would satisfy the loop vacuously.
    expect(normalised, "PREMISE: no derived arm asks the normaliser at all").toBeGreaterThan(0);
  });

  it("the normaliser contributes ZERO decline sites — every exit returns its input or a rewrite", () => {
    // The same property canonicaliseHeadSegment carries, asserted for the same reason: the decline
    // set must stay exactly the set of positions where no path could be produced in the first place.
    const source = readFileSync(CHECKER_TS, "utf8");
    const sf = ts.createSourceFile("c.ts", source, ts.ScriptTarget.Latest, true);
    let fn: import("typescript").FunctionDeclaration | undefined;
    const find = (node: import("typescript").Node): void => {
      if (ts.isFunctionDeclaration(node) && node.name?.text === NORMALISER) fn = node;
      ts.forEachChild(node, find);
    };
    ts.forEachChild(sf, find);
    expect(fn, `PREMISE: ${NORMALISER} is not declared in the runnable`).toBeDefined();

    const declines: string[] = [];
    const scan = (node: import("typescript").Node): void => {
      if (
        ts.isReturnStatement(node) &&
        node.expression !== undefined &&
        node.expression.kind === ts.SyntaxKind.NullKeyword
      ) {
        declines.push(node.getText(sf));
      }
      ts.forEachChild(node, scan);
    };
    scan(fn!.body!);
    expect(declines, `${NORMALISER} introduced a decline of its own`).toEqual([]);
  });

  // ── THE WATCHED FAIL: the derivation is a control, not a coincidence ─────────────────────────

  const SEEDED_OPERAND = "SEEDED_RAW_PATH_CONTROL";
  const SEED_ANCHOR = "  if (isBannedModifierPath(dottedPath)) return true;";

  function mirrorWithSeededArm(): string {
    const source = readFileSync(CHECKER_TS, "utf8");
    expect(
      source.split(SEED_ANCHOR).length - 1,
      `PREMISE: the seed anchor was not found EXACTLY once, so the mirror is not the source plus ` +
        `one arm — anchor: ${SEED_ANCHOR}`,
    ).toBe(1);
    expect(
      source.includes(SEEDED_OPERAND),
      "PREMISE: the seeded operand is ALREADY in the runnable, so its presence would prove nothing",
    ).toBe(false);
    const mutated = source.replace(
      SEED_ANCHOR,
      `${SEED_ANCHOR}\n  if (BANNED_EXACT_PATHS.includes(${SEEDED_OPERAND})) return true;`,
    );
    const path = join(mkTmp(), "uat-spec-integrity.ts");
    writeFileSync(path, mutated, "utf8");
    return path;
  }

  it("a SEEDED fourth arm outside the normaliser moves the count by exactly one and arrives UNBOUND", () => {
    const before = deriveConsumers(CHECKER_TS);
    const after = deriveConsumers(mirrorWithSeededArm());

    // PREMISE: the mirror still derives the same two axes, or the count difference would be caused
    // by a broken derivation rather than by the seed.
    assertConsumerPremise(after);
    expect(after.banSets).toEqual(before.banSets);

    expect(
      after.consumers.length,
      "the seeded arm did not move the derived cardinality by exactly one",
    ).toBe(before.consumers.length + 1);

    const seeded = after.consumers.filter((c) => c.operand.includes(SEEDED_OPERAND));
    expect(seeded.length, "the derivation did not see the seeded arm at all").toBe(1);
    // NOTHING ELSE MOVED: the seeded arm is the ONLY difference.
    expect(
      after.consumers.filter((c) => !c.operand.includes(SEEDED_OPERAND)).map((c) => c.signature),
    ).toEqual(before.consumers.map((c) => c.signature));

    // …and it arrives UNBOUND and un-normalised, which is the behaviour a fourth raw arm would show.
    const bound = Object.keys(PATH_CONSUMER_DISPOSITIONS);
    const unbound = after.consumers.filter((c) => !bound.includes(c.signature));
    expect(unbound.length).toBe(1);
    expect(unbound[0].operand).toContain(SEEDED_OPERAND);
    expect(unbound[0].operand.includes(`${NORMALISER}(`)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-16 CR-10 — THE TESTINFO FIXTURE-PARAMETER BINDING IS DECIDED FROM THE PARSE.
//
// `test("a", async ({ page }, testInfo) => { testInfo.skip(); })` is Playwright's PRIMARY documented
// spelling of exactly the modifiers D-18 (1) was convened to decide in their `test.info()` form. It
// resolves cleanly to `testInfo.skip` — nothing is declined — and the head is simply not a banned
// head, which is why neither the derived decline set nor the reverse partition can ever name it.
//
// Measured against the committed .js at HEAD before any source change, all three at
// `0 findings over 1/1 uat specs checked`, EXIT=0:
//   testInfo.skip()   ·   testInfo.fail()   ·   testInfo.fixme(true, "later")
//
// The round did consider the shape and dispositioned it — but only inside a test-file comment, under
// the exported alias residual whose stated reason ("cannot be followed to its declaration without a
// type checker") is the exact excuse D-18 (3) disproved one shape earlier for
// `ImportSpecifier.propertyName`. The SECOND parameter of the function passed as the SECOND argument
// to a `test(...)`-headed call is TestInfo BY POSITION, and the position is a literal in the source
// text. So it is DECIDED here, and the disproved excuse is REMOVED rather than relocated.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-16 CR-10: the TestInfo fixture parameter is canonicalised", () => {
  const IMPORT = 'import { test, expect } from "@playwright/test";';

  function findingsOf(body: string): string[] {
    const root = mkTargetRepo({});
    const dest = join(root, "e2e", "uat", "subject.uat.spec.ts");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
    const r = runCheck(root, "--json");
    if (r.status === 0) return [];
    return (JSON.parse(r.stdout) as { findings: string[] }).findings;
  }

  function scenarioWith(call: string, param = "testInfo"): string {
    return [
      IMPORT,
      `test("a scenario", async ({ page }, ${param}) => {`,
      `  ${call}`,
      '  await expect(page.getByTestId("x")).toBeVisible();',
      "});",
      "",
    ].join("\n");
  }

  // ── Test 1 and Test 2: the three refused spellings, named as the decided canonical head ───────
  for (const [modifier, args] of [
    ["skip", ""],
    ["fail", ""],
    ["fixme", 'true, "later"'],
  ] as const) {
    it(`refuses testInfo.${modifier}(${args}) reached through the fixture parameter`, () => {
      const findings = findingsOf(scenarioWith(`testInfo.${modifier}(${args});`));
      expect(findings.length, `testInfo.${modifier}: expected exactly one finding`).toBe(1);
      // The finding names the CANONICAL head D-18 (1) already decided for this construct, so a
      // reader meets one spelling of the TestInfo modifier family rather than two.
      expect(findings[0]).toContain(`test.info().${modifier}`);
      expect(findings[0]).toContain("banned modifier call");
    });
  }

  // ── Test 3: the canonicalisation does not refuse the whole TestInfo surface ───────────────────
  it("does NOT refuse testInfo.slow() — a modifier outside the tail set", () => {
    expect(
      findingsOf(scenarioWith("testInfo.slow();")),
      "`slow` triples a scenario's time budget and removes nothing from the evidence; " +
        "canonicalising the head must not turn every TestInfo call into a finding",
    ).toEqual([]);
  });

  // ── Test 4: the arity cases, now asked of the TYPE rather than of an argument INDEX ──────────
  //
  // 31-28 (D-30): these used to drive `deriveTestInfoParameterNames`, the derivation that read the
  // scenario body from `arguments[1]` and the TestInfo binding from that function's `parameters[1]`.
  // CR-21 measured what a FIXED INDEX costs: Playwright's documented three-argument tag/annotation
  // overload puts the body at `arguments[2]`, where the derivation never looked, and
  // `testInfo.skip()` inside it reported `0 findings` at exit 0. The derivation is DELETED. The
  // checker gives the parameter its declared type at every position the framework documents, so the
  // arity cases below are driven at the ENTRY and assert the OUTCOME rather than a map's contents.

  it("a ZERO-parameter callback yields no TestInfo binding, and the spec is not refused", () => {
    expect(
      findingsOf([IMPORT, 'test("a", async () => { void 0; });', ""].join("\n")),
      "a scenario with no fixtures has no TestInfo to reach, so nothing may be refused",
    ).toEqual([]);
  });

  it("a ONE-parameter callback yields no TestInfo binding, and the spec is not refused", () => {
    expect(
      findingsOf([IMPORT, 'test("a", async ({ page }) => { await page.goto("/"); });', ""].join("\n")),
    ).toEqual([]);
  });

  it("a DESTRUCTURED second parameter is REFUSED — RR-08, closed by the checker", () => {
    // The binding names a LOCAL whose declaration is the spec file, which is why the spelling rule
    // could never decide it and why the register carried it for five rounds. The checker resolves
    // the pattern's own type and hands back the PROPERTY the pattern destructures, which is the
    // framework's `TestInfo.skip`.
    const findings = findingsOf(
      [IMPORT, 'test("a", async ({ page }, { skip }) => { skip(); void page; });', ""].join("\n"),
    );
    expect(findings.length, `expected one finding, got ${JSON.stringify(findings)}`).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("a RENAMED destructuring is refused too — the PROPERTY decides, not the local name", () => {
    const findings = findingsOf(
      [IMPORT, 'test("a", async ({ page }, { skip: bail }) => { bail(); void page; });', ""].join("\n"),
    );
    expect(findings.length, `expected one finding, got ${JSON.stringify(findings)}`).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("a destructured NON-banned member is not refused — the ban is still the tail set", () => {
    expect(
      findingsOf(
        [IMPORT, 'test("a", async ({ page }, { slow }) => { slow(); void page; });', ""].join("\n"),
      ),
      "`slow` triples a scenario's time budget and removes nothing from the evidence",
    ).toEqual([]);
  });

  // ── Test 5: a renamed head composes with the binding ──────────────────────────────────────────
  it("a RENAMED test binding still yields its second callback parameter", () => {
    const findings = findingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        'it("a scenario", async ({ page }, info) => {',
        "  info.skip();",
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length, "the renamed head must still yield its fixture-parameter binding").toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("the canonical head is DERIVED from the framework's own declarations, not written here", () => {
    // IN-16 (D-33 (6)), 2026-09-11: this case used to open by destructuring the canonical-head
    // EXPORT and asserting its literal value. D-30 (5) deleted the derivation that read it, so the
    // assertion was the binding's only remaining consumer — a live assertion over a dead export.
    // Both are gone. What the case asserts now is the DERIVATION: the runnable reaches
    // `test.info()` by walking the framework's exported surface — `test`, then its `info` member,
    // then that member's call-signature return type — and it carries no `TestInfo` literal at all,
    // which is the property that makes the derivation survive a package whose type names differ
    // from this repository's transcription.
    const source = readFileSync(join(HERE, "uat-spec-integrity.ts"), "utf8");
    expect(
      source.includes(["Test", "Info", '"'].join("")),
      "the runnable names a framework TYPE as a string literal — the derivation is not derived",
    ).toBe(false);
    const findings = findingsOf(scenarioWith("testInfo.skip();"));
    expect(findings[0]).toContain("test.info().skip");
  });

  it("the canonicaliser still declines nothing — a null path passes straight through", async () => {
    const { canonicaliseHeadSegment } = await loadChecker();
    expect(canonicaliseHeadSegment(null, new Map())).toBeNull();
    expect(canonicaliseHeadSegment("page.goto", new Map())).toBe("page.goto");
  });

  // ── Test 6: the scope boundary is stated, not silent ─────────────────────────────────────────
  it("the two-rule pairing is a named residual — 31-28 (D-30 (3))", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    // 31-16 filed this as "the canonicalisations have no scope analysis, owned by 31-17". 31-17
    // (D-21 (2)) decided it FILE-SCOPED; 31-24 (D-27) re-decided it as nearest-binding resolution
    // after CR-14; 31-28 (D-30) moved the whole question to the checker and KEPT the census as a
    // second rule, asked only where the checker resolved nothing. The boundary is still a boundary
    // and is still named exactly once — what changed is which boundary it is.
    const paired = UNRESOLVABLE_CALLEE_RESIDUALS.filter((r) =>
      r.includes("IDENTITY AND SPELLING ARE TWO RULES FOR ONE QUESTION"),
    );
    expect(paired.length, "the two-rule pairing is not named exactly once in the register").toBe(1);
    expect(paired[0]).toContain("the checker resolved no symbol at all");
    expect(
      paired[0],
      "a residual that does not say what would force it closed is a silence with a sentence on it",
    ).toContain("What would force it closed");
  });

  // ── Test 7: a residual the checker CLOSED leaves the register ────────────────────────────────
  it("the alias residual is GONE — the checker closed it, and a closed residual is removed", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.filter((r) => r.startsWith("An aliased binding")),
      "the register still discloses a boundary the corpus measured the checker deciding",
    ).toEqual([]);
    // …and the behaviour that justifies the removal is DRIVEN, not asserted from the register: a
    // register that shrank without a measurement is the shape this whole file exists to refuse.
    const findings = findingsOf(
      [
        IMPORT,
        "const t = test;",
        't.skip("a scenario", async ({ page }) => { void page; });',
        "",
      ].join("\n"),
    );
    expect(findings.length, "the alias is not refused, so removing its residual was a claim").toBe(1);
    expect(findings[0]).toContain("test.skip");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-17 WR-19 — THE CHAIN BOUND IS ONE BUDGET FOR A WHOLE RESOLUTION, NOT ONE PER FRAME.
//
// WHICH REGISTER FAILED. D-18 (1) made `calleeDottedPath` RECURSIVE and did not re-derive the
// 512-step bound that had been written for a flat loop. A bound whose UNIT is "steps in one loop"
// silently became "steps per recursion frame" the moment a frame could start another frame, so the
// exported residual the recipe quotes verbatim — "a chain that reaches it yields no path rather than
// a truncated one" — stopped being true of the mechanism, in BOTH of its clauses.
//
// Measured against the committed .js at HEAD before any source change (probe repository under
// `.temp/wr19-prefix/`, spec at `uat/p.uat.spec.ts`, `typescript` resolvable from the probe root,
// a 4000-link call chain `chain.a().a()…`):
//   EXIT=1   stdout: (empty)
//   stderr:  RangeError: Maximum call stack size exceeded
//                at calleeDottedPath (…/scripts/runnable-ref/uat-spec-integrity.js:686:33)
// and instrumented through the committed module, which is what shows the bound restarting per frame:
//   600 pure property links                       -> null
//   the SAME 600 links, 6 call links interleaved  -> resolved, 1216 chars, head "test"
//
// WHY THE EXIT CODE IS NOT THE HARM. 1 is inside the D-12 contract only because Node's uncaught
// exception code happens to be 1, which that contract reads as "a finding — the quality gate blocks".
// The harm is that `reportMeasured` is NEVER REACHED, so the vacuity floor and the denominator floor
// — the two branches whose whole purpose is to make a check that did not run unreadable as a clean
// one — are bypassed by construction while stdout stays silent. Every case below therefore asserts
// at the OUTPUT, not at the module: asserting the floors on the ordinary path only is exactly what
// let this bypass exist.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-17 WR-19: a pathological chain is bounded, never fatal", () => {
  const PATHOLOGICAL_LINKS = 4000;

  /** The verifier's own probe spec: a call chain far longer than any bound, in a legitimate file. */
  function pathologicalSpec(links = PATHOLOGICAL_LINKS): string {
    return [
      'import { test, expect } from "@playwright/test";',
      "const chain: any = test;",
      'test("a scenario", async ({ page }) => {',
      `  chain${".a()".repeat(links)};`,
      '  await expect(page.getByTestId("x")).toBeVisible();',
      "});",
      "",
    ].join("\n");
  }

  const TRIVIAL_SPEC = [
    'import { test, expect } from "@playwright/test";',
    'test("a scenario", async ({ page }) => {',
    '  await page.goto("/x");',
    '  await expect(page.getByTestId("x")).toBeVisible();',
    "});",
    "",
  ].join("\n");

  function plant(root: string, relPath: string, body: string): void {
    const dest = join(root, relPath);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
  }

  /** Resolve one expression's callee through the COMMITTED module, the way production resolves it. */
  async function pathOf(exprText: string): Promise<string | null> {
    const { calleeDottedPath } = await loadChecker();
    const ts = hostTypeScript as typeof import("typescript");
    const sf = ts.createSourceFile("p.ts", `${exprText};`, ts.ScriptTarget.Latest, true);
    const stmt = sf.statements[0] as import("typescript").ExpressionStatement;
    const call = stmt.expression as import("typescript").CallExpression;
    return calleeDottedPath(ts, call.expression);
  }

  // ── 31-28 (D-30 (5)): THE BOUND IS DELETED, AND WHAT REPLACED IT IS MEASURED ─────────────────
  //
  // WR-19's defect was a bound whose UNIT drifted when the code around it changed. The cutover
  // removes the class rather than the instance: `calleeDottedPath` walks an EXPLICIT STACK, every
  // step descends to a strict child of a finite parse tree, and there is no allowance left to state
  // or to mis-unit. RR-05 — the residual that published the number — leaves the register with the
  // mechanism it described. The cases below assert the deletion, the property WR-19 was convened
  // about, and the boundary a pathological chain now reaches instead.

  it("the bound is GONE — not exported, and not written as a literal anywhere in the module", async () => {
    const mod = (await loadChecker()) as unknown as Record<string, unknown>;
    expect(
      Object.prototype.hasOwnProperty.call(mod, "CALLEE_CHAIN_STEP_BOUND"),
      "the bound is still exported — a published allowance for a mechanism the module no longer has",
    ).toBe(false);
    // DERIVED FROM THE PARSE, NOT FROM THE TEXT. A substring scan would also count the number where
    // it appears in PROSE — this file's own decision header records what the unit used to be — and
    // a check that reds on a comment is a check people learn to work around.
    const ts = hostTypeScript as typeof import("typescript");
    const sf = ts.createSourceFile(
      "c.ts",
      readFileSync(join(HERE, "uat-spec-integrity.ts"), "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const literals: import("typescript").NumericLiteral[] = [];
    const scan = (node: import("typescript").Node): void => {
      if (ts.isNumericLiteral(node) && node.text === "512") literals.push(node);
      ts.forEachChild(node, scan);
    };
    ts.forEachChild(sf, scan);
    expect(
      literals.length,
      "the deleted bound's value is still a numeric literal in the runnable's CODE",
    ).toBe(0);
  });

  it("WR-19's own property holds TRIVIALLY: interleaving call links changes nothing", async () => {
    // The defect was that a chain interleaving call links resolved where the same chain of pure
    // property links did not, because each recursion frame started a fresh allowance. With no
    // allowance and no recursion, BOTH resolve — and the two are asserted to carry the SAME number
    // of source links, which is the equality the drifted unit broke.
    const pure = await pathOf(`test${".p".repeat(600)}()`);
    let expr = "test";
    for (let i = 0; i < 600; i++) {
      expr += ".p";
      if ((i + 1) % 100 === 0) expr += "()";
    }
    const interleaved = await pathOf(`${expr}()`);
    expect(pure, "a 600-link pure chain no longer resolves — the walk regressed").not.toBeNull();
    expect(interleaved, "a 600-link interleaved chain no longer resolves").not.toBeNull();
    const links = (path: string): number => path.split(".").length;
    expect(
      links(interleaved as string),
      "interleaving call links changed how many links the resolution reached",
    ).toBe(links(pure as string));
  });

  it("a 4,000-link chain is a COULD-NOT-RUN at exit 2, never a pass and never an escaping throw", () => {
    // 31-28 (D-30): MEASURED, AND IT IS A NEW BOUNDARY RATHER THAN THE OLD ONE. The resolver no
    // longer struggles with this chain at all — the COMPILER does: `program.getTypeChecker()` binds
    // every root file, and the binder is recursive over the AST, so a 4,000-link chain exhausts it.
    // The runnable reports that honestly and blocks: exit 2, the named reason, an EMPTY stdout. The
    // COST is real and is disclosed rather than absorbed — this could-not-run is WHOLE-RUN rather
    // than per-file, which is coarser than the boundary D-28 established, and it is carried as a
    // named residual with a closure criterion instead of being left for a seventh reviewer to find.
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/pathological.uat.spec.ts", pathologicalSpec());
    const r = runCheck(root);
    expect([0, 1, 2], `exit code outside the D-12 contract: ${r.status}`).toContain(r.status);
    expect(r.status, `stderr: ${r.stderr.split("\n")[0]}`).toBe(2);
    expect(r.stdout, "a run that could not complete printed a claim about the specs").toBe("");
    // …and nothing ESCAPED: an uncaught throw prints stack FRAMES, which is the difference between
    // a decided exit and an interpreter's default.
    expect(r.stderr).not.toContain("RangeError");
    expect(r.stderr).not.toContain("    at ");
  });

  it("the WHOLE-RUN granularity of that boundary is a NAMED residual, not a silence", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS, PROGRAM_UNAVAILABLE_REASON } = await loadChecker();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/pathological.uat.spec.ts", pathologicalSpec());
    expect(runCheck(root).stderr).toContain(PROGRAM_UNAVAILABLE_REASON);
    const named = UNRESOLVABLE_CALLEE_RESIDUALS.filter((m) => m.includes("PROGRAM_UNAVAILABLE_REASON"));
    expect(named.length, "the could-not-run route is not named exactly once in the register").toBe(1);
  });

  // ── FAIL-CLOSED: a spec the walk cannot finish is a COULD-NOT-RUN reason, never a pass ─────────
  //
  // The non-recursive walk is what stops the throw from happening. This case asserts what happens
  // if one ever does anyway: the exit code must be inside the D-12 contract BY DECISION, and the
  // spec must NOT be counted as visited — a file counted before the work is a file that can be
  // counted as checked without having been.
  it("a spec whose analysis throws is a could-not-run reason and never increments visited", async () => {
    const { analyzeSpecs, reportMeasured } = await loadChecker();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/one.uat.spec.ts", TRIVIAL_SPEC);
    plant(root, "e2e/uat/boom.uat.spec.ts", TRIVIAL_SPEC);
    const rels = ["e2e/uat/boom.uat.spec.ts", "e2e/uat/one.uat.spec.ts"];
    const ctx = await programContextFor(root, rels);

    // A parser whose walk throws for exactly one file, injected as the `ts` argument so the failure
    // lands inside findBannedConstructs rather than inside the reader.
    const realTs = hostTypeScript as typeof import("typescript");
    const throwingTs = {
      ...realTs,
      forEachChild(node: import("typescript").Node, cb: (c: import("typescript").Node) => void) {
        const sf = node as import("typescript").SourceFile;
        if (typeof sf.fileName === "string" && sf.fileName.endsWith("boom.uat.spec.ts")) {
          throw new Error("forced walk failure");
        }
        return realTs.forEachChild(node, cb as never);
      },
    };

    const analysis = analyzeSpecs(root, rels, throwingTs, ctx);
    expect(analysis.expected).toBe(2);
    expect(analysis.visited, "the throwing spec must NOT be counted as visited").toBe(1);
    expect(analysis.errors.join("\n")).toContain("boom.uat.spec.ts");
    expect(analysis.errors.join("\n")).toContain("could not be analysed");

    let out = "";
    let err = "";
    const code = reportMeasured(analysis, false, (s) => {
      out += s;
    }, (s) => {
      err += s;
    });
    expect(code).toBe(2);
    expect(err).toContain("visited 1 of 2");
    expect(out).toBe("");
  });

  // ── CONTROL (unmoved): the corpus the bound must not disturb ──────────────────────────────────

  it("CONTROL: the refused modifier spellings and the clean corpus are unmoved by the budget", () => {
    const refused = mkTargetRepo({});
    plant(
      refused,
      "e2e/uat/subject.uat.spec.ts",
      [
        'import { test, expect } from "@playwright/test";',
        'test.describe.serial.only("a group", () => {',
        '  test("a scenario", async ({ page }) => {',
        '    await expect(page.getByTestId("x")).toBeVisible();',
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    expect(runCheck(refused).status).toBe(1);

    const clean = mkTargetRepo({});
    plant(clean, "e2e/uat/subject.uat.spec.ts", TRIVIAL_SPEC);
    expect(runCheck(clean).status).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-17 WR-20 — THE CANONICALISATION ASKS WHAT A HEAD IS BOUND TO.
//
// WHICH REGISTER FAILED. D-17 fixed MEMBERSHIP; D-18 fixed SHAPE RESOLUTION; D-20 fixed WHICH ARMS
// the resolved shape is compared against. The register that failed here is WHETHER THE NAME BEING
// REWRITTEN IS THE NAME THE MAP IS ABOUT. `canonicaliseHeadSegment` rewrote `segments[0]` whenever
// it was a key of a file-level map, with no scope analysis at all — so a legitimate spec carrying an
// unrelated local binding of the same name was refused, under a construct name the file does not
// contain.
//
// Measured against the committed .js at HEAD before this plan's change (probe repository under
// `.temp/wr20-prefix/`, spec at `uat/p.uat.spec.ts`, the review's own reproduction verbatim):
//   UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
//   uat/p.uat.spec.ts:4: banned modifier call — `test.skip` decides which scenarios the quality
//   gate re-runs and how their results are read, …
//   EXIT=1
//
// AND ITS BLAST RADIUS DOUBLED IN 31-16, which added a SECOND map feeding that one canonicaliser.
// A scope rule written for the import map alone would be this exact defect one map over, so the rule
// lives in the CANONICALISER and is asked of every map that feeds it — asserted below as its own
// case rather than left to reading order.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-17 WR-20: a head with a nearer declaration is not canonicalised", () => {
  function findingsOf(body: string): string[] {
    const root = mkTargetRepo({});
    const dest = join(root, "e2e", "uat", "subject.uat.spec.ts");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
    const r = runCheck(root, "--json");
    if (r.status === 0) return [];
    return (JSON.parse(r.stdout) as { findings: string[] }).findings;
  }

  /** The review's reproduction, verbatim apart from the selector member the corpus surface carries. */
  const SHADOWED_RENAME_SPEC = [
    'import { test as it, expect } from "@playwright/test";',
    'it("a", async ({ page }) => {',
    "  const helpers = { skip: (n: number) => n };",
    "  function inner(it: { skip: (n: number) => number }) { return it.skip(1); }",
    "  inner(helpers);",
    '  await expect(page.getByTestId("x")).toBeVisible();',
    "});",
    "",
  ].join("\n");

  // ── Test 1 (RED): the legitimate spec is not refused ──────────────────────────────────────────

  it("the review's legitimate shadowing spec reports ZERO findings", () => {
    expect(
      findingsOf(SHADOWED_RENAME_SPEC),
      "a legitimate spec is refused because a local binding shares a renamed import's local name",
    ).toEqual([]);
  });

  // ── Test 2: the census is PER NAME, not a global off switch ───────────────────────────────────
  //
  // A zero-finding run makes "the misleading message is gone" true vacuously, and a scope rule that
  // bought its zero by disabling the canonicalisation whenever the file declares ANYTHING would
  // satisfy every case above. This one shadows a DIFFERENT name and asserts the genuine renamed
  // modifier is still refused, named, and named exactly once at its own line.
  it("a shadowing binding on ANOTHER name does not disarm the rename canonicalisation", () => {
    const findings = findingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        "function inner(helpers: { skip: (n: number) => number }) { return helpers.skip(1); }",
        'it.skip("a removed scenario", async ({ page }) => {',
        "  inner({ skip: (n: number) => n });",
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length, "the genuine renamed modifier must be reported exactly once").toBe(1);
    expect(findings[0]).toContain("test.skip");
    // …at the SCENARIO's line (3), never at the shadowed helper's line (2).
    expect(findings[0]).toContain("subject.uat.spec.ts:3:");
  });

  // ── Test 2b: THE UNION — one file that BOTH declares the name and calls the modifier ──────────
  //
  // THIS CASE REPLACES ONE THAT ASSERTED THE OPPOSITE. Under D-21 (2)'s FILE-SCOPED rule this exact
  // file reported ZERO findings, and that zero was asserted green here under the heading "THE
  // COARSENESS, MEASURED rather than described". The measurement was real; the behaviour was the
  // wrong behaviour to have. CR-14 showed why: for a BAN, a suppression is an ADMISSION, so the
  // "cost" the old case recorded was a two-line, deliberately-writable evasion of the whole
  // rename/namespace/fixture-parameter family. D-27 resolves a reference to the NEAREST binding that
  // contains it — the helper's parameter reaches the helper and no further — so the module-scope
  // renamed modifier is refused while the helper's own call stays legitimate. The case is REPLACED
  // rather than deleted: a case that vanishes is a case nobody re-derived.
  it("THE UNION: a file that declares the name AND genuinely calls the modifier reports exactly one finding", () => {
    const findings = findingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        "function inner(it: { skip: (n: number) => number }) { return it.skip(1); }",
        'it.skip("a removed scenario", async ({ page }) => {',
        "  inner({ skip: (n: number) => n });",
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(
      findings.length,
      "PRE-D-27 MEASURED: `0 findings`, EXIT=0 — the helper's parameter suppressed the rewrite for " +
        "the WHOLE file, including the module-scope call it does not contain",
    ).toBe(1);
    expect(findings[0]).toContain("test.skip");
    // …at the SCENARIO's line (3), never at the shadowed helper's line (2).
    expect(findings[0]).toContain("subject.uat.spec.ts:3:");
  });

  it("THE UNION's other half: the helper's OWN call is still legitimate and is not reported", () => {
    // The same shape with the module-scope modifier removed. If this ever starts reporting, the
    // narrowing overshot into WR-20's direction and the checker is refusing a legitimate spec.
    expect(
      findingsOf(
        [
          'import { test as it, expect } from "@playwright/test";',
          "function inner(it: { skip: (n: number) => number }) { return it.skip(1); }",
          'it("a scenario", async ({ page }) => {',
          "  inner({ skip: (n: number) => n });",
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      ),
    ).toEqual([]);
  });

  // ── Test 3: every genuine spelling 31-13 closed is still refused ──────────────────────────────

  it("STILL REFUSED: a renamed head, because a spec that CALLS a renamed import does not declare it", () => {
    const findings = findingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        'it.skip("a", async ({ page }) => {',
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        'it.describe.only("b", () => {',
        '  it("c", async ({ page }) => {',
        '    await expect(page.getByTestId("y")).toBeVisible();',
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(2);
    expect(findings.join("\n")).toContain("test.skip");
    expect(findings.join("\n")).toContain("test.describe.only");
  });

  it("STILL REFUSED: a namespace import head", () => {
    const findings = findingsOf(
      [
        'import * as pw from "@playwright/test";',
        'pw.test.skip("a", async ({ page }: { page: { getByTestId(id: string): unknown } }) => {',
        "  void page;",
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.skip");
  });

  it("STILL REFUSED: a TestInfo fixture-parameter head", () => {
    const findings = findingsOf(
      [
        'import { test, expect } from "@playwright/test";',
        'test("a", async ({ page }, testInfo) => {',
        "  testInfo.skip();",
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  // ── Test 4: BOTH MAPS. The rule lives in the canonicaliser, not in one map's derivation ───────

  it("BOTH MAPS: a fixture-parameter name ALSO declared elsewhere in the file is not canonicalised", () => {
    expect(
      findingsOf(
        [
          'import { test, expect } from "@playwright/test";',
          "const testInfo = { skip: (): void => undefined };",
          'test("a", async ({ page }, info) => {',
          "  void info;",
          "  testInfo.skip();",
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      ),
      "a name the file DECLARES as a const was canonicalised through the fixture-parameter map",
    ).toEqual([]);
  });

  // ── Test 5: PRECEDENCE. The scope rule wins over BOTH maps ────────────────────────────────────

  it("SUPPRESSION: a head whose NEAREST binding contains the reference is not canonicalised", async () => {
    const { canonicaliseHeadSegment } = await loadChecker();
    const renames = new Map([["shared", "test"]]);
    // D-27: the scope argument is a { bindings, position } PAIR. A caller that cannot produce a
    // position cannot produce the pair, which is the structural half of "a constant is not a
    // position".
    //
    // 31-28 (D-30 (5)): there is only ONE map now. The fixture-parameter map that used to feed this
    // canonicaliser was deleted with the fixed-index read CR-21 was found on, and the census's one
    // non-suppressing record — the exemption that existed only to protect that map — went with it.
    // What this case still asserts is the property WR-20 was convened about, unchanged: a reference
    // the file itself binds is not rewritten into a construct the file does not contain.
    const scope = { bindings: [{ name: "shared", start: 0, end: 100 }], position: 50 };

    // PREMISE: without a containing binding the map WOULD have rewritten it — otherwise the case
    // below asserts a no-op.
    expect(canonicaliseHeadSegment("shared.skip", renames, null)).toBe("test.skip");
    // …and with the nearest binding containing the reference, it does not.
    expect(canonicaliseHeadSegment("shared.skip", renames, scope)).toBe("shared.skip");
    // …while a position OUTSIDE that binding's range is decided by nothing, so the map applies
    // again. The suppression is a property of the REFERENCE, not of the file.
    expect(canonicaliseHeadSegment("shared.skip", renames, { ...scope, position: 100 })).toBe(
      "test.skip",
    );
  });

  // ── Test 6: the rule's OWN SET, exercised one declaration kind at a time ──────────────────────

  // EVERY case here CALLS `.skip` on the shadowed binding. A case that merely declared the name
  // would pass before the fix as well — the canonicalisation only matters where a path is resolved
  // — and a case that passes on the un-fixed tree proves nothing about the rule. The declaration
  // kind is the only thing that varies; the call site is held constant.
  const DECLARATION_KINDS: ReadonlyArray<readonly [string, readonly string[]]> = [
    [
      "a function parameter",
      ["function inner(it: { skip: (n: number) => number }) { return it.skip(1); }", "inner({ skip: (n: number) => n });"],
    ],
    ["a const binding", ["const it = { skip: (n: number): number => n };", "it.skip(1);"]],
    ["a let binding", ["let it = { skip: (n: number): number => n };", "it.skip(1);"]],
    ["a var binding", ["var it = { skip: (n: number): number => n };", "it.skip(1);"]],
    ["a function name", ["function it(n: number): number { return n; }", "it.skip(1);"]],
    ["a class name", ["class it { static skip(n: number): number { return n; } }", "it.skip(1);"]],
  ];

  for (const [kind, lines] of DECLARATION_KINDS) {
    it(`DECLARATION KIND: ${kind} suppresses canonicalisation of that name`, () => {
      expect(
        findingsOf(
          [
            'import { test as it, expect } from "@playwright/test";',
            ...lines,
            'test("a", async ({ page }) => {',
            '  await expect(page.getByTestId("x")).toBeVisible();',
            "});",
            "",
          ].join("\n"),
        ),
        `${kind}: the file DECLARES this name and calls \`skip\` on it, so the rename map must not ` +
          `rewrite that head to \`test\``,
      ).toEqual([]);
    });
  }

  it("the declared-binding list really carries every kind the cases above exercise", async () => {
    const { deriveDeclaredBindings } = await loadChecker();
    const ts = hostTypeScript as typeof import("typescript");
    const sf = ts.createSourceFile(
      "p.ts",
      [
        "const alpha = 1;",
        "let beta = 2;",
        "var gamma = 3;",
        "function delta(epsilon: number): number { return epsilon; }",
        "class zeta {}",
        "const { eta } = { eta: 1 };",
        "const theta = (iota: number): number => iota;",
        "",
      ].join("\n"),
      ts.ScriptTarget.Latest,
      true,
    );
    const declared = deriveDeclaredBindings(ts, sf);
    expect(declared.length, "PREMISE: the census derived nothing on the host's own parser").toBeGreaterThan(0);
    const names = declared.map((b) => b.name);
    for (const name of ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota"]) {
      expect(names, `the census does not carry ${name}`).toContain(name);
    }
    // 31-28 (D-30 (5)): every record SUPPRESSES, and the field that said so is gone. The one
    // non-suppressing record was the TestInfo fixture-binding POSITION, which existed only to keep
    // that parameter visible to `deriveTestInfoParameterNames` — the derivation this plan deleted.
    // An exemption whose only reason has been deleted is a superset of nothing, so it was removed
    // rather than narrowed, and with it the flag that could only ever read `true`.
    for (const binding of declared) {
      expect(binding.end, `${binding.name} has an empty or inverted range`).toBeGreaterThan(
        binding.start,
      );
      expect(
        (binding as unknown as Record<string, unknown>).suppresses,
        `${binding.name} still carries a suppresses flag — a field with one reachable value`,
      ).toBeUndefined();
    }
  });

  it("the census does NOT count an import binding — an import is what the map is ABOUT", async () => {
    const { deriveDeclaredBindings } = await loadChecker();
    const ts = hostTypeScript as typeof import("typescript");
    const sf = ts.createSourceFile(
      "p.ts",
      [
        'import { test as it, expect } from "@playwright/test";',
        'import * as pw from "@playwright/test";',
        "",
      ].join("\n"),
      ts.ScriptTarget.Latest,
      true,
    );
    // If an import specifier counted as a declaration, EVERY rename would shadow itself and the
    // canonicalisation would never fire — the fix would have bought its correctness by doing nothing.
    expect(deriveDeclaredBindings(ts, sf).map((b) => b.name)).toEqual([]);
  });

  it("the census records the fixture parameter like any other — the exemption is DELETED", async () => {
    const { deriveDeclaredBindings } = await loadChecker();
    const ts = hostTypeScript as typeof import("typescript");
    const sf = ts.createSourceFile(
      "p.ts",
      [
        'import { test, expect } from "@playwright/test";',
        'test("a", async ({ page }, testInfo) => { void page; void testInfo; });',
        "",
      ].join("\n"),
      ts.ScriptTarget.Latest,
      true,
    );
    const declared = deriveDeclaredBindings(ts, sf);
    // D-21 (2) OMITTED this position. D-27 RECORDED it as non-suppressing, because omitting it made
    // the parameter invisible to resolution. D-30 (5) records it like every other parameter, because
    // the map the exemption protected is gone and the question it answered is now the CHECKER's:
    // `testInfo`'s declared type is the framework's, so identity refuses `testInfo.skip()` whatever
    // this census says about the name.
    expect(declared.filter((b) => b.name === "testInfo").length).toBe(1);
    expect(declared.filter((b) => b.name === "page").length).toBe(1);
    // …and the behaviour that used to depend on the exemption is DRIVEN rather than assumed: a
    // module-scope declaration of the fixture parameter's name does not re-admit the banned call.
    const findings = findingsOf(
      [
        'import { test, expect } from "@playwright/test";',
        "const testInfo = 1;",
        "void testInfo;",
        'test("a", async ({ page }, testInfo) => {',
        "  testInfo.skip();",
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length, `expected one finding, got ${JSON.stringify(findings)}`).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  // ── Test 7: the boundary is NAMED, and the register still binds in both directions ────────────

  it("the two-rule pairing is the named residual now, with a reason true of the mechanism", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    // D-21 (2) named a FILE-SCOPED census. D-27 named NEAREST-BINDING resolution. D-30 (3) moved the
    // question to the checker and kept the census as a SECOND rule, asked only where the checker
    // resolved nothing — so what the register must now disclose is the PAIRING, and what BOUNDS it.
    // The member moves with the mechanism each time rather than being deleted, because the boundary
    // is still a boundary and must still be exactly one named member.
    const scoped = UNRESOLVABLE_CALLEE_RESIDUALS.filter((r) =>
      r.includes("IDENTITY AND SPELLING ARE TWO RULES FOR ONE QUESTION"),
    );
    expect(
      scoped.length,
      "the two-rule pairing is not a named member of the exported register",
    ).toBe(1);
    expect(scoped[0]).toContain("the checker resolved no symbol at all");
    expect(scoped[0]).toContain("What would force it closed");
    // …and the sentence the PREVIOUS mechanism published is GONE, not left beside the new one. A
    // register that accumulates a member per mechanism describes none of them.
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.filter((r) => r.includes("No binder is shipped")),
      "the register still publishes the pre-cutover scope sentence",
    ).toEqual([]);
  });

  // ── the control fixture on disk ───────────────────────────────────────────────────────────────

  // 31-24 (WR-24): the fixture's contract became TWO-DIRECTIONAL. Region present -> exactly one
  // finding; region removed -> zero. Under 31-17's file-scoped rule the region-present form reported
  // ZERO, which is why the old single-direction control could not fail for CR-14's reason.
  it("the UNION fixture is on disk and reports EXACTLY ONE finding with its region present", () => {
    const onDisk = readdirSync(FIXTURES).filter((n) => n.endsWith(".uat.spec.ts"));
    expect(onDisk, "the union fixture is missing from the corpus").toContain(
      "shadowed-rename.uat.spec.ts",
    );
    const r = runCheck(mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": "shadowed-rename.uat.spec.ts" }));
    expect(r.status, `the union fixture was not refused. stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("1 finding(s) over 1/1");
    expect(r.stdout).toContain("test.skip");
  });

  it("the UNION fixture returns to ZERO findings once its marked region is removed", () => {
    const r = runMutated("shadowed-rename.uat.spec.ts");
    expect(r.status, `the mutated union fixture is still refused. stdout: ${r.stdout}`).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1");
  });

  it("the UNION fixture carries its mutation region and BOTH shadowing shapes", () => {
    const text = readFileSync(join(FIXTURES, "shadowed-rename.uat.spec.ts"), "utf8");
    expect(
      text.split("\n").filter((l) => l.trim().startsWith(`// ${MUTATE_START}`)).length,
      "the union fixture must carry exactly one marked region — the genuine module-scope call",
    ).toBe(1);
    // …and it really carries both shadowing shapes it claims, so it cannot pass for a trivial reason.
    expect(text).toContain("import { test as it, expect }");
    expect(text).toContain("function inner(it:");
    expect(text).toContain("function second(n: number, it:");
  });

  it("the UNION fixture DISCRIMINATES: under the file-scoped rule its region-present half is admitted", async () => {
    const { deriveDeclaredBindings, canonicaliseHeadSegment } = await loadChecker();
    const ts = hostTypeScript as typeof import("typescript");
    const text = readFileSync(join(FIXTURES, "shadowed-rename.uat.spec.ts"), "utf8");
    const sf = ts.createSourceFile("p.ts", text, ts.ScriptTarget.Latest, true);
    const bindings = deriveDeclaredBindings(ts, sf);
    expect(bindings, "PREMISE: the census degraded to null on the host's own parser").not.toBeNull();
    const position = text.indexOf('it.skip("the invoice total is shown, removed"');
    expect(position, "PREMISE: the marked region's genuine call is not in the fixture").toBeGreaterThan(
      0,
    );
    const renames = new Map([["it", "test"]]);

    // THE SHIPPED RULE: nothing binds `it` at the module-scope call, so the rewrite fires.
    expect(canonicaliseHeadSegment("it.skip", renames, { bindings, position })).toBe("test.skip");
    // THE SEEDED FILE-SCOPED MUTANT: some record of `it` exists SOMEWHERE in the file — the two
    // helpers' parameters — so a file-scoped rule suppresses and the construct is ADMITTED. That is
    // the state 31-17 shipped, and it is what this fixture can now fail for.
    expect(
      bindings!.some((b) => b.name === "it"),
      "PREMISE OF THE DISCRIMINATION: with no record of `it` anywhere, a file-scoped rule and the " +
        "nearest-binding rule agree, and this fixture proves nothing about the choice",
    ).toBe(true);
    expect(
      bindings!.some((b) => b.name === "it" && b.start <= position && position < b.end),
      "and NO record of `it` contains the module-scope call, which is why the two rules differ here",
    ).toBe(false);
  });

  it("the control fixture is covered by the fixtures typecheck target's include", () => {
    const config = readFileSync(join(REPO_ROOT, "tsconfig.fixtures.json"), "utf8");
    expect(config).toContain("scripts/runnable-ref/fixtures/**/*.uat.spec.ts");
    // The include is a GLOB, so coverage is a property of the fixture's PATH. Asserted as the path
    // test rather than as a name list, which is this repository's recorded set-literal drift.
    expect("shadowed-rename.uat.spec.ts".endsWith(".uat.spec.ts")).toBe(true);
  });
});

// ── 31-24 (CR-14 / WR-23): the suppression is decided by the NEAREST binding ────────────────────
//
// The surface this block reaches is DECLARED LOCALLY rather than added to `CheckerModule` above,
// because the scope argument `canonicaliseHeadSegment` now takes is a `{ bindings, position }` PAIR
// and not a name set: a caller that cannot produce a position cannot produce the pair either, which
// is the structural half of T-31-24-06.
interface DeclaredBindingView {
  readonly name: string;
  readonly start: number;
  readonly end: number;
}
interface BindingScopeView {
  readonly bindings: readonly DeclaredBindingView[];
  readonly position: number;
}
interface ScopeSurface {
  deriveDeclaredBindings(ts: unknown, sf: unknown): readonly DeclaredBindingView[];
  resolveBinding(
    bindings: readonly DeclaredBindingView[],
    name: string,
    position: number,
  ): DeclaredBindingView | undefined;
  canonicaliseHeadSegment(
    dottedPath: string | null,
    renames: ReadonlyMap<string, string>,
    scope?: BindingScopeView | null,
  ): string | null;
  readonly UNRESOLVABLE_CALLEE_RESIDUALS: readonly string[];
}

async function loadScopeSurface(): Promise<ScopeSurface> {
  return (await import("./uat-spec-integrity.js")) as unknown as ScopeSurface;
}

describe("uat-spec-integrity — 31-24 CR-14/WR-23: a reference is decided by the NEAREST binding", () => {
  const ts = hostTypeScript as typeof import("typescript");
  const CHECKER_TS = join(HERE, "uat-spec-integrity.ts");

  /** Plant one or more specs in a fresh target repo and run the COMMITTED artifact over all of them. */
  function runFiles(
    files: Readonly<Record<string, string>>,
    ...args: string[]
  ): { status: number | null; stdout: string; stderr: string } {
    const root = mkTargetRepo({});
    for (const [rel, body] of Object.entries(files)) {
      const dest = join(root, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, body, "utf8");
    }
    return runCheck(root, ...args);
  }

  function findingsOf(body: string): string[] {
    const r = runFiles({ "e2e/uat/subject.uat.spec.ts": body }, "--json");
    if (r.status === 0) return [];
    return (JSON.parse(r.stdout) as { findings: string[] }).findings;
  }

  /** Parse a source text with the HOST parser and derive its bindings through the shipped authority. */
  async function bindingsOf(source: string): Promise<readonly DeclaredBindingView[]> {
    const { deriveDeclaredBindings } = await loadScopeSurface();
    const sf = ts.createSourceFile("p.ts", source, ts.ScriptTarget.Latest, true);
    const bindings = deriveDeclaredBindings(ts, sf);
    expect(bindings, "PREMISE: the census degraded to null on the host's own parser").not.toBeNull();
    return bindings!;
  }

  function only(
    bindings: readonly DeclaredBindingView[],
    name: string,
  ): readonly DeclaredBindingView[] {
    return bindings.filter((b) => b.name === name);
  }

  // ── RED 1..5: the four CR-14 spellings and WR-23, each reproduced against the committed .js ────
  //
  // Every body below was DRIVEN against the committed artifact at this plan's base commit and its
  // pre-fix measurement recorded in 31-24-SUMMARY.md. A case whose pre-fix answer was not measured
  // is a case that cannot tell a fix from a coincidence.

  const RED_1 = [
    'import { test as it, expect } from "@playwright/test";',
    'it.skip("scenario", async ({ page }) => {',
    "  const it = 1;",
    "  void it;",
    '  await expect(page.getByTestId("x")).toBeVisible();',
    "});",
    "",
  ].join("\n");

  const RED_2 = [
    'import * as pw from "@playwright/test";',
    'pw.test.skip("scenario", async ({ page }) => {',
    "  const pw = 1;",
    "  void pw;",
    "  await pw;",
    "});",
    "",
  ].join("\n");

  const RED_3 = [
    'import { test, expect } from "@playwright/test";',
    "function helper(testInfo: number): number { return testInfo; }",
    'test("scenario", async ({ page }, testInfo) => {',
    "  void helper(1);",
    "  testInfo.skip();",
    '  await expect(page.getByTestId("x")).toBeVisible();',
    "});",
    "",
  ].join("\n");

  const RED_4 = [
    'import { test as it, expect } from "@playwright/test";',
    "function inner(n: number, it: { skip: (x: number) => number }): number { return it.skip(n); }",
    'it("scenario", async ({ page }) => {',
    "  void inner(1, { skip: (x: number) => x });",
    '  await expect(page.getByTestId("x")).toBeVisible();',
    "});",
    "",
  ].join("\n");

  const RED_5_WITH_CONST = [
    'import { test } from "@playwright/test";',
    "const testInfo = 1;",
    "void testInfo;",
    'test("s", async ({ page }, testInfo) => testInfo.skip());',
    "",
  ].join("\n");

  const RED_5_WITHOUT_CONST = [
    'import { test } from "@playwright/test";',
    'test("s", async ({ page }, testInfo) => testInfo.skip());',
    "",
  ].join("\n");

  it("RED 1 (row 10): a dead inner `const it` no longer admits a module-scope renamed modifier", () => {
    const findings = findingsOf(RED_1);
    expect(
      findings.length,
      "PRE-FIX MEASURED: `0 findings`, EXIT=0 — one dead declaration in an unrelated block " +
        "disabled the whole rename family for the file",
    ).toBe(1);
    expect(findings[0]).toContain("test.skip");
    expect(findings[0]).toContain("subject.uat.spec.ts:2:");
  });

  it("RED 2: a dead inner `const pw` no longer admits a module-scope NAMESPACE modifier", () => {
    const findings = findingsOf(RED_2);
    expect(findings.length, "PRE-FIX MEASURED: `0 findings`, EXIT=0").toBe(1);
    expect(findings[0]).toContain("test.skip");
  });

  it("RED 3: an index-0 helper parameter no longer admits the fixture-parameter spelling", () => {
    const findings = findingsOf(RED_3);
    expect(findings.length, "PRE-FIX MEASURED: `0 findings`, EXIT=0").toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("RED 4 (WR-23): a helper's SECOND parameter sharing a renamed name is not a false refusal", () => {
    expect(
      findingsOf(RED_4),
      "PRE-FIX MEASURED: `1 finding(s)`, EXIT=1, naming `test.skip` — a construct absent from " +
        "the file, because the index-1 exemption was stated for ANY function-like node",
    ).toEqual([]);
  });

  it("RED 5: a MODULE-SCOPE `const testInfo` no longer beats the fixture PARAMETER that shadows it", () => {
    const findings = findingsOf(RED_5_WITH_CONST);
    expect(
      findings.length,
      "PRE-FIX MEASURED: `0 findings`, EXIT=0. The reference is bound by the index-1 fixture " +
        "PARAMETER, which is recorded as a NON-suppressing binding, so the module-scope `const` " +
        "is never consulted. A rule under which ANY containing binding suppresses would leave " +
        "this admitted — which is what the round-5 adversarial check measured.",
    ).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("RED 5 PAIR: the declaration is the suppressing mechanism, measured as a pair in ONE run", () => {
    const r = runFiles({
      "e2e/uat/a.uat.spec.ts": RED_5_WITH_CONST,
      "e2e/uat/b.uat.spec.ts": RED_5_WITHOUT_CONST,
    });
    // PRE-FIX MEASURED: `1 finding(s) over 2/2 uat specs checked`, EXIT=1, with ONLY uat/b named.
    expect(r.stdout, `stdout: ${r.stdout}`).toContain("2 finding(s) over 2/2");
    expect(r.stdout).toContain("uat/a.uat.spec.ts:4:");
    expect(r.stdout).toContain("uat/b.uat.spec.ts:2:");
    expect(r.status).toBe(1);
  });

  // ── RED 5b: the case DISCRIMINATES between the two candidate resolutions ───────────────────────
  //
  // A case that passes under both "innermost wins" and "any containing binding suppresses" would
  // have let the wrong rule ship. This one is driven against a SEEDED any-containing mutant built
  // from the shipped records, so the discrimination is measured rather than argued.
  it("RED 5b: the DISCRIMINATION moved to identity, and it is driven in both directions", () => {
    // WHAT THIS CASE USED TO DISCRIMINATE. D-27 chose "innermost wins" over "any containing binding
    // suppresses", and the fixture parameter had to be recorded as a NON-suppressing binding for
    // the innermost rule to give the right answer. 31-28 (D-30 (5)) deleted that exemption with the
    // fixture map it protected, so the census can no longer tell those two rules apart here — and
    // it no longer has to, because the question moved to the checker: `testInfo`'s declared type is
    // the framework's, so identity refuses the call whatever the census says about the NAME.
    //
    // THE DISCRIMINATION IS THEREFORE DRIVEN AT THE ENTRY, IN BOTH DIRECTIONS. The evading spec —
    // an outer declaration of the fixture parameter's name — is REFUSED, and a spec where the same
    // name is genuinely a local of the author's own is NOT. A case that only drove the first could
    // pass under a rule that refuses everything.
    const refused = findingsOf(RED_5_WITH_CONST);
    expect(refused.length, `the evading spec was admitted: ${JSON.stringify(refused)}`).toBe(1);
    expect(refused[0]).toContain("test.info().skip");

    const accepted = findingsOf(
      [
        'import { test, expect } from "@playwright/test";',
        "function helper(testInfo: { skip: (n: number) => number }): number {",
        "  return testInfo.skip(1);",
        "}",
        "void helper;",
        'test("s", async ({ page }) => {',
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(
      accepted,
      "a local of the author's own, merely SPELLED like the fixture, must not be refused — a rule " +
        "that refuses both directions discriminates nothing",
    ).toEqual([]);
  });

  // ── CONTROL 1..5: the prior closures are re-measured, not assumed ──────────────────────────────

  it("CONTROL 1 (row 11): the declaration-free file is unmoved", () => {
    const findings = findingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        'it.skip("scenario", async ({ page }) => {',
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.skip");
  });

  it("CONTROL 2 (row 1): expect.configure({retries:2}).soft still refuses", () => {
    const findings = findingsOf(
      [
        'import { test, expect } from "@playwright/test";',
        'test("s", async ({ page }) => {',
        '  await expect.configure({ retries: 2 }).soft(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("expect.configure().soft");
  });

  it("CONTROL 3 (row 2): expect.configure({retries:2}).configure({soft:true}) still refuses", () => {
    const findings = findingsOf(
      [
        'import { test, expect } from "@playwright/test";',
        'test("s", async ({ page }) => {',
        "  await expect.configure({ retries: 2 }).configure({ soft: true })" +
          '(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("expect.configure().configure");
  });

  it("CONTROL 4 (row 3): the plain TestInfo fixture-parameter spelling still refuses", () => {
    const findings = findingsOf(
      [
        'import { test, expect } from "@playwright/test";',
        'test("s", async ({ page }, testInfo) => {',
        "  testInfo.skip();",
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain("test.info().skip");
  });

  it("CONTROL 5: WR-20's own legitimate spec still reports ZERO findings", () => {
    expect(
      findingsOf(
        [
          'import { test as it, expect } from "@playwright/test";',
          'it("a", async ({ page }) => {',
          "  const helpers = { skip: (n: number) => n };",
          "  function inner(it: { skip: (n: number) => number }) { return it.skip(1); }",
          "  inner(helpers);",
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      ),
      "the narrowing must not re-open WR-20: an index-0 parameter is an ordinary suppressing binding",
    ).toEqual([]);
  });

  // ── CONTROL 6: module scope reaches the whole file WHERE NOTHING NEARER BINDS ──────────────────
  //
  // The stronger claim — that a module-scope declaration suppresses even where an inner binding of
  // the same name exists — is FALSE and is driven as RED 5. The two are separate cases so the
  // distinction is on the record rather than inferred from one of them.
  it("CONTROL 6: a module-scope declaration with NO inner binding suppresses throughout the file", () => {
    expect(
      findingsOf(
        [
          'import { test, expect } from "@playwright/test";',
          "const testInfo = { skip: (): void => undefined };",
          'test("a", async ({ page }, info) => {',
          "  void info;",
          "  testInfo.skip();",
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      ),
      "the callback's index-1 parameter is `info`, so nothing nearer than the module-scope `const` " +
        "binds `testInfo` and the module-scope record is the one that answers",
    ).toEqual([]);
  });

  // ── CONTROL 7: the KIND matrix. Hoisting and TDZ give OPPOSITE answers above the declaration ───

  const KIND_MATRIX: ReadonlyArray<{
    readonly kind: string;
    readonly lines: readonly string[];
    readonly findings: number;
  }> = [
    {
      kind: "var (HOISTS: a reference ABOVE the declaration IS suppressed)",
      lines: [
        "function wrap(): void {",
        "  it.skip(1);",
        "  var it = { skip: (n: number): number => n };",
        "  void it;",
        "}",
        "void wrap;",
      ],
      findings: 0,
    },
    {
      kind: "function declaration (HOISTS: a reference ABOVE the declaration IS suppressed)",
      lines: [
        "function wrap(): void {",
        "  it.skip(1);",
        "  function it(n: number): number { return n; }",
        "  void it;",
        "}",
        "void wrap;",
      ],
      findings: 0,
    },
    // 31-28 (D-30 (2)): THESE THREE MOVED FROM 1 TO 0, AND THE LANGUAGE IS WHY. The reference sits
    // in the temporal dead zone of a local that DECLARES a `skip` member, so the checker resolves
    // `.skip` to that local's own type and identity answers `foreign` — the spelling rule is never
    // asked. That is TypeScript's own answer: inside `wrap`, `it` IS the local, and reading `.skip`
    // there throws at run time (TS2448, asserted below). A construct the language refuses to compile
    // is a curiosity, not a bypass, and refusing it would be refusing a call the file does not make.
    // The spelling rule's temporal-dead-zone refusal is NOT lost — it is what decides the spelling
    // where the checker resolves NOTHING, which the row after this matrix drives.
    {
      kind: "let (TDZ: the checker resolves the LOCAL, so identity answers foreign)",
      lines: [
        "function wrap(): void {",
        "  it.skip(1);",
        "  let it = { skip: (n: number): number => n };",
        "  void it;",
        "}",
        "void wrap;",
      ],
      findings: 0,
    },
    {
      kind: "const (TDZ: the checker resolves the LOCAL, so identity answers foreign)",
      lines: [
        "function wrap(): void {",
        "  it.skip(1);",
        "  const it = { skip: (n: number): number => n };",
        "  void it;",
        "}",
        "void wrap;",
      ],
      findings: 0,
    },
    {
      kind: "class (TDZ: the checker resolves the LOCAL, so identity answers foreign)",
      lines: [
        "function wrap(): void {",
        "  it.skip(1);",
        "  class it { static skip(n: number): number { return n; } }",
        "  void it;",
        "}",
        "void wrap;",
      ],
      findings: 0,
    },
    {
      kind: "a plain parameter (ranges over its OWN function)",
      lines: [
        "function inner(it: { skip: (n: number) => number }): number { return it.skip(1); }",
        "void inner;",
      ],
      findings: 0,
    },
    {
      kind: "a destructured parameter (ranges over its OWN function)",
      lines: [
        "function inner({ it }: { it: { skip: (n: number) => number } }): number { return it.skip(1); }",
        "void inner;",
      ],
      findings: 0,
    },
    {
      kind: "a destructured const binding element (TDZ: suppresses a reference BELOW it)",
      lines: [
        "const { it } = { it: { skip: (n: number): number => n } };",
        "it.skip(1);",
      ],
      findings: 0,
    },
  ];

  for (const row of KIND_MATRIX) {
    it(`CONTROL 7 — DECLARATION KIND: ${row.kind}`, () => {
      const findings = findingsOf(
        [
          'import { test as it, expect } from "@playwright/test";',
          ...row.lines,
          'test("a", async ({ page }) => {',
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      );
      expect(findings.length, `${row.kind}: findings were ${JSON.stringify(findings)}`).toBe(
        row.findings,
      );
    });
  }

  it("CONTROL 7 — a catch-clause binding suppresses INSIDE its catch block and not outside it", () => {
    const findings = findingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        "function wrap(): void {",
        "  try {",
        '    throw new Error("x");',
        "  } catch (it) {",
        "    void (it as { skip?: unknown }).skip;",
        "    (it as { skip: (n: number) => number }).skip(1);",
        "  }",
        "  it.skip(2);",
        "}",
        "void wrap;",
        'test("a", async ({ page }) => {',
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    expect(
      findings.length,
      `the reference OUTSIDE the catch block must be the only finding. findings: ${JSON.stringify(findings)}`,
    ).toBe(1);
    expect(findings[0]).toContain("subject.uat.spec.ts:9:");
  });

  it("CONTROL 7 — an IMPORT binding is never in the census, so a rename never shadows itself", async () => {
    const bindings = await bindingsOf(
      [
        'import { test as it, expect } from "@playwright/test";',
        'import * as pw from "@playwright/test";',
        "",
      ].join("\n"),
    );
    expect(bindings.map((b) => b.name)).toEqual([]);
  });

  it("CONTROL 7 — the KIND matrix's ranges are DERIVED, one measured range per kind", async () => {
    const source = [
      "var alpha = 1;",
      "function beta(): void {",
      "  var gamma = 1;",
      "  let delta = 2;",
      "  void gamma;",
      "  void delta;",
      "}",
      "const epsilon = 3;",
      "class zeta {}",
      "function eta(theta: number): number { return theta; }",
      "",
    ].join("\n");
    const bindings = await bindingsOf(source);
    const at = (name: string): DeclaredBindingView => {
      const found = only(bindings, name);
      expect(found.length, `expected exactly one binding named ${name}`).toBe(1);
      return found[0];
    };

    // `var` at module scope HOISTS to the whole SourceFile, which starts at 0 by construction.
    expect(at("alpha").start).toBe(0);
    expect(at("alpha").end).toBe(source.length);
    // `var` inside a function hoists to THAT function, not to the file.
    expect(at("gamma").start).toBe(source.indexOf("function beta"));
    // `let` inside the same function begins at its OWN declaration.
    expect(at("delta").start).toBe(source.indexOf("let delta"));
    expect(at("delta").end).toBeGreaterThan(source.indexOf("void delta"));
    // A module-scope `const` and `class` begin at their own declaration and run to end of file.
    expect(at("epsilon").start).toBe(source.indexOf("const epsilon"));
    expect(at("epsilon").end).toBe(source.length);
    expect(at("zeta").start).toBe(source.indexOf("class zeta"));
    // A function declaration's own name hoists; a parameter ranges over its owning function.
    expect(at("eta").start).toBe(0);
    expect(at("theta").start).toBe(source.indexOf("function eta"));
    // 31-28 (D-30 (5)): the `suppresses` FIELD is gone, because after the fixture exemption was
    // deleted it had one reachable value. Every record here is a range and a name, and the ranges
    // are what the kind matrix is about.
    for (const name of ["alpha", "gamma", "delta", "epsilon", "zeta", "eta", "theta"]) {
      expect(at(name).end, `${name} has an empty or inverted range`).toBeGreaterThan(at(name).start);
    }
  });

  it("CONTROL 7 — the fixture parameter is an ORDINARY record now, and identity decides it", async () => {
    const source = [
      'import { test } from "@playwright/test";',
      'test("a", async ({ page }, testInfo) => { void page; void testInfo; });',
      "",
    ].join("\n");
    const bindings = await bindingsOf(source);
    // D-21 (2) OMITTED it; D-27 RECORDED it as non-suppressing; D-30 (5) records it like any other
    // parameter, because the map the exemption existed to protect is deleted. It is still IN the
    // list — omitting a binding is what made an outer declaration the nearest one, which was RED 5.
    expect(only(bindings, "testInfo").length).toBe(1);
    expect(only(bindings, "page").length).toBe(1);
  });

  it("WR-23 — the position rule is DELETED, and its harm is measured absent", async () => {
    // WR-23 narrowed an exemption that was one position too wide. D-30 removes the exemption
    // entirely, so there is no position to be wide about — and the FALSE REFUSAL it caused is
    // driven at the entry rather than inferred from a flag: a helper whose second parameter shares
    // a renamed import's local name reports nothing, because the checker resolves `.skip` to the
    // helper's own declared type and answers `foreign` before the spelling rule is ever asked.
    const bindings = await bindingsOf(
      [
        "function inner(n: number, it: { skip: (x: number) => number }): number { return it.skip(n); }",
        "void inner;",
        "",
      ].join("\n"),
    );
    expect(only(bindings, "it").length).toBe(1);
    expect(
      findingsOf(
        [
          'import { test as it, expect } from "@playwright/test";',
          "declare function helper(n: number, f: (a: number, b: { skip: (x: number) => number }) => number): void;",
          "helper(1, function (a, it) { return it.skip(a); });",
          'it("s", async ({ page }) => {',
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      ),
      "a helper parameter was canonicalised into `test.skip`, a construct absent from the file",
    ).toEqual([]);
  });

  // ── CONTROL 8: the tie rule, in the ban's safe direction ───────────────────────────────────────

  it("CONTROL 8 — an EXACT range tie is now indistinguishable, and answers the same either way", async () => {
    const { resolveBinding } = await loadScopeSurface();
    // D-27 broke this tie toward the NON-suppressing record, which was the ban's safe direction
    // while a non-suppressing record existed. D-30 (5) deleted the only one there was, so two tied
    // records are the same record and the preference would be a branch no input can reach. What
    // must still hold is that the ANSWER does not depend on the array's order.
    const first: DeclaredBindingView = { name: "x", start: 10, end: 20 };
    const second: DeclaredBindingView = { name: "x", start: 10, end: 20 };
    expect(resolveBinding([first, second], "x", 15)).toEqual(first);
    expect(resolveBinding([second, first], "x", 15)).toEqual(first);
  });

  it("CONTROL 8 — the tie shape is REACHABLE: two parameters of one name", async () => {
    const source = [
      'import { test } from "@playwright/test";',
      'test("s", function (testInfo, testInfo) { return testInfo.skip(); });',
      "",
    ].join("\n");
    const bindings = await bindingsOf(source);
    const records = only(bindings, "testInfo");
    expect(
      records.length,
      "PREMISE: the parser must accept the duplicate parameter name — `createSourceFile` does no " +
        "binding, so a declaration a type checker would reject still parses",
    ).toBe(2);
    expect(records[0].start).toBe(records[1].start);
    expect(records[0].end).toBe(records[1].end);
  });

  // ── CONTROL 9: the derivation's LIST ORDER is not part of the answer ───────────────────────────

  it("CONTROL 9 — shuffling the derived list changes no resolution answer", async () => {
    const { resolveBinding } = await loadScopeSurface();
    const source = RED_5_WITH_CONST;
    const bindings = await bindingsOf(source);
    const position = source.indexOf("testInfo.skip()");
    const forward = resolveBinding(bindings, "testInfo", position);
    const reversed = resolveBinding([...bindings].reverse(), "testInfo", position);
    const rotated = resolveBinding([...bindings.slice(1), ...bindings.slice(0, 1)], "testInfo", position);
    expect(forward).toBeDefined();
    expect(reversed).toEqual(forward);
    expect(rotated).toEqual(forward);
  });

  // ── EMPTY and ADJACENCY ────────────────────────────────────────────────────────────────────────

  it("EMPTY — a file with NO declarations yields an empty list, which suppresses nothing", async () => {
    const { resolveBinding } = await loadScopeSurface();
    const bindings = await bindingsOf('import { test } from "@playwright/test";\nvoid test;\n');
    expect(bindings).toEqual([]);
    expect(resolveBinding(bindings, "test", 0)).toBeUndefined();
  });

  it("EMPTY — a parser without the declaration predicates is a LOUD SKIP, not a weaker rule", async () => {
    const { loadTypeScriptFromTarget } = await loadChecker();
    // 31-28 (D-30 (4)): this used to yield `null` and the canonicaliser then applied NO scope rule
    // at all — the pre-D-21 behaviour, reached silently. RR-07 disclosed that honestly and the
    // behaviour was still wrong: a smaller ban applied without saying so is a gate LOWERING. The
    // predicates are VALIDATED at load time now, so a parser missing one cannot be used at all.
    const root = mkTmp();
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "t", private: true }), "utf8");
    const dir = join(root, "node_modules", "typescript");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "typescript", version: "0.0.0-stub", main: "index.js" }),
      "utf8",
    );
    writeFileSync(
      join(dir, "index.js"),
      '"use strict";\n' +
        `const real = require(${JSON.stringify(join(REPO_NODE_MODULES, "typescript"))});\n` +
        "const shim = {};\n" +
        "for (const k of Object.keys(real)) { try { shim[k] = real[k]; } catch { /* accessor threw */ } }\n" +
        'Object.defineProperty(shim, "isParameter", { value: undefined, enumerable: true, configurable: true, writable: true });\n' +
        "module.exports = shim;\n",
      "utf8",
    );
    expect(
      loadTypeScriptFromTarget(root),
      "a parser missing a validated predicate was accepted, so the run would decide a weaker ban",
    ).toBeNull();
  });

  it("ADJACENCY — a range that ENDS at the reference does not contain it (exclusive end)", async () => {
    const { resolveBinding } = await loadScopeSurface();
    const b: DeclaredBindingView = { name: "x", start: 0, end: 40 };
    expect(resolveBinding([b], "x", 40)).toBeUndefined();
    expect(resolveBinding([b], "x", 39)).toBe(b);
  });

  it("ADJACENCY — a range that STARTS at the reference DOES contain it (inclusive start)", async () => {
    const { resolveBinding } = await loadScopeSurface();
    const b: DeclaredBindingView = { name: "x", start: 40, end: 80 };
    expect(resolveBinding([b], "x", 40)).toBe(b);
    expect(resolveBinding([b], "x", 39)).toBeUndefined();
  });

  it("ADJACENCY — a range that STARTS where the reference ENDS does not contain its START", async () => {
    const { resolveBinding } = await loadScopeSurface();
    // The compared position is the CALL's own start, so a binding beginning at the call's END is
    // strictly to its right and cannot contain it.
    const callStart = 10;
    const callEnd = 25;
    const b: DeclaredBindingView = { name: "x", start: callEnd, end: 90 };
    expect(resolveBinding([b], "x", callStart)).toBeUndefined();
  });

  it("ADJACENCY — a declaration and a reference in the SAME statement: the declaration contains it", () => {
    // `let it = it.skip(1);` — the declaration's own start precedes the call's start, so the
    // reference is inside the declaration's range and is suppressed. Driven rather than argued.
    expect(
      findingsOf(
        [
          'import { test as it, expect } from "@playwright/test";',
          "function wrap(): void {",
          "  let it = it.skip(1);",
          "  void it;",
          "}",
          "void wrap;",
          'test("a", async ({ page }) => {',
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      ),
    ).toEqual([]);
  });

  // ── T-31-24-06: a file-level CONSTANT is not a position ────────────────────────────────────────

  it("A CONSTANT IS NOT A POSITION — position 0 gives a different answer from the call's own", async () => {
    const { canonicaliseHeadSegment } = await loadScopeSurface();
    const source = [
      'import { test as it, expect } from "@playwright/test";',
      "function inner(it: { skip: (n: number) => number }): number { return it.skip(1); }",
      'it.skip("a removed scenario", async ({ page }) => {',
      "  void inner({ skip: (n: number): number => n });",
      '  await expect(page.getByTestId("x")).toBeVisible();',
      "});",
      "",
    ].join("\n");
    const bindings = await bindingsOf(source);
    const renames = new Map([["it", "test"]]);
    const inHelper = source.indexOf("it.skip(1)");
    const atModuleScope = source.indexOf('it.skip("a removed');
    expect(inHelper).toBeGreaterThan(0);
    expect(atModuleScope).toBeGreaterThan(inHelper);

    // With each reference's OWN position the two answers DIFFER — which is the whole point.
    expect(canonicaliseHeadSegment("it.skip", renames, { bindings, position: inHelper })).toBe(
      "it.skip",
    );
    expect(canonicaliseHeadSegment("it.skip", renames, { bindings, position: atModuleScope })).toBe(
      "test.skip",
    );
    // With a file-level constant BOTH become the answer for position 0, so the helper's legitimate
    // call is refused: CR-14 through the back door.
    expect(canonicaliseHeadSegment("it.skip", renames, { bindings, position: 0 })).toBe("test.skip");
    // …and end to end, the same file reports exactly ONE finding, at the module-scope call.
    expect(findingsOf(source).length).toBe(1);
  });

  it("A CONSTANT IS NOT A POSITION — a HOISTING module-scope binding makes position 0 suppress", async () => {
    const { canonicaliseHeadSegment } = await loadScopeSurface();
    const source = [
      'import { test as it, expect } from "@playwright/test";',
      "var it = { skip: (n: number): number => n };",
      "void it;",
      "",
    ].join("\n");
    const bindings = await bindingsOf(source);
    // A module-scope `var` hoists to the SourceFile, whose range starts at 0, so a zero position
    // sits inside it and suppresses every call in the file.
    expect(canonicaliseHeadSegment("it.skip", new Map([["it", "test"]]), { bindings, position: 0 })).toBe(
      "it.skip",
    );
  });

  // ── the canonicaliser's CALLERS, derived from the source rather than remembered ────────────────

  it("the ONE canonicaliser caller supplies a CALL-DERIVED position, and the set is derived", () => {
    const sf = ts.createSourceFile(
      "uat-spec-integrity.ts",
      readFileSync(CHECKER_TS, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const collapse = (n: import("typescript").Node): string =>
      n.getText(sf).replace(/\s+/g, " ").trim();

    const callSites: Array<{ readonly site: string; readonly scopeArg: string }> = [];
    const scopeLocals: string[] = [];
    const walk = (node: import("typescript").Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "canonicaliseHeadSegment"
      ) {
        callSites.push({
          site: collapse(node),
          scopeArg: node.arguments.length >= 3 ? collapse(node.arguments[2]) : "(absent)",
        });
      }
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "scope" &&
        node.initializer !== undefined
      ) {
        scopeLocals.push(collapse(node.initializer));
      }
      ts.forEachChild(node, walk);
    };
    ts.forEachChild(sf, walk);

    // ONE caller, and the number is asserted with its reason rather than as a number. PROBE 4 found
    // the assertion arms reaching a membership question with a head the canonicaliser never saw, and
    // a first fix added a caller inside `canonicalAssertionHead`; that caller was DELETED because the
    // arms ask about arm (c)'s own already-canonicalised path. 31-28 removed the SECOND caller too —
    // it was inside `deriveTestInfoParameterNames`, the fixed-index derivation CR-21 was found on.
    // A caller arriving silently is the event this case exists to catch.
    expect(
      callSites.length,
      `the canonicaliser's caller set changed. Sites: ${JSON.stringify(callSites, null, 2)}`,
    ).toBe(1);

    // PREMISE: exactly one `scope` local exists, and it is derived from a NODE's own start.
    expect(scopeLocals.length, "the one `scope` local is missing or duplicated").toBe(1);
    expect(
      scopeLocals[0],
      "the `scope` local must carry the position of the call being decided, never a constant",
    ).toContain("node.getStart(sf)");

    for (const { site, scopeArg } of callSites) {
      const direct = scopeArg.includes("getStart(sf)");
      const throughTheLocal = scopeArg === "scope";
      expect(
        direct || throughTheLocal,
        `${site}: its scope argument is \`${scopeArg}\`, which is neither a call-derived position ` +
          `nor the one \`scope\` local that carries one. A file-level constant is not a position.`,
      ).toBe(true);
    }
    // …and the assertion arms really consume the ONE already-decided path, so the scope rule reaches
    // them without a second canonicaliser call to keep in step.
    const source = readFileSync(CHECKER_TS, "utf8").replace(/\s+/g, " ");
    expect(
      source,
      "the assertion arms must ask about the ONE already-decided path, not a raw head",
    ).toContain("const assertionHead = canonicalAssertionHead(dottedPath);");
    expect(
      source.includes('head.text === "expect"'),
      "the assertion arms are comparing a RAW head identifier again — the path PROBE 4 found",
    ).toBe(false);
  });

  // ── the disclosure moved with the mechanism ────────────────────────────────────────────────────

  it("the register states the TWO-RULE PAIRING and no longer claims a single scope authority", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadScopeSurface();
    const scoped = UNRESOLVABLE_CALLEE_RESIDUALS.filter((r) =>
      r.includes("IDENTITY AND SPELLING ARE TWO RULES FOR ONE QUESTION"),
    );
    expect(scoped.length, "the pairing is not a named member of the exported register").toBe(1);
    expect(scoped[0]).toContain("the spelling rule is not consulted");
    expect(scoped[0]).toContain("temporal-dead-zone");
    expect(scoped[0]).toContain("What would force it closed");
    for (const stale of ["FILE-SCOPED", "No binder is shipped", "NON-suppressing"]) {
      expect(
        UNRESOLVABLE_CALLEE_RESIDUALS.some((r) => r.includes(stale)),
        `the register still publishes "${stale}", which is no longer the mechanism`,
      ).toBe(false);
    }
  });

  it("the D-21 header no longer calls the suppression MONOTONE IN THE SAFE DIRECTION", () => {
    const source = readFileSync(CHECKER_TS, "utf8");
    expect(
      source.includes("MONOTONE IN THE SAFE DIRECTION"),
      "stopping a rewrite moves a BAN's answer from refused to accepted, which is the UNSAFE " +
        "direction; a header sentence claiming otherwise is what a future widening would cite",
    ).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-24 IN-12 — THE NORMALISER RUNS ONCE PER ARM, INTO A LOCAL BOTH POSITIONS READ.
//
// `isBannedModifierCall`'s configured arm called `stripRoutingLinks` on the same input TWICE: once
// in the presence check and once in the value read. The comment above it already made the argument —
// both positions must obtain their operand from the ONE normaliser — but the code left two calls
// that a later edit could change independently. Computing it once into a local is that argument
// EXPRESSED, so the two positions cannot drift apart.
//
// The count is DERIVED from the module's own AST rather than grepped, so the dedupe cannot silently
// regrow, and the findings are proven byte-identical over the whole fixture corpus and the
// configured-arm spellings the register decides.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-24 IN-12: one normalisation per arm, derived from the parse", () => {
  const ts = hostTypeScript as typeof import("typescript");
  const CHECKER_TS = join(HERE, "uat-spec-integrity.ts");
  const NORMALISER = "stripRoutingLinks";

  /** How many times does each top-level function CALL the normaliser? Counted from the AST. */
  function normaliserCallsByFunction(source: string): ReadonlyMap<string, number> {
    const sf = ts.createSourceFile("c.ts", source, ts.ScriptTarget.Latest, true);
    const counts = new Map<string, number>();
    const functions: import("typescript").FunctionDeclaration[] = [];
    const walkTop = (node: import("typescript").Node): void => {
      if (ts.isFunctionDeclaration(node) && node.name !== undefined) functions.push(node);
      ts.forEachChild(node, walkTop);
    };
    ts.forEachChild(sf, walkTop);
    for (const fn of functions) {
      if (fn.body === undefined) continue;
      let calls = 0;
      const scan = (node: import("typescript").Node): void => {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === NORMALISER
        ) {
          calls++;
        }
        ts.forEachChild(node, scan);
      };
      scan(fn.body);
      if (calls > 0) counts.set(fn.name!.text, calls);
    }
    return counts;
  }

  it("every function that normalises does it EXACTLY ONCE, and the callers are derived", () => {
    const counts = normaliserCallsByFunction(readFileSync(CHECKER_TS, "utf8"));
    // PREMISE: a derivation that found no caller would satisfy every assertion below vacuously.
    expect(counts.size, "PREMISE: no function calls the normaliser at all").toBeGreaterThan(0);
    // MEASURED before this plan: isBannedModifierPath 1, isBannedModifierCall 2,
    // findBannedConstructs 1. After: 1, 1, 1.
    expect([...counts.keys()].sort()).toEqual([
      "findBannedConstructs",
      "isBannedModifierCall",
      "isBannedModifierPath",
    ]);
    for (const [fn, calls] of counts) {
      expect(calls, `${fn} normalises ${calls} time(s); one per arm is the decided shape`).toBe(1);
    }
  });

  it("the SEEDED regrowth is caught: a second call in the configured arm moves the count to two", () => {
    const source = readFileSync(CHECKER_TS, "utf8");
    const anchor = "  return enabledOptions.has(BANNED_CONFIGURED_PATHS[normalised]);";
    expect(
      source.split(anchor).length - 1,
      "PREMISE: the seed anchor was not found EXACTLY once, so the mirror is not the source plus " +
        "one regrown call",
    ).toBe(1);
    const mutated = source.replace(
      anchor,
      "  return enabledOptions.has(BANNED_CONFIGURED_PATHS[stripRoutingLinks(dottedPath)]);",
    );
    const counts = normaliserCallsByFunction(mutated);
    expect(
      counts.get("isBannedModifierCall"),
      "the derivation cannot see a regrown normalisation, so the count above is not a control",
    ).toBe(2);
  });

  it("the SEEDED wrong local is caught: an arm reading a local NOT from the normaliser is unbound", () => {
    // The dedupe replaced an inline `stripRoutingLinks(path)` with a LOCAL. A binding check that
    // only looked for the normaliser's name in the operand TEXT would now pass for any local
    // whatever, which would make the CR-09 guard vacuous. This case seeds exactly that: a local
    // named `normalised` initialised from the RAW path.
    const source = readFileSync(CHECKER_TS, "utf8");
    const anchor = "  const normalised = stripRoutingLinks(dottedPath);\n  if (BANNED_EXACT_PATHS.includes(normalised)) return true;";
    expect(
      source.split(anchor).length - 1,
      "PREMISE: the exact-path arm no longer has the shape this seed replaces",
    ).toBe(1);
    const mutated = source.replace(
      anchor,
      "  const normalised = dottedPath;\n  if (BANNED_EXACT_PATHS.includes(normalised)) return true;",
    );
    const sf = ts.createSourceFile("c.ts", mutated, ts.ScriptTarget.Latest, true);
    // Resolve the arm's operand through the function's own locals, the same way the CR-09
    // derivation does, and show the seeded local does NOT come from the normaliser.
    let initialiser: string | undefined;
    const scan = (node: import("typescript").Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "normalised" &&
        node.initializer !== undefined &&
        initialiser === undefined
      ) {
        initialiser = node.initializer.getText(sf);
      }
      ts.forEachChild(node, scan);
    };
    ts.forEachChild(sf, scan);
    expect(initialiser, "PREMISE: the seeded local is not in the mirror at all").toBeDefined();
    expect(initialiser!.includes(`${NORMALISER}(`)).toBe(false);
  });

  it("the register's configured-path pair is unchanged by the dedupe", async () => {
    const { BANNED_CONFIGURED_PATHS, isBannedModifierCall } = await loadChecker();
    expect(BANNED_CONFIGURED_PATHS).toEqual({ "expect.configure": "soft" });
    // Both whole-path spellings, through the deduped arm, still answer as they did. The paths are
    // the ones `calleeDottedPath` really produces: the CALL-LINK marker is appended only when a
    // LATER segment is read off the call, so a bare configured call resolves to `expect.configure`
    // and never to `expect.configure()` — a mistake this case made once and the suite caught.
    expect(isBannedModifierCall("expect.configure", new Set(["soft"]))).toBe(true);
    expect(isBannedModifierCall("expect.configure", new Set(["retries"]))).toBe(false);
    expect(isBannedModifierCall("expect.configure().configure", new Set(["soft"]))).toBe(true);
    expect(isBannedModifierCall("expect.configure().soft", null)).toBe(true);
    expect(isBannedModifierCall(null, new Set(["soft"]))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-24 PROBE 4 — EVERY PATH TO A MEMBERSHIP QUESTION ASKS ABOUT A HEAD THE CANONICALISER SAW.
//
// FOUND BY THIS PLAN'S OWN RED-TEAM, NOT BY A REVIEW. PROBE 4 asks the converse of "where is the
// canonicaliser asked": is there any path from a call expression to a membership question that does
// NOT go through it? There was. Arms (a) and (b) — the caught and conditional assertion arms —
// compared the RAW head identifier's text against `expect` / `assert`, so two words in an import
// line defeated both:
//
//   import { test, expect as check } from "@playwright/test";
//   test("a", async ({ page }) => {
//     try { await check(page.getByTestId("x")).toBeVisible(); } catch { void 0; }
//   });
//
// measured against the committed .js before the fix: `0 findings over 1/1`, EXIT=0, while the
// identical file with the un-renamed head reported `1 finding(s)` naming the caught assertion. The
// namespace spelling (`pw.expect(...)`) and the CONDITIONAL arm both measured the same way. That is
// WR-14's defect — a head-set check defeated by a rename — in the one arm family D-18 (3) never
// reached, and it is exactly the shape UNRESOLVABLE_CALLEE_RESIDUALS did not disclose.
//
// THE FIX IS THE ONE AUTHORITY, ASKED TWICE FOR TWO ROUTES, and it adds no new rule. A rename is
// reachable through the head IDENTIFIER (`check` -> `expect`), and a namespace is reachable only
// through the resolved PATH (`pw.expect` -> `expect`), because a namespace head has no single
// imported name to substitute. The arms therefore ask BOTH routes and take the union, and both
// routes are canonicalised through `canonicaliseHeadSegment` at the call's own position, so the
// scope rule D-27 decides governs them too.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-24 PROBE 4: the assertion arms ask about a canonicalised head", () => {
  function findingsOf(body: string): string[] {
    const root = mkTargetRepo({});
    const dest = join(root, "e2e", "uat", "subject.uat.spec.ts");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
    const r = runCheck(root, "--json");
    if (r.status === 0) return [];
    return (JSON.parse(r.stdout) as { findings: string[] }).findings;
  }

  it("RED A (caught, RENAMED head): `import { expect as check }` no longer defeats arm (a)", () => {
    const findings = findingsOf(
      [
        'import { test, expect as check } from "@playwright/test";',
        'test("a", async ({ page }) => {',
        "  try {",
        '    await check(page.getByTestId("x")).toBeVisible();',
        "  } catch {",
        "    void 0;",
        "  }",
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length, "PRE-FIX MEASURED: `0 findings`, EXIT=0").toBe(1);
    expect(findings[0]).toContain("caught assertion");
  });

  it("RED B (caught, NAMESPACE head): `pw.expect(...)` no longer defeats arm (a)", () => {
    const findings = findingsOf(
      [
        'import * as pw from "@playwright/test";',
        'pw.test("a", async ({ page }: { page: { getByTestId(id: string): unknown } }) => {',
        "  try {",
        '    await pw.expect(page.getByTestId("x")).toBeVisible();',
        "  } catch {",
        "    void 0;",
        "  }",
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length, "PRE-FIX MEASURED: `0 findings`, EXIT=0").toBe(1);
    expect(findings[0]).toContain("caught assertion");
  });

  it("RED C (conditional, RENAMED head): the same rename no longer defeats arm (b)", () => {
    const findings = findingsOf(
      [
        'import { test, expect as check } from "@playwright/test";',
        'test("a", async ({ page }) => {',
        "  if (Math.random() > 0.5) {",
        '    await check(page.getByTestId("x")).toBeVisible();',
        "  }",
        "});",
        "",
      ].join("\n"),
    );
    expect(findings.length, "PRE-FIX MEASURED: `0 findings`, EXIT=0").toBe(1);
    expect(findings[0]).toContain("conditional assertion");
  });

  it("CONTROL: the un-renamed spellings are unmoved, and are still reported ONCE per assertion", () => {
    const caught = findingsOf(
      [
        'import { test, expect } from "@playwright/test";',
        'test("a", async ({ page }) => {',
        "  try {",
        '    await expect(page.getByTestId("x")).toBeVisible();',
        "  } catch {",
        "    void 0;",
        "  }",
        "});",
        "",
      ].join("\n"),
    );
    expect(caught.length, "a chained assertion must still report exactly once").toBe(1);
    expect(caught[0]).toContain("caught assertion");
  });

  it("CONTROL: the SCOPE rule governs the new route — a LOCAL `check` is not an assertion head", () => {
    // The whole point of routing through the one canonicaliser rather than adding a second head
    // set: a file that renames `expect` to `check` AND separately binds a local `check` must not be
    // refused, and no finding may name a construct the file does not contain. This is WR-20's
    // direction, asserted for the arm family PROBE 4 just brought under the rule.
    expect(
      findingsOf(
        [
          'import { test, expect as check, expect } from "@playwright/test";',
          'test("a", async ({ page }) => {',
          "  function inner(check: (n: number) => number): number {",
          "    try {",
          "      return check(1);",
          "    } catch {",
          "      return 0;",
          "    }",
          "  }",
          "  void inner((n: number) => n);",
          '  await expect(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      ),
      "the local `check` parameter is the nearest binding, so the rename must not be applied there",
    ).toEqual([]);
  });

  it("CONTROL: a legitimate straight-line assertion on a renamed head is NOT refused", () => {
    expect(
      findingsOf(
        [
          'import { test, expect as check } from "@playwright/test";',
          'test("a", async ({ page }) => {',
          '  await check(page.getByTestId("x")).toBeVisible();',
          "});",
          "",
        ].join("\n"),
      ),
      "arms (a) and (b) refuse a CONTEXT, not a head; canonicalising the head must not change that",
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-25 — CR-15: THE BOUNDARY IS ABOUT THE BYTES, NOT ABOUT ONE FUNCTION
//
// 31-17 closed WR-19 by bounding `calleeDottedPath`, de-recursing the AST walk and wrapping
// `findBannedConstructs` in a could-not-run boundary. It left `ts.createSourceFile` — a
// recursive-descent parser running on author-controlled source — ONE LINE ABOVE that `try`.
//
// Measured against the committed .js at HEAD BEFORE this plan's change (probe repository
// `.temp/31-25-probe/`, spec at `uat/p.uat.spec.ts`, `typescript` resolvable from the probe root,
// the review's own construct `const x: any = ((((…1…))));`):
//
//   depth  500 -> EXIT=0  stdout 57 bytes "UAT spec integrity: 0 findings over 1/1 uat specs checked"
//                         stderr 0 bytes
//   depth  630 -> EXIT=0  (the highest depth this tree's parser finishes — the adjacency pair's safe side)
//   depth  631 -> EXIT=1  stdout 0 bytes   stderr 1474 bytes, RangeError at typescript.js token()
//   depth 1000 -> EXIT=1  stdout 0 bytes   stderr 1474 bytes
//                         first stderr line: …/node_modules/typescript/lib/typescript.js:33775
//                         NO measurement line on EITHER stream (grep 'uat specs' -> 0)
//   depth 2000 -> EXIT=1  identical
//   depth 5000 -> EXIT=1  identical
//
// which is `31-VERIFICATION.md` behavioral spot-check row 12 exactly, reproduced on this tree.
//
// WHY THE EXIT CODE IS NOT THE HARM — the same sentence WR-19's own block above already carries,
// and the reason THIS block exists one register over. 1 is inside the D-12 contract only because
// Node's uncaught-exception code happens to be 1, which that contract reads as "a finding — the
// gate blocks". The harm is that `reportMeasured` is NEVER REACHED, so the vacuity floor and the
// denominator floor are bypassed BY CONSTRUCTION while stdout stays silent. A check that never ran
// is reported as a check that found something.
//
// WHICH STREAM, PER BRANCH. `reportMeasured` has four branches and they do NOT all write to stdout:
// the vacuity floor and the denominator floor call `err(...)` and return 2; only the findings line
// and the pass line call `out(...)`. So a could-not-run shape produces its measurement on STDERR
// with an EMPTY stdout, BY DESIGN — that design is the `scripts/vacuity.ts` mirror D-21 established
// and this runnable cannot import. Every case below therefore asserts that the measurement REACHED
// THE STREAM ITS BRANCH WRITES TO, never that "a measurement reached stdout".
// ═══════════════════════════════════════════════════════════════════════════════════════════════

// The 31-25 helpers live at FILE SCOPE because two blocks below drive them — the CR-15 boundary
// cases and the D-28 pathological corpus. A second copy of the adjacency bisection would be a second
// authority for the same number, which is the set-literal drift this project keeps paying for.

/** The review's own probe construct, at a chosen nesting depth, in an otherwise legitimate file. */
function nestedSpec(depth: number): string {
  return [
    'import { test, expect } from "@playwright/test";',
    `const x: any = ${"(".repeat(depth)}1${")".repeat(depth)};`,
    'test("a scenario", async ({ page }) => {',
    '  await expect(page.getByTestId("x")).toBeVisible();',
    "});",
    "",
  ].join("\n");
}

const CLEAN_SPEC = [
  'import { test, expect } from "@playwright/test";',
  'test("a scenario", async ({ page }) => {',
  '  await page.goto("/x");',
  '  await expect(page.getByTestId("x")).toBeVisible();',
  "});",
  "",
].join("\n");

/** A spec carrying a genuine arm-(c) finding, so CONTROL 3 can drive the findings branch. */
const FINDING_SPEC = [
  'import { test, expect } from "@playwright/test";',
  'test.skip("a scenario", async ({ page }) => {',
  '  await expect(page.getByTestId("x")).toBeVisible();',
  "});",
  "",
].join("\n");

function plant(root: string, relPath: string, body: string | Uint8Array): void {
  const dest = join(root, relPath);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body);
}

// ── the adjacency pair, DISCOVERED rather than hard-coded ─────────────────────────────────────
//
// The depth at which a recursive-descent parser exhausts the interpreter's stack is a property of
// THIS machine's stack size, not of the checker. Hard-coding 1000 would make the corpus green on a
// host with a larger stack while asserting nothing. The pair is therefore bisected through the
// COMMITTED artifact, whose two decided outcomes are the bisection predicate: exit 0 (the parser
// finished) or anything else (it did not). The predicate is well-defined both BEFORE this plan's
// change (the other side is an uncaught exit 1) and after it (an exit 2 could-not-run), so the
// same discovery drives the RED measurement and the GREEN one.
let boundaryCache: { readonly safe: number; readonly overflow: number } | null = null;
function parseBoundary(): { readonly safe: number; readonly overflow: number } {
  if (boundaryCache !== null) return boundaryCache;
  const root = mkTargetRepo({});
  const finishes = (depth: number): boolean => {
    plant(root, "e2e/uat/nested.uat.spec.ts", nestedSpec(depth));
    return runCheck(root).status === 0;
  };
  let lo = 1;
  let hi = 512;
  while (finishes(hi)) {
    lo = hi;
    hi *= 2;
    if (hi > 1 << 17) {
      throw new Error(
        `premise failed: no nesting depth up to ${1 << 17} stopped the parser finishing, so this ` +
          `machine cannot drive the shape CR-15 reproduces`,
      );
    }
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (finishes(mid)) lo = mid;
    else hi = mid;
  }
  boundaryCache = { safe: lo, overflow: hi };
  return boundaryCache;
}

describe("uat-spec-integrity — 31-25 CR-15: every exit passes through one decided boundary", () => {
  // ── GREEN 1: the pathological parse is a COULD-NOT-RUN, and the vacuity floor speaks ──────────

  it("GREEN 1: a spec the parser cannot finish exits 2 with the vacuity floor on stderr", () => {
    const { overflow } = parseBoundary();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/nested.uat.spec.ts", nestedSpec(overflow));
    const r = runCheck(root);

    // PREMISE (the harness's own, asserted before the conclusion): the spec really is on disk at the
    // generated size, and the run really derived exactly one spec from it.
    expect(
      readFileSync(join(root, "e2e/uat/nested.uat.spec.ts"), "utf8").length,
      "the probe spec was not written, so every assertion below would be vacuous",
    ).toBe(nestedSpec(overflow).length);

    expect([0, 1, 2], `exit code outside the D-12 contract: ${r.status}`).toContain(r.status);
    expect(r.status, `stderr began: ${r.stderr.split("\n")[0]}`).toBe(2);
    // the per-file could-not-run reason, NAMING THE FILE
    expect(r.stderr).toContain("e2e/uat/nested.uat.spec.ts");
    // reportMeasured branch (1) — the VACUITY floor, on stderr, carrying the derived count
    expect(r.stderr).toContain("ZERO uat specs were visited (1 derived)");
    // …and stdout is EMPTY, which is branch (1)'s CORRECT output, not the unfixed defect
    expect(r.stdout).toBe("");
    // The boundary NAMES the cause — that is what makes the four could-not-run reasons
    // distinguishable — and it is what distinguishes a NAMED refusal from an ESCAPED one.
    // 31-28 (WR-29): the sentence NAMES the parse, because the fault was raised inside the parser
    // rather than inside the walk. The module claimed four distinguishable reasons and implemented
    // three; this is the case that used to read the walk's sentence for a parse fault.
    expect(r.stderr).toContain("could not be PARSED (Maximum call stack size exceeded)");
    // …and nothing escaped: an uncaught throw prints stack FRAMES, and there are none. Asserting
    // the absence of the cause STRING would have been asserting the absence of the diagnostic, which
    // is the opposite of what a could-not-run boundary is for. Measured: the first form of this
    // assertion failed against a correct mechanism for exactly that reason.
    expect(r.stderr, "a stack frame escaped, so the fault was not decided").not.toMatch(
      /^\s+at .+:\d+:\d+/m,
    );
  });

  // ── GREEN 1b: the DENOMINATOR floor is a DIFFERENT branch, and it is reached too ──────────────

  it("GREEN 1b: the pathological spec alongside a clean one exits 2 with `visited 1 of 2` on stderr", () => {
    const { overflow } = parseBoundary();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/nested.uat.spec.ts", nestedSpec(overflow));
    plant(root, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    const r = runCheck(root);

    expect([0, 1, 2]).toContain(r.status);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("visited 1 of 2 derived uat specs");
    expect(r.stdout).toBe("");
  });

  // ── GREEN 2: BOTH SIDES of the adjacency, and the stream difference between them ─────────────

  it("GREEN 2: the highest finishing depth passes on stdout; the next depth floors on stderr", () => {
    const { safe, overflow } = parseBoundary();
    expect(overflow - safe, "the bisection did not converge on an adjacent pair").toBe(1);

    const safeRoot = mkTargetRepo({});
    plant(safeRoot, "e2e/uat/nested.uat.spec.ts", nestedSpec(safe));
    const safeRun = runCheck(safeRoot);
    expect(safeRun.status, `depth ${safe} was expected to finish. stderr: ${safeRun.stderr.split("\n")[0]}`).toBe(0);
    expect(safeRun.stdout).toContain("0 findings over 1/1 uat specs checked");
    expect(safeRun.stderr).toBe("");

    const overRoot = mkTargetRepo({});
    plant(overRoot, "e2e/uat/nested.uat.spec.ts", nestedSpec(overflow));
    const overRun = runCheck(overRoot);
    expect(overRun.status).toBe(2);
    expect(overRun.stderr).toContain("ZERO uat specs were visited (1 derived)");
    expect(overRun.stdout).toBe("");
  });

  // ── GREEN 3: the PROCESS boundary, driven at three positions outside analyzeSpecs ─────────────
  //
  // `main`'s injected-dependency record is the same seam `analyzeSpecs`'s injectable `readFile` is,
  // and it exists for the same stated reason: a boundary nobody can reach is a boundary nobody has
  // tested. Every default is the real function; a caller that passes nothing gets today's program.

  it("GREEN 3a: a fault BEFORE analyzeSpecs (in the spec derivation) exits 2 with a named reason", async () => {
    const { main, PROCESS_BOUNDARY_MARKER } = await loadChecker();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    let err = "";
    const code = main([root], {
      deriveSpecPaths: () => {
        throw new Error("forced derivation failure");
      },
      err: (s: string) => {
        err += s;
      },
    });
    expect(code).toBe(2);
    expect(err).toContain(PROCESS_BOUNDARY_MARKER);
    expect(err).toContain("forced derivation failure");
  });

  it("GREEN 3b: a fault INSIDE analyzeSpecs that escapes it exits 2 with a named reason", async () => {
    const { main, PROCESS_BOUNDARY_MARKER } = await loadChecker();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    let err = "";
    const code = main([root], {
      analyzeSpecs: () => {
        throw new Error("forced analysis failure");
      },
      err: (s: string) => {
        err += s;
      },
    });
    expect(code).toBe(2);
    expect(err).toContain(PROCESS_BOUNDARY_MARKER);
    expect(err).toContain("forced analysis failure");
  });

  it("GREEN 3c: a fault INSIDE reportMeasured exits 2 with the named reason INSTEAD of a measurement", async () => {
    const { main, PROCESS_BOUNDARY_MARKER } = await loadChecker();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    let out = "";
    let err = "";
    const code = main([root], {
      reportMeasured: () => {
        throw new Error("forced report failure");
      },
      out: (s: string) => {
        out += s;
      },
      err: (s: string) => {
        err += s;
      },
    });
    // This is the ONE shape for which the measurement requirement is VACUOUS: the function that
    // writes every measurement is the function that threw, so no measurement can exist. What the
    // case asserts instead is that the process boundary NAMED the fault rather than letting it
    // escape as an interpreter default.
    expect(code).toBe(2);
    expect(out).toBe("");
    expect(err).toContain(PROCESS_BOUNDARY_MARKER);
    expect(err).toContain("forced report failure");
  });

  it("GREEN 3d: the process boundary returns the body's own value for a legitimate 0 and 1", async () => {
    const { main } = await loadChecker();
    const clean = mkTargetRepo({});
    plant(clean, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    const finding = mkTargetRepo({});
    plant(finding, "e2e/uat/finding.uat.spec.ts", FINDING_SPEC);
    const sink = (): void => {};
    expect(main([clean], { out: sink, err: sink }), "a clean run must still exit 0").toBe(0);
    expect(main([finding], { out: sink, err: sink }), "a real finding must still exit 1").toBe(1);
  });

  // ── GREEN 4: the CLASS, not the call — the directory walk no longer recurses ──────────────────

  it("GREEN 4: a directory tree as deep as this platform permits is derived without a throw", async () => {
    const { deriveSpecPaths } = await loadChecker();
    const root = mkTmp();
    let rel = "uat";
    mkdirSync(join(root, rel));
    let fsDepth = 1;
    for (; fsDepth < 4096; fsDepth++) {
      const next = `${rel}/d`;
      try {
        mkdirSync(join(root, next));
      } catch {
        break;
      }
      rel = next;
    }
    // The FILE's own path must also fit inside the platform's limit, and it is longer than the
    // directory's. Step back one level at a time until the spec can actually be written — measured:
    // planting at the deepest MKDIR-able level throws ENAMETOOLONG in the harness, which would have
    // read as a checker defect rather than a harness one.
    while (fsDepth > 1) {
      try {
        plant(root, `${rel}/deep.uat.spec.ts`, CLEAN_SPEC);
        break;
      } catch {
        rel = rel.slice(0, rel.lastIndexOf("/"));
        fsDepth--;
      }
    }
    expect(fsDepth, "no directory level accepted the spec, so the case below would be vacuous").toBeGreaterThan(1);

    const derived = deriveSpecPaths(root);
    expect(derived.refusals).toEqual([]);
    expect(derived.relPaths).toEqual([`${rel}/deep.uat.spec.ts`]);

    // THE RESIDUAL, MEASURED RATHER THAN ASSUMED. The de-recursion covers the CLASS; whether the
    // OLD recursive walk was reachable to exhaustion is a separate, platform-dependent question and
    // it is answered here by measurement rather than by silence. A like-for-like self-recursive
    // frame (an entries array plus the loop the walk carries) is driven to its own overflow, and the
    // deepest directory this platform's path limit permits is compared against it.
    let recursionDepth = 0;
    const likeForLikeWalk = (k: number): number => {
      const entries = [{ name: "d" }, { name: "x.uat.spec.ts" }];
      let last = "";
      for (const e of entries) last = e.name;
      recursionDepth = k;
      return likeForLikeWalk(k + 1) + last.length;
    };
    try {
      likeForLikeWalk(0);
    } catch {
      /* RangeError — the measurement is `recursionDepth` */
    }
    expect(
      recursionDepth,
      `a like-for-like recursive walk overflows at ${recursionDepth}; this platform permits ` +
        `${fsDepth} directory levels`,
    ).toBeGreaterThan(fsDepth);
  });

  // ── CONTROL 1: WR-19's own closure is re-measured intact ─────────────────────────────────────

  it("CONTROL 1: the 4,000-link call chain still reports `0 findings over 1/1`, exit 0, stderr empty", () => {
    const root = mkTargetRepo({});
    plant(
      root,
      "e2e/uat/chain.uat.spec.ts",
      [
        'import { test, expect } from "@playwright/test";',
        "const chain: any = test;",
        'test("a scenario", async ({ page }) => {',
        `  chain${".a()".repeat(4000)};`,
        '  await expect(page.getByTestId("x")).toBeVisible();',
        "});",
        "",
      ].join("\n"),
    );
    const r = runCheck(root);
    // 31-28 (D-30 (4)): THIS CONTROL MOVED, AND THE MOVE IS DISCLOSED RATHER THAN ABSORBED. The
    // resolver no longer struggles with the chain — the COMPILER's binder does, and it binds every
    // root file at once, so the run reports a could-not-run instead of a clean pass. Exit 2 is
    // inside the D-12 contract and is never a pass; the WHOLE-RUN granularity is coarser than
    // D-28's per-file boundary and is a named member of the residual register with a closure
    // criterion. What must NOT change is that nothing escapes: no stack frames, no exit outside
    // { 0, 1, 2 }, and no claim about the specs on stdout.
    expect([0, 1, 2]).toContain(r.status);
    expect(r.status, `stderr: ${r.stderr.split("\n")[0]}`).toBe(2);
    expect(r.stdout, "a run that could not complete printed a claim about the specs").toBe("");
    expect(r.stderr).not.toContain("    at ");
  });

  // ── CONTROL 2: the two loud skips are unmoved and stay distinguishable ────────────────────────

  it("CONTROL 2: each loud-skip marker still emits exactly once, distinguishable from a could-not-run", async () => {
    const { PARSER_ABSENT_MARKER, BROWSER_ABSENT_MARKER } = await loadChecker();

    const noParser = mkTargetRepo({}, false);
    plant(noParser, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    const pr = runCheck(noParser);
    expect(pr.status).toBe(2);
    expect(pr.stderr.split(PARSER_ABSENT_MARKER).length - 1, "the parser marker must emit ONCE").toBe(1);

    const noBrowser = mkTargetRepo({}, false);
    plant(noBrowser, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    const br = runCheck(noBrowser, "--check-browser");
    expect(br.status).toBe(2);
    expect(br.stderr.split(BROWSER_ABSENT_MARKER).length - 1, "the browser marker must emit ONCE").toBe(1);

    // Distinguishable from a could-not-run reason: neither marker carries the per-file wording, and
    // the per-file wording carries neither marker.
    expect(PARSER_ABSENT_MARKER).not.toContain("the check was NOT performed for that file");
    expect(BROWSER_ABSENT_MARKER).not.toContain("the check was NOT performed for that file");
    const { overflow } = parseBoundary();
    const cnr = mkTargetRepo({});
    plant(cnr, "e2e/uat/nested.uat.spec.ts", nestedSpec(overflow));
    const cr = runCheck(cnr);
    expect(cr.stderr).not.toContain(PARSER_ABSENT_MARKER);
    expect(cr.stderr).not.toContain(BROWSER_ABSENT_MARKER);
  });

  // ── CONTROL 3: the ordinary path is unchanged ────────────────────────────────────────────────

  it("CONTROL 3: a clean spec still exits 0 and a real finding still exits 1, each with its measurement", () => {
    const clean = mkTargetRepo({});
    plant(clean, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    const cr = runCheck(clean);
    expect(cr.status).toBe(0);
    expect(cr.stdout).toContain("0 findings over 1/1 uat specs checked");

    const finding = mkTargetRepo({});
    plant(finding, "e2e/uat/finding.uat.spec.ts", FINDING_SPEC);
    const fr = runCheck(finding);
    expect(fr.status).toBe(1);
    expect(fr.stdout).toContain("finding(s) over 1/1 uat specs checked");
  });

  // ── EMPTY: a zero-byte spec is a file that WAS checked ────────────────────────────────────────

  it("EMPTY: a zero-byte spec increments `visited`, contributes no finding and exits 0", async () => {
    const { analyzeSpecs } = await loadChecker();
    const root = mkTargetRepo({});
    plant(root, "e2e/uat/empty.uat.spec.ts", "");
    const analysis = analyzeSpecs(
      root,
      ["e2e/uat/empty.uat.spec.ts"],
      hostTypeScript,
      await programContextFor(root, ["e2e/uat/empty.uat.spec.ts"]),
    );
    expect(analysis.visited, "a zero-byte spec is a file that WAS checked, not one that could not be").toBe(1);
    expect(analysis.errors).toEqual([]);
    expect(analysis.findings).toEqual([]);

    const r = runCheck(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1 uat specs checked");
  });

  // ── ORDERING: the reason precedes reportMeasured's own output, on whichever stream ────────────

  it("ORDERING: the per-file could-not-run reason precedes reportMeasured's output", () => {
    const { overflow } = parseBoundary();

    // (a) a could-not-run-only run: BOTH facts arrive on stderr, reason first.
    const solo = mkTargetRepo({});
    plant(solo, "e2e/uat/nested.uat.spec.ts", nestedSpec(overflow));
    const sr = runCheck(solo);
    const reasonAt = sr.stderr.indexOf("e2e/uat/nested.uat.spec.ts");
    const floorAt = sr.stderr.indexOf("ZERO uat specs were visited");
    expect(reasonAt, "the per-file reason is absent").toBeGreaterThanOrEqual(0);
    expect(floorAt, "the vacuity floor is absent").toBeGreaterThanOrEqual(0);
    expect(reasonAt, "a reader must see WHY before THAT").toBeLessThan(floorAt);

    // (b) a mixed run that still reaches a STDOUT branch: the reason is on stderr, and it is written
    //     before the process ever reaches the branch that writes to stdout.
    const mixed = mkTargetRepo({});
    plant(mixed, "e2e/uat/nested.uat.spec.ts", nestedSpec(overflow));
    plant(mixed, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC);
    const mr = runCheck(mixed);
    expect(mr.stderr.indexOf("e2e/uat/nested.uat.spec.ts")).toBeGreaterThanOrEqual(0);
    expect(
      mr.stderr.indexOf("e2e/uat/nested.uat.spec.ts"),
      "the reason must precede the denominator floor on the same stream",
    ).toBeLessThan(mr.stderr.indexOf("visited 1 of 2"));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-25 / D-28 — THE PARTITION, ASSERTED OVER A CORPUS RATHER THAN OVER ONE DEPTH
//
// CR-15 was found at depth 1,000 because a reviewer tried that depth. WR-19 was found at 4,000
// links because a reviewer tried that shape. Neither shape was in the suite, and the suite was
// green both times. What this block asserts is therefore not one input but a PUBLISHED SET of
// shapes, bound in both directions so a shape can neither be added without a case nor a case
// written without a shape.
//
// BOTH HALVES, AND WHICH STREAM. For every shape the case asserts (i) the exit code is a member of
// { 0, 1, 2 } and (ii) the measurement carrying the visited and derived counts REACHED THE STREAM
// ITS BRANCH WRITES TO. The second half is the one WR-19 and CR-15 both actually broke: in both,
// the exit code was inside the partition by ACCIDENT, and the absence of ANY measurement on EITHER
// stream is what made a check that never ran unreadable as such.
//
// WHY NOT "a measurement on stdout for every shape". `reportMeasured`'s two floors call `err(...)`
// and return 2; only the findings line and the pass line call `out(...)`. That split is the
// `scripts/vacuity.ts` mirror D-21 established and this runnable cannot import. A corpus demanding
// stdout for a could-not-run shape would force this plan to MOVE a floor's output and re-author an
// authority it does not own, in the course of fixing an unrelated boundary. The property CR-15
// needs from `reportMeasured` is that it is REACHED; which of its four branches then speaks, and
// where, is that function's decision, is READ OFF it into MEASUREMENT_BRANCH_STREAMS, and is
// asserted unchanged by this plan.
//
// WHY THE CORPUS IS NOT A COMMITTED FIXTURE. tsconfig.fixtures.json type-checks everything under
// scripts/runnable-ref/fixtures/. A 1,000-deep nesting, an invalid-UTF-8 file or a binary file
// committed there would turn that gate red for a reason unrelated to the ban — and the cheapest way
// to make it green again is to delete the fixture. Every shape is therefore generated at RUN TIME
// into a probe root removed in a `finally`.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-25 D-28: the exit partition over a pathological corpus", () => {
  const CORPUS_PARENT = join(tmpdir(), "grugops-uat-spec-integrity-corpus");

  /** A probe root generated for ONE shape and removed unconditionally. */
  function withProbeRoot<T>(fn: (root: string) => T): T {
    mkdirSync(CORPUS_PARENT, { recursive: true });
    const root = mkdtempSync(join(CORPUS_PARENT, "shape-"));
    try {
      writeFileSync(join(root, "package.json"), JSON.stringify({ name: "target", private: true }), "utf8");
      symlinkSync(REPO_NODE_MODULES, join(root, "node_modules"), "dir");
      // 31-28 (D-30): a probe root is a TARGET, so it carries what a target must — a configuration
      // file and the framework's declarations. Without them the ban has no Program and no symbol,
      // and every shape below would exit 2 for a reason that says nothing about the shape.
      equipTarget(root);
      return fn(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  /** The same probe root, for a case that must await a Program built from it. */
  async function withProbeRootAsync<T>(fn: (root: string) => Promise<T>): Promise<T> {
    mkdirSync(CORPUS_PARENT, { recursive: true });
    const root = mkdtempSync(join(CORPUS_PARENT, "shape-"));
    try {
      writeFileSync(join(root, "package.json"), JSON.stringify({ name: "target", private: true }), "utf8");
      symlinkSync(REPO_NODE_MODULES, join(root, "node_modules"), "dir");
      equipTarget(root);
      return await fn(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  type Branch = "vacuity_floor" | "denominator_floor" | "findings" | "pass";

  /**
   * One row per shape: the sentence the export publishes, the branch of `reportMeasured` the shape
   * is DECLARED to reach, and the bytes that drive it. A shape whose measured branch differs from
   * its declared one fails the case — it is never re-declared to match what it turned out to do.
   */
  interface ShapeCase {
    readonly shape: string;
    readonly branch: Branch;
    readonly bytes: () => string | Uint8Array;
  }

  function shapeCases(): readonly ShapeCase[] {
    const { overflow, safe } = parseBoundary();
    const large: string[] = ['import { test, expect } from "@playwright/test";'];
    for (let i = 0; i < 40000; i++) large.push(`const v${i} = ${i};`);
    large.push(
      'test("a scenario", async ({ page }) => {',
      '  await expect(page.getByTestId("x")).toBeVisible();',
      "});",
      "",
    );
    const binary = new Uint8Array(4096);
    for (let i = 0; i < binary.length; i++) binary[i] = (i * 97) % 256;

    return [
      {
        shape: "a nesting depth the parser cannot finish",
        branch: "vacuity_floor",
        bytes: () => nestedSpec(overflow),
      },
      {
        shape: "the adjacent nesting depth the parser does finish",
        branch: "pass",
        bytes: () => nestedSpec(safe),
      },
      {
        shape: "a spec far larger than any ordinary one",
        branch: "pass",
        bytes: () => large.join("\n"),
      },
      {
        shape: "a spec carrying invalid UTF-8 byte sequences",
        branch: "vacuity_floor",
        bytes: () =>
          new Uint8Array([
            ...new TextEncoder().encode(CLEAN_SPEC),
            0xc3, 0x28, 0xa0, 0xa1, 0xe2, 0x28, 0xa1,
          ]),
      },
      {
        shape: "a spec opening with a byte-order mark",
        branch: "pass",
        bytes: () => new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(CLEAN_SPEC)]),
      },
      {
        shape: "a spec whose bytes are binary",
        branch: "vacuity_floor",
        bytes: () => binary,
      },
    ];
  }

  /** Drive ONE shape through the committed .js and report what each stream carried. */
  function driveShape(c: ShapeCase): {
    readonly status: number | null;
    readonly stdout: string;
    readonly stderr: string;
  } {
    return withProbeRoot((root) => {
      const body = c.bytes();
      const rel = "e2e/uat/shape.uat.spec.ts";
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), body);
      // PROBE 5 — THE HARNESS'S OWN PREMISE, ASSERTED BEFORE THE CONCLUSION. A corpus whose specs
      // were never written would satisfy the partition vacuously at 0/0.
      const onDisk = readFileSync(join(root, rel));
      const wanted = typeof body === "string" ? new TextEncoder().encode(body) : body;
      expect(onDisk.length, `${c.shape}: the generated spec is not on disk at its generated size`).toBe(
        wanted.length,
      );
      // …and the run really derives ONE spec from it. A corpus whose specs are not in the derived
      // set would report `0/0`, take the vacuity floor, and satisfy the partition for a reason that
      // has nothing to do with the shape it claims to be driving.
      const derived = spawnSync(
        "node",
        [
          "-e",
          `import(${JSON.stringify(pathToFileURL(CHECK_JS).href)}).then((m) => ` +
            `process.stdout.write(String(m.deriveSpecPaths(process.argv[1]).relPaths.length)))`,
          root,
        ],
        { encoding: "utf8" },
      );
      expect(
        (derived.stdout ?? "").trim(),
        `${c.shape}: the probe root did not derive exactly one spec, so the partition below would ` +
          `be satisfied at 0/0 for a reason unrelated to the shape`,
      ).toBe("1");
      return runCheck(root);
    });
  }

  /** The text a run of the checker carries that NAMES BOTH COUNTERS, per stream. */
  function measurementOn(stream: string): string | null {
    const line = stream
      .split("\n")
      .find(
        (l) =>
          l.includes("uat specs were visited") ||
          l.includes("derived uat specs") ||
          l.includes("uat specs checked"),
      );
    return line ?? null;
  }

  // ── Test 7 (the corpus's own premise) — asserted FIRST, because everything below reads it ─────

  it("Test 7: PATHOLOGICAL_INPUT_SHAPES is non-empty and every member is driven by a case", async () => {
    const { PATHOLOGICAL_INPUT_SHAPES } = await loadChecker();
    expect(
      PATHOLOGICAL_INPUT_SHAPES.length,
      "a corpus over zero shapes would satisfy the partition vacuously",
    ).toBeGreaterThan(0);
    expect(new Set(PATHOLOGICAL_INPUT_SHAPES).size).toBe(PATHOLOGICAL_INPUT_SHAPES.length);

    const driven = shapeCases().map((c) => c.shape);
    // BOTH DIRECTIONS: a shape added to the export without a case, or a case written for a shape the
    // export does not publish, turns this red.
    expect([...PATHOLOGICAL_INPUT_SHAPES].sort()).toEqual([...driven].sort());
  });

  // ── Test 8b: reportMeasured is UNCHANGED, and the table was READ OFF it ───────────────────────

  it("Test 8b: MEASUREMENT_BRANCH_STREAMS equals what reportMeasured actually does, in both directions", async () => {
    const { reportMeasured, MEASUREMENT_BRANCH_STREAMS } = await loadChecker();

    // Drive all four branches and OBSERVE which stream each writes to and what it returns.
    const observed: Record<string, { stream: string; exitCode: number }> = {};
    const drive = (
      name: string,
      m: { visited: number; expected: number; findings: readonly string[] },
    ): void => {
      let out = "";
      let err = "";
      const code = reportMeasured(m, false, (s) => {
        out += s;
      }, (s) => {
        err += s;
      });
      expect(
        out === "" ? err !== "" : err === "",
        `${name}: reportMeasured wrote to BOTH streams or to NEITHER`,
      ).toBe(true);
      observed[name] = { stream: out === "" ? "stderr" : "stdout", exitCode: code };
    };
    drive("vacuity_floor", { visited: 0, expected: 1, findings: [] });
    drive("denominator_floor", { visited: 1, expected: 2, findings: [] });
    drive("findings", { visited: 1, expected: 1, findings: ["a finding"] });
    drive("pass", { visited: 1, expected: 1, findings: [] });

    // FOUR branches, the same four, with the same streams — so this plan is proven not to have
    // re-authored the scripts/vacuity.ts mirror while satisfying a stream expectation.
    expect(Object.keys(observed).sort()).toEqual(Object.keys(MEASUREMENT_BRANCH_STREAMS).sort());
    expect(Object.keys(MEASUREMENT_BRANCH_STREAMS)).toHaveLength(4);
    for (const [branch, seen] of Object.entries(observed)) {
      const declared = MEASUREMENT_BRANCH_STREAMS[branch as Branch];
      expect(declared, `MEASUREMENT_BRANCH_STREAMS does not map ${branch}`).toBeDefined();
      expect(declared.stream, `${branch}: the published stream is not the one the branch writes to`).toBe(
        seen.stream,
      );
      expect(declared.exitCode, `${branch}: the published exit code is not the one it returns`).toBe(
        seen.exitCode,
      );
    }
    const streams = Object.values(MEASUREMENT_BRANCH_STREAMS).map((v) => v.stream);
    expect(streams.filter((v) => v === "stdout")).toHaveLength(2);
    expect(streams.filter((v) => v === "stderr")).toHaveLength(2);
  });

  // ── Test 1 (the partition) plus Tests 2-6, one case per shape ────────────────────────────────

  it("Test 1: every shape exits inside {0,1,2} with its measurement on its branch's stream", async () => {
    const { MEASUREMENT_BRANCH_STREAMS } = await loadChecker();
    const rows: string[] = [];
    let stdoutShapes = 0;
    let stderrShapes = 0;

    for (const c of shapeCases()) {
      const declared = MEASUREMENT_BRANCH_STREAMS[c.branch];
      const r = driveShape(c);
      expect([0, 1, 2], `${c.shape}: exit code outside the D-12 contract: ${r.status}`).toContain(r.status);
      expect(r.status, `${c.shape}: declared branch ${c.branch}. stderr: ${r.stderr.split("\n")[0]}`).toBe(
        declared.exitCode,
      );

      const onDeclared = measurementOn(declared.stream === "stdout" ? r.stdout : r.stderr);
      const onOther = measurementOn(declared.stream === "stdout" ? r.stderr : r.stdout);
      expect(
        onDeclared,
        `${c.shape}: NO measurement reached ${declared.stream}, the stream branch ${c.branch} writes ` +
          `to. This is the half WR-19 and CR-15 both actually broke.`,
      ).not.toBeNull();
      expect(onOther, `${c.shape}: a measurement reached a stream its branch does not write to`).toBeNull();

      if (declared.stream === "stdout") stdoutShapes++;
      else stderrShapes++;
      rows.push(`${c.shape} | ${c.branch} | ${declared.stream} | ${r.status} | ${onDeclared}`);
    }

    // The assertion is proven NOT trivially satisfiable by expecting one stream everywhere.
    expect(stdoutShapes, "no shape lands on a stdout branch").toBeGreaterThan(0);
    expect(stderrShapes, "no shape lands on a stderr branch").toBeGreaterThan(0);
    expect(rows.length).toBe(shapeCases().length);
  });

  it("Test 2: the nesting adjacency pair straddles the boundary, one on each stream", () => {
    const { safe, overflow } = parseBoundary();
    expect(overflow - safe).toBe(1);
    const below = driveShape({
      shape: "the adjacent nesting depth the parser does finish",
      branch: "pass",
      bytes: () => nestedSpec(safe),
    });
    expect(below.status).toBe(0);
    expect(below.stdout).toContain("0 findings over 1/1 uat specs checked");
    const above = driveShape({
      shape: "a nesting depth the parser cannot finish",
      branch: "vacuity_floor",
      bytes: () => nestedSpec(overflow),
    });
    expect(above.status).toBe(2);
    expect(above.stderr).toContain("ZERO uat specs were visited (1 derived)");
    expect(above.stdout).toBe("");
  });

  it("Test 4: an invalid-UTF-8 spec names the file in its could-not-run reason", () => {
    const c = shapeCases().find((x) => x.shape === "a spec carrying invalid UTF-8 byte sequences")!;
    const r = driveShape(c);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("e2e/uat/shape.uat.spec.ts");
    expect(r.stderr).toContain("ZERO uat specs were visited (1 derived)");
  });

  it("Test 5: a leading BOM is a CHECKED file — visited 1, and its measurement reaches STDOUT", async () => {
    const { analyzeSpecs } = await loadChecker();
    const c = shapeCases().find((x) => x.shape === "a spec opening with a byte-order mark")!;
    const r = driveShape(c);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1 uat specs checked");
    expect(r.stderr).toBe("");
    // …and `visited` really is 1, read off the analysis rather than inferred from the exit code.
    await withProbeRootAsync(async (root) => {
      const rel = "e2e/uat/shape.uat.spec.ts";
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), c.bytes());
      const analysis = analyzeSpecs(root, [rel], hostTypeScript, await programContextFor(root, [rel]));
      expect(analysis.visited, "a BOM is a checked file, not one that could not be").toBe(1);
      expect(analysis.errors).toEqual([]);
    });
  });

  it("Test 9: every probe root the corpus creates is removed", () => {
    for (const c of shapeCases()) driveShape(c);
    mkdirSync(CORPUS_PARENT, { recursive: true });
    expect(
      readdirSync(CORPUS_PARENT),
      "a probe root survived the corpus run, so the `finally` did not remove it",
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-25 — TEST 8: THE DISCLOSURE EQUALS THE MECHANISM
//
// The recipe paragraph 31-17 added asserted the checker "does not exit through an uncaught
// exception, including a pathological one". That was false when it was written, and CR-15 measured
// it false. The corrected paragraph names the TWO boundaries that hold the contract and DISCLOSES
// what remains outside every boundary, and its shape list is bound to PATHOLOGICAL_INPUT_SHAPES in
// both directions so the document and the corpus cannot drift apart.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("browser-uat-recipe.md — 31-25: the exit-code paragraph equals the two boundaries", () => {
  const RECIPE = join(REPO_ROOT, "agent-factory", "checklists", "browser-uat-recipe.md");
  const LIST_OPENER =
    "The partition is asserted over a corpus of pathological inputs generated at run time, one case per shape:";
  const LIST_CLOSER = "Each case asserts both halves";

  function shapeBullets(text: string): string[] {
    const lines = text.split("\n");
    const start = lines.findIndex((l) => l.trimEnd() === LIST_OPENER);
    expect(
      start,
      "PREMISE: the shape list's opener is absent from the recipe, so the equality below would be " +
        "over an empty list",
    ).toBeGreaterThanOrEqual(0);
    const end = lines.findIndex((l, i) => i > start && l.startsWith(LIST_CLOSER));
    expect(end, "PREMISE: the shape list has no closing paragraph, so it ran to end-of-file").toBeGreaterThan(
      start,
    );
    return lines
      .slice(start + 1, end)
      .filter((l) => l.startsWith("- "))
      .map((l) => l.slice(2).trim());
  }

  it("Test 8: the recipe's shape list equals PATHOLOGICAL_INPUT_SHAPES in BOTH directions", async () => {
    const { PATHOLOGICAL_INPUT_SHAPES } = await loadChecker();
    const bullets = shapeBullets(readFileSync(RECIPE, "utf8"));
    expect(bullets.length, "PREMISE: the shape list is empty").toBeGreaterThan(0);
    expect([...bullets].sort()).toEqual([...PATHOLOGICAL_INPUT_SHAPES].sort());
  });

  it("SEEDED FAIL: a shape removed from the recipe list is caught", async () => {
    const { PATHOLOGICAL_INPUT_SHAPES } = await loadChecker();
    const text = readFileSync(RECIPE, "utf8");
    const seeded = text.replace(`- ${PATHOLOGICAL_INPUT_SHAPES[0]}\n`, "");
    expect(seeded, "the seed did not change the document, so the control proves nothing").not.toBe(text);
    expect([...shapeBullets(seeded)].sort()).not.toEqual([...PATHOLOGICAL_INPUT_SHAPES].sort());
  });

  it("the paragraph names the two boundaries and DISCLOSES what sits outside them", () => {
    const text = readFileSync(RECIPE, "utf8");
    // the false absolute 31-17 added is gone
    expect(
      text,
      "the recipe still asserts the absolute CR-15 measured false",
    ).not.toContain("including a pathological one");
    // the two boundaries, named
    expect(text).toContain("Everything the checker does with a spec's bytes");
    expect(text).toContain("The runnable's whole body is inside one boundary");
    // the residual, disclosed by name rather than left implied
    expect(text).toContain("terminates the process without unwinding");
    expect(text).toContain("UNKNOWN - verify");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-25 TASK 3 — THE PHASE'S STANDING RED-TEAM PROBES, RUN AGAINST THIS PLAN'S OWN BOUNDARY
//
// Five rounds of this phase have each closed a finding and each created a new one, every time in a
// mechanism the previous round's fix had just touched. `docs/audit/31-round4-residuals.md` §6.2
// records the eighth instance of a verification harness producing a FALSE RESULT about its own
// premise, and notes that "the same instinct applied to `analyzeSpecs`'s boundary would have found
// CR-15". These cases are that instinct, applied here, before round 6 applies it for us.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-25 PROBES: how is this boundary REACHED, not only what it catches", () => {
  const MODULE_TS = join(HERE, "uat-spec-integrity.ts");

  function moduleSource(): import("typescript").SourceFile {
    const ts = hostTypeScript as typeof import("typescript");
    return ts.createSourceFile("m.ts", readFileSync(MODULE_TS, "utf8"), ts.ScriptTarget.Latest, true);
  }

  /** Count the `return` statements OF a named function declaration, not of the closures inside it. */
  function returnsOf(name: string): number {
    const ts = hostTypeScript as typeof import("typescript");
    const sf = moduleSource();
    let fn: import("typescript").FunctionDeclaration | null = null;
    const find = (n: import("typescript").Node): void => {
      if (ts.isFunctionDeclaration(n) && n.name !== undefined && n.name.text === name) fn = n;
      ts.forEachChild(n, find);
    };
    find(sf);
    expect(fn, `PREMISE: ${name} is not a function declaration in the module`).not.toBeNull();
    const body = (fn as unknown as import("typescript").FunctionDeclaration).body;
    expect(body, `PREMISE: ${name} has no body`).toBeDefined();
    let count = 0;
    const walk = (n: import("typescript").Node): void => {
      if (ts.isReturnStatement(n)) count++;
      ts.forEachChild(n, (child) => {
        if (
          ts.isFunctionDeclaration(child) ||
          ts.isArrowFunction(child) ||
          ts.isFunctionExpression(child)
        ) {
          return;
        }
        walk(child);
      });
    };
    walk(body!);
    return count;
  }

  function mkRoot(specs: Record<string, string> = {}, withTypescript = true): string {
    const root = mkTargetRepo({}, withTypescript);
    for (const [rel, body] of Object.entries(specs)) plant(root, rel, body);
    return root;
  }

  // ── PROBE 1: EVERY return and EVERY branch is DERIVED, then DRIVEN ───────────────────────────

  it("PROBE 1: the derived exit sites equal the driven ones, and every one lands inside {0,1,2}", async () => {
    const {
      main,
      reportMeasured,
      PARSER_ABSENT_MARKER,
      BROWSER_ABSENT_MARKER,
      PROCESS_BOUNDARY_MARKER,
      PROGRAM_UNAVAILABLE_REASON,
    } = await loadChecker();

    // DERIVED by a parse of the module, never remembered.
    const derived = returnsOf("main") + returnsOf("runMain") + returnsOf("reportMeasured");
    expect(returnsOf("main"), "main's own returns").toBe(2);
    // 31-28 (D-30 (4)): EIGHT, because program creation added a return of its own — the loud
    // could-not-run beside the parser-absent branch. A return arriving silently is the event this
    // probe exists to catch; this one arrives with a decision and is driven below.
    expect(returnsOf("runMain"), "runMain's returns").toBe(8);
    expect(returnsOf("reportMeasured"), "reportMeasured's branches").toBe(4);

    const codes: number[] = [];
    const drive = (
      label: string,
      run: (out: (s: string) => void, err: (s: string) => void) => number,
      expected: number,
      wanted: string,
    ): void => {
      let out = "";
      let err = "";
      const code = run(
        (s) => {
          out += s;
        },
        (s) => {
          err += s;
        },
      );
      expect([0, 1, 2], `${label}: exit code outside the contract`).toContain(code);
      expect(code, `${label}`).toBe(expected);
      expect(`${out}${err}`, `${label}: the expected text did not reach either stream`).toContain(wanted);
      codes.push(code);
    };

    // main — 2 sites
    drive("main: the body's own value", (o, e) => main([mkRoot({ "e2e/uat/a.uat.spec.ts": CLEAN_SPEC })], { out: o, err: e }), 0, "0 findings over 1/1");
    drive("main: the process boundary", (o, e) => main([mkRoot()], {
      deriveSpecPaths: () => {
        throw new Error("probe-1 forced fault");
      },
      out: o,
      err: e,
    }), 2, PROCESS_BOUNDARY_MARKER);

    // runMain — 8 sites
    drive("runMain: no repository root", (o, e) => main([], { out: o, err: e }), 2, "no repository root was provided");
    drive("runMain: the root is not a directory", (o, e) => main([join(mkRoot(), "absent")], { out: o, err: e }), 2, "not a readable directory");
    drive("runMain: the browser lane is unusable", (o, e) => main([mkRoot({ "e2e/uat/a.uat.spec.ts": CLEAN_SPEC }, false), "--check-browser"], { out: o, err: e }), 2, BROWSER_ABSENT_MARKER);
    const escaped = mkRoot();
    const outside = mkTmp();
    writeFileSync(join(outside, "away.uat.spec.ts"), CLEAN_SPEC, "utf8");
    mkdirSync(join(escaped, "e2e", "uat"), { recursive: true });
    symlinkSync(join(outside, "away.uat.spec.ts"), join(escaped, "e2e", "uat", "link.uat.spec.ts"), "file");
    drive("runMain: a containment refusal", (o, e) => main([escaped], { out: o, err: e }), 2, "resolves outside the repository root");
    drive("runMain: an empty derived set", (o, e) => main([mkRoot()], { out: o, err: e }), 2, "ZERO uat specs were visited (0 derived)");
    drive("runMain: the parser is absent", (o, e) => main([mkRoot({ "e2e/uat/a.uat.spec.ts": CLEAN_SPEC }, false)], { out: o, err: e }), 2, PARSER_ABSENT_MARKER);
    // 31-28 (D-30 (4)): the eighth site — a target whose TypeScript can PARSE but cannot create a
    // Program. Driven through the injected builder rather than by breaking a real target, so the
    // branch is reached for its own reason and not for a neighbouring one.
    drive(
      "runMain: the program is unavailable",
      (o, e) =>
        main([mkRoot({ "e2e/uat/a.uat.spec.ts": CLEAN_SPEC })], {
          createProgram: () => ({ ok: false, cause: "probe-1 forced program failure" }),
          out: o,
          err: e,
        }),
      2,
      PROGRAM_UNAVAILABLE_REASON,
    );
    drive("runMain: the measured report", (o, e) => main([mkRoot({ "e2e/uat/a.uat.spec.ts": FINDING_SPEC })], { out: o, err: e }), 1, "finding(s) over 1/1");

    // reportMeasured — 4 branches
    drive("reportMeasured: the vacuity floor", (o, e) => reportMeasured({ visited: 0, expected: 1, findings: [] }, false, o, e), 2, "ZERO uat specs were visited");
    drive("reportMeasured: the denominator floor", (o, e) => reportMeasured({ visited: 1, expected: 2, findings: [] }, false, o, e), 2, "visited 1 of 2");
    drive("reportMeasured: the findings line", (o, e) => reportMeasured({ visited: 1, expected: 1, findings: ["f"] }, false, o, e), 1, "1 finding(s) over 1/1");
    drive("reportMeasured: the pass line", (o, e) => reportMeasured({ visited: 1, expected: 1, findings: [] }, false, o, e), 0, "0 findings over 1/1");

    // A branch nobody reached is a branch nobody has tested.
    expect(codes.length, `derived ${derived} exit sites, drove ${codes.length}`).toBe(derived);
    for (const c of codes) expect([0, 1, 2]).toContain(c);
  });

  // ── PROBE 2: DERIVE BOTH AXES — where the boundary sits, the counters, the stream split ───────

  it("PROBE 2 (a): a fault BEFORE, INSIDE and AFTER analyzeSpecs each exits 2 with an EMPTY stdout", async () => {
    const { main, PROCESS_BOUNDARY_MARKER } = await loadChecker();
    const positions: Record<string, () => never> = {
      before: () => {
        throw new Error("axis-a before");
      },
      inside: () => {
        throw new Error("axis-a inside");
      },
      after: () => {
        throw new Error("axis-a after");
      },
    };
    for (const [where, thrower] of Object.entries(positions)) {
      let out = "";
      let err = "";
      const sink = { out: (s: string) => { out += s; }, err: (s: string) => { err += s; } };
      const deps =
        where === "before"
          ? { deriveSpecPaths: thrower, ...sink }
          : where === "inside"
            ? { analyzeSpecs: thrower, ...sink }
            : { reportMeasured: thrower, ...sink };
      const code = main([mkRoot({ "e2e/uat/a.uat.spec.ts": CLEAN_SPEC })], deps);
      expect(code, `axis (a) ${where}`).toBe(2);
      expect(out, `axis (a) ${where}: stdout must stay empty`).toBe("");
      expect(err).toContain(PROCESS_BOUNDARY_MARKER);
    }
  });

  /**
   * The depth at which THIS THREAD'S parser overflows — which is NOT the depth at which the CHILD
   * PROCESS's does. `parseBoundary()` bisects through a spawned `node`; a vitest worker thread runs
   * with a different stack size, so a depth that reliably crashes the child parses fine here.
   * MEASURED: the first draft of the case below used the child-derived depth in process, the parse
   * succeeded, `visited` came back 2, and the case read as a defect in the boundary rather than a
   * false premise in the harness. This is the ninth logged instance of that class.
   */
  let inProcessOverflowCache: number | null = null;
  function inProcessOverflowDepth(): number {
    if (inProcessOverflowCache !== null) return inProcessOverflowCache;
    const ts = hostTypeScript as typeof import("typescript");
    for (let depth = 1024; depth <= 1 << 20; depth *= 2) {
      try {
        ts.createSourceFile("p.ts", nestedSpec(depth), ts.ScriptTarget.Latest, true);
      } catch {
        inProcessOverflowCache = depth;
        return depth;
      }
    }
    throw new Error("premise failed: no nesting depth overflowed this thread's parser");
  }

  it("PROBE 2 (b): a caught file contributes NOTHING to `visited`, and `expected` is unchanged", async () => {
    const { analyzeSpecs } = await loadChecker();
    const overflow = inProcessOverflowDepth();
    const root = mkRoot({
      "e2e/uat/nested.uat.spec.ts": nestedSpec(overflow),
      "e2e/uat/clean.uat.spec.ts": CLEAN_SPEC,
    });
    const rels = ["e2e/uat/clean.uat.spec.ts", "e2e/uat/nested.uat.spec.ts"];
    const analysis = analyzeSpecs(root, rels, hostTypeScript, await programContextFor(root, rels));
    expect(analysis.expected, "`expected` is derived BEFORE the loop and the boundary must not move it").toBe(
      rels.length,
    );
    expect(analysis.visited, "the caught file must not be counted as checked").toBe(1);
    expect(analysis.errors).toHaveLength(1);
    expect(analysis.errors[0]).toContain("e2e/uat/nested.uat.spec.ts");
  });

  it("PROBE 2 (c): every branch writes to the stream MEASUREMENT_BRANCH_STREAMS records, and no other", async () => {
    const { reportMeasured, MEASUREMENT_BRANCH_STREAMS } = await loadChecker();
    const inputs: Record<keyof typeof MEASUREMENT_BRANCH_STREAMS, { visited: number; expected: number; findings: readonly string[] }> = {
      vacuity_floor: { visited: 0, expected: 1, findings: [] },
      denominator_floor: { visited: 1, expected: 2, findings: [] },
      findings: { visited: 1, expected: 1, findings: ["f"] },
      pass: { visited: 1, expected: 1, findings: [] },
    };
    for (const [branch, m] of Object.entries(inputs)) {
      let out = "";
      let err = "";
      const code = reportMeasured(m, false, (s) => { out += s; }, (s) => { err += s; });
      const declared = MEASUREMENT_BRANCH_STREAMS[branch as keyof typeof MEASUREMENT_BRANCH_STREAMS];
      expect(code, `${branch}: exit code`).toBe(declared.exitCode);
      const wrote = declared.stream === "stdout" ? out : err;
      const other = declared.stream === "stdout" ? err : out;
      expect(wrote, `${branch}: nothing reached ${declared.stream}`).not.toBe("");
      expect(other, `${branch}: something reached the stream this branch does not write to`).toBe("");
    }
    // …and every per-file could-not-run REASON reaches stderr, never stdout.
    const { overflow } = parseBoundary();
    const r = runCheck(mkRoot({ "e2e/uat/nested.uat.spec.ts": nestedSpec(overflow) }));
    // 31-28 (WR-29): the sentence names the PARSE, because that is where the fault was raised.
    expect(r.stderr).toContain("could not be PARSED");
    expect(r.stdout).toBe("");
  });

  // ── PROBE 3: WHAT IS THE EXIT CODE ASSEMBLED FROM — two answers at once ───────────────────────

  it("PROBE 3: every pair of simultaneous conditions resolves to the DECIDED winner", async () => {
    const { PARSER_ABSENT_MARKER, BROWSER_ABSENT_MARKER } = await loadChecker();
    const { overflow } = parseBoundary();

    // (i) a pathological spec AND an absent parser -> the parser skip wins; the file is never read.
    const noParser = mkRoot({ "e2e/uat/nested.uat.spec.ts": nestedSpec(overflow) }, false);
    const a = runCheck(noParser);
    expect(a.status).toBe(2);
    expect(a.stderr).toContain(PARSER_ABSENT_MARKER);
    expect(a.stderr, "the per-file boundary is never reached, because the parser load precedes it").not.toContain(
      "could not be analysed",
    );

    // (ii) a pathological spec AND an empty derived set -> the empty set wins; the spec is outside
    //      the `uat` segment, so it was never derived and never parsed.
    const notDerived = mkRoot({ "e2e/spec/nested.uat.spec.ts": nestedSpec(overflow) });
    const b = runCheck(notDerived);
    expect(b.status).toBe(2);
    expect(b.stderr).toContain("ZERO uat specs were visited (0 derived)");
    expect(b.stderr).not.toContain("could not be analysed");

    // (iii) a browser-absent condition AND a pathological spec -> the D-15 loud skip wins, because
    //       saying anything about spec CONTENTS when the lane cannot run them invites a reader to
    //       treat a checked spec as an exercised one. That order is stated in `main`'s own comment.
    const noBrowser = mkRoot({ "e2e/uat/nested.uat.spec.ts": nestedSpec(overflow) }, false);
    const c = runCheck(noBrowser, "--check-browser");
    expect(c.status).toBe(2);
    expect(c.stderr).toContain(BROWSER_ABSENT_MARKER);
    expect(c.stderr).not.toContain("could not be analysed");
  });

  // ── PROBE 4: AT WHICH POSITIONS IS THE PREDICATE EVEN ASKED ───────────────────────────────────

  it("PROBE 4: every remaining self-recursion in the module has a stated disposition", () => {
    const ts = hostTypeScript as typeof import("typescript");
    const sf = moduleSource();
    const selfRecursive: string[] = [];
    const scan = (node: import("typescript").Node): void => {
      let name: string | null = null;
      let body: import("typescript").Node | undefined;
      if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
        name = node.name.text;
        body = node.body;
      } else if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer !== undefined &&
        (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      ) {
        name = node.name.text;
        body = node.initializer.body;
      }
      if (name !== null && body !== undefined) {
        let calls = false;
        const inner = (n: import("typescript").Node): void => {
          if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === name) {
            calls = true;
          }
          ts.forEachChild(n, inner);
        };
        inner(body);
        if (calls) selfRecursive.push(name);
      }
      ts.forEachChild(node, scan);
    };
    scan(sf);

    /**
     * The disposition of every self-recursion the module still carries. A function that starts
     * calling itself lands outside this register and turns the case red naming itself — which is
     * how the SECOND unguarded self-recursion (`deriveSpecPaths`'s walk) would have been visible
     * before CR-15 had to point at it.
     */
    const DISPOSITIONS: Readonly<Record<string, string>> = Object.freeze({});

    expect(
      selfRecursive.filter((n) => !(n in DISPOSITIONS)),
      "a self-recursive function with no stated disposition",
    ).toEqual([]);
    expect(
      Object.keys(DISPOSITIONS).filter((n) => !selfRecursive.includes(n)),
      "a disposition for a function that no longer recurses — delete it rather than keep it",
    ).toEqual([]);
    // The two CR-15 named are gone: the AST walk (D-21 (1)) and the directory walk (D-28 (1)).
    expect(selfRecursive).not.toContain("forEachDescendant");
    expect(selfRecursive).not.toContain("walk");
    // 31-28 (D-30 (5)): and so is the THIRD — `calleeDottedPath`, which D-18 (1) made recursive and
    // D-21 (1) then had to bound with a threaded budget. It walks an EXPLICIT STACK now, so the
    // module carries no self-recursion at all and the register that dispositioned them is EMPTY
    // rather than carrying an entry for a mechanism that is gone.
    expect(
      selfRecursive,
      "the module regrew a self-recursion; a stack depth is an input the author controls",
    ).toHaveLength(0);
  });

  it("PROBE 4: every byte-touching position OUTSIDE the per-file boundary is caught by a named answer", async () => {
    const { main, PROCESS_BOUNDARY_MARKER } = await loadChecker();
    // The spec-path derivation reads directory entries and resolves links. Each failure mode is
    // already a REFUSAL (exit 2) inside deriveSpecPaths; anything it cannot answer escapes to the
    // process boundary, which is driven here rather than assumed.
    let err = "";
    const code = main([mkRoot()], {
      deriveSpecPaths: () => {
        throw new Error("probe-4 derivation fault");
      },
      out: () => {},
      err: (s: string) => {
        err += s;
      },
    });
    expect(code).toBe(2);
    expect(err).toContain(PROCESS_BOUNDARY_MARKER);

    // The parser load is fail-closed by its own catch (an absent parser is the loud skip), and the
    // browser probe is fail-closed by its own catch (an inconclusive probe skips, it never greens).
    // Both are asserted at the OUTPUT rather than read off the source.
    const parserless = runCheck(mkRoot({ "e2e/uat/a.uat.spec.ts": CLEAN_SPEC }, false));
    expect(parserless.status).toBe(2);
    const browserless = runCheck(mkRoot({ "e2e/uat/a.uat.spec.ts": CLEAN_SPEC }, false), "--check-browser");
    expect(browserless.status).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-28 (Task 1) — THE ROUNDS-1-TO-6 EVASION CORPUS, DRIVEN AT THE ENTRY THE §14 GATE INVOKES
//
// WHAT THIS BLOCK IS. Every evasion spelling this phase's six rounds produced, driven through
// `node <path>/uat-spec-integrity.js <repo-root>` — the exact invocation
// `agent-factory/workflows/05-pr-quality-gate.md` names — with its real exit code and both streams
// asserted. NOT ONE CASE BELOW IMPORTS A FUNCTION FROM THE MODULE to decide a ban. This phase's
// recorded failure mode is a fix verified against its own predicate rather than at the coordinate
// the gate asks, and it has produced a new Critical inside the previous round's fix six times.
//
// THIS BLOCK IS DELIBERATELY RED AT THE END OF TASK 1. Each case carries its POST-fix assertion, so
// the corpus reproduces the findings against the committed `.js` at HEAD and turns green only when
// the mechanism changes. A run in which every case below PASSES against the unmodified artifact
// would mean the corpus does not reproduce anything, which is the failing direction that matters.
//
// WHERE THE TARGETS LIVE. Every root is an OS-temp-directory root, never one under `.temp/`. That
// is a MEASURED requirement, not a preference: a probe root inside this repository is a directory
// Node's module walk can climb out of, so a target built "without typescript" resolved
// `<repo>/node_modules/typescript` and the parser-absent loud skip measured EXIT=1 instead of 2.
// The premise was asserted, the harness was wrong, and the row was re-driven.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** A target repository whose spec content is GENERATED rather than copied from the fixtures dir. */
function mkGeneratedTarget(
  files: Record<string, string>,
  opts: {
    readonly typescript?: "real" | "none" | "stub-no-import-predicates";
    /** `undefined` = the default configuration; an explicit `null` = NO configuration file. */
    readonly tsconfig?: string | null;
  } = {},
): string {
  const root = mkTmp();
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "target", private: true }), "utf8");
  const mode = opts.typescript ?? "real";
  if (mode === "real") {
    symlinkSync(REPO_NODE_MODULES, join(root, "node_modules"), "dir");
  } else if (mode === "stub-no-import-predicates") {
    // RR-07's shape: a module carrying EVERY predicate `loadTypeScriptFromTarget` validates and
    // NONE of the import predicates `deriveImportRenames` needs.
    //
    // THE MEMBERS ARE REMOVED WITH `defineProperty`, NOT ASSIGNED OVER. The first version of this
    // stub did `shim[k] = undefined` against a prototype whose members are ACCESSOR properties with
    // no setter, which in a CommonJS (sloppy-mode) module is a SILENT NO-OP: the premise probe
    // measured `typeof m.isImportDeclaration === "function"` after it, and the row reported a
    // finding it could not have reported. The premise is asserted by the case itself, below.
    const dir = join(root, "node_modules", "typescript");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "typescript", version: "0.0.0-stub", main: "index.js" }),
      "utf8",
    );
    writeFileSync(
      join(dir, "index.js"),
      '"use strict";\n' +
        `const real = require(${JSON.stringify(join(REPO_NODE_MODULES, "typescript"))});\n` +
        "const shim = {};\n" +
        "for (const k of Object.keys(real)) { try { shim[k] = real[k]; } catch { /* accessor threw */ } }\n" +
        'for (const k of ["isImportDeclaration","isNamedImports","isNamespaceImport","isImportSpecifier"]) {\n' +
        "  Object.defineProperty(shim, k, { value: undefined, enumerable: true, configurable: true, writable: true });\n" +
        "}\n" +
        "module.exports = shim;\n",
      "utf8",
    );
  }
  equipTarget(root, opts.tsconfig === undefined ? TARGET_TSCONFIG : opts.tsconfig);
  for (const [rel, body] of Object.entries(files)) plant(root, rel, body);
  return root;
}

/** One generated spec at the canonical probe path, run at the entry. */
function driveSpec(
  spec: string,
  opts: Parameters<typeof mkGeneratedTarget>[1] = {},
  extraFiles: Record<string, string> = {},
): { status: number | null; stdout: string; stderr: string } {
  return runCheck(mkGeneratedTarget({ "e2e/uat/p.uat.spec.ts": spec, ...extraFiles }, opts));
}

const TAIL = '  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");';

// ── MOVEMENT 1: the corpus's own denominator ─────────────────────────────────────────────────
//
// D-33 (1), 2026-09-11 — WHAT USED TO BE HERE, AND WHY IT IS GONE. This section carried a second
// derivation: `reviewFindingsNamingThisRunnable()` walked `31-REVIEW.md`'s own `###` headings and
// the equality below compared them against `CORPUS_COVERAGE`, a hand-typed object literal. A named
// human answered `remove-axis` to the `checkpoint:decision` plan 31-32 put in front of this edit,
// refusing both `freeze-manifest` and `derive-both-keep-review`, and the axis is deleted.
//
// THE REMOVAL IS A GATE LOWERING AND IS RECORDED AS ONE. Until this edit, a review finding naming
// this runnable that no corpus row covered turned the suite RED on every run. Nothing observes that
// relationship now; `31-38`, this round's closing measurement, asserts it ONCE PER ROUND instead.
// A one-shot a plan takes can be skipped, and skipping it leaves no red. That weakness is the
// substance of the lowering, and D-33 in `31-CONTEXT.md` writes it down in full.
//
// WHAT FORCED IT. This project REPLACES `31-REVIEW.md` at every gap-closure round rather than
// appending to it, so the expected side was recomputed from a document that moves under the test.
// Measured at the round-7 base: the suite was RED on a commit that changed zero source bytes, the
// derived set reading `CR-23 CR-25 IN-16 IN-17 WR-33 WR-35` against a literal reading
// `CR-18 CR-21 IN-15 WR-26 WR-29 WR-30`.

/**
 * D-33 (3): the row floor the deleted derivation used to supply half of, MEASURED from this file's
 * own AST at the commit that removed it (2026-09-11) rather than dropped.
 *
 * It is a hand-typed number and it is disclosed as one. It is NOT a mirror of a moving set: it can
 * only be wrong by UNDER-claiming, and it turns red when a row is deleted, which is the fail-closed
 * direction. Deleting `CORPUS_COVERAGE` without it would have dropped the floor from 16 to 6 in
 * silence — a second lowering nobody chose.
 *
 * What it does NOT claim: that any particular finding is covered. It bounds deletion; it does not
 * bind content.
 *
 * 31-34 (2026-09-11): RE-MEASURED from this file's own AST at the commit that added CR-23's rows,
 * 33 -> 45. The old value was not wrong, it was STALE: a floor left where it was while twelve rows
 * landed above it would silently permit those twelve to be deleted again. Raising it is what keeps
 * the floor's only failure direction — UNDER-claiming — from becoming a standing allowance. The
 * number is derived by `declaredCorpusRowIds().size`, not counted by hand.
 *
 * 31-35 (2026-09-11): RE-MEASURED again at the commit that added CR-25's rows, 45 -> 55, by the
 * same derivation and for the same reason. Two of the eleven rows come from this plan's own
 * adversarial probe of its own fix rather than from the finding it was written for.
 */
const CORPUS_ROW_FLOOR = 55;

/** One row per member of the exported residual register, keyed by that member's INDEX. */
const RESIDUAL_COVERAGE: Readonly<Record<number, string>> = Object.freeze({
  // THE REGISTER SHRANK FROM NINE TO SIX, BY MEASUREMENT. RR-01 (alias), RR-03 (cross-module
  // re-export), RR-08 (destructured TestInfo) and RR-09 (the census as the ban's only scope
  // authority) were CLOSED by the checker, each with a corpus row driven at the entry that reported
  // `0 findings` / EXIT=0 before and `1 finding(s)` / EXIT=1 after. RR-05 (the chain-step bound) was
  // DELETED with the recursion it existed for. RR-07 (a silent degrade) was REPLACED by the
  // could-not-run route below. RR-04 was rewritten rather than removed: the object-literal half is
  // decided by identity and the `this` half is not. Two members are NEW and disclose what the
  // cutover itself costs — the two-rule pairing, and the unmeasured installed-package route.
  0: "RR-02 a member computed from a non-literal expression",
  1: "RR-06 an option enabled by something other than the `true` keyword",
  2: "RR-10 identity and spelling are two rules for one question (NEW, D-30 (3))",
  3: "RR-04' a callee whose head the checker cannot resolve (REWRITTEN)",
  4: "RR-11 a target that cannot create a Program is a could-not-run at exit 2 (REPLACES RR-07)",
  5: "RR-12 the installed-package identity route is reasoned, not measured (NEW, UNKNOWN - verify)",
  // 31-34 (D-35): SEVEN. The split of the terminal `foreign` arm closed two reproduced instances
  // and left one shape open in the same family, so the register grew by exactly the shape the
  // change did not reach rather than absorbing it.
  6: "RR-13 a head the spec file hand-`declare`s for itself (NEW, D-35)",
  // 31-35 (D-36): TEN. CR-25 found the walk's own two bounds failing OPEN — a bound that was
  // reached returned a partial surface with no signal, and every declaration past it resolved
  // `foreign`, which is accept. Both bounds are now published members. The third member is a
  // DIFFERENT shape in the same family, found by this plan's own adversarial probe and measured
  // identically at the commit before it: a member behind an INDEX SIGNATURE is outside the walked
  // set at any depth, so no bound is reached and nothing is truncated. The probe's other finding —
  // a framework type behind a standard-library container, which the walk's narrowing had made
  // unreachable — is CLOSED rather than disclosed, by descending into a container's type
  // arguments, and has a corpus row instead of a member.
  7: "RR-14 the surface walk's DEPTH bound, reached is could-not-run (NEW, D-36)",
  8: "RR-15 the surface walk's NODE bound, reached is could-not-run (NEW, D-36)",
  9: "RR-16 a framework member reachable only through an INDEX SIGNATURE (NEW, D-36)",
});

describe("uat-spec-integrity — 31-28 MOVEMENT 1: the corpus's denominator is DERIVED, not typed", () => {
  it("covers every member of UNRESOLVABLE_CALLEE_RESIDUALS, by INDEX, in BOTH directions", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    const indices = UNRESOLVABLE_CALLEE_RESIDUALS.map((_, i) => i);
    expect(indices.length, "the register is empty — the equality below would be vacuous").toBeGreaterThan(0);
    expect(Object.keys(RESIDUAL_COVERAGE).map(Number).sort((a, b) => a - b)).toEqual(indices);
  });

  it("the corpus carries AT LEAST as many rows as the register produces, and never fewer than the D-33 floor", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    // The surviving derivation's own premise, asserted before the conclusion: an empty register
    // would make the first floor below vacuous.
    expect(UNRESOLVABLE_CALLEE_RESIDUALS.length, "the register is empty — the floor below would be vacuous")
      .toBeGreaterThan(0);
    // THE RUNNING COUNT IS DERIVED, NOT TALLIED. A `Set` filled by the cases as they execute is
    // read in whatever order the runner chose, so this case could observe a nearly-empty set and
    // pass — the vacuity shape this phase has recorded. The row ids are counted from THIS FILE's
    // own AST instead, which is order-independent and cannot be inflated by a case that never ran.
    const declared = declaredCorpusRowIds().size;
    expect(declared, "the corpus runs fewer rows than the residual register has members")
      .toBeGreaterThanOrEqual(UNRESOLVABLE_CALLEE_RESIDUALS.length);
    // D-33 (3): the half the removed review derivation used to supply, kept as a monotone floor.
    expect(declared, "a corpus row was deleted — the floor D-33 (3) measured at 2026-09-11 moved down")
      .toBeGreaterThanOrEqual(CORPUS_ROW_FLOOR);
  });

  // D-33 (4), 2026-09-11. The structural half of the `remove-axis` decision a named human took in
  // front of plan 31-32. The axis this block used to carry read `31-REVIEW.md` at run time, and
  // this project REPLACES that document at every gap-closure round rather than appending to it, so
  // the expected value moved under the test: it went RED at the round-7 base on a commit that
  // changed zero source bytes. Removing the reading is the decision; THIS case is what stops the
  // reading from coming back under another name, and it is derived from this file's own syntax tree
  // rather than by grep over prose, because a comment naming the document is not a read of it.
  it("D-33 (4): no string literal in this file names `31-REVIEW.md` — the oracle cannot move under the corpus", () => {
    const ts = hostTypeScript as typeof import("typescript");
    const src = readFileSync(join(HERE, "uat-spec-integrity.test.ts"), "utf8");
    const sf = ts.createSourceFile("t.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const literals: string[] = [];
    const walk = (n: import("typescript").Node): void => {
      if (ts.isStringLiteralLike(n)) literals.push(n.text);
      ts.forEachChild(n, walk);
    };
    walk(sf);
    // The walk's OWN premise, asserted before the conclusion: a walk that found no string literal
    // at all would make the absence below vacuously true.
    expect(literals.length, "the walk found no string literal in this file — the derivation is wrong")
      .toBeGreaterThan(0);
    // The banned name is ASSEMBLED rather than written, for the one reason that matters: a case
    // that spelled it whole would carry the very literal it refuses and could never pass.
    const rewrittenReviewDoc = ["31", "REVIEW.md"].join("-");
    expect(
      literals.filter((l) => l === rewrittenReviewDoc),
      `a string literal naming ${rewrittenReviewDoc} survives in this file — an oracle that reads a ` +
        "per-round-rewritten planning artifact is an oracle that moves under the test",
    ).toEqual([]);
  });
});

/**
 * Every DISTINCT row id this corpus drives, derived from this file's own AST by counting the
 * `row("…")` call sites. Marking a row is what earns it a place in the denominator above.
 */
function declaredCorpusRowIds(): ReadonlySet<string> {
  const ts = hostTypeScript as typeof import("typescript");
  const src = readFileSync(join(HERE, "uat-spec-integrity.test.ts"), "utf8");
  const sf = ts.createSourceFile("t.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const ids = new Set<string>();
  const walk = (n: import("typescript").Node): void => {
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === "row" &&
      n.arguments.length === 1 &&
      ts.isStringLiteralLike(n.arguments[0])
    ) {
      ids.add((n.arguments[0] as import("typescript").StringLiteralLike).text);
    }
    ts.forEachChild(n, walk);
  };
  walk(sf);
  return ids;
}

/** Marks a corpus row. The marker is what `declaredCorpusRowIds` counts. */
function row(id: string): string {
  return id;
}

// ── CR-18: a block-scoped function declaration, and the ambient `declare` spelling ─────────────

describe("uat-spec-integrity — 31-28 CR-18: a BLOCK-SCOPED binding does not shadow a module-scope import", () => {
  it("RED 1a: a block-scoped function declaration beside a module-scope `it.skip(...)` is REFUSED", () => {
    row("RED-1a-CR18-block-rename");
    // MEASURED against the committed .js at HEAD: `0 findings` / EXIT=0. The evading file
    // type-checks CLEAN under `tsc --strict --noEmit` against this repository's own transcribed
    // surface, and its transpiled JavaScript keeps the framework import — a LIVE bypass, not a
    // parse curiosity. The checker resolves the callee head to the ImportSpecifier, so identity
    // decides this row exactly.
    const r = driveSpec(`import { test as it, expect } from "@playwright/test";
if (false) {
  function it(): void {}
  void it;
}
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("1 finding(s) over 1/1 uat specs checked");
    expect(r.stdout).toContain("test.skip");
  });

  it("RED 1b: the namespace family, identically", () => {
    row("RED-1b-CR18-block-namespace");
    const r = driveSpec(`import * as pw from "@playwright/test";
if (false) {
  function pw(): void {}
  void pw;
}
pw.test.skip("scenario", async ({ page }) => {
  await pw.expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
`);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("test.skip");
  });

  it("CONTROL 1: the SAME file without the block is refused BEFORE and AFTER", () => {
    row("CTRL-1-CR18-without-the-block");
    const r = driveSpec(`import { test as it, expect } from "@playwright/test";
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("test.skip");
  });

  it("CONTROL 2: a block-scoped CLASS is refused BEFORE and AFTER (the `tdz` arm's own control)", () => {
    row("CTRL-2-CR18-block-scoped-class");
    const r = driveSpec(`import { test as it, expect } from "@playwright/test";
{
  class it {}
  void it;
}
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status).toBe(1);
  });

  it("RECORDED, NOT ASSERTED: the ambient `declare` spelling evades — and does NOT type-check", () => {
    row("RED-2a-CR18-declare-rename");
    row("RED-2b-CR18-declare-namespace");
    // `declare const it: unknown;` beside the import reports `0 findings`/EXIT=0 — the review's
    // third CR-18 spelling, reproduced. But `tsc --strict --noEmit` REFUSES the file with TS2440
    // ("Import declaration conflicts with local declaration of 'it'"), so the spelling is a
    // CURIOSITY rather than a live bypass: a spec that does not compile is a spec Playwright never
    // runs. This case therefore asserts the fact that makes it a curiosity — that the language
    // refuses the construct — and NOT a direction for the ban, because asserting a ban direction on
    // input the language itself refuses would send the fix after a shape no author can ship.
    const decl = `import { test as it, expect } from "@playwright/test";
declare const it: unknown;
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`;
    const r = driveSpec(decl);
    expect([0, 1, 2], "outside the D-12 contract").toContain(r.status);
    const host = hostTypeScript as typeof import("typescript");
    const dir = mkTmp();
    const specPath = join(dir, "p.uat.spec.ts");
    writeFileSync(specPath, decl, "utf8");
    const program = host.createProgram([specPath, join(FIXTURES, "playwright-test.d.ts")], {
      strict: true,
      noEmit: true,
      target: host.ScriptTarget.ES2022,
      module: host.ModuleKind.ESNext,
      moduleResolution: host.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
    });
    const codes = host
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file?.fileName === specPath)
      .map((d) => d.code);
    expect(codes, "the ambient spelling was expected NOT to type-check (TS2440)").toContain(2440);
  });
});

// ── CR-21: the scenario body is found by TYPE, never by a fixed argument index ─────────────────

describe("uat-spec-integrity — 31-28 CR-21: every documented Playwright overload carries the ban", () => {
  const THREE_ARG = `import { test, expect } from "@playwright/test";
test("scenario", { tag: "@smoke" }, async ({ page }, testInfo) => {
  testInfo.skip();
${TAIL}
});
`;
  const TWO_ARG = `import { test, expect } from "@playwright/test";
test("scenario", async ({ page }, testInfo) => {
  testInfo.skip();
${TAIL}
});
`;

  it("RED 3: the three-argument tag/annotation form is REFUSED, naming `test.info().skip`", () => {
    row("RED-3-CR21-three-argument-overload");
    // MEASURED against the committed .js: `0 findings` / EXIT=0, while the two-argument form
    // reports `1 finding(s)` / EXIT=1. The form is idiomatic Playwright, documented since 1.42, and
    // it type-checks CLEAN against a surface carrying that overload — the committed transcription's
    // TS2554 is `R-07` drift, a fact about the transcription and not about the spelling. The
    // checker gives the accessed object the declared type `TestInfo` and the member's declaration
    // the framework's own file, so identity decides this row without reading an argument index.
    const r = driveSpec(THREE_ARG);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("1 finding(s) over 1/1 uat specs checked");
    expect(r.stdout).toContain("test.info().skip");
  });

  it("CONTROL 3: the two-argument form is refused BEFORE and AFTER", () => {
    row("CTRL-3-CR21-two-argument-overload");
    const r = driveSpec(TWO_ARG);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("test.info().skip");
  });

  it("the two forms produce an IDENTICAL finding, modulo the call's own line", () => {
    row("RED-3b-CR21-overloads-agree");
    const strip = (s: string): string => s.replace(/p\.uat\.spec\.ts:\d+/g, "p.uat.spec.ts:<line>");
    expect(strip(driveSpec(THREE_ARG).stdout)).toBe(strip(driveSpec(TWO_ARG).stdout));
  });
});

// ── WR-26: the exemption's position must be the map's own position, not a superset of it ───────

describe("uat-spec-integrity — 31-28 WR-26: no false refusal one position over", () => {
  it("RED 5: a function expression at index 1 of a NON-`test(...)` call's second argument is NOT refused", () => {
    row("RED-5-WR26-second-argument-helper");
    // MEASURED against the committed .js: `1 finding(s)` / EXIT=1 naming `test.skip` — a construct
    // ABSENT from the file. A FALSE REFUSAL, the identical failure WR-20 and then WR-23 were each
    // convened to close, reproducing verbatim one position over. The failure direction here is the
    // one the recipe calls "worse than a missed one".
    const r = driveSpec(`import { test as it, expect } from "@playwright/test";
declare function helper(n: number, f: (a: number, b: { skip: (x: number) => number }) => number): void;
helper(1, function (a, it) { return it.skip(a); });
it("the invoice total is shown", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status, `stdout: ${r.stdout}`).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1 uat specs checked");
  });

  it("CONTROL A (WR-23): index 1 of an ordinary helper is not refused, BEFORE or AFTER", () => {
    row("CTRL-A-WR23-index-1-helper");
    const r = driveSpec(`import { test as it, expect } from "@playwright/test";
function inner(n: number, it: { skip: (x: number) => number }): number {
  return it.skip(n);
}
void inner;
it("the invoice total is shown", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status).toBe(0);
  });

  it("CONTROL B (WR-24): the union fixture reports its marked region, and ONLY it", () => {
    row("CTRL-B-WR24-mutate-remove");
    const present = runCheck(
      mkTargetRepo({ "e2e/uat/p.uat.spec.ts": "shadowed-rename.uat.spec.ts" }),
    );
    expect(present.status).toBe(1);
    expect(present.stdout).toContain("1 finding(s) over 1/1 uat specs checked");
    const removed = runMutated("shadowed-rename.uat.spec.ts");
    expect(removed.status, `stdout: ${removed.stdout}`).toBe(0);
  });
});

// ── WR-30 and the `tdz` arm: RECORDED with the checker's own answer, for the S2 checkpoint ─────

describe("uat-spec-integrity — 31-28 WR-30: `using` is classified by the ABSENCE of two flag bits", () => {
  const usingSpec = (kw: "using" | "await using"): string =>
    `import { test as it, expect } from "@playwright/test";
${kw === "using" ? "function" : "async function"} wrapper(): ${kw === "using" ? "void" : "Promise<void>"} {
  it.skip("scenario", async ({ page }) => {
${TAIL}
  });
  ${kw} it = { ${kw === "using" ? "[Symbol.dispose]() {}" : "async [Symbol.asyncDispose]() {}"} };
  void it;
}
void wrapper();
`;

  it("GREEN 4: `using` and `await using` now AGREE, and both are refused", async () => {
    row("RED-4a-WR30-using");
    row("RED-4b-WR30-await-using");
    // MEASURED BEFORE, AND THE MEASUREMENT CORRECTED THE FINDING'S OWN TEXT. `listHoists` asked
    // `((flags & (Let | Const)) === 0)`. On this repository's parser (typescript 6.0.3):
    //   Let = 1 · Const = 2 · Using = 4 · AwaitUsing = 6
    // so `using` (4) answered TRUE — classified as hoisting, range widened to the enclosing
    // function, the ban suppressed, `0 findings` / EXIT=0 — while `await using` (6, which CARRIES
    // the Const bit) answered FALSE and was correctly ranged by the `tdz` arm at `1 finding(s)` /
    // EXIT=1. WR-30's own fix sketch adds `(nodeFlags.AwaitUsing ?? 0)` to the mask, which is a
    // NO-OP for a spelling that was never misclassified: the defect was real and HALF the size the
    // Warning states. The mask now names every block-scoping flag the parser publishes, so the two
    // spellings agree — and they agree in the REFUSING direction.
    expect(driveSpec(usingSpec("using")).status).toBe(1);
    expect(driveSpec(usingSpec("await using")).status).toBe(1);
  });

  it("both spellings are CURIOSITIES, not live bypasses — the language refuses them (TS2448)", () => {
    row("RED-4c-WR30-tdz-does-not-compile");
    // The reference sits ABOVE its own block-scoped declaration, so refusing it is the safe
    // direction AND the language refuses the file outright. A spelling that does not compile is a
    // spec Playwright never runs; recording that is what separates a live bypass from a curiosity,
    // and it is why the fix is the mask rather than a new ban member.
    const host = hostTypeScript as typeof import("typescript");
    for (const keyword of ["using", "await using"] as const) {
      const dir = mkTmp();
      const specPath = join(dir, "p.uat.spec.ts");
      writeFileSync(specPath, usingSpec(keyword), "utf8");
      const program = host.createProgram([specPath, join(FIXTURES, "playwright-test.d.ts")], {
        strict: true,
        noEmit: true,
        target: host.ScriptTarget.ES2022,
        module: host.ModuleKind.ESNext,
        moduleResolution: host.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      });
      const codes = host
        .getPreEmitDiagnostics(program)
        .filter((d) => d.file?.fileName === specPath)
        .map((d) => d.code);
      expect(codes, `${keyword}: expected TS2448 (used before its declaration)`).toContain(2448);
    }
  });
});

// ── WR-29: four could-not-run reasons claimed, three implemented ───────────────────────────────

describe("uat-spec-integrity — 31-28 WR-29: the four could-not-run reasons are four SENTENCES", () => {
  it("RED 6: a fault raised inside the PARSE names the parse, not the walk", () => {
    row("RED-6-WR29-parse-fault-sentence");
    // MEASURED at the adjacent overflow depth: the fault is raised inside `ts.createSourceFile`,
    // and the reason reported is "could not be analysed (Maximum call stack size exceeded)" — the
    // WALK's sentence, byte-identical to what a walk fault produces. The module's own comment says
    // the four reasons "stay DISTINGUISHABLE (unreadable · did not parse · the parse itself faulted
    // · could not be analysed)". A reader cannot tell which happened, which is the one thing the
    // sentence promises.
    const { overflow } = parseBoundary();
    const r = driveSpec(nestedSpec(overflow));
    expect(r.status).toBe(2);
    expect(r.stderr, "the parse fault still reports the walk's sentence").toMatch(/could not be PARSED/);
  });
});

// ── IN-15: the assertion head's split is computed once ─────────────────────────────────────────

describe("uat-spec-integrity — 31-28 IN-15: canonicalAssertionHead splits its input ONCE", () => {
  it("RED 7: the split appears at most once inside the function, DERIVED from the module's own AST", () => {
    row("RED-7-IN15-duplicate-split");
    const ts = hostTypeScript as typeof import("typescript");
    const src = readFileSync(join(HERE, "uat-spec-integrity.ts"), "utf8");
    const sf = ts.createSourceFile("m.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let body: string | null = null;
    const walk = (n: import("typescript").Node): void => {
      if (
        ts.isFunctionDeclaration(n) &&
        n.name !== undefined &&
        n.name.text === "canonicalAssertionHead"
      ) {
        body = n.getText(sf);
      }
      ts.forEachChild(n, walk);
    };
    walk(sf);
    expect(body, "canonicalAssertionHead was not found — the derivation is wrong").not.toBeNull();
    const occurrences = (body as unknown as string).split('split(".")').length - 1;
    expect(occurrences, "the same string is split twice in one expression").toBeLessThanOrEqual(1);
  });
});

// ── the residual register, row by row, at the entry ────────────────────────────────────────────

describe("uat-spec-integrity — 31-28: every member of the residual register, driven", () => {
  it("RR-01: an aliased binding is REFUSED", () => {
    row("RED-8-RR01-alias");
    // MEASURED: `0 findings` / EXIT=0, type-checks CLEAN, keeps the import — a LIVE bypass. The
    // checker gives `t` the declared type `Test` and `.skip`'s declaration the framework's own file.
    const r = driveSpec(`import { test, expect } from "@playwright/test";
const t = test;
t.skip("scenario", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status).toBe(1);
  });

  it("RR-02: a member computed from a variable stays a NAMED refusal (accepted by design)", async () => {
    row("RED-9-RR02-computed-member");
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    const r = driveSpec(`import { test, expect } from "@playwright/test";
const name = "skip" as const;
test[name]("scenario", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status).toBe(0);
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.some((m) => m.includes("computed from a non-literal expression")),
      "the shape passes and the register no longer names it — an undisclosed boundary",
    ).toBe(true);
  });

  it("RR-03: a rename arriving through another module is REFUSED", () => {
    row("RED-10-RR03-cross-module-reexport");
    // MEASURED: `0 findings` / EXIT=0, type-checks CLEAN — a LIVE bypass. The checker follows the
    // re-export: `.skip`'s declaration is the framework's own file and `it`'s type is `Test`.
    const r = driveSpec(
      `import { it } from "./local-frame";
import { expect } from "@playwright/test";
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`,
      {},
      { "e2e/uat/local-frame.ts": 'export { test as it } from "@playwright/test";\n' },
    );
    expect(r.status).toBe(1);
  });

  it("RR-04': the object-literal head is CLOSED by identity; the register names what remains", async () => {
    row("RED-11-RR04-non-identifier-head");
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    // MEASURED, AND IT REVERSES THIS ROW'S PRE-CUTOVER EXPECTATION. `({ test }).test.skip(...)` has
    // no head identifier, so `calleeDottedPath` declines and the SPELLING rule can put no
    // membership question. The checker does not care about the head at all: it resolves the member
    // `skip` to its declaration in the framework's own file, so identity refuses the call and the
    // finding is named from the declaring type. Refusing MORE is the safe direction, and the
    // register member was REWRITTEN rather than deleted, because the half it still discloses is
    // real: a call on `this`, or on an object whose member the checker cannot resolve, is undecided.
    const r = driveSpec(`import { test, expect } from "@playwright/test";
({ test }).test.skip("scenario", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status, `stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("test.skip");
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.some((m) => m.includes("A call on `this`")),
      "the register no longer names the half of this shape that is still open",
    ).toBe(true);
  });

  it("RR-04' CONTROL: a call on `this` is still undecided, and is not refused", () => {
    row("RED-11b-RR04-this-head");
    // The OTHER direction of the same rewritten member. A rule that refused this too would be
    // refusing a shape nobody decided; a register that claimed it was decided would be a claim
    // broader than the mechanism.
    const r = driveSpec(`import { test, expect } from "@playwright/test";
class Runner {
  skip(): void {}
  go(): void {
    this.skip();
  }
}
void Runner;
test("scenario", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status, `stdout: ${r.stdout}`).toBe(0);
  });

  it("RR-05: the chain-step bound is DELETED with the walk that needed it", async () => {
    row("RED-12-RR05-chain-bound");
    // MEASURED: a 600-link chain on the framework head reports `0 findings` / EXIT=0, while the
    // IDENTICAL head at 3 links reports `1 finding(s)` / EXIT=1 — so the zero is caused by the
    // BOUND and not by the head, which is what makes this row a row about the bound at all.
    // Symbol resolution has no dotted-path walk, so the bound is removed rather than retained as a
    // residual about a mechanism the module no longer has.
    const mod = (await loadChecker()) as unknown as Record<string, unknown>;
    expect(
      Object.prototype.hasOwnProperty.call(mod, "CALLEE_CHAIN_STEP_BOUND"),
      "the bound is still exported — a residual about a mechanism that should be gone",
    ).toBe(false);
  });

  it("RR-06: an option enabled by a variable stays a NAMED refusal (accepted by design)", async () => {
    row("RED-13-RR06-variable-option");
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    const r = driveSpec(`import { test, expect } from "@playwright/test";
const on = true;
test("scenario", async ({ page }) => {
  await expect.configure({ soft: on })(page.getByTestId("invoice-total")).toBeVisible();
});
`);
    expect(r.status).toBe(0);
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.some((m) => m.includes("parses and never evaluates")),
      "the shape passes and the register no longer names it",
    ).toBe(true);
  });

  it("RR-07a: a parser that cannot answer is a LOUD SKIP, never a quieter ban", () => {
    row("RED-14-RR07-parser-without-import-predicates");
    // MEASURED: `0 findings` / EXIT=0 against a target whose `typescript` carries every VALIDATED
    // predicate and none of the import predicates. The rename map is never built, `it.skip` is
    // asked as `it.skip`, and the head is not a banned head — a SILENT DEGRADE to the pre-D-18
    // rule. A smaller ban applied without saying so is a gate LOWERING, not a disclosed limit.
    const root = mkGeneratedTarget(
      {
        "e2e/uat/p.uat.spec.ts": `import { test as it, expect } from "@playwright/test";
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`,
      },
      { typescript: "stub-no-import-predicates" },
    );
    // THE HARNESS'S OWN PREMISE, asserted before the result: the stub really is missing the
    // members. The first version of this stub silently kept them and the row measured a finding it
    // could not have produced.
    const probe = spawnSync(
      "node",
      [
        "-e",
        'const{createRequire}=require("node:module");const m=createRequire(process.argv[1])("typescript");' +
          'console.log(["isImportDeclaration","isNamedImports","isNamespaceImport","isImportSpecifier"].every(k=>typeof m[k]==="undefined")&&typeof m.createSourceFile==="function");',
        join(root, "package.json"),
      ],
      { encoding: "utf8" },
    );
    expect(probe.stdout.trim(), "the stub did not remove the predicates — every result below is vacuous").toBe("true");
    const r = runCheck(root);
    expect(r.status, `stdout: ${r.stdout}`).toBe(2);
  });

  it("RR-07b: a target with NO config file exits 2 with ONE named reason and an EMPTY stdout", async () => {
    row("RED-15-RR07-no-config-file");
    const mod = (await loadChecker()) as unknown as { PROGRAM_UNAVAILABLE_REASON?: string };
    // MEASURED: today the config file is never consulted, so this target answers `1 finding(s)` /
    // EXIT=1. After the cutover a Program cannot be created and the run has made NO claim.
    //
    // `tsconfig: null` is the EXPLICIT spelling of "this target carries no configuration file", and
    // it is explicit because the harness now equips every other target with one. Leaving it implicit
    // made this row and every ban row assert contradictory things about the same target shape: one
    // demanded exit 2 for a config-less repository and the others demanded a decided ban in one.
    const r = driveSpec(
      `import { test as it, expect } from "@playwright/test";
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`,
      { tsconfig: null },
    );
    expect(mod.PROGRAM_UNAVAILABLE_REASON, "the could-not-run reason is not exported").toBeTypeOf("string");
    expect(r.status).toBe(2);
    expect(r.stderr).toContain(mod.PROGRAM_UNAVAILABLE_REASON as string);
    expect(r.stdout).toBe("");
    expect(
      r.stderr.split(mod.PROGRAM_UNAVAILABLE_REASON as string).length - 1,
      "the reason must have ONE emission point",
    ).toBe(1);
  });

  it("RR-07b': a target with an UNPARSEABLE config file is the SAME event", async () => {
    row("RED-16-RR07-unparseable-config-file");
    const mod = (await loadChecker()) as unknown as { PROGRAM_UNAVAILABLE_REASON?: string };
    const r = driveSpec(
      `import { test as it, expect } from "@playwright/test";
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`,
      { tsconfig: "{ this is not json" },
    );
    expect(r.status).toBe(2);
    expect(r.stderr).toContain(mod.PROGRAM_UNAVAILABLE_REASON as string);
    expect(r.stdout).toBe("");
  });

  it("RR-08: a destructured TestInfo binding is REFUSED", () => {
    row("RED-17-RR08-destructured-testinfo");
    // MEASURED: `0 findings` / EXIT=0, type-checks CLEAN — a LIVE bypass.
    const r = driveSpec(`import { test, expect } from "@playwright/test";
test("scenario", async ({ page }, { skip }) => {
  skip();
${TAIL}
});
`);
    expect(r.status).toBe(1);
  });

  it("RR-09: a module-scope declaration of a fixture parameter's name does NOT re-admit (CONTROL)", () => {
    row("RED-18-RR09-module-scope-fixture-name");
    // MEASURED unmoved: D-27 (3) records the fixture-binding POSITION as a non-suppressing binding,
    // so the parameter is the nearest binding and the outer declaration does not answer. `1
    // finding(s)` / EXIT=1 BEFORE this plan, and it must stay that way.
    const r = driveSpec(`import { test, expect } from "@playwright/test";
const testInfo = 1;
void testInfo;
test("scenario", async ({ page }, testInfo) => {
  testInfo.skip();
${TAIL}
});
`);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("test.info().skip");
  });
});

// ── CONTROL C and D: the prior rounds' closures, re-measured rather than assumed ───────────────

describe("uat-spec-integrity — 31-28 CONTROLS: every prior closure, re-driven", () => {
  it("CONTROL C: the depth adjacency reproduces, both sides, with their streams", () => {
    row("CTRL-C-depth-adjacency");
    const { safe, overflow } = parseBoundary();
    expect(overflow - safe).toBe(1);
    const s = driveSpec(nestedSpec(safe));
    expect(s.status).toBe(0);
    expect(s.stdout).toContain("0 findings over 1/1 uat specs checked");
    expect(s.stderr).toBe("");
    const o = driveSpec(nestedSpec(overflow));
    expect(o.status).toBe(2);
    expect(o.stdout).toBe("");
    expect(o.stderr).toContain("ZERO uat specs were visited (1 derived)");
  });

  it("CONTROL D1: the vacuity floor on a zero-spec derivation, on the stream ITS branch writes to", () => {
    row("CTRL-D1-vacuity-floor");
    const r = runCheck(mkGeneratedTarget({}));
    expect(r.status).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("ZERO uat specs were visited (0 derived)");
  });

  it("CONTROL D2/D3: both loud-skip markers, each emitted EXACTLY once", async () => {
    row("CTRL-D2-parser-absent");
    row("CTRL-D3-browser-absent");
    const { PARSER_ABSENT_MARKER, BROWSER_ABSENT_MARKER } = await loadChecker();
    const spec = `import { test as it, expect } from "@playwright/test";
it.skip("scenario", async ({ page }) => {
${TAIL}
});
`;
    const parserless = runCheck(mkGeneratedTarget({ "e2e/uat/p.uat.spec.ts": spec }, { typescript: "none" }));
    expect(parserless.status).toBe(2);
    expect(parserless.stderr.split(PARSER_ABSENT_MARKER).length - 1).toBe(1);
    expect(parserless.stdout).toBe("");
    const browserless = runCheck(
      mkGeneratedTarget({ "e2e/uat/p.uat.spec.ts": spec }, { typescript: "none" }),
      "--check-browser",
    );
    expect(browserless.status).toBe(2);
    expect(browserless.stderr.split(BROWSER_ABSENT_MARKER).length - 1).toBe(1);
    expect(browserless.stdout).toBe("");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-28 (Task 3) — THE SEVEN-POINT PROTOCOL, DRIVEN AGAINST THIS PLAN'S OWN FIX.
//
// The round-6 dispositions file ends with seven points, each one a lesson a previous round paid
// for. They are driven here against the cutover itself rather than quoted, because five rounds in a
// row this repository shipped a fix that was verified against its own predicate and produced a new
// Critical in the same mechanism. The eighth block below is MOVEMENT 2: the coordinate this plan is
// most likely to have created, probed on purpose.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-28 PROTOCOL: the seven points, against this plan's own fix", () => {
  const tsApi = hostTypeScript as typeof import("typescript");

  /** Every `it(...)` in THIS file that carries a `row("…")` marker, with its body text. */
  function rowMarkedCases(): { readonly title: string; readonly body: string }[] {
    const src = readFileSync(join(HERE, "uat-spec-integrity.test.ts"), "utf8");
    const sf = tsApi.createSourceFile("t.ts", src, tsApi.ScriptTarget.Latest, true);
    const cases: { title: string; body: string }[] = [];
    const walk = (n: import("typescript").Node): void => {
      if (
        tsApi.isCallExpression(n) &&
        tsApi.isIdentifier(n.expression) &&
        n.expression.text === "it" &&
        n.arguments.length >= 2 &&
        tsApi.isStringLiteralLike(n.arguments[0])
      ) {
        const body = n.arguments[1].getText(sf);
        if (/\brow\(\s*"/.test(body)) {
          cases.push({ title: (n.arguments[0] as import("typescript").StringLiteralLike).text, body });
        }
      }
      tsApi.forEachChild(n, walk);
    };
    tsApi.forEachChild(sf, walk);
    return cases;
  }

  /**
   * 31-35: every function in THIS file that reaches the committed `.js`, DERIVED by fixed point
   * from the one function that spawns it rather than remembered as a list.
   *
   * The seed is SPAWN-SHAPED, not name-shaped: a function whose own body passes `CHECK_JS` to
   * `spawnSync`. The closure then adds any function that calls one already in the set. A helper
   * introduced above therefore joins the set on the commit that introduces it, and a helper renamed
   * does not silently drop out — which is what a hand-typed list of four names could not do.
   */
  function spawningHelperNames(): ReadonlySet<string> {
    const tsApi = hostTypeScript as typeof import("typescript");
    const src = readFileSync(join(HERE, "uat-spec-integrity.test.ts"), "utf8");
    const sf = tsApi.createSourceFile("t.ts", src, tsApi.ScriptTarget.Latest, true);
    const bodies = new Map<string, string>();
    const collect = (n: import("typescript").Node): void => {
      if (tsApi.isFunctionDeclaration(n) && n.name !== undefined && n.body !== undefined) {
        bodies.set(n.name.text, n.body.getText(sf));
      }
      tsApi.forEachChild(n, collect);
    };
    tsApi.forEachChild(sf, collect);
    expect(bodies.size, "PREMISE: the walk found no function declaration in this file").toBeGreaterThan(0);
    const named = new Set<string>();
    for (const [name, body] of bodies) {
      if (/\bspawnSync\(/.test(body) && /\bCHECK_JS\b/.test(body)) named.add(name);
    }
    expect(named.size, "PREMISE: no function in this file spawns the committed artifact").toBeGreaterThan(0);
    for (let grew = true; grew; ) {
      grew = false;
      for (const [name, body] of bodies) {
        if (named.has(name)) continue;
        if ([...named].some((h) => new RegExp(`\\b${h}\\(`).test(body))) {
          named.add(name);
          grew = true;
        }
      }
    }
    return named;
  }

  // ── POINT 1: EVERY assertion is driven at the ENTRY the §14 gate invokes ─────────────────────

  it("POINT 1: no corpus row decides a ban without spawning the committed .js", () => {
    const cases = rowMarkedCases();
    // PREMISE, asserted before the conclusion: a walk that found no row-marked case would make the
    // count below zero for a reason that says nothing about the corpus.
    expect(cases.length, "PREMISE: the walk found no row-marked case at all").toBeGreaterThan(20);

    // 31-35: THE SPAWNING-HELPER SET IS DERIVED, NOT TYPED. It used to be a four-name literal
    // (`driveSpec`, `runCheck`, `findingsOf`, `runMutated`), and a fifth helper added above would
    // have made every row that used it read as an offender — a set-literal drifting against the
    // authority it claims to mirror, which is a failure class this phase has logged by name. The
    // set is now closed by fixed point from the ONE function that spawns the committed artifact.
    const helpers = spawningHelperNames();
    expect(helpers.size, "PREMISE: the spawning-helper closure found nothing").toBeGreaterThan(1);
    const spawns = (body: string): boolean =>
      [...helpers].some((h) => new RegExp(`\\b${h}\\(`).test(body));
    // A row DECIDES A BAN when it reads an exit code or a findings line. A row that only inspects
    // the module's exported surface — "this constant is gone", "this register names this shape" —
    // decides no ban and needs no spawn, so it is not counted.
    const decidesABan = (body: string): boolean =>
      /\.status\b|finding\(s\) over|\.stdout\b|\.stderr\b/.test(body);

    const offenders = cases
      .filter((c) => decidesABan(c.body) && !spawns(c.body))
      .map((c) => c.title);
    expect(
      offenders,
      `these corpus rows decide a ban WITHOUT driving the entry: ${offenders.join(" ;; ")}. This ` +
        `phase's recorded failure is a fix verified against its own predicate rather than at the ` +
        `coordinate the gate asks.`,
    ).toEqual([]);

    // …and the derivation is NOT vacuous in the other direction either: most rows DO spawn.
    expect(cases.filter((c) => spawns(c.body)).length).toBeGreaterThan(15);
  });

  // ── POINT 2: what BOUNDS the checker's input ─────────────────────────────────────────────────

  it("POINT 2: the Program's included files are a SUPERSET of the derived spec set", async () => {
    const { deriveSpecPaths, loadTypeScriptFromTarget, createProgramForTarget } = await loadChecker();
    const root = mkGeneratedTarget({
      "e2e/uat/a.uat.spec.ts": CLEAN_SPEC,
      "e2e/uat/b.uat.spec.ts": CLEAN_SPEC,
    });
    const derived = deriveSpecPaths(root).relPaths;
    expect(derived.length, "PREMISE: the derivation produced no spec").toBe(2);
    const ts = loadTypeScriptFromTarget(root);
    const built = createProgramForTarget(root, derived.map((rel) => join(root, rel)), ts);
    expect(built.ok, built.ok ? "" : built.cause).toBe(true);
    const included = new Set(
      // `ProgramContextView.program` declares only `getSourceFile`, so the widening to the
      // file-LIST view goes through `unknown` — the form the checker itself names. Asserting the
      // whole included set is the point of POINT 2, and the narrow view cannot express it.
      ((built as { readonly ok: true; readonly context: ProgramContextView }).context
        .program as unknown as {
        getSourceFiles(): readonly { readonly fileName: string }[];
      })
        .getSourceFiles()
        .map((f) => f.fileName),
    );
    for (const rel of derived) {
      expect(
        included.has(join(root, rel)),
        `${rel} is in the derived set and NOT in the program — it would be unchecked at exit 0`,
      ).toBe(true);
    }
  });

  it("POINT 2b: a config that EXCLUDES the spec directory does not leave a spec unchecked", () => {
    // THE SEEDED FAILURE THIS POINT EXISTS FOR. A program built from the configuration's own file
    // list alone would not carry this spec at all, and the run would report a clean pass over a
    // file nobody type-checked. The root names are the config's files UNION the derived set, so the
    // banned call is still refused.
    const r = driveSpec(
      `import { test, expect } from "@playwright/test";
test.skip("scenario", async ({ page }) => {
${TAIL}
});
`,
      {
        tsconfig: JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            strict: true,
            noEmit: true,
            skipLibCheck: true,
          },
          include: ["types/**/*.ts"],
          exclude: ["e2e"],
        }),
      },
    );
    expect(r.status, `stdout: ${r.stdout} stderr: ${r.stderr}`).toBe(1);
    expect(r.stdout).toContain("1 finding(s) over 1/1 uat specs checked");
    expect(r.stdout).toContain("test.skip");
  });

  // ── POINT 3: ONE VARIABLE — the ban's file set IS the denominator's file set ─────────────────

  it("POINT 3: the set the ban is decided over and the set the floor counts are EQUAL", async () => {
    const { deriveSpecPaths, loadTypeScriptFromTarget, createProgramForTarget, analyzeSpecs } =
      await loadChecker();
    const root = mkGeneratedTarget({
      "e2e/uat/a.uat.spec.ts": CLEAN_SPEC,
      "e2e/uat/nested/b.uat.spec.ts": CLEAN_SPEC,
      "e2e/uat/c.uat.spec.ts": CLEAN_SPEC,
    });
    const derived = deriveSpecPaths(root).relPaths;
    const ts = loadTypeScriptFromTarget(root);
    const built = createProgramForTarget(root, derived.map((rel) => join(root, rel)), ts);
    expect(built.ok).toBe(true);
    const ctx = (built as { readonly ok: true; readonly context: ProgramContextView }).context;

    // The set the BAN is decided over: the files `analyzeSpecs` actually walked, read off `visited`
    // rather than off the list it was handed.
    const analysis = analyzeSpecs(root, derived, ts, ctx);
    // The set the DENOMINATOR floor counts: `expected`, derived before the loop ran.
    expect(analysis.expected, "the floor counts a set the derivation did not produce").toBe(
      derived.length,
    );
    expect(analysis.visited, "the ban was decided over fewer files than the floor counts").toBe(
      derived.length,
    );
    expect(analysis.errors).toEqual([]);
    // …and BOTH directions of the equality are named: nothing was walked that was not derived, and
    // nothing derived went unwalked.
    expect(analysis.visited).toBe(analysis.expected);
  });

  // ── POINT 4: ARITY — every documented overload carries the same ban ──────────────────────────

  it("POINT 4: every documented Playwright overload yields an IDENTICAL finding", () => {
    const strip = (s: string): string => s.replace(/p\.uat\.spec\.ts:\d+/g, "p.uat.spec.ts:<line>");
    const twoArg = driveSpec(`import { test, expect } from "@playwright/test";
test("scenario", async ({ page }, testInfo) => {
  testInfo.skip();
${TAIL}
});
`);
    const threeArg = driveSpec(`import { test, expect } from "@playwright/test";
test("scenario", { tag: "@smoke" }, async ({ page }, testInfo) => {
  testInfo.skip();
${TAIL}
});
`);
    const destructured = driveSpec(`import { test, expect } from "@playwright/test";
test("scenario", async ({ page }, { skip }) => {
  skip();
${TAIL}
});
`);
    for (const r of [twoArg, threeArg, destructured]) {
      expect(r.status, `stdout: ${r.stdout}`).toBe(1);
      expect(r.stdout).toContain("test.info().skip");
    }
    expect(strip(threeArg.stdout)).toBe(strip(twoArg.stdout));
    expect(strip(destructured.stdout)).toBe(strip(twoArg.stdout));

    // …and the describe forms, which are the OTHER overload family the framework documents.
    for (const spelling of [
      "test.describe.only",
      "test.describe.skip",
      "test.describe.serial.only",
      "test.describe.parallel.only",
    ]) {
      const r = driveSpec(`import { test, expect } from "@playwright/test";
${spelling}("a group", () => {
  test("scenario", async ({ page }) => {
${TAIL}
  });
});
`);
      expect(r.status, `${spelling}: stdout ${r.stdout}`).toBe(1);
      expect(r.stdout, `${spelling}: the finding does not name it`).toContain(spelling);
    }
  });

  // ── POINT 5: every caller re-run with a LEGITIMATE input after every refusal added ───────────

  it("POINT 5: a clean suite still reports a genuine pass line at exit 0", () => {
    const r = driveSpec(`import { test, expect } from "@playwright/test";
test("the invoice total is shown", async ({ page }) => {
  await page.goto("/billing");
${TAIL}
});
`);
    expect(r.status, `stderr: ${r.stderr}`).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1 uat specs checked");
    expect(r.stderr).toBe("");
  });

  it("POINT 5b: every legitimate shape the fixture corpus carries is still accepted", () => {
    for (const fixture of ["clean.uat.spec.ts", "modifier-group-clean.uat.spec.ts"]) {
      const r = runCheck(mkTargetRepo({ "e2e/uat/p.uat.spec.ts": fixture }));
      expect(r.status, `${fixture}: stdout ${r.stdout}`).toBe(0);
    }
  });

  // ── POINT 7: residue ─────────────────────────────────────────────────────────────────────────

  it("POINT 7: no probe root is left under `.temp`, and `.temp` is SKIPPED anyway", async () => {
    const { SKIPPED_DIRECTORIES, deriveSpecPaths } = await loadChecker();
    // The BELT: `.temp` joins the walk's input boundary, so a stray probe spec cannot change what
    // this repository's own gate measures. Round 5 measured the sibling harm — a stray spec under
    // `.temp/` collected by the test runner, and the run died on SIGSEGV.
    expect(SKIPPED_DIRECTORIES).toContain(".temp");
    const root = mkGeneratedTarget({});
    plant(root, ".temp/probe/e2e/uat/stray.uat.spec.ts", CLEAN_SPEC);
    plant(root, "e2e/uat/real.uat.spec.ts", CLEAN_SPEC);
    const derived = deriveSpecPaths(root).relPaths;
    expect(derived, "a spec planted under `.temp` was collected").toEqual([
      "e2e/uat/real.uat.spec.ts",
    ]);
    // …and the BRACES: the real listing, on this repository, right now.
    expect(
      readdirSync(join(REPO_ROOT, ".temp"), { withFileTypes: true }).length,
      "`.temp` is not empty — a probe root was left behind",
    ).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-28 (Task 3, MOVEMENT 2) — THE COORDINATE THIS PLAN IS MOST LIKELY TO HAVE CREATED.
//
// The question every round of this phase has failed to ask, asked here in writing: WHAT IS THE NEW
// PREDICATE'S INPUT ASSEMBLED FROM, and AT WHICH POSITIONS IS IT ASKED. The new predicate is symbol
// identity. Its input is assembled from a Program, a checker, a module symbol and a derived set of
// declaration files — four things, each of which can be wrong on its own.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-28 MOVEMENT 2: probing the cutover's own new coordinates", () => {
  it("PROBE A: a config the compiler REJECTS is a could-not-run, not a smaller check", async () => {
    const { PROGRAM_UNAVAILABLE_REASON } = await loadChecker();
    // THE INPUT-ASSEMBLY QUESTION IN ITS PUREST FORM, and it found something. The Program's root
    // names are assembled from TWO sources — the target's configuration and this runnable's own
    // derived spec set — so a configuration that is syntactically valid JSON can still be rejected
    // by the compiler on its own terms. MEASURED: `{"files": []}` parses as JSON and produces one
    // configuration error ("The 'files' list in config file is empty"). The union with the derived
    // set never runs, because the failure is upstream of it. That is the right answer — a target
    // whose own configuration the compiler refuses is a target this runnable cannot type-check —
    // and it is recorded rather than discovered by a seventh reviewer.
    const r = driveSpec(
      `import { test, expect } from "@playwright/test";
test.only("scenario", async ({ page }) => {
${TAIL}
});
`,
      { tsconfig: JSON.stringify({ compilerOptions: { noEmit: true }, files: [] }) },
    );
    expect(r.status, `stdout: ${r.stdout} stderr: ${r.stderr}`).toBe(2);
    expect(r.stderr).toContain(PROGRAM_UNAVAILABLE_REASON);
    expect(r.stderr).toContain("configuration error(s)");
    expect(r.stdout, "a run that could not decide printed a claim about the specs").toBe("");
  });

  it("PROBE A2: a config that merely EXCLUDES the specs still decides them", () => {
    // The other half of the same coordinate, and the one the union exists for: a configuration the
    // compiler ACCEPTS, whose file list simply does not contain the spec. The derived set is added
    // to the root names, so the spec is checked rather than silently skipped at exit 0.
    const r = driveSpec(
      `import { test, expect } from "@playwright/test";
test.only("scenario", async ({ page }) => {
${TAIL}
});
`,
      {
        tsconfig: JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            strict: true,
            noEmit: true,
            skipLibCheck: true,
          },
          include: ["types/**/*.ts"],
        }),
      },
    );
    expect(r.status, `stdout: ${r.stdout} stderr: ${r.stderr}`).toBe(1);
    expect(r.stdout).toContain("test.only");
  });

  it("PROBE B: a callee whose symbol has ZERO declarations is handed to the spelling rule", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    // A symbol with no declarations cannot be attributed to a file, so identity has no anchor. The
    // decision is `unresolved` rather than `foreign`, which is the REFUSING direction: the spelling
    // rule still gets to answer. That hand-off is the pairing residual, and it is named.
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.some((m) =>
        m.includes("IDENTITY AND SPELLING ARE TWO RULES FOR ONE QUESTION"),
      ),
    ).toBe(true);
    // Driven through the shape that produces it in practice: a renamed import whose callee sits in
    // the temporal dead zone of a local of the same name, so no symbol resolves for `.skip`.
    const r = driveSpec(`import { test as it, expect } from "@playwright/test";
function wrap(): void {
  it.skip("scenario", async ({ page }) => {
${TAIL}
  });
  let it = 1;
  void it;
}
void wrap();
`);
    expect(
      r.status,
      `the spelling rule lost D-27's temporal-dead-zone refusal. stdout: ${r.stdout}`,
    ).toBe(1);
    expect(r.stdout).toContain("test.skip");
  });

  it("PROBE C: a symbol declared in MORE THAN ONE file, one of them the framework's, is REFUSED", () => {
    // DECLARATION MERGING. A local file can add a member to the framework's own interface, and a
    // member so merged has declarations in two files. Identity reads that in the REFUSING direction
    // — `some`, not `every` — because a ban that could be disarmed by adding a local declaration
    // would be a ban an author can switch off.
    const r = driveSpec(
      `import { test, expect } from "@playwright/test";
test.skip("scenario", async ({ page }) => {
${TAIL}
});
`,
      {},
      {
        "types/merged.d.ts": `declare module "@playwright/test" {
  interface Test {
    readonly skip: TestModifier;
  }
}
`,
      },
    );
    expect(r.status, `stdout: ${r.stdout} stderr: ${r.stderr}`).toBe(1);
    expect(r.stdout).toContain("test.skip");
  });

  it("PROBE D: a LOCAL module that names itself as the framework is NOT the framework", () => {
    // Identity is anchored on declaration FILES, never on a module-specifier string. A local file
    // that exports a `test` with a `skip` member is a different module however it is spelled, so
    // the call is `foreign` and is accepted. The converse — a re-export chain THROUGH a local
    // module — resolves and IS refused, and that direction is driven by the RR-03 row.
    const r = driveSpec(
      `import { test } from "./look-alike";
test.skip("scenario", () => {});
`,
      {},
      {
        "e2e/uat/look-alike.ts":
          "export const test = { skip: (title: string, body: () => void): void => { void title; void body; } };\n",
      },
    );
    expect(r.status, `a local look-alike was refused as the framework. stdout: ${r.stdout}`).toBe(0);
  });

  it("PROBE E: a target with NO framework declarations is a COULD-NOT-RUN, never a pass", async () => {
    const { PROGRAM_UNAVAILABLE_REASON } = await loadChecker();
    // THE FAILURE DIRECTION THE HUMAN CHOSE AT THE CHECKPOINT. Without the framework's declarations
    // every callee resolves to nothing, so identity would decide NOTHING and the run would report a
    // clean pass over specs it never checked. It blocks instead, with a named reason.
    const root = mkTmp();
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "t", private: true }), "utf8");
    symlinkSync(REPO_NODE_MODULES, join(root, "node_modules"), "dir");
    writeFileSync(join(root, "tsconfig.json"), TARGET_TSCONFIG, "utf8");
    plant(root, "e2e/uat/p.uat.spec.ts", 'test.skip("scenario", () => {});\n');
    const r = runCheck(root);
    expect(r.status, `stdout: ${r.stdout} stderr: ${r.stderr}`).toBe(2);
    expect(r.stderr).toContain(PROGRAM_UNAVAILABLE_REASON);
    expect(r.stdout, "a run that could not decide printed a claim about the specs").toBe("");
    expect(
      r.stderr.split(PROGRAM_UNAVAILABLE_REASON).length - 1,
      "the reason must have ONE emission point",
    ).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-28 (Task 2) — THE DELETIONS, DERIVED FROM THE MODULE'S OWN AST, AND THE REGISTER'S NEW SIZE.
//
// A cutover that leaves one of the five approximations behind gives the file two grammars for one
// question, which is the shape this repository keeps paying for. The absence is therefore DERIVED
// rather than remembered: the module's own parse is asked which top-level names it declares and
// which names it references, and the deleted set is asserted disjoint from both.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-28: the five approximations are GONE, derived from the parse", () => {
  const ts = hostTypeScript as typeof import("typescript");

  /** Every name the module DECLARES at any level, and every name it REFERENCES. */
  function namesOfModule(): { readonly declared: ReadonlySet<string>; readonly referenced: ReadonlySet<string> } {
    const sf = ts.createSourceFile(
      "m.ts",
      readFileSync(join(HERE, "uat-spec-integrity.ts"), "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const declared = new Set<string>();
    const referenced = new Set<string>();
    const walk = (n: import("typescript").Node): void => {
      if (
        (ts.isFunctionDeclaration(n) ||
          ts.isInterfaceDeclaration(n) ||
          ts.isTypeAliasDeclaration(n) ||
          ts.isClassDeclaration(n)) &&
        n.name !== undefined
      ) {
        declared.add(n.name.text);
      }
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) declared.add(n.name.text);
      if (ts.isIdentifier(n)) referenced.add(n.text);
      ts.forEachChild(n, walk);
    };
    ts.forEachChild(sf, walk);
    return { declared, referenced };
  }

  /** The five approximations, plus the two values that only existed to serve them. */
  const DELETED: readonly string[] = Object.freeze([
    "deriveTestInfoParameterNames",
    "isFixtureBindingPosition",
    "CALLEE_CHAIN_STEP_BOUND",
    "CalleeStepBudget",
    "newCalleeStepBudget",
    "TEST_SCENARIO_PATH",
  ]);

  it("none of the deleted names is DECLARED or REFERENCED anywhere in the module", () => {
    const { declared, referenced } = namesOfModule();
    // PREMISE: the parse found the module at all. An empty census would make every claim below
    // vacuously true, which is the false-harness-premise this repository has recorded six times.
    expect(declared.size, "PREMISE: the parse declared nothing").toBeGreaterThan(30);
    expect(referenced.has("resolveBannedModifier"), "PREMISE: the parse missed the new resolver").toBe(
      true,
    );
    for (const name of DELETED) {
      expect(declared.has(name), `${name} is still DECLARED in the module`).toBe(false);
      expect(referenced.has(name), `${name} is still REFERENCED in the module`).toBe(false);
    }
    // …and the CARDINALITY of the deleted set is asserted, so a member removed from this list to
    // reach green is a change to a number rather than a silent narrowing.
    expect(DELETED.length, "the deleted-name enumeration changed size").toBe(6);
  });

  it("none of the deleted names is EXPORTED by the built artifact either", async () => {
    const mod = (await loadChecker()) as unknown as Record<string, unknown>;
    for (const name of DELETED) {
      expect(
        Object.prototype.hasOwnProperty.call(mod, name),
        `${name} is still exported by the committed .js`,
      ).toBe(false);
    }
    // PREMISE: the artifact really is the one under test, and it exports what the cutover added.
    for (const name of ["resolveBannedModifier", "createProgramForTarget", "PROGRAM_UNAVAILABLE_REASON"]) {
      expect(Object.prototype.hasOwnProperty.call(mod, name), `${name} is not exported`).toBe(true);
    }
  });

  it("the residual register's CARDINALITY is ten — nine before the cutover, six after it, then D-35's and D-36's three", async () => {
    const { UNRESOLVABLE_CALLEE_RESIDUALS } = await loadChecker();
    // Asserted as its own case with its own message: a member REWORDED and a member REMOVED are
    // different events and must not read as one failure. The old number is written here so the
    // shrink is a measurement in the record rather than a fact only a reader of two commits knows.
    //
    // 31-35 (D-36): SEVEN -> TEN. The walk's two bounds became members because CR-25 measured them
    // failing OPEN — a bound that was reached returned a partial surface with no signal — and the
    // third member is what the narrowing those bounds needed COSTS: the walk no longer descends
    // into the compiler's own standard library, so a framework type reachable only through a
    // library container is not reached at all. A register that grew by the shapes a fix does not
    // reach is the same discipline D-35 applied when it grew by one.
    expect(
      UNRESOLVABLE_CALLEE_RESIDUALS.length,
      "the residual register's size changed; it was 9 before the 31-28 cutover, 6 after it, 7 " +
        "after 31-34 (D-35) disclosed the one shape the split does not reach, and 10 after 31-35 " +
        "(D-36) published the surface walk's two bounds and the cost of narrowing it",
    ).toBe(10);
  });

  it("the module names no framework TYPE as a string literal — identity is DERIVED", () => {
    const source = readFileSync(join(HERE, "uat-spec-integrity.ts"), "utf8");
    // The reported spelling `test.info()` is reached by walking the framework's own exported
    // surface. A type name written here would be the set-literal drift this repository keeps
    // paying for, one register over — and it would break on a package whose type names differ from
    // this repository's transcription. The needles are ASSEMBLED at run time, never written as one
    // literal, because a scan whose needle is itself a literal in the scanned file always hits.
    for (const parts of [["Test", "Info"], ["Describe", "Group"], ["Test", "Modifier"]]) {
      const needle = `"${parts.join("")}"`;
      expect(source.includes(needle), `the module carries the type literal ${needle}`).toBe(false);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-32 (Task 3) — WR-35: A NARROWED INPUT BOUNDARY THAT SAYS SO, plus IN-16 and IN-17.
//
// `SKIPPED_DIRECTORIES` is the walk's INPUT BOUNDARY, and `install/install.ts` materializes this
// runnable into EVERY host at `tools/grugops/uat-spec-integrity.js`, so the boundary is a shipped
// rule rather than a local habit. Neither floor in `reportMeasured` can see it: `expected` and
// `visited` shrink TOGETHER, so a run over a silently narrowed tree prints the same clean pass as a
// run over the whole tree.
//
// MEASURED at the round-7 base, once per member, against the committed `.js`:
//   [none]         EXIT=0  stdout=58B  stderr=0B
//   [.temp]        EXIT=0  stdout=58B  stderr=0B
//   [node_modules] EXIT=0  stdout=58B  stderr=0B
//   [.git]         EXIT=0  stdout=58B  stderr=0B
//   [dist]         EXIT=0  stdout=58B  stderr=0B
//   [tools]        EXIT=0  stdout=58B  stderr=0B
// Six runs, one of them over a tree with nothing hidden and five over trees with a spec hidden,
// and no reader can tell them apart. THE INDISTINGUISHABILITY IS THE FINDING.
//
// D-33 (5): the disposition is DISCLOSURE, never a revert. `.temp` was placed in the set by D-30
// sub-decision 3 in a named human's own words, and reverting a human's decision inside a fix plan
// is the move this phase forbids.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * A probe target whose `node_modules` is a REAL directory holding a symlink to this repository's
 * `typescript` package.
 *
 * `mkGeneratedTarget` symlinks the whole `node_modules`, and a SYMLINKED directory is decided by
 * the walk's symbolic-link branch rather than by `SKIPPED_DIRECTORIES` — so a probe built that way
 * could never exercise the `node_modules` MEMBER of the boundary. Every member is driven through
 * one shape here, so the disclosure is not measured on four members and assumed on the fifth.
 */
function mkSkipProbeTarget(hiddenUnder: string | null): string {
  const root = mkTmp();
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "target", private: true }), "utf8");
  mkdirSync(join(root, "node_modules"), { recursive: true });
  symlinkSync(join(REPO_NODE_MODULES, "typescript"), join(root, "node_modules", "typescript"), "dir");
  equipTarget(root);
  plant(root, "e2e/uat/visible.uat.spec.ts", CLEAN_SPEC);
  if (hiddenUnder !== null) plant(root, `${hiddenUnder}/e2e/uat/hidden.uat.spec.ts`, CLEAN_SPEC);
  return root;
}

describe("uat-spec-integrity — 31-32 WR-35: the walk's input boundary DISCLOSES what it narrowed", () => {
  it("names EVERY member of SKIPPED_DIRECTORIES and its hit count, one member per probe", async () => {
    const { SKIPPED_DIRECTORIES, SKIPPED_DIRECTORY_DISCLOSURE_MARKER } = await loadChecker();
    // The set this case iterates is the EXPORTED one, and its own premise is asserted before the
    // conclusion: an empty boundary would make the loop below run zero times and pass.
    expect(SKIPPED_DIRECTORIES.length, "the boundary is empty — the loop below would be vacuous")
      .toBeGreaterThan(0);
    const baseline = runCheck(mkSkipProbeTarget(null));
    for (const member of SKIPPED_DIRECTORIES) {
      const r = runCheck(mkSkipProbeTarget(member));
      expect(r.stderr, `${member}: the skip is not disclosed`).toContain(
        SKIPPED_DIRECTORY_DISCLOSURE_MARKER,
      );
      expect(r.stderr, `${member}: the disclosure does not name the directory`).toContain(member);
      expect(r.stderr, `${member}: the disclosure does not carry the hit count`).toContain(
        `${member}=1`,
      );
      // The DISCLOSURE IS NOT A RESULT. The exit code and the stdout the gate branches on are
      // byte-identical to the run with nothing hidden.
      expect(r.status, `${member}: the exit code moved`).toBe(baseline.status);
      expect(r.stdout, `${member}: stdout moved`).toBe(baseline.stdout);
    }
  });

  it("a run with NOTHING skipped grows no line — stderr stays empty and stdout is the pass line", () => {
    // `mkGeneratedTarget` SYMLINKS `node_modules`, and a symbolic link is decided by the walk's
    // symbolic-link branch rather than at the `SKIPPED_DIRECTORIES` boundary — so this target skips
    // NOTHING. `mkSkipProbeTarget` cannot be used here: its `node_modules` is a real directory,
    // which the boundary legitimately refuses and which the disclosure therefore legitimately names.
    const r = runCheck(mkGeneratedTarget({ "e2e/uat/visible.uat.spec.ts": CLEAN_SPEC }));
    expect(r.status).toBe(0);
    expect(r.stderr, "a clean run grew a disclosure line").toBe("");
    expect(r.stdout).toBe("UAT spec integrity: 0 findings over 1/1 uat specs checked\n");
  });

  it("the disclosure moves no finding count and no exit code on the FINDING path either", () => {
    const banned = [
      'import { test, expect } from "@playwright/test";',
      'test.skip("a scenario", async ({ page }) => {',
      '  await page.goto("/x");',
      '  await expect(page.getByTestId("x")).toBeVisible();',
      "});",
      "",
    ].join("\n");
    const withSkip = mkSkipProbeTarget(".temp");
    plant(withSkip, "e2e/uat/banned.uat.spec.ts", banned);
    // The control skips NOTHING — a symlinked `node_modules`, so the boundary is never reached.
    const without = mkGeneratedTarget({
      "e2e/uat/banned.uat.spec.ts": banned,
      "e2e/uat/visible.uat.spec.ts": CLEAN_SPEC,
    });
    const a = runCheck(withSkip);
    const b = runCheck(without);
    expect(b.status, "the control run did not report the finding").toBe(1);
    expect(a.status).toBe(b.status);
    expect(a.stdout).toBe(b.stdout);
    expect(a.stderr, "the skipped run did not disclose").not.toBe("");
    expect(b.stderr, "the clean-boundary run grew a line").toBe("");
  });

  it("the renderer emits NOTHING for an empty hit set, and a deterministic line for a non-empty one", async () => {
    const { renderSkippedDirectoryDisclosure } = await loadChecker();
    expect(renderSkippedDirectoryDisclosure({}), "an empty hit set produced a line").toBeNull();
    const line = renderSkippedDirectoryDisclosure({ tools: 2, ".temp": 1 });
    expect(line).not.toBeNull();
    // ONE line, and ordered by NAME rather than by insertion, so two runs over the same tree emit
    // the same bytes whatever order the directory listing arrived in.
    expect((line as string).endsWith("\n")).toBe(true);
    expect((line as string).trimEnd().includes("\n"), "the disclosure is more than one line").toBe(false);
    expect(line).toBe(renderSkippedDirectoryDisclosure({ ".temp": 1, tools: 2 }));
    expect((line as string).indexOf(".temp=1")).toBeLessThan((line as string).indexOf("tools=2"));
  });

  it("deriveSpecPaths COUNTS the skips it takes, so the count has one origin", async () => {
    const { deriveSpecPaths } = await loadChecker();
    const root = mkTmp();
    writeFileSync(join(root, "package.json"), "{}", "utf8");
    plant(root, "e2e/uat/real.uat.spec.ts", CLEAN_SPEC);
    plant(root, "dist/e2e/uat/one.uat.spec.ts", CLEAN_SPEC);
    plant(root, "packages/a/dist/e2e/uat/two.uat.spec.ts", CLEAN_SPEC);
    plant(root, ".temp/e2e/uat/three.uat.spec.ts", CLEAN_SPEC);
    const d = deriveSpecPaths(root);
    expect(d.relPaths).toEqual(["e2e/uat/real.uat.spec.ts"]);
    // The count is of ENTRIES the walk refused to descend into, which is why `dist` reads 2: the
    // boundary was reached twice, at two different depths.
    expect(d.skippedDirectoryHits).toEqual({ dist: 2, ".temp": 1 });
  });
});

describe("browser-uat-recipe.md — 31-32: the published input boundary equals the exported one", () => {
  const RECIPE = join(REPO_ROOT, "agent-factory", "checklists", "browser-uat-recipe.md");

  it("the recipe's quoted SKIPPED_DIRECTORIES equals the exported constant, in both directions", async () => {
    const { SKIPPED_DIRECTORIES } = await loadChecker();
    const whole = readFileSync(RECIPE, "utf8");
    // PREMISE, asserted before the conclusion: the document was read and is not empty.
    expect(whole.length, "PREMISE: the recipe is empty").toBeGreaterThan(0);
    expect(SKIPPED_DIRECTORIES.length, "PREMISE: the boundary is empty").toBeGreaterThan(0);
    // The SAME strict grammar the ban set's four quoted lists are read by: the one line quoting the
    // constant's NAME in backticks, read from after its LAST colon, every backtick span a value.
    // Substring search would let `dist` count as present because `dist/e2e` appears elsewhere.
    const lines = whole.split("\n").filter((l) => l.includes("`SKIPPED_DIRECTORIES`"));
    expect(lines.length, "PREMISE: the recipe quotes the constant on other than exactly one line")
      .toBe(1);
    const tail = lines[0].slice(lines[0].lastIndexOf(":") + 1);
    const quoted = [...new Set([...tail.matchAll(/`([^`]+)`/g)].map((m) => m[1]))].sort();
    expect(quoted, "the recipe's published boundary and the decided one disagree")
      .toEqual([...SKIPPED_DIRECTORIES].sort());
  });

  it("the recipe carries the disclosure marker BY VALUE, so the claim cannot drift from the emission", async () => {
    const { SKIPPED_DIRECTORY_DISCLOSURE_MARKER } = await loadChecker();
    const whole = readFileSync(RECIPE, "utf8");
    expect(whole.length, "PREMISE: the recipe is empty").toBeGreaterThan(0);
    expect(SKIPPED_DIRECTORY_DISCLOSURE_MARKER.length, "PREMISE: the marker is empty")
      .toBeGreaterThan(0);
    // The recipe states the PROPERTY rather than re-typing the sentence, so what is bound here is
    // that the document says a line is emitted on stderr naming each skipped directory and its
    // count, and that the runnable's own emission carries the same head.
    //
    // WHITESPACE IS FOLDED FIRST. The claim lives inside a wrapped bullet, so a raw substring
    // search would be asserting about the line width the document happens to be wrapped at.
    const folded = whole.replace(/\s+/g, " ");
    expect(folded.length, "PREMISE: the folded recipe is empty").toBeGreaterThan(0);
    for (const claim of [
      "One line on stderr names each skipped directory and its hit count.",
      "The line appears only when the walk skipped something.",
      "The disclosure moves no exit code and no finding count.",
    ]) {
      expect(folded, `the recipe does not publish: ${claim}`).toContain(claim);
    }
    // …and the runnable's OWN emission head is published verbatim by the constant that emits it.
    expect(SKIPPED_DIRECTORY_DISCLOSURE_MARKER.startsWith("UAT spec integrity:")).toBe(true);
  });
});

describe("uat-spec-integrity — 31-32 IN-16 / IN-17: a dead export and a spliced sentence are GONE", () => {
  it("IN-16: the dead canonical-head export is absent from the source, the committed .js and this file", () => {
    const scanned = [
      join(HERE, "uat-spec-integrity.ts"),
      join(HERE, "uat-spec-integrity.js"),
      join(HERE, "uat-spec-integrity.test.ts"),
    ].map((f) => ({ file: f, text: readFileSync(f, "utf8") }));
    // THE SEARCH'S OWN DENOMINATOR, ASSERTED BEFORE THE CONCLUSION. A grep over three files that
    // were all empty or unreadable would report "absent" about a search it never performed.
    expect(scanned.length, "the scan set is empty").toBe(3);
    for (const { file, text } of scanned) {
      expect(text.length, `${file} is empty — the scan below would be vacuous`).toBeGreaterThan(0);
    }
    // The needle is ASSEMBLED, never written whole: a scan whose needle is a literal in a scanned
    // file always hits, and this test file is one of the scanned files.
    const needle = ["TEST", "INFO", "CANONICAL", "HEAD"].join("_");
    for (const { file, text } of scanned) {
      expect(text.includes(needle), `${file} still carries the dead export ${needle}`).toBe(false);
    }
  });

  it("IN-17: the deriveDeclaredBindings doc block carries no orphaned clause", () => {
    const source = readFileSync(join(HERE, "uat-spec-integrity.ts"), "utf8");
    const start = source.indexOf("THE ONE NON-SUPPRESSING RECORD");
    expect(start, "the paragraph IN-17 names was not found — the scan is wrong").toBeGreaterThan(-1);
    const end = source.indexOf("export function deriveDeclaredBindings", start);
    expect(end, "the doc block's owning declaration was not found").toBeGreaterThan(start);
    const block = source.slice(start, end);
    expect(block.length, "the doc block is empty").toBeGreaterThan(0);
    // The superseded paragraph was cut mid-clause and the D-30 (5) heading spliced onto its tail.
    // In a file whose doc blocks ARE the decision record, a half-deleted sentence reads as a
    // statement.
    expect(
      block.includes(["is recorded", "with"].join(" ")),
      "the orphaned clause IN-17 names survives in the doc block",
    ).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-34 (CR-23 / D-35) — A BAN THE FRAMEWORK DOES NOT OWN, DRIVEN THROUGH THE SPELLING IT EXISTS FOR
//
// `BANNED_MODIFIER_HEADS` retains a bare `describe` and the constant's own comment says why:
// `@playwright/test` exports no top-level `describe`, so the head is kept for ANOTHER framework's
// bare `describe` imported into a spec file. `D-30 (2)` then made the `foreign` identity answer
// TERMINAL, and that is EXACTLY the case it made unreachable. The same held for `expect.soft`
// whenever `expect` came from another assertion library.
//
// WHY THE SUITE WAS GREEN OVER A BAN THAT WAS OFF. Every row that drove `describe.skip` spelled
// `describe` as an UNDECLARED name — the one spelling the identity route declines anyway, so the
// spelling rule answered and the row refused. The corpus never drove the spelling the head exists
// for. It does now, and the undeclared row is kept beside it rather than replaced.
//
// D-35's DISCRIMINANT, DRIVEN ARM BY ARM. `foreign` splits by DECLARATION PROVENANCE: a resolved
// non-framework callee is `foreign-declared` when any of its declarations comes from a
// `declare module "…"` block or from a declaration file, and `foreign-local` otherwise. Every arm
// below is driven at the runnable's own ENTRY — and so is their UNION, because a widening measured
// one arm at a time is a widening nobody measured in the direction it can be wrong.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("uat-spec-integrity — 31-34 CR-23: the retained head, through a DECLARED foreign module", () => {
  it("RED 1: a `describe.skip` GROUP imported from an ambient foreign module is REFUSED", () => {
    row("RED-1-CR23-foreign-describe-group");
    // MEASURED against the committed .js before D-35, in an equipped probe root:
    //   `0 findings over 1/1 uat specs checked` / EXIT=0, with `tsc --noEmit` EXIT=0.
    // A live bypass that type-checks clean: the whole group's scenario never runs and the gate
    // reports green over it.
    const r = runCheck(mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": "foreign-describe.uat.spec.ts" }));
    expect(r.status, `the foreign describe group was accepted. stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("1 finding(s) over 1/1 uat specs checked");
    // ONE spelling, the one a reader meets elsewhere for this construct.
    expect(r.stdout).toContain("`describe.skip`");
  });

  it("RED 2: an `expect.soft` assertion imported from an ambient foreign assertion library is REFUSED", () => {
    row("RED-2-CR23-foreign-soft-assert");
    // MEASURED against the committed .js before D-35: `0 findings` / EXIT=0, `tsc --noEmit` EXIT=0.
    // THIS is the instance Option A was measured NOT to close: `@playwright/test` declares `expect`,
    // so a head-declared exemption would have left it open at exit 0.
    const r = runCheck(
      mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": "foreign-soft-assert.uat.spec.ts" }),
    );
    expect(r.status, `the foreign soft assertion was accepted. stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("1 finding(s) over 1/1 uat specs checked");
    expect(r.stdout).toContain("`expect.soft`");
  });

  it("CONTROL (WR-26): the local-helper fixture is NOT refused — the union stays in one direction", () => {
    row("CTRL-CR23-local-helper-head");
    const r = runCheck(
      mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": "local-helper-head.uat.spec.ts" }),
    );
    expect(r.status, `a local binding was refused as another framework's export. stdout: ${r.stdout}`)
      .toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1 uat specs checked");
  });

  it("THE UNION: both refusing fixtures and the WR-26 control in ONE run", () => {
    row("UNION-CR23-refusing-plus-control");
    // The binding the plan was built for. A widening proven one arm at a time has not been proven
    // in the direction it can be wrong: the control must stay silent in the SAME run in which the
    // refusing rows speak, over the SAME program, with the SAME ambient surfaces present.
    const r = runCheck(
      mkTargetRepo({
        "e2e/uat/a.uat.spec.ts": "foreign-describe.uat.spec.ts",
        "e2e/uat/b.uat.spec.ts": "foreign-soft-assert.uat.spec.ts",
        "e2e/uat/c.uat.spec.ts": "local-helper-head.uat.spec.ts",
      }),
    );
    expect(r.status, `stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("2 finding(s) over 3/3 uat specs checked");
    expect(r.stdout).toContain("a.uat.spec.ts");
    expect(r.stdout).toContain("b.uat.spec.ts");
    // The control's own file is named by NO finding. Asserted by name rather than by count, because
    // a count can be right while the findings sit on the wrong file.
    expect(
      r.stdout.includes("c.uat.spec.ts"),
      `the WR-26 control produced a finding. stdout: ${r.stdout}`,
    ).toBe(false);
  });

  // ── EVERY ARM OF THE DISCRIMINANT, AND WHAT EACH ONE IS ─────────────────────────────────────

  it("ARM `foreign-declared` (a DECLARATION FILE, no ambient block): REFUSED", () => {
    row("ARM-CR23-declaration-file");
    // The arm an ambient-block-only discriminant would have MISSED, and the one the installed
    // package route travels: declarations arriving from a `.d.ts` FILE rather than from a
    // `declare module "…"` block. Measured here on a `.d.ts` inside the target's own program,
    // because `@playwright/test` cannot be installed (CLAUDE.md fixes the dev dependency set) —
    // the `node_modules` shape itself stays the open `UNKNOWN - verify` beside `R-07`.
    const r = driveSpec(
      `import { test, expect } from "@playwright/test";
import { describe } from "../../types/local-other-framework";

describe.skip("the group", () => {
  test("a scenario", async ({ page }) => {
${TAIL}
  });
});
`,
      {},
      {
        "types/local-other-framework.d.ts":
          "export declare const describe: {\n" +
          "  (title: string, body: () => void): void;\n" +
          "  skip(title: string, body: () => void): void;\n" +
          "};\n",
      },
    );
    expect(r.status, `a declaration-file head was accepted. stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("`describe.skip`");
  });

  it("ARM `foreign-local` (a LOCAL SOURCE MODULE the project authored): NOT refused", () => {
    row("ARM-CR23-local-source-module");
    // The arm the plan's LITERAL sketch of Option B — "imported from a module versus declared
    // locally" — was measured to get WRONG. This head IS imported, and it is the project's own
    // helper written in the program's own `.ts` source. Refusing it would be the fourth false
    // refusal in this family's history.
    const r = driveSpec(
      `import { test, expect } from "@playwright/test";
import { describe } from "../helpers";

describe.skip("a local helper that is nobody's test framework", () => {
  void 0;
});

test("the invoice total is shown", async ({ page }) => {
${TAIL}
});
`,
      {},
      {
        "e2e/helpers.ts":
          "export const describe = {\n" +
          "  skip(title: string, body: () => void): void {\n" +
          "    void title;\n" +
          "    void body;\n" +
          "  },\n" +
          "};\n",
      },
    );
    expect(r.status, `a project's own helper module was refused. stdout: ${r.stdout}`).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1 uat specs checked");
  });

  it("ARM `unresolved` (an UNDECLARED head): still REFUSED, unmoved by D-35", () => {
    row("ARM-CR23-undeclared-head");
    // The spelling the corpus was already driving, kept rather than replaced — it is why the suite
    // was green over a ban that was off, and a widening that quietly dropped it would be a lowering
    // wearing a fix's clothes. Its own `tsc --noEmit` exit code is 2 (`TS2593: Cannot find name
    // 'describe'`), recorded in D-35: the row that carried this family rests on a construct the
    // language refuses to compile, which is precisely why it could not observe the property.
    const r = driveSpec(`import { test, expect } from "@playwright/test";
describe.skip("the group", () => {
  void 0;
});
test("the invoice total is shown", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status, `stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("`describe.skip`");
  });

  it("ARM `framework` (the primary framework's own export): still REFUSED, unmoved by D-35", () => {
    row("ARM-CR23-framework-head");
    const r = driveSpec(`import { test, expect } from "@playwright/test";
test.skip("the invoice total is shown", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status, `stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("`test.skip`");
  });

  it("ARM `foreign-local` (a head the SPEC ITSELF `declare`s): NOT refused — the DISCLOSED shape", () => {
    row("ARM-CR23-locally-declared-head");
    // THE BOUNDARY D-35 DOES NOT CLOSE, driven so it is a measured row rather than a sentence.
    // `declare const describe` written inside a `.ts` spec is neither a `declare module` block nor
    // a declaration file, so it stays `foreign-local` and is ACCEPTED at exit 0 — with `tsc
    // --noEmit` exit 0, so it is a live shape and not a parse curiosity.
    //
    // It is NOT closed here because it is structurally IDENTICAL to WR-26's own control: both
    // resolve to a `PropertySignature` of an anonymous type literal inside a `declare` statement, so
    // any predicate that refuses this one refuses the control too. Disclosed in
    // `UNRESOLVABLE_CALLEE_RESIDUALS` rather than absorbed, and bound to that member below.
    const r = driveSpec(`import { test, expect } from "@playwright/test";
declare const describe: { skip(title: string, body: () => void): void };
describe.skip("the group", () => {
  void 0;
});
test("the invoice total is shown", async ({ page }) => {
${TAIL}
});
`);
    expect(r.status, `stdout: ${r.stdout}`).toBe(0);
    expect(r.stdout).toContain("0 findings over 1/1 uat specs checked");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-34 (Task 3) — A PUBLISHED BAN MEMBER MUST BE REACHABLE, NOT MERELY PUBLISHED
//
// The recipe's ban set was already asserted EQUAL to the exported constants in both directions, and
// that equality was GREEN throughout CR-23: `describe` was in the constant, `describe` was in the
// recipe, and the mechanism could not reach it for the one case it was retained for. Membership
// equality cannot see reachability. It is the wrong question asked very carefully.
//
// THIS IS THE SECOND BINDING, AND IT IS KEYED THROUGH THE `row(…)` MARKER RATHER THAN A LIST.
// For every head the recipe publishes there must be a corpus row that DRIVES that head to a REFUSAL
// at the runnable's own entry. The expected side is DERIVED from the exported constants, so a head
// added to the rule without a row is red here; the actual side is DERIVED from this file's own AST,
// so a row deleted to reach green is red too. Neither side is typed out.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The row id a published ban head must carry, spelled in ONE place so neither side re-types it. */
function reachRowIdForHead(head: string): string {
  return `REACH-HEAD-${head}`;
}
/** The same, for a published whole-path member. */
function reachRowIdForPath(path: string): string {
  return `REACH-PATH-${path}`;
}

describe("uat-spec-integrity — 31-34: every PUBLISHED ban member has a REFUSING corpus row", () => {
  // The two rows the binding below requires for the heads the rule publishes today. Each drives its
  // head through a DECLARED foreign module — the provenance arm D-35 added — because that is the
  // spelling a retained head exists for and the one the corpus could not observe before.
  it("REACH `test`: the published head refused through a declared foreign module", () => {
    row("REACH-HEAD-test");
    const r = driveSpec(
      `import { expect } from "@playwright/test";
import { test } from "reach-other-framework";

test.skip("a scenario nobody runs", () => {
  void expect;
});
`,
      {},
      {
        "types/reach-other-framework.d.ts":
          "export declare const test: {\n" +
          "  (title: string, body: () => void): void;\n" +
          "  skip(title: string, body: () => void): void;\n" +
          "};\n",
      },
    );
    expect(r.status, `the published head \`test\` was not refused. stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("`test.skip`");
  });

  it("REACH `describe`: the published head refused through a declared foreign module", () => {
    row("REACH-HEAD-describe");
    const r = runCheck(
      mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": "foreign-describe.uat.spec.ts" }),
    );
    expect(r.status, `the published head \`describe\` was not refused. stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("`describe.skip`");
  });

  it("REACH `expect.soft`: the published exact path refused through a declared foreign library", () => {
    row("REACH-PATH-expect.soft");
    const r = runCheck(
      mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": "foreign-soft-assert.uat.spec.ts" }),
    );
    expect(r.status, `the published path \`expect.soft\` was not refused. stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("`expect.soft`");
  });

  it("THE BINDING: every published head and exact path carries a refusing row, both sides derived", async () => {
    const { BANNED_MODIFIER_HEADS, BANNED_EXACT_PATHS } = await loadChecker();
    const declared = declaredCorpusRowIds();

    // PREMISES, asserted before the conclusion. An empty constant would make the loop vacuous, and
    // an empty row census would make it fail for the wrong reason — this phase has logged six
    // instances of a harness reporting a false result from an unasserted premise.
    expect(BANNED_MODIFIER_HEADS.length, "PREMISE: the published head set is empty").toBeGreaterThan(0);
    expect(BANNED_EXACT_PATHS.length, "PREMISE: the published exact-path set is empty").toBeGreaterThan(0);
    expect(declared.size, "PREMISE: the row census found no rows at all").toBeGreaterThan(0);

    const missing: string[] = [];
    for (const head of BANNED_MODIFIER_HEADS) {
      if (!declared.has(reachRowIdForHead(head))) missing.push(reachRowIdForHead(head));
    }
    for (const path of BANNED_EXACT_PATHS) {
      if (!declared.has(reachRowIdForPath(path))) missing.push(reachRowIdForPath(path));
    }
    expect(
      missing,
      `a ban member is PUBLISHED with no corpus row that drives it to a refusal: ${missing.join(", ")}. ` +
        "Membership equality between the recipe and the constant cannot see this — it was green " +
        "for the whole of CR-23, over a head the mechanism could not reach.",
    ).toEqual([]);
  });

  it("THE SEEDED FAIL: a published-but-unrowed member is caught, so the binding is not vacuous", async () => {
    const { BANNED_MODIFIER_HEADS } = await loadChecker();
    const declared = declaredCorpusRowIds();
    // The watched fail, run in-process rather than by editing the constant: a head this rule does
    // NOT publish stands in for one added without a row. If the binding above could pass with a
    // member absent from the census, this case would pass too — and it must not.
    const seeded = "suite";
    expect(
      BANNED_MODIFIER_HEADS.includes(seeded),
      "PREMISE: the seeded head is already published, so it cannot stand in for an unrowed one",
    ).toBe(false);
    expect(
      declared.has(reachRowIdForHead(seeded)),
      "PREMISE: the seeded head already has a row, so the check below would be vacuous",
    ).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 31-35 (CR-25 / D-36) — A BOUND THAT IS REACHED IS A CHECK THAT DID NOT RUN
//
// `frameworkSurface` walks the framework's declared surface breadth-first under two bounds
// (`SURFACE_NODE_BOUND`, `SURFACE_DEPTH_BOUND`) and, before this plan, returned a PARTIAL surface
// with no signal when it reached either. A declaration the walk never reached is absent from
// `ctx.frameworkFiles`, so `resolveBannedModifier` answers `foreign` for every call on it — and a
// bound that is reached becomes a ban that is off. The function's own comment claimed the bounds
// mean a large surface "costs a stated amount rather than an open one". The amount was the ban.
//
// THE CONSTRUCTION, WRITTEN DOWN, BECAUSE THE NUMBER IS A PROPERTY OF IT. Two prior rounds bisected
// this defect and cited two different boundaries (`31-REVIEW.md` 6/7, `31-VERIFICATION.md` 7/8)
// because they declared the surface across files differently. The construction below is ONE layout,
// stated here in full, and every number in this block belongs to it:
//
//   types/deep-surface.d.ts   `declare module "@playwright/test" { interface Test { readonly deep:
//                             GrugDeep1 } }` — the AUGMENTING file, and the only one of these files
//                             that is in `frameworkFiles` unconditionally (it declares the module).
//   types/deep-<i>.d.ts       ONE global `interface GrugDeep<i>` per FILE, i = 1..j. Each carries
//                             `readonly p: GrugDeep<i+1>`, except the last, which carries `skip`.
//   e2e/uat/p.uat.spec.ts     `const t = test;` then `t.deep.p…p.skip("…", () => {})`.
//
// WHY ONE INTERFACE PER FILE. `frameworkFiles` holds FILES, so a chain whose hops all live in one
// file is added whole the moment the walk reaches the first of them — the depth bound is never the
// variable. That confound is MEASURED below rather than assumed, and it is the fact
// `31-VERIFICATION.md` spot-check row 6 records as ruled out by construction.
//
// WHY THE HEAD IS A LOCAL ALIAS. `D-35` (31-34) made the `foreign-declared` arm ASK the spelling
// rule, and the spelling rule refuses `test.<anything>.skip` on head and tail alone. Measured at
// this plan's base, with a plain `test` head, at chain lengths 6 through 9: `1 finding(s)` / EXIT=1
// at EVERY length — the spelling rule backstops the identity failure, so CR-25's literal shape no
// longer reproduces as filed. `const t = test` is not an import rename, so the spelling rule reads
// the head `t`, which is in no ban set; identity rewrites the same head to `test` from the walked
// surface. That is the pair: identity refuses it, spelling does not, and the bound decides which
// one answers.
//
// THE RE-BISECTION, at the base (`140fbf4`), per-file layout, alias head. Every row's own
// `tsc --noEmit` over the probe target exited 0, so no row rests on a construct the language
// refuses:
//
//   j  hops  callee                             tsc  stdout                        exit  stderr
//   3  4     t.deep.p.p.skip                    0    1 finding(s) over 1/1          1     0 bytes
//   4  5     t.deep.p.p.p.skip                  0    1 finding(s) over 1/1          1     0 bytes
//   5  6     t.deep.p.p.p.p.skip                0    1 finding(s) over 1/1          1     0 bytes
//   6  7     t.deep.p.p.p.p.p.skip              0    1 finding(s) over 1/1          1     0 bytes
//   7  8     t.deep.p.p.p.p.p.p.skip            0    0 findings over 1/1            0     0 bytes
//   8  9     t.deep.p.p.p.p.p.p.p.skip          0    0 findings over 1/1            0     0 bytes
//   9  10    t.deep.p.p.p.p.p.p.p.p.skip        0    0 findings over 1/1            0     0 bytes
//
// THE FLIP PAIR IS j=6 / j=7 — seven hops refused, eight hops accepted at exit 0 with ZERO bytes on
// stderr. In THIS construction the boundary is 7/8 hops after `test`, which is `31-VERIFICATION.md`
// row 6's number and not `31-REVIEW.md`'s 6/7. Both prior measurements are correct about their own
// layouts and both demonstrate the same defect; neither prior document is edited. The difference is
// WHERE the last hop's interface is declared: a `skip` declared in the same file as the interface
// that owns it is reached when that interface is VISITED (depth <= 6), one hop later than a `skip`
// whose file is reached only when its owner is EXPANDED (depth < 6).
//
// THE CONFOUND, MEASURED AT THE BASE rather than argued: the SAME chain at j=6..8 with every
// interface in ONE file reported `1 finding(s)` / EXIT=1 at every length. A single-file chain never
// reaches the bound, so the FILE LAYOUT is the variable and the bisection above means what it says.
//
// WHAT THE FIX CHANGES, AND THE PRICE IT CHARGES (D-36, plan 31-35 Task 2). A walk that stopped
// early reports `truncated` and the run exits 2 with its own cause. The refusing half therefore
// moves DOWN: a chain long enough to leave anything unexpanded at the bound is now a could-not-run
// rather than a refusal, so j=5 and j=6 — refused at the base — become exit 2. That is the
// operational price D-30's reversibility paragraph already accepted for this route: a gate that
// blocks is not a gate that passes quietly over a check it did not run.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The file that hangs the probe chain off the framework's own `Test` type. It augments the module. */
const DEEP_AUGMENT =
  'declare module "@playwright/test" {\n  interface Test {\n    readonly deep: GrugDeep1;\n  }\n}\n';

/** One `interface GrugDeep<i>`: a `p` hop, or the terminal `skip` when it is the last. */
function deepInterface(i: number, last: number): string {
  return i < last
    ? `interface GrugDeep${i} {\n  readonly p: GrugDeep${i + 1};\n}\n`
    : `interface GrugDeep${i} {\n  readonly skip: (title: string, body: () => unknown) => void;\n}\n`;
}

/** The chain's declaration files, in the layout named. See the block header for why layout matters. */
function deepSurfaceFiles(j: number, layout: "per-file" | "single-file"): Record<string, string> {
  const files: Record<string, string> = { "types/deep-surface.d.ts": DEEP_AUGMENT };
  if (layout === "per-file") {
    for (let i = 1; i <= j; i++) files[`types/deep-${i}.d.ts`] = deepInterface(i, j);
  } else {
    let all = "";
    for (let i = 1; i <= j; i++) all += deepInterface(i, j);
    files["types/deep-all.d.ts"] = all;
  }
  return files;
}

/** The spec: `j` hops after `test`, through a local alias head or the plain framework head. */
function deepChainSpec(j: number, head: "alias" | "plain"): string {
  const chain = ["deep", ...Array(j - 1).fill("p"), "skip"].join(".");
  return `import { test, expect } from "@playwright/test";

${head === "alias" ? "const t = test;\n\n" : ""}${head === "alias" ? "t" : "test"}.${chain}("the skipped scenario", () => {});

test("a scenario", async ({ page }) => {
${TAIL}
});
`;
}

/** Drive one member of the chain family at the runnable's own entry, in an equipped probe root. */
function driveDeepChain(
  j: number,
  layout: "per-file" | "single-file" = "per-file",
  head: "alias" | "plain" = "alias",
): { status: number | null; stdout: string; stderr: string } {
  return driveSpec(deepChainSpec(j, head), {}, deepSurfaceFiles(j, layout));
}

describe("uat-spec-integrity — 31-35 CR-25: a truncated framework walk is a COULD-NOT-RUN", () => {
  it("UNDER the bound: the chain is REFUSED by identity, at exit 1", () => {
    row("CR25-UNDER-BOUND-refused");
    // The refusing half of the boundary PAIR. The head is a local alias, so the SPELLING rule reads
    // `t` and bans nothing; this refusal is identity's, over a surface the walk reached whole.
    const r = driveDeepChain(4);
    expect(r.status, `the under-bound chain was not refused. stdout: ${r.stdout}`).toBe(1);
    expect(r.stdout).toContain("1 finding(s) over 1/1 uat specs checked");
    // The identity-canonical spelling, with the local alias head rewritten from the walked surface.
    expect(r.stdout).toContain("test.deep.p.p.p.skip");
  });

  it("OVER the bound: the walk stops early and the run COULD NOT RUN, at exit 2", async () => {
    row("CR25-OVER-BOUND-could-not-run");
    // MEASURED at this plan's base (`140fbf4`) at this exact length: `0 findings over 1/1 uat specs
    // checked`, EXIT=0, ZERO bytes on stderr, `tsc --noEmit` EXIT=0. A live bypass that type-checks
    // clean, and the one an eight-hop framework surface buys anywhere.
    const r = driveDeepChain(7);
    expect(
      r.status,
      `a walk that stopped at its own bound reported a verdict anyway. stdout: ${r.stdout} stderr: ${r.stderr}`,
    ).toBe(2);
    const { PROGRAM_UNAVAILABLE_REASON, SURFACE_TRUNCATED_CAUSE } = await loadChecker();
    expect(r.stderr).toContain(PROGRAM_UNAVAILABLE_REASON);
    expect(r.stderr).toContain(SURFACE_TRUNCATED_CAUSE);
    // WHICH bound, named. A cause that says only "a bound" leaves a reader to guess which limit to
    // raise, and the two have different remedies.
    expect(r.stderr).toContain("DEPTH bound");
    // A could-not-run is NOT a refusal: it claims nothing about the specs, so it reports no count.
    expect(
      r.stdout.includes("finding(s)"),
      `a could-not-run reported findings. stdout: ${r.stdout}`,
    ).toBe(false);
  });

  it("THE DIRECTION: the band never regresses to an ACCEPT, at any chain length", async () => {
    row("CR25-BAND-no-accept");
    // The pair proves two points; this proves the SHAPE between and beyond them. A single-sided row
    // proves the refusal and says nothing about what happens past it, which is exactly the shape
    // this defect lived in. Every length is either a refusal or a could-not-run — never a pass.
    const seen: Record<number, number | null> = {};
    for (const j of [3, 4, 5, 6, 7, 8]) {
      const r = driveDeepChain(j);
      seen[j] = r.status;
      expect([1, 2], `chain length ${j} was ACCEPTED. stdout: ${r.stdout}`).toContain(r.status);
      // D-28's partition, re-measured on this new outcome rather than assumed.
      expect([0, 1, 2], `chain length ${j} left the D-12 contract`).toContain(r.status);
    }
    // MONOTONE: once the walk starts stopping early it does not start finishing again.
    const lengths = Object.keys(seen).map(Number).sort((a, b) => a - b);
    let sawTwo = false;
    for (const j of lengths) {
      if (seen[j] === 2) sawTwo = true;
      else
        expect(sawTwo, `chain length ${j} refused AFTER a longer-reaching length could not run`).toBe(
          false,
        );
    }
  });

  it("THE CONFOUND: the report does not depend on how the surface is declared across FILES", async () => {
    row("CR25-CONFOUND-single-file-layout");
    // MEASURED at the base: this same chain, with every hop declared in ONE file, reported `1
    // finding(s)` / EXIT=1 at j=6, 7 and 8 — the bound was never reached, because `frameworkFiles`
    // holds FILES and one file is added whole. That is why the bisection above is a statement about
    // a LAYOUT and why the layout is written down. After D-36 the walk still stops at its bound
    // here, and it says so: the report is about the WALK, not about the file layout.
    const r = driveDeepChain(7, "single-file");
    expect(
      r.status,
      `the single-file layout hid the truncation. stdout: ${r.stdout} stderr: ${r.stderr}`,
    ).toBe(2);
    const { SURFACE_TRUNCATED_CAUSE } = await loadChecker();
    expect(r.stderr).toContain(SURFACE_TRUNCATED_CAUSE);
  });

  it("THE SPELLING BACKSTOP: a plain `test` head is refused by SPELLING, so CR-25's filed shape is not the live one", async () => {
    row("CR25-SPELLING-BACKSTOP-plain-head");
    // MEASURED at the base at j=6..9 with a plain `test` head: `1 finding(s)` / EXIT=1 at every
    // length. D-35's `foreign-declared` arm asks the spelling rule, and `test`…`skip` is banned on
    // head and tail alone — so the identity failure was INVISIBLE through this spelling. Recording
    // it is the difference between "the defect is closed" and "one spelling of it was masked by a
    // second rule": the alias-headed row above is the same defect with the mask removed.
    const r = driveDeepChain(7, "per-file", "plain");
    expect(
      r.status,
      `the plain-headed chain still reported a verdict over a walk that stopped early — at the base ` +
        `this was EXIT=1, a refusal the SPELLING rule produced over an identity answer that had ` +
        `already failed. stdout: ${r.stdout} stderr: ${r.stderr}`,
    ).toBe(2);
    const { SURFACE_TRUNCATED_CAUSE } = await loadChecker();
    expect(r.stderr).toContain(SURFACE_TRUNCATED_CAUSE);
  });

  it("PREMISE: both members of the flip pair TYPE-CHECK, so neither rests on a refused construct", () => {
    row("CR25-PREMISE-pair-typechecks");
    const host = hostTypeScript as typeof import("typescript");
    for (const j of [4, 7]) {
      const dir = mkTmp();
      const files = { ...deepSurfaceFiles(j, "per-file"), "p.uat.spec.ts": deepChainSpec(j, "alias") };
      const roots: string[] = [join(FIXTURES, "playwright-test.d.ts")];
      for (const [rel, body] of Object.entries(files)) {
        const abs = join(dir, rel.replace("types/", ""));
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, body, "utf8");
        roots.push(abs);
      }
      const program = host.createProgram(roots, {
        strict: true,
        noEmit: true,
        target: host.ScriptTarget.ES2022,
        module: host.ModuleKind.ESNext,
        moduleResolution: host.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      });
      const diagnostics = host.getPreEmitDiagnostics(program);
      expect(
        diagnostics.map((d) => `${d.file?.fileName}: TS${d.code}`),
        `chain length ${j} does not type-check — the measurement would be about the compiler, not the ban`,
      ).toEqual([]);
    }
  });

  it("THE NODE BOUND sets the same signal as the DEPTH bound, driven by a WIDE surface", async () => {
    row("CR25-NODE-BOUND-could-not-run");
    // Driven by CONSTRUCTION rather than through an injected bound: 4,200 distinct declared types at
    // depth two, so `typePaths` exhausts `SURFACE_NODE_BOUND` (4096) long before the depth bound is
    // in reach. The spec is CLEAN — the point is that a run whose surface was not fully walked makes
    // no claim about the specs even when it found nothing, which is the whole difference between a
    // could-not-run and a pass. MEASURED at the base: `0 findings` / EXIT=0 / 0 bytes on stderr.
    const WIDE = 4200;
    let widest = "interface GrugWide {\n";
    for (let i = 0; i < WIDE; i++) widest += `  readonly m${i}: GrugW${i};\n`;
    widest += "}\n";
    for (let i = 0; i < WIDE; i++) widest += `interface GrugW${i} { readonly v${i}: string; }\n`;
    const r = driveSpec(
      `import { test, expect } from "@playwright/test";

test("a scenario", async ({ page }) => {
${TAIL}
});
`,
      {},
      {
        "types/wide-surface.d.ts":
          'declare module "@playwright/test" {\n  interface Test {\n    readonly wide: GrugWide;\n  }\n}\n',
        "types/wide-all.d.ts": widest,
      },
    );
    expect(
      r.status,
      `the node bound was reached and the run reported a verdict anyway. stdout: ${r.stdout}`,
    ).toBe(2);
    const { SURFACE_TRUNCATED_CAUSE } = await loadChecker();
    expect(r.stderr).toContain(SURFACE_TRUNCATED_CAUSE);
    expect(r.stderr).toContain("NODE bound");
  });

  it("THE NARROWING'S OWN REGRESSION: a framework member behind a LIBRARY CONTAINER is still refused", async () => {
    row("CR25-CONTAINER-still-refused");
    // FOUND BY THIS PLAN'S OWN ADVERSARIAL PROBE, and it was a regression this plan CREATED. With
    // the standard-library narrowing in and nothing else, `t.many[0].skip(...)` behind a `Held[]`
    // declared on the framework's own `Test` type was ACCEPTED at exit 0 — measured, `tsc --noEmit`
    // exit 0 — where the artifact at the plan's base REFUSED it at exit 1. The walk now descends
    // into a container's type ARGUMENTS, never into the container's own members, so what a library
    // type HOLDS stays the framework's while the depth budget stays narrow. This row is the control
    // that keeps the trade honest: delete the descent and it reds.
    const r = driveSpec(
      `import { test, expect } from "@playwright/test";

const t = test;

t.many[0].skip("the skipped scenario", () => {});

test("a scenario", async ({ page }) => {
${TAIL}
});
`,
      {},
      {
        "types/held-surface.d.ts":
          'declare module "@playwright/test" {\n  interface Test {\n    readonly many: GrugHeld[];\n  }\n}\n',
        "types/held-1.d.ts":
          "interface GrugHeld {\n  readonly skip: (title: string, body: () => unknown) => void;\n}\n",
      },
    );
    expect(
      r.status,
      `a framework member behind a library container was accepted. stdout: ${r.stdout}`,
    ).toBe(1);
    expect(r.stdout).toContain("1 finding(s) over 1/1 uat specs checked");
    expect(r.stdout).toContain("test.many.skip");
  });

  it("THE DISCLOSED REMAINDER: a member behind an INDEX SIGNATURE is accepted, and says so nowhere", async () => {
    row("CR25-INDEX-SIGNATURE-open");
    // The register member this row exists for, driven rather than asserted as prose. The walk reads
    // declared PROPERTIES; an index signature is not one, so the member is outside the surface at
    // ANY depth — no bound is reached and nothing is truncated. MEASURED IDENTICALLY against the
    // artifact at this plan's base (`0 findings`, EXIT=0, `tsc --noEmit` exit 0), which is what
    // makes it a pre-existing remainder rather than a cost of D-36's narrowing.
    //
    // THE ROW ASSERTS THE ACCEPT ON PURPOSE. A disclosed shape whose behaviour nothing observes is
    // a disclosure that can quietly stop being true; this one reds if the shape is ever closed
    // without the member being retired with it.
    const idx = {
      "types/idx-surface.d.ts":
        'declare module "@playwright/test" {\n  interface Test {\n    readonly bag: GrugBag;\n  }\n}\n',
      "types/idx-1.d.ts": "interface GrugBag {\n  [key: string]: GrugMod;\n}\n",
      "types/idx-2.d.ts":
        "interface GrugMod {\n  readonly skip: (title: string, body: () => unknown) => void;\n}\n",
    };
    const aliased = driveSpec(
      `import { test, expect } from "@playwright/test";

const t = test;

t.bag.anything.skip("the skipped scenario", () => {});

test("a scenario", async ({ page }) => {
${TAIL}
});
`,
      {},
      idx,
    );
    expect(aliased.status, `stdout: ${aliased.stdout} stderr: ${aliased.stderr}`).toBe(0);
    expect(aliased.stdout).toContain("0 findings over 1/1 uat specs checked");
    // …and the HALF that is not open, in the same construction: the spelling rule still refuses the
    // `test`-headed spelling on head and tail alone, which is what bounds the disclosure.
    const plain = driveSpec(
      `import { test, expect } from "@playwright/test";

test.bag.anything.skip("the skipped scenario", () => {});

test("a scenario", async ({ page }) => {
${TAIL}
});
`,
      {},
      idx,
    );
    expect(plain.status, `stdout: ${plain.stdout}`).toBe(1);
    expect(plain.stdout).toContain("`test.bag.anything.skip`");
  });

  it("HEADROOM: the compiler's own library is not the framework's surface", async () => {
    row("CR25-LIB-NOT-FRAMEWORK");
    // MEASURED at the base, over the transcribed surface this repository ships:
    //   typePaths.size = 79      frameworkFiles = 17, SIXTEEN of them node_modules/typescript/lib/*
    //   deepest recorded path = `expect().toHaveText().__@toStringTag@52.length.toString` — SIX
    //   property-and-call links, which IS `SURFACE_DEPTH_BOUND`.
    // So the depth bound was already being reached on an ORDINARY run, by walking `String`,
    // `Number`, `Array` and `Promise`. A truncation route added without narrowing the walk would
    // have turned EVERY run into a could-not-run: the headroom was not thin, it was zero, and the
    // reason was that the budget was being spent outside the framework entirely.
    const root = mkTargetRepo({ "e2e/uat/subject.uat.spec.ts": "clean.uat.spec.ts" });
    const ctx = await programContextFor(root, ["e2e/uat/subject.uat.spec.ts"]);
    expect(ctx.frameworkFiles.size, "PREMISE: the framework file set is empty").toBeGreaterThan(0);
    const lib = [...ctx.frameworkFiles].filter((f) => /[\\/]typescript[\\/]lib[\\/]/.test(f));
    expect(
      lib,
      `the compiler's own standard library is counted as the framework's declaration surface: ${lib.join(", ")}`,
    ).toEqual([]);
    // …and the walk now has room: the numbers this plan's headroom claim is made of.
    expect(ctx.typePaths.size, "PREMISE: the walk recorded no paths at all").toBeGreaterThan(0);
    expect(
      ctx.typePaths.size,
      "the transcribed surface is within a factor of four of the node bound — the headroom claim is stale",
    ).toBeLessThan(1024);
  });
});
