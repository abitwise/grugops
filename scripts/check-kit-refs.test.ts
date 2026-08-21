// check-kit-refs.test.ts — behavioral oracle for the flipped Phase-24 grep-to-zero kit-ref gate.
//
// The gate (scripts/check-kit-refs.ts → committed scripts/check-kit-refs.js) had NO test before
// Phase 24 (Pitfall 2). This file stands up its FIRST harness and carries the D-15 both-direction
// adversarial proof: it drives the COMMITTED .js via spawnSync (never the .ts), builds a hermetic
// mirror via mkdtempSync, and points the gate at the mirror through the existing CHECK_ROOT override
// (check-kit-refs.ts:34). Nothing is ever written into the committed tree.
//
// The terminal project lesson (memory: grugops-safety-invariant-green-suite-insufficient) is that a
// green unit suite is NOT proof for a safety/trace guard — the only acceptable proof is an adversarial
// RED-vs-committed-.js reproduction. These cases ARE that reproduction, run in CI:
//
//   GREEN        : a mirror whose SCAN-set files carry zero `agent-factory/handoffs/` refs → exit 0.
//   RED          : plant an `agent-factory/handoffs/anything.md` ref into a SCAN-set file → exit 1,
//                  stdout NAMES the stray (the flipped Assertion 2 fails on ANY hit).
//   BACKPRESSURE : the flip is in effect but the rewire is incomplete (a surviving handoff ref) →
//                  RED vs the committed .js — the deletion change can never go green prematurely
//                  (the Phase-23 WR-05 atomic-flip discipline).
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane; this is a
// hermetic temp-dir test). Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, win32, posix } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-kit-refs.js");

// ── The scan set the mirror is built from — DERIVED from the gate, no longer copied ────────────
//
// WHAT USED TO BE HERE, AND WHY IT IS GONE. This file carried its own hand-written copy of the
// gate's scan-set array, kept in sync by remembering. Plan 29.1-17 added one member to the gate
// (`agent-factory/config`, finding R2-WR-05) and that copy would have been a member behind the set
// the gate walks — a mirror missing a directory the gate then judges, which is the set-literal
// drift class this round is closing elsewhere in the same commit. The copy is deleted rather than
// re-synced.
//
// WHAT THE DERIVATION BUYS THAT THE COPY COULD NOT: a member added to the gate's declaration enters
// this mirror in the SAME commit, with no edit here and nothing to remember.
//
// ITS RESIDUAL, STATED: this reads the gate's SOURCE TEXT. It is bounded at both ends and throws by
// name on either missing bound, and its member count is asserted below — but a change to the
// DECLARATION'S SHAPE (a renamed binding, a computed member, a member spelled with single quotes)
// would need this extractor updated. That failure is loud, not silent: the extractor throws or the
// cardinality assertion reds naming both numbers.
//
// ONE MEASURED NOTE FOR ANYONE GREPPING THIS FILE FOR A SECOND SCAN SET. `grep -c 'const SCAN'`
// here returns 1, not 0: the surviving hit is the LOCATOR STRING below, which must spell the gate's
// declaration verbatim to find it. It is not a second copy of the set, and splitting the literal to
// make a grep return zero is the move this repository has rejected twice (plan 29.1-11, deviation
// 3). The honest predicates are `grep -cE '^const SCAN = '` → 0 (this file declares no scan set of
// its own) and `grep -c '"agent-factory/checklists"'` → 0 (no member spelling survives here).
const GATE_TS = join(ROOT, "scripts", "check-kit-refs.ts");
const GATE_SCAN_DECL_OPEN = "const SCAN = [";
const GATE_SCAN_DECL_CLOSE = "\n];";
/** The member count measured against the gate's declaration in this session (plan 29.1-17). */
const GATE_SCAN_MEMBERS = 10;
/** Members the pre-existing cases in this file plant into; the derivation must still yield them. */
const GATE_SCAN_REQUIRED = [
  "agent-factory/roles",
  "agent-factory/workflows",
  ".claude/agents",
  "agent-factory/config",
];

/**
 * Read the members of the gate's own `SCAN` declaration.
 *
 * Bounded at BOTH ends — from the declaration to its closing bracket — following the right-bound
 * discipline `scopeSection()` in scripts/model-dial-consistency.test.ts records: a reader that runs
 * to end of file is not reading a declaration, it adopts every later array in the module. Either
 * bound missing THROWS by name rather than returning a partial list, because a short list builds a
 * mirror that is missing directories the gate then judges — and every green case here would pass
 * over the wrong tree.
 */
function gateScanSet(source: string = readFileSync(GATE_TS, "utf8")): string[] {
  const at = source.indexOf(GATE_SCAN_DECL_OPEN);
  if (at === -1) {
    throw new Error(
      `check-kit-refs mirror: ${GATE_TS} carries no "${GATE_SCAN_DECL_OPEN}" declaration — refusing to ` +
        "build a mirror from a scan set that could not be located",
    );
  }
  const rest = source.slice(at + GATE_SCAN_DECL_OPEN.length);
  const end = rest.indexOf(GATE_SCAN_DECL_CLOSE);
  if (end === -1) {
    throw new Error(
      `check-kit-refs mirror: the "${GATE_SCAN_DECL_OPEN}" declaration in ${GATE_TS} has no closing ` +
        "bracket — refusing to read to end of file, which would adopt every later array in the module",
    );
  }
  const members = [...rest.slice(0, end).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (members.length === 0) {
    throw new Error(
      `check-kit-refs mirror: the "${GATE_SCAN_DECL_OPEN}" declaration in ${GATE_TS} yielded no members ` +
        "— an empty mirror is green for every absence assertion in this file",
    );
  }
  return members;
}

const GATE_SCAN = gateScanSet();

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Build a hermetic CHECK_ROOT mirror by copying the real SCAN-set paths into a fresh temp dir.
// Because the real tree is already rewired to zero handoff refs (Wave 1 complete), the baseline
// mirror is clean — the GREEN case. Tests then plant a stray to drive RED.
function makeMirror(prefix: string): string {
  const mirror = freshTmp(prefix);
  for (const rel of GATE_SCAN) {
    const src = join(ROOT, rel);
    if (!existsSync(src)) continue; // mirror the gate's silent-skip-on-absent shape
    const dst = join(mirror, rel);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst, { recursive: true });
  }
  return mirror;
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

// Pick a real SCAN-set file in the mirror to plant a ref into (a role file always exists).
function aRoleFile(mirror: string): string {
  return join(mirror, "agent-factory", "roles", "orchestrator.md");
}

// ── The Assertion 1 exemption's fixtures (plan 29.1-17, finding R2-WR-05) ───────────────────────
/** The shipped config field reference in the mirror — the one file the exemption is scoped to. */
function configFieldReference(mirror: string): string {
  return join(mirror, "agent-factory", "config", "factory.config.md");
}
/** The kit-internal prefix D-08.1 forbids, and the sibling a legal self-reference names. */
const CONFIG_REF_NEEDLE = "agent-factory/config/";
const CONFIG_SIBLING = "agent-factory/config/factory.config.json";
/**
 * The number of LINES carrying the needle — one per line, however many times the line says it.
 * This is `grep -c`, and it is the unit the gate's HIT LIST is counted in.
 *
 * MEASURED, NOT ASSUMED (plan 29.1-17). `grepSubstring` emits one `path:lineno:line` hit per LINE,
 * so a line naming the kit-internal path twice is ONE hit. The field reference's line 138 does
 * exactly that, so the file carries THREE substring occurrences and TWO hits. A premise written in
 * substring occurrences would disagree with the gate's own cardinality for a reason a reader of the
 * red could not attribute.
 *
 * IT IS NO LONGER THE ONLY UNIT THE GATE COUNTS (plan 29.1-18). This docstring said "the unit the
 * gate counts" while the gate published that number as a count of MENTIONS — the knowledge of the
 * distinction was in this file and the claim was in the other one. Use `mentionsIn` below for the
 * mention unit; the two are asserted side by side so no premise can be written in one and checked
 * in the other again.
 */
function linesContaining(haystack: string, needle: string): number {
  return haystack.split("\n").filter((l) => l.includes(needle)).length;
}
/**
 * The number of MENTIONS of the needle — every occurrence, including a second one on a line that
 * already carries it. This is `grep -o … | wc -l` where `linesContaining` is `grep -c`.
 *
 * WHY BOTH EXIST (plan 29.1-18, finding R3-CR-01). The two units differ on this tree — three
 * mentions on two lines — and the gate used to count the LINE unit and publish it as the MENTION
 * unit. The consequence was a live bypass: the exemption predicate is asked once per line, so a
 * second mention appended to an already-exempt line was absorbed and no cardinality moved. A
 * premise written in one unit and asserted in the other is how that came to be declared, so the two
 * helpers now sit together and each names the unit it counts.
 */
function mentionsIn(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}
/**
 * Replace the FIRST kit-internal path the config field reference names with a different spelling of
 * one, leaving the MENTION count where it was — so the only thing that can move the verdict is what
 * the basename IS, not how many there are.
 */
function respellFirstNamedPath(file: string, spelling: string): void {
  const body = readFileSync(file, "utf8");
  const at = body.indexOf(CONFIG_SIBLING);
  if (at === -1) {
    throw new Error(
      `respellFirstNamedPath: ${file} names no ${CONFIG_SIBLING} — the case cannot swap a spelling ` +
        "it cannot find, and a plant appended instead would move the mention count as well",
    );
  }
  writeFileSync(file, body.replace(CONFIG_SIBLING, spelling), "utf8");
}
/** Create a subdirectory carrying one file under the mirror's configuration directory. */
function configSubdir(mirror: string, name: string, file: string): string {
  const dir = join(mirror, "agent-factory", "config", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, file), "planted for the depth case\n", "utf8");
  return `agent-factory/config/${name}/${file}`;
}
/**
 * Append text to the FIRST line of `file` that already carries `needle`, and return that line's
 * 1-based number. The line is found by SEARCHING for the needle rather than by a pinned line
 * number, so the case does not rot when the shipped document is edited.
 */
function plantOnExemptLine(file: string, needle: string, text: string): number {
  const lines = readFileSync(file, "utf8").split("\n");
  const at = lines.findIndex((l) => l.includes(needle));
  if (at === -1) {
    throw new Error(
      `plantOnExemptLine: no line of ${file} carries "${needle}" — there is no already-exempt line ` +
        "to append to, and a plant on a NEW line would be testing the shape the gate already caught",
    );
  }
  lines[at] = lines[at] + text;
  writeFileSync(file, lines.join("\n"), "utf8");
  return at + 1;
}

/**
 * The exemption's DERIVED denominator, as the gate itself reports it: the depth-1 regular files the
 * configuration directory carries on the tree under judgement. Reading the gate's published set
 * (rather than re-deriving it here) is the same discipline `reportedMarkerSites` below applies to
 * the marker sites — a second implementation of the rule is a second thing for the first to drift
 * away from, and this file's whole scan-set derivation exists because of that class.
 */
function reportedSiblingSet(stdout: string): { count: number; names: string[] } {
  const m = stdout.match(
    /exemption sibling set: (\d+) depth-1 regular file\(s\) in [^[]*\[([^\]]*)\]/,
  );
  if (!m) {
    throw new Error(
      "reportedSiblingSet: the gate published no sibling-set derivation line — refusing to assert a " +
        "membership premise against a denominator the gate never disclosed",
    );
  }
  return {
    count: Number(m[1]),
    names: m[2] === "" ? [] : m[2].split(", "),
  };
}
/** The sibling-set cardinality measured this session: .gitkeep, factory.config.json, factory.config.md. */
const CONFIG_SIBLING_FILES = 3;

// The derivation is asserted BEFORE any mirror is built, because every green case below is built on
// the set it returns: a derivation that silently returned fewer members would build a partial mirror
// that passes for the wrong reason. This is this repository's stated remedy for a derived set —
// assert its cardinality — applied to a derivation over source text.
describe("check-kit-refs mirror — the scan set is derived from the gate, not copied (plan 29.1-17)", () => {
  it("the mirror's scan set is DERIVED from the gate's own declaration, with its cardinality asserted", () => {
    expect(
      GATE_SCAN.length,
      "PREMISE: the derivation must be non-empty — an empty mirror is green for every absence assertion here",
    ).toBeGreaterThan(0);
    // The number, two-sided. Remove a member from the gate's declaration and this reds naming both.
    expect(GATE_SCAN).toHaveLength(GATE_SCAN_MEMBERS);
    // …and the members the pre-existing cases in this file plant into are actually among them, so a
    // derivation that returned the right COUNT of the wrong strings still reds.
    for (const required of GATE_SCAN_REQUIRED) {
      expect(GATE_SCAN, `the derived scan set must contain ${required}`).toContain(required);
    }
  });

  it("gateScanSet throws by NAME when the closing bracket is missing, rather than reading to end of file", () => {
    const source = readFileSync(GATE_TS, "utf8");
    const at = source.indexOf(GATE_SCAN_DECL_OPEN);
    expect(at, "PREMISE: the declaration must be locatable before its bound can be removed").toBeGreaterThan(-1);
    // Scratch copy in memory only — the committed gate source is never touched.
    const unbounded = source.slice(0, at + GATE_SCAN_DECL_OPEN.length) + '\n  "agent-factory/roles",\n';
    expect(() => gateScanSet(unbounded)).toThrow(/has no closing\s+bracket/);
    expect(() => gateScanSet("// a module with no scan declaration at all\n")).toThrow(
      /carries no ".*" declaration/,
    );
  });
});

describe("check-kit-refs Assertion 1 exemption — the config self-references, pinned on both sides", () => {
  it("Assertion 1 GREEN: the config field reference's self-references are exempt, and the verdict says so", () => {
    const mirror = makeMirror("ckr-cfg-green-");
    const ref = configFieldReference(mirror);
    expect(existsSync(ref), "PREMISE: the derived mirror must carry the config field reference").toBe(true);
    const greenBody = readFileSync(ref, "utf8");
    // BOTH units, before the gate is run. A premise pinned in ONE unit is exactly how the exemption
    // came to be declared in a unit it did not count (R3-CR-01) — this is the assertion that would
    // have caught it, so it is written in both.
    expect(
      mentionsIn(greenBody, CONFIG_REF_NEEDLE),
      "PREMISE: the reference must carry exactly the three MENTIONS the exemption is declared for",
    ).toBe(3);
    expect(
      linesContaining(greenBody, CONFIG_REF_NEEDLE),
      "PREMISE: …distributed over exactly the two LINES the gate's hit list is counted in",
    ).toBe(2);

    const r = runGate(mirror);
    expect(r.status).toBe(0);
    // Asserting only the exit code would pass over an exemption that silently swallowed everything.
    // The verdict must PUBLISH what it exempted and where.
    expect(r.stdout).toContain(
      "3 counted self-reference mention(s) on 2 line(s) exempt, in agent-factory/config/factory.config.md",
    );
    expect(r.stdout).toContain(
      "the config self-reference exemption is exactly 3 mention(s) on 2 line(s) in 1 file(s), as declared",
    );
  });

  it("Assertion 1 RED: a THIRD kit-internal mention in the config field reference fails, naming both counts", () => {
    const mirror = makeMirror("ckr-cfg-third-");
    const ref = configFieldReference(mirror);
    expect(
      linesContaining(readFileSync(ref, "utf8"), CONFIG_REF_NEEDLE),
      "PREMISE: the plant must take the mention count from two to three",
    ).toBe(2);
    appendFileSync(ref, `\nSee \`${CONFIG_SIBLING}\` for the bundled copy.\n`);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("exempt LINES: found 3, required exactly 2");
    // The same plant now moves TWO numbers rather than one: a new line is also a new mention.
    expect(r.stdout).toContain("exempt MENTIONS: found 4, required exactly 3");
    expect(r.stdout).toContain("a new mention must be argued and counted, never absorbed");
    // The LINE and MENTION counts moved and the FILE count did not — a third line in the SAME file.
    expect(r.stdout).not.toContain("exempting FILES:");
  });

  it("Assertion 1 GREEN: the verdict publishes mentions, lines and files — all three units it declares", () => {
    // The half of R3-CR-01 a reader could have caught without running anything: the gate published
    // ONE of the three numbers and called it the declaration, in a unit it did not count.
    const mirror = makeMirror("ckr-cfg-units-");
    const body = readFileSync(configFieldReference(mirror), "utf8");
    expect(
      mentionsIn(body, CONFIG_REF_NEEDLE),
      "PREMISE: this tree carries THREE mentions — grep -o, the unit the exemption claims",
    ).toBe(3);
    expect(
      linesContaining(body, CONFIG_REF_NEEDLE),
      "PREMISE: …distributed over TWO lines — grep -c, the unit the gate's hit list counts",
    ).toBe(2);

    const r = runGate(mirror);
    expect(r.status).toBe(0);
    // A green run must tell its reader what was exempted at the granularity the claim is made in.
    expect(r.stdout).toContain(
      "3 counted self-reference mention(s) on 2 line(s) exempt, in agent-factory/config/factory.config.md",
    );
    expect(r.stdout).toContain(
      "the config self-reference exemption is exactly 3 mention(s) on 2 line(s) in 1 file(s), as declared",
    );
  });

  it("Assertion 1 RED: a SECOND mention appended to an ALREADY-EXEMPT line fails, naming the mention count", () => {
    // THE R3-CR-01 BYPASS. Measured GREEN (exit 0, "exactly 2 hit(s) in 1 file(s), as declared")
    // against the committed scripts/check-kit-refs.js at ea76f9c, with the SAME sentence planted on
    // a NEW line failing exit 1 at that same commit. The predicate was asked once per LINE, so a
    // line that was already exempt absorbed unbounded further mentions unasked.
    const mirror = makeMirror("ckr-cfg-same-line-");
    const ref = configFieldReference(mirror);
    const before = readFileSync(ref, "utf8");
    expect(
      mentionsIn(before, CONFIG_REF_NEEDLE),
      "PREMISE: the tree under judgement carries the three declared mentions before the plant",
    ).toBe(3);

    const planted = plantOnExemptLine(
      ref,
      CONFIG_REF_NEEDLE,
      ` Also see \`${CONFIG_SIBLING}\` for the bundled copy.`,
    );
    const after = readFileSync(ref, "utf8");
    expect(planted, "PREMISE: the plant must land on a line that already carried a mention").toBeGreaterThan(0);
    expect(
      mentionsIn(after, CONFIG_REF_NEEDLE),
      "PREMISE: the plant must RAISE the mention count",
    ).toBe(4);
    expect(
      linesContaining(after, CONFIG_REF_NEEDLE),
      "PREMISE: …and must LEAVE THE LINE COUNT WHERE IT WAS — this is the shape the line unit cannot see",
    ).toBe(2);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("exempt MENTIONS: found 4, required exactly 3");
    expect(r.stdout).toContain("a new mention must be argued and counted, never absorbed");
    // ONLY the mention number moved. That is precisely why the pre-fix gate exited 0 here: the two
    // cardinalities it did assert are both still exactly as declared.
    expect(r.stdout).not.toContain("exempt LINES:");
    expect(r.stdout).not.toContain("exempting FILES:");
  });

  it("Assertion 1 RED (two-sided): DELETING a mention from an exempt line fails, naming the mention count", () => {
    // The mention cardinality is asserted in BOTH directions, so a future change that reinstates the
    // line-granularity answer reds whether it adds a mention or removes one.
    const mirror = makeMirror("ckr-cfg-mention-deleted-");
    const ref = configFieldReference(mirror);
    const lines = readFileSync(ref, "utf8").split("\n");
    const at = lines.findIndex((l) => mentionsIn(l, CONFIG_REF_NEEDLE) === 2);
    expect(
      at,
      "PREMISE: some line must carry TWO mentions — that line is why the two units differ at all",
    ).toBeGreaterThan(-1);
    // String.replace with a string replaces the FIRST occurrence only: one mention leaves, the line
    // itself stays exempt, so the LINE count cannot move and only the MENTION count can.
    lines[at] = lines[at].replace(CONFIG_REF_NEEDLE, ".grugops/");
    writeFileSync(ref, lines.join("\n"), "utf8");
    const after = readFileSync(ref, "utf8");
    expect(mentionsIn(after, CONFIG_REF_NEEDLE), "PREMISE: the mention count must FALL").toBe(2);
    expect(
      linesContaining(after, CONFIG_REF_NEEDLE),
      "PREMISE: …with the line count unmoved",
    ).toBe(2);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("exempt MENTIONS: found 2, required exactly 3");
    expect(r.stdout).not.toContain("exempt LINES:");
    expect(r.stdout).not.toContain("exempting FILES:");
  });

  it("Assertion 1 RED: a kit-internal mention in a SECOND file under the config directory fails", () => {
    const mirror = makeMirror("ckr-cfg-second-file-");
    const second = join(mirror, "agent-factory", "config", "NOTES.md");
    expect(existsSync(second), "PREMISE: the second file must not already exist in the mirror").toBe(false);
    expect(
      existsSync(join(mirror, "agent-factory", "config", "factory.config.json")),
      "PREMISE: the sibling the plant names must exist, so the plant is a SELF-reference and not a stray",
    ).toBe(true);
    writeFileSync(second, `The bundled copy lives at \`${CONFIG_SIBLING}\`.\n`, "utf8");

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // The exemption is scoped to ONE file, not to the directory — this is the clause that says so.
    expect(r.stdout).toContain("exempting FILES: found 2, required exactly 1");
    expect(r.stdout).toContain(join("agent-factory", "config", "NOTES.md"));
  });

  it("Assertion 1 RED: a kit-internal mention naming a path that does not exist is a stray, not a self-reference", () => {
    const mirror = makeMirror("ckr-cfg-ghost-");
    const ghost = "agent-factory/config/nowhere.json";
    expect(
      existsSync(join(mirror, "agent-factory", "config", "nowhere.json")),
      "PREMISE: the named path must NOT exist, or this would be a legal self-reference",
    ).toBe(false);
    appendFileSync(configFieldReference(mirror), `\nSee \`${ghost}\` for the bundled copy.\n`);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // Fails through the STRAY arm with the pre-existing wording — a self-reference means a reference
    // to something that is actually there, so this never reaches the cardinality clause.
    expect(r.stdout).toContain("stray agent-factory/config/ ref(s)");
    expect(r.stdout).toContain(ghost);
    expect(r.stdout).toContain(
      "the config self-reference exemption is exactly 3 mention(s) on 2 line(s) in 1 file(s), as declared",
    );
  });

  it("Assertion 1 RED: a parent-traversal basename is a stray, not a self-reference", () => {
    // THE R3-CR-02 BYPASS. Measured GREEN (exit 0, counted as exempt) against the committed
    // scripts/check-kit-refs.js at ea76f9c AND at 85a1179 — `CONFIG_NAMED_PATH` captures `..` and
    // `existsSync` is true for the parent directory, so a path that climbs two levels out of the
    // configuration directory and lands in install/ was certified as a reference inside it.
    const mirror = makeMirror("ckr-cfg-traversal-");
    const ref = configFieldReference(mirror);
    const spelling = "agent-factory/config/../../install/README.md";
    expect(
      existsSync(join(mirror, "agent-factory", "config", "..")),
      "PREMISE: the traversal target must EXIST — that existence is what the pre-fix probe accepted",
    ).toBe(true);
    respellFirstNamedPath(ref, spelling);
    expect(
      mentionsIn(readFileSync(ref, "utf8"), CONFIG_REF_NEEDLE),
      "PREMISE: the swap must leave the mention count at its declared value, so only the BASENAME can move the verdict",
    ).toBe(3);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("stray agent-factory/config/ ref(s)");
    expect(r.stdout).toContain(spelling);
  });

  it("Assertion 1 RED: a current-directory basename is a stray, not a self-reference", () => {
    // Measured GREEN against the committed .js at ea76f9c AND at 85a1179: `.` is pure `[._-]`, so
    // the capture class admitted it and the directory itself resolved.
    const mirror = makeMirror("ckr-cfg-curdir-");
    const ref = configFieldReference(mirror);
    const spelling = "agent-factory/config/./factory.config.json";
    respellFirstNamedPath(ref, spelling);
    expect(
      mentionsIn(readFileSync(ref, "utf8"), CONFIG_REF_NEEDLE),
      "PREMISE: the mention count is unchanged — the basename is the only thing under test",
    ).toBe(3);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("stray agent-factory/config/ ref(s)");
    expect(r.stdout).toContain(spelling);
  });

  it("Assertion 1 RED: a mention naming a path under a SUBDIRECTORY of the config directory is a stray", () => {
    // The depth residual the round-3 report filed as Info ("a future agent-factory/config/sub/ would
    // be wholesale exemptable"), closed by the same rule rather than deferred to when it first
    // matters. Measured GREEN against the committed .js at ea76f9c AND at 85a1179 with the same
    // subdirectory planted.
    const mirror = makeMirror("ckr-cfg-subdir-");
    const spelling = configSubdir(mirror, "sub", "thing.md");
    expect(
      existsSync(join(mirror, "agent-factory", "config", "sub", "thing.md")),
      "PREMISE: the planted path must EXIST, so the refusal is about DEPTH and not about absence",
    ).toBe(true);
    respellFirstNamedPath(configFieldReference(mirror), spelling);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // The captured basename is `sub`, a directory — not a member of a set that holds regular files.
    expect(r.stdout).toContain("stray agent-factory/config/ ref(s)");
    expect(r.stdout).toContain(spelling);
  });

  it("Assertion 1 sibling-set vacuity floor: a config directory carrying no regular file is a named finding", () => {
    // The membership test acquires a DENOMINATOR, and an empty one makes every mention a stray for a
    // reason having nothing to do with the mention. An empty denominator is named, not inferred.
    const mirror = makeMirror("ckr-cfg-no-siblings-");
    const dir = join(mirror, "agent-factory", "config");
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    expect(
      existsSync(dir),
      "PREMISE: the directory must be PRESENT — otherwise the absent-directory floor fires instead",
    ).toBe(true);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("carries no regular file at its top level");
    expect(r.stdout).toContain("refusing to adjudicate its exemption against an empty sibling set");
    // Distinct from the ABSENT-directory finding, which diagnoses a different fault.
    expect(r.stdout).not.toContain("no agent-factory/config/ directory found");
  });

  it("the sibling set is DERIVED from the tree under judgement, with its cardinality asserted", () => {
    // The membership rule acquired a DENOMINATOR, so the denominator gets the same treatment this
    // file already gives the derived scan set: non-empty, cardinality two-sided, and required to
    // contain the name the legal mentions actually use — so a derivation returning the right COUNT
    // of the wrong strings is still red.
    const mirror = makeMirror("ckr-cfg-siblings-");
    const before = runGate(mirror);
    expect(before.status).toBe(0);
    const set = reportedSiblingSet(before.stdout);
    expect(
      set.count,
      "PREMISE: the denominator must be non-empty — an empty set makes every mention a stray for a reason having nothing to do with the mention",
    ).toBeGreaterThan(0);
    expect(set.count).toBe(CONFIG_SIBLING_FILES);
    // The published NUMBER must describe the published LIST — a count derived apart from the set it
    // reports is the shape this plan exists to close.
    expect(set.names).toHaveLength(CONFIG_SIBLING_FILES);
    expect(set.names, "the derived set must carry the basename the exemption's legal mentions name").toContain(
      "factory.config.json",
    );

    // DISCRIMINATION: remove that regular file and the membership decision for a mention naming it
    // must change. A derivation that ignored the tree would keep exempting a name nothing carries.
    const target = join(mirror, "agent-factory", "config", "factory.config.json");
    rmSync(target);
    const removed = runGate(mirror);
    expect(removed.status).toBe(1);
    expect(reportedSiblingSet(removed.stdout).names).not.toContain("factory.config.json");
    expect(reportedSiblingSet(removed.stdout).count).toBe(CONFIG_SIBLING_FILES - 1);
    expect(removed.stdout).toContain("stray agent-factory/config/ ref(s)");

    // …and restoring it restores the decision, so the case is a property of the tree and not of the
    // order the assertions ran in. The live tree is never touched: this is the mirror throughout.
    cpSync(join(ROOT, "agent-factory", "config", "factory.config.json"), target);
    const restored = runGate(mirror);
    expect(restored.status).toBe(0);
    expect(reportedSiblingSet(restored.stdout).names).toContain("factory.config.json");
  });

  it("Assertion 1 RED: a kit-internal mention outside the config directory still fails as it always did", () => {
    const mirror = makeMirror("ckr-cfg-outside-");
    const target = aRoleFile(mirror);
    expect(
      target.includes(join("agent-factory", "config")),
      "PREMISE: the target must be OUTSIDE the configuration directory",
    ).toBe(false);
    appendFileSync(target, `\nEdit ${CONFIG_SIBLING} to configure.\n`);

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // The pre-existing wording, unchanged: widening the scan by one directory did not widen the
    // exemption for the rest of the scan set.
    expect(r.stdout).toContain("stray agent-factory/config/ ref(s) — config must be .grugops/factory.config.json");
    expect(r.stdout).toMatch(/agent-factory[\\/]roles[\\/]orchestrator\.md/);
  });

  it("Assertion 1 vacuity floor: a tree with no configuration directory is a named finding", () => {
    const mirror = makeMirror("ckr-cfg-vacuous-");
    const dir = join(mirror, "agent-factory", "config");
    expect(existsSync(dir), "PREMISE: the mirror must carry the directory before it is removed").toBe(true);
    rmSync(dir, { recursive: true, force: true });

    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // A NAMED finding, not an unattributable "found 0, required 1" cardinality disagreement.
    expect(r.stdout).toContain("no agent-factory/config/ directory found");
    expect(r.stdout).toContain("refusing to adjudicate its exemption");
  });
});

// ── Assertion 3's two compared sets, and the one spelling that must build both (WR-01) ──────────
//
// The defect this case pins is NOT reproducible on this platform: on POSIX the raw literal and the
// walk-shaped path are byte-identical, so the gate is green here either way. It is corroborated
// under `path.win32` semantics and by reading the gate, NOT executed on Windows — this repository
// has no `windows-latest` CI leg yet (CAP-02, Phase 33), and .planning/WINDOWS.md carries the row
// that says so. Stating that limit here is the point: a case that quietly implied it had run on
// Windows would be the wider-than-mechanism class this phase exists to close.
const PACKAGING_TEMPLATE_LITERAL = "agent-factory/packaging/subagent.frontmatter.md";
/** The two spellings the gate carried BEFORE the fix — asserted ABSENT, so reverting either reds. */
const WR01_DEFECT_SPELLINGS = ["ghLegal.add(PACKAGING_TEMPLATE)", "acc.push(rel)"];
/** …and the two the fix carries, asserted PRESENT. */
const WR01_FIXED_SPELLINGS = ["ghLegal.add(relKey(PACKAGING_TEMPLATE))", "acc.push(relKey(rel))"];

describe("check-kit-refs Assertion 3 — one path-spelling authority for both compared sets (WR-01)", () => {
  it("Assertion 3 (win32): every path entering either compared set is spelled by one authority", () => {
    // The walk-shaped path, built the way walk() builds it: compose the scan entry, then the entry.
    const walkShaped = win32.join(
      win32.join("agent-factory/packaging"),
      "subagent.frontmatter.md",
    );

    // DIRECTION 1 — THE NEGATIVE CONTROL, and the reason direction 2 means anything. Under win32
    // semantics the RAW literal and the walk-shaped path for the SAME file are NOT equal. A case
    // asserting only the fixed behaviour would pass just as happily on a tree where the defect never
    // existed, and would therefore be measuring nothing.
    expect(
      PACKAGING_TEMPLATE_LITERAL,
      "the raw literal and the walk-shaped path must DISAGREE under win32 — this is the defect",
    ).not.toBe(walkShaped);

    // DIRECTION 2 — the normalised literal and that same walk-shaped path ARE equal.
    expect(
      win32.join(PACKAGING_TEMPLATE_LITERAL),
      "…and passing the literal through the one authority must make them agree",
    ).toBe(walkShaped);

    // THE POSIX CONTROL: on this platform the authority is a no-op, which is why the gate's output
    // does not move and why the win32 half had to be reasoned rather than watched.
    expect(posix.join(PACKAGING_TEMPLATE_LITERAL)).toBe(PACKAGING_TEMPLATE_LITERAL);
    expect(posix.join(PACKAGING_TEMPLATE_LITERAL)).toBe(
      posix.join(posix.join("agent-factory/packaging"), "subagent.frontmatter.md"),
    );

    // …and the GATE actually routes both set-entry points through it. The subject of these greps is
    // the gate, never this file, so no declaration here can satisfy them. Both polarities are
    // asserted: the defect spellings ABSENT and the fixed spellings PRESENT, so reverting either
    // call site reds this case rather than only removing a string it never looked for.
    const source = readFileSync(GATE_TS, "utf8");
    for (const defect of WR01_DEFECT_SPELLINGS) {
      expect(
        source.split(defect).length - 1,
        `the gate must carry NO un-normalised set entry — found \`${defect}\``,
      ).toBe(0);
    }
    for (const fixed of WR01_FIXED_SPELLINGS) {
      expect(source, `the gate must spell its set entries through relKey — \`${fixed}\``).toContain(
        fixed,
      );
    }
  });
});

describe("check-kit-refs flipped gate — D-15 both-direction adversarial proof vs the committed .js", () => {
  it("GREEN: a clean rewired mirror (zero agent-factory/handoffs/ refs) → exit 0", () => {
    const mirror = makeMirror("ckr-green-");
    const r = runGate(mirror);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
  });

  it("RED: a planted agent-factory/handoffs/anything.md ref in a SCAN-set file → exit 1 naming the stray", () => {
    const mirror = makeMirror("ckr-red-");
    const target = aRoleFile(mirror);
    appendFileSync(
      target,
      "\nSee agent-factory/handoffs/anything.md for the old relay.\n",
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // The flipped Assertion 2 fails on ANY hit and names the stray file:line.
    expect(r.stdout).toContain("agent-factory/handoffs/anything.md");
    expect(r.stdout).toMatch(/agent-factory\/roles\/orchestrator\.md/);
  });

  it("RED: even a KNOWN former-template name (architecture-handoff.md) now fails — the ALLOW ERE is gone", () => {
    const mirror = makeMirror("ckr-red-known-");
    const target = aRoleFile(mirror);
    // Pre-flip this would have PASSED (it was on the 16-template allowlist); post-flip ANY ref fails.
    appendFileSync(
      target,
      "\nProduce agent-factory/handoffs/architecture-handoff.md.\n",
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("agent-factory/handoffs/architecture-handoff.md");
  });

  it("BACKPRESSURE: an incomplete rewire (a surviving handoff ref) → RED — the change cannot go green prematurely", () => {
    const mirror = makeMirror("ckr-backpressure-");
    // Simulate a workflow file that was NOT rewired to zero — a leftover relay ref survives.
    const wf = join(mirror, "agent-factory", "workflows", "04-ticket-to-pr.md");
    if (existsSync(wf)) {
      appendFileSync(wf, "\nReads agent-factory/handoffs/ticket-ready-packet.md.\n");
    } else {
      // Defensive: if the canonical workflow file moved, plant into a role file instead.
      appendFileSync(aRoleFile(mirror), "\nagent-factory/handoffs/ticket-ready-packet.md\n");
    }
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("agent-factory/handoffs/ticket-ready-packet.md");
  });

  it("GREEN→RED→GREEN round trip: planting then removing the stray flips exit 1 back to exit 0", () => {
    const mirror = makeMirror("ckr-roundtrip-");
    const target = aRoleFile(mirror);
    const original = readFileSync(target, "utf8");

    // GREEN baseline.
    expect(runGate(mirror).status).toBe(0);

    // Plant → RED.
    writeFileSync(target, original + "\nagent-factory/handoffs/qe-handoff.md\n", "utf8");
    expect(runGate(mirror).status).toBe(1);

    // Remove → GREEN again (the gate is a pure function of the SCAN-set contents).
    writeFileSync(target, original, "utf8");
    expect(runGate(mirror).status).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Phase 27 (KIT-02 / D-19) — the per-consumer derivation assertions for the three literals this
// gate used to carry. Each case proves the set follows the FILESYSTEM in a way no re-listed array
// could: it plants a file that did not exist when any literal could have been written, and requires
// the gate to see it. Revert a derivation to a literal and the matching case goes red.
//
// Every case asserts on the NAMED FILE in the output, never on the exit code alone — a gate that
// fails for the wrong reason is not a passing test.
// ---------------------------------------------------------------------------

// The invariant blockquote every adapter must carry (check-kit-refs.ts MARKER, byte-identical).
const MARKER = "If the kit dir is absent, STOP — do not hunt.";
// The resolver slot that makes an adapter a resolver, and therefore legally able to name the
// kit-root environment variable (check-kit-refs.ts RESOLVER_SLOT / install.ts MAT_SLOT).
const RESOLVER_SLOT =
  "# 1. (installed) the absolute kit path the installer wrote above this line.";
const KIT_ROOT_ENV_LINE = 'KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"';

// Write an extra adapter into the mirror's adapter directory and return its repo-relative path.
function plantAdapter(mirror: string, name: string, body: string): string {
  const rel = `.claude/agents/${name}.md`;
  mkdirSync(join(mirror, ".claude", "agents"), { recursive: true });
  writeFileSync(join(mirror, rel), body, "utf8");
  return rel;
}

// The number of marker sites the gate reports it compared. Reading the reported count (rather than
// a bare pass) is what makes a run over a shrunken or empty derived set visible.
function reportedMarkerSites(stdout: string): number {
  const m = stdout.match(/marker present at all (\d+) marker sites/);
  return m ? Number(m[1]) : -1;
}

describe("check-kit-refs derived sets — D-19 per-consumer assertions (KIT-02, Phase 27)", () => {
  // ── MARKER_SITES: derived from the adapter directories (D-27) ──────────────────────────────
  it("marker sites RED: a planted adapter without the invariant blockquote fails red naming it", () => {
    const mirror = makeMirror("ckr-marker-red-");
    const rel = plantAdapter(
      mirror,
      "grugops-marker-probe",
      "---\nname: grugops-marker-probe\n---\nNo invariant blockquote here on purpose.\n",
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // Named, with the failure word that means "file present, blockquote gone" — distinct from the
    // "(absent)" word, which means the file itself is missing. The two must never be merged.
    expect(r.stdout).toContain(`${rel}(marker-missing)`);
  });

  it("marker sites GREEN: a planted adapter WITH the blockquote passes and the reported count rises by one", () => {
    const mirror = makeMirror("ckr-marker-green-");
    const before = runGate(mirror);
    expect(before.status).toBe(0);
    const baseline = reportedMarkerSites(before.stdout);
    expect(baseline).toBeGreaterThan(0); // the gate reports what it compared, never a bare verdict

    plantAdapter(
      mirror,
      "grugops-marker-ok",
      `---\nname: grugops-marker-ok\n---\n> **Kit vs state invariant:** ${MARKER}\n\nPointer text only.\n`,
    );
    const after = runGate(mirror);
    expect(after.status).toBe(0);
    // A hand-listed MARKER_SITES array could never count a file written after it.
    expect(reportedMarkerSites(after.stdout)).toBe(baseline + 1);
  });

  it("marker sites vacuity floor: an empty adapter directory fails red rather than passing over nothing", () => {
    const mirror = makeMirror("ckr-marker-vacuous-");
    rmSync(join(mirror, ".claude", "agents"), { recursive: true, force: true });
    rmSync(join(mirror, ".claude", "skills"), { recursive: true, force: true });
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("no adapter files found");
  });

  it("derivation failure: ONE unreadable adapter directory fails red naming it, even though the other still populates the set", () => {
    // (Phase 27 / plan 27-11) The vacuity floor above only catches the case where BOTH directories
    // are gone. With the agent directory removed and the skills directory intact, the derived set is
    // still 7 files, the floor passes, and every derived assertion below runs over a set that lost
    // seventeen members — silently, under the pre-27-11 derivation, which returned [] on an
    // unreadable directory. The shared authority THROWS instead, and that throw is now its own
    // finding rather than being swallowed.
    const mirror = makeMirror("ckr-derivation-partial-");
    rmSync(join(mirror, ".claude", "agents"), { recursive: true, force: true });
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("adapter derivation failed");
    expect(r.stdout).toContain(join(".claude", "agents"));
    // The surviving half still derives, proving this is not merely the vacuity floor re-firing.
    expect(r.stdout).not.toContain("no adapter files found");
  });

  // ── Assertion 3: the derived legal set keyed on the resolver slot (D-07) ────────────────────
  it("Assertion 3 RED: a hand-written adapter naming the kit-root env var without a resolver slot fails red", () => {
    const mirror = makeMirror("ckr-gh-red-");
    // This is the hole the restatement closes. Under the old exclusion-by-omission form this file
    // passed simply by not being on a list of three named paths.
    const rel = plantAdapter(
      mirror,
      "grugops-rogue-resolver",
      `---\nname: grugops-rogue-resolver\n---\n> ${MARKER}\n\n${KIT_ROOT_ENV_LINE}\n`,
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("legal-set equality does not hold");
    expect(r.stdout).toContain(rel);
    expect(r.stdout).toContain("carries no resolver slot");
  });

  it("Assertion 3 GREEN: a resolver-slot adapter naming the env var passes — the legal set is derived, not fixed", () => {
    const mirror = makeMirror("ckr-gh-green-");
    plantAdapter(
      mirror,
      "grugops-second-resolver",
      `---\nname: grugops-second-resolver\n---\n> ${MARKER}\n\n\`\`\`sh\n${RESOLVER_SLOT}\n${KIT_ROOT_ENV_LINE}\n\`\`\`\n`,
    );
    const r = runGate(mirror);
    expect(r.status).toBe(0);
    // The legal set grew because a resolver appeared on disk — no edit to any array.
    expect(r.stdout).toMatch(/appears in exactly the \d+ derived legal site\(s\)/);
  });

  it("Assertion 3 two-sided: a resolver-slot adapter that LOST its self-heal line fails red too", () => {
    const mirror = makeMirror("ckr-gh-silent-");
    // A resolver that cannot name the kit-root variable cannot self-heal — it would hunt the repo.
    // The old negative-only predicate looked for the variable's PRESENCE and could never see this.
    const rel = plantAdapter(
      mirror,
      "grugops-mute-resolver",
      `---\nname: grugops-mute-resolver\n---\n> ${MARKER}\n\n\`\`\`sh\n${RESOLVER_SLOT}\n\`\`\`\n`,
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(rel);
    expect(r.stdout).toContain("carries the resolver slot but never names");
  });

  // ── SCAN reach: the directory entry reaches every adapter, not just the one once named ──────
  it("SCAN reach: a deleted-templates ref in a NON-orchestrator adapter fails Assertion 2 naming it", () => {
    const mirror = makeMirror("ckr-scan-reach-");
    const rel = plantAdapter(
      mirror,
      "grugops-scan-reach-probe",
      `---\nname: grugops-scan-reach-probe\n---\n> ${MARKER}\n\nSee agent-factory/handoffs/scan-reach-probe.md for the old relay.\n`,
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // Under the old single-file SCAN entry this adapter was not walked at all, so the stray ref was
    // invisible. Naming BOTH the file and the stray proves the directory entry genuinely reaches it.
    expect(r.stdout).toContain(rel);
    expect(r.stdout).toContain("agent-factory/handoffs/scan-reach-probe.md");
  });
});
