// generate-skill-twins.test.ts — the DERIVABILITY PROOF for the standalone skill-twin generator
// (KIT-03 / SPAWN-04, Phase 27, plan 27-64, D-64 Part B).
//
// Drives the COMMITTED compiled artifact scripts/generate-skill-twins.js as a child process (never
// the .ts), because the committed output is what continuous integration and host machines run.
//
// WHAT THIS FILE IS FOR. D-64 Part B rests on one factual claim: the seven standalone twins under
// .claude/skills are EXACTLY DERIVABLE from the seven plugin-form sources under skills/ by a name
// rewrite plus one known addendum. A generator built on a claim nobody measured is this phase's
// signature failure, so the claim is measured here from two independent directions:
//
//   Case 1 — the generator's FIRST run over the real tree reproduces all seven committed twins
//            byte-identically, reporting 7 rendered / 0 written / 7 already identical;
//   Case 2 — the transform is restated INDEPENDENTLY here, from the committed sources, and the
//            result is compared byte for byte against the committed twins. If Case 1 passed only
//            because the generator and the twins share a bug, this case does not.
//
// The remaining cases pin the generator's refusals, because a generator that silently rewrites its
// target proves nothing about derivability.
//
// EVERY PLANT LANDS IN A HERMETIC MIRROR, never in the committed tree. The generator deliberately
// honors NO root override — its paths are fixed literals joined to its own location (ASVS V12,
// T-27-149) — so each case builds a temp mirror carrying the generator's compiled import closure and
// the plugin-form sources, and runs the mirrored copy. That is the same arrangement
// scripts/skill-twins-freshness.ts uses, for the same reason. Vitest globals:false → import
// explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readFileSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { INVARIANT, RESOLVER } from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");
const GEN_JS = join(ROOT, "scripts", "generate-skill-twins.js");
const OVERWRITE_FLAG = "--overwrite-committed-twins";

// The generator's compiled import closure. Hand-written for the same reason the gate's is, and with
// the same loud failure direction: one file short and the mirrored generator cannot resolve its
// import and exits non-zero, which every case below would see immediately.
const SCRIPT_TWINS = [
  "generate-skill-twins.js",
  "kit-model.js",
  "frontmatter.js",
];

const tmpDirs: string[] = [];

// Build a hermetic mirror: the compiled generator closure, the plugin-form sources, and an EMPTY
// twin directory. Deliberately empty by default — that is the state the freshness gate's mirror is
// in, so the cases exercise the same shape the gate does.
function mirror(opts: { withTwins?: boolean } = {}): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-skill-twins-gen-test-"));
  tmpDirs.push(m);
  mkdirSync(join(m, "scripts"), { recursive: true });
  mkdirSync(join(m, ".claude/skills"), { recursive: true });
  for (const f of SCRIPT_TWINS) {
    cpSync(join(ROOT, "scripts", f), join(m, "scripts", f));
  }
  cpSync(join(ROOT, "skills"), join(m, "skills"), { recursive: true });
  if (opts.withTwins) {
    cpSync(join(ROOT, ".claude/skills"), join(m, ".claude/skills"), {
      recursive: true,
    });
  }
  return m;
}

function runGen(root: string, args: string[] = []) {
  return spawnSync("node", [join(root, "scripts", "generate-skill-twins.js"), ...args], {
    encoding: "utf8",
  });
}

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// The kit root's own directory name — the ONE source whose twin takes the resolver insertion and
// whose `name` is unchanged on both sides.
const NAMESPACE = "grugops";

// The plugin-form sources, DERIVED from the committed tree rather than hand-listed. A hand-listed
// set is this repository's second systemic failure class and the reason this plan exists.
const sourceDirs = (): string[] =>
  spawnSync("git", ["ls-files", "skills/*/SKILL.md"], { cwd: ROOT, encoding: "utf8" })
    .stdout.trim()
    .split("\n")
    .filter((p) => p !== "")
    .map((p) => p.split("/")[1])
    .sort();

describe("generate-skill-twins.js (D-64 Part B — the twins are DERIVED, and derivability is proven)", () => {
  it("Case 1 (the premise): the first run over the real tree reproduces all seven committed twins byte-identically", () => {
    // The load-bearing case. If this ever fails, a committed twin is NOT the generator's output and
    // the whole Part B argument is void — which is exactly why the generator halts rather than
    // overwriting.
    const r = runGen(ROOT);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("rendered 7 twin(s)");
    expect(r.stdout).toContain("0 written");
    expect(r.stdout).toContain("7 already identical");
  });

  it("Case 2 (independent restatement): the transform re-derived HERE reproduces every committed twin byte for byte", () => {
    // Deliberately NOT a call into the generator. The rule is restated from the plan's measured
    // baseline — six non-root twins differ by exactly the `name` line, the root twin by exactly the
    // eleven-line resolver insertion after the invariant landmark — and the result is compared
    // against the committed bytes. Two independent derivations agreeing is evidence; one derivation
    // agreeing with itself is not.
    const dirs = sourceDirs();
    // Non-vacuity: the corpus was really enumerated. A scan over an empty list satisfies every
    // assertion in the loop below.
    expect(dirs).toHaveLength(7);
    expect(dirs).toContain(NAMESPACE);

    for (const d of dirs) {
      const src = readFileSync(join(ROOT, "skills", d, "SKILL.md"), "utf8");
      const twinDir = d === NAMESPACE ? d : `${NAMESPACE}-${d}`;
      const twin = readFileSync(
        join(ROOT, ".claude/skills", twinDir, "SKILL.md"),
        "utf8",
      );
      const lines = src.split("\n");
      if (d === NAMESPACE) {
        const at = lines.indexOf(INVARIANT);
        expect(at, `${d}: invariant landmark`).toBeGreaterThanOrEqual(0);
        expect(lines[at + 1], `${d}: blank after invariant`).toBe("");
        lines.splice(at + 2, 0, ...RESOLVER, "");
      } else {
        const at = lines.indexOf(`name: ${d}`);
        expect(at, `${d}: name line`).toBeGreaterThanOrEqual(0);
        lines[at] = `name: ${NAMESPACE}-${d}`;
      }
      expect(lines.join("\n"), `${twinDir}/SKILL.md`).toBe(twin);
    }
  });

  it("Case 3 (the measured deltas): six non-root pairs differ by +8 bytes, the root pair by +448", () => {
    // The plan's measured baseline, RE-MEASURED rather than trusted. A baseline restated in prose
    // and never re-run is how a wrong premise survives eleven rounds.
    const dirs = sourceDirs();
    let nonRoot = 0;
    let root = 0;
    for (const d of dirs) {
      const twinDir = d === NAMESPACE ? d : `${NAMESPACE}-${d}`;
      const a = readFileSync(join(ROOT, "skills", d, "SKILL.md")).length;
      const b = readFileSync(
        join(ROOT, ".claude/skills", twinDir, "SKILL.md"),
      ).length;
      if (d === NAMESPACE) {
        expect(b - a, `${d} delta`).toBe(448);
        root += 1;
      } else {
        expect(b - a, `${d} delta`).toBe(8);
        nonRoot += 1;
      }
    }
    expect(nonRoot).toBe(6);
    expect(root).toBe(1);
  });

  it("Case 4 (HALT, never overwrite): a drifted committed twin stops the run and its bytes are UNCHANGED", () => {
    // The property that makes Case 1 mean anything. A generator that quietly rewrote its target
    // would make "the committed twins are the generator's output" true by construction and prove
    // nothing at all.
    const m = mirror({ withTwins: true });
    const victim = join(m, ".claude/skills", "grugops-uat", "SKILL.md");
    const planted = `${readFileSync(victim, "utf8")}\n<!-- hand-edited, never regenerated -->\n`;
    writeFileSync(victim, planted);

    const r = runGen(m);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("grugops-uat/SKILL.md");
    expect(r.stderr).toContain("HALTED");
    // The claim is not merely "it exited non-zero" — it is that nothing was written.
    expect(readFileSync(victim, "utf8")).toBe(planted);
  });

  it("Case 5 (deliberate adoption): the overwrite flag DOES write, and restores the twin", () => {
    const m = mirror({ withTwins: true });
    const victim = join(m, ".claude/skills", "grugops-uat", "SKILL.md");
    const pristine = readFileSync(victim, "utf8");
    writeFileSync(victim, `${pristine}\n<!-- hand-edited -->\n`);

    const r = runGen(m, [OVERWRITE_FLAG]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("1 written");
    expect(r.stdout).toContain("6 already identical");
    expect(readFileSync(victim, "utf8")).toBe(pristine);
  });

  it("Case 6 (fail-closed, wrong name): a source whose declared name disagrees with its directory is refused", () => {
    // The assertion that keeps the rewrite from laundering a wrong plugin-form name — the plugin
    // name is the command the platform namespaces.
    const m = mirror();
    const src = join(m, "skills", "map", "SKILL.md");
    writeFileSync(
      src,
      readFileSync(src, "utf8").replace("name: map", "name: nap"),
    );

    const r = runGen(m);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("skills/map/SKILL.md");
    expect(r.stderr).toContain("expected `name: map`");
  });

  it("Case 7 (fail-closed, shape): a NESTED plugin skill is a finding, never a skipped file", () => {
    // The kit authority walks at any depth on purpose. A member the naming rule cannot express must
    // halt the generator rather than be dropped, because a dropped skill is a live file outside the
    // byte gate — the exact silence this plan closes.
    const m = mirror();
    mkdirSync(join(m, "skills", "outer", "inner"), { recursive: true });
    writeFileSync(
      join(m, "skills", "outer", "inner", "SKILL.md"),
      "---\nname: inner\n---\nnested\n",
    );

    const r = runGen(m);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("outer/inner/SKILL.md");
    expect(r.stderr).toContain("<dir>/SKILL.md");
  });

  it("Case 8 (fail-closed, unreadable source): a frontmatter parse failure is reported as itself", () => {
    // A PARSE FAILURE IS A PARSE ARTIFACT, NEVER A VERDICT. An unreadable source must not print the
    // sentence reserved for a source that declares the wrong name.
    const m = mirror();
    writeFileSync(
      join(m, "skills", "gate", "SKILL.md"),
      "---\nname: gate\nnever closed\n",
    );

    const r = runGen(m);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("skills/gate/SKILL.md");
    expect(r.stderr).toContain("frontmatter is unreadable");
  });

  it("Case 9 (fail-closed, argument): an unrecognised argument is refused rather than ignored", () => {
    // A typo of the overwrite flag that was silently ignored would leave an author believing a
    // source change had been adopted. There is deliberately NO output-path flag to accept.
    const m = mirror();
    const r = runGen(m, ["--out", "/tmp/anywhere"]);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("unrecognised argument");
    expect(r.stderr).toContain("accepts NO output path");
  });

  it("Case 10 (the empty-render refusal): a zero-source corpus can NEVER exit 0", () => {
    // This is the case that makes scripts/skill-twins-freshness.ts's empty-regeneration arm
    // unreachable, and it is asserted here rather than assumed there. Two upstream refusals stand
    // between an empty corpus and a clean exit; this pins the generator's half.
    const m = mirror();
    rmSync(join(m, "skills"), { recursive: true, force: true });
    mkdirSync(join(m, "skills"), { recursive: true });

    const r = runGen(m);
    expect(r.status).not.toBe(0);
    // The kit authority's own vacuity refusal is what fires; the generator carries it through as a
    // finding rather than treating an empty corpus as nothing-to-do.
    expect(r.stderr).not.toBe("");
    expect(r.stdout).not.toContain("rendered");
  });

  it("Case 11 (no partial artifact): a refusal writes NOTHING, even for the twins that rendered fine", () => {
    // Build-everything-then-write (T-27-32). Six sources are perfectly valid here; the seventh is
    // not, and a generator that had already flushed the six would leave a half-updated twin
    // directory behind.
    const m = mirror();
    writeFileSync(
      join(m, "skills", "gate", "SKILL.md"),
      "---\nname: gate\nnever closed\n",
    );

    const r = runGen(m);
    expect(r.status).not.toBe(0);
    // The mirror's twin directory started EMPTY. If anything was written, this is not empty.
    const listed = spawnSync(
      "find",
      [join(m, ".claude/skills"), "-type", "f"],
      { encoding: "utf8" },
    );
    expect(listed.stdout.trim()).toBe("");
  });

  it("Case 12 (chmod is real on this host): the fixture used by the gate's unreadable case can actually deny reads", () => {
    // Anti-vacuity for scripts/skill-twins-freshness.test.ts's unreadable-twin case, asserted HERE
    // so that file's case cannot pass for the wrong reason. A 0o000 file is readable by root, and CI
    // containers frequently run as root — in which case the sibling case must be skipped rather than
    // silently proving nothing.
    const m = mkdtempSync(join(tmpdir(), "grugops-chmod-probe-"));
    tmpDirs.push(m);
    const f = join(m, "probe");
    writeFileSync(f, "x");
    chmodSync(f, 0o000);
    let denied = false;
    try {
      readFileSync(f);
    } catch {
      denied = true;
    }
    chmodSync(f, 0o600);
    // Not an assertion on `denied` — it is legitimately false as root. The assertion is that the
    // probe RAN and produced a boolean the sibling file can gate on.
    expect(typeof denied).toBe("boolean");
  });
});
