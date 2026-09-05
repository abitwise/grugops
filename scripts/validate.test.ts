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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 (RED-TEAM SURFACE B, ROUND 1) — FINDING B-1: THE FORM CHECK IS ASKED AT THE WRONG FILE.
//
// `readGovernanceConfig` (scripts/context-io.ts) resolves the governance configuration from TWO
// locations, IN ORDER: the repo-dropped `.grugops/factory.config.json` FIRST, then the in-kit
// `agent-factory/config/factory.config.json`. `checkConfig` read only the second one. So every
// finding this validator can produce about a governance configuration — the required-key loop, the
// retired-`autonomy` refusal, the `checkpoints` form check, the TINT-03 carve-out, the WR-01
// boolean and the dial enums — was asked at the file the reader consults SECOND and never at the
// file that actually governs. Measured pre-fix: 9 of 9 must-refuse payloads written to
// `.grugops/factory.config.json` produced `ALL CHECKS PASSED`, exit 0, while the SAME bytes in the
// kit config exit 1.
//
// This is P27 round 10's shape — a predicate that accepts the right characters and is never
// consulted at the position that matters — and it is invisible in this repository because this
// repository carries no `.grugops/factory.config.json`, so the shadowed file has never existed here.
//
// THE FIX IS POSITIONAL, NOT A WIDER PATTERN: one form-check authority, asked at EVERY position the
// governance reader would consult, with the candidate list exported from the reader so the two
// cannot come to disagree about which file governs.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const cio: typeof import("./context-io.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "context-io.js")).href
);

/** A good-kit copy carrying a raw repo-dropped `.grugops/factory.config.json`. */
function kitWithDroppedConfig(body: string): string {
  const kit = copyGoodKit(true);
  mkdirSync(join(kit, ".grugops"), { recursive: true });
  writeFileSync(join(kit, ".grugops", "factory.config.json"), body);
  return kit;
}

describe("30-10 B-1 — the config form check is asked at EVERY position the reader would consult", () => {
  // Every payload the validator refuses in the kit config. Written to the SHADOWING file instead.
  // The list is the finding set of `checkConfig` itself, one payload per arm, so a single arm left
  // unreachable at the governing position still reds here.
  //
  // ROUND 3 REMOVED ONE ROW FROM THIS LIST, AND THE REMOVAL IS RECORDED RATHER THAN QUIET.
  // `["a missing required key", '{"cadence":"kanban"}', /"mode"/]` was here, asserting that a
  // `.grugops` drop omitting `mode` is refused. Reviewer 4's observation 4 established that this was
  // F1 over-reaching: nothing reads `mode` or `cadence` out of that file — every consumer of those
  // two keys reads the in-kit config by its own fixed path — so refusing a checkpoints-only override,
  // the most natural use of the position, was a false red on the position F1 had just repaired. The
  // required-key arm now runs only at the in-kit config, which has its own case, and the
  // checkpoints-only override has one too. Every OTHER arm below still runs at every position.
  const mustRefuse: readonly (readonly [string, string, RegExp])[] = [
    ["the retired autonomy scalar", '{"mode":"m","cadence":"c","autonomy":"pr"}', /autonomy/],
    [
      "an unknown checkpoint id",
      '{"mode":"m","cadence":"c","checkpoints":{"not_a_real_checkpoint":"off"}}',
      /not_a_real_checkpoint/,
    ],
    [
      "a non-canonical disposition",
      '{"mode":"m","cadence":"c","checkpoints":{"open_pr":"OFF"}}',
      /open_pr/,
    ],
    [
      "a checkpoints value a matrix cannot come out of",
      '{"mode":"m","cadence":"c","checkpoints":"not-an-object"}',
      /checkpoints/,
    ],
    [
      "the TINT-03 carve-out",
      '{"mode":"m","cadence":"c","checkpoints":{"test_integrity":"off"}}',
      /test_integrity/,
    ],
    [
      "the WR-01 deploy boolean",
      '{"mode":"m","cadence":"c","production_requires_human_confirmation":false}',
      /production_requires_human_confirmation/,
    ],
    ["an out-of-enum dial", '{"mode":"m","cadence":"c","security":{"asvs_level":"L4"}}', /asvs_level/],
    ["bytes that are not JSON at all", "not json at all", /not valid JSON/],
  ];

  it.each(mustRefuse)(
    "%s written to the SHADOWING .grugops config is refused",
    (_label, body, finding) => {
      const kit = kitWithDroppedConfig(body);
      const r = runSplit(kit, kit);
      expect(r.status, `exit status for ${body}`).not.toBe(0);
      expect(out(r)).toMatch(finding);
      // …and the finding names the file it is about, so a reader can act on it.
      expect(out(r)).toContain(".grugops/factory.config.json");
    },
  );

  it("the SAME payload is still refused in the kit config — the kit arm is not traded away", () => {
    const kit = kitWithConfig((c) => {
      (c as Record<string, unknown>).checkpoints = { test_integrity: "off" };
    });
    const r = runSplit(kit, kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("agent-factory/config/factory.config.json");
  });

  it("an ABSENT .grugops config changes nothing — the lean default is untouched (AUTO-07)", () => {
    const kit = copyGoodKit(true);
    expect(existsSync(join(kit, ".grugops", "factory.config.json"))).toBe(false);
    expect(runSplit(kit, kit).status).toBe(0);
  });

  it("a VALID .grugops config passes, so the new arm is not a blanket refusal", () => {
    const kit = kitWithDroppedConfig(
      JSON.stringify({ mode: "lean", cadence: "kanban", checkpoints: wholeMatrix("notify") }),
    );
    const r = runSplit(kit, kit);
    expect(out(r)).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });

  it("the checked positions EQUAL the reader's candidate list — derived on both sides", () => {
    // The anti-drift half. The reader owns "which files are governance configuration"; the
    // validator must ask its form check at exactly those positions and at no invented third one.
    // Both sides are DERIVED here: the left from the reader's exported candidate function, the
    // right from the paths the validator actually names when every one of them is poisoned.
    const kit = kitWithDroppedConfig('{"mode":"m","cadence":"c","autonomy":"pr"}');
    const p = join(kit, "agent-factory/config/factory.config.json");
    const c = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
    c.autonomy = "pr";
    writeFileSync(p, JSON.stringify(c, null, 2));

    const r = runSplit(kit, kit);
    const named = new Set(
      out(r)
        .split("\n")
        .flatMap((l) => {
          const m = l.match(/ERROR\s+(\S+?):/);
          return m ? [m[1]] : [];
        })
        .filter((f) => f.endsWith("factory.config.json")),
    );
    const expected = new Set(
      cio.governanceConfigCandidates(kit).map((abs) => abs.slice(kit.length + 1).split("\\").join("/")),
    );
    expect(expected.size).toBeGreaterThan(1);
    expect([...named].sort()).toEqual([...expected].sort());
  });

  it("one file checked once — a state candidate that IS the kit config produces ONE finding", () => {
    // In this repository the two roots coincide and the second candidate resolves to the file the
    // kit arm already checked. A form check applied twice to one file would double every finding,
    // which is how a positional fix turns into a reporting defect.
    const kit = kitWithConfig((c) => {
      (c as Record<string, unknown>).autonomy = "pr";
    });
    const lines = out(runSplit(kit, kit))
      .split("\n")
      .filter((l) => l.includes("the retired \"autonomy\" key is present"));
    expect(lines).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 ROUND 2 — F1 (R1-1 ≡ R2-2, HIGH) and F3 (R1-3 ≡ R2-5, LOW).
//
// F1 — ROUND 1'S OWN FIX INTRODUCED THIS. B-1 took the POSITIONS from the reader and left the BASE
// hand-chosen: `checkConfig` iterated `governanceConfigCandidates(STATE_ROOT)` and one fixed kit
// relpath. `readGovernanceConfig(repoRoot?)` has TWO bases — the caller's, and, when the caller
// passes nothing, its own module-relative `ROOT`, which in the shipped shared-install IS THE KIT
// ROOT. That fallback is the declared default of `admit()`, `admitAndAppend()` and the
// `context-io.js admit` CLI. So `<KIT_ROOT>/.grugops/factory.config.json` is the reader's FIRST
// candidate under its fallback base and was form-checked at no position.
//
// AND THE HARNESS PREMISE FAILED. Every case in round 1's B-1 block — including the one titled
// "the checked positions EQUAL the reader's candidate list" — ran `runSplit(kit, kit)`. With the two
// roots coinciding there is exactly one base, so the equality was trivially true and the fixture
// never exhibited the condition the case exists to bound. The two-root split is the documented
// shared-install shape, and it is what these cases drive now.
//
// F3 — THE SAME REPAIR CLOSES IT. `kitRead` conflated ABSENT with UNREADABLE (both `null`), the kit
// arm treated `null` as absence, and round 1's resolved-path dedupe then skipped the state arm —
// the only one that knows how to say "exists but could not be read" — for exactly that path. So an
// unreadable governing config produced `ALL CHECKS PASSED`: a gate reporting a verdict for a check
// it did not perform, which is the Phase 28 AP-1 anti-pattern this phase carries forward.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Two DISTINCT roots: a kit tree and a state tree, the documented shared-install arrangement. */
function twoRoots(): { kit: string; state: string } {
  const kit = copyGoodKit(false);
  const state = mkdtempSync(join(tmpdir(), "grugops-val-state2-"));
  tmpDirs.push(state);
  cpSync(join(FIX, "good", "plans"), join(state, "plans"), { recursive: true });
  return { kit, state };
}

/** The payload carrying one instance of every finding `checkConfigForm` can produce. */
const SIX_ERROR_PAYLOAD = JSON.stringify({
  mode: "lean",
  cadence: "kanban",
  autonomy: "pr",
  checkpoints: { test_integrity: "off", open_pr: "OFF", not_a_real_checkpoint: "off" },
  production_requires_human_confirmation: false,
  security: { asvs_level: "L4" },
});

describe("30-10 R2 F1 — the form check is asked under EVERY base the reader can resolve against", () => {
  it("the two-root control still passes with no governance config dropped anywhere", () => {
    const { kit, state } = twoRoots();
    const r = runSplit(kit, state);
    expect(out(r)).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });

  it("the SAME bytes are refused at the STATE base — the positive control", () => {
    const { kit, state } = twoRoots();
    mkdirSync(join(state, ".grugops"), { recursive: true });
    writeFileSync(join(state, ".grugops", "factory.config.json"), SIX_ERROR_PAYLOAD);
    const r = runSplit(kit, state);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(".grugops/factory.config.json");
    expect(out(r)).toMatch(/test_integrity/);
  });

  it("…and at the KIT base, which the reader consults FIRST under its fallback root", () => {
    const { kit, state } = twoRoots();
    mkdirSync(join(kit, ".grugops"), { recursive: true });
    writeFileSync(join(kit, ".grugops", "factory.config.json"), SIX_ERROR_PAYLOAD);
    const r = runSplit(kit, state);
    expect(r.status, `kit-base payload was accepted:\n${out(r)}`).not.toBe(0);
    expect(out(r)).toContain(".grugops/factory.config.json");
    expect(out(r)).toMatch(/test_integrity/);
    expect(out(r)).toMatch(/autonomy/);
    expect(out(r)).toMatch(/not_a_real_checkpoint/);
  });

  it("every finding checkConfigForm can produce fires at the KIT base, not just one", () => {
    const { kit, state } = twoRoots();
    mkdirSync(join(kit, ".grugops"), { recursive: true });
    writeFileSync(join(kit, ".grugops", "factory.config.json"), SIX_ERROR_PAYLOAD);
    const lines = out(runSplit(kit, state))
      .split("\n")
      .filter((l) => l.includes(".grugops/factory.config.json:"));
    // Six independent arms: the retired scalar, the TINT-03 carve-out, the unknown id, the
    // non-canonical disposition, the WR-01 boolean and the out-of-enum dial. A repair that reached
    // the position but only ran one arm would satisfy the case above and fail this one.
    expect(lines.length, lines.join("\n")).toBeGreaterThanOrEqual(6);
  });

  it("the BASE set comes from the reader, and the checked positions are bases × candidates", () => {
    // ROUND 1'S CASE, REPAIRED. It ran over coinciding roots, where "the positions equal the
    // reader's candidate list" holds for one base and says nothing about the split it names. It is
    // driven over DISTINCT roots now, and the expected set is the cross product of the reader's
    // published bases and its published candidates — both derived, neither typed here.
    const { kit, state } = twoRoots();
    // DISTINCT payloads per base. Both positions render the same repo-relative LABEL
    // (`.grugops/factory.config.json`), so a case keyed on labels alone cannot tell which base was
    // checked — it would pass on a repair that reached only one of them. The unknown-id arm quotes
    // the offending id back, so the ids are the discriminator.
    for (const [base, id] of [[kit, "kit_base_only_id"], [state, "state_base_only_id"]] as const) {
      mkdirSync(join(base, ".grugops"), { recursive: true });
      writeFileSync(
        join(base, ".grugops", "factory.config.json"),
        JSON.stringify({ mode: "lean", cadence: "kanban", checkpoints: { [id]: "off" } }),
      );
    }
    const p = join(kit, "agent-factory/config/factory.config.json");
    const c = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
    c.autonomy = "pr";
    writeFileSync(p, JSON.stringify(c, null, 2));

    const r = runSplit(kit, state);
    const named = new Set(
      out(r)
        .split("\n")
        .flatMap((l) => {
          const m = l.match(/ERROR\s+(\S+?):/);
          return m ? [m[1]] : [];
        })
        .filter((f) => f.endsWith("factory.config.json")),
    );
    // The three positions that EXIST in this arrangement: both drops, plus the kit's in-kit config.
    expect([...named].sort()).toEqual(
      [".grugops/factory.config.json", "agent-factory/config/factory.config.json"].sort(),
    );
    // Non-vacuity of the two-root premise itself: the roots really are distinct, and BOTH bases'
    // own payloads are named, so a repair that reached only one of them fails here.
    expect(kit).not.toBe(state);
    expect(out(r)).toMatch(/autonomy/);
    expect(out(r), "the STATE base was not checked").toMatch(/state_base_only_id/);
    expect(out(r), "the KIT base was not checked").toMatch(/kit_base_only_id/);
  });
});

describe("30-10 R2 F3 — a governance config that EXISTS and cannot be READ is named, never passed over", () => {
  it("an unreadable in-kit config is reported by name rather than treated as absent", () => {
    const kit = copyGoodKit(true);
    const p = join(kit, "agent-factory/config/factory.config.json");
    rmSync(p);
    mkdirSync(p); // a directory where a file belongs: existsSync true, readFileSync throws EISDIR
    const r = runSplit(kit, kit);
    expect(r.status, `an unreadable governing config passed:\n${out(r)}`).not.toBe(0);
    expect(out(r)).toMatch(/agent-factory\/config\/factory\.config\.json: exists but could not be read/);
  });

  it("an unreadable repo-dropped config is reported by name too — one rule, every position", () => {
    const kit = copyGoodKit(true);
    mkdirSync(join(kit, ".grugops", "factory.config.json"), { recursive: true });
    const r = runSplit(kit, kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/\.grugops\/factory\.config\.json: exists but could not be read/);
  });

  it("an ABSENT config is still not a form finding — absence and unreadability stay different facts", () => {
    const kit = copyGoodKit(true);
    expect(existsSync(join(kit, ".grugops", "factory.config.json"))).toBe(false);
    const r = runSplit(kit, kit);
    expect(r.status).toBe(0);
    expect(out(r)).not.toMatch(/could not be read/);
  });
});

describe("30-10 R2 F1 — the fallback base is a KIT root BY CONSTRUCTION, asserted not argued", () => {
  it("`GOVERNANCE_FALLBACK_BASE` is the parent of the running reader module, i.e. a kit root", () => {
    // WHY THIS CASE EXISTS. The validator's base set is its own two documented roots. The reader has
    // a THIRD base — its own module-relative fallback — and the claim that covering `KIT_ROOT`
    // covers it rests entirely on that fallback being `<kit>`. That is a fact about the filesystem,
    // so it is measured here rather than asserted in a comment: the base must carry the reader's own
    // module and the kit tree beside it.
    const fallback = cio.GOVERNANCE_FALLBACK_BASE;
    expect(existsSync(join(fallback, "scripts", "context-io.js")), `${fallback} carries no reader`).toBe(true);
    expect(existsSync(join(fallback, "agent-factory")), `${fallback} is not a kit root`).toBe(true);
    // …and the candidate list under it is the same relative set, so "which files" cannot differ
    // between bases even though "which base" can.
    expect(
      cio.governanceConfigCandidates(fallback).map((p) => p.slice(fallback.length + 1).split("\\").join("/")),
    ).toEqual([...cio.GOVERNANCE_CONFIG_RELPATHS]);
  });

  it("the validator declares NO base beyond its own two documented roots", () => {
    // The new degree of freedom this repair introduces is a BASE SET, and a hand-listed set is this
    // repository's founding defect class. It is bounded by construction — the members are the two
    // env-var-resolved root constants and nothing else — and that is what this source scan asserts:
    // a third base cannot enter without a third root literal appearing beside them.
    const src = readFileSync(join(ROOT, "scripts", "validate-agent-factory.ts"), "utf8");
    const decl = src.match(/const GOVERNANCE_BASES:[^=]*=\s*\[([^\]]*)\]/);
    expect(decl, "GOVERNANCE_BASES is not declared as an array literal").not.toBeNull();
    const members = (decl?.[1] ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    expect(members).toEqual(["KIT_ROOT", "STATE_ROOT"]);
    // And the two roots are the two documented env vars, spelled once each.
    expect((src.match(/process\.env\.VALIDATE_KIT_ROOT/g) ?? []).length).toBeGreaterThan(0);
    expect((src.match(/process\.env\.VALIDATE_ROOT/g) ?? []).length).toBeGreaterThan(0);
    // No candidate path literal was written back into `checkConfig` by the repair. The scan is
    // bounded by that function's OWN closing brace rather than run file-wide: the required-file
    // existence loop elsewhere legitimately names the in-kit config, and a file-wide scan would be
    // asserting about a different predicate — the axis this project has recorded losing before.
    const from = src.indexOf("function checkConfig(): void {");
    expect(from, "checkConfig not found").toBeGreaterThan(-1);
    const to = src.indexOf("\n}\n", from);
    expect(to, "checkConfig has no closing brace").toBeGreaterThan(from);
    const body = src.slice(from, to);
    for (const rel of cio.GOVERNANCE_CONFIG_RELPATHS) {
      expect(body.includes(`"${rel}"`), `${rel} is spelled as a literal inside checkConfig`).toBe(false);
    }
    // …and the body genuinely contains the loop, so the slice is not empty-by-accident.
    expect(body).toContain("GOVERNANCE_BASES");
    expect(body).toContain("governanceConfigCandidates");
  });
});

describe("30-10 R4-3 — the run NAMES the governance positions it examined", () => {
  it("the SCOPE line names every governance config the run form-checked", () => {
    const { kit, state } = twoRoots();
    for (const [base, id] of [[kit, "kit_scope_id"], [state, "state_scope_id"]] as const) {
      mkdirSync(join(base, ".grugops"), { recursive: true });
      writeFileSync(
        join(base, ".grugops", "factory.config.json"),
        JSON.stringify({ mode: "lean", cadence: "kanban", checkpoints: { [id]: "off" } }),
      );
    }
    const o = out(runSplit(kit, state));
    expect(o).toMatch(/SCOPE\s+governance configurations examined:/);
    expect(o).toContain(".grugops/factory.config.json");
    expect(o).toContain("agent-factory/config/factory.config.json");
  });

  it("with NO state root supplied the run SAYS which class it did not examine", () => {
    // R4-3's own shape: the state root defaults to this script's tree, both bases resolve to it, and
    // a repository-level config elsewhere is checked at no base. The run no longer reports a clean
    // verdict without naming that — which is the property the finding is about.
    const r = spawnSync("node", [VALIDATOR_JS], {
      encoding: "utf8",
      env: (() => {
        const e = { ...process.env, VALIDATE_KIT_ROOT: ROOT };
        delete e.VALIDATE_ROOT;
        return e;
      })(),
    });
    expect(r.status).toBe(0);
    expect(out(r)).toMatch(/VALIDATE_ROOT was not supplied/);
    expect(out(r)).toMatch(/was NOT examined/);
    expect(out(r)).toMatch(/Pass VALIDATE_ROOT=<repo>/);
  });

  it("with a DISTINCT state root supplied the run makes no such statement", () => {
    // The other arm, two-sided: the caveat is about the DEFAULT, so an operator who supplied a state
    // root must not be told their repository was skipped.
    const { kit, state } = twoRoots();
    const o = out(runSplit(kit, state));
    expect(o).toMatch(/SCOPE\s+governance configurations examined:/);
    expect(o).not.toMatch(/VALIDATE_ROOT was not supplied/);
  });

  it("a run that examined NO governance config says so rather than listing nothing", () => {
    const kit = mkdtempSync(join(tmpdir(), "grugops-val-nocfg-"));
    tmpDirs.push(kit);
    mkdirSync(join(kit, "agent-factory"), { recursive: true });
    const o = out(runSplit(kit, kit));
    expect(o).toMatch(/governance configurations examined: none/);
  });
});

describe("30-10 R3 — reviewer 4 obs. 4: a checkpoints-only repo override is not a malformed config", () => {
  it("a `.grugops` drop carrying only `checkpoints` passes — mode/cadence are not read from it", () => {
    // F1 applied the WHOLE per-file predicate at a position that previously had no predicate at all,
    // so the most natural use of the first candidate — a repository dropping a checkpoints-only
    // override — was refused for `missing or empty required key "mode"`. The reader reads such a
    // file happily and governs from it, and NOTHING reads `mode` or `cadence` out of it: every
    // consumer of those two keys reads the in-kit config by its own fixed path. A false red on the
    // position's natural use is exactly the pressure that gets a repair widened back out.
    const kit = copyGoodKit(true);
    mkdirSync(join(kit, ".grugops"), { recursive: true });
    writeFileSync(
      join(kit, ".grugops", "factory.config.json"),
      JSON.stringify({ checkpoints: { open_pr: "notify" } }),
    );
    const r = runSplit(kit, kit);
    expect(out(r), "a checkpoints-only override was refused").toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });

  it("…and the KIT config still owes mode and cadence — the requirement moved, it did not vanish", () => {
    const kit = kitWithConfig((c) => {
      delete (c as Record<string, unknown>).mode;
    });
    const r = runSplit(kit, kit);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/agent-factory\/config\/factory\.config\.json: missing or empty required key "mode"/);
  });

  it("every OTHER arm still runs at the repo-drop position — only the required-key loop is scoped", () => {
    // The bound on the new freedom: exactly one arm differs by position. All six form checks are
    // driven at the drop position and each must still fire.
    const kit = copyGoodKit(true);
    mkdirSync(join(kit, ".grugops"), { recursive: true });
    writeFileSync(join(kit, ".grugops", "factory.config.json"), SIX_ERROR_PAYLOAD);
    const lines = out(runSplit(kit, kit))
      .split("\n")
      .filter((l) => l.includes(".grugops/factory.config.json:"));
    expect(lines.length, lines.join("\n")).toBeGreaterThanOrEqual(6);
  });
});
