// frontmatter.test.ts — the parser ORACLE for scripts/frontmatter.ts (Phase 27 / SPAWN-04, KIT-03).
//
// This module answers one safety question — "does this file grant spawn, and to whom" — for the
// spawn-grant guard and for the KIT-03 referential-integrity oracle. Its predecessor was two
// line-anchored regular expressions that were believed to "catch every form" and did not: a YAML
// folded scalar puts the value on an indented continuation line and slipped past both, on a role
// adapter and on a skill file, with the whole gate printing ALL CHECKS PASSED (27-REVIEW § CR-02).
//
// A HANDFUL OF EXAMPLES IS WHAT FAILED LAST TIME. The defect was not that someone wrote a bad
// regex; it was that the coverage was a fixed list of the shapes its author happened to imagine, so
// the fourteenth shape was never going to be checked. This suite is therefore built as an ORACLE,
// not as a list of cases:
//
//   • a SERIALIZER TABLE turns one semantic value into one frontmatter document, in one YAML form;
//   • a VALUE CORPUS carries semantic values with their expected grant verdict and expected names,
//     written by hand and independently of the parser;
//   • the product assertion walks the full cartesian product of forms x indentation widths x values
//     and demands the parser recover the SAME verdict and the SAME names for every one.
//
// The expectation is derived from the SEMANTIC VALUE, never restated per form. That is what makes
// adding a fourteenth serializer safe: it is immediately checked against every value, and it cannot
// be quietly dropped either, because the product SIZE is asserted explicitly.
//
// The adversarial cases below the product are the ones a product cannot generate: an unterminated
// block, a document with no frontmatter, key-scoping in both directions, the fence authority, and
// duplicate keys. The two reproduced bypasses also appear as their own NAMED cases so the specific
// regressions are addressable by name rather than only as anonymous members of a product.
//
// Drives the COMMITTED compiled scripts/frontmatter.js (never the .ts) — the repo idiom, and the
// artifact both guards actually import. Reads and writes NOTHING on disk: every document is built in
// memory.

import { describe, it, expect } from "vitest";

import {
  parseFrontmatter,
  hasSpawnGrant,
  grantedAgentNames,
  frontmatterValueIs,
  stripFencedBlocks,
  DQ_ESCAPE_ALLOWLIST,
} from "./frontmatter.js";

// ---------------------------------------------------------------------------
// The value corpus — semantic values with HAND-WRITTEN expectations.
// ---------------------------------------------------------------------------
//
// The expectations are deliberately not computed from the value by any regex, because a computed
// expectation that shares the parser's own token test would make the assertion partly tautological.
// The property under test is that the RECONSTRUCTION recovers the semantic value; the verdict for
// that value is stated here as ground truth.

interface Value {
  readonly label: string;
  readonly value: string;
  readonly grant: boolean;
  readonly names: readonly string[];
}

const VALUES: readonly Value[] = [
  {
    label: "no grant — the ordinary shipped tool list",
    value: "Read, Grep, Glob, Edit, Write, Bash",
    grant: false,
    names: [],
  },
  {
    label: "no grant — tool names ADJACENT to the spawn tokens but not equal to them",
    value: "Read, Grep, Agents, Taskmaster, TaskRunner, Subagent",
    grant: false,
    names: [],
  },
  {
    label: "grant — scoped, several enumerated names",
    value:
      "Read, Grep, Glob, Edit, Write, Bash, Agent(grugops-installer, grugops-security-nfr, grugops-qe-e2e)",
    grant: true,
    names: ["grugops-installer", "grugops-qe-e2e", "grugops-security-nfr"],
  },
  {
    label: "grant — scoped, exactly ONE enumerated name",
    value: "Read, Agent(grugops-software-engineer)",
    grant: true,
    names: ["grugops-software-engineer"],
  },
  {
    label: "grant — UNSCOPED, so there is nothing to enumerate",
    value: "Read, Grep, Agent",
    grant: true,
    names: [],
  },
  {
    label: "grant — the retained LEGACY alias, scoped",
    value: "Read, Task(grugops-release-manager, grugops-uat-planner)",
    grant: true,
    names: ["grugops-release-manager", "grugops-uat-planner"],
  },
];

// ---------------------------------------------------------------------------
// The serializer table — one semantic value, thirteen YAML forms.
// ---------------------------------------------------------------------------

// Split a comma list at its TOP-LEVEL commas only, so `Agent(a, b)` stays one item. Used by the
// sequence and wrapping serializers to express the same semantic value in a different shape.
function splitTopLevel(v: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const c of v) {
    if (c === "(") depth += 1;
    else if (c === ")") depth -= 1;
    if (c === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim() !== "") out.push(cur.trim());
  return out;
}

// Break a comma list into two halves at a top-level comma, for the "wrapped across continuation
// lines" forms. The first half keeps its trailing comma so the rejoined value is byte-identical.
function halves(v: string): [string, string] {
  const items = splitTopLevel(v);
  const cut = Math.max(1, Math.floor(items.length / 2));
  return [`${items.slice(0, cut).join(", ")},`, items.slice(cut).join(", ")];
}

// A serializer emits the frontmatter document for one value, one key and one continuation-indent
// width. Single-line forms ignore the indent — they have no continuation line — and are still
// emitted at both widths on purpose, so the product's shape does not depend on knowing which forms
// happen to be single-line today.
type Serializer = (value: string, key: string, indent: string) => string;

const doc = (body: string[]): string => `---\n${body.join("\n")}\n---\nBody prose.\n`;

const FORMS: readonly { readonly label: string; readonly emit: Serializer }[] = [
  {
    label: "plain single-line",
    emit: (v, k) => doc([`${k}: ${v}`]),
  },
  {
    label: "plain wrapped onto a continuation line",
    emit: (v, k, i) => {
      const [a, b] = halves(v);
      return doc([`${k}: ${a}`, `${i}${b}`]);
    },
  },
  {
    label: "folded scalar (>)",
    emit: (v, k, i) => {
      const [a, b] = halves(v);
      return doc([`${k}: >`, `${i}${a}`, `${i}${b}`]);
    },
  },
  {
    label: "folded scalar, strip-chomped (>-)",
    emit: (v, k, i) => {
      const [a, b] = halves(v);
      return doc([`${k}: >-`, `${i}${a}`, `${i}${b}`]);
    },
  },
  {
    label: "literal scalar (|)",
    emit: (v, k, i) => {
      const [a, b] = halves(v);
      return doc([`${k}: |`, `${i}${a}`, `${i}${b}`]);
    },
  },
  {
    label: "literal scalar, strip-chomped (|-)",
    emit: (v, k, i) => {
      const [a, b] = halves(v);
      return doc([`${k}: |-`, `${i}${a}`, `${i}${b}`]);
    },
  },
  {
    label: "double-quoted single-line",
    emit: (v, k) => doc([`${k}: "${v}"`]),
  },
  {
    label: "double-quoted, wrapped onto a continuation line",
    emit: (v, k, i) => {
      const [a, b] = halves(v);
      return doc([`${k}: "${a}`, `${i}${b}"`]);
    },
  },
  {
    label: "single-quoted single-line",
    emit: (v, k) => doc([`${k}: '${v}'`]),
  },
  {
    label: "flow sequence on the key line",
    emit: (v, k) =>
      doc([
        `${k}: [${splitTopLevel(v)
          .map((x) => (x.includes(",") ? `"${x}"` : x))
          .join(", ")}]`,
      ]),
  },
  {
    label: "block sequence, bare items",
    emit: (v, k, i) =>
      doc([`${k}:`, ...splitTopLevel(v).map((x) => `${i}- ${x}`)]),
  },
  {
    label: "block sequence, quoted items",
    emit: (v, k, i) =>
      doc([`${k}:`, ...splitTopLevel(v).map((x) => `${i}- "${x}"`)]),
  },
  {
    label: "plain single-line with a trailing unquoted comment",
    emit: (v, k) => doc([`${k}: ${v}   # the tools this agent may use`]),
  },
];

// ── THE ESCAPE AXIS (27-REVIEW-GAPS-3 § CR-01, round 3 — plan 27-29, D-30) ────────────────────────
//
// Seventeen rows above pin YAML NODE PROPERTIES: a reference sigil at a node start, and a tag
// standing in front of one. The parser's own STRING REWRITER was wrong on a different axis entirely
// and nobody had enumerated it. `unquote()` resolved a double-quoted scalar by deleting every
// backslash, which is right for `\"` and `\\` by accident and destroys every other escape YAML 1.2
// § 5.7 defines, so `"\x41gent(grugops-orchestrator)"` — a value a compliant loader resolves to
// `Agent(grugops-orchestrator)` — flattened to `x41gent(grugops-orchestrator)` and returned the
// no-grant SUCCESS arm on a document that grants the spawn tool.
//
// THE SAME DISCIPLINE THE TAG AXIS RECORDS APPLIES HERE, AND FOR THE SAME REASON. Two things are
// enumerated separately below:
//
//   • the five APPLICATION POINTS again, now carrying an escape — because the refusal must be a
//     property of "wherever a quoted scalar is read", not a patch on the one serializer the review
//     reported. Writing these five FIRST is what caught the first draft of the D-30 fix: it routed
//     the wholly-quoted scalar through the allowlist and left the FLOW-ITEM and PLAIN-CONTINUATION
//     points returning `{ ok: true, value: false }` — the same fail-open, at two of five points.
//   • the STRUCTURAL SPELLINGS — the three numeric widths in both placements, five non-numeric YAML
//     escapes, a truncated numeric form and a dangling backslash — because an enumeration that only
//     varied the reported spelling would prove nothing about the allowlist, which is the mechanism.
//
// AND NEITHER OF THOSE IS THE LOAD-BEARING PROOF. A fixed table proves that the spellings SOMEONE
// THOUGHT OF refuse; the exhaustive escape-alphabet property further down proves that a spelling
// NOBODY thought of refuses BY DEFAULT. These rows exist so the reported regressions are addressable
// by name; the property is what ends the round-per-spelling series.

// ONE backslash byte, from a char code. NEVER a source literal: a doubled backslash is a different
// (and allowlisted) document, so a fixture that accidentally doubles it proves the opposite of what
// it claims. The review's reproduction instruction was to verify the bytes with `od -c` for exactly
// this reason, and the length assertion in the table-size case is that instruction in code.
const BS = String.fromCharCode(92);

// The escaped spelling of a spawn grant, for a given escape sequence. `\x41` is `A`, so this is the
// review's reproduction verbatim; the other spellings are the same shape on a different escape.
const escapedGrant = (esc: string): string =>
  `${esc}gent(grugops-orchestrator)`;

// The reported spelling, used by the five application-point rows so those rows vary the PLACE and
// hold the spelling fixed — the converse of the spelling rows, which hold the place fixed.
const ESC_GRANT = escapedGrant(`${BS}x41`);

// A refused row for one escape sequence in the LEADING placement (the escape produces the first
// character of the grant token) and one in the MID-VALUE placement (the escape sits inside an
// otherwise plain value). Built by a helper so a spelling cannot be added to one placement and
// silently forgotten in the other.
const escapeSpellingRows = (
  name: string,
  esc: string,
): readonly { readonly label: string; readonly emit: Serializer }[] => [
  {
    label: `ESCAPE spelling — ${name}, LEADING (the escape produces the grant token's first character)`,
    emit: (v, k) => doc([`${k}: "${escapedGrant(esc)}, ${v}"`]),
  },
  {
    label: `ESCAPE spelling — ${name}, MID-VALUE (the escape sits inside an otherwise plain value)`,
    emit: (v, k) => doc([`${k}: "${v}, Re${esc}ad"`]),
  },
];

const ESCAPE_FORMS: readonly {
  readonly label: string;
  readonly emit: Serializer;
}[] = [
  // ── The five APPLICATION POINTS, one spelling, five places ──────────────────────────────────
  {
    // KEY-LINE application point, on the tools key's OWN value. The review's reproduction in shape.
    label: "ESCAPE axis / KEY-LINE — an escaped grant in the tools key's own double-quoted value (the CR-01 round-3 reproduction)",
    emit: (v, k) => doc([`${k}: "${ESC_GRANT}, ${v}"`]),
  },
  {
    // KEY-LINE application point on a HELPER key that is aliased NOWHERE — so the row is red for the
    // escape and not, as a tag/anchor row would be, for a reference. Deliberately carries a clean
    // tools key: the refusal must come from the helper's own unreadable value.
    label: "ESCAPE axis / KEY-LINE — an escaped value under a helper key aliased nowhere (red for the escape, not for a reference)",
    emit: (v, k) => doc([`_helper: "${ESC_GRANT}"`, `${k}: ${v}`]),
  },
  {
    // FLOW-ITEM node start: the escape is inside a quoted item of a `[...]` collection, so the VALUE
    // is not one wholly-quoted scalar and the wrapping-quote strip never sees it. One of the two
    // points the first draft of the fix missed.
    label: "ESCAPE axis / FLOW-ITEM — an escaped grant as a quoted item inside a flow collection",
    emit: (v, k) => doc([`${k}: [${splitTopLevel(v)[0]}, "${ESC_GRANT}"]`]),
  },
  {
    // SEQ_ITEM application point: a block-sequence item on a continuation line, which IS a wholly
    // quoted scalar at its own node start. This is the shape the aggregator case plants.
    label: "ESCAPE axis / SEQ_ITEM — an escaped grant as a quoted block-sequence item on a continuation line",
    emit: (v, k, i) =>
      doc([
        `${k}:`,
        ...splitTopLevel(v).map((x) => `${i}- ${x}`),
        `${i}- "${ESC_GRANT}"`,
      ]),
  },
  {
    // PLAIN-CONTINUATION application point: the escaped fragment arrives on the wrapped line, so the
    // joined value is a composite that no wrapping-quote strip matches. The second point the first
    // draft missed, and the one a key-line-only test misses entirely.
    label: "ESCAPE axis / PLAIN-CONTINUATION — an escaped quoted fragment arriving on a plain continuation line",
    emit: (v, k, i) => doc([`${k}: ${halves(v)[0]}`, `${i}"${ESC_GRANT}"`]),
  },

  // ── The STRUCTURAL SPELLINGS, one place, many spellings ─────────────────────────────────────
  //
  // The three NUMERIC widths YAML defines, each in both placements. These are the ones the pre-D-30
  // rewrite silently mangled into a string no loader computes.
  ...escapeSpellingRows("8-bit numeric (\\xNN)", `${BS}x41`),
  ...escapeSpellingRows("16-bit numeric (\\uNNNN)", `${BS}u0041`),
  ...escapeSpellingRows("32-bit numeric (\\UNNNNNNNN)", `${BS}U00000041`),
  // NON-NUMERIC escapes. The pre-D-30 rewrite mangled these too — it turned `\n` into a literal `n`,
  // which is not a newline and not a backslash-n either. They are enumerated because the axis is
  // "what does this module do that YAML does not", not "which escapes carry hex digits".
  {
    label: "ESCAPE spelling — the line-feed escape (\\n), which the old rewrite turned into a literal `n`",
    emit: (v, k) => doc([`${k}: "${v},${BS}nAgent-free tail"`]),
  },
  {
    label: "ESCAPE spelling — the tab escape (\\t)",
    emit: (v, k) => doc([`${k}: "${v},${BS}tAgent-free tail"`]),
  },
  {
    label: "ESCAPE spelling — the escape-character escape (\\e), a YAML-only spelling",
    emit: (v, k) => doc([`${k}: "${v},${BS}e tail"`]),
  },
  {
    label: "ESCAPE spelling — the next-line escape (\\N), whose UPPERCASE letter distinguishes it from \\n",
    emit: (v, k) => doc([`${k}: "${v},${BS}N tail"`]),
  },
  {
    label: "ESCAPE spelling — the non-breaking-space escape (\\_), whose second character is punctuation",
    emit: (v, k) => doc([`${k}: "${v},${BS}_ tail"`]),
  },
  // PRECISION: a numeric escape whose hex-digit count is SHORT. It carries no special case in the
  // module — it is simply not on the allowlist — which is exactly the point: the hex-digit count can
  // never be miscounted into a resolution, because no count is ever counted.
  {
    label: "ESCAPE precision — a TRUNCATED numeric escape (one hex digit where two are required)",
    emit: (v, k) => doc([`${k}: "${BS}x4gent(grugops-orchestrator), ${v}"`]),
  },
  // BOUNDARY: a backslash that is the LAST character of the scalar body. There is nothing after it to
  // be on the allowlist, so a scanner that read `body[i + 1]` without a bounds check would resolve
  // `undefined` and pass.
  {
    label: "ESCAPE boundary — a DANGLING backslash at the very end of the scalar body",
    emit: (v, k) => doc([`${k}: "${v}${BS}"`]),
  },
];

// ---------------------------------------------------------------------------
// The REFUSED-form serializer table — the same product discipline, for the documents that must FAIL.
// ---------------------------------------------------------------------------
//
// WHY THIS TABLE HAD TO EXIST (27-REVIEW-GAPS § CR-01). The oracle above was structurally incapable of
// catching the anchor/alias bypass, for two compounding reasons: its serializer table had no reference
// form, and its product only generates documents it already asserts `ok === true` for. So a construct
// whose correct outcome is REFUSAL had nowhere to live, and the module shipped a header claiming a
// refusal it did not perform while every case stayed green.
//
// The fix is not a case; it is a second product with the SAME shape as the first. Every refused form
// is walked against every indent and every value, the count is pinned, and the load-bearing assertion
// is not merely `ok === false` — it is that `hasSpawnGrant` and `grantedAgentNames` are NOT the
// value-false and empty-array SUCCESS arms. That distinction is the entire defect: a consumer reading
// the two the same way is how the bypass survived.
//
// Each row is annotated with the application point in flattenBlock it exercises, so the five rows are
// coverage of the five places a reference can sit rather than five spellings of one place.
const REFUSED_FORMS: readonly {
  readonly label: string;
  readonly emit: Serializer;
}[] = [
  {
    // KEY-LINE application point. The 27-REVIEW-GAPS § CR-01 reproduction verbatim in shape: the
    // anchor is parked under an underscore-prefixed key that is not a tools key at all, and the real
    // tools key carries only the alias. Reading the alias as plain text is the silent no-grant arm.
    label: "alias in the value position, anchor parked under a second key (the CR-01 reproduction)",
    emit: (v, k) => doc([`_tools: &t ${v}`, `${k}: *t`]),
  },
  {
    // KEY-LINE application point, on the tools key's OWN value.
    label: "anchor directly on the tools key's own value",
    emit: (v, k) => doc([`${k}: &t ${v}`]),
  },
  {
    // FLOW-ITEM node start: the sigil is neither at the start of the value nor on its own line, it is
    // an item inside a `[...]` collection. Both the anchor and the alias sit in the flow sequence, so
    // the document needs no separate anchor key.
    label: "anchor and alias as flow-sequence items",
    emit: (v, k) =>
      doc([`${k}: [&t ${splitTopLevel(v)[0]}, *t]`]),
  },
  {
    // SEQ_ITEM application point: a block-sequence item on a continuation line.
    label: "anchor and alias as block-sequence items on continuation lines",
    emit: (v, k, i) =>
      doc([`${k}:`, ...splitTopLevel(v).map((x) => `${i}- &t ${x}`), `${i}- *t`]),
  },
  {
    // PLAIN-CONTINUATION application point: the value wraps and the alias arrives on the wrapped line,
    // which is the one position a key-line-only test would miss entirely.
    label: "alias arriving on a plain continuation line of a wrapped value",
    emit: (v, k, i) => doc([`${k}: ${halves(v)[0]}`, `${i}*t`]),
  },

  // ── THE TAG AXIS (27-REVIEW-GAPS-2 § CR-01, round 2 — plan 27-24) ────────────────────────────
  //
  // The five rows above pin a reference sigil standing at a node start. A YAML TAG is a node
  // PROPERTY that legally stands IN FRONT of one, so `!!str &t …` does not begin with a sigil and
  // `!!seq [*t]` does not begin with `[` — and every one of the twelve rows below returned the
  // no-grant SUCCESS arm against the parser as it stood before this round. That is the same
  // fail-open this milestone already closed once, returning in a new spelling.
  //
  // THE REMEDY IS AN AXIS, NOT A ROW FOR THE REPORTED SPELLING. Two things are enumerated here and
  // they are enumerated separately on purpose:
  //
  //   • the five APPLICATION POINTS again, now with a tag in front — because the refusal must be a
  //     property of "what is a node start", not a patch on the one serializer the review reported;
  //   • the STRUCTURAL SHAPES a tag can take — the double-indicator shorthand, a single-indicator
  //     local tag, a named handle carrying a second indicator INSIDE the tag, a verbatim
  //     angle-bracket tag, and the bare non-specific tag whose second character is a space — plus
  //     the two adjacency shapes and the nested-node shape. An enumeration that only varied the
  //     tag's SPELLING would prove nothing about the strip, which is the new mechanism.
  //
  // The bare non-specific rows are the load-bearing ones for the strip specifically: `! &t …`,
  // `![*t]` and `[! *t]` are invisible to the widened sigil class alone (their second character is a
  // space or a flow indicator), so only the leading-tag strip reaches them.
  {
    // KEY-LINE application point. The 27-REVIEW-GAPS-2 § CR-01 reproduction verbatim in shape, and
    // also the double-indicator SHORTHAND tag shape: the anchor hides behind `!!str` on a key that is
    // not a tools key, and the tools key carries `!!seq` in front of a flow collection holding the
    // alias — so neither line begins with a sigil and neither begins with a flow indicator.
    label: "TAG axis / KEY-LINE — double-indicator shorthand tag in front of the anchor, tagged flow alias on the tools key (the CR-01 round-2 reproduction)",
    emit: (v, k) => doc([`_tools: !!str &t ${v}`, `${k}: !!seq [*t]`]),
  },
  {
    // KEY-LINE application point, on the tools key's OWN value, with no reference at all. An
    // unresolved node property is enough on its own: the value the document expresses is not the
    // text on the line, so reading the text is not a verdict this module may return.
    label: "TAG axis / KEY-LINE — a tag standing directly on the tools key's own value",
    emit: (v, k) => doc([`${k}: !!str ${v}`]),
  },
  {
    // FLOW-ITEM node start, behind a tag: the collection is introduced by `!!seq`, so the value no
    // longer OPENS with `[` and the fragment split is only reached once the tag is stripped.
    label: "TAG axis / FLOW-ITEM — a TAGGED flow collection whose items carry the anchor and the alias",
    emit: (v, k) => doc([`${k}: !!seq [&t ${splitTopLevel(v)[0]}, *t]`]),
  },
  {
    // SEQ_ITEM application point: each block-sequence item is its own node and carries its own tag.
    label: "TAG axis / SEQ_ITEM — tagged anchor and alias as block-sequence items on continuation lines",
    emit: (v, k, i) =>
      doc([
        `${k}:`,
        ...splitTopLevel(v).map((x) => `${i}- !!str &t ${x}`),
        `${i}- !!str *t`,
      ]),
  },
  {
    // PLAIN-CONTINUATION application point: the tag arrives on the wrapped line, the one position a
    // key-line-only test misses entirely.
    label: "TAG axis / PLAIN-CONTINUATION — a tagged alias arriving on a plain continuation line of a wrapped value",
    emit: (v, k, i) => doc([`${k}: ${halves(v)[0]}`, `${i}!!str *t`]),
  },
  {
    // SHAPE: a single-indicator LOCAL tag. One `!`, an ordinary name — structurally distinct from the
    // shorthand form because there is no second indicator to key on.
    label: "TAG shape — a single-indicator LOCAL tag",
    emit: (v, k) => doc([`_tools: !grugops &t ${v}`, `${k}: !grugops [*t]`]),
  },
  {
    // SHAPE: a NAMED HANDLE carries a second `!` INSIDE the tag token, so a strip that stopped at the
    // second indicator would leave `!seq [*t]` behind and mis-read the remainder as content.
    label: "TAG shape — a NAMED-HANDLE tag carrying a second indicator inside the tag",
    emit: (v, k) => doc([`_tools: !e!scalar &t ${v}`, `${k}: !e!seq [*t]`]),
  },
  {
    // SHAPE: a VERBATIM tag is delimited by angle brackets and may legally contain characters — `[`
    // among them — that terminate every other tag form. A strip that split on flow indicators rather
    // than honouring the delimiters would cut this tag in half.
    label: "TAG shape — a VERBATIM tag delimited by angle brackets",
    emit: (v, k) =>
      doc([
        `_tools: !<tag:grugops.dev,2026:str> &t ${v}`,
        `${k}: !<tag:grugops.dev,2026:seq> [*t]`,
      ]),
  },
  {
    // SHAPE: the BARE NON-SPECIFIC tag. Its second character is a SPACE, so the sigil class alone
    // cannot see it — this row is red only because one leading tag is stripped before the node start
    // is re-tested. It is the sharpest row in the table for that reason.
    label: "TAG shape — the BARE non-specific tag, whose second character is a space (invisible to the sigil class alone)",
    emit: (v, k) => doc([`_tools: ! &t ${v}`, `${k}: ! [*t]`]),
  },
  {
    // ADJACENCY: no whitespace at all between the tag and the collection it introduces.
    label: "TAG adjacency — a shorthand tag butting directly against the collection, no separating whitespace",
    emit: (v, k) => doc([`_tools: !!str &t ${v}`, `${k}: !!seq[*t]`]),
  },
  {
    // ADJACENCY: a tag, then an ANCHOR, then the collection — two node properties stacked in front of
    // the node. Stripping ONE tag must still leave the anchor visible at the node start.
    label: "TAG adjacency — a tag followed by an ANCHOR which is itself followed by the collection",
    emit: (v, k) => doc([`_tools: !!str &t ${v}`, `${k}: !!seq &a [*t]`]),
  },
  {
    // NESTING: the tag sits on nodes INSIDE the flow collection rather than in front of it, and it is
    // the bare form again — so this row is red only if the strip is applied at each nested node's OWN
    // start rather than once at the value's start. Deliberately carries NO tagged key line of its
    // own: a helper key with a tag in front of an anchor would be refused by the widened sigil class
    // before the nesting was ever reached, and the row would then be green for a reason having
    // nothing to do with what it claims to cover.
    label: "TAG nesting — BARE non-specific tags on nodes INSIDE a flow collection",
    emit: (v, k) => doc([`${k}: [! &t ${splitTopLevel(v)[0]}, ! *t]`]),
  },

  // ── THE ESCAPE AXIS (plan 27-29, round 3) ────────────────────────────────────────────────────
  // Spread in rather than restated, so the eighteen rows are defined ONCE beside their own recorded
  // argument and cannot drift from it. The table-size floor below moved with them, 17 -> 35.
  ...ESCAPE_FORMS,
];

// Two continuation-indent widths, so indentation is part of the product rather than an assumption
// baked into every fixture.
const INDENTS: readonly string[] = ["  ", "    "];

describe("frontmatter — the spawn-grant parser oracle (SPAWN-04 / KIT-03)", () => {
  // ── The product ───────────────────────────────────────────────────────────────────────────────

  it("the serializer table and value corpus are large enough to be an oracle rather than a list", () => {
    expect(FORMS.length).toBeGreaterThanOrEqual(13);
    expect(VALUES.length).toBeGreaterThanOrEqual(6);
    expect(INDENTS.length).toBe(2);
    // Every form and every value carries a distinct label, so a duplicated table row cannot inflate
    // the count while adding no coverage.
    expect(new Set(FORMS.map((f) => f.label)).size).toBe(FORMS.length);
    expect(new Set(VALUES.map((v) => v.label)).size).toBe(VALUES.length);
    // (CR-01) The REFUSED table is held to the same discipline, for the same reason: a refused
    // serializer silently dropped from the table would shrink the refusal claim while every remaining
    // assertion stayed green — the exact shape of the coverage gap that let the anchor/alias bypass
    // ship. Five bare-sigil rows covering the five application points in flattenBlock, plus (plan
    // 27-24) twelve TAG-axis rows: the same five application points with a tag in front, the five
    // structural tag shapes, the two adjacency shapes and the nested-node shape.
    //
    // THE FLOOR MOVED WITH THE ROWS, 5 -> 17, in the same edit that added them. A floor left at 5
    // would have let any twelve of the seventeen be deleted later without a single assertion going
    // red — which is precisely how a refusal claim shrinks silently.
    //
    // (Plan 27-29) AND AGAIN, 17 -> 35, for the eighteen ESCAPE-axis rows: five application points,
    // three numeric widths in two placements each, five non-numeric spellings, one truncated numeric
    // form and one dangling backslash.
    expect(REFUSED_FORMS.length).toBeGreaterThanOrEqual(35);
    expect(new Set(REFUSED_FORMS.map((f) => f.label)).size).toBe(
      REFUSED_FORMS.length,
    );
    // The escape rows are counted on their own too, so a future edit that removed the whole axis
    // while adding an unrelated row elsewhere could not keep the combined floor satisfied.
    expect(ESCAPE_FORMS.length).toBeGreaterThanOrEqual(18);
    // ONE backslash byte, asserted rather than assumed — a doubled backslash is an ALLOWLISTED
    // document, so a fixture that silently doubled it would prove the opposite of what it claims.
    // This is the review's `od -c` instruction, in code.
    expect(BS.length).toBe(1);
    expect(BS.charCodeAt(0)).toBe(92);
    expect(ESC_GRANT.split(BS).length - 1).toBe(1);
  });

  it("recovers the grant verdict and the enumerated names across all scalar forms x indents x values", () => {
    let checked = 0;
    for (const form of FORMS) {
      for (const indent of INDENTS) {
        for (const v of VALUES) {
          const text = form.emit(v.value, "tools", indent);
          const grant = hasSpawnGrant(text);
          const names = grantedAgentNames(text);
          const where = `${form.label} | indent=${indent.length} | ${v.label}`;
          // A parse failure here would be a defect in its own right — the product only generates
          // well-formed documents — so assert the success arm before reading through it.
          expect(grant.ok, where).toBe(true);
          expect(names.ok, where).toBe(true);
          expect(grant.ok && grant.value, where).toBe(v.grant);
          expect(names.ok ? names.value : null, where).toEqual([...v.names]);
          checked += 1;
        }
      }
    }
    // Stated explicitly: a serializer accidentally dropped from the table fails THIS assertion
    // rather than quietly shrinking coverage while every remaining case stays green.
    expect(checked).toBe(FORMS.length * INDENTS.length * VALUES.length);
    expect(checked).toBeGreaterThanOrEqual(156);
  });

  // ── The REFUSED product (CR-01) ───────────────────────────────────────────────────────────────

  it("REFUSES every YAML reference form x indents x values — and never returns the no-grant SUCCESS arm", () => {
    let checked = 0;
    for (const form of REFUSED_FORMS) {
      for (const indent of INDENTS) {
        for (const v of VALUES) {
          const text = form.emit(v.value, "tools", indent);
          const where = `${form.label} | indent=${indent.length} | ${v.label}`;
          const parsed = parseFrontmatter(text);
          expect(parsed.ok, where).toBe(false);
          if (!parsed.ok) expect(parsed.reason, where).toMatch(/anchor or alias/);

          // THE LOAD-BEARING HALF. `ok === false` alone would still be satisfied by a module that
          // refused for the wrong reason; what the CR-01 defect actually produced was the SUCCESS arm
          // carrying a clean no-grant verdict on a document that grants the spawn tool. So assert the
          // success arms are absent by identity, exactly as the unterminated-block case does.
          const grant = hasSpawnGrant(text);
          expect(grant.ok, where).toBe(false);
          expect(grant, where).not.toEqual({ ok: true, value: false });
          const names = grantedAgentNames(text);
          expect(names.ok, where).toBe(false);
          expect(names, where).not.toEqual({ ok: true, value: [] });
          checked += 1;
        }
      }
    }
    // Same cardinality pin as the passing product: a refused serializer dropped from the table fails
    // THIS assertion rather than quietly shrinking what "refuses every reference form" means.
    // (Plan 27-24) Raised 60 -> 204 in the same edit that added the twelve tag-axis rows, for the
    // same reason the table floor moved: a floor that does not track the table counts nothing.
    // (Plan 27-29) Raised 204 -> 420 with the eighteen escape-axis rows.
    expect(checked).toBe(REFUSED_FORMS.length * INDENTS.length * VALUES.length);
    expect(checked).toBeGreaterThanOrEqual(420);
  });

  it("the refusal holds identically under the skill form of the key (allowed-tools)", () => {
    for (const form of REFUSED_FORMS) {
      for (const v of VALUES) {
        const text = form.emit(v.value, "allowed-tools", "  ");
        expect(hasSpawnGrant(text).ok, `${form.label} | ${v.label}`).toBe(false);
      }
    }
  });

  // ── The control in the OPPOSITE direction (plan 27-24) ────────────────────────────────────────
  //
  // The tag axis above widens a refusal, and a widened refusal has its own failure mode: firing on
  // legitimate authored content. The module header already names it — "a guard that fails on correct
  // documentation teaches the next author to delete the documentation" — and this case is what stops
  // the NEXT widening from causing it. Both halves are real shapes a shipped file can carry: a value
  // that genuinely begins with the tag indicator (which YAML requires be quoted, and a quoted value
  // is a literal string), and the indicator arriving mid-sentence in a description.
  it("does NOT refuse legitimate content carrying the tag indicator — quoted leading indicator, and mid-sentence", () => {
    // A QUOTED value beginning with the tag indicator is a literal string, so it reaches the SUCCESS
    // arm carrying exactly the grant verdict its text carries — the same verdict the equivalent
    // unquoted-but-untagged list would produce.
    const quoted: readonly {
      readonly label: string;
      readonly line: string;
      readonly grant: boolean;
      readonly names: readonly string[];
    }[] = [
      {
        label: 'double-quoted, leading indicator, no grant',
        line: 'tools: "!weird-tool, Read, Grep"',
        grant: false,
        names: [],
      },
      {
        label: "single-quoted, leading indicator, no grant",
        line: "tools: '!weird-tool, Read, Grep'",
        grant: false,
        names: [],
      },
      {
        label: "double-quoted, leading indicator, SCOPED GRANT INTACT",
        line: 'tools: "!weird-tool, Read, Agent(grugops-installer)"',
        grant: true,
        names: ["grugops-installer"],
      },
      {
        label: "double-quoted, leading DOUBLE indicator, scoped grant intact",
        line: 'tools: "!!weird-tool, Read, Agent(grugops-qe-e2e)"',
        grant: true,
        names: ["grugops-qe-e2e"],
      },
    ];
    for (const q of quoted) {
      const text = doc([q.line]);
      const grant = hasSpawnGrant(text);
      const names = grantedAgentNames(text);
      expect(grant.ok, q.label).toBe(true);
      expect(grant.ok && grant.value, q.label).toBe(q.grant);
      expect(names.ok, q.label).toBe(true);
      expect(names.ok ? names.value : null, q.label).toEqual([...q.names]);
    }

    // A description carrying the indicator MID-SENTENCE is ordinary prose. The refusal is anchored at
    // a node START, so none of these may be refused — and none of them is a grant either.
    const prose = [
      "description: Reads the repo and warns loudly! Nothing is written.",
      "description: Escalates on !important findings before the gate runs.",
      "description: Uses the a!b handle and the c!d handle interchangeably.",
      "description: Never pass ! as a bare argument.",
    ];
    for (const line of prose) {
      const text = doc([line, "tools: Read, Grep, Glob"]);
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, line).toBe(true);
      const grant = hasSpawnGrant(text);
      expect(grant.ok, line).toBe(true);
      expect(grant.ok && grant.value, line).toBe(false);
    }
  });

  // ── The ESCAPE-axis controls in the OPPOSITE direction (plan 27-29, D-30) ─────────────────────
  //
  // The escape axis widens a refusal, and every widened refusal risks the same failure: firing on
  // legitimate authored content. These are the PRIMARY controls on the D-30 change, and both assert a
  // RESOLVED VALUE rather than only an ok flag — a control that checked the flag alone would pass on a
  // document that parsed to nothing, which is precisely the silent-success shape this module exists
  // to close.
  //
  //   • SINGLE-QUOTED is the load-bearing one. In YAML a backslash inside single quotes is a LITERAL
  //     backslash and the only escape is the doubled `''`, so the very text that must refuse inside
  //     double quotes must PARSE here — and the grant it plainly carries must still be enumerated.
  //   • DOUBLE-BACKSLASH is the just-touching adjacency control: `\\` IS on the allowlist, so it
  //     resolves to one backslash and the character after it is ordinary text, not an escape. A
  //     module that refused it would be refusing a sequence it implements correctly.
  it("does NOT refuse a backslash where YAML makes it literal, and RESOLVES the two allowlisted spellings — with the value asserted", () => {
    const controls: readonly {
      readonly label: string;
      readonly line: string;
      readonly flattened: string;
      readonly grant: boolean;
      readonly names: readonly string[];
    }[] = [
      {
        label:
          "SINGLE-QUOTED — the same escaped text that refuses in double quotes is literal here, and the real grant beside it is still ENUMERATED",
        line: `tools: 'Read, ${BS}x41gent(not-a-grant), Agent(grugops-installer)'`,
        flattened: `Read, ${BS}x41gent(not-a-grant), Agent(grugops-installer)`,
        grant: true,
        names: ["grugops-installer"],
      },
      {
        label:
          "SINGLE-QUOTED — a lone backslash, which has no meaning at all inside single quotes",
        line: `tools: 'Read, Grep${BS}'`,
        flattened: `Read, Grep${BS}`,
        grant: false,
        names: [],
      },
      {
        label:
          "DOUBLE-BACKSLASH — allowlisted, resolves to exactly ONE backslash, so `x` after it is text and not an escape",
        line: `tools: "Read, ${BS}${BS}x41gent(o), Agent(grugops-qe-e2e)"`,
        flattened: `Read, ${BS}x41gent(o), Agent(grugops-qe-e2e)`,
        grant: true,
        names: ["grugops-qe-e2e"],
      },
      {
        label:
          "ESCAPED QUOTE — allowlisted, resolves to a bare double quote and the grant survives it",
        line: `tools: "Read, ${BS}"quoted${BS}", Agent(grugops-installer)"`,
        flattened: `Read, "quoted", Agent(grugops-installer)`,
        grant: true,
        names: ["grugops-installer"],
      },
      {
        label:
          "ESCAPED SLASH — allowlisted, resolves to a bare forward slash",
        line: `tools: "Read, a${BS}/b, Agent(grugops-qe-e2e)"`,
        flattened: "Read, a/b, Agent(grugops-qe-e2e)",
        grant: true,
        names: ["grugops-qe-e2e"],
      },
      {
        label:
          "PLAIN SCALAR — a backslash outside any quoting is literal text in YAML and must not refuse",
        line: `tools: Read, ${BS}x41gent(not-a-grant), Agent(grugops-installer)`,
        flattened: `Read, ${BS}x41gent(not-a-grant), Agent(grugops-installer)`,
        grant: true,
        names: ["grugops-installer"],
      },
    ];
    let checked = 0;
    for (const c of controls) {
      const text = doc([c.line]);
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, c.label).toBe(true);
      if (!parsed.ok) continue;
      // THE LOAD-BEARING HALF: the RESOLVED value, not the ok flag.
      expect(parsed.value.get("tools"), c.label).toEqual([c.flattened]);
      expect(hasSpawnGrant(text), c.label).toEqual({
        ok: true,
        value: c.grant,
      });
      expect(grantedAgentNames(text), c.label).toEqual({
        ok: true,
        value: [...c.names],
      });
      checked += 1;
    }
    expect(checked).toBe(controls.length);
    expect(checked).toBeGreaterThanOrEqual(6);
    // The two allowlisted resolutions carry exactly ONE backslash / ONE quote in their flattened
    // form, stated as a count so a rewrite that dropped or doubled the character fails here.
    expect(controls[2].flattened.split(BS).length - 1).toBe(1);
    expect(controls[3].flattened.split('"').length - 1).toBe(2);
  });

  // ── The MULTI-LINE double-quoted scalar, DECIDED in both directions (plan 27-29, D-33) ────────
  //
  // The round-3 reviewer flagged this as "the same class and it is unpinned": `unquote` runs on the
  // JOINED value, so YAML's line-folding rules meet this module's space join and nobody had said what
  // that means. D-33 decides it rather than leaving it to emerge, and both halves carry a case here.
  it("D-33 — a multi-line double-quoted scalar FOLDS plainly, and a backslash line-continuation REFUSES", () => {
    // HALF ONE: plain folding. The space join reproduces what YAML folding computes for the ordinary
    // case, so the value resolves and the grant inside it is enumerated.
    const folded = doc([
      'tools: "Read, Grep,',
      '  Agent(grugops-installer)"',
    ]);
    const pFolded = parseFrontmatter(folded);
    expect(pFolded.ok).toBe(true);
    if (!pFolded.ok) return;
    expect(pFolded.value.get("tools")).toEqual([
      "Read, Grep, Agent(grugops-installer)",
    ]);
    expect(grantedAgentNames(folded)).toEqual({
      ok: true,
      value: ["grugops-installer"],
    });

    // HALF TWO: a YAML BACKSLASH LINE-CONTINUATION. It survives the space join as a
    // backslash-followed-by-space sequence, which is not on the allowlist, so the document refuses.
    // That is the honest outcome: this module does not implement escaped line breaks, so a document
    // using one expresses a value it cannot compute — the same argument the reference refusals make.
    const continued = doc([
      `tools: "Read, Grep, ${BS}`,
      '  Agent(grugops-installer)"',
    ]);
    const pCont = parseFrontmatter(continued);
    expect(pCont.ok).toBe(false);
    if (pCont.ok) return;
    expect(pCont.reason).toContain(`backslash sequence \`${BS} \``);
    expect(pCont.reason).toMatch(/anchor or alias/);
    // And the load-bearing half: NOT the no-grant success arm, on a document that grants spawn.
    const grant = hasSpawnGrant(continued);
    expect(grant.ok).toBe(false);
    expect(grant).not.toEqual({ ok: true, value: false });
    const names = grantedAgentNames(continued);
    expect(names.ok).toBe(false);
    expect(names).not.toEqual({ ok: true, value: [] });
  });

  // ── THE EXHAUSTIVE ESCAPE-ALPHABET PROPERTY (plan 27-29, D-30) ────────────────────────────────
  //
  // WHY THIS BLOCK EXISTS IN THE SHAPE IT HAS. Everything above is a table: it proves that the
  // spellings SOMEONE ENUMERATED refuse. That is exactly the coverage shape that let CR-01 ship three
  // times — round 1 enumerated the bare sigil, round 2 the tag in front of it, round 3 the numeric
  // escape, and each round's table was complete for the spelling it had been shown. A fourth table
  // would buy a fourth round.
  //
  // This product proves the DIFFERENT property, the one that ends the series: a backslash spelling
  // NOBODY enumerated refuses BY DEFAULT. It sweeps EVERY printable ASCII character in the escape
  // position, in every placement, and demands exactly two outcomes with no third and no exception —
  // resolve if and only if the character is on the allowlist, refuse otherwise. That is what makes
  // D-30's inversion structural rather than a fourth patch: the property is a statement about the
  // COMPLEMENT of a three-member set, not about a list of known-bad rows.
  //
  // DEPENDENCY-FREE BY CONSTRUCTION (CLAUDE.md dev-dependency fence). No property-testing library, no
  // YAML library, nothing but the Node standard library and vitest. The alphabet is a code-point
  // range, the product is two nested loops, and the observation count is asserted as a number.
  //
  // THE EXPECTATION IS BOUND TO A RESTATED CONSTANT, NOT TO THE MODULE'S MAP. If the sweep asked the
  // module which characters resolve, it would agree with the module by construction and prove
  // nothing. So `ALLOWLISTED_ESCAPES` is written by hand here and the module's exported map is
  // asserted EQUAL to it — member for member and size for size. A fourth entry added to the module
  // therefore fails twice: the equality, and every observation for that character.

  // Every printable ASCII character, space (0x20) through tilde (0x7E), GENERATED from the code-point
  // range rather than hand-listed — a hand-listed alphabet is the set-literal drift this repository
  // deletes on sight, and a silently shortened one would quietly narrow the claim.
  const ESCAPE_ALPHABET: readonly string[] = Array.from(
    { length: 0x7e - 0x20 + 1 },
    (_unused, n) => String.fromCharCode(0x20 + n),
  );

  // The three characters the module resolves, and what each resolves to. Restated by hand on purpose
  // (see above), then asserted equal to the module's exported allowlist.
  const ALLOWLISTED_ESCAPES: ReadonlyMap<string, string> = new Map([
    ['"', '"'],
    [BS, BS],
    ["/", "/"],
  ]);

  // The three positions an escape can occupy relative to the value's content. A property that only
  // swept one position would be a table with more rows.
  const ESCAPE_PLACEMENTS: readonly {
    readonly label: string;
    readonly at: (base: string, seq: string) => string;
  }[] = [
    { label: "leading", at: (b, s) => `${s}${b}` },
    { label: "mid-value", at: (b, s) => b.replace("Grep", `${s}Grep`) },
    { label: "trailing", at: (b, s) => `${b}${s}` },
  ];

  // One ordinary tool list carrying a real scoped grant, so a resolution that silently altered the
  // value would show up as an altered flattened string rather than only as an ok flag.
  const SWEEP_BASE = "Read, Grep, Agent(grugops-installer)";

  it("ESCAPE ALPHABET — refusal is the DEFAULT for every printable ASCII escape, resolution is the enumerated exception", () => {
    // The test and the module must not be able to disagree about what is on the allowlist.
    expect(DQ_ESCAPE_ALLOWLIST.size).toBe(ALLOWLISTED_ESCAPES.size);
    expect(DQ_ESCAPE_ALLOWLIST.size).toBe(3);
    for (const [c, resolvedTo] of ALLOWLISTED_ESCAPES) {
      expect(DQ_ESCAPE_ALLOWLIST.get(c), `allowlist member ${c}`).toBe(
        resolvedTo,
      );
    }
    expect(ESCAPE_ALPHABET.length).toBe(95);
    expect(ESCAPE_ALPHABET[0]).toBe(" ");
    expect(ESCAPE_ALPHABET[ESCAPE_ALPHABET.length - 1]).toBe("~");
    // Every allowlisted character is inside the swept alphabet, or the "resolves" half of the
    // property would be vacuous.
    for (const c of ALLOWLISTED_ESCAPES.keys()) {
      expect(ESCAPE_ALPHABET, `allowlisted ${c} must be swept`).toContain(c);
    }

    let checked = 0;

    // ── SWEEP 1: inside a DOUBLE-QUOTED scalar, both directions of the property. ───────────────
    for (const c of ESCAPE_ALPHABET) {
      const seq = `${BS}${c}`;
      const resolvedTo = ALLOWLISTED_ESCAPES.get(c);
      for (const p of ESCAPE_PLACEMENTS) {
        const where = `double-quoted | escape=\\u{${c.charCodeAt(0).toString(16)}} | ${p.label}`;
        const text = doc([`tools: "${p.at(SWEEP_BASE, seq)}"`]);
        const parsed = parseFrontmatter(text);
        if (resolvedTo === undefined) {
          // NOT on the allowlist: refuse, and name the sequence.
          expect(parsed.ok, where).toBe(false);
          if (parsed.ok) continue;
          expect(parsed.reason, where).toContain("backslash sequence");
          expect(parsed.reason, where).toContain(seq);
          // The load-bearing half, as everywhere else in this suite: NOT the success arms.
          expect(hasSpawnGrant(text), where).not.toEqual({
            ok: true,
            value: false,
          });
          expect(grantedAgentNames(text), where).not.toEqual({
            ok: true,
            value: [],
          });
        } else {
          // ON the allowlist: resolve to exactly the documented character, and change nothing else.
          expect(parsed.ok, where).toBe(true);
          if (!parsed.ok) continue;
          expect(parsed.value.get("tools"), where).toEqual([
            p.at(SWEEP_BASE, resolvedTo),
          ]);
        }
        checked += 1;
      }
    }

    // ── SWEEP 2: the SAME alphabet inside a SINGLE-QUOTED scalar — never refuses. ──────────────
    // In YAML a backslash inside single quotes is a literal backslash; the only escape is the doubled
    // `''`. Refusing here would be a false red on correct content, and this sweep is what stops the
    // next widening from causing one.
    for (const c of ESCAPE_ALPHABET) {
      for (const p of ESCAPE_PLACEMENTS) {
        const where = `single-quoted | escape=\\u{${c.charCodeAt(0).toString(16)}} | ${p.label}`;
        const text = doc([`tools: '${p.at(SWEEP_BASE, `${BS}${c}`)}'`]);
        expect(parseFrontmatter(text).ok, where).toBe(true);
        expect(hasSpawnGrant(text).ok, where).toBe(true);
        checked += 1;
      }
    }

    // ── SWEEP 3: the SAME alphabet inside an UNQUOTED PLAIN scalar — never refuses. ────────────
    // A backslash outside any quoting is literal text too, for the same reason.
    for (const c of ESCAPE_ALPHABET) {
      for (const p of ESCAPE_PLACEMENTS) {
        const where = `plain | escape=\\u{${c.charCodeAt(0).toString(16)}} | ${p.label}`;
        const text = doc([`tools: ${p.at(SWEEP_BASE, `${BS}${c}`)}`]);
        expect(parseFrontmatter(text).ok, where).toBe(true);
        expect(hasSpawnGrant(text).ok, where).toBe(true);
        checked += 1;
      }
    }

    // Derive the set, assert the count: a silently shrunk alphabet, a dropped placement or a deleted
    // sweep fails HERE rather than passing with less coverage.
    expect(checked).toBe(
      ESCAPE_ALPHABET.length * ESCAPE_PLACEMENTS.length * 3,
    );
    expect(checked).toBe(855);
  });

  it("holds identically under the skill form of the key (allowed-tools), across all scalar forms", () => {
    for (const form of FORMS) {
      for (const v of VALUES) {
        const text = form.emit(v.value, "allowed-tools", "  ");
        const grant = hasSpawnGrant(text);
        expect(grant.ok && grant.value, `${form.label} | ${v.label}`).toBe(
          v.grant,
        );
      }
    }
  });

  it("recovers the SAME flattened value for a single-line comma list and for its folded twin", () => {
    const v =
      "Read, Grep, Glob, Edit, Write, Bash, Agent(grugops-installer, grugops-security-nfr)";
    const single = parseFrontmatter(FORMS[0].emit(v, "tools", "  "));
    const folded = parseFrontmatter(FORMS[3].emit(v, "tools", "  "));
    expect(single.ok && folded.ok).toBe(true);
    if (!single.ok || !folded.ok) return;
    expect(single.value.get("tools")).toEqual([v]);
    expect(folded.value.get("tools")).toEqual(single.value.get("tools"));
  });

  // ── The two REPRODUCED bypasses, as individually named cases ──────────────────────────────────
  //
  // Quoted from 27-REVIEW § CR-02 verbatim. They are members of the product above, but a product
  // member is anonymous; a named case is what a future reader greps for when asking "is THAT
  // regression still covered".

  it("CR-02 reproduced bypass A — a folded-scalar grant on a non-coordinator ROLE ADAPTER is a grant", () => {
    const text = [
      "---",
      "name: grugops-qe-e2e",
      'description: "Break the feature."',
      "tools: >-",
      "  Read, Grep, Glob, Edit, Write, Bash, Agent(grugops-installer, grugops-security-nfr)",
      "model: inherit",
      "---",
      "Body.",
      "",
    ].join("\n");
    const grant = hasSpawnGrant(text);
    expect(grant.ok && grant.value).toBe(true);
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["grugops-installer", "grugops-security-nfr"],
    });
  });

  it("CR-02 reproduced bypass B — a folded-scalar grant on a SKILL file is a grant", () => {
    const text = [
      "---",
      "name: grugops",
      'description: "The grugops factory dispatcher."',
      'argument-hint: "<request>"',
      "allowed-tools: >-",
      "  Read, Grep, Glob, Agent(grugops-software-engineer)",
      "---",
      "Body.",
      "",
    ].join("\n");
    const grant = hasSpawnGrant(text);
    expect(grant.ok && grant.value).toBe(true);
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["grugops-software-engineer"],
    });
  });

  // ── The CR-01 REPRODUCED bypass, as individually named cases ──────────────────────────────────
  //
  // Quoted from 27-REVIEW-GAPS § CR-01. They are members of the refused product above, but a product
  // member is anonymous; these are what a future reader greps for.

  it("CR-01 reproduced bypass — an ALIAS grant on a SKILL document is refused, NOT read as no-grant", () => {
    // The review's plant verbatim. Before the fix this returned `{ ok: true, value: false }` and the
    // whole foundation-guards aggregator printed ALL CHECKS PASSED over a mirror carrying it.
    const text = [
      "---",
      "name: grugops-gate",
      "description: Run the grugops PR quality gate.",
      'argument-hint: "<request>"',
      "_tools: &t Read, Write, Bash, Glob, Grep, Agent(grugops-software-engineer)",
      "allowed-tools: *t",
      "---",
      "Body.",
      "",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.reason).toMatch(/anchor or alias/);
    const grant = hasSpawnGrant(text);
    expect(grant.ok).toBe(false);
    expect(grant).not.toEqual({ ok: true, value: false });
    const names = grantedAgentNames(text);
    expect(names.ok).toBe(false);
    expect(names).not.toEqual({ ok: true, value: [] });
  });

  it("CR-01 — a MERGE KEY document lands in the failure arm (refused by KEY_LINE, not by a second branch)", () => {
    // ISOLATING KEY_LINE. `<<:` on its own reaches no reference test at all: `KEY_LINE` requires
    // `[A-Za-z_]` at the key start, so `<` fails it and the line is already unreadable. Asserting the
    // `cannot read` wording is what proves the merge key needs no branch of its own — a later reader
    // adding one would be adding a redundant second path.
    const bare = "---\nname: x\n<<: *base\ntools: Read\n---\nBody.\n";
    const pBare = parseFrontmatter(bare);
    expect(pBare.ok).toBe(false);
    if (pBare.ok) return;
    expect(pBare.reason).toMatch(/cannot read/);
    expect(hasSpawnGrant(bare)).not.toEqual({ ok: true, value: false });

    // And the REALISTIC merge-key document — the anchor block it merges from is what a real author
    // would write — is refused too, one line earlier, by the reference test on the anchor's key line.
    // Either way the document never reaches a verdict, which is the only outcome that matters.
    const full = [
      "---",
      "name: x",
      "_base: &base",
      "  tools: Read, Agent(grugops-installer)",
      "<<: *base",
      "---",
      "Body.",
      "",
    ].join("\n");
    const pFull = parseFrontmatter(full);
    expect(pFull.ok).toBe(false);
    if (pFull.ok) return;
    expect(pFull.reason).toMatch(/anchor or alias/);
    expect(hasSpawnGrant(full)).not.toEqual({ ok: true, value: false });
  });

  it("CR-01 — an ANCHOR on the tools key itself is refused", () => {
    const text = [
      "---",
      "name: x",
      "tools: &t Read, Grep, Agent(grugops-installer)",
      "---",
      "Body.",
      "",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.reason).toMatch(/anchor or alias/);
    expect(hasSpawnGrant(text).ok).toBe(false);
  });

  // ── The two bypasses found by SELF RED-TEAM, before this fix was committed ────────────────────
  //
  // A green suite is not proof for a safety invariant, so the first draft of the refusal was attacked
  // directly with eighteen hand-built probes rather than declared done. Two of them walked straight
  // through it, in both cases because a hand-chosen character set was narrower than the grammar it
  // claimed to cover. Both are pinned here BY NAME, because the class — "the predicate's alphabet
  // disagrees with YAML's" — is what would generate the third one.

  it("CR-01 red-team — an anchor NAME outside [A-Za-z0-9_-] is still an anchor and is still refused", () => {
    // YAML 1.2: an anchor name is `ns-anchor-char+`, i.e. any non-space character except the flow
    // indicators. The first draft matched `[A-Za-z0-9_-]` after the sigil, so every one of these
    // parsed clean and returned `{ ok: true, value: false }` on a document that grants spawn.
    for (const anchor of [".t", "@t", "a/b", "ét", "t.x", "1", "$t", "t+x"]) {
      const text = [
        "---",
        "name: x",
        `_t: &${anchor} Read, Grep, Agent(grugops-installer)`,
        `tools: *${anchor}`,
        "---",
        "Body.",
        "",
      ].join("\n");
      const grant = hasSpawnGrant(text);
      expect(grant.ok, anchor).toBe(false);
      expect(grant, anchor).not.toEqual({ ok: true, value: false });
    }
  });

  it("CR-01 red-team — an alias at the start of a NESTED flow collection is refused at any depth", () => {
    // No comma precedes the alias in `[[*t]]`, so a comma-only flow split missed it entirely and the
    // document parsed clean. Splitting on every flow delimiter closes it without tracking depth.
    for (const value of [
      "[[*t]]",
      "[Read, [*t]]",
      "[[[*t]]]",
      "{a: {b: *t}}",
      "[{a: *t}]",
    ]) {
      const text = `---\nname: x\ntools: ${value}\n---\nBody.\n`;
      const grant = hasSpawnGrant(text);
      expect(grant.ok, value).toBe(false);
      expect(grant, value).not.toEqual({ ok: true, value: false });
    }
    // And the same nesting WITHOUT a reference still parses — the split did not turn every flow
    // collection into a refusal.
    const clean = `---\nname: x\ntools: [Read, [Grep, Glob]]\n---\nBody.\n`;
    expect(hasSpawnGrant(clean)).toEqual({ ok: true, value: false });
  });

  // ── The refusal stays NARROW, pinned in the other direction (SPAWN-04 adjacency edge) ─────────
  //
  // A refusal that fired on any `&` or `*` anywhere would be a false red on correct documentation, and
  // a guard that fails on correct documentation teaches the next author to delete the documentation.
  // Only a sigil at a NODE START — position 0 of a value, a flow item or a sequence item — is a
  // reference. These two cases are what keeps that boundary from drifting wider.

  it("CR-01 narrow — sigils ADJACENT to word characters are ordinary text, not references", () => {
    const text = [
      "---",
      "name: grugops-factory-coach",
      "description: The R&D lane. Reads, *writes* nothing, and a bare * between words is fine.",
      "tools: Read, Grep",
      "---",
      "Body.",
      "",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(true);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    expect(grantedAgentNames(text)).toEqual({ ok: true, value: [] });
    // And the same document with a real grant still reads as a grant — the refusal did not swallow it.
    const granting = text.replace(
      "tools: Read, Grep",
      "tools: Read, Agent(grugops-installer)",
    );
    expect(hasSpawnGrant(granting)).toEqual({ ok: true, value: true });
  });

  it("CR-01 narrow — a sigil inside a BLOCK SCALAR is literal text and is deliberately NOT refused", () => {
    // YAML gives `&` and `*` no reference meaning inside a `|` or `>` scalar: those bytes are content.
    // The platform reads them literally, so this module must too. Refusing here would be a false red,
    // and the value it flattens to carries no spawn token, so no-grant is the honest verdict.
    const folded = [
      "---",
      "name: x",
      "description: >",
      "  *alias-looking text that is really just prose",
      "  and &anchor-looking text on the next line too",
      "tools: Read, Grep",
      "---",
      "Body.",
      "",
    ].join("\n");
    expect(parseFrontmatter(folded).ok).toBe(true);
    expect(hasSpawnGrant(folded)).toEqual({ ok: true, value: false });

    const literal = [
      "---",
      "name: x",
      "tools: |",
      "  *t",
      "---",
      "Body.",
      "",
    ].join("\n");
    const parsed = parseFrontmatter(literal);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.get("tools")).toEqual(["*t"]);
    expect(hasSpawnGrant(literal)).toEqual({ ok: true, value: false });
  });

  // ── The three ADJACENT empty states print differently (SPAWN-04 empty edge) ───────────────────

  it("CR-01 empty edge — absent tools key, empty tools value and an all-alias tools value are THREE distinct results", () => {
    const absent = "---\nname: x\nmodel: inherit\n---\nBody.\n";
    const empty = "---\nname: x\ntools:\nmodel: inherit\n---\nBody.\n";
    const alias = "---\nname: x\n_t: &t Read, Agent(grugops-installer)\ntools: *t\n---\nBody.\n";

    // 1. Absent: a legitimate document with no grant, and no `tools` key in the map at all.
    const pAbsent = parseFrontmatter(absent);
    expect(pAbsent.ok && pAbsent.value.has("tools")).toBe(false);
    expect(hasSpawnGrant(absent)).toEqual({ ok: true, value: false });

    // 2. Empty value: also no grant, but the key IS present carrying the empty string. "No grant"
    //    and "no key" are different facts about the file and the map keeps them apart.
    const pEmpty = parseFrontmatter(empty);
    expect(pEmpty.ok && pEmpty.value.get("tools")).toEqual([""]);
    expect(hasSpawnGrant(empty)).toEqual({ ok: true, value: false });

    // 3. All-alias value: NOT a verdict at all. This is the one that used to print the same thing as
    //    the other two, which is the whole CR-01 defect.
    const pAlias = parseFrontmatter(alias);
    expect(pAlias.ok).toBe(false);
    expect(hasSpawnGrant(alias).ok).toBe(false);

    // Stated as an identity, so no two of the three can ever collapse into the same printed result.
    const results = [
      JSON.stringify(hasSpawnGrant(absent)),
      JSON.stringify({ present: pEmpty.ok && pEmpty.value.has("tools") }),
      JSON.stringify(hasSpawnGrant(alias)),
    ];
    expect(new Set(results).size).toBe(3);
  });

  // ── The refusal is decided by POSITION, not by where in the block the offender sits ───────────

  it("CR-01 ordering edge — moving the anchor within the block changes neither the verdict nor the reason category", () => {
    const first = [
      "---",
      "_t: &t Read, Agent(grugops-installer)",
      "name: x",
      "tools: *t",
      "---",
      "Body.",
      "",
    ].join("\n");
    const last = [
      "---",
      "name: x",
      "model: inherit",
      "_t: &t Read, Agent(grugops-installer)",
      "tools: *t",
      "---",
      "Body.",
      "",
    ].join("\n");
    for (const text of [first, last]) {
      const parsed = parseFrontmatter(text);
      expect(parsed.ok).toBe(false);
      if (parsed.ok) continue;
      expect(parsed.reason).toMatch(/anchor or alias/);
    }
    // And the enumeration contract is unaffected on documents that DO parse: de-duplicated and sorted
    // regardless of the order the names were written in.
    const shuffled =
      "---\nname: x\ntools: Agent(grugops-qe-e2e, grugops-installer, grugops-qe-e2e)\n---\nBody.\n";
    expect(grantedAgentNames(shuffled)).toEqual({
      ok: true,
      value: ["grugops-installer", "grugops-qe-e2e"],
    });
  });

  // ── A parse failure is a PARSE ARTIFACT, never a verdict ──────────────────────────────────────

  it("an UNTERMINATED frontmatter block returns the parse-failure arm — and is NOT a no-grant success", () => {
    const text = "---\nname: x\ntools: Read, Grep\nBody with no closing delimiter.\n";
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.reason).toMatch(/never closed/);

    // The load-bearing half of this case: the failure must not be mistakable for "no grant found".
    // A consumer that read the two the same way is exactly how the CR-02 class of bypass survives.
    const grant = hasSpawnGrant(text);
    expect(grant.ok).toBe(false);
    expect(grant).not.toEqual({ ok: true, value: false });
    const names = grantedAgentNames(text);
    expect(names.ok).toBe(false);
    expect(names).not.toEqual({ ok: true, value: [] });
    const marker = frontmatterValueIs(text, "coordinator", "true");
    expect(marker.ok).toBe(false);
    expect(marker).not.toEqual({ ok: true, value: false });
  });

  it("a line inside the block that is neither a key nor a continuation returns the parse-failure arm", () => {
    const text = "---\nname: x\nthis line has no colon at all\n---\nBody.\n";
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.reason).toMatch(/cannot read/);
  });

  it("a document with NO frontmatter block at all SUCCEEDS with no keys — a legitimate state, not a failure", () => {
    const parsed = parseFrontmatter("# Heading\n\nJust body prose.\n");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.size).toBe(0);
    expect(hasSpawnGrant("# Heading\n\nAgent(grugops-x) named in prose.\n")).toEqual({
      ok: true,
      value: false,
    });
  });

  // ── Key scoping, pinned in BOTH directions ────────────────────────────────────────────────────

  it("a scoped spawn grant inside a DESCRIPTION value — even as a folded scalar — is NOT a grant", () => {
    const text = [
      "---",
      "name: grugops-factory-coach",
      "description: >-",
      "  Coaches the factory. It never uses Agent(grugops-qe-e2e); this sentence",
      "  merely names the spawn tool and is documentation, not a grant.",
      "tools: Read, Grep",
      "---",
      "Body.",
      "",
    ].join("\n");
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    expect(grantedAgentNames(text)).toEqual({ ok: true, value: [] });
  });

  it("a grant hidden under a DIFFERENTLY NAMED key is not smuggled in as one", () => {
    const text = "---\nname: x\nmy-tools: Read, Agent(grugops-installer)\n---\nBody.\n";
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
  });

  it("a dashed BODY BULLET naming the spawn tool is prose, not a grant (the deliberate narrowing)", () => {
    const text = [
      "---",
      "name: x",
      "tools: Read, Grep",
      "---",
      "How the coordinator works:",
      "",
      "- Agent(grugops-qe-e2e) is what the coordinator holds, not this role.",
      "- Task delegation is described here in prose.",
      "",
    ].join("\n");
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    // The old array expression matched a dashed line ANYWHERE in the file, so this correct
    // documentation used to fail the guard. Removing that false positive is deliberate: a guard that
    // fails on correct text teaches authors to delete the text.
    expect(grantedAgentNames(text)).toEqual({ ok: true, value: [] });
  });

  // ── The fence authority runs FIRST ────────────────────────────────────────────────────────────

  it("frontmatter shown only INSIDE a fenced code block is documentation — no grant", () => {
    const text = [
      "# Template",
      "",
      "```markdown",
      "---",
      "name: grugops-orchestrator",
      "coordinator: true",
      "tools: Agent(grugops-software-engineer), Read",
      "---",
      "```",
      "",
    ].join("\n");
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    expect(frontmatterValueIs(text, "coordinator", "true")).toEqual({
      ok: true,
      value: false,
    });
  });

  it("a FENCED `---` cannot close a real unterminated block — the fence strip runs before the block scan", () => {
    // This is the case that DISCRIMINATES: a fence-blind reader would take the `---` inside the
    // fenced example as the closing delimiter of the real (unterminated) block, parse the fenced
    // example's lines as frontmatter, and report a grant that is documentation. Fence-aware, the real
    // block is unterminated and the result is the parse-failure arm — the guard goes red and a human
    // decides, which is the correct outcome for a malformed file.
    const text = [
      "---",
      "name: x",
      "tools: Read",
      "",
      "```markdown",
      "tools: Agent(grugops-not-a-real-role)",
      "---",
      "```",
      "",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    expect(hasSpawnGrant(text).ok).toBe(false);
    // And the fence helper itself is the one authority both halves read through.
    expect(stripFencedBlocks(text)).not.toContain("grugops-not-a-real-role");
  });

  // ── Duplicate keys ────────────────────────────────────────────────────────────────────────────

  it("two tools keys: NEITHER wins — every occurrence is retained and the grant test reads all of them", () => {
    // The deterministic policy, stated: the flattened values are kept in DOCUMENT ORDER as a list,
    // and the grant predicate tests all of them. Picking one would mean silently discarding the
    // other, and a discarded `tools:` line carrying a grant is precisely a bypass. Retaining all is
    // the only fail-safe reading, and it is deterministic because document order is.
    const text = [
      "---",
      "name: x",
      "tools: Read, Grep",
      "model: inherit",
      "tools: Agent(grugops-installer)",
      "---",
      "Body.",
      "",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.get("tools")).toEqual([
      "Read, Grep",
      "Agent(grugops-installer)",
    ]);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["grugops-installer"],
    });
  });

  // ── The coordinator marker, read through the SAME parser as the grant ─────────────────────────

  it("the coordinator marker is recovered from every scalar form it can legitimately take", () => {
    const forms = [
      "coordinator: true",
      'coordinator: "true"',
      "coordinator: 'true'",
      "coordinator: >-\n  true",
      "coordinator: |-\n  true",
      "coordinator: true   # the one designated coordinator",
    ];
    for (const f of forms) {
      const text = `---\nname: x\n${f}\ntools: Read, Agent(grugops-installer)\n---\nBody.\n`;
      expect(frontmatterValueIs(text, "coordinator", "true"), f).toEqual({
        ok: true,
        value: true,
      });
    }
    // And a file WITHOUT the marker is not promoted into the coordinator set by a near-miss value.
    const notMarked =
      "---\nname: x\ncoordinator: false\ntools: Read\n---\nBody.\n";
    expect(frontmatterValueIs(notMarked, "coordinator", "true")).toEqual({
      ok: true,
      value: false,
    });
  });

  // ── Comments ──────────────────────────────────────────────────────────────────────────────────

  it("a trailing unquoted comment is dropped, and a hash INSIDE quotes is kept", () => {
    const dropped = parseFrontmatter(
      "---\ntools: Read, Grep   # not part of the value\n---\n",
    );
    expect(dropped.ok && dropped.value.get("tools")).toEqual(["Read, Grep"]);
    const kept = parseFrontmatter(
      '---\ndescription: "a # inside quotes is content"\n---\n',
    );
    expect(kept.ok && kept.value.get("description")).toEqual([
      "a # inside quotes is content",
    ]);
    // A hash with no preceding whitespace is not a comment introducer.
    const inline = parseFrontmatter("---\ntools: Agent(a#b), Read\n---\n");
    expect(inline.ok && inline.value.get("tools")).toEqual([
      "Agent(a#b), Read",
    ]);
  });

  // ── CRLF ──────────────────────────────────────────────────────────────────────────────────────

  it("a CRLF checkout parses identically to an LF one (Windows portability)", () => {
    const lf =
      "---\nname: x\ntools: >-\n  Read, Agent(grugops-installer)\n---\nBody.\n";
    const crlf = lf.replace(/\n/g, "\r\n");
    expect(hasSpawnGrant(crlf)).toEqual(hasSpawnGrant(lf));
    expect(grantedAgentNames(crlf)).toEqual(grantedAgentNames(lf));
  });
});
