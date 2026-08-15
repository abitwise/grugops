// audit-model.ts — the SINGLE parse authority for Phase 28's two hand-authored docs/ artifacts
// (AUDIT-01 / AUDIT-03, D-05 and D-13).
//
// Two artifacts, one grammar: docs/audit/28-disposition-register.md (the AUDIT-01 disposition
// register, read by scripts/check-audit-register.js) and docs/audit/28-claim-registry.md (the
// AUDIT-03 claim registry, read by plan 28-04's gate). A second parser in 28-04 would be a second
// grammar over the same class of bytes, which is the duplicate-grammar defect this repository has
// collapsed twice — so readRegistry() is declared HERE, beside readRegister(), and 28-04 imports it.
//
//   import { readRegister, readRegistry } from "./audit-model.js";
//
// THIS IS A LIBRARY, SO IT THROWS. The gates that consume it REPORT through their own fail()
// helpers. That split is the established floor (scripts/kit-model.ts records it against its
// install/kit-source.ts twin): a library that quietly returns a short or empty result lets every
// downstream consumer pass vacuously over it, while a gate's job is to finish its other classes and
// print a verdict. This module NEVER calls process.exit — it is imported, not run.
//
// Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a build-safety surface).
//
// ---------------------------------------------------------------------------------------------
// THE CONTRACT THIS REPOSITORY HAS NO PRIOR INSTANCE OF, AND THE ONE POSTURE THAT IS SAFE FOR IT.
//
// docs/catalog/README.md is the only docs/ markdown file a scripts/ gate reads today, and it is
// GENERATED — scripts/catalog-freshness.ts never parses it, it regenerates and compares bytes. The
// register and the registry are HAND-AUTHORED and READ BY A GATE THAT DECIDES WHETHER THE BUILD IS
// GREEN. That is a genuinely new trust boundary here.
//
// For a hand-authored input the only safe posture is to FAIL CLOSED on anything the parser cannot
// read, and the reason is arithmetic rather than taste. A parser that SKIPS a row it cannot
// understand performs a SILENT TRUNCATION, and a truncated set satisfies every completeness
// equality downstream of it: 35 rows compared against 35 derived files agree perfectly while the
// 36th file was never audited at all. The truncation is invisible precisely because the check that
// would have caught it was computed over the truncated set. So every malformation enumerated below
// throws, naming the file, the line and what was wrong — and nothing is ever skipped.
//
// REFUSALS ARE ORDERED, NOT RACING. Validation runs in one fixed order and stops at the first
// failure. Two runs over one malformed artifact therefore produce the SAME message, which is what
// makes a fix reproducible; a parser whose arms race produces a different complaint each run and
// trains its reader to re-run rather than to read. scripts/audit-model.test.ts asserts the ordering
// directly by planting two violations at once and naming which one must fire.
//
// RECORDED RESIDUAL, NOT CLAIMED AWAY (`UNKNOWN - verify`): the refusals below cover the
// malformation SHAPES enumerated in this file, not the CLASS. A hand-authored artifact can be wrong
// in ways no schema anticipates — a row that parses perfectly and describes the wrong file, an
// observation that is fluent and false, a claim quoted accurately from a sentence that was never
// public. This parser proves STRUCTURE. It cannot prove TRUTH, and the register says so in its own
// prose (`## What this register does not prove`) rather than letting a green parse imply it.
// ---------------------------------------------------------------------------------------------

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
// (Plan 29-25, LANG-07) The ONE section-locator authority. This module answers no section-extent
// question of its own — see `tableUnder`, the fifth and last locator of the class to be reconciled.
import {
  FENCE_DELIMITER_LINE,
  fencedLineFlags,
  sectionEndIndex,
  unfencedHeadingIndex,
  unfencedMatchIndices,
} from "./frontmatter.js";

// ---------------------------------------------------------------------------
// The fixed artifact paths.
//
// These are FIXED REPO-RELATIVE LITERALS resolved against a root PARAMETER, following the posture
// scripts/catalog-freshness.ts records for its OUT: under a test mirror the ROOT is redirected and
// the path literal never is. Neither is ever taken from argv, env or file content (ASVS V12).
// ---------------------------------------------------------------------------
export const REGISTER_PATH = "docs/audit/28-disposition-register.md";
export const REGISTRY_PATH = "docs/audit/28-claim-registry.md";

const DEFAULT_ROOT = join(import.meta.dirname, "..");

// ---------------------------------------------------------------------------
// THE CLOSED SETS. Each is enumerated ONCE here and never written down a second time; every
// membership question is answered by computing the COMPLEMENT against these arrays rather than by
// maintaining a parallel list of illegal values (the pluginForbiddenComponentKeys idiom in
// scripts/kit-model.ts — "COMPUTED, and NEVER written down a second time"). A second list of
// forbidden values is how the two lists come to disagree.
// ---------------------------------------------------------------------------

// AUDIT-01's three disposition names, exactly as the requirement spells them. Nothing invented:
// there is no `wontfix`, no `n/a`, no `open`. A finding is fixed here, accepted with a reason, or
// deferred to a named phase — and a fourth value fails rather than passing silently (D-04).
export const DISPOSITIONS = ["fixed", "accepted", "deferred"] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

// D-13's three claim kinds. Phase 30's claim-dropping filters to `safety`; the other two exist so
// architecture and install claims get ids and cannot drift back unnoticed (D-15 — one registry,
// kind-tagged, never a second registry).
export const CLAIM_KINDS = ["safety", "architecture", "install"] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

// D-17's three statuses, measured against the claim's named mechanism. Anything not `true` becomes
// an AUDIT-01 finding; `overstated` is a real verdict and not a hedge.
export const CLAIM_STATUSES = ["true", "overstated", "false"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

// D-18's per-row safety-surface flag, plus the UNFILLED MARKER.
//
// WHY THE MARKER IS A LEGAL PARSE VALUE AND STILL A GATE FAILURE. The register ships in this plan
// with every row unread. Writing `no` into 37 unread rows would be recording a verdict nobody
// reached — the exact unearned-observation shape T-28-14 names — and writing an unparseable value
// would make the register unreadable rather than incomplete, so the gate could not report on it at
// all. `—` is therefore parseable and meaningless on purpose: the PARSER admits it, and the GATE
// refuses to pass while any row still carries it. The two answer different questions.
export const SAFETY_SURFACE_VALUES = ["yes", "no", "—"] as const;
export type SafetySurface = (typeof SAFETY_SURFACE_VALUES)[number];

// Table A's `kind`, derived by the reader from the file's own location and name rather than
// asserted: roles and workflows come from the kit-model listers, `protocol` is the single
// underscore-prefixed file D-02 keeps in-set for reading and out-of-set for counting.
export const REGISTER_KINDS = ["role", "workflow", "protocol"] as const;
export type RegisterKind = (typeof REGISTER_KINDS)[number];

export interface RubricCategory {
  readonly category: number;
  readonly name: string;
  readonly question: string;
  /** D-07: category 6 is RECORD-ONLY. A record-only finding may never be fixed in this phase. */
  readonly recordOnly: boolean;
  /** The only phase a record-only finding may be deferred to. `null` for the five settled ones. */
  readonly onlyLegalTargetPhase: string | null;
}

// D-07's six categories. Category 6 is RECORD-ONLY and its only legal disposition is `deferred` to
// PHASE 29 — enforced structurally in validateFindingRows() below rather than left as a convention,
// because a convention is what a later editor reads past. The rule exists so this audit cannot turn
// into a style pass on the very prose Phase 29's LANG-02 is about to rewrite; a determinism finding
// fixed here is work done twice and a merge conflict besides.
export const RUBRIC_CATEGORIES: readonly RubricCategory[] = [
  {
    category: 1,
    name: "factual correctness",
    question:
      "does this file describe the architecture that actually ships — decompose rather than route, the shared verified context rather than a relay, the three spawn tiers?",
    recordOnly: false,
    onlyLegalTargetPhase: null,
  },
  {
    category: 2,
    name: "reference integrity",
    question:
      "does every path, role, workflow, checklist and config key this file names resolve on disk?",
    recordOnly: false,
    onlyLegalTargetPhase: null,
  },
  {
    category: 3,
    name: "claim honesty",
    question:
      "is anything unproven stated as fact, and is `UNKNOWN - verify` present where something is genuinely unknown?",
    recordOnly: false,
    onlyLegalTargetPhase: null,
  },
  {
    category: 4,
    name: "internal consistency",
    question:
      "do the counts, versions, tier names and config keys agree with the schema and with sibling files?",
    recordOnly: false,
    onlyLegalTargetPhase: null,
  },
  {
    category: 5,
    name: "strangeness",
    question:
      "are there vestigial sections, contradictions, dead options, or text with no remaining reader?",
    recordOnly: false,
    onlyLegalTargetPhase: null,
  },
  {
    category: 6,
    name: "instruction determinism",
    question: "would two agents reading this step reach the same act?",
    recordOnly: true,
    onlyLegalTargetPhase: "29",
  },
];

export interface SafetyFloor {
  /** The token a registry row's `depends_on` names. */
  readonly id: string;
  /**
   * The dotted path into agent-factory/config/factory.config.json this floor is held by, or `null`
   * when the floor is a HARD LIMIT with no config key. `null` is stated rather than a key being
   * invented, because an invented key reads as a dial someone could turn.
   */
  readonly configPath: string | null;
  readonly why: string;
}

// D-14's four safety floors — the things whose lowering would falsify a public safety claim.
//
// THE VALUES ARE NOT TRANSCRIBED HERE. Each config-backed floor carries the PATH to its value and
// safetyFloorLiveValue() reads it from the live config at run time, so the floor list cannot drift
// from the config it describes. A transcribed `"pr"` in this file would be a second authority for a
// value factory.config.json already owns, and scripts/audit-model.test.ts asserts the live read
// against an INDEPENDENT read of the same file so a stale transcription would be a red test.
export const SAFETY_FLOORS: readonly SafetyFloor[] = [
  {
    id: "autonomy",
    configPath: "autonomy",
    why: "How far an agent may act without a human. Lowering it past `pr` is what would falsify every claim that a human holds the merge.",
  },
  {
    id: "test_integrity",
    configPath: "quality.test_integrity",
    why: "Whether weakened or skipped tests are surfaced. It is NEVER off — a claim that the trace is the proof rests on it.",
  },
  {
    id: "production_requires_human_confirmation",
    configPath: "production_requires_human_confirmation",
    why: "Whether a production deploy demands a named human confirmation. Lowering it falsifies every claim that humans hold the deploy.",
  },
  {
    id: "protected_branch_merge",
    configPath: null,
    why: "Agents never merge a protected branch. This is a HARD LIMIT with NO config key — there is no dial for it, and naming one here would imply there is.",
  },
];

/**
 * The live value of a config-backed floor, read from the supplied root at call time. Returns `null`
 * for a hard-limit floor, which HAS no config value — `null` here means "this floor is not held by
 * a config key at all", never "the key is missing".
 */
export function safetyFloorLiveValue(
  floor: SafetyFloor,
  root: string = DEFAULT_ROOT,
): unknown {
  if (floor.configPath === null) return null;
  const path = join(root, "agent-factory/config/factory.config.json");
  let cfg: Record<string, unknown>;
  try {
    cfg = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch (e) {
    throw new Error(
      `audit-model: cannot read the factory config at ${path} — refusing to report a safety-floor ` +
        `value that was not read (${(e as Error).message})`,
    );
  }
  let cursor: unknown = cfg;
  for (const key of floor.configPath.split(".")) {
    if (cursor === null || typeof cursor !== "object") {
      throw new Error(
        `audit-model: the safety floor \`${floor.id}\` names config path \`${floor.configPath}\`, ` +
          `which does not resolve in ${path} — a floor whose value cannot be read is a floor this ` +
          `module cannot vouch for`,
      );
    }
    cursor = (cursor as Record<string, unknown>)[key];
  }
  if (cursor === undefined) {
    throw new Error(
      `audit-model: the safety floor \`${floor.id}\` names config path \`${floor.configPath}\`, ` +
        `which is absent from ${path} — refusing to report an undefined floor value as if it were read`,
    );
  }
  return cursor;
}

// ---------------------------------------------------------------------------
// Row shapes.
// ---------------------------------------------------------------------------

export interface RegisterRow {
  /** Repo-relative path. THE ROW KEY — duplicates are a named refusal. */
  readonly file: string;
  readonly kind: RegisterKind;
  /** `false` only for the D-02 protocol row, which is in-set for reading and out-of-set for counting. */
  readonly counted: boolean;
  readonly safetySurface: SafetySurface;
  /** The count of Table B rows naming this file, as DECLARED by the author. D-03 equality two's left side. */
  readonly findings: number;
  readonly observation: string;
  /** 1-based line number in the register, so a consumer's message is quotable. */
  readonly line: number;
}

export interface FindingRow {
  readonly findingId: string;
  readonly file: string;
  readonly category: number;
  readonly disposition: Disposition;
  readonly targetPhase: string;
  readonly reason: string;
  readonly line: number;
}

export interface Register {
  readonly rows: readonly RegisterRow[];
  readonly findings: readonly FindingRow[];
}

export interface ClaimRow {
  readonly id: string;
  readonly file: string;
  /**
   * The claim's position in `file`, in the CANONICAL FORM `N` or `N-M`.
   *
   * THE FORM IS ASSERTED; THE VALUE IS DELIBERATELY NOT (28-REVIEW WR-07). No consumer reads this
   * field — check-claim-anchors reports positions from the anchor's actual index — and that is a
   * DECISION the registry records in its own prose, under `## Why `line` is recorded and not
   * checked`: "Phase 29 rewrites prose for a living, and an assertive line number would go red on
   * every unrelated edit above a claim — training people to ignore a red gate, which is the failure
   * mode this milestone has spent itself fighting."
   *
   * The review's alternative — compare the declared number against `at + 2` — was therefore
   * DECLINED: it would overturn a documented decision to buy a gate that reds on edits it is not
   * about. What was genuinely missing is that a REQUIRED key was never format-validated at all, so a
   * `line: banana` parsed green while reading to a human as authoritative provenance. That half is
   * closed here, with the same canonical-form-plus-refusal doctrine the ids carry.
   *
   * A reader must therefore treat this as ADVISORY: it is where the claim sat when its row was
   * written, and nothing keeps it current.
   */
  readonly line: string;
  readonly kind: ClaimKind;
  readonly dependsOn: readonly string[];
  readonly status: ClaimStatus;
  /**
   * D-17: the specific thing this row's `status` was MEASURED against — a config value, a guard, a
   * hook, a test, a requirement checkbox. `""` when the key is absent.
   *
   * WHY THE PARSER ADMITS A BLANK ONE AND THE GATE REFUSES IT. This is the same split
   * `safety_surface: —` already records twenty lines above: the two answer different questions. An
   * unreadable value would make the registry unparseable rather than incomplete, so the gate could
   * not report on it at all; a blank one parses and is refused by scripts/check-claim-anchors.js,
   * which is where D-17's completeness belongs. This module is a LIBRARY and reports STRUCTURE; a
   * gate decides whether the build is green.
   */
  readonly mechanism: string;
  /** One of DISPOSITIONS when `status` is not `true`. `""` when absent — the gate refuses that. */
  readonly disposition: string;
  /** The F-28-NNN finding this non-`true` row is recorded as. `""` when absent. */
  readonly findingId: string;
  /** The phase a `deferred` disposition names. `""` when absent. */
  readonly targetPhase: string;
  /** The fenced block's contents, BYTE-FOR-BYTE. Never trimmed, collapsed or line-ending rewritten. */
  readonly verbatim: string;
}

export interface Registry {
  readonly claims: readonly ClaimRow[];
  /**
   * THE PARSE'S OWN DENOMINATOR (plan 29-28; D-08, and the AP-1 rule carried from Phase 28).
   *
   * `claims` is a PROJECTION — the claim-heading-shaped lines that survived the fence filter — and a
   * projection with no published denominator is a number that cannot be short against anything. The
   * day a claim heading is first written inside a fenced example, `claims` quietly loses a member,
   * `safetySurfaceUnion` quietly loses a file, and the D-18 exclusion list quietly stops protecting
   * it, with every gate green. These two tallies are what make that visible.
   *
   * DERIVED BY TWO SEPARATE EXPRESSIONS over the same text, never by one expression and a
   * subtraction of its own output. A harness that counts with the loop it is auditing is this
   * repository's newest recorded failure (29-REVIEW § WR-03), and this is the same shape one layer
   * down.
   */
  readonly headingShapedLines: number;
  /** How many of `headingShapedLines` were EXCLUDED because the fence toggle flags them. */
  readonly headingShapedFenced: number;
}

// ---------------------------------------------------------------------------
// Markdown-table primitives.
// ---------------------------------------------------------------------------

const TABLE_A_HEADING = "## Table A — audited files";
const TABLE_B_HEADING = "## Table B — findings";

const TABLE_A_COLUMNS = [
  "file",
  "kind",
  "counted",
  "safety_surface",
  "findings",
  "observation",
] as const;
const TABLE_B_COLUMNS = [
  "finding_id",
  "file",
  "category",
  "disposition",
  "target_phase",
  "reason",
] as const;

// The canonical id forms. A CANONICAL FORM WITH A REFUSAL OUTSIDE IT, never a parser widened once
// per surprise (the D-64 doctrine that finally closed the Phase 27 admission reader at round 12).
const FINDING_ID_RE = /^F-28-\d{3}$/;
const CLAIM_ID_RE = /^C-28-\d{3}$/;

// THE CANONICAL NUMERIC FORM, held to the same doctrine as the ids two lines up (28-REVIEW WR-02).
//
// `Number.parseInt` is a LENIENT PREFIX PARSER, and the module declared a canonical-form doctrine
// for its ids while its numeric cells accepted anything with a leading digit. Measured on the
// committed build: `findings: "0 abc"` parsed as 0, `findings: "1e9"` parsed as 1, and
// `category: "6 (record-only)"` parsed as 6 — all three green. `1e9 -> 1` is the sharp one: D-03's
// equality two then compares a number the author never wrote against Table B's real count, and
// agrees or disagrees for the wrong reason.
//
// No leading `+`, no leading zeros beyond a bare `0`, no exponent, no whitespace, no suffix. The
// existing Number.isInteger check is kept as belt-and-braces rather than replaced — the two answer
// different questions (this one asks what the AUTHOR WROTE, that one asks what the VALUE IS).
const NON_NEGATIVE_INT_RE = /^(?:0|[1-9]\d*)$/;

interface TableLine {
  readonly cells: readonly string[];
  readonly line: number;
  readonly raw: string;
}

function splitRow(raw: string): string[] {
  const parts = raw.trim().split("|");
  // `| a | b |` splits to ["", " a ", " b ", ""] — drop the empty edges the delimiters create.
  return parts.slice(1, parts.length - 1).map((c) => c.trim());
}

function isSeparatorRow(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

/**
 * Every unfenced pipe row under `heading`, up to the end of that heading's section. Separator rows
 * are dropped; the header row is returned as the first element so the caller can verify the column
 * names. Returns `null` when the heading is absent — an absent table is a refusal, never an empty
 * one.
 *
 * ---------------------------------------------------------------------------------------------
 * (PLAN 29-25, LANG-07) THIS FUNCTION'S SECTION-EXTENT QUESTION IS ANSWERED BY THE ONE AUTHORITY.
 *
 * It used to answer it three private ways, and it was the FIFTH member of the class plans 29-20
 * through 29-24 unified — logged by 29-22, re-logged by 29-23, named by 29-24 as "the ONLY known
 * remaining member of the class outside the four reconciled consumers", and out of scope for all
 * three. Plan 29-25 makes the LANG-07 claim a DERIVED, tree-wide scan rather than a sentence, and a
 * derivation whose file set is chosen so the answer comes out right is the exact defect that plan
 * exists to close. So the fifth locator is closed rather than exempted. Three private predicates
 * are DELETED and each replacement is a behaviour change stated here rather than left to be
 * rediscovered:
 *
 *  1. THE ANCHOR. `lines.findIndex((l) => l.trim() === heading)` became `unfencedHeadingIndex`.
 *     Two axes move. The equality is now `trimEnd()`, so a LEADING-space heading is no longer the
 *     anchor — the column-zero convention the other four gates already share, and the register's
 *     own headings are column-zero. And the anchor is fence-aware, so a register that QUOTES
 *     `## Table A — audited files` inside a fenced example no longer has that quotation adopted as
 *     the real table; before this change the quoted line won whenever it came first, and every row
 *     of the real table silently fell outside the parse.
 *
 *  2. THE CLOSE. A private `startsWith("## ")` break became `sectionEndIndex(..., 2)`. A `# `
 *     heading now closes the table's section, exactly as `## ` does — the CR-02 axis, one character
 *     to the left, in the last module that still had it. A level-one successor below Table A used
 *     to be walked straight past, so Table B's rows and every pipe row after it were harvested into
 *     Table A. The close is also fence-aware for the same reason the anchor is.
 *
 *  3. THE ROWS. Fenced lines are skipped. This module's header argues at length that a parser which
 *     SKIPS a row it cannot read performs a silent truncation; the mirror image is a parser that
 *     ADOPTS a row nobody wrote, and a seven-cell example row inside a fenced block is exactly that.
 *     `docs/audit/28-disposition-register.md` carries a fenced example in Table B's own section
 *     today (lines 499-502) whose lines happen not to begin with a pipe, so the live parse is
 *     unmoved — the proof of this fix is a planted input, never a moved number.
 *
 * MEASURED ON THE LIVE REGISTER BEFORE AND AFTER: 37 Table A rows and 32 Table B findings, both
 * unchanged, and `check-audit-register` exits 0 with an identical transcript. Every widened axis is
 * pinned from BOTH sides in scripts/audit-model.test.ts, because 29-24 recorded six axes that a
 * rewire of this exact shape MOVED while nothing owned them.
 * ---------------------------------------------------------------------------------------------
 */
function tableUnder(text: string, heading: string): TableLine[] | null {
  const start = unfencedHeadingIndex(text, heading);
  if (start === -1) return null;
  const lines = text.split("\n");
  const fenced = fencedLineFlags(text);
  const end = sectionEndIndex(text, start + 1, 2);
  const out: TableLine[] = [];
  for (let i = start + 1; i < end; i++) {
    if (fenced[i]) continue;
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = splitRow(lines[i]);
    if (isSeparatorRow(cells)) continue;
    out.push({ cells, line: i + 1, raw: lines[i] });
  }
  return out;
}

function refuse(path: string, detail: string): never {
  throw new Error(`audit-model: refusing to parse ${path} — ${detail}`);
}

/**
 * The foreign members of a value list against a legal set: de-duplicated, in FIRST-OCCURRENCE order
 * STATED IN THE EXPRESSION rather than inherited from an iteration order that happens to be
 * insertion-ordered today.
 *
 * Both properties were bought by defects closed in this repository already. A value that violates
 * twice named twice reads to a human as two findings (plan 27-46, D-53). A de-duplication whose
 * order is an implementation detail makes the refusal message non-reproducible across two runs over
 * one artifact, which is a new defect traded for a cosmetic one.
 */
function foreignMembers(values: readonly string[], legal: readonly string[]): string[] {
  return values.filter((v, i) => !legal.includes(v) && values.indexOf(v) === i);
}

// ---------------------------------------------------------------------------
// readRegister.
// ---------------------------------------------------------------------------

/**
 * Parse the disposition register. Throws — naming the file, the line and what was wrong — on every
 * malformation enumerated in this module's header. Never skips a row and never returns an empty or
 * partial result.
 */
export function readRegister(root: string = DEFAULT_ROOT): Register {
  const abs = join(root, REGISTER_PATH);
  if (!existsSync(abs)) {
    throw new Error(
      `audit-model: refusing to parse ${REGISTER_PATH} — the register does not exist at ${abs}. ` +
        `A missing register is not an empty one: returning zero rows would satisfy every ` +
        `completeness equality downstream trivially`,
    );
  }

  let text: string;
  try {
    text = readFileSync(abs, "utf8");
  } catch (e) {
    refuse(REGISTER_PATH, `it could not be read (${(e as Error).message})`);
  }
  // (Plan 29-25) The line split moved INTO `tableUnder`, which now takes the document text because
  // the shared locator authority is defined over text rather than over a pre-split array.

  // ── Table A ──────────────────────────────────────────────────────────────
  const tableA = tableUnder(text, TABLE_A_HEADING);
  if (tableA === null) {
    refuse(
      REGISTER_PATH,
      `it carries no \`${TABLE_A_HEADING}\` heading. The file-row table is located by that exact ` +
        `heading; a register whose Table A cannot be found is unreadable, not empty`,
    );
  }
  if (tableA.length === 0) {
    refuse(
      REGISTER_PATH,
      `\`${TABLE_A_HEADING}\` carries no rows at all, not even a header row`,
    );
  }
  assertColumns(REGISTER_PATH, tableA[0], TABLE_A_COLUMNS, "Table A");

  const bodyA = tableA.slice(1);
  if (bodyA.length === 0) {
    refuse(
      REGISTER_PATH,
      `Table A carries zero file rows. A vacuous register passes every downstream completeness ` +
        `equality — 0 rows compared against 0 findings agree perfectly — so an empty register is ` +
        `refused here rather than reported as complete by a gate`,
    );
  }

  const parsedA: ParsedRegisterRow[] = bodyA.map((tl) => parseRegisterRow(tl));
  const rows: RegisterRow[] = parsedA.map((p) => p.row);

  // Duplicate keys, before any value check: two rows comparing equal make every set operation below
  // ambiguous, and an ambiguous key set cannot be reported on honestly.
  const dupFiles = duplicates(rows.map((r) => r.file));
  if (dupFiles.length > 0) {
    refuse(
      REGISTER_PATH,
      `Table A carries duplicate \`file\` key(s): ${dupFiles.join(", ")}. The file path is the row ` +
        `key, so no two rows may compare equal — a duplicate makes the counted-set membership ` +
        `check ambiguous and lets one row's verdict stand in for another's`,
    );
  }

  for (const parsed of parsedA) validateRegisterRowValues(parsed);

  // ── Table B ──────────────────────────────────────────────────────────────
  const tableB = tableUnder(text, TABLE_B_HEADING);
  if (tableB === null) {
    refuse(
      REGISTER_PATH,
      `it carries no \`${TABLE_B_HEADING}\` heading. Table B is present with its header row even ` +
        `when it holds no findings; an absent table and an empty one are different facts`,
    );
  }
  if (tableB.length === 0) {
    refuse(REGISTER_PATH, `\`${TABLE_B_HEADING}\` carries no header row`);
  }
  assertColumns(REGISTER_PATH, tableB[0], TABLE_B_COLUMNS, "Table B");

  const parsedB: ParsedFindingRow[] = tableB.slice(1).map((tl) => parseFindingRow(tl));
  validateFindingRows(parsedB, new Set(rows.map((r) => r.file)));
  const findings: FindingRow[] = parsedB.map((p) => p.row);

  return { rows, findings };
}

function assertColumns(
  path: string,
  header: TableLine,
  expected: readonly string[],
  label: string,
): void {
  const got = header.cells;
  if (got.length !== expected.length || got.some((c, i) => c !== expected[i])) {
    refuse(
      path,
      `${label}'s header row at line ${header.line} declares column(s) [${got.join(", ")}], but the ` +
        `schema is [${expected.join(", ")}] in exactly that order. Columns are read POSITIONALLY, ` +
        `so a reordered or renamed header would silently reassign every value in the table`,
    );
  }
}

/**
 * A parsed row PAIRED WITH THE CELLS IT WAS PARSED FROM.
 *
 * `counted` is a boolean for every consumer, and a boolean cannot express "the author wrote
 * something that is neither `yes` nor `no`" — coerced, `maybe` reads as `false` and silently drops
 * a file out of the counted set. The raw cells are therefore carried alongside the row for the
 * validation pass, which the schema's order runs AFTER the duplicate-key check. This stays INTERNAL
 * rather than becoming a second field on RegisterRow: a consumer handed both a `counted` boolean and
 * a `rawCounted` string would eventually branch on the wrong one.
 */
interface ParsedRegisterRow {
  readonly row: RegisterRow;
  readonly cells: readonly string[];
}

function parseRegisterRow(tl: TableLine): ParsedRegisterRow {
  if (tl.cells.length !== TABLE_A_COLUMNS.length) {
    refuse(
      REGISTER_PATH,
      `Table A's row at line ${tl.line} has ${tl.cells.length} column(s), expected exactly ` +
        `${TABLE_A_COLUMNS.length} column(s) [${TABLE_A_COLUMNS.join(", ")}]. The row reads: ` +
        `${tl.raw.trim()}. Skipping it would be a silent truncation, and a truncated register ` +
        `satisfies every completeness equality computed over it`,
    );
  }
  return {
    row: {
      file: tl.cells[0],
      kind: tl.cells[1] as RegisterKind,
      counted: tl.cells[2] === "yes",
      safetySurface: tl.cells[3] as SafetySurface,
      findings: Number.parseInt(tl.cells[4], 10),
      observation: tl.cells[5],
      line: tl.line,
    },
    cells: tl.cells,
  };
}

function validateRegisterRowValues(parsed: ParsedRegisterRow): void {
  const row = parsed.row;
  if (row.file === "") {
    refuse(REGISTER_PATH, `Table A's row at line ${row.line} carries an empty \`file\` key`);
  }
  if (!REGISTER_KINDS.includes(row.kind)) {
    refuse(
      REGISTER_PATH,
      `Table A's row at line ${row.line} carries \`kind\` value "${row.kind}", which is outside the ` +
        `legal set [${REGISTER_KINDS.join(", ")}]`,
    );
  }
  // The RAW cell, never the coerced boolean — see ParsedRegisterRow.
  const rawCounted = parsed.cells[2];
  if (rawCounted !== "yes" && rawCounted !== "no") {
    refuse(
      REGISTER_PATH,
      `Table A's row at line ${row.line} carries \`counted\` value "${rawCounted}", which is ` +
        `outside the legal set [yes, no]. A value that is neither would be read as \`no\` by a ` +
        `boolean coercion and silently drop the file out of the counted set`,
    );
  }
  if (!SAFETY_SURFACE_VALUES.includes(row.safetySurface)) {
    refuse(
      REGISTER_PATH,
      `Table A's row at line ${row.line} carries \`safety_surface\` value "${row.safetySurface}", ` +
        `which is outside the legal set [${SAFETY_SURFACE_VALUES.join(", ")}]`,
    );
  }
  // The RAW cell first — see NON_NEGATIVE_INT_RE. Number.parseInt would read "1e9" as 1 and "0 abc"
  // as 0, silently substituting a number the author did not write into D-03's equality two.
  const rawFindings = parsed.cells[4];
  if (!NON_NEGATIVE_INT_RE.test(rawFindings)) {
    refuse(
      REGISTER_PATH,
      `Table A's row at line ${row.line} carries \`findings\` value "${rawFindings}", which is not a ` +
        `bare non-negative integer. \`Number.parseInt\` is a lenient PREFIX parser — it reads "1e9" ` +
        `as 1 and "0 abc" as 0 — so a cell outside the canonical form would put a number the author ` +
        `never wrote on the left-hand side of D-03's equality two`,
    );
  }
  if (!Number.isInteger(row.findings) || row.findings < 0) {
    refuse(
      REGISTER_PATH,
      `Table A's row at line ${row.line} carries \`findings\` value "${row.findings}", which is not ` +
        `a non-negative integer`,
    );
  }
}

/**
 * A parsed finding row PAIRED WITH THE CELLS IT WAS PARSED FROM, for exactly the reason
 * ParsedRegisterRow records: `category` is a number for every consumer, and a number cannot express
 * "the author wrote `6 (record-only)`". The raw cells are carried alongside for the validation pass
 * and stay INTERNAL rather than becoming a second field on FindingRow.
 */
interface ParsedFindingRow {
  readonly row: FindingRow;
  readonly cells: readonly string[];
}

function parseFindingRow(tl: TableLine): ParsedFindingRow {
  if (tl.cells.length !== TABLE_B_COLUMNS.length) {
    refuse(
      REGISTER_PATH,
      `Table B's row at line ${tl.line} has ${tl.cells.length} column(s), expected exactly ` +
        `${TABLE_B_COLUMNS.length} column(s) [${TABLE_B_COLUMNS.join(", ")}]. The row reads: ` +
        `${tl.raw.trim()}`,
    );
  }
  return {
    row: {
      findingId: tl.cells[0],
      file: tl.cells[1],
      category: Number.parseInt(tl.cells[2], 10),
      disposition: tl.cells[3] as Disposition,
      targetPhase: tl.cells[4],
      reason: tl.cells[5],
      line: tl.line,
    },
    cells: tl.cells,
  };
}

function validateFindingRows(
  parsedFindings: readonly ParsedFindingRow[],
  tableAFiles: Set<string>,
): void {
  const findings = parsedFindings.map((p) => p.row);
  // 1. Id format, then 2. uniqueness. Both before anything else, because the id is how a human
  //    names the row they are about to fix.
  for (const f of findings) {
    if (!FINDING_ID_RE.test(f.findingId)) {
      refuse(
        REGISTER_PATH,
        `Table B's row at line ${f.line} carries \`finding_id\` "${f.findingId}", which is outside ` +
          `the canonical form F-28-NNN (three zero-padded digits). The form is a canonical set with ` +
          `a refusal outside it, deliberately, rather than a pattern widened once per surprise`,
      );
    }
  }
  const dupIds = duplicates(findings.map((f) => f.findingId));
  if (dupIds.length > 0) {
    refuse(
      REGISTER_PATH,
      `Table B carries duplicate \`finding_id\` value(s): ${dupIds.join(", ")}. A finding id is a ` +
        `name a human quotes, so no two findings may share one`,
    );
  }

  // 3. The foreign-key direction: a finding must name a file Table A audits.
  for (const f of findings) {
    if (!tableAFiles.has(f.file)) {
      refuse(
        REGISTER_PATH,
        `Table B's row at line ${f.line} (${f.findingId}) names file "${f.file}", which has no row ` +
          `in Table A. A finding against a file the register does not audit cannot be counted by ` +
          `either D-03 equality. If the note is about a file with no Table A row, it belongs in ` +
          `\`## Recorded couplings and out-of-set notes\`, which exists for exactly that case`,
      );
    }
  }

  // 4. The disposition set, by COMPUTED COMPLEMENT — the legal set is enumerated once, above.
  const foreignDispositions = foreignMembers(
    findings.map((f) => f.disposition),
    DISPOSITIONS,
  );
  if (foreignDispositions.length > 0) {
    refuse(
      REGISTER_PATH,
      `Table B carries disposition value(s) [${foreignDispositions.join(", ")}] outside the legal ` +
        `set [${DISPOSITIONS.join(", ")}]. AUDIT-01 names exactly three dispositions; a fourth ` +
        `value fails here rather than passing silently, because a disposition nobody defined is a ` +
        `finding nobody decided`,
    );
  }

  const legalCategories = RUBRIC_CATEGORIES.map((c) => c.category);
  for (const parsed of parsedFindings) {
    const f = parsed.row;
    // 5a. The canonical numeric FORM, over the raw cell — see NON_NEGATIVE_INT_RE. Without it
    //     `category: "6 (record-only)"` parses as 6 and passes membership, so the record-only rule
    //     below fires against a value the author decorated rather than wrote.
    const rawCategory = parsed.cells[2];
    if (!NON_NEGATIVE_INT_RE.test(rawCategory)) {
      refuse(
        REGISTER_PATH,
        `Table B's row at line ${f.line} (${f.findingId}) carries \`category\` value ` +
          `"${rawCategory}", which is not a bare non-negative integer. \`Number.parseInt\` is a ` +
          `lenient PREFIX parser and would read "6 (record-only)" as 6, admitting a decorated cell ` +
          `as a canonical one`,
      );
    }

    // 5. Category membership.
    if (!legalCategories.includes(f.category)) {
      refuse(
        REGISTER_PATH,
        `Table B's row at line ${f.line} (${f.findingId}) carries \`category\` "${f.category}", ` +
          `which is outside the D-07 rubric's categories [${legalCategories.join(", ")}]`,
      );
    }

    // 6. The disposition's own obligations.
    if (f.disposition === "deferred" && isBlank(f.targetPhase)) {
      refuse(
        REGISTER_PATH,
        `Table B's row at line ${f.line} (${f.findingId}) is \`deferred\` with no \`target_phase\`. ` +
          `A deferral with no named target is not a decision, it is a finding leaving the register`,
      );
    }
    if (f.disposition === "accepted" && isBlank(f.reason)) {
      refuse(
        REGISTER_PATH,
        `Table B's row at line ${f.line} (${f.findingId}) is \`accepted\` with no \`reason\`. ` +
          `Accepting a finding without recording why is indistinguishable from not noticing it`,
      );
    }

    // 7. D-07's record-only rule, made STRUCTURAL.
    const rubric = RUBRIC_CATEGORIES.find((c) => c.category === f.category);
    if (rubric !== undefined && rubric.recordOnly) {
      if (f.disposition !== "deferred" || f.targetPhase !== rubric.onlyLegalTargetPhase) {
        refuse(
          REGISTER_PATH,
          `Table B's row at line ${f.line} (${f.findingId}) is a category-${f.category} ` +
            `(${rubric.name}) finding dispositioned \`${f.disposition}\` to target phase ` +
            `"${f.targetPhase}". Category ${f.category} is RECORD-ONLY: its only legal disposition ` +
            `is \`deferred\` to phase ${rubric.onlyLegalTargetPhase}. Phase ` +
            `${rubric.onlyLegalTargetPhase} rewrites this prose, so fixing it here is work done ` +
            `twice and a merge conflict besides — and an audit that starts rewriting prose has ` +
            `stopped being an audit`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// THE ELEMENT-LEVEL BLANK AUTHORITY. ONE declaration, three consumers (28-REVIEW CR-03 / CR-04).
//
// WHY THIS IS EXPORTED AND NOT PRIVATE. Phase 28 shipped THREE definitions of "blank" over the same
// class of hand-authored cell, and they disagreed:
//
//   * this function            — "" | "—" | "-"
//   * check-claim-anchors.ts   — `mech === "" || mech === "—" || mech === "-"`, re-derived inline
//   * check-audit-register.ts  — `normalizeObservation(raw) === ""`, i.e. "" ONLY
//
// The third was the odd one out, and it was odd on the glyph that matters most: `—` is the
// register's OWN unfilled marker for `safety_surface`, so it is the character an author is likeliest
// to type into an unread row. `observation: —` therefore satisfied D-06's substantive-observation
// requirement — exactly the T-28-14 unearned-observation shape D-06 exists to refuse — while the
// D-18 arm four lines away caught `safety_surface: —`. Reproduced: `normalizeObservation("—")`
// returned `"—"`; blank? false, bare? false.
//
// The fix is NOT a fourth definition. The predicate is declared here, beside the parse authority
// that already owned it, and the two gates CONSUME it. That is the same single-source rule this
// phase applies to RETIRED_PROSE_FORMS, MAX_WALK_ENTRIES and ROLE_COUNT.
//
// THE MEMBERSHIP IS A CLOSED SET WITH A PINNED CARDINALITY, never an inline disjunction that grows
// one glyph per surprise. The en dash `–` is a member for the same reason the em dash is: it is a
// placeholder glyph standing where a value belongs, and it was measured passing every one of the
// three predicates above. A glyph that is a bare NON-ANSWER rather than an absent value (`?`, `tbd`)
// is NOT blank and belongs in check-audit-register's BARE_OBSERVATIONS, which answers a different
// question.
//
// WHAT IT MEANS. A cell carrying nothing a reader could act on. Writing a dash where a reason
// belongs is an absent reason wearing a mark.
// ---------------------------------------------------------------------------
export const BLANK_MARKERS: readonly string[] = ["", "—", "–", "-"];

/** Two-sided pin, asserted in scripts/audit-model.test.ts so the set cannot grow or shrink unseen. */
export const BLANK_MARKER_COUNT = 4;

export function isBlank(cell: string): boolean {
  return BLANK_MARKERS.includes(cell.trim());
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const v of values) {
    if (seen.has(v)) {
      if (!dup.includes(v)) dup.push(v);
    } else {
      seen.add(v);
    }
  }
  return dup;
}

// ---------------------------------------------------------------------------
// readRegistry — declared here and consumed in plan 28-04.
// ---------------------------------------------------------------------------

// (Plan 29-28, 29-REVIEW § CR-02) THIS RECOGNISER STAYS DECLARED HERE, AND THAT IS DELIBERATE.
//
// It is DOMAIN vocabulary, not a section grammar: it CAPTURES a claim id, and that id is validated
// against the canonical `C-28-NNN` form ten lines into `parseClaimBlock`. Moving it into
// scripts/frontmatter.ts would put registry ids inside the frontmatter authority, which owns the
// FENCE VERDICT and nothing about this document's vocabulary. What moved instead is its USE: the
// scan that once walked raw lines with it now happens INSIDE `unfencedMatchIndices`, so this module
// no longer tests a heading pattern at a bounding position. Do not "finish the job" by relocating
// the constant; the job is finished.
const CLAIM_HEADING_RE = /^###\s+(\S+)\s*$/;
const CLAIM_META_RE = /^-\s+([a-z_]+):\s*(.*)$/;
const CLAIM_REQUIRED_KEYS = ["file", "line", "kind", "depends_on", "status"] as const;

// The canonical form of a `line:` value: a single 1-based line, or an inclusive range (28-REVIEW
// WR-07). Both shapes are live in the committed registry — re-measured 2026-08-13, 42 rows carry 19
// single values and 23 ranges, and nothing else (38 rows / 19 / 19 at the 2026-08-12 measurement;
// plan 29-02's four writing-profile rows are all ranges). The VALUE is advisory by the registry's own
// documented decision; the FORM is held here, because a required key that is never validated at all
// admits `line: banana` while reading to a human as authoritative provenance.
const CLAIM_LINE_RE = /^\d+(?:-\d+)?$/;

/**
 * Parse the claim registry. Each claim is a `### <id>` heading, a metadata list, and a fenced block
 * holding the claim's VERBATIM text.
 *
 * THE FENCE CONTENTS ARE EXTRACTED BYTE-FOR-BYTE — no trimming, no whitespace collapse, no
 * line-ending rewrite. Plan 28-04 compares this text against the sentence at its anchor as an EXACT
 * byte comparison (the `a.equals(b)` posture scripts/freshness.ts takes), and any normalization here
 * would silently weaken that comparison: a claim whose leading whitespace drifted would compare
 * equal to one that had not. The split is on `\n` alone and the rejoin is on `\n` alone, so a `\r`
 * at a line end survives the round trip untouched.
 */
export function readRegistry(root: string = DEFAULT_ROOT): Registry {
  const abs = join(root, REGISTRY_PATH);
  if (!existsSync(abs)) {
    throw new Error(
      `audit-model: refusing to parse ${REGISTRY_PATH} — the claim registry does not exist at ` +
        `${abs}. A missing registry is not an empty one`,
    );
  }

  let text: string;
  try {
    text = readFileSync(abs, "utf8");
  } catch (e) {
    refuse(REGISTRY_PATH, `it could not be read (${(e as Error).message})`);
  }
  const lines = text.split("\n");

  // ── (Plan 29-28) THE HAZARD THE FENCE-AWARE FIX OPENS, CLOSED IN THE SAME PLAN THAT OPENS IT. ─
  //
  // Making the heading scan fence-aware closes CR-02 in one direction and opens a fail-open in the
  // other, and this repository's own record is that this is exactly where the last fix went wrong.
  // `fencedLineFlags` leaves its toggle SET at EOF on an unterminated fence — a deliberate fail-safe
  // for a prose scanner, because unexposed is the safe direction there. Here it inverts: an
  // unterminated fence ANYWHERE in the registry flags every line below it, so every claim heading
  // below it disappears, THE CLAIM LIST SILENTLY SHORTENS, `safetySurfaceUnion` shrinks, and files
  // drop out of the D-18 exclusion list LANG-02 consults — with every gate green.
  //
  // REPRODUCED, not theorised. Deleting ONE closing delimiter from the twentieth block of the live
  // registry took `readRegistry().claims.length` from 42 to 20 and `safetySurfaceUnion().length`
  // from 41 to 39, while check-audit-register, check-claim-anchors and generate-safety-surface all
  // exited 0. Same fail-open SHAPE as LANG-06's CR-01, reached by the same mechanism.
  //
  // DECIDED FROM THE ONE DELIMITER CLASS, WITH NO SECOND STATE MACHINE. The toggle flips once per
  // line for which `FENCE_DELIMITER_LINE` holds, so an ODD count means the fence is still open at
  // EOF. That is the toggle's own arithmetic read off the same class the toggle keys on — not a
  // reimplementation of it.
  //
  // REFUSED AT THE POINT OF EFFECT, in the parser every consumer of this registry goes through,
  // rather than in one gate — which would leave the hole open for the next consumer.
  const delimiterLines: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (FENCE_DELIMITER_LINE.test(lines[i])) delimiterLines.push(i);
  }
  if (delimiterLines.length % 2 === 1) {
    const last = delimiterLines[delimiterLines.length - 1] + 1;
    refuse(
      REGISTRY_PATH,
      `it carries ${delimiterLines.length} fence delimiter line(s), an ODD number, so a fence is ` +
        `still open at end of file — the last delimiter is at line ${last}. Every claim heading ` +
        `below an unclosed delimiter is invisible to a fence-aware scan, so the consequence is NOT ` +
        `a parse error: it is a SHORTER CLAIM LIST that reads exactly like a correct one. A shorter ` +
        `claim list removes files from the LANG-03 safety-surface exclusion list silently, while ` +
        `every gate computed over it still passes`,
    );
  }

  // ── (Plan 29-28, 29-REVIEW § CR-02) THE BLOCK BOUNDARIES COME FROM THE ONE AUTHORITY. ─────────
  //
  // This was the SIXTH member of the class plans 29-20 through 29-25 unified, and the last one
  // anywhere in the tree. It scanned RAW lines for `CLAIM_HEADING_RE` and took each block's END from
  // the next index in the array it built — a section-extent construct with no fence awareness, and
  // one the owner classifier could not see on either arm (its recogniser arm requires a literal
  // space where this one spells `\s+`; its terminator arm never sees a bound consumed thirteen lines
  // below the recogniser line). `tableUnder`'s recorded argument at :414-448 for why the FIFTH
  // locator was closed rather than exempted applies here verbatim and is not re-derived.
  //
  // The consequence was a fail-open into a safety list: a claim block written inside a FENCED
  // EXAMPLE parsed as a live `kind: safety` row, entered `safetySurfaceUnion`, and entered the D-18
  // exclusion list LANG-02 consults to decide which files a controlled-language pass may not touch.
  //
  // The START and the END now come from the SAME source — the next member of the same returned
  // array, falling back to `lines.length` for the last block exactly as before. A block's SPAN may
  // therefore legally skip OVER a fenced example sitting between two real blocks; the metadata
  // region is still bounded by the block's OWN first delimiter (see parseClaimBlock), so such an
  // example cannot donate metadata to the block above it. That is asserted by a case in
  // scripts/audit-model.test.ts rather than claimed here.
  const headingIdx = unfencedMatchIndices(text, CLAIM_HEADING_RE);
  if (headingIdx.length === 0) {
    refuse(
      REGISTRY_PATH,
      `it carries zero claim blocks. A registry with no claims satisfies D-14's completeness ` +
        `check vacuously — every floor has as many claims as it has, which is none`,
    );
  }

  const claims: ClaimRow[] = [];
  for (let n = 0; n < headingIdx.length; n++) {
    const start = headingIdx[n];
    const end = n + 1 < headingIdx.length ? headingIdx[n + 1] : lines.length;
    claims.push(parseClaimBlock(lines, start, end));
  }

  const dupIds = duplicates(claims.map((c) => c.id));
  if (dupIds.length > 0) {
    refuse(
      REGISTRY_PATH,
      `it carries duplicate claim id(s): ${dupIds.join(", ")}. The claim id is what an anchor in a ` +
        `public document points at, so two rows sharing one id make the D-16 bijection unresolvable`,
    );
  }

  // ── (Plan 29-28; D-08 / AP-1) THE PARSE PUBLISHES ITS OWN DENOMINATOR. ────────────────────────
  //
  // `claims` is a PROJECTION, and a projection with no published denominator is a number that can
  // be short against nothing. TWO SEPARATE EXPRESSIONS over the same text, deliberately — not one
  // expression and a subtraction of its own output, which is 29-REVIEW § WR-03's shape one layer
  // down. `headingShapedLines` counts the shape over RAW lines with no fence verdict at all;
  // `headingShapedFenced` counts the shape ON LINES THE TOGGLE FLAGS. Neither reads `headingIdx`.
  let headingShapedLines = 0;
  for (const line of lines) {
    if (CLAIM_HEADING_RE.test(line)) headingShapedLines += 1;
  }
  const flags = fencedLineFlags(text);
  let headingShapedFenced = 0;
  for (let i = 0; i < lines.length; i++) {
    if (flags[i] && CLAIM_HEADING_RE.test(lines[i])) headingShapedFenced += 1;
  }

  // AND THE THREE NUMBERS MUST AGREE. `headingIdx` came from the authority; these two came from
  // this module. A disagreement means the authority and its denominator are answering different
  // questions, which is precisely the condition a published denominator exists to make loud — so it
  // is a NAMED refusal rather than a silent tally beside a wrong list.
  if (headingIdx.length !== headingShapedLines - headingShapedFenced) {
    refuse(
      REGISTRY_PATH,
      `its parse tally disagrees with its parse: ${headingShapedLines} claim-heading-shaped ` +
        `line(s) minus ${headingShapedFenced} excluded as fenced is ` +
        `${headingShapedLines - headingShapedFenced}, but the shared locator returned ` +
        `${headingIdx.length} block(s). The denominator and the list are answering different ` +
        `questions, so neither can be trusted to bound the other`,
    );
  }

  return { claims, headingShapedLines, headingShapedFenced };
}

function parseClaimBlock(lines: readonly string[], start: number, end: number): ClaimRow {
  const headingMatch = CLAIM_HEADING_RE.exec(lines[start]);
  /* c8 ignore next 3 — the caller only passes indices that already matched this regex. */
  if (headingMatch === null) {
    refuse(REGISTRY_PATH, `the claim heading at line ${start + 1} could not be read`);
  }
  const id = headingMatch[1];

  if (!CLAIM_ID_RE.test(id)) {
    refuse(
      REGISTRY_PATH,
      `the claim heading at line ${start + 1} carries id "${id}", which is outside the canonical ` +
        `form C-28-NNN (three zero-padded digits)`,
    );
  }

  // The fence bounds the metadata region: a line inside the fence that happens to look like a
  // metadata entry is CLAIM TEXT, not metadata, and reading it as metadata would let a claim's own
  // words rewrite its kind or its status.
  //
  // ── (Plan 29-28, 29-REVIEW § WR-02) ONE DELIMITER CLASS, IN A MODULE THAT CARRIED TWO. ────────
  //
  // This scan used to answer "is this line a fence delimiter" with a private `trim() === ` equality
  // while `tableUnder`, thirty lines up in this same file, answered it through `fencedLineFlags` and
  // `FENCE_DELIMITER_LINE`. Fence-aware in one half and privately spelled in the other is not one
  // authority — 29-20's own words about `voice-model.ts`, landing again here.
  //
  // TESTING THE SHARED CLASS DIRECTLY IS THE RIGHT COMPOSITION, AND THE PRECEDENT IS RECORDED IN
  // scripts/voice-model.ts's header: "is this line a fence delimiter" is a DIFFERENT question from
  // "which lines are inside a fence", and folding the first into the second would be a new defect
  // rather than a further unification. That argument is cited, not re-derived.
  //
  // THIS IS A BEHAVIOUR CHANGE, IN BOTH DIRECTIONS, STATED HERE RATHER THAN LEFT TO BE
  // REDISCOVERED — leaving it undisclosed is the class this round is closing:
  //
  //   * an INFO-STRING delimiter (```` ```text ````) now opens a block where it previously did not;
  //   * an INDENTED delimiter (three spaces) no longer opens one where it previously did.
  //
  // MEASURED EFFECT ON THE LIVE REGISTRY: ZERO. 42 claims before and after, and 0 claims whose
  // verbatim text changed — re-derived in the session that made this change, not transcribed.
  //
  // WHAT THIS DOES NOT CLOSE, BY NAME AND WITH ITS LIVE COUNT, so a green run cannot imply
  // otherwise. Both are pre-existing TREE-WIDE residuals of the fence GRAMMAR rather than of this
  // module, and this task deliberately does not repair them — it makes this module AGREE with the
  // rest of the tree about them, which is what LANG-07 asks for:
  //
  //   * V-29-26-03 — the shared class is a PREFIX test, so a four-backtick run carrying a
  //     three-backtick line inside it still truncates a block. Live count: 0 four-or-more-backtick
  //     delimiter lines across the derived safety-surface corpus.
  //   * V-29-26-04 — the shared class is COLUMN-ZERO anchored, so an indented delimiter is
  //     invisible to every consumer alike. Live count: 4 indented delimiters, all in README.md.
  //
  // Both counts are re-measured in this plan's SUMMARY by a pasted command rather than transcribed
  // from the round that first recorded them.
  let fenceStart = -1;
  let fenceEnd = -1;
  for (let i = start + 1; i < end; i++) {
    if (FENCE_DELIMITER_LINE.test(lines[i])) {
      if (fenceStart === -1) fenceStart = i;
      else {
        fenceEnd = i;
        break;
      }
    }
  }
  if (fenceStart === -1) {
    refuse(
      REGISTRY_PATH,
      `claim ${id} at line ${start + 1} carries no fenced block. The fenced block holds the ` +
        `VERBATIM claim sentence, which is the whole basis of the D-16 verbatim-at-anchor ` +
        `comparison — a claim with no verbatim text is a row that cannot be checked against anything`,
    );
  }
  if (fenceEnd === -1) {
    refuse(
      REGISTRY_PATH,
      `claim ${id}'s fenced block opened at line ${fenceStart + 1} and was never closed`,
    );
  }

  // THE METADATA REGION IS READ WITH THIS MODULE'S OWN POSTURE: nothing skipped, nothing overwritten
  // silently (28-REVIEW CR-02).
  //
  // The first draft read `if (m !== null) meta[m[1]] = m[2].trim();` and had two holes, both against
  // this module's own header ("every malformation enumerated below throws… and nothing is ever
  // skipped"):
  //
  //   1. A DUPLICATE KEY OVERWROTE SILENTLY, LAST-WINS. That is not cosmetic. check-claim-anchors.ts
  //      short-circuits on `status === "true"` and skips every D-17 disposition / finding_id /
  //      target_phase obligation, so a block carrying `- status: false` … `- status: true` LAUNDERED
  //      an overstated or false claim into a true one. Reproduced: the parse returned
  //      `{"id":"C-28-001","status":"true","disposition":""}`. readRegister() twenty lines up already
  //      refuses a duplicate `file` key and a duplicate `finding_id`, and context-io.parseNote calls a
  //      duplicate frontmatter key "the on-disk signature of a field-injection forgery"
  //      (context-io.ts:610-617). readRegistry was the only one of the three that was silent.
  //   2. AN UNRECOGNISED LINE WAS DROPPED. A line the parser cannot read reads downstream as an
  //      ABSENT key, which is the silent-truncation shape this module exists to refuse.
  //
  // Blank lines are skipped rather than refused: the region legitimately carries them (the heading is
  // followed by one, and one separates the last key from the fence).
  const meta: Record<string, string> = {};
  const seenKeys = new Set<string>();
  for (let i = start + 1; i < fenceStart; i++) {
    const raw = lines[i];
    if (raw.trim() === "") continue;
    const m = CLAIM_META_RE.exec(raw.trim());
    if (m === null) {
      refuse(
        REGISTRY_PATH,
        `claim ${id} carries a line at ${i + 1} that is neither blank nor a \`- key: value\` ` +
          `metadata entry: ${JSON.stringify(raw)}. A line the parser cannot read would be dropped ` +
          `silently, and a dropped key reads downstream as an absent one`,
      );
    }
    if (seenKeys.has(m[1])) {
      refuse(
        REGISTRY_PATH,
        `claim ${id} carries duplicate metadata key \`${m[1]}\` at line ${i + 1}. The later line ` +
          `silently overrides the earlier one, so a duplicated \`status:\` launders a \`false\` ` +
          `claim into a \`true\` one and skips every D-17 obligation downstream`,
      );
    }
    seenKeys.add(m[1]);
    meta[m[1]] = m[2].trim();
  }
  for (const key of CLAIM_REQUIRED_KEYS) {
    if (meta[key] === undefined) {
      refuse(
        REGISTRY_PATH,
        `claim ${id} at line ${start + 1} is missing required metadata key \`${key}\`. The ` +
          `required keys are [${CLAIM_REQUIRED_KEYS.join(", ")}]`,
      );
    }
  }

  // The `line` FORM. See ClaimRow.line for why the VALUE is deliberately not asserted.
  if (!CLAIM_LINE_RE.test(meta["line"])) {
    refuse(
      REGISTRY_PATH,
      `claim ${id} carries \`line\` "${meta["line"]}", which is outside the canonical form \`N\` or ` +
        `\`N-M\`. The value is ADVISORY — the registry records why it is not asserted — but a ` +
        `required key that is never validated at all admits anything while reading to a human as ` +
        `authoritative provenance`,
    );
  }

  const kind = meta["kind"];
  if (!CLAIM_KINDS.includes(kind as ClaimKind)) {
    refuse(
      REGISTRY_PATH,
      `claim ${id} carries \`kind\` "${kind}", which is outside the legal set ` +
        `[${CLAIM_KINDS.join(", ")}]`,
    );
  }

  const status = meta["status"];
  if (!CLAIM_STATUSES.includes(status as ClaimStatus)) {
    refuse(
      REGISTRY_PATH,
      `claim ${id} carries \`status\` "${status}", which is outside the legal set ` +
        `[${CLAIM_STATUSES.join(", ")}]. D-17 measures every claim against its named mechanism; a ` +
        `status outside these three is a measurement nobody took`,
    );
  }

  const dependsRaw = meta["depends_on"];
  const dependsOn = isBlank(dependsRaw)
    ? []
    : dependsRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
  const floorIds = SAFETY_FLOORS.map((f) => f.id);
  const foreignFloors = foreignMembers(dependsOn, floorIds);
  if (foreignFloors.length > 0) {
    refuse(
      REGISTRY_PATH,
      `claim ${id} carries \`depends_on\` naming [${foreignFloors.join(", ")}], which is outside ` +
        `the safety-floor set [${floorIds.join(", ")}]. \`depends_on\` names the floor whose ` +
        `LOWERING would falsify this claim, so a name outside the floor set joins to nothing in ` +
        `Phase 30's checkpoint set`,
    );
  }

  // BYTE-FOR-BYTE. Split on `\n`, rejoin on `\n`; nothing is trimmed and nothing is normalized.
  const verbatim = lines.slice(fenceStart + 1, fenceEnd).join("\n");

  // ── (Plan 29-28) THE SHAPE THE DOCUMENT-LEVEL PARITY CHECK CANNOT SEE. ────────────────────────
  //
  // `readRegistry`'s odd-delimiter refusal is a DOCUMENT-LEVEL parity check, and parity cannot see
  // two errors that CANCEL. Two claim blocks each carrying one unclosed delimiter sum to an EVEN
  // count, so that refusal stays silent — and because the heading scan is now fence-aware, the
  // second block's heading sits inside the first block's open fence and DISAPPEARS. The first block
  // then spans to EOF, finds the two delimiters that belonged to two DIFFERENT blocks, and parses
  // with a verbatim that has swallowed an entire claim.
  //
  // THIS IS A REGRESSION THIS PLAN INTRODUCED, MEASURED RATHER THAN ARGUED. The pre-plan build
  // refused the same bytes by name ("claim C-28-001's fenced block opened at line 11 and was never
  // closed"); after the fence-aware scan it parsed one claim, dropped a `kind: safety` claim
  // entirely, and returned a corrupted verbatim. Task 3's own done-criterion is that making the
  // registry fence-aware cannot SILENTLY SHORTEN the claim list, so it is closed here rather than
  // recorded as an accepted residual.
  //
  // DECIDED FROM THE DOMAIN RECOGNISER THIS MODULE ALREADY DECLARES — no new grammar, no second
  // fence opinion — and AT THE POINT OF EFFECT, where the verbatim is built and where every
  // consumer of `readRegistry` therefore passes through it.
  //
  // LIVE REACHABILITY, MEASURED BEFORE IT WAS ADDED: 0 of 42 claims carry a claim-heading-shaped
  // line in their verbatim. It refuses nothing that exists today, which is the direction a new
  // refusal must be able to demonstrate.
  const swallowed = lines
    .slice(fenceStart + 1, fenceEnd)
    .filter((l) => CLAIM_HEADING_RE.test(l));
  if (swallowed.length > 0) {
    refuse(
      REGISTRY_PATH,
      `claim ${id}'s verbatim text has SWALLOWED ${swallowed.length} claim heading(s) ` +
        `[${swallowed.map((l) => l.trim()).join(", ")}]. A claim's verbatim is a quoted sentence, ` +
        `never another claim's heading, so this block's fence was left open and the heading(s) ` +
        `above were hidden from the fence-aware scan — the claim list is SHORTER than the document ` +
        `and the surviving claim's verbatim is not the text it names. Document-level delimiter ` +
        `parity cannot see this, because two blocks each left open sum to an EVEN count`,
    );
  }

  // THE ROW-LEVEL FORM OF THE VACUOUS BIJECTION (28-REVIEW CR-03).
  //
  // check-claim-anchors already refuses a registry with no markdown rows, because "a vacuous
  // bijection is not a passing one: zero anchors and zero rows agree trivially". That argument was
  // simply never applied at the ROW level. An empty fence gives `"".split("\n") === [""]` — ONE
  // element — so the gate sliced the single line below the anchor, compared `""` against it, and
  // when that line was blank (the normal markdown shape) the buffers compared EQUAL. `comparisons`
  // incremented and the PASS line reported `1 verbatim comparison(s) performed, all byte-identical`
  // over a comparison that proved nothing. Reproduced against the committed .js with a fence whose
  // open and close lines are adjacent.
  //
  // It is refused HERE, in the parse authority, where every other malformation is refused — not at
  // the gate, which would leave the hole open for the next consumer of readRegistry(). isBlank is
  // the one element-level authority declared above, so this refusal cannot drift from the other two.
  if (isBlank(verbatim)) {
    refuse(
      REGISTRY_PATH,
      `claim ${id}'s fenced block at line ${fenceStart + 1} carries no claim text ` +
        `(${JSON.stringify(verbatim)}). An empty verbatim compares byte-identical against the blank ` +
        `line beneath its anchor, so the D-16 comparison is PERFORMED and proves nothing — the ` +
        `row-level form of the vacuous bijection this registry's gate already refuses at the ` +
        `document level`,
    );
  }

  return {
    id,
    file: meta["file"],
    line: meta["line"],
    kind: kind as ClaimKind,
    dependsOn,
    status: status as ClaimStatus,
    // Passthrough, never defaulted to a VALUE. `""` means "the author wrote nothing here", which is
    // a fact the gate reports; substituting a plausible default would manufacture the very
    // unearned-verdict shape T-28-21 names.
    mechanism: meta["mechanism"] ?? "",
    disposition: meta["disposition"] ?? "",
    findingId: meta["finding_id"] ?? "",
    targetPhase: meta["target_phase"] ?? "",
    verbatim,
  };
}
