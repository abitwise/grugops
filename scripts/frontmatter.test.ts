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
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  parseFrontmatter,
  hasSpawnGrant,
  keysHaveSpawnGrant,
  grantedAgentNames,
  frontmatterValueIs,
  stripFencedBlocks,
  stripComment,
  DQ_ESCAPE_ALLOWLIST,
  ENUMERATION_LEGAL_CHARS,
  TOOLS_KEYS,
} from "./frontmatter.js";
// (Plan 27-33) The false-red control's corpus is THE ONE SPAWN-GRANT SCAN COMPOSITION the guard reads
// — not a directory list restated here. A hand-listed set at this call site would be the guard's scan
// answered a second time, which is the class D-28, D-37 and D-40 each collapsed once inside this phase
// and the class CR-03 itself belongs to.
import {
  listAgentAdapters,
  spawnGrantScan,
  SPAWN_GRANT_SCAN_COUNT,
  SPAWN_GRANT_SCAN_PARTS,
} from "./kit-model.js";

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
  // (D-48 — 27-REVIEW-GAPS-6 § WR-01, round 6) THE PLAIN-CONTINUATION ROW THAT USED TO SIT HERE HAS
  // MOVED, NOT BEEN DELETED. It asserted that an alias sigil arriving on a plain CONTINUATION line is
  // refused. Measured against a real YAML 1.2 loader (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1),
  // `tools: Read, Grep,` / `  *t` loads to the plain string `Read, Grep, *t` — the `*t` is TEXT,
  // because a continuation line is not a node start and no alias is resolved there. The refusal was
  // therefore a FALSE RED on a document the platform reads as carrying no grant, which is WR-01
  // itself. It now lives in `WR01_FALSE_RED_FORMS` below, asserted in the OPPOSITE direction with its
  // loader transcript, so the coverage is inverted rather than lost. The genuine node starts — an
  // alias on a KEY LINE (which libyaml RESOLVES to the granting value) and an anchor on a
  // BLOCK-SEQUENCE ITEM — are untouched above and still refuse.

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
  // (D-48) The TAG axis's PLAIN-CONTINUATION row has moved to `WR01_FALSE_RED_FORMS` for the same
  // measured reason as the alias row above: libyaml loads `tools: Read, Grep,` / `  !!str *t` to the
  // plain string `Read, Grep, !!str *t`. A tag is a node PROPERTY and a continuation line is not a
  // node, so there is no tag there to leave unresolved. Inverted, not dropped.
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

// (D-48 — 27-REVIEW-GAPS-6 § WR-01, round 6) THE TWO ROWS THAT MOVED OUT OF `REFUSED_FORMS`, KEPT AS
// A CONTROL IN THE OPPOSITE DIRECTION.
//
// Each of these was a shipped assertion that a reference sigil arriving on a PLAIN CONTINUATION line
// is refused. A real YAML 1.2 loader says otherwise, and the transcript is recorded beside each row:
// a continuation line is not a node start, so the sigil there is ordinary text and the document
// carries no grant. Refusing it was a red gate over correct documentation — WR-01 — whose only cure
// is deleting the documentation, which D-34 records as the worse of the two directions.
//
// THEY ARE INVERTED RATHER THAN DELETED, ON THIS FILE'S OWN RULE. A refusal claim that shrinks
// silently is exactly what the moving table-size floor exists to prevent, so the rows keep asserting
// something: that the module now agrees with the loader BYTE FOR BYTE, and that it lands on the
// no-grant SUCCESS arm rather than on either the refusal arm or a granted verdict.
const WR01_FALSE_RED_FORMS: readonly {
  readonly label: string;
  readonly lines: readonly string[];
  readonly loaderValue: string;
}[] = [
  {
    label:
      "an alias sigil arriving on a plain continuation line of a wrapped value",
    lines: ["tools: Read, Grep,", "  *t"],
    // /usr/bin/ruby -ryaml => {"tools"=>"Read, Grep, *t"}
    loaderValue: "Read, Grep, *t",
  },
  {
    label:
      "TAG axis / PLAIN-CONTINUATION — a tagged alias arriving on a plain continuation line",
    lines: ["tools: Read, Grep,", "  !!str *t"],
    // /usr/bin/ruby -ryaml => {"tools"=>"Read, Grep, !!str *t"}
    loaderValue: "Read, Grep, !!str *t",
  },
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
    //
    // (Plan 27-39 / D-48) AND DOWN, 35 -> 33, for the two PLAIN-CONTINUATION rows that a real YAML
    // 1.2 loader proved were FALSE REDS. The floor tracks the table in BOTH directions or it is not
    // a floor: leaving it at 35 would make this edit fail for the right reason but with the wrong
    // message, and raising the remaining rows to meet it would be padding. The two rows did not
    // vanish — `WR01_FALSE_RED_FORMS` asserts them in the opposite direction with its own floor
    // below, so the total number of pinned plain-continuation constructs is unchanged at two.
    expect(REFUSED_FORMS.length).toBeGreaterThanOrEqual(33);
    expect(new Set(REFUSED_FORMS.map((f) => f.label)).size).toBe(
      REFUSED_FORMS.length,
    );
    // The inverted rows carry a floor of their own, so they cannot be quietly dropped either.
    expect(WR01_FALSE_RED_FORMS.length).toBeGreaterThanOrEqual(2);
    expect(new Set(WR01_FALSE_RED_FORMS.map((f) => f.label)).size).toBe(
      WR01_FALSE_RED_FORMS.length,
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
    // (Plan 27-39 / D-48) Lowered 420 -> 396 with the two loader-disproven plain-continuation rows.
    expect(checked).toBe(REFUSED_FORMS.length * INDENTS.length * VALUES.length);
    expect(checked).toBeGreaterThanOrEqual(396);
  });

  // ── The two rows that moved, asserted in the OPPOSITE direction (D-48 / WR-01) ─────────────────

  it("WR-01 — a reference sigil on a PLAIN CONTINUATION line is content, and the module now agrees with the loader byte for byte", () => {
    for (const form of WR01_FALSE_RED_FORMS) {
      const text = doc([...form.lines]);
      const parsed = parseFrontmatter(text);
      // Direction one: the refusal is GONE. A red gate here can only be cured by deleting correct
      // documentation, which is how a guard teaches the next author to weaken it.
      expect(
        parsed.ok,
        `${form.label}: expected the success arm, got: ${parsed.ok ? "" : parsed.reason}`,
      ).toBe(true);
      // Direction two: it did not become a GRANT either. The value is exactly what libyaml computes,
      // so the module's reading and the platform's reading are the same string — the only definition
      // of "correct" this module has.
      expect(parsed.ok && parsed.value.get("tools"), form.label).toEqual([
        form.loaderValue,
      ]);
      expect(hasSpawnGrant(text), form.label).toEqual({
        ok: true,
        value: false,
      });
    }
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

  // ── WR-02 / D-41 item 3 — the grant enumeration this module cannot vouch for ───────────────────
  //
  // These sit beside the escape-refusal sweep above because they are the same argument one level
  // down: a value this module reads WRONG must reach the caller as a parse artifact, never as a
  // shorter or altered success. `keysGrantedAgentNames`'s doc block has promised since D-32 that a
  // name is never silently dropped or altered; measured against the committed parser before this
  // edit, it did both.

  it("D-41 item 3 — a grant enumeration carrying a NESTED PARENTHESIS refuses instead of returning a name list short (WR-02, reproduced; now through the ONE allowlist)", () => {
    // RED, measured against the committed .js before the D-41 edit:
    //   {"ok":true,"value":["Task(beta","alpha"]}  —  `gamma` DROPPED, `Task(beta` invented.
    // SCOPED_GRANT's character class stops at the first `)`, so the capture truncates mid-enumeration.
    //
    // (D-47 item 2) This still refuses, but no longer through a check that names a parenthesis. `(`
    // is simply outside ENUMERATION_LEGAL_CHARS. The assertions below moved from the deleted check's
    // wording to the allowlist refusal's wording FOR THAT REASON — a case still asserting
    // "nested opening parenthesis" would be pinning a predicate that no longer exists.
    const text = "---\nname: x\ntools: Agent(alpha, Task(beta), gamma)\n---\nBody.\n";
    const names = grantedAgentNames(text);
    expect(names.ok).toBe(false);
    if (names.ok) return;
    expect(names.reason).toContain("`(` (U+0028)");
    expect(names.reason).toContain(
      "outside the legal character set of a grant enumeration",
    );
    // The module's established closing clause, kept verbatim so this refusal reads as the same
    // argument the escape refusal already makes.
    expect(names.reason).toContain("a name is never silently dropped or altered");
    // The arm that would have been taken before the fix.
    expect(names).not.toEqual({ ok: true, value: ["Task(beta", "alpha"] });

    // The grant itself is still a grant — only the ENUMERATION is unreadable, and this file is still
    // a rogue spawner if it is not the coordinator.
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
  });

  it("D-41 item 3 — a grant enumeration carrying a QUOTE refuses instead of returning altered names (WR-02, reproduced; now through the ONE allowlist)", () => {
    // RED, measured against the committed .js before the D-41 edit:
    //   {"ok":true,"value":["\"alpha","beta\"","gamma"]}  —  ONE name split into TWO altered ones.
    // A comma inside a quoted scalar is content, not a separator.
    //
    // (D-47 item 2) Both quote characters are outside ENUMERATION_LEGAL_CHARS, so both still refuse
    // — through the one allowlist rather than through a dedicated quote check.
    const dq = '---\nname: x\ntools: Agent("alpha, beta", gamma)\n---\nBody.\n';
    const sq = "---\nname: x\ntools: Agent('alpha, beta', gamma)\n---\nBody.\n";
    const expectedLabel = new Map([
      [dq, '`"` (U+0022)'],
      [sq, "`'` (U+0027)"],
    ]);
    for (const text of [dq, sq]) {
      const names = grantedAgentNames(text);
      expect(names.ok, text).toBe(false);
      if (names.ok) continue;
      expect(names.reason, text).toContain(expectedLabel.get(text));
      expect(names.reason, text).toContain(
        "the comma is not reliably the separator the document expresses",
      );
      expect(names.reason, text).toContain(
        "a name is never silently dropped or altered",
      );
    }
    expect(grantedAgentNames(dq)).not.toEqual({
      ok: true,
      value: ['"alpha', 'beta"', "gamma"],
    });
  });

  // ── D-47 item 2 / round-5 IN-04 — the flow-collection residual, and the ONE allowlist ──────────
  //
  // Round 4 closed a nested parenthesis and a quote by naming them. Those two checks were a DENYLIST:
  // the complement was assumed safe, and it was not. These cases pin the promote to a stated legal
  // set. Every input below returned the SUCCESS arm against the committed .js before this edit; the
  // measured values are recorded per row so a future reader can see what was actually returned rather
  // than being told it was wrong.

  it("D-47 item 2 — a FLOW-COLLECTION DELIMITER inside an enumeration refuses instead of returning SPLIT, ALTERED names (IN-04, reproduced)", () => {
    const rows: ReadonlyArray<{
      tools: string;
      redValue: string[];
      char: string;
      label: string;
    }> = [
      {
        tools: "Agent(alpha[,]b, gamma)",
        redValue: ["]b", "alpha[", "gamma"],
        char: "[",
        label: "U+005B",
      },
      {
        tools: "Agent(alpha{,}b, gamma)",
        redValue: ["alpha{", "gamma", "}b"],
        char: "{",
        label: "U+007B",
      },
    ];

    for (const row of rows) {
      const text = `---\nname: x\ntools: ${row.tools}\n---\nBody.\n`;
      const names = grantedAgentNames(text);

      // The arm this returned before the fix: THREE names where the document expresses two, one of
      // them invented and the document's own name lost.
      expect(names, row.tools).not.toEqual({ ok: true, value: row.redValue });

      expect(names.ok, row.tools).toBe(false);
      if (names.ok) continue;
      expect(names.reason, row.tools).toContain(
        `\`${row.char}\` (${row.label})`,
      );
      expect(names.reason, row.tools).toContain(
        "outside the legal character set of a grant enumeration",
      );
      expect(names.reason, row.tools).toContain(
        "a name is never silently dropped or altered",
      );

      // The grant is still a grant — only the ENUMERATION is unreadable.
      expect(hasSpawnGrant(text), row.tools).toEqual({ ok: true, value: true });
    }
  });

  it("D-47 item 2 — four characters NO FINDING NAMED refuse too, which is the whole point of stating the legal set", () => {
    // Measured against the committed .js before this edit, each returned the SUCCESS arm carrying a
    // name no loader computes:
    //   Agent(alpha:b, gamma) -> ["alpha:b","gamma"]   Agent(alpha|b, gamma) -> ["alpha|b","gamma"]
    //   Agent(&alpha, gamma)  -> ["&alpha","gamma"]    Agent(*alpha, gamma)  -> ["*alpha","gamma"]
    // A denylist would have needed four more members. The allowlist needed none.
    const rows: ReadonlyArray<[string, string, string, string[]]> = [
      ["Agent(alpha:b, gamma)", ":", "U+003A", ["alpha:b", "gamma"]],
      ["Agent(alpha|b, gamma)", "|", "U+007C", ["alpha|b", "gamma"]],
      ["Agent(&alpha, gamma)", "&", "U+0026", ["&alpha", "gamma"]],
      ["Agent(*alpha, gamma)", "*", "U+002A", ["*alpha", "gamma"]],
    ];
    for (const [tools, char, label, redValue] of rows) {
      const text = `---\nname: x\ntools: ${tools}\n---\nBody.\n`;
      const names = grantedAgentNames(text);
      expect(names, tools).not.toEqual({ ok: true, value: redValue });
      expect(names.ok, tools).toBe(false);
      if (names.ok) continue;
      expect(names.reason, tools).toContain(`\`${char}\` (${label})`);
    }
  });

  it("D-47 item 2 — the escape branch's UNREACHABILITY is asserted against the constant, not claimed in a comment", () => {
    // `keysGrantedAgentNames` keeps an `unquoteChecked` escape refusal beneath the comma split, with
    // a note saying it cannot be reached through that function. The note's argument is exactly this:
    // reaching it requires a backslash inside a double-quoted region, so the enumeration must carry
    // at least one of `"`, `'` or `\` — and none of those three is a member of the legal set, so the
    // allowlist refuses first.
    //
    // THIS IS THE ASSERTION THAT MAKES THE NOTE TRUE. A comment claiming a property is not the
    // property; if a future author adds any of these three to the legal set, this case fails and the
    // note is corrected rather than silently becoming false.
    for (const c of ['"', "'", "\\"]) {
      const cp = `U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;
      expect(
        ENUMERATION_LEGAL_CHARS.has(c),
        `${c} (${cp}) must be OUTSIDE the legal set for the escape branch's unreachability note to be true`,
      ).toBe(false);
    }

    // And the domination is observable END TO END. Each of the two carriers that could otherwise
    // reach the escape refusal is refused by the ALLOWLIST instead, naming the character and its code
    // point rather than an escape sequence.
    //
    //   `Agent("al\\x41pha", gamma)` — a DOUBLED backslash is on DQ_ESCAPE_ALLOWLIST, so the value
    //   survives the flattener and reaches the enumeration, where the QUOTE refuses it.
    //   `Agent(alpha\b, gamma)` — outside quotes a backslash is literal YAML text, so nothing upstream
    //   touches it and the BACKSLASH itself refuses at the enumeration.
    const dominated: ReadonlyArray<[string, string]> = [
      ['Agent("al\\\\x41pha", gamma)', '`"` (U+0022)'],
      ["Agent(alpha\\b, gamma)", "`\\` (U+005C)"],
    ];
    for (const [tools, expected] of dominated) {
      const names = grantedAgentNames(`---\nname: x\ntools: ${tools}\n---\nBody.\n`);
      expect(names.ok, tools).toBe(false);
      if (names.ok) continue;
      expect(names.reason, tools).toContain(expected);
      // Not the escape refusal's wording — that branch was not the one that fired.
      expect(names.reason, tools).not.toContain("backslash sequence");
    }

    // THE THIRD PATH, RECORDED RATHER THAN GLOSSED. A NON-allowlisted escape inside a double-quoted
    // region (`\x`) never reaches `keysGrantedAgentNames` at all: the D-30 escape decision is applied
    // at EVERY application point, so the value flattener refuses it first, and the reason names the
    // sequence. So the in-function escape branch is dominated TWICE — upstream by the flattener for a
    // non-allowlisted escape, and here by the allowlist for the quote or backslash that carries it.
    // Discovered by this case failing on its first draft, which asserted the allowlist fired for this
    // input too; the assertion was corrected to the measured behaviour rather than the assumed one.
    const upstream = grantedAgentNames(
      '---\nname: x\ntools: Agent("al\\x41pha", gamma)\n---\nBody.\n',
    );
    expect(upstream.ok).toBe(false);
    if (upstream.ok) return;
    expect(upstream.reason).toContain("backslash sequence `\\x`");
  });

  it("D-41 item 3 false-red control — the REAL coordinator's own enumeration still returns the success arm, by count and by membership", () => {
    // The enumerated grant the live coordinator ships. If the refusal above were even slightly too
    // broad this is the file it would break, and it is the file whose grant closure the KIT-03 oracle
    // and coordinator-resolution-precheck both compute set equality over.
    //
    // THE MEASURED CARDINALITY IS 16, NOT 17. Plan 27-33 called it "the seventeen-name grant"; the
    // live file grants the seventeen agent adapters MINUS THE COORDINATOR ITSELF, because a
    // coordinator does not spawn a second copy of itself. The membership assertion below states that
    // rule rather than restating a number, so the count follows from the rule instead of being a
    // magic literal that the next adapter added would silently falsify.
    const root = join(import.meta.dirname, "..");
    const coordinator = readFileSync(
      join(root, ".claude/agents/grugops-orchestrator.md"),
      "utf8",
    );
    const names = grantedAgentNames(coordinator);
    expect(names.ok).toBe(true);
    if (!names.ok) return;
    const expectedClosure = listAgentAdapters(root)
      .map((rel) => rel.replace(/\.md$/, ""))
      .filter((n) => n !== "grugops-orchestrator")
      .sort();
    expect(names.value).toEqual(expectedClosure);
    expect(names.value.length).toBe(16);
    expect(names.value).toContain("grugops-software-engineer");
    expect(names.value).toEqual([...names.value].sort());

    // Every ordinary enumeration the generator actually emits still succeeds, de-duplicated + sorted.
    const ordinary =
      "---\nname: x\ntools: Read, Agent(grugops-qe-e2e, grugops-installer, grugops-qe-e2e), Bash\n---\n";
    expect(grantedAgentNames(ordinary)).toEqual({
      ok: true,
      value: ["grugops-installer", "grugops-qe-e2e"],
    });

    // An UNSCOPED grant still enumerates nothing and still returns the SUCCESS arm with an empty
    // list — that is a real fact about the grant, and the KIT-03 oracle names a zero-length closure
    // as its own failure rather than treating it as a parse artifact.
    const unscoped = "---\nname: x\ntools: Read, Agent\n---\n";
    expect(grantedAgentNames(unscoped)).toEqual({ ok: true, value: [] });
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

  // ── D-34 / IN-02: the YAML DIRECTIVE PROLOGUE, the same silent-success shape one level UP ───────
  //
  // Everything in the CR-01 family above is about a VALUE inside the block. This one is about whether
  // there IS a block: a legal `%TAG` / `%YAML` directive before the opening delimiter made the first
  // non-blank line something other than `---`, so the document took the legitimately-keyless SUCCESS
  // arm and returned a result byte-identical to a body-only file — on a document whose `tools` value
  // is plainly a grant. Measured against the committed parser before the fix: `{"ok":true,
  // "value":false}` (27-REVIEW-GAPS-3 § IN-02, plan 27-30).
  //
  // The reviewer's `UNKNOWN - verify` rides along: the platform most likely sees no frontmatter here
  // either, so the file is probably inert rather than rogue. These cases pin the module's CONTRACT —
  // an undecodable prologue belongs in the unreadable arm — not a reproduced live bypass.

  it("D-34 — a %TAG directive before the opening delimiter is REFUSED by name, not read as no-frontmatter (IN-02, reproduced)", () => {
    // The reviewer's verified reproduction string, verbatim.
    const text = "%TAG !e! tag:x,2000:\n---\nname: x\ntools: Read, Agent(o)\n---\n";

    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    // The reason NAMES the offending line rather than gesturing at the document.
    expect(parsed.reason).toContain("%TAG !e! tag:x,2000:");
    expect(parsed.reason).toMatch(/YAML directive line/);

    // The load-bearing half: the document's tools value IS a grant, so the failure arm must be
    // reached instead of the value-false success arm. These two assertions are what would have
    // failed before the fix.
    const grant = hasSpawnGrant(text);
    expect(grant.ok).toBe(false);
    expect(grant).not.toEqual({ ok: true, value: false });
    const names = grantedAgentNames(text);
    expect(names.ok).toBe(false);
    expect(names).not.toEqual({ ok: true, value: [] });
  });

  it("D-34 — the refusal is POSITIONAL and takes no lookahead: %YAML, a two-directive prologue and a directive with no block all refuse", () => {
    // One directive, the other legal spelling.
    const yaml12 = "%YAML 1.2\n---\nname: x\ntools: Read, Agent(o)\n---\n";
    // TWO directives — the shape a "next line must be `---`" test would have missed, which is why
    // the test consults nothing after the directive. This is the round-5 spelling, closed in advance.
    const twoDirectives =
      "%YAML 1.2\n%TAG !e! tag:x,2000:\n---\nname: x\ntools: Read, Agent(o)\n---\n";
    // A directive and no block at all: still a document declaring a processing context we do not
    // implement, so still refused. No lookahead means no exception here either.
    const noBlock = "%YAML 1.2\nJust body prose.\n";
    // Leading blank lines are skipped before the test, exactly as they are before the delimiter test.
    const afterBlanks = "\n\n%TAG !e! tag:x,2000:\n---\nname: x\ntools: Read, Agent(o)\n---\n";

    for (const text of [yaml12, twoDirectives, noBlock, afterBlanks]) {
      const parsed = parseFrontmatter(text);
      expect(parsed.ok).toBe(false);
      if (parsed.ok) continue;
      expect(parsed.reason).toMatch(/YAML directive line/);
    }
  });

  it("D-34 false-red control — the genuinely-keyless arm is UNTOUCHED: a body-only file, an indented percent line and a percent MID-line all still succeed", () => {
    // 1. The arm the refusal must not swallow. A body-only file is a legitimate state.
    const bodyOnly = "# Heading\n\nJust body prose.\n";
    const pBody = parseFrontmatter(bodyOnly);
    expect(pBody.ok).toBe(true);
    if (pBody.ok) expect(pBody.value.size).toBe(0);

    // 2. YAML gives `%` directive meaning only at COLUMN 0, so an indented percent line is ordinary
    //    text and falls through to the delimiter test unchanged.
    const indented = "  %TAG !e! tag:x,2000:\nJust body prose.\n";
    const pIndented = parseFrontmatter(indented);
    expect(pIndented.ok).toBe(true);
    if (pIndented.ok) expect(pIndented.value.size).toBe(0);

    // 3. A percent that is not the FIRST character is not a directive either.
    const midLine = "100% body prose, no frontmatter here.\n";
    const pMid = parseFrontmatter(midLine);
    expect(pMid.ok).toBe(true);
    if (pMid.ok) expect(pMid.value.size).toBe(0);

    // 4. An ordinary document with a real block is entirely unaffected.
    const ordinary = "---\nname: x\ntools: Read, Agent(grugops-installer)\n---\nBody.\n";
    expect(hasSpawnGrant(ordinary)).toEqual({ ok: true, value: true });
  });

  it("D-34 — a percent line INSIDE the block keeps the EXISTING key-line reason, and one in the BODY is not read at all (one input, one reason)", () => {
    // INSIDE the block: already refused by KEY_LINE, which requires `[A-Za-z_]` at the key start.
    // It must keep THAT reason — a second reason for the same input is the duplicate grammar this
    // module exists to delete.
    const inBlock = "---\nname: x\n%TAG !e! tag:x,2000:\ntools: Read, Agent(o)\n---\n";
    const pIn = parseFrontmatter(inBlock);
    expect(pIn.ok).toBe(false);
    if (!pIn.ok) {
      expect(pIn.reason).toMatch(/cannot read/);
      expect(pIn.reason).not.toMatch(/YAML directive line/);
    }

    // In the BODY, after a well-formed block: never read, so the block parses normally.
    const inBody = "---\nname: x\ntools: Read, Grep\n---\n%TAG !e! tag:x,2000:\nBody.\n";
    const pBody = parseFrontmatter(inBody);
    expect(pBody.ok).toBe(true);
    if (pBody.ok) expect([...pBody.value.keys()]).toEqual(["name", "tools"]);
    expect(hasSpawnGrant(inBody)).toEqual({ ok: true, value: false });
  });

  // ── THE DELIMITER AXIS (D-39 + D-43 — 27-REVIEW-GAPS-4 § CR-01, round 4) ──────────────────────
  //
  // The FOURTH spelling of this module's founding failure, and the last silent-success arm it had.
  // `parseFrontmatter` routed the whole COMPLEMENT of its delimiter test into the keyless success arm,
  // so `----`, `--- foo` and a delimiter carrying any invisible, combining, unassigned or private-use
  // code point all returned `{ ok: true, value: false }` on a document carrying a live spawn grant.
  //
  // THE ROWS BELOW ARE THE RATIFIED TABLE, and four of them are the ones D-42's alphabet would still
  // have missed — that is why they are named individually rather than only swept. Each row carries the
  // code point its refusal must NAME, so a future narrowing fails on the reason and not merely on the
  // verdict.

  // ── THE ONE CONSTRUCTION AND THE ONE PROJECTION, SHARED BY EVERY SWEEP BELOW ───────────────────
  //
  // (D-45) EVERY document in this region is built here and read back here. Round 5's sweep wrote its
  // constructions BY ARM — one per declared refusal arm — so every member landed inside exactly one
  // arm by construction and the sweep was structurally incapable of failing on a member outside both.
  // A corpus generated per-arm is circular over the arm structure exactly as a corpus generated from
  // the alphabet is circular over the alphabet. That is the SECOND circularity axis this phase has
  // found, and the corollary is now structural: A CORPUS GENERATED FROM THE THING UNDER TEST PROVES
  // NOTHING, AT WHICHEVER LEVEL THE THING UNDER TEST IS DEFINED.
  //
  // So there is ONE builder taking a delimiter LINE and a POSITION, and it knows nothing about arms,
  // verdicts or classes. Every construction below — the named rows, the composite anchors, the
  // three-axis cross-product and the character sweep — goes through it.
  const KEYS = "name: x\ntools: Read, Agent(grugops-installer)\n";

  const buildDelimiterDoc = (
    line: string,
    position: "opening" | "closing",
  ): string =>
    position === "opening"
      ? `${line}\n${KEYS}---\nBody.\n`
      : `---\n${KEYS}${line}\nBody.\n`;

  // THE OBSERVABLE PROJECTION OF A VERDICT, read through the PUBLIC surface only. The classifier is
  // module-private on purpose: a correct-but-unconsumed verdict would hide a live bypass, so what is
  // asserted is what the guards actually see.
  //
  //   legal            -> the block opens/closes, the keys survive, the grant is reported
  //   refuse           -> the failure arm, with a reason naming the position
  //   not-a-delimiter  -> at the OPENING position the keyless SUCCESS arm (an ungranted success);
  //                       at the CLOSING position nothing closes the block, so the unterminated-block
  //                       refusal is what a reader observes.
  const projectVerdict = (
    line: string,
    position: "opening" | "closing",
  ): "legal" | "refuse" | "not-a-delimiter" => {
    const text = buildDelimiterDoc(line, position);
    const parsed = parseFrontmatter(text);
    if (parsed.ok) {
      // Only the OPENING position can succeed without a delimiter verdict of `legal`: a keyless
      // success is what a document that never opened a block returns.
      return parsed.value.size > 0 ? "legal" : "not-a-delimiter";
    }
    if (/never closed/.test(parsed.reason)) return "not-a-delimiter";
    return "refuse";
  };

  // The offending opening/closing lines, with the code point the refusal must name. Built with
  // String.fromCodePoint rather than pasted literals so the intent survives an editor normalizing the
  // source file (a combining mark next to a dash is exactly the byte an editor is tempted to move).
  //
  // (D-44 RECONCILIATION — recorded, not silent) THE `arm: 1 | 2` TAG IS GONE AND IS RESTATED AS THE
  // VERDICT KIND THE ROW EXPECTS. The tag named a position inside a TWO-ARM IMPLEMENTATION that no
  // longer exists; a tag describing a deleted structure is a comment claiming a property, which this
  // module's own rule forbids leaving standing. RESTATED rather than DROPPED because the tag is now
  // LOAD-BEARING: `projectVerdict` is compared against it, so a row retagged without changing its
  // behaviour fails instead of drifting into decoration, and a future row expecting `legal` or
  // `not-a-delimiter` must say so rather than inheriting "refuse" by position in the table. The
  // leading/trailing distinction the old tag also carried survives in each row's own label, where it
  // describes the INPUT rather than the implementation.
  // (D-50 RECONCILIATION — INVERTED, NOT DELETED) THE TAG IS NOW TWO-SIDED, BECAUSE EXACTLY ONE ROW'S
  // TWO POSITIONS GENUINELY DIFFER. The single tag asserted that every row behaves identically at both
  // positions, and for `a LEADING space` that assertion WAS the WR-02 false red, enshrined: measured
  // against libyaml, `description: |` / `  intro` / `  ---` / `  outro` loads to
  // `"intro\n---\noutro\n"` — the indented `---` is CONTENT — while this module refused the whole
  // document. The row is inverted at the closing position and kept at the opening one rather than
  // being dropped, exactly as `27-39` inverted the two `REFUSED_FORMS` rows a loader disproved.
  //
  // WRITING BOTH SIDES OUT ON EVERY ROW IS THE POINT. A single tag plus an optional override would
  // let the exemption spread quietly; a required pair makes each new row declare both positions, and
  // the count of asymmetric rows is asserted below so the exemption cannot grow past the one row the
  // format actually justifies.
  const DELIMITER_ROWS: readonly {
    label: string;
    line: string;
    codePoint: string;
    verdict: {
      opening: "legal" | "refuse" | "not-a-delimiter";
      closing: "legal" | "refuse" | "not-a-delimiter";
    };
  }[] = [
    // TRAILING residue — begins with the payload and is not the one legal spelling.
    {
      label: "U+FE0F VARIATION SELECTOR-16 (Mn — OUTSIDE D-42's alphabet)",
      line: `---${String.fromCodePoint(0xfe0f)}`,
      codePoint: "U+FE0F",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    {
      label: "U+0301 COMBINING ACUTE (Mn — OUTSIDE D-42's alphabet)",
      line: `---${String.fromCodePoint(0x301)}`,
      codePoint: "U+0301",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    {
      label: "U+0378 unassigned (Cn — OUTSIDE D-42's alphabet)",
      line: `---${String.fromCodePoint(0x378)}`,
      codePoint: "U+0378",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    {
      label: "U+E000 private use (Co — OUTSIDE D-42's alphabet)",
      line: `---${String.fromCodePoint(0xe000)}`,
      codePoint: "U+E000",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    // The two payload variants carrying NO unusual code point at all. Common frontmatter readers
    // accept both, and no prior decision or review in this phase named either.
    {
      label: "`----` (an extra dash)",
      line: "----",
      codePoint: "U+002D",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    {
      label: "`--- foo` (the payload followed by ordinary text)",
      line: "--- foo",
      codePoint: "U+0066",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    // The two D-42 DID cover — kept so this set is a superset of what the rejected alphabet swept.
    {
      label: "U+E0020 TAG SPACE (Cf — inside D-42's alphabet)",
      line: `---${String.fromCodePoint(0xe0020)}`,
      codePoint: "U+E0020",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    {
      label: "U+200B ZERO WIDTH SPACE (Cf — inside D-42's alphabet)",
      line: `---${String.fromCodePoint(0x200b)}`,
      codePoint: "U+200B",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    // LEADING residue that renders no glyph, standing in front of an otherwise legal delimiter.
    //
    // (D-50) THE ONE ASYMMETRIC ROW. A space is the DECLARED whitespace class, so this leading run is
    // INDENTATION and not residue, and an indented line is not at a delimiter position at all. At the
    // CLOSING position that means "keep scanning" — and the scan finding no legal close ends in the
    // unterminated-block refusal, which is what `projectVerdict` reports as `not-a-delimiter`. At the
    // OPENING position the same verdict IS the keyless success arm, so it still refuses there.
    {
      label: "a LEADING space",
      line: " ---",
      codePoint: "U+0020",
      verdict: { opening: "refuse", closing: "not-a-delimiter" },
    },
    {
      label: "a LEADING combining acute (arm 2's class must not be D-42's)",
      line: `${String.fromCodePoint(0x301)}---`,
      codePoint: "U+0301",
      verdict: { opening: "refuse", closing: "refuse" },
    },
    {
      label: "a LEADING private-use code point",
      line: `${String.fromCodePoint(0xe000)}---`,
      codePoint: "U+E000",
      verdict: { opening: "refuse", closing: "refuse" },
    },
  ];

  it("D-43 — every ratified offending row REFUSES at the OPENING position, naming its code point (four of them OUTSIDE D-42's alphabet)", () => {
    for (const row of DELIMITER_ROWS) {
      const text = buildDelimiterDoc(row.line, "opening");
      // (D-44) THE TAG IS LOAD-BEARING. The row states the verdict kind it expects and the observed
      // projection is compared against it, so a row retagged without changing its behaviour FAILS
      // rather than becoming decoration — which is what the deleted `arm: 1 | 2` tag had become.
      expect(projectVerdict(row.line, "opening"), row.label).toBe(
        row.verdict.opening,
      );
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, row.label).toBe(false);
      if (parsed.ok) continue;
      expect(parsed.reason, row.label).toContain("opening delimiter position");
      expect(parsed.reason, row.label).toContain(row.codePoint);

      // The arm that would have been taken before the fix. `not.toEqual` is the assertion that
      // actually encodes the defect: a shorter or absent grant is the silent-success arm.
      const grant = hasSpawnGrant(text);
      expect(grant.ok, row.label).toBe(false);
      expect(grant, row.label).not.toEqual({ ok: true, value: false });
      expect(grantedAgentNames(text), row.label).not.toEqual({
        ok: true,
        value: [],
      });
    }
  });

  it("D-39 point 5 / D-50 — the SAME line at the CLOSING position produces the SAME named refusal, except for the ONE row whose two positions genuinely differ", () => {
    // (D-50) THE EXEMPTION IS BOUNDED BY AN ASSERTION, NOT BY INTENT. Exactly one row's two positions
    // differ, it is named here, and a second row acquiring an asymmetry fails LOUDLY rather than
    // riding in on this one's justification. D-39 point 5 killed an asymmetry that was the SAME BYTE
    // refusing loudly at one position and succeeding silently at the other for no stated reason; the
    // row below is a stated difference in what the two positions MEAN, and it points the only way it
    // safely can — toward another refusal.
    const asymmetric = DELIMITER_ROWS.filter(
      (r) => r.verdict.opening !== r.verdict.closing,
    ).map((r) => r.label);
    expect(asymmetric).toEqual(["a LEADING space"]);

    for (const row of DELIMITER_ROWS) {
      // The leading-residue rows are constructed at the closing position too: an invisible prefix in
      // front of a legal closing delimiter is the same fact one position over.
      const text = buildDelimiterDoc(row.line, "closing");
      expect(projectVerdict(row.line, "closing"), row.label).toBe(
        row.verdict.closing,
      );
      const parsed = parseFrontmatter(text);
      // EVERY ROW STILL FAILS AT THIS POSITION, including the asymmetric one — what changed is WHICH
      // refusal it lands in, never THAT it refuses. Nothing here reaches a success arm.
      expect(parsed.ok, row.label).toBe(false);
      if (parsed.ok) continue;
      if (row.verdict.closing === "not-a-delimiter") {
        // (D-50) The indented line is CONTENT, so the scan continues past it and — this document
        // having no other close — lands in the EXISTING unterminated-block refusal. The destination
        // arm is asserted by name so a future change routing it anywhere else fails here.
        expect(parsed.reason, row.label).toMatch(/never closed/);
        expect(parsed.reason, row.label).not.toContain(
          "closing delimiter position",
        );
        expect(hasSpawnGrant(text), row.label).not.toEqual({
          ok: true,
          value: false,
        });
        continue;
      }
      expect(parsed.reason, row.label).toContain("closing delimiter position");
      expect(parsed.reason, row.label).toContain(row.codePoint);
      // The asymmetry that is now dead: the identical byte used to fail OPEN with a keyless success
      // and fail CLOSED with a misleading unterminated-block reason.
      expect(parsed.reason, row.label).not.toMatch(/never closed/);
    }
  });

  it("D-43 — the `...` closing payload answers to the SAME rule as `---` (no second grammar in the delimiter region)", () => {
    // Legal: the document-end payload with only declared-class residue.
    const legal = "---\nname: x\ntools: Read, Agent(grugops-installer)\n...  \nBody.\n";
    expect(hasSpawnGrant(legal)).toEqual({ ok: true, value: true });

    // Illegal: it begins with the payload and is not legal, so it refuses like every other row.
    for (const [line, cp] of [
      ["....", "U+002E"],
      ["... foo", "U+0066"],
      [`...${String.fromCodePoint(0x301)}`, "U+0301"],
    ] as const) {
      const text = `---\nname: x\ntools: Read, Agent(grugops-installer)\n${line}\nBody.\n`;
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, line).toBe(false);
      if (!parsed.ok) expect(parsed.reason, line).toContain(cp);
    }
  });

  // ── THE D-44 COMPOSITE ANCHORS ────────────────────────────────────────────────────────────────
  //
  // Each row below was MEASURED returning `{ ok: true, value: false }` against the committed
  // scripts/frontmatter.js before the D-44 classifier landed — a live `Agent(grugops-orchestrator)`
  // grant read as an absence of keys — and each reported the misleading `opened and never closed`
  // diagnosis at the CLOSING position. They carry BOTH leading invisible residue AND illegal trailing
  // residue, which is precisely what the two refusal arms that preceded the classifier did not cover
  // between them: arm 1 required `startsWith(payload)` at position zero, arm 2 required a FULLY LEGAL
  // delimiter after the residue, and the composite satisfied neither.
  //
  // These are ANCHORS, not the pin. The pin is the three-axis cross-product below, which was built
  // without reference to the classifier's internals. These rows exist so a future failure names the
  // exact spelling the round-5 review reproduced, rather than only a cell index.
  const COMPOSITE_ROWS: readonly {
    label: string;
    line: string;
    leading: string;
    trailing: string;
  }[] = [
    {
      label: "ZWSP + `---` + ZWSP",
      line: `${String.fromCodePoint(0x200b)}---${String.fromCodePoint(0x200b)}`,
      leading: "U+200B",
      trailing: "U+200B",
    },
    {
      label: "ZWSP + `----`",
      line: `${String.fromCodePoint(0x200b)}----`,
      leading: "U+200B",
      trailing: "U+002D",
    },
    {
      label: "NBSP + `----`",
      line: `${String.fromCodePoint(0xa0)}----`,
      leading: "U+00A0",
      trailing: "U+002D",
    },
    {
      label: "BOM x2 + `---` + ZWSP",
      line: `${String.fromCodePoint(0xfeff)}${String.fromCodePoint(0xfeff)}---${String.fromCodePoint(0x200b)}`,
      leading: "U+FEFF",
      trailing: "U+200B",
    },
    {
      label: "ZWSP + `--- foo`",
      line: `${String.fromCodePoint(0x200b)}--- foo`,
      leading: "U+200B",
      trailing: "U+0066",
    },
    {
      label: "NUL + `---` + NUL",
      line: `${String.fromCodePoint(0)}---${String.fromCodePoint(0)}`,
      leading: "U+0000",
      trailing: "U+0000",
    },
    {
      label: "U+0301 COMBINING ACUTE + `---` + U+0301",
      line: `${String.fromCodePoint(0x301)}---${String.fromCodePoint(0x301)}`,
      leading: "U+0301",
      trailing: "U+0301",
    },
    {
      label: "a leading space + `----`",
      line: " ----",
      leading: "U+0020",
      trailing: "U+002D",
    },
  ];

  it("D-44 composite anchors — a line carrying BOTH leading invisible residue AND illegal trailing residue REFUSES at the OPENING position, naming BOTH facts", () => {
    for (const row of COMPOSITE_ROWS) {
      const text = buildDelimiterDoc(row.line, "opening");
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, row.label).toBe(false);
      if (parsed.ok) continue;
      expect(parsed.reason, row.label).toContain("opening delimiter position");
      // BOTH facts, not the first one found. A doubly-offending line has two things wrong with it
      // and a reason naming only one sends a reader to fix half the line.
      expect(parsed.reason, `${row.label} leading fact`).toContain(row.leading);
      expect(parsed.reason, `${row.label} trailing fact`).toContain(
        row.trailing,
      );
      expect(parsed.reason, `${row.label} leading clause`).toContain(
        "leading residue renders no glyph of its own",
      );
      expect(parsed.reason, `${row.label} trailing clause`).toContain(
        "the first code point after the payload",
      );

      // THE MEASURED DEFECT, stated as the assertion that would have failed before D-44: every one
      // of these returned the silent no-grant SUCCESS arm over a live spawn grant.
      const grant = hasSpawnGrant(text);
      expect(grant, row.label).not.toEqual({ ok: true, value: false });
      expect(grant.ok, row.label).toBe(false);
      expect(grantedAgentNames(text), row.label).not.toEqual({
        ok: true,
        value: [],
      });
    }
  });

  it("D-44 / D-50 composite anchors — the SAME line at the CLOSING position produces the SAME named refusal, except where the leading run is INDENTATION rather than residue", () => {
    // (D-50 RECONCILIATION — INVERTED, NOT DELETED) The `a leading space + ----` row's leading run is
    // the DECLARED whitespace class, so it is indentation and not residue, and at the CLOSING
    // position an indented line is content. It is derived here from the row's own `leading` code
    // point rather than matched on its label, so a row added later with a space or tab prefix is
    // classified by the same rule instead of inheriting the wrong column silently.
    const INDENTATION_LEADING: ReadonlySet<string> = new Set([
      "U+0020",
      "U+0009",
    ]);
    const indented = COMPOSITE_ROWS.filter((r) =>
      INDENTATION_LEADING.has(r.leading),
    ).map((r) => r.label);
    expect(indented).toEqual(["a leading space + `----`"]);

    for (const row of COMPOSITE_ROWS) {
      const text = buildDelimiterDoc(row.line, "closing");
      const parsed = parseFrontmatter(text);
      // Every row still REFUSES here; only the refusal it lands in moves.
      expect(parsed.ok, row.label).toBe(false);
      if (parsed.ok) continue;
      if (INDENTATION_LEADING.has(row.leading)) {
        // The scan continues past the content line and lands in the unterminated-block refusal —
        // another refusal, never a success. The trailing fault is genuinely no longer reported,
        // because the line was never at a delimiter position for a fault to be found on.
        expect(parsed.reason, row.label).toMatch(/never closed/);
        expect(hasSpawnGrant(text), row.label).not.toEqual({
          ok: true,
          value: false,
        });
        continue;
      }
      expect(parsed.reason, row.label).toContain("closing delimiter position");
      expect(parsed.reason, `${row.label} leading fact`).toContain(row.leading);
      expect(parsed.reason, `${row.label} trailing fact`).toContain(
        row.trailing,
      );
      // The LAST place the open/close asymmetry survived. Measured against the committed build
      // before D-44, every row here reported the unterminated-block diagnosis instead.
      expect(parsed.reason, row.label).not.toMatch(/never closed/);
    }
  });

  it("KIT-03 precision edge — a SUPPLEMENTARY-PLANE code point at either position is named as ONE `U+XXXXX` label, never as a surrogate half", () => {
    // U+E0020 TAG SPACE lives on plane 14 and is TWO UTF-16 code units. The leading run is measured
    // in code UNITS so it can slice the line; the label is read back with codePointAt so it names a
    // code POINT. Getting that pairing wrong reports U+D83C / U+DC20 — two halves of nothing.
    const TAG_SPACE = String.fromCodePoint(0xe0020);
    for (const [label, line] of [
      ["leading only", `${TAG_SPACE}---`],
      ["trailing only", `---${TAG_SPACE}`],
      ["BOTH (composite)", `${TAG_SPACE}---${TAG_SPACE}`],
    ] as const) {
      for (const [where, text] of [
        ["opening", buildDelimiterDoc(line, "opening")],
        ["closing", buildDelimiterDoc(line, "closing")],
      ] as const) {
        const parsed = parseFrontmatter(text);
        expect(parsed.ok, `${label} @ ${where}`).toBe(false);
        if (parsed.ok) continue;
        expect(parsed.reason, `${label} @ ${where}`).toContain("U+E0020");
        // Five hexadecimal digits, and NOT a surrogate half.
        expect(parsed.reason, `${label} @ ${where}`).toMatch(
          /U\+[0-9A-F]{5,}/,
        );
        expect(parsed.reason, `${label} @ ${where}`).not.toMatch(
          /U\+D[89AB][0-9A-F]{2}\b/,
        );
      }
    }
  });

  it("D-44 adjacency edge — the three verdict kinds PARTITION every line: no line receives two verdicts and no line receives none", () => {
    // The observable projection of each verdict at the OPENING position, read through the ONE shared
    // projection above. A line landing in two of these, or in none, is the union gap D-44 deleted.
    const INVISIBLE_ONLY = `${String.fromCodePoint(0x200b)}${String.fromCodePoint(0xa0)}\t `;
    for (const [line, expected] of [
      ["---", "legal"],
      ["---   ", "legal"],
      ["---\t", "legal"],
      [`${String.fromCodePoint(0x200b)}---${String.fromCodePoint(0x200b)}`, "refuse"],
      ["----", "refuse"],
      [" ---", "refuse"],
      // A line of NOTHING BUT invisible characters carries no payload, so it separates cleanly into
      // not-a-delimiter rather than into refuse — the leading-invisible class decides only WHERE a
      // delimiter begins, and there is no delimiter here to begin.
      [INVISIBLE_ONLY, "not-a-delimiter"],
      ["--", "not-a-delimiter"],
      [`${String.fromCodePoint(0x200b)}--`, "not-a-delimiter"],
      ["# Heading", "not-a-delimiter"],
    ] as const) {
      expect(projectVerdict(line, "opening"), JSON.stringify(line)).toBe(expected);
    }
  });

  it("D-43 positive controls — a bare delimiter, trailing spaces and a trailing tab each OPEN a block and return their keys", () => {
    for (const [label, open] of [
      ["bare", "---"],
      ["trailing spaces", "---   "],
      ["trailing tab", "---\t"],
      ["trailing space AND tab", "--- \t "],
    ] as const) {
      const text = `${open}\nname: x\ntools: Read, Agent(grugops-installer)\n${open}\nBody.\n`;
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, label).toBe(true);
      if (!parsed.ok) continue;
      expect([...parsed.value.keys()], label).toEqual(["name", "tools"]);
      expect(hasSpawnGrant(text), label).toEqual({ ok: true, value: true });
      expect(grantedAgentNames(text), label).toEqual({
        ok: true,
        value: ["grugops-installer"],
      });
    }
  });

  it("D-39 point 1 — ONE leading byte-order mark parses identically to the same document without it; a SECOND one refuses", () => {
    const BOM = String.fromCodePoint(0xfeff);
    const plain = "---\nname: x\ntools: Read, Agent(grugops-installer)\n---\nBody.\n";

    // The normalization: one mark, at position zero, removed once. A mark-prefixed adapter is LOADED
    // by the platform rather than inert, so reading it as keyless would be the silent-success arm.
    const marked = `${BOM}${plain}`;
    expect(parseFrontmatter(marked)).toEqual(parseFrontmatter(plain));
    expect(hasSpawnGrant(marked)).toEqual({ ok: true, value: true });

    // The deliberate non-normalization: a SECOND mark is not stripped. "Strip every mark" would be a
    // decode this module does not perform, so the residue falls to arm 2 and refuses by name.
    const twice = `${BOM}${BOM}${plain}`;
    const parsed = parseFrontmatter(twice);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.reason).toContain("U+FEFF");
      expect(parsed.reason).toContain("opening delimiter position");
    }
    expect(hasSpawnGrant(twice)).not.toEqual({ ok: true, value: false });

    // The mark is removed only at POSITION ZERO. One sitting after the payload is arm-1 residue.
    const trailing = `---${BOM}\nname: x\ntools: Read, Agent(grugops-installer)\n---\n`;
    const pTrailing = parseFrontmatter(trailing);
    expect(pTrailing.ok).toBe(false);
    if (!pTrailing.ok) expect(pTrailing.reason).toContain("U+FEFF");
  });

  it("D-39 point 4 / D-34 false-red control — a body-only document, an EMPTY document and a document of blank lines only all still reach the keyless SUCCESS arm", () => {
    // None of these BEGINS with the payload, which is precisely what the refusal keys on. Turning one
    // of them red would trade a silent success for a false red — the worse of the two.
    for (const [label, text] of [
      ["body-only", "# Heading\n\nJust body prose.\n"],
      ["empty", ""],
      ["blank lines only", "\n\n   \n\t\n"],
      ["a body line that MENTIONS a delimiter", "See the --- separator below.\n"],
      ["a dash bullet", "- item\n- item\n"],
      ["a setext underline after text", "Title\n---\n"],
    ] as const) {
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, label).toBe(true);
      if (parsed.ok) expect(parsed.value.size, label).toBe(0);
      expect(hasSpawnGrant(text), label).toEqual({ ok: true, value: false });
    }
  });

  // ── THE NON-CIRCULAR NEGATIVE-SPACE SWEEP (D-43) ──────────────────────────────────────────────
  //
  // WHY THE CORPUS IS BUILT FROM THE NEGATIVE SPACE OF THE REJECTED ALPHABET, AND NOT FROM THE RULE
  // UNDER TEST. A sweep whose members are generated from the alphabet the predicate consults is
  // TAUTOLOGICAL: it can detect a NARROWING of that alphabet and is structurally incapable of failing
  // on anything outside it. That is exactly how D-42 would have shipped green over a live
  // combining-mark bypass — its sweep and its predicate drew from one set, so the four classes it
  // missed were never candidates for a case.
  //
  // So the corpus is built from FOUR sources, and each is here for a stated reason:
  //   1. THE NEGATIVE SPACE of D-42's `[\s\p{Cf}\p{Cc}]` alphabet — combining marks, unassigned,
  //      private-use and surrogate code points. These are the members no alphabet under test contains,
  //      which is what makes the completeness claim non-circular.
  //   2. THE CODE POINTS D-42 DID COVER — format, control and space-separator — taken EXHAUSTIVELY, so
  //      this sweep is a strict superset of what the rejected formulation would have swept.
  //   3. THE PAYLOAD VARIANTS THAT CARRY NO UNUSUAL CODE POINT AT ALL — an extra dash, and the payload
  //      followed by ordinary text. Neither is exotic, common frontmatter readers accept both, and no
  //      prior decision or review in this phase named either.
  //   4. THE POSITIVE CONTROLS — the declared class itself, which must still OPEN a block.
  //
  // Source 1 is sampled by a FIXED STRIDE so the sample is identical on every run and on every
  // platform; the sweep is a pin, and a pin whose corpus varies between runs pins nothing.

  const SWEEP_STRIDE = 7;
  const NEGATIVE_SPACE_CAP = 200;
  // Line-structural and declared-class code points are excluded from the sampled corpus and handled
  // as their own named cases: U+000A ends a line, U+000D is the CRLF normalization's business rather
  // than the delimiter rule's, and U+0009 / U+0020 ARE the declared class (source 4).
  const SWEEP_EXCLUDED = new Set([0x09, 0x0a, 0x0d, 0x20]);

  const NEGATIVE_SPACE_CLASSES = [
    { name: "M (combining marks)", re: /\p{M}/u },
    { name: "Cn (unassigned)", re: /\p{Cn}/u },
    { name: "Co (private use)", re: /\p{Co}/u },
    { name: "Cs (surrogates)", re: /\p{Cs}/u },
  ] as const;
  const D42_ALPHABET_CLASSES = [
    { name: "Cf (format)", re: /\p{Cf}/u },
    { name: "Cc (control)", re: /\p{Cc}/u },
    { name: "Zs (space separators)", re: /\p{Zs}/u },
  ] as const;

  function sampleByStride(
    classes: readonly { name: string; re: RegExp }[],
    stride: number,
    cap: number,
  ): Map<string, number[]> {
    const buckets = new Map(classes.map((c) => [c.name, [] as number[]]));
    for (let cp = 0; cp <= 0x10ffff; cp += stride) {
      if (SWEEP_EXCLUDED.has(cp)) continue;
      const ch = String.fromCodePoint(cp);
      for (const c of classes) {
        const bucket = buckets.get(c.name)!;
        if (bucket.length >= cap) continue;
        if (c.re.test(ch)) {
          bucket.push(cp);
          break;
        }
      }
    }
    return buckets;
  }

  function sampleExhaustive(
    classes: readonly { name: string; re: RegExp }[],
  ): Map<string, number[]> {
    const buckets = new Map(classes.map((c) => [c.name, [] as number[]]));
    for (let cp = 0; cp <= 0x10ffff; cp++) {
      if (SWEEP_EXCLUDED.has(cp)) continue;
      const ch = String.fromCodePoint(cp);
      for (const c of classes) {
        if (c.re.test(ch)) {
          buckets.get(c.name)!.push(cp);
          break;
        }
      }
    }
    return buckets;
  }

  const label = (cp: number): string =>
    `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;

  it("D-43 non-circular sweep — every corpus member REFUSES at both delimiter positions and in both placements, and only the declared class opens a block", () => {
    const negative = sampleByStride(
      NEGATIVE_SPACE_CLASSES,
      SWEEP_STRIDE,
      NEGATIVE_SPACE_CAP,
    );
    const covered = sampleExhaustive(D42_ALPHABET_CLASSES);

    // DERIVE THE SET, ASSERT THE COUNT (this repository's own rule, applied to the corpus itself).
    // A class silently emptied by a future regex edit would otherwise shrink the sweep in silence.
    for (const c of NEGATIVE_SPACE_CLASSES) {
      expect(negative.get(c.name)!.length, c.name).toBe(NEGATIVE_SPACE_CAP);
    }
    expect(covered.get("Cf (format)")!.length).toBe(170);
    expect(covered.get("Cc (control)")!.length).toBe(62);
    expect(covered.get("Zs (space separators)")!.length).toBe(16);

    const offending: number[] = [
      ...NEGATIVE_SPACE_CLASSES.flatMap((c) => negative.get(c.name)!),
      ...D42_ALPHABET_CLASSES.flatMap((c) => covered.get(c.name)!),
    ];
    // Source 4 — the declared class. These are the ONLY members that may open a block, and only in
    // the TRAILING position.
    const declaredClass = [0x20, 0x09];

    // The corpus SIZE, asserted as a number: 4 x 200 negative-space + 170 + 62 + 16 covered + 2
    // declared-class controls.
    expect(offending.length).toBe(1048);
    expect(offending.length + declaredClass.length).toBe(1050);
    // And the negative space really is OUTSIDE D-42's alphabet — the property that makes this
    // corpus non-circular rather than a restatement of the rule.
    const D42_ALPHABET = /[\s\p{Cf}\p{Cc}]/u;
    for (const c of NEGATIVE_SPACE_CLASSES) {
      for (const cp of negative.get(c.name)!) {
        expect(D42_ALPHABET.test(String.fromCodePoint(cp)), label(cp)).toBe(
          false,
        );
      }
    }

    // (D-45 / WR-02) THE PER-ARM CONSTRUCTIONS ARE GONE. Round 5 built exactly FOUR documents per
    // member — trailing@opening, leading@opening, trailing@closing, leading@closing — and every one
    // of them placed its member inside exactly ONE declared refusal arm. 1048 members x 4
    // constructions = 4192 green assertions that could only ever detect a NARROWING of an arm and
    // were structurally incapable of failing on an input outside BOTH arms, which is the CR-01
    // composite. The residue PLACEMENT is now an axis with THREE values — leading only, trailing
    // only, and BOTH — so the composite is a construction the sweep produces by default rather than
    // one an author had to think to add.
    const PLACEMENTS = ["leading", "trailing", "both"] as const;
    for (const cp of offending) {
      const ch = String.fromCodePoint(cp);
      for (const placement of PLACEMENTS) {
        for (const position of ["opening", "closing"] as const) {
          const line =
            placement === "leading"
              ? `${ch}---`
              : placement === "trailing"
                ? `---${ch}`
                : `${ch}---${ch}`;
          const where = `${placement} @ ${position}`;
          const text = buildDelimiterDoc(line, position);
          // THE ONE DECLARED EXCEPTION IN THE WHOLE SWEEP, and the sweep is what forced it to be
          // declared rather than discovered later. U+FEFF at position zero of the DOCUMENT is the
          // single byte this module normalizes (D-39 point 1), so a document carrying exactly one
          // leading mark parses identically to the same document without it — that equality and the
          // two-mark refusal are pinned by their own named case above. It applies ONLY to the
          // leading-only placement at the opening position: the `both` placement still carries
          // trailing residue after the mark is removed and still refuses, and every placement at the
          // CLOSING position is past the normalization point entirely.
          if (cp === 0xfeff && placement === "leading" && position === "opening") {
            expect(hasSpawnGrant(text), `${label(cp)} ${where}`).toEqual({
              ok: true,
              value: true,
            });
            continue;
          }
          const parsed = parseFrontmatter(text);
          // The message names the offending code point AND the placement, so a future failure says
          // WHICH member regressed and in WHICH construction.
          expect(parsed.ok, `${label(cp)} ${where}`).toBe(false);
          if (parsed.ok) continue;
          expect(parsed.reason, `${label(cp)} ${where}`).toContain(
            "delimiter position",
          );
          // The asymmetry that is dead at BOTH positions and in ALL THREE placements.
          expect(parsed.reason, `${label(cp)} ${where}`).not.toMatch(
            /never closed/,
          );
          // The load-bearing half: NOT the silent no-grant success arm.
          expect(hasSpawnGrant(text), `${label(cp)} ${where}`).not.toEqual({
            ok: true,
            value: false,
          });
        }
      }
    }

    // Source 4: the declared class OPENS a block in the trailing position; in the LEADING position it
    // is INDENTATION, which means different things at the two delimiter positions.
    //
    // (D-50 RECONCILIATION — INVERTED, NOT DELETED) This loop asserted `refuse` at BOTH positions,
    // and the closing half of that assertion WAS the WR-02 false red written down as an oracle: a
    // real YAML 1.2 loader reads an indented `---` inside a block scalar as CONTENT
    // (`{"description"=>"intro\n---\noutro\n"}`), which is precisely why the line must not be treated
    // as a close. The opening half is unchanged and is the control that proves the change did not
    // simply loosen the class: there, `not-a-delimiter` IS the keyless success arm.
    for (const cp of declaredClass) {
      const ch = String.fromCodePoint(cp);
      for (const position of ["opening", "closing"] as const) {
        expect(
          hasSpawnGrant(buildDelimiterDoc(`---${ch}`, position)),
          `${label(cp)} trailing @ ${position}`,
        ).toEqual({ ok: true, value: true });
        expect(
          projectVerdict(`${ch}---`, position),
          `${label(cp)} leading @ ${position}`,
        ).toBe(position === "opening" ? "refuse" : "not-a-delimiter");
        // Neither position reaches the silent no-grant arm: the opening one refuses by name, and the
        // closing one falls through to the unterminated-block refusal.
        expect(
          hasSpawnGrant(buildDelimiterDoc(`${ch}---`, position)),
          `${label(cp)} leading @ ${position}`,
        ).not.toEqual({ ok: true, value: false });
      }
      const parsed = parseFrontmatter(buildDelimiterDoc(`${ch}---`, "opening"));
      expect(parsed.ok, `${label(cp)} leading`).toBe(false);
      if (!parsed.ok) expect(parsed.reason).toContain(label(cp));
    }

    // Source 3: the payload variants that carry no unusual code point at all.
    for (const [line, cp] of [
      ["----", 0x2d],
      ["--- foo", 0x66],
    ] as const) {
      for (const position of ["opening", "closing"] as const) {
        const parsed = parseFrontmatter(buildDelimiterDoc(line, position));
        expect(parsed.ok, `${line} @ ${position}`).toBe(false);
        if (!parsed.ok) {
          expect(parsed.reason, `${line} @ ${position}`).toContain(label(cp));
        }
      }
    }
  });

  // ── THE THREE-AXIS CROSS-PRODUCT SWEEP (D-45) ─────────────────────────────────────────────────
  //
  // WHY THE CORPUS HAS THIS SHAPE, AND WHY THE PREVIOUS ONE COULD NOT FAIL ON WHAT IT WAS WRITTEN TO
  // CATCH. Round 5's sweep built exactly ONE CONSTRUCTION PER DECLARED ARM. Every member therefore
  // landed inside exactly one arm BY CONSTRUCTION, so the sweep verified "each arm fires on its own
  // inputs" and was structurally incapable of failing on an input outside both arms — which is
  // precisely the CR-01 composite it would have had to catch. A corpus generated per-arm is circular
  // over the ARM STRUCTURE exactly as a corpus generated from the alphabet is circular over the
  // ALPHABET.
  //
  // THAT IS THE SECOND CIRCULARITY AXIS THIS PHASE HAS FOUND, and the corollary is now structural
  // rather than anecdotal: A CORPUS GENERATED FROM THE THING UNDER TEST PROVES NOTHING, AT WHICHEVER
  // LEVEL THE THING UNDER TEST IS DEFINED. Round 4 learned it at the character level and round 5
  // reproduced it one level up. The defence is to enumerate the corpus from OUTSIDE the rule: three
  // independent axes of ordinary document facts — what stands before the payload, what the payload
  // is, what follows it — crossed exhaustively. Nothing about the classifier's internals selects a
  // member, so no cell can land inside a declared arm by construction.
  //
  // Each axis is a plain data literal of code points and strings, and every cell's EXPECTED verdict
  // is computed by a small pure function of the three axis LABELS. That function never calls the
  // code under test.

  const NUL = String.fromCodePoint(0);

  // AXIS 1 — what stands in front of the payload. Nine members: nothing, the byte-order mark once and
  // twice, two zero-width/no-break invisibles, the two members of the declared class, a combining
  // mark (outside D-42's alphabet, and the row that formulation shipped green), and a C0 control.
  const SWEEP_LEADING: readonly { label: string; text: string }[] = [
    { label: "none", text: "" },
    { label: "one byte-order mark", text: String.fromCodePoint(0xfeff) },
    {
      label: "two byte-order marks",
      text: `${String.fromCodePoint(0xfeff)}${String.fromCodePoint(0xfeff)}`,
    },
    { label: "ZERO WIDTH SPACE", text: String.fromCodePoint(0x200b) },
    { label: "NO-BREAK SPACE", text: String.fromCodePoint(0xa0) },
    { label: "one space", text: " " },
    { label: "one tab", text: "\t" },
    // (D-50) A MIXED RUN OF BOTH DECLARED MEMBERS. The single space and single tab were already here;
    // what this member adds is a run whose INDENTATION verdict cannot be reached by looking at one
    // character — the label is a property of the WHOLE run, and a scan that decided on the first code
    // point would still pass on the two single-character members.
    { label: "a space and a tab", text: " \t" },
    { label: "COMBINING ACUTE ACCENT", text: String.fromCodePoint(0x301) },
    { label: "the NUL control", text: NUL },
  ];

  // AXIS 2 — the payload itself, stated as a KIND so the same four shapes can be spelled in either
  // payload family. `spell` takes the family's character and returns the token as it appears on the
  // line; the near-payload is two characters and is therefore not a payload at all.
  const SWEEP_PAYLOAD: readonly {
    label: string;
    spell: (c: string) => string;
  }[] = [
    { label: "exact payload", spell: (c) => c.repeat(3) },
    { label: "payload plus one more of the same character", spell: (c) => c.repeat(4) },
    { label: "exact payload then a space and ordinary text", spell: (c) => `${c.repeat(3)} foo` },
    { label: "near-payload (two characters)", spell: (c) => c.repeat(2) },
  ];

  // AXIS 3 — what follows the payload. Six members: nothing, two invisibles, the declared class's
  // space, a space carrying ordinary text after it, and a C0 control.
  const SWEEP_TRAILING: readonly { label: string; text: string }[] = [
    { label: "none", text: "" },
    { label: "ZERO WIDTH SPACE", text: String.fromCodePoint(0x200b) },
    { label: "NO-BREAK SPACE", text: String.fromCodePoint(0xa0) },
    { label: "one space", text: " " },
    { label: "one space then ordinary text", text: " foo" },
    { label: "the NUL control", text: NUL },
  ];

  // The position-and-token families swept. The OPENING position accepts only the three-hyphen
  // payload; the CLOSING position accepts both closing tokens, and BOTH are swept so the open/close
  // asymmetry cannot reappear in one position or one token only.
  const SWEEP_FAMILIES: readonly {
    position: "opening" | "closing";
    familyChar: string;
    token: string;
  }[] = [
    { position: "opening", familyChar: "-", token: "---" },
    { position: "closing", familyChar: "-", token: "---" },
    { position: "closing", familyChar: ".", token: "..." },
  ];

  // The ONE trailing-axis subset that lives inside the declared whitespace class. Stated as LABELS,
  // because the expected-verdict rule below must reason about the corpus and never about characters
  // the module also reasons about.
  const DECLARED_CLASS_TRAILING_LABELS: ReadonlySet<string> = new Set([
    "none",
    "one space",
  ]);

  // (D-50) The AXIS-1 subset that is INDENTATION — a leading run made of nothing but the declared
  // whitespace class. Stated as LABELS for the same reason as the trailing set above: the rule must
  // reason about the corpus and never about characters the module also reasons about.
  const DECLARED_CLASS_LEADING_LABELS: ReadonlySet<string> = new Set([
    "one space",
    "one tab",
    "a space and a tab",
  ]);

  // THE EXPECTED VERDICT, DERIVED FROM THE STATED RULE AND NEVER FROM THE CODE UNDER TEST.
  //
  //   `rest` does not begin with any payload -> not-a-delimiter
  //   NO leading run at all AND everything after the payload is in the declared class -> legal
  //   (D-50) a leading run of nothing but the declared class is INDENTATION, and an indented line is
  //     not at a delimiter position at all -> not-a-delimiter at the CLOSING position, where that
  //     verdict means "keep scanning"; refuse at the OPENING position, where it means the keyless
  //     SUCCESS arm and where routing indentation would trade a loud refusal for a silent one
  //   otherwise -> refuse
  //
  // IT MUST NEVER CALL `parseFrontmatter`, `hasSpawnGrant`, `projectVerdict` OR ANY MODULE EXPORT.
  // Doing so is what makes a corpus circular, and this phase has now shipped once past each of the
  // two levels at which that can happen. The non-circularity is ASSERTED below, not merely stated.
  //
  // THE ONE CARVE-OUT, DECLARED HERE RATHER THAN DISCOVERED AS A FAILING CELL: a SINGLE leading
  // byte-order mark at the OPENING position is removed by this module's one normalization point
  // (D-39 point 1 — position zero of the document, one byte, once), so that cell's EFFECTIVE leading
  // residue is absent. Two marks are not normalized and are not carved out, and no leading residue at
  // the CLOSING position is carved out, because the closing scan is past the normalization point.
  const expectedVerdict = (
    leadingLabel: string,
    payloadLabel: string,
    trailingLabel: string,
    position: "opening" | "closing",
  ): "legal" | "refuse" | "not-a-delimiter" => {
    if (payloadLabel === "near-payload (two characters)") {
      return "not-a-delimiter";
    }
    const effectiveLeading =
      position === "opening" && leadingLabel === "one byte-order mark"
        ? "none"
        : leadingLabel;
    if (effectiveLeading !== "none") {
      // (D-50) The position asymmetry, stated here as the FORMAT rule rather than read off the
      // module: indentation says "this line is content", which the closing scan can act on by
      // continuing, and which the opening test cannot act on without inventing a keyless success.
      return DECLARED_CLASS_LEADING_LABELS.has(effectiveLeading) &&
        position === "closing"
        ? "not-a-delimiter"
        : "refuse";
    }
    if (payloadLabel !== "exact payload") return "refuse";
    return DECLARED_CLASS_TRAILING_LABELS.has(trailingLabel)
      ? "legal"
      : "refuse";
  };

  it("D-45 non-circularity — the expected-verdict rule names nothing from the module under test and is a pure function of its four arguments", () => {
    // The claim "this corpus was not generated from the rule under test" is CHECKABLE, not merely
    // asserted: the rule's own source is read back and must mention no symbol of the module.
    const MODULE_SYMBOLS = [
      "parseFrontmatter",
      "hasSpawnGrant",
      "grantedAgentNames",
      "classifyDelimiter",
      "DelimiterVerdict",
      "assertNeverVerdict",
      "leadingInvisibleRun",
      "LeadingRun",
      "firstOutsideDeclaredWs",
      "DELIMITER_WS_CHAR",
      "VISIBLE_GLYPH",
      "OPEN_PAYLOADS",
      "CLOSE_PAYLOADS",
      "codePointLabel",
      "projectVerdict",
      "buildDelimiterDoc",
    ] as const;
    const source = expectedVerdict.toString();
    for (const symbol of MODULE_SYMBOLS) {
      expect(source, symbol).not.toContain(symbol);
    }

    // Purity: same arguments, same answer, no hidden state.
    for (const leading of SWEEP_LEADING) {
      for (const payload of SWEEP_PAYLOAD) {
        for (const trailing of SWEEP_TRAILING) {
          for (const position of ["opening", "closing"] as const) {
            const a = expectedVerdict(leading.label, payload.label, trailing.label, position);
            const b = expectedVerdict(leading.label, payload.label, trailing.label, position);
            expect(a, `${leading.label}/${payload.label}/${trailing.label}/${position}`).toBe(b);
          }
        }
      }
    }

    // AND A SECOND, INDEPENDENTLY WRITTEN TRUTH TABLE for a named subset — every composite spelling
    // the round-5 review reproduced that this corpus can express, plus the positive controls and the
    // near-payload. Written out by hand from the stated rule rather than by evaluating anything, so
    // the rule and the table are two independent statements of the same fact.
    const TRUTH_TABLE: readonly [string, string, string, "opening" | "closing", string][] = [
      // The seven of the eight measured composites this corpus expresses. (The eighth,
      // U+0301 + `---` + U+0301, needs a combining mark on the TRAILING axis, which this corpus does
      // not carry; it is pinned by the named composite anchors and by the character sweep's `both`
      // placement instead.)
      ["ZERO WIDTH SPACE", "exact payload", "ZERO WIDTH SPACE", "opening", "refuse"],
      ["ZERO WIDTH SPACE", "payload plus one more of the same character", "none", "opening", "refuse"],
      ["NO-BREAK SPACE", "payload plus one more of the same character", "none", "opening", "refuse"],
      ["two byte-order marks", "exact payload", "ZERO WIDTH SPACE", "opening", "refuse"],
      ["ZERO WIDTH SPACE", "exact payload then a space and ordinary text", "none", "opening", "refuse"],
      ["the NUL control", "exact payload", "the NUL control", "opening", "refuse"],
      ["one space", "payload plus one more of the same character", "none", "opening", "refuse"],
      // The positive controls, and the carve-out stated as its own row.
      ["none", "exact payload", "none", "opening", "legal"],
      ["none", "exact payload", "one space", "opening", "legal"],
      ["one byte-order mark", "exact payload", "none", "opening", "legal"],
      ["one byte-order mark", "exact payload", "none", "closing", "refuse"],
      // The genuinely-body-only arm, at both positions.
      ["none", "near-payload (two characters)", "none", "opening", "not-a-delimiter"],
      ["ZERO WIDTH SPACE", "near-payload (two characters)", "one space then ordinary text", "closing", "not-a-delimiter"],
      // (D-50) INDENTATION, AND THE POSITION ASYMMETRY WRITTEN OUT AS DATA RATHER THAN ARGUED. The
      // same three leading runs appear at both positions, so a future edit that "simplified" the
      // asymmetry away would fail on one column or the other rather than on neither.
      ["one space", "exact payload", "none", "closing", "not-a-delimiter"],
      ["one tab", "exact payload", "none", "closing", "not-a-delimiter"],
      ["a space and a tab", "exact payload", "none", "closing", "not-a-delimiter"],
      ["one tab", "exact payload then a space and ordinary text", "none", "closing", "not-a-delimiter"],
      ["one space", "payload plus one more of the same character", "none", "closing", "not-a-delimiter"],
      ["one space", "exact payload", "none", "opening", "refuse"],
      ["one tab", "exact payload", "none", "opening", "refuse"],
      ["a space and a tab", "exact payload", "none", "opening", "refuse"],
      // Indentation is the DECLARED class only. An invisible that is not space or tab is residue and
      // refuses at BOTH positions, which is what keeps the D-50 label from widening into "anything
      // that renders no glyph".
      ["NO-BREAK SPACE", "exact payload", "none", "closing", "refuse"],
      ["ZERO WIDTH SPACE", "exact payload", "none", "closing", "refuse"],
    ];
    expect(TRUTH_TABLE.length).toBeGreaterThanOrEqual(23);
    for (const [leading, payload, trailing, position, expected] of TRUTH_TABLE) {
      expect(
        expectedVerdict(leading, payload, trailing, position),
        `${leading} | ${payload} | ${trailing} | ${position}`,
      ).toBe(expected);
    }
  });

  it("D-45 cross-product sweep — 10 leading x 4 payload x 6 trailing, at the OPENING position and at the CLOSING position for BOTH closing payload tokens", () => {
    // DERIVE THE SET, ASSERT THE COUNT (this repository's own rule). A table silently emptied by a
    // later edit shrinks the sweep LOUDLY rather than quietly.
    //
    // (D-50) THE CARDINALITY MOVED DELIBERATELY AND THE NEW NUMBERS ARE STATED: axis 1 grew from 9 to
    // 10 members with the mixed space-and-tab run, so the per-family cell count moved 216 -> 240 and
    // the total 648 -> 720. A number that changed for no recorded reason is exactly what these
    // assertions exist to prevent, so the reason is recorded beside it rather than in a commit message.
    expect(SWEEP_LEADING.length).toBe(10);
    expect(SWEEP_PAYLOAD.length).toBe(4);
    expect(SWEEP_TRAILING.length).toBe(6);
    expect(SWEEP_FAMILIES.length).toBe(3);
    const CELLS_PER_FAMILY =
      SWEEP_LEADING.length * SWEEP_PAYLOAD.length * SWEEP_TRAILING.length;
    expect(CELLS_PER_FAMILY).toBe(240);

    let swept = 0;
    for (const family of SWEEP_FAMILIES) {
      for (const leading of SWEEP_LEADING) {
        for (const payload of SWEEP_PAYLOAD) {
          for (const trailing of SWEEP_TRAILING) {
            const line = `${leading.text}${payload.spell(family.familyChar)}${trailing.text}`;
            // A failing cell names ALL THREE axis labels, the position and the token family, so a
            // future failure says WHICH CELL regressed rather than only that a count moved.
            const where = `leading=[${leading.label}] payload=[${payload.label}] trailing=[${trailing.label}] position=[${family.position}] token=[${family.token}]`;
            const expectedKind = expectedVerdict(
              leading.label,
              payload.label,
              trailing.label,
              family.position,
            );
            const text = buildDelimiterDoc(line, family.position);
            expect(projectVerdict(line, family.position), where).toBe(expectedKind);

            // The observable projection, asserted on the PUBLIC surface the guards consume.
            const parsed = parseFrontmatter(text);
            switch (expectedKind) {
              case "legal":
                expect(hasSpawnGrant(text), where).toEqual({
                  ok: true,
                  value: true,
                });
                break;
              case "refuse":
                expect(parsed.ok, where).toBe(false);
                if (!parsed.ok) {
                  expect(parsed.reason, where).toContain(
                    `${family.position} delimiter position`,
                  );
                  expect(parsed.reason, where).not.toMatch(/never closed/);
                }
                // The load-bearing half, for the OPENING position: NOT the silent no-grant arm.
                expect(hasSpawnGrant(text), where).not.toEqual({
                  ok: true,
                  value: false,
                });
                break;
              case "not-a-delimiter":
                if (family.position === "opening") {
                  // The keyless SUCCESS arm, deliberately untouched: this document never opened a
                  // block, so its `tools:` line is body prose and carries no grant.
                  expect(hasSpawnGrant(text), where).toEqual({
                    ok: true,
                    value: false,
                  });
                } else {
                  // Nothing closes the block, so the unterminated-block refusal is what is observed.
                  expect(parsed.ok, where).toBe(false);
                  if (!parsed.ok) {
                    expect(parsed.reason, where).toMatch(/never closed/);
                  }
                }
                break;
            }
            swept += 1;
          }
        }
      }
    }
    // The TOTAL cell count, asserted as a number. (D-50: 648 -> 720 with axis 1's tenth member.)
    expect(swept).toBe(720);
    expect(swept).toBe(CELLS_PER_FAMILY * SWEEP_FAMILIES.length);
  });

  // ── D-50 / WR-02: INDENTATION DECIDES WHETHER A LINE IS AT A DELIMITER POSITION AT ALL ────────
  //
  // Every row below was RED against the committed `scripts/frontmatter.js` before this change, with a
  // reason containing `delimiter position carries`, and the values asserted here are the ones a real
  // YAML 1.2 loader computes (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1), modulo this module's
  // DECLARED join contract: a block scalar's lines are joined with a single space, so where libyaml
  // returns `"intro\n---\noutro\n"` this module returns `intro --- outro`. Token PRESENCE — which is
  // the only thing any consumer asks — is identical, and the join contract is the same one the
  // fourth-axis sweep already cross-checks against the loader.

  it("D-50 WR-02 — an indented `---` or `...` inside a block scalar is CONTENT, so the document parses instead of turning the gate red", () => {
    const ROWS: readonly {
      label: string;
      doc: string;
      description: string;
    }[] = [
      {
        label: "W2-a literal block scalar containing an indented `---`",
        doc: "---\ndescription: |\n  intro\n  ---\n  outro\nname: x\n---\nBody.\n",
        // libyaml: {"description"=>"intro\n---\noutro\n", "name"=>"x"}
        description: "intro --- outro",
      },
      {
        label: "W2-b wrapped plain description whose continuation begins with an ellipsis",
        doc: "---\ndescription: Read the docs\n  ...and then some\nname: x\n---\nBody.\n",
        // libyaml: {"description"=>"Read the docs ...and then some", "name"=>"x"}
        description: "Read the docs ...and then some",
      },
      {
        label: "W2-c folded block scalar containing an indented `...`",
        doc: "---\ndescription: >\n  intro\n  ...\n  outro\nname: x\n---\nBody.\n",
        // libyaml: {"description"=>"intro ... outro\n", "name"=>"x"}
        description: "intro ... outro",
      },
    ];

    // W2-b IS THE CHEAP ONE and it is why this is not an exotic edge: an author wrapping a long
    // `description:` whose continuation happens to start with an ellipsis turned the WHOLE foundation
    // gate red on a file the platform loads fine, and the only route back to green was deleting
    // correct documentation.
    for (const row of ROWS) {
      const parsed = parseFrontmatter(row.doc);
      expect(parsed.ok, row.label).toBe(true);
      if (parsed.ok) {
        expect(parsed.value.get("description"), row.label).toEqual([
          row.description,
        ]);
        expect(parsed.value.get("name"), row.label).toEqual(["x"]);
      }
    }

    // THE CONTROLS, both of which parsed BEFORE this change and must still parse: a payload too short
    // to be a payload, and a legal close at column 0 with its grant intact.
    const shortPayload = parseFrontmatter(
      "---\ndescription: |\n  intro\n  --\n  outro\nname: x\n---\nBody.\n",
    );
    expect(shortPayload.ok).toBe(true);
    if (shortPayload.ok) {
      expect(shortPayload.value.get("description")).toEqual(["intro -- outro"]);
    }
    expect(
      hasSpawnGrant("---\nname: x\ntools: Read, Agent(grugops-installer)\n---\nBody.\n"),
    ).toEqual({ ok: true, value: true });
  });

  it("D-50 WR-02 — the change routes a refusal to ANOTHER REFUSAL and never to a keyless success: an indented line is not a close", () => {
    // THE PROPERTY THAT MAKES THE CLOSING-POSITION CHANGE SAFE, asserted rather than argued. A
    // document whose ONLY payload-bearing line after the opening delimiter is indented has no legal
    // close, so the scan runs off the end and lands in the EXISTING unterminated-block refusal.
    //
    // RED-irrelevant and GREEN-mandatory: before this change the same document refused for a
    // different reason, so this case pins the DESTINATION arm, not the refusal itself.
    const doc =
      "---\nname: x\ntools: Read, Agent(grugops-orchestrator)\n  ---\nBody.\n";
    const parsed = parseFrontmatter(doc);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.reason).toMatch(/opened at line \d+ .* never closed/);
      expect(parsed.reason).not.toContain("delimiter position carries");
    }
    // And it is NOT the silent no-grant arm — the failure this whole phase exists to close.
    expect(hasSpawnGrant(doc)).not.toEqual({ ok: true, value: false });
  });

  it("D-50 WR-02 — the OPENING position still refuses an indented delimiter, space and tab alike, because there `not-a-delimiter` IS the keyless success arm", () => {
    // The asymmetry, measured on BOTH sides rather than assumed. Both rows were RED before this
    // change and are RED after it; an asymmetry that was never measured on both sides is an
    // assumption, and this module has shipped one of those before.
    for (const [label, indent] of [
      ["space-indented opening delimiter", " "],
      ["tab-indented opening delimiter", "\t"],
    ] as const) {
      const doc = `${indent}---\nname: x\ntools: Read, Agent(grugops-orchestrator)\n---\nBody.\n`;
      const parsed = parseFrontmatter(doc);
      expect(parsed.ok, label).toBe(false);
      if (!parsed.ok) {
        expect(parsed.reason, label).toContain(
          "opening delimiter position carries",
        );
        expect(parsed.reason, label).toContain(
          "so the delimiter does not begin where the line begins",
        );
      }
      expect(hasSpawnGrant(doc), label).not.toEqual({ ok: true, value: false });
    }
  });

  it("D-50 KIT-03 boundary — a mixed leading run is RESIDUE in BOTH orders, and refuses by name at BOTH positions", () => {
    // WHERE INDENTATION ENDS AND THE PAYLOAD BEGINS IS DECIDED ONCE. A run is indentation only when
    // it is ENTIRELY inside the declared class; one code point outside it makes the whole run residue,
    // whichever end that code point sits at. Both orders are asserted rather than assumed to fall out
    // of the split — the two spellings exercise different characters of the run and a scan that
    // stopped labelling early would pass one and fail the other.
    const ZWSP = String.fromCodePoint(0x200b);
    const ROWS: readonly { label: string; line: string; names: string }[] = [
      { label: "residue then indentation", line: `${ZWSP} ---`, names: "U+200B" },
      { label: "indentation then residue", line: ` ${ZWSP}---`, names: "U+0020" },
    ];
    for (const row of ROWS) {
      for (const position of ["opening", "closing"] as const) {
        const where = `${row.label} @ ${position}`;
        const parsed = parseFrontmatter(buildDelimiterDoc(row.line, position));
        expect(parsed.ok, where).toBe(false);
        if (!parsed.ok) {
          expect(parsed.reason, where).toContain(
            `${position} delimiter position carries`,
          );
          // A refusal this plan PRESERVES still names the offending code point in the same
          // `U+XXXXX` label shape.
          expect(parsed.reason, where).toContain(row.names);
        }
        expect(projectVerdict(row.line, position), where).toBe("refuse");
      }
    }
  });

  it("D-50 — indentation is the DECLARED class only, and the legal column-0 delimiter is byte-unchanged at both positions", () => {
    // The label must not widen into "anything that renders no glyph". A no-break space and a
    // zero-width space are invisible but are NOT the declared class, so they stay residue and refuse
    // at the closing position too — which is the position this change loosened.
    for (const [label, ch] of [
      ["NO-BREAK SPACE", String.fromCodePoint(0xa0)],
      ["ZERO WIDTH SPACE", String.fromCodePoint(0x200b)],
    ] as const) {
      expect(projectVerdict(`${ch}---`, "closing"), label).toBe("refuse");
    }
    // The positive controls: a legal delimiter at column 0, and the trailing-space and trailing-tab
    // spellings, all unchanged at both positions.
    for (const position of ["opening", "closing"] as const) {
      for (const line of ["---", "--- ", "---\t"]) {
        expect(projectVerdict(line, position), `${JSON.stringify(line)} @ ${position}`).toBe(
          "legal",
        );
      }
    }
    // `--- foo` carries NO leading run, so the empty run must not be mistaken for indentation — the
    // one boundary a two-way indentation/residue split would have got wrong at this position.
    expect(projectVerdict("--- foo", "closing")).toBe("refuse");
    expect(projectVerdict("... foo", "closing")).toBe("refuse");
  });

  // ── THE FALSE-RED CONTROL, OVER THE ONE SCAN COMPOSITION ──────────────────────────────────────

  it("D-43 false-red control — every member of the ONE spawn-grant scan composition parses, head line and block lines alike", () => {
    const root = join(import.meta.dirname, "..");
    const members = spawnGrantScan(root);

    // WHY THE CORPUS IS THE COMPOSITION AND NOT A DIRECTORY LIST. A hand-listed set here would be the
    // guard's scan answered a second time, one indirection down — a control restating the scan can
    // prove safety over a set the guard no longer scans. It consumes scripts/kit-model.ts's
    // spawnGrantScan(), which is the same function check-foundation-guards.ts consumes.
    //
    // WHAT ACTUALLY CAN FAIL HERE. Because the guard and this control now read THE SAME OBJECT, set
    // equality between the control's corpus and the guard's scan compares an object with itself and
    // can never fail — it is DOCUMENTATION OF INTENT and is deliberately not written as an assertion.
    // The two things below CAN fail: the exact two-sided cardinality, and PER-PART set equality
    // against each lister.
    expect(members.length).toBe(SPAWN_GRANT_SCAN_COUNT);
    for (const part of SPAWN_GRANT_SCAN_PARTS) {
      const inComposition = members
        .filter((f) => f.startsWith(part.prefix))
        .sort();
      const expected = part
        .list(root)
        .map((rel) => `${part.prefix}${rel}`)
        .sort();
      // SET equality, never a count: three integer comparisons all pass while a decoy under
      // `.claude/agents/` displaces a real adapter, which is a within-part substitution a count misses.
      expect(inComposition, part.name).toEqual(expected);
    }

    // THE CONTROL ITSELF, IN TWO HALVES, AND IT REPORTS WHAT IT ACTUALLY READ.
    //
    // Half one: parsing a real file exercises BOTH delimiter positions under the D-44 classifier —
    // the head line goes through the opening call site, and every line of the block goes through the
    // closing scan, which classifies on the same rule. A non-empty key set is asserted so a member
    // that silently took the keyless success arm cannot be counted as "did not refuse".
    //
    // Half two: EVERY LINE INSIDE EACH BLOCK IS RE-PROBED AT THE CLOSING POSITION ON ITS OWN. The
    // whole-file parse stops at the first offending line, so a later block line's verdict would ride
    // on an earlier line's silence. Re-probing each line standalone removes that dependence. What is
    // asserted there is the absence of a DELIMITER refusal specifically: a lone `description: >-`
    // line closes nothing, so the unterminated-block refusal is expected and is not a false red.
    //
    // The counts it read are REPORTED in the assertion message, so a control passing over a shrunken
    // corpus is visible rather than silently reassuring.
    let blockLinesProbed = 0;
    const delimiterRefusals: string[] = [];
    for (const rel of members) {
      const src = readFileSync(join(root, rel), "utf8");
      const parsed = parseFrontmatter(src);
      expect(parsed.ok, rel).toBe(true);
      if (!parsed.ok) {
        delimiterRefusals.push(`${rel} (whole file): ${parsed.reason}`);
        continue;
      }
      expect(parsed.value.size, rel).toBeGreaterThan(0);

      const lines = src.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n");
      const close = lines.indexOf("---", 1);
      for (const line of lines.slice(1, close === -1 ? 1 : close)) {
        blockLinesProbed += 1;
        const probe = parseFrontmatter(buildDelimiterDoc(line, "closing"));
        if (!probe.ok && /delimiter position/.test(probe.reason)) {
          delimiterRefusals.push(`${rel} block line \`${line}\`: ${probe.reason}`);
        }
      }
    }
    expect(
      delimiterRefusals,
      `read ${members.length} scan members and ${blockLinesProbed} block lines; the strict D-44 rule must cost this repository ZERO false reds`,
    ).toEqual([]);
    expect(members.length, "scan members read").toBe(SPAWN_GRANT_SCAN_COUNT);
    expect(blockLinesProbed, "block lines probed").toBeGreaterThan(
      members.length,
    );
  });

  // ── (Plan 27-42, D-50, closing IN-05) THE ONE-GRAMMAR CLAIM'S SCOPE, DERIVED RATHER THAN STATED ──
  //
  // The module header claims "one format-aware authority per predicate, and the duplicate grammar
  // DELETED". A reader checks a claim like that with `grep`, and `grep` finds two more flat
  // frontmatter grammars in scripts/. The claim is true when SCOPED — one grammar answers "what does
  // this file's frontmatter SAY", the question this module exists for — and a scoped sentence with
  // nothing behind it is the comment-without-a-pin shape this phase has corrected twice already.
  //
  // So the scope is DERIVED. The set of `scripts/*.ts` files carrying a local frontmatter-parsing
  // construct is built by PATTERN — never from a hand-listed file name set, which is this
  // repository's second systemic failure class and would be its third recursion inside one phase —
  // sorted, compared to exactly the two named non-guard files, and its cardinality pinned.
  //
  // WHAT THE PATTERN RECOGNISES: a file that BOTH anchors a three-dash delimiter at the document head
  // (a `/^---` regex literal, a `startsWith("---")`, or an `indexOf("---") === 0`) AND carries an
  // anchored key-line match (a `^…:\s*` regex literal, or a split on the first colon).
  //
  // WHAT IT WOULD MISS, NAMED RATHER THAN LEFT UNDISCLOSED: a grammar that builds either regex from
  // concatenated fragments or a `new RegExp(...)` string; one that finds the delimiter by scanning
  // lines rather than by anchoring at byte 0; one that splits the block on something other than a
  // colon (an `=` or a tab-separated form); and one written in a language this scan does not read.
  // The pattern is a floor against the shapes a third grammar plausibly takes, not a proof that none
  // can exist.
  //
  // THE CORPUS IS EVERY TRACKED `.ts` IN THE REPOSITORY, NOT `scripts/` (found by red-teaming this
  // change). A scan scoped to `scripts/` would let a third grammar land in `install/` or `hooks/` —
  // both of which hold shipped TypeScript — and pass. The compiled `.js` twins are excluded by the
  // extension filter alone, so they are not a second copy of each fact.
  //
  // TWO EXCLUSIONS, EACH BY NAME WITH ITS REASON — neither is a hand-listed allowlist of the answer:
  //   • `frontmatter.ts` itself, because it IS the one authority and a set of "files other than the
  //     authority" that contains the authority measures nothing;
  //   • `*.test.ts`, because a case's independently-restated predicate is an INPUT to the authority
  //     rather than a second authority a consumer reads — this repository deliberately restates
  //     predicates in cases as evidence (27-41's own token regex), and no guard imports a `.test.ts`.
  const HEAD_DELIMITER_CONSTRUCTS = [
    /\/\^-{3}/, // a regex literal anchored at the document head: /^---
    /startsWith\(\s*["'`]-{3}/, // text.startsWith("---")
    /indexOf\(\s*["'`]-{3}["'`]\s*\)\s*===\s*0/, // text.indexOf("---") === 0
  ];
  const KEY_LINE_CONSTRUCTS = [
    /\^[^\n/]{0,60}:\\s\*/, // an anchored key-shaped regex literal: ^(...):\s*
    /\^[^\n/]{0,60}\\s\*:\\s\*/, // …with whitespace allowed before the colon
    /split\(\s*["'`]:["'`]\s*\)/, // a key split on the first colon
  ];
  const isGrammarSite = (src: string): boolean =>
    HEAD_DELIMITER_CONSTRUCTS.some((r) => r.test(src)) &&
    KEY_LINE_CONSTRUCTS.some((r) => r.test(src));
  // A pure classifier over supplied paths, so the live corpus and the planted-third-grammar corpus
  // go through THE SAME rule rather than through two spellings of it.
  const grammarSitesAmong = (
    paths: string[],
    read: (p: string) => string,
  ): string[] =>
    paths
      .filter((p) => p.endsWith(".ts") && !p.endsWith(".test.ts"))
      .filter((p) => !/(^|\/)frontmatter\.ts$/.test(p))
      .filter((p) => isGrammarSite(read(p)))
      .sort();
  const REPO_ROOT = join(import.meta.dirname, "..");
  const trackedTs = (): string[] =>
    execFileSync("git", ["ls-files", "*.ts"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter((p) => p !== "");
  const liveGrammarSites = (): string[] =>
    grammarSitesAmong(trackedTs(), (p) =>
      readFileSync(join(REPO_ROOT, p), "utf8"),
    );

  it("D-50 IN-05 — the set of tracked .ts files carrying a LOCAL frontmatter-parsing construct is exactly the two named non-guard files", () => {
    const tracked = trackedTs();
    // Non-vacuity: the corpus was really enumerated, and it really contains this module — a scan
    // over an empty file list would otherwise satisfy every assertion below.
    expect(tracked.length).toBeGreaterThan(10);
    expect(tracked).toContain("scripts/frontmatter.ts");

    const sites = liveGrammarSites();
    // Sorted before comparison, so a `git ls-files` order change cannot flip the assertion.
    expect(sites).toEqual([...sites].sort());
    expect(sites).toEqual([
      "scripts/context-io.ts",
      "scripts/generate-catalog.ts",
    ]);
    // Cardinality pinned as a NUMBER, so a scan that silently stops matching shrinks loudly rather
    // than passing over an empty set.
    expect(sites).toHaveLength(2);
    // Neither is a second opinion on THIS module's predicate: neither imports it, and this module
    // imports nothing relative at all, so the two grammars cannot be consulted for one question.
    for (const site of sites) {
      expect(readFileSync(join(REPO_ROOT, site), "utf8"), site).not.toMatch(
        /from\s+["']\.\/frontmatter\.js["']/,
      );
    }
    expect(
      readFileSync(join(REPO_ROOT, "scripts/frontmatter.ts"), "utf8"),
    ).not.toMatch(/^import .* from "\.\//m);
  });

  it("D-50 IN-05 — a THIRD local frontmatter grammar makes that set fail, by name", () => {
    // An assertion that was never made to fail is not a pin. Exercised against a temp directory
    // rather than by writing into the live scripts/ tree, so nothing outside the temp dir is touched.
    const dir = mkdtempSync(join(tmpdir(), "grugops-grammar-"));
    const inDir = (): string[] =>
      grammarSitesAmong(readdirSync(dir), (p) =>
        readFileSync(join(dir, p), "utf8"),
      );
    try {
      for (const real of liveGrammarSites()) {
        writeFileSync(
          join(dir, real.replace(/^.*\//, "")),
          readFileSync(join(REPO_ROOT, real), "utf8"),
        );
      }
      // A control FIRST: the copied pair alone reproduces the live answer, so the failure below is
      // caused by the plant and not by the temp directory.
      expect(inDir()).toEqual(["context-io.ts", "generate-catalog.ts"]);
      writeFileSync(
        join(dir, "scratch-third-grammar.ts"),
        [
          "export function parseFrontmatter(text: string): Record<string, string> {",
          "  const m = text.match(/^---\\n([\\s\\S]*?)\\n---\\n/);",
          "  const fm: Record<string, string> = {};",
          "  if (!m) return fm;",
          "  for (const line of m[1].split('\\n')) {",
          "    const kv = line.match(/^([A-Za-z_]+):\\s*(.*)$/);",
          "    if (kv) fm[kv[1]] = kv[2].trim();",
          "  }",
          "  return fm;",
          "}",
          "",
        ].join("\n"),
      );
      const withThird = inDir();
      expect(withThird).toContain("scratch-third-grammar.ts");
      expect(withThird).toHaveLength(3);
      expect(withThird).not.toEqual(["context-io.ts", "generate-catalog.ts"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("D-50 IN-05 — the two out-of-scope grammars' reach into the guard import graph is MEASURED, not assumed", () => {
    // THE PLAN'S OWN PREMISE HERE WAS `UNKNOWN - verify`, AND VERIFYING IT DISPROVED HALF OF IT.
    // The premise read: "generate-catalog.ts and context-io.ts are outside the import graph of every
    // guard that reads a spawn grant". Measured: `generate-catalog.ts` is outside every one of them;
    // `context-io.ts` is NOT — check-foundation-guards.ts -> check-uat-oracles.ts -> context-io.ts.
    //
    // That does not make the scoped claim false, and it is not oversold as a bypass. context-io's
    // flat grammar parses a DIFFERENT DOCUMENT CLASS — `.grugops/context/` notes, with their own
    // documented format — and is never asked about a member of the spawn-grant scan, which is why
    // the header's claim is about the PREDICATE ("what does this file's frontmatter say") and not
    // about which files happen to share a process. What the measurement buys is that the real shape
    // is asserted: if `generate-catalog.ts` ever enters a guard's closure, this fails red.
    //
    // The guard set is DERIVED — every non-test `scripts/*.ts` that imports this module — rather than
    // named, so a new consumer is covered the day it lands.
    const scriptsDir = join(import.meta.dirname);
    const tsFiles = readdirSync(scriptsDir).filter(
      (n) => n.endsWith(".ts") && !n.endsWith(".test.ts"),
    );
    const consumers = tsFiles.filter((n) =>
      /from\s+["']\.\/frontmatter\.js["']/.test(
        readFileSync(join(scriptsDir, n), "utf8"),
      ),
    );
    expect(consumers.length).toBeGreaterThan(0);
    expect(consumers).toContain("check-foundation-guards.ts");
    expect(consumers).toContain("coordinator-resolution-precheck.ts");

    const relativeImports = (n: string): string[] =>
      [
        ...readFileSync(join(scriptsDir, n), "utf8").matchAll(
          /from\s+["']\.\/([A-Za-z0-9._-]+)\.js["']/g,
        ),
      ]
        .map((m) => `${m[1]}.ts`)
        .filter((f) => tsFiles.includes(f));
    const closure = new Set<string>();
    const stack = [...consumers];
    while (stack.length > 0) {
      const f = stack.pop()!;
      if (closure.has(f)) continue;
      closure.add(f);
      for (const d of relativeImports(f)) if (!closure.has(d)) stack.push(d);
    }
    // Non-vacuity: the closure really was walked and really does contain this module.
    expect(closure.has("frontmatter.ts")).toBe(true);
    expect(closure.size).toBeGreaterThan(consumers.length);
    // The measured shape, asserted in BOTH directions so either changing fails red.
    expect(
      liveGrammarSites()
        .map((p) => p.replace(/^.*\//, ""))
        .filter((s) => closure.has(s)),
    ).toEqual(["context-io.ts"]);
    expect(closure.has("generate-catalog.ts")).toBe(false);
  });

  it("D-43 ordering edge — the refusal fires on the FIRST offending position and two runs over one input are byte-identical", () => {
    // Two offending lines in one document: the reported one must be the FIRST, deterministically.
    const text = `----\nname: x\n--- foo\ntools: Read, Agent(grugops-installer)\n---\n`;
    const a = parseFrontmatter(text);
    const b = parseFrontmatter(text);
    expect(a).toEqual(b);
    expect(a.ok).toBe(false);
    if (!a.ok) {
      expect(a.reason).toContain("U+002D"); // the `----` row, not the `--- foo` one
      expect(a.reason).toContain("opening delimiter position");
    }
  });

  it("D-34 empty edge — the three input states stay exactly THREE, with the directive-prefixed document moved from the second into the third", () => {
    const withKeys = "---\nname: x\ntools: Read, Agent(o)\n---\nBody.\n";
    const noBlock = "# Heading\n\nJust body prose.\n";
    const unreadable = "%TAG !e! tag:x,2000:\n---\nname: x\ntools: Read, Agent(o)\n---\n";

    // 1. A block that opens and closes -> ok, WITH keys.
    const pKeys = parseFrontmatter(withKeys);
    expect(pKeys.ok && pKeys.value.size > 0).toBe(true);
    // 2. No block at all AND no directive prologue -> ok, with NO keys.
    const pNone = parseFrontmatter(noBlock);
    expect(pNone.ok && pNone.value.size === 0).toBe(true);
    // 3. Unreadable -> NOT ok, with a reason.
    expect(parseFrontmatter(unreadable).ok).toBe(false);

    // Stated as an identity so no two of the three can collapse into one printed result — and in
    // particular so the directive document can never again print what the body-only document prints.
    // The `noBlock` and `unreadable` entries were BYTE-IDENTICAL before this fix; that was IN-02.
    const shape = (text: string): string => {
      const p = parseFrontmatter(text);
      return JSON.stringify(p.ok ? { ok: true, keys: p.value.size > 0 } : { ok: false });
    };
    const results = [shape(withKeys), shape(noBlock), shape(unreadable)];
    expect(new Set(results).size).toBe(3);
    // The partition did not GROW — there is no fourth state.
    expect(new Set([...results, shape("---\nname: y\n---\n")]).size).toBe(3);
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

// ---------------------------------------------------------------------------
// D-47 item 2 — the grant enumeration's legal character set, swept from OUTSIDE
// ---------------------------------------------------------------------------
//
// `keysGrantedAgentNames` states one legal character set and refuses everything else. This block pins
// that rule in BOTH directions from a corpus drawn from outside the rule itself, and then measures
// what the rule costs across every real grant this repository ships.
//
// WHY THE CORPUS IS DRAWN FROM THE GENERAL CATEGORIES AND NOT FROM THE FINDINGS. An allowlist swept
// only by the characters prior findings named can detect a NARROWING of the set and is structurally
// incapable of failing on a character no finding has yet reported. That is the same circularity this
// phase found twice already — once over D-42's alphabet (a sweep and a predicate drawing from one
// set, which would have shipped green over a live combining-mark bypass) and once over D-44's arm
// structure (one test construction per declared arm, so no input outside both arms was ever a
// candidate for a case). Drawing the corpus from the YAML indicator set and from the punctuation and
// symbol GENERAL CATEGORIES is what makes the completeness claim non-circular: `¶`, `฿` and `܇` are
// members here, and no finding in this phase has ever mentioned them.
describe("frontmatter — the grant enumeration's legal character set (D-47 item 2 / KIT-03)", () => {
  // ── THE CORPUS, AS NAMED DATA ─────────────────────────────────────────────────────────────────
  //
  // Part one: every YAML indicator character, listed explicitly WITH ITS YAML MEANING. Two of them
  // (`-` and `,`) are MEMBERS OF THE LEGAL SET, and they are kept in the corpus deliberately — they
  // are what makes this sweep pin both directions instead of only the refusing one.
  const YAML_INDICATORS = [
    { char: "-", name: "block sequence entry" },
    { char: "?", name: "mapping key" },
    { char: ":", name: "mapping value" },
    { char: ",", name: "flow collection entry separator" },
    { char: "[", name: "flow sequence start" },
    { char: "]", name: "flow sequence end" },
    { char: "{", name: "flow mapping start" },
    { char: "}", name: "flow mapping end" },
    { char: "#", name: "comment" },
    { char: "&", name: "anchor" },
    { char: "*", name: "alias" },
    { char: "!", name: "tag" },
    { char: "|", name: "literal block scalar" },
    { char: ">", name: "folded block scalar" },
    { char: "'", name: "single quote" },
    { char: '"', name: "double quote" },
    { char: "%", name: "directive" },
    { char: "@", name: "reserved" },
    { char: "`", name: "reserved" },
  ] as const;

  // Part two: a bounded, deterministic stride sample of the punctuation and symbol general
  // categories. A FIXED stride and a FIXED cap, so the sample is byte-identical on every run and on
  // every platform — a pin whose corpus varies between runs pins nothing.
  const ENUM_SWEEP_STRIDE = 7;
  const ENUM_SWEEP_CAP = 60;
  const ENUM_SWEEP_CLASSES = [
    { name: "P (punctuation)", re: /\p{P}/u },
    { name: "S (symbols)", re: /\p{S}/u },
  ] as const;

  // A STRUCTURAL NOTE ON `(` AND `)`, recorded rather than left to be rediscovered. Neither is in the
  // sampled corpus: their code points (0x28, 0x29) are not multiples of the stride. That is luck, not
  // design, and `)` could not be swept by this construction anyway — `)` TERMINATES the scoped-grant
  // expression, so `Agent(alpha)b, gamma)` carries the complete enumeration `alpha` and correctly
  // returns the success arm. `(` is swept by its own named case in the oracle block above. A future
  // author changing the stride should expect `)` to need that carve-out stated, not silently widened.

  function sampleEnumSweep(): { char: string; name: string; cp: number }[] {
    const out: { char: string; name: string; cp: number }[] = [];
    const filled = new Map(ENUM_SWEEP_CLASSES.map((c) => [c.name, 0]));
    for (let cp = 0; cp <= 0x10ffff; cp += ENUM_SWEEP_STRIDE) {
      const ch = String.fromCodePoint(cp);
      for (const c of ENUM_SWEEP_CLASSES) {
        if (filled.get(c.name)! >= ENUM_SWEEP_CAP) continue;
        if (c.re.test(ch)) {
          filled.set(c.name, filled.get(c.name)! + 1);
          out.push({ char: ch, name: `${c.name} ${cp}`, cp });
          break;
        }
      }
    }
    return out;
  }

  const CORPUS = [
    ...YAML_INDICATORS.map((i) => ({
      char: i.char,
      name: `YAML indicator: ${i.name}`,
    })),
    ...sampleEnumSweep().map((s) => ({ char: s.char, name: s.name })),
  ];

  // THE LEGAL SET, RESTATED INDEPENDENTLY AS DATA. This is deliberately NOT `ENUMERATION_LEGAL_CHARS`
  // and deliberately NOT computed by calling the module's predicate: an expectation taken from the
  // thing under test moves whenever the thing under test moves, so a widened legal set would relax
  // this sweep in silence instead of failing it. The two are pinned EQUAL by its own case below, so a
  // widening fails loudly there rather than dissolving here.
  const LEGAL_AS_DATA = new Set(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-., ",
  );

  const cpLabel = (c: string): string =>
    `U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;
  const enumDoc = (tools: string): string =>
    `---\nname: x\ntools: ${tools}\n---\nBody.\n`;

  it("the corpus is DERIVED and its size is ASSERTED, and the independently-stated legal set matches the module's constant", () => {
    // DERIVE THE SET, ASSERT THE COUNT — this repository's own rule, applied to the corpus itself. A
    // class silently emptied by a future regex or engine change would otherwise shrink the sweep in
    // silence, and a shrunken sweep passes for the wrong reason.
    const sampled = sampleEnumSweep();
    for (const c of ENUM_SWEEP_CLASSES) {
      expect(
        sampled.filter((s) => s.name.startsWith(c.name)).length,
        c.name,
      ).toBe(ENUM_SWEEP_CAP);
    }
    expect(YAML_INDICATORS.length, "YAML indicator characters").toBe(19);
    expect(sampled.length, "stride-sampled general-category members").toBe(120);
    expect(CORPUS.length, "total corpus members").toBe(139);

    // Determinism: the sample is a pure function of the stride and the cap, so two builds agree.
    expect(sampleEnumSweep()).toEqual(sampled);

    // Four indicators (`#`, `*`, `?`, `[`) are ALSO stride-sampled under their general category. The
    // duplication is retained on purpose — an indicator swept under both its YAML meaning and its
    // Unicode class names the failure twice with two different reasons, which is more useful than a
    // deduplicated corpus.
    const dupes = CORPUS.filter(
      (m, i) => CORPUS.findIndex((o) => o.char === m.char) !== i,
    );
    expect(dupes.map((d) => d.char).sort()).toEqual(["#", "*", "?", "["]);

    // THE DRIFT PIN. The sweep's expectations come from `LEGAL_AS_DATA`; the module refuses against
    // `ENUMERATION_LEGAL_CHARS`. If they ever diverge, this case fails and names the divergence —
    // which is exactly what must happen if someone widens the legal set to make a real enumeration
    // pass, since this plan's prohibitions forbid that resolution.
    expect([...LEGAL_AS_DATA].sort()).toEqual([...ENUMERATION_LEGAL_CHARS].sort());
    expect(LEGAL_AS_DATA.size).toBe(67);
  });

  it("D-47 item 2 sweep — every corpus member OUTSIDE the legal set refuses by name, and every member INSIDE it does not", () => {
    // RED, measured against the PRE-TASK-1 committed scripts/frontmatter.js on a `git archive HEAD`
    // mirror: of the 137 non-legal members, 135 did NOT refuse — they returned the SUCCESS arm
    // carrying a name no loader computes (`alpha?b`, `alpha[b`, `alpha¶b`, `alpha฿b`, …). Only the
    // two quote characters refused, through the enumerated check now deleted. That ratio — 2 refusals
    // out of 137 — is what "a denylist that grows one reported spelling at a time" measures as.
    const refusedByName: string[] = [];
    const wronglyAccepted: string[] = [];
    const legalMembersChecked: string[] = [];

    for (const member of CORPUS) {
      const tools = `Agent(alpha${member.char}b, gamma)`;
      const names = grantedAgentNames(enumDoc(tools));
      const where = `${cpLabel(member.char)} ${JSON.stringify(member.char)} [${member.name}]`;

      // The expected verdict is decided from DATA, never by asking the code under test.
      if (LEGAL_AS_DATA.has(member.char)) {
        // DIRECTION TWO: a legal character must NOT refuse. This is the half that catches a
        // narrowing, and it is why `-` and `,` are corpus members rather than carve-outs.
        expect(names.ok, `${where} is IN the legal set and must not refuse`).toBe(
          true,
        );
        legalMembersChecked.push(where);
        continue;
      }

      // DIRECTION ONE: everything else refuses, and the reason NAMES the offending character.
      if (names.ok) {
        wronglyAccepted.push(`${where} -> ok:true ${JSON.stringify(names.value)}`);
        continue;
      }
      expect(names.reason, `${where} must be NAMED by the refusal`).toContain(
        `\`${member.char}\` (${cpLabel(member.char)})`,
      );
      expect(names.reason, where).toContain(
        "outside the legal character set of a grant enumeration",
      );
      refusedByName.push(where);
    }

    expect(
      wronglyAccepted,
      `swept ${CORPUS.length} corpus members; every member outside the legal set must refuse`,
    ).toEqual([]);
    // The sweep's own size, so a corpus that shrank cannot pass vacuously.
    expect(
      refusedByName.length,
      `members outside the legal set that refused by name (of ${CORPUS.length} swept)`,
    ).toBe(137);
    expect(legalMembersChecked.length, "legal-set members swept").toBe(2);
    expect(refusedByName.length + legalMembersChecked.length).toBe(
      CORPUS.length,
    );
  });

  it("D-47 item 2 false-red control — every scoped grant enumeration in ALL 33 spawn-grant scan members still returns its full name list", () => {
    const root = join(import.meta.dirname, "..");
    const members = spawnGrantScan(root);

    // The corpus is THE ONE SCAN COMPOSITION the guard reads, imported — never a second directory
    // list restated here. A hand-listed corpus over a derived production set is the same drift class
    // with the sides swapped: the set would rot in this file instead of the source file, and stay
    // just as green while it did.
    expect(members.length, "scan members read").toBe(SPAWN_GRANT_SCAN_COUNT);

    // AN INDEPENDENTLY WRITTEN READING OF WHAT EACH FILE EXPRESSES. This is the naive comma split the
    // production function performs only AFTER its allowlist passes — which is exactly the reading
    // that is correct when every character is legal. Writing it out here rather than calling
    // `grantedAgentNames` twice is what lets the control catch an ALTERED name rather than merely a
    // refused one.
    const expressed = (
      keys: Map<string, string[]>,
    ): { names: string[]; count: number } => {
      const names = new Set<string>();
      let count = 0;
      for (const k of TOOLS_KEYS) {
        for (const v of keys.get(k) ?? []) {
          for (const m of v.matchAll(/\b(?:Agent|Task)\(([^)]*)\)/g)) {
            count += 1;
            for (const raw of m[1].split(",")) {
              const n = raw.trim();
              if (n !== "") names.add(n);
            }
          }
        }
      }
      return { names: [...names].sort(), count };
    };

    let enumerationsFound = 0;
    let filesWithEnumerations = 0;
    const refusals: string[] = [];
    const altered: string[] = [];

    for (const rel of members) {
      const src = readFileSync(join(root, rel), "utf8");
      const parsed = parseFrontmatter(src);
      expect(parsed.ok, rel).toBe(true);
      if (!parsed.ok) continue;

      const want = expressed(parsed.value);
      enumerationsFound += want.count;
      if (want.count > 0) filesWithEnumerations += 1;

      const got = grantedAgentNames(src);
      if (!got.ok) {
        // A REAL enumeration refusing is a FINDING about that enumeration — never a licence to widen
        // the legal set. It is collected and named here so it is raised rather than resolved.
        refusals.push(`${rel}: ${got.reason}`);
        continue;
      }
      // By MEMBERSHIP, not merely by count: two equal counts pass while one name is substituted for
      // another, which is the whole failure class this predicate exists to prevent.
      if (JSON.stringify(got.value) !== JSON.stringify(want.names)) {
        altered.push(
          `${rel}: got ${JSON.stringify(got.value)} want ${JSON.stringify(want.names)}`,
        );
      }
    }

    // The control REPORTS WHAT IT READ, so a control passing over a shrunken corpus is visible as the
    // anomaly it would be rather than silently reassuring.
    const read = `read ${members.length} scan members carrying ${enumerationsFound} scoped grant enumeration(s) across ${filesWithEnumerations} file(s)`;
    expect(refusals, `${read}; the allowlist must cost this repository ZERO false reds`).toEqual([]);
    expect(altered, `${read}; every name list must match the naive reading exactly`).toEqual([]);
    expect(members.length, `${read}; scan member count`).toBe(33);

    // THE MEASURED THINNESS OF THIS CORPUS, PINNED RATHER THAN GLOSSED. Across all 33 scan members
    // there is exactly ONE scoped grant enumeration — the coordinator's — carrying 16 names. The
    // other 32 members either grant nothing or grant unscoped, and for them this control asserts the
    // weaker (still real) fact that `grantedAgentNames` does not refuse and returns an empty list.
    //
    // So "measured zero false reds across 33 members" must not be read as "33 enumerations were
    // exercised". It was one, and that is why the coordinator's case below is load-bearing rather
    // than decorative. The numbers are asserted so a SECOND enumeration shipping in this repository
    // fails this case and forces a reader to notice the corpus changed, instead of quietly making
    // the control look broader than it is.
    expect(enumerationsFound, `${read}; scoped enumerations found`).toBe(1);
    expect(filesWithEnumerations, `${read}; files carrying one`).toBe(1);
  });

  it("D-47 item 2 false-red control — the COORDINATOR's own multi-name enumeration, by count AND by membership", () => {
    // The single most important false-red case in the repository: the one enumeration with more than
    // a handful of names, and the one whose closure the KIT-03 oracle and
    // coordinator-resolution-precheck both compute set equality over. If the allowlist were even
    // slightly too narrow, this is the file it would break.
    const root = join(import.meta.dirname, "..");
    const coordinator = readFileSync(
      join(root, ".claude/agents/grugops-orchestrator.md"),
      "utf8",
    );
    const names = grantedAgentNames(coordinator);
    expect(names.ok, "the coordinator's own grant must not refuse").toBe(true);
    if (!names.ok) return;

    // BY MEMBERSHIP: the rule (every agent adapter except the coordinator itself), derived from the
    // kit-model authority rather than restated as a literal list.
    const expectedClosure = listAgentAdapters(root)
      .map((rel) => rel.replace(/\.md$/, ""))
      .filter((n) => n !== "grugops-orchestrator")
      .sort();
    expect(names.value, `the coordinator grants ${names.value.length} name(s)`).toEqual(
      expectedClosure,
    );
    // AND BY COUNT, so a closure that collapsed to a handful cannot satisfy the membership check
    // against an equally-collapsed derivation.
    expect(names.value.length, "coordinator granted-name count").toBe(16);

    // Every character of that real enumeration is inside the legal set — the measured reason the
    // allowlist costs this repository nothing.
    for (const n of names.value) {
      for (const c of n) {
        expect(
          LEGAL_AS_DATA.has(c),
          `${n} carries ${cpLabel(c)}, which the legal set would refuse`,
        ).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// D-48 — QUOTE STATE IS A PROPERTY OF THE SCALAR, NOT OF THE PHYSICAL LINE
// (27-REVIEW-GAPS-6 § CR-01 + § WR-01, round 6, plus the JOIN direction)
// ---------------------------------------------------------------------------
//
// The SIXTH spelling of this module's founding failure, and the first that is not inside a predicate
// at all. `stripComment`, `startsWithReference` and the `SEQ_ITEM` item boundary each decided their
// state per PHYSICAL LINE while `flattenBlock` handed them one line at a time. A YAML scalar does not
// end at a line boundary, so a multi-line quoted scalar was analysed as N independent single-line
// documents — and the module got it wrong in THREE DIRECTIONS AT ONCE.
//
// EVERY ROW BELOW WAS MEASURED RED AGAINST THE COMMITTED `scripts/frontmatter.js` ON A
// `git archive HEAD` MIRROR BEFORE THE FIX, and every "platform" expectation was resolved against a
// REAL YAML 1.2 LOADER (`/usr/bin/ruby -ryaml` — Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1) rather
// than asserted from reading. A case that was never red is not a pin; a platform claim with no loader
// behind it is an assertion, not a verification.
describe("frontmatter — the carried scalar quote state (D-48 / SPAWN-04 + KIT-03)", () => {
  const doc = (body: string): string => `---\nname: x\n${body}\n---\nBody.\n`;
  const TOKEN = "Agent(grugops-orchestrator)";

  // ── CR-01 — the `#` direction: a hidden token on the silent no-grant SUCCESS arm ───────────────
  //
  // Measured RED: each of the three returned `{ok:true,value:false}` with NO refusal, while libyaml
  // returned the grant. The scanner returned the empty string for a continuation line whose first
  // character was `#`, so the continuation was discarded WHOLE and the token on it was hidden.

  it("CR-01 A — a `#` on the continuation line of a wrapped DOUBLE-quoted scalar is content, not a comment", () => {
    const text = doc(`tools: "Read,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    const p = parseFrontmatter(text);
    // libyaml: {"tools"=>"Read, # x, Agent(grugops-orchestrator)"} — byte-equal.
    expect(p.ok && p.value.get("tools")).toEqual([`Read, # x, ${TOKEN}`]);
  });

  it("CR-01 B — the same, in a wrapped SINGLE-quoted scalar", () => {
    const text = doc(`tools: 'Read,\n  # x, ${TOKEN}'`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("tools")).toEqual([`Read, # x, ${TOKEN}`]);
  });

  it("CR-01 C — the same inside a wrapped BLOCK-SEQUENCE item, which is the shipped idiom", () => {
    // All 7 shipped skills and all 17 shipped agent adapters write `allowed-tools:` / `tools:` as a
    // block sequence of `  - Item` lines, so this is the spelling a drifting author would actually
    // write. Planted on BOTH distribution twins of skills/plan/SKILL.md it printed ALL CHECKS PASSED
    // at exit 0 against the committed build, while the identical grant WITHOUT the line break exited 1.
    const text = doc(`tools:\n  - Read\n  - "Write,\n    # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("tools")?.[0]).toContain(TOKEN);
  });

  it("CR-01 control — the identical value on ONE line was ALWAYS granted, so the line break was the whole defect", () => {
    const text = doc(`tools: "Read, # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
  });

  // ── WR-01 — the `*` / `!` / `&` direction: the same reset, failing RED on correct documentation ─
  //
  // Measured RED: each returned the failure arm with a reason containing `anchor or alias`, over a
  // document libyaml loads to a plain description string. A false red is a red gate whose only cure
  // is deleting correct documentation, which D-34 records as the worse of the two directions.

  const WR01: ReadonlyArray<readonly [string, string, string]> = [
    ["a — markdown emphasis", "*emphasis* here", "see *emphasis* here"],
    ["b — a bare `!`", "!important stuff", "see !important stuff"],
    ["c — `R&D`-shaped text", "&D work", "see &D work"],
  ];

  for (const [label, continuation, expected] of WR01) {
    it(`WR-01 ${label} — a sigil at position 0 of a CONTINUATION line is content, and the document parses`, () => {
      const text = doc(`description: "see\n  ${continuation}"`);
      const p = parseFrontmatter(text);
      expect(p.ok, `expected the success arm, got: ${p.ok ? "" : p.reason}`).toBe(true);
      // libyaml loads each of these to exactly this plain string.
      expect(p.ok && p.value.get("description")).toEqual([expected]);
      expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    });
  }

  // ── The JOIN direction — the item boundary, named in NO review and reproduced by the planner ────
  //
  // `SEQ_ITEM` was tested against the trimmed text of EVERY indented line with no knowledge of
  // whether a quoted scalar was open, so a `-` opening a continuation line was read as a NEW item:
  // it re-routed that line through the item path (where the comment scanner then deleted it) AND it
  // set `cur.seq`, flipping the join separator for the WHOLE key from `" "` to `", "`.

  it("JOIN a — a `-` opening the continuation line of an open quoted scalar is CONTENT, and the grant survives", () => {
    const text = doc(`tools: "Read,\n  - # n, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    const p = parseFrontmatter(text);
    // libyaml: {"tools"=>"Read, - # n, Agent(grugops-orchestrator)"} — byte-equal. Measured RED, the
    // flattened value was the truncated `"Read,`.
    expect(p.ok && p.value.get("tools")).toEqual([`Read, - # n, ${TOKEN}`]);
  });

  it("JOIN b — the same inside a wrapped block-sequence item", () => {
    const text = doc(`tools:\n  - Read\n  - "Write,\n    - # n, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    const p = parseFrontmatter(text);
    // Measured RED, the flattened value was the truncated `Read, "Write,`.
    expect(p.ok && p.value.get("tools")?.[0]).toContain(TOKEN);
  });

  it("JOIN c — the item boundary INVENTED A NAME with no comment and no reference involved", () => {
    // This direction never passes through a comment or a node-start test. The dash alone changed the
    // join separator, which changed where `keysGrantedAgentNames` splits, which produced a name the
    // document does not express — on the `ok: true` arm the enumerator's own doc block promises is
    // safe. That set feeds the KIT-03 closure equality and the coordinator-resolution precheck.
    const wrapped = doc('tools: "Agent(alpha, ga\n  - mma)"');
    const single = doc("tools: Agent(alpha, ga - mma)");
    // Measured RED: wrapped enumerated ["alpha","ga","mma"] where single enumerated ["alpha","ga - mma"].
    // libyaml loads BOTH documents to the identical value `Agent(alpha, ga - mma)`.
    expect(grantedAgentNames(wrapped)).toEqual(grantedAgentNames(single));
    expect(grantedAgentNames(wrapped)).toEqual({
      ok: true,
      value: ["alpha", "ga - mma"],
    });
  });

  // ── ADJACENCY, ASSERTED IN BOTH DIRECTIONS AND AT BOTH KINDS OF BOUNDARY ───────────────────────
  //
  // Where a quote closes exactly at end-of-line the NEXT line starts OUTSIDE the scalar, so a `#` on
  // it is a comment again AND a leading `-` on it is an item boundary again. The just-touching cases
  // are asserted rather than assumed to fall out of the carry.

  it("adjacency — a quote closing exactly at END-OF-LINE leaves the next line's `#` a comment again", () => {
    const text = doc('description: "see\n  more"\n  # this really is a comment');
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("description")).toEqual(["see more"]);
  });

  it("adjacency — a quote closing exactly at END-OF-LINE leaves the next line's leading `-` an ITEM BOUNDARY again", () => {
    // The quoted scalar closes on its own line; what follows is a genuine sibling item, so the key's
    // separator is the block sequence's `", "` and NOT the scalar fold's `" "`.
    const text = doc('tools:\n  - "Read,\n    Grep"\n  - Write');
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("tools")).toEqual(['"Read, Grep", Write']);
  });

  it("adjacency — a quote closing immediately before a `#` on the SAME line leaves that `#` a comment", () => {
    const text = doc('description: "see\n  more" # and this is a comment');
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("description")).toEqual(["see more"]);
  });

  // ── THE CONTROLS: what the carry must NOT have narrowed ────────────────────────────────────────

  it("a genuine multi-item block sequence with NO open quote flattens byte-identically", () => {
    // This is the shipped `allowed-tools:` idiom. If the carry had narrowed it, every skill and
    // adapter in the kit would have changed value at once.
    const text = doc("allowed-tools:\n  - Read\n  - Write\n  - Bash\n  - Glob\n  - Grep");
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("allowed-tools")).toEqual([
      "Read, Write, Bash, Glob, Grep",
    ]);
  });

  it("a real anchor, alias and unresolved tag at a GENUINE node start are still refused BY NAME", () => {
    const refused = [
      "_t: &t Read, Agent(grugops-orchestrator)\ntools: Read",
      "tools: *t",
      "tools: !!seq [*t]",
      "tools:\n  - &t Read",
    ];
    for (const body of refused) {
      const r = parseFrontmatter(doc(body));
      expect(r.ok, body).toBe(false);
      expect(!r.ok && r.reason, body).toContain("anchor or alias");
    }
  });

  it("a single-line trailing comment is still stripped, byte for byte", () => {
    const p = parseFrontmatter(doc("tools: Read, Grep   # not part of the value"));
    expect(p.ok && p.value.get("tools")).toEqual(["Read, Grep"]);
  });

  // ── THE REGRESSION THE VALUE MAP CAUGHT, PINNED SO IT CANNOT RETURN ────────────────────────────

  it("an apostrophe inside a PLAIN scalar opens nothing across a line boundary (the carry is gated on the NODE START)", () => {
    // A quote character is only a quote where a node may BEGIN. The first draft of the carry stored
    // the scanner's exiting flags unconditionally, so this lone apostrophe propagated a phantom open
    // quote and swallowed the NEXT line's item boundary — MERGING two genuine sibling list items.
    // Invisible to every case in this suite and to all nine CR-01/WR-01/JOIN anchors above; caught
    // only by comparing the flattened value map over all tracked markdown files before and after,
    // which named 10 real `.planning/` documents. A change this far upstream is proven by the values
    // it produces over the real corpus, not by the rows it was written to repair.
    const text = doc(
      "provides:\n  - headroom for 27-06's frontmatter key\n  - capability-keyed spawn instruction",
    );
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("provides")).toEqual([
      "headroom for 27-06's frontmatter key, capability-keyed spawn instruction",
    ]);
  });

  it("an ODD number of apostrophes in a plain scalar still cannot leak state into the NEXT key", () => {
    const text = doc(
      "summary: the orchestrator's job\ntools: Read # a real comment\ncoordinator: true",
    );
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("tools")).toEqual(["Read"]);
    expect(p.ok && p.value.get("coordinator")).toEqual(["true"]);
  });

  it("a `|` / `>` block scalar is untouched — its continuation lines were already exempt", () => {
    const folded = doc(`tools: >-\n  Read, # x, ${TOKEN}`);
    const literal = doc(`tools: |-\n  Read, # x, ${TOKEN}`);
    for (const text of [folded, literal]) {
      const p = parseFrontmatter(text);
      expect(p.ok && p.value.get("tools")).toEqual([`Read, # x, ${TOKEN}`]);
      expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    }
  });

  // ── THE PLAIN WRAPPED SCALAR — THE SAME THREE DIRECTIONS, THE SAME ROOT CAUSE ─────────────────
  //
  // `openQuote` alone closes only the QUOTED spellings. Measured against the build that landed the
  // quote carry, the PLAIN wrapped scalar still carried all three directions, so `nodeOnKeyLine`
  // closes them here rather than in a later plan: closing only the spelling a finding happened to
  // report is the enumerate-the-bad shape this phase has now corrected six times.
  //
  // The rule is YAML's own and was resolved against libyaml in both directions: once a scalar has
  // begun on the key line every following indented line CONTINUES it, and where the key line carries
  // no value the indented lines are themselves the node starts.

  it("plain wrapped — a `*` / `!` / `&` opening a continuation line is CONTENT, not a node property", () => {
    // Measured RED against the quote-carry build: each was REFUSED as an anchor or alias. libyaml
    // loads all three to a plain string, so the refusal was a red gate over correct documentation.
    const expectations: ReadonlyArray<readonly [string, string]> = [
      [`*${TOKEN}`, `Read, *${TOKEN}`],
      [`!${TOKEN}`, `Read, !${TOKEN}`],
      [`&${TOKEN}`, `Read, &${TOKEN}`],
    ];
    for (const [continuation, loaderValue] of expectations) {
      const text = doc(`tools: Read,\n  ${continuation}`);
      const p = parseFrontmatter(text);
      expect(p.ok, continuation).toBe(true);
      expect(p.ok && p.value.get("tools"), continuation).toEqual([loaderValue]);
    }
  });

  it("plain wrapped — a leading `-` on a continuation line is CONTENT, so no name is invented", () => {
    // Measured RED against the quote-carry build: the wrapped form enumerated ["alpha","ga","mma"]
    // where the document — and libyaml — express ["alpha","ga - mma"]. This direction reaches a set
    // equality with no comment and no reference anywhere in it.
    const wrapped = doc("tools: Agent(alpha, ga\n  - mma)");
    const single = doc("tools: Agent(alpha, ga - mma)");
    expect(grantedAgentNames(wrapped)).toEqual(grantedAgentNames(single));
    const p = parseFrontmatter(wrapped);
    // libyaml: {"tools"=>"Agent(alpha, ga - mma)"} — byte-equal.
    expect(p.ok && p.value.get("tools")).toEqual(["Agent(alpha, ga - mma)"]);
  });

  it("plain wrapped — a `#` opening a continuation line IS still a comment (the quote state, not the node, decides that)", () => {
    // The two carried facts are genuinely different and must not be collapsed into one. libyaml:
    // {"tools"=>"Read,"} — the token is a comment and the module must agree.
    const text = doc(`tools: Read,\n  # ${TOKEN}`);
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("tools")).toEqual(["Read,"]);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
  });

  it("a key line carrying ONLY a comment begins no node, so the following lines are still node starts", () => {
    // libyaml takes the value from the continuation line: {"tools"=>"Agent(grugops-orchestrator)"}.
    const text = doc(`tools: # x\n  ${TOKEN}`);
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("tools")).toEqual([TOKEN]);
    // And a genuine anchor arriving there is still at a node start, so it is still refused.
    const anchored = doc("tools: # x\n  &t Read");
    const r = parseFrontmatter(anchored);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toContain("anchor or alias");
  });

  it("the ESCAPE allowlist still fires on a continuation line of an open double-quoted scalar", () => {
    // The carry must not have created a new application point where D-30's refusal is skipped: a
    // non-allowlisted escape arriving on a continuation line is still refused rather than flattened
    // into a value no loader computes.
    const text = doc('tools:\n  - "Read,\n    \\x41gent(grugops-orchestrator)"');
    const r = parseFrontmatter(text);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toContain("\\x");
  });
});

// ---------------------------------------------------------------------------
// D-49 — THE FOURTH SWEEP AXIS: a corpus enumerated over a construct that SPANS LINES
// ---------------------------------------------------------------------------
//
// WHY A FOURTH AXIS AT ALL, AND WHY IT SITS BESIDE THE D-45 CROSS-PRODUCT RATHER THAN INSIDE IT.
// `SWEEP_LEADING`, `SWEEP_PAYLOAD` and `SWEEP_TRAILING` each describe a DELIMITER LINE. The three
// axes below describe a VALUE THAT SPANS LINES. Folding them into one product would multiply two
// unrelated corpora and make any failure unreadable, so they are a corpus BESIDE that one.
//
// THIS IS THE THIRD CIRCULARITY AXIS THIS PHASE HAS FOUND, AND IT IS THE MOST EXPENSIVE.
//
//   • Round 4 found the ALPHABET axis — a sweep and a predicate drawing from one character set.
//   • Round 5 found the ARM-STRUCTURE axis — one construction per declared arm, so no input outside
//     both arms was ever a candidate for a case.
//   • Round 6 found THE UNIT THE CORPUS IS GENERATED OVER. The round-6 sweep was non-circular over
//     its own alphabet AND over its own arm structure, and was STRUCTURALLY INCAPABLE of failing on
//     the D-48 defect, because all three of its axes are properties of ONE PHYSICAL LINE and the
//     defect lives BETWEEN two. It passed, green, over a live spawn-grant bypass.
//
//   THE COROLLARY, STATED FOR THE NEXT READER: a corpus generated over a SMALLER UNIT than the
//   construct under test proves nothing about the construct. Before trusting a sweep's completeness
//   claim, ask what its cells are made of and whether the defect class can even be expressed in one.
describe("frontmatter — the multi-line scalar sweep (D-49 / SPAWN-04 + KIT-03)", () => {
  const TOKEN = "Agent(grugops-orchestrator)";
  const L1_BASE = "Read,";

  // ── AXIS 1: SCALAR STYLE (6) ──────────────────────────────────────────────────────────────────
  //
  // Every way a `tools:` value can occupy MORE THAN ONE LINE. The last member is the shipped idiom:
  // all 7 shipped skills and all 17 shipped agent adapters write their tool list as a block sequence.
  const SWEEP_SCALAR_STYLE: readonly {
    readonly label: string;
    readonly build: (l1: string, l2: string) => string;
  }[] = [
    {
      label: "plain wrapped scalar",
      build: (l1, l2) => `tools: ${l1}\n  ${l2}`,
    },
    {
      label: "double-quoted wrapped scalar",
      build: (l1, l2) => `tools: "${l1}\n  ${l2}"`,
    },
    {
      label: "single-quoted wrapped scalar",
      build: (l1, l2) => `tools: '${l1}\n  ${l2}'`,
    },
    {
      label: "literal block scalar",
      build: (l1, l2) => `tools: |-\n  ${l1}\n  ${l2}`,
    },
    {
      label: "folded block scalar",
      build: (l1, l2) => `tools: >-\n  ${l1}\n  ${l2}`,
    },
    {
      label: "wrapped block-sequence item",
      build: (l1, l2) => `tools:\n  - Read\n  - "${l1}\n    ${l2}"`,
    },
  ];

  // ── AXIS 2: SIGIL (5) ─────────────────────────────────────────────────────────────────────────
  //
  // A character whose MEANING is decided by whether the position it occupies is a node boundary —
  // which is exactly the question the module answered per physical line. The block-sequence dash
  // belongs here for the same reason as the other four, and it is the one direction NO REVIEW NAMED:
  // omitting it would leave this sweep blind to the JOIN defect.
  //
  // EACH SIGIL IN ITS GENUINE YAML SPELLING, WHICH IS PART OF THE CORPUS AND NOT A DETAIL. A node
  // property binds TIGHT to its name (`*t`, `!tag`, `&t`) while a comment and a sequence entry take a
  // SEPARATING SPACE (`# note`, `- item`). Spelling them all the same way was the first draft of this
  // sweep and it was measurably wrong: `* Read,` is not an alias at all, so the cell tested a mangled
  // construct instead of the sigil it names, and a real loader rejects the document outright.
  const SWEEP_SIGIL: readonly {
    readonly label: string;
    readonly prefix: string;
  }[] = [
    { label: "comment `#`", prefix: "# " },
    { label: "alias `*`", prefix: "*" },
    { label: "tag `!`", prefix: "!" },
    { label: "anchor `&`", prefix: "&" },
    { label: "sequence dash `-`", prefix: "- " },
  ];

  // ── AXIS 3: PLACEMENT (3) ─────────────────────────────────────────────────────────────────────
  const SWEEP_PLACEMENT: readonly {
    readonly label: string;
    readonly onLine1: boolean;
    readonly onContinuation: boolean;
  }[] = [
    { label: "line 1", onLine1: true, onContinuation: false },
    { label: "continuation", onLine1: false, onContinuation: true },
    { label: "both", onLine1: true, onContinuation: true },
  ];

  // ── THE EXPECTED-OUTCOME RULE, STATED FROM YAML AND FROM NOTHING ELSE ──────────────────────────
  //
  // A pure function of the THREE AXIS LABELS. It never calls the module under test and never calls
  // the loader — both would make the corpus circular, which is the failure this whole block exists
  // to prevent. Its source text is read back and asserted to name no module symbol (below).
  //
  // The rules, each traceable to YAML 1.2 rather than to the implementation:
  //
  //   1. Inside a QUOTED scalar and inside a BLOCK scalar every character is content. No sigil at any
  //      placement can be a comment, a node property or an item boundary, so the document parses and
  //      the value is intact — the token on the continuation line always survives.
  //   2. In a PLAIN scalar a `#` preceded by whitespace starts a comment ON ANY LINE, so it eats the
  //      rest of the line it opens. The value is then whatever the other line contributes.
  //   3. In a PLAIN scalar `*`, `!` and `&` are node properties ONLY AT A NODE START. The key line's
  //      value position IS a node start; a continuation line is NOT.
  //   4. In a PLAIN scalar a `-` begins a block-sequence item only where a node may begin, which
  //      inside a scalar that already began on the key line it may not.
  //
  // ONE OF THE FOUR IS A MODULE CONTRACT RATHER THAN A YAML FACT, AND IT IS NAMED AS SUCH. YAML's
  // rules decide WHETHER a character at a position is content, a comment, a node property or an item
  // marker — that is rule 1-4 above and it is the whole of what this sweep pins, because it is where
  // the defect lived. What the module then DOES with a genuine node property at a genuine node start
  // is its own declared policy: D-30 refuses rather than resolves, because the value such a document
  // expresses is not the text its bytes spell. The rule below states that policy for the `refuse`
  // arm. It is a documented contract read from the module's HEADER, never from its implementation.
  //
  // THE ONE MEASURED DIVERGENCE FROM THE LOADER, RECORDED RATHER THAN HIDDEN. Of the 90 cells, the
  // loader accepts 84 and rejects 6 outright (a bare `*`, `&` or `-` at a plain scalar's node start
  // is invalid YAML — the module accepts three of those as text, which is a LONGER value and never a
  // hidden token). Of the 84 it accepts, module and loader agree on token presence in 83. The one
  // exception is `plain wrapped scalar / tag !/ line 1`: libyaml reads `! Read,` as a NON-SPECIFIC
  // TAG and loads the value, while this module refuses the unresolved tag. That refusal PRE-DATES
  // this plan, is D-30's declared policy, and points in the safe direction — a loud refusal, never a
  // hidden grant. It is named here so the next reader finds it recorded rather than "discovered".
  const expectedOutcome = (
    styleLabel: string,
    sigilLabel: string,
    placementLabel: string,
  ): { arm: "ok" | "refuse"; grant: boolean } => {
    const contentEverywhere =
      styleLabel === "double-quoted wrapped scalar" ||
      styleLabel === "single-quoted wrapped scalar" ||
      styleLabel === "wrapped block-sequence item" ||
      styleLabel === "literal block scalar" ||
      styleLabel === "folded block scalar";
    // Rule 1.
    if (contentEverywhere) return { arm: "ok", grant: true };

    const onLine1 = placementLabel === "line 1" || placementLabel === "both";
    const onContinuation =
      placementLabel === "continuation" || placementLabel === "both";

    // Rule 2. A comment eats the line it opens. The token sits on the continuation line, so it
    // survives exactly when the continuation line is NOT commented out.
    if (sigilLabel === "comment `#`") return { arm: "ok", grant: !onContinuation };

    // Rule 3. A node property at the key line's value position has no resolvable target, so the
    // document is refused (a real loader rejects it outright). On a continuation line it is text.
    if (
      sigilLabel === "alias `*`" ||
      sigilLabel === "tag `!`" ||
      sigilLabel === "anchor `&`"
    ) {
      return onLine1 ? { arm: "refuse", grant: false } : { arm: "ok", grant: true };
    }

    // Rule 4. The dash. On a continuation line of a scalar that already began, it is text. On the key
    // line it is the first character of the value's text — this module reads it that way, where a
    // real loader rejects the document instead. That divergence is deliberate and is recorded in the
    // loader cross-check below: the direction is a LONGER value, never a hidden token.
    return { arm: "ok", grant: true };
  };

  const cellDoc = (
    style: (typeof SWEEP_SCALAR_STYLE)[number],
    sigil: (typeof SWEEP_SIGIL)[number],
    placement: (typeof SWEEP_PLACEMENT)[number],
  ): string => {
    const l1 = placement.onLine1 ? `${sigil.prefix}${L1_BASE}` : L1_BASE;
    const l2 = placement.onContinuation ? `${sigil.prefix}${TOKEN}` : TOKEN;
    return `---\nname: x\n${style.build(l1, l2)}\n---\nBody.\n`;
  };

  // ── THE SWEEP ─────────────────────────────────────────────────────────────────────────────────

  it("D-49 cross-product sweep — 6 scalar styles x 5 sigils x 3 placements", () => {
    // DERIVE THE SET, ASSERT THE COUNT. A table silently emptied by a later edit shrinks the sweep
    // LOUDLY rather than quietly.
    expect(SWEEP_SCALAR_STYLE.length).toBe(6);
    expect(SWEEP_SIGIL.length).toBe(5);
    expect(SWEEP_PLACEMENT.length).toBe(3);
    const CELLS =
      SWEEP_SCALAR_STYLE.length * SWEEP_SIGIL.length * SWEEP_PLACEMENT.length;
    expect(CELLS).toBe(90);

    let swept = 0;
    for (const style of SWEEP_SCALAR_STYLE) {
      for (const sigil of SWEEP_SIGIL) {
        for (const placement of SWEEP_PLACEMENT) {
          // A failing cell names ALL THREE axis labels, so a future failure says WHICH CELL
          // regressed rather than only that a count moved.
          const where = `style=${style.label} | sigil=${sigil.label} | placement=${placement.label}`;
          const expected = expectedOutcome(
            style.label,
            sigil.label,
            placement.label,
          );
          const text = cellDoc(style, sigil, placement);
          const parsed = parseFrontmatter(text);
          expect(parsed.ok, where).toBe(expected.arm === "ok");
          const grant = hasSpawnGrant(text);
          if (expected.arm === "ok") {
            expect(grant, where).toEqual({ ok: true, value: expected.grant });
            // The VALUE and the verdict are tied together: the flattened value carries the token
            // exactly when the verdict says it grants.
            const flat = parsed.ok ? (parsed.value.get("tools") ?? []).join("") : "";
            expect(flat.includes(TOKEN), where).toBe(expected.grant);
          } else {
            expect(grant.ok, where).toBe(false);
          }
          swept += 1;
        }
      }
    }
    expect(swept).toBe(CELLS);
  });

  // ── PIN ONE: NON-CIRCULARITY, BY SOURCE INSPECTION. MANDATORY, NO SUBSTITUTE ───────────────────

  it("D-49 non-circularity — the expected-outcome rule names nothing from the module under test and is a pure function of its three arguments", () => {
    // The claim "this corpus was not generated from the code under test" is CHECKABLE, not merely
    // asserted. If this cannot be written cleanly, that is not a finding about the corpus — it is a
    // signal that the rule was written in terms of the module, which is the circularity this
    // assertion exists to catch, and the correct response is to rewrite the rule.
    const MODULE_SYMBOLS = [
      "parseFrontmatter",
      "hasSpawnGrant",
      "grantedAgentNames",
      "keysHaveSpawnGrant",
      "keysGrantedAgentNames",
      "stripComment",
      "startsWithReference",
      "unquoteChecked",
      "nodeStartQuote",
      "openQuote",
      "nodeOnKeyLine",
      "flattenBlock",
      "Accumulator",
      "SEQ_ITEM",
      "QuoteState",
      "cellDoc",
    ] as const;
    const source = expectedOutcome.toString();
    for (const symbol of MODULE_SYMBOLS) {
      expect(source, symbol).not.toContain(symbol);
    }

    // Purity: same arguments, same answer, no hidden state.
    for (const style of SWEEP_SCALAR_STYLE) {
      for (const sigil of SWEEP_SIGIL) {
        for (const placement of SWEEP_PLACEMENT) {
          const where = `${style.label}/${sigil.label}/${placement.label}`;
          expect(
            expectedOutcome(style.label, sigil.label, placement.label),
            where,
          ).toEqual(expectedOutcome(style.label, sigil.label, placement.label));
        }
      }
    }
  });

  // ── PIN TWO: A SECOND, INDEPENDENTLY WRITTEN TRUTH TABLE. ADDITIONAL, NEVER AN ALTERNATIVE ─────

  it("D-49 second pin — an independently written truth table covering EVERY continuation-column cell", () => {
    // Written out by hand from YAML's rules rather than by evaluating anything, so a single wrong
    // idea in `expectedOutcome` has to be made TWICE to survive. This covers all 30 cells of the
    // continuation column — the column that was RED before the fix and the one the three round-6
    // axes were structurally incapable of reaching.
    const TRUTH: readonly (readonly [string, string, "ok" | "refuse", boolean])[] = [
      // plain wrapped: the only style where a continuation sigil changes anything.
      ["plain wrapped scalar", "comment `#`", "ok", false],
      ["plain wrapped scalar", "alias `*`", "ok", true],
      ["plain wrapped scalar", "tag `!`", "ok", true],
      ["plain wrapped scalar", "anchor `&`", "ok", true],
      ["plain wrapped scalar", "sequence dash `-`", "ok", true],
      // double-quoted: every character is content.
      ["double-quoted wrapped scalar", "comment `#`", "ok", true],
      ["double-quoted wrapped scalar", "alias `*`", "ok", true],
      ["double-quoted wrapped scalar", "tag `!`", "ok", true],
      ["double-quoted wrapped scalar", "anchor `&`", "ok", true],
      ["double-quoted wrapped scalar", "sequence dash `-`", "ok", true],
      // single-quoted: same.
      ["single-quoted wrapped scalar", "comment `#`", "ok", true],
      ["single-quoted wrapped scalar", "alias `*`", "ok", true],
      ["single-quoted wrapped scalar", "tag `!`", "ok", true],
      ["single-quoted wrapped scalar", "anchor `&`", "ok", true],
      ["single-quoted wrapped scalar", "sequence dash `-`", "ok", true],
      // literal block scalar: content is literal.
      ["literal block scalar", "comment `#`", "ok", true],
      ["literal block scalar", "alias `*`", "ok", true],
      ["literal block scalar", "tag `!`", "ok", true],
      ["literal block scalar", "anchor `&`", "ok", true],
      ["literal block scalar", "sequence dash `-`", "ok", true],
      // folded block scalar: same.
      ["folded block scalar", "comment `#`", "ok", true],
      ["folded block scalar", "alias `*`", "ok", true],
      ["folded block scalar", "tag `!`", "ok", true],
      ["folded block scalar", "anchor `&`", "ok", true],
      ["folded block scalar", "sequence dash `-`", "ok", true],
      // the shipped idiom, wrapped: the item is a quoted scalar, so content again.
      ["wrapped block-sequence item", "comment `#`", "ok", true],
      ["wrapped block-sequence item", "alias `*`", "ok", true],
      ["wrapped block-sequence item", "tag `!`", "ok", true],
      ["wrapped block-sequence item", "anchor `&`", "ok", true],
      ["wrapped block-sequence item", "sequence dash `-`", "ok", true],
    ];

    // The table covers the WHOLE continuation column, asserted rather than assumed.
    expect(TRUTH.length).toBe(SWEEP_SCALAR_STYLE.length * SWEEP_SIGIL.length);
    expect(TRUTH.length).toBeGreaterThanOrEqual(12);

    for (const [styleLabel, sigilLabel, arm, grant] of TRUTH) {
      const where = `style=${styleLabel} | sigil=${sigilLabel} | placement=continuation`;
      const style = SWEEP_SCALAR_STYLE.find((s) => s.label === styleLabel);
      const sigil = SWEEP_SIGIL.find((s) => s.label === sigilLabel);
      const placement = SWEEP_PLACEMENT.find((p) => p.label === "continuation");
      expect(style && sigil && placement, where).toBeTruthy();
      if (!style || !sigil || !placement) continue;

      // Half one: the two independent statements of the expectation agree with each other.
      expect(expectedOutcome(styleLabel, sigilLabel, "continuation"), where).toEqual({
        arm,
        grant,
      });
      // Half two: the module agrees with the hand-written table directly, not only via the rule.
      const text = cellDoc(style, sigil, placement);
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, where).toBe(arm === "ok");
      if (arm === "ok") {
        expect(hasSpawnGrant(text), where).toEqual({ ok: true, value: grant });
      }
    }
  });

  // ── PIN THREE: THE LOADER CROSS-CHECK, AS A SEPARATE AND EXPLICITLY-SKIPPABLE CASE ─────────────

  it("D-49 loader cross-check — six named cells spanning all six scalar styles agree with a real YAML 1.2 loader on TOKEN PRESENCE", () => {
    // WHY THIS IS NOT FOLDED INTO THE SWEEP. The sweep must run everywhere; this needs a Ruby on the
    // box. Folding them would either make the sweep skip wholesale on a machine without Ruby, or make
    // this silently never run — and a silent skip is exactly the degradation these plans warn about.
    // So it probes first and PRINTS its reason when it skips, following the chmod-fixture precedent.
    let loader: string;
    try {
      loader = execFileSync(
        "/usr/bin/ruby",
        ["-ryaml", "-e", "print RUBY_VERSION"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
    } catch {
      console.warn(
        "SKIPPED D-49 loader cross-check: /usr/bin/ruby with the yaml (Psych/libyaml) library is not runnable on this machine. This is a PRINTED skip, never a silent one — the sweep and both pins above still ran.",
      );
      return;
    }
    expect(loader.length).toBeGreaterThan(0);

    // WHAT IS ASSERTED, AND WHAT IS DELIBERATELY NOT. Byte equality with the loader is NOT the
    // predicate: this module joins a block sequence with a comma-space BY CONTRACT so that one token
    // test serves every scalar form, and the loader returns a real sequence instead. The agreed
    // predicate is the single question this module actually asks — DOES THE VALUE CARRY THE SPAWN
    // TOKEN. Comparing bytes would fail on a contract difference and teach the next author to delete
    // the case.
    const NAMED_CELLS: readonly (readonly [string, string])[] = [
      ["plain wrapped scalar", "alias `*`"],
      ["double-quoted wrapped scalar", "comment `#`"],
      ["single-quoted wrapped scalar", "comment `#`"],
      ["literal block scalar", "sequence dash `-`"],
      ["folded block scalar", "anchor `&`"],
      ["wrapped block-sequence item", "comment `#`"],
    ];
    // One cell per scalar style, asserted rather than assumed, so a later edit cannot quietly narrow
    // the cross-check to the styles that happen to be easy.
    expect(NAMED_CELLS.length).toBe(SWEEP_SCALAR_STYLE.length);
    expect(new Set(NAMED_CELLS.map(([st]) => st)).size).toBe(
      SWEEP_SCALAR_STYLE.length,
    );

    const placement = SWEEP_PLACEMENT.find((p) => p.label === "continuation");
    expect(placement).toBeTruthy();
    if (!placement) return;

    for (const [styleLabel, sigilLabel] of NAMED_CELLS) {
      const style = SWEEP_SCALAR_STYLE.find((s) => s.label === styleLabel);
      const sigil = SWEEP_SIGIL.find((s) => s.label === sigilLabel);
      expect(style && sigil, `${styleLabel}/${sigilLabel}`).toBeTruthy();
      if (!style || !sigil) continue;

      const where = `style=${styleLabel} | sigil=${sigilLabel} | placement=${placement.label}`;
      const text = cellDoc(style, sigil, placement);
      // The frontmatter block only, which is what the platform hands its YAML loader.
      const block = text.split("---\n")[1];
      const loaded = execFileSync(
        "/usr/bin/ruby",
        [
          "-ryaml",
          "-e",
          'v = YAML.safe_load(STDIN.read)["tools"]; print(v.is_a?(Array) ? v.join("|") : v.to_s)',
        ],
        { input: block, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
      );
      const loaderGrants = loaded.includes(TOKEN);
      const moduleGrant = hasSpawnGrant(text);
      expect(moduleGrant.ok, where).toBe(true);
      expect(moduleGrant.ok && moduleGrant.value, where).toBe(loaderGrants);
    }
  });

  // ── PIN FOUR: THE SELF-DERIVING REPOSITORY-WIDE CONTROL. NO BASELINE, NO LITERAL, NO MIRROR ────

  it("D-49 false-red control — every tracked markdown file in this repository parses, over a corpus DERIVED at run time", () => {
    // WHY THIS CONTROL HAS NO BASELINE IMAGE. The obvious control — compare the flattened value map
    // against the pre-fix build — cannot live in a suite: its `before` image is a build that stops
    // existing the moment the fix lands, and it would have to be held on a throwaway mirror. A case
    // asserting against that either fails once the mirror is cleaned up or gets "fixed" later by
    // narrowing it until it passes, which is the degradation mode this plan's own prohibitions name.
    // That comparison was therefore run ONCE at execution time and recorded in the plan's SUMMARY.
    //
    // WHAT LIVES HERE INSTEAD IS SELF-DERIVING: it enumerates its own corpus at run time and needs no
    // number written down in advance. NO CORPUS-SIZE LITERAL APPEARS IN ANY ASSERTION BELOW. The
    // tracked-markdown count grows on every planning commit, so a literal is stale before it is
    // executed — a hand-maintained number that reads authoritative while being wrong is this
    // repository's second systemic failure class, and it is not reintroduced here to pin a control
    // written to close the first one.
    const root = join(import.meta.dirname, "..");
    const tracked = execFileSync("git", ["ls-files", "*.md"], {
      cwd: root,
      encoding: "utf8",
    })
      .split("\n")
      .filter((s) => s !== "");

    let read = 0;
    const refusals: string[] = [];
    for (const rel of tracked) {
      let body: string;
      try {
        body = readFileSync(join(root, rel), "utf8");
      } catch {
        continue; // tracked but absent from the working tree; not this control's business
      }
      read += 1;
      const parsed = parseFrontmatter(body);
      if (!parsed.ok) refusals.push(`${rel}: ${parsed.reason}`);
    }

    // The fix can only ever REMOVE a refusal, so ANY refusal here is a defect in the fix, named.
    expect(
      refusals,
      `refusals over ${read} tracked markdown files:\n${refusals.join("\n")}`,
    ).toEqual([]);
    // A shrunken corpus is visible in the message rather than silently making the control cheap. The
    // two numbers compared are BOTH derived in this same run — never one derived and one written down.
    expect(read, `derived corpus size: ${read} tracked markdown file(s) read`).toBe(
      tracked.length,
    );
    expect(read, "the derived corpus must not be empty").toBeGreaterThan(0);

    // (D-50) EXTENDED, NOT DUPLICATED. The `FALSE-RED COST` paragraph in scripts/frontmatter.ts now
    // CITES this control instead of quoting a remembered count, so the claim it makes must actually
    // be checkable here. Two additions, both over the SAME already-derived corpus — a second control
    // walking the same files would be a weaker duplicate, which this module deletes on sight:
    //
    //   1. the corpus is not merely non-empty but genuinely COVERS the surface the guards read, so a
    //      `git ls-files` that silently stopped matching cannot leave this passing over a handful of
    //      files. Compared against `spawnGrantScan()`'s own composition — DERIVED, never listed.
    //   2. every member of that surface parses to a NON-EMPTY key set, so a file that took the
    //      keyless success arm cannot be counted here as "did not refuse".
    const scanned = spawnGrantScan(root);
    const trackedSet = new Set(tracked);
    const missing = scanned.filter((rel) => !trackedSet.has(rel));
    expect(
      missing,
      `every spawn-grant scan member must be inside the derived corpus; ${missing.length} were not`,
    ).toEqual([]);

    const keyless: string[] = [];
    for (const rel of scanned) {
      const parsed = parseFrontmatter(readFileSync(join(root, rel), "utf8"));
      if (parsed.ok && parsed.value.size === 0) keyless.push(rel);
    }
    expect(
      keyless,
      `a scan member reaching the KEYLESS success arm is a silent no-grant, not a pass:\n${keyless.join("\n")}`,
    ).toEqual([]);

    // (D-50 / IN-01) EXTENDED A SECOND TIME, AND AGAIN OVER THE SAME ALREADY-DERIVED CORPUS. A second
    // control walking the same files would be a weaker duplicate; this is one more property asked of
    // the corpus this control already read.
    //
    // THE PROPERTY: no tracked markdown file that INDEPENDENTLY opens a frontmatter block may reach
    // the keyless success arm. That is precisely the IN-01 defect measured over the real repository
    // rather than over constructed rows — a prologue skip that stops one line too early sends such a
    // file to the keyless arm, which is where every silent no-grant in this phase has landed.
    //
    // "INDEPENDENTLY" MEANS THE PREMISE IS NOT COMPUTED BY THE CODE UNDER TEST. The invisible class is
    // re-typed here as data for the same reason `LEGAL_AS_DATA` is: a premise taken from the module
    // moves whenever the module moves, and a narrowed skip would then quietly narrow this check with
    // it instead of failing it.
    const VISIBLE_AS_DATA = /[\p{L}\p{N}\p{P}\p{S}]/u;
    const opensABlock = (body: string): boolean => {
      const lines = body.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n");
      let n = 0;
      while (n < lines.length && !VISIBLE_AS_DATA.test(lines[n])) n += 1;
      return n < lines.length && lines[n] === "---";
    };

    let opensCount = 0;
    const silentlyKeyless: string[] = [];
    for (const rel of tracked) {
      let body: string;
      try {
        body = readFileSync(join(root, rel), "utf8");
      } catch {
        continue;
      }
      if (!opensABlock(body)) continue;
      opensCount += 1;
      const parsed = parseFrontmatter(body);
      if (parsed.ok && parsed.value.size === 0) silentlyKeyless.push(rel);
    }
    expect(
      silentlyKeyless,
      `${silentlyKeyless.length} tracked file(s) plainly open a frontmatter block yet reached the KEYLESS success arm:\n${silentlyKeyless.join("\n")}`,
    ).toEqual([]);
    // Both numbers derived in THIS run; neither compared against anything written down. A premise that
    // silently stopped matching would make the property vacuous, and this says so in the message.
    expect(
      opensCount,
      `files that independently open a block, of ${read} read`,
    ).toBeGreaterThan(0);
  });

  // ── D-50 / IN-02: THE QUOTING RULE IS APPLIED ONLY WHERE YAML GIVES THE CONSTRUCT QUOTING ──────

  it("D-50 IN-02 — inside a `|` / `>` block scalar the value is the text the document carries: no quote pair removed, no escape resolved or refused", () => {
    // Every row was measured against the committed `scripts/frontmatter.js` BEFORE this change and
    // against /usr/bin/ruby -ryaml (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1). The `loader` field is
    // what the platform computes for the value, with the block scalar's trailing newline folded away
    // by this module's declared join contract.
    const ROWS: readonly {
      label: string;
      doc: string;
      key: string;
      value: string;
      before: string;
    }[] = [
      {
        label: "I2-a a non-allowlisted backslash inside a block scalar",
        doc: '---\nname: x\ntools: |\n  Read, "Agent(x\\q)"\n---\nBody.\n',
        key: "tools",
        // libyaml: {"tools"=>"Read, \"Agent(x\\q)\""} — there is no escape here, so nothing to refuse.
        value: 'Read, "Agent(x\\q)"',
        before: "REFUSED, naming the backslash sequence `\\q`",
      },
      {
        label: "I2-b a wholly quote-wrapped block-scalar value",
        doc: '---\nname: x\ndescription: |\n  "alpha"\n---\nBody.\n',
        key: "description",
        // libyaml: {"description"=>"\"alpha\""} — the quotes are CONTENT.
        value: '"alpha"',
        before: "parsed with the quotes STRIPPED to `alpha`",
      },
      {
        label: "I2-c a block-scalar coordinator marker carrying a quoted true",
        doc: '---\nname: x\ncoordinator: |\n  "true"\n---\nBody.\n',
        key: "coordinator",
        // libyaml: {"coordinator"=>"\"true\""} — the literal text, NOT the bare token.
        value: '"true"',
        before: "flattened to the bare `true`, so the marker MATCHED",
      },
    ];

    for (const row of ROWS) {
      const parsed = parseFrontmatter(row.doc);
      expect(parsed.ok, `${row.label} (before: ${row.before})`).toBe(true);
      if (parsed.ok) {
        expect(parsed.value.get(row.key), row.label).toEqual([row.value]);
      }
    }

    // I2-a's DESTINATION ARM, named: parse-failure -> CONVICTION. The value plainly carries the
    // token, so it is a grant. It must never land on the no-grant arm.
    expect(hasSpawnGrant(ROWS[0].doc)).toEqual({ ok: true, value: true });

    // I2-c's security consequence, on both sides. A non-coordinator file could claim the coordinator
    // marker through a construct the platform reads as the literal text `"true"`. Masked on the tree
    // as it stood by guard_wr05's exactly-one-coordinator cardinality check — defence in depth, not a
    // property of this parser.
    expect(frontmatterValueIs(ROWS[2].doc, "coordinator", "true")).toEqual({
      ok: true,
      value: false,
    });
  });

  it("D-50 IN-02 control — the escape allowlist is NOT narrowed: every NON-block value answers to it exactly as before", () => {
    // THE PRIMARY CONTROL ON THIS WHOLE CHANGE. It was passing before this task and is passing after.
    const outsideBlock = parseFrontmatter(
      '---\nname: x\ntools: Read, "Agent(x\\q)"\n---\nBody.\n',
    );
    expect(outsideBlock.ok).toBe(false);
    if (!outsideBlock.ok) {
      expect(outsideBlock.reason).toContain("backslash sequence");
      expect(outsideBlock.reason).toContain("\\q");
    }
    // A NON-block quoted marker still flattens to the bare token and still matches — the exemption is
    // scoped to the construct, not to the key.
    expect(
      frontmatterValueIs(
        '---\nname: x\ncoordinator: "true"\n---\nBody.\n',
        "coordinator",
        "true",
      ),
    ).toEqual({ ok: true, value: true });
    // The single-quoted branch, byte-unchanged, on a non-block value.
    const single = parseFrontmatter(
      "---\nname: x\ndescription: 'it''s fine'\n---\nBody.\n",
    );
    expect(single.ok).toBe(true);
    if (single.ok) {
      expect(single.value.get("description")).toEqual(["it's fine"]);
    }
    // A block scalar carrying a single-quoted-looking value keeps its quotes, because inside a block
    // scalar there is no quoting to undo in EITHER style.
    const blockSingle = parseFrontmatter(
      "---\nname: x\ndescription: |\n  'alpha'\n---\nBody.\n",
    );
    expect(blockSingle.ok).toBe(true);
    if (blockSingle.ok) {
      expect(blockSingle.value.get("description")).toEqual(["'alpha'"]);
    }
  });

  // ── THE ARM-MOVEMENT TABLE: THE ONE PROPERTY THAT MAKES BOTH OF THIS PLAN'S FIXES SAFE ─────────

  it("D-50 arm movement — every input class this plan changes moves to a NAMED arm, and NO class moves into the keyless SUCCESS arm", () => {
    // WHY THIS IS A TABLE AND NOT PROSE. "No row moves into the keyless success arm" is the single
    // property that makes both fixes safe, and a property argued in a plan is not checkable. Written
    // as data, the claim is asserted per row AND as a property over the whole table, so a row added
    // later whose destination IS the silent arm fails here rather than being reviewed by eye.
    //
    // The observed arm is read through the PUBLIC surface, exactly as the guards see it.
    type Arm =
      | "refuse-delimiter"
      | "refuse-unterminated"
      | "refuse-escape"
      | "parse-no-grant"
      | "parse-grant"
      | "keyless-success";

    const observe = (doc: string): Arm => {
      const parsed = parseFrontmatter(doc);
      if (!parsed.ok) {
        if (/never closed/.test(parsed.reason)) return "refuse-unterminated";
        if (/delimiter position carries/.test(parsed.reason))
          return "refuse-delimiter";
        return "refuse-escape";
      }
      if (parsed.value.size === 0) return "keyless-success";
      return keysHaveSpawnGrant(parsed.value) ? "parse-grant" : "parse-no-grant";
    };

    const G = "Agent(grugops-orchestrator)";
    const ZWSP = String.fromCodePoint(0x200b);

    const MOVEMENTS: readonly {
      label: string;
      doc: string;
      from: Arm;
      to: Arm;
    }[] = [
      {
        label: "indented payload line inside an open block, closing position",
        doc: `---\ntools: Read, ${G}\n  ---\nname: x\n---\nBody.\n`,
        from: "refuse-delimiter",
        to: "parse-grant",
      },
      {
        label: "indented payload line with NO legal close anywhere after it",
        doc: `---\ntools: Read, ${G}\n  ---\nBody.\n`,
        from: "refuse-delimiter",
        to: "refuse-unterminated",
      },
      {
        label: "indented payload line at the OPENING position (unchanged)",
        doc: `  ---\ntools: Read, ${G}\n---\nBody.\n`,
        from: "refuse-delimiter",
        to: "refuse-delimiter",
      },
      {
        label: "leading run carrying residue, closing position (unchanged)",
        doc: `---\ntools: Read, ${G}\n${ZWSP}---\nBody.\n`,
        from: "refuse-delimiter",
        to: "refuse-delimiter",
      },
      {
        label: "leading run carrying residue, opening position (unchanged)",
        doc: `${ZWSP}---\ntools: Read, ${G}\n---\nBody.\n`,
        from: "refuse-delimiter",
        to: "refuse-delimiter",
      },
      {
        label: "block scalar carrying a non-allowlisted backslash",
        doc: '---\nname: x\ntools: |\n  Read, "Agent(x\\q)"\n---\nBody.\n',
        from: "refuse-escape",
        to: "parse-grant",
      },
      {
        label: "block scalar whose joined value is wholly quote-wrapped",
        doc: '---\nname: x\ndescription: |\n  "alpha"\n---\nBody.\n',
        from: "parse-no-grant",
        to: "parse-no-grant",
      },
      {
        label: "the same backslash value OUTSIDE a block scalar (unchanged)",
        doc: '---\nname: x\ntools: Read, "Agent(x\\q)"\n---\nBody.\n',
        from: "refuse-escape",
        to: "refuse-escape",
      },
      // (FOUND BY RED-TEAM, NOT BY THE PLAN — named rather than accepted silently.) The ONE row whose
      // destination is a NO-GRANT success, which is the direction that needs an argument. It has one,
      // and the argument is measured on three sides:
      //
      //   1. the module's value is BYTE-EQUAL to what libyaml computes, and libyaml's own value has
      //      NO `\bAgent\b` boundary either — the `n` of the literal `\n` is glued to the `A`. Module
      //      and platform agree on the value AND on the token's absence, so there is no disagreement
      //      for a bypass to live in;
      //   2. THREE sibling spellings of the identical value — an unquoted block scalar, a plain
      //      scalar and a single-quoted scalar — ALREADY landed here before this change. The
      //      wholly-quote-wrapped block scalar was the only spelling that refused, and it refused by
      //      naming a "double-quoted scalar" that does not exist inside a block scalar. This removes
      //      an inconsistency rather than opening a path (asserted by its own case below);
      //   3. the DISCRIMINATING control on the next row: the same construct with the token after a
      //      comma CONVICTS. The exemption reports the value faithfully; it does not suppress a token.
      {
        label:
          "block scalar, wholly quoted, non-allowlisted escape gluing the token to a word character",
        doc: '---\nname: x\ntools: |\n  "Read\\nAgent(grugops-orchestrator)"\n---\nBody.\n',
        from: "refuse-escape",
        to: "parse-no-grant",
      },
      {
        label:
          "the DISCRIMINATING control — the same construct with the token on a boundary CONVICTS",
        doc: '---\nname: x\ntools: |\n  "Read\\n, Agent(grugops-orchestrator)"\n---\nBody.\n',
        from: "refuse-escape",
        to: "parse-grant",
      },
      {
        label: "a legal document, untouched",
        doc: `---\ntools: Read, ${G}\n---\nBody.\n`,
        from: "parse-grant",
        to: "parse-grant",
      },
      {
        label: "a body-only document, deliberately still keyless",
        doc: "# Heading\n\nprose\n",
        from: "keyless-success",
        to: "keyless-success",
      },
    ];

    // DERIVE THE SET, ASSERT THE COUNT. A row deleted later shrinks this LOUDLY.
    expect(MOVEMENTS.length).toBe(12);

    for (const row of MOVEMENTS) {
      expect(observe(row.doc), `${row.label}: ${row.from} -> ${row.to}`).toBe(
        row.to,
      );
    }

    // THE PROPERTY, OVER THE WHOLE TABLE. No input class this plan CHANGES may arrive at the keyless
    // success arm. The one row that sits there was already there and did not move — a body-only file
    // is a legitimate document, and turning it red would trade a silent success for a false red,
    // which D-34 records as the worse of the two.
    const arrivedSilently = MOVEMENTS.filter(
      (r) => r.to === "keyless-success" && r.from !== r.to,
    );
    expect(
      arrivedSilently.map((r) => r.label),
      "no input class may MOVE into the keyless success arm",
    ).toEqual([]);

    // And every row that DID move, moved out of a refusal into something at least as loud.
    const moved = MOVEMENTS.filter((r) => r.from !== r.to);
    expect(moved.length, "the plan changes at least three input classes").toBeGreaterThanOrEqual(3);
    for (const row of moved) {
      expect(row.to, `${row.label} destination`).not.toBe("keyless-success");
    }
  });

  it("D-50 — the four scalar spellings of ONE value now agree, which is what the block-scalar exemption actually bought", () => {
    // The wholly-quote-wrapped block scalar was the ODD ONE OUT: three sibling spellings of the exact
    // same text already reported no grant, and only this one refused — naming a "double-quoted
    // scalar" that a block scalar does not contain. This case is the reason the no-grant destination
    // in the arm-movement table above is a consistency repair and not a new path: after the change
    // all four spellings return the SAME verdict over the SAME text.
    const TOKEN = "Agent(grugops-orchestrator)";
    const SPELLINGS: readonly [string, string][] = [
      ["block, wholly quoted", `---\nname: x\ntools: |\n  "Read\\n${TOKEN}"\n---\nB\n`],
      ["block, unquoted", `---\nname: x\ntools: |\n  Read\\n${TOKEN}\n---\nB\n`],
      ["plain scalar", `---\nname: x\ntools: Read\\n${TOKEN}\n---\nB\n`],
      ["single-quoted scalar", `---\nname: x\ntools: 'Read\\n${TOKEN}'\n---\nB\n`],
    ];
    for (const [label, doc] of SPELLINGS) {
      // No `\bAgent\b` boundary exists in this text — the `n` of the LITERAL `\n` is glued to the
      // `A`. libyaml computes the same value and finds the same absence, verified at execution time.
      expect(hasSpawnGrant(doc), label).toEqual({ ok: true, value: false });
    }
    // THE DISCRIMINATING CONTROL, in all four spellings: put the token on a boundary and every one
    // convicts. A predicate that reported no-grant here would be the silent arm for real.
    const ON_BOUNDARY: readonly [string, string][] = [
      ["block, wholly quoted", `---\nname: x\ntools: |\n  "Read\\n, ${TOKEN}"\n---\nB\n`],
      ["block, unquoted", `---\nname: x\ntools: |\n  Read\\n, ${TOKEN}\n---\nB\n`],
      ["plain scalar", `---\nname: x\ntools: Read\\n, ${TOKEN}\n---\nB\n`],
      ["single-quoted scalar", `---\nname: x\ntools: 'Read\\n, ${TOKEN}'\n---\nB\n`],
    ];
    for (const [label, doc] of ON_BOUNDARY) {
      expect(hasSpawnGrant(doc), label).toEqual({ ok: true, value: true });
    }
  });
});

// ---------------------------------------------------------------------------
// D-50 / WR-03 — THE SPAWN-TOKEN OCCURRENCE IS THE UNIT, AND THE CAPTURE IS ONE
// OF THREE THINGS AN OCCURRENCE CAN BE (27-REVIEW-GAPS-6 § WR-03, round 6)
// ---------------------------------------------------------------------------
//
// `ENUMERATION_LEGAL_CHARS` is a genuine positive allowlist and it leaks nothing on the path it
// guards. It simply NEVER RUNS when the capture it examines fails to form: `SCOPED_GRANT`'s class is
// `[^)]*`, so an `Agent(` with no `)` after it produces no match at all, the loop examines nothing,
// and the function returns the SUCCESS arm with an empty list. Measured against the committed
// `scripts/frontmatter.js` on a `git archive HEAD` mirror of 68c67bb BEFORE this change:
//
//   tools: Agent(alpha, gamma       ->  {ok:true, value:[]}   an enumeration truncated by an author
//   tools: Agent(alpha, #b, gamma)  ->  {ok:true, value:[]}   a capture destroyed by comment stripping
//   tools: Read, Agent              ->  {ok:true, value:[]}   a GENUINELY unscoped grant
//   tools: Agent(alpha, gamma)      ->  {ok:true, value:["alpha","gamma"]}   the control
//
// THREE DIFFERENT FACTS, ONE ANSWER — on the arm whose name list the KIT-03 closure equality and
// coordinator-resolution-precheck's set equality are computed over. This is CR-01's shape ("the gate
// never saw the value") on a second predicate: the check was correct and the input never reached it.
describe("frontmatter — the spawn-token occurrence accounting (D-50 / WR-03 / KIT-03)", () => {
  const doc = (tools: string): string =>
    `---\nname: x\ntools: ${tools}\n---\nBody.\n`;
  const UNCLOSED = "opens a scoped enumeration that is never closed in this value";

  it("D-50 WR-03 — the truncated enumeration and the comment-destroyed capture REFUSE by name, and the genuinely unscoped grant and the well-formed control are byte-unchanged", () => {
    // Row by row, with the RED value each replaces stated beside it. A case that was never red is not
    // a pin, so the pre-change value is recorded here rather than remembered.
    const truncated = grantedAgentNames(doc("Agent(alpha, gamma"));
    expect(truncated.ok, "RED was {ok:true,value:[]} — the silent success arm").toBe(
      false,
    );
    if (!truncated.ok) {
      expect(truncated.reason).toContain(UNCLOSED);
      // The FRAGMENT is named, not merely the fault, so a reader is sent to the right bytes.
      expect(truncated.reason).toContain("`Agent(alpha, gamma`");
      expect(truncated.reason).toContain("the `(` after `Agent` has no matching `)`");
      // The shipped refusal-reason contract is kept: two assertions elsewhere in this repository
      // match a refusal reason on this substring, and a new refusal that dropped it would silently
      // weaken both while every case stayed green.
      expect(truncated.reason).toContain("anchor or alias");
      expect(truncated.reason).toContain("a name is never silently dropped or altered");
    }

    // The capture destroyed UPSTREAM, by the comment scanner rather than by the author. The flattened
    // value is `Agent(alpha,` — the enumeration this module was handed is not the enumeration the
    // document carries, and the occurrence accounting is what notices.
    const destroyed = grantedAgentNames(doc("Agent(alpha, #b, gamma)"));
    expect(destroyed.ok, "RED was {ok:true,value:[]}").toBe(false);
    if (!destroyed.ok) {
      expect(destroyed.reason).toContain(UNCLOSED);
      expect(destroyed.reason).toContain("`Agent(alpha,`");
    }

    // BYTE-UNCHANGED, both directions. These two are the halves that catch an over-conviction.
    expect(grantedAgentNames(doc("Read, Agent"))).toEqual({ ok: true, value: [] });
    expect(grantedAgentNames(doc("Agent(alpha, gamma)"))).toEqual({
      ok: true,
      value: ["alpha", "gamma"],
    });
  });

  it("D-50 WR-03 — the three facts, and WHICH fact distinguishes each pair", () => {
    // THE FINDING IS THE FIRST TWO PAIRS. "The module could not read the enumeration" and "the
    // document never wrote one" shared ONE answer, and that answer was the success arm.
    const truncated = grantedAgentNames(doc("Agent(alpha, gamma"));
    const emptyClosed = grantedAgentNames(doc("Agent()"));
    const unscoped = grantedAgentNames(doc("Read, Agent"));

    // PAIR 1 — truncated vs empty-but-closed. Distinguished by WHETHER THE ENUMERATION WAS CAPTURED:
    // `Agent()` forms a capture whose content is the empty string, `Agent(alpha, gamma` forms none.
    expect(truncated.ok, "pair 1: the truncated enumeration must refuse").toBe(false);
    expect(emptyClosed, "pair 1: a CLOSED enumeration granting zero names is a real fact").toEqual({
      ok: true,
      value: [],
    });
    expect(truncated).not.toEqual(emptyClosed);

    // PAIR 2 — truncated vs genuinely unscoped. Distinguished by the SAME fact, and this is the pair
    // that mattered: a truncated enumeration impersonated a bare grant on the success arm.
    expect(unscoped, "pair 2: a bare grant enumerates nothing, and that is not an error").toEqual({
      ok: true,
      value: [],
    });
    expect(truncated).not.toEqual(unscoped);

    // PAIR 3 — empty-but-closed vs genuinely unscoped. THESE TWO DELIBERATELY SHARE ONE ANSWER AT THE
    // NAME-LIST LEVEL, and the reason is recorded here rather than left as an omission a later reader
    // "fixes". Both express the SAME fact — this grant enumerates ZERO names — and every consumer
    // treats a zero-length closure as its own named failure (the KIT-03 oracle and
    // coordinator-resolution-precheck each fail by name on `granted.length === 0`). Splitting them
    // would mean refusing `Agent()`, which is content a real loader accepts and which no measurement
    // shows this repository carries: a NEW false red, the direction D-34 records as the worse of the
    // two. See this plan's SUMMARY for the deviation note.
    expect(emptyClosed).toEqual(unscoped);

    // AND THEY ARE NOT CONFLATED BY THE MODULE — the distinction is PRESERVED one level down, where
    // it is a fact about the document rather than about the grant closure. The parser keeps both
    // values byte-for-byte, so nothing is lost; the name list simply does not invent a difference
    // where the two documents express the same closure.
    const valueOf = (tools: string): string[] => {
      const p = parseFrontmatter(doc(tools));
      expect(p.ok, tools).toBe(true);
      return p.ok ? (p.value.get("tools") ?? []) : [];
    };
    expect(valueOf("Agent()")).toEqual(["Agent()"]);
    expect(valueOf("Read, Agent")).toEqual(["Read, Agent"]);
    expect(valueOf("Agent()")).not.toEqual(valueOf("Read, Agent"));
  });

  it("D-50 WR-03 — `hasSpawnGrant` is INVARIANT: a file carrying an unterminated `Agent(` is still convicted as a grant-carrier", () => {
    // The boolean was already right and is NOT what this change touches. The refusal belongs on the
    // arm that returns NAMES, because names are what the closure equality is computed over. RED and
    // GREEN transcripts recorded the same value for every row below.
    const CONVICTED = [
      "Agent(alpha, gamma",
      "Agent(alpha, #b, gamma)",
      "Read, Agent",
      "Agent(alpha, gamma)",
      "Agent()",
      "Agent(alpha), Task(beta",
      "Agent, Task(beta",
      "Task(beta, Agent",
    ];
    for (const tools of CONVICTED) {
      expect(hasSpawnGrant(doc(tools)), tools).toEqual({ ok: true, value: true });
    }
    // The discriminating control: no token, no conviction. A predicate that convicted here would be
    // reporting `true` for everything and this case would prove nothing.
    expect(hasSpawnGrant(doc("Read, Write"))).toEqual({ ok: true, value: false });
  });

  it("D-50 WR-03 — the accounting is ORDER-INDEPENDENT: a closed occurrence neither absolves nor is absolved by an unterminated one", () => {
    // A partition that only works when the good occurrence comes first is not a partition. RED for
    // both rows below was the SUCCESS arm — the first carrying `["alpha"]`, which is worse than the
    // empty list because it looks like a complete answer.
    const closedFirst = grantedAgentNames(doc("Agent(alpha), Task(beta"));
    expect(closedFirst.ok, "RED was {ok:true,value:[\"alpha\"]}").toBe(false);
    if (!closedFirst.ok) expect(closedFirst.reason).toContain("`Task(beta`");

    const bareFirst = grantedAgentNames(doc("Agent, Task(beta"));
    expect(bareFirst.ok, "RED was {ok:true,value:[]}").toBe(false);

    const unterminatedFirst = grantedAgentNames(doc("Task(beta, Agent"));
    expect(unterminatedFirst.ok, "RED was {ok:true,value:[]}").toBe(false);
    if (!unterminatedFirst.ok) {
      expect(unterminatedFirst.reason).toContain("the `(` after `Task` has no matching `)`");
    }

    // AND THE OTHER DIRECTION, so this is not simply "any multi-token value refuses": two closed
    // occurrences, and a closed one beside a bare one, both still return their full name lists.
    expect(grantedAgentNames(doc("Agent(alpha), Task(beta)"))).toEqual({
      ok: true,
      value: ["alpha", "beta"],
    });
    expect(grantedAgentNames(doc("Agent(alpha), Task"))).toEqual({
      ok: true,
      value: ["alpha"],
    });
  });

  it("D-50 WR-03 — THE COUNT IDENTITY, as a property over a corpus of multi-token values built from OUTSIDE the module", () => {
    // THE FRAGMENTS, WRITTEN AS DATA WITH THEIR OWN EXPECTED BUCKET. The expectation is stated here,
    // never computed by asking the code under test — an expectation taken from the thing under test
    // moves whenever the thing under test moves, and this repository has shipped past that twice.
    const FRAGMENTS: readonly { text: string; label: string }[] = [
      { text: "Agent(alpha)", label: "a closed enumeration with one name" },
      { text: "Task(beta)", label: "a closed enumeration, legacy token" },
      { text: "Agent()", label: "a CLOSED enumeration granting zero names" },
      { text: "Agent", label: "a bare unscoped grant" },
      { text: "Task", label: "a bare unscoped grant, legacy token" },
      { text: "Agent(alpha", label: "an UNTERMINATED enumeration" },
      { text: "Task(beta", label: "an UNTERMINATED enumeration, legacy token" },
      { text: "Read", label: "no spawn token at all" },
      { text: "Write", label: "no spawn token at all" },
    ];

    // THE ACCOUNTING, RESTATED INDEPENDENTLY. This is deliberately not imported: the module's own
    // classifier is the thing under test, and a property that asks it to grade itself proves nothing.
    // The token test is re-typed as data for the same reason `expressed()` re-types the capture
    // expression in the D-47 control above.
    const account = (
      value: string,
    ): { occurrences: number; scoped: number; unscoped: number; neither: number } => {
      let occurrences = 0;
      let scoped = 0;
      let unscoped = 0;
      let neither = 0;
      for (const m of value.matchAll(/\b(?:Agent|Task)\b/g)) {
        occurrences += 1;
        const after = m.index + m[0].length;
        if (value[after] !== "(") {
          unscoped += 1;
        } else if (value.indexOf(")", after + 1) === -1) {
          neither += 1;
        } else {
          scoped += 1;
        }
      }
      return { occurrences, scoped, unscoped, neither };
    };

    // THE CORPUS: every ordered PAIR and every ordered TRIPLE of fragments, joined the way an author
    // writes a tools list. Ordered, so both orderings of every pair are present by construction
    // rather than by a hand-picked row.
    const values: { text: string; label: string }[] = [];
    for (const a of FRAGMENTS) {
      for (const b of FRAGMENTS) {
        values.push({ text: `${a.text}, ${b.text}`, label: `${a.label} + ${b.label}` });
        for (const c of FRAGMENTS) {
          values.push({
            text: `${a.text}, ${b.text}, ${c.text}`,
            label: `${a.label} + ${b.label} + ${c.label}`,
          });
        }
      }
    }

    // DERIVE THE SET, ASSERT THE COUNT. 9 fragments -> 81 pairs + 729 triples = 810 values. A corpus
    // that silently shrank would otherwise make this property cheap while it stayed green.
    expect(FRAGMENTS.length, "fragments").toBe(9);
    expect(values.length, "corpus of multi-token values").toBe(9 * 9 + 9 * 9 * 9);
    expect(values.length).toBe(810);

    let withNeither = 0;
    let withoutNeither = 0;
    let totalOccurrences = 0;
    const wrong: string[] = [];

    for (const v of values) {
      const a = account(v.text);

      // THE IDENTITY ITSELF, over every corpus member: the occurrences of the spawn token equal the
      // scoped plus the unscoped plus the neither. Stated as arithmetic so a bucket that stopped
      // matching fails here rather than reclassifying in silence.
      expect(a.scoped + a.unscoped + a.neither, `identity: ${v.text}`).toBe(
        a.occurrences,
      );
      totalOccurrences += a.occurrences;

      const got = grantedAgentNames(doc(v.text));
      const refusedAsUnterminated = !got.ok && got.reason.includes(UNCLOSED);

      if (a.neither > 0) {
        // BUCKET THREE IS REACHED WHENEVER THE INDEPENDENT ACCOUNTING SAYS IT SHOULD BE.
        if (!refusedAsUnterminated) {
          wrong.push(
            `${v.text} [${v.label}] has ${a.neither} unterminated occurrence(s) but got ${JSON.stringify(got)}`,
          );
        }
        withNeither += 1;
      } else {
        // AND IS NOT REACHED OTHERWISE. The value may still refuse for the D-47 allowlist reason —
        // `Agent(, Task(beta)` captures `, Task(beta`, which carries a `(` — so the property is
        // stated precisely: never the UNTERMINATED refusal, not "never a refusal".
        if (refusedAsUnterminated) {
          wrong.push(
            `${v.text} [${v.label}] has NO unterminated occurrence but was refused as one`,
          );
        }
        withoutNeither += 1;
      }
    }

    expect(wrong, `mismatches over ${values.length} multi-token values`).toEqual([]);
    // Both directions are genuinely exercised — a property where one side never fires is half a
    // property, and the numbers say so rather than being taken on trust.
    expect(withNeither, "corpus members carrying an unterminated occurrence").toBeGreaterThan(0);
    expect(withoutNeither, "corpus members carrying none").toBeGreaterThan(0);
    expect(withNeither + withoutNeither).toBe(values.length);
    expect(totalOccurrences, "spawn-token occurrences accounted for").toBeGreaterThan(
      values.length,
    );
  });

  it("D-50 WR-03 — the coordinator's real enumeration is byte-identical after the accounting", () => {
    // THE FALSE-RED HALF. The accounting can only ever ADD a refusal, so the one enumeration in this
    // repository whose closure the KIT-03 equality is computed over is the file it would break first.
    const root = join(import.meta.dirname, "..");
    const coordinator = readFileSync(
      join(root, ".claude/agents/grugops-orchestrator.md"),
      "utf8",
    );
    const names = grantedAgentNames(coordinator);
    expect(names.ok, "the coordinator's own grant must not refuse").toBe(true);
    if (!names.ok) return;
    const expectedClosure = listAgentAdapters(root)
      .map((rel) => rel.replace(/\.md$/, ""))
      .filter((n) => n !== "grugops-orchestrator")
      .sort();
    expect(names.value).toEqual(expectedClosure);

    // AND EVERY OTHER SCAN MEMBER, over the ONE scan composition the guard reads — derived, never
    // listed here. Zero new refusals across the whole spawn-grant surface.
    const refusals: string[] = [];
    for (const rel of spawnGrantScan(root)) {
      const got = grantedAgentNames(readFileSync(join(root, rel), "utf8"));
      if (!got.ok) refusals.push(`${rel}: ${got.reason}`);
    }
    expect(
      refusals,
      `the occurrence accounting must cost the ${SPAWN_GRANT_SCAN_COUNT}-member scan surface ZERO false reds`,
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// D-50 / IN-01 — "IS THIS LINE EMPTY" IS ANSWERED BY THE ALPHABET THIS MODULE
// DECLARES, NOT BY THE ONE A BUILT-IN HAPPENS TO CARRY
// (27-REVIEW-GAPS-6 § IN-01, round 6)
// ---------------------------------------------------------------------------
//
// THE THIRD APPLICATION POINT of the exact defect D-39, D-42 and D-43 spent two rounds correcting at
// the delimiter positions. `parseFrontmatter`'s prologue skip decided which lines of a document exist
// by asking `String.prototype.trim()`, whose alphabet is ECMAScript WhiteSpace — which CONTAINS
// U+00A0 and does NOT contain U+200B, U+00AD or U+2060.
//
// EVERY ROW BELOW WAS MEASURED AGAINST THE COMMITTED `scripts/frontmatter.js` AS PLAN 27-41 TASK 1
// LEFT IT (commit 0cd71e9), BEFORE THIS CHANGE, and every platform claim carries a transcript from a
// REAL YAML 1.2 LOADER (`/usr/bin/ruby -ryaml` — Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1). libyaml
// reads an invisible prologue as its own document and the `---` block as a SECOND document CARRYING
// THE MAPPING AND ITS LIVE GRANT, in every one of the spellings below — so the module's silent
// no-grant disagreed with the platform, and the fix makes them agree.
describe("frontmatter — the invisible prologue and the one invisible authority (D-50 / IN-01)", () => {
  const TOKEN = "Agent(grugops-orchestrator)";
  const BLOCK = `---\nname: x\ntools: Read, ${TOKEN}\n---\nBody.\n`;

  // Named by code point rather than pasted as a mystery byte, so a reader can see what each row is.
  const ZWSP = "​"; // ZERO WIDTH SPACE      — Cf, NOT in ECMAScript WhiteSpace
  const SHY = "­"; // SOFT HYPHEN           — Cf, NOT in ECMAScript WhiteSpace
  const WJ = "⁠"; // WORD JOINER           — Cf, NOT in ECMAScript WhiteSpace
  const ACUTE = "́"; // COMBINING ACUTE       — Mn, NOT in ECMAScript WhiteSpace
  const NBSP = " "; // NO-BREAK SPACE        — Zs, IS in ECMAScript WhiteSpace

  it("D-50 IN-01 — an invisible-only prologue line no longer hides a live spawn grant, in EVERY spelling", () => {
    // RED for the first four rows was `{ok:true, keys:[]}` with `hasSpawnGrant` `{ok:true,false}` —
    // the silent no-grant arm, over a document whose `---` block one line down carries a live grant.
    const HIDDEN: readonly [string, string][] = [
      ["a lone U+200B ZERO WIDTH SPACE", ZWSP],
      ["a lone U+00AD SOFT HYPHEN", SHY],
      ["a lone U+2060 WORD JOINER", WJ],
      ["a lone U+0301 COMBINING ACUTE (a mark, not a glyph of its own)", ACUTE],
    ];
    for (const [label, prologue] of HIDDEN) {
      const text = `${prologue}\n${BLOCK}`;
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, `${label}: RED was ok with ZERO keys`).toBe(true);
      if (parsed.ok) {
        expect([...parsed.value.keys()].sort(), label).toEqual(["name", "tools"]);
      }
      expect(hasSpawnGrant(text), `${label}: RED was {ok:true,value:false}`).toEqual({
        ok: true,
        value: true,
      });
      expect(grantedAgentNames(text), label).toEqual({
        ok: true,
        value: ["grugops-orchestrator"],
      });
    }

    // MULTI-LINE PROLOGUES, which no row of the finding named: the skip must consume a RUN of them.
    const RUNS: readonly [string, string][] = [
      ["an invisible line then an ordinary blank line", `${ZWSP}\n\n`],
      ["two invisible lines", `${ZWSP}\n${ZWSP}\n`],
      ["an invisible line then a NO-BREAK SPACE line", `${WJ}\n${NBSP}\n`],
    ];
    for (const [label, prologue] of RUNS) {
      expect(hasSpawnGrant(`${prologue}${BLOCK}`), label).toEqual({
        ok: true,
        value: true,
      });
    }
  });

  it("D-50 IN-01 — the rows that already parsed are BYTE-UNCHANGED: an ordinary blank line and a NO-BREAK SPACE", () => {
    // These two are the module's OWN existing answer, and they are the whole argument for skipping
    // rather than refusing: the module had already decided that a prologue the skip considers blank
    // does not prevent frontmatter. If either of these moved, the fix would have changed the rule
    // instead of applying it consistently.
    for (const [label, prologue] of [
      ["an ordinary blank line", ""],
      ["a lone U+00A0 NO-BREAK SPACE", NBSP],
      ["a run of spaces and tabs", "  \t "],
    ] as const) {
      const text = `${prologue}\n${BLOCK}`;
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, label).toBe(true);
      if (parsed.ok) {
        expect([...parsed.value.keys()].sort(), label).toEqual(["name", "tools"]);
      }
      expect(hasSpawnGrant(text), label).toEqual({ ok: true, value: true });
    }
  });

  it("D-50 IN-01 — the KEYLESS SUCCESS arm's membership is UNCHANGED for every document that does not open a block", () => {
    // The arm where every silent no-grant in this phase has landed. D-34 records that turning a
    // body-only file red is the worse of the two, and this fix must not widen the arm either — it must
    // leave it exactly as it found it. Each row below passed before this change and passes after.
    const KEYLESS: readonly [string, string][] = [
      ["a genuinely body-only document", "Just prose, and no frontmatter at all.\n"],
      ["an empty document", ""],
      ["a document of blank lines only", "\n\n\n"],
      // The row this fix could plausibly have broken: skipping EVERY line lands past the end, which
      // is the same `i >= lines.length` return the blank-only document takes.
      ["a document of nothing but invisible lines", `${ZWSP}\n${SHY}\n${WJ}\n`],
      ["a document of one invisible line", `${ZWSP}\n`],
      ["a dash bullet, not a delimiter", "- an item\n- another\n"],
      ["a setext underline", "Title\n===\n"],
    ];
    for (const [label, text] of KEYLESS) {
      const parsed = parseFrontmatter(text);
      expect(parsed.ok, label).toBe(true);
      if (parsed.ok) expect(parsed.value.size, label).toBe(0);
      expect(hasSpawnGrant(text), label).toEqual({ ok: true, value: false });
      expect(grantedAgentNames(text), label).toEqual({ ok: true, value: [] });
    }
  });

  it("D-50 IN-01 — the prologue skip decides which lines EXIST, never what a delimiter may carry", () => {
    // A DIRECTLY-ATTACHED invisible residue is a property of the DELIMITER LINE, and the delimiter
    // region spent rounds 4 and 5 establishing that it refuses. Skipping a whole invisible LINE must
    // not soften that by one byte. libyaml rejects this document outright (Psych::SyntaxError),
    // measured — so the refusal agrees with the platform.
    const attached = `${ZWSP}---\nname: x\ntools: Read, ${TOKEN}\n---\nB\n`;
    const p = parseFrontmatter(attached);
    expect(p.ok, "an invisible glyph attached to the delimiter must still refuse").toBe(
      false,
    );
    if (!p.ok) {
      expect(p.reason).toContain("U+200B");
      expect(p.reason).toContain("opening delimiter position");
    }

    // The D-34 directive refusal, still by name.
    const tag = `%TAG ! tag:x\n${BLOCK}`;
    const t = parseFrontmatter(tag);
    expect(t.ok, "a %TAG prologue must still refuse").toBe(false);
    if (!t.ok) expect(t.reason).toContain("YAML directive line");

    // AND THE ROW THE FINDING NEVER NAMED, found by red-team and closed by the same change: ONE
    // invisible code point in front of the directive made D-34's refusal DISAPPEAR. Measured RED
    // against the committed build as Task 1 left it: `{ok:true, keys:[]}` — the keyless success arm.
    // The skip stopped on the invisible line and the directive one line down was never examined. A
    // predicate is only as total as the input it is handed.
    const hiddenTag = `${ZWSP}\n%TAG ! tag:x\n${BLOCK}`;
    const h = parseFrontmatter(hiddenTag);
    expect(h.ok, "RED was {ok:true, keys:[]} — D-34 bypassed by one code point").toBe(
      false,
    );
    if (!h.ok) expect(h.reason).toContain("YAML directive line");
  });

  it("D-50 IN-01 — THE IN-BLOCK ASYMMETRY IS DELIBERATE, and it is asserted rather than claimed in a comment", () => {
    // INSIDE the block the narrow `trim()` alphabet routes an invisible-only line to a REFUSAL, which
    // is the SAFE direction — and it is the one a real YAML 1.2 loader agrees with: libyaml rejects
    // this exact document outright as a syntax error (`could not find expected ':' while scanning a
    // simple key`), measured at execution time. Widening blankness there would trade a loud refusal
    // for a silent skip on a document the platform will not load. This case exists so the asymmetry
    // reads as the decision it is and is not "fixed" later into a bypass.
    const inBlock = `---\nname: x\n${ZWSP}\ntools: Read, ${TOKEN}\n---\nB\n`;
    const r = parseFrontmatter(inBlock);
    expect(r.ok, "an invisible-only line INSIDE the block must still refuse").toBe(false);
    if (!r.ok) {
      expect(r.reason).toContain("as a frontmatter key line");
    }

    // THE CONTROL THAT MAKES THE ASYMMETRY MEANINGFUL: an ORDINARY blank line inside the block is
    // still a paragraph break and still parses. The two in-block sites were not simply frozen — they
    // keep the behaviour they had, and this pair shows the pre-existing split they encode.
    const blankInBlock = `---\nname: x\n\ntools: Read, ${TOKEN}\n---\nB\n`;
    expect(hasSpawnGrant(blankInBlock)).toEqual({ ok: true, value: true });

    // AND THE DIRECTION STATED AS A PAIR: the SAME code point, at the two positions, reaching the two
    // opposite arms — skipped at the prologue, refused inside the block. That is the whole rule.
    expect(hasSpawnGrant(`${ZWSP}\n${BLOCK}`)).toEqual({ ok: true, value: true });
    expect(parseFrontmatter(inBlock).ok).toBe(false);
  });

  it("D-50 IN-01 — the module declares EXACTLY ONE invisible-glyph class, by source inspection", () => {
    // A second character class beside the first is a defect in this fix, not a refinement of it: two
    // statements of what invisible means can disagree, and the disagreement is invisible to a reader
    // checking either in isolation. This is the same drift class the leading-run label closed one
    // round ago, so it is checked mechanically rather than by review.
    const source = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );

    // The declaration itself, counted. Exactly one `const … = /[\p{L}\p{N}\p{P}\p{S}]/u;`.
    const declarations = source.match(
      /^const \w+ = \/\[\\p\{L\}\\p\{N\}\\p\{P\}\\p\{S\}\]\/u;$/gm,
    );
    expect(
      declarations?.length,
      `invisible-glyph class DECLARATIONS in scripts/frontmatter.ts: ${JSON.stringify(declarations)}`,
    ).toBe(1);

    // And the class LITERAL, anywhere in the file, appears only in that one declaration — so the
    // prologue-skip predicate consults the constant rather than re-typing the expression.
    const literals = source.match(/\/\[\\p\{L\}\\p\{N\}\\p\{P\}\\p\{S\}\]\/u/g);
    expect(
      literals?.length,
      "occurrences of the invisible-glyph class literal in scripts/frontmatter.ts",
    ).toBe(1);

    // The two in-block `trim()`-based blank tests are still THERE and still `trim()`-based. Freezing
    // them is the decision; this counts them so a later edit that "harmonises" them fails here and
    // has to read the direction argument recorded beside each.
    const inBlockTrims = source.match(/\.trim\(\) [=!]== ""/g);
    expect(
      inBlockTrims?.length,
      "trim()-based blank tests remaining in scripts/frontmatter.ts (the two deliberate in-block sites)",
    ).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// D-51 — THE ONE AUTHORITY ON WHAT CROSSES A LINE BOUNDARY (27-REVIEW-GAPS-7 § CR-01, round 8)
// ---------------------------------------------------------------------------
//
// D-48 promoted quote state to a property of the SCALAR and gated the carry on a node start. Both
// moves were right. What was wrong was that the SEEDING was wired into two of the three places a
// node can begin, and into NONE of the places a node begins mid-line — so the union of the arms was
// not the set of node starts, and two whole families of live spawn grants came back on the silent
// no-grant SUCCESS arm. The remedy was not a fourth arm; it was deleting the split so the answer is
// decided once, at the character where the position is known.
//
// EVERY ROW BELOW WAS MEASURED, NOT REASONED. Each carries the verdict the COMMITTED pre-D-51 build
// returned (RED) and the loader's value from `/usr/bin/ruby -ryaml` (Ruby 2.6.10 / Psych 3.1.0 /
// libyaml 0.2.1). A row that was never red is not a pin; the RED transcripts are recorded verbatim
// in 27-43-SUMMARY.md, captured on a `git archive HEAD` mirror BEFORE the edit.
describe("frontmatter — D-51: one walk decides what crosses a line boundary (CR-01, round 8)", () => {
  const TOKEN = "Agent(grugops-orchestrator)";
  const doc = (region: string): string =>
    `---\nname: probe\n${region}\n---\nBody.\n`;
  const toolsOf = (text: string): string => {
    const parsed = parseFrontmatter(text);
    return parsed.ok ? (parsed.value.get("tools") ?? []).join("|") : "REFUSED";
  };

  // ── FAMILY (a): THE KEY LINE CARRIES NO VALUE, SO THE CONTINUATION LINE IS THE NODE START ──────

  it("D-51 row a1 — `tools:` / `  \"Read,` / `  # x, TOKEN\"` grants; pre-D-51 it returned the no-grant SUCCESS arm", () => {
    // pre-D-51 committed build: {ok:true,value:false}, tools=["\"Read,"]
    // libyaml:                   "Read, # x, Agent(grugops-orchestrator)"
    const text = doc(`tools:\n  "Read,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    // The flattened value is byte-identical to what the loader computes, not merely token-bearing.
    expect(toolsOf(text)).toBe(`Read, # x, ${TOKEN}`);
  });

  // ── FAMILY (b): THE QUOTED SCALAR OPENS MID-LINE INSIDE A FLOW COLLECTION ───────────────────────
  //
  // The family the reviewer's measured one-liner LEAVES OPEN. Mirroring the item path's gate in the
  // continuation path closes (a) and returns (b) on the no-grant success arm, because inside a flow
  // collection `nodeOnKeyLine` is already true and no line-level expression can see the node start.

  it("D-51 row b1 — `tools: [Read,` / `  \"Write,` / `  # x, TOKEN\"]` grants; the family the naive one-liner does NOT close", () => {
    // pre-D-51 committed build: {ok:true,value:false}, tools=["[Read, \"Write,"]
    // libyaml:                   ["Read", "Write, # x, Agent(grugops-orchestrator)"]
    const text = doc(`tools: [Read,\n  "Write,\n  # x, ${TOKEN}"]`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`[Read, "Write, # x, ${TOKEN}"]`);
  });

  // ── THE ONE-LINE CONTROL: THE FIX MOVED THE BOUNDARY CASE AND NOTHING ELSE ─────────────────────

  it("D-51 control — the same grant on ONE line is unchanged, value byte-for-byte", () => {
    // pre-D-51 committed build: {ok:true,value:true}, tools=["Read, # x, Agent(grugops-orchestrator)"]
    const text = doc(`tools: "Read, # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`Read, # x, ${TOKEN}`);
  });

  // ── THE D-48 APOSTROPHE REGRESSION STAYS CLOSED, BY CONSTRUCTION ────────────────────────────────
  //
  // This is the regression NO case in this suite caught: it was found only by the before/after value
  // map over every tracked markdown file, which named 10 real `.planning/` documents whose sibling
  // list items were being MERGED. It stays closed here for a STRUCTURAL reason rather than a lucky
  // one: the gate is decided at the character where the quote opens, and an apostrophe inside a plain
  // scalar is never at a position where a node may begin — so it can never license a crossing,
  // whatever line it sits on.

  it("D-51 apostrophe control — a plain scalar's apostrophe licenses no crossing and swallows no sibling item", () => {
    // Both values measured on the pre-D-51 committed build and reproduced byte-for-byte after.
    const seq = doc(`tools:\n  - headroom for 27-06's frontmatter key\n  - Write`);
    expect(toolsOf(seq)).toBe("headroom for 27-06's frontmatter key, Write");
    // The `, ` join proves the second `- Write` was still read as its OWN item: a swallowed boundary
    // folds it into the first part with a space instead.
    const seqParsed = parseFrontmatter(seq);
    expect(seqParsed.ok && seqParsed.value.get("tools")).toEqual([
      "headroom for 27-06's frontmatter key, Write",
    ]);

    const key = doc(`description: it's fine\ntools: Read`);
    const keyParsed = parseFrontmatter(key);
    expect(keyParsed.ok && keyParsed.value.get("description")).toEqual([
      "it's fine",
    ]);
    // The apostrophe did not silence the NEXT key's scanning either.
    expect(keyParsed.ok && keyParsed.value.get("tools")).toEqual(["Read"]);

    // And on a plain continuation line, where the carried node-may-begin answer is false because the
    // key line's trailing comma sits at flow depth 0 — a comma introduces a node only INSIDE a flow
    // collection, which is the same distinction `startsWithReference` already makes.
    const cont = doc(`tools: Read,\n  don't\n  Write`);
    expect(toolsOf(cont)).toBe("Read, don't Write");
  });

  // ── WITHIN-LINE BEHAVIOUR IS BYTE-UNCHANGED, ASSERTED AGAINST THE BUILD THAT SHIPPED ───────────

  it("D-51 single-line byte-identity differential — the scanner's TEXT is byte-identical to the pre-D-51 build for every single-line input", () => {
    // WHAT THIS FIXTURE IS, AND THE ONE WAY IT MUST NEVER BE MAINTAINED. It is a CAPTURE of the
    // pre-D-51 committed `scripts/frontmatter.js` — taken on a `git archive HEAD` mirror before the
    // edit, by appending one `export { stripComment }` line to a COPY of the committed bytes and
    // importing it, so what was recorded is the scanner that actually shipped rather than a
    // reimplementation of it. It is a FROZEN historical measurement.
    //
    // IF THIS CASE GOES RED, THE FIXTURE IS NOT THE THING TO REGENERATE. Regenerating it from the
    // current build would make the assertion say "the build equals itself", which is the degradation
    // mode this repository's prohibitions name by hand. A red here means the within-line rules moved,
    // and the within-line rules are exactly what D-51 promised NOT to move: the escaped-character
    // skip, both quote toggles and the comment condition. Adjudicate the change against
    // `/usr/bin/ruby -ryaml` first.
    const fixture = JSON.parse(
      readFileSync(
        join(import.meta.dirname, "fixtures", "frontmatter-singleline-pre-d51.json"),
        "utf8",
      ),
    ) as { entering: (string | null)[]; cells: { input: string; text: string[] }[] };

    // NO CORPUS SIZE IS WRITTEN INTO AN ASSERTION. The two numbers compared are both derived in this
    // run; the floor exists only so a fixture emptied by a later edit cannot make this pass vacuously.
    const inputs = fixture.cells.length;
    expect(inputs, "the captured single-line corpus must not be empty").toBeGreaterThan(500);
    expect(fixture.entering.length, "entering quote states captured").toBeGreaterThan(0);

    let compared = 0;
    const mismatches: string[] = [];
    for (const { input, text } of fixture.cells) {
      fixture.entering.forEach((q, k) => {
        // The NODE-START INPUT IS SWEPT TOO. The claim is that the new argument changes only what
        // SURVIVES the boundary, so the returned text must be independent of it — a property worth
        // measuring rather than assuming, since it is the whole basis for "within-line unchanged".
        for (const nodeStartAtOffsetZero of [true, false]) {
          const got = stripComment(
            input,
            {
              openQuote: q as '"' | "'" | null,
              flowDepth: 0,
              nodeMayBegin: true,
            },
            nodeStartAtOffsetZero,
          ).text;
          compared += 1;
          if (got !== text[k]) {
            mismatches.push(
              `${JSON.stringify(input)} entering=${JSON.stringify(q)} nodeStart=${nodeStartAtOffsetZero}: pre=${JSON.stringify(text[k])} post=${JSON.stringify(got)}`,
            );
          }
        }
      });
    }

    expect(
      mismatches,
      `within-line TEXT differential over ${inputs} generated single-line input(s), ${compared} comparison(s):\n${mismatches.slice(0, 20).join("\n")}`,
    ).toEqual([]);
    // Both numbers derived in this same run — never one derived and one written down.
    expect(compared).toBe(inputs * fixture.entering.length * 2);
  });
});
