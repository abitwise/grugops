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
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
