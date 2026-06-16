// check-uat-oracles.test.ts — Phase 19 Tier-1 fail-proof harness for scripts/check-uat-oracles.js.
//
// Proves the three Tier-1 oracles both PASS and FAIL — the no-fabrication contract (a gate that can
// only ever pass is fabricated green). For EACH oracle it plants exactly one real violation into a
// hermetic throwaway mirror of the inputs, runs the COMPILED aggregator (.js) against that mirror via
// the CHECK_ROOT override, and asserts it fails red (nonzero exit AND the finding names the defect).
// Then a single shared smoke run proves the REAL aggregator is GREEN over the REAL tree.
//
// The aggregator exposes a CHECK_ROOT env override (it resolves every path against CHECK_ROOT when
// set), so this harness mirrors inputs into a temp dir and spawns `node check-uat-oracles.js` with
// CHECK_ROOT pointed at the mirror — reproducing the same hermetic plant-and-run behavior. NOTHING
// outside the temp dir is mutated.
//
// Spawns the COMMITTED compiled .js (never the .ts), mirroring the spawnSync child-CLI test idiom.
// Cases are tagged so they are runnable by name: -t "wording" / -t "wiring" / -t "parity".

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "scripts", "check-uat-oracles.js");

// The complete set of input files the aggregator reads (repo-relative). A mirror carries byte-faithful
// copies of all of these; one file is then mutated to plant a violation. The four WR05_SCAN docs +
// hooks.json + the committed guard.js (the A2 oracle spawns it) + the parity example.
const GUARD_INPUTS = [
  ".planning/PROJECT.md",
  ".planning/STATE.md",
  ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
  ".planning/RETROSPECTIVE.md",
  "hooks/hooks.json",
  "hooks/guard.js",
  "examples/03-ticket-to-pr.md",
];

const tmpDirs: string[] = [];

// Build a temp mirror carrying byte-faithful copies of every aggregator input. Returns the mirror dir.
function mirror(): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-uat-"));
  tmpDirs.push(m);
  for (const rel of GUARD_INPUTS) {
    mkdirSync(join(m, dirname(rel)), { recursive: true });
    cpSync(join(ROOT, rel), join(m, rel));
  }
  return m;
}

// Run the compiled aggregator with CHECK_ROOT pointed at the mirror; capture status + combined output.
function runIn(checkRoot: string): SpawnSyncReturns<string> {
  return spawnSync("node", [GUARD_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
}

// The combined stdout+stderr of a run (findings print to stdout).
function out(r: SpawnSyncReturns<string>): string {
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
}

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

describe("check-uat-oracles.js (Phase 19 Tier-1 fail-proof harness)", () => {
  // ── oracleWr05Wording — strip a beat from one scan doc; the aggregator must go red. ──────────────
  it("wording: a scan doc missing the Phase-10 guard_wr05 beat → nonzero + names the doc", () => {
    const m = mirror();
    // Remove every line carrying the Phase-10 guard_wr05 beat from one scan doc (STATE.md), so that
    // doc no longer carries beat2. The other three still do, isolating a single planted violation.
    const file = join(m, ".planning/STATE.md");
    const kept = readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => !(/guard_wr05/.test(l) && /\bPhase[ -]?10\b/i.test(l)))
      .join("\n");
    writeFileSync(file, kept);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/wording-consistency violation/i);
    expect(out(r)).toContain("STATE.md");
  });

  it("wording: a missing scan doc → nonzero + 'missing' (CR-01, never vacuous-PASS)", () => {
    const m = mirror();
    rmSync(join(m, ".planning/RETROSPECTIVE.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("RETROSPECTIVE.md missing");
  });

  // ── oracleHooksWiring — break the matcher (NOT guard.js logic); the aggregator must go red. ──────
  it("wiring: hooks.json matcher mutated away from Bash → nonzero + wiring defect", () => {
    const m = mirror();
    const file = join(m, "hooks/hooks.json");
    const cfg = JSON.parse(readFileSync(file, "utf8"));
    cfg.hooks.PreToolUse[0].matcher = "NotBash";
    writeFileSync(file, JSON.stringify(cfg, null, 2));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/matcher is not "Bash"/);
  });

  it("wiring: hooks.json command no longer references guard.js → nonzero + wiring defect", () => {
    const m = mirror();
    const file = join(m, "hooks/hooks.json");
    const cfg = JSON.parse(readFileSync(file, "utf8"));
    cfg.hooks.PreToolUse[0].hooks[0].command = "node some-other-hook.js";
    writeFileSync(file, JSON.stringify(cfg, null, 2));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/does not reference guard\.js/);
  });

  // ── oracleParity — remove a frozen string; the aggregator must go red. ───────────────────────────
  it("parity: parity table missing the READY_FOR_HUMAN_REVIEW verdict → nonzero + names the missing string", () => {
    const m = mirror();
    const file = join(m, "examples/03-ticket-to-pr.md");
    const stripped = readFileSync(file, "utf8").replace(
      /READY_FOR_HUMAN_REVIEW/g,
      "REDACTED_VERDICT",
    );
    writeFileSync(file, stripped);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/parity structural violation/i);
    expect(out(r)).toContain("READY_FOR_HUMAN_REVIEW");
  });

  it("parity: parity table missing a frozen handoff filename → nonzero + names the missing handoff", () => {
    const m = mirror();
    const file = join(m, "examples/03-ticket-to-pr.md");
    const stripped = readFileSync(file, "utf8").replace(
      /implementation-handoff\.md/g,
      "redacted-handoff.md",
    );
    writeFileSync(file, stripped);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("implementation-handoff.md");
  });

  // ── Smoke — the REAL aggregator over the REAL tree must be GREEN (exit 0). ────────────────────────
  it("smoke: real aggregator GREEN over the real tree (ALL CHECKS PASSED)", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });
});
