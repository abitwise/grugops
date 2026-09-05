// validate.test.ts — VAL-01 / VAL-02 self-test for scripts/validate-agent-factory.js
// (Vitest port of validate.test.sh).
//
// Proves the structure validator both PASSES and FAILS — the no-fabrication contract demands a
// gate that can actually fail. It drives the COMPILED validator (.js) with VALIDATE_KIT_ROOT /
// VALIDATE_ROOT set separately (the two-root contract) and asserts:
//   (a) grugops's OWN tree (D-42 self-test)          → GREEN bare AND --strict
//   (b) a minimal GOOD fixture tree                    → exit 0
//   (c) six one-mutation BAD fixture trees             → nonzero + the finding naming the defect
//   (d) the warn-only fixture                          → exit 0 bare, nonzero under --strict (D-44)
//   (e) TWO-ROOT split (VAL-02): GOOD split passes; BAD missing-kit fails naming a missing role;
//       BAD UNSET-kit errors with the literal (C3) message (the no-`.`-fallback / SC4 proof)
//   (g) NULL-LITERAL fail-closed regression (CR-03): null-literal config + plugin.json each
//       degrade to a 'not a JSON object' finding, NOT a TypeError crash
//   (h) OPTIONAL-ENUM recognition (D-14): bad asvs_level / test_integrity=off /
//       production_requires_human_confirmation=false each fail red + name the key; absent keys pass
//   (i) DERIVED KIT SETS (KIT-02 / D-19, Phase 27): the role and workflow name lists follow the
//       FILESYSTEM through kit-model, not a frozen array. Plant an 18th role and a 20th workflow
//       into a temp kit and the validator must SEE them; pin the extension shape so no path join
//       can produce a doubled `.md`; and prove an unreadable kit directory still degrades to a
//       'missing required' finding rather than an unhandled kit-model throw.
//   (j) PHASE 30 (D-05 / D-08 / AUTO-07): the `autonomy` scalar is RETIRED — its presence is now
//       the refusal and its absence is clean — and the `checkpoints` matrix is FORM-CHECKED against
//       the imported roster: an unknown id or a non-canonical disposition is refused by name, while
//       an absent object and an absent id stay the lean default. The shipped and fixture config
//       surfaces are scanned, over a DISCOVERED set with an asserted count, for the retired key.
//
// Two-root resolution (VAL-02 / D-08): KIT_ROOT comes ONLY from VALIDATE_KIT_ROOT (no default);
// STATE_ROOT from VALIDATE_ROOT (else repo root). The single-tree fixtures point BOTH roots at the
// same tree; the split fixtures are built hermetically in a temp dir from scripts/fixtures/good.
// NOTHING outside the temp dir is mutated. Spawns the COMMITTED compiled .js (never the .ts).

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const VALIDATOR_JS = join(ROOT, "scripts", "validate-agent-factory.js");
const FIX = join(ROOT, "scripts", "fixtures");

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// run the validator with explicit kit + state roots (+ optional flag); capture status + output.
function runSplit(
  kitRoot: string,
  stateRoot: string,
  flag?: string,
): SpawnSyncReturns<string> {
  const args = flag ? [VALIDATOR_JS, flag] : [VALIDATOR_JS];
  return spawnSync("node", args, {
    encoding: "utf8",
    env: { ...process.env, VALIDATE_KIT_ROOT: kitRoot, VALIDATE_ROOT: stateRoot },
  });
}

// run a single-tree fixture: both roots point at the same tree (Discretion 4 back-compat).
function runFixture(root: string, flag?: string): SpawnSyncReturns<string> {
  return runSplit(root, root, flag);
}

function out(r: SpawnSyncReturns<string>): string {
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
}

// Build a hermetic kit copy from fixtures/good (agent-factory + AGENTS.md + .claude-plugin),
// optionally including plans/. Returns the new temp root.
function copyGoodKit(includePlans: boolean): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-val-"));
  tmpDirs.push(d);
  cpSync(join(FIX, "good", "agent-factory"), join(d, "agent-factory"), {
    recursive: true,
  });
  cpSync(join(FIX, "good", "AGENTS.md"), join(d, "AGENTS.md"));
  if (existsSync(join(FIX, "good", ".claude-plugin"))) {
    cpSync(join(FIX, "good", ".claude-plugin"), join(d, ".claude-plugin"), {
      recursive: true,
    });
  }
  if (includePlans) {
    cpSync(join(FIX, "good", "plans"), join(d, "plans"), { recursive: true });
  }
  return d;
}

describe("validate-agent-factory.js (VAL-01 / VAL-02 self-test)", () => {
  // (a) D-42 — GREEN on grugops's own tree (bare AND --strict; zero tickets). The kit root IS the
  // repo root here. Supply VALIDATE_KIT_ROOT explicitly (no default).
  it("validator GREEN on grugops's own tree (bare)", () => {
    const r = spawnSync("node", [VALIDATOR_JS], {
      encoding: "utf8",
      env: { ...process.env, VALIDATE_KIT_ROOT: ROOT },
    });
    expect(r.status).toBe(0);
  });

  it("validator GREEN on own tree --strict (zero tickets → zero warnings)", () => {
    const r = spawnSync("node", [VALIDATOR_JS, "--strict"], {
      encoding: "utf8",
      env: { ...process.env, VALIDATE_KIT_ROOT: ROOT },
    });
    expect(r.status).toBe(0);
  });

  // (b) GOOD fixture → exit 0.
  it("GOOD fixture → exit 0", () => {
    const r = runFixture(join(FIX, "good"));
    expect(r.status).toBe(0);
  });

  // (c) BAD fixtures → nonzero + the finding naming the defect.
  it.each([
    ["bad-role-missing-section", /Hard limits/i],
    ["bad-config-no-mode", /mode/i],
    ["bad-plugin-noname", /name/i],
    ["bad-ticket-mismatch", /status/i],
    ["bad-ticket-bad-column", /not a board column/i],
    ["bad-workflow-no-commit", /Commit/i],
  ])("BAD %s → nonzero + finding", (fixture, finding) => {
    const r = runFixture(join(FIX, fixture as string));
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(finding as RegExp);
  });

  // (d) warn-only-no-trace → exit 0 bare, nonzero under --strict (D-44 promotion).
  it("WARN warn-only-no-trace bare → exit 0", () => {
    const r = runFixture(join(FIX, "warn-only-no-trace"));
    expect(r.status).toBe(0);
  });

  it("WARN warn-only-no-trace --strict → nonzero (promotion proven)", () => {
    const r = runFixture(join(FIX, "warn-only-no-trace"), "--strict");
    expect(r.status).not.toBe(0);
  });

  // (e) TWO-ROOT split (VAL-02 / D-08, SC3/SC4).
  it("SPLIT good (kit + state separate) → exit 0", () => {
    const kit = copyGoodKit(false);
    const state = mkdtempSync(join(tmpdir(), "grugops-val-state-"));
    tmpDirs.push(state);
    cpSync(join(FIX, "good", "plans"), join(state, "plans"), { recursive: true });
    const r = runSplit(kit, state);
    expect(r.status).toBe(0);
  });

  it("SPLIT bad-missing-kit (VALIDATE_KIT_ROOT→nonexistent) → nonzero + 'missing required'", () => {
    const state = mkdtempSync(join(tmpdir(), "grugops-val-state-"));
    tmpDirs.push(state);
    cpSync(join(FIX, "good", "plans"), join(state, "plans"), { recursive: true });
    const r = runSplit(join(state, "no-such-kit-dir"), state);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/missing required/i);
  });

  it("SPLIT bad-unset-kit → nonzero + 'VALIDATE_KIT_ROOT is unset' + '(C3)' (no '.'-fallback)", () => {
    // Genuinely UNSET the env var so the no-`.`-fallback C3 guard fires. The env override OMITS
    // VALIDATE_KIT_ROOT entirely (it is not in the merged env passed to the child).
    const env = { ...process.env };
    delete env.VALIDATE_KIT_ROOT;
    const r = spawnSync("node", [VALIDATOR_JS], { encoding: "utf8", env });
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("VALIDATE_KIT_ROOT is unset");
    expect(out(r)).toContain("(C3)");
  });

  // (g) NULL-LITERAL fail-closed regression (CR-03 / GAP-3). JSON.parse("null") returns null
  // without throwing; the validator must degrade it to a finding, NOT a TypeError crash.
  it("null-literal factory.config.json → 'not a JSON object' finding, not a TypeError (CR-03)", () => {
    const kit = copyGoodKit(false);
    writeFileSync(
      join(kit, "agent-factory/config/factory.config.json"),
      "null",
    );
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/not a JSON object/i);
    expect(out(r)).not.toContain("TypeError");
  });

  it("null-literal plugin.json → 'not a JSON object' finding, not a TypeError (CR-03)", () => {
    const kit = copyGoodKit(false);
    mkdirSync(join(kit, ".claude-plugin"), { recursive: true });
    writeFileSync(join(kit, ".claude-plugin/plugin.json"), "null");
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/not a JSON object/i);
    expect(out(r)).not.toContain("TypeError");
  });

  // (h) OPTIONAL-ENUM recognition of the v1.2 dial keys (SDLC-03 / D-14 / TINT-03).
  it("ENUM bad-asvs (security.asvs_level=L4) → nonzero + 'asvs_level'", () => {
    const kit = copyGoodKit(true);
    const p = join(kit, "agent-factory/config/factory.config.json");
    const c = JSON.parse(readFileSync(p, "utf8"));
    c.security = { asvs_level: "L4" };
    writeFileSync(p, JSON.stringify(c, null, 2));
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/asvs_level/i);
  });

  it("ENUM bad-tint (quality.test_integrity=off) → nonzero + 'test_integrity' (TINT-03)", () => {
    const kit = copyGoodKit(true);
    const p = join(kit, "agent-factory/config/factory.config.json");
    const c = JSON.parse(readFileSync(p, "utf8"));
    c.quality = { ...c.quality, test_integrity: "off" };
    writeFileSync(p, JSON.stringify(c, null, 2));
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/test_integrity/i);
  });

  it("WR-01 prod-confirm=false → nonzero + 'production_requires_human_confirmation' (safety floor)", () => {
    const kit = copyGoodKit(true);
    const p = join(kit, "agent-factory/config/factory.config.json");
    const c = JSON.parse(readFileSync(p, "utf8"));
    c.production_requires_human_confirmation = false;
    writeFileSync(p, JSON.stringify(c, null, 2));
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/production_requires_human_confirmation/i);
  });

  it("ENUM absent-keys (fixtures/good has none of the 8) → exit 0 (SC4)", () => {
    const r = runFixture(join(FIX, "good"));
    expect(r.status).toBe(0);
  });

  // ── (i) DERIVED KIT SETS — the D-19 per-consumer assertion for KIT-02 ────────────────────────
  // Before Phase 27 this validator froze a 14-name workflow array and a 16-name role array. Both
  // had rotted: five workflows and one role were never validated and nothing said so. These cases
  // fail if either derivation is reverted to a literal, because a frozen array cannot name a file
  // it was written before.
  //
  // The kit here is a copy of the REAL kit (17 roles + 19 workflows), so planting one more of each
  // gives a genuine 18-role / 20-workflow tree. Both planted files are deliberately INCOMPLETE —
  // they carry no required sections — so a validator that can SEE them must report them, while a
  // validator reading a frozen list stays silent and green.
  function copyRealKitPlusExtras(): { kit: string; role: string; workflow: string } {
    const d = mkdtempSync(join(tmpdir(), "grugops-val-derived-"));
    tmpDirs.push(d);
    cpSync(join(ROOT, "agent-factory"), join(d, "agent-factory"), { recursive: true });
    cpSync(join(ROOT, "AGENTS.md"), join(d, "AGENTS.md"));
    cpSync(join(ROOT, ".claude-plugin"), join(d, ".claude-plugin"), { recursive: true });
    // Role #18 — a plain `.md` that is not `_`-prefixed, so kit-model counts it as a role.
    const role = "zz-derived-probe-role";
    writeFileSync(
      join(d, "agent-factory/roles", `${role}.md`),
      "# Derived probe role\n\nNo required sections on purpose.\n",
    );
    // Workflow #20 — the `NN-` numeric prefix is what kit-model's workflow filter keys on.
    const workflow = "19-derived-probe-workflow";
    writeFileSync(
      join(d, "agent-factory/workflows", `${workflow}.md`),
      "# Derived probe workflow\n\nNo required sections on purpose.\n",
    );
    return { kit: d, role, workflow };
  }

  it("DERIVED roles+workflows: an 18th role and a 20th workflow are SEEN (frozen lists could not)", () => {
    const { kit, role, workflow } = copyRealKitPlusExtras();
    const r = runSplit(kit, ROOT);
    expect(r.status).not.toBe(0);
    // Named by path — the derivation followed the filesystem into files no frozen array knew.
    expect(out(r)).toContain(`agent-factory/roles/${role}.md`);
    expect(out(r)).toContain(`agent-factory/workflows/${workflow}.md`);
  });

  it("DERIVED shape: names are extension-stripped at the call site — no path carries a doubled .md", () => {
    const { kit } = copyRealKitPlusExtras();
    const r = runSplit(kit, ROOT);
    // kit-model returns filenames WITH `.md`; this validator's consumers append `.md` themselves.
    // If the strip were dropped, every derived path join would carry two extensions and every
    // existence check would fail as a bogus finding. Assert on the OUTPUT, which is full of paths.
    expect(out(r)).not.toMatch(/\.md\.md/);
    // And the paths it does print are well-formed single-extension kit paths.
    expect(out(r)).toMatch(/agent-factory\/(roles|workflows)\/[^\s:]+\.md:/);
  });

  it("DERIVED vacuity floor: an unreadable kit role/workflow dir → 'missing required' finding, not a throw", () => {
    // kit-model THROWS on an unreadable or empty directory (its tier-1 fail-closed posture). This
    // validator must convert that into an ordinary finding — its own contract is that a missing or
    // garbled input becomes a finding, never an unhandled exception.
    const kit = mkdtempSync(join(tmpdir(), "grugops-val-emptykit-"));
    tmpDirs.push(kit);
    mkdirSync(join(kit, "agent-factory"), { recursive: true });
    const r = runSplit(kit, ROOT);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/missing required role directory/i);
    expect(out(r)).toMatch(/missing required workflow directory/i);
    // Fail-closed, not fail-loud: no stack trace escaped.
    expect(out(r)).not.toContain("kit-model: cannot read kit directory");
    expect(out(r)).not.toContain("at Object.");
  });

  // (h.4) config byte-identity (the tri-file dial edit must not drift).
  it("config JSONs byte-identical (config/ == seed/.grugops/) via Buffer.equals", () => {
    const a = readFileSync(
      join(ROOT, "agent-factory/config/factory.config.json"),
    );
    const b = readFileSync(
      join(ROOT, "agent-factory/seed/.grugops/factory.config.json"),
    );
    expect(a.equals(b)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// (j) PHASE 30 — the retired `autonomy` scalar and the `checkpoints` matrix (D-05 / D-08 / AUTO-07).
//
// THE POLARITY FLIP. Until this phase the validator refused the ABSENCE of `autonomy`; it now
// refuses its PRESENCE, and the refusal names the replacement so a reader can act without opening a
// document. `mode` and `cadence` stay required — the flip is one key wide.
//
// THE FORM CHECK, AND THE CONTRACT IT INHERITS. The `checkpoints` object follows the same
// ACTIVE-WHEN-PRESENT / LENIENT-WHEN-ABSENT contract the v1.2 dial keys already carry: an absent
// object and an absent individual id are the documented lean default and never an error (AUTO-07),
// and only a PRESENT invalid declaration is refused. It differs from the quality block in one
// respect the cases below pin: the legal KEY set is the imported roster, so an unknown id is itself
// a refusal — a checkpoint the roster does not carry cannot be gated, and silently accepting it
// would let a typo read as a configured stop that never fires.
//
// The roster is IMPORTED here for the same reason the validator imports it: a second array of
// checkpoint ids in either file is the set-literal drift this milestone exists to close, and a
// stale copy would keep passing while the roster grew past it.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const cp: typeof import("./checkpoints.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "checkpoints.js")).href
);

/** A good-kit copy whose config has been mutated in place. Returns the temp kit root. */
function kitWithConfig(mutate: (c: Record<string, unknown>) => void): string {
  const kit = copyGoodKit(true);
  const p = join(kit, "agent-factory/config/factory.config.json");
  const c = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
  mutate(c);
  writeFileSync(p, JSON.stringify(c, null, 2));
  return kit;
}

/** Every roster id at one disposition — built from the IMPORTED roster, never from a list here. */
function wholeMatrix(d: string): Record<string, string> {
  return Object.fromEntries(cp.CHECKPOINTS.map((id) => [id, d]));
}

describe("validate-agent-factory.js — the retired `autonomy` scalar (D-05)", () => {
  it("REFUSES a config that carries `autonomy`, naming the replacement key", () => {
    const kit = kitWithConfig((c) => {
      c.autonomy = "pr";
    });
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/autonomy/);
    // The message must name the replacement, not merely say "no".
    expect(out(r)).toMatch(/checkpoints/);
  });

  it("REFUSES `autonomy` at every legacy grade value, not only the shipped one", () => {
    for (const grade of Object.keys(cp.LEGACY_AUTONOMY_GRADES)) {
      const kit = kitWithConfig((c) => {
        c.autonomy = grade;
      });
      const r = runFixture(kit);
      expect(r.status, `autonomy="${grade}" was accepted`).not.toBe(0);
      expect(out(r)).toMatch(/autonomy/);
    }
  });

  it("a config WITHOUT `autonomy` validates clean — its absence is no longer an error", () => {
    const kit = kitWithConfig((c) => {
      delete c.autonomy;
    });
    expect(runFixture(kit).status).toBe(0);
  });

  it("`mode` and `cadence` remain required (the flip is exactly one key wide)", () => {
    for (const key of ["mode", "cadence"]) {
      const kit = kitWithConfig((c) => {
        delete c[key];
      });
      const r = runFixture(kit);
      expect(r.status, `deleting "${key}" was accepted`).not.toBe(0);
      expect(out(r)).toMatch(new RegExp(key));
    }
  });
});

describe("validate-agent-factory.js — the `checkpoints` matrix form check (D-08 / AUTO-07)", () => {
  it("an ABSENT `checkpoints` object → exit 0 (the lean default, never an error)", () => {
    const kit = kitWithConfig((c) => {
      delete c.checkpoints;
    });
    expect(runFixture(kit).status).toBe(0);
  });

  it("a PARTIAL `checkpoints` object → exit 0 (an omitted id is never an error)", () => {
    const kit = kitWithConfig((c) => {
      c.checkpoints = { open_pr: "notify" };
    });
    expect(runFixture(kit).status).toBe(0);
  });

  it("an UNKNOWN checkpoint id → nonzero, and the message names the offending id", () => {
    const kit = kitWithConfig((c) => {
      c.checkpoints = { open_pr: "block", not_a_real_checkpoint: "block" };
    });
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/not_a_real_checkpoint/);
  });

  it("a NON-CANONICAL disposition → nonzero, naming the key and listing the allowed values", () => {
    const kit = kitWithConfig((c) => {
      c.checkpoints = { open_pr: "warn" };
    });
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/checkpoints\.open_pr/);
    for (const d of cp.DISPOSITIONS) expect(out(r)).toMatch(new RegExp(d));
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["a string", "block"],
    ["a number", 3],
    ["a boolean", true],
  ])("a `checkpoints` value that is %s → nonzero, naming the key", (_label, value) => {
    const kit = kitWithConfig((c) => {
      c.checkpoints = value;
    });
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/checkpoints/);
  });

  it("the TINT-03 carve-out: `checkpoints.test_integrity: off` is refused by name", () => {
    const kit = kitWithConfig((c) => {
      c.checkpoints = { test_integrity: "off" };
    });
    const r = runFixture(kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/test_integrity/);
    expect(out(r)).toMatch(/TINT-03/);
  });

  // NON-VACUITY. The three runs below drive the WHOLE imported roster through the validator, so a
  // hand-copied thirteen-id list inside the validator (the roster grew to fourteen in plan 30-04)
  // would refuse the fourteenth and go red here. A per-id loop would spawn 42 processes for the
  // same information; three whole-matrix runs cover every id at every canonical value.
  it("EVERY roster id is accepted at `block` and at `notify` (the imported set, not a copy)", () => {
    for (const d of ["block", "notify"]) {
      const kit = kitWithConfig((c) => {
        c.checkpoints = wholeMatrix(d);
      });
      const r = runFixture(kit);
      expect(r.status, `whole matrix at "${d}" was refused: ${out(r)}`).toBe(0);
    }
  });

  it("EVERY roster id except the carved-out one is accepted at `off`", () => {
    const kit = kitWithConfig((c) => {
      const m = wholeMatrix("off");
      m.test_integrity = "block"; // the one cell TINT-03 excludes
      c.checkpoints = m;
    });
    const r = runFixture(kit);
    expect(r.status, out(r)).toBe(0);
  });

  it("the roster the cases above drive is the FOURTEEN-member imported one, not a stale thirteen", () => {
    // Guards the guard: if `wholeMatrix` were ever fed a shrunken roster the runs above would pass
    // while covering less. The count is read from the module, and the floor is the roster size plan
    // 30-04 settled — a shrink is red here rather than silently narrowing the coverage above.
    expect(cp.CHECKPOINTS.length).toBeGreaterThanOrEqual(14);
    expect(new Set(cp.CHECKPOINTS).size).toBe(cp.CHECKPOINTS.length);
  });
});

describe("each deliberately-broken fixture still fails for EXACTLY its own reason (Pitfall 3)", () => {
  // A bare non-zero exit cannot tell "fails for its one defect" from "fails for its one defect AND
  // a config-key finding the retirement introduced". A fixture that has quietly started failing for
  // a second reason has stopped testing the thing it was built to test, which is a silently deleted
  // test. So each row asserts the FINDING SET, not the exit status: the intended finding is present,
  // and the count of configuration findings is exactly the number that fixture exists to produce.
  //
  // `bad-config-no-mode` is the one fixture whose OWN defect is a configuration key, so its expected
  // configuration-finding count is 1 and the others' is 0. Stating that per row — rather than
  // exempting the fixture from the check — keeps the assertion honest for all eight.
  const INTENT: ReadonlyArray<readonly [string, RegExp, number, number]> = [
    // [fixture, its intended finding, expected config findings, expected bare exit status]
    ["bad-role-missing-section", /Hard limits/i, 0, 1],
    ["bad-config-no-mode", /missing or empty required key "mode"/, 1, 1],
    ["bad-plugin-noname", /name/i, 0, 1],
    ["bad-ticket-mismatch", /status/i, 0, 1],
    ["bad-ticket-bad-column", /not a board column/i, 0, 1],
    ["bad-workflow-no-commit", /Commit/i, 0, 1],
    // `good` has no defect: its intent is that NOTHING is found, so its row asserts the absence of
    // any finding rather than the presence of one. `warn-only-no-trace` exits 0 bare but must still
    // EMIT its warning — asserting only its exit status would pass over a run that found nothing.
    ["good", /ALL CHECKS PASSED/i, 0, 0],
    ["warn-only-no-trace", /WARN/, 0, 0],
  ];

  it("the intent table names EVERY fixture repository on disk, and no other", () => {
    // Two-sided, so neither a fixture added without a row nor a row naming a deleted fixture can
    // hide. The disk side is discovered; the table side is written. Equality is the assertion.
    const onDisk = readdirSync(FIX, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    expect(INTENT.map(([f]) => f).sort()).toEqual(onDisk);
    expect(onDisk.length).toBe(8);
  });

  it.each(INTENT)(
    "%s: its own finding is present and it produces exactly the configuration findings it should",
    (fixture, intended, configFindings, exitStatus) => {
      const r = runFixture(join(FIX, fixture));
      expect(r.status, `${fixture} exit status`).toBe(exitStatus);
      expect(out(r), `${fixture} did not emit its intended finding`).toMatch(intended);
      if (fixture === "good") expect(out(r)).not.toMatch(/^\s*(ERROR|WARN)\b/m);
      const configLines = out(r)
        .split("\n")
        .filter((l) => l.includes("agent-factory/config/factory.config.json:"));
      expect(
        configLines,
        `${fixture} produced ${configLines.length} configuration finding(s), expected ${configFindings}`,
      ).toHaveLength(configFindings);
    },
  );
});

describe("validate-agent-factory.ts — the legal key set is IMPORTED, never restated", () => {
  it("no roster id is written as a literal in the validator except the two that are ALSO config keys", () => {
    const src = readFileSync(join(ROOT, "scripts", "validate-agent-factory.ts"), "utf8");
    const spelled = cp.CHECKPOINTS.filter((id) => src.includes(id)).sort();
    // `test_integrity` is also the legacy `quality.test_integrity` enum key AND the TINT-03
    // carve-out this file states by name; `production_requires_human_confirmation` is also the
    // top-level WR-01 safety-floor boolean. Every OTHER roster id must reach this file only through
    // the import — a third spelling means an array of ids was written back in.
    expect(spelled).toEqual(
      ["production_requires_human_confirmation", "test_integrity"].sort(),
    );
    expect(src).toMatch(/from "\.\/checkpoints\.js"/);
  });
});

describe("the retired key is gone from every shipped and fixture config surface (D-05)", () => {
  // The surface set is DISCOVERED, never listed: the two shipped JSON twins plus one JSON per
  // fixture repository found by reading the fixture directory. The count is asserted so a ninth
  // fixture added later cannot slip through un-scanned.
  const fixtureDirs = readdirSync(FIX, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const surfaces = [
    join(ROOT, "agent-factory/config/factory.config.json"),
    join(ROOT, "agent-factory/seed/.grugops/factory.config.json"),
    ...fixtureDirs.map((d) => join(FIX, d, "agent-factory/config/factory.config.json")),
  ];

  it("the discovered surface set is the eight fixture repositories plus the two shipped twins", () => {
    expect(fixtureDirs.length).toBe(8);
    expect(surfaces.length).toBe(fixtureDirs.length + 2);
    for (const s of surfaces) expect(existsSync(s), `${s} is missing`).toBe(true);
  });

  it("not one of those config surfaces carries the retired `autonomy` key", () => {
    const carriers = surfaces.filter((s) =>
      Object.prototype.hasOwnProperty.call(JSON.parse(readFileSync(s, "utf8")), "autonomy"),
    );
    expect(carriers).toEqual([]);
  });

  it("the human-readable twin documents no `autonomy` field row", () => {
    const twin = readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8");
    // A field row is a table line beginning with the key in backticks. The legacy GRADE table is
    // deliberately allowed to name the retired scalar — that table is the migration path — so the
    // scan is for a FIELD ROW, not for the word.
    expect(twin).not.toMatch(/^\|\s*`autonomy`\s*\|/m);
  });
});
