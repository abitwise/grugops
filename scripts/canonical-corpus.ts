// canonical-corpus.ts — THE HISTORICAL BYPASS CORPUS OF ROUNDS 1 THROUGH 11 (plan 27-63, D-64).
//
// WHAT THIS MODULE IS FOR.
//
// Eleven consecutive code-review rounds of phase 27 each ended with a live spawn-grant bypass while
// the test suite was green. Every one of them was the same failure in a new spelling: a document
// `scripts/frontmatter.ts` could not read, reported on the SUCCESS arm as "this document carries no
// spawn grant". Plan 27-62 replaced that module's interpretation with an ADMISSION READER
// (`scripts/canonical-frontmatter.ts`) which admits a small canonical shape and REFUSES every other
// byte under one of 23 enumerated codes, so the silent-no-grant arm does not exist by construction.
//
// A canonical-form gate passes trivially by refusing everything. What makes its refusal meaningful is
// a PAIR of measurements, and this module is the second half of that pair:
//
//   * 27-62 measured that the reader ADMITS the live kit — 33 of 33 scanned files.
//   * THIS module is the corpus every bypass shape those eleven rounds actually REPRODUCED, so the
//     replay in `canonical-corpus.test.ts` can measure that each of them is now REFUSED, by a NAMED
//     code, with the refusal TEXT printed.
//
// That is D-64's vacuity trap 2. Neither half is evidence on its own: admitting everything and
// refusing everything are both trivially achievable, and only the two together say the grammar
// discriminates.
//
// NON-VACUITY DEPENDS ON ROUND COVERAGE, NOT ON THE ROW COUNT BEING LARGE. A corpus of ninety rows
// drawn from three rounds would prove less than a corpus of twenty drawn from eleven, because the
// claim under test is "every family this phase found is closed", and a family lives in a round. The
// replay therefore asserts round coverage two-sided over 1..11 and fails BY NAME on a round with zero
// rows. The row total is asserted against `CORPUS_COUNT` below, in the same file that owns the data,
// so a row silently lost cannot pass as a smaller corpus.
//
// PROVENANCE IS PART OF THE DATA, NOT A COMMENT. Every row carries the round it came from, the
// finding id as its source spells it, and the repository-relative path of the artifact that records
// it. `unresolvedSources()` resolves each distinct cited path against a repository root and returns
// the ones that do not exist, so a row cannot outlive the record that justifies it. A row whose
// citation has been deleted is a row nobody can check, and this phase's standing lesson is that an
// unlckeckable claim is how eleven rounds of green shipped a live bypass.
//
// TRANSCRIPTION HONESTY. Review artifacts are prose, and prose elides. Two fields record exactly what
// was done to each document on its way into this file:
//
//   * `transcription: "verbatim"` — the source prints the whole document and it is copied byte for
//     byte (modulo the newline convention).
//   * `transcription: "framed"` — the source prints a REGION (typically "the region under `tools:`")
//     or abbreviates the spawn token as `Agent(…)`. The region is wrapped in the two-line frame the
//     round-11 review itself uses (`---` / `name: r` / … / `---`) and the abbreviated token is
//     written out as `Agent(grugops-orchestrator)`, which is the token every round used. Nothing else
//     is reconstructed. Where a source elided prose (a `description:` line trailing off in an
//     ellipsis) the elision is dropped rather than invented.
//
// This module is PURE DATA. It has no top-level side effect other than one integrity throw (see
// `CORPUS_COUNT`), performs no I/O until `unresolvedSources` is called with an explicit root, and
// imports nothing but a TYPE from the admission reader. In particular it does NOT import from
// `scripts/frontmatter.test.ts`, even though that file is the densest source below: coupling a
// shipped module to a test harness is the drift this tree refuses. The axis rows' document text is
// copied here as data and their source field cites the axis by name.
//
// THIS MODULE CARRIES NO OPINION ABOUT THE GRAMMAR. Each row declares the refusal code it expects,
// and the replay asserts the reader's actual code equals it. A row refused for an unrelated reason
// therefore cannot pass as a closure — "it failed" and "it failed for the right reason" are different
// claims, and this phase has confused them before.
//
// VOICE. Clear professional English throughout, per the CLAUDE.md hard rule for safety surfaces.

import { existsSync } from "node:fs";
import { join } from "node:path";

import type { RefusalCode } from "./canonical-frontmatter.js";

// ---------------------------------------------------------------------------
// The row shape
// ---------------------------------------------------------------------------

// What a row IS, in one word.
//
//   * `bypass`     — a document that reached the silent-no-grant SUCCESS arm. The thing this corpus
//                    exists to replay.
//   * `control`    — a document a round recorded ALONGSIDE a bypass to prove the bypass was a
//                    property of the position and not of the construct: the same grant one spelling
//                    over, which the old module already refused. Round 11's dash-less alias and round
//                    10's bare-header row P are both of these, and D-64 names the first by hand.
//   * `divergence` — a document where the OLD module reported a grant the loader does not express, or
//                    enumerated a name the loader never produces. Not a silent no-grant, and recorded
//                    as its own kind so it is never counted as one.
export type CorpusKind = "bypass" | "control" | "divergence";

// Where the round proved it. A shape reproduced at the module level only, at the gate level only, or
// at both, earns a row; a shape merely discussed does not.
export type Reproduction = "module" | "gate" | "module+gate";

export type CorpusRow = {
  // Stable across edits. The replay names this id when a row fails, and plan 27-65's gate proof
  // plants rows BY ID, so renaming one silently detaches the two proofs from each other.
  readonly id: string;
  readonly round: number;
  // The finding id exactly as the source artifact spells it.
  readonly finding: string;
  // Repository-relative path of the artifact that records the reproduction. Checked by
  // `unresolvedSources`.
  readonly source: string;
  // Where inside that artifact — a section, a table row, a named axis. Prose, for a human checking
  // the row against its record.
  readonly sourceDetail: string;
  readonly kind: CorpusKind;
  readonly reproducedAt: Reproduction;
  readonly label: string;
  readonly transcription: "verbatim" | "framed";
  // The document, exactly as the replay feeds it to `admit`.
  readonly text: string;
  // The refusal code this row is expected to produce. Declared by the row, asserted by the replay.
  readonly expected: RefusalCode;
  // The loader verdict the SOURCE RECORDS, verbatim, or `null` where the source records none.
  //
  // `null` IS NOT AN ABSENCE OF INTEREST — it is `UNKNOWN - verify`, and the replay prints it as
  // such with the reason from `loaderNote`. Rounds 1 through 4 had no YAML loader available in the
  // review environment and said so; a loader verdict must never be inferred for them here, because
  // inventing one is the fabrication CLAUDE.md forbids by name.
  readonly loaderVerdict: string | null;
  // Why the loader column is what it is. Required on every row, so a `null` always carries a reason.
  readonly loaderNote: string;
};

// ---------------------------------------------------------------------------
// The cited artifacts
// ---------------------------------------------------------------------------

const PHASE = ".planning/phases/27-spawn-correctness-kit-set-authority";

const R01 = `${PHASE}/27-REVIEW-GAPS.md`;
const R02 = `${PHASE}/27-REVIEW-GAPS-2.md`;
const R03 = `${PHASE}/27-REVIEW-GAPS-3.md`;
const R04 = `${PHASE}/27-REVIEW-GAPS-4.md`;
const R05 = `${PHASE}/27-REVIEW-GAPS-5.md`;
const R06 = `${PHASE}/27-REVIEW-GAPS-6.md`;
const R07 = `${PHASE}/27-REVIEW-GAPS-7.md`;
const R08 = `${PHASE}/27-REVIEW-GAPS-8.md`;
const R09 = `${PHASE}/27-REVIEW-round9.md`;
const R10 = `${PHASE}/27-REVIEW-round10.md`;
const R11 = `${PHASE}/27-REVIEW.md`;

// The third and densest source: the loader-adjudicated axis tables. Their rows were adjudicated
// against `/usr/bin/ruby -ryaml` when they were written, and their labels carry their own round
// attribution, which is where each axis row's `round` below comes from.
const AXIS = "scripts/frontmatter.test.ts";

// Every distinct artifact a row may cite. `unresolvedSources` walks the paths the ROWS actually use,
// not this list, so a row citing a path nobody declared is still checked.
export const CITED_ARTIFACTS: readonly string[] = [
  R01,
  R02,
  R03,
  R04,
  R05,
  R06,
  R07,
  R08,
  R09,
  R10,
  R11,
  AXIS,
];

// ---------------------------------------------------------------------------
// Document construction
// ---------------------------------------------------------------------------

// Characters that must never be written as a source literal.
//
// A doubled backslash is a DIFFERENT (and allowlisted) document, so a fixture that accidentally
// doubles it proves the opposite of what it claims — `scripts/frontmatter.test.ts` records exactly
// this trap at its own `BS`, and the round-3 review's reproduction instruction was to verify the
// bytes with `od -c` for the same reason. The invisible code points are built the same way for a
// second reason: a literal NUL byte in this file would make `grep` classify it as binary and report
// zero matches with no warning, which would quietly hide these rows from every future audit.
const BS = String.fromCharCode(92); // REVERSE SOLIDUS
const BOM = String.fromCharCode(0xfeff); // ZERO WIDTH NO-BREAK SPACE
const ZWSP = String.fromCharCode(0x200b); // ZERO WIDTH SPACE
const NBSP = String.fromCharCode(0x00a0); // NO-BREAK SPACE
const NUL = String.fromCharCode(0x0000); // NULL
const ACUTE = String.fromCharCode(0x0301); // COMBINING ACUTE ACCENT

// The spawn token every round used. Written out in full wherever a source abbreviated it.
const GRANT = "Agent(grugops-orchestrator)";

// The frame round 11 uses for a region: a two-line opening, the region, the closing delimiter, a
// body. Every `framed` row is built through this and through nothing else.
const doc = (lines: readonly string[]): string =>
  ["---", ...lines, "---", "body", ""].join("\n");

// The same, for the rounds whose defect is in the PROLOGUE — the head line is the payload, so it
// cannot be produced by `doc`.
const headed = (head: string, lines: readonly string[]): string =>
  [head, ...lines, "---", "body", ""].join("\n");

// The round-5 body, which every one of its eight prologue rows shares verbatim.
const R05_BODY: readonly string[] = ["name: rogue", `tools: Read, ${GRANT}`];

// ---------------------------------------------------------------------------
// THE CORPUS
// ---------------------------------------------------------------------------

export const CORPUS: readonly CorpusRow[] = [
  // ── ROUND 1 — 27-REVIEW-GAPS.md § CR-01: a YAML anchor/alias grant read as no grant ───────────
  {
    id: "r01-cr01-parser",
    round: 1,
    finding: "CR-01",
    source: R01,
    sourceDetail:
      "§ CR-01, the parse transcript printed against the committed frontmatter.js",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "an alias on the tools key, its anchor parked under a helper key — the founding silent no-grant",
    transcription: "framed",
    text: doc([
      "name: r",
      "_t: &t Read, Grep, Agent(grugops-installer)",
      "tools: *t",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: round 1 ran no YAML loader; the review argues from the YAML 1.1/1.2 spec that any compliant parser resolves `tools: *t` to the granting value, and records no measured loader transcript.",
  },
  {
    id: "r01-cr01-gate",
    round: 1,
    finding: "CR-01",
    source: R01,
    sourceDetail:
      "§ CR-01, the hermetic-mirror plant on .claude/skills/grugops-gate/SKILL.md, gate ALL CHECKS PASSED",
    kind: "bypass",
    reproducedAt: "gate",
    label:
      "the same alias planted on a live skill adapter's allowed-tools key — whole gate green",
    transcription: "framed",
    text: doc([
      "name: grugops-gate",
      "description: Run the grugops PR quality gate",
      'argument-hint: "<request>"',
      "_tools: &t Read, Write, Bash, Glob, Grep, Agent(grugops-software-engineer)",
      "allowed-tools: *t",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: no loader was run in round 1. The review's own `description:` line trails off in an ellipsis; the elision is dropped here rather than invented.",
  },

  // ── ROUND 2 — 27-REVIEW-GAPS-2.md § CR-01: a tag prefix hides the anchor ──────────────────────
  {
    id: "r02-cr01-tagged-alias",
    round: 2,
    finding: "CR-01",
    source: R02,
    sourceDetail:
      "§ CR-01, the two-line reproduction and the mirror plant on .claude/skills/grugops-map/SKILL.md",
    kind: "bypass",
    reproducedAt: "module+gate",
    label:
      "a shorthand tag standing in front of the anchor, and a tagged flow collection carrying the alias",
    transcription: "framed",
    text: doc([
      "name: r",
      `_t: !!str &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "allowed-tools: !!seq [*t]",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: round 2 ran no loader either; it records the gate exit code and argues the resolution from the spec.",
  },

  // ── ROUND 3 — 27-REVIEW-GAPS-3.md § CR-01: unquote() mangles YAML escapes ─────────────────────
  {
    id: "r03-cr01-escaped-seq-item",
    round: 3,
    finding: "CR-01",
    source: R03,
    sourceDetail:
      "§ CR-01, the plant on .claude/skills/grugops-map/SKILL.md, gate ALL CHECKS PASSED at exit 0",
    kind: "bypass",
    reproducedAt: "module+gate",
    label:
      "an 8-bit numeric escape spelling the grant token inside a quoted block-sequence item",
    transcription: "framed",
    text: doc([
      "name: r",
      "allowed-tools:",
      "  - Read",
      "  - Write",
      "  - Bash",
      "  - Glob",
      "  - Grep",
      `  - "${BS}x41gent(grugops-orchestrator)"`,
    ]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: the round-3 review states in its own words that no third-party YAML loader was executable in that environment, and rests the finding on YAML 1.2 § 5.7 instead.",
  },
  {
    id: "r03-in02-directive-prologue",
    round: 3,
    finding: "IN-02",
    source: R03,
    sourceDetail: "§ IN-02, the verified one-line reproduction",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "a %TAG directive before the opening delimiter takes the `no frontmatter at all` success arm",
    transcription: "verbatim",
    text: headed("%TAG !e! tag:x,2000:", ["---", "name: x", "tools: Read, Agent(o)"]),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: the review states the platform probably sees no frontmatter either and explicitly declines to confirm it against Claude Code.",
  },

  // ── ROUND 4 — 27-REVIEW-GAPS-4.md § CR-01: a byte adjoining the delimiter ─────────────────────
  {
    id: "r04-cr01-bom",
    round: 4,
    finding: "CR-01",
    source: R04,
    sourceDetail:
      "§ CR-01, the parser reproduction and the byte-level gate control (WITH BOM exit 0 / WITHOUT BOM exit 1)",
    kind: "bypass",
    reproducedAt: "module+gate",
    label:
      "a three-byte UTF-8 BOM in front of the opening delimiter, the only difference from a red gate",
    transcription: "verbatim",
    text: BOM + doc(["name: rogue", `tools: Read, ${GRANT}`]),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: round 4 measured the module and the gate; it records no loader transcript for the prologue rows.",
  },
  {
    id: "r04-cr01-trailing-nbsp",
    round: 4,
    finding: "CR-01",
    source: R04,
    sourceDetail:
      "§ CR-01, the second independent member of the complement, reproduced identically at exit 0",
    kind: "bypass",
    reproducedAt: "gate",
    label:
      "a NO-BREAK SPACE after the opening delimiter — a different byte, the same silent success arm",
    transcription: "framed",
    text: headed(`---${NBSP}`, ["name: rogue", `tools: Read, ${GRANT}`]),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: recorded by gate exit code only; no loader transcript in round 4.",
  },

  // ── ROUND 5 — 27-REVIEW-GAPS-5.md § CR-01: the delimiter refusal's two arms do not compose ────
  //
  // Eight parser rows and one gate row, all from the same table. They are eight rows rather than one
  // because the defect is the COMPOSITION of a leading-residue arm with a payload-legality arm, and a
  // single row cannot show a composition.
  {
    id: "r05-cr01-zwsp-fourdash",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail: "§ CR-01, parser-level table row `ZWSP + ----`",
    kind: "bypass",
    reproducedAt: "module",
    label: "a zero-width space in front of an illegal four-dash payload",
    transcription: "framed",
    text: headed(`${ZWSP}----`, R05_BODY),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: the review records the module verdict and the gate exit code, and explicitly declines to claim Claude Code loads such a head line.",
  },
  {
    id: "r05-cr01-zwsp-dash-foo",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail: "§ CR-01, parser-level table row `ZWSP + --- foo`",
    kind: "bypass",
    reproducedAt: "module",
    label: "a zero-width space in front of a delimiter carrying trailing residue",
    transcription: "framed",
    text: headed(`${ZWSP}--- foo`, R05_BODY),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; round 5 records no loader column.",
  },
  {
    id: "r05-cr01-space-fourdash",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail: "§ CR-01, parser-level table row `space + ----`",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "an ordinary leading space in front of an illegal payload — the residue need not be invisible",
    transcription: "framed",
    text: headed("  ----", R05_BODY),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; round 5 records no loader column.",
  },
  {
    id: "r05-cr01-combining-acute",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail: "§ CR-01, parser-level table row `U+0301 + --- + U+0301`",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "a combining acute accent on both sides of a legal payload — residue with no width of its own",
    transcription: "framed",
    text: headed(`${ACUTE}---${ACUTE}`, R05_BODY),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; round 5 records no loader column.",
  },
  {
    id: "r05-cr01-double-bom-fourdash",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail: "§ CR-01, parser-level table row `BOM x2 + ----`",
    kind: "bypass",
    reproducedAt: "module",
    label: "two byte-order marks in front of an illegal payload",
    transcription: "framed",
    text: headed(`${BOM}${BOM}----`, R05_BODY),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; round 5 records no loader column.",
  },
  {
    id: "r05-cr01-nbsp-fourdash",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail: "§ CR-01, parser-level table row `NBSP + ----`",
    kind: "bypass",
    reproducedAt: "module",
    label: "a no-break space in front of an illegal payload",
    transcription: "framed",
    text: headed(`${NBSP}----`, R05_BODY),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; round 5 records no loader column.",
  },
  {
    id: "r05-cr01-double-bom-zwsp",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail: "§ CR-01, parser-level table row `BOM x2 + --- + ZWSP`",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "residue on both sides of a legal payload, in two different invisible code points",
    transcription: "framed",
    text: headed(`${BOM}${BOM}---${ZWSP}`, R05_BODY),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; round 5 records no loader column.",
  },
  {
    id: "r05-cr01-nul",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail: "§ CR-01, parser-level table row `NUL + --- + NUL`",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "a NULL byte on both sides of a legal payload — the residue is a C0 control character",
    transcription: "framed",
    text: headed(`${NUL}---${NUL}`, R05_BODY),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; round 5 records no loader column.",
  },
  {
    id: "r05-cr01-gate-zwsp-both",
    round: 5,
    finding: "CR-01",
    source: R05,
    sourceDetail:
      "§ CR-01, the gate-level table: `---<ZWSP>` exit 1, `<ZWSP>---` exit 1, `<ZWSP>---<ZWSP>` exit 0",
    kind: "bypass",
    reproducedAt: "gate",
    label:
      "the composite that flips a red gate green — each half refuses alone, the composition does not",
    transcription: "framed",
    text: headed(`${ZWSP}---${ZWSP}`, ["name: rogue", `allowed-tools: Read, ${GRANT}`]),
    expected: "no-opening-delimiter",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: the review records the gate exit codes and states the platform load question as its own open UNKNOWN.",
  },

  // ── ROUND 6 — 27-REVIEW-GAPS-6.md § CR-01: quote state decided per PHYSICAL LINE ──────────────
  {
    id: "r06-cr01-double-quoted",
    round: 6,
    finding: "CR-01",
    source: R06,
    sourceDetail: "§ CR-01, spelling A, measured against the committed frontmatter.js",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "a double-quoted scalar wrapping across lines, whose continuation begins with a comment sigil",
    transcription: "verbatim",
    text: doc(["name: rogue", 'tools: "Read,', `  # x, ${GRANT}"`]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: `{"tools"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote:
      "Recorded in round 6 from `ruby -ryaml` on the same bytes; the loader sees the grant.",
  },
  {
    id: "r06-cr01-single-quoted",
    round: 6,
    finding: "CR-01",
    source: R06,
    sourceDetail: "§ CR-01, spelling B — identical, with `'` instead of `\"`",
    kind: "bypass",
    reproducedAt: "module",
    label: "the same wrap in the single-quoted spelling",
    transcription: "framed",
    text: doc(["name: rogue", "tools: 'Read,", `  # x, ${GRANT}'`]),
    expected: "single-quoted",
    loaderVerdict: `{"tools"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote:
      "The review states spelling B is identical to spelling A with the quote style swapped, and records the same loader value.",
  },
  {
    id: "r06-cr01-seq-item",
    round: 6,
    finding: "CR-01",
    source: R06,
    sourceDetail:
      "§ CR-01, spelling C — the idiom all 7 shipped skills and all 17 agent adapters use; reproduced end to end",
    kind: "bypass",
    reproducedAt: "module+gate",
    label:
      "the wrap inside a quoted block-sequence item, which is the shape a drifting author would write",
    transcription: "framed",
    text: doc([
      "name: r",
      "allowed-tools:",
      "  - Read",
      "  - Write",
      "  - Bash",
      "  - Glob",
      '  - "Grep,',
      `    # note, ${GRANT}"`,
    ]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: `{"tools"=>["Read", "Write, # x, Agent(grugops-orchestrator)"]}`,
    loaderNote:
      "Round 6 records this `ruby -ryaml` transcript for spelling C on the two-item form; the planted file carries the same construct with the kit's five baseline tools ahead of it.",
  },

  // ── ROUND 7 — 27-REVIEW-GAPS-7.md § CR-01: the continuation path never seeds at a node start ──
  {
    id: "r07-cr01-dq-continuation",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail: "§ CR-01, parser-level table row 1",
    kind: "bypass",
    reproducedAt: "module",
    label: "a double-quoted scalar opening on the FIRST continuation line under an empty key",
    transcription: "framed",
    text: doc(["name: r", "tools:", '  "Read,', `  # x, ${GRANT}"`]),
    expected: "unrecognized-line",
    loaderVerdict: `"Read, # x, Agent(grugops-orchestrator)"`,
    loaderNote: "Round 7 records the libyaml column for every row of this table.",
  },
  {
    id: "r07-cr01-sq-continuation",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail: "§ CR-01, parser-level table row 2",
    kind: "bypass",
    reproducedAt: "module",
    label: "the same, single-quoted",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  'Read,", `  # x, ${GRANT}'`]),
    expected: "single-quoted",
    loaderVerdict: `"Read, # x, Agent(grugops-orchestrator)"`,
    loaderNote: "Round 7 records `same` for this row's libyaml column.",
  },
  {
    id: "r07-cr01-key-comment",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail: "§ CR-01, parser-level table row 3 (`tools: # c`)",
    kind: "bypass",
    reproducedAt: "module",
    label: "a comment on the key line ahead of the wrapped scalar",
    transcription: "framed",
    text: doc(["name: r", "tools: # c", '  "Read,', `  # x, ${GRANT}"`]),
    expected: "plain-scalar-charset",
    loaderVerdict: `"Read, # x, Agent(grugops-orchestrator)"`,
    loaderNote: "Round 7 records `same` for this row's libyaml column.",
  },
  {
    id: "r07-cr01-trailing-space-key",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail: "§ CR-01, parser-level table row 4 (`tools:  ` with trailing whitespace)",
    kind: "bypass",
    reproducedAt: "module",
    label: "trailing whitespace on the empty key line ahead of the wrapped scalar",
    transcription: "framed",
    text: doc(["name: r", "tools:  ", '  "Read,', `  # x, ${GRANT}"`]),
    expected: "scalar-padding",
    loaderVerdict: `"Read, # x, Agent(grugops-orchestrator)"`,
    loaderNote: "Round 7 records `same` for this row's libyaml column.",
  },
  {
    id: "r07-cr01-flow-sequence",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail: "§ CR-01, parser-level table row 5 (flow sequence)",
    kind: "bypass",
    reproducedAt: "module",
    label: "the quoted scalar opens mid-line inside a flow sequence",
    transcription: "framed",
    text: doc(["name: r", "tools: [Read,", '  "Write,', `  # x, ${GRANT}"]`]),
    expected: "flow-collection",
    loaderVerdict: `["Read", "Write, # x, Agent(grugops-orchestrator)"]`,
    loaderNote: "Round 7 records this libyaml value for the flow-sequence row.",
  },
  {
    id: "r07-cr01-flow-mapping",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail: "§ CR-01, parser-level table row 6 (flow mapping)",
    kind: "bypass",
    reproducedAt: "module",
    label: "the quoted scalar opens mid-line inside a flow mapping",
    transcription: "framed",
    text: doc(["name: r", 'tools: {a: "Read,', `  # x, ${GRANT}"}`]),
    expected: "flow-collection",
    loaderVerdict: `{"a"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 7 records this libyaml value for the flow-mapping row.",
  },
  {
    id: "r07-cr01-empty-dash",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail: "§ CR-01, parser-level table row 7 (a content-free sequence item)",
    kind: "bypass",
    reproducedAt: "module",
    label: "the scalar opens on the line under a content-free block-sequence dash",
    transcription: "framed",
    text: doc([
      "name: r",
      "tools:",
      "  - Read",
      "  -",
      '    "Write,',
      `    # x, ${GRANT}"`,
    ]),
    expected: "unrecognized-line",
    loaderVerdict: `["Read", "Write, # x, Agent(grugops-orchestrator)"]`,
    loaderNote: "Round 7 records this libyaml value for the content-free-dash row.",
  },
  {
    id: "r07-cr01-gate-skill",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail:
      "§ CR-01, end-to-end reproduction (a): skills/plan/SKILL.md + .claude/skills/grugops-plan/SKILL.md, exit 0",
    kind: "bypass",
    reproducedAt: "gate",
    label:
      "the wrapped scalar planted into a live allowed-tools key on both distribution twins",
    transcription: "framed",
    text: doc([
      "name: r",
      "allowed-tools:",
      '  "Read, Write, Bash, Glob, Grep,',
      `  # x, ${GRANT}"`,
    ]),
    expected: "unrecognized-line",
    loaderVerdict: `"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"`,
    loaderNote: "Round 7 records the libyaml value beside the exit-0 transcript.",
  },
  {
    id: "r07-cr01-gate-flow",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail: "§ CR-01, end-to-end reproduction (b): the flow-collection spelling, exit 0",
    kind: "bypass",
    reproducedAt: "gate",
    label: "the same plant in the flow-collection spelling",
    transcription: "framed",
    text: doc([
      "name: r",
      "allowed-tools: [Read, Write, Bash, Glob,",
      '  "Grep,',
      `  # x, ${GRANT}"]`,
    ]),
    expected: "flow-collection",
    loaderVerdict: `["Read","Write","Bash","Glob","Grep, # x, Agent(grugops-orchestrator)"]`,
    loaderNote: "Round 7 records the libyaml value beside the exit-0 transcript.",
  },
  {
    id: "r07-cr01-gate-agent",
    round: 7,
    finding: "CR-01",
    source: R07,
    sourceDetail:
      "§ CR-01, end-to-end reproduction (c): the non-coordinator role agent .claude/agents/grugops-qe-e2e.md, exit 0",
    kind: "bypass",
    reproducedAt: "gate",
    label:
      "the same construct on an AGENT adapter's tools key, past the structure validator as well",
    transcription: "framed",
    text: doc([
      "name: r",
      "tools:",
      '  "Read, Grep, Glob, Edit, Write, Bash,',
      `  # x, ${GRANT}"`,
    ]),
    expected: "unrecognized-line",
    loaderVerdict: `"Read, Grep, Glob, Edit, Write, Bash, # x, Agent(grugops-orchestrator)"`,
    loaderNote: "Round 7 records the libyaml value beside the exit-0 transcript.",
  },

  // ── ROUND 8 — 27-REVIEW-GAPS-8.md § CR-01: the walk's node-start set is not YAML's ────────────
  {
    id: "r08-cr01-a-nested-mapping",
    round: 8,
    finding: "CR-01 row A",
    source: R08,
    sourceDetail: "§ CR-01, table row A; gate FAMILY A reproduced at exit 0",
    kind: "bypass",
    reproducedAt: "module+gate",
    label: "a block-mapping key: value on an indented line is a node start the walk never raised",
    transcription: "framed",
    text: doc(["name: r", "tools:", '  nested: "Read,', `  # x, ${GRANT}"`]),
    expected: "unrecognized-line",
    loaderVerdict: `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote:
      "Round 8 measured every row against /usr/bin/ruby -ryaml (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1).",
  },
  {
    id: "r08-cr01-b-compact-nested-sequence",
    round: 8,
    finding: "CR-01 row B",
    source: R08,
    sourceDetail: "§ CR-01, table row B; gate FAMILY B reproduced at exit 0",
    kind: "bypass",
    reproducedAt: "module+gate",
    label: "a compact nested sequence, where the second dash begins a node mid-line",
    transcription: "framed",
    text: doc(["name: r", "tools:", '  - - "Read,', `    # x, ${GRANT}"`]),
    expected: "plain-scalar-charset",
    loaderVerdict: `[["Read, # x, Agent(grugops-orchestrator)"]]`,
    loaderNote: "Round 8 libyaml column for row B.",
  },
  {
    id: "r08-cr01-c-json-adjacency",
    round: 8,
    finding: "CR-01 row C",
    source: R08,
    sourceDetail: "§ CR-01, table row C; gate FAMILY C reproduced at exit 0",
    kind: "bypass",
    reproducedAt: "module+gate",
    label:
      "JSON-like colon adjacency inside a flow mapping, one character away from a pinned sibling",
    transcription: "framed",
    text: doc(["name: r", 'tools: {"a":"Read,', `  # x, ${GRANT}"}`]),
    expected: "flow-collection",
    loaderVerdict: `{"a"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 8 libyaml column for row C.",
  },
  {
    id: "r08-cr01-d-seq-compact-mapping",
    round: 8,
    finding: "CR-01 row D",
    source: R08,
    sourceDetail: "§ CR-01, table row D",
    kind: "bypass",
    reproducedAt: "module",
    label: "a compact mapping inside a block-sequence item",
    transcription: "framed",
    text: doc(["name: r", "tools:", '  - a: "Read,', `    # x, ${GRANT}"`]),
    expected: "plain-scalar-charset",
    loaderVerdict: `[{"a"=>"Read, # x, Agent(grugops-orchestrator)"}]`,
    loaderNote: "Round 8 libyaml column for row D.",
  },
  {
    id: "r08-cr01-e-two-level-mapping",
    round: 8,
    finding: "CR-01 row E",
    source: R08,
    sourceDetail: "§ CR-01, table row E",
    kind: "bypass",
    reproducedAt: "module",
    label: "a two-level nested block mapping",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  a:", '    b: "Read,', `    # x, ${GRANT}"`]),
    expected: "unrecognized-line",
    loaderVerdict: `{"a"=>{"b"=>"Read, # x, Agent(grugops-orchestrator)"}}`,
    loaderNote: "Round 8 libyaml column for row E.",
  },
  {
    id: "r08-cr01-f-explicit-key",
    round: 8,
    finding: "CR-01 row F",
    source: R08,
    sourceDetail: "§ CR-01, table row F; gate FAMILY F reproduced at exit 0",
    kind: "bypass",
    reproducedAt: "module+gate",
    label: "a block explicit key, whose `?` the walk gated on flow depth",
    transcription: "framed",
    text: doc(["name: r", "tools:", '  ? "Read,', `  # x, ${GRANT}"`, "  : v"]),
    expected: "reserved-indicator",
    loaderVerdict: `{"Read, # x, Agent(grugops-orchestrator)"=>"v"}`,
    loaderNote: "Round 8 libyaml column for row F.",
  },
  {
    id: "r08-cr01-h-spaced-json-key",
    round: 8,
    finding: "CR-01 row H",
    source: R08,
    sourceDetail: "§ CR-01, table row H",
    kind: "bypass",
    reproducedAt: "module",
    label: "a space before the colon of a JSON-like flow-mapping key",
    transcription: "framed",
    text: doc(["name: r", 'tools: {"a" :"Read,', `  # x, ${GRANT}"}`]),
    expected: "flow-collection",
    loaderVerdict: `{"a"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 8 libyaml column for row H.",
  },
  {
    id: "r08-cr01-c2-nested-flow",
    round: 8,
    finding: "CR-01 row C2",
    source: R08,
    sourceDetail: "§ CR-01, table row C2",
    kind: "bypass",
    reproducedAt: "module",
    label: "the JSON adjacency one level deeper, inside a flow sequence of flow mappings",
    transcription: "framed",
    text: doc(["name: r", 'tools: [{"a":"Read,', `  # x, ${GRANT}"}]`]),
    expected: "flow-collection",
    loaderVerdict: `[{"a"=>"Read, # x, Agent(grugops-orchestrator)"}]`,
    loaderNote: "Round 8 libyaml column for row C2.",
  },

  // ── ROUND 9 — 27-REVIEW-round9.md § CR-01: YAML's `''` escape destroys a scalar's provenance ──
  {
    id: "r09-cr01-a-spaced-escape",
    round: 9,
    finding: "CR-01 row A",
    source: R09,
    sourceDetail: "§ CR-01, loader-column table row A",
    kind: "bypass",
    reproducedAt: "module",
    label: "an escaped apostrophe inside a single-quoted scalar on the key line",
    transcription: "framed",
    text: doc(["name: r", "tools: 'Read'' s,", `  # x, ${GRANT}'`]),
    expected: "single-quoted",
    loaderVerdict: `"Read' s, # x, Agent(grugops-orchestrator)"`,
    loaderNote:
      "Round 9 recorded verbatim /usr/bin/ruby -ryaml transcripts; every row is libyaml-ACCEPTED with the grant in the loaded value.",
  },
  {
    id: "r09-cr01-b-unspaced-escape",
    round: 9,
    finding: "CR-01 row B",
    source: R09,
    sourceDetail: "§ CR-01, loader-column table row B",
    kind: "bypass",
    reproducedAt: "module",
    label: "the same escape with no space after it",
    transcription: "framed",
    text: doc(["name: r", "tools: 'Read''s,", `  # x, ${GRANT}'`]),
    expected: "single-quoted",
    loaderVerdict: `"Read's, # x, Agent(grugops-orchestrator)"`,
    loaderNote: "Round 9 loader column for row B.",
  },
  {
    id: "r09-cr01-c-seq-item",
    round: 9,
    finding: "CR-01 row C",
    source: R09,
    sourceDetail: "§ CR-01, loader-column table row C",
    kind: "bypass",
    reproducedAt: "module",
    label: "the escape inside a block-sequence item — not a key-line artifact",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  - 'Read'' s,", `    # x, ${GRANT}'`]),
    expected: "single-quoted",
    loaderVerdict: `["Read' s, # x, Agent(grugops-orchestrator)"]`,
    loaderNote: "Round 9 loader column for row C.",
  },
  {
    id: "r09-cr01-d-flow-sequence",
    round: 9,
    finding: "CR-01 row D",
    source: R09,
    sourceDetail: "§ CR-01, loader-column table row D",
    kind: "bypass",
    reproducedAt: "module",
    label: "the escape inside a flow sequence — the flow path inherits it identically",
    transcription: "framed",
    text: doc(["name: r", "tools: ['Read'' s,", `  # x, ${GRANT}']`]),
    expected: "flow-collection",
    loaderVerdict: `["Read' s, # x, Agent(grugops-orchestrator)"]`,
    loaderNote: "Round 9 loader column for row D.",
  },
  {
    id: "r09-cr01-f-control",
    round: 9,
    finding: "CR-01 row F",
    source: R09,
    sourceDetail: "§ CR-01, loader-column table row F, the false-red control",
    kind: "control",
    reproducedAt: "module",
    label:
      "the same wrap with the `''` removed, which the old module read CORRECTLY as a grant",
    transcription: "framed",
    text: doc(["name: r", "tools: 'Read,", `  # x, ${GRANT}'`]),
    expected: "single-quoted",
    loaderVerdict: `"Read, # x, Agent(grugops-orchestrator)"`,
    loaderNote:
      "Round 9 records this row as the control that isolates the `''`: the old module returned {ok:true,value:true} here, correctly.",
  },
  {
    id: "r09-cr01-gate",
    round: 9,
    finding: "CR-01",
    source: R09,
    sourceDetail:
      "§ CR-01, the hermetic-mirror gate transcript on skills/plan/SKILL.md, ALL CHECKS PASSED at EXIT=0",
    kind: "bypass",
    reproducedAt: "gate",
    label: "the escape planted into a live allowed-tools key, whole gate green",
    transcription: "framed",
    text: doc(["name: r", "allowed-tools:", "  - 'Read'' s,", `    # x, ${GRANT}'`]),
    expected: "single-quoted",
    loaderVerdict: `"Read' s, # x, Agent(grugops-orchestrator)"`,
    loaderNote:
      "Round 9's gate transcript prints the loader value for the planted file alongside the module's parse.",
  },

  // ── ROUND 10 — 27-REVIEW-round10.md ───────────────────────────────────────────────────────────
  {
    id: "r10-cr01-u1-sticky-exemption",
    round: 10,
    finding: "CR-01 row U1",
    source: R10,
    sourceDetail:
      "§ CR-01, row U1 — a regression introduced by round 10's own fix (`sawBlock` is sticky)",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "one unrelated sibling entry carrying a block scalar disables the escape refusal for the whole key",
    transcription: "verbatim",
    text: doc([
      "name: r",
      "tools:",
      `  a: "${BS}x41gent(grugops-orchestrator)"`,
      "  b: >-",
      "    x",
    ]),
    expected: "block-scalar",
    loaderVerdict: `{"a"=>"Agent(grugops-orchestrator)","b"=>"x"}`,
    loaderNote: "Round 10 libyaml column for U1.",
  },
  {
    id: "r10-cr01-u2-control",
    round: 10,
    finding: "CR-01 row U2",
    source: R10,
    sourceDetail: "§ CR-01, row U2 — the control the review insists must be pinned WITH U1",
    kind: "control",
    reproducedAt: "module",
    label:
      "the same escaped grant with the sibling removed, which the old module REFUSED correctly",
    transcription: "verbatim",
    text: doc(["name: r", "tools:", `  a: "${BS}x41gent(grugops-orchestrator)"`]),
    expected: "unrecognized-line",
    loaderVerdict: `{"a"=>"Agent(grugops-orchestrator)"}`,
    loaderNote:
      "Round 10 records U2's libyaml value and states that U2 alone passes and proves nothing — the defect is that U2's own refusal disappears when a sibling is added.",
  },
  {
    id: "r10-cr02-a-anchor-before-indicator",
    round: 10,
    finding: "CR-02 row A",
    source: R10,
    sourceDetail: "§ CR-02, table row A; also the gate-level reproduction at exit 0",
    kind: "bypass",
    reproducedAt: "module+gate",
    label: "a YAML anchor standing between the mapping indicator and the block-scalar indicator",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  nested: &a >-", `    Read, # x, ${GRANT}`]),
    expected: "node-property",
    loaderVerdict: `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 10 libyaml column for row A.",
  },
  {
    id: "r10-cr02-b-tag-before-indicator",
    round: 10,
    finding: "CR-02 row B",
    source: R10,
    sourceDetail: "§ CR-02, table row B — the same with `!!str` instead of `&a`",
    kind: "bypass",
    reproducedAt: "module",
    label: "a YAML tag in the same position",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  nested: !!str >-", `    Read, # x, ${GRANT}`]),
    expected: "node-property",
    loaderVerdict: `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 10 records `same grant` for row B's libyaml column.",
  },
  {
    id: "r10-cr02-f-explicit-key-value",
    round: 10,
    finding: "CR-02 row F",
    source: R10,
    sourceDetail: "§ CR-02, table row F",
    kind: "bypass",
    reproducedAt: "module",
    label: "the property sits after a block explicit key's `:` arm",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  ? k", "  : &a >-", `      Read, # x, ${GRANT}`]),
    expected: "reserved-indicator",
    loaderVerdict: `{"k"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 10 libyaml column for row F.",
  },
  {
    id: "r10-cr02-q-explicit-key",
    round: 10,
    finding: "CR-02 row Q",
    source: R10,
    sourceDetail: "§ CR-02, table row Q",
    kind: "bypass",
    reproducedAt: "module",
    label: "the property sits after a block explicit key's `?` arm",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  ? &a >-", `      Read, # x, ${GRANT}`, "  : v"]),
    expected: "reserved-indicator",
    loaderVerdict: `{"Read, # x, Agent(grugops-orchestrator)"=>"v"}`,
    loaderNote: "Round 10 libyaml column for row Q.",
  },
  {
    id: "r10-cr02-p-control",
    round: 10,
    finding: "CR-02 row P",
    source: R10,
    sourceDetail: "§ CR-02, control row P — a BARE header with a property, which refused correctly",
    kind: "control",
    reproducedAt: "module",
    label:
      "the same property at offset 0 of the line, which the old module refused — the proof this was the introduction set and not the sigil test",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  &a >-", `    Read, # x, ${GRANT}`]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: round 10 records row P's MODULE verdict (a correct refusal) and does not print a libyaml column for it.",
  },
  {
    id: "r10-cr02-gate",
    round: 10,
    finding: "CR-02",
    source: R10,
    sourceDetail:
      "§ CR-02, the gate-level reproduction planted on .claude/skills/grugops-map/SKILL.md and skills/map/SKILL.md, exit 0",
    kind: "bypass",
    reproducedAt: "gate",
    label: "row A's shape planted into a live allowed-tools key",
    transcription: "verbatim",
    text: doc([
      "name: r",
      "allowed-tools:",
      "  nested: &a >-",
      `    Read, Write, Bash, Glob, Grep, # x, ${GRANT}`,
    ]),
    expected: "node-property",
    loaderVerdict: `allowed-tools => {"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 10's summary records the libyaml reading of the planted file.",
  },
  {
    id: "r10-cr03-v1-quoted-nested-key",
    round: 10,
    finding: "CR-03 row V1",
    source: R10,
    sourceDetail: "§ CR-03, table row V1",
    kind: "bypass",
    reproducedAt: "module",
    label: "a QUOTED nested mapping key, outside the top-level frontmatter key charset",
    transcription: "framed",
    text: doc(["name: r", "tools:", '  "a b": >-', `    Read, # x, ${GRANT}`]),
    expected: "unrecognized-line",
    loaderVerdict: `{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 10 libyaml column for row V1.",
  },
  {
    id: "r10-cr03-v2-dotted-nested-key",
    round: 10,
    finding: "CR-03 row V2",
    source: R10,
    sourceDetail: "§ CR-03, table row V2",
    kind: "bypass",
    reproducedAt: "module",
    label: "a nested key containing a dot",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  a.b: >-", `    Read, # x, ${GRANT}`]),
    expected: "unrecognized-line",
    loaderVerdict: `{"a.b"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 10 libyaml column for row V2.",
  },
  {
    id: "r10-cr03-v3-digit-leading-nested-key",
    round: 10,
    finding: "CR-03 row V3",
    source: R10,
    sourceDetail: "§ CR-03, table row V3",
    kind: "bypass",
    reproducedAt: "module",
    label: "a nested key starting with a digit",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  1a: >-", `    Read, # x, ${GRANT}`]),
    expected: "unrecognized-line",
    loaderVerdict: `{"1a"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 10 libyaml column for row V3.",
  },
  {
    id: "r10-cr03-v4-spaced-nested-key",
    round: 10,
    finding: "CR-03 row V4",
    source: R10,
    sourceDetail: "§ CR-03, table row V4",
    kind: "bypass",
    reproducedAt: "module",
    label: "a nested key containing a space",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  a b: >-", `    Read, # x, ${GRANT}`]),
    expected: "unrecognized-line",
    loaderVerdict: `{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}`,
    loaderNote: "Round 10 libyaml column for row V4.",
  },
  {
    id: "r10-wr01-overincluded-content-line",
    round: 10,
    finding: "WR-01",
    source: R10,
    sourceDetail: "§ WR-01, the more-indented first content line",
    kind: "divergence",
    reproducedAt: "module",
    label:
      "a more-indented first content line made the old module report a grant the loader does not have",
    transcription: "verbatim",
    text: doc([
      "name: r",
      "tools:",
      "  nested: >-",
      "        Read,",
      `    # x, ${GRANT}`,
    ]),
    expected: "block-scalar",
    loaderVerdict: `{"nested"=>"Read,"}`,
    loaderNote:
      "Round 10 records the libyaml value; this is the OPPOSITE direction to a silent no-grant and is recorded as a divergence, never counted as a bypass.",
  },
  {
    id: "r10-wr02-folded-blank-line",
    round: 10,
    finding: "WR-02",
    source: R10,
    sourceDetail: "§ WR-02, the folded blank-line axis",
    kind: "divergence",
    reproducedAt: "module",
    label:
      "a folded scalar's blank line, dropped and space-joined, made the old module INVENT an enumerated name",
    transcription: "verbatim",
    text: doc(["name: r", "tools: >", "  Agent(alpha, ga", "", "  mma)"]),
    expected: "block-scalar",
    loaderVerdict: `"Agent(alpha, ga\\nmma)\\n"`,
    loaderNote:
      "Round 10 records the libyaml value; the module enumerated [\"alpha\",\"ga mma\"], one of them invented.",
  },

  // ── ROUND 11 — 27-REVIEW.md ───────────────────────────────────────────────────────────────────
  //
  // The four documents D-64 names by hand, their gate-reproduction spellings, and the loader-REJECTED
  // half of CR-02's asymmetry. Rows A and B of CR-01 are the confirmed regression against `3c7930b`.
  {
    id: "r11-cr01-a-explicit-digit",
    round: 11,
    finding: "CR-01 row A",
    source: R11,
    sourceDetail:
      "§ CR-01 Row A — the round-11 regression, confirmed against the pre-round build 3c7930b",
    kind: "bypass",
    reproducedAt: "module+gate",
    label:
      "an explicit-digit folded block header on its own line under a bare dash — the block indentation landmark is the header LINE, not the parent node",
    transcription: "verbatim",
    text: doc([
      "name: r",
      "tools:",
      "  -",
      "    >-2",
      "      Read,",
      `     # x, ${GRANT}`,
    ]),
    expected: "block-scalar",
    loaderVerdict: `["  Read,\\n # x, Agent(grugops-orchestrator)"]`,
    loaderNote:
      "Round 11 records the /usr/bin/ruby -ryaml column: the grant is in the loaded value. HEAD returned {ok:true,value:false}; 3c7930b returned the grant.",
  },
  {
    id: "r11-cr01-b-no-digit",
    round: 11,
    finding: "CR-01 row B",
    source: R11,
    sourceDetail: "§ CR-01 Row B — no digit required; the auto-detection FLOOR is the same wrong number",
    kind: "bypass",
    reproducedAt: "module+gate",
    label: "the same position with no explicit indentation indicator",
    transcription: "verbatim",
    text: doc(["name: r", "tools:", "  -", "    >-", "   Read,", `   # x, ${GRANT}`]),
    expected: "block-scalar",
    loaderVerdict: `["Read, # x, Agent(grugops-orchestrator)"]`,
    loaderNote:
      "Round 11 loader column for row B. Row B is pre-existing rather than a regression, and survives the round-11 fix at both `>-` and `|-`.",
  },
  {
    id: "r11-cr01-gate-a",
    round: 11,
    finding: "CR-01 row A (gate reproduction)",
    source: R11,
    sourceDetail:
      "§ CR-01 `Gate reproduction, row A` — planted into the EXISTING allowed-tools key of both twins of the map skill; HEAD exit 0, 3c7930b exit 1",
    kind: "bypass",
    reproducedAt: "gate",
    label:
      "row A's construct in the exact bytes planted into a live allowed-tools key — the spelling plan 27-65 plants",
    transcription: "verbatim",
    text: doc([
      "name: r",
      "allowed-tools:",
      "  -",
      "    >-2",
      "      Read, Write, Bash, Glob, Grep,",
      `     # x, ${GRANT}`,
    ]),
    expected: "block-scalar",
    loaderVerdict: `["  Read, Write, Bash, Glob, Grep,\\n # x, Agent(grugops-orchestrator)"]`,
    loaderNote: "Round 11 records the libyaml reading of the planted allowed-tools key.",
  },
  {
    id: "r11-cr01-gate-b",
    round: 11,
    finding: "CR-01 row B (gate reproduction)",
    source: R11,
    sourceDetail:
      "§ CR-01 Row B — `the same shape planted on the same two twins` → ALL CHECKS PASSED, exit 0",
    kind: "bypass",
    reproducedAt: "gate",
    label: "row B's construct planted into a live allowed-tools key",
    transcription: "framed",
    text: doc([
      "name: r",
      "allowed-tools:",
      "  -",
      "    >-",
      "   Read, Write, Bash, Glob, Grep,",
      `   # x, ${GRANT}`,
    ]),
    expected: "block-scalar",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: round 11 records the gate exit code for row B's plant but prints no separate libyaml transcript for the planted spelling; row B's own loader value is recorded at the parser level instead.",
  },
  {
    id: "r11-cr02-alias-through-compact-mapping",
    round: 11,
    finding: "CR-02",
    source: R11,
    sourceDetail:
      "§ CR-02 Row — a resolvable alias reaching a grant through a sequence item's compact mapping; the loader ACCEPTS this document",
    kind: "bypass",
    reproducedAt: "module+gate",
    label:
      "D-61's fourth application point was wired into one of the two blockHeaderAt call sites",
    transcription: "verbatim",
    text: doc([
      "name: r",
      "_x:",
      `  - k: &a ${GRANT}`,
      "allowed-tools:",
      "  - j: *a",
    ]),
    expected: "node-property",
    loaderVerdict: `"allowed-tools"=>[{"j"=>"Agent(grugops-orchestrator)"}]`,
    loaderNote:
      "Round 11 records the /usr/bin/ruby -ryaml column. The review also records `UNKNOWN - verify` on whether Claude Code honours a MAPPING under allowed-tools as a grant; the finding stands on the module's own contract.",
  },
  {
    id: "r11-cr02-dashless-control",
    round: 11,
    finding: "CR-02 control",
    source: R11,
    sourceDetail:
      "§ CR-02 — `the identical alias one spelling over (`  j: *a`, no dash)`, REFUSED by name on the old module",
    kind: "control",
    reproducedAt: "module",
    label:
      "the same alias, the same key, the same loader value — refused loudly one dash over, which is the proof this was the call-site set and not the sigil test",
    transcription: "verbatim",
    text: doc(["name: r", "_x:", `  - k: &a ${GRANT}`, "allowed-tools:", "  j: *a"]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: round 11 records the control's MODULE verdict (a loud refusal, naming a YAML anchor or alias) and does not print a separate libyaml column for it.",
  },
  {
    id: "r11-cr02-gate",
    round: 11,
    finding: "CR-02 (gate reproduction)",
    source: R11,
    sourceDetail:
      "§ CR-02 `Gate reproduction` — planted on both twins of the non-coordinator map skill, ALL CHECKS PASSED at exit 0",
    kind: "bypass",
    reproducedAt: "gate",
    label:
      "the alias planted behind the kit's five baseline tools in a live allowed-tools key — the spelling plan 27-65 plants",
    transcription: "verbatim",
    text: doc([
      "name: r",
      "_x:",
      `  - k: &a ${GRANT}`,
      "allowed-tools:",
      "  - Read",
      "  - Write",
      "  - Bash",
      "  - Glob",
      "  - Grep",
      "  - j: *a",
    ]),
    expected: "node-property",
    loaderVerdict: `["Read", "Write", "Bash", "Glob", "Grep", {"j"=>"Agent(grugops-orchestrator)"}]`,
    loaderNote: "Round 11 records the libyaml reading of the planted allowed-tools key.",
  },
  {
    id: "r11-cr02-t3-loader-rejected",
    round: 11,
    finding: "CR-02 row T3",
    source: R11,
    sourceDetail:
      "§ CR-02 — the loader-REJECTED half of the same gap, whose dash-less twin refuses loudly (27-57-SUMMARY row T3)",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "an alias in front of a block header inside a sequence item's compact mapping — a document libyaml refuses to load, returned on the SUCCESS arm",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  - k: *a >-"]),
    expected: "node-property",
    loaderVerdict: "REJECTED by libyaml",
    loaderNote:
      "Round 11 states this half is on documents `libyaml refuses to load`. A loader rejection is still not a clean verdict: the module returned {ok:true,value:false}.",
  },
  {
    id: "r11-cr02-r-loader-rejected",
    round: 11,
    finding: "CR-02 row R",
    source: R11,
    sourceDetail:
      "§ CR-02 — the second loader-REJECTED spelling, two stacked anchors (27-57-SUMMARY row R)",
    kind: "bypass",
    reproducedAt: "module",
    label: "two stacked anchors in front of a block header in the same position",
    transcription: "framed",
    text: doc(["name: r", "tools:", "  - k: &a &b >-"]),
    expected: "node-property",
    loaderVerdict: "REJECTED by libyaml",
    loaderNote: "As above; round 11 groups T3 and R under the same asymmetry.",
  },

  // ── THE LOADER-ADJUDICATED AXIS TABLES — scripts/frontmatter.test.ts ──────────────────────────
  //
  // The densest source, and the one already adjudicated against a real loader when it was written.
  // Their document text is copied here as data; this module never imports from a test file. Each
  // row's `round` comes from the axis's own recorded attribution in its section comment.
  {
    id: "ax-ref-keyline",
    round: 1,
    finding: "REFUSED_FORMS / the CR-01 reproduction",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS — `alias in the value position, anchor parked under a second key`, KEY-LINE application point",
    kind: "bypass",
    reproducedAt: "module",
    label: "the reference axis at the KEY-LINE application point",
    transcription: "framed",
    text: doc([
      "name: r",
      `_tools: &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "tools: *t",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: this axis row's serializer is asserted against the module's refusal arm; the axis records no per-row loader transcript (the loader columns in that file live on the WR01_FALSE_RED_FORMS rows and the differential).",
  },
  {
    id: "ax-ref-own-value",
    round: 1,
    finding: "REFUSED_FORMS / anchor on the tools key's own value",
    source: AXIS,
    sourceDetail: "REFUSED_FORMS — `anchor directly on the tools key's own value`",
    kind: "bypass",
    reproducedAt: "module",
    label: "an anchor directly on the grant key's own value",
    transcription: "framed",
    text: doc(["name: r", `tools: &t Read, Write, Bash, Glob, Grep, ${GRANT}`]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; no per-row loader transcript on this axis.",
  },
  {
    id: "ax-ref-flow-item",
    round: 1,
    finding: "REFUSED_FORMS / flow-sequence items",
    source: AXIS,
    sourceDetail: "REFUSED_FORMS — `anchor and alias as flow-sequence items`, FLOW-ITEM node start",
    kind: "bypass",
    reproducedAt: "module",
    label: "the anchor and the alias as items of a flow sequence",
    transcription: "framed",
    text: doc(["name: r", "tools: [&t Read, *t]"]),
    expected: "flow-collection",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; no per-row loader transcript on this axis.",
  },
  {
    id: "ax-ref-seq-item",
    round: 1,
    finding: "REFUSED_FORMS / block-sequence items",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS — `anchor and alias as block-sequence items on continuation lines`, SEQ_ITEM application point",
    kind: "bypass",
    reproducedAt: "module",
    label: "the anchor and the alias as block-sequence items",
    transcription: "framed",
    text: doc([
      "name: r",
      "tools:",
      `  - &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "  - *t",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above; no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-keyline",
    round: 2,
    finding: "TAG axis / KEY-LINE (the CR-01 round-2 reproduction)",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — double-indicator shorthand tag in front of the anchor, tagged flow alias on the tools key",
    kind: "bypass",
    reproducedAt: "module",
    label: "the tag axis at the KEY-LINE application point",
    transcription: "framed",
    text: doc([
      "name: r",
      `_tools: !!str &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "tools: !!seq [*t]",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-own-value",
    round: 2,
    finding: "TAG axis / KEY-LINE, no reference at all",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — `a tag standing directly on the tools key's own value`",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "an unresolved node property is enough on its own — no anchor, no alias, just a tag on the grant key",
    transcription: "framed",
    text: doc(["name: r", `tools: !!str Read, Write, Bash, Glob, Grep, ${GRANT}`]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-flow-item",
    round: 2,
    finding: "TAG axis / FLOW-ITEM",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — `a TAGGED flow collection whose items carry the anchor and the alias`",
    kind: "bypass",
    reproducedAt: "module",
    label: "a tagged flow collection, so the value no longer OPENS with a flow indicator",
    transcription: "framed",
    text: doc(["name: r", "tools: !!seq [&t Read, *t]"]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-seq-item",
    round: 2,
    finding: "TAG axis / SEQ_ITEM",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — `tagged anchor and alias as block-sequence items on continuation lines`",
    kind: "bypass",
    reproducedAt: "module",
    label: "each block-sequence item is its own node and carries its own tag",
    transcription: "framed",
    text: doc([
      "name: r",
      "tools:",
      `  - !!str &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "  - !!str *t",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-local",
    round: 2,
    finding: "TAG shape / single-indicator LOCAL tag",
    source: AXIS,
    sourceDetail: "REFUSED_FORMS, TAG axis — `a single-indicator LOCAL tag`",
    kind: "bypass",
    reproducedAt: "module",
    label: "one `!` and an ordinary name — no second indicator to key on",
    transcription: "framed",
    text: doc([
      "name: r",
      `_tools: !grugops &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "tools: !grugops [*t]",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-named-handle",
    round: 2,
    finding: "TAG shape / NAMED-HANDLE tag",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — `a NAMED-HANDLE tag carrying a second indicator inside the tag`",
    kind: "bypass",
    reproducedAt: "module",
    label: "a second `!` INSIDE the tag token, which a strip stopping at it would leave behind",
    transcription: "framed",
    text: doc([
      "name: r",
      `_tools: !e!scalar &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "tools: !e!seq [*t]",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-verbatim",
    round: 2,
    finding: "TAG shape / VERBATIM tag",
    source: AXIS,
    sourceDetail: "REFUSED_FORMS, TAG axis — `a VERBATIM tag delimited by angle brackets`",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "a verbatim tag may legally contain the flow indicators every other tag form terminates on",
    transcription: "framed",
    text: doc([
      "name: r",
      `_tools: !<tag:grugops.dev,2026:str> &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "tools: !<tag:grugops.dev,2026:seq> [*t]",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-bare",
    round: 2,
    finding: "TAG shape / BARE non-specific tag",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — `the BARE non-specific tag, whose second character is a space`",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "the sharpest row of that table: invisible to a sigil class alone, because its second byte is a space",
    transcription: "framed",
    text: doc([
      "name: r",
      `_tools: ! &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "tools: ! [*t]",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-adjacency",
    round: 2,
    finding: "TAG adjacency / no separating whitespace",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — `a shorthand tag butting directly against the collection`",
    kind: "bypass",
    reproducedAt: "module",
    label: "no whitespace at all between the tag and the collection it introduces",
    transcription: "framed",
    text: doc([
      "name: r",
      `_tools: !!str &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "tools: !!seq[*t]",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-then-anchor",
    round: 2,
    finding: "TAG adjacency / tag then ANCHOR then collection",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — `a tag followed by an ANCHOR which is itself followed by the collection`",
    kind: "bypass",
    reproducedAt: "module",
    label: "two node properties stacked in front of the node",
    transcription: "framed",
    text: doc([
      "name: r",
      `_tools: !!str &t Read, Write, Bash, Glob, Grep, ${GRANT}`,
      "tools: !!seq &a [*t]",
    ]),
    expected: "node-property",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-tag-nesting",
    round: 2,
    finding: "TAG nesting / bare tags on nodes INSIDE a flow collection",
    source: AXIS,
    sourceDetail:
      "REFUSED_FORMS, TAG axis — `BARE non-specific tags on nodes INSIDE a flow collection`",
    kind: "bypass",
    reproducedAt: "module",
    label: "the tag sits on nodes inside the collection rather than in front of it",
    transcription: "framed",
    text: doc(["name: r", "tools: [! &t Read, ! *t]"]),
    expected: "flow-collection",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: no per-row loader transcript on this axis.",
  },
  {
    id: "ax-esc-keyline",
    round: 3,
    finding: "ESCAPE axis / KEY-LINE (the CR-01 round-3 reproduction)",
    source: AXIS,
    sourceDetail:
      "ESCAPE_FORMS — `an escaped grant in the tools key's own double-quoted value`",
    kind: "bypass",
    reproducedAt: "module",
    label: "the escape axis at the KEY-LINE application point",
    transcription: "framed",
    text: doc(["name: r", `tools: "${BS}x41gent(grugops-orchestrator), Read, Grep"`]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: null,
    loaderNote:
      "UNKNOWN - verify: the escape axis was derived from round 3, whose review states no loader was executable in that environment.",
  },
  {
    id: "ax-esc-helper-key",
    round: 3,
    finding: "ESCAPE axis / KEY-LINE on a helper key",
    source: AXIS,
    sourceDetail:
      "ESCAPE_FORMS — `an escaped value under a helper key aliased nowhere (red for the escape, not for a reference)`",
    kind: "bypass",
    reproducedAt: "module",
    label: "the escape on a helper key, with a clean grant key beside it",
    transcription: "framed",
    text: doc([
      "name: r",
      `_helper: "${BS}x41gent(grugops-orchestrator)"`,
      "tools: Read, Grep",
    ]),
    expected: "unknown-key",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
  {
    id: "ax-esc-flow-item",
    round: 3,
    finding: "ESCAPE axis / FLOW-ITEM",
    source: AXIS,
    sourceDetail:
      "ESCAPE_FORMS — `an escaped grant as a quoted item inside a flow collection`; one of the two points the first draft of the D-30 fix missed",
    kind: "bypass",
    reproducedAt: "module",
    label: "the escape inside a quoted item of a flow collection",
    transcription: "framed",
    text: doc(["name: r", `tools: [Read, "${BS}x41gent(grugops-orchestrator)"]`]),
    expected: "flow-collection",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
  {
    id: "ax-esc-seq-item",
    round: 3,
    finding: "ESCAPE axis / SEQ_ITEM",
    source: AXIS,
    sourceDetail:
      "ESCAPE_FORMS — `an escaped grant as a quoted block-sequence item on a continuation line`; the shape the aggregator case plants",
    kind: "bypass",
    reproducedAt: "module",
    label: "the escape as a wholly-quoted block-sequence item",
    transcription: "framed",
    text: doc([
      "name: r",
      "tools:",
      "  - Read",
      `  - "${BS}x41gent(grugops-orchestrator)"`,
    ]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
  {
    id: "ax-esc-plain-continuation",
    round: 3,
    finding: "ESCAPE axis / PLAIN-CONTINUATION",
    source: AXIS,
    sourceDetail:
      "ESCAPE_FORMS — `an escaped quoted fragment arriving on a plain continuation line`; the second point the first draft missed",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "the escaped fragment arrives on the wrapped line, so the joined value is a composite no wrapping-quote strip matches",
    transcription: "framed",
    text: doc([
      "name: r",
      "tools: Read,",
      `  "${BS}x41gent(grugops-orchestrator)"`,
    ]),
    expected: "unrecognized-line",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
  {
    id: "ax-esc-u16",
    round: 3,
    finding: "ESCAPE spelling / 16-bit numeric",
    source: AXIS,
    sourceDetail: "ESCAPE_FORMS — the 16-bit numeric width, LEADING placement",
    kind: "bypass",
    reproducedAt: "module",
    label: "the same grant spelled with a 16-bit numeric escape",
    transcription: "framed",
    text: doc(["name: r", `tools: "${BS}u0041gent(grugops-orchestrator), Read"`]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
  {
    id: "ax-esc-u32",
    round: 3,
    finding: "ESCAPE spelling / 32-bit numeric",
    source: AXIS,
    sourceDetail: "ESCAPE_FORMS — the 32-bit numeric width, LEADING placement",
    kind: "bypass",
    reproducedAt: "module",
    label: "the same grant spelled with a 32-bit numeric escape",
    transcription: "framed",
    text: doc(["name: r", `tools: "${BS}U00000041gent(grugops-orchestrator), Read"`]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
  {
    id: "ax-esc-line-feed",
    round: 3,
    finding: "ESCAPE spelling / the line-feed escape",
    source: AXIS,
    sourceDetail:
      "ESCAPE_FORMS — `the line-feed escape, which the old rewrite turned into a literal n`",
    kind: "bypass",
    reproducedAt: "module",
    label: "a non-numeric escape the old rewrite also mangled",
    transcription: "framed",
    text: doc(["name: r", `tools: "Read, Grep,${BS}nAgent-free tail"`]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
  {
    id: "ax-esc-truncated",
    round: 3,
    finding: "ESCAPE precision / TRUNCATED numeric escape",
    source: AXIS,
    sourceDetail:
      "ESCAPE_FORMS — `a TRUNCATED numeric escape (one hex digit where two are required)`",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "a short numeric escape, which carries no special case because no hex-digit count is ever counted",
    transcription: "framed",
    text: doc(["name: r", `tools: "${BS}x4gent(grugops-orchestrator), Read"`]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
  {
    id: "ax-esc-dangling-backslash",
    round: 3,
    finding: "ESCAPE boundary / DANGLING backslash",
    source: AXIS,
    sourceDetail:
      "ESCAPE_FORMS — `a DANGLING backslash at the very end of the scalar body`, the bounds-check row",
    kind: "bypass",
    reproducedAt: "module",
    label:
      "a backslash as the last byte of the scalar body, where an unbounded scanner would read undefined",
    transcription: "framed",
    text: doc(["name: r", `tools: "Read, Grep${BS}"`]),
    expected: "quoted-on-plain-only-key",
    loaderVerdict: null,
    loaderNote: "UNKNOWN - verify: as above.",
  },
];

// ---------------------------------------------------------------------------
// Integrity, derivations and the provenance self-check
// ---------------------------------------------------------------------------

// THE ROW TOTAL, AND WHY IT IS ASSERTED HERE RATHER THAN ONLY IN THE TEST.
//
// A corpus that silently loses the shapes it exists to replay is worse than no corpus: the replay
// still prints a green line, over fewer rows. The count therefore lives in the same file as the data
// and is checked at module load, so the two cannot drift apart even for a reader who never runs the
// test. The replay asserts it a second time, and additionally asserts it exceeds the number of rounds
// so a one-row-per-round corpus cannot satisfy the completeness claim.
export const CORPUS_COUNT = 91;

if (CORPUS.length !== CORPUS_COUNT) {
  throw new Error(
    `canonical-corpus: CORPUS_COUNT is ${CORPUS_COUNT} and the corpus holds ${CORPUS.length} row(s). ` +
      "The count and the data are declared in one file precisely so this cannot be resolved by " +
      "changing whichever one is more convenient — establish which rows moved first.",
  );
}

// The rounds this corpus claims to cover, spelled once. The replay asserts coverage two-sided against
// this list: every member has at least one row, and every round appearing in the corpus is a member.
export const ROUNDS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Rows grouped by round, in ascending round order. Derived, never hand-kept.
export function rowsByRound(): Map<number, readonly CorpusRow[]> {
  const out = new Map<number, CorpusRow[]>();
  for (const row of CORPUS) {
    const list = out.get(row.round);
    if (list === undefined) out.set(row.round, [row]);
    else list.push(row);
  }
  return new Map([...out].sort((a, b) => a[0] - b[0]));
}

// One row by id, or `undefined`. Plan 27-65's gate proof plants rows BY ID, so this is the lookup
// that keeps the module-level replay and the gate-level replay talking about the same bytes.
export function rowById(id: string): CorpusRow | undefined {
  return CORPUS.find((r) => r.id === id);
}

// Every distinct source path the ROWS cite — derived from the data, not from `CITED_ARTIFACTS`, so a
// row citing an undeclared path is still checked.
export function citedSources(): readonly string[] {
  return [...new Set(CORPUS.map((r) => r.source))].sort();
}

// THE PROVENANCE SELF-CHECK. Given a repository root, return every cited source path that does not
// resolve on disk.
//
// IT SWALLOWS NOTHING. There is no try/catch and no default: a path either exists or it is returned.
// A row whose citation has been deleted or renamed is a row nobody can check against its record, and
// the replay fails on a non-empty return.
export function unresolvedSources(root: string): readonly string[] {
  return citedSources().filter((rel) => !existsSync(join(root, rel)));
}
