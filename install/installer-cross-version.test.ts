// installer-cross-version.test.ts — uninstall reverses what the install ledger records, whatever kit
// source runs it (plan 33.1-38, review WR-01 and IN-06, D-33 (b), brief DC-2).
//
// WHAT WENT WRONG. Uninstall used to remove the names the uninstalling checkout's kit source ships. The
// review reproduced the result: a recorded adapter that checkout did not ship was left in place and named
// nowhere, while the marker that recorded it was deleted, exit 0. Another grugops version, or another
// checkout, cannot be assumed to ship what this install wrote.
//
// THE CLASS RULE TESTED HERE. Run uninstall with a kit source that holds none of what install wrote
// (UNINSTALL_SOURCE_VARIANTS: an empty directory, an unreadable source, another checkout after a --symlink
// install). Every file entry of the install's own ledger whose record still holds is removed and named on
// a `removed` line; a recorded file that was edited is left byte for byte and named; a grugops-shaped file
// install never recorded is left and named, with no verify. The set of recorded files and its size come
// from the installed marker's ledger (ledger.test-support.ts markerLedger, which parses the JSON itself and
// never calls the production reader), checked by this file's own record check, never typed by hand.
//
// Hermetic: every run is inside a scratch directory removed afterwards. It drives the COMMITTED
// install/install.js and install/uninstall.js (npm run build first).
//
// BUILD REQUESTS ACROSS VERSIONS (plan 45-05, BR-02). A second describe holds a board from before v3.1 to the
// current programs. The committed fixture install/fixtures/v3.0-blocked-board/ is the v3.0.0 seed's planning state
// with one blocked ticket; every case copies it to a scratch target. It must validate under the current validator and
// state-check with the verdict the v3.0.0 validator gave at authoring time, and the same tree carrying a build request,
// the new Blocked bullet and an `## Upstream` section must give the same verdict. The v3.0.0 state-check (read from the
// tag with `git show`, so those cases skip with a printed reason in a clone without the tag) is blind to the new folder
// but silent over it, and the deliberate skew run shows a mixed tools/grugops/ is reported by both state-check and
// `upstream.js check`.
//
// Clear professional voice: this is a safety surface (installer reversal).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, copyFileSync, cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildRequestText, validBuildRequestParts } from "../scripts/build-request-fixture.test-support.js";
import { BUILD_REQUESTS_REL, MEMORY_BANK_REL, TICKETS_REL } from "./state-layout.js";
import { SYNTHETIC_ENTRY, fixtureEnv, makeProduct, makeUpstream, syntheticFiles, treeDigest } from "../scripts/runnable-ref/upstream-fixture.test-support.js";
import { UNINSTALL_SOURCE_VARIANTS, runInstall, runUninstallWithSource, snapshotTree, type UninstallSourceVariantSpec } from "./installer-paths.test-support.js";
import { markerLedger, type RawEntry } from "./ledger.test-support.js";

// RECORDED_FILE_COUNT: the file entries a default install (copy or --symlink) into an empty git target
// records: 17 adapters under .claude/agents/, 7 skills under .claude/skills/, AGENTS.md, the 4 runnables
// under tools/grugops/, and the 3 files install creates there with no kit role: CLAUDE.md and
// .github/copilot-instructions.md (each holding only install's block) and, since plan 34-04 (2026-10-06,
// D-17), the Pi prompt template `.pi/prompts/grugops.md`. 31 -> 32 on that date; derived line:
// "empty-source: 32 file entr(ies) recorded, 32 holding". 32 -> 34 on 2026-10-11 (plan 34.1-01, D-08, D-11): install
// writes the whole-file host entry of each chosen agent, and this test chooses every agent (runInstall adds every
// agent flag through withAgentFlags), so `.agents/skills/grugops/SKILL.md` (Codex CLI's skill)
// and `.opencode/commands/grugops.md` (OpenCode's command) are recorded too; derived line "empty-source: 34 file
// entr(ies) recorded, 34 holding". 34 -> 35 on 2026-10-18 (quick task 261018-hs8, Task 1): install writes the launch
// agent of each chosen agent that has one (HostTool.launchAgent), so `.agents/agents/grugops-orchestrator.md` is
// recorded too. 35 -> 38 on 2026-10-18 (quick task 261018-hs8, Task 2): the launch agents of OpenCode, Copilot CLI and
// Pi (`.opencode/agents/grugops-orchestrator.md`, `.github/agents/grugops-orchestrator.agent.md`,
// `.pi/grugops-orchestrator.md`) are recorded too; Antigravity CLI's joined in Task 1, and Codex CLI has none. 38 -> 39 on
// 2026-10-18 (quick task 261018-hs8, Task 4, LICENSE-SHIP-01): install copies the root LICENSE to `tools/grugops/LICENSE`
// beside the runnables (a fifth RUNNABLES row), so it is recorded too. The test DERIVES the set from the ledger and
// asserts its size equals this pin, so a change to what install records shows here by name.
// The WHY corrected 2026-10-19 by quick task 261019-mq1 (261018-hs8 review IN-02): it said "the 6 files install
// created" and listed 9 (2 pointer files, 3 whole-file host entries, 4 launch files). It now states 9, calls the four
// "launch files" (Pi's is not an agent, review IN-05), and a test below checks that its stated parts sum to the pin.
// 39 -> 42 on 2026-10-22 (plan 37-13, SPLIT-05): install materializes the three state runnables
// `tools/grugops/state-check.js`, `tools/grugops/trace-render.js` and `tools/grugops/state-roll.js` (three more
// RUNNABLES rows) and records each, so the runnables part reads 7 (measured: the case printed 42).
// 42 -> 43 on 2026-10-27, plan 37-40 (D-21, G-37-2): install copies install/runnable-package.json to
// `tools/grugops/package.json` beside the programs (a ninth RUNNABLES row), so Node loads them as ES modules on a
// commonjs host, and records it (measured: the case printed 43).
// 43 -> 44 on 2026-10-29, plan 39-05 (TIER-01): the Tech Lead role renders one more Claude Code adapter,
// `.claude/agents/grugops-tech-lead.md`, which install records, so the adapters part reads 18 (measured: the case
// printed 44).
// 44 -> 45 on 2026-10-29, plan 39-06 (TIER-05): the Designer role renders one more Claude Code adapter,
// `.claude/agents/grugops-designer.md`, which install records, so the adapters part reads 19 (measured: the case
// printed 45).
// 45 -> 47 on 2026-10-29, plan 39-07 (TIER-02, D-13): software-engineer.md declares three levels, so install records
// `.claude/agents/grugops-software-engineer-junior.md`, `-mid.md` and `-senior.md` in place of the base engineer
// adapter, and the adapters part reads 21 (measured: the case printed 47).
// 47 -> 48 on 2026-11-04, plan 41-03 (RUN-05): install materializes the host queue tool `tools/grugops/claim.js` (one
// more RUNNABLES row) and records it, so the runnables part reads 8 (measured: the case printed 48).
// 48 -> 49 on 2026-11-05, plan 41-09 (RUN-05, D-35): install materializes the host note writer `tools/grugops/note.js`
// (one more RUNNABLES row) and records it, so the runnables part reads 9 (measured: the case printed 49, and the
// removal side, RECORDED_FILE_COUNT - 1, printed 48).
// 49 -> 50 on 2026-11-25, plan 44-03 (UP-02, D-08): install materializes the host upstream reader
// `tools/grugops/upstream.js` (one more RUNNABLES row) and records it, so the runnables part reads 10 (measured: the case
// printed 50, and the removal side, RECORDED_FILE_COUNT - 1, printed 49).
const RECORDED_FILE_COUNT = 50;
const RECORDED_FILE_COUNT_WHY =
  "21 adapters + 7 skills + AGENTS.md + 10 runnables + tools/grugops/LICENSE + tools/grugops/package.json + the 9 files install created (CLAUDE.md, .github/copilot-instructions.md, the 3 whole-file host entries .agents/skills/grugops/SKILL.md, .opencode/commands/grugops.md, .pi/prompts/grugops.md, and the 4 launch files .agents/agents/grugops-orchestrator.md, .opencode/agents/grugops-orchestrator.md, .github/agents/grugops-orchestrator.agent.md, .pi/grugops-orchestrator.md)";

let SCRATCH = "";
beforeAll(() => {
  SCRATCH = mkdtempSync(join(tmpdir(), "grugops-cross-version-"));
});
afterAll(() => {
  if (SCRATCH !== "") rmSync(SCRATCH, { recursive: true, force: true });
});

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The output lines that start with `verb` and name `rel` as their path. */
const linesFor = (stdout: string, verb: string, rel: string): string[] =>
  stdout.split("\n").filter((l) => new RegExp(`^\\s*${verb}\\s+${esc(rel)}(\\s|$)`).test(l));
const verifyLines = (stdout: string): string[] => stdout.split("\n").filter((l) => /^\s*verify\s/.test(l));
const isGone = (p: string): boolean => {
  try {
    lstatSync(p);
    return false;
  } catch {
    return true;
  }
};

/** This file's own check that `path` still holds a file entry's content record (sha256 + mode, or link). */
function holds(target: string, e: RawEntry): boolean {
  const p = join(target, ...e.path.split("/"));
  const content = String(e.content);
  let st;
  try {
    st = lstatSync(p);
  } catch {
    return false;
  }
  if (content.startsWith("link:")) return st.isSymbolicLink() && readlinkSync(p) === content.slice("link:".length);
  const m = /^sha256:([0-9a-f]{64})(?:;mode=([0-7]{4}))?$/.exec(content);
  if (m === null || !st.isFile()) return false;
  if (createHash("sha256").update(readFileSync(p)).digest("hex") !== m[1]) return false;
  return m[2] === undefined || (st.mode & 0o7777).toString(8).padStart(4, "0") === m[2];
}

interface Installed {
  readonly target: string;
  readonly grugopsHome: string;
  readonly home: string;
  /** The ledger's file entries, read from the marker before uninstall runs. */
  readonly files: readonly RawEntry[];
}

/** Install from this repository into a fresh, empty target under its own directory, and read the file entries. */
function installed(name: string, args: readonly string[]): Installed {
  const root = join(SCRATCH, name);
  const target = join(root, "target");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  const grugopsHome = join(home, ".grugops");
  const r = runInstall(target, grugopsHome, args, { home, timeoutMs: 180_000 });
  expect(r.status, `${name}: install exited ${r.status}\n${r.stdout}\n${r.stderr}`).toBe(0);
  const files = markerLedger(target).filter((e) => e.kind === "file");
  return { target, grugopsHome, home, files };
}

// Quick task 261019-mq1 (261018-hs8 review IN-02): the WHY's stated parts sum to the pin. Each ` + ` part counts as
// its leading integer (after an optional "the "), or 1 when it has none; the part that lists the files install created
// names, inside its parentheses, as many `.md` paths as its integer says. Pure: no install runs.
describe("RECORDED_FILE_COUNT_WHY states the pin's derivation (261019-mq1, review IN-02)", () => {
  it("its parts sum to RECORDED_FILE_COUNT, and the created-files part lists as many .md paths as it says", () => {
    const parts = RECORDED_FILE_COUNT_WHY.split(" + ");
    expect(parts.length, "premise: the WHY has parts").toBeGreaterThan(1);
    const countOf = (part: string): number => {
      const m = /^(?:the )?(\d+) /.exec(part);
      return m === null ? 1 : Number(m[1]);
    };
    expect(parts.reduce((a, p) => a + countOf(p), 0), RECORDED_FILE_COUNT_WHY).toBe(RECORDED_FILE_COUNT);
    const created = parts.filter((p) => p.includes("files install created ("));
    expect(created.length, "premise: one part lists the files install created").toBe(1);
    const inside = created[0].slice(created[0].indexOf("(") + 1, created[0].lastIndexOf(")"));
    const md = inside.match(/[^\s,()]+\.md(?=[\s,)]|$)/g) ?? [];
    expect(md.length, `the .md paths listed: ${md.join(" ")}`).toBe(countOf(created[0]));
  });
});

describe("uninstall walks the install ledger, whatever kit source runs it (plan 33.1-38, WR-01, IN-06)", () => {
  it("the uninstall-source variants are the three named, each with a reason", () => {
    expect(UNINSTALL_SOURCE_VARIANTS.map((v) => v.name)).toEqual(["empty-source", "unreadable-source", "other-checkout-symlink"]);
    for (const v of UNINSTALL_SOURCE_VARIANTS) expect(v.why.trim().length, v.name).toBeGreaterThan(0);
  });

  for (const spec of UNINSTALL_SOURCE_VARIANTS) {
    it(`${spec.name}: every recorded file that holds its record is removed and named, counted from the ledger`, () => {
      const inst = installed(spec.name, spec.installArgs);
      const holding = inst.files.filter((e) => holds(inst.target, e));
      console.log(
        `installer-cross-version: ${spec.name}: ${inst.files.length} file entr(ies) recorded, ${holding.length} holding; ` +
          `RECORDED_FILE_COUNT = ${RECORDED_FILE_COUNT} (${RECORDED_FILE_COUNT_WHY})`,
      );
      expect(inst.files.length, "the file entries the install ledger holds").toBe(RECORDED_FILE_COUNT);
      expect(holding.map((e) => e.path), "every recorded file holds its record right after install").toEqual(inst.files.map((e) => e.path));
      if (spec.name === "other-checkout-symlink") {
        expect(inst.files.some((e) => String(e.content).startsWith("link:")), "the --symlink install recorded no link").toBe(true);
      }
      const src = (spec as UninstallSourceVariantSpec).source(join(SCRATCH, spec.name, "src"));
      const u = runUninstallWithSource(inst.target, inst.grugopsHome, src, { home: inst.home, timeoutMs: 180_000 });
      expect(u.status, `${spec.name}: uninstall exited ${u.status}\n${u.stdout}\n${u.stderr}`).toBe(0);
      expect(verifyLines(u.stdout), u.stdout).toEqual([]);
      expect(u.stdout).toContain("== uninstall complete ==");
      const problems: string[] = [];
      for (const e of holding) {
        if (!isGone(join(inst.target, ...e.path.split("/")))) problems.push(`${e.path}: still present`);
        if (linesFor(u.stdout, "removed", e.path).length === 0) problems.push(`${e.path}: no removed line`);
      }
      expect(problems, `${problems.join("\n")}\n${u.stdout}`).toEqual([]);
    }, 400_000);
  }

  it("empty-source, DRY_RUN: every recorded file is named on a would-remove line, and nothing changes", () => {
    const inst = installed("dry-run", []);
    expect(inst.files.length).toBe(RECORDED_FILE_COUNT);
    const src = UNINSTALL_SOURCE_VARIANTS[0].source(join(SCRATCH, "dry-run", "src"));
    const before = snapshotTree(inst.target);
    const u = runUninstallWithSource(inst.target, inst.grugopsHome, src, { home: inst.home, dryRun: true, timeoutMs: 180_000 });
    expect(u.status, u.stdout).toBe(0);
    expect(snapshotTree(inst.target), "DRY_RUN changed the target").toBe(before);
    const unnamed = inst.files.filter((e) => linesFor(u.stdout, "would-remove", e.path).length === 0).map((e) => e.path);
    expect(unnamed, u.stdout).toEqual([]);
  }, 400_000);

  it("empty-source: one recorded adapter edited by one byte is left byte for byte and named; every other recorded file is removed", () => {
    const inst = installed("edited", []);
    const adapter = inst.files.find((e) => e.path.startsWith(".claude/agents/") && e.kit === true);
    expect(adapter, "no recorded adapter in the ledger").toBeDefined();
    const p = join(inst.target, ...adapter!.path.split("/"));
    appendFileSync(p, "x");
    const edited = readFileSync(p);
    const src = UNINSTALL_SOURCE_VARIANTS[0].source(join(SCRATCH, "edited", "src"));
    const u = runUninstallWithSource(inst.target, inst.grugopsHome, src, { home: inst.home, timeoutMs: 180_000 });
    expect(readFileSync(p).equals(edited), "the edited adapter did not survive byte for byte").toBe(true);
    const left = linesFor(u.stdout, "left", adapter!.path);
    expect(left.length, u.stdout).toBe(1);
    expect(left[0]).toMatch(/does not hold what the install ledger records install wrote there/);
    const others = inst.files.filter((e) => e.path !== adapter!.path);
    expect(others.length).toBe(RECORDED_FILE_COUNT - 1);
    const kept = others.filter((e) => !isGone(join(inst.target, ...e.path.split("/")))).map((e) => e.path);
    expect(kept, u.stdout).toEqual([]);
  }, 400_000);

  it("a grugops-shaped file install never recorded is left and named, with no verify", () => {
    const inst = installed("unrecorded", []);
    const rel = ".claude/agents/grugops-mine.md";
    expect(inst.files.some((e) => e.path === rel), `${rel} is in the ledger`).toBe(false);
    const mine = "my own agent, never installed\n";
    writeFileSync(join(inst.target, ...rel.split("/")), mine);
    const src = UNINSTALL_SOURCE_VARIANTS[0].source(join(SCRATCH, "unrecorded", "src"));
    const u = runUninstallWithSource(inst.target, inst.grugopsHome, src, { home: inst.home, timeoutMs: 180_000 });
    expect(readFileSync(join(inst.target, ...rel.split("/")), "utf8")).toBe(mine);
    const left = linesFor(u.stdout, "left", rel);
    expect(left.length, u.stdout).toBe(1);
    expect(left[0]).toMatch(/install has no record of writing it/);
    expect(verifyLines(u.stdout).filter((l) => l.includes(rel)), u.stdout).toEqual([]);
    expect(u.status, u.stdout).toBe(0);
  }, 400_000);
});

// ── a board from before v3.1 under the current programs (plan 45-05, BR-02) ─────────────────────────────────────────
describe("build requests across versions (plan 45-05, BR-02)", () => {
  const REPO_ROOT = resolve(import.meta.dirname, "..");
  const FIXTURE = join(import.meta.dirname, "fixtures", "v3.0-blocked-board");
  const VALIDATOR_JS = join(REPO_ROOT, "scripts", "validate-agent-factory.js");
  const RUNNABLES = join(REPO_ROOT, "scripts", "runnable-ref");
  const TICKET_REL = `${TICKETS_REL}/ABC-1.md`;
  const BR_REL = `${BUILD_REQUESTS_REL}/BR-1.md`;
  const OLD_BULLET = "- 2026-11-20, raised by Software Engineer: waiting on ADR-0007 (owner: Architect/Design)";
  const NEW_BULLET = "- 2026-11-20, raised by BA/PM: waiting on build request BR-1 (owner: human carrier)";
  // MEASURED 2026-11-26 (plan 45-05) with the v3.0.0 validator (`git archive v3.0.0`, run with VALIDATE_ROOT at a copy of
  // the fixture and VALIDATE_KIT_ROOT at the archive): exit 0, `ALL CHECKS PASSED`, and these ERROR and WARNING lines.
  // A literal, so case (a) needs no tag.
  const V300_VALIDATOR_LINES = ['  WARNING  memory-bank/plans/tickets/ABC-1.md: no traceability row for ticket "ABC-1"'];
  const TAG_PRESENT = spawnSync("git", ["rev-parse", "-q", "--verify", "refs/tags/v3.0.0"], { cwd: REPO_ROOT, encoding: "utf8" }).status === 0;
  const TAG_SKIP_REASON =
    "SKIPPED (plan 45-05): tag v3.0.0 is absent from this clone, so the v3.0.0 state-check.js cannot be read with git show";

  let seq = 0;
  /** A scratch target holding a copy of the fixture's memory-bank/ (the fixture itself is never written). */
  function v30Tree(): string {
    const target = join(SCRATCH, `br-${++seq}`, "target");
    mkdirSync(target, { recursive: true });
    cpSync(join(FIXTURE, MEMORY_BANK_REL), join(target, MEMORY_BANK_REL), { recursive: true });
    return target;
  }
  /** The (a) tree turned into the 3.1 tree: a valid BR-1.md, the build-request bullet, and an `## Upstream` section. */
  function v31Tree(): string {
    const target = v30Tree();
    const parts = validBuildRequestParts("open");
    const br = buildRequestText({
      ...parts,
      id: "BR-1",
      raised: "2026-11-20",
      title: "# BR-1: Which store owns the session token",
      blocks: ["- ABC-1"],
      history: ["- 2026-11-20: open, by BA/PM"],
    });
    mkdirSync(join(target, ...BUILD_REQUESTS_REL.split("/")), { recursive: true });
    writeFileSync(join(target, ...BR_REL.split("/")), br);
    const ticketPath = join(target, ...TICKET_REL.split("/"));
    const ticket = readFileSync(ticketPath, "utf8");
    expect(ticket.split(OLD_BULLET).length, "PREMISE: the fixture ticket holds the v3.0 bullet once").toBe(2);
    expect(ticket, "PREMISE: the fixture ticket has no ## Upstream section").not.toContain("## Upstream");
    writeFileSync(ticketPath, ticket.replace(OLD_BULLET, NEW_BULLET).replace("## Blocked\n", "## Upstream\n\nnone (build-internal)\n\n## Blocked\n"));
    return target;
  }

  interface Ran {
    readonly status: number | null;
    readonly stdout: string;
    readonly stderr: string;
  }
  const all = (r: Ran): string => `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
  function validate(target: string): Ran {
    const r = spawnSync(process.execPath, [VALIDATOR_JS], {
      encoding: "utf8",
      cwd: target,
      env: { ...process.env, VALIDATE_ROOT: target, VALIDATE_KIT_ROOT: REPO_ROOT },
      timeout: 120_000,
    });
    expect(r.error).toBeUndefined();
    return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
  }
  function stateCheck(js: string, target: string): Ran {
    const r = spawnSync(process.execPath, [js, target], { encoding: "utf8", cwd: target, timeout: 60_000 });
    expect(r.error).toBeUndefined();
    return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
  }
  /** The validator's ERROR and WARNING lines, which it prints on stderr, then any on stdout. */
  const verdictLines = (r: Ran): string[] => `${r.stderr}\n${r.stdout}`.split("\n").filter((l) => /^\s+(ERROR|WARNING)\s/.test(l));
  const findingLines = (out: string): string[] => out.split("\n").filter((l) => /^(FINDING|WARN|LAYOUT) /.test(l));
  const lastLine = (out: string): string | undefined => out.trimEnd().split("\n").at(-1);

  /** The v3.0.0 state-check.js written into `<dir>/tools/grugops/` with the module package.json; returns its path. */
  function oldStateCheckIn(dir: string): string {
    const old = spawnSync("git", ["show", "v3.0.0:scripts/runnable-ref/state-check.js"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    expect(old.status, old.stderr).toBe(0);
    const tools = join(dir, "tools", "grugops");
    mkdirSync(tools, { recursive: true });
    writeFileSync(join(tools, "package.json"), '{"type":"module"}\n');
    writeFileSync(join(tools, "state-check.js"), old.stdout);
    return join(tools, "state-check.js");
  }

  it("(a) the v3.0 board validates under the current validator and state-check with the v3.0.0 validator's verdict", () => {
    const target = v30Tree();
    const v = validate(target);
    expect(v.status, all(v)).toBe(0);
    expect(lastLine(v.stdout), all(v)).toBe("ALL CHECKS PASSED");
    expect(verdictLines(v), all(v)).toEqual(V300_VALIDATOR_LINES);
    const c = stateCheck(join(RUNNABLES, "state-check.js"), target);
    expect(c.status, all(c)).toBe(0);
    expect(findingLines(c.stdout), all(c)).toEqual([]);
    expect(lastLine(c.stdout), all(c)).toBe("No findings.");
  });

  it("(b) the 3.1 tree (a build request, the new Blocked bullet, an ## Upstream section) gives the same verdict and the same state findings as (a)", () => {
    const before = { v: validate(v30Tree()), c: stateCheck(join(RUNNABLES, "state-check.js"), v30Tree()) };
    const target = v31Tree();
    expect(readFileSync(join(target, ...TICKET_REL.split("/")), "utf8")).toContain(NEW_BULLET);
    const v = validate(target);
    expect(v.status, all(v)).toBe(before.v.status);
    expect(lastLine(v.stdout), all(v)).toBe(lastLine(before.v.stdout));
    expect(verdictLines(v), all(v)).toEqual(verdictLines(before.v));
    const c = stateCheck(join(RUNNABLES, "state-check.js"), target);
    expect(c.status, all(c)).toBe(before.c.status);
    expect(findingLines(c.stdout), all(c)).toEqual(findingLines(before.c.stdout));
    expect(lastLine(c.stdout), all(c)).toBe("No findings.");
  });

  it("(c) the v3.0.0 state-check prints `No findings.` and exits 0 over the v3.0 tree and over the 3.1 tree", (ctx) => {
    if (!TAG_PRESENT) {
      console.warn(`${TAG_SKIP_REASON}; case (c) did not run`);
      ctx.skip();
      return;
    }
    const oldJs = oldStateCheckIn(join(SCRATCH, `br-${++seq}`, "old"));
    for (const target of [v30Tree(), v31Tree()]) {
      const r = stateCheck(oldJs, target);
      expect(r.status, all(r)).toBe(0);
      expect(findingLines(r.stdout), all(r)).toEqual([]);
      expect(lastLine(r.stdout), all(r)).toBe("No findings.");
    }
  });

  it("(d) the deliberate skew run: the v3.0.0 state-check beside the current siblings reports runnable-version-skew and exits 1, and the current upstream.js check names state-check.js", (ctx) => {
    if (!TAG_PRESENT) {
      console.warn(`${TAG_SKIP_REASON}; case (d) did not run`);
      ctx.skip();
      return;
    }
    const base = join(SCRATCH, `br-${++seq}`);
    const oldJs = oldStateCheckIn(base);
    const tools = join(base, "tools", "grugops");
    for (const name of ["note.js", "claim.js", "trace-render.js", "state-roll.js", "upstream.js"]) {
      copyFileSync(join(RUNNABLES, name), join(tools, name));
    }
    const target = v30Tree();
    const skewed = stateCheck(oldJs, target);
    expect(skewed.status, all(skewed)).toBe(1);
    const skewFindings = findingLines(skewed.stdout).filter((l) => l.endsWith("(runnable-version-skew)"));
    expect(skewFindings.length, all(skewed)).toBeGreaterThan(0);
    // A product declaring one synthetic source, run with the upstream.js in the same mixed directory.
    const env = fixtureEnv(join(base, "home"));
    const design = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const product = makeProduct(join(base, "product"), {
      upstream: {
        sources: [
          {
            id: "design",
            path: "../design",
            commit: design.commit,
            entry: SYNTHETIC_ENTRY,
            entry_blob: design.blobOf(SYNTHETIC_ENTRY),
            owns: { areas: ["product"], prefixes: ["DEC", "Q"] },
          },
        ],
      },
    });
    const u = spawnSync(process.execPath, [join(tools, "upstream.js"), "check"], { encoding: "utf8", cwd: product, env, timeout: 60_000 });
    expect(u.error).toBeUndefined();
    const ran: Ran = { status: u.status, stdout: u.stdout ?? "", stderr: u.stderr ?? "" };
    expect(ran.stderr, all(ran)).toBe("");
    expect(ran.stdout.split("\n")[0], all(ran)).toBe(`match design ${design.commit}`);
    expect(ran.stdout.split("\n").filter((l) => l.startsWith("runnable-version-skew state-check.js:")), all(ran)).toHaveLength(1);
    // A skew line never moves upstream.js check's exit code.
    expect(ran.status, all(ran)).toBe(0);
  });

  it("[EDGE BR-02/concurrency] state-check and upstream.js requests run at the same time over one tree leave its digest unchanged", async () => {
    const target = v31Tree();
    mkdirSync(join(target, ".grugops"), { recursive: true });
    const before = treeDigest(target);
    const runAsync = (args: readonly string[]): Promise<Ran> =>
      new Promise((done, fail) => {
        const child = spawn(process.execPath, [...args], { cwd: target });
        let stdout = "";
        let stderr = "";
        child.stdout.setEncoding("utf8").on("data", (d: string) => (stdout += d));
        child.stderr.setEncoding("utf8").on("data", (d: string) => (stderr += d));
        const timer = setTimeout(() => child.kill("SIGKILL"), 60_000);
        child.on("error", fail);
        child.on("close", (status) => {
          clearTimeout(timer);
          done({ status, stdout, stderr });
        });
      });
    const [c, r] = await Promise.all([
      runAsync([join(RUNNABLES, "state-check.js"), target]),
      runAsync([join(RUNNABLES, "upstream.js"), "requests", "--root", target]),
    ]);
    // state-check: exit 0, no finding. requests: one carry line for the open request, so its documented exit 1.
    expect(c.status, all(c)).toBe(0);
    expect(lastLine(c.stdout), all(c)).toBe("No findings.");
    expect(r.stderr, all(r)).toBe("");
    expect(r.stdout, all(r)).toBe("carry BR-1 design: open since 2026-11-20\n");
    expect(r.status, all(r)).toBe(1);
    expect(treeDigest(target), "no byte of the tree changed").toBe(before);
  }, 120_000);
});
