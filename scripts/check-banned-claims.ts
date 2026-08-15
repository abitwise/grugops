// check-banned-claims.ts — Phase 29 LANG-04 conformance/benefit-claim gate (D-29, D-44).
//
// Asserts that the shipped kit and the public documents carry ZERO controlled-language conformance
// claim, ZERO token-economy win claim and ZERO comprehension-benefit claim — anywhere except one
// named exemption region, which is the disclaimer that has to be able to quote a claim in order to
// deny it.
//
//   node scripts/check-banned-claims.js
// Exit 0 = every scanned document is free of the pinned claim literals; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS GATE EXISTS, AND WHY IT IS MECHANICAL RATHER THAN DISCIPLINARY.
//
// LANG-04 forbids a class of claim the kit must never make. The voice guard is this project's own
// proof of what a prohibition without a mechanism does over a full milestone: the caveman voice
// drifted entirely out of all seventeen role blocks while the guard that was supposed to hold it
// stayed green, because it measured sentence SHAPE and not voice. A prohibition that lives only in
// a rule document is a prohibition nobody can fail.
//
// So the prohibition is a gate. What the gate decides is a LITERAL question — does a pinned string
// appear outside one named region — and the gate is named for exactly that predicate. It is NOT
// named for, and never presented as enforcing, conformance with any standard: a guard named for a
// predicate it does not decide is the guard_caveman_preserved mistake with new vocabulary.
//
// ---------------------------------------------------------------------------------------------
// THIS FILE OWNS ONE LIST, AND THE ADMISSION TEST IS THE ONE dead-vocabulary.ts ALREADY WROTE.
//
// The rule, quoted verbatim from scripts/dead-vocabulary.ts:50-51 —
//
//   "if going green would require deleting correct text, the literal does not belong in this file."
//
// Every candidate below was run against the WHOLE scan set before it was admitted, and the hit
// count was recorded. Two candidates were REJECTED on that measurement and their exclusions are
// recorded in BANNED_CLAIM_EXCLUDED below rather than left as silent absences. A literal is a
// separate pinned member per spelling variant — never a pattern that guesses at variants, because
// a pattern admits shapes nobody measured and a reader cannot tell which.
//
// THIS MODULE MUST NEVER BE ADDED TO ANY GUARD'S SCAN SET, INCLUDING ITS OWN. By construction it
// contains every literal it defines, so it would fail its own check. It lives under scripts/, which
// the derivation below structurally cannot reach — the kit part walks agent-factory/ and the
// public-docs part is the set check-public-docs-vocabulary.ts already owns. The exclusion holds by
// construction rather than by anyone remembering it, and a case in the test file asserts it.
//
// ---------------------------------------------------------------------------------------------
// RECORDED RESIDUAL, NOT CLAIMED AWAY (`UNKNOWN - verify`).
//
// A BRAND-NEW CONFORMANCE CLAIM WRITTEN WITHOUT ANY PINNED LITERAL IS NOT MECHANICALLY DETECTABLE.
// No grep recognizes an assertive sentence written in new words — a sentence asserting that this
// kit meets a published standard, phrased without naming it, passes this gate green. So be precise
// about what a green run here means:
//
//   THIS GATE PROVES that no pinned literal appears outside the one named exemption region.
//   IT DOES NOT PROVE that no conformance, token-economy or comprehension claim exists.
//
// A SECOND, NARROWER RESIDUAL, RECORDED FOR THE SAME REASON. Matching is line-oriented, so a
// pinned literal HARD-WRAPPED ACROSS A LINE BOUNDARY is not matched. The answer is deliberately NOT
// to normalize whitespace before comparing: that would make the comparison inexact for every
// literal in order to reach one wrapping, and an inexact comparison is how a gate starts admitting
// shapes nobody measured. The literals are short enough to sit on one line, and a reviewer who
// wraps one mid-token has written something no reader would parse as a claim either.
//
// agent-factory/writing-profile.md states the same residual in its own prose, in the section this
// gate exempts, rather than letting a green run imply otherwise.
//
// ---------------------------------------------------------------------------------------------
// THE D-44 RED TRANSCRIPT — this guard was watched FAILING on a real claim in a real file.
//
// The standard's name appeared in ZERO kit files before this phase, so a check landed against this
// tree would have gone GREEN having never been watched fail. Plan 29-02 Task 1 therefore wrote one
// deliberate conformance sentence into agent-factory/writing-profile.md, outside the exemption
// region and marked with an HTML comment naming it as the draft claim. This gate landed against
// that tree. Measured 2026-08-13, `node scripts/check-banned-claims.js`:
//
//   banned literal                    group           hits  file:line:col
//   -------------------------------   -------------   ----  -------------------------------------
//   "token-economy"                   token-economy      1  agent-factory/workflows/
//                                                             18-context-compaction.md:27:231
//   "ASD-STE100"                      standard-name      1  agent-factory/writing-profile.md:32:29
//   "Simplified Technical English"    standard-name      1  agent-factory/writing-profile.md:32:40
//   -------------------------------   -------------   ----  -------------------------------------
//   TOTAL                                                3  over 82 scanned documents
//
//   exit code 1 — 1 CHECK(S) FAILED (one measured block carrying three findings)
//
// The planted line, quoted from the run:
//
//   agent-factory/writing-profile.md:32:29 — banned standard-name literal "ASD-STE100" —
//   "The grugops kit conforms to ASD-STE100 Simplified Technical English."
//
// TWO OF THE THREE WERE NOT PLANTED. The `token-economy` hit is a claim that was ALREADY in the
// shipped kit — agent-factory/workflows/18-context-compaction.md called the caveman voice "a token
// economy applied to memory", which project measurement on 2026-07-28 DISPROVED on this artifact.
// That is the drift this gate exists for, caught on its first run, and it is why the RED is
// evidence rather than theatre. Both the planted sentence and the pre-existing claim were deleted
// in the next commit.
//
// The third finding demonstrates the conditional arm and the adjacency rule at once: `ASD-STE100`
// and `Simplified Technical English` sit adjacently on ONE line and produce TWO findings, at
// columns 29 and 40, because the hit count is arithmetic over what was read.
//
// Task 2 then DELETED that sentence and re-ran the same committed .js to exit 0. The gate is
// BYTE-UNCHANGED across the transition — that is what makes the red credible, and `git diff` over
// the two commits shows the profile changed and this file not.
//
// The durable half is scripts/check-banned-claims.test.ts's PLANTED fixture. The tree can never
// again contain the claim, so without a hermetic mirror that plants it, this gate's only evidence
// would be one historical commit.
// ---------------------------------------------------------------------------------------------

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// The walk's WORK bound is taken from the ONE place this repository declares it rather than
// restated as a second literal.
import { MAX_WALK_ENTRIES } from "./kit-model.js";
// Plan 29-01's shared element-level vacuity rule (AP-1). This gate declares NO zero check of its
// own: the measurement is a required argument of reportMeasured, so a PASS line here cannot state a
// check that visited nothing.
import { reportMeasured } from "./vacuity.js";
// The public-document half of the scan set is DERIVED BY THE MODULE THAT ALREADY OWNS IT. Deriving
// root markdown and examples/ a second time here would be a second membership rule over one
// corpus, which is how two scan sets come to disagree about what a public document is.
import { publicDocsScan } from "./check-public-docs-vocabulary.js";

// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. When unset, resolve every
// path against the script-relative repo root (cwd does not matter). The truthiness ternary, not
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

/** Exported accessor so a later aggregator can fold this gate's verdict without a shared global. */
export const bannedClaimFails = (): number => FAILS;

const MARKDOWN_EXT = ".md";
const KIT_DIR = "agent-factory";

// ---------------------------------------------------------------------------
// THE ONE LIST. Three groups, every member a separately pinned literal.
//
// Matching is CASE-INSENSITIVE over the raw file bytes, on both sides — a re-capitalised claim is
// the same claim. The needle is lowercased at the point of use rather than assumed lowercase
// upstream (the 28-REVIEW WR-06 correction), so adding a mixed-case member here cannot silently
// turn this gate into a no-op.
// ---------------------------------------------------------------------------

export type BannedClaimGroup =
  | "standard-name"
  | "token-economy"
  | "comprehension";

export interface BannedClaimLiteral {
  readonly literal: string;
  readonly group: BannedClaimGroup;
  /**
   * When present, the literal is a finding ONLY on a line that also carries one of these markers.
   *
   * WHY ONE MEMBER IS CONDITIONAL, AND WHY THAT IS NOT A SECOND GRAMMAR. `Simplified Technical
   * English` is the name of an entire discipline, not a claim. Banning it outright would make it
   * impossible to write a correct sentence that NAMES the discipline in order to say grugops does
   * not conform to it — and going green on such a sentence would mean deleting correct text, which
   * is precisely what the admission test above forbids. The claim is the name PLUS a conformance
   * verb, so the pair is what is pinned. The hyphenated and spaced product names below stay
   * unconditional: those spellings identify one specific published standard, and the kit has no
   * reason to name it outside the disclaimer that denies affiliation with it.
   */
  readonly requiresOnSameLine?: readonly string[];
}

/**
 * The conformance / certification verb stems that turn the discipline's bare name into a claim.
 *
 * These are STEMS on purpose and each covers its whole family by substring: `conform` covers
 * conforms/conformant/conformance, `complian` covers compliant/compliance, `certif` covers
 * certified/certification, `endors` covers endorsed/endorsement, `approv` covers approved/approval.
 * They are NOT banned literals in their own right and must never become any: measured over the scan
 * set they hit 60, 18, 2 and 70 lines of entirely correct text about compliance regimes, release
 * approvals and ASVS certification requirements.
 */
export const CONFORMANCE_VERB_MARKERS: readonly string[] = [
  "conform",
  "complian",
  "certif",
  "endors",
  "approv",
  "accredit",
];

export const BANNED_CLAIM_LITERALS: readonly BannedClaimLiteral[] = [
  // ── Group 1: the standard's name and its spelling variants ──────────────────────────────────
  // Measured over the scan set at admission time: 0 hits each. The kit named this standard in ZERO
  // files before this phase, which is exactly why the D-44 draft claim had to be planted.
  { literal: "ASD-STE100", group: "standard-name" },
  { literal: "ASD-STE 100", group: "standard-name" },
  { literal: "ASD STE100", group: "standard-name" },
  { literal: "ASD STE 100", group: "standard-name" },
  { literal: "ASDSTE100", group: "standard-name" },
  { literal: "STE-100", group: "standard-name" },
  {
    literal: "Simplified Technical English",
    group: "standard-name",
    requiresOnSameLine: CONFORMANCE_VERB_MARKERS,
  },

  // ── Group 2: the token-economy win claim ────────────────────────────────────────────────────
  // `token-economy` hit ONCE at admission time, in agent-factory/workflows/18-context-compaction.md,
  // on the claim that the caveman voice is a token economy applied to memory. That is not correct
  // text being deleted to reach green — it is the disproven claim this gate exists to hold. Project
  // measurement (2026-07-28) found the fenced blocks RESTATE rather than compress. The sentence was
  // corrected in the same plan that landed this gate.
  { literal: "token economy", group: "token-economy" },
  { literal: "token-economy", group: "token-economy" },
  { literal: "fewer tokens", group: "token-economy" },
  { literal: "token savings", group: "token-economy" },
  { literal: "saves tokens", group: "token-economy" },
  { literal: "reduces token count", group: "token-economy" },
  { literal: "lowers token count", group: "token-economy" },

  // ── Group 3: the comprehension-benefit claim ────────────────────────────────────────────────
  // 0 hits each at admission time. No published evidence that controlled language improves
  // comprehension for a language model was located in either direction, so the kit must not ship
  // the claim.
  { literal: "improves comprehension", group: "comprehension" },
  { literal: "improve comprehension", group: "comprehension" },
  { literal: "comprehension benefit", group: "comprehension" },
  { literal: "easier for the model to understand", group: "comprehension" },
  { literal: "easier for a language model to understand", group: "comprehension" },
  { literal: "better understood by the model", group: "comprehension" },
];

/**
 * THE ADMISSION LOG — candidates measured and REJECTED, with the hit count that rejected them.
 *
 * Recorded here rather than dropped silently, because an absent literal reads to the next editor as
 * an oversight worth fixing. Each of these would have gone red on text this project keeps on
 * purpose, and the only route back to green would have been deleting correct text.
 */
export const BANNED_CLAIM_EXCLUDED: readonly {
  readonly candidate: string;
  readonly hits: number;
  readonly reason: string;
}[] = [
  {
    candidate: "token count",
    hits: 0,
    reason:
      "zero hits today, but the honest hedge this project actually needs to be able to write is " +
      '"its effect on token count is UNKNOWN - verify in both directions". Banning the topic would ' +
      "make the honest sentence unsayable and leave only the claim-shaped alternatives",
  },
  {
    candidate: "token win",
    hits: 1,
    reason:
      "hits agent-factory/workflows/18-context-compaction.md's `aggressive` dial — \"Maximum token " +
      'win" — which is TRUE and is not a controlled-language claim at all: the dial transmits the ' +
      "compact gist instead of the raw trajectory, so it genuinely sends less text",
  },
  {
    candidate: "conformance / compliant / certified / endorsed / approved, as bare literals",
    hits: 150,
    reason:
      "60 + 18 + 2 + 70 hits across compliance-regime documentation, ASVS certification rows, " +
      "release-approval steps and the README's own non-affiliation disclaimer. They survive only as " +
      "co-occurrence markers for the one conditional literal above",
  },
  {
    candidate: "STE, as a bare literal",
    hits: -1,
    reason:
      "REFUSED WITHOUT MEASUREMENT, and the reason is arithmetic rather than editorial: `ste` is a " +
      "substring of `system`. A case-insensitive substring test on it would report a finding on " +
      "every occurrence of the most common noun in this repository. Recorded so it is not " +
      "rediscovered as an obvious omission",
  },
];

// ---------------------------------------------------------------------------
// THE ONE NAMED EXEMPTION REGION — a file, a section, and a reason.
//
// The disclaimer must be able to NAME the standard in order to deny affiliation with it, and to
// QUOTE a claim form in order to say the kit does not make it. A prohibition that made its own
// denial illegal would be unwritable.
//
// THE BOUND: this exempts one section of one file and nothing else. It is asserted TWO-SIDED at run
// time — exactly one region must exist and it must be non-empty. A VANISHED region would silently
// make the disclaimer illegal and red the build on correct text; a DUPLICATED region would widen
// the hole by adding a second heading. Both are FAILs.
//
// THE FORBIDDEN ALTERNATIVE, NAMED SO IT IS NOT REDISCOVERED AS A GOOD IDEA: loosening the match so
// the disclaimer passes — skipping fenced blocks, skipping lines below some marker, matching only
// whole words — would delete the check for every other document to accommodate one section. If a
// second region ever earns an exemption, the answer is a second named triple with its own reason,
// never a weaker predicate.
// ---------------------------------------------------------------------------
export const BANNED_CLAIM_EXEMPT_REGION = {
  file: "agent-factory/writing-profile.md",
  heading: "## Disclaimer and honesty floor",
  reason:
    "the disclaimer must be able to name the standard, and to quote a claim form, in order to deny " +
    "both — a prohibition that makes its own denial illegal is unwritable",
} as const;

// ---------------------------------------------------------------------------
// docs/ IS EXCLUDED BY NAME, WITH ITS REASON, RATHER THAN BY SILENT OMISSION.
//
// docs/initial/ holds the historical specification, docs/catalog/ is generated, and docs/audit/
// holds the disposition register, the claim registry and the safety-surface list. Those are RECORDS
// OF WHAT WAS DECIDED, not claims the kit makes — and the claim registry in particular quotes
// public sentences verbatim by design, so scanning it would report the registry for holding the
// text it exists to hold. The same argument covers .planning/, which is the planning record and is
// archived at milestone close.
//
// This is recorded as a decision because the two parts below simply never reach docs/: the kit part
// walks agent-factory/ and the public-docs part is root markdown + examples/ + the kit README. The
// exclusion is structural; the reason is here so a reader meets it rather than inferring it.
// ---------------------------------------------------------------------------
export const BANNED_CLAIM_EXCLUDED_LOCATIONS: readonly string[] = [
  "docs/",
  ".planning/",
  "scripts/",
];

// Refusals raised while DERIVING the scan set. Collected rather than thrown: this is a GATE, and a
// gate's floor is to REPORT (the kit-model throw-versus-report split).
const DERIVATION_REFUSALS: string[] = [];

// Recursively enumerate every file under a scan entry. Directory entries are `.sort()`ed so two
// runs over the same tree are byte-identical. The budget is ONE mutable tally threaded through the
// whole walk, counting entries EXAMINED — so the bound limits WORK and is independent of the tree's
// shape. A truncated scan set passes every guard exactly the way a vacuous one does, so an overflow
// is a named refusal and never a short return.
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

// Part `kit`: every markdown file under agent-factory/, walked. A new kit document enters this scan
// by EXISTING, not by someone remembering to add it.
function kitMarkdown(): string[] {
  const acc: string[] = [];
  const refusal = walkFiles(KIT_DIR, { examined: 0 }, acc);
  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
  return acc.filter((f) => f.endsWith(MARKDOWN_EXT)).sort();
}

// Part `publicDocs`: the set check-public-docs-vocabulary.ts derives and pins. Taken WHOLE — never
// filtered, sliced or re-derived.
function publicDocsMembers(): string[] {
  return publicDocsScan().slice().sort();
}

export const BANNED_CLAIM_SCAN_PARTS: readonly {
  name: "kit" | "publicDocs";
  members: readonly string[];
}[] = [
  { name: "kit", members: kitMarkdown() },
  { name: "publicDocs", members: publicDocsMembers() },
];

/**
 * The DEDUPED union of the two parts, sorted.
 *
 * The parts OVERLAP by exactly one member today — agent-factory/README.md is both a kit document
 * and a public document — and the overlap is real rather than a derivation bug. Deduping is what
 * makes a finding in that file one finding instead of two identical ones; the arithmetic
 * `kit + publicDocs - overlap = total` is reported in the PASS line so a reader can check it rather
 * than take it. Sorted, so two runs over one tree produce byte-identical output.
 */
export function bannedClaimScan(): string[] {
  const seen = new Set<string>();
  for (const part of BANNED_CLAIM_SCAN_PARTS) {
    for (const m of part.members) seen.add(m);
  }
  return [...seen].sort();
}

/** The number of members in both parts at once — reported, never subtracted silently. */
export function bannedClaimScanOverlap(): number {
  const kit = new Set(BANNED_CLAIM_SCAN_PARTS[0].members);
  return BANNED_CLAIM_SCAN_PARTS[1].members.filter((m) => kit.has(m)).length;
}

/**
 * The pinned cardinality of the deduped union. 82 today: 73 kit markdown files + 10 public
 * documents − 1 overlap (agent-factory/README.md).
 *
 * TWO-SIDED. A set that silently SHRANK reports a clean pass over the documents it stopped reading;
 * a set that silently GREW is a scan nobody reviewed.
 */
export const BANNED_CLAIM_SCAN_COUNT = 82;

// ---------------------------------------------------------------------------
// The exemption region, located by EXACT heading line.
// ---------------------------------------------------------------------------

export interface ExemptRegion {
  /** 0-based line index of the heading itself. */
  readonly headingAt: number;
  /** 0-based index one past the last line of the region. */
  readonly endBefore: number;
}

const SAME_LEVEL_HEADING = /^## /;

/**
 * Locate the region and report every way it can be wrong. Returns the region when exactly one
 * well-formed region exists, and null otherwise — the caller then scans the file WHOLE, which is
 * the fail-closed direction: a broken exemption means more is checked, never less.
 *
 * EXPORTED (plan 29-18) so a case can assert the region's EXTENT as a NUMBER. No exit code can
 * express "the region ends AFTER the fenced heading rather than at it": a gate that exempts the
 * right lines and a gate that exempts too few both report through findings, and the two are
 * distinguishable only by where the region actually stops. This is the same disclosure phase 27
 * made for the grant-occurrence balance arm — a predicate a case cannot reach is a predicate
 * nothing pins — and it widens no behaviour: the function is unchanged apart from the keyword.
 */
export function locateExemptRegion(
  lines: readonly string[],
): ExemptRegion | null {
  const headings: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === BANNED_CLAIM_EXEMPT_REGION.heading) headings.push(i);
  }
  if (headings.length !== 1) {
    fail(
      `the one named exemption region is declared as \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\`, and that heading occurs ${headings.length} ` +
        `time(s) in the file. Exactly one is required, asserted two-sided: a VANISHED region makes ` +
        `the disclaimer illegal and reds the build on correct text, and a DUPLICATED region widens ` +
        `the hole by adding a second heading. Fix the document; do not relax this assertion`,
    );
    return null;
  }
  const headingAt = headings[0];
  let endBefore = lines.length;
  for (let i = headingAt + 1; i < lines.length; i++) {
    if (SAME_LEVEL_HEADING.test(lines[i])) {
      endBefore = i;
      break;
    }
  }
  const body = lines.slice(headingAt + 1, endBefore);
  if (body.every((l) => l.trim() === "")) {
    fail(
      `the exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` is EMPTY — the heading is present and carries no ` +
        `disclaimer beneath it. An empty exemption region exempts nothing and denies nothing, so it ` +
        `reads as a satisfied requirement while the disclaimer it names is gone`,
    );
    return null;
  }
  return { headingAt, endBefore };
}

// ---------------------------------------------------------------------------
// The scan.
// ---------------------------------------------------------------------------

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly literal: string;
  readonly group: BannedClaimGroup;
  readonly text: string;
}

/**
 * Every occurrence, not every line. Two banned literals sitting adjacently on one line produce TWO
 * findings, and the same literal twice on one line produces two — the hit count is arithmetic over
 * what was read, never a per-line boolean collapsed into one report.
 */
function occurrences(haystackLower: string, needleLower: string): number[] {
  const out: number[] = [];
  let i = haystackLower.indexOf(needleLower);
  while (i !== -1) {
    out.push(i);
    i = haystackLower.indexOf(needleLower, i + needleLower.length);
  }
  return out;
}

function renderFinding(f: Finding): string {
  return (
    `        ${f.file}:${f.line}:${f.column} — banned ${f.group} literal "${f.literal}" — ` +
    `${JSON.stringify(f.text)}\n` +
    `        Remedy: delete the claim. Do NOT add an exemption and do NOT narrow the scan set: ` +
    `there is exactly one named exemption region and BANNED_CLAIM_SCAN_COUNT is two-sided pinned, ` +
    `precisely so neither route to green is available`
  );
}

function runAll(): void {
  process.stdout.write(
    "\n[guard_banned_claims] the shipped kit and the public documents carry no conformance, " +
      "token-economy or comprehension claim, outside one named exemption region (LANG-04 / D-29, D-44)\n",
  );

  for (const refusal of DERIVATION_REFUSALS) {
    fail(`banned-claim scan derivation refused: ${refusal}`);
  }

  // VACUITY FLOOR, PER PART, BEFORE THE AGGREGATE PIN. A floor over the concatenated total could be
  // reached by one part while the other emptied out entirely, and the gate would report a verdict
  // over a corpus half of which it never opened.
  for (const part of BANNED_CLAIM_SCAN_PARTS) {
    if (part.members.length === 0) {
      fail(
        `the "${part.name}" part of the banned-claim scan set derived ZERO members — refusing to ` +
          `report a verdict over a part that contributes nothing, because a vacuous scan set ` +
          `passes every guard. This floor is per-part on purpose: either part could empty out ` +
          `while the total still cleared a floor written over the concatenation`,
      );
    }
  }

  const scan = bannedClaimScan();
  const overlap = bannedClaimScanOverlap();

  // TWO-SIDED PIN, worded so that moving it is visibly not the remedy.
  if (scan.length !== BANNED_CLAIM_SCAN_COUNT) {
    fail(
      `the banned-claim scan set derived ${scan.length} document(s), expected exactly ` +
        `${BANNED_CLAIM_SCAN_COUNT} (${BANNED_CLAIM_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
        `overlap ${overlap}) — walk both parts' derivations and the BANNED_CLAIM_EXCLUDED_LOCATIONS ` +
        `reasons BEFORE updating BANNED_CLAIM_SCAN_COUNT in scripts/check-banned-claims.ts. A new ` +
        `kit document is supposed to enter this scan by existing; moving the pin is how you ` +
        `acknowledge that it did, not how you make the failure go away`,
    );
  }

  // THE EXEMPTION REGION IS ASSERTED UP FRONT, NOT INSIDE THE SCAN LOOP.
  //
  // Located inside the loop, the assertion could only fire while the exempt FILE was a member of
  // the scan — so deleting the file outright skipped every one of its refusals, and the only thing
  // left naming the loss was the aggregate pin, which says "one document short" and never says
  // which document or that the disclaimer is gone. A vanished exemption file is not an absent
  // exemption; it is the disclaimer that has to exist for the prohibition to be writable at all.
  let exemptRegion: ExemptRegion | null = null;
  const exemptAbs = abs(BANNED_CLAIM_EXEMPT_REGION.file);
  if (!existsSync(exemptAbs)) {
    fail(
      `the document carrying the one named exemption region, ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.file}\`, does not exist at ${exemptAbs}. That document is ` +
        `the disclaimer this prohibition is only writable because of — ${BANNED_CLAIM_EXEMPT_REGION.reason}. ` +
        `A missing exemption document is refused by name here, because every other document is ` +
        `still scanned and the loss would otherwise read as a clean run`,
    );
  } else {
    exemptRegion = locateExemptRegion(
      readFileSync(exemptAbs, "utf8").split("\n"),
    );
  }

  // The findings, in derived-sorted scan order, then by line, then by literal declaration order.
  const findings: Finding[] = [];
  let visited = 0;

  for (const file of scan) {
    let text: string;
    try {
      text = readFileSync(abs(file), "utf8");
    } catch (e) {
      // A stack trace is not a verdict. The file is NOT counted as visited, so the shared vacuity
      // rule's denominator floor reports the short scan by name.
      fail(
        `${file} is a member of the banned-claim scan set and could not be read ` +
          `(${(e as Error).message}) — refusing to report a verdict over a document that was never ` +
          `opened. A missing document is not a clean one`,
      );
      continue;
    }
    visited += 1;

    const lines = text.split("\n");
    const region =
      file === BANNED_CLAIM_EXEMPT_REGION.file ? exemptRegion : null;

    for (let i = 0; i < lines.length; i++) {
      if (
        region !== null &&
        i >= region.headingAt &&
        i < region.endBefore
      ) {
        continue; // inside the one named exemption region
      }
      const lower = lines[i].toLowerCase();
      for (const member of BANNED_CLAIM_LITERALS) {
        if (
          member.requiresOnSameLine !== undefined &&
          !member.requiresOnSameLine.some((v) => lower.includes(v.toLowerCase()))
        ) {
          continue; // the name without a conformance verb is the discipline, not a claim
        }
        for (const at of occurrences(lower, member.literal.toLowerCase())) {
          findings.push({
            file,
            line: i + 1,
            column: at + 1,
            literal: member.literal,
            group: member.group,
            text: lines[i].trim(),
          });
        }
      }
    }
  }

  // The shared element-level vacuity rule (AP-1). This gate declares no zero check of its own; the
  // measurement is a required argument, so a PASS line cannot be printed over a loop that never ran.
  FAILS += reportMeasured(
    {
      label: "banned claims",
      visited,
      expected: scan.length,
      findings,
    },
    { pass, fail },
    renderFinding,
  );

  if (FAILS === 0) {
    // A PASS line must never state a check that was not performed: every number below is read from
    // the run that just happened, and the exemption is reported inline with its reason so a reader
    // meets it here rather than inferring it from a file's silence.
    pass(
      `LANG-04: ${scan.length} document(s) carry zero banned claim literal outside the one named ` +
        `exemption region — ${BANNED_CLAIM_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
        `overlap ${overlap}; ${BANNED_CLAIM_LITERALS.length} pinned literal(s) across ` +
        `${new Set(BANNED_CLAIM_LITERALS.map((l) => l.group)).size} group(s), of which ` +
        `${BANNED_CLAIM_LITERALS.filter((l) => l.requiresOnSameLine !== undefined).length} is ` +
        `conditional on a conformance verb from ${CONFORMANCE_VERB_MARKERS.length} pinned marker(s); ` +
        `1 exemption region (${BANNED_CLAIM_EXEMPT_REGION.file} § ${BANNED_CLAIM_EXEMPT_REGION.heading} ` +
        `— ${BANNED_CLAIM_EXEMPT_REGION.reason}); ${BANNED_CLAIM_EXCLUDED.length} candidate ` +
        `literal(s) refused at admission and recorded with their hit counts`,
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
// `node scripts/check-banned-claims.js` run ZERO checks and exit 0, a fabricated green.
// The guard is also what lets the test file IMPORT this module for its exported pins without the
// import running the check and calling process.exit inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
