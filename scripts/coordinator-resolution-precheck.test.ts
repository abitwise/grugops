// coordinator-resolution-precheck.test.ts — behavioral oracle for the SPAWN-03 precheck.
//
// Drives the COMMITTED compiled artifact scripts/coordinator-resolution-precheck.js as a child
// process (never the .ts, and never an import — the module performs a scratch install at load, so
// importing it would run one) and asserts four contracts:
//
//   1. GREEN — a run against the real tree exits 0 and reports each observable precondition by name.
//   2. HONESTY — the output prints the two runtime steps as unperformed and contains NO wording a
//      reader could mistake for a pass of them. This is the load-bearing case: the failure this whole
//      plan exists to prevent is an unperformed observation being recorded as a passing one, and the
//      only mechanical defence is asserting the ABSENCE of the words that would let a skim conclude
//      it (threat T-27-73).
//   3. RED, both directions — a target missing its coordinator adapter, and a coordinator grant
//      naming an agent with no adapter file, each exit non-zero naming what failed (threat T-27-77).
//   4. NO LEFTOVERS — a default run leaves no temporary directory behind, proven by listing the
//      system temp directory for the script's own prefix before and after (threat T-27-75).
//
// Every plant lands in a copy of a scratch install, never in the committed tree. The RED cases use
// --inspect-target so they mutate a directory this file owns and perform no install of their own.
//
// Vitest globals:false → import explicitly.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PRECHECK_JS = join(ROOT, "scripts", "coordinator-resolution-precheck.js");

// Restated from the script under test rather than imported — see the header for why importing it is
// not an option. A drift between the two turns Case 6 into a no-op, so Case 6 also asserts that the
// script's own kept-target path carries this prefix.
const TMP_PREFIX = "grugops-coordinator-precheck-";

const PRECONDITIONS_HOLD = "PRECONDITIONS HOLD:";
const PRECONDITION_FAILED = "PRECONDITION FAILED:";

const ownedDirs: string[] = [];

function run(args: string[] = []): SpawnSyncReturns<string> {
  return spawnSync("node", [PRECHECK_JS, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 180_000,
  });
}

const tempEntries = (): string[] =>
  readdirSync(tmpdir()).filter((n) => n.startsWith(TMP_PREFIX));

// One kept scratch install, produced by the script itself, reused as the base for both RED plants.
let keptTarget = "";
let defaultRun: SpawnSyncReturns<string>;
let tempBefore: string[] = [];
let tempAfter: string[] = [];

beforeAll(() => {
  // The default run, bracketed by a temp-directory listing so Case 6 measures exactly this run.
  tempBefore = tempEntries();
  defaultRun = run();
  tempAfter = tempEntries();

  const kept = run(["--keep-scratch-target"]);
  const m = kept.stdout.match(/^scratch target kept at: (.+)$/m);
  const h = kept.stdout.match(/^scratch kit home kept at: (.+)$/m);
  if (m === null || h === null) {
    throw new Error(
      `the precheck did not print its kept scratch paths — cannot build the RED fixtures.\n${kept.stdout}\n${kept.stderr}`,
    );
  }
  keptTarget = m[1].trim();
  ownedDirs.push(keptTarget, h[1].trim());
}, 400_000);

afterAll(() => {
  for (const d of ownedDirs) rmSync(d, { recursive: true, force: true });
});

// A private copy of the kept scratch target, safe to mutate.
function copyOfTarget(): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-precheck-plant-"));
  ownedDirs.push(d);
  cpSync(keptTarget, d, { recursive: true });
  return d;
}

function coordinatorPath(target: string): string {
  return join(target, ".claude/agents", "grugops-orchestrator.md");
}

describe("coordinator resolution precheck (SPAWN-03 observable half)", () => {
  it("Case 1 (green): exits 0 and its closing line states the preconditions hold and the runtime steps were not performed", () => {
    expect(defaultRun.status).toBe(0);
    expect(defaultRun.stdout).toContain(PRECONDITIONS_HOLD);
    expect(defaultRun.stdout).toContain("NOT PERFORMED by this command");
    // The closing line is the one a reader skims. It must carry the open state itself.
    const lines = defaultRun.stdout.trimEnd().split("\n");
    const last = lines[lines.length - 1];
    expect(last).toContain(PRECONDITIONS_HOLD);
    expect(last).toContain("NOT PERFORMED");
    expect(last).toContain("unverified");
  });

  it("Case 2 (green): reports the six observable facts, each on its own line", () => {
    // The six the plan enumerates: the platform version state, the installed adapter count, the
    // coordinator agent name, the grant size, how many granted names resolve to a file, and the
    // materialized kit path.
    const labels = [
      /^platform version: .+$/m,
      /^installed adapter count: \d+ adapter\(s\)/m,
      /^coordinator agent name: \S+/m,
      /^coordinator grant size: \d+ enumerated name\(s\)\.$/m,
      /^granted names resolving to an installed adapter file: (\d+) of \1\.$/m,
      /^materialized kit path: \/.+$/m,
    ];
    for (const re of labels) expect(defaultRun.stdout).toMatch(re);
  });

  it("Case 3 (honesty): prints the human-only notice, both unperformed steps and every recording slot", () => {
    const out = defaultRun.stdout;
    expect(out).toContain("HUMAN-ONLY REMAINDER");
    expect(out).toContain("Step 1 — NOT PERFORMED by this command:");
    expect(out).toContain("Step 2 — NOT PERFORMED by this command:");
    expect(out).toContain("claude --agent grugops-orchestrator");
    // Every slot the recording surface carries must be printed, so a pasted block cannot be missing
    // a field the evidence file expects.
    for (const slot of [
      "platform version observed",
      "session startup header text observed (verbatim)",
      "did that header name the coordinator agent",
      "request made",
      "role agent that resolved and ran",
      "did the coordinator work the task inline instead",
      "date observed",
      "observed by",
      "same agent name at project scope and at user scope: which scope the runtime resolved",
      "no adapter matches the requested name: the exact error text emitted",
      "more than one role agent routed in one turn: the observed order, and whether it was stable",
    ]) {
      expect(out).toContain(`- ${slot}:`);
    }
    // The slots are printed EMPTY. A slot with a value after the colon would be a pre-filled
    // observation, which is the fabrication this apparatus exists to refuse.
    for (const line of out.split("\n")) {
      if (/^\s+- .+:/.test(line)) expect(line.trimEnd()).toMatch(/:$/);
    }
  });

  it("Case 4 (honesty, the load-bearing one): asserts nothing about the runtime half anywhere in its output", () => {
    // A pass-shaped word about the runtime half is the failure mode. These are asserted ABSENT over
    // the WHOLE output rather than over the last line, because a reader skims wherever their eye
    // lands. `unverified` is deliberately still allowed — \b does not match inside it.
    const forbidden = [
      /\bpass(ed|es)?\b/i,
      /\bverified\b/i,
      /\bconfirmed\b/i,
      /\bwas observed\b/i,
      /\bdid run\b/i,
      /\bresolved and ran\b(?!:)/i,
      /\bcomplete\b/i,
      /\bsuccess(ful|fully)?\b/i,
      /\bheader named\b/i,
    ];
    for (const re of forbidden) {
      expect(
        defaultRun.stdout,
        `the precheck output contains ${String(re)}, which a reader could take as a claim about the runtime half`,
      ).not.toMatch(re);
    }
  });

  it("Case 5 (RED): a target whose coordinator adapter is missing exits non-zero naming that precondition", () => {
    const target = copyOfTarget();
    rmSync(coordinatorPath(target));

    const r = run(["--inspect-target", target]);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain(PRECONDITION_FAILED);
    expect(r.stdout).toContain("coordinator: true");
    expect(r.stdout).toContain("no coordinator adapter");
    expect(r.stdout).not.toContain(PRECONDITIONS_HOLD);
  });

  it("Case 6 (RED): a granted name with no adapter file exits non-zero naming that agent", () => {
    const target = copyOfTarget();
    const path = coordinatorPath(target);
    const before = readFileSync(path, "utf8");
    // Guard against a silent no-op plant: the grant must actually be there to be widened.
    expect(before).toContain("tools: Agent(");
    writeFileSync(
      path,
      before.replace("tools: Agent(", "tools: Agent(grugops-no-such-role, "),
    );

    const r = run(["--inspect-target", target]);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain(PRECONDITION_FAILED);
    expect(r.stdout).toContain("grugops-no-such-role");
    expect(r.stdout).toContain("resolve to no installed adapter file");
    expect(r.stdout).not.toContain(PRECONDITIONS_HOLD);
  });

  it("Case 7 (no leftovers): a default run removes every temporary directory it created", () => {
    // Measured around the default run in beforeAll, so this is that run's own footprint and not a
    // second install's. Set difference, not a count: a concurrently running gate with a different
    // prefix cannot influence it, and the prefix is asserted live below.
    const added = tempAfter.filter((n) => !tempBefore.includes(n));
    expect(added).toEqual([]);
    // The prefix this case filters on is the one the script actually uses — otherwise the assertion
    // above would be vacuously true forever.
    expect(keptTarget.split("/").pop() ?? "").toContain(TMP_PREFIX);
  });
});
