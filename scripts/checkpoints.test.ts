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

  it("every roster member carries a default, and every default is `block`", () => {
    for (const id of cp.CHECKPOINTS) {
      expect(cp.CHECKPOINT_DEFAULTS[id], `default for ${id}`).toBe("block");
    }
    expect(Object.keys(cp.CHECKPOINT_DEFAULTS).length).toBe(cp.CHECKPOINTS.length);
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
    const res = io.readGovernanceConfig(rootWithRawConfig('{"checkpoints":{}}'));
    expect(cp.sortedIds(Object.keys(res.config.checkpoints))).toEqual(cp.sortedIds(cp.CHECKPOINTS));
    for (const id of cp.CHECKPOINTS) expect(res.config.checkpoints[id]).toBe("block");
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

  it("a `checkpoints` value that is a string / number / array / null → DEFAULTS, never `off`", () => {
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

  it("a whole-file config that is not a JSON object → DEFAULTS plus a refusal, never `off`", () => {
    for (const body of ["[]", '"lean"', "7", "null"]) {
      const res = io.readGovernanceConfig(rootWithRawConfig(body));
      for (const id of cp.CHECKPOINTS) expect(res.config.checkpoints[id], body).toBe("block");
      expect(res.checkpointRefusals.length, `${body} refusals`).toBeGreaterThan(0);
    }
  });

  it("an UNREADABLE config (non-JSON) → DEFAULTS plus a refusal, and source='unreadable'", () => {
    const res = io.readGovernanceConfig(rootWithRawConfig("{ not valid json ]]]"));
    expect(res.source).toBe("unreadable");
    for (const id of cp.CHECKPOINTS) expect(res.config.checkpoints[id]).toBe("block");
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

describe("resolveCheckpoint — the two-key rule", () => {
  const AT_OFF = { protected_branch_merge: "off", production_requires_human_confirmation: "block" } as const;

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
      { protected_branch_merge: "OFF", production_requires_human_confirmation: "block" } as never,
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
    const line = cp.renderCheckpointBanner(
      { protected_branch_merge: "off", production_requires_human_confirmation: "block" },
      {},
    );
    // An unauthorized lowering enforces `block`, which IS the default — a banner keyed on the
    // EFFECTIVE value would print "all checkpoints at default" over a config that plainly says off.
    expect(line).not.toBe(cp.BANNER_ALL_DEFAULT);
    expect(line).toContain("protected_branch_merge=off");
    expect(line).toContain("NOT AUTHORIZED");
    expect(line).toContain("GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE");
    expect(line).not.toContain("\n");
  });

  it("names the authorizing grant when the lowering IS authorized", () => {
    const line = cp.renderCheckpointBanner(
      { protected_branch_merge: "notify", production_requires_human_confirmation: "block" },
      { GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE: "Olger Oeselg" },
    );
    expect(line).toContain("protected_branch_merge=notify");
    expect(line).toContain("authorized by GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=Olger Oeselg");
    expect(line).not.toContain("NOT AUTHORIZED");
  });
});
