// check-kit-refs.ts — Phase 7 build gate (SHOME-03 / SC5).
//
// TypeScript port of check-kit-refs.sh (Phase 15, TOOL-01), since amended twice. Phase 24 flipped
// Assertion 2 to grep-to-zero. Phase 27 (KIT-02 / D-16, D-27, D-07) re-pointed the three literals
// this file carried: SCAN reaches the adapter DIRECTORY instead of one hand-named adapter file,
// MARKER_SITES is DERIVED from the adapter directories instead of four hand-listed paths, and
// Assertion 3 is a derived two-sided predicate keyed on the resolver slot instead of an
// exclusion-by-omission. The `grep -rn` over the explicit SCAN set is still a scoped recursive
// file-walk + per-line regex test — NEVER a repo-wide grep. The exclusion-by-not-listing design
// (seed/, examples/, install/, docs/, .planning/ intentionally absent) is load-bearing and is
// preserved exactly: making membership derived is NOT a licence to widen the scan.
// import.meta.dirname resolves the repo root; a CHECK_ROOT override lets a harness point the gate
// at a hermetic mirror.
//
// Proves the kit/state path rewrite is COMPLETE and cannot silently regress. It runs the two D-08
// assertions plus the recommended third assertion and an SC2 invariant-marker check over an
// EXPLICIT file set:
//
//   Assertion 1 (D-08.1): ZERO 'agent-factory/config/' refs across the scan set.
//   Assertion 2 (D-08.2): ZERO refs to the deleted handoff-template directory (flipped in Phase 24
//                         — the 17 templates were deleted, so any surviving ref is dangling). The
//                         path literal itself now lives single-source in scripts/dead-vocabulary.ts
//                         (Phase 27 / D-24).
//   Assertion 3 (SC4/O3): the kit-root env var appears in exactly the derived legal set — the
//                         resolver-slot adapters plus the packaging template — and nowhere else.
//   SC2 marker check:     the compressed kit-vs-state invariant is present at every derived
//                         marker site (two named documents + every adapter).
//
// IMPORTANT — SC5 is "zero MISCLASSIFIED refs", NOT "zero `agent-factory/` strings". The ~96
// intended kit-to-kit refs MUST survive bare. This gate proves the misclassified set is empty.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
//   node scripts/check-kit-refs.js
// Exit 0 = all checks PASS; exit 1 = at least one FAIL.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
// Phase 27 (SPAWN-05 / D-24): the retired-vocabulary literals are single-source. This gate takes the
// PATH form; guard_adapter_body in check-foundation-guards.ts takes the PROSE forms. Two different
// predicates over two different inputs, one list.
import { RETIRED_PATH_FORMS } from "./dead-vocabulary.js";
// Phase 27 (KIT-02 / plan 27-11): the adapter set is derived ONCE, in scripts/kit-model.ts. This
// gate used to carry its own recursive copy of the rule; the copy is deleted, not kept in sync.
import { listAgentAdapters, listSkillAdapters } from "./kit-model.js";
// The .sh assumed cwd == repo root. The TS port resolves every path against the script-relative
// repo root, honoring a CHECK_ROOT override for hermetic harness runs.
const ROOT = process.env.CHECK_ROOT
    ? process.env.CHECK_ROOT
    : join(import.meta.dirname, "..");
// ---------------------------------------------------------------------------
// Explicit SCAN path list — the D-08 "shipped kit + adapters + AGENTS.md". NEVER a repo-wide
// grep. By NOT listing them, this excludes scripts/fixtures/, agent-factory/examples/,
// agent-factory/README.md, install/, root README.md, CLAUDE.md, docs/, .planning/, and this
// script itself. D-03 exclusion: agent-factory/seed/ is INTENTIONALLY NOT listed — its bundled
// files are STATE TEMPLATES whose refs resolve in the TARGET repo, not against the kit root.
// ---------------------------------------------------------------------------
// (Phase 27 / KIT-02, D-16) `.claude/agents` is the DIRECTORY, not one hand-named adapter file.
// It used to read `.claude/agents/grugops-orchestrator.md` — a single name that would have gone
// stale by sixteen the moment plan 27-07 generates one adapter per role. walk() below already
// recurses a directory entry, so naming the directory makes this membership self-deriving with no
// import at all. Every OTHER entry is unchanged: widening the scan is NOT what this change is for.
//
// (Phase 29.1 round 3 / finding R2-WR-05, plan 29.1-17) `agent-factory/config` JOINS this set, and
// the four facts that justify it are written here rather than left to be reconstructed:
//
//   1. THE INSTALLER SHIPS THIS DIRECTORY. install/install.ts:1065 is
//      `cpSync(join(GRUGOPS_SRC, "agent-factory"), tmp, { recursive: true })` inside copyKit — the
//      WHOLE agent-factory/ tree, config/ included, lands at $GRUGOPS_HOME/agent-factory on every
//      install. agent-factory/config/factory.config.md is therefore delivered to every installed
//      user, which is exactly the audience D-08.1 protects.
//   2. ITS ABSENCE WAS AN OMISSION, NOT AN AUDIENCE JUDGMENT — the record is corrected here.
//      29.1-11-SUMMARY.md recorded the WR-05 disposition as split by audience, calling the config
//      field reference the "developer-facing" authority that "lives outside the scan set". "Outside
//      this SCAN set" and "not shipped kit prose" are two different facts, and that rationale used
//      the first to establish the second. The header above says the exclusions are BY NOT LISTING;
//      this directory was simply never listed, since before the config dial existed.
//   3. THE FIELD REFERENCE MUST NAME BOTH CONFIGURATION LOCATIONS. It is where a user learns what
//      the resolver reads, and the resolver reads two files in a declared order — so the document
//      necessarily spells the kit-internal one. scripts/model-dial-consistency.test.ts asserts this
//      ("every declared configuration location appears in the config field reference"), which is
//      the WR-05 closure itself: deleting the mentions to satisfy this gate would reopen WR-05.
//   4. SO THE MENTIONS ARE EXEMPTED BY A COUNTED PREDICATE, NOT BY LEAVING THE DIRECTORY UNSCANNED.
//      The exemption below is derived (a self-reference to an existing sibling), its cardinality is
//      asserted on both sides, and it is published in the pass line. Every other kit-internal
//      mention in this directory — a third one, one in a second file, one naming a path that is not
//      there — fails exactly as it always has.
//
// The header's warning still stands and this change is not the thing it forbids: SCAN gains exactly
// ONE entry, and seed/, examples/, install/, docs/, .planning/ and the root documents stay omitted.
const SCAN = [
    "agent-factory/roles",
    "agent-factory/workflows",
    "agent-factory/checklists",
    "agent-factory/packaging",
    "agent-factory/config",
    "agent-factory/_commit-convention.md",
    ".claude/skills",
    ".claude/agents",
    "skills",
    "AGENTS.md",
];
// Assertion 3, NEGATIVE half — kit prose that must be FREE of $GRUGOPS_HOME. Membership here is
// UNCHANGED and deliberately EXCLUDES agent-factory/packaging/ and the adapter dirs; those already
// self-derive through walk(), so this list needs no membership change. What changed is the CLAIM
// (D-07): this comment used to enumerate the legal sites by path — a count that nothing
// mechanically pinned, that lived ONLY in prose, and that plan 27-07 is about to make wrong by
// sixteen. That is exactly how a literal goes stale unnoticed: no test could ever see it.
// The legal set is no longer enumerated here; it is DERIVED below (ghLegal) as "every
// adapter body carrying the resolver slot, plus the packaging template", and Assertion 3 now
// asserts set EQUALITY in both directions rather than mere absence from this negative scope.
const GH_SCAN = [
    "agent-factory/roles",
    "agent-factory/workflows",
    "agent-factory/checklists",
    "agent-factory/_commit-convention.md",
    "AGENTS.md",
];
// The kit-root environment variable whose legal sites Assertion 3 pins.
const KIT_ROOT_ENV = "GRUGOPS_HOME";
// The resolver slot — the line the installer materializes the absolute kit path above (the
// MAT_SLOT constant in install/install.ts). Carrying this line is what MAKES an adapter a resolver,
// and therefore what makes it legally allowed to name the kit-root environment variable. The
// installer stays self-contained by design (D-18) so the literal is repeated rather than imported;
// that repetition is safe here because a drift does not go silent — the derived legal set would
// shrink and Assertion 3 would fail red naming the files it no longer covers.
const RESOLVER_SLOT = "# 1. (installed) the absolute kit path the installer wrote above this line.";
// The one packaging document that legally mirrors the resolver block for copy-ready use. It is a
// single named file, not a set, so it stays a literal.
const PACKAGING_TEMPLATE = "agent-factory/packaging/subagent.frontmatter.md";
// The two adapter directories the installer materializes into a target repo. Both the derived
// marker-site set and the derived Assertion-3 legal set read from these. They are the fixed
// subpaths the adapter authority returns paths RELATIVE TO, re-prefixed at the call site below.
const AGENT_ADAPTER_DIR = ".claude/agents";
const SKILL_ADAPTER_DIR = ".claude/skills";
const ADAPTER_DIRS = [AGENT_ADAPTER_DIR, SKILL_ADAPTER_DIR];
// The two SINGLE DOCUMENTS carrying the compressed kit-vs-state invariant. Each is one specific
// file rather than a set, so each stays a literal: the root substrate document, and the one role
// file that carries the blockquote.
const MARKER_NAMED_SITES = ["AGENTS.md", "agent-factory/roles/orchestrator.md"];
// A stable, unique substring of the invariant blockquote (byte-identical at every site).
const MARKER = "If the kit dir is absent, STOP — do not hunt.";
// ---------------------------------------------------------------------------
// Assertion 1's ONE exemption (Phase 29.1 round 3 / R2-WR-05, plan 29.1-17).
//
// The SCAN entry above brings the shipped configuration directory inside D-08.1's zero-tolerance
// scan. That directory's field reference owes its reader BOTH configuration locations by path, and
// the second location is inside the kit — so those mentions are exempted, and the exemption is
// written as a predicate with an asserted cardinality rather than as a list.
//
// WHY A COUNT AND NOT JUST A PREDICATE. A hand-listed or uncounted exemption is this repository's
// named set-literal-drift class (grugops MEMORY): the next mention arrives silently and the gate
// stays green. All THREE cardinalities below are asserted two-sided — files, lines and mentions —
// so a further mention is red whether it arrives on a new line, on a line that is already exempt,
// or in a second file, each naming the count found and the count required.
//
// WHY THREE UNITS AND NOT ONE (round 3 / R3-CR-01). Two of them were already here and the third was
// not, and the missing one was the unit the claim was written in: the exemption predicate is asked
// once per LINE, so a mention appended to an already-exempt line was absorbed without the predicate
// ever being asked about it, while a number counted in lines was published as a count of mentions.
// A gate that publishes a number in a unit it does not count tells its reader something false at
// exit 0, so every unit this exemption is about is now both counted and published.
// ---------------------------------------------------------------------------
// The configuration directory the exemption is scoped to. Taken from the SCAN member, not respelt.
const CONFIG_SELF_REF_DIR = "agent-factory/config";
// The substring Assertion 1 greps for, and the prefix a self-reference names a sibling through.
const CONFIG_REF_NEEDLE = "agent-factory/config/";
// Exactly ONE file in that directory may carry exempt mentions: the field reference. The count is a
// number rather than a name on purpose — a name would be satisfied by a rename, a count is not.
const CONFIG_SELF_REF_FILES = 1;
// Exactly TWO exempt LINES. `grepSubstring` emits one `path:lineno:line` hit per LINE, so this
// constant, and the `exempt` array it is compared against, are both counted in LINES.
const CONFIG_SELF_REF_HITS = 2;
// Exactly THREE exempt MENTIONS. Measured 2026-08-20 on this tree by
// `grep -o 'agent-factory/config/' agent-factory/config/factory.config.md | wc -l` = 3, against
// `grep -c` = 2: THREE mentions distributed over TWO lines in ONE file. factory.config.md:3 carries
// ONE (the companion sentence, naming the sibling JSON beside the reference) and
// factory.config.md:138 carries TWO (the resolver's second candidate, then the same path again in
// the sentence that says a `.grugops/` file shadows it). None can be deleted without reopening
// WR-05, which scripts/model-dial-consistency.test.ts asserts.
//
// THE RECORD THIS CORRECTS (round 3 / R3-CR-01). The comment that stood here read "Exactly TWO
// exempt mentions" and named the two LINES as though they were the two mentions. It named the
// MENTION granularity while the constant beside it measured the LINE granularity, and the declared
// number therefore never described this tree. The consequence was the finding: the exemption
// predicate is asked once per LINE, so a second mention appended to an ALREADY-EXEMPT line was
// never asked about at all and no cardinality moved. Each constant now states its own unit, the
// mention count is derived from the same extraction the predicate runs, and all three are asserted.
const CONFIG_SELF_REF_MENTIONS = 3;
// The `path:lineno:line` shape grepSubstring produces, split back into its three parts. The path is
// matched non-greedily up to the first `:<digits>:` so a colon inside the LINE cannot shift it.
const HIT_SHAPE = /^(.*?):(\d+):(.*)$/s;
// ---------------------------------------------------------------------------
// THE ONE EXTRACTION (Phase 29.1 round 4 / R3-CR-01, R3-CR-02 and the round-4 no-capture spelling).
//
// THE SECOND GRAMMAR IS DELETED, NOT WIDENED. What stood here was
// `const CONFIG_NAMED_PATH = /agent-factory\/config\/([A-Za-z0-9._-]+)/g;` — a SECOND grammar over
// the same question `grepSubstring` already answers with a plain substring. The two counted
// different things: the regex counted CAPTURES, the grep counted OCCURRENCES, and
// `exemptMentions += named.length` published the first number under the second number's name. Any
// occurrence yielding no capture, or whose capture was a PREFIX of a longer path, was absorbed into
// an already-exempt line without the membership predicate ever being asked about it. Round 4
// reproduced three spellings of that against the committed build on a hermetic mirror, all three at
// exit 0 with all three published cardinalities exactly as declared. A wider character class would
// have been the same heuristic wearing a bigger alphabet; this repository's recorded lesson is ONE
// format-aware authority per predicate and the DELETION of the second grammar, so the regex is gone
// rather than kept beside what replaces it.
//
// WHAT THE EXTRACTION STILL DOES NOT DECIDE (round 3 / R3-CR-02, preserved). Extraction selects what
// is ASKED ABOUT; it does not decide what is ADMITTED. Whether a named path is a SELF-REFERENCE is
// decided downstream by membership in the derived sibling set, never here and never by an existence
// probe — which is why `.` and `..` need no anticipating.
// ---------------------------------------------------------------------------
// The ONE declared byte class that ENDS a named path: the delimiters this repository's prose puts
// around a path — whitespace, the backtick, the apostrophe, the double quote, the two paren bytes,
// the two square-bracket bytes, the comma and the semicolon.
//
// This is a declaration of what ENDS a record, NOT a denylist of what a path may not be. Widening or
// narrowing it moves where a record STOPS and never what is admissible, so it cannot be the lever a
// future bypass reaches for: a record that stops in the wrong place is simply a different string,
// and a different string is still put to the same membership rule.
const CONFIG_REF_TERMINATOR = /[\s`'"()[\],;]/;
/**
 * Given a line, return ONE record per OCCURRENCE of `CONFIG_REF_NEEDLE` — the same substring
 * `grepSubstring` greps — each record being the maximal run of non-terminator bytes immediately
 * following that occurrence. The record is the EMPTY STRING when the next byte is already a
 * terminator or the line ends there; an empty string is not a member of any sibling set, so an
 * occurrence that names the directory and nothing admissible is a stray rather than an absence.
 *
 * WHY THIS EXISTS. The set the membership predicate is asked about and the set the gate greps must
 * be the SAME set. The previous arrangement had two of them, and every occurrence that fell in the
 * difference shipped unadjudicated under a verdict that said otherwise. One record per occurrence
 * makes "an occurrence the predicate was never asked about" unrepresentable rather than merely
 * unobserved, and makes the published mention count the occurrence count BY CONSTRUCTION.
 *
 * The scan advances past the NEEDLE rather than past the RECORD, so an occurrence spelled inside a
 * longer record is still its own record and cannot be swallowed by the record before it.
 */
function configReferencesIn(line) {
    const refs = [];
    let at = 0;
    for (;;) {
        const found = line.indexOf(CONFIG_REF_NEEDLE, at);
        if (found === -1)
            break;
        const from = found + CONFIG_REF_NEEDLE.length;
        let end = from;
        while (end < line.length && !CONFIG_REF_TERMINATOR.test(line[end]))
            end += 1;
        refs.push(line.slice(from, end));
        at = from;
    }
    return refs;
}
/**
 * The needle-occurrence count for a line, computed WITHOUT the extraction above — a split on the
 * needle rather than a scan for it. Two derivations of one number, so the premise floor below
 * compares two things rather than a thing with itself.
 */
function configRefOccurrences(line) {
    return line.split(CONFIG_REF_NEEDLE).length - 1;
}
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
const abs = (rel) => join(ROOT, rel);
// THE ONE PATH-SPELLING AUTHORITY (Phase 29.1 round 4 / WR-01). A repo-relative path, spelled by
// the platform's own separator, so two sets built by two routes can be compared for equality.
//
// The reasoning is NOT new — it is the one already written above `derive()` below: `join()` (not a
// `/` template) keeps a path byte-identical to what `walk()` produces on Windows as well as Unix,
// and Assertion 3 compares two such sets directly, so a separator mismatch would break it. That
// reasoning was right and its APPLICATION was incomplete: two paths entered a compared set without
// passing through it — the packaging template, added to the legal set as a raw forward-slash
// literal, and a single-FILE scan entry, pushed by the walk exactly as written. On a platform whose
// separator is not the forward slash, Assertion 3 would then fail RED on a correct tree and print
// "its self-heal is gone — this adapter cannot find the kit" about a file that is fine.
//
// It is deliberately the WHOLE authority rather than a second normalisation beside `derive()`:
// `derive()` already composes with `join`, so it is left alone. Every path that enters a set this
// gate compares passes through here, or through a `join` that is already this same call.
const relKey = (rel) => join(rel);
// Recursively enumerate every file under a SCAN entry (a dir → walk; a file → itself). Missing
// entries are silently skipped (mirrors `grep -rn` on an absent path printing nothing). Returns
// repo-relative paths so the `path:lineno:line` lines match the .sh `grep -rn` output shape.
//
// (WR-01) The file branch pushes `relKey(rel)` rather than `rel`. The directory branch always
// composed with `join` and so was never wrong; the file branch pushed a SCAN entry exactly as
// declared, which on Windows put a forward-slash spelling into a set compared against separator-
// spelled paths. The asymmetry was the defect, and applying the one authority at both branches is
// what removes it — `relKey` is idempotent, so a path the directory branch already spelled is
// unchanged by passing through it again.
function walk(rel, acc) {
    const a = abs(rel);
    if (!existsSync(a))
        return acc;
    const st = statSync(a);
    if (st.isDirectory()) {
        for (const entry of readdirSync(a).sort()) {
            walk(join(rel, entry), acc);
        }
    }
    else if (st.isFile()) {
        acc.push(relKey(rel));
    }
    return acc;
}
// ---------------------------------------------------------------------------
// The set a NAMED PATH must be a MEMBER of to be a self-reference (Phase 29.1 round 3 / R3-CR-02,
// plan 29.1-18): the DEPTH-1 REGULAR FILES the configuration directory carries on the tree under
// judgement.
//
// Derived through walk(), the function this gate already uses to answer "what files are here", so
// the file-versus-directory question is answered ONCE by the authority that already answers it —
// walk() pushes an entry only under `st.isFile()`. A second readdirSync or a second statSync at the
// call site would be a second answer for the first one to drift away from. Depth 1 is enforced by
// requiring the remainder after the directory prefix to carry no further separator, so a file
// nested inside a subdirectory contributes its subdirectory to nothing.
// ---------------------------------------------------------------------------
function configSiblingFiles() {
    const dirPrefix = join(CONFIG_SELF_REF_DIR) + sep;
    return walk(CONFIG_SELF_REF_DIR, [])
        .filter((rel) => rel.startsWith(dirPrefix))
        .map((rel) => rel.slice(dirPrefix.length))
        .filter((base) => !base.includes(sep))
        .sort();
}
// A named path is a self-reference when — and ONLY when — it is a member of that set. This is a
// statement of what a named path may BE, not a list of spellings it may not be, and the six
// consequences are all consequences of the one rule:
//
//   `..`      is not a member: a directory listing does not contain it. The traversal that climbed
//             out of the configuration directory and was certified as a reference inside it (the
//             R3-CR-02 bypass) is refused because nothing named `..` is carried here.
//   `.`       is not a member, for the same reason.
//   a SUBDIR  is not a member: the set holds regular files only, so a path under a future
//             `agent-factory/config/<subdir>/` names the subdirectory first and is a stray. The
//             exemption is bounded in depth as well as in count.
//   a GHOST   is not a member: a fabricated filename was never carried here. This is the
//             pre-existing behaviour, preserved — the rule is narrower than the probe it replaces
//             and admits nothing the probe refused.
//   a SUFFIX  is not a member: `factory.config.json/../../../../etc/passwd` is a different string
//             from `factory.config.json`, so it is not in the set. This is new only in the value
//             handed here (round 4): the rule was always membership over a whole path, and it used
//             to be handed the path's FIRST SEGMENT, which is why a member's name with anything at
//             all appended read as that member.
//   the EMPTY is not a member: a directory listing does not carry a nameless entry, so an
//   STRING    occurrence naming the directory with nothing admissible after it is refused as a
//             stray rather than passing as an absence.
function isConfigSibling(siblings, named) {
    return siblings.has(named);
}
// grep -rn over a SCAN set for a fixed substring: return `path:lineno:line` hits (1-based).
function grepSubstring(scan, needle) {
    const hits = [];
    for (const entry of scan) {
        for (const file of walk(entry, [])) {
            const lines = readText(file).split("\n");
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(needle))
                    hits.push(`${file}:${i + 1}:${lines[i]}`);
            }
        }
    }
    return hits;
}
// grep -rln over a SCAN set for a fixed substring: return matching file paths (deduped, the -l
// "files-with-matches" form used by Assertion 3).
function grepFilesWithMatch(scan, needle) {
    const files = new Set();
    for (const entry of scan) {
        for (const file of walk(entry, [])) {
            if (readText(file).includes(needle))
                files.add(file);
        }
    }
    return [...files];
}
function readText(rel) {
    return readFileSync(abs(rel), "utf8");
}
// Partition Assertion 1's hits into EXEMPT self-references and STRAYS, by a predicate over each
// hit — never by a list of line numbers, hit strings or file names.
//
// A hit is exempt when BOTH hold:
//   (a) the file carrying it is itself inside the configuration directory, and
//   (b) the line names at least one kit-internal path, and EVERY path it names is a MEMBER of
//       `siblings` — the depth-1 regular files that directory carries on the tree under judgement.
//
// (b)'s "at least one" is load-bearing: a line that mentioned the directory prefix and named no
// file at all would otherwise satisfy "every named path is a member" vacuously and be exempted for
// having said nothing. A self-reference means a reference to something that is actually there.
//
// (b) IS MEMBERSHIP, NOT RESOLUTION (round 3 / R3-CR-02). It read "resolves to a file that exists in
// that directory" and was implemented as `existsSync(join(dir, base))`, which is true for `.`, for
// `..` and for any subdirectory — so the documented predicate was false on both halves and a path
// leaving the directory was certified as a reference inside it. Membership in a set derived from
// what the directory actually carries is the same sentence made checkable: the set cannot contain a
// name the directory does not carry, so no spelling has to be anticipated.
//
// (b) IS ASKED OF EVERY OCCURRENCE (round 4 / R3-CR-01, R3-CR-02 and the no-capture spelling). It
// used to be asked of every CAPTURE of a second grammar, and the gate greps OCCURRENCES of a
// substring — so an occurrence that produced no capture, or whose capture was a prefix of a longer
// path, was never put to (b) at all while the line around it carried a legitimate mention that was.
// `configReferencesIn` emits one record per occurrence, so "every path it names" is now every
// occurrence of the needle, and the number published below is that same count by construction.
function exemptConfigSelfRefs(hits, siblings) {
    const dirPrefix = join(CONFIG_SELF_REF_DIR) + sep;
    const exempt = [];
    const strays = [];
    const files = new Set();
    const unitMismatches = [];
    let exemptMentions = 0;
    for (const hit of hits) {
        const m = HIT_SHAPE.exec(hit);
        const file = m ? m[1] : "";
        const line = m ? m[3] : hit;
        const named = configReferencesIn(line);
        // THE RUN-TIME PREMISE FLOOR. The whole finding this rewrite closes was a disagreement between
        // two numbers that nothing ever compared: the count the extraction produced, and the count of
        // needle occurrences the gate greps in. They are identical BY CONSTRUCTION today, computed two
        // different ways, so this can NOT fire on this tree — and that is the point of writing it. It is
        // the assertion that would have named R3-CR-01 the day the two units first parted company, and
        // it is the assertion that names the next refactor that parts them again. A floor is worth
        // nothing on the day it is written; it is worth everything on the day someone changes the
        // extraction and does not notice which number the verdict publishes.
        const occurrences = configRefOccurrences(line);
        if (named.length !== occurrences) {
            unitMismatches.push(`${m ? `${file}:${m[2]}` : "(unparsed hit)"}: the extraction produced ${named.length} record(s) where the line carries ${occurrences} occurrence(s) of ${CONFIG_REF_NEEDLE}:\n${line}`);
        }
        const inConfigDir = file.startsWith(dirPrefix);
        const allResolve = named.length > 0 &&
            named.every((path) => isConfigSibling(siblings, path));
        if (inConfigDir && allResolve) {
            exempt.push(hit);
            // The MENTION count comes from the SAME `named` array the predicate one line above decided
            // on. One extraction, read once, feeding both the decision and the number the gate publishes
            // about it — a second extraction could disagree with the first, and the reader of the verdict
            // would have no way to tell which of the two the exemption was actually granted from. Since
            // round 4 that array holds one record per needle occurrence, so this number is the mention
            // count in the unit the gate greps rather than in a second grammar's unit.
            exemptMentions += named.length;
            files.add(file);
        }
        else {
            strays.push(hit);
        }
    }
    return {
        exempt,
        exemptMentions,
        strays,
        files: [...files].sort(),
        unitMismatches,
    };
}
// ---------------------------------------------------------------------------
// Derived adapter set (Phase 27 / KIT-02, D-27). Every `.md` under .claude/agents plus every
// SKILL.md under .claude/skills — taken from scripts/kit-model.ts, the ONE answer in this tree to
// "what is an adapter".
//
// This file's own derivation (plan 27-11) is DELETED rather than kept beside the authority. It was
// the derivation that was already RECURSIVE and already correct, so nothing observable changes
// here; what changes is that there is no longer a second implementation of the rule for the first
// one to drift away from. The authority is called with the root THIS gate already resolved, so a
// CHECK_ROOT mirror is judged as a whole.
//
// D-06/D-08 put the compressed kit-vs-state invariant blockquote in EVERY adapter, so the former
// four-entry hand-maintained MARKER_SITES list would have gone stale by fifteen the moment plan
// 27-07 lands the other sixteen adapters. D-27 brought it into scope for exactly that reason: it is
// the literal the original inventory missed, and leaving it hand-maintained would have shipped a
// fresh instance of the defect this phase exists to delete. Today this yields eight adapters (one
// agent + seven skills), so ten marker sites with the two named documents; after 27-07 it yields
// twenty-four, so twenty-six — with no edit here.
//
// SCOPE NOTE: the root `skills/` tree (the plugin-form mirror) is deliberately NOT an adapter dir.
// It carries no resolver block, and its SKILL.md files are the plugin packaging of the same skills.
// It remains inside SCAN, so a stray reference there is still caught by Assertions 1 and 2 and by
// the Assertion-3 equality below — where, carrying no resolver slot, it could only ever appear on
// the illegal side.
// ---------------------------------------------------------------------------
// The authority returns paths relative to each adapter directory; this gate's marker-site set and
// every message it prints are repo-relative, so the fixed subpath is prefixed back on HERE rather
// than the authority's pinned return shape being changed for one consumer. join() (not a `/`
// template) keeps these byte-identical to the paths walk() produces on Windows as well as Unix —
// Assertion 3 compares the two sets directly, so a separator mismatch would break it silently.
//
// The authority THROWS on an unreadable or empty directory instead of returning []. The thrown
// message is RECORDED, not swallowed and not allowed to abort the process: one unreadable adapter
// directory must not skip Assertions 1-3, which read a different scan set entirely.
const derivationErrors = [];
const derive = (list, subpath) => {
    try {
        return list(ROOT).map((rel) => join(subpath, rel));
    }
    catch (e) {
        derivationErrors.push(e instanceof Error ? e.message : String(e));
        return [];
    }
};
const ADAPTER_FILES = [
    ...derive(listAgentAdapters, AGENT_ADAPTER_DIR),
    ...derive(listSkillAdapters, SKILL_ADAPTER_DIR),
].sort();
// Every site that must carry the invariant blockquote: the two named documents plus every adapter.
const MARKER_SITES = [...MARKER_NAMED_SITES, ...ADAPTER_FILES];
process.stdout.write("== Phase 7 kit-ref gate (SHOME-03 / SC5) ==\n");
// ---------------------------------------------------------------------------
// Vacuity floor. Deriving a set silently deletes a fail-red branch: an adapter that disappears
// stops being a member instead of becoming a finding, so an empty adapter directory would make the
// marker check and the Assertion-3 legal set both pass over nothing. The exact adapter cardinality
// is owned by guard_referential_integrity (KIT-03), which compares the adapter directory against
// the role corpus; this gate only refuses the vacuous case, which is all it can honestly assert
// against an arbitrary CHECK_ROOT mirror.
// ---------------------------------------------------------------------------
//
// A derivation that THREW is its own finding, reported whether or not the surviving set is empty:
// if one adapter directory is unreadable and the other is populated, the vacuity floor below passes
// and the failure would otherwise be silent.
process.stdout.write(`\n[derivation] adapter set derived from ${ADAPTER_DIRS.join(" + ")}\n`);
for (const message of derivationErrors) {
    fail(`adapter derivation failed — ${message}`);
}
if (ADAPTER_FILES.length === 0) {
    fail(`no adapter files found under ${ADAPTER_DIRS.join(" or ")} — refusing to check a vacuous set (every derived assertion below would pass over nothing)`);
}
else {
    pass(`${ADAPTER_FILES.length} adapter file(s) derived`);
}
// ---------------------------------------------------------------------------
// Assertion 1 (D-08.1): ZERO agent-factory/config/ refs in the scan set, EXCEPT the counted
// self-references the shipped field reference owes its reader (Phase 29.1 round 3 / R2-WR-05).
//
// The predicate is unchanged for the whole scan set bar one directory: a kit-internal path in a
// role, a workflow, a checklist, the packaging authority, an adapter or AGENTS.md fails exactly as
// it always has, with the same wording. Inside the configuration directory the hits are partitioned
// first, and the exemption is then pinned by two cardinalities and published in the verdict.
// ---------------------------------------------------------------------------
process.stdout.write("\n[Assertion 1] no agent-factory/config/ refs remain (config now .grugops/factory.config.json)\n");
// VACUITY FLOOR, before the cardinality assertion — same discipline as the adapter floor above.
// A tree under judgement that carries no configuration directory at all would make the counts below
// disagree for a reason nobody could attribute (0 files where 1 is required), or, had the counts
// been written as upper bounds, pass over nothing. Naming the absence is the honest verdict.
const configDirPresent = existsSync(abs(CONFIG_SELF_REF_DIR));
if (!configDirPresent) {
    fail(`no ${CONFIG_SELF_REF_DIR}/ directory found — refusing to adjudicate its exemption against a tree that does not carry it (the counted self-references below would be absent for an unattributable reason)`);
}
// SECOND VACUITY FLOOR, for the DERIVED SIBLING SET, asserted before the membership test is
// believed rather than after. The directory can be present and still carry no regular file at its
// top level, and then every mention becomes a stray for a reason having nothing to do with the
// mention — a red nobody could attribute to the thing that caused it. Same discipline, same wording
// style, as the absent-directory finding above: name the absence.
const configSiblings = new Set(configSiblingFiles());
// The denominator is PUBLISHED, not merely used. A membership rule is only as trustworthy as the
// set it decides against, and a reader of a green run — or a harness asserting this gate's premise —
// cannot otherwise see what that set was. Same discipline as the adapter derivation line above and
// as the marker-site count: report what was compared, never a bare verdict.
process.stdout.write(`  [derivation] exemption sibling set: ${configSiblings.size} depth-1 regular file(s) in ${CONFIG_SELF_REF_DIR}/ [${[...configSiblings].join(", ")}]\n`);
if (configDirPresent && configSiblings.size === 0) {
    fail(`${CONFIG_SELF_REF_DIR}/ carries no regular file at its top level — refusing to adjudicate its exemption against an empty sibling set (every named path would be a stray for a reason having nothing to do with the mention)`);
}
const { exempt, exemptMentions, strays, files: exemptFiles, unitMismatches, } = exemptConfigSelfRefs(grepSubstring(SCAN, CONFIG_REF_NEEDLE), configSiblings);
// The strays half — byte-identical wording to the pre-exemption gate.
if (strays.length === 0) {
    pass(`no agent-factory/config/ refs remain (${exemptMentions} counted self-reference mention(s) on ${exempt.length} line(s) exempt, in ${exemptFiles.join(", ") || "no file"})`);
}
else {
    fail(`stray agent-factory/config/ ref(s) — config must be .grugops/factory.config.json:\n${strays.join("\n")}`);
}
// The exemption's cardinality, asserted TWO-SIDED and only where it can mean anything.
if (configDirPresent) {
    let drift = "";
    if (exemptFiles.length !== CONFIG_SELF_REF_FILES) {
        drift += `\n  exempting FILES: found ${exemptFiles.length}, required exactly ${CONFIG_SELF_REF_FILES} (${exemptFiles.join(", ") || "none"})`;
    }
    if (exempt.length !== CONFIG_SELF_REF_HITS) {
        drift += `\n  exempt LINES: found ${exempt.length}, required exactly ${CONFIG_SELF_REF_HITS} (one grep hit per line, so this number is in LINES):\n${exempt.join("\n") || "  (none)"}`;
    }
    if (exemptMentions !== CONFIG_SELF_REF_MENTIONS) {
        drift += `\n  exempt MENTIONS: found ${exemptMentions}, required exactly ${CONFIG_SELF_REF_MENTIONS} (a single line naming the kit-internal path twice carries TWO mentions, which is why this number is not the LINE count above)`;
    }
    if (drift === "") {
        pass(`the config self-reference exemption is exactly ${CONFIG_SELF_REF_MENTIONS} mention(s) on ${CONFIG_SELF_REF_HITS} line(s) in ${CONFIG_SELF_REF_FILES} file(s), as declared`);
    }
    else {
        fail(`the agent-factory/config/ self-reference exemption has drifted — it is ${CONFIG_SELF_REF_MENTIONS} mention(s) on ${CONFIG_SELF_REF_HITS} line(s) in ${CONFIG_SELF_REF_FILES} file(s) BY DECLARATION, and a new mention must be argued and counted, never absorbed:${drift}`);
    }
}
// The FOURTH named finding, beside FILES, LINES and MENTIONS: the gate's own premise, asserted at
// run time rather than assumed. It is deliberately NOT gated on the configuration directory being
// present — the claim is about this gate's arithmetic over whatever hits it was handed, not about
// the tree carrying anything in particular. It publishes nothing when it holds, because a green run
// must stay byte-identical to the one this rewrite replaced; the silence is the assertion passing.
if (unitMismatches.length > 0) {
    fail(`the exemption's two units disagree — the extraction produced a different number of records than the line carries occurrences of ${CONFIG_REF_NEEDLE}, so a mention exists that the membership predicate was never asked about:\n${unitMismatches.join("\n")}`);
}
// ---------------------------------------------------------------------------
// Assertion 2 (D-13, FLIPPED in Phase 24): ZERO refs to the deleted handoff-template DIRECTORY
// across the SCAN set.
//
// The 17 handoff templates were deleted in Phase 24 (the shared verified-context notes replaced
// the static-handoff relay). The former "known-template ALLOW ERE + template-dir/placeholder
// filters" are gone: ANY surviving ref to that directory in the shipped kit + adapters +
// AGENTS.md is now a dangling reference to a deleted artifact and FAILS. This flip IS the
// backpressure for the two-stage cut-over (D-12/D-14) — it could not go green until the Wave-1
// rewire (Plans 24-01/24-02) drove the role/workflow/packaging/AGENTS.md SCAN set to zero. The
// explicit SCAN set (~45-55) is preserved — never a repo-wide grep (D-13 token economy).
//
// (Phase 27 / SPAWN-05, D-24) The PREDICATE and the SCAN SET are unchanged; only the provenance of
// the path literal moved. It is imported from scripts/dead-vocabulary.ts, the one module that says
// which vocabulary is retired, so this gate and guard_adapter_body can never disagree about what
// "retired" means. The two are different predicates over different inputs — this one greps a
// directory path, that one greps prose containing no path — which is why a second CHECK is
// justified and a second LIST is not. The output wording is byte-identical to the inline form.
// ---------------------------------------------------------------------------
const retiredPaths = RETIRED_PATH_FORMS.join(", ");
process.stdout.write(`\n[Assertion 2] zero ${retiredPaths} refs remain (the 17 templates were deleted in Phase 24)\n`);
const stray = RETIRED_PATH_FORMS.flatMap((p) => grepSubstring(SCAN, p)).join("\n");
if (stray === "") {
    pass(`no ${retiredPaths} refs remain`);
}
else {
    fail(`stray ${retiredPaths} ref(s) — the handoff templates were deleted (Phase 24); rewire to the shared-context notes:\n${stray}`);
}
// ---------------------------------------------------------------------------
// Assertion 3 (SC4 / O3), RESTATED as a DERIVED PREDICATE (Phase 27 / KIT-02, D-07).
//
// The claim: the kit-root environment variable appears in the generator-produced resolver adapters
// and the packaging template, and NOWHERE ELSE in the shipped kit. It is checked in two halves.
//
//   NEGATIVE half (preserved verbatim): the GH_SCAN kit prose — roles, workflows, checklists, the
//   commit convention and the root substrate document — must be free of the variable.
//
//   POSITIVE half (new, and what makes this restatement STRICTLY STRONGER than the exclusion it
//   replaces): the legal set is DERIVED as every adapter body carrying the resolver slot, plus the
//   packaging template, and the set of scanned files naming the variable must equal it EXACTLY.
//   The old form was exclusion-by-omission — a hand-written adapter carrying the variable without a
//   resolver slot passed simply by not being on a list. It now fails red. The equality is two-sided,
//   so a resolver adapter that LOST its self-heal line — and could therefore no longer find the kit
//   — also fails red, where before nothing looked.
// ---------------------------------------------------------------------------
process.stdout.write(`\n[Assertion 3] $${KIT_ROOT_ENV} appears in the resolver adapters + the packaging template and nowhere else\n`);
// Negative half — unchanged scope, unchanged meaning.
const gh = grepFilesWithMatch(GH_SCAN, KIT_ROOT_ENV).join("\n");
if (gh === "") {
    pass(`no kit prose / AGENTS.md names $${KIT_ROOT_ENV} (${GH_SCAN.length} scan entries compared)`);
}
else {
    fail(`kit prose names $${KIT_ROOT_ENV} (must live only in the resolver adapter self-heal):\n${gh}`);
}
// Positive half — derived legal set vs the files that actually name the variable.
const ghLegal = new Set(ADAPTER_FILES.filter((rel) => readText(rel).includes(RESOLVER_SLOT)));
// (WR-01) The template enters the legal set through the ONE spelling authority, because the set it
// is about to be compared against is spelled by `walk()`. The `existsSync` probe keeps taking the
// literal through `abs()`, which is the same `join` and needs no second normalisation.
if (existsSync(abs(PACKAGING_TEMPLATE)))
    ghLegal.add(relKey(PACKAGING_TEMPLATE));
const ghActual = new Set(grepFilesWithMatch(SCAN, KIT_ROOT_ENV));
const ghIllegal = [...ghActual].filter((f) => !ghLegal.has(f)).sort();
const ghSilent = [...ghLegal].filter((f) => !ghActual.has(f)).sort();
if (ghIllegal.length === 0 && ghSilent.length === 0) {
    pass(`$${KIT_ROOT_ENV} appears in exactly the ${ghLegal.size} derived legal site(s) (resolver-slot adapters + the packaging template)`);
}
else {
    let why = "";
    if (ghIllegal.length > 0) {
        why += `\n  names $${KIT_ROOT_ENV} but carries no resolver slot (a hand-written adapter cannot legally hold the kit-root variable): ${ghIllegal.join(", ")}`;
    }
    if (ghSilent.length > 0) {
        why += `\n  carries the resolver slot but never names $${KIT_ROOT_ENV} (its self-heal is gone — this adapter cannot find the kit): ${ghSilent.join(", ")}`;
    }
    fail(`$${KIT_ROOT_ENV} legal-set equality does not hold:${why}`);
}
// ---------------------------------------------------------------------------
// SC2: the compressed invariant marker is present at EVERY marker site — the two named documents
// plus every derived adapter (D-27). The two failure words below are distinct on purpose and are
// preserved: `(absent)` means the file is not there at all, `(marker-missing)` means the file is
// there but has lost the blockquote. They diagnose different faults and must not be merged.
// ---------------------------------------------------------------------------
process.stdout.write(`\n[SC2] kit-vs-state invariant marker present at all ${MARKER_SITES.length} derived marker sites\n`);
let missing = "";
for (const site of MARKER_SITES) {
    if (!existsSync(abs(site))) {
        missing += ` ${site}(absent)`;
    }
    else if (!readText(site).includes(MARKER)) {
        missing += ` ${site}(marker-missing)`;
    }
}
if (missing === "") {
    pass(`invariant marker present at all ${MARKER_SITES.length} marker sites (${MARKER_NAMED_SITES.length} named + ${ADAPTER_FILES.length} derived adapters)`);
}
else {
    fail(`invariant marker missing from:${missing}`);
}
// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------
process.stdout.write("\n== Result ==\n");
if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
}
else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
}
