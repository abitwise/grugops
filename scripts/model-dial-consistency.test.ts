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
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MODEL_ALIASES, PRESET_NAMES } from "./model-tiers.js";

const ROOT = join(import.meta.dirname, "..");

// ── The surface roster, keyed by the ROLE each surface plays in D-13's shape. ──────────────────
// Keyed rather than listed so the count below is derived from the roster's own entries and a fourth
// surface cannot be added without moving the pinned cardinality in the same edit.
const SURFACE_ROLES = {
  authority: "agent-factory/packaging/subagent.frontmatter.md",
  pointer: "agent-factory/config/factory.config.md",
  hostGuidance: "CLAUDE.md",
} as const;

/**
 * THE VACUITY FLOOR. Pinned two-sided against the roster's own entry count.
 *
 * An oracle that iterated an EMPTY surface list would report agreement over nothing and pass; one
 * that iterated a SHORT list would report agreement over a subset and also pass. Neither failure is
 * visible in a green run, which is why the cardinality is adjudicated BEFORE any content assertion
 * rather than left to be implied by the assertions that follow.
 *
 * PROMOTE TRIGGER: a fourth prose surface joining D-13's shape moves this number in the same commit
 * that adds it, and the reader of that diff is told what the fourth surface is for.
 */
const SURFACE_COUNT = 3;

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
    throw new Error(
      `model-dial oracle: PREMISE VIOLATED — the surface roster derived ${roles.length} surface(s) ` +
        `[${roles.join(", ")}] and ${surfaces.length} derived entr(ies), but this oracle's premise is ` +
        `EXACTLY ${SURFACE_COUNT}: one authority, one pointer, one host-guidance row. Refusing to ` +
        "report agreement across a roster of the wrong size — a SHORT roster agrees over a subset " +
        "and an EMPTY one agrees over nothing, and both of those are green runs. Remedy: restore the " +
        "missing surface, or move SURFACE_COUNT in the same commit that changes what D-13's shape is.",
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
  it("derives EXACTLY three surfaces, pinned two-sided against SURFACE_COUNT — the vacuity floor", () => {
    // Stated as a pair on purpose: the roster's own entry count and the derived array's length are
    // two readings of the same premise, and a mutation that drops a surface must break both.
    expect(Object.keys(SURFACE_ROLES)).toHaveLength(SURFACE_COUNT);
    expect(surfaces).toHaveLength(SURFACE_COUNT);
    expect(surfaces.length).toBeGreaterThanOrEqual(SURFACE_COUNT);
    expect(surfaces.length).toBeLessThanOrEqual(SURFACE_COUNT);
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

describe("model dial — the D-17 limitation is disclosed where a configuring reader meets it", () => {
  it("the config field reference discloses the installed-target limitation and names Phase 29.2", () => {
    const pointer = readSurface("pointer");
    // The WORDING is deliberately not pinned — that would make this file a second authority over the
    // note's prose. What is pinned is that the disclosure is present and names where it closes.
    expect(pointer).toContain("Disclosed limitation");
    expect(pointer).toContain("Phase 29.2");
  });
});
