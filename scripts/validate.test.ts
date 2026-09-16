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
import { execFileSync, spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { TICKET_KEYS } from "./board-model.js";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const VALIDATOR_JS = join(ROOT, "scripts", "validate-agent-factory.js");
const FIX = join(ROOT, "scripts", "fixtures");

// ── What counts as a validator fixture REPOSITORY ────────────────────────────────────────────────
//
// `scripts/fixtures/` used to hold nothing but validator fixture repositories, so "every directory
// under it" and "every fixture repository" were the same set and the two discoveries below read
// `readdirSync` directly. Plan 32-04 added `board-replay/`, which carries two trimmed markdown
// boards and no `agent-factory/` tree at all — it is a replay corpus for the board grammar, not a
// repository the validator can be pointed at. Running the validator on it, or looking for a
// `factory.config.json` inside it, asks a question it has no answer to.
//
// So the set is derived by the PROPERTY that makes a member a member — it carries the config file
// every fixture repository carries — and BOTH halves of the split are pinned. A new fixture
// repository still fails the two-sided intent check below; a new non-repository directory has to be
// named here with its reason, so neither can be added silently.
const fixtureEntries = readdirSync(FIX, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const fixtureConfigOf = (name: string): string =>
  join(FIX, name, "agent-factory/config/factory.config.json");

const fixtureAgentsOf = (name: string): string => join(FIX, name, "AGENTS.md");

/**
 * Directories under `scripts/fixtures/` carrying a factory config, whatever else they are.
 *
 * This is the CONFIG-SURFACE set, and it is deliberately wider than the repository set below: the
 * retired-key sweep at the foot of this file asks "does any committed config carry `autonomy`",
 * which is a question about every config on disk rather than about the ones the validator can be
 * pointed at. Narrowing that sweep to the repository set would have quietly stopped scanning a
 * config the moment a non-repository fixture grew one.
 */
const FIXTURE_CONFIG_DIRS = fixtureEntries.filter((name) => existsSync(fixtureConfigOf(name)));

/**
 * Directories under `scripts/fixtures/` that ARE validator fixture repositories.
 *
 * THE PROPERTY WIDENED IN PLAN 32-05, AND THE REASON IS ON DISK. Until then the discriminator was
 * "carries `agent-factory/config/factory.config.json`", because every fixture repository carried
 * one and nothing else did. `board-snapshot` broke that: it is a board-projector fixture whose
 * config is read by `scripts/board-read.ts` for its `wip_limits` and `id_prefix`, and pointing the
 * validator at it asks a question it has no answer to — it has no `AGENTS.md`, no role corpus and
 * no packaging, and its ticket files deliberately disagree with its board. So the property is now
 * BOTH marks a validator run needs: the config it reads and the `AGENTS.md` it requires.
 */
const FIXTURE_REPOS = FIXTURE_CONFIG_DIRS.filter((name) => existsSync(fixtureAgentsOf(name)));

/** Directories under `scripts/fixtures/` that are NOT, each named with the reason it is not. */
const NON_REPO_FIXTURE_DIRS: ReadonlyArray<readonly [string, string]> = [
  [
    "board-replay",
    "plan 32-04's trimmed transcriptions of the two real agent-written boards, replayed by " +
      "scripts/board-corpus.test.ts. Two markdown files and no agent-factory/ tree.",
  ],
  [
    "board-snapshot",
    "plan 32-05's miniature repository, read by scripts/board-read.ts and frozen by the committed " +
      "golden expected-snapshot.json. It carries a factory config because the projector reads one, " +
      "and no AGENTS.md, no roles and no packaging, so the validator has nothing to check in it.",
  ],
];

describe("scripts/fixtures/ splits into validator repositories and everything else", () => {
  it("accounts for every directory on disk, in both halves, with no overlap", () => {
    expect(
      [...FIXTURE_REPOS, ...NON_REPO_FIXTURE_DIRS.map(([n]) => n)].sort(),
      "a directory in neither half is a directory nobody classified; a directory in both is a " +
        "classification that contradicts itself",
    ).toEqual(fixtureEntries);
    expect(
      FIXTURE_REPOS.filter((n) => NON_REPO_FIXTURE_DIRS.some(([m]) => m === n)),
      "no directory may sit in both halves",
    ).toEqual([]);
  });

  it("pins each half's size, so a silent entrant moves a number rather than nothing", () => {
    // 8 until plan 32-12, which adds the three ticket-grammar DISAGREEMENT repositories
    // (bad-ticket-body-column, bad-ticket-no-region, bad-ticket-duplicate-key) — one per point
    // where the validator's deleted local reader and `parseTicketDocument` answered differently.
    expect(FIXTURE_REPOS.length, "validator fixture repositories").toBe(11);
    expect(NON_REPO_FIXTURE_DIRS.length, "directories that are deliberately not repositories").toBe(2);
    expect(
      FIXTURE_CONFIG_DIRS.length,
      "directories carrying a factory config — one more than the repository set, because " +
        "board-snapshot carries a config the board projector reads and no AGENTS.md",
    ).toBe(12);
  });

  it("gives every declared non-repository a REASON, not merely a name", () => {
    for (const [name, reason] of NON_REPO_FIXTURE_DIRS) {
      expect(existsSync(join(FIX, name)), `${name} is declared but not on disk`).toBe(true);
      // A non-repository must genuinely LACK one of the two marks a validator run needs. Asserting
      // the derived membership alone would let this loop agree with itself; asserting the marks
      // makes the exemption checkable against the disk.
      expect(
        existsSync(fixtureConfigOf(name)) && existsSync(fixtureAgentsOf(name)),
        `${name} carries BOTH a fixture config and an AGENTS.md, so it belongs in the repository half`,
      ).toBe(false);
      expect(reason.length, `${name} is exempted with no reason recorded`).toBeGreaterThan(40);
    }
  });
});

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
  // exempting the fixture from the check — keeps the assertion honest for all eleven.
  const INTENT: ReadonlyArray<readonly [string, RegExp, number, number]> = [
    // [fixture, its intended finding, expected config findings, expected bare exit status]
    ["bad-role-missing-section", /Hard limits/i, 0, 1],
    ["bad-config-no-mode", /missing or empty required key "mode"/, 1, 1],
    ["bad-plugin-noname", /name/i, 0, 1],
    ["bad-ticket-mismatch", /status/i, 0, 1],
    ["bad-ticket-bad-column", /not a board column/i, 0, 1],
    ["bad-workflow-no-commit", /Commit/i, 0, 1],
    // The three plan 32-12 disagreement repositories, at their POST-CUTOVER answers. Each row
    // MOVED when `checkTickets()` stopped reading tickets with its own regex pair and started
    // asking `parseTicketDocument`, and the move is the deliverable rather than a fixed-up
    // expectation — 32-12-RED-baseline.txt records the value each row held before it moved.
    // Note that one of the three moved TOWARD exit 0: body text stopped deciding a verdict.
    ["bad-ticket-body-column", /ALL CHECKS PASSED/i, 0, 0],
    ["bad-ticket-no-region", /refused by the ticket grammar \(no-opening-delimiter\)/, 0, 1],
    ["bad-ticket-duplicate-key", /refused by the ticket grammar \(duplicate-key\)/, 0, 1],
    // `good` has no defect: its intent is that NOTHING is found, so its row asserts the absence of
    // any finding rather than the presence of one. `warn-only-no-trace` exits 0 bare but must still
    // EMIT its warning — asserting only its exit status would pass over a run that found nothing.
    ["good", /ALL CHECKS PASSED/i, 0, 0],
    ["warn-only-no-trace", /WARN/, 0, 0],
  ];

  it("the intent table names EVERY fixture repository on disk, and no other", () => {
    // Two-sided, so neither a fixture added without a row nor a row naming a deleted fixture can
    // hide. The disk side is discovered; the table side is written. Equality is the assertion.
    expect(INTENT.map(([f]) => f).sort()).toEqual(FIXTURE_REPOS);
    expect(FIXTURE_REPOS.length).toBe(11);
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
  // fixture repository found by reading the fixture directory. The count is asserted so a
  // thirteenth fixture added later cannot slip through un-scanned.
  const fixtureDirs = FIXTURE_CONFIG_DIRS;

  const surfaces = [
    join(ROOT, "agent-factory/config/factory.config.json"),
    join(ROOT, "agent-factory/seed/.grugops/factory.config.json"),
    ...fixtureDirs.map((d) => fixtureConfigOf(d)),
  ];

  it("the discovered surface set is the twelve fixture configs plus the two shipped twins", () => {
    expect(fixtureDirs.length).toBe(12);
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
        const e: NodeJS.ProcessEnv = { ...process.env, VALIDATE_KIT_ROOT: ROOT };
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

describe("30-10 R4 — R6-1 and R6-2: one supplied-root expression, one base identity", () => {
  it("R6-1 — an EMPTY VALIDATE_ROOT takes the same branch the caveat reports", () => {
    // Two tests over one variable: STATE_ROOT branched on TRUTHINESS while the caveat tested
    // `!== undefined`. `VALIDATE_ROOT=""` — the ordinary shape of a CI wrapper exporting an unset
    // variable — took the fallback branch (state root = the kit, bases collapsed, the repository's
    // governing config form-checked at no base) while the caveat was suppressed. Both read one value.
    for (const value of ["", "   "]) {
      const r = spawnSync("node", [VALIDATOR_JS], {
        encoding: "utf8",
        env: { ...process.env, VALIDATE_KIT_ROOT: ROOT, VALIDATE_ROOT: value },
      });
      expect(r.status, JSON.stringify(value)).toBe(0);
      expect(out(r), `VALIDATE_ROOT=${JSON.stringify(value)} suppressed the caveat`).toMatch(
        /VALIDATE_ROOT was not supplied/,
      );
    }
  });

  it("R6-1 — a REAL state root still suppresses the caveat, and an unset one still raises it", () => {
    const { kit, state } = twoRoots();
    expect(out(runSplit(kit, state))).not.toMatch(/VALIDATE_ROOT was not supplied/);
    const r = spawnSync("node", [VALIDATOR_JS], {
      encoding: "utf8",
      env: (() => {
        const e: NodeJS.ProcessEnv = { ...process.env, VALIDATE_KIT_ROOT: ROOT };
        delete e.VALIDATE_ROOT;
        return e;
      })(),
    });
    expect(out(r)).toMatch(/VALIDATE_ROOT was not supplied/);
  });

  it("R6-2 — a SYMLINK-spelled kit root does not make one tree look like two", () => {
    // `resolve()` normalises `.` and `..` and does not follow symlinks, so the operator's spelling of
    // the kit compared unequal to a realpath-resolved `import.meta.dirname`: the caveat vanished from
    // the exact invocation it was written for and the SCOPE line double-listed the in-kit config.
    // The kit runs its OWN validator, which is the shipped shared-install shape and the shape
    // reviewer 6 measured: `SCRIPT_DIR/..` is then the kit itself, so the two bases are one tree and
    // only the SPELLING of the path differs between the two runs.
    const real = realpathSync(mkdtempSync(join(tmpdir(), "grugops-val-real-")));
    tmpDirs.push(real);
    execFileSync("bash", ["-c", `git archive HEAD | tar -x -C ${JSON.stringify(real)}`], { cwd: ROOT });
    // …and overwrite the compiled scripts with the WORKING TREE's, so the fixture drives the
    // artifact under test rather than the one at HEAD. Without this the case silently measures the
    // pre-fix build and passes or fails for the wrong reason — the mutation-that-never-landed class.
    cpSync(join(ROOT, "scripts"), join(real, "scripts"), { recursive: true });
    const linkDir = realpathSync(mkdtempSync(join(tmpdir(), "grugops-val-link-")));
    tmpDirs.push(linkDir);
    const link = join(linkDir, "kitlink");
    symlinkSync(real, link);

    const spawnKit = (kitPath: string): SpawnSyncReturns<string> =>
      spawnSync("node", [join(kitPath, "scripts", "validate-agent-factory.js")], {
        encoding: "utf8",
        env: (() => { const e: NodeJS.ProcessEnv = { ...process.env, VALIDATE_KIT_ROOT: kitPath }; delete e.VALIDATE_ROOT; return e; })(),
      });
    const viaReal = spawnKit(real);
    const viaLink = spawnKit(link);
    // The only variable is the spelling of the kit path, so the SCOPE line must not differ in kind.
    const scope = (o: string): string => (o.split("\n").find((l) => l.includes("SCOPE")) ?? "").trim();
    expect(scope(out(viaLink))).not.toMatch(
      /factory\.config\.json,\s*.*factory\.config\.json/,
    );
    expect(scope(out(viaReal)).includes("VALIDATE_ROOT was not supplied")).toBe(
      scope(out(viaLink)).includes("VALIDATE_ROOT was not supplied"),
    );
  });

  it("reviewer 6 obs. 1 — the SCOPE line says precedence is REPLACE when it lists more than one", () => {
    // `readGovernanceConfig` takes the FIRST candidate ENTIRELY, so a repository-level file that
    // mentions no checkpoints voids a kit-level tightening with no refusal anywhere. Listing two
    // files as "examined" told a reader two files were consulted where one governs.
    const { kit, state } = twoRoots();
    mkdirSync(join(state, ".grugops"), { recursive: true });
    writeFileSync(join(state, ".grugops", "factory.config.json"), JSON.stringify({ cadence: "kanban" }));
    const o = out(runSplit(kit, state));
    expect(o).toMatch(/the FIRST is the one that governs/);
    expect(o).toMatch(/replace, not merge/);
  });
});

// ── Plan 32-08 (DASH-01 / D-06): the validator reads the ONE board grammar ───────────────────────
//
// `checkTickets()` used to carry its own two-line column parser. That made `scripts/board-model.ts`
// the authority for the projector and `validate-agent-factory.ts` the authority for the validator —
// two spellings of one grammar, free to disagree, and a disagreement between two parsers is
// invisible until it has already misreported the board. The helper is deleted and the validator
// imports `boardHasColumn` / `parseBoard` / `kebab` from `./board-model.js`.
//
// The extraction is not a byte-for-byte port. D-06 says "semantics preserved, defects fixed,
// deviations NAMED", and the two named deviations are the two RED cases below. Each one changes
// what the validator reports, so each is asserted end to end against the spawned validator rather
// than against the module in isolation — the module already has its own pins in
// scripts/board-tracer.test.ts, and a pin there would not have noticed the validator still holding
// its own copy.
describe("validate-agent-factory.js — one board grammar (plan 32-08, DASH-01 / D-06)", () => {
  /** A hermetic kit whose board and single ticket are exactly the shapes a case names. */
  function kitWithBoardAndTicket(board: string, ticket: string): string {
    const d = copyGoodKit(true);
    writeFileSync(join(d, "plans", "board.md"), board);
    writeFileSync(join(d, "plans", "tickets", "TST-001.md"), ticket);
    return d;
  }

  // DEVIATION 1 — the suffix strip widens from the single `(WIP …)` form to D-05's three forms.
  //
  // Before: `boardColumnName` stripped `\s*\(WIP[^)]*\)\s*$`, which does not match
  // `(visible, time-tracked)`, so the column name stayed `Blocked (visible, time-tracked)` and a
  // ticket in the Blocked column was reported as being in no board column at all. The kit's OWN
  // board carries that heading, so the defect was live on every repository the kit installs.
  it("DEVIATION 1: `## Blocked (visible, time-tracked)` names the column `Blocked`", () => {
    const kit = kitWithBoardAndTicket(
      "# Board (fixture)\n\n## Ready (WIP 0/8)\n\n## Blocked (visible, time-tracked)\n",
      "---\ncolumn: Blocked\nstatus: blocked\n---\n# TST-001\n",
    );
    const r = runFixture(kit);
    expect(
      out(r),
      "the Blocked heading must normalize to `Blocked`, so a ticket in it is IN a board column",
    ).not.toMatch(/not a board column/i);
    expect(r.status, "a traceability WARNING is the only finding, so the bare exit is 0").toBe(0);
  });

  // DEVIATION 2 — a `##` heading whose suffix is none of the three forms opens NO column.
  //
  // Before: the strip removed nothing from `## Columns (spec §6.1)` and the trim left the whole
  // string, so the validator believed in a phantom column literally named `Columns (spec §6.1)`.
  // A ticket could claim it and pass membership. The kit's own board carries that heading too.
  it("DEVIATION 2: `## Columns (spec §6.1)` opens no column, so a ticket claiming it is refused", () => {
    const kit = kitWithBoardAndTicket(
      "# Board (fixture)\n\n## Ready (WIP 0/8)\n\n## Columns (spec §6.1)\n",
      "---\ncolumn: Columns (spec §6.1)\nstatus: columns-spec-6-1\n---\n# TST-001\n",
    );
    const r = runFixture(kit);
    expect(out(r), "a non-canonical suffix must not create a phantom column").toMatch(
      /column "Columns \(spec §6\.1\)" is not a board column/,
    );
    expect(r.status).not.toBe(0);
  });

  // The WR-03 counterexample, pinned through the IMPORT PATH rather than through the deleted
  // helper. This case was already green before the extraction — it is a regression pin, not a
  // discrimination, and 32-08-GREEN-proof.txt records it as such.
  it("WR-03 stays pinned: column `In` does not match `## In Development (WIP 0/3)`", () => {
    const kit = kitWithBoardAndTicket(
      "# Board (fixture)\n\n## In Development (WIP 0/3)\n",
      "---\ncolumn: In\nstatus: in\n---\n# TST-001\n",
    );
    const r = runFixture(kit);
    expect(out(r), "a bare prefix match would have accepted `In`").toMatch(
      /column "In" is not a board column/,
    );
    expect(r.status).not.toBe(0);
  });

  // The source-shape half. A behavioural case proves the validator AGREES with board-model today;
  // it cannot prove the validator has no second copy that merely happens to agree. These two
  // negative greps do, and they are run over the COMMENT-STRIPPED source so the explanatory prose
  // above the import (which necessarily quotes the deleted spelling) cannot satisfy them.
  describe("no second spelling of the grammar survives in the validator source", () => {
    const VALIDATOR_TS = join(ROOT, "scripts", "validate-agent-factory.ts");
    const codeOf = (p: string): string =>
      readFileSync(p, "utf8")
        .split("\n")
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .join("\n");

    it("declares no local `boardColumnName` — the helper is imported, not restated", () => {
      expect(codeOf(VALIDATOR_TS)).not.toMatch(/const boardColumnName\s*=/);
    });

    it("carries no bare prefix-match membership spelling", () => {
      // `startsWith("## " + col + " ")` is the pre-WR-03 defect. Asserting the STEM rather than the
      // full expression refuses the whole family, including a re-spelling with different spacing.
      expect(codeOf(VALIDATOR_TS)).not.toContain('startsWith("## "');
    });

    it("imports the grammar from ./board-model.js", () => {
      const code = codeOf(VALIDATOR_TS);
      expect(code).toMatch(/import\s*{[^}]*\bboardHasColumn\b[^}]*}\s*from\s*"\.\/board-model\.js"/s);
      expect(code).toMatch(/import\s*{[^}]*\bparseBoard\b[^}]*}\s*from\s*"\.\/board-model\.js"/s);
      expect(code).toMatch(/import\s*{[^}]*\bkebab\b[^}]*}\s*from\s*"\.\/board-model\.js"/s);
    });

    it("`kebab` has exactly ONE declaration across the validator and board-model", () => {
      // The rule `kebab(column) === status` is what joins a board column to a ticket status. Two
      // spellings of it is the set-literal drift class this milestone exists to close.
      const decls = [VALIDATOR_TS, join(ROOT, "scripts", "board-model.ts")]
        .map((p) => (codeOf(p).match(/const kebab\s*=/g) ?? []).length)
        .reduce((a, b) => a + b, 0);
      expect(decls, "one grammar, one spelling of its kebab rule").toBe(1);
    });
  });

  // The two board↔ticket message strings are a published surface: two cases in this file assert
  // their text, and a reworded message is a behaviour change nobody asked for. Pinning them here
  // makes the requirement explicit rather than incidental to the fixture cases.
  it("keeps both board↔ticket messages byte-identical through the extraction", () => {
    const bad = runFixture(join(FIX, "bad-ticket-bad-column"));
    expect(out(bad)).toContain(
      'plans/tickets/ABC-001.md: column "Nonexistent Column" is not a board column',
    );
    const mismatch = runFixture(join(FIX, "bad-ticket-mismatch"));
    expect(out(mismatch)).toContain(
      'plans/tickets/ABC-001.md: status "in-review" does not match column "In Development" (expected kebab "in-development")',
    );
  });
});

// ── The three points where the two ticket-frontmatter readers disagreed (plan 32-12, CR-06) ──────
//
// Phase 32's verification found that plan 32-08's cutover was only half done: `board-model.ts`'s
// docblock said the validator's own `column:`/`status:` regex pair had been deleted in favour of
// `parseTicketDocument`, and the pair was still there, used by `checkTickets()`. Two readers of one
// ticket key is the drift class DASH-01 exists to close — `npm run` validation and the dashboard
// could report different columns for the same ticket.
//
// The two readers disagreed by CONSTRUCTION on exactly three inputs, and each of the three is a
// fixture repository carrying one ticket that isolates it. These cases pin the validator's verdict
// on each; `.planning/phases/32-board-projector-cli-dashboard/32-12-RED-baseline.txt` records both
// readers' answers on the same three documents, measured before anything was deleted.
describe("validate-agent-factory.js — the ticket grammar's three disagreement points (plan 32-12)", () => {
  // DISAGREEMENT 1 — a `column:` line in the PROSE BODY, and a second inside a fenced block.
  //
  // The region is well formed and carries no `column:` key at all. The deleted reader's
  // `/^column:\s*(.+)$/m` had no region bound, so it walked past the closing `---` and answered
  // with the first key line it met anywhere in the file — a value the ticket's author wrote as
  // prose. `parseTicketDocument` reads only between the first two delimiters, so it answers
  // `column: null` and the membership rule has nothing to run against.
  //
  // AUTHORITATIVE ANSWER: the frontmatter region. A ticket's column is what its region says, and
  // this region says nothing, so the validator has nothing to report. Before the cutover this
  // fixture exited 1 on `Phantom Column` — a value read out of the ticket's prose.
  it("BODY MATCH: prose and fenced `column:` lines no longer decide the verdict", () => {
    const r = runFixture(join(FIX, "bad-ticket-body-column"));
    expect(
      out(r),
      "`Phantom Column` appears only in the ticket's prose body and in a fenced example, and the " +
        "grammar reads neither",
    ).not.toMatch(/Phantom Column/);
    expect(r.status, "the region names no column, so no rule runs and nothing is found").toBe(0);
  });

  // DISAGREEMENT 2 — no frontmatter region at all.
  //
  // The document is plain markdown with two key lines in its prose. The deleted reader accepted it
  // and found both values legitimate, so the validator passed a document that has no frontmatter.
  //
  // AUTHORITATIVE ANSWER: refusal by name. A value read out of a document the grammar refused is a
  // guess, so neither the membership rule nor the kebab rule is evaluated against one (D-07:
  // refuse outside the form, never widen the parser). Before the cutover this fixture exited 0.
  it("NO REGION: a document with no frontmatter is refused by code, not read anyway", () => {
    const r = runFixture(join(FIX, "bad-ticket-no-region"));
    expect(out(r), "the refusal names its CODE and its reason, so the finding is actionable").toMatch(
      /plans\/tickets\/ABC-001\.md: refused by the ticket grammar \(no-opening-delimiter\): /,
    );
    expect(r.status).not.toBe(0);
    expect(
      out(r),
      "the column and status rules must not run against a guess read out of a refused document",
    ).not.toMatch(/is not a board column|does not match column/);
  });

  // DISAGREEMENT 3 — the `column:` key written twice, with different values.
  //
  // The deleted reader's `.match()` returned the FIRST match and discarded the rest, so the
  // document was read as though its second column line did not exist.
  //
  // AUTHORITATIVE ANSWER: refusal by name. A document expressing two values for one key does not
  // have a column; picking one of the two is the validator deciding what the author meant. Before
  // the cutover this fixture exited 0 on `In Development`, silently.
  it("DUPLICATE KEY: two values for one key are refused, not silently halved", () => {
    const r = runFixture(join(FIX, "bad-ticket-duplicate-key"));
    expect(out(r)).toMatch(
      /plans\/tickets\/ABC-001\.md: refused by the ticket grammar \(duplicate-key\): /,
    );
    expect(r.status).not.toBe(0);
  });

  // The refusal message is a NEW published surface this plan introduces, so it is pinned the same
  // way the two board↔ticket messages are: by its bytes, not by a regex that would survive a
  // reword. It names the path, the refusal CODE and the grammar's own sentence.
  it("pins the refusal message's shape: path, code, and the grammar's own reason", () => {
    const r = runFixture(join(FIX, "bad-ticket-duplicate-key"));
    expect(out(r)).toContain(
      "plans/tickets/ABC-001.md: refused by the ticket grammar (duplicate-key): " +
        "`column` is written twice, so the document expresses two values for one key",
    );
  });
});

// ── ONE TICKET-FRONTMATTER READER IN THE TREE, DERIVED (plan 32-12, DASH-01 / D-06) ──────────────
//
// The behavioural cases above prove the validator AGREES with the grammar today. They cannot prove
// no THIRD reader exists somewhere else in `scripts/`, and a hand-typed list of files to check is
// the set-literal drift class this repository has already paid for: a list rots while it stays
// green. So the scanned set is the DIRECTORY LISTING at test time, and the count of carriers is
// derived from it.
//
// WHAT COUNTS AS A TICKET-FRONTMATTER READER — THE CAPABILITY, NOT THE SPELLING (plan 32-21, WR-01).
//
// The first version of this census asked two SYNTACTIC questions: does the file carry a regular
// expression LITERAL anchored at one of the keys, and does it declare a function whose parameter
// carries a literal `string` type annotation. Round 1 measured three ordinary rewrites of the very
// reader this block exists to catch — the patterns hoisted to module scope as `new RegExp(...)`, the
// parameter typed `string | undefined`, a `split`/`indexOf` scan with the key names concatenated —
// and every one of them reported ZERO carriers while the count below still asserted one authority.
// The derivation caught a BYTE SEQUENCE, not a capability.
//
// Round 2 widened the PRIMITIVE half into a named five-member table and left the KEY half a
// syntactic-POSITION rule — the key had to be preceded by a start-of-string, a `^` or a newline.
// Round 3 measured four more ordinary rewrites (`32-36-RED-baseline.txt`) and every one reported
// ZERO carriers again: an alternation group puts `(` and `|` in front of the key, and `.matchAll`
// and `.replace` were in no table. A position is not the property being claimed, and an
// enumeration's complement is whatever nobody thought of. Both halves now ask about the property.
//
// So the subject of the question is the capability, and it is a PAIR:
//
//   • the file NAMES BOTH ticket key spellings — as a WORD anywhere in a resolved static text: a
//     string literal, a no-substitution template literal, a regular-expression literal,
//     `+`-concatenated pieces, or an array of resolvable pieces passed through `.join(...)`. The
//     subject is PRESENCE, not position: `"column"`, `/^column:/`, `/^(column|status):/` and
//     `["c","o","l","u","m","n"].join("")` all name the key, because each of them contains it; AND
//   • the file REACHES A TEXT-SCANNING PRIMITIVE, decided by a REFUSED COMPLEMENT rather than by
//     an enumeration: any member call whose member name belongs to `String.prototype` or
//     `RegExp.prototype` — the set derived from the LANGUAGE at test time, so a text-scanning call
//     this pass has never met is admitted automatically — minus the members named in
//     `NOT_A_TEXT_PRIMITIVE`. `TEXT_SCAN_PRIMITIVES` survives as the written record of the
//     spellings this repository actually uses, and a case asserts the complement admits every one
//     of them, so the record and the decider cannot disagree.
//
// WHAT BOUNDS THIS CENSUS'S INPUT — stated here because the absence of this paragraph IS the
// finding. Every boundary below has a case of its own at the foot of this block.
//
//   FILE SET      every `*.ts` under `scripts/` AT TEST TIME, RECURSIVELY. Never a literal array
//                 and never depth-one. Floored against `git ls-files`, so a tracked file the glob
//                 never opened is a red rather than a silently narrower scan.
//   NODE KINDS    `StringLiteral`, `NoSubstitutionTemplateLiteral`, `RegularExpressionLiteral`,
//                 `BinaryExpression` over `+` whose operands resolve, and an `ArrayLiteral.join()`
//                 whose elements and separator resolve — for the key spelling; a property-access
//                 CALL for the member primitives and a `new` expression for the constructor. It
//                 runs over the AST, so a comment quoting a deleted pattern (this file carries
//                 several) names nothing.
//   UNRESOLVABLE  a key spelling this pass cannot resolve STATICALLY — assembled from a variable,
//                 from `String.fromCharCode`, or through a template with substitutions — is NOT
//                 counted, and the file is NOT reported. That is a real blind spot, not a claim of
//                 absence; it is measured by a case below rather than left to be discovered.
//   SCOPE         the pair is FILE-scoped, not function-scoped. A file that names the keys in one
//                 place and scans text in another is a carrier even if the two never meet. The
//                 imprecision runs in the direction of OVER-detection, which is the only direction
//                 a census like this may be imprecise in, and it is paid for by the named
//                 exemptions below rather than by narrowing the question again. Asking about
//                 PRESENCE rather than position widened that over-detection considerably: the two
//                 keys are also ordinary English words, so a test description or an error message
//                 that happens to say "column" names the key. Five files became detected when
//                 round 3 landed and each one is an entry in `NOT_A_SECOND_AUTHORITY` with its own
//                 reason. That is the price, it is paid in decisions somebody wrote down, and it
//                 is the right way round: over-detection costs an entry, under-detection cost this
//                 repository two whole rounds.
//   ORDER         the carrier list is derived from a file set sorted by name, so two runs over one
//                 tree print the same list and a reader comparing runs compares SETS rather than
//                 whatever order the directory walk happened to return.
describe("exactly ONE ticket-frontmatter reader exists in scripts/ (32-12, widened 32-21, 32-36)", () => {
  const SCRIPTS_DIR = join(ROOT, "scripts");

  /** The two ticket keys the validator's two ticket rules consume. */
  const TICKET_TEXT_KEYS = ["column", "status"] as const;
  const KEY_SPELLINGS: readonly string[] = TICKET_TEXT_KEYS;

  // Derived, not assumed: both spellings must be members of the grammar's own closed key set. If
  // `TICKET_KEYS` were ever renamed or narrowed, this census would be scanning for keys the
  // grammar no longer has, and that is a red here rather than a silently narrower scan.
  it("both scanned key spellings are members of the grammar's closed ticket key set", () => {
    for (const k of KEY_SPELLINGS) {
      expect(
        (TICKET_KEYS as readonly string[]).includes(k),
        `\`${k}\` is not in TICKET_KEYS, so this census is scanning for a key the grammar dropped`,
      ).toBe(true);
    }
  });

  /**
   * THE TEXT-SCANNING SPELLINGS THIS REPOSITORY ACTUALLY USES — a RECORD, no longer the decider.
   *
   * Round 2 made this table the primitive half's whole subject, and round 3 measured what that
   * costs: `.matchAll` and `.replace` are ordinary ways to scan text, neither was in the table, and
   * a second reader using either measured at zero carriers. An enumeration decides about its
   * members and says nothing about its complement, and the complement is where the next author is.
   *
   * So the table stays as the written record of the five spellings in use here, and
   * `looksLikeTextScan` below does the deciding. The case
   * "every recorded spelling is admitted by the complement" is what stops the two from disagreeing:
   * the record cannot drift away from the decider without a red.
   */
  const TEXT_SCAN_PRIMITIVES = Object.freeze([
    { spelling: ".match", kind: "member", name: "match" },
    { spelling: ".exec", kind: "member", name: "exec" },
    { spelling: ".split", kind: "member", name: "split" },
    { spelling: ".indexOf", kind: "member", name: "indexOf" },
    { spelling: "new RegExp", kind: "constructor", name: "RegExp" },
  ] as const);

  /** Derived from the table above, never a second literal list. */
  const CONSTRUCTOR_PRIMITIVES: readonly string[] = TEXT_SCAN_PRIMITIVES.filter(
    (p) => p.kind === "constructor",
  ).map((p) => p.name);

  /**
   * THE COMPLEMENT, DERIVED FROM THE LANGUAGE RATHER THAN FROM AN AUTHOR.
   *
   * A member call is evidence that this pass believes the receiver is TEXT when the member being
   * called is one `String.prototype` or `RegExp.prototype` defines — you do not call `.matchAll` or
   * `.exec` on anything else and mean something by it. The set is read out of the running engine at
   * test time, so every string and pattern method that exists is in it, including the ones nobody
   * here has written yet. That is the whole point: a text-scanning call this pass has never met
   * makes a planted second reader visible, instead of passing because nobody listed it.
   *
   * The imprecision runs toward OVER-detection — `.slice`, `.includes`, `.indexOf` and `.concat`
   * are also array methods, so an array operation reads as a text one. That is the direction a
   * census like this may be imprecise in, and the cost is a named exemption below.
   */
  const TEXT_CAPABLE_MEMBERS: ReadonlySet<string> = new Set([
    ...Object.getOwnPropertyNames(String.prototype),
    ...Object.getOwnPropertyNames(RegExp.prototype),
  ]);

  /**
   * THE REFUSAL SET: members the two prototypes own that carry NO information about the receiver.
   *
   * Each of these is an own property of `String.prototype` only because every prototype re-declares
   * what `Object.prototype` already provides. A call to one of them is made on every kind of value
   * in the language, so admitting it would make "reaches a text-scanning primitive" true of any
   * file at all — which is a predicate that has stopped discriminating rather than one that has
   * been widened. A FOURTH entry is somebody judging that a string method is not evidence of
   * scanning text, and that judgment belongs here with its reason, never as a quiet narrowing.
   */
  const NOT_A_TEXT_PRIMITIVE: Readonly<Record<string, string>> = Object.freeze({
    constructor:
      "every prototype in the language owns a `constructor`, so `.constructor(…)` is a call made " +
      "on every kind of value and says nothing whatever about the receiver being text",
    toString:
      "every prototype in the language owns a `toString`, and `.toString()` is how any value at " +
      "all is rendered; admitting it would make the primitive half true of every file in the tree",
    valueOf:
      "every prototype in the language owns a `valueOf`, and it is called by coercion on numbers, " +
      "dates and plain objects far more often than on strings; it distinguishes nothing",
  });

  /** The cardinality of the refusal set — a decision, not a constant to bump. */
  const NOT_A_TEXT_PRIMITIVE_COUNT = 3;

  /** Does calling this member mean the pass believes the receiver is text? */
  const looksLikeTextScan = (member: string): boolean =>
    TEXT_CAPABLE_MEMBERS.has(member) && NOT_A_TEXT_PRIMITIVE[member] === undefined;

  /**
   * A regex-source SKELETON: the spellings that denote a single literal character reduced to that
   * character, so `^column[:]` and `^column\:` both read as `^column:`. Without it the anchored
   * test catches one author's habit and not the next one's — which is the whole of WR-01 E2.
   */
  const skeleton = (t: string): string =>
    t.replace(/\[(\\?.)\]/g, "$1").replace(/\\([^A-Za-z0-9])/g, "$1");

  /**
   * Does this resolved static text NAME the key?
   *
   * PRESENCE, NOT POSITION. The rule this replaced asked what came BEFORE the key — a start of
   * text, a `^`, or a newline — and that is a property of the author's habit rather than of the
   * text naming the key. Inside `/^(column|status):/` the key is preceded by `(` and by `|`, so
   * the old rule said the pattern named neither key while it matched both; round 3 measured three
   * separate second readers walking through on exactly that (`32-36-RED-baseline.txt` § 3).
   *
   * A word boundary either side is what keeps this from matching `columns` or `statuses` while
   * admitting every ordinary way of writing the key down. `skeleton` stays in front of it because
   * it is what makes `^column[:]` and `^column\:` read alike — that is a NORMALIZATION of two
   * spellings of one literal character, not a position rule.
   */
  const namesKey = (text: string, k: string): boolean =>
    new RegExp(String.raw`\b` + k + String.raw`\b`).test(skeleton(text));

  interface ReaderFinding {
    readonly kind: "key" | "primitive";
    readonly line: number;
    readonly detail: string;
  }

  /**
   * The static text a node denotes, or `null` when this pass cannot resolve it. `+` recurses, which
   * is what makes `"col" + "umn"` resolve to the spelling it assembles (WR-01 E3).
   *
   * `.join(…)` over an array literal recurses for the same reason one register over: `+` and
   * `[...].join("")` are the two ordinary ways to build a string out of pieces, and a census that
   * resolved one and not the other would be asking about a spelling again. `.planning/WINDOWS.md`
   * ledger row 184 named the join form as a stated blind spot; this arm closes the STATIC half of
   * it. The runtime half — a spelling that does not exist until the program runs — is still
   * outside a static pass and still has its own case below saying so.
   */
  const staticText = (n: ts.Node): string | null => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
    if (ts.isRegularExpressionLiteral(n)) return n.text;
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const l = staticText(n.left);
      const r = staticText(n.right);
      return l !== null && r !== null ? l + r : null;
    }
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      n.expression.name.text === "join" &&
      ts.isArrayLiteralExpression(n.expression.expression)
    ) {
      const parts = n.expression.expression.elements.map(staticText);
      if (parts.some((p) => p === null)) return null;
      if (n.arguments.length === 0) return parts.join(",");
      if (n.arguments.length !== 1) return null;
      const sep = staticText(n.arguments[0] as ts.Node);
      return sep === null ? null : parts.join(sep);
    }
    return null;
  };

  // Takes a PARSED SourceFile rather than document text, deliberately: a function that took the
  // text would itself be a text-scanning reader of both key spellings, and this census would name
  // its own analyzer. The analyzer consumes an AST, which is precisely why it is not a reader of
  // ticket documents — this file is still a carrier for other reasons, and says so by name below.
  function findTicketReaders(sf: ts.SourceFile): ReaderFinding[] {
    const lineOf = (n: ts.Node): number =>
      sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;

    const keyRows = new Map<string, ReaderFinding>();
    const primitiveRows = new Map<string, ReaderFinding>();

    const brief = (t: string): string =>
      (t.length > 60 ? `${t.slice(0, 60)}…` : t).replace(/\n/g, "\\n");

    const walk = (n: ts.Node): void => {
      const text = staticText(n);
      if (text !== null) {
        for (const k of KEY_SPELLINGS) {
          if (!keyRows.has(k) && namesKey(text, k)) {
            keyRows.set(k, { kind: "key", line: lineOf(n), detail: `${k} via "${brief(text)}"` });
          }
        }
      }
      if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        looksLikeTextScan(n.expression.name.text)
      ) {
        const name = n.expression.name.text;
        if (!primitiveRows.has(name)) {
          primitiveRows.set(name, {
            kind: "primitive",
            line: lineOf(n),
            detail: `.${name}(${brief(n.expression.expression.getText(sf))})`,
          });
        }
      }
      if (
        ts.isNewExpression(n) &&
        ts.isIdentifier(n.expression) &&
        CONSTRUCTOR_PRIMITIVES.includes(n.expression.text)
      ) {
        const name = n.expression.text;
        if (!primitiveRows.has(name)) {
          primitiveRows.set(name, { kind: "primitive", line: lineOf(n), detail: `new ${name}(…)` });
        }
      }
      ts.forEachChild(n, walk);
    };
    walk(sf);

    // THE PAIR. Either half alone is ordinary: half the repository splits a string, and a file may
    // mention a key without reading one. Only the conjunction is the capability.
    const namesBothKeys = KEY_SPELLINGS.every((k) => keyRows.has(k));
    if (!namesBothKeys || primitiveRows.size === 0) return [];
    return [...keyRows.values(), ...primitiveRows.values()].sort((a, b) => a.line - b.line);
  }

  /**
   * THE TWO HALVES, UNCONJOINED — the input the SCOPE refusal below needs (review WR-04).
   *
   * `findTicketReaders` answers about ONE parsed file, so a genuine second authority whose key
   * spellings live in `scripts/a.ts` and whose text scan lives in `scripts/b.ts`, joined by an
   * ordinary `import`, is never detected — while the census's whole claim is "exactly one authority
   * on what a ticket says". 32-36 pinned the over-detection direction and left the converse neither
   * pinned nor stated; the round's own self-review measured the split-file plant as a WORKING
   * authority at exit 0.
   */
  function readerHalves(sf: ts.SourceFile): {
    readonly namesBothKeys: boolean;
    readonly scans: boolean;
    readonly importsFrom: readonly { readonly specifier: string; readonly names: readonly string[] }[];
  } {
    const findings = new Set<string>();
    const scanNames = new Set<string>();
    const importsFrom: { specifier: string; names: string[] }[] = [];
    const walk = (n: ts.Node): void => {
      const text = staticText(n);
      if (text !== null) {
        for (const k of KEY_SPELLINGS) if (namesKey(text, k)) findings.add(k);
      }
      if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        looksLikeTextScan(n.expression.name.text)
      ) {
        scanNames.add(n.expression.name.text);
      }
      if (
        ts.isNewExpression(n) &&
        ts.isIdentifier(n.expression) &&
        CONSTRUCTOR_PRIMITIVES.includes(n.expression.text)
      ) {
        scanNames.add(n.expression.text);
      }
      if (
        (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) &&
        n.moduleSpecifier !== undefined &&
        ts.isStringLiteral(n.moduleSpecifier)
      ) {
        // THE BINDINGS, NOT ONLY THE MODULE. Importing FROM the one authority is the CORRECT shape
        // — `validate-agent-factory.ts` deleted its private column parser to do exactly that — so
        // the module name alone cannot be the question. What matters is whether the imported
        // BINDING is itself a key-spelling table.
        const names: string[] = [];
        const clause = ts.isImportDeclaration(n) ? n.importClause : n.exportClause;
        const bindings =
          clause !== undefined && ts.isImportClause(clause) ? clause.namedBindings : clause;
        if (bindings !== undefined && bindings !== null && ts.isNamedImports(bindings)) {
          for (const el of bindings.elements) names.push(el.propertyName?.text ?? el.name.text);
        }
        importsFrom.push({ specifier: n.moduleSpecifier.text, names });
      }
      ts.forEachChild(n, walk);
    };
    walk(sf);
    return {
      namesBothKeys: KEY_SPELLINGS.every((k) => findings.has(k)),
      scans: scanNames.size > 0,
      importsFrom,
    };
  }

  const parse = (name: string, text: string): ts.SourceFile =>
    ts.createSourceFile(name, text, ts.ScriptTarget.ES2022, true);

  /**
   * The scanned set: every `.ts` file under the directory AT TEST TIME, RECURSIVELY. Never a
   * literal array, and never depth-one — `scripts/` carries subdirectories, and a second reader
   * placed in one of them would sit outside a depth-one glob without anything going red.
   */
  const SCANNED = readdirSync(SCRIPTS_DIR, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => join(e.parentPath, e.name).slice(SCRIPTS_DIR.length + 1))
    .sort();

  /** One scanned file: a name and the text to parse. Planted rows use the same shape. */
  interface ScannedFile {
    readonly name: string;
    readonly text: string;
  }

  const LIVE_ROWS: readonly ScannedFile[] = SCANNED.map((name) => ({
    name,
    text: readFileSync(join(SCRIPTS_DIR, name), "utf8"),
  }));

  /**
   * THE FILES THE WIDENED QUESTION NAMES THAT ARE NOT SECOND AUTHORITIES — each with the one-line
   * reason that makes it a DECISION rather than a hole, in the register `STEM_FALSE_POSITIVES` in
   * `scripts/board-readonly.test.ts` already uses.
   *
   * Widening the subject from a syntax shape to a capability necessarily names files that plant a
   * ticket document as fixture text and also scan text somewhere — and that is the right trade:
   * over-detection costs a named entry here, under-detection cost this repository a whole round.
   * A FOURTH entry is somebody judging that a file naming both ticket keys beside a text scan is
   * not an authority, and that judgment belongs here with its reason, never in a bumped constant.
   */
  const NOT_A_SECOND_AUTHORITY: Readonly<Record<string, string>> = Object.freeze({
    "board-model.test.ts":
      "the grammar's own behavioural suite: it plants ticket documents as fixture TEXT and asserts " +
      "what the one authority returns from them; it parses no key itself",
    "board-read.test.ts":
      "the read seam's suite: it plants ticket documents as fixture TEXT and asserts what " +
      "readSnapshot reports about them; the parsing it asserts over is the grammar's",
    "validate.test.ts":
      "this census: it names both key spellings in order to SCAN for them and reaches the " +
      "primitives in order to build its own patterns and its own planted rows",
    // ── The five the PRESENCE rule added in round 3 (32-36). Each one names a key because the two
    //    ticket keys are also ordinary English words, and each one was read before it was exempted.
    "audit-model.test.ts":
      "the audit register's suite: `/column/i` is a pattern over an AUDIT-REGISTER table column and " +
      "`status` appears in a test description about CLAIM_STATUSES; neither has anything to do " +
      "with a ticket document, and this file reads no ticket text at all",
    "board-dashboard.test.ts":
      "the dashboard renderer's suite: `column` names a rendered WIP-COUNT column in a test " +
      "description and `status` is a dial key it asserts over; the ticket fields it works with " +
      "arrive already parsed, as TicketRecord values the one grammar produced",
    "check-banned-claims.test.ts":
      "the banned-claims gate's suite: `- status: true` is a planted FRONTMATTER fixture for that " +
      "gate's own subject and `column` appears in a message about a file:line:column citation; " +
      "the gate reads claims out of markdown prose and parses no ticket frontmatter",
    "check-diff-disposition.ts":
      "the diff-disposition gate: `status` is one of the keys of ITS OWN disposition register and " +
      "`column` names a `safety_surface` table column in an operator message. It reads the audit " +
      "register and the git diff, never a ticket document — the only production-code entry here, " +
      "and the standing risk that carries is written into this plan's SUMMARY rather than left " +
      "for a later reader to notice",
    "compactor.test.ts":
      "the thread compactor's suite: `column-0` and `status` both appear inside test DESCRIPTIONS " +
      "about verified_by findings and writer order; the compactor's subject is a thread note and " +
      "it never reads a ticket's frontmatter",
    // ── The one plan 32-38 added, READ BEFORE IT WAS EXEMPTED. The file already named `column` (in
    //    a WIP-count test DESCRIPTION, line 114) and already scanned text; plan 32-38's
    //    duplicate-identifier fixture supplied the `status` spelling that tipped the conjunction.
    "board-tracer.test.ts":
      "the phase tracer's suite: it PLANTS ticket documents as fixture TEXT and asserts what the " +
      "spawned CLI publishes about them, exactly as board-model.test.ts and board-read.test.ts do; " +
      "`column` is also an ordinary English word in its WIP-count test descriptions. It parses no " +
      "ticket key itself — every ticket field it reasons about arrives already parsed, inside the " +
      "--json document the one grammar produced",
  });

  /** The cardinality of the exemption set — a decision, not a constant to bump. */
  const NOT_A_SECOND_AUTHORITY_COUNT = 9;

  /**
   * THE CENSUS AS A FUNCTION OF ITS INPUT, so the boundary and degenerate cases below are asked the
   * SAME question the live tree is asked rather than a re-implementation of it.
   *
   * The rows are sorted by name before anything else happens. That is what makes the carrier list
   * ORDER-STABLE: without it the list comes out in whatever order the directory walk returned, and
   * two runs over one tree can print the same SET in two different orders — measured in
   * `32-36-RED-baseline.txt` § 4 against a shuffled input.
   */
  const censusOver = (
    rows: readonly ScannedFile[],
  ): {
    readonly detected: readonly (readonly [string, readonly ReaderFinding[]])[];
    readonly carriers: readonly (readonly [string, readonly ReaderFinding[]])[];
  } => {
    const detected = [...rows]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map((r) => [r.name, findTicketReaders(parse(r.name, r.text))] as const)
      .filter(([, f]) => f.length > 0);
    return {
      detected,
      // `Object.hasOwn`, NOT a raw property read (review WR-04). `Object.freeze` does not remove
      // `Object.prototype`, so `NOT_A_SECOND_AUTHORITY["toString"]` is a FUNCTION and a file named
      // `scripts/toString.ts` was exempted with no reason recorded and without moving
      // NOT_A_SECOND_AUTHORITY_COUNT — an exemption granted by a FILENAME rather than by a
      // decision, which is the class this whole census exists to prevent.
      carriers: detected.filter(([name]) => !Object.hasOwn(NOT_A_SECOND_AUTHORITY, name)),
    };
  };

  const LIVE_CENSUS = censusOver(LIVE_ROWS);

  /** Everything the WIDENED derivation names, BEFORE any exemption is applied. */
  const DETECTED = LIVE_CENSUS.detected;

  const CARRIERS = LIVE_CENSUS.carriers;

  /** TWO-SIDED. A second carrier is a second authority on what a ticket says. */
  const TICKET_FRONTMATTER_READER_COUNT = 1;

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // REVIEW WR-04 — THE CENSUS'S SUBJECT IS A FILE, SO A READER SPLIT ACROSS TWO IS INVISIBLE.
  //
  // `findTicketReaders` returns `[]` unless `namesBothKeys && primitiveRows.size > 0` WITHIN ONE
  // parsed source file. A genuine second authority whose key spellings live in one file and whose
  // text scan lives in another, joined by an ordinary `import`, is therefore never detected —
  // while the census's whole claim is "exactly one authority on what a ticket says".
  //
  // THE SCOPE IS STATED AS A REFUSAL rather than widened to the import-joined unit, which is this
  // repository's posture for a question a syntactic pass cannot decide in general: the split shape
  // is refused BY NAME instead of being invisible. The only way to assemble the pair across files
  // is for the key spellings to reach the scanning file through an import — a file that re-declares
  // both keys beside its own scan is already caught by the conjunction. So the join is what gets
  // asked about.
  // ═══════════════════════════════════════════════════════════════════════════════════════════
  /**
   * Every place a SCANNING file takes the ticket key half from another file's exported table.
   *
   * Written over arbitrary rows rather than over `LIVE_ROWS` directly, so the planted case below
   * can prove the rule DISCRIMINATES. A rule only ever measured against a clean tree is a rule
   * nobody has watched refuse anything.
   */
  const splitReaderOffenders = (rows: readonly ScannedFile[]): readonly string[] => {
    const halves = new Map(rows.map((r) => [r.name, readerHalves(parse(r.name, r.text))]));

    /**
     * The EXPORTED BINDINGS that are themselves key-spelling tables — the only thing an import can
     * carry that completes the pair. A module that merely CONTAINS both spellings is not a
     * supplier: `validate-agent-factory.ts` imports `parseBoard` and `parseTicketDocument` from the
     * one grammar precisely SO THAT it is not a second authority, and redding that would invert
     * the rule this census exists to enforce.
     */
    const keyTables = new Map<string, Set<string>>();
    for (const row of rows) {
      const sf = parse(row.name, row.text);
      const named = new Set<string>();
      const visit = (n: ts.Node): void => {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer !== undefined) {
          const text = n.initializer.getText(sf);
          if (KEY_SPELLINGS.every((k) => namesKey(text, k))) named.add(n.name.text);
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
      if (named.size > 0) keyTables.set(row.name, named);
    }

    /** Resolve a relative specifier to the scanned-set name it points at, or null. */
    const resolveScanned = (from: string, specifier: string): string | null => {
      if (!specifier.startsWith(".")) return null;
      const fromDir = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : "";
      const parts = (fromDir === "" ? specifier : `${fromDir}/${specifier}`).split("/");
      const out: string[] = [];
      for (const part of parts) {
        if (part === "." || part === "") continue;
        if (part === "..") out.pop();
        else out.push(part);
      }
      // The repository imports its own modules by their BUILT `.js` name; the scanned set is `.ts`.
      const joined = out.join("/").replace(/\.js$/, ".ts");
      return halves.has(joined) ? joined : null;
    };

    const offenders: string[] = [];
    for (const [name, h] of halves) {
      // A file that names both keys itself is already the conjunction's subject; only a file that
      // SCANS without naming them can be completing the pair through an import.
      if (!h.scans || h.namesBothKeys) continue;
      if (Object.hasOwn(NOT_A_SECOND_AUTHORITY, name)) continue;
      for (const imp of h.importsFrom) {
        const target = resolveScanned(name, imp.specifier);
        if (target === null || target === name) continue;
        const tables = keyTables.get(target);
        if (tables === undefined) continue;
        for (const binding of imp.names) {
          if (tables.has(binding)) {
            offenders.push(`${name} takes the key half from ${target} as \`${binding}\``);
          }
        }
      }
    }
    return offenders;
  };

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // REVIEW WR-04 — THE CENSUS'S SUBJECT IS A FILE, SO A READER SPLIT ACROSS TWO IS INVISIBLE.
  //
  // `findTicketReaders` returns `[]` unless `namesBothKeys && primitiveRows.size > 0` WITHIN ONE
  // parsed source file. A genuine second authority whose key spellings live in one file and whose
  // text scan lives in another, joined by an ordinary `import`, is therefore never detected —
  // while the census's whole claim is "exactly one authority on what a ticket says". 32-36 pinned
  // the over-detection direction and left the converse neither pinned nor stated; the round's own
  // self-review measured the split-file plant as a WORKING authority at exit 0.
  //
  // THE SCOPE IS STATED AS A REFUSAL rather than widened to the import-joined unit, which is this
  // repository's posture for a question a syntactic pass cannot decide in general: the split shape
  // is refused BY NAME instead of being invisible. The only way to assemble the pair across files
  // is for the key spellings to reach the scanning file through an import — a file that re-declares
  // both keys beside its own scan is already caught by the conjunction. So the join is what gets
  // asked about, and the BINDING is what is asked about, not the module.
  // ═══════════════════════════════════════════════════════════════════════════════════════════
  it("the exemption lookup is an OWN-property test, not a raw read of a frozen object", () => {
    // REVIEW WR-04, second defect — RECORDED WITH ITS REAL REACH, which is narrower than the review
    // states. `Object.freeze({…})` does not remove `Object.prototype`, so the raw read
    // `NOT_A_SECOND_AUTHORITY[name] === undefined` answers "exempt" for `toString`, `valueOf` and
    // `__proto__`. But every name the census ever looks up is a FILENAME ending in `.ts`, and
    // `"toString.ts"` is not a prototype member — so the defect is UNREACHABLE on the live scan set
    // for exactly the structural reason the review gives for IN-03, not for a reason anybody chose.
    //
    // It is fixed and pinned anyway, because "unreachable" here rests on a property of the scanned
    // set (that it is filtered to `.ts`) rather than on the lookup being correct — and that is a
    // premise a future change to the scan set can retire silently.
    const carrier =
      'const KEYS = ["column", "status"];\n' +
      "export const read = (t: string): string[] => t.split('\\n').filter((l) => " +
      "KEYS.some((k) => l.startsWith(k)));\n";

    // THE LOOKUP ITSELF, exercised at the bare names the raw read would have mis-answered.
    for (const inherited of ["toString", "valueOf", "__proto__", "constructor"]) {
      expect(
        Object.hasOwn(NOT_A_SECOND_AUTHORITY, inherited),
        `PREMISE: ${inherited} is a RECORDED exemption, so this case is about a decision rather ` +
          "than an inherited property",
      ).toBe(false);
      const { detected, carriers } = censusOver([{ name: inherited, text: carrier }]);
      expect(
        detected.map(([n]) => n),
        `PREMISE: ${inherited} was not detected as a reader at all, so "it is not exempted" is ` +
          "true of a file the census never saw",
      ).toEqual([inherited]);
      expect(
        carriers.map(([n]) => n),
        `${inherited} was exempted from the one-authority census by its NAME. No line of ` +
          "NOT_A_SECOND_AUTHORITY says so and NOT_A_SECOND_AUTHORITY_COUNT did not move",
      ).toEqual([inherited]);
    }

    // THE CONVERSE: a genuinely recorded exemption still exempts.
    const recorded = Object.keys(NOT_A_SECOND_AUTHORITY)[0] as string;
    expect(
      censusOver([{ name: recorded, text: carrier }]).carriers,
      "a file named in NOT_A_SECOND_AUTHORITY is no longer exempt, so the lookup now refuses the " +
        "decisions it is supposed to honour",
    ).toEqual([]);

    // AND THE PREMISE THE UNREACHABILITY RESTS ON, asserted rather than assumed: every live name
    // carries an extension, which is what keeps it off Object.prototype.
    expect(
      LIVE_ROWS.filter((r) => !r.name.endsWith(".ts")),
      "a scanned name without a `.ts` extension can collide with an Object.prototype member, which " +
        "is the premise that made this defect unreachable",
    ).toEqual([]);
  });

  it("no scanning file reaches the key spellings through an IMPORT from another scanned file", () => {
    expect(
      LIVE_ROWS.length,
      "PREMISE: nothing was scanned, so the refusal below refused nothing",
    ).toBeGreaterThan(10);

    const offenders = splitReaderOffenders(LIVE_ROWS);
    expect(
      offenders,
      `a file that SCANS text reaches the ticket key spellings through an import: ` +
        `${offenders.join(" | ")}. The one-authority census asks its question of a single parsed ` +
        "file, so a reader assembled across two files satisfies every check it makes while being " +
        "a second authority on what a ticket says. Either fold the reader back into the one " +
        "authority, or record the join here as a named decision the way NOT_A_SECOND_AUTHORITY " +
        "records a file",
    ).toEqual([]);
  });

  it("the split-across-files refusal DISCRIMINATES: the planted pair is caught, the legitimate one is not", () => {
    // THE PLANT THE ROUND'S OWN SELF-REVIEW MEASURED AT EXIT 0. The key spellings live in one file
    // and the text scan in another, joined by an ordinary import — a working second authority that
    // `findTicketReaders` cannot see, because its subject is one parsed file.
    const planted: readonly ScannedFile[] = [
      {
        name: "plant-keys.ts",
        text: 'export const TICKET_FIELDS = ["column", "status"] as const;\n',
      },
      {
        name: "plant-scan.ts",
        text:
          'import { TICKET_FIELDS } from "./plant-keys.js";\n' +
          "export function readTicket(text: string): Record<string, string> {\n" +
          "  const out: Record<string, string> = {};\n" +
          "  for (const line of text.split('\\n')) {\n" +
          "    for (const f of TICKET_FIELDS) {\n" +
          "      if (line.startsWith(`${f}:`)) out[f] = line.slice(f.length + 1).trim();\n" +
          "    }\n" +
          "  }\n" +
          "  return out;\n" +
          "}\n",
      },
    ];

    expect(
      findTicketReaders(parse("plant-scan.ts", planted[1]?.text ?? "")),
      "PREMISE: the file-scoped census must be BLIND to this plant, or the refusal below is not " +
        "closing the gap it claims to close",
    ).toEqual([]);

    expect(
      splitReaderOffenders(planted),
      "the planted split reader was NOT refused, so the scope statement is decorative",
    ).toEqual(["plant-scan.ts takes the key half from plant-keys.ts as `TICKET_FIELDS`"]);

    // THE CONVERSE, and the reason the BINDING is the subject rather than the module: importing the
    // one grammar's own functions is the CORRECT shape, and must not red.
    const legitimate: readonly ScannedFile[] = [
      {
        name: "plant-keys.ts",
        text:
          'export const TICKET_FIELDS = ["column", "status"] as const;\n' +
          "export const parseIt = (t: string): string => t.trim();\n",
      },
      {
        name: "plant-user.ts",
        text:
          'import { parseIt } from "./plant-keys.js";\n' +
          "export const use = (t: string): string => parseIt(t).split(':')[0] ?? '';\n",
      },
    ];
    expect(
      splitReaderOffenders(legitimate),
      "importing a NON-key binding from a module that happens to also declare a key table was " +
        "refused. That inverts the rule: using the one authority is the shape this census wants",
    ).toEqual([]);
  });


  /**
   * THE VERDICT, AS A FUNCTION OF THE COUNT — so that ZERO is a NAMED failure rather than a number
   * that happens to trip an equality.
   *
   * A census whose subject vanished reports zero, and zero satisfies every "at most one" reading of
   * "exactly one authority". Writing the verdict down on both sides of one is what makes the claim
   * a two-sided measurement: zero means the authority is GONE (a deletion, a rename, or a scan that
   * stopped finding anything), one is the live tree, and two or more is a second authority.
   */
  type CarrierVerdict = "vanished-authority" | "exactly-one-authority" | "second-authority";
  const carrierVerdict = (n: number): CarrierVerdict =>
    n === 0
      ? "vanished-authority"
      : n === TICKET_FRONTMATTER_READER_COUNT
        ? "exactly-one-authority"
        : "second-authority";

  it("the scan is non-vacuous: the glob found files, and every tracked scripts/*.ts is among them", () => {
    // BOUNDARY 1 — the FILE SET. A census over an empty glob reports one-of-nothing as success, so
    // the denominator is asserted BEFORE the count of one is claimed — and against an independently
    // derived set (git's index) rather than against itself.
    console.log(`ticket-frontmatter census: scanned ${SCANNED.length} .ts file(s) under scripts/`);
    expect(SCANNED.length, "the glob found no TypeScript at all — the census would be vacuous")
      .toBeGreaterThan(0);
    const tracked = execFileSync("git", ["ls-files", "scripts/*.ts"], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)
      .map((p) => p.slice("scripts/".length));
    expect(tracked.length, "git reported no tracked scripts/*.ts — the floor is vacuous")
      .toBeGreaterThan(0);
    const unscanned = tracked.filter((t) => !SCANNED.includes(t));
    expect(unscanned, "a tracked TypeScript file the census never opened").toEqual([]);
  });

  it("TICKET_FRONTMATTER_READER_COUNT is 1, and the carrier is scripts/board-model.ts", () => {
    const report = CARRIERS.map(
      ([name, f]) => `scripts/${name}: ${f.map((x) => `${x.kind} line ${x.line} — ${x.detail}`).join("; ")}`,
    ).join("\n");
    expect(
      CARRIERS.length,
      "a ticket's `column:` and `status:` are read by ONE authority. A second carrier means the " +
        "validator and the board projector can report different columns for the same ticket — the " +
        "drift DASH-01 exists to close, and the exact defect CR-06 found surviving plan 32-08.\n" +
        `Carriers found:\n${report}`,
    ).toBe(TICKET_FRONTMATTER_READER_COUNT);
    // The same number, read through the verdict — so the live tree is judged by the instrument the
    // boundary rows below are judged by, rather than by an equality standing on its own.
    expect(
      carrierVerdict(CARRIERS.length),
      `the live tree's verdict is not "exactly one authority":\n${report}`,
    ).toBe("exactly-one-authority");
    // The right NUMBER in the wrong FILE is still wrong: the one reader must be the grammar.
    expect(
      CARRIERS.map(([name]) => name),
      `the single carrier must be board-model.ts, and it is:\n${report}`,
    ).toEqual(["board-model.ts"]);
  });

  // ── THE EXEMPTIONS ARE DECISIONS, AND EACH ONE MUST STILL BE DOING SOMETHING ────────────────────

  it("every named exemption is actually detected by the widened derivation", () => {
    // An exemption for a file the derivation no longer names is an exemption silently doing
    // nothing — and it would sit there as a permanent hole, ready to cover a reader that appears
    // in that file later. Either the file stopped naming the keys or the derivation narrowed;
    // either way the entry below is describing something that is not there.
    const detectedNames = DETECTED.map(([name]) => name);
    for (const [name, reason] of Object.entries(NOT_A_SECOND_AUTHORITY)) {
      expect(
        detectedNames,
        `the exemption for "${name}" matches nothing the census names. It is a standing hole with ` +
          `no live reason: ${reason}`,
      ).toContain(name);
      expect(reason.length, `${name}'s exemption gives no reason`).toBeGreaterThan(40);
    }
  });

  it("the exemption set has exactly the pinned number of members", () => {
    expect(
      Object.keys(NOT_A_SECOND_AUTHORITY).length,
      "a further exemption is a DECISION: it asserts that a file naming both ticket keys beside a " +
        "text scan is not a second authority on what a ticket says. That judgment belongs beside " +
        "the others with its reason written out, not in a bumped constant",
    ).toBe(NOT_A_SECOND_AUTHORITY_COUNT);
  });

  // ── THE PRIMITIVE HALF IS A COMPLEMENT, AND ITS REFUSALS ARE DECISIONS TOO ─────────────────────

  it("the derived text-member set is non-vacuous and admits every spelling this repo records", () => {
    // A complement derived from an EMPTY set would refuse everything and the pair would never fire,
    // which is the vacuity shape this repository has recorded six instances of. The floor is
    // asserted before anything is claimed about what the complement admits.
    expect(
      TEXT_CAPABLE_MEMBERS.size,
      "String.prototype and RegExp.prototype between them define dozens of members; a set this " +
        "small means the derivation is reading something other than the language",
    ).toBeGreaterThan(40);
    // The RECORD and the DECIDER cannot disagree: every spelling the table writes down must be one
    // the complement admits. If a later author narrows the complement, this is what reds.
    for (const p of TEXT_SCAN_PRIMITIVES) {
      if (p.kind === "member") {
        expect(
          looksLikeTextScan(p.name),
          `\`${p.spelling}\` is in TEXT_SCAN_PRIMITIVES as a spelling this repository uses, and the ` +
            "complement refuses it — the record and the decider have drifted apart",
        ).toBe(true);
      } else {
        expect(
          CONSTRUCTOR_PRIMITIVES.includes(p.name),
          `\`${p.spelling}\` is recorded as a constructor primitive and the constructor arm does ` +
            "not carry it",
        ).toBe(true);
      }
    }
    // And the spellings round 3 measured walking through the ENUMERATION are admitted by the
    // complement without anybody having added them: that is what "refused complement" buys.
    for (const m of ["matchAll", "replace", "replaceAll", "search", "test", "startsWith", "slice"]) {
      expect(
        looksLikeTextScan(m),
        `\`.${m}\` is an ordinary way to scan text and the complement refuses it`,
      ).toBe(true);
    }
  });

  it("every refused member carries a reason, and the refusal set equals its pinned count", () => {
    for (const [name, reason] of Object.entries(NOT_A_TEXT_PRIMITIVE)) {
      expect(
        TEXT_CAPABLE_MEMBERS.has(name),
        `\`${name}\` is refused as a text primitive but neither prototype defines it — the ` +
          "refusal is describing something that is not there",
      ).toBe(true);
      expect(reason.length, `${name}'s refusal gives no reason`).toBeGreaterThan(40);
      expect(looksLikeTextScan(name), `${name} is refused and admitted at once`).toBe(false);
    }
    expect(
      Object.keys(NOT_A_TEXT_PRIMITIVE).length,
      "an exemption added to silence a red is a number somebody has to look at. A fourth refusal " +
        "asserts that a string method is not evidence of scanning text, which is the narrowing " +
        "that produced this finding twice",
    ).toBe(NOT_A_TEXT_PRIMITIVE_COUNT);
  });

  // ── DISCRIMINATION. BOUNDARY 2 — THE NODE KINDS, ONE ROW PER SPELLING ──────────────────────────
  //
  // Without these the two cases above could be green over a derivation that names nothing at all.
  // The first row is the reader plan 32-12 deleted from `scripts/validate-agent-factory.ts`, kept
  // verbatim; the next three are that same reader rewritten the way an ordinary author would write
  // it, taken from the round-1 review, each measured at ZERO carriers before this widening.

  /**
   * THE FOUR ORDINARY SECOND READERS ROUND 3 MEASURED, PLUS THE CONTROL — held as DATA.
   *
   * Every row is a real, semantically complete module that reads both ticket keys out of a
   * document's text. Every one of them measured at ZERO added carriers before this plan
   * (`32-36-RED-baseline.txt` § 2), and the `half` column records which side of the pair let it
   * through — which is what makes these four findings rather than four spellings of one.
   *
   * The control is the reader plan 32-12 DELETED, replanted verbatim. Without it a baseline cannot
   * tell a census that misses these four from a census that misses everything.
   */
  const SECOND_READER_PLANTS = Object.freeze([
    {
      id: "A",
      name: "plant-a-alternation-matchall.ts",
      half: "key and primitive" as const,
      source: [
        "const PAIR = /^(column|status):\\s*(.+)$/gm;",
        "export function ticketFields(text: string): Record<string, string> {",
        "  const out: Record<string, string> = {};",
        "  for (const m of text.matchAll(PAIR)) out[m[1] as string] = (m[2] as string).trim();",
        "  return out;",
        "}",
      ].join("\n"),
    },
    {
      id: "B",
      name: "plant-b-alternation-exec.ts",
      half: "key" as const,
      source: [
        "const PAIR = /^(column|status):\\s*(.+)$/gm;",
        "export function ticketFields(text: string): Record<string, string> {",
        "  const out: Record<string, string> = {};",
        "  let m: RegExpExecArray | null;",
        "  while ((m = PAIR.exec(text)) !== null) out[m[1] as string] = (m[2] as string).trim();",
        "  return out;",
        "}",
      ].join("\n"),
    },
    {
      id: "C",
      name: "plant-c-literals-replace.ts",
      half: "primitive" as const,
      source: [
        'const COLUMN_KEY = "column";',
        'const STATUS_KEY = "status";',
        "export function ticketFields(text: string): Record<string, string> {",
        "  const out: Record<string, string> = {};",
        "  text.replace(/([a-z]+):[ \\t]*(.+)/g, (_all: string, k: string, v: string) => {",
        "    if (k === COLUMN_KEY || k === STATUS_KEY) out[k] = v.trim();",
        '    return "";',
        "  });",
        "  return out;",
        "}",
      ].join("\n"),
    },
    {
      id: "D",
      name: "plant-d-joined-split.ts",
      half: "key" as const,
      source: [
        'const COLUMN_KEY = ["c", "o", "l", "u", "m", "n"].join("");',
        'const STATUS_KEY = ["s", "t", "a", "t", "u", "s"].join("");',
        "export function ticketFields(text: string): Record<string, string> {",
        "  const out: Record<string, string> = {};",
        '  for (const line of text.split("\\n")) {',
        '    const i = line.indexOf(":");',
        "    if (i < 0) continue;",
        "    const k = line.slice(0, i).trim();",
        "    if (k === COLUMN_KEY || k === STATUS_KEY) out[k] = line.slice(i + 1).trim();",
        "  }",
        "  return out;",
        "}",
      ].join("\n"),
    },
    {
      id: "CONTROL",
      name: "plant-control-deleted-reader.ts",
      half: "none — this one was always caught" as const,
      source: [
        "interface FrontMatter {",
        "  column: string | null;",
        "  status: string | null;",
        "}",
        "function frontMatter(text: string): FrontMatter {",
        "  const col = text.match(/^column:\\s*(.+)$/m);",
        "  const status = text.match(/^status:\\s*(.+)$/m);",
        "  return {",
        "    column: col ? col[1].trim() : null,",
        "    status: status ? status[1].trim() : null,",
        "  };",
        "}",
      ].join("\n"),
    },
  ] as const);

  /** Four measured rewrites plus one control — a row added here is a measurement somebody made. */
  const SECOND_READER_PLANT_COUNT = 5;

  const plantById = (id: string): (typeof SECOND_READER_PLANTS)[number] => {
    const row = SECOND_READER_PLANTS.find((p) => p.id === id);
    expect(row, `no plant row with id ${id}`).toBeDefined();
    return row as (typeof SECOND_READER_PLANTS)[number];
  };

  it("the plant table has exactly the pinned number of rows", () => {
    expect(
      SECOND_READER_PLANTS.length,
      "each row is a second reader somebody wrote and MEASURED against this census; the count is " +
        "pinned so a row cannot be dropped to make a red go away",
    ).toBe(SECOND_READER_PLANT_COUNT);
    expect(
      SECOND_READER_PLANTS.filter((p) => p.id === "CONTROL").length,
      "without the control this table cannot distinguish a blind census from a blind spot",
    ).toBe(1);
  });

  it("EVERY planted second reader raises the carrier count above one (32-36 § 2)", () => {
    // The census asked the SAME way the live tree is asked: the plant goes into the scanned set and
    // the whole census runs over it. Four of these five measured at zero added carriers before this
    // plan, with the block still asserting "exactly ONE ticket-frontmatter reader".
    for (const p of SECOND_READER_PLANTS) {
      const { carriers } = censusOver([...LIVE_ROWS, { name: p.name, text: p.source }]);
      expect(
        carriers.length,
        `plant ${p.id} (${p.name}) is a complete second reader of both ticket keys and the census ` +
          `does not see it. The half it defeats: ${p.half}. Measured at zero added carriers in ` +
          "32-36-RED-baseline.txt § 2 — if this reds again the predicate has been narrowed back",
      ).toBeGreaterThan(TICKET_FRONTMATTER_READER_COUNT);
      expect(
        carriers.map(([name]) => name),
        `plant ${p.id} must appear in the carrier list by name`,
      ).toContain(p.name);
    }
  });

  it("with NO plant, the carrier count is exactly one — the converse of the row above", () => {
    // A derivation that said yes to everything would pass all five rows above and prove nothing.
    expect(carrierVerdict(censusOver(LIVE_ROWS).carriers.length)).toBe("exactly-one-authority");
  });

  // ── THE CARRIER BOUNDARY, ONE STEP EITHER SIDE, AS CASES RATHER THAN AS ASSUMPTIONS ────────────

  /**
   * Zero, one and two carriers, each with the verdict it must produce.
   *
   * The count case above is an equality, and an equality tells you a number is wrong without
   * telling you WHICH WAY. Zero carriers is not a satisfied upper bound on "at most one authority"
   * — it is a census whose subject has vanished, and it must be as loud as a second authority.
   */
  const CARRIER_BOUNDARY_ROWS = Object.freeze([
    {
      carriers: 0,
      verdict: "vanished-authority" as const,
      why: "the one authority is GONE — deleted, renamed, or the scan stopped finding it. This is " +
        "NOT a satisfied upper bound and must never read as success",
    },
    {
      carriers: 1,
      verdict: "exactly-one-authority" as const,
      why: "the live tree: one grammar answers what a ticket says",
    },
    {
      carriers: 2,
      verdict: "second-authority" as const,
      why: "a second reader means the validator and the board projector can report different " +
        "columns for the same ticket — the drift DASH-01 exists to close",
    },
  ]);

  it("the carrier boundary is a case on BOTH sides of one, and zero REDS", () => {
    const control = plantById("CONTROL");
    const oneCarrier = LIVE_ROWS.filter((r) => r.name === "board-model.ts");
    const zeroCarriers = LIVE_ROWS.filter((r) => Object.hasOwn(NOT_A_SECOND_AUTHORITY, r.name));
    const twoCarriers = [...oneCarrier, { name: control.name, text: control.source }];
    const measured: Record<number, readonly ScannedFile[]> = {
      0: zeroCarriers,
      1: oneCarrier,
      2: twoCarriers,
    };
    for (const row of CARRIER_BOUNDARY_ROWS) {
      const input = measured[row.carriers] as readonly ScannedFile[];
      const n = censusOver(input).carriers.length;
      expect(n, `the ${row.carriers}-carrier input did not produce ${row.carriers} carriers`).toBe(
        row.carriers,
      );
      expect(carrierVerdict(n), `${row.carriers} carriers: ${row.why}`).toBe(row.verdict);
    }
    // And the live claim is the MIDDLE row, not an upper bound: both neighbours are failures.
    expect(carrierVerdict(0), "zero carriers must never read as a satisfied bound").not.toBe(
      "exactly-one-authority",
    );
    expect(carrierVerdict(2), "two carriers must never read as a satisfied bound").not.toBe(
      "exactly-one-authority",
    );
  });

  it("ADJACENCY: two readers differing only in key spelling count as TWO, not as one", () => {
    // A duplicated reader must not hide behind its sibling. The two sources below are identical
    // except that one writes `^column:` and the other `^column[:]` — two spellings `skeleton`
    // normalizes to the same text, which is exactly the pair most likely to be merged by a
    // derivation that deduplicated on content instead of on file.
    const control = plantById("CONTROL");
    const a = control.source;
    const b = a.replace("^column:", "^column[:]").replace("^status:", "^status[:]");
    expect(b, "the adjacency fixture did not actually change — the probe would be vacuous").not.toBe(a);
    const { carriers } = censusOver([
      ...LIVE_ROWS,
      { name: "adjacent-1.ts", text: a },
      { name: "adjacent-2.ts", text: b },
    ]);
    expect(
      carriers.length,
      "two near-identical readers were counted as one; a census that merges duplicates lets the " +
        "second copy of an authority ride along for free",
    ).toBe(TICKET_FRONTMATTER_READER_COUNT + 2);
    expect(carriers.map(([n]) => n)).toEqual([
      "adjacent-1.ts",
      "adjacent-2.ts",
      "board-model.ts",
    ]);
  });

  it("EMPTY INPUT: an empty scanned set reds the premise, and a one-file set is still asked", () => {
    // The census over nothing reports zero carriers, and zero is not "exactly one authority".
    expect(censusOver([]).carriers.length).toBe(0);
    expect(
      carrierVerdict(censusOver([]).carriers.length),
      "a census over an empty scanned set must red its non-vacuity premise rather than pass as " +
        "one-authority-over-nothing",
    ).toBe("vanished-authority");
    // A single-element scanned set is not a special case: the same question is asked of it.
    const one = LIVE_ROWS.filter((r) => r.name === "board-model.ts");
    expect(one.length, "board-model.ts is not in the scanned set — the probe is vacuous").toBe(1);
    expect(carrierVerdict(censusOver(one).carriers.length)).toBe("exactly-one-authority");
  });

  it("ORDERING: two runs over the same tree print the same carrier LIST, not the same set", () => {
    // Measured before the fix: the carrier list came out in the order the scanned set arrived in,
    // so a caller handing the census a differently-ordered set got a differently-ordered list of
    // the same carriers (32-36-RED-baseline.txt § 4). The sort now lives inside `censusOver`.
    const control = plantById("CONTROL");
    const planted: readonly ScannedFile[] = [
      ...LIVE_ROWS,
      { name: "order-probe-1.ts", text: control.source },
      { name: "order-probe-2.ts", text: control.source },
    ];
    const forwards = censusOver(planted).carriers.map(([n]) => n);
    const backwards = censusOver([...planted].reverse()).carriers.map(([n]) => n);
    expect(
      backwards,
      "the carrier list depends on the order the files arrived in, so two runs over one tree " +
        "report the same SET as two different LISTS and a reader comparing them compares traversal " +
        "order",
    ).toEqual(forwards);
    expect(forwards, "and the order is the sorted one").toEqual([...forwards].sort());
    expect(forwards.length, "the ordering probe must have more than one carrier to order").toBeGreaterThan(1);
    // The live scanned set is sorted too, so the two derivations agree about order.
    expect(SCANNED, "the scanned file set is not sorted").toEqual([...SCANNED].sort());
  });

  it("goes RED on the deleted reader: the exact source that was removed is still caught", () => {
    const deleted = plantById("CONTROL").source;
    const found = findTicketReaders(parse("planted-second-reader.ts", deleted));
    expect(
      found.length,
      "the widened question must be a SUPERSET of the old one: the reader the byte-for-byte arms " +
        "caught is still caught, so nothing was traded away for the three spellings below",
    ).toBeGreaterThan(0);
    expect(
      found.filter((f) => f.kind === "key").map((f) => f.detail.split(" ")[0]).sort(),
      "both key spellings must be named, not one",
    ).toEqual(["column", "status"]);
    expect(
      found.some((f) => f.kind === "primitive"),
      "the text-scanning primitive must be reached",
    ).toBe(true);
  });

  // ── THE THREE ORDINARY REWRITES (WR-01, round 1) ───────────────────────────────────────────────
  // Each is the deleted reader again, with no change in behaviour, written the way an ordinary
  // author would write it. Measured against the pre-32-21 derivation: all three reported ZERO
  // carriers while the count above still claimed one authority.
  const REWRITE_E1 = [
    'const COLUMN_RE = new RegExp("^column:\\\\s*(.+)$", "m");',
    'const STATUS_RE = new RegExp("^status:\\\\s*(.+)$", "m");',
    "export function ticketFields(text: string) {",
    "  const c = COLUMN_RE.exec(text);",
    "  const s = STATUS_RE.exec(text);",
    "  return { column: c ? c[1] : null, status: s ? s[1] : null };",
    "}",
  ].join("\n");

  const REWRITE_E2 = [
    "export function frontMatter2(text: string | undefined) {",
    "  if (text === undefined) return null;",
    "  const c = text.match(/^column[:]\\s*(.+)$/m);",
    "  const s = text.match(/^status[:]\\s*(.+)$/m);",
    "  return { column: c ? c[1] : null, status: s ? s[1] : null };",
    "}",
  ].join("\n");

  const REWRITE_E3 = [
    'const KEY_A = "col" + "umn";',
    'const KEY_B = "sta" + "tus";',
    "export function scanTicket(text) {",
    "  const out = {};",
    '  for (const line of text.split("\\n")) {',
    '    const i = line.indexOf(":");',
    "    if (i < 0) continue;",
    "    const k = line.slice(0, i);",
    "    if (k === KEY_A || k === KEY_B) out[k] = line.slice(i + 1).trim();",
    "  }",
    "  return out;",
    "}",
  ].join("\n");

  it("goes RED on a pattern built from a string (WR-01 E1)", () => {
    expect(
      findTicketReaders(parse("rewrite-e1.ts", REWRITE_E1)).length,
      "a second authority hoisted to module scope as `new RegExp(...)` is a second authority",
    ).toBeGreaterThan(0);
  });

  it("goes RED on a reader whose text parameter carries no `string` annotation (WR-01 E2)", () => {
    expect(
      findTicketReaders(parse("rewrite-e2.ts", REWRITE_E2)).length,
      "a reader typed `string | undefined` reads ticket text exactly as one typed `string` does",
    ).toBeGreaterThan(0);
  });

  it("goes RED on a hand-rolled scan with the key names concatenated (WR-01 E3)", () => {
    expect(
      findTicketReaders(parse("rewrite-e3.ts", REWRITE_E3)).length,
      "splitting on newlines and looking up a colon reads the two keys out of text just as a " +
        "pattern does; assembling the key names by concatenation changes nothing about that",
    ).toBeGreaterThan(0);
  });

  it("stays SILENT on each half of the pair alone, so the conjunction is what decides", () => {
    // The converse of the three rows above. A derivation that said yes to everything would pass
    // them all and prove nothing; these two show the pair is a conjunction rather than a formality.
    const keysOnly = [
      'export const TICKET_COLUMNS = ["column", "status"] as const;',
      "export type Key = (typeof TICKET_COLUMNS)[number];",
    ].join("\n");
    expect(
      findTicketReaders(parse("keys-only.ts", keysOnly)),
      "naming the two keys without scanning any text is a key set, not a reader",
    ).toEqual([]);
    const scanOnly = [
      "export function fields(text: string) {",
      '  return text.split("\\n").map((l) => l.indexOf(":"));',
      "}",
    ].join("\n");
    expect(
      findTicketReaders(parse("scan-only.ts", scanOnly)),
      "scanning text without naming either key is half the repository, not a reader",
    ).toEqual([]);
  });

  // ── BOUNDARY 3 — THE UNRESOLVABLE KEY SPELLING, MEASURED RATHER THAN CLAIMED ABSENT ────────────

  it("does NOT see a reader whose key spellings are assembled at RUNTIME — the stated blind spot", () => {
    // This is a real hole and it is written down rather than discovered. A key spelling that only
    // exists once the program runs cannot be resolved by a static pass, and the honest thing for a
    // census to do about a boundary it cannot cross is to STATE it and pin it, so that a later
    // reader arguing "the census would have caught it" is arguing against a measurement.
    //
    // It is not a live bypass: nothing in `scripts/` builds a ticket key this way, and the count of
    // one above is derived over the live tree. It is the next thing to close if this census is ever
    // asked to carry more weight than it does today.
    const runtimeAssembled = [
      "const parts = [[99, 111, 108, 117, 109, 110], [115, 116, 97, 116, 117, 115]];",
      "const KEYS = parts.map((p) => String.fromCharCode(...p));",
      "export function fields(text) {",
      "  const out = {};",
      '  for (const line of text.split("\\n")) {',
      '    const i = line.indexOf(":");',
      "    if (i >= 0 && KEYS.includes(line.slice(0, i))) out[line.slice(0, i)] = line.slice(i + 1);",
      "  }",
      "  return out;",
      "}",
    ].join("\n");
    expect(
      findTicketReaders(parse("runtime-assembled.ts", runtimeAssembled)),
      "STATED BOUNDARY: a key spelling that does not exist until the program runs is outside a " +
        "static pass. If this ever becomes a live shape in scripts/, the census needs a different " +
        "instrument — not one more condition",
    ).toEqual([]);
  });

  // ── BOUNDARY 4 — THE PAIR IS FILE-SCOPED, AND THAT IS A CHOICE ─────────────────────────────────

  it("names a file whose key spellings and text scan never meet — over-detection, by choice", () => {
    // The imprecision, pinned in the direction it runs. Narrowing the pair to "the same function"
    // would let a reader split across two functions — a `KEYS` constant here, a scan there — walk
    // straight through, which is one refactor away from the shape WR-01 measured. The cost is paid
    // by the three named exemptions above, not by a narrower question.
    const split = [
      'export const KEYS = ["column", "status"] as const;',
      "export function unrelated(csv: string): string[] {",
      '  return csv.split(",");',
      "}",
    ].join("\n");
    expect(
      findTicketReaders(parse("split-across-file.ts", split)).length,
      "STATED BOUNDARY: the pair is file-scoped. A carrier here may be a false positive, and the " +
        "answer to a false positive is a named exemption with a reason",
    ).toBeGreaterThan(0);
  });
});
