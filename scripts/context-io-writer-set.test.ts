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
  mkdirSync,
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

/**
 * Every EXPORTED function of scripts/context-io.ts whose call closure reaches writeNoteFile.
 *
 * MEASURED, WITH THE REASON IT MOVED (31-14): 4 -> 5. The derivation was re-run against the
 * post-31-14 source and its output READ — `["admitAndAppend","appendNote","emitCheckpointNote",
 * "emitVerdict","promoteAdmitted"]` — rather than the constant being adjusted until the case passed.
 * The new member is the proof-gated re-binding route: it is exported, and it reaches the note-file
 * write chokepoint on BOTH of its paths (through `appendPreAdmittedNote` when its proof holds, and
 * through `appendNote` when the note is outside its entry set). So it is a note writer, and the
 * (writer x refusal-family) matrix below gains a whole COLUMN with it.
 */
const EXPECTED_NOTE_WRITERS = Object.freeze([
  "admitAndAppend",
  "appendNote",
  "emitCheckpointNote",
  "emitVerdict",
  "promoteAdmitted",
]);

/** The cardinality of that set. A sixth writer is a decision, never a bumped constant. */
const EXPECTED_NOTE_WRITER_COUNT = 5;

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
 *
 * MEASURED AGAIN, WITH THE REASON IT MOVED (31-14): 4 -> 5. The derivation was re-run and read:
 * `[["scripts/check-uat-oracles.ts",2],["scripts/compactor.ts",1],["scripts/context-io.ts",2]]`. The
 * fifth occurrence is `promoteAdmitted`'s FALL-THROUGH in scripts/context-io.ts — a note outside the
 * re-binding route's entry set (a gate stamp, an empty stamp) takes full admission there, which is
 * how a promoted `finding` and `artifact-ref` keep being re-bound at the destination. It is a place
 * an artifact-ref can be authored, so it is counted here exactly like the other four.
 */
const EXPECTED_APPEND_NOTE_CALL_SITES = 5;

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

// ─── The probe fixtures. One per derived refusal site, reusing proven setups. ───────────────────

/** The body every probe carries. Its content decides nothing; only the provenance does. */
const PROBE_BODY = "the probe body";

/** A DIFFERENT stable 40-hex commit id — the stale sha the D-03 mismatch arm must name. */
const PROBE_STALE_SHA = "b0a9f8e7d6c5b4a3d2e1c0f9b8a7f6e5d4c3b2a1";

/**
 * The note TEXT the writers actually hand the authority, composed by the MODULE'S OWN composer.
 *
 * WHY NOT A LITERAL IN THIS FILE. `admit()` takes a text, not a note, so a probe driven directly at
 * the authority needs one — and hand-writing the frontmatter here would put a SECOND composer beside
 * the module's, which is this repository's named failure class applied to the harness itself. So the
 * text is obtained from the committed `.js` with the authority call neutralized: the same compose
 * and the same validate the live writer performs, minus the one decision under test. What the direct
 * probe is handed is therefore exactly what the writer would have handed it.
 */
let composeMirrorPromise: Promise<typeof import("./context-io.js")> | null = null;
function composeMirror(): Promise<typeof import("./context-io.js")> {
  composeMirrorPromise ??= mirrorOfCommittedJs(
    AUTHORITY_CALL,
    "const admission = [];",
    "ctx-io-compose-mirror-",
  );
  return composeMirrorPromise;
}

async function composedNoteText(note: Parameters<typeof mod.appendNote>[1]): Promise<string> {
  const mirror = await composeMirror();
  const scratch = freshTmp("ctx-io-compose-scratch-");
  const task = "compose-scratch-task";
  const id = mirror.appendNote(task, note, PROBE_BODY, scratch);
  return readFileSync(join(scratch, task, "notes", `${id}.md`), "utf8");
}

/** A repo root carrying a governance configuration file with the given raw bytes. */
function repoWithRawConfig(raw: string): string {
  const root = freshTmp("ctx-io-probe-repo-");
  mkdirSync(join(root, ".grugops"), { recursive: true });
  writeFileSync(join(root, ".grugops", "factory.config.json"), raw);
  return root;
}

/** A repo root whose governance dial is set — the same shape `scripts/context-io.test.ts` writes. */
function repoWithGovernance(context: Record<string, string>): string {
  return repoWithRawConfig(JSON.stringify({ context }, null, 2));
}

/** Emit a REAL live green verdict for a per-run id, through the module's own sole emitter. */
function seedGreenVerdict(contextRoot: string, task: string, runId: string, at?: string): void {
  mod.emitVerdict(task, runId, "clean", FABRICATED_SHA, contextRoot, at);
}

/**
 * A live green verdict that recorded NO sha, written to disk by hand.
 *
 * The ONE probe fixture this file authors as raw note text, and deliberately: since plan 31-01 the
 * sole emitter REFUSES to mint a verdict without a sha, so the shape that reaches the "recorded no
 * commit SHA" site is exactly a verdict minted before that change or hand-written onto disk. A
 * fixture that could be produced by the emitter would not reach the site at all.
 */
function seedShalessVerdict(contextRoot: string, task: string, runId: string): void {
  const id = "20260908T080000Z-§14-gate-finding-shaless01";
  const dir = join(contextRoot, task, "notes");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${id}.md`),
    "---\n" +
      `id: ${id}\n` +
      "kind: finding\nby: §14-gate\nat: 2026-09-08T08:00:00Z\nverified_by: \nconfidence: high\n" +
      `refs:\n  - §14-gate#${runId}\n` +
      "supersedes: \n---\n\nREADY_FOR_HUMAN_REVIEW: the §14 quality gate run passed (all checks green).\n",
  );
}

/** A soft-kind note with no stamp — the shape that reaches the governance read without a stamp arm. */
function softNote(over: Partial<Parameters<typeof mod.appendNote>[1]> = {}) {
  return {
    kind: "observation",
    by: "software-engineer",
    at: "2026-09-08T02:00:00Z",
    verified_by: "",
    confidence: "high",
    refs: [],
    supersedes: null,
    ...over,
  } as Parameters<typeof mod.appendNote>[1];
}

/** An artifact-ref carrying the full provenance triple; every field overridable. */
function artifactRefNote(over: Partial<Parameters<typeof mod.appendNote>[1]> = {}) {
  return {
    ...fabricatedEvidence(),
    gate_run: "RUN-PROBE",
    ...over,
  } as Parameters<typeof mod.appendNote>[1];
}

/**
 * ONE PROBE PER DERIVED REFUSAL SITE.
 *
 * `rawText` is carried only by a site no writer can compose an input for; every other probe is a
 * NOTE, so the SAME probe drives the direct-authority discrimination check below AND every writer
 * cell in the matrix. That sharing is deliberate: a probe that tripped a site directly but was
 * quietly swapped for something else at the writer would prove nothing about the writer.
 */
interface RefusalProbe {
  /** A note text no writer can compose. Present only where the site takes one. */
  readonly rawText?: string;
  /** The note a writer is asked to author. */
  readonly note?: () => Parameters<typeof mod.appendNote>[1];
  /** Seed the task context so the site's precondition holds. */
  readonly seed?: (contextRoot: string, task: string) => void;
  /** The governance root the site needs; a fresh empty root (the lean dial) when absent. */
  readonly repoRoot?: () => string;
}

const REFUSAL_PROBE_SPECS: Readonly<Record<string, RefusalProbe>> = Object.freeze({
  // The authority delegates its structural check to validate() before this site, so the input that
  // WOULD reach it is refused one authority earlier. Kept as a probe rather than dropped, because
  // the disposition below has to DRIVE it to prove which authority answered.
  S1: { rawText: "no frontmatter fence here\n" },
  // D-01: a finding stamped against a per-run id no live green verdict certifies.
  S2: {
    note: () =>
      softNote({ kind: "finding", by: "qe-e2e", verified_by: "§14-gate#no-such-gate-run" }),
  },
  // D-03 a: an artifact-ref naming a gate run with no verdict at all.
  S3: { note: () => artifactRefNote({ gate_run: "RUN-ABSENT" }) },
  // D-03 b: two live green verdicts sharing one per-run id — ambiguity refuses in both directions.
  S4: {
    note: () => artifactRefNote({ gate_run: "RUN-DUPLICATE" }),
    seed: (contextRoot, task) => {
      seedGreenVerdict(contextRoot, task, "RUN-DUPLICATE", "2026-09-08T03:00:00Z");
      seedGreenVerdict(contextRoot, task, "RUN-DUPLICATE", "2026-09-08T04:00:00Z");
    },
  },
  // D-03 c: the matched verdict recorded no commit, so the evidence is unbindable.
  S5: {
    note: () => artifactRefNote({ gate_run: "RUN-SHALESS" }),
    seed: (contextRoot, task) => seedShalessVerdict(contextRoot, task, "RUN-SHALESS"),
  },
  // D-03 d: the evidence claims a different commit than the run it names was performed at.
  S6: {
    note: () => artifactRefNote({ gate_run: "RUN-BOUND", sha: PROBE_STALE_SHA }),
    seed: (contextRoot, task) => seedGreenVerdict(contextRoot, task, "RUN-BOUND"),
  },
  // D-14: a governance configuration that exists and cannot be parsed. A SOFT kind, so neither stamp
  // arm above can answer first and the governance read is the only thing left to decide it.
  S7: { note: () => softNote(), repoRoot: () => repoWithRawConfig("{ not valid json ]]]") },
  // D-04: a high-severity finding under an active dial, its §14-gate cross-check deliberately
  // SATISFIED by a real seeded verdict so the dial is the only remaining decider.
  S8: {
    note: () =>
      softNote({ kind: "finding", by: "security-nfr", verified_by: "§14-gate#RUN-HIGHSEV" }),
    seed: (contextRoot, task) => seedGreenVerdict(contextRoot, task, "RUN-HIGHSEV"),
    repoRoot: () => repoWithGovernance({ human_admission: "high-severity" }),
  },
});

/** The site handle for a derived signature, or "" when the site has no spec row. */
function siteKeyOf(signature: string): string {
  return REFUSAL_SITE_SPECS.find((spec) => spec.signature === signature)?.key ?? "";
}

/**
 * THE PROBE RECORD, KEYED BY DERIVED SIGNATURE.
 *
 * Built by walking the DERIVED set and looking each signature's probe up through the site-handle
 * bijection. A derived site with no spec row, or a spec row with no probe, simply produces no key —
 * so the key-set equality below reports it as a missing member rather than the build throwing
 * somewhere a reader cannot see. That is what makes the equality load-bearing instead of vacuous.
 */
function buildRefusalProbes(): Record<string, RefusalProbe> {
  const out: Record<string, RefusalProbe> = {};
  for (const signature of derivedRefusalSignatures(CONTEXT_IO_TS)) {
    const probe = REFUSAL_PROBE_SPECS[siteKeyOf(signature)];
    if (probe) out[signature] = probe;
  }
  return out;
}

const REFUSAL_PROBES: Readonly<Record<string, RefusalProbe>> = Object.freeze(buildRefusalProbes());

/**
 * Does this refusal message come from this site?
 *
 * Decided on the site's RAW static chunks, found IN ORDER. The signature has its interpolations
 * removed, so a plain substring test against it can never match a real message; the chunks are the
 * same text with the holes left open, and requiring them in order is what keeps the two sites that
 * share an opening sentence from matching each other.
 */
function matchesSite(message: string, chunks: readonly string[]): boolean {
  let cursor = 0;
  for (const chunk of chunks) {
    const at = message.indexOf(chunk, cursor);
    if (at < 0) return false;
    cursor = at + chunk.length;
  }
  return true;
}

/** Every derived signature whose site the message matches. */
function sitesTrippedBy(message: string): string[] {
  return deriveAdmitRefusalSites(CONTEXT_IO_TS)
    .sites.filter((site) => matchesSite(message, site.chunks))
    .map((site) => site.signature)
    .sort();
}

/** Prepare one probe's world: a fresh context, its seeded state, and its governance root. */
function stageProbe(probe: RefusalProbe, prefix: string): { contextRoot: string; task: string; repoRoot: string } {
  const contextRoot = freshTmp(prefix);
  const task = "matrix-task";
  if (probe.seed) probe.seed(contextRoot, task);
  const repoRoot = probe.repoRoot ? probe.repoRoot() : freshTmp("ctx-io-probe-leanrepo-");
  return { contextRoot, task, repoRoot };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE-A — the probes are proven to DISCRIMINATE before they are trusted against a writer.
//
// A probe set that trips three of eight sites and reads as complete is the same failure as a writer
// set that asks one question: the covered set looks like the whole set because nothing measured the
// difference. So the union of what the probes actually trip is asserted EQUAL to the derived set —
// in both directions, so neither an unreachable site nor an unused probe can hide — and the sites
// that are structurally unreachable are named and PROVEN unreachable rather than subtracted quietly.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * The derived sites no input can reach, each with the reason and the authority that answers instead.
 *
 * MEASURED, NOT ASSUMED (31-10). `admit()` begins by delegating the structural check to `validate()`
 * and returning its findings — the R-34 identifier return — and `validate()` refuses a fence-less
 * text with its own `structural FAIL` message. The authority's own `admission FAIL: no YAML
 * frontmatter fence` return therefore sits BEHIND that delegation and cannot be reached by any
 * input, from any writer or from a direct call. It is a defensive backstop, and this file says so
 * with a driven proof rather than counting it as covered or dropping it from the set.
 */
const UNREACHABLE_SITES: Readonly<Record<string, string>> = Object.freeze({
  S1:
    "unreachable: the authority delegates the structural check to validate() first and returns its " +
    "findings (R-34), and validate() refuses a fence-less text with `structural FAIL`. This site is " +
    "a defensive backstop behind that delegation — a DIFFERENT authority answers, and this file " +
    "names it rather than counting the refusal as evidence that this site was reached.",
});

describe("31-10 — the probe set is proven to trip every reachable refusal site", () => {
  it("the probe record's KEY SET equals the derived signature set", () => {
    // Asserted BEFORE any probe runs. A derived site with no probe would otherwise be skipped by
    // every loop below, which is the silence this plan exists to remove.
    expect(
      Object.keys(REFUSAL_PROBES).sort(),
      "a derived refusal site has no probe in REFUSAL_PROBE_SPECS (or a probe names a site handle " +
        "the authority no longer implements). Every site is probed or the set is not covered",
    ).toEqual(derivedRefusalSignatures(CONTEXT_IO_TS));
  });

  it("the unreachable-site set is a strict SUBSET of the derived set, named by handle", () => {
    const handles = derivedRefusalSignatures(CONTEXT_IO_TS).map(siteKeyOf);
    for (const key of Object.keys(UNREACHABLE_SITES)) {
      expect(handles, `${key} is declared unreachable but is not a derived site`).toContain(key);
    }
    expect(
      Object.keys(UNREACHABLE_SITES).length,
      "every derived refusal site was declared unreachable, which would make every claim below " +
        "vacuous — the harness would be measuring nothing while reporting green",
    ).toBeLessThan(handles.length);
  });

  it("the union of signatures the probes trip EQUALS the reachable derived set, both directions", async () => {
    const reachable = derivedRefusalSignatures(CONTEXT_IO_TS).filter(
      (signature) => !(siteKeyOf(signature) in UNREACHABLE_SITES),
    );
    const tripped = new Set<string>();
    for (const signature of reachable) {
      const probe = REFUSAL_PROBES[signature];
      const { contextRoot, task, repoRoot } = stageProbe(probe, `ctx-io-probe-${siteKeyOf(signature)}-`);
      const text = probe.rawText ?? (await composedNoteText((probe.note as () => Parameters<typeof mod.appendNote>[1])()));
      const findings = mod.admit(task, text, contextRoot, repoRoot);
      expect(
        findings.length,
        `the probe for ${siteKeyOf(signature)} was ADMITTED by the authority — it trips nothing, so ` +
          `every writer cell built on it would be asserting a refusal that has no source`,
      ).toBeGreaterThan(0);
      const matched = sitesTrippedBy(findings.join("\n"));
      // Exactly its own site, not merely "at least" it: a probe that also trips a neighbour would
      // let one probe stand in for two and shrink the effective set without moving any count.
      expect(
        matched,
        `the probe for ${siteKeyOf(signature)} trips ${matched.map(siteKeyOf).join("/") || "nothing"} ` +
          `— a probe that trips a site it is not registered for is a many-to-one mapping and must be ` +
          `recorded as one with its reason, never left implicit`,
      ).toEqual([signature]);
      for (const s of matched) tripped.add(s);
    }
    expect([...tripped].sort()).toEqual(reachable);
  });

  for (const [key, reason] of Object.entries(UNREACHABLE_SITES)) {
    it(`${key}: the unreachability is PROVEN, and the answering authority is named`, async () => {
      const spec = REFUSAL_SITE_SPECS.find((s) => s.key === key) as RefusalSiteSpec;
      const probe = REFUSAL_PROBE_SPECS[key];
      const { contextRoot, task, repoRoot } = stageProbe(probe, `ctx-io-unreachable-${key}-`);
      const text = probe.rawText ?? (await composedNoteText((probe.note as () => Parameters<typeof mod.appendNote>[1])()));
      const findings = mod.admit(task, text, contextRoot, repoRoot);
      // POSITIVE, not an absence: the input IS refused, and the refusal is the OTHER authority's.
      expect(findings.length, `${key}: ${reason}`).toBeGreaterThan(0);
      const joined = findings.join("\n");
      expect(joined).toContain("structural FAIL");
      expect(sitesChunksOf(key).length).toBeGreaterThan(0);
      expect(
        sitesTrippedBy(joined),
        `${key} was reached after all — it is no longer unreachable, so it needs a real probe row ` +
          `in the reachable set rather than this disposition`,
      ).not.toContain(spec.signature);
      // …and the structural reason, off the parsed source: the delegating identifier return sits
      // ABOVE this site in the authority's body, which is WHY nothing can reach it.
      expect(delegatingReturnPrecedes(spec.signature)).toBe(true);
    });
  }
});

/**
 * The raw chunks of one derived site, by handle — with the matcher's own INPUT asserted.
 *
 * THE VACUITY THIS CLOSES. `matchesSite(message, [])` is TRUE for every message: an empty chunk list
 * makes the matcher accept anything, so a cell built on it would pass on a refusal from any
 * authority at all. A short-but-non-empty list is the same failure quieter. This repository's
 * standing lesson is that a floor which catches an EMPTY denominator but not a SILENTLY SHORT one is
 * not a floor — so the chunks are asserted to reconstruct the site's REGISTERED signature exactly,
 * which no truncated list can do.
 */
function sitesChunksOf(key: string): readonly string[] {
  const site = deriveAdmitRefusalSites(CONTEXT_IO_TS).sites.find(
    (s) => siteKeyOf(s.signature) === key,
  );
  expect(site, `no derived refusal site carries the handle ${key}`).toBeDefined();
  const chunks = (site as RefusalSite).chunks;
  const spec = REFUSAL_SITE_SPECS.find((s) => s.key === key);
  expect(
    refusalSignature(chunks),
    `the chunk list the matcher is about to use for ${key} does not reconstruct that site's ` +
      `registered signature, so the match it reports would be about some other text — a truncated ` +
      `or empty list makes matchesSite() accept every message`,
  ).toBe((spec as RefusalSiteSpec).signature);
  return chunks;
}

/**
 * Does the authority's delegating `return findings;` (R-34) sit ABOVE this refusal site in source
 * order? That ordering is the structural reason a site behind it cannot be reached: the delegation
 * returns first for exactly the inputs that would otherwise arrive here.
 */
function delegatingReturnPrecedes(signature: string): boolean {
  const source = ts.createSourceFile(
    "context-io.ts",
    readFileSync(CONTEXT_IO_TS, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  let delegationAt = -1;
  let siteAt = -1;
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || statement.name?.text !== ADMIT_AUTHORITY) continue;
    const walk = (node: ts.Node): void => {
      if (ts.isReturnStatement(node) && node.expression) {
        if (ts.isIdentifier(node.expression) && delegationAt < 0) {
          delegationAt = node.getStart(source);
        } else if (
          ts.isArrayLiteralExpression(node.expression) &&
          node.expression.elements.length > 0 &&
          refusalSignature(refusalStaticChunks(node.expression)) === signature
        ) {
          siteAt = node.getStart(source);
        }
      }
      ts.forEachChild(node, walk);
    };
    if (statement.body) walk(statement.body);
  }
  return delegationAt >= 0 && siteAt >= 0 && delegationAt < siteAt;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE-B — the exercise table is a MATRIX over the cross product of two derived sets.
//
// WHAT REPLACED WHAT, AND WHY (31-10, CR-05 round 2). This section used to loop over the derived
// writers asking each ONE question — "does it refuse the fabricated artifact-ref?" — and that single
// question was the whole reason the shipped contract test could not see CR-05. The loop is now a
// matrix keyed by (writer, refusal signature), and its key set is asserted EQUAL to the cross
// product of the derived writer set and the derived refusal set BEFORE any cell runs. A pair with no
// row does not exist to be skipped; it turns the file red.
//
// EVERY CELL RESOLVES, AND NO CELL IS SKIPPED. A cell is either DRIVEN — the writer refuses, the
// message matches that site's registered signature, and the notes directory is unchanged across the
// call — or DISPOSITIONED, with a written reason and a POSITIVE assertion off the parsed source
// establishing why it cannot be driven. `it.skip`, `it.todo` and a quietly absent key are all the
// same silence, and this file exists to remove it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

interface CellDisposition {
  readonly reason: string;
  /** The POSITIVE assertion that establishes the impossibility. Runs inside the cell's own case. */
  readonly prove: (writer: string, siteKey: string) => void;
}

/** The writer-wide disposition: this writer never reaches the authority at all. */
function neverReachesAuthority(composedKind: string): CellDisposition {
  return {
    reason:
      "this writer never reaches the admission authority. It is a reserved-identity emitter whose " +
      "tail is emitTrusted (validate-and-write), it composes its note's kind from a source literal, " +
      "and no caller input puts it in front of admit(). Its refusals come from a DIFFERENT authority " +
      "— emitTrusted's identity and validity checks — which is why they are recorded here rather " +
      "than counted as evidence that any admission family was reached.",
    prove: (writer) => {
      const analysis = analyze(CONTEXT_IO_TS);
      expect(
        analysis.calls.has(writer),
        `PREMISE: ${writer} was not found as a top-level declaration, so the closure below measured ` +
          `nothing`,
      ).toBe(true);
      expect(
        closureOf(analysis, writer).has(ADMIT_AUTHORITY),
        `${writer} now reaches ${ADMIT_AUTHORITY}(), so it CAN be asked an admission question and ` +
          `owes every derived family a driven cell instead of this disposition`,
      ).toBe(false);
      expect(
        composedKindLiterals(CONTEXT_IO_TS, writer),
        `${writer}'s composed kind is no longer a single source literal, so it may now express a ` +
          `caller-chosen kind and needs behavioural drivers`,
      ).toEqual([composedKind]);
      expect(
        functionSource(CONTEXT_IO_TS, writer).includes("artifact-ref"),
        `${writer} names the artifact-ref kind in its body — the structural impossibility claimed ` +
          `for it is no longer obviously true and must be re-derived`,
      ).toBe(false);
    },
  };
}

const WRITER_WIDE_DISPOSITIONS: Readonly<Record<string, CellDisposition>> = Object.freeze({
  emitVerdict: neverReachesAuthority("finding"),
  emitCheckpointNote: neverReachesAuthority("finding"),
});

/** The site-wide disposition: nothing can reach this site, so no writer can be driven at it. */
const SITE_WIDE_DISPOSITIONS: Readonly<Record<string, CellDisposition>> = Object.freeze({
  S1: {
    reason: UNREACHABLE_SITES.S1,
    prove: (_writer, siteKey) => {
      const spec = REFUSAL_SITE_SPECS.find((s) => s.key === siteKey) as RefusalSiteSpec;
      expect(
        delegatingReturnPrecedes(spec.signature),
        `${siteKey} is no longer behind the authority's delegating return, so it may now be ` +
          `reachable and owes every writer a driven cell`,
      ).toBe(true);
    },
  },
});

/** `${writer}::${siteKey}` → a disposition for one specific cell. */
const CELL_DISPOSITIONS: Readonly<Record<string, CellDisposition>> = Object.freeze({
  "admitAndAppend::S8": {
    reason:
      "a DIFFERENT authority refuses first. The combiner routes a note through isGatedNote, and a " +
      "high-severity finding under an active dial is gated — a condition that SUBSUMES the one this " +
      "site tests — so the gated branch returns its own refusal before admit() is called. The cell " +
      "is recorded as reached-by-another-authority rather than counted as evidence that D-04 fired, " +
      "which is exactly the pass this plan refuses to grant.",
    prove: (writer) => {
      // POSITIVE, off the parsed source: the gated branch RETURNS, and the authority call sits after
      // the whole gated statement — so a gated note cannot arrive at admit().
      const source = ts.createSourceFile(
        "context-io.ts",
        readFileSync(CONTEXT_IO_TS, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      let gatedEnd = -1;
      let authorityAt = -1;
      let returnsInsideGated = 0;
      for (const statement of source.statements) {
        if (!ts.isFunctionDeclaration(statement) || statement.name?.text !== writer) continue;
        const walk = (node: ts.Node): void => {
          if (
            ts.isIfStatement(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === "gated"
          ) {
            gatedEnd = node.getEnd();
            const count = (inner: ts.Node): void => {
              if (ts.isReturnStatement(inner)) returnsInsideGated += 1;
              ts.forEachChild(inner, count);
            };
            count(node.thenStatement);
          }
          if (
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === ADMIT_AUTHORITY &&
            authorityAt < 0
          ) {
            authorityAt = node.getStart(source);
          }
          ts.forEachChild(node, walk);
        };
        if (statement.body) walk(statement.body);
      }
      expect(gatedEnd, `PREMISE: no \`if (gated)\` statement was found in ${writer}`).toBeGreaterThan(0);
      expect(authorityAt, `PREMISE: no ${ADMIT_AUTHORITY}() call was found in ${writer}`).toBeGreaterThan(0);
      expect(
        returnsInsideGated,
        `${writer}'s gated branch no longer returns, so a gated note may now fall through to the ` +
          `authority and this disposition must become a driven cell`,
      ).toBeGreaterThan(0);
      expect(
        authorityAt > gatedEnd,
        `${writer} now calls the authority from inside or above the gated branch, so the ordering ` +
          `this disposition rests on no longer holds`,
      ).toBe(true);
      // …and the diverting predicate is TRUE for exactly this probe's shape.
      expect(
        mod.isGatedNote(
          "security-nfr",
          "finding",
          mod.readGovernanceConfig(repoWithGovernance({ human_admission: "high-severity" })),
        ),
      ).toBe(true);
    },
  },
});

type CellOutcome =
  | { readonly kind: "refused"; readonly message: string }
  | { readonly kind: "wrote"; readonly id: string };

const WRITER_DRIVERS: Readonly<
  Record<
    string,
    (
      note: Parameters<typeof mod.appendNote>[1],
      contextRoot: string,
      task: string,
      repoRoot: string,
    ) => CellOutcome
  >
> = Object.freeze({
  appendNote: (note, contextRoot, task, repoRoot) => {
    try {
      return { kind: "wrote", id: mod.appendNote(task, note, PROBE_BODY, contextRoot, undefined, repoRoot) };
    } catch (e) {
      return { kind: "refused", message: (e as Error).message };
    }
  },
  admitAndAppend: (note, contextRoot, task, repoRoot) => {
    const result = mod.admitAndAppend(task, note, PROBE_BODY, contextRoot, repoRoot);
    return result.id === null
      ? { kind: "refused", message: result.findings.join("\n") }
      : { kind: "wrote", id: result.id };
  },
  // 31-14 — THE NEW COLUMN, DECIDED RATHER THAN LEFT TO RESOLVE TO NOTHING.
  //
  // WHAT THESE CELLS MEASURE, STATED SO THEY ARE NOT MISREAD. Not one of these probes carries a
  // `human:NAME` disposition stamp, so not one of them ENTERS the re-binding proof: each falls
  // through to full admission, which is the route's own entry-boundary behaviour and the reason a
  // gate-stamped finding and an artifact-ref are still re-bound at the destination. So this column
  // asserts that the fall-through reaches the authority for EVERY derived family — the property
  // CR-08's fix could most easily have broken. What the PROOF itself declines is the SECOND derived
  // axis in PART SIX, driven clause by clause; neither axis stands in for the other.
  promoteAdmitted: (note, contextRoot, task, repoRoot) => {
    try {
      return {
        kind: "wrote",
        id: mod.promoteAdmitted(
          task,
          "no-such-origin-id",
          note,
          PROBE_BODY,
          contextRoot,
          contextRoot,
          repoRoot,
        ),
      };
    } catch (e) {
      return { kind: "refused", message: (e as Error).message };
    }
  },
});

type MatrixCell =
  | { readonly mode: "behavioural"; readonly writer: string; readonly signature: string }
  | {
      readonly mode: "dispositioned";
      readonly writer: string;
      readonly signature: string;
      readonly disposition: CellDisposition;
    };

/** Resolve one (writer, signature) pair, or `null` when nothing covers it. */
function resolveCell(writer: string, signature: string): MatrixCell | null {
  const siteKey = siteKeyOf(signature);
  const disposition =
    WRITER_WIDE_DISPOSITIONS[writer] ??
    SITE_WIDE_DISPOSITIONS[siteKey] ??
    CELL_DISPOSITIONS[`${writer}::${siteKey}`];
  if (disposition) return { mode: "dispositioned", writer, signature, disposition };
  if (WRITER_DRIVERS[writer] && REFUSAL_PROBES[signature]?.note) {
    return { mode: "behavioural", writer, signature };
  }
  return null;
}

/** THE MATRIX, keyed `${writer}::${signature}` over the cross product of the two derived sets. */
function buildWriterFamilyMatrix(): Record<string, MatrixCell> {
  const out: Record<string, MatrixCell> = {};
  for (const writer of deriveNoteWriters(CONTEXT_IO_TS)) {
    for (const signature of derivedRefusalSignatures(CONTEXT_IO_TS)) {
      const cell = resolveCell(writer, signature);
      // An UNRESOLVED pair deliberately produces NO KEY rather than throwing here: the key-set
      // equality below then reports it as a missing member of the cross product, which is a reader-
      // legible failure at the assertion instead of a crash during collection.
      if (cell) out[`${writer}::${signature}`] = cell;
    }
  }
  return out;
}

const WRITER_FAMILY_MATRIX: Readonly<Record<string, MatrixCell>> = Object.freeze(
  buildWriterFamilyMatrix(),
);

describe("31-10 — every derived writer is exercised against every derived refusal family", () => {
  it("the matrix KEY SET equals the cross product of the two derived sets", () => {
    // The load-bearing half: a pair that resolved to NOTHING — no driver, no probe, no disposition —
    // produces no key, so it shows up here as a missing member rather than as a loop that ran one
    // fewer time. That is the failure mode a `for` over a hand-written table cannot report.
    const writers = deriveNoteWriters(CONTEXT_IO_TS);
    const signatures = derivedRefusalSignatures(CONTEXT_IO_TS);
    const crossProduct = writers
      .flatMap((writer) => signatures.map((signature) => `${writer}::${signature}`))
      .sort();
    expect(crossProduct.length).toBe(writers.length * signatures.length);
    expect(
      Object.keys(WRITER_FAMILY_MATRIX).sort(),
      "a (writer, refusal family) pair has neither a behavioural driver nor a written disposition. " +
        "A cell that does not exist is a cell nobody exercises, which is the silence CR-05 shipped " +
        "through — every pair is driven or dispositioned, never skipped",
    ).toEqual(crossProduct);
  });

  it("the matrix contains at least one BEHAVIOURAL cell per driveable writer", () => {
    // A vacuity floor. If every cell resolved to a disposition, every claim below would be a
    // structural assertion and nothing would have driven the module at all.
    for (const writer of Object.keys(WRITER_DRIVERS)) {
      const driven = Object.values(WRITER_FAMILY_MATRIX).filter(
        (cell) => cell.writer === writer && cell.mode === "behavioural",
      );
      expect(
        driven.length,
        `${writer} has a driver but not one behavioural cell — every family was dispositioned away`,
      ).toBeGreaterThan(0);
    }
  });

  for (const [key, cell] of Object.entries(WRITER_FAMILY_MATRIX)) {
    const siteKey = siteKeyOf(cell.signature);
    it(`${cell.writer} × ${siteKey}: ${cell.mode === "behavioural" ? "refuses, naming that family" : "dispositioned with a reason"}`, async () => {
      if (cell.mode === "dispositioned") {
        expect(cell.disposition.reason.length, `${key} carries an empty reason`).toBeGreaterThan(0);
        cell.disposition.prove(cell.writer, siteKey);
        return;
      }
      const probe = REFUSAL_PROBES[cell.signature];
      const { contextRoot, task, repoRoot } = stageProbe(probe, `ctx-io-cell-${cell.writer}-${siteKey}-`);
      const before = noteFileCount(contextRoot, task);
      const outcome = WRITER_DRIVERS[cell.writer](
        (probe.note as () => Parameters<typeof mod.appendNote>[1])(),
        contextRoot,
        task,
        repoRoot,
      );
      expect(
        outcome.kind,
        `${cell.writer} WROTE a note the ${siteKey} family refuses — the authority was not reached ` +
          `for this family, which is exactly the shape CR-05 had`,
      ).toBe("refused");
      const message = (outcome as { message: string }).message;
      // The matcher's INPUT is checked before its OUTPUT is believed (the vacuity floor above).
      expect(sitesChunksOf(siteKey).length).toBeGreaterThan(0);
      // The refusal must be EXACTLY this family's, not merely some refusal: a cell that passed on
      // any refusal at all would grant a pass on a message from a different authority. Set EQUALITY
      // rather than containment, so a message that also matched a neighbouring site — which is what
      // an over-broad or empty chunk list produces — fails here instead of reading as covered.
      expect(
        sitesTrippedBy(message),
        `${cell.writer} refused the ${siteKey} probe, but not with exactly the ${siteKey} family's ` +
          `message. Whichever authority answered, it was not the one this cell claims — name it in ` +
          `a disposition rather than accepting the refusal as evidence. Refusal was:\n${message}`,
      ).toEqual([cell.signature]);
      expect(
        noteFileCount(contextRoot, task),
        `${cell.writer} refused the ${siteKey} probe but left a file behind — "nothing is written" ` +
          `must be true of the disk, not only of the return value`,
      ).toBe(before);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE-C — THE CONVERSE. A predicate that refused everything would satisfy every row above.
//
// Every assertion in PART THREE-B is of the form "this note does NOT get written". A change that
// made the authority refuse unconditionally would satisfy all of them and destroy the writer, and
// nothing in this file before 31-10 would have noticed. So the converse is asserted directly: a
// clean, admissible note of EVERY one of the six kinds writes through the sanctioned writer, and the
// returned id is the filename on disk.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("31-10 — the converse: a clean note of every kind still writes", () => {
  const CONVERSE_RUN = "RUN-CONVERSE";

  it("the six kinds under test ARE the module's own kind vocabulary", () => {
    // The kind list is the module's exported authority, not a hand-typed six. A seventh kind lands
    // in the loop below automatically and must earn its own admissible fixture.
    expect(mod.NOTE_KINDS.length, "the note-kind vocabulary moved").toBe(6);
  });

  for (const kind of ["claim", "finding", "decision", "failed-attempt", "observation", "artifact-ref"] as const) {
    it(`${kind}: a clean, admissible note writes and the returned id is the filename on disk`, () => {
      const contextRoot = freshTmp(`ctx-io-converse-${kind}-`);
      const repoRoot = freshTmp("ctx-io-converse-repo-"); // no config → the lean dial
      const task = "converse-task";
      seedGreenVerdict(contextRoot, task, CONVERSE_RUN);
      const note =
        kind === "artifact-ref"
          ? artifactRefNote({ gate_run: CONVERSE_RUN, sha: FABRICATED_SHA })
          : softNote({
              kind,
              // A finding must carry a real stamp (the D-09 refuse-self rule); the seeded verdict
              // above is the live green one it names, so the D-01 cross-check PASSES.
              verified_by: kind === "finding" ? `§14-gate#${CONVERSE_RUN}` : "",
            });
      const id = mod.appendNote(task, note, PROBE_BODY, contextRoot, undefined, repoRoot);
      expect(id, `${kind}: the sanctioned writer returned no id for an admissible note`).toBeTruthy();
      expect(
        existsSync(join(contextRoot, task, "notes", `${id}.md`)),
        `${kind}: the writer returned id "${id}" but no file of that name is on disk — the id must ` +
          `BE the filename, not a receipt for a write that did not happen`,
      ).toBe(true);
    });
  }

  it("a fix that refused everything would fail here — all six kinds share one context and one dial", () => {
    // Stated as its own case so the intent survives a future edit: the six cases above are the
    // control for every refusal row in PART THREE-B, not extra coverage.
    const contextRoot = freshTmp("ctx-io-converse-all-");
    const repoRoot = freshTmp("ctx-io-converse-all-repo-");
    const task = "converse-all";
    seedGreenVerdict(contextRoot, task, CONVERSE_RUN);
    const written = mod.NOTE_KINDS.map((kind, index) =>
      mod.appendNote(
        task,
        kind === "artifact-ref"
          ? artifactRefNote({ gate_run: CONVERSE_RUN, sha: FABRICATED_SHA, at: `2026-09-08T06:0${index}:00Z` })
          : softNote({
              kind,
              at: `2026-09-08T06:0${index}:00Z`,
              verified_by: kind === "finding" ? `§14-gate#${CONVERSE_RUN}` : "",
            }),
        PROBE_BODY,
        contextRoot,
        undefined,
        repoRoot,
      ),
    );
    expect(new Set(written).size).toBe(mod.NOTE_KINDS.length);
    // The seeded verdict plus one note per kind.
    expect(noteFileCount(contextRoot, task)).toBe(mod.NOTE_KINDS.length + 1);
  });
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
// PART FOUR-B — the WHOLE MATRIX is watched failing, not one cell of it (31-10).
//
// The case above proves the authority call is load-bearing for ONE probe. That is exactly the shape
// of argument this plan exists to retire: one proven cell standing in for a set nobody measured. So
// every behavioural cell of the sanctioned writer is driven against a mirror of the committed `.js`
// with the authority call neutralized, and each one must WRITE what the live module refuses —
// MEASURED, cell by cell, rather than asserted as a belief about the mirror.
//
// The count of probes that wrote is compared against the count of behavioural cells in the matrix,
// so a mirror run that silently drove three of seven cannot report success.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * The writer two shipped workflows name BY NAME, and the one whose bypass CR-05 was. Its membership
 * in the derived writer set is asserted below rather than assumed — a name in a constant is not a
 * fact about the module.
 */
const SANCTIONED_WRITER = "appendNote";

describe("31-10 — the neutralized mirror WRITES every family the live module refuses", () => {
  it("every behavioural cell of the sanctioned writer inverts on the mirror, and the count matches", async () => {
    expect(
      deriveNoteWriters(CONTEXT_IO_TS),
      `PREMISE: ${SANCTIONED_WRITER} is not in the derived writer set, so the cells counted below ` +
        `are not the cells of a note writer`,
    ).toContain(SANCTIONED_WRITER);

    const behavioural = Object.values(WRITER_FAMILY_MATRIX).filter(
      (cell) => cell.writer === SANCTIONED_WRITER && cell.mode === "behavioural",
    );
    // A VACUITY FLOOR THAT ALSO CATCHES A SILENTLY SHORT LIST. An empty set would make the loop
    // below run zero times and the equality at the end trivially true, so the count is compared
    // against a denominator derived INDEPENDENTLY of the loop that consumes it: the reachable
    // derived sites, minus the ones this writer has a disposition for.
    const independentlyExpected = derivedRefusalSignatures(CONTEXT_IO_TS).filter(
      (signature) =>
        !(siteKeyOf(signature) in UNREACHABLE_SITES) &&
        !(`${SANCTIONED_WRITER}::${siteKeyOf(signature)}` in CELL_DISPOSITIONS) &&
        !(SANCTIONED_WRITER in WRITER_WIDE_DISPOSITIONS),
    );
    expect(independentlyExpected.length).toBeGreaterThan(0);
    expect(
      behavioural.length,
      `the number of behavioural cells for ${SANCTIONED_WRITER} disagrees with the number derived ` +
        `independently from the site set and the dispositions, so the loop below is about to measure ` +
        `a different set from the one the matrix claims`,
    ).toBe(independentlyExpected.length);

    const neutralized = await mirrorOfCommittedJs(
      AUTHORITY_CALL,
      "const admission = [];",
      "ctx-io-matrix-neutralized-",
    );

    let inverted = 0;
    for (const cell of behavioural) {
      const siteKey = siteKeyOf(cell.signature);
      const probe = REFUSAL_PROBES[cell.signature];
      const note = probe.note as () => Parameters<typeof mod.appendNote>[1];

      // 1. The MIRROR writes it.
      const mirrored = stageProbe(probe, `ctx-io-mirror-${siteKey}-`);
      const beforeMirror = noteFileCount(mirrored.contextRoot, mirrored.task);
      const id = neutralized.appendNote(
        mirrored.task,
        note(),
        PROBE_BODY,
        mirrored.contextRoot,
        undefined,
        mirrored.repoRoot,
      );
      expect(
        id,
        `the neutralized mirror REFUSED the ${siteKey} probe too, so the live refusal is NOT caused ` +
          `by the authority call — some other check is doing the work and this cell proves nothing ` +
          `about admission`,
      ).toBeTruthy();
      expect(noteFileCount(mirrored.contextRoot, mirrored.task)).toBe(beforeMirror + 1);

      // 2. The LIVE module refuses the identical call. The pair is the comparison; either half alone
      //    is just a program behaving.
      const live = stageProbe(probe, `ctx-io-mirror-live-${siteKey}-`);
      const beforeLive = noteFileCount(live.contextRoot, live.task);
      expect(() =>
        mod.appendNote(live.task, note(), PROBE_BODY, live.contextRoot, undefined, live.repoRoot),
      ).toThrow();
      expect(noteFileCount(live.contextRoot, live.task)).toBe(beforeLive);
      inverted += 1;
    }
    expect(
      inverted,
      "a behavioural cell was skipped by the mirror loop, so the inversion was measured over fewer " +
        "families than the matrix claims to cover",
    ).toBe(behavioural.length);
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

/**
 * The functions permitted to reach the pre-admitted write route.
 *
 * MEASURED, WITH THE REASON IT MOVED (31-14): one member -> two. The derivation was re-run and its
 * output read — `[["admitAndAppend",2],["promoteAdmitted",1]]` — rather than the constant being
 * widened until the case passed. The second member is the proof-gated re-binding route, and it is a
 * DECISION (D-19) with its reason written at its site: the note it persists was already adjudicated
 * at the origin by the un-forgeable hook, and it proves that over the origin's own stored bytes
 * before it reaches the write. A THIRD caller is the same kind of decision and must move this set
 * and the count below together.
 */
const EXPECTED_PRE_ADMITTED_CALLERS = Object.freeze(["admitAndAppend", "promoteAdmitted"]);

/**
 * The adjudicated call sites: `admitAndAppend`'s gated and non-gated branches, plus the re-binding
 * route's single post-proof write. MEASURED 2 -> 3 in the same reading as the member set above; a
 * fourth is a branch that must carry its own written reason for skipping the authority.
 */
const EXPECTED_PRE_ADMITTED_CALL_SITES = 3;

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
    // THE RE-CLASSIFICATIONS THIS COUNT HAS BOUGHT, RECORDED SO THE NUMBER IS A DECISION AND NOT A
    // BUMPED CONSTANT.
    //   - `realpathSync` (plan 31-19, WR-21): a READ. It resolves a path to its canonical spelling
    //     and creates, moves, removes and modifies nothing, so it does not enter
    //     FS_WRITE_PRIMITIVES. It was added because the home-directory stop compares the DIRECTORY
    //     rather than a spelling of it, and a home reached through a symlink is the same directory
    //     under a different string — a comparison a missed resolution gets wrong in the unsafe
    //     direction.
    //
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
      // 15 -> 14 (31-21, CR-12 / D-24), CLASSIFIED rather than bumped: `readFileSync` was REMOVED.
      // Every read this module performs now goes through the single `readRegularFileOrNull`, which
      // opens with O_NONBLOCK and refuses anything that is not a regular file, so the blocking
      // primitive is not in scope to be reached for by accident. Its removal cannot add a write
      // primitive — it was never one — so the residual this file derives is unaffected in the
      // direction this assertion guards. Re-adding it is drift, and PART SIX-F's read-site axis is
      // where that shows up as a named member rather than as a bare count.
    ).toBe(14);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART SIX — THE SECOND NEW AXIS (31-14). What the re-binding PROOF itself declines is DERIVED.
//
// WHY THIS EXISTS, AND WHY THE PREVIOUS ROUND'S DERIVED ASSERTIONS DID NOT CATCH CR-08. Round 3's
// `regressions:` entry names it exactly: only ONE axis had moved. 31-09 derived the writer set and
// the pre-admitted caller set, and both were correct — but the question "which OPERATIONS now reach
// an authority built only to decide NEW admissions" is a third axis nobody derived, and a re-write
// is such an operation. This plan therefore moves BOTH axes it touches: `promoteAdmitted` joins the
// derived writer set and the derived caller set above, AND the set of shapes its own proof declines
// is derived HERE from its own parsed body, bound to the exported register in both directions, and
// exercised clause by clause.
//
// THE SIGNATURE IS THE CLAUSE KEY, AND THAT IS STRONGER THAN COLLAPSED TEXT. `deriveAdmitRefusalSites`
// above must reconstruct a site's identity from its static literal chunks, because `admit()` spells
// each refusal inline. The re-binding route does not: every decline names a CLAUSE KEY and takes its
// sentence from the single exported register `PROMOTE_ADMITTED_DECLINES`, so the identity is a string
// literal the parse reads directly. The collapsed static-chunk signature is derived alongside it and
// asserted DISTINCT, so a second clause reusing a key cannot hide inside the same identity.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The re-binding route's declared name, in one place so the derivation and its controls agree. */
const REBINDING_ROUTE = "promoteAdmitted";

/** The one helper every decline goes through — the seam that makes the clause key readable. */
const DECLINE_HELPER = "declineRebinding";

interface DeclineSite {
  /** The clause key: the helper's first argument, a string literal. */
  readonly key: string;
  /** The site's collapsed static-chunk signature, in the PART TWO-B shape. */
  readonly signature: string;
}

interface DeclineDerivation {
  readonly declared: readonly string[];
  readonly declarationFound: boolean;
  readonly hasBody: boolean;
  readonly sites: readonly DeclineSite[];
  /** Throws in the route's body that do NOT go through the decline helper — the derivation's bound. */
  readonly unhelpedThrows: readonly string[];
}

/**
 * THE THIRD DERIVATION: one site per decline in the re-binding route's own body.
 *
 * A decline site is a `throw` whose expression is a call to the decline helper. A `throw new
 * Error(...)` is deliberately NOT a site — it is an internal invariant guard, not a decision about a
 * caller's input — and its count is asserted separately below so the exclusion is a measured bound
 * rather than a silence.
 */
function deriveDeclineSites(sourcePath: string): DeclineDerivation {
  const source = ts.createSourceFile(
    "context-io.ts",
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const declared: string[] = [];
  const sites: DeclineSite[] = [];
  const unhelpedThrows: string[] = [];
  let declarationFound = false;
  let hasBody = false;
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
    declared.push(statement.name.text);
    if (statement.name.text !== REBINDING_ROUTE) continue;
    declarationFound = true;
    hasBody = statement.body !== undefined;
    const walk = (node: ts.Node): void => {
      if (ts.isThrowStatement(node) && node.expression) {
        const thrown = node.expression;
        if (
          ts.isCallExpression(thrown) &&
          ts.isIdentifier(thrown.expression) &&
          thrown.expression.text === DECLINE_HELPER
        ) {
          const first = thrown.arguments[0];
          const key = first && ts.isStringLiteral(first) ? first.text : "";
          sites.push({ key, signature: refusalSignature(refusalStaticChunks(thrown)) });
        } else {
          unhelpedThrows.push(thrown.getText(source).replace(/\s+/g, " ").slice(0, 120));
        }
      }
      ts.forEachChild(node, walk);
    };
    if (statement.body) walk(statement.body);
  }
  return { declared, declarationFound, hasBody, sites, unhelpedThrows };
}

/** The derived clause keys, sorted — the set the exported register is bounded by. */
function derivedDeclineKeys(sourcePath: string): string[] {
  return deriveDeclineSites(sourcePath)
    .sites.map((site) => site.key)
    .sort();
}

/**
 * THE HARNESS ASSERTS ITS OWN PREMISE, as a failing assertion rather than an assumption. A parse
 * that found nothing derives an empty clause set, and an empty set satisfies "every clause is bound
 * and exercised" vacuously. Six false verification-harness premises across four rounds is why this is
 * a function the real cases CALL and the renamed-route control WATCHES THROW.
 */
function assertDeclinePremise(derived: DeclineDerivation): void {
  expect(
    derived.declared.length,
    "PREMISE: the TypeScript parse of scripts/context-io.ts yielded ZERO top-level function " +
      "declarations, so the decline derivation measured nothing at all",
  ).toBeGreaterThan(0);
  expect(
    derived.declarationFound,
    `PREMISE: no function named "${REBINDING_ROUTE}" was declared, so the derived decline set is ` +
      `empty for a reason that says nothing about what the proof declines`,
  ).toBe(true);
  expect(
    derived.hasBody,
    `PREMISE: "${REBINDING_ROUTE}" was declared with no body to walk, so no decline could be found`,
  ).toBe(true);
  expect(
    derived.sites.length,
    `PREMISE: ZERO decline sites were derived from "${REBINDING_ROUTE}"'s body. Either the proof ` +
      `declines nothing — which would make it a flag — or the site matcher stopped matching`,
  ).toBeGreaterThan(0);
}

/**
 * The expected clause keys.
 *
 * MEASURED ON 2026-09-08 by running the derivation against the post-31-14 source and reading its
 * output. Six clauses: one for an unnameable source, one fail-closed governance read, two about the
 * origin record's existence and liveness, and two about the promoted note differing from it.
 *
 * MEASURED AGAIN, WITH THE REASON IT MOVED (31-18): 6 -> 8, in two steps, each derivation re-run
 * against the post-change source and its output READ rather than the constant adjusted until the
 * case passed. `destination-id-occupied` (CR-11): the round-4 verifier reproduced a promotion
 * REPLACING an already-admitted note at the destination, because the route took its write id from an
 * argument and read nothing at the destination — the clause names the destructive case, and
 * identical destination bytes are the decided idempotent re-promotion that reaches no clause at all.
 * `origin-outside-trusted-store` (WR-17): the proof's left operand was an unconstrained caller-named
 * path, so the caller supplied the bytes its own write was judged against.
 * `human-stamp-not-gated-at-destination` (WR-18): the route read the governance configuration for
 * READABILITY only and never for its VALUE, so under a dial that gates nothing it carried a
 * human:NAME stamp forward that admitAndAppend refuses on the identical note.
 * `unreadable-audit-ledger` (31-21, WR-22 (2)): the ledger look answered `false` for a ledger that
 * was PRESENT and could not be read, and the route's response to "not recorded" is to APPEND — so a
 * fail-open read manufactured the duplicate event keyed on one id that D-19 (4) exists to prevent.
 */
const EXPECTED_DECLINE_KEYS = Object.freeze([
  "body-differs-from-origin",
  "destination-id-occupied",
  "empty-source-id",
  "field-differs-from-origin",
  "human-stamp-not-gated-at-destination",
  "no-such-origin-note",
  "origin-note-not-live",
  "origin-outside-trusted-store",
  "unreadable-audit-ledger",
  "unreadable-governance-config",
]);

/** The cardinality, asserted separately: a re-worded clause and an ADDED clause are different events. */
const EXPECTED_DECLINE_COUNT = 10;

describe("31-14 — the re-binding proof's decline set is derived from its own body", () => {
  it("PREMISE: the parse found the route, it had a body, and it yielded decline sites", () => {
    assertDeclinePremise(deriveDeclineSites(CONTEXT_IO_TS));
  });

  it("the derived clause set has the expected MEMBERS", () => {
    expect(
      derivedDeclineKeys(CONTEXT_IO_TS),
      "the set of shapes the re-binding proof declines moved. Each one is a way a caller can fail " +
        "to prove a re-binding, so it needs a register entry with a written reason and a probe that " +
        "reaches exactly it — never a widened constant here",
    ).toEqual([...EXPECTED_DECLINE_KEYS]);
  });

  it("the derived clause set has the expected COUNT", () => {
    expect(
      deriveDeclineSites(CONTEXT_IO_TS).sites.length,
      "a decline site landed in or left the re-binding route. A new one changes what the proof " +
        "refuses, which is a decision with a written reason, never a bumped constant",
    ).toBe(EXPECTED_DECLINE_COUNT);
  });

  it("every derived clause key is DISTINCT — a reused key would collapse two clauses into one", () => {
    const keys = derivedDeclineKeys(CONTEXT_IO_TS);
    expect(new Set(keys).size, `duplicate clause key among ${keys.join(", ")}`).toBe(keys.length);
    // …and so is the collapsed static-chunk signature, so two clauses sharing a key could not hide
    // behind one identity even if the key assertion above were relaxed.
    const signatures = deriveDeclineSites(CONTEXT_IO_TS).sites.map((site) => site.signature);
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("the register's KEY SET equals the derived clause set, in BOTH directions", () => {
    // The load-bearing binding. No derived clause without a register entry (a decline nobody wrote a
    // reason for), and no register entry naming a clause the route no longer has (a reason for a
    // refusal that cannot happen, which reads as coverage and is not).
    expect(
      Object.keys(mod.PROMOTE_ADMITTED_DECLINES).sort(),
      "the exported decline register and the clauses derived from the route's own body disagree",
    ).toEqual(derivedDeclineKeys(CONTEXT_IO_TS));
  });

  it("every register entry carries a non-empty written reason", () => {
    for (const [key, reason] of Object.entries(mod.PROMOTE_ADMITTED_DECLINES)) {
      expect(reason.length, `the register entry for "${key}" carries an empty reason`).toBeGreaterThan(
        40,
      );
    }
  });

  it("the route's named residuals are published and non-empty", () => {
    // A boundary nobody wrote down is the next round's gap. Both are disposition `accept`.
    expect(mod.PROMOTE_ADMITTED_RESIDUALS.length).toBeGreaterThan(0);
    expect(mod.PROMOTE_ADMITTED_RESIDUALS.join("\n")).toContain("T-31-14-03");
  });

  it("THE DERIVATION'S BOUND: every throw in the route goes through the decline helper, except the named guards", () => {
    // The walk sees a `throw declineRebinding(...)` and nothing else. A refusal spelled as a bare
    // `throw new Error(...)` would be a decline this derivation cannot see, so the count of such
    // throws is asserted rather than described. TWO are expected, and each is an INTERNAL guard with
    // a written reason rather than a decision about a caller's input:
    //   1. the type-narrowing guard on the composed candidate's parse, unreachable in practice;
    //   2. (31-21, WR-22) the id-identity guard: the GOV-02 ledger event is now appended BEFORE the
    //      note is written, so the event is keyed on an id the write has not yet returned. The guard
    //      asserts the two are the same object. It cannot fire for any caller input — the route
    //      passes `sourceId` to the write and the write returns what it was given — and it exists so
    //      that a future change letting the write mint its own id is caught rather than silently
    //      de-keying an audit record from the note it records. A caller cannot reach it, so it is
    //      not a decline and does not belong in the register.
    // Both are asserted to SAY "internal", so a real refusal cannot hide in this allowance.
    const derived = deriveDeclineSites(CONTEXT_IO_TS);
    expect(
      derived.unhelpedThrows.length,
      `the re-binding route throws outside the decline helper: ${derived.unhelpedThrows.join(" | ")}. ` +
        `Each one is a refusal the derivation above cannot see, so it belongs in the register (and ` +
        `through the helper) or it needs a written reason for being an internal guard`,
    ).toBe(2);
    for (const thrown of derived.unhelpedThrows) {
      expect(
        thrown,
        "an unhelped throw in the re-binding route does not announce itself as an internal guard, " +
          "so it is a refusal a caller can meet with no register entry and no written reason",
      ).toContain("internal");
    }
  });
});

// ─── PART SIX-B — the new axis DISCRIMINATES, watched failing in both directions. ───────────────

/** The seeded clause's key — distinctive enough that it cannot be confused with a real one. */
const SEEDED_DECLINE_KEY = "seeded-control-clause";

/** A one-occurrence anchor inside the re-binding route's own body. */
const DECLINE_SEED_ANCHOR = '  if (sourceId.trim() === "") {';

/** The one-occurrence anchor the premise control renames. */
const REBINDING_DECLARATION_ANCHOR = `export function ${REBINDING_ROUTE}(`;

describe("31-14 — the decline derivation is a control, not a coincidence", () => {
  it("a SEEDED extra clause moves the count by exactly one and arrives UNBOUND", () => {
    const mirror = mirrorOfContextIoTs(
      (source) =>
        insertExactlyOnceAfter(
          source,
          DECLINE_SEED_ANCHOR,
          `\n    if (task === "seeded-control") {\n` +
            `      throw declineRebinding("${SEEDED_DECLINE_KEY}", "A seeded control clause.");\n` +
            `    }`,
          "the seeded decline clause",
        ),
      "ctx-io-decline-seed-",
    );
    const before = derivedDeclineKeys(CONTEXT_IO_TS);
    const after = derivedDeclineKeys(mirror);
    expect(after.length).toBe(EXPECTED_DECLINE_COUNT + 1);
    expect(after).toContain(SEEDED_DECLINE_KEY);
    // …and NOTHING ELSE moved, so the change is caused by the seed rather than by a derivation that
    // broke and started reporting some other set.
    expect(after.filter((key) => key !== SEEDED_DECLINE_KEY)).toEqual(before);
    // …and the seeded clause is UNBOUND: the exported register does not name it, which is exactly
    // the failure a new undisclosed decline must produce.
    expect(
      Object.keys(mod.PROMOTE_ADMITTED_DECLINES),
      "the seeded clause was already in the register, so the both-directions binding above could " +
        "not have reported it as unbound",
    ).not.toContain(SEEDED_DECLINE_KEY);
    const unbound = after.filter((key) => !(key in mod.PROMOTE_ADMITTED_DECLINES));
    expect(unbound).toEqual([SEEDED_DECLINE_KEY]);
    // …and the same computation against the UN-SEEDED source finds nothing unbound, which is what
    // makes the case above a control rather than a claim about mirrors in general.
    expect(before.filter((key) => !(key in mod.PROMOTE_ADMITTED_DECLINES))).toEqual([]);
  });

  it("a RENAMED route fires the PREMISE, not the member comparison", () => {
    const mirror = mirrorOfContextIoTs(
      (source) =>
        replaceExactlyOnce(
          source,
          REBINDING_DECLARATION_ANCHOR,
          `export function ${REBINDING_ROUTE}RenamedForPremiseControl(`,
          "the renamed re-binding route declaration",
        ),
      "ctx-io-decline-rename-",
    );
    const derived = deriveDeclineSites(mirror);
    expect(derived.declarationFound).toBe(false);
    expect(derived.sites).toHaveLength(0);
    expect(() => assertDeclinePremise(derived)).toThrow(/PREMISE/);
    expect(derived.declared.length).toBeGreaterThan(0);
  });
});

// ─── PART SIX-C — every derived clause is EXERCISED by a probe that reaches exactly it. ─────────

/** The high-severity governance finding a named human disposed — the note the proof route is for. */
function disposedFinding(
  over: Partial<Parameters<typeof mod.appendNote>[1]> = {},
): Parameters<typeof mod.appendNote>[1] {
  return {
    kind: "finding",
    by: "security-nfr",
    at: "2026-09-08T02:00:00Z",
    verified_by: "human:alice",
    confidence: "high",
    refs: ["REQ-SEC-01"],
    supersedes: null,
    ...over,
  } as Parameters<typeof mod.appendNote>[1];
}

const REBIND_TASK = "rebind-task";
const REBIND_BODY = "the disposed finding body";

/** Seed an ORIGIN context holding the human-disposed finding, written the way the dial requires. */
function seedAdmittedOrigin(repoRoot: string, prefix: string): { originRoot: string; id: string } {
  // A CONTEXT STORE, not an arbitrary temp dir: 31-18 (WR-17) constrained the proof's left operand,
  // so an origin these probes name must be a location the module recognises.
  const originRoot = livenessContextStore(prefix);
  const note = disposedFinding();
  const gated = mod.isGatedNote(note.by, note.kind, mod.readGovernanceConfig(repoRoot));
  const id = gated
    ? (mod.admitAndAppend(REBIND_TASK, note, REBIND_BODY, originRoot, repoRoot).id as string)
    : mod.appendNote(REBIND_TASK, note, REBIND_BODY, originRoot, undefined, repoRoot);
  expect(id, "PREMISE: the origin seed did not write, so no probe below is measuring a re-binding").toBeTruthy();
  return { originRoot, id };
}

/** A repo root whose dial is ACTIVE — the configuration CR-08 was reproduced under. */
function activeDialRoot(): string {
  return repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
}

interface DeclineProbe {
  /** Run the probe; it must throw. Returns the destination root so files can be counted. */
  readonly drive: () => { destRoot: string; run: () => string };
}

/**
 * ONE PROBE PER DERIVED CLAUSE, keyed by clause key.
 *
 * The key set is asserted EQUAL to the derived set before any probe runs, so a clause with no probe
 * is a reader-legible failure rather than a loop that quietly ran one fewer time.
 */
const DECLINE_PROBES: Readonly<Record<string, DeclineProbe>> = Object.freeze({
  "empty-source-id": {
    drive: () => {
      const repoRoot = activeDialRoot();
      const { originRoot } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-empty-origin-");
      const destRoot = freshTmp("ctx-io-decline-empty-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(REBIND_TASK, "   ", disposedFinding(), REBIND_BODY, originRoot, destRoot, repoRoot),
      };
    },
  },
  "unreadable-governance-config": {
    drive: () => {
      const goodRoot = activeDialRoot();
      const { originRoot } = seedAdmittedOrigin(goodRoot, "ctx-io-decline-unreadable-origin-");
      const badRoot = repoWithRawConfig("{ not valid json ]]]");
      const destRoot = freshTmp("ctx-io-decline-unreadable-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(
            REBIND_TASK,
            "any-id",
            disposedFinding(),
            REBIND_BODY,
            originRoot,
            destRoot,
            badRoot,
          ),
      };
    },
  },
  "no-such-origin-note": {
    drive: () => {
      const repoRoot = activeDialRoot();
      const { originRoot } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-absent-origin-");
      const destRoot = freshTmp("ctx-io-decline-absent-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(
            REBIND_TASK,
            "20260908T020000Z-security-nfr-finding-notthere",
            disposedFinding(),
            REBIND_BODY,
            originRoot,
            destRoot,
            repoRoot,
          ),
      };
    },
  },
  "origin-note-not-live": {
    drive: () => {
      const repoRoot = activeDialRoot();
      const { originRoot, id } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-superseded-origin-");
      // A LATER note supersedes the disposed one, so the deterministic replay folds it out. Liveness
      // is decided by that replay — never by file position or mtime.
      const successor = disposedFinding({ at: "2026-09-08T03:00:00Z", supersedes: id });
      const gated = mod.isGatedNote(successor.by, successor.kind, mod.readGovernanceConfig(repoRoot));
      const wrote = gated
        ? mod.admitAndAppend(REBIND_TASK, successor, REBIND_BODY, originRoot, repoRoot).id
        : mod.appendNote(REBIND_TASK, successor, REBIND_BODY, originRoot, undefined, repoRoot);
      expect(wrote, "PREMISE: the superseding note did not write, so the origin note is still live").toBeTruthy();
      const destRoot = freshTmp("ctx-io-decline-superseded-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(REBIND_TASK, id, disposedFinding(), REBIND_BODY, originRoot, destRoot, repoRoot),
      };
    },
  },
  "field-differs-from-origin": {
    drive: () => {
      const repoRoot = activeDialRoot();
      const { originRoot, id } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-field-origin-");
      const destRoot = freshTmp("ctx-io-decline-field-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(
            REBIND_TASK,
            id,
            // A DIFFERENT named human — still a human disposition stamp, so it enters the proof, and
            // still not the disposition the origin record carries.
            disposedFinding({ verified_by: "human:mallory" }),
            REBIND_BODY,
            originRoot,
            destRoot,
            repoRoot,
          ),
      };
    },
  },
  "human-stamp-not-gated-at-destination": {
    drive: () => {
      // The LEAN posture this project ships: no configuration at all, so the dial gates nothing and
      // a human:NAME disposition binds nothing at the destination. Every later clause would hold —
      // the origin note is real, live and byte-equal — so this probe reaches the dial and nothing else.
      const repoRoot = freshTmp("ctx-io-decline-nongated-repo-");
      const { originRoot, id } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-nongated-origin-");
      const destRoot = freshTmp("ctx-io-decline-nongated-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(REBIND_TASK, id, disposedFinding(), REBIND_BODY, originRoot, destRoot, repoRoot),
      };
    },
  },
  "origin-outside-trusted-store": {
    drive: () => {
      const repoRoot = activeDialRoot();
      // An ORDINARY directory the caller authored and named — not a context store, not inside the
      // root the module itself answers. The origin note is real and matches, so every LATER clause
      // would hold: this probe reaches the operand constraint and nothing else.
      const forged = freshTmp("ctx-io-decline-untrusted-origin-");
      const lean = freshTmp("ctx-io-decline-untrusted-lean-");
      const id = mod.appendNote(REBIND_TASK, disposedFinding(), REBIND_BODY, forged, undefined, lean);
      expect(id, "PREMISE: the forged origin seed did not write").toBeTruthy();
      const destRoot = freshTmp("ctx-io-decline-untrusted-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(REBIND_TASK, id, disposedFinding(), REBIND_BODY, forged, destRoot, repoRoot),
      };
    },
  },
  "destination-id-occupied": {
    drive: () => {
      const repoRoot = activeDialRoot();
      const { originRoot, id } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-occupied-origin-");
      const destRoot = freshTmp("ctx-io-decline-occupied-dest-");
      // A DIFFERENT note ALREADY LIVING at the destination under the SAME id — the round-4
      // verifier's staging, minus the forgery, because destroying an admitted note needs none. The
      // promoted note still matches the ORIGIN exactly, so every earlier clause holds and this probe
      // reaches the destination read rather than a field comparison.
      const lean = freshTmp("ctx-io-decline-occupied-lean-");
      mod.appendNote(REBIND_TASK, softNote(), "a different note entirely", destRoot, id, lean);
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(REBIND_TASK, id, disposedFinding(), REBIND_BODY, originRoot, destRoot, repoRoot),
      };
    },
  },
  "unreadable-audit-ledger": {
    drive: () => {
      // A ledger that IS THERE and cannot be read — a DIRECTORY at the ledger position, chosen over
      // a FIFO on purpose: a FIFO would have HUNG this in-process case before 31-21 and the
      // directory reaches the same `fstat` refusal by the same rule, in bounded time, on every
      // platform including the ones without mkfifo. The bounded FIFO cases live in
      // `scripts/context-io.test.ts`, driven in a subprocess where a hang is a timeout rather than
      // a wedged suite. Every earlier clause holds — the origin note is real, live and byte-equal,
      // the dial gates and is readable — so this probe reaches the ledger look and nothing else.
      const repoRoot = activeDialRoot();
      const { originRoot, id } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-ledger-origin-");
      // The origin seed already admitted under `retained`, so a REGULAR ledger is sitting there.
      // Replace it, so the position is occupied by something the reader must refuse rather than
      // merely absent — "absent" is a different, legitimate case that returns false and proceeds.
      const ledger = join(repoRoot, ".grugops", "audit", "admissions.jsonl");
      rmSync(ledger, { force: true });
      mkdirSync(ledger, { recursive: true });
      const destRoot = freshTmp("ctx-io-decline-ledger-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(REBIND_TASK, id, disposedFinding(), REBIND_BODY, originRoot, destRoot, repoRoot),
      };
    },
  },
  "body-differs-from-origin": {
    drive: () => {
      const repoRoot = activeDialRoot();
      const { originRoot, id } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-body-origin-");
      const destRoot = freshTmp("ctx-io-decline-body-dest-");
      return {
        destRoot,
        run: () =>
          mod.promoteAdmitted(
            REBIND_TASK,
            id,
            disposedFinding(),
            `${REBIND_BODY} — and one more sentence the compaction added`,
            originRoot,
            destRoot,
            repoRoot,
          ),
      };
    },
  },
});

describe("31-14 — every derived decline clause is reached by a probe, and writes nothing", () => {
  it("the probe record's KEY SET equals the derived clause set", () => {
    expect(
      Object.keys(DECLINE_PROBES).sort(),
      "a derived decline clause has no probe (or a probe names a clause the route no longer has). " +
        "Every clause is exercised or the set is not covered",
    ).toEqual(derivedDeclineKeys(CONTEXT_IO_TS));
  });

  for (const clause of EXPECTED_DECLINE_KEYS) {
    it(`${clause}: the probe reaches exactly that clause and zero files are written`, () => {
      const probe = DECLINE_PROBES[clause];
      const { destRoot, run } = probe.drive();
      const before = noteFileCount(destRoot, REBIND_TASK);
      let message = "";
      try {
        run();
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message, `the ${clause} probe was ADMITTED — the proof accepted a shape it declines`).not.toBe("");
      // EXACTLY this clause: the decline names its own key, and no other derived key appears in the
      // message, so a probe cannot stand in for two clauses.
      expect(message).toContain(`DECLINED (${clause})`);
      const others = derivedDeclineKeys(CONTEXT_IO_TS).filter((key) => key !== clause);
      for (const other of others) {
        expect(
          message.includes(`DECLINED (${other})`),
          `the ${clause} probe also names ${other} — a many-to-one probe mapping must be recorded`,
        ).toBe(false);
      }
      // …and the register's own sentence for that clause is what the caller is told.
      expect(message).toContain(mod.PROMOTE_ADMITTED_DECLINES[clause]);
      expect(
        noteFileCount(destRoot, REBIND_TASK),
        `the ${clause} probe left a file behind — "nothing is written" must be true of the disk`,
      ).toBe(before);
    });
  }

  // ─── THE ENTRY SET, ASKED IN THE OTHER DIRECTION. ────────────────────────────────────────────
  //
  // Every case above asks what the proof REFUSES. The reachability question this repository keeps
  // paying for is the converse: which shapes REACH the proof at all? A note outside the entry set
  // must fall through to full admission — never be silently accepted, and never be silently dropped.
  it("a note carrying a §14-gate stamp falls THROUGH to full admission, and is refused there without a verdict", () => {
    const repoRoot = activeDialRoot();
    const originRoot = freshTmp("ctx-io-entry-gate-origin-");
    const destRoot = freshTmp("ctx-io-entry-gate-dest-");
    const gateStamped = disposedFinding({ by: "qe-e2e", verified_by: "§14-gate#no-such-run" });
    let message = "";
    try {
      mod.promoteAdmitted(REBIND_TASK, "no-such-origin-id", gateStamped, REBIND_BODY, originRoot, destRoot, repoRoot);
    } catch (e) {
      message = (e as Error).message;
    }
    // NOT a decline: the refusal is the AUTHORITY's, which is what proves the fall-through happened.
    expect(message).toContain("admission FAIL: no live green §14-gate verdict found");
    expect(message).not.toContain("DECLINED (");
    expect(noteFileCount(destRoot, REBIND_TASK)).toBe(0);
  });

  it("a note carrying an EMPTY stamp falls THROUGH to full admission and WRITES when admissible", () => {
    // The other half of the converse: the fall-through is not a disguised refusal. A soft note with
    // no stamp is admissible, so it lands — with a NEW id, which is the observable difference from
    // the proof route's carried-forward frozen id.
    const repoRoot = freshTmp("ctx-io-entry-soft-repo-"); // no config → the lean dial
    const originRoot = freshTmp("ctx-io-entry-soft-origin-");
    const destRoot = freshTmp("ctx-io-entry-soft-dest-");
    const id = mod.promoteAdmitted(
      REBIND_TASK,
      "no-such-origin-id",
      softNote(),
      REBIND_BODY,
      originRoot,
      destRoot,
      repoRoot,
    );
    expect(id).toBeTruthy();
    expect(id).not.toBe("no-such-origin-id");
    expect(noteFileCount(destRoot, REBIND_TASK)).toBe(1);
  });

  it("THE CONVERSE OF EVERY DECLINE: a genuine re-binding still writes, byte-identically", () => {
    // A proof that declined everything would satisfy all six cases above and destroy the route. So
    // the legitimate input is driven too — the probe the round that created CR-08 never ran.
    const repoRoot = activeDialRoot();
    const { originRoot, id } = seedAdmittedOrigin(repoRoot, "ctx-io-decline-converse-origin-");
    const destRoot = freshTmp("ctx-io-decline-converse-dest-");
    const promoted = mod.promoteAdmitted(
      REBIND_TASK,
      id,
      disposedFinding(),
      REBIND_BODY,
      originRoot,
      destRoot,
      repoRoot,
    );
    expect(promoted).toBe(id);
    expect(noteFileCount(destRoot, REBIND_TASK)).toBe(1);
    expect(readFileSync(join(destRoot, REBIND_TASK, "notes", `${promoted}.md`), "utf8")).toBe(
      readFileSync(join(originRoot, REBIND_TASK, "notes", `${id}.md`), "utf8"),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART SIX-D — the CALLER axis, derived ACROSS FILES, and the SUMMARY's enumeration bound to it.
//
// PART FIVE-B derives the private route's callers WITHIN the module. That is the right scope for a
// module-private function and the wrong scope for an exported one: `promoteAdmitted` is part of the
// surface a host repository's workflows call, so "who calls it" is a question about the tracked
// corpus, not about one file. The derivation therefore resolves IMPORT ALIASES — `import
// { promoteAdmitted as ctxPromoteAdmitted }` is exactly how the compactor names it, and a
// name-matching regex would report that caller as absent.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Every tracked NON-TEST source under scripts/, hooks/ and install/ — the corpus a caller can hide in. */
function trackedSources(): string[] {
  const sources = trackedFiles("scripts/*.ts", "hooks/*.ts", "install/*.ts").filter(
    (p) => !p.endsWith(".test.ts"),
  );
  expect(sources.length, "PREMISE: no tracked sources were listed at all").toBeGreaterThan(10);
  return sources;
}

/**
 * Every `<file>::<function>` in the tracked corpus whose body calls `routeName` as exported by the
 * module whose compiled specifier ends with `moduleSuffix`. Import aliases are resolved through the
 * import clause's own `propertyName`, so a renamed binding is still the same callee.
 */
function deriveRouteCallers(routeName: string, moduleSuffix: string): string[] {
  const out: string[] = [];
  for (const rel of trackedSources()) {
    const source = ts.createSourceFile(rel, readFileSync(join(ROOT, rel), "utf8"), ts.ScriptTarget.Latest, true);
    const aliases = new Set<string>();
    const isDeclaring = rel.endsWith(moduleSuffix.replace(".js", ".ts"));
    if (isDeclaring) aliases.add(routeName);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      if (!statement.moduleSpecifier.text.endsWith(moduleSuffix)) continue;
      const named = statement.importClause?.namedBindings;
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) {
          if ((element.propertyName ?? element.name).text === routeName) aliases.add(element.name.text);
        }
      }
    }
    if (aliases.size === 0) continue;
    for (const statement of source.statements) {
      if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
      if (isDeclaring && statement.name.text === routeName) continue; // the declaration is not a caller
      let count = 0;
      const walk = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && aliases.has(node.expression.text)) {
          count += 1;
        }
        ts.forEachChild(node, walk);
      };
      if (statement.body) walk(statement.body);
      if (count > 0) out.push(`${rel}::${statement.name.text}`);
    }
  }
  return out.sort();
}

/**
 * MEASURED on 2026-09-08. The re-binding route has exactly one in-repo caller: the compactor's
 * pass-through. Everything else that calls it is a host repository's workflow, which is why the
 * prose in `agent-factory/workflows/18-context-compaction.md` moves in the same plan as the route.
 */
const EXPECTED_REBINDING_CALLERS = Object.freeze(["scripts/compactor.ts::promoteAdmitted"]);

/**
 * MEASURED in the same reading: the full-admission route's in-repo callers. The third is the
 * re-binding route's own FALL-THROUGH, which is the caller that did not exist before 31-14.
 */
const EXPECTED_FULL_ADMISSION_CALLERS = Object.freeze([
  "scripts/check-uat-oracles.ts::equivDoWork",
  "scripts/compactor.ts::promote",
  "scripts/context-io.ts::promoteAdmitted",
]);

describe("31-14 — the callers of both promotion routes are derived across files, aliases resolved", () => {
  it("the re-binding route's caller set is exactly the compactor's pass-through", () => {
    expect(
      deriveRouteCallers("promoteAdmitted", "context-io.js"),
      "a caller of the re-binding route landed or left. Each one can skip the human-stamp arm when " +
        "its proof holds, so a new caller is a decision with a written reason, never a widened list",
    ).toEqual([...EXPECTED_REBINDING_CALLERS]);
  });

  it("the full-admission route's caller set gained the fall-through and nothing else", () => {
    expect(deriveRouteCallers("appendNote", "context-io.js")).toEqual([
      ...EXPECTED_FULL_ADMISSION_CALLERS,
    ]);
  });

  it("the derivation RESOLVES ALIASES — a name-matching search would miss the one real caller", () => {
    // The compactor imports the route as `ctxPromoteAdmitted`. This case exists so the derivation's
    // alias handling is a measured property rather than an implementation detail nobody checked:
    // the caller is found even though its call site never spells the exported name.
    const compactor = readFileSync(join(ROOT, "scripts", "compactor.ts"), "utf8");
    expect(compactor).toContain("promoteAdmitted as ctxPromoteAdmitted");
    expect(deriveRouteCallers("promoteAdmitted", "context-io.js")).toContain(
      "scripts/compactor.ts::promoteAdmitted",
    );
  });
});

// ─── The register's PROSE enumeration is bound to the derived set, by the suite, not by hand. ───
//
// RE-HOMED IN 31-18, WITH THE REASON. 31-14 bound this enumeration to `31-14-SUMMARY.md`. A plan
// summary is a HISTORICAL record of what one round did, and the derived clause set is a STANDING
// answer that every later round may move — so the binding made the current answer depend on a
// document that must not be rewritten, and the only ways to keep it green were to falsify a
// historical record or to weaken the check. Both are the failure this phase keeps paying for.
//
// The enumeration therefore lives where the current answer lives: the phase's DECISIONS file, beside
// D-19 and its sub-decisions. `31-14-SUMMARY.md` keeps its own six-row table untouched as the
// history of that round; this case no longer reads it. The fail-closed premise is unchanged — a
// missing file or a renamed heading must not make the binding vacuous.
const DECLINE_DISPOSITION_DOC = join(
  ROOT,
  ".planning",
  "phases",
  "31-autonomous-manual-testing",
  "31-CONTEXT.md",
);

/** The heading the decline enumeration sits under, in one place so both sides agree. */
const SUMMARY_DECLINE_HEADING = "### Derived decline clauses and their dispositions";

describe("31-14 — the register's decline enumeration equals the derived set", () => {
  it("the disposition document exists and carries the enumeration heading", () => {
    // FAIL-CLOSED. A missing document, or a renamed heading, must not make the binding below vacuous
    // — an empty enumeration equals an empty derived set and would report coverage that was never
    // written down.
    expect(
      existsSync(DECLINE_DISPOSITION_DOC),
      `the disposition document is absent at ${DECLINE_DISPOSITION_DOC}, so the enumeration this ` +
        `case binds cannot be read`,
    ).toBe(true);
    expect(readFileSync(DECLINE_DISPOSITION_DOC, "utf8")).toContain(SUMMARY_DECLINE_HEADING);
  });

  it("every derived decline clause is enumerated, and the document names no other", () => {
    const text = readFileSync(DECLINE_DISPOSITION_DOC, "utf8");
    const section = text.slice(text.indexOf(SUMMARY_DECLINE_HEADING));
    const table = section.slice(0, section.indexOf("\n#", 1) === -1 ? undefined : section.indexOf("\n#", 1));
    const enumerated = [
      ...new Set(
        table
          .split("\n")
          .filter((line) => line.startsWith("| `"))
          .map((line) => line.slice(3, line.indexOf("`", 3))),
      ),
    ].sort();
    expect(
      enumerated,
      "the written decline enumeration and the clauses derived from the route's own body " +
        "disagree. A written disposition for a clause that no longer exists reads as coverage and " +
        "is not; a clause with no written disposition is the silence this plan exists to remove",
    ).toEqual(derivedDeclineKeys(CONTEXT_IO_TS));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART SIX-E — the DESTINATION-LIVENESS axis (31-18, CR-11).
//
// THE AXIS NOBODY DROVE, AND WHY NO GREEN SUITE SAW CR-11. Every promotion probe in rounds 1 through
// 4 of this phase promoted into a FRESH destination. So the question "what does this writer do when
// the destination ALREADY holds a note at the id it is about to write?" was never asked of any
// writer, and `promoteAdmitted` — the one writer that takes its id from an ARGUMENT rather than
// deriving it — silently replaced an admitted note with no diagnostic, with a green suite.
//
// THE AXIS IS DERIVED, NOT LISTED. The writer set is the one PART ONE derives. Each writer's
// destination-id SOURCE is derived too: a writer whose own body calls `noteId` mints its id behind a
// `randomUUID` collision nonce and can only ever ADD a file; a writer that does not is taking its id
// from somewhere else, which is the shape CR-11 is about. Both the membership and the classification
// are asserted in BOTH directions with their cardinalities separate, so a new writer — of either
// class — arrives as a failing derived case rather than as the next round's finding.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The id-minting authority every derived-id writer calls. Named once so the derivation reads. */
const ID_MINTER = "noteId";

type DestinationIdSource = "derived" | "caller";

/**
 * THE FOURTH DERIVATION: how each derived note writer's destination id is decided.
 *
 * A writer whose own body calls the id minter derives its id; anything else takes it from a
 * parameter or from a value a caller supplied. This reads the writer's OWN body rather than its
 * closure, because a writer that reaches the minter only through a shared helper (`appendNote` and
 * `promoteAdmitted` both reach it through `composeValidatedNote`) is passing that helper an id it
 * was given — which is exactly the distinction the axis turns on.
 */
function deriveDestinationIdSources(sourcePath: string): Map<string, DestinationIdSource> {
  const analysis = analyze(sourcePath);
  const out = new Map<string, DestinationIdSource>();
  for (const name of deriveNoteWriters(sourcePath)) {
    out.set(name, (analysis.calls.get(name)?.has(ID_MINTER) ?? false) ? "derived" : "caller");
  }
  return out;
}

interface DestinationLivenessBinding {
  /** How this writer's destination id is decided — asserted against the derivation above. */
  readonly idSource: DestinationIdSource;
  /** The written decision (or named residual) for this writer at an occupied destination. */
  readonly reason: string;
  /** Drive the writer into a destination that ALREADY holds a note. Returns nothing; it must write. */
  readonly driveBesideExisting: (dest: string, task: string, repoRoot: string) => void;
  /**
   * Aim the writer at the OCCUPIED id itself. Present only for a caller-id writer — a derived-id
   * writer cannot be aimed, which is precisely its binding. Returns the refusal message.
   */
  readonly aimAtOccupied?: (dest: string, task: string, repoRoot: string, occupied: string) => string;
}

const LIVENESS_TASK = "destination-liveness";
const LIVENESS_BODY = "the note already living at the destination";

/** Plant ONE note at a destination through the ordinary writer, and return its id and bytes. */
function plantExistingNote(dest: string, repoRoot: string): { id: string; text: string } {
  const id = mod.appendNote(LIVENESS_TASK, softNote(), LIVENESS_BODY, dest, undefined, repoRoot);
  expect(id, "PREMISE: the destination seed did not write, so no case below faces a live note").toBeTruthy();
  return { id, text: readFileSync(join(dest, LIVENESS_TASK, "notes", `${id}.md`), "utf8") };
}

const LIVENESS_CHECKPOINT_INPUT = {
  checkpoint: "protected_branch_merge",
  declared: "block",
  effective: "block",
  authorizedBy: null,
  envVarName: "GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE",
  outcome: "refused",
  actionApproval: null,
  actor: "tool=Bash session=s1",
  command: "git push origin main",
} as const;

/**
 * ONE BINDING PER DERIVED NOTE WRITER. Every member states what it does at a destination that
 * already holds a note, and every member is DRIVEN there — never described.
 */
const DESTINATION_LIVENESS: Readonly<Record<string, DestinationLivenessBinding>> = Object.freeze({
  admitAndAppend: {
    idSource: "derived",
    reason:
      "Derives its id through noteId's randomUUID nonce in BOTH branches, so no caller can aim it " +
      "at an occupied id: it can only ever ADD a file. Still subject to the append-only chokepoint.",
    driveBesideExisting: (dest, task, repoRoot) => {
      const result = mod.admitAndAppend(task, softNote({ at: "2026-09-08T04:00:00Z" }), "beside", dest, repoRoot);
      expect(result.findings).toEqual([]);
      expect(result.id).toBeTruthy();
    },
  },
  appendNote: {
    idSource: "caller",
    reason:
      "Accepts a caller-chosen precomputedId (the frozen-identity seam admitAndAppend and the " +
      "re-binding route both use), so it CAN be aimed at an occupied id — and is refused there by " +
      "the append-only chokepoint, with the existing note's bytes untouched.",
    driveBesideExisting: (dest, task, repoRoot) => {
      expect(mod.appendNote(task, softNote({ at: "2026-09-08T04:00:00Z" }), "beside", dest, undefined, repoRoot)).toBeTruthy();
    },
    aimAtOccupied: (dest, task, repoRoot, occupied) => {
      try {
        mod.appendNote(task, softNote({ by: "architect-design" }), "a different body", dest, occupied, repoRoot);
      } catch (e) {
        return (e as Error).message;
      }
      return "";
    },
  },
  emitCheckpointNote: {
    idSource: "derived",
    reason:
      "Derives its id through noteId inside the reserved-identity emitter; its inputs carry no id " +
      "at all, so it can only ever ADD a file. Still subject to the append-only chokepoint.",
    driveBesideExisting: (dest, task) => {
      expect(mod.emitCheckpointNote({ ...LIVENESS_CHECKPOINT_INPUT }, dest, "2026-09-08T04:00:00Z", task)).toBeTruthy();
    },
  },
  emitVerdict: {
    idSource: "derived",
    reason:
      "Derives its NOTE id through noteId; the `id` it takes is the per-RUN gate id interpolated " +
      "into a ref, never the destination filename. It can only ever ADD a file. Still subject to " +
      "the append-only chokepoint.",
    driveBesideExisting: (dest, task) => {
      expect(
        mod.emitVerdict(task, "RUN-31-18-LIVENESS", "clean", FABRICATED_SHA, dest, "2026-09-08T04:00:00Z"),
      ).toBeTruthy();
    },
  },
  promoteAdmitted: {
    idSource: "caller",
    reason:
      "Takes its write id from sourceId, an argument — the CR-11 shape. It reads the destination " +
      "through the same reader its proof uses and DECLINES destination-id-occupied before the " +
      "chokepoint is reached, so nothing is written by construction rather than by cleanup.",
    driveBesideExisting: (dest, task, repoRoot) => {
      const origin = livenessContextStore("ctx-io-liveness-beside-origin-");
      const note = disposedFinding({ at: "2026-09-08T04:00:00Z" });
      const id = mod.admitAndAppend(task, note, "beside", origin, repoRoot).id as string;
      expect(id).toBeTruthy();
      expect(mod.promoteAdmitted(task, id, note, "beside", origin, dest, repoRoot)).toBe(id);
    },
    aimAtOccupied: (dest, task, repoRoot, occupied) => {
      const origin = livenessContextStore("ctx-io-liveness-aimed-origin-");
      const note = disposedFinding();
      // The origin holds a DIFFERENT note under the destination's occupied id — the reviewer's own
      // staging, minus the forgery, because the destruction does not need one.
      const lean = freshTmp("ctx-io-liveness-lean-repo-");
      mod.appendNote(task, note, "the origin body", origin, occupied, lean);
      try {
        mod.promoteAdmitted(task, occupied, note, "the origin body", origin, dest, repoRoot);
      } catch (e) {
        return (e as Error).message;
      }
      return "";
    },
  },
});

/** A CONTEXT STORE — the shape the module recognises, not an arbitrary caller-named directory. */
function livenessContextStore(prefix: string): string {
  const store = join(freshTmp(prefix), ".grugops", "context");
  mkdirSync(store, { recursive: true });
  return store;
}

/** The writers a caller can aim at a destination id. MEASURED, never widened to make a case pass. */
const EXPECTED_CALLER_ID_WRITERS = Object.freeze(["appendNote", "promoteAdmitted"]);

/** Its cardinality, asserted separately: a THIRD aimable writer is a decision, not a constant bump. */
const EXPECTED_CALLER_ID_WRITER_COUNT = 2;

describe("31-18 — the destination-liveness axis is derived, and every writer is driven at a live destination", () => {
  it("PREMISE: the id-minter is a real declaration, so the classification below is not vacuous", () => {
    const analysis = analyze(CONTEXT_IO_TS);
    expect(
      analysis.calls.has(ID_MINTER),
      `PREMISE: no function named ${ID_MINTER} was declared, so every writer would classify as ` +
        `"caller" for a reason that says nothing about how it mints an id`,
    ).toBe(true);
  });

  it("the binding record's KEY SET equals the derived writer set, in BOTH directions", () => {
    expect(
      Object.keys(DESTINATION_LIVENESS).sort(),
      "a derived note writer has no destination-liveness binding (or a binding names a writer the " +
        "module no longer has). Every writer states what it does at a live destination, or the " +
        "axis is not covered",
    ).toEqual(deriveNoteWriters(CONTEXT_IO_TS));
  });

  it("the binding record has the expected COUNT", () => {
    expect(Object.keys(DESTINATION_LIVENESS).length).toBe(EXPECTED_NOTE_WRITER_COUNT);
  });

  it("every binding's idSource equals the DERIVED classification", () => {
    const derived = deriveDestinationIdSources(CONTEXT_IO_TS);
    for (const [name, binding] of Object.entries(DESTINATION_LIVENESS)) {
      expect(
        binding.idSource,
        `the destination-liveness binding for ${name} claims its id is ${binding.idSource}, and the ` +
          `derivation from its own body says ${derived.get(name)}`,
      ).toBe(derived.get(name));
    }
  });

  it("the CALLER-id subset has the expected MEMBERS and COUNT", () => {
    const derived = deriveDestinationIdSources(CONTEXT_IO_TS);
    const callerIds = [...derived.entries()].filter(([, source]) => source === "caller").map(([n]) => n).sort();
    expect(
      callerIds,
      "the set of writers a caller can aim at a chosen destination id moved. Each one can turn an " +
        "append into a rewrite, so it needs an aimed case here — never a widened constant",
    ).toEqual([...EXPECTED_CALLER_ID_WRITERS]);
    expect(callerIds.length).toBe(EXPECTED_CALLER_ID_WRITER_COUNT);
  });

  it("every binding carries a non-empty written reason", () => {
    for (const [name, binding] of Object.entries(DESTINATION_LIVENESS)) {
      expect(binding.reason.length, `the binding for ${name} carries an empty reason`).toBeGreaterThan(60);
    }
  });

  for (const name of Object.keys(DESTINATION_LIVENESS)) {
    it(`${name}: writes BESIDE a pre-existing destination note and leaves it byte-identical`, () => {
      const binding = DESTINATION_LIVENESS[name];
      const repoRoot = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
      const dest = livenessContextStore(`ctx-io-liveness-beside-${name}-`);
      const existing = plantExistingNote(dest, repoRoot);
      binding.driveBesideExisting(dest, LIVENESS_TASK, repoRoot);
      expect(
        noteFileCount(dest, LIVENESS_TASK),
        `${name} did not ADD beside the pre-existing note`,
      ).toBe(2);
      expect(
        readFileSync(join(dest, LIVENESS_TASK, "notes", `${existing.id}.md`), "utf8"),
        `${name} moved the bytes of a note it did not author`,
      ).toBe(existing.text);
    });
  }

  for (const name of EXPECTED_CALLER_ID_WRITERS) {
    it(`${name}: AIMED at the occupied id, it refuses and the existing note survives`, () => {
      const binding = DESTINATION_LIVENESS[name];
      expect(binding.aimAtOccupied, `${name} is a caller-id writer with no aimed case`).toBeTypeOf("function");
      const repoRoot = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
      const dest = livenessContextStore(`ctx-io-liveness-aimed-${name}-`);
      const existing = plantExistingNote(dest, repoRoot);
      const message = (binding.aimAtOccupied as NonNullable<typeof binding.aimAtOccupied>)(
        dest,
        LIVENESS_TASK,
        repoRoot,
        existing.id,
      );
      expect(
        message,
        `${name} was ADMITTED at an occupied destination id — an already-admitted note was replaced`,
      ).not.toBe("");
      expect(message).toContain(existing.id);
      expect(noteFileCount(dest, LIVENESS_TASK), `${name} left a file behind`).toBe(1);
      expect(
        readFileSync(join(dest, LIVENESS_TASK, "notes", `${existing.id}.md`), "utf8"),
        `${name} destroyed an already-admitted note at the destination`,
      ).toBe(existing.text);
    });
  }

  it("a derived-id writer cannot be AIMED at all — asserted, not assumed", () => {
    const derived = deriveDestinationIdSources(CONTEXT_IO_TS);
    const derivedIds = [...derived.entries()].filter(([, s]) => s === "derived").map(([n]) => n).sort();
    expect(derivedIds.length).toBe(EXPECTED_NOTE_WRITER_COUNT - EXPECTED_CALLER_ID_WRITER_COUNT);
    for (const name of derivedIds) {
      expect(
        DESTINATION_LIVENESS[name].aimAtOccupied,
        `${name} derives its id, so an aimed case would be measuring something other than what it does`,
      ).toBeUndefined();
    }
  });
});

// ─── PART SIX-E CONTROL — the axis DISCRIMINATES, watched failing. ─────────────────────────────

describe("31-18 — the destination-liveness axis is a control, not a coincidence", () => {
  it("a SEEDED caller-id writer moves the derived count by exactly one and arrives UNBOUND", () => {
    const mirror = mirrorWithExtraWriter();
    const before = deriveDestinationIdSources(CONTEXT_IO_TS);
    const after = deriveDestinationIdSources(mirror);
    expect(after.size).toBe(EXPECTED_NOTE_WRITER_COUNT + 1);
    expect(after.size - before.size).toBe(1);
    // The seeded writer takes `id` as a parameter and mints nothing, which is exactly the CR-11
    // shape — so it classifies CALLER, and it is UNBOUND in the binding record.
    expect(after.get(SEEDED_WRITER)).toBe("caller");
    const callerIdsAfter = [...after.entries()].filter(([, s]) => s === "caller").map(([n]) => n).sort();
    expect(callerIdsAfter.length).toBe(EXPECTED_CALLER_ID_WRITER_COUNT + 1);
    const unbound = [...after.keys()].filter((n) => !(n in DESTINATION_LIVENESS));
    expect(
      unbound,
      "the seeded writer was already bound, so the both-directions binding above could not have " +
        "reported it as unbound",
    ).toEqual([SEEDED_WRITER]);
    // …and the same computation against the UN-SEEDED source finds nothing unbound, which is what
    // makes the case above a control rather than a claim about mirrors in general.
    expect([...before.keys()].filter((n) => !(n in DESTINATION_LIVENESS))).toEqual([]);
  });

  it("the non-note filesystem writer that CAN overwrite is still the disclosed residual", () => {
    // `atomicWrite` renames onto whatever is there and is exported. It does not reach writeNoteFile,
    // so the append-only chokepoint does not bind it — which is why it stays a NAMED residual here
    // rather than a silence the next round finds.
    expect(NON_NOTE_WRITER_RESIDUALS).toContain("atomicWrite");
    expect(deriveNoteWriters(CONTEXT_IO_TS)).not.toContain("atomicWrite");
  });
});
