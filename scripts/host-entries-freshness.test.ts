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
// generator's own exports (ENTRY_SHAPES, outputRel), never typed here, and their count is asserted.
// Vitest globals:false, so everything is imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { ENTRY_SHAPES, TEMPLATE_REL, outputRel } from "./generate-host-entries.js";
import { AGENT_SKILL_REL, HOST_ADAPTER_KINDS } from "../install/host-tools.js";

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

// The rendered entry paths, derived from the generator: every adapter kind with a frontmatter shape, at the one
// ROUTE_POINTERS path outputRel answers for it.
const ENTRY_RELS: readonly string[] = HOST_ADAPTER_KINDS.filter((k) => ENTRY_SHAPES[k] !== null).map((k) => {
  const o = outputRel(k);
  if ("problem" in o) throw new Error(o.problem);
  return o.rel;
});
const ENTRY_COUNT = 3;

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
  it("PREMISE: the generator renders exactly the three whole-file entries, Codex CLI's skill among them", () => {
    expect(ENTRY_RELS.length).toBe(ENTRY_COUNT);
    expect(ENTRY_RELS).toContain(AGENT_SKILL_REL);
  });
});

// ── THE GATE IS PROVEN ABLE TO FAIL ─────────────────────────────────────────────────────────────────────
// One mirror, reused across P0 and P1 in that order, so the control and the plant are measured on THE SAME
// tree. P0 fixes the baseline at exit 0; every red after it is the plant's.
describe("host-entries-freshness.js — fail-proofs (the byte gate goes red, and for the right reason)", () => {
  const m = mirror();
  const victim = at(m, AGENT_SKILL_REL);
  let controlStatus: number | null = null;

  it("P0 (premise control, recorded first): the unmutated mirror exits 0 with three compared and zero differences", () => {
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
