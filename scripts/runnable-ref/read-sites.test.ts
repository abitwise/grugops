// read-sites.test.ts — READ-1 over every read site of the three host runnables (plan 37-25, D-17,
// 37-GAP-PLANNING-BRIEF.md §1 READ-1 and §2.1).
//
// THE RULE. In trace-render, state-check and state-roll, a read that fails is either could-not-run (exit 2, an
// empty stdout) or a named finding (exit 1, a finding line). It is never "no data", never a pass, and never lets a
// write mode write or remove anything.
//
// WHERE THE SITES COME FROM. Every site is derived from the COMMITTED .js by scripts/fault-inject.test-support.ts
// (deriveReadSites): each call whose callee resolves through the file's own node:fs bindings to a read function.
// Nothing here lists a line. A site inside a function entered from two or more call expressions (callingSites) is
// failed once per calling call expression (`via`), so a shared reader is failed under every caller.
//
// HOW A SITE IS FAILED. The runnable is a byte copy of the committed .js in a scratch directory, run with the
// fault-injection preload (`node --import`): the named node:fs call throws EIO when the stack holds the site line
// and, for a via row, the via line. Every fixture is an mkdtempSync directory; nothing reads or writes grugops's own
// state, the user's home or ~/.grugops.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { CONTEXT_ARCHIVE_REL, CONTEXT_REL, TRACE_DIR_REL, TRACEABILITY_REL } from "../../install/state-layout.js";
import { deriveReadSites, hasNodeStack, runFaulted, scriptUrl, treeDigest, type ReadSite } from "../fault-inject.test-support.js";

const HERE = import.meta.dirname;

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

/** The committed trace-render.js, copied alone into a scratch directory. */
const TRACE_RENDER_JS = (() => {
  const js = join(mkTmp("grugops-read-sites-trace-render-"), "trace-render.js");
  copyFileSync(join(HERE, "trace-render.js"), js);
  return js;
})();

/** The text of a sealed note carrying `refs`, sealed through the committed seal export. */
function noteText(name: string, refs: readonly string[]): string {
  const fence =
    `id: ${name}\n` +
    "kind: artifact-ref\n" +
    "by: engineer\n" +
    "at: 2026-10-22T10:00:00Z\n" +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    refs.map((r) => `  - ${r}`).join("\n") +
    "\n" +
    "supersedes: \n";
  const rest = "---\n\n" + "an artifact-ref note carrying trace refs.\n";
  return "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
}

/** Write `text` at the repository-relative `rel` under `root`, creating its directory. */
function plant(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text, "utf8");
}

/** A two-root repository with one sealed note per root, rendered by the copied trace-render. */
function renderedTraceRepo(): string {
  const root = mkTmp("grugops-read-sites-trace-repo-");
  plant(root, `${CONTEXT_REL}/taskA/notes/n1.md`, noteText("n1", ["ABC-001", "src/a.ts"]));
  plant(root, `${CONTEXT_ARCHIVE_REL}/taskB/notes/n2.md`, noteText("n2", ["ABC-002", "#41"]));
  mkdirSync(join(root, ...TRACE_DIR_REL.split("/")), { recursive: true });
  const r = spawnSync(process.execPath, [TRACE_RENDER_JS, root], { encoding: "utf8", cwd: dirname(TRACE_RENDER_JS) });
  expect(r.status, `PREMISE: the fixture renders\n${r.stdout}\n${r.stderr}`).toBe(0);
  expect(r.stdout, "PREMISE: the render wrote the index and two trace files").toContain("3 file(s) written");
  return root;
}

/** The one derived site of `js` whose key is `key`. */
function siteOf(js: string, key: string): ReadSite {
  const found = deriveReadSites(js).filter((s) => s.key === key);
  expect(found.map((s) => s.key), `PREMISE: exactly one derived site of ${js} is ${key}`).toEqual([key]);
  return found[0] as ReadSite;
}

describe("READ-1 tracer: a derived read site of a runnable, failed end to end (plan 37-25, D-17)", () => {
  it("trace-render write mode, EIO at the note walk's readdirSync: exit 2 naming the task, nothing written", () => {
    const root = renderedTraceRepo();
    const site = siteOf(TRACE_RENDER_JS, "readRawNotesWithSkips:readdirSync#0");
    expect(site.fn).toBe("readdirSync");
    const before = treeDigest(root);
    expect(before.has(TRACEABILITY_REL), "PREMISE: the index was rendered").toBe(true);
    const r = runFaulted(
      TRACE_RENDER_JS,
      [root],
      { kind: "fs", fn: site.fn, site: { url: scriptUrl(TRACE_RENDER_JS), line: site.line }, code: "EIO" },
      { scratch: mkTmp("grugops-read-sites-fault-"), cwd: dirname(TRACE_RENDER_JS) },
    );
    const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(r.fired, `PREMISE: the fault fired (site-not-via ${r.siteNotVia}, site line ${site.line})\n${all}`).toBeGreaterThan(0);
    expect(r.status, all).toBe(2);
    expect(r.stdout, all).toBe("");
    expect(hasNodeStack(r.stderr), all).toBe(false);
    expect(r.stderr, all).toContain(`UNREADABLE TASK ${CONTEXT_REL}/taskA`);
    expect(r.stderr, all).toContain("EIO");
    expect(treeDigest(root), "nothing was written, changed or removed").toEqual(before);
  });
});
