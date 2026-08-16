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
// THE ONE FENCE TOGGLE AND THE ONE SECTION LOCATOR (plans 29-18 and 29-23, WR-06 / WR-08).
// `locateExemptRegion` answers two section-extent questions, and this tree answers both in exactly
// one place. `unfencedHeadingIndex` gives the region's own heading and `sectionEndIndex` gives its
// end; `fencedLineFlags` is taken directly for the exactly-one heading COUNT, which is not a first
// index and therefore is not a question either locator answers. The delimiter class is NOT
// re-declared here, no second state machine is written, and this module now declares no section
// predicate of its own.
import { fencedLineFlags, unfencedHeadingIndex, sectionEndIndex, } from "./frontmatter.js";
// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. When unset, resolve every
// path against the script-relative repo root (cwd does not matter). The truthiness ternary, not
// `??`: `CHECK_ROOT=""` must degrade to the repo root, exactly as every sibling gate does.
const ROOT = process.env.CHECK_ROOT
    ? process.env.CHECK_ROOT
    : join(import.meta.dirname, "..");
const abs = (rel) => join(ROOT, rel);
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
/** Exported accessor so a later aggregator can fold this gate's verdict without a shared global. */
export const bannedClaimFails = () => FAILS;
const MARKDOWN_EXT = ".md";
const KIT_DIR = "agent-factory";
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
export const CONFORMANCE_VERB_MARKERS = [
    "conform",
    "complian",
    "certif",
    "endors",
    "approv",
    "accredit",
];
export const BANNED_CLAIM_LITERALS = [
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
export const BANNED_CLAIM_EXCLUDED = [
    {
        candidate: "token count",
        hits: 0,
        reason: "zero hits today, but the honest hedge this project actually needs to be able to write is " +
            '"its effect on token count is UNKNOWN - verify in both directions". Banning the topic would ' +
            "make the honest sentence unsayable and leave only the claim-shaped alternatives",
    },
    {
        candidate: "token win",
        hits: 1,
        reason: "hits agent-factory/workflows/18-context-compaction.md's `aggressive` dial — \"Maximum token " +
            'win" — which is TRUE and is not a controlled-language claim at all: the dial transmits the ' +
            "compact gist instead of the raw trajectory, so it genuinely sends less text",
    },
    {
        candidate: "conformance / compliant / certified / endorsed / approved, as bare literals",
        hits: 150,
        reason: "60 + 18 + 2 + 70 hits across compliance-regime documentation, ASVS certification rows, " +
            "release-approval steps and the README's own non-affiliation disclaimer. They survive only as " +
            "co-occurrence markers for the one conditional literal above",
    },
    {
        candidate: "STE, as a bare literal",
        hits: -1,
        reason: "REFUSED WITHOUT MEASUREMENT, and the reason is arithmetic rather than editorial: `ste` is a " +
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
    reason: "the disclaimer must be able to name the standard, and to quote a claim form, in order to deny " +
        "both — a prohibition that makes its own denial illegal is unwritable",
};
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
export const BANNED_CLAIM_EXCLUDED_LOCATIONS = [
    "docs/",
    ".planning/",
    "scripts/",
];
// Refusals raised while DERIVING the scan set. Collected rather than thrown: this is a GATE, and a
// gate's floor is to REPORT (the kit-model throw-versus-report split).
const DERIVATION_REFUSALS = [];
// Recursively enumerate every file under a scan entry. Directory entries are `.sort()`ed so two
// runs over the same tree are byte-identical. The budget is ONE mutable tally threaded through the
// whole walk, counting entries EXAMINED — so the bound limits WORK and is independent of the tree's
// shape. A truncated scan set passes every guard exactly the way a vacuous one does, so an overflow
// is a named refusal and never a short return.
function walkFiles(rel, budget, acc) {
    const a = abs(rel);
    if (!existsSync(a))
        return null;
    const st = statSync(a);
    if (st.isDirectory()) {
        for (const entry of readdirSync(a).sort()) {
            budget.examined += 1;
            if (budget.examined > MAX_WALK_ENTRIES) {
                return (`the walk of ${rel} examined more than MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES} directory ` +
                    `entries, reaching ${join(rel, entry)} — refusing to continue and refusing to report a ` +
                    `verdict over the members collected so far, because a truncated scan set passes every ` +
                    `guard exactly the way a vacuous one does`);
            }
            const refusal = walkFiles(join(rel, entry), budget, acc);
            if (refusal !== null)
                return refusal;
        }
    }
    else if (st.isFile()) {
        acc.push(rel);
    }
    return null;
}
// Part `kit`: every markdown file under agent-factory/, walked. A new kit document enters this scan
// by EXISTING, not by someone remembering to add it.
function kitMarkdown() {
    const acc = [];
    const refusal = walkFiles(KIT_DIR, { examined: 0 }, acc);
    if (refusal !== null)
        DERIVATION_REFUSALS.push(refusal);
    return acc.filter((f) => f.endsWith(MARKDOWN_EXT)).sort();
}
// Part `publicDocs`: the set check-public-docs-vocabulary.ts derives and pins. Taken WHOLE — never
// filtered, sliced or re-derived.
function publicDocsMembers() {
    return publicDocsScan().slice().sort();
}
export const BANNED_CLAIM_SCAN_PARTS = [
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
export function bannedClaimScan() {
    const seen = new Set();
    for (const part of BANNED_CLAIM_SCAN_PARTS) {
        for (const m of part.members)
            seen.add(m);
    }
    return [...seen].sort();
}
/** The number of members in both parts at once — reported, never subtracted silently. */
export function bannedClaimScanOverlap() {
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
 *
 * ------------------------------------------------------------------------------------------------
 * (Plans 29-18 and 29-23, WR-06 / WR-08) BOTH SECTION-EXTENT QUESTIONS ARE ASKED OF THE ONE
 * SHARED LOCATOR, AND THIS MODULE DECLARES NO SECTION PREDICATE OF ITS OWN.
 *
 * This function used to answer two questions — "which line carries the region's own heading" and
 * "which same-level heading ends the region" — with predicates written here: an exact-equality
 * heading comparison and a private `/^## /` close. `scripts/frontmatter.ts` is the single place this
 * tree answers both, and three sibling gates already consume it. Both are DELETED. The heading comes
 * from `unfencedHeadingIndex` and the end from `sectionEndIndex` at level two, so the `trimEnd()`
 * normalisation — the axis on which the four locators of this class disagreed — is now applied in
 * exactly one place. A second grammar over bytes an authority already answers for is a defect in
 * this repository even while the two happen to agree.
 *
 * WHAT PLAN 29-18 ACTUALLY DID TO THIS EXEMPTION, STATED PLAINLY BECAUSE THE PARAGRAPH THAT USED TO
 * SIT HERE DENIED IT.
 *
 * The text this replaces asserted that nothing below was relaxed and that both truncation directions
 * were fail-closed. The first half was false. Making the close fence-aware moved the region's END
 * LATER, so strictly FEWER lines of the disclaimer document are scanned. Measured on the fixture the
 * round-2 review used, and reproduced in scripts/check-banned-claims.test.ts, the region's body went
 * from FOUR exempt lines to NINE. A LONGER EXEMPTION IS LESS CHECKING, NOT MORE. That is a
 * relaxation of a safety exemption, and a header claiming otherwise is a prose claim wider than the
 * assertion behind it — this repository's second systemic failure class wearing a sentence instead
 * of a set literal.
 *
 * WHY THE RELAXATION IS NONETHELESS RIGHT. A `## ` line the author wrote INSIDE a fenced example is
 * documentation and never structure. A region that stopped at one was not exempting fewer lines on
 * purpose; it was measuring the wrong bytes, and it truncated the disclaimer at the first heading
 * the disclaimer happened to QUOTE. The extra lines were always meant to be inside the region.
 *
 * AND THE RELAXATION IS GIVEN A MECHANISM RATHER THAN AN ARGUMENT. `BANNED_CLAIM_EXEMPT_SUPPRESSED`
 * below pins how many banned-claim occurrences this region actually lifts the prohibition on, the
 * gate publishes that number on every green run, and the two are compared two-sided. A future
 * widening is then an acknowledged edit with a reason, never a side effect of a heading landing
 * somewhere new — which is exactly how the widening above went unnoticed.
 *
 * THE ASYMMETRY WITH ITS SIBLING SURVIVES, AND IT IS THE HALF THAT WAS ALWAYS TRUE. Truncating THIS
 * region causes MORE of the document to be checked, so truncation here is fail-CLOSED. The sibling
 * locator in check-diff-disposition answers the same shape of question about a FROZEN region, and
 * truncation there is fail-OPEN — LESS gets protected. The two are NOT one bug at two addresses, and
 * a reader meeting both fixes in one round should not have to infer which is which.
 *
 * THE TWO NAMED REFUSALS AND THE EMPTY-REGION REFUSAL ARE UNCHANGED, wording and fail-closed null
 * return alike, because they are what this guard already gets right and a locator change is not
 * licence to touch them. No delimiter class is re-declared here and there is no opt-out parameter:
 * an opt-out is a second grammar with extra steps.
 * ------------------------------------------------------------------------------------------------
 */
export function locateExemptRegion(lines) {
    const text = lines.join("\n");
    // ── (Plan 29-32, WR-04 / IN-02) ONE ARRAY UNDER BOTH TRAVERSALS ─────────────────────────────
    //
    // THIS LINE IS THE STRUCTURAL HALF OF THE FIX, AND THE GUARDS BELOW IT ARE BELT AND BRACES.
    //
    // What used to sit here counted the region's heading over the CALLER'S `lines` while locating it
    // over `text` — two arrays assembled by two expressions — and consulted `fencedLineFlags(text)`,
    // an array indexed in TEXT coordinates, at a LINES index. The two agreed only by the accident
    // that `text === lines.join("\n")` round-trips for arrays whose elements carry no separator. When
    // a caller assembles its array on a different newline rule (`split("\r\n")` over a document with
    // one bare LF is enough) the coordinate systems shear, the count reads a fence flag belonging to
    // an unrelated line, and `unfencedHeadingIndex` answers `-1` for a heading the count just found.
    //
    // A GUARD ON A DISAGREEMENT THAT CAN STILL OCCUR IS A SMALLER FIX THAN A DISAGREEMENT THAT
    // CANNOT. So the route is deleted: BOTH traversals below walk `scanLines`, derived from the same
    // string the authority is asked about, and the flags array is the one computed from that string.
    // Count and locate are then provably over the same lines, and `-1` is unreachable by arithmetic
    // rather than by inspection.
    const scanLines = text.split("\n");
    // AND THE CALLER'S ARRAY IS HELD TO THE SAME COORDINATES, because the indices this function
    // RETURNS are spent against it. `runAll` slices the caller's own `lines` with `headingAt` and
    // `endBefore`, so an array that disagrees with `text.split("\n")` about where the lines are would
    // have the region applied one or more lines off its real position — a widening in exactly the
    // direction this whole block exists to close, and one the two guards below would not see because
    // both indices are perfectly valid IN TEXT COORDINATES. Refused by name rather than reconciled:
    // reconciling would pick a winner between two disagreeing assemblies of one document, which is a
    // second grammar with extra steps.
    if (scanLines.length !== lines.length) {
        fail(`the exemption document was handed to \`locateExemptRegion\` as ${lines.length} line(s) while ` +
            `\`lines.join("\\n")\` splits back into ${scanLines.length} — the caller's array was ` +
            `assembled on a different newline rule from the one the shared locator uses, so at least ` +
            `one element carries an embedded line separator. Every index this function returns is spent ` +
            `against the CALLER'S array, so the two must be the same array; refusing rather than ` +
            `returning a region measured in one coordinate system and applied in another. Fix the ` +
            `caller's split; do not reconcile the two here`);
        return null;
    }
    // THE COUNT TAKES THE PER-LINE TOGGLE; THE BOUND TAKES THE SHARED LOCATOR. Both are projections of
    // the SAME authority over the SAME array, and both apply the authority's own `trimEnd()`
    // equality, so the heading this gate COUNTS and the heading it LOCATES can never come to
    // disagree. `unfencedHeadingIndex` answers "the FIRST such line" and a count is not a first
    // index; wrapping it in a "find the next one after i" loop is deliberately NOT done, because a
    // second traversal with its own termination behaviour is precisely the shape this round is
    // deleting.
    const fenced = fencedLineFlags(text);
    let headingCount = 0;
    for (let i = 0; i < scanLines.length; i++) {
        // Only an UNFENCED occurrence is the region's own heading. A fenced one is a quotation of it.
        if (!fenced[i] &&
            scanLines[i].trimEnd() === BANNED_CLAIM_EXEMPT_REGION.heading)
            headingCount += 1;
    }
    if (headingCount !== 1) {
        fail(`the one named exemption region is declared as \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
            `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\`, and that heading occurs ${headingCount} ` +
            `time(s) in the file. Exactly one is required, asserted two-sided: a VANISHED region makes ` +
            `the disclaimer illegal and reds the build on correct text, and a DUPLICATED region widens ` +
            `the hole by adding a second heading. Fix the document; do not relax this assertion`);
        return null;
    }
    const headingAt = unfencedHeadingIndex(text, BANNED_CLAIM_EXEMPT_REGION.heading);
    // ── THE AUTHORITY'S `-1` CONTRACT, HONOURED AT THE CONSUMER (plan 29-32, WR-04) ─────────────
    //
    // `-1` IS A LEGAL ANSWER, NOT AN ERROR CODE AND NOT AN INDEX. `unfencedHeadingIndex` documents it
    // as "the document carries no such unfenced line", and a consumer that does ARITHMETIC on it
    // before checking it has quietly reintroduced a SECOND BEHAVIOUR over bytes this tree has exactly
    // one authority for — which is the LANG-07 argument applied at the consumer rather than at the
    // parser. Unchecked, `headingAt + 1` is `0`, the region is bounded from the top of the document,
    // and the scan's `i >= region.headingAt` test is true for EVERY line from zero: a safety
    // exemption silently widened to the whole file.
    //
    // The refusal states the SITUATION rather than the symptom, and it names the DIRECTION, because
    // the obvious "repair" — defaulting the index to zero — is precisely the failure this guard
    // exists to prevent, written out as a remedy. scripts/frontmatter.test.ts turns this one site
    // into a tree-wide class assertion; the sibling posture is `readDispositionRows` in
    // scripts/check-diff-disposition.ts, copied rather than reinvented.
    //
    // After the structural half above, this is UNREACHABLE through the public signature: the count
    // and the locate walk one array, so a count of exactly one implies an index that exists. It is
    // kept because unreachability is a property of today's code and a guard is a property of the
    // contract; scripts/check-banned-claims.test.ts watches it fire on a build with that one
    // expression reverted, so it is a live assertion rather than a comment.
    if (headingAt === -1) {
        fail(`the exempt heading \`${BANNED_CLAIM_EXEMPT_REGION.heading}\` in ` +
            `\`${BANNED_CLAIM_EXEMPT_REGION.file}\` was COUNTED once and LOCATED zero times — the count ` +
            `predicate and the shared locator disagree about which lines are the region's heading. ` +
            `\`-1\` is the authority's legal answer for "no such unfenced line", never an index, so the ` +
            `gate is refusing rather than exempting from line 0. Do NOT repair this by defaulting the ` +
            `index to zero: that turns a one-section exemption into a whole-document one, which is the ` +
            `exact failure this guard exists to prevent`);
        return null;
    }
    const endBefore = sectionEndIndex(text, headingAt + 1, 2);
    const body = scanLines.slice(headingAt + 1, endBefore);
    if (body.every((l) => l.trim() === "")) {
        fail(`the exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
            `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` is EMPTY — the heading is present and carries no ` +
            `disclaimer beneath it. An empty exemption region exempts nothing and denies nothing, so it ` +
            `reads as a satisfied requirement while the disclaimer it names is gone`);
        return null;
    }
    return { headingAt, endBefore };
}
/**
 * How many banned-claim occurrences the one named exemption region lifts the prohibition on, today.
 *
 * TWO-SIDED, AND PINNED ON SUPPRESSED OCCURRENCES RATHER THAN ON EXEMPT LINES. A line count moves
 * every time the disclaimer is reflowed, so it would red the gate on a change that lifted nothing —
 * and a pin that reds for no reason is a pin authors learn to move without reading, which is how a
 * pin stops being a pin. The suppressed count is exactly the quantity an exemption is a decision
 * about: it is the number of sentences the rest of the kit is forbidden to write and this one
 * section may.
 *
 * A GROWING number means the exemption now covers claims it did not cover before, whether because
 * the disclaimer gained a line or because the region's END MOVED. Plan 29-18 moved that end later
 * and nothing anywhere noticed; this constant is what makes the next such move an acknowledged edit.
 * A SHRINKING number is equally a change somebody made and is refused just as loudly, because a
 * disclaimer that quietly stopped quoting what it denies is a disclaimer that stopped working.
 *
 * MOVING THIS NUMBER IS HOW YOU ACKNOWLEDGE A CHANGE YOU MADE ON PURPOSE, NEVER HOW YOU CLEAR A
 * FAILURE. Read the region first and say in the commit which claim entered or left it.
 */
export const BANNED_CLAIM_EXEMPT_SUPPRESSED = 10;
/**
 * How far the one named exemption region REACHES, in lines — `endBefore - headingAt`.
 *
 * ---------------------------------------------------------------------------------------------
 * (Plan 29-32, variant C1 / T-29-23-05) A SECOND NUMBER, BESIDE THE ONE ABOVE, ANSWERING A
 * DIFFERENT QUESTION. THE TWO ARE NEVER FOLDED TOGETHER.
 *
 *   * `BANNED_CLAIM_EXEMPT_SUPPRESSED` asks HOW MANY banned claims sit inside the region.
 *   * this constant asks HOW FAR the region reaches.
 *
 * FOLDING ONE INTO THE OTHER WOULD RECREATE THE CONFLATION THIS ROUND EXISTS TO UNPICK. Round 2
 * dismissed variant C1 — an unterminated fence opened inside the region, with a real `## ` section
 * appended after it, so the fence-aware bound walks straight past that heading and the appended
 * section joins the exemption — as "nothing new", on the grounds that the reach pin above reds the
 * moment the swallowed text carries a banned claim. That is true and it is not the property. THE
 * REACH PIN MEASURES OCCURRENCES, AND A CARDINALITY IS BLIND TO MEMBERSHIP BY CONSTRUCTION: a
 * section swallowed into a safety exemption while carrying NO banned claim moves nothing the reach
 * pin can see, and the prohibition is then switched off over bytes nobody reviewed. This constant
 * is the number such a swallow moves.
 *
 * THE ACCEPTED COST, STATED RATHER THAN DISCOVERED. A line count moves when the disclaimer is
 * reflowed, which is exactly the objection recorded above for putting the REACH pin on lines. It is
 * the right objection and it does not transfer: reach is a question a line count answers badly,
 * while extent is a question ONLY a line count answers. So this pin will red on a deliberate edit
 * to the disclaimer, and that is the pin working. MOVING IT IS HOW YOU ACKNOWLEDGE AN EDIT YOU MADE
 * ON PURPOSE, NEVER HOW YOU CLEAR A FAILURE: an extent that has moved means the exemption now
 * covers different bytes than the ones it was measured over, so restore the region's boundary, or
 * re-measure deliberately and say in the commit which lines entered or left it. Do not widen the
 * pin until it stops firing.
 *
 * WHAT THIS PIN STILL CANNOT SEE, NAMED WITH ITS LIVE COUNTS RATHER THAN LEFT IMPLIED:
 *
 *   1. V-29-32-01 — A COUNT-PRESERVING COMPENSATING EDIT paired with a CLOSED fence. A swallow of
 *      K lines matched by a deletion of K neutral lines from the disclaimer holds this number
 *      still, for the same reason 29-30 recorded when a count-preserving rehome kept every
 *      cardinality identical. Reproduced against this plan's own build: the UNCLOSED-fence form of
 *      it is caught at the point of effect by the region-ends-inside-a-fence refusal in `runAll`,
 *      but the CLOSED-fence form — a real `## ` section hidden inside a properly closed fenced
 *      example, with prose after it — is not, and deliberately so. That shape is INDISTINGUISHABLE
 *      from the legitimate case plan 29-18 established on purpose (a `## ` line QUOTED inside a
 *      closed example is documentation and does not end the region), so refusing it would revert a
 *      decision this plan does not own. It is not free either: the deleted K lines must also carry
 *      zero banned-claim occurrences or the reach pin above reds, so the residual is exactly that
 *      intersection — a deliberate two-part edit, never an accident. Live instances: 0, and the
 *      live exemption document carries zero fenced lines inside the region at all. Closing it would
 *      need a CONTENT pin, and this module has already reasoned that a frozen digest over a
 *      document authors legitimately edit is a false-red generator rather than a pin.
 *   2. A SETEXT BOUNDARY (V-29-26-01). The shared authority recognises ATX headings only, so a
 *      `Heading` / `-------` pair does not end the region. Re-measured on the live exemption
 *      document: 0 setext level-two underlines in its body.
 *   3. AN INDENTED BOUNDARY (V-29-26-04). The delimiter class and the heading test are both
 *      column-zero anchored. Re-measured live: 0 indented fence delimiters against 4 column-zero
 *      ones in the exemption document.
 *
 * 2 and 3 are tree-wide floors of the shared authority, answered here exactly as they are answered
 * for every other consumer, and deliberately not repaired in the plan that measures them.
 * ---------------------------------------------------------------------------------------------
 */
export const BANNED_CLAIM_EXEMPT_EXTENT = 62;
/**
 * Every occurrence, not every line. Two banned literals sitting adjacently on one line produce TWO
 * findings, and the same literal twice on one line produces two — the hit count is arithmetic over
 * what was read, never a per-line boolean collapsed into one report.
 */
function occurrences(haystackLower, needleLower) {
    const out = [];
    let i = haystackLower.indexOf(needleLower);
    while (i !== -1) {
        out.push(i);
        i = haystackLower.indexOf(needleLower, i + needleLower.length);
    }
    return out;
}
/**
 * Every banned-claim occurrence on ONE line, in literal declaration order then column order.
 *
 * ONE MATCHER, TWO CALLERS. The scan renders these as findings and the exemption's REACH counts
 * them. Written as two loops they would disagree the first time the conditional arm moved, and the
 * number published for the exemption would then describe a prohibition nobody was applying — the
 * same two-grammar defect this file's locator was just rewired to delete, one level down.
 */
function lineHits(line) {
    const lower = line.toLowerCase();
    const out = [];
    for (const member of BANNED_CLAIM_LITERALS) {
        if (member.requiresOnSameLine !== undefined &&
            !member.requiresOnSameLine.some((v) => lower.includes(v.toLowerCase()))) {
            continue; // the name without a conformance verb is the discipline, not a claim
        }
        for (const at of occurrences(lower, member.literal.toLowerCase())) {
            out.push({ member, at });
        }
    }
    return out;
}
/**
 * How many banned-claim occurrences fall in `lines[from, to)`.
 *
 * EXPORTED so a case can derive the exemption's reach INDEPENDENTLY of the run that publishes it. A
 * pin whose expected value is produced by the same statement as its actual value pins nothing.
 */
export function countBannedClaimOccurrences(lines, from, to) {
    let n = 0;
    for (let i = Math.max(from, 0); i < Math.min(to, lines.length); i++) {
        n += lineHits(lines[i]).length;
    }
    return n;
}
function renderFinding(f) {
    return (`        ${f.file}:${f.line}:${f.column} — banned ${f.group} literal "${f.literal}" — ` +
        `${JSON.stringify(f.text)}\n` +
        `        Remedy: delete the claim. Do NOT add an exemption and do NOT narrow the scan set: ` +
        `there is exactly one named exemption region and BANNED_CLAIM_SCAN_COUNT is two-sided pinned, ` +
        `precisely so neither route to green is available`);
}
function runAll() {
    process.stdout.write("\n[guard_banned_claims] the shipped kit and the public documents carry no conformance, " +
        "token-economy or comprehension claim, outside one named exemption region (LANG-04 / D-29, D-44)\n");
    for (const refusal of DERIVATION_REFUSALS) {
        fail(`banned-claim scan derivation refused: ${refusal}`);
    }
    // VACUITY FLOOR, PER PART, BEFORE THE AGGREGATE PIN. A floor over the concatenated total could be
    // reached by one part while the other emptied out entirely, and the gate would report a verdict
    // over a corpus half of which it never opened.
    for (const part of BANNED_CLAIM_SCAN_PARTS) {
        if (part.members.length === 0) {
            fail(`the "${part.name}" part of the banned-claim scan set derived ZERO members — refusing to ` +
                `report a verdict over a part that contributes nothing, because a vacuous scan set ` +
                `passes every guard. This floor is per-part on purpose: either part could empty out ` +
                `while the total still cleared a floor written over the concatenation`);
        }
    }
    const scan = bannedClaimScan();
    const overlap = bannedClaimScanOverlap();
    // TWO-SIDED PIN, worded so that moving it is visibly not the remedy.
    if (scan.length !== BANNED_CLAIM_SCAN_COUNT) {
        fail(`the banned-claim scan set derived ${scan.length} document(s), expected exactly ` +
            `${BANNED_CLAIM_SCAN_COUNT} (${BANNED_CLAIM_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
            `overlap ${overlap}) — walk both parts' derivations and the BANNED_CLAIM_EXCLUDED_LOCATIONS ` +
            `reasons BEFORE updating BANNED_CLAIM_SCAN_COUNT in scripts/check-banned-claims.ts. A new ` +
            `kit document is supposed to enter this scan by existing; moving the pin is how you ` +
            `acknowledge that it did, not how you make the failure go away`);
    }
    // THE EXEMPTION REGION IS ASSERTED UP FRONT, NOT INSIDE THE SCAN LOOP.
    //
    // Located inside the loop, the assertion could only fire while the exempt FILE was a member of
    // the scan — so deleting the file outright skipped every one of its refusals, and the only thing
    // left naming the loss was the aggregate pin, which says "one document short" and never says
    // which document or that the disclaimer is gone. A vanished exemption file is not an absent
    // exemption; it is the disclaimer that has to exist for the prohibition to be writable at all.
    let exemptRegion = null;
    // ONE READ OF THE EXEMPTION DOCUMENT, AND EVERY QUESTION BELOW IS ASKED OF IT. This plan's whole
    // subject is two expressions assembling one document twice and drifting apart; re-reading the
    // file for the boundary check further down would have been that shape again, at the same address.
    let exemptText = "";
    const exemptAbs = abs(BANNED_CLAIM_EXEMPT_REGION.file);
    if (!existsSync(exemptAbs)) {
        fail(`the document carrying the one named exemption region, ` +
            `\`${BANNED_CLAIM_EXEMPT_REGION.file}\`, does not exist at ${exemptAbs}. That document is ` +
            `the disclaimer this prohibition is only writable because of — ${BANNED_CLAIM_EXEMPT_REGION.reason}. ` +
            `A missing exemption document is refused by name here, because every other document is ` +
            `still scanned and the loss would otherwise read as a clean run`);
    }
    else {
        exemptText = readFileSync(exemptAbs, "utf8");
        exemptRegion = locateExemptRegion(exemptText.split("\n"));
    }
    // The findings, in derived-sorted scan order, then by line, then by literal declaration order.
    const findings = [];
    let visited = 0;
    // The exemption's REACH, accumulated at the point where the suppression actually happens. Derived
    // afterwards by a second traversal it would be a different question asked of the same bytes, and
    // this file has just finished deleting one of those.
    let suppressed = 0;
    for (const file of scan) {
        let text;
        try {
            text = readFileSync(abs(file), "utf8");
        }
        catch (e) {
            // A stack trace is not a verdict. The file is NOT counted as visited, so the shared vacuity
            // rule's denominator floor reports the short scan by name.
            fail(`${file} is a member of the banned-claim scan set and could not be read ` +
                `(${e.message}) — refusing to report a verdict over a document that was never ` +
                `opened. A missing document is not a clean one`);
            continue;
        }
        visited += 1;
        const lines = text.split("\n");
        const region = file === BANNED_CLAIM_EXEMPT_REGION.file ? exemptRegion : null;
        for (let i = 0; i < lines.length; i++) {
            // The matcher runs on EVERY line, including exempt ones. An exempt line that skipped it would
            // be an exemption whose reach nothing could measure, which is a hole with a comment on it.
            const hits = lineHits(lines[i]);
            if (region !== null && i >= region.headingAt && i < region.endBefore) {
                suppressed += hits.length; // inside the one named exemption region
                continue;
            }
            for (const h of hits) {
                findings.push({
                    file,
                    line: i + 1,
                    column: h.at + 1,
                    literal: h.member.literal,
                    group: h.member.group,
                    text: lines[i].trim(),
                });
            }
        }
    }
    // THE EXEMPTION'S REACH IS PINNED TWO-SIDED, MEASURED AT THE POINT OF SUPPRESSION.
    //
    // Guarded on a located region: when the region refused, `suppressed` is zero for a reason that has
    // already been reported by name, and a second refusal saying the exemption shrank would name the
    // wrong cause.
    if (exemptRegion !== null && suppressed !== BANNED_CLAIM_EXEMPT_SUPPRESSED) {
        fail(`the one named exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
            `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` suppressed ${suppressed} banned-claim ` +
            `occurrence(s), and BANNED_CLAIM_EXEMPT_SUPPRESSED in scripts/check-banned-claims.ts ` +
            `declares ${BANNED_CLAIM_EXEMPT_SUPPRESSED}. An exemption GROWING is a decision, recorded ` +
            `here with its reason — never a side effect of a heading landing somewhere new, which is ` +
            `exactly how this region grew once already without anything noticing. An exemption ` +
            `SHRINKING is equally a change somebody made. Read the region, say in the commit which ` +
            `claim entered or left it, and then move the constant; do not move the constant to make ` +
            `this line go away`);
    }
    // ── THE REGION'S BOUNDARY MUST NOT HAVE BEEN DECIDED BY AN UNCLOSED FENCE ────────────────────
    //
    // FOUND BY ATTACKING THIS PLAN'S OWN EXTENT PIN, AND CLOSED RATHER THAN RECORDED. The extent pin
    // below is a NUMBER, and a number is blind to membership by construction — this repository has
    // now paid for that sentence twice. A COUNT-PRESERVING COMPENSATING EDIT defeats it outright:
    // delete seven neutral lines from inside the disclaimer, append a seven-line section behind a
    // fence opened inside the region and never closed, and the region reaches exactly as far as it
    // did, suppresses exactly as many occurrences as it did, and has quietly swallowed a section
    // nobody reviewed. Measured on a hermetic mirror of the live tree, both pins stayed green and the
    // gate exited 0.
    //
    // SO THE SWALLOW IS ALSO CHECKED WHERE IT HAPPENS, NOT ONLY BY ITS SIZE. A region whose LAST LINE
    // is inside a fenced block did not end at a heading; it ended because the document ran out while
    // a fence was still open, and every heading between the open delimiter and end of file was hidden
    // from the bound. That is the swallow, stated structurally, and it is decided from the ONE fence
    // toggle this module already imports — no heading pattern is declared here, no delimiter class is
    // re-declared, no second projection of the document is built, and no delimiter PARITY is counted
    // (plan 29-28 measured what parity cannot see: two errors that cancel).
    //
    // IT DOES NOT REFUSE THE LEGITIMATE CASE, WHICH IS THE HALF THAT MAKES IT USABLE. A `## ` line
    // QUOTED inside a properly closed fenced example is documentation, the region deliberately
    // continues past it (WR-06, plan 29-18), and the lines following that example's close are outside
    // any fence — so the region's last line is unflagged and this check is silent. Re-measured on the
    // live exemption document: zero fenced lines inside the region at all.
    //
    // THE ONE FALSE-RED SHAPE, NAMED: a disclaimer whose region ENDS exactly on a fenced example's
    // closing delimiter, with no line after it before the next heading. The refusal says so, and the
    // remedy is one blank line — an authoring fix, not a reason to weaken the check.
    if (exemptRegion !== null) {
        const exemptFlags = fencedLineFlags(exemptText);
        if (exemptFlags[exemptRegion.endBefore - 1] === true) {
            fail(`the one named exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
                `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` ENDS INSIDE A FENCED BLOCK — its last line ` +
                `(line ${exemptRegion.endBefore}) is flagged by the shared fence toggle. A region that ` +
                `ends inside a fence did not end at a heading: it ended because the document ran out ` +
                `while a fence was still open, so every heading between that open delimiter and end of ` +
                `file was invisible to the bound and every section after it has been SWALLOWED into a ` +
                `safety exemption. Close the fence. This is checked separately from the extent pin below ` +
                `because a swallow paired with a compensating deletion moves no number at all. If the ` +
                `region legitimately ends on a fenced example's closing delimiter, put one blank line ` +
                `after it; do not delete this check`);
        }
    }
    // THE EXEMPTION'S EXTENT IS PINNED TWO-SIDED, BESIDE THE REACH AND NEVER FOLDED INTO IT.
    //
    // The reach above asks HOW MANY banned claims the region lifts the prohibition on. This asks HOW
    // FAR the region reaches. They are different questions and a swallow moves only the second: an
    // unterminated fence opened inside the region makes the fence-aware bound walk straight past the
    // heading that should have ended it, and an appended section carrying NO banned claim joins the
    // exemption without moving a single occurrence count. Round 2 dismissed that variant on the
    // grounds that the reach pin covers it. It does not, and it cannot: a cardinality is blind to
    // membership by construction.
    //
    // Guarded on a located region for the same reason the reach pin is — when the region refused, a
    // second refusal about its size would name the wrong cause.
    const exemptExtent = exemptRegion === null ? 0 : exemptRegion.endBefore - exemptRegion.headingAt;
    if (exemptRegion !== null && exemptExtent !== BANNED_CLAIM_EXEMPT_EXTENT) {
        fail(`the one named exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
            `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` reaches ${exemptExtent} line(s), and ` +
            `BANNED_CLAIM_EXEMPT_EXTENT in scripts/check-banned-claims.ts declares ` +
            `${BANNED_CLAIM_EXEMPT_EXTENT}. An extent that has moved means the exemption now ` +
            `covers different bytes than the ones it was measured over — which is what a section ` +
            `SWALLOWED into the region looks like when it carries no banned claim of its own, and ` +
            `therefore moves no occurrence count. The fix is to restore the region's boundary (look ` +
            `first for a fence opened inside the region and never closed, which walks the bound past ` +
            `the heading that should have ended it), or to re-measure deliberately and say in the ` +
            `commit which lines entered or left the region. Do NOT widen the pin until it stops firing`);
    }
    // The shared element-level vacuity rule (AP-1). This gate declares no zero check of its own; the
    // measurement is a required argument, so a PASS line cannot be printed over a loop that never ran.
    FAILS += reportMeasured({
        label: "banned claims",
        visited,
        expected: scan.length,
        findings,
    }, { pass, fail }, renderFinding);
    if (FAILS === 0) {
        // A PASS line must never state a check that was not performed: every number below is read from
        // the run that just happened, and the exemption is reported inline with its reason so a reader
        // meets it here rather than inferring it from a file's silence.
        pass(`LANG-04: ${scan.length} document(s) carry zero banned claim literal outside the one named ` +
            `exemption region — ${BANNED_CLAIM_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
            `overlap ${overlap}; ${BANNED_CLAIM_LITERALS.length} pinned literal(s) across ` +
            `${new Set(BANNED_CLAIM_LITERALS.map((l) => l.group)).size} group(s), of which ` +
            `${BANNED_CLAIM_LITERALS.filter((l) => l.requiresOnSameLine !== undefined).length} is ` +
            `conditional on a conformance verb from ${CONFORMANCE_VERB_MARKERS.length} pinned marker(s); ` +
            `1 exemption region (${BANNED_CLAIM_EXEMPT_REGION.file} § ${BANNED_CLAIM_EXEMPT_REGION.heading} ` +
            `— ${BANNED_CLAIM_EXEMPT_REGION.reason}), which suppresses ${suppressed} banned-claim ` +
            `occurrence(s), pinned at ${BANNED_CLAIM_EXEMPT_SUPPRESSED}, and reaches ` +
            `${exemptExtent} line(s), pinned at ${BANNED_CLAIM_EXEMPT_EXTENT} (two numbers, two ` +
            `questions: how much prohibition the region lifts, and how far it reaches — a section ` +
            `swallowed into it moves only the second); ` +
            `${BANNED_CLAIM_EXCLUDED.length} candidate ` +
            `literal(s) refused at admission and recorded with their hit counts`);
    }
    process.stdout.write("\n== Result ==\n");
    if (FAILS === 0) {
        process.stdout.write("ALL CHECKS PASSED\n");
        process.exit(0);
    }
    else {
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
const isEntry = process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
    runAll();
}
