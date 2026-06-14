// test-skip-integrity.ts — the second TOOL-02 kit-shipped runnable (D-PL1/D-12).
//
// This is the un-cheatable test-integrity checker — a near-clone of reference-check.ts that
// validates grugops's OWN justification registry (.grugops/test-skips.md) and compares a
// host-reported skip count against the count of VALID justifications. It is the structural,
// mechanical enforcement form (D-PL1): an agent under the quality gate physically cannot clear
// a test-integrity failure by self-authoring a justification — test-integrity is human-only
// (D-08) and the registry is human-owned (D-02). This checker only validates format + expiry +
// count; it never trusts authorship. (Requirements TINT-01, TINT-02; the mechanical half of
// TINT-03.)
//
// The mechanism (D-11/D-PL3): authored as .ts in the central kit, compiled to a committed
// test-skip-integrity.js (same tsc build + freshness gate as everything else, D-02), then
// MATERIALIZED by install.ts into the host's committed path tools/grugops/test-skip-integrity.js.
// The host runs `node tools/grugops/test-skip-integrity.js .grugops/test-skips.md --skip-count <N>`
// with ONLY Node present — no ~/.grugops, no npm, no node_modules. That is why this file imports
// node: builtins ONLY (Pitfall 3): a single committed .js must run in bare host CI where the
// central kit is absent. The markdown table is parsed with plain String.split — no markdown
// library (Don't-Hand-Roll: builtins only, D-03).
//
// The D-12 contract (uniform across all kit-shipped runnables):
//   node <repo-local-path>/test-skip-integrity.js <registry> [--skip-count <N>] [--json] [--today <YYYY-MM-DD>]
//     exit 0 → pass / no findings
//     exit 1 → findings / fail (the quality gate blocks)
//     exit 2 → error (could not run — distinguishable from a clean "fail")
//     stdout → human-readable findings in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → optional machine-readable { ok, findings } block when invoked with --json
//
// VOICE DISCIPLINE (CLAUDE.md hard rule): every finding/error string this routine emits is
// CLEAR PROFESSIONAL ENGLISH — this is a quality/safety surface, never caveman voice.

import { readFileSync } from "node:fs";

// The closed list of allowed skip categories (D-04). A valid+unexpired flaky-quarantine row
// counts as a justification — the non-blocking lane (D-04/TINT-02).
const VALID_CATEGORIES = new Set([
  "flaky-quarantine",
  "external-dependency",
  "wip-behind-flag",
  "platform-specific",
  "deprecated-pending-removal",
]);

// Placeholder owners that make a justification HOLLOW (Pitfall 3) — a blank or a stand-in name
// is not a real, accountable owner. This is the SC3 keystone: an agent self-authored row cannot
// name a real human owner, so it trips here.
const PLACEHOLDER_OWNERS = new Set(["", "-", "todo", "tbd", "me", "agent"]);

// --- parse args (D-12) ----------------------------------------------------------------------
// First non-flag argv = the registry path; --json toggles the machine block; --skip-count <N>
// (or --skip-count=N) supplies the host-reported skipped-test count; --today <YYYY-MM-DD> is a
// testing affordance (Pitfall 4) — the gate path uses the real wall-clock date by default.
const argv = process.argv.slice(2);
const wantJson = argv.includes("--json");
const registryPath = argv.find((a) => !a.startsWith("--"));

// Parse a "--flag value" or "--flag=value" pair out of argv; returns the raw string or undefined.
function flagValue(name: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === name) return argv[i + 1];
    if (a.startsWith(`${name}=`)) return a.slice(name.length + 1);
  }
  return undefined;
}

const skipCountRaw = flagValue("--skip-count");
const todayRaw = flagValue("--today");

// --- fail-closed input read (exit 2 = error, distinct from a clean fail) ---------------------
// A missing registry path, or a missing/unreadable file, is an ERROR — never a silent pass. We
// read fail-closed in a try/catch and exit 2 with a clear-voice message on stderr (so a gate can
// tell "could not run" apart from "ran and found nothing"). T-16-01-04: malformed/missing input
// must return a clean error, never crash open.
if (!registryPath) {
  process.stderr.write(
    "Error: no registry file path was provided. Usage: node test-skip-integrity.js <registry-file> [--skip-count <N>] [--json]\n",
  );
  process.exit(2);
}

let contents: string;
try {
  contents = readFileSync(registryPath, "utf8");
} catch {
  process.stderr.write(`Error: cannot read the registry file: ${registryPath}\n`);
  process.exit(2);
}

// --- determine "today" (Pitfall 4) ----------------------------------------------------------
// Default to the real wall-clock date (YYYY-MM-DD, UTC) so the expiry comparison is the gate's
// real-world judgement. A --today override is a documented testing affordance only.
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
const today = todayRaw && /^\d{4}-\d{2}-\d{2}$/.test(todayRaw) ? todayRaw : isoDate(new Date());

// --- parse the markdown registry table (D-03, builtins only) --------------------------------
// Columns are exactly: Test ID | Reason | Owner | Ticket/REQ | Expiry (YYYY-MM-DD) | Category.
// We walk lines, keep only pipe-delimited table rows, skip the header row and the |---| separator
// row, and split each remaining row on "|" into trimmed cells. No markdown library (D-03).
interface Row {
  testId: string;
  reason: string;
  owner: string;
  ticket: string;
  expiry: string;
  category: string;
}

function splitCells(line: string): string[] {
  // A leading/trailing pipe produces empty edge cells; drop exactly those edges, trim the rest.
  let cells = line.split("|").map((c) => c.trim());
  if (cells.length && cells[0] === "") cells = cells.slice(1);
  if (cells.length && cells[cells.length - 1] === "") cells = cells.slice(0, -1);
  return cells;
}

// A separator row is all dashes/colons/spaces between pipes (e.g. |---|:--:|).
function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
}

const rows: Row[] = [];
let headerSeen = false;
for (const line of contents.split("\n")) {
  if (!line.includes("|")) continue;
  const cells = splitCells(line);
  if (cells.length < 6) continue;
  if (isSeparatorRow(cells)) continue;
  // The first non-separator pipe row is the header — identify it by its first cell and skip it.
  if (!headerSeen && /test\s*id/i.test(cells[0])) {
    headerSeen = true;
    continue;
  }
  rows.push({
    testId: cells[0],
    reason: cells[1],
    owner: cells[2],
    ticket: cells[3],
    expiry: cells[4],
    category: cells[5],
  });
}

// --- validate each row + count valid justifications -----------------------------------------
// A row is INVALID (hollow / malformed) if ANY of: empty Test ID, empty Ticket/REQ, placeholder
// or blank Owner, off-list Category, or unparseable Expiry. A row is EXPIRED if its Expiry parses
// but is strictly before today — an expired entry blocks regardless of counts (D-05). A VALID
// justification is a row that is neither invalid nor expired.
const findings: string[] = [];
let validJustifications = 0;

// Strict YYYY-MM-DD parse: format-check then round-trip through Date so a real calendar date is
// required (rejects 2024-13-40 and the like).
function parseExpiry(s: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return isoDate(d) === s ? s : null;
}

for (const row of rows) {
  const label = row.testId || "(unnamed row)";
  let invalid = false;

  if (row.testId === "") {
    findings.push(
      "A skip-registry row has an empty Test ID; every justified skip must name the test it applies to.",
    );
    invalid = true;
  }
  if (PLACEHOLDER_OWNERS.has(row.owner.toLowerCase())) {
    findings.push(
      `The skip justification for "${label}" has no real owner (found "${row.owner || "(blank)"}"); a placeholder owner is not an accountable owner.`,
    );
    invalid = true;
  }
  if (row.ticket === "") {
    findings.push(
      `The skip justification for "${label}" has no Ticket/REQ reference; every justified skip must cite a ticket or requirement.`,
    );
    invalid = true;
  }
  if (!VALID_CATEGORIES.has(row.category.toLowerCase())) {
    findings.push(
      `The skip justification for "${label}" has an unrecognized category "${row.category}"; it must be one of: ${[...VALID_CATEGORIES].join(", ")}.`,
    );
    invalid = true;
  }

  const parsedExpiry = parseExpiry(row.expiry);
  if (parsedExpiry === null) {
    findings.push(
      `The skip justification for "${label}" has an unparseable Expiry "${row.expiry}"; it must be a real date in YYYY-MM-DD form.`,
    );
    invalid = true;
  } else if (parsedExpiry < today) {
    findings.push(
      `The skip justification for "${label}" expired on ${parsedExpiry} (today is ${today}); an expired justification no longer counts and must be renewed or removed.`,
    );
    // An expired-but-otherwise-valid row is not invalid in format, but it does NOT count as a
    // justification and it blocks (D-05).
    invalid = true;
  }

  if (!invalid) validJustifications++;
}

// --- compare the host skip count against the valid-justification count (D-05/D-14) ----------
// The skip count is REQUIRED, non-fabricated input. If it is absent or not a non-negative
// integer, we cannot confirm the suite is fully justified — emit a clear-voice UNKNOWN finding
// and fail (never coerce a silent 0 to a pass, D-14).
if (skipCountRaw === undefined || !/^\d+$/.test(skipCountRaw)) {
  findings.push(
    "Skip count was not provided (UNKNOWN - verify); cannot confirm the suite is fully justified.",
  );
} else {
  const skipCount = parseInt(skipCountRaw, 10);
  if (skipCount > validJustifications) {
    findings.push(
      `Unjustified skips: the runner reported ${skipCount} skipped tests but only ${validJustifications} are justified.`,
    );
  }
}

// --- emit per the D-12 result contract -------------------------------------------------------
if (findings.length > 0) {
  if (wantJson) {
    console.log(JSON.stringify({ ok: false, findings }));
  } else {
    for (const f of findings) console.log(f); // clear professional voice, one finding per line
  }
  process.exit(1); // 1 = findings / the gate blocks
}

if (wantJson) {
  console.log(JSON.stringify({ ok: true, findings: [] }));
} else {
  console.log("No findings.");
}
process.exit(0); // 0 = pass
