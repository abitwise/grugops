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
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
  readdirSync,
  copyFileSync,
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
import {
  BANNED_CLAIM_LITERALS,
  BANNED_CLAIM_SCAN_COUNT,
  BANNED_CLAIM_SCAN_PARTS,
  BANNED_CLAIM_EXEMPT_REGION,
  BANNED_CLAIM_EXCLUDED,
  BANNED_CLAIM_EXCLUDED_LOCATIONS,
  CONFORMANCE_VERB_MARKERS,
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
  countBannedClaimOccurrences,
  // (Plan 29-41, G-29-2) The SECOND marker list. Imported as a named binding for the same reason
  // the reach pins above are: a named import of a missing export is a module-load error, so deleting
  // this list fails loudly here instead of turning every marker plant below into the string
  // "undefined" — which no gate matches, and which would make every RED case pass as a green.
  BENEFIT_VERB_MARKERS,
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
//   * `CONDITIONAL_NAME` selected on `requiresOnSameLine !== undefined` ALONE. That predicate matched
//     exactly one member when it was written and matches THREE now.
//   * `COMPREHENSION_CLAIM` selected on the group ALONE, which is now true of the two conditional
//     bare terms as well. Had a reorder put the bare term `comprehension` first, the comprehension
//     plant would have carried NO benefit marker, produced NO finding — and its case would still have
//     PASSED, because the gate's own banner line contains the word "comprehension" and the case
//     asserts `toContain`. A RED case going green while proving nothing, which is this repository's
//     set-literal-drift class arriving inside the assertions written to prevent it.
//
// So each predicate below names a property that DISTINGUISHES its member from every sibling, and
// every selection is pinned by an explicit expectation naming what it selected (see "the plant
// selection itself" below). A declaration reorder now reds AT THE SELECTION, where the failure names
// the right cause, instead of at some distant case whose message names the wrong one.
const UNCONDITIONAL_NAME = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "standard-name" && l.requiresOnSameLine === undefined,
);
/** The discipline's NAME: the standard-name group's conditional member, on the CONFORMANCE list. */
const CONDITIONAL_NAME = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "standard-name" && l.requiresOnSameLine !== undefined,
);
const TOKEN_CLAIM = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "token-economy",
);
/** The ENUMERATED comprehension literal — unconditional, and the pre-fix grammar's whole subject. */
const COMPREHENSION_CLAIM = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "comprehension" && l.requiresOnSameLine === undefined,
);

/**
 * (Plan 29-42) The comprehension group's CONDITIONAL bare terms — the rule plan 29-41 landed in place
 * of the open enumeration. Two of them, because one member of the measured family carries no
 * occurrence of the first term at all and is outside that rule by construction.
 *
 * Held as a list rather than as two `find`s so the count is a property of the authority and not of
 * this file, and indexed only after the identity case below has pinned what each index selected.
 */
const COMPREHENSION_TERMS = BANNED_CLAIM_LITERALS.filter(
  (l) => l.group === "comprehension" && l.requiresOnSameLine !== undefined,
);
const BARE_COMPREHENSION = COMPREHENSION_TERMS[0];
const BARE_UNDERSTAND = COMPREHENSION_TERMS[1];

// Non-vacuity on the selection itself. A `find` that returned undefined would make every plant
// below the string "undefined", which no gate matches — and every RED case would pass as a GREEN.
if (
  UNCONDITIONAL_NAME === undefined ||
  CONDITIONAL_NAME === undefined ||
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

const CONFORMANCE_VERB = CONFORMANCE_VERB_MARKERS[0];

// The three benefit markers the measured family actually needs, selected by index and pinned by
// identity in the selection case below — a marker list has no property to select on but its own
// value, so the index is the selection and the pin is what makes a reorder loud.
const MARKER_IMPROVE = BENEFIT_VERB_MARKERS[0];
const MARKER_EASIER = BENEFIT_VERB_MARKERS[2];
const MARKER_BOOST = BENEFIT_VERB_MARKERS[3];

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
 * case-insensitively, with NO co-occurrence condition. That is exactly the set of comprehension
 * members that carry no `requiresOnSameLine` today, so it is DERIVED from the authority rather than
 * retyped — six strings retyped here would be the second copy of the list this whole file exists to
 * refuse. The derivation has a second, better property: if a later editor takes the rejected
 * option (b) and APPENDS a phrasing to the group, that phrasing enters this historical shape too, the
 * historical verdict on the family row it closes flips, and the recorded-verdict case below reds by
 * name. The refusal in `BANNED_CLAIM_EXCLUDED` is therefore held by an assertion and not only by a
 * paragraph.
 */
const HISTORICAL_ENUMERATED_COMPREHENSION: readonly string[] =
  BANNED_CLAIM_LITERALS.filter(
    (l) => l.group === "comprehension" && l.requiresOnSameLine === undefined,
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
const ADJACENT_PLANT = `The kit ${CONFORMANCE_VERB}s to ${UNCONDITIONAL_NAME.literal} ${CONDITIONAL_NAME.literal}.`;
/** The discipline's bare name with NO conformance verb — legal, and the conditional arm's control. */
const BARE_NAME_PLANT = `Writers of ${CONDITIONAL_NAME.literal} choose one word per meaning.`;
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

/**
 * How many conditional members the SOURCE declares, counted from the source text.
 *
 * DERIVED INDEPENDENTLY OF THE ARRAY WALK ON PURPOSE (the standing lesson: a vacuity floor catches an
 * EMPTY denominator but never a SILENTLY SHORT one, so the element count must not come from the loop
 * that consumes it). This reads the `.ts` and counts the member declarations that name a marker list.
 * A member written on ONE line, which this pattern would not see, makes the two numbers DISAGREE and
 * reds — the safe direction — rather than shortening both together.
 */
function declaredConditionalMembers(): number {
  return (
    readFileSync(GATE_TS, "utf8").match(
      /^ +requiresOnSameLine: [A-Z_]+,$/gm,
    ) ?? []
  ).length;
}

/** How many benefit markers the SOURCE declares, by the same independent route. */
function declaredBenefitMarkers(): number {
  const src = readFileSync(GATE_TS, "utf8");
  const block = src.slice(
    src.indexOf("export const BENEFIT_VERB_MARKERS"),
    src.indexOf("export const BANNED_CLAIM_LITERALS"),
  );
  return (block.match(/^ {2}"[a-z]+",$/gm) ?? []).length;
}

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

/**
 * (Plan 29-23) One sentence carrying EXACTLY ONE banned-claim occurrence, used to fill a mirror's
 * exemption region up to the reach the gate pins. Deliberately NOT one of the plant constants above:
 * the region-scoped cases locate their plants with `indexOf`/`lastIndexOf` over the whole document,
 * and a filler reusing a plant's exact text would silently move those lookups onto a filler line.
 * Its occurrence count is not assumed — a case below derives it through the gate's own counter.
 */
const REACH_FILLER = `The profile makes no ${TOKEN_CLAIM.literal} claim of any kind.`;

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
  const count = opts.headings ?? 1;
  const targetExtent = opts.extent ?? BANNED_CLAIM_EXEMPT_EXTENT;
  for (let n = 0; n < count; n++) {
    const block = [heading, "", body, ""];
    for (let k = 0; k < need; k++) block.push(REACH_FILLER, "");
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
const OVERLAP = 1; // agent-factory/README.md is in both parts
const FILLER_COUNT = BANNED_CLAIM_SCAN_COUNT - (KIT_NAMED + PUBLIC_DOCS - OVERLAP);

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
  write(KIT_README);
  if (spec.omitProfile !== true) write(PROFILE, profileDoc(spec.profile));
  for (const f of fillers) write(f);
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

// ── The plant selection itself (plan 29-42, task 1) ───────────────────────────────────────────

describe("check-banned-claims — the plant selection itself", () => {
  it("every selector selected the literal its NAME says, so a declaration reorder reds HERE", () => {
    // The quiet half of this plan. Each expectation below names one literal, and that is the ONLY
    // place in this file where a member's text is typed rather than composed — as an EXPECTATION about
    // what was selected, never as a needle handed to the gate. A reorder of BANNED_CLAIM_LITERALS now
    // fails this case by name instead of defanging a plant three hundred lines away.
    expect(UNCONDITIONAL_NAME.literal).toBe("ASD-STE100");
    expect(CONDITIONAL_NAME.literal).toBe("Simplified Technical English");
    expect(CONDITIONAL_NAME.requiresOnSameLine).toBe(CONFORMANCE_VERB_MARKERS);
    expect(TOKEN_CLAIM.literal).toBe("token economy");
    expect(COMPREHENSION_CLAIM.literal).toBe("improves comprehension");
    // The two conditional bare terms, in declaration order, with their marker list identified by
    // REFERENCE rather than by length: two lists of equal size would satisfy a count and a plant
    // composed from the wrong one would still red, for the wrong reason.
    expect(COMPREHENSION_TERMS.map((t) => t.literal)).toEqual([
      "comprehension",
      "understand",
    ]);
    for (const t of COMPREHENSION_TERMS) {
      expect(t.requiresOnSameLine).toBe(BENEFIT_VERB_MARKERS);
    }
    // The markers the family plants are composed from.
    expect(CONFORMANCE_VERB).toBe("conform");
    expect(MARKER_IMPROVE).toBe("improve");
    expect(MARKER_EASIER).toBe("easier");
    expect(MARKER_BOOST).toBe("boost");
  });

  it("the marker-plant TEMPLATE smuggles in no second marker and no enumerated literal", () => {
    // A template carrying a marker of its own would credit every per-marker red to the template, and
    // all seven cases below would pass against a gate that only ever matched that one marker.
    const skeleton = markerPlant("");
    for (const m of BENEFIT_VERB_MARKERS) {
      expect(skeleton.toLowerCase().includes(m.toLowerCase())).toBe(false);
    }
    expect(historicallyNamed(skeleton)).toBe(false);
  });

  it("PREMISE: this gate's source and this file are grep-visible — no control byte hides them", () => {
    // ASSERT THE HARNESS'S OWN PREMISE, WHICH THIS PLAN LEARNED THE HARD WAY AND IS RECORDING AS AN
    // ASSERTION RATHER THAN AS A LESSON.
    //
    // A single NUL byte anywhere in a file makes BSD `grep` classify it as binary and report ZERO
    // matches with NO warning and exit status 1 — indistinguishable from "the string is absent". One
    // was written into THIS file while plan 29-42 was being executed, and two of that plan's own
    // acceptance greps returned a confident, false 0 because of it. Every guard in this repository
    // that reasons about source text — and several of them do — is exposed to the same silence, and
    // this phase's record already contains six false harness results across four rounds.
    //
    // Asserted over BOTH files because the gate's source is what the guards grep and this file is what
    // the acceptance criteria grep. \n and \t are the only control characters a source file needs.
    for (const p of [GATE_TS, join(ROOT, "scripts", "check-banned-claims.test.ts")]) {
      const bytes = readFileSync(p);
      const offending: number[] = [];
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (b === 0x09 || b === 0x0a) continue;
        if (b < 0x20 || b === 0x7f) offending.push(i);
      }
      expect({ file: p, offending: offending.slice(0, 5) }).toEqual({
        file: p,
        offending: [],
      });
      // ...and the floor: a zero-length read would satisfy the loop above vacuously.
      expect(bytes.length).toBeGreaterThan(1000);
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
    // ...and it is a HISTORICAL shape, not a live predicate: it must not be conditional on anything.
    for (const l of BANNED_CLAIM_LITERALS.filter(
      (m) => m.group === "comprehension" && m.requiresOnSameLine === undefined,
    )) {
      expect(l.requiresOnSameLine).toBeUndefined();
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
    expect(stdout).toContain(CONDITIONAL_NAME.literal);
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

// ── The conditional arm ───────────────────────────────────────────────────────────────────────

// (Plan 29-42) Titled for the ARM, not for a count. This block's old title asserted a COUNT of one
// conditional literal while three members were conditional — a case NAME is what a reporter prints
// and what the next reader greps, so a stale singular there is the same defect as a stale singular in
// a PASS line. The old title is DESCRIBED and not quoted, for the reason the gate's own source gives
// at its PASS-line rewrite: this repository's guards scan source text without stripping comments, so
// quoting a deleted singular verbatim re-registers it as a live site of the very thing deleted.
describe("check-banned-claims — the conditional arm, on the conformance list", () => {
  it("does NOT fire on the discipline's bare name with no conformance verb on the line", () => {
    // THE ADMISSION TEST, ASSERTED. Banning the bare name would make it impossible to write a
    // correct sentence that names the discipline, and going green would then require deleting
    // correct text. This case is what keeps the conditional arm conditional.
    const planted = "agent-factory/workflows/006-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-bare-", { plant: { [planted]: BARE_NAME_PLANT } }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("DOES fire on the same name once a conformance verb joins it on that line", () => {
    // The discriminating half. Without it the case above would pass against a gate whose
    // conditional arm never matches anything at all.
    const planted = "agent-factory/workflows/006-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-bare-verb-", {
        plant: {
          [planted]: `${BARE_NAME_PLANT.slice(0, -1)}, and the kit ${CONFORMANCE_VERB}s to it.`,
        },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(CONDITIONAL_NAME.literal);
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

  it("the family covers EVERY conditional comprehension member, and five rows were open", () => {
    // TWO independent vacuity floors, because the family table is a hand-written list and this
    // repository's second systemic failure class is a hand-written list rotting while green.
    //
    // (1) The COVERAGE floor is derived from the AUTHORITY, not from the table: every conditional
    // comprehension member must be the attributing literal of at least one row. The row that would go
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

describe("check-banned-claims — every benefit marker, alone on its line", () => {
  // A marker admitted by a measurement and held by no assertion is a member of the list that nothing
  // proved does anything. Plan 29-41 admitted seven on measured counts; these are the assertions that
  // keep the measurement true.
  for (const marker of BENEFIT_VERB_MARKERS) {
    it(`marker "${marker}" ALONE on the line turns the bare term into a finding`, () => {
      const plant = markerPlant(marker);
      // The marker under test is the ONLY one present, asserted before the plant is used, so a red
      // cannot be credited to a marker that was not the one under test.
      expect(
        BENEFIT_VERB_MARKERS.filter((m) =>
          plant.toLowerCase().includes(m.toLowerCase()),
        ),
      ).toEqual([marker]);
      // ...and no enumerated literal is in the line either, so the red is the RULE's and not the
      // enumeration's.
      expect(historicallyNamed(plant)).toBe(false);

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
  }

  it("CONTROL: the same line with NO marker at all is GREEN, so the rule stayed conditional", () => {
    // The discrimination that proves the rule did not quietly become unconditional. Without it every
    // case above would pass against a gate that banned the bare word outright — which would make the
    // honest denial unsayable, and going green would then mean deleting correct text.
    const plant = `The profile makes no claim about ${BARE_COMPREHENSION.literal} in either direction.`;
    expect(
      BENEFIT_VERB_MARKERS.filter((m) =>
        plant.toLowerCase().includes(m.toLowerCase()),
      ),
    ).toEqual([]);
    expect(plant).toContain(BARE_COMPREHENSION.literal);
    const { status, stdout } = runGate(
      makeMirror("gops-banned-nomarker-", {
        plant: { "agent-factory/workflows/012-filler.md": plant },
      }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("the marker list the cases walked is the one the SOURCE declares — derived independently", () => {
    // The element count comes from the source text, not from the loop above. A loop that walked a
    // silently short list would satisfy every case it ran and report nothing about the ones it did not.
    expect(BENEFIT_VERB_MARKERS.length).toBe(declaredBenefitMarkers());
    expect(BENEFIT_VERB_MARKERS.length).toBe(7);
    expect(new Set(BENEFIT_VERB_MARKERS).size).toBe(BENEFIT_VERB_MARKERS.length);
    for (const m of BENEFIT_VERB_MARKERS) expect(m.trim().length).toBeGreaterThan(2);
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
      // fixture that contradicted the property the case exists to assert.
      makeMirror("gops-banned-empty-region-", {
        profile: { regionBody: "", reach: 0 },
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
    expect(stdout).toContain(
      `suppresses ${derived} banned-claim occurrence(s), pinned at ${declared}`,
    );
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

  it("both parts are non-empty and the overlap arithmetic is the one the PASS line reports", () => {
    expect(BANNED_CLAIM_SCAN_PARTS.map((p) => p.name)).toEqual([
      "kit",
      "publicDocs",
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
    for (const member of bannedClaimScan()) {
      for (const excluded of BANNED_CLAIM_EXCLUDED_LOCATIONS) {
        expect(member.startsWith(excluded)).toBe(false);
      }
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
    // ── THE CONDITIONAL-MEMBER CARDINALITY, RE-MEASURED RATHER THAN REMOVED (plan 29-42) ────────
    //
    // THIS PIN WAS 1, IT FIRED, AND FIRING IS WHAT IT IS FOR. It is relaxed to the measured 3 with the
    // reason recorded HERE, at the assertion, because a pin deleted because it fired is the failure
    // mode this repository has closed three times at eight rounds each.
    //
    // WHAT CHANGED AND WHO CHANGED IT. Plan 29-41 (G-29-2, user decision (c)) replaced the
    // comprehension group's open enumeration with a RULE and admitted two conditional bare terms:
    // `comprehension` and `understand`, both on BENEFIT_VERB_MARKERS. Each was admitted on its own
    // measured hit count over the derived scan set, and the second exists because one member of the
    // measured family carries no occurrence of the first term at all. That is a recorded decision with
    // a number beside it — not a conditional member arriving silently, which is what this pin watches
    // for and still watches for.
    //
    // IT STAYS AN EQUALITY, NOT A LOWER BOUND. A FOURTH conditional member reds this line on the day
    // it lands and has to bring its own recorded reason, exactly as the second and third did. A
    // `toBeGreaterThanOrEqual` here would retire the assertion while leaving it looking alive.
    expect(
      BANNED_CLAIM_LITERALS.filter((m) => m.requiresOnSameLine !== undefined)
        .length,
    ).toBe(3);
    // All three groups are populated. A group that emptied out would leave a prohibition LANG-04
    // names with no literal behind it, while the PASS line still counted three groups.
    for (const g of ["standard-name", "token-economy", "comprehension"]) {
      expect(BANNED_CLAIM_LITERALS.some((m) => m.group === g)).toBe(true);
    }
  });

  it("REFUSES a conditional member declared with an EMPTY marker array", () => {
    // THE VACUITY SHAPE AT MEMBER GRANULARITY. A conditional member whose marker list is empty passes
    // straight through `lineHits`'s existing arm — `[].some(...)` is false, so the member `continue`s
    // on every line — and ships as a prohibition that matches NOTHING, forever, silently. The gate
    // would go on counting it in the PASS line as a pinned literal.
    const conditional = BANNED_CLAIM_LITERALS.filter(
      (m) => m.requiresOnSameLine !== undefined,
    );
    // THE DENOMINATOR IS DERIVED FROM THE SOURCE, NOT FROM THE ARRAY THE LOOP WALKS. A vacuity floor
    // catches an EMPTY list and never a SILENTLY SHORT one, and "assert the count you derived
    // independently" is the standing remedy in this repository.
    const declared = declaredConditionalMembers();
    expect(declared).toBe(3);
    expect(conditional.length).toBe(declared);
    let walked = 0;
    for (const m of conditional) {
      walked += 1;
      expect(m.requiresOnSameLine).toBeDefined();
      expect(m.requiresOnSameLine?.length ?? 0).toBeGreaterThan(0);
      // And every marker in it is usable: a blank marker would make `includes` true on every line and
      // turn the conditional member into an unconditional one without moving any count.
      for (const marker of m.requiresOnSameLine ?? []) {
        expect(marker.trim().length).toBeGreaterThan(2);
      }
    }
    expect(walked).toBe(declared);
  });

  it("the admission log records every refused candidate with a reason", () => {
    expect(BANNED_CLAIM_EXCLUDED.length).toBeGreaterThan(0);
    for (const e of BANNED_CLAIM_EXCLUDED) {
      expect(e.candidate.trim()).not.toBe("");
      expect(e.reason.trim().length).toBeGreaterThan(40);
    }
  });
});
