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
// Cases are tagged so they are runnable by name: -t "wording" / -t "wiring" / -t "equivalence".

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
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
// The single-source equivalence comparator the Tier-1 oracle uses — imported here for the RED
// non-vacuity case (proving assertEquivalent genuinely goes red on divergence, not a fabricated green).
import { assertEquivalent, type ProjectedNote } from "./dual-path-equivalence.js";
// The D-20 pins, imported from the gate rather than restated here. The gate's `isEntry` guard is
// what makes this safe: importing the module for its exported pins does NOT run the check or call
// process.exit. A restated `262144` in this file would be the duplicated-set-literal defect the
// whole milestone has been closing.
import { WR05_BEATS, WR05_MAX_LINE_BYTES } from "./check-uat-oracles.js";

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

// ---------------------------------------------------------------------------
// D-20 — the oracle terminates, refuses an over-long line by name, and the pure-lookahead class
// stays closed. (Phase 28 plan 02, folding todo `oracle-wr05-quadratic-lookahead-hang.md`.)
//
// WHAT WAS BROKEN. The three WR05_BEATS regexes were bare sequences of zero-width lookaheads with
// no consuming atom, so a failed match was retried at every start position and each retry rescanned
// the rest of the line — quadratic in line length. Because `.planning/STATE.md` is in WR05_SCAN and
// is an agent-written narrative the GSD workflow appends to on every state update, a real 527 KB
// line in it made `check-foundation-guards.js` NON-TERMINATING. The whole vitest suite depends on
// that aggregator; check-foundation-guards.test.ts spawns it 112 times.
//
// WHY THIS CONTROL IS PERMANENT. Measured against the PRE-FIX committed build on this box
// (node v24.12.0, darwin), with one synthetic non-matching line appended to a mirror's STATE.md:
//
//     32 KiB ->  1.97 s | 64 KiB ->  6.29 s | 128 KiB -> 23.62 s | 256 KiB -> 92.58 s
//
// At 256 KiB the pre-fix build was killed by SIGTERM at the 20 s budget below with no verdict at
// all, and took 92.58 s to return when given a 300 s ceiling. After the fix the same mirror returns
// in 0.09 s. The case is written as a wall-clock MEASUREMENT (an explicit spawn timeout that kills
// the child), not as an assertion that the regexes look linear — a hang cannot be detected by
// reading code, and a gate with no verdict is a fail-open, not a red gate.
// ---------------------------------------------------------------------------

// The control's wall-clock budget. The pre-fix build blew through this by ~4.6x at the size below.
const WR05_TERMINATION_BUDGET_MS = 20_000;

// Build a mirror whose .planning/STATE.md carries one synthetic line of exactly `bytes` ASCII bytes
// that contains NONE of the three beat tokens — so every beat regex must fail on it, which is the
// expensive direction. The rest of STATE.md is untouched, so all three beats are still present in
// the file and the oracle's verdict is unaffected by the plant.
function mirrorWithLongStateLine(bytes: number): string {
  const m = mirror();
  const file = join(m, ".planning/STATE.md");
  writeFileSync(file, `${readFileSync(file, "utf8")}\n${"a".repeat(bytes)}\n`);
  return m;
}

function runInBudget(checkRoot: string): SpawnSyncReturns<string> {
  return spawnSync("node", [GUARD_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
    timeout: WR05_TERMINATION_BUDGET_MS,
  });
}

describe("check-uat-oracles.js — D-20 termination, input bound, and the closed lookahead class", () => {
  // ── D-20 item 2: the permanent regression control. ────────────────────────────────────────────
  it("termination: a pathological line AT the bound returns a verdict inside the budget (RED pre-fix)", () => {
    const m = mirrorWithLongStateLine(WR05_MAX_LINE_BYTES);
    const r = runInBudget(m);
    // A timeout kill surfaces as signal SIGTERM / error ETIMEDOUT and status null. Assert the
    // ABSENCE of that explicitly rather than only asserting exit 0 — "no verdict" and "green" are
    // different outcomes and only one of them is acceptable here.
    expect(r.signal).toBeNull();
    expect((r.error as NodeJS.ErrnoException | undefined)?.code).toBeUndefined();
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // ── D-20 item 3: the bound fires, and it fires BY NAME. ───────────────────────────────────────
  it("bound: a line of WR05_MAX_LINE_BYTES+1 refuses loudly, naming the file AND the constant", () => {
    const m = mirrorWithLongStateLine(WR05_MAX_LINE_BYTES + 1);
    const r = runInBudget(m);
    expect(r.status).not.toBe(0);
    // Asserting non-zero alone is insufficient — ANY failure would satisfy it. The refusal must
    // name the offending file, the measured length, and the constant, or a reader meeting this in
    // CI cannot tell which input the gate declined or what threshold it declined against.
    expect(out(r)).toContain(".planning/STATE.md");
    expect(out(r)).toContain(`WR05_MAX_LINE_BYTES=${WR05_MAX_LINE_BYTES}`);
    expect(out(r)).toContain(`${WR05_MAX_LINE_BYTES + 1} bytes long`);
    // A refusal must never read as a beat verdict: the oracle returns before the beat scan, so the
    // PASS line asserting the beats are present must be absent.
    expect(out(r)).not.toMatch(/PASS\s+WR-05 wording/);
  });

  // Exact integer comparison at the named constant: the WR05_MAX_LINE_BYTES-th byte is still under
  // the bound and the next one trips it, so the threshold cannot be crossed by an off-by-one. The
  // case above supplies the +1 half; this one supplies the exactly-at half.
  it("bound: a line of exactly WR05_MAX_LINE_BYTES does NOT trip the bound", () => {
    const r = runInBudget(mirrorWithLongStateLine(WR05_MAX_LINE_BYTES));
    expect(r.status).toBe(0);
    expect(out(r)).not.toContain("WR05_MAX_LINE_BYTES");
  });

  // ── The bound is a ceiling on the pathological case, not a change to normal operation. ────────
  it("bound: does NOT fire on the live tree — no WR05_SCAN line is anywhere near the bound", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(out(r)).not.toContain("WR05_MAX_LINE_BYTES");
    // Measure the headroom directly too, so a future STATE.md that creeps toward the bound is
    // visible here rather than only when the gate suddenly refuses.
    const longest = Math.max(
      ...[
        ".planning/PROJECT.md",
        ".planning/STATE.md",
        ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
        ".planning/RETROSPECTIVE.md",
      ].flatMap((rel) =>
        readFileSync(join(ROOT, rel), "utf8")
          .split("\n")
          .map((l) => Buffer.byteLength(l, "utf8")),
      ),
    );
    expect(longest).toBeLessThan(WR05_MAX_LINE_BYTES);
  });

  // ── D-20 item 1: the closed class. ────────────────────────────────────────────────────────────
  //
  // THE PLAN'S PREMISE WAS WRONG AND THE MEASUREMENT WINS. D-20 item 1 states the class is "exactly
  // 3 pure-lookahead regexes, all in WR05_BEATS, and no other pure-lookahead regex anywhere in
  // scripts/". Scanning every regex literal in every .ts file under scripts/ found FOUR. The fourth
  // is the String.split() separator below, and it is SANCTIONED rather than a defect: a split
  // separator must be zero-width (a consuming atom would eat the delimiter it splits on), it
  // carries `^` inside the lookahead so a non-line-start position fails in O(1) instead of
  // rescanning, and its subject is a bounded test fixture rather than unbounded agent prose.
  //
  // Recording it as a NAMED exemption with its reason — rather than lowering the assertion to
  // "at most one" or quietly excluding the file — follows this repository's established shape: an
  // exemption expressed as absence from a list reads later as an oversight.
  const SANCTIONED_PURE_LOOKAHEAD = {
    file: "scripts/compactor.test.ts",
    source: "(?=^---\\nid:)",
    reason:
      "a String.split() boundary separator, where zero-width IS the contract; anchored inside the " +
      "lookahead so non-line-start positions fail in O(1); subject is a bounded test fixture",
  };

  // Extract regex LITERALS from one line, conservatively: a `/` opening a literal is preceded by
  // one of = ( , : [ ! & | ? { ; or `return`. `//` and `/*` end the scan of the line (a comment
  // body is not code). Escape- and character-class-aware so `/[a/b]/` and `/\//` do not terminate
  // early. Deliberately a source scan and not a runtime one: a pure-lookahead literal that is never
  // constructed at runtime is still a latent instance of the class.
  function regexLiteralsInLine(line: string): string[] {
    const found: string[] = [];
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== "/") continue;
      if (line[i + 1] === "/" || line[i + 1] === "*") break;
      const prev = line.slice(0, i).replace(/\s+$/, "");
      if (!/[=(,:[!&|?{;]$|\breturn$/.test(prev)) continue;
      let j = i + 1;
      let inClass = false;
      let body = "";
      for (; j < line.length; j++) {
        const c = line[j];
        if (c === "\\") {
          body += c + (line[j + 1] ?? "");
          j++;
          continue;
        }
        if (c === "[") inClass = true;
        else if (c === "]") inClass = false;
        else if (c === "/" && !inClass) break;
        body += c;
      }
      if (j >= line.length) continue; // unterminated on this line — division, not a literal
      found.push(body);
      i = j;
    }
    return found;
  }

  // Remove every lookaround group `(?=…) (?!…) (?<=…) (?<!…)`, depth-, escape- and class-aware.
  // Whatever survives is the CONSUMING part. An empty remainder means the regex consumes nothing,
  // so a failed match is retried at every start position — the class this control closes.
  function consumingRemainder(body: string): string {
    let out = "";
    let i = 0;
    while (i < body.length) {
      if (body[i] === "\\") {
        out += body.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (
        body.startsWith("(?=", i) ||
        body.startsWith("(?!", i) ||
        body.startsWith("(?<=", i) ||
        body.startsWith("(?<!", i)
      ) {
        let depth = 0;
        let inClass = false;
        let k = i;
        for (; k < body.length; k++) {
          const c = body[k];
          if (c === "\\") {
            k++;
            continue;
          }
          if (inClass) {
            if (c === "]") inClass = false;
            continue;
          }
          if (c === "[") inClass = true;
          else if (c === "(") depth++;
          else if (c === ")") {
            depth--;
            if (depth === 0) break;
          }
        }
        i = k + 1;
        continue;
      }
      out += body[i];
      i++;
    }
    return out.trim();
  }

  function tsFilesUnder(dir: string): string[] {
    const acc: string[] = [];
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) acc.push(...tsFilesUnder(full));
      else if (name.endsWith(".ts")) acc.push(full);
    }
    return acc;
  }

  // Only .ts is scanned: the committed .js twins are generated from these sources and `npm run
  // freshness` already fails red on any drift between the two, so scanning both would assert the
  // same fact twice while doubling the chance of a scanner artifact.
  function pureLookaheadSites(): { where: string; source: string }[] {
    const hits: { where: string; source: string }[] = [];
    for (const file of tsFilesUnder(join(ROOT, "scripts"))) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, n) => {
          for (const body of regexLiteralsInLine(line)) {
            if (!/^\(\?[=!<]/.test(body)) continue;
            if (consumingRemainder(body) !== "") continue;
            hits.push({
              where: `${file.slice(ROOT.length + 1)}:${n + 1}`,
              source: body,
            });
          }
        });
    }
    return hits;
  }

  it("closed class: WR05_BEATS has exactly three members (two-sided pin)", () => {
    expect(WR05_BEATS.length).toBe(3);
    expect(WR05_BEATS.length).not.toBe(2);
    expect(WR05_BEATS.length).not.toBe(4);
  });

  it("closed class: no WR05 beat regex is a pure zero-width lookahead any more", () => {
    for (const beat of WR05_BEATS) {
      expect(consumingRemainder(beat.re.source), beat.label).not.toBe("");
      // Start-anchored, single-line subject (grepFiles has already split on \n), so exactly one
      // start position is ever attempted.
      expect(beat.re.source.startsWith("^"), beat.label).toBe(true);
      expect(beat.re.flags).not.toContain("m");
    }
  });

  it("closed class: the sanctioned split separator is the ONLY pure lookahead left under scripts/", () => {
    const sites = pureLookaheadSites();
    // Non-vacuity first: a scanner that found nothing anywhere would pass the assertion below while
    // proving nothing at all. The sanctioned site must be FOUND, by name.
    expect(sites.map((s) => s.where.split(":")[0])).toContain(
      SANCTIONED_PURE_LOOKAHEAD.file,
    );
    expect(sites.map((s) => s.source)).toContain(
      SANCTIONED_PURE_LOOKAHEAD.source,
    );
    expect(
      sites.filter((s) => s.where.split(":")[0] !== SANCTIONED_PURE_LOOKAHEAD.file),
      `a new pure zero-width lookahead entered scripts/ — its cost is quadratic in subject length ` +
        `and this repository has already shipped one non-terminating CI gate that way. Give it a ` +
        `consuming atom, or add it here with its reason as ${SANCTIONED_PURE_LOOKAHEAD.file} is ` +
        `(${SANCTIONED_PURE_LOOKAHEAD.reason}).`,
    ).toEqual([]);
    expect(sites.length).toBe(1);
  });
});
