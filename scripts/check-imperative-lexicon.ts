// check-imperative-lexicon.ts — Phase 29 controlled-language gate (LANG-01, LANG-02, LANG-04).
//
// Ships TWO named predicates over ONE derived corpus, because naming one guard for three unrelated
// predicates re-creates at the output line exactly the defect LANG-04 exists to fix (D-39, D-11):
//
//   [guard_imperative_lexicon]  a `## Steps` bullet begins with an approved verb at position zero.
//   [guard_sentence_form]       sentence length by section anchor, plus four banned constructions.
//
//   node scripts/check-imperative-lexicon.js
// Exit 0 = both predicates hold over the whole governed corpus; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// ---------------------------------------------------------------------------------------------
// WHAT THIS GATE IS NOT, STATED FIRST BECAUSE IT IS THE THING A READER WILL ASSUME.
//
// IT DOES NOT ENFORCE CONFORMANCE WITH ANY PUBLISHED CONTROLLED-LANGUAGE STANDARD, and it must
// never be described as doing so. It decides a small, named, decidable subset: membership of a
// closed verb set at one syntactic position, two sentence-length bounds selected by section anchor,
// and four closed-token-set constructions. `agent-factory/writing-profile.md` is the contract; the
// rule ids `WP-01`..`WP-08` this gate cites are that document's, so a finding points a reader at
// the rule it broke. The conformance prohibition itself is mechanical and lives in a different
// gate — scripts/check-banned-claims.ts.
//
// ---------------------------------------------------------------------------------------------
// THIS MODULE DECLARES NO SECOND FENCE MACHINE, NO SECOND VACUITY RULE, AND NO SECOND CORPUS WALK.
//
// The tree carries exactly THREE fence state machines, derived and pinned in
// scripts/frontmatter.test.ts, and plan 29-01 spent a task DELETING the two that had drifted apart.
// This gate needs per-LINE fence knowledge (it reports `file:line`), and it gets it from
// `fencedLineFlags` in scripts/frontmatter.ts — the same toggle `stripFencedBlocks` is now a
// projection of. One machine, two projections, no fourth grammar.
//
// The element-level vacuity rule is plan 29-01's `reportMeasured`, folded ONCE PER PREDICATE. This
// module declares no `if (n === 0)` check of its own: the measurement is a required argument, so a
// PASS line here cannot state a check that visited nothing.
//
// The workflow part of the corpus is `listWorkflows()` from scripts/kit-model.ts, not a second
// directory walk — deriving membership twice is how two derivations come to disagree.
//
// The Technical Names half is `listRoleDisplayNames()` / `listWorkflowDisplayNames()`, added in the
// same plan for exactly this consumer (D-40) and pinned two-sided in `guard_kit_counts`.
//
// The modal token set and the copula token set are taken WHOLE from scripts/voice-model.ts. They
// are not filtered, sliced or re-declared here: a filtered copy of one list is a second list, and a
// second list is how the one list goes stale.
//
// ---------------------------------------------------------------------------------------------
// PASSIVE VOICE IS DELIBERATELY NOT BANNED (D-15) — A DECISION WITH A REASON, NOT AN OMISSION.
//
// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │ BOUNDARY WARNING. Do not add a passive-voice check to this gate.                              │
// │                                                                                               │
// │ The kit's own correct prose is saturated with the passive, and much of it is correct BECAUSE  │
// │ it is passive — a rule about what must be true of an artifact has no actor to name. A passive  │
// │ detector would therefore go red across large volumes of accurate text, and the only route      │
// │ back to green would be tuning the detector until it stopped noticing. That is a gate that      │
// │ measures its own tolerance rather than the corpus, and it is the heuristic-strict-subset shape │
// │ this repository has closed at eight rounds three separate times.                               │
// │                                                                                               │
// │ agent-factory/writing-profile.md records the same decision in its own prose, under             │
// │ § Deliberate omissions, so it is met as a decision rather than rediscovered as an oversight.   │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘
//
// ---------------------------------------------------------------------------------------------
// RECORDED RESIDUALS, NOT CLAIMED AWAY (`UNKNOWN - verify`).
//
// 1. A NON-CONFORMING STEP WRITTEN AS PROSE WITH NO LIST MARKER IS NOT SEEN. The imperative
//    predicate is scoped to list items under `## Steps`; a paragraph under that heading is not a
//    bullet and is not measured as one. Widening to "every line under `## Steps`" would report the
//    section's own explanatory prose as non-conforming steps.
//
// 2. THE SENTENCE SPLIT IS LINE-ORIENTED. A sentence hard-wrapped across a line boundary is
//    measured as two short sentences rather than one long one, so it can pass a length bound it
//    would breach if joined. Joining lines before splitting would merge list items, table rows and
//    headings into sentences nobody wrote, which is the larger error.
//
// 3. `guard_sentence_form`'s modal arm is BROADER THAN WP-05'S ORIGINAL WORDING and the profile was
//    aligned to the shipped predicate rather than the reverse. The set is voice-model.ts's closed
//    `modal` category taken whole; filtering it to an "obligation" subset would have created a
//    second modal list in the tree. The broader direction reds more text and never less, which is
//    the safe direction for a gate whose corpus is about to be rewritten anyway.
//
// A green run here says what these two predicates measured, and nothing wider.
// ---------------------------------------------------------------------------------------------

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// The ONE fence state machine, asked per line so a finding can carry its source line number.
import { fencedLineFlags } from "./frontmatter.js";
// The workflow corpus and the two display-name derivations (D-40). MAX_WALK_ENTRIES is the walk's
// WORK bound, taken from the one place this repository declares it.
import {
  listWorkflows,
  listRoleDisplayNames,
  listWorkflowDisplayNames,
  MAX_WALK_ENTRIES,
} from "./kit-model.js";
// The shared element-level vacuity rule (AP-1, plan 29-01), folded once per predicate.
import { reportMeasured } from "./vacuity.js";
// Two CLOSED token sets, taken whole. Never filtered, never re-declared.
import { BANNED_CONSTRUCTIONS } from "./voice-model.js";

// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. The truthiness ternary, not
// `??`: `CHECK_ROOT=""` must degrade to the repo root, exactly as every sibling gate does.
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

const abs = (rel: string): string => join(ROOT, rel);

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};

/** Exported accessor so a later aggregator can fold these verdicts without a shared global. */
export const imperativeLexiconFails = (): number => FAILS;

const MARKDOWN_EXT = ".md";
const WORKFLOWS_DIR = "agent-factory/workflows";
const CHECKLISTS_DIR = "agent-factory/checklists";
const SEED_DIR = "agent-factory/seed";
const CONTRACTS_DIR = "agent-factory/contracts";

// ---------------------------------------------------------------------------
// THE DERIVED EXCLUSION (D-42) — a MARKER, never a filename.
//
// One kit file is machine-generated: agent-factory/checklists/security-nfr-checklist.md, 89,840
// bytes, 82% of its directory, and 345 rows copied verbatim from a third-party standard. A style
// pass over it would (a) be reverted on the next `npm run generate:asvs` run, (b) falsify the
// document's own verbatim-copy claim, and (c) triple this gate's denominator so the reported
// numbers stopped meaning anything.
//
// THE EXCLUSION IS DERIVED FROM THE MARKER THE GENERATOR WRITES, and the excluded set's cardinality
// is asserted TWO-SIDED. That assertion is the whole point: a SECOND generated kit file arriving
// later would otherwise vanish from the denominator in complete silence. Excluding by filename
// would be the hand-listed set-literal this milestone exists to delete.
// ---------------------------------------------------------------------------
export const GENERATED_MARKER = "GENERATED";
/** How many lines of a file's opening region carry the generator's marker, if it has one. */
const GENERATED_MARKER_SCAN_LINES = 20;
/** Two-sided. One generated kit document today. */
export const GENERATED_EXEMPT_COUNT = 1;

// ---------------------------------------------------------------------------
// THE LOCATIONS EXCLUDED BY NAME, WITH THEIR REASONS — never by silent omission.
//
// These are DOCUMENTATION ABOUT THE KIT rather than instructions an agent executes, which is the
// line D-36 draws. They are structurally outside the four parts below (nothing walks them), and the
// reason is recorded here and named inline in the PASS line so a reader meets it rather than
// inferring it from a directory's absence.
// ---------------------------------------------------------------------------
export const GOVERNED_CORPUS_EXCLUDED_LOCATIONS: readonly {
  readonly location: string;
  readonly label: string;
  readonly reason: string;
}[] = [
  {
    location: "agent-factory/packaging/",
    label: "packaging documents",
    reason:
      "adapter, subagent-frontmatter and slash-command templates describe how the kit is PACKAGED " +
      "for a host tool. They are documentation about the kit, not instructions an agent executes, " +
      "and several are literal frontmatter specimens whose bytes are the subject",
  },
  {
    location: "agent-factory/config/factory.config.md",
    label: "the config-dial documentation",
    reason:
      "reference documentation for every dial in factory.config.json. It is documentation about " +
      "the kit rather than a procedure, and its rows are key definitions rather than steps",
  },
  {
    location: "agent-factory/roles/",
    label: "the role corpus",
    reason:
      "the roles are governed by guard_voice, guard_caveman_voice and guard_role_clause_uniqueness " +
      "in scripts/check-foundation-guards.ts. A second predicate over the same bytes from a second " +
      "module is how two gates come to disagree about one corpus",
  },
];

// Refusals raised while DERIVING the corpus. Collected rather than thrown: this is a GATE, and a
// gate's floor is to REPORT (the kit-model throw-versus-report split).
const DERIVATION_REFUSALS: string[] = [];

// Recursively enumerate every file under a scan entry. Directory entries are `.sort()`ed so two
// runs over one tree are byte-identical. The budget counts entries EXAMINED, so the bound limits
// WORK and is independent of the tree's shape. A truncated corpus passes every guard exactly the
// way a vacuous one does, so an overflow is a named refusal and never a short return.
function walkFiles(
  rel: string,
  budget: { examined: number },
  acc: string[],
): string | null {
  const a = abs(rel);
  if (!existsSync(a)) return null;
  const st = statSync(a);
  if (st.isDirectory()) {
    for (const entry of readdirSync(a).sort()) {
      budget.examined += 1;
      if (budget.examined > MAX_WALK_ENTRIES) {
        return (
          `the walk of ${rel} examined more than MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES} directory ` +
          `entries, reaching ${join(rel, entry)} — refusing to continue and refusing to report a ` +
          `verdict over the members collected so far, because a truncated scan set passes every ` +
          `guard exactly the way a vacuous one does`
        );
      }
      const refusal = walkFiles(join(rel, entry), budget, acc);
      if (refusal !== null) return refusal;
    }
  } else if (st.isFile()) {
    acc.push(rel);
  }
  return null;
}

/** Markdown directly in `dir`, sorted. Used for the two flat parts. */
function flatMarkdown(dir: string): string[] {
  const a = abs(dir);
  if (!existsSync(a)) {
    DERIVATION_REFUSALS.push(
      `the governed-corpus directory ${dir} does not exist at ${a} — refusing to report a verdict ` +
        `over a part whose directory could not be read. A missing directory is not an empty one`,
    );
    return [];
  }
  return readdirSync(a)
    .filter((f) => f.endsWith(MARKDOWN_EXT))
    .filter((f) => {
      try {
        return statSync(join(a, f)).isFile();
      } catch {
        return false; // a vanished entry between the readdir and the stat is a race, not a member
      }
    })
    .sort()
    .map((f) => `${dir}/${f}`);
}

/** The workflow part, through the ONE workflow derivation. */
function workflowMembers(): string[] {
  try {
    return listWorkflows(ROOT).map((f) => `${WORKFLOWS_DIR}/${f}`);
  } catch (e) {
    DERIVATION_REFUSALS.push(
      `the workflow part could not be derived through kit-model's listWorkflows() — ` +
        `${(e as Error).message}`,
    );
    return [];
  }
}

/** The seed-template part: markdown anywhere under agent-factory/seed/, walked. */
function seedMembers(): string[] {
  const acc: string[] = [];
  const refusal = walkFiles(SEED_DIR, { examined: 0 }, acc);
  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
  return acc.filter((f) => f.endsWith(MARKDOWN_EXT)).sort();
}

/** True when the file's opening region carries the generator's marker. */
function isGenerated(rel: string): boolean {
  try {
    return readFileSync(abs(rel), "utf8")
      .split("\n")
      .slice(0, GENERATED_MARKER_SCAN_LINES)
      .some((l) => l.includes(GENERATED_MARKER));
  } catch {
    return false; // an unreadable file is reported by the read loop, never silently exempted
  }
}

// The CANDIDATE corpus, before the derived exclusion. Kept as its own value so the exclusion can be
// measured rather than assumed: the excluded set is `candidates minus members`, so its cardinality
// is arithmetic over what was read.
const CANDIDATE_PARTS: readonly {
  readonly name: "workflows" | "checklists" | "seedTemplates" | "contracts";
  readonly members: readonly string[];
}[] = [
  { name: "workflows", members: workflowMembers() },
  { name: "checklists", members: flatMarkdown(CHECKLISTS_DIR) },
  { name: "seedTemplates", members: seedMembers() },
  { name: "contracts", members: flatMarkdown(CONTRACTS_DIR) },
];

/** Every candidate carrying the generator's marker, in candidate order. */
export const GENERATED_EXEMPT: readonly string[] = CANDIDATE_PARTS.flatMap((p) =>
  [...p.members].filter(isGenerated),
);

/**
 * The four named parts, AFTER the derived exclusion.
 *
 * The per-part vacuity floor below is evaluated over THESE, and it is per-part on purpose: a floor
 * written over the concatenated total could be cleared by three parts while the fourth vanished
 * entirely, and the gate would report a verdict over a corpus a quarter of which it never opened.
 */
export const GOVERNED_CORPUS_PARTS: readonly {
  readonly name: "workflows" | "checklists" | "seedTemplates" | "contracts";
  readonly members: readonly string[];
}[] = CANDIDATE_PARTS.map((p) => ({
  name: p.name,
  members: p.members.filter((m) => !GENERATED_EXEMPT.includes(m)),
}));

/** The concatenation, in part order. */
export function governedCorpus(): string[] {
  return GOVERNED_CORPUS_PARTS.flatMap((p) => [...p.members]);
}

/**
 * The pinned cardinality. 47 today: 19 workflows + 13 hand-authored checklists + 13 seed templates
 * + 2 contracts.
 *
 * TWO-SIDED. A corpus that silently SHRANK reports a clean pass over the documents it stopped
 * reading; one that silently GREW is a scan nobody reviewed.
 */
export const GOVERNED_CORPUS_COUNT = 47;

// ---------------------------------------------------------------------------
// APPROVED_STEP_VERBS — the CLOSED verb set (WP-01).
//
// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │ BOUNDARY WARNING — THE ADMISSION TEST FOR THIS LIST.                                          │
// │                                                                                               │
// │ A member must be a verb a grugops procedural step ALREADY USES in bare imperative position.    │
// │ A candidate whose admission would require deleting or reshaping correct text does not belong   │
// │ here — the rule scripts/dead-vocabulary.ts already wrote, applied from the positive side.      │
// │                                                                                               │
// │ THIS IS NOT A FREQUENCY CUTOFF, AND ONE IS NOT AVAILABLE. Measured over the governed corpus:   │
// │ 222 distinct first words across 421 bullets, 176 of them occurring exactly once, and the nine  │
// │ most frequent are all NON-VERBS (`The` 69, `A` 25, `BA` 16 …). Restricted to `## Steps`, 59 of │
// │ 84 first words are hapax. The distribution has NO HEAD TO ADOPT, so any cutoff either admits   │
// │ almost nothing or admits almost everything.                                                    │
// │                                                                                               │
// │ So this is the move that closed three earlier multi-round problems in this repository: DECLARE │
// │ THE CANONICAL FORM AND REFUSE EVERYTHING OUTSIDE IT. A step bullet has one legal shape and     │
// │ conformance is MEASURED against it, rather than a parser being widened once per counter-       │
// │ example until it accepts everything.                                                           │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘
//
// Every member below is attested in this corpus in bare imperative position, and every member is
// one-meaning-and-one-part-of-speech, which is the determinism mechanism this profile actually
// adopts.
// ---------------------------------------------------------------------------
export const APPROVED_STEP_VERBS: readonly string[] = [
  "Append",
  "Apply",
  "Assemble",
  "Assess",
  "Attach",
  "Capture",
  "Claim",
  "Clarify",
  "Compile",
  "Confirm",
  "Create",
  "Degrade",
  "Distill",
  "Draft",
  "Emit",
  "Escalate",
  "Establish",
  "Hand",
  "Identify",
  "Implement",
  "List",
  "Mark",
  "Meet",
  "Obtain",
  "Produce",
  "Promote",
  "Propose",
  "Pull",
  "Read",
  "Recommend",
  "Reconcile",
  "Record",
  "Run",
  "Seed",
  "Set",
  "Size",
  "Split",
  "Transition",
  "Update",
  "Validate",
  "Verify",
  "Walk",
  "Write",
];

const APPROVED_STEP_VERBS_LOWER = new Set(
  APPROVED_STEP_VERBS.map((v) => v.toLowerCase()),
);

// The two sentence-length bounds (WP-02, WP-03). Two numbers, selected by section anchor (WP-04),
// which is decidable with no tuning and no per-sentence heuristic.
export const PROCEDURAL_SENTENCE_MAX_WORDS = 20;
export const DESCRIPTIVE_SENTENCE_MAX_WORDS = 25;

// ---------------------------------------------------------------------------
// The line grammar. Every construct below is a bounded quantifier over a single character class,
// and every split is `String.prototype.split` rather than a match-all regex — the superlinear
// backtracking incident recorded in project memory (a 0.47 s guard that took 383 s) is DORMANT, not
// fixed, and a prose scanner over 47 files is exactly where it creeps back in.
//
// Declared HERE, above the derivations that consume it, because the Technical Names parts below are
// evaluated at module load and a `const` referenced before its initializer is a temporal-dead-zone
// throw — which this gate would report as a derivation refusal rather than as the wiring error it is.
// ---------------------------------------------------------------------------

/** An ATX heading line. */
const HEADING_LINE = /^#{1,6} /;
/** The section anchor that makes a bullet procedural (WP-04). */
const STEPS_HEADING = /^## Steps\s*$/;
/** An ordered or unordered list marker at the head of a line, indented at most three spaces. */
const LIST_MARKER = /^ {0,3}(?:[-*+]|\d{1,3}[.)])\s+/;
/** An ORDERED list marker specifically — a numbered procedural line (WP-04). */
const ORDERED_MARKER = /^ {0,3}\d{1,3}[.)]\s+/;
/** A markdown table rule row, tested on the TRIMMED line as one anchored class. */
const TABLE_RULE_BODY = /^[\s:|-]+$/;
function isTableRule(trimmed: string): boolean {
  return trimmed.startsWith("|") && TABLE_RULE_BODY.test(trimmed);
}
/** Sentence terminators followed by whitespace. Fixed-width lookbehind; nothing to backtrack over. */
const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

/** Unwrap code spans. The contents are the words a reader reads; the backticks are not. */
const unwrapCodeSpans = (s: string): string => s.replace(/`([^`]*)`/g, "$1");

/** Strip leading and trailing non-letters, for comparing a token against a closed word set. */
const bareWord = (w: string): string =>
  w.replace(/^[^A-Za-z]+/, "").replace(/[^A-Za-z]+$/, "");

// ---------------------------------------------------------------------------
// TECHNICAL_NAMES (LANG-01 / D-13, as corrected by D-40) — DERIVED FROM THE KIT, NEVER PASTED.
//
// Five sources, each already the authority for its own half of the kit:
//   • role display names        — kit-model's listRoleDisplayNames()      (17 today)
//   • workflow display names    — kit-model's listWorkflowDisplayNames()  (19 today)
//   • config keys               — the SHIPPED agent-factory/config/factory.config.json (21 today)
//   • note kinds                — the context-note contract's six-kind table (6 today)
//   • board columns             — the seed board's column table (13 today)
//
// WHERE THE SET IS ACTUALLY USED, stated so it is not decoration:
//   (1) `guard_imperative_lexicon` reads a first token that is a Technical Name as an ACTOR SUBJECT
//       rather than as an unrecognised word. It is still a finding — WP-01 admits a verb at
//       position zero and nothing else — but the finding NAMES the shape, so the remedy is
//       "re-narrate the step as an instruction" rather than "add this word to the verb list".
//   (2) `guard_sentence_form` counts a MULTI-WORD Technical Name as ONE term. This is the standard's
//       own documented extension point for subject-specific nouns used as designed: `Security audit
//       (OWASP ASVS)` is one concept, and charging a sentence four words for naming it once would
//       penalise using the kit's own vocabulary correctly. This use is load-bearing — it moves
//       sentences across the length bounds — which is what keeps the derivation honest.
// ---------------------------------------------------------------------------

const CONFIG_JSON = "agent-factory/config/factory.config.json";
const NOTE_CONTRACT = "agent-factory/contracts/context-note.md";
const NOTE_KINDS_HEADING = "## The six note kinds";
const BOARD = "agent-factory/seed/plans/board.md";
const BOARD_TABLE_HEADER = "| Column | Entry means | Exit owner | WIP (default) |";

/** A markdown table's first cell, unwrapped from backticks and bold. Empty when the row has none. */
function firstCell(row: string): string {
  const cells = row.split("|");
  if (cells.length < 2) return "";
  return cells[1]
    .trim()
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .trim();
}

function derivedNamePart(
  name: string,
  derive: () => string[],
): { name: string; members: string[] } {
  try {
    return { name, members: derive() };
  } catch (e) {
    DERIVATION_REFUSALS.push(
      `the "${name}" part of the Technical Names set could not be derived — ${(e as Error).message}`,
    );
    return { name, members: [] };
  }
}

function configKeys(): string[] {
  const a = abs(CONFIG_JSON);
  if (!existsSync(a)) throw new Error(`${CONFIG_JSON} does not exist at ${a}`);
  const parsed: unknown = JSON.parse(readFileSync(a, "utf8"));
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`${CONFIG_JSON} did not parse to an object`);
  }
  return Object.keys(parsed as Record<string, unknown>).sort();
}

/** Every first cell of the table under a named `## ` heading, up to the next `## ` heading. */
function tableFirstCellsUnderHeading(rel: string, heading: string): string[] {
  const a = abs(rel);
  if (!existsSync(a)) throw new Error(`${rel} does not exist at ${a}`);
  const lines = readFileSync(a, "utf8").split("\n");
  const at = lines.indexOf(heading);
  if (at === -1) throw new Error(`${rel} carries no \`${heading}\` heading`);
  const out: string[] = [];
  for (let i = at + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) break;
    const row = lines[i].trim();
    if (!row.startsWith("|")) continue;
    if (isTableRule(row)) continue;
    const cell = firstCell(lines[i]);
    if (cell === "" || cell.toLowerCase() === "kind") continue;
    out.push(cell);
  }
  return out;
}

/** Every first cell of the board's column table, located by its exact header row. */
function boardColumns(): string[] {
  const a = abs(BOARD);
  if (!existsSync(a)) throw new Error(`${BOARD} does not exist at ${a}`);
  const lines = readFileSync(a, "utf8").split("\n");
  const at = lines.indexOf(BOARD_TABLE_HEADER);
  if (at === -1) {
    throw new Error(`${BOARD} carries no \`${BOARD_TABLE_HEADER}\` header row`);
  }
  const out: string[] = [];
  for (let i = at + 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row.startsWith("|")) break;
    if (isTableRule(row)) continue;
    const cell = firstCell(lines[i]);
    if (cell !== "") out.push(cell);
  }
  return out;
}

export const TECHNICAL_NAME_PARTS: readonly {
  readonly name: string;
  readonly members: readonly string[];
}[] = [
  derivedNamePart("roleDisplayNames", () => listRoleDisplayNames(ROOT)),
  derivedNamePart("workflowDisplayNames", () => listWorkflowDisplayNames(ROOT)),
  derivedNamePart("configKeys", configKeys),
  derivedNamePart("noteKinds", () =>
    tableFirstCellsUnderHeading(NOTE_CONTRACT, NOTE_KINDS_HEADING),
  ),
  derivedNamePart("boardColumns", boardColumns),
];

/** The deduped union, longest first so a longer name is matched before a prefix of it. */
export function technicalNames(): string[] {
  const seen = new Set<string>();
  for (const part of TECHNICAL_NAME_PARTS) {
    for (const m of part.members) if (m !== "") seen.add(m);
  }
  return [...seen].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

export const TECHNICAL_NAMES: readonly string[] = technicalNames();

/**
 * The pinned cardinality of the deduped union. 76 today: 17 role display names + 19 workflow
 * display names + 21 config keys + 6 note kinds + 13 board columns, with no member shared by two
 * sources. TWO-SIDED, for the same reason every other set here is.
 */
export const TECHNICAL_NAMES_COUNT = 76;

/**
 * THE WORD COUNT, DECIDED ONCE AND USED EVERYWHERE.
 *
 * Unwrap code spans, collapse every multi-word Technical Name to a single placeholder token, split
 * on whitespace, count non-empty tokens. Stated here rather than at each call site so two arms
 * cannot come to disagree about what a word is.
 */
export function countWords(sentence: string): number {
  let t = unwrapCodeSpans(sentence);
  for (const name of TECHNICAL_NAMES) {
    if (name.indexOf(" ") === -1) continue; // a one-word name already counts as one word
    while (t.includes(name)) t = t.replace(name, "TECHNICALNAME");
  }
  return t.split(/\s+/).filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// The two element derivations. Both walk the corpus ONCE, together, so the two predicates cannot
// come to disagree about which lines are fenced, which section a line is in, or where a line is.
// ---------------------------------------------------------------------------

interface StepBullet {
  readonly file: string;
  readonly line: number;
  /** The bullet text with its list marker stripped. */
  readonly text: string;
}

interface Sentence {
  readonly file: string;
  readonly line: number;
  readonly text: string;
  readonly procedural: boolean;
}

interface CorpusElements {
  readonly bullets: StepBullet[];
  readonly sentences: Sentence[];
  /** Files actually opened. Short of the corpus size means a member could not be read. */
  readonly filesRead: number;
  readonly unreadable: string[];
}

function deriveElements(corpus: readonly string[]): CorpusElements {
  const bullets: StepBullet[] = [];
  const sentences: Sentence[] = [];
  const unreadable: string[] = [];
  let filesRead = 0;

  for (const file of corpus) {
    let text: string;
    try {
      text = readFileSync(abs(file), "utf8");
    } catch (e) {
      unreadable.push(`${file} (${(e as Error).message})`);
      continue;
    }
    filesRead += 1;

    const flags = fencedLineFlags(text);
    const lines = text.split("\n");
    let inSteps = false;

    for (let i = 0; i < lines.length; i++) {
      if (flags[i]) continue; // inside a fence: documentation, not governed prose
      const raw = lines[i];
      if (HEADING_LINE.test(raw)) {
        // The section anchor. A heading is not a sentence and is never a step.
        inSteps = STEPS_HEADING.test(raw);
        continue;
      }
      const trimmed = raw.trim();
      if (trimmed === "") continue;
      if (trimmed.startsWith("<!--")) continue; // an HTML comment is not prose a reader reads
      if (isTableRule(trimmed)) continue;

      const isBullet = LIST_MARKER.test(raw);
      const procedural = (inSteps && isBullet) || ORDERED_MARKER.test(raw);

      if (inSteps && isBullet) {
        bullets.push({
          file,
          line: i + 1,
          text: raw.replace(LIST_MARKER, "").trim(),
        });
      }

      // A TABLE ROW IS SPLIT INTO CELLS, AND THE REASON IS STATED SO IT IS NOT READ AS LENIENCY.
      // A row is not a sentence: it is N independent cells that happen to share a line. Measuring a
      // four-column row as one 40-word sentence would report correct tabular text as over-long, and
      // the only route back to green would be rewriting tables into prose — which is the
      // heuristic-strict-subset shape this project refuses. The cell is the honest unit.
      const chunks = trimmed.startsWith("|")
        ? raw
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c !== "")
        : [raw.replace(LIST_MARKER, "")];

      for (const chunk of chunks) {
        for (const s of chunk.split(SENTENCE_SPLIT)) {
          if (s.trim() === "") continue;
          sentences.push({ file, line: i + 1, text: s.trim(), procedural });
        }
      }
    }
  }
  return { bullets, sentences, filesRead, unreadable };
}

// ---------------------------------------------------------------------------
// guard_imperative_lexicon (WP-01) — a `## Steps` bullet begins with an approved verb at position 0.
//
// SCOPED TO `## Steps` ON PURPOSE, AND THE REASON IS A MEASUREMENT RATHER THAN A PREFERENCE.
// `## Inputs required` bullets are NOUN PHRASES by design ("A ticket with acceptance criteria, size
// and priority.") and `## Stop conditions` bullets are CONDITIONALS ("The ticket fails the
// Definition of Ready -> stop…"). An imperative-verb rule applied to those two sections would report
// 72 CORRECT bullets as findings, and the only route back to green would be weakening the rule —
// the heuristic-strict-subset shape D-03 and D-15 both refuse and this repository has closed at
// eight rounds three separate times. `## Steps` (125 bullets, 19 files) is the honest surface.
// ---------------------------------------------------------------------------

type StepFindingKind =
  | "bold-label"
  | "actor-subject"
  | "determiner-subject"
  | "conditional-clause"
  | "not-an-approved-verb";

/** Determiners a step bullet opens with when it has become a description of who does what. */
const DETERMINERS = new Set([
  "the",
  "a",
  "an",
  "this",
  "that",
  "these",
  "those",
  "each",
  "every",
  "any",
  "all",
  "both",
  "its",
  "their",
]);
/** Subordinators a step bullet opens with when it has become a conditional. */
const CONDITIONAL_OPENERS = new Set([
  "when",
  "if",
  "before",
  "after",
  "once",
  "while",
  "unless",
  "whenever",
  "given",
  "with",
]);

interface StepFinding {
  readonly file: string;
  readonly line: number;
  readonly token: string;
  readonly kind: StepFindingKind;
  readonly rule: string;
  readonly text: string;
}

function classifyStep(b: StepBullet): StepFinding | null {
  const firstToken = b.text.split(/\s+/)[0] ?? "";
  if (APPROVED_STEP_VERBS.includes(firstToken)) return null;

  let kind: StepFindingKind;
  if (b.text.startsWith("**")) kind = "bold-label";
  else if (TECHNICAL_NAMES.some((n) => b.text.startsWith(n)))
    kind = "actor-subject";
  else if (DETERMINERS.has(bareWord(firstToken).toLowerCase()))
    kind = "determiner-subject";
  else if (CONDITIONAL_OPENERS.has(bareWord(firstToken).toLowerCase()))
    kind = "conditional-clause";
  else kind = "not-an-approved-verb";

  return {
    file: b.file,
    line: b.line,
    token: firstToken,
    kind,
    rule: "WP-01",
    text: b.text,
  };
}

const STEP_REMEDY: Readonly<Record<StepFindingKind, string>> = {
  "bold-label":
    "delete the bold label and start with the verb it was decorating — `**Run the gate** in order: …` becomes `Run the gate in order: …`",
  "actor-subject":
    "the first token is a project Technical Name used as a SUBJECT. Re-narrate the step as an instruction to the agent that performs it; name the actor later in the sentence if it is load-bearing",
  "determiner-subject":
    "the bullet describes what happens rather than instructing. Re-narrate it as an instruction beginning with an approved verb",
  "conditional-clause":
    "move the condition after the instruction, or state it as a `## Stop conditions` bullet, which this predicate deliberately does not govern",
  "not-an-approved-verb":
    "begin the bullet with a verb from APPROVED_STEP_VERBS. Do NOT add this token to that list unless it is a verb a grugops procedural step already uses in bare imperative position",
};

function renderStepFinding(f: StepFinding): string {
  return (
    `        ${f.file}:${f.line} — ${f.rule} [${f.kind}] first token "${f.token}" is not an ` +
    `approved step verb — ${JSON.stringify(f.text)}\n` +
    `        Remedy: ${STEP_REMEDY[f.kind]}. Do NOT narrow the scan set: GOVERNED_CORPUS_COUNT is ` +
    `two-sided pinned, precisely so removing a member to reach green is not available`
  );
}

// ---------------------------------------------------------------------------
// guard_sentence_form (WP-02..WP-08) — two length bounds by section anchor, four banned
// constructions over closed token sets. No threshold anywhere, and no tuning knob.
// ---------------------------------------------------------------------------

/** The closed modal set, TAKEN WHOLE from voice-model.ts. Never filtered — a filtered copy is a second list. */
const MODALS = new Set(BANNED_CONSTRUCTIONS.modal);
/** The closed copula set, taken whole from the same authority. */
const COPULAS = new Set(BANNED_CONSTRUCTIONS.copula);
/**
 * The finite auxiliary class the bare-demonstrative rule keys on, together with the two sets above.
 *
 * This is a CLOSED FUNCTION-WORD class rather than a verb list, which is what makes the rule
 * decidable without a dictionary: `This is the drift` is a bare demonstrative subject, while
 * `This workflow runs at release` is a demonstrative DETERMINER modifying a noun and is correct.
 */
const AUXILIARIES = new Set([
  "has",
  "have",
  "had",
  "does",
  "do",
  "did",
  "will",
]);
const DEMONSTRATIVES = new Set(["this", "that", "these", "those"]);
/** Conjunctions that chain a second instruction onto a step (WP-08). */
const INSTRUCTION_CHAINS = new Set(["and", "then"]);
/** The and-slash-or construction (WP-07), matched as a literal. */
const AND_SLASH_OR = "and/or";

type FormFindingKind =
  | "procedural-sentence-too-long"
  | "descriptive-sentence-too-long"
  | "modal-in-procedural-step"
  | "bare-demonstrative-subject"
  | "and-slash-or"
  | "more-than-one-instruction";

interface FormFinding {
  readonly file: string;
  readonly line: number;
  readonly kind: FormFindingKind;
  readonly rule: string;
  readonly detail: string;
  readonly text: string;
}

const FORM_REMEDY: Readonly<Record<FormFindingKind, string>> = {
  "procedural-sentence-too-long":
    "split the step into two steps. A procedural sentence is bounded at 20 words (WP-02) and the section anchor decides that the bound applies here (WP-04)",
  "descriptive-sentence-too-long":
    "split the sentence. A descriptive sentence is bounded at 25 words (WP-03)",
  "modal-in-procedural-step":
    "delete the modal. The step is the obligation (WP-05); if the action is conditional, state the condition rather than hedging the verb",
  "bare-demonstrative-subject":
    "name the antecedent. A sentence opening with a bare demonstrative followed by a copula, an auxiliary or a modal has no subject a reader can resolve without the previous sentence (WP-06)",
  "and-slash-or":
    "write the one meaning intended (WP-07). `and/or` asks the reader to pick",
  "more-than-one-instruction":
    "split the sentence at the conjunction. One instruction per sentence (WP-08)",
};

function renderFormFinding(f: FormFinding): string {
  return (
    `        ${f.file}:${f.line} — ${f.rule} [${f.kind}] ${f.detail} — ` +
    `${JSON.stringify(f.text.length > 160 ? `${f.text.slice(0, 157)}…` : f.text)}\n` +
    `        Remedy: ${FORM_REMEDY[f.kind]}. Do NOT narrow the scan set: GOVERNED_CORPUS_COUNT is ` +
    `two-sided pinned, precisely so removing a member to reach green is not available`
  );
}

function classifySentence(s: Sentence): FormFinding[] {
  const out: FormFinding[] = [];
  const base = { file: s.file, line: s.line, text: s.text };

  // WP-02 / WP-03 / WP-04 — one bound, selected by the section anchor. A sentence is never measured
  // against both, and it is never measured against neither.
  const n = countWords(s.text);
  const limit = s.procedural
    ? PROCEDURAL_SENTENCE_MAX_WORDS
    : DESCRIPTIVE_SENTENCE_MAX_WORDS;
  if (n > limit) {
    out.push({
      ...base,
      kind: s.procedural
        ? "procedural-sentence-too-long"
        : "descriptive-sentence-too-long",
      rule: s.procedural ? "WP-02" : "WP-03",
      detail: `${n} words, bound ${limit}`,
    });
  }

  const tokens = unwrapCodeSpans(s.text)
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const words = tokens.map((w) => bareWord(w).toLowerCase());

  // WP-05 — a modal inside a procedural step.
  if (s.procedural) {
    const modal = words.find((w) => MODALS.has(w));
    if (modal !== undefined) {
      out.push({
        ...base,
        kind: "modal-in-procedural-step",
        rule: "WP-05",
        detail: `modal "${modal}" in a procedural step`,
      });
    }
  }

  // WP-06 — a bare demonstrative as subject. The demonstrative must be at position ZERO: anything
  // before it in the sentence is a candidate antecedent, and this rule only claims to decide the
  // case where there is nothing before it at all.
  if (
    words.length > 1 &&
    DEMONSTRATIVES.has(words[0]) &&
    (COPULAS.has(words[1]) || MODALS.has(words[1]) || AUXILIARIES.has(words[1]))
  ) {
    out.push({
      ...base,
      kind: "bare-demonstrative-subject",
      rule: "WP-06",
      detail: `"${tokens[0]} ${tokens[1]}" opens the sentence with no antecedent in it`,
    });
  }

  // WP-07 — the and-slash-or construction.
  if (unwrapCodeSpans(s.text).toLowerCase().includes(AND_SLASH_OR)) {
    out.push({
      ...base,
      kind: "and-slash-or",
      rule: "WP-07",
      detail: `the "${AND_SLASH_OR}" construction`,
    });
  }

  // WP-08 — more than one instruction. Decidable BECAUSE the verb set is closed: an approved verb at
  // position zero, and a second approved verb immediately after a chaining conjunction.
  if (s.procedural && APPROVED_STEP_VERBS_LOWER.has(words[0])) {
    for (let i = 1; i < words.length - 1; i++) {
      if (
        INSTRUCTION_CHAINS.has(words[i]) &&
        APPROVED_STEP_VERBS_LOWER.has(words[i + 1])
      ) {
        out.push({
          ...base,
          kind: "more-than-one-instruction",
          rule: "WP-08",
          detail: `"${words[0]} … ${words[i]} ${words[i + 1]}" chains a second instruction`,
        });
        break;
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// The run.
// ---------------------------------------------------------------------------

function corpusBreakdown(): string {
  return GOVERNED_CORPUS_PARTS.map((p) => `${p.name} ${p.members.length}`).join(
    ", ",
  );
}

function runAll(): void {
  for (const refusal of DERIVATION_REFUSALS) {
    fail(`governed-corpus derivation refused: ${refusal}`);
  }

  // VACUITY FLOOR, PER PART, BEFORE THE AGGREGATE PIN. A part contributing nothing FAILS BY NAME
  // rather than shrinking the denominator, because a floor over the concatenated total could be
  // cleared by three parts while the fourth vanished entirely.
  for (const part of GOVERNED_CORPUS_PARTS) {
    if (part.members.length === 0) {
      fail(
        `the "${part.name}" part of the governed corpus derived ZERO members — refusing to report ` +
          `a verdict over a part that contributes nothing, because a vacuous scan set passes every ` +
          `guard. This floor is per-part on purpose: three parts could clear a floor written over ` +
          `the concatenated total while the fourth vanished entirely`,
      );
    }
  }

  const corpus = governedCorpus();

  // TWO-SIDED PIN, worded so that moving it is visibly not the remedy.
  if (corpus.length !== GOVERNED_CORPUS_COUNT) {
    fail(
      `the governed corpus derived ${corpus.length} document(s), expected exactly ` +
        `${GOVERNED_CORPUS_COUNT} (${corpusBreakdown()}) — walk all four parts' derivations, the ` +
        `${GENERATED_MARKER} exclusion and the GOVERNED_CORPUS_EXCLUDED_LOCATIONS reasons BEFORE ` +
        `updating GOVERNED_CORPUS_COUNT in scripts/check-imperative-lexicon.ts. A new workflow is ` +
        `supposed to enter this scan BY EXISTING; moving the pin is how you acknowledge that it ` +
        `did, not how you make the failure go away`,
    );
  }

  // THE DERIVED EXCLUSION'S OWN CARDINALITY, TWO-SIDED. This is what stops a SECOND generated kit
  // file arriving unexcluded and unnoticed: without it, the generated set could grow and the only
  // visible symptom would be a corpus count nobody could explain.
  if (GENERATED_EXEMPT.length !== GENERATED_EXEMPT_COUNT) {
    fail(
      `${GENERATED_EXEMPT.length} candidate document(s) carry the \`${GENERATED_MARKER}\` marker, ` +
        `expected exactly ${GENERATED_EXEMPT_COUNT} (derived: ${GENERATED_EXEMPT.join(", ") || "none"}) ` +
        `— a generated document is excluded because a style pass over it would be reverted on the ` +
        `next generation and would falsify its own verbatim-copy claim. A SECOND generated file is ` +
        `a deliberate decision about what this corpus governs, not a number to move`,
    );
  }

  // THE TECHNICAL NAMES SET, per part and then two-sided. A short set silently stops exempting
  // multi-word names from the word count and starts reporting the actor-subject shape as an
  // unrecognised word; a grown set silently starts exempting text nobody reviewed.
  for (const part of TECHNICAL_NAME_PARTS) {
    if (part.members.length === 0) {
      fail(
        `the "${part.name}" part of the Technical Names set derived ZERO members — the set is ` +
          `DERIVED from the kit rather than listed (LANG-01), and a part that derives nothing ` +
          `silently removes a whole vocabulary from both predicates`,
      );
    }
  }
  if (TECHNICAL_NAMES.length !== TECHNICAL_NAMES_COUNT) {
    fail(
      `the Technical Names set derived ${TECHNICAL_NAMES.length} member(s), expected exactly ` +
        `${TECHNICAL_NAMES_COUNT} (${TECHNICAL_NAME_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
        `deduped) — walk both consumers in this file BEFORE updating TECHNICAL_NAMES_COUNT`,
    );
  }

  const elements = deriveElements(corpus);
  for (const u of elements.unreadable) {
    fail(
      `${u} is a member of the governed corpus and could not be read — refusing to report a ` +
        `verdict over a document that was never opened. A missing document is not a clean one`,
    );
  }

  // ── guard_imperative_lexicon ────────────────────────────────────────────────────────────────
  process.stdout.write(
    "\n[guard_imperative_lexicon] every `## Steps` bullet begins with a verb from the closed " +
      "approved set, in bare imperative form, at position zero (LANG-04 / WP-01, D-12, D-39)\n",
  );

  const stepFindings: StepFinding[] = [];
  let bulletsVisited = 0;
  for (const b of elements.bullets) {
    bulletsVisited += 1;
    const f = classifyStep(b);
    if (f !== null) stepFindings.push(f);
  }
  const stepFiles = new Set(elements.bullets.map((b) => b.file)).size;
  process.stdout.write(
    `        corpus: ${corpus.length} file(s) in 4 part(s) — ${corpusBreakdown()}; ` +
      `${GENERATED_EXEMPT.length} excluded by the derived \`${GENERATED_MARKER}\` marker ` +
      `(${GENERATED_EXEMPT.join(", ") || "none"} — machine-generated from a third-party standard, ` +
      `so a style pass would be reverted on the next generation and would falsify its own ` +
      `verbatim-copy claim)\n`,
  );
  process.stdout.write(
    `        ${elements.bullets.length} \`## Steps\` bullet(s) across ${stepFiles} file(s); ` +
      `${APPROVED_STEP_VERBS.length} approved verb(s); ${TECHNICAL_NAMES.length} derived Technical ` +
      `Name(s)\n`,
  );
  FAILS += reportMeasured(
    {
      label: "imperative lexicon",
      visited: bulletsVisited,
      expected: elements.bullets.length,
      findings: stepFindings,
    },
    { pass, fail },
    renderStepFinding,
  );

  // ── guard_sentence_form ─────────────────────────────────────────────────────────────────────
  process.stdout.write(
    "\n[guard_sentence_form] sentence length by section anchor — 20 words procedural, 25 " +
      "descriptive — plus four banned constructions over closed token sets (LANG-04 / WP-02..WP-08, " +
      "D-14, D-35, D-39)\n",
  );

  // The corpus line is repeated under EACH guard header rather than printed once above both. The two
  // predicates report two separate verdicts, and a reader who scrolls to the second one must meet
  // its denominator and its exclusions there — a verdict whose corpus is stated only beside a
  // different verdict is a verdict a reader has to reconstruct.
  process.stdout.write(
    `        corpus: ${corpus.length} file(s) in 4 part(s) — ${corpusBreakdown()}; ` +
      `${GENERATED_EXEMPT.length} excluded by the derived \`${GENERATED_MARKER}\` marker ` +
      `(${GENERATED_EXEMPT.join(", ") || "none"} — machine-generated from a third-party standard, ` +
      `so a style pass would be reverted on the next generation and would falsify its own ` +
      `verbatim-copy claim)\n`,
  );

  const formFindings: FormFinding[] = [];
  let sentencesVisited = 0;
  for (const s of elements.sentences) {
    sentencesVisited += 1;
    for (const f of classifySentence(s)) formFindings.push(f);
  }
  const byKind = new Map<FormFindingKind, number>();
  for (const f of formFindings) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
  const proceduralSentences = elements.sentences.filter(
    (s) => s.procedural,
  ).length;
  process.stdout.write(
    `        ${elements.sentences.length} sentence(s) — ${proceduralSentences} procedural, ` +
      `${elements.sentences.length - proceduralSentences} descriptive; by finding kind: ` +
      `${[...byKind].map(([k, n]) => `${k} ${n}`).join(", ") || "none"}\n`,
  );
  process.stdout.write(
    `        passive voice is deliberately NOT checked (D-15) — the kit's own correct prose is ` +
      `saturated with it, so a passive check reds large volumes of accurate text and the only ` +
      `route back to green is tuning the detector\n`,
  );
  FAILS += reportMeasured(
    {
      label: "sentence form",
      visited: sentencesVisited,
      expected: elements.sentences.length,
      findings: formFindings,
    },
    { pass, fail },
    renderFormFinding,
  );

  if (FAILS === 0) {
    // A PASS line must never state a check that was not performed: every number below is read from
    // the run that just happened, and every exclusion is named inline with its reason so a reader
    // meets it here rather than inferring it from a file's absence.
    pass(
      `LANG-02: ${corpus.length} governed document(s) in 4 derived part(s) — ${corpusBreakdown()}; ` +
        `${GENERATED_EXEMPT.length} excluded by the derived \`${GENERATED_MARKER}\` marker; ` +
        `${GOVERNED_CORPUS_EXCLUDED_LOCATIONS.length} location(s) excluded by name (` +
        `${GOVERNED_CORPUS_EXCLUDED_LOCATIONS.map((e) => `${e.location} — ${e.label}: ${e.reason}`).join("; ")}); ` +
        `${elements.filesRead} of ${corpus.length} opened`,
    );
    pass(
      `LANG-01: ${TECHNICAL_NAMES.length} Technical Name(s) DERIVED from the kit, never listed — ` +
        `${TECHNICAL_NAME_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}`,
    );
  }

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
// `node scripts/check-imperative-lexicon.js` run ZERO checks and exit 0, a fabricated green.
// The guard is also what lets the test file IMPORT this module for its exported pins without the
// import running the check and calling process.exit inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
