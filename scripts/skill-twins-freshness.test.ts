// skill-twins-freshness.test.ts — behavioral oracle for the KIT-03 / SPAWN-04 skill-twin drift gate
// (Phase 27, plan 27-64, D-64 Part B).
//
// Drives the COMMITTED compiled artifact scripts/skill-twins-freshness.js as a child process (never
// the .ts) and asserts the exit-code-as-signal contract:
//   exit 0 = the committed .claude/skills directory matches a fresh regeneration, byte for byte and
//            member for member
//   exit 1 = drift (byte, extra member or missing member), OR the regeneration itself failed
//
// WHY THIS FILE EXISTS AT ALL. A gate nothing re-runs fails nothing closed. freshness:adapters
// existed and passed for a WHOLE PHASE while being invoked by nothing, and a committed hand-edit to
// an adapter cleared every gate in the repository (27-REVIEW CR-01/CR-02). That was the single most
// expensive omission of this phase, so the new gate is wired at BOTH ends from the first commit: the
// ubuntu-only block of .github/workflows/ci.yml runs it, and this file spawns the committed .js
// directly so the drift lane survives a workflow refactor that drops or renames the step
// (threat T-27-150).
//
// EVERY PLANT LANDS IN A HERMETIC MIRROR, never in the committed tree. The gate honors the CHECK_ROOT
// override that check-foundation-guards.ts, check-kit-refs.ts and adapters-freshness.ts already
// honor, so each case builds its own temp mirror of the kit inputs, mutates that, and points the gate
// at it. No case can leave the repository dirty if it throws, and no case can interfere with a
// concurrently running test file. Vitest globals:false → import explicitly.

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
  chmodSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "skill-twins-freshness.js");

// The gate's own temp-mirror prefix, RECOVERED from the committed .js rather than restated here. A
// hand-copied prefix would make the leftover assertion vacuously true the moment the gate renamed
// its directory. Recovering it is the stronger form of the same idea, and it is the idiom
// adapters-freshness.test.ts already established.
const GATE_TMP_PREFIX = ((): string => {
  const m = readFileSync(GATE_JS, "utf8").match(
    /mkdtempSync\(join\(tmpdir\(\),\s*"([^"]+)"\)\)/,
  );
  if (m === null) {
    throw new Error(
      "scripts/skill-twins-freshness.js: could not recover the temp-mirror prefix — the leftover assertion would be filtering on nothing",
    );
  }
  return m[1];
})();

const tempEntries = (): string[] =>
  readdirSync(tmpdir()).filter((n) => n.startsWith(GATE_TMP_PREFIX));

// The kit inputs the gate reads from its KIT root: the plugin-form sources it mirror-spawns the
// generator over, and the committed twin directory it compares. The compiled script twins
// deliberately do NOT appear here — the gate always takes those from its own script-relative root,
// because the committed compiled output is what continuous integration and host machines run.
const KIT_INPUTS = ["skills", ".claude/skills"];

const tmpDirs: string[] = [];

function mirror(): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-skill-twins-fresh-test-"));
  tmpDirs.push(m);
  for (const rel of KIT_INPUTS) {
    cpSync(join(ROOT, rel), join(m, rel), { recursive: true });
  }
  return m;
}

afterAll(() => {
  for (const d of tmpDirs) {
    // Restore any permission a case removed, or rmSync cannot descend.
    try {
      chmodSync(join(d, ".claude/skills", "grugops-gate", "SKILL.md"), 0o644);
    } catch {
      /* the case that chmods is the only one that needs this */
    }
    rmSync(d, { recursive: true, force: true });
  }
});

// Spawn the committed gate. With no argument it judges the real tree; with a mirror it judges that.
function runGate(kitRoot?: string) {
  const env = { ...process.env };
  if (kitRoot) env.CHECK_ROOT = kitRoot;
  else delete env.CHECK_ROOT;
  return spawnSync("node", [GATE_JS], { cwd: ROOT, encoding: "utf8", env });
}

// The success-only wording. Kept as one constant because cases key on it in opposite directions, and
// a fail-closed message must never be allowed to contain it.
const FRESH_MARKER = "Skill twins fresh:";

// Can this host actually deny a read? A 0o000 file is readable by root, and CI containers frequently
// run as root — in which case the unreadable case must SKIP rather than silently prove nothing.
const CAN_DENY_READS = ((): boolean => {
  const d = mkdtempSync(join(tmpdir(), "grugops-skill-twins-chmod-"));
  tmpDirs.push(d);
  const f = join(d, "probe");
  writeFileSync(f, "x");
  chmodSync(f, 0o000);
  try {
    readFileSync(f);
    chmodSync(f, 0o600);
    return false;
  } catch {
    chmodSync(f, 0o600);
    return true;
  }
})();

describe("skill-twins-freshness.js (D-64 Part B skill-twin drift gate)", () => {
  it("Case 1 (green): exits 0 over the real tree, reporting seven compared and zero byte differences", () => {
    const r = runGate();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(FRESH_MARKER);
    expect(r.stdout).toContain("7 twin(s) compared");
    expect(r.stdout).toContain("0 byte difference(s)");
  });

  it("Case 2 (RED, byte drift): exits non-zero and names the hand-edited twin", () => {
    // THIS is the shape every bypass reproduced in eleven review rounds took: a byte-level hand edit
    // of a committed SKILL.md. It was invisible to every gate in the tree, because the file's own
    // content is what the platform loads and the plugin-form source is only a claim about it.
    const m = mirror();
    const victim = "grugops-ticket/SKILL.md";
    const target = join(m, ".claude/skills", victim);
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

  it("Case 3 (RED, orphan): exits non-zero naming an EXTRA twin the generator does not produce", () => {
    // The orphan shape: a twin left behind by a deleted plugin-form skill. A byte comparison alone
    // cannot see it, because nothing regenerates over it.
    const m = mirror();
    const orphan = "grugops-zz-orphan/SKILL.md";
    mkdirSync(join(m, ".claude/skills", "grugops-zz-orphan"), { recursive: true });
    writeFileSync(
      join(m, ".claude/skills", orphan),
      "---\nname: grugops-zz-orphan\n---\nnot produced by the generator\n",
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("EXTRA");
    expect(r.stdout).toContain(orphan);
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it("Case 4 (RED, missing): exits non-zero naming a MISSING twin the tree does not carry", () => {
    // The other half the byte comparison cannot see: nothing compares against a file that is not
    // there. Named by its FULL relative path, so a nested member could never be folded into a
    // top-level one sharing a basename.
    const m = mirror();
    rmSync(join(m, ".claude/skills", "grugops-plan"), {
      recursive: true,
      force: true,
    });

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("MISSING");
    expect(r.stdout).toContain("grugops-plan/SKILL.md");
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it.skipIf(!CAN_DENY_READS)(
    "Case 5 (fail-closed, unreadable): a committed twin that cannot be READ is never treated as absent-and-therefore-fine",
    () => {
      const m = mirror();
      const victim = join(m, ".claude/skills", "grugops-gate", "SKILL.md");
      chmodSync(victim, 0o000);

      const r = runGate(m);
      chmodSync(victim, 0o644);
      expect(r.status).not.toBe(0);
      expect(r.stdout).toContain("could not be read");
      expect(r.stdout).toContain("grugops-gate/SKILL.md");
      expect(r.stdout).not.toContain(FRESH_MARKER);
    },
  );

  it("Case 6 (fail-closed, broken regeneration): a generator that cannot run cleanly is never read as fresh", () => {
    // Plant a non-conforming source into the MIRROR's plugin-form corpus. The gate cpSyncs the kit
    // root's skills/ into its temp regeneration mirror, so the mirrored generator rejects it and
    // exits non-zero. A broken generator must never be mistaken for an up-to-date twin directory
    // (T-27-150).
    const m = mirror();
    writeFileSync(
      join(m, "skills", "map", "SKILL.md"),
      "---\nname: wrong-on-purpose\n---\nbody\n",
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    expect(r.stdout).toContain("did not run cleanly");
  });

  it("Case 7 (no leftovers): a run that throws before any handler still removes its temp mirror", () => {
    // A CHECK_ROOT mirror with skills/ ABSENT. The gate cpSyncs that directory at module top level,
    // so the throw escapes both die() paths and both tails; only the exit handler registered
    // immediately after mkdtempSync removes the directory. A gate that accumulates state outside its
    // own lifetime is a slow denial of service on the host and on CI runners (T-27-151).
    //
    // The mirror deliberately does NOT use mirror(): the whole point is that one input is missing.
    // Its prefix is deliberately distinct from the gate's, so this case's own scaffolding can never
    // be counted as the gate's leak.
    const m = mkdtempSync(join(tmpdir(), "grugops-skill-twins-leak-"));
    tmpDirs.push(m);
    cpSync(join(ROOT, ".claude/skills"), join(m, ".claude/skills"), {
      recursive: true,
    });

    // Set difference, not a count: a concurrently running gate with its own mirror cannot influence
    // the verdict, and neither can an entry left by something outside this suite.
    const before = tempEntries();
    const r = runGate(m);
    const added = tempEntries().filter((n) => !before.includes(n));
    expect(added).toEqual([]);

    // ...and the run must still FAIL. A gate that cleaned up by quietly succeeding would satisfy the
    // assertion above for entirely the wrong reason.
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

  it("Case 8 (wired at both ends): the gate is named in package.json AND in the ubuntu block of the CI workflow", () => {
    // The omission this whole file exists to prevent, asserted rather than remembered. A gate present
    // in package.json but absent from the workflow is the exact state freshness:adapters was in for a
    // whole phase.
    const pkg = readFileSync(join(ROOT, "package.json"), "utf8");
    expect(pkg).toContain('"freshness:skill-twins"');
    const ci = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");
    expect(ci).toContain("npm run freshness:skill-twins");
    // ...and it sits inside the ubuntu-only gate block, beside the sibling it was modelled on,
    // rather than in some unreachable job.
    const block = ci.slice(ci.indexOf("Freshness gates + repo gates (ubuntu only)"));
    expect(block).toContain("npm run freshness:adapters");
    expect(block).toContain("npm run freshness:skill-twins");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE GATE IS PROVEN ABLE TO FAIL (plan 27-64 task 3 — D-64 vacuity trap 4)
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// An assertion that was never made to fail is not a pin, and this phase's record is the reason the
// sentence is written that plainly: the verification harness produced a FALSE result SIXTEEN times
// across this phase, in six instances over four straight rounds. So every plant below asserts its
// OWN premise before it is believed.
//
// THE ORDER IS THE ORDER THEY RUN IN, AND THE PREMISE CONTROL IS RECORDED FIRST. A plant whose
// baseline was not recorded is the arrangement that produced reds nobody could attribute. P0 fixes
// the attributable baseline at exit 0 on an unmutated mirror; every red below is the plant's, with
// nothing to subtract.
describe("skill-twins-freshness.js — FAIL-PROOFS (the byte gate can go red, and for the right reason)", () => {
  // One mirror, reused across P0 and P1 in that order, so the control and the plant are measured on
  // THE SAME tree. Two separate mirrors would leave "was the mirror itself different" unmeasured.
  const m = mirror();
  const VICTIM_REL = "grugops/SKILL.md";
  const victim = join(m, ".claude/skills", VICTIM_REL);

  // The ROOT twin is the deliberate victim. guard_distribution_pair EXEMPTS exactly this file — its
  // 448-byte resolver divergence from the plugin form is legitimate and the pair rule cannot express
  // it — so before this plan the root twin's 1733 bytes were under NO byte check anywhere in the
  // tree. It is the file this gate protects that nothing else did.
  let controlStatus: number | null = null;

  it("P0 (premise control, recorded FIRST): the unmutated mirror exits 0 with seven compared and zero differences", () => {
    const r = runGate(m);
    controlStatus = r.status;
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(FRESH_MARKER);
    expect(r.stdout).toContain("7 twin(s) compared");
    expect(r.stdout).toContain("0 byte difference(s)");
  });

  it("P1 (ONE-BYTE drift): the gate moves from exit 0 to non-zero and NAMES the drifted file", () => {
    // The control must have run and passed, or this case is measuring an unknown baseline.
    expect(controlStatus, "P0 must run first and exit 0").toBe(0);

    const before = readFileSync(victim);
    // Mutate EXACTLY ONE BYTE: the last content byte before the trailing newline, flipped to a
    // different value. Length is preserved, so nothing here could be caught by a size comparison.
    const idx = before.length - 2;
    const after = Buffer.from(before);
    after[idx] = before[idx] === 0x41 ? 0x42 : 0x41; // 'A' unless it already is, then 'B'
    writeFileSync(victim, after);

    // ASSERT THE PLANT LANDED. A plant that did not land produces a perfectly convincing green, and
    // that is precisely how this phase's harness lied sixteen times.
    const reread = readFileSync(victim);
    expect(reread.length, "the mutation must preserve length").toBe(before.length);
    const differingBytes = [...reread].filter((b, i) => b !== before[i]).length;
    expect(differingBytes, "exactly one byte must differ").toBe(1);

    const r = runGate(m);
    // The claim is NOT "it exited non-zero". The claim is that it failed for the right reason and
    // named the right file.
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("STALE:");
    expect(r.stdout).toContain(VICTIM_REL);
    expect(r.stdout).toContain("differ from a fresh regeneration");
    expect(r.stdout).not.toContain(FRESH_MARKER);

    // Restore, and prove the restoration restored: the same mirror must go green again. A gate that
    // stayed red would mean the red was the mirror's, not the plant's.
    writeFileSync(victim, before);
    const back = runGate(m);
    expect(back.status).toBe(0);
    expect(back.stdout).toContain(FRESH_MARKER);
  });

  it("P2 (empty regeneration): the gate's named branch is UNREACHABLE, and the two upstream refusals that make it so are pinned here", () => {
    // UNKNOWN - verify, WITH ITS REASON, rather than a fabricated transcript. The gate's
    // `rebuiltNames.length === 0` branch prints its own named refusal, but no input can reach it:
    // the branch needs a generator that exits 0 having emitted nothing, and two refusals stand in
    // the way. Both are measured here rather than asserted about, and the branch is kept as a third
    // layer because layers one and two live in OTHER modules — if either is later relaxed, that
    // branch becomes the live one instead of a silence.
    //
    // Refusal 1 — the GENERATOR refuses its own empty render (also pinned as Case 10 of
    // scripts/generate-skill-twins.test.ts, from the generator's side).
    // Refusal 2 — listSkillAdapters() refuses an empty directory by THROWING, which this gate
    // converts into its fail-closed "cannot read the regenerated skill directory" verdict.
    const empty = mkdtempSync(join(tmpdir(), "grugops-skill-twins-empty-"));
    tmpDirs.push(empty);
    mkdirSync(join(empty, "skills"), { recursive: true });
    cpSync(join(ROOT, ".claude/skills"), join(empty, ".claude/skills"), {
      recursive: true,
    });

    const r = runGate(empty);
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    // It failed CLOSED, and it failed BEFORE reaching the unreachable arm — the message is the
    // generator's own, carried through, not the empty-regeneration wording.
    expect(r.stdout).toContain("did not run cleanly");
    expect(r.stdout).not.toContain("produced no twins");

    // And the unreachable arm's wording IS present in the shipped gate, so this case is describing a
    // branch that exists rather than one that was quietly deleted.
    expect(readFileSync(GATE_JS, "utf8")).toContain(
      "refusing to report an empty regeneration as fresh",
    );
  });

  it("P3 (no exemption may be added to make a cell pass): DISTRIBUTION_PAIR_EXEMPT has exactly one member", () => {
    // D-64 vacuity trap 3. The cheapest way to make a byte gate green is to exempt the file that
    // fails it, so the exemption list's LENGTH is asserted from the committed guard source — a
    // source this plan does not edit at all.
    //
    // A BOUNDED slice whose section marker is asserted present BEFORE the slice is used. An
    // unbounded scan of a 4000-line file is the brittleness IN-03 named: it would match a mention of
    // the constant in any comment anywhere and quietly measure the wrong text.
    const src = readFileSync(join(ROOT, "scripts/check-foundation-guards.ts"), "utf8");
    const MARKER = "const DISTRIBUTION_PAIR_EXEMPT";
    const at = src.indexOf(MARKER);
    // The marker is asserted PRESENT, and asserted UNIQUE: two declarations would make the slice
    // below measure whichever came first, silently.
    expect(at, "the exemption declaration must exist").toBeGreaterThanOrEqual(0);
    expect(src.indexOf(MARKER, at + 1), "exactly one declaration").toBe(-1);

    // Non-vacuity floor on what was scanned. A slice taken from a truncated or empty read satisfies
    // every assertion below by matching nothing.
    expect(src.length).toBeGreaterThan(50000);

    // Bound: from the marker to the first semicolon that terminates the declaration, capped so a
    // missing terminator cannot swallow the rest of the file.
    const MAX_DECL_CHARS = 400;
    const window = src.slice(at, at + MAX_DECL_CHARS);
    const end = window.indexOf(";");
    expect(end, "the declaration must terminate inside the bound").toBeGreaterThan(0);
    const decl = window.slice(0, end);

    const members = [...decl.matchAll(/"([^"]+)"/g)].map((mm) => mm[1]);
    expect(members).toEqual(["skills/grugops/SKILL.md"]);
    // Cardinality pinned as a NUMBER, so a list that silently stops matching shrinks loudly rather
    // than passing over an empty set.
    expect(members).toHaveLength(1);
  });

  it("P4 (this plan removed nothing): guard_distribution_pair is still present and still compares the pair", () => {
    // The new byte gate and guard_distribution_pair now ask overlapping questions from two
    // directions, and the byte gate is the stronger of the two because it compares against a
    // REGENERATION rather than against the pair's sibling. That is not a reason to delete the pair
    // guard in the same round that introduces its overlap, so this case pins that nothing was
    // weakened. Any consolidation is a later decision, made on purpose.
    const src = readFileSync(join(ROOT, "scripts/check-foundation-guards.ts"), "utf8");
    expect(src).toContain("function guardDistributionPair()");
    // Matched WITHOUT the backticks: the guard's finding embeds them as escaped backticks inside a
    // template literal, so a comparison spelling them literally would fail on a guard that is
    // perfectly intact — a false red, which on a safety surface is as corrosive as a false green.
    expect(src).toContain("DIVERGE beyond the");
    expect(src).toContain("Re-sync the pair, or add it to DISTRIBUTION_PAIR_EXEMPT");
  });
});
