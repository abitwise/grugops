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
// Every kit-internal path a line NAMES, as `agent-factory/config/<basename>`. Extracting the named
// paths — rather than testing the whole line — is what makes a sentence that mentions the directory
// and a fabricated filename a stray rather than a self-reference.
const CONFIG_NAMED_PATH = /agent-factory\/config\/([A-Za-z0-9._-]+)/g;
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
const abs = (rel) => join(ROOT, rel);
// Recursively enumerate every file under a SCAN entry (a dir → walk; a file → itself). Missing
// entries are silently skipped (mirrors `grep -rn` on an absent path printing nothing). Returns
// repo-relative paths so the `path:lineno:line` lines match the .sh `grep -rn` output shape.
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
        acc.push(rel);
    }
    return acc;
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
//   (b) the line names at least one kit-internal path, and EVERY path it names resolves to a file
//       that exists in that directory on the tree under judgement.
//
// (b)'s "at least one" is load-bearing: a line that mentioned the directory prefix and named no
// file at all would otherwise satisfy "every named path exists" vacuously and be exempted for
// having said nothing. A self-reference means a reference to something that is actually there.
function exemptConfigSelfRefs(hits) {
    const dirPrefix = join(CONFIG_SELF_REF_DIR) + sep;
    const exempt = [];
    const strays = [];
    const files = new Set();
    let exemptMentions = 0;
    for (const hit of hits) {
        const m = HIT_SHAPE.exec(hit);
        const file = m ? m[1] : "";
        const line = m ? m[3] : hit;
        const named = [...line.matchAll(CONFIG_NAMED_PATH)].map((n) => n[1]);
        const inConfigDir = file.startsWith(dirPrefix);
        const allResolve = named.length > 0 &&
            named.every((base) => existsSync(abs(join(CONFIG_SELF_REF_DIR, base))));
        if (inConfigDir && allResolve) {
            exempt.push(hit);
            // The MENTION count comes from the SAME `named` array the predicate one line above decided
            // on. One extraction, read once, feeding both the decision and the number the gate publishes
            // about it — a second extraction could disagree with the first, and the reader of the verdict
            // would have no way to tell which of the two the exemption was actually granted from.
            exemptMentions += named.length;
            files.add(file);
        }
        else {
            strays.push(hit);
        }
    }
    return { exempt, exemptMentions, strays, files: [...files].sort() };
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
const { exempt, exemptMentions, strays, files: exemptFiles, } = exemptConfigSelfRefs(grepSubstring(SCAN, CONFIG_REF_NEEDLE));
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
if (existsSync(abs(PACKAGING_TEMPLATE)))
    ghLegal.add(PACKAGING_TEMPLATE);
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
