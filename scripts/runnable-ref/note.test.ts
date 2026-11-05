// note.test.ts — the host note writer (phase 41, plan 41-07, RUN-02, RUN-05, D-28, D-35).
//
// Every case runs the COMMITTED note.js and the COMMITTED claim.js copied into one empty temporary directory beside
// only a package.json, with no node_modules and no sibling script reachable: the host emulation that proves a spawned
// role with no MCP tool can write the sealed note `claim.js done` requires. This file imports nothing from the
// context-io module. That import is how the validation map went green while the truth failed (41-VERIFICATION.md), so
// the one reach into the authority is `node scripts/context-io.js validate` run as a child process.
//
//   exit 0 → stdout holds `noted FOLDER ID`
//   exit 1 → an outcome to act on: `refused FOLDER: REASON`, and nothing was written
//   exit 2 → could not run or refused, with nothing on stdout and one `Error: ` line on stderr

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONTEXT_REL, GRUGOPS_DIR_REL, QUEUE_CLAIMED_REL, QUEUE_DONE_REL, QUEUE_PENDING_REL } from "../../install/state-layout.js";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const CONTEXT_IO_JS = join(REPO_ROOT, "scripts", "context-io.js");

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

let hostMemo: string | undefined;

/** Both committed programs, copied into one empty directory beside only a package.json. */
function hostDir(): string {
  if (hostMemo !== undefined) return hostMemo;
  const host = mkTmp("grugops-note-host-");
  for (const name of ["claim.js", "note.js"]) {
    const committed = join(import.meta.dirname, name);
    expect(existsSync(committed), `the committed program ${name} exists`).toBe(true);
    copyFileSync(committed, join(host, name));
  }
  writeFileSync(join(host, "package.json"), '{"type":"module"}\n');
  hostMemo = host;
  return host;
}

/** The ambient names that would answer the dial before the fixture does. */
const AMBIENT_ROOT_NAMES = new Set(["CLAUDE_PROJECT_DIR", "GRUGOPS_PROJECT_DIR", "GRUGOPS_HOST_DELIVERED_ROOT"]);

/** This process's environment without those names, so the dial comes from the fixture. */
const HOST_ENV = Object.fromEntries(Object.entries(process.env).filter(([name]) => !AMBIENT_ROOT_NAMES.has(name)));

interface Ran {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** One host program run with its working directory in `cwd`. */
function host(program: "claim.js" | "note.js", cwd: string, ...args: string[]): Ran {
  const r = spawnSync(process.execPath, [join(hostDir(), program), ...args], {
    encoding: "utf8",
    cwd,
    env: HOST_ENV,
    timeout: 15_000,
  });
  expect(r.error, "the program did not finish in bounded time").toBeUndefined();
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

const claim = (cwd: string, ...args: string[]): Ran => host("claim.js", cwd, ...args);
const note = (cwd: string, ...args: string[]): Ran => host("note.js", cwd, ...args);

function subtask(task: string): string {
  return `# subtask ${task}\nref: .grugops/context/${task}/\n`;
}

/** A repository whose pending stage holds each of `tasks`. */
function repo(...tasks: string[]): string {
  const root = mkTmp("grugops-note-repo-");
  mkdirSync(join(root, GRUGOPS_DIR_REL));
  mkdirSync(join(root, QUEUE_PENDING_REL), { recursive: true });
  for (const task of tasks) writeFileSync(join(root, QUEUE_PENDING_REL, `${task}.md`), subtask(task));
  return root;
}

/** The flags of a routine note that every case below varies from. */
const OBSERVATION = ["--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--ref", "ABC-1", "--body", "x"];

/** The directory the notes of `folder` land in. */
const notesDir = (root: string, folder: string): string => join(root, CONTEXT_REL, folder, "notes");

/** The note files of `folder`, in name order; none when the directory is absent. */
function noteFiles(root: string, folder: string): string[] {
  const dir = notesDir(root, folder);
  return existsSync(dir) ? readdirSync(dir).sort() : [];
}

/** The number `free` prints, read from its one line. */
function freeCount(root: string): number {
  const r = claim(root, "free");
  expect(r.status, r.stderr).toBe(0);
  const m = /^free (-?\d+)/.exec(r.stdout);
  expect(m, r.stdout).not.toBeNull();
  return Number((m as RegExpExecArray)[1]);
}

describe("the lone host copy (D-35, CR-01)", () => {
  it("a lone host copy takes a claimed task from not-done to done through note.js", () => {
    const root = repo("t1");
    const before = freeCount(root);

    const claimed = claim(root, "claim", "t1", "--by", "grugops-qe-e2e");
    expect(claimed.status, claimed.stderr).toBe(0);
    expect(freeCount(root)).toBe(before - 1);

    const early = claim(root, "done", "t1");
    expect(early.status).toBe(1);
    expect(early.stdout).toMatch(/^not-done t1: no sealed note/);

    const written = note(root, "add", "t1", ...OBSERVATION);
    expect(written.status, written.stderr).toBe(0);
    expect(written.stdout).toMatch(/^noted t1 \S+\n$/);
    expect(written.stderr).toBe("");

    const finished = claim(root, "done", "t1");
    expect(finished.status, finished.stderr).toBe(0);
    expect(finished.stdout).toBe("done t1\n");
    expect(existsSync(join(root, QUEUE_DONE_REL, "t1.md"))).toBe(true);
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1"))).toBe(false);
    expect(freeCount(root)).toBe(before);
  });

  it("a hand-written note stays unsealed: alone it gets not-done naming it, and beside a note.js note it is not read", () => {
    const root = repo("t1");
    expect(claim(root, "claim", "t1", "--by", "grugops-qe-e2e").status).toBe(0);
    mkdirSync(notesDir(root, "t1"), { recursive: true });
    const hand = "20260101T000000Z-qe-e2e-observation-abcd.md";
    writeFileSync(
      join(notesDir(root, "t1"), hand),
      "---\nkind: observation\nby: qe-e2e\nat: 2099-01-01T00:00:00.000Z\nconfidence: high\n---\n\nby hand\n",
    );

    const refused = claim(root, "done", "t1");
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("unsealed");
    expect(refused.stdout).toContain(hand);

    const written = note(root, "add", "t1", ...OBSERVATION);
    expect(written.status, written.stderr).toBe(0);
    const id = (written.stdout.trim().split(" ")[2] as string).trim();
    const index = readFileSync(join(root, CONTEXT_REL, "t1", "index.jsonl"), "utf8");
    expect(index, "the sealed note is indexed").toContain(id);
    expect(index, "the hand-written note is not").not.toContain("abcd");
  });

  it("the note file's fence ends in one seal line, and the authority's own validate accepts the file", () => {
    const root = repo();
    const written = note(root, "add", "t1", ...OBSERVATION);
    expect(written.status, written.stderr).toBe(0);
    const id = written.stdout.trim().split(" ")[2] as string;
    const file = join(notesDir(root, "t1"), `${id}.md`);
    expect(noteFiles(root, "t1")).toEqual([`${id}.md`]);

    const fence = readFileSync(file, "utf8").split("\n---\n")[0] as string;
    const lines = fence.split("\n");
    expect(lines[lines.length - 1]).toMatch(/^seal: sha256:[0-9a-f]{64}$/);
    expect(lines.filter((l) => l.startsWith("seal:"))).toHaveLength(1);

    const validated = spawnSync(process.execPath, [CONTEXT_IO_JS, "validate", file], { encoding: "utf8", timeout: 15_000 });
    expect(validated.status, validated.stdout + validated.stderr).toBe(0);
  });

  it("the writer's refusal is one line on stdout and exit 1, and writes nothing", () => {
    const root = repo();
    const refused = note(root, "add", "t1", "--kind", "finding", "--by", "qe-e2e", "--confidence", "high", "--body", "x");
    expect(refused.status).toBe(1);
    expect(refused.stderr).toBe("");
    expect(refused.stdout).toMatch(/^refused t1: .+\n$/);
    expect(refused.stdout.trimEnd().split("\n")).toHaveLength(1);
    expect(existsSync(join(root, CONTEXT_REL)), "nothing was written").toBe(false);
  });
});
