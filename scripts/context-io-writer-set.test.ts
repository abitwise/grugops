// context-io-writer-set.test.ts — the note-writer set is DERIVED, COUNTED, and every member EXERCISED.
//
// WHY THIS FILE EXISTS. 31-VERIFICATION.md closed on a defect whose whole shape was reachability:
// the D-03 evidence-binding comparison was correct, lived in exactly one place, was covered by a
// green suite — and was not reached from `appendNote`, the writer two shipped workflows name BY
// NAME. A fabricated `gate_run` went in through that writer and came back with an id.
//
// The plan that fixed it wired one call. This file is what stops the NEXT writer from landing
// without one. It does not ask "does appendNote refuse?" — 31-05's cases in
// `scripts/context-io.test.ts` ask that. It asks the question that was never asked: WHICH
// FUNCTIONS CAN WRITE A NOTE AT ALL, and is every one of them bound?
//
// THE SET IS DERIVED, NOT TYPED OUT. This repository's second systemic failure class is a
// hand-maintained set literal that rots while the suite stays green (7 granted names, 0 adapter
// files). So the writer set is computed from `scripts/context-io.ts` by the TypeScript AST — every
// exported function whose transitive call closure reaches `writeNoteFile` — and BOTH its members
// and its cardinality are asserted. A writer added later moves both and turns this file red before
// it can ship unbound.
//
// WHAT IT DOES NOT CLOSE, NAMED RATHER THAN IMPLIED (PART FIVE):
//   • The derivation is SYNTACTIC. It resolves `foo(...)` by identifier; an alias
//     (`const f = writeNoteFile; f(...)`) or a computed member call is not seen. Widening the
//     matcher once per counter-example is the failure this repository has paid for, so the boundary
//     is written down. What stops such a call is the behavioural refusal, which PART THREE drives.
//   • `atomicWrite` is an EXPORTED, general-purpose file writer that takes its destination from its
//     caller and does NOT reach `writeNoteFile`. It is therefore not a note writer and nothing here
//     binds it. It is derived, asserted, and disclosed in `NON_NOTE_WRITER_RESIDUALS` — the accepted
//     T-31-25 residual, forbidden by workflows 16 and 18 rather than by code.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import ts from "typescript";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const CONTEXT_IO_TS = join(ROOT, "scripts", "context-io.ts");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

/** The committed compiled artifact — the thing a host actually runs, and so the thing driven here. */
const mod: typeof import("./context-io.js") = await import(pathToFileURL(CONTEXT_IO_JS).href);

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE EXPECTED SET AND THE EXPECTED COUNT — two constants on purpose.
//
// A single `expect(derived).toEqual([...])` reports a member change and a cardinality change as the
// same failure, and the second is the one that means "something landed that nobody exercised". They
// are asserted separately so the two failures read differently.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Every EXPORTED function of scripts/context-io.ts whose call closure reaches writeNoteFile. */
const EXPECTED_NOTE_WRITERS = Object.freeze([
  "admitAndAppend",
  "appendNote",
  "emitCheckpointNote",
  "emitVerdict",
]);

/** The cardinality of that set. A fifth writer is a decision, never a bumped constant. */
const EXPECTED_NOTE_WRITER_COUNT = 4;

/**
 * The DISCLOSED residual: an exported function that writes to the filesystem, takes its destination
 * from its caller, and is NOT a note writer (it does not reach writeNoteFile). Nothing in this file
 * binds it — a hand-authored context path could still reach it — which is exactly why it is named
 * here instead of being left as a silence. T-31-25, disposition `accept`.
 */
const NON_NOTE_WRITER_RESIDUALS = Object.freeze(["atomicWrite"]);

/**
 * Occurrences of `appendNote(` across tracked NON-TEST sources under scripts/, hooks/, install/.
 *
 * MEASURED, WITH THE REASON IT MOVED (31-09): 6 → 4. The derivation below was re-run and its output
 * read, rather than the constant being adjusted until the case passed. The two lost occurrences are
 * `admitAndAppend`'s gated and non-gated persistence calls, which now go through the module-private
 * `appendPreAdmittedNote` — the one route permitted to skip the authority, itself derived and counted
 * in PART FIVE-B. The four that remain are:
 *
 *   scripts/context-io.ts       the `export function appendNote(` DECLARATION (the regex counts it)
 *   scripts/compactor.ts        promote() — a pass-through, so a promoted note is admitted at the
 *                               destination by the same authority
 *   scripts/check-uat-oracles.ts  equivDoWork's soft observation note
 *   scripts/check-uat-oracles.ts  equivDoWork's gate-stamped finding, now earned against a real
 *                               green verdict this lane emits (31-09)
 */
const EXPECTED_APPEND_NOTE_CALL_SITES = 4;

/** Files under agent-factory/ whose prose names `appendNote`. */
const EXPECTED_AGENT_FACTORY_MENTIONS = 4;

/** The filesystem write primitives a direct caller reaches without going through a note writer. */
const FS_WRITE_PRIMITIVES = Object.freeze([
  "writeFileSync",
  "appendFileSync",
  "renameSync",
  "unlinkSync",
  "mkdirSync",
  "rmSync",
  "copyFileSync",
]);

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE — the derivation.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

interface SourceAnalysis {
  /** Top-level function declarations, name → the identifiers its body calls. */
  readonly calls: Map<string, Set<string>>;
  /** The subset of those names carrying an `export` modifier. */
  readonly exported: Set<string>;
}

function analyze(sourcePath: string): SourceAnalysis {
  const source = ts.createSourceFile(
    "context-io.ts",
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const calls = new Map<string, Set<string>>();
  const exported = new Set<string>();
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
    const name = statement.name.text;
    const called = new Set<string>();
    const walk = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        called.add(node.expression.text);
      }
      ts.forEachChild(node, walk);
    };
    if (statement.body) walk(statement.body);
    calls.set(name, called);
    const modifiers = ts.getModifiers(statement) ?? [];
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) exported.add(name);
  }
  return { calls, exported };
}

/** The transitive closure of "calls" from one function, over the file's own declarations. */
function closureOf(analysis: SourceAnalysis, start: string): Set<string> {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const callee of analysis.calls.get(current) ?? []) {
      if (seen.has(callee)) continue;
      seen.add(callee);
      if (analysis.calls.has(callee)) stack.push(callee);
    }
  }
  return seen;
}

/**
 * THE DERIVATION: the exported functions of `sourcePath` that can reach the single note-file write
 * chokepoint. Sorted, so a member comparison is order-independent.
 */
function deriveNoteWriters(sourcePath: string): string[] {
  const analysis = analyze(sourcePath);
  return [...analysis.exported]
    .filter((name) => closureOf(analysis, name).has("writeNoteFile"))
    .sort();
}

describe("31-05 — the note-writer set is derived from the module, not typed out", () => {
  it("PREMISE: the parse actually yielded declarations and exports", () => {
    // ASSERT THE HARNESS'S OWN PREMISE. A derivation that silently parsed nothing returns an empty
    // set, and an empty set trivially satisfies every "no unbound writer" claim below. This
    // repository has recorded a FALSE verification-harness premise six times across four rounds, so
    // the premise is a failing assertion rather than an assumption.
    const analysis = analyze(CONTEXT_IO_TS);
    expect(
      analysis.calls.size,
      "PREMISE: the TypeScript parse of scripts/context-io.ts yielded ZERO top-level function " +
        "declarations, so every derivation below measured nothing at all",
    ).toBeGreaterThan(0);
    expect(
      analysis.exported.size,
      "PREMISE: the parse found ZERO exported functions, so the writer derivation had no candidates " +
        "and its emptiness would say nothing about the module",
    ).toBeGreaterThan(0);
    expect(
      analysis.calls.has("writeNoteFile"),
      "PREMISE: the write chokepoint `writeNoteFile` was not found as a top-level declaration, so " +
        "the closure test below could never be true for any candidate",
    ).toBe(true);
  });

  it("the derived writer set has the expected MEMBERS", () => {
    expect(deriveNoteWriters(CONTEXT_IO_TS)).toEqual([...EXPECTED_NOTE_WRITERS]);
  });

  it("the derived writer set has the expected COUNT", () => {
    expect(
      deriveNoteWriters(CONTEXT_IO_TS).length,
      "a note writer landed or left scripts/context-io.ts. A new one is a function that can put a " +
        "note into the shared verified context, so it needs an admission binding and a driver in " +
        "WRITER_EXERCISES below — it is a decision, never a bumped constant",
    ).toBe(EXPECTED_NOTE_WRITER_COUNT);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO — the derivation DISCRIMINATES.
//
// A structural assertion nobody has watched fail is not yet a control. The mirror is BUILT FROM the
// live source rather than from a fixture, so it cannot drift away from the thing it copies.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const SEEDED_WRITER = "seededImpostorNoteWriter";

function mirrorWithExtraWriter(): string {
  const dir = freshTmp("ctx-io-writer-mirror-");
  const path = join(dir, "context-io.ts");
  writeFileSync(
    path,
    readFileSync(CONTEXT_IO_TS, "utf8") +
      `\nexport function ${SEEDED_WRITER}(notesDir: string, id: string, text: string): void {\n` +
      `  writeNoteFile(notesDir, id, text);\n}\n`,
  );
  return path;
}

describe("31-05 — the writer derivation is a control, not a coincidence", () => {
  it("a SECOND exported writer in the module joins the derived set", () => {
    const derived = deriveNoteWriters(mirrorWithExtraWriter());
    expect(derived).toContain(SEEDED_WRITER);
    expect(derived).not.toEqual([...EXPECTED_NOTE_WRITERS]);
  });

  it("a SECOND exported writer moves the COUNT by exactly one", () => {
    const derived = deriveNoteWriters(mirrorWithExtraWriter()).length;
    expect(derived).not.toBe(EXPECTED_NOTE_WRITER_COUNT);
    // …by exactly one, so the difference is caused by the seeded function rather than by a
    // derivation that broke and started reporting some other number.
    expect(derived).toBe(EXPECTED_NOTE_WRITER_COUNT + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO-B — the SECOND axis. The refusal-family set is DERIVED from the authority's own source.
//
// WHY THIS EXISTS, AND WHY IT IS THE SAME MISTAKE ONE REGISTER OVER (31-10, CR-05 round 2).
// 31-05 derived the WRITER set by AST and asserted its cardinality — correct — and then asked every
// derived member exactly ONE question: "does it refuse the fabricated artifact-ref?". So the set that
// was DERIVED was the writers, and the set that was ENUMERATED BY HAND had one member. `admit()`
// decides several refusal families; a writer that reached one of them read as covered. That is why
// the contract test built to prevent this gap class could not see CR-05, and the round-2 verifier
// named it as the reason.
//
// The project's doctrine for this round is "derive BOTH axes and check the converse". So the refusal
// family is promoted to a first-class DERIVED set, on the same footing as the writer set: read off
// `admit()`'s parsed body, counted, and asserted member-wise and cardinality-wise separately.
//
// A REFUSAL SITE, NOT A REFUSAL FAMILY. The unit of derivation is the SITE — every `return` of a
// non-empty array literal in the authority's own body — because a "family" is a human grouping (the
// review names four; D-03 alone returns four times) and a grouping cannot be read off a parse. The
// family label is attached to each derived signature afterwards, through an asserted bijection, and
// is never a substitute for the derived set.
//
// TWO SITES CAN OPEN WITH THE SAME SENTENCE. The D-01 and D-03 "no live green §14-gate verdict found
// for …" refusals share their first sentence verbatim and diverge only later. A signature truncated
// to a prefix would collide them, and a colliding set comparison passes vacuously — so the signature
// is the FULL concatenation of every static literal chunk of the returned expression, in source
// order, with interpolations dropped and whitespace runs collapsed.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The admission authority's declared name, in one place so the derivation and its controls agree. */
const ADMIT_AUTHORITY = "admit";

/** One refusal site: its whitespace-collapsed signature, and the raw chunks that matched it. */
interface RefusalSite {
  /** The site's identity: static chunks joined, whitespace collapsed. Never truncated. */
  readonly signature: string;
  /**
   * The same chunks UNCOLLAPSED and in source order. A runtime refusal message is the chunks with
   * the interpolations filled in, so "does this message come from this site" is decided by finding
   * every chunk in order — which is why the raw form is kept beside the collapsed identity.
   */
  readonly chunks: readonly string[];
}

interface AdmitRefusalDerivation {
  /** Every top-level function name the parse found — the premise that it parsed anything at all. */
  readonly declared: readonly string[];
  /** Whether the exported authority declaration was located. */
  readonly declarationFound: boolean;
  /** Whether that declaration had a body to walk. */
  readonly hasBody: boolean;
  /** One entry per refusal site, in source order. */
  readonly sites: readonly RefusalSite[];
}

/**
 * Every STATIC literal chunk of an expression, in source order: string-literal texts, template head
 * / middle / tail texts, and the literal operands of a `+` concatenation. Interpolations are dropped
 * by not descending past a literal node — `${verdictStampFor(id)}` contributes nothing, which is
 * what makes the signature stable across the values a refusal happens to name.
 */
function refusalStaticChunks(node: ts.Node): string[] {
  const out: string[] = [];
  const walk = (n: ts.Node): void => {
    if (
      ts.isStringLiteral(n) ||
      ts.isNoSubstitutionTemplateLiteral(n) ||
      n.kind === ts.SyntaxKind.TemplateHead ||
      n.kind === ts.SyntaxKind.TemplateMiddle ||
      n.kind === ts.SyntaxKind.TemplateTail
    ) {
      out.push((n as ts.LiteralLikeNode).text);
      return; // a literal has no static children worth descending into
    }
    ts.forEachChild(n, walk);
  };
  walk(node);
  return out.filter((chunk) => chunk.length > 0);
}

/** The site's identity: the chunks joined in source order, whitespace runs collapsed to one space. */
function refusalSignature(chunks: readonly string[]): string {
  return chunks.join("").replace(/\s+/g, " ").trim();
}

/**
 * THE SECOND DERIVATION: one signature per refusal site in the admission authority's own body.
 *
 * A refusal site is a `return` whose argument is an array literal with at least one element — the
 * shape every refusal in `admit()` takes. `return findings;` (an identifier) and `return [];` (the
 * admitted case) are deliberately NOT sites: the first delegates its refusal to `validate()`, which
 * is a different authority, and the second is not a refusal at all.
 */
function deriveAdmitRefusalSites(sourcePath: string): AdmitRefusalDerivation {
  const source = ts.createSourceFile(
    "context-io.ts",
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const declared: string[] = [];
  const sites: RefusalSite[] = [];
  let declarationFound = false;
  let hasBody = false;
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
    declared.push(statement.name.text);
    if (statement.name.text !== ADMIT_AUTHORITY) continue;
    declarationFound = true;
    hasBody = statement.body !== undefined;
    const walk = (node: ts.Node): void => {
      if (
        ts.isReturnStatement(node) &&
        node.expression &&
        ts.isArrayLiteralExpression(node.expression) &&
        node.expression.elements.length > 0
      ) {
        const chunks = refusalStaticChunks(node.expression);
        sites.push({ signature: refusalSignature(chunks), chunks });
      }
      ts.forEachChild(node, walk);
    };
    if (statement.body) walk(statement.body);
  }
  return { declared, declarationFound, hasBody, sites };
}

/** The derived signatures, sorted — the set every hand-authored table in this file is bounded by. */
function derivedRefusalSignatures(sourcePath: string): string[] {
  return deriveAdmitRefusalSites(sourcePath)
    .sites.map((s) => s.signature)
    .sort();
}

/**
 * THE HARNESS ASSERTS ITS OWN PREMISE, AS A FAILING ASSERTION RATHER THAN AN ASSUMPTION.
 *
 * A parse that found nothing returns an empty site list, and an empty list satisfies every claim
 * below vacuously — "every derived family is exercised" is trivially true of no families. This
 * repository has recorded a FALSE verification-harness premise six times across four rounds, which
 * is why this is a function the real case CALLS and the renamed-declaration control WATCHES THROW.
 */
function assertAdmitRefusalPremise(derived: AdmitRefusalDerivation): void {
  expect(
    derived.declared.length,
    "PREMISE: the TypeScript parse of the module yielded ZERO top-level function declarations, so " +
      "the refusal derivation measured nothing at all",
  ).toBeGreaterThan(0);
  expect(
    derived.declarationFound,
    `PREMISE: no function named "${ADMIT_AUTHORITY}" was declared, so the derived refusal set is ` +
      `empty for a reason that says nothing about which refusals the authority implements`,
  ).toBe(true);
  expect(
    derived.hasBody,
    `PREMISE: "${ADMIT_AUTHORITY}" was declared with no body to walk (an overload signature or a ` +
      `declaration file), so no refusal site could have been found`,
  ).toBe(true);
  expect(
    derived.sites.length,
    `PREMISE: ZERO refusal sites were derived from "${ADMIT_AUTHORITY}"'s body. Either the ` +
      `authority refuses nothing, or the site matcher stopped matching the shape its refusals take`,
  ).toBeGreaterThan(0);
}

/**
 * ONE ROW PER REFUSAL SITE: its expected signature, and the family label a human reads it by.
 *
 * WHICH HALF IS LOAD-BEARING, STATED RATHER THAN LEFT TO INFERENCE. `signature` is a hand-written
 * copy of what the derivation reads off the module — bounded by being asserted EQUAL to the derived
 * set, exactly as `EXPECTED_NOTE_WRITERS` above is bounded. `family` is a readability aid: the review
 * groups these eight sites into four families (D-01, D-03, D-04, D-14), and a grouping is a human
 * judgment that cannot be read off a parse. The label is attached TO a derived signature and is
 * never a substitute for it — the set this file reasons over is always the derived one.
 *
 * A site added to the authority has no row here, so the member assertion fires; a site whose WORDING
 * changed moves its signature, so the member assertion fires differently from the count assertion.
 * That separation is the point (the writer-set precedent): a re-worded refusal and an ADDED refusal
 * are different events and must not read as the same failure.
 */
interface RefusalSiteSpec {
  /** A short handle used in test names, so a failing cell reads as "appendNote × S6". */
  readonly key: string;
  /** The human grouping the review names. A label, never the set. */
  readonly family: string;
  /** The expected derived signature: static chunks joined, interpolations dropped, spaces collapsed. */
  readonly signature: string;
}

const REFUSAL_SITE_SPECS: readonly RefusalSiteSpec[] = Object.freeze([
  {
    key: "S1",
    family: "D-11 structural — the defensive no-frontmatter return",
    signature: "admission FAIL: no YAML frontmatter fence (--- ... ---) found",
  },
  {
    key: "S2",
    family: "D-01 — a gate-stamped finding needs a live green verdict",
    signature:
      "admission FAIL: no live green §14-gate verdict found for \"\" under task \"\". A finding stamped §14-gate# is admitted only when a real green gate verdict with that per-run id exists in the task context (Posture B).",
  },
  {
    key: "S3",
    family: "D-03 a — an artifact-ref names a gate run with no live green verdict",
    signature:
      "admission FAIL: no live green §14-gate verdict found for \"\" under task \"\". An artifact-ref naming gate_run \"\" is evidence only when a real green gate verdict with that per-run id exists in the task context.",
  },
  {
    key: "S4",
    family: "D-03 b — two live green verdicts share one per-run id",
    signature:
      "admission FAIL: more than one live green §14-gate verdict exists for \"\" under task \"\" ( found), so there is no single commit this artifact-ref can be bound to. A per-run id names one gate run; the evidence is refused and nothing is written until the duplicate is superseded.",
  },
  {
    key: "S5",
    family: "D-03 c — the matched verdict recorded no commit SHA",
    signature:
      "admission FAIL: the live green §14-gate verdict for \"\" under task \"\" recorded no commit SHA, so this artifact-ref cannot be bound to the commit that gate run was performed at. The evidence is refused and nothing is written — an unbindable artifact-ref is never admitted as a pass.",
  },
  {
    key: "S6",
    family: "D-03 d — the evidence records a different commit than its gate run",
    signature:
      "admission FAIL: this artifact-ref records sha \"\" while the live green §14-gate verdict for \"\" under task \"\" was performed at sha \"\". Evidence is bound to the commit its gate run ran against; a mismatch is refused and nothing is written.",
  },
  {
    key: "S7",
    family: "D-14 — the governance configuration exists and cannot be read",
    signature:
      "admission REFUSED (UNKNOWN - verify): a governance configuration file exists at a standard location but could not be read or parsed, so the human_admission dial is UNKNOWN. This admission is refused and nothing is written — no note, no audit-ledger event — and the finding stays \"UNKNOWN - verify\" until a human repairs the configuration. An unreadable dial is never degraded to the lean \"off\" default; reading it as off is the fail-open this refusal closes (D-14). A genuinely ABSENT config is a different case and still runs lean.",
  },
  {
    key: "S8",
    family: "D-04 — a high-severity governance finding under an active dial",
    signature:
      "admission REFUSED (human_admission: ): a high-severity governance entry authored by \"\" (security, architecture, or release) Admission is refused until a named human disposes it through the hook. This is the in-script defense-in-depth tier; on Claude Code the un-forgeable gate is the separate admission-guard hook.",
  },
]);

/** The expected member set, sorted — the second axis, on the same footing as EXPECTED_NOTE_WRITERS. */
const EXPECTED_ADMIT_REFUSAL_SIGNATURES = Object.freeze(
  REFUSAL_SITE_SPECS.map((spec) => spec.signature).sort(),
);

/** Derived signature → family label. Its KEY SET is asserted equal to the derived set below. */
const REFUSAL_FAMILY_LABELS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(REFUSAL_SITE_SPECS.map((spec) => [spec.signature, spec.family])),
);

/**
 * The cardinality of the derived refusal-site set.
 *
 * MEASURED, NEVER BUMPED. A refusal site added to or removed from the admission authority is a
 * DECISION: it changes the set of reasons a note can be refused, and every writer in the matrix
 * below owes that new reason a row. Re-run the derivation, read its output, and write down what
 * moved and why — the same discipline `EXPECTED_NOTE_WRITER_COUNT` above is held to. The value 8 was
 * read off the parse on 2026-09-08: one structural no-fence return, one D-01 gate-stamp cross-check,
 * four D-03 evidence-binding arms, one D-14 unreadable-config refusal, one D-04 high-severity
 * refusal.
 */
const EXPECTED_ADMIT_REFUSAL_SITE_COUNT = 8;

/**
 * THE DERIVATION'S BOUNDARY, WRITTEN DOWN RATHER THAN LEFT AS A SILENCE.
 *
 * The walk is SYNTACTIC. It sees a refusal that the authority RETURNS AS AN ARRAY LITERAL FROM ITS
 * OWN BODY, and nothing else. Three shapes sit outside it, and each is named here with its reason
 * rather than discovered by a later round:
 */
const ADMIT_DERIVATION_RESIDUALS = Object.freeze([
  "R-34 — a refusal RETURNED BY IDENTIFIER is not a derived site. `return findings;` hands back " +
    "another authority's refusals (validate()'s), so counting it would attribute a structural " +
    "refusal to the admission authority. OCCUPIED on this tree: exactly one such return exists, " +
    "asserted below, and it is what makes the S1 site unreachable.",
  "R-35 — a refusal DELEGATED TO A HELPER (`return refuseBecause(...)`) is not seen, because the " +
    "returned expression is a call rather than an array literal. UNOCCUPIED on this tree, asserted " +
    "below as a count of zero rather than claimed in prose.",
  "R-36 — a refusal COMPOSED THEN RETURNED (`const out = [...]; return out;`) is not seen for the " +
    "same reason as R-34, and cannot be told apart from it by the returned shape alone. The bound " +
    "on both is the identifier-return count asserted below.",
]);

describe("31-10 — the refusal derivation's boundary is asserted, not described", () => {
  /** Returns from the authority's body whose argument is neither an array literal nor absent. */
  function nonLiteralReturns(sourcePath: string): { identifiers: string[]; calls: string[] } {
    const source = ts.createSourceFile(
      "context-io.ts",
      readFileSync(sourcePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const identifiers: string[] = [];
    const calls: string[] = [];
    for (const statement of source.statements) {
      if (!ts.isFunctionDeclaration(statement) || statement.name?.text !== ADMIT_AUTHORITY) continue;
      const walk = (node: ts.Node): void => {
        if (ts.isReturnStatement(node) && node.expression) {
          if (ts.isIdentifier(node.expression)) identifiers.push(node.expression.text);
          else if (ts.isCallExpression(node.expression)) calls.push(node.expression.getText(source));
        }
        ts.forEachChild(node, walk);
      };
      if (statement.body) walk(statement.body);
    }
    return { identifiers, calls };
  }

  it("the residual register is non-empty — a boundary nobody wrote down is the next gap", () => {
    expect(ADMIT_DERIVATION_RESIDUALS.length).toBeGreaterThan(0);
  });

  it("R-34 is OCCUPIED: exactly one refusal is returned by identifier, and it is validate()'s", () => {
    // Stated as a failing-on-change assertion rather than as prose (the 31-09 discipline). A SECOND
    // identifier return would be a refusal this derivation cannot see, and the file must go red at
    // the moment it lands rather than at the next verification round.
    expect(
      nonLiteralReturns(CONTEXT_IO_TS).identifiers,
      "the set of refusals the authority returns by IDENTIFIER moved. Each one is a refusal the " +
        "syntactic derivation above cannot see, so it needs a residual row and — if it is the " +
        "authority's own decision rather than a delegation — a widened derivation",
    ).toEqual(["findings"]);
  });

  it("R-35 is UNOCCUPIED: no refusal is delegated to a helper call", () => {
    expect(
      nonLiteralReturns(CONTEXT_IO_TS).calls,
      "a refusal is now returned from a helper CALL, which the array-literal walk cannot see. The " +
        "derivation must widen to that helper rather than silently under-count",
    ).toEqual([]);
  });
});

describe("31-10 — the refusal-family axis is derived from admit()'s own source, not typed out", () => {
  it("PREMISE: the parse found the authority, it had a body, and it yielded refusal sites", () => {
    assertAdmitRefusalPremise(deriveAdmitRefusalSites(CONTEXT_IO_TS));
  });

  it("every derived signature is DISTINCT — a prefix collision would pass this file vacuously", () => {
    // The D-01 and D-03 "no live green §14-gate verdict found for …" refusals share their opening
    // sentence verbatim. If the signature were a prefix, they would collapse to one member, the
    // count would silently drop, and a probe for either would read as covering both.
    const signatures = derivedRefusalSignatures(CONTEXT_IO_TS);
    expect(
      new Set(signatures).size,
      `two refusal sites derived the SAME signature, so the set below is smaller than the number of ` +
        `refusals the authority implements and a probe for one reads as covering both`,
    ).toBe(signatures.length);
  });

  it("the derived refusal-site set has the expected MEMBERS", () => {
    // Asserted separately from the count on purpose (the writer-set precedent): a site whose WORDING
    // changed and a site that was ADDED are different events and must read as different failures.
    expect(derivedRefusalSignatures(CONTEXT_IO_TS)).toEqual([...EXPECTED_ADMIT_REFUSAL_SIGNATURES]);
  });

  it("the derived refusal-site set has the expected COUNT", () => {
    expect(
      deriveAdmitRefusalSites(CONTEXT_IO_TS).sites.length,
      "a refusal site landed in or left the admission authority. A new one is a new reason a note " +
        "can be refused, so every writer in the matrix below owes it a row — it is a decision with " +
        "a written reason, never a bumped constant",
    ).toBe(EXPECTED_ADMIT_REFUSAL_SITE_COUNT);
  });

  it("the family-label mapping's KEY SET equals the derived signature set", () => {
    // The label is a reading aid over a derived set. This assertion is what stops it from quietly
    // becoming the set: a site with no label turns the file red rather than being labelled "unknown"
    // and carried along.
    expect(
      Object.keys(REFUSAL_FAMILY_LABELS).sort(),
      "a derived refusal site has no family label (or a label names a signature the authority no " +
        "longer returns). The label set is bounded by the derived set in BOTH directions",
    ).toEqual(derivedRefusalSignatures(CONTEXT_IO_TS));
  });

  it("the site handles are unique, so a failing matrix cell names exactly one site", () => {
    const keys = REFUSAL_SITE_SPECS.map((spec) => spec.key);
    expect(new Set(keys).size, `duplicate site handle in REFUSAL_SITE_SPECS: ${keys.join(", ")}`).toBe(
      keys.length,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO-C — the refusal derivation DISCRIMINATES, watched failing in BOTH directions.
//
// A count that has only ever been seen agreeing is a coincidence. The derivation is run against
// three mirrors built FROM the live source: one with a refusal site seeded in (the count must move
// UP by exactly one and the seeded signature must appear), one with a refusal site removed (DOWN by
// exactly one), and one with the authority's declaration renamed (the PREMISE must fire, not the
// member comparison — a derivation that measured nothing must not report a member disagreement).
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The seeded site's text, distinctive enough that its signature cannot be confused with a real one. */
const SEEDED_REFUSAL_TEXT = "admission FAIL: SEEDED refusal site for the derivation control.";

/** The one-occurrence anchor the seeded mirror inserts after — inside the authority's own body. */
const REFUSAL_SEED_ANCHOR = "  assertSafeTask(task);\n  // Structural gate first";

/** The one-occurrence anchor the removal mirror rewrites: the authority's own no-fence refusal. */
const REFUSAL_REMOVAL_ANCHOR =
  'if (!parsed) return ["admission FAIL: no YAML frontmatter fence (--- ... ---) found"];';

/** The one-occurrence anchor the premise control renames. */
const AUTHORITY_DECLARATION_ANCHOR = `export function ${ADMIT_AUTHORITY}(`;

/**
 * Replace an anchor that must occur EXACTLY ONCE, asserting its single occurrence before and its
 * absence after. A mutation that matched nothing produces an unmutated copy, and every claim built
 * on "the mirror differs by one edit" would then be measuring the live source while saying otherwise.
 */
function replaceExactlyOnce(
  source: string,
  anchor: string,
  replacement: string,
  what: string,
): string {
  expect(
    source.split(anchor).length - 1,
    `PREMISE: the anchor for ${what} was not found EXACTLY ONCE in scripts/context-io.ts, so the ` +
      `mutation mutated nothing and the case built on it proves nothing — anchor: ${anchor}`,
  ).toBe(1);
  const mutated = source.replace(anchor, replacement);
  expect(
    mutated.includes(anchor),
    `PREMISE: the anchor for ${what} survived the mutation, so the mirror is not the source minus ` +
      `one edit`,
  ).toBe(false);
  return mutated;
}

/**
 * INSERT after an anchor that must occur EXACTLY ONCE, keeping the same discipline in the shape an
 * insertion needs. `replaceExactlyOnce` asserts the anchor is ABSENT afterwards, which is the right
 * check for a rewrite and the WRONG one for an insertion — an insertion deliberately keeps its
 * anchor, and asserting its absence would fail on a mutation that worked perfectly. So the
 * insertion's equivalent is asserted instead: the anchor occurred once before and still occurs
 * exactly once after (it did not multiply), and the inserted text was absent before and occurs
 * exactly once after (it landed, once).
 */
function insertExactlyOnceAfter(
  source: string,
  anchor: string,
  insertion: string,
  what: string,
): string {
  expect(
    source.split(anchor).length - 1,
    `PREMISE: the anchor for ${what} was not found EXACTLY ONCE in scripts/context-io.ts, so the ` +
      `insertion landed nowhere or in more than one place — anchor: ${anchor}`,
  ).toBe(1);
  expect(
    source.includes(insertion),
    `PREMISE: the text ${what} inserts was ALREADY present in scripts/context-io.ts, so its ` +
      `presence afterwards would prove nothing`,
  ).toBe(false);
  const mutated = source.replace(anchor, `${anchor}${insertion}`);
  expect(mutated.split(anchor).length - 1, `PREMISE: the anchor for ${what} multiplied`).toBe(1);
  expect(
    mutated.split(insertion).length - 1,
    `PREMISE: ${what} did not land exactly once in the mirror`,
  ).toBe(1);
  return mutated;
}

/** A mirror of the live TypeScript source with one transformation applied. */
function mirrorOfContextIoTs(transform: (source: string) => string, prefix: string): string {
  const path = join(freshTmp(prefix), "context-io.ts");
  writeFileSync(path, transform(readFileSync(CONTEXT_IO_TS, "utf8")));
  return path;
}

describe("31-10 — the refusal derivation is a control, not a coincidence", () => {
  it("a SEEDED extra refusal site moves the count UP by exactly one and adds exactly its signature", () => {
    const mirror = mirrorOfContextIoTs(
      (source) =>
        insertExactlyOnceAfter(
          source,
          REFUSAL_SEED_ANCHOR,
          `\n  if (task === "seeded-control") return ["${SEEDED_REFUSAL_TEXT}"];`,
          "the seeded refusal site",
        ),
      "ctx-io-refusal-seed-",
    );
    const before = derivedRefusalSignatures(CONTEXT_IO_TS);
    const after = derivedRefusalSignatures(mirror);
    expect(after.length).toBe(EXPECTED_ADMIT_REFUSAL_SITE_COUNT + 1);
    expect(after).toContain(SEEDED_REFUSAL_TEXT);
    // …and NOTHING ELSE moved: the seeded signature is the only difference, so the count change is
    // caused by the seed rather than by a derivation that broke and started reporting some other set.
    expect(after.filter((s) => s !== SEEDED_REFUSAL_TEXT)).toEqual(before);
  });

  it("a REMOVED refusal site moves the count DOWN by exactly one", () => {
    // The removal rewrites a refusal `return [...]` into `return findings;` — a return of an
    // IDENTIFIER, which is exactly what the derivation declines to count. That is the sharper
    // mutation: it proves the matcher discriminates on the returned SHAPE, not merely on the word
    // `return`.
    const mirror = mirrorOfContextIoTs(
      (source) =>
        replaceExactlyOnce(
          source,
          REFUSAL_REMOVAL_ANCHOR,
          "if (!parsed) return findings;",
          "the removed refusal site",
        ),
      "ctx-io-refusal-remove-",
    );
    const after = derivedRefusalSignatures(mirror);
    expect(after.length).toBe(EXPECTED_ADMIT_REFUSAL_SITE_COUNT - 1);
    expect(after).not.toContain("admission FAIL: no YAML frontmatter fence (--- ... ---) found");
  });

  it("a RENAMED authority fires the PREMISE, not the member comparison", () => {
    // The distinction this case exists for: a derivation that found NOTHING must fail as "the
    // harness measured nothing", never as "the members disagree". The second reads like a real
    // finding about the module and is the false-premise shape this repository has recorded six times.
    const mirror = mirrorOfContextIoTs(
      (source) =>
        replaceExactlyOnce(
          source,
          AUTHORITY_DECLARATION_ANCHOR,
          `export function ${ADMIT_AUTHORITY}RenamedForPremiseControl(`,
          "the renamed authority declaration",
        ),
      "ctx-io-refusal-rename-",
    );
    const derived = deriveAdmitRefusalSites(mirror);
    expect(derived.declarationFound).toBe(false);
    expect(derived.sites).toHaveLength(0);
    expect(() => assertAdmitRefusalPremise(derived)).toThrow(/PREMISE/);
    // The parse itself still worked — which is what makes this a premise failure about the SUBJECT
    // rather than about the parser.
    expect(derived.declared.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE — every member of the derived set is exercised.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The verifier's fabricated provenance, verbatim: a gate run that never existed. */
const FABRICATED_RUN = "no-such-gate-run-ever-existed";
const FABRICATED_SHA = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
const FABRICATED_CONTENT_HASH = "0123456789abcdef".repeat(4);

function fabricatedEvidence(): Parameters<typeof mod.appendNote>[1] {
  return {
    kind: "artifact-ref",
    by: "qe-e2e",
    at: "2026-09-07T09:00:00Z",
    verified_by: "",
    confidence: "high",
    refs: ["tests/e2e/uat/TICKET-1.uat.spec.ts"],
    supersedes: null,
    sha: FABRICATED_SHA,
    gate_run: FABRICATED_RUN,
    content_hash: FABRICATED_CONTENT_HASH,
  };
}

function noteFileCount(contextRoot: string, task: string): number {
  const dir = join(contextRoot, task, "notes");
  return existsSync(dir) ? readdirSync(dir).length : 0;
}

/**
 * How one writer is exercised.
 *
 *  • `behavioral` — the writer accepts a caller-supplied kind, so it CAN be asked to author an
 *    artifact-ref. It is driven with the fabricated provenance and must refuse, writing nothing.
 *  • `structural` — the writer composes its note's `kind` from a SOURCE LITERAL, so it cannot
 *    express the kind at all. The impossibility is asserted POSITIVELY off the parsed source rather
 *    than left as an untested silence: an unexercised member is precisely what this file removes.
 */
type Exercise =
  | { readonly mode: "behavioral"; readonly drive: (contextRoot: string, task: string) => string }
  | { readonly mode: "structural"; readonly composedKind: string };

const WRITER_EXERCISES: Record<string, Exercise> = {
  appendNote: {
    mode: "behavioral",
    drive: (contextRoot, task) => {
      try {
        mod.appendNote(task, fabricatedEvidence(), "body", contextRoot);
        return ""; // no refusal — the caller asserts this is a failure
      } catch (e) {
        return (e as Error).message;
      }
    },
  },
  admitAndAppend: {
    mode: "behavioral",
    drive: (contextRoot, task) => {
      // A fresh repoRoot with no config at all → the lean dial, so governance is not the decider.
      const result = mod.admitAndAppend(
        task,
        fabricatedEvidence(),
        "body",
        contextRoot,
        freshTmp("ctx-io-writer-repo-"),
      );
      return result.id === null ? result.findings.join("\n") : "";
    },
  },
  // STRUCTURAL IMPOSSIBILITY, NOT A BEHAVIOURAL REFUSAL. `emitVerdict` composes `kind: "finding"`
  // from a literal and takes no kind from its caller; there is no argument that makes it author an
  // artifact-ref. Asserted off the source below, and paired with the `artifact-ref` absence check.
  emitVerdict: { mode: "structural", composedKind: "finding" },
  // Likewise `emitCheckpointNote`: a fixed reserved-identity emitter over a roster-checked input.
  emitCheckpointNote: { mode: "structural", composedKind: "finding" },
};

/** The `kind:` string literals a named function composes, read off the parsed source. */
function composedKindLiterals(sourcePath: string, functionName: string): string[] {
  const source = ts.createSourceFile(
    "context-io.ts",
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const found: string[] = [];
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || statement.name?.text !== functionName) continue;
    const walk = (node: ts.Node): void => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "kind" &&
        ts.isStringLiteral(node.initializer)
      ) {
        found.push(node.initializer.text);
      }
      ts.forEachChild(node, walk);
    };
    if (statement.body) walk(statement.body);
  }
  return found;
}

/** The source text of one named top-level function, for the absence check below. */
function functionSource(sourcePath: string, functionName: string): string {
  const text = readFileSync(sourcePath, "utf8");
  const source = ts.createSourceFile("context-io.ts", text, ts.ScriptTarget.Latest, true);
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === functionName) {
      return text.slice(statement.getStart(source), statement.getEnd());
    }
  }
  return "";
}

describe("31-05 — every derived note writer is exercised against fabricated provenance", () => {
  it("the exercise table's key set EQUALS the derived writer set", () => {
    // Asserted BEFORE any driver runs. A writer that landed with no driver would otherwise be
    // silently skipped by the loop below, which is the exact silence this file exists to remove.
    expect(
      Object.keys(WRITER_EXERCISES).sort(),
      "a derived note writer has no driver in WRITER_EXERCISES (or a driver names a function that " +
        "is no longer a writer). Every writer is exercised or the set is not covered",
    ).toEqual(deriveNoteWriters(CONTEXT_IO_TS));
  });

  for (const name of EXPECTED_NOTE_WRITERS) {
    it(`${name}: refuses the fabricated artifact-ref, or cannot express the kind at all`, () => {
      const exercise = WRITER_EXERCISES[name];
      expect(exercise, `${name} has no exercise`).toBeDefined();
      if (exercise.mode === "behavioral") {
        const contextRoot = freshTmp(`ctx-io-writer-${name}-`);
        const task = "writer-set-task";
        const before = noteFileCount(contextRoot, task);
        const refusal = exercise.drive(contextRoot, task);
        expect(
          refusal,
          `${name} accepted a fabricated gate_run — the admission authority was not reached`,
        ).not.toBe("");
        expect(refusal).toContain(FABRICATED_RUN);
        expect(
          noteFileCount(contextRoot, task),
          `${name} refused but left a file behind — "nothing is written" must be true of the disk`,
        ).toBe(before);
      } else {
        const literals = composedKindLiterals(CONTEXT_IO_TS, name);
        expect(
          literals,
          `${name}'s composed kind is no longer a single source literal, so it may now be able to ` +
            `author an artifact-ref and needs a behavioural driver instead of this assertion`,
        ).toEqual([exercise.composedKind]);
        expect(exercise.composedKind).not.toBe("artifact-ref");
        // A second, independent structural fact: the kind does not appear in the function at all.
        expect(
          functionSource(CONTEXT_IO_TS, name).includes("artifact-ref"),
          `${name} names the artifact-ref kind in its body — the structural impossibility claimed ` +
            `for it is no longer obviously true and must be re-derived`,
        ).toBe(false);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FOUR — the refusal is WATCHED FAILING.
//
// A control nobody has seen fail is a claim. The committed .js is mirrored, the authority call in
// appendNote is textually neutralized, and the fabricated artifact-ref is then WRITTEN in the
// mirror — which is what proves the live refusal is caused by that call and not by an unrelated check.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const AUTHORITY_CALL = "const admission = admit(task, text, contextRoot, repoRoot);";

/**
 * The mutation that RE-INTRODUCES the deleted kind axis (31-09).
 *
 * The former anchor here was `if (normalizeKind(note.kind) === "artifact-ref")` — the comparison
 * that scoped 31-05's authority call to one kind. It no longer exists in the source, because the fix
 * for CR-05 DELETED the axis rather than widening it, so an anchor naming it would now match nothing
 * and every case built on it would silently measure the live module.
 *
 * The replacement mutation restores exactly that scoping on a mirror of the committed `.js`. It is
 * the sharper control: the neutralizing mirror above shows that SOME authority call is load-bearing,
 * while this one shows that the call being UNCONDITIONAL is what refuses a fabricated `finding`
 * stamp. Both mutate the same one-occurrence anchor, so the two cases differ by one edit each.
 */
const KIND_SCOPED_AUTHORITY =
  'const admission = normalizeKind(note.kind) === "artifact-ref" ? admit(task, text, contextRoot, repoRoot) : [];';

/**
 * A mirror of the COMMITTED .js with one anchor textually replaced — the same program minus (or
 * minus the strength of) one decision, so a difference in behaviour is attributable to that one
 * edit and to nothing else.
 *
 * The anchor's presence is asserted at EXACTLY one occurrence before the mutation and its absence
 * after it. A mutation that matched nothing would produce an unmutated copy, and every "the mirror
 * writes" assertion would then be measuring the live module while claiming otherwise.
 */
async function mirrorOfCommittedJs(
  anchor: string,
  replacement: string,
  prefix: string,
): Promise<typeof import("./context-io.js")> {
  const original = readFileSync(CONTEXT_IO_JS, "utf8");
  expect(
    original.split(anchor).length - 1,
    `PREMISE: the anchor was not found exactly once in the committed scripts/context-io.js, so the ` +
      `mutation mutated nothing and the case built on it proves nothing — anchor: ${anchor}`,
  ).toBe(1);
  const mutated = original
    .replace(anchor, replacement)
    // Point the mirror's relative imports at the REAL sibling modules, so the copy is the same
    // program minus one decision rather than a differently-wired one.
    .replace(
      /from "\.\/([A-Za-z0-9._-]+\.js)"/g,
      (_m, file: string) => `from "${pathToFileURL(join(ROOT, "scripts", file)).href}"`,
    );
  expect(mutated.includes(anchor), "PREMISE: the anchor survived the mutation").toBe(false);
  const mirrorPath = join(freshTmp(prefix), "context-io.js");
  writeFileSync(mirrorPath, mutated);
  return (await import(pathToFileURL(mirrorPath).href)) as typeof import("./context-io.js");
}

describe("31-05 — neutralizing the authority call makes the fabricated evidence WRITE", () => {
  it("the neutralized mirror of the committed .js writes what the live module refuses", async () => {
    const neutralized = await mirrorOfCommittedJs(
      AUTHORITY_CALL,
      "const admission = [];",
      "ctx-io-neutralized-",
    );
    const contextRoot = freshTmp("ctx-io-neutralized-ctx-");
    const task = "writer-set-task";
    const id = neutralized.appendNote(task, fabricatedEvidence(), "body", contextRoot);
    expect(id).toBeTruthy();
    expect(noteFileCount(contextRoot, task)).toBe(1);
    // …and the LIVE module refuses the identical call, which is the comparison that makes the
    // mirror meaningful rather than merely different.
    const liveRoot = freshTmp("ctx-io-neutralized-live-");
    expect(() => mod.appendNote(task, fabricatedEvidence(), "body", liveRoot)).toThrow(
      new RegExp(FABRICATED_RUN),
    );
    expect(noteFileCount(liveRoot, task)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FIVE-A — the authority call being UNCONDITIONAL is watched failing (31-09, CR-05).
//
// WHAT THIS PART USED TO ASK, AND WHY IT CHANGED. Under 31-05 the authority call was scoped by
// `normalizeKind(note.kind) === "artifact-ref"`, and this part red-teamed the SPELLING of that
// comparison: a raw `note.kind === "artifact-ref"` would have held a NARROWER view of the kind than
// the store (a padded `kind: "artifact-ref "` skips the raw comparison and persists as a real
// artifact-ref — the GAP-R7-1 Lever-1 divergence). That question is now VACUOUS in the strongest
// possible way: there is no kind comparison at all, so no spelling of one can be narrow. A padded
// kind cannot skip a call that is not conditional.
//
// So this part asks the question one level up, which is the one the round-2 verifier actually
// answered NO to: is the call's UNCONDITIONALITY what refuses a fabricated `finding` stamp? The
// mirror re-introduces the deleted scoping and WRITES the note the live module refuses.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The round-2 verifier's fabricated finding stamp, verbatim (31-VERIFICATION.md). */
const CR05_FABRICATED_RUN = "fabricated-run-id";

function fabricatedFinding(): Parameters<typeof mod.appendNote>[1] {
  return {
    kind: "finding",
    by: "qe-e2e",
    at: "2026-09-08T01:00:00Z",
    verified_by: `§14-gate#${CR05_FABRICATED_RUN}`,
    confidence: "high",
    refs: [],
    supersedes: null,
  };
}

describe("31-09 — re-scoping the authority call to one kind re-opens the fabricated finding stamp", () => {
  it("a mirror that RESTORES the kind scoping writes the fabricated finding the live module refuses", async () => {
    const scoped = await mirrorOfCommittedJs(
      AUTHORITY_CALL,
      KIND_SCOPED_AUTHORITY,
      "ctx-io-kindscoped-",
    );
    const contextRoot = freshTmp("ctx-io-kindscoped-ctx-");
    const task = "writer-set-task";
    const id = scoped.appendNote(task, fabricatedFinding(), "body", contextRoot);
    expect(id).toBeTruthy();
    expect(noteFileCount(contextRoot, task)).toBe(1);
    // …and the mirror still refuses the fabricated ARTIFACT-REF, which is what makes this a
    // one-axis difference rather than a broken copy: the restored scoping removes exactly the
    // finding arm and nothing else.
    const otherRoot = freshTmp("ctx-io-kindscoped-ar-");
    expect(() => scoped.appendNote(task, fabricatedEvidence(), "body", otherRoot)).toThrow(
      new RegExp(FABRICATED_RUN),
    );
    expect(noteFileCount(otherRoot, task)).toBe(0);
  });

  it("the LIVE module refuses the identical finding, and the refusal comes from the authority", () => {
    const contextRoot = freshTmp("ctx-io-kindscoped-live-");
    const task = "writer-set-task";
    let message = "";
    try {
      mod.appendNote(task, fabricatedFinding(), "body", contextRoot);
    } catch (e) {
      message = (e as Error).message;
    }
    // "admission FAIL" rather than "invalid note": a fabricated gate stamp is structurally VALID, so
    // validate() lets it by and only the admission call stands between it and the disk.
    expect(message).toContain("admission FAIL");
    expect(message).toContain(CR05_FABRICATED_RUN);
    expect(noteFileCount(contextRoot, task)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FIVE-B — the ONE deliberate skip is PRIVATE, and its caller set is DERIVED and COUNTED.
//
// Deleting the kind axis moved the degree of freedom rather than removing it. `admitAndAppend` has
// two branches that have already adjudicated their note, so they persist through a module-private
// route that performs no admission of its own. That route is the NEW axis, and this repository's
// standing lesson is that a route which skips a safety check is bounded by derivation or not at all.
//
// Three separate assertions, on purpose: the member set, the call-site COUNT, and the absence of an
// export modifier. A change to any one of them reads differently from a change to the others.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The one function permitted to reach the pre-admitted write route. */
const EXPECTED_PRE_ADMITTED_CALLERS = Object.freeze(["admitAndAppend"]);

/** Its two adjudicated branches — the gated one and the non-gated one. A third is a decision. */
const EXPECTED_PRE_ADMITTED_CALL_SITES = 2;

/** The private route's name, in one place, so the three assertions below cannot drift apart. */
const PRE_ADMITTED_ROUTE = "appendPreAdmittedNote";

interface PreAdmittedDerivation {
  /** Function name → how many times its body calls the private route. */
  readonly callers: Map<string, number>;
  /** Total call sites across the module. */
  readonly sites: number;
  /** Whether the route itself carries an `export` modifier; null when it was not declared at all. */
  readonly exported: boolean | null;
  /** Every top-level function name the parse found — the premise. */
  readonly declared: string[];
}

function derivePreAdmittedCallers(sourcePath: string): PreAdmittedDerivation {
  const source = ts.createSourceFile(
    "context-io.ts",
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const callers = new Map<string, number>();
  const declared: string[] = [];
  let sites = 0;
  let exported: boolean | null = null;
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
    declared.push(statement.name.text);
    if (statement.name.text === PRE_ADMITTED_ROUTE) {
      exported = (ts.getModifiers(statement) ?? []).some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
    }
    let count = 0;
    const walk = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === PRE_ADMITTED_ROUTE
      ) {
        count += 1;
      }
      ts.forEachChild(node, walk);
    };
    if (statement.body) walk(statement.body);
    if (count > 0) {
      callers.set(statement.name.text, count);
      sites += count;
    }
  }
  return { callers, sites, exported, declared };
}

describe("31-09 — the private pre-admitted write route is bounded by derivation", () => {
  it("PREMISE: the parse found declarations AND found the private route itself", () => {
    // ASSERT THE HARNESS'S OWN PREMISE FIRST. A parse that yielded nothing returns an empty caller
    // map, which satisfies "no unexpected caller" vacuously — and a false verification-harness
    // premise is a mistake this repository has recorded six times across four rounds.
    const derived = derivePreAdmittedCallers(CONTEXT_IO_TS);
    expect(
      derived.declared.length,
      "PREMISE: the TypeScript parse of scripts/context-io.ts yielded ZERO top-level function " +
        "declarations, so every claim below measured nothing at all",
    ).toBeGreaterThan(0);
    expect(
      derived.declared,
      `PREMISE: no function named ${PRE_ADMITTED_ROUTE} was declared, so its caller set is empty ` +
        `for a reason that says nothing about whether a route around admission exists`,
    ).toContain(PRE_ADMITTED_ROUTE);
    expect(derived.exported).not.toBeNull();
  });

  it("the derived caller set has exactly the expected MEMBERS", () => {
    expect(
      [...derivePreAdmittedCallers(CONTEXT_IO_TS).callers.keys()].sort(),
      `a function other than ${EXPECTED_PRE_ADMITTED_CALLERS.join("/")} can now reach the write ` +
        `chokepoint WITHOUT consulting the admission authority. That is the shape the original ` +
        `bypass had, so a new caller is a decision with a written reason at its site, never a ` +
        `widened constant here`,
    ).toEqual([...EXPECTED_PRE_ADMITTED_CALLERS]);
  });

  it("the derived call-site COUNT is asserted separately from the member set", () => {
    // Separate on purpose: a THIRD call inside admitAndAppend would leave the member set unchanged
    // and is exactly as much of a decision as a new caller would be.
    expect(
      derivePreAdmittedCallers(CONTEXT_IO_TS).sites,
      "the number of places that reach the write chokepoint without an admission moved; each one " +
        "is a branch that must carry its own written reason for skipping the authority",
    ).toBe(EXPECTED_PRE_ADMITTED_CALL_SITES);
  });

  it("the private route and the compose helper carry NO export modifier", () => {
    expect(
      derivePreAdmittedCallers(CONTEXT_IO_TS).exported,
      `${PRE_ADMITTED_ROUTE} is exported. An exported route that skips the admission authority is ` +
        `reachable by any importer, which is a bypass with a friendly name`,
    ).toBe(false);
    const analysis = analyze(CONTEXT_IO_TS);
    for (const name of [PRE_ADMITTED_ROUTE, "composeValidatedNote"]) {
      expect(analysis.calls.has(name), `${name} was not found as a top-level declaration`).toBe(true);
      expect(analysis.exported.has(name), `${name} carries an export modifier`).toBe(false);
    }
  });

  it("the derivation DISCRIMINATES — a seeded second caller moves BOTH the set and the count", () => {
    const dir = freshTmp("ctx-io-preadmitted-mirror-");
    const path = join(dir, "context-io.ts");
    writeFileSync(
      path,
      readFileSync(CONTEXT_IO_TS, "utf8") +
        `\nfunction seededSecondPreAdmittedCaller(task: string, note: NoteInput, body: string, root: string): string {\n` +
        `  return ${PRE_ADMITTED_ROUTE}(task, note, body, root);\n}\n`,
    );
    const derived = derivePreAdmittedCallers(path);
    expect([...derived.callers.keys()].sort()).toContain("seededSecondPreAdmittedCaller");
    expect([...derived.callers.keys()].sort()).not.toEqual([...EXPECTED_PRE_ADMITTED_CALLERS]);
    expect(derived.sites).toBe(EXPECTED_PRE_ADMITTED_CALL_SITES + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FIVE — the reachability facts, computed and asserted rather than described.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function trackedFiles(...globs: string[]): string[] {
  const listed = spawnSync("git", ["ls-files", ...globs], { cwd: ROOT, encoding: "utf8" });
  expect(
    listed.status,
    "PREMISE: `git ls-files` did not run, so the reachability counts below were never measured — " +
      "a premise that could not be checked FAILS here rather than being skipped",
  ).toBe(0);
  return (listed.stdout ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

describe("31-05 — the reachability remainder is written down", () => {
  it("the appendNote call sites in tracked non-test sources are counted", () => {
    const sources = trackedFiles("scripts/*.ts", "hooks/*.ts", "install/*.ts").filter(
      (p) => !p.endsWith(".test.ts"),
    );
    expect(sources.length, "PREMISE: no tracked sources were listed at all").toBeGreaterThan(10);
    let total = 0;
    for (const rel of sources) {
      total += (readFileSync(join(ROOT, rel), "utf8").match(/appendNote\(/g) ?? []).length;
    }
    expect(
      total,
      "the number of places that can invoke the sanctioned note writer moved. Each one is a place " +
        "an artifact-ref could be authored, so the count is a decision rather than a bumped constant",
    ).toBe(EXPECTED_APPEND_NOTE_CALL_SITES);
  });

  it("the agent-factory documents that name appendNote are counted", () => {
    const docs = trackedFiles("agent-factory/**").filter((rel) =>
      readFileSync(join(ROOT, rel), "utf8").includes("appendNote"),
    );
    expect(
      docs.length,
      `the kit documents naming appendNote are [${docs.join(", ")}] — a document that names the ` +
        `sanctioned writer states what an agent may do with it, so a new one is prose that must be ` +
        `checked against the mechanism rather than a number to bump`,
    ).toBe(EXPECTED_AGENT_FACTORY_MENTIONS);
  });

  it("the non-note-writer filesystem residual is derived, and it is atomicWrite", () => {
    const analysis = analyze(CONTEXT_IO_TS);
    const nonWriters = [...analysis.exported].filter(
      (name) => !closureOf(analysis, name).has("writeNoteFile"),
    );
    // DIRECT callers of a filesystem write primitive: these write where their CALLER points them,
    // which is what makes them reachable from a hand-authored path.
    const direct = nonWriters
      .filter((name) =>
        FS_WRITE_PRIMITIVES.some((primitive) => (analysis.calls.get(name) ?? new Set()).has(primitive)),
      )
      .sort();
    expect(
      direct,
      "an exported non-note-writer gained a direct filesystem write. It is not bound by the " +
        "admission authority and nothing in this file binds it, so it belongs in " +
        "NON_NOTE_WRITER_RESIDUALS with a disposition, or it belongs behind writeNoteFile",
    ).toEqual([...NON_NOTE_WRITER_RESIDUALS]);
    // The wider transitive remainder is bounded too: the others reach the filesystem only through
    // a path THEY derive (the audit ledger, the rendered index), never one a caller hands them.
    const transitive = nonWriters.filter((name) =>
      FS_WRITE_PRIMITIVES.some((primitive) => closureOf(analysis, name).has(primitive)),
    );
    expect(
      transitive.length,
      "the set of exported non-note-writers that can reach the filesystem at all moved; the " +
        "residual disclosure above is stated against a remainder that is no longer the measured one",
    ).toBe(3);
  });

  it("the filesystem alphabet the residual is derived over is itself bounded", () => {
    // FS_WRITE_PRIMITIVES is the one hand-written set in this file, and a hand-written set that
    // nobody bounds is this repository's second systemic failure class: it rots while green. The
    // module can only reach the filesystem through what it IMPORTS, so the import clause is the
    // bound. Its cardinality is asserted rather than its contents, so a NEW node:fs binding — the
    // only way a new write primitive can appear — turns this file red and a human classifies it.
    const source = ts.createSourceFile(
      "context-io.ts",
      readFileSync(CONTEXT_IO_TS, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const bindings: string[] = [];
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
      if (statement.moduleSpecifier.text !== "node:fs") continue;
      const named = statement.importClause?.namedBindings;
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) bindings.push(element.name.text);
      }
    }
    expect(bindings.length, "PREMISE: no node:fs bindings were parsed at all").toBeGreaterThan(0);
    expect(
      bindings.length,
      `scripts/context-io.ts now imports [${bindings.join(", ")}] from node:fs. A binding was added ` +
        `or removed, so the write-primitive alphabet this file derives its residual over must be ` +
        `re-classified rather than assumed unchanged`,
    ).toBe(14);
  });
});
