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
// The single-source equivalence comparator the Tier-1 oracle uses — imported here for the RED
// non-vacuity case (proving assertEquivalent genuinely goes red on divergence, not a fabricated green).
import { assertEquivalent, type ProjectedNote } from "./dual-path-equivalence.js";

const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "scripts", "check-uat-oracles.js");

// The complete set of input files the file-reading oracles consume (repo-relative). A mirror carries
// byte-faithful copies of all of these; one file is then mutated to plant a violation. The four
// WR05_SCAN docs + hooks.json + the committed guard.js (the A2 oracle spawns it) + the two 5-tool
// tables. (DOGF-01: oracleDualPathEquivalence self-seeds hermetic temp dirs and reads NONE of these,
// so examples/03-ticket-to-pr.md — the former parity-grep oracle's input — is no longer a guard input.)
const GUARD_INPUTS = [
  ".planning/PROJECT.md",
  ".planning/STATE.md",
  ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
  ".planning/RETROSPECTIVE.md",
  "hooks/hooks.json",
  "hooks/guard.js",
  // Phase 23 (D-19 / Pitfall 3): the oracle now scans the 5-tool tables for asymmetric-flip drift.
  "agent-factory/packaging/adapters.md",
  "agent-factory/README.md",
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

  // ── Asymmetry-drift RED fixture (D-19 / Pitfall 3) — a non-CC row growing spawn wording → red. ────
  // Plant coordinator-spawn wording into the Codex CLI row of adapters.md (mirror) and assert the
  // oracle goes red naming the drifted row/file. This is the wording-drift catcher the flip needs:
  // the asymmetric flip must keep the four non-CC rows no-spawn; a bulk find-replace that hits them
  // is the exact bug.
  it("wording asymmetry-drift: Codex CLI row gains spawn/coordinator wording → nonzero + names the row/file", () => {
    const m = mirror();
    const file = join(m, "agent-factory/packaging/adapters.md");
    const drifted = readFileSync(file, "utf8")
      .split("\n")
      .map((l) =>
        /^\|\s*\*\*Codex CLI\*\*/.test(l)
          ? l.replace(
              "Sequential role-load — no spawn",
              "Coordinator spawns role agents",
            )
          : l,
      )
      .join("\n");
    writeFileSync(file, drifted);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/asymmetry drift/i);
    expect(out(r)).toContain("adapters.md");
    expect(out(r)).toContain("Codex CLI");
  });

  // WR-01: the broadened ASYM_SPAWN_WORDING catches the CONCEPT, not three exact phrasings. A non-CC
  // row that gains "parallel"/"fan-out" wording (without the literal "coordinator"/"spawns role
  // agents") previously passed both directions; it must now fail naming the row. Plant "parallel
  // fan-out of role agents" into the Gemini CLI row (keeping its no-spawn wording so the ONLY trip is
  // the broadened spawn-concept catch).
  it("wording WR-01: non-CC row gains 'parallel fan-out' wording (no literal coordinator) → nonzero + names the row", () => {
    const m = mirror();
    const file = join(m, "agent-factory/packaging/adapters.md");
    const drifted = readFileSync(file, "utf8")
      .split("\n")
      .map((l) =>
        /^\|\s*\*\*Gemini CLI\*\*/.test(l)
          ? l.replace(
              "Sequential role-load — no spawn",
              "Sequential role-load — no spawn; now also parallel fan-out of role agents",
            )
          : l,
      )
      .join("\n");
    writeFileSync(file, drifted);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/asymmetry drift/i);
    expect(out(r)).toContain("Gemini CLI");
  });

  // The CC row losing its coordinator-spawn wording must ALSO fail (the flip must persist).
  it("wording asymmetry: Claude Code row loses coordinator-spawn wording → nonzero + names the file", () => {
    const m = mirror();
    const file = join(m, "agent-factory/README.md");
    const reverted = readFileSync(file, "utf8")
      .split("\n")
      .map((l) =>
        /^\|\s*\*\*Claude Code\*\*/.test(l)
          ? l.replace(
              /Coordinator spawns role agents[^|]*/,
              "Sequential role-load — no spawn ",
            )
          : l,
      )
      .join("\n");
    writeFileSync(file, reverted);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("README.md");
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

  // ── oracleDualPathEquivalence (DOGF-01) — replaces the two structural parity-grep tests. ─────────
  //
  // The oracle no longer reads a doc's parity table; it drives the committed substrate two ways in
  // hermetic temp dirs and asserts on-disk convergence. Its inputs are self-seeded (mkdtempSync), so
  // there is no mirror file to mutate — the failure surface lives in the SHARED comparator instead.
  // Hence two cases: a GREEN convergence case (the real oracle passes over its own hermetic fixture)
  // and a RED non-vacuity case (the comparator returns a non-empty diff on divergence — the keystone
  // that proves the oracle CAN go red and is not a fabricated green).

  // GREEN: the real aggregator converges — the dual-path equivalence oracle passes over the real tree.
  it("equivalence: real aggregator GREEN and the dual-path equivalence oracle reports PASS", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(out(r)).toContain("oracleDualPathEquivalence");
    // The oracle's PASS line names the convergence property it proved.
    expect(out(r)).toMatch(/PASS\s+dual-path equivalence/);
  });

  // RED non-vacuity keystone: feed assertEquivalent two DELIBERATELY divergent projected note-sets and
  // assert it returns a NON-empty diff. If the comparator ever returned [] on real divergence, the
  // whole oracle would be a fabricated green — this case is the guard against exactly that.
  it("equivalence non-vacuity: assertEquivalent returns a NON-empty diff when the two note-sets diverge", () => {
    const noteFor = (body: string): ProjectedNote => ({
      kind: "finding",
      at: "2026-06-21T10:01:30.000Z",
      verified_by: "§14-gate#R26-DOGF01-0001",
      confidence: "high",
      refs: ["§14-gate#R26-DOGF01-0001"],
      body,
    });
    const pathA = [noteFor("READY_FOR_HUMAN_REVIEW: seeded admitted finding for t1")];

    // (1) a field-level divergence (path B's finding lost the frozen verdict body) → non-empty diff.
    const pathBVerdictDropped = [noteFor("REDACTED: the frozen verdict is gone")];
    const diffField = assertEquivalent(pathA, pathBVerdictDropped);
    expect(diffField.length).toBeGreaterThan(0);

    // (2) a count divergence (path B is missing the admitted finding entirely) → non-empty diff.
    const diffMissing = assertEquivalent(pathA, []);
    expect(diffMissing.length).toBeGreaterThan(0);

    // Sanity: identical note-sets are equivalent (empty diff) — the comparator is not always-red either.
    expect(assertEquivalent(pathA, [noteFor("READY_FOR_HUMAN_REVIEW: seeded admitted finding for t1")])).toEqual([]);
  });

  // ── Smoke — the REAL aggregator over the REAL tree must be GREEN (exit 0). ────────────────────────
  it("smoke: real aggregator GREEN over the real tree (ALL CHECKS PASSED)", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });
});
