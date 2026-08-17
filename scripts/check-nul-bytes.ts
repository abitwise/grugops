// check-nul-bytes.ts — Phase 28 NUL-byte gate (28-08, user-approved after the red-team pass),
// WIDENED IN ROUND 6 TO THE WHOLE FORBIDDEN CONTROL-BYTE CLASS (plan 29-45, WR-04).
//
// Asserts that NO tracked file in this repository contains a control byte other than TAB (0x09) or
// LINE FEED (0x0a) — that is, none of C0 (0x00-0x1f) outside those two, and not DELETE (0x7f).
//
//   node scripts/check-nul-bytes.js
// Exit 0 = every tracked file is free of forbidden control bytes; exit 1 = at least one FAIL.
//
// =================================================================================================
// WHY THE CLASS WIDENED, AND WHERE THE NARROWER DUPLICATE WAS
// =================================================================================================
//
// THE MODULE NAME AND THE PACKAGE SCRIPT ARE DELIBERATELY NOT RENAMED. `check:nul-bytes` is
// referenced from package.json and from CI, and renaming it would be a second, unrelated change
// riding on this one. What states the scope instead is this header and the PASS line, both of which
// name the class the gate now decides.
//
// THE TRANSFERABLE LESSON, WHICH IS NOT "WE ADDED AN ASSERTION". A control-byte assertion over TWO
// named files was added to scripts/check-banned-claims.test.ts in round 5, after a NUL written into
// that file made two acceptance greps return a confident, false ZERO. That assertion stood beside
// THIS GATE, which already decided the NUL half of the same predicate over EVERY TRACKED PATH — at
// the time, 1450 of them. The mechanism existed and covered the tree. What failed was that nobody
// RAN IT before believing two greps. Two assertions over one predicate, neither naming the other,
// is the duplicate-authority shape this repository closes by deletion or by a declared boundary —
// so the class is owned HERE, repo-wide, and what survives beside it names this gate at its own
// declaration.
//
// THE SCANNED SET IS UNCHANGED BY THE WIDENING. The class got wider; the set did not move by one
// path. There is still no exemption list, no filter and no path predicate.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path + one `git ls-files` invocation.
// Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// =================================================================================================
// WHY THIS GATE EXISTS, AND THE DEFECT THAT CAUSED IT
// =================================================================================================
//
// Plan 28-08 shipped a NUL byte into `scripts/context-io.test.ts` in commit a290ee7. The source read
// `cells.join(" ")` in every editor and in `git show`; the byte between the quotes was 0x00, not
// 0x20. Nothing caught it. The suite stayed green, `tsc` stayed green, all fourteen existing gates
// stayed green, and the freshness check stayed green, because a NUL inside a string literal is
// valid TypeScript and valid JavaScript.
//
// TWO HARMS, AND THE SECOND IS THE ONE THAT MATTERS.
//
// 1. It silently corrupted a published measurement. The NUL was the separator in
//    `createHash("sha256").update(cells.join("\0"))`, whose printed digest exists — in that test's
//    own words — "so an outside transcript's same-corpus claim is a measurement rather than an
//    assertion". A third party reading the source reconstructs `join(" ")`, hashes a different byte
//    string, and gets a different digest. The artifact whose entire job was reproducibility was not
//    reproducible from its own source.
//
// 2. It silently disabled `grep` over that file. `git diff` reported `Binary files differ`; plain
//    `grep` returned ZERO matches for strings demonstrably present, with no warning and exit status
//    1 — indistinguishable from a genuine absence. A reviewer grepping the file for a term would
//    have been told, credibly and wrongly, that it was not there. In a repository whose entire value
//    proposition is an auditable trail, a byte that makes the trail invisible to the standard search
//    tool is a trace defect, not a formatting nit.
//
// =================================================================================================
// WHAT THE SCANNED SET ENUMERATES — AND WHY IT HAS NO EXEMPTION LIST
// =================================================================================================
//
// THE SET IS: every file `git ls-files` reports as tracked. Nothing is filtered, nothing is skipped,
// nothing is exempt. That is a deliberate design choice and not an oversight.
//
// THE TRAP THIS AVOIDS, STATED PLAINLY. The obvious implementation is to scan only "text sources"
// and to derive that set from git's own `--eol` classifier, which is the tool that owns the
// text-versus-binary question. THAT IMPLEMENTATION IS SELF-DEFEATING, and it was measured to be so
// before this gate was written. Git classifies a file as `-text` PRECISELY BECAUSE it contains a
// NUL. On the tree at 28-08, `git ls-files --eol` reported exactly one `-text` file out of 1450:
// `scripts/context-io.test.ts` — the defect itself. A gate that scanned "the files git calls text"
// would have filtered out the only file it needed to look at and reported a clean green. The
// classifier is downstream of the very property under test, so it cannot be the filter.
//
// It CAN, however, be an independent second opinion, and it is used as exactly that below.
//
// THE COST OF NO EXEMPTIONS, PRICED. A repository that tracks a real binary asset — a PNG in docs, a
// compiled fixture — would red here. That is priced and accepted for two measured reasons. First,
// this repository tracks NONE today: the assertion `every tracked file is NUL-free` is currently
// exact rather than aspirational, and that emptiness is itself asserted rather than assumed (see
// `nulFreeTrackedFiles` below, and the two-sided count assertions in the test file). Second, an
// exemption list is this repository's diagnosed failure class #1 — a hand-maintained set literal
// that rots while the suite stays green — and it is the class that produced the spawn defect (seven
// granted names, zero adapter files). Adding one here, pre-emptively, to hold assets that do not
// exist would be shipping the disease to prevent a symptom.
//
// WHEN A LEGITIMATE BINARY IS ADDED, the correct response is to fail LOUDLY and by name, and for a
// human to add a NAMED exemption WITH ITS REASON — the shape `check-public-docs-vocabulary.ts` uses
// for CHANGELOG.md. What must never happen is a silent skip, a widened matcher, or a scan set
// narrowed to reach green.
//
// =================================================================================================
// THE HARNESS ASSERTS ITS OWN PREMISE — THIS PHASE HIT THAT CLASS ELEVEN TIMES
// =================================================================================================
//
// 1. NO `grep`, ANYWHERE. A NUL-detection harness built on `grep` is self-defeating by construction:
//    `grep` is the tool the NUL disables. Detection is `controlByteOffsets()` walking the RAW BYTES
//    of a buffer read with no encoding argument, so no decoder ever sees the file. That function is
//    the module's SOLE byte-level predicate; see its declaration.
//
// 2. LINE AND COLUMN ARE COMPUTED FROM BYTES, NOT FROM A DECODED PREFIX. The first draft of the
//    28-08 locator decoded `buf.subarray(0, offset)` as UTF-8 and counted newlines in the string.
//    That reports a wrong column on any file containing multi-byte characters, because a byte offset
//    was compared against character indices — it printed column 1488 for a line 91 characters long.
//    `locate()` below counts 0x0A bytes in the byte buffer and takes the byte distance from the last
//    one, so offset, line and column are all in the same unit.
//
// 3. GIT'S CLASSIFIER IS CROSS-CHECKED AGAINST THE BYTE SCAN — AND THE STRENGTH OF THAT CHECK IS
//    STATED HONESTLY RATHER THAN OVERSOLD. This module's NUL-bearing set — PROJECTED out of
//    `controlByteOffsets()`'s byte values, never scanned for a second time — and git's own
//    working-tree `--eol` verdict must name the SAME files; a disagreement is reported and fails,
//    because it means one of the two is wrong and this module cannot know which.
//
//    WHAT THAT BUYS, PRECISELY: the two detectors are NOT independent in concept. Their agreement
//    corroborates this module's IMPLEMENTATION — that `scanTracked()` enumerates the right files,
//    reads them as bytes, and finds what is actually there — and it is emphatically NOT a second
//    opinion on whether the byte class is the right predicate. A first draft of this header claimed
//    "two independent detectors"; that claim was measured and is false, and it is corrected here
//    rather than left standing.
//
//    AND A SECOND CLAIM IN THIS SAME PARAGRAPH WAS ALSO MEASURED AND ALSO FALSE (round 6, plan
//    29-45). It read "git's binary heuristic is ITSELF NUL-based". It is not. Measured with one
//    planted byte per throwaway repository, `git ls-files --eol` reports `w/-text` for 0x00, 0x0b,
//    0x0d, 0x1f and 0x7f, and `w/lf` for 0x08 and 0x1b — a RATIO heuristic over non-printable
//    bytes, with a few control characters deliberately counted as printable. git's `-text` set is
//    therefore NEITHER a subset NOR a superset of the class this gate decides, so the cross-check's
//    two arms are anchored on DIFFERENT predicates, each on what its side can actually answer for.
//    The reasoning is at the comparison itself in `runAll()`. This was found by the widening's own
//    RED proof, which reddened four of its plants for the wrong reason before the arms were fixed —
//    a red believed without being read would have shipped a gate that fails on correct trees.
//
//    THE DISAGREEMENT ARM IS DEFENSIVE AND COULD NOT BE REACHED BY CONSTRUCTED INPUT. Four shapes
//    were tried against a throwaway repository: a NUL at byte 100, a NUL at byte 20000 (past git's
//    documented first-few-bytes window), `.gitattributes` marking a clean file `binary`, and
//    `.gitattributes` marking a NUL-bearing file `text`. NONE produced a disagreement — the `w/`
//    column is derived from CONTENT and the attribute does not override it. The arm stays because a
//    future git version or a filter driver could change that, but its coverage is stated as absent
//    rather than implied to exist. (The precedent is 28-07's de-duplication path, likewise
//    unreachable by the shipped artifact and likewise said so.)
//
// =================================================================================================
// THE D-24 RED TRANSCRIPT — WATCHED FAILING AGAINST THE REAL TREE, NOT A FIXTURE
// =================================================================================================
//
// This gate was written and run BEFORE the NUL was removed, so its first run was against a real
// defect in the real working tree — the standard plan 28-01 set for this phase, and the reason a red
// here is credible. Measured 2026-08-12 on the tree at commit cd71344:
//
//   FAIL  scripts/context-io.test.ts carries 1 NUL byte(s) (0x00). First at byte offset 116043,
//         line 2277, column 60. A NUL byte in a tracked source is never intentional here: ...
//   FAIL  NUL total: 1 byte(s) across 1 of the 1450 tracked file(s) scanned.
//   2 CHECK(S) FAILED
//
// After `cells.join("\0")` was corrected to `cells.join("\x1f")`, the same command over the same
// tree exits 0. The gate is byte-unchanged across that transition: the green is a property of the
// TREE, not of the gate.
//
// AND THE FINAL ARTIFACT WAS RE-RUN AGAINST THE REAL DEFECT, so the transcript above is not merely
// the first draft's. A throwaway repository seeded with `git show a290ee7:scripts/context-io.test.ts`
// — the actual committed blob — driven through the SHIPPED gate via NUL_SCAN_ROOT reproduces the
// same refusal at the same byte offset, line and column. Watching an early draft fail and then
// shipping a different artifact is the shape this repository has been bitten by; the refusal is
// therefore attributed to the code that ships.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// THE SCAN ROOT IS OVERRIDABLE, FOLLOWING THE `VALIDATE_KIT_ROOT` PRECEDENT IN
// scripts/validate-agent-factory.ts. Without it this gate can only ever be run against the one tree
// it lives in, which means the ONLY way to watch it fail is to break the real repository — and a
// refusal path that can never be exercised hermetically is a refusal path that rots. With it,
// scripts/check-nul-bytes.test.ts builds a throwaway git repository containing a deliberate NUL and
// runs THIS COMPILED GATE against it, so the RED is reproduced by the shipped artifact rather than
// by a re-implementation of it in a test.
//
// It is an override for TESTING and it is not a scan-narrowing knob: it moves the root, it cannot
// exclude a path, and every derivation below still enumerates the whole tracked set at whatever root
// it is given.
//
// The truthiness ternary, not `??` — the sibling form (28-REVIEW WR-05). The two differ on exactly
// one input: `NUL_SCAN_ROOT=""` degrades to the repo root here and would otherwise resolve every
// path against the process CWD.
const ROOT = process.env.NUL_SCAN_ROOT
  ? process.env.NUL_SCAN_ROOT
  : join(import.meta.dirname, "..");

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};

// Exported accessor so a later aggregator can fold this gate's verdict without reaching for a
// shared global (the check-uat-oracles / check-public-docs-vocabulary precedent).
export const nulByteFails = (): number => FAILS;

/** The forbidden byte this module is named for. Named once so no call site writes a bare `0`. */
export const NUL = 0x00;

/**
 * THE TWO CONTROL CHARACTERS A TRACKED FILE IN THIS REPOSITORY LEGITIMATELY NEEDS.
 *
 * TAB (0x09) and LINE FEED (0x0a), and nothing else. CARRIAGE RETURN is deliberately NOT here:
 * `tsconfig.json` sets `newLine: lf`, every committed artifact is LF, and a CR arriving in a tracked
 * file is an editor or a platform doing something nobody asked for.
 */
export const ADMITTED_CONTROL_BYTES: readonly { byte: number; name: string }[] = [
  { byte: 0x09, name: "TAB" },
  { byte: 0x0a, name: "LINE FEED" },
];

/**
 * Is this byte a control byte this repository forbids in a tracked file?
 *
 * THE CLASS IS C0 PLUS DELETE, MINUS THE TWO ADMITTED ABOVE: 0x00–0x1f and 0x7f. Stated as a class
 * rather than as a list of bytes somebody thought of, for the same reason the scanned SET is derived
 * rather than listed — a hand-maintained enumeration of forbidden bytes would rot exactly the way
 * this repository's diagnosed failure class #1 rots.
 */
export function isForbiddenControlByte(b: number): boolean {
  if (ADMITTED_CONTROL_BYTES.some((a) => a.byte === b)) return false;
  return b < 0x20 || b === 0x7f;
}

/** Hex, two digits, so a byte reported in a refusal is unambiguous. */
function hex(b: number): string {
  return `0x${b.toString(16).padStart(2, "0")}`;
}

/**
 * Every `git` invocation in this module, so a failure is a NAMED refusal rather than a stack trace
 * (28-REVIEW WR-11).
 *
 * `execFileSync` was called unguarded in both derivations below. Outside a git worktree — or with
 * NUL_SCAN_ROOT pointed at a non-repository — git exits 128 and the gate DIED with a Node stack
 * trace instead of reporting a verdict. That is against the throw-versus-report split every sibling
 * gate in this phase observes: a stack trace is not a verdict, and a gate that dies is not a gate
 * that failed. This helper throws with the command and the root in the message; runAll() catches it
 * and reports through fail().
 */
function git(args: readonly string[]): string {
  try {
    return execFileSync("git", [...args], {
      cwd: ROOT,
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
    }).toString("utf8");
  } catch (e) {
    throw new Error(
      `\`git ${args.join(" ")}\` failed at ${ROOT} — ${(e as Error).message}. The tracked set ` +
        `cannot be derived, so NO verdict is reported over it. Confirm this is being run inside a ` +
        `git working tree`,
    );
  }
}

/**
 * Every tracked path, DERIVED from git rather than from a walk or a list.
 *
 * `-z` and a NUL-delimited split are deliberate: a newline in a filename would corrupt a
 * newline-delimited parse, and this gate of all gates should not assume bytes it has not checked.
 * (The delimiter being NUL is not a contradiction — it is git's OUTPUT framing, never file content.)
 */
export function trackedPaths(): string[] {
  return git(["ls-files", "-z"])
    .split("\0")
    .filter((p) => p.length > 0);
}

/**
 * Git's OWN text/binary verdict per tracked path, parsed from `git ls-files --eol`.
 *
 * Used ONLY as an independent cross-check on the byte scan — never as a filter. See the header.
 *
 * THE `w/` COLUMN, NOT THE `i/` COLUMN, AND THE DISTINCTION IS LOAD-BEARING. `git ls-files --eol`
 * reports THREE verdicts per path: `i/` for the blob in the INDEX, `w/` for the file in the WORKING
 * TREE, and `attr/` for the .gitattributes setting. `scanTracked()` reads the WORKING TREE with
 * `readFileSync`, so the only sound comparison is against `w/` — the two detectors must be asked
 * about the SAME OBJECT or the cross-check is measuring the difference between two files rather
 * than the disagreement between two detectors.
 *
 * This was not reasoned out in advance; the cross-check CAUGHT IT. The first version of this
 * function parsed `i/`, and the moment 28-08's NUL was fixed in the working tree the gate reported
 * a disagreement: `i/-text w/lf` — the index still held the committed NUL blob while the worktree
 * held the fix. The gate was right to fail and the harness was wrong, which is exactly the job a
 * cross-check exists to do. Recorded here rather than quietly corrected.
 *
 * The parse splits on the first TAB rather than matching the whole line with one regex: the
 * attribute field can itself contain a space (`attr/text eol=lf`), which silently broke a
 * whitespace-delimited regex during development and produced 1450 "unparsed" rows. Rows that still
 * fail to parse are RETURNED as unparsed rather than dropped, and the caller fails on a non-zero
 * count — a classifier that silently understood nothing would otherwise agree with any byte scan.
 *
 * `-z` HERE TOO, AND THE STATED REASON IS THE MEASURED ONE (28-REVIEW WR-11). The header justifies
 * `-z` on trackedPaths() because "a newline in a filename would corrupt a newline-delimited parse",
 * and this twin then did exactly that with `out.split("\n")`. The review named that as the hazard;
 * MEASURED, IT IS NOT THE HAZARD — `git ls-files --eol` C-QUOTES such a path (`"a\nb.md"`, on one
 * line, with or without `core.quotePath=false`), so the row count survived.
 *
 * The real divergence is that same quoting. With `-z` git emits the path RAW; without it, git
 * C-quotes anything unusual. trackedPaths() already used `-z` and this twin did not, so for any path
 * git chose to quote the two views named DIFFERENT STRINGS for the SAME FILE — and runAll() compares
 * those strings as sets. Both views are now framed identically, so they disagree only when the TREE
 * disagrees. scripts/check-nul-bytes.test.ts measures the asymmetry directly rather than asserting it.
 */
export function gitBinaryPaths(): { binary: string[]; unparsed: string[]; rows: number } {
  const out = git(["ls-files", "--eol", "-z"]);
  const rows = out.split("\0").filter((r) => r.length > 0);
  const binary: string[] = [];
  const unparsed: string[] = [];
  for (const row of rows) {
    const tab = row.indexOf("\t");
    if (tab === -1) {
      unparsed.push(row);
      continue;
    }
    const m = row.slice(0, tab).match(/^i\/(\S+)\s+w\/(\S+)\s/);
    if (m === null) {
      unparsed.push(row);
      continue;
    }
    // m[2] is the WORKING-TREE verdict — the same object scanTracked() reads. See the note above.
    if (m[2] === "-text") binary.push(row.slice(tab + 1));
  }
  return { binary, unparsed, rows: rows.length };
}

/**
 * Byte offset -> {line, column}, counted ENTIRELY in bytes.
 *
 * Both are 1-based. `column` is the byte distance from the preceding 0x0A, so a file with multi-byte
 * characters reports a column in the same unit as the offset it came from. See harness premise 2.
 */
export function locate(buf: Buffer, offset: number): { line: number; column: number } {
  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < offset; i++) {
    if (buf[i] === 0x0a) {
      line += 1;
      lastNewline = i;
    }
  }
  return { line, column: offset - lastNewline };
}

export interface NulHit {
  readonly path: string;
  readonly offsets: number[];
  /**
   * The byte VALUE at each offset, positionally parallel to `offsets`.
   *
   * (Round 6, plan 29-45 — WR-04.) Carried because the class this gate decides is now wider than the
   * one byte it is named for, and the git cross-check below is anchored on the NUL SUB-CLASS only:
   * git's `-text` verdict is itself NUL-based, so a file carrying a stray 0x0d and no NUL is a
   * legitimate finding here and correctly NOT `-text` to git. Without the byte values, that pairing
   * would be reported as a detector DISAGREEMENT — a false refusal, and precisely the kind of
   * unstated coupling this phase keeps finding.
   */
  readonly bytes: number[];
}

/**
 * Every offset at which `buf` carries a control byte this repository forbids — and THIS MODULE'S
 * SOLE BYTE-LEVEL PREDICATE.
 *
 * Extracted from the I/O so the detection itself is testable on a crafted buffer with no filesystem,
 * no git and no repository — a detector that can only be exercised by breaking the real tree is a
 * detector nobody exercises. `scanTracked` is this function plus I/O.
 *
 * ONE QUESTION, ONE ANSWER (round 7, plan 29-50 — WR-04). There is exactly one implementation of the
 * control-byte question in this module and this is it. The NUL sub-class that the git `--eol`
 * cross-check is anchored on is NOT a second predicate and must never become one: it is PROJECTED
 * OUT of this function's `bytes` output, at the single site that builds the NUL-bearing set for that
 * comparison in `runAll()`. A separate NUL-only scanner beside this one would be two answers to one
 * question with nothing keeping them agreed — the duplicate-authority shape this repository closes
 * by deletion, and it is what stood here until round 7.
 *
 * WHY THE CROSS-CHECK IS ANCHORED ON THAT SUB-CLASS AND NOT ON THE WHOLE CLASS: a NUL forces git's
 * verdict unconditionally, while the rest of the class does not. The measurement that establishes
 * that asymmetry, and the table it is read from, sit at the comparison itself in `runAll()` and are
 * stated there ONCE. They are deliberately not restated here — a second statement of a measurement
 * is a second declaration that can only rot, which is the defect this module has now been corrected
 * for twice.
 *
 * Raw bytes, no decoder, no `grep`. A control-byte detector built on `grep` would be self-defeating
 * for the same reason a NUL detector built on it is: `grep` is the tool the byte disables.
 */
export function controlByteOffsets(buf: Buffer): { offsets: number[]; bytes: number[] } {
  const offsets: number[] = [];
  const bytes: number[] = [];
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (isForbiddenControlByte(b)) {
      offsets.push(i);
      bytes.push(b);
    }
  }
  return { offsets, bytes };
}

/**
 * Read every given path as RAW BYTES and report those carrying a NUL.
 *
 * No encoding argument is passed to readFileSync anywhere in this module, so no decoder is
 * interposed between the file and the check. Paths that cannot be read are returned separately
 * rather than swallowed: a scan that silently skipped a file it could not open would under-report
 * and still print a green.
 *
 * THE TWO NOT-SCANNED CASES ARE SEPARATED (28-REVIEW WR-11). A tracked file DELETED from the working
 * tree and a tracked file that is present but unopenable are different situations with different
 * fixes, and both used to land in one `unreadable` list under a message a developer could read as a
 * NUL finding. `missing` is ENOENT — the path is tracked and not on disk (a deletion not yet staged,
 * or an uninitialised submodule gitlink); `unreadable` is everything else (permissions, an I/O
 * error). Both still FAIL: fail-closed is right, and only the naming was wrong.
 */
export function scanTracked(paths: string[]): {
  hits: NulHit[];
  missing: string[];
  unreadable: string[];
} {
  const hits: NulHit[] = [];
  const missing: string[] = [];
  const unreadable: string[] = [];
  for (const rel of paths) {
    let buf: Buffer;
    try {
      buf = readFileSync(join(ROOT, rel));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") missing.push(rel);
      else unreadable.push(rel);
      continue;
    }
    const { offsets, bytes } = controlByteOffsets(buf);
    if (offsets.length > 0) hits.push({ path: rel, offsets, bytes });
  }
  return { hits, missing, unreadable };
}

/** The tracked paths carrying no forbidden control byte — so the test can assert the partition two-sided. */
export function nulFreeTrackedFiles(): string[] {
  const paths = trackedPaths();
  const { hits } = scanTracked(paths);
  const bad = new Set(hits.map((h) => h.path));
  return paths.filter((p) => !bad.has(p));
}

export function runAll(): void {
  process.stdout.write(
    "\n[check_nul_bytes] no tracked file carries a forbidden control byte — C0 plus DELETE, " +
      "TAB and LINE FEED admitted (28-08, class widened round 6)\n",
  );

  // The tracked-set derivation is the one step that shells out, and it is the one step that can
  // fail for a reason that has nothing to do with NUL bytes (28-REVIEW WR-11). Reported, never
  // thrown past the caller — a stack trace is not a verdict.
  let paths: string[];
  try {
    paths = trackedPaths();
  } catch (e) {
    fail((e as Error).message);
    finish();
    return;
  }

  // Premise: the tracked set is non-empty. An empty set would make every check below vacuously
  // green, which is the failure mode a "0 problems found" gate hides best.
  if (paths.length === 0) {
    fail(
      "`git ls-files` returned ZERO tracked paths. This gate cannot run: every check below would " +
        "pass vacuously. Confirm this command is being run inside the repository working tree.",
    );
    finish();
    return;
  }

  const { hits, missing, unreadable } = scanTracked(paths);

  // Named as the situation it IS, so a developer meeting it in CI does not read it as a NUL finding.
  if (missing.length > 0) {
    fail(
      `${missing.length} tracked path(s) are MISSING FROM THE WORKING TREE and were therefore NOT ` +
        `scanned: ${missing.slice(0, 10).join(", ")}. This is not a NUL finding — the path is ` +
        "tracked by git and absent on disk (a deletion not yet staged, or an uninitialised " +
        "submodule). A skipped file is an unchecked file, so it fails closed rather than passing.",
    );
  }
  if (unreadable.length > 0) {
    fail(
      `${unreadable.length} tracked path(s) are PRESENT BUT UNREADABLE and were therefore NOT ` +
        `scanned: ${unreadable.slice(0, 10).join(", ")}. This is not a NUL finding — the file ` +
        "exists and could not be opened (permissions, or an I/O error). A skipped file is an " +
        "unchecked file; refusing to report a clean scan over a set this gate did not actually read.",
    );
  }

  let totalControl = 0;
  for (const hit of hits) {
    totalControl += hit.offsets.length;
    const buf = readFileSync(join(ROOT, hit.path));
    const first = locate(buf, hit.offsets[0]);
    const kinds = [...new Set(hit.bytes)].sort((a, b) => a - b).map(hex).join(", ");
    fail(
      `${hit.path} carries ${hit.offsets.length} forbidden control byte(s) — ${kinds}. First is ` +
        `${hex(hit.bytes[0])} at byte offset ${hit.offsets[0]}, line ${first.line}, column ` +
        `${first.column}. A control byte other than TAB or LINE FEED in a tracked source is never ` +
        "intentional here: it renders as nothing or as a space in every editor and in `git show`, " +
        "and a NUL additionally makes `git diff` report `Binary files differ` and makes plain " +
        "`grep` return ZERO matches for strings that ARE present — silently, with an exit status " +
        "indistinguishable from a genuine absence. Fix the FILE. Do not add an exemption and do " +
        "not narrow the scan set: the scanned set is every tracked path by derivation, precisely " +
        "so removing a member to reach green is not available.",
    );
  }

  // ── THE INDEPENDENT CROSS-CHECK ────────────────────────────────────────────────────────────────
  // Git decides `-text` on its own read of the file's bytes. If its verdict and this module's byte
  // scan name different files, one of the two is wrong and this module cannot know which — so it
  // reports the disagreement and fails rather than picking a winner.
  // Named `gitView` rather than `git` so it does not shadow the module's `git()` helper.
  let gitView: { binary: string[]; unparsed: string[]; rows: number };
  try {
    gitView = gitBinaryPaths();
  } catch (e) {
    fail((e as Error).message);
    finish();
    return;
  }
  if (gitView.unparsed.length > 0) {
    fail(
      `${gitView.unparsed.length} row(s) of \`git ls-files --eol -z\` output could not be parsed, ` +
        "so git's classification is not available as a cross-check on the byte scan. Refusing to " +
        "report the scan corroborated when the corroborating source was not understood.",
    );
  } else if (gitView.rows !== paths.length) {
    fail(
      `\`git ls-files --eol -z\` returned ${gitView.rows} row(s) but \`git ls-files -z\` returned ` +
        `${paths.length} path(s). The two views of the tracked set disagree, so the cross-check ` +
        "cannot be trusted.",
    );
  } else {
    // ── THE TWO ARMS ARE ANCHORED DIFFERENTLY, AND THAT ASYMMETRY IS MEASURED, NOT ASSUMED ───────
    //
    // (Round 6, plan 29-45 — WR-04.) This module's header used to claim git's binary heuristic is
    // ITSELF NUL-based. THAT CLAIM IS FALSE AND THE WIDENING'S OWN RED PROOF IS WHAT FALSIFIED IT.
    // Measured on this box with one planted byte per throwaway repository, `git ls-files --eol`
    // reports:
    //
    //   0x00 NUL, 0x0b VTAB, 0x0d CR, 0x1f UNIT SEP, 0x7f DELETE  ->  w/-text
    //   0x08 BACKSPACE, 0x1b ESCAPE                               ->  w/lf
    //
    // So git's verdict is a RATIO heuristic over non-printable bytes, not a NUL test, and it treats
    // a specific few control characters as printable. It is therefore NEITHER a subset NOR a
    // superset of the class this gate decides, and ANY set EQUALITY between the two manufactures
    // false disagreements in both directions. The first draft of this widening did exactly that and
    // reddened four of its own RED-proof plants for the wrong reason; it is corrected here rather
    // than left standing, and the arms are anchored on what each side can actually answer for.
    const scanClean = new Set(
      paths.filter((p) => !hits.some((h) => h.path === p)),
    );
    const nulBearingPaths = new Set(
      hits.filter((h) => h.bytes.includes(NUL)).map((h) => h.path),
    );
    const byGit = new Set(gitView.binary);
    // ARM 1 — a NUL THIS SCAN FOUND AND GIT DID NOT NOTICE. Sound in this direction because a NUL
    // forces git's verdict unconditionally: `nul > 0` short-circuits its heuristic. If this fires,
    // one of the two readers is broken.
    const scanOnly = [...nulBearingPaths].filter((p) => !byGit.has(p));
    // ARM 2 — a file git calls BINARY that this scan found ENTIRELY CLEAN. Sound because git's
    // non-printable ratio cannot exceed zero on a file whose only control bytes are TAB and LINE
    // FEED, both of which git counts as printable. A file with SOME forbidden byte is deliberately
    // excluded from this arm: git calling it `-text` is agreement, not disagreement.
    const gitOnly = [...byGit].filter((p) => scanClean.has(p));
    if (scanOnly.length > 0 || gitOnly.length > 0) {
      fail(
        "the byte scan and git's own text/binary classifier DISAGREE. Files carrying a NUL by " +
          `byte scan but NOT classified \`-text\` by git: ${scanOnly.join(", ") || "(none)"}. ` +
          "Files classified `-text` by git but carrying NO forbidden control byte at all by byte " +
          `scan: ${gitOnly.join(", ") || "(none)"}. The second is legitimate for a real binary ` +
          "asset and needs a named exemption with its reason; the first means this gate's own scan " +
          "or git's classifier is wrong. Either way the disagreement is reported rather than " +
          "resolved silently.",
      );
    }
  }

  if (totalControl > 0) {
    fail(
      `forbidden control-byte total: ${totalControl} byte(s) across ${hits.length} of the ` +
        `${paths.length} tracked file(s) scanned.`,
    );
  }

  if (FAILS === 0) {
    // A PASS line must never state a check that was not performed: every number below is read from
    // the run that just happened. It states the WIDENED CLASS explicitly (round 6, plan 29-45), the
    // two admitted control characters by name, and the denominator, so the line describes what the
    // gate now decides rather than what its file name says.
    const nulBearing = hits.filter((h) => h.bytes.includes(NUL)).length;
    pass(
      `${paths.length} tracked file(s) scanned as raw bytes, ZERO carrying a forbidden control ` +
        `byte; the forbidden class is C0 plus DELETE (0x00-0x1f and 0x7f) with exactly two ` +
        `admitted: ${ADMITTED_CONTROL_BYTES.map((a) => `${hex(a.byte)} ${a.name}`).join(" and ")}. The scanned ` +
        "set is every path `git ls-files` reports, with no exemption list and nothing filtered — " +
        `git's own \`--eol\` classifier independently agrees on the NUL SUB-CLASS it is able to ` +
        `answer for, reporting ${gitView.binary.length} \`-text\` file(s) against this scan's ` +
        `${nulBearing} NUL-bearing file(s), across ${gitView.rows} parsed row(s) with 0 unparsed; ` +
        `${missing.length} path(s) missing from the working tree and ${unreadable.length} path(s) ` +
        "present but unreadable",
    );
  }

  finish();
}

function finish(): void {
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
  } else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
  }
}

// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL via pathToFileURL — a
// hand-built `file://${argv[1]}` URL does NOT match on Windows, which would make a direct
// `node scripts/check-nul-bytes.js` run ZERO checks and exit 0, a fabricated green. The guard is
// also what lets the test file IMPORT this module without the import running the check and calling
// process.exit inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
