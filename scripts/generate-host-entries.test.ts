// generate-host-entries.test.ts — the one renderer of the non-Claude host entries (phase 34.1, plan 34.1-01; D-08,
// D-09, D-10, D-11, D-20, D-21; T-34.1-02).
//
// Drives the COMMITTED compiled artifact scripts/generate-host-entries.js as a child process, because the committed
// output is what continuous integration runs. EVERY PLANT LANDS IN A HERMETIC MIRROR, never in the committed tree: the
// generator honors no root override (its paths are fixed literals joined to its own location, ASVS V12), so each case
// builds a temp mirror carrying the generator's compiled import closure, the template and the committed entries, and
// runs the mirrored copy. The mirror root gets a `{"type":"module"}` package.json so Node reads the copied `.js` as
// ES modules without a typeless-package warning on stderr.
//
// THE ENTRY SET IS DERIVED: the kinds with a non-null ENTRY_SHAPES value, each placed at its single ROUTE_POINTERS
// path, with the count asserted.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { HOST_ADAPTER_KINDS, KIT_ROUTE, POINTER_LINE, ROUTE_POINTERS, START_HERE_SENTENCE, type HostAdapterKind } from "../install/host-tools.js";
import { ENTRY_SHAPES, OVERWRITE_FLAG, TEMPLATE_REL, templateProblem } from "./generate-host-entries.js";
import { parseFrontmatter } from "./frontmatter.js";

const ROOT = join(import.meta.dirname, "..");
const SCRATCH = mkdtempSync(join(tmpdir(), "grugops-host-entries-gen-"));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

/** The generator's compiled import closure, as paths relative to the repository root. One file short and the mirrored
 *  generator cannot resolve an import and exits non-zero, which every case below would see. */
const CLOSURE = ["scripts/generate-host-entries.js", "scripts/is-entry.js", "install/host-tools.js"];

/** The kinds the generator renders, derived from ENTRY_SHAPES in HOST_ADAPTER_KINDS order. */
const RENDERED_KINDS: readonly HostAdapterKind[] = HOST_ADAPTER_KINDS.filter((k) => ENTRY_SHAPES[k] !== null);
/** Each rendered kind's output path: the single ROUTE_POINTERS entry of the kind. */
const ENTRY_RELS: readonly string[] = RENDERED_KINDS.map((k) => {
  expect(ROUTE_POINTERS[k].length, `premise: ${k} has exactly one ROUTE_POINTERS path`).toBe(1);
  return ROUTE_POINTERS[k][0];
});
/** The pinned count (plan 34.1-01: the agent skill, the OpenCode command, the Pi prompt template). */
const ENTRY_COUNT = 3;

let n = 0;
/** A hermetic mirror: the closure, the template, and (unless `entries` is false) the committed entries. */
function mirror(opts: { readonly entries?: boolean; readonly template?: string } = {}): string {
  const m = join(SCRATCH, `m${n++}`);
  for (const rel of CLOSURE) {
    mkdirSync(dirname(join(m, rel)), { recursive: true });
    cpSync(join(ROOT, rel), join(m, rel));
  }
  writeFileSync(join(m, "package.json"), '{ "type": "module" }\n');
  mkdirSync(dirname(join(m, TEMPLATE_REL)), { recursive: true });
  if (opts.template === undefined) cpSync(join(ROOT, TEMPLATE_REL), join(m, TEMPLATE_REL));
  else writeFileSync(join(m, TEMPLATE_REL), opts.template);
  if (opts.entries !== false) {
    for (const rel of ENTRY_RELS) {
      mkdirSync(dirname(join(m, rel)), { recursive: true });
      cpSync(join(ROOT, rel), join(m, rel));
    }
  }
  return m;
}

function runGen(m: string, args: readonly string[] = []): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [join(m, "scripts", "generate-host-entries.js"), ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Every entry path's bytes in `m` (null when absent). */
const entryBytes = (m: string): Map<string, string | null> =>
  new Map(ENTRY_RELS.map((rel) => [rel, existsSync(join(m, rel)) ? readFileSync(join(m, rel), "utf8") : null]));

describe("generate-host-entries (plan 34.1-01, D-11)", () => {
  it(`the generator renders ${ENTRY_COUNT} entries, each at a ROUTE_POINTERS path, none under .gemini/ (D-20)`, () => {
    expect(RENDERED_KINDS.length).toBe(ENTRY_COUNT);
    expect(new Set(ENTRY_RELS).size).toBe(ENTRY_COUNT);
    const pointers = new Set(Object.values(ROUTE_POINTERS).flat());
    for (const rel of ENTRY_RELS) {
      expect(pointers.has(rel), `${rel} is not a ROUTE_POINTERS value`).toBe(true);
      expect(rel.startsWith(".gemini/"), rel).toBe(false);
    }
  });

  it("a clean mirror exits 0, names every entry already identical, and changes nothing", () => {
    const m = mirror();
    const before = entryBytes(m);
    const r = runGen(m);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(`rendered ${ENTRY_COUNT} entr(ies) from ${TEMPLATE_REL}, 0 written, ${ENTRY_COUNT} already identical`);
    expect(entryBytes(m)).toEqual(before);
  });

  it("the committed entries equal a fresh render byte for byte (the real tree, verify-only)", () => {
    const r = spawnSync(process.execPath, [join(ROOT, "scripts", "generate-host-entries.js")], { encoding: "utf8" });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(`0 written, ${ENTRY_COUNT} already identical`);
  });

  for (const rel of ENTRY_RELS) {
    it(`a one-byte edit to ${rel} halts with exit 1 naming it and leaves it unchanged; ${OVERWRITE_FLAG} restores it`, () => {
      const m = mirror();
      const committed = readFileSync(join(ROOT, rel), "utf8");
      const edited = committed.replace("grugops:", "grugops;");
      expect(edited, "premise: the edit changes the file").not.toBe(committed);
      writeFileSync(join(m, rel), edited);
      const r = runGen(m);
      expect(r.status, r.stdout + r.stderr).toBe(1);
      expect(r.stderr).toContain(rel);
      expect(r.stderr).toContain("nothing was written");
      expect(readFileSync(join(m, rel), "utf8")).toBe(edited);
      const o = runGen(m, [OVERWRITE_FLAG]);
      expect(o.status, o.stdout + o.stderr).toBe(0);
      expect(readFileSync(join(m, rel), "utf8")).toBe(committed);
    });

    it(`an absent ${rel} halts with exit 1 naming it, nothing is written; ${OVERWRITE_FLAG} writes the committed bytes`, () => {
      const m = mirror();
      rmSync(join(m, rel));
      const r = runGen(m);
      expect(r.status, r.stdout + r.stderr).toBe(1);
      expect(r.stderr).toContain(`${rel} (`);
      expect(existsSync(join(m, rel))).toBe(false);
      const o = runGen(m, [OVERWRITE_FLAG]);
      expect(o.status, o.stdout + o.stderr).toBe(0);
      expect(readFileSync(join(m, rel), "utf8")).toBe(readFileSync(join(ROOT, rel), "utf8"));
    });
  }

  // The four template refusals (D-11, T-34.1-02). Each runs WITH the overwrite flag in a mirror holding no entries, so
  // a refusal that came after the write would leave a file behind.
  const REFUSALS: ReadonlyArray<{ readonly name: string; readonly body: string; readonly says: string }> = [
    { name: "a body that differs from POINTER_LINE", body: `${POINTER_LINE} And more.`, says: "is not POINTER_LINE" },
    { name: "a body without KIT_ROUTE", body: START_HERE_SENTENCE, says: "does not carry KIT_ROUTE" },
    { name: "a body with the backtick-bang sequence", body: `${POINTER_LINE} !\`ls\``, says: "exclamation mark followed by a backtick" },
    { name: "a body with an at-sign before a letter", body: `${POINTER_LINE} @notes.md`, says: "at-sign followed by a non-space character" },
  ];
  it(`the refusal table has 4 rows`, () => expect(REFUSALS.length).toBe(4));
  for (const c of REFUSALS) {
    it(`${c.name} exits 1 and writes nothing, even under ${OVERWRITE_FLAG}`, () => {
      expect(templateProblem(c.body), "the pure check refuses it").toContain(c.says);
      const m = mirror({ entries: false, template: `${c.body}\n` });
      const r = runGen(m, [OVERWRITE_FLAG]);
      expect(r.status, r.stdout + r.stderr).toBe(1);
      expect(r.stderr).toContain(c.says);
      expect(r.stderr).toContain("Nothing was written");
      for (const rel of ENTRY_RELS) expect(existsSync(join(m, rel)), rel).toBe(false);
    });
  }

  it("the committed template body is accepted by the same check (it is POINTER_LINE and carries KIT_ROUTE)", () => {
    const raw = readFileSync(join(ROOT, TEMPLATE_REL), "utf8");
    expect(raw).toBe(`${POINTER_LINE}\n`);
    expect(templateProblem(raw.slice(0, -1))).toBeNull();
    expect(raw).toContain(KIT_ROUTE);
  });

  it("an unknown argument exits 1 and names it", () => {
    const m = mirror();
    const r = runGen(m, ["--out", "x"]);
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stderr).toContain('unrecognised argument "--out"');
  });

  it("every committed entry's frontmatter keys, parsed by scripts/frontmatter.ts, are its shape's keys in order", () => {
    let seen = 0;
    for (const kind of RENDERED_KINDS) {
      const shape = ENTRY_SHAPES[kind];
      if (shape === null) continue;
      const rel = ROUTE_POINTERS[kind][0];
      const text = readFileSync(join(ROOT, rel), "utf8");
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, `${rel}: ${parsed.ok ? "" : parsed.reason}`).toBe(true);
      if (!parsed.ok) continue;
      expect([...parsed.value.keys()], rel).toEqual(shape.frontmatter.map(([k]) => k));
      for (const [k] of shape.frontmatter) expect(parsed.value.get(k)?.length, `${rel}: ${k}`).toBe(1);
      expect(text.includes(POINTER_LINE), `${rel} carries POINTER_LINE`).toBe(true);
      expect(text.includes("$ARGUMENTS"), `${rel}: $ARGUMENTS present exactly when the shape says so`).toBe(shape.argumentsLine);
      seen += 1;
    }
    expect(seen).toBe(ENTRY_COUNT);
  });

  it("the agent-skill entry has name `grugops` and no $ARGUMENTS (D-21: neither Codex nor Antigravity documents it for skills)", () => {
    const rel = ROUTE_POINTERS["agent-skill"][0];
    const text = readFileSync(join(ROOT, rel), "utf8");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.get("name")).toEqual(["grugops"]);
    expect(text).not.toContain("$ARGUMENTS");
  });
});
