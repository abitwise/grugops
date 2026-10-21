// state-path-scan.ts — the counting core of the old-spelling gate: every site in the listed files that spells the
// pre-v3 state root, per spelling, with its path and line (phase 36, D-10, D-11, D-15).
//
// WHAT IT COUNTS. Three spellings of the pre-v3 state root, each a global regular expression:
//   slash      the root name then `/`, not preceded by an identifier character, a dot, a dash, or the new root's
//              parent then `/` (so a spelling of the new root is never counted);
//   segment    the root name between two matching quote characters (double, single or backtick), not preceded by
//              an identifier character: the `join(root, "<name>", ...)` form, an array member, a backticked name;
//   backslash  the root name then one backslash, not preceded by an identifier character, a dot, a dash, or the
//              new root's parent then one or two backslashes (the raw and the escaped Windows forms).
// It counts occurrences, not lines. Every pattern is built from install/state-layout.ts (LEGACY_STATE_ROOT_REL and
// STATE_ROOT_REL), so this file holds no literal pre-v3 root and the scan run over itself reports zero.
//
// WHAT IT SUBTRACTS, AND NOTHING ELSE (D-15). Exact occurrences of LEGACY_FALLBACK_CLAUSE. The text is split at each
// occurrence and each piece is counted on its own, so no site can span a removed clause and a site beside a clause
// still counts. A copy of the clause with one character changed is not the clause, so its spellings are counted.
//
// WHAT IT EXCLUDES, BY NAME (D-11). SCAN_EXCLUSIONS: `.planning/`, the planning records. Every excluded file is
// counted and the CLI prints the exclusion with its reason and that count; nothing else is skipped. Every file
// `git ls-files --cached --others --exclude-standard` lists is read as latin1, so a binary-classified file is scanned
// like text; a listed path absent from disk is counted as not on disk; any other read error stops the run.
//
// THE CLI. `node scripts/state-path-scan.js [pathspec ...]` from inside the repository; pathspecs are relative to the
// repository root, and no pathspec means every listed file. It prints the scanned-file denominator, the named
// exclusion, each site as `path:line: spelling` (sorted by path, then line, then the spelling order above), each
// legacy path (a listed path under a directory named for the pre-v3 root), and a totals line whose every number is
// read from this run. Exit codes, a new convention in scripts/ stated here and tested in state-path-scan.test.ts:
//   0  zero sites and zero legacy paths;
//   1  one site or legacy path or more;
//   2  could not run: git failed (for example outside a repository), a listed file could not be read, or the scan
//      set is empty (no pathspec matched a file). An empty set is never reported as a pass.
//
// THE WIRED GATE is scripts/check-state-paths.ts (plan 36-14), which adds the per-file allow-list (D-09, D-10, D-16)
// and runs in CI. This module is deliberately not named check-*: every scripts/check-*.js must be wired in CI.
//
// Node stdlib only, plus the constants-only ../install/state-layout.js and ./is-entry.js.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LEGACY_FALLBACK_CLAUSE, LEGACY_STATE_ROOT_REL, STATE_ROOT_REL } from "../install/state-layout.js";
import { isEntrypoint } from "./is-entry.js";

/** The three spellings, in the order sites on one line are printed. */
export const SPELLING_NAMES = Object.freeze(["slash", "segment", "backslash"] as const);
export type SpellingName = (typeof SPELLING_NAMES)[number];

/** One site: its 1-based line and its spelling. */
export interface Site {
  readonly line: number;
  readonly spelling: SpellingName;
}

/** What countSpellings found in one text. */
export interface SpellingCount {
  readonly totals: Record<SpellingName, number>;
  /** Every site, in line order, then spelling order, then position. */
  readonly sites: Site[];
  /** How many exact occurrences of LEGACY_FALLBACK_CLAUSE were removed before counting. */
  readonly clauseOccurrences: number;
}

/** A named exclusion: every listed path starting with `prefix` is counted and never read. */
export interface ScanExclusion {
  readonly prefix: string;
  readonly reason: string;
}

export const SCAN_EXCLUSIONS: readonly ScanExclusion[] = Object.freeze([
  { prefix: ".planning/", reason: "planning records, excluded by name (D-11)" },
]);

/** A run that could not be completed: the CLI maps it to exit 2. */
export class ScanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanError";
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The new root's parent: the text of STATE_ROOT_REL before its last slash. The new-root lookbehinds are correct only
 * while the new root is that parent plus the pre-v3 root's name, so any other shape stops the scan rather than letting
 * it count the new root as old.
 */
function newRootParent(): string {
  const cut = STATE_ROOT_REL.lastIndexOf("/");
  const parent = cut > 0 ? STATE_ROOT_REL.slice(0, cut) : "";
  if (parent === "" || STATE_ROOT_REL !== `${parent}/${LEGACY_STATE_ROOT_REL}`) {
    throw new ScanError(
      `the state root is not <parent>/<pre-v3 root name>; the new-root lookbehinds would be wrong (install/state-layout.ts)`,
    );
  }
  return parent;
}

/** Fresh global patterns for the three spellings, built from the state-layout constants on every call. */
export function spellingPatterns(): Record<SpellingName, RegExp> {
  const old = escapeRegExp(LEGACY_STATE_ROOT_REL);
  const parent = escapeRegExp(newRootParent());
  return {
    slash: new RegExp(`(?<![A-Za-z0-9_.\\-])(?<!${parent}/)${old}/`, "g"),
    segment: new RegExp(`(?<![A-Za-z0-9_])(["'\`])${old}\\1`, "g"),
    backslash: new RegExp(`(?<![A-Za-z0-9_.\\-])(?<!${parent}\\\\)(?<!${parent}\\\\\\\\)${old}\\\\`, "g"),
  };
}

/** The 0-based line of each offset in `text`, by the newline positions. */
function lineStarts(text: string): number[] {
  const starts = [0];
  for (let i = text.indexOf("\n"); i !== -1; i = text.indexOf("\n", i + 1)) starts.push(i + 1);
  return starts;
}
function lineOf(starts: readonly number[], offset: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/**
 * Count every site of the three spellings in `text`, after removing exact occurrences of LEGACY_FALLBACK_CLAUSE
 * (D-15). Each piece between removed clauses is counted on its own, with its offset in the original text, so line
 * numbers are the original ones (the clause holds no newline).
 */
export function countSpellings(text: string): SpellingCount {
  const patterns = spellingPatterns();
  const starts = lineStarts(text);
  const pieces = text.split(LEGACY_FALLBACK_CLAUSE);
  const found: Array<{ offset: number; order: number; spelling: SpellingName }> = [];
  let base = 0;
  for (const piece of pieces) {
    SPELLING_NAMES.forEach((name, order) => {
      const re = patterns[name];
      re.lastIndex = 0;
      for (let m = re.exec(piece); m !== null; m = re.exec(piece)) found.push({ offset: base + m.index, order, spelling: name });
    });
    base += piece.length + LEGACY_FALLBACK_CLAUSE.length;
  }
  const sites = found
    .map((f) => ({ ...f, line: lineOf(starts, f.offset) }))
    .sort((a, b) => a.line - b.line || a.order - b.order || a.offset - b.offset)
    .map((f): Site => ({ line: f.line, spelling: f.spelling }));
  const totals: Record<SpellingName, number> = { slash: 0, segment: 0, backslash: 0 };
  for (const s of sites) totals[s.spelling] += 1;
  return { totals, sites, clauseOccurrences: pieces.length - 1 };
}

/** True when the repository-relative POSIX path `rel` lies under a directory named for the pre-v3 root. */
export function legacyPathHit(rel: string): boolean {
  return spellingPatterns().slash.test(rel);
}

/** One file's sites. */
export interface FileSites {
  readonly path: string;
  readonly sites: Site[];
}

/** What scanTracked found. */
export interface ScanResult {
  /** Distinct paths git listed. */
  readonly listed: number;
  /** Paths read and counted. */
  readonly scanned: number;
  /** The paths read and counted, sorted (what an allow-list entry can match). */
  readonly scannedPaths: string[];
  /** Paths under a SCAN_EXCLUSIONS prefix, never read. */
  readonly excluded: number;
  /** Excluded paths per exclusion prefix, in SCAN_EXCLUSIONS order. */
  readonly excludedBy: ReadonlyArray<{ readonly exclusion: ScanExclusion; readonly count: number }>;
  /** Listed paths absent from disk (an uncommitted deletion). */
  readonly notOnDisk: string[];
  /** Files with one site or more, sorted by path. */
  readonly files: FileSites[];
  /** Every site, sorted by path, then line, then spelling order. */
  readonly sites: Array<Site & { readonly path: string }>;
  /** Listed, non-excluded paths under a directory named for the pre-v3 root, sorted. */
  readonly legacyPaths: string[];
  readonly totals: Record<SpellingName, number>;
  /** Exact clause occurrences removed across every scanned file. */
  readonly clauseOccurrences: number;
}

const byPath = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * List `pathspecs` (every file when empty) with git under `root`, then count every listed, non-excluded file.
 * Throws ScanError when git fails or a listed file cannot be read for a reason other than being absent.
 */
export function scanTracked(root: string, pathspecs: readonly string[]): ScanResult {
  let listedRaw: string;
  try {
    listedRaw = execFileSync("git", ["-C", root, "ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...pathspecs], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (err) {
    const stderr = String((err as { stderr?: unknown }).stderr ?? "").trim().split("\n")[0];
    throw new ScanError(`git ls-files failed in ${root}${stderr === "" ? "" : `: ${stderr}`}`);
  }
  const listed = [...new Set(listedRaw.split("\0").filter((p) => p !== ""))].sort(byPath);
  const excludedBy = SCAN_EXCLUSIONS.map((exclusion) => ({ exclusion, count: 0 }));
  const notOnDisk: string[] = [];
  const files: FileSites[] = [];
  const sites: Array<Site & { path: string }> = [];
  const legacyPaths: string[] = [];
  const totals: Record<SpellingName, number> = { slash: 0, segment: 0, backslash: 0 };
  const scannedPaths: string[] = [];
  let clauseOccurrences = 0;
  for (const path of listed) {
    const hit = excludedBy.find((e) => path.startsWith(e.exclusion.prefix));
    if (hit !== undefined) {
      hit.count += 1;
      continue;
    }
    if (legacyPathHit(path)) legacyPaths.push(path);
    let text: string;
    try {
      text = readFileSync(join(root, ...path.split("/")), "latin1");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        notOnDisk.push(path);
        continue;
      }
      throw new ScanError(`${path} could not be read: ${(err as Error).message}`);
    }
    scannedPaths.push(path);
    const c = countSpellings(text);
    clauseOccurrences += c.clauseOccurrences;
    if (c.sites.length === 0) continue;
    files.push({ path, sites: c.sites });
    for (const s of c.sites) {
      sites.push({ path, ...s });
      totals[s.spelling] += 1;
    }
  }
  return {
    listed: listed.length,
    scanned: scannedPaths.length,
    scannedPaths,
    excluded: excludedBy.reduce((n, e) => n + e.count, 0),
    excludedBy,
    notOnDisk,
    files,
    sites,
    legacyPaths,
    totals,
    clauseOccurrences,
  };
}

// ── the CLI ──────────────────────────────────────────────────────────────────────────────────────────────────────

function repositoryRoot(cwd: string): string {
  try {
    return execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (err) {
    const stderr = String((err as { stderr?: unknown }).stderr ?? "").trim().split("\n")[0];
    throw new ScanError(`git could not find a repository from ${cwd}${stderr === "" ? "" : `: ${stderr}`}`);
  }
}

function couldNotRun(reason: string): never {
  process.stdout.write(`could not run: ${reason}\n\n== Result ==\nCOULD NOT RUN (exit 2): no count is reported\n`);
  process.stderr.write(`state-path-scan: could not run: ${reason}\n`);
  process.exit(2);
}

function main(argv: readonly string[]): void {
  const pathspecs = argv;
  let result: ScanResult;
  try {
    const root = repositoryRoot(process.cwd());
    result = scanTracked(root, pathspecs);
  } catch (err) {
    couldNotRun(err instanceof Error ? err.message : String(err));
  }
  const scope = pathspecs.length === 0 ? "every listed file" : `pathspec ${pathspecs.join(" ")}`;
  if (result.listed === 0) couldNotRun(`the scan set is empty: git listed no file for ${scope}`);
  if (result.scanned === 0) {
    couldNotRun(`the scan set is empty: git listed ${result.listed} file(s) for ${scope}, and none was read (${result.excluded} excluded, ${result.notOnDisk.length} not on disk)`);
  }
  const out: string[] = [];
  out.push(`state-path-scan: sites spelling the pre-v3 state root (${scope})`);
  out.push(`scanned ${result.scanned} file(s) of ${result.listed} listed; ${result.excluded} excluded; ${result.notOnDisk.length} not on disk`);
  for (const { exclusion, count } of result.excludedBy) out.push(`excluded: ${exclusion.prefix} (${exclusion.reason}): ${count} file(s)`);
  for (const p of result.notOnDisk) out.push(`not on disk: ${p}`);
  for (const s of [...result.sites].sort((a, b) => byPath(a.path, b.path) || a.line - b.line || SPELLING_NAMES.indexOf(a.spelling) - SPELLING_NAMES.indexOf(b.spelling))) {
    out.push(`${s.path}:${s.line}: ${s.spelling}`);
  }
  for (const p of result.legacyPaths) out.push(`legacy path: ${p}`);
  const t = result.totals;
  const siteCount = t.slash + t.segment + t.backslash;
  out.push(
    `totals: slash ${t.slash}, segment ${t.segment}, backslash ${t.backslash}; ${siteCount} site(s) in ${result.files.length} file(s); ` +
      `${result.legacyPaths.length} legacy path(s); ${result.clauseOccurrences} exact fallback clause occurrence(s) removed before counting`,
  );
  out.push("", "== Result ==");
  const clean = siteCount === 0 && result.legacyPaths.length === 0;
  out.push(
    clean
      ? `PASS: ${result.scanned} file(s) scanned, zero sites and zero legacy paths`
      : `FAIL: ${siteCount} site(s) and ${result.legacyPaths.length} legacy path(s) in ${result.scanned} file(s) scanned`,
  );
  process.stdout.write(`${out.join("\n")}\n`);
  process.exit(clean ? 0 : 1);
}

if (isEntrypoint(import.meta.url)) main(process.argv.slice(2));
