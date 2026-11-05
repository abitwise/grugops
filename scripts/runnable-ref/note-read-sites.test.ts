// note-read-sites.test.ts — READ-1 over every read site of note.js (plan 41-12, RUN-02, RUN-05, T-41-52).
//
// THE RULE. A sealed note decides whether `claim.js done` frees a slot, so a read that fails in note.js never reports a
// note: it never ends exit 0 and it never prints `noted`. It ends exit 2 with one `Error: ` line, or exit 1 with one
// `refused` line, because admit() refuses on an unreadable config. If the failed read came after the note stood, the run
// is exit 2 and the line names that note, so a failed render never denies a note that was written.
//
// WHY THIS IS ITS OWN FILE. It follows scripts/runnable-ref/claim-read-sites.test.ts: no hand table, every site comes
// from deriveReadSites and callingSites over the committed program, and each pair must fire in at least one mode. A pair
// no fixture reaches is listed by name in UNREACHED below, and that map's size is pinned. A pair that fires is judged
// by the rule, whichever part of the program holds it; a red row is never fixed by moving the pair into that map.
//
// HOW A SITE IS FAILED. The committed .js is copied into a scratch directory and run under the fault-injection preload,
// so the named node:fs call throws EIO when the stack holds the site line and, for a shared reader, the line of one
// calling call expression. Every pair runs in every mode on a fresh copy of that mode's fixture, so a mode that reaches a
// site is judged wherever it reaches it. existsSync never throws, so the preload fails it the way the platform does:
// it answers false. Nothing here reads or writes grugops's own state.
//
// THE ROOT. note.js has no root flag: the store is the working directory's, and the dial comes from trustedRepoRoot().
// Each run names all three ambient root names, blank or set by its mode, so the dial comes from the fixture.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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
import { CONTEXT_REL, GRUGOPS_DIR_REL } from "../../install/state-layout.js";

const MODES = ["observation", "retained", "gate-finding", "body-file", "delivered", "ambient", "home"] as const;
type Mode = (typeof MODES)[number];

/**
 * The derived read sites of note.js.
 * 2026-11-05, plan 41-12: 22. Eight are this program's alone among the runnables, the root ladder of trustedRepoRoot():
 * canonicalDirectoryPath, directoryIdentity, projectRootFromWorkingDirectory, hostDeliveredRoot and isExistingDirectory.
 */
const NOTE_READ_SITES = 22;

const NOTE_ID_ONLY_BY_THE_CLOCK =
  "The id carries the time of the run and no flag sets it, so no fixture can plant a note at the destination.";

/**
 * A (site, via) pair no fixture reaches, by `<key>` or `<key> via <via>`, with a one-line reason. A pair belongs here
 * only when it fired no fault in every mode. Its size is pinned.
 */
const UNREACHED: ReadonlyMap<string, string> = new Map([
  ["readRegularFileOrNull:fstatSync#0 via decideNoteDestination#0", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:readSync#0 via decideNoteDestination#0", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:openSync#0 via ledgerRecordsId#0", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:fstatSync#0 via ledgerRecordsId#0", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:readSync#0 via ledgerRecordsId#0", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:openSync#0 via publishNoteExclusive#0", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:fstatSync#0 via publishNoteExclusive#0", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:readSync#0 via publishNoteExclusive#0", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:openSync#0 via publishNoteExclusive#1", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:fstatSync#0 via publishNoteExclusive#1", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["readRegularFileOrNull:readSync#0 via publishNoteExclusive#1", NOTE_ID_ONLY_BY_THE_CLOCK],
  ["canonicalDirectoryPath:realpathSync#0 via canonicalWorkingDirectory#0", "Rung 2 runs only after rung 1 threw, and rung 1 answers for the working directory."],
  ["canonicalDirectoryPath:realpathSync#0 via homeConfigPositionIsProjectOwned#0", "Rung 2 runs only after rung 1 threw, and rung 1 answers for a position that exists."],
  ["canonicalDirectoryPath:realpathSync#0 via homeBoundary#0", "Rung 2 runs only after rung 1 threw, and rung 1 answers for a home directory that exists."],
  ["canonicalDirectoryPath:realpathSync#0 via hostDeliveredRoot#0", "Rung 2 runs only after rung 1 threw, and rung 1 answers for a delivered root that exists."],
  ["canonicalDirectoryPath:realpathSync#0 via hostDeliveredRoot#1", "Rung 2 runs only after rung 1 threw, and rung 1 answers for the fallback base."],
  ["canonicalDirectoryPath:realpathSync#0 via trustedRepoRoot#0", "Rung 2 runs only after rung 1 threw, and rung 1 answers for an ambient root that exists."],
]);
const UNREACHED_SIZE = 17;

/** The node:fs names note.js uses that neither shared list holds. */
const OWN_OTHER_FNS: readonly string[] = ["linkSync", "writeSync"];

/** The success line of `add`. */
const SUCCESS_LINE = /^noted /m;

/** What stderr says when a note stands. */
const NOTE_NAMED = /Note \S+ stands in |The note may have been written/;

const NOTE_JS = join(import.meta.dirname, "note.js");
const CONTEXT_IO_JS = join(import.meta.dirname, "..", "context-io.js");

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
  const host = mkTmp("grugops-note-read-host-");
  const js = join(host, "note.js");
  copyFileSync(NOTE_JS, js);
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

/** A sealed note, built as scripts/runnable-ref/claim-read-sites.test.ts builds it. */
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

/** A repository with a boundary marker, a config, a body file and, when asked, a sealed note and a live green verdict. */
function template(config: string, sealed: boolean, verdict: boolean): string {
  const root = mkTmp("grugops-note-read-repo-");
  mkdirSync(join(root, ".git"));
  mkdirSync(join(root, GRUGOPS_DIR_REL));
  writeFileSync(join(root, GRUGOPS_DIR_REL, "factory.config.json"), config);
  writeFileSync(join(root, "body.md"), "a body from a file\n");
  if (sealed) {
    const notes = join(root, CONTEXT_REL, "t1", "notes");
    mkdirSync(notes, { recursive: true });
    writeFileSync(join(notes, "n1.md"), sealedNote("n1", new Date().toISOString()));
  }
  if (verdict) {
    const r = spawnSync(process.execPath, [CONTEXT_IO_JS, "emit-verdict", "t1", "run1", "clean", "a".repeat(40), join(root, CONTEXT_REL)], {
      encoding: "utf8",
      timeout: 15_000,
    });
    expect(r.status, `PREMISE: the fixture stages a live green verdict\n${r.stdout}${r.stderr}`).toBe(0);
  }
  return root;
}

const OBSERVATION = ["add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--ref", "ABC-1", "--body", "x"];
const GATE_FINDING = ["add", "t1", "--kind", "finding", "--by", "qe-e2e", "--confidence", "high", "--verified-by", "§14-gate#run1", "--body", "x"];
const BODY_FILE = ["add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--body-file", "body.md"];

/** Every ambient name that would answer the dial before the fixture does, blank, so each mode sets only its own. */
const BLANK: Readonly<Record<string, string>> = { CLAUDE_PROJECT_DIR: "", GRUGOPS_PROJECT_DIR: "", GRUGOPS_HOST_DELIVERED_ROOT: "" };

interface ModeSpec {
  readonly fixture: string;
  readonly args: readonly string[];
  readonly env: (root: string) => Readonly<Record<string, string>>;
}

const LEAN = template("{}\n", false, false);

/** What each mode reaches: the note walk, the config read, the ledger, the body file, and each rung of the root ladder. */
const MODE_SPEC: Record<Mode, ModeSpec> = {
  observation: { fixture: LEAN, args: OBSERVATION, env: () => BLANK },
  retained: { fixture: template('{"context":{"audit_retention":"retained"}}\n', true, false), args: OBSERVATION, env: () => BLANK },
  "gate-finding": { fixture: template("{}\n", true, true), args: GATE_FINDING, env: () => BLANK },
  "body-file": { fixture: LEAN, args: BODY_FILE, env: () => BLANK },
  delivered: { fixture: LEAN, args: OBSERVATION, env: (root) => ({ ...BLANK, GRUGOPS_HOST_DELIVERED_ROOT: root }) },
  ambient: { fixture: LEAN, args: OBSERVATION, env: (root) => ({ ...BLANK, GRUGOPS_PROJECT_DIR: root }) },
  home: { fixture: LEAN, args: OBSERVATION, env: (root) => ({ ...BLANK, HOME: root }) },
};

interface PairRun {
  readonly r: FaultedRun;
  readonly before: ReadonlyMap<string, string>;
  readonly after: ReadonlyMap<string, string>;
  readonly all: string;
}

/** The note files in a tree digest. */
function noteKeys(digest: ReadonlyMap<string, string>): readonly string[] {
  return [...digest.keys()].filter((k) => k.startsWith(`${CONTEXT_REL}/t1/notes/`) && k.endsWith(".md"));
}

/** `pair` failed with EIO on a fresh copy of the fixture of `mode`, with the tree digests before and after. */
function runPair(pair: DerivedPair, mode: Mode): PairRun {
  const spec = MODE_SPEC[mode];
  const root = realpathSync(mkdtempSync(join(dirname(spec.fixture), "grugops-note-read-run-")));
  cpSync(spec.fixture, root, { recursive: true });
  const url = scriptUrl(HOST_JS);
  const before = treeDigest(root);
  const scratch = mkdtempSync(join(dirname(root), "grugops-note-read-fault-"));
  const r = runFaulted(
    HOST_JS,
    spec.args,
    {
      kind: "fs",
      fn: pair.site.fn,
      site: { url, line: pair.site.line },
      ...(pair.via === undefined ? {} : { via: { url, line: pair.via.line } }),
      code: "EIO",
    },
    { scratch, cwd: root, env: spec.env(root) },
  );
  const after = treeDigest(root);
  rmSync(root, { recursive: true, force: true });
  rmSync(scratch, { recursive: true, force: true });
  const all = `${mode}, ${pairId(pair)}, line ${pair.site.line}, status ${r.status}, stdout ${JSON.stringify(r.stdout)}, stderr ${JSON.stringify(r.stderr)}`;
  return { r, before, after, all };
}

/** The read rule on one run in which the fault fired. */
function assertReadRule(run: PairRun): void {
  const { r, before, after, all } = run;
  expect(r.signal, all).toBeNull();
  expect([1, 2], `a failed read ended exit ${r.status}: ${all}`).toContain(r.status);
  expect(SUCCESS_LINE.test(r.stdout), `a success line after a failed read: ${all}`).toBe(false);
  expect(hasNodeStack(r.stderr), `a Node stack trace: ${all}`).toBe(false);
  const written = noteKeys(after).length > noteKeys(before).length;
  if (r.status === 1) {
    expect(r.stdout.startsWith("refused t1: "), all).toBe(true);
    expect(r.stdout.trimEnd().split("\n"), all).toHaveLength(1);
    expect(r.stderr, all).toBe("");
    expect(written, `a refusal left a note behind: ${all}`).toBe(false);
    return;
  }
  expect(r.stdout, all).toBe("");
  expect(r.stderr.startsWith("Error: "), all).toBe(true);
  expect(r.stderr.trimEnd().split("\n"), all).toHaveLength(1);
  if (written) {
    expect(NOTE_NAMED.test(r.stderr), `a note stands, and the line does not name it: ${all}`).toBe(true);
    expect(r.stderr, `a note stands, and the line denies it: ${all}`).not.toContain("No note was written.");
  } else {
    expect(/Note \S+ stands in /.test(r.stderr), `no note stands, and the line names one: ${all}`).toBe(false);
  }
}

describe("READ-1 on note.js: the derivation (plan 41-12, T-41-52)", () => {
  it("the derived site count is pinned", () => {
    console.log(`note.js: ${deriveReadSites(HOST_JS).length} read sites, ${PAIRS.length} (site, via) pairs`);
    expect(deriveReadSites(HOST_JS).length).toBe(NOTE_READ_SITES);
  });

  it("the reached and unreached counts are printed, and the unreached count is the pinned size of UNREACHED", () => {
    console.log(`note.js: ${PAIRS.length - UNREACHED.size} pairs reached, ${UNREACHED.size} unreached`);
    console.log(`UNREACHED (${UNREACHED.size}): ${[...UNREACHED].map(([k, v]) => `${k}: ${v}`).join("; ") || "none"}`);
    expect(UNREACHED.size).toBe(UNREACHED_SIZE);
  });

  it("every name in UNREACHED is a derived pair", () => {
    const ids = PAIRS.map(pairId);
    for (const name of UNREACHED.keys()) expect(ids, name).toContain(name);
  });

  it("every node:fs name note.js uses is a read, a shared non-read, or this file's own", () => {
    const known = new Set<string>([...FS_READ_FNS, ...FS_OTHER_FNS, ...OWN_OTHER_FNS]);
    const used = classifiedFsCalls(HOST_JS);
    for (const name of used) expect(known.has(name), `note.js uses node:fs ${name}, which is not classified`).toBe(true);
    for (const name of OWN_OTHER_FNS) {
      expect(used, `${name} is listed here and note.js does not use it`).toContain(name);
      expect(FS_OTHER_FNS as readonly string[], `${name} moved to the shared list, so it does not belong here`).not.toContain(name);
    }
  });
});

describe("READ-1 on note.js: every derived pair, failed, never reports a note (plan 41-12, RUN-02, T-41-52)", () => {
  for (const pair of PAIRS) {
    it(pairId(pair), () => {
      const fired: Mode[] = [];
      for (const mode of MODES) {
        const run = runPair(pair, mode);
        if (run.r.fired === 0) {
          expect(run.r.status, `PREMISE: a run this pair does not reach succeeds: ${run.all}`).toBe(0);
          continue;
        }
        fired.push(mode);
        assertReadRule(run);
      }
      if (UNREACHED.has(pairId(pair))) expect(fired, `${pairId(pair)} is listed as unreached, and these modes reach it`).toEqual([]);
      else expect(fired.length, `no mode reached ${pairId(pair)}`).toBeGreaterThan(0);
    });
  }
});

describe("READ-1 on note.js: the reads that have a named consequence (plan 41-12, RUN-02)", () => {
  /** The pairs of `enclosing`, under the caller `scope` when one is given. */
  function pairsOf(enclosing: string, scope?: string): readonly DerivedPair[] {
    const found = PAIRS.filter(
      (p) => p.site.enclosing === enclosing && (scope === undefined || p.via?.id.startsWith(`${scope}#`) === true),
    );
    expect(found.length, `PREMISE: ${enclosing} has a derived pair${scope === undefined ? "" : ` under ${scope}`}`).toBeGreaterThan(0);
    return found;
  }

  it("a failed read of the config refuses the note: exit 1, and no note is written", () => {
    for (const pair of pairsOf("readRegularFileOrNull", "readGovernanceConfigCandidate")) {
      const run = runPair(pair, "observation");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect(run.r.status, run.all).toBe(1);
      expect(run.r.stdout, run.all).toContain("UNKNOWN - verify");
      expect(noteKeys(run.after), run.all).toEqual(noteKeys(run.before));
    }
  });

  it("a failed walk of the notes behind a gate-stamped finding refuses it: exit 1, and no note is written", () => {
    for (const pair of pairsOf("readRawNotesWithSkips", "readRawNotes")) {
      const run = runPair(pair, "gate-finding");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect(run.r.status, run.all).toBe(1);
      expect(noteKeys(run.after), run.all).toEqual(noteKeys(run.before));
    }
  });

  it("a failed read of the body file writes no note: exit 2", () => {
    for (const pair of pairsOf("readRegularFileOrNull", "bodyFromFile")) {
      const run = runPair(pair, "body-file");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect(run.r.status, run.all).toBe(2);
      expect(run.r.stderr, run.all).toContain("--body-file body.md could not be read");
      expect(run.after, run.all).toEqual(run.before);
    }
  });

  it("a failed walk at the render names the note that stands: exit 2, and the note is on disk", () => {
    for (const pair of pairsOf("readRawNotesWithSkips", "render")) {
      const run = runPair(pair, "observation");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect(run.r.status, run.all).toBe(2);
      expect(run.r.stderr, run.all).toContain("index.md and index.jsonl were not rendered.");
      expect(noteKeys(run.after).length, run.all).toBe(1);
    }
  });

  it("the just-written note failing to read at the render is no `noted`: exit 2, and the line names the note", () => {
    for (const pair of pairsOf("readRegularFileOrNull", "readRawNotesWithSkips")) {
      const run = runPair(pair, "observation");
      expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBeGreaterThan(0);
      expect(run.r.status, run.all).toBe(2);
      expect(run.r.stdout, run.all).toBe("");
      expect(run.r.stderr, run.all).toMatch(/Note \S+ stands in /);
      expect(noteKeys(run.after).length, run.all).toBe(1);
    }
  });
});
