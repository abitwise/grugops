// check-claim-anchors.ts — the D-16 anchor↔row bijection and verbatim-at-anchor gate (AUDIT-03).
//
//   node scripts/check-claim-anchors.js
//     exit 0 — every registered claim is anchored, every anchor is registered, and every claim's
//              text is byte-identical to the lines at its anchor.
//     exit 1 — one or more of those is false. Every failure names the claim id and the file.
//
// Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a build-safety surface).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS GATE EXISTS.
//
// docs/audit/28-claim-registry.md maps every public claim to the safety floor whose lowering would
// falsify it. Its only consumer is Phase 30's claim-dropping, which voids claims BY ID. Between
// this registry and that consumer sits PHASE 29, which rewrites prose for a living. Without a
// mechanism, Phase 29 silently invalidates the registry Phase 30 depends on: the rows keep parsing,
// the ids keep resolving, and every one of them points at a sentence that has moved or changed.
// Nothing goes red, and the failure surfaces two phases later as a claim voided against text that
// no longer says it.
//
// The bijection plus the verbatim comparison is what survives that rewrite.
//
// ---------------------------------------------------------------------------------------------
// RECORDED RESIDUAL, NOT CLAIMED AWAY (`UNKNOWN - verify`).
//
// A BRAND-NEW CLAIM WRITTEN WITHOUT AN ANCHOR IS NOT MECHANICALLY DETECTABLE. No grep recognizes
// an assertive sentence — the difference between "the installer is idempotent" and "the installer
// feels tidy" is semantic, and a matcher that tried to separate them would either miss claims or
// bury its reader in prose. So be precise about what a green run here means:
//
//   THIS GATE PROVES that registered claims have not moved and that their text has not changed.
//   IT DOES NOT PROVE that no unregistered claim exists.
//
// A Phase 29 rewrite that ADDS a new absolute to README.md passes this gate green. The registry
// states the same residual in its own prose (`## What this registry does not catch (D-16)`) rather
// than letting a green run imply otherwise.
//
// ---------------------------------------------------------------------------------------------
// THE COMMENT-STRIPPING COLLISION, RESOLVED EXPLICITLY.
//
// scripts/check-foundation-guards.ts declares stripHtmlComments() so that a commented-out copy of a
// required or forbidden string cannot stand in for LIVE text in guardAdapterBody. Every HTML
// comment that helper meets is text hiding from a reader, and deleting it is the point.
//
// The claim anchors are the OPPOSITE CASE, and the first of their kind in this repository: they do
// not hide text, they NAME the lines beneath them, and they are this gate's ENTIRE INPUT. So this
// module reads RAW BYTES and never calls stripHtmlComments — or any other normalizing transform —
// before it scans or compares. Stripping here would delete the input and then pass green over a
// document with no anchors left in it, which is a fail-open wearing the shape of a clean run. A
// note beside that helper's declaration records the same boundary from the other side, and a case
// in this module's test file asserts that the three anchored documents are absent from
// spawnGrantScan() — the scan the helper actually feeds.
//
// THE COMPARISON IS EXACT. No trimming, no whitespace collapse, no line-ending rewrite, no case
// folding. A legitimate divergence is answered by a NAMED EXEMPTION, never by loosening the
// comparison — the stance guardDistributionPair already takes with DISTRIBUTION_PAIR_EXEMPT.
// ---------------------------------------------------------------------------------------------

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// (Plan 29-51) THIS GATE DECLARES NO ANCHOR GRAMMAR, NO LINE ASSEMBLY AND NO BYTE COMPARISON.
//
// All four used to be declared here. Plan 29-52 needs the same question answered — "is this line
// inside a registry-anchored block whose bytes did not diverge" — from scripts/check-banned-claims.ts,
// and there were only three ways to give it one: import from this gate, copy the declarations, or
// move them. Importing from a gate carries a REFUSAL CHANNEL along with the value (the WR-05 hazard
// recorded at scripts/check-banned-claims.ts:130-146, which plan 29-49 spent a plan closing one seam
// over). Copying would give this repository a SECOND GRAMMAR OVER THE SAME BYTES, which is the
// LANG-07 defect this milestone has closed three times at eight rounds each. So they MOVED, into the
// library both gates already trust for the registry, and this module now asks rather than declares.
//
// The library THROWS and this gate REPORTS — the kit-model split, unchanged. That is precisely why
// the authority is a library and not a third gate: nothing that imports it inherits an exit code.
import {
  readRegistry,
  isBlank,
  SAFETY_FLOORS,
  DISPOSITIONS,
  MARKDOWN_SUFFIX,
  anchoredDocs,
  scanAnchoredDocument,
  anchoredBlockAt,
  type ClaimRow,
  type AnchorHit,
  type AnchoredDocumentScan,
} from "./audit-model.js";

// CHECK_ROOT override is load-bearing: the Vitest harness plants fixtures into a hermetic mirror
// and points CHECK_ROOT at it, then spawns this committed .js against that mirror. When unset,
// resolve against the script-relative repo root (cwd does not matter).
//
// THE TRUTHINESS TERNARY, NOT `??` (28-REVIEW WR-05). Every sibling gate in this phase uses the
// ternary; this file used `??`, and the two differ on exactly one input: `CHECK_ROOT=""` degrades to
// the repo root everywhere else and resolved every path against the process CWD here.
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};

/** Exported accessor so a later aggregator can fold this gate's result without a shared global. */
export const claimAnchorFails = (): number => FAILS;

function main(): void {
  process.stdout.write(
    "[check_claim_anchors] every registered claim is anchored, and its text is unchanged at its anchor (AUDIT-03 / D-16)\n",
  );

  let claims: readonly ClaimRow[];
  // (Plan 29-28; D-08 / AP-1) THE PARSE'S DENOMINATOR, CARRIED TO THE PASS LINE. `claims` is a
  // projection of the claim-heading-shaped lines that survived the fence filter, so a PASS stating
  // only how many rows were parsed states a numerator with no denominator. This gate already
  // published a claim tally, which is why the two numbers are reported HERE and not bolted onto a
  // gate this plan does not own.
  let headingShaped = 0;
  let headingShapedFenced = 0;
  try {
    const registry = readRegistry(ROOT);
    claims = registry.claims;
    headingShaped = registry.headingShapedLines;
    headingShapedFenced = registry.headingShapedFenced;
  } catch (e) {
    // The library throws; this gate REPORTS, so an unparseable registry produces a verdict rather
    // than a stack trace (the kit-model throw-versus-report split).
    fail(
      `the claim registry could not be parsed, so NO check below was performed — ${(e as Error).message}`,
    );
    verdict();
    return;
  }

  const docs = anchoredDocs(claims);
  const unanchorable = claims.filter((c) => !c.file.endsWith(MARKDOWN_SUFFIX));

  if (docs.length === 0) {
    // Refused rather than passed over. A registry with no markdown rows satisfies the bijection
    // vacuously — zero anchors equal zero rows, perfectly — while proving nothing at all.
    fail(
      `the registry names no markdown document, so there is zero markdown surface to check. A ` +
        `vacuous bijection is not a passing one: zero anchors and zero rows agree trivially. ` +
        `${claims.length} row(s) parsed, of which ${unanchorable.length} name a non-markdown file`,
    );
    verdict();
    return;
  }

  // ── The anchors, read as RAW BYTES, THROUGH THE ONE AUTHORITY ─────────────────────────────
  //
  // (Plan 29-51.) The scan is `audit-model.scanAnchoredDocument`, and its RETURNED line array is
  // kept per document rather than re-derived below. This module used to split each anchored document
  // TWICE — once here for the anchors and once again for the verbatim comparison — which is two
  // assemblies of one document and the coordinate-shear axis every such defect in this phase came
  // from. Keeping the scan deletes the axis instead of guarding it, and it also leaves exactly ONE
  // read per document.
  const scans = new Map<string, AnchoredDocumentScan>();
  const anchorsPerDoc = new Map<string, readonly AnchorHit[]>();
  const idToFiles = new Map<string, string[]>();

  for (const doc of docs) {
    const abs = join(ROOT, doc);
    if (!existsSync(abs)) {
      fail(
        `the registry names \`${doc}\`, which does not exist at ${abs}. A missing document is not ` +
          `an unanchored one: reporting zero anchors for it would let its rows read as merely missing`,
      );
      continue;
    }
    const scan = scanAnchoredDocument(readFileSync(abs, "utf8"));
    scans.set(doc, scan);
    for (const anchor of scan.anchors) {
      const files = idToFiles.get(anchor.id) ?? [];
      files.push(doc);
      idToFiles.set(anchor.id, files);
    }
    // The attempts arrive in document order, so these refusals print in the same order they printed
    // when the two were interleaved in one loop.
    for (const attempt of scan.attempts) {
      fail(
        `${doc}:${attempt.index + 1} carries a line that reads as a claim anchor but is outside the canonical ` +
          `form \`<!-- claim: C-28-NNN -->\` (three zero-padded digits, nothing else on the line). ` +
          `The line reads: ${JSON.stringify(attempt.text)}. It is refused by name rather than ignored ` +
          `— an ignored near-anchor silently drops its claim out of the bijection`,
      );
    }
    anchorsPerDoc.set(doc, scan.anchors);
  }

  // ── Duplicate ids, BEFORE the bijection ───────────────────────────────────────────────────
  // Two anchors sharing an id make every set operation below ambiguous, so the ambiguity is named
  // first rather than reported as some downstream mismatch.
  const duplicated = [...idToFiles.entries()]
    .filter(([, files]) => files.length > 1)
    .sort(([a], [b]) => (a < b ? -1 : 1));
  for (const [id, files] of duplicated) {
    fail(
      `duplicate anchor id: ${id} is anchored ${files.length} times — in ` +
        `${files.slice().sort().join(", ")}. An ` +
        `anchor id is what a registry row points at, so two anchors sharing one make the D-16 ` +
        `bijection unresolvable and let one location's text stand in for another's`,
    );
  }

  // ── The bijection, SET equality in BOTH directions, per document ──────────────────────────
  // Set equality is order-independent by construction, so no two anchors ever need to compare and
  // the ORDERING probe edge is answered by the shape rather than by a sort of the inputs. The
  // REPORT is sorted by id so two runs over one tree produce byte-identical output.
  for (const doc of docs) {
    const expected = claims
      .filter((c) => c.file === doc)
      .map((c) => c.id)
      .sort();
    const found = (anchorsPerDoc.get(doc) ?? []).map((a) => a.id).sort();
    const missing = expected.filter((id) => !found.includes(id));
    const unexpected = found.filter((id) => !expected.includes(id));
    if (missing.length > 0 || unexpected.length > 0) {
      fail(
        `the anchor↔row bijection does not hold for ${doc} — missing [${missing.join(", ")}], ` +
          `unexpected [${unexpected.join(", ")}]. \`missing\` is a registry row with no anchor in ` +
          `the document it names; \`unexpected\` is an anchor with no row. Both are red, because ` +
          `the registry is only worth Phase 30's trust if the two sides are the same set`,
      );
    }
  }

  // ── The verbatim comparison, EXACT BYTES, THROUGH THE ONE AUTHORITY ───────────────────────
  //
  // (Plan 29-51.) The extent arithmetic and the Buffer equality that used to sit inline here are
  // `audit-model.anchoredBlockAt`. It returns the extent, the overrun flag and the byte verdict
  // TOGETHER, from one derivation, so a block's boundary and the comparison over it can never come
  // from two rules — and so plan 29-52 cannot obtain "this line is inside an anchored block" without
  // also being handed "and its bytes did not diverge". Every refusal below is byte-unchanged; only
  // where its numbers come from has moved.
  let comparisons = 0;
  for (const doc of docs) {
    const scan = scans.get(doc);
    if (scan === undefined) continue; // the document is missing; already reported above
    const anchors = new Map((anchorsPerDoc.get(doc) ?? []).map((a) => [a.id, a]));
    for (const claim of claims.filter((c) => c.file === doc).slice().sort((a, b) => (a.id < b.id ? -1 : 1))) {
      const anchor = anchors.get(claim.id);
      if (anchor === undefined) continue; // already reported by the bijection above
      let block;
      try {
        block = anchoredBlockAt(scan, anchor, claim.verbatim);
      } catch (e) {
        // THE LIBRARY THROWS AND THIS GATE REPORTS — the same split the unparseable-registry catch
        // above applies, extended to the authority's element-level refusal.
        //
        // REACHABILITY, STATED PLAINLY RATHER THAN IMPLIED: zero on any path through readRegistry().
        // The only throw `anchoredBlockAt` raises is its blank-verbatim refusal, and parseClaimBlock
        // refuses a blank verbatim at PARSE time through the SAME `isBlank` predicate, so the parse
        // refusal strictly dominates and is the single authority for that refusal on this path. This
        // arm is a CONTRACT GUARD for the day that changes — RED-proven by deleting parseClaimBlock's
        // refusal in a scratch build, where without it this gate died with a node stack trace and no
        // verdict at all.
        fail(
          `${doc}: ${claim.id}'s anchored block could not be compared — ${(e as Error).message}`,
        );
        continue;
      }
      if (block.overruns) {
        // Both forms of "there is nothing below this anchor to read": the anchor is the last line
        // of the file, or the claim is longer than the lines remaining. Named rather than read
        // past the end, which would compare against an undefined element.
        fail(
          `${doc}: the anchor for ${claim.id} sits at line ${block.anchorIndex + 1} and its claim needs ` +
            `${block.verbatimLineCount} line(s) below it, but the file ends at line ${scan.contentLineCount}. An anchor ` +
            `on the last line of a file has no claim beneath it, and reading past the end would ` +
            `compare against nothing at all`,
        );
        continue;
      }
      comparisons += 1;
      if (!block.matches) {
        fail(
          `${doc}: the text at ${claim.id}'s anchor (line ${block.start + 1}) is not byte-identical to the ` +
            `registry's verbatim block.\n` +
            `        registry (${block.verbatimBytes} byte(s)): ${JSON.stringify(claim.verbatim)}\n` +
            `        document (${block.documentBytes} byte(s)): ${JSON.stringify(block.text)}\n` +
            `        The comparison is EXACT — no trimming, no whitespace collapse, no line-ending ` +
            `rewrite. If this divergence is legitimate, update the registry row in the SAME commit ` +
            `as the prose change; the answer is never to loosen the comparison`,
        );
      }
    }
  }

  // ── The unanchorable rows: PRESENCE-checked, since they cannot be POSITION-checked ─────────
  //
  // 28-REVIEW WR-08. `anchoredDocs()` filters to `.md`, and an unanchorable row used to be merely
  // COUNTED in the PASS line — exempt from ALL verification, not only from the anchor bijection. The
  // stated reason for the exclusion ("a JSON file cannot carry an HTML comment") justifies dropping
  // the ANCHOR requirement; it does not justify dropping the VERBATIM requirement, which needs no
  // anchor at all.
  //
  // It matters on the one row that has it: C-28-038 names `.claude-plugin/plugin.json`, whose
  // `description` this very phase rewrote by hand, and whose registry prose says outright that "a
  // future rewrite of README.md:4 that forgets the manifest will still pass every gate in this
  // repository green". That residual is now smaller by exactly the mechanical half: the position
  // cannot be checked, and the PRESENCE can.
  //
  // The comparison is on BYTES, via Buffer.includes, so it inherits the exactness of the anchored
  // comparison above — no trimming, no whitespace collapse, no line-ending rewrite.
  for (const claim of unanchorable.slice().sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const target = join(ROOT, claim.file);
    if (!existsSync(target)) {
      fail(
        `${claim.id} names \`${claim.file}\`, which does not exist at ${target}. A missing file is ` +
          `not an unanchorable one`,
      );
      continue;
    }
    const bytes = readFileSync(target);
    comparisons += 1;
    if (!bytes.includes(Buffer.from(claim.verbatim, "utf8"))) {
      fail(
        `${claim.file}: ${claim.id}'s verbatim text is not present in the file. An unanchorable row ` +
          `cannot be POSITION-checked, but it CAN be PRESENCE-checked, and presence is what Phase ` +
          `30 needs before it voids the claim by id.\n` +
          `        registry (${Buffer.byteLength(claim.verbatim, "utf8")} byte(s)): ` +
          `${JSON.stringify(claim.verbatim)}\n` +
          `        The comparison is EXACT. If this divergence is legitimate, update the registry ` +
          `row in the SAME commit as the file change`,
      );
    }
  }

  // ── D-17: every status was MEASURED, and every non-true one was DECIDED ────────────────────
  for (const claim of claims) {
    // The blank predicate is audit-model.isBlank's closed set, ASKED rather than re-derived
    // (28-REVIEW CR-04). This line was one of three disagreeing definitions of "blank" inside one
    // phase; there is now one, and a fourth cannot be added by accident because the two other call
    // sites import the same function.
    if (isBlank(claim.mechanism)) {
      fail(
        `${claim.id} carries no \`mechanism\`. D-17 measures every claim against a named mechanism, ` +
          `so a status with none is a verdict nobody reached — the same act class as recording a ` +
          `test result that was never run`,
      );
    }
    if (claim.status === "true") continue;
    if (!DISPOSITIONS.includes(claim.disposition as (typeof DISPOSITIONS)[number])) {
      fail(
        `${claim.id} is \`${claim.status}\` and carries \`disposition\` "${claim.disposition}", ` +
          `which is outside the legal set [${DISPOSITIONS.join(", ")}]. An overstated or false ` +
          `claim left without a disposition is one nobody decided about, and it stays standing in ` +
          `a shipped document`,
      );
    }
    if (!/^F-28-\d{3}$/.test(claim.findingId)) {
      fail(
        `${claim.id} is \`${claim.status}\` and carries \`finding_id\` "${claim.findingId}", which ` +
          `is outside the canonical form F-28-NNN. Anything not \`true\` becomes an AUDIT-01 ` +
          `finding, and a finding with no id is one no one can quote`,
      );
    }
    if (claim.disposition === "deferred" && claim.targetPhase.trim() === "") {
      fail(
        `${claim.id} is \`deferred\` with no \`target_phase\`. A deferral with no named target is ` +
          `not a decision, it is a finding leaving the registry`,
      );
    }
  }

  // ── D-14: two-sided completeness, BOTH directions refused ─────────────────────────────────
  for (const claim of claims.filter((c) => c.kind === "safety")) {
    if (claim.dependsOn.length === 0) {
      fail(
        `${claim.id} is \`kind: safety\` and its \`depends_on\` names no floor. A safety claim ` +
          `depending on nothing is either not a safety claim or is unbacked, and both are findings ` +
          `— an unbacked safety claim is exactly what Phase 30's claim-dropping cannot void`,
      );
    }
  }
  const named = new Set(claims.flatMap((c) => c.dependsOn));
  const uncovered = SAFETY_FLOORS.map((f) => f.id)
    .filter((id) => !named.has(id))
    .sort();
  if (uncovered.length > 0) {
    fail(
      `safety floor(s) [${uncovered.join(", ")}] have no claim mapped to them. This is the OTHER ` +
        `direction of D-14: a floor nobody's public claim depends on is either a floor with no ` +
        `public consequence, or a claim surface nobody registered. Both are answers worth having, ` +
        `and an empty intersection is refused here rather than passed over`,
    );
  }

  // ── The id sequence ───────────────────────────────────────────────────────────────────────
  const ids = claims.map((c) => c.id).sort();
  const gaps = ids.filter((id, i) => id !== `C-28-${String(i + 1).padStart(3, "0")}`);
  if (gaps.length > 0) {
    fail(
      `claim ids are not contiguous from C-28-001 — the first divergence is ${gaps[0]} at position ` +
        `${ids.indexOf(gaps[0]) + 1}. A gap means a row was deleted without renumbering, and a ` +
        `deleted claim id is one Phase 30 may still be holding a reference to`,
    );
  }

  if (FAILS === 0) {
    const perDoc = docs.map((d) => `${d} ${(anchorsPerDoc.get(d) ?? []).length}`).join(", ");
    pass(
      `${claims.length} registry row(s) parsed from ${headingShaped} claim-heading-shaped line(s), ` +
        `${headingShapedFenced} of them EXCLUDED as fenced documentation (the denominator: a claim ` +
        `list that shortened would be short against this number rather than against nothing) — ` +
        `${claims.length - unanchorable.length} markdown, ` +
        `${unanchorable.length} unanchorable (a non-markdown file cannot carry an HTML comment, so ` +
        `its POSITION is unheld; its verbatim text is still PRESENCE-checked against the file's ` +
        `bytes); anchors found: ${perDoc}; ${comparisons} verbatim comparison(s) performed, all ` +
        `byte-identical; all ${SAFETY_FLOORS.length} safety floor(s) mapped`,
    );
  }
  verdict();
}

function verdict(): void {
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
  }
  process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
  process.exit(1);
}

// isEntry guard (the check-uat-oracles.ts precedent): the test file imports the exported grammar
// and accessor, and without this the import would run the gate and call process.exit inside the
// vitest worker.
//
// THE COMMENT CITED A PRECEDENT THIS FILE DID NOT FOLLOW (28-REVIEW WR-05). The named precedent is
// the `pathToFileURL(process.argv[1]).href` comparison that audit-prepass.ts,
// check-audit-register.ts, check-nul-bytes.ts, check-public-docs-vocabulary.ts,
// check-uat-oracles.ts and generate-safety-surface.ts all use, each carrying its own note that the
// string form is wrong; this file used `endsWith`, so the comment described code that was not here.
// An `endsWith` test also answers a weaker question — any path ending in that filename matches,
// including one in another directory — where the URL comparison asks whether THIS module is the
// entry point.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) main();
