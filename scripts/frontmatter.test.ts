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
import { createHash } from "node:crypto";
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
  assertItemPathScalarClosed,
  assertFoldTargetIsNotBlockOwned,
  SEQ_ITEM,
  DQ_ESCAPE_ALLOWLIST,
  ENUMERATION_LEGAL_CHARS,
  TOOLS_KEYS,
  keysGrantedAgentNames,
  checkGrantOccurrenceBalance,
  GRANT_OCCURRENCE_KINDS,
} from "./frontmatter.js";
import type {
  GrantOccurrence,
  GrantOccurrenceKind,
  Parsed,
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

  // ── ROUND 10, 27-REVIEW § CR-01: YAML's `''` ESCAPE INSIDE AN OPEN SINGLE-QUOTED SCALAR ─────────
  //
  // WHAT THESE CASES ARE AND WHAT THEY ARE NOT. They are REGRESSION PINS on documents an independent
  // loader decides — each carries, in its own comment, the verbatim value `/usr/bin/ruby -ryaml`
  // (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) returns for it. They are NOT the fix's justification:
  // a case per spelling is the enumerate-the-bad shape this module has declined seven times. The
  // FIX's justification is that `stripComment` now DERIVES its scalar-closing set from the quote
  // style's own escape rule, and that argument lives in the source comment at the arm itself.
  //
  // Pre-fix, every one of rows A-D returned `{ ok: true, value: false }` — the silent no-grant SUCCESS
  // arm over a live `Agent(grugops-orchestrator)` — and a row-A plant on BOTH distribution twins of
  // the non-coordinator `plan` skill took the whole foundation gate to ALL CHECKS PASSED at exit 0.

  it("CR-01 round 10 row A — `'Read'' s,` continued behind a `#`: the `''` is CONTENT, the scalar stays open", () => {
    // loader: {"tools"=>"Read' s, # x, Agent(grugops-orchestrator)"} — ACCEPTED, grant in the value.
    const text = [
      "---",
      "name: grugops-plan",
      "tools: 'Read'' s,",
      "  # x, Agent(grugops-orchestrator)'",
      "---",
      "Body.",
      "",
    ].join("\n");
    const grant = hasSpawnGrant(text);
    expect(grant).toEqual({ ok: true, value: true });
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["grugops-orchestrator"],
    });
  });

  it("CR-01 round 10 row B — the UNSPACED spelling `'Read''s,` behaves identically", () => {
    // loader: {"tools"=>"Read's, # x, Agent(grugops-orchestrator)"} — ACCEPTED, grant in the value.
    const text = [
      "---",
      "name: grugops-plan",
      "tools: 'Read''s,",
      "  # x, Agent(grugops-orchestrator)'",
      "---",
      "Body.",
      "",
    ].join("\n");
    const grant = hasSpawnGrant(text);
    expect(grant).toEqual({ ok: true, value: true });
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["grugops-orchestrator"],
    });
  });

  it("CR-01 round 10 row C — the BLOCK-SEQUENCE ITEM path inherits the same escape rule", () => {
    // loader: {"tools"=>["Read' s, # x, Agent(grugops-orchestrator)"]} — ACCEPTED, grant in the value.
    // Row C is what proves the defect was never a key-line artifact: the item path seeds the same
    // walk (`stripComment(itemText, cur.state, true, true)`) and inherited the same second grammar.
    const text = [
      "---",
      "name: grugops-plan",
      "tools:",
      "  - 'Read'' s,",
      "    # x, Agent(grugops-orchestrator)'",
      "---",
      "Body.",
      "",
    ].join("\n");
    const grant = hasSpawnGrant(text);
    expect(grant).toEqual({ ok: true, value: true });
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["grugops-orchestrator"],
    });
  });

  it("CR-01 round 10 row D — the FLOW-SEQUENCE spelling inherits it too", () => {
    // loader: {"tools"=>["Read' s, # x, Agent(grugops-orchestrator)"]} — ACCEPTED, grant in the value.
    const text = [
      "---",
      "name: grugops-plan",
      "tools: ['Read'' s,",
      "  # x, Agent(grugops-orchestrator)']",
      "---",
      "Body.",
      "",
    ].join("\n");
    const grant = hasSpawnGrant(text);
    expect(grant).toEqual({ ok: true, value: true });
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["grugops-orchestrator"],
    });
  });

  it("CR-01 round 10 row F control — the SAME document with the `''` removed was ALREADY correct and must not move", () => {
    // loader: {"tools"=>"Read, # x, Agent(grugops-orchestrator)"} — ACCEPTED, grant in the value.
    // This is the control that isolates the `''` as the whole of the defect: pre-fix this row already
    // returned the grant arm with exactly this flattened value, and post-fix it is byte-identical.
    const text = [
      "---",
      "name: grugops-plan",
      "tools: 'Read,",
      "  # x, Agent(grugops-orchestrator)'",
      "---",
      "Body.",
      "",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.get("tools")).toEqual([
      "Read, # x, Agent(grugops-orchestrator)",
    ]);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
  });

  it("CR-01 round 10 false-red controls — `'a'''` and `''` are the two TOUCHING cases and neither moved", () => {
    // The adjacency probe. `'a'''` CLOSES immediately after an escape (escape-then-close) and `''` is
    // the EMPTY single-quoted scalar (a close that is not an escape). They sit either side of the new
    // branch's condition, so if the escape skip over- or under-consumed by one character they would
    // merge into one reading or collide. Loader: {"tools"=>"a'"} and {"tools"=>""} — both ACCEPTED,
    // neither carrying a grant, so the no-grant SUCCESS arm is the AGREEING answer here and a refusal
    // would be a new false red.
    const escapeThenClose = [
      "---",
      "name: grugops-plan",
      "tools: 'a'''",
      "---",
      "Body.",
      "",
    ].join("\n");
    const emptyScalar = [
      "---",
      "name: grugops-plan",
      "tools: ''",
      "---",
      "Body.",
      "",
    ].join("\n");
    const pEscape = parseFrontmatter(escapeThenClose);
    expect(pEscape.ok).toBe(true);
    if (!pEscape.ok) return;
    expect(pEscape.value.get("tools")).toEqual(["a'"]);
    expect(hasSpawnGrant(escapeThenClose)).toEqual({ ok: true, value: false });

    const pEmpty = parseFrontmatter(emptyScalar);
    expect(pEmpty.ok).toBe(true);
    if (!pEmpty.ok) return;
    expect(pEmpty.value.get("tools")).toEqual([""]);
    expect(hasSpawnGrant(emptyScalar)).toEqual({ ok: true, value: false });
  });

  it("CR-01 round 10 precision probe — the escape skip consumes exactly ONE character and never runs off the end", () => {
    // The skip is index arithmetic, so its two failure modes are arithmetic ones: consuming too much
    // (the character after the pair is swallowed) and reading past the end of the scanned string. A
    // scalar whose LAST TWO characters are the pair puts the skip at the boundary; `s[i + 1]` is
    // `undefined` one position further, which is why no bounds test is needed and why that fact is
    // pinned here rather than asserted in prose.
    const atEnd = stripComment("'a''", { openQuote: null, flowDepth: 0, nodeMayBegin: true }, true, true);
    expect(atEnd.text).toBe("'a''");
    expect(atEnd.state.openQuote).toBe("'");
    // One character past the pair is CONTENT, not consumed by the skip: the `#` here is inside the
    // still-open scalar, so no comment is stripped and the whole line survives.
    const afterPair = stripComment("'a''b # c", { openQuote: null, flowDepth: 0, nodeMayBegin: true }, true, true);
    expect(afterPair.text).toBe("'a''b # c");
    expect(afterPair.state.openQuote).toBe("'");
    // And the ESCAPE COUNT is content, never a threshold: one pair and zero pairs give the same
    // still-open verdict, and so does a run of three pairs.
    for (const s of ["'Read,", "'Read'' s,", "'Read'''''' s,"]) {
      expect(
        stripComment(s, { openQuote: null, flowDepth: 0, nodeMayBegin: true }, true, true).state
          .openQuote,
        `escape count must be content, not a threshold: ${JSON.stringify(s)}`,
      ).toBe("'");
    }
  });

  it("CR-01 round 10 UNION — the escape combined with every mid-line node start the walk's OTHER arms decide, and with both quote styles in one value", () => {
    // THE ROUND-8 LESSON, APPLIED TO THIS ROUND'S FIX: splitting a predicate into arms demands testing
    // their UNION. The escape skip is one arm of `stripComment`'s character chain; the mid-line node
    // starts (the block mapping separator, the block mapping inside a sequence item, the JSON-adjacent
    // flow mapping, the block explicit key, the compact nested sequence) are decided by OTHER arms.
    // Each was pinned alone; a document that exercises BOTH at once was not. Every row below carries
    // its loader value, and every row is a document `/usr/bin/ruby -ryaml` ACCEPTS with the grant in
    // the loaded value. The last two are the both-quote-styles-in-one-value union.
    const UNION: readonly (readonly [string, string, string])[] = [
      [
        "escape + a nested block mapping's value",
        "tools:\n  nested: 'Read'' s,\n  # x, Agent(grugops-orchestrator)'",
        '{"nested"=>"Read\' s, # x, Agent(grugops-orchestrator)"}',
      ],
      [
        "escape + a block mapping inside a sequence item",
        "tools:\n  - a: 'Read'' s,\n    # x, Agent(grugops-orchestrator)'",
        '[{"a"=>"Read\' s, # x, Agent(grugops-orchestrator)"}]',
      ],
      [
        "escape + a JSON-adjacent flow mapping",
        "tools: {'a':'Read'' s,\n  # x, Agent(grugops-orchestrator)'}",
        '{"a"=>"Read\' s, # x, Agent(grugops-orchestrator)"}',
      ],
      [
        "escape + a block explicit key at continuation depth 3",
        "tools:\n  ? 'Read'' s,\n    Third,\n    # x, Agent(grugops-orchestrator)'\n  : v",
        '{"Read\' s, Third, # x, Agent(grugops-orchestrator)"=>"v"}',
      ],
      [
        "escape + a compact nested sequence",
        "tools:\n  - - 'Read'' s,\n      # x, Agent(grugops-orchestrator)'",
        '[["Read\' s, # x, Agent(grugops-orchestrator)"]]',
      ],
      [
        "escape + a flow mapping inside a flow sequence",
        "tools: [{'a':'Read'' s,\n  # x, Agent(grugops-orchestrator)'}]",
        '[{"a"=>"Read\' s, # x, Agent(grugops-orchestrator)"}]',
      ],
      [
        "BOTH quote styles in one value, each carrying its own escape",
        "tools: ['Read'' s,\n  # x, Agent(grugops-orchestrator)', \"Write\\\" q\"]",
        '["Read\' s, # x, Agent(grugops-orchestrator)", "Write\\" q"]',
      ],
      [
        "a double-quote escape in the KEY and a single-quote escape in the value",
        "tools: {\"a\\\"b\": 'Read'' s,\n  # x, Agent(grugops-orchestrator)'}",
        '{"a\\"b"=>"Read\' s, # x, Agent(grugops-orchestrator)"}',
      ],
    ];
    for (const [label, region, loaderValue] of UNION) {
      const text = `---\nname: grugops-plan\n${region}\n---\nBody.\n`;
      expect(
        hasSpawnGrant(text),
        `${label} — the loader reads this as ${loaderValue}`,
      ).toEqual({ ok: true, value: true });
      expect(grantedAgentNames(text), label).toEqual({
        ok: true,
        value: ["grugops-orchestrator"],
      });
    }
    // Non-vacuity: the union set is really a set of documents that each exercise TWO arms.
    expect(UNION.length).toBeGreaterThan(5);
    expect(
      UNION.filter(([, region]) => region.includes("''")).length,
      "every union row must carry the escape arm, or it is not a union",
    ).toBe(UNION.length);
  });

  // ── (D-57, round 10) FAMILY G / G2 — A BLOCK-SCALAR HEADER AT EVERY POSITION YAML ALLOWS ONE ───
  //
  // Five consecutive plans (27-47 .. 27-51) re-measured this family byte-identical against the
  // committed build and left it OPEN in `deferred-items.md`. `BLOCK_INDICATOR` was asked at exactly
  // ONE of the positions YAML allows a header — `flattenBlock`'s top-level key line — so a `|` / `>`
  // header nested as a mapping value or as a sequence item was never recognised, its LITERAL content
  // reached `stripComment`, and a leading `#` deleted a live `Agent(grugops-orchestrator)` on the
  // `{ok:true, value:false}` SUCCESS arm. Planted on both distribution twins of the non-coordinator
  // `plan` skill on a hermetic mirror, the whole foundation gate printed ALL CHECKS PASSED at exit 0.
  //
  // EVERY ROW IS A DOCUMENT `/usr/bin/ruby -ryaml` ACCEPTS (ruby 2.6.10 / psych 3.1.0 / libyaml
  // 0.2.1) WITH THE GRANT IN THE LOADED VALUE, and each carries that value verbatim. The rows are the
  // seven the ledger measured plus the five POSITIONS this plan's own red team found still open
  // against its FIRST build — a fix that closes a family at one position and reopens it at the
  // position immediately after is not a closure.
  it("D-57 family G/G2 — a nested block-scalar header GRANTS where the loader grants, at every position YAML allows one", () => {
    const ROWS: readonly (readonly [string, string, string])[] = [
      [
        "G — a nested mapping's value, folded",
        "tools:\n  nested: >-\n    Read,\n    # x, Agent(grugops-orchestrator)",
        '{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}',
      ],
      [
        "G2 — a block-sequence item",
        "tools:\n  - >-\n    Read,\n    # x, Agent(grugops-orchestrator)",
        '["Read, # x, Agent(grugops-orchestrator)"]',
      ],
      [
        "g1 — the indentation-indicator spelling `>2-`",
        "tools:\n  nested: >2-\n    Read,\n    # x, Agent(grugops-orchestrator)",
        '{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}',
      ],
      [
        "g2 — the keep-chomping spelling `|+`",
        "tools:\n  nested: |+\n    Read,\n    # x, Agent(grugops-orchestrator)",
        '{"nested"=>"Read,\\n# x, Agent(grugops-orchestrator)\\n"}',
      ],
      [
        "g3 — a header carrying its own comment",
        "tools:\n  nested: > # h\n    Read,\n    # x, Agent(grugops-orchestrator)",
        '{"nested"=>"Read, # x, Agent(grugops-orchestrator)\\n"}',
      ],
      [
        "g4 — the same shape under the `allowed-tools:` key form",
        "allowed-tools:\n  nested: >-\n    Read,\n    # x, Agent(grugops-orchestrator)",
        '{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}',
      ],
      [
        "P1 — the header follows a SIBLING mapping key, so this key's node has already begun",
        "tools:\n  a: Read\n  b: >-\n    q,\n    # y, Agent(grugops-orchestrator)",
        '{"a"=>"Read", "b"=>"q, # y, Agent(grugops-orchestrator)"}',
      ],
      [
        "P2 — the header is a LATER item of a block sequence",
        "tools:\n  - Read\n  - >-\n    q,\n    # y, Agent(grugops-orchestrator)",
        '["Read", "q, # y, Agent(grugops-orchestrator)"]',
      ],
      [
        "P3 — the header is a key inside a sequence item's compact mapping",
        "tools:\n  - k: v\n    j: >-\n      q,\n      # y, Agent(grugops-orchestrator)",
        '[{"k"=>"v", "j"=>"q, # y, Agent(grugops-orchestrator)"}]',
      ],
      [
        "P4 — the header is TWO levels deep",
        "tools:\n  a:\n    b: >-\n      q,\n      # y, Agent(grugops-orchestrator)",
        '{"a"=>{"b"=>"q, # y, Agent(grugops-orchestrator)"}}',
      ],
      [
        "P5 — the header immediately follows ANOTHER block scalar's content",
        "tools:\n  a: >-\n    r,\n  b: >-\n    # y, Agent(grugops-orchestrator)",
        '{"a"=>"r,", "b"=>"# y, Agent(grugops-orchestrator)"}',
      ],
      [
        "P6 — the header is an explicit block-mapping VALUE (`? k` / `: >-`)",
        "tools:\n  ? k\n  : >-\n      q,\n      # y, Agent(grugops-orchestrator)",
        '{"k"=>"q, # y, Agent(grugops-orchestrator)"}',
      ],
      [
        "P7 — the header is the explicit block-mapping KEY itself (`? >-`)",
        "tools:\n  ? >-\n      q,\n      # y, Agent(grugops-orchestrator)\n  : v",
        '{"q, # y, Agent(grugops-orchestrator)"=>"v"}',
      ],
      [
        "P8 — the explicit key form inside a sequence item",
        "tools:\n  - ? >-\n        q,\n        # y, Agent(grugops-orchestrator)\n    : v",
        '[{"q, # y, Agent(grugops-orchestrator)"=>"v"}]',
      ],
      [
        "UNION — a nested header whose content carries a single-quoted scalar with the `''` escape",
        "tools:\n  nested: >-\n    'Read'' s,\n    # x, Agent(grugops-orchestrator)'",
        '{"nested"=>"\'Read\'\' s, # x, Agent(grugops-orchestrator)\'"}',
      ],
    ];
    for (const [label, region, loaderValue] of ROWS) {
      const text = `---\nname: grugops-plan\n${region}\n---\nBody.\n`;
      expect(
        hasSpawnGrant(text),
        `${label} — the loader reads this as ${loaderValue}`,
      ).toEqual({ ok: true, value: true });
      expect(grantedAgentNames(text), label).toEqual({
        ok: true,
        value: ["grugops-orchestrator"],
      });
    }
    // NON-VACUITY, DERIVED RATHER THAN CLAIMED: every row must actually carry a block-scalar header
    // on a line that is NOT the top-level key line, or the case is testing the position that already
    // worked. Computed from the rows themselves, so a row added without one fails here.
    const nestedHeaderRows = ROWS.filter(([, region]) =>
      region
        .split("\n")
        .slice(1)
        .some((l) => /(^|\s)[|>][0-9]*[+-]?([ \t]|$)/.test(l)),
    );
    expect(
      nestedHeaderRows.length,
      "every row must carry a block-scalar header BELOW the top-level key line",
    ).toBe(ROWS.length);
  });

  it("D-57 row g5 — the module's NAME SET equals the loader's, because a LITERAL `|` scalar keeps its line breaks", () => {
    // THE OTHER HALF OF THE FAMILY, AND IT IS A NAME-SET FACT RATHER THAN A BOOLEAN. `tools:` /
    // `  nested: |` / `    Agent(alpha, ga` / `    - mma)` is read by libyaml as
    // `{"nested"=>"Agent(alpha, ga\n- mma)\n"}` — a line break INSIDE the enumeration. This module's
    // own `ENUMERATION_LEGAL_CHARS` does not contain a line break, so the loader's value REFUSES.
    //
    // Before D-57 the module joined every block scalar's lines with a SPACE regardless of indicator,
    // enumerated `["alpha","ga - mma"]` and returned it on the SUCCESS arm — two names for a value
    // the loader will not enumerate at all. Now the join is derived from the indicator (YAML 1.2
    // § 8.1.2 literal PRESERVES the break, § 8.1.3 folded FOLDS it), so both sides refuse and the
    // D-09 "a name is never silently dropped or altered" equality holds.
    const literal =
      "---\nname: x\ntools:\n  nested: |\n    Agent(alpha, ga\n    - mma)\n---\nBody.\n";
    const names = grantedAgentNames(literal);
    expect(names.ok, "the loader refuses this enumeration, so the module must too").toBe(false);
    if (!names.ok) expect(names.reason).toMatch(/outside the legal character set/);
    // THE FOLDED SPELLING IS THE CONTROL, and it is the SAME document with one character changed: a
    // folded scalar's break IS a space, so the enumeration is legal and BOTH sides read two names.
    const folded =
      "---\nname: x\ntools:\n  nested: >\n    Agent(alpha, ga\n    - mma)\n---\nBody.\n";
    expect(grantedAgentNames(folded)).toEqual({
      ok: true,
      value: ["alpha", "ga - mma"],
    });
  });

  it("D-57 false-red controls — the shapes a real loader ACCEPTS as CONTENT must keep their bytes", () => {
    // THE GATE IS PER FORM, AND THIS IS THE ROW THAT MAKES IT SO. `tools: see` / `  >-` / `  q,` is a
    // document libyaml ACCEPTS and reads as the plain scalar `"see >- q,"` — the `>-` is CONTENT
    // there, not a header. Recognising a BARE header at that position would DELETE those bytes from a
    // loader-accepted value, which is this module's founding failure. So the bare form keeps the full
    // `startsNode` gate while the KEYED form does not (a plain scalar cannot contain `: `, so every
    // document in which a keyed header line is not a mapping entry is one the loader refuses).
    const bare = parseFrontmatter(
      "---\nname: x\ntools: see\n  >-\n  q,\n---\nBody.\n",
    );
    expect(bare.ok).toBe(true);
    if (bare.ok) expect(bare.value.get("tools")).toEqual(["see >- q,"]);

    // The EXPLICIT-KEY form is the second one a plain scalar can spell: `tools: see` / `  ? >-` /
    // `  q,` is ACCEPTED by libyaml as `"see ? >- q,"`. So `?` keeps the node-start gate while `:`
    // and `key:` do not — the discriminator is "can a plain scalar spell this introduction", and a
    // plain scalar cannot spell a mapping-VALUE indicator (YAML excludes `: ` from `ns-plain-char`).
    const explicitKeyAsContent = parseFrontmatter(
      "---\nname: x\ntools: see\n  ? >-\n  q,\n---\nBody.\n",
    );
    expect(explicitKeyAsContent.ok).toBe(true);
    if (explicitKeyAsContent.ok) {
      expect(explicitKeyAsContent.value.get("tools")).toEqual(["see ? >- q,"]);
    }

    // The shipped block-sequence idiom keeps TWO items — a block scalar in one item must not collapse
    // the join separator for the whole key (D-09, the invented-name direction).
    const seq = parseFrontmatter(
      "---\nname: x\ntools:\n  - >-\n    alpha\n  - beta\n---\nBody.\n",
    );
    expect(seq.ok).toBe(true);
    if (seq.ok) expect(seq.value.get("tools")).toEqual(["alpha, beta"]);

    // A nested block scalar carrying NO grant must not gain one.
    expect(
      hasSpawnGrant(
        "---\nname: x\ntools:\n  nested: >-\n    Read,\n    # x, Write\n---\nBody.\n",
      ),
    ).toEqual({ ok: true, value: false });

    // The TOP-LEVEL folded block scalar — the one position that already worked — is byte-unchanged.
    const top = parseFrontmatter(
      "---\nname: x\ntools: >-\n  Read,\n  # x, Agent(grugops-orchestrator)\n---\nBody.\n",
    );
    expect(top.ok).toBe(true);
    if (top.ok) {
      expect(top.value.get("tools")).toEqual([
        "Read, # x, Agent(grugops-orchestrator)",
      ]);
    }
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
  // DECLARED join contract.
  //
  // (D-57, round 10) THAT JOIN CONTRACT IS NARROWED TO YAML'S OWN, AND W2-a IS WHERE IT SHOWS. The
  // contract used to read "a block scalar's lines are joined with a single space" for BOTH
  // indicators, so this row asserted `intro --- outro` where libyaml returns `"intro\n---\noutro\n"`.
  // YAML 1.2 § 8.1.2 PRESERVES a literal `|` scalar's line breaks and § 8.1.3 FOLDS a `>` scalar's to
  // a space; the module now derives the join from the indicator's own first character, so W2-a
  // returns the loader's value and W2-c (folded) is BYTE-UNCHANGED — which is what makes this a
  // narrowing of the contract toward the loader rather than a new convention.
  //
  // WHAT MOVED AND IN WHICH DIRECTION, because a moved expectation is a finding unless it is
  // measured: the value's LENGTH is identical (one character either way), so no loader-accepted
  // document returns a SHORTER value; and `SPAWN_TOKEN` tests a WORD BOUNDARY, which a line break
  // satisfies exactly as a space does, so no grant verdict can move in either direction. What the
  // narrowing buys is row g5 of family G — `nested: |` / `    Agent(alpha, ga` / `    - mma)` — whose
  // name set was `["alpha","ga - mma"]` on the SUCCESS arm where the loader's own value carries a
  // line break inside the enumeration and this module's `ENUMERATION_LEGAL_CHARS` REFUSES it. Both
  // sides now refuse, which is the D-09 equality this module promises.

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
        // (D-57) The module now returns the loader's own line breaks for a LITERAL `|` scalar; only
        // the trailing break the loader keeps is absent, because the flush trims the joined value.
        description: "intro\n---\noutro",
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
      // (D-57) A LITERAL `|` scalar keeps its line breaks — libyaml returns `"intro\n--\noutro\n"`.
      expect(shortPayload.value.get("description")).toEqual(["intro\n--\noutro"]);
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
    // (27-50, WR-05 / D-56 item 4) THE SECOND ROW'S EXPECTED LABEL MOVED, AND THAT MOVE IS THE
    // FINDING. It read `U+0020` — the space the line BEGINS with, which is inside
    // `DELIMITER_WS_CHAR` and is not why the line refused. A refusal exists to send a reader to the
    // byte to fix; this row pinned it sending them to a legal one. The offending code point is now
    // carried out of the same scan that already visits it. See the WR-05 cases below.
    const ZWSP = String.fromCodePoint(0x200b);
    const ROWS: readonly { label: string; line: string; names: string }[] = [
      { label: "residue then indentation", line: `${ZWSP} ---`, names: "U+200B" },
      { label: "indentation then residue", line: ` ${ZWSP}---`, names: "U+200B" },
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

  // ── WR-05 (27-50, D-56 item 4) — THE REFUSAL NAMES THE OFFENDING BYTE, NEVER A LEGAL ONE ──────
  //
  // WHAT WAS WRONG. The leading-residue clause interpolated `line.codePointAt(0)`. For a line whose
  // leading run is a legal space followed by a zero-width space, the message read "its leading
  // residue … begins with U+0020" — pointing the reader at an ordinary space, which is inside
  // `DELIMITER_WS_CHAR` and is not why the line refused. `leadingInvisibleRun` already STOOD ON the
  // offending code point when it decided the run was residue, and discarded it.
  //
  // WHY THIS IS A DEFECT AND NOT A COSMETIC. The whole purpose of the D-44/D-50 wording is to name
  // the offending byte so a reader is sent to the right character. The VERDICT was right and the
  // DIAGNOSIS was wrong, which is the failure mode that costs an author the most: a red gate whose
  // message describes a character that is legal there.
  //
  // WHAT THE CLAUSE'S WORDS NOW MEAN, so "begins with" is not read as a second defect. The clause
  // says "its leading RESIDUE … begins with X". The residue is what makes the run residue — the part
  // outside the declared class — and that begins at the first code point outside it. Under the old
  // interpolation the sentence was false about a mixed run; under this one it is true about every
  // residue run, and BYTE-IDENTICAL on every run whose first code point is itself the offender.

  it("WR-05 — a leading run that BEGINS with a legal code point names the one that made it residue, not the one the line begins with", () => {
    const ZWSP = String.fromCodePoint(0x200b);
    const NBSP = String.fromCodePoint(0xa0);
    const TAG_SPACE = String.fromCodePoint(0xe0020);
    // Each row states the code point the refusal MUST name and the one it must NOT — the second
    // column is what makes this a pin rather than a restatement, because the defect was a message
    // that named a real code point of the line and merely the WRONG one.
    const ROWS: readonly {
      label: string;
      line: string;
      names: string;
      never: string | null;
    }[] = [
      {
        label: "a legal SPACE, then the offender (the exact WR-05 shape)",
        line: ` ${ZWSP}---`,
        names: "U+200B",
        never: "U+0020",
      },
      {
        label: "a legal TAB, then the offender",
        line: `\t${ZWSP}---`,
        names: "U+200B",
        never: "U+0009",
      },
      {
        label: "two legal spaces, then a NO-BREAK SPACE",
        line: `  ${NBSP}---`,
        names: "U+00A0",
        never: "U+0020",
      },
      {
        label:
          "a legal space, then a SUPPLEMENTARY-PLANE offender (adjacency meets the code-point label)",
        line: ` ${TAG_SPACE}---`,
        names: "U+E0020",
        never: "U+0020",
      },
      {
        label: "a legal space, then the offender, AND illegal trailing residue",
        line: ` ${ZWSP}---${ZWSP}`,
        names: "U+200B",
        never: "U+0020",
      },
      // THE CONTROL. The offender is already first, so the fix must not trade one wrong answer for
      // another: this row's reason is byte-identical before and after.
      {
        label: "CONTROL — the offender is itself the first code point",
        line: `${ZWSP}---`,
        names: "U+200B",
        never: null,
      },
      {
        label: "CONTROL — a NO-BREAK SPACE first, which is NOT the declared class",
        line: `${NBSP}---`,
        names: "U+00A0",
        never: null,
      },
    ];

    for (const row of ROWS) {
      for (const position of ["opening", "closing"] as const) {
        const where = `${row.label} @ ${position}`;
        const parsed = parseFrontmatter(buildDelimiterDoc(row.line, position));
        expect(parsed.ok, where).toBe(false);
        if (parsed.ok) continue;
        expect(parsed.reason, where).toContain(
          `${position} delimiter position carries`,
        );
        expect(parsed.reason, `${where} — leading clause`).toContain(
          "its leading residue renders no glyph of its own and begins with",
        );
        expect(parsed.reason, `${where} — must NAME the offender`).toContain(
          `begins with ${row.names}`,
        );
        if (row.never !== null) {
          // The refusal must not name a code point that is INSIDE the declared class. Asserted on
          // the clause rather than on the whole reason, because the excerpt legitimately reproduces
          // the line's bytes and a whole-reason assertion would be about the excerpt.
          expect(
            parsed.reason,
            `${where} — must NOT name the legal code point ${row.never}`,
          ).not.toContain(`begins with ${row.never}`);
        }
        expect(projectVerdict(row.line, position), where).toBe("refuse");
      }
    }
  });

  it("WR-05 boundary — the offending code point is UNREPRESENTABLE on a run that has none: it lives on the RESIDUE arm alone", () => {
    // THE TYPE, NOT A CONVENTION. "The offending code point of a run that has none" is not merely
    // untested — it cannot be written. A field defaulted on the indentation arm would be a value a
    // later reader could interpolate, and interpolating it would reintroduce exactly WR-05.
    const src = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const code = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    const at = code.indexOf("type LeadingRun =");
    expect(at).toBeGreaterThan(0);
    // The declaration's own bound, stated rather than guessed: a union arm carries semicolons of its
    // own, so `indexOf(";")` lands INSIDE the first arm. The declaration ends at the first LINE that
    // ends in a semicolon, and that premise is asserted before the slice is read — the IN-03 lesson
    // applied to the case that closes IN-03.
    const declLines = code.slice(at).split("\n");
    const endIdx = declLines.findIndex((l) => l.trimEnd().endsWith(";"));
    expect(
      endIdx,
      "PREMISE — the LeadingRun declaration must terminate in a line ending with `;`",
    ).toBeGreaterThan(0);
    const decl = declLines.slice(0, endIdx + 1).join("\n");
    expect(decl).toContain('| { kind: "none"; length: 0 }');
    expect(decl).toContain('| { kind: "indentation"; length: number }');
    expect(decl).toContain(
      '| { kind: "residue"; length: number; firstOutsideDeclared: number }',
    );
    // Two-sided: exactly ONE arm carries it. A one-sided "the residue arm has it" assertion would
    // stay green on the day a defaulted copy appears on the indentation arm.
    expect(
      decl.split("firstOutsideDeclared").length - 1,
      "the offending code point is declared on exactly one arm of LeadingRun",
    ).toBe(1);

    // And the observable half: a run that is ENTIRELY the declared class is INDENTATION. At the
    // CLOSING position that is `not-a-delimiter` and there is no fault at all; at the OPENING
    // position it still refuses (the D-50 asymmetry) naming the line's first code point, which is
    // what "the delimiter does not begin where the line begins" is about there — and that reason is
    // byte-unchanged by WR-05, because an indentation run has no offending code point to name.
    for (const line of ["  ---", "\t---", " \t ---"]) {
      expect(projectVerdict(line, "closing"), line).toBe("not-a-delimiter");
      const opening = parseFrontmatter(buildDelimiterDoc(line, "opening"));
      expect(opening.ok, line).toBe(false);
      if (opening.ok) continue;
      expect(opening.reason, line).toContain(
        `begins with ${line.startsWith("\t") ? "U+0009" : "U+0020"}`,
      );
    }
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
  // (27-44, D-53, closing IN-02) AND EVERY CONSTRUCT IN BOTH ARRAYS IS NOW INDIVIDUALLY PINNED: each
  // array carries a length assertion and each member carries a planted fixture that the classifier
  // recognises THROUGH THAT MEMBER AND NO OTHER, so a member dropped by a later edit narrows the
  // refusal claim LOUDLY instead of leaving the live assertion passing on the two real files that
  // still match through the remaining patterns.
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
  // (27-44, D-53, closing IN-02) THE TWO ARRAYS ARE PARAMETERS RATHER THAN CLOSED-OVER CONSTANTS, for
  // ONE reason: the per-construct load-bearing fixtures below must run the classifier with a single
  // construct REMOVED, and doing that with a second, differently-spelled classifier would measure the
  // copy instead of the rule. One classifier, called with different construct sets.
  const isGrammarSite = (
    src: string,
    head: readonly RegExp[] = HEAD_DELIMITER_CONSTRUCTS,
    key: readonly RegExp[] = KEY_LINE_CONSTRUCTS,
  ): boolean => head.some((r) => r.test(src)) && key.some((r) => r.test(src));
  // A pure classifier over supplied paths, so the live corpus and the planted-third-grammar corpus
  // go through THE SAME rule rather than through two spellings of it.
  const grammarSitesAmong = (
    paths: string[],
    read: (p: string) => string,
    head: readonly RegExp[] = HEAD_DELIMITER_CONSTRUCTS,
    key: readonly RegExp[] = KEY_LINE_CONSTRUCTS,
  ): string[] =>
    paths
      .filter((p) => p.endsWith(".ts") && !p.endsWith(".test.ts"))
      .filter((p) => !/(^|\/)frontmatter\.ts$/.test(p))
      .filter((p) => isGrammarSite(read(p), head, key))
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

  // ── (27-44, D-53, closing IN-02) EVERY CONSTRUCT PINNED, AND EVERY CONSTRUCT LOAD-BEARING ───────

  it("D-53 IN-02 — both construct arrays carry a cardinality pin, and EVERY construct is individually load-bearing for a planted fixture", () => {
    // WHAT THE TWO LENGTH PINS PROTECT AGAINST, STATED RATHER THAN LEFT TO BE INFERRED. Every other
    // set in this phase carries a cardinality assertion; these two did not. A member dropped from
    // either array NARROWS the detector while the live assertion above keeps passing, because the two
    // real files still match through the remaining patterns — the "refusal claim shrinks silently"
    // shape `REFUSED_FORMS`'s own floor exists to prevent, one file over. These are FLOORS against
    // shrinking; they are not, and cannot be, a completeness claim about the shapes a grammar can take
    // (that disclosure is above and stands unchanged).
    expect(
      HEAD_DELIMITER_CONSTRUCTS,
      "a head-delimiter construct dropped silently narrows the one-grammar refusal claim",
    ).toHaveLength(3);
    expect(
      KEY_LINE_CONSTRUCTS,
      "a key-line construct dropped silently narrows the one-grammar refusal claim",
    ).toHaveLength(3);

    // A LENGTH PIN ALONE IS STILL ONLY A PIN AGAINST SHRINKING. What makes each construct genuinely
    // required is a fixture that the classifier recognises through THAT construct and through no
    // other member of its array — so removing the construct makes the classifier MISS the fixture.
    // Each fixture pairs the construct under test with a partner from the other array, and every
    // (head, key) pairing below is distinct, so no two fixtures are the same file twice.
    const headGuard: readonly (readonly [string, string])[] = [
      ["const HEAD_RE = /^---\\n/;", "  if (!HEAD_RE.test(text)) return {};"],
      ["", '  if (!text.startsWith("---")) return {};'],
      ["", '  if (!(text.indexOf("---") === 0)) return {};'],
    ];
    const keyBody: readonly (readonly [string, readonly string[]])[] = [
      [
        "const KEY_RE = /^([A-Za-z_]+):\\s*(.*)$/;",
        [
          '  for (const line of text.split("\\n")) {',
          "    const m = line.match(KEY_RE);",
          "    if (m) out[m[1]] = m[2];",
          "  }",
        ],
      ],
      [
        // The ONLY spelling that matches the second key-line construct without also matching the
        // first: the first allows at most 60 characters between `^` and `:\s*`, and this alternation
        // is 58, so adding the `\s*` before the colon pushes it past that bound. A shorter key list
        // would match BOTH constructs and the fixture would prove nothing — which is itself the
        // finding that the second construct is very nearly subsumed by the first.
        "const KEY_RE = /^(name|description|tools|allowed-tools|model|disable-model)\\s*:\\s*(.*)$/;",
        [
          '  for (const line of text.split("\\n")) {',
          "    const m = line.match(KEY_RE);",
          "    if (m) out[m[1]] = m[2];",
          "  }",
        ],
      ],
      [
        "",
        [
          '  for (const line of text.split("\\n")) {',
          '    const at = line.split(":");',
          "    if (at.length > 1) out[at[0]] = at[1];",
          "  }",
        ],
      ],
    ];
    const buildFixture = (head: number, key: number): string =>
      [
        headGuard[head][0],
        keyBody[key][0],
        "export function readBlock(text: string): Record<string, string> {",
        headGuard[head][1],
        "  const out: Record<string, string> = {};",
        ...keyBody[key][1],
        "  return out;",
        "}",
        "",
      ]
        .filter((line) => line !== "")
        .join("\n");

    interface Fixture {
      readonly file: string;
      readonly array: "head" | "key";
      readonly index: number;
      readonly head: number;
      readonly key: number;
    }
    const FIXTURES: readonly Fixture[] = [
      { file: "head-0-anchored-regex-literal.ts", array: "head", index: 0, head: 0, key: 0 },
      { file: "head-1-starts-with.ts", array: "head", index: 1, head: 1, key: 2 },
      { file: "head-2-index-of.ts", array: "head", index: 2, head: 2, key: 0 },
      { file: "key-0-anchored-colon.ts", array: "key", index: 0, head: 1, key: 0 },
      { file: "key-1-space-before-colon.ts", array: "key", index: 1, head: 1, key: 1 },
      { file: "key-2-split-on-colon.ts", array: "key", index: 2, head: 2, key: 2 },
    ];
    // ONE FIXTURE PER CONSTRUCT, DERIVED FROM THE ARRAY LENGTHS RATHER THAN COUNTED BY HAND. If either
    // array grows, this fails until the new construct gets a fixture — which is the whole point.
    expect(
      FIXTURES.length,
      "one planted fixture per construct, across both arrays",
    ).toBe(HEAD_DELIMITER_CONSTRUCTS.length + KEY_LINE_CONSTRUCTS.length);
    expect(new Set(FIXTURES.map((f) => `${f.array}:${f.index}`)).size).toBe(
      FIXTURES.length,
    );
    expect(new Set(FIXTURES.map((f) => `${f.head}:${f.key}`)).size).toBe(
      FIXTURES.length,
    );

    // Temp directory only — the live scripts/ tree is never written to, so a fixture cannot corrupt
    // the corpus this detector measures.
    const dir = mkdtempSync(join(tmpdir(), "grugops-construct-"));
    const read = (p: string): string => readFileSync(join(dir, p), "utf8");
    const sitesWith = (
      head: readonly RegExp[],
      key: readonly RegExp[],
    ): string[] => grammarSitesAmong(readdirSync(dir), read, head, key);
    try {
      for (const fixture of FIXTURES) {
        writeFileSync(
          join(dir, fixture.file),
          buildFixture(fixture.head, fixture.key),
        );
      }

      // CONTROL FIRST: with both arrays whole, every fixture is recognised. Without this a fixture
      // that is missed for an unrelated reason would satisfy the load-bearing half vacuously.
      expect(
        sitesWith(HEAD_DELIMITER_CONSTRUCTS, KEY_LINE_CONSTRUCTS),
        "with both arrays whole, every planted fixture must be recognised",
      ).toEqual([...FIXTURES.map((f) => f.file)].sort());

      // EACH FIXTURE MATCHES EXACTLY ONE CONSTRUCT IN EACH ARRAY, asserted rather than assumed. This
      // is what makes the removal below attributable to the removed construct and to nothing else.
      for (const fixture of FIXTURES) {
        const source = buildFixture(fixture.head, fixture.key);
        expect(
          HEAD_DELIMITER_CONSTRUCTS.map((r, i) => (r.test(source) ? i : -1)).filter(
            (i) => i !== -1,
          ),
          `${fixture.file}: head constructs matched`,
        ).toEqual([fixture.head]);
        expect(
          KEY_LINE_CONSTRUCTS.map((r, i) => (r.test(source) ? i : -1)).filter(
            (i) => i !== -1,
          ),
          `${fixture.file}: key constructs matched`,
        ).toEqual([fixture.key]);
      }

      // THE LOAD-BEARING HALF: drop the one construct and the classifier must MISS its fixture.
      for (const fixture of FIXTURES) {
        const head =
          fixture.array === "head"
            ? HEAD_DELIMITER_CONSTRUCTS.filter((_, i) => i !== fixture.index)
            : HEAD_DELIMITER_CONSTRUCTS;
        const key =
          fixture.array === "key"
            ? KEY_LINE_CONSTRUCTS.filter((_, i) => i !== fixture.index)
            : KEY_LINE_CONSTRUCTS;
        expect(
          head.length + key.length,
          "exactly one construct is removed per probe",
        ).toBe(HEAD_DELIMITER_CONSTRUCTS.length + KEY_LINE_CONSTRUCTS.length - 1);
        expect(
          sitesWith(head, key),
          `${fixture.file}: dropping ${fixture.array} construct [${fixture.index}] must make the classifier MISS it — a construct that can be deleted with the fixture still recognised is not load-bearing`,
        ).not.toContain(fixture.file);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }

    // AND THE LIVE ANSWER IS UNMOVED BY ANY OF THIS. The parameterised classifier defaults to the two
    // whole arrays, so the real corpus goes through exactly the rule it went through before.
    expect(liveGrammarSites()).toEqual([
      "scripts/context-io.ts",
      "scripts/generate-catalog.ts",
    ]);
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

  it("a FENCED `---` cannot close a real unterminated block — the region refuses at the fence before it can reach one", () => {
    // This is the case that DISCRIMINATES: a fence-blind reader would take the `---` inside the
    // fenced example as the closing delimiter of the real (unterminated) block, parse the fenced
    // example's lines as frontmatter, and report a grant that is documentation. The result is the
    // parse-failure arm — the guard goes red and a human decides, which is the correct outcome for a
    // malformed file.
    //
    // (Plan 27-45, D-53 — WR-02) THE MECHANISM CHANGED AND THE OUTCOME DID NOT, WHICH IS WHY THIS
    // CASE'S TITLE MOVED. It used to hold because the fence strip ran BEFORE the block scan and
    // deleted the fenced example outright. That ordering is the WR-02 defect: a deletion running
    // before the region is located deletes lines inside the region too. Now the region is located
    // first and the fenced example's OPENING fence line — which is inside the still-open region — is
    // refused by name, so the `---` beneath it is never reached. The protection is preserved by a
    // REFUSAL rather than by a deletion, which is the direction this module's contract requires.
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
    expect(parsed.ok ? "" : parsed.reason).toContain(
      "carries the code-fence delimiter line",
    );
    expect(hasSpawnGrant(text).ok).toBe(false);
    // And the fence helper itself is STILL the one authority, byte-unchanged, for the consumers that
    // legitimately want a fence-stripped PROSE body — it is simply no longer applied to the region.
    expect(stripFencedBlocks(text)).not.toContain("grugops-not-a-real-role");
  });

  // ── WR-02 (plan 27-45, D-53): the region is located BEFORE anything is deleted from it ─────────
  //
  // THE DEFECT, STATED ONCE FOR ALL FOUR CASES BELOW. The fence authority was applied to the RAW
  // document inside `parseFrontmatter`, before the frontmatter region was located. Its line-dropping
  // therefore applied inside the region as readily as inside the body: a column-0 fence line inside
  // the region deleted content and the TRUNCATED result was returned on the SUCCESS arm. That is this
  // module's founding failure wearing a fence — "I could not read this" reported as a value.
  //
  // HOW IT IS SCOPED, HONESTLY. This is a CONTRACT defect and NOT a confirmed live bypass. Both
  // documents that exhibit it are rejected outright by libyaml, and the one spelling libyaml accepts
  // the module already refuses in the safe direction. The loader column below was taken with
  // /usr/bin/ruby -ryaml (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) at execution time.
  const WR02_FENCE = "`".repeat(3);
  const WR02_TOKEN = "Agent(grugops-orchestrator)";

  it("WR-02 d1: a fence around a whole `tools` key REFUSES — the key used to VANISH and `{ok:true,value:false}` was reported (libyaml: Psych::SyntaxError)", () => {
    // BEFORE (measured against the committed build at HEAD b24d980-descendant, plan 27-45 execution):
    //   {"arm":"ok","keys":{"name":["r"]},"grant":false}   — the whole `tools` key is GONE.
    // LOADER: REJECT — "found character that cannot start any token ... at line 2 column 1".
    // So the refusal direction is the loader's direction; nothing the platform loads turns red.
    const text = [
      "---",
      "name: r",
      WR02_FENCE,
      `tools: Read, ${WR02_TOKEN}`,
      WR02_FENCE,
      "---",
      "",
      "body",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    const reason = parsed.ok ? "" : parsed.reason;
    // The refusal NAMES the fence, the line number in the DOCUMENT, and why a fence is not content
    // this module may account for.
    expect(reason).toContain("carries the code-fence delimiter line");
    expect(reason).toContain("at line 3");
    expect(reason).toContain("not a legal node in a top-level block mapping");
    // And it is never the shorter-value arm: a name is never silently dropped, and neither is a key.
    expect(hasSpawnGrant(text).ok).toBe(false);
    expect(grantedAgentNames(text).ok).toBe(false);
  });

  it("WR-02 d2: a fence around a CONTINUATION line REFUSES — the token used to be DELETED from the value, leaving tools=[\"Read,\"] (libyaml: Psych::SyntaxError)", () => {
    // BEFORE (measured against the committed build):
    //   {"arm":"ok","keys":{"name":["r"],"tools":["Read,"]},"grant":false}  — the token DELETED.
    // LOADER: REJECT — "found character that cannot start any token ... at line 3 column 1".
    const text = [
      "---",
      "name: r",
      "tools: Read,",
      WR02_FENCE,
      `  ${WR02_TOKEN}`,
      WR02_FENCE,
      "---",
      "",
      "body",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    const reason = parsed.ok ? "" : parsed.reason;
    expect(reason).toContain("carries the code-fence delimiter line");
    expect(reason).toContain("at line 4");
    // The refusal says in words what the defect WAS, so a later reader cannot re-introduce it by
    // "simplifying" the message.
    expect(reason).toContain(
      "rather than having those lines DELETED and the shorter remainder reported as a value",
    );
    expect(hasSpawnGrant(text).ok).toBe(false);
  });

  it("WR-02 d3 (the SAFE-DIRECTION CONTROL): fences inside a double-quoted scalar still REFUSE, where libyaml ACCEPTS the document as a grant", () => {
    // This is the one spelling of the three where the module and the loader DISAGREE, and it
    // disagrees in the safe direction — the module refuses, the loader grants. It was already refused
    // before this change (for a different reason: the trailing lone `"` was an unreadable key line)
    // and it is still refused after it (the fence inside the region is reached first). The SUBSTANCE
    // is unchanged: this document never reaches the success arm, so no grant is ever silently lost.
    //
    // LOADER: ACCEPT — {"name"=>"r", "tools"=>"Read ``` Agent(grugops-orchestrator) ``` "}, which
    // CARRIES the spawn token. Recorded rather than "fixed": making the module parse it would mean
    // implementing multi-line double-quoted scalars containing fence text, i.e. a second grammar for
    // a value the platform's own loader reads with a first. Refusing is the answer that cannot be
    // wrong; parsing better is the answer that can.
    const text = [
      "---",
      "name: r",
      `tools: "Read`,
      WR02_FENCE,
      WR02_TOKEN,
      WR02_FENCE,
      `"`,
      "---",
      "",
      "body",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(false);
    // Substance, asserted rather than the exact wording: the failure arm, and never a value.
    expect(hasSpawnGrant(text).ok).toBe(false);
    expect(grantedAgentNames(text).ok).toBe(false);
  });

  it("WR-02 control: a fenced frontmatter EXAMPLE in the BODY of a document with a real region still contributes NOTHING to the parsed keys", () => {
    // The false-red control, and the reason the strip's scope shrank rather than the refusal widening.
    // The packaging templates legitimately SHOW frontmatter inside a fence. With the region located
    // first, the region ENDS at its own closing delimiter and the body is never read at all — so the
    // example contributes nothing, exactly as before, WITHOUT any line being deleted to achieve it.
    const text = [
      "---",
      "name: r",
      "tools: Read",
      "---",
      "",
      "Here is an example of an adapter that DOES hold the grant:",
      "",
      WR02_FENCE,
      "---",
      "name: example",
      "coordinator: true",
      `tools: Read, ${WR02_TOKEN}`,
      "---",
      WR02_FENCE,
      "",
      "end",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(true);
    expect(parsed.ok ? [...parsed.value.keys()].sort() : []).toEqual([
      "name",
      "tools",
    ]);
    expect(parsed.ok ? parsed.value.get("tools") : null).toEqual(["Read"]);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    expect(frontmatterValueIs(text, "coordinator", "true")).toEqual({
      ok: true,
      value: false,
    });
  });

  it("WR-02 invariant: `parseFrontmatter` consults the fence authority on NOTHING — the region is located before any line is dropped", () => {
    // (Plan 27-45 assumption delta) The source-inspection pin. It goes RED if a future phase moves a
    // strip back in front of the region location, which is the exact regression this plan corrects.
    // A comment claiming a property is not the property — this module has corrected that shape twice.
    const src = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const start = src.indexOf("export function parseFrontmatter(");
    expect(start).toBeGreaterThan(0);
    const end = src.indexOf("\n// ------", start);
    expect(end).toBeGreaterThan(start);
    // COMMENT LINES ARE REMOVED FIRST, deliberately: the fence scan inside this function CITES
    // `stripFencedBlocks` in prose (it must — that is where the one class is declared), and the
    // property under test is about CODE, not about whether the name is mentioned.
    const body = src
      .slice(start, end)
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    expect(
      body,
      "parseFrontmatter must not apply the fence authority to anything: the strip's scope shrank to the guards' PROSE checks, and re-applying it here is the WR-02 defect",
    ).not.toContain("stripFencedBlocks");
    // And the fence-delimiter CLASS is declared exactly once in the module, so the region scan and
    // the strip cannot come to disagree about what a fence delimiter line is.
    const code = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    // (27-53, WR-02) THIS COUNT IS SCOPED TO THIS MODULE AND ITS MESSAGE NOW SAYS SO. It was kept
    // rather than replaced because it still states something true — inside `frontmatter.ts` the
    // class is declared once — but it counts ONE spelling in ONE file, so it never was, and must
    // not read as, an answer to "how many fence state machines does this tree carry". That question
    // is answered by the DERIVED set below, over every tracked `.ts` and over both spellings.
    expect(
      code.split("/^```/").length - 1,
      "WITHIN THIS MODULE the fence-delimiter line class must be written out exactly ONCE IN CODE (as FENCE_DELIMITER_LINE), so the region scan and the strip cannot disagree; the TREE-WIDE question is the derived fence-machine set, not this count",
    ).toBe(1);
    expect(src).toContain("const FENCE_DELIMITER_LINE = /^```/;");
    // The strip itself must still be the ONE state machine, unchanged and still exported for the
    // guards' prose checks.
    expect(src).toContain("export function stripFencedBlocks(text: string)");
  });

  // ── (Plan 27-53, D-50 / D-53, closing round 9 § WR-02) THE FENCE AUTHORITY'S SCOPE, DERIVED ────
  //
  // THE CLAIM THIS REPLACES WAS UNQUALIFIED AND FALSE WHEN IT WAS WRITTEN. `scripts/frontmatter.ts`
  // asserted that no second fence parser existed, "here or anywhere", and
  // `scripts/check-foundation-guards.ts` restated the same tree-wide uniqueness at its own header.
  // Three other tracked `.ts` files carry a fence state machine of their own, and ONE OF THEM IS
  // check-foundation-guards.ts ITSELF. A prose claim wider than the assertion behind it is this
  // repository's SECOND SYSTEMIC FAILURE CLASS wearing a sentence instead of a set literal.
  //
  // THE PIN THAT WAS SUPPOSED TO CATCH THIS — the WR-02 invariant case one screen up — IS DOUBLY
  // BLIND: it slices `frontmatter.ts` alone, and it counts ONE spelling of the delimiter class. So
  // it cannot see a machine in another file, and it cannot see the `startsWith("```")` spelling
  // anywhere at all. Both blindnesses close here, by the mechanism this module already applies
  // correctly to the frontmatter grammar (the D-50 / IN-05 assertion above): DERIVE the set, SORT
  // it, compare it to a set MEASURED in the same run, PIN the cardinality as a number, and PROVE
  // the pin can fail.
  //
  // WHAT COUNTS AS A FENCE STATE MACHINE, AND WHY IT IS A CONJUNCTION. A machine needs both a
  // DELIMITER RECOGNISER and a piece of MUTABLE STATE the recogniser advances. Requiring both is
  // what keeps a file that merely NAMES the delimiter class — in a string literal, an assertion
  // message or a comment — out of the answer. That discrimination is MEASURED rather than assumed:
  // THIS file names the class twice in code (in the WR-02 invariant case above) and carries no
  // toggle, and the first case below asserts both halves of that, so the conjunction is proven to
  // be doing the work rather than merely believed to.
  //
  // COMMENT LINES ARE STRIPPED BEFORE CLASSIFICATION, for the reason the WR-02 invariant case
  // already gives: the property is about CODE, not about whether a name is mentioned. The strip is
  // also load-bearing for the recogniser arm — `generate-role-adapters.test.ts` CITES the
  // regex-literal spelling in a comment and IMPLEMENTS the prefix-test spelling in code, so without
  // the strip it would be recognised through the wrong construct and the second construct would be
  // decoration.
  //
  // `*.test.ts` IS **NOT** EXCLUDED HERE, AND THAT IS A DELIBERATE DIFFERENCE FROM THE IN-05 SCAN
  // ABOVE RATHER THAN A COPY OF IT. IN-05 excludes them because a case's independently restated
  // PREDICATE is an INPUT to the authority rather than a second authority a consumer reads. That
  // reason does not transfer: WR-02's unaccounted machine LIVES in a `.test.ts`, so applying the
  // same exclusion here would reproduce exactly the blindness the finding is about. Two scans, two
  // exclusion rules, each with its own stated reason; neither inherits the other's.
  //
  // WHAT THIS FLOOR WOULD MISS, NAMED RATHER THAN LEFT UNDISCLOSED: a recogniser built from
  // concatenated fragments or a `new RegExp(...)` string; one that tests `slice(0, 3)` or an
  // `indexOf` form; a state variable that is neither self-negated nor named for the fence (the
  // toggle arm's second construct is variable-name-sensitive ON PURPOSE, because the two
  // awk-derived caveman scopers in check-foundation-guards.ts advance a COUNTER rather than flip a
  // boolean); and a machine written in a language this scan does not read. It is a floor against
  // the shapes a second machine plausibly takes, not a proof that none can exist.
  const FENCE_RECOGNISER_CONSTRUCTS = [
    /\/\^```/, // an anchored regex literal at the head of a line
    /startsWith\(\s*["'`]```/, // a prefix test: line.startsWith(...) on the delimiter run
  ];
  const FENCE_TOGGLE_CONSTRUCTS = [
    /\b(\w+)\s*=\s*!\1\b/, // a boolean flipped by negating itself (inside/outside)
    /\b(?:in)?fence\w*\s*(?:\+\+|\+=\s*1|=\s*(?:true|false))/, // a fence-named counter or flag advanced
  ];
  const codeLinesOf = (src: string): string =>
    src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
  // ONE classifier, called with different construct sets — the same reason the IN-05 classifier
  // above takes its arrays as parameters: the per-construct liveness probe must run THE RULE with a
  // construct removed, and a second spelling of the rule would measure the copy instead.
  const isFenceMachine = (
    src: string,
    rec: readonly RegExp[] = FENCE_RECOGNISER_CONSTRUCTS,
    tog: readonly RegExp[] = FENCE_TOGGLE_CONSTRUCTS,
  ): boolean => {
    const code = codeLinesOf(src);
    return rec.some((r) => r.test(code)) && tog.some((r) => r.test(code));
  };
  const fenceMachinesAmong = (
    paths: string[],
    read: (p: string) => string,
    rec: readonly RegExp[] = FENCE_RECOGNISER_CONSTRUCTS,
    tog: readonly RegExp[] = FENCE_TOGGLE_CONSTRUCTS,
  ): string[] =>
    paths
      .filter((p) => p.endsWith(".ts"))
      .filter((p) => isFenceMachine(read(p), rec, tog))
      .sort();
  const liveFenceMachines = (
    rec: readonly RegExp[] = FENCE_RECOGNISER_CONSTRUCTS,
    tog: readonly RegExp[] = FENCE_TOGGLE_CONSTRUCTS,
  ): string[] =>
    fenceMachinesAmong(
      trackedTs(),
      (p) => readFileSync(join(REPO_ROOT, p), "utf8"),
      rec,
      tog,
    );
  // THE NAMED SET IS THE MEASUREMENT, WRITTEN DOWN. It was produced by running the classifier above
  // over the live tree in the SAME session that wrote this line — not transcribed from the review,
  // whose proposed hand-list named three files and omitted `check-foundation-guards.test.ts`
  // entirely. Transcribing it would have shipped the set-literal-drift defect inside its own fix.
  const FENCE_MACHINES = [
    "scripts/check-foundation-guards.test.ts",
    "scripts/check-foundation-guards.ts",
    "scripts/frontmatter.ts",
    "scripts/generate-role-adapters.test.ts",
  ];
  // The planted machine is ASSEMBLED from character codes rather than written out literally, so
  // THIS file's own source never carries a recogniser-and-toggle pair. The self-reference is real
  // and not hypothetical: this file already names the delimiter class in code, so a literal
  // self-negating toggle beside it would make this file a fifth member and fail the live assertion
  // on itself — the harness defeating its own premise, three rounds running.
  const TICKS = String.fromCharCode(96, 96, 96);
  const BANG = String.fromCharCode(33);
  const plantedFenceMachine = (fn: string): string =>
    [
      `export function ${fn}(lines: readonly string[]): string[] {`,
      "  const kept: string[] = [];",
      "  let open = false;",
      "  for (const line of lines) {",
      `    if (line.startsWith("${TICKS}")) {`,
      `      open = ${BANG}open;`,
      "      continue;",
      "    }",
      "    if (open) continue;",
      "    kept.push(line);",
      "  }",
      "  return kept;",
      "}",
      "",
    ].join("\n");

  it("27-53 WR-02 — the set of tracked `.ts` files carrying a FENCE STATE MACHINE is derived, sorted and pinned at exactly the four named members", () => {
    const tracked = trackedTs();
    // NON-VACUITY FIRST: the corpus was really enumerated, and it really contains the authority
    // module. Without this every assertion below is satisfied by an empty file list.
    expect(
      tracked.length,
      "the tracked-`.ts` corpus must really have been enumerated before anything is claimed about its contents",
    ).toBeGreaterThan(10);
    expect(tracked).toContain("scripts/frontmatter.ts");

    const machines = liveFenceMachines();
    // Sorted before comparison, so a `git ls-files` output-order change on another filesystem
    // cannot flip the assertion.
    expect(machines).toEqual([...machines].sort());
    expect(machines).toEqual(FENCE_MACHINES);
    // Cardinality pinned as a NUMBER, so a scan that silently stops matching shrinks LOUDLY rather
    // than passing over an empty set.
    expect(machines).toHaveLength(4);

    // THE CONJUNCTION IS PROVEN TO DISCRIMINATE, ON THIS FILE. It matches the recogniser arm and
    // NOT the toggle arm — a textual reference to the delimiter class, not a machine.
    const self = codeLinesOf(
      readFileSync(join(REPO_ROOT, "scripts/frontmatter.test.ts"), "utf8"),
    );
    expect(
      FENCE_RECOGNISER_CONSTRUCTS.some((r) => r.test(self)),
      "this file names the delimiter class IN CODE, so the recogniser arm alone would count it",
    ).toBe(true);
    expect(
      FENCE_TOGGLE_CONSTRUCTS.some((r) => r.test(self)),
      "…and it carries no fence toggle, which is the half that keeps it out of the answer",
    ).toBe(false);
    expect(machines).not.toContain("scripts/frontmatter.test.ts");

    // WHAT BACKS THE NARROWED PROSE AT THE TWO CLAIM SITES. The other PRODUCTION member's two fence
    // machines are each GATED on a `## Caveman prompt` heading, so neither is a second general
    // answer to "which lines of a document are inside a ``` block" — they answer where the caveman
    // block starts and ends, and cannot run on a document without that heading.
    const guards = codeLinesOf(
      readFileSync(join(REPO_ROOT, "scripts/check-foundation-guards.ts"), "utf8"),
    );
    expect(
      [...guards.matchAll(/if \((\w+) && \/\^```\/\.test\(line\)\)/g)].map(
        (m) => m[1],
      ),
      "both fence sites in the guards must be gated by a state flag, never bare",
    ).toEqual(["skip", "seen"]);
    expect(guards.split("/^## Caveman prompt/").length - 1).toBe(2);
    // Two production members and two harness-local ones — the partition the narrowed prose states.
    expect(machines.filter((p) => !p.endsWith(".test.ts"))).toEqual([
      "scripts/check-foundation-guards.ts",
      "scripts/frontmatter.ts",
    ]);

    // AND THE TWO PROSE CLAIMS ARE NARROWED TO WHAT THIS ASSERTION HOLDS. A claim is only worth the
    // mechanism that keeps it honest, so the unqualified wording is pinned ABSENT at both sites and
    // the narrowed wording pinned PRESENT.
    const authority = readFileSync(
      join(REPO_ROOT, "scripts/frontmatter.ts"),
      "utf8",
    );
    expect(
      authority,
      "the unqualified 'here or anywhere' claim must not survive — it was false when written",
    ).not.toContain("No second fence parser is written, here or anywhere");
    expect(authority).toContain(
      "exactly one implementation in this tree answers the GENERAL question",
    );
    const guardsRaw = readFileSync(
      join(REPO_ROOT, "scripts/check-foundation-guards.ts"),
      "utf8",
    );
    expect(
      guardsRaw,
      "…and neither must its tree-wide restatement at the second site",
    ).not.toContain(
      "The tree still has exactly ONE implementation",
    );
    expect(guardsRaw).toContain(
      "this file itself carries two more fence state machines",
    );
  });

  it("27-53 WR-02 — a FIFTH fence state machine makes that set fail, BY NAME", () => {
    // An assertion that was never made to fail is not a pin. Exercised in a temp directory so
    // nothing outside it is touched, and with its own control first.
    const dir = mkdtempSync(join(tmpdir(), "grugops-fence-"));
    const inDir = (): string[] =>
      fenceMachinesAmong(readdirSync(dir), (p) =>
        readFileSync(join(dir, p), "utf8"),
      );
    try {
      for (const real of liveFenceMachines()) {
        writeFileSync(
          join(dir, real.replace(/^.*\//, "")),
          readFileSync(join(REPO_ROOT, real), "utf8"),
        );
      }
      // THE CONTROL FIRST: the copies alone reproduce the live answer, so the failure below is
      // caused by the plant and not by the temp directory.
      const control = inDir();
      expect(control).toEqual(
        FENCE_MACHINES.map((p) => p.replace(/^.*\//, "")).sort(),
      );
      expect(control).toHaveLength(4);

      writeFileSync(
        join(dir, "scratch-fifth-fence-machine.ts"),
        plantedFenceMachine("stripFences"),
      );
      const withFifth = inDir();
      expect(withFifth).toContain("scratch-fifth-fence-machine.ts");
      expect(withFifth).toHaveLength(5);
      expect(withFifth).not.toEqual(control);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("27-53 WR-02 — both construct arrays are pinned by cardinality, and EVERY construct is load-bearing on the LIVE corpus", () => {
    expect(
      FENCE_RECOGNISER_CONSTRUCTS,
      "a recogniser construct dropped silently narrows the fence-machine set",
    ).toHaveLength(2);
    expect(
      FENCE_TOGGLE_CONSTRUCTS,
      "a toggle construct dropped silently narrows the fence-machine set",
    ).toHaveLength(2);

    const base = liveFenceMachines();
    expect(base).toEqual(FENCE_MACHINES);
    for (let i = 0; i < FENCE_RECOGNISER_CONSTRUCTS.length; i += 1) {
      expect(
        liveFenceMachines(
          FENCE_RECOGNISER_CONSTRUCTS.filter((_, j) => j !== i),
          FENCE_TOGGLE_CONSTRUCTS,
        ),
        `dropping recogniser construct [${i}] must MOVE the derived set — a construct that can be deleted with the answer unchanged is decoration`,
      ).not.toEqual(base);
    }
    for (let i = 0; i < FENCE_TOGGLE_CONSTRUCTS.length; i += 1) {
      expect(
        liveFenceMachines(
          FENCE_RECOGNISER_CONSTRUCTS,
          FENCE_TOGGLE_CONSTRUCTS.filter((_, j) => j !== i),
        ),
        `dropping toggle construct [${i}] must MOVE the derived set — a construct that can be deleted with the answer unchanged is decoration`,
      ).not.toEqual(base);
    }

    // EACH MEMBER MATCHES EXACTLY ONE CONSTRUCT IN EACH ARRAY, asserted rather than assumed — which
    // is what makes each removal above attributable to the construct removed and to nothing else.
    for (const p of base) {
      const code = codeLinesOf(readFileSync(join(REPO_ROOT, p), "utf8"));
      expect(
        FENCE_RECOGNISER_CONSTRUCTS.map((r, i) => (r.test(code) ? i : -1)).filter(
          (i) => i !== -1,
        ),
        `${p}: recogniser constructs matched`,
      ).toHaveLength(1);
      expect(
        FENCE_TOGGLE_CONSTRUCTS.map((r, i) => (r.test(code) ? i : -1)).filter(
          (i) => i !== -1,
        ),
        `${p}: toggle constructs matched`,
      ).toHaveLength(1);
    }
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
  // quote carry, the PLAIN wrapped scalar still carried all three directions, so the node-started
  // fact (D-48's `nodeOnKeyLine`, renamed `nodeStarted` by D-55) closes them here rather than in a
  // later plan: closing only the spelling a finding happened to report is the enumerate-the-bad
  // shape this phase has now corrected six times.
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

// ── THE MODULE-SYMBOL LIST, DECLARED ONCE AND SHARED BY EVERY NON-CIRCULARITY PIN ─────────────────
//
// (D-52, round 8) HOISTED OUT OF THE D-49 PIN SO THE D-52 HARNESS BELOW REUSES IT RATHER THAN RETYPING
// IT. Two copies of this list is the set-literal drift class wearing a safety label: the copy that is
// not maintained goes vacuous first and reads exactly like the one that is. One list, two readers.
//
// `cellDoc` is the D-49 sweep's own cell builder rather than a module declaration — it is here so a
// corpus generator cannot quietly delegate to the sweep's builder and inherit its axes. It is exempt
// from the "must still be declared by the module" check below for that reason, by name.
const MODULE_SYMBOLS = [
  "parseFrontmatter",
  "hasSpawnGrant",
  "grantedAgentNames",
  "keysHaveSpawnGrant",
  "keysGrantedAgentNames",
  "stripComment",
  "startsWithReference",
  "unquoteChecked",
  "openQuote",
  // (27-48, D-55) `nodeOnKeyLine` WAS RENAMED AND ITS ENTRY IS RENAMED WITH IT. Leaving the old name
  // here would have passed vacuously in the worst possible way: the module still MENTIONS it, in the
  // comment that narrates the rename, so the "every entry names something the module still declares"
  // check below would have gone on printing green over a name no code carries. That is the same
  // stale-entry class the paragraph a few lines down already names, one round later and one letter
  // subtler. `seqIndent` joins it, because the block-sequence exception is a fact this rule must
  // never be written in terms of either.
  "nodeStarted",
  "seqIndent",
  "flattenBlock",
  "Accumulator",
  "SEQ_ITEM",
  "QuoteState",
  // (D-51 / D-53, round 8) RECONCILED WITH WHAT THE MODULE ACTUALLY DECLARES. `nodeStartQuote`
  // was DELETED by D-51 and is gone from this list: a name the module no longer declares is a
  // STALE ENTRY that passes vacuously, not an assertion, and a list of vacuous entries is the
  // set-literal drift class wearing a safety label. The three symbols D-51 and D-53 introduced
  // are added in its place, so the list keeps its teeth against the module as it is now.
  "ScalarState",
  "FRESH_NODE",
  "assertItemPathScalarClosed",
  // (D-59, round 11) THE REGION VOCABULARY, ADDED ON THE SAME ARGUMENT THE PARAGRAPH ABOVE MAKES
  // ABOUT `nodeStartQuote`. The round-10 build's `sawBlock` is DELETED rather than listed: a name the
  // module no longer declares passes vacuously. These three are what replaced it, so the list keeps
  // its teeth against the module as it is now.
  // Spelled `interface Part` rather than `Part`: a four-letter entry is a substring of ordinary
  // English and matched the generator's own prose, which would have made this pin fail for a reason
  // that has nothing to do with circularity. The entry still names a CODE declaration, which is what
  // the stale-entry check above requires.
  "interface Part",
  "regionText",
  "assertFoldTargetIsNotBlockOwned",
  "cellDoc",
] as const;

// ---------------------------------------------------------------------------
// (27-48, WR-03 — 27-REVIEW-GAPS-8, round 9) THE NAME SET, EXTRACTED FROM THE LOADER'S OWN FLATTENED
// VALUE BY THE MODULE'S OWN ENUMERATION.
// ---------------------------------------------------------------------------
//
// WHY THIS EXISTS. `hasSpawnGrant` is a BOOLEAN, and every differential in this file agreed with the
// loader on that boolean alone. The fact the KIT-03 closure equality and coordinator-resolution-
// precheck are computed over is the NAME SET, and both of those consumers are SET EQUALITIES. Round
// 8's CR-02 row a1 — `tools:` / `  Agent(alpha, ga` / `  - mma)` — enumerated ["alpha","ga","mma"]
// where libyaml expresses ["alpha","ga - mma"], and it passed BOTH harnesses, because an invented
// name does not move a boolean.
//
// WHY IT DELEGATES RATHER THAN RE-IMPLEMENTS, AND WHY THAT IS NOT CIRCULAR. `keysGrantedAgentNames` is
// NOT the thing under test here — the FLATTENED VALUE is. Extracting names two different ways would
// make every disagreement ambiguous: the difference could be the flattener's or the extractor's, and
// the harness could not say which. Delegating to ONE extractor makes the two sides differ in exactly
// one variable, which is the whole of what a differential is for. (The extractor has its own pins
// elsewhere in this file — the value-corpus product, the enumeration-legality cases and the
// grant-occurrence accounting — so it is not unchecked; it is checked SOMEWHERE ELSE, which is the
// only way a differential over it can mean anything.)
//
// ONE COPY, READ BY BOTH HARNESSES. Two hand-kept copies of one safety predicate is the drift class
// this phase has now corrected four times, so these live at file scope beside `MODULE_SYMBOLS`.
const loaderGrantedNames = (loaderFlat: string): Parsed<string[]> =>
  keysGrantedAgentNames(new Map([["tools", [loaderFlat]]]));

// THREE VERDICTS, NOT TWO, AND THE THIRD IS NOT THE EMPTY SET. A refusal says "I will not read this
// value"; an empty list says "I read it and it grants nothing". Folding the first into the second is
// this module's founding failure wearing a harness's clothes, so they render as DIFFERENT STRINGS and
// can never compare equal. Sorted and de-duplicated, so the comparison is over SETS and never over
// cardinality: three names matching three names over two different sets still fails red.
const nameVerdict = (r: Parsed<string[]>): string =>
  r.ok ? JSON.stringify([...new Set(r.value)].sort()) : "refuse";

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

  // ── AXIS 1: SCALAR STYLE (12) ─────────────────────────────────────────────────────────────────
  //
  // Every way a `tools:` value can occupy MORE THAN ONE LINE. Member 6 is the shipped idiom: all 7
  // shipped skills and all 17 shipped agent adapters write their tool list as a block sequence.
  //
  // (D-52 — 27-REVIEW-GAPS-7 § WR-01, round 8) MEMBERS 7-12 ARE THE NODE-START PLACEMENTS THIS AXIS
  // COULD NOT EXPRESS, AND THEIR ABSENCE IS WHY IT PASSED GREEN AT 90 CELLS OVER A LIVE BYPASS. Every
  // one of the first six opens its scalar at one of exactly TWO positions — the first token after
  // `tools:` on the key line, or the first token of a block-sequence item. CR-01's two families both
  // open it somewhere else:
  //
  //   family (a)  the key line carries NO value, so the CONTINUATION line is the node start
  //               -> members 7, 8, 9 (one per quoting style) and member 12
  //   family (b)  the quoted scalar opens MID-LINE inside a flow collection
  //               -> members 10 and 11
  //
  // So neither family was in this sweep's EXPRESSIBLE SPACE — not merely untested. That is the
  // set-literal drift class one level up: `expect(length).toBe(6)` pinned the list against SHRINKING
  // and nothing pinned it against INCOMPLETENESS, which is exactly the corollary the header above
  // states and this axis then failed to apply. Round 8 adds the placements that make the defect class
  // expressible at all, so it can be RED before the fix and GREEN after it.
  //
  // (27-44, D-52) AND THE COMPLETENESS CLAIM HAS SINCE LEFT THIS AXIS ENTIRELY. It now lives in the
  // "D-52 loader differential" describe further down this file, whose corpus is GENERATED and whose
  // expected value is a real YAML 1.2 loader's. The length pin below is a floor against shrinking and
  // is not, and never was, a statement about coverage.
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
    // ── family (a): the key line carries no value, so the FIRST CONTINUATION LINE is the node start
    {
      label: "value node on continuation, double-quoted",
      build: (l1, l2) => `tools:\n  "${l1}\n  ${l2}"`,
    },
    {
      label: "value node on continuation, single-quoted",
      build: (l1, l2) => `tools:\n  '${l1}\n  ${l2}'`,
    },
    {
      label: "value node on continuation, plain",
      build: (l1, l2) => `tools:\n  ${l1}\n  ${l2}`,
    },
    // ── family (b): the quoted scalar opens MID-LINE, inside a flow collection
    {
      label: "flow sequence with a wrapped quoted item",
      build: (l1, l2) => `tools: [Read,\n  "${l1}\n  ${l2}"]`,
    },
    {
      label: "flow mapping with a wrapped quoted value",
      build: (l1, l2) => `tools: {a: "${l1}\n  ${l2}"}`,
    },
    // ── family (a) again, in the shipped block-sequence idiom: the dash line carries NO value, so the
    // item's OWN continuation is where its scalar opens.
    {
      label: "block-sequence item opening on its own continuation",
      build: (l1, l2) => `tools:\n  - Read\n  -\n    "${l1}\n    ${l2}"`,
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
  //
  // (D-52, round 8) THE RULE COVERS THE SIX NEW PLACEMENTS FROM THE SAME FOUR STATEMENTS — IT IS NOT
  // SIX MORE PER-CELL ANSWERS.
  //
  //   5. Members 7, 8, 10, 11 and 12 all wrap the value in a QUOTED scalar; only the POSITION at
  //      which that scalar opens is new (a continuation line, or mid-line inside a flow collection).
  //      Rule 1 already decides them: every character inside a quoted scalar is content at every
  //      placement, so the token on the continuation line always survives. They join the
  //      `contentEverywhere` set for that reason and for no other.
  //   6. Member 9 is PLAIN, so rules 2-4 decide it — and, since D-55, they decide it with NO module
  //      contract standing beside them.
  //
  // (27-48, D-55 point 3 — 27-REVIEW-GAPS-8 § CR-02 direction (c)) A SIXTH RULE STOOD HERE AND IT IS
  // RETIRED. It said this module treats EVERY indented line of a valueless key as a node start, named
  // the resulting refusals a MEASURED DIVERGENCE in the safe direction, and carried them forward.
  //
  //   WHAT WAS MEASURED WAS REAL. `tools:` / `  Read,` / `  *Agent(x)` was refused and libyaml loads
  //   it as text. That has been re-measured against the D-55 build and the loader, cell by cell, and
  //   is recorded in 27-48-SUMMARY.md.
  //
  //   WHAT THE FRAMING DID IS WHY IT IS GONE. The refusals shared ONE root cause with two directions
  //   that are neither safe nor recorded: an INVENTED NAME on the `ok:true` arm (`tools:` /
  //   `  Agent(alpha, ga` / `  - mma)` enumerated ["alpha","ga","mma"] where libyaml expresses
  //   ["alpha","ga - mma"]) and a MODULE GRANT THE LOADER DOES NOT HAVE (`tools:` / `  Read,` /
  //   `  "Write,` / `  # x, TOKEN"`). Naming one direction and calling it "the ONE named module
  //   contract" retired the only signal that its siblings existed, and both were live for a further
  //   round. A measured divergence is RECORDED AS A DIVERGENCE; it is never promoted to a contract.
  //
  //   AND NO REPLACEMENT ONE-DIRECTION CLAIM IS WRITTEN HERE, deliberately. The reason this paragraph
  //   replaced a rule rather than restating it is that a rule naming one direction made its siblings
  //   invisible; a new one would do the same thing to whatever direction is next.
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
      styleLabel === "folded block scalar" ||
      // Rule 5 — the same quoted-content fact, at the five new opening POSITIONS.
      styleLabel === "value node on continuation, double-quoted" ||
      styleLabel === "value node on continuation, single-quoted" ||
      styleLabel === "flow sequence with a wrapped quoted item" ||
      styleLabel === "flow mapping with a wrapped quoted value" ||
      styleLabel === "block-sequence item opening on its own continuation";
    // Rule 1.
    if (contentEverywhere) return { arm: "ok", grant: true };

    const onLine1 = placementLabel === "line 1" || placementLabel === "both";
    const onContinuation =
      placementLabel === "continuation" || placementLabel === "both";

    // Rule 6 — the plain scalar whose node begins on a continuation line NEEDS NO BRANCH. Rules 2-4
    // below decide it from YAML alone: the FIRST indented line is the value's node start and the ones
    // after it continue the scalar it began, which is exactly what rules 3 and 4 already say about a
    // key line and its continuations. The branch that stood here is retired with D-55; see the
    // paragraph above the rule for what it claimed and why the claim did not survive its siblings.

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

  it("D-49 cross-product sweep — 12 scalar styles x 5 sigils x 3 placements", () => {
    // DERIVE THE SET, ASSERT THE COUNT. A table silently emptied by a later edit shrinks the sweep
    // LOUDLY rather than quietly. (D-52) The style axis MOVED DELIBERATELY here, from 6 to 12: these
    // pins are floors against silent shrinking, so growing one is an edit a reader must see, and the
    // 90 -> 180 movement is recorded in 27-43-SUMMARY.md beside the 28 cells whose verdict changed.
    expect(SWEEP_SCALAR_STYLE.length).toBe(12);
    expect(SWEEP_SIGIL.length).toBe(5);
    expect(SWEEP_PLACEMENT.length).toBe(3);
    // The total is DERIVED from the three axis lengths and never restated as a literal; the line
    // below compares that product to itself only to make the number visible in a failure message.
    const CELLS =
      SWEEP_SCALAR_STYLE.length * SWEEP_SIGIL.length * SWEEP_PLACEMENT.length;
    expect(CELLS).toBe(
      SWEEP_SCALAR_STYLE.length * SWEEP_SIGIL.length * SWEEP_PLACEMENT.length,
    );

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
    //
    // (D-52, round 8) THE LIST IS THE FILE-SCOPE `MODULE_SYMBOLS` ABOVE, shared with the D-52 loader
    // differential's own non-circularity pin. Two hand-kept copies of one safety set is the drift
    // class this phase has now corrected three times; there is one copy and both pins read it.
    const source = expectedOutcome.toString();
    for (const symbol of MODULE_SYMBOLS) {
      expect(source, symbol).not.toContain(symbol);
    }

    // EVERY ENTRY NAMES SOMETHING THE MODULE STILL DECLARES, so a deleted symbol cannot linger here
    // reading like a guard while asserting nothing. `nodeStarted` and `seqIndent` are the two
    // exceptions and they are named: each is an interface FIELD rather than a declaration, so it is
    // checked as a bare occurrence instead.
    //
    // (27-48, D-55) AND THE OCCURRENCE CHECK IS RUN OVER THE CODE, NOT OVER THE FILE. `includes` on
    // the whole source would be satisfied by a COMMENT — which is precisely how the entry this list
    // used to carry (`nodeOnKeyLine`) would have survived its own rename reading green.
    const moduleSource = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const moduleCode = moduleSource
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    const stale = MODULE_SYMBOLS.filter(
      (s) => s !== "cellDoc" && !moduleCode.includes(s),
    );
    expect(
      stale,
      "MODULE_SYMBOLS entries that scripts/frontmatter.ts no longer declares in CODE (a stale entry is a vacuous assertion, and a comment mention is not a declaration)",
    ).toEqual([]);
    expect(
      moduleCode.includes("nodeOnKeyLine"),
      "the key-line-only spelling of the node-started fact D-55 renamed must not return under its old name",
    ).toBe(false);
    // And the symbol D-51 deleted is GONE from the module, asserted here rather than left to a grep.
    expect(
      moduleSource.includes("nodeStartQuote"),
      "the separate node-start-quote gate D-51 deleted must not return under its old name",
    ).toBe(false);

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
      // (D-52, round 8) THE SIX NEW NODE-START PLACEMENTS. Written out by hand from YAML's rules in
      // the same way as the thirty above — the point of this table is that a wrong idea has to be
      // had TWICE to survive, so these were reasoned about here independently of the rule.
      //
      // value node on continuation, double-quoted: the scalar opens on the continuation line and the
      // token sits inside it, so every character is content wherever the sigil is placed.
      ["value node on continuation, double-quoted", "comment `#`", "ok", true],
      ["value node on continuation, double-quoted", "alias `*`", "ok", true],
      ["value node on continuation, double-quoted", "tag `!`", "ok", true],
      ["value node on continuation, double-quoted", "anchor `&`", "ok", true],
      ["value node on continuation, double-quoted", "sequence dash `-`", "ok", true],
      // single-quoted: same, one quoting style over.
      ["value node on continuation, single-quoted", "comment `#`", "ok", true],
      ["value node on continuation, single-quoted", "alias `*`", "ok", true],
      ["value node on continuation, single-quoted", "tag `!`", "ok", true],
      ["value node on continuation, single-quoted", "anchor `&`", "ok", true],
      ["value node on continuation, single-quoted", "sequence dash `-`", "ok", true],
      // plain: no quoting, so the sigils mean what YAML says they mean. The FIRST indented line is
      // the value's node start; the line after it CONTINUES that scalar, so a sigil there is content
      // — the same thing rules 3 and 4 say about a key line and its continuations.
      //
      // (27-48, D-55 point 3) THESE FIVE ROWS ARE RE-ADJUDICATED AGAINST THE LOADER, INCLUDING THE
      // TWO THAT DID NOT MOVE. Region `tools:` / `  Read,` / `  <sigil>Agent(grugops-orchestrator)`,
      // run through /usr/bin/ruby -ryaml (2.6.10 / psych 3.1.0 / libyaml 0.2.1); the full transcript
      // is in 27-48-SUMMARY.md. A row that was re-measured and did not move is evidence; a row that
      // was assumed not to move is not, which is how the three below stayed wrong for a round.
      //
      //   comment `#`        loader "Read,"                          -> no grant   (UNCHANGED)
      //   alias   `*`        loader "Read, *Agent(grugops-…)"        -> grant      (was `refuse`)
      //   tag     `!`        loader "Read, !Agent(grugops-…)"        -> grant      (was `refuse`)
      //   anchor  `&`        loader "Read, &Agent(grugops-…)"        -> grant      (was `refuse`)
      //   dash    `-`        loader "Read, - Agent(grugops-…)"       -> grant      (UNCHANGED)
      //
      // The module's flattened value equals the loader's byte for byte on all five.
      ["value node on continuation, plain", "comment `#`", "ok", false],
      ["value node on continuation, plain", "alias `*`", "ok", true],
      ["value node on continuation, plain", "tag `!`", "ok", true],
      ["value node on continuation, plain", "anchor `&`", "ok", true],
      ["value node on continuation, plain", "sequence dash `-`", "ok", true],
      // flow sequence: the quoted item spans the boundary, so content again — family (b).
      ["flow sequence with a wrapped quoted item", "comment `#`", "ok", true],
      ["flow sequence with a wrapped quoted item", "alias `*`", "ok", true],
      ["flow sequence with a wrapped quoted item", "tag `!`", "ok", true],
      ["flow sequence with a wrapped quoted item", "anchor `&`", "ok", true],
      ["flow sequence with a wrapped quoted item", "sequence dash `-`", "ok", true],
      // flow mapping: the quoted VALUE spans the boundary — family (b), second spelling.
      ["flow mapping with a wrapped quoted value", "comment `#`", "ok", true],
      ["flow mapping with a wrapped quoted value", "alias `*`", "ok", true],
      ["flow mapping with a wrapped quoted value", "tag `!`", "ok", true],
      ["flow mapping with a wrapped quoted value", "anchor `&`", "ok", true],
      ["flow mapping with a wrapped quoted value", "sequence dash `-`", "ok", true],
      // the shipped idiom with an EMPTY dash line: the item's scalar opens on its own continuation.
      ["block-sequence item opening on its own continuation", "comment `#`", "ok", true],
      ["block-sequence item opening on its own continuation", "alias `*`", "ok", true],
      ["block-sequence item opening on its own continuation", "tag `!`", "ok", true],
      ["block-sequence item opening on its own continuation", "anchor `&`", "ok", true],
      ["block-sequence item opening on its own continuation", "sequence dash `-`", "ok", true],
    ];

    // ── (27-44, D-52) THE COMPLETENESS CLAIM'S SOURCE IS RETIRED FROM THIS TABLE ────────────────
    //
    // WHAT THIS TABLE NO LONGER CLAIMS. Through round 8 the line below was this sweep's COMPLETENESS
    // claim: `TRUTH.length === STYLE.length * SIGIL.length` was offered as evidence that the table
    // covered the construct. It never was. It is a claim about the PRODUCT OF TWO HAND-LISTED AXES,
    // and a claim about hand-listed axes cannot fail on an axis nobody thought of — which is exactly
    // how a 90-cell sweep passed green over a live spawn-grant bypass. Growing the list from 6 styles
    // to 12 corrected the ARITY of that claim and left its NATURE untouched.
    //
    // WHERE THE CLAIM LIVES NOW: in the case named
    //   "D-52 loader differential — every loader-accepted cell of a GENERATED corpus agrees with a
    //    real YAML 1.2 loader on token presence, except the named safe-direction exemptions"
    // whose corpus is GENERATED from three axes and whose expected value is computed by
    // `/usr/bin/ruby -ryaml` rather than by anything written in this file.
    //
    // WHAT THIS TABLE IS NOW, AND IT IS ADDITIONAL AND NEVER AN ALTERNATIVE: a SECOND, independently
    // written statement of the expectation over a STATED SUBSET — the continuation column of the D-49
    // corpus, one row per (style, sigil) pair. It is kept for one reason only: two independent
    // statements of an expectation mean a single wrong idea has to be had TWICE to survive. It is not
    // evidence of coverage, and a reader who deletes the harness above and leans on this table has
    // reinstated the defect WR-01 named.
    //
    // The assertion below is therefore an INTERNAL CONSISTENCY FLOOR — every (style, sigil) pair of
    // the subset this table declares is present exactly once, so a row silently dropped shrinks the
    // table loudly. It is NOT offered as a completeness statement about YAML.
    //
    // (27-48, D-55 point 3) THE ARITHMETIC DID NOT MOVE AND THAT IS RECORDED RATHER THAN ASSUMED.
    // Retiring the (c) framing changed THREE ROW VALUES and no row count: 12 x 5 = 60 rows before and
    // 60 after, both derived from the same two axis lengths by the expression below. And the claim's
    // NATURE is unchanged too — it is still a product of HAND-LISTED AXES. Replacing its SOURCE with
    // a generated corpus is `27-49`'s (WR-01/WR-02) work, not this plan's; the hand-off is written
    // down here so a reader finds an ACCOUNTED gap rather than a silent one.
    expect(
      TRUTH.length,
      "internal consistency of the stated subset (one row per style x sigil of the continuation column) — NOT a completeness claim; the completeness claim is the D-52 loader differential",
    ).toBe(SWEEP_SCALAR_STYLE.length * SWEEP_SIGIL.length);
    expect(new Set(TRUTH.map(([s, g]) => `${s}|${g}`)).size).toBe(TRUTH.length);

    // AND THE HAND-OFF IS MECHANICAL, NOT A COMMENT. If the harness that now holds the completeness
    // claim is deleted or renamed, this case goes RED — so the table can never quietly become the
    // claim again by outliving the thing that replaced it. A cited case name with nothing checking it
    // is the comment-without-a-pin shape this phase has corrected three times.
    //
    // (27-51, WR-01 / 27-REVIEW § WR-01, round 10) WHAT THAT CLAIM COVERS, NARROWED TO WHAT THE CORPUS
    // CAN ACTUALLY EXPRESS. "Completeness" here means: over the space the D-52 generator composes —
    // every key-line shape crossed with BOTH quote styles, with and without that style's own in-scalar
    // escape, two continuation shapes and two continuation depths — a real YAML 1.2 loader decides
    // every cell and the module agrees except the two named safe-direction exemptions. The quote-style
    // and escape axes were added THIS round precisely because the previous wording claimed a space the
    // generator could not spell: nine of its key-line shapes opened a scalar mid-line and every one of
    // them used the double quote, so YAML's `''` escape — CR-01's whole family — was outside the
    // corpus rather than merely untested.
    //
    // AND THE SHAPE THAT USED TO BE NAMED HERE AS OUTSIDE IT IS NOW INSIDE IT (27-52, D-57). A
    // block-scalar header (`|` / `>`) at a NESTED position — as a nested mapping's value or as a
    // sequence item — was the open family G/G2, recorded in this phase's deferred-items ledger and
    // outside this corpus by construction. `27-52` closed it and added both shapes to
    // `AXIS_KEY_LINE_BASE` in the SAME plan, so the loader now adjudicates them. The
    // `WR-01 expressibility floor` case below still prints, on every run, exactly which ledger
    // families are outside the generator's shape space — that print is the live answer; this comment
    // is only the history of one of them.
    const HARNESS_CASE =
      "D-52 loader differential — every loader-accepted cell of a GENERATED corpus agrees with a real YAML 1.2 loader on token presence, except the named safe-direction exemptions";
    expect(
      readFileSync(join(import.meta.dirname, "frontmatter.test.ts"), "utf8"),
      "the D-52 loader differential holds this sweep's completeness claim; this table is additional and never an alternative",
    ).toContain(HARNESS_CASE);

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
      // (D-52, round 8) One cell per NEW style too — the pin below requires exactly one per style,
      // so an axis that grows without its loader column fails here rather than passing quietly.
      // Each pairing was chosen because module and loader AGREE on it.
      //
      // (27-48, D-55 point 3) THE SENTENCE THAT FOLLOWED THIS ONE IS RETIRED WITH THE FRAMING IT
      // CITED. It said "the five style-9 pairings where they do not are recorded in the
      // expected-outcome rule", which stopped being true the moment those pairings were
      // re-adjudicated: module and loader now agree on ALL FIVE, and the two that never disagreed
      // were re-measured rather than assumed. A cross-reference that outlives the thing it points at
      // reads like a record and asserts nothing — the same shape as the framing it pointed to.
      ["value node on continuation, double-quoted", "alias `*`"],
      ["value node on continuation, single-quoted", "anchor `&`"],
      ["value node on continuation, plain", "comment `#`"],
      ["flow sequence with a wrapped quoted item", "comment `#`"],
      ["flow mapping with a wrapped quoted value", "tag `!`"],
      ["block-sequence item opening on its own continuation", "sequence dash `-`"],
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
      // (27-48, WR-03) THE LOADER'S VALUE IS FLATTENED THE WAY THIS MODULE FLATTENS — a sequence
      // joined with a COMMA-SPACE, a mapping written back as `k: v` — so the two sides of the
      // name-set comparison below differ only in WHOSE value they read. The join moved from `|` to
      // `, ` for that reason; token presence cannot notice, because the token is a whole element.
      const loaded = execFileSync(
        "/usr/bin/ruby",
        [
          "-ryaml",
          "-e",
          'def flat(v); case v; when Array then v.map { |e| flat(e) }.join(", "); when Hash then v.map { |k, x| "#{k}: #{flat(x)}" }.join(", "); when nil then ""; else v.to_s; end; end; print flat(YAML.safe_load(STDIN.read)["tools"])',
        ],
        { input: block, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
      );
      const loaderGrants = loaded.includes(TOKEN);
      const moduleGrant = hasSpawnGrant(text);
      expect(moduleGrant.ok, where).toBe(true);
      expect(moduleGrant.ok && moduleGrant.value, where).toBe(loaderGrants);

      // (27-48, WR-03) AND THE SECOND FACT, AT THE SECOND HARNESS. Same predicate, same file-scope
      // helpers, over the value this cell ALREADY loaded — no second ruby process. Scoped to the
      // `ok:true` arm for the reason stated at the D-52 site: a refusal reaches neither consumer, so
      // no name can be invented on it, while a name set returned on the success arm reaches both.
      const moduleNames = grantedAgentNames(text);
      const loaderNames = loaderGrantedNames(loaded);
      if (moduleNames.ok) {
        expect(
          nameVerdict(moduleNames),
          `${where}: the module's NAME SET must EQUAL the set the same enumeration extracts from the loader's own flattened value (loader-flat=${JSON.stringify(loaded)})`,
        ).toBe(nameVerdict(loaderNames));
      } else {
        // A refusal is RENDERED as a refusal and never as the empty set.
        expect(nameVerdict(moduleNames), where).toBe("refuse");
      }
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
// (27-49, WR-02 / D-56 item 2) THE FLOW-CONTEXT NODE STARTS, DERIVED FROM YAML'S
// GRAMMAR — THE SET A UNIVERSAL CLAIM MAY STAND OVER
// ---------------------------------------------------------------------------
//
// WHAT REPLACED WHAT, AND WHY. A case below was titled "no mid-line node start YAML defines returns
// the SILENT no-grant arm" and its evidence was a HAND-LISTED array with no derivation, no
// cardinality pin and no statement of what set it enumerated. Its length was MEASURED from the
// committed source at 21 (the round-8 review states eleven; the executor's measurement governs and
// both numbers are recorded in 27-49-SUMMARY.md). A universal quantifier standing over a literal is
// this repository's diagnosed second systemic failure class wearing a safety label, and here the
// claim was not merely unsupported — IT WAS FALSE. The array tracked the spellings a red team had
// reported: it carried the explicit-key indicator without a space, and it did NOT carry the
// JSON-adjacent mapping separator one character away. CR-01's families C and H are mid-line node
// starts YAML defines, inside a flow collection, and BOTH returned the silent no-grant arm.
//
// WHAT THIS SET ENUMERATES, STATED SO IT IS NOT GUESSED. Every position at which YAML 1.2 § 7.4
// admits a NODE inside a FLOW context, crossed with the node properties § 6.9 permits to stand in
// front of one and with a nesting depth. The productions are:
//
//   c-flow-sequence            `[`      — the sequence opener, adjacent and with each separation
//                                         spelling the format allows (space, tab)
//   ns-s-flow-seq-entries      `,`      — the entry separator, adjacent and separated
//   ns-flow-map-separate-value `: `     — the mapping separator in its SEPARATED spelling
//   c-ns-flow-map-json-key-entry `":`   — the SAME separator in its JSON-ADJACENT spelling, which is
//                                         a distinct production and is the one families C and H
//                                         occupy; both its adjacencies are members
//   c-ns-flow-map-explicit-entry `?`    — the explicit-key indicator, separated and adjacent
//
// THE DERIVATION IS NOT A LIST OF SPELLINGS SOMEONE REPORTED. It is the grammar's positions crossed
// with the two things the grammar says may vary at them, and the cardinality is asserted TWO-SIDED
// against the product of its three declared lists — so a production deleted, or an axis emptied,
// fails arithmetically rather than shrinking a universal claim in silence.
//
// MEASURED WHEN IT LANDED, on both builds, with `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 /
// libyaml 0.2.1): all 360 cells ACCEPTED by the loader and all 360 carrying the token in the loaded
// value; SILENT no-grant arm 72 against a `git archive` mirror of 62b8b53 (pre-27-47) — every one of
// them a JSON-adjacent mapping separator, i.e. exactly the counterexamples the old claim missed —
// and 0 against this build. THE LOADER PREMISE IS NOT LEFT AS THAT MEASUREMENT: it is re-asserted on
// every run by `WR-02 the derived flow node-start corpus is LOADABLE` in the D-52 block below, which
// hands this same enumeration to the same batched loader. A production added later whose documents
// libyaml will not read fails THERE, by name, instead of quietly turning this sweep into a demand
// made of documents no platform loads.
interface FlowNodeStartProduction {
  readonly label: string;
  readonly open: string;
  readonly close: string;
}
const FLOW_NODE_START_PRODUCTIONS: readonly FlowNodeStartProduction[] = [
  { label: "flow sequence opener", open: "[", close: "]" },
  { label: "flow sequence opener, separated by a space", open: "[ ", close: "]" },
  { label: "flow sequence opener, separated by a tab", open: "[\t", close: "]" },
  { label: "flow entry separator, adjacent", open: "[a,", close: "]" },
  { label: "flow entry separator, separated", open: "[a, ", close: "]" },
  { label: "flow mapping separator, separated", open: "{k: ", close: "}" },
  { label: "flow mapping separator, JSON-adjacent", open: '{"k":', close: "}" },
  {
    label: "flow mapping separator, JSON-adjacent after a space",
    open: '{"k" :',
    close: "}",
  },
  { label: "flow explicit-key indicator, separated", open: "{? ", close: ": v}" },
  { label: "flow explicit-key indicator, adjacent", open: "{?", close: ": v}" },
];
// YAML 1.2 § 6.9 — the node properties that may stand in FRONT of a node without consuming its start.
const FLOW_NODE_PROPERTIES: readonly { readonly label: string; readonly text: string }[] = [
  { label: "none", text: "" },
  { label: "tag shorthand", text: "!!str " },
  { label: "bare non-specific tag", text: "! " },
  { label: "verbatim tag", text: "!<tag:x> " },
  { label: "anchor", text: "&t " },
  { label: "tag and anchor", text: "!!str &t " },
];
// A flow collection may nest inside another, and the node start is the same production at every
// level. Depth is an axis rather than one "three levels deep" row appended to a list.
const FLOW_NESTINGS: readonly { readonly label: string; readonly open: string; readonly close: string }[] = [
  { label: "depth 1", open: "", close: "" },
  { label: "depth 2", open: "[a, ", close: "]" },
  { label: "depth 3", open: "[a, [b, ", close: "]]" },
];
interface FlowNodeStartContext {
  readonly label: string;
  readonly open: string;
  readonly close: string;
}
const deriveFlowNodeStartContexts = (): FlowNodeStartContext[] => {
  const out: FlowNodeStartContext[] = [];
  for (const production of FLOW_NODE_START_PRODUCTIONS) {
    for (const property of FLOW_NODE_PROPERTIES) {
      for (const nesting of FLOW_NESTINGS) {
        out.push({
          label: `${production.label} | ${property.label} | ${nesting.label}`,
          open: `${nesting.open}${production.open}${property.text}`,
          close: `${production.close}${nesting.close}`,
        });
      }
    }
  }
  return out;
};
const FLOW_NODE_START_CONTEXTS = deriveFlowNodeStartContexts();

// ---------------------------------------------------------------------------
// D-52 — THE LOADER DIFFERENTIAL: A GENERATED CORPUS AND AN EXPECTATION THIS FILE
// DID NOT COMPUTE (27-REVIEW-GAPS-7 § WR-01, round 8)
// ---------------------------------------------------------------------------
//
// FOUR CIRCULARITY AXES. THREE WERE ALREADY PAID FOR; THIS BLOCK CLOSES THE FOURTH.
//
//   • Round 4 — THE ALPHABET. A sweep and the predicate it tests drawing from one character set.
//   • Round 5 — THE ARM STRUCTURE. One construction per declared arm, so no input outside both arms
//     was ever a candidate for a case.
//   • Round 6 — THE UNIT THE CORPUS IS GENERATED OVER. Three axes that are all properties of ONE
//     PHYSICAL LINE, over a defect that lives BETWEEN two.
//   • Round 8 — THE SOURCE OF THE EXPECTATION, and it is this block's whole reason to exist. The D-49
//     sweep above was non-circular on all three earlier axes and STILL passed green, at 90 cells, over
//     a live spawn-grant bypass: its style axis was a hand-listed six-member set pinned by
//     `expect(length).toBe(6)`, and its second pin was a hand-written truth table whose completeness
//     claim was `TRUTH.length === STYLE.length * SIGIL.length`. A cardinality assertion pins a list
//     against SHRINKING and says nothing whatsoever about INCOMPLETENESS, and a claim about the
//     product of two hand-listed axes is a claim about the axes rather than about YAML.
//
//   STATED PLAINLY FOR THE NEXT READER: A CORPUS AND AN EXPECTATION BOTH WRITTEN BY HAND OVER THE SAME
//   AXES CANNOT FAIL ON AN AXIS NOBODY THOUGHT OF. Growing the hand-listed axis (which 27-43 did, 6 ->
//   12) makes the defect class EXPRESSIBLE and is necessary; it does not make the claim honest,
//   because the next axis nobody thinks of is exactly as invisible as the last one was.
//
// SO THE EXPECTATION MOVES OUT OF THIS FILE. The corpus below is GENERATED as the cross-product of
// three axes enumerated as data, and the expected answer for each cell is what `/usr/bin/ruby -ryaml`
// — the platform's own loader family — computes for it. Nothing this file writes decides what the
// right answer is. The axis LENGTHS are pinned, and those pins are floors against shrinking and are
// EXPLICITLY NOT the completeness claim; the completeness claim is the loader.
//
// WHAT IS ASSERTED AND WHAT IS DELIBERATELY NOT. Byte equality with the loader is not the predicate —
// this module joins a block sequence with a comma-space BY CONTRACT and the loader returns a real
// sequence. The agreed predicate is the one question this module asks: DOES THE VALUE CARRY THE SPAWN
// TOKEN. Cells the loader REJECTS are skipped and every skip is PRINTED with its three axis labels and
// the loader's error class, following the D-49 cross-check's precedent rather than reinventing it.
describe("frontmatter — the loader differential over a GENERATED corpus (D-52 / SPAWN-04 + KIT-03)", () => {
  const HARNESS_TOKEN = "Agent(grugops-orchestrator)";
  const FIRST = "Read,";
  const SECOND = "Write,";
  const RUBY = "/usr/bin/ruby";

  // ── AXIS 1: THE KEY-LINE SHAPE ────────────────────────────────────────────────────────────────
  //
  // Every way the `tools:` line can leave its value's node start somewhere other than "the first token
  // after the colon". `tail` is what must be appended at the END of the value to close whatever the
  // key line opened, so the cell builder never has to know which shape it is composing.
  //
  // TWO DECLARED YAML FACTS TRAVEL WITH EACH SHAPE, and they are facts about the SHAPE rather than
  // observations of the module — they exist so the exemptions below can be stated from YAML:
  //   `valueNodeOnContinuation`  the key line carries no value node at all, so the FIRST CONTINUATION
  //                              line is where the value's node begins.
  //   `danglingNodeProperty`     the key line ENDS with a YAML node property (§ 6.9) whose node has
  //                              not begun yet, so the property is left unresolved at a node start.
  //   `flowNodeStartAtEndOfKeyLine`  (27-48) the key line ends INSIDE a flow collection at a position
  //                              where YAML admits a node — just after `[`, `{`, `,` or `?` — so the
  //                              first continuation line's offset 0 is a node start even though the
  //                              key line DID carry a value node. It is a second, independent way for
  //                              a continuation line to be a node start, and E2 below needs it: the
  //                              exemption was written when `valueNodeOnContinuation` was the only
  //                              way, which made it a claim about one of the two.
  interface KeyLineShape {
    readonly label: string;
    readonly lines: readonly string[];
    readonly indent: string;
    readonly tail: string;
    readonly valueNodeOnContinuation: boolean;
    readonly danglingNodeProperty: boolean;
    readonly flowNodeStartAtEndOfKeyLine: boolean;
  }
  const AXIS_KEY_LINE_BASE: readonly KeyLineShape[] = [
    {
      label: "value on the key line",
      lines: [`tools: ${FIRST}`],
      indent: "  ",
      tail: "",
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "no value",
      lines: ["tools:"],
      indent: "  ",
      tail: "",
      valueNodeOnContinuation: true,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "comment-only value",
      lines: ["tools: # c"],
      indent: "  ",
      tail: "",
      valueNodeOnContinuation: true,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "trailing whitespace only",
      lines: ["tools:   "],
      indent: "  ",
      tail: "",
      valueNodeOnContinuation: true,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "flow-sequence opener",
      lines: [`tools: [${FIRST}`],
      indent: "  ",
      tail: "]",
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: true,
    },
    {
      label: "flow-mapping opener",
      lines: [`tools: {a: ${FIRST}`],
      indent: "  ",
      tail: "}",
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: true,
    },
    {
      label: "flow-sequence opener with a node property",
      lines: ["tools: [!!str"],
      indent: "  ",
      tail: "]",
      valueNodeOnContinuation: false,
      danglingNodeProperty: true,
      flowNodeStartAtEndOfKeyLine: true,
    },
    {
      label: "flow-mapping explicit-key opener",
      lines: ["tools: {?"],
      indent: "  ",
      tail: ": v}",
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: true,
    },
    // (27-43's OWN RED TEAM, CARRIED IN AS CORPUS) These two are the exact spellings that were live
    // silent-no-grant bypasses INSIDE D-51's first draft — a node property standing in front of a
    // mid-line node start, and the flow explicit-key indicator. A green suite, a green gate, a green
    // byte-identity differential and a zero-delta repository value map all missed them. They are
    // members of this corpus so the harness's expressible space contains the last two defects this
    // phase actually shipped, not merely the two a review happened to report.
    {
      label: "flow-sequence opener with a node property before a mid-line quote",
      lines: [`tools: [!!str "${FIRST}`],
      indent: "  ",
      tail: '"]',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "flow-mapping explicit-key opener with a mid-line quote",
      lines: [`tools: {? "${FIRST}`],
      indent: "  ",
      tail: '": v}',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "literal block indicator",
      lines: ["tools: |-"],
      indent: "  ",
      tail: "",
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "folded block indicator",
      lines: ["tools: >-"],
      indent: "  ",
      tail: "",
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "block-sequence dash with no value",
      lines: ["tools:", "  -"],
      indent: "    ",
      tail: "",
      valueNodeOnContinuation: true,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    // ── (27-49, WR-01 / D-56 item 1) THE SEVEN SHAPES YAML'S GRAMMAR NAMES ─────────────────────
    //
    // WHY THESE SEVEN AND WHY NOW. Round 8's thesis — "a corpus and an expectation both written by
    // hand over the same axes cannot fail on an axis nobody thought of" — was applied to the
    // EXPECTATION only. The corpus stayed three hand-listed arrays, and CR-01's four gate families
    // were therefore NOT EXPRESSIBLE in its cells rather than merely untested. The harness reported
    // ZERO disagreements over a live, gate-level, exit-0 bypass, not because it disagreed with the
    // loader but because IT NEVER GENERATED THE INPUT. A differential is complete only over the
    // inputs it generates; the loader is never asked about a shape the builder cannot compose.
    //
    // EACH ENDS AT A MID-LINE NODE START WITH THE QUOTE ALREADY OPEN, which is the position CR-01
    // exposed and is NOT the position offset 0 of a continuation line occupies. The distinction is
    // the whole defect and it is measured: with the quote opened at offset 0 of the continuation
    // instead, the same seven constructs produce ZERO silent cells against the pre-27-47 build —
    // the shapes look identical in prose and only one of them is red. Recorded in 27-49-SUMMARY.md
    // with both transcripts, because "we added the family" is exactly the claim this phase keeps
    // finding to be false.
    //
    // MEASURED, PRE-27-47 (a `git archive` mirror of 62b8b53) vs HEAD: 336 cells (7 x 6 x 4 x 2),
    // 196 loader-rejected, and MODULE-SILENT-WHILE-LOADER-GRANTS 54 -> 0. Every one of the seven is
    // red there; none is red here.
    //
    // AND THESE FOUR CARRY A UNIVERSAL CLAIM THAT USED TO LIVE ELSEWHERE (27-49, WR-02). The case
    // `D-51 red-team — no FLOW-CONTEXT node start …` was titled "no MID-LINE node start YAML
    // defines" while its evidence was a hand-listed array of flow spellings. Its derivation covers
    // YAML's flow context; the BLOCK-context mid-line node starts — the block mapping separator, the
    // compact nested sequence, the block explicit key and the block mapping inside a sequence item,
    // i.e. CR-01 families A, B, F and D — are the first, second, third and sixth members below, and
    // the loader decides their answer rather than any expectation this file writes. The pointer is
    // written at BOTH sites deliberately: a relocation stated in one place is a hand-off that will
    // be lost, which is the same failure mode as a coverage claim made in a comment.
    //
    // THE DECLARED YAML FACTS ARE THE SAME FOR ALL SEVEN, and they are facts about the shape rather
    // than observations: the key line CARRIES the value node (the quoted scalar opened on it), so
    // `valueNodeOnContinuation` is false; it ends with no node property, so `danglingNodeProperty`
    // is false; and it ends INSIDE an open quoted scalar rather than at a position a flow collection
    // admits a node, so `flowNodeStartAtEndOfKeyLine` is false. The two 27-43 red-team members above
    // declare the identical triple for the identical reason.
    {
      label: "nested block mapping, mid-line quote",
      lines: ["tools:", `  nested: "${FIRST}`],
      indent: "  ",
      tail: '"',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "compact nested sequence, mid-line quote",
      lines: ["tools:", `  - - "${FIRST}`],
      indent: "    ",
      tail: '"',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "block explicit key, mid-line quote",
      lines: ["tools:", `  ? "${FIRST}`],
      indent: "  ",
      tail: '"\n  : v',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "JSON-adjacent flow mapping, unspaced",
      lines: [`tools: {"a":"${FIRST}`],
      indent: "  ",
      tail: '"}',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "JSON-adjacent flow mapping, spaced",
      lines: [`tools: {"a" :"${FIRST}`],
      indent: "  ",
      tail: '"}',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "block mapping inside a sequence item, mid-line quote",
      lines: ["tools:", `  - a: "${FIRST}`],
      indent: "    ",
      tail: '"',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "flow mapping inside a flow sequence",
      lines: [`tools: [{"a":"${FIRST}`],
      indent: "  ",
      tail: '"}]',
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    // ── (27-52, D-57) THE NESTED BLOCK-SCALAR HEADER, ADDED IN THE SAME PLAN AS ITS FIX ──────────
    //
    // ORDER WAS LOAD-BEARING AND IS RECORDED AS SUCH. `27-49` deliberately did NOT add these two
    // shapes, and its reason is the reason they arrive now: a corpus shape for a LIVE silent
    // no-grant puts the differential's never-exemptible `silentWhileLoaderGrants` direction into
    // failure, and the only ways out would have been to exempt the new shape (forbidden — an
    // exemption in that direction is what the differential exists to make impossible) or to leave
    // the suite red. So the family was closed first, in task 1 of this same plan, and the corpus
    // grows WITH the fix rather than a round after it.
    //
    // WHY THE TWO EXISTING BLOCK-INDICATOR MEMBERS DID NOT COVER THIS. `literal block indicator` and
    // `folded block indicator` above carry the header on the TOP-LEVEL KEY LINE — the one position
    // `BLOCK_INDICATOR` was ever asked at. Family G/G2 is the SAME indicator at a position the
    // generator could not spell, so the harness reported zero disagreements over a live, gate-level,
    // exit-0 bypass for five consecutive plans: not because it agreed with the loader, but because
    // it never generated the input. That is 27-49's own recorded lesson, and this is the shape it
    // was recorded about.
    //
    // THE DECLARED YAML FACTS. Both spell `valueNodeOnContinuation: false` for the same reason the
    // two top-level block-indicator members do: the value node begins on the HEADER line, which is
    // part of `lines`, so the builder-emitted continuation lines are the scalar's CONTENT and not a
    // node start. That is what makes E2 correctly NOT apply to them — inside a block scalar a `&w`
    // is literal text to BOTH sides, so there is no refusal to exempt.
    {
      label: "nested block mapping value, block-scalar header",
      lines: ["tools:", "  nested: >-"],
      indent: "    ",
      tail: "",
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
    {
      label: "block-sequence item, block-scalar header",
      lines: ["tools:", "  - >-"],
      indent: "    ",
      tail: "",
      valueNodeOnContinuation: false,
      danglingNodeProperty: false,
      flowNodeStartAtEndOfKeyLine: false,
    },
  ];

  // ── AXIS 1b: THE QUOTE STYLE (27-51, WR-01 / 27-REVIEW § WR-01, round 10) ─────────────────────
  //
  // THE CORPUS COULD NOT SPELL THE FAMILY IT WAS SAID TO ADJUDICATE. Nine members of the base axis
  // above open a scalar MID-LINE and every one of them spells the DOUBLE quote; the single quote was
  // opened at exactly one position in the whole generator — offset 0 of a continuation line, where a
  // node start is unambiguous and the module was already correct. So YAML's `''` escape, and with it
  // round 10's CR-01, was outside this harness's shape space entirely. The differential's green line
  // was a statement about the inputs it GENERATED, not about the grammar — which is 27-49's own
  // recorded lesson ("not because the module agreed with the loader but because IT NEVER GENERATED
  // THE INPUT"), arriving one round later on a different axis.
  //
  // THE REMEDY IS AN AXIS AND NOT FOUR ROWS. Four rows for the four spellings a review happened to
  // report is the enumerate-the-bad shape this module has declined seven times; the property is that
  // the QUOTE STYLE does not change a verdict, and a property is expressed by crossing an axis.
  interface QuoteStyle {
    readonly label: string;
    readonly quote: string;
    // The style's OWN escape for its own quote character, which is what makes the escape axis below
    // derivable rather than hand-listed: YAML escapes a `"` inside double quotes with a backslash and
    // an `'` inside single quotes by DOUBLING it. Two styles, two rules, one axis.
    readonly escape: string;
  }
  const AXIS_QUOTE_STYLE: readonly QuoteStyle[] = [
    { label: "double-quoted", quote: '"', escape: '\\"' },
    { label: "single-quoted", quote: "'", escape: "''" },
  ];

  // ── AXIS 1c: AN IN-SCALAR ESCAPE (27-51, WR-01) ───────────────────────────────────────────────
  //
  // The empty member and the style's own escape, injected where the value's CONTENT begins. The
  // property asserted by crossing it is that an in-scalar escape cannot change a verdict — where
  // "these four documents pass" is a list.
  interface EscapeInScalar {
    readonly label: string;
    readonly inject: boolean;
  }
  const AXIS_ESCAPE_IN_SCALAR: readonly EscapeInScalar[] = [
    { label: "no in-scalar escape", inject: false },
    { label: "the style's own escape at the content start", inject: true },
  ];

  // ── THE CROSSING, DERIVED FROM THE BASE SHAPE'S OWN FIELDS ────────────────────────────────────
  //
  // WHY DERIVED AND NOT A PARALLEL ARRAY. A hand-written single-quote twin of each shape is a second
  // hand-maintained set beside the first — this repository's second systemic failure class, added by
  // the very change written to close an instance of the first. Instead the crossing RECOMPUTES each
  // shape's `lines` and `tail` from the style, so a shape added to the base axis tomorrow gets both
  // styles by construction and no one has to remember.
  //
  // WHICH SHAPES ARE CROSSED IS ALSO DERIVED. A base shape participates exactly when its own text
  // spells the double quote — i.e. when it OPENS a quoted scalar at all. The other eleven members
  // carry no quote to restyle, so crossing them would only duplicate cells.
  //
  // THE IDENTITY VARIANT KEEPS THE BASE LABEL AND THE BASE BYTES. Style member 0 with escape member 0
  // reproduces the base shape exactly, so collapsing both axes to their first member reproduces the
  // pre-change corpus byte for byte — which is what makes this widening additive, and what the
  // non-vacuity floor below measures against.
  const opensAQuotedScalar = (shape: KeyLineShape): boolean =>
    [...shape.lines, shape.tail].some((t) => t.includes('"'));
  const deriveKeyLines = (
    styles: readonly QuoteStyle[],
    escapes: readonly EscapeInScalar[],
  ): readonly KeyLineShape[] => {
    const out: KeyLineShape[] = [];
    for (const base of AXIS_KEY_LINE_BASE) {
      if (!opensAQuotedScalar(base)) {
        out.push(base);
        continue;
      }
      for (const style of styles) {
        for (const escape of escapes) {
          const identity = style === styles[0] && escape === escapes[0];
          const restyle = (t: string): string => t.split('"').join(style.quote);
          const place = (t: string): string =>
            escape.inject && t.includes(FIRST)
              ? t.replace(FIRST, `${style.escape}${FIRST}`)
              : t;
          out.push({
            ...base,
            label: identity ? base.label : `${base.label} [${style.label}, ${escape.label}]`,
            lines: base.lines.map((l) => place(restyle(l))),
            tail: restyle(base.tail),
          });
        }
      }
    }
    return out;
  };
  const AXIS_KEY_LINE: readonly KeyLineShape[] = deriveKeyLines(
    AXIS_QUOTE_STYLE,
    AXIS_ESCAPE_IN_SCALAR,
  );

  // ── AXIS 2: THE FIRST CONTINUATION'S SHAPE ────────────────────────────────────────────────────
  //
  // `closesWith` is the quote this line leaves OPEN, appended by the cell builder at the end of the
  // value. `referenceSigilAtNodeStart` is the declared YAML fact that this line begins with a node
  // property, which matters only where the shape above says a node begins here.
  interface ContinuationOneShape {
    readonly label: string;
    readonly text: string;
    readonly closesWith: string;
    readonly referenceSigilAtNodeStart: boolean;
  }
  const AXIS_CONTINUATION_1: readonly ContinuationOneShape[] = [
    {
      label: "opens a double-quoted scalar",
      text: `"${SECOND}`,
      closesWith: '"',
      referenceSigilAtNodeStart: false,
    },
    {
      label: "opens a single-quoted scalar",
      text: `'${SECOND}`,
      closesWith: "'",
      referenceSigilAtNodeStart: false,
    },
    {
      label: "plain text",
      text: SECOND,
      closesWith: "",
      referenceSigilAtNodeStart: false,
    },
    {
      label: "a hash at position 0",
      text: `# ${SECOND}`,
      closesWith: "",
      referenceSigilAtNodeStart: false,
    },
    {
      label: "a dash at position 0",
      text: `- ${SECOND}`,
      closesWith: "",
      referenceSigilAtNodeStart: false,
    },
    {
      label: "a reference sigil at position 0",
      text: `&w ${SECOND}`,
      closesWith: "",
      referenceSigilAtNodeStart: true,
    },
  ];

  // ── AXIS 3: THE SECOND CONTINUATION'S SHAPE ───────────────────────────────────────────────────
  //
  // How the line carrying the spawn token ends. The first two compose the CLOSERS the shapes above
  // asked for, so they are the well-formed spellings; the last two close something else instead, so
  // the document is deliberately mis-closed and the loader — not this file — decides what it means.
  interface ContinuationTwoShape {
    readonly label: string;
    readonly build: (quoteClose: string, tail: string) => string;
  }
  const AXIS_CONTINUATION_2: readonly ContinuationTwoShape[] = [
    {
      label: "the token after a hash",
      build: (quoteClose, tail) => `# x, ${HARNESS_TOKEN}${quoteClose}${tail}`,
    },
    {
      label: "the token plainly",
      build: (quoteClose, tail) => `${HARNESS_TOKEN}${quoteClose}${tail}`,
    },
    {
      label: "the token followed by a closing quote",
      build: (_quoteClose, tail) => `${HARNESS_TOKEN}"${tail}`,
    },
    {
      label: "the token followed by a collection close",
      build: (quoteClose, _tail) => `${HARNESS_TOKEN}${quoteClose}]`,
    },
  ];

  // ── AXIS 4: THE CONTINUATION DEPTH (27-49, WR-01 / D-56 item 1) ───────────────────────────────
  //
  // DEPTH WAS A CONSTANT BAKED INTO THE BUILDER AND IT IS NOW AN AXIS. `buildCellRegion` emitted the
  // key line plus EXACTLY TWO continuation lines, so a value whose node begins on continuation 1 and
  // is STILL GOING on continuation 3 could not be built — which is precisely the shape CR-02's
  // directions (a) and (b) occupy. A constant in a builder is an axis nobody wrote down, and an axis
  // nobody wrote down is the round-8 lesson one level in.
  //
  // The depth is the number of CONTINUATION LINES the builder emits: the first-continuation shape,
  // then `depth - 2` filler lines, then the token-carrying line LAST. Depth 2 is byte-identical to
  // what this builder emitted before, which is what makes the widening additive rather than a re-cut.
  const AXIS_CONTINUATION_DEPTH: readonly number[] = [2, 3];
  // The filler line's text. It closes nothing and opens nothing, so it CONTINUES whatever node the
  // first continuation began — which is the only property depth 3 exists to exercise.
  const FILLER = "Third,";

  // ── THE CELL BUILDER. NAMES NO MODULE SYMBOL; ASSERTED SO, BELOW ──────────────────────────────
  //
  // IT RETURNS ITS CONTINUATION LINES RATHER THAN ONLY THE JOINED REGION, so the emitted count can be
  // COUNTED instead of trusted. The builder is now the thing in this block most likely to silently
  // produce the wrong shape — a builder trusted rather than checked is exactly how the fixed two-line
  // shape survived a round — and the count assertion has its own case below.
  const buildCellParts = (
    keyLine: KeyLineShape,
    first: ContinuationOneShape,
    second: ContinuationTwoShape,
    depth: number,
  ): { readonly continuations: readonly string[]; readonly region: string } => {
    const continuations = [`${keyLine.indent}${first.text}`];
    for (let n = 0; n < depth - 2; n += 1) continuations.push(`${keyLine.indent}${FILLER}`);
    continuations.push(
      `${keyLine.indent}${second.build(first.closesWith, keyLine.tail)}`,
    );
    return {
      continuations,
      region: ["name: x", ...keyLine.lines, ...continuations, ""].join("\n"),
    };
  };

  const buildCellRegion = (
    keyLine: KeyLineShape,
    first: ContinuationOneShape,
    second: ContinuationTwoShape,
    depth: number,
  ): string => buildCellParts(keyLine, first, second, depth).region;

  const buildCellDocument = (
    keyLine: KeyLineShape,
    first: ContinuationOneShape,
    second: ContinuationTwoShape,
    depth: number,
  ): string => `---\n${buildCellRegion(keyLine, first, second, depth)}---\nBody.\n`;

  interface Cell {
    readonly keyLine: KeyLineShape;
    readonly first: ContinuationOneShape;
    readonly second: ContinuationTwoShape;
    readonly depth: number;
    readonly where: string;
  }
  // (27-51) THE KEY-LINE AXIS IS A PARAMETER WITH A DEFAULT, for exactly one reason: the non-vacuity
  // floor below has to enumerate the SAME corpus with the two new axes COLLAPSED, in the same run, and
  // a second enumeration written for that purpose would be measuring the copy.
  const enumerateCells = (keyLines: readonly KeyLineShape[] = AXIS_KEY_LINE): Cell[] => {
    const out: Cell[] = [];
    for (const keyLine of keyLines) {
      for (const first of AXIS_CONTINUATION_1) {
        for (const second of AXIS_CONTINUATION_2) {
          for (const depth of AXIS_CONTINUATION_DEPTH) {
            out.push({
              keyLine,
              first,
              second,
              depth,
              where: `${keyLine.label} | ${first.label} | ${second.label} | depth ${depth}`,
            });
          }
        }
      }
    }
    return out;
  };

  // ── THE EXEMPTIONS: NAMED, BOUNDED, AND SAFE-DIRECTION ONLY ───────────────────────────────────
  //
  // A divergence from the loader is permitted ONLY when it is this module REFUSING where the loader
  // grants — a loud red a human adjudicates. A module GRANT where the loader has none, or a module
  // NO-GRANT where the loader grants, is NEVER exemptible: the second of those is the silent-no-grant
  // arm that has now been the finding in eight consecutive rounds.
  //
  // Each rule is written from the module's DECLARED POLICY, cited, and from the axis shapes' own
  // declared YAML facts — never from an observed result. Both rules below are one policy: D-30, in
  // scripts/frontmatter.ts's header under "DELIBERATELY NOT A YAML ENGINE, AND THE REFERENCE
  // CONSTRUCTS ARE REFUSED BY NAME" — an anchor, an alias or an unresolved node property at a node
  // start is refused before the value is flattened, because the value such a document expresses is not
  // the text its bytes spell.
  //
  // (27-49, WR-04 / D-56 item 3) THE PER-EXEMPTION `bound` IS DELETED, AND THE DELETION IS STATED
  // HERE SO A LATER READER DOES NOT RESTORE DECORATION THAT READS LIKE A FLOOR.
  //
  // WHAT STOOD HERE. Each exemption carried a `bound` derived from the axis lengths, with the comment
  // "so a rule cannot silently come to cover more of the corpus than the shape it names can produce",
  // and the differential asserted `matched <= bound`.
  //
  // WHY IT COULD NOT FAIL, AS ARITHMETIC RATHER THAN AS AN OPINION, AND SCOPED EXACTLY. Each `bound`
  // WAS the full cross-product the named shape can produce, and each `matches` is a PURE FUNCTION OF
  // THE SAME AXIS FLAGS the bound was computed from. So the number of corpus cells a rule matches is,
  // by construction, exactly that product — and `matched` counts only the LOADER-ACCEPTED ones,
  // making it the product MINUS the loader-rejected cells the rule covers. Over the dimension the
  // bound's own comment named — what the corpus is, what shapes the axes carry — `matched <= bound`
  // holds for EVERY possible corpus, forever. MEASURED at deletion: E1 matched 32 against a bound of
  // 48, E2 matched 52 against 64, each exactly its product minus the loader-rejected cells its rule
  // covers. Those two products are re-derived on every run and printed by the differential below, so
  // the arithmetic stays checkable after this paragraph scrolls out of a reader's context.
  //
  // AND THE ONE THING IT DID CATCH, STATED RATHER THAN OMITTED, BECAUSE THE HONEST VERSION IS THE
  // WHOLE POINT. The bound is unfailable over CORPUS variation; it is NOT unfailable over MATCH-RULE
  // variation. If a rule is edited to stop being a function of its declared flags, `matched` can
  // exceed its own product and the bound fires. Measured by the executor's red team: replacing E1's
  // rule with `() => true` takes matched to 565 against a bound of 48. That is a real, narrow
  // detection this deletion gives up, and it is recorded rather than quietly dropped.
  //
  // WHAT REPLACED IT, AND WHAT THE REPLACEMENT COSTS. A single corpus-level floor: the EXEMPT cell
  // count must be a strict MINORITY of the loader-accepted corpus. Its right-hand side is what the
  // LOADER accepted, which no exemption controls — so an exemption widened until it explains most of
  // the corpus turns this red, which is the failure the deleted bound was DESCRIBED as catching and
  // arithmetically could not. THE TRADE, MEASURED AND NAMED: against a decoupled rule the floor fires
  // at roughly half the loader-accepted corpus where the old bound fired at that rule's own product,
  // so a decoupling that widens a rule to between those two figures is no longer caught here. It is
  // not caught by narrowing this back either — a bound computed from the exemption's own inputs is a
  // predicate acting as its own oracle, which is the shape this module deletes on sight. The residual
  // is recorded in 27-49-SUMMARY.md rather than closed by restoring a self-check.
  //
  // ONE assertion at the corpus level, then; not a per-rule bound wearing a new name, and the old
  // form is GONE rather than kept beside it.
  interface Exemption {
    readonly label: string;
    readonly reason: string;
    readonly matches: (keyLine: KeyLineShape, first: ContinuationOneShape) => boolean;
  }

  // ── (27-49, WR-04) THE ADJUDICATOR: ONE PURE FUNCTION, USED BY THE DIFFERENTIAL AND BY ITS PROOF ──
  //
  // WHY IT IS EXTRACTED RATHER THAN WRITTEN TWICE. The two replacement assertions have to be shown
  // CAPABLE OF FAILING, and a proof case that re-implements the rule proves something about the copy
  // in the proof. So the rule lives once and both the live differential and the constructed-input
  // case below call THIS. A second implementation of a safety predicate is the weaker duplicate this
  // module deletes on sight; the discipline applies to the harness too.
  interface ExemptionAdjudication {
    readonly unexplained: readonly string[];
    readonly dead: readonly string[];
  }
  const adjudicateExemptions = (
    cells: readonly {
      readonly where: string;
      readonly disagrees: boolean;
      readonly matched: readonly string[];
    }[],
    labels: readonly string[],
  ): ExemptionAdjudication => ({
    // NO UNEXPLAINED DISAGREEMENT: a cell where the module and the loader differ and NO exemption
    // covers it. This is the half of the old equality that was doing real work.
    unexplained: cells
      .filter((c) => c.disagrees && c.matched.length === 0)
      .map((c) => c.where),
    // NO DEAD EXEMPTION: a rule that matched no DISAGREEING cell. Note "disagreeing" and not "corpus"
    // — the old liveness check asked only whether the rule matched a loader-accepted cell, which any
    // rule stated over an axis flag does by construction. A rule that no longer explains a
    // disagreement is dead weight that reads like a guard, and it is now named as such.
    dead: labels.filter(
      (label) => !cells.some((c) => c.disagrees && c.matched.includes(label)),
    ),
  });
  // (27-48) THE SHAPES WHOSE FIRST CONTINUATION IS A NODE START, BY EITHER OF THE TWO ROUTES YAML
  // GIVES. Derived from the declared facts, never hand-counted.
  const CONTINUATION_START_SHAPES = AXIS_KEY_LINE.filter(
    (k) => k.valueNodeOnContinuation || k.flowNodeStartAtEndOfKeyLine,
  ).length;
  const DANGLING_PROPERTY_SHAPES = AXIS_KEY_LINE.filter(
    (k) => k.danglingNodeProperty,
  ).length;
  const EXEMPTIONS: readonly Exemption[] = [
    {
      label:
        "E1 — a dangling YAML node property at the flow collection's first node start",
      reason:
        "The key line ends with a node property (YAML 1.2 § 6.9) whose node has not begun, so the property stands unresolved at a node start. D-30's declared policy refuses a reference construct rather than resolving it; the loader resolves it instead and grants. SAFE DIRECTION: a loud refusal, never a hidden grant.",
      matches: (keyLine) => keyLine.danglingNodeProperty,
    },
    {
      label:
        "E2 — a YAML anchor at the value's node start on the first continuation line",
      reason:
        "The first continuation line is a NODE START, by either of the two routes YAML gives: the key line carried no value node at all (`valueNodeOnContinuation`), or it ended INSIDE a flow collection just after `[`, `{`, `,` or `?` (`flowNodeStartAtEndOfKeyLine`). `&w` at a node start is a genuine YAML anchor rather than text. D-30 refuses it; the loader resolves the anchor and reads the token behind it. SAFE DIRECTION: a loud refusal, never a hidden grant.\n\n(27-48) THE SECOND ROUTE WAS MISSING AND THE OMISSION WAS THE EXEMPTION'S, NOT THE MODULE'S. This rule was written when `valueNodeOnContinuation` was the only declared route, so it was a claim about ONE of the two ways a continuation line can be a node start — the same shape as the (c) framing D-55 retires one screen up. The module reached the flow route only after D-55 made the line-level node-start answer agree with the walk's own; before that it read a genuine anchor inside a flow collection as TEXT, silently, which is the direction that is never exemptible.",
      matches: (keyLine, first) =>
        (keyLine.valueNodeOnContinuation ||
          keyLine.flowNodeStartAtEndOfKeyLine) &&
        first.referenceSigilAtNodeStart,
    },
  ];

  // ── THE LOADER: PROBED ONCE, BATCHED ONCE ─────────────────────────────────────────────────────
  //
  // ONE PROCESS PER RUN, NOT ONE PER CELL. A harness whose runtime makes it a candidate for narrowing
  // is a harness that will be narrowed, so the whole corpus crosses the boundary as a JSON array and
  // the verdicts come back as a JSON array. The returned length is asserted equal to the cell count,
  // so a truncated batch fails arithmetically instead of silently shortening the differential.
  //
  // (27-48, WR-03) THE SECOND FIELD, AND WHY IT IS A SECOND FIELD RATHER THAN A SECOND PROCESS.
  // `value` is `to_s`, which is all token presence needs. The NAME SET needs the loader's value
  // flattened THE WAY THIS MODULE FLATTENS — a sequence joined with a comma-space, a mapping written
  // back as `k: v` — so that the two sides differ only in WHOSE value they read and not in how it was
  // rendered. It is computed in the SAME batched process, over the SAME already-parsed value, so the
  // name-set comparison adds no loader invocation at all.
  const LOADER_PROGRAM = [
    "require 'yaml'; require 'json'",
    "def flat(v)",
    "  case v",
    "  when Array then v.map { |e| flat(e) }.join(', ')",
    "  when Hash  then v.map { |k, x| \"#{k}: #{flat(x)}\" }.join(', ')",
    "  when nil   then ''",
    "  else v.to_s",
    "  end",
    "end",
    "out = JSON.parse(STDIN.read).map do |d|",
    "  begin",
    "    y = YAML.safe_load(d)",
    "    v = y.is_a?(Hash) ? y['tools'] : nil",
    "    { 'accepted' => true, 'value' => v.nil? ? '' : v.to_s, 'flat' => flat(v) }",
    "  rescue Exception => e",
    "    { 'accepted' => false, 'error' => e.class.to_s }",
    "  end",
    "end",
    "print JSON.generate(out)",
  ].join("\n");

  // ── (27-48, WR-03) NAMED REGIONS: THE SHAPES THE PRODUCT CANNOT EXPRESS, CARRIED IN AS CORPUS ──
  //
  // WHY A HAND-LISTED SET SITS BESIDE A GENERATED ONE, AND WHY THAT IS NOT THE DRIFT CLASS. The three
  // axes above compose a key-line shape with two continuation shapes, and EVERY second-continuation
  // shape carries the harness token `Agent(grugops-orchestrator)`. So a key-line shape that OPENS a
  // grant enumeration always meets that token's `(` before its own `)`, which takes both the module
  // and the loader-side extractor to the refusal arm — MEASURED, over all 48 cells of two candidate
  // key-line members, and recorded in 27-48-SUMMARY.md. CR-02 row a1 is therefore NOT EXPRESSIBLE as
  // a product member, and adding a token-free continuation shape to make it expressible would put 78
  // cells carrying no token into a token-presence differential.
  //
  // These regions run through the SAME batched loader process, the SAME two predicates and the SAME
  // three-verdict discipline as every generated cell. They are ADDITIONAL and never an alternative:
  // the product's size is still asserted against its axis lengths, and the total handed to the loader
  // is DERIVED as `product + NAMED_REGIONS.length` rather than written down.
  //
  // The precedent is this file's own: two key-line members are already 27-43's red team carried in as
  // corpus, for exactly the reason these are — so the harness's expressible space contains the
  // defects this phase actually shipped, not only the ones its axes happen to reach.
  const NAMED_REGIONS: readonly { readonly label: string; readonly region: string }[] = [
    {
      label:
        "CR-02 row a1 — a grant enumeration opened on a continuation line and split by a dash on the next",
      region: "name: x\ntools:\n  Agent(alpha, ga\n  - mma)\n",
    },
    {
      label: "CR-02 row a1, the block-sequence spelling",
      region: "name: x\ntools:\n  - Agent(alpha, ga\n    - mma)\n",
    },
  ];

  // Parameterised on the interpreter path for ONE reason: so the SKIP branch can be EXERCISED by a
  // case rather than assumed reachable. A harness that silently never runs is worse than no harness,
  // and "the skip prints" is itself a claim that needs a pin.
  type LoaderProbe =
    | { readonly ok: true; readonly version: string }
    | { readonly ok: false; readonly reason: string };
  const probeLoader = (rubyPath: string): LoaderProbe => {
    try {
      const version = execFileSync(
        rubyPath,
        [
          "-ryaml",
          "-e",
          "print \"ruby=#{RUBY_VERSION} psych=#{Psych::VERSION} libyaml=#{Psych.libyaml_version.join('.')}\"",
        ],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      return { ok: true, version };
    } catch {
      return {
        ok: false,
        reason: `${rubyPath} with the yaml (Psych/libyaml) library is not runnable on this machine`,
      };
    }
  };

  // ── THE DIFFERENTIAL ──────────────────────────────────────────────────────────────────────────

  it("D-52 loader differential — every loader-accepted cell of a GENERATED corpus agrees with a real YAML 1.2 loader on token presence, except the named safe-direction exemptions", () => {
    // FLOORS AGAINST SHRINKING, AND EXPLICITLY NOT THE COMPLETENESS CLAIM. An axis emptied by a later
    // edit shrinks this harness LOUDLY. What makes the corpus's coverage checkable is not these three
    // numbers — it is that the answer for every cell comes from the loader below.
    // (27-49, WR-01) THE FLOORS MOVED DELIBERATELY: 13 -> 20 key-line shapes (the seven YAML's
    // grammar names) and a FOURTH axis. Old corpus 13 x 6 x 4 = 312; new corpus 20 x 6 x 4 x 2 = 960.
    // Both totals are the product of the axis lengths and neither is written down.
    // (27-51, WR-01) AND THE KEY-LINE AXIS IS NOW ITSELF A PRODUCT. Only the BASE array is pinned to a
    // literal; the derived length is asserted as ARITHMETIC over the base — the eleven shapes that
    // open no quoted scalar pass through once, and each of the nine that do is crossed with the quote
    // style and the in-scalar escape. A tenth quote-opening shape added to the base tomorrow moves
    // both sides of this identity together, which is the whole reason it is stated as an identity.
    // (27-52, D-57) 20 -> 22: the nested block-scalar header as a mapping value and as a sequence
    // item. Neither opens a quoted scalar, so both pass through the crossing once and the derived
    // axis moves 47 -> 49 by the same identity below.
    expect(AXIS_KEY_LINE_BASE.length).toBe(22);
    // THE FAMILY IS EXPRESSIBLE, DERIVED FROM THE SHAPES RATHER THAN CLAIMED IN A COMMENT. A
    // block-scalar header must be spelled on a line BELOW the top-level key line, or family G/G2 is
    // still outside this corpus and the completeness line is again a statement about inputs it never
    // generated.
    expect(
      AXIS_KEY_LINE.filter((k) =>
        k.lines.slice(1).some((l) => /(^|\s)[|>][0-9]*[+-]?([ \t]|$)/.test(l)),
      ).length,
      "the derived axis must carry a block-scalar header BELOW the top-level key line, or family G/G2 is outside the corpus",
    ).toBeGreaterThan(0);
    const QUOTE_OPENING_SHAPES = AXIS_KEY_LINE_BASE.filter(opensAQuotedScalar).length;
    expect(
      QUOTE_OPENING_SHAPES,
      "the crossing is vacuous unless the base axis really contains shapes that open a quoted scalar",
    ).toBeGreaterThan(0);
    expect(
      AXIS_KEY_LINE.length,
      `the derived key-line axis must be (${AXIS_KEY_LINE_BASE.length} - ${QUOTE_OPENING_SHAPES}) pass-through + ${QUOTE_OPENING_SHAPES} x ${AXIS_QUOTE_STYLE.length} styles x ${AXIS_ESCAPE_IN_SCALAR.length} escapes`,
    ).toBe(
      AXIS_KEY_LINE_BASE.length -
        QUOTE_OPENING_SHAPES +
        QUOTE_OPENING_SHAPES * AXIS_QUOTE_STYLE.length * AXIS_ESCAPE_IN_SCALAR.length,
    );
    expect(AXIS_QUOTE_STYLE.length).toBe(2);
    expect(AXIS_ESCAPE_IN_SCALAR.length).toBe(2);
    // The single quote must really be REACHED at a mid-line position — the position CR-01 exposed and
    // the one the corpus could not spell before. Derived from the shapes, never counted by hand.
    expect(
      AXIS_KEY_LINE.filter((k) => k.lines.some((l) => l.includes(`'${FIRST}`))).length,
      "the derived axis must open a SINGLE-quoted scalar mid-line, or CR-01's family is still outside the corpus",
    ).toBeGreaterThan(0);
    expect(
      AXIS_KEY_LINE.filter((k) => k.lines.some((l) => l.includes(`''${FIRST}`))).length,
      "the derived axis must carry YAML's `''` escape inside an open single-quoted scalar",
    ).toBeGreaterThan(0);
    expect(AXIS_CONTINUATION_1.length).toBe(6);
    expect(AXIS_CONTINUATION_2.length).toBe(4);
    expect(AXIS_CONTINUATION_DEPTH.length).toBe(2);
    // The depth axis must carry a value PAST the two the builder used to hard-code, or the fourth
    // axis is a rename of the constant it replaced.
    expect(
      Math.max(...AXIS_CONTINUATION_DEPTH),
      "the depth axis must reach at least 3 — a node beginning on continuation 1 and still running on continuation 3 is the shape CR-02's directions (a) and (b) occupy",
    ).toBeGreaterThanOrEqual(3);

    // THE CELL TOTAL IS DERIVED. No cell-count literal exists in this block except as the right-hand
    // side of this comparison, and the left-hand side is the length of the enumeration itself.
    const CELLS =
      AXIS_KEY_LINE.length *
      AXIS_CONTINUATION_1.length *
      AXIS_CONTINUATION_2.length *
      AXIS_CONTINUATION_DEPTH.length;
    const corpus = enumerateCells();
    expect(
      corpus.length,
      `the enumerated corpus must be the product of the FOUR axis lengths (${AXIS_KEY_LINE.length} x ${AXIS_CONTINUATION_1.length} x ${AXIS_CONTINUATION_2.length} x ${AXIS_CONTINUATION_DEPTH.length})`,
    ).toBe(CELLS);
    // Every cell key is distinct, so a collision cannot make two cells look like one.
    expect(new Set(corpus.map((c) => c.where)).size).toBe(CELLS);

    // THE TWO CONSUMERS MUST READ THE SAME BYTES, AND THAT IS ASSERTED RATHER THAN ASSUMED. The
    // loader is handed the REGION; the module is handed the whole DOCUMENT and locates the region
    // itself. If a generated cell contained its own `---` line the two would silently be comparing
    // different text, and the differential would be measuring the corpus builder instead of the
    // module. This is round 6's lesson one level out — ask what the predicate's INPUT is assembled
    // from — applied to a harness whose expectation is otherwise beyond reproach.
    const ambiguous = corpus.filter((c) =>
      buildCellRegion(c.keyLine, c.first, c.second, c.depth)
        .split("\n")
        .some((line) => line.trimEnd() === "---"),
    );
    expect(
      ambiguous.map((c) => c.where),
      "a cell whose region carries its own `---` line would hand the loader and the module different text",
    ).toEqual([]);

    const probe = probeLoader(RUBY);
    if (!probe.ok) {
      console.warn(
        `SKIPPED D-52 loader differential: ${probe.reason}. This is a PRINTED skip, never a silent one — the ${CELLS}-cell corpus was enumerated and no expectation was invented in the loader's absence.`,
      );
      return;
    }

    // THE CORPUS DIGEST, PRINTED. The RED transcript that makes this harness a pin rather than
    // decoration is produced OUTSIDE the suite, against a mirror of the pre-27-43 build, because a
    // committed case cannot import a module that stopped existing. "The outside run used the same
    // corpus" is therefore a claim, and a claim gets a measurement: both runs print this digest, so a
    // transcript over a different corpus is visible instead of persuasive.
    // (27-48, WR-03) THE NAMED REGIONS RIDE THE SAME BATCH. The total handed to the loader is
    // DERIVED — the product plus the named list's own length — so a named region added without its
    // loader verdict fails arithmetically at the length assertion below rather than silently.
    const BATCH = CELLS + NAMED_REGIONS.length;
    const regions = [
      ...corpus.map((c) => buildCellRegion(c.keyLine, c.first, c.second, c.depth)),
      ...NAMED_REGIONS.map((n) => n.region),
    ];
    expect(regions.length, "the loader batch is the product plus the named regions").toBe(BATCH);
    // The same-bytes check covers the named regions too: a named region carrying its own `---` line
    // would hand the loader and the module different text exactly as a generated cell would.
    expect(
      NAMED_REGIONS.filter((n) =>
        n.region.split("\n").some((line) => line.trimEnd() === "---"),
      ).map((n) => n.label),
      "a named region carrying its own `---` line would hand the loader and the module different text",
    ).toEqual([]);
    // A NUL cannot occur in any cell, so it is the one separator that cannot make two different
    // corpora hash alike. IT IS SPELLED AS AN ESCAPE AND NEVER EMBEDDED RAW: a literal NUL byte in a
    // source file makes BSD `grep` classify the whole file as binary and report ZERO matches with no
    // warning, so a reviewer's spot-check of this file would silently come back empty. That happened
    // once while this harness was being written and is recorded here rather than quietly repaired.
    const CELL_SEPARATOR = String.fromCharCode(0);
    const digest = createHash("sha256")
      .update(regions.join(CELL_SEPARATOR))
      .digest("hex")
      .slice(0, 16);
    // PRINTED on request, never written: an out-of-suite RED run can diff its own corpus against this
    // one instead of asserting the two match. Nothing touches disk, in keeping with this file's idiom.
    if (process.env.GRUGOPS_D52_DUMP_CORPUS) {
      console.log(`D-52 CORPUS DUMP ${JSON.stringify(regions)}`);
    }

    const started = Date.now();
    const raw = execFileSync(RUBY, ["-e", LOADER_PROGRAM], {
      input: JSON.stringify(regions),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const verdicts = JSON.parse(raw) as {
      accepted: boolean;
      value?: string;
      flat?: string;
      error?: string;
    }[];
    expect(
      verdicts.length,
      "a truncated loader batch must fail arithmetically rather than silently shorten the differential",
    ).toBe(BATCH);

    let rejected = 0;
    const disagreements: string[] = [];
    const unsafe: string[] = [];
    const expectedExempt: string[] = [];
    const rowsMatched = new Map<string, number>();
    // (27-49, WR-04) THE ADJUDICATOR'S INPUT, ONE ROW PER LOADER-ACCEPTED CELL: what it is, whether
    // it disagreed, and which exemptions matched it. Built here and handed to ONE pure function, so
    // the rule the harness runs is the same rule the proof case fires.
    const adjudicationRows: {
      where: string;
      disagrees: boolean;
      matched: string[];
    }[] = [];
    // The disagreement DETAIL, keyed by cell, so the unexplained-list failure message can carry the
    // axis labels and the loader's value rather than a bare key.
    const disagreementDetail = new Map<string, string>();
    // (27-48, WR-03) THE SECOND FACT'S OWN LIST, KEPT SEPARATELY SO A FAILURE SAYS WHICH FACT MOVED.
    const nameSetDisagreements: string[] = [];
    // Every cell on which the module REFUSED, with the string its name column rendered.
    const refusedNameColumns: string[] = [];

    for (let i = 0; i < corpus.length; i += 1) {
      const cell = corpus[i];
      const verdict = verdicts[i];
      if (!verdict.accepted) {
        rejected += 1;
        // PRINTED, with all three axis labels and the loader's error class.
        console.log(
          `D-52 SKIP (loader rejected) ${cell.where} :: ${verdict.error}`,
        );
        continue;
      }
      const loaderGrants = (verdict.value ?? "").includes(HARNESS_TOKEN);
      const document = buildCellDocument(cell.keyLine, cell.first, cell.second, cell.depth);
      const answer = hasSpawnGrant(document);
      // A PARSE FAILURE IS NEVER FOLDED INTO THE NO-GRANT COLUMN. Three module verdicts, not two.
      const moduleVerdict = answer.ok
        ? answer.value
          ? "grant"
          : "no-grant"
        : "refuse";
      const loaderVerdict = loaderGrants ? "grant" : "no-grant";

      const matchedHere = EXEMPTIONS.filter((e) =>
        e.matches(cell.keyLine, cell.first),
      ).map((e) => e.label);
      for (const label of matchedHere) {
        rowsMatched.set(label, (rowsMatched.get(label) ?? 0) + 1);
      }
      if (matchedHere.length > 0) expectedExempt.push(cell.where);
      adjudicationRows.push({
        where: cell.where,
        disagrees: moduleVerdict !== loaderVerdict,
        matched: matchedHere,
      });

      // ── (27-48, WR-03) THE SECOND PREDICATE, OVER THE SAME ALREADY-LOADED VALUES ──────────────
      //
      // WHY TOKEN PRESENCE IS NOT ENOUGH, STATED AT THE SITE. `hasSpawnGrant` is a BOOLEAN. The fact
      // the KIT-03 closure equality and coordinator-resolution-precheck are computed over is the
      // NAME SET, and those two consumers are set equalities. Round 8's CR-02 row a1 — `tools:` /
      // `  Agent(alpha, ga` / `  - mma)` — enumerated ["alpha","ga","mma"] where libyaml expresses
      // ["alpha","ga - mma"], an INVENTED NAME on the `ok:true` arm, and it passed BOTH round-8
      // harnesses because both of them agreed with the loader on the boolean alone.
      //
      // THIS IS NOT A SECOND WAY OF DECIDING WHETHER A DOCUMENT GRANTS. It is a SECOND FACT compared
      // over the SAME already-loaded value: no second loader process, no second parse, no second
      // grant decision path. `answer` above and `moduleNames` below both come from the one
      // `parseFrontmatter` this module exposes.
      //
      // SET EQUALITY, NEVER CARDINALITY. Three names matching three names over two different sets
      // must still fail red, so the comparison is over sorted, de-duplicated LISTS.
      const moduleNames = grantedAgentNames(document);
      const loaderNames = loaderGrantedNames(verdict.flat ?? "");
      const moduleNameVerdict = nameVerdict(moduleNames);
      const loaderNameVerdict = nameVerdict(loaderNames);
      // THE EMPTY EDGE, ASSERTED AND NOT ASSUMED. Where the module refuses, the name column says so;
      // it can never read as the empty list of a value that was read and granted nothing.
      if (!moduleNames.ok) {
        refusedNameColumns.push(`${cell.where}\t${moduleNameVerdict}`);
      }
      // THE COMPARISON IS SCOPED TO THE `ok:true` ARM, DELIBERATELY, AND THE SCOPE IS THE POINT.
      // WR-03's defect — and the only direction a name set can hide in — is a name set returned on
      // the SUCCESS arm and consumed by a set equality. Where the module REFUSES, no name reaches
      // either consumer at all: the refusal is a loud red, it is already adjudicated cell-for-cell by
      // the exemption machinery above, and counting it a second time under a second name would let
      // one fact satisfy two assertions. The refusals are still RENDERED (above) so they can never be
      // mistaken for agreement with a loader that enumerated nothing.
      if (moduleNames.ok && moduleNameVerdict !== loaderNameVerdict) {
        nameSetDisagreements.push(
          `${cell.where}\tmodule-names=${moduleNameVerdict}\tloader-names=${loaderNameVerdict}\tloader-flat=${JSON.stringify(verdict.flat)}`,
        );
      }

      if (moduleVerdict === loaderVerdict) continue;
      const detail = `${cell.where}\tmodule=${moduleVerdict}\tloader=${loaderVerdict}\tvalue=${JSON.stringify(verdict.value)}`;
      disagreements.push(detail);
      disagreementDetail.set(cell.where, detail);
      // The unsafe set is the two directions no reason can exempt.
      if (moduleVerdict !== "refuse") unsafe.push(`${cell.where}\tmodule=${moduleVerdict}\tloader=${loaderVerdict}`);
    }

    // ── (27-48, WR-03) THE NAMED REGIONS, THROUGH THE SAME TWO PREDICATES ────────────────────────
    //
    // Same loader batch, same three-verdict discipline, same two lists. They are OUTSIDE the exemption
    // machinery by construction: an exemption is stated from an axis shape's declared YAML facts, and
    // these regions have no axis. A token-presence disagreement on one of them is therefore recorded
    // in its own list and asserted EMPTY — there is no shape here for a reason to be written about.
    const namedTokenDisagreements: string[] = [];
    for (let i = 0; i < NAMED_REGIONS.length; i += 1) {
      const named = NAMED_REGIONS[i];
      const verdict = verdicts[CELLS + i];
      // A named region the loader will not read pins nothing, so its acceptance is asserted rather
      // than skipped — the opposite of the generated cells, which may legitimately be rejected.
      expect(
        verdict.accepted,
        `${named.label}: the loader must ACCEPT a named region, or it pins nothing`,
      ).toBe(true);
      const document = `---\n${named.region}---\nBody.\n`;
      const answer = hasSpawnGrant(document);
      const moduleVerdict = answer.ok
        ? answer.value
          ? "grant"
          : "no-grant"
        : "refuse";
      // THE LOADER'S TOKEN VERDICT IS DELEGATED HERE, NOT SUBSTRING-TESTED. The generated cells all
      // carry `HARNESS_TOKEN` verbatim, so a plain `includes` is a non-circular predicate for them.
      // A named region carries the token spelling ITS FINDING took — row a1's is `Agent(alpha, ga`
      // split across two lines — so the same substring test would report "no-grant" for a loader
      // value that plainly grants. The delegation is the same one the name set already makes, and
      // rests on the same argument: `keysHaveSpawnGrant` is not the thing under test here, the
      // FLATTENED VALUE is, and reading the two sides two different ways would make every
      // disagreement ambiguous.
      const loaderVerdict = keysHaveSpawnGrant(
        new Map([["tools", [verdict.flat ?? ""]]]),
      )
        ? "grant"
        : "no-grant";
      if (moduleVerdict !== loaderVerdict) {
        namedTokenDisagreements.push(
          `${named.label}\tmodule=${moduleVerdict}\tloader=${loaderVerdict}\tvalue=${JSON.stringify(verdict.value)}`,
        );
      }
      const moduleNames = grantedAgentNames(document);
      const loaderNames = loaderGrantedNames(verdict.flat ?? "");
      const moduleNameVerdict = nameVerdict(moduleNames);
      if (!moduleNames.ok) {
        refusedNameColumns.push(`${named.label}\t${moduleNameVerdict}`);
      }
      if (moduleNames.ok && moduleNameVerdict !== nameVerdict(loaderNames)) {
        nameSetDisagreements.push(
          `${named.label}\tmodule-names=${moduleNameVerdict}\tloader-names=${nameVerdict(loaderNames)}\tloader-flat=${JSON.stringify(verdict.flat)}`,
        );
      }
    }
    expect(
      namedTokenDisagreements,
      `a named region is carried in BECAUSE a finding took its shape; it is never exempt:\n${namedTokenDisagreements.join("\n")}`,
    ).toEqual([]);

    const elapsed = Date.now() - started;
    // FIVE DERIVED NUMBERS, ALL COUNTED AT RUN TIME AND NONE WRITTEN DOWN IN ADVANCE.
    console.log(
      `D-52 loader differential — loader ${probe.version} | corpus ${digest} | cells enumerated ${CELLS} + ${NAMED_REGIONS.length} named = ${BATCH} | loader-rejected (skipped) ${rejected} | token-presence disagreements ${disagreements.length} | NAME-SET disagreements ${nameSetDisagreements.length} | ${elapsed}ms`,
    );

    // ── (27-49, WR-04 / D-56 item 3) THE EQUALITY IS SPLIT INTO THE TWO HONEST PREDICATES ────────
    //
    // WHAT STOOD HERE AND WHY IT WAS THE WRONG SHAPE. One assertion required the DISAGREEMENT set to
    // EQUAL the EXEMPT set, and `expectedExempt` was pushed for every loader-accepted cell an
    // exemption matched WHETHER OR NOT that cell diverged. So a cell an exemption covers which
    // happens to AGREE with the loader turned this harness RED — and the cheapest repair for that
    // red is to narrow `matches`. An assertion whose least-effort fix is narrowing a safety rule
    // pressures a maintainer toward exemption-shaped edits, and that is worse than no assertion,
    // because the pressure is invisible in the diff it produces.
    //
    // NOTHING IS RELAXED BY THE SPLIT. The equality's real content was "every disagreement is
    // explained AND every exemption is still needed"; both halves are asserted below, each with its
    // own failure message, and the second is STRENGTHENED — it now demands a disagreeing cell rather
    // than merely a matched one. What is dropped is only the part that turned agreement into a
    // failure. Both halves come from ONE pure function so the proof case fires the same rule.
    const adjudication = adjudicateExemptions(
      adjudicationRows,
      EXEMPTIONS.map((e) => e.label),
    );
    // NO UNEXPLAINED DISAGREEMENT. The disagreement set is DATA — listed with its axis labels and the
    // loader's value — and this asserts every member of it is covered by a named exemption.
    expect(
      adjudication.unexplained.map((w) => disagreementDetail.get(w) ?? w),
      `a disagreement with the loader that NO named exemption covers. The exemptions are the only permitted divergence and each is stated from the module's declared policy; anything else is a finding.\nDISAGREEMENTS (${disagreements.length}):\n${disagreements.join("\n")}`,
    ).toEqual([]);
    // NO DEAD EXEMPTION. A rule that explains no DISAGREEING cell is dead weight that reads like a
    // guard — and the old liveness check could not see that, because it asked only whether the rule
    // matched a loader-accepted cell, which any rule stated over an axis flag does by construction.
    expect(
      adjudication.dead.map(
        (label) =>
          `${label}\n  matched ${rowsMatched.get(label) ?? 0} loader-accepted cell(s) and NO disagreeing one\n  ${EXEMPTIONS.find((e) => e.label === label)?.reason ?? ""}`,
      ),
      "an exemption that explains no disagreement is not an exemption — the divergence it was written for is gone, and the rule must go with it rather than stand as a reason nothing needs",
    ).toEqual([]);

    // THE UNSAFE DIRECTIONS ARE NOT EXEMPTIBLE, ASSERTED SEPARATELY SO THE FAILURE SAYS WHICH ONE.
    expect(
      unsafe,
      `a module GRANT where the loader has none, or a module NO-GRANT where the loader grants, is NEVER exemptible:\n${unsafe.join("\n")}`,
    ).toEqual([]);

    // (27-48, WR-03) AND THE NAME SET IS ASSERTED SEPARATELY FROM TOKEN PRESENCE, SO A FAILURE SAYS
    // WHICH FACT DIVERGED. It is asserted EMPTY rather than "equal to a named exemption set": there
    // is no direction in which a name set the document does not express is acceptable. The two
    // consumers are set equalities, and a name invented, dropped or altered on the `ok:true` arm
    // changes what the KIT-03 oracle proves without changing any boolean anywhere.
    expect(
      nameSetDisagreements,
      `the module's NAME SET must EQUAL the set the same enumeration extracts from the loader's own flattened value. Token presence agreeing while the name sets differ is round 8's CR-02 row a1 exactly.\nNAME-SET DISAGREEMENTS (${nameSetDisagreements.length}):\n${nameSetDisagreements.join("\n")}`,
    ).toEqual([]);

    // A REFUSAL IS NEVER RENDERED AS AN EMPTY NAME SET, over the cells that actually produced one.
    expect(
      refusedNameColumns.filter((r) => !r.endsWith("\trefuse")),
      "a module refusal rendered as `[]` would be indistinguishable from a value that was read and granted nothing",
    ).toEqual([]);
    // ...and the check is NON-VACUOUS: this corpus really does contain module refusals.
    expect(
      refusedNameColumns.length,
      "cells on which the module refused — if this is 0 the empty-edge check asserted nothing",
    ).toBeGreaterThan(0);

    // ── (27-49, WR-04) THE REPLACEMENT FOR THE DELETED PER-EXEMPTION BOUND ────────────────────────
    //
    // ITS RIGHT-HAND SIDE IS WHAT THE LOADER ACCEPTED, WHICH NO EXEMPTION CONTROLS. That is the whole
    // difference from the bound this replaces: that one was the product of the very axis flags its
    // own match rule read, so it held for every corpus. An exemption widened until it explains most
    // of the corpus turns THIS red — which is the failure the deleted bound was described as catching
    // and arithmetically could not.
    const accepted = CELLS - rejected;
    const exemptCells = new Set(expectedExempt).size;
    // The two products the deleted bounds WERE, re-derived on every run rather than quoted from the
    // paragraph at the exemption declarations — so the arithmetic that made them unfailable stays
    // checkable after this comment scrolls out of a reader's context.
    const E1_OLD_BOUND =
      DANGLING_PROPERTY_SHAPES *
      AXIS_CONTINUATION_1.length *
      AXIS_CONTINUATION_2.length *
      AXIS_CONTINUATION_DEPTH.length;
    const E2_OLD_BOUND =
      CONTINUATION_START_SHAPES *
      AXIS_CONTINUATION_2.length *
      AXIS_CONTINUATION_DEPTH.length;
    console.log(
      `D-52 exemption accounting — loader-accepted ${accepted} | exempt cells ${exemptCells} | disagreements ${disagreements.length} | per-rule matched ${EXEMPTIONS.map((e) => `${e.label.slice(0, 2)}=${rowsMatched.get(e.label) ?? 0}`).join(" ")} | the DELETED bounds would have been E1=${E1_OLD_BOUND} E2=${E2_OLD_BOUND} (each the full cross-product its own match rule reads, hence unfailable)`,
    );
    expect(
      exemptCells,
      `the exempt cells must be a strict MINORITY of the ${accepted} the loader accepted — an exemption cannot widen until it explains the corpus`,
    ).toBeLessThan(accepted / 2);

    // Non-vacuity: the loader must have ACCEPTED a substantial part of the corpus. A run in which the
    // loader rejected everything would satisfy every assertion above while measuring nothing.
    expect(
      accepted,
      `loader-accepted cells, of ${CELLS} enumerated`,
    ).toBeGreaterThan(CELLS / 2);
  });

  // ── (27-51, WR-01 / D-56 item 1) THE NON-CIRCULARITY FLOOR FOR THE TWO NEW AXES ────────────────

  it("WR-01 the quote-style and in-scalar-escape axes are EXERCISED — collapsing them to their first member strictly REDUCES the loader-accepted cell count, measured in this run", () => {
    // WHY A FLOOR AND NOT A COMMENT. An axis that is declared but produces nothing new is a coverage
    // claim wearing an array. The only honest way to say "these axes moved the corpus" is to build
    // the corpus BOTH ways in ONE run and let the loader count. Neither number below is written down;
    // both are printed, and the assertion is over their ORDER rather than their values, so a base axis
    // that grows next round does not need this case edited.
    const probe = probeLoader(RUBY);
    if (!probe.ok) {
      console.warn(
        `SKIPPED the WR-01 non-vacuity floor: ${probe.reason}. PRINTED, never silent — no expectation is invented in the loader's absence.`,
      );
      return;
    }

    // COLLAPSED = both new axes at their FIRST member, which by the identity rule in `deriveKeyLines`
    // reproduces the pre-change key-line axis byte for byte. That is asserted here rather than
    // described, because "the widening is additive" is precisely the kind of claim this file exists
    // to stop taking on trust.
    const collapsedKeyLines = deriveKeyLines(
      [AXIS_QUOTE_STYLE[0]],
      [AXIS_ESCAPE_IN_SCALAR[0]],
    );
    expect(
      collapsedKeyLines.map((k) => JSON.stringify(k)),
      "collapsing both new axes must reproduce the BASE key-line axis exactly — otherwise the widening re-cut the corpus instead of extending it",
    ).toEqual(AXIS_KEY_LINE_BASE.map((k) => JSON.stringify(k)));

    const full = enumerateCells(AXIS_KEY_LINE);
    const collapsed = enumerateCells(collapsedKeyLines);
    const fullRegions = full.map((c) => buildCellRegion(c.keyLine, c.first, c.second, c.depth));
    const collapsedRegions = collapsed.map((c) =>
      buildCellRegion(c.keyLine, c.first, c.second, c.depth),
    );
    // ONE loader process for BOTH corpora, so "measured in the same run" is a fact about the
    // measurement and not a sentence about intent.
    const raw = execFileSync(RUBY, ["-e", LOADER_PROGRAM], {
      input: JSON.stringify([...fullRegions, ...collapsedRegions]),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const verdicts = JSON.parse(raw) as { accepted: boolean }[];
    expect(verdicts.length).toBe(fullRegions.length + collapsedRegions.length);
    const acceptedFull = verdicts
      .slice(0, fullRegions.length)
      .filter((v) => v.accepted).length;
    const acceptedCollapsed = verdicts
      .slice(fullRegions.length)
      .filter((v) => v.accepted).length;

    console.log(
      `WR-01 non-vacuity floor — loader ${probe.version} | key-line shapes ${AXIS_KEY_LINE.length} full vs ${collapsedKeyLines.length} collapsed | cells ${fullRegions.length} vs ${collapsedRegions.length} | LOADER-ACCEPTED ${acceptedFull} full vs ${acceptedCollapsed} collapsed`,
    );

    expect(
      acceptedFull,
      `the two new axes must MOVE the loader-accepted cell count: full ${acceptedFull} vs collapsed ${acceptedCollapsed}. If these are equal the axes are declared and not exercised, and the differential's completeness line is again a statement about inputs it never generated.`,
    ).toBeGreaterThan(acceptedCollapsed);
    // And the collapsed run is not empty, so the comparison is between two real measurements.
    expect(acceptedCollapsed).toBeGreaterThan(0);
  });

  // ── (27-49, WR-04 / D-56 item 3) BOTH REPLACEMENT ASSERTIONS, FIRED BY CONSTRUCTED INPUTS ──────

  it("WR-04 the replacement assertions are LOAD-BEARING — each is fired by a constructed input and names the offender, and an exempt cell that AGREES no longer turns the harness red", () => {
    // A REPLACEMENT ASSERTION THAT WAS NEVER RED IS NOT A PIN. The rule under test here is the SAME
    // `adjudicateExemptions` the differential above calls — not a copy of it — so what fires here is
    // what runs there. Constructing the failing input is the only way to know that the two halves of
    // the split can still fail at all, which is the exact property the deleted bound turned out to
    // lack after standing in this file for a round reading like a floor.
    const LABELS = ["E1", "E2"];

    // ── HALF ONE FIRES: a disagreement no exemption covers, and the offender is NAMED.
    const withUnexplained = adjudicateExemptions(
      [
        { where: "covered cell", disagrees: true, matched: ["E1"] },
        { where: "PLANTED unexplained cell", disagrees: true, matched: [] },
        { where: "covered by E2", disagrees: true, matched: ["E2"] },
      ],
      LABELS,
    );
    expect(withUnexplained.unexplained).toEqual(["PLANTED unexplained cell"]);
    expect(withUnexplained.dead).toEqual([]);

    // ── HALF TWO FIRES: an exemption that matches only AGREEING cells is DEAD, and it is named.
    // Note what this catches that the deleted liveness check could not: E2 matches a cell here, so
    // "matched at least one loader-accepted cell" was satisfied — and the rule still explains nothing.
    const withDead = adjudicateExemptions(
      [
        { where: "a disagreement E1 explains", disagrees: true, matched: ["E1"] },
        { where: "an AGREEING cell E2 matches", disagrees: false, matched: ["E2"] },
      ],
      LABELS,
    );
    expect(withDead.dead).toEqual(["E2"]);
    expect(withDead.unexplained).toEqual([]);

    // ── AND THE BEHAVIOUR THE OLD EQUALITY GOT WRONG, CONSTRUCTED SO IT IS NOT ARGUED. An exempt
    // cell that AGREES with the loader must NOT turn the harness red, because the cheapest repair for
    // that red is narrowing the exemption.
    const rows = [
      { where: "exempt AND agreeing", disagrees: false, matched: ["E1"] },
      { where: "exempt AND disagreeing", disagrees: true, matched: ["E1"] },
    ];
    const both = adjudicateExemptions(rows, ["E1"]);
    expect(both.unexplained, "an exempt cell that agrees is not an unexplained disagreement").toEqual([]);
    expect(both.dead, "E1 explains a real disagreement here, so it is live").toEqual([]);

    // ...and the DELETED equality is shown to have gone RED on exactly that input, so the repair is a
    // measured correction rather than a preference. Reconstructed from its own two operands.
    const oldDisagreementSet = rows.filter((r) => r.disagrees).map((r) => r.where).sort();
    const oldExpectedExemptSet = rows.filter((r) => r.matched.length > 0).map((r) => r.where).sort();
    expect(
      oldDisagreementSet,
      "the retired assertion required these two sets to be EQUAL; they are not, so it would have failed on a corpus in which nothing is wrong",
    ).not.toEqual(oldExpectedExemptSet);

    // NON-VACUITY: the adjudicator returns EMPTY on a clean input, so the three cases above are
    // measuring the rule rather than a function that always reports something.
    const clean = adjudicateExemptions(
      [
        { where: "agrees, unexempt", disagrees: false, matched: [] },
        { where: "disagrees, exempt", disagrees: true, matched: ["E1"] },
      ],
      ["E1"],
    );
    expect(clean).toEqual({ unexplained: [], dead: [] });
  });

  // ── THE SKIP BRANCH, EXERCISED RATHER THAN ASSUMED REACHABLE ──────────────────────────────────

  // ── (27-48, WR-03) THE NAME-SET PREDICATE'S OWN THREE PROPERTIES, PINNED ─────────────────────

  it("WR-03 the name-set predicate — a REFUSAL and an EMPTY NAME SET are constructed side by side and record DIFFERENT verdicts", () => {
    // THE EMPTY EDGE, WITH BOTH SIDES BUILT RATHER THAN ARGUED. If a refusal rendered as `[]`, a
    // module that could not read a value would be indistinguishable from one that read it and found
    // no grant — this module's founding failure, moved into the harness that exists to catch it.
    //
    // A refusal: the enumeration opens and is never closed, so `keysGrantedAgentNames` returns the
    // "neither" arm by name rather than the empty list of an unscoped grant.
    const refusal = loaderGrantedNames("Read, Agent(alpha");
    expect(refusal.ok).toBe(false);
    expect(nameVerdict(refusal)).toBe("refuse");
    // A value that was READ and enumerates nothing.
    const empty = loaderGrantedNames("Read, Write");
    expect(empty).toEqual({ ok: true, value: [] });
    expect(nameVerdict(empty)).toBe("[]");
    // The two can never compare equal.
    expect(nameVerdict(refusal)).not.toBe(nameVerdict(empty));
  });

  it("WR-03 the name-set predicate — SET equality, never cardinality: three names matching three names over two different sets still fails", () => {
    // The precision edge. A count-based comparison would call these two agreements.
    const a = loaderGrantedNames("Agent(alpha, beta, gamma)");
    const b = loaderGrantedNames("Agent(alpha, beta, delta)");
    expect(a.ok && a.value.length).toBe(3);
    expect(b.ok && b.value.length).toBe(3);
    expect(nameVerdict(a)).not.toBe(nameVerdict(b));
    // Sorted and de-duplicated, so ORDER and REPETITION are not differences.
    expect(nameVerdict(loaderGrantedNames("Agent(beta, alpha, beta)"))).toBe(
      nameVerdict(loaderGrantedNames("Agent(alpha, beta)")),
    );
  });

  it("WR-03 the name-set predicate DELEGATES to the module's own enumeration, asserted rather than described", () => {
    // The helper's whole non-circularity argument is that BOTH sides use ONE extractor, so a
    // disagreement is unambiguously about the flattened value. That is checkable, not merely stated.
    for (const flat of [
      "Read, Agent(alpha, beta)",
      "Agent(alpha)",
      "Read, Write",
      "Read, Agent(alpha",
    ]) {
      expect(loaderGrantedNames(flat), flat).toEqual(
        keysGrantedAgentNames(new Map([["tools", [flat]]])),
      );
    }
  });

  it("WR-03 the predicate is LOAD-BEARING — the row a1 shapes are in the corpus, and this build agrees with the loader on them", () => {
    // WHY THE RED HALF OF THIS PROOF IS NOT HERE. A committed case cannot import a module that
    // stopped existing, so the RED transcript is produced OUT of suite against a `git archive` mirror
    // of the pre-27-48 build and recorded verbatim in 27-48-SUMMARY.md:
    //
    //   PRE  (mirror of 89705ba) : NAME-SET disagreements 2 — both row a1 spellings,
    //                              module ["alpha","ga","mma"] vs loader ["alpha","ga - mma"]
    //   POST (this build)        : NAME-SET disagreements 0
    //
    // A PREDICATE THAT WAS NEVER RED IS NOT A PIN. What lives here is the GREEN half plus the pin
    // that the shapes are still in the corpus — so a later edit that deletes them shrinks the harness
    // loudly instead of quietly.
    expect(NAMED_REGIONS.length).toBeGreaterThan(0);
    expect(
      NAMED_REGIONS.map((n) => n.region),
      "the row a1 spellings are the shapes this predicate exists to catch; removing them makes it decoration",
    ).toEqual([
      "name: x\ntools:\n  Agent(alpha, ga\n  - mma)\n",
      "name: x\ntools:\n  - Agent(alpha, ga\n    - mma)\n",
    ]);
    for (const named of NAMED_REGIONS) {
      const document = `---\n${named.region}---\nBody.\n`;
      expect(grantedAgentNames(document), named.label).toEqual({
        ok: true,
        value: ["alpha", "ga - mma"],
      });
    }
  });

  // ── (27-49, WR-02 / D-56 item 2) THE DERIVED SWEEP'S PREMISE, ASSERTED WHERE THE LOADER LIVES ──

  it("WR-02 the derived flow node-start corpus is LOADABLE and every cell's loaded value GRANTS — the premise the universal sweep rests on", () => {
    // WHY THIS CASE IS HERE AND NOT BESIDE THE SWEEP. The sweep asserts that no derived context
    // returns the silent no-grant arm, and its expectation is stated from YAML: inside a quoted
    // scalar every character is content, so the token survives. That reasoning has a PREMISE — that
    // each generated document is one a real YAML 1.2 loader reads, with the token in the value it
    // computes. A production added later whose documents libyaml REJECTS would silently turn the
    // sweep into a demand made of text no platform loads, and the sweep would go on reading green
    // while covering less. So the premise is re-measured on every run, in the block that already
    // owns the batched loader, rather than recorded once in a comment — which is the shape of claim
    // this module has now found to be false nine times.
    const probe = probeLoader(RUBY);
    if (!probe.ok) {
      console.warn(
        `SKIPPED WR-02 loadability premise: ${probe.reason}. PRINTED, never silent — ${FLOW_NODE_START_CONTEXTS.length} contexts were derived and no expectation was invented in the loader's absence.`,
      );
      return;
    }
    const QUOTES: readonly (readonly [string, string])[] = [
      ["double", '"'],
      ["single", "'"],
    ];
    const cells: { where: string; region: string }[] = [];
    for (const context of FLOW_NODE_START_CONTEXTS) {
      for (const [qLabel, q] of QUOTES) {
        cells.push({
          where: `${context.label} | ${qLabel}-quoted`,
          region: `name: x\ntools: ${context.open}${q}Read,\n  # x, ${HARNESS_TOKEN}${q}${context.close}\n`,
        });
      }
    }
    expect(cells.length).toBe(FLOW_NODE_START_CONTEXTS.length * QUOTES.length);
    expect(cells.length).toBeGreaterThan(0);
    // Same batched one-process discipline as the differential above: one crossing of the boundary.
    const verdicts = JSON.parse(
      execFileSync(RUBY, ["-e", LOADER_PROGRAM], {
        input: JSON.stringify(cells.map((c) => c.region)),
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      }),
    ) as { accepted: boolean; value?: string; error?: string }[];
    expect(
      verdicts.length,
      "a truncated loader batch must fail arithmetically rather than silently shorten the premise",
    ).toBe(cells.length);

    const unreadable: string[] = [];
    const tokenless: string[] = [];
    for (let i = 0; i < cells.length; i += 1) {
      if (!verdicts[i].accepted) {
        unreadable.push(`${cells[i].where}\t${verdicts[i].error}`);
        continue;
      }
      if (!(verdicts[i].value ?? "").includes(HARNESS_TOKEN)) {
        tokenless.push(
          `${cells[i].where}\tloader-value=${JSON.stringify(verdicts[i].value)}`,
        );
      }
    }
    expect(
      unreadable,
      `a derived flow node-start context whose document libyaml will not read makes the sweep a demand over text no platform loads:\n${unreadable.join("\n")}`,
    ).toEqual([]);
    expect(
      tokenless,
      `a derived context whose LOADED value does not carry the token cannot support "the token always survives" — the sweep's YAML-stated expectation does not hold there:\n${tokenless.join("\n")}`,
    ).toEqual([]);
    console.log(
      `WR-02 derived flow node-start premise — loader ${probe.version} | contexts ${FLOW_NODE_START_CONTEXTS.length} (${FLOW_NODE_START_PRODUCTIONS.length} productions x ${FLOW_NODE_PROPERTIES.length} node properties x ${FLOW_NESTINGS.length} nestings) | cells ${cells.length} | loader-rejected ${unreadable.length} | token absent from the loaded value ${tokenless.length}`,
    );
  });

  // ── (27-49, WR-01 / D-56 item 1) THE BUILDER IS COUNTED, NOT TRUSTED ─────────────────────────

  it("WR-01 the cell builder emits EXACTLY the requested continuation depth — counted from its own output over every cell", () => {
    // WHY THIS CASE EXISTS AT ALL. Depth was a CONSTANT baked into the builder for a whole round, and
    // a constant nobody wrote down is invisible to every assertion over the axes — the axis-length
    // floors, the cell-total derivation and the distinct-key check were all green while the builder
    // could only ever emit two continuation lines. Now that depth is an axis, the builder is the
    // single most likely place in this block for a silently wrong shape, so its output is COUNTED.
    let checked = 0;
    for (const keyLine of AXIS_KEY_LINE) {
      for (const first of AXIS_CONTINUATION_1) {
        for (const second of AXIS_CONTINUATION_2) {
          for (const depth of AXIS_CONTINUATION_DEPTH) {
            const where = `${keyLine.label} | ${first.label} | ${second.label} | depth ${depth}`;
            const parts = buildCellParts(keyLine, first, second, depth);
            expect(parts.continuations.length, where).toBe(depth);
            // Each continuation carries its key-line shape's own indent, so a "depth" can never be a
            // column-0 line that changed the document's structure instead of continuing its value.
            for (const line of parts.continuations) {
              expect(line.startsWith(keyLine.indent), `${where}: ${JSON.stringify(line)}`).toBe(true);
            }
            // The token-carrying line is LAST. That is the whole point of depth 3: the node begins on
            // continuation 1 and is still running when the token arrives two lines later.
            expect(
              parts.continuations[parts.continuations.length - 1],
              `${where}: the token must ride the LAST continuation`,
            ).toContain(HARNESS_TOKEN);
            // The joined region really carries them — the array and the region could only disagree
            // if the join lost a line, which is exactly the failure a count over the array misses.
            const expectedRegionLines =
              1 +
              keyLine.lines.length +
              parts.continuations.reduce((n, c) => n + c.split("\n").length, 0) +
              1;
            expect(parts.region.split("\n").length, where).toBe(expectedRegionLines);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBe(
      AXIS_KEY_LINE.length *
        AXIS_CONTINUATION_1.length *
        AXIS_CONTINUATION_2.length *
        AXIS_CONTINUATION_DEPTH.length,
    );
    expect(checked).toBeGreaterThan(0);
  });

  // ── (27-49, WR-01 / D-56 item 1) THE EXPRESSIBILITY FLOOR, READ FROM THE MODULE'S OWN LEDGER ──

  it("WR-01 the expressibility floor — every failure family the module's OWN LEDGER names is BUILDABLE by this generator, derived from the ledger at run time", () => {
    // A COMMENT SAYING "THIS CORPUS COVERS THE FAMILIES THE MODULE HAS FAILED ON" IS THE THING THAT
    // FAILED NINE TIMES. The ledger in scripts/frontmatter.ts's header is the module's own list of
    // those families, it grows by one entry per round, and it is the only list in this repository a
    // reviewer maintains deliberately. Reading it AT RUN TIME and asserting each family is buildable
    // turns "this corpus is complete enough" from a claim into a mechanism: a TENTH-round family
    // written into the ledger without a corpus shape to match it fails HERE, by name.
    //
    // WHAT SET THIS DERIVATION ENUMERATES, STATED SO IT IS NOT GUESSED. It enumerates the ledger's
    // FAMILY ROWS: comment lines at the header's five-space family indent whose text is a short
    // label followed by a backtick-quoted document sketch naming the `tools:` key. That is the
    // module's own uniform format for "here is a concrete failure shape".
    //
    // WHAT THIS FLOOR DOES NOT CLAIM, STATED HERE BECAUSE A FLOOR READ AS WIDER THAN IT IS BECOMES
    // THE COMMENT IT REPLACED. The ledger records failures the module has CLOSED, each with its
    // remedy; an OPEN bypass is not in it and is not caught here. "Every ledger family is buildable"
    // is a floor against a coverage claim going stale — it is NOT a statement that every known defect
    // is expressible, and it must never be quoted as one.
    //
    // (27-52, D-57) AND THE EXAMPLE THIS PARAGRAPH USED TO CARRY HAS NOW RUN ITS WHOLE COURSE, WHICH
    // IS RECORDED RATHER THAN QUIETLY DELETED. When this floor was written, `27-49` measured the
    // nested-block-scalar family (G — `tools:` / `  nested: >-` / `    Read,` / `    # x, TOKEN`, and
    // G2, the same header as a sequence item) as a LIVE silent-no-grant that was NOT a ledger family
    // row and NOT expressible by this generator's key-line axis — and named that as a property OF
    // THIS FLOOR. `27-52` closed the family, which earned it the eleventh ledger entry, which made
    // this floor DEMAND a corpus shape for it, which is why `AXIS_KEY_LINE_BASE` now carries the two
    // nested-header members. The mechanism did what it was built to do; the limitation it documents
    // is unchanged and still applies to whatever the NEXT open bypass turns out to be.
    //
    // AND IT DELIBERATELY DOES NOT COUNT THE LEDGER'S ORDINAL ENTRY HEADINGS, because those are NOT
    // uniformly spelled and a count over them would be wrong while reading authoritative — this
    // repository's own diagnosed second systemic failure class. MEASURED: seven of the ten entries
    // carry an `AND A <ORDINAL> TIME` heading; entries one and two are introduced as prose and entry
    // four as "This is the FOURTH spelling". A heading-derived count returns 7 for a ten-entry
    // ledger. The family rows are the set this floor needs and they have one format.
    const moduleSource = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const FAMILY_ROW = /^\/\/ {5}(\S+(?: \([a-z]\))?) {2,}(`.*)$/;
    const LEDGER_FAMILIES = moduleSource
      .split("\n")
      .map((line) => FAMILY_ROW.exec(line))
      .filter((m): m is RegExpExecArray => m !== null && m[2].includes("`tools:"))
      .map((m) => ({ label: m[1], sketch: m[2] }));

    // TWO-SIDED, SO THE FLOOR CANNOT PASS BY FINDING ZERO — and cannot pass by finding a set that
    // quietly shrank either. A row added or removed in the module header fails HERE first.
    // (27-52, D-57) 9 -> 11: the eleventh ledger entry's two family rows, G and G2. The floor's
    // derived set GREW because the family was CLOSED and therefore earned a ledger entry — which is
    // exactly the property 27-49 recorded about this floor (an OPEN bypass has no ledger row and is
    // outside the derived set by construction) reaching its intended end state.
    expect(
      LEDGER_FAMILIES.length,
      `family rows derived from scripts/frontmatter.ts's header:\n${LEDGER_FAMILIES.map((f) => `${f.label}  ${f.sketch}`).join("\n")}`,
    ).toBe(11);
    expect(LEDGER_FAMILIES.length).toBeGreaterThan(0);
    expect(new Set(LEDGER_FAMILIES.map((f) => f.label)).size).toBe(
      LEDGER_FAMILIES.length,
    );

    // THE ONE CLASS THIS GENERATOR CANNOT REACH, AND THE REASON IS DERIVED FROM THE ROW ITSELF RATHER
    // THAN ASSERTED ABOUT IT. A family row whose own sketch contains a COLUMN-0 CODE FENCE needs a
    // fence line INSIDE the frontmatter region; this builder emits every continuation at its
    // key-line shape's indent, so a column-0 line is outside its shape space BY CONSTRUCTION — not
    // omitted, unreachable. The module header records the loader column for exactly those rows (two
    // of the three are documents libyaml REJECTS outright, and the one it accepts the module ALREADY
    // refuses), and a cell family whose members are all loader-rejected is not coverage. Counted
    // two-sided so the exclusion cannot silently grow into a place to hide a new family.
    const outside = LEDGER_FAMILIES.filter((f) => f.sketch.includes("```"));
    const inside = LEDGER_FAMILIES.filter((f) => !f.sketch.includes("```"));
    expect(
      outside.map((f) => f.label),
      "the column-0-fence families are the ONLY ones outside this generator's shape space",
    ).toEqual(["d1", "d2", "d3"]);
    expect(outside.length).toBe(3);
    expect(inside.length).toBe(8);
    expect(outside.length + inside.length).toBe(LEDGER_FAMILIES.length);

    // THE AXIS-MEMBER COMBINATION THAT BUILDS EACH FAMILY, NAMED BY LABEL. This is the only
    // hand-written fact in the floor and it is checked at BOTH ends: a label the ledger stops
    // carrying fails as an orphan, and a label the ledger starts carrying with no entry here fails
    // by name. The axis members are looked up BY LABEL in the real axes, so renaming one fails red.
    const EXPRESSED_BY: Readonly<
      Record<string, { keyLine: string; first: string; second: string; depth: number }>
    > = {
      "family (a)": {
        keyLine: "no value",
        first: "opens a double-quoted scalar",
        second: "the token after a hash",
        depth: 2,
      },
      "family (b)": {
        keyLine: "flow-sequence opener",
        first: "opens a double-quoted scalar",
        second: "the token after a hash",
        depth: 2,
      },
      A: {
        keyLine: "nested block mapping, mid-line quote",
        first: "plain text",
        second: "the token after a hash",
        depth: 2,
      },
      B: {
        keyLine: "compact nested sequence, mid-line quote",
        first: "plain text",
        second: "the token after a hash",
        depth: 2,
      },
      C: {
        keyLine: "JSON-adjacent flow mapping, unspaced",
        first: "plain text",
        second: "the token after a hash",
        depth: 2,
      },
      F: {
        keyLine: "block explicit key, mid-line quote",
        first: "plain text",
        second: "the token after a hash",
        depth: 2,
      },
      // (27-52, D-57) The eleventh ledger entry's two family rows. This is the mechanism working as
      // designed and it is worth naming: the family was OPEN, so it had no ledger row and this floor
      // could not see it — a property of the floor 27-49 recorded rather than left to be discovered.
      // Closing it earns the ledger row, and the row's arrival is what makes the floor DEMAND the
      // corpus shape that task 2 of the same plan added.
      G: {
        keyLine: "nested block mapping value, block-scalar header",
        first: "plain text",
        second: "the token after a hash",
        depth: 2,
      },
      G2: {
        keyLine: "block-sequence item, block-scalar header",
        first: "plain text",
        second: "the token after a hash",
        depth: 2,
      },
    };

    // A LEDGER FAMILY WITH NO CORPUS SHAPE FAILS BY NAME. This is the mechanism the whole case
    // exists for: the tenth round's family cannot be written into the module header and quietly not
    // be generated.
    expect(
      inside.filter((f) => !(f.label in EXPRESSED_BY)).map((f) => `${f.label}  ${f.sketch}`),
      "a failure family named in the module's ledger with NO axis-member combination that builds it — the corpus cannot express a defect the module has already shipped",
    ).toEqual([]);
    expect(
      Object.keys(EXPRESSED_BY).filter(
        (label) => !LEDGER_FAMILIES.some((f) => f.label === label),
      ),
      "an ORPHAN expression: this names a family the ledger no longer carries, which is a vacuous entry reading like coverage",
    ).toEqual([]);

    const corpusKeys = new Set(enumerateCells().map((c) => c.where));
    for (const family of inside) {
      const spec = EXPRESSED_BY[family.label];
      const keyLine = AXIS_KEY_LINE.find((k) => k.label === spec.keyLine);
      const first = AXIS_CONTINUATION_1.find((c) => c.label === spec.first);
      const second = AXIS_CONTINUATION_2.find((c) => c.label === spec.second);
      expect(keyLine, `${family.label}: key-line member "${spec.keyLine}"`).toBeDefined();
      expect(first, `${family.label}: continuation-1 member "${spec.first}"`).toBeDefined();
      expect(second, `${family.label}: continuation-2 member "${spec.second}"`).toBeDefined();
      expect(
        AXIS_CONTINUATION_DEPTH.includes(spec.depth),
        `${family.label}: depth ${spec.depth} must be a member of the depth axis`,
      ).toBe(true);
      if (!keyLine || !first || !second) continue;

      // THE EXPRESSIBILITY PROOF IS DERIVED, NOT ASSERTED. The ledger row spells its document as a
      // `/`-separated list of backticked LINES; the named key-line member's own lines must equal that
      // row's LEADING lines BYTE FOR BYTE. Nothing here is a hand-written "marker" that a later edit
      // could quietly stop matching — the claim is a comparison against the module's own text.
      const fragments = [...family.sketch.matchAll(/`([^`]*)`/g)].map((m) => m[1]);
      expect(
        fragments.slice(0, keyLine.lines.length),
        `${family.label}: the key-line member "${keyLine.label}" must spell this ledger row's leading document lines exactly`,
      ).toEqual([...keyLine.lines]);

      // ...and the cell it builds is really a member of the enumerated corpus, so the family is
      // adjudicated against the loader by the differential above rather than merely constructible.
      const where = `${keyLine.label} | ${first.label} | ${second.label} | depth ${spec.depth}`;
      expect(
        corpusKeys.has(where),
        `${family.label}: the cell that expresses it must be IN the enumerated corpus, or the loader is never asked about it`,
      ).toBe(true);
      const region = buildCellRegion(keyLine, first, second, spec.depth);
      for (const line of keyLine.lines) {
        expect(region, `${family.label}: ${JSON.stringify(line)}`).toContain(line);
      }
      expect(region, `${family.label}: the built cell must carry the spawn token`).toContain(
        HARNESS_TOKEN,
      );
    }

    console.log(
      `WR-01 expressibility floor — ledger family rows derived ${LEDGER_FAMILIES.length} | expressible ${inside.length} (${inside.map((f) => f.label).join(", ")}) | outside the generator's shape space ${outside.length} (${outside.map((f) => f.label).join(", ")})`,
    );
  });

  it("D-52 the no-loader skip path is EXERCISED — a machine without the loader produces a PRINTED reason, and that is measured here rather than assumed", () => {
    // T-27-08-08: "a harness that silently never runs" is the repudiation threat this case closes. The
    // probe is parameterised precisely so this branch can be DRIVEN, with a path that cannot exist.
    const absent = join(tmpdir(), "grugops-no-such-ruby-4f2a1c9e", "ruby");
    const probe = probeLoader(absent);
    expect(probe.ok, "a path that cannot exist must take the skip branch").toBe(
      false,
    );
    expect(!probe.ok && probe.reason).toContain(absent);
    expect(!probe.ok && probe.reason).toContain("Psych/libyaml");
    console.warn(
      `D-52 SKIP BRANCH EXERCISED (deliberately, with an absent interpreter): ${!probe.ok ? probe.reason : ""}`,
    );

    // And the same probe against the real interpreter takes the other branch on a machine that has
    // one — so the two arms are both reached rather than one of them being decorative. On a machine
    // without Ruby this prints its own skip, which is the behaviour under test one level up.
    const real = probeLoader(RUBY);
    if (!real.ok) {
      console.warn(
        `SKIPPED the D-52 positive probe arm: ${real.reason}. PRINTED, never silent.`,
      );
      return;
    }
    expect(real.version).toContain("ruby=");
    expect(real.version).toContain("libyaml=");
  });

  // ── NON-CIRCULARITY, BY SOURCE INSPECTION ─────────────────────────────────────────────────────

  it("D-52 non-circularity — the corpus generator names no symbol of the module under test, and the expectation is the loader's rather than any function of the module", () => {
    // The claim "this corpus was not generated from the code under test" is CHECKABLE. The symbol list
    // is the file-scope `MODULE_SYMBOLS` shared with the D-49 pin — reused, never retyped, because two
    // hand-kept copies of a safety set is the drift class this phase has corrected three times.
    // (27-49, WR-01) THE NEW GENERATOR SURFACE IS INSPECTED TOO. `buildCellParts` is where the depth
    // axis is composed, and the depth axis is itself corpus; a widening whose new parts escaped this
    // pin would be a corpus generator with an unexamined half.
    const generatorSource = [
      buildCellParts.toString(),
      buildCellRegion.toString(),
      buildCellDocument.toString(),
      enumerateCells.toString(),
      // (27-51) THE CROSSING IS GENERATOR SURFACE TOO. `deriveKeyLines` and `opensAQuotedScalar`
      // compose half the key-line axis now, and a derivation exempt from this pin would be a corpus
      // generator with an unexamined half — the same gap the depth axis opened one round ago.
      deriveKeyLines.toString(),
      opensAQuotedScalar.toString(),
      AXIS_QUOTE_STYLE.map((s) => JSON.stringify(s)).join("\n"),
      AXIS_ESCAPE_IN_SCALAR.map((s) => JSON.stringify(s)).join("\n"),
      AXIS_KEY_LINE_BASE.map((s) => JSON.stringify(s)).join("\n"),
      AXIS_KEY_LINE.map((s) => JSON.stringify(s)).join("\n"),
      AXIS_CONTINUATION_1.map((s) => JSON.stringify(s)).join("\n"),
      AXIS_CONTINUATION_2.map((s) => `${s.label} ${s.build.toString()}`).join(
        "\n",
      ),
      JSON.stringify(AXIS_CONTINUATION_DEPTH),
      FILLER,
    ].join("\n");
    for (const symbol of MODULE_SYMBOLS) {
      expect(generatorSource, symbol).not.toContain(symbol);
    }
    // Non-vacuity: the inspected text is really the generator and really non-empty.
    expect(generatorSource).toContain("tools:");
    expect(generatorSource.length).toBeGreaterThan(500);

    // AND THE EXPECTATION ITSELF IS NOT A FUNCTION OF THE MODULE. There is no expected-outcome rule in
    // this block at all — the only expectation is `LOADER_PROGRAM`'s output — so this asserts the
    // absence rather than inspecting a rule that does not exist.
    for (const symbol of MODULE_SYMBOLS) {
      expect(LOADER_PROGRAM, symbol).not.toContain(symbol);
    }
    expect(LOADER_PROGRAM).toContain("YAML.safe_load");
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
  // collection the node-started fact (D-48's `nodeOnKeyLine`, renamed `nodeStarted` by D-55) is
  // already true and no line-level expression can see the node start.

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
          // (D-54) THE NEW LINE-START FACT IS SWEPT TOO, FOR THE SAME REASON THE NODE-START FACT IS:
          // the claim is that it changes only what SURVIVES the boundary, so the returned TEXT must
          // be independent of it, and a swept input is a measured claim where an unswept one is a
          // remembered one.
          for (const lineStartAtOffsetZero of [true, false]) {
            const got = stripComment(
              input,
              {
                openQuote: q as '"' | "'" | null,
                flowDepth: 0,
                nodeMayBegin: true,
              },
              nodeStartAtOffsetZero,
              lineStartAtOffsetZero,
            ).text;
            compared += 1;
            if (got !== text[k]) {
              mismatches.push(
                `${JSON.stringify(input)} entering=${JSON.stringify(q)} nodeStart=${nodeStartAtOffsetZero} lineStart=${lineStartAtOffsetZero}: pre=${JSON.stringify(text[k])} post=${JSON.stringify(got)}`,
              );
            }
          }
        }
      });
    }

    expect(
      mismatches,
      `within-line TEXT differential over ${inputs} generated single-line input(s), ${compared} comparison(s):\n${mismatches.slice(0, 20).join("\n")}`,
    ).toEqual([]);
    // Both numbers derived in this same run — never one derived and one written down.
    expect(compared).toBe(inputs * fixture.entering.length * 2 * 2);
  });

  // ── EVERY REMAINING NODE-START PLACEMENT A VALUE CAN OCCUPY (D-52, round 8) ────────────────────
  //
  // Each row below was measured on the pre-D-51 committed build (RED) and on the rebuilt one
  // (GREEN), with a `/usr/bin/ruby -ryaml` column recorded beside it. Every RED reproduced; the
  // transcripts are in 27-43-SUMMARY.md. No row here is a shape someone imagined — the two families
  // are the corpus, and these are the placements they can occupy.

  it("D-51 row a2 — family (a) in SINGLE quotes", () => {
    // pre-D-51: {ok:true,value:false}, tools=["'Read,"]
    // libyaml:  "Read, # x, Agent(grugops-orchestrator)"
    const text = doc(`tools:\n  'Read,\n  # x, ${TOKEN}'`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`Read, # x, ${TOKEN}`);
  });

  it("D-51 row a3 — the key line carries only a COMMENT, so it begins nothing", () => {
    // pre-D-51: {ok:true,value:false}, tools=["\"Read,"]
    // libyaml:  "Read, # x, Agent(grugops-orchestrator)"
    const text = doc(`tools: # c\n  "Read,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`Read, # x, ${TOKEN}`);
  });

  it("D-51 row key-trailing-ws — the key line's value position holds whitespace only", () => {
    // pre-D-51: {ok:true,value:false}, tools=["\"Read,"]
    // libyaml:  "Read, # x, Agent(grugops-orchestrator)"
    const text = doc(`tools:  \n  "Read,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`Read, # x, ${TOKEN}`);
  });

  it("D-51 row three-line — the scalar opens on the FIRST continuation and closes on the THIRD", () => {
    // pre-D-51: {ok:true,value:false}, tools=["\"Read, Write,"]
    // libyaml:  "Read, Write, # x, Agent(grugops-orchestrator)"
    const text = doc(`tools:\n  "Read,\n  Write,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`Read, Write, # x, ${TOKEN}`);
  });

  it("D-51 row b2 — family (b) in a flow MAPPING, where the quote opens after the `: ` separator", () => {
    // pre-D-51: {ok:true,value:false}, tools=["{a: \"Read,"]
    // libyaml:  {"a"=>"Read, # x, Agent(grugops-orchestrator)"}
    const text = doc(`tools: {a: "Read,\n  # x, ${TOKEN}"}`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`{a: "Read, # x, ${TOKEN}"}`);
  });

  it("D-51 row c1 — the shipped block-sequence idiom with an EMPTY dash line; pre-D-51 it INVENTED a comma", () => {
    // pre-D-51: {ok:true,value:false}, tools=["Read, \"Write,,"]  <- note the doubled comma: the
    //           reset did not only hide the token, it invented structure the document never
    //           expressed, and an invented comma is an invented NAME in the KIT-03 closure equality.
    // libyaml:  ["Read", "Write, # x, Agent(grugops-orchestrator)"]
    const text = doc(`tools:\n  - Read\n  -\n    "Write,\n    # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`Read, "Write, # x, ${TOKEN}"`);
    // The invented comma is gone, asserted directly rather than only implied by the value.
    expect(toolsOf(text)).not.toContain(",,");
  });

  // ── THE RED-TEAM FINDINGS AGAINST D-51 ITSELF (round 8, self-reproduced) ───────────────────────
  //
  // A GREEN SUITE IS NEVER EVIDENCE OF ABSENCE, SO THE FIX WAS ATTACKED BEFORE IT WAS CALLED DONE.
  // The first draft of D-51's scanner passed every case above and every gate, and STILL returned the
  // silent no-grant arm on two mid-line node starts it did not enumerate:
  //
  //   `tools: [!!str "Read,` / `  # x, TOKEN"]`     -> {ok:true,value:false}, libyaml reads the grant
  //   `tools: {? "Read,` / `  # x, TOKEN": v}`      -> {ok:true,value:false}, libyaml reads the grant
  //
  // Both are the SAME question the whole plan is about — *may a node begin at this offset* — asked of
  // positions YAML defines and the first draft's enumeration missed: a node PROPERTY stands in front
  // of a node start (YAML 1.2 § 6.9) and `?` introduces the key node inside a flow mapping (§ 7.4).
  // The remedy was to complete the rule against YAML's own list, not to add the two reported cells.

  it("D-51 red-team — a tag or an anchor standing in front of a mid-line node start does not consume it", () => {
    // FIRST DRAFT of D-51: {ok:true,value:false}, tools=["[!!str \"Read,"] — a live grant on the
    // silent no-grant arm. libyaml: ["Read, # x, Agent(grugops-orchestrator)"].
    const tagged = doc(`tools: [!!str "Read,\n  # x, ${TOKEN}"]`);
    expect(hasSpawnGrant(tagged)).toEqual({ ok: true, value: true });
    expect(toolsOf(tagged)).toContain(TOKEN);

    // The bare and verbatim tag spellings are the same rule, not two more cells.
    expect(hasSpawnGrant(doc(`tools: [! "Read,\n  # x, ${TOKEN}"]`))).toEqual({
      ok: true,
      value: true,
    });
    expect(
      hasSpawnGrant(doc(`tools: [!<tag:x> "Read,\n  # x, ${TOKEN}"]`)),
    ).toEqual({ ok: true, value: true });
    expect(
      hasSpawnGrant(doc(`tools: {k: !!str "Read,\n  # x, ${TOKEN}"}`)),
    ).toEqual({ ok: true, value: true });

    // AND THE PROPERTY RULE NEVER CREATES A NODE START WHERE THERE IS NONE — it only declines to
    // clear one. These are the plain-scalar controls that would go wrong if it did, and their values
    // are byte-identical to the pre-D-51 build's.
    expect(toolsOf(doc(`tools: R&D, it's !important`))).toBe(
      "R&D, it's !important",
    );
    expect(toolsOf(doc(`tools: Read,\n  R&D "x,\n  # y, ${TOKEN}"`))).toBe(
      'Read, R&D "x,',
    );
  });

  it("D-51 red-team — no FLOW-CONTEXT node start YAML defines returns the SILENT no-grant arm, over a set DERIVED from § 7.4's productions", () => {
    // (27-49, WR-02 / D-56 item 2) THE TITLE NAMES ITS BOUND, AND THE BOUND IS WHY. The disposition
    // here is DERIVE — the contexts below come from YAML's grammar rather than from a hand list —
    // and the derivation covers YAML's FLOW context. The title used to say "no mid-line node start
    // YAML defines", which is WIDER than any flow-context derivation can be: the block mapping
    // separator, the compact nested sequence, the block explicit key and the block mapping inside a
    // sequence item are mid-line node starts YAML defines too, and they are CR-01 families A, B, F
    // and D. Deriving the flow half and leaving the wider title standing would have been WR-02
    // repeated one level out — a universal claim over a set that does not contain its own
    // counterexamples — so the quantifier is scoped to what the evidence supports.
    //
    // WHERE THE BLOCK-CONTEXT HALF LIVES, NAMED HERE AND NAMED THERE. Those four families are
    // members of the D-52 GENERATED corpus's key-line axis, where a real YAML 1.2 loader — not this
    // file — decides the answer for each cell: see `D-52 loader differential` and, for the mechanism
    // that keeps them there, `WR-01 the expressibility floor`, which derives the module's own ledger
    // at run time and fails by name if a ledger family stops being buildable. The reciprocal
    // pointer is written at the seven new key-line members, because a relocation stated in only one
    // place is a hand-off that will be lost.
    //
    // THE EXPECTATION IS STATED FROM YAML AND NOT FROM THE MODULE. Inside a quoted scalar every
    // character is content (YAML 1.2 § 7.3), so a token behind a `#` on the continuation line always
    // survives. The module may therefore GRANT it, or REFUSE the document loudly under its declared
    // anchor/alias policy (D-30) — but `{ok:true,value:false}` over a document that plainly carries
    // the token is this module's founding failure and is the ONE outcome forbidden here.
    //
    // (27-49, WR-02 / D-56 item 2) THE TITLE'S UNIVERSAL QUANTIFIER NOW HAS A DERIVATION UNDER IT.
    // Its evidence used to be a hand-listed array of 21 prefixes — measured from the committed
    // source, not taken from the review, which stated eleven — with no derivation, no cardinality
    // pin and no statement of what set it enumerated. The claim it carried was FALSE: the array
    // tracked reported spellings, so it held the explicit-key indicator WITHOUT a space and not the
    // JSON-adjacent mapping separator one character away, and CR-01's families C and H both returned
    // the silent arm. The literal list is DELETED, not kept beside the derivation. What the contexts
    // enumerate is declared at `FLOW_NODE_START_PRODUCTIONS` above, and the cardinality is asserted
    // two-sided below against the product of its three lists.
    const CONTEXTS = FLOW_NODE_START_CONTEXTS;
    const QUOTES: readonly (readonly [string, string])[] = [
      ["double", '"'],
      ["single", "'"],
    ];

    let swept = 0;
    const silent: string[] = [];
    for (const context of CONTEXTS) {
      for (const [qLabel, q] of QUOTES) {
        const where = `${context.label} | ${qLabel}-quoted`;
        const text = doc(
          `tools: ${context.open}${q}Read,\n  # x, ${TOKEN}${q}${context.close}`,
        );
        const verdict = hasSpawnGrant(text);
        swept += 1;
        if (verdict.ok && verdict.value === false) silent.push(where);
      }
    }
    expect(
      silent,
      `mid-line node starts returning the SILENT no-grant arm over a live grant (${swept} cell(s) swept):\n${silent.join("\n")}`,
    ).toEqual([]);
    // BOTH DERIVED COUNT ASSERTIONS SURVIVE, so the sweep still cannot pass by being empty — and a
    // THIRD is added, two-sided against the product of the three declared lists, so the derivation
    // cannot shrink under a universal title.
    expect(swept).toBe(CONTEXTS.length * QUOTES.length);
    expect(swept).toBeGreaterThan(0);
    expect(
      CONTEXTS.length,
      `the derived context count must equal the product of the enumerated productions (${FLOW_NODE_START_PRODUCTIONS.length}), the node properties (${FLOW_NODE_PROPERTIES.length}) and the nesting depths (${FLOW_NESTINGS.length})`,
    ).toBe(
      FLOW_NODE_START_PRODUCTIONS.length *
        FLOW_NODE_PROPERTIES.length *
        FLOW_NESTINGS.length,
    );
    // Every derived context is distinct, so a collision cannot make two look like one.
    expect(new Set(CONTEXTS.map((c) => c.label)).size).toBe(CONTEXTS.length);
    // THE COUNTEREXAMPLES THAT FALSIFIED THE OLD CLAIM ARE MEMBERS, asserted rather than assumed.
    // Measured against a `git archive` mirror of 62b8b53 (pre-27-47): 72 of these cells returned the
    // silent no-grant arm and EVERY ONE was a JSON-adjacent mapping separator — families C and H.
    // Against this build, 0. Transcripts in 27-49-SUMMARY.md.
    for (const spelling of [
      "flow mapping separator, JSON-adjacent",
      "flow mapping separator, JSON-adjacent after a space",
    ]) {
      expect(
        CONTEXTS.some((c) => c.label.startsWith(`${spelling} |`)),
        `${spelling}: the spelling that falsified this case's previous universal claim must be a member of the set it now stands over`,
      ).toBe(true);
    }
  });

  // ── IN-03 (D-53): THE ITEM PATH'S INVARIANT IS ASSERTED, AND THE ASSERTION CAN FIRE ────────────

  it("D-53 IN-03 — the item path's carried quote is null, and the assertion that says so is load-bearing", () => {
    // HALF ONE: the invariant holds on the real path, over the shipped idiom and over the empty-dash
    // spelling that reaches it with a NON-trivial carried state (flow depth and node-may-begin are
    // genuine reads there; only the quote component is the constant).
    expect(
      toolsOf(doc(`tools:\n  - Read\n  - "Write, ${TOKEN}"`)),
    ).toBe(`Read, Write, ${TOKEN}`);
    expect(
      hasSpawnGrant(doc(`tools:\n  - Read\n  -\n    "Write,\n    # x, ${TOKEN}"`)),
    ).toEqual({ ok: true, value: true });

    // HALF TWO: A COMMENT CLAIMING A PROPERTY NEVER SHIPS WITHOUT THE ASSERTION THAT MAKES IT TRUE —
    // and an assertion that cannot fire is not an assertion. The violating state is constructed here
    // directly, because it is unreachable through any document by construction; that unreachability
    // is the invariant, not a reason to leave it unchecked.
    expect(() =>
      assertItemPathScalarClosed(
        { openQuote: '"', flowDepth: 0, nodeMayBegin: true },
        '- "Write,',
      ),
    ).toThrow(/internal invariant violated at the block-sequence item path/);
    expect(() =>
      assertItemPathScalarClosed(
        { openQuote: "'", flowDepth: 2, nodeMayBegin: false },
        "- 'Write,",
      ),
    ).toThrow(/still open/);
    // And it stays SILENT on every state the path can actually be in — an assertion that fires on a
    // legal state would be a false red in the loudest possible form.
    expect(() =>
      assertItemPathScalarClosed(
        { openQuote: null, flowDepth: 3, nodeMayBegin: true },
        "- Write",
      ),
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (Plan 27-47, D-54 — 27-REVIEW-GAPS-8 § CR-01, round 9) THE NODE-START ANSWER IS A PROPERTY OF THE
// STRUCTURAL POSITION, NOT OF THE SPELLINGS A RED TEAM ENUMERATED.
//
// D-51 made the walk the module's ONE authority on what crosses a line boundary, and that was right.
// What it got wrong is which positions the authority calls node starts: `mayBegin` was raised only
// for FLOW constructs, and only where `depth > 0`. YAML gates none of those three indicators that
// way, so the union of the chain's arms was — for the ninth time in this phase, about the ninth
// predicate — not the set of YAML's node starts.
//
// EVERY ROW BELOW WAS MEASURED AGAINST THE COMMITTED BUILD, NOT REASONED. Each carries the verdict
// the pre-D-54 `scripts/frontmatter.js` returned on a `git archive HEAD` mirror BEFORE the edit
// (RED) and the loader's value from `/usr/bin/ruby -ryaml` (Ruby 2.6.10 / Psych 3.1.0 /
// libyaml 0.2.1). The transcripts are recorded verbatim in 27-47-SUMMARY.md. Four of these rows also
// took the WHOLE foundation gate from `ALL CHECKS PASSED` at exit 0 to a named failure, planted on
// both distribution twins of a non-coordinator skill; that movement is the acceptance evidence and
// this suite is a floor beneath it, never a substitute for it.
describe("frontmatter — D-54: the node start is a structural position (CR-01, round 9)", () => {
  const TOKEN = "Agent(grugops-orchestrator)";
  const doc = (region: string): string =>
    `---\nname: probe\n${region}\n---\nBody.\n`;
  const toolsOf = (text: string): string => {
    const parsed = parseFrontmatter(text);
    return parsed.ok ? (parsed.value.get("tools") ?? []).join("|") : "REFUSED";
  };

  // ── THE MAPPING SEPARATOR IS A NODE START IN BLOCK CONTEXT TOO (D-54 point 1) ──────────────────

  it("D-54 row A — a nested block mapping on a continuation line: `tools:` / `  nested: \"Read,` / `  # x, TOKEN\"`", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["nested: \"Read,"]
    // libyaml:                   {"nested"=>"Read, # x, Agent(grugops-orchestrator)"}
    const text = doc(`tools:\n  nested: "Read,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`nested: "Read, # x, ${TOKEN}"`);
  });

  it("D-54 row E — the block mapping nested TWO levels: `  a:` then `    b: \"Read,`", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["a: b: \"Read,"]
    // libyaml:                   {"a"=>{"b"=>"Read, # x, Agent(grugops-orchestrator)"}}
    const text = doc(`tools:\n  a:\n    b: "Read,\n    # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`a: b: "Read, # x, ${TOKEN}"`);
  });

  it("D-54 row D — a block mapping INSIDE a sequence item: `  - a: \"Read,`", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["a: \"Read,,"]  <- note the doubled
    //           comma: the item join separator flipped for the whole key, inventing structure the
    //           document never expressed, which in the KIT-03 closure equality is an invented NAME.
    // libyaml:  [{"a"=>"Read, # x, Agent(grugops-orchestrator)"}]
    const text = doc(`tools:\n  - a: "Read,\n    # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`a: "Read, # x, ${TOKEN}"`);
    expect(toolsOf(text)).not.toContain(",,");
  });

  // ── THE JSON-LIKE SEPARATION RULE (D-54 point 2) ───────────────────────────────────────────────

  it("D-54 row C — flow mapping with JSON adjacency: `tools: {\"a\":\"Read,` (no space after the colon)", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["{\"a\":\"Read,"]
    // libyaml:                   {"a"=>"Read, # x, Agent(grugops-orchestrator)"}
    //
    // THE SHARPEST OF THE ROUND-9 ROWS: it is inside the flow-collection domain D-51 was written to
    // own. `D-51 row b2` pins `tools: {a: "Read,` — one space away — and nothing pinned this.
    const text = doc(`tools: {"a":"Read,\n  # x, ${TOKEN}"}`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`{"a":"Read, # x, ${TOKEN}"}`);
  });

  it("D-54 row H — whitespace BEFORE the separator does not clear the JSON-like fact: `{\"a\" :\"Read,`", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["{\"a\" :\"Read,"]
    // libyaml:                   {"a"=>"Read, # x, Agent(grugops-orchestrator)"}
    //
    // This is why `jsonLikeKeyJustClosed` is deliberately NOT cleared by a space or a tab: the key
    // has still just closed, and the loader reads the entry either way.
    const text = doc(`tools: {"a" :"Read,\n  # x, ${TOKEN}"}`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`{"a" :"Read, # x, ${TOKEN}"}`);
  });

  it("D-54 row C2 — the same adjacency one collection deeper: `tools: [{\"a\":\"Read,`", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["[{\"a\":\"Read,"]
    // libyaml:                   [{"a"=>"Read, # x, Agent(grugops-orchestrator)"}]
    const text = doc(`tools: [{"a":"Read,\n  # x, ${TOKEN}"}]`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`[{"a":"Read, # x, ${TOKEN}"}]`);
  });

  it("D-54 adjacency control — a CONTENT character between the closing quote and the separator is not an entry, and the loader agrees it is not a document", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["{\"a\"x:\"Read,"]
    // libyaml:                   REJECTS — `found unexpected ':' while scanning a plain scalar`
    //
    // THE CASE ASSERTS THE LOADER'S ANSWER, WHICHEVER IT IS, AND THE LOADER'S ANSWER IS "THIS IS NOT
    // A DOCUMENT". So there is no value to grant from and the module's no-grant answer agrees with a
    // loader that computes nothing — the one row of this table whose verdict is UNCHANGED by D-54,
    // recorded so the boundary between `{"a":` and `{"a"x:` is a measurement rather than a claim.
    const text = doc(`tools: {"a"x:"Read,\n  # x, ${TOKEN}"}`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    expect(toolsOf(text)).toBe(`{"a"x:"Read,`);
  });

  // ── THE BLOCK EXPLICIT KEY, AND THE TWO POSITIONS THAT STAY CONTENT (D-54 point 1) ─────────────

  it("D-54 row F — a block explicit key: `tools:` / `  ? \"Read,` / `  # x, TOKEN\"` / `  : v`", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["? \"Read,  : v"]
    // libyaml:                   {"Read, # x, Agent(grugops-orchestrator)"=>"v"}
    const text = doc(`tools:\n  ? "Read,\n  # x, ${TOKEN}"\n  : v`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`? "Read, # x, ${TOKEN}" : v`);
  });

  it("D-54 explicit-key boundary — the SAME character later on the line, and in a KEY LINE's value position, stays content", () => {
    // BOUNDARY ONE — the structural start is spent. libyaml: `tools:` / `  a ? "Read,` /
    // `  # x, T"` loads as the plain scalar `a ? "Read,` with the hash line taken as a COMMENT, so
    // the quote is content and nothing crosses. The module must agree, and does.
    const spent = doc(`tools:\n  a ? "Read,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(spent)).toEqual({ ok: true, value: false });
    expect(toolsOf(spent)).toBe(`a ? "Read,`);

    // BOUNDARY TWO — the key line's VALUE position. `KEY_LINE` has already consumed `description:`,
    // so `lineStartAtOffsetZero` is false there and the `?` is ordinary text. Its value is
    // byte-identical to the pre-D-54 build's.
    //
    // AND THE OLD COMMENT'S FALSE-RED ARGUMENT IS CORRECTED HERE RATHER THAN REPEATED: it offered
    // `description: ? maybe` as documentation "a loader accepts", and libyaml in fact REJECTS that
    // whole document (`mapping keys are not allowed in this context`). The position is kept for the
    // reason that survives measurement — the line did not begin there.
    const keyLine = doc(`description: ? maybe`);
    const parsed = parseFrontmatter(keyLine);
    expect(parsed.ok && parsed.value.get("description")).toEqual(["? maybe"]);

    // BOUNDARY THREE — a separation is REQUIRED after the indicator. libyaml reads `?"Read,` as the
    // plain scalar `?"Read,` and the following hash line as a comment.
    const noSpace = doc(`tools:\n  ?"Read,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(noSpace)).toEqual({ ok: true, value: false });
    expect(toolsOf(noSpace)).toBe(`?"Read,`);
  });

  it("D-54 continuation control — a line CONTINUING a scalar is not a structural start, so the module does not grant where the loader has none", () => {
    // THE NEVER-EXEMPTIBLE DIRECTION, PINNED AT THE PLACE THE FIX COULD HAVE OPENED IT. The plan's
    // first reading had both continuation sites pass `true` for the line-start fact. Measured:
    //   libyaml `description: see` / `  ? maybe`            -> "see ? maybe"   (the `?` is CONTENT)
    //   libyaml `description: see` / `  ? "quoted` / `  # x, T"`
    //                                                       -> "see ? \"quoted"  (hash line is a
    //                                                          COMMENT; nothing crosses)
    // An unconditional `true` would have made this module report a GRANT on the second document
    // where the loader has none. `startsNode` is passed instead, and these are the pins.
    expect(
      parseFrontmatter(doc(`description: see\n  ? maybe`)),
    ).toMatchObject({ ok: true });
    const cont = doc(`description: see\n  ? "quoted\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(cont)).toEqual({ ok: true, value: false });
    const contParsed = parseFrontmatter(cont);
    expect(contParsed.ok && contParsed.value.get("description")).toEqual([
      `see ? "quoted`,
    ]);
  });

  // ── THE CHAIN DID NOT GROW, AND THE PLAIN-SCALAR CONTROLS DID NOT MOVE ─────────────────────────

  it("D-54 plain-scalar controls — the widening never CREATES a node start in ordinary prose", () => {
    // Byte-identical to the pre-D-54 build, quoted from both in 27-47-SUMMARY.md. These are the
    // shapes a widened node-start rule breaks first if it is wrong.
    expect(toolsOf(doc(`tools: R&D, it's !important`))).toBe(
      "R&D, it's !important",
    );
    expect(toolsOf(doc(`tools: Read,\n  don't\n  Write`))).toBe(
      "Read, don't Write",
    );
    expect(toolsOf(doc(`tools:\n  - Read\n  - Write`))).toBe("Read, Write");
    expect(toolsOf(doc(`tools: Read,\n  - Write`))).toBe("Read, - Write");
  });

  // ── A DASH CONSUMES EXACTLY ONE LEVEL (D-54 point 3) ──────────────────────────────────────────

  it("D-54 row B — a compact nested sequence: `tools:` / `  - - \"Read,` / `    # x, TOKEN\"`", () => {
    // pre-D-54 committed build: {ok:true,value:false}, tools=["- \"Read,,"]  <- the leading dash was
    //           consumed as CONTENT of the item, so the quote after it opened at a non-node-start,
    //           and the doubled comma is structure the document never expressed.
    // libyaml:  [["Read, # x, Agent(grugops-orchestrator)"]]
    //
    // THE FLATTENED VALUE IS NOT THE LOADER'S NESTED VALUE, AND THAT IS THE CONTRACT, NOT A MISS.
    // This module flattens to a TOKEN-PRESENCE surface — one string per occurrence — so that one
    // token test serves every YAML form; the loader returns `[["…"]]`. The agreed predicate is token
    // presence, and the difference is recorded in 27-47-SUMMARY.md as data.
    const text = doc(`tools:\n  - - "Read,\n    # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(toolsOf(text)).toBe(`Read, # x, ${TOKEN}`);
    expect(toolsOf(text)).not.toContain(",,");

    // One more level is the SAME rule re-entered once more, not a second case for a second spelling.
    const three = doc(`tools:\n  - - - "Read,\n      # x, ${TOKEN}"`);
    expect(hasSpawnGrant(three)).toEqual({ ok: true, value: true });
  });

  it("D-54 compact-sequence termination — `- -` terminates on the EXISTING item regex failing to match", () => {
    // libyaml: `tools:` / `  - -` loads as [[nil]] — a sequence whose one item is a sequence whose
    // one item is empty. The re-entry must reach that empty text and STOP rather than loop.
    //
    // THE TERMINATING CONDITION IS ASSERTED, NOT ASSUMED. `SEQ_ITEM` is anchored on a leading `-`
    // (`/^-(?:[ \t]+(.*))?$/`), so it cannot match the empty string; every iteration removes at least
    // that dash, so the text strictly shrinks and the loop is bounded by the line's length.
    expect(SEQ_ITEM.test("")).toBe(false);
    expect(SEQ_ITEM.test("-")).toBe(true);
    // The parse COMPLETES — a verdict, not a timeout.
    const empty = doc(`tools:\n  - -`);
    expect(hasSpawnGrant(empty)).toEqual({ ok: true, value: false });
    expect(toolsOf(empty)).toBe("");

    // AND A LEADING DASH THAT IS NOT AN ITEM MARKER IS UNTOUCHED, for the same reason it always was:
    // no whitespace and no end-of-line follows the first dash, so the regex does not match.
    expect(toolsOf(doc(`tools:\n  - -5`))).toBe("-5");
    expect(toolsOf(doc(`tools:\n  - --flag`))).toBe("--flag");
  });

  it("D-54 block-sequence controls — the shipped idioms do not move", () => {
    // Byte-identical to the pre-D-54 build, quoted from both in 27-47-SUMMARY.md.
    expect(toolsOf(doc(`tools:\n  - Read\n  - Write`))).toBe("Read, Write");
    // The key line carried a value, so the dash there is TEXT and no item boundary exists —
    // libyaml agrees: `tools: Read,` / `  - Write` loads as the single scalar `Read, - Write`.
    expect(toolsOf(doc(`tools: Read,\n  - Write`))).toBe("Read, - Write");
  });

  // ── THE TWO-DIRECTIONAL ADJUDICATION: THE WIDENING IS MEASURED, NOT ARGUED ────────────────────

  it("D-54 loader adjudication — over a GENERATED corpus, no cell exists where the module grants and the loader does not, nor where the module is silent and the loader grants", () => {
    // WHY THIS EXISTS AND WHY IT IS NOT THE D-52 HARNESS. D-52's axes are scalar STYLE x sigil x
    // placement; every position D-54 touches — a block mapping separator, a compact nested sequence,
    // a block explicit key, a JSON-adjacent flow separator — is outside them, which is precisely why
    // a 312-cell green differential shipped over this bypass. The axes below are the positions THIS
    // plan changed, crossed with the two quoting styles and with the token behind a hash and in plain
    // sight, so both directions of the change are visible.
    //
    // MEASURED, BOTH BUILDS (transcripts in 27-47-SUMMARY.md):
    //   pre-D-54 committed build, mirror of 62b8b53 : 20 cells MODULE-SILENT / LOADER-GRANTS
    //   rebuilt build                               :  0
    // and 0 in the module-grants/loader-does-not direction on BOTH, so the widening did not open the
    // opposite unsafe direction. A green suite is a floor; those two numbers are the claim.
    const AXIS_SHAPE: readonly (readonly [string, (q: string, m: string) => string[]])[] = [
      ["block mapping on a continuation line, indent 2", (q, m) =>
        ["tools:", `  nested: ${q}Read,`, `  ${m}${TOKEN}${q}`]],
      ["block mapping on a continuation line, indent 4", (q, m) =>
        ["tools:", `    nested: ${q}Read,`, `    ${m}${TOKEN}${q}`]],
      ["block mapping nested two levels", (q, m) =>
        ["tools:", "  a:", `    b: ${q}Read,`, `    ${m}${TOKEN}${q}`]],
      ["block sequence item, one dash", (q, m) =>
        ["tools:", `  - ${q}Read,`, `    ${m}${TOKEN}${q}`]],
      ["compact nested sequence, two dashes", (q, m) =>
        ["tools:", `  - - ${q}Read,`, `    ${m}${TOKEN}${q}`]],
      ["compact nested sequence, three dashes", (q, m) =>
        ["tools:", `  - - - ${q}Read,`, `      ${m}${TOKEN}${q}`]],
      ["block mapping inside a sequence item", (q, m) =>
        ["tools:", `  - a: ${q}Read,`, `    ${m}${TOKEN}${q}`]],
      ["block explicit key", (q, m) =>
        ["tools:", `  ? ${q}Read,`, `  ${m}${TOKEN}${q}`, "  : v"]],
      ["flow mapping, JSON adjacency, no space", (q, m) =>
        [`tools: {"a":${q}Read,`, `  ${m}${TOKEN}${q}}`]],
      ["flow mapping, JSON adjacency, space before the separator", (q, m) =>
        [`tools: {"a" :${q}Read,`, `  ${m}${TOKEN}${q}}`]],
      ["flow mapping, space after the separator (the D-51 control)", (q, m) =>
        [`tools: {a: ${q}Read,`, `  ${m}${TOKEN}${q}}`]],
      ["flow sequence of a flow mapping, JSON adjacency", (q, m) =>
        [`tools: [{"a":${q}Read,`, `  ${m}${TOKEN}${q}}]`]],
      // THE CONTROLS — positions that must NOT become node starts. Each is a place the widening
      // could have overreached, and each is adjudicated by the loader rather than by an expectation.
      ["CONTROL a line CONTINUING a plain scalar begun on the key line", (q, m) =>
        ["tools: Read,", `  ? ${q}Write,`, `  ${m}${TOKEN}${q}`]],
      ["CONTROL the line's structural start already spent", (q, m) =>
        ["tools:", `  a ? ${q}Read,`, `  ${m}${TOKEN}${q}`]],
      ["CONTROL no separation after the explicit-key indicator", (q, m) =>
        ["tools:", `  ?${q}Read,`, `  ${m}${TOKEN}${q}`]],
      ["CONTROL a content character before the mapping separator", (q, m) =>
        [`tools: {"a"x:${q}Read,`, `  ${m}${TOKEN}${q}}`]],
    ];
    const AXIS_QUOTE: readonly (readonly [string, string])[] = [
      ["double", '"'],
      ["single", "'"],
    ];
    const AXIS_TOKEN: readonly (readonly [string, string])[] = [
      ["token behind a hash", "# x, "],
      ["token in plain sight", "x, "],
    ];

    // FLOORS AGAINST AN AXIS EMPTIED BY A LATER EDIT — not a completeness claim. What makes the
    // coverage checkable is that every cell's expected answer comes from the loader below.
    expect(AXIS_SHAPE.length).toBeGreaterThan(10);
    expect(AXIS_QUOTE.length).toBe(2);
    expect(AXIS_TOKEN.length).toBe(2);

    // THE CELL TOTAL IS DERIVED. No cell-count literal appears in this block except as the
    // right-hand side of this comparison.
    const CELLS = AXIS_SHAPE.length * AXIS_QUOTE.length * AXIS_TOKEN.length;
    const cells: { where: string; region: string }[] = [];
    for (const [sLabel, build] of AXIS_SHAPE)
      for (const [qLabel, q] of AXIS_QUOTE)
        for (const [mLabel, m] of AXIS_TOKEN)
          cells.push({
            where: `${sLabel} | ${qLabel}-quoted | ${mLabel}`,
            region: `${["name: x", ...build(q, m)].join("\n")}\n`,
          });
    expect(cells.length).toBe(CELLS);
    expect(new Set(cells.map((c) => c.where)).size).toBe(CELLS);
    // The loader is handed the REGION and the module the whole DOCUMENT, so a cell carrying its own
    // `---` line would silently hand them different text — round 6's lesson, applied here too.
    expect(
      cells
        .filter((c) => c.region.split("\n").some((l) => l.trimEnd() === "---"))
        .map((c) => c.where),
    ).toEqual([]);

    let loaderVersion: string;
    try {
      loaderVersion = execFileSync(
        "/usr/bin/ruby",
        [
          "-ryaml",
          "-e",
          "print \"ruby=#{RUBY_VERSION} psych=#{Psych::VERSION} libyaml=#{Psych.libyaml_version.join('.')}\"",
        ],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
    } catch {
      console.warn(
        `SKIPPED D-54 loader adjudication: /usr/bin/ruby with the yaml (Psych/libyaml) library is not runnable on this machine. This is a PRINTED skip, never a silent one — the ${CELLS}-cell corpus was enumerated and no expectation was invented in the loader's absence.`,
      );
      return;
    }

    // ONE PROCESS PER RUN, NOT ONE PER CELL — and the returned length is asserted, so a truncated
    // batch fails arithmetically instead of silently shortening the adjudication.
    const raw = execFileSync(
      "/usr/bin/ruby",
      [
        "-e",
        [
          "require 'yaml'; require 'json'",
          "out = JSON.parse(STDIN.read).map do |d|",
          "  begin",
          "    y = YAML.safe_load(d)",
          "    v = y.is_a?(Hash) ? y['tools'] : nil",
          "    { 'accepted' => true, 'value' => v.nil? ? '' : v.to_s }",
          "  rescue Exception => e",
          "    { 'accepted' => false, 'error' => e.class.to_s }",
          "  end",
          "end",
          "print JSON.generate(out)",
        ].join("\n"),
      ],
      {
        input: JSON.stringify(cells.map((c) => c.region)),
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    const verdicts = JSON.parse(raw) as {
      accepted: boolean;
      value?: string;
      error?: string;
    }[];
    expect(verdicts.length).toBe(CELLS);

    let rejected = 0;
    const rejectedButModuleGrants: string[] = [];
    const grantsLoaderDoesNot: string[] = [];
    const silentWhileLoaderGrants: string[] = [];
    const refusals: string[] = [];

    cells.forEach((cell, i) => {
      const v = verdicts[i];
      const answer = hasSpawnGrant(`---\n${cell.region}---\nBody.\n`);
      // THREE MODULE VERDICTS AND NOT TWO — a refusal is never folded into the no-grant column.
      const moduleVerdict = answer.ok
        ? answer.value
          ? "grant"
          : "no-grant"
        : "refuse";
      if (!v.accepted) {
        // A DOCUMENT THE LOADER CANNOT READ HAS NO VALUE TO AGREE WITH, so it is counted and printed
        // on its own rather than folded into either direction. The module granting on one of them is
        // the fail-red direction over content no platform will load; it is REPORTED, not asserted.
        rejected += 1;
        if (moduleVerdict === "grant")
          rejectedButModuleGrants.push(`${cell.where}\t${v.error}`);
        return;
      }
      const loaderVerdict = (v.value ?? "").includes(TOKEN) ? "grant" : "no-grant";
      if (moduleVerdict === "refuse") {
        refusals.push(`${cell.where}\tloader=${loaderVerdict}`);
        return;
      }
      if (moduleVerdict === "grant" && loaderVerdict === "no-grant")
        grantsLoaderDoesNot.push(
          `${cell.where}\tloader value=${JSON.stringify(v.value)}`,
        );
      if (moduleVerdict === "no-grant" && loaderVerdict === "grant")
        silentWhileLoaderGrants.push(
          `${cell.where}\tloader value=${JSON.stringify(v.value)}`,
        );
    });

    console.log(
      `D-54 loader adjudication — loader ${loaderVersion} | cells ${CELLS} (${AXIS_SHAPE.length} x ${AXIS_QUOTE.length} x ${AXIS_TOKEN.length}) | loader-rejected ${rejected} (module grants on ${rejectedButModuleGrants.length}) | module-refuses ${refusals.length} | grants-loader-does-not ${grantsLoaderDoesNot.length} | silent-while-loader-grants ${silentWhileLoaderGrants.length}`,
    );

    // THE DIRECTION A WIDENING CAN NEWLY BREAK. Never exemptible; a member here is a defect in this
    // fix and not a finding to record.
    expect(
      grantsLoaderDoesNot,
      `cells where the MODULE GRANTS and the loader does not (${grantsLoaderDoesNot.length}):\n${grantsLoaderDoesNot.join("\n")}`,
    ).toEqual([]);
    // AND THE DIRECTION THIS WHOLE PHASE EXISTS TO CLOSE. 20 members against the pre-D-54 build.
    expect(
      silentWhileLoaderGrants,
      `cells where the MODULE IS SILENT and the loader GRANTS — this module's founding failure (${silentWhileLoaderGrants.length}):\n${silentWhileLoaderGrants.join("\n")}`,
    ).toEqual([]);
  });

  // ── WITHIN-LINE BEHAVIOUR, MEASURED RATHER THAN PROMISED ───────────────────────────────────────

  it("D-54 single-line differential — the scanner's TEXT moves in exactly ONE measured place, in the fail-red direction", () => {
    // WHAT THIS FIXTURE IS. A capture of the pre-D-54 committed `scripts/frontmatter.js`, taken on a
    // `git archive HEAD` mirror BEFORE the edit, over a generated single-line corpus whose alphabet
    // is WIDER than the pre-D-51 capture's — it carries `?`, a bare `:`, `!`, `&`, `<` and `>`,
    // because a corpus without them could not see the change it is supposed to be measuring.
    //
    // IF THIS CASE GOES RED, THE FIXTURE IS NOT THE THING TO REGENERATE. Regenerating it from the
    // current build makes the assertion say "the build equals itself".
    //
    // AND THE CLAIM IT MAKES IS NOT "BYTE-IDENTICAL", BECAUSE THE MEASUREMENT SAYS OTHERWISE. Four
    // cells out of 148,656 move, all on the single input `a: !<x #y> z`, all at flow depth 0, and
    // every one of them moves in the LENGTHEN direction (the pre value is a strict PREFIX of the post
    // value) — text a `#` used to end is now kept, so a token behind that hash becomes MORE visible,
    // never less. libyaml REJECTS that document outright (`did not find the expected '>' while
    // scanning a tag`), so no loader value is contradicted. See `NODE_PROPERTY_AT_NODE_START` for
    // the narrowing that would remove these four cells and the twenty worse ones it opens.
    const fixture = JSON.parse(
      readFileSync(
        join(import.meta.dirname, "fixtures", "frontmatter-singleline-pre-d54.json"),
        "utf8",
      ),
    ) as {
      entering: (string | null)[];
      depths: number[];
      mayBegin: boolean[];
      lineStart: boolean[];
      inputs: string[];
      shortened: Record<string, string[]>;
    };

    // NO CORPUS SIZE IS WRITTEN INTO AN ASSERTION. Both numbers below are derived in this run; the
    // floors exist only so a fixture emptied by a later edit cannot make this pass vacuously.
    const states =
      fixture.entering.length *
      fixture.depths.length *
      fixture.mayBegin.length *
      fixture.lineStart.length;
    expect(fixture.inputs.length, "captured corpus must not be empty").toBeGreaterThan(500);
    expect(states, "captured entering states").toBeGreaterThan(0);

    let compared = 0;
    const moved: string[] = [];
    const movedInputs = new Set<string>();
    const notLengthened: string[] = [];
    fixture.inputs.forEach((input, idx) => {
      // AN INPUT ABSENT FROM `shortened` IS ONE THE PRE-EDIT SCANNER RETURNED UNCHANGED IN EVERY
      // STATE. The sparse form is lossless: it is expanded back to the input here, so a post-edit
      // build that shortens a previously-unchanged input still lands in `moved`.
      const pre = fixture.shortened[String(idx)];
      let k = 0;
      for (const q of fixture.entering)
        for (const flowDepth of fixture.depths)
          for (const nodeMayBegin of fixture.mayBegin)
            for (const lineStart of fixture.lineStart) {
              const got = stripComment(
                input,
                {
                  openQuote: q as '"' | "'" | null,
                  flowDepth,
                  nodeMayBegin,
                },
                nodeMayBegin,
                lineStart,
              ).text;
              const was = pre === undefined ? input : pre[k];
              compared += 1;
              k += 1;
              if (got !== was) {
                moved.push(
                  `${JSON.stringify(input)} entering=${JSON.stringify(q)} depth=${flowDepth} mayBegin=${nodeMayBegin} lineStart=${lineStart}: pre=${JSON.stringify(was)} post=${JSON.stringify(got)}`,
                );
                movedInputs.add(input);
                if (!got.startsWith(was)) notLengthened.push(input);
              }
            }
    });

    // THE EXCEPTION IS NAMED, NOT SWEPT. The set of inputs whose text moved is compared to exactly
    // the one shape the loader rejects; a second shape appearing here fails by name.
    expect(
      [...movedInputs].sort(),
      `within-line TEXT differential over ${fixture.inputs.length} input(s) x ${states} state(s) = ${compared} comparison(s); ${moved.length} cell(s) moved:\n${moved.slice(0, 20).join("\n")}`,
    ).toEqual(["a: !<x #y> z"]);
    // AND THE DIRECTION IS ASSERTED, because the direction is the whole safety argument.
    expect(
      notLengthened,
      "a moved cell whose post value is NOT an extension of its pre value — text was DELETED, which is this module's founding failure",
    ).toEqual([]);
    // Both numbers derived in this same run — never one derived and one written down.
    expect(compared).toBe(fixture.inputs.length * states);
  });

  // ── (27-51, IN-02 / 27-REVIEW § IN-02) THE OTHER HALF OF `stripComment`'S CONTRACT ─────────────

  it("IN-02 single-line differential — the scanner's returned STATE is compared against a pre-fix capture, and every move RECOVERS a scalar's provenance rather than losing one", () => {
    // WHY THIS CASE EXISTS. `stripComment` returns a PAIR — `{ text, state }` — and until this round
    // every shipped differential over it asserted only `text`. CR-01 corrupted `state.openQuote`
    // while leaving `text` byte-identical for EVERY input, which is precisely why 87 KB and 98 KB of
    // fixture and nine rounds of green cases walked past it. Half the function's contract had no
    // differential at all, so the exact field the defect moved was unasserted BY CONSTRUCTION.
    //
    // WHERE THE `state` BASELINE COMES FROM, AND WHY THAT MATTERS MORE THAN THE ASSERTION. It was
    // captured from a hermetic `git archive` mirror of the PRE-fix commit, over THIS fixture's own
    // corpus, before the edit landed. Regenerating it from the current build would make this case say
    // "the build equals itself" — the failure mode the sibling case one screen up warns about in the
    // same words. IF THIS GOES RED, THE FIXTURE IS NOT THE THING TO REGENERATE.
    //
    // THE COMPACT FORM IS LOSSLESS AND DELIBERATE. Six thousand inputs x 24 entering states is 148,656
    // cells; the capture stores each input's 24-cell vector as one comma-joined string and de-duplicates
    // those vectors, which is why 6,194 rows compress to a few hundred distinct ones. Each cell is
    // `<openQuote or "-"><flowDepth><nodeMayBegin as 1/0>`, so the quote is the FIRST character, the
    // node-may-begin answer is the LAST, and the depth is everything between — unambiguous at any depth.
    const fixture = JSON.parse(
      readFileSync(
        join(import.meta.dirname, "fixtures", "frontmatter-singleline-pre-d54.json"),
        "utf8",
      ),
    ) as {
      entering: (string | null)[];
      depths: number[];
      mayBegin: boolean[];
      lineStart: boolean[];
      inputs: string[];
      state: { vectors: string[]; rows: number[] };
    };
    expect(
      fixture.state,
      "the pre-fix STATE capture must be present — without it this case asserts nothing",
    ).toBeDefined();
    expect(fixture.state.rows.length).toBe(fixture.inputs.length);

    const states =
      fixture.entering.length *
      fixture.depths.length *
      fixture.mayBegin.length *
      fixture.lineStart.length;
    const code = (st: {
      openQuote: string | null;
      flowDepth: number;
      nodeMayBegin: boolean;
    }): string =>
      `${st.openQuote === null ? "-" : st.openQuote}${st.flowDepth}${st.nodeMayBegin ? 1 : 0}`;
    const quoteOf = (cell: string): string => cell[0];

    let compared = 0;
    const moved: string[] = [];
    const movedInputs = new Set<string>();
    // THE ONLY DIRECTION THAT IS A DEFECT: a scalar whose provenance the PRE build carried and the
    // POST build drops. That is the silent-no-grant arm being re-opened, and no reason exempts it.
    const provenanceLost: string[] = [];
    // ...and the direction this fix is FOR, counted so the case is visibly non-vacuous.
    let provenanceRecovered = 0;

    fixture.inputs.forEach((input, idx) => {
      const pre = fixture.state.vectors[fixture.state.rows[idx]].split(",");
      expect(pre.length, `pre-fix capture for input ${idx}`).toBe(states);
      let k = 0;
      for (const q of fixture.entering)
        for (const flowDepth of fixture.depths)
          for (const nodeMayBegin of fixture.mayBegin)
            for (const lineStart of fixture.lineStart) {
              const got = stripComment(
                input,
                {
                  openQuote: q as '"' | "'" | null,
                  flowDepth,
                  nodeMayBegin,
                },
                nodeMayBegin,
                lineStart,
              ).state;
              const was = pre[k];
              const now = code(got);
              compared += 1;
              k += 1;
              if (now === was) continue;
              moved.push(
                `${JSON.stringify(input)} entering=${JSON.stringify(q)} depth=${flowDepth} mayBegin=${nodeMayBegin} lineStart=${lineStart}: pre=${was} post=${now}`,
              );
              movedInputs.add(input);
              if (quoteOf(was) !== "-" && quoteOf(now) === "-") {
                provenanceLost.push(moved[moved.length - 1]);
              }
              if (quoteOf(was) === "-" && quoteOf(now) !== "-") {
                provenanceRecovered += 1;
              }
            }
    });

    // THE MOVED SET IS COMPARED TO A SET DERIVED FROM THE CORPUS, NEVER TO A HAND-WRITTEN LIST. The
    // family this round closed is "an input carrying YAML's doubled apostrophe", and the fixture's own
    // alphabet already contained it — the corpus GENERATED the input and the differential did not look
    // at the field that moved. So the expected set is computed from `fixture.inputs` here, which means
    // an input that starts or stops moving for any OTHER reason fails by name.
    const DOUBLED_APOSTROPHE = `${String.fromCharCode(39)}${String.fromCharCode(39)}`;
    const expectedMoved = fixture.inputs
      .filter((s) => s.includes(DOUBLED_APOSTROPHE))
      .sort();
    expect(
      [...movedInputs].sort(),
      `within-line STATE differential over ${fixture.inputs.length} input(s) x ${states} state(s) = ${compared} comparison(s); ${moved.length} cell(s) moved:\n${moved.slice(0, 20).join("\n")}`,
    ).toEqual(expectedMoved);
    // AND THE DIRECTION IS THE WHOLE SAFETY ARGUMENT, exactly as it is for the text half above.
    expect(
      provenanceLost,
      "a cell whose PRE state carried an open quote and whose POST state does not — a still-open scalar's node-start provenance was newly LOST, which is the corruption this round closed being re-opened",
    ).toEqual([]);
    // NON-VACUITY, both ways: the family really is in the corpus, and the moves really are recoveries.
    expect(
      expectedMoved.length,
      "the fixture's own alphabet must contain the doubled apostrophe, or this case is comparing nothing",
    ).toBeGreaterThan(0);
    expect(
      provenanceRecovered,
      "cells where a still-open scalar's provenance is now PRESERVED where the pre-fix build dropped it",
    ).toBeGreaterThan(0);
    expect(compared).toBe(fixture.inputs.length * states);
    console.log(
      `IN-02 STATE differential — ${fixture.inputs.length} input(s) x ${states} state(s) = ${compared} cell(s) | moved ${moved.length} cell(s) across ${movedInputs.size} input(s) | provenance RECOVERED ${provenanceRecovered} | provenance LOST ${provenanceLost.length}`,
    );
  });

  // ── (27-51, IN-02) THE D-51 SIBLING FIXTURE CARRIES NO STATE, AND THAT IS SAID RATHER THAN HIDDEN ──
  //
  // The plan asked for the same `state` half on the D-51 differential IF its fixture already carried
  // the states it would need. IT DOES NOT: `frontmatter-singleline-pre-d51.json` was captured with a
  // `shortened` half only, and the build it was captured from no longer exists, so a `state` half
  // there could only be filled from a LATER build — which is the "the build equals itself" tautology
  // this file rejects by name one screen up. Covering half and saying nothing is how a coverage claim
  // becomes decoration, so the gap is asserted as a FACT about the fixture instead of left silent.
  it("IN-02 residual — the pre-D-51 fixture carries NO state capture, so the D-51 differential's state half is OPEN and says so", () => {
    const d51 = JSON.parse(
      readFileSync(
        join(import.meta.dirname, "fixtures", "frontmatter-singleline-pre-d51.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(
      Object.prototype.hasOwnProperty.call(d51, "state"),
      "if this fixture ever gains a `state` key, the D-51 differential must gain its state half in the same change — and this case must be replaced by that assertion rather than deleted",
    ).toBe(false);
    // Non-vacuity, and a second reason the state half could not simply be copied across: this fixture
    // does not even share the pre-D-54 capture's SHAPE. It stores `entering` and `cells` — no `inputs`
    // array — so there is no per-input corpus here to replay a state capture over.
    expect(Object.keys(d51).sort()).toEqual(["cells", "entering"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (Plan 27-45, D-53 — 27-REVIEW-GAPS-7 § IN-01) THE SPAWN-OCCURRENCE BALANCE ARM, REACHED BY A CASE
// FOR THE FIRST TIME.
//
// THE FINDING. `keysGrantedAgentNames` carried an inline count identity whose refusal is PROVABLY
// unreachable for every input today's code can produce: `accountSpawnOccurrences` pushes exactly one
// of three string literals into `kind`, and `GRANT_OCCURRENCE_KINDS` holds those same three. A grep
// for the refusal's own wording found only the source — no case exercised it — and neither the
// accounting function nor the kinds array was exported, so no case COULD. A floor nobody can exercise
// is a promise, not a floor. This is the exact shape plan 27-42 spent a plan closing in kit-model.ts
// while 27-41 shipped it anew here in the same round.
//
// THE REMEDY, FOLLOWING 27-42'S PRECEDENT RATHER THAN INVENTING A SECOND SHAPE. The comparison is now
// an exported pure function; the kind type, the kinds array and the occurrence interface are exported
// for the single stated reason that a case must be able to construct a FOURTH, UNCLASSIFIED kind. The
// arm stays unreachable in production, and that disclosure ships together with the assertion.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
describe("frontmatter — the occurrence balance arm (D-53 / IN-01 / SPAWN-04 + KIT-03)", () => {
  // The occurrence lists the accounting produces over REAL multi-token values, captured from the
  // PRE-EXTRACTION committed build at execution time and embedded here as DATA. Every row is a value
  // this repository ships or an adversarial multi-token spelling; `buckets` is the bucket assignment
  // the pre-edit accounting produced, and `names` is the pre-edit `keysGrantedAgentNames` result.
  // Comparing against captured data — rather than against whatever the current build computes — is
  // what makes this a behaviour-PRESERVATION proof instead of a tautology.
  const PRE_EXTRACTION: readonly {
    value: string;
    buckets: readonly [GrantOccurrenceKind, string, string][];
    names: string;
  }[] = [
    {
      value: "Read, Agent(a, b), Write, Task(c)",
      buckets: [
        ["scoped", "Agent", "Agent(a, b)"],
        ["scoped", "Task", "Task(c)"],
      ],
      names: '{"ok":true,"value":["a","b","c"]}',
    },
    {
      value: "Agent(a), Agent(b), Agent(c)",
      buckets: [
        ["scoped", "Agent", "Agent(a)"],
        ["scoped", "Agent", "Agent(b)"],
        ["scoped", "Agent", "Agent(c)"],
      ],
      names: '{"ok":true,"value":["a","b","c"]}',
    },
    {
      value: "Read, Agent, Task",
      buckets: [
        ["unscoped", "Agent", "Agent"],
        ["unscoped", "Task", "Task"],
      ],
      names: '{"ok":true,"value":[]}',
    },
    {
      value: "Agent(a), Task",
      buckets: [
        ["scoped", "Agent", "Agent(a)"],
        ["unscoped", "Task", "Task"],
      ],
      names: '{"ok":true,"value":["a"]}',
    },
    {
      value: "Read, Agent(a), Task(b, c), Agent",
      buckets: [
        ["scoped", "Agent", "Agent(a)"],
        ["scoped", "Task", "Task(b, c)"],
        ["unscoped", "Agent", "Agent"],
      ],
      names: '{"ok":true,"value":["a","b","c"]}',
    },
    {
      value: "Task, Task, Task",
      buckets: [
        ["unscoped", "Task", "Task"],
        ["unscoped", "Task", "Task"],
        ["unscoped", "Task", "Task"],
      ],
      names: '{"ok":true,"value":[]}',
    },
    {
      value: "Agent(a) Agent(b) Agent",
      buckets: [
        ["scoped", "Agent", "Agent(a)"],
        ["scoped", "Agent", "Agent(b)"],
        ["unscoped", "Agent", "Agent"],
      ],
      names: '{"ok":true,"value":["a","b"]}',
    },
  ] as const;

  const occurrencesOf = (
    row: (typeof PRE_EXTRACTION)[number],
  ): GrantOccurrence[] =>
    row.buckets.map(([kind, token, fragment]) => ({ kind, token, fragment }));

  it("the kinds array and the declared kind type agree, and the array is the ONLY statement of the three", () => {
    // The floor the balance arm is a floor FOR: a fourth kind added to the type without being added
    // here is what makes the arm fire. Pinning the cardinality in both directions is what stops the
    // list quietly shrinking to two, which would make the arm fire on legitimate input instead.
    expect(
      GRANT_OCCURRENCE_KINDS,
      "a kind dropped from this array turns a legitimate occurrence into an unbalanced accounting; a kind added to the TYPE without being added here is what the balance arm exists to catch",
    ).toHaveLength(3);
    expect([...GRANT_OCCURRENCE_KINDS].sort()).toEqual([
      "neither",
      "scoped",
      "unscoped",
    ]);
    // Exact set equality in BOTH directions, never a cardinality-only comparison (KIT-03 boundary).
    const declared: readonly GrantOccurrenceKind[] = [
      "scoped",
      "unscoped",
      "neither",
    ];
    expect(new Set(GRANT_OCCURRENCE_KINDS)).toEqual(new Set(declared));
    expect(new Set(declared)).toEqual(new Set(GRANT_OCCURRENCE_KINDS));
  });

  it("LIVE VALUES: the balance check reports balanced for every occurrence list the accounting produces over real multi-token values", () => {
    // The direction that must never turn red. If the extraction had changed what the predicate
    // decides, this is where it would show.
    for (const row of PRE_EXTRACTION) {
      expect(
        checkGrantOccurrenceBalance(row.value, occurrencesOf(row)),
        row.value,
      ).toEqual({ balanced: true });
    }
    // And the empty list — a value carrying no spawn token at all — balances vacuously rather than
    // refusing, because "this document never wrote one" is not "this check was not performed".
    expect(checkGrantOccurrenceBalance("Read, Write", [])).toEqual({
      balanced: true,
    });
  });

  it("FOURTH KIND: an occurrence outside the three declared kinds makes the accounting REFUSE, and the refusal NAMES both counts", () => {
    // THE ARM, REACHED. This is the only way to reach it — production cannot produce this occurrence,
    // which is exactly why the export boundary exists and why its reason is recorded in source.
    //
    // The cast is a DOUBLE assertion on purpose: `tsc` correctly refuses the single one, and that
    // refusal is the compiler agreeing that production cannot construct this value.
    const fourth: GrantOccurrence = {
      kind: "an-unclassified-fourth-kind" as unknown as GrantOccurrenceKind,
      token: "Agent",
      fragment: "Agent(x)",
    };
    const list: GrantOccurrence[] = [
      { kind: "scoped", token: "Agent", fragment: "Agent(a)" },
      fourth,
      { kind: "unscoped", token: "Task", fragment: "Task" },
    ];
    const result = checkGrantOccurrenceBalance("Agent(a), Agent(x, Task", list);
    expect(result.balanced).toBe(false);
    const reason = result.balanced ? "" : result.reason;
    // The wording, asserted against the contract a reader depends on — including BOTH interpolated
    // counts, which is what distinguishes "an accounting that did not balance" from a bare failure.
    expect(reason).toContain("does not balance");
    expect(reason).toContain("3 occurrence(s) of the grant token were found");
    expect(reason).toContain(
      "but 2 were classified as scoped, unscoped or neither",
    );
    expect(reason).toContain(
      "an accounting that cannot balance is a check that was NOT performed",
    );
    expect(reason).toContain("a name is never silently dropped or altered");
    // And it excerpts the value it was asked about, so a reader is sent to the right line.
    expect(reason).toContain("Agent(a), Agent(x, Task");
  });

  it("BEHAVIOUR PRESERVED: `keysGrantedAgentNames` reproduces the PRE-EXTRACTION result for every value in the corpus, exactly", () => {
    // The transcript was captured from the committed build BEFORE the extraction and embedded above
    // as data. A post-edit build that computed a different answer for any row fails here by name.
    for (const row of PRE_EXTRACTION) {
      const keys = new Map([["tools", [row.value]]]);
      expect(JSON.stringify(keysGrantedAgentNames(keys)), row.value).toBe(
        row.names,
      );
    }
    // The unbalanced-by-truncation row, whose refusal comes from BUCKET THREE and not from the
    // balance arm — the two failure modes must stay distinguishable, which is the whole of WR-03.
    const truncated = keysGrantedAgentNames(
      new Map([["tools", ["Agent(a, b), Agent(c"]]]),
    );
    expect(truncated.ok).toBe(false);
    expect(truncated.ok ? "" : truncated.reason).toContain(
      "opens a scoped enumeration that is never closed in this value",
    );
    expect(truncated.ok ? "" : truncated.reason).not.toContain(
      "does not balance",
    );
  });

  // ── IN-03 (27-50, D-56 item 7) — THE SLICE STATES WHAT IT IS BEFORE IT IS INSPECTED ───────────
  //
  // WHAT WAS WRONG. The purity case sliced the module source with `indexOf("\n}", start)`. That is
  // this function's body TODAY only because no closing brace inside it sits at column 0 — an
  // incidental property of today's formatting, not a property of the function. A reformat (a
  // prettier width change, an object literal broken differently) can shrink the slice to a few
  // lines, and every `expect(body).not.toContain(...)` below then passes VACUOUSLY. That is the
  // assertion-that-cannot-fail shape this phase closed twice in round 7 and once more in round 9.
  //
  // THE PREMISE IS STATED ONCE, HERE, AND CONSULTED TWICE — by the purity case, which needs it to
  // hold, and by the proof case below, which needs it to FAIL on a slice that is not the function.
  // A proof case restating the premise would prove something about the copy.
  //
  // WHY THESE TWO EXPRESSIONS. They are read off the function rather than remembered: the reduce
  // over `GRANT_OCCURRENCE_KINDS` is the count identity the whole extraction exists to hold in one
  // place, and `balanced: false` is its refusal arm. Neither appears anywhere else in the module's
  // code, so a slice containing both is this function's body and not a neighbour's.
  const PURITY_FORBIDDEN: readonly string[] = [
    "readFileSync",
    "readdirSync",
    "existsSync",
    "execFileSync",
    "process.",
    "derive(",
  ];

  const assertSliceIsBalanceBody = (body: string, where: string): void => {
    expect(
      body,
      `${where}: PREMISE — the slice must contain the count identity this function exists to hold`,
    ).toContain("GRANT_OCCURRENCE_KINDS.reduce");
    expect(
      body,
      `${where}: PREMISE — the slice must contain the refusal arm`,
    ).toContain("balanced: false");
    expect(
      body.split("\n").length,
      `${where}: PREMISE — the slice must be a whole function body, not a truncation`,
    ).toBeGreaterThan(10);
  };

  it("the extracted check is PURE BY CONSTRUCTION — no filesystem, no module-level derivation, and the same answer twice", () => {
    const src = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const start = src.indexOf("export function checkGrantOccurrenceBalance(");
    expect(start).toBeGreaterThan(0);
    const end = src.indexOf("\n}", start);
    expect(end).toBeGreaterThan(start);
    const body = src.slice(start, end);
    // (IN-03) THE PREMISE RUNS FIRST. Every assertion below is a NEGATIVE one, and a negative
    // assertion over the wrong text is a green light for nothing.
    assertSliceIsBalanceBody(body, "the purity slice");
    for (const forbidden of PURITY_FORBIDDEN) {
      expect(body, forbidden).not.toContain(forbidden);
    }
    // Same arguments, same answer — no hidden state between calls.
    const list: GrantOccurrence[] = [
      { kind: "scoped", token: "Agent", fragment: "Agent(a)" },
    ];
    expect(checkGrantOccurrenceBalance("Agent(a)", list)).toEqual(
      checkGrantOccurrenceBalance("Agent(a)", list),
    );
  });

  it("IN-03 — the purity case's PREMISE is LOAD-BEARING: a truncated slice passes every forbidden-substring check and is REFUSED by the premise", () => {
    const src = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const start = src.indexOf("export function checkGrantOccurrenceBalance(");
    expect(start).toBeGreaterThan(0);

    // The slice a reformat produces: the signature and a couple of lines, cut where a `}` happens to
    // reach column 0 early. Constructed rather than simulated, because the point is that this text
    // is what `indexOf("\n}")` can legitimately return.
    const truncated = src.slice(start, src.indexOf("\n", start) + 1);
    expect(truncated.split("\n").length).toBeLessThan(4);

    // FIRST: every negative assertion the purity case makes passes over it. This is the vacuity.
    for (const forbidden of PURITY_FORBIDDEN) {
      expect(truncated, forbidden).not.toContain(forbidden);
    }

    // SECOND: the premise refuses it. Both halves are needed — the first shows the case WOULD have
    // been green over the wrong text, the second shows it no longer can be.
    expect(() =>
      assertSliceIsBalanceBody(truncated, "a deliberately truncated slice"),
    ).toThrow(/PREMISE/);

    // And the premise is NOT vacuously strict: the real body passes it, so this is a discriminator
    // rather than an assertion that refuses everything.
    const end = src.indexOf("\n}", start);
    assertSliceIsBalanceBody(src.slice(start, end), "the real body");
  });

  it("the production call site branches on the extracted result and re-decides nothing", () => {
    // The extraction changes where the predicate LIVES and never what it decides. A second inline
    // count identity beside the call would be the weaker-duplicate shape this module deletes on sight.
    const src = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const code = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    expect(
      code.split("GRANT_OCCURRENCE_KINDS.reduce").length - 1,
      "the count identity must be computed in exactly ONE place — the exported pure function",
    ).toBe(1);
    expect(code).toContain(
      "const balance = checkGrantOccurrenceBalance(v, occurrences);",
    );
    // And each new export carries its stated reason in SOURCE, so a later reader can tell latitude
    // from contract at the boundary.
    expect(src).toContain(
      "THE THREE DECLARATIONS BELOW ARE EXPORTED, FOR ONE\n// STATED REASON AND NO OTHER",
    );
    expect(src).toContain(
      "EXPORTED (plan 27-45, D-53) so a case can CONSTRUCT an occurrence at the test boundary",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (Plan 27-45, D-53 — 27-REVIEW-GAPS-7 § IN-05) THE MULTI-DOCUMENT STREAM: A RECORDED DECISION WITH
// A PIN, NOT A FIX AND NOT A CLAIMED BYPASS.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
describe("frontmatter — the multi-document stream disposition (D-53 / IN-05 / SPAWN-04)", () => {
  it("reads EXACTLY the first region — pinning the decision recorded in the header, not observing an accident", () => {
    // THE DECISION THIS PINS is the header paragraph beginning "AND WHAT A SECOND DOCUMENT IN THE
    // STREAM MEANS — RECORDED, NOT FIXED", in the three-outcomes argument above `parseFrontmatter`.
    // Read it before changing this case: the behaviour below is chosen, not incidental, and the
    // reason it is chosen is that widening what the module reports over — on a premise no
    // measurement supports — is the wrong direction.
    //
    // MEASURED IN THIS SESSION, BOTH COLUMNS:
    //   module:  {ok:true, keys={name:["r1"], tools:["Read"]}}, grant=false   (the first region only)
    //   libyaml: 6 documents (/usr/bin/ruby -ryaml, ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1);
    //            doc3 = {"name"=>"r2", "tools"=>"Read, Agent(grugops-orchestrator)"}
    //
    // `UNKNOWN - verify`: most markdown frontmatter readers also take only the first region, so the
    // platform very likely agrees with the module. NOT confirmed against Claude Code, and NOT claimed
    // as a bypass.
    const token = "Agent(grugops-orchestrator)";
    const text = [
      "---",
      "name: r1",
      "tools: Read",
      "---",
      "---",
      "name: r2",
      `tools: Read, ${token}`,
      "---",
      "---",
      "name: r3",
      "tools: Write",
      "---",
      "",
      "body",
    ].join("\n");
    const parsed = parseFrontmatter(text);
    expect(parsed.ok).toBe(true);
    expect(parsed.ok ? Object.fromEntries(parsed.value) : null).toEqual({
      name: ["r1"],
      tools: ["Read"],
    });
    // The grant on the SECOND region does not appear. This is the whole of the decision.
    expect(keysHaveSpawnGrant(parsed.ok ? parsed.value : new Map())).toBe(
      false,
    );
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
  });

  it("the disposition is IN THE HEADER, carries its measurement, its `UNKNOWN - verify` and its explicit non-claim", () => {
    // A behaviour with a case but no recorded reason is an accident with a pin. This asserts the
    // reason exists where a reader looks for it, so the two cannot drift apart.
    const src = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const at = src.indexOf(
      "AND WHAT A SECOND DOCUMENT IN THE STREAM MEANS — RECORDED, NOT FIXED",
    );
    expect(at).toBeGreaterThan(0);
    // It sits INSIDE the three-outcomes partition argument — the argument that enumerates every other
    // delimiter spelling and never mentioned this one.
    const partitionAt = src.indexOf(
      "// Three outcomes, and the difference between the last two is the point of this module:",
    );
    const entryAt = src.indexOf(
      "export function parseFrontmatter(text: string)",
    );
    expect(partitionAt).toBeGreaterThan(0);
    expect(at).toBeGreaterThan(partitionAt);
    expect(at).toBeLessThan(entryAt);
    const para = src.slice(at, entryAt);
    for (const required of [
      "It reads ONE region",
      "libyaml:  6 documents",
      "the SECOND region carries the grant",
      "`UNKNOWN - verify`",
      "IT IS NOT CLAIMED AS A BYPASS AND A LATER READER MUST NOT ESCALATE IT INTO ONE",
      "an unconsidered adjacency is how the WR-05 arms came to be written one rule",
      "A STREAM IS OUT OF SCOPE",
      "THE MODULE IS NOT\n//   CHANGED TO READ FURTHER REGIONS",
    ]) {
      expect(para, required).toContain(required);
    }
  });

  it("the module was NOT changed to read further regions — no stream parser exists here", () => {
    // The prohibition, asserted rather than promised. Reading further regions is the widening this
    // disposition explicitly declines.
    const src = readFileSync(
      join(import.meta.dirname, "frontmatter.ts"),
      "utf8",
    );
    const code = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    for (const forbidden of [
      "parse_stream",
      "parseStream",
      "documents",
      "nextRegion",
      "secondRegion",
    ]) {
      expect(code, forbidden).not.toContain(forbidden);
    }
    // The closing scan still breaks out at the FIRST legal close, and there is exactly one such scan.
    expect(code.split("break scan;").length - 1).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// (Plan 27-48, D-55 — 27-REVIEW-GAPS-8 § CR-02, round 9) THE VALUE NODE BEGINS AT BOTH OF THE TWO
// PLACES IT CAN BEGIN, NOT ONLY AT THE ONE THE FIELD WAS NAMED AFTER.
//
// `nodeOnKeyLine` recorded "the value node began on the KEY LINE" and was assigned exactly once, at
// the key line. Its own doc block stated the rule correctly — once a scalar has begun, every
// following more-indented line CONTINUES it — and the code implemented it for one of the two places
// a scalar can begin. Where the key line carried no value the node begins on the FIRST CONTINUATION
// LINE and nothing recorded it, so `startsNode` stayed true for every subsequent continuation line
// of that key. THREE DIRECTIONS FELL OUT OF THAT ONE OMISSION, and they are not the same direction:
//
//   (a) an INVENTED NAME on the `ok:true` arm, reaching the KIT-03 closure equality and
//       coordinator-resolution-precheck — both of which are set equalities over the enumerated
//       names, and both of which trust this module's promise that a name is never silently dropped
//       or altered;
//   (b) a module GRANT the loader does not have — the D-52 harness's own declared never-exemptible
//       direction, live on two spellings;
//   (c) FALSE REFUSALS on documents the loader accepts cleanly.
//
// EVERY ROW BELOW WAS MEASURED, NOT REASONED. Each carries the verdict the pre-D-55 committed
// `scripts/frontmatter.js` returned on a `git archive HEAD` mirror of 89705ba BEFORE the edit (RED)
// and the loader's value from `/usr/bin/ruby -ryaml` (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1).
// Both transcripts are recorded verbatim in 27-48-SUMMARY.md.
// The scanner's entering state for a fresh node, spelled here rather than imported: `FRESH_NODE` is
// module-internal, and a test that reconstructs it states the three fields it depends on.
const FRESH_NODE_FOR_D55 = {
  openQuote: null,
  flowDepth: 0,
  nodeMayBegin: true,
} as const;

describe("frontmatter — D-55: the node-started fact is set where the node begins (CR-02, round 9)", () => {
  const TOKEN = "Agent(grugops-orchestrator)";
  const doc = (region: string): string =>
    `---\nname: probe\n${region}\n---\nBody.\n`;
  const valueOf = (text: string, key: string): string => {
    const parsed = parseFrontmatter(text);
    return parsed.ok ? (parsed.value.get(key) ?? []).join("|") : "REFUSED";
  };

  // ── DIRECTION (a): AN INVENTED NAME ON THE SUCCESS ARM ────────────────────────────────────────
  //
  // THE ASSERTION IS OVER THE NAME SET AND NOT OVER TOKEN PRESENCE, and that is the whole of WR-03.
  // `hasSpawnGrant` is `true` on both builds for row a1 — the boolean cannot see this defect at all.
  // The fact the KIT-03 closure equality is computed over is the NAME SET.

  it("D-55 row a1 — the key line carries no value, so the node begins on the first continuation line: `tools:` / `  Agent(alpha, ga` / `  - mma)`", () => {
    // pre-D-55 committed build: names ["alpha","ga","mma"]   <- `mma` is INVENTED, `ga` TRUNCATED
    // libyaml:                  "Agent(alpha, ga - mma)"  -> names ["alpha","ga - mma"]
    const text = doc(`tools:\n  Agent(alpha, ga\n  - mma)`);
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["alpha", "ga - mma"],
    });
    expect(valueOf(text, "tools")).toBe("Agent(alpha, ga - mma)");
  });

  it("D-55 row a2 — the CONTROL: the same document with the value on the key line was already correct and does not move", () => {
    // pre-D-55 committed build: names ["alpha","ga - mma"]  (already correct)
    // libyaml:                  "Agent(alpha, ga - mma)"
    const text = doc(`tools: Agent(alpha, ga\n  - mma)`);
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["alpha", "ga - mma"],
    });
    expect(valueOf(text, "tools")).toBe("Agent(alpha, ga - mma)");
  });

  it("D-55 row a3 — the same invented boundary in prose: `description:` / `  intro` / `  - not an item`", () => {
    // pre-D-55 committed build: "intro, not an item"   <- the comma is structure the document never
    //                            expressed; the dash was read as an item boundary and the join
    //                            separator flipped for the WHOLE key.
    // libyaml:                  "intro - not an item"
    const text = doc(`description:\n  intro\n  - not an item`);
    expect(valueOf(text, "description")).toBe("intro - not an item");
  });

  it("D-55 row a1-seq — the SAME direction in the block-sequence spelling: `tools:` / `  - Agent(alpha, ga` / `    - mma)`", () => {
    // pre-D-55 committed build: names ["alpha","ga","mma"]
    // libyaml:                  ["Agent(alpha, ga - mma)"]  -> names ["alpha","ga - mma"]
    //
    // WHY THIS ROW EXISTS SEPARATELY FROM a1. Row a1's node begins on a plain continuation line;
    // this one's begins at a block-sequence ITEM, which is the deliberate exception. The exception
    // is bounded by INDENT, so the more-indented dash on the next line is text — and the invented
    // name closes here for the same reason it closes in a1, not by a second rule.
    const text = doc(`tools:\n  - Agent(alpha, ga\n    - mma)`);
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["alpha", "ga - mma"],
    });
  });

  // ── DIRECTION (b): A MODULE GRANT THE LOADER DOES NOT HAVE — NEVER EXEMPTIBLE ─────────────────

  it("D-55 row b1 — the module STOPS granting where the loader has no token: `tools:` / `  Read,` / `  \"Write,` / `  # x, TOKEN\"`", () => {
    // pre-D-55 committed build: {ok:true,value:true}, tools=["Read, \"Write, # x, Agent(…)\""]
    // libyaml:                  "Read, \"Write,"  — the quote opens on a line that CONTINUES the
    //                           plain scalar, so it is content and not a scalar's opening quote;
    //                           the hash line is therefore a COMMENT and carries no token.
    const text = doc(`tools:\n  Read,\n  "Write,\n  # x, ${TOKEN}"`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    expect(valueOf(text, "tools")).toBe(`Read, "Write,`);
  });

  it("D-55 row b2 — the same, in the block-sequence spelling: `tools:` / `  - Read,` / `    \"Write,` / `    # x, TOKEN`", () => {
    // pre-D-55 committed build: {ok:true,value:true}, tools=["Read,, \"Write, # x, Agent(…)"]
    // libyaml:                  ["Read, \"Write,"]
    const text = doc(`tools:\n  - Read,\n    "Write,\n    # x, ${TOKEN}`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
    expect(valueOf(text, "tools")).toBe(`Read, "Write,`);
  });

  // ── DIRECTION (c): FALSE REFUSALS ON DOCUMENTATION THE LOADER ACCEPTS ─────────────────────────
  //
  // The node-start reference test is UNCHANGED and still refuses an anchor, an alias or an
  // unresolved tag at a GENUINE node start. What changed is which lines are genuine node starts.

  it("D-55 rows c1/c2/c3 — a sigil on a line that merely CONTINUES a scalar is content, not a node property", () => {
    // pre-D-55 committed build: all three REFUSED as "a YAML anchor or alias, or an unresolved tag"
    // libyaml:  "see the docs *emphasis* here" / "see the docs &D work here" /
    //           "see the docs !important stuff"
    expect(valueOf(doc(`description:\n  see the docs\n  *emphasis* here`), "description")).toBe(
      "see the docs *emphasis* here",
    );
    expect(valueOf(doc(`description:\n  see the docs\n  &D work here`), "description")).toBe(
      "see the docs &D work here",
    );
    expect(valueOf(doc(`description:\n  see the docs\n  !important stuff`), "description")).toBe(
      "see the docs !important stuff",
    );
  });

  it("D-55 (c) boundary — a sigil on the FIRST continuation line of a valueless key is STILL a node start and is STILL refused", () => {
    // The first continuation line IS where the node begins, so this direction does not move. If it
    // did, the fix would have traded three false reds for a silently-resolved reference.
    expect(parseFrontmatter(doc(`description:\n  *emphasis* here`)).ok).toBe(false);
    expect(parseFrontmatter(doc(`description:\n  &anchor here`)).ok).toBe(false);
    expect(parseFrontmatter(doc(`description:\n  !tag here`)).ok).toBe(false);
  });

  // ── THE BLOCK-SEQUENCE EXCEPTION IS BOUNDED BY INDENT ─────────────────────────────────────────

  it("D-55 block-sequence controls — the shipped idiom does not move, byte for byte", () => {
    // Quoted from BOTH builds in 27-48-SUMMARY.md. A block sequence admits a node start at EVERY
    // dash at the item indent; if the item path simply raised the node-started fact, the second
    // item's dash would become text and this value would collapse to one scalar.
    expect(valueOf(doc(`tools:\n  - Read\n  - Write`), "tools")).toBe("Read, Write");
    expect(valueOf(doc(`tools:\n  - Read,\n  - Write,\n  - Third`), "tools")).toBe(
      "Read,, Write,, Third",
    );
    expect(valueOf(doc(`tools: Read,\n  - Write`), "tools")).toBe("Read, - Write");
  });

  it("D-55 item-indent boundary — a dash MORE INDENTED than the item indent is text, and the loader agrees", () => {
    // pre-D-55 committed build: "Read,, still text"   <- the more-indented dash was read as a second
    //                            ITEM, inventing a comma boundary.
    // libyaml:                  ["Read, - still text"]
    expect(valueOf(doc(`tools:\n  - Read,\n    - still text`), "tools")).toBe(
      "Read, - still text",
    );
  });

  it("D-55 empty-dash item — a dash line carrying NO text begins no node, so the node starts on the first more-indented line and a genuine anchor there is STILL refused", () => {
    // THE ITEM PATH SPELLS THE KEY LINE'S RULE, NOT A SECOND ONE. `  -` introduces a node exactly as
    // `tools:` does and begins it only if the line carries text. Measured while writing this plan:
    // an unconditional `nodeStarted = true` at the item path read `&w` below as TEXT on four cells of
    // the D-52 corpus where libyaml RESOLVES the anchor — the silent-no-grant direction, opened by
    // the edit meant to close its mirror image. Identical on the pre-D-55 build and this one.
    expect(
      parseFrontmatter(doc(`tools:\n  -\n    &w Write, ${TOKEN}`)).ok,
    ).toBe(false);
    // And the shipped two-part shape keeps TWO parts: the empty dash line's node begins below it, so
    // the quoted scalar there is a new part rather than a continuation of the previous item.
    // libyaml: ["Read", "Write, # x, Agent(grugops-orchestrator)"].
    expect(
      valueOf(doc(`tools:\n  - Read\n  -\n    "Write,\n    # x, ${TOKEN}"`), "tools"),
    ).toBe(`Read, "Write, # x, ${TOKEN}"`);
  });

  it("D-55 nested sequence — the item indent MOVES with the sequence, so a nested sequence's items are items", () => {
    // libyaml: [["inner", "inner2"]]. `seqIndent` is assigned on EVERY item and not only the first,
    // because the empty dash line's node begins one level in; a first-write-wins indent would have
    // folded `inner2` into `inner`. Byte-identical to the pre-D-55 build.
    expect(valueOf(doc(`tools:\n  -\n    - inner\n    - inner2`), "tools")).toBe(
      "inner, inner2",
    );
  });

  it("D-55 nested quoted item under a nested mapping — still ITS OWN NODE, so its escape is still resolved; byte-identical to the pre-D-55 build", () => {
    // A CONTROL THAT WAS A DEVIATION FIRST, AND THE MEASUREMENT IS WHY IT IS NEITHER NOW. An
    // intermediate draft of D-55 (the one before the walk's own answer joined `startsNode`) folded
    // this item into its parent instead of treating it as a node, so the flush stopped seeing ONE
    // wholly-quoted scalar and `resolveDoubleQuoted` stopped turning `\\` into `\`. That draft moved
    // 20 cells of the repository-wide value map in the leave-the-escape-alone direction. It is not
    // what shipped: `items:` ends at a mapping separator, so the walk leaves a node start behind it
    // and the deeper dash is an ITEM.
    //
    // Pinned as a CONTROL rather than deleted, because a shape that moved under one draft of a fix is
    // exactly the shape a later draft moves again without anyone noticing.
    const text = doc(`tech_debt:\n  items:\n    - "a \\\\r b"`);
    // libyaml: {"items"=>["a \\r b"]}
    expect(valueOf(text, "tech_debt")).toBe(`items:, a \\r b`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: false });
  });

  // ── THE WALK'S OWN ANSWER IS PART OF THE LINE-LEVEL ANSWER (found by the executor's red team) ──

  it("D-55 nested sequence under a nested mapping — a deeper dash after a mapping separator is STILL an item, and the module does not go silent over a live grant", () => {
    // THE REGRESSION AN INTERMEDIATE DRAFT OF THIS PLAN SHIPPED, PINNED SO IT CANNOT RETURN. With
    // `startsNode` reading only `nodeStarted` and `seqIndent`, `nested:` raised the fact for the
    // WHOLE key while `seqIndent` was still null, so the deeper dash stopped being an item, the quote
    // after it opened at a non-node-start, its state died at the line boundary and the token line was
    // stripped as a comment: `{ok:true,value:false}` over a document libyaml reads as
    // {"nested"=>["Read, # x, Agent(grugops-orchestrator)"]}. That is this module's founding failure,
    // opened by the fix meant to close its mirror image, and it was found by the executor's own
    // adversarial sweep and not by the plan.
    //
    // THE CURE IS THE WALK'S ANSWER, NOT A FOURTH FACT. `stripComment` already computes offset 0 as
    // `nodeStartAtOffsetZero || entering.nodeMayBegin`; the line-level expression was simply weaker.
    for (const quote of ['"', "'"]) {
      const text = doc(
        `tools:\n  nested:\n    - ${quote}Read,\n    # x, ${TOKEN}${quote}`,
      );
      expect(hasSpawnGrant(text), quote).toEqual({ ok: true, value: true });
      expect(grantedAgentNames(text), quote).toEqual({
        ok: true,
        value: ["grugops-orchestrator"],
      });
    }
  });

  it("D-55 the walk's answer is FALSE exactly where CR-02 lives, so the third disjunct cannot reopen it", () => {
    // A plain scalar's last character takes the chain's final arm, so `nodeMayBegin` is false after
    // it — which is why the a1 and b1 rows above still close. Asserted through the exported scanner
    // rather than argued, so the claim is checkable at the character.
    for (const line of ["Agent(alpha, ga", "Read,", "see the docs", "intro"]) {
      expect(
        stripComment(line, FRESH_NODE_FOR_D55, true, true).state.nodeMayBegin,
        line,
      ).toBe(false);
    }
    // ...and TRUE after a mapping separator, which is the position the red team found.
    expect(
      stripComment("nested:", FRESH_NODE_FOR_D55, true, true).state.nodeMayBegin,
    ).toBe(true);
  });

  // ── THE ADJACENCY EDGE: TWO KEY LINES THAT DIFFER BY ONE CHARACTER ────────────────────────────

  it("D-55 adjacency edge — a key line carrying only whitespace and one carrying only a comment both leave the node to begin on the first continuation line", () => {
    // The two spellings differ by one character and only one of them was ever exercised. libyaml
    // reads BOTH as ["Read", "Write"].
    const ws = doc(`tools: \n  - Read\n  - Write`);
    const cmt = doc(`tools: # c\n  - Read\n  - Write`);
    expect(valueOf(ws, "tools")).toBe("Read, Write");
    expect(valueOf(cmt, "tools")).toBe("Read, Write");
    expect(valueOf(ws, "tools")).toBe(valueOf(cmt, "tools"));
  });

  // ── THE RENAME IS COMPLETE IN CODE, NOT ONLY IN INTENT ────────────────────────────────────────

  it("D-55 the old identifier survives in comments only", () => {
    // A rename that leaves the old name in code leaves two readers with two different ideas of what
    // the fact means, which is how the field's doc block and its implementation came apart.
    const src = readFileSync(join(import.meta.dirname, "frontmatter.ts"), "utf8");
    const code = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    expect(code).not.toContain("nodeOnKeyLine");
    expect(code).toContain("nodeStarted");
    expect(code).toContain("seqIndent");
    // And the rename is NARRATED — the old name is still findable by a reader who greps for it.
    expect(src).toContain("nodeOnKeyLine");
  });
});

// ---------------------------------------------------------------------------
// (27-55, D-59 — 27-REVIEW.md § CR-01, round 11) THE QUOTING EXEMPTION IS A PROPERTY OF THE REGION A
// BLOCK SCALAR COVERS, NEVER OF THE KEY IT SITS IN.
// ---------------------------------------------------------------------------
//
// Every row below was RED against the committed round-10 build (`3c7930b`) before this describe was
// written, adjudicated side by side with `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 /
// libyaml 0.2.1). The transcripts are recorded verbatim in 27-55-SUMMARY.md, captured on a
// `git archive HEAD` mirror BEFORE the edit — a row that was never red is not a pin.
//
// WHAT THE DEFECT WAS. D-57 carried the block-scalar quoting exemption on a STICKY PER-KEY flag, so
// one nested block scalar anywhere in a key switched the D-30 escape refusal off for EVERY OTHER part
// of that key. Two unrelated lines moved a refusal to `{ok:true,value:false}` over a live grant.
describe("frontmatter — D-59: the block-scalar quoting exemption is region-scoped (CR-01, round 11)", () => {
  const TOKEN = "Agent(grugops-orchestrator)";
  const ESC = `\\x41gent(grugops-orchestrator)`; // NON-allowlisted: `\x`
  const OK_ESC = `\\/Agent(grugops-orchestrator)`; // allowlisted: `\/`
  const doc = (region: string): string =>
    `---\nname: probe\n${region}\n---\nBody.\n`;
  const verdict = (text: string): string => {
    const p = parseFrontmatter(text);
    return p.ok ? `ok:${JSON.stringify([...p.value.entries()])}` : "REFUSED";
  };
  const reasonOf = (text: string): string => {
    const p = parseFrontmatter(text);
    return p.ok ? "" : p.reason;
  };

  // ── THE PAIR, ASSERTED TOGETHER, BECAUSE EITHER ALONE PROVES NOTHING ──────────────────────────
  //
  // U2 alone is a row that already passed on the defective build. U1 alone cannot show that the fix
  // is a SCOPING and not a widening. The finding IS the difference between them, so the difference
  // is what the case asserts.

  it("D-59 U1/U2 — an unrelated `b: >-` sibling cannot switch off the escape refusal, and the sibling-free control refuses BYTE-IDENTICALLY", () => {
    const u2 = doc(`tools:\n  a: "${ESC}"`);
    const u1 = doc(`tools:\n  a: "${ESC}"\n  b: >-\n    x`);
    // loader: U2 -> {"a"=>"Agent(grugops-orchestrator)"}
    //         U1 -> {"a"=>"Agent(grugops-orchestrator)","b"=>"x"}   <- a LIVE grant either way
    // round-10 committed build: U2 REFUSED, U1 {"ok":true,"value":false} — the silent no-grant arm.
    expect(verdict(u2)).toBe("REFUSED");
    expect(verdict(u1)).toBe("REFUSED");
    expect(reasonOf(u1)).toContain("\\x");
    expect(reasonOf(u2)).toContain("\\x");
    // Both refusals keep the substring two shipped assertions match a refusal reason on.
    expect(reasonOf(u1)).toContain("anchor or alias");
    expect(reasonOf(u2)).toContain("anchor or alias");
    // And the parse-failure arm reaches the consumers, so no guard reads this as "carries no grant".
    expect(hasSpawnGrant(u1).ok).toBe(false);
    expect(grantedAgentNames(u1).ok).toBe(false);
  });

  it("D-59 U2 reason byte-identity — the control's reason string is the exact string the round-10 build produced", () => {
    // Recorded from the pre-fix build. A refusal that silently reworded itself would weaken the two
    // shipped assertions that match on it while every case stayed green (threat T-27-55-02).
    const u2 = doc(`tools:\n  a: "${ESC}"`);
    expect(reasonOf(u2)).toBe(
      '`tools: a: "\\x41gent(grugops-orchestrator)"` carries the backslash sequence `\\x` inside a' +
        " double-quoted scalar, and that sequence is not one of the three escapes this module" +
        " resolves; the value this document expresses is not the text these bytes spell, so it is" +
        ' refused on the same argument as an anchor or alias — never read as "carries no grant"',
    );
  });

  // ── THE THREE SPELLINGS OF ONE DOCUMENT AGREE ─────────────────────────────────────────────────
  //
  // The item path resolved each item at the point it was PUSHED and therefore still refused; only the
  // nested-mapping continuation path deferred to the flush. One document, two spellings, two
  // verdicts — that asymmetry is what the review named as the tell, so its absence is the assertion.

  it("D-59 three-spelling agreement — top-level, nested-mapping sibling and block-sequence item return the SAME verdict for the same escape", () => {
    const topLevel = doc(`tools: "${ESC}"`);
    const nested = doc(`tools:\n  a: "${ESC}"\n  b: >-\n    x`);
    const item = doc(`tools:\n  - "${ESC}"\n  - >-\n    x`);
    const verdicts = [topLevel, nested, item].map(verdict);
    expect(verdicts).toEqual(["REFUSED", "REFUSED", "REFUSED"]);
    // Asserted as a SET of one, so a future build that agrees on the wrong answer still fails the
    // row above rather than passing here vacuously.
    expect(new Set(verdicts).size).toBe(1);
    for (const t of [topLevel, nested, item]) {
      expect(reasonOf(t)).toContain("\\x");
    }
  });

  // ── ADJACENCY: TWO REGIONS THAT MERELY TOUCH (KIT-03 adjacency) ───────────────────────────────

  it("D-59 U4 — a block-owned region immediately FOLLOWED by a quoted sibling region: the two resolve on their own terms", () => {
    // loader: {"b"=>"x","a"=>"Agent(grugops-orchestrator)"} — round-10 build: {"ok":true,"value":false}
    const after = doc(`tools:\n  b: >-\n    x\n  a: "${ESC}"`);
    expect(verdict(after)).toBe("REFUSED");
    expect(reasonOf(after)).toContain("\\x");
    // And the mirror order, so the pin is about touching and not about which side comes first.
    const before = doc(`tools:\n  a: "${ESC}"\n  b: >-\n    x`);
    expect(verdict(before)).toBe("REFUSED");
  });

  // ── EMPTINESS: A BLOCK SCALAR THAT CONSUMES ZERO CONTENT LINES (KIT-03 empty) ─────────────────

  it("D-59 U5 — a nested block scalar consuming ZERO content lines still lets its sibling resolve, and alone it returns the value it always returned", () => {
    // loader: {"b"=>"","a"=>"Agent(grugops-orchestrator)"} — round-10 build: {"ok":true,"value":false}
    expect(verdict(doc(`tools:\n  b: >-\n  a: "${ESC}"`))).toBe("REFUSED");
    // The empty region ALONE is untouched: `b:` is what every build since D-57 has flattened it to.
    const alone = parseFrontmatter(doc("tools:\n  b: >-"));
    expect(alone.ok && alone.value.get("tools")).toEqual(["b:"]);
    expect(hasSpawnGrant(doc("tools:\n  b: >-"))).toEqual({ ok: true, value: false });
  });

  // ── THE FAIL-SAFE DIRECTION: THE EXEMPTION IS SCOPED, NEVER REMOVED (D-50 / IN-02) ────────────
  //
  // This is the primary false-red control. YAML applies NO quoting rules inside a `|` / `>` scalar,
  // so a non-allowlisted backslash sequence in a block scalar's OWN content is content and refusing
  // it would fail red on a document the loader accepts.

  it("D-59 U6 — a non-allowlisted backslash inside a block scalar's own content does NOT refuse, nested or top-level", () => {
    const nested = doc(`tools:\n  b: >-\n    Read, "Agent(x\\q)"`);
    const top = doc(`tools: |\n  Read, "Agent(x\\q)"`);
    // loader: {"b"=>"Read, \"Agent(x\\q)\""} and "Read, \"Agent(x\\q)\"\n" — both keep the bytes.
    expect(hasSpawnGrant(nested)).toEqual({ ok: true, value: true });
    expect(hasSpawnGrant(top)).toEqual({ ok: true, value: true });
    expect(parseFrontmatter(nested).ok).toBe(true);
    expect(parseFrontmatter(top).ok).toBe(true);
  });

  it("D-59 U7 — an ALLOWLISTED escape beside a block sibling still GRANTS; the exemption was scoped, not the allowlist narrowed", () => {
    const text = doc(`tools:\n  a: "${OK_ESC}"\n  b: >-\n    x`);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
    expect(grantedAgentNames(text)).toEqual({
      ok: true,
      value: ["grugops-orchestrator"],
    });
  });

  it("D-59 the allowlist is unchanged in both length and membership", () => {
    // The prohibition, asserted rather than promised: this plan may neither narrow nor widen D-30.
    expect(DQ_ESCAPE_ALLOWLIST.size).toBe(3);
    expect([...DQ_ESCAPE_ALLOWLIST.keys()].sort()).toEqual(['"', "/", "\\"]);
  });

  // ── THE VALUE DOES NOT MOVE WHERE NO BLOCK SCALAR IS PRESENT (D-33 preserved) ─────────────────
  //
  // Resolving each REGION individually would have contradicted D-33, which puts the unquote on the
  // JOINED value. Measured, it moved two shipped values. The resolution unit is therefore the maximal
  // RUN of like-kind regions, and for a key with no block scalar there is exactly one run.

  it("D-59 D-33 preserved — a key with no block region resolves as ONE run, so a wholly-quoted region inside a longer join keeps its quotes", () => {
    const text = doc(`tools:\n  - Read\n  -\n    "Write,\n    # x, ${TOKEN}"`);
    // libyaml: ["Read", "Write, # x, Agent(grugops-orchestrator)"]. The module's flattened value has
    // always been the comma join WITH the inner quotes, because the JOIN is not a wholly-quoted
    // scalar. Individual-region resolution produced `Read, Write, # x, …` — a value moving for a
    // reason that has nothing to do with this defect.
    const p = parseFrontmatter(text);
    expect(p.ok && p.value.get("tools")).toEqual([
      `Read, "Write, # x, ${TOKEN}"`,
    ]);
    expect(hasSpawnGrant(text)).toEqual({ ok: true, value: true });
  });

  // ── THE STICKY FLAG IS GONE FROM THE CODE, NOT ONLY FROM THE INTENT ───────────────────────────

  it("D-59 the round-10 sticky per-key flag no longer exists in the module's code", () => {
    // The prohibition is structural: a replacement flag whose lifetime is the key is the defect and
    // not its tuning, so its ABSENCE is asserted rather than described.
    const src = readFileSync(join(import.meta.dirname, "frontmatter.ts"), "utf8");
    const code = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    expect(code).not.toContain("sawBlock");
    // The ACCUMULATOR declares no such field either — checked over the interface body alone, so a
    // narration of the deletion elsewhere in the file cannot satisfy this.
    const body = src.slice(src.indexOf("\ninterface Accumulator {"));
    const iface = body.slice(0, body.indexOf("\n}\n"));
    expect(iface).not.toContain("sawBlock");
    expect(iface).toContain("parts: Part[]");
    // And the deletion is NARRATED — a reader who greps the old name still finds why it went.
    expect(src).toContain("sawBlock");
    // The fact lives on the region now.
    expect(code).toContain("block: boolean");
    expect(code).toContain("regionText");
  });

  // ── THE REGION-IDENTITY INVARIANT, ASSERTED RATHER THAN ASSUMED (KIT-03 ordering) ─────────────
  //
  // The exemption travels ON the region rather than in a table keyed by position, so no reordering,
  // splice or removal could invalidate it. The one place a region is MUTATED after it is pushed is
  // the continuation fold, and that site asserts its own precondition.

  it("D-59 the continuation fold refuses to fold into a block-owned region", () => {
    expect(() =>
      assertFoldTargetIsNotBlockOwned({ intro: "", block: true }, "  x"),
    ).toThrow(/continuation fold/);
    expect(() =>
      assertFoldTargetIsNotBlockOwned({ intro: "b:", block: false }, "  x"),
    ).toThrow(/continuation fold/);
    // And it is silent on the state the flattener actually reaches.
    expect(() =>
      assertFoldTargetIsNotBlockOwned({ intro: "", block: false }, "  x"),
    ).not.toThrow();
  });

  it("D-59 no path in flattenBlock splices, reorders or removes an already-pushed region", () => {
    // The identity model, stated AND checked. `parts` is only ever appended to and its LAST element
    // is only ever mutated in place, so a region's kind cannot drift onto text it never described.
    const src = readFileSync(join(import.meta.dirname, "frontmatter.ts"), "utf8");
    const code = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    for (const mutator of [
      ".parts.splice(",
      ".parts.reverse(",
      ".parts.sort(",
      ".parts.shift(",
      ".parts.pop(",
      ".parts.unshift(",
    ]) {
      expect(code).not.toContain(mutator);
    }
    // Only `push` adds regions, and the count of push sites is pinned so a fourth one arrives loudly.
    expect(code.split(".parts.push(").length - 1).toBe(4);
  });

  // ── A DOCUMENT THAT MIXES ALL THREE REGION KINDS UNDER ONE KEY ────────────────────────────────

  it("D-59 three regions under one key — block, then plain, then quoted-with-escape: only the escape's own run refuses", () => {
    const clean = doc(`tools:\n  b: >-\n    x\n  c: Read\n  a: "${OK_ESC}"`);
    expect(parseFrontmatter(clean).ok).toBe(true);
    expect(hasSpawnGrant(clean)).toEqual({ ok: true, value: true });
    const dirty = doc(`tools:\n  b: >-\n    x\n  c: Read\n  a: "${ESC}"`);
    expect(verdict(dirty)).toBe("REFUSED");
    expect(reasonOf(dirty)).toContain("\\x");
  });
});
