// adapters-freshness.test.ts — behavioral oracle for the SPAWN-02 adapter drift gate.
//
// Drives the COMMITTED compiled artifact scripts/adapters-freshness.js as a child process (never
// the .ts) and asserts the exit-code-as-signal contract:
//   exit 0 = the committed .claude/agents directory matches a fresh regeneration, byte for byte
//            and member for member
//   exit 1 = drift (byte, extra member or missing member), OR the regeneration itself failed
//
// WHY THIS FILE EXISTS AT ALL (Phase 27 / plan 27-11). Every other freshness gate in this tree has
// a test that spawns it; this one did not, and the continuous-integration workflow did not name it
// either. It was therefore a gate invoked by nothing — the single gate that would have caught
// either of the two hand-edit bypasses reproduced in 27-REVIEW.md, while a committed hand-edit to
// an adapter passed every gate in the repository. Plan 27-11 wires the workflow step AND this file,
// deliberately at both ends: the workflow makes drift turn the build red today, and this file makes
// the drift lane survive a workflow refactor that drops or renames the step (threat T-27-51).
//
// EVERY PLANT LANDS IN A HERMETIC MIRROR, never in the committed tree (threat T-27-52). The gate
// honors the CHECK_ROOT override that scripts/check-foundation-guards.ts and scripts/check-kit-refs.ts
// already honor, so each case builds its own temp mirror of the kit inputs, mutates that, and points
// the gate at it. No case can leave the repository dirty if it throws, and no case can interfere
// with a concurrently running test file. Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "adapters-freshness.js");

// The gate's own temp-mirror prefix, RECOVERED from the committed .js rather than restated here. A
// hand-copied prefix would make the IN-01 leftover assertion vacuously true the moment the gate
// renamed its directory — the failure mode Case 7 of coordinator-resolution-precheck.test.ts guards
// against by asserting its prefix is live. Recovering it is the stronger form of the same idea.
const GATE_TMP_PREFIX = ((): string => {
  const m = readFileSync(GATE_JS, "utf8").match(
    /mkdtempSync\(join\(tmpdir\(\),\s*"([^"]+)"\)\)/,
  );
  if (m === null) {
    throw new Error(
      "scripts/adapters-freshness.js: could not recover the temp-mirror prefix — the IN-01 leftover assertion would be filtering on nothing",
    );
  }
  return m[1];
})();

// Every entry in the system temp directory carrying the gate's prefix, right now.
const tempEntries = (): string[] =>
  readdirSync(tmpdir()).filter((n) => n.startsWith(GATE_TMP_PREFIX));

// The kit inputs the gate reads from its KIT root: the two generator sources it mirror-spawns over,
// and the committed adapter directory it compares. The compiled script twins deliberately do NOT
// appear here — the gate always takes those from its own script-relative root, because the
// committed compiled output is what continuous integration and host machines run.
const KIT_INPUTS = [
  "agent-factory/roles",
  "agent-factory/packaging",
  ".claude/agents",
];

const tmpDirs: string[] = [];

// Build a hermetic mirror carrying byte-faithful copies of every kit input. Returns the mirror dir.
function mirror(): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-adapters-fresh-test-"));
  tmpDirs.push(m);
  for (const rel of KIT_INPUTS) {
    cpSync(join(ROOT, rel), join(m, rel), { recursive: true });
  }
  return m;
}

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Spawn the committed gate. With no argument it judges the real tree; with a mirror it judges that.
function runGate(kitRoot?: string) {
  const env = { ...process.env };
  if (kitRoot) env.CHECK_ROOT = kitRoot;
  else delete env.CHECK_ROOT;
  return spawnSync("node", [GATE_JS], { cwd: ROOT, encoding: "utf8", env });
}

// The success-only wording. Kept as one constant because two cases key on it in opposite
// directions, and a fail-closed message must never be allowed to contain it.
const FRESH_MARKER = "Adapters fresh:";

describe("adapters-freshness.js (SPAWN-02 adapter drift gate)", () => {
  it("Case 1 (green): exits 0 over the real tree, reporting zero byte differences", () => {
    const r = runGate();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(FRESH_MARKER);
    expect(r.stdout).toContain("0 byte difference(s)");
  });

  it("Case 2 (RED, byte drift): exits non-zero and names the hand-edited adapter", () => {
    // THIS is the case that would have caught both bypasses reproduced in 27-REVIEW.md § CR-01 and
    // § CR-02. Both were byte-level hand edits of a COMMITTED adapter — a shape invisible to every
    // other gate, because the adapter's own content is what the platform loads and the generator's
    // output is only a claim about it.
    const m = mirror();
    const victim = "grugops-qe-e2e.md";
    const target = join(m, ".claude/agents", victim);
    writeFileSync(
      target,
      Buffer.concat([
        readFileSync(target),
        Buffer.from("\n<!-- hand-edited, never regenerated -->\n"),
      ]),
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("STALE:");
    expect(r.stdout).toContain(victim);
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it("Case 3 (RED, top-level orphan): exits non-zero naming an extra adapter the generator does not produce", () => {
    // The orphan shape: an adapter left behind by a deleted role. A byte comparison alone cannot
    // see it, because nothing regenerates over it.
    const m = mirror();
    const orphan = "zz-orphan-adapter.md";
    writeFileSync(
      join(m, ".claude/agents", orphan),
      "---\nname: zz-orphan-adapter\ndescription: not produced by the generator\n---\n",
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("EXTRA");
    expect(r.stdout).toContain(orphan);
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it("Case 4 (RED, nested orphan): exits non-zero naming the plant at its FULL relative path", () => {
    // Only possible because the set half compares relative paths derived from the shared authority.
    // The former non-recursive listing filtered on `.md`, so a subdirectory was dropped outright and
    // a nested adapter — which Claude Code DOES load, taking identity only from frontmatter — was
    // invisible to this gate. The assertion keys on the full relative path, not the basename, so it
    // also pins that a nested member is never folded into a top-level one.
    const m = mirror();
    const nestedRel = "nested/zz-nested-orphan.md";
    mkdirSync(join(m, ".claude/agents", "nested"), { recursive: true });
    writeFileSync(
      join(m, ".claude/agents", nestedRel),
      "---\nname: zz-nested-orphan\ndescription: a nested adapter the generator never wrote\n---\n",
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("EXTRA");
    expect(r.stdout).toContain(nestedRel);
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it("Case 5 (fail-closed): exits non-zero without the success wording when the mirrored regeneration fails", () => {
    // Plant a non-conforming role file into the MIRROR's role corpus. The gate cpSyncs the kit
    // root's agent-factory/roles into its temp regeneration mirror, so the mirrored generator
    // rejects it and exits non-zero. A broken generator must never be mistaken for an up-to-date
    // adapter directory (T-27-31 / T-27-50).
    //
    // The filename must NOT start with `_`: the generator's D-03 underscore filter would silently
    // drop it, and the regeneration would then SUCCEED over a smaller role set — passing this case
    // for entirely the wrong reason, by never exercising the fail-closed branch at all.
    const m = mirror();
    writeFileSync(
      join(m, "agent-factory/roles", "zzz-adapters-freshness-badrole.md"),
      "---\nkind: role\ntier: core\n---\n\nNo H1 here.\n",
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    expect(r.stdout).toContain("did not run cleanly");
  });

  it("Case 6 (IN-01, no leftovers): a run that throws before any handler still removes its temp mirror", () => {
    // The review's named input: a CHECK_ROOT mirror with agent-factory/packaging ABSENT. The gate
    // cpSyncs that directory at module top level, so the throw escapes both die() paths and both
    // tails. Before the exit handler was registered this run left <tmpdir>/<prefix>* behind every
    // time — reproduced, then re-run green. A gate that accumulates state outside its own lifetime
    // is a slow denial of service on the host and on CI runners (T-27-117).
    //
    // The mirror deliberately does NOT use mirror(): that helper copies every kit input, and the
    // whole point here is that one of them is missing. Its prefix is deliberately distinct from the
    // gate's, so this case's own scaffolding can never be counted as the gate's leak.
    const m = mkdtempSync(join(tmpdir(), "grugops-adapters-in01-"));
    tmpDirs.push(m);
    for (const rel of KIT_INPUTS.filter((r) => r !== "agent-factory/packaging")) {
      cpSync(join(ROOT, rel), join(m, rel), { recursive: true });
    }

    // Set difference, not a count: a concurrently running gate with its own mirror cannot influence
    // the verdict, and neither can an entry left by something outside this suite.
    const before = tempEntries();
    const r = runGate(m);
    const added = tempEntries().filter((n) => !before.includes(n));
    expect(added).toEqual([]);

    // ...and the run must still FAIL. A gate that cleaned up by quietly succeeding would satisfy the
    // assertion above for entirely the wrong reason, so the exit code is asserted beside it.
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);

    // Anti-vacuity: the assertion above is a set difference over a FILTER, and a filter that matches
    // nothing passes forever. Prove the filter can actually see a directory carrying the gate's
    // prefix before trusting its silence.
    const sentinel = mkdtempSync(join(tmpdir(), GATE_TMP_PREFIX));
    try {
      expect(tempEntries()).toContain(basename(sentinel));
    } finally {
      rmSync(sentinel, { recursive: true, force: true });
    }
  });
});
