// claim.test.ts — the host queue tool (phase 41, plan 41-03, RUN-01, RUN-05, D-01, D-02, D-08, D-13).
//
// Every case runs the COMMITTED claim.js copied ALONE into an empty temporary directory beside only a package.json,
// with no node_modules and no sibling script reachable: the host emulation that proves the file imports `node:`
// builtins only. Every repository it acts on is an mkdtempSync directory built from the imported state-layout
// constants, never this repository's own tree. The rules themselves are unit cases in scripts/claim.test.ts; these
// cases prove the same rules run on a host, through the CLI contract of plan 41-03.
//
//   exit 0 → the command did its work; stdout holds its one line
//   exit 1 → an outcome to act on: `lost TASK`
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
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { skipLine, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import {
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
  const r = spawnSync(process.execPath, [HOST_JS, ...args], { encoding: "utf8", cwd });
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
