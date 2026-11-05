// claim.test.ts — the host queue tool (phase 41, plan 41-03, RUN-01, RUN-05, D-01, D-02, D-08, D-13).
//
// Every case runs the COMMITTED claim.js copied ALONE into an empty temporary directory beside only a package.json,
// with no node_modules and no sibling script reachable: the host emulation that proves the file imports `node:`
// builtins only. Every repository it acts on is an mkdtempSync directory built from the imported state-layout
// constants, never this repository's own tree. The rules themselves are unit cases in scripts/claim.test.ts; these
// cases prove the same rules run on a host, through the CLI contract of plan 41-03.
//
//   exit 0 → the command did its work; stdout holds its one line
//   exit 1 → an outcome to act on: `lost TASK`, `not-done TASK: ...`
//   exit 2 → could not run or refused, with nothing on stdout and one `Error: ` line on stderr

import { describe, it, expect, afterAll } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { skipLine, stageNameOrSkip, stageShapeOrSkip, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import * as ctxio from "../context-io.js";
import { treeDigest } from "../fault-inject.test-support.js";
import {
  CONTEXT_REL,
  GRUGOPS_DIR_REL,
  QUEUE_CLAIMED_REL,
  QUEUE_DONE_REL,
  QUEUE_PENDING_REL,
  QUEUE_REL,
} from "../../install/state-layout.js";

const CLAIM_JS = join(import.meta.dirname, "claim.js");
const NOW_RUNNING_REL = `${QUEUE_REL}/now-running.md`;

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/** The committed .js, copied alone into an empty directory beside only a package.json. */
function hostCopy(): string {
  const host = mkTmp("grugops-claim-host-");
  const js = join(host, "claim.js");
  copyFileSync(CLAIM_JS, js);
  writeFileSync(join(host, "package.json"), '{"type":"module"}\n');
  return js;
}

const HOST_JS = hostCopy();

interface Ran {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** The host copy run with its working directory in `cwd`. */
function run(cwd: string, ...args: string[]): Ran {
  const r = spawnSync(process.execPath, [HOST_JS, ...args], { encoding: "utf8", cwd, timeout: 15_000 });
  expect(r.error, "the program did not finish in bounded time").toBeUndefined();
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** The host copy started without waiting, so two can run at once. */
function runAsync(cwd: string, ...args: string[]): Promise<Ran> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [HOST_JS, ...args], { cwd });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString("utf8")));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString("utf8")));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

/** A repository with a `.grugops/` directory and no queue. */
function bareRepo(): string {
  const root = mkTmp("grugops-claim-repo-");
  mkdirSync(join(root, GRUGOPS_DIR_REL));
  return root;
}

/** A repository whose pending stage holds each of `tasks`. */
function repo(...tasks: string[]): string {
  const root = bareRepo();
  mkdirSync(join(root, QUEUE_PENDING_REL), { recursive: true });
  for (const task of tasks) writeFileSync(join(root, QUEUE_PENDING_REL, `${task}.md`), subtask(task));
  return root;
}

function subtask(task: string): string {
  return `# subtask ${task}\nref: .grugops/context/${task}/\n`;
}

/** The rows of the rendered table under its header, one string per row. */
function rows(root: string): string[] {
  const lines = readFileSync(join(root, NOW_RUNNING_REL), "utf8").split("\n");
  const header = lines.indexOf("| --- | --- | --- | --- | --- |");
  expect(header, "PREMISE: the render holds its table").toBeGreaterThan(0);
  return lines.slice(header + 1).filter((l) => l !== "");
}

/** The exit-2 shape: exit 2, an empty stdout, one line on stderr that starts `Error: `. */
function expectRefused(r: Ran, ...phrases: string[]): void {
  const all = `status ${String(r.status)}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
  expect(r.status, all).toBe(2);
  expect(r.stdout, all).toBe("");
  expect(r.stderr.startsWith("Error: "), all).toBe(true);
  expect(r.stderr.endsWith("\n"), all).toBe(true);
  expect(r.stderr.trimEnd().split("\n"), all).toHaveLength(1);
  for (const phrase of phrases) expect(r.stderr, all).toContain(phrase);
}

describe("claim TASK --by ADAPTER (RUN-05, D-01, D-02, D-08)", () => {
  it("claims a pending subtask, prints one line, exits 0 and renders the row", () => {
    const root = repo("t1");
    const r = run(root, "claim", "t1", "--by", "grugops-qe-e2e");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe("claimed t1 by grugops-qe-e2e\n");
    expect(r.status).toBe(0);
    expect(existsSync(join(root, QUEUE_PENDING_REL, "t1.md"))).toBe(false);
    expect(readFileSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"), "utf8")).toBe(subtask("t1"));
    const claim = readFileSync(join(root, QUEUE_CLAIMED_REL, "t1", "claim.md"), "utf8");
    expect(claim).toContain("by: grugops-qe-e2e\n");
    expect(claim).toContain("agent: grugops-qe-e2e\n");
    const [row, ...rest] = rows(root);
    expect(rest).toEqual([]);
    expect(row).toContain("| t1 | grugops-qe-e2e | grugops-qe-e2e |");
  });

  it("records --level in the claim and shows it in the render (D-03)", () => {
    const root = repo("t1");
    const r = run(root, "claim", "t1", "--by", "grugops-software-engineer-mid", "--level", "mid");
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(root, QUEUE_CLAIMED_REL, "t1", "claim.md"), "utf8")).toContain("level: mid\n");
    expect(rows(root)[0]).toContain("| mid |");
  });

  it("creates the stage directories the installer does not seed", () => {
    const root = repo("t1");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL))).toBe(false);
    expect(run(root, "claim", "t1", "--by", "grugops-qe-e2e").status).toBe(0);
    expect(lstatSync(join(root, QUEUE_CLAIMED_REL)).isDirectory()).toBe(true);
    expect(lstatSync(join(root, QUEUE_DONE_REL)).isDirectory()).toBe(true);
  });

  it("a second claim prints `lost t1`, exits 1 and leaves claim.md unchanged", () => {
    const root = repo("t1");
    expect(run(root, "claim", "t1", "--by", "grugops-qe-e2e").status).toBe(0);
    const record = join(root, QUEUE_CLAIMED_REL, "t1", "claim.md");
    const before = readFileSync(record, "utf8");
    const render = readFileSync(join(root, NOW_RUNNING_REL), "utf8");
    const r = run(root, "claim", "t1", "--by", "grugops-security");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe("lost t1\n");
    expect(r.status).toBe(1);
    expect(readFileSync(record, "utf8")).toBe(before);
    expect(readFileSync(join(root, NOW_RUNNING_REL), "utf8")).toBe(render);
  });

  // Plan 41-01 owns the order inside claimPending; this proves it across processes: a lost race reads as
  // `lost`, never as a missing subtask.
  it("two claims started together on one task give exactly one winner and one `lost`", async () => {
    for (let round = 0; round < 6; round += 1) {
      const root = repo("t1");
      const both = await Promise.all([
        runAsync(root, "claim", "t1", "--by", "grugops-qe-e2e"),
        runAsync(root, "claim", "t1", "--by", "grugops-security"),
      ]);
      const all = JSON.stringify(both);
      expect(both.map((r) => r.status).sort(), all).toEqual([0, 1]);
      expect(both.find((r) => r.status === 1)?.stdout, all).toBe("lost t1\n");
      expect(rows(root), all).toHaveLength(1);
    }
  });

  const refusals: readonly { name: string; args: readonly string[]; phrase: string }[] = [
    { name: "a task name with a path separator", args: ["claim", "a/b", "--by", "x"], phrase: "invalid task name" },
    { name: "a task name of two dots", args: ["claim", "..", "--by", "x"], phrase: "invalid task name" },
    { name: "an empty task name", args: ["claim", "", "--by", "x"], phrase: "invalid task name" },
    { name: "a missing --by", args: ["claim", "t1"], phrase: "--by" },
    { name: "--by with no value", args: ["claim", "t1", "--by"], phrase: "--by" },
    { name: "--by taking the next flag as its value", args: ["claim", "t1", "--by", "--level", "mid"], phrase: "--by" },
    { name: "an empty --by", args: ["claim", "t1", "--by", ""], phrase: "the claim owner is empty" },
    { name: "a --by with a space", args: ["claim", "t1", "--by", "a b"], phrase: "is not a plain name" },
    { name: "a level outside the closed set", args: ["claim", "t1", "--by", "x", "--level", "staff"], phrase: "junior, mid, senior" },
    { name: "a task with no pending subtask", args: ["claim", "absent", "--by", "x"], phrase: "no subtask at pending/absent.md" },
  ];

  for (const c of refusals) {
    it(`refuses ${c.name}: exit 2, an empty stdout, one line and no claim directory`, () => {
      const root = repo("t1");
      expectRefused(run(root, ...c.args), c.phrase);
      const claimed = join(root, QUEUE_CLAIMED_REL);
      expect(existsSync(claimed) ? readdirSync(claimed) : []).toEqual([]);
      expect(existsSync(join(root, QUEUE_PENDING_REL, "t1.md"))).toBe(true);
    });
  }

  it("refuses a task already in done/, and moves nothing", () => {
    const root = repo("t1");
    mkdirSync(join(root, QUEUE_DONE_REL));
    writeFileSync(join(root, QUEUE_DONE_REL, "t1.md"), subtask("t1"));
    expectRefused(run(root, "claim", "t1", "--by", "x"), "already exists");
    expect(readdirSync(join(root, QUEUE_CLAIMED_REL))).toEqual([]);
    expect(existsSync(join(root, QUEUE_PENDING_REL, "t1.md"))).toBe(true);
  });

  for (const by of ["grugops-orchestrator", "ORCHESTRATOR", "Grugops-Orchestrator"]) {
    it(`refuses --by ${by}: the Orchestrator never owns a claim (D-13)`, () => {
      const root = repo("t1");
      expectRefused(run(root, "claim", "t1", "--by", by), "the Orchestrator never owns a claim");
      expect(readdirSync(join(root, QUEUE_CLAIMED_REL))).toEqual([]);
    });
  }

  it("removes a control character from a task name it prints (V7)", () => {
    const root = repo("t1");
    const r = run(root, "claim", "bad\u0007na\u009bme", "--by", "x");
    expectRefused(r, "badname");
    expect(r.stderr).not.toContain("\u0007");
    expect(r.stderr).not.toContain("\u009b");
  });
});

describe("now-running (D-02)", () => {
  it("renders the table, prints one line and exits 0", () => {
    const root = repo("t1");
    expect(run(root, "claim", "t1", "--by", "grugops-qe-e2e").status).toBe(0);
    rmSync(join(root, NOW_RUNNING_REL));
    const r = run(root, "now-running");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe(`rendered ${NOW_RUNNING_REL}\n`);
    expect(r.status).toBe(0);
    expect(rows(root)).toHaveLength(1);
  });

  it("renders a header-only table for an empty queue, creating the queue first", () => {
    const root = bareRepo();
    expect(run(root, "now-running").status).toBe(0);
    expect(rows(root)).toEqual([]);
  });

  it("refuses a positional task", () => {
    expectRefused(run(repo(), "now-running", "t1"), "Usage:");
  });
});

describe("the root is a boundary (T-41-08, T-41-09)", () => {
  it("a directory with no .grugops/ is refused and gains no stray queue", () => {
    const root = mkTmp("grugops-claim-wrong-cwd-");
    for (const args of [["claim", "t1", "--by", "x"], ["now-running"]]) {
      expectRefused(run(root, ...args), GRUGOPS_DIR_REL, "--root");
      expect(readdirSync(root)).toEqual([]);
    }
  });

  it("--root DIR acts on DIR from any working directory", () => {
    const root = repo("t1");
    const elsewhere = mkTmp("grugops-claim-elsewhere-");
    const r = run(elsewhere, "claim", "t1", "--by", "grugops-qe-e2e", "--root", root);
    expect(r.stdout).toBe("claimed t1 by grugops-qe-e2e\n");
    expect(r.status).toBe(0);
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1", "claim.md"))).toBe(true);
    expect(readdirSync(elsewhere)).toEqual([]);
  });

  it("refuses a --root that does not resolve, and an empty --root", () => {
    const root = repo("t1");
    expectRefused(run(root, "now-running", "--root", join(root, "absent")), "cannot be resolved");
    expectRefused(run(root, "now-running", "--root", ""), "--root");
  });

  it("refuses a .grugops that is a regular file", () => {
    const root = mkTmp("grugops-claim-file-state-");
    writeFileSync(join(root, GRUGOPS_DIR_REL), "");
    expectRefused(run(root, "now-running"), GRUGOPS_DIR_REL);
  });

  it("refuses a symlinked .grugops/queue by name, and writes nothing through it", () => {
    const root = bareRepo();
    const outside = mkTmp("grugops-claim-outside-");
    const skipped = stageSymlinkOrSkip(
      outside,
      join(root, QUEUE_REL),
      "symlink leaving the repository root",
      "scripts/runnable-ref/claim.test.ts: the queue directory (plan 41-03)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "scripts/runnable-ref/state-roll.test.ts's archive link case (the same rule)"));
      return;
    }
    for (const args of [["claim", "t1", "--by", "x"], ["now-running"]]) {
      expectRefused(run(root, ...args), `${QUEUE_REL} is a symbolic link`);
      expect(lstatSync(join(root, QUEUE_REL)).isSymbolicLink()).toBe(true);
      expect(readdirSync(outside)).toEqual([]);
    }
  });

  it("refuses a stage directory that is a regular file, by name", () => {
    const root = repo("t1");
    writeFileSync(join(root, QUEUE_CLAIMED_REL), "");
    expectRefused(run(root, "claim", "t1", "--by", "x"), QUEUE_CLAIMED_REL, "is not a directory");
    expect(existsSync(join(root, QUEUE_PENDING_REL, "t1.md"))).toBe(true);
  });
});

describe("the command line (D-08)", () => {
  it("a missing subcommand exits 2 with the usage line", () => {
    expectRefused(run(repo()), "Usage: node claim.js");
  });

  it("an unknown subcommand exits 2 with the usage line", () => {
    expectRefused(run(repo(), "steal", "t1"), "steal", "Usage: node claim.js");
  });

  it("an unknown flag exits 2 with the usage line", () => {
    expectRefused(run(repo("t1"), "claim", "t1", "--by", "x", "--force"), "--force", "Usage: node claim.js");
  });

  it("a flag that belongs to another command exits 2", () => {
    expectRefused(run(repo(), "now-running", "--by", "x"), "--by", "Usage: node claim.js");
  });

  it("a repeated flag exits 2", () => {
    expectRefused(run(repo("t1"), "claim", "t1", "--by", "x", "--by", "y"), "--by", "more than once");
  });

  it("a second positional exits 2", () => {
    expectRefused(run(repo("t1", "t2"), "claim", "t1", "t2", "--by", "x"), "Usage: node claim.js");
  });
});

describe("a stop never denies a change that stands (EXIT-1)", () => {
  it("a render that fails after the claim exits 2, says the claim stands and leaves it in place", () => {
    const root = repo("t1");
    mkdirSync(join(root, NOW_RUNNING_REL), { recursive: true });
    writeFileSync(join(root, NOW_RUNNING_REL, "keeps-the-directory-full"), "");
    const r = run(root, "claim", "t1", "--by", "grugops-qe-e2e");
    expectRefused(r, "the queue tool stopped unexpectedly", "t1 was claimed by grugops-qe-e2e", "The command did not finish.");
    expect(r.stderr).not.toContain("The queue was not changed.");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1", "claim.md"))).toBe(true);
  });

  it("a stop before any change says so", () => {
    const root = repo("t1");
    mkdirSync(join(root, NOW_RUNNING_REL), { recursive: true });
    writeFileSync(join(root, NOW_RUNNING_REL, "keeps-the-directory-full"), "");
    const r = run(root, "now-running");
    expectRefused(r, "the queue tool stopped unexpectedly", "The command did not finish.");
    expect(r.stderr).not.toContain("was claimed");
  });
});

describe("the committed program stands alone (RUN-05)", () => {
  it("imports node: builtins and nothing else", () => {
    const imports = readFileSync(CLAIM_JS, "utf8")
      .split("\n")
      .filter((l) => l.startsWith("import "));
    expect(imports.length).toBeGreaterThan(0);
    for (const line of imports) expect(line).toMatch(/from "node:[a-z/]+";$/);
  });

  it("names itself in the build stamp set", () => {
    expect(readFileSync(CLAIM_JS, "utf8")).toContain('export const RUNNABLE_SELF = "claim.js";');
  });
});

// ── done (plan 41-03 Task 3, RUN-01, D-05, D-07, D-28) ──────────────────────────────────────────────────

/** The text of a sealed note written at `at`, sealed through the committed seal export. */
function sealedNote(name: string, at: string): string {
  const fence =
    `id: ${name}\n` +
    "kind: observation\n" +
    "by: grugops-qe-e2e\n" +
    `at: ${at}\n` +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    "supersedes: \n";
  const rest = "---\n\n" + "an observation the task published.\n";
  return "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
}

/** A sealed note with its seal line removed: what a hand-written note looks like to the walk (D-28). */
function handWrittenNote(name: string, at: string): string {
  const seal = `${ctxio.NOTE_SEAL_KEY}:`;
  return sealedNote(name, at)
    .split("\n")
    .filter((l) => !l.startsWith(seal))
    .join("\n");
}

function notesDir(root: string, folder: string): string {
  return join(root, CONTEXT_REL, folder, "notes");
}

/** Plant the note `text` as `<name>.md` in the notes directory of `folder`. */
function plantNote(root: string, folder: string, name: string, text: string): void {
  mkdirSync(notesDir(root, folder), { recursive: true });
  writeFileSync(join(notesDir(root, folder), `${name}.md`), text);
}

/** A repository with `task` claimed through the program, its subtask carrying `subtaskText`. */
function claimedRepo(task: string, subtaskText: string = subtask(task)): string {
  const root = repo();
  writeFileSync(join(root, QUEUE_PENDING_REL, `${task}.md`), subtaskText);
  const r = run(root, "claim", task, "--by", "grugops-qe-e2e");
  expect(r.status, r.stderr).toBe(0);
  return root;
}

function claimPath(root: string, task: string): string {
  return join(root, QUEUE_CLAIMED_REL, task, "claim.md");
}

/** The `at` of the claim record of `task`. */
function claimAt(root: string, task: string): string {
  const at = /^at: (.+)$/m.exec(readFileSync(claimPath(root, task), "utf8"))?.[1];
  if (at === undefined) throw new Error("PREMISE: the claim record carries an at line");
  return at;
}

/** The same instant moved by `ms` milliseconds, in the ISO form a note carries. */
function shifted(at: string, ms: number): string {
  return new Date(Date.parse(at) + ms).toISOString();
}

/** Every file of claimed/<task>/, with its text: the before and after of a `done` that must move nothing. */
function claimTree(root: string, task: string): Record<string, string> {
  const dir = join(root, QUEUE_CLAIMED_REL, task);
  return Object.fromEntries(readdirSync(dir).sort().map((f) => [f, readFileSync(join(dir, f), "utf8")]));
}

/** `done` must have stopped with claimed/<task>/ exactly as `before` and nothing in done/. */
function expectNothingMoved(root: string, task: string, before: Record<string, string>): void {
  expect(claimTree(root, task)).toEqual(before);
  expect(existsSync(join(root, QUEUE_DONE_REL, `${task}.md`))).toBe(false);
}

describe("done TASK finishes a task on a sealed note (RUN-01, D-05, D-07)", () => {
  it("moves the subtask to done/, releases the claim and leaves a header-only log", () => {
    const root = claimedRepo("t1");
    plantNote(root, "t1", "n1", sealedNote("n1", shifted(claimAt(root, "t1"), 1000)));
    const r = run(root, "done", "t1");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe("done t1\n");
    expect(r.status).toBe(0);
    expect(readFileSync(join(root, QUEUE_DONE_REL, "t1.md"), "utf8")).toBe(subtask("t1"));
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1"))).toBe(false);
    expect(rows(root)).toEqual([]);
  });

  it("the log keeps the row of a task still running", () => {
    const root = repo("t1", "t2");
    expect(run(root, "claim", "t1", "--by", "grugops-qe-e2e").status).toBe(0);
    expect(run(root, "claim", "t2", "--by", "grugops-security").status).toBe(0);
    plantNote(root, "t1", "n1", sealedNote("n1", claimAt(root, "t1")));
    expect(run(root, "done", "t1").status).toBe(0);
    const remaining = rows(root);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toContain("| t2 | grugops-security |");
  });

  it("a sealed note at the claim's own instant counts", () => {
    const root = claimedRepo("t1");
    plantNote(root, "t1", "n1", sealedNote("n1", claimAt(root, "t1")));
    const r = run(root, "done", "t1");
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it("a sealed note one millisecond before the claim does not count", () => {
    const root = claimedRepo("t1");
    const at = claimAt(root, "t1");
    plantNote(root, "t1", "n1", sealedNote("n1", shifted(at, -1)));
    const before = claimTree(root, "t1");
    const r = run(root, "done", "t1");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toBe(`not-done t1: no sealed note in ${CONTEXT_REL}/t1/ since ${at}\n`);
    expectNothingMoved(root, "t1", before);
  });

  it("no note at all: prints the not-done line naming the folder and the claim's at, exits 1 and moves nothing", () => {
    const root = claimedRepo("t1");
    const at = claimAt(root, "t1");
    const before = claimTree(root, "t1");
    const r = run(root, "done", "t1");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe(`not-done t1: no sealed note in ${CONTEXT_REL}/t1/ since ${at}\n`);
    expect(r.status).toBe(1);
    expectNothingMoved(root, "t1", before);
    expect(rows(root)).toHaveLength(1);
  });

  it("a hand-written note alone exits 1 and the line names the file and says unsealed (D-28)", () => {
    const root = claimedRepo("t1");
    plantNote(root, "t1", "hand", handWrittenNote("hand", shifted(claimAt(root, "t1"), 1000)));
    const before = claimTree(root, "t1");
    const r = run(root, "done", "t1");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain("; 1 unsealed note(s) found: hand.md\n");
    expectNothingMoved(root, "t1", before);
  });

  it("more than ten unsealed notes: the line names ten and says how many more", () => {
    const root = claimedRepo("t1");
    const at = shifted(claimAt(root, "t1"), 1000);
    const names = Array.from({ length: 13 }, (_, i) => `hand-${String(i).padStart(2, "0")}`);
    for (const name of names) plantNote(root, "t1", name, handWrittenNote(name, at));
    const r = run(root, "done", "t1");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    const listed = names.slice(0, 10).map((n) => `${n}.md`).join(", ");
    expect(r.stdout).toContain(`; 13 unsealed note(s) found: ${listed} and 3 more\n`);
    expect(r.stdout).not.toContain("hand-10.md");
  });

  it("notes the walk skipped under other arms are counted apart, never read as unsealed", () => {
    const root = claimedRepo("t1");
    plantNote(root, "t1", "stray", "no frontmatter here\n");
    mkdirSync(join(notesDir(root, "t1"), "folder.md"));
    const r = run(root, "done", "t1");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain("; 2 other note(s) skipped\n");
    expect(r.stdout).not.toContain("unsealed");
  });

  it("a sealed note beside a hand-written one passes: the seal decides, and the hand-written note is left", () => {
    const root = claimedRepo("t1");
    const at = shifted(claimAt(root, "t1"), 1000);
    plantNote(root, "t1", "hand", handWrittenNote("hand", at));
    plantNote(root, "t1", "n1", sealedNote("n1", at));
    expect(run(root, "done", "t1").status).toBe(0);
  });

  it("removes a control character from a note name it prints (V7)", () => {
    const root = claimedRepo("t1");
    mkdirSync(notesDir(root, "t1"), { recursive: true });
    const at = join(notesDir(root, "t1"), "ha\u0007nd.md");
    const skipped = stageNameOrSkip(
      () => writeFileSync(at, handWrittenNote("hand", shifted(claimAt(root, "t1"), 1000))),
      "scripts/runnable-ref/claim.test.ts: a note name holding a control byte (plan 41-03)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the task-name control-character case above"));
      return;
    }
    const r = run(root, "done", "t1");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain("found: hand.md\n");
    expect(r.stdout).not.toContain("\u0007");
  });

  it("reads the folder from the subtask's ref: line, so a folder named apart from the task finds its notes", () => {
    const root = claimedRepo("t1", "# subtask t1\nref: .grugops/context/shared/\n");
    plantNote(root, "shared", "n1", sealedNote("n1", shifted(claimAt(root, "t1"), 1000)));
    const r = run(root, "done", "t1");
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it("a note in the task's own folder does not count when the ref: line names another", () => {
    const root = claimedRepo("t1", "# subtask t1\nref: .grugops/context/shared/\n");
    plantNote(root, "t1", "n1", sealedNote("n1", shifted(claimAt(root, "t1"), 1000)));
    const r = run(root, "done", "t1");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain(`no sealed note in ${CONTEXT_REL}/shared/ since`);
  });

  it("a claim directory with no subtask and done/t1.md present exits 0 and releases the directory", () => {
    const root = claimedRepo("t1");
    mkdirSync(join(root, QUEUE_DONE_REL), { recursive: true });
    writeFileSync(join(root, QUEUE_DONE_REL, "t1.md"), subtask("t1"));
    rmSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"));
    const r = run(root, "done", "t1");
    expect(r.stderr).toBe("");
    expect(r.stdout).toBe("done t1\n");
    expect(r.status).toBe(0);
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1"))).toBe(false);
    expect(rows(root)).toEqual([]);
  });

  it("offers no way past the note check: an unknown flag is refused and the task stays claimed", () => {
    const root = claimedRepo("t1");
    const before = claimTree(root, "t1");
    expectRefused(run(root, "done", "t1", "--force"), "--force", "Usage: node claim.js");
    expectNothingMoved(root, "t1", before);
  });
});

describe("done refuses what it cannot read (T-41-16)", () => {
  const badRefs: readonly { name: string; text: string; phrase: string }[] = [
    { name: "a ref: line that traverses", text: "# subtask t1\nref: ../../etc\n", phrase: "does not name one folder" },
    { name: "a ref: line with .. as its folder", text: "# subtask t1\nref: .grugops/context/../\n", phrase: "does not name one folder" },
    { name: "two ref: lines", text: "# subtask t1\nref: .grugops/context/t1/\nref: .grugops/context/t2/\n", phrase: "2 ref: lines" },
    { name: "no ref: line", text: "# subtask t1\n", phrase: "0 ref: lines" },
  ];
  for (const c of badRefs) {
    it(`${c.name}: exit 2 with claimed/t1/ unchanged`, () => {
      const root = claimedRepo("t1", c.text);
      const before = claimTree(root, "t1");
      expectRefused(run(root, "done", "t1"), c.phrase);
      expectNothingMoved(root, "t1", before);
    });
  }

  it("a claim with two at: lines exits 2 and is not moved", () => {
    const root = claimedRepo("t1");
    plantNote(root, "t1", "n1", sealedNote("n1", shifted(claimAt(root, "t1"), 1000)));
    const text = readFileSync(claimPath(root, "t1"), "utf8");
    writeFileSync(claimPath(root, "t1"), text.replace("task: t1\n", "at: 2020-01-01T00:00:00.000Z\ntask: t1\n"));
    const before = claimTree(root, "t1");
    expectRefused(run(root, "done", "t1"), "tampered");
    expectNothingMoved(root, "t1", before);
  });

  it("a claim with no at: value exits 2 and is not moved", () => {
    const root = claimedRepo("t1");
    writeFileSync(claimPath(root, "t1"), "---\nby: x\ntask: t1\n---\n");
    const before = claimTree(root, "t1");
    expectRefused(run(root, "done", "t1"), "no at");
    expectNothingMoved(root, "t1", before);
  });

  it("a claim whose at: is not a timestamp exits 2, because no note could ever pass it", () => {
    const root = claimedRepo("t1");
    const text = readFileSync(claimPath(root, "t1"), "utf8");
    writeFileSync(claimPath(root, "t1"), text.replace(/^at: .*$/m, "at: not\u0007-a-date"));
    const before = claimTree(root, "t1");
    const r = run(root, "done", "t1");
    expectRefused(r, "not-a-date", "not a timestamp");
    expect(r.stderr).not.toContain("\u0007");
    expectNothingMoved(root, "t1", before);
  });

  it("a claim directory with no claim record exits 2", () => {
    const root = claimedRepo("t1");
    rmSync(claimPath(root, "t1"));
    expectRefused(run(root, "done", "t1"), "no claim record");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"))).toBe(true);
  });

  it("a claim record that is a directory exits 2", () => {
    const root = claimedRepo("t1");
    rmSync(claimPath(root, "t1"));
    mkdirSync(claimPath(root, "t1"));
    expectRefused(run(root, "done", "t1"), "claim.md");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"))).toBe(true);
  });

  it("a FIFO at the claim record exits 2 and is never opened", () => {
    const root = claimedRepo("t1");
    rmSync(claimPath(root, "t1"));
    const skipped = stageShapeOrSkip("FIFO", claimPath(root, "t1"), "scripts/runnable-ref/claim.test.ts: the claim record (plan 41-03)");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the directory at the claim record case above"));
      return;
    }
    expectRefused(run(root, "done", "t1"), "claim.md", "is not a regular file");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"))).toBe(true);
  });

  it("a symlinked claim record exits 2, and the file it points to is not read", () => {
    const root = claimedRepo("t1");
    const elsewhere = join(root, "elsewhere.md");
    writeFileSync(elsewhere, readFileSync(claimPath(root, "t1")));
    rmSync(claimPath(root, "t1"));
    const skipped = stageSymlinkOrSkip(
      elsewhere,
      claimPath(root, "t1"),
      "symlink inside the repository root",
      "scripts/runnable-ref/claim.test.ts: the claim record (plan 41-03)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the symlinked queue directory case above"));
      return;
    }
    expectRefused(run(root, "done", "t1"), "claim.md", "symbolic link");
    expect(lstatSync(claimPath(root, "t1")).isSymbolicLink()).toBe(true);
  });

  it("`done` on a task with no claim directory exits 2", () => {
    const root = repo("t1");
    expectRefused(run(root, "done", "t1"), "no claim directory");
    expect(existsSync(join(root, QUEUE_PENDING_REL, "t1.md"))).toBe(true);
  });

  it("`done` on a repository with no queue exits 2 and creates none", () => {
    const root = bareRepo();
    expectRefused(run(root, "done", "t1"), "no claim directory");
    expect(existsSync(join(root, QUEUE_REL))).toBe(false);
  });

  it("no subtask anywhere exits 2 and keeps the claim directory", () => {
    const root = claimedRepo("t1");
    rmSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"));
    expectRefused(run(root, "done", "t1"), "no subtask for t1");
    expect(existsSync(claimPath(root, "t1"))).toBe(true);
  });

  it("a subtask in both claimed/ and done/ exits 2 and moves nothing", () => {
    const root = claimedRepo("t1");
    plantNote(root, "t1", "n1", sealedNote("n1", shifted(claimAt(root, "t1"), 1000)));
    writeFileSync(join(root, QUEUE_DONE_REL, "t1.md"), "an earlier copy\n");
    expectRefused(run(root, "done", "t1"), "already exists");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"))).toBe(true);
    expect(readFileSync(join(root, QUEUE_DONE_REL, "t1.md"), "utf8")).toBe("an earlier copy\n");
  });

  it("a bad task name and a missing task each exit 2", () => {
    expectRefused(run(repo(), "done", "a/b"), "invalid task name");
    expectRefused(run(repo(), "done"), "Usage: node claim.js");
  });

  it("a symlinked context folder exits 2 and the task stays claimed", () => {
    const root = claimedRepo("t1");
    const outside = mkTmp("grugops-claim-context-outside-");
    mkdirSync(join(outside, "notes"));
    writeFileSync(join(outside, "notes", "n1.md"), sealedNote("n1", shifted(claimAt(root, "t1"), 1000)));
    mkdirSync(join(root, CONTEXT_REL));
    const skipped = stageSymlinkOrSkip(
      outside,
      join(root, CONTEXT_REL, "t1"),
      "symlink leaving the repository root",
      "scripts/runnable-ref/claim.test.ts: the context folder (plan 41-03)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the symlinked queue directory case above"));
      return;
    }
    const before = claimTree(root, "t1");
    expectRefused(run(root, "done", "t1"), `${CONTEXT_REL}/t1 is a symbolic link`);
    expectNothingMoved(root, "t1", before);
  });

  it("a notes path that is a regular file exits 2 and the task stays claimed", () => {
    const root = claimedRepo("t1");
    mkdirSync(join(root, CONTEXT_REL, "t1"), { recursive: true });
    writeFileSync(notesDir(root, "t1"), "");
    const before = claimTree(root, "t1");
    expectRefused(run(root, "done", "t1"), "notes");
    expectNothingMoved(root, "t1", before);
  });

  it("a render that fails after the move exits 2 and says the task finished", () => {
    const root = claimedRepo("t1");
    plantNote(root, "t1", "n1", sealedNote("n1", shifted(claimAt(root, "t1"), 1000)));
    rmSync(join(root, NOW_RUNNING_REL));
    mkdirSync(join(root, NOW_RUNNING_REL));
    writeFileSync(join(root, NOW_RUNNING_REL, "keeps-the-directory-full"), "");
    const r = run(root, "done", "t1");
    expectRefused(r, "the queue tool stopped unexpectedly", "t1 moved to done/", "The command did not finish.");
    expect(r.stderr).not.toContain("The queue was not changed.");
    expect(existsSync(join(root, QUEUE_DONE_REL, "t1.md"))).toBe(true);
  });
});

// ── free and sweep (plan 41-05 Task 1, RUN-02, D-01, D-02, D-08, D-11) ──────────────────────────────────

const CLAIM_TS = join(import.meta.dirname, "claim.ts");
const SEED_STATE_DIR = join(import.meta.dirname, "..", "..", "agent-factory", "seed", GRUGOPS_DIR_REL);
const CONFIG_REL = `${GRUGOPS_DIR_REL}/factory.config.json`;
const MINUTE_MS = 60_000;

/** Write `queue` as the `queue` block of the repository's config. */
function configure(root: string, queue: unknown): void {
  writeFileSync(join(root, CONFIG_REL), `${JSON.stringify({ queue })}\n`);
}

/** A repository with the seed's queue dial and `count` claims on disk, none of them through the program. */
function repoWithClaims(count: number): string {
  const root = repo();
  configure(root, { wip_limit: 3, claim_cap: 2, stale_ttl_minutes: 30 });
  holdClaims(root, count);
  return root;
}

/** `count` claim directories under claimed/, each with its record and its subtask. */
function holdClaims(root: string, count: number): void {
  for (let i = 1; i <= count; i += 1) {
    const dir = join(root, QUEUE_CLAIMED_REL, `t${i}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "claim.md"), `---\nby: x\nat: ${new Date().toISOString()}\ntask: t${i}\n---\n`);
    writeFileSync(join(dir, `t${i}.md`), subtask(`t${i}`));
  }
}

/** Move the `at` of the claim record of `task` back by `ms` milliseconds. */
function age(root: string, task: string, ms: number): void {
  const text = readFileSync(claimPath(root, task), "utf8");
  writeFileSync(claimPath(root, task), text.replace(/^at: .+$/m, `at: ${shifted(claimAt(root, task), -ms)}`));
}

/** A repository with the seed's dial and each of `tasks` claimed through the program. */
function repoClaiming(...tasks: string[]): string {
  const root = repo(...tasks);
  configure(root, { wip_limit: 3, claim_cap: 2, stale_ttl_minutes: 30 });
  for (const task of tasks) {
    const r = run(root, "claim", task, "--by", "grugops-qe-e2e");
    expect(r.status, r.stderr).toBe(0);
  }
  return root;
}

describe("free (RUN-02, D-01, D-08)", () => {
  for (const [count, line] of [
    [0, "free 3\n"],
    [1, "free 2\n"],
    [2, "free 1\n"],
    [3, "free 0\n"],
    [4, "free 0 (4 claimed, wip_limit 3)\n"],
  ] as const) {
    it(`with limit 3 and ${count} claimed it prints ${line.trim()}`, () => {
      const r = run(repoWithClaims(count), "free");
      expect(r.status).toBe(0);
      expect(r.stdout).toBe(line);
      expect(r.stderr).toBe("");
    });
  }

  it("reads the limit from the config, and a set limit carries no note", () => {
    const root = repoWithClaims(0);
    configure(root, { wip_limit: 5 });
    const r = run(root, "free");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("free 5\n");
  });

  for (const [name, plant, note] of [
    ["no config", () => undefined, "queue.wip_limit not set, default 3"],
    ["no queue block", (root: string) => writeFileSync(join(root, CONFIG_REL), "{}\n"), "queue.wip_limit not set, default 3"],
    ["a zero limit", (root: string) => configure(root, { wip_limit: 0 }), "queue.wip_limit is not a positive integer, default 3"],
    ["a string limit", (root: string) => configure(root, { wip_limit: "3" }), "queue.wip_limit is not a positive integer, default 3"],
    [
      "a config that is not JSON",
      (root: string) => writeFileSync(join(root, CONFIG_REL), "{ not json\n"),
      "queue.wip_limit not read, the config is not valid JSON, default 3",
    ],
  ] as const) {
    it(`with ${name} it prints the default and says so`, () => {
      const root = repo();
      plant(root);
      const r = run(root, "free");
      expect(r.status).toBe(0);
      expect(r.stdout).toBe(`free 3 (${note})\n`);
    });
  }

  it("names both when a defaulted limit is passed", () => {
    const root = repo();
    holdClaims(root, 4);
    expect(run(root, "free").stdout).toBe("free 0 (4 claimed, wip_limit 3) (queue.wip_limit not set, default 3)\n");
  });

  it("does not count a .gitkeep in claimed/", () => {
    const root = repoWithClaims(1);
    writeFileSync(join(root, QUEUE_CLAIMED_REL, ".gitkeep"), "");
    expect(run(root, "free").stdout).toBe("free 2\n");
  });

  it("with no claimed/ it prints the limit and creates nothing", () => {
    const root = bareRepo();
    configure(root, { wip_limit: 3 });
    const before = treeDigest(root);
    const r = run(root, "free");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("free 3\n");
    expect(treeDigest(root)).toEqual(before);
  });

  it("changes nothing on a repository with claims", () => {
    const root = repoWithClaims(2);
    const before = treeDigest(root);
    expect(run(root, "free").status).toBe(0);
    expect(treeDigest(root)).toEqual(before);
  });

  it("a FIFO at the config path exits 2 and never hangs (T-41-19)", () => {
    const root = repo();
    const skipped = stageShapeOrSkip("FIFO", join(root, CONFIG_REL), "scripts/runnable-ref/claim.test.ts: the config path (plan 41-05)");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the directory at the config path case below"));
      return;
    }
    expectRefused(run(root, "free"), "factory.config.json", "is not a regular file");
  });

  it("a directory at the config path exits 2", () => {
    const root = repo();
    mkdirSync(join(root, CONFIG_REL));
    expectRefused(run(root, "free"), "factory.config.json", "is not a regular file");
  });

  it("a symlink at the config path exits 2, and the file it points to is not read", () => {
    const root = repo();
    const elsewhere = join(root, "elsewhere.json");
    writeFileSync(elsewhere, '{"queue":{"wip_limit":9}}\n');
    const skipped = stageSymlinkOrSkip(
      elsewhere,
      join(root, CONFIG_REL),
      "symlink inside the repository root",
      "scripts/runnable-ref/claim.test.ts: the config path (plan 41-05)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the directory at the config path case above"));
      return;
    }
    expectRefused(run(root, "free"), "factory.config.json", "symbolic link");
  });

  it("a config above the read ceiling exits 2 rather than read it", () => {
    const root = repo();
    writeFileSync(join(root, CONFIG_REL), " ".repeat(1024 * 1024 + 1));
    expectRefused(run(root, "free"), "factory.config.json", "could not be read");
  });

  it("a claimed/ that is not a directory exits 2 and never counts as empty", () => {
    const root = repo();
    configure(root, { wip_limit: 3 });
    writeFileSync(join(root, QUEUE_CLAIMED_REL), "");
    expectRefused(run(root, "free"), QUEUE_CLAIMED_REL, "not a directory");
  });

  it("a symlinked claimed/ exits 2 and never counts what it points at", () => {
    const root = repo();
    configure(root, { wip_limit: 3 });
    const elsewhere = mkTmp("grugops-claim-elsewhere-");
    const skipped = stageSymlinkOrSkip(
      elsewhere,
      join(root, QUEUE_CLAIMED_REL),
      "symlink leaving the repository root",
      "scripts/runnable-ref/claim.test.ts: the claimed directory (plan 41-05)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the file at claimed/ case above"));
      return;
    }
    expectRefused(run(root, "free"), QUEUE_CLAIMED_REL, "symbolic link");
  });

  it("takes no task and no owner", () => {
    expectRefused(run(repo(), "free", "t1"), "Usage: node claim.js");
    expectRefused(run(repo(), "free", "--by", "x"), "--by", "Usage: node claim.js");
  });

  it("the config name is typed once in the program, and it is the seed's file", () => {
    const source = readFileSync(CLAIM_TS, "utf8");
    const name = /^const CONFIG_NAME = "([^"]+)";$/m.exec(source)?.[1];
    expect(name, "PREMISE: the program names its config once, as CONFIG_NAME").toBeDefined();
    expect(source.split(name as string).length - 1).toBe(1);
    expect(`${GRUGOPS_DIR_REL}/${name as string}`).toBe(CONFIG_REL);
    expect(lstatSync(join(SEED_STATE_DIR, name as string)).isFile()).toBe(true);
  });
});

describe("sweep (RUN-02, D-02, D-08, D-11)", () => {
  it("returns a stale claim to pending/, says so and renders the log", () => {
    const root = repoClaiming("t1");
    age(root, "t1", 31 * MINUTE_MS);
    expect(rows(root), "PREMISE: the claim has its row").toHaveLength(1);
    const r = run(root, "sweep");
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("swept 1\nreclaimed t1\n");
    expect(readFileSync(join(root, QUEUE_PENDING_REL, "t1.md"), "utf8")).toBe(subtask("t1"));
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1"))).toBe(false);
    expect(rows(root)).toEqual([]);
  });

  it("releases a claim whose subtask is already in done/, and counts it in no reclaim", () => {
    const root = repoClaiming("t1");
    mkdirSync(join(root, QUEUE_DONE_REL), { recursive: true });
    writeFileSync(join(root, QUEUE_DONE_REL, "t1.md"), subtask("t1"));
    rmSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"));
    const r = run(root, "sweep");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("swept 0\nreleased t1 (already done)\n");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1"))).toBe(false);
    expect(existsSync(join(root, QUEUE_PENDING_REL, "t1.md"))).toBe(false);
    expect(rows(root)).toEqual([]);
  });

  it("leaves a fresh claim alone", () => {
    const root = repoClaiming("t1");
    const r = run(root, "sweep");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("swept 0\n");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1", "t1.md"))).toBe(true);
    expect(rows(root)).toHaveLength(1);
  });

  it("reads queue.stale_ttl_minutes: a claim two minutes old is reclaimed at 1 and left at the default", () => {
    const short = repoClaiming("t1");
    configure(short, { stale_ttl_minutes: 1 });
    age(short, "t1", 2 * MINUTE_MS);
    const reclaimed = run(short, "sweep");
    expect(reclaimed.status).toBe(0);
    expect(reclaimed.stdout.split("\n").slice(0, 2)).toEqual(["swept 1", "reclaimed t1"]);

    const standard = repoClaiming("t1");
    age(standard, "t1", 2 * MINUTE_MS);
    const left = run(standard, "sweep");
    expect(left.status).toBe(0);
    expect(left.stdout).toBe("swept 0\n");
    expect(existsSync(join(standard, QUEUE_CLAIMED_REL, "t1", "t1.md"))).toBe(true);
  });

  it("says so when the TTL fell back to the default, after the task lines", () => {
    const root = repoClaiming("t1");
    rmSync(join(root, CONFIG_REL));
    age(root, "t1", 31 * MINUTE_MS);
    const r = run(root, "sweep");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("swept 1\nreclaimed t1\n(queue.stale_ttl_minutes not set, default 30)\n");
  });

  it("prints its task lines in name order", () => {
    const root = repoClaiming("t2", "t1", "t3");
    for (const task of ["t1", "t2", "t3"]) age(root, task, 31 * MINUTE_MS);
    expect(run(root, "sweep").stdout).toBe("swept 3\nreclaimed t1\nreclaimed t2\nreclaimed t3\n");
  });

  it("on a repository with no queue directories it exits 0 with swept 0", () => {
    const root = bareRepo();
    configure(root, { stale_ttl_minutes: 30 });
    const r = run(root, "sweep");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("swept 0\n");
    expect(rows(root)).toEqual([]);
  });

  it("a config it cannot read stops it before anything moves", () => {
    const root = repoClaiming("t1");
    age(root, "t1", 31 * MINUTE_MS);
    rmSync(join(root, CONFIG_REL));
    mkdirSync(join(root, CONFIG_REL));
    const before = treeDigest(root);
    expectRefused(run(root, "sweep"), "factory.config.json", "The queue was not changed.");
    expect(treeDigest(root)).toEqual(before);
  });

  it("a symlinked claimed/ exits 2 with nothing written", () => {
    const root = repo();
    configure(root, { stale_ttl_minutes: 30 });
    const elsewhere = mkTmp("grugops-claim-elsewhere-");
    const skipped = stageSymlinkOrSkip(
      elsewhere,
      join(root, QUEUE_CLAIMED_REL),
      "symlink leaving the repository root",
      "scripts/runnable-ref/claim.test.ts: the claimed directory (plan 41-05)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the symlinked claimed/ case of free above"));
      return;
    }
    expectRefused(run(root, "sweep"), QUEUE_CLAIMED_REL, "symbolic link");
    expect(existsSync(join(root, NOW_RUNNING_REL))).toBe(false);
  });

  it("a symbolic link under claimed/ stops it before anything moves, and nothing outside the root is touched (T-41-08)", () => {
    const root = repoClaiming("t1");
    age(root, "t1", 31 * MINUTE_MS);
    const elsewhere = mkTmp("grugops-claim-elsewhere-");
    writeFileSync(join(elsewhere, "claim.md"), "---\nby: x\nat: 2020-01-01T00:00:00.000Z\ntask: t2\n---\n");
    writeFileSync(join(elsewhere, "t2.md"), "a file outside the repository\n");
    const skipped = stageSymlinkOrSkip(
      elsewhere,
      join(root, QUEUE_CLAIMED_REL, "t2"),
      "symlink leaving the repository root",
      "scripts/runnable-ref/claim.test.ts: an entry of claimed/ (plan 41-05)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the symlinked claimed/ case above"));
      return;
    }
    const before = treeDigest(root);
    const outside = treeDigest(elsewhere);
    const r = run(root, "sweep");
    expect(r.status).toBe(2);
    expectRefused(r, `${QUEUE_CLAIMED_REL}/t2`, "symbolic link", "The queue was not changed.");
    expect(treeDigest(root)).toEqual(before);
    expect(treeDigest(elsewhere)).toEqual(outside);
  });

  it("a stray file in claimed/ does not stop it", () => {
    const root = repoClaiming("t1");
    age(root, "t1", 31 * MINUTE_MS);
    writeFileSync(join(root, QUEUE_CLAIMED_REL, ".gitkeep"), "");
    const r = run(root, "sweep");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("swept 1\nreclaimed t1\n");
  });

  it("a render that fails after a reclaim exits 2 and says the reclaim stands", () => {
    const root = repoClaiming("t1");
    age(root, "t1", 31 * MINUTE_MS);
    rmSync(join(root, NOW_RUNNING_REL));
    mkdirSync(join(root, NOW_RUNNING_REL));
    writeFileSync(join(root, NOW_RUNNING_REL, "keeps-the-directory-full"), "");
    const r = run(root, "sweep");
    expectRefused(r, "the queue tool stopped unexpectedly", "reclaimed t1", "The command did not finish.");
    expect(r.stderr).not.toContain("The queue was not changed.");
    expect(existsSync(join(root, QUEUE_PENDING_REL, "t1.md"))).toBe(true);
  });

  it("takes no task", () => {
    expectRefused(run(repo(), "sweep", "t1"), "Usage: node claim.js");
  });
});

// ── a claim with no usable record (plan 41-10, RUN-01, RUN-02, WR-04) ───────────────────────────────────

describe("a claim directory with no usable record shows in the log and frees its slot (plan 41-10, WR-04)", () => {
  /** A repository with the seed's dial and `claimed/orphan/`, holding `record` at claim.md when one is given. */
  function repoWithOrphan(record?: string): string {
    const root = repo();
    configure(root, { wip_limit: 3, claim_cap: 2, stale_ttl_minutes: 30 });
    const dir = join(root, QUEUE_CLAIMED_REL, "orphan");
    mkdirSync(dir, { recursive: true });
    if (record !== undefined) writeFileSync(join(dir, "claim.md"), record);
    return root;
  }

  /** Set the modified time of `claimed/orphan/` `ms` milliseconds into the past. */
  function ageDirectory(root: string, ms: number): void {
    const when = new Date(Date.now() - ms);
    utimesSync(join(root, QUEUE_CLAIMED_REL, "orphan"), when, when);
  }

  const ORPHAN_ROW = "| orphan |  |  |  | unknown |";

  it("an orphan directory is a row with since unknown, and free counts it", () => {
    const root = repoWithOrphan();
    expect(run(root, "now-running").status).toBe(0);
    expect(rows(root)).toEqual([ORPHAN_ROW]);
    expect(run(root, "free").stdout).toBe("free 2\n");
  });

  it("an orphan directory younger than the TTL stays: swept 0, and the row and the slot stay", () => {
    const root = repoWithOrphan();
    const r = run(root, "sweep");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("swept 0\n");
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "orphan"))).toBe(true);
    expect(rows(root)).toEqual([ORPHAN_ROW]);
    expect(run(root, "free").stdout).toBe("free 2\n");
  });

  it("an orphan directory past the TTL is reclaimed: the row goes and free rises", () => {
    const root = repoWithOrphan();
    ageDirectory(root, 31 * MINUTE_MS);
    const r = run(root, "sweep");
    expect(r.status).toBe(0);
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "orphan"))).toBe(false);
    expect(r.stdout).toBe("swept 1\nreclaimed orphan\n");
    expect(rows(root)).toEqual([]);
    expect(run(root, "free").stdout).toBe("free 3\n");
  });

  it("free and the table agree on a mixed queue, but for the tampered record, and the sweep frees what is past the TTL", () => {
    const root = repoClaiming("good");
    configure(root, { wip_limit: 20, claim_cap: 2, stale_ttl_minutes: 30 });
    const claimed = join(root, QUEUE_CLAIMED_REL);
    const outside = join(mkTmp("grugops-claim-mixed-target-"), "record.md");
    const outsideRecord = "---\nby: outsider\nat: 2000-01-01T00:00:00.000Z\ntask: t\n---\n";
    writeFileSync(outside, outsideRecord);
    const plant = (task: string, text: string | null): void => {
      mkdirSync(join(claimed, task));
      if (text !== null) writeFileSync(join(claimed, task, "claim.md"), text);
    };
    plant("no-record", null);
    plant("no-at", "---\nby: nobody\n");
    plant("bad-at", "---\nby: nobody\nat: not a time\n---\n");
    plant("link-record", null);
    plant("fifo-record", null);
    const linkSkipped = stageSymlinkOrSkip(
      outside,
      join(claimed, "link-record", "claim.md"),
      "symlink leaving the repository root",
      "scripts/runnable-ref/claim.test.ts: a link at the claim record (plan 41-10)",
    );
    if (linkSkipped !== null) console.warn(skipLine(linkSkipped, "the link case of scripts/claim.test.ts"));
    const fifoSkipped = stageShapeOrSkip(
      "FIFO",
      join(claimed, "fifo-record", "claim.md"),
      "scripts/runnable-ref/claim.test.ts: a FIFO at the claim record (plan 41-10)",
    );
    if (fifoSkipped !== null) console.warn(skipLine(fifoSkipped, "the FIFO case of scripts/claim.test.ts"));
    writeFileSync(join(claimed, "stray.txt"), "");
    plant("unsafe name", null);
    plant(".dot-dir", null);
    writeFileSync(join(claimed, ".gitkeep"), "");
    plant("tampered", "---\nby: attacker\nat: 2099-01-01T00:00:00.000Z\nat: 2000-01-01T00:00:00.000Z\ntask: tampered\n---\n");

    // Ten entries take a slot: free reads 20 minus 10, and the table holds nine of them.
    expect(run(root, "free").stdout).toBe("free 10\n");
    expect(run(root, "now-running").status).toBe(0);
    expect(rows(root)).toHaveLength(9);
    const text = readFileSync(join(root, NOW_RUNNING_REL), "utf8");
    for (const forged of ["tampered", "attacker", "2099", "outsider", "nobody"]) expect(text).not.toContain(forged);

    // Inside the TTL only the tampered record is reclaimed. The link and the FIFO are not opened.
    expect(run(root, "sweep").stdout).toBe("swept 1\nreclaimed tampered\n");
    expect(run(root, "free").stdout).toBe("free 11\n");

    const old = new Date(Date.now() - 31 * MINUTE_MS);
    for (const task of ["no-record", "no-at", "bad-at", "link-record", "fifo-record", ".dot-dir"]) {
      utimesSync(join(claimed, task), old, old);
    }
    const swept = run(root, "sweep");
    expect(swept.status).toBe(0);
    expect(swept.stdout.split("\n")[0]).toBe("swept 6");
    expect(readFileSync(outside, "utf8")).toBe(outsideRecord);
    // What stays: the live claim, a stray file and a name the sweep never joins. All three have a row.
    expect(rows(root)).toHaveLength(3);
    expect(run(root, "free").stdout).toBe("free 17\n");
  });

  it("a record-less claim directory with its subtask in done/ is released, reported apart from a reclaim", () => {
    const root = repoWithOrphan();
    mkdirSync(join(root, QUEUE_DONE_REL), { recursive: true });
    writeFileSync(join(root, QUEUE_DONE_REL, "orphan.md"), subtask("orphan"));
    const r = run(root, "sweep");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("swept 0\nreleased orphan (already done)\n");
    expect(rows(root)).toEqual([]);
  });

  it("a truncated record behaves the same: its row has an empty by and a since of unknown", () => {
    const root = repoWithOrphan("---\nby: x\n");
    expect(run(root, "now-running").status).toBe(0);
    expect(rows(root)).toEqual([ORPHAN_ROW]);
    expect(run(root, "free").stdout).toBe("free 2\n");
    expect(run(root, "sweep").stdout).toBe("swept 0\n");

    ageDirectory(root, 31 * MINUTE_MS);
    expect(run(root, "sweep").stdout).toBe("swept 1\nreclaimed orphan\n");
    expect(rows(root)).toEqual([]);
    expect(run(root, "free").stdout).toBe("free 3\n");
  });
});
