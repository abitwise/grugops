// check-diff-disposition.ts — the LANG-03 frozen-set / per-change disposition gate (D-01..D-05).
//
//   node scripts/check-diff-disposition.js
//     exit 0 — every clause this phase changed in the watched corpus is either dispositioned, or the
//              tree carries no change to that corpus at all.
//     exit 1 — at least one changed clause is undispositioned, or intersects the frozen set without
//              its same-commit companion edit, or the gate could not derive one of its inputs.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs, node:path, node:child_process for `git`. Zero npm
// dependencies. Clear professional voice throughout (CLAUDE.md hard rule — this is a trace surface).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS GATE EXISTS, AND WHY IT IS SHAPED BACKWARDS FROM THE OBVIOUS DESIGN.
//
// docs/audit/28-safety-surface-exclusions.md lists 41 files and states that no text in a listed file
// is reworded by a style pass. Those 41 files are the whole corpus LANG-02 tells the writing profile
// to govern. Read literally, Phase 29 may reword nothing. Phase 28 named that limit rather than
// manufacturing variance around it: the flag is per FILE, and the question LANG-02 faces is which
// SENTENCES are load-bearing, a granularity a per-file column cannot express.
//
// The obvious design is a file of protected sentences. It is refused outright (D-01). A
// hand-authored set is this repository's diagnosed systemic failure class — the scan set that rots
// while every gate over it stays green — and putting one at the centre of a safety exclusion is the
// worst available place for it.
//
// So the frozen set is DERIVED from three gates that already exist, and the enforcement is INVERTED
// (D-05): rather than enumerate what is protected, this gate enumerates what CHANGED and requires
// each change to be dispositioned. One side is derived from the filesystem, the other from git.
// Neither can go stale, because neither is written down.
//
// ---------------------------------------------------------------------------------------------
// THE D-24 RED EVIDENCE, AND THE ONE THING A READER WILL GET WRONG ABOUT IT.
//
// This gate exits 0 against the tree at the end of plan 29-04. That green does NOT mean it has
// never been watched fail. It means the watched corpus has no change since the recorded base — the
// clean-tree arm below, which is a different verdict from a vacuous pass and says so in its own PASS
// line.
//
// The RED evidence necessarily comes from a PLANTED REPOSITORY rather than from today's tree,
// because the predicate reads a diff and today's diff is empty. Both reproductions are PERMANENT
// CASES in scripts/check-diff-disposition.test.ts, not a historical commit, so they are re-run on
// every suite run rather than quoted from a transcript nobody can reproduce.
//
// Measured 2026-08-13 against the COMMITTED .js, on real git repositories under the OS temp dir:
//
//   REPRODUCTION 1 — a role `## Hard limits` sentence reworded, with no companion edit:
//
//     1 watched file(s) changed since 6c1bc70; 2 changed clause(s) derived; 1 disposition row(s)
//       FAIL  diff disposition: 2 finding(s) over 2 elements
//       agent-factory/roles/agents-md-scribe.md:11 (added) — FROZEN by structuralSections
//       clause: "keep diff small for one ticket and never move architecture without adr"
//       region: `## Hard limits`, lines 10-12
//       agent-factory/roles/agents-md-scribe.md:11 (removed) — FROZEN by structuralSections
//       clause: "make small diff for one ticket and never change architecture without adr"
//     exit code 1
//
//   REPRODUCTION 2 — a non-frozen clause added with no disposition row:
//
//     1 watched file(s) changed since bba98e5; 1 changed clause(s) derived; 1 disposition row(s)
//       FAIL  diff disposition: 1 finding(s) over 1 elements
//       agent-factory/workflows/00-bootstrap-greenfield.md:14 (added) — no disposition row
//       clause: "every reviewer reads acceptance scenario before diff"
//     exit code 1
//
// REPRODUCTION 1 IS ALSO THE PROOF THAT BOTH SIDES OF THE DIFF ARE READ. The reworded sentence is
// reported TWICE — once added, once removed — and the removed one is the frozen clause. Reading only
// the added side would have reported a clause that matches nothing frozen, and the reword would have
// needed no more than an ordinary row. See changedClauses() for the argument in full.
//
// ---------------------------------------------------------------------------------------------
// D-03's REJECTED ALTERNATIVE, RECORDED WITH ITS REASON SO IT IS NOT RE-PROPOSED AS AN OPTIMISATION.
//
// The alternative considered and rejected was a PERMISSION-BEARING-SENTENCE HEURISTIC: freeze any
// sentence containing `never`, `must not`, `stop`, `refuse`, `do not`. It is decidable, it is
// list-free, and it needs none of the derivation below.
//
// It is also a HEURISTIC DETECTOR THAT IS A STRICT SUBSET OF THE REAL PREDICATE, which is the exact
// shape that cost this project three separate eight-round closures. A prohibition phrased positively
// ("the smallest diff that closes it is the one the reviewer can verify") carries the permission and
// contains none of the tokens; a `## Responsibilities` bullet that legitimately says "stop and hand
// back" contains one and carries none. The route back to green from either direction is tuning the
// token list, which is the eleventh-widening move this milestone exists to stop making.
//
// The structural-section derivation below is NOT that heuristic re-proposed. It asks WHERE a
// sentence sits — inside a section located by its own heading — and never what words it contains.
//
// ---------------------------------------------------------------------------------------------
// RECORDED RESIDUAL, NOT CLAIMED AWAY (`UNKNOWN - verify`).
//
//   THIS GATE PROVES that every clause changed in the watched corpus was either dispositioned or
//   refused, and that no frozen intersection was admitted without its companion edit.
//   IT DOES NOT PROVE THAT ANY DISPOSITION IS CORRECT.
//
// Whether a reworded `## Hard limits` sentence still withholds the same permission is a human
// judgement. No gate reaches it and no additional check would: the question is what the sentence
// means to an agent reading it, and structure is checkable where meaning is not. The manual
// verification for LANG-03 is a named human reading the disposition rows against the diff they
// describe. docs/audit/29-style-dispositions/README.md states the same residual from the other side
// rather than letting a green run imply otherwise.
//
// ---------------------------------------------------------------------------------------------
// A MEASURED CORRECTION TO D-01 SOURCE (c), RECORDED RATHER THAN MANUFACTURED (`UNKNOWN - verify`).
//
// D-01 names three positive guard literals: the tier-announcement wording, the shared-context memory
// sentence, and the `UNKNOWN - verify` token. Measured against the tree at HEAD, the third is not a
// positive guard literal: NO gate in scripts/, install/ or hooks/ requires `UNKNOWN - verify` to be
// PRESENT anywhere. scripts/audit-prepass.ts LISTS its occurrences as an adjudication aid and
// asserts nothing about them, and audit-model.ts quotes it inside a rubric question. It would also
// normalize to two words, below voice-model.ts's CLAUSE_MIN_WORDS, so it could never be a frozen
// CLAUSE even if a gate did require it.
//
// Manufacturing a requirement to make the decision's arithmetic come out was the available move and
// is refused. Source (c) is therefore the nine literals two live guards genuinely require present,
// and this paragraph is the record of the third item's absence.
// ---------------------------------------------------------------------------------------------
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
// The ONE sentence-identity pair (Phase 29 / plan 29-01, D-38). IMPORTED, never re-implemented: the
// diff gate and guard_role_clause_uniqueness must not be able to disagree about what one clause is.
// NFC normalization happens inside normalizeSentence, first, so two spellings of one clause are one
// clause here for exactly the reason they are one clause there.
import { normalizeSentence, segmentClauses, CLAUSE_MIN_WORDS, } from "./voice-model.js";
// The ONE element-level vacuity rule (Phase 29 / plan 29-01, AP-1). Folded, never restated.
import { reportMeasured } from "./vacuity.js";
// The derivation authority for D-01 source (b). listRoles/listWorkflows THROW on an empty or missing
// directory rather than returning [], so the vacuity refusal is inherited rather than restated.
import { listRoles, listWorkflows, ROLE_COUNT, WORKFLOW_COUNT, ROLES_SUBPATH, WORKFLOWS_SUBPATH, } from "./kit-model.js";
// D-01 source (a). The registry rows carry the verbatim anchor text, and check-claim-anchors.ts
// already performs the byte-identical comparison against the documents live and green — so this gate
// CONSUMES that freeze rather than re-deriving it. A second parser over the registry is how one
// authority becomes two.
// REGISTER_PATH is taken from the ONE place it is declared rather than retyped: the CR-01 refusal
// below names the file an author must walk, and a second spelling of that path is the set-literal
// drift class in miniature — the refusal would keep naming a file that had moved.
import { readRegistry, REGISTER_PATH, REGISTRY_PATH, } from "./audit-model.js";
// The ONE place the out-of-set protocol file's path is declared (D-02). The union's markdown residue
// carries it because its register row is flagged `safety_surface: yes` while `listRoles()` drops
// underscore-prefixed entries by derivation — so it is a residue member with a REGISTER reason, and
// it is pinned against this literal rather than retyped here.
import { PROTOCOL_FILE } from "./audit-prepass.js";
// The watched corpus is the LANG-03 exclusion list itself, taken from the one derivation that
// produces it (register rows flagged `safety_surface: yes` ∪ registry rows of `kind: safety`). The
// generated document is the RENDERING of this union; reading the rendering back would be a second
// parser over a file this function already answers for.
import { safetySurfaceUnion } from "./generate-safety-surface.js";
// The ONE fence toggle and the ONE section locator (Phase 29 / plans 29-01 and 29-20, D-24).
// IMPORTED and consumed, never reimplemented: this gate must not be able to disagree with
// check-imperative-lexicon.ts about which lines are documentation rather than governed prose, nor
// with voice-model.ts about where a section ENDS. The delimiter class itself is deliberately NOT
// imported — the toggle is the only interface, so nothing here can drift from it one recogniser at
// a time.
//
// (Plan 29-22, WR-03 / LANG-07) THE SET GREW FROM ONE SYMBOL TO THREE, AND THE GROWTH IS THE FIX.
// This module used to declare TWO private section predicates: `locateSection`'s own `trimEnd()`
// heading equality with its own `startsWith("## ")` close loop, and `readDispositionRows`'s bare
// `indexOf` search with no close at all. Both are DELETED. What this module contributes now is the
// QUESTION — which heading, in which document — and never the grammar.
import { fencedLineFlags, sectionEndIndex, unfencedHeadingIndex, } from "./frontmatter.js";
// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror — here a real git
// repository under the OS temp dir — and points CHECK_ROOT at it, then spawns this committed .js
// against the mirror. When unset, resolve against the script-relative repo root (cwd does not
// matter). The truthiness ternary, not `??`: an empty CHECK_ROOT degrades to the repo root here as
// it does at every sibling gate, rather than resolving every path against the process CWD.
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
export const diffDispositionFails = () => FAILS;
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The one git wrapper.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * EVERY `git` invocation in this module, so a failure is a NAMED refusal rather than a stack trace.
 *
 * The contract is copied from scripts/check-nul-bytes.ts, which is the only other non-test script in
 * this tree that shells out to git, and it is copied in its own words: a stack trace is not a
 * verdict, and a gate that dies is not a gate that failed. This helper throws with the command and
 * the root in the message; runAll() catches it and reports through fail().
 *
 * It matters more here than there. The diff is the ENTIRE left-hand side of this gate's predicate,
 * so a git invocation that dies silently — an unreachable base commit, a shallow clone, a run
 * outside a working tree — would empty the changed set and every rewrite in the phase would be
 * admitted under a clean green.
 *
 * `encoding: "buffer"` then an explicit toString("utf8"), and a 64 MB maxBuffer, both from the same
 * precedent.
 */
function git(args) {
    try {
        return execFileSync("git", [...args], {
            cwd: ROOT,
            encoding: "buffer",
            maxBuffer: 64 * 1024 * 1024,
        }).toString("utf8");
    }
    catch (e) {
        throw new Error(`\`git ${args.join(" ")}\` failed at ${ROOT} — ${e.message}. The diff cannot be ` +
            `derived, so NO verdict is reported over it. Confirm this is being run inside a git working ` +
            `tree whose history reaches the base commit recorded in ${BASE_FILE} (on CI that means ` +
            `\`fetch-depth: 0\` on the checkout step).`);
    }
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The disposition directory and the recorded base commit.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/** Membership is WALKED from this directory, never listed. A new file enters the set by existing. */
export const DISPOSITION_DIR = "docs/audit/29-style-dispositions";
/** The recorded base commit. Read from here, NEVER inferred from the branch — see the file itself. */
export const BASE_FILE = `${DISPOSITION_DIR}/00-base.md`;
/** Directory members that are not disposition files. Named, never skipped silently. */
const DISPOSITION_NON_ROWS = ["00-base.md", "README.md"];
/** The canonical form of a recorded base commit: a full 40-character SHA, nothing else. */
const BASE_COMMIT_RE = /^base_commit:[ \t]*([0-9a-f]{40})[ \t]*$/m;
// ─────────────────────────────────────────────────────────────────────────────────────────────
// D-01 source (c) — the positive guard literals, EXTRACTED from the guard that requires each one.
// ─────────────────────────────────────────────────────────────────────────────────────────────
const FOUNDATION_GUARDS_SOURCE = "scripts/check-foundation-guards.ts";
/**
 * The claim registry, spelled ONCE.
 *
 * It used to be typed at the comparison and again in the contract string. Two spellings of one path
 * is the set-literal drift class in miniature: rename the file and one of them keeps comparing
 * against a path that no longer exists, which reads as "the companion never changed" — or, on the
 * arm this constant serves, as "the companion always changed". Declared here, consumed in both
 * places, so a rename is one edit.
 */
export const REGISTRY_COMPANION = "docs/audit/28-claim-registry.md";
/**
 * Where each positive guard literal is DECLARED, and which guard requires it present.
 *
 * The literals are not retyped here. Each site names the source file and the declaration, and the
 * extractor below reads the string out of that declaration — so a guard whose wording moves takes
 * this gate's copy of it with it, and a guard whose declaration is renamed or deleted produces a
 * NAMED refusal rather than a silently smaller frozen set.
 *
 * scripts/check-foundation-guards.ts runs its twelve guards at module load and calls process.exit,
 * so it cannot be imported for these constants the way check-claim-anchors.ts is imported for the
 * registry. Reading the declaration out of the source is the extraction that costs no restructure of
 * a 2,900-line aggregator; the refusals below are what keep it from degrading into a copy.
 */
export const POSITIVE_GUARD_LITERAL_SITES = [
    {
        guard: "guard_adapter_body",
        source: FOUNDATION_GUARDS_SOURCE,
        declaration: "MEMORY_FORM_SPECIALIST",
        kind: "const",
    },
    {
        guard: "guard_adapter_body",
        source: FOUNDATION_GUARDS_SOURCE,
        declaration: "MEMORY_FORM_COORDINATOR",
        kind: "const",
    },
    {
        guard: "guard_adapter_body",
        source: FOUNDATION_GUARDS_SOURCE,
        declaration: "MEMORY_FORM_SKILL",
        kind: "const",
    },
    {
        guard: "guard_wr05",
        source: FOUNDATION_GUARDS_SOURCE,
        declaration: "TIER_BEATS",
        kind: "needles",
    },
];
/**
 * Two-sided cardinality pin over the EXTRACTED literals (3 memory forms + 6 tier-announcement
 * beats). A short extraction shrinks the frozen set and every downstream verdict with it, and a
 * grown one is wording nobody reviewed. Walk POSITIVE_GUARD_LITERAL_SITES and the declarations it
 * names BEFORE moving this number: moving it is how a change is acknowledged, never how a failure is
 * cleared.
 */
export const POSITIVE_GUARD_LITERAL_COUNT = 9;
/**
 * Read the double-quoted string literal that begins at `from` after WHITESPACE ONLY, and return its
 * VALUE. Anything else between `from` and the next quote means this position does not carry a
 * literal, and null is returned so the caller decides what that means.
 *
 * A canonical form with a refusal outside it, not a TypeScript parser. The whitespace-only rule is
 * not a detail — it is what tells a FIELD from a TYPE POSITION. `TIER_BEATS` is declared
 * `readonly { label: string; needle: string; why?: string }[]`, so a search for `needle:` finds the
 * type annotation first, and a scan that skipped forward to "the next quote anywhere" read the
 * neighbouring `label` value out of the first array element. That was measured on the first run —
 * ten literals where nine were expected, with `"Full tier label"` among them — and it is the reason
 * the two-sided count pin exists rather than a floor.
 *
 * `split`-free and quantifier-free: one forward pass with nothing to backtrack over.
 */
function quotedLiteralAt(src, from) {
    let open = from;
    while (open < src.length && /\s/.test(src[open]))
        open += 1;
    if (src[open] !== '"')
        return null;
    let i = open + 1;
    while (i < src.length) {
        const c = src[i];
        if (c === "\\") {
            i += 2;
            continue;
        }
        if (c === '"') {
            try {
                return JSON.parse(src.slice(open, i + 1));
            }
            catch {
                return null;
            }
        }
        if (c === "\n")
            return null; // a literal never spans a raw newline in these declarations
        i += 1;
    }
    return null;
}
/** Extract every positive guard literal from the guard sources that require them. */
export function derivePositiveGuardLiterals(root = ROOT) {
    const literals = [];
    const refusals = [];
    for (const site of POSITIVE_GUARD_LITERAL_SITES) {
        const path = join(root, site.source);
        if (!existsSync(path)) {
            refusals.push(`${site.source} does not exist at ${path}, so the positive guard literal declared as ` +
                `\`${site.declaration}\` (required present by ${site.guard}) could not be read. A frozen ` +
                `source that cannot be read is not an empty one`);
            continue;
        }
        const src = readFileSync(path, "utf8");
        const at = src.indexOf(`const ${site.declaration}`);
        if (at === -1) {
            refusals.push(`${site.source} declares no \`const ${site.declaration}\`. ${site.guard} requires that ` +
                `wording PRESENT in the kit, and this gate freezes it — a renamed or deleted declaration ` +
                `silently removes it from the frozen set, so it is refused by name instead`);
            continue;
        }
        if (site.kind === "const") {
            const assign = `const ${site.declaration} =`;
            const eq = src.indexOf(assign);
            const value = eq === -1 ? null : quotedLiteralAt(src, eq + assign.length);
            if (value === null || value === "") {
                refusals.push(`${site.source}: \`const ${site.declaration}\` carries no readable double-quoted string ` +
                    `literal. The canonical form is \`const ${site.declaration} =\` followed by whitespace ` +
                    `and one double-quoted literal; anything else is refused rather than guessed at`);
                continue;
            }
            literals.push({ literal: value, guard: site.guard, source: site.source });
            continue;
        }
        // kind === "needles": every `needle:` FIELD inside the declaration's array literal. An
        // occurrence in TYPE POSITION (`needle: string;` in the declaration's own type annotation)
        // carries no literal and contributes nothing; the two-sided POSITIVE_GUARD_LITERAL_COUNT pin
        // below is what keeps that distinction honest rather than convenient.
        const end = src.indexOf("\n];", at);
        if (end === -1) {
            refusals.push(`${site.source}: \`const ${site.declaration}\` has no \`\\n];\` terminator, so its extent ` +
                `could not be bounded. The extraction is refused rather than run over the rest of the file`);
            continue;
        }
        const span = src.slice(at, end);
        let cursor = 0;
        let found = 0;
        for (;;) {
            const key = span.indexOf("needle:", cursor);
            if (key === -1)
                break;
            const value = quotedLiteralAt(span, key + "needle:".length);
            // null here means this occurrence is NOT a field carrying a literal — the type annotation is
            // the one that occurs in this declaration today. It contributes nothing and is not a refusal;
            // the two-sided POSITIVE_GUARD_LITERAL_COUNT pin is what reports a needle that stopped being
            // readable, because the extracted total falls and the pin fails naming both numbers.
            if (value !== null && value !== "") {
                literals.push({ literal: value, guard: site.guard, source: site.source });
                found += 1;
            }
            cursor = key + "needle:".length;
        }
        if (found === 0) {
            refusals.push(`${site.source}: \`const ${site.declaration}\` yielded ZERO \`needle:\` literals. A ` +
                `derivation that returns nothing shrinks the frozen set without any visible failure`);
        }
    }
    return { literals, refusals };
}
const POSITIVE_GUARD_LITERAL_DERIVATION = derivePositiveGuardLiterals();
/**
 * The positive guard literals, exported so the tests can plant against them without a second copy.
 * Derived at module load from the guard sources — a literal typed here would be the copy the whole
 * extraction exists to avoid.
 */
export const POSITIVE_GUARD_LITERALS = POSITIVE_GUARD_LITERAL_DERIVATION.literals.map((l) => l.literal);
// ─────────────────────────────────────────────────────────────────────────────────────────────
// D-01 source (b) — the structural sections, located by heading.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * The three structural sections D-01 freezes, each located by its own heading and each asserted at
 * FULL cardinality against the derived corpus count.
 *
 * The assertion is the point. A derivation that silently returns short shrinks what is protected,
 * and every downstream verdict with it, while presenting as a clean run — so a short derivation
 * FAILS naming the source and BOTH counts.
 */
export const FROZEN_SECTION_ANCHORS = [
    {
        corpus: "roles",
        heading: "## Hard limits",
        subpath: ROLES_SUBPATH,
        expected: ROLE_COUNT,
    },
    {
        corpus: "workflows",
        heading: "## Stop conditions",
        subpath: WORKFLOWS_SUBPATH,
        expected: WORKFLOW_COUNT,
    },
    {
        corpus: "workflows",
        heading: "## Commit",
        subpath: WORKFLOWS_SUBPATH,
        expected: WORKFLOW_COUNT,
    },
];
/**
 * Locate one heading's section in `text`: from the heading line to the line before the next UNFENCED
 * heading of level at most two, or to end of file. 1-based inclusive, so `to` is the last line IN
 * the section.
 *
 * ---------------------------------------------------------------------------------------------
 * WR-06 / WR-08 — THIS FUNCTION ASKS THE QUESTION. IT DOES NOT OWN THE GRAMMAR.
 *
 * WHAT IT USED TO OWN, AND WHY BOTH HALVES ARE DELETED RATHER THAN CORRECTED IN PLACE.
 *
 * (1) It scanned for `## ` with no idea what a fence was, which made it a SECOND GRAMMAR over bytes
 *     `fencedLineFlags` already answers for. Kit documents quote markdown inside fenced examples, so
 *     a `## ` line inside a fence ended the region early: every clause below the quoted heading fell
 *     OUT of `## Hard limits`, `## Stop conditions` or `## Commit` while still sitting inside it,
 *     and a reword there owed no companion edit at all. A quoted line spelling one of the three
 *     anchors was worse — it was matched as the section's own heading, and the located region then
 *     began inside a code example. Plan 29-16 made this function fence-aware, which fixed the bytes
 *     and left a private predicate standing beside the shared one.
 *
 * (2) It closed on `## ` ALONE, so a `# ` heading did not end a section and the region ran on into
 *     the next top-level part of the document. That is a THIRD answer to "where does this section
 *     end" — the round-2 review tabulated four modules giving four different ones — and a predicate
 *     with four authorities has none.
 *
 * (Plan 29-22) BOTH ARE NOW ONE IMPORT. The heading comes from `unfencedHeadingIndex` and the close
 * from `sectionEndIndex(…, 2)`; this file declares no heading equality, no close scan and no fence
 * state of its own, and there is NO parameter restoring the old behaviour — an opt-out is a second
 * grammar with extra steps. `scripts/check-diff-disposition.test.ts` DERIVES the set of
 * section-extent constructs left in this module and asserts it is empty, so the claim is measured
 * rather than believed.
 *
 * THE LEVEL WIDENING IS A BEHAVIOUR CHANGE, AND IT IS SAFE ONLY BECAUSE THE AUTHORITY IS FENCE-AWARE.
 * Closing on `# ` as well as `## ` makes a frozen region END EARLIER, which SHRINKS what is
 * protected — the fail-open direction. On this corpus it moves nothing: measured over the live
 * watched corpus the old level-two-only close and the new level-at-most-two close agree on all 55
 * located regions, because the only level-one heading lines below a `## ` section are the nine
 * FENCED example lines in `agent-factory/README.md`. If those nine were unfenced, this widening
 * would silently truncate `agent-factory/README.md`'s sections. Both facts are ASSERTED by cases,
 * not left here as prose, and the widening must never be separated from the fence awareness.
 *
 * WHY THIS DIRECTION IS FIXED RATHER THAN RECORDED, WHILE ITS SIBLING IS NOT INTERCHANGEABLE WITH IT.
 * A truncated frozen region here SHRINKS what is protected, and it does so with NO failure anywhere:
 * the gate stays green and simply checks less. That is FAIL-OPEN, and a fail-open defect is invisible
 * by construction. The equivalent truncation in the banned-claim exemption locator causes MORE text
 * to be checked, which is fail-closed and surfaces as a red somebody investigates. Naming the
 * asymmetry is what stops a later reader treating the two as the same bug at two addresses.
 * ---------------------------------------------------------------------------------------------
 */
export function locateSection(text, heading) {
    const at = unfencedHeadingIndex(text, heading);
    if (at === -1)
        return null;
    return { from: at + 1, to: sectionEndIndex(text, at + 1, 2) };
}
/**
 * The three D-01 sources, each with the companion edit a change to it owes. Object.keys() over this
 * is the source count; nothing else declares it.
 */
export const FROZEN_SOURCES = {
    registryAnchors: {
        what: "a claim-registry verbatim anchor, byte-compared live by scripts/check-claim-anchors.js",
        companion: `${REGISTRY_COMPANION} must change in the SAME commit as the clause — the commit that ` +
            `actually changed it, not merely somewhere in the range — or, for an uncommitted edit, in ` +
            `the same working-tree change set (Phase 28 / D-25)`,
    },
    structuralSections: {
        what: "a structural section located by heading — role `## Hard limits`, workflow `## Stop conditions`, workflow `## Commit`",
        companion: `a disposition row under ${DISPOSITION_DIR}/ whose \`companion\` cell names the section and the reason`,
    },
    positiveGuardLiterals: {
        what: "wording a guard requires to be PRESENT — the tier-announcement beats and the shared-context memory sentences",
        companion: `the guard's own source must change in the SAME commit as the clause — the commit that ` +
            `actually changed it, not merely somewhere in the range — or, for an uncommitted edit, in ` +
            `the same working-tree change set, so the guard and the kit move together`,
    },
};
/**
 * Build the frozen set from D-01's three sources, each asserted two-sided.
 *
 * Source (a) is CONSUMED from the claim registry rather than re-parsed: check-claim-anchors.ts
 * already performs the byte-identical comparison against the documents, live and green, so its
 * freeze arrives here for free. Every row contributes its verbatim text, and the anchor count is
 * asserted equal to the registry's own row count in both directions.
 *
 * Source (b) is located by heading through kit-model's listers, and each of the three derivations is
 * asserted at full cardinality against ROLE_COUNT or WORKFLOW_COUNT.
 *
 * Source (c) is extracted from the guards that require each literal present.
 *
 * Every frozen text is passed through the SAME segmentClauses() the changed side uses, so the two
 * sides of the comparison are the same kind of object. A literal shorter than CLAUSE_MIN_WORDS
 * contributes no clause, which is reported rather than hidden.
 */
export function deriveFrozenSet(root = ROOT) {
    const text = new Map();
    const regions = [];
    const cardinalities = [];
    const refusals = [];
    const add = (s, source) => {
        for (const { clause } of segmentClauses(s)) {
            if (!text.has(clause))
                text.set(clause, source);
        }
    };
    // ── Source (a): the claim-registry verbatim anchors ──────────────────────────────────────────
    let claims = [];
    try {
        claims = readRegistry(root).claims;
    }
    catch (e) {
        refusals.push(`the claim registry could not be parsed, so D-01 source (a) contributes NOTHING and no ` +
            `verdict is reported over it — ${e.message}`);
    }
    let anchorTexts = 0;
    for (const claim of claims) {
        if (claim.verbatim === "") {
            refusals.push(`${claim.id} carries an empty \`verbatim\`, so it freezes nothing. An anchor with no text ` +
                `is a row check-claim-anchors compares against nothing`);
            continue;
        }
        anchorTexts += 1;
        add(claim.verbatim, "registryAnchors");
    }
    cardinalities.push({
        label: "registry verbatim anchors",
        derived: anchorTexts,
        expected: claims.length,
    });
    // ── Source (b): the structural sections, located by heading ──────────────────────────────────
    for (const anchor of FROZEN_SECTION_ANCHORS) {
        let files;
        try {
            files =
                anchor.corpus === "roles" ? listRoles(root) : listWorkflows(root);
        }
        catch (e) {
            refusals.push(`the ${anchor.corpus} corpus could not be derived, so \`${anchor.heading}\` freezes ` +
                `NOTHING — ${e.message}`);
            cardinalities.push({
                label: `${anchor.corpus} \`${anchor.heading}\``,
                derived: 0,
                expected: anchor.expected,
            });
            continue;
        }
        let located = 0;
        for (const base of files) {
            const rel = `${anchor.subpath}/${base}`;
            const path = join(root, rel);
            if (!existsSync(path)) {
                refusals.push(`${rel}: required by the ${anchor.corpus} derivation but missing at ${path} — a file ` +
                    `that is not there cannot be scanned for \`${anchor.heading}\``);
                continue;
            }
            const body = readFileSync(path, "utf8");
            const span = locateSection(body, anchor.heading);
            if (span === null)
                continue;
            located += 1;
            regions.push({
                file: rel,
                heading: anchor.heading,
                from: span.from,
                to: span.to,
            });
            add(body.split("\n").slice(span.from - 1, span.to).join("\n"), "structuralSections");
        }
        cardinalities.push({
            label: `${anchor.corpus} \`${anchor.heading}\``,
            derived: located,
            expected: anchor.expected,
        });
    }
    // ── Source (c): the positive guard literals ──────────────────────────────────────────────────
    const positive = root === ROOT
        ? POSITIVE_GUARD_LITERAL_DERIVATION
        : derivePositiveGuardLiterals(root);
    refusals.push(...positive.refusals);
    for (const l of positive.literals)
        add(l.literal, "positiveGuardLiterals");
    return { text, regions, cardinalities, refusals };
}
/**
 * Parse `git diff --unified=0` hunk headers into touched line numbers.
 *
 * Only the `@@` headers are read; the body lines are not parsed at all, so a body line that happens
 * to begin with `@@` cannot be mistaken for a header. With `--unified=0` every hunk's ranges are
 * exactly the changed lines, which is why the context width is pinned rather than left to config.
 */
export function touchedLines(diff) {
    const removed = [];
    const added = [];
    for (const line of diff.split("\n")) {
        if (!line.startsWith("@@ "))
            continue;
        const close = line.indexOf(" @@", 3);
        if (close === -1)
            continue;
        const ranges = line.slice(3, close).split(" ");
        for (const range of ranges) {
            const sign = range[0];
            if (sign !== "-" && sign !== "+")
                continue;
            const [startText, countText] = range.slice(1).split(",");
            const start = Number.parseInt(startText, 10);
            const count = countText === undefined ? 1 : Number.parseInt(countText, 10);
            if (!Number.isInteger(start) || !Number.isInteger(count))
                continue;
            const into = sign === "-" ? removed : added;
            for (let i = 0; i < count; i++)
                into.push(start + i);
        }
    }
    return { removed, added };
}
/**
 * Every clause the diff changed in the watched corpus, from BOTH sides.
 *
 * BOTH SIDES, AND THE REASON IS A FAIL-OPEN THIS GATE WOULD OTHERWISE HAVE. A style pass that
 * REWORDS a frozen sentence leaves an added clause whose text is — by construction — no longer the
 * frozen text. Reading only the added side, the reword would intersect nothing and would need no
 * more than an ordinary disposition row. The clause that WAS frozen appears only on the removed
 * side, read out of the base blob, which is where the intersection is actually visible.
 *
 * The added side is read from the working tree and the removed side from `git show base:path`, and
 * both are segmented by the imported segmentClauses(), so a clause is the same object on both sides.
 */
export function changedClauses(base, files) {
    return changedClausesIn({
        from: base,
        to: null,
        diffArgs: ["diff", "--unified=0", "--no-color", "--no-ext-diff", base],
    }, files);
}
/**
 * The generalized derivation. `changedClauses` is the range case of it, and the carrier attribution
 * below is the per-commit case, so BOTH sides of the comparison stay the same kind of object —
 * segmented by the same segmentClauses(), keyed on the same normalized text.
 */
function changedClausesIn(span, files) {
    const clauses = [];
    const changedFiles = [];
    /** The frozen sections of `file`, located in `text`. Empty for a file in neither corpus. */
    const sectionsIn = (file, text) => {
        const out = [];
        for (const anchor of FROZEN_SECTION_ANCHORS) {
            if (!file.startsWith(`${anchor.subpath}/`))
                continue;
            const span2 = locateSection(text, anchor.heading);
            if (span2 === null)
                continue;
            out.push({ file, heading: anchor.heading, from: span2.from, to: span2.to });
        }
        return out;
    };
    const regionOf = (regions, line) => regions.find((r) => line >= r.from && line <= r.to) ?? null;
    for (const file of files) {
        const diff = git([...span.diffArgs, "--", file]);
        if (diff.trim() === "")
            continue;
        changedFiles.push(file);
        const touched = touchedLines(diff);
        if (touched.added.length > 0) {
            // The added side comes from `to`: the working tree when `to` is null, otherwise that tree's
            // own blob. A carrier's added clause read off the working tree would be whatever LATER
            // carriers left behind, not what this one wrote.
            let text = null;
            if (span.to === null) {
                if (existsSync(abs(file)))
                    text = readFileSync(abs(file), "utf8");
            }
            else {
                text = git(["show", `${span.to}:${file}`]);
            }
            if (text !== null) {
                const wanted = new Set(touched.added);
                const regions = sectionsIn(file, text);
                for (const c of segmentClauses(text)) {
                    if (wanted.has(c.line)) {
                        clauses.push({
                            file,
                            line: c.line,
                            clause: c.clause,
                            side: "added",
                            region: regionOf(regions, c.line),
                        });
                    }
                }
            }
        }
        if (touched.removed.length > 0 && span.from !== null) {
            const wanted = new Set(touched.removed);
            const text = git(["show", `${span.from}:${file}`]);
            const regions = sectionsIn(file, text);
            for (const c of segmentClauses(text)) {
                if (wanted.has(c.line)) {
                    clauses.push({
                        file,
                        line: c.line,
                        clause: c.clause,
                        side: "removed",
                        region: regionOf(regions, c.line),
                    });
                }
            }
        }
    }
    return { clauses, changedFiles };
}
/**
 * The NAMED sentinel for the uncommitted working-tree change set.
 *
 * An uncommitted edit is exactly where "which commit carries this clause" has no answer — and a
 * question with no answer must not therefore mean "any answer will do". So the working tree is a
 * carrier like any other: it is named in the output, its touched-file set is derived the same way,
 * and a frozen clause changed only there owes its companion edit in that same change set.
 *
 * The angle brackets keep it outside the canonical 40-character SHA form, so it can never be
 * confused with a commit or be interpolated into a revision position as one.
 */
export const WORKING_TREE_CARRIER = "<working tree>";
/** A carrier rendered for output: seven characters of a SHA, or the sentinel's own name. */
const shortCarrier = (c) => c === WORKING_TREE_CARRIER ? c : c.slice(0, 7);
/**
 * Every carrier between the recorded base and the working tree, OLDEST FIRST.
 *
 * The list is NOT capped. A cap would silently narrow the check — the same act as narrowing the
 * watched corpus — and the cost is bounded below instead, by deriving clauses only for the
 * carriers that touched a watched file.
 */
export function listCarriers(base) {
    const commits = git(["rev-list", "--reverse", `${base}..HEAD`])
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    const dirty = git(["status", "--porcelain"]).trim().length > 0;
    return dirty ? [...commits, WORKING_TREE_CARRIER] : commits;
}
/** The tree pair and diff argv for one carrier. */
function carrierSpan(carrier) {
    if (carrier === WORKING_TREE_CARRIER) {
        return {
            from: "HEAD",
            to: null,
            diffArgs: ["diff", "--unified=0", "--no-color", "--no-ext-diff", "HEAD"],
        };
    }
    // `--root` is what makes this correct on a root commit, where `<sha>^` does not resolve at all.
    // A root commit reaching this loop means the recorded base does not reach it — the rebased or
    // grafted history shape — and the gate must derive a diff there rather than throw.
    const hasParent = git(["rev-list", "--parents", "-n", "1", carrier]).trim().split(" ").length > 1;
    return {
        from: hasParent ? `${carrier}^` : null,
        to: carrier,
        diffArgs: [
            "diff-tree",
            "-p",
            "--unified=0",
            "--no-color",
            "--no-commit-id",
            "-r",
            "--root",
            carrier,
        ],
    };
}
/**
 * The repo-relative paths one carrier touched.
 *
 * A MERGE COMMIT REPORTS NOTHING HERE, and that is the safe direction rather than an oversight.
 * `diff-tree -r` without `-m`/`-c` emits no output for a merge, so a merge carrier touches no
 * watched file, is never examined, and attributes no clause. A change that entered the range ONLY
 * through a merge — a conflict resolution present in neither parent, or a commit reachable through
 * a second parent that the recorded base does not reach — is therefore attributable to no carrier
 * and is REFUSED by name below, never admitted. This repository's history is linear
 * (`git.branching_strategy: none`), so the case does not arise today; if it ever does, the gate
 * reds and says why rather than passing.
 */
export function carrierFilesTouched(carrier) {
    if (carrier === WORKING_TREE_CARRIER) {
        // Modified AND untracked: an untracked file inside the watched corpus is a change the working
        // tree carries, and reading only `git diff` would leave it attributable to nobody.
        const modified = git(["diff", "--name-only", "-z", "HEAD"]).split("\0");
        const untracked = git([
            "ls-files",
            "--others",
            "--exclude-standard",
            "-z",
        ]).split("\0");
        return [...new Set([...modified, ...untracked])].filter((p) => p.length > 0);
    }
    return git([
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "-r",
        "-z",
        "--root",
        carrier,
    ])
        .split("\0")
        .filter((p) => p.length > 0);
}
/**
 * The attribution key: the file and the NORMALIZED clause text, DELIBERATELY not the line number.
 *
 * A clause's line differs between the range diff and a single carrier's diff by exactly the number
 * of lines edited above it, so a line-keyed map would fail to attribute correct history — the same
 * clause would look like two different objects and every multi-commit range would read as
 * unattributable. The frozen set is already keyed on normalized clause text, so this keeps ONE
 * notion of clause identity across the whole gate.
 */
export const attributionKey = (file, clause) => `${file}\n${clause}`;
/** Which carriers changed each clause in the watched corpus. */
export function attributeClauses(base, watched) {
    const watchedSet = new Set(watched);
    const carriers = listCarriers(base);
    const byClause = new Map();
    const touched = new Map();
    const examined = [];
    for (const carrier of carriers) {
        const files = carrierFilesTouched(carrier);
        touched.set(carrier, new Set(files));
        // Bound the WORK, never the correctness: the touched-file set is read once and intersected
        // with the watched corpus FIRST, so the expensive clause derivation runs only for the carriers
        // that touched something this gate watches.
        const inCorpus = files.filter((f) => watchedSet.has(f));
        if (inCorpus.length === 0)
            continue;
        examined.push(carrier);
        for (const c of changedClausesIn(carrierSpan(carrier), inCorpus).clauses) {
            const key = attributionKey(c.file, c.clause);
            const list = byClause.get(key);
            if (list === undefined)
                byClause.set(key, [carrier]);
            else if (!list.includes(carrier))
                list.push(carrier);
        }
    }
    return { byClause, carriers, examined, touched };
}
/**
 * The per-clause, per-carrier companion predicate, shared by BOTH non-structural arms.
 *
 * Satisfied only when at least one carrier that changed THIS clause also touched one of the
 * companion paths for its source. A clause with no carrier at all returns false — `some` over an
 * empty list — which is the fail-closed direction stated as code rather than as a comment.
 */
export function companionSatisfied(file, clause, companions, attribution) {
    const carriers = attribution.byClause.get(attributionKey(file, clause)) ?? [];
    const satisfied = carriers.some((carrier) => {
        const t = attribution.touched.get(carrier);
        return t !== undefined && companions.some((c) => t.has(c));
    });
    return { satisfied, carriers };
}
const DISPOSITION_HEADING = "## Dispositions";
const DISPOSITION_COLUMNS = 7;
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WR-05 — THE CANONICAL FILLED FORM OF A COMPANION CELL, AND WHY THERE IS NO LIST OF BAD SPELLINGS.
//
// THE DEFECT THIS REPLACES. The structural arm's satisfaction test was
// `r.companion !== "" && r.companion !== UNFILLED` — a membership decision made by EXCLUDING ONE BAD
// VALUE. A cell carrying a hyphen, a double hyphen, an en dash, a question mark, `n/a`, `TBD`,
// `none` or `todo` is neither empty nor that one em dash, so it satisfied the companion requirement
// for a change inside a frozen `## Hard limits`, `## Stop conditions` or `## Commit` section. That
// arm carries the WHOLE positional freeze — the one that catches a REWORD, where the new text
// matches nothing frozen and only its POSITION does not move — so a placeholder there admitted
// exactly the change this gate exists to refuse. Measured: eleven of thirteen placeholder spellings
// exited 0 against the committed build at plan 29-15.
//
// THE FIX IS NOT A LONGER LIST OF REJECTED GLYPHS, AND THAT IS THE WHOLE POINT.
//
// This repository has closed three separate defects at eight to twelve rounds each by widening a
// parser or a sentinel set one more time, and each of them ended the same way: a canonical FORM
// declared, with everything outside it refused (Phase 27 / D-64, and D-43's polarity — declare the
// LEGAL spelling, refuse the complement, consult no character class). A denylist of placeholder
// tokens is the enumerate-the-bad shape those closures were spent deleting, and the thirteenth
// placeholder is the one nobody thinks of. So NO rejected spelling appears anywhere below. The
// spellings live in scripts/check-diff-disposition.test.ts, where they are WITNESSES that the
// complement is refused rather than the list the predicate consults.
//
// THE FORM. A companion cell's job is stated by the contract in FROZEN_SOURCES: it names the
// SECTION and the REASON. That is two things, and a cell too short to say two things is not a
// companion edit whatever glyph it contains. The floor is therefore TWO CLAUSES' worth of words at
// this repository's own clause floor — `2 * CLAUSE_MIN_WORDS` — DERIVED from voice-model rather
// than typed, so if the tree's notion of "a unit of prose" ever moves, this moves with it.
//
// The measurement that makes the floor safe to adopt, taken before the edit and re-derived after:
// across the 1532 rows of the live disposition register the smallest companion cell that is not a
// placeholder is 12 normalized words, and the smallest one standing on any of the 230 live
// structural intersections is 20. Every placeholder spelling normalizes to at most ONE word. The
// floor sits strictly between those two bands, so the placeholder class is refused BY CONSTRUCTION
// and not one existing human judgement is disturbed.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * The canonical filled form's length floor, in normalized words.
 *
 * DERIVED, never typed: a companion cell names the section AND the reason, which is two clauses, and
 * CLAUSE_MIN_WORDS is what this tree already calls one clause's worth of prose.
 */
export const COMPANION_MIN_WORDS = 2 * CLAUSE_MIN_WORDS;
/**
 * Whether a companion cell is FILLED — the entire companion predicate for the structural arm.
 *
 * Measured through normalizeSentence, which is already this gate's one notion of what a word is on
 * both sides of every other comparison it makes. A second tokenizer here would be a second grammar
 * over the same bytes, in the file whose founding rule is that a predicate has one authority.
 */
export function isCompanionFilled(cell) {
    const words = normalizeSentence(cell).split(" ").filter(Boolean);
    return words.length >= COMPANION_MIN_WORDS;
}
/** Split a markdown table line into trimmed cells, dropping the empty edges the pipes create. */
function tableCells(line) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length > 0 && cells[0] === "")
        cells.shift();
    if (cells.length > 0 && cells[cells.length - 1] === "")
        cells.pop();
    return cells;
}
const isSeparatorCell = (c) => c.length > 0 && c.split("").every((ch) => ch === "-" || ch === ":");
/**
 * Every disposition row in the directory, membership WALKED rather than listed.
 *
 * One file per plan, so plans running in the same wave never contend on a single register. The two
 * non-row members are named in DISPOSITION_NON_ROWS rather than skipped by a silent `continue`.
 *
 * ---------------------------------------------------------------------------------------------
 * WR-03 — THIS LOCATOR FAILS **OPEN**, WHICH IS WHY IT IS BOUNDED AND FENCE-AWARE.
 *
 * SAY THE DIRECTION FIRST, BECAUSE IT IS THE OPPOSITE OF ITS SIBLING'S. A ROW IS WHAT SATISFIES THE
 * STRUCTURAL COMPANION ARM, and that arm carries the whole positional freeze — the one that catches
 * a REWORD, where the new text matches nothing frozen and only its POSITION does not move. So a
 * SPURIOUS row ADMITS a change that owed a companion edit: more rows means less protection. That is
 * the reverse of `locateSection`, where the failure mode is a region that gets too SHORT, and the
 * reverse again of the banned-claim exemption locator, whose truncation is fail-CLOSED. Three
 * locators of one class, three directions; a reader who assumes they share one is going to fix the
 * wrong end of whichever one they meet next.
 *
 * WHAT THIS FUNCTION USED TO DO, AND WHY IT WAS THE FOURTH LOCATOR NOBODY DERIVED. It found its
 * section with `body.indexOf(DISPOSITION_HEADING)` — a bare substring search that matches the
 * literal ANYWHERE, including inside prose and inside a fenced example — and then admitted every
 * seven-cell pipe line from that offset TO END OF FILE. Both halves fail open at once: a fenced
 * example row became a real row, and a stray seven-column table under a later heading became rows
 * too. Round 1 of this gap closure fixed three section locators the review had written down and
 * never touched this one, because a hand-listed set of defect addresses rots exactly like any other
 * hand-listed set. The site list is now DERIVED from this module's source by a case, not
 * transcribed.
 *
 * WHAT IT DOES NOW. The heading is located through `unfencedHeadingIndex`, so the match is a whole
 * unfenced line rather than a substring; the scan is bounded by `sectionEndIndex(…, 2)`, so the
 * table lives in ITS OWN section; and any line the fence toggle flags is skipped, so a quoted
 * example donates nothing. No predicate of any of the three is declared here.
 * ---------------------------------------------------------------------------------------------
 */
export function readDispositionRows(root = ROOT) {
    const rows = [];
    const files = [];
    const refusals = [];
    const dir = join(root, DISPOSITION_DIR);
    if (!existsSync(dir)) {
        refusals.push(`${DISPOSITION_DIR}/ does not exist at ${dir}. A missing disposition directory is not an ` +
            `empty one: every changed clause would report as undispositioned for a reason that has ` +
            `nothing to do with the prose`);
        return { rows, files, refusals };
    }
    for (const name of readdirSync(dir).sort()) {
        if (!name.endsWith(".md"))
            continue;
        if (DISPOSITION_NON_ROWS.includes(name))
            continue;
        files.push(`${DISPOSITION_DIR}/${name}`);
        const body = readFileSync(join(dir, name), "utf8");
        const at = unfencedHeadingIndex(body, DISPOSITION_HEADING);
        if (at === -1) {
            refusals.push(`${DISPOSITION_DIR}/${name} carries no \`${DISPOSITION_HEADING}\` heading, so none of its ` +
                `rows are read. A disposition file whose rows are invisible is worse than an absent one: ` +
                `it reads as work done`);
            continue;
        }
        const bodyLines = body.split("\n");
        const fenced = fencedLineFlags(body);
        const end = sectionEndIndex(body, at + 1, 2);
        let seen = 0;
        // IN-01. A pipe-leading line under the heading that does not split to exactly the column count
        // is COUNTED and NAMED below rather than dropped by a silent `continue`. The drop itself is
        // still correct — a row the parser cannot read must not become a row — but the SILENCE was not:
        // the clause the line covered then reports as undispositioned, and the author is sent to write
        // a disposition row they have already written.
        const malformed = [];
        for (let i = at + 1; i < end; i++) {
            // A table inside a fenced example is documentation, not this file's disposition table.
            if (fenced[i])
                continue;
            const line = bodyLines[i];
            if (!line.startsWith("|"))
                continue;
            const cells = tableCells(line);
            if (cells.length !== DISPOSITION_COLUMNS) {
                malformed.push(`${DISPOSITION_DIR}/${name}:${i + 1} splits to ${cells.length} cell(s) — ${line.trim()}`);
                continue;
            }
            if (cells[0] === "file")
                continue; // the header row
            if (cells.every(isSeparatorCell))
                continue; // the separator row
            seen += 1;
            rows.push({
                source: `${DISPOSITION_DIR}/${name}`,
                file: cells[0],
                line: cells[1],
                before: cells[2],
                after: cells[3],
                rule: cells[4],
                disposition: cells[5],
                companion: cells[6],
            });
        }
        if (malformed.length > 0) {
            refusals.push(`${malformed.length} line(s) under \`${DISPOSITION_HEADING}\` in ` +
                `${DISPOSITION_DIR}/${name} begin with a pipe and do NOT split to ` +
                `${DISPOSITION_COLUMNS} cells, so they are not read as rows — ` +
                `${malformed.join("; ")}. The most likely cause is a code span carrying ` +
                `a pipe in the \`before\` or \`after\` cell: an inline \`a | b\` splits the row an extra ` +
                `time. Escape it as \`\\|\` or reword the cell. This is reported by NAME because the ` +
                `alternative is silence: the clause the line covers then reads as undispositioned and ` +
                `names the wrong cause`);
        }
        if (seen === 0) {
            refusals.push(`${DISPOSITION_DIR}/${name} has a \`${DISPOSITION_HEADING}\` heading and ZERO rows under ` +
                `it. The table takes ${DISPOSITION_COLUMNS} columns — file, line, before, after, rule, ` +
                `disposition, companion — and a row with any other count is not read`);
        }
    }
    return { rows, files, refusals };
}
/** A row matches a changed clause when it names the file and either side normalizes to the clause. */
function rowMatches(row, c) {
    if (row.file !== c.file)
        return false;
    return (normalizeSentence(row.before) === c.clause ||
        normalizeSentence(row.after) === c.clause);
}
/** file path, then line number — so two runs over the same diff produce byte-identical stdout. */
function byPosition(a, b) {
    if (a.file !== b.file)
        return a.file < b.file ? -1 : 1;
    if (a.line !== b.line)
        return a.line - b.line;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The run.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * The MINIMUM size of the watched corpus, and the expected cardinality of the derived kit it is
 * measured against (round-2 CR-01).
 *
 * WHY THE EXPECTATION IS IMPORTED RATHER THAN COMPUTED HERE. `watchedCorpus()` reads
 * `safetySurfaceUnion`, which reads `docs/audit/28-disposition-register.md`. A floor computed from
 * that same path would move whenever the thing it checks moves — documentation of intent rather
 * than a check. `ROLE_COUNT + WORKFLOW_COUNT` comes from `kit-model.ts`, a module `watchedCorpus()`
 * never calls, so the narrowing edit cannot also move the number it is checked against.
 *
 * WHY IT IS A MINIMUM AND NOT AN EQUALITY. The union legitimately carries public-document entries
 * beyond the derived kit — 40 watched markdown files against 36 derived kit files on the live tree.
 * The equality lives at the SOURCE, in check-audit-register.ts's equality three; this end holds the
 * floor, and the two are reported by two gates so neither number absorbs the other's drift.
 */
export const WATCHED_CORPUS_MIN = ROLE_COUNT + WORKFLOW_COUNT;
/**
 * How many markdown members the REGISTRY arm contributes to the watched corpus beyond the derived
 * kit (round-3 WR-06). Measured on the live tree: `AGENTS.md`, `README.md`, `agent-factory/README.md`.
 *
 * WHY THE RESIDUE NEEDED AN ASSERTION AT ALL. This gate PRINTED how many markdown entries remained
 * beyond the derived kit and called them public documents. Nothing checked that they were, and any
 * number of them could be added or removed in either direction silently — which is precisely what
 * round 3 reproduced: one `kind:` cell moved from `safety` to `architecture`, `README.md` left the
 * union and this corpus, and the round-2 containment pin stayed silent because `README.md` was never
 * a derived kit file. Containment cannot miss what it never covered.
 *
 * WHY IT IS A COUNT AND NOT A LIST OF PATHS. Which files are safety-claim homes is decided by the
 * registry's editorial `kind` column, and this repository derives that from nothing — the same fact
 * check-audit-register's CLAIM_KIND_CARDINALITY records. A hand-written list of protected paths here
 * would be the maintained set-literal D-01 refuses outright: it would answer the question layer one
 * at the source already answers by derivation, and it would rot the first time a public document was
 * renamed. A cardinality answers only the question no derivation can — HOW MANY.
 *
 * WHY IT IS LEGITIMATE (D-25 / D-04). It is a MEASUREMENT baseline, not a discovery set, and it
 * fails CLOSED: a safety claim added, deleted or reclassified reds this gate until the number is
 * updated in the SAME commit as the registry change that moved it.
 *
 * WHAT IT CANNOT DO, STATED HONESTLY RATHER THAN IMPLIED AWAY. When the arm goes short this gate can
 * name the members that SURVIVED and the shortfall; it cannot name the file that left, because after
 * the flip nothing in this repository still says that file was a safety-claim home. The file is
 * named at the SOURCE, by check-audit-register's equality four, which reports the KIND that moved.
 * The refusal below points there rather than pretending to more than it measured.
 */
export const RESIDUE_FROM_REGISTRY_COUNT = 3;
/** The watched corpus: the LANG-03 exclusion list, markdown members only. */
function watchedCorpus(root) {
    const entries = safetySurfaceUnion(root);
    const nonMarkdown = entries
        .map((e) => e.file)
        .filter((f) => !f.endsWith(".md"));
    return {
        watched: entries
            .map((e) => e.file)
            .filter((f) => f.endsWith(".md"))
            .sort(),
        total: entries.length,
        nonMarkdown,
    };
}
function main() {
    process.stdout.write("\n[guard_diff_disposition] every clause changed in the LANG-03 watched corpus is dispositioned, " +
        "and a frozen intersection carries its same-commit companion edit (LANG-03, D-01..D-05)\n");
    // ── The frozen set, and its four two-sided derivations ───────────────────────────────────────
    const frozen = deriveFrozenSet(ROOT);
    for (const r of frozen.refusals)
        fail(r);
    let derivationShort = false;
    for (const card of frozen.cardinalities) {
        if (card.derived === card.expected)
            continue;
        derivationShort = true;
        fail(`D-01 derivation ${card.label} resolved ${card.derived} of ${card.expected} — a derivation ` +
            `that returns short SHRINKS the frozen set and every verdict below it, silently. Walk the ` +
            `derivation before treating either number as the one to move; the remedy is never to lower ` +
            `the expectation`);
    }
    if (POSITIVE_GUARD_LITERALS.length !== POSITIVE_GUARD_LITERAL_COUNT) {
        derivationShort = true;
        fail(`D-01 source (c) extracted ${POSITIVE_GUARD_LITERALS.length} positive guard literal(s), ` +
            `expected exactly ${POSITIVE_GUARD_LITERAL_COUNT} ` +
            `(${POSITIVE_GUARD_LITERAL_SITES.map((s) => `${s.declaration} via ${s.guard}`).join(", ")}) ` +
            `— walk every site's declaration BEFORE updating POSITIVE_GUARD_LITERAL_COUNT`);
    }
    // ── The watched corpus ───────────────────────────────────────────────────────────────────────
    let corpus;
    try {
        corpus = watchedCorpus(ROOT);
    }
    catch (e) {
        fail(`the LANG-03 safety-surface union could not be derived, so there is no watched corpus and NO ` +
            `verdict is reported over one — ${e.message}`);
        verdict();
        return;
    }
    if (corpus.watched.length === 0) {
        fail(`the watched corpus derived ZERO markdown files from the safety-surface union ` +
            `(${corpus.total} entr(ies) total). A vacuous corpus makes every diff empty and every ` +
            `verdict clean`);
        verdict();
        return;
    }
    // ── THE WATCHED CORPUS IS PINNED TO THE DERIVED KIT (round-2 CR-01) ──────────────────────────
    //
    // THE ZERO CHECK ABOVE STAYS, AND THIS IS ADDED BESIDE IT RATHER THAN IN PLACE OF IT. A vacuity
    // floor catches an EMPTY denominator and has never been able to catch a SILENTLY SHORT one, and
    // conflating those two questions is precisely how this defect survived: every other set this gate
    // depends on is pinned two-sided and says so in its own words — the four `cardinalities`, the
    // `POSITIVE_GUARD_LITERAL_COUNT` extraction, the changed-file/clause-file equality — while the
    // corpus, this gate's ENTIRE left-hand side, had a zero check and nothing else.
    //
    // THE PIN IS SET CONTAINMENT, NOT A BARE COUNT, AND THAT IS A DELIBERATE STRENGTHENING OF THE
    // REVIEW'S OWN SKETCH. `corpus.watched.length < WATCHED_CORPUS_MIN` cannot catch the attack the
    // review reproduced: the live corpus is 40 markdown files against a 36-file kit, so a bare floor
    // leaves FOUR files of slack and the reproduction narrows by ONE. A floor whose slack exceeds the
    // attack is a number that looks like a check. Containment has no slack — every derived kit file
    // is named, and a single flipped cell is a named refusal here as well as at the source.
    //
    // The count pin below it is not redundant with the containment: it guards the EXPECTATION's own
    // derivation. If the listers return 35 files, containment over 35 still holds while the corpus is
    // silently measured against a smaller kit — which is this project's recorded set-literal drift
    // class one level up. Derive the set, then assert the count.
    let derivedKit;
    try {
        derivedKit = [
            ...listRoles(ROOT).map((f) => `${ROLES_SUBPATH}/${f}`),
            ...listWorkflows(ROOT).map((f) => `${WORKFLOWS_SUBPATH}/${f}`),
        ].sort();
    }
    catch (e) {
        fail(`the derived kit could not be listed, so the watched corpus has nothing to be pinned ` +
            `against and NO verdict is reported over it — ${e.message}`);
        verdict();
        return;
    }
    if (derivedKit.length !== WATCHED_CORPUS_MIN) {
        fail(`the derived kit resolved ${derivedKit.length} file(s), expected exactly ` +
            `${WATCHED_CORPUS_MIN} (${ROLE_COUNT} roles + ${WORKFLOW_COUNT} workflows). This set is ` +
            `the EXPECTATION the watched corpus is measured against, so a short derivation shrinks the ` +
            `expectation and the measurement together and every verdict below stays green. Walk the ` +
            `listers and kit-model's cardinalities before treating either number as the one to move; ` +
            `the remedy is never to lower the expectation`);
        verdict();
        return;
    }
    // ── BOTH ARMS ARE REPORTED IN ONE RUN, SO NEITHER RETURNS BEFORE THE OTHER SPEAKS ────────────
    //
    // This block used to `verdict(); return;` the moment containment failed. That is the shape
    // T-29-30-05 names: a gate that reports only the FIRST arm it meets passes every single-arm case
    // and still leaves the second arm's drift invisible in exactly the arrangement a real narrowing
    // edit takes — one cell of each arm moving in one commit. Every corpus-level finding below is
    // collected first and the single return happens after them all.
    let corpusRefused = false;
    const unwatched = derivedKit.filter((f) => !corpus.watched.includes(f));
    if (unwatched.length > 0) {
        corpusRefused = true;
        fail(`${unwatched.length} of the ${WATCHED_CORPUS_MIN} derived kit file(s) are NOT in the watched ` +
            `corpus — ${unwatched.join(", ")}. The corpus derived ${corpus.watched.length} markdown ` +
            `file(s) from the ${corpus.total}-entry safety-surface union, and the derived kit alone is ` +
            `${WATCHED_CORPUS_MIN} (${ROLE_COUNT} roles + ${WORKFLOW_COUNT} workflows), so this gate is ` +
            `about to report a verdict over LESS than the kit it exists to watch. A \`safety_surface\` ` +
            `flag flipped to \`no\` in ${REGISTER_PATH} removes a file from this gate ` +
            `ENTIRELY and owes no disposition row, because that register is not itself watched. Walk ` +
            `its \`safety_surface\` column before moving any number here; lowering the expectation or ` +
            `narrowing the corpus are the two ways to clear this finding by deleting its evidence, and ` +
            `neither is the remedy`);
    }
    // ── THE UNION'S MARKDOWN RESIDUE IS ASSERTED, NOT DESCRIBED (round-3 WR-06) ───────────────────
    //
    // The register arm is pinned at the source (equality three) and by containment here; the registry
    // arm is pinned at the source (equality four). This ties the two together AT THE CONSUMER, where
    // the union is actually spent — because a union checked one arm at a time is what round 2 shipped,
    // and both of its pins landed on the same arm.
    //
    // WHY THE EQUALITY IS LEGITIMATE HERE WHILE WATCHED_CORPUS_MIN DELIBERATELY STAYED A MINIMUM. The
    // minimum exists because the union carries members BEYOND the derived kit, and it was one-
    // directional precisely because nothing said what those members were. This assertion is what they
    // now are: the one-directional floor and this partition together cover the WHOLE set rather than
    // its kit-shaped part.
    //
    // The registry arm is derived from the PARSER, never by string-sniffing safetySurfaceUnion's
    // rendered reason text — a rendered sentence is a presentation detail and a check that parses one
    // is a second grammar over a third artifact.
    const residue = corpus.watched.filter((f) => !derivedKit.includes(f));
    let registryArm = null;
    try {
        registryArm = [
            ...new Set(readRegistry(ROOT)
                .claims.filter((c) => c.kind === "safety")
                .map((c) => c.file)),
        ].sort();
    }
    catch (e) {
        corpusRefused = true;
        fail(`${REGISTRY_PATH} could not be parsed, so the REGISTRY arm of the safety-surface union could ` +
            `not be derived and NO verdict is reported over the union's residue — ${e.message}`);
    }
    if (registryArm !== null) {
        // THE ARM'S OWN VACUITY, at the granularity round 3's flip actually operates at. The zero check
        // above catches an EMPTY UNION; an arm can go empty while the union stays large, and every
        // equality written over an empty arm holds vacuously. The wording is
        // generate-safety-surface.ts's own, reused rather than a third one invented.
        if (registryArm.length === 0) {
            corpusRefused = true;
            fail(`the registry arm is EMPTY — ${REGISTRY_PATH} carries ZERO \`kind: safety\` claim(s), so ` +
                `the union's registry arm contributes nothing and every equality written over it holds ` +
                `vacuously. A vacuous set passes every guard computed over it, and a residue with no ` +
                `registry arm silently drops the public documents that host safety claims out of this ` +
                `gate's left-hand side`);
        }
        const registryResidue = registryArm
            .filter((f) => f.endsWith(".md"))
            .filter((f) => !derivedKit.includes(f));
        const unaccounted = residue.filter((f) => !registryResidue.includes(f));
        // DIRECTION ONE — a residue member no source vouches for. The register's only legitimate
        // non-kit contribution is the D-02 protocol file, pinned against the ONE literal that declares
        // it rather than counted, in both directions.
        const unvouched = unaccounted.filter((f) => f !== PROTOCOL_FILE);
        if (unvouched.length > 0) {
            corpusRefused = true;
            fail(`${unvouched.length} of the union's markdown residue is UNVOUCHED — ${unvouched.join(", ")}. ` +
                `A residue member is a watched file that is NOT a derived kit file, and exactly two ` +
                `sources may produce one: a \`kind: safety\` claim in ${REGISTRY_PATH}, or the single ` +
                `uncounted \`safety_surface: yes\` row for ${PROTOCOL_FILE} in ${REGISTER_PATH}. A member ` +
                `from any third source entered this gate's left-hand side with no account of why, which ` +
                `is the sentence this assertion replaced: the gate used to PRINT how many residue entries ` +
                `there were and call them public documents, and nothing checked that they were`);
        }
        if (!residue.includes(PROTOCOL_FILE)) {
            corpusRefused = true;
            fail(`${PROTOCOL_FILE} is ABSENT from the union's markdown residue. Its register row is the one ` +
                `uncounted \`safety_surface: yes\` row (D-02), and \`listRoles()\` drops underscore-` +
                `prefixed entries by derivation — so it is watched by REGISTER reason alone and by nothing ` +
                `else. Losing it removes the role-switch protocol's admission text from this gate without ` +
                `moving the derived kit's count by one`);
        }
        // DIRECTION TWO — the arm went SHORT (or long). This is the direction round 3 reproduced and
        // the one containment structurally cannot see.
        if (registryResidue.length !== RESIDUE_FROM_REGISTRY_COUNT) {
            corpusRefused = true;
            fail(`the registry arm's contribution to the watched corpus is ` +
                `${registryResidue.length} markdown file(s), expected exactly ` +
                `${RESIDUE_FROM_REGISTRY_COUNT}. The member(s) that SURVIVED are ` +
                `[${registryResidue.join(", ")}]; this gate cannot name the one that left, because after ` +
                `a \`kind:\` cell moves nothing in this repository still says that file was a safety-claim ` +
                `home — check-audit-register's equality four names the KIND that moved, at the source. ` +
                `One cell changed from \`safety\` to another kind in ${REGISTRY_PATH} removes a PUBLIC ` +
                `DOCUMENT from this gate entirely, and the round-2 containment pin above cannot see it: ` +
                `the file that left was never a derived kit file. That registry lives under \`docs/\` and ` +
                `is not itself watched, so the edit owes no disposition row anywhere. Lowering ` +
                `RESIDUE_FROM_REGISTRY_COUNT or narrowing the corpus are the two ways to clear this ` +
                `finding by deleting its evidence, and neither is the fix`);
        }
    }
    if (corpusRefused) {
        verdict();
        return;
    }
    // ── The recorded base commit ─────────────────────────────────────────────────────────────────
    if (!existsSync(abs(BASE_FILE))) {
        fail(`${BASE_FILE} does not exist at ${abs(BASE_FILE)}. The base commit is RECORDED, never ` +
            `inferred from the branch: an inferred base differs between CI and a developer machine, so ` +
            `the same tree would produce two diffs and two verdicts`);
        verdict();
        return;
    }
    const baseMatch = BASE_COMMIT_RE.exec(readFileSync(abs(BASE_FILE), "utf8"));
    if (baseMatch === null) {
        fail(`${BASE_FILE} carries no \`base_commit\` in the canonical form — a full 40-character ` +
            `lowercase SHA, alone on its line. Anything outside that form is refused rather than ` +
            `resolved on a guess`);
        verdict();
        return;
    }
    const base = baseMatch[1];
    try {
        git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]);
    }
    catch (e) {
        fail(e.message);
        verdict();
        return;
    }
    // ── The changed side ─────────────────────────────────────────────────────────────────────────
    let changed;
    let attribution;
    try {
        changed = changedClauses(base, corpus.watched);
        attribution = attributeClauses(base, corpus.watched);
    }
    catch (e) {
        fail(e.message);
        verdict();
        return;
    }
    // The floor and its expectation are PUBLISHED on every green run, not only quoted on a red one —
    // this gate reports its measurements rather than asserting them, and a pin nobody can see in a
    // passing transcript is a pin nobody can notice going slack.
    // THE THREE NUMBERS RECONCILE BY HAND, and that is the point of publishing them: the register
    // arm's contribution (the derived kit), the registry arm's, and the one uncounted register row
    // sum to the markdown corpus. The sentence and the assertion behind it are now one statement
    // (D-08, and the AP-1 rule this gate's residue line was a live instance of).
    const registryResidueSize = residue.filter((f) => f !== PROTOCOL_FILE).length;
    const corpusLine = `watched corpus: ${corpus.watched.length} markdown file(s) of the ${corpus.total}-entry ` +
        `LANG-03 safety-surface union, covering all ${derivedKit.length}/${WATCHED_CORPUS_MIN} derived ` +
        `kit file(s) (${ROLE_COUNT} roles + ${WORKFLOW_COUNT} workflows), which is why the kit is a ` +
        `MINIMUM here and an equality at check-audit-register; the union's remaining ` +
        `${residue.length} markdown entr(ies) are its RESIDUE, asserted rather than described — ` +
        `${registryResidueSize} from the registry arm's \`kind: safety\` claims (expected ` +
        `${RESIDUE_FROM_REGISTRY_COUNT}) and 1 uncounted \`safety_surface: yes\` register row ` +
        `(${PROTOCOL_FILE}), so ${derivedKit.length} + ${registryResidueSize} + 1 = ` +
        `${corpus.watched.length}` +
        (corpus.nonMarkdown.length === 0
            ? ""
            : `; ${corpus.nonMarkdown.length} non-markdown entr(ies) named and not watched ` +
                `(${corpus.nonMarkdown.join(", ")} — a clause is a unit of prose, and this gate reports ` +
                `no verdict over a file that carries none)`);
    const cardinalityLine = frozen.cardinalities
        .map((c) => `${c.label} ${c.derived}/${c.expected}`)
        .join(", ");
    process.stdout.write(`        ${corpusLine}\n`);
    process.stdout.write(`        frozen set: ${cardinalityLine}, positive guard literals ` +
        `${POSITIVE_GUARD_LITERALS.length}/${POSITIVE_GUARD_LITERAL_COUNT}; ` +
        `${frozen.text.size} frozen clause(s), ${frozen.regions.length} frozen region(s); ` +
        `base ${base.slice(0, 7)}\n`);
    // The carrier count is PUBLISHED, so a run that examined none is visible in its own output rather
    // than only in the verdict it happened to produce.
    process.stdout.write(`        carriers: ${attribution.carriers.length} change set(s) between ${base.slice(0, 7)} and ` +
        `the working tree, of which ${attribution.examined.length} touched a watched file and had ` +
        `their clauses derived; the uncommitted working tree ` +
        `${attribution.carriers.includes(WORKING_TREE_CARRIER) ? "IS" : "is NOT"} a carrier\n`);
    // ── The clean-tree arm, kept DISTINCT from the vacuity floor ─────────────────────────────────
    //
    // reportMeasured's zero-element floor answers "the loop skipped its elements". A tree with no
    // changed corpus file has no elements to skip, and folding the two together would make a clean
    // tree indistinguishable from a check that did not run — which is the direction AP-1 exists to
    // refuse, taken the wrong way. So the clean tree is an EXPLICIT arm that names what it measured,
    // and the two refusals below are what stop a non-empty diff ever reaching it.
    if (changed.changedFiles.length === 0) {
        if (FAILS === 0 && !derivationShort) {
            pass(`LANG-03: ZERO of the ${corpus.watched.length} watched file(s) differ from the recorded ` +
                `base ${base.slice(0, 7)}, so there is no changed clause to disposition — a clean tree, ` +
                `not a vacuous pass. The frozen set derived at full cardinality: ${cardinalityLine}, ` +
                `positive guard literals ${POSITIVE_GUARD_LITERALS.length}`);
        }
        verdict();
        return;
    }
    // THIS REFUSAL AND THE CLEAN-TREE ARM ABOVE STAY DISTINCT FROM WR-02's DENOMINATOR, AND FROM EACH
    // OTHER. Three different questions, and folding any two of them would lose the answer to one:
    //
    //   clean-tree arm  — nothing changed, so there were no elements to visit.
    //   this refusal    — files changed and the derivation produced NOTHING from any of them, so the
    //                     gate's entire left-hand side is empty and every change below it is admitted.
    //   the set refusal — files changed and the derivation produced something from SOME of them, so
    //     + denominator   the check is narrower than the diff. This is the case the old tautological
    //                     denominator could never see, and it is invisible to both floors above.
    //
    // Collapsing the first two would make a clean tree indistinguishable from a check that did not
    // run. Collapsing either into the third would hide a total derivation failure behind a partial
    // one. So all three are separate, and each says which of the three it is.
    if (changed.clauses.length === 0) {
        fail(`${changed.changedFiles.length} watched file(s) differ from the recorded base ` +
            `(${changed.changedFiles.join(", ")}) and ZERO changed clause(s) were derived from that ` +
            `diff. That is a check that was NOT performed, not a clean tree: the clause derivation is ` +
            `the gate's entire left-hand side, and an empty one admits every change below it`);
        verdict();
        return;
    }
    const disposition = readDispositionRows(ROOT);
    for (const r of disposition.refusals)
        fail(r);
    if (disposition.files.length === 0) {
        fail(`${changed.changedFiles.length} watched file(s) changed and ${DISPOSITION_DIR}/ derives ZERO ` +
            `disposition file(s). Membership is walked, so a plan's file enters the set by existing — ` +
            `write ${DISPOSITION_DIR}/<plan>.md before changing kit prose, never after`);
        verdict();
        return;
    }
    // ── The verdict, in order: frozen intersections first, then undispositioned changes ──────────
    //
    // THERE IS NO OVERRIDE TIER, AND ADDING ONE LATER IS NOT A LOCAL CHANGE. Every change admitted
    // under the strict rule was judged against it; an override introduced afterwards would mean
    // auditing all of them to find which would have taken the hatch. The bytes may change — D-04 is
    // not a byte freeze — but no kit text changes ALONE.
    // THE NON-VACUITY FLOOR ON THE ATTRIBUTION ITSELF, above the loop and not inside it.
    //
    // The attribution map is now the left-hand side of every frozen verdict below. An empty map with
    // a non-empty changed set is the same shape as an unreachable base or a broken derivation: it
    // does not admit everything, it means the question was never asked. Reported here, once, by name
    // — on the same principle as the zero-clause refusal directly above — rather than as N identical
    // per-clause findings that read like N separate problems.
    if (attribution.byClause.size === 0) {
        fail(`${changed.clauses.length} changed clause(s) were derived from the range since ` +
            `${base.slice(0, 7)}, and the carrier attribution map is EMPTY: not one of the ` +
            `${attribution.carriers.length} carrier(s) between the base and the working tree was found ` +
            `to have changed any of them. That is a derivation that did not run, not a range with ` +
            `nothing in it — the attribution is the left-hand side of every frozen verdict below, and ` +
            `an empty one would admit every change under it. This is what a shallow clone, a grafted ` +
            `history or a rebased base looks like from here: confirm the history reaches ` +
            `${base.slice(0, 7)} (on CI, \`fetch-depth: 0\`) rather than re-recording the base`);
        verdict();
        return;
    }
    const findings = [];
    for (const c of changed.clauses) {
        // Positional freeze: the structural sections are frozen by WHERE they are, which is what
        // catches a REWORD. The reworded text is new, so it matches no frozen clause; its position
        // inside `## Hard limits` is what does not move.
        const region = c.region;
        // Textual freeze: EQUALITY of the normalized clause is a hit. A clause that merely shares a
        // prefix with a frozen clause is NOT an intersection and needs only an ordinary row.
        const textSource = frozen.text.get(c.clause);
        const source = region !== null ? "structuralSections" : (textSource ?? null);
        if (source !== null) {
            let satisfied = false;
            let owed = FROZEN_SOURCES[source].companion;
            // The carriers that changed THIS clause. Empty on the structural arm, whose companion is a
            // disposition-row cell rather than a file, and which this plan deliberately does not touch.
            let attributedTo = [];
            if (source === "structuralSections") {
                // IN-02. The per-clause row filter is computed HERE, inside the one branch that reads it,
                // rather than above the branch for every frozen clause on all three arms. The other two
                // arms decide through `companionSatisfied` and never look at a row, so hoisting the filter
                // made the gate walk 1532 rows per clause twice over for an answer nobody consumed.
                const rows = disposition.rows.filter((r) => rowMatches(r, c));
                // WR-05. The satisfaction test is the CANONICAL FILLED FORM and nothing else: no sentinel
                // is excluded and no spelling is enumerated, so a placeholder is refused by construction
                // rather than by having been thought of. See isCompanionFilled for the argument in full.
                satisfied = rows.some((r) => isCompanionFilled(r.companion));
                owed =
                    `${owed} — at least ${COMPANION_MIN_WORDS} normalized words, which is the canonical ` +
                        `filled form. A cell too short to name both the section and the reason is not a ` +
                        `companion edit whatever glyph it carries, and there is no placeholder spelling that ` +
                        `satisfies this`;
            }
            else {
                // Per CARRIER, not per range. The companion set for the registry arm is one declared
                // constant; for the positive-literal arm it is DERIVED from the literal sites rather than
                // restated, so a site that moves to a new source file takes this comparison with it.
                const companions = source === "registryAnchors"
                    ? [REGISTRY_COMPANION]
                    : [...new Set(POSITIVE_GUARD_LITERAL_SITES.map((s) => s.source))];
                if (source === "positiveGuardLiterals") {
                    owed = `${owed} (${companions.join(", ")})`;
                }
                const decided = companionSatisfied(c.file, c.clause, companions, attribution);
                satisfied = decided.satisfied;
                attributedTo = decided.carriers;
            }
            if (!satisfied) {
                // TWO DIFFERENT FAILURES, SAID DIFFERENTLY. "The carrier that changed this clause did not
                // touch the companion" is a missing companion edit and the author fixes it by making one.
                // "No carrier changed this clause" is a missing ATTRIBUTION — the gate cannot say which
                // change set owes anything — and the author fixes it by repairing the history the gate is
                // reading. Collapsing them into one message would send the second author to write a
                // companion edit that cannot help.
                const unattributed = source !== "structuralSections" && attributedTo.length === 0;
                findings.push({
                    file: c.file,
                    line: c.line,
                    text: `${c.file}:${c.line} (${c.side}) — FROZEN by ${source}: ` +
                        `${FROZEN_SOURCES[source].what}\n` +
                        `        clause: ${JSON.stringify(c.clause)}\n` +
                        (region === null
                            ? ""
                            : `        region: \`${region.heading}\`, lines ${region.from}-${region.to}\n`) +
                        (unattributed
                            ? `        NO CARRIER FOUND: no carrier among the ${attribution.carriers.length} ` +
                                `change set(s) between the recorded base and the working tree was found to have ` +
                                `changed this clause, so this gate cannot say which change set owes the companion ` +
                                `edit. An attribution the gate cannot make is a REFUSAL, not a pass. This is what a ` +
                                `rebased, grafted or shallow history looks like from here — repair the history the ` +
                                `gate reads; do NOT re-record the base to make the clause disappear.\n`
                            : attributedTo.length === 0
                                ? ""
                                : `        Carrier(s) that changed this clause: ` +
                                    `${attributedTo.map(shortCarrier).join(", ")} — none of them touched the ` +
                                    `companion.\n`) +
                        `        Owed companion edit: ${owed}.\n` +
                        `        There is no override tier and no blanket exemption (D-04). Make the companion ` +
                        `edit in the same commit; do NOT narrow the watched corpus and do NOT move the recorded ` +
                        `base commit forward — both clear the finding by deleting its evidence`,
                });
            }
            continue;
        }
        if (!disposition.rows.some((r) => rowMatches(r, c))) {
            findings.push({
                file: c.file,
                line: c.line,
                text: `${c.file}:${c.line} (${c.side}) — no disposition row\n` +
                    `        clause: ${JSON.stringify(c.clause)}\n` +
                    `        Remedy: add a row to your plan's file under ${DISPOSITION_DIR}/ naming the file, ` +
                    `the line, the clause before and after, the profile rule id or decision that drove it, ` +
                    `and the disposition. A row matches when it names this file and either its \`before\` or ` +
                    `its \`after\` normalizes to this clause`,
            });
        }
    }
    findings.sort(byPosition);
    // ─────────────────────────────────────────────────────────────────────────────────────────────
    // WR-02 — THE PUBLISHED DENOMINATOR IS DERIVED BY A DIFFERENT CODE PATH FROM THE ONE THAT COUNTS.
    //
    // THE DEFECT THIS REPLACES. `visited` was incremented once per element of `changed.clauses` and
    // `expected` was `changed.clauses.length` — the length of the very array the loop walks. Both
    // sides read the same object, so `visited !== expected` could not fire under any input, and
    // vacuity.ts's second branch — the one that exists to make a SILENTLY NARROWED check visible —
    // was dead code with a comment explaining what it was for. scripts/kit-model.ts states the rule
    // this violated in its own words: once both sides read the same object, the comparison compares an
    // object with itself and is documentation of intent, never a check.
    //
    // A VACUITY FLOOR CATCHES AN EMPTY DENOMINATOR AND NEVER A SILENTLY SHORT ONE. That is the whole
    // failure: the element count must be derived INDEPENDENTLY of the loop that consumes it.
    //
    // So the ELEMENT is now the changed watched FILE, not the clause:
    //   `expected` — the number of watched files the PER-FILE DIFF reported as changed. That comes
    //                from `changedClausesIn`'s emptiness test on each file's own `git diff` output.
    //   `visited`  — the number of watched files that yielded AT LEAST ONE clause, derived from the
    //                clause set by hunk parsing plus segmentation.
    // Different paths, so a file that changed and produced nothing now moves the two apart. Under the
    // old shape that file was invisible: its clauses simply were not there to count, and the check
    // covered less than it claimed while printing a clean measurement.
    //
    // The clause and disposition-row counts are UNCHANGED and still published on the detail line
    // directly below, so nothing a reader relied on is taken away — the element grain moves, the
    // reported facts do not.
    // ─────────────────────────────────────────────────────────────────────────────────────────────
    const clauseBearingFiles = new Set(changed.clauses.map((c) => c.file));
    const changedFileSet = new Set(changed.changedFiles);
    // THE SET-LEVEL REFUSAL, ABOVE THE MEASURED REPORT AND NAMING ITS MEMBERS.
    //
    // A denominator mismatch that names no member is a number a reader cannot act on. This repository
    // has already recorded that a per-part assertion is SET EQUALITY against each lister rather than a
    // count, so BOTH directions are reported: a file that changed and yielded nothing is a narrowed
    // check, and a file that yielded a clause without appearing in the changed set would mean the two
    // derivations have come apart — structurally impossible today, and asserted anyway, because the
    // direction that cannot happen is the one nobody notices when a refactor makes it possible.
    const changedWithNoClause = changed.changedFiles
        .filter((f) => !clauseBearingFiles.has(f))
        .sort();
    const clauseWithoutChange = [...clauseBearingFiles]
        .filter((f) => !changedFileSet.has(f))
        .sort();
    if (changedWithNoClause.length > 0 || clauseWithoutChange.length > 0) {
        fail(`the changed-file set and the clause-bearing-file set are not equal, so the element count ` +
            `published below covers less than the diff does` +
            (changedWithNoClause.length === 0
                ? ""
                : `\n        changed since ${base.slice(0, 7)} and yielded NO clause ` +
                    `(${changedWithNoClause.length}): ${changedWithNoClause.join(", ")} — each of these ` +
                    `files differs from the base and contributed nothing to the left-hand side, so no ` +
                    `verdict was reported over its change`) +
            (clauseWithoutChange.length === 0
                ? ""
                : `\n        yielded a clause without appearing in the changed set ` +
                    `(${clauseWithoutChange.length}): ${clauseWithoutChange.join(", ")} — the per-file diff ` +
                    `and the clause derivation have come apart, which is a defect in this gate rather than ` +
                    `in the tree it is reading`));
    }
    const measured = {
        // The label names the ELEMENT, so the published line reads as a statement about files and is
        // not mistaken for the clause count on the detail line above it.
        label: "diff disposition — changed watched file(s)",
        visited: clauseBearingFiles.size,
        expected: changed.changedFiles.length,
        findings,
    };
    process.stdout.write(`        ${changed.changedFiles.length} watched file(s) changed since ${base.slice(0, 7)}; ` +
        `${changed.clauses.length} changed clause(s) derived; ` +
        `${disposition.rows.length} disposition row(s) across ${disposition.files.length} file(s)\n`);
    FAILS += reportMeasured(measured, { pass, fail }, (f) => `        ${f.text}`);
    verdict();
}
function verdict() {
    process.stdout.write("\n== Result ==\n");
    if (FAILS === 0) {
        process.stdout.write("ALL CHECKS PASSED\n");
        process.exit(0);
    }
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
}
function runAll() {
    try {
        main();
    }
    catch (e) {
        // A gate that dies is not a gate that failed. Anything the derivations throw — a git invocation
        // that could not run, an unreadable frozen source — is REPORTED here and the exit code is the
        // verdict, never a stack trace on stderr with a zero status.
        fail(`${e.message}\n        No verdict is reported over the diff, because the diff ` +
            `could not be derived`);
        verdict();
    }
}
// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL via pathToFileURL — a
// hand-built `file://${argv[1]}` URL does NOT match on Windows, which would make a direct
// `node scripts/check-diff-disposition.js` run ZERO checks and exit 0, a fabricated green. The guard
// is also what lets the test file IMPORT this module's exported sets without the import running the
// check and calling process.exit inside the vitest worker.
const isEntry = process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
    runAll();
}
