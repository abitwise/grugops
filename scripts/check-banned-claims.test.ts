// check-banned-claims.test.ts — the hermetic harness for the LANG-04 banned-claim gate.
//
// WHAT THIS FILE IS FOR, STATED PLAINLY, AND WHY IT IS THE DURABLE HALF OF D-44.
//
// scripts/check-banned-claims.js was watched failing on a real claim in a real file: three findings
// over 82 documents at the commit that introduced it, exit 0 at the next commit, with the gate
// byte-unchanged across the transition. That transcript is the acceptance evidence, and it expires.
// The tree can never again contain the claim — the whole point of the gate is that it cannot — so
// after that one commit the RED has no live reproduction anywhere. Without the PLANTED fixture
// below, this gate's only evidence would be a historical commit nobody re-runs.
//
// A RED verdict also proves nothing on its own: a gate that ALWAYS fails is trivially red. These
// cases are what turn the verdict into a MEASUREMENT — the same committed .js exits 0 on a clean
// mirror, exits 1 on each planted shape, and honours its one named exemption REGION-SCOPED rather
// than file-scoped.
//
// The terminal project lesson (memory: grugops-safety-invariant-green-suite-insufficient) is that a
// green unit suite is NOT proof for a safety/trace guard; the acceptable proof is an adversarial
// RED-vs-committed-.js reproduction. So every behavioural case here drives the COMMITTED .js via
// spawnSync against a hermetic CHECK_ROOT mirror under the OS temp dir — never the .ts, and never
// the real tree. Nothing is ever written into the committed tree.
//
// EVERY PLANT IS BUILT BY INTERPOLATING FROM BANNED_CLAIM_LITERALS. A retyped literal here would be
// a second copy of the list living in the file that polices it — the set-literal drift this
// repository has diagnosed as one of its two systemic failure classes, landing inside the test that
// exists to prevent it.
//
// WHY THE MIRRORS ARE SYNTHESIZED RATHER THAN COPIED. The same argument
// check-public-docs-vocabulary.test.ts records: a byte-faithful copy of the real kit is the
// baseline only while the real kit is clean, and the whole subject of this gate is text that must
// not appear. The builder synthesizes a document set with the SHAPE the derivation expects and
// derives its own filler count from the gate's exported pin, so a mirror that drifts out of shape
// fails the pin case rather than silently testing something else.
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane; this is a
// hermetic temp-dir test). Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/check-banned-claims.test.ts
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
// `execFileSync` (round 6, WR-02) enumerates TRACKED markdown for the exclusion-completeness case.
// execFile and not exec: no shell is involved, so the glob is passed to git as one argv element and
// there is no shell expansion to reason about.
import { spawnSync, execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
  readdirSync,
  copyFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// The ONE fence toggle. The WR-06 premise case below asks the live exemption document the same
// question the gate now asks it, through the same authority — never a second recogniser typed here.
import {
  fencedLineFlags,
  unfencedHeadingIndex,
  sectionEndIndex,
} from "./frontmatter.js";
// (Plan 29-52, D-54) The expected side of the composition case is assembled from the REGISTRY and
// the anchored-block AUTHORITY — a route that shares no statement with the run's own loop. The case
// it replaces folded the same counter over the same range the loop walks, so both sides moved
// together and the equality could not fail.
import {
  readRegistry,
  scanAnchoredDocument,
  anchoredBlockAt,
} from "./audit-model.js";
import {
  BANNED_CLAIM_LITERALS,
  BANNED_CLAIM_SCAN_COUNT,
  BANNED_CLAIM_SCAN_PARTS,
  BANNED_CLAIM_EXEMPT_REGION,
  BANNED_CLAIM_EXCLUDED,
  BANNED_CLAIM_EXCLUDED_LOCATIONS,
  bannedClaimExcluded,
  bannedClaimExcludedBy,
  bannedClaimExcludedSegments,
  bannedClaimExcludedRootDirs,
  bannedClaimExcludedExactPaths,
  bannedClaimScan,
  bannedClaimScanOverlap,
  locateExemptRegion,
  // (Plan 29-23, WR-02) The exemption's REACH: the counter that measures it and the constant that
  // pins it. In the RED commit these two were read through a NAMESPACE binding instead, because a
  // named import of a missing export is a MODULE-LOAD error in ESM and would have reddened every
  // other case in this file, hiding the one transcript the RED step exists to produce. They are
  // named imports now that they exist, so deleting either fails loudly rather than as `undefined`.
  BANNED_CLAIM_EXEMPT_SUPPRESSED,
  // (Plan 29-32, variant C1) The exemption's EXTENT — how far the region reaches, in lines. A
  // second published number beside the reach, answering a question the reach cannot: a section
  // swallowed into the exemption carrying NO banned claim moves this and nothing else.
  BANNED_CLAIM_EXEMPT_EXTENT,
  // (Plan 29-52, D-54) The CONTENT bound on the one carve-out: how many registry-anchored blocks
  // sit inside the region, and the per-group composition of the total it suppresses.
  BANNED_CLAIM_EXEMPT_ANCHORS,
  BANNED_CLAIM_EXEMPT_COMPOSITION,
  countBannedClaimOccurrences,
  // (Round 6, plan 29-45 — WR-01) The per-group projection of the same measurement, and the named
  // value a `hits` field carries when the candidate was refused without a scan (IN-01).
  bannedClaimGroupTally,
  BANNED_CLAIM_UNMEASURED,
} from "./check-banned-claims.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-banned-claims.js");
const GATE_TS = join(ROOT, "scripts", "check-banned-claims.ts");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ── The plants, taken from the authority ─────────────────────────────────────────────────────
//
// Selected BY PROPERTY rather than by index or by name, so a reordering of the list cannot silently
// turn a plant into a different literal, and a retyped string never enters this file.
//
// (PLAN 29-42, TASK 1) AND EVERY SELECTION IS NOW IDENTITY-ASSERTED, WHICH THE PROPERTY ALONE DOES
// NOT GIVE. `find` returns the FIRST match, so a selector whose predicate admits more than one member
// silently picks a different literal the day a member is declared above the one it meant. Two of the
// four selectors here were exactly that shape, and plan 29-41 had already walked into both:
//
//   * One selector distinguished the discipline's name from the product-name spellings by the
//     presence of a marker field. That predicate matched exactly one member when it was written and
//     matched THREE by round 5.
//   * `COMPREHENSION_CLAIM` selected on the group ALONE, which became true of the two bare terms as
//     well. Had a reorder put the bare term `comprehension` first, the comprehension plant would
//     have carried no marker, produced NO finding — and its case would still have PASSED, because
//     the gate's own banner line contains the word "comprehension" and the case asserts `toContain`.
//     A RED case going green while proving nothing, which is this repository's set-literal-drift
//     class arriving inside the assertions written to prevent it.
//
// (ROUND 6) AND THE PROPERTY THOSE SELECTORS USED IS GONE, SO THEY WERE RE-DERIVED RATHER THAN
// PATCHED. The marker field was removed from the member type, so "carries a marker list" is no
// longer a property anything can select on. Each selector below now names a property intrinsic to
// the LITERAL ITSELF — a digit for the published product-name spellings, a space for the enumerated
// comprehension phrasings — so it distinguishes its member from every sibling without depending on
// a matching mechanism that a later round may delete again. Every selection is pinned by an explicit
// expectation naming what it selected (see "the plant selection itself" below).
const UNCONDITIONAL_NAME = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "standard-name" && /\d/.test(l.literal),
);
/** The DISCIPLINE'S NAME: the one standard-name literal that carries no digit. */
const DISCIPLINE_NAME = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "standard-name" && !/\d/.test(l.literal),
);
const TOKEN_CLAIM = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "token-economy",
);
/** The ENUMERATED comprehension literal — a PHRASE, and the pre-fix grammar's whole subject. */
const COMPREHENSION_CLAIM = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "comprehension" && l.literal.includes(" "),
);

/**
 * The comprehension group's BARE TERMS — single words, as against the six enumerated phrasings.
 *
 * Two of them, because one member of the measured family carries no occurrence of the first term at
 * all and no predicate over that term can reach it. Held as a list rather than as two `find`s so the
 * count is a property of the authority and not of this file, and indexed only after the identity
 * case below has pinned what each index selected.
 */
const COMPREHENSION_TERMS = BANNED_CLAIM_LITERALS.filter(
  (l) => l.group === "comprehension" && !l.literal.includes(" "),
);
const BARE_COMPREHENSION = COMPREHENSION_TERMS[0];
const BARE_UNDERSTAND = COMPREHENSION_TERMS[1];

// Non-vacuity on the selection itself. A `find` that returned undefined would make every plant
// below the string "undefined", which no gate matches — and every RED case would pass as a GREEN.
if (
  UNCONDITIONAL_NAME === undefined ||
  DISCIPLINE_NAME === undefined ||
  TOKEN_CLAIM === undefined ||
  COMPREHENSION_CLAIM === undefined ||
  BARE_COMPREHENSION === undefined ||
  BARE_UNDERSTAND === undefined
) {
  throw new Error(
    "check-banned-claims.test.ts: one of the six plant literals could not be selected from " +
      "BANNED_CLAIM_LITERALS. Every plant below would be the string 'undefined', which matches " +
      "nothing — the RED cases would pass as green while proving nothing at all.",
  );
}

/**
 * A conformance verb, as ORDINARY ENGLISH. It is no longer drawn from anything the gate declares.
 *
 * Round 6 deleted the conformance-verb list, so this word pins nothing and gates nothing: it is
 * prose in a plant sentence, exactly like `the grugops kit`. It is typed here rather than composed
 * because there is no longer an authority to compose it from — and that absence is the change.
 */
const CONFORMANCE_VERB = "conform";

/**
 * THE SEVEN BENEFIT VERBS ROUND 5 ADMITTED AS A MARKER LIST — KEPT HERE AS A HISTORICAL FIXTURE.
 *
 * NOT AN AUTHORITY, NOT A PREDICATE, AND NOT IMPORTED FROM ONE. Round 6 deleted the list from the
 * gate (D-48/D-53): every axis a bare term can be paired against is an open class, so the gate now
 * enumerates only WHAT IS BANNED. This array survives for exactly one reason — the per-marker
 * discrimination cases below were written against it, and deleting a case without a record is
 * indistinguishable from a case that was never written. Those cases are now VACUOUS in the precise
 * sense that they pass because the bare term alone reds; they are listed by name in 29-44-SUMMARY.md
 * and plan 29-45 owns their repurposing.
 *
 * A LATER READER MUST NOT PROMOTE THIS BACK INTO THE GATE. Reintroducing a marker list is a visible
 * TYPE CHANGE now, refused at `BannedClaimLiteral` by the compiler and — on the route the compiler
 * does not cover, where the field is added back to the interface itself — by the named tripwire case
 * `no member carries a marker-shaped field, under ANY name`.
 *
 * (ROUND 6, PLAN 29-45) THE REPURPOSING IS DONE. The seven per-marker discrimination cases written
 * against this array are gone; what this array now serves is the INERTNESS case, which asserts the
 * seven words change the gate's count by ZERO. That is the property that is true after the deletion,
 * and it reds if a co-occurrence mechanism ever comes back.
 */
const HISTORICAL_BENEFIT_WORDS: readonly string[] = [
  "improve",
  "better",
  "easier",
  "boost",
  "help",
  "benefit",
  "enhance",
];

// The three the measured family's plants interpose, by index, pinned by identity below.
const MARKER_IMPROVE = HISTORICAL_BENEFIT_WORDS[0];
const MARKER_EASIER = HISTORICAL_BENEFIT_WORDS[2];
const MARKER_BOOST = HISTORICAL_BENEFIT_WORDS[3];

/**
 * THE PRE-FIX GRAMMAR, RECONSTRUCTED AS A FIXTURE-ONLY SHAPE. NOT A LIVE PREDICATE, EVER.
 *
 * WHY THIS EXISTS AT ALL. Without it every family case below is DECORATION. A case that passes
 * against the shipped build and would also have passed against the build before the fix proves
 * nothing about the fix, and reads to the next reader as proof that a bypass is closed. The evidence
 * is the DISAGREEMENT between the two builds on one planted line, which is why both verdicts are
 * asserted per family member rather than only the shipped one.
 *
 * WHAT THE PRE-FIX SHAPE WAS: the comprehension group's enumerated substrings, matched
 * case-insensitively, with no co-occurrence condition. That is exactly the set of MULTI-WORD
 * comprehension members, so it is DERIVED from the authority rather than retyped — six strings
 * retyped here would be the second copy of the list this whole file exists to refuse. (Round 6: the
 * selection used to key on the absence of a marker field, which no longer exists; the phrase-vs-bare
 * distinction is intrinsic to the literals and survives the deletion.) The derivation has a second, better property: if a later editor takes the rejected
 * option (b) and APPENDS a phrasing to the group, that phrasing enters this historical shape too, the
 * historical verdict on the family row it closes flips, and the recorded-verdict case below reds by
 * name. The refusal in `BANNED_CLAIM_EXCLUDED` is therefore held by an assertion and not only by a
 * paragraph.
 */
const HISTORICAL_ENUMERATED_COMPREHENSION: readonly string[] =
  BANNED_CLAIM_LITERALS.filter(
    (l) => l.group === "comprehension" && l.literal.includes(" "),
  ).map((l) => l.literal);

/** The PRE-FIX verdict on one line. Substring, case-insensitive, no co-occurrence — the old grammar. */
function historicallyNamed(line: string): boolean {
  const lower = line.toLowerCase();
  return HISTORICAL_ENUMERATED_COMPREHENSION.some((l) =>
    lower.includes(l.toLowerCase()),
  );
}

/** The exact shape of the D-44 draft claim: the name, with a conformance verb beside it. */
const NAME_PLANT = `The grugops kit ${CONFORMANCE_VERB}s to ${UNCONDITIONAL_NAME.literal}.`;
/** Two banned literals adjacent on ONE line — the adjacency case. */
const ADJACENT_PLANT = `The kit ${CONFORMANCE_VERB}s to ${UNCONDITIONAL_NAME.literal} ${DISCIPLINE_NAME.literal}.`;
/**
 * The discipline's bare name with NO conformance verb.
 *
 * This used to be the conditional arm's GREEN control — the sentence that proved the gate had not
 * banned the topic. Round 6 made the member unconditional, so the same sentence is now a FINDING,
 * and the case below asserts that instead. The carve-out moved from lexical to POSITIONAL: what
 * proves the topic is still writable is the inside-the-region control, not this line.
 */
const BARE_NAME_PLANT = `Writers of ${DISCIPLINE_NAME.literal} choose one word per meaning.`;
const TOKEN_PLANT = `The voice is a ${TOKEN_CLAIM.literal} applied to memory.`;
const COMPREHENSION_PLANT = `The profile ${COMPREHENSION_CLAIM.literal} for the model.`;

// ── The measured family (plan 29-42, task 1) ──────────────────────────────────────────────────
//
// THE SIX PHRASINGS ENUMERATED IN `29-UAT.md` § G-29-2 root_cause, one permanent case each.
//
// Every plant is COMPOSED from a pinned member and a pinned marker. The only typed words are the
// interposed ones — `LLM`, `model`, `agent`, `for language models` — which are precisely the words
// that are NOT in any pinned list and are the whole reason the enumeration failed. A retyped
// `improves LLM comprehension` here would stop testing the member it names the day that member is
// renamed, and this file's header already says so.
//
// `historicallyOpen` IS THE 29-41 BASELINE, CARRIED AS DATA AND ASSERTED, NOT AS A REMEMBERED CLAIM.
// It records what the PRE-FIX grammar did to that exact line: five of the six were open (the gate
// exited 0 with the planted file never named anywhere in its output) and one — the phrasing that IS
// an enumerated literal — was already caught. The case below asserts the reconstructed pre-fix shape
// reproduces that column exactly, in BOTH directions. Asserting merely "the control finds nothing"
// would have been a claim the measurement contradicts for row F1, and writing a fixture that agrees
// with a false claim is how six false results were produced in this phase across four rounds.
const FAMILY: readonly {
  readonly id: string;
  readonly plant: string;
  /** The literal the SHIPPED gate must name on this line. */
  readonly literal: string;
  /** Whether the PRE-FIX enumerated grammar named this line. Five of six: no. */
  readonly historicallyOpen: boolean;
}[] = [
  {
    id: "F1 the one phrasing the enumeration already held",
    plant: `The profile ${COMPREHENSION_CLAIM.literal} for the model.`,
    literal: COMPREHENSION_CLAIM.literal,
    historicallyOpen: false,
  },
  {
    id: "F2 one interposed word: LLM",
    plant: `The profile ${MARKER_IMPROVE}s LLM ${BARE_COMPREHENSION.literal}.`,
    literal: BARE_COMPREHENSION.literal,
    historicallyOpen: true,
  },
  {
    id: "F3 one interposed word: model",
    plant: `The profile ${MARKER_IMPROVE}s model ${BARE_COMPREHENSION.literal}.`,
    literal: BARE_COMPREHENSION.literal,
    historicallyOpen: true,
  },
  {
    id: "F4 one interposed word: agent",
    plant: `The profile ${MARKER_IMPROVE}s agent ${BARE_COMPREHENSION.literal}.`,
    literal: BARE_COMPREHENSION.literal,
    historicallyOpen: true,
  },
  {
    id: "F5 no occurrence of the first bare term at all",
    plant: `Controlled language makes prose ${MARKER_EASIER} for LLMs to ${BARE_UNDERSTAND.literal}.`,
    literal: BARE_UNDERSTAND.literal,
    historicallyOpen: true,
  },
  {
    id: "F6 the term first, the marker trailing",
    plant: `The profile ${MARKER_BOOST}s ${BARE_COMPREHENSION.literal} for language models.`,
    literal: BARE_COMPREHENSION.literal,
    historicallyOpen: true,
  },
];

/**
 * A plant carrying ONE benefit marker and the bare term, for the per-marker discrimination cases.
 *
 * Marker-agnostic on purpose: one template over all seven, so admitting an eighth marker gets a case
 * without anybody writing one. The template's own words are checked below to carry no marker and no
 * enumerated literal of their own, because a template that smuggled in a second marker would credit
 * a red to a marker that was not the one under test.
 */
function markerPlant(marker: string): string {
  return `The profile is a ${marker} to the ${BARE_COMPREHENSION.literal} of the model.`;
}

// ── TWO SOURCE-DERIVED DENOMINATORS RETIRED HERE (round 6) ────────────────────────────────────
//
// Both counted a construct the gate no longer declares — the member declarations that named a marker
// list, and the members of the benefit-verb list — by matching the source text independently of the
// array the cases walked. Re-measuring either to ZERO would leave a helper that can never disagree
// with anything while reading in CI as a live derivation, which is the vacuity shape at helper
// granularity. Deleted, with the property each held and its new home recorded in 29-44-SUMMARY.md.
// The independent-denominator DISCIPLINE they existed for is unaffected and is still applied by
// every other derived-count case in this file.

// ── The mirror ────────────────────────────────────────────────────────────────────────────────

const CLEAN = [
  "# A document",
  "",
  "The Orchestrator decomposes each request into subtasks and enqueues them over the shared queue.",
  "The shared verified context is the sole memory between roles.",
  "",
].join("\n");

const DEFAULT_ROOT_DOCS = [
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "README.md",
];
const DEFAULT_EXAMPLES = [
  "01-greenfield.md",
  "02-brownfield.md",
  "03-ticket.md",
  "04-sprint.md",
  "05-release.md",
];
const CHANGELOG = "CHANGELOG.md";
const KIT_README = "agent-factory/README.md";
const PROFILE = BANNED_CLAIM_EXEMPT_REGION.file;

// (Round 6, WR-02) The three classes admitted this round. Each is a SEPARATE derived part in the
// gate, so each needs members in the mirror or its per-part vacuity floor fires and every case in
// this file reds for a reason that has nothing to do with the case.
const INSTALL_README = "install/README.md";
const DEFAULT_SKILL_SOURCES = [
  "skills/alpha/SKILL.md",
  "skills/beta/SKILL.md",
];
const DEFAULT_CLAUDE_ADAPTERS = [
  ".claude/agents/grugops-alpha.md",
  ".claude/skills/grugops-alpha/SKILL.md",
];
// (Round 7, CR-02) The sixth part: the kit's SHIPPED JSON manifests. Written as JSON because the
// gate now parses each member for the canonical-form assertion, and a mirror carrying the markdown
// filler here would refuse for a parse reason that has nothing to do with the case.
const PLUGIN_MANIFESTS = [
  ".claude-plugin/marketplace.json",
  ".claude-plugin/plugin.json",
];
const CLEAN_MANIFEST = JSON.stringify(
  {
    name: "grugops",
    description: "the file-based agent factory for disciplined delivery.",
  },
  null,
  2,
);

/**
 * (Plan 29-23) One sentence carrying EXACTLY ONE banned-claim occurrence, used to fill a mirror's
 * exemption region up to the reach the gate pins. Deliberately NOT one of the plant constants above:
 * the region-scoped cases locate their plants with `indexOf`/`lastIndexOf` over the whole document,
 * and a filler reusing a plant's exact text would silently move those lookups onto a filler line.
 * Its occurrence count is not assumed — a case below derives it through the gate's own counter.
 */
const REACH_FILLER = `The profile makes no ${TOKEN_CLAIM.literal} claim of any kind.`;

// ── THE MIRROR'S CONTENT BOUND (plan 29-52, D-54) ─────────────────────────────────────────────
//
// WHY THE MIRROR GREW A CLAIM REGISTRY. D-54 conjoins the suppression with membership of a
// registry-anchored, byte-frozen block, so a mirror carrying an exemption region and NO registry
// exempts nothing — every one of this file's region-scoped cases would red for a reason that has
// nothing to do with the case. The harness's own recorded principle applies: a fixture that cannot
// express the live distribution cannot express the defect either.
//
// THE MIRROR'S REGISTRY IS DERIVED FROM THE DOCUMENT THE MIRROR ACTUALLY WRITES, so an ordinary
// fixture is frozen-consistent by construction and a case that wants a DIVERGENCE asks for it by
// name through `registryFrozenOn`. That parameter is the CR-01 reproduction's whole mechanism: the
// registry freezes the clean bytes, the document carries the substituted ones.
//
// THE BLOCK GRAMMAR THE MIRROR USES, stated once so `mirrorRegistry` and `profileDoc` cannot come
// to disagree: an anchor line is `<!-- claim: C-28-NNN -->`, and its block runs from the line below
// it up to — and not including — the next anchor, the next BLANK line, or end of file. `profileDoc`
// emits blocks that terminate that way on purpose.
// ── THE REGION'S FILL IS NOW PER GROUP (plan 29-52, D-54) ─────────────────────────────────────
//
// `BANNED_CLAIM_EXEMPT_COMPOSITION` pins the suppressed total's BREAKDOWN two-sided, so a mirror
// that reached the total with fourteen occurrences of ONE group would red on every case in this
// file. One single-occurrence filler per group, and the "single occurrence" half is ASSERTED rather
// than eyeballed: each filler is measured through the gate's own group tally at module load, so a
// filler that silently gained a second occurrence — the bare `comprehension` term is a substring of
// three enumerated ones — fails loudly here instead of shifting a distribution somewhere below.
const GROUP_FILLER: Readonly<Record<string, string>> = {
  "standard-name": `The profile denies conforming to ${DISCIPLINE_NAME.literal}.`,
  "token-economy": REACH_FILLER,
  comprehension: `The profile claims no ${BARE_COMPREHENSION.literal} win.`,
};
for (const [group, text] of Object.entries(GROUP_FILLER)) {
  const tally = bannedClaimGroupTally([text], 0, 1);
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  if (total !== 1 || tally[group] !== 1) {
    throw new Error(
      `check-banned-claims.test.ts: the \`${group}\` region filler carries ${total} occurrence(s) ` +
        `(${JSON.stringify(tally)}), expected exactly one and in its own group. Every per-group ` +
        `arithmetic in this file counts these one at a time.`,
    );
  }
}

const MIRROR_ANCHOR_RE = /^<!-- claim: (C-28-\d{3}) -->$/;
/** A line inside the region that carries no banned-claim occurrence. Pads the anchor count. */
const MIRROR_NEUTRAL = "The profile records what it measured and nothing more.";
/** The baseline row, so a registry always parses even for a mirror whose profile has no anchors. */
const MIRROR_BASELINE_ID = "C-28-900";
const MIRROR_BASELINE_VERBATIM = "A baseline claim outside the exemption document.";

function mirrorAnchorId(n: number): string {
  return `<!-- claim: C-28-${String(n).padStart(3, "0")} -->`;
}

/**
 * Synthesize the mirror's claim registry from a profile document, freezing every anchored block.
 *
 * THE ROWS ARE DERIVED FROM THE DOCUMENT'S OWN ANCHORS — never listed — for the same reason the
 * gate derives its exempt set: a hand-listed fixture registry would drift out of step with the
 * fixture document the first time either moved, which is the set-literal-drift class landing inside
 * the harness that polices it.
 */
function mirrorRegistry(profileText: string): string {
  const lines = profileText.split("\n");
  const rows: { id: string; verbatim: string }[] = [
    { id: MIRROR_BASELINE_ID, verbatim: MIRROR_BASELINE_VERBATIM },
  ];
  for (let i = 0; i < lines.length; i++) {
    const m = MIRROR_ANCHOR_RE.exec(lines[i]);
    if (m === null) continue;
    const block: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === "" || MIRROR_ANCHOR_RE.test(lines[j])) break;
      block.push(lines[j]);
    }
    if (block.length === 0) {
      throw new Error(
        `check-banned-claims.test.ts: the mirror's anchor ${m[1]} is followed by no block line. A ` +
          `registry row with a blank verbatim freezes nothing and readRegistry refuses it, so this ` +
          `fixture would red for a reason that has nothing to do with its case.`,
      );
    }
    if (block.some((l) => /^```/.test(l))) {
      throw new Error(
        `check-banned-claims.test.ts: the mirror's anchor ${m[1]} covers a fence delimiter line. ` +
          `The registry's own fence-parity refusal counts delimiters over the WHOLE file, so a ` +
          `verbatim carrying one makes the synthesized registry unparseable.`,
      );
    }
    rows.push({ id: m[1], verbatim: block.join("\n") });
  }
  const out = ["# The mirror's claim registry", ""];
  for (const r of rows) {
    out.push(
      `### ${r.id}`,
      "",
      `- file: ${r.id === MIRROR_BASELINE_ID ? "README.md" : PROFILE}`,
      "- line: 1",
      "- kind: architecture",
      "- depends_on: —",
      "- status: true",
      "- mechanism: synthesized by the hermetic harness; frozen against the mirror's own bytes.",
      "",
      "```",
      r.verbatim,
      "```",
      "",
    );
  }
  return out.join("\n");
}

/**
 * The profile document the mirror ships, with its exemption region.
 *
 * `regionBody` is what sits under the exempt heading; `preamble` is what sits ABOVE it, outside the
 * region. The two are separate parameters precisely so the region-scoped cases can put the SAME
 * sentence on each side of the heading and watch the gate discriminate.
 *
 * (Plan 29-23) THE REGION IS FILLED UP TO THE GATE'S DECLARED REACH, AND THE FILL IS DERIVED FROM
 * THE PIN RATHER THAN TYPED. `BANNED_CLAIM_EXEMPT_SUPPRESSED` is two-sided, so a mirror whose region
 * suppressed some other number would red every case in this file for a reason that had nothing to do
 * with the case. Whatever the caller's `regionBody` already carries is counted through the gate's
 * OWN matcher and subtracted, so a caller who plants a claim inside the region still lands on the
 * pin — and `reach` is available for the cases whose whole subject is missing it by one.
 */
function profileDoc(opts: {
  preamble?: string;
  regionBody?: string;
  headings?: number;
  trailingSection?: boolean;
  /** Occurrences to leave inside the region. Defaults to the gate's declared reach. */
  reach?: number;
  /**
   * (Plan 29-32) Lines to leave the region REACHING. Defaults to the gate's declared extent, so
   * every mirror in this file sits on the pin exactly as it already sits on the reach — and a case
   * whose whole subject is missing the extent by one asks for it explicitly.
   */
  extent?: number;
  /**
   * (Plan 29-52, D-54) Registry-anchored blocks to leave INSIDE the region. Defaults to the gate's
   * declared pin, so every mirror sits on it; a case whose whole subject is missing it asks
   * explicitly, and `0` is the empty-exempt-block-set construction.
   */
  anchors?: number;
} = {}): string {
  const heading = BANNED_CLAIM_EXEMPT_REGION.heading;
  const out = [
    "# grugops writing profile",
    "",
    "## The rules",
    "",
    opts.preamble ?? "Every rule carries a stable id.",
    "",
  ];
  const body = opts.regionBody ?? "This profile is an independent work.";
  const already = countBannedClaimOccurrences(
    body.split("\n"),
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const need = Math.max(
    0,
    (opts.reach ?? BANNED_CLAIM_EXEMPT_SUPPRESSED) - already,
  );
  // ── THE FILL, PROJECTED BY GROUP (plan 29-52, D-54) ──────────────────────────────────────────
  //
  // The composition pin is two-sided per group, so filling the region with fourteen occurrences of
  // one group would red every case here. The per-group deficit is the DECLARED count minus whatever
  // the caller's own body already carries, measured through the gate's own tally; a caller whose
  // body overshoots a group is a fixture that cannot sit on the pin and says so rather than
  // silently producing one.
  //
  // `reach` remains a TOTAL override. Its delta is spent on the token-economy group, which is what
  // `REACH_FILLER` has always been, so the reach-up and reach-down cases keep their exact meaning —
  // and they now trip the composition pin as well, which is honest: a region carrying one more
  // occurrence than declared carries it in some group.
  const alreadyByGroup = bannedClaimGroupTally(
    body.split("\n"),
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const reachDelta =
    (opts.reach ?? BANNED_CLAIM_EXEMPT_SUPPRESSED) -
    BANNED_CLAIM_EXEMPT_SUPPRESSED;
  const groupNeed = BANNED_CLAIM_EXEMPT_COMPOSITION.map((c) => ({
    group: c.group,
    n:
      c.count -
      (alreadyByGroup[c.group] ?? 0) +
      (c.group === "token-economy" ? reachDelta : 0),
  }));
  for (const g of groupNeed) {
    // `need === 0` is the deliberately EMPTY region: no fill at all, so a negative per-group
    // deficit there is arithmetic about a fill that never happens rather than a fixture defect.
    if (need > 0 && g.n < 0) {
      throw new Error(
        `check-banned-claims.test.ts: a fixture's region body already carries ` +
          `${alreadyByGroup[g.group] ?? 0} \`${g.group}\` occurrence(s), past the declared ` +
          `composition. Filling cannot remove one, so this mirror would sit off the composition ` +
          `pin and every case built on it would red for a reason that has nothing to do with it.`,
      );
    }
  }
  const count = opts.headings ?? 1;
  const targetExtent = opts.extent ?? BANNED_CLAIM_EXEMPT_EXTENT;
  // (Plan 29-52, D-54) The anchor id counter, running across the WHOLE document rather than per
  // region: `headings: 2` emits the block twice, and two anchors sharing one id makes the registry
  // refuse for a reason the duplicate-heading case is not about.
  let anchorSeq = 0;
  const anchorCount = opts.anchors ?? BANNED_CLAIM_EXEMPT_ANCHORS;
  for (let n = 0; n < count; n++) {
    // ── THE REGION'S OCCURRENCES ARE PUT INSIDE ANCHORED BLOCKS (plan 29-52, D-54) ───────────
    //
    // Under the conjunction an occurrence inside the region and outside every frozen block is a
    // FINDING, so a fixture that left one unanchored would red on every case built from it. Each
    // claim-bearing line of `body` gets its own one-line block; the reach fillers share one block;
    // and NEUTRAL blocks pad the count up to the gate's declared `BANNED_CLAIM_EXEMPT_ANCHORS`, so
    // every mirror sits on that pin exactly as it already sits on the reach and the extent.
    //
    // Each block is terminated by a BLANK LINE, which is the grammar `mirrorRegistry` reads back.
    const block = [heading, ""];
    let anchors = 0;
    for (const line of body.split("\n")) {
      if (countBannedClaimOccurrences([line], 0, 1) > 0) {
        block.push(mirrorAnchorId(++anchorSeq), line, "");
        anchors += 1;
      } else {
        block.push(line);
      }
    }
    block.push("");
    // One anchored block per group that still needs occurrences, filled with that group's own
    // single-occurrence filler. `need` is kept as the TOTAL guard: a caller that asked for zero
    // reach gets no filler block at all.
    if (need > 0) {
      for (const g of groupNeed) {
        if (g.n <= 0) continue;
        block.push(mirrorAnchorId(++anchorSeq));
        anchors += 1;
        for (let k = 0; k < g.n; k++) block.push(GROUP_FILLER[g.group]);
        block.push("");
      }
    }
    const padAnchors = anchorCount - anchors;
    if (padAnchors < 0) {
      throw new Error(
        `check-banned-claims.test.ts: a fixture's exemption region already needs ${anchors} ` +
          `anchored block(s), past the declared BANNED_CLAIM_EXEMPT_ANCHORS of ${anchorCount}. ` +
          `Padding cannot remove one, so this mirror would sit off the anchor pin and every case ` +
          `built on it would red for a reason that has nothing to do with the case.`,
      );
    }
    for (let k = 0; k < padAnchors; k++) {
      block.push(mirrorAnchorId(++anchorSeq), MIRROR_NEUTRAL, "");
    }
    // THE REGION IS PADDED TO THE GATE'S DECLARED EXTENT, AND THE PAD IS DERIVED FROM THE PIN
    // RATHER THAN TYPED — the same argument the `need` arithmetic above already makes for the
    // reach. Counted in LINES and not in array elements, because `body` may itself be multi-line
    // and an element count would silently under-pad every multi-line fixture in this file.
    const blockLines = block.join("\n").split("\n").length;
    const pad = targetExtent - blockLines;
    if (pad < 0) {
      throw new Error(
        `check-banned-claims.test.ts: a fixture's exemption region is already ${blockLines} line(s) ` +
          `long, past the declared extent of ${targetExtent}. Padding cannot shorten a region, so ` +
          `this mirror would sit off the gate's extent pin and every case built on it would red for ` +
          `a reason that has nothing to do with the case.`,
      );
    }
    for (let k = 0; k < pad; k++) block.push("");
    out.push(...block);
  }
  if (opts.trailingSection === true) {
    out.push("## After the region", "", "Text below the region is scanned again.", "");
  }
  return out.join("\n");
}

type MirrorSpec = {
  rootDocs?: string[];
  examples?: string[];
  /** Extra kit markdown files beyond README.md and the profile. Defaults to the derived filler set. */
  kitFillers?: string[];
  /** Options passed to profileDoc(). */
  profile?: Parameters<typeof profileDoc>[0];
  /** Omit the profile document entirely — the vanished-exemption-file case. */
  omitProfile?: boolean;
  /**
   * (Plan 29-52, D-54) Freeze the mirror's registry on THESE bytes rather than on the ones written.
   * The divergence knob, and the CR-01 reproduction's whole mechanism.
   */
  registryFrozenOn?: string;
  /** (Plan 29-52, D-54) Write no registry at all — the unreadable-content-bound case. */
  omitRegistry?: boolean;
  /** (Round 6) Omit install/README.md — the named-literal part's vanished-file case. */
  omitInstallReadme?: boolean;
  /**
   * (Round 7, WR-05) Omit agent-factory/README.md — the `kitReadme` part of the PUBLIC-DOCS corpus
   * derivation, which lives in the OTHER module. Its absence raises a refusal into
   * `check-public-docs-vocabulary.ts`'s own array at import time, which is the channel this gate
   * used to drop on the floor.
   */
  omitKitReadme?: boolean;
  /** (Round 6) Override the skills/ part's members. `[]` empties the part. */
  skillSources?: string[];
  /** (Round 6) Override the .claude/ part's members. `[]` empties the part. */
  claudeAdapters?: string[];
  /** (Round 7, CR-02) Override the .claude-plugin/ part's members. `[]` empties the part. */
  pluginManifests?: string[];
  /** Per-path content overrides, keyed by the same repo-relative path the gate reports. */
  plant?: Record<string, string>;
};

// The filler count is DERIVED FROM THE GATE'S OWN PIN, never typed. The union is
// (2 kit named + N fillers) + 10 public documents − 1 overlap, so N = COUNT − 11. A change to the
// pin moves this automatically, and a mirror that no longer reaches the pin fails the pin case
// rather than quietly testing a different corpus.
const KIT_NAMED = 2; // agent-factory/README.md + the profile
// The mirror's public-document CORPUS, DERIVED FROM WHAT makeMirror() ACTUALLY WRITES rather than
// typed. Round 6 (CR-01) moved this gate from `publicDocsScan()` to `publicDocsCorpus()`, so
// CHANGELOG.md — which makeMirror() has always written, and which this arithmetic silently omitted
// while the gate silently omitted it too — is now a member. A typed `10` here would have had to be
// remembered; the sum below cannot fall out of step with the mirror it describes.
const PUBLIC_DOCS =
  DEFAULT_ROOT_DOCS.length + // the non-exempt root markdown files
  1 + // CHANGELOG.md — in the corpus, exempt only from the VOCABULARY gate
  DEFAULT_EXAMPLES.length +
  1; // agent-factory/README.md, the kit README part
const INSTALL_README_COUNT = 1;
const SKILL_SOURCES = DEFAULT_SKILL_SOURCES.length;
const CLAUDE_ADAPTERS = DEFAULT_CLAUDE_ADAPTERS.length;
const PLUGIN_MANIFEST_COUNT = PLUGIN_MANIFESTS.length;
const OVERLAP = 1; // agent-factory/README.md is in both parts
const FILLER_COUNT =
  BANNED_CLAIM_SCAN_COUNT -
  (KIT_NAMED +
    PUBLIC_DOCS +
    INSTALL_README_COUNT +
    SKILL_SOURCES +
    CLAUDE_ADAPTERS +
    PLUGIN_MANIFEST_COUNT -
    OVERLAP);

function defaultFillers(): string[] {
  return Array.from(
    { length: FILLER_COUNT },
    (_, i) => `agent-factory/workflows/${String(i).padStart(3, "0")}-filler.md`,
  );
}

function makeMirror(prefix: string, spec: MirrorSpec = {}): string {
  const mirror = freshTmp(prefix);
  const rootDocs = spec.rootDocs ?? DEFAULT_ROOT_DOCS;
  const examples = spec.examples ?? DEFAULT_EXAMPLES;
  const fillers = spec.kitFillers ?? defaultFillers();
  const plant = spec.plant ?? {};

  const write = (rel: string, fallback: string = CLEAN): void => {
    const dst = join(mirror, rel);
    mkdirSync(join(dst, ".."), { recursive: true });
    writeFileSync(dst, plant[rel] ?? fallback, "utf8");
  };

  for (const f of rootDocs) write(f);
  write(CHANGELOG);
  mkdirSync(join(mirror, "examples"), { recursive: true });
  for (const f of examples) write(`examples/${f}`);
  // The kit. agent-factory/ always exists so the walk has a directory to reach; whether it derives
  // any markdown is what the vacuity case varies.
  mkdirSync(join(mirror, "agent-factory"), { recursive: true });
  if (spec.omitKitReadme !== true) write(KIT_README);
  if (spec.omitProfile !== true) write(PROFILE, profileDoc(spec.profile));
  // ── THE MIRROR'S CLAIM REGISTRY (plan 29-52, D-54) ──────────────────────────────────────────
  //
  // FROZEN ON THE BYTES THE MIRROR ACTUALLY WROTE, unless the case asks otherwise. `registryFrozenOn`
  // is what makes the CR-01 reproduction expressible at all: the registry holds the CLEAN sentence
  // and the document carries the SUBSTITUTED one, which is exactly the tree a reviewer would be
  // handed after somebody edited a denial and did not touch its row.
  //
  // docs/ is outside every part of this gate's scan set by BANNED_CLAIM_EXCLUDED_LOCATIONS, so
  // writing it moves no count in this file.
  if (spec.omitRegistry !== true) {
    const frozenOn =
      spec.registryFrozenOn ??
      (spec.omitProfile === true
        ? ""
        : (plant[PROFILE] ?? profileDoc(spec.profile)));
    write("docs/audit/28-claim-registry.md", mirrorRegistry(frozenOn));
  }
  for (const f of fillers) write(f);
  // (Round 6, WR-02) The three parts admitted this round. Each is written unless the caller is the
  // vacuity case that empties exactly that one, so every part's floor is reachable from here.
  if (spec.omitInstallReadme !== true) write(INSTALL_README);
  for (const f of spec.skillSources ?? DEFAULT_SKILL_SOURCES) write(f);
  for (const f of spec.claudeAdapters ?? DEFAULT_CLAUDE_ADAPTERS) write(f);
  // (Round 7, CR-02) The sixth part. `[]` empties it — and an EMPTY list leaves the DIRECTORY
  // absent too, which is the shape the gate's own named refusal is about.
  for (const f of spec.pluginManifests ?? PLUGIN_MANIFESTS)
    write(f, CLEAN_MANIFEST);
  return mirror;
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

/** How many individual findings the run reported. Arithmetic over the rendered lines. */
function findingCount(stdout: string): number {
  return (stdout.match(/— banned [a-z-]+ literal /g) ?? []).length;
}

// ── THE MARKER-FIELD TRIPWIRE (round 6, WR-06's disposition made visible) ──────────────────────
//
// WR-06 ASKED FOR A RUNTIME REFUSAL AND ROUND 6 SHIPS THIS INSTEAD, ON PURPOSE.
//
// The round-5 review asked that a member declaring an EMPTY marker list be refused inside the gate
// rather than only in this file. That was the right remedy for the tree as it then stood. D-53 then
// removed the marker field from `BannedClaimLiteral` entirely, so an empty-marker member is not a
// shape the type admits: a loop in `runAll()` guarding it could never fire, and a PASS line counting
// a check that cannot run is AP-1 — the very defect WR-06 was raised about, re-created by its own
// remedy. So the refusal is NOT shipped, WR-06 is DISCHARGED BY DELETING THE MECHANISM, and what
// stands in its place is this: a permanent, named case a reader scanning the reporter can see.
//
// WHAT THIS ASSERTION ADDS OVER `tsc`, STATED BECAUSE A DUPLICATE OF THE COMPILER WOULD BE
// DECORATION. `tsc` refuses a member that declares an EXCESS property — the old field name or any
// new one — and `noEmitOnError` is on, so that route cannot even build. It does NOT refuse the route
// a reintroduction would actually take: an editor who ADDS the field back to the `BannedClaimLiteral`
// interface and then declares it on a member is type-correct, and every compiler check stays green.
// This case reds on that route, because it reads the members' OWN KEYS rather than a spelling.
describe("check-banned-claims — no member carries a marker-shaped field, under ANY name", () => {
  it("TRIPWIRE: every pinned member's key set is exactly the two declared fields, and no value is a list", () => {
    // (1) THE DENOMINATOR, DERIVED INDEPENDENTLY OF THE LOOP THAT CONSUMES IT. A vacuity floor over
    // `BANNED_CLAIM_LITERALS.length` would be the loop's own count vouching for itself: an array
    // that emptied out would satisfy the key walk vacuously AND report a floor of its own emptiness.
    // The count below is matched out of the gate's SOURCE TEXT, so the two disagree the day the
    // array and its declarations part company.
    const declared = (
      readFileSync(GATE_TS, "utf8").match(/^ {2}\{ literal: "/gm) ?? []
    ).length;
    expect(declared, "no member declarations were matched in the gate source").toBeGreaterThan(0);
    expect(BANNED_CLAIM_LITERALS.length).toBe(declared);

    // (2) THE KEY SET, ASSERTED PER MEMBER. Reds on ANY third property whatever it is named — which
    // a grep for the retired spelling would miss entirely.
    for (const m of BANNED_CLAIM_LITERALS) {
      expect(
        Object.keys(m).sort(),
        `member ${JSON.stringify((m as { literal?: unknown }).literal)} carries a key beyond the two declared fields`,
      ).toEqual(["group", "literal"]);
    }

    // (3) AND THE SHAPE, NOT ONLY THE COUNT OF KEYS. A marker list is an ARRAY OF STRINGS hanging
    // off a member. Asserted separately from (2) so the property is stated as itself: if a later
    // round legitimately adds a third scalar field, (2) is the assertion an author must think about
    // and this one still refuses the list. Every value a member holds today is a plain string.
    const listValued = BANNED_CLAIM_LITERALS.flatMap((m) =>
      Object.entries(m)
        .filter(([, v]) => Array.isArray(v))
        .map(([k]) => k),
    );
    expect(
      listValued,
      "a member holds a LIST-valued field — that is the shape a marker list comes back as, and D-53 deleted it",
    ).toEqual([]);
  });
});

// ── The plant selection itself (plan 29-42, task 1) ───────────────────────────────────────────

describe("check-banned-claims — the plant selection itself", () => {
  it("every selector selected the literal its NAME says, so a declaration reorder reds HERE", () => {
    // The quiet half of this plan. Each expectation below names one literal, and that is the ONLY
    // place in this file where a member's text is typed rather than composed — as an EXPECTATION about
    // what was selected, never as a needle handed to the gate. A reorder of BANNED_CLAIM_LITERALS now
    // fails this case by name instead of defanging a plant three hundred lines away.
    expect(UNCONDITIONAL_NAME.literal).toBe("ASD-STE100");
    expect(DISCIPLINE_NAME.literal).toBe("Simplified Technical English");
    expect(TOKEN_CLAIM.literal).toBe("token economy");
    expect(COMPREHENSION_CLAIM.literal).toBe("improves comprehension");
    // The two bare terms, in declaration order.
    expect(COMPREHENSION_TERMS.map((t) => t.literal)).toEqual([
      "comprehension",
      "understand",
    ]);
    // (ROUND 6, WR-06) THE KEY-SET WALK THAT USED TO SIT HERE MOVED TO THE NAMED TRIPWIRE CASE
    // ABOVE, with an independently derived denominator and a list-shape assertion beside it. It is
    // not duplicated here: two assertions over one predicate, neither naming the other, is the
    // duplicate-authority shape this round is closing one module over.
    //
    // The words the family plants interpose. They pin nothing in the gate any more — see the
    // historical fixture's docblock — but a reorder of that fixture would still silently recompose
    // the plants, so the identities stay asserted.
    expect(CONFORMANCE_VERB).toBe("conform");
    expect(MARKER_IMPROVE).toBe("improve");
    expect(MARKER_EASIER).toBe("easier");
    expect(MARKER_BOOST).toBe("boost");
  });

  it("the historical-word plant TEMPLATE carries no benefit word and no enumerated literal of its own", () => {
    // REPURPOSED IN ROUND 6, AND THE OLD NAME SAID `marker`. It used to be the premise of seven
    // per-marker discrimination cases; those are gone (they asserted a mechanism the type no longer
    // admits). It survives because it is still the PREMISE of the inertness case below: if the
    // template itself carried one of the seven words, `markerPlant(w)` and `markerPlant("")` would
    // not differ in the way the inertness comparison assumes, and the comparison would be measuring
    // the template rather than the gate.
    const skeleton = markerPlant("");
    for (const m of HISTORICAL_BENEFIT_WORDS) {
      expect(skeleton.toLowerCase().includes(m.toLowerCase())).toBe(false);
    }
    expect(historicallyNamed(skeleton)).toBe(false);
  });

  it("PREMISE: this gate's source and this harness are both PRESENT and substantial — the greps have something to read", () => {
    // ── ONE AUTHORITY OWNS THE BYTE CLASS, AND THE BOUNDARY IS WRITTEN HERE RATHER THAN INFERRED ──
    //
    // THE OWNING GATE: `scripts/check-nul-bytes.ts`.
    // THE AXIS IT OWNS: whether any file carries a control byte outside TAB and LINE FEED. It decides
    //   that over EVERY path `git ls-files` reports — 1598 of them at the time of writing — with no
    //   exemption list and nothing filtered, which is a strict superset of the two files below.
    // THE AXIS THIS CASE ADDS: that those two files, BY NAME, exist and are substantial. The
    //   repo-wide gate floors the tracked SET against emptiness; it says nothing about any named
    //   member of it, so a gate source renamed or emptied would leave every acceptance grep in this
    //   file returning a confident zero and that gate would still be green.
    //
    // A CONTROL-BYTE LOOP OVER THESE TWO FILES USED TO SIT HERE (round 5, plan 29-42), added after a
    // NUL written into THIS file made two of that plan's own acceptance greps return a confident,
    // false 0. It is REMOVED. The repo-wide gate already decided the NUL half of that predicate over
    // the whole tree on the day the loop was written, and round 6 widened it to the whole class —
    // so the loop was a weaker duplicate of an existing authority, which is the shape this
    // repository closes by deletion or by a declared boundary. THE TRANSFERABLE LESSON IS NOT "WE
    // ADDED AN ASSERTION". It is: RUN THE REPO-WIDE GATE BEFORE BELIEVING A GREP.
    for (const p of [GATE_TS, join(ROOT, "scripts", "check-banned-claims.test.ts")]) {
      expect(existsSync(p), `${p} does not exist — every grep over it would read nothing`).toBe(
        true,
      );
      expect(readFileSync(p).length, `${p} is too small to be the artifact it names`).toBeGreaterThan(
        1000,
      );
    }
  });

  it("the reconstructed PRE-FIX grammar is the six enumerated literals, count pinned two-sided", () => {
    // Two-sided, and the reason is the rejected alternative rather than tidiness: option (b) —
    // appending a phrasing to the comprehension group — was measured and REFUSED, and it is refused
    // here by an assertion as well as by a paragraph in BANNED_CLAIM_EXCLUDED. Appending a phrasing
    // moves this count and reds. Deleting one of the six moves it the other way, which would be a
    // false green: three of the six carry no occurrence of either bare term, so the rule does not
    // subsume them, and they carry part of the exemption's suppressed arithmetic besides.
    expect(HISTORICAL_ENUMERATED_COMPREHENSION.length).toBe(6);
    // ...and it is exactly the multi-word members of the group, so a phrasing appended tomorrow
    // enters this historical shape too and the recorded-verdict rows below red by name.
    for (const l of BANNED_CLAIM_LITERALS.filter(
      (m) => m.group === "comprehension" && m.literal.includes(" "),
    )) {
      expect(HISTORICAL_ENUMERATED_COMPREHENSION).toContain(l.literal);
    }
  });
});

// ── The GREEN control ─────────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the clean mirror", () => {
  it("exits 0 with a measured PASS line naming the counts and the exemption region", () => {
    // THE LOAD-BEARING CASE. Without it the D-44 RED transcript proves nothing, because a gate that
    // always fails is trivially red. The exit code is asserted EXPLICITLY: spawnSync does not throw
    // on a non-zero exit, so a case that only checked stdout would pass against a gate that exits 1
    // every time.
    const { status, stdout } = runGate(makeMirror("gops-banned-clean-"));
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(stdout).toContain(`${BANNED_CLAIM_SCAN_COUNT} document(s)`);
    // The PASS line carries the measurement, the part breakdown and the exemption with its reason.
    expect(stdout).toContain(
      `0 findings over ${BANNED_CLAIM_SCAN_COUNT}/${BANNED_CLAIM_SCAN_COUNT} elements`,
    );
    expect(stdout).toContain(`${BANNED_CLAIM_LITERALS.length} pinned literal(s)`);
    expect(stdout).toContain(BANNED_CLAIM_EXEMPT_REGION.heading);
    expect(stdout).toContain(BANNED_CLAIM_EXEMPT_REGION.reason);
    expect(stdout).toContain(
      `${BANNED_CLAIM_EXCLUDED.length} candidate literal(s) refused at admission`,
    );
  });
});

// ── The planted claims: the durable half of D-44 ──────────────────────────────────────────────

describe("check-banned-claims — the planted claims", () => {
  it("D-44 DURABLE FIXTURE: names a kit file carrying the conformance claim OUTSIDE the region", () => {
    // This is the case that survives the tree going green forever. The claim is planted in a kit
    // document with no relationship to the exemption, and the gate must name the file, the line and
    // the literal.
    const planted = "agent-factory/workflows/000-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-planted-", { plant: { [planted]: NAME_PLANT } }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(/000-filler\.md:\d+:\d+/);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
    expect(stdout).toContain("Remedy: delete the claim");
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("names the claim planted in the profile's own PREAMBLE, above the exemption heading", () => {
    // The exemption is region-scoped, not file-scoped. A claim in the exempt FILE but outside the
    // exempt SECTION is still a finding — which is exactly the shape of the D-44 draft claim the
    // gate was landed against.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-preamble-", { profile: { preamble: NAME_PLANT } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(PROFILE);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
  });

  it("catches a token-economy claim and a comprehension claim in two different kit files", () => {
    // The three groups are asserted together, because a claim about one group says nothing about
    // the others: a gate that only ever ran group 1 would pass every case above.
    const a = "agent-factory/workflows/001-filler.md";
    const b = "agent-factory/workflows/002-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-groups-", {
        plant: { [a]: TOKEN_PLANT, [b]: COMPREHENSION_PLANT },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(TOKEN_CLAIM.literal);
    expect(stdout).toContain(COMPREHENSION_CLAIM.literal);
    // (Plan 29-42) DERIVED THROUGH THE GATE'S OWN MATCHER, NOT RE-PINNED FROM 2 TO 3.
    //
    // This assertion read `toBe(2)` and plan 29-41 turned it red at 3: the comprehension plant carries
    // the enumerated literal `improves comprehension` AND now also satisfies the bare-term rule on
    // marker `improve`, so one line yields two occurrences. That is the same correct doubling that
    // moved BANNED_CLAIM_EXEMPT_SUPPRESSED, and retyping 2 as 3 would go stale the next time a member
    // is admitted — the number is a function of how many literals happen to match one planted line.
    //
    // It is not circular. `countBannedClaimOccurrences` is the MATCHER; `findingCount` is arithmetic
    // over the RENDERED output. The equality holds one code path against the other, and the floor keeps
    // it from being satisfied by a matcher that returned zero for everything.
    const expected =
      countBannedClaimOccurrences([TOKEN_PLANT], 0, 1) +
      countBannedClaimOccurrences([COMPREHENSION_PLANT], 0, 1);
    expect(countBannedClaimOccurrences([TOKEN_PLANT], 0, 1)).toBeGreaterThanOrEqual(1);
    expect(countBannedClaimOccurrences([COMPREHENSION_PLANT], 0, 1)).toBeGreaterThanOrEqual(1);
    expect(findingCount(stdout)).toBe(expected);

    // ── THE SIBLING THAT PINS A NUMBER AGAIN (round 6, plan 29-45 — IN-03) ────────────────────────
    //
    // WHAT THE EQUALITY ABOVE STOPPED HOLDING, STATED AT THE ASSERTION RATHER THAN LEFT IMPLIED.
    // Deriving both sides is genuinely non-circular — one side is the matcher, the other is
    // arithmetic over the rendered output — and it genuinely no longer pins a VALUE. A matcher that
    // began over-matching moves BOTH sides together by the same amount, the equality still holds,
    // the floors of 1 still clear, and the case stays green while the gate reports more than it
    // should. Absorbing growth is exactly what a two-sided pin exists to refuse.
    //
    // SO BOTH ASSERTIONS ARE KEPT, BECAUSE THEY HOLD DIFFERENT THINGS. The derived equality holds
    // ONE CODE PATH AGAINST ANOTHER — it survives a literal being admitted tomorrow, which is why it
    // replaced a hard `toBe(2)` in the first place. The per-literal expectations below hold THE
    // MATCHER AGAINST A NUMBER, so growth in either plant is visible HERE instead of being shared
    // out across an equality. Neither is sufficient and the case needs both.
    //
    // The two numbers, with what each one is: the token plant carries its literal once and nothing
    // else; the comprehension plant carries the enumerated phrasing AND the bare term inside it, so
    // one line legitimately yields two occurrences. Moving either is a decision about the literal
    // list, never a way to clear this line.
    expect(
      countBannedClaimOccurrences([TOKEN_PLANT], 0, 1),
      "the token plant's own occurrence count moved — a literal was admitted, or the matcher began over-matching",
    ).toBe(1);
    expect(
      countBannedClaimOccurrences([COMPREHENSION_PLANT], 0, 1),
      "the comprehension plant's own occurrence count moved — a literal was admitted, or the matcher began over-matching",
    ).toBe(2);
    // ...and the sum of the per-literal expectations IS the derived expectation, so the two
    // assertions are shown to be about the same quantity rather than about two different ones.
    expect(expected).toBe(1 + 2);
  });

  it("matches case-INSENSITIVELY, because a re-capitalised claim is the same claim", () => {
    const planted = "agent-factory/workflows/003-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-case-", {
        plant: { [planted]: TOKEN_PLANT.toUpperCase() },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(/003-filler\.md:\d+:\d+/);
  });
});

// ── Adjacency: the hit count is arithmetic ────────────────────────────────────────────────────

describe("check-banned-claims — adjacency", () => {
  it("TWO adjacent banned literals on ONE line produce TWO findings, not one merged finding", () => {
    // The count is arithmetic over what was read. A per-line boolean would report this line once
    // and under-count every future multi-claim sentence — and the D-44 draft claim itself was
    // exactly this shape.
    const planted = "agent-factory/workflows/004-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-adjacent-", { plant: { [planted]: ADJACENT_PLANT } }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(2);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
    expect(stdout).toContain(DISCIPLINE_NAME.literal);
    // Two DIFFERENT columns on the same line — the second finding is not a duplicate report.
    const cols = [...stdout.matchAll(/004-filler\.md:(\d+):(\d+)/g)].map((m) => [
      m[1],
      m[2],
    ]);
    expect(cols.length).toBe(2);
    expect(cols[0][0]).toBe(cols[1][0]); // same line
    expect(cols[0][1]).not.toBe(cols[1][1]); // different column
  });

  it("the SAME literal twice on one line produces two findings", () => {
    const planted = "agent-factory/workflows/005-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-repeat-", {
        plant: { [planted]: `${TOKEN_PLANT} ${TOKEN_PLANT}` },
      }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(2);
  });
});

// ── The discipline's name, now unconditional (round 6, D-53) ─────────────────────────────────

// WHAT THIS BLOCK USED TO ASSERT, AND WHY THE VERDICT INVERTED RATHER THAN THE CASE BEING DELETED.
// The discipline's name used to fire only beside a verb from a six-stem hand-authored list, and the
// case below asserted the GREEN half of that: the bare name alone was legal, so the topic stayed
// writable. Measured against the pre-change committed build, four ordinary English conformance verbs
// outside that list — follows, meets, adheres to, is written in — each produced ZERO findings, so
// what the green half actually protected was every unlisted verb. Round 6 deleted the list.
//
// THE CARVE-OUT MOVED FROM LEXICAL TO POSITIONAL, AND SO DID THIS BLOCK. The sentence that proves
// the topic is still writable is no longer "the name without a verb" — it is "the name INSIDE the
// one named exemption region", which is bounded, named and pinned two-sided. Both directions are
// asserted below, so neither is a claim without a control.
describe("check-banned-claims — the discipline's name, matched unconditionally", () => {
  it("FIRES on the discipline's bare name with no conformance verb anywhere on the line", () => {
    // The inversion, asserted at the finding line rather than at the exit code. Under the deleted
    // mechanism this exact plant exited 0 with the planted file never named.
    const planted = "agent-factory/workflows/006-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-bare-", { plant: { [planted]: BARE_NAME_PLANT } }),
    );
    expect(stdout).toMatch(/006-filler\.md:\d+:\d+ — banned standard-name literal /);
    expect(stdout).toContain(DISCIPLINE_NAME.literal);
    expect(status).toBe(1);
  });

  it("FIRES on FOUR conformance verbs no marker list contained — the D-53 discrimination", () => {
    // THE FOUR SENTENCES THAT MEASURED ZERO AGAINST THE PRE-CHANGE BUILD, CARRIED AS PERMANENT CASES.
    // A closure proven only on a transcript stops being proven the moment somebody reintroduces the
    // mechanism; these are the assertions that keep the measurement true. The verbs are ordinary
    // English and pin nothing — that is the point of the change.
    for (const verb of ["follows", "meets", "adheres to", "is written in"]) {
      const planted = "agent-factory/workflows/006-filler.md";
      const { status, stdout } = runGate(
        makeMirror("gops-banned-conformance-", {
          plant: { [planted]: `The grugops kit ${verb} ${DISCIPLINE_NAME.literal}.` },
        }),
      );
      expect(stdout).toMatch(/006-filler\.md:\d+:\d+ — banned standard-name literal /);
      expect(stdout).toContain(DISCIPLINE_NAME.literal);
      expect(status).toBe(1);
    }
  });

  it("CONTROL: the same name INSIDE the exemption region is still suppressed", () => {
    // THE CARVE-OUT, ASSERTED POSITIONALLY. Without this the cases above would pass against a gate
    // that had become a keyword ban on a topic — which would make the non-affiliation disclaimer
    // unwritable, and going green would then mean deleting correct text.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-region-name-", {
        profile: { regionBody: BARE_NAME_PLANT },
      }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });
});

// ── The measured family, held by cases proven able to fail (plan 29-42, task 1) ────────────────

describe("check-banned-claims — the measured comprehension family", () => {
  // WHY EACH ROW ASSERTS TWO VERDICTS. The claim being made is "this bypass is closed", and only the
  // DISAGREEMENT between the pre-fix grammar and the shipped gate on one planted line supports it. A
  // row asserting the shipped verdict alone would pass identically against the build that shipped the
  // bypass, and would read as proof.
  for (const row of FAMILY) {
    it(`${row.id}: the pre-fix grammar and the shipped gate DISAGREE on this line`, () => {
      // The pre-fix half, asserted in both directions against the 29-41 baseline column.
      expect(historicallyNamed(row.plant)).toBe(!row.historicallyOpen);

      const planted = "agent-factory/workflows/010-filler.md";
      const { status, stdout } = runGate(
        makeMirror("gops-banned-family-", { plant: { [planted]: row.plant } }),
      );
      // The verdict is the FINDING LINE at file:line:column, never the exit code — plan 29-41
      // established why, on a run where an un-re-pinned constant made the exit code non-zero for a
      // reason that had nothing to do with the plant.
      expect(stdout).toMatch(/010-filler\.md:\d+:\d+ — banned comprehension literal /);
      expect(stdout).toContain(`banned comprehension literal "${row.literal}"`);
      expect(status).toBe(1);
      // The rendered finding count equals the matcher's own count over that one line: the plant is
      // the only banned text in the mirror, so the two must agree. A floor of 1 keeps the equality
      // from being satisfied by a matcher that returned zero for everything.
      const expected = countBannedClaimOccurrences([row.plant], 0, 1);
      expect(expected).toBeGreaterThanOrEqual(1);
      expect(findingCount(stdout)).toBe(expected);
    });
  }

  it("the family covers EVERY BARE comprehension term, and five rows were open", () => {
    // RENAMED IN ROUND 6 (plan 29-45). The old name read "EVERY CONDITIONAL comprehension member",
    // describing a member shape D-53 removed from the type — a case passing under a name for a
    // mechanism that no longer exists. The BODY was already correct and is byte-unchanged below: it
    // walks `COMPREHENSION_TERMS`, which is the two BARE terms. Only the name and this comment lied.
    // Recorded because 29-44's hand-off list did not name this site; it was found by re-deriving the
    // inventory rather than by adopting one.
    //
    // TWO independent vacuity floors, because the family table is a hand-written list and this
    // repository's second systemic failure class is a hand-written list rotting while green.
    //
    // (1) The COVERAGE floor is derived from the AUTHORITY, not from the table: every bare
    // comprehension term must be the attributing literal of at least one row. The row that would go
    // missing first is F5 — the member the first rule cannot reach — and dropping it would leave the
    // family looking complete while the structurally-unreachable phrasing had no case at all.
    for (const term of COMPREHENSION_TERMS) {
      expect(FAMILY.some((r) => r.literal === term.literal)).toBe(true);
    }
    // (2) The DISCRIMINATION floor: five of the six rows must be historically OPEN. A table that
    // drifted to zero open rows would still pass every case above — every row would assert the pre-fix
    // grammar named it, which proves nothing about the fix — and this whole block would be decoration.
    expect(FAMILY.length).toBe(6);
    expect(FAMILY.filter((r) => r.historicallyOpen).length).toBe(5);
  });
});

// ── Per-marker discrimination (plan 29-42, task 1) ─────────────────────────────────────────────

// ── (ROUND 6, PLAN 29-45) THE SEVEN VACUOUS PER-MARKER CASES ARE REPLACED BY THE ONE PROPERTY ──
//
// Seven cases used to sit here, one per historical benefit word, each planting that word beside the
// bare term and asserting a red — `marker "improve" ALONE on the line turns the bare term into a
// finding`, and six siblings. Plan 29-44 deleted the mechanism they were written against and handed
// them forward as VACUOUS: they still passed, but they passed because the BARE TERM ALONE reds now,
// so each asserted something its own name did not describe. Seven gate subprocesses were spent
// proving a word did something it no longer does.
//
// WHAT REPLACES THEM IS THE PROPERTY THAT IS ACTUALLY TRUE AFTER THE DELETION, AND IT IS STRONGER
// THAN WHAT THEY HELD. The seven words are now INERT: the gate's verdict on a line is the same with
// the word and without it. That is asserted through the gate's own exported matcher, per word, in
// both directions — and it is DISCRIMINATING in the direction that matters, because a marker
// mechanism reintroduced tomorrow makes the markerless line count ZERO while the marker lines count
// one, and the equality reds. It is the runtime dual of the type-level tripwire above.
//
// One end-to-end mirror run is kept beneath it so the property is held against the SHIPPED gate and
// not only against an imported function.
describe("check-banned-claims — the seven historical benefit words are INERT", () => {
  it("the gate's own matcher counts the SAME on a line with each historical word and without it", () => {
    const markerless = markerPlant("");
    const baseline = countBannedClaimOccurrences([markerless], 0, 1);
    // The floor, so an all-zero matcher cannot satisfy the equality below vacuously.
    expect(
      baseline,
      "the markerless plant must itself be a finding, or the equality is 0 === 0",
    ).toBeGreaterThanOrEqual(1);
    // The denominator, derived from the fixture rather than assumed: seven words, and each is
    // measured. A fixture that emptied out would make the loop assert nothing at all.
    expect(HISTORICAL_BENEFIT_WORDS.length).toBe(7);
    let measured = 0;
    for (const word of HISTORICAL_BENEFIT_WORDS) {
      const plant = markerPlant(word);
      // The word under test is the ONLY one present, so an equality cannot be credited to a word
      // that was not the one under test.
      expect(
        HISTORICAL_BENEFIT_WORDS.filter((m) =>
          plant.toLowerCase().includes(m.toLowerCase()),
        ),
      ).toEqual([word]);
      // ...and no enumerated literal is on the line either, so the count is the bare term's.
      expect(historicallyNamed(plant)).toBe(false);
      expect(
        countBannedClaimOccurrences([plant], 0, 1),
        `"${word}" changed the gate's count — a co-occurrence mechanism is back`,
      ).toBe(baseline);
      measured += 1;
    }
    expect(measured).toBe(HISTORICAL_BENEFIT_WORDS.length);
  });

  it("and the SHIPPED gate agrees end to end: one historical word beside the bare term still reds by name", () => {
    // The integration half. The inertness above is asserted through an imported function; this runs
    // the committed artifact over a mirror, so the property is not held only inside the module that
    // would be wrong if it were wrong.
    const plant = markerPlant(HISTORICAL_BENEFIT_WORDS[0]);
    const planted = "agent-factory/workflows/011-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-marker-", { plant: { [planted]: plant } }),
    );
    expect(stdout).toContain(
      `banned comprehension literal "${BARE_COMPREHENSION.literal}"`,
    );
    expect(stdout).toMatch(/011-filler\.md:\d+:\d+/);
    expect(status).toBe(1);
    const expected = countBannedClaimOccurrences([plant], 0, 1);
    expect(expected).toBeGreaterThanOrEqual(1);
    expect(findingCount(stdout)).toBe(expected);
  });

  // ── WHAT REPLACED THE OLD no-marker GREEN CONTROL, AND WHY THE REPLACEMENT IS POSITIONAL ──────
  //
  // A case used to sit here planting the bare term with no benefit word on the line and asserting
  // GREEN — the discrimination that proved the guard had not become a keyword ban on a topic. Round
  // 6 removed its SUBJECT: the bare term is unconditional, so that sentence is now a finding, and a
  // re-measured version of it would assert the OPPOSITE of what its name says. The property it held
  // — the topic stays writable, so the honest denial can be written and no correct text has to be
  // deleted to reach green — is held now by the INSIDE-THE-REGION control below, positionally. Both
  // directions of it are asserted, so the carve-out is discriminating rather than merely claimed.

  it("FIRES on the bare term with no benefit word anywhere on the line — the round-6 inversion", () => {
    const plant = `The profile makes no claim about ${BARE_COMPREHENSION.literal} in either direction.`;
    expect(
      HISTORICAL_BENEFIT_WORDS.filter((m) =>
        plant.toLowerCase().includes(m.toLowerCase()),
      ),
    ).toEqual([]);
    expect(historicallyNamed(plant)).toBe(false);
    const { status, stdout } = runGate(
      makeMirror("gops-banned-nomarker-", {
        plant: { "agent-factory/workflows/012-filler.md": plant },
      }),
    );
    expect(stdout).toMatch(/012-filler\.md:\d+:\d+ — banned comprehension literal /);
    expect(stdout).toContain(
      `banned comprehension literal "${BARE_COMPREHENSION.literal}"`,
    );
    expect(status).toBe(1);
  });

  it("CONTROL: the SAME markerless line INSIDE the exemption region is still suppressed", () => {
    // The carve-out, asserted positionally. Without it every case in this block would pass against a
    // gate that had banned the topic outright, and the honest denial would be unwritable.
    const plant = `The profile makes no claim about ${BARE_COMPREHENSION.literal} in either direction.`;
    const { status, stdout } = runGate(
      makeMirror("gops-banned-region-term-", { profile: { regionBody: plant } }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("the five ROUND-5 comprehension bypasses all red by name — the D-48 discrimination", () => {
    // THE FIVE SENTENCES THAT DEFEATED THE ROUND-5 RULE AT EXIT 0 WITH THE PLANTED FILE NEVER NAMED,
    // carried as permanent cases so the closure survives the transcript that proved it. Not one of
    // these verbs was on the deleted list, and no list contains all the verbs English has for "makes
    // better" — which is why the axis was deleted rather than extended.
    for (const verb of [
      "increases",
      "raises",
      "gives models sharper",
      "aids",
    ]) {
      const plant = `Controlled language ${verb} ${BARE_COMPREHENSION.literal}.`;
      expect(historicallyNamed(plant)).toBe(false);
      const { status, stdout } = runGate(
        makeMirror("gops-banned-r5-", {
          plant: { "agent-factory/workflows/013-filler.md": plant },
        }),
      );
      expect(stdout).toMatch(/013-filler\.md:\d+:\d+ — banned comprehension literal /);
      expect(stdout).toContain(
        `banned comprehension literal "${BARE_COMPREHENSION.literal}"`,
      );
      expect(status).toBe(1);
    }
    // The fifth carries no occurrence of the first bare term at all, and is reached by the second.
    const fifth = `Controlled language makes models ${BARE_UNDERSTAND.literal} prose faster.`;
    expect(fifth).not.toContain(BARE_COMPREHENSION.literal);
    expect(historicallyNamed(fifth)).toBe(false);
    const { status, stdout } = runGate(
      makeMirror("gops-banned-r5-fifth-", {
        plant: { "agent-factory/workflows/013-filler.md": fifth },
      }),
    );
    expect(stdout).toMatch(/013-filler\.md:\d+:\d+ — banned comprehension literal /);
    expect(stdout).toContain(
      `banned comprehension literal "${BARE_UNDERSTAND.literal}"`,
    );
    expect(status).toBe(1);
  });
});

// ── The exemption region ──────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the one named exemption region", () => {
  it("exits 0 when the SAME sentence appears ONLY inside the exemption region", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-exempt-", { profile: { regionBody: NAME_PLANT } }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("PAIRED PLANT: the region is scoped, so the same sentence above the heading IS reported", () => {
    // Asserting only exit 0 on a region-only mirror would pass even if the whole scan were dead — a
    // gate that reads nothing also exits 0. The paired plant is what makes the exemption
    // DISCRIMINATING: the identical sentence sits on both sides of one heading in one file, and the
    // gate must report exactly the one above it.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-paired-", {
        profile: { preamble: NAME_PLANT, regionBody: NAME_PLANT },
      }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(1);
  });

  it("the region ENDS at the next same-level heading — text below it is scanned again", () => {
    // A region that ran to end-of-file would exempt everything after the disclaimer, which is the
    // quiet way a one-section exemption becomes a whole-file one.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-region-end-", {
        profile: { trailingSection: true },
        plant: {
          [PROFILE]: profileDoc({ trailingSection: true }).replace(
            "Text below the region is scanned again.",
            NAME_PLANT,
          ),
        },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(PROFILE);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
  });

  it("FAILS on a DUPLICATED exemption heading — the hole cannot be widened by adding a second", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-dup-region-", { profile: { headings: 2 } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("occurs 2 time(s)");
    expect(stdout).toContain("DUPLICATED region widens");
  });

  it("FAILS on a MISSING exemption heading", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-no-region-", { profile: { headings: 0 } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("occurs 0 time(s)");
  });

  it("FAILS on an EMPTY exemption region — a heading with no disclaimer beneath it", () => {
    const { status, stdout } = runGate(
      // `reach: 0` because the region must stay genuinely EMPTY: filling it to the pin would be a
      // fixture that contradicted the property the case exists to assert. `anchors: 0` for the same
      // reason under D-54 — a padding anchored block is text, and a region carrying one is not empty.
      makeMirror("gops-banned-empty-region-", {
        profile: { regionBody: "", reach: 0, anchors: 0 },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("is EMPTY");
  });

  it("FAILS BY NAME when the exemption DOCUMENT is gone, not merely one document short", () => {
    // The refusal used to live inside the scan loop, where it could only fire while the file was
    // still a member of the scan — so deleting the file skipped every one of its refusals and the
    // only survivor was the aggregate pin, which never says the disclaimer is gone.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-no-profile-", { omitProfile: true }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(PROFILE);
    expect(stdout).toContain("does not exist at");
    // A stack trace is not a verdict.
    expect(stdout).not.toMatch(/at Object\.|node:internal|ENOENT/);
  });

  // ── (Round 7, plan 29-49 — WR-02) THE EXEMPT READ IS GUARDED, NOT MERELY GUARDED-ON-EXISTENCE ──
  //
  // The case above plants ABSENCE, which `existsSync` catches. This one plants a path that EXISTS
  // and still cannot be read, which `existsSync` answers `true` for and `readFileSync` RAISES on.
  // The distinction is the whole case: a gate whose stated floor is that a stack trace is not a
  // verdict must report that situation by name rather than die inside `runAll`, and before this
  // plan it died — the RED transcript is a `node:internal` frame, not a refusal.
  it("FAILS BY NAME when the exemption document EXISTS but cannot be READ as a file", () => {
    const mirror = makeMirror("gops-banned-exempt-unreadable-", {
      omitProfile: true,
    });
    // The plant: a DIRECTORY at the exemption document's own path.
    mkdirSync(join(mirror, PROFILE), { recursive: true });
    // The plant is confirmed on disk BEFORE the gate runs, and confirmed to be the shape that
    // separates this case from the one above: present, and not a readable file.
    expect(existsSync(join(mirror, PROFILE))).toBe(true);

    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain("could not be read");
    expect(stdout).toContain(PROFILE);
    // The refusal states the CONSEQUENCE, so a reader is not left to infer what the gate did with
    // the rest of the document: the region is not located, so nothing is exempted.
    expect(stdout).toContain("scanned whole");
    // The two refusals are distinguishable. A guard that reported the readable-but-absent wording
    // here would be answering the wrong question with the right exit code.
    expect(stdout).not.toContain("does not exist at");
    // The refusal NAMES the underlying error rather than swallowing it, so the reader is not sent
    // to reproduce a failure the gate already knew the cause of.
    expect(stdout).toMatch(/could not be read \(EISDIR[^)]*\)/);
    // A STACK TRACE IS NOT A VERDICT — the assertion that was RED before the guard existed. It
    // excludes FRAMES rather than the word `EISDIR`, because the refusal above quotes that word on
    // purpose; excluding it would have forbidden the very naming this case exists to require.
    expect(stdout).not.toMatch(/at Object\.|node:internal|at runAll \(|node:fs:/);
    expect(stdout).not.toContain("Node.js v");
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  // ── (Round 7, plan 29-49 — WR-02) ONE READ OF THE EXEMPTION DOCUMENT, ASSERTED AS SOURCE SHAPE ──
  //
  // THIS CASE'S REACH IS STATED HONESTLY RATHER THAN IMPLIED. The defect it guards — indices
  // measured over read #1 and spent against read #2 — has NO behavioural witness this harness can
  // construct, and the reason is structural rather than an omission: the exemption document is a
  // DERIVED member of the kit part, so every mirror in which the two reads could disagree is a
  // mirror in which the document is absent from the scan set entirely and the loop never asks. Both
  // reads therefore return the same bytes on every input reachable from `makeMirror`. That
  // unreachable half is escalated to the round-7 register as `V-29-49-01` rather than papered over
  // with a case that asserts what it cannot see.
  //
  // What IS asserted here is the source shape that makes the shear unreachable by arithmetic: two
  // `readFileSync` call sites in the whole module, and a loop whose text selection for the exempt
  // member takes the ALREADY-READ text conjoined with the flag recording that the read SUCCEEDED.
  // The conjunct is the half that matters most: keyed on the filename alone, the selection hands the
  // loop an empty string whenever the exempt read did not happen — zero lines, zero findings, one
  // increment of `visited`, a silently short scan wearing the shape of a one-read fix.
  it("holds the ONE-READ invariant as source shape: two read sites, and the cached text is gated on the read having succeeded", () => {
    const src = readFileSync(GATE_TS, "utf8");

    // Exactly two CALL sites. The import binding and the three prose mentions carry no `(`, so this
    // counts calls rather than occurrences of the name. A third read site added tomorrow reds here.
    const callSites = (src.match(/readFileSync\(/g) ?? []).length;
    expect(callSites).toBe(2);

    // The selection is a conjunction, not a filename test. Both conjuncts are required by name.
    const selection = src.match(
      /file === BANNED_CLAIM_EXEMPT_REGION\.file && exemptReadOk/,
    );
    expect(selection).not.toBeNull();

    // And the flag is only ever RAISED next to the read that justifies it — never initialised true.
    expect(src).toMatch(/let exemptReadOk = false;/);
    expect((src.match(/exemptReadOk = true;/g) ?? []).length).toBe(1);
  });
});

// ── (Round 7, plan 29-49 — WR-05) THE IMPORTED CORPUS'S REFUSAL CHANNEL ───────────────────────
//
// This gate consumes `publicDocsCorpus()` from `check-public-docs-vocabulary.ts`, and
// `PUBLIC_DOCS_CORPUS_PARTS` is evaluated at IMPORT time. So a refusal raised while deriving that
// corpus — an unreadable repository root, a walk that blew its budget, a missing
// `agent-factory/README.md` — has already landed in the OTHER module's private array by the time
// this gate calls the accessor, and used to be printed by neither runner.
//
// THE VERDICT WAS NEVER WRONG; THE DIAGNOSIS WAS. Both builds exit 1 on the mirror below, because
// the cardinality pin catches the missing document. The difference is that the pin's own remedy
// text sends the author to walk every part's derivation, and a derivation that REFUSED is precisely
// the thing that text would otherwise omit.
describe("check-banned-claims — the imported corpus's derivation-refusal channel (WR-05)", () => {
  it("NAMES a refusal raised while deriving the public-document corpus, and names the module that raised it", () => {
    const mirror = makeMirror("gops-banned-imported-refusal-", {
      omitKitReadme: true,
    });
    // The plant is confirmed absent on disk BEFORE the gate runs.
    expect(existsSync(join(mirror, KIT_README))).toBe(false);

    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    // The refusal itself, by its own wording from the other module.
    expect(stdout).toContain(
      "is a NAMED member of the public-docs scan set and does not exist at",
    );
    // …attributed, so a reader can tell WHICH module's derivation refused without opening either.
    expect(stdout).toContain("check-public-docs-vocabulary");
    // …and reported BEFORE the cardinality complaint it explains. Ordering is the point: a
    // diagnosis printed after its symptom is a diagnosis the reader has already acted without.
    const refusalAt = stdout.indexOf("public-document corpus");
    const pinAt = stdout.indexOf("expected exactly");
    expect(refusalAt).toBeGreaterThan(-1);
    expect(pinAt).toBeGreaterThan(-1);
    expect(refusalAt).toBeLessThan(pinAt);
    // A stack trace is not a verdict.
    expect(stdout).not.toMatch(/at Object\.|node:internal|node:fs:/);
  });

  it("keeps the two channels SEPARATE — an imported refusal is not laundered into this gate's own", () => {
    const mirror = makeMirror("gops-banned-two-channels-", {
      omitKitReadme: true,
      omitInstallReadme: true,
    });
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    // This gate's OWN channel keeps its own prefix…
    expect(stdout).toContain("banned-claim scan derivation refused:");
    // …and the imported one keeps a different prefix naming where it came from. Merging the two
    // arrays would collapse two remedies — fix a document this gate derives, versus fix a document
    // another module derives — into one indistinguishable line.
    expect(stdout).toContain("public-document corpus");
    expect(stdout).not.toMatch(
      /banned-claim scan derivation refused: agent-factory\/README\.md/,
    );
  });

  it("holds the refusal array to exactly ONE reader, so the accessor cannot be bypassed by a later edit", () => {
    const raw = readFileSync(
      join(ROOT, "scripts", "check-public-docs-vocabulary.ts"),
      "utf8",
    );

    // THE INPUT TO THIS PREDICATE IS BOUNDED FIRST, because the first version of this case was not
    // and produced a FALSE result: the accessor's own doc comment NAMES the push sites in prose,
    // and a count over raw bytes read that sentence as a second consumer. A mention is not a
    // reference. So the question is asked of CODE, with block and line comments removed.
    const src = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    // …AND THE STRIP'S OWN PREMISE IS ASSERTED BEFORE THE COUNT. A strip that ate real code would
    // make this case pass by deleting its subject, which is the emptiest possible green.
    const decl = (src.match(/const DERIVATION_REFUSALS: string\[\] = \[\];/g) ?? [])
      .length;
    const pushes = (src.match(/DERIVATION_REFUSALS\.push\(/g) ?? []).length;
    expect(decl).toBe(1);
    expect(pushes).toBe(3);
    // The prose mention must be GONE from the stripped text but PRESENT in the raw text — the two
    // halves together prove the strip removed comments and only comments.
    expect(raw).toContain("`DERIVATION_REFUSALS.push` sites");
    expect(src).not.toContain("`DERIVATION_REFUSALS.push` sites");

    // The set is now enumerable: one declaration, three push sites, and exactly one READ. A fourth
    // push is legitimate and must not red here; a SECOND read is the defect, because that is how a
    // private array acquires a consumer the accessor does not serve. The read count is DERIVED by
    // subtraction rather than pattern-matched, so a read written in a shape nobody predicted in
    // advance is still counted.
    const all = (src.match(/DERIVATION_REFUSALS/g) ?? []).length;
    expect(all - decl - pushes).toBe(1);

    // And that one reader is the exported accessor.
    expect(raw).toMatch(
      /export function publicDocsDerivationRefusals\(\): readonly string\[\] \{\n\s*return DERIVATION_REFUSALS;/,
    );
    // The module's own runner consumes the accessor, never the array.
    expect(raw).toMatch(/for \(const refusal of publicDocsDerivationRefusals\(\)\)/);
  });
});

// ── WR-06 (plan 29-18): the region is located through the ONE fence authority ─────────────────
//
// `locateExemptRegion` decided two section-extent questions with a bare heading scan — "which line
// carries the region's own heading" and "which same-level heading ends it" — while
// `fencedLineFlags` in scripts/frontmatter.ts is the single fence toggle this tree already owns and
// two sibling gates already consume for exactly this question.
//
// THE FAILURE DIRECTION HERE IS SAFE, AND THAT IS WHY THE ASYMMETRY IS STATED RATHER THAN ASSUMED.
// A truncated exemption region means MORE of the document is checked, and a fenced quotation of the
// heading turns a correct document into a named refusal. Both are fail-CLOSED. Its sibling in
// check-diff-disposition — a truncated FROZEN region — is fail-OPEN, because less gets protected.
// Both are one grammar too many; only one of them is dangerous, and a reader meeting these two
// fixes together needs to know which is which rather than inferring they are interchangeable.
//
// Every fixture below is a PLANTED input. The live tree carries zero fenced heading lines in the
// exemption document, which is asserted below as a measurement rather than assumed — that premise
// case is what makes "the live verdict did not move" evidence instead of a coincidence.

/** A fenced markdown example whose body is `lines`. Built once so no fixture retypes a delimiter. */
const fencedExample = (...lines: string[]): string[] => [
  "```markdown",
  ...lines,
  "```",
];

/** The region body carrying a fenced `## ` line, with a banned claim BELOW it and still inside. */
const REGION_WITH_FENCED_HEADING = [
  "This profile is an independent work.",
  "",
  ...fencedExample("## A heading quoted inside an example"),
  "",
  NAME_PLANT,
].join("\n");

/**
 * (Plan 29-23) The same fenced `## ` line, with NO claim of its own inside the region — the fixture
 * for the widening's OUTER bound. The claim it pairs with sits below the region's REAL end, so the
 * case measures how far the exemption reaches rather than what it covers.
 */
const REGION_WITH_FENCED_HEADING_ONLY = [
  "This profile is an independent work.",
  "",
  ...fencedExample("## A heading quoted inside an example"),
  "",
  "A line inside the region, below the heading quoted in the example above.",
].join("\n");

/** A preamble quoting the region's OWN heading inside a fence. */
const PREAMBLE_QUOTING_THE_HEADING = [
  "Every rule carries a stable id.",
  "",
  ...fencedExample(BANNED_CLAIM_EXEMPT_REGION.heading),
].join("\n");

describe("check-banned-claims — the exemption region reads the one fence authority (WR-06)", () => {
  it("a fenced `## ` line inside the region does NOT truncate it — the claim below it stays exempt", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-fenced-in-region-", {
        profile: { regionBody: REGION_WITH_FENCED_HEADING },
      }),
    );
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(status).toBe(0);
    expect(findingCount(stdout)).toBe(0);
  });

  it("PAIRED PLANT: the region's REAL end still ends it — the same claim below that end IS reported", () => {
    // Exit 0 on the case above would also be produced by a region that swallowed the whole file, so
    // on its own it proves the wrong thing. The pair is what discriminates: the identical sentence
    // sits below the FENCED heading (exempt) and below the REAL one (reported), in one document, and
    // the gate must report exactly the second. The expected line number is DERIVED from the fixture
    // rather than typed, so an edit to the document cannot leave a stale literal passing.
    const doc = profileDoc({
      regionBody: REGION_WITH_FENCED_HEADING,
      trailingSection: true,
    }).replace("Text below the region is scanned again.", NAME_PLANT);
    const docLines = doc.split("\n");
    const fencedHeadingLine =
      docLines.indexOf("## A heading quoted inside an example") + 1;
    const realEndLine =
      docLines.indexOf("## After the region") + 1;
    const exemptClaimLine = docLines.indexOf(NAME_PLANT) + 1;
    const reportedClaimLine = docLines.lastIndexOf(NAME_PLANT) + 1;
    // The fixture's own premise: the two plants are DISTINCT lines, the exempt one sits below the
    // fenced heading, and the reported one sits below the region's real end. A fixture that collapsed
    // them would make this case pass while testing nothing.
    expect(exemptClaimLine).toBeGreaterThan(fencedHeadingLine);
    expect(reportedClaimLine).toBeGreaterThan(realEndLine);
    expect(reportedClaimLine).not.toBe(exemptClaimLine);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-fenced-paired-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(1);
    expect(stdout).toContain(`${PROFILE}:${reportedClaimLine}:`);
    expect(stdout).not.toContain(`${PROFILE}:${exemptClaimLine}:`);
  });

  it("a FENCED occurrence of the region heading does not count toward the exactly-one assertion", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-fenced-heading-", {
        profile: { preamble: PREAMBLE_QUOTING_THE_HEADING },
      }),
    );
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(status).toBe(0);
    expect(stdout).not.toContain("occurs 2 time(s)");
  });

  it("TWO UNFENCED occurrences still produce the existing two-sided refusal, wording unchanged", () => {
    // The bound on the fix above, from the other side: making a FENCED heading invisible must not
    // make a real second heading invisible too. The refusal's wording is asserted verbatim, because
    // the fix must not reword a refusal this gate already gets right.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-two-unfenced-", { profile: { headings: 2 } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("occurs 2 time(s)");
    expect(stdout).toContain("DUPLICATED region widens");
  });

  it("the region's EXTENT is a number: it ends AFTER a fenced heading, not at it", () => {
    // No exit code can express this. A gate that exempts the right lines and one that exempts too
    // few both speak through findings; they differ only in where the region stops.
    const lines = profileDoc({
      regionBody: REGION_WITH_FENCED_HEADING,
      trailingSection: true,
    }).split("\n");
    const fencedHeadingAt = lines.indexOf("## A heading quoted inside an example");
    const realEndAt = lines.indexOf("## After the region");
    expect(fencedHeadingAt).toBeGreaterThan(-1);
    expect(realEndAt).toBeGreaterThan(fencedHeadingAt);

    const region = locateExemptRegion(lines);
    expect(region).not.toBeNull();
    expect(region?.headingAt).toBe(
      lines.indexOf(BANNED_CLAIM_EXEMPT_REGION.heading),
    );
    expect(region?.endBefore).toBeGreaterThan(fencedHeadingAt);
    expect(region?.endBefore).toBe(realEndAt);
  });

  it("PREMISE: the live exemption document carries ZERO fenced heading lines, so the verdict claim is measured", () => {
    // The behaviour-preserving claim for the live tree rests on this and nothing else. Derived here
    // from the same authority the gate now consults, at run time, rather than quoted from a plan.
    const text = readFileSync(join(ROOT, PROFILE), "utf8");
    const lines = text.split("\n");
    const flags = fencedLineFlags(text);
    const fencedSameLevelHeadings = lines.filter(
      (l, i) => flags[i] && /^## /.test(l),
    ).length;
    const fencedRegionHeadings = lines.filter(
      (l, i) => flags[i] && l === BANNED_CLAIM_EXEMPT_REGION.heading,
    ).length;
    expect(fencedSameLevelHeadings).toBe(0);
    expect(fencedRegionHeadings).toBe(0);
    // Non-vacuity on the premise itself: the document really does carry fences and really does carry
    // the region heading, so the two zeros above are a measurement over a live input rather than the
    // answer a missing file would give.
    expect(flags.filter(Boolean).length).toBeGreaterThan(0);
    expect(lines).toContain(BANNED_CLAIM_EXEMPT_REGION.heading);
  });
});

// ── WR-02 (plan 29-23): the widening's OUTER bound, and the exemption's REACH ─────────────────
//
// Plan 29-18's fence-awareness fix made this region END LATER, so strictly FEWER lines are scanned.
// Reproduced on the fixture below, the region's body went from FOUR exempt lines to NINE. That is a
// relaxation of a safety exemption, and until this block nothing anywhere measured it: the header
// above `locateExemptRegion` asserted the opposite, and no number published by the gate would have
// moved if the region had grown again tomorrow.
//
// Two properties are pinned here, and they are different questions:
//
//   1. THE OUTER BOUND — how far the widening reaches. A claim below the fenced `## ` AND below the
//      region's real end is still reported. This bounds the widening from the other side.
//   2. THE REACH — how much prohibition the exemption actually lifts, published on every run and
//      compared against a declared constant. The pin is on SUPPRESSED OCCURRENCES rather than on
//      exempt LINES: a line count moves when the disclaimer is reflowed and says nothing about how
//      much was lifted, while the suppressed count is exactly the quantity an exemption is a
//      decision about.

describe("check-banned-claims — the exemption's outer bound and its published reach (WR-02)", () => {
  it("OUTER BOUND: a claim below the fenced `## ` AND below the REAL later `## ` heading is still reported", () => {
    // The other half of the WR-06 pair. Its sibling above asserts that a claim below a FENCED `## `
    // stays exempt — on its own that is satisfied by a region which swallowed the rest of the file.
    // This case is the bound: the widening moved the region's end from the fenced heading to the
    // real one, and NOT one line further.
    const doc = profileDoc({
      regionBody: REGION_WITH_FENCED_HEADING_ONLY,
      trailingSection: true,
    }).replace("Text below the region is scanned again.", NAME_PLANT);
    const docLines = doc.split("\n");
    const fencedHeadingAt = docLines.indexOf(
      "## A heading quoted inside an example",
    );
    const realEndAt = docLines.indexOf("## After the region");
    const claimAt = docLines.indexOf(NAME_PLANT);

    // THE FIXTURE'S OWN PREMISE, ASSERTED BEFORE THE VERDICT. The three landmarks must be distinct
    // and in this order, and the quoted heading must really be inside a fence according to the ONE
    // authority — a fixture whose fence never formed would make this case pass while measuring the
    // ordinary region end and nothing about the widening at all.
    expect(fencedHeadingAt).toBeGreaterThan(-1);
    expect(realEndAt).toBeGreaterThan(fencedHeadingAt);
    expect(claimAt).toBeGreaterThan(realEndAt);
    expect(fencedLineFlags(doc)[fencedHeadingAt]).toBe(true);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-outer-bound-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(1);
    expect(stdout).toContain(`${PROFILE}:${claimAt + 1}:`);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
  });

  it("REACH: the gate PUBLISHES how many banned-claim occurrences the exemption suppresses, and the number is PINNED", () => {
    // The number is derived by the SAME matcher the gate reports findings with — never re-typed
    // here, because a second matcher would disagree with the first the day a literal's conditional
    // arm changed, and this file's whole subject is second grammars.
    const lines = readFileSync(join(ROOT, PROFILE), "utf8").split("\n");
    const region = locateExemptRegion(lines);
    expect(region).not.toBeNull();
    const derived = countBannedClaimOccurrences(
      lines,
      region!.headingAt,
      region!.endBefore,
    );
    const declared = BANNED_CLAIM_EXEMPT_SUPPRESSED;
    // NON-VACUITY FLOOR FIRST. A reach of zero is indistinguishable from a counter that matched
    // nothing, and this region exists precisely because the disclaimer has to quote the claim forms
    // it denies.
    expect(
      derived,
      "the exemption region suppresses ZERO occurrences — either the counter is dead or the disclaimer no longer quotes what it denies, and both make the pin below meaningless",
    ).toBeGreaterThan(0);
    expect(derived).toBe(declared);

    // And the number is PUBLISHED, not merely declared. A constant nobody prints is a constant
    // nobody reads.
    const r = spawnSync("node", [GATE_JS], { encoding: "utf8" });
    const stdout = (r.stdout ?? "") + (r.stderr ?? "");
    expect(r.status).toBe(0);
    // (Round 6, plan 29-45) The PASS line now carries the per-group breakdown BETWEEN the total and
    // the pin, so this assertion is split across the components rather than widened to swallow them.
    // The breakdown's own contents are held by the dedicated case at the end of this file; here the
    // point is only that the TOTAL and the PIN are both published.
    expect(stdout).toContain(`suppresses ${derived} banned-claim occurrence(s) (`);
    expect(stdout).toContain(`), pinned at ${declared}, and reaches `);
  });

  it("HARNESS PREMISE: the mirror's region really reaches the pin, and the filler really carries one occurrence each", () => {
    // Without this the reach cases below would be measuring a fixture nobody had checked. If
    // `REACH_FILLER` carried two occurrences, or none, every mirror in this file would sit at some
    // other number and the +1/−1 falsifiability cases would still red — for the wrong reason, and
    // indistinguishably. This project has now produced a false verification result nine times over
    // five rounds by not asserting the harness's own premise.
    expect(
      countBannedClaimOccurrences(
        [REACH_FILLER],
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      "the reach filler must carry EXACTLY one banned-claim occurrence, or the mirror's reach arithmetic is wrong by a multiple nobody would see",
    ).toBe(1);

    const lines = profileDoc().split("\n");
    const region = locateExemptRegion(lines);
    expect(region).not.toBeNull();
    expect(
      countBannedClaimOccurrences(lines, region!.headingAt, region!.endBefore),
      "the default mirror's exemption region does not reach the gate's declared suppression pin, so every mirror case in this file is running against a corpus the gate refuses",
    ).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED);
  });

  it("the AUTHORITY'S equality is now this gate's: a region heading with TRAILING whitespace is located AND counted", () => {
    // A BEHAVIOUR CHANGE THE REWIRE INTRODUCED, PINNED RATHER THAN LEFT TO THE DIFF. This gate used
    // to compare the heading line RAW, so `## Disclaimer and honesty floor ` was not the heading at
    // all and the document was refused with `occurs 0 time(s)`. The shared locator normalises with
    // `trimEnd()`, which is the axis on which the four locators of this class disagreed, and this
    // gate now applies it in BOTH places — the count and the position. Asserting only one of them
    // would let a trailing space be located by one half and not counted by the other, which is the
    // two-grammar defect one level down from the one this plan deletes.
    const doc = profileDoc().replace(
      `\n${BANNED_CLAIM_EXEMPT_REGION.heading}\n`,
      `\n${BANNED_CLAIM_EXEMPT_REGION.heading} \n`,
    );
    const docLines = doc.split("\n");
    // FIXTURE PREMISE: the replacement really happened and the raw heading really is gone, so the
    // case cannot pass by testing the ordinary un-spaced document.
    expect(docLines).not.toContain(BANNED_CLAIM_EXEMPT_REGION.heading);
    expect(docLines).toContain(`${BANNED_CLAIM_EXEMPT_REGION.heading} `);

    const region = locateExemptRegion(docLines);
    expect(
      region,
      "a heading carrying one trailing space was not located, so this gate and the shared authority apply different equalities",
    ).not.toBeNull();
    expect(region!.headingAt).toBe(
      docLines.indexOf(`${BANNED_CLAIM_EXEMPT_REGION.heading} `),
    );

    const { status, stdout } = runGate(
      makeMirror("gops-banned-trailing-ws-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    // The COUNT saw it too: had only the position applied `trimEnd()`, the count would have found
    // zero headings and refused before the region was ever located.
    expect(stdout).not.toContain("time(s) in the file");
  });

  it("the BOUND on that equality: a LEADING space is still not the heading", () => {
    // The other side of the case above. `trimEnd()` normalises the END of the line and nothing else;
    // the tree's anchors are column-zero by convention, and admitting indented ATX would change what
    // four gates scan at once.
    const doc = profileDoc().replace(
      `\n${BANNED_CLAIM_EXEMPT_REGION.heading}\n`,
      `\n ${BANNED_CLAIM_EXEMPT_REGION.heading}\n`,
    );
    expect(doc.split("\n")).not.toContain(BANNED_CLAIM_EXEMPT_REGION.heading);
    const { status, stdout } = runGate(
      makeMirror("gops-banned-leading-ws-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("occurs 0 time(s)");
  });

  it("FALSIFIABLE, direction UP: one ADDITIONAL claim inside the region reds, naming both numbers", () => {
    // A pin that has never been shown to fail is a comment. This is the direction that matters —
    // an exemption covering MORE than it was reviewed for — and it is the direction plan 29-18
    // moved without anything noticing.
    const doc = profileDoc({ reach: BANNED_CLAIM_EXEMPT_SUPPRESSED + 1 });
    const docLines = doc.split("\n");
    const region = locateExemptRegion(docLines);
    // THE FIXTURE'S OWN PREMISE: the document really does suppress one MORE than the pin. A fixture
    // that landed back on the pin would make this case red for some unrelated reason, or go green.
    expect(region).not.toBeNull();
    expect(
      countBannedClaimOccurrences(
        docLines,
        region!.headingAt,
        region!.endBefore,
      ),
    ).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED + 1);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-reach-up-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `suppressed ${BANNED_CLAIM_EXEMPT_SUPPRESSED + 1} banned-claim occurrence(s)`,
    );
    expect(stdout).toContain(`declares ${BANNED_CLAIM_EXEMPT_SUPPRESSED}`);
    expect(stdout).toContain("An exemption GROWING is a decision");
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("FALSIFIABLE, direction DOWN: one FEWER claim inside the region also reds — the pin is two-sided", () => {
    // A shrinking exemption is equally a change somebody made: a disclaimer that quietly stopped
    // quoting what it denies is a disclaimer that stopped working. Without this half the pin would
    // silently accept every future deletion, which is the one-sided pin this repository keeps
    // finding after the fact.
    const doc = profileDoc({ reach: BANNED_CLAIM_EXEMPT_SUPPRESSED - 1 });
    const docLines = doc.split("\n");
    const region = locateExemptRegion(docLines);
    expect(region).not.toBeNull();
    expect(
      countBannedClaimOccurrences(
        docLines,
        region!.headingAt,
        region!.endBefore,
      ),
    ).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED - 1);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-reach-down-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `suppressed ${BANNED_CLAIM_EXEMPT_SUPPRESSED - 1} banned-claim occurrence(s)`,
    );
    expect(stdout).toContain(`declares ${BANNED_CLAIM_EXEMPT_SUPPRESSED}`);
    expect(stdout).toContain("An exemption SHRINKING is equally a change");
  });

  it("WIDENING IS NOT OPEN-ENDED: an appended REAL later section carrying a claim is reported, and the reach does not move", () => {
    // On the live corpus the region runs to END OF FILE, so nothing there can distinguish "the
    // region stops at the next section" from "the region stops because the file did". That is an
    // ORDERING ACCIDENT, not a property, so it is pinned by a plant.
    //
    // The two mechanisms are asserted TOGETHER on purpose: the claim below the appended heading is
    // REPORTED (the bound held) and the exemption's published reach is UNMOVED (the appended
    // section did not join the region). Either alone is satisfiable by the other being broken.
    const doc = profileDoc({ trailingSection: true }).replace(
      "Text below the region is scanned again.",
      NAME_PLANT,
    );
    const docLines = doc.split("\n");
    const appendedAt = docLines.indexOf("## After the region");
    const claimAt = docLines.indexOf(NAME_PLANT);
    expect(appendedAt).toBeGreaterThan(-1);
    expect(claimAt).toBeGreaterThan(appendedAt);

    const region = locateExemptRegion(docLines);
    expect(region).not.toBeNull();
    expect(
      region!.endBefore,
      "the exemption region swallowed the appended section — its end is no longer the next real heading",
    ).toBe(appendedAt);
    expect(
      countBannedClaimOccurrences(
        docLines,
        region!.headingAt,
        region!.endBefore,
      ),
    ).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-appended-section-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(1);
    expect(stdout).toContain(`${PROFILE}:${claimAt + 1}:`);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
    // The reach pin stayed green, so the exit 1 above is the CLAIM being reported and not the pin
    // firing for an unrelated reason.
    expect(stdout).not.toContain("An exemption GROWING is a decision");
  });

  it("MEASURED: every level-one heading in the live exemption document below line one is FENCED and sits ABOVE the region", () => {
    // The level widening — from a close on `## ` only to a close on any heading of level at most two
    // — can only make the region END EARLIER, which causes MORE of the document to be checked. That
    // is the fail-CLOSED direction, but "fail-closed" is not the same claim as "unchanged", and the
    // live verdict claim rests on this measurement rather than on the direction argument.
    //
    // The measured member list is recorded in the plan's SUMMARY, not frozen here. Freezing line
    // numbers would red this case on a reflow of a document this plan does not own — the same
    // reasoning that puts the reach pin on suppressed OCCURRENCES rather than on exempt LINES. What
    // is asserted is the PROPERTY that makes the widening safe.
    const text = readFileSync(join(ROOT, PROFILE), "utf8");
    const lines = text.split("\n");
    const flags = fencedLineFlags(text);
    const levelOne: Array<{ line: number; fenced: boolean }> = [];
    for (let i = 1; i < lines.length; i++) {
      if (/^# /.test(lines[i]))
        levelOne.push({ line: i + 1, fenced: flags[i] === true });
    }
    // NON-VACUITY FLOOR FIRST: a scan that derived nothing cannot report "all fenced".
    expect(
      levelOne.length,
      "zero level-one heading lines derived below line one — the scan found nothing and no claim below it means anything",
    ).toBeGreaterThan(0);
    expect(
      levelOne.filter((r) => !r.fenced),
      "an UNFENCED level-one heading in the exemption document would close the region under the widened level, moving its extent",
    ).toEqual([]);

    const headingAt = lines.indexOf(BANNED_CLAIM_EXEMPT_REGION.heading);
    expect(headingAt).toBeGreaterThan(-1);
    expect(
      levelOne.filter((r) => r.line - 1 > headingAt),
      "a level-one heading BELOW the region heading is the only position from which the widening could shorten the region",
    ).toEqual([]);
  });
});

// ── WR-04 / IN-02 (plan 29-32): the two traversals are ONE, and the `-1` is refused by name ───
//
// WHAT THE DEFECT WAS. `locateExemptRegion` received a `lines` array, joined it into `text`, then
// COUNTED the region's heading over the caller's `lines` while LOCATING it over `text`. Two arrays
// assembled from two expressions, with `fencedLineFlags(text)` — an array indexed in TEXT
// coordinates — consulted at a LINES index. When the caller's array is assembled on a different
// newline rule from the authority's, the two coordinate systems shear apart: the count reads a
// fence flag belonging to some other line, `unfencedHeadingIndex` answers `-1`, and NOTHING checked
// it. `sectionEndIndex(text, -1 + 1, 2)` then bounds the region from line zero and the scan's
// exemption test — `i >= region.headingAt` — is TRUE FOR EVERY LINE FROM ZERO. A safety exemption
// widened to the whole document, reached through a legal answer nobody read.
//
// THE FIX IS IN TWO PARTS AND THE ORDER MATTERS. The DRIFT ROUTE IS DELETED first: both traversals
// walk `scanLines`, derived from `text`, and a caller whose array disagrees with the authority's
// about where the lines are is refused BY NAME rather than silently measured in the wrong
// coordinates. The `-1` guard below it is belt and braces, not the remedy — a guard on a
// disagreement that can still occur is a strictly smaller fix than a disagreement that cannot.
//
// WHICH IS WHY THE `-1` GUARD IS PROVEN THROUGH A SCRATCH BUILD. After the structural half, no
// input reaching this function through its public signature can produce a `-1`; a case that could
// reach it would be evidence the structural half had not landed. So the guard is exercised by
// reverting ONE expression in a copied build — the same falsifiability idiom plan 29-27 used, and
// for its recorded reason: keying a permanent case to a git hash rots the first time the file moves.

/** The fence delimiter, spelled by code, so this file never carries a literal delimiter run. */
const TICKS = String.fromCharCode(96, 96, 96);

/**
 * A caller array assembled on a DIFFERENT newline rule from the authority's — one element carrying
 * embedded separators, which is what `split("\r\n")` over a mixed-ending document produces.
 *
 * The shear it creates is exact and is asserted rather than described below: `lines` has five
 * elements, `lines.join("\n").split("\n")` has seven, and the region heading sits at LINES index 2
 * (where the fence flag belongs to some unrelated line and reads false) and at TEXT index 4 (where
 * the flag really is true, because the heading is inside a fenced example). Count one, locate none.
 */
const DRIFT_LINES: readonly string[] = [
  ["intro", "body", "more"].join("\n"),
  TICKS,
  BANNED_CLAIM_EXEMPT_REGION.heading,
  TICKS,
  "tail",
];

/** The one expression the scratch build reverts, restoring the pre-fix two-array shape exactly. */
const ONE_ARRAY_EXPRESSION = 'const scanLines = text.split("\\n");';
const TWO_ARRAY_EXPRESSION = "const scanLines = lines;";

/**
 * A copy of the committed build with the structural half of the fix reverted and the `-1` guard
 * left in place, so the guard can be watched firing on a build where the disagreement is reachable.
 *
 * Returns the directory. The patch is asserted to have CHANGED the source: a replace that matched
 * nothing would produce a build identical to the shipped one, and the probe would then prove
 * exactly nothing while reporting a clean pass.
 */
function scratchBuildWithTwoTraversals(): string {
  const dir = freshTmp("gops-banned-two-traversals-");
  const src = join(ROOT, "scripts");
  for (const n of readdirSync(src)) {
    if (n.endsWith(".js")) copyFileSync(join(src, n), join(dir, n));
  }
  const target = join(dir, "check-banned-claims.js");
  const before = readFileSync(target, "utf8");
  if (!before.includes(ONE_ARRAY_EXPRESSION)) {
    throw new Error(
      "check-banned-claims.test.ts: the committed build does not carry " +
        `\`${ONE_ARRAY_EXPRESSION}\`, so the scratch revert below would patch nothing and the ` +
        "probe would report a clean pass over an UNMODIFIED build — the harness measuring itself",
    );
  }
  const after = before.replace(ONE_ARRAY_EXPRESSION, TWO_ARRAY_EXPRESSION);
  if (after === before) {
    throw new Error(
      "check-banned-claims.test.ts: the scratch revert changed nothing",
    );
  }
  writeFileSync(target, after, "utf8");
  return dir;
}

/** Call `locateExemptRegion(DRIFT_LINES)` inside a build under `dir`, capturing its stdout. */
function locateUnderBuild(dir: string): { out: string; region: string } {
  const probe = join(dir, "probe.mjs");
  writeFileSync(
    probe,
    [
      'import { locateExemptRegion } from "./check-banned-claims.js";',
      `const lines = ${JSON.stringify(DRIFT_LINES)};`,
      "const r = locateExemptRegion(lines);",
      'process.stdout.write("REGION " + JSON.stringify(r) + "\\n");',
    ].join("\n"),
    "utf8",
  );
  const r = spawnSync("node", [probe], { encoding: "utf8" });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  const m = /REGION (.*)/.exec(out);
  if (m === null) {
    throw new Error(
      `check-banned-claims.test.ts: the probe printed no REGION line — it did not run. Output:\n${out}`,
    );
  }
  return { out, region: m[1] };
}

describe("check-banned-claims — one array under both traversals, and a refused `-1` (WR-04)", () => {
  it("FIXTURE PREMISE: the drift array really does shear the two coordinate systems apart", () => {
    // Every claim below rests on this shape, and a fixture whose shear never formed would make the
    // refusal cases pass for an unrelated reason. Measured through the ONE authority, never retyped.
    const text = DRIFT_LINES.join("\n");
    const textLines = text.split("\n");
    expect(DRIFT_LINES).toHaveLength(5);
    expect(textLines).toHaveLength(7);
    // The heading is an EXACT element of the caller's array — so the pre-fix COUNT sees it…
    expect(DRIFT_LINES[2]).toBe(BANNED_CLAIM_EXEMPT_REGION.heading);
    const flags = fencedLineFlags(text);
    expect(
      flags[2],
      "the fence flag at the LINES index must be false, or the pre-fix count would not have reached one",
    ).toBe(false);
    // …and at its TEXT index it is inside a fenced example, so the LOCATE cannot see it at all.
    expect(textLines[4]).toBe(BANNED_CLAIM_EXEMPT_REGION.heading);
    expect(flags[4]).toBe(true);
    expect(
      unfencedHeadingIndex(text, BANNED_CLAIM_EXEMPT_REGION.heading),
      "the authority must answer -1 on this text, or there is no disagreement to refuse",
    ).toBe(-1);
  });

  it("the drift is REFUSED BY NAME — never a region whose exemption test is true from line zero", () => {
    const region = locateExemptRegion(DRIFT_LINES);
    expect(
      region,
      "a caller array that disagrees with the authority about line boundaries produced a REGION — " +
        "at HEAD that region was {headingAt: -1}, which exempts every line of the document from zero",
    ).toBeNull();
  });

  it("the returned `headingAt` is NEVER negative — asserted directly, not inferred from a null", () => {
    // The property the whole block exists for, stated as itself. Inferring it from "the drift case
    // returned null" would leave the live document unasserted, and the live document is the one the
    // exemption is actually spent on.
    for (const [name, lines] of [
      ["the live exemption document", readFileSync(join(ROOT, PROFILE), "utf8").split("\n")],
      ["the default mirror", profileDoc().split("\n")],
      ["the drift array", DRIFT_LINES as string[]],
    ] as Array<[string, string[]]>) {
      const region = locateExemptRegion(lines);
      if (region === null) continue;
      expect(region.headingAt, name).toBeGreaterThanOrEqual(0);
      expect(region.endBefore, name).toBeGreaterThan(region.headingAt);
    }
  });

  it("ZERO DELTA on correct bytes: the live region equals what the authority answers, independently derived", () => {
    // The fix closes a ROUTE. It must move nothing on bytes that were never drifted, and "nothing
    // moved" is asserted against a derivation this file performs itself rather than against a number
    // copied out of a plan.
    const text = readFileSync(join(ROOT, PROFILE), "utf8");
    const lines = text.split("\n");
    const headingAt = unfencedHeadingIndex(
      text,
      BANNED_CLAIM_EXEMPT_REGION.heading,
    );
    const endBefore = sectionEndIndex(text, headingAt + 1, 2);
    expect(headingAt).toBeGreaterThan(-1);
    const region = locateExemptRegion(lines);
    expect(region).not.toBeNull();
    expect(region!.headingAt).toBe(headingAt);
    expect(region!.endBefore).toBe(endBefore);
  });

  it("THE `-1` GUARD IS SEEN FIRING: a build with the two traversals restored refuses, naming BOTH halves", () => {
    const dir = scratchBuildWithTwoTraversals();
    const { out, region } = locateUnderBuild(dir);
    // The reverted build reaches the disagreement…
    expect(region).toBe("null");
    // …and refuses it by NAME, stating the direction — counted once, located zero times. Naming the
    // direction is what stops the next reader "fixing" this by defaulting the index to zero, which
    // is the failure the guard exists to prevent written out as a remedy.
    expect(out).toContain("COUNTED once and LOCATED zero times");
    expect(out).toContain("refusing rather than exempting from line 0");
    // It must NOT have been refused by the assembly check — that would mean the revert failed to
    // restore the shape and the guard was never reached.
    expect(out).not.toContain("assembled on a different newline rule");
  });

  it("CONTROL: the SHIPPED build refuses the same bytes at the ASSEMBLY check, before any index exists", () => {
    // The other side of the probe. Without it, "the reverted build refuses" is satisfied by a gate
    // that refuses everything. The shipped build refuses too — but for the structural reason, which
    // is the whole point of deleting the route rather than guarding it.
    const dir = freshTmp("gops-banned-shipped-copy-");
    const src = join(ROOT, "scripts");
    for (const n of readdirSync(src)) {
      if (n.endsWith(".js")) copyFileSync(join(src, n), join(dir, n));
    }
    const { out, region } = locateUnderBuild(dir);
    expect(region).toBe("null");
    expect(out).toContain("assembled on a different newline rule");
    expect(out).not.toContain("COUNTED once and LOCATED zero times");
  });

  it("the existing two-sided heading-count refusal still fires in BOTH directions, wording unchanged", () => {
    // A new refusal above an old one is a chance to disarm the old one silently. Both directions are
    // re-run here against the same function, not only through the gate, so a refusal that stopped
    // being reachable would be visible as a null that never came.
    expect(locateExemptRegion(profileDoc({ headings: 0 }).split("\n"))).toBeNull();
    expect(locateExemptRegion(profileDoc({ headings: 2 }).split("\n"))).toBeNull();
    // …and the well-formed document still LOCATES, so the two-sided refusal has not become
    // always-on.
    expect(locateExemptRegion(profileDoc().split("\n"))).not.toBeNull();
  });
});

// ── variant C1 / T-29-23-05 (plan 29-32): the exemption publishes its EXTENT ──────────────────
//
// WHY A SECOND PUBLISHED NUMBER. The reach pin above measures OCCURRENCES — how many banned claims
// sit inside the region. Round 2 met variant C1, an unterminated fence opened inside the region
// with a real `## ` section appended after it, and dismissed it as "nothing new" because the reach
// pin reds the moment the swallowed text carries a banned claim. That reasoning has a hole exactly
// the size of the case below: A CARDINALITY IS BLIND TO MEMBERSHIP BY CONSTRUCTION. A section
// swallowed into a safety exemption while carrying no banned claim moves no occurrence count at
// all, and the prohibition is then switched off over bytes nobody reviewed. The extent — how far
// the region reaches, in lines — is the number such a swallow moves.
//
// THE TWO PINS ARE SIDE BY SIDE AND NEVER FOLDED TOGETHER. One asks how many, the other asks how
// far. A single number answering both would answer neither, which is the conflation this round is
// unpicking.
//
// WHY THIS IS NOT ANOTHER DELIMITER-NEUTRALISED PROJECTION. Plan 29-27 gave `voice-model.ts` such a
// projection so a fence could not decide its own section's extent, and plan 29-32 carries a
// standing prohibition against writing a SECOND private copy of that idiom. None is written here.
// The swallow is caught QUANTITATIVELY, at the point of effect, by the number the swallow moves —
// which also catches the shapes a projection or a delimiter-parity check cannot: a fence that is
// properly CLOSED but closes after the boundary heading, and two unclosed fences whose delimiter
// counts cancel to an even total. Both are asserted below.

describe("check-banned-claims — the exemption publishes its EXTENT (variant C1)", () => {
  /**
   * The C1 document: an unterminated fence opened INSIDE the exemption region, a real `## ` section
   * appended after it, and NO banned claim anywhere in the swallowed text. The swallowed section is
   * the case the occurrence pin cannot see.
   */
  const c1Doc = (): string =>
    profileDoc({
      regionBody: [
        "This profile is an independent work.",
        "",
        `${TICKS}markdown`,
        "An example the author forgot to close.",
      ].join("\n"),
      trailingSection: true,
    });

  /** The same document with the fence TERMINATED — the control that must stay green. */
  const controlDoc = (): string =>
    profileDoc({
      regionBody: [
        "This profile is an independent work.",
        "",
        `${TICKS}markdown`,
        "An example the author closed.",
        TICKS,
      ].join("\n"),
      trailingSection: true,
    });

  const extentOf = (doc: string): number => {
    const region = locateExemptRegion(doc.split("\n"));
    if (region === null) throw new Error("the fixture's region did not locate");
    return region.endBefore - region.headingAt;
  };

  it("the gate PUBLISHES the exemption's extent, and the number is PINNED against a live derivation", () => {
    // Derived from the live document through the gate's own locator, never typed here.
    const lines = readFileSync(join(ROOT, PROFILE), "utf8").split("\n");
    const region = locateExemptRegion(lines);
    expect(region).not.toBeNull();
    const derived = region!.endBefore - region!.headingAt;
    // NON-VACUITY FLOOR FIRST: an extent of zero or one is a region with no body, which the empty
    // refusal already covers and which would make the pin below meaningless.
    expect(derived).toBeGreaterThan(1);
    expect(derived).toBe(BANNED_CLAIM_EXEMPT_EXTENT);

    const r = spawnSync("node", [GATE_JS], { encoding: "utf8" });
    const stdout = (r.stdout ?? "") + (r.stderr ?? "");
    expect(r.status).toBe(0);
    expect(stdout).toContain(
      `reaches ${derived} line(s), pinned at ${BANNED_CLAIM_EXEMPT_EXTENT}`,
    );
  });

  it("VARIANT C1: an unterminated fence swallowing a section that carries NO banned claim REDS on the extent", () => {
    const doc = c1Doc();
    const docLines = doc.split("\n");
    const appendedAt = docLines.indexOf("## After the region");
    // THE FIXTURE'S OWN PREMISE, ASSERTED BEFORE THE VERDICT.
    //  (a) the appended heading really exists and is really flagged FENCED, so the swallow formed;
    //  (b) the swallowed text really carries NO banned claim, so the occurrence pin cannot see it;
    //  (c) the extent really moved. A fixture missing any one of these would make this case pass
    //      while proving something else entirely.
    expect(appendedAt).toBeGreaterThan(-1);
    expect(fencedLineFlags(doc)[appendedAt]).toBe(true);
    expect(
      countBannedClaimOccurrences(
        docLines,
        appendedAt,
        Number.MAX_SAFE_INTEGER,
      ),
      "the swallowed text must carry ZERO banned-claim occurrences, or this case is the occurrence pin firing and says nothing about extent",
    ).toBe(0);
    const moved = extentOf(doc);
    expect(moved).toBeGreaterThan(BANNED_CLAIM_EXEMPT_EXTENT);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-c1-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `reaches ${moved} line(s), and BANNED_CLAIM_EXEMPT_EXTENT`,
    );
    expect(stdout).toContain(`declares ${BANNED_CLAIM_EXEMPT_EXTENT}`);
    expect(stdout).toContain("covers different bytes than the ones it was measured over");
    // AND THE OCCURRENCE PIN STAYED GREEN. That is the whole argument: the swallow is invisible to
    // the number round 2 said already covered it.
    expect(stdout).not.toContain("An exemption GROWING is a decision");
    expect(stdout).not.toContain("An exemption SHRINKING is equally a change");
  });

  it("CONTROL: the same document with the fence TERMINATED stays GREEN — the pin is not refusing everything", () => {
    const doc = controlDoc();
    const docLines = doc.split("\n");
    const appendedAt = docLines.indexOf("## After the region");
    expect(appendedAt).toBeGreaterThan(-1);
    expect(fencedLineFlags(doc)[appendedAt]).toBe(false);
    expect(extentOf(doc)).toBe(BANNED_CLAIM_EXEMPT_EXTENT);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-c1-control-", { plant: { [PROFILE]: doc } }),
    );
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(status).toBe(0);
  });

  it("THE PARITY-BLIND SHAPE IS CAUGHT TOO: a properly CLOSED fence whose close lands PAST the boundary heading", () => {
    // The C1 case above carries an ODD delimiter count, so a document-level delimiter PARITY check
    // of the kind plan 29-28 added to the claim registry would also have caught it. THIS shape is
    // the one parity cannot see: the fence is opened inside the region and CLOSED — an even
    // delimiter count, a well-formed document by the fence grammar — but the close lands after the
    // heading that should have ended the region, so the boundary is swallowed anyway.
    //
    // Plan 29-28 paid for this lesson with a live regression: a parity invariant cannot see errors
    // that cancel. The extent pin is not a parity check. It measures the EFFECT rather than the
    // delimiters, so a swallow that is arithmetically invisible still moves the number.
    const doc = profileDoc({
      regionBody: [
        "This profile is an independent work.",
        "",
        `${TICKS}markdown`,
        "An example whose close lands after the next heading.",
      ].join("\n"),
      trailingSection: true,
    }).concat(`${TICKS}\n`);
    const docLines = doc.split("\n");
    const delimiters = docLines.filter((l) => l.startsWith(TICKS)).length;
    const appendedAt = docLines.indexOf("## After the region");
    // THE PREMISE THAT MAKES THIS THE PARITY-BLIND SHAPE: the delimiter count is EVEN, so the fence
    // is closed at end of file and no parity arithmetic could object — and the boundary heading is
    // nonetheless inside it.
    expect(delimiters % 2).toBe(0);
    expect(delimiters).toBeGreaterThan(0);
    expect(appendedAt).toBeGreaterThan(-1);
    expect(fencedLineFlags(doc)[appendedAt]).toBe(true);
    expect(
      countBannedClaimOccurrences(docLines, appendedAt, Number.MAX_SAFE_INTEGER),
      "the swallowed text must carry ZERO banned-claim occurrences, or the occurrence pin is what reds",
    ).toBe(0);
    expect(extentOf(doc)).toBeGreaterThan(BANNED_CLAIM_EXEMPT_EXTENT);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-parity-blind-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(`declares ${BANNED_CLAIM_EXEMPT_EXTENT}`);
    expect(stdout).not.toContain("An exemption GROWING is a decision");
  });

  it("THE COUNT-PRESERVING COMPENSATING EDIT IS CAUGHT AT THE POINT OF EFFECT, not by the number", () => {
    // FOUND BY ATTACKING THIS PLAN'S OWN EXTENT PIN. A number is blind to membership by
    // construction: swallow K lines behind an unclosed fence while deleting K neutral lines from
    // inside the disclaimer, and the extent lands back on its pin, the reach never moves, and a
    // section nobody reviewed is inside the safety exemption. Measured on a hermetic mirror of the
    // live tree before this check existed, both pins stayed green and the gate exited 0.
    //
    // The mirror below reproduces that shape by arithmetic rather than by hand: the region is
    // padded four lines SHORT of the pin, and the four-line trailing section it swallows puts it
    // back exactly on it.
    const doc = profileDoc({
      regionBody: [
        "This profile is an independent work.",
        "",
        `${TICKS}markdown`,
        "An example the author forgot to close.",
      ].join("\n"),
      trailingSection: true,
      extent: BANNED_CLAIM_EXEMPT_EXTENT - 4,
    });
    const docLines = doc.split("\n");
    const appendedAt = docLines.indexOf("## After the region");
    const region = locateExemptRegion(docLines);
    expect(region).not.toBeNull();
    // THE FIXTURE'S PREMISE, AND IT IS THE WHOLE CASE: the swallow really happened AND BOTH
    // published numbers are exactly on their pins. A fixture that missed either would be caught by
    // a pin that already existed, and would prove nothing about this check.
    expect(appendedAt).toBeGreaterThan(region!.headingAt);
    expect(appendedAt).toBeLessThan(region!.endBefore);
    expect(fencedLineFlags(doc)[appendedAt]).toBe(true);
    expect(
      region!.endBefore - region!.headingAt,
      "the compensating edit must leave the extent EXACTLY on its pin, or the extent pin is what reds",
    ).toBe(BANNED_CLAIM_EXEMPT_EXTENT);
    expect(
      countBannedClaimOccurrences(
        docLines,
        region!.headingAt,
        region!.endBefore,
      ),
      "…and the reach EXACTLY on its pin, or the occurrence pin is what reds",
    ).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-compensating-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("ENDS INSIDE A FENCED BLOCK");
    expect(stdout).toContain("SWALLOWED into a safety exemption");
    // Neither number moved. That is the point: this red is attributable to the point-of-effect
    // check alone, and the two pins are demonstrably not what caught it.
    expect(stdout).not.toContain("An exemption GROWING is a decision");
    expect(stdout).not.toContain("BANNED_CLAIM_EXEMPT_EXTENT in scripts");
  });

  it("CONTROL for that check: a region containing a properly CLOSED fenced example stays GREEN", () => {
    // The other side, and the half that makes the check usable rather than merely strict. WR-06's
    // legitimate case — a `## ` line QUOTED inside a closed fenced example, with the region
    // deliberately continuing past it — must not be refused as a swallow.
    const doc = profileDoc({ regionBody: REGION_WITH_FENCED_HEADING });
    const docLines = doc.split("\n");
    const region = locateExemptRegion(docLines);
    expect(region).not.toBeNull();
    const flags = fencedLineFlags(doc);
    // PREMISE: the region really does contain fenced lines, and really does NOT end inside one.
    expect(flags.slice(region!.headingAt, region!.endBefore).some(Boolean)).toBe(
      true,
    );
    expect(flags[region!.endBefore - 1]).toBe(false);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-closed-example-", { plant: { [PROFILE]: doc } }),
    );
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(status).toBe(0);
  });

  it("FALSIFIABLE, direction DOWN: a region one line SHORTER also reds — the extent pin is two-sided", () => {
    // A one-sided pin accepts every future shrink in silence. A shrinking exemption is equally a
    // change somebody made, and it is the direction that says the disclaimer stopped covering what
    // it was measured over.
    const doc = profileDoc({ extent: BANNED_CLAIM_EXEMPT_EXTENT - 1 });
    expect(extentOf(doc)).toBe(BANNED_CLAIM_EXEMPT_EXTENT - 1);
    const { status, stdout } = runGate(
      makeMirror("gops-banned-extent-down-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `reaches ${BANNED_CLAIM_EXEMPT_EXTENT - 1} line(s), and BANNED_CLAIM_EXEMPT_EXTENT`,
    );
    // The reach is untouched by a padding line, so this red is attributable to the extent alone.
    expect(stdout).not.toContain("An exemption GROWING is a decision");
  });

  it("THE TWO PINS ANSWER DIFFERENT QUESTIONS: each fires with the other green, in both directions", () => {
    // The distinction, asserted rather than described. If either pin subsumed the other, one of
    // these four runs would carry both messages — and a reader would be right to fold them.
    const occurrenceOnly = profileDoc({
      reach: BANNED_CLAIM_EXEMPT_SUPPRESSED + 1,
    });
    const extentOnly = profileDoc({ extent: BANNED_CLAIM_EXEMPT_EXTENT + 1 });
    // PREMISE: each fixture really moves ONE of the two numbers and not the other.
    expect(extentOf(occurrenceOnly)).toBe(BANNED_CLAIM_EXEMPT_EXTENT);
    expect(extentOf(extentOnly)).toBe(BANNED_CLAIM_EXEMPT_EXTENT + 1);

    const a = runGate(
      makeMirror("gops-banned-occ-only-", { plant: { [PROFILE]: occurrenceOnly } }),
    );
    expect(a.status).toBe(1);
    expect(a.stdout).toContain("An exemption GROWING is a decision");
    expect(a.stdout).not.toContain("BANNED_CLAIM_EXEMPT_EXTENT");

    const b = runGate(
      makeMirror("gops-banned-ext-only-", { plant: { [PROFILE]: extentOnly } }),
    );
    expect(b.status).toBe(1);
    expect(b.stdout).toContain("BANNED_CLAIM_EXEMPT_EXTENT");
    expect(b.stdout).not.toContain("An exemption GROWING is a decision");
  });
});

// ── CR-01: the changelog is a scanned document, not an inherited blind spot ───────────────────

/**
 * THE PLANT, COMPOSED FROM A PINNED MEMBER RATHER THAN RETYPED.
 *
 * `TOKEN_CLAIM` is selected from `BANNED_CLAIM_LITERALS` and pinned by the selection case at the top
 * of this file, so this fixture keeps testing the member it names on the day that member is renamed.
 * A retyped `"token economy"` here would go on matching a literal the authority no longer declares.
 *
 * The prefix is a separate constant because the ASSERTION below is on the rendered COLUMN, and a
 * column asserted as a magic number is a column nobody can check.
 */
const CHANGELOG_PLANT_PREFIX = "- Compaction shipped as a ";
const CHANGELOG_PLANT_LINE = `${CHANGELOG_PLANT_PREFIX}${TOKEN_CLAIM.literal} win.`;
/** 1-based line and column of the plant inside CHANGELOG_PLANT, derived from the document above. */
const CHANGELOG_PLANT_AT = {
  line: 3,
  column: CHANGELOG_PLANT_PREFIX.length + 1,
};
const CHANGELOG_PLANT = [
  "# Changelog",
  "",
  CHANGELOG_PLANT_LINE,
  "",
].join("\n");

describe("check-banned-claims — CHANGELOG.md is INSIDE the scan set (round 6, CR-01)", () => {
  it("names a banned literal planted in CHANGELOG.md at file:line:column", () => {
    // THE CASE THAT WOULD HAVE MADE CR-01 IMPOSSIBLE TO SHIP, AND THE REASON IT DID NOT EXIST.
    //
    // Until round 6 this gate imported `publicDocsScan()` from check-public-docs-vocabulary.ts.
    // That function answers "which public documents does the RETIRED-VOCABULARY check apply to",
    // and it subtracts CHANGELOG.md for a reason argued about retired vocabulary and about nothing
    // else. This gate inherited the subtraction, so its PASS line claimed a scope one document wider
    // than the set it read — and two live `token-economy` occurrences sat in that document,
    // unscanned, while the identical bytes in README.md went red.
    //
    // ASSERTED ON THE RENDERED FINDING, NEVER ON THE EXIT CODE ALONE. This file's mirror carries
    // several two-sided pins, and any of them can make the exit non-zero for a reason that has
    // nothing to do with this plant. A case that only checked `status === 1` would have passed
    // against the defective gate the day a pin happened to be off.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-changelog-", {
        plant: { [CHANGELOG]: CHANGELOG_PLANT },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `${CHANGELOG}:${CHANGELOG_PLANT_AT.line}:${CHANGELOG_PLANT_AT.column} — ` +
        `banned ${TOKEN_CLAIM.group} literal "${TOKEN_CLAIM.literal}"`,
    );
    // Exactly one finding: the plant, and no second one smuggled in by the fixture.
    expect(findingCount(stdout)).toBe(1);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("the changelog is a MEMBER of the derived scan set, and the pin counts it", () => {
    // The membership half, stated over the LIVE tree rather than inferred from the finding above.
    // Deliberately NOT the mirror: the finding case already proves the mirror's changelog is read,
    // and the question here is whether THIS REPOSITORY's changelog is inside THIS gate's set. It
    // was not, for the whole of rounds 1–5, while every mirror-scoped case in this file passed.
    const live = bannedClaimScan();
    expect(live).toContain(CHANGELOG);
    expect(live.length).toBe(BANNED_CLAIM_SCAN_COUNT);
    // Floor: a one-element set would satisfy `toContain` and prove nothing about the derivation.
    expect(live.length).toBeGreaterThan(1);
  });
});

// ── WR-02: no tracked markdown sits outside the gate without a written decision ────────────────

describe("check-banned-claims — every tracked text path is scanned or excluded BY NAME", () => {
  it("the remainder of the tracked TEXT SURFACE minus the scan is covered by an entry of the list", () => {
    // WHAT THIS CASE REPLACES, AND WHY A PARAGRAPH WAS NOT ENOUGH.
    //
    // BANNED_CLAIM_EXCLUDED_LOCATIONS's block header has always said an exclusion must "read as a
    // decision rather than … a silent omission". Nothing enforced it, so five classes accumulated
    // outside the scan set and outside the block — install/README.md, .claude/, memory-bank/,
    // plans/ and skills/ — and four rounds of review found four of them. The fifth, skills/, was
    // found only by deriving the remainder. This case derives it every run, so the sixth class reds
    // on the day it lands.
    //
    // ── AND THE DENOMINATOR WAS ITSELF THE NEXT FINDING (round 7, CR-02) ────────────────────
    //
    // Round 6 dispositioned every unscanned class BY NAME against a denominator of `*.md`. So every
    // class it COULD surface was a markdown class, and the markdown boundary was never a decision
    // anybody made — it was the shape of this line. The two shipped JSON manifests that carry the
    // kit's public-facing description sat outside the scan AND outside the exclusion list AND
    // outside this case, all at once, and no amount of naming markdown classes could ever have
    // reached them. A DENOMINATOR DECIDES WHAT CAN BE FOUND MISSING.
    //
    // The denominator is now the tracked TEXT SURFACE — markdown and JSON together — so the next
    // non-markdown claim surface reds on the day it lands rather than four rounds later.
    //
    // TRACKED, not a filesystem walk: the question is what this repository SHIPS AND VERSIONS. A
    // scratch file in someone's working tree is not a class anyone must disposition.
    const tracked = execFileSync("git", ["ls-files", "*.md", "*.json"], {
      encoding: "utf8",
      cwd: ROOT,
    })
      .trim()
      .split("\n")
      .filter((p) => p.length > 0);

    // THE CARDINALITY, DERIVED INDEPENDENTLY OF THE LOOP THAT CONSUMES IT. A floor catches an EMPTY
    // remainder; only a count taken by a different route catches a SILENTLY SHORT one — which is
    // this repository's standing remedy, and the reason the numbers below are two derivations and
    // not one.
    const scanned = new Set(bannedClaimScan());
    const remainder = tracked.filter((p) => !scanned.has(p));
    const remainderSize = tracked.length - tracked.filter((p) => scanned.has(p)).length;
    expect(remainder.length).toBe(remainderSize);

    // FLOORS. An empty `tracked` (a `git ls-files` that failed and returned nothing) and an empty
    // remainder would each satisfy the loop below vacuously, and for opposite reasons.
    expect(tracked.length).toBeGreaterThan(BANNED_CLAIM_SCAN_COUNT);
    expect(remainder.length).toBeGreaterThan(0);
    expect(BANNED_CLAIM_EXCLUDED_LOCATIONS.length).toBeGreaterThan(0);

    // Assert on the UNCOVERED LIST rather than on a boolean, so a failure names the paths.
    const uncovered = remainder.filter((p) => !bannedClaimExcluded(p));
    expect(uncovered).toEqual([]);
  });

  it("THE MISSING DIRECTION: every scan member is a TRACKED path, and an intruder is NAMED", () => {
    // WHAT THIS ANSWERS THAT THE OTHER CANNOT. The case above says NOTHING THIS REPOSITORY VERSIONS
    // IS UNACCOUNTED FOR. It says nothing at all about the opposite: a member the repository does
    // NOT version, entering the scan unnoticed. That is the direction WR-01's nested plant walked
    // through — an untracked worktree checkout contributed two members and this file's guards were
    // silent, because one asserted a prefix relationship that is TRUE for a nested path and the
    // other only ever subtracted the scan FROM the tracked set.
    const tracked = execFileSync("git", ["ls-files", "*.md", "*.json"], {
      encoding: "utf8",
      cwd: ROOT,
    })
      .trim()
      .split("\n")
      .filter((p) => p.length > 0);
    // THE FLOOR COMES FIRST. A `git ls-files` that returned nothing would satisfy BOTH directions
    // vacuously — the remainder would be everything and this difference would be everything, and
    // an empty tracked set makes each of those the wrong shape of true.
    expect(tracked.length).toBeGreaterThan(BANNED_CLAIM_SCAN_COUNT);
    const trackedSet = new Set(tracked);
    const scan = bannedClaimScan();
    expect(scan.length).toBe(BANNED_CLAIM_SCAN_COUNT);
    // Reported as a LIST so a failure names the intruder rather than saying `false`.
    const intruders = scan.filter((p) => !trackedSet.has(p));
    expect(intruders).toEqual([]);
  });

  it("THE EQUALITY, so nothing is dropped in silence: surfaced == admitted + excluded-by-name", () => {
    // A round that closes a DENOMINATOR finding by widening a denominator must publish the new
    // denominator's own arithmetic. Every path the widened denominator surfaces is either a scan
    // member or covered by a named entry — and the two counts are derived separately and summed
    // against the whole, so a path falling through both would break the equality rather than
    // disappear from a filter.
    const tracked = execFileSync("git", ["ls-files", "*.md", "*.json"], {
      encoding: "utf8",
      cwd: ROOT,
    })
      .trim()
      .split("\n")
      .filter((p) => p.length > 0);
    const scanned = new Set(bannedClaimScan());
    const admitted = tracked.filter((p) => scanned.has(p));
    const excludedByName = tracked.filter(
      (p) => !scanned.has(p) && bannedClaimExcluded(p),
    );
    expect(admitted.length + excludedByName.length).toBe(tracked.length);
    // Both sides non-vacuous, so the equality cannot hold because one of them is everything.
    expect(admitted.length).toBeGreaterThan(0);
    expect(excludedByName.length).toBeGreaterThan(0);
    // AND THE NON-MARKDOWN HALF IS THE POINT: the widened denominator surfaced JSON, and every
    // JSON path it surfaced is dispositioned — two admitted, the rest excluded by name.
    const json = tracked.filter((p) => p.endsWith(".json"));
    expect(json.filter((p) => scanned.has(p)).sort()).toEqual([
      ".claude-plugin/marketplace.json",
      ".claude-plugin/plugin.json",
    ]);
    expect(
      json.filter((p) => !scanned.has(p) && !bannedClaimExcluded(p)),
    ).toEqual([]);
  });

  it("every excluded prefix still covers something, so a stale prefix cannot hide a live class", () => {
    // The other direction. An entry left behind after its directory was admitted or deleted looks
    // like a decision and covers nothing — and the case above would go on passing while the array
    // drifted into fiction. Both directions, because one says nothing about the other.
    //
    // (Round 7, CR-02) The DENOMINATOR is markdown AND json, because the list now names exact JSON
    // paths. Asking a markdown-only question of a list that names JSON would report every one of
    // those entries as dead — the same denominator defect this round is closing, re-created inside
    // the case that guards against it.
    const tracked = execFileSync("git", ["ls-files", "*.md", "*.json"], {
      encoding: "utf8",
      cwd: ROOT,
    })
      .trim()
      .split("\n")
      .filter((p) => p.length > 0);
    expect(tracked.length).toBeGreaterThan(0);
    const dead = BANNED_CLAIM_EXCLUDED_LOCATIONS.filter(
      (entry) => !tracked.some((p) => bannedClaimExcludedBy(p, entry)),
    );
    expect(dead).toEqual([]);
  });

  it("THE DEAD-ENTRY CASE COVERS ALL THREE KINDS: a fiction of each kind reds by name", () => {
    // An entry that covers nothing looks like a decision and IS fiction. That is true of a segment
    // class, of a root directory and of an exact path — so the case must ask the RIGHT QUESTION OF
    // EACH KIND rather than one question of all three. `bannedClaimExcludedBy` is the gate's own
    // per-entry grammar, so this asks the same question the coverage answer and the walk do.
    const tracked = execFileSync("git", ["ls-files", "*.md", "*.json"], {
      encoding: "utf8",
      cwd: ROOT,
    })
      .trim()
      .split("\n")
      .filter((p) => p.length > 0);
    expect(tracked.length).toBeGreaterThan(0);
    for (const fiction of [
      "**/no-such-segment/",
      "no-such-root-dir/",
      "no/such/exact-path.json",
    ]) {
      const covers = tracked.filter((p) => bannedClaimExcludedBy(p, fiction));
      expect(covers, fiction).toEqual([]);
    }
    // AND THE CONTROL, one per kind, so "covers nothing" is not satisfied by a predicate that
    // covers nothing for everything. Each live entry of each kind covers at least one tracked path.
    for (const live of [
      bannedClaimExcludedSegments()[0] !== undefined
        ? `**/${bannedClaimExcludedSegments()[0]}/`
        : "",
      bannedClaimExcludedRootDirs()[0],
      bannedClaimExcludedExactPaths()[0],
    ]) {
      expect(
        tracked.some((p) => bannedClaimExcludedBy(p, live as string)),
        live as string,
      ).toBe(true);
    }
  });
});

// ── CR-02: the kit's SHIPPED JSON MANIFESTS are inside the gate that claims to hold them ──────
//
// `.claude-plugin/marketplace.json`'s `description` is the exact string a user meets running
// `/plugin marketplace add`; `.claude-plugin/plugin.json`'s is shown in the plugin manager. Both
// ship. Until round 7 no gate in this repository read either, and the round-6 code review and the
// round-6 verification INDEPENDENTLY planted a claim into the marketplace description and watched
// all seven gates exit 0 with the planted string never named.
//
// The plants below are the VERIFIER'S OWN, byte for byte, not a paraphrase of it.
const CR02_PLANT =
  "grugops marketplace — controlled language that improves comprehension for " +
  "language models and saves tokens.";

/** A manifest carrying `body` as its description, written the way the shipped ones are. */
function manifestWith(body: string): string {
  return `${JSON.stringify({ name: "grugops", description: body }, null, 2)}\n`;
}

describe("check-banned-claims — a banned claim in a SHIPPED manifest reds by name", () => {
  it("the marketplace description: the verifier's exact plant, named at file:line:column", () => {
    // THE PREMISE IS ASSERTED BEFORE THE PLANT. A mirror that was already red would make "exit 1"
    // mean nothing, and this is the case whose entire subject is a gate that used to exit 0.
    const clean = makeMirror("gops-banned-cr02-premise-");
    const before = runGate(clean);
    expect(before.stdout).toContain(
      `0 findings over ${BANNED_CLAIM_SCAN_COUNT}/${BANNED_CLAIM_SCAN_COUNT} elements`,
    );
    expect(before.stdout).toContain("ALL CHECKS PASSED");
    expect(before.status).toBe(0);

    const doc = manifestWith(CR02_PLANT);
    const mirror = makeMirror("gops-banned-cr02-market-", {
      plant: { ".claude-plugin/marketplace.json": doc },
    });
    // THE PLANT IS CONFIRMED ON DISK, in the bytes the gate will read.
    expect(
      readFileSync(join(mirror, ".claude-plugin/marketplace.json"), "utf8"),
    ).toContain("improves comprehension");

    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    // NAMED AT file:line:column, which is what the raw-byte line scan buys and what a
    // decoded-value scan could not have reported.
    expect(stdout).toMatch(
      /\.claude-plugin\/marketplace\.json:3:\d+ — banned comprehension literal "improves comprehension"/,
    );
    expect(stdout).toMatch(
      /\.claude-plugin\/marketplace\.json:3:\d+ — banned token-economy literal "saves tokens"/,
    );
    // Three findings, exactly as the review predicted for any .md of the corpus.
    expect(findingCount(stdout)).toBe(3);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("the plugin manifest's description reds from THIS gate, not from a sibling's presence check", () => {
    // plugin.json was only ACCIDENTALLY half-covered: a registry row happens to quote its
    // description, so mutating it tripped check-claim-anchors on PRESENCE — not on content, and
    // only for that one field. This assertion is scoped to THIS gate's own finding line.
    const mirror = makeMirror("gops-banned-cr02-plugin-", {
      plant: { ".claude-plugin/plugin.json": manifestWith(CR02_PLANT) },
    });
    expect(
      readFileSync(join(mirror, ".claude-plugin/plugin.json"), "utf8"),
    ).toContain("saves tokens");
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toMatch(
      /\.claude-plugin\/plugin\.json:3:\d+ — banned comprehension literal "improves comprehension"/,
    );
    expect(findingCount(stdout)).toBe(3);
  });

  it("an ESCAPED banned literal is REFUSED BY NAME — the branch the encoding decision did not take", () => {
    // THE PERMANENT CASE FOR THE ROAD NOT TAKEN. The scan reads raw bytes, so a claim written as a
    // unicode escape is invisible to it and fully visible to a reader. The canonical-form assertion
    // is what closes that hole with a REFUSAL rather than leaving it as a silent branch.
    const escaped =
      '{\n  "name": "grugops",\n  "description": "grugops \\u0073aves tokens for readers."\n}\n';
    const mirror = makeMirror("gops-banned-escape-", {
      plant: { ".claude-plugin/marketplace.json": escaped },
    });
    const raw = readFileSync(
      join(mirror, ".claude-plugin/marketplace.json"),
      "utf8",
    );
    // THE FIXTURE'S OWN PREMISE: the banned literal is NOT byte-present, and IS present once
    // decoded. Without both halves this case could pass while testing something else entirely.
    expect(raw).not.toContain("saves tokens");
    expect(String(JSON.parse(raw).description)).toContain("saves tokens");

    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain("decoded value is NOT byte-present in the file");
    expect(stdout).toContain("write the string LITERALLY");
    // And the line scan found NOTHING, which is exactly why the refusal has to exist.
    expect(findingCount(stdout)).toBe(0);
  });

  it("an UNPARSEABLE manifest is refused by name AND still scanned", () => {
    // A parse failure removes the canonical-form GUARANTEE. It must not remove the scan — the line
    // scan needs no parse, and a manifest somebody broke is the likeliest place for a claim to hide.
    const broken =
      '{\n  "description": "grugops improves comprehension for models",\n';
    const mirror = makeMirror("gops-banned-unparseable-", {
      plant: { ".claude-plugin/marketplace.json": broken },
    });
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain("does not parse as JSON");
    expect(stdout).toContain(
      "The line scan over its raw bytes STILL RAN",
    );
    // THE HALF THAT MATTERS: the finding is reported anyway, at file:line:column.
    expect(stdout).toMatch(
      /\.claude-plugin\/marketplace\.json:2:\d+ — banned comprehension literal "improves comprehension"/,
    );
  });

  it("an ABSENT manifest directory is a named refusal AND reds through the per-part vacuity floor", () => {
    // The `empty` probe row's answer. Both halves are required: the refusal says WHAT is missing,
    // and the empty member list is what the floor NOTICES. A literal member list could never reach
    // the floor, which is why the part is derived against disk despite naming two files today.
    const mirror = makeMirror("gops-banned-nomanifest-", { pluginManifests: [] });
    expect(existsSync(join(mirror, ".claude-plugin"))).toBe(false);
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain("A missing manifest is not a clean one");
    expect(stdout).toContain(
      'the "pluginManifests" part of the banned-claim scan set derived ZERO members',
    );
    expect(stdout).toContain(
      `derived ${BANNED_CLAIM_SCAN_COUNT - 2} document(s), expected exactly ${BANNED_CLAIM_SCAN_COUNT}`,
    );
  });

  it("A THIRD MANIFEST ENTERS BY EXISTING, so the pair is derived and not a set literal", () => {
    // The set-literal-drift prohibition, made behavioural. A hardcoded two-path list would ignore a
    // third file; the walk moves the count and reds by name.
    const mirror = makeMirror("gops-banned-thirdmanifest-", {
      pluginManifests: [
        ...PLUGIN_MANIFESTS,
        ".claude-plugin/extra.json",
      ],
    });
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain(
      `derived ${BANNED_CLAIM_SCAN_COUNT + 1} document(s), expected exactly ${BANNED_CLAIM_SCAN_COUNT}`,
    );
    expect(stdout).toContain("pluginManifests 3");
  });
});

// ── WR-01: the exclusion is anchored AT THE WALK, so nesting cannot defeat it ──────────────────
//
// Round 6 admitted `.claude/` as a recursive DISK WALK. The exclusions were prefix tests on the
// derived RELATIVE PATH, so a nested copy of an excluded directory carried none of its prefix — and
// `.claude/worktrees/` is exactly where this project's own execution tooling puts isolated
// worktrees. The reviewer planted two files under it and the gate reported findings ON THE CLAIM
// REGISTRY ITSELF and on a planning document, verbatim the harm the `docs/` exclusion exists to
// prevent, while BOTH guarding assertions stayed green: one asserted a prefix relationship that is
// TRUE for a nested path, and the other only ever asked `tracked ⊆ scan ∪ excluded`.
describe("check-banned-claims — an excluded directory is excluded WHEREVER it appears", () => {
  it("a NESTED copy of an excluded directory contributes NOTHING — the reviewer's own plant", () => {
    // The reviewer's exact construction: a worktree-shaped checkout under a WALKED directory,
    // carrying a claim-registry copy and a planning document. On the pre-change build this moved
    // the scan count to 117 and produced three findings; the transcript is quoted in 29-53-SUMMARY.
    const mirror = makeMirror("gops-banned-nested-");
    const nest = join(mirror, ".claude", "worktrees", "phase-30");
    mkdirSync(join(nest, ".planning"), { recursive: true });
    mkdirSync(join(nest, "docs", "audit"), { recursive: true });
    writeFileSync(
      join(nest, ".planning", "29-99-PLAN.md"),
      `The plan discusses the ${TOKEN_CLAIM.literal} of the kit.\n`,
      "utf8",
    );
    writeFileSync(
      join(nest, "docs", "audit", "claim-registry.md"),
      `The registry quotes a claim naming ${DISCIPLINE_NAME.literal}.\n`,
      "utf8",
    );
    // THE PLANT IS CONFIRMED ON DISK before the run. A case whose fixture silently failed to write
    // would report "no findings" and read exactly like a closure.
    expect(existsSync(join(nest, ".planning", "29-99-PLAN.md"))).toBe(true);
    expect(existsSync(join(nest, "docs", "audit", "claim-registry.md"))).toBe(
      true,
    );

    const { status, stdout } = runGate(mirror);
    // The count is UNMOVED — the two planted files are not members — and nothing is reported.
    expect(stdout).toContain(
      `0 findings over ${BANNED_CLAIM_SCAN_COUNT}/${BANNED_CLAIM_SCAN_COUNT} elements`,
    );
    expect(stdout).not.toContain("worktrees");
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(status).toBe(0);
  });

  it("CONTROL: the same two files planted where they are NOT nested under an excluded segment DO red", () => {
    // Without this, "the nested plant is silent" is satisfied by a gate that stopped reading
    // `.claude/` at all. Same bytes, same depth, a directory name that is NOT a segment class.
    const mirror = makeMirror("gops-banned-nested-control-");
    const nest = join(mirror, ".claude", "worktrees", "phase-30", "notes");
    mkdirSync(nest, { recursive: true });
    writeFileSync(
      join(nest, "29-99-PLAN.md"),
      `The plan discusses the ${TOKEN_CLAIM.literal} of the kit.\n`,
      "utf8",
    );
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain(
      ".claude/worktrees/phase-30/notes/29-99-PLAN.md:1:24",
    );
    expect(stdout).toContain(
      `derived ${BANNED_CLAIM_SCAN_COUNT + 1} document(s), expected exactly ${BANNED_CLAIM_SCAN_COUNT}`,
    );
  });

  it("the three projections PARTITION the one list — cardinalities two-sided, and their sum is the length", () => {
    // ONE LIST, THREE PROJECTIONS. They cannot drift apart from each other; what they CAN do is
    // leave an entry belonging to none, which would contribute to neither the walk nor the coverage
    // answer — the same silence the exclusion block exists to prevent, moved somewhere new. The sum
    // is what forbids it, and each cardinality is pinned two-sided so a projection that quietly
    // gained or lost a member is an acknowledged edit.
    const seg = bannedClaimExcludedSegments();
    const root = bannedClaimExcludedRootDirs();
    const exact = bannedClaimExcludedExactPaths();
    expect(seg).toEqual(["docs", ".planning", "scripts"]);
    expect(root).toEqual([".gemini/", "memory-bank/", "plans/"]);
    expect(exact.length).toBe(7);
    expect(seg.length + root.length + exact.length).toBe(
      BANNED_CLAIM_EXCLUDED_LOCATIONS.length,
    );
    // FLOOR: three empty projections would satisfy a sum of zero against an empty list.
    expect(BANNED_CLAIM_EXCLUDED_LOCATIONS.length).toBeGreaterThan(0);
  });

  it("THE PARTITION IS SEEN FAILING: an entry fitting no projection breaks the sum", () => {
    // RED-proven rather than argued. The predicate is the SAME three projections applied to a list
    // with one fictional entry appended, so the case exercises the rule and not a copy of it.
    const withStray = [...BANNED_CLAIM_EXCLUDED_LOCATIONS, "**/stray"];
    const seg = withStray.filter(
      (e) => e.startsWith("**/") && e.endsWith("/"),
    ).length;
    const root = withStray.filter(
      (e) => !e.startsWith("**/") && e.endsWith("/"),
    ).length;
    const exact = withStray.filter((e) => !e.endsWith("/")).length;
    // `**/stray` reads as an EXACT path under the list's rule, which is precisely the wrong answer —
    // an entry that LOOKS like a segment class and is silently treated as a literal filename. The
    // sum still holds, so the sum alone is not the whole guard; the enumerated projections above are.
    expect(seg + root + exact).toBe(withStray.length);
    expect(seg).toBe(bannedClaimExcludedSegments().length);
    expect(exact).toBe(bannedClaimExcludedExactPaths().length + 1);
  });

  it("NO SEGMENT-CLASS NAME SITS BELOW THE ROOT OF A LIVE SCAN MEMBER — the fix removed nothing", () => {
    // THE CASE THAT WOULD HAVE RED-ED THE REVIEW'S OWN SUGGESTED FIX, and the reason this list has
    // three kinds rather than two. The suggested segment set included `memory-bank` and `plans`.
    // `agent-factory/seed/plans/` and `agent-factory/seed/memory-bank/` hold 13 markdown files that
    // are SCAN MEMBERS — the templates the kit ships — so that projection would have deleted
    // thirteen shipped documents from a safety scan inside the fix for a fail-open.
    //
    // This asserts the property directly: no member of the LIVE scan contains a segment-class name
    // among its directory components. The day the kit ships an `agent-factory/**/docs/`, this reds
    // rather than the walk silently dropping it.
    const segs = bannedClaimExcludedSegments();
    const offenders = bannedClaimScan().filter((m) =>
      m.split("/").slice(0, -1).some((c) => segs.includes(c)),
    );
    expect(offenders).toEqual([]);
    // AND THE MEASUREMENT THAT MAKES THE THREE-KIND RULE NECESSARY, asserted rather than recounted:
    // the two root-anchored names DO occur below the root of live scan members.
    const seedMembers = bannedClaimScan().filter((m) =>
      m
        .split("/")
        .slice(0, -1)
        .some((c) => c === "plans" || c === "memory-bank"),
    );
    expect(seedMembers.length).toBe(13);
    // …and every one of them is a kit path, not a root-level dogfood path.
    for (const m of seedMembers) expect(m.startsWith("agent-factory/")).toBe(true);
  });

  it("ONE WALK BUDGET IN THIS MODULE, pinned two-sided, with the cross-module boundary declared", () => {
    // IN-03. The bound was single-sourced and the BUDGET was not: a fresh tally per part made the
    // gate's effective allowance a MULTIPLE of the declared bound, and a sixth part would have made
    // it larger. Counted over the SOURCE, because the property is "how many allowances exist", which
    // no run can report.
    const src = readFileSync(GATE_TS, "utf8");
    expect((src.match(/\{ examined: 0 \}/g) ?? []).length).toBe(1);
    // Every in-module walk takes THAT object. Three walks in this module plus the manifest part.
    expect((src.match(/walkFiles\([A-Z_]+, WALK_BUDGET, acc\)/g) ?? []).length).toBe(4);
    // The boundary this module cannot thread is DECLARED rather than left as a gap.
    expect(src).toContain("2 x MAX_WALK_ENTRIES");
  });

  it("the tracked-set membership alternative is REJECTED IN WRITING, with its reason", () => {
    // A rejected alternative that is not written down is an alternative the next reviewer proposes
    // again. Asserted on the source so the paragraph cannot be deleted while the decision stands.
    const src = readFileSync(GATE_TS, "utf8");
    expect(src).toContain("A mirror is NOT a git repository");
    expect(src).toContain("a fallback is a SECOND MEMBERSHIP RULE");
    expect(src).toContain("scripts/check-nul-bytes.ts");
  });
});

// ── Vacuity and the two-sided pin ─────────────────────────────────────────────────────────────

describe("check-banned-claims — vacuity is refused by name, per part, before the pin", () => {
  it("refuses a publicDocs part that derives ZERO members, by its own name", () => {
    // BOTH parts are asserted, because a floor proven on one says nothing about the other — and the
    // floor is per-part precisely so one part emptying out cannot hide behind the other's members.
    const mirror = makeMirror("gops-banned-vacuous-pub-");
    for (const f of [...DEFAULT_ROOT_DOCS, CHANGELOG])
      rmSync(join(mirror, f), { force: true });
    rmSync(join(mirror, "examples"), { recursive: true, force: true });
    rmSync(join(mirror, KIT_README), { force: true });
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain(
      'the "publicDocs" part of the banned-claim scan set derived ZERO members',
    );
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("refuses a TRULY empty kit part by name, and the floor is printed BEFORE the pin", () => {
    const mirror = makeMirror("gops-banned-vacuous2-", {
      kitFillers: [],
      omitProfile: true,
    });
    rmSync(join(mirror, KIT_README), { force: true });
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain(
      'the "kit" part of the banned-claim scan set derived ZERO members',
    );
    expect(stdout).toContain("a vacuous scan set");
    // Ordering: the per-part floor is consulted BEFORE the aggregate pin, so a reader meets the
    // reason before the arithmetic.
    const floorAt = stdout.indexOf('the "kit" part');
    const pinAt = stdout.indexOf("banned-claim scan set derived ");
    expect(floorAt).toBeGreaterThanOrEqual(0);
    expect(pinAt).toBeGreaterThan(floorAt);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("fails the two-sided pin when the corpus is SHORT BY ONE, naming both numbers", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-short-", {
        kitFillers: defaultFillers().slice(0, FILLER_COUNT - 1),
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `derived ${BANNED_CLAIM_SCAN_COUNT - 1} document(s), expected exactly ${BANNED_CLAIM_SCAN_COUNT}`,
    );
    expect(stdout).toContain("BANNED_CLAIM_SCAN_COUNT");
    expect(stdout).toContain("moving the pin is how you acknowledge that it did");
  });

  it("fails the two-sided pin when a BRAND-NEW kit document appears, proving membership self-derives", () => {
    // The planted file's name appears in no list anywhere in this repository. If kit membership
    // were hand-listed, this file would be invisible.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-grew-", {
        kitFillers: [
          ...defaultFillers(),
          "agent-factory/checklists/99-brand-new.md",
        ],
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `derived ${BANNED_CLAIM_SCAN_COUNT + 1} document(s), expected exactly ${BANNED_CLAIM_SCAN_COUNT}`,
    );
  });
});

// ── The live tree ─────────────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the derived pin against the live tree", () => {
  it("derives exactly BANNED_CLAIM_SCAN_COUNT documents, both directions", () => {
    const live = bannedClaimScan();
    expect(live.length).toBe(BANNED_CLAIM_SCAN_COUNT);
    expect(live.length).not.toBe(BANNED_CLAIM_SCAN_COUNT - 1);
    expect(live.length).not.toBe(BANNED_CLAIM_SCAN_COUNT + 1);
  });

  it("every part is non-empty and the overlap arithmetic is the one the PASS line reports", () => {
    // (Round 6, WR-02) Two parts became five. The names are pinned as an ARRAY IN ORDER rather than
    // counted, because the PASS line prints this breakdown in this order and a reader checking the
    // arithmetic is checking these labels. A part renamed, reordered or dropped reds here.
    expect(BANNED_CLAIM_SCAN_PARTS.map((p) => p.name)).toEqual([
      "kit",
      "publicDocs",
      "installReadme",
      "skillSources",
      "claudeAdapters",
      "pluginManifests",
    ]);
    for (const part of BANNED_CLAIM_SCAN_PARTS) {
      expect(part.members.length).toBeGreaterThan(0);
    }
    const summed = BANNED_CLAIM_SCAN_PARTS.reduce(
      (n, p) => n + p.members.length,
      0,
    );
    expect(summed - bannedClaimScanOverlap()).toBe(BANNED_CLAIM_SCAN_COUNT);
  });

  it("the derivation never reaches an excluded location, so this gate cannot scan itself", () => {
    // The self-exclusion note in the module header, asserted rather than remembered: the authority
    // contains every literal it defines, so it would fail its own check.
    // (Round 7, WR-01) Asked through the gate's OWN coverage predicate rather than through a
    // `startsWith` written here. The prefix test this line used to perform is exactly the one the
    // reviewer's nested plant walked through: it is TRUE of no entry for `.claude/worktrees/x/docs/`,
    // so it stayed green while the guarantee it claims to hold stopped holding.
    for (const member of bannedClaimScan()) {
      expect(bannedClaimExcluded(member), member).toBe(false);
    }
  });

  it("the live tree is GREEN and its PASS line reports the numbers this file derives", () => {
    // The gate's own committed .js against the real tree, with no CHECK_ROOT override. This is the
    // GREEN half of the D-44 transition, re-measured on every run rather than quoted from a commit.
    const r = spawnSync("node", [GATE_JS], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    expect(r.stdout).toContain(
      `0 findings over ${BANNED_CLAIM_SCAN_COUNT}/${BANNED_CLAIM_SCAN_COUNT} elements`,
    );
  });
});

// ── The list itself ───────────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the one list, frozen", () => {
  it("CONTROL: every literal is non-empty, lowercase-comparable and belongs to a declared group", () => {
    // A blank or whitespace literal would match every line of every document, turning the gate into
    // a machine that reports the whole corpus — and a reviewer would read the flood as a bug in the
    // corpus rather than in the list.
    for (const m of BANNED_CLAIM_LITERALS) {
      expect(m.literal.trim().length).toBeGreaterThan(2);
      expect(["standard-name", "token-economy", "comprehension"]).toContain(
        m.group,
      );
    }
    expect(new Set(BANNED_CLAIM_LITERALS.map((m) => m.literal)).size).toBe(
      BANNED_CLAIM_LITERALS.length,
    );
    // ── THE CONDITIONAL-MEMBER CARDINALITY PIN IS RETIRED, NOT RE-MEASURED (round 6) ────────────
    //
    // ITS SUBJECT WAS REMOVED, WHICH IS A DIFFERENT THING FROM ITS VALUE MOVING. The pin was 1, fired,
    // and was re-measured to 3 by plan 29-42 with its reason at the assertion — that is what a pin
    // whose VALUE moves gets. Round 6 removed the member shape it counted from the TYPE, so the only
    // value it could ever report again is zero. A permanently-zero equality reads in CI as a live
    // check and can never fail, which is the vacuity shape at assertion granularity.
    //
    // WHERE THE PROPERTY LIVES NOW: with the type, and it is stronger there. A member carrying a
    // marker field does not COMPILE, so the arrival this pin watched for is a build error rather than
    // an assertion failure; and the key-set assertion in "the plant selection itself" above is the
    // run-time half, reddening on ANY third property whatever it is called.
    // All three groups are populated. A group that emptied out would leave a prohibition LANG-04
    // names with no literal behind it, while the PASS line still counted three groups.
    for (const g of ["standard-name", "token-economy", "comprehension"]) {
      expect(BANNED_CLAIM_LITERALS.some((m) => m.group === g)).toBe(true);
    }
  });

  // ── THE EMPTY-MARKER REFUSAL IS DISCHARGED BY DELETION (round 6, WR-06 / D-53) ────────────────
  //
  // A case used to sit here refusing a member whose marker list was empty — the vacuity shape at
  // MEMBER granularity, a member that would have matched nothing forever while still being counted
  // as a pinned literal. The round-5 review asked for that refusal to be moved into the gate itself.
  // It is MOOT: the member shape it refused is not a shape the type admits, so an in-gate guard for
  // it could never run and a case for it has nothing to construct. Discharged by DELETING THE
  // MECHANISM rather than by hardening it, recorded here and in 29-44-SUMMARY.md, and carried to
  // plan 29-47's reconciliation with that verdict so it is not a silent drop.
  //
  // Its two source-derived denominators went with it and are recorded above where they were declared.

  it("the admission log records every refused candidate with a reason, and every COUNT is a count", () => {
    expect(BANNED_CLAIM_EXCLUDED.length).toBeGreaterThan(0);
    // (Round 6, plan 29-45 — IN-01) THE COUNT CONTRACT, ASSERTED. Before the retype this loop could
    // not have been written: `hits` was `number`, one entry carried `-1` meaning "not measured", and
    // `>= 0` would have been FALSE for a legitimate entry while `typeof === "number"` was TRUE for
    // the sentinel. With the sentinel in the TYPE the contract is exact — every entry is either the
    // named unmeasured value or a NON-NEGATIVE count, and there is nothing in between.
    let unmeasured = 0;
    let counted = 0;
    for (const e of BANNED_CLAIM_EXCLUDED) {
      expect(e.candidate.trim()).not.toBe("");
      expect(e.reason.trim().length).toBeGreaterThan(40);
      if (e.hits === BANNED_CLAIM_UNMEASURED) {
        unmeasured += 1;
        continue;
      }
      expect(
        typeof e.hits,
        `${e.candidate}: hits is neither a number nor the named unmeasured value`,
      ).toBe("number");
      expect(
        e.hits,
        `${e.candidate}: a NEGATIVE hit count is a sentinel smuggled through a count field — use BANNED_CLAIM_UNMEASURED`,
      ).toBeGreaterThanOrEqual(0);
      counted += 1;
    }
    // Two floors, so neither arm can be satisfied vacuously by an empty list on its side: the log
    // holds at least one MEASURED entry and at least one UNMEASURED entry, and the two partition it.
    expect(counted).toBeGreaterThan(0);
    expect(unmeasured).toBeGreaterThan(0);
    expect(counted + unmeasured).toBe(BANNED_CLAIM_EXCLUDED.length);
  });
});

// ── THE SUPPRESSED COUNT IS PUBLISHED BY GROUP (round 6, plan 29-45 — WR-01) ───────────────────
//
// The gate now prints the exemption's suppressed total AND its per-group components, projected off
// the same `lineHits` result the total is accumulated from. This block holds the published
// components against a derivation this file performs itself, so a fabricated component is visible.
describe("check-banned-claims — the exemption's suppressed count, published BY GROUP", () => {
  it("the PASS line's per-group components are the matcher's own, and they sum to the pin", () => {
    // THE LIVE TREE, not a mirror. The mirror's exemption region is padded with a single repeated
    // filler, so its group distribution is degenerate by construction and would hold nothing. The
    // pin is a statement about the REAL document, so that is the document this case reads.
    const r = spawnSync("node", [GATE_JS], { encoding: "utf8" });
    const stdout = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    // ASSERT THE HARNESS'S OWN PREMISE BEFORE READING ANY NUMBER OUT OF IT. A zero-byte or
    // banner-less capture would make every `match` below return null and the case would then be
    // asserting against its own failure to run — this phase has produced that false result before.
    expect(stdout.length, "the gate produced NO output").toBeGreaterThan(500);
    expect(stdout).toContain("[guard_banned_claims]");
    expect(r.status, `the live tree must be green; stdout:\n${stdout}`).toBe(0);

    // (1) THE GROUP NAMES, DERIVED FROM THE GATE'S SOURCE TEXT — independently of the runtime array
    // the tally loop is seeded from. Seeding the expectation off `BANNED_CLAIM_LITERALS` would be
    // the tally's own input vouching for the tally's own output.
    const declaredGroups = [
      ...new Set(
        (readFileSync(GATE_TS, "utf8").match(/^ {2}\{ literal: ".*?", group: "(.*?)" \},$/gm) ?? [])
          .map((m) => /group: "(.*?)"/.exec(m)?.[1] ?? "")
          .filter((g) => g !== ""),
      ),
    ].sort();
    expect(
      declaredGroups.length,
      "no group names were matched in the gate source — the breakdown below would be vacuous",
    ).toBeGreaterThan(1);

    // (2) THE PUBLISHED BREAKDOWN, PARSED OUT OF THE RUN.
    const published = /which suppresses (\d+) banned-claim occurrence\(s\) \(([^)]*)\), pinned at (\d+)/.exec(
      stdout,
    );
    expect(published, "the PASS line did not publish a per-group breakdown").not.toBeNull();
    const total = Number(published![1]);
    const pinned = Number(published![3]);
    const parsed = new Map<string, number>(
      published![2].split(", ").map((part) => {
        const at = part.lastIndexOf(" ");
        return [part.slice(0, at), Number(part.slice(at + 1))] as [string, number];
      }),
    );
    // Every DECLARED group is published, so an omitted group cannot hide behind a correct sum.
    expect([...parsed.keys()].sort()).toEqual(declaredGroups);
    // ...and the components sum to the total, which is the pin.
    expect([...parsed.values()].reduce((a, b) => a + b, 0)).toBe(total);
    expect(total).toBe(pinned);
    expect(pinned).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED);

    // ── (3) THE EXPECTED SIDE, DERIVED OFF THE RUN'S LOOP (plan 29-52, replacing a self-check) ──
    //
    // WHAT STOOD HERE UNTIL PLAN 29-52, AND WHY IT WAS REPLACED RATHER THAN EXTENDED. The old part
    // (3) folded `bannedClaimGroupTally` over `[region.headingAt, region.endBefore)` — the SAME
    // range, over the SAME live document, that the gate's own loop walks. Both sides therefore moved
    // together under every edit to the region: substitute one denial for one live claim of the same
    // group and the parsed side and the derived side change identically, so the equality holds and
    // the case reports nothing. Its own sibling comment conceded the mirror's region was degenerate
    // by construction; the live half was self-consistent by construction, which is worse, because it
    // read as the strong half. That is the shape 29-REVIEW round 4 § WR-03 records, and it is why
    // the CR-01 substitution shipped past a green suite.
    //
    // WHAT REPLACES IT: an expected side assembled by a route that shares NO STATEMENT with the
    // run's loop — the REGISTRY's rows and the AUTHORITY's anchored blocks. The gate's loop knows
    // where the region is and asks a Set for membership; this walks the registry, asks
    // `anchoredBlockAt` for each row's extent and byte verdict, unions the surviving extents, and
    // tallies only those lines. The two agree only when the frozen set really is what the gate
    // suppressed over.
    const profileText = readFileSync(join(ROOT, PROFILE), "utf8");
    const lines = profileText.split("\n");
    const region = locateExemptRegion(lines);
    expect(region).not.toBeNull();

    const registryRows = readRegistry(ROOT).claims.filter(
      (c) => c.file === PROFILE,
    );
    // FLOOR ON THE EXPECTED SIDE'S OWN INPUT. A registry that returned no row for this document
    // would make every union below empty and the tally all zeros — a denominator that is short
    // rather than empty is what the second floor after it catches.
    expect(
      registryRows.length,
      "the registry names no row for the exemption document",
    ).toBeGreaterThan(0);
    const authorityScan = scanAnchoredDocument(profileText);
    const byId = new Map(registryRows.map((c) => [c.id, c]));
    const frozen = new Set<number>();
    let blocksInRegion = 0;
    for (const anchor of authorityScan.anchors) {
      const row = byId.get(anchor.id);
      if (row === undefined) continue;
      if (
        anchor.index < region!.headingAt ||
        anchor.index >= region!.endBefore
      ) {
        continue;
      }
      const block = anchoredBlockAt(authorityScan, anchor, row.verbatim);
      blocksInRegion += 1;
      expect(
        block.matches,
        `${anchor.id}'s bytes diverged from its registry row`,
      ).toBe(true);
      for (let i = block.start; i < block.end; i++) frozen.add(i);
    }
    // TWO FLOORS, AND THE SECOND IS THE ONE A VACUITY CHECK CANNOT GIVE. The first says the block
    // set is not EMPTY; the second says it is not SILENTLY SHORT, by holding it against the gate's
    // own two-sided pin — derived here from the registry and the authority, never from the run.
    expect(blocksInRegion, "no anchored block sits inside the region").toBeGreaterThan(0);
    expect(blocksInRegion).toBe(BANNED_CLAIM_EXEMPT_ANCHORS);
    expect(frozen.size, "the frozen line set is empty").toBeGreaterThan(0);

    // The tally over the FROZEN lines only — one line at a time, because the frozen set is a union
    // of extents and not a range.
    const derived: Record<string, number> = {};
    for (const g of declaredGroups) derived[g] = 0;
    for (const i of [...frozen].sort((a, b) => a - b)) {
      const t = bannedClaimGroupTally(lines, i, i + 1);
      for (const [g, n] of Object.entries(t)) derived[g] = (derived[g] ?? 0) + n;
    }
    expect(derived).toEqual(Object.fromEntries(parsed));
    // The floor on the DERIVED side too, so the equality above is never 0 === 0.
    expect(Object.values(derived).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(Object.values(derived).reduce((a, b) => a + b, 0)).toBe(total);

    // AND THE PROPERTY THAT MAKES THE CARVE-OUT CONTENT-BOUND, STATED AS AN EQUALITY: the whole
    // region's tally equals the frozen subset's tally, i.e. there is NO occurrence inside the region
    // that no registry row freezes. This is what "the uncovered list is empty" means as a build
    // property rather than as a measurement in a SUMMARY.
    expect(
      countBannedClaimOccurrences(lines, region!.headingAt, region!.endBefore),
    ).toBe(total);
  });

  it("the composition pin is DECLARED two-sided and sums to the reach pin", () => {
    // The secondary measure's own arithmetic, held here so a group dropped from the declaration
    // cannot take its occurrences out of the measurement with it.
    expect(BANNED_CLAIM_EXEMPT_COMPOSITION.length).toBeGreaterThan(1);
    expect(
      BANNED_CLAIM_EXEMPT_COMPOSITION.reduce((a, c) => a + c.count, 0),
    ).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED);
    // Every declared literal group is represented, so a group cannot be silently omitted.
    expect(BANNED_CLAIM_EXEMPT_COMPOSITION.map((c) => c.group).sort()).toEqual(
      [...new Set(BANNED_CLAIM_LITERALS.map((l) => l.group))].sort(),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// D-54: THE CARVE-OUT IS BOUNDED IN CONTENT AS WELL AS IN POSITION (round-6 CR-01, plan 29-52)
//
// EVERY CASE BELOW WAS RED-PROVEN AGAINST THE PRE-CHANGE COMMITTED BUILD BEFORE IT WAS WRITTEN, on
// `git archive`-style hermetic mirrors with sha256-verified gate binaries, one plant per mirror,
// with the clean mirror's premise asserted green first. At the pre-conjunction build all three
// plants below exit 0 with the profile never named anywhere in the output. That transcript is this
// section's acceptance evidence and it is quoted in 29-52-SUMMARY.md.
//
// The cases here drive the SAME committed `.js` against the SAME hermetic harness every other case
// in this file uses, so the property is a property of the build rather than of a session.
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * The CR-01 substitution: one honest denial inside a frozen block replaced by the live assertion,
 * at an IDENTICAL occurrence count and an identical group.
 *
 * COUNT-PRESERVING ON PURPOSE, because that is the whole defect. A swap that moved the count reds on
 * the reach pin, which is a pin round 2 already shipped; the class this closes is the one that moves
 * NOTHING either cardinality can see.
 */
const DENIAL_LINE = `There is no evidence that controlled language ${COMPREHENSION_CLAIM.literal} for a language model.`;
const ASSERTION_LINE = `Measurement shows that controlled language ${COMPREHENSION_CLAIM.literal} for a language model.`;

describe("check-banned-claims — the sole carve-out is bounded in CONTENT (D-54, CR-01)", () => {
  it("PREMISE: the substitution really is count-preserving and group-preserving", () => {
    // Without this the case below could pass for the WRONG reason — a swap that happened to move
    // the reach pin reds on a mechanism that already existed, and would prove nothing about D-54.
    const before = bannedClaimGroupTally([DENIAL_LINE], 0, 1);
    const after = bannedClaimGroupTally([ASSERTION_LINE], 0, 1);
    expect(after).toEqual(before);
    expect(Object.values(before).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    // ...and the two really are different bytes, so the plant is a plant.
    expect(ASSERTION_LINE).not.toBe(DENIAL_LINE);
  });

  it("THE CR-01 SUBSTITUTION REDS BY NAME: a denial inside a frozen block swapped for the claim", () => {
    // The registry freezes the CLEAN bytes; the document carries the SUBSTITUTED ones. That is
    // exactly the tree a reviewer is handed after somebody edits a denial and does not touch its
    // row — and under D-04 that edit was always supposed to be a two-file change.
    const clean = profileDoc({ regionBody: DENIAL_LINE });
    const tampered = clean.replace(DENIAL_LINE, ASSERTION_LINE);
    // FIXTURE PREMISE: the substitution landed, and it landed exactly once.
    expect(tampered).not.toBe(clean);
    expect(tampered.split(ASSERTION_LINE).length - 1).toBe(1);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-d54-substitution-", {
        plant: { [PROFILE]: tampered },
        registryFrozenOn: clean,
      }),
    );
    expect(status).toBe(1);
    // (1) THE CAUSE, named with the row id, in THIS gate's output rather than a sibling's.
    expect(stdout).toContain("no longer matches its registry row");
    // (2) THE SYMPTOM, at file:line:column. Derived from the fixture, never typed.
    const plantedLine = tampered.split("\n").indexOf(ASSERTION_LINE) + 1;
    expect(plantedLine).toBeGreaterThan(0);
    expect(stdout).toContain(`${PROFILE}:${plantedLine}:`);
    expect(findingCount(stdout)).toBeGreaterThan(0);
  });

  it("THE WHOLESALE REWRITE REDS INSIDE THIS GATE, not only in the sibling anchors gate", () => {
    // The second form CR-01 records: the region's whole body replaced by banned claims plus filler.
    // At the pre-conjunction build this exits 0 here and reds only on a verbatim freeze owned by
    // check-claim-anchors — a carve-out whose only content bound lives in another gate.
    const clean = profileDoc();
    const heading = BANNED_CLAIM_EXEMPT_REGION.heading;
    const cleanLines = clean.split("\n");
    const at = cleanLines.indexOf(heading);
    expect(at).toBeGreaterThan(-1);
    const bodyLen = cleanLines.length - (at + 1);
    // A body holding BOTH pins: the same line count, and the same occurrence total reached with the
    // same group composition — built from the pinned members rather than retyped.
    const rewritten: string[] = [];
    for (const c of BANNED_CLAIM_EXEMPT_COMPOSITION) {
      for (let k = 0; k < c.count; k++) rewritten.push(GROUP_FILLER[c.group]);
    }
    while (rewritten.length < bodyLen) rewritten.push("Filler line with no claim.");
    rewritten.length = bodyLen;
    const tampered = [...cleanLines.slice(0, at + 1), ...rewritten].join("\n");
    // FIXTURE PREMISE: both cardinality pins really are unmoved by this rewrite, so the case cannot
    // pass on a pin that already existed.
    const tamperedLines = tampered.split("\n");
    const region = locateExemptRegion(tamperedLines);
    expect(region).not.toBeNull();
    expect(region!.endBefore - region!.headingAt).toBe(BANNED_CLAIM_EXEMPT_EXTENT);
    expect(
      countBannedClaimOccurrences(tamperedLines, region!.headingAt, region!.endBefore),
    ).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-d54-wholesale-", {
        plant: { [PROFILE]: tampered },
        registryFrozenOn: clean,
      }),
    );
    expect(status).toBe(1);
    // THE FINDINGS COME FROM THIS GATE. Asserted on the rendered lines, not on the exit code: the
    // point of the case is that `check-banned-claims` itself now speaks.
    expect(stdout).toContain("[guard_banned_claims]");
    expect(findingCount(stdout)).toBeGreaterThan(0);
    expect(stdout).toContain(`${PROFILE}:`);
  });

  it("an UNANCHORED line inside the region is a FINDING, with the remedy that says where a denial belongs", () => {
    // The fail-closed direction. A claim written inside the carve-out on a line no registry row
    // freezes is reported, and its remedy does NOT say "delete the disclaimer" — which is what the
    // default remedy would have said, and would have been this gate advising against the reason the
    // exemption exists.
    const clean = profileDoc();
    const heading = BANNED_CLAIM_EXEMPT_REGION.heading;
    const lines = clean.split("\n");
    const at = lines.indexOf(heading);
    expect(at).toBeGreaterThan(-1);
    // Overwrite a PADDING blank line inside the region — a line no anchor covers — keeping the line
    // count identical so the extent pin is unmoved and the red is attributable to the conjunction.
    let target = -1;
    for (let i = lines.length - 1; i > at; i--) {
      if (lines[i] === "") {
        target = i;
        break;
      }
    }
    expect(target).toBeGreaterThan(at);
    const tampered = [...lines];
    tampered[target] = NAME_PLANT;
    const doc = tampered.join("\n");
    // FIXTURE PREMISE: the extent is unmoved, and the plant really sits inside the region.
    const region = locateExemptRegion(tampered);
    expect(region).not.toBeNull();
    expect(region!.endBefore - region!.headingAt).toBe(BANNED_CLAIM_EXEMPT_EXTENT);
    expect(target).toBeGreaterThanOrEqual(region!.headingAt);
    expect(target).toBeLessThan(region!.endBefore);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-d54-unanchored-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(`${PROFILE}:${target + 1}:`);
    expect(stdout).toContain(
      "INSIDE the one named exemption region and OUTSIDE every registry-anchored block",
    );
    expect(stdout).toContain("A denial belongs inside an anchored block");
    // ...and it does NOT tell the author to delete the claim, which is the default remedy.
    expect(stdout).not.toContain("Remedy: delete the claim");
  });

  it("an EMPTY exempt block set inside a LOCATED region is a NAMED REFUSAL", () => {
    // The `empty` probe row's answer, decided rather than discovered. A region with no frozen block
    // exempts nothing while reading as a live carve-out, and both cardinality pins would then be
    // satisfiable by a document that suppresses nothing.
    const { status, stdout } = runGate(
      // `reach: 0` as well as `anchors: 0`: the group fillers are themselves anchored blocks, so a
      // region asked for zero anchors must also be asked for zero fill. The region is still
      // NON-empty — the body line and the padding are there — so this is the zero-BLOCK case and
      // not the zero-region one, which has its own refusal and its own case above.
      makeMirror("gops-banned-d54-empty-anchors-", {
        profile: { anchors: 0, reach: 0 },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("contains ZERO registry-anchored block(s)");
    expect(stdout).toContain("do not lower BANNED_CLAIM_EXEMPT_ANCHORS");
  });

  it("a SINGLE anchored block is admitted and FLOORED — the count pin catches the short set", () => {
    // The single-element half of the same probe row. One block is not the empty case and must not be
    // refused as one; it is refused by the CARDINALITY pin, with the entrant named — which is the
    // difference between a vacuity floor and a two-sided count.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-d54-one-anchor-", {
        profile: { anchors: 1, reach: 0 },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).not.toContain("contains ZERO registry-anchored block(s)");
    expect(stdout).toContain("registry-anchored block(s) [C-28-");
    expect(stdout).toContain("declares " + BANNED_CLAIM_EXEMPT_ANCHORS);
  });

  it("ONE registry row removed reds BY NAME — the exempt set is derived, not listed", () => {
    // The set-literal-drift direction. The exempt blocks come from the registry, so dropping a row
    // takes its block out of the frozen set: its lines stop being exempt and their occurrences
    // become findings, AND the cardinality pin names the shortfall. Neither is a source edit.
    const clean = profileDoc();
    const fullRegistry = mirrorRegistry(clean);
    // Remove the LAST row's block, derived from the registry text rather than typed.
    const ids = [...fullRegistry.matchAll(/^### (C-28-\d{3})$/gm)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(2);
    const dropped = ids[ids.length - 1];
    const start = fullRegistry.indexOf(`### ${dropped}\n`);
    expect(start).toBeGreaterThan(-1);
    const shortRegistry = fullRegistry.slice(0, start);
    // FIXTURE PREMISE: exactly one row left, and the registry still parses as a registry.
    expect([...shortRegistry.matchAll(/^### (C-28-\d{3})$/gm)].length).toBe(ids.length - 1);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-d54-row-removed-", {
        plant: { [PROFILE]: clean, "docs/audit/28-claim-registry.md": shortRegistry },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("registry-anchored block(s) [C-28-");
    expect(stdout).toContain("declares " + BANNED_CLAIM_EXEMPT_ANCHORS);
    // The entrant is NAMED: the rendered id list is the surviving set and does not carry the row
    // that was dropped. Parsed out of the run rather than matched as a substring, so a coincidental
    // occurrence of the id elsewhere in the output cannot satisfy it.
    const rendered = /registry-anchored block\(s\) \[([^\]]*)\]/.exec(stdout);
    expect(rendered, "the refusal did not render the block id list").not.toBeNull();
    expect(rendered![1].split(", ")).not.toContain(dropped);
    expect(rendered![1].split(", ").length).toBe(ids.length - 2);
  });

  it("an UNREADABLE content bound exempts NOTHING — the fail-closed direction, named", () => {
    // A registry that cannot be parsed is not an empty one. Every occurrence inside the region is
    // reported, which is the safe direction, and the cause is named rather than left as a pile of
    // findings whose reason lives nowhere.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-d54-no-registry-", { omitRegistry: true }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("the claim registry could not be parsed");
    expect(stdout).toContain("fail-CLOSED direction");
    expect(findingCount(stdout)).toBe(BANNED_CLAIM_EXEMPT_SUPPRESSED);
  });

  it("SOURCE SHAPE: the exempt set is DERIVED — no literal array of claim ids exists in the gate", () => {
    // The prohibition D-54 is reconcilable with D-48 BECAUSE of: a hand-listed set of exempt anchors
    // would be this repository's second systemic failure class sitting inside the fix for the first.
    // Read off the gate's SOURCE TEXT so the assertion cannot be satisfied by a runtime value.
    const src = readFileSync(GATE_TS, "utf8");
    expect(src.length, "the gate source was not read").toBeGreaterThan(1000);
    // Any array literal carrying two or more C-28-NNN strings would be such a list.
    const idArrays = src.match(/\[[^\]]*"C-28-\d{3}"[^\]]*\]/g) ?? [];
    expect(idArrays.length).toBe(0);
    // ...and not even a single quoted id is declared here: the ids come from the registry.
    expect((src.match(/"C-28-\d{3}"/g) ?? []).length).toBe(0);
    // The derivation is present, and it reads the registry rather than a list.
    expect(src).toContain("readRegistry(root).claims");
    expect(src).toContain("BANNED_CLAIM_EXEMPT_ANCHORS");
  });

  it("SOURCE SHAPE: the matcher, the literal list and the literal type are untouched by D-54", () => {
    // D-54's bound from the other side. The three forbidden weakenings stay forbidden and no
    // conditional field returns — asserted on the members' own KEYS, which a grep for a retired
    // spelling would miss.
    for (const m of BANNED_CLAIM_LITERALS) {
      expect(Object.keys(m).sort()).toEqual(["group", "literal"]);
    }
    const src = readFileSync(GATE_TS, "utf8");
    // The line matcher still lowercases and still substring-matches every member unconditionally.
    expect(src).toContain("const lower = line.toLowerCase();");
    expect(src).toContain("for (const member of BANNED_CLAIM_LITERALS)");
    // No fenced-block skip, no whole-word boundary, no below-a-marker skip inside `lineHits`.
    const lineHitsSrc = /function lineHits\(line: string\): LineHit\[\] \{[\s\S]*?\n\}/.exec(src);
    expect(lineHitsSrc, "lineHits was not found in the gate source").not.toBeNull();
    expect(lineHitsSrc![0]).not.toContain("fenced");
    expect(lineHitsSrc![0]).not.toContain("\\b");
    expect(lineHitsSrc![0]).not.toContain("marker");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// THE THREE SUBSUMED RESIDUALS, ONE CASE PER ROUTE (plan 29-52 task 3)
//
// `V-29-47-02` (the region unbounded at the bottom), `V-29-47-03` (its position pinned by nothing)
// and `V-29-32-01` (a closed-fence, count-preserving swallow) are one defect in three coats: all
// three describe BYTES THAT ENTER THE CARVE-OUT WITHOUT REVIEW. A content bound is invariant under
// translation and needs no bottom boundary, so it SUBSUMES them rather than adding a fourth pin.
//
// EACH CASE WALKS ITS RESIDUAL'S OWN ROUTE and asserts the gate names the claim planted on the bytes
// that route admits. Measured first on hermetic sha256-verified mirrors under THE RE-PIN PROTOCOL —
// every cardinality the gate complained about moved to the value the gate itself reported, which is
// the residuals' own stated reachability condition. At the pre-conjunction build all three exit 0
// with the profile never named even after every pin is re-pinned; at HEAD each reds at
// file:line:column. Those transcripts are quoted in 29-52-SUMMARY.md.
//
// WHAT THESE CASES DO NOT CLAIM, said here rather than left to be inferred: a swallow, an append or
// a translation carrying NO banned claim still moves nothing this gate can see, because this gate
// decides BANNED CLAIMS and not section membership. Each residual is NARROWED to that shape, not
// closed to nothing, and the register carries the narrowed statement.
// ══════════════════════════════════════════════════════════════════════════════════════════════

const ROUTE_CLAIM = `The kit ${CONFORMANCE_VERB}s to ${DISCIPLINE_NAME.literal}.`;

describe("check-banned-claims — three residual routes, subsumed by the content bound", () => {
  it("V-29-47-02 (unbounded at the bottom): a claim APPENDED at EOF lands in the region and REDS", () => {
    const clean = profileDoc();
    const lines = clean.split("\n");
    // FIXTURE PREMISE: the region really is unbounded at the bottom — this is the residual's own
    // address, and a fixture whose region ended earlier would be testing a different document.
    const region = locateExemptRegion(lines);
    expect(region).not.toBeNull();
    expect(region!.endBefore).toBe(lines.length);

    const appended = [...lines, "", ROUTE_CLAIM, ""];
    const doc = appended.join("\n");
    const at = appended.indexOf(ROUTE_CLAIM);
    // ...and the appended claim really does land INSIDE the carve-out.
    const after = locateExemptRegion(appended);
    expect(after).not.toBeNull();
    expect(at).toBeGreaterThanOrEqual(after!.headingAt);
    expect(at).toBeLessThan(after!.endBefore);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-v294702-", { plant: { [PROFILE]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(`${PROFILE}:${at + 1}:`);
    expect(stdout).toContain(
      "INSIDE the one named exemption region and OUTSIDE every registry-anchored block",
    );
  });

  it("V-29-47-03 (position pinned by nothing): the region TRANSLATED, then a claim inside it, REDS", () => {
    const clean = profileDoc();
    const lines = clean.split("\n");
    const at = lines.indexOf(BANNED_CLAIM_EXEMPT_REGION.heading);
    expect(at).toBeGreaterThan(-1);
    // A rigid translation: a whole section inserted ABOVE the carve-out, moving it bodily down.
    const moved = [
      ...lines.slice(0, at),
      "## An inserted section above the carve-out",
      "",
      "Neutral prose with no claim.",
      "",
      ...lines.slice(at),
    ];
    // FIXTURE PREMISE: the region really moved, and its EXTENT is unmoved — so the translation is
    // rigid and the case cannot pass on the extent pin.
    const before = locateExemptRegion(lines);
    const after = locateExemptRegion(moved);
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after!.headingAt).toBeGreaterThan(before!.headingAt);
    expect(after!.endBefore - after!.headingAt).toBe(
      before!.endBefore - before!.headingAt,
    );

    // The substitution, on a line no anchor covers, keeping the line count identical.
    let target = -1;
    for (let i = after!.endBefore - 1; i > after!.headingAt; i--) {
      if (moved[i] === "") {
        target = i;
        break;
      }
    }
    expect(target).toBeGreaterThan(after!.headingAt);
    moved[target] = ROUTE_CLAIM;
    // ...and the extent is STILL unmoved after the substitution.
    const finalRegion = locateExemptRegion(moved);
    expect(finalRegion!.endBefore - finalRegion!.headingAt).toBe(
      BANNED_CLAIM_EXEMPT_EXTENT,
    );

    const { status, stdout } = runGate(
      makeMirror("gops-banned-v294703-", { plant: { [PROFILE]: moved.join("\n") } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(`${PROFILE}:${target + 1}:`);
    expect(stdout).toContain("A denial belongs inside an anchored block");
  });

  it("V-29-32-01 (closed-fence count-preserving swallow): the swallowed claim REDS", () => {
    const clean = profileDoc();
    const lines = clean.split("\n");
    const at = lines.indexOf(BANNED_CLAIM_EXEMPT_REGION.heading);
    expect(at).toBeGreaterThan(-1);
    // The heading that WOULD have ended the region, hidden inside a CLOSED fenced example, with the
    // claim in the section it therefore fails to end. The UNCLOSED form is caught by the
    // region-ends-inside-a-fence refusal and is a different shape.
    const added = [
      "",
      "```",
      "## A real later section that would have ended the region",
      "```",
      "",
      ROUTE_CLAIM,
      "",
    ];
    const swallowed = [...lines, ...added];
    // The compensating deletion: as many blank lines removed from inside the region as were added,
    // so the EXTENT is held still — which is precisely what makes this residual invisible to a
    // cardinality.
    let toDrop = added.length;
    for (let i = at + 1; i < swallowed.length && toDrop > 0; i++) {
      if (swallowed[i] === "") {
        swallowed.splice(i, 1);
        toDrop -= 1;
        i -= 1;
      }
    }
    // FIXTURE PREMISE: the fenced heading really is fenced, the region really did NOT end at it,
    // the region does NOT end inside a fence (that is the other shape), and the extent really is
    // unmoved. Four premises, because a swallow fixture that failed any of them would be measuring
    // something else.
    const flags = fencedLineFlags(swallowed.join("\n"));
    const fencedHeading = swallowed.indexOf(
      "## A real later section that would have ended the region",
    );
    expect(fencedHeading).toBeGreaterThan(-1);
    expect(flags[fencedHeading]).toBe(true);
    const region = locateExemptRegion(swallowed);
    expect(region).not.toBeNull();
    expect(flags[region!.endBefore - 1]).toBe(false);
    const claimAt = swallowed.indexOf(ROUTE_CLAIM);
    expect(claimAt).toBeGreaterThan(fencedHeading);
    expect(claimAt).toBeLessThan(region!.endBefore);
    expect(region!.endBefore - region!.headingAt).toBe(BANNED_CLAIM_EXEMPT_EXTENT);

    const { status, stdout } = runGate(
      makeMirror("gops-banned-v292301-", {
        plant: { [PROFILE]: swallowed.join("\n") },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(`${PROFILE}:${claimAt + 1}:`);
    expect(stdout).toContain("A denial belongs inside an anchored block");
    // The extent pin is NOT what reported it — that is the whole point of the residual.
    expect(stdout).not.toContain("and BANNED_CLAIM_EXEMPT_EXTENT in");
  });

  it("THE NARROWED REMAINDER, stated as a case: a swallow carrying NO claim still moves nothing here", () => {
    // The other half, measured rather than absorbed into the closure. This gate decides BANNED
    // CLAIMS; section membership is not its subject and never was. A reader who took the three cases
    // above as "the residuals are gone" would be reading a closure wider than the measurement.
    const clean = profileDoc();
    const lines = clean.split("\n");
    const at = lines.indexOf(BANNED_CLAIM_EXEMPT_REGION.heading);
    const added = [
      "",
      "```",
      "## A real later section that would have ended the region",
      "```",
      "",
      "Neutral prose carrying no banned claim at all.",
      "",
    ];
    const swallowed = [...lines, ...added];
    let toDrop = added.length;
    for (let i = at + 1; i < swallowed.length && toDrop > 0; i++) {
      if (swallowed[i] === "") {
        swallowed.splice(i, 1);
        toDrop -= 1;
        i -= 1;
      }
    }
    const { status, stdout } = runGate(
      makeMirror("gops-banned-narrowed-", {
        plant: { [PROFILE]: swallowed.join("\n") },
      }),
    );
    // GREEN — and that is the honest statement of what is left, not a defect this plan hid.
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(status).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// THE PUBLISHED SENTENCE IS THE ONE THE GATE DECIDES (round 8, plan 29-56 — D-55)
//
// Seven verification rounds each closed one axis between what this gate's first output line CLAIMED
// and what its mechanism DECIDES, and each closure exposed the next: an unlisted benefit verb, then
// an unlisted conformance verb, then a hard-wrapped multi-word literal. That distance is not a
// defect with a fix, it is an unbounded class, so D-55 moved the SENTENCE to the mechanism instead.
// These two cases are what stop it moving back — a narrowing held by nothing is a wording, and a
// wording drifts.
//
// THE TWO SUPERSEDED NOUN PHRASES ARE DECLARED ONCE, HERE, AND WERE CAPTURED FROM THE FILE RATHER
// THAN RETYPED. A phrase transcribed out of a planning document is a second copy of the thing being
// policed, living in the file that polices it — this repository's set-literal drift class, landing
// inside the fix for a claim-scope defect. Each constant occurs on exactly ONE line of this file,
// asserted below, so `grep -c` over either phrase counts its declaration and nothing else.
const SUPERSEDED_SUBJECT = "the shipped kit";
const SUPERSEDED_OBJECT = "the public documents";

/** Every 0-based line index at which `needle` occurs in `haystack`, so a failure can name WHERE. */
function lineIndexesOf(haystack: string, needle: string): number[] {
  const out: number[] = [];
  haystack.split("\n").forEach((line, i) => {
    if (line.includes(needle)) out.push(i);
  });
  return out;
}

describe("check-banned-claims — the published sentence states the predicate the gate decides (D-55)", () => {
  it("BEHAVIOUR: the running gate's first line carries the DERIVED numbers, names the unit of decision, and neither superseded phrase", () => {
    // THE LIVE TREE, not a mirror: the subject of the case is the sentence this repository
    // publishes about itself, so the run that publishes it is the run that must be read.
    const r = spawnSync("node", [GATE_JS], { encoding: "utf8" });
    const stdout = `${r.stdout ?? ""}${r.stderr ?? ""}`;

    // ASSERT THE HARNESS'S OWN PREMISE BEFORE READING ANY NUMBER OUT OF IT. A zero-byte or
    // banner-less capture would make every `match` below return null and the case would then be
    // asserting against its own failure to run — this phase has produced that false result in six
    // separate instances across four consecutive rounds.
    expect(stdout.length, "the gate produced NO output").toBeGreaterThan(500);
    expect(r.status, `the live tree must be green; stdout:\n${stdout}`).toBe(0);
    const header = stdout.split("\n").find((l) => l.includes("[guard_banned_claims]"));
    expect(header, `the gate printed no bracketed header line; stdout:\n${stdout}`).toBeDefined();

    // (1) NEITHER SUPERSEDED NOUN PHRASE. Both quantified over a surface much wider than the one
    // the matcher reads, which is the defect LANG-04 exists to prevent.
    expect(header!, "the superseded subject returned to the published sentence").not.toContain(
      SUPERSEDED_SUBJECT,
    );
    expect(header!, "the superseded object returned to the published sentence").not.toContain(
      SUPERSEDED_OBJECT,
    );

    // (2) THE UNIT OF DECISION IS NAMED. `lineHits()` reads ONE physical line at a time, so a
    // literal hard-wrapped across a line boundary is not matched. Naming the unit is what keeps
    // that residual visible instead of implied away by a sentence quantified over documents.
    expect(header!, "the published sentence no longer names its unit of decision").toContain(
      "single physical line",
    );

    // (3) AND (4) THE TWO NUMBERS, COMPARED AGAINST A SEPARATE IMPORT OF THE MODULE'S OWN
    // DERIVATIONS. The expectation is produced by a different statement than the actual: the gate
    // subprocess computed one, this process computes the other. A pin whose expected value is
    // produced by the same statement as its actual value pins nothing — the argument this module's
    // own comment at `countBannedClaimOccurrences` already makes.
    const m =
      /the (\d+) derived document\(s\)[\s\S]*?any of the (\d+) pinned claim literal\(s\)/.exec(
        header!,
      );
    expect(m, `the published sentence did not parse:\n${header}`).not.toBeNull();
    expect(Number(m![1]), "the published corpus size is not the derived one").toBe(
      bannedClaimScan().length,
    );
    expect(Number(m![2]), "the published literal count is not the derived one").toBe(
      BANNED_CLAIM_LITERALS.length,
    );

    // (5) THE EXEMPTION IS DESCRIBED AS THE ANCHORED BLOCKS, NOT AS THE REGION. Since D-54 the
    // carve-out is bounded in CONTENT as well as in POSITION, and a sentence that names only the
    // region publishes the pre-D-54 bound.
    expect(header!, "the exemption is published as a region rather than as its anchored blocks")
      .toContain("registry-anchored blocks of one named exemption region");
  });

  it("SOURCE SHAPE: neither superseded noun phrase returns to either narrowed address, and both addresses still STATE the predicate", () => {
    // Read off the gate's SOURCE TEXT so the assertion cannot be satisfied by a runtime value, in
    // the idiom the D-54 source-shape cases above already use.
    const src = readFileSync(GATE_TS, "utf8");
    expect(src.length, "the gate source was not read").toBeGreaterThan(1000);

    // THE SUBJECT PHRASE IS KEPT NOWHERE, AND THE CASE SAYS SO. Its two occurrences — the module
    // docblock's scope claim and the `runAll()` header write — were the two totality claims this
    // round narrowed, and there is no third address that needs it.
    const subjectAt = lineIndexesOf(src, SUPERSEDED_SUBJECT);
    expect(
      subjectAt.length,
      `the superseded subject returned at line(s) ${subjectAt.map((i) => i + 1).join(", ")}`,
    ).toBe(0);

    // THE OBJECT PHRASE IS KEPT AT EXACTLY ONE ADDRESS, DECLARED HERE BY NAME RATHER THAN LEFT TO
    // BE INFERRED: the refusal this gate prints when the corpus it CONSUMES — derived in
    // scripts/check-public-docs-vocabulary.ts — refuses. That sentence names which module derived
    // which set. It is not a claim about what the gate proves, and narrowing it would delete a
    // correct diagnosis to satisfy a grep.
    const objectAt = lineIndexesOf(src, SUPERSEDED_OBJECT);
    expect(
      objectAt.length,
      `the superseded object occurs at line(s) ${objectAt.map((i) => i + 1).join(", ")}; exactly one carve-out is declared`,
    ).toBe(1);
    const keptLine = src.split("\n")[objectAt[0]!];
    expect(keptLine, "the kept occurrence is not the imported-corpus refusal").toContain(
      "while deriving",
    );
    expect(keptLine, "the kept occurrence is not the imported-corpus refusal").toContain(
      "check-public-docs-vocabulary.ts",
    );

    // NARROWING IS NOT DELETION. Both addresses must still STATE the predicate, or "no superseded
    // phrase" would be satisfiable by removing the sentences entirely — a gate that says nothing
    // about its scope is not an improvement on one that overstates it.
    const headerWrite =
      /process\.stdout\.write\(\n(?:.*\n)*?\s*`\(LANG-04 \/ D-29, D-44\)\\n`,\n\s*\);/.exec(src);
    expect(headerWrite, "the header write expression was not found").not.toBeNull();
    expect(headerWrite![0]).toContain("single physical line");
    expect(headerWrite![0]).toContain("${bannedClaimScan().length}");
    expect(headerWrite![0]).toContain("${BANNED_CLAIM_LITERALS.length}");
    // ...and no number is TYPED into it. The only digits the sentence is allowed to carry are the
    // decision ids in its attribution, which are identifiers and not measurements.
    const withoutAttribution = headerWrite![0].replace("(LANG-04 / D-29, D-44)", "");
    expect(
      withoutAttribution.match(/\d/g),
      "a digit was typed into the published sentence",
    ).toBeNull();

    // The module docblock — the file's other statement of its own scope — states the same predicate
    // rather than a differently-worded restatement of it.
    //
    // THE ONE NORMALIZATION IN THIS CASE, DECLARED RATHER THAN SLIPPED IN. The comment markers and
    // the line breaks of a COMMENT BLOCK are collapsed before comparing, and the comparison is
    // case-folded. A prose paragraph is hard-wrapped by whoever last edited it, so an exact match
    // here would red on a rewrap that changed no meaning — and this phase has already spent a round
    // on what a line boundary does to an exact comparison. This is emphatically NOT the argument
    // for normalizing inside the MATCHER, which compares against a document a reader will read and
    // where an inexact comparison admits shapes nobody measured; the assertion on the PUBLISHED
    // header above stays byte-exact for exactly that reason.
    const docblock = src
      .split("\n")
      .slice(0, 14)
      .map((l) => l.replace(/^\/\/ ?/, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .toLowerCase();
    expect(docblock, "the module docblock no longer names the unit of decision").toContain(
      "single physical line",
    );
    expect(docblock, "the module docblock no longer names its set as derived").toContain(
      "derived document set",
    );

    // THE CONSTANTS THIS CASE POLICES WITH ARE DECLARED EXACTLY ONCE IN THIS FILE. Two copies of a
    // policed phrase would make the `grep -c` evidence in the plan's acceptance criteria read a
    // number that is not the number it names.
    const self = readFileSync(new URL(import.meta.url), "utf8");
    expect(lineIndexesOf(self, `"${SUPERSEDED_SUBJECT}"`).length).toBe(1);
    expect(lineIndexesOf(self, `"${SUPERSEDED_OBJECT}"`).length).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// THE IN-SOURCE RESIDUAL RECORD DESCRIBES THE BYPASS THAT EXISTS (round 8, plan 29-57 — D-56)
//
// Round 7's code review and round 7's verifier each independently reproduced the same bypass:
// `lineHits()` asks each pinned literal of ONE physical line, so a multi-word member split by an
// ordinary hard wrap is not matched. The matcher is deliberately NOT fixed (D-56) — the axis is 0
// live and the fix adds a second input assembly in a phase where each round's fix produced the next
// round's finding. What IS fixed is the source's own justification for accepting the bound, which
// argued the bypass needed a wrap falling INSIDE a word. The reproduction wraps BETWEEN words, which
// markdown soft-joins into fully legible prose. An accepted bound argued from a false premise is
// worse than an undisclosed one, so the false premise is DELETED rather than hedged at the same
// address — this phase's established remedy for a stale claim.
//
// THE SUPERSEDED WRAP-SHAPE WORD IS DECLARED ONCE, HERE, AND WAS CAPTURED FROM THE PRE-EDIT FILE
// RATHER THAN RETYPED — read out of `scripts/check-banned-claims.ts:65..:70` and independently out
// of the round-7 review's bolded quotation of that same sentence, the two agreeing. A phrase
// transcribed from a planning document is a second copy of the thing being policed, living in the
// file that polices it. Its single-occurrence property in THIS file is asserted below, so a
// `grep -c` over it counts its declaration and nothing else.
const SUPERSEDED_WRAP_SHAPE = "mid-token";

/** The residual register id this round opened for the axis; the source must point at it. */
const HARD_WRAP_RESIDUAL_ID = "V-29-57-01";

describe("check-banned-claims — the in-source residual record names the actual bypass (D-56)", () => {
  it("SOURCE SHAPE: the residual cross-references the V- id, and the superseded wrap-shape word is gone", () => {
    const src = readFileSync(GATE_TS, "utf8");
    // ASSERT THE HARNESS'S OWN PREMISE FIRST. A zero-byte read makes every assertion below pass
    // vacuously — `includes` on "" is false and a zero occurrence count is exactly what this case
    // wants to see. This phase produced that false result in six separate instances across four
    // consecutive rounds, so the premise is asserted rather than assumed.
    expect(src.length, "the gate source was not read").toBeGreaterThan(1000);

    // THE SECTION IS DERIVED, NOT SLICED AT A LINE NUMBER. The residual record runs from its own
    // banner to the next docblock rule, and both are read out of the file. A hand-typed line range
    // would drift silently the first time the paragraph above it grew — this repository's own
    // set-literal drift class, landing inside a case written to hold a residual in place.
    const srcLines = src.split("\n");
    const start = srcLines.findIndex((l) => l.includes("RECORDED RESIDUAL, NOT CLAIMED AWAY"));
    expect(start, "the residual record's banner is gone from the gate source").toBeGreaterThan(-1);
    const rel = srcLines.slice(start + 1).findIndex((l) => /^\/\/ -{20,}$/.test(l));
    expect(rel, "the residual record has no closing rule").toBeGreaterThan(-1);
    const section = srcLines.slice(start, start + 1 + rel);
    // THE PREMISE FLOOR IS A VACUITY CHECK AND NOTHING MORE, AND ITS VALUE IS DELIBERATE. A floor
    // set near the section's actual length would red BEFORE the assertion under test whenever the
    // section is legitimately shorter — which is exactly what a first draft of this case did against
    // the pre-edit source, where the section is 20 lines: a "premise" tuned to a number that
    // collides with the subject stops being a premise and becomes a second, accidental subject. So
    // the floor only catches an extraction that returned nothing, and the real premise is stated as
    // CONTENT: the section must contain the sub-residual this case is about.
    expect(section.length, "the residual section extraction returned nothing").toBeGreaterThan(5);
    expect(
      section.join("\n"),
      "the derived section is not the one carrying the hard-wrap residual",
    ).toContain("A SECOND, NARROWER RESIDUAL");

    // (1) THE CROSS-REFERENCE, INSIDE THE SECTION. An accepted bound with no id is indistinguishable
    // from a silent drop to the next reader, which is the whole reason D-56 opened one — and an id
    // parked elsewhere in the file would not be read by anyone editing this bound.
    const idAt = lineIndexesOf(section.join("\n"), HARD_WRAP_RESIDUAL_ID);
    expect(
      idAt.length,
      `the residual record does not cross-reference ${HARD_WRAP_RESIDUAL_ID}`,
    ).toBeGreaterThanOrEqual(1);

    // (2) THE FALSE PREMISE IS GONE, NOT SOFTENED. It described a wrap falling inside a word, which
    // no reader would parse as a claim — a bound argued from a shape the reproduction does not use.
    const supersededAt = lineIndexesOf(src, SUPERSEDED_WRAP_SHAPE);
    expect(
      supersededAt.length,
      `the superseded wrap-shape word returned at line(s) ${supersededAt.map((i) => i + 1).join(", ")}`,
    ).toBe(0);

    // (3) DELETION IS NOT THE POINT EITHER. The residual itself must survive the correction, or
    // "the false premise is gone" would be satisfiable by deleting the disclosure — a gate that
    // stops recording what it cannot see is not an improvement on one that misdescribes it. The
    // two load-bearing halves are the bound itself and the standing refusal of a global
    // normalization, which is correct and must not be read as licence by a later editor.
    const residual = section
      .map((l) => l.replace(/^\/\/ ?/, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .toLowerCase();
    expect(residual, "the residual no longer states that matching is line-oriented").toContain(
      "line-oriented",
    );
    expect(residual, "the standing refusal of a global normalization was dropped").toContain(
      "normalize whitespace",
    );
    expect(residual, "the residual no longer names its direction").toContain("fail-open");

    // (4) THE CONSTANTS THIS CASE POLICES WITH ARE DECLARED EXACTLY ONCE IN THIS FILE, so the
    // `grep -c` evidence in the plan's acceptance criteria reads the number it names.
    const self = readFileSync(new URL(import.meta.url), "utf8");
    expect(lineIndexesOf(self, `"${SUPERSEDED_WRAP_SHAPE}"`).length).toBe(1);
    expect(lineIndexesOf(self, `"${HARD_WRAP_RESIDUAL_ID}"`).length).toBe(1);
  });
});
