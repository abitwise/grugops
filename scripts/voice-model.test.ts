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
import { cpSync, mkdirSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
// (Plan 29-14) The live-corpus control derives its membership from the kit authority rather than
// carrying a role list of its own — a second list would drift, and a short denominator would let a
// role drop out of the control without anything going red.
// (Plan 29-25, WR-05) `ROLE_COUNT` joins the import because the control below now compares the
// derived list against the derived COUNT. The floor it replaces could not fail — see the case.
import { listRoles, ROLE_COUNT, ROLES_SUBPATH } from "./kit-model.js";

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

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (Plan 29-14, closing CR-01) THE SECTION BOUND — the phase's own thesis, failing on itself.
//
// This module's header states the reader's predicate as "WHERE IS THE **SECTION-ANCHORED** CAVEMAN
// FENCE". Plan 29-01's implementation was not section-anchored: after locating the heading it scanned
// to END OF FILE for a delimiter, so a role whose caveman section was reworded into plain senior prose
// adopted an unrelated LATER fenced block as "the caveman block" and returned `ok: true`. Both voice
// guards then published a measured number about the wrong bytes — `tokens 4 / content words 4` over a
// `## Notes` code block — and the whole gate printed ALL CHECKS PASSED.
//
// This is the standing question of the project, asked of the reader that exists to answer it: not
// WHICH CHARACTERS the predicate accepts, but WHAT BOUNDS ITS INPUT. Two grammars were collapsed into
// one authority in 29-01, and unifying two parsers makes that authority's SCOPE a new degree of
// freedom — a section-anchored reader searching to EOF adopts an unrelated later block. The remedy is
// structural: ONE bound, consulted by BOTH scans, with everything outside it refused BY NAME.
//
// `orchestrator.md` already carries four fence delimiters (two in its caveman section, two under a
// later heading), so a role file with a second fence has never been hypothetical.
//
// The first three cases below FAIL against the pre-29-14 build. The fourth is the FALSE-RED CONTROL:
// it passes before and after, because a control that was never green proves nothing about the change.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("readCavemanFence — the section bound (plan 29-14, CR-01)", () => {
  it("reads a de-fenced caveman section as missing rather than adopting a later fence", () => {
    // The reviewer's live-tree reproduction, reduced to bytes: uat-planner.md's fenced block replaced
    // by senior prose, with a later `## Notes` block carrying four lexicon terms. Before the bound
    // this returned ok:true with `inside` = "grug club rock cave" — the guard measuring `## Notes`.
    const r = readCavemanFence(
      doc(
        "## Caveman prompt",
        "You plan business acceptance and record the outcome.",
        "",
        "## Notes",
        FENCE,
        "grug club rock cave",
        FENCE,
        "",
      ),
    );
    expect(r).toEqual({ ok: false, reason: "missing" });
  });

  // ── (Plan 29-20 → Plan 29-27, closing CR-01) THE EXPECTATION THIS CASE CARRIED WAS REVERSED
  // TWICE, AND BOTH MOVES ARE RECORDED HERE RATHER THAN QUIETLY RE-BASELINED A THIRD TIME.
  //
  // 29-14 asserted `{ok:false, reason:"unterminated"}` on these exact bytes and called it the
  // deliberate fail-CLOSED cost of bounding the close scan. 29-20 REVERSED that to `ok: true` on the
  // argument that the shared authority's bound is fence-aware, so a heading the author wrote INSIDE a
  // fence closes nothing and the reader returns the true interior. That argument reads well and it is
  // wrong, because it hands the block being measured control of its own section's extent:
  //
  //   THE CIRCULARITY. `sectionEndIndex` skips lines the ONE fence toggle flags. The caveman fence's
  //   OWN INTERIOR is flagged by that toggle. So under 29-20's wiring the close scan ran PAST every
  //   heading between the delimiters, every intervening section landed in `inside`, and `outside` —
  //   the entire scan surface of guard_voice — could be driven to the EMPTY STRING. Measured against
  //   the committed build at HEAD before plan 29-27, on 29-REVIEW.md CR-01's document:
  //
  //     readCavemanFence("## Caveman prompt\n```\ngrug club rock cave\n\n## Notes\nyou no think, big
  //                       brain swamp demon\n```\n")
  //     → ok=true  outside=""          (the same bytes at 3ed76c1: {"ok":false,"reason":"unterminated"})
  //
  //   guard_voice then scanned ZERO bytes and printed a bare PASS. That is the phase's founding defect
  //   reopened by the one reader that exists to close it.
  //
  // 29-27 RESTORES THE FAIL-CLOSED DIRECTION AND KEEPS ONE AUTHORITY: the bound is still
  // `sectionEndIndex`, now asked over a DELIMITER-NEUTRALISED projection of the document, so the fence
  // under measurement cannot vote on where its own section ends. WR-01's fence-aware ANCHOR scan is
  // untouched — a quoted anchor inside a fenced example still donates no heading — so the false red
  // 29-20 deleted stays deleted. What returns is only the refusal, and only on a document that wrote a
  // level-one-or-two heading between its own delimiters.
  //
  // Both heading levels are pinned, because a bound tested from one side only is the half-fix this
  // phase has now shipped twice, and the `### ` control immediately below is the false-red guard on it.
  it("a `## ` heading inside the fence interior refuses `unterminated` — the block may not extend its own section", () => {
    const r = readCavemanFence(
      doc("## Caveman prompt", FENCE, "grug smash", "## Trap", "you stop", FENCE, ""),
    );
    expect(r).toEqual({ ok: false, reason: "unterminated" });
  });

  it("a `# ` heading inside the fence interior ALSO refuses `unterminated` — the level axis, from the other side", () => {
    // One character to the left is where this phase's bound has failed every previous time. A level-one
    // successor starts a sibling section at least as surely as a level-two one, so it truncates the
    // section identically and the document is refused by the same name.
    const r = readCavemanFence(
      doc("## Caveman prompt", FENCE, "grug smash", "# Trap", "you stop", FENCE, ""),
    );
    expect(r).toEqual({ ok: false, reason: "unterminated" });
  });

  it("CR-01's exact document — the reviewer's bytes, refused rather than emptying `outside`", () => {
    // 29-REVIEW.md:110-117 verbatim. The assertion is TWO-SIDED on purpose: the verdict is the
    // refusal, and — for the build in which it were ever to return ok again — `outside` may not be the
    // empty string. `ok: true` with an empty remainder is the shape that printed a green gate over a
    // scan of zero bytes, so it is named here rather than inferred.
    const r = readCavemanFence(
      doc(
        "## Caveman prompt",
        FENCE,
        "grug club rock cave",
        "",
        "## Notes",
        "you no think, big brain swamp demon",
        FENCE,
        "",
      ),
    );
    expect(r).toEqual({ ok: false, reason: "unterminated" });
    expect(
      r.ok && r.outside === "",
      "readCavemanFence may never return ok with an EMPTY clear-voice remainder — that is a guard scanning zero bytes",
    ).toBe(false);
  });

  // ── THE UNION OF THE ARMS, AS ONE CELL (round-3 rule 6). ─────────────────────────────────────────
  //
  // Each axis above is pinned alone, and a fix scoped to the arm a reproduction happened to use is how
  // this defect survived two rounds. This cell turns all three axes on AT ONCE — the interior heading
  // is LEVEL ONE, carries TRAILING WHITESPACE (the axis `trimEnd()` normalisation owns), and sits
  // ABOVE a NESTED fenced run (the axis that decides which delimiter the close scan meets first).
  // Asserted as ONE case, because three separate cases would each prove their own arm and none would
  // prove the conjunction.
  it("the UNION cell — level-one + trailing whitespace + a nested fenced run, all at once", () => {
    const r = readCavemanFence(
      doc(
        "## Caveman prompt",
        FENCE,
        "grug smash rock",
        "# Trap   ",
        "you stop",
        FENCE,
        "",
        "## Notes",
        FENCE,
        "const a = 1;",
        FENCE,
        "",
      ),
    );
    expect(r).toEqual({ ok: false, reason: "unterminated" });
  });

  it("a genuinely UNTERMINATED fence still refuses by name — the fail-closed direction, kept", () => {
    // The same bytes with the closing delimiter removed. The fence really was opened and never
    // closed, so the reader refuses rather than returning the file tail as the block — the property
    // 29-14's superseded case was standing in for, asserted here on a form where it is actually true.
    const r = readCavemanFence(
      doc("## Caveman prompt", FENCE, "grug smash", "## Trap", "you stop"),
    );
    expect(r).toEqual({ ok: false, reason: "unterminated" });
  });

  it("does not treat a heading that merely starts with the anchor text as the anchor", () => {
    // `CAVEMAN_HEADING_LINE` was a PREFIX match, so `## Caveman prompted` was a heading hit. Two
    // consequences, both live: a document with only the near-miss heading read as a real caveman
    // section, and a WELL-FORMED document that also carried the near-miss read as `multiple`.
    expect(readCavemanFence(doc("## Caveman prompted", FENCE, "grug", FENCE, ""))).toEqual({
      ok: false,
      reason: "missing",
    });

    // The union of the two arms: the near-miss AND a real section in one document is ONE heading hit,
    // so the `multiple` arm does not misfire and the success is read over the REAL section.
    const both = readCavemanFence(
      doc(
        "## Caveman prompted",
        "Prose under a heading that is not the anchor.",
        "",
        "## Caveman prompt",
        FENCE,
        "You grug smash rock.",
        FENCE,
        "",
        "## Hard limits",
        "You stop.",
        "",
      ),
    );
    expect(both.ok).toBe(true);
    if (!both.ok) return;
    expect(both.inside).toBe("You grug smash rock.");
  });

  // ── (Plan 29-20, closing CR-02) THE LEVEL AXIS — the same bound, tested from the OTHER side. ────
  //
  // Plan 29-14 bounded the reader and pinned the bound with a `## ` heading. The bound it shipped was
  // `/^## /`, so a `# ` heading — which starts a SIBLING SECTION just as surely, and more so — closed
  // nothing, and the exact defect 29-14 believed it had closed survived one character to the left.
  // Reproduced live against the committed build at HEAD before this plan:
  //
  //   readCavemanFence("## Caveman prompt\nYou senior prose…\n\n# Appendix\n…\n```\ngrug club rock cave smash\n```\n")
  //   → {"ok":true,"inside":"grug club rock cave smash", …}
  //
  // A bound tested from one side only is the half-fix this plan exists to stop repeating, so BOTH
  // directions are pinned: `# ` and `## ` close, `### ` does not. The bound itself no longer lives in
  // this module at all — `frontmatter.ts`'s `sectionEndIndex` is the one authority for it (LANG-07).
  it("the level-one bound: a `# ` heading closes the caveman section, exactly as `## ` does", () => {
    const r = readCavemanFence(
      doc(
        "## Caveman prompt",
        "You senior prose here with no fence at all.",
        "",
        "# Appendix",
        "Some later top-level section.",
        FENCE,
        "grug club rock cave smash",
        FENCE,
        "",
      ),
    );
    expect(r).toEqual({ ok: false, reason: "missing" });
  });

  it("a `### ` sub-heading does NOT close the caveman section — a subsection structures a section", () => {
    // The other direction, and the one a level-widening fix breaks. A sub-heading inside the caveman
    // section must leave the bound where it found it, or the fence's own closing delimiter falls
    // outside the section and a well-formed block is refused `unterminated` on correct bytes.
    const r = readCavemanFence(
      doc(
        "## Caveman prompt",
        FENCE,
        "You grug smash rock.",
        "### An aside",
        "You club shiny rock.",
        FENCE,
        "",
        "## Hard limits",
        "",
      ),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.inside).toBe("You grug smash rock.\n### An aside\nYou club shiny rock.");
  });

  // ── (Plan 29-20, closing WR-01) THE ANCHOR SCAN, MADE FENCE-AWARE. ──────────────────────────────
  //
  // The bound became fence-aware in Task 1 while the ANCHOR scan still tested raw lines, and a
  // predicate that is fence-aware in one half and fence-blind in the other is not one authority — it
  // is two, disagreeing inside a single function. Two live consequences, in OPPOSITE directions:
  //
  //   FALSE RED — a role file that QUOTES `## Caveman prompt` inside a fenced example counted a second
  //   heading and was refused `multiple` on entirely correct bytes. Reproduced against the committed
  //   build at HEAD before this plan: {"ok":false,"reason":"multiple"}.
  //
  //   FALSE GREEN — and this one was INTRODUCED by Task 1, found by adversarial probe rather than by
  //   the suite, which was green throughout. An odd fence delimiter ABOVE the anchor leaves the
  //   section's own boundary heading flagged, so the fence-aware bound ran to EOF while the
  //   fence-blind anchor scan still found the anchor — and the reader adopted a later section's block
  //   again, the exact CR-02 defect wearing a different hat. Making BOTH halves consult the one
  //   toggle closes it: an anchor inside a fence donates no heading, so the document refuses
  //   `missing`. Both directions are pinned below, because fixing one half of a predicate is the
  //   half-fix this round exists to stop repeating.
  it("a fenced QUOTATION of the anchor is not a second heading — no `multiple` on correct bytes", () => {
    const r = readCavemanFence(
      doc(
        "# Role",
        "## Caveman prompt",
        FENCE,
        "You grug smash rock and club.",
        FENCE,
        "",
        "## Notes",
        "Example of the required section:",
        FENCE,
        "## Caveman prompt",
        FENCE,
        "",
      ),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.inside).toBe("You grug smash rock and club.");
  });

  it("an anchor that is itself INSIDE a fence donates no heading — the section is `missing`", () => {
    // The false-green half. An unclosed delimiter above the anchor flags the anchor, the boundary
    // heading and the tail alike; the reader must refuse rather than reach past a boundary it cannot
    // see. Fail-CLOSED, and the same direction `fencedLineFlags` already takes on an open fence.
    const r = readCavemanFence(
      doc(
        FENCE,
        "stray",
        "## Caveman prompt",
        "You senior prose.",
        "## Notes",
        FENCE,
        "grug club rock cave",
        FENCE,
        "",
      ),
    );
    expect(r).toEqual({ ok: false, reason: "missing" });
  });

  it("TWO real unfenced anchors are still `multiple` — the refusal itself is load-bearing", () => {
    // The other side of the fence-awareness fix, kept explicitly: making the scan fence-aware must not
    // weaken what it refuses. Two genuine anchors remain a refusal for both consumers.
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

  it("every live role returns ok with a non-empty interior — the false-red control", () => {
    // PASSES BEFORE AND AFTER, by construction: all 17 live roles carry both fence delimiters INSIDE
    // the caveman section, so the bound cannot move their verdict. That is exactly what makes it a
    // control — if this case went red, the bound would have re-measured the corpus rather than merely
    // scoping the reader, which is the one outcome this change is not allowed to have.
    //
    // Membership is DERIVED from the kit authority, never a literal list: a hand-typed role list is
    // the set-literal drift this repository has corrected three times, and a short denominator here
    // would let a role slip out of the control silently.
    //
    // (Plan 29-25, WR-05) THE DENOMINATOR IS NOW COMPARED, BECAUSE THE FLOOR THAT STOOD HERE COULD
    // NOT FAIL. The retired assertion was `expect(names.length).toBeGreaterThan(0)` — sitting three
    // lines under a comment promising that "a short denominator here would let a role slip out of the
    // control silently", and asserting precisely nothing about that denominator. `listRoles()` calls
    // `refuseEmpty` before returning (scripts/kit-model.ts), so it THROWS on an empty or missing roles
    // directory: `> 0` was guaranteed by the very call it was checking, and no input the call survives
    // could red it. If sixteen of seventeen roles vanished this control passed. The number the comment
    // promised to protect is now the assertion, taken from the kit authority rather than typed, and
    // the sibling case below plants a mirror short by one role to prove the strengthened form reds —
    // a control that has never been shown to fail is a comment.
    const names = listRoles();
    expect(
      names,
      "the live role corpus must be the DERIVED count, not merely non-empty — a floor the lister's own refusal already guarantees is documentation of intent, never a check",
    ).toHaveLength(ROLE_COUNT);
    for (const n of names) {
      const text = readFileSync(join(import.meta.dirname, "..", ROLES_SUBPATH, n), "utf8");
      const v = readCavemanFence(text);
      expect(v.ok, `${n} must read ok`).toBe(true);
      if (!v.ok) continue;
      expect(v.inside.length, `${n} must have a non-empty interior`).toBeGreaterThan(0);
      // (Plan 29-27, closing CR-01) THE REMAINDER IS ASSERTED DIRECTLY, NEVER INFERRED FROM `ok`.
      // `ok: true` says the fence was located and is well-formed; it says NOTHING about how much of
      // the document survived the filter. Under the 29-20 bound a role file could return `ok: true`
      // with `outside` the EMPTY STRING — guard_voice's entire scan surface — and every assertion in
      // this loop still passed. A LINE COUNT rather than a length, because that is the number
      // guard_voice now publishes per file, so the two cannot drift apart.
      expect(
        v.outside.split("\n").length,
        `${n} must leave a NON-ZERO clear-voice remainder — a role file's title line alone guarantees one, so zero means the fence swallowed the document`,
      ).toBeGreaterThan(0);
      expect(
        v.outside.trim().length,
        `${n} clear-voice remainder must carry bytes, not merely lines`,
      ).toBeGreaterThan(0);
    }
  });

  it("WR-05 — the control's denominator REDS on a mirror short by one role, and the retired floor does not", () => {
    // THE FALSIFIABILITY SIBLING. It exists because the assertion above is a CONTROL: it passes on
    // the shipped tree by construction, so on the shipped tree it is indistinguishable from an
    // assertion that cannot fail — which is exactly what it was until this plan. The mirror-shortening
    // shape is the one scripts/check-foundation-guards.test.ts already uses for its own vacuity floor
    // (`rmSync` one role file, then re-derive), rooted here at a temp kit so nothing outside it moves.
    const root = mkdtempSync(join(tmpdir(), "grugops-wr05-"));
    try {
      const rolesDir = join(root, ROLES_SUBPATH);
      mkdirSync(rolesDir, { recursive: true });
      cpSync(join(import.meta.dirname, "..", ROLES_SUBPATH), rolesDir, {
        recursive: true,
      });

      // THE CONTROL FIRST: the copy alone reproduces the live answer, so the red below is caused by
      // the removal and not by the temp root.
      expect(
        listRoles(root),
        "the mirrored kit must reproduce the live role set before anything is removed from it",
      ).toHaveLength(ROLE_COUNT);

      rmSync(join(rolesDir, listRoles(root)[0]), { force: true });
      const short = listRoles(root);

      // The strengthened assertion RED, asserted by its received value and not by a bare throw: the
      // list really is short by exactly one, and the form the control now uses rejects it.
      expect(short).toHaveLength(ROLE_COUNT - 1);
      expect(() => expect(short).toHaveLength(ROLE_COUNT)).toThrow();

      // AND THE RETIRED FLOOR PASSES ON THESE SAME BYTES, which is the whole finding rather than a
      // decoration on it. A role slipped out of the corpus and `> 0` had nothing to say about it.
      expect(
        short.length > 0,
        "the retired `> 0` floor must be SHOWN to accept a corpus the strengthened assertion rejects",
      ).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
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
