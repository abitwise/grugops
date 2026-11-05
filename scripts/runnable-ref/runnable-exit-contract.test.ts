// runnable-exit-contract.test.ts — EXIT-1 for the host runnables: the three of phase 37 (plan 37-20, D-12, D-17,
// 37-GAP-PLANNING-BRIEF.md §1 EXIT-1 and §2.1) and claim.js (plan 41-05, D-08).
//
// THE RULE. Every runnable whose header promises exit 2 for could-not-run maps any throw that escapes every inner
// catch to exit 2, an empty stdout and one stderr line that starts `Error: ` and ends with the runnable's own
// could-not-run sentence. Exit 1 means only "a finding": a crash that exits 1 is read by trace-freshness, Workflow
// 05 and Workflow 09 as a finding, and gets the wrong remedy.
//
// HOW A THROW IS FORCED. Each runnable is the COMMITTED .js copied alone into a scratch directory (the hostCopy
// pattern of the per-runnable tests) and run with a test preload from scripts/fault-inject.test-support.ts, loaded
// with `node --import`, outside the program. A stdout write that throws synchronously reaches each runnable's last
// statement, past every inner catch. Two further rows inject an EIO at one node:fs call by line: the symbolic-link
// follow-up statSync of a context root (TR-6; since plan 37-29 the absence owner's stat, entryPresence:statSync#0,
// entered from realDirectoryOrNull), and the realpathSync after state-roll creates its archive directory (SR-8).
// Both sites are found by their derived keys (plan 37-25: deriveReadSites over the copied .js, and callingSites for
// TR-6's caller), never by a line or a text lookup.
//
// THE MESSAGE NEVER DENIES A WRITE. state-roll names a roll already written and proven, and says `No roll had
// started.` only when none had; trace-render names the files it wrote and removed before it stopped; claim.js names
// the claim, the finish or the sweep that stands, and says when the in-flight log was not rendered after it.
//
// CLAIM.JS TAKES NO POSITIONAL ROOT. Its first positional is a task, so its rows pass `--root`. No loop below hands a
// positional root to every runnable: the census reads source text only, and each other row names its own program.
//
// NOT TESTED HERE, NAMED: a throw inside the handler's own stderr write ends the process with Node's own non-zero
// code (7), never exit 0; no test forces a failing stderr write portably (backstop truth of plan 37-20).

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  BOARD_DONE_ARCHIVE_REL,
  BOARD_REL,
  BUDGETS,
  CONTEXT_ARCHIVE_REL,
  CONTEXT_REL,
  GRUGOPS_DIR_REL,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  QUEUE_CLAIMED_REL,
  QUEUE_DONE_REL,
  QUEUE_PENDING_REL,
  QUEUE_REL,
  TRACE_DIR_REL,
} from "../../install/state-layout.js";
import {
  FAULT_LOG_ENV,
  FAULT_SPEC_ENV,
  INJECTED_STDOUT_MESSAGE,
  callingSites,
  deriveFsCallSites,
  hasNodeStack,
  runFaulted,
  deriveReadSites,
  scriptUrl,
  treeDigest,
  type FaultedRun,
} from "../fault-inject.test-support.js";

const HERE = import.meta.dirname;
const RUNNABLES = ["trace-render", "state-check", "state-roll", "claim"] as const;
type Runnable = (typeof RUNNABLES)[number];

/** Each runnable's could-not-run sentence for an unexpected throw: the last words of its one stderr line. */
const STOPPED: Record<Runnable, { readonly opens: string; readonly ends: string }> = {
  "trace-render": { opens: "Error: the trace render stopped unexpectedly (", ends: " The trace render did not finish.\n" },
  "state-check": { opens: "Error: the state check stopped unexpectedly (", ends: " The state check did not run.\n" },
  "state-roll": { opens: "Error: the roll stopped unexpectedly (", ends: " The roll did not finish.\n" },
  claim: { opens: "Error: the queue tool stopped unexpectedly (", ends: " The command did not finish.\n" },
};

const ctxio: typeof import("../context-io.js") = await import(pathToFileURL(join(HERE, "..", "context-io.js")).href);

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/** The committed .js of `name`, copied alone into an empty scratch directory. */
function hostCopy(name: Runnable): string {
  const js = join(mkTmp(`grugops-exit-contract-${name}-`), `${name}.js`);
  copyFileSync(join(HERE, `${name}.js`), js);
  return js;
}

const HOST: Record<Runnable, string> = {
  "trace-render": hostCopy("trace-render"),
  "state-check": hostCopy("state-check"),
  "state-roll": hostCopy("state-roll"),
  claim: hostCopy("claim"),
};

/** Run a runnable unfaulted (a fixture premise). */
function runPlain(name: Runnable, ...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [HOST[name], ...args], { encoding: "utf8", cwd: dirname(HOST[name]) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Run a runnable with `spec` injected by the test preload. */
function runWith(name: Runnable, args: readonly string[], spec: Parameters<typeof runFaulted>[2]): FaultedRun {
  return runFaulted(HOST[name], args, spec, { scratch: mkTmp("grugops-exit-contract-fault-"), cwd: dirname(HOST[name]) });
}

/** The EXIT-1 shape every row shares: exit 2, empty stdout, one `Error: ` line ending in the sentence, no stack. */
function expectStopped(name: Runnable, r: FaultedRun): void {
  const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
  expect(r.fired, `PREMISE: the injected fault fired (site-not-via ${r.siteNotVia})\n${all}`).toBeGreaterThan(0);
  expect(r.status, all).toBe(2);
  expect(r.stdout, all).toBe("");
  expect(hasNodeStack(r.stderr), all).toBe(false);
  expect(r.stderr.startsWith(STOPPED[name].opens), all).toBe(true);
  expect(r.stderr.endsWith(STOPPED[name].ends), all).toBe(true);
  expect(r.stderr.split("\n").filter((l) => l !== ""), all).toHaveLength(1);
}

/** The text of a sealed note carrying `refs`, written at `at`, sealed through the committed seal export. */
function noteText(name: string, refs: readonly string[], at = "2026-10-22T10:00:00Z"): string {
  const fence =
    `id: ${name}\n` +
    "kind: artifact-ref\n" +
    "by: engineer\n" +
    `at: ${at}\n` +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    refs.map((r) => `  - ${r}`).join("\n") +
    "\n" +
    "supersedes: \n";
  const rest = "---\n\n" + "an artifact-ref note carrying trace refs.\n";
  return "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
}

/** Plant a sealed note under `<root>/<contextRel>/<task>/notes/<name>.md`. */
function plant(root: string, contextRel: string, task: string, name: string, refs: readonly string[]): void {
  const dir = join(root, contextRel, task, "notes");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.md`), noteText(name, refs), "utf8");
}

/** A repository with one sealed note for ABC-001 in the live root and one for ABC-002 only in the archive. */
function twoRootRepo(): string {
  const root = mkTmp("grugops-exit-contract-trace-");
  mkdirSync(join(root, dirname(TRACE_DIR_REL)), { recursive: true });
  plant(root, CONTEXT_REL, "taskA", "n1", ["ABC-001", "src/a.ts"]);
  plant(root, CONTEXT_ARCHIVE_REL, "taskB", "n2", ["ABC-002", "#41"]);
  return root;
}

/** A ticket row of the board grammar. */
function row(n: number): string {
  return `- [ABC-${String(n).padStart(3, "0")}] finished ticket ${n}  (engineer, 2026-10-${String((n % 28) + 1).padStart(2, "0")})`;
}

/** A repository whose board's Done column holds `count` rows, newest first, and nothing else. */
function boardRepo(count: number): string {
  const root = mkTmp("grugops-exit-contract-roll-");
  mkdirSync(join(root, dirname(BOARD_REL)), { recursive: true });
  const board = [
    "# Board",
    "_Updated: 2026-10-22 by orchestrator_",
    "",
    "## In Development (WIP 0/3)",
    "",
    "## Done (WIP unlimited)",
    "",
    ...Array.from({ length: count }, (_, i) => row(i + 1)),
    "",
    "## Blocked (visible, time-tracked)",
    "",
  ].join("\n");
  writeFileSync(join(root, BOARD_REL), board, "utf8");
  return root;
}

/** The line of the one derived read site of the copied `name` .js whose key is `key` (plan 37-25). */
function siteLine(name: Runnable, key: string): number {
  const at = deriveReadSites(HOST[name]).filter((s) => s.key === key);
  expect(at.map((s) => s.key), `PREMISE: exactly one derived read site of ${name}.js is ${key}`).toEqual([key]);
  return (at[0] as { readonly line: number }).line;
}

const STDOUT_THROW = { kind: "stdout-throw" } as const;

/** A repository with `t1` pending and the seed's queue dial. */
function queueRepo(): string {
  const root = mkTmp("grugops-exit-contract-queue-");
  mkdirSync(join(root, QUEUE_PENDING_REL), { recursive: true });
  writeFileSync(join(root, QUEUE_PENDING_REL, "t1.md"), "# subtask t1\nref: .grugops/context/t1/\n", "utf8");
  writeFileSync(join(root, GRUGOPS_DIR_REL, "factory.config.json"), '{"queue":{"wip_limit":3,"stale_ttl_minutes":30}}\n', "utf8");
  return root;
}

/** `queueRepo` with `t1` claimed through the program, unfaulted. */
function claimedQueueRepo(): string {
  const root = queueRepo();
  const r = runPlain("claim", "claim", "t1", "--by", "grugops-qe-e2e", "--root", root);
  expect(r.status, `PREMISE: the fixture claims\n${r.stderr}`).toBe(0);
  return root;
}

/** The `at` of the claim record of `t1`, moved by `ms`. */
function claimAtShifted(root: string, ms: number): string {
  const text = readFileSync(join(root, QUEUE_CLAIMED_REL, "t1", "claim.md"), "utf8");
  const at = /^at: (.+)$/m.exec(text)?.[1];
  expect(at, "PREMISE: the claim record carries an at line").toBeDefined();
  return new Date(Date.parse(at as string) + ms).toISOString();
}

/** `claimedQueueRepo` with a sealed note written after the claim, so `done` passes. */
function finishableQueueRepo(): string {
  const root = claimedQueueRepo();
  const dir = join(root, CONTEXT_REL, "t1", "notes");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "n1.md"), noteText("n1", [], claimAtShifted(root, 1000)), "utf8");
  return root;
}

/** `claimedQueueRepo` with its claim older than the TTL of 30 minutes, so `sweep` reclaims it. */
function staleQueueRepo(): string {
  const root = claimedQueueRepo();
  const path = join(root, QUEUE_CLAIMED_REL, "t1", "claim.md");
  const aged = readFileSync(path, "utf8").replace(/^at: .+$/m, `at: ${claimAtShifted(root, -31 * 60_000)}`);
  writeFileSync(path, aged, "utf8");
  return root;
}

/** An EIO at the render's rename, the commit step of the in-flight log, found by its derived key. */
function renderRenameFault(): Parameters<typeof runFaulted>[2] {
  const key = "atomicWrite:renameSync#0";
  const at = deriveFsCallSites(HOST.claim, "renameSync").filter((s) => s.key === key);
  expect(at.map((s) => s.key), `PREMISE: exactly one derived rename of claim.js is ${key}`).toEqual([key]);
  const site = { url: scriptUrl(HOST.claim), line: (at[0] as { readonly line: number }).line };
  return { kind: "fs", fn: "renameSync", site, code: "EIO" };
}

const NOW_RUNNING_REL = `${QUEUE_REL}/now-running.md`;

describe("EXIT-1: an unexpected throw past every inner catch is exit 2 in every runnable and mode", () => {
  it("trace-render write mode: exit 2, and the message names the files written before it stopped", () => {
    const root = twoRootRepo();
    const r = runWith("trace-render", [root], STDOUT_THROW);
    expectStopped("trace-render", r);
    expect(r.stderr).toContain(`stopped unexpectedly (${INJECTED_STDOUT_MESSAGE}).`);
    expect(r.stderr).toContain("3 file(s) written and 0 file(s) removed before it stopped; run with --check to compare.");
    expect(r.stderr).not.toContain("Nothing was written");
  });

  it("trace-render --check: exit 2, and nothing was written or removed", () => {
    const root = twoRootRepo();
    expect(runPlain("trace-render", root).status, "PREMISE: the fixture renders").toBe(0);
    const before = treeDigest(root);
    const r = runWith("trace-render", [root, "--check"], STDOUT_THROW);
    expectStopped("trace-render", r);
    expect(r.stderr).toContain("Nothing was written or removed.");
    expect(treeDigest(root)).toEqual(before);
  });

  for (const args of [[], ["--json"]] as const) {
    it(`state-check ${args.length === 0 ? "text" : "--json"}: exit 2 on a throw at its output tail`, () => {
      const root = mkTmp("grugops-exit-contract-check-");
      mkdirSync(dirname(join(root, LAYOUT_MARKER_REL)), { recursive: true });
      writeFileSync(join(root, LAYOUT_MARKER_REL), `${LAYOUT_MARKER_CONTENT}\n`, "utf8");
      const r = runWith("state-check", [root, ...args], STDOUT_THROW);
      expectStopped("state-check", r);
      expect(r.stderr).toContain(`stopped unexpectedly (${INJECTED_STDOUT_MESSAGE}).`);
    });
  }

  it("state-roll write mode after a Done roll was written and proven: exit 2, and the message names that roll", () => {
    const root = boardRepo(BUDGETS.doneRows + 1);
    const r = runWith("state-roll", [root], STDOUT_THROW);
    expectStopped("state-roll", r);
    expect(r.stderr).toContain("The Done roll was written and proven and stays: 1 Done row(s)");
    expect(r.stderr).toContain(`ABC-${String(BUDGETS.doneRows + 1).padStart(3, "0")}`);
    expect(r.stderr).not.toContain("No roll had started");
    // The roll the message names is on disk.
    expect(lstatSync(join(root, BOARD_DONE_ARCHIVE_REL)).isFile()).toBe(true);
  });

  it("state-roll --dry-run: exit 2, and the message says no roll had started", () => {
    const root = boardRepo(BUDGETS.doneRows + 1);
    const before = treeDigest(root);
    const r = runWith("state-roll", [root, "--dry-run"], STDOUT_THROW);
    expectStopped("state-roll", r);
    expect(r.stderr).toContain(" No roll had started.");
    expect(treeDigest(root)).toEqual(before);
  });
});

describe("EXIT-1: claim.js, an unexpected throw past every inner catch is exit 2, and no message denies a change (plan 41-05)", () => {
  it("free: a throw at its output is exit 2, and nothing changed", () => {
    const root = queueRepo();
    const before = treeDigest(root);
    const r = runWith("claim", ["free", "--root", root], STDOUT_THROW);
    expectStopped("claim", r);
    expect(r.stderr).toContain(`stopped unexpectedly (${INJECTED_STDOUT_MESSAGE}).`);
    expect(treeDigest(root)).toEqual(before);
  });

  it("now-running: a throw at its output is exit 2", () => {
    const r = runWith("claim", ["now-running", "--root", queueRepo()], STDOUT_THROW);
    expectStopped("claim", r);
  });

  it("claim: a throw at its output after the render says the claim stands, and the log was rendered", () => {
    const root = queueRepo();
    const r = runWith("claim", ["claim", "t1", "--by", "grugops-qe-e2e", "--root", root], STDOUT_THROW);
    expectStopped("claim", r);
    expect(r.stderr).toContain("t1 was claimed by grugops-qe-e2e and stays claimed.");
    expect(r.stderr).not.toContain("not rendered");
    expect(readFileSync(join(root, NOW_RUNNING_REL), "utf8")).toContain("| t1 |");
  });

  it("claim: an EIO at the render's rename after a won claim says the claim stands and the log was not rendered", () => {
    const root = queueRepo();
    const r = runWith("claim", ["claim", "t1", "--by", "grugops-qe-e2e", "--root", root], renderRenameFault());
    expectStopped("claim", r);
    expect(r.stderr.includes("t1 was claimed by grugops-qe-e2e and stays claimed."), r.stderr.trimEnd()).toBe(true);
    expect(r.stderr.includes(`${NOW_RUNNING_REL} was not rendered.`), r.stderr.trimEnd()).toBe(true);
    expect(r.stderr).not.toContain("The queue was not changed.");
    expect(lstatSync(join(root, QUEUE_CLAIMED_REL, "t1", "claim.md")).isFile(), "the claim the message names is on disk").toBe(true);
  });

  it("claim: an EIO at the claim record's write leaves no claim behind, so no slot is lost and a retry wins", () => {
    const root = queueRepo();
    const key = "takeClaim:writeFileSync#0";
    const at = deriveFsCallSites(HOST.claim, "writeFileSync").filter((s) => s.key === key);
    expect(at.map((s) => s.key), `PREMISE: exactly one derived write of claim.js is ${key}`).toEqual([key]);
    const site = { url: scriptUrl(HOST.claim), line: (at[0] as { readonly line: number }).line };
    const args = ["claim", "t1", "--by", "grugops-qe-e2e", "--root", root];
    const r = runWith("claim", args, { kind: "fs", fn: "writeFileSync", site, code: "EIO" });
    expect(r.fired, `PREMISE: the injected fault fired\n${r.stderr}`).toBeGreaterThan(0);
    expect(r.status, r.stderr).toBe(2);
    expect(r.stderr).toContain("no task moved.");
    // The message is only true if the directory is gone: no sweep clears a claim with no record.
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1")), "the refused claim left its directory").toBe(false);
    expect(lstatSync(join(root, QUEUE_PENDING_REL, "t1.md")).isFile(), "the subtask stays in pending/").toBe(true);
    const retry = runPlain("claim", ...args);
    expect(retry.status, `the retry did not win the claim\n${retry.stdout}${retry.stderr}`).toBe(0);
  });

  it("done: an EIO at the render's rename says the task is done and the log was not rendered", () => {
    const root = finishableQueueRepo();
    const r = runWith("claim", ["done", "t1", "--root", root], renderRenameFault());
    expectStopped("claim", r);
    expect(r.stderr.includes("t1 moved to done/"), r.stderr.trimEnd()).toBe(true);
    expect(r.stderr.includes(`${NOW_RUNNING_REL} was not rendered.`), r.stderr.trimEnd()).toBe(true);
    expect(r.stderr).not.toContain("The queue was not changed.");
    expect(lstatSync(join(root, QUEUE_DONE_REL, "t1.md")).isFile(), "the finish the message names is on disk").toBe(true);
  });

  it("done: a throw at its output after the render says the task is done, and the log was rendered", () => {
    const r = runWith("claim", ["done", "t1", "--root", finishableQueueRepo()], STDOUT_THROW);
    expectStopped("claim", r);
    expect(r.stderr).toContain("t1 moved to done/");
    expect(r.stderr).not.toContain("not rendered");
  });

  it("sweep: an EIO at the render's rename says the reclaim stands and the log was not rendered", () => {
    const root = staleQueueRepo();
    const r = runWith("claim", ["sweep", "--root", root], renderRenameFault());
    expectStopped("claim", r);
    expect(r.stderr).toContain("reclaimed t1");
    expect(r.stderr).toContain(`${NOW_RUNNING_REL} was not rendered.`);
    expect(r.stderr).not.toContain("The queue was not changed.");
    expect(lstatSync(join(root, QUEUE_PENDING_REL, "t1.md")).isFile(), "the reclaim the message names is on disk").toBe(true);
  });

  it("sweep: a render failure with nothing moved names no change", () => {
    const root = claimedQueueRepo();
    const r = runWith("claim", ["sweep", "--root", root], renderRenameFault());
    expectStopped("claim", r);
    expect(r.stderr).not.toContain("reclaimed");
    expect(r.stderr).not.toContain("not rendered");
  });
});

describe("EXIT-1: a failing follow-up read after a symbolic link or a created directory is exit 2 by name", () => {
  // Plan 37-33 (D-20, CR-05): rewritten, not deleted. TR-6 failed the follow-up stat of a symbolic-link archive
  // context root (`entryPresence:statSync#0` via realDirectoryOrNull); a link at a context root is now refused from its
  // lstat before any stat, so the follow-up stat of a link is no longer reached there. The row keeps its question (a
  // failing follow-up read at a context root is exit 2 by name) on the root-chain owner's stat of the last component,
  // which runs on every call: a plain archive context root, with the live root removed, so the first stat the owner
  // makes is the archive root's.
  it("TR-6: an EIO at the root-chain owner's statSync of a plain archive context root is exit 2 naming the root", () => {
    const root = twoRootRepo();
    rmSync(join(root, CONTEXT_REL), { recursive: true });
    expect(lstatSync(join(root, CONTEXT_ARCHIVE_REL)).isDirectory(), "PREMISE: the archive context root is a real directory").toBe(true);
    const url = scriptUrl(HOST["trace-render"]);
    const site = { url, line: siteLine("trace-render", "rootChainPresence:statSync#0") };
    const callers = callingSites(HOST["trace-render"], "rootChainPresence");
    // Plan 37-34 (D-20): the pre-write check (`<top>`) and readText ask the root-chain owner too; the fault stays
    // scoped to realDirectoryOrNull's call, the one that serves the context roots.
    expect(
      callers.map((c) => c.scope).sort(),
      "PREMISE: realDirectoryOrNull, the pre-write check and readText ask the root-chain owner, and nothing else does",
    ).toEqual(["<top>", "readText", "realDirectoryOrNull"]);
    const directories = callers.filter((c) => c.scope === "realDirectoryOrNull");
    expect(directories, "PREMISE: realDirectoryOrNull asks the root-chain owner once").toHaveLength(1);
    const via = { url, line: (directories[0] as { readonly line: number }).line };
    const before = treeDigest(root);
    const r = runWith("trace-render", [root], { kind: "fs", fn: "statSync", site, via, code: "EIO" });
    const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(r.fired, `PREMISE: the fault fired (site-not-via ${r.siteNotVia})\n${all}`).toBeGreaterThan(0);
    expect(r.status, all).toBe(2);
    expect(r.stdout, all).toBe("");
    expect(hasNodeStack(r.stderr), all).toBe(false);
    expect(r.stderr, all).toContain(`the context root ${CONTEXT_ARCHIVE_REL} cannot be inspected: `);
    expect(r.stderr, all).toContain("(EIO)");
    expect(treeDigest(root)).toEqual(before);
  });

  it("SR-8: an EIO at the realpathSync after state-roll creates its archive directory leaves the tree unchanged", () => {
    const root = boardRepo(BUDGETS.doneRows + 1);
    const before = treeDigest(root);
    const site = { url: scriptUrl(HOST["state-roll"]), line: siteLine("state-roll", "<top>:realpathSync#1") };
    const r = runWith("state-roll", [root], { kind: "fs", fn: "realpathSync", site, code: "EIO" });
    const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(r.fired, `PREMISE: the fault fired (site-not-via ${r.siteNotVia})\n${all}`).toBeGreaterThan(0);
    expect(r.status, all).toBe(2);
    expect(r.stdout, all).toBe("");
    expect(hasNodeStack(r.stderr), all).toBe(false);
    expect(r.stderr, all).toContain("cannot be resolved after it was created (EIO)");
    expect(treeDigest(root), "no archive directory is left behind").toEqual(before);
  });
});

describe("EXIT-1 census: one handler per runnable, before argv, and no fault switch in any shipped file", () => {
  for (const name of RUNNABLES) {
    it(`${name}: process.on("uncaughtException" appears once, before the first process.argv; no fault switch`, () => {
      for (const ext of [".ts", ".js"]) {
        const src = readFileSync(join(HERE, `${name}${ext}`), "utf8");
        const registrations = src.split('process.on("uncaughtException"').length - 1;
        expect(registrations, `${name}${ext}: handler registrations`).toBe(1);
        const handlerAt = src.indexOf('process.on("uncaughtException"');
        const argvAt = src.indexOf("process.argv");
        expect(argvAt, `PREMISE: ${name}${ext} reads process.argv`).toBeGreaterThan(-1);
        expect(handlerAt, `${name}${ext}: the handler is registered before argv is read`).toBeLessThan(argvAt);
        expect(src.includes(FAULT_SPEC_ENV), `${name}${ext} names ${FAULT_SPEC_ENV}`).toBe(false);
        expect(src.includes(FAULT_LOG_ENV), `${name}${ext} names ${FAULT_LOG_ENV}`).toBe(false);
      }
    });
  }
});
