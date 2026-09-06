// generate-guarantees.ts — Phase 30 D-17 guarantees render (AUTO-05, AUTO-02).
//
//   node scripts/generate-guarantees.js    # exit 0 on success, 1 on a named refusal
//
// Writes docs/GUARANTEES.md — the public statement of which safety claims still hold, joined from
// the claim registry's `kind: safety` rows to the LIVE per-checkpoint matrix through each row's
// `depends_on` floors.
//
// Strictly read-and-write-one-file. Node stdlib ONLY — node:fs + node:path (transitively, through
// audit-model and context-io). Zero npm dependencies. Clear professional voice throughout: this is
// a safety and trace surface, never caveman voice (CLAUDE.md hard rule).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS FILE IS GENERATED RATHER THAN WRITTEN.
//
// It is the same argument scripts/generate-safety-surface.ts records, applied to a stronger case. A
// hand-authored guarantees page is a set of safety claims maintained by memory, in a repository
// whose recorded second systemic failure class is the hand-maintained set that rots while every
// gate over it stays green. Both sources this render joins are already gated for other reasons —
// the registry's `kind: safety` rows by scripts/check-claim-anchors.js, and the checkpoint matrix
// by scripts/checkpoints.ts's derived roster and the config validator — so deriving the page makes
// it inherit that upkeep instead of adding its own.
//
// WHAT IT JOINS, AND WHY THE JOIN IS THE POINT. A registry row records WHICH PUBLIC SENTENCE stops
// being true if floor F is lowered. The matrix records WHERE F IS ACTUALLY HELD. Neither alone
// answers the question a reader has, which is "does the sentence I just read still hold on THIS
// repository". The join answers it, and it is the only place in the tree that does.
//
// ── FAIL CLOSED ON AN EMPTY JOIN **AND ON A SHORT ONE**. ───────────────────────────────────────
//
// The analog refuses only an EMPTY union, and that is not sufficient here. A render that publishes
// three of six safety rows presents as a clean green build and understates the tree's dependency
// surface — and the rows most likely to be missing are the ones a lowered floor touches, which is
// the one case this document exists for. The project's own recorded lesson is verbatim: "a vacuity
// floor catches an EMPTY denominator but never a SILENTLY SHORT one — derive the ELEMENT count
// independently of the loop that consumes it."
//
// So the join's length is asserted against `declaredSafetyRows()`, which reads the registry's BYTES
// and counts the lines that declare a safety row. It shares no loop, no parser, no traversal and no
// intermediate value with the join: one side is the registry PARSE, the other is a raw line pass.
// The two agreeing is evidence; one side vouching for itself would not be.
//
// ── WHAT THAT EQUALITY DOES **NOT** COVER, MEASURED RATHER THAN ASSUMED (plan 30-10, finding B-6).
//
// Both sides read the SAME FILE. The equality therefore catches a PARSE that drops a row; it cannot
// catch a REGISTRY that loses one, because the loss moves both numbers together. Measured on a
// hermetic copy of this tree: flipping ONE row's `- kind: safety` to `- kind: architecture` takes
// `declaredSafetyRows()` from 6 to 5 and the join from 6 to 5, the equality is satisfied, and the
// render publishes five of six safety claims without a word.
//
// THE OTHER DIRECTION HAS AN OWNER, AND IT IS NOT THIS FILE. `CLAIM_KIND_CARDINALITY` in
// scripts/check-audit-register.ts is a hand-declared per-kind measurement baseline — legitimate
// precisely because nothing in this repository independently derives WHICH claims are safety claims,
// `kind` being an editorial judgement. Driven against the same mutation it reports three findings,
// one of which names this attack in its own message. `scripts/generate-guarantees.test.ts` asserts
// that baseline agrees with `declaredSafetyRows()` on the live tree, so the dependency is a checked
// fact rather than a belief about another gate.
//
// Stating the bound here is the point: a comment claiming this equality stops a short document from
// shipping would be wider than the mechanism, and a source comment that overstates a safety
// mechanism is the failure this repository keeps paying for.
//
// WHAT THE BYTE PASS ENUMERATES, STATED SO A LATER READER DOES NOT MISTAKE ITS SCOPE. It counts
// every line of the registry whose exact content is the safety-kind field line, fenced blocks
// INCLUDED. That is deliberate and it fails CLOSED: a safety-kind line written inside a fenced
// example is counted by this pass and not by the parse, the two disagree, and the render REFUSES.
// The alternative — teaching this pass the parser's fence grammar — would make it a second copy of
// the parser rather than an independent witness, which is the whole property being bought.
//
// Read/write-only by construction (path-traversal mitigation, ASVS V12, mirrors
// generate-safety-surface.ts and generate-catalog.ts): OUT is a FIXED literal repo-relative path.
// It is never derived from argv, env, or file content. Under test the ROOT is redirected and the
// path is not, which is what lets a hermetic mirror be pointed at safely.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  isBlank,
  readRegistry,
  readResidualAdditions,
  REGISTRY_PATH,
  RESIDUAL_PATH,
  RESIDUAL_ADDITIONS_HEADING,
  SAFETY_FLOORS,
  type ClaimStatus,
  type ResidualRow,
} from "./audit-model.js";
import {
  BANNER_ALL_DEFAULT,
  CHECKPOINT_DEFAULTS,
  floorEnvVarName,
  type Checkpoint,
  type Disposition,
} from "./checkpoints.js";
import { GOVERNANCE_CONFIG_RELPATHS, readGovernanceConfig } from "./context-io.js";

const DEFAULT_ROOT = join(import.meta.dirname, "..");

/** FIXED literal, repo-relative. The ROOT is redirected under test; this path never is. */
export const OUT = "docs/GUARANTEES.md";

/** The npm script that reproduces this file. Named in the header AND in the freshness refusal. */
export const REGEN_COMMAND = "npm run generate:guarantees";

/** The committed artifact the freshness gate mirror-spawns. Declared once, imported by the gate. */
export const GUARANTEES_ENTRY_JS = "scripts/generate-guarantees.js";

/**
 * The DATA this render reads, as repo-relative paths. The freshness gate mirrors exactly this set
 * beside the derived JavaScript import closure.
 *
 * BOTH ARMS ARE IMPORTED AND NEITHER IS RETYPED (plan 30-10 removed the last restatement — see
 * `GUARANTEES_CONFIG_CANDIDATES`). The two arms stay SEPARATELY DECLARED because their upkeep rules
 * differ, and conflating them has already cost once: the harness used to derive "the config arm" by
 * subtracting `REGISTRY_PATH` from the union, so plan 30-09's addition of the residual register
 * silently became a config candidate the harness then demanded `context-io.ts` resolve. Provenance
 * is declared where it is known rather than inferred where it is not.
 *
 * BOTH CONFIG CANDIDATES ARE COPIED EVEN THOUGH ONLY ONE EXISTS TODAY. The gate copies whichever it
 * finds and refuses if it finds none — a mirror with no config would render the all-default
 * statement and compare it, byte-equal, against a committed document that happened to say the same
 * thing, and would go on doing so on the day a repository lowered a floor.
 */
export const GUARANTEES_AUDIT_SOURCES: readonly string[] = [REGISTRY_PATH, RESIDUAL_PATH];

/**
 * The config arm: the governance-config candidates, IMPORTED from the reader that resolves them.
 *
 * ---------------------------------------------------------------------------------------------
 * IT WAS A RESTATEMENT, AND PLAN 30-10 DELETED THE SECOND GRAMMAR (red-team surface B, finding B-5).
 *
 * This constant used to spell the two paths itself, with a comment justifying the duplication —
 * "scripts/context-io.ts owns config resolution and keeps its candidate list private, so a mirror
 * has no way to ask it for the paths" — and a harness case holding the restatement against that
 * module's source, described as two-sided.
 *
 * BOTH HALVES OF THAT JUSTIFICATION FAILED. The case was one-sided: it asserted that every path
 * this list names is present in the reader, and nothing in the other direction, so a candidate ADDED
 * to the reader would leave this list a strict subset — the mirror would copy fewer inputs than the
 * real render reads, and the freshness gate would then byte-compare two documents rendered from
 * different sources, which is a comparison between two different questions. And the premise stopped
 * being true in the same round: the reader now PUBLISHES its candidate list, because the structure
 * validator had to be able to ask which files govern (finding B-1).
 *
 * So there is nothing left to hold two-sided. The list is the reader's own, in the reader's own
 * order, and a candidate added there arrives here without an edit — where `GUARANTEES_DATA_SOURCE_COUNT`
 * below then refuses the mirror by name until a human moves the pin.
 * ---------------------------------------------------------------------------------------------
 */
export const GUARANTEES_CONFIG_CANDIDATES: readonly string[] = GOVERNANCE_CONFIG_RELPATHS;

export const GUARANTEES_DATA_SOURCES: readonly string[] = [
  ...GUARANTEES_AUDIT_SOURCES,
  ...GUARANTEES_CONFIG_CANDIDATES,
];

/**
 * The pin over the list above. A mirror short by one input compares two different documents.
 *
 * 3 -> 4 in plan 30-09: the render's residual section is now GENERATED FROM the residual register
 * rather than restated inside this module, so that register is an INPUT. A mirror that did not copy
 * it would refuse outright (the reader throws on a missing file), which is the fail-closed
 * direction — but the pin is moved anyway, because a data source invisible in an import graph is
 * exactly what this constant exists to make visible.
 */
export const GUARANTEES_DATA_SOURCE_COUNT = 4;

/**
 * D-17's three PUBLIC ENTRY DOCUMENTS — the ones a person or an agent lands on first. Each carries
 * exactly ONE anchored generated pointer line to the render.
 *
 * DECLARED HERE AND ASSERTED FROM THIS LIST, never hand-counted. "Exactly three pointer lines" is a
 * number derived from `POINTER_DOCS.length` in scripts/generate-guarantees.test.ts, so a fourth
 * pointer, a lost one, or a second copy inside one document is red — the set-literal-drift class
 * this repository has diagnosed as one of its two systemic failure modes, closed at the point where
 * the count is spent rather than where it is written.
 */
export const POINTER_DOCS: readonly string[] = [
  "README.md",
  "AGENTS.md",
  "agent-factory/README.md",
];

/** The marker that makes a pointer line ANCHORED — locatable, and visibly generated. */
export const POINTER_ANCHOR = "<!-- generated: guarantees-pointer -->";

/**
 * The pointer line a given public entry document must carry, VERBATIM.
 *
 * The link target is COMPUTED from the document's own directory rather than typed per document, so
 * `agent-factory/README.md` gets `../docs/GUARANTEES.md` and a root document gets `docs/GUARANTEES.md`
 * without anybody maintaining three strings that must agree.
 *
 * ONE LINE, AND FOR `AGENTS.md` THAT IS A HARD CONSTRAINT RATHER THAN A PREFERENCE: the substrate
 * document is deliberately short and high-signal, because a long machine-written context file
 * measurably lowers agent success and Codex caps it at 32 KiB. One line is what it can afford.
 */
export function pointerLine(doc: string): string {
  const depth = doc.split("/").length - 1;
  const target = `${"../".repeat(depth)}${OUT}`;
  return (
    `Which safety claims still hold on this repository, joined to the live checkpoint matrix: ` +
    `[\`${OUT}\`](${target}).`
  );
}

/** The exact registry line that declares a safety row. The byte pass's whole grammar. */
const SAFETY_KIND_LINE = "- kind: safety";

/** The exact registry line that declares a DROPPED row. The dropped byte pass's whole grammar. */
const DROPPED_STATUS_LINE = "- status: dropped";

/**
 * The literal prefix a claim heading starts with, read off the registry's raw bytes.
 *
 * A LITERAL, NOT A REGEX, AND THAT IS A DELIBERATE CORRECTION. The first draft of the pass below
 * declared `/^### (C-28-\d{3})$/` and applied it, which put a SECOND heading recogniser into the
 * tree — and `scripts/check-foundation-guards.test.ts`'s [B1] closure caught it at once: the live
 * blast radius of "declaration-lines that apply a heading recogniser" is pinned at exactly one site,
 * in `scripts/audit-model.ts`. The pin was NOT moved. The pass was rewritten to the idiom its own
 * sibling already uses — `declaredSafetyRows` recognises its field line by literal string equality —
 * so this module contributes no heading recogniser at all and the tree still has one.
 *
 * THE LOOSENESS IS THE SAFE DIRECTION, STATED RATHER THAN LEFT TO BE NOTICED. A prefix test admits
 * `### C-28-banana` where the parser's canonical form would refuse it. That over-attributes rather
 * than under-attributes: the id this pass produces then has no counterpart in the join, the two
 * sets disagree by MEMBERSHIP, and the render REFUSES. The failure direction it cannot have is the
 * one where a dropped row goes unseen.
 */
const RAW_CLAIM_HEADING_PREFIX = "### C-28-";

/**
 * The sentinel a dropped-status line with no claim heading above it produces.
 *
 * It is deliberately NOT a valid claim id, so it can never coincide with an id the join produced:
 * the two lists disagree and the render refuses, rather than a headingless status line vanishing
 * from a count that then agrees by accident.
 */
const DROPPED_WITHOUT_HEADING = "(a `- status: dropped` line with no claim heading above it)";

/** One floor a claim rests on, with where that floor is actually held on this tree. */
export interface GuaranteeFloor {
  readonly id: string;
  /** The live disposition read from the one governance reader. */
  readonly held: Disposition;
  /** `true` when `held` is below the roster default — i.e. the floor was lowered here. */
  readonly lowered: boolean;
}

/** One joined safety row: a public sentence, and the floors it stands on. */
export interface GuaranteeRow {
  readonly claimId: string;
  readonly file: string;
  readonly status: ClaimStatus;
  readonly floors: readonly GuaranteeFloor[];
  /** `true` when at least one floor this row rests on is lowered on this tree. */
  readonly lowered: boolean;
}

/**
 * THE INDEPENDENT DENOMINATOR. How many safety rows the registry's BYTES declare.
 *
 * Reads the file directly and counts exact field lines. It calls no parser, shares no loop with
 * `guaranteesJoin` and holds no value in common with it — which is the only thing that makes the
 * equality below evidence rather than a tautology. See the header for what this pass enumerates and
 * why its fence-blindness is the safe direction.
 */
export function declaredSafetyRows(root: string = DEFAULT_ROOT): number {
  let text: string;
  try {
    text = readFileSync(join(root, REGISTRY_PATH), "utf8");
  } catch (e) {
    throw new Error(
      `generate-guarantees: cannot read the claim registry at ${join(root, REGISTRY_PATH)} — ` +
        `refusing to report a safety-row count that was not read (${(e as Error).message})`,
    );
  }
  let n = 0;
  for (const line of text.split("\n")) {
    if (line.replace(/\r$/, "") === SAFETY_KIND_LINE) n += 1;
  }
  return n;
}

/**
 * THE INDEPENDENT DROPPED-ROW SET. Which claim ids the registry's BYTES declare `dropped`.
 *
 * THE SAME ARGUMENT AS `declaredSafetyRows`, APPLIED ONE LEVEL DOWN AND FOR A SHARPER REASON. The
 * loop that marks a row dropped is the registry PARSE; a floor over its output computed by that same
 * parse would be the loop vouching for itself. This pass reads the file's bytes, tracks the last
 * claim heading it saw, and records the id above every exact `- status: dropped` line. It calls no
 * parser and holds no value in common with `guaranteesJoin`.
 *
 * WHAT IT ENUMERATES, AND WHY ITS BLINDNESS IS THE SAFE DIRECTION. It is fence-blind, exactly like
 * `declaredSafetyRows`: a `- status: dropped` line inside a fenced example is counted here and not
 * by the parse, the two lists disagree, and the render REFUSES. It is also KIND-BLIND — it sees a
 * dropped `architecture` row that the safety-only join never produces, and that disagreement is a
 * refusal too, correctly: a non-safety row rests on no floor, so it can never be legitimately
 * dropped.
 *
 * A vacuity floor over an EMPTY set would not catch a set that is short by exactly the rows that
 * matter, which is why this returns the IDS and not a count: the comparison below is membership,
 * not cardinality.
 */
export function declaredDroppedRows(root: string = DEFAULT_ROOT): readonly string[] {
  let text: string;
  try {
    text = readFileSync(join(root, REGISTRY_PATH), "utf8");
  } catch (e) {
    throw new Error(
      `generate-guarantees: cannot read the claim registry at ${join(root, REGISTRY_PATH)} — ` +
        `refusing to report a dropped-row set that was not read (${(e as Error).message})`,
    );
  }
  const out: string[] = [];
  let current: string | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith(RAW_CLAIM_HEADING_PREFIX)) {
      current = line.slice("### ".length);
      continue;
    }
    if (line === DROPPED_STATUS_LINE) out.push(current ?? DROPPED_WITHOUT_HEADING);
  }
  return out;
}

/**
 * THE INDEPENDENT RESIDUAL DENOMINATOR. Which addition-row NUMBERS the register's BYTES declare.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY IT EXISTS (plan 30-10, round 3, finding R4-1). This render carries two independent
 * denominators — `declaredSafetyRows` for the safety join and `declaredDroppedRows` for the dropped
 * set — and the residual section had NEITHER. Its only floor was `body.length === 0` inside the
 * parse: a vacuity floor over an EMPTY denominator, which never sees a SILENTLY SHORT one. And the
 * harness case that looked like the guard took its denominator from the SAME parse, so both sides
 * moved together — B-6's shape, at the one `tableUnder` consumer that feeds a published document.
 *
 * `readResidualAdditions` locates the table by FIRST unfenced exact heading. Measured on the
 * committed artifact: a row written under a repeated heading, a renderer-identical near-miss, or a
 * `…, continued` heading parsed as 2 rows, published 2 rows, and left the generator at exit 0, the
 * freshness gate reporting fresh and every gate green — the register recording a residual the page
 * whose job is to name what the project does not close never named.
 *
 * WHAT IT ENUMERATES, AND WHY ITS BLINDNESS IS THE SAFE DIRECTION. Every line of the register whose
 * first table cell is a bare integer GREATER THAN the historical eight-row table's last row. It is
 * FENCE-BLIND and HEADING-BLIND, exactly like its two siblings: a row written inside a fenced
 * example, or under any heading at all, is counted here and not by the parse, the two sets disagree
 * by MEMBERSHIP, and the render REFUSES. Teaching it the parser's grammar would make it a copy of
 * the parser rather than an independent witness.
 *
 * MEMBERSHIP, NOT CARDINALITY — the `declaredDroppedRows` construction, for the same reason: a set
 * that is short by exactly the rows that matter has the same size as one that is short by any two.
 * ---------------------------------------------------------------------------------------------
  *
 * THE WITNESS MUST BE THE WIDER OF THE TWO PASSES (round 4, finding R6-5).
 *
 * This pass was called independent of `readResidualAdditions` — "shares no parser, no loop and
 * no intermediate". That was true of the HEADING grammar and false of the ROW grammar: both
 * skipped a line unless it began with a pipe. GFM makes the outer pipes OPTIONAL, so a row
 * written without them is a table row to a reader and to GitHub, and was dropped by both passes
 * at once. A membership comparison can only fire on an axis the two passes DISAGREE about; on
 * that axis they agreed by being equally blind, and the page published a register short by a row
 * while both denominators called it complete.
 *
 * So the denominator accepts a row that omits its outer pipes and the parse does not, which
 * makes the disagreement — and therefore the refusal — the outcome. The canonical row form is
 * unchanged and still carries its outer pipes; a near-miss is REFUSED and named rather than
 * quietly admitted (D-64's posture), and the register's author is told.
 *
 * THE NEW DEGREE OF FREEDOM, AND ITS BOUND. A wider denominator can over-count: any line
 * containing a pipe whose first field is a bare number above the historical rows now counts as
 * a declared row. That direction is NOISY AND NEVER PERMISSIVE — it can only produce a refusal
 * to publish, never a silent short page — which is the asymmetry this whole file is built on.
 * The bound is the live equality case below: over the real register both passes must still name
 * exactly the same rows, so an over-count on this tree fails the suite rather than being
 * discovered by a reader.
 */
export function declaredResidualRows(root: string = DEFAULT_ROOT): readonly string[] {
  let text: string;
  try {
    text = readFileSync(join(root, RESIDUAL_PATH), "utf8");
  } catch (e) {
    throw new Error(
      `generate-guarantees: cannot read the residual register at ${join(root, RESIDUAL_PATH)} — ` +
        `refusing to report a residual-row set that was not read (${(e as Error).message})`,
    );
  }
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "").trim();
    // R6-5: the outer pipes are OPTIONAL in GFM, so the witness accepts a row without them and the
    // parse does not — see this function's doc comment for why that asymmetry is the whole point.
    if (!line.includes("|")) continue;
    const body = line.startsWith("|") ? line.slice(1) : line;
    const first = body.split("|")[0].trim();
    if (!/^\d+$/.test(first)) continue;
    if (Number.parseInt(first, 10) <= HISTORICAL_RESIDUAL_ROWS) continue;
    out.push(first);
  }
  return out;
}

/**
 * The last row number of the register's ORIGINAL eight-row table. Rows above it are Phase 30's
 * additions — the ones this render publishes — and rows at or below it are the historical record
 * the additions table continues the numbering of.
 */
const HISTORICAL_RESIDUAL_ROWS = 8;

/**
 * THE GENERATED DISCLOSURE — D-18's replacement text for a dropped claim.
 *
 * A PURE FUNCTION OF ONE JOINED ROW. No file read, no environment read, no clock: two calls with
 * the same inputs are byte-identical, which is the property the anchor gate's verbatim comparison
 * rests on. scripts/check-claim-anchors.ts compares a dropped row's anchored region against THIS
 * text rather than against a string somebody copied into the registry, so the published prose and
 * the mechanism cannot drift apart — that drift is the whole failure D-18 names.
 *
 * WHAT IT NAMES, IN THIS ORDER: the checkpoint, the value it is held at, its documented default,
 * and the authorizing name. "The authorizing name" is the GRANT VARIABLE — `floorEnvVarName(id)` —
 * which is what the table in this render already calls it, and which is deterministic where the
 * human's own name is a session value the generator has no honest way to read.
 *
 * THE FLOORS ARE SORTED BY ID rather than left in the registry row's `depends_on` order. Document
 * order is deterministic today; sorting removes the dependence entirely, so a reordered
 * `depends_on` cannot silently change published bytes at an anchor.
 *
 * ONE LINE, DELIBERATELY. The anchored extent is a line slice, and a single line is the simplest
 * extent that cannot disagree with itself.
 */
export function disclosureFor(row: GuaranteeRow): string {
  const lowered = row.floors
    .filter((f) => f.lowered)
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (lowered.length === 0) {
    throw new Error(
      `generate-guarantees: refusing to generate a disclosure for ${row.claimId} — none of the ` +
        `floors it rests on is lowered on this tree. A disclosure states which guarantee stopped ` +
        `holding here, so generating one for a claim that still holds would publish a retraction of ` +
        `a sentence that is still true`,
    );
  }
  const clauses = lowered
    .map(
      (f) =>
        `\`${f.id}\` is held at \`${f.held}\` instead of \`${CHECKPOINT_DEFAULTS[f.id as Checkpoint]}\`, ` +
        `authorized by \`${floorEnvVarName(f.id as Checkpoint)}\``,
    )
    .join("; ");
  return (
    `**This guarantee is lowered on this repository.** ${clauses}. ` +
    `The sentence that stood here is recorded as ${row.claimId} in \`${REGISTRY_PATH}\` — it is ` +
    `replaced rather than deleted, so the record shows what was claimed and what stopped holding ` +
    `it. See \`${OUT}\`.`
  );
}

/**
 * THE TWO-DIRECTIONAL CONSISTENCY REFUSAL between the registry's `dropped` rows and the live matrix.
 *
 * A PURE FUNCTION OF THE JOIN, so the generator and scripts/check-claim-anchors.ts ask ONE authority
 * and cannot reach different verdicts about one tree.
 *
 * BOTH DIRECTIONS, BECAUSE EITHER ONE ALONE IS A SILENT DRIFT:
 *
 *   * A row marked `dropped` whose floors all sit at their documented default is a retraction of a
 *     sentence that is still true. The registry says the guarantee stopped holding; the matrix says
 *     it holds. Left unrefused, the public document carries a disclosure nobody's configuration
 *     justifies.
 *   * A row resting on a LOWERED floor that is not marked `dropped` is the failure this whole phase
 *     exists to close: an overstated claim left standing in a shipped document after the mechanism
 *     under it was lowered. That is the one the milestone named at kickoff.
 *
 * EACH REFUSAL CARRIES ITS REMEDY, and for the second direction the remedy INCLUDES the exact bytes
 * to write at the anchor. A mechanism that refuses without saying what to write invites a
 * hand-written substitute, which the anchor gate then reds a second time.
 */
export function dropConsistencyRefusals(rows: readonly GuaranteeRow[]): readonly string[] {
  const refusals: string[] = [];
  for (const row of rows) {
    const dropped = row.status === "dropped";
    if (dropped && !row.lowered) {
      refusals.push(
        `${row.claimId} is recorded \`status: dropped\` in ${REGISTRY_PATH}, but every floor it ` +
          `rests on (${row.floors.map((f) => `\`${f.id}\``).join(", ")}) sits at its documented ` +
          `default on this tree. Dropping a claim whose floor was never lowered publishes a ` +
          `retraction of a sentence that is still true. Either lower the floor or restore the row's ` +
          `measured status and its original text`,
      );
    }
    if (!dropped && row.lowered) {
      refusals.push(
        `${row.claimId} rests on lowered floor(s) ` +
          `${row.floors
            .filter((f) => f.lowered)
            .map((f) => `\`${f.id}\` (held at \`${f.held}\`)`)
            .join(", ")} and is still recorded \`status: ${row.status}\`. A lowered floor that ` +
          `leaves its public sentence standing is the exact failure D-18 exists to close. Set the ` +
          `row to \`status: dropped\` and replace the text at its anchor with EXACTLY:\n` +
          `        ${disclosureFor(row)}`,
      );
    }
  }
  return refusals;
}

/**
 * THE JOIN. Every `kind: safety` registry row, with each of its `depends_on` floors resolved
 * against the live checkpoint matrix.
 *
 * Sorted by claim id, and that is the ONLY ordering rule, so the output is a pure function of its
 * two sources and two runs are byte-identical.
 *
 * A ROW IS NEVER SUPPRESSED BY A SIBLING. Two rows resting on one checkpoint are two rows: the
 * question this document answers is per SENTENCE, not per floor, and de-duplicating by floor would
 * silently drop the second sentence a lowering falsifies.
 */
export function guaranteesJoin(root: string = DEFAULT_ROOT): readonly GuaranteeRow[] {
  const matrix = readGovernanceConfig(root).config.checkpoints;
  const rows: GuaranteeRow[] = [];
  for (const claim of readRegistry(root).claims) {
    if (claim.kind !== "safety") continue;
    const floors: GuaranteeFloor[] = claim.dependsOn.map((id) => {
      const held = matrix[id as Checkpoint];
      const fallback = CHECKPOINT_DEFAULTS[id as Checkpoint];
      // A floor id that is not a roster member cannot happen — readRegistry refuses a `depends_on`
      // outside SAFETY_FLOORS, and SAFETY_FLOORS is what the roster derives its floor tier from —
      // but the render states the strictest value rather than `undefined` if it ever did.
      const value: Disposition = held ?? "block";
      return { id, held: value, lowered: isLowered(value, fallback) };
    });
    rows.push({
      claimId: claim.id,
      file: claim.file,
      status: claim.status,
      floors,
      lowered: floors.some((f) => f.lowered),
    });
  }
  return rows.sort((a, b) => (a.claimId < b.claimId ? -1 : a.claimId > b.claimId ? 1 : 0));
}

/**
 * Is `held` STRICTLY MORE PERMISSIVE than `fallback`? (Plan 30-10, round 3, reviewer 4 obs. 1.)
 *
 * ---------------------------------------------------------------------------------------------
 * BOTH CALL SITES USED `value !== fallback`, WHICH IS "DIFFERENT", NOT "LOWER". `commit_to_branch`
 * is the one roster member whose documented default is not `block`, so TIGHTENING it — declaring
 * `commit_to_branch: "block"`, a legitimate and stricter posture — published
 * `**LOWERED: 1 checkpoint(s) sit below their documented default on this tree.**` and a table row
 * naming `GRUGOPS_FLOOR_COMMIT_TO_BRANCH` as authorizing it.
 *
 * The direction is over-statement rather than permission, so it is not a bypass. It is nonetheless a
 * FALSE SENTENCE IN THE ONE DOCUMENT WHOSE SUBJECT IS WHICH SENTENCES STOPPED BEING TRUE, reachable
 * by a legitimate configuration, and this page's whole value is that a reader can believe it.
 *
 * The ternary is ordered — `block` < `notify` < `off` — and that order is what "lowered" has always
 * meant everywhere else in this phase: `resolveCheckpoint` treats `block` as the strictest value,
 * `STRICTEST_MATRIX` is every member at `block`, and the two-key rule is about lowering BELOW the
 * default. The rank is declared once, here, and both call sites ask it.
 * ---------------------------------------------------------------------------------------------
 */
function isLowered(held: Disposition, fallback: Disposition | undefined): boolean {
  if (fallback === undefined) return false;
  return PERMISSIVENESS[held] > PERMISSIVENESS[fallback];
}

/** The ternary's order, strictest first. Declared once; `isLowered` is its only reader. */
const PERMISSIVENESS: Readonly<Record<Disposition, number>> = { block: 0, notify: 1, off: 2 };

/**
 * Is `held` EXACTLY the documented default? (Round 4, finding R6-3.)
 *
 * A SEPARATELY NAMED QUESTION from `isLowered`, and named because this file was answering one and
 * publishing the other. "Nothing is lowered" and "everything sits at its default" are different
 * claims, and they come apart on exactly the tree an attacker does not need to construct: a
 * repository that TIGHTENS something. This is the predicate `composeBanner` already asks
 * (`r.declared === CHECKPOINT_DEFAULTS[id]`), so the page and the run banner are now two readings
 * of ONE rule rather than two rules that happened to agree on the trees anybody tested.
 */
function atDocumentedDefault(held: Disposition, fallback: Disposition | undefined): boolean {
  return fallback !== undefined && held === fallback;
}

/**
 * The roster split by DIRECTION of departure, from ONE read and ONE walk.
 *
 * WHY ONE FUNCTION AND NOT TWO. The obvious repair for R6-3 was a second `tightenedCheckpoints`
 * beside `loweredCheckpoints`, each with its own `readGovernanceConfig` and its own loop. That
 * reintroduces, inside this file, precisely the shape `evaluateMatrix`'s comment says it exists to
 * remove: two independent evaluations of one rule over one config, free to disagree. One walk
 * assigns every roster member to exactly one bucket, so "lowered" and "tightened" cannot both claim
 * a checkpoint and neither can silently drop one.
 *
 * THE NEW DEGREE OF FREEDOM THIS INTRODUCES, AND ITS BOUND. Three buckets where there were two
 * means a member can now go missing from all three and be reported nowhere — the SHORT-denominator
 * failure this project has already been bitten by. So the partition is asserted TOTAL against the
 * roster's own size, derived from `CHECKPOINT_DEFAULTS` rather than from any of the three arrays
 * that consume it, and the refusal is named rather than silent.
 */
function matrixDepartures(root: string): {
  lowered: readonly { id: Checkpoint; held: Disposition; grant: string }[];
  tightened: readonly { id: Checkpoint; held: Disposition }[];
} {
  const matrix = readGovernanceConfig(root).config.checkpoints;
  const lowered: { id: Checkpoint; held: Disposition; grant: string }[] = [];
  const tightened: { id: Checkpoint; held: Disposition }[] = [];
  let atDefault = 0;
  const entries = Object.entries(CHECKPOINT_DEFAULTS) as [Checkpoint, Disposition][];
  for (const [id, fallback] of entries) {
    const held = matrix[id];
    if (held === undefined || atDocumentedDefault(held, fallback)) atDefault += 1;
    else if (isLowered(held, fallback)) lowered.push({ id, held, grant: floorEnvVarName(id) });
    else tightened.push({ id, held });
  }
  const placed = atDefault + lowered.length + tightened.length;
  if (placed !== entries.length) {
    throw new Error(
      `generate-guarantees: the checkpoint roster has ${entries.length} members but only ${placed} ` +
        `were classified as at-default, lowered or tightened. A member that lands in no bucket is ` +
        `reported by no sentence on the page, which is the one failure this render must not have. ` +
        `The document is refused rather than published short.`,
    );
  }
  return { lowered, tightened };
}

/**
 * Render the guarantees document. Throws a NAMED refusal on an EMPTY join and a DIFFERENT named
 * refusal on a SHORT one — see the header for why both, and why one of them is not enough.
 */
export function renderGuarantees(root: string = DEFAULT_ROOT): string {
  const rows = guaranteesJoin(root);
  const declared = declaredSafetyRows(root);

  if (declared === 0) {
    throw new Error(
      `generate-guarantees: ${REGISTRY_PATH} declares no \`kind: safety\` row — refusing to render ` +
        `a guarantees document with nothing in it. A page that lists zero safety claims reads as ` +
        `"nothing here depends on a floor", which is the strongest possible statement and the one ` +
        `least likely to be true; it would present as a clean green build while publishing it`,
    );
  }
  if (rows.length !== declared) {
    throw new Error(
      `generate-guarantees: the join produced ${rows.length} safety row(s) where ${REGISTRY_PATH} ` +
        `declares ${declared} in its bytes — refusing to render a partial guarantees document. ` +
        `The two counts come from independent passes (the registry parse and a raw line count), ` +
        `and a render that published the shorter of them would understate the tree's dependency ` +
        `surface exactly where a lowered floor is most likely to sit. Reconcile the registry, then ` +
        `re-run \`${REGEN_COMMAND}\``,
    );
  }

  // ── THE DROPPED-ROW SET, ASSERTED AGAINST AN INDEPENDENTLY COMPUTED ONE (D-18) ───────────────
  //
  // The membership comparison, not a count. A cardinality floor over this set would agree while the
  // two lists named DIFFERENT rows — which on this surface means publishing a disclosure for one
  // claim and leaving another's overstated sentence standing, with the tally balanced.
  const droppedFromJoin = rows
    .filter((r) => r.status === "dropped")
    .map((r) => r.claimId)
    .sort();
  const droppedFromBytes = [...declaredDroppedRows(root)].sort();
  const onlyInBytes = droppedFromBytes.filter((id) => !droppedFromJoin.includes(id));
  const onlyInJoin = droppedFromJoin.filter((id) => !droppedFromBytes.includes(id));
  if (onlyInBytes.length > 0 || onlyInJoin.length > 0) {
    throw new Error(
      `generate-guarantees: the ${droppedFromJoin.length} dropped row(s) the join produced ` +
        `[${droppedFromJoin.join(", ")}] disagree with the ${droppedFromBytes.length} the registry's ` +
        `BYTES declare [${droppedFromBytes.join(", ")}] — refusing to render. Declared but not ` +
        `joined: [${onlyInBytes.join(", ")}]; joined but not declared: [${onlyInJoin.join(", ")}]. ` +
        `The two sets come from independent passes (the registry parse and a raw line pass), and ` +
        `only their AGREEMENT is evidence. A row declared dropped that the join never sees is ` +
        `either fenced documentation read as a real row, or a non-\`safety\` row resting on no floor ` +
        `and therefore droppable by nothing. Reconcile the registry, then re-run \`${REGEN_COMMAND}\``,
    );
  }

  const inconsistent = dropConsistencyRefusals(rows);
  if (inconsistent.length > 0) {
    throw new Error(
      `generate-guarantees: the registry's dropped rows and the live checkpoint matrix disagree in ` +
        `${inconsistent.length} place(s) — refusing to render a guarantees page that would state ` +
        `one thing while the mechanism does another:\n  - ${inconsistent.join("\n  - ")}`,
    );
  }

  const { lowered, tightened } = matrixDepartures(root);
  const floorIds = SAFETY_FLOORS.map((f) => f.id).sort();
  const residuals = readResidualAdditions(root);
  // ── THE RESIDUAL SECTION'S OWN DENOMINATOR (plan 30-10, round 3, R4-1) ───────────────────────
  //
  // The parse locates the additions table by FIRST unfenced exact heading, so a row under a
  // repeated, renderer-identical or `…, continued` heading was silently unpublished — with the
  // generator exiting 0 and the freshness gate reporting fresh, because both sides of every check
  // came from that same parse. The byte pass shares no parser, no loop and no intermediate with it,
  // and the comparison is by MEMBERSHIP: a set short by exactly the rows that matter has the same
  // size as one short by any two.
  const declaredResiduals = new Set(declaredResidualRows(root));
  const parsedResiduals = new Set(residuals.map((r) => r.num));
  const unpublished = [...declaredResiduals].filter((n) => !parsedResiduals.has(n)).sort();
  const unbacked = [...parsedResiduals].filter((n) => !declaredResiduals.has(n)).sort();
  if (unpublished.length > 0 || unbacked.length > 0) {
    throw new Error(
      `generate-guarantees: the residual register's bytes and its parse name different addition ` +
        `rows — declared but NOT PUBLISHED [${unpublished.join(", ")}], published but NOT DECLARED ` +
        `[${unbacked.join(", ")}]. The parse locates the additions table by its first exact heading, ` +
        `so a row under a repeated, renderer-identical or continued heading reaches the register and ` +
        `never reaches the page whose subject is what this project does not close. Refusing to render ` +
        `a partial residual section`,
    );
  }

  const lines: string[] = [
    "# grugops safety guarantees",
    "",
    "> **GENERATED — do not hand-edit.** Regenerate with:",
    ">",
    "> ```",
    `> ${REGEN_COMMAND}`,
    "> ```",
    "",
    `- **Safety claims joined:** ${rows.length}`,
    `- **Derived from:** \`${REGISTRY_PATH}\` (rows with \`kind: safety\`) joined to the live ` +
      "per-checkpoint matrix through each row's `depends_on` floors",
    `- **Safety floors:** ${floorIds.map((id) => `\`${id}\``).join(", ")}`,
    "",
    "## What this document answers",
    "",
    "**Which public sentences stop being true on THIS repository, and why.** A claim registry row",
    "records which sentence rests on which safety floor. The checkpoint matrix records where each",
    "floor is actually held here. Neither answers the reader's real question on its own, so this",
    "page is the join, and it is the only place in the tree that computes it.",
    "",
    "It is not a promise. Every row below carries the status the registry measured it at, including",
    "the rows measured `overstated`, because a guarantees page that quietly dropped its own weakest",
    "rows would be the defect it exists to catch.",
    "",
    "## Where the checkpoints are held",
    "",
  ];

  if (lowered.length === 0 && tightened.length === 0) {
    lines.push(
      `**${BANNER_ALL_DEFAULT}.** Every checkpoint on the roster sits at its documented default, so`,
      "no floor below is lowered and every row in the table holds at the status the registry",
      "measured. A repository that configures nothing lands here: nothing is lowered by omission.",
      "",
    );
  } else if (lowered.length === 0) {
    // THE THIRD SENTENCE (round 4, R6-3). Nothing is lowered here, but the page may not therefore
    // say everything is at its default: this tree holds something ABOVE it. A tightening is good
    // news and is still a departure, so it is NAMED — the alternative, silence, made the page for a
    // tightened tree byte-identical to the page for a tree that configured nothing.
    lines.push(
      `**No checkpoint is lowered on this tree, and ${tightened.length} ` +
        `checkpoint${tightened.length === 1 ? "" : "s"} sit${tightened.length === 1 ? "s" : ""} ` +
        "ABOVE the documented",
      "default.** A tightening is not a lowering: it removes no guarantee and needs no authorizing",
      "grant. It is named anyway, because a page that stayed silent about it would describe this",
      "repository in exactly the words it uses for one that configured nothing at all.",
      "",
      "| checkpoint | held at | default |",
      "|---|---|---|",
      ...tightened.map(
        (t) => `| \`${t.id}\` | \`${t.held}\` | \`${CHECKPOINT_DEFAULTS[t.id]}\` |`,
      ),
      "",
    );
  } else {
    lines.push(
      `**LOWERED: ${lowered.length} checkpoint(s) sit below their documented default on this tree.**`,
      "A lowered floor must never be discoverable only by reading configuration, so it is named",
      "here, with the value it is held at and the name of the grant that authorizes it.",
      "",
      "| checkpoint | held at | default | authorizing name |",
      "|---|---|---|---|",
      ...lowered.map(
        (l) =>
          `| \`${l.id}\` | \`${l.held}\` | \`${CHECKPOINT_DEFAULTS[l.id]}\` | \`${l.grant}\` |`,
      ),
      "",
      "Every row of the table below whose floors include one of these is marked **LOWERED**. That",
      "mark is the whole point of this page: the sentence it names is one a reader of the shipped",
      "documents would otherwise still believe.",
      "",
    );
  }

  lines.push(
    "## Which public sentences rest on which floor",
    "",
    "| claim | file | measured status | floors, and where each is held | standing |",
    "|---|---|---|---|---|",
    ...rows.map((r) => {
      const floors = r.floors
        .map((f) => `\`${f.id}\` at \`${f.held}\``)
        .join("; ");
      const restsOn = r.floors
        .filter((f) => f.lowered)
        .map((f) => `\`${f.id}\``)
        .join(", ");
      // THREE STANDINGS, AND THE MIDDLE ONE IS A CONTRACT GUARD WITH NO LIVE PATH — said plainly
      // rather than implied to be reachable. `dropConsistencyRefusals` above has already refused
      // any row that is lowered and not `dropped`, so the second arm cannot be reached from a
      // render that got this far. It stays because unreachability is a property of today's code
      // and a rendering is a property of the contract, and because a row that somehow arrived here
      // lowered-but-standing must not print as `held`.
      const standing =
        r.status === "dropped"
          ? `**DROPPED** — rests on ${restsOn}; the text at its anchor is the generated disclosure`
          : r.lowered
            ? `**LOWERED** — rests on ${restsOn}`
            : "held";
      return `| \`${r.claimId}\` | \`${r.file}\` | ${r.status} | ${floors} | ${standing} |`;
    }),
    "",
    "## The residuals this page does not close",
    "",
    // GENERATED FROM THE REGISTER, NOT RESTATED BESIDE IT (plan 30-09). Until this plan the honest
    // statement of what this page does not close was prose inside the generator, with the register
    // that owns those residuals maintained separately and nothing able to tell if the two had come
    // to disagree. The register is now the authority and this section QUOTES it, so a residual can
    // be edited in exactly one place and a reader of either document sees the same words.
    `Every entry below is quoted from \`${RESIDUAL_PATH}\` § *${RESIDUAL_ADDITIONS_HEADING.replace(/^##\s*/, "")}*.`,
    "This page does not restate them in its own words: it publishes the register's, so the record and",
    "the public page cannot come to disagree about what is still open.",
    "",
    ...residuals.flatMap((r: ResidualRow) => [
      `### ${r.num}. ${r.item}`,
      "",
      // `isBlank` is ASKED, never re-derived. A private `trim() === "—"` here would be the FOURTH
      // definition of "blank" in this tree, which is the class scripts/audit-model.test.ts refuses
      // by scanning every source — and it caught this line before it was committed.
      `**Disposition:** \`${r.disposition}\`${isBlank(r.targetPhase) ? "" : ` · **Target phase:** ${r.targetPhase}`}`,
      "",
      `> ${r.reason}`,
      "",
    ]),
  );

  return `${lines.join("\n")}`;
}

// ── Entry point ──────────────────────────────────────────────────────────────────────────────
// Guarded so the test file can import the exports without the write running inside the vitest
// worker. pathToFileURL rather than a hand-built file URL — the hand-built form does not match on
// Windows, which would make a direct run write NOTHING and exit 0, a fabricated success.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  try {
    const text = renderGuarantees();
    writeFileSync(join(DEFAULT_ROOT, OUT), text, "utf8");
    const count = guaranteesJoin().length;
    process.stdout.write(`Wrote ${OUT} — ${count} safety row(s).\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`  ERROR    ${(e as Error).message}\n`);
    process.exit(1);
  }
}
