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
import {
  RETIRED_PATH_FORMS,
  RETIRED_PROSE_FORMS,
} from "./dead-vocabulary.js";
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

const abs = (rel: string): string => join(ROOT, rel);
const readText = (rel: string): string => readFileSync(abs(rel), "utf8");

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};

// Exported accessor so a later aggregator can fold this gate's verdict without reaching for a
// shared global (the check-uat-oracles precedent).
export const publicDocsVocabularyFails = (): number => FAILS;

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
// THE BOUND: the exemption forgoes THE RETIRED-VOCABULARY CHECK for this ONE named file, and that
// is the whole of what it does. It does not exempt any other root document. It does not exempt
// CHANGELOG.md from `check-banned-claims.ts`, which consumes `publicDocsCorpus()` — the
// PRE-exemption derivation below — and therefore DOES scan this file for conformance, token-economy
// and comprehension-benefit claims. Any future consumer must call the function whose NAME matches
// the question it is asking: `publicDocsCorpus()` for "which documents are public",
// `publicDocsScan()` for "which public documents does the retired-vocabulary check apply to".
//
// THIS PARAGRAPH ASSERTED THE OPPOSITE UNTIL ROUND 6, AND THE RECORD IS KEPT BECAUSE A CORRECTED
// PARAGRAPH WITH NO RECORD OF ITS CORRECTION TEACHES NOTHING. It read "it does not exempt
// CHANGELOG.md from any other gate" while `check-banned-claims.ts` imported `publicDocsScan()` and
// inherited this very subtraction — so the sentence was falsified by the import graph the day it
// was written. It was live-false with two occurrences: `CHANGELOG.md:30` carried `token economy`
// and `:68` carried `token-economy`, both members of that gate's `token-economy` group, both
// unscanned. A planted conformance claim in CHANGELOG.md exited 0 with the file never named, while
// the identical bytes in README.md exited 1 and were named twice.
//
// AND THE DISCRIMINATION IS HELD BY ASSERTIONS RATHER THAN BY THIS PARAGRAPH, which is the lesson
// the correction cost. A case in scripts/check-public-docs-vocabulary.test.ts plants the SAME string
// in CHANGELOG.md and in a second root document inside one mirror and asserts the vocabulary gate
// names the second and not the first; a second case there pins the corpus/scan relationship
// two-sided, so neither derivation can silently collapse into the other; and a case in
// scripts/check-banned-claims.test.ts plants a banned literal in CHANGELOG.md and asserts THAT gate
// names it at file:line:column. Prose cannot be false in a way a build notices. These can.
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
export const PUBLIC_DOCS_EXEMPT: readonly string[] = ["CHANGELOG.md"];

// Refusals raised while DERIVING the scan set (an unreadable root, a walk that blew its budget).
// They are collected rather than thrown because this is a GATE and not a library: kit-model throws
// on the same conditions because a truncated member set silently passes every downstream consumer,
// while a gate's own floor is to REPORT — the throw-versus-report split documented at
// scripts/kit-model.ts around the walk bound and its install/kit-source.ts twin.
const DERIVATION_REFUSALS: string[] = [];

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

// grep -rn over a scan set for a fixed substring: return `path:lineno:line` hits (1-based).
function grepSubstring(scan: readonly string[], needle: string): string[] {
  const hits: string[] = [];
  for (const file of scan) {
    const lines = readText(file).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(needle)) hits.push(`${file}:${i + 1}:${lines[i]}`);
    }
  }
  return hits;
}

// The same grep, case-INSENSITIVE on BOTH sides. A re-capitalised retired phrase is the same
// retired phrase. The reported line is the ORIGINAL, so the hit is quotable.
//
// THE NEEDLE IS LOWERCASED HERE, NOT ASSUMED LOWERCASE UPSTREAM (28-REVIEW WR-06). This function
// lowercased the SUBJECT and compared it against the needle as given, which is only correct while
// every member of RETIRED_PROSE_FORMS happens to be lowercase. That invariant is documented in a
// comment in dead-vocabulary.ts and was enforced nowhere: adding `"Handoff Packet"` to that array
// would have made this gate match ZERO lines, forever, silently — a live consumer of a single-source
// list whose enforcement quietly becomes a no-op. The `expect(RETIRED_PROSE_FORMS).toEqual([…])`
// freeze in the test file is a guard on the DATA, and the data freeze is exactly what an editor
// updates when adding a literal.
//
// The sibling consumer audit-prepass.ts builds its regex with the `i` flag and never had this
// hazard, so the two consumers of one list disagreed about case. They no longer do: the invariant is
// enforced at the point of use rather than assumed upstream.
//
// EXPORTED so the case invariant is asserted on the CONSUMER rather than only on the data. A test
// that could only drive this through RETIRED_PROSE_FORMS would have to mutate the frozen list to
// exercise the hazard, which is the one thing the D-10 control exists to prevent.
export function grepSubstringInsensitive(
  scan: readonly string[],
  needle: string,
): string[] {
  const lowered = needle.toLowerCase();
  const hits: string[] = [];
  for (const file of scan) {
    const lines = readText(file).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowered)) {
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

// Part `root`: every markdown file directly in the repository root. UNFILTERED — the
// PUBLIC_DOCS_EXEMPT subtraction used to be the last step of this function and is now applied at
// exactly one place further down, where the two questions are separated (round 6 / CR-01).
function rootMarkdown(): string[] {
  let entries: string[];
  try {
    entries = readdirSync(ROOT);
  } catch {
    DERIVATION_REFUSALS.push(
      `cannot read the repository root ${ROOT} — refusing to report a verdict over a root part ` +
        `derived from an unreadable directory`,
    );
    return [];
  }
  return entries
    .filter((f) => f.endsWith(MARKDOWN_EXT))
    .filter((f) => {
      try {
        return statSync(join(ROOT, f)).isFile();
      } catch {
        // A vanished/unstattable entry between the readdir and the stat is a race, not a member.
        return false;
      }
    })
    .sort();
}

// Part `examples`: the worked examples, taken as a DIRECTORY entry so membership self-derives
// through walkFiles() with no import and no name written down. A sixth example enters by existing.
function examplesMarkdown(): string[] {
  const acc: string[] = [];
  const refusal = walkFiles(EXAMPLES_DIR, { examined: 0 }, acc);
  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
  return acc.filter((f) => f.endsWith(MARKDOWN_EXT));
}

// Part `kitReadme`: one named literal. agent-factory/README.md is the start-here guide
// install/install.ts copies into every host repo, and it is deliberately absent from
// check-kit-refs's SCAN. It is a single file rather than a set, so it stays a literal.
//
// IT IS STILL DERIVED AGAINST THE DISK (28-REVIEW WR-01). The part used to be the bare literal
// `[KIT_README]`, and grepSubstring calls readText() unguarded — so deleting agent-factory/README.md
// made this gate die with an unhandled ENOENT and a full Node stack trace instead of reporting a
// verdict. That is against the throw-versus-report split this module's own header records
// ("kit-model throws… while a gate's own floor is to REPORT"), and check-audit-register.test.ts:371
// asserts a sibling gate never emits a `node:internal` frame.
//
// It also closes a second hole. The per-part vacuity floor below can STRUCTURALLY never fire for a
// literal part — a one-element array is always length 1 — so the crash was the only way this gate
// could notice the file was gone. Returning [] on an absent file makes that floor reachable for this
// part for the first time, and the named refusal names the file.
function kitReadmeMembers(): string[] {
  if (!existsSync(abs(KIT_README))) {
    DERIVATION_REFUSALS.push(
      `${KIT_README} is a NAMED member of the public-docs scan set and does not exist at ` +
        `${abs(KIT_README)} — refusing to report a verdict over a part whose one member could not ` +
        `be read. A missing document is not a clean one`,
    );
    return [];
  }
  return [KIT_README];
}

// ---------------------------------------------------------------------------
// ONE DERIVATION, TWO QUESTIONS, AND THE SUBTRACTION AT EXACTLY ONE PLACE (round 6 / CR-01).
//
// THIS IS THE ONLY HAND-AUTHORED PARTS ARRAY IN THIS MODULE. It is the CORPUS's parts: every
// derived public document, BEFORE any per-gate exemption. The scan's parts below are a derived
// VIEW of this array and never a second one, because two parts arrays over one corpus is how two
// scan sets come to disagree about what a public document is.
//
// WHY TWO QUESTIONS EXIST AT ALL, STATED HERE BECAUSE A CONSUMER TAKING THE WRONG ONE IS A SHIPPED
// DEFECT AND NOT A HYPOTHETICAL. Until round 6 this module exported ONE function, `publicDocsScan`,
// and it answered "which public documents does the RETIRED-VOCABULARY check apply to" while its
// name read as "which documents are public". `check-banned-claims.ts` imported it wanting the
// second question — with an explicit and correct argument that re-deriving root markdown there
// would be a second membership rule over one corpus — and silently inherited a subtraction argued
// for a different predicate. CHANGELOG.md therefore sat outside the banned-claim scan set with two
// live `token-economy` occurrences in it, while the identical bytes in README.md went red. A
// consumer must now NAME which question it is asking, and the two names differ.
// ---------------------------------------------------------------------------
export const PUBLIC_DOCS_CORPUS_PARTS: readonly {
  name: "root" | "examples" | "kitReadme";
  members: readonly string[];
}[] = [
  { name: "root", members: rootMarkdown() },
  { name: "examples", members: examplesMarkdown() },
  { name: "kitReadme", members: kitReadmeMembers() },
];

/**
 * QUESTION ONE: **which documents are public?**
 *
 * Every derived public document, in part order, with NO per-gate exemption applied. This is what a
 * consumer wants when its own predicate has nothing to do with retired vocabulary — a conformance
 * claim, a token-economy claim or a comprehension-benefit claim is just as wrong in a changelog as
 * anywhere else, and the reason CHANGELOG.md is exempt from the vocabulary check ("its retired
 * vocabulary describes what the project used to ship") has no bearing on any of them.
 *
 * `check-banned-claims.ts` consumes THIS function. If a future consumer takes `publicDocsScan()`
 * instead, it inherits an exemption argued for a predicate it does not run — which is exactly the
 * CR-01 defect, and is why both functions exist rather than one.
 */
export function publicDocsCorpus(): string[] {
  return PUBLIC_DOCS_CORPUS_PARTS.flatMap((p) => [...p.members]);
}

// The SCAN's parts: the SAME parts as the corpus, each minus PUBLIC_DOCS_EXEMPT.
//
// THE SUBTRACTION LIVES HERE, AND NOWHERE ELSE. It is applied per part rather than to the
// concatenation because this gate's PASS line and its two-sided pin both report a per-part
// breakdown, and a subtraction applied only to the concatenation would print a breakdown whose sum
// disagreed with the total standing next to it.
export const PUBLIC_DOCS_SCAN_PARTS: readonly {
  name: "root" | "examples" | "kitReadme";
  members: readonly string[];
}[] = PUBLIC_DOCS_CORPUS_PARTS.map((p) => ({
  name: p.name,
  members: p.members.filter((m) => !PUBLIC_DOCS_EXEMPT.includes(m)),
}));

/**
 * QUESTION TWO: **which public documents does the RETIRED-VOCABULARY check apply to?**
 *
 * The corpus minus PUBLIC_DOCS_EXEMPT — this gate's own scan set, and only this gate's. Exported so
 * a consumer partitions this set by the SAME parts it was built from rather than restating a
 * directory literal.
 */
export function publicDocsScan(): string[] {
  return PUBLIC_DOCS_SCAN_PARTS.flatMap((p) => [...p.members]);
}

// The pinned cardinality OF THE SCAN. 10 today: 4 root markdown files (5 in the corpus, minus the
// CHANGELOG.md exemption) + 5 examples + 1 kit README.
//
// THE CORPUS CARRIES NO SECOND PIN, AND THAT IS ARITHMETIC RATHER THAN AN OVERSIGHT. The corpus and
// the scan differ by exactly PUBLIC_DOCS_EXEMPT, which is a frozen one-member array: a corpus that
// grew by a NON-exempt document grows the scan and trips this pin, and a corpus that grew by an
// exempt one is impossible without editing that array, which its own D-10-style freeze case refuses.
// The corpus is additionally pinned from the other side by BANNED_CLAIM_SCAN_COUNT, which is
// two-sided over a union this corpus is half of. A third pin would be a number to maintain, not a
// question nobody is asking.
export const PUBLIC_DOCS_SCAN_COUNT = 10;

// ---------------------------------------------------------------------------
// The check.
// ---------------------------------------------------------------------------
function runAll(): void {
  process.stdout.write(
    "\n[check_public_docs_vocabulary] public documents carry no retired grugops vocabulary (AUDIT-02 / D-09)\n",
  );

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
      fail(
        `the "${part.name}" part of the public-docs scan set derived ZERO members — refusing to ` +
          `report a verdict over a part that contributes nothing, because a vacuous scan set ` +
          `passes every guard. This floor is per-part on purpose: the kitReadme part always ` +
          `contributes one named literal, so a floor over the concatenated total could never be ` +
          `reached`,
      );
    }
  }

  const scan = publicDocsScan();

  // TWO-SIDED PIN. The derived membership must equal PUBLIC_DOCS_SCAN_COUNT exactly — a set that
  // silently SHRANK reports a clean pass over the documents it stopped reading, and a set that
  // silently GREW is a scan nobody reviewed. The message names both numbers and what the author
  // must walk before moving the pin.
  if (scan.length !== PUBLIC_DOCS_SCAN_COUNT) {
    fail(
      `the public-docs scan set derived ${scan.length} document(s), expected exactly ` +
        `${PUBLIC_DOCS_SCAN_COUNT} (${PUBLIC_DOCS_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}) ` +
        `— walk every part's derivation and the PUBLIC_DOCS_EXEMPT reasons BEFORE updating ` +
        `PUBLIC_DOCS_SCAN_COUNT in scripts/check-public-docs-vocabulary.ts. A new public document ` +
        `is supposed to enter this scan by existing; moving the pin is how you acknowledge that it ` +
        `did, not how you make the failure go away`,
    );
  }

  // The greps. Every literal comes from scripts/dead-vocabulary.ts; nothing here is declared local.
  // Counts are re-derived at run time and summed, so the total the gate reports is arithmetic over
  // what it actually read rather than a constant.
  let totalHits = 0;
  const filesWithHits = new Set<string>();

  const report = (
    literal: string,
    kind: "path" | "prose",
    hits: string[],
  ): void => {
    totalHits += hits.length;
    for (const hit of hits) {
      filesWithHits.add(hit.slice(0, hit.indexOf(":")));
      fail(
        `retired ${kind} form "${literal}" survives in a public document — ${hit}\n` +
          `        Remedy: the seventeen static handoff templates were deleted in Phase 24 and the ` +
          `shared verified context replaced the relay. This text describes an architecture that ` +
          `does not ship. Re-narrate the passage onto the shared-verified-context flow; do not ` +
          `swap the path`,
      );
    }
  };

  for (const literal of RETIRED_PATH_FORMS) {
    report(literal, "path", grepSubstring(scan, literal));
  }
  for (const literal of RETIRED_PROSE_FORMS) {
    report(literal, "prose", grepSubstringInsensitive(scan, literal));
  }

  if (totalHits > 0) {
    fail(
      `AUDIT-02 drift total: ${totalHits} hit(s) across ${filesWithHits.size} of the ${scan.length} ` +
        `public document(s) scanned, from ${RETIRED_PATH_FORMS.length} retired path form(s) and ` +
        `${RETIRED_PROSE_FORMS.length} retired prose form(s) read from scripts/dead-vocabulary.ts`,
    );
  }

  if (FAILS === 0) {
    // A PASS line must never state a check that was not performed: every number below is read from
    // the run that just happened, and the exemption is reported inline with its reason so a reader
    // meets it here rather than inferring it from a file's absence.
    pass(
      `AUDIT-02: ${scan.length} public document(s) carry zero retired vocabulary — ` +
        `${PUBLIC_DOCS_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}; ` +
        `${PUBLIC_DOCS_EXEMPT.length} exempted by name (${PUBLIC_DOCS_EXEMPT.join(", ")} — Keep a ` +
        `Changelog historical record; its retired vocabulary describes what the project used to ` +
        `ship, which is what a changelog is for); ${RETIRED_PATH_FORMS.length} retired path form(s) ` +
        `and ${RETIRED_PROSE_FORMS.length} retired prose form(s) checked, both read whole from ` +
        `scripts/dead-vocabulary.ts`,
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
// `node scripts/check-public-docs-vocabulary.js` run ZERO checks and exit 0, a fabricated green.
// The guard is also what lets the test file IMPORT this module for its exported pins without the
// import running the check and calling process.exit inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
