// host-entries-freshness.test.ts — behavioural oracle for the generated host-entry freshness gate (phase 34.1,
// plan 34.1-02; D-11, D-20).
//
// Drives the COMMITTED compiled artifact scripts/host-entries-freshness.js as a child process (never the .ts)
// and asserts the exit-code-as-signal contract:
//   exit 0 = every committed entry equals a fresh regeneration, byte for byte and member for member
//   exit 1 = drift (bytes, an extra or a missing member, the refuted .gemini/skills path), OR the regeneration
//            itself did not run cleanly
//
// EVERY PLANT LANDS IN A HERMETIC MIRROR, never in the committed tree. The gate honours CHECK_ROOT for the
// judged tree, so each case builds its own realpath'd temp mirror of the kit inputs (the pointer file and the
// committed entries), mutates that, and points the gate at it. The mirror's entry paths are DERIVED from the
// generator's own exports (renderedEntryRels, which is the ENTRY_SHAPES kinds at outputRel, then each registry row's
// launch agent, quick task 261018-hs8), never typed here, and their count is asserted.
// Vitest globals:false, so everything is imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { ENTRY_SHAPES, TEMPLATE_REL, outputRel, renderedEntryRels } from "./generate-host-entries.js";
import { AGENT_SKILL_REL, ANTIGRAVITY_AGENT_REL, HOST_ADAPTER_KINDS, HOST_TOOLS, OPENCODE_COMMAND_REL, PI_PROMPT_REL } from "../install/host-tools.js";
// The one authority over "where is the ubuntu gate block and what does it run" (plan 29.1-24).
import { ciWorkflow, ubuntuBlockCommands } from "./ci-workflow.testkit.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "host-entries-freshness.js");
const at = (root: string, rel: string): string => join(root, ...rel.split("/"));

// The gate's temp-mirror prefix, RECOVERED from the committed .js rather than restated, so the leftover
// assertion cannot become vacuous when the gate renames its directory (the skill-twins idiom).
const GATE_TMP_PREFIX = ((): string => {
  const m = readFileSync(GATE_JS, "utf8").match(/mkdtempSync\(join\(tmpdir\(\),\s*"([^"]+)"\)\)/);
  if (m === null) throw new Error("scripts/host-entries-freshness.js: could not recover the temp-mirror prefix");
  return m[1];
})();
const gateTempEntries = (): string[] => readdirSync(tmpdir()).filter((n) => n.startsWith(GATE_TMP_PREFIX));

// The rendered entry paths, derived from the generator: its renderedEntryRels(), checked in the PREMISE case against
// the kinds with a frontmatter shape (at the one ROUTE_POINTERS path outputRel answers for each), then each registry
// row's launchAgent, read from the registry data.
const ENTRY_RELS: readonly string[] = renderedEntryRels();
const KIND_RELS: readonly string[] = HOST_ADAPTER_KINDS.filter((k) => ENTRY_SHAPES[k] !== null).map((k) => {
  const o = outputRel(k);
  if ("problem" in o) throw new Error(o.problem);
  return o.rel;
});
const LAUNCH_RELS: readonly string[] = HOST_TOOLS.flatMap((h) => (h.launchAgent === null ? [] : [h.launchAgent]));
// 3 -> 4 on 2026-10-18 (quick task 261018-hs8, Task 1): Antigravity CLI's launch agent joined the rendered set.
const ENTRY_COUNT = 4;

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

function scratch(prefix: string): string {
  const d = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  tmpDirs.push(d);
  return d;
}

// A hermetic kit mirror: the pointer file and every committed entry, copied from the committed tree.
function mirror(): string {
  const m = scratch("grugops-host-entries-test-");
  for (const rel of [TEMPLATE_REL, ...ENTRY_RELS]) {
    mkdirSync(dirname(at(m, rel)), { recursive: true });
    cpSync(at(ROOT, rel), at(m, rel));
  }
  return m;
}

// Spawn a gate. With no kit root it judges the real tree; with one it judges that mirror.
function runGate(kitRoot?: string, gateJs: string = GATE_JS) {
  const env = { ...process.env };
  if (kitRoot) env.CHECK_ROOT = kitRoot;
  else delete env.CHECK_ROOT;
  return spawnSync(process.execPath, [gateJs], { cwd: ROOT, encoding: "utf8", env });
}

const FRESH_MARKER = "Host entries fresh:";

describe("host-entries-freshness.js — the derived entry set", () => {
  it(`PREMISE: the generator renders exactly the ${ENTRY_COUNT} whole-file entries (the kind entries, then each launch agent), Codex CLI's skill and Antigravity CLI's launch agent among them`, () => {
    expect(ENTRY_RELS.length).toBe(ENTRY_COUNT);
    expect([...ENTRY_RELS]).toEqual([...KIND_RELS, ...LAUNCH_RELS]);
    expect(ENTRY_RELS).toContain(AGENT_SKILL_REL);
    expect(ENTRY_RELS).toContain(ANTIGRAVITY_AGENT_REL);
  });
});

// ── THE GATE IS PROVEN ABLE TO FAIL ─────────────────────────────────────────────────────────────────────
// One mirror, reused across P0 and P1 in that order, so the control and the plant are measured on THE SAME
// tree. P0 fixes the baseline at exit 0; every red after it is the plant's.
describe("host-entries-freshness.js — fail-proofs (the byte gate goes red, and for the right reason)", () => {
  const m = mirror();
  const victim = at(m, AGENT_SKILL_REL);
  let controlStatus: number | null = null;

  it(`P0 (premise control, recorded first): the unmutated mirror exits 0 with ${ENTRY_COUNT} compared and zero differences`, () => {
    const r = runGate(m);
    controlStatus = r.status;
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(`${FRESH_MARKER} ${ENTRY_COUNT} entries compared, 0 byte difference(s), entry set equal.`);
  });

  it("P1 (one-byte drift in the Codex CLI entry): non-zero, names the path, and prints no verdict line", () => {
    expect(controlStatus, "P0 must run first and exit 0").toBe(0);
    const before = readFileSync(victim);
    const idx = before.length - 2;
    const after = Buffer.from(before);
    after[idx] = before[idx] === 0x41 ? 0x42 : 0x41;
    writeFileSync(victim, after);

    // The plant landed: same length, exactly one byte different.
    const reread = readFileSync(victim);
    expect(reread.length).toBe(before.length);
    expect([...reread].filter((b, i) => b !== before[i]).length).toBe(1);

    const tempBefore = gateTempEntries();
    const r = runGate(m);
    expect(gateTempEntries().filter((n) => !tempBefore.includes(n)), "the gate left its temp mirror behind").toEqual([]);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain(`STALE: ${AGENT_SKILL_REL} — the committed entry differs from a fresh regeneration`);
    expect(r.stdout).not.toContain(FRESH_MARKER);

    // Restored, the same mirror goes green again: the red was the plant's, not the mirror's.
    writeFileSync(victim, before);
    const back = runGate(m);
    expect(back.status).toBe(0);
    expect(back.stdout).toContain(FRESH_MARKER);
  });
});

// ── THE SET HALF, THE REFUTED PATH, A BROKEN REGENERATION, NO LEFTOVERS, BOTH-ENDS WIRING ───────────────
describe("host-entries-freshness.js — set half, refuted path, fail-closed, wiring", () => {
  // Every red below also asserts the gate left no temp mirror behind (a set difference over the gate's
  // own prefix, so a concurrently running gate cannot influence it).
  function runRed(kitRoot: string, gateJs?: string) {
    const before = gateTempEntries();
    const r = runGate(kitRoot, gateJs);
    expect(gateTempEntries().filter((n) => !before.includes(n)), "the gate left its temp mirror behind").toEqual([]);
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    return r;
  }

  it("EXTRA: a file planted in an entry directory the generator does not write into is named", () => {
    const m = mirror();
    const orphan = `${dirname(OPENCODE_COMMAND_REL)}/other.md`;
    writeFileSync(at(m, orphan), "---\ndescription: not generated\n---\nhand-made\n");
    const r = runRed(m);
    expect(r.stdout).toContain(`STALE: ${orphan} — EXTRA`);
  });

  it("EXTRA, nested: a file in a subdirectory of an entry directory is named by its full relative path", () => {
    const m = mirror();
    const nested = `${dirname(AGENT_SKILL_REL)}/references/extra.md`;
    mkdirSync(dirname(at(m, nested)), { recursive: true });
    writeFileSync(at(m, nested), "hand-made\n");
    const r = runRed(m);
    expect(r.stdout).toContain(`STALE: ${nested} — EXTRA`);
  });

  it("MISSING: a deleted Pi prompt template is named", () => {
    const m = mirror();
    unlinkSync(at(m, PI_PROMPT_REL));
    const r = runRed(m);
    expect(r.stdout).toContain(`STALE: ${PI_PROMPT_REL} — MISSING`);
  });

  it("D-20 refuted path: a committed .gemini/skills/grugops/SKILL.md is named and refused", () => {
    const m = mirror();
    const refuted = ".gemini/skills/grugops/SKILL.md";
    mkdirSync(dirname(at(m, refuted)), { recursive: true });
    // The plant is a byte copy of the shared entry: the refusal is about the path, not the content.
    cpSync(at(ROOT, AGENT_SKILL_REL), at(m, refuted));
    const r = runRed(m);
    expect(r.stdout).toContain(`STALE: ${refuted} — refuted by antigravity.google/docs/cli/gcli-migration/ (Antigravity reads .agents/skills/); remove it`);
  });

  it("D-20 refuted path, empty directory: an empty .gemini/skills/grugops directory is named itself", () => {
    const m = mirror();
    mkdirSync(at(m, ".gemini/skills/grugops"), { recursive: true });
    const r = runRed(m);
    expect(r.stdout).toContain("STALE: .gemini/skills/grugops — refuted by");
  });

  it("a link at an entry path is never read through: named as not a regular file", () => {
    const m = mirror();
    const target = at(m, "elsewhere.md");
    cpSync(at(ROOT, OPENCODE_COMMAND_REL), target);
    unlinkSync(at(m, OPENCODE_COMMAND_REL));
    symlinkSync(target, at(m, OPENCODE_COMMAND_REL));
    const r = runRed(m);
    expect(r.stdout).toContain(`STALE: ${OPENCODE_COMMAND_REL} — the committed entry is not a regular file`);
  });

  it("broken regeneration (pointer file edited by hand): the generator's refusal is carried through, never fresh", () => {
    const m = mirror();
    writeFileSync(at(m, TEMPLATE_REL), "grugops: a hand-edited pointer line with no kit route.\n");
    const r = runRed(m);
    expect(r.stdout).toContain("did not run cleanly");
    expect(r.stderr).toContain(TEMPLATE_REL);
  });

  it("broken regeneration (an import the mirror closure omits): the mirrored generator cannot load, the gate goes red", () => {
    // A script root of its own: the committed gate, the generator closure and a package.json. Its generator is
    // rewritten to import the registry under a second name the gate's hand-written closure does not mirror. The
    // gate itself still loads (the second name exists beside it), so the only thing that can fail is the child,
    // which is the loud failure direction the closure's recorded trade-off relies on.
    const fake = scratch("grugops-host-entries-fakeroot-");
    for (const rel of ["scripts/host-entries-freshness.js", "scripts/generate-host-entries.js", "scripts/is-entry.js", "install/host-tools.js"]) {
      mkdirSync(dirname(at(fake, rel)), { recursive: true });
      cpSync(at(ROOT, rel), at(fake, rel));
    }
    writeFileSync(at(fake, "package.json"), '{ "type": "module" }\n');
    const fakeGate = at(fake, "scripts/host-entries-freshness.js");
    const m = mirror();

    // PREMISE: the fake script root, unmutated, is green on the same mirror.
    const control = runGate(m, fakeGate);
    expect(control.status, control.stdout + control.stderr).toBe(0);
    expect(control.stdout).toContain(FRESH_MARKER);

    const gen = at(fake, "scripts/generate-host-entries.js");
    const src = readFileSync(gen, "utf8");
    const moved = src.split('"../install/host-tools.js"').join('"../install/host-tools-moved.js"');
    expect(moved, "PREMISE: the generator's registry import must be present to rewrite").not.toBe(src);
    writeFileSync(gen, moved);
    cpSync(at(fake, "install/host-tools.js"), at(fake, "install/host-tools-moved.js"));

    const r = runRed(m, fakeGate);
    expect(r.stdout).toContain("did not run cleanly");
    expect(r.stderr).toContain("host-tools-moved.js");
  });

  it("no leftovers: a run that dies at module top level (no pointer file in the judged tree) still removes its temp mirror", () => {
    const m = mirror();
    unlinkSync(at(m, TEMPLATE_REL));
    runRed(m);

    // Anti-vacuity: the leftover filter must be able to see a directory carrying the gate's prefix.
    const sentinel = mkdtempSync(join(tmpdir(), GATE_TMP_PREFIX));
    try {
      expect(gateTempEntries()).toContain(basename(sentinel));
    } finally {
      rmSync(sentinel, { recursive: true, force: true });
    }
  });

  it("green on the committed tree: the real tree is fresh", () => {
    const r = runGate();
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(`${FRESH_MARKER} ${ENTRY_COUNT} entries compared`);
  });

  it("wired at both ends: package.json defines freshness:host-entries, and the ubuntu block of the CI workflow runs it", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["freshness:host-entries"]).toBe("tsc --outDir .tmp-build && node scripts/host-entries-freshness.js");
    const commands = ubuntuBlockCommands(ciWorkflow());
    expect(commands.length, "the bounded block must carry commands after comment stripping").toBeGreaterThan(0);
    expect(commands.filter((c) => c === "npm run freshness:host-entries").length).toBe(1);
    // Beside the sibling it was modelled on, after it.
    expect(commands.indexOf("npm run freshness:host-entries")).toBeGreaterThan(commands.indexOf("npm run freshness:skill-twins"));
  });
});
