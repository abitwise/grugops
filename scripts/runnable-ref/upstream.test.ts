// upstream.test.ts — the host upstream reader (phase 44, plan 44-01, UP-01, UP-03, UP-06, D-08, D-13, D-20).
//
// Every case runs the COMMITTED upstream.js copied alone into one empty temporary directory beside only a package.json,
// with no node_modules and no sibling script reachable: the host emulation. The upstream repositories are synthetic and
// built at test time by scripts/runnable-ref/upstream-fixture.test-support.ts, under a scratch HOME, so neither the
// developer's git config nor this repository reaches them.
//
//   exit 0 → every declared source matches (`match <id> <commit>`), or none is declared
//   exit 1 → a source drifts and none is UNKNOWN
//   exit 2 → a source is `UNKNOWN - verify`, or the run could not start (nothing on stdout, one `Error: ` line)
//
// PLAN 44-05 adds one case per check state (`check states`, `unknown`, `mixed`, `config read`, `never moves a pin`):
// each prints its named line and exit code, and every run is digested before and after, so a run that changed one
// byte of the product or of an upstream checkout (`.git` included) fails. The config-read fault is injected from
// outside the program by scripts/fault-inject.test-support.ts, at a site derived from the committed .js.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  callingSites,
  deriveReadSites,
  hasNodeStack,
  runFaulted,
  scriptUrl,
} from "../fault-inject.test-support.js";
import {
  SYNTHETIC_DOCUMENTS,
  SYNTHETIC_ENTRY,
  SYNTHETIC_MANIFEST,
  cloneShallow,
  commitMore,
  fixtureEnv,
  fixtureGit,
  makeBare,
  makeNestedFolder,
  makeProduct,
  makeUpstream,
  syntheticFiles,
  treeDigest,
} from "./upstream-fixture.test-support.js";

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

let hostMemo: string | undefined;

/** The committed upstream.js, copied alone into an empty directory beside only a package.json. */
function hostProgram(): string {
  if (hostMemo !== undefined) return hostMemo;
  const host = mkTmp("grugops-upstream-host-");
  const committed = join(import.meta.dirname, "upstream.js");
  expect(existsSync(committed), "the committed program upstream.js exists").toBe(true);
  copyFileSync(committed, join(host, "upstream.js"));
  writeFileSync(join(host, "package.json"), '{"type":"module"}\n');
  hostMemo = join(host, "upstream.js");
  return hostMemo;
}

interface Ran {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** The committed upstream.js run with its working directory in `cwd`, under `env`. */
function upstream(cwd: string, env: NodeJS.ProcessEnv, ...args: string[]): Ran {
  const r = spawnSync(process.execPath, [hostProgram(), ...args], { encoding: "utf8", cwd, env, timeout: 60_000 });
  expect(r.error, "the program did not finish in bounded time").toBeUndefined();
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** A scratch tree with a fixture home: `<tmp>/home`, and the directory `<tmp>` the product and upstream sit in. */
function scratch(): { readonly base: string; readonly env: NodeJS.ProcessEnv } {
  const base = mkTmp("grugops-upstream-");
  return { base, env: fixtureEnv(join(base, "home")) };
}

describe("upstream.js — check states (plan 44-01, D-13)", () => {
  it("a declared sha1 source whose pin, entry blob and manifest agree prints `match <id> <commit>` and exits 0", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const product = makeProduct(join(base, "product"), {
      upstream: {
        sources: [
          {
            id: "design",
            path: "../design",
            commit: design.commit,
            entry: SYNTHETIC_ENTRY,
            entry_blob: design.blobOf(SYNTHETIC_ENTRY),
            owns: { areas: ["product"], prefixes: ["DEC", "Q"] },
          },
        ],
      },
    });
    expect(design.commit).toMatch(/^[0-9a-f]{40}$/);
    const r = upstream(product, env, "check");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe(`match design ${design.commit}\n`);
    expect(r.status).toBe(0);
  });
});

describe("upstream.js — none declared (plan 44-01, UP-01 zero-config)", () => {
  it("a .grugops directory with no factory.config.json prints the none-declared line and exits 0", () => {
    const { base, env } = scratch();
    const product = makeProduct(join(base, "product"), null);
    const r = upstream(product, env, "check");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe("no upstream sources declared\n");
    expect(r.status).toBe(0);
  });

  it("a config with no upstream key prints the none-declared line and exits 0", () => {
    const { base, env } = scratch();
    const product = makeProduct(join(base, "product"), { mode: "lean" });
    const r = upstream(product, env, "check");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe("no upstream sources declared\n");
    expect(r.status).toBe(0);
  });

  it("a root with no .grugops directory exits 2 with nothing on stdout and one `Error: ` line on stderr", () => {
    const { base, env } = scratch();
    const bare = join(base, "not-a-product");
    mkdirSync(bare);
    const r = upstream(bare, env, "check");
    expect(r.stdout).toBe("");
    expect(r.stderr.startsWith("Error: ")).toBe(true);
    expect(r.stderr.split("\n").filter((l) => l !== "")).toHaveLength(1);
    expect(r.status).toBe(2);
  });
});

// --- plan 44-05: every check state, its line and its exit code (D-13, D-14, D-19, UP-03, UP-04, UP-06) ---------------
//
// Every case below runs through checkUnchanged, which digests the product tree and every upstream checkout the case
// names (files and `.git`) before and after the run and fails if one byte moved: `check` reads, it never writes, and it
// never moves a pin (UP-03). Each expected line is the exact grammar of plan 44-01, typed out in full.

/** Two areas and two prefix sets, so up to two sources never share an owner (D-18). */
const OWNS = [
  { areas: ["product"], prefixes: ["DEC", "Q"] },
  { areas: ["ux"], prefixes: ["UX"] },
] as const;

/** One `upstream.sources` element for `up`, with `path` as written and any field overridden by `over`. */
function sourceOf(
  id: string,
  path: string,
  up: { readonly commit: string; readonly blobOf: (p: string) => string },
  ownerIndex = 0,
  over: Readonly<Record<string, string>> = {},
): Record<string, unknown> {
  return {
    id,
    path,
    commit: up.commit,
    entry: SYNTHETIC_ENTRY,
    entry_blob: up.blobOf(SYNTHETIC_ENTRY),
    owns: OWNS[ownerIndex],
    ...over,
  };
}

/** A product at `<base>/product` declaring `sources` in that order. */
function productDeclaring(base: string, ...sources: Record<string, unknown>[]): string {
  return makeProduct(join(base, "product"), { upstream: { sources } });
}

/**
 * `check` run in `product`, with the tree digest of `product` and of every directory in `watched` taken before and
 * after: any changed byte fails the case (UP-03, never moves a pin).
 */
function checkUnchanged(product: string, env: NodeJS.ProcessEnv, watched: readonly string[], ...extra: string[]): Ran {
  const dirs = [product, ...watched];
  const before = dirs.map(treeDigest);
  const r = upstream(product, env, "check", ...extra);
  expect(dirs.map(treeDigest), `no byte of ${dirs.join(", ")} changed during check`).toEqual(before);
  return r;
}

/** The blob id of `path` at `commit` in `dir`. */
function blobAt(dir: string, commit: string, path: string, env: NodeJS.ProcessEnv): string {
  return fixtureGit(dir, ["rev-parse", `${commit}:${path}`], env);
}

/** The single `UNKNOWN - verify design: ...` outcome: exactly that one stdout line, no stderr, exit 2. */
function expectUnknown(r: Ran, reason: string | RegExp): void {
  const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
  expect(r.stderr, all).toBe("");
  const lines = r.stdout.split("\n");
  expect(lines, all).toHaveLength(2);
  expect(lines[1], all).toBe("");
  const prefix = "UNKNOWN - verify design: ";
  expect((lines[0] as string).startsWith(prefix), all).toBe(true);
  const said = (lines[0] as string).slice(prefix.length);
  if (typeof reason === "string") expect(said, all).toBe(reason);
  else expect(said, all).toMatch(reason);
  expect(r.status, all).toBe(2);
}

describe("upstream.js — check states (plan 44-05, D-13, UP-03, UP-06)", () => {
  it("HEAD exactly at the pin prints `match`; HEAD one commit past the pin prints `drift design: head-moved` and exits 1 (adjacency)", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const product = productDeclaring(base, sourceOf("design", "../design", design));
    const atPin = checkUnchanged(product, env, [design.dir]);
    expect(atPin.stdout).toBe(`match design ${design.commit}\n`);
    expect(atPin.status).toBe(0);
    const head = commitMore(design.dir, { "decisions/dec-1.md": "# DEC-1\n\nThe product has one main screen, revised.\n" }, env);
    const past = checkUnchanged(product, env, [design.dir]);
    expect(past.stderr).toBe("");
    expect(past.stdout).toBe(`drift design: head-moved (HEAD ${head}, pin ${design.commit})\n`);
    expect(past.status).toBe(1);
  });

  it("HEAD two commits past the pin with an uncommitted edit to the manifest prints `drift design: head-moved (HEAD <head>, pin <commit>)` and exits 1", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    commitMore(design.dir, { "decisions/dec-1.md": "# DEC-1\n\nRevised once.\n" }, env);
    const head = commitMore(design.dir, { "notes/extra.md": "# Extra\n\nA second change.\n" }, env);
    writeFileSync(join(design.dir, ...SYNTHETIC_ENTRY.split("/")), `${SYNTHETIC_MANIFEST}| DEC-9 | locked | decisions/dec-9.md | |\n`);
    expect(fixtureGit(design.dir, ["status", "--porcelain"], env), "PREMISE: the working tree is dirty").toContain("manifest.md");
    const product = productDeclaring(base, sourceOf("design", "../design", design));
    const r = checkUnchanged(product, env, [design.dir]);
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe(`drift design: head-moved (HEAD ${head}, pin ${design.commit})\n`);
    expect(r.status).toBe(1);
  });

  it("a declared entry_blob of another real blob prints `drift design: blob-mismatch (declared <x>, at the pin <y>)` and exits 1 (UP-06)", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const other = design.blobOf("decisions/dec-1.md");
    const atPin = design.blobOf(SYNTHETIC_ENTRY);
    const product = productDeclaring(base, sourceOf("design", "../design", design, 0, { entry_blob: other }));
    const r = checkUnchanged(product, env, [design.dir]);
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe(`drift design: blob-mismatch (declared ${other}, at the pin ${atPin})\n`);
    expect(r.status).toBe(1);
  });

  it("blob-mismatch and a moved HEAD print the blob-mismatch line first, then the head-moved line, exit 1 (ordering within one source)", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const other = design.blobOf("decisions/dec-1.md");
    const atPin = design.blobOf(SYNTHETIC_ENTRY);
    const head = commitMore(design.dir, { "notes/extra.md": "# Extra\n" }, env);
    const product = productDeclaring(base, sourceOf("design", "../design", design, 0, { entry_blob: other }));
    const r = checkUnchanged(product, env, [design.dir]);
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe(
      `drift design: blob-mismatch (declared ${other}, at the pin ${atPin})\n` +
        `drift design: head-moved (HEAD ${head}, pin ${design.commit})\n`,
    );
    expect(r.status).toBe(1);
  });

  it("a sha256 upstream pinned with 64-hex ids prints `match` and exits 0", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha256", env });
    expect(design.commit).toMatch(/^[0-9a-f]{64}$/);
    expect(design.blobOf(SYNTHETIC_ENTRY)).toMatch(/^[0-9a-f]{64}$/);
    const product = productDeclaring(base, sourceOf("design", "../design", design));
    const r = checkUnchanged(product, env, [design.dir]);
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe(`match design ${design.commit}\n`);
    expect(r.status).toBe(0);
  });

  it("lines follow config order: two matching sources print two lines in declared order, and swapping the order swaps the lines", () => {
    const { base, env } = scratch();
    const a = makeUpstream(join(base, "a"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const b = makeUpstream(join(base, "b"), { files: { ...syntheticFiles(), "notes/b.md": "# B\n" }, objectFormat: "sha1", env });
    const product = productDeclaring(base, sourceOf("alpha", "../a", a, 0), sourceOf("beta", "../b", b, 1));
    const ab = checkUnchanged(product, env, [a.dir, b.dir]);
    expect(ab.stdout).toBe(`match alpha ${a.commit}\nmatch beta ${b.commit}\n`);
    expect(ab.status).toBe(0);
    makeProduct(product, { upstream: { sources: [sourceOf("beta", "../b", b, 1), sourceOf("alpha", "../a", a, 0)] } });
    const ba = checkUnchanged(product, env, [a.dir, b.dir]);
    expect(ba.stdout).toBe(`match beta ${b.commit}\nmatch alpha ${a.commit}\n`);
    expect(ba.status).toBe(0);
  });
});

describe("upstream.js — unknown: each cause is one named `UNKNOWN - verify` line and exit 2 (plan 44-05, D-13, D-19, UP-04)", () => {
  it("unknown: a path that does not exist", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const product = productDeclaring(base, sourceOf("design", "../missing", design));
    expectUnknown(checkUnchanged(product, env, [design.dir]), "path ../missing does not exist");
  });

  it("unknown: a plain folder inside another git repository is not the top of a git checkout", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    makeNestedFolder(design.dir, "export-copy");
    expect(
      fixtureGit(join(design.dir, "export-copy"), ["rev-parse", "--show-toplevel"], env),
      "PREMISE: git answers for the parent repository there",
    ).toBe(design.dir);
    const product = productDeclaring(base, sourceOf("design", "../design/export-copy", design));
    expectUnknown(checkUnchanged(product, env, [design.dir]), "../design/export-copy is not the top of a git checkout");
  });

  it("unknown: a bare repository is not the top of a git checkout", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const bare = makeBare(design.dir, join(base, "design.git"), env);
    const product = productDeclaring(base, sourceOf("design", "../design.git", design));
    expectUnknown(checkUnchanged(product, env, [bare]), /^\.\.\/design\.git is not the top of a git checkout \(fatal: .+\)$/);
  });

  it("unknown: no git on PATH (node started by its absolute path) gives `git was not found on PATH`", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const product = productDeclaring(base, sourceOf("design", "../design", design));
    const emptyBin = join(base, "empty-bin");
    mkdirSync(emptyBin);
    expectUnknown(checkUnchanged(product, { ...env, PATH: emptyBin }, [design.dir]), "git was not found on PATH");
  });

  it("unknown: a `--depth 1` clone whose pin is the older commit does not hold the pinned commit", () => {
    const { base, env } = scratch();
    const origin = makeUpstream(join(base, "origin"), { files: syntheticFiles(), objectFormat: "sha1", env });
    commitMore(origin.dir, { "notes/extra.md": "# Extra\n" }, env);
    const shallow = cloneShallow(origin.dir, join(base, "design"), env);
    expect(fixtureGit(shallow, ["rev-parse", "--is-shallow-repository"], env), "PREMISE: the clone is shallow").toBe("true");
    const product = productDeclaring(base, sourceOf("design", "../design", origin));
    expectUnknown(
      checkUnchanged(product, env, [shallow]),
      `pinned commit ${origin.commit} is not in the checkout (shallow clone or not fetched)`,
    );
  });

  it("unknown: a 40-hex pin against a sha256 repository names the format mismatch", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha256", env });
    const product = productDeclaring(
      base,
      sourceOf("design", "../design", design, 0, { commit: "ab".repeat(20), entry_blob: "cd".repeat(20) }),
    );
    expectUnknown(checkUnchanged(product, env, [design.dir]), "the pin is 40-hex but the checkout uses 64-hex object ids");
  });

  it("unknown: a manifest with a duplicated ID gives `manifest: <reason>, line <n>`", () => {
    const { base, env } = scratch();
    const manifest = `${SYNTHETIC_MANIFEST}| DEC-1 | locked | decisions/dec-1.md | |\n`;
    const design = makeUpstream(join(base, "design"), {
      files: { ...SYNTHETIC_DOCUMENTS, [SYNTHETIC_ENTRY]: manifest },
      objectFormat: "sha1",
      env,
    });
    const product = productDeclaring(base, sourceOf("design", "../design", design));
    expectUnknown(checkUnchanged(product, env, [design.dir]), "manifest: ID DEC-1 is listed more than once, line 9");
  });

  it("unknown: a manifest row whose Path is absent at the pin is not a regular file at the pin", () => {
    const { base, env } = scratch();
    const manifest = `${SYNTHETIC_MANIFEST}| DEC-9 | locked | decisions/dec-9.md | |\n`;
    const design = makeUpstream(join(base, "design"), {
      files: { ...SYNTHETIC_DOCUMENTS, [SYNTHETIC_ENTRY]: manifest },
      objectFormat: "sha1",
      env,
    });
    const product = productDeclaring(base, sourceOf("design", "../design", design));
    expectUnknown(checkUnchanged(product, env, [design.dir]), "listed path decisions/dec-9.md is not a regular file at the pin");
  });

  it("unknown: a manifest row whose Path is a symbolic link at the pin is not a regular file at the pin", () => {
    const { base, env } = scratch();
    const first = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const commit = commitMore(first.dir, {}, env, { "decisions/dec-2.md": "dec-3.md" });
    expect(fixtureGit(first.dir, ["ls-tree", commit, "--", "decisions/dec-2.md"], env), "PREMISE: a link at the pin").toMatch(/^120000 /);
    const pinned = { commit, blobOf: (p: string) => blobAt(first.dir, commit, p, env) };
    const product = productDeclaring(base, sourceOf("design", "../design", pinned));
    expectUnknown(checkUnchanged(product, env, [first.dir]), "listed path decisions/dec-2.md is not a regular file at the pin");
  });

  it("unknown: a `path` that is a symbolic link resolving inside the product repository (the real-path re-check, D-19)", () => {
    const { base, env } = scratch();
    const product = makeProduct(join(base, "product"), null);
    const inner = makeUpstream(join(product, "vendor", "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    symlinkSync(inner.dir, join(base, "design-link"));
    productDeclaring(base, sourceOf("design", "../design-link", inner));
    expectUnknown(checkUnchanged(product, env, []), "path ../design-link resolves inside the product repository");
  });
});

describe("upstream.js — mixed: a drift and an UNKNOWN in one run exit 2 (plan 44-05, Option A, D-14)", () => {
  it("mixed: source a head-moved and source b path missing print both lines in config order and exit 2", () => {
    const { base, env } = scratch();
    const a = makeUpstream(join(base, "a"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const head = commitMore(a.dir, { "notes/extra.md": "# Extra\n" }, env);
    const product = productDeclaring(base, sourceOf("a", "../a", a, 0), sourceOf("b", "../b-missing", a, 1));
    const r = checkUnchanged(product, env, [a.dir]);
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe(`drift a: head-moved (HEAD ${head}, pin ${a.commit})\nUNKNOWN - verify b: path ../b-missing does not exist\n`);
    expect(r.status).toBe(2);
    makeProduct(product, { upstream: { sources: [sourceOf("b", "../b-missing", a, 1), sourceOf("a", "../a", a, 0)] } });
    const swapped = checkUnchanged(product, env, [a.dir]);
    expect(swapped.stdout).toBe(`UNKNOWN - verify b: path ../b-missing does not exist\ndrift a: head-moved (HEAD ${head}, pin ${a.commit})\n`);
    expect(swapped.status).toBe(2);
  });
});

describe("upstream.js — config read: a config that cannot be read or parsed stops the run with exit 2 (plan 44-05)", () => {
  /** The one `Error: ` line shape: exit 2, nothing on stdout, one stderr line, no stack. */
  function expectConfigError(r: { status: number | null; stdout: string; stderr: string }, says: RegExp): void {
    const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(r.status, all).toBe(2);
    expect(r.stdout, all).toBe("");
    expect(hasNodeStack(r.stderr), all).toBe(false);
    expect(r.stderr.startsWith("Error: "), all).toBe(true);
    expect(r.stderr.split("\n").filter((l) => l !== ""), all).toHaveLength(1);
    expect(r.stderr, all).toMatch(says);
  }

  it("config read: an EIO injected at the config read exits 2 naming `.grugops/factory.config.json`, nothing on stdout", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const product = productDeclaring(base, sourceOf("design", "../design", design));
    const js = hostProgram();
    const site = deriveReadSites(js).find((s) => s.key === "readRegularFileOrNull:readSync#0");
    expect(site, "PREMISE: the reader's readSync site is derived from the committed .js").toBeDefined();
    const callers = callingSites(js, "readRegularFileOrNull");
    expect(callers.map((c) => c.scope), "PREMISE: the reader is entered from the config read only").toEqual(["configTextOrNull"]);
    const url = scriptUrl(js);
    const before = treeDigest(product);
    const r = runFaulted(
      js,
      ["check"],
      {
        kind: "fs",
        fn: "readSync",
        site: { url, line: (site as { line: number }).line },
        via: { url, line: (callers[0] as { line: number }).line },
        code: "EIO",
      },
      { scratch: mkTmp("grugops-upstream-fault-"), cwd: product, env: { HOME: env.HOME as string } },
    );
    expect(r.fired, `PREMISE: the fault fired (site-not-via ${r.siteNotVia})`).toBeGreaterThan(0);
    expectConfigError(r, /\.grugops\/factory\.config\.json could not be read \(.*EIO.*\)/);
    expect(treeDigest(product)).toBe(before);
  });

  it("config read: invalid JSON exits 2 with nothing on stdout, naming the config", () => {
    const { base, env } = scratch();
    const product = makeProduct(join(base, "product"), null);
    writeFileSync(join(product, ".grugops", "factory.config.json"), '{"upstream": {"sources": [}\n');
    expectConfigError(checkUnchanged(product, env, []), /^Error: \.grugops\/factory\.config\.json is not valid JSON \(/);
  });

  it("config read: a malformed upstream declaration exits 2 with nothing on stdout, naming the config", () => {
    const { base, env } = scratch();
    const product = makeProduct(join(base, "product"), { upstream: { sources: [{ id: "design" }] } });
    expectConfigError(
      checkUnchanged(product, env, []),
      /^Error: \.grugops\/factory\.config\.json declares upstream sources that cannot be checked: /,
    );
  });
});

describe("upstream.js — never moves a pin: check writes nothing and accepts no write verb (plan 44-05, UP-03)", () => {
  it("never moves a pin: `move`, `set` and `write` each exit 2 naming the usage, with nothing on stdout", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const product = productDeclaring(base, sourceOf("design", "../design", design));
    const before = [treeDigest(product), treeDigest(design.dir)];
    for (const verb of ["move", "set", "write"]) {
      const r = upstream(product, env, verb, "design", "--commit", design.commit);
      expect(r.status, verb).toBe(2);
      expect(r.stdout, verb).toBe("");
      expect(r.stderr, verb).toBe(`Error: unknown command ${verb}. Usage: node upstream.js check [--root <dir>].\n`);
    }
    expect([treeDigest(product), treeDigest(design.dir)]).toEqual(before);
  });

  it("never moves a pin: match, drift and UNKNOWN runs leave the product and the upstream byte-identical, and the config keeps its pin", () => {
    const { base, env } = scratch();
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const product = productDeclaring(base, sourceOf("design", "../design", design), sourceOf("gone", "../gone", design, 1));
    const configBefore = treeDigest(join(product, ".grugops"));
    const productBefore = treeDigest(product);
    const designBefore = treeDigest(design.dir);
    const first = upstream(product, env, "check");
    expect(first.status).toBe(2);
    commitMore(design.dir, { "notes/extra.md": "# Extra\n" }, env);
    const designMoved = treeDigest(design.dir);
    expect(designMoved, "PREMISE: the upstream moved between the runs").not.toBe(designBefore);
    const second = upstream(product, env, "check");
    expect(second.stdout).toContain("drift design: head-moved");
    expect(treeDigest(product)).toBe(productBefore);
    expect(treeDigest(join(product, ".grugops")), "the config still holds the original pin").toBe(configBefore);
    expect(treeDigest(design.dir)).toBe(designMoved);
  });

  it("never moves a pin: two runs over the same tree print identical bytes and the same exit code", () => {
    const { base, env } = scratch();
    const a = makeUpstream(join(base, "a"), { files: syntheticFiles(), objectFormat: "sha1", env });
    commitMore(a.dir, { "notes/extra.md": "# Extra\n" }, env);
    const product = productDeclaring(
      base,
      sourceOf("a", "../a", a, 0, { entry_blob: a.blobOf("decisions/dec-1.md") }),
      sourceOf("b", "../b-missing", a, 1),
    );
    const one = checkUnchanged(product, env, [a.dir]);
    const two = checkUnchanged(product, env, [a.dir]);
    expect(one.stdout.split("\n").filter((l) => l !== "")).toHaveLength(3);
    expect(two.stdout).toBe(one.stdout);
    expect(two.stderr).toBe(one.stderr);
    expect(two.status).toBe(one.status);
  });
});
