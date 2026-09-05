// config-governance-consistency.test.ts — Phase-25 cross-surface consistency oracle for the two
// governance config dials: `context.human_admission` (GOV-01) and `context.audit_retention` (GOV-02).
//
// Both keys live on the same 3-surface atomic dial every grugops config field follows, and MUST stay
// consistent:
//   1. agent-factory/config/factory.config.json        — the live kit config
//   2. agent-factory/seed/.grugops/factory.config.json — the seed the installer copies into a repo
//   3. agent-factory/config/factory.config.md          — the human-readable twin (documents every key)
//
// This is the GOV-02 SC2 lockstep check (modeled on config-queue-consistency.test.ts):
//   - both governance keys are present under the `context` object on both JSON surfaces and the whole
//     `context` object is DEEP-EQUAL across them (the seed must match the kit; the foundation guard
//     separately asserts the two JSONs stay byte-identical);
//   - the keys carry the locked lean defaults human_admission="off" / audit_retention="git";
//   - the pre-existing `context.compaction` is still present (the two keys are ADDED, not a replacement);
//   - the twin documents each new key by name;
//   - the twin crisply states the D-09 distinction — audit_retention (governance-record durability) is
//     distinct from compaction (note-body verbosity) and never duplicates compaction:retain-raw;
//   - the twin documents the lean default-on-absent for each new key (D-11).
//
// Drives the COMMITTED config files on disk (no .ts build). Vitest globals:false → import explicitly.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const KIT_JSON = join(ROOT, "agent-factory/config/factory.config.json");
const SEED_JSON = join(ROOT, "agent-factory/seed/.grugops/factory.config.json");
const TWIN_MD = join(ROOT, "agent-factory/config/factory.config.md");

function loadJson(p: string): Record<string, unknown> {
  return JSON.parse(readFileSync(p, "utf8"));
}

// The roster, the dispositions, the defaults and the legacy grade table are IMPORTED from the one
// module that declares them. Every expectation below is derived from that import; nothing in this
// file writes a checkpoint id, a disposition or a grade mapping down a second time.
const cp: typeof import("./checkpoints.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "checkpoints.js")).href
);
const am: typeof import("./audit-model.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "audit-model.js")).href
);

describe("governance config dials — 3-surface consistency (GOV-01/GOV-02)", () => {
  const kit = loadJson(KIT_JSON);
  const seed = loadJson(SEED_JSON);
  const kitContext = kit.context as Record<string, unknown>;

  it("the `context` object is deep-equal across the kit config and the seed (lockstep, GOV-02 SC2)", () => {
    expect(kit.context).toEqual(seed.context);
  });

  it("both governance keys carry the lean defaults human_admission='off' / audit_retention='git'", () => {
    expect(kitContext.human_admission).toBe("off");
    expect(kitContext.audit_retention).toBe("git");
  });

  it("the pre-existing `context.compaction` is still present — the keys are ADDED, not a replacement", () => {
    expect(kitContext.compaction).toBe("aggressive");
  });
});

describe("governance config dials — the twin documents every key (GOV-01/GOV-02)", () => {
  const twin = readFileSync(TWIN_MD, "utf8");

  it("the twin documents each new governance key by name", () => {
    expect(twin).toMatch(/`human_admission`/);
    expect(twin).toMatch(/`audit_retention`/);
  });

  it("the twin states the D-09 distinction — audit_retention is distinct from compaction, never retain-raw", () => {
    expect(twin).toMatch(/distinct|independent|not.*compaction|never.*retain-raw/i);
  });

  it("the twin documents the lean default-on-absent for each new governance key (D-11)", () => {
    // A missing human_admission reads as off; a missing audit_retention reads as git.
    expect(twin).toMatch(/human_admission.*\boff\b/i);
    expect(twin).toMatch(/audit_retention.*\bgit\b/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The `checkpoints` matrix — the same 3-surface dial contract, plus a derivation check (Phase 30).
//
// The two JSON twins must agree, and the human-readable twin must document the roster the module
// actually declares. Both halves are DERIVED: the expected id set, the expected floor subset, the
// expected defaults and the expected legacy translation are read from scripts/checkpoints.ts and
// scripts/audit-model.ts, so a member added to the roster without a row in the reference document
// is red here rather than at review time.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The `checkpoints` sub-fields ROSTER table, parsed out of the twin: id → { tier, default }.
 *
 * THE SLICE IS BOUNDED AT BOTH ENDS, DELIBERATELY. The first draft of this reader ran the row
 * pattern over the whole document and picked up three extra "ids" — `diff`, `branch` and `pr` —
 * because the legacy grade table further down has the same column shape. A section reader that
 * starts at a heading and runs to end-of-file adopts whatever unrelated block comes later; that is
 * the Phase 29 lesson, and the answer is an explicit CLOSING bound plus a non-vacuity check on the
 * slice, not a cleverer row pattern.
 */
const ROSTER_TABLE_OPEN = "### `checkpoints` sub-fields";
const ROSTER_TABLE_CLOSE = "#### Translating a retired `autonomy` value";

function rosterTableSlice(twin: string): string {
  const from = twin.indexOf(ROSTER_TABLE_OPEN);
  const to = twin.indexOf(ROSTER_TABLE_CLOSE);
  if (from < 0 || to < 0 || to <= from) {
    throw new Error(
      `the checkpoints roster section is not bounded by ${ROSTER_TABLE_OPEN} … ${ROSTER_TABLE_CLOSE} ` +
        `(open at ${from}, close at ${to}) — refusing to parse an unbounded slice`,
    );
  }
  return twin.slice(from, to);
}

function twinRosterRows(twin: string): Map<string, { tier: string; def: string }> {
  const rows = new Map<string, { tier: string; def: string }>();
  const re = /^\|\s*`([a-z_]+)`\s*\|\s*([^|]*?)\s*\|\s*`(block|notify|off)`\s*\|/gm;
  for (const m of rosterTableSlice(twin).matchAll(re)) {
    rows.set(m[1], { tier: m[2].trim(), def: m[3] });
  }
  return rows;
}

describe("the `checkpoints` matrix — 3-surface consistency (Phase 30, D-05/D-08)", () => {
  const kit = loadJson(KIT_JSON);
  const seed = loadJson(SEED_JSON);
  const shipped = kit.checkpoints as Record<string, string>;

  it("the `checkpoints` object is deep-equal across the kit config and the seed (lockstep)", () => {
    expect(kit.checkpoints).toEqual(seed.checkpoints);
  });

  it("neither JSON twin carries the retired `autonomy` scalar", () => {
    for (const [label, o] of [["kit", kit], ["seed", seed]] as const) {
      expect(Object.prototype.hasOwnProperty.call(o, "autonomy"), `${label} config`).toBe(false);
    }
  });

  it("every shipped cell names a roster member and carries a canonical disposition", () => {
    const roster = new Set<string>(cp.CHECKPOINTS);
    for (const [id, value] of Object.entries(shipped)) {
      expect(roster.has(id), `shipped cell "${id}" is not a roster member`).toBe(true);
      expect(cp.DISPOSITIONS as readonly string[]).toContain(value);
    }
  });

  it("no shipped cell lowers a SAFETY_FLOORS member below `block`", () => {
    // The floor ids are imported, never listed. A shipped configuration that lowered one of them
    // would ship the lowered posture to every repository the installer seeds.
    for (const f of am.SAFETY_FLOORS) {
      if (!(f.id in shipped)) continue;
      expect(shipped[f.id], `shipped ${f.id} is lowered in the kit's own default config`).toBe("block");
    }
  });
});

describe("the `checkpoints` matrix — the twin documents the roster the module declares", () => {
  const twin = readFileSync(TWIN_MD, "utf8");
  const rows = twinRosterRows(twin);

  it("the parsed slice is a bounded, non-empty part of the document — not the whole file", () => {
    const slice = rosterTableSlice(twin);
    expect(slice.length).toBeGreaterThan(0);
    expect(slice.length).toBeLessThan(twin.length);
    // The legacy grade table has the same column shape and MUST be outside the slice; if it were
    // inside, `diff`/`branch`/`pr` would read as roster members.
    expect(slice).not.toContain(ROSTER_TABLE_CLOSE);
  });

  it("every tier cell is one of the two legal markers — a mis-parse cannot read as a pass", () => {
    for (const [id, v] of rows) {
      expect(["floor", "—"], `tier cell for ${id}`).toContain(v.tier);
    }
  });

  it("the twin's roster table names EVERY roster member and no id outside the roster", () => {
    // Two-sided set equality. An id the module gained without a row here, and a row naming an id
    // the module dropped, are separately red — the direction is in the diff.
    expect([...rows.keys()].sort()).toEqual([...cp.CHECKPOINTS].sort());
    expect(rows.size).toBe(cp.CHECKPOINTS.length);
  });

  it("every documented default is the default the module declares", () => {
    for (const id of cp.CHECKPOINTS) {
      expect(rows.get(id)?.def, `documented default for ${id}`).toBe(cp.CHECKPOINT_DEFAULTS[id]);
    }
  });

  it("the rows marked `floor` are EXACTLY the derived floor subset", () => {
    const documented = [...rows.entries()].filter(([, v]) => v.tier === "floor").map(([k]) => k).sort();
    expect(documented).toEqual([...cp.FLOOR_CHECKPOINTS].sort());
    // Non-vacuity: an empty floor column would satisfy an equality against an empty derivation.
    expect(documented.length).toBeGreaterThan(0);
  });

  it("the legacy grade table reproduces LEGACY_AUTONOMY_GRADES cell for cell", () => {
    let checked = 0;
    for (const [grade, cells] of Object.entries(cp.LEGACY_AUTONOMY_GRADES)) {
      const row = twin.match(new RegExp(`^\\|\\s*\`${grade}\`\\s*\\|(.+)$`, "m"));
      expect(row, `the legacy table has no row for "${grade}"`).toBeTruthy();
      for (const disposition of Object.values(cells as Record<string, string>)) {
        expect(row?.[1]).toContain(`\`${disposition}\``);
      }
      // The row's cells, read left to right, must be the mapping's values in declaration order.
      const got = [...(row?.[1] ?? "").matchAll(/`(block|notify|off)`/g)].map((m) => m[1]);
      expect(got, `legacy row "${grade}"`).toEqual(Object.values(cells as Record<string, string>));
      checked += 1;
    }
    // The denominator comes from the imported table, not from counting the rows just parsed.
    expect(checked).toBe(Object.keys(cp.LEGACY_AUTONOMY_GRADES).length);
    expect(checked).toBeGreaterThan(0);
  });

  it("the twin states the two-key rule and names the environment-variable family", () => {
    expect(twin).toContain(cp.FLOOR_ENV_VAR_PREFIX);
    expect(twin).toMatch(/two keys, not one/i);
  });

  it("the twin records that a non-blocking disposition is advisory where no hook enforces it", () => {
    expect(twin).toMatch(/advisory/i);
    expect(twin).toMatch(/no equivalent pre-tool hook/i);
  });

  it("the twin documents absence as the lean default, never as an error (AUTO-07)", () => {
    expect(twin).toMatch(/Absence is the lean default, and it is never an error/i);
  });
});
