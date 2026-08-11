// check-public-docs-vocabulary.ts — Phase 28 AUDIT-02 drift guard (D-09).
//
// Asserts that the USER-VISIBLE public documents carry ZERO retired grugops vocabulary. Phase 24
// deleted the seventeen static handoff templates and the shared verified context replaced the
// relay; the prose describing that relay survived in the documents a reader actually meets first —
// the GitHub front page, the substrate, the worked examples, and the start-here guide the installer
// copies into every host repo.
//
//   node scripts/check-public-docs-vocabulary.js
// Exit 0 = every public document is free of retired vocabulary; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// ---------------------------------------------------------------------------------------------
// THREE FACTS A LATER EDITOR NEEDS.
//
// 1. THIS IS THE THIRD CONSUMER OF scripts/dead-vocabulary.ts, NOT A FOURTH LIST. check-kit-refs
//    Assertion 2 takes the PATH form over the shipped kit; guard_adapter_body in
//    check-foundation-guards.ts takes the PROSE forms over the adapter bodies; this gate takes BOTH
//    over the public documents. Three genuinely different predicates over three different inputs,
//    ONE list (Phase 27 / D-24). This module declares NO retired-vocabulary literal of its own, and
//    it must never start: a second list is how the one list goes stale.
//
// 2. AGENTS.md IS DELIBERATELY DOUBLE-COVERED, AND THE OVERLAP IS STATED RATHER THAN ACCIDENTAL.
//    check-kit-refs's SCAN already greps AGENTS.md for the PATH form. This gate scans it again —
//    for the PROSE forms, which check-kit-refs never checks anywhere. The path-form overlap is the
//    price of deriving root membership from readdirSync instead of hand-listing four names, and it
//    is cheap: two gates agreeing on zero hits costs one extra read and removes a remembering step.
//    What this gate does NOT do is widen check-kit-refs's SCAN — that set is byte-unchanged, and
//    the Phase 27 D-08 "shipped kit + adapters + AGENTS.md, NEVER a repo-wide grep" contract holds.
//
// 3. THE D-24 RED TRANSCRIPT — this guard was watched FAILING against the real tree before a single
//    word of drift was fixed, because a guard that passes the moment it appears has never been
//    watched fail. Measured 2026-08-11 on the tree at HEAD, `node scripts/check-public-docs-vocabulary.js`:
//
//      retired literal                          hits  files named
//      ---------------------------------------  ----  -------------------------------------------
//      "agent-factory/handoffs/"  (path)          14  examples/01-greenfield-bootstrap.md 3,
//                                                     examples/02-brownfield-bootstrap.md 2,
//                                                     examples/03-ticket-to-pr.md 2,
//                                                     examples/04-sprint-cycle.md 5,
//                                                     examples/05-release-run.md 2
//      "handoff packet"           (prose)          4  README.md 1, CLAUDE.md 2,
//                                                     agent-factory/README.md 1
//      "the handoff is the only memory" (prose)    0  —
//      ---------------------------------------  ----  -------------------------------------------
//      TOTAL                                      18  across 8 of the 10 scanned documents
//
//      exit code 1 — 19 CHECK(S) FAILED (18 per-hit findings + 1 summary finding)
//
//    Plan 28-05 lands the rewrites that turn this green. A red build on this gate before that lands
//    is the ACCEPTANCE EVIDENCE for D-24, not a regression.
// ---------------------------------------------------------------------------------------------
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// Phase 27 (SPAWN-05 / D-24), extended by Phase 28 (AUDIT-02 / D-09): the retired-vocabulary
// literals are single-source. Both arrays are taken whole; neither is filtered, sliced, or
// re-declared here.
import { RETIRED_PATH_FORMS, RETIRED_PROSE_FORMS, } from "./dead-vocabulary.js";
// The walk's WORK bound is taken from the ONE place this repository declares it rather than
// restated as a second 10000. kit-model's own comment records why a per-path cycle answer cannot
// bound a walk; the same argument applies to any directory a contributor can add files to.
import { MAX_WALK_ENTRIES } from "./kit-model.js";
// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. When unset, resolve every
// path against the script-relative repo root (cwd does not matter).
const ROOT = process.env.CHECK_ROOT
    ? process.env.CHECK_ROOT
    : join(import.meta.dirname, "..");
const abs = (rel) => join(ROOT, rel);
const readText = (rel) => readFileSync(abs(rel), "utf8");
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
    process.stdout.write(`  FAIL  ${m}\n`);
    FAILS += 1;
};
// Exported accessor so a later aggregator can fold this gate's verdict without reaching for a
// shared global (the check-uat-oracles precedent).
export const publicDocsVocabularyFails = () => FAILS;
const MARKDOWN_EXT = ".md";
const EXAMPLES_DIR = "examples";
const KIT_README = "agent-factory/README.md";
// ---------------------------------------------------------------------------
// THE EXEMPTION, BY NAME, WITH ITS REASON AND ITS BOUND RECORDED.
//
// CHANGELOG.md is exempt. It is a Keep a Changelog 1.1.0 historical record, and the retired
// vocabulary inside it describes WHAT THE PROJECT USED TO SHIP — which is precisely what a
// changelog is for. Rewriting a changelog entry to describe an architecture that did not exist when
// that version shipped would be falsifying the record, not fixing drift.
//
// THE BOUND: the exemption forgoes the vocabulary check for this ONE named file and nothing else.
// It does not exempt any other root document, and it does not exempt CHANGELOG.md from any other
// gate. A case in scripts/check-public-docs-vocabulary.test.ts plants the SAME string in
// CHANGELOG.md and in a second root document inside one mirror, and asserts the gate names the
// second and not the first — so the exemption is proven to DISCRIMINATE rather than merely to exist.
//
// THE FORBIDDEN ALTERNATIVE, NAMED SO IT IS NOT REDISCOVERED AS A GOOD IDEA: loosening the grep so
// this one file passes — matching only outside fenced blocks, only above some line number, only on
// whole words — would delete the check for every OTHER public document to accommodate one. If a
// second document ever earns an exemption, the answer is to widen THIS ARRAY with its reason,
// never to weaken the assertion.
//
// docs/initial/ and docs/design/ are exempt STRUCTURALLY, by never being members of the derived
// set: the derivation reaches root markdown files, examples/ and one named kit document, and
// nothing under docs/. They carry handoff prose as design-history record for the same reason
// CHANGELOG.md does, and they are recorded here so their absence reads as a decision rather than
// as an oversight.
// ---------------------------------------------------------------------------
export const PUBLIC_DOCS_EXEMPT = ["CHANGELOG.md"];
// Refusals raised while DERIVING the scan set (an unreadable root, a walk that blew its budget).
// They are collected rather than thrown because this is a GATE and not a library: kit-model throws
// on the same conditions because a truncated member set silently passes every downstream consumer,
// while a gate's own floor is to REPORT — the throw-versus-report split documented at
// scripts/kit-model.ts around the walk bound and its install/kit-source.ts twin.
const DERIVATION_REFUSALS = [];
// Recursively enumerate every file under a scan entry (a dir → walk; a file → itself). Directory
// entries are `.sort()`ed so two runs over the same tree are byte-identical. Missing entries are
// silently skipped (mirroring `grep -rn` on an absent path printing nothing); a part that derives
// nothing is caught by the per-part vacuity floor below, not here.
//
// The budget is ONE mutable tally threaded through the whole walk. It counts entries EXAMINED,
// before deciding whether to descend or collect, so the bound limits WORK directly and is
// independent of the tree's shape. Returning the members collected so far would be a silent
// truncation, and a truncated scan set passes every guard exactly the way a vacuous one does — so
// the walk reports a named refusal instead.
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
// grep -rn over a scan set for a fixed substring: return `path:lineno:line` hits (1-based).
function grepSubstring(scan, needle) {
    const hits = [];
    for (const file of scan) {
        const lines = readText(file).split("\n");
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(needle))
                hits.push(`${file}:${i + 1}:${lines[i]}`);
        }
    }
    return hits;
}
// The same grep over a LOWERCASED copy of each line. The retired prose list stores lowercase forms
// only (see scripts/dead-vocabulary.ts) — a re-capitalised retired phrase is the same retired
// phrase. The reported line is the ORIGINAL, so the hit is quotable.
function grepSubstringInsensitive(scan, needle) {
    const hits = [];
    for (const file of scan) {
        const lines = readText(file).split("\n");
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(needle)) {
                hits.push(`${file}:${i + 1}:${lines[i]}`);
            }
        }
    }
    return hits;
}
// ---------------------------------------------------------------------------
// THE DERIVED SCAN SET — three parts, each self-deriving, none hand-listed.
//
// A hand-listed file array here would be the set-literal drift defect landing INSIDE the phase
// auditing for set-literal drift. The derivation fails CLOSED: a new public document carrying
// retired vocabulary enters this scan by EXISTING, not by someone remembering to add it.
// ---------------------------------------------------------------------------
// Part `root`: every markdown file directly in the repository root, minus the named exemptions.
function rootMarkdown() {
    let entries;
    try {
        entries = readdirSync(ROOT);
    }
    catch {
        DERIVATION_REFUSALS.push(`cannot read the repository root ${ROOT} — refusing to report a verdict over a root part ` +
            `derived from an unreadable directory`);
        return [];
    }
    return entries
        .filter((f) => f.endsWith(MARKDOWN_EXT))
        .filter((f) => {
        try {
            return statSync(join(ROOT, f)).isFile();
        }
        catch {
            // A vanished/unstattable entry between the readdir and the stat is a race, not a member.
            return false;
        }
    })
        .sort()
        .filter((f) => !PUBLIC_DOCS_EXEMPT.includes(f));
}
// Part `examples`: the worked examples, taken as a DIRECTORY entry so membership self-derives
// through walkFiles() with no import and no name written down. A sixth example enters by existing.
function examplesMarkdown() {
    const acc = [];
    const refusal = walkFiles(EXAMPLES_DIR, { examined: 0 }, acc);
    if (refusal !== null)
        DERIVATION_REFUSALS.push(refusal);
    return acc.filter((f) => f.endsWith(MARKDOWN_EXT));
}
// Part `kitReadme`: one named literal. agent-factory/README.md is the start-here guide
// install/install.ts copies into every host repo, and it is deliberately absent from
// check-kit-refs's SCAN. It is a single file rather than a set, so it stays a literal.
export const PUBLIC_DOCS_SCAN_PARTS = [
    { name: "root", members: rootMarkdown() },
    { name: "examples", members: examplesMarkdown() },
    { name: "kitReadme", members: [KIT_README] },
];
// The concatenation, in part order. Exported so a consumer partitions this set by the SAME parts it
// was built from rather than restating a directory literal.
export function publicDocsScan() {
    return PUBLIC_DOCS_SCAN_PARTS.flatMap((p) => [...p.members]);
}
// The pinned cardinality. 10 today: 4 root markdown files (5 minus the CHANGELOG.md exemption) +
// 5 examples + 1 kit README.
export const PUBLIC_DOCS_SCAN_COUNT = 10;
// ---------------------------------------------------------------------------
// The check.
// ---------------------------------------------------------------------------
function runAll() {
    process.stdout.write("\n[check_public_docs_vocabulary] public documents carry no retired grugops vocabulary (AUDIT-02 / D-09)\n");
    for (const refusal of DERIVATION_REFUSALS) {
        fail(`public-docs scan derivation refused: ${refusal}`);
    }
    // VACUITY FLOOR, WRITTEN OVER THE DERIVED QUANTITY PER PART — never over the concatenated total.
    // The `kitReadme` part is a named literal and always contributes exactly one member, so a floor
    // over the total could NEVER be reached: root and examples could both empty out and the total
    // would still be 1. A floor written over the wrong quantity is worse than no floor, because the
    // phase counts it as present while it can never run (the correction recorded in
    // check-foundation-guards.ts's adapter-body floor).
    for (const part of PUBLIC_DOCS_SCAN_PARTS) {
        if (part.members.length === 0) {
            fail(`the "${part.name}" part of the public-docs scan set derived ZERO members — refusing to ` +
                `report a verdict over a part that contributes nothing, because a vacuous scan set ` +
                `passes every guard. This floor is per-part on purpose: the kitReadme part always ` +
                `contributes one named literal, so a floor over the concatenated total could never be ` +
                `reached`);
        }
    }
    const scan = publicDocsScan();
    // TWO-SIDED PIN. The derived membership must equal PUBLIC_DOCS_SCAN_COUNT exactly — a set that
    // silently SHRANK reports a clean pass over the documents it stopped reading, and a set that
    // silently GREW is a scan nobody reviewed. The message names both numbers and what the author
    // must walk before moving the pin.
    if (scan.length !== PUBLIC_DOCS_SCAN_COUNT) {
        fail(`the public-docs scan set derived ${scan.length} document(s), expected exactly ` +
            `${PUBLIC_DOCS_SCAN_COUNT} (${PUBLIC_DOCS_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}) ` +
            `— walk every part's derivation and the PUBLIC_DOCS_EXEMPT reasons BEFORE updating ` +
            `PUBLIC_DOCS_SCAN_COUNT in scripts/check-public-docs-vocabulary.ts. A new public document ` +
            `is supposed to enter this scan by existing; moving the pin is how you acknowledge that it ` +
            `did, not how you make the failure go away`);
    }
    // The greps. Every literal comes from scripts/dead-vocabulary.ts; nothing here is declared local.
    // Counts are re-derived at run time and summed, so the total the gate reports is arithmetic over
    // what it actually read rather than a constant.
    let totalHits = 0;
    const filesWithHits = new Set();
    const report = (literal, kind, hits) => {
        totalHits += hits.length;
        for (const hit of hits) {
            filesWithHits.add(hit.slice(0, hit.indexOf(":")));
            fail(`retired ${kind} form "${literal}" survives in a public document — ${hit}\n` +
                `        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the ` +
                `shared verified context replaced the relay. This text describes an architecture that ` +
                `does not ship. Re-narrate the passage onto the shared-verified-context flow; do not ` +
                `swap the path`);
        }
    };
    for (const literal of RETIRED_PATH_FORMS) {
        report(literal, "path", grepSubstring(scan, literal));
    }
    for (const literal of RETIRED_PROSE_FORMS) {
        report(literal, "prose", grepSubstringInsensitive(scan, literal));
    }
    if (totalHits > 0) {
        fail(`AUDIT-02 drift total: ${totalHits} hit(s) across ${filesWithHits.size} of the ${scan.length} ` +
            `public document(s) scanned, from ${RETIRED_PATH_FORMS.length} retired path form(s) and ` +
            `${RETIRED_PROSE_FORMS.length} retired prose form(s) read from scripts/dead-vocabulary.ts`);
    }
    if (FAILS === 0) {
        // A PASS line must never state a check that was not performed: every number below is read from
        // the run that just happened, and the exemption is reported inline with its reason so a reader
        // meets it here rather than inferring it from a file's absence.
        pass(`AUDIT-02: ${scan.length} public document(s) carry zero retired vocabulary — ` +
            `${PUBLIC_DOCS_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}; ` +
            `${PUBLIC_DOCS_EXEMPT.length} exempted by name (${PUBLIC_DOCS_EXEMPT.join(", ")} — Keep a ` +
            `Changelog historical record; its retired vocabulary describes what the project used to ` +
            `ship, which is what a changelog is for); ${RETIRED_PATH_FORMS.length} retired path form(s) ` +
            `and ${RETIRED_PROSE_FORMS.length} retired prose form(s) checked, both read whole from ` +
            `scripts/dead-vocabulary.ts`);
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
// `node scripts/check-public-docs-vocabulary.js` run ZERO checks and exit 0, a fabricated green.
// The guard is also what lets the test file IMPORT this module for its exported pins without the
// import running the check and calling process.exit inside the vitest worker.
const isEntry = process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
    runAll();
}
