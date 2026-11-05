// claim-read-sites.test.ts — READ-1 over every read site of claim.js (plan 41-05, RUN-02, RUN-05, T-41-22,
// RESEARCH Open Question 4, decided yes).
//
// THE RULE. In claim.js a read that fails is never a pass: it ends non-zero, it prints no success line, and it never
// reads as "no data". `free` is the number a refill trusts, so a failed read that printed a number would over-spawn,
// and a failed read that printed a clean sweep would hide stale work. The one exit 1 a failed read can reach is `done`
// printing `not-done`, because a note that could not be read does not count as a note.
//
// WHY THIS IS ITS OWN FILE. scripts/runnable-ref/read-sites.test.ts holds the rule for the three runnables of phase 37
// through a row-per-site table of 2,457 lines, and a fourth name in its RUNNABLES would pull its shape and owner tables
// along. This file keeps the rule and the derivation and needs no hand table: every site comes from deriveReadSites and
// callingSites, and each pair must fire in at least one mode. A pair with a reason to differ is listed by name in
// UNREACHED below, and that map's size is pinned.
//
// HOW A SITE IS FAILED. The committed .js is copied into a scratch directory and run under the fault-injection preload,
// so the named node:fs call throws EIO when the stack holds the site line and, for a shared reader, the line of one
// calling call expression. Every pair runs in every mode on a fresh mkdtempSync fixture, so a mode that reaches a site
// is judged wherever it reaches it. Nothing here reads or writes grugops's own state.
//
// MODES. `now-running-new-queue` is `now-running` on a repository with no queue: the only fixture that reaches the
// question ensureQueueDirs asks again after it creates a directory.

import { describe, it, expect, afterAll } from "vitest";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import * as ctxio from "../context-io.js";
import {
  FS_OTHER_FNS,
  FS_READ_FNS,
  callingSites,
  classifiedFsCalls,
  deriveReadSites,
  hasNodeStack,
  runFaulted,
  scriptUrl,
  treeDigest,
  type FaultedRun,
  type ReadSite,
} from "../fault-inject.test-support.js";
import {
  CONTEXT_REL,
  GRUGOPS_DIR_REL,
  QUEUE_CLAIMED_REL,
  QUEUE_DONE_REL,
  QUEUE_PENDING_REL,
} from "../../install/state-layout.js";

const MODES = ["claim", "done", "sweep", "free", "now-running", "now-running-new-queue"] as const;
type Mode = (typeof MODES)[number];

/**
 * The derived read sites of claim.js.
 * 2026-11-05, plan 41-05: 18. Seven are this program's alone, in no owner it shares with the three phase-37 runnables:
 * the record reads of the queue (queueEntry, readClaimRecord) and the claimed/ walks of sweepStale, sweepQueue,
 * claimedCount, renderNowRunning and refuseClaimLinks.
 */
const CLAIM_READ_SITES = 18;

/**
 * A (site, via) pair no fixture reaches, by `<key>` or `<key> via <via>`, with a one-line reason. A pair belongs here
 * only when it fired no fault and the preload counted no call at it in every mode. Expected empty; its size is pinned.
 */
const UNREACHED: ReadonlyMap<string, string> = new Map();
const UNREACHED_SIZE = 0;

/**
 * The node:fs names claim.js uses that neither shared list holds. rmSync stays here, not in FS_OTHER_FNS, because
 * scripts/runnable-ref/read-sites.test.ts holds that every name there is used by its three runnables, and none uses it.
 */
const OWN_OTHER_FNS: readonly string[] = ["rmSync"];

/** Exit 1 is an outcome, so a failed read reaches it only where the outcome is `not-done`. */
const ALLOWED_STATUS: Record<Mode, readonly number[]> = {
  claim: [2],
  done: [1, 2],
  sweep: [2],
  free: [2],
  "now-running": [2],
  "now-running-new-queue": [2],
};

/** A success line of any command. `not-done` opens with another word, so it is no success line. */
const SUCCESS_LINE = /^(claimed|done|free|swept|rendered) /m;

/** A sentence that says a change happened for certain; a message says this only over a tree that changed. */
const CERTAIN_CHANGE = /stays claimed|moved to done\/ and|and that stands|directories were created/;

/** What stderr says when a queue change stands, for each mode that makes one. */
const CHANGE_NAMED: Record<Mode, RegExp | null> = {
  claim: /t1 was claimed by grugops-qe-e2e and stays claimed\./,
  done: /t1 moved to done\/ and its claim was released\.|t1 may already have moved to done\//,
  sweep: /The sweep may have moved tasks before it stopped|reclaimed s1|released s2/,
  free: null,
  "now-running": null,
  "now-running-new-queue": /Empty queue directories were created/,
};

const CLAIM_JS = join(import.meta.dirname, "claim.js");

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/** The committed .js, copied alone beside only a package.json, as the sibling tests copy it. */
function hostCopy(): string {
  const host = mkTmp("grugops-claim-read-host-");
  const js = join(host, "claim.js");
  copyFileSync(CLAIM_JS, js);
  writeFileSync(join(host, "package.json"), '{"type":"module"}\n');
  return js;
}

const HOST_JS = hostCopy();

/** One derived (site, via) pair, with the lines the preload matches. */
interface DerivedPair {
  readonly site: ReadSite;
  readonly via?: { readonly id: string; readonly line: number };
}

/** `<key>` or `<key> via <via>`: one pair's identity. */
function pairId(pair: DerivedPair): string {
  return pair.via === undefined ? pair.site.key : `${pair.site.key} via ${pair.via.id}`;
}

/** Every (site, via) pair: one per site, or one per calling call expression of a shared reader. */
function derivedPairs(js: string): readonly DerivedPair[] {
  const out: DerivedPair[] = [];
  for (const site of deriveReadSites(js)) {
    const callers = site.enclosing === "<top>" ? [] : callingSites(js, site.enclosing);
    if (callers.length < 2) {
      out.push({ site });
      continue;
    }
    const ordinals = new Map<string, number>();
    for (const c of callers) {
      const ordinal = ordinals.get(c.scope) ?? 0;
      ordinals.set(c.scope, ordinal + 1);
      out.push({ site, via: { id: `${c.scope}#${ordinal}`, line: c.line } });
    }
  }
  return out;
}

const PAIRS = derivedPairs(HOST_JS);

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────

function subtask(task: string): string {
  return `# subtask ${task}\nref: .grugops/context/${task}/\n`;
}

/** A claim of `task` taken at `at`, written as the program writes it, with its subtask unless `held` is false. */
function plantClaim(root: string, task: string, at: string, held = true): void {
  const dir = join(root, QUEUE_CLAIMED_REL, task);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "claim.md"), `---\nby: x\nagent: x\nat: ${at}\ntask: ${task}\n---\n`);
  if (held) writeFileSync(join(dir, `${task}.md`), subtask(task));
}

/** A sealed note, built as scripts/runnable-ref/claim.test.ts builds it. */
function sealedNote(name: string, at: string): string {
  const fence =
    `id: ${name}\n` +
    "kind: observation\n" +
    "by: x\n" +
    `at: ${at}\n` +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    "supersedes: \n";
  const rest = "---\n\n" + "an observation the task published.\n";
  return "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
}

/** A repository with the three queue stages, the seed's queue dial and a live claim the render has to read. */
function queueRepo(): string {
  const root = mkTmp("grugops-claim-read-repo-");
  for (const rel of [QUEUE_PENDING_REL, QUEUE_CLAIMED_REL, QUEUE_DONE_REL]) mkdirSync(join(root, rel), { recursive: true });
  writeFileSync(
    join(root, GRUGOPS_DIR_REL, "factory.config.json"),
    '{"queue":{"wip_limit":3,"claim_cap":2,"stale_ttl_minutes":30}}\n',
  );
  plantClaim(root, "live", new Date().toISOString());
  return root;
}

/** A fresh fixture for `mode`; every mode has what it needs to reach its reads to the end. */
function fixture(mode: Mode): string {
  if (mode === "now-running-new-queue") {
    const bare = mkTmp("grugops-claim-read-bare-");
    mkdirSync(join(bare, GRUGOPS_DIR_REL));
    return bare;
  }
  const root = queueRepo();
  if (mode === "claim") writeFileSync(join(root, QUEUE_PENDING_REL, "t1.md"), subtask("t1"));
  if (mode === "done") {
    const claimedAt = Date.now() - 60_000;
    plantClaim(root, "t1", new Date(claimedAt).toISOString());
    const notes = join(root, CONTEXT_REL, "t1", "notes");
    mkdirSync(notes, { recursive: true });
    writeFileSync(join(notes, "n1.md"), sealedNote("n1", new Date(claimedAt + 1000).toISOString()));
  }
  if (mode === "sweep") {
    plantClaim(root, "s1", "2020-01-01T00:00:00.000Z");
    plantClaim(root, "s2", new Date().toISOString(), false);
    writeFileSync(join(root, QUEUE_DONE_REL, "s2.md"), subtask("s2"));
  }
  return root;
}

const MODE_ARGS: Record<Mode, readonly string[]> = {
  claim: ["claim", "t1", "--by", "grugops-qe-e2e"],
  done: ["done", "t1"],
  sweep: ["sweep"],
  free: ["free"],
  "now-running": ["now-running"],
  "now-running-new-queue": ["now-running"],
};

interface PairRun {
  readonly r: FaultedRun;
  readonly before: ReadonlyMap<string, string>;
  readonly after: ReadonlyMap<string, string>;
  readonly all: string;
}

/** `pair` failed with EIO on a fresh fixture in `mode`, with the tree digests before and after. */
function runPair(pair: DerivedPair, mode: Mode): PairRun {
  const root = fixture(mode);
  const url = scriptUrl(HOST_JS);
  const before = treeDigest(root);
  const r = runFaulted(
    HOST_JS,
    [...MODE_ARGS[mode], "--root", root],
    {
      kind: "fs",
      fn: pair.site.fn,
      site: { url, line: pair.site.line },
      ...(pair.via === undefined ? {} : { via: { url, line: pair.via.line } }),
      code: "EIO",
    },
    { scratch: mkTmp("grugops-claim-read-fault-"), cwd: dirname(HOST_JS) },
  );
  const after = treeDigest(root);
  const all = `${mode}, ${pairId(pair)}, line ${pair.site.line}, status ${r.status}, stdout ${JSON.stringify(r.stdout)}, stderr ${JSON.stringify(r.stderr)}`;
  return { r, before, after, all };
}

/** The read rule on one run in which the fault fired. */
function assertReadRule(mode: Mode, run: PairRun): void {
  const { r, before, after, all } = run;
  expect(r.signal, all).toBeNull();
  expect(ALLOWED_STATUS[mode], all).toContain(r.status);
  expect(SUCCESS_LINE.test(r.stdout), `a success line after a failed read: ${all}`).toBe(false);
  expect(hasNodeStack(r.stderr), `a Node stack trace: ${all}`).toBe(false);
  if (r.status === 2) {
    expect(r.stdout, all).toBe("");
    expect(r.stderr.startsWith("Error: "), all).toBe(true);
    expect(r.stderr.trimEnd().split("\n"), all).toHaveLength(1);
  } else {
    expect(r.stdout.startsWith("not-done t1: "), all).toBe(true);
  }
  const changed = JSON.stringify([...after]) !== JSON.stringify([...before]);
  if (!changed) {
    expect(CERTAIN_CHANGE.test(r.stderr), `the tree is as it was, and the message says a change stands: ${all}`).toBe(false);
    return;
  }
  expect(r.stderr, `the tree changed, and the message denies it: ${all}`).not.toContain("The queue was not changed.");
  const named = CHANGE_NAMED[mode];
  expect(named, `the tree changed in a mode that never changes it: ${all}`).not.toBeNull();
  expect((named as RegExp).test(r.stderr), `the tree changed, and the message does not name it: ${all}`).toBe(true);
}

describe("READ-1 on claim.js: the derivation (plan 41-05, T-41-22)", () => {
  it("the derived site count is pinned", () => {
    console.log(`claim.js: ${deriveReadSites(HOST_JS).length} read sites, ${PAIRS.length} (site, via) pairs`);
    expect(deriveReadSites(HOST_JS).length).toBe(CLAIM_READ_SITES);
  });

  it("the reached and unreached counts are printed, and the unreached count is the pinned size of UNREACHED", () => {
    console.log(`claim.js: ${PAIRS.length - UNREACHED.size} pairs reached, ${UNREACHED.size} unreached`);
    console.log(`UNREACHED (${UNREACHED.size}): ${[...UNREACHED].map(([k, v]) => `${k}: ${v}`).join("; ") || "none"}`);
    expect(UNREACHED.size).toBe(UNREACHED_SIZE);
  });

  it("every name in UNREACHED is a derived pair", () => {
    const ids = PAIRS.map(pairId);
    for (const name of UNREACHED.keys()) expect(ids, name).toContain(name);
  });

  it("no derived site is an existence test: it reads a failure as absence", () => {
    expect(deriveReadSites(HOST_JS).filter((s) => s.fn === "existsSync").map((s) => s.key)).toEqual([]);
    expect(classifiedFsCalls(HOST_JS)).not.toContain("existsSync");
  });

  it("every node:fs name claim.js uses is a read, a shared non-read, or this file's own", () => {
    const known = new Set<string>([...FS_READ_FNS, ...FS_OTHER_FNS, ...OWN_OTHER_FNS]);
    const used = classifiedFsCalls(HOST_JS);
    for (const name of used) expect(known.has(name), `claim.js uses node:fs ${name}, which is not classified`).toBe(true);
    for (const name of OWN_OTHER_FNS) {
      expect(used, `${name} is listed here and claim.js does not use it`).toContain(name);
      expect(FS_OTHER_FNS as readonly string[], `${name} moved to the shared list, so it does not belong here`).not.toContain(name);
    }
  });
});

describe("READ-1 on claim.js: every derived pair, failed, is never a pass (plan 41-05, RUN-02, T-41-22)", () => {
  for (const pair of PAIRS) {
    it(pairId(pair), () => {
      const fired: Mode[] = [];
      let siteNotVia = 0;
      for (const mode of MODES) {
        const run = runPair(pair, mode);
        siteNotVia += run.r.siteNotVia;
        if (run.r.fired === 0) {
          expect(run.r.status, `PREMISE: a run this pair does not reach succeeds: ${run.all}`).toBe(0);
          continue;
        }
        fired.push(mode);
        assertReadRule(mode, run);
      }
      const reason = UNREACHED.get(pairId(pair));
      if (reason === undefined) {
        expect(fired.length, `no mode reached ${pairId(pair)} (site-not-via ${siteNotVia})`).toBeGreaterThan(0);
      } else {
        expect(fired, `${pairId(pair)} is listed as unreached, and these modes reach it`).toEqual([]);
        expect(siteNotVia, `${pairId(pair)} is listed as unreached, and the preload counted a call at it`).toBe(0);
      }
    });
  }
});

describe("READ-1 on claim.js: the reads that have a named consequence (plan 41-05, RUN-02)", () => {
  /** The pairs of `enclosing`, under the caller `scope` when one is given. */
  function pairsOf(enclosing: string, scope?: string): readonly DerivedPair[] {
    const found = PAIRS.filter(
      (p) => p.site.enclosing === enclosing && (scope === undefined || p.via?.id.startsWith(`${scope}#`) === true),
    );
    expect(found.length, `PREMISE: ${enclosing} has a derived pair${scope === undefined ? "" : ` under ${scope}`}`).toBeGreaterThan(0);
    return found;
  }

  it("a note that could not be read does not count: `done` ends in exit 1 or 2, and the task stays claimed", () => {
    for (const pair of pairsOf("readRegularFileOrNull", "readRawNotesWithSkips")) {
      const run = runPair(pair, "done");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect([1, 2], run.all).toContain(run.r.status);
      expect(run.after, `nothing moved: ${run.all}`).toEqual(run.before);
    }
  });

  it("a failed count prints no number: `free` is exit 2 with an empty stdout at the claimed/ walk", () => {
    for (const pair of pairsOf("claimedCount")) {
      const run = runPair(pair, "free");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect(run.r.status, run.all).toBe(2);
      expect(run.r.stdout, run.all).toBe("");
      expect(run.r.stderr, run.all).toContain(`${QUEUE_CLAIMED_REL} could not be read (EIO)`);
    }
  });

  it("a failed config read prints no number: `free` is exit 2 and names the config", () => {
    for (const pair of pairsOf("readRegularFileOrNull", "recordTextOrNull")) {
      const run = runPair(pair, "free");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect(run.r.status, run.all).toBe(2);
      expect(run.r.stdout, run.all).toBe("");
      expect(run.r.stderr, run.all).toContain("factory.config.json");
    }
  });

  it("a failed walk of claimed/ is no clean sweep: `sweep` is exit 2 and prints no `swept` line", () => {
    for (const pair of [...pairsOf("refuseClaimLinks"), ...pairsOf("sweepQueue"), ...pairsOf("sweepStale")]) {
      const run = runPair(pair, "sweep");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect(run.r.status, run.all).toBe(2);
      expect(run.r.stdout, run.all).toBe("");
    }
  });

  it("a mode that changes nothing leaves the tree as it was, wherever a read fails", () => {
    for (const pair of PAIRS) {
      const run = runPair(pair, "free");
      expect(run.after, `free wrote something: ${run.all}`).toEqual(run.before);
    }
  });
});
