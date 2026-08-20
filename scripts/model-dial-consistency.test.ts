// model-dial-consistency.test.ts — the cross-surface oracle for the model dial's PROSE (MODEL-02,
// MODEL-06, Phase 29.1, D-13).
//
// WHAT THIS ORACLE IS FOR, AND WHY IT ASSERTS A POINTER RATHER THAN PROSE. Three documents in this
// repository have something to say about per-role model assignment: the packaging template that the
// adapter generator is built from, the config field reference a user reads while configuring the
// dial, and CLAUDE.md's "What NOT to Use" row against a hand-written `model:` in a role wrapper.
// Three surfaces each carrying their OWN statement of the same scope is the failure D-13 exists to
// prevent — they can every one be true individually and still disagree with each other, and nothing
// mechanical notices. So the scope statement has ONE authority, and the other surfaces POINT AT IT.
// This oracle holds that shape from both sides: the sentence is asserted PRESENT in exactly one file
// and ABSENT from the file that points at it, and the pointer is asserted as a literal path. It does
// NOT assert the wording of the pointing document's own prose, because asserting the prose is how a
// second authority is born.
//
// WHAT IT DOES NOT DUPLICATE. `scripts/check-foundation-guards.test.ts` already holds the two config
// JSONs byte-identical to each other, and `guard_model_assignment` already reads the committed
// adapter bytes. This oracle asserts neither. It asserts the D-04 consequence — that NEITHER JSON
// carries a `models` key — and states in the case itself that the byte-identity case is why a key in
// one would require it in the other.
//
// UNKNOWN - verify — THE RESIDUAL, WITH ITS DIRECTION STATED. Every comparison in this file is an
// exact code-point substring match over utf8-decoded text. No Unicode normalization is applied and
// no case folding is applied, so a homoglyph, a non-breaking hyphen, or an NFC/NFD variant of the
// scope sentence would not match any literal here. The direction that matters is bounded by the
// two-sided shape rather than by the matcher: the sentence is asserted PRESENT in exactly one file
// AND ABSENT from one other, so a normalization-variant restatement fails the PRESENCE direction
// (the authority no longer carries the sentence this file pins) rather than silently satisfying the
// absence direction. A variant planted into the pointing file alone is NOT caught, and that is the
// residual, disclosed here rather than implied by silence.
//
// Drives the COMMITTED documents on disk (no .ts build). Vitest globals:false → import explicitly.

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { MODEL_ALIASES, MODELS_CONFIG_CANDIDATE_RELS, PRESET_NAMES } from "./model-tiers.js";
import { listPackagingTemplates } from "./kit-model.js";
import { REGISTRY_PATH } from "./audit-model.js";

const ROOT = join(import.meta.dirname, "..");

// ── The surface roster, keyed by the ROLE each surface plays in D-13's shape. ──────────────────
// Keyed rather than listed so each surface is named by the JOB it does, and so a case that wants
// "the authority" asks for it by role rather than by position.
const SURFACE_ROLES = {
  authority: "agent-factory/packaging/subagent.frontmatter.md",
  pointer: "agent-factory/config/factory.config.md",
  hostGuidance: "CLAUDE.md",
} as const;

// ── THE RUN-TIME DERIVATION THE ROSTER IS CHECKED AGAINST (finding IN/WR — the two-sided pin) ───
//
// WHAT WAS WRONG BEFORE, STATED PLAINLY BECAUSE IT IS THIS REPOSITORY'S NAMED SECOND SYSTEMIC
// FAILURE CLASS. `SURFACE_COUNT` used to be the literal `3`, typed twelve lines under a
// three-entry object, and the "derived" surface list was derived FROM THAT OBJECT. Both sides of
// the two-sided pin were therefore supplied by one hand-written list, edited together by
// construction: deleting a surface and moving the literal in the same commit left every case
// green, and the vacuity floor could not fire because the denominator moved with the numerator.
// A pin whose two sides move together certifies nothing, and plan 05's claim that this oracle
// derives its surface list was true only of a derivation from itself.
//
// WHAT REPLACES IT. The roster is now cross-checked against a set DERIVED AT RUN TIME by scanning
// the documents this repository ships for a marker, with the expected count taken from that
// derivation instead of from a literal. The roster object stays — a case still needs to ask for
// "the authority" by role — but it no longer supplies its own denominator.
//
// THE MARKER, AND THE MEASUREMENT THAT CHOSE IT (recorded before the design was fixed). A document
// that speaks about the model dial names the RESOLVER BY PATH. Measured over the corpus below:
//   "model dial"             → 2 hits; missed CLAUDE.md, whose row names the mechanism instead
//   "`models` block"         → 2 hits; missed CLAUDE.md for the same reason
//   "scripts/model-tiers.ts" → 3 hits, set-equal to the roster with no residual either way
// The third was chosen on that measurement, not on taste. Measured again over a broader corpus of
// 78 shipped markdown files, it still returns exactly those three.
const DIAL_SURFACE_MARKER = "scripts/model-tiers.ts";

/**
 * Every `.md` file under `dir`, repo-relative and POSIX-spelled, recursively. Dot-directories are
 * skipped: `.planning/` is planning material rather than shipped prose, and `.git/` is not text.
 */
function markdownUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (at: string): void => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const abs = join(at, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name.endsWith(".md")) out.push(relative(ROOT, abs).split(sep).join("/"));
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * THE CANDIDATE CORPUS — every markdown document this repository SHIPS as prose.
 *
 * Three families, each derived rather than listed: the kit's own documents, the published `docs/`
 * tree, and the repo-root entry files a host CLI reads. `.planning/` is deliberately outside it —
 * those are planning artefacts, not documents a user of the kit is handed — and that exclusion is
 * a disclosed residual below rather than a silent one.
 */
function dialCandidateCorpus(): string[] {
  const rootLevel = readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();
  return [
    ...markdownUnder(join(ROOT, "agent-factory")),
    ...markdownUnder(join(ROOT, "docs")),
    ...rootLevel,
  ].sort();
}

/**
 * THE CORPUS'S OWN PREMISE, asserted against an authority that did not produce it.
 *
 * A vacuity floor catches an EMPTY denominator and never a SILENTLY SHORT one. If the walk above
 * lost a directory — a swallowed readdir, a filter typo, a rename — the derived surface set would
 * quietly shrink and the roster comparison would still be a comparison, just over less. So the
 * corpus is checked for containment of a set the KIT AUTHORITY produces independently: every
 * packaging template `listPackagingTemplates` reports must appear in the walk. That lister has its
 * own non-empty floor and its own directory, and it shares no code with the walk.
 *
 * Returns the packaging templates the walk MISSED — empty when the premise holds.
 */
function corpusPremiseGaps(corpus: readonly string[]): string[] {
  const expected = listPackagingTemplates(ROOT).map((f) => `agent-factory/packaging/${f}`);
  return expected.filter((rel) => !corpus.includes(rel));
}

/**
 * The corpus members that carry the marker, PARTITIONED into prose surfaces and claim registers.
 *
 * THE REGISTER ARM EXISTS BECAUSE ONE MEASURED HIT IS NOT A PROSE SURFACE, and it is subtracted by
 * IDENTITY AGAINST THE AUDIT AUTHORITY'S OWN CONSTANT rather than by a path typed here.
 * `REGISTRY_PATH` is `scripts/audit-model.ts`'s declaration of this repository's claim register:
 * a document whose rows QUOTE claims made elsewhere, held byte-for-byte by `check-audit-register`
 * and `check-banned-claims`. A register that quotes a claim is not a surface that makes one, and
 * counting it as a fourth D-13 prose surface would be circular.
 *
 * THIS IS A PARTITION, NOT A FILTER, and the distinction is the whole point. Exactly one file — the
 * one another authority names as the register — can land in the register arm. Every OTHER document
 * that starts naming the resolver lands in the prose arm and turns the roster comparison red, which
 * is the direction the old hand-typed count structurally could not fail on.
 */
function derivedDialSurfaces(): { prose: string[]; registers: string[] } {
  const corpus = dialCandidateCorpus();
  const gaps = corpusPremiseGaps(corpus);
  if (gaps.length > 0) {
    throw new Error(
      "model-dial oracle: CORPUS PREMISE VIOLATED — the markdown walk did not reach " +
        `${String(gaps.length)} packaging template(s) the kit authority ships: ${gaps.join(", ")}. ` +
        "Refusing to derive a surface set from a corpus that is silently short: a shortened corpus " +
        "makes the roster comparison pass over less rather than fail, which is the failure this " +
        "premise exists to make loud. Remedy: fix the walk, or move it in the same commit that " +
        "moves what the kit ships.",
    );
  }
  const hits = corpus.filter((rel) => readFileSync(join(ROOT, rel), "utf8").includes(DIAL_SURFACE_MARKER));
  return {
    prose: hits.filter((rel) => rel !== REGISTRY_PATH),
    registers: hits.filter((rel) => rel === REGISTRY_PATH),
  };
}

/**
 * THE VACUITY FLOOR'S EXPECTED NUMBER — DERIVED, never typed.
 *
 * This is the number the roster is adjudicated against, and it comes from the run-time scan rather
 * than from the object the scan is compared to. That is the entire repair: deleting a roster entry
 * can no longer be made green by moving a literal, because there is no literal to move.
 *
 * WHAT IS DERIVED AND WHAT IS NAMED, so no part of this is left to be inferred:
 *   - DERIVED — that there are exactly this many dial-discussing prose surfaces, and which files
 *     they are. Both come from the scan.
 *   - NAMED — which ROLE each of those files plays in D-13's shape (authority / pointer /
 *     host-guidance). No scan can decide that; it is a design fact and it stays in SURFACE_ROLES.
 *
 * DISCLOSED RESIDUALS, with their directions:
 *   R-a  `.planning/**` is outside the corpus. A planning document that restates the dial's rules
 *        is not caught here. Direction: planning artefacts are not shipped to a user, so a
 *        disagreement there misleads this project rather than its users — and phase verification
 *        reads those documents directly.
 *   R-b  Only `.md` files are scanned. Dial prose living in a JSON, or fenced inside a `.ts`, is
 *        invisible to this derivation. Direction: it would go UNDETECTED, not falsely detected.
 *   R-c  The marker is the resolver's path. A document discussing the dial WITHOUT naming that
 *        path is not caught — measured above: `"model dial"` alone missed CLAUDE.md. Direction:
 *        again undetected rather than falsely detected, so this floor is a lower bound on the
 *        surfaces in play, never an over-count.
 */
const SURFACE_COUNT = derivedDialSurfaces().prose.length;

/**
 * The number of sites in the config field reference that DECLARE a closed set. Two per set today —
 * the `## Fields` row and the `### models sub-fields` table row — and the oracle checks EVERY site
 * rather than the first, so two declarations in one document cannot drift apart either.
 *
 * PROMOTE TRIGGER: a third declaration site moves this number in the commit that writes it.
 */
const CLOSED_SET_DECLARATION_SITES = 2;

/** The CLAUDE.md row this phase amends, pinned by the text of its FIRST column. */
const CLAUDE_ROW_KEY = "**`model:` other than `inherit` in role wrappers without reason**";

/**
 * The D-13 scope sentence, verbatim. It lives on ONE physical line in the authority document so this
 * literal needs no wrap handling; a hard wrap introduced there is a RED on the presence direction,
 * which is the correct outcome — the sentence is quoted by an oracle and its shape is load-bearing.
 *
 * THE SENTENCE CHANGED IN THE 29.1 GAP-CLOSURE ROUND (WR-06), AND THE REASON IS WHY THIS ORACLE NOW
 * ASSERTS MORE THAN PRESENCE. The previous wording asserted a capability absolute about four
 * third-party products with no source behind it. Gap-closure research refuted its premise —
 * `.planning/phases/29.1-per-role-model-assignment/29.1-RESEARCH.md` §"Host-CLI per-agent model
 * support", where the superseded sentence is recorded verbatim, this repository annotating rather
 * than rewriting; all four of those CLIs document a per-agent `model` field. The CONCLUSION — that
 * the dial does not reach them — survived, but for a different reason, one that is a fact about THIS
 * repository and is provable here: grugops generates per-agent adapters at `.claude/agents/` alone.
 * The retired wording is deliberately NOT quoted anywhere in this module. An oracle that pins a
 * sentence propagates it, and the round that had to delete this one found that the pin was the
 * mechanism by which an unsourced claim reached every other surface. So the cases below assert the
 * ATTRIBUTION instead: every host CLI the sentence NAMES must carry a citation line beside it.
 *
 * WHAT THAT STILL DOES NOT CATCH, stated rather than implied: a SECOND sentence contradicting this
 * one, added elsewhere in the authority, leaves every case here green. The presence direction pins
 * one sentence, not the absence of a competing one. The compensating control is the negative grep
 * recorded in `.planning/phases/29.1-per-role-model-assignment/29.1-10-SUMMARY.md`, run over the
 * whole shipped tree at plan close, and phase verification re-runs it.
 */
const SCOPE_SENTENCE =
  "The model dial reaches Claude Code only, and that is a fact about this kit rather than about the " +
  "other four host CLIs: grugops generates per-agent adapters at `.claude/agents/` alone, so " +
  "although Codex CLI, Gemini CLI, OpenCode and GitHub Copilot CLI each accept a per-agent `model` " +
  "field in their own agent-definition formats, this kit emits no agent definition for any of them " +
  "and there is nothing there for the dial to write into.";

/** The heading that opens the authority's scope section — the left bound of every section-scoped read. */
const SCOPE_SECTION_HEADING = "## Host-CLI scope of the model dial";

/** The line that opens the citation block, and the left bound of the citation-line extraction. */
const CITATION_BLOCK_HEADING = "References for the per-agent `model` field in each of the other four";

/**
 * The assumption-A1 block's OWN anchor.
 *
 * REPAIRED IN THE SAME EDIT THAT ADDED RESIDUALS R1-R3. The A1 case used to locate its block with
 * `indexOf("UNKNOWN - verify")` — the FIRST marker in the file — which was sound only while the
 * authority carried exactly one. That premise is now false: it carries four. A case that anchors on
 * "the first of a kind" silently re-targets the moment a second one lands above it, and the failure
 * is not visible in a green run. It anchors on its own block instead.
 */
const A1_ANCHOR = "the alias vocabulary (assumption A1, recorded confidence low)";

/**
 * The disclosed residuals in the authority, each pinned by its OWN anchor rather than by position.
 *
 * PROMOTE TRIGGER: a fourth residual is added to this array in the same commit that writes it into
 * the document, and moves UNKNOWN_VERIFY_MARKER_COUNT with it.
 */
const RESIDUAL_ANCHORS = [
  "R1, the vendor findings are point-in-time reads",
  "R2, Copilot CLI's `model` property at run time",
  "R3, whether grugops should emit for the other four",
] as const;

/**
 * Every `UNKNOWN - verify` marker in the authority document, pinned as a NUMBER.
 *
 * Four today: assumption A1, plus residuals R1, R2 and R3. This number exists so a fifth marker
 * cannot arrive silently — the previous shape of the A1 case measured "whichever marker comes
 * first", so a new one landing above A1 would have changed what an existing case measured without
 * changing any assertion. Now the count moves in the commit that adds the marker, and the reader of
 * that diff is told a residual was disclosed.
 *
 * PROMOTE TRIGGER: a new `UNKNOWN - verify` in agent-factory/packaging/subagent.frontmatter.md.
 */
const UNKNOWN_VERIFY_MARKER_COUNT = 1 + RESIDUAL_ANCHORS.length;

/**
 * The host CLIs the scope sentence names OTHER THAN Claude Code — DERIVED FROM THE SENTENCE ITSELF,
 * never hand-listed. The set the citation block must cover is exactly the set the sentence makes a
 * claim about, so the two cannot drift: naming a fifth CLI in the sentence without citing it, or
 * dropping one from the citation block, both go red.
 */
const OTHER_HOST_CLI_COUNT = 4;

function namedOtherHostClis(): string[] {
  const open = "although ";
  const close = " each accept a per-agent";
  const from = SCOPE_SENTENCE.indexOf(open);
  const to = SCOPE_SENTENCE.indexOf(close);
  if (from === -1 || to === -1 || to <= from) {
    throw new Error(
      "model-dial oracle: PREMISE VIOLATED — the scope sentence no longer carries the clause that " +
        "ENUMERATES the other host CLIs, so the set the citation block must cover cannot be derived " +
        "from it. Refusing to fall back to a hand-list: a hand-list is exactly how the citation " +
        "block and the sentence come to disagree. Remedy: keep the enumerating clause, or move this " +
        "derivation in the same commit that changes the sentence's shape.",
    );
  }
  return SCOPE_SENTENCE.slice(from + open.length, to)
    .split(/,\s*|\s+and\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const surfaces = Object.entries(SURFACE_ROLES).map(([role, rel]) => ({
  role,
  rel,
  abs: join(ROOT, rel),
}));

/**
 * THE PREMISE, ADJUDICATED AT MODULE LOAD — before any describe body opens a file.
 *
 * Written this way after the vacuity mutation was actually run: with the roster shortened to two,
 * the FIRST eager read inside a describe body threw "no surface registered under the role ...", the
 * file failed to COLLECT, and the cardinality case that exists to catch precisely that never
 * executed. A floor that a mutation reaches only after the harness has already died is a floor
 * nobody has tested. So the premise is asserted here, at load, and it names itself when it breaks.
 */
function assertRosterPremise(): void {
  const roles = Object.keys(SURFACE_ROLES);
  if (roles.length !== SURFACE_COUNT || surfaces.length !== SURFACE_COUNT) {
    // NAMES THE SURFACES, not only the counts. A count tells the reader that something moved; the
    // two difference lists tell them WHICH file, and in WHICH direction — a roster entry the scan
    // did not find, or a document the scan found that the roster does not carry.
    const derived = derivedDialSurfaces().prose;
    const rostered = Object.values(SURFACE_ROLES) as readonly string[];
    const missingFromRoster = derived.filter((rel) => !rostered.includes(rel));
    const missingFromDerivation = rostered.filter((rel) => !derived.includes(rel));
    throw new Error(
      `model-dial oracle: PREMISE VIOLATED — the surface roster names ${String(roles.length)} ` +
        `surface(s) [${roles.join(", ")}] and produced ${String(surfaces.length)} derived entr(ies), ` +
        `but the RUN-TIME SCAN found ${String(SURFACE_COUNT)} dial-discussing prose surface(s): ` +
        `[${derived.join(", ")}]. Derived but NOT in the roster: ` +
        `[${missingFromRoster.join(", ") || "none"}]. In the roster but NOT derived: ` +
        `[${missingFromDerivation.join(", ") || "none"}]. Refusing to report agreement across a ` +
        "roster of the wrong size — a SHORT roster agrees over a subset and an EMPTY one agrees " +
        "over nothing, and both of those are green runs. THE EXPECTED NUMBER IS NO LONGER A " +
        "LITERAL: it comes from the scan, so this cannot be silenced by moving a constant. Remedy: " +
        "restore the missing surface, or add the new one to SURFACE_ROLES under the role it plays " +
        "in D-13's shape.",
    );
  }
}
assertRosterPremise();

/** Occurrences of `needle` in `hay`, by exact code-point substring. Split-based, so it cannot regex. */
function occurrences(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

/** Read a surface by its role name, refusing rather than returning "" for a surface that is absent. */
function readSurface(role: keyof typeof SURFACE_ROLES): string {
  const entry = surfaces.find((s) => s.role === role);
  if (entry === undefined) throw new Error(`model-dial oracle: no surface registered under the role "${role}"`);
  if (!existsSync(entry.abs)) throw new Error(`model-dial oracle: surface "${role}" is missing at ${entry.rel}`);
  return readFileSync(entry.abs, "utf8");
}

/**
 * The authority's scope section: from its heading to the NEXT top-level heading, or to end of file.
 *
 * BOUNDED ON THE RIGHT ON PURPOSE. The section is the LAST one in the document today, so the bound
 * lands on end-of-file either way — which is exactly why the bound is written now rather than when
 * it first matters. A section reader that searches to EOF is not reading a section; it adopts every
 * later block that happens to be appended after it, and the day someone appends one, assertions
 * written about THIS section start passing on someone else's text.
 */
function scopeSection(): string {
  const authority = readSurface("authority");
  const at = authority.indexOf(SCOPE_SECTION_HEADING);
  if (at === -1) {
    throw new Error(
      `model-dial oracle: the authority ${SURFACE_ROLES.authority} does not carry the section ` +
        `heading "${SCOPE_SECTION_HEADING}" — refusing to read a section that is not there`,
    );
  }
  const rest = authority.slice(at + SCOPE_SECTION_HEADING.length);
  const next = rest.indexOf("\n## ");
  return next === -1 ? rest : rest.slice(0, next);
}

/**
 * The citation lines beneath the citation block's heading — the run of non-blank lines that follows
 * it, stopping at the first blank line. Derived rather than counted from a literal, so a citation
 * dropped from the document shortens this array instead of leaving a stale number standing.
 */
function citationLines(): string[] {
  const section = scopeSection();
  const at = section.indexOf(CITATION_BLOCK_HEADING);
  if (at === -1) {
    throw new Error(
      "model-dial oracle: the scope section does not carry the citation block heading " +
        `"${CITATION_BLOCK_HEADING}" — the sentence makes claims about four third-party products ` +
        "and this repository's hard rule is that such a claim ships with a named source",
    );
  }
  const out: string[] = [];
  for (const line of section.slice(at).split("\n").slice(1)) {
    if (line.trim().length === 0) break;
    out.push(line);
  }
  return out;
}

/**
 * Every closed set DECLARED in `text` under `marker`, one array per declaration site.
 *
 * The grammar is uniform at every site: the marker, then a run of backticked members, terminated by
 * the first `.`, `;`, `|` or line break. The terminator set includes `|` because two of the sites sit
 * inside a markdown table cell, where the sentence's own full stop is not the only boundary.
 */
function declaredSets(text: string, marker: string): string[][] {
  const found: string[][] = [];
  let from = 0;
  for (;;) {
    const at = text.indexOf(marker, from);
    if (at === -1) break;
    const rest = text.slice(at + marker.length);
    let end = rest.length;
    for (const stop of [".", ";", "|", "\n"]) {
      const i = rest.indexOf(stop);
      if (i !== -1 && i < end) end = i;
    }
    const clause = rest.slice(0, end);
    found.push([...clause.matchAll(/`([^`]+)`/g)].map((m) => m[1]));
    from = at + marker.length;
  }
  return found;
}

describe("model dial — the surface roster is adjudicated BEFORE any content assertion (MODEL-06)", () => {
  it("derives EXACTLY the scanned number of surfaces, pinned two-sided — the vacuity floor", () => {
    // TWO ASSERTIONS, AND THEY ARE NOT A DUPLICATE PAIR — recorded because finding IN-03 was about
    // exactly this line. `Object.keys(SURFACE_ROLES)` reads the ROSTER OBJECT; `surfaces` reads the
    // ARRAY BUILT FROM IT by the `Object.entries(...).map` above. Those are two different
    // derivations, and a mutation to either one alone must break this case, so both are stated.
    //
    // THE TWO BOUNDS ASSERTIONS THAT USED TO SIT HERE ARE GONE (IN-03). A lower-bound and an
    // upper-bound assertion on the same number were STRICTLY IMPLIED by the `toHaveLength`
    // immediately above them: they could not fail on any input that assertion accepted, so they
    // added no discrimination and cost a reader four assertions to find two facts. Their matcher
    // names are deliberately not spelled here, so a grep for a surviving bounds assertion in this
    // file returns zero rather than returning this comment.
    //
    // AND SURFACE_COUNT IS NO LONGER A LITERAL. It is the length of the run-time scan, so this
    // floor now compares the hand roster against something that is not the hand roster.
    expect(Object.keys(SURFACE_ROLES)).toHaveLength(SURFACE_COUNT);
    expect(surfaces).toHaveLength(SURFACE_COUNT);
  });

  it("the surface roster equals the set derived from the kit authority at run time", () => {
    // BOTH DIRECTIONS, REPORTED SEPARATELY, because they are two different mistakes with two
    // different remedies. A roster entry the scan did not find means a surface stopped discussing
    // the dial (or was renamed); a scanned file the roster does not carry means a fourth document
    // started discussing the resolver without joining D-13's shape. The second is the direction the
    // pre-fix hand-typed count structurally could not fail on.
    const { prose, registers } = derivedDialSurfaces();
    const rostered = [...(Object.values(SURFACE_ROLES) as readonly string[])].sort();

    // The floor first: a scan that found nothing would make both difference lists empty and this
    // case would agree over nothing. The corpus premise is asserted for the same reason one level
    // down — a SHORT corpus is invisible in a green run.
    expect(prose.length, "the run-time scan must find at least one dial surface").toBeGreaterThan(0);
    expect(corpusPremiseGaps(dialCandidateCorpus()), "the corpus must cover what the kit ships").toEqual(
      [],
    );

    expect(prose.filter((rel) => !rostered.includes(rel)), "derived but NOT in the roster").toEqual([]);
    expect(rostered.filter((rel) => !prose.includes(rel)), "in the roster but NOT derived").toEqual([]);

    // The register arm is asserted too, so the partition cannot quietly grow into a filter: only
    // the file the audit authority itself names may sit outside the prose set.
    expect(registers.filter((rel) => rel !== REGISTRY_PATH)).toEqual([]);
  });

  it("every derived surface exists on disk, naming any that does not", () => {
    const missing = surfaces.filter((s) => !existsSync(s.abs)).map((s) => `${s.role} → ${s.rel}`);
    expect(missing).toEqual([]);
  });

  it("every derived surface carries bytes — an empty surface agrees with everything", () => {
    const empty = surfaces.filter((s) => readFileSync(s.abs, "utf8").trim().length === 0).map((s) => s.rel);
    expect(empty).toEqual([]);
  });
});

describe("model dial — one authority for the Claude-Code-only scope statement (D-13, MODEL-06)", () => {
  it("the scope sentence is PRESENT in the packaging authority, exactly once", () => {
    expect(occurrences(readSurface("authority"), SCOPE_SENTENCE)).toBe(1);
  });

  it("the scope sentence is ABSENT from the config field reference — the no-restatement direction", () => {
    // The pointing document is not permitted its own copy of the claim. This is the direction that
    // makes "one authority" mechanical rather than aspirational.
    expect(occurrences(readSurface("pointer"), SCOPE_SENTENCE)).toBe(0);
  });

  it("the config field reference POINTS AT the authority by literal path", () => {
    expect(readSurface("pointer")).toContain(SURFACE_ROLES.authority);
  });

  it("the authority names its own section, so the pointer's reader lands somewhere", () => {
    expect(readSurface("authority")).toContain("## Host-CLI scope of the model dial");
    expect(readSurface("pointer")).toContain("Host-CLI scope of the model dial");
  });

  it("the authority carries assumption A1 as an explicit `UNKNOWN - verify` naming CLAUDE.md", () => {
    const authority = readSurface("authority");
    expect(authority).toContain("UNKNOWN - verify");
    // ANCHORED ON A1's OWN BLOCK, not on the first marker in the file. The file carries four markers
    // now; "the first one" stopped being a description of A1 the moment residual R1 was written, and
    // a case that keeps measuring "the first one" measures a different block without saying so.
    expect(occurrences(authority, A1_ANCHOR)).toBe(1);
    const at = authority.indexOf(A1_ANCHOR);
    // The source has to travel WITH the marker, not merely exist somewhere else in the file.
    expect(authority.slice(at, at + 600)).toContain("`CLAUDE.md` line 84");
  });

  it("the authority's `UNKNOWN - verify` markers are pinned at the disclosed count", () => {
    // A NUMBER, so a fifth marker moves this line in the commit that writes it rather than silently
    // changing what a positional case measures. Two-sided: a marker DELETED is as red as one added.
    expect(occurrences(readSurface("authority"), "UNKNOWN - verify")).toBe(UNKNOWN_VERIFY_MARKER_COUNT);
    expect(UNKNOWN_VERIFY_MARKER_COUNT).toBeGreaterThan(RESIDUAL_ANCHORS.length);
  });

  it("each disclosed residual is present by its OWN anchor, exactly once, and sits AFTER A1", () => {
    const authority = readSurface("authority");
    const a1At = authority.indexOf(A1_ANCHOR);
    expect(a1At).toBeGreaterThan(-1);
    expect(RESIDUAL_ANCHORS).toHaveLength(3);
    const wrong = RESIDUAL_ANCHORS.filter(
      (a) => occurrences(authority, a) !== 1 || authority.indexOf(a) < a1At,
    );
    // Position is asserted because the ordering is load-bearing rather than aesthetic: A1 is the
    // block the CLAUDE.md-source case measures, and it is measured by anchor precisely so that this
    // ordering is a documented convention rather than a hidden dependency.
    expect(wrong).toEqual([]);
  });

  it("every host CLI the sentence NAMES carries a citation line — attribution, not bare assertion", () => {
    const named = namedOtherHostClis();
    // The vacuity floor first: an EMPTY derived set would make the coverage check below pass over
    // nothing, which is the failure mode that green runs never show.
    expect(named).toHaveLength(OTHER_HOST_CLI_COUNT);
    const block = citationLines().join("\n");
    const uncited = named.filter((cli) => !block.includes(cli));
    expect(uncited).toEqual([]);
  });

  it("the citation block carries one dated, URL-bearing line per named CLI", () => {
    const lines = citationLines();
    expect(lines).toHaveLength(OTHER_HOST_CLI_COUNT);
    // A citation without a source is a citation in shape only. Each line must name a host.
    const sourceless = lines.filter((l) => !/[a-z0-9-]+\.(com|ai|dev|org|io)\//.test(l));
    expect(sourceless).toEqual([]);
    expect(scopeSection()).toContain("(retrieved 2026-08-20)");
  });

});

describe("model dial — CLAUDE.md's row names this mechanism as its documented reason (MODEL-06)", () => {
  const amendedRows = (): string[] =>
    readSurface("hostGuidance").split("\n").filter((line) => line.includes(CLAUDE_ROW_KEY));

  it("the amended row exists exactly once", () => {
    expect(amendedRows()).toHaveLength(1);
  });

  it("the row keeps its three-column shape", () => {
    const cells = amendedRows()[0].split("|");
    // A leading and a trailing empty cell bracket a three-column markdown row.
    expect(cells).toHaveLength(5);
  });

  it("the row's REMEDY column names the dial and its resolver — the reason, not a reversal", () => {
    const remedy = amendedRows()[0].split("|")[3];
    expect(remedy).toContain("`models` dial");
    expect(remedy).toContain("scripts/model-tiers.ts");
    // The row is amended, never reversed: the session-inheriting value is still the stated default.
    expect(remedy).toContain("`model: inherit` (the documented default)");
  });
});

describe("model dial — no dial key ships in the kit or the seed config (D-04)", () => {
  // Both JSONs are held BYTE-IDENTICAL to each other by a live case in
  // scripts/check-foundation-guards.test.ts, so a `models` block written into one would require the
  // same block in the other. That case is a second, independent gate on this property; this one
  // states the property itself, which byte-identity alone does not (two identical files could both
  // carry the key).
  const jsonSurfaces = [
    "agent-factory/config/factory.config.json",
    "agent-factory/seed/.grugops/factory.config.json",
  ];

  it("derives both JSON surfaces and refuses a short list", () => {
    expect(jsonSurfaces).toHaveLength(2);
    expect(jsonSurfaces.filter((rel) => existsSync(join(ROOT, rel)))).toHaveLength(2);
  });

  it("neither the kit config nor the seed config carries a `models` key", () => {
    const carrying = jsonSurfaces.filter((rel) => {
      const parsed = JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as Record<string, unknown>;
      return Object.prototype.hasOwnProperty.call(parsed, "models");
    });
    expect(carrying).toEqual([]);
  });

  it("documented-but-unshipped is the LEGAL combination, and is asserted as such", () => {
    // The field reference documents the dial by name while neither JSON carries it. That pairing is
    // not drift: D-04 keeps grugops's own repo on a zero-config resolution so its 17 committed
    // adapters stay `model: inherit`, while the documentation still has to tell a user the dial
    // exists. Asserting the pair together is what stops a later reader "fixing" one half.
    expect(readSurface("pointer")).toContain("`models`");
    const carrying = jsonSurfaces.filter((rel) =>
      Object.prototype.hasOwnProperty.call(
        JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as Record<string, unknown>,
        "models",
      ),
    );
    expect(carrying).toEqual([]);
  });
});

describe("model dial — the documented closed sets equal the module's own, in BOTH directions", () => {
  const sites = (marker: string): string[][] => declaredSets(readSurface("pointer"), marker);
  const presetSites = sites("preset allowed set:");
  const aliasSites = sites("alias allowed set:");

  it("both closed sets are declared at the pinned number of sites, two-sided", () => {
    expect(presetSites).toHaveLength(CLOSED_SET_DECLARATION_SITES);
    expect(aliasSites).toHaveLength(CLOSED_SET_DECLARATION_SITES);
    expect(presetSites.length).toBeGreaterThan(0);
    expect(aliasSites.length).toBeGreaterThan(0);
  });

  it("every DOCUMENTED preset name is a legal one — a documented-but-illegal name is red", () => {
    const legal = new Set<string>(PRESET_NAMES);
    const illegal = presetSites.flatMap((site, i) =>
      site.filter((n) => !legal.has(n)).map((n) => `site ${i}: "${n}"`),
    );
    expect(illegal).toEqual([]);
  });

  it("every LEGAL preset name is documented at every site — an undocumented legal name is red", () => {
    const undocumented = presetSites.flatMap((site, i) =>
      PRESET_NAMES.filter((n) => !site.includes(n)).map((n) => `site ${i}: "${n}"`),
    );
    expect(undocumented).toEqual([]);
  });

  it("every DOCUMENTED alias is a legal one — a documented-but-illegal alias is red", () => {
    const legal = new Set<string>(MODEL_ALIASES);
    const illegal = aliasSites.flatMap((site, i) =>
      site.filter((a) => !legal.has(a)).map((a) => `site ${i}: "${a}"`),
    );
    expect(illegal).toEqual([]);
  });

  it("every LEGAL alias is documented at every site — an undocumented legal alias is red", () => {
    const undocumented = aliasSites.flatMap((site, i) =>
      MODEL_ALIASES.filter((a) => !site.includes(a)).map((a) => `site ${i}: "${a}"`),
    );
    expect(undocumented).toEqual([]);
  });

  it("the extraction is not vacuous — every declaration site yielded members", () => {
    // A parser that silently yielded [] at every site would make BOTH directions above pass, because
    // an empty documented set has no illegal member and an empty legal set has nothing undocumented.
    // Only the second direction actually catches that today; this case says so out loud.
    expect(presetSites.every((s) => s.length > 0)).toBe(true);
    expect(aliasSites.every((s) => s.length > 0)).toBe(true);
  });
});

// ── The configuration LOCATIONS, and where their precedence rule is allowed to live (WR-05) ────
//
// THE PLAN'S ORIGINAL SHAPE WAS UNACHIEVABLE, AND THE REASON IS ITSELF AN INVARIANT. Plan 29.1-11
// required BOTH shipped documents to name BOTH configuration locations by path. Attempting it
// turned `scripts/check-kit-refs.js` RED: Assertion 1 (D-08.1, SHOME-03/SC5) holds ZERO
// `agent-factory/config/` references across the kit scan set — which includes this authority's own
// directory — because the shared-install rewrite moved per-repository state to `.grugops/` and no
// kit document may point a reader at a path inside the kit to edit. That gate is twenty-two phases
// older than this dial and admits no exemption list.
//
// SO THE OBLIGATION IS SPLIT BY AUDIENCE, WHICH IS WHAT THE TWO DOCUMENTS ALREADY ARE. The config
// field reference is the developer-facing authority and lives outside the scan set; it names BOTH
// locations by path and holds the precedence rule. The packaging authority is shipped kit prose; it
// names the location a user configures, states that there are exactly as many locations as the
// resolver declares, and points at the rule's home. The kit-internal path is absent from it BY
// DESIGN, and that absence is asserted POSITIVELY below rather than left as an omission — so a
// later editor who "helpfully" adds the path is told by this oracle as well as by the gate.
//
// The anchor is the precedence RULE's own sentence fragment, not a path. D-13's shape says exactly
// one document holds a rule while the other points at it, and asserting the anchor in both
// directions is what keeps a well-meaning edit from growing a second authority.
const PRECEDENCE_RULE_ANCHOR = "The first of those two files that EXISTS wins WHOLE";

/** The path prefix D-08.1 forbids in kit prose, taken from the resolver's own kit-internal member. */
const KIT_INTERNAL_CONFIG_DIR = "agent-factory/config/";

describe("model dial — the configuration locations are documented, and the rule has ONE home (WR-05)", () => {
  it("every declared configuration location appears in the config field reference", () => {
    // DERIVED FROM THE RESOLVER'S OWN CONSTANT, never hand-listed here. The module builds its
    // candidate list from exactly this tuple, so a third location added to the code without being
    // documented turns this case red, and a location dropped from the reference does the same.
    // That is WR-05's actual content: the code read two locations and the shipped prose named one.
    expect(MODELS_CONFIG_CANDIDATE_RELS.length).toBeGreaterThan(0);
    const pointer = readSurface("pointer");
    const undocumented = MODELS_CONFIG_CANDIDATE_RELS.filter((rel) => occurrences(pointer, rel) < 1);
    expect(undocumented).toEqual([]);
  });

  it("the packaging authority names the location a user configures, and states the location COUNT", () => {
    // The FIRST candidate is the one a user owns, so it is the one shipped kit prose may name. The
    // COUNT is asserted as a word rather than the second path, so a third candidate appearing in
    // the resolver still moves this document — the drift WR-05 reported is closed on both surfaces,
    // by a path on one and by a cardinality on the other.
    const authority = readSurface("authority");
    expect(occurrences(authority, MODELS_CONFIG_CANDIDATE_RELS[0])).toBeGreaterThan(0);
    const asWord: Record<number, string> = { 2: "TWO", 3: "THREE", 4: "FOUR" };
    const word = asWord[MODELS_CONFIG_CANDIDATE_RELS.length];
    expect(word, "PREMISE: the declared location count must have a word this case can look for").toBeDefined();
    expect(occurrences(authority, `first of ${String(word)} configuration`)).toBe(1);
  });

  it("the packaging authority spells NO kit-internal config path — D-08.1, asserted here too", () => {
    // A POSITIVE assertion of a deliberate absence. `check-kit-refs` already holds this for the whole
    // kit scan set; stating it here as well means the reason it is absent travels with the dial's own
    // oracle, so the next reader of THIS file learns why the second path is missing instead of
    // reading the omission as an oversight and closing it.
    expect(occurrences(readSurface("authority"), KIT_INTERNAL_CONFIG_DIR)).toBe(0);
    // …and the member it refers to really is the kit-internal one, so this case cannot go stale by
    // the resolver renaming its second candidate.
    expect(MODELS_CONFIG_CANDIDATE_RELS[1].startsWith(KIT_INTERNAL_CONFIG_DIR)).toBe(true);
  });

  it("EXACTLY ONE document states the whole-file precedence rule — the config reference, not the authority", () => {
    // Two-sided, as D-13's shape always is here: present in the document that owns the rule, and
    // ABSENT from the one that points at it.
    expect(occurrences(readSurface("pointer"), PRECEDENCE_RULE_ANCHOR)).toBe(1);
    expect(occurrences(readSurface("authority"), PRECEDENCE_RULE_ANCHOR)).toBe(0);
  });
});

describe("model dial — the D-17 limitation is disclosed where a configuring reader meets it", () => {
  it("the config field reference discloses the installed-target limitation and names Phase 29.2", () => {
    const pointer = readSurface("pointer");
    // The WORDING is deliberately not pinned — that would make this file a second authority over the
    // note's prose. What is pinned is that the disclosure is present and names where it closes.
    expect(pointer).toContain("Disclosed limitation");
    expect(pointer).toContain("Phase 29.2");
  });
});
