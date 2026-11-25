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

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SYNTHETIC_ENTRY, fixtureEnv, makeProduct, makeUpstream, syntheticFiles } from "./upstream-fixture.test-support.js";

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
