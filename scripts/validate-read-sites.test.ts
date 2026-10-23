// validate-read-sites.test.ts — READ-1 over every read site of the structure validator (plan 37-26, D-17,
// 37-GAP-PLANNING-BRIEF.md §1 READ-1 and §2.1).
//
// THE RULE. In scripts/validate-agent-factory.js a read that fails is a named finding: exit 1, an ERROR line that
// names a path and the code, and no `ALL CHECKS PASSED`. It is never "no data", never a skipped check and never a
// pass. Only ENOENT is absence, and absence keeps its own behavior (validate.test.ts, the IN-03 controls).
//
// WHERE THE SITES COME FROM. Every site is derived from the COMMITTED .js by scripts/fault-inject.test-support.ts
// (deriveReadSites): each call whose callee resolves through the file's own node:fs bindings to a read function.
// The validator reads only through five functions (statAt, lstatAt, textAt, namesAt and canonicalBase), so a site
// inside a function entered from two or more call expressions (callingSites) is failed once per calling call
// expression (`via`, named `<scope>#<ordinal>`). READ_SITE_ROWS is the hand-written table; the derived set is held
// equal to it in both directions, and the derived count is pinned.
//
// HOW A SITE IS FAILED. The committed validator runs in place, with the fault-injection preload (`node --import`):
// the named node:fs call throws EIO when the stack holds the site line and, for a via row, the via line. The kit
// root is this repository, read only; the state root is a fresh scratch copy of a valid state tree per row, with the
// D-14 marker (so a budget finding is an ERROR) and one ticket (so checkTickets reads the board, the trace index and
// the ticket). The validator writes nothing; each row asserts the scratch tree is unchanged.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  STATE_ROOT_REL,
  TICKETS_REL,
  TRACEABILITY_REL,
} from "../install/state-layout.js";
import {
  FS_READ_FNS,
  callingSites,
  classifiedFsCalls,
  deriveReadSites,
  hasNodeStack,
  runFaulted,
  scriptUrl,
  treeDigest,
  type ReadSite,
} from "./fault-inject.test-support.js";

const HERE = import.meta.dirname;
const ROOT = join(HERE, "..");
const VALIDATOR_JS = join(HERE, "validate-agent-factory.js");
const FIX_GOOD = join(HERE, "fixtures", "good");

// ── The pins ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The derived read-site count of the committed validator. 2026-10-23, plan 37-26: 5, one per read function. At
 * d9fa837c it was 13 node:fs read calls spread over ten functions, five of them existsSync, which reads every
 * failure as absence.
 */
const VALIDATOR_READ_SITES = 5;

/** The functions every read site of the validator sits in: the four primitives and canonicalBase's realpath. */
const READ_FUNCTIONS = Object.freeze(["statAt", "lstatAt", "textAt", "namesAt", "canonicalBase"]);

/**
 * A site no fixture can reach, by key, each with a one-line reason. A site belongs here only when it fired no fault
 * AND the preload counted no call at it (site-not-via 0). Expected empty; its size is pinned and printed.
 */
const UNREACHED_SITES: ReadonlyMap<string, string> = new Map();
const UNREACHED_SITES_SIZE = 0;

// ── The table ───────────────────────────────────────────────────────────────────────────────────────────

/** One row: a derived site and, for a function entered from two or more call expressions, one of them. */
interface ReadSiteRow {
  readonly key: string;
  /** `<scope>#<ordinal>` of the calling call expression, the ordinal counted among calls in that scope. */
  readonly via?: string;
}

function rows(key: string, vias?: readonly string[]): ReadSiteRow[] {
  return vias === undefined ? [{ key }] : vias.map((via) => ({ key, via }));
}

const READ_SITE_ROWS: readonly ReadSiteRow[] = [
  // stat: the two existence helpers, every governance position, and the budget pass (marker, board, indexes, dirs).
  ...rows("statAt:statSync#0", [
    "kitExists#0",
    "stateExists#0",
    "checkConfig#0",
    "readLayoutMarker#0",
    "boardFindings#0",
    "indexFindings#0",
    "directoryFindings#0",
  ]),
  // lstat: the record and progress sizes, from one caller.
  ...rows("lstatAt:lstatSync#0"),
  // read: the two text helpers, the governance positions, and the budget pass.
  ...rows("textAt:readFileSync#0", [
    "kitRead#0",
    "stateRead#0",
    "checkConfig#0",
    "readLayoutMarker#0",
    "boardFindings#0",
    "indexFindings#0",
  ]),
  // list: the tickets directory of checkTickets, and the budget directories.
  ...rows("namesAt:readdirSync#0", ["stateListDir#0", "directoryFindings#0"]),
  // realpath: the in-kit config's base, and each governance base.
  ...rows("canonicalBase:realpathSync#0", ["checkConfig#0", "checkConfig#1"]),
];

// ── The derived set ─────────────────────────────────────────────────────────────────────────────────────

/** One derived (site, via) pair, with the line the preload matches for the via. */
interface DerivedPair {
  readonly site: ReadSite;
  readonly via?: { readonly id: string; readonly line: number; readonly kind: "direct" | "passed" };
}

/** `<key>` or `<key> via <via>`: one row's identity. */
function pairId(key: string, via: string | undefined): string {
  return via === undefined ? key : `${key} via ${via}`;
}

/** Every (site, via) pair: one per site, or one per calling call expression of a function entered from two or more. */
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
      out.push({ site, via: { id: `${c.scope}#${ordinal}`, line: c.line, kind: c.kind } });
    }
  }
  return out;
}

const DERIVED = derivedPairs(VALIDATOR_JS);

/** The derived pair a row names. */
function pairOf(row: ReadSiteRow): DerivedPair {
  const found = DERIVED.filter((p) => p.site.key === row.key && p.via?.id === row.via);
  expect(found, `PREMISE: exactly one derived pair ${pairId(row.key, row.via)}`).toHaveLength(1);
  return found[0] as DerivedPair;
}

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/**
 * A ticket document the ticket grammar admits, in the Ready column the good fixture's board carries. It is copied
 * from the board-snapshot fixture rather than written here, so this file plants no ticket document of its own
 * (validate.test.ts's ticket-reader census counts a file that does as a candidate second reader).
 */
const READY_TICKET_FIXTURE = join(HERE, "fixtures", "board-snapshot", TICKETS_REL, "ABC-200.md");

/**
 * A valid state tree: the good fixture's state directory, the D-14 marker, and one ticket with its trace row. The
 * unfaulted validator passes it with no ERROR and no WARNING (asserted as the premise below).
 */
function stateRoot(): string {
  const d = mkTmp("grugops-validate-read-sites-");
  cpSync(join(FIX_GOOD, STATE_ROOT_REL), join(d, STATE_ROOT_REL), { recursive: true });
  writeFileSync(join(d, LAYOUT_MARKER_REL), LAYOUT_MARKER_CONTENT);
  cpSync(READY_TICKET_FIXTURE, join(d, TICKETS_REL, "ABC-200.md"));
  appendFileSync(join(d, TRACEABILITY_REL), "| ABC-200 | t | | | | | | | | |\n");
  return d;
}

/** The validator's environment: the kit root is this repository, the state root `state`. */
function roots(state: string): Record<string, string> {
  return { VALIDATE_KIT_ROOT: ROOT, VALIDATE_ROOT: state };
}

/** The ERROR lines of stderr. */
function errorLines(stderr: string): string[] {
  return stderr.split("\n").filter((l) => l.startsWith("  ERROR "));
}

/** An ERROR line that names a path (relative with a slash, or absolute) before its first `: `. */
const PATH_ERROR = /^ {2}ERROR {4}\S*\/\S*: /;

// ── The derivation, its pin and the two-sided equalities ───────────────────────────────────────────────

describe("READ-1 validator sites are derived and counted, and the table equals the derived set (plan 37-26, D-17)", () => {
  it("the derived site count is pinned", () => {
    expect(deriveReadSites(VALIDATOR_JS).map((s) => s.key)).toHaveLength(VALIDATOR_READ_SITES);
  });

  it("every site sits in one of the five read functions, one site each", () => {
    const sites = deriveReadSites(VALIDATOR_JS);
    expect(sites.map((s) => s.enclosing).sort()).toEqual([...READ_FUNCTIONS].sort());
  });

  it("the table's site keys equal the derived site keys, both ways", () => {
    const derived = [...new Set(deriveReadSites(VALIDATOR_JS).map((s) => s.key))].sort();
    const table = [...new Set(READ_SITE_ROWS.map((r) => r.key))].sort();
    expect(table).toEqual(derived);
  });

  it("the table's (site, via) pairs equal the derived pairs, both ways, each once", () => {
    const derived = DERIVED.map((p) => pairId(p.site.key, p.via?.id)).sort();
    const table = READ_SITE_ROWS.map((r) => pairId(r.key, r.via)).sort();
    expect(new Set(table).size, "no pair is listed twice").toBe(table.length);
    expect(table).toEqual(derived);
  });

  it("UNREACHED_SITES is printed and its size is pinned at 0", () => {
    console.log(`UNREACHED_SITES (${UNREACHED_SITES.size}): ${[...UNREACHED_SITES].map(([k, v]) => `${k}: ${v}`).join("; ") || "none"}`);
    expect(UNREACHED_SITES.size).toBe(UNREACHED_SITES_SIZE);
  });

  it("no existsSync remains: an existence test reads every failure as absence", () => {
    expect(deriveReadSites(VALIDATOR_JS).filter((s) => s.fn === "existsSync").map((s) => s.key)).toEqual([]);
    expect(classifiedFsCalls(VALIDATOR_JS)).not.toContain("existsSync");
  });

  it("every node:fs name the validator uses is a read function: it writes nothing", () => {
    const reads = new Set<string>(FS_READ_FNS);
    const used = classifiedFsCalls(VALIDATOR_JS);
    expect(used.filter((n) => !reads.has(n)), "a node:fs name outside FS_READ_FNS").toEqual([]);
    expect(used).toEqual(["lstatSync", "readFileSync", "readdirSync", "realpathSync", "statSync"]);
  });
});

// ── The table: every read site, under every caller ─────────────────────────────────────────────────────

describe("READ-1 validator table: every derived read site fails as a named ERROR, never a pass (plan 37-26, D-17)", () => {
  it("PREMISE: the unfaulted validator passes the fixture with no ERROR and no WARNING", () => {
    const state = stateRoot();
    const r = spawnSync(process.execPath, [VALIDATOR_JS], {
      encoding: "utf8",
      cwd: ROOT,
      timeout: 30_000,
      env: { ...process.env, ...roots(state) },
    });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stdout).toBe("ALL CHECKS PASSED\n");
    expect(errorLines(r.stderr ?? ""), r.stderr).toEqual([]);
    expect((r.stderr ?? "").split("\n").filter((l) => l.startsWith("  WARNING ")), r.stderr).toEqual([]);
  });

  for (const row of READ_SITE_ROWS) {
    it(pairId(row.key, row.via), () => {
      const pair = pairOf(row);
      const state = stateRoot();
      const before = treeDigest(state);
      const url = scriptUrl(VALIDATOR_JS);
      const r = runFaulted(
        VALIDATOR_JS,
        [],
        {
          kind: "fs",
          fn: pair.site.fn,
          site: { url, line: pair.site.line },
          ...(pair.via === undefined ? {} : { via: { url, line: pair.via.line } }),
          code: "EIO",
        },
        { scratch: mkTmp("grugops-validate-read-sites-fault-"), cwd: ROOT, env: roots(state) },
      );
      const after = treeDigest(state);
      const where =
        `site ${pair.site.key} line ${pair.site.line}` +
        (pair.via === undefined ? "" : `, via ${pair.via.id} line ${pair.via.line} (${pair.via.kind})`);
      const all = `${where}\nstatus ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
      expect(
        r.fired,
        `the fault fired; the preload counted ${r.siteNotVia} call(s) at the site but not the via (non-zero: the via ` +
          `line is wrong, fix the derivation or the fixture, never this assertion)\n${all}`,
      ).toBeGreaterThan(0);
      expect(r.signal, all).toBeNull();
      expect(r.status, `exit 1: a failed read is a finding\n${all}`).toBe(1);
      expect(r.stdout, `no pass line after a failed read\n${all}`).not.toContain("ALL CHECKS PASSED");
      const named = errorLines(r.stderr).filter((l) => PATH_ERROR.test(l) && l.includes("(EIO)"));
      expect(named.length, `an ERROR line names a path and the code (the unfaulted run has none)\n${all}`).toBeGreaterThan(0);
      expect(hasNodeStack(r.stderr), `no Node stack trace\n${all}`).toBe(false);
      expect(after, `the validator wrote nothing\n${all}`).toEqual(before);
    });
  }
});
