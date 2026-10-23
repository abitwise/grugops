// generate-runnable-embeds.test.ts — the embed generator and its freshness gate (phase 37, plan 37-03, SPLIT-05).
//
// What is proven here:
//   * a closure is copied verbatim, in source order, with one merged import line per `node:` specifier;
//   * the generator refuses a closure reaching a non-`node:` import, two declarations with one name in one
//     target, and LEGACY_STATE_ROOT_REL, each naming what it met;
//   * every committed region is fresh, and a one-character hand edit inside a region makes the freshness gate
//     exit 1 naming the target (run in a temporary mirror, never on the tree);
//   * EMBED_SPECS is pinned two-sided against EMBED_SPEC_COUNT;
//   * the gate is wired in .github/workflows/ci.yml and in package.json (both ends).
//
// Fixture authorities are written to temporary directories. The committed .js is what runs.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { ciWorkflow, ubuntuBlockCommands } from "./ci-workflow.testkit.js";
import {
  EMBED_CLOSE,
  EMBED_OPEN,
  EMBED_SPECS,
  EMBED_SPEC_COUNT,
  deriveRegion,
  regionSpans,
  rewriteRunnable,
  runnableSetStamp,
  type EmbedSpec,
} from "./generate-runnable-embeds.js";
import { RUNNABLE_STAMP_LINE, readRunnableStamp } from "./runnable-stamp.js";

const ROOT = join(import.meta.dirname, "..");

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

/** A temporary root holding `files` (repo-relative path to text). */
function fixtureRoot(files: Record<string, string>, base: string = tmpdir()): string {
  mkdirSync(base, { recursive: true });
  const root = mkdtempSync(join(base, "grugops-embeds-"));
  tmpRoots.push(root);
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, ...rel.split("/"));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return root;
}

/** The compiled gate and every module it imports, copied into a temporary mirror to run it there. */
const GATE_SCRIPTS = ["runnable-embeds-freshness.js", "generate-runnable-embeds.js", "is-entry.js", "runnable-stamp.js"] as const;

const HELPER_AUTHORITY = [
  'import { readFileSync, constants as fsConstants } from "node:fs";',
  'import { join } from "node:path";',
  "",
  "/** Not reached by any root, so never embedded. */",
  "export const UNUSED = 1;",
  "",
  "function helper(): number {",
  "  return fsConstants.O_RDONLY;",
  "}",
  "",
  "export function rootFn(p: string): string {",
  '  return readFileSync(p, "utf8") + String(helper());',
  "}",
  "",
  "export function other(): string {",
  '  return join("a", "b");',
  "}",
  "",
].join("\n");

describe("deriveRegion — the closure, verbatim and in source order", () => {
  it("a root that references a helper and a node:fs named import embeds the helper and the root in source order, with one merged node:fs line", () => {
    const root = fixtureRoot({ "lib/a.ts": HELPER_AUTHORITY });
    const spec: EmbedSpec = { target: "out.ts", authorities: [{ module: "lib/a.ts", roots: ["rootFn"] }] };
    const region = deriveRegion(spec, root, [spec]);
    const lines = region.split("\n");
    expect(lines[0]).toBe(EMBED_OPEN);
    expect(lines[lines.length - 1]).toBe(EMBED_CLOSE);
    expect(lines[1]).toBe('import { constants as fsConstants, readFileSync } from "node:fs";');
    expect(lines.filter((l) => l.startsWith("import ")), "one import line, and node:path is not reached").toHaveLength(1);
    // The three build stamp lines follow the imports (plan 37-24): the stamp over the one-spec set, the set and self.
    expect(lines[2]).toBe(`export const RUNNABLE_SET_STAMP = "${runnableSetStamp([spec], root)}";`);
    expect(lines[2]).toMatch(RUNNABLE_STAMP_LINE);
    expect(lines[3]).toBe('export const RUNNABLE_SET = Object.freeze(["out.js"] as const);');
    expect(lines[4]).toBe('export const RUNNABLE_SELF = "out.js";');
    expect(lines[5]).toBe("// from lib/a.ts");
    const helperAt = region.indexOf("function helper(): number {");
    const rootAt = region.indexOf("export function rootFn(p: string): string {");
    expect(helperAt).toBeGreaterThan(-1);
    expect(rootAt).toBeGreaterThan(helperAt);
    expect(region, "a declaration no root reaches is not embedded").not.toContain("UNUSED");
    expect(region).not.toContain("export function other");
    // Verbatim: the declaration text is the authority's own.
    expect(HELPER_AUTHORITY).toContain(region.slice(rootAt, region.indexOf("\n}", rootAt) + 2));
  });

  it("a name a local declaration shadows is not pulled in, and a member name is not a reference", () => {
    const root = fixtureRoot({
      "lib/b.ts": [
        "export const lines = 3;",
        "export type Shape = { readonly lines: number };",
        "export function count(s: { lines: number }): number {",
        "  const lines = s.lines;",
        "  return lines;",
        "}",
        "",
      ].join("\n"),
    });
    const spec: EmbedSpec = { target: "out.ts", authorities: [{ module: "lib/b.ts", roots: ["count"] }] };
    const region = deriveRegion(spec, root, [spec]);
    expect(region).toContain("export function count");
    expect(region).not.toContain("export const lines = 3;");
    expect(region).not.toContain("export type Shape");
  });

  it("a closure that reaches a relative import throws naming the module and the specifier", () => {
    const root = fixtureRoot({
      "lib/c.ts": ['import x from "./other.js";', "export function f(): number {", "  return x;", "}", ""].join("\n"),
    });
    const spec: EmbedSpec = { target: "out.ts", authorities: [{ module: "lib/c.ts", roots: ["f"] }] };
    expect(() => deriveRegion(spec, root, [spec])).toThrow(/lib\/c\.ts.*"\.\/other\.js"/);
  });

  it("an import the closure does not reach is not refused", () => {
    const root = fixtureRoot({
      "lib/d.ts": ['import x from "./other.js";', "export const KEEP = 1;", "export function g(): number {", "  return x;", "}", ""].join("\n"),
    });
    const spec: EmbedSpec = { target: "out.ts", authorities: [{ module: "lib/d.ts", roots: ["KEEP"] }] };
    const region = deriveRegion(spec, root, [spec]);
    expect(region).toContain("export const KEEP = 1;");
    expect(region).not.toContain("other.js");
  });

  it("two authorities that each declare `cell` in one target make the generator throw naming `cell` and both modules", () => {
    const root = fixtureRoot({
      "lib/one.ts": "export const cell = 1;\n",
      "lib/two.ts": "export const cell = 2;\n",
    });
    const spec: EmbedSpec = {
      target: "out.ts",
      authorities: [
        { module: "lib/one.ts", roots: ["cell"] },
        { module: "lib/two.ts", roots: ["cell"] },
      ],
    };
    let message = "";
    try {
      deriveRegion(spec, root, [spec]);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain('"cell"');
    expect(message).toContain("lib/one.ts");
    expect(message).toContain("lib/two.ts");
  });

  it("a spec whose roots reach LEGACY_STATE_ROOT_REL makes the generator throw naming it", () => {
    const root = fixtureRoot({
      "lib/layout.ts": [
        'export const LEGACY_STATE_ROOT_REL = "legacy-root";',
        "export const LEGACY_BOARD_REL = `${LEGACY_STATE_ROOT_REL}/board.md`;",
        "",
      ].join("\n"),
    });
    const spec: EmbedSpec = { target: "out.ts", authorities: [{ module: "lib/layout.ts", roots: ["LEGACY_BOARD_REL"] }] };
    expect(() => deriveRegion(spec, root, [spec])).toThrow(/LEGACY_STATE_ROOT_REL/);
  });

  it("a root that is not a top-level declaration throws naming it", () => {
    const root = fixtureRoot({ "lib/e.ts": "export const A = 1;\n" });
    const spec: EmbedSpec = { target: "out.ts", authorities: [{ module: "lib/e.ts", roots: ["B"] }] };
    expect(() => deriveRegion(spec, root, [spec])).toThrow(/"B"/);
  });

  // Plan 37-24 (D-17, WR-05): the stamp is computed over a spec set, so a spec outside the set has no stamp.
  it("a spec that is not a member of the set throws naming its target (plan 37-24)", () => {
    const root = fixtureRoot({ "lib/a.ts": HELPER_AUTHORITY });
    const spec: EmbedSpec = { target: "lone.ts", authorities: [{ module: "lib/a.ts", roots: ["rootFn"] }] };
    expect(() => deriveRegion(spec, root, [])).toThrow(/lone\.ts.*not a member/);
    expect(() => deriveRegion(spec, root), "the default set is EMBED_SPECS").toThrow(/lone\.ts.*not a member/);
  });

  // Plan 37-24: the three generated stamp names are claimed first, so an authority cannot declare one.
  for (const name of ["RUNNABLE_SET_STAMP", "RUNNABLE_SET", "RUNNABLE_SELF"]) {
    it(`an authority that declares ${name} is refused by name (plan 37-24)`, () => {
      const root = fixtureRoot({ "lib/s.ts": `export const ${name} = 1;\n` });
      const spec: EmbedSpec = { target: "out.ts", authorities: [{ module: "lib/s.ts", roots: [name] }] };
      expect(() => deriveRegion(spec, root, [spec])).toThrow(new RegExp(`"${name}".*build stamp lines.*lib/s\\.ts`));
    });
  }
});

describe("the build stamp in every committed region (plan 37-24, D-17, WR-05, AUTH-1)", () => {
  /** The stamp lines inside a source's one region, as [line, captured stamp]. */
  const regionStamps = (text: string): string[] => {
    const [a, b] = regionSpans(text)[0] as readonly [number, number];
    return text
      .slice(a, b)
      .split("\n")
      .flatMap((l) => {
        const m = RUNNABLE_STAMP_LINE.exec(l);
        return m === null ? [] : [m[1] as string];
      });
  };

  it("each of the three targets holds exactly one stamp line inside its region, and the three stamps are equal", () => {
    expect(EMBED_SPECS.map((s) => s.target)).toEqual([
      "scripts/runnable-ref/state-check.ts",
      "scripts/runnable-ref/trace-render.ts",
      "scripts/runnable-ref/state-roll.ts",
    ]);
    const stamps = EMBED_SPECS.map((s) => {
      const text = readFileSync(join(ROOT, s.target), "utf8");
      const inRegion = regionStamps(text);
      expect(inRegion, `${s.target}: one stamp line inside the region`).toHaveLength(1);
      expect(readRunnableStamp(text), `${s.target}: one stamp line in the whole file`).toEqual({ kind: "stamp", stamp: inRegion[0] });
      return inRegion[0];
    });
    expect(new Set(stamps).size).toBe(1);
    expect(stamps[0]).toBe(runnableSetStamp(EMBED_SPECS, ROOT));
  });

  it("each committed .js carries the same stamp, RUNNABLE_SET and its own RUNNABLE_SELF (read as text: a runnable runs on import)", () => {
    const own = runnableSetStamp(EMBED_SPECS, ROOT);
    for (const s of EMBED_SPECS) {
      const js = join(ROOT, s.target.replace(/\.ts$/, ".js"));
      const text = readFileSync(js, "utf8");
      expect(readRunnableStamp(text), js).toEqual({ kind: "stamp", stamp: own });
      expect(text).toContain('export const RUNNABLE_SET = Object.freeze(["state-check.js", "state-roll.js", "trace-render.js"]);');
      const self = s.target.split("/").pop()?.replace(/\.ts$/, ".js") ?? "";
      expect(text.split("\n").filter((l) => l.startsWith("export const RUNNABLE_SELF = "))).toEqual([
        `export const RUNNABLE_SELF = ${JSON.stringify(self)};`,
      ]);
    }
  });
});

describe("regionSpans and rewriteRunnable", () => {
  it("regionSpans finds a region only where both markers are whole lines", () => {
    const text = ["a", EMBED_OPEN, "x", EMBED_CLOSE, "b", `const s = ${JSON.stringify(EMBED_OPEN)};`].join("\n");
    const spans = regionSpans(text);
    expect(spans).toHaveLength(1);
    const [a, b] = spans[0] as readonly [number, number];
    expect(text.slice(a, b)).toBe([EMBED_OPEN, "x", EMBED_CLOSE].join("\n"));
    expect(regionSpans("no markers here\n")).toEqual([]);
    expect(() => regionSpans(`${EMBED_OPEN}\n`)).toThrow();
    expect(() => regionSpans(`${EMBED_CLOSE}\n`)).toThrow();
  });

  it("rewriteRunnable throws when the target carries no region", () => {
    const root = fixtureRoot({ "lib/a.ts": HELPER_AUTHORITY, "out.ts": "export {};\n" });
    const spec: EmbedSpec = { target: "out.ts", authorities: [{ module: "lib/a.ts", roots: ["rootFn"] }] };
    expect(() => rewriteRunnable(spec, root)).toThrow(/markers are missing/);
  });

  it("every committed target is fresh: rewriteRunnable reports changed=false for every spec", () => {
    for (const spec of EMBED_SPECS) {
      expect(rewriteRunnable(spec, ROOT).changed, `${spec.target} is stale; run npm run generate:runnable-embeds`).toBe(false);
    }
  });

  it("one character edited inside a region makes the freshness gate exit 1 naming the target (temporary mirror)", () => {
    // The mirror sits under the repository's gitignored .temp/ so the copied gate resolves `typescript` from this
    // checkout's node_modules, as it does in CI. The tree itself is never edited.
    // Every target and every authority is mirrored (2026-10-22, plan 37-06: the gate re-derives every row, so a
    // mirror of the first row alone reads the second target as missing); only the first target is edited.
    const spec = EMBED_SPECS[0] as EmbedSpec;
    const files: Record<string, string> = {};
    for (const s of EMBED_SPECS) {
      for (const a of s.authorities) files[a.module] = readFileSync(join(ROOT, a.module), "utf8");
      files[s.target] = readFileSync(join(ROOT, s.target), "utf8");
    }
    const committed = readFileSync(join(ROOT, spec.target), "utf8");
    const [a] = regionSpans(committed)[0] as readonly [number, number];
    const at = committed.indexOf("boardBytes: 24_576", a);
    expect(at, "the edit site was not found inside the region").toBeGreaterThan(a);
    files[spec.target] = committed.slice(0, at) + "boardBytes: 24_577" + committed.slice(at + "boardBytes: 24_576".length);
    const mirror = fixtureRoot(files, join(ROOT, ".temp"));
    mkdirSync(join(mirror, "scripts"), { recursive: true });
    // 2026-10-23, plan 37-24: the generator imports scripts/runnable-stamp.js, the stamp line's one owner. The
    // copied list is held equal to the gate's relative import closure, so a new import cannot leave it short.
    const closure = new Set<string>(["runnable-embeds-freshness.js"]);
    for (const queue = [...closure]; queue.length > 0; ) {
      const text = readFileSync(join(ROOT, "scripts", queue.shift() as string), "utf8");
      for (const m of text.matchAll(/^import [^;]*? from "\.\/([^"/]+)";$/gm)) {
        if (!closure.has(m[1] as string)) {
          closure.add(m[1] as string);
          queue.push(m[1] as string);
        }
      }
    }
    expect([...closure].sort(), "PREMISE: GATE_SCRIPTS is the gate's relative import closure").toEqual([...GATE_SCRIPTS].sort());
    for (const js of GATE_SCRIPTS) {
      copyFileSync(join(ROOT, "scripts", js), join(mirror, "scripts", js));
    }
    writeFileSync(join(mirror, "package.json"), JSON.stringify({ type: "module" }));
    const r = spawnSync(process.execPath, [join(mirror, "scripts", "runnable-embeds-freshness.js")], { encoding: "utf8" });
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain("FAILED");
    expect(r.stdout).toContain(spec.target);
    expect(r.stdout).toContain("npm run generate:runnable-embeds");
    for (const other of EMBED_SPECS.slice(1)) expect(r.stdout, "an unedited target is not reported").not.toContain(other.target);

    // Control: the same mirror with the committed text is fresh.
    writeFileSync(join(mirror, ...spec.target.split("/")), committed);
    const ok = spawnSync(process.execPath, [join(mirror, "scripts", "runnable-embeds-freshness.js")], { encoding: "utf8" });
    expect(ok.status, ok.stdout + ok.stderr).toBe(0);
  });
});

describe("EMBED_SPECS is pinned two-sided", () => {
  it("EMBED_SPECS.length equals EMBED_SPEC_COUNT, and a mutated copy does not", () => {
    expect(EMBED_SPECS.length).toBe(EMBED_SPEC_COUNT);
    const added = [...EMBED_SPECS, EMBED_SPECS[0]];
    const removed = EMBED_SPECS.slice(1);
    expect(added.length).not.toBe(EMBED_SPEC_COUNT);
    expect(removed.length).not.toBe(EMBED_SPEC_COUNT);
  });

  it("every target is distinct and carries exactly one region", () => {
    const targets = EMBED_SPECS.map((s) => s.target);
    expect(new Set(targets).size).toBe(targets.length);
    for (const t of targets) expect(regionSpans(readFileSync(join(ROOT, t), "utf8")), t).toHaveLength(1);
  });
});

describe("the freshness gate is wired at both ends", () => {
  it("package.json declares both scripts and .github/workflows/ci.yml runs the gate", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["freshness:runnable-embeds"]).toBe("tsc --outDir .tmp-build && node scripts/runnable-embeds-freshness.js");
    expect(pkg.scripts["generate:runnable-embeds"]).toContain("node scripts/generate-runnable-embeds.js");
    // The ubuntu gate block is located by the one authority, scripts/ci-workflow.testkit.ts.
    const commands = ubuntuBlockCommands(ciWorkflow());
    expect(commands.filter((c) => c === "npm run freshness:runnable-embeds"), "one command line in the ubuntu gate block").toHaveLength(1);
    expect(commands.indexOf("npm run freshness:runnable-embeds")).toBeGreaterThan(commands.indexOf("npm run freshness:hook-manifest"));
  });
});
