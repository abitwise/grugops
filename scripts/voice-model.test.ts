// voice-model.test.ts — the pure-function cases for the ONE voice authority (Phase 29 / LANG-05,
// LANG-06, LANG-07 — D-22, D-23, D-38, plan 29-01).
//
// WHAT THIS FILE PROVES AND WHAT IT DELIBERATELY DOES NOT. `readCavemanFence` is the single reader
// both role-prose guards consult, so its verdict on malformed bytes is the whole of LANG-07. These
// cases pin that verdict DIRECTLY. The other half of LANG-07 — that the two CONSUMERS reach the same
// verdict on the same bytes — cannot be shown here at all, and is asserted through the committed
// aggregator `.js` in scripts/check-foundation-guards.test.ts. One reader existing is not the claim;
// both consumers agreeing is.
//
// Similarly, the 17/17 RED transcript embedded in the guard's source header proves the guard RUNS and
// proves nothing about the conjunction: both arms fail 17/17 independently at every N (29-RESEARCH
// §B-1). The three discriminating fixtures live with the aggregator harness, where a full gate run
// can be observed.
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane). Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/voice-model.test.ts
// Vitest globals:false → import explicitly.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  readCavemanFence,
  normalizeSentence,
  segmentClauses,
  countLexiconTokens,
  countBannedConstructions,
  countContentWords,
  CAVEMAN_LEXICON,
  CAVEMAN_LEXICON_MIN,
  BANNED_CONSTRUCTIONS,
  BANNED_CATEGORIES,
  CLAUSE_MIN_WORDS,
} from "./voice-model.js";

const FENCE = "```";
const doc = (...lines: string[]): string => lines.join("\n");

describe("readCavemanFence — the well-formed case", () => {
  it("returns the interior as `inside` and the rest of the document as `outside`", () => {
    const r = readCavemanFence(
      doc(
        "# Role: Test",
        "",
        "## One job",
        "Do the job.",
        "",
        "## Caveman prompt",
        FENCE,
        "You grug.",
        "You smash rock.",
        FENCE,
        "",
        "## Hard limits",
        "Stop when told.",
        "",
      ),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.inside).toBe("You grug.\nYou smash rock.");
    // The heading and BOTH delimiter lines are removed from `outside`, and nothing else is.
    expect(r.outside).not.toContain("Caveman prompt");
    expect(r.outside).not.toContain(FENCE);
    expect(r.outside).not.toContain("You grug.");
    expect(r.outside).toContain("## One job");
    expect(r.outside).toContain("## Hard limits");
    expect(r.outside.split("\n")).toHaveLength(9);
  });
});

describe("readCavemanFence — the three refusals (D-23)", () => {
  // Each of these is a form on which the two DELETED readers disagreed, or agreed only by accident.
  // 29-RESEARCH §A-6 has the measured before-table.
  it("FORM 1 — a fence opened and never closed is `unterminated`, NOT the file tail", () => {
    // The pre-Phase-29 `extractCavemanBlock` returned the WHOLE FILE TAIL here and the caveman guard
    // then PASSED over it, because a role file's tail is full of `You …` lines.
    const r = readCavemanFence(
      doc("## Caveman prompt", FENCE, "You grug.", "", "## Hard limits", "You stop.", ""),
    );
    expect(r).toEqual({ ok: false, reason: "unterminated" });
  });

  it("FORM 2 — a SECOND `## Caveman prompt` heading is `multiple`; neither block is silently taken", () => {
    // The pre-Phase-29 readers disagreed in OPPOSITE directions here: one stripped both blocks, the
    // other never saw the second because its `break` had already fired.
    const r = readCavemanFence(
      doc(
        "## Caveman prompt",
        FENCE,
        "You grug.",
        FENCE,
        "",
        "## Caveman prompt",
        FENCE,
        "You club rock.",
        FENCE,
        "",
      ),
    );
    expect(r).toEqual({ ok: false, reason: "multiple" });
  });

  it("FORM 3a — a heading with NO fence delimiter at all is `missing`", () => {
    const r = readCavemanFence(
      doc("## Caveman prompt", "You grug.", "", "## Hard limits", ""),
    );
    expect(r).toEqual({ ok: false, reason: "missing" });
  });

  it("FORM 3b — a document with NO caveman heading at all is also `missing`", () => {
    // The security surfaces (SEC_VOICE_FILES) are this shape by design. The verdict is the same; what
    // differs is what each CONSUMER does with it, which is asserted in the aggregator harness.
    const r = readCavemanFence(doc("# A workflow", "", "## Steps", "Run it.", ""));
    expect(r).toEqual({ ok: false, reason: "missing" });
  });

  it("the acceptance probe from the plan reproduces exactly", () => {
    expect(readCavemanFence("## Caveman prompt\n```\nYou grug.\n")).toEqual({
      ok: false,
      reason: "unterminated",
    });
  });
});

describe("readCavemanFence — FORM 4, the empty interior (LANG-07 empty)", () => {
  it("a well-formed fence with a ZERO-LINE interior is ok:true with `inside` the empty string", () => {
    // SUCCESS for the reader and FAILURE for the guard's positive arm — two different questions, one
    // verdict. Collapsing them into a single `missing` would make the reader answer the guard's
    // question, which is how the two grammars diverged in the first place.
    const r = readCavemanFence(doc("## Caveman prompt", FENCE, FENCE, "", "## Hard limits", ""));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.inside).toBe("");
    // And it fails the positive arm, which is what the guard asks next.
    expect(countLexiconTokens(r.inside)).toBe(0);
    expect(countLexiconTokens(r.inside) < CAVEMAN_LEXICON_MIN).toBe(true);
  });
});

describe("CAVEMAN_LEXICON and the counters", () => {
  it("counts DISTINCT terms, word-boundary and case-insensitively", () => {
    expect(countLexiconTokens(`You ${CAVEMAN_LEXICON[0]}.`)).toBe(1);
    // Repetition is decoration, not breadth.
    expect(
      countLexiconTokens(`${CAVEMAN_LEXICON[0]} ${CAVEMAN_LEXICON[0]} ${CAVEMAN_LEXICON[0]}`),
    ).toBe(1);
    expect(
      countLexiconTokens(`${CAVEMAN_LEXICON[0]} ${CAVEMAN_LEXICON[1]}`),
    ).toBe(2);
    expect(countLexiconTokens(CAVEMAN_LEXICON[0].toUpperCase())).toBe(1);
  });

  it("word boundaries hold — `.grugops/` is NOT a `grug` hit (D-10)", () => {
    // The exact false positive D-10 records. A substring match here would red guard_voice on every
    // clear-voice mention of the project's own directory.
    expect(countLexiconTokens("Write to .grugops/context/notes.md")).toBe(0);
    expect(countLexiconTokens("grugops is the project")).toBe(0);
    expect(countLexiconTokens("You grug.")).toBe(1);
  });

  it("every lexicon term is recognised by the counter — no member is decoration", () => {
    for (const term of CAVEMAN_LEXICON) {
      expect(countLexiconTokens(`sentence with ${term} inside`), term).toBeGreaterThan(0);
    }
  });

  it("N is 2 — one token per block is the sprinkle-to-green defect D-07 names", () => {
    expect(CAVEMAN_LEXICON_MIN).toBe(2);
  });
});

describe("BANNED_CONSTRUCTIONS", () => {
  it("all four categories are present and every member is recognised", () => {
    expect(BANNED_CATEGORIES).toEqual(["article", "copula", "modal", "subordinator"]);
    for (const category of BANNED_CATEGORIES) {
      expect(BANNED_CONSTRUCTIONS[category].length).toBeGreaterThan(0);
      for (const token of BANNED_CONSTRUCTIONS[category]) {
        const counts = countBannedConstructions(`a sentence ${token} here`);
        expect(counts[category], `${category}/${token}`).toBeGreaterThan(0);
      }
    }
  });

  it("the conventional opener `You are <Role>.` trips the copula arm — intended, in all 17 blocks", () => {
    const counts = countBannedConstructions("You are the Brownfield Mapper.");
    expect(counts.copula).toBe(1);
    expect(counts.article).toBe(1);
  });

  it("a maximally grug block trips NOTHING", () => {
    const counts = countBannedConstructions("You grug. You smash rock. You no think.");
    expect(counts.article + counts.copula + counts.modal + counts.subordinator).toBe(0);
  });

  it("word boundaries hold — `beam`, `iso` and `while` inside a word are not hits", () => {
    const counts = countBannedConstructions("beamed iso-standard meanwhile candidate");
    expect(counts.copula + counts.modal + counts.subordinator + counts.article).toBe(0);
  });
});

describe("countContentWords", () => {
  it("counts whitespace-separated runs carrying at least one alphanumeric", () => {
    expect(countContentWords("You grug.")).toBe(2);
    expect(countContentWords("You  grug.\nYou smash rock.")).toBe(5);
    expect(countContentWords("— ; :")).toBe(0);
  });
});

describe("normalizeSentence (D-38)", () => {
  it("the plan's acceptance probe: articles and a leading `you` are dropped, bold is unwrapped", () => {
    expect(
      normalizeSentence("You stop if scope grows or **the** architecture must change."),
    ).toBe(normalizeSentence("Stop if scope grows or architecture must change"));
  });

  it("ENCODING: NFC runs FIRST, so an NFD spelling is the SAME clause", () => {
    // Without the leading normalize("NFC") the decomposed form's combining acute survives into the
    // character fold and becomes a space, splitting one word into two — a duplicate hiding behind a
    // combining mark.
    const nfc = "Résumé the audit trail now";
    const nfd = nfc.normalize("NFD");
    expect(nfd).not.toBe(nfc); // premise: the two spellings really differ in bytes
    expect(normalizeSentence(nfd)).toBe(normalizeSentence(nfc));
  });

  it("unwraps code spans, links (dropping the target), bold and italic", () => {
    expect(normalizeSentence("Mark it `BLOCKED` now")).toBe("mark it blocked now");
    expect(normalizeSentence("See [the board](plans/board.md) now")).toBe("see board now");
    expect(normalizeSentence("**Run** the *gate* now")).toBe("run gate now");
  });

  it("folds every character outside [a-z0-9 ] to a space and collapses whitespace", () => {
    expect(normalizeSentence("  Stop —  now;  really!  ")).toBe("stop now really");
  });

  it("drops a LEADING `you` only, never an internal one", () => {
    expect(normalizeSentence("You tell you nothing")).toBe("tell you nothing");
  });
});

describe("segmentClauses (D-38 Variant C)", () => {
  it("splits on sentence terminators AND on spaced em dash, en dash, semicolon and colon", () => {
    const out = segmentClauses(
      "Read the metrics and run the retro — write improvement tickets for the factory itself.",
    );
    expect(out.map((c) => c.clause)).toEqual([
      "read metrics and run retro",
      "write improvement tickets for factory itself",
    ]);
  });

  it("reports 1-based SOURCE line numbers, in first-occurrence order", () => {
    const out = segmentClauses(
      doc("first clause of this document", "", "second clause of this document", ""),
    );
    expect(out).toEqual([
      { clause: "first clause of this document", line: 1 },
      { clause: "second clause of this document", line: 3 },
    ]);
  });

  it("discards fragments under CLAUSE_MIN_WORDS normalized words", () => {
    expect(CLAUSE_MIN_WORDS).toBe(4);
    // Three normalized words — dropped. Table cells, list markers and headings live here.
    expect(segmentClauses("Read the metrics now")).toEqual([]);
    expect(segmentClauses("Read the metrics right now")).toEqual([
      { clause: "read metrics right now", line: 1 },
    ]);
  });

  it("ADJACENCY: two clauses normalizing to the same string are the same clause; a shared PREFIX is not", () => {
    const same = segmentClauses(
      doc(
        "You stop if scope grows or the architecture must change.",
        "Stop if scope grows or architecture must change.",
      ),
    );
    expect(new Set(same.map((c) => c.clause)).size).toBe(1);

    const prefix = segmentClauses(
      doc(
        "Stop and hand back if scope grows.",
        "Stop and hand back if scope grows or the architecture must change.",
      ),
    );
    expect(new Set(prefix.map((c) => c.clause)).size).toBe(2);
  });

  it("EMPTY: text that segments to zero clauses returns an empty array rather than a phantom one", () => {
    expect(segmentClauses("")).toEqual([]);
    expect(segmentClauses("# Heading\n\n| a | b |\n")).toEqual([]);
  });

  it("a spaced separator is required — `A/B`, `9:30` and hyphenated compounds survive intact", () => {
    expect(segmentClauses("The BA/PM role owns the backlog at 9:30 sharp")[0].clause).toBe(
      "ba pm role owns backlog at 9 30 sharp",
    );
  });
});

describe("catastrophic-backtracking floor (29-RESEARCH §F-2)", () => {
  // WHY THIS CASE EXISTS. The superlinear-regex incident recorded in project memory — a 0.47 s guard
  // that took 383 s — is DORMANT, not fixed, and a prose scanner is where it creeps back in. Every
  // pattern in voice-model.ts is a single `\b(alternation)\b` group or a `split()`, and this case is
  // what turns that authoring rule into something a regression trips over immediately rather than
  // after a multi-minute guard run.
  //
  // The input is the LARGEST GOVERNED FILE, named rather than synthesized: 05-pr-quality-gate.md at
  // 13,831 bytes. A synthetic string of the same length would not carry the em dashes, colons, code
  // spans and links that the segmenter and the normalizer actually backtrack over.
  const LARGEST_GOVERNED = "agent-factory/workflows/05-pr-quality-gate.md";

  it("segmentClauses + normalizeSentence over the largest governed file complete under one second", () => {
    const text = readFileSync(join(import.meta.dirname, "..", LARGEST_GOVERNED), "utf8");
    // PREMISE FIRST: the file really is the size the reasoning above assumes. A truncated or moved
    // file would make a fast run meaningless.
    expect(Buffer.byteLength(text, "utf8")).toBeGreaterThan(13_000);

    const started = Date.now();
    const clauses = segmentClauses(text);
    for (const { clause } of clauses) normalizeSentence(clause);
    const elapsed = Date.now() - started;

    // NON-VACUITY: the call must have done real work, or "it was fast" says nothing.
    expect(clauses.length).toBeGreaterThan(50);
    expect(elapsed).toBeLessThan(1000);
    process.stdout.write(
      `\n29-01 timing: segmentClauses + normalizeSentence over ${LARGEST_GOVERNED} ` +
        `(${Buffer.byteLength(text, "utf8")} B) → ${clauses.length} clauses in ${elapsed} ms\n`,
    );
  });

  it("the four banned-construction counters over the same file complete under one second", () => {
    const text = readFileSync(join(import.meta.dirname, "..", LARGEST_GOVERNED), "utf8");
    const started = Date.now();
    const counts = countBannedConstructions(text);
    const tokens = countLexiconTokens(text);
    const elapsed = Date.now() - started;
    expect(counts.article + counts.copula + counts.modal + counts.subordinator).toBeGreaterThan(0);
    expect(tokens).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(1000);
  });
});
