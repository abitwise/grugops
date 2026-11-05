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
// site is judged wherever it reaches it. note.js holds no boolean probe: the root ladder asks entryPresence, whose reads
// throw, so every derived pair fails by throwing. Nothing here reads or writes grugops's own state.
//
// THE ROOT. note.js has no root flag: the store is the working directory's, and the dial comes from trustedRepoRoot().
// Each run names all three ambient root names, blank or set by its mode, so the dial comes from the fixture.
//
// THE ONE EXCEPTION, AND WHAT IT DOES NOT COVER (human ruling, 2026-11-05, at the plan 41-12 checkpoint). A row in
// SECOND_SOURCE below ends exit 0 after its read fails, because a designed second source gives the same answer. Such a
// row is not judged by THE RULE. It is judged by a stricter test: its run must equal an unfaulted run of the same mode,
// in the exit code, the output and every file. Each governed mode puts the dial where a lost answer changes the
// outcome, so a row that lost the dial cannot pass. A row that takes a failed read as absence has no such proof, so it
// is not listed here. Plan 41-13 made the ladder in scripts/context-io.ts fail closed, and those rows now meet THE RULE.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { skipLine, stageShapeOrSkip } from "../check-platform-shapes.js";
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
 * The modes only a row of SECOND_SOURCE runs in. Each governed mode refuses a finding the dial would admit if the dial
 * were lost: two of them hold the dial in a repository the working directory is not in, so the walk cannot supply it.
 */
const PROOF_MODES = ["governed", "governed-home", "governed-ambient", "governed-delivered", "ledger-present", "ledger-directory"] as const;
type ProofMode = (typeof PROOF_MODES)[number];

/** The modes that only prove the comparison can fail. No fault runs in them. */
type ControlMode = "no-dial" | "other-body";

type AnyMode = Mode | ProofMode | ControlMode;

/**
 * The derived read sites of note.js.
 * 2026-11-05, plan 41-12: 22. Eight are this program's alone among the runnables, the root ladder of trustedRepoRoot():
 * canonicalDirectoryPath, directoryIdentity, projectRootFromWorkingDirectory, hostDeliveredRoot and isExistingDirectory.
 * 2026-11-05, plan 41-13: 19. The three boolean probes left, in projectRootFromWorkingDirectory (two) and
 * hostDeliveredRoot (one), because a boolean could not report a failed read. Those reads moved onto entryPresence,
 * whose three read sites already count, so the pairs moved from 64 to 68: the 5 rows on the probes left, and the 9
 * pairs of entryPresence under its three new calling sites replaced them. namedRootAnswers then added 6 more, 3 sites
 * under each of its two calls of entryPresence, so the pairs end at 74. The site count did not move again.
 */
const NOTE_READ_SITES = 19;

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

const RUNG_TWO = "Rung 2 of canonicalDirectoryPath answers with the path rung 1 would have given.";
const RUNG_THREE = "Rung 3 answers from the parent, the path rung 2 reaches anyway for a position that does not exist.";
const OPEN_ANSWERS = "The open that follows classifies the ledger, so a type the stat would refuse is refused there.";

/** Every mode a row of SECOND_SOURCE can run in, for a row every run reaches. */
const EVERY_RUN: readonly AnyMode[] = [...MODES, ...PROOF_MODES];

/** Every mode with no delivered or ambient root, so the run reads the working directory. */
const EVERY_WALK: readonly AnyMode[] = EVERY_RUN.filter((m) => !["delivered", "ambient", "governed-ambient", "governed-delivered"].includes(m));

/**
 * A (site, via) pair whose failed read changes nothing, because a designed second source gives the same answer, with
 * why and the exact modes that reach it. The human lifted the no-widening rule for these 9 rows and no other (ruling of
 * 2026-11-05, plan 41-12). Each row must equal an unfaulted run in every one of its modes, so it goes red if the row
 * ever answers differently. Its size is pinned, and the set is derived two-sided below. A row whose fault loses an
 * answer does not belong here, and moving it here is not a fix.
 */
const SECOND_SOURCE: ReadonlyMap<string, { readonly why: string; readonly modes: readonly AnyMode[] }> = new Map([
  ["canonicalDirectoryPath:realpathSync.native#0 via <top>#0", { why: RUNG_TWO, modes: EVERY_RUN }],
  ["canonicalDirectoryPath:realpathSync#0 via <top>#0", { why: RUNG_THREE, modes: EVERY_RUN }],
  ["canonicalDirectoryPath:realpathSync.native#0 via canonicalWorkingDirectory#0", { why: RUNG_TWO, modes: EVERY_WALK }],
  ["canonicalDirectoryPath:realpathSync.native#0 via homeBoundary#0", { why: RUNG_TWO, modes: EVERY_RUN }],
  ["canonicalDirectoryPath:realpathSync.native#0 via homeConfigPositionIsProjectOwned#0", { why: RUNG_TWO, modes: ["home", "governed-home"] }],
  ["canonicalDirectoryPath:realpathSync.native#0 via hostDeliveredRoot#0", { why: RUNG_TWO, modes: ["delivered", "governed-delivered"] }],
  ["canonicalDirectoryPath:realpathSync.native#0 via hostDeliveredRoot#1", { why: RUNG_TWO, modes: ["delivered", "governed-delivered"] }],
  ["canonicalDirectoryPath:realpathSync.native#0 via trustedRepoRoot#0", { why: RUNG_TWO, modes: ["ambient", "governed-ambient"] }],
  ["appendRegularFileLine:statSync#0", { why: OPEN_ANSWERS, modes: ["retained", "ledger-present", "ledger-directory"] }],
]);
const SECOND_SOURCE_SIZE = 9;

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
const OTHER_BODY = ["add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--ref", "ABC-1", "--body", "y"];

/** A finding `human_admission: all` refuses from this role with this stamp, and a config with no dial admits. */
const DIAL_REFUSES = ["add", "t1", "--kind", "finding", "--by", "security-nfr", "--confidence", "high", "--verified-by", "human:eve", "--body", "x"];

/** Every ambient name that would answer the dial before the fixture does, blank, so each mode sets only its own. */
const BLANK: Readonly<Record<string, string>> = { CLAUDE_PROJECT_DIR: "", GRUGOPS_PROJECT_DIR: "", GRUGOPS_HOST_DELIVERED_ROOT: "" };

interface ModeSpec {
  readonly fixture: string;
  readonly args: readonly string[];
  readonly env: (root: string) => Readonly<Record<string, string>>;
  /** True when the refusal's last clause names which arm answered, so the comparison leaves that clause out. */
  readonly reasonNamesTheArm?: boolean;
}

const LEAN = template("{}\n", false, false);
const GOVERNED = template('{"context":{"human_admission":"all"}}\n', false, false);
const RETAINED_CONFIG = '{"context":{"audit_retention":"retained"}}\n';

/** The audit ledger under `root`. */
function ledgerPath(root: string): string {
  return join(root, GRUGOPS_DIR_REL, "audit", "admissions.jsonl");
}

/** A retained repository with `stage` applied at the ledger's position. */
function ledgerTemplate(stage: (ledger: string) => void): string {
  const root = template(RETAINED_CONFIG, false, false);
  mkdirSync(dirname(ledgerPath(root)));
  stage(ledgerPath(root));
  return root;
}

/** What each mode reaches: the note walk, the config read, the ledger, the body file, and each rung of the root ladder. */
const MODE_SPEC: Record<AnyMode, ModeSpec> = {
  observation: { fixture: LEAN, args: OBSERVATION, env: () => BLANK },
  retained: { fixture: template(RETAINED_CONFIG, true, false), args: OBSERVATION, env: () => BLANK },
  "gate-finding": { fixture: template("{}\n", true, true), args: GATE_FINDING, env: () => BLANK },
  "body-file": { fixture: LEAN, args: BODY_FILE, env: () => BLANK },
  delivered: { fixture: LEAN, args: OBSERVATION, env: (root) => ({ ...BLANK, GRUGOPS_HOST_DELIVERED_ROOT: root }) },
  ambient: { fixture: LEAN, args: OBSERVATION, env: (root) => ({ ...BLANK, GRUGOPS_PROJECT_DIR: root }) },
  home: { fixture: LEAN, args: OBSERVATION, env: (root) => ({ ...BLANK, HOME: root }) },
  governed: { fixture: GOVERNED, args: DIAL_REFUSES, env: () => BLANK },
  "governed-home": { fixture: GOVERNED, args: DIAL_REFUSES, env: (root) => ({ ...BLANK, HOME: root }) },
  "governed-ambient": { fixture: LEAN, args: DIAL_REFUSES, env: () => ({ ...BLANK, GRUGOPS_PROJECT_DIR: GOVERNED }) },
  "governed-delivered": { fixture: LEAN, args: DIAL_REFUSES, env: () => ({ ...BLANK, GRUGOPS_HOST_DELIVERED_ROOT: GOVERNED }) },
  "ledger-present": { fixture: ledgerTemplate((ledger) => writeFileSync(ledger, '{"id":"earlier"}\n')), args: OBSERVATION, env: () => BLANK },
  "ledger-directory": { fixture: ledgerTemplate((ledger) => mkdirSync(ledger)), args: OBSERVATION, env: () => BLANK, reasonNamesTheArm: true },
  "no-dial": { fixture: LEAN, args: DIAL_REFUSES, env: () => BLANK },
  "other-body": { fixture: LEAN, args: OTHER_BODY, env: () => BLANK },
};

/** What a reader of one run can see: the exit, the output and every file, with the run's own id, time and seal masked. */
interface Outcome {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly tree: readonly (readonly [string, string])[];
}

interface PairRun {
  readonly r: FaultedRun;
  readonly before: ReadonlyMap<string, string>;
  readonly after: ReadonlyMap<string, string>;
  readonly outcome: Outcome;
  readonly all: string;
}

/** `text` with this run's scratch root, note id, timestamps and seals masked, and nothing else. */
function masked(text: string, root: string): string {
  return text
    .split(root)
    .join("<root>")
    .replace(/\d{8}T\d{6}Z-[a-z0-9-]+-[0-9a-f]{8}/g, "<id>")
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, "<at>")
    .replace(/sha256:[0-9a-f]{64}/g, "<seal>");
}

/** The outcome of a run that has ended in `root`: every file by its masked text, and every other entry by its shape. */
function outcomeOf(root: string, r: Pick<FaultedRun, "status" | "signal" | "stdout" | "stderr">): Outcome {
  const tree = [...treeDigest(root)].map(
    ([rel, entry]) => [masked(rel, root), entry.startsWith("file:") ? masked(readFileSync(join(root, rel), "utf8"), root) : entry] as const,
  );
  return { status: r.status, signal: r.signal, stdout: masked(r.stdout, root), stderr: masked(r.stderr, root), tree };
}

/** The clause of a refusal that names which arm of the ledger check answered. */
const UNDERLYING_REASON = / Underlying reason: .*$/s;

/** `outcome` without that clause, which it must hold. */
function withoutReason(outcome: Outcome, label: string): Outcome {
  expect(outcome.stdout, label).toMatch(UNDERLYING_REASON);
  return { ...outcome, stdout: outcome.stdout.replace(UNDERLYING_REASON, "") };
}

/** A fresh copy of the fixture of `mode`, with `stage` applied to it. */
function freshRoot(mode: AnyMode, stage?: (root: string) => void): string {
  const { fixture } = MODE_SPEC[mode];
  const root = realpathSync(mkdtempSync(join(dirname(fixture), "grugops-note-read-run-")));
  cpSync(fixture, root, { recursive: true });
  stage?.(root);
  return root;
}

/** `mode` run with no fault and no preload, on a fresh copy of its fixture. */
function unfaulted(mode: AnyMode, stage?: (root: string) => void): Outcome {
  const spec = MODE_SPEC[mode];
  const root = freshRoot(mode, stage);
  const r = spawnSync(process.execPath, [HOST_JS, ...spec.args], {
    encoding: "utf8",
    cwd: root,
    timeout: 30_000,
    env: { ...process.env, ...spec.env(root) },
  });
  const outcome = outcomeOf(root, r);
  rmSync(root, { recursive: true, force: true });
  return outcome;
}

const controls = new Map<AnyMode, Outcome>();

/** The unfaulted outcome of `mode`, read once. */
function control(mode: AnyMode): Outcome {
  const known = controls.get(mode);
  if (known !== undefined) return known;
  const outcome = unfaulted(mode);
  controls.set(mode, outcome);
  return outcome;
}

/** The note files in a tree digest. */
function noteKeys(digest: ReadonlyMap<string, string>): readonly string[] {
  return [...digest.keys()].filter((k) => k.startsWith(`${CONTEXT_REL}/t1/notes/`) && k.endsWith(".md"));
}

/** `pair` failed with EIO on a fresh copy of the fixture of `mode`, with the tree digests before and after. */
function runPair(pair: DerivedPair, mode: AnyMode, stage?: (root: string) => void): PairRun {
  const spec = MODE_SPEC[mode];
  const root = freshRoot(mode, stage);
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
  const outcome = outcomeOf(root, r);
  rmSync(root, { recursive: true, force: true });
  rmSync(scratch, { recursive: true, force: true });
  const all = `${mode}, ${pairId(pair)}, line ${pair.site.line}, status ${r.status}, stdout ${JSON.stringify(r.stdout)}, stderr ${JSON.stringify(r.stderr)}`;
  return { r, before, after, outcome, all };
}

/** The test a row of SECOND_SOURCE meets in place of the read rule: this run equals an unfaulted run of `mode`. */
function assertSameAsUnfaulted(run: PairRun, mode: AnyMode): void {
  const armNamed = MODE_SPEC[mode].reasonNamesTheArm === true;
  const faulted = armNamed ? withoutReason(run.outcome, run.all) : run.outcome;
  const clean = armNamed ? withoutReason(control(mode), `the control of ${mode}`) : control(mode);
  expect(faulted, `a failed read changed the outcome: ${run.all}`).toEqual(clean);
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

  it("SECOND_SOURCE holds the pinned 9 rows, each a derived pair, none also in UNREACHED", () => {
    expect(SECOND_SOURCE.size).toBe(SECOND_SOURCE_SIZE);
    const ids = PAIRS.map(pairId);
    for (const name of SECOND_SOURCE.keys()) {
      expect(ids, `${name} is no longer a derived pair`).toContain(name);
      expect(UNREACHED.has(name), `${name} is in both maps`).toBe(false);
    }
  });

  it("SECOND_SOURCE equals the derived set, two-sided: every reached rung of the ladder, and the ledger's stat", () => {
    const derived = PAIRS.map(pairId).filter(
      (id) => id === "appendRegularFileLine:statSync#0" || (id.startsWith("canonicalDirectoryPath:") && !UNREACHED.has(id)),
    );
    expect([...SECOND_SOURCE.keys()].sort()).toEqual(derived.sort());
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
      const second = SECOND_SOURCE.get(pairId(pair));
      const fired: AnyMode[] = [];
      for (const mode of MODES) {
        const run = runPair(pair, mode);
        if (run.r.fired === 0) {
          expect(run.r.status, `PREMISE: a run this pair does not reach succeeds: ${run.all}`).toBe(0);
          continue;
        }
        fired.push(mode);
        if (second === undefined) assertReadRule(run);
        else assertSameAsUnfaulted(run, mode);
      }
      if (second !== undefined) {
        for (const mode of PROOF_MODES) {
          const run = runPair(pair, mode);
          if (run.r.fired === 0) continue;
          fired.push(mode);
          assertSameAsUnfaulted(run, mode);
        }
        expect(fired, `${pairId(pair)} reached other modes than its row names`).toEqual(second.modes);
        return;
      }
      if (UNREACHED.has(pairId(pair))) expect(fired, `${pairId(pair)} is listed as unreached, and these modes reach it`).toEqual([]);
      else expect(fired.length, `no mode reached ${pairId(pair)}`).toBeGreaterThan(0);
    });
  }
});

describe("READ-1 on note.js: the comparison behind SECOND_SOURCE can fail (plan 41-12, ruling of 2026-11-05)", () => {
  const GOVERNED_MODES = ["governed", "governed-home", "governed-ambient", "governed-delivered"] as const;

  it("two unfaulted runs of one mode compare equal, so a difference is the fault's", () => {
    for (const mode of [...MODES, ...PROOF_MODES]) expect(unfaulted(mode), mode).toEqual(unfaulted(mode));
  });

  it("the dial is in force in every governed mode: the run refuses, and the same finding with no dial is noted", () => {
    expect(control("no-dial").status, "PREMISE: with no dial the finding is noted").toBe(0);
    expect(control("no-dial").stdout).toMatch(SUCCESS_LINE);
    for (const mode of GOVERNED_MODES) {
      expect(control(mode).status, mode).toBe(1);
      expect(control(mode).stdout.startsWith("refused t1: "), mode).toBe(true);
      expect(control(mode), `${mode} compares different from a run with no dial`).not.toEqual(control("no-dial"));
    }
  });

  it("a note with other words compares different, so the masks hide only the id, the time and the seal", () => {
    expect(control("other-body").status).toBe(0);
    expect(control("other-body")).not.toEqual(control("observation"));
  });

  it("the ledger line is in what a faulted run is compared to", () => {
    const line = (mode: AnyMode): string | undefined => control(mode).tree.find(([rel]) => rel.endsWith("admissions.jsonl"))?.[1];
    expect(line("retained")).toContain('"id":"<id>"');
    expect(line("ledger-present")).toContain('{"id":"earlier"}\n{"id":"<id>"');
    expect(control("ledger-directory").status, "PREMISE: a directory at the ledger is refused").toBe(1);
  });
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

  it("a failed stat of a FIFO at the ledger is answered by the open: no wait, exit 1, and no note is written", () => {
    const probe = mkTmp("grugops-note-read-fifo-");
    const skipped = stageShapeOrSkip("FIFO", join(probe, "fifo"), "scripts/runnable-ref/note-read-sites.test.ts: the audit ledger (plan 41-12)");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the ledger-directory mode of the row above"));
      return;
    }
    const stage = (root: string): void => {
      mkdirSync(dirname(ledgerPath(root)));
      expect(stageShapeOrSkip("FIFO", ledgerPath(root), "scripts/runnable-ref/note-read-sites.test.ts: the audit ledger (plan 41-12)")).toBeNull();
    };
    const [pair] = PAIRS.filter((p) => pairId(p) === "appendRegularFileLine:statSync#0");
    expect(pair, "PREMISE: the ledger's stat is a derived pair").toBeDefined();
    const run = runPair(pair as DerivedPair, "retained", stage);
    expect(run.r.fired, `PREMISE: the fault fired: ${run.all}`).toBe(1);
    expect(run.r.status, run.all).toBe(1);
    expect(withoutReason(run.outcome, run.all)).toEqual(withoutReason(unfaulted("retained", stage), "the FIFO control"));
    expect(noteKeys(run.after), run.all).toEqual(noteKeys(run.before));
  });

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

describe("READ-1 on note.js: the dial holds with no fault (T-41-55)", () => {
  /** What one run with no fault and no preload left behind. */
  interface NoFaultRun {
    readonly status: number | null;
    readonly stdout: string;
    readonly stderr: string;
    readonly notes: number;
    /** The lines of the fixture's own audit ledger. */
    readonly ledger: readonly string[];
    readonly all: string;
  }

  /**
   * `args` on the lone host copy, on a fresh copy of the fixture of `mode`, with no preload. `change` edits the
   * environment the run gets, so a case can delete a name, which `{ ...process.env }` cannot express.
   */
  function noFault(
    mode: AnyMode,
    args: readonly string[],
    change: (env: NodeJS.ProcessEnv, root: string) => void,
    stage?: (root: string) => void,
  ): NoFaultRun {
    const root = freshRoot(mode, stage);
    const env: NodeJS.ProcessEnv = { ...process.env, ...BLANK };
    change(env, root);
    const before = treeDigest(root);
    const r = spawnSync(process.execPath, [HOST_JS, ...args], { encoding: "utf8", cwd: root, timeout: 30_000, env });
    const after = treeDigest(root);
    const ledger = after.has(`${GRUGOPS_DIR_REL}/audit/admissions.jsonl`)
      ? readFileSync(ledgerPath(root), "utf8").split("\n").filter((line) => line !== "")
      : [];
    rmSync(root, { recursive: true, force: true });
    const notes = noteKeys(after).length - noteKeys(before).length;
    const all = `${mode}, status ${r.status}, stdout ${JSON.stringify(r.stdout)}, stderr ${JSON.stringify(r.stderr)}`;
    return { status: r.status, stdout: r.stdout, stderr: r.stderr, notes, ledger, all };
  }

  /** The run stopped because no root could be named: exit 1, one `refused` line that says why, and no note. */
  function assertRootRefused(run: NoFaultRun): void {
    expect(run.status, run.all).toBe(1);
    expect(run.stdout.startsWith("refused t1: "), run.all).toBe(true);
    expect(run.stdout.trimEnd().split("\n"), run.all).toHaveLength(1);
    expect(run.stdout, run.all).toContain("refusing to name a governance root");
    expect(run.stderr, run.all).toBe("");
    expect(run.notes, run.all).toBe(0);
  }

  /** The dial itself refused: exit 1, one `refused` line that is not the ladder's, and no note. */
  function assertDialRefused(run: NoFaultRun): void {
    expect(run.status, run.all).toBe(1);
    expect(run.stdout.startsWith("refused t1: "), run.all).toBe(true);
    expect(run.stdout, run.all).not.toContain("refusing to name a governance root");
    expect(run.notes, run.all).toBe(0);
  }

  /** The note stands: exit 0, the success line, and one note on disk. */
  function assertNoted(run: NoFaultRun): void {
    expect(run.status, run.all).toBe(0);
    expect(run.stdout, run.all).toMatch(SUCCESS_LINE);
    expect(run.notes, run.all).toBe(1);
  }

  /** An empty directory, and one that holds only a version-control marker. */
  const emptyDir = (): string => mkTmp("grugops-note-read-empty-");
  function bareRepository(): string {
    const dir = mkTmp("grugops-note-read-bare-");
    mkdirSync(join(dir, ".git"));
    return dir;
  }

  /** The three names a process can set for itself, each with a value that carries no configuration. */
  const EMPTY_NAMES: readonly (readonly [string, () => string])[] = [
    ["GRUGOPS_PROJECT_DIR", emptyDir],
    ["CLAUDE_PROJECT_DIR", emptyDir],
    ["GRUGOPS_HOST_DELIVERED_ROOT", bareRepository],
  ];

  for (const [name, value] of EMPTY_NAMES) {
    it(`${name} at a directory with no configuration does not outrank the dial of the working directory`, () => {
      assertDialRefused(noFault("governed", DIAL_REFUSES, (env) => { env[name] = value(); }));
    });
  }

  it("under that name a note the dial allows still lands, under the true dial", () => {
    assertNoted(noFault("governed", OBSERVATION, (env) => { env.GRUGOPS_PROJECT_DIR = emptyDir(); }));
  });

  it("a retained repository under that name records its ledger line in its own ledger", () => {
    const run = noFault("retained", OBSERVATION, (env) => { env.GRUGOPS_PROJECT_DIR = emptyDir(); });
    assertNoted(run);
    expect(run.ledger, run.all).toHaveLength(1);
  });

  it("a retained repository under an undeterminable home never prints noted without its ledger line", () => {
    const run = noFault("retained", OBSERVATION, (env) => { env.HOME = "/nonexistent"; });
    assertRootRefused(run);
    expect(run.ledger, run.all).toEqual([]);
  });

  it("an unparseable config under an undeterminable home still refuses the note (GOV-02, D-14)", () => {
    const unparseable = (root: string): void => writeFileSync(join(root, GRUGOPS_DIR_REL, "factory.config.json"), "{ not json\n");
    const run = noFault("observation", OBSERVATION, (env) => { env.HOME = "/nonexistent"; }, unparseable);
    expect(run.status, run.all).toBe(1);
    expect(run.stdout.startsWith("refused t1: "), run.all).toBe(true);
    expect(run.notes, run.all).toBe(0);
  });

  it("CONTROL: with HOME unset the dial holds, as it does today", () => {
    assertDialRefused(noFault("governed", DIAL_REFUSES, (env) => { delete env.HOME; }));
  });

  it("CONTROL: with HOME naming a regular file the dial holds, as it does today", () => {
    const file = join(emptyDir(), "a-file");
    writeFileSync(file, "not a home\n");
    assertDialRefused(noFault("governed", DIAL_REFUSES, (env) => { env.HOME = file; }));
  });

  it("CONTROL: a lean repository is noted, and so is one that names its own root", () => {
    assertNoted(noFault("observation", OBSERVATION, () => undefined));
    assertNoted(noFault("observation", OBSERVATION, (env, root) => { env.GRUGOPS_PROJECT_DIR = root; }));
  });

  it("a name with no configuration still answers where nothing governs the working directory (R-31-15-02)", () => {
    const noConfig = (root: string): void => rmSync(join(root, GRUGOPS_DIR_REL, "factory.config.json"));
    assertNoted(noFault("observation", OBSERVATION, (env) => { env.GRUGOPS_PROJECT_DIR = emptyDir(); }, noConfig));
  });

  it("a name that is not an existing directory stays refused in a lean repository, so nothing moves to admitted", () => {
    const run = noFault("observation", OBSERVATION, (env) => { env.GRUGOPS_PROJECT_DIR = join(emptyDir(), "not-there"); });
    expect(run.status, run.all).toBe(1);
    expect(run.stdout.startsWith("refused t1: "), run.all).toBe(true);
    expect(run.notes, run.all).toBe(0);
  });

  it("HOME naming nothing refuses the finding the dial refuses, and writes no note", () => {
    assertRootRefused(noFault("governed", DIAL_REFUSES, (env) => { env.HOME = "/nonexistent"; }));
  });

  it("HOME as the empty string refuses the finding the dial refuses, and writes no note (edge RUN-02 empty)", () => {
    assertRootRefused(noFault("governed", DIAL_REFUSES, (env) => { env.HOME = ""; }));
  });
});
