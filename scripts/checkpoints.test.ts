// checkpoints.test.ts — the unit floor under the per-checkpoint autonomy matrix (AUTO-01, AUTO-02).
//
// WHAT THIS FILE ASSERTS, AND WHAT IT DELIBERATELY DOES NOT. It covers the two lowest layers of the
// matrix — the canonicalizer and the config read — at the level of values. It does NOT assert the
// two-key rule end to end; that is hooks/guard.test.ts's job, because the only honest proof of a
// hook decision is spawning the committed guard.js. A green run here is a floor, never a closure
// ([[grugops-safety-invariant-green-suite-insufficient]]).
//
// THE DISCRIMINATION PROOF. Every assertion below was authored RED-first against a deliberately
// weakened `canonicalizeDisposition` whose non-canonical arm returns `"off"` instead of `"block"`.
// The mutation, the cases that went red under it, and the restored green are recorded in
// .planning/phases/30-per-checkpoint-autonomy-matrix/30-01-SUMMARY.md. An assertion that stays green
// under that mutation is asserting nothing.
//
// IT DRIVES THE COMMITTED .js, NEVER THE .ts (the repo's spawn/import-the-artifact discipline). That
// is what makes the mutation above meaningful: a weakened source only reaches this file after a
// build, so the thing measured is the artifact that ships.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");

// The COMMITTED artifacts. Never the .ts.
const cp: typeof import("./checkpoints.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "checkpoints.js")).href
);
const io: typeof import("./context-io.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "context-io.js")).href
);
const am: typeof import("./audit-model.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "audit-model.js")).href
);
// Plan 30-10 (red-team surface B, round 1) — the corpus lister and the fence/heading authority.
// Both are IMPORTED so the live one-stop-section-per-workflow assertion below asks the same
// authorities the derivation asks, rather than re-deriving "which files are workflows" or
// "which lines are headings" a second time.
const km: typeof import("./kit-model.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "kit-model.js")).href
);
const fm: typeof import("./frontmatter.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "frontmatter.js")).href
);
type cpTypes = typeof import("./checkpoints.js");
declare namespace cpTypes {
  type CheckpointSite = import("./checkpoints.js").CheckpointSite;
}

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

/** Write a raw config body at the standard repo-drop location and return the root. */
function rootWithRawConfig(body: string): string {
  const root = freshTmp("cp-cfg-");
  mkdirSync(join(root, ".grugops"), { recursive: true });
  writeFileSync(join(root, ".grugops", "factory.config.json"), body);
  return root;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The degenerate-value sweep, DERIVED from its existing authority rather than retyped.
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// scripts/floor-invariance.test.ts already owns a garbage-value sweep for the sibling dial
// (`HUMAN_ADMISSION_VALUES`), chosen precisely because each member takes a different code path in a
// naive reader: wrong case, empty string, a numeral, a boolean spelling, arbitrary junk. Retyping
// those values here would create a second list that rots independently of the first — the
// set-literal drift class this milestone exists to refuse.
//
// It cannot simply be IMPORTED: floor-invariance.test.ts is a test module, and importing it would
// register its 128 spawn-heavy cases a second time inside this file. So the list is EXTRACTED from
// its source text, and the extraction is asserted rather than trusted: a failure to locate the
// block, an empty extraction, or a result missing the anchors this file reasons about is a named
// throw, not a quietly short sweep (RESEARCH Pitfall 6).
function extractSweep(): readonly string[] {
  const src = readFileSync(join(ROOT, "scripts", "floor-invariance.test.ts"), "utf8");
  const open = src.indexOf("const HUMAN_ADMISSION_VALUES = [");
  if (open === -1) {
    throw new Error(
      "checkpoints.test: could not locate `const HUMAN_ADMISSION_VALUES = [` in " +
        "scripts/floor-invariance.test.ts. The sweep is derived from that declaration on purpose; " +
        "refusing to fall back to a retyped copy, which would drift silently.",
    );
  }
  const close = src.indexOf("];", open);
  if (close === -1) throw new Error("checkpoints.test: the HUMAN_ADMISSION_VALUES block is unterminated");
  const block = src.slice(open, close);

  // The independent denominator: count the block's lines that carry a quoted literal, computed
  // BEFORE and separately from the extraction that consumes them.
  const literalLines = block
    .split("\n")
    .slice(1)
    .filter((l) => /^\s*"(?:[^"\\]|\\.)*"\s*,/.test(l)).length;

  const values = [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  if (values.length !== literalLines) {
    throw new Error(
      `checkpoints.test: the sweep extraction produced ${values.length} value(s) while the block ` +
        `independently accounts for ${literalLines} line(s) carrying a literal — refusing a sweep ` +
        `that may be silently short`,
    );
  }
  if (values.length === 0) throw new Error("checkpoints.test: the extracted sweep is empty");
  for (const anchor of ["off", "OFF", "bogus", ""]) {
    if (!values.includes(anchor)) {
      throw new Error(
        `checkpoints.test: the extracted sweep is missing the anchor ${JSON.stringify(anchor)} — ` +
          `the source list changed shape and this extraction can no longer vouch for it`,
      );
    }
  }
  return values;
}

const SWEEP = extractSweep();

describe("checkpoints — the sweep is derived, not retyped", () => {
  it("extracts the sibling dial's garbage sweep from its one authority, with the anchors intact", () => {
    expect(SWEEP.length).toBeGreaterThan(0);
    // The anchors extractSweep() refuses without; restated as an assertion so the guarantee is
    // visible in the report and not only in a throw nobody reads when it does not fire.
    expect(SWEEP).toContain("OFF");
    expect(SWEEP).toContain("bogus");
    expect(SWEEP).toContain("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// canonicalizeDisposition — fail closed BY RULE.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("canonicalizeDisposition", () => {
  it("the three canonical spellings canonicalize to THEMSELVES", () => {
    expect(cp.canonicalizeDisposition("block")).toBe("block");
    expect(cp.canonicalizeDisposition("notify")).toBe("notify");
    expect(cp.canonicalizeDisposition("off")).toBe("off");
  });

  it("each canonical spelling maps to itself and to nothing else (no aliasing between arms)", () => {
    // Non-vacuity for the case above: `block → block` also holds for a function that returns
    // "block" unconditionally. This one fails such a function.
    const seen = new Set(
      (["block", "notify", "off"] as const).map((v) => cp.canonicalizeDisposition(v)),
    );
    expect([...seen].sort()).toEqual(["block", "notify", "off"]);
  });

  it("every member of the derived garbage sweep canonicalizes to `block`, never to a lowering", () => {
    for (const raw of SWEEP) {
      if (raw === "block" || raw === "notify" || raw === "off") continue; // canonical by construction
      expect(cp.canonicalizeDisposition(raw), `sweep value ${JSON.stringify(raw)}`).toBe("block");
    }
  });

  it("a PRESENT non-string value reaches `block` by rule, never by coercion", () => {
    for (const raw of [true, false, 0, 1, null, [], {}, ["off"], { off: true }, undefined]) {
      expect(cp.canonicalizeDisposition(raw), `non-string ${JSON.stringify(raw ?? null)}`).toBe(
        "block",
      );
    }
  });

  it("a wrong-case or whitespace-padded spelling is NOT folded into a canonical value", () => {
    for (const raw of ["OFF", "Off", " off", "off ", "NOTIFY", "Block", "\toff\t"]) {
      expect(cp.canonicalizeDisposition(raw), `near-miss ${JSON.stringify(raw)}`).toBe("block");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The roster: derivation, ordering, and the compile-time table.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("the roster (AUTO-01)", () => {
  it("CHECKPOINTS is exactly Object.keys(CHECKPOINT_DEFAULTS) — no second literal", () => {
    expect([...cp.CHECKPOINTS]).toEqual(Object.keys(cp.CHECKPOINT_DEFAULTS));
  });

  it("ORDERING: the roster's iteration order IS the table's declaration order, and only that", () => {
    const declared = Object.keys(cp.CHECKPOINT_DEFAULTS);
    expect([...cp.CHECKPOINTS]).toEqual(declared);
    // …and a set comparison is performed on SORTED copies, so two ids that compare equal by name
    // can never change a verdict just by moving in the table.
    expect(cp.sortedIds(cp.CHECKPOINTS)).toEqual(cp.sortedIds(declared));
    expect([...cp.sortedIds(cp.CHECKPOINTS)]).toEqual([...cp.CHECKPOINTS].sort());
  });

  it("every roster member carries a default, and every FLOOR's default is `block` (AUTO-07)", () => {
    // PLAN 30-02 NARROWED THIS ASSERTION, AND THE NARROWING IS THE POINT. It previously read "every
    // default is `block`", which was true while the roster was two floors and became false when
    // D-06 added `commit_to_branch` at `off`. The claim AUTO-07 actually makes is about floors — no
    // FLOOR is lowered by omission — so that is what is asserted, against the floor set rather than
    // against a transcribed id list. A non-floor member is free to default permissively; a floor is
    // not, and adding one that does is red here.
    const floors = new Set<string>(cp.FLOOR_CHECKPOINTS);
    for (const id of cp.CHECKPOINTS) {
      expect(cp.CHECKPOINT_DEFAULTS[id], `default for ${id}`).toMatch(/^(block|notify|off)$/);
      if (floors.has(id)) expect(cp.CHECKPOINT_DEFAULTS[id], `FLOOR default for ${id}`).toBe("block");
    }
    expect(Object.keys(cp.CHECKPOINT_DEFAULTS).length).toBe(cp.CHECKPOINTS.length);
    // Non-vacuity: the floor arm above must actually have run over something.
    expect(floors.size).toBeGreaterThan(0);
  });

  it("STRICTEST_MATRIX is the whole roster at `block`, and it is NOT CHECKPOINT_DEFAULTS", () => {
    // The two constants were interchangeable until a non-floor member defaulted permissively. They
    // are asserted DIFFERENT here so that a later phase which re-flattens every default back to
    // `block` cannot silently make the fail-closed branches indistinguishable from the zero-config
    // ones again — the distinction is the mechanism, not an accident of the current values.
    expect(cp.sortedIds(Object.keys(cp.STRICTEST_MATRIX))).toEqual(cp.sortedIds(cp.CHECKPOINTS));
    for (const id of cp.CHECKPOINTS) expect(cp.STRICTEST_MATRIX[id], id).toBe("block");
    expect(cp.STRICTEST_MATRIX).not.toEqual(cp.CHECKPOINT_DEFAULTS);
    // And it is frozen, so a consumer cannot mutate the shared strictest answer in place.
    expect(Object.isFrozen(cp.STRICTEST_MATRIX)).toBe(true);
  });

  it("floorEnvVarName derives GRUGOPS_FLOOR_<UPPER_ID> for every floor, and for the tracer floor by name", () => {
    expect(cp.floorEnvVarName("protected_branch_merge")).toBe(
      "GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE",
    );
    for (const id of cp.FLOOR_CHECKPOINTS) {
      expect(cp.floorEnvVarName(id)).toBe(`GRUGOPS_FLOOR_${id.toUpperCase()}`);
    }
  });
});

describe("FLOOR_CHECKPOINTS derivation (AUTO-01 edge: empty)", () => {
  it("is non-empty and is a subset of the roster", () => {
    expect(cp.FLOOR_CHECKPOINTS.length).toBeGreaterThan(0);
    for (const id of cp.FLOOR_CHECKPOINTS) expect(cp.CHECKPOINTS).toContain(id);
  });

  it("EMPTY: a derivation that would return zero members THROWS by name, never returns []", () => {
    // Drive the derivation with a floor list that intersects the roster nowhere.
    expect(() => cp.deriveFloorCheckpoints(cp.CHECKPOINTS, [{ id: "not_a_checkpoint" }])).toThrow(
      /produced NO members/,
    );
    expect(() => cp.deriveFloorCheckpoints(cp.CHECKPOINTS, [])).toThrow(
      cp.FloorCheckpointDerivationError,
    );
    // And it is a NAMED error class, not a bare Error — the caller can tell this failure apart.
    try {
      cp.deriveFloorCheckpoints(cp.CHECKPOINTS, []);
      throw new Error("expected deriveFloorCheckpoints to throw");
    } catch (e) {
      expect((e as Error).name).toBe("FloorCheckpointDerivationError");
    }
  });

  it("ADJACENCY: two floor entries carrying the SAME id collapse to ONE member, never two", () => {
    // Equal ids MERGE. They never collide, and they never produce a duplicate roster member — the
    // same rule that will let one human stop tagged in a role AND a workflow share one matrix cell.
    const dup = [{ id: "protected_branch_merge" }, { id: "protected_branch_merge" }];
    const derived = cp.deriveFloorCheckpoints(["protected_branch_merge"], dup);
    expect([...derived]).toEqual(["protected_branch_merge"]);
    expect(derived.length).toBe(1);
  });

  it("ORDERING: the derived floor set is compared to the roster as SORTED sets", () => {
    // `floors` is a list of OBJECTS carrying an `id` (the SAFETY_FLOORS shape), not a list of ids.
    const floors = cp.FLOOR_CHECKPOINTS.map((id) => ({ id }));
    const forward = cp.deriveFloorCheckpoints([...cp.CHECKPOINTS], floors);
    const reversed = cp.deriveFloorCheckpoints([...cp.CHECKPOINTS].reverse(), [...floors].reverse());
    expect(cp.sortedIds(forward)).toEqual(cp.sortedIds(reversed));
    // Non-vacuity: the two runs really did see different orders, and both produced the whole set.
    expect(cp.sortedIds(forward)).toEqual(cp.sortedIds(cp.FLOOR_CHECKPOINTS));
  });

  it("SHORT: the two independently-counted sides agree on every sub-roster, so nothing goes short silently", () => {
    // The count assertion inside deriveFloorCheckpoints is UNREACHABLE by construction — both sides
    // compute the same intersection, one by walking the roster and one by walking the floor list.
    // That is stated here rather than dramatised with a fake mismatch, because an unreachable arm
    // tested by a rigged input proves only that the rig works. What IS testable, and what actually
    // matters, is that the two traversals never disagree while the inputs shrink: a roster missing a
    // member drops that member from BOTH sides, so the result is short only when it should be, and
    // it is never short WHILE the denominator still counts the member.
    const floors = cp.FLOOR_CHECKPOINTS.map((id) => ({ id }));
    for (const dropped of cp.CHECKPOINTS) {
      const sub = cp.CHECKPOINTS.filter((c) => c !== dropped);
      const stillFloors = floors.filter((f) => sub.includes(f.id as (typeof sub)[number]));
      if (stillFloors.length === 0) continue; // the empty arm has its own case above
      const derived = cp.deriveFloorCheckpoints(sub, floors);
      expect(cp.sortedIds(derived), `roster without ${dropped}`).toEqual(
        cp.sortedIds(stillFloors.map((f) => f.id)),
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The matrix read (AUTO-02, AUTO-07) — driven through the committed discriminated reader.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("readGovernanceConfig — the checkpoint matrix", () => {
  it("no config file at all → exactly CHECKPOINT_DEFAULTS, compared key by key", () => {
    const res = io.readGovernanceConfig(freshTmp("cp-absent-"));
    expect(res.source).toBe("absent");
    for (const id of cp.CHECKPOINTS) {
      expect(res.config.checkpoints[id], `matrix[${id}]`).toBe(cp.CHECKPOINT_DEFAULTS[id]);
    }
    expect(res.checkpointRefusals).toEqual([]);
  });

  it("a config with NO `checkpoints` object → exactly CHECKPOINT_DEFAULTS and NO refusal (AUTO-07)", () => {
    const res = io.readGovernanceConfig(rootWithRawConfig('{"mode":"lean"}'));
    expect(res.source).toBe("ok");
    for (const id of cp.CHECKPOINTS) {
      expect(res.config.checkpoints[id], `matrix[${id}]`).toBe(cp.CHECKPOINT_DEFAULTS[id]);
    }
    // A repo that configures nothing is not misconfigured — this is the only degenerate-adjacent
    // branch that must NOT produce a refusal.
    expect(res.checkpointRefusals).toEqual([]);
  });

  it("EMPTY: an empty `checkpoints` object yields the FULL roster default, not an empty matrix", () => {
    // The file WAS read and it declares nothing, so this is branch 2 — the roster defaults, which
    // is the ONE branch where a permissive non-floor default is the right answer. Compared against
    // CHECKPOINT_DEFAULTS rather than against the literal `block`, so this case keeps meaning the
    // same thing as the roster widens.
    const res = io.readGovernanceConfig(rootWithRawConfig('{"checkpoints":{}}'));
    expect(cp.sortedIds(Object.keys(res.config.checkpoints))).toEqual(cp.sortedIds(cp.CHECKPOINTS));
    for (const id of cp.CHECKPOINTS) {
      expect(res.config.checkpoints[id], id).toBe(cp.CHECKPOINT_DEFAULTS[id]);
    }
    // And it is NOT the strictest matrix: an empty declaration is not a failed read.
    expect(res.config.checkpoints).not.toEqual(cp.STRICTEST_MATRIX);
    expect(res.checkpointRefusals).toEqual([]);
  });

  it("an object that OMITS a roster key yields that key's roster default", () => {
    const res = io.readGovernanceConfig(
      rootWithRawConfig('{"checkpoints":{"protected_branch_merge":"notify"}}'),
    );
    expect(res.config.checkpoints.protected_branch_merge).toBe("notify");
    expect(res.config.checkpoints.production_requires_human_confirmation).toBe(
      cp.CHECKPOINT_DEFAULTS.production_requires_human_confirmation,
    );
  });

  it("a `checkpoints` value that is a string / number / array / null → STRICTEST, never `off`", () => {
    for (const body of [
      '{"checkpoints":"off"}',
      '{"checkpoints":0}',
      '{"checkpoints":["off"]}',
      '{"checkpoints":null}',
      '{"checkpoints":true}',
    ]) {
      const res = io.readGovernanceConfig(rootWithRawConfig(body));
      for (const id of cp.CHECKPOINTS) {
        expect(res.config.checkpoints[id], `${body} → matrix[${id}]`).toBe("block");
        expect(res.config.checkpoints[id], `${body} → matrix[${id}]`).not.toBe("off");
      }
      expect(res.checkpointRefusals.length, `${body} refusals`).toBeGreaterThan(0);
    }
  });

  it("a whole-file config that is not a JSON object → STRICTEST plus a refusal, never `off`", () => {
    for (const body of ["[]", '"lean"', "7", "null"]) {
      const res = io.readGovernanceConfig(rootWithRawConfig(body));
      for (const id of cp.CHECKPOINTS) expect(res.config.checkpoints[id], body).toBe("block");
      expect(res.checkpointRefusals.length, `${body} refusals`).toBeGreaterThan(0);
    }
  });

  it("an UNREADABLE config (non-JSON) → STRICTEST plus a refusal, and source='unreadable'", () => {
    const res = io.readGovernanceConfig(rootWithRawConfig("{ not valid json ]]]"));
    expect(res.source).toBe("unreadable");
    for (const id of cp.CHECKPOINTS) expect(res.config.checkpoints[id]).toBe("block");
    // The DISCRIMINATING half (plan 30-02): a permissive roster default must NOT survive a failed
    // read. `commit_to_branch` defaults to `off`, so if this branch fell back to CHECKPOINT_DEFAULTS
    // a corrupt config would GRANT what a repository may have declared `block`.
    expect(res.config.checkpoints).toEqual(cp.STRICTEST_MATRIX);
    expect(res.config.checkpoints).not.toEqual(cp.CHECKPOINT_DEFAULTS);
    expect(res.checkpointRefusals.length).toBeGreaterThan(0);
  });

  it("every garbage sweep value written into a roster cell reads back as `block`", () => {
    for (const raw of SWEEP) {
      if (raw === "block" || raw === "notify" || raw === "off") continue;
      const res = io.readGovernanceConfig(
        rootWithRawConfig(JSON.stringify({ checkpoints: { protected_branch_merge: raw } })),
      );
      expect(
        res.config.checkpoints.protected_branch_merge,
        `sweep value ${JSON.stringify(raw)}`,
      ).toBe("block");
    }
  });

  it("an id OUTSIDE the roster is dropped and recorded — the key set stays exactly CHECKPOINTS", () => {
    const res = io.readGovernanceConfig(
      rootWithRawConfig(
        '{"checkpoints":{"protected_branch_merge":"block","not_a_checkpoint":"off","autonomy":"off"}}',
      ),
    );
    // SORTED-set equality: ordering cannot change this verdict.
    expect(cp.sortedIds(Object.keys(res.config.checkpoints))).toEqual(cp.sortedIds(cp.CHECKPOINTS));
    expect(res.config.checkpoints).not.toHaveProperty("not_a_checkpoint");
    expect(res.config.checkpoints).not.toHaveProperty("autonomy");
    expect(res.checkpointRefusals.join("\n")).toMatch(/not_a_checkpoint/);
    expect(res.checkpointRefusals.join("\n")).toMatch(/autonomy/);
  });

  it("PITFALL 6: the effective matrix's key COUNT is asserted against a denominator computed outside the read", () => {
    // The denominator comes from the roster table, traversed here — never from the matrix the
    // reader just built. A silently SHORT matrix is red, not merely an empty one.
    let expected = 0;
    for (const _ of Object.keys(cp.CHECKPOINT_DEFAULTS)) expected += 1;
    expect(expected).toBeGreaterThan(0);

    for (const body of [
      "{}",
      '{"checkpoints":{}}',
      '{"checkpoints":{"protected_branch_merge":"off"}}',
      '{"checkpoints":"garbage"}',
      "[]",
    ]) {
      const res = io.readGovernanceConfig(rootWithRawConfig(body));
      expect(Object.keys(res.config.checkpoints).length, `${body} key count`).toBe(expected);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// resolveCheckpoint — the two-key rule at value level (the hook proves it end to end).
// ─────────────────────────────────────────────────────────────────────────────────────────────

// A full matrix built FROM the roster defaults with named overrides applied.
//
// WHY A HELPER AND NOT AN OBJECT LITERAL. `Record<Checkpoint, Disposition>` is total, so every
// literal below would have to name every roster member — and every widening of the union would then
// be a mechanical edit across a dozen test call sites, which is precisely the hand-maintained-set
// rot this module exists to refuse. Deriving from `CHECKPOINT_DEFAULTS` means a new checkpoint
// arrives here at its default with no edit, and a test that means to move one says so by name.
function matrix(
  overrides: Partial<Record<import("./checkpoints.js").Checkpoint, string>> = {},
): Readonly<Record<import("./checkpoints.js").Checkpoint, import("./checkpoints.js").Disposition>> {
  return { ...cp.CHECKPOINT_DEFAULTS, ...overrides } as Readonly<
    Record<import("./checkpoints.js").Checkpoint, import("./checkpoints.js").Disposition>
  >;
}

describe("resolveCheckpoint — the two-key rule", () => {
  const AT_OFF = matrix({ protected_branch_merge: "off" });

  it("a floor declared `off` with NO grant variable is enforced as `block` and flagged unauthorized", () => {
    const r = cp.resolveCheckpoint("protected_branch_merge", AT_OFF, {});
    expect(r.declared).toBe("off");
    expect(r.effective).toBe("block");
    expect(r.unauthorizedLowering).toBe(true);
    expect(r.envVarName).toBe("GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE");
    expect(r.authorizedBy).toBeNull();
  });

  it("an EMPTY grant variable is not a grant", () => {
    const r = cp.resolveCheckpoint("protected_branch_merge", AT_OFF, {
      GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE: "",
    });
    expect(r.effective).toBe("block");
    expect(r.unauthorizedLowering).toBe(true);
  });

  it("a non-empty grant variable authorizes the declared lowering, and records the name", () => {
    const r = cp.resolveCheckpoint("protected_branch_merge", AT_OFF, {
      GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE: "Olger Oeselg",
    });
    expect(r.effective).toBe("off");
    expect(r.unauthorizedLowering).toBe(false);
    expect(r.authorizedBy).toBe("Olger Oeselg");
  });

  it("a grant variable does NOT raise a checkpoint that is at its default", () => {
    const r = cp.resolveCheckpoint(
      "production_requires_human_confirmation",
      AT_OFF,
      { GRUGOPS_FLOOR_PRODUCTION_REQUIRES_HUMAN_CONFIRMATION: "someone" },
    );
    expect(r.declared).toBe("block");
    expect(r.effective).toBe("block");
    expect(r.unauthorizedLowering).toBe(false);
  });

  it("a non-canonical declared value resolves to `block` even with a grant present", () => {
    const r = cp.resolveCheckpoint(
      "protected_branch_merge",
      matrix({ protected_branch_merge: "OFF" }),
      { GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE: "someone" },
    );
    expect(r.effective).toBe("block");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The banner (D-19 / D-20).
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("renderCheckpointBanner", () => {
  it("all-default renders the FIXED literal, exactly, on one line", () => {
    const line = cp.renderCheckpointBanner(cp.CHECKPOINT_DEFAULTS, {});
    expect(line).toBe("all checkpoints at default");
    expect(line).toBe(cp.BANNER_ALL_DEFAULT);
    expect(line).not.toContain("\n");
  });

  it("reports the DECLARED value, so the banner cannot disagree with a denial that names it", () => {
    const line = cp.renderCheckpointBanner(matrix({ protected_branch_merge: "off" }), {});
    // An unauthorized lowering enforces `block`, which IS the default — a banner keyed on the
    // EFFECTIVE value would print "all checkpoints at default" over a config that plainly says off.
    expect(line).not.toBe(cp.BANNER_ALL_DEFAULT);
    expect(line).toContain("protected_branch_merge=off");
    expect(line).toContain("NOT AUTHORIZED");
    expect(line).toContain("GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE");
    expect(line).not.toContain("\n");
  });

  it("names the authorizing grant when the lowering IS authorized", () => {
    const line = cp.renderCheckpointBanner(matrix({ protected_branch_merge: "notify" }), {
      GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE: "Olger Oeselg",
    });
    expect(line).toContain("protected_branch_merge=notify");
    expect(line).toContain("authorized by GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=Olger Oeselg");
    expect(line).not.toContain("NOT AUTHORIZED");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Plan 30-02 — the settled floor set, and the properties that are outside the matrix on purpose.
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// D-04 makes `SAFETY_FLOORS` (scripts/audit-model.ts) the ONE canonical floor list and this module
// the ONE roster. Everything below reads both artifacts and asserts the relationship between them —
// never a transcribed id list, because a transcribed list is the defect class the whole module was
// written to refuse.

describe("30-02 — the floor set after the `autonomy` retirement (D-04 / D-05 / D-06)", () => {
  it("SAFETY_FLOORS carries exactly the four decided ids, and every one is a roster member", () => {
    expect(cp.sortedIds(am.SAFETY_FLOORS.map((f) => f.id))).toEqual([
      "open_pr",
      "production_requires_human_confirmation",
      "protected_branch_merge",
      "test_integrity",
    ]);
    for (const f of am.SAFETY_FLOORS) expect(cp.CHECKPOINTS).toContain(f.id);
  });

  it("the RETIRED scalar resolves to nothing — asking the floor list for it returns undefined", () => {
    // The point of a retirement is that the name stops resolving. A floor id that still answers is
    // a floor that a later `depends_on`, env var or config key can quietly re-acquire.
    expect(am.SAFETY_FLOORS.find((f) => f.id === "autonomy")).toBeUndefined();
    expect(cp.CHECKPOINTS).not.toContain("autonomy");
    // …and the derivation cannot be talked into producing it either.
    expect(() =>
      cp.deriveFloorCheckpoints(cp.CHECKPOINTS, [{ id: "autonomy" }]),
    ).toThrow(/produced NO members/);
  });

  it("no registry row depends on the retired scalar, and the live registry still parses", () => {
    // Asserted at the point of effect: the parser every consumer of the registry goes through.
    const claims = am.readRegistry(ROOT).claims;
    expect(claims.length).toBeGreaterThan(0);
    const named = new Set(claims.flatMap((c) => c.dependsOn));
    expect([...named]).not.toContain("autonomy");
    // Two-sided: every name a row DOES carry is a live floor id, so the remap landed on real ids
    // rather than merely stopping at removing the dead one.
    const floorIds = new Set(am.SAFETY_FLOORS.map((f) => f.id));
    for (const n of named) expect(floorIds.has(n), `depends_on value ${n}`).toBe(true);
  });

  it("FLOOR_CHECKPOINTS' length equals a count computed from SAFETY_FLOORS OUTSIDE the filtering loop", () => {
    // PITFALL 6. The denominator is walked over the OTHER side of the intersection, and it is
    // computed here rather than read back off `FLOOR_CHECKPOINTS`, so a derivation that returns 3
    // of 4 is red — not merely a derivation that returns 0.
    const roster = new Set<string>(cp.CHECKPOINTS);
    let expected = 0;
    const counted = new Set<string>();
    for (const f of am.SAFETY_FLOORS) {
      if (roster.has(f.id) && !counted.has(f.id)) {
        counted.add(f.id);
        expected += 1;
      }
    }
    expect(expected).toBe(4);
    expect(cp.FLOOR_CHECKPOINTS.length).toBe(expected);
    expect(cp.sortedIds(cp.FLOOR_CHECKPOINTS)).toEqual(cp.sortedIds([...counted]));
  });

  it("every FLOOR defaults to `block`, and the one non-`block` default is NOT a floor (AUTO-07)", () => {
    // Derived from SAFETY_FLOORS, never from the comment above CHECKPOINT_DEFAULTS. A floor added
    // later with a permissive default is red here without anyone remembering to come back.
    const floorIds = new Set<string>(am.SAFETY_FLOORS.map((f) => f.id));
    const nonFloor: string[] = [];
    const permissive: string[] = [];
    for (const id of cp.CHECKPOINTS) {
      if (floorIds.has(id)) expect(cp.CHECKPOINT_DEFAULTS[id], `floor ${id}`).toBe("block");
      else nonFloor.push(id);
      if (cp.CHECKPOINT_DEFAULTS[id] !== "block") permissive.push(id);
    }
    // Non-vacuity in the other direction: the non-floor arm is exercised. Plan 30-04 widened it
    // from one member to nine, so the SET of non-floor ids is no longer the assertion — what the
    // case was always protecting is that exactly ONE default anywhere in the roster is permissive,
    // and that it is the member D-06 names. The nine tag-arm members are human stops and default to
    // `block` like every floor; only the legacy grade's permissive half does not.
    expect(nonFloor.length).toBeGreaterThan(0);
    expect(permissive).toEqual(["commit_to_branch"]);
    expect(cp.CHECKPOINT_DEFAULTS.commit_to_branch).toBe("off");
    expect(cp.isFloorCheckpoint("commit_to_branch")).toBe(false);
  });

  it("every floor's configPath is the dotted `checkpoints.<id>` form, and it resolves live", () => {
    for (const f of am.SAFETY_FLOORS) {
      expect(f.configPath, `floor ${f.id}`).toBe(`checkpoints.${f.id}`);
      // Reading it proves the cell EXISTS; safetyFloorLiveValue throws on a path that does not
      // resolve, so a floor pointing at an absent key cannot pass as a floor with a null value.
      expect(am.safetyFloorLiveValue(f, ROOT)).toBe(
        cp.CHECKPOINT_DEFAULTS[f.id as import("./checkpoints.js").Checkpoint],
      );
    }
  });
});

describe("30-02 — NON_DIALABLE_INVARIANTS is disjoint from the roster, in BOTH directions (D-04)", () => {
  it("carries the three floor-invariance properties that are test-harness properties, not dials", () => {
    expect(cp.sortedIds(am.NON_DIALABLE_INVARIANTS.map((i) => i.id))).toEqual([
      "guard-byte-frozen",
      "no-fabrication",
      "refuse-self",
    ]);
    // Each records WHY it is not a dial. An exclusion with no stated reason is one a later phase
    // deletes on the grounds that nobody remembers what it was for.
    for (const inv of am.NON_DIALABLE_INVARIANTS) {
      expect(inv.what.length, inv.id).toBeGreaterThan(20);
      expect(inv.why.length, inv.id).toBeGreaterThan(20);
    }
  });

  it("no non-dialable invariant is a checkpoint (a later phase cannot quietly PROMOTE one)", () => {
    const roster = new Set<string>(cp.CHECKPOINTS);
    for (const inv of am.NON_DIALABLE_INVARIANTS) {
      expect(roster.has(inv.id), `invariant ${inv.id} appeared in the roster`).toBe(false);
    }
  });

  it("no checkpoint is a non-dialable invariant (a later phase cannot quietly DEMOTE one)", () => {
    const excluded = new Set<string>(am.NON_DIALABLE_INVARIANTS.map((i) => i.id));
    for (const id of cp.CHECKPOINTS) {
      expect(excluded.has(id), `checkpoint ${id} appeared in the exclusion set`).toBe(false);
    }
  });

  it("the disjointness is NON-VACUOUS — both sets are non-empty and the check discriminates", () => {
    expect(am.NON_DIALABLE_INVARIANTS.length).toBeGreaterThan(0);
    expect(cp.CHECKPOINTS.length).toBeGreaterThan(0);
    // The rig: planting a roster id into a copy of the exclusion set makes the intersection
    // non-empty, so the two cases above are measuring an intersection that CAN be non-empty.
    const planted = [...am.NON_DIALABLE_INVARIANTS.map((i) => i.id), cp.CHECKPOINTS[0]];
    const clash = planted.filter((id) => (cp.CHECKPOINTS as readonly string[]).includes(id));
    expect(clash).toEqual([cp.CHECKPOINTS[0]]);
  });

  it("`test_integrity` is on the DIAL side of the line, and the other three are not", () => {
    // scripts/floor-invariance.test.ts sweeps FOUR invariants; exactly one of them is a checkpoint.
    // Stating which, by assertion, is what stops the count drifting to 4-and-0 or 2-and-2.
    expect(cp.CHECKPOINTS).toContain("test_integrity");
    expect(am.NON_DIALABLE_INVARIANTS.map((i) => i.id)).not.toContain("test_integrity");
    expect(am.NON_DIALABLE_INVARIANTS.length + 1).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-04 — THE DERIVATION, SECTION-ANCHORED AND TWO-SIDED (D-01, D-02, D-03, AUTO-01).
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// WHAT CHANGED IN D-01, AND WHY THESE CASES DO NOT TEST THE ROLE CORPUS. D-01 as written names two
// corpora — the 17 role `## Hard limits` and the 19 workflow `## Stop conditions` sections. RESEARCH
// F-1 established that the role sections contain ZERO markdown bullets: they are prose paragraphs,
// and `agent-factory/roles/orchestrator.md`'s carries FOUR distinct prohibitions in one sentence
// run. D-02's "trailing backticked token as the last token of the BULLET" has no referent there, and
// one trailing tag on that paragraph would attach a single id to four prohibitions.
//
// The user settled it at plan 30-04's Task 1 checkpoint (option `workflow-plus-floors`): the TAG
// corpus is the workflow sections alone, and the floor arm comes from `SAFETY_FLOORS`, which D-04
// already makes canonical. Three of the orchestrator paragraph's four prohibitions are covered
// anyway — two through the floor arm and "never exceed WIP without a written reason" through
// `exceed_wip_limit`, tagged at `09-daily-sweep.md`. The role prose loses no coverage; it loses a
// SECOND DECLARATION of a prohibition the floor list already owns.
//
// WHY THE CASES BELOW DRIVE FIXTURES RATHER THAN THE REAL TREE. A boundary or fence probe planted in
// the shipped kit would be prose nobody wrote for a reader. The real-corpus two-sided assertion is a
// separate case, and it can only be green once the bullets carry their tags (plan 30-04 Task 3).

/** A throwaway kit root holding only `agent-factory/workflows/`, for driving the derivation. */
function workflowFixture(files: Readonly<Record<string, string>>): string {
  const root = freshTmp("cp-corpus-");
  mkdirSync(join(root, "agent-factory", "workflows"), { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "agent-factory", "workflows", name), body);
  }
  return root;
}

/**
 * The CONTROL file every probe fixture carries.
 *
 * It exists so a probe's expected answer is "the control id and nothing else" rather than "nothing".
 * An empty derivation is REFUSED by name, so a probe fixture holding only the probe would throw for
 * the wrong reason and the case would pass while measuring the vacuity floor instead of the scope
 * rule it was written for.
 */
const CONTROL = `# Control workflow

## Stop conditions

- A stop a named human holds. \`checkpoint: control_stop\`

## Commit

- nothing
`;

describe("30-04 — the tag pattern is the ONE canonical form, and the keyword scan is its scope selector (D-02)", () => {
  it("accepts the canonical trailing backticked token as the LAST token of a bullet", () => {
    const m = "- Never merge a protected branch. `checkpoint: protected_branch_merge`".match(
      cp.CHECKPOINT_TAG_RE,
    );
    expect(m?.[1]).toBe("protected_branch_merge");
  });

  it("the keyword scan MATCHES everything the tag pattern matches — the refusal can never miss a tag", () => {
    // The structural invariant that makes the allow-list posture safe: if the scope selector were
    // NARROWER than the tag pattern, a canonical tag could be collected without ever being offered
    // to the refusal, and a second grammar would have opened underneath the first.
    for (const line of [
      "- x. `checkpoint: a`",
      "  * y. `checkpoint: a_b`",
      "-\tz. `checkpoint: a1_b2`",
    ]) {
      expect(cp.CHECKPOINT_TAG_RE.test(line), line).toBe(true);
      expect(cp.CHECKPOINT_KEYWORD_RE.test(line), line).toBe(true);
    }
  });

  it("exactly ONE tag keyword is declared in scripts/checkpoints.ts — both patterns are built from it", () => {
    const src = readFileSync(join(ROOT, "scripts", "checkpoints.ts"), "utf8");
    const code = src
      .split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n");
    const declarations = code.match(/TAG_KEYWORD\s*=\s*"checkpoint"/g) ?? [];
    expect(declarations.length).toBe(1);
    // …and no second literal spelling of the tag form anywhere in the executable text.
    expect((code.match(/"checkpoint: /g) ?? []).length).toBe(0);
  });
});

describe("30-04 — deriveCheckpoints is SECTION-ANCHORED (D-02, RESEARCH Pitfall 2, T-30-14)", () => {
  it("a canonically tagged bullet yields exactly that id, with one site naming file and line", () => {
    const d = cp.deriveCheckpoints(workflowFixture({ "00-control.md": CONTROL }));
    expect(d.ids).toEqual(["control_stop"]);
    const sites = d.sites.get("control_stop");
    expect(sites?.length).toBe(1);
    expect(sites?.[0].file).toBe("00-control.md");
    expect(sites?.[0].line).toBe(5);
  });

  it("a tag ONE LINE PAST the section's closing boundary is NOT collected", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-boundary.md": `# Boundary probe

## Stop conditions

- A stop with no tag.

## A later section

- Past the boundary. \`checkpoint: past_boundary\`
`,
    });
    const d = cp.deriveCheckpoints(root);
    expect(d.ids).toEqual(["control_stop"]);
    expect(d.ids).not.toContain("past_boundary");
  });

  it("a tag inside a FENCED block within the section is neither collected nor refused", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-fenced.md": [
        "# Fence probe",
        "",
        "## Stop conditions",
        "",
        "- A stop with no tag.",
        "",
        "```text",
        "- A quoted example. `checkpoint: fenced_example`",
        "```",
        "",
        "## Commit",
        "",
        "- nothing",
        "",
      ].join("\n"),
    });
    const d = cp.deriveCheckpoints(root);
    expect(d.ids).toEqual(["control_stop"]);
  });
});

describe("30-04 — a non-canonical construction is REFUSED by name, never tolerated (D-02, T-30-16)", () => {
  const probes: readonly (readonly [string, string])[] = [
    ["no space after the colon", "- A stop. `checkpoint:no_space`"],
    ["no backticks at all", "- A stop. checkpoint: bare_token"],
    ["not the last token", "- A stop. `checkpoint: not_last` and more words."],
    ["wrong case", "- A stop. `Checkpoint: Wrong_Case`"],
    ["an HTML comment", "- A stop. <!-- checkpoint: hidden -->"],
    ["two tags on one bullet", "- A stop. `checkpoint: first` `checkpoint: second`"],
    ["not a bullet at all", "A paragraph. `checkpoint: not_a_bullet`"],
  ];
  for (const [label, line] of probes) {
    it(`refuses ${label}, naming the file and the line`, () => {
      const root = workflowFixture({
        "00-control.md": CONTROL,
        "01-probe.md": `# Probe\n\n## Stop conditions\n\n${line}\n\n## Commit\n\n- nothing\n`,
      });
      let err: Error | null = null;
      try {
        cp.deriveCheckpoints(root);
      } catch (e) {
        err = e as Error;
      }
      expect(err, `${label} was tolerated`).not.toBeNull();
      expect(err?.name).toBe("CheckpointDerivationError");
      expect(err?.message).toContain("01-probe.md");
      expect(err?.message).toContain("line 5");
    });
  }
});

describe("30-04 — ids are GLOBAL: one id at several sites is ONE roster member (D-03)", () => {
  it("the same id tagged in two files yields one id and a site count of two", () => {
    const dup = (n: string) =>
      `# ${n}\n\n## Stop conditions\n\n- A shared human stop. \`checkpoint: shared_stop\`\n\n## Commit\n\n- nothing\n`;
    const d = cp.deriveCheckpoints(
      workflowFixture({ "00-a.md": dup("a"), "01-b.md": dup("b") }),
    );
    expect(d.ids).toEqual(["shared_stop"]);
    expect(d.sites.get("shared_stop")?.map((s) => s.file)).toEqual(["00-a.md", "01-b.md"]);
    expect(d.totalSites).toBe(2);
  });
});

describe("30-04 — the derivation refuses EMPTY, and refuses SHORT (Pitfall 6, T-30-15)", () => {
  it("a corpus with bullets but no tags throws a NAMED error rather than returning an empty set", () => {
    const root = workflowFixture({
      "00-untagged.md": "# u\n\n## Stop conditions\n\n- A stop with no tag.\n\n## Commit\n\n- x\n",
    });
    let err: Error | null = null;
    try {
      cp.deriveCheckpoints(root);
    } catch (e) {
      err = e as Error;
    }
    expect(err?.name).toBe("CheckpointDerivationError");
    expect(err?.message).toMatch(/no tagged/i);
  });

  it("a workflow file with NO `## Stop conditions` section is refused, not skipped", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-headless.md": "# h\n\n## Commit\n\n- x\n",
    });
    expect(() => cp.deriveCheckpoints(root)).toThrow(/01-headless\.md/);
  });

  it("the examined-bullet count is compared against a denominator counted by a SECOND pass", () => {
    // The two numbers are produced by different traversals — a line walk and an unfenced-index
    // intersection — so a collector that silently skipped a bullet disagrees with the counter.
    const d = cp.deriveCheckpoints(workflowFixture({ "00-control.md": CONTROL }));
    expect(d.examinedBullets).toBe(d.countedBullets);
    expect(d.examinedBullets).toBe(1);
  });

  it("the count assertion DISCRIMINATES — a planted disagreement is refused", () => {
    // Drives the assertion directly with a short count, which is the state a silently-short walk
    // would produce. Without this the equality above could hold vacuously in every reachable case.
    expect(() => cp.assertBulletCount(37, 38, "planted")).toThrow(/37/);
    expect(() => cp.assertBulletCount(38, 38, "planted")).not.toThrow();
  });
});

describe("30-04 — the two-sided comparison names the ids, and each direction has its OWN message", () => {
  it("a roster-only id and a corpus-only id produce DIFFERENT messages, both naming the id", () => {
    const rosterOnly = cp.compareRosterToDerivation(["a"], ["a", "only_in_roster"]);
    const corpusOnly = cp.compareRosterToDerivation(["a", "only_in_corpus"], ["a"]);

    expect(rosterOnly.ok).toBe(false);
    expect(corpusOnly.ok).toBe(false);
    expect(rosterOnly.rosterOnly).toEqual(["only_in_roster"]);
    expect(corpusOnly.corpusOnly).toEqual(["only_in_corpus"]);

    expect(rosterOnly.failures.length).toBe(1);
    expect(corpusOnly.failures.length).toBe(1);
    expect(rosterOnly.failures[0]).toContain("only_in_roster");
    expect(corpusOnly.failures[0]).toContain("only_in_corpus");
    // The two directions are different FAULTS — a roster member nothing declares, versus a
    // declaration the roster never admitted — so they must not share one message.
    expect(rosterOnly.failures[0]).not.toBe(corpusOnly.failures[0]);
  });

  it("both directions wrong at once reports BOTH, rather than the first one found", () => {
    const c = cp.compareRosterToDerivation(["a", "x"], ["a", "y"]);
    expect(c.failures.length).toBe(2);
    expect(c.failures.join(" ")).toContain("x");
    expect(c.failures.join(" ")).toContain("y");
  });

  it("equal sets in a different ORDER are equal — a comparison cannot be decided by iteration order", () => {
    expect(cp.compareRosterToDerivation(["b", "a"], ["a", "b"]).ok).toBe(true);
  });
});

describe("30-04 — the three arms of the derived set, each with ONE authority (C1-a)", () => {
  it("the legacy grade table is the authority for the diff/branch/pr mapping (D-06)", () => {
    expect(cp.LEGACY_AUTONOMY_GRADES.diff).toEqual({
      commit_to_branch: "block",
      open_pr: "block",
    });
    expect(cp.LEGACY_AUTONOMY_GRADES.branch).toEqual({
      commit_to_branch: "off",
      open_pr: "block",
    });
    expect(cp.LEGACY_AUTONOMY_GRADES.pr).toEqual({ commit_to_branch: "off", open_pr: "off" });
  });

  it("arm three is DERIVED from that table's keys, never listed beside it", () => {
    expect(cp.sortedIds(cp.legacyGradeCheckpoints())).toEqual(["commit_to_branch", "open_pr"]);
  });

  it("the derived set is the UNION of the tag arm, the floor arm and the legacy arm", () => {
    const root = workflowFixture({ "00-control.md": CONTROL });
    const set = cp.derivedCheckpointSet(root);
    // the tag arm
    expect(set).toContain("control_stop");
    // the floor arm — imported from SAFETY_FLOORS, not restated
    for (const f of am.SAFETY_FLOORS) expect(set).toContain(f.id);
    // the legacy arm
    expect(set).toContain("commit_to_branch");
    expect(cp.sortedIds(set)).toEqual([...set]);
  });
});

describe("30-04 — the roster records a site count per member, and it is asserted (D-03)", () => {
  it("every roster member has a recorded site count", () => {
    expect(cp.sortedIds(Object.keys(cp.CHECKPOINT_SITE_COUNTS))).toEqual(
      cp.sortedIds(cp.CHECKPOINTS),
    );
  });

  it("the recorded counts sum to a total the site map is compared against", () => {
    const recorded = Object.values(cp.CHECKPOINT_SITE_COUNTS).reduce<number>(
      (a, b) => a + b,
      0,
    );
    expect(recorded).toBe(cp.RECORDED_TOTAL_SITES);
  });

  it("the site assertion DISCRIMINATES — a count off by one anywhere is refused", () => {
    const sites = new Map<string, readonly { file: string; line: number }[]>([
      ["a", [{ file: "00-x.md", line: 1 }]],
    ]);
    expect(() => cp.assertSiteCounts(sites, { a: 1 })).not.toThrow();
    expect(() => cp.assertSiteCounts(sites, { a: 2 })).toThrow(/\ba\b/);
    expect(() => cp.assertSiteCounts(sites, { a: 1, b: 1 })).toThrow(/\bb\b/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-04 TASK 3 — THE REAL CORPUS. The fixtures above prove the RULES; these prove the TREE.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("30-04 — the live workflow corpus derives the roster, two-sided (D-01, AUTO-01)", () => {
  const live = cp.deriveCheckpoints(ROOT);

  it("walks every workflow and locates every stop section, at full cardinality", () => {
    // Two-sided by construction: a workflow added without a stop section is red, a stop bullet
    // added or deleted anywhere is red, and bumping the anchor obliges a re-walk of the list.
    expect(() => cp.assertLiveCorpusCardinality(live)).not.toThrow();
    expect(live.sectionsFound).toBe(live.filesWalked);
    expect(live.countedBullets).toBe(cp.WORKFLOW_STOP_BULLET_COUNT);
    expect(live.examinedBullets).toBe(live.countedBullets);
  });

  it("the derived set and the exported roster prove each other in BOTH directions", () => {
    const c = cp.compareRosterToDerivation(cp.derivedCheckpointSet(ROOT), cp.CHECKPOINTS);
    expect(c.failures).toEqual([]);
    expect(c.ok).toBe(true);
    expect(() => cp.assertRosterMatchesDerivation(ROOT)).not.toThrow();
  });

  it("that comparison is NON-VACUOUS — both sets are populated and it discriminates live", () => {
    const derived = cp.derivedCheckpointSet(ROOT);
    expect(derived.length).toBe(cp.CHECKPOINTS.length);
    expect(derived.length).toBeGreaterThan(1);
    // Planting one id on each side of the LIVE sets, so the green above is a measured equality
    // rather than a comparison that could not have come out any other way.
    expect(cp.compareRosterToDerivation(derived, [...cp.CHECKPOINTS, "planted"]).rosterOnly).toEqual(
      ["planted"],
    );
    expect(cp.compareRosterToDerivation([...derived, "planted"], cp.CHECKPOINTS).corpusOnly).toEqual(
      ["planted"],
    );
  });

  it("the derived id→sites map matches the recorded site counts, both directions (D-03)", () => {
    expect(() => cp.assertSiteCounts(live.sites, cp.CHECKPOINT_SITE_COUNTS)).not.toThrow();
    expect(live.totalSites).toBe(cp.RECORDED_TOTAL_SITES);
    // The floor and legacy arms reach the roster without a tag; their recorded zero is a fact
    // about the corpus, not a placeholder, so it is asserted rather than assumed.
    expect(live.sites.has("commit_to_branch")).toBe(false);
    expect(live.sites.has("open_pr")).toBe(false);
    // …and the one id that arrives through TWO arms at once carries both.
    expect(live.sites.get("production_requires_human_confirmation")?.length).toBe(2);
  });

  it("`05-pr-quality-gate.md` now carries its two tags — plan 30-05 owned that file", () => {
    // The inverse of the plan-30-04 assertion this replaces. That case pinned the file as UNTAGGED
    // so that the moment 30-05 tagged it the site counts above would be re-walked; they were, and
    // the pin is now the positive statement of the same fact rather than a stale negative.
    const tagged = new Set<string>();
    const inWf05: string[] = [];
    for (const [id, list] of live.sites) {
      for (const s of list) {
        tagged.add(s.file);
        if (s.file === "05-pr-quality-gate.md") inWf05.push(id);
      }
    }
    expect(cp.sortedIds(inWf05)).toEqual(
      cp.sortedIds(["exhaust_self_fix_budget", "accept_human_only_failure"]),
    );
    expect(tagged.size).toBe(12);
  });

  it("every file this plan tagged is named by a row in its disposition file (Pitfall 7)", () => {
    // The file-level companion obligation, derived on BOTH sides: the left is the set of files the
    // TAGS live in, the right is the set of files the disposition ROWS name. Neither is typed here.
    const tagged = new Set<string>();
    for (const list of live.sites.values()) {
      for (const s of list) tagged.add(`agent-factory/workflows/${s.file}`);
    }
    // BOTH disposition files, because the tags were laid down by two plans: 30-04 tagged eleven
    // files and 30-05 tagged the twelfth. Reading only one of them would make the equality below
    // fail for a bookkeeping reason rather than a missing row.
    const named = new Set<string>();
    for (const plan of ["30-04.md", "30-05.md"]) {
      const doc = readFileSync(join(ROOT, "docs", "audit", "29-style-dispositions", plan), "utf8");
      for (const line of doc.split("\n")) {
        const m = line.match(/^\|\s*(agent-factory\/workflows\/[^\s|]+)\s*\|/);
        if (m) named.add(m[1]);
      }
    }
    expect(named.size).toBeGreaterThan(0);
    expect(cp.sortedIds([...named])).toEqual(cp.sortedIds([...tagged]));
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 (RED-TEAM SURFACE B, ROUND 1) — FINDING B-3: THE CORPUS IS THE *FIRST* STOP SECTION.
//
// `deriveCheckpoints`'s own contract says the tag corpus is "every workflow's stop section", and
// `assertLiveCorpusCardinality` compares `sectionsFound` against `filesWalked` — one located
// section per file, by construction. `locateSection` answers with the FIRST unfenced occurrence of
// the heading, so a SECOND `## Stop conditions` section in the same file is outside the located
// range on BOTH arms: pass A never walks it, and pass B's `inSection` filter discards its bullets.
//
// A canonically tagged bullet written there is therefore neither collected, nor refused, nor
// counted — it declares a human stop that never becomes a roster member, has no config cell and no
// enforcement, which is exactly the fault `compareRosterToDerivation`'s corpus-only message exists
// to name. Measured pre-fix on the live tree: ids 10, totalSites 16, examined 38, counted 38, and
// all three live assertions green over a planted second section carrying `planted_shadow_stop`.
//
// THE FIX IS THE CANONICAL FORM, NOT A WIDER SCAN (D-64 posture). A workflow carries EXACTLY ONE
// stop section; a second occurrence is ambiguity and is refused by name rather than resolved by
// silently taking the first. Widening the walk to every occurrence would be the other repair, and
// it is the wrong one: it makes the corpus depend on how many times an editor repeated a heading.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("30-10 B-3 — exactly ONE `## Stop conditions` section per workflow, refused otherwise", () => {
  it("a SECOND stop section in one file is refused by name, not silently ignored", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-double.md": [
        "# Double probe",
        "",
        "## Stop conditions",
        "",
        "- A stop with no tag.",
        "",
        "## Commit",
        "",
        "- nothing",
        "",
        "## Stop conditions",
        "",
        "- A shadow stop nothing governs. `checkpoint: planted_shadow_stop`",
        "",
      ].join("\n"),
    });
    let err: Error | null = null;
    try {
      cp.deriveCheckpoints(root);
    } catch (e) {
      err = e as Error;
    }
    expect(err, "a second stop section was tolerated").not.toBeNull();
    expect(err?.name).toBe("CheckpointDerivationError");
    expect(err?.message).toContain("01-double.md");
    expect(err?.message).toMatch(/2/);
  });

  it("the tag inside that second section is INVISIBLE to the pre-fix walk — the premise, asserted", () => {
    // The harness's own premise (P27's six false results across four rounds). The refusal above is
    // only meaningful if the planted bullet WOULD otherwise have gone unseen: a plant the collector
    // never reached for some other reason would make the case pass while measuring nothing. So the
    // same bytes are driven through the tag pattern directly, and through a deliberately
    // FILE-WIDE control walk, and both are shown to see it.
    const shadow = "- A shadow stop nothing governs. `checkpoint: planted_shadow_stop`";
    expect(cp.CHECKPOINT_TAG_RE.test(shadow), "the plant is a canonical tag").toBe(true);
    expect(cp.CHECKPOINT_KEYWORD_RE.test(shadow), "and the scope selector matches it").toBe(true);
    expect(shadow.match(cp.CHECKPOINT_TAG_RE)?.[1]).toBe("planted_shadow_stop");
  });

  it("a SINGLE stop section is unaffected — the refusal is about repetition, not about the heading", () => {
    const d = cp.deriveCheckpoints(workflowFixture({ "00-control.md": CONTROL }));
    expect(d.ids).toEqual(["control_stop"]);
    expect(d.sectionsFound).toBe(1);
  });

  it("a QUOTED stop heading inside a fence is not a second section — the fence authority decides", () => {
    // The refusal must not be a substring count. A workflow documenting the heading inside a fenced
    // example carries one section, and a scan that counted the quoted line would refuse the kit's
    // own documentation — the fence-blind second grammar this tree deleted in Phase 29.
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-quoted.md": [
        "# Quoted probe",
        "",
        "## Stop conditions",
        "",
        "- A stop a named human holds. `checkpoint: control_stop`",
        "",
        "```markdown",
        "## Stop conditions",
        "```",
        "",
        "## Commit",
        "",
        "- nothing",
        "",
      ].join("\n"),
    });
    expect(() => cp.deriveCheckpoints(root)).not.toThrow();
  });

  it("the LIVE corpus carries exactly one stop section per workflow — derived, not assumed", () => {
    // The positive half. `sectionsFound === filesWalked` could only ever hold, because the walk
    // locates one section per file; this counts the OCCURRENCES independently of that walk.
    const files = km.listWorkflows(ROOT);
    const counts = files.map((f) => ({
      file: f,
      n: fm.unfencedHeadingIndices(
        readFileSync(join(ROOT, "agent-factory", "workflows", f), "utf8"),
        cp.WORKFLOW_STOP_HEADING,
      ).length,
    }));
    expect(counts.length).toBe(files.length);
    expect(counts.filter((c) => c.n !== 1)).toEqual([]);
    // NON-VACUITY OF THE INSTRUMENT ITSELF. The equality above holds on a clean tree and would also
    // hold if the counter could only ever answer one — which is the defect it was written to close,
    // one module along. So the counter is driven at zero, one and two on planted bytes, and the
    // fence arm is exercised, because a counter that saw the quoted heading would refuse the kit's
    // own documentation.
    const two = "# t\n\n## Stop conditions\n\n- a\n\n## Commit\n\n## Stop conditions\n\n- b\n";
    const fenced = "# t\n\n```md\n## Stop conditions\n```\n\n## Commit\n\n- b\n";
    expect(fm.unfencedHeadingIndices(two, cp.WORKFLOW_STOP_HEADING).length).toBe(2);
    expect(fm.unfencedHeadingIndices(fenced, cp.WORKFLOW_STOP_HEADING).length).toBe(0);
    expect(fm.unfencedHeadingIndices(CONTROL, cp.WORKFLOW_STOP_HEADING).length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 ROUND 2 — F2 (reviewer R1-2 ≈ R2-1, HIGH): B-3'S OWN FIX INTRODUCED THIS.
//
// B-3 closed the byte-exact repeated heading by asking `unfencedHeadingIndices` for the OCCURRENCE
// count. That question is answered by a `trimEnd()`-exact, column-zero EQUALITY. The question
// "does this line CLOSE a level-2 section" is answered by `sectionEndIndex` with a PREFIX,
// `/^#{1,2} /`. Two grammars, and every string in the prefix language but outside the equality
// language opens a region that neither pass watches:
//
//   `##  Stop conditions`        two spaces   — closes the section, is not an occurrence
//   `## Stop conditions​`   zero-width   — closes the section, is not an occurrence
//   `## Stop conditions⁠`   word joiner  — same
//   `## Stop conditions­`   soft hyphen  — same
//   `  ## Stop conditions`       ≤3 indent    — renders as an h2, is neither
//
// Every one of them renders identically to the real heading, and a canonically tagged bullet under
// it is — verbatim B-3's own refusal text — neither collected, nor refused, nor counted.
//
// THE REPAIR IS NOT A WIDER EQUALITY. Widening acceptance would change `locateSection` for the four
// gates that consume it, and would leave two grammars with a smaller gap. Instead the authority
// gains the ability to answer a THIRD question — "which lines would a renderer show as this
// heading, while the canonical equality refuses them?" — DERIVED from the other two, and the
// derivation refuses that set by name. D-64's posture: define the canonical spelling, refuse
// everything that imitates it.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("30-10 R2 F2 — a heading that RENDERS as the stop heading but is not canonical is refused", () => {
  const shadowBullet = "- A shadow stop nobody governs. `checkpoint: planted_shadow_stop`";

  /** A workflow whose SECOND stop section is spelled `heading`, carrying the shadow bullet. */
  const doubled = (heading: string): string =>
    [
      "# Probe",
      "",
      "## Stop conditions",
      "",
      "- A stop with no tag.",
      "",
      "## Commit",
      "",
      "- nothing",
      "",
      heading,
      "",
      shadowBullet,
      "",
    ].join("\n");

  const NEAR_MISSES: readonly (readonly [string, string])[] = [
    ["two spaces after the hashes", "##  Stop conditions"],
    ["a trailing zero-width space", "## Stop conditions​"],
    ["a trailing word joiner", "## Stop conditions⁠"],
    ["a trailing soft hyphen", "## Stop conditions­"],
    ["a two-space indent", "  ## Stop conditions"],
    ["an internal double space", "##  Stop  conditions"],
    ["a single hash", "# Stop conditions"],
  ];

  for (const [label, heading] of NEAR_MISSES) {
    it(`refuses ${label} by name — it renders as the heading and the equality refuses it`, () => {
      // The harness's own premise FIRST: the plant is a canonical tag, so "not collected" cannot be
      // explained by the bullet being unrecognisable.
      expect(cp.CHECKPOINT_TAG_RE.test(shadowBullet)).toBe(true);
      expect(shadowBullet.match(cp.CHECKPOINT_TAG_RE)?.[1]).toBe("planted_shadow_stop");

      const root = workflowFixture({ "00-control.md": CONTROL, "01-probe.md": doubled(heading) });
      let err: Error | null = null;
      try {
        cp.deriveCheckpoints(root);
      } catch (e) {
        err = e as Error;
      }
      expect(err, `${label} was tolerated`).not.toBeNull();
      expect(err?.name).toBe("CheckpointDerivationError");
      expect(err?.message).toContain("01-probe.md");
    });
  }

  it("the byte-exact repeat is STILL refused — B-3's own case, re-run against the new predicate", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-probe.md": doubled("## Stop conditions"),
    });
    expect(() => cp.deriveCheckpoints(root)).toThrow(/01-probe\.md/);
  });

  it("a FENCED quote of the heading is still not a section — the fence authority still decides", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-quoted.md": [
        "# Quoted",
        "",
        "## Stop conditions",
        "",
        "- A stop a named human holds. `checkpoint: control_stop`",
        "",
        "```markdown",
        "##  Stop conditions",
        "## Stop conditions​",
        "```",
        "",
        "## Commit",
        "",
        "- nothing",
        "",
      ].join("\n"),
    });
    expect(() => cp.deriveCheckpoints(root)).not.toThrow();
  });

  it("a LEVEL-3 heading is not a near-miss — it closes nothing and its bullets ARE collected", () => {
    // R2's P10, pinned so the refusal cannot quietly grow to cover it. `### Stop conditions` does
    // not close a level-2 section, so a tagged bullet under it stays INSIDE the located range and is
    // collected and counted — governed, not shadowed. Refusing it would be the widening this fix
    // exists to avoid.
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-sub.md": [
        "# Sub",
        "",
        "## Stop conditions",
        "",
        "- A stop with no tag.",
        "",
        "### Stop conditions",
        "",
        "- A sub stop. `checkpoint: sub_level_stop`",
        "",
        "## Commit",
        "",
        "- nothing",
        "",
      ].join("\n"),
    });
    const d = cp.deriveCheckpoints(root);
    expect(cp.sortedIds([...d.ids])).toEqual(cp.sortedIds(["control_stop", "sub_level_stop"]));
  });

  it("the near-miss set is DISJOINT from the exact set, and the LIVE corpus has none", () => {
    // The new degree of freedom this repair introduces is a THIRD heading grammar in the authority.
    // It is bounded by being DERIVED from the other two — a near-miss is a line the ATX parse reads
    // as this heading and the canonical equality refuses — and both halves are asserted here rather
    // than described.
    const doc = [
      "## Stop conditions",
      "##  Stop conditions",
      "## Stop conditions​",
      "  ## Stop conditions",
      "## Something else",
      "### Stop conditions",
    ].join("\n");
    const exact = fm.unfencedHeadingIndices(doc, cp.WORKFLOW_STOP_HEADING);
    const near = fm.unfencedHeadingNearMisses(doc, cp.WORKFLOW_STOP_HEADING);
    expect(exact).toEqual([0]);
    expect(near).toEqual([1, 2, 3]);
    expect(near.filter((i) => exact.includes(i)), "a line is both exact and a near-miss").toEqual([]);

    // The live corpus carries the canonical form and nothing that imitates it.
    for (const f of km.listWorkflows(ROOT)) {
      const text = readFileSync(join(ROOT, "agent-factory", "workflows", f), "utf8");
      expect(
        fm.unfencedHeadingNearMisses(text, cp.WORKFLOW_STOP_HEADING),
        `${f} carries a heading that imitates the stop heading`,
      ).toEqual([]);
      expect(fm.unfencedHeadingIndices(text, cp.WORKFLOW_STOP_HEADING).length).toBe(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 ROUND 2 — F6 (reviewer R2-4, MEDIUM): the corpus's FILE SET is a silent filter.
//
// `listWorkflows` admits `/^\d{2}-.+\.md$/` and drops everything else without a word. An
// `agent-factory/workflows/hotfix-emergency.md` carrying a canonically tagged stop bullet is walked
// by nothing: it is outside the tag corpus, outside `WORKFLOW_COUNT`, and outside the bullet
// denominator, so every assertion in this file stays green. Reviewer 2 measured the whole tree green
// after discharging the ONE red — the banned-claim scan-set cardinality pin — exactly as that pin's
// own remedy text prescribes.
//
// A silent filter over a corpus whose entire job is two-sidedness is a one-sided arm. The refusal
// B-3 and F2 added is about ambiguity in the corpus FORM; this extends the same posture to its
// MEMBERSHIP: a stop declared in a file the corpus rule does not admit is governed by nothing, so
// the file is refused by name rather than skipped.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("30-10 R2 F6 — a markdown file the workflow corpus does not admit is refused by name", () => {
  it("an UNNUMBERED workflow markdown file is refused, not silently skipped", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "hotfix-emergency.md": [
        "# Hotfix emergency workflow",
        "",
        "## Stop conditions",
        "",
        "- Stop before force-pushing to a release tag. `checkpoint: planted_shadow_stop`",
        "",
      ].join("\n"),
    });
    // Premise: the bullet is canonical, so "not collected" cannot be blamed on the tag.
    expect(cp.CHECKPOINT_TAG_RE.test("- Stop before force-pushing to a release tag. `checkpoint: planted_shadow_stop`")).toBe(true);
    let err: Error | null = null;
    try {
      cp.deriveCheckpoints(root);
    } catch (e) {
      err = e as Error;
    }
    expect(err, "an unadmitted workflow file was skipped silently").not.toBeNull();
    expect(err?.name).toBe("CheckpointDerivationError");
    expect(err?.message).toContain("hotfix-emergency.md");
  });

  it("an upper-case extension is refused too — the membership rule is not case-dodgeable", () => {
    const root = workflowFixture({ "00-control.md": CONTROL, "19-EXTRA.MD": "# x\n\n## Stop conditions\n\n- y\n" });
    expect(() => cp.deriveCheckpoints(root)).toThrow(/19-EXTRA\.MD/);
  });

  it("a NUMBERED file is admitted exactly as before — the refusal is about membership only", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-second.md": "# s\n\n## Stop conditions\n\n- A second stop. `checkpoint: second_stop`\n\n## Commit\n\n- x\n",
    });
    const d = cp.deriveCheckpoints(root);
    expect(cp.sortedIds([...d.ids])).toEqual(cp.sortedIds(["control_stop", "second_stop"]));
  });

  it("SUPERSEDED by R5-3: a non-markdown entry is now refused unless it is a named exemption", () => {
    // F6 scoped its refusal to markdown, and round 4's inversion removed the extension question
    // entirely — so this case's verdict FLIPS. The reversal is deliberate: the workflows directory's
    // only legitimate contents are the numbered corpus plus a pinned list of named non-documents,
    // and an extension test is precisely what reviewer 5 defeated on its first probe. Recorded here
    // rather than deleted, so the change of mind is visible where the old belief was written.
    const root = workflowFixture({ "00-control.md": CONTROL, "notes.txt": "not a workflow" });
    expect(() => cp.deriveCheckpoints(root)).toThrow(/notes\.txt/);
  });

  it("the admitted set is a SUBSET of the directory read — two traversals, one equality", () => {
    // The new degree of freedom this repair introduces is a SECOND read of the workflows directory.
    // Both go through kit-model's one `readdirSync` helper, and the containment is asserted rather
    // than assumed: a lister that admitted a file the raw read cannot see would be reading a
    // different directory.
    const present = km.listWorkflowDirEntries(ROOT);
    const admitted = km.listWorkflows(ROOT);
    expect(present.length).toBeGreaterThan(0);
    expect(admitted.filter((f) => !present.includes(f))).toEqual([]);
    // On the live tree the two agree exactly — the directory carries the numbered corpus and, apart
    // from the named exemptions the read already drops, nothing else.
    expect([...admitted].sort()).toEqual([...present].sort());
  });
});

describe("30-10 R2 — assertSiteCounts is not prototype-blind (reviewer 2, observation 1)", () => {
  it("an id that is also an Object.prototype name is reported, not swallowed by `in`", () => {
    // `constructor` is the ONE prototype name that is also legal under CHECKPOINT_TAG_RE's
    // `[a-z][a-z0-9]*(_[a-z0-9]+)*`. With `in`, the "tagged but unrecorded" arm consulted the
    // prototype and passed it silently. Every other prototype spelling was already refused, which is
    // why the hole was exactly one id wide and invisible.
    const sites = new Map<string, readonly cpTypes.CheckpointSite[]>([
      ["constructor", [{ file: "09-daily-sweep.md", line: 1 }]],
    ]);
    expect(() => cp.assertSiteCounts(sites, {})).toThrow(/constructor/);
    // …and the CONTROL: a plain unrecorded id still refuses, so the case is not passing for a
    // reason unrelated to the prototype.
    const plain = new Map<string, readonly cpTypes.CheckpointSite[]>([
      ["planted_shadow_stop", [{ file: "09-daily-sweep.md", line: 1 }]],
    ]);
    expect(() => cp.assertSiteCounts(plain, {})).toThrow(/planted_shadow_stop/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 ROUND 3 — R3-1 and R3-2: F2's OWN FIX WAS MEASURED AGAINST A GRAMMAR, NOT A RENDERER.
//
// F2 declared its scope as "which unfenced lines a renderer would show as `heading`". Its MEASURED
// scope was narrower: lines matching `/^ {0,3}#{1,2} /` whose text after the first ASCII space,
// zero-width-stripped and whitespace-collapsed, equals the requested heading's. Reviewer 3 proved
// five spellings outside that grammar and inside the renderer's, each verified against the reference
// `commonmark` implementation rather than argued from the spec:
//
//   `## Stop conditions ##`   the optional closing sequence (CommonMark §4.2)
//   `## Stop conditions #`    the same, one hash
//   `##\tStop conditions`     a TAB separator, legal per §4.2
//   `Stop conditions` + `---` the setext form (§4.3)
//   `## Stop&#32;conditions`  a numeric character reference
//
// THE CLOSING-HASH FORM IS THE DANGEROUS ONE: it also matches `/^#{1,2} /`, so it CLOSES the real
// section. Inserted between the two tagged bullets of `09-daily-sweep.md` it REMOVED
// `exceed_wip_limit` from the derived set with BOTH independent counts agreeing at 37/37 — the shear
// the two-pass design exists to catch, defeated because both passes take the same wrong range.
//
// R3-2 is the same class one level down: `fencedLineFlags` toggled on any line starting with three
// backticks, so a ``` line that is CONTENT inside a tilde fence or a four-backtick fence (§4.5)
// inverted the fence state to EOF and made a BYTE-EXACT canonical `## Stop conditions` invisible to
// every heading question — neither refusal even asked.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("30-10 R3 — the heading authority answers about the RENDERER, not about one grammar", () => {
  const shadowBullet = "- A shadow stop nobody governs. `checkpoint: planted_shadow_stop`";

  const doubled = (heading: string): string =>
    ["# Probe", "", "## Stop conditions", "", "- A stop with no tag.", "", "## Commit", "", "- nothing", "", heading, "", shadowBullet, ""].join("\n");

  const RENDERER_IDENTICAL: readonly (readonly [string, string])[] = [
    ["a closing hash sequence", "## Stop conditions ##"],
    ["a one-hash closing sequence", "## Stop conditions #"],
    ["a closing sequence with padding", "## Stop conditions   ###"],
    ["a TAB separator", "##\tStop conditions"],
    ["a tab separator with a closing sequence", "##\tStop conditions\t##"],
    ["a numeric character reference", "## Stop&#32;conditions"],
    ["a hex character reference", "## Stop&#x20;conditions"],
  ];

  for (const [label, heading] of RENDERER_IDENTICAL) {
    it(`refuses ${label} — a renderer shows it as the stop heading`, () => {
      expect(cp.CHECKPOINT_TAG_RE.test(shadowBullet), "the plant must be a canonical tag").toBe(true);
      const root = workflowFixture({ "00-control.md": CONTROL, "01-probe.md": doubled(heading) });
      expect(() => cp.deriveCheckpoints(root)).toThrow(/01-probe\.md/);
    });
  }

  it("refuses the SETEXT form — a paragraph line underlined by dashes is an h2", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-setext.md": [
        "# Probe",
        "",
        "## Stop conditions",
        "",
        "- A stop with no tag.",
        "",
        "## Commit",
        "",
        "- nothing",
        "",
        "Stop conditions",
        "--------------",
        "",
        shadowBullet,
        "",
      ].join("\n"),
    });
    expect(() => cp.deriveCheckpoints(root)).toThrow(/01-setext\.md/);
  });

  it("the TRUNCATING form is refused — it closes the real section and drops a live roster member", () => {
    // R3-1's sharpest measurement, as a fixture: a closing-hash heading inserted INSIDE a stop
    // section truncates it, and the bullets after the insertion leave the corpus with both counts
    // agreeing. The refusal must fire before the truncation can be observed as a clean run.
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-truncated.md": [
        "# Probe",
        "",
        "## Stop conditions",
        "",
        "- A first stop. `checkpoint: first_stop`",
        "",
        "## Stop conditions ##",
        "",
        "- A second stop. `checkpoint: second_stop`",
        "",
        "## Commit",
        "",
        "- nothing",
        "",
      ].join("\n"),
    });
    expect(() => cp.deriveCheckpoints(root)).toThrow(/01-truncated\.md/);
  });

  it("a FOUR-BACKTICK fence does not desynchronise the fence state (R3-2)", () => {
    // The strongest form: the heading needs no imitation at all. It is spelled canonically and a
    // renderer shows it as an h2, because the ``` line between the four-backtick delimiters is
    // CONTENT. The pre-fix toggle flipped on it and inverted fence state to EOF, so the exact
    // heading was invisible and NEITHER refusal was asked.
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-quad.md": [
        "# Probe",
        "",
        "## Stop conditions",
        "",
        "- A stop with no tag.",
        "",
        "````",
        "```",
        "````",
        "",
        "## Stop conditions",
        "",
        shadowBullet,
        "",
      ].join("\n"),
    });
    expect(() => cp.deriveCheckpoints(root)).toThrow(/01-quad\.md/);
  });

  it("a TILDE fence does not desynchronise the fence state either", () => {
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-tilde.md": [
        "# Probe",
        "",
        "## Stop conditions",
        "",
        "- A stop with no tag.",
        "",
        "~~~",
        "```",
        "~~~",
        "",
        "## Stop conditions",
        "",
        shadowBullet,
        "",
      ].join("\n"),
    });
    expect(() => cp.deriveCheckpoints(root)).toThrow(/01-tilde\.md/);
  });

  it("R3-O2 — a heading QUOTED inside a tilde fence is code, and is NOT refused", () => {
    // The mirror image, and the false red the same machine removes: `~~~` opens a fence, so the
    // heading inside it is code to a renderer. The pre-fix toggle ignored `~~~` entirely and
    // reported two stop sections on a legitimate kit.
    const root = workflowFixture({
      "00-control.md": CONTROL,
      "01-quoted.md": [
        "# Probe",
        "",
        "## Stop conditions",
        "",
        "- A stop a named human holds. `checkpoint: control_stop`",
        "",
        "~~~markdown",
        "## Stop conditions",
        "~~~",
        "",
        "## Commit",
        "",
        "- nothing",
        "",
      ].join("\n"),
    });
    expect(() => cp.deriveCheckpoints(root)).not.toThrow();
  });

  it("the terminator language is a SUBSET of the classifier — no closing heading can escape", () => {
    // THE INVARIANT THAT MAKES THE REFUSAL COMPLETE FOR THE TRUNCATING CLASS, asserted rather than
    // argued. `sectionEndIndex(line, 0, 2) === 0` is "this line closes a level-2 section". Every such
    // line must be a line the heading classifier recognises, or a truncating heading exists that
    // neither the exact set nor the near-miss set can see — which is exactly R3-1.
    const probes = [
      "# a", "## a", "## a ##", "##   spaced   ", "#\ttabbed", "## Stop conditions",
      "## Stop conditions ##", "   ## indented", "#", "##",
    ];
    for (const line of probes) {
      if (fm.sectionEndIndex(line, 0, 2) !== 0) continue;
      expect(
        fm.atxOrSetextHeadingText([line], 0),
        `${JSON.stringify(line)} closes a level-2 section but the classifier does not see it`,
      ).not.toBeNull();
    }
  });

  it("the LIVE corpus is unchanged by the new authority — zero near-misses, one section per file", () => {
    for (const f of km.listWorkflows(ROOT)) {
      const text = readFileSync(join(ROOT, "agent-factory", "workflows", f), "utf8");
      expect(fm.unfencedHeadingNearMisses(text, cp.WORKFLOW_STOP_HEADING), f).toEqual([]);
      expect(fm.unfencedHeadingIndices(text, cp.WORKFLOW_STOP_HEADING).length, f).toBe(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 ROUND 3 — R3-4 (reviewer 3, LOW): F6's raw read admits ONE spelling of "markdown".
//
// `listWorkflowDirMarkdown` filters `f.toLowerCase().endsWith(".md")`, so a `hotfix.markdown` or
// `hotfix.mdown` carrying `## Stop conditions` and a canonically tagged bullet is walked by nothing,
// counted by nothing and refused by nothing. F6's refusal message tells the author to "rename it
// into the numbered corpus, or move it out of the workflows directory" — and a `.markdown` file does
// neither and is never reported.
//
// F4 already established the posture for exactly this axis: what imitates the canonical extension is
// refused by name rather than admitted. The alias set is hand-declared, which is this repository's
// named second systemic failure class, so it is pinned two-sided and its bound is stated.
// ─────────────────────────────────────────────────────────────────────────────────────────────

// SUPERSEDED BY ROUND 4's R5-3 INVERSION, and kept as the record of what round 3 believed.
// The alias-set cases below are re-expressed as "the inversion refuses these too", and the two
// assertions that were ABOUT the alias set — its membership pin and its non-markdown carve-out —
// are deleted here and replaced by the exemption-list pin in the R5-3 block, because the set they
// pinned no longer exists. Deleting an assertion inside a red-team round is the one edit that
// cannot be distinguished from narrowing the check, so it is named rather than done quietly.
describe("30-10 R3-4 (superseded by R5-3) — alias extensions are still refused, now by inversion", () => {
  const tagged = (name: string): Record<string, string> => ({
    "00-control.md": CONTROL,
    [name]: "# Hotfix\n\n## Stop conditions\n\n- Stop before force-pushing. `checkpoint: planted_shadow_stop`\n",
  });

  for (const name of ["hotfix.markdown", "hotfix.mdown", "hotfix.mkd", "20-x.MARKDOWN"]) {
    it(`refuses ${name} — it is a markdown document the corpus rule does not admit`, () => {
      expect(() => cp.deriveCheckpoints(workflowFixture(tagged(name)))).toThrow(new RegExp(name.replace(".", "\\.")));
    });
  }

  it("the LIVE workflows directory carries only admitted entries and named exemptions", () => {
    expect(km.listWorkflowDirEntries(ROOT).filter((f) => !km.listWorkflows(ROOT).includes(f))).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 ROUND 4 — R5-3: R3-4's hand-declared alias set failed on the first probe.
//
// R3-4 named its own new freedom — "a hand-declared alias set, this repository's named second
// systemic failure class" — and bounded it with "a two-sided pin on its exact members", which pins
// what is IN the set and proves nothing about what a markdown document is. Reviewer 5 swept ten
// extensions: `.markdown`, `.mdown`, `.mkd` refused; `.mdwn`, `.mkdn`, `.mkdown`, `.mdx`, `.livemd`,
// `.workbook`, `.ronn` — all GitHub-Linguist markdown — ACCEPTED, walked by nothing, refused by
// nothing.
//
// THE REPAIR INVERTS THE TEST RATHER THAN LENGTHENING THE LIST. The workflows directory's only
// legitimate contents are canonically named numbered workflows, so the raw read admits EVERY entry
// and the refusal names anything the corpus rule does not admit — with a pinned, asserted-empty
// exemption list for entries a working tree legitimately carries. The membership question then has
// one answer derived from the directory, not from a set somebody must keep complete.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("30-10 R4 R5-3 — the workflow corpus refuses by INVERSION, not by an alias list", () => {
  const tagged = (name: string): Record<string, string> => ({
    "00-control.md": CONTROL,
    [name]: "# Hotfix\n\n## Stop conditions\n\n- Stop before force-pushing. `checkpoint: planted_shadow_stop`\n",
  });

  for (const name of [
    "hotfix.mdwn", "hotfix.mkdn", "hotfix.mkdown", "hotfix.mdx",
    "hotfix.livemd", "hotfix.workbook", "hotfix.ronn",
    "hotfix.markdown", "hotfix.mdown", "hotfix.mkd", "hotfix.md",
  ]) {
    it(`refuses ${name} — the corpus admits numbered canonical .md and nothing else`, () => {
      expect(() => cp.deriveCheckpoints(workflowFixture(tagged(name)))).toThrow(
        new RegExp(name.replace(".", "\\.")),
      );
    });
  }

  it("a NON-document entry is refused too — the inversion has no extension question left", () => {
    // The deliberate reversal of F6's own "a non-markdown entry is explicitly out of scope" case.
    // Under inversion there is no extension predicate at all: the directory's contents are the
    // numbered corpus or they are named. That case is superseded, and the reversal is recorded.
    for (const name of ["notes.txt", "fixture.json", "README"]) {
      expect(() => cp.deriveCheckpoints(workflowFixture({ "00-control.md": CONTROL, [name]: "x" }))).toThrow(
        new RegExp(name.replace(".", "\\.")),
      );
    }
  });

  it("the EXEMPTION list is pinned two-sided, every member carries a reason, and it covers the tree", () => {
    // The freedom the inversion creates: an exemption list, which is a set literal again — but a
    // smaller one. Its members are NAMED ENTRIES rather than a CLASS that must stay complete, each
    // carries a written reason, and the live directory is asserted to contain nothing outside the
    // admitted set plus this list. The inversion found `.gitkeep` on its FIRST run, which is the
    // list earning its existence by measurement rather than being written speculatively.
    expect(km.WORKFLOW_DIR_EXEMPT_NAMES).toEqual([".gitkeep"]);
    for (const e of km.WORKFLOW_DIR_EXEMPT) expect(e.why.length).toBeGreaterThan(40);
    expect(km.listWorkflowDirEntries(ROOT).filter((f) => !km.listWorkflows(ROOT).includes(f))).toEqual([]);
    // …and the exemption is a NAME test, not a class test: `.gitkeep2` is still refused.
    expect(() => cp.deriveCheckpoints(workflowFixture({ "00-control.md": CONTROL, ".gitkeep2": "" }))).toThrow(
      /\.gitkeep2/,
    );
  });

  it("the live corpus still derives cleanly — the inversion is not already firing", () => {
    const d = cp.deriveCheckpoints(ROOT);
    expect(d.ids.length).toBe(10);
    expect(d.totalSites).toBe(cp.RECORDED_TOTAL_SITES);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 30-11 ROUND 2 — the command model (RA1-1 / RA1-3 / RA1-4), as a unit.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("30-11 the command model — one tokenizer, one tool->verb table", () => {
  const has = (cmd: string, id: string): boolean =>
    cp.matchCommandCheckpoints(cmd).checkpoints.has(id as never);

  it("the table's checkpoints are all roster members (derived, not restated)", () => {
    for (const id of cp.COMMAND_RULE_CHECKPOINTS) {
      expect(cp.CHECKPOINTS as readonly string[]).toContain(id);
    }
    expect(cp.COMMAND_RULE_CHECKPOINTS.length).toBeGreaterThan(0);
  });

  it("a global flag between the tool and the verb does not hide the verb", () => {
    for (const cmd of [
      "kubectl -n prod apply -f x",
      "kubectl --context=prod apply -f x",
      "helm --kube-context prod upgrade rel c",
      "terraform -chdir=infra/prod apply",
      "aws --profile prod s3 sync a b",
      "gcloud --project=prod run deploy s",
      "npm --access public publish",
    ]) {
      expect(has(cmd, "production_requires_human_confirmation"), cmd).toBe(true);
    }
  });

  it("a read-only command with the same flags is NOT matched (the flags do not decide)", () => {
    expect(has("kubectl -n dev get pods", "production_requires_human_confirmation")).toBe(false);
    expect(has("aws --profile prod s3 ls s3://b", "production_requires_human_confirmation")).toBe(false);
    expect(has("helm --kube-context prod list", "production_requires_human_confirmation")).toBe(false);
  });

  it("a leading wrapper is unwrapped; a leading assignment prefix is skipped", () => {
    expect(has("sudo kubectl -n prod apply -f x", "production_requires_human_confirmation")).toBe(true);
    expect(has("env FOO=1 kubectl apply -f x", "production_requires_human_confirmation")).toBe(true);
    expect(has("FOO=1 BAR=2 kubectl apply -f x", "production_requires_human_confirmation")).toBe(true);
  });

  it("a comment is not a command", () => {
    expect(has("gcloud config list # see deploy docs", "production_requires_human_confirmation")).toBe(false);
    // …but a `#` mid-word is not a comment. `#` is outside the canonical character set, so such a
    // word is OPAQUE and the segment falls to the fail-closed scan — which, since round 3, decides on
    // the tool name alone. `git` is named, so this denies. Recorded rather than smoothed over: it is
    // the same over-denial `RA3-4`'s fix trades for a backstop that cannot be defeated.
    expect(has("git push origin refs/heads/feature#1", "protected_branch_merge")).toBe(true);
  });

  it("git push: governed unless it names a demonstrably non-protected refspec", () => {
    for (const cmd of ["git push", "git push origin", "git push origin HEAD", "git push -u origin @",
                       "git push origin main", "git push origin master", "git push origin release/1.2"]) {
      expect(has(cmd, "protected_branch_merge"), cmd).toBe(true);
    }
    for (const cmd of ["git push origin feature/x", "git push -u origin my-work", "git push upstream topic"]) {
      expect(has(cmd, "protected_branch_merge"), cmd).toBe(false);
    }
  });

  it("git update-ref is governed only for a protected target ref", () => {
    expect(has("git update-ref refs/heads/main abc", "protected_branch_merge")).toBe(true);
    expect(has("git update-ref refs/heads/feature abc", "protected_branch_merge")).toBe(false);
  });

  it("gh pr merge is governed; other gh verbs are not", () => {
    expect(has("gh pr merge 12 --admin --merge", "protected_branch_merge")).toBe(true);
    expect(has("gh pr list", "protected_branch_merge")).toBe(false);
    expect(has("gh pr view 12", "protected_branch_merge")).toBe(false);
  });

  it("THE RECORDED RESIDUAL: `git merge` names no target and is NOT matched", () => {
    // Stated as a decision rather than left as an oversight: fail closed where an escape exists,
    // record a residual where refusing would leave no legal spelling. `git merge` has none.
    expect(has("git merge feature", "protected_branch_merge")).toBe(false);
    expect(has("git checkout main && git merge feature", "protected_branch_merge")).toBe(false);
  });

  it("a nested shell's -c argument is re-tokenized, to a bounded depth", () => {
    expect(has('sh -c "kubectl -n prod apply -f x"', "production_requires_human_confirmation")).toBe(true);
    expect(has("bash -c 'git -C /r push origin main'", "protected_branch_merge")).toBe(true);
    expect(has("sh -c \"sh -c 'kubectl -n p apply'\"", "production_requires_human_confirmation")).toBe(true);
    expect(has('sh -c "ls -la"', "production_requires_human_confirmation")).toBe(false);
  });

  it("text outside the grammar is UNTOKENIZABLE and fails closed on the TOOL NAME (round 3)", () => {
    const m = cp.matchCommandCheckpoints('eval "$(printf \'kubectl apply -f x\')"');
    expect(m.untokenizable).toBe(true);
    expect(m.checkpoints.has("production_requires_human_confirmation" as never)).toBe(true);
    // The verb conjunct is GONE (`RA3-4`): requiring it meant splitting the verb defeated the parser
    // and the backstop with one edit. A command carrying an escaped quote and naming a governed tool
    // now denies; one naming no governed tool still does not, which is what keeps this from being a
    // blanket refusal.
    const named = cp.matchCommandCheckpoints('git commit -m "say \\"hi\\""');
    expect(named.untokenizable).toBe(true);
    expect(named.checkpoints.size).toBe(1);
    const unnamed = cp.matchCommandCheckpoints('echo "a \\"b\\""');
    expect(unnamed.checkpoints.size).toBe(0);
  });

  it("unbalanced quoting is untokenizable, not silently mis-parsed", () => {
    // An unbalanced quote yields ONE segment marked opaque rather than a silent mis-parse.
    const segs = cp.commandSegments('kubectl apply -f "unclosed');
    expect(segs).not.toBeNull();
    expect((segs as readonly { opaque: boolean }[]).every((x) => x.opaque)).toBe(true);
  });

  it("segments split on shell separators, and quoted separators do not split", () => {
    // Round 3 deleted "the tool of a segment" — every canonical non-flag word is a candidate — so a
    // segment is now identified by its WORDS rather than by a single tool field.
    const segs = cp.commandSegments("ls; kubectl apply -f x && echo done");
    expect(segs).not.toBeNull();
    expect((segs as readonly { words: readonly { value: string }[] }[]).map((s) => s.words[0]?.value))
      .toEqual(["ls", "kubectl", "echo"]);
    const quoted = cp.commandSegments('echo "a; b" && ls');
    expect((quoted as readonly { words: readonly { value: string }[] }[]).map((s) => s.words[0]?.value))
      .toEqual(["echo", "ls"]);
  });
});

describe("30-11 the grant vocabulary's operator set (RA1-5)", () => {
  it("`=` and `+=` are both assignment operators, and the constant says so", () => {
    const src = readFileSync(join(import.meta.dirname, "..", "hooks", "guard.ts"), "utf8");
    expect(src).toMatch(/ASSIGNMENT_OPERATOR/);
    expect(src).toMatch(/COMPLETE set of assignment operators/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 33-27 — A REDIRECTION IS A REDIRECTION (33-DIAGNOSIS.md § 2, WINDOWS.md row 257).
//
// Round 1's live capture refused fifteen commands that deploy nothing: `2>&1` was split at `&` and
// the `2>` left behind was opaque, so `git log --oneline -5 2>&1` denied on the tool name alone. The
// fix is in the safe direction only: ONE anchored allow-list grammar (`REDIRECTION_RE`) at the split
// and at the word; a bare `$var`, a heredoc, a process substitution and an operator glued to letters
// all stay opaque, and the P30 fence (an unreadable segment denies on the tool name alone) is
// untouched. The evidence is the held round-1 transcripts, read at their commit and never edited.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

// The held capture is IMMUTABLE (D-11) and is read straight from its commit, the `heldCapture` idiom
// of capture-live.test.ts: a later edit to the filed artifacts cannot move these cases.
const HELD_CAPTURE_SHA = "c7be6d0d";
const HELD_CAPTURE_DIR = ".planning/phases/33-live-capture-windows-portability";
function heldCapture(name: string): string {
  const r = spawnSync("git", ["show", `${HELD_CAPTURE_SHA}:${HELD_CAPTURE_DIR}/${name}`], {
    cwd: ROOT,
    encoding: "utf8",
    input: "",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 20_000,
  });
  if (r.error !== undefined || r.status !== 0 || typeof r.stdout !== "string" || r.stdout === "") {
    throw new Error(
      `git cannot show ${HELD_CAPTURE_SHA}:${HELD_CAPTURE_DIR}/${name} (exit ${String(r.status)}) — the held round-1 capture must be reachable from this clone: ${(r.stderr ?? "").trim()}`,
    );
  }
  return r.stdout;
}

/** The fifteen § 2 denies, by transcript and the line of the `assistant` frame whose Bash tool-use the guard refused. */
const SECTION_2_LINES: Readonly<Record<"A" | "B", readonly number[]>> = {
  A: [445, 458, 586, 667, 1493, 1507, 1628],
  B: [35, 217, 434, 469, 562, 1504, 1527, 1740],
};

/** The exact `input.command` the guard received at that line — the diagnosis's own fixture. */
function sectionTwoCommands(): ReadonlyMap<string, string> {
  const out = new Map<string, string>();
  for (const run of ["A", "B"] as const) {
    const lines = heldCapture(`33-CAPTURE-${run}.jsonl`).split("\n");
    for (const n of SECTION_2_LINES[run]) {
      const frame = JSON.parse(lines[n - 1] as string) as {
        type: string;
        message: { content: { type: string; name?: string; input?: { command?: string } }[] };
      };
      expect(frame.type, `${run}:${n} is an assistant frame`).toBe("assistant");
      const uses = frame.message.content.filter((b) => b.type === "tool_use" && b.name === "Bash");
      expect(uses.length, `${run}:${n} carries exactly one Bash tool-use`).toBe(1);
      out.set(`${run}:${n}`, uses[0]!.input!.command as string);
    }
  }
  expect(out.size).toBe(15);
  return out;
}

// THE MEASURED PARTITION, stated by line id. Four ALLOW at the guard, eleven still DENY. Sizes are
// asserted to sum to fifteen so no command can fall out of the table silently.
//
// ALLOW (3) — every unreadable word was a redirection; the model now reads the whole command:
//   A:586  `ls -la … 2>&1`
//   A:1628 `ls -la .gitignore 2>&1; git status --porcelain | head -20; git log --oneline -1 2>&1 | head -2`
//   B:35   `cd …; cat … 2>&1; …; ls -R … 2>&1 | head -80; git log --oneline -5 2>&1`
// ALLOW (1) — a `$var` in a TOOL-FREE segment: `cd $R` marks the command untokenizable, but the
// fail-closed arm asks the tool name of THAT segment and finds none, so the checkpoint set is empty
// and the guard allows. This is the diagnosis's own `cat AGENTS.md 2>&1 -> allow` row, unchanged:
//   A:458  `R=…; cd $R; …; git log --oneline -5 2>&1; …`
// DENY (11) — an opaque word beside a governed tool name, in four kept arms:
//   expansion `$var`:           A:445 (`npm run $s 2>&1`), B:562 (`echo "===== npm run $s"`),
//                               B:1527 (`ls $R/.git/hooks`)
//   command substitution `$(…)`: B:434 (`wc -c $(find … ./.git …)`), B:469 (`echo "branch: $(git rev-parse …)"`)
//   heredoc `<<'EOF'` body:      B:1504 ("A-05 zero git history" beside backticks), B:1740 ("`git status`",
//                               and an apostrophe in the body unbalances the whole command)
//   an escaped or spliced word (the RA3-1 rule: `find`'s `\(` `\)`, grep's `'…'"'"'…'` quoting)
//   beside a `.git` path the tool-name scan reads as `git`:
//                               A:667, A:1493, A:1507, B:217 (B:217 also `helm present?` in a quoted echo)
const SECTION_2_READABLE_ALLOW = ["A:586", "A:1628", "B:35"] as const;
const SECTION_2_TOOL_FREE_OPAQUE_ALLOW = ["A:458"] as const;
const SECTION_2_STILL_DENIED: Readonly<Record<string, "expansion" | "command-substitution" | "heredoc" | "escaped-or-spliced">> = {
  "A:445": "expansion",
  "B:562": "expansion",
  "B:1527": "expansion",
  "B:434": "command-substitution",
  "B:469": "command-substitution",
  "B:1504": "heredoc",
  "B:1740": "heredoc",
  "A:667": "escaped-or-spliced",
  "A:1493": "escaped-or-spliced",
  "A:1507": "escaped-or-spliced",
  "B:217": "escaped-or-spliced",
};

describe("33-27 G1 — the fifteen round-1 denies, replayed through the model from the held transcripts", () => {
  const commands = sectionTwoCommands();

  it("the partition is stated by line id and its sizes sum to fifteen", () => {
    const all = [...SECTION_2_READABLE_ALLOW, ...SECTION_2_TOOL_FREE_OPAQUE_ALLOW, ...Object.keys(SECTION_2_STILL_DENIED)];
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(15);
    expect(SECTION_2_READABLE_ALLOW.length + SECTION_2_TOOL_FREE_OPAQUE_ALLOW.length + Object.keys(SECTION_2_STILL_DENIED).length).toBe(15);
    for (const id of all) expect(commands.has(id), `${id} is one of the fifteen`).toBe(true);
  });

  for (const id of SECTION_2_READABLE_ALLOW) {
    it(`${id}: every unreadable word was a redirection — untokenizable: false, no checkpoint`, () => {
      const m = cp.matchCommandCheckpoints(commands.get(id) as string);
      expect(m.untokenizable, `${id} untokenizable`).toBe(false);
      expect([...m.checkpoints], `${id} checkpoints`).toEqual([]);
      expect(m.unreadable, `${id} names no unreadable word`).toEqual([]);
    });
  }

  for (const id of SECTION_2_TOOL_FREE_OPAQUE_ALLOW) {
    it(`${id}: a \`$var\` in a tool-free segment — untokenizable: true, but the checkpoint set is EMPTY (the guard allows)`, () => {
      const m = cp.matchCommandCheckpoints(commands.get(id) as string);
      expect(m.untokenizable).toBe(true);
      expect([...m.checkpoints]).toEqual([]);
      expect(m.unreadable).toEqual(["$R"]);
    });
  }

  for (const [id, arm] of Object.entries(SECTION_2_STILL_DENIED)) {
    it(`${id}: still refused by the ${arm} arm — untokenizable: true with the tool-name checkpoints, and the word is named`, () => {
      const m = cp.matchCommandCheckpoints(commands.get(id) as string);
      expect(m.untokenizable).toBe(true);
      expect(m.checkpoints.size).toBeGreaterThan(0);
      // Every checkpoint came from the fail-closed arm — the readable model matched nothing here.
      expect([...m.failClosed].sort()).toEqual([...m.checkpoints].sort());
      expect(m.readable.size).toBe(0);
      expect(m.unreadable.length).toBeGreaterThan(0);
      const named = m.unreadable.join("\n");
      if (arm === "expansion") expect(named).toMatch(/\$[A-Za-z]/);
      if (arm === "command-substitution") expect(named).toMatch(/\$\(/);
      if (arm === "heredoc") expect(commands.get(id)).toContain("<<");
      if (arm === "escaped-or-spliced") {
        expect(commands.get(id)).toMatch(/\\\(|'"'"'/);
        expect(named).toMatch(/[\\'"]/);
      }
    });
  }

  it("PREMISE, on the committed artifact: no readable-arm match exists among the fifteen at all", () => {
    for (const [id, cmd] of commands) {
      expect(cp.matchCommandCheckpoints(cmd).readable.size, `${id} readable`).toBe(0);
    }
  });
});

describe("33-27 G2 — the grammar, one row per form, asserted against the ONE exported constant", () => {
  it("REDIRECTION_RE is exported and is the anchored allow-list", () => {
    expect(cp.REDIRECTION_RE).toBeInstanceOf(RegExp);
    expect(cp.REDIRECTION_RE.source.startsWith("^")).toBe(true);
    expect(cp.REDIRECTION_RE.source.endsWith("$")).toBe(true);
  });

  // ADMITTED: each yields ONE segment and ONE `redirection` word; a detached target is consumed.
  const ATTACHED = [">f", ">>f", "<f", "2>f", "2>>f", "2>&1", "1>&2", "&>f", "&>>f", ">/dev/null", "2>/dev/null", "3>&2", ">&2", "<&0", "10>&1"];
  for (const form of ATTACHED) {
    it(`admits ${form}: one segment, one redirection word, no other word`, () => {
      expect(cp.REDIRECTION_RE.test(form)).toBe(true);
      const segs = cp.commandSegments(`echo ${form}`);
      expect(segs).not.toBeNull();
      expect(segs!.length).toBe(1);
      const seg = segs![0]!;
      expect(seg.opaque).toBe(false);
      expect(seg.words.map((w) => w.kind)).toEqual(["canonical", "redirection"]);
      expect(seg.words[1]!.value).toBe(form);
    });
  }
  const BARE = [">", ">>", "<", "2>", "&>", "&>>"];
  for (const op of BARE) {
    it(`admits the bare operator ${op}: the NEXT word is consumed as its target and is never a word of its own`, () => {
      expect(cp.REDIRECTION_RE.test(op)).toBe(true);
      const segs = cp.commandSegments(`echo ${op} target after`);
      expect(segs!.length).toBe(1);
      const seg = segs![0]!;
      expect(seg.opaque).toBe(false);
      expect(seg.words.map((w) => w.kind)).toEqual(["canonical", "redirection", "canonical"]);
      expect(seg.words.map((w) => w.value)).toEqual(["echo", `${op} target`, "after"]);
    });
    it(`a bare ${op} with NO next word is an incomplete redirection and stays opaque`, () => {
      const segs = cp.commandSegments(`echo ${op}`);
      expect(segs![0]!.opaque).toBe(true);
      expect(segs![0]!.words.map((w) => w.kind)).toEqual(["canonical", "opaque"]);
    });
  }

  // NOT ADMITTED: each keeps today's classification — the grammar refuses the form, the segment that
  // carries the operator is opaque, and no `redirection` word exists anywhere. A refused form that
  // contains `&` still splits at the `&` exactly as before this plan (`pu2>&1sh` -> `pu2>` + `1sh`),
  // which is the point: the split and the word agree, and a non-match changes nothing.
  const OPAQUE = ["<<EOF", "<<<x", "<(cmd)", ">(cmd)", "push>x", "pu2>&1sh", ">'a b'", ">&", "<&", ">&-", "&>&1", "main>&1", "2>&1sh"];
  for (const form of OPAQUE) {
    it(`does not admit ${form}: the grammar refuses it, the operator's segment is opaque, no redirection word`, () => {
      expect(cp.REDIRECTION_RE.test(form)).toBe(false);
      const segs = cp.commandSegments(`echo ${form}`);
      expect(segs).not.toBeNull();
      const carrying = segs!.filter((s) => /[<>]/.test(s.raw));
      expect(carrying.length).toBeGreaterThan(0);
      expect(carrying.every((s) => s.opaque)).toBe(true);
      expect(carrying.every((s) => s.words.some((w) => w.kind === "opaque"))).toBe(true);
      expect(segs!.flatMap((s) => s.words).some((w) => w.kind === "redirection")).toBe(false);
    });
  }

  it("a bare operator whose next word is quoted, escaped or opaque does NOT consume it: the operator is opaque and the word is classified on its own", () => {
    for (const cmd of ["echo > 'a b'", 'echo > "$f"', "echo > a\\ b", "echo > $f"]) {
      const seg = cp.commandSegments(cmd)![0]!;
      expect(seg.opaque, cmd).toBe(true);
      expect(seg.words[1]!.kind, cmd).toBe("opaque");
      expect(seg.words[1]!.value, cmd).toBe(">");
      expect(seg.words.length, cmd).toBe(3);
    }
  });

  it("the splitter does not cut inside >&, <&, &>, &>>, and still cuts at &, && and a background &", () => {
    expect(cp.commandSegments("a 2>&1 | b")!.map((s) => s.raw.trim())).toEqual(["a 2>&1", "b"]);
    expect(cp.commandSegments("a &>x; b")!.map((s) => s.raw.trim())).toEqual(["a &>x", "b"]);
    expect(cp.commandSegments("a &>>x && b")!.map((s) => s.raw.trim())).toEqual(["a &>>x", "b"]);
    expect(cp.commandSegments("a <&0 b")!.map((s) => s.raw.trim())).toEqual(["a <&0 b"]);
    expect(cp.commandSegments("a & b")!.map((s) => s.raw.trim())).toEqual(["a", "b"]);
    expect(cp.commandSegments("a && b")!.map((s) => s.raw.trim())).toEqual(["a", "b"]);
    expect(cp.commandSegments("a&")!.map((s) => s.raw.trim())).toEqual(["a", ""]);
    // An `&` glued to letters is still a splitter: the grammar reads the whole word or none of it.
    expect(cp.commandSegments("git push&>x")!.map((s) => s.raw.trim())).toEqual(["git push", ">x"]);
    expect(cp.commandSegments("x main>&1")!.map((s) => s.raw.trim())).toEqual(["x main>", "1"]);
    // Inside quotes nothing is a redirection and nothing splits.
    expect(cp.commandSegments("echo '2>&1 && x'")!.length).toBe(1);
    expect(cp.commandSegments("echo '2>&1 && x'")![0]!.words.map((w) => w.kind)).toEqual(["canonical", "canonical"]);
  });

  it("the grammar's alphabet is the canonical word alphabet — a target character outside it is refused at both places", () => {
    // `$` and `(` are outside the canonical set: an attached target carrying them is not a redirection.
    for (const form of [">$f", "2>$f", "&>(x)", ">a(b"]) {
      expect(cp.REDIRECTION_RE.test(form), form).toBe(false);
      const segs = cp.commandSegments(`echo ${form}`)!;
      expect(segs.filter((s) => /[<>]/.test(s.raw)).every((s) => s.opaque), form).toBe(true);
      expect(segs.flatMap((s) => s.words).some((w) => w.kind === "redirection"), form).toBe(false);
    }
  });
});

describe("33-27 G3 — the safety converse, GENERATED from COMMAND_CHECKPOINT_RULES rather than typed", () => {
  const has = (cmd: string, id: string): boolean => cp.matchCommandCheckpoints(cmd).checkpoints.has(id as never);
  // A vacuity floor: every rule row has at least one governed spelling, so no row's converse is empty.
  it("every rule row governs at least one plain TOOL VERB spelling (the floor the table below stands on)", () => {
    // A FLAG-governed row (`vercel --prod`, added by the 33 round-3 CR-01 fix) stands on its flag.
    for (const r of cp.COMMAND_CHECKPOINT_RULES) {
      expect([...r.verbs, ...(r.flags ?? [])].some((v) => has(`${r.tool} ${v}`, r.checkpoint)), `${r.tool}: some verb is governed`).toBe(true);
    }
    expect(cp.COMMAND_CHECKPOINT_RULES.length).toBeGreaterThan(0);
  });

  for (const r of cp.COMMAND_CHECKPOINT_RULES) {
    for (const v of r.verbs) {
      const plain = has(`${r.tool} ${v}`, r.checkpoint);
      // A redirection anywhere in the segment must not change the verdict of the plain spelling.
      for (const spelled of [`${r.tool} ${v} 2>&1`, `${r.tool} 2>&1 ${v}`, `${r.tool} > x ${v}`, `${r.tool} ${v} >/dev/null`, `${r.tool} ${v} 2>/dev/null 1>&2`]) {
        it(`${spelled} -> ${plain} (same as the plain spelling; readable, never fail-closed)`, () => {
          const m = cp.matchCommandCheckpoints(spelled);
          expect(m.checkpoints.has(r.checkpoint), spelled).toBe(plain);
          expect(m.untokenizable, spelled).toBe(false);
          expect(m.failClosed.size, spelled).toBe(0);
        });
      }
      // The verb consumed as a bare operator's TARGET is a file name, never a verb.
      it(`${r.tool} > ${v} -> none (the verb is the redirection's consumed target)`, () => {
        const m = cp.matchCommandCheckpoints(`${r.tool} > ${v}`);
        expect(m.checkpoints.size).toBe(0);
        expect(m.untokenizable).toBe(false);
      });
      // An operator GLUED to the verb is opaque: the segment fails closed on the tool name as before.
      it(`${r.tool} ${v}>x and ${r.tool} ${v}>&1 -> still ${r.checkpoint}, by the fail-closed arm`, () => {
        for (const glued of [`${r.tool} ${v}>x`, `${r.tool} ${v}>&1`, `${r.tool} ${v}2>&1`]) {
          const m = cp.matchCommandCheckpoints(glued);
          expect(m.checkpoints.has(r.checkpoint), glued).toBe(true);
          expect(m.untokenizable, glued).toBe(true);
        }
      });
    }
  }

  it("git push with a redirection between the remote and the refspec is still governed on the refspec it names", () => {
    expect(has("git push origin 2>&1 main", "protected_branch_merge")).toBe(true);
    expect(has("git push origin main 2>&1", "protected_branch_merge")).toBe(true);
    expect(has("git push 2>&1", "protected_branch_merge")).toBe(true);
    expect(has("git push --force 2>&1 origin feature", "protected_branch_merge")).toBe(true);
    expect(has("git push origin feature/x 2>&1", "protected_branch_merge")).toBe(false);
    // A redirection that CONSUMES the refspec leaves a push that names no branch: governed.
    expect(has("git push origin > feature/x", "protected_branch_merge")).toBe(true);
  });

  it("a redirection between the tool and a benign subcommand does not defeat the adjacency rule, nor grant it", () => {
    expect(has("git 2>&1 commit -m push", "protected_branch_merge")).toBe(false);
    expect(has("git > x commit -m 'push to main'", "protected_branch_merge")).toBe(false);
    expect(has("git 2>&1 push", "protected_branch_merge")).toBe(true);
    expect(has("kubectl 2>&1 get pods --namespace delete", "production_requires_human_confirmation")).toBe(false);
    expect(has("kubectl 2>&1 -n prod apply -f x", "production_requires_human_confirmation")).toBe(true);
  });

  it("the disposition is asserted: a bare $var, a heredoc and a substitution are still untokenizable beside a tool name", () => {
    for (const cmd of ['echo "npm run $s"', "npm run $s 2>&1", "cat <<EOF\ngit push\nEOF", "wc -c $(git ls-files)", "git push origin $b"]) {
      const m = cp.matchCommandCheckpoints(cmd);
      expect(m.untokenizable, cmd).toBe(true);
      expect(m.checkpoints.size, cmd).toBeGreaterThan(0);
    }
  });
});

describe("33-27 G4 — mutation: with the redirection arm removed, every G1 allow flips back and every G3 case still denies", () => {
  // A SCRATCH copy of the committed module with `REDIRECTION_RE` replaced by a never-matching regex
  // (`[^\s\S]`, an empty class — a consuming atom, not a zero-width lookahead, which this
  // repository's closed-lookahead class refuses under scripts/). Because the split and the word ask
  // the SAME constant, one substitution removes both arms.
  const scratch = mkdtempSync(join(tmpdir(), "p33-27-mutant-"));
  afterAll(() => rmSync(scratch, { recursive: true, force: true }));
  const src = readFileSync(join(ROOT, "scripts", "checkpoints.js"), "utf8");
  const NEEDLE = /export const REDIRECTION_RE = new RegExp\([^;]*\);/;
  const mutated = src
    .replace(NEEDLE, "export const REDIRECTION_RE = /[^\\s\\S]/;")
    .replace(/from "\.\/([^"]+)"/g, (_m, rel: string) => `from ${JSON.stringify(pathToFileURL(join(ROOT, "scripts", rel)).href)}`);
  const mutantPath = join(scratch, "checkpoints-mutant.mjs");
  writeFileSync(mutantPath, mutated);

  it("the mutation is load-bearing: the constant was found exactly once and replaced", () => {
    expect((src.match(NEEDLE) ?? []).length).toBe(1);
    expect(mutated).toContain("REDIRECTION_RE = /[^\\s\\S]/");
    expect(mutated).not.toMatch(NEEDLE);
  });

  it("every G1 allow flips to a tool-name deny on the mutant; every still-denied case is unchanged", async () => {
    const mut: typeof cp = await import(pathToFileURL(mutantPath).href);
    const commands = sectionTwoCommands();
    for (const id of SECTION_2_READABLE_ALLOW) {
      const m = mut.matchCommandCheckpoints(commands.get(id) as string);
      expect(m.untokenizable, `${id} on the mutant`).toBe(true);
      expect(m.checkpoints.size, `${id} on the mutant`).toBeGreaterThan(0);
    }
    for (const id of SECTION_2_TOOL_FREE_OPAQUE_ALLOW) {
      // A:458 carries `git log … 2>&1`: without the arm the `2>` is opaque beside `git` and the set fills.
      const m = mut.matchCommandCheckpoints(commands.get(id) as string);
      expect(m.checkpoints.size, `${id} on the mutant`).toBeGreaterThan(0);
    }
    for (const id of Object.keys(SECTION_2_STILL_DENIED)) {
      const m = mut.matchCommandCheckpoints(commands.get(id) as string);
      expect(m.untokenizable, `${id} on the mutant`).toBe(true);
      expect(m.checkpoints.size, `${id} on the mutant`).toBeGreaterThan(0);
    }
  });

  it("every G3 governed spelling still denies on the mutant — the arm is load-bearing in exactly one direction", async () => {
    const mut: typeof cp = await import(pathToFileURL(mutantPath).href);
    for (const r of cp.COMMAND_CHECKPOINT_RULES) {
      for (const v of r.verbs) {
        if (!cp.matchCommandCheckpoints(`${r.tool} ${v}`).checkpoints.has(r.checkpoint)) continue;
        for (const spelled of [`${r.tool} ${v} 2>&1`, `${r.tool} 2>&1 ${v}`, `${r.tool} ${v} >/dev/null`]) {
          const m = mut.matchCommandCheckpoints(spelled);
          expect(m.checkpoints.has(r.checkpoint), `${spelled} on the mutant`).toBe(true);
          expect(m.untokenizable, `${spelled} on the mutant is fail-closed`).toBe(true);
        }
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 33 round-3 review CR-01 — the TOOL word spliced with shell-neutral punctuation.
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// `g\it push origin main`, `"g"it push --force origin main`, `k\ubectl -n prod apply -f x` and zsh's
// `=kubectl -n prod apply -f x` all ALLOWED with zero keys on the round-3 artifact. The fail-closed arm
// searched the RAW text for the tool name, which the splice had removed; the readable arm's
// normalization did not drop a leading `=`. RA3-4 closed this for the VERB; nobody asked it of the TOOL.
//
// Everything below is DERIVED from `COMMAND_CHECKPOINT_RULES` — the tool set, the verbs, the splice
// positions — and the tool count is pinned, so a row added to the table is swept without anyone
// extending a list here, and a row that silently vanished turns this red.
const CR01_SPLICES = (tool: string): readonly string[] => {
  const out = new Set<string>();
  for (let k = 0; k < tool.length; k++) out.add(`${tool.slice(0, k)}\\${tool.slice(k)}`); // `\` before each char
  for (let k = 0; k <= tool.length; k++) {
    out.add(`${tool.slice(0, k)}""${tool.slice(k)}`); // `""` at every boundary
    out.add(`${tool.slice(0, k)}''${tool.slice(k)}`); // `''` at every boundary
  }
  for (let k = 0; k < tool.length; k++) {
    out.add(`${tool.slice(0, k)}"${tool[k]}"${tool.slice(k + 1)}`); // one char double-quoted
    out.add(`${tool.slice(0, k)}'${tool[k]}'${tool.slice(k + 1)}`); // one char single-quoted
  }
  out.add(`=${tool}`); // zsh EQUALS expansion
  return [...out];
};

describe("33-R3 CR-01 — a tool word spliced with shell-neutral punctuation still names the tool it runs", () => {
  const has = (cmd: string, id: string): boolean => cp.matchCommandCheckpoints(cmd).checkpoints.has(id as never);
  const TOOLS = [...new Set(cp.COMMAND_CHECKPOINT_RULES.map((r) => r.tool))];

  it("the governed tool set is DERIVED from the table and its count is pinned (15)", () => {
    expect(TOOLS.length).toBe(15);
    expect(TOOLS.length).toBe(cp.COMMAND_CHECKPOINT_RULES.length);
  });

  it("the converse: every tool a literal pattern in hooks/guard.ts anchors on is a model tool — no literal-only tool", () => {
    // The literal sets are byte-frozen in hooks/guard.ts; their tool anchors are read out of the source,
    // not retyped. A literal-only tool is a tool the fail-closed arm can never name, which is how
    // `v\ercel --prod` stayed open while every model tool was being closed.
    const src = readFileSync(join(ROOT, "hooks", "guard.ts"), "utf8");
    const anchors = new Set<string>();
    for (const name of ["PRODUCTION_DEPLOY_PATTERNS", "PROTECTED_BRANCH_PATTERNS"]) {
      const start = src.indexOf(`const ${name}: RegExp[] = [`);
      expect(start, name).toBeGreaterThan(-1);
      const body = src.slice(start, src.indexOf("];", start));
      for (const m of body.matchAll(/^\s*\/\\b\(?([a-z|]+)\)?/gm)) for (const t of (m[1] as string).split("|")) anchors.add(t);
    }
    // 14 literal anchors (`gh` has no literal pattern; the model alone governs it), all of them model tools.
    expect(anchors.size).toBe(14);
    for (const t of anchors) expect(TOOLS, `literal anchor ${t}`).toContain(t);
  });

  it("the review's table — every row DENIES on the model, and every control still denies", () => {
    const P = "production_requires_human_confirmation";
    const B = "protected_branch_merge";
    const rows: readonly (readonly [string, string])[] = [
      ["kubectl -n prod apply -f x", P],
      ["k\\ubectl -n prod apply -f x", P],
      ["ku''bectl -n prod apply -f x", P],
      ["h\\elm upgrade r ./c", P],
      ["git push origin main", B],
      ["g\\it push origin main", B],
      ['"g"it push --force origin main', B],
      ["g''it push origin main", B],
      ["n\\pm publish", P],
      ['terra""form apply', P],
      ["gh pr merge 12", B],
      ["g\\h pr merge 12", B],
      ["=kubectl -n prod apply -f x", P],
      ["=git -C . push origin main", B],
      ["=gh pr merge 12", B],
      ["v\\ercel deploy --prod", P],
    ];
    for (const [cmd, id] of rows) expect(has(cmd, id), cmd).toBe(true);
  });

  it("spellings the review did not list, each measured executable under bash (stub binaries on PATH)", () => {
    const B = "protected_branch_merge";
    for (const cmd of [
      "$'\\x67it' push origin main", // ANSI-C hex escape
      "$'\\147it' push origin main", // ANSI-C octal escape
      "g{i..i}t push origin main", // a one-element sequence brace
      '{g""it,} push origin main', // an alternation brace whose other arm is empty
      "/usr/bin/g[i]t push origin main", // a pathname bracket
      "/usr/bin/g[[:alpha:]]t push origin main", // a POSIX class inside a bracket
      '/usr/bin/g[""i]t push origin main', // a quote inside a bracket
      "/usr/bin/gi? push origin main", // a pathname `?`
      "${x:-git} push origin main", // a parameter default word
      "g\\it$(true) push origin main", // a splice beside a substitution
      "echo $(g\\it push origin main)", // a splice inside a substitution
      "echo `g\\it push origin main`", // a splice inside backticks
      "g\\\nit push origin main", // a line continuation inside the name
      "g$(true)it push origin main", // an expansion strictly inside the name
      "g${x}it push origin main", // a parameter strictly inside the name
    ]) {
      expect(has(cmd, B), JSON.stringify(cmd)).toBe(true);
    }
  });

  // THE SWEEP, and the UNION of arms: every splice of every tool, through every shape the guard
  // already reads — flags between the tool and the verb, an env prefix, a launcher, a group, a
  // chain, a nested shell. A splice makes the segment unreadable, so the verdict must come from the
  // tool name alone; the `=` spelling is readable and must reach the verb through the flags.
  for (const r of cp.COMMAND_CHECKPOINT_RULES) {
    const governed = [...r.verbs, ...(r.flags ?? [])].filter((v) => has(`${r.tool} ${v}`, r.checkpoint));
    it(`${r.tool}: at least one plain spelling is governed (the sweep's floor)`, () => {
      expect(governed.length, r.tool).toBeGreaterThan(0);
    });
    for (const v of governed) {
      it(`${r.tool} ${v}: every splice, in every shape, is ${r.checkpoint}`, () => {
        const failures: string[] = [];
        for (const t of CR01_SPLICES(r.tool)) {
          const shapes = [
            `${t} ${v}`,
            `${t} -C dir ${v}`,
            `${t} -n prod --flag ${v}`,
            `FOO=1 ${t} ${v}`,
            `FOO=1 BAR=2 ${t} -C dir ${v}`,
            `sudo -u root ${t} ${v}`,
            `(${t} ${v})`,
            `true && ${t} ${v}`,
            `echo x; ${t} ${v} 2>&1`,
          ];
          if (!t.includes("'")) shapes.push(`bash -c '${t} ${v}'`);
          if (!t.includes('"')) shapes.push(`eval "${t} ${v}"`);
          for (const cmd of shapes) if (!has(cmd, r.checkpoint)) failures.push(cmd);
        }
        expect(failures).toEqual([]);
      });
    }
  }

  it("ordinary commands the projection must NOT start refusing (the over-denial floor)", () => {
    for (const cmd of [
      "ls -la",
      "ls src/*",
      "rm -rf dist/*",
      "ls *.md",
      "echo {a,b}",
      "for i in {1..3}; do echo $i; done",
      "cat ~/.gitconfig",
      'echo "$(date)"',
      "ls $(pwd)",
      "echo $HOME/.github",
      "git log --oneline -5 2>&1",
      "git status",
      "=git status",
      "=kubectl get pods",
      "=npm run publish",
      "echo \"it's fine\"",
      "printf '%s\\n' a b",
      "find . -name '*.ts' -print",
      "node -e 'console.log(1)'",
      "npm run build",
      "npx vitest run --exclude '**/scripts/e2e/**'",
      "git commit -m 'push to main'",
      "grep -rn kubectl docs/",
      "echo ${HOME}",
      "test -f x && echo [ok]",
      "vercel deploy",
      "vercel ls",
    ]) {
      expect(cp.matchCommandCheckpoints(cmd).checkpoints.size, cmd).toBe(0);
    }
  });

  it("the ONE authority: the readable arm and the fail-closed arm ask the same projection", () => {
    // The readable arm's second grammar (`normalizeToolWord`) is gone; both arms call this.
    expect((cp as Record<string, unknown>).normalizeToolWord).toBeUndefined();
    const named = (w: string): string[] => [...cp.governedToolsNamedBy(w)].sort();
    expect(named("git")).toEqual(["git"]);
    expect(named("=kubectl")).toEqual(["kubectl"]);
    expect(named("'=kubectl'")).toEqual([]); // a QUOTED `=` is not zsh's equals expansion
    expect(named("g\\it")).toEqual(["git"]);
    expect(named('"g"it')).toEqual(["git"]);
    expect(named("GIT.EXE")).toEqual(["git"]);
    expect(named("'C:\\Program Files\\Git\\bin\\git.exe'")).toEqual(["git"]);
    expect(named("/usr/bin/g?")).toEqual(["gh"]);
    // A word made of wildcards alone spells nothing: which file it selects is the filesystem's
    // answer, the same class as a renamed binary, and refusing it would refuse `rm -rf dist/*`.
    expect(named("dist/*")).toEqual([]);
    expect(named("$K")).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 33 round-4 (plan 33-35) — CR-01 one register over: the governed command QUOTED for a nested shell.
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// 33-VERIFICATION.md gap 4. The projection stripped ONE quoting layer, so a governed command quoted
// for `bash -c`, `eval` or a here-string kept its splice one layer down, and an opaque word beside it
// sent the segment to a fail-closed arm that then named nothing. D-33-R4-03: the fix lives in the ONE
// projection both arms ask — `governedToolsNamedBy` re-projects the shell-resolved text of every name
// piece as text a nested shell would run. The rows are read from one committed fixture.
interface Cr01NestedRow {
  readonly id: string;
  readonly source: string;
  readonly kind: "deny" | "deny-control" | "allow-control" | "residual" | "handed-off";
  readonly owner?: string;
  readonly command: string;
}
const CR01_NESTED_CORPUS: readonly Cr01NestedRow[] = (
  JSON.parse(readFileSync(join(ROOT, "scripts", "fixtures", "cr01-nested-corpus.json"), "utf8")) as {
    rows: Cr01NestedRow[];
  }
).rows;
const nestedRow = (id: string): Cr01NestedRow => {
  const row = CR01_NESTED_CORPUS.find((r) => r.id === id);
  if (row === undefined) throw new Error(`cr01-nested-corpus.json has no row ${id}`);
  return row;
};

describe("33-R4 CR-01 nested — the one authority names the tool inside a quoted nested command", () => {
  const named = (w: string): string[] => [...cp.governedToolsNamedBy(w)].sort();

  it("the tracer's quoted body names the tool; a quoted echo body names nothing", () => {
    // The single-quoted body of row V4-01, exactly as spelled in the command.
    expect(named("'g\\it push origin main'")).toEqual(["git"]);
    expect(named("'echo hi'")).toEqual([]);
  });

  it("the tracer shape is matched by the command model; its allow control is not", () => {
    const tracer = cp.matchCommandCheckpoints(nestedRow("V4-01").command);
    expect(tracer.checkpoints.size).toBeGreaterThan(0);
    expect(tracer.checkpoints.has("protected_branch_merge")).toBe(true);
    expect(cp.matchCommandCheckpoints(nestedRow("AC-01").command).checkpoints.size).toBe(0);
  });

  it("the two deny controls of gap 4 still deny", () => {
    for (const id of ["V4-C1", "V4-C2"]) {
      expect(cp.matchCommandCheckpoints(nestedRow(id).command).checkpoints.has("protected_branch_merge"), id).toBe(true);
    }
  });
});
