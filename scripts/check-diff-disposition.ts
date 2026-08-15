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
import {
  normalizeSentence,
  segmentClauses,
  CLAUSE_MIN_WORDS,
} from "./voice-model.js";
// The ONE element-level vacuity rule (Phase 29 / plan 29-01, AP-1). Folded, never restated.
import { reportMeasured, type Measured } from "./vacuity.js";
// The derivation authority for D-01 source (b). listRoles/listWorkflows THROW on an empty or missing
// directory rather than returning [], so the vacuity refusal is inherited rather than restated.
import {
  listRoles,
  listWorkflows,
  ROLE_COUNT,
  WORKFLOW_COUNT,
  ROLES_SUBPATH,
  WORKFLOWS_SUBPATH,
} from "./kit-model.js";
// D-01 source (a). The registry rows carry the verbatim anchor text, and check-claim-anchors.ts
// already performs the byte-identical comparison against the documents live and green — so this gate
// CONSUMES that freeze rather than re-deriving it. A second parser over the registry is how one
// authority becomes two.
import { readRegistry, type ClaimRow } from "./audit-model.js";
// The watched corpus is the LANG-03 exclusion list itself, taken from the one derivation that
// produces it (register rows flagged `safety_surface: yes` ∪ registry rows of `kind: safety`). The
// generated document is the RENDERING of this union; reading the rendering back would be a second
// parser over a file this function already answers for.
import { safetySurfaceUnion } from "./generate-safety-surface.js";

// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror — here a real git
// repository under the OS temp dir — and points CHECK_ROOT at it, then spawns this committed .js
// against the mirror. When unset, resolve against the script-relative repo root (cwd does not
// matter). The truthiness ternary, not `??`: an empty CHECK_ROOT degrades to the repo root here as
// it does at every sibling gate, rather than resolving every path against the process CWD.
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
export const diffDispositionFails = (): number => FAILS;

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
function git(args: readonly string[]): string {
  try {
    return execFileSync("git", [...args], {
      cwd: ROOT,
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
    }).toString("utf8");
  } catch (e) {
    throw new Error(
      `\`git ${args.join(" ")}\` failed at ${ROOT} — ${(e as Error).message}. The diff cannot be ` +
        `derived, so NO verdict is reported over it. Confirm this is being run inside a git working ` +
        `tree whose history reaches the base commit recorded in ${BASE_FILE} (on CI that means ` +
        `\`fetch-depth: 0\` on the checkout step).`,
    );
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
const DISPOSITION_NON_ROWS: readonly string[] = ["00-base.md", "README.md"];

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

export type GuardLiteralKind = "const" | "needles";

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
export const POSITIVE_GUARD_LITERAL_SITES: readonly {
  readonly guard: string;
  readonly source: string;
  readonly declaration: string;
  readonly kind: GuardLiteralKind;
}[] = [
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
function quotedLiteralAt(src: string, from: number): string | null {
  let open = from;
  while (open < src.length && /\s/.test(src[open])) open += 1;
  if (src[open] !== '"') return null;
  let i = open + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === '"') {
      try {
        return JSON.parse(src.slice(open, i + 1)) as string;
      } catch {
        return null;
      }
    }
    if (c === "\n") return null; // a literal never spans a raw newline in these declarations
    i += 1;
  }
  return null;
}

export interface PositiveGuardLiterals {
  readonly literals: readonly { literal: string; guard: string; source: string }[];
  readonly refusals: readonly string[];
}

/** Extract every positive guard literal from the guard sources that require them. */
export function derivePositiveGuardLiterals(
  root: string = ROOT,
): PositiveGuardLiterals {
  const literals: { literal: string; guard: string; source: string }[] = [];
  const refusals: string[] = [];

  for (const site of POSITIVE_GUARD_LITERAL_SITES) {
    const path = join(root, site.source);
    if (!existsSync(path)) {
      refusals.push(
        `${site.source} does not exist at ${path}, so the positive guard literal declared as ` +
          `\`${site.declaration}\` (required present by ${site.guard}) could not be read. A frozen ` +
          `source that cannot be read is not an empty one`,
      );
      continue;
    }
    const src = readFileSync(path, "utf8");
    const at = src.indexOf(`const ${site.declaration}`);
    if (at === -1) {
      refusals.push(
        `${site.source} declares no \`const ${site.declaration}\`. ${site.guard} requires that ` +
          `wording PRESENT in the kit, and this gate freezes it — a renamed or deleted declaration ` +
          `silently removes it from the frozen set, so it is refused by name instead`,
      );
      continue;
    }
    if (site.kind === "const") {
      const assign = `const ${site.declaration} =`;
      const eq = src.indexOf(assign);
      const value = eq === -1 ? null : quotedLiteralAt(src, eq + assign.length);
      if (value === null || value === "") {
        refusals.push(
          `${site.source}: \`const ${site.declaration}\` carries no readable double-quoted string ` +
            `literal. The canonical form is \`const ${site.declaration} =\` followed by whitespace ` +
            `and one double-quoted literal; anything else is refused rather than guessed at`,
        );
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
      refusals.push(
        `${site.source}: \`const ${site.declaration}\` has no \`\\n];\` terminator, so its extent ` +
          `could not be bounded. The extraction is refused rather than run over the rest of the file`,
      );
      continue;
    }
    const span = src.slice(at, end);
    let cursor = 0;
    let found = 0;
    for (;;) {
      const key = span.indexOf("needle:", cursor);
      if (key === -1) break;
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
      refusals.push(
        `${site.source}: \`const ${site.declaration}\` yielded ZERO \`needle:\` literals. A ` +
          `derivation that returns nothing shrinks the frozen set without any visible failure`,
      );
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
export const POSITIVE_GUARD_LITERALS: readonly string[] =
  POSITIVE_GUARD_LITERAL_DERIVATION.literals.map((l) => l.literal);

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
export const FROZEN_SECTION_ANCHORS: readonly {
  readonly corpus: "roles" | "workflows";
  readonly heading: string;
  readonly subpath: string;
  readonly expected: number;
}[] = [
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

/** A frozen section's extent inside one file, as 1-based inclusive line numbers. */
export interface FrozenRegion {
  readonly file: string;
  readonly heading: string;
  readonly from: number;
  readonly to: number;
}

/**
 * Locate one heading's section in `text`: from the heading line to the line before the next `## `
 * heading, or to end of file.
 *
 * Matched on the WHOLE line so `## Commit` never matches `## Commit message conventions`, and
 * `startsWith` over `split("\n")` throughout — no regex, no quantifier, nothing to backtrack over.
 */
export function locateSection(
  text: string,
  heading: string,
): { from: number; to: number } | null {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimEnd() !== heading) continue;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith("## ")) {
        end = j;
        break;
      }
    }
    return { from: i + 1, to: end };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The frozen set.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Which of D-01's three sources a frozen clause came from, and what a change to it owes. */
export type FrozenSourceName =
  | "registryAnchors"
  | "structuralSections"
  | "positiveGuardLiterals";

/**
 * The three D-01 sources, each with the companion edit a change to it owes. Object.keys() over this
 * is the source count; nothing else declares it.
 */
export const FROZEN_SOURCES: Readonly<
  Record<FrozenSourceName, { readonly what: string; readonly companion: string }>
> = {
  registryAnchors: {
    what: "a claim-registry verbatim anchor, byte-compared live by scripts/check-claim-anchors.js",
    companion:
      `${REGISTRY_COMPANION} must change in the SAME commit as the clause — the commit that ` +
      `actually changed it, not merely somewhere in the range — or, for an uncommitted edit, in ` +
      `the same working-tree change set (Phase 28 / D-25)`,
  },
  structuralSections: {
    what: "a structural section located by heading — role `## Hard limits`, workflow `## Stop conditions`, workflow `## Commit`",
    companion: `a disposition row under ${DISPOSITION_DIR}/ whose \`companion\` cell names the section and the reason`,
  },
  positiveGuardLiterals: {
    what: "wording a guard requires to be PRESENT — the tier-announcement beats and the shared-context memory sentences",
    companion:
      `the guard's own source must change in the SAME commit as the clause — the commit that ` +
      `actually changed it, not merely somewhere in the range — or, for an uncommitted edit, in ` +
      `the same working-tree change set, so the guard and the kit move together`,
  },
};

export interface DerivationCardinality {
  readonly label: string;
  readonly derived: number;
  readonly expected: number;
}

export interface FrozenSet {
  /** Normalized clause -> the source that froze it. */
  readonly text: ReadonlyMap<string, FrozenSourceName>;
  /** Per-file frozen regions, for the sections whose PROTECTION IS POSITIONAL rather than textual. */
  readonly regions: readonly FrozenRegion[];
  /** The four D-01 derivations, each asserted two-sided by the caller. */
  readonly cardinalities: readonly DerivationCardinality[];
  /** Named refusals raised while deriving. Reported through fail(); never thrown at a caller. */
  readonly refusals: readonly string[];
}

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
export function deriveFrozenSet(root: string = ROOT): FrozenSet {
  const text = new Map<string, FrozenSourceName>();
  const regions: FrozenRegion[] = [];
  const cardinalities: DerivationCardinality[] = [];
  const refusals: string[] = [];

  const add = (s: string, source: FrozenSourceName): void => {
    for (const { clause } of segmentClauses(s)) {
      if (!text.has(clause)) text.set(clause, source);
    }
  };

  // ── Source (a): the claim-registry verbatim anchors ──────────────────────────────────────────
  let claims: readonly ClaimRow[] = [];
  try {
    claims = readRegistry(root).claims;
  } catch (e) {
    refusals.push(
      `the claim registry could not be parsed, so D-01 source (a) contributes NOTHING and no ` +
        `verdict is reported over it — ${(e as Error).message}`,
    );
  }
  let anchorTexts = 0;
  for (const claim of claims) {
    if (claim.verbatim === "") {
      refusals.push(
        `${claim.id} carries an empty \`verbatim\`, so it freezes nothing. An anchor with no text ` +
          `is a row check-claim-anchors compares against nothing`,
      );
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
    let files: string[];
    try {
      files =
        anchor.corpus === "roles" ? listRoles(root) : listWorkflows(root);
    } catch (e) {
      refusals.push(
        `the ${anchor.corpus} corpus could not be derived, so \`${anchor.heading}\` freezes ` +
          `NOTHING — ${(e as Error).message}`,
      );
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
        refusals.push(
          `${rel}: required by the ${anchor.corpus} derivation but missing at ${path} — a file ` +
            `that is not there cannot be scanned for \`${anchor.heading}\``,
        );
        continue;
      }
      const body = readFileSync(path, "utf8");
      const span = locateSection(body, anchor.heading);
      if (span === null) continue;
      located += 1;
      regions.push({
        file: rel,
        heading: anchor.heading,
        from: span.from,
        to: span.to,
      });
      add(
        body.split("\n").slice(span.from - 1, span.to).join("\n"),
        "structuralSections",
      );
    }
    cardinalities.push({
      label: `${anchor.corpus} \`${anchor.heading}\``,
      derived: located,
      expected: anchor.expected,
    });
  }

  // ── Source (c): the positive guard literals ──────────────────────────────────────────────────
  const positive =
    root === ROOT
      ? POSITIVE_GUARD_LITERAL_DERIVATION
      : derivePositiveGuardLiterals(root);
  refusals.push(...positive.refusals);
  for (const l of positive.literals) add(l.literal, "positiveGuardLiterals");

  return { text, regions, cardinalities, refusals };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The changed side.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export type ChangeSide = "removed" | "added";

export interface ChangedClause {
  readonly file: string;
  readonly line: number;
  readonly clause: string;
  readonly side: ChangeSide;
  /**
   * The frozen structural section this clause sits INSIDE, located in the text the clause came from
   * — the working tree for an added clause, the base blob for a removed one.
   *
   * Judging the removed side against the working tree's section extents would be asking where a line
   * is now about a line that is not there any more, and the answer would drift by exactly the number
   * of lines the edit added above it.
   */
  readonly region: FrozenRegion | null;
}

/** Line numbers a unified diff touches on each side of one file. */
export interface TouchedLines {
  readonly removed: readonly number[];
  readonly added: readonly number[];
}

/**
 * Parse `git diff --unified=0` hunk headers into touched line numbers.
 *
 * Only the `@@` headers are read; the body lines are not parsed at all, so a body line that happens
 * to begin with `@@` cannot be mistaken for a header. With `--unified=0` every hunk's ranges are
 * exactly the changed lines, which is why the context width is pinned rather than left to config.
 */
export function touchedLines(diff: string): TouchedLines {
  const removed: number[] = [];
  const added: number[] = [];
  for (const line of diff.split("\n")) {
    if (!line.startsWith("@@ ")) continue;
    const close = line.indexOf(" @@", 3);
    if (close === -1) continue;
    const ranges = line.slice(3, close).split(" ");
    for (const range of ranges) {
      const sign = range[0];
      if (sign !== "-" && sign !== "+") continue;
      const [startText, countText] = range.slice(1).split(",");
      const start = Number.parseInt(startText, 10);
      const count = countText === undefined ? 1 : Number.parseInt(countText, 10);
      if (!Number.isInteger(start) || !Number.isInteger(count)) continue;
      const into = sign === "-" ? removed : added;
      for (let i = 0; i < count; i++) into.push(start + i);
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
export function changedClauses(
  base: string,
  files: readonly string[],
): { clauses: ChangedClause[]; changedFiles: string[] } {
  return changedClausesIn(
    {
      from: base,
      to: null,
      diffArgs: ["diff", "--unified=0", "--no-color", "--no-ext-diff", base],
    },
    files,
  );
}

/**
 * One pair of trees to derive changed clauses between, and the diff argv that spans them.
 *
 * `to === null` means the WORKING TREE, which is the only side that is read off disk. Everything
 * else is read out of a git object, so a carrier's two sides always come from that carrier's own
 * trees — never from the working tree, which would read a clause's text out of a tree the carrier
 * never had and attribute history that did not happen.
 */
interface TreeSpan {
  /** Revision the REMOVED side is read from, or null when there is no before tree. */
  readonly from: string | null;
  /** Revision the ADDED side is read from, or null for the working tree. */
  readonly to: string | null;
  /** The diff argv, minus the trailing `-- <file>` this appends itself. */
  readonly diffArgs: readonly string[];
}

/**
 * The generalized derivation. `changedClauses` is the range case of it, and the carrier attribution
 * below is the per-commit case, so BOTH sides of the comparison stay the same kind of object —
 * segmented by the same segmentClauses(), keyed on the same normalized text.
 */
function changedClausesIn(
  span: TreeSpan,
  files: readonly string[],
): { clauses: ChangedClause[]; changedFiles: string[] } {
  const clauses: ChangedClause[] = [];
  const changedFiles: string[] = [];

  /** The frozen sections of `file`, located in `text`. Empty for a file in neither corpus. */
  const sectionsIn = (file: string, text: string): FrozenRegion[] => {
    const out: FrozenRegion[] = [];
    for (const anchor of FROZEN_SECTION_ANCHORS) {
      if (!file.startsWith(`${anchor.subpath}/`)) continue;
      const span2 = locateSection(text, anchor.heading);
      if (span2 === null) continue;
      out.push({ file, heading: anchor.heading, from: span2.from, to: span2.to });
    }
    return out;
  };
  const regionOf = (regions: FrozenRegion[], line: number): FrozenRegion | null =>
    regions.find((r) => line >= r.from && line <= r.to) ?? null;

  for (const file of files) {
    const diff = git([...span.diffArgs, "--", file]);
    if (diff.trim() === "") continue;
    changedFiles.push(file);
    const touched = touchedLines(diff);

    if (touched.added.length > 0) {
      // The added side comes from `to`: the working tree when `to` is null, otherwise that tree's
      // own blob. A carrier's added clause read off the working tree would be whatever LATER
      // carriers left behind, not what this one wrote.
      let text: string | null = null;
      if (span.to === null) {
        if (existsSync(abs(file))) text = readFileSync(abs(file), "utf8");
      } else {
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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// CR-02 — the carriers, and which of them changed each clause.
//
// THE DEFECT THIS REPLACES. The companion-edit rule was `allChangedFiles.includes(<companion>)`
// over `git diff --name-only <base>` — the WHOLE range. Its own contract string said "the SAME
// commit". Those are different questions, and the difference is not academic: once any commit in
// the range touched the companion, EVERY frozen clause from that source was satisfied for the rest
// of the phase, with no per-clause correspondence and no check at all. On the live tree that was
// already true — the claim registry appears in the range — so all 42 registry-anchored regions
// were unprotected while the gate printed a clean green.
//
// The replacement decides per CLAUSE against the CARRIER that actually changed it. Proximity in a
// range is not correspondence.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** A change set a clause can be attributed to: a commit in the range, or the working tree. */
export type Carrier = string;

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
const shortCarrier = (c: Carrier): string =>
  c === WORKING_TREE_CARRIER ? c : c.slice(0, 7);

/**
 * Every carrier between the recorded base and the working tree, OLDEST FIRST.
 *
 * The list is NOT capped. A cap would silently narrow the check — the same act as narrowing the
 * watched corpus — and the cost is bounded below instead, by deriving clauses only for the
 * carriers that touched a watched file.
 */
export function listCarriers(base: string): Carrier[] {
  const commits = git(["rev-list", "--reverse", `${base}..HEAD`])
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const dirty = git(["status", "--porcelain"]).trim().length > 0;
  return dirty ? [...commits, WORKING_TREE_CARRIER] : commits;
}

/** The tree pair and diff argv for one carrier. */
function carrierSpan(carrier: Carrier): TreeSpan {
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
  const hasParent =
    git(["rev-list", "--parents", "-n", "1", carrier]).trim().split(" ").length > 1;
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
export function carrierFilesTouched(carrier: Carrier): string[] {
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

export interface Attribution {
  /** attributionKey(file, clause) -> the carriers that changed that clause. */
  readonly byClause: ReadonlyMap<string, Carrier[]>;
  /** Every carrier between the recorded base and the working tree, oldest first. */
  readonly carriers: readonly Carrier[];
  /** The carriers that touched a watched file and therefore had their clauses derived. */
  readonly examined: readonly Carrier[];
  /** carrier -> the paths it touched. */
  readonly touched: ReadonlyMap<Carrier, ReadonlySet<string>>;
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
export const attributionKey = (file: string, clause: string): string =>
  `${file}\n${clause}`;

/** Which carriers changed each clause in the watched corpus. */
export function attributeClauses(
  base: string,
  watched: readonly string[],
): Attribution {
  const watchedSet = new Set(watched);
  const carriers = listCarriers(base);
  const byClause = new Map<string, Carrier[]>();
  const touched = new Map<Carrier, ReadonlySet<string>>();
  const examined: Carrier[] = [];

  for (const carrier of carriers) {
    const files = carrierFilesTouched(carrier);
    touched.set(carrier, new Set(files));
    // Bound the WORK, never the correctness: the touched-file set is read once and intersected
    // with the watched corpus FIRST, so the expensive clause derivation runs only for the carriers
    // that touched something this gate watches.
    const inCorpus = files.filter((f) => watchedSet.has(f));
    if (inCorpus.length === 0) continue;
    examined.push(carrier);
    for (const c of changedClausesIn(carrierSpan(carrier), inCorpus).clauses) {
      const key = attributionKey(c.file, c.clause);
      const list = byClause.get(key);
      if (list === undefined) byClause.set(key, [carrier]);
      else if (!list.includes(carrier)) list.push(carrier);
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
export function companionSatisfied(
  file: string,
  clause: string,
  companions: readonly string[],
  attribution: Attribution,
): { satisfied: boolean; carriers: readonly Carrier[] } {
  const carriers = attribution.byClause.get(attributionKey(file, clause)) ?? [];
  const satisfied = carriers.some((carrier) => {
    const t = attribution.touched.get(carrier);
    return t !== undefined && companions.some((c) => t.has(c));
  });
  return { satisfied, carriers };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The disposition rows.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface DispositionRow {
  readonly source: string;
  readonly file: string;
  readonly line: string;
  readonly before: string;
  readonly after: string;
  readonly rule: string;
  readonly disposition: string;
  readonly companion: string;
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
export function isCompanionFilled(cell: string): boolean {
  const words = normalizeSentence(cell).split(" ").filter(Boolean);
  return words.length >= COMPANION_MIN_WORDS;
}

/** Split a markdown table line into trimmed cells, dropping the empty edges the pipes create. */
function tableCells(line: string): string[] {
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length > 0 && cells[0] === "") cells.shift();
  if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

const isSeparatorCell = (c: string): boolean =>
  c.length > 0 && c.split("").every((ch) => ch === "-" || ch === ":");

/**
 * Every disposition row in the directory, membership WALKED rather than listed.
 *
 * One file per plan, so plans running in the same wave never contend on a single register. The two
 * non-row members are named in DISPOSITION_NON_ROWS rather than skipped by a silent `continue`.
 */
export function readDispositionRows(root: string = ROOT): {
  rows: DispositionRow[];
  files: string[];
  refusals: string[];
} {
  const rows: DispositionRow[] = [];
  const files: string[] = [];
  const refusals: string[] = [];
  const dir = join(root, DISPOSITION_DIR);
  if (!existsSync(dir)) {
    refusals.push(
      `${DISPOSITION_DIR}/ does not exist at ${dir}. A missing disposition directory is not an ` +
        `empty one: every changed clause would report as undispositioned for a reason that has ` +
        `nothing to do with the prose`,
    );
    return { rows, files, refusals };
  }
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".md")) continue;
    if (DISPOSITION_NON_ROWS.includes(name)) continue;
    files.push(`${DISPOSITION_DIR}/${name}`);
    const body = readFileSync(join(dir, name), "utf8");
    const at = body.indexOf(DISPOSITION_HEADING);
    if (at === -1) {
      refusals.push(
        `${DISPOSITION_DIR}/${name} carries no \`${DISPOSITION_HEADING}\` heading, so none of its ` +
          `rows are read. A disposition file whose rows are invisible is worse than an absent one: ` +
          `it reads as work done`,
      );
      continue;
    }
    let seen = 0;
    for (const line of body.slice(at).split("\n")) {
      if (!line.startsWith("|")) continue;
      const cells = tableCells(line);
      if (cells.length !== DISPOSITION_COLUMNS) continue;
      if (cells[0] === "file") continue; // the header row
      if (cells.every(isSeparatorCell)) continue; // the separator row
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
    if (seen === 0) {
      refusals.push(
        `${DISPOSITION_DIR}/${name} has a \`${DISPOSITION_HEADING}\` heading and ZERO rows under ` +
          `it. The table takes ${DISPOSITION_COLUMNS} columns — file, line, before, after, rule, ` +
          `disposition, companion — and a row with any other count is not read`,
      );
    }
  }
  return { rows, files, refusals };
}

/** A row matches a changed clause when it names the file and either side normalizes to the clause. */
function rowMatches(row: DispositionRow, c: ChangedClause): boolean {
  if (row.file !== c.file) return false;
  return (
    normalizeSentence(row.before) === c.clause ||
    normalizeSentence(row.after) === c.clause
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Findings.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface Finding {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

/** file path, then line number — so two runs over the same diff produce byte-identical stdout. */
function byPosition(a: Finding, b: Finding): number {
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  if (a.line !== b.line) return a.line - b.line;
  return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The run.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The watched corpus: the LANG-03 exclusion list, markdown members only. */
function watchedCorpus(root: string): {
  watched: string[];
  total: number;
  nonMarkdown: string[];
} {
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

function main(): void {
  process.stdout.write(
    "\n[guard_diff_disposition] every clause changed in the LANG-03 watched corpus is dispositioned, " +
      "and a frozen intersection carries its same-commit companion edit (LANG-03, D-01..D-05)\n",
  );

  // ── The frozen set, and its four two-sided derivations ───────────────────────────────────────
  const frozen = deriveFrozenSet(ROOT);
  for (const r of frozen.refusals) fail(r);
  let derivationShort = false;
  for (const card of frozen.cardinalities) {
    if (card.derived === card.expected) continue;
    derivationShort = true;
    fail(
      `D-01 derivation ${card.label} resolved ${card.derived} of ${card.expected} — a derivation ` +
        `that returns short SHRINKS the frozen set and every verdict below it, silently. Walk the ` +
        `derivation before treating either number as the one to move; the remedy is never to lower ` +
        `the expectation`,
    );
  }
  if (POSITIVE_GUARD_LITERALS.length !== POSITIVE_GUARD_LITERAL_COUNT) {
    derivationShort = true;
    fail(
      `D-01 source (c) extracted ${POSITIVE_GUARD_LITERALS.length} positive guard literal(s), ` +
        `expected exactly ${POSITIVE_GUARD_LITERAL_COUNT} ` +
        `(${POSITIVE_GUARD_LITERAL_SITES.map((s) => `${s.declaration} via ${s.guard}`).join(", ")}) ` +
        `— walk every site's declaration BEFORE updating POSITIVE_GUARD_LITERAL_COUNT`,
    );
  }

  // ── The watched corpus ───────────────────────────────────────────────────────────────────────
  let corpus: { watched: string[]; total: number; nonMarkdown: string[] };
  try {
    corpus = watchedCorpus(ROOT);
  } catch (e) {
    fail(
      `the LANG-03 safety-surface union could not be derived, so there is no watched corpus and NO ` +
        `verdict is reported over one — ${(e as Error).message}`,
    );
    verdict();
    return;
  }
  if (corpus.watched.length === 0) {
    fail(
      `the watched corpus derived ZERO markdown files from the safety-surface union ` +
        `(${corpus.total} entr(ies) total). A vacuous corpus makes every diff empty and every ` +
        `verdict clean`,
    );
    verdict();
    return;
  }

  // ── The recorded base commit ─────────────────────────────────────────────────────────────────
  if (!existsSync(abs(BASE_FILE))) {
    fail(
      `${BASE_FILE} does not exist at ${abs(BASE_FILE)}. The base commit is RECORDED, never ` +
        `inferred from the branch: an inferred base differs between CI and a developer machine, so ` +
        `the same tree would produce two diffs and two verdicts`,
    );
    verdict();
    return;
  }
  const baseMatch = BASE_COMMIT_RE.exec(readFileSync(abs(BASE_FILE), "utf8"));
  if (baseMatch === null) {
    fail(
      `${BASE_FILE} carries no \`base_commit\` in the canonical form — a full 40-character ` +
        `lowercase SHA, alone on its line. Anything outside that form is refused rather than ` +
        `resolved on a guess`,
    );
    verdict();
    return;
  }
  const base = baseMatch[1];
  try {
    git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]);
  } catch (e) {
    fail((e as Error).message);
    verdict();
    return;
  }

  // ── The changed side ─────────────────────────────────────────────────────────────────────────
  let changed: { clauses: ChangedClause[]; changedFiles: string[] };
  let attribution: Attribution;
  try {
    changed = changedClauses(base, corpus.watched);
    attribution = attributeClauses(base, corpus.watched);
  } catch (e) {
    fail((e as Error).message);
    verdict();
    return;
  }

  const corpusLine =
    `watched corpus: ${corpus.watched.length} markdown file(s) of the ${corpus.total}-entry ` +
    `LANG-03 safety-surface union` +
    (corpus.nonMarkdown.length === 0
      ? ""
      : `; ${corpus.nonMarkdown.length} non-markdown entr(ies) named and not watched ` +
        `(${corpus.nonMarkdown.join(", ")} — a clause is a unit of prose, and this gate reports ` +
        `no verdict over a file that carries none)`);
  const cardinalityLine = frozen.cardinalities
    .map((c) => `${c.label} ${c.derived}/${c.expected}`)
    .join(", ");
  process.stdout.write(`        ${corpusLine}\n`);
  process.stdout.write(
    `        frozen set: ${cardinalityLine}, positive guard literals ` +
      `${POSITIVE_GUARD_LITERALS.length}/${POSITIVE_GUARD_LITERAL_COUNT}; ` +
      `${frozen.text.size} frozen clause(s), ${frozen.regions.length} frozen region(s); ` +
      `base ${base.slice(0, 7)}\n`,
  );
  // The carrier count is PUBLISHED, so a run that examined none is visible in its own output rather
  // than only in the verdict it happened to produce.
  process.stdout.write(
    `        carriers: ${attribution.carriers.length} change set(s) between ${base.slice(0, 7)} and ` +
      `the working tree, of which ${attribution.examined.length} touched a watched file and had ` +
      `their clauses derived; the uncommitted working tree ` +
      `${attribution.carriers.includes(WORKING_TREE_CARRIER) ? "IS" : "is NOT"} a carrier\n`,
  );

  // ── The clean-tree arm, kept DISTINCT from the vacuity floor ─────────────────────────────────
  //
  // reportMeasured's zero-element floor answers "the loop skipped its elements". A tree with no
  // changed corpus file has no elements to skip, and folding the two together would make a clean
  // tree indistinguishable from a check that did not run — which is the direction AP-1 exists to
  // refuse, taken the wrong way. So the clean tree is an EXPLICIT arm that names what it measured,
  // and the two refusals below are what stop a non-empty diff ever reaching it.
  if (changed.changedFiles.length === 0) {
    if (FAILS === 0 && !derivationShort) {
      pass(
        `LANG-03: ZERO of the ${corpus.watched.length} watched file(s) differ from the recorded ` +
          `base ${base.slice(0, 7)}, so there is no changed clause to disposition — a clean tree, ` +
          `not a vacuous pass. The frozen set derived at full cardinality: ${cardinalityLine}, ` +
          `positive guard literals ${POSITIVE_GUARD_LITERALS.length}`,
      );
    }
    verdict();
    return;
  }

  if (changed.clauses.length === 0) {
    fail(
      `${changed.changedFiles.length} watched file(s) differ from the recorded base ` +
        `(${changed.changedFiles.join(", ")}) and ZERO changed clause(s) were derived from that ` +
        `diff. That is a check that was NOT performed, not a clean tree: the clause derivation is ` +
        `the gate's entire left-hand side, and an empty one admits every change below it`,
    );
    verdict();
    return;
  }

  const disposition = readDispositionRows(ROOT);
  for (const r of disposition.refusals) fail(r);
  if (disposition.files.length === 0) {
    fail(
      `${changed.changedFiles.length} watched file(s) changed and ${DISPOSITION_DIR}/ derives ZERO ` +
        `disposition file(s). Membership is walked, so a plan's file enters the set by existing — ` +
        `write ${DISPOSITION_DIR}/<plan>.md before changing kit prose, never after`,
    );
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
    fail(
      `${changed.clauses.length} changed clause(s) were derived from the range since ` +
        `${base.slice(0, 7)}, and the carrier attribution map is EMPTY: not one of the ` +
        `${attribution.carriers.length} carrier(s) between the base and the working tree was found ` +
        `to have changed any of them. That is a derivation that did not run, not a range with ` +
        `nothing in it — the attribution is the left-hand side of every frozen verdict below, and ` +
        `an empty one would admit every change under it. This is what a shallow clone, a grafted ` +
        `history or a rebased base looks like from here: confirm the history reaches ` +
        `${base.slice(0, 7)} (on CI, \`fetch-depth: 0\`) rather than re-recording the base`,
    );
    verdict();
    return;
  }

  const findings: Finding[] = [];
  let visited = 0;

  for (const c of changed.clauses) {
    visited += 1;

    // Positional freeze: the structural sections are frozen by WHERE they are, which is what
    // catches a REWORD. The reworded text is new, so it matches no frozen clause; its position
    // inside `## Hard limits` is what does not move.
    const region = c.region;
    // Textual freeze: EQUALITY of the normalized clause is a hit. A clause that merely shares a
    // prefix with a frozen clause is NOT an intersection and needs only an ordinary row.
    const textSource = frozen.text.get(c.clause);

    const source: FrozenSourceName | null =
      region !== null ? "structuralSections" : (textSource ?? null);

    if (source !== null) {
      const rows = disposition.rows.filter((r) => rowMatches(r, c));
      let satisfied = false;
      let owed = FROZEN_SOURCES[source].companion;
      // The carriers that changed THIS clause. Empty on the structural arm, whose companion is a
      // disposition-row cell rather than a file, and which this plan deliberately does not touch.
      let attributedTo: readonly Carrier[] = [];
      if (source === "structuralSections") {
        // WR-05. The satisfaction test is the CANONICAL FILLED FORM and nothing else: no sentinel
        // is excluded and no spelling is enumerated, so a placeholder is refused by construction
        // rather than by having been thought of. See isCompanionFilled for the argument in full.
        satisfied = rows.some((r) => isCompanionFilled(r.companion));
        owed =
          `${owed} — at least ${COMPANION_MIN_WORDS} normalized words, which is the canonical ` +
          `filled form. A cell too short to name both the section and the reason is not a ` +
          `companion edit whatever glyph it carries, and there is no placeholder spelling that ` +
          `satisfies this`;
      } else {
        // Per CARRIER, not per range. The companion set for the registry arm is one declared
        // constant; for the positive-literal arm it is DERIVED from the literal sites rather than
        // restated, so a site that moves to a new source file takes this comparison with it.
        const companions =
          source === "registryAnchors"
            ? [REGISTRY_COMPANION]
            : [...new Set(POSITIVE_GUARD_LITERAL_SITES.map((s) => s.source))];
        if (source === "positiveGuardLiterals") {
          owed = `${owed} (${companions.join(", ")})`;
        }
        const decided = companionSatisfied(
          c.file,
          c.clause,
          companions,
          attribution,
        );
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
        const unattributed =
          source !== "structuralSections" && attributedTo.length === 0;
        findings.push({
          file: c.file,
          line: c.line,
          text:
            `${c.file}:${c.line} (${c.side}) — FROZEN by ${source}: ` +
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
        text:
          `${c.file}:${c.line} (${c.side}) — no disposition row\n` +
          `        clause: ${JSON.stringify(c.clause)}\n` +
          `        Remedy: add a row to your plan's file under ${DISPOSITION_DIR}/ naming the file, ` +
          `the line, the clause before and after, the profile rule id or decision that drove it, ` +
          `and the disposition. A row matches when it names this file and either its \`before\` or ` +
          `its \`after\` normalizes to this clause`,
      });
    }
  }

  findings.sort(byPosition);

  const measured: Measured<Finding> = {
    label: "diff disposition",
    visited,
    expected: changed.clauses.length,
    findings,
  };
  process.stdout.write(
    `        ${changed.changedFiles.length} watched file(s) changed since ${base.slice(0, 7)}; ` +
      `${changed.clauses.length} changed clause(s) derived; ` +
      `${disposition.rows.length} disposition row(s) across ${disposition.files.length} file(s)\n`,
  );
  FAILS += reportMeasured(measured, { pass, fail }, (f) => `        ${f.text}`);

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

function runAll(): void {
  try {
    main();
  } catch (e) {
    // A gate that dies is not a gate that failed. Anything the derivations throw — a git invocation
    // that could not run, an unreadable frozen source — is REPORTED here and the exit code is the
    // verdict, never a stack trace on stderr with a zero status.
    fail(
      `${(e as Error).message}\n        No verdict is reported over the diff, because the diff ` +
        `could not be derived`,
    );
    verdict();
  }
}

// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL via pathToFileURL — a
// hand-built `file://${argv[1]}` URL does NOT match on Windows, which would make a direct
// `node scripts/check-diff-disposition.js` run ZERO checks and exit 0, a fabricated green. The guard
// is also what lets the test file IMPORT this module's exported sets without the import running the
// check and calling process.exit inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
