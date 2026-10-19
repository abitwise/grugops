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
// THE ENTRY SET IS DERIVED: the generator's own renderedEntryRels(), which is the kinds with a non-null ENTRY_SHAPES
// value, each placed at its single ROUTE_POINTERS path, then each registry row's launchAgent (quick task 261018-hs8),
// with the count asserted and checked against both registry sources.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { HOST_ADAPTER_KINDS, HOST_TOOLS, KIT_ROUTE, LAUNCH_AGENT_NAME, PI_REFUSED_RELS, POINTER_LINE, ROUTE_POINTERS, START_HERE_SENTENCE, type HostAdapterKind } from "../install/host-tools.js";
import {
  ENTRY_DESCRIPTION,
  ENTRY_SHAPES,
  LAUNCH_SHAPES,
  OVERWRITE_FLAG,
  TEMPLATE_REL,
  frontmatterProblem,
  launchShapeProblem,
  pathProblem,
  renderAll,
  renderEntry,
  renderedEntryRels,
  templateProblem,
  type EntryShape,
} from "./generate-host-entries.js";
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
const KIND_RELS: readonly string[] = RENDERED_KINDS.map((k) => {
  expect(ROUTE_POINTERS[k].length, `premise: ${k} has exactly one ROUTE_POINTERS path`).toBe(1);
  return ROUTE_POINTERS[k][0];
});
/** The registry rows with a launch agent (quick task 261018-hs8), read from the registry data. */
const LAUNCH_ROWS = HOST_TOOLS.filter((h) => h.launchAgent !== null);
/** Every rendered path: the generator's own list (renderedEntryRels), checked below against KIND_RELS and LAUNCH_ROWS. */
const ENTRY_RELS: readonly string[] = renderedEntryRels();
/** The pinned count (plan 34.1-01: the agent skill, the OpenCode command, the Pi prompt template).
 *  3 -> 4 on 2026-10-18 (quick task 261018-hs8, Task 1): Antigravity CLI's launch agent `.agents/agents/grugops-orchestrator.md`.
 *  4 -> 7 on 2026-10-18 (quick task 261018-hs8, Task 2): the launch agents of OpenCode, Copilot CLI and Pi (Codex CLI
 *  has none). */
const ENTRY_COUNT = 7;

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
  it(`the generator renders ${ENTRY_COUNT} entries: the kind entries at their ROUTE_POINTERS paths, then each row's launch agent; none under .gemini/ (D-20)`, () => {
    expect(ENTRY_RELS.length).toBe(ENTRY_COUNT);
    expect(RENDERED_KINDS.length + LAUNCH_ROWS.length, "kind entries plus launch agents").toBe(ENTRY_COUNT);
    expect(new Set(ENTRY_RELS).size).toBe(ENTRY_COUNT);
    expect([...ENTRY_RELS], "renderedEntryRels is the kind entries, then the launch agents in registry order").toEqual([
      ...KIND_RELS,
      ...LAUNCH_ROWS.map((h) => h.launchAgent!),
    ]);
    const pointers = new Set(Object.values(ROUTE_POINTERS).flat());
    for (const rel of KIND_RELS) expect(pointers.has(rel), `${rel} is not a ROUTE_POINTERS value`).toBe(true);
    for (const h of LAUNCH_ROWS) expect(pointers.has(h.launchAgent!), `${h.launchAgent} is a ROUTE_POINTERS value (it must be per row)`).toBe(false);
    for (const rel of ENTRY_RELS) expect(rel.startsWith(".gemini/"), rel).toBe(false);
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
    const shaped: Array<readonly [string, EntryShape]> = [
      ...RENDERED_KINDS.flatMap((kind): Array<readonly [string, EntryShape]> => {
        const shape = ENTRY_SHAPES[kind];
        return shape === null ? [] : [[ROUTE_POINTERS[kind][0], shape] as const];
      }),
      ...LAUNCH_ROWS.map((h) => [h.launchAgent!, LAUNCH_SHAPES[h.id]] as const),
    ];
    for (const [rel, shape] of shaped) {
      expect(shape, `premise: ${rel} has a shape`).toBeDefined();
      const text = readFileSync(join(ROOT, rel), "utf8");
      if (shape.frontmatter.length === 0) {
        expect(text, `${rel}: an empty frontmatter renders as the pointer line alone`).toBe(`${POINTER_LINE}\n`);
        seen += 1;
        continue;
      }
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

// ── THE LAUNCH AGENTS (quick task 261018-hs8, D-01, D-04, D-05) ──────────────────────────────────────────────────────
describe("generate-host-entries: launch agents (quick task 261018-hs8)", () => {
  const shape = (frontmatter: ReadonlyArray<readonly [string, string]>): EntryShape => ({ frontmatter, argumentsLine: false });

  it("LAUNCH_SHAPES is keyed by exactly the registry rows with a launchAgent (two-sided), and the committed shapes pass", () => {
    expect(Object.keys(LAUNCH_SHAPES).sort()).toEqual(LAUNCH_ROWS.map((h) => h.id).sort());
    expect(launchShapeProblem(LAUNCH_SHAPES, HOST_TOOLS)).toBeNull();
  });

  it("launchShapeProblem names a planted extra key and a planted missing key", () => {
    const extra = { ...LAUNCH_SHAPES, codex: shape([["name", LAUNCH_AGENT_NAME]]) };
    const extraWhy = launchShapeProblem(extra, HOST_TOOLS);
    expect(extraWhy, "an extra key is accepted").not.toBeNull();
    expect(extraWhy!).toContain("codex");
    expect(extraWhy!).toContain("extra");
    const missingId = LAUNCH_ROWS[0].id;
    const missing: Record<string, EntryShape> = { ...LAUNCH_SHAPES };
    delete missing[missingId];
    const missingWhy = launchShapeProblem(missing, HOST_TOOLS);
    expect(missingWhy, "a missing key is accepted").not.toBeNull();
    expect(missingWhy!).toContain(missingId);
    expect(missingWhy!).toContain("missing");
    // Both at once: both are named.
    const both = launchShapeProblem({ ...missing, codex: shape([]) }, HOST_TOOLS);
    expect(both!).toContain("extra");
    expect(both!).toContain("missing");
  });

  const FM_REFUSALS: ReadonlyArray<{ readonly name: string; readonly value: string; readonly says: string }> = [
    { name: "a newline", value: "one\ntwo", says: "line break" },
    { name: "a carriage return", value: "one\rtwo", says: "line break" },
    { name: "a colon followed by a space", value: "key: value", says: "colon followed by a space" },
    { name: "a space followed by #", value: "text #comment", says: "space followed by #" },
    { name: "an exclamation mark followed by a backtick", value: "run !`ls`", says: "exclamation mark followed by a backtick" },
    { name: "an at-sign followed by a non-space character", value: "see @notes.md", says: "at-sign followed by a non-space character" },
    // Quick task 261019-mq1 (261018-hs8 review IN-11): the canonical form. A value that starts with anything but a
    // letter or a digit, and is not a well-formed double-quoted string, is refused; so are a malformed quoted string,
    // a plain value ending with a colon or with whitespace, and a colon or `#` next to whitespace other than a space.
    ...["-", "?", ":", ",", "[", "]", "{", "}", "#", "&", "*", "!", "|", ">", "'", "%", "@", "`"].map((c) => ({
      name: `a leading ${c}`,
      value: `${c}value`,
      says: "does not start with a letter or a digit",
    })),
    { name: "a leading space", value: " value", says: "does not start with a letter or a digit" },
    { name: "the empty value", value: "", says: "does not start with a letter or a digit" },
    { name: "an unterminated double quote", value: '"unterminated', says: "double-quoted string that is not well formed" },
    { name: "a quote inside a double-quoted string", value: '"a"b"', says: "double-quoted string that is not well formed" },
    { name: "a backslash inside a double-quoted string", value: '"a\\b"', says: "double-quoted string that is not well formed" },
    { name: "a trailing colon", value: "value:", says: "ends with a colon" },
    { name: "a trailing space", value: "value ", says: "ends with whitespace" },
    { name: "a colon followed by a tab", value: "key:\tvalue", says: "colon followed by a space or other whitespace" },
    { name: "a tab followed by #", value: "text\t#comment", says: "whitespace followed by #" },
  ];
  // Re-pinned 2026-10-19 by quick task 261019-mq1 (261018-hs8 review IN-11): 6 -> 33, the canonical-form rows (18
  // leading characters, a leading space, the empty value, 3 malformed quoted strings, a trailing colon, a trailing
  // space, a colon then a tab, a tab then #). No row was removed.
  it(`the frontmatter refusal table has ${FM_REFUSALS.length} rows`, () => expect(FM_REFUSALS.length).toBe(33));
  for (const c of FM_REFUSALS) {
    it(`frontmatterProblem refuses a value holding ${c.name}`, () => {
      const why = frontmatterProblem(shape([["description", c.value]]));
      expect(why, `${JSON.stringify(c.value)} is accepted`).not.toBeNull();
      expect(why!).toContain(c.says);
    });
  }
  it("frontmatterProblem refuses a key that is not a plain key, and accepts every committed shape and the plain values", () => {
    expect(frontmatterProblem(shape([["bad key", "x"]]))).toContain("not a plain key");
    expect(frontmatterProblem(shape([["a:b", "x"]]))).toContain("not a plain key");
    expect(frontmatterProblem(shape([["description", "a colon:without a space, an at-sign alone @ here"]]))).toBeNull();
    // Quick task 261019-mq1 (review IN-11): the accept controls of the canonical form, the committed value shapes.
    for (const v of ['"<request>"', ENTRY_DESCRIPTION, "true", "primary", LAUNCH_AGENT_NAME, "grugops-orchestrator", "2.0"]) {
      expect(frontmatterProblem(shape([["description", v]])), JSON.stringify(v)).toBeNull();
    }
    expect(frontmatterProblem(shape([]))).toBeNull();
    for (const k of HOST_ADAPTER_KINDS) {
      const s = ENTRY_SHAPES[k];
      if (s !== null) expect(frontmatterProblem(s), k).toBeNull();
    }
    for (const [id, s] of Object.entries(LAUNCH_SHAPES)) expect(frontmatterProblem(s), id).toBeNull();
  });

  it("renderEntry with an empty frontmatter emits no `---` line: the pointer line and its newline only", () => {
    const text = renderEntry(shape([]), POINTER_LINE);
    expect(text).toBe(`${POINTER_LINE}\n`);
    expect(text.split("\n")).not.toContain("---");
    // A non-empty frontmatter still gets both fences.
    expect(renderEntry(shape([["name", "x"]]), POINTER_LINE)).toBe(`---\nname: x\n---\n${POINTER_LINE}\n`);
  });

  it("the Antigravity CLI launch agent renders name, description, mainAgent: true, subagent: false, in that order, then POINTER_LINE and no arguments line", () => {
    const agy = HOST_TOOLS.find((h) => h.id === "antigravity");
    expect(agy?.launchAgent, "premise: Antigravity CLI has a launch agent").toBe(`.agents/agents/${LAUNCH_AGENT_NAME}.md`);
    const committed = readFileSync(join(ROOT, agy!.launchAgent!), "utf8");
    expect(committed).toBe(
      ["---", `name: ${LAUNCH_AGENT_NAME}`, `description: ${ENTRY_DESCRIPTION}`, "mainAgent: true", "subagent: false", "---", POINTER_LINE, ""].join("\n"),
    );
    expect(committed).not.toContain("$ARGUMENTS");
    expect(committed).toContain(KIT_ROUTE);
  });

  /** The committed launch file of registry row `id`, read through the registry (never a typed path). */
  const launchText = (id: string): { readonly rel: string; readonly text: string } => {
    const h = HOST_TOOLS.find((x) => x.id === id);
    expect(h?.launchAgent, `premise: ${id} has a launch agent`).toBeTruthy();
    return { rel: h!.launchAgent!, text: readFileSync(join(ROOT, h!.launchAgent!), "utf8") };
  };

  it("D-01: every launch shape that writes `name` writes LAUNCH_AGENT_NAME, and no launch shape writes another name", () => {
    let named = 0;
    for (const [id, s] of Object.entries(LAUNCH_SHAPES)) {
      for (const [k, v] of s.frontmatter) {
        if (k !== "name") continue;
        expect(v, id).toBe(LAUNCH_AGENT_NAME);
        named += 1;
      }
      expect(s.argumentsLine, `${id}: a launch agent gets no arguments line`).toBe(false);
    }
    expect(named, "antigravity and copilot write `name`").toBe(2);
  });

  it("the OpenCode launch agent renders description, then mode: primary, then POINTER_LINE and no arguments line", () => {
    const { rel, text } = launchText("opencode");
    expect(rel.startsWith(".opencode/agents/"), rel).toBe(true);
    expect(text).toBe(["---", `description: ${ENTRY_DESCRIPTION}`, "mode: primary", "---", POINTER_LINE, ""].join("\n"));
    expect(text).not.toContain("$ARGUMENTS");
  });

  it("the Copilot CLI launch agent renders name, then description, at a path under .github/agents/ ending .agent.md", () => {
    const { rel, text } = launchText("copilot");
    expect(rel.startsWith(".github/agents/"), rel).toBe(true);
    expect(rel.endsWith(".agent.md"), rel).toBe(true);
    expect(text).toBe(["---", `name: ${LAUNCH_AGENT_NAME}`, `description: ${ENTRY_DESCRIPTION}`, "---", POINTER_LINE, ""].join("\n"));
    // Left unset because their effect on the CLI is UNKNOWN - verify (RESEARCH Host Formats).
    for (const k of ["tools", "target", "disable-model-invocation"]) expect(text).not.toMatch(new RegExp(`^${k}:`, "m"));
  });

  it("the Pi launch file is exactly POINTER_LINE and one newline, with no `---` line (Pi appends it verbatim, D-05)", () => {
    const { rel, text } = launchText("pi");
    expect(rel.startsWith(".pi/"), rel).toBe(true);
    expect(text).toBe(`${POINTER_LINE}\n`);
    expect(text.split("\n")).not.toContain("---");
    expect(LAUNCH_SHAPES["pi"].frontmatter).toHaveLength(0);
  });

  // Quick task 261019-mq1 (261018-hs8 review IN-05): the drift owner of a launch file is `<id> <noun>`, the noun the
  // row's LaunchForm gives; Pi's file is a launch file. The expected owners are literals.
  it("renderAll names each launch file's owner with its row's noun: `pi launch file`, the other launch rows `launch agent`", () => {
    const r = renderAll(POINTER_LINE);
    expect("entries" in r, JSON.stringify(r)).toBe(true);
    if (!("entries" in r)) return;
    const owners = Object.fromEntries(r.entries.filter((e) => LAUNCH_ROWS.some((h) => h.launchAgent === e.rel)).map((e) => [e.rel, e.owner]));
    expect(owners).toEqual({
      [`.agents/agents/${LAUNCH_AGENT_NAME}.md`]: "antigravity launch agent",
      [`.opencode/agents/${LAUNCH_AGENT_NAME}.md`]: "opencode launch agent",
      [`.github/agents/${LAUNCH_AGENT_NAME}.agent.md`]: "copilot launch agent",
      [`.pi/${LAUNCH_AGENT_NAME}.md`]: "pi launch file",
    });
  });

  // Quick task 261019-mq1 (261018-hs8 review IN-01): the one path check refuses Pi's own files in any letter case,
  // naming the list, and accepts every committed path.
  it("pathProblem refuses `.pi/SYSTEM.md`, `.pi/APPEND_SYSTEM.md` and `.pi/settings.json` in any letter case, naming them, and accepts every rendered path (261019-mq1, review IN-01)", () => {
    for (const rel of [".pi/SYSTEM.md", ".pi/system.md", ".PI/APPEND_SYSTEM.MD", ".pi/Settings.JSON"]) {
      const why = pathProblem("a planted owner", rel);
      expect(why, `${rel} is accepted`).not.toBeNull();
      for (const r of PI_REFUSED_RELS) expect(why!, rel).toContain(r);
    }
    for (const rel of [`.pi/${LAUNCH_AGENT_NAME}.md`, ".pi/prompts/grugops.md", ".pi/SYSTEM.md.bak"]) expect(pathProblem("a control", rel), rel).toBeNull();
    for (const rel of renderedEntryRels()) expect(pathProblem("a committed entry", rel), rel).toBeNull();
  });

  it("a mirror whose committed launch agent was removed halts naming its owner (`antigravity launch agent`)", () => {
    const m = mirror();
    const rel = LAUNCH_ROWS[0].launchAgent!;
    rmSync(join(m, rel));
    const r = runGen(m);
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stderr).toContain(`${rel} (${LAUNCH_ROWS[0].id} launch agent) is absent`);
  });
});
