// canonical-frontmatter.ts — the CANONICAL-FORM ADMISSION READER (plan 27-62, D-64 Part A).
//
// WHAT THIS MODULE IS FOR, AND WHY IT IS A NEW FILE RATHER THAN A TWELFTH EDIT TO `frontmatter.ts`.
//
// `scripts/frontmatter.ts` INTERPRETS a document: it tries to compute what a YAML loader would
// compute, and where it cannot, it has historically returned `{ok: true, value: false}` — "I read
// this document and it carries no spawn grant" — over documents that plainly carry one. Eleven
// consecutive review rounds each found a new spelling of that same arm, and rounds 10 and 11 each
// shipped a NEW instance of it inside the fix for the previous one. The defect is not any single
// spelling; it is that a module which interprets an open grammar has an unbounded set of inputs it
// can misread, and every misread lands on a SUCCESS arm.
//
// This module does not interpret. It ADMITS. It states a small canonical shape, admits a document
// that is written in exactly that shape, and REFUSES every other byte BY A NAMED CODE. There are
// exactly two outcomes and there is no third:
//
//   { ok: true,  value: <the admitted key/value map> }
//   { ok: false, code: <a member of REFUSAL_CODES>, reason: <names the line and the offending byte> }
//
// The silent-no-grant arm — the one that produced eleven rounds of bypasses — DOES NOT EXIST HERE BY
// CONSTRUCTION. A document this module cannot read is a loud, named failure, never a quiet "no
// grant". CR-01 (the block-scalar indentation landmark) and CR-02 (the unwired second node-property
// call site) are DISSOLVED rather than patched: block scalars and node properties are refused
// outright, so there is no indentation landmark to get wrong and no second call site to forget.
//
// THIS MODULE IS NOT YET WIRED INTO ANY GATE. Plan 27-65 owns the cutover, behind its own decision
// checkpoint. Nothing here changes `scripts/frontmatter.ts` or `scripts/check-foundation-guards.ts`,
// both of which this plan leaves BYTE-UNCHANGED.
//
// WHAT IS IMPORTED FROM `frontmatter.ts`, AND WHY EXACTLY TWO THINGS.
//   * `stripFencedBlocks` — this tree has ONE fence implementation and gets no second one. The two
//     packaging templates carry example frontmatter inside fenced blocks; they admit only after the
//     strip. A second fence state machine is the set-literal drift class this repository has already
//     paid for.
//   * `DQ_ESCAPE_ALLOWLIST` — the proven enumerate-the-good escape alphabet. Restating it here would
//     be the same drift one level down.
// Nothing else crosses that boundary. In particular the GRANT PREDICATES of `frontmatter.ts` are NOT
// imported: this module is the new safety authority and must not inherit the eleven-round parser's
// reach.
//
// VOICE. Clear professional English throughout, per the CLAUDE.md hard rule for safety surfaces.

import { DQ_ESCAPE_ALLOWLIST, stripFencedBlocks } from "./frontmatter.js";

// ---------------------------------------------------------------------------
// The admitted shape
// ---------------------------------------------------------------------------

// A value this module admits. There are exactly two, matching the two value productions below: a
// scalar, and a block sequence of scalars. There is no mapping value, because a nested mapping is
// not part of the canonical shape and is refused.
export type AdmittedValue =
  | { readonly kind: "scalar"; readonly value: string }
  | { readonly kind: "sequence"; readonly items: readonly string[] };

// The admitted document: the frontmatter keys in the order the document wrote them. A duplicate key
// is REFUSED rather than merged or last-wins, so this map is a faithful, lossless image of the
// region — every key the document wrote is here, spelled as the document spelled it.
export type AdmittedDocument = ReadonlyMap<string, AdmittedValue>;

// THE ENUMERATED REFUSAL VOCABULARY. Every path that declines to admit assigns one of these.
//
// THERE IS NO CATCH-ALL MEMBER AND NO DEFAULT BRANCH. That is the founding decision of this module,
// and it is the direct answer to its founding failure mode: an unreadable document reported as a
// readable document carrying no grant. A catch-all code would re-open that door one level up — it
// would let a construct nobody has thought about yet be refused under a name that says nothing, and
// "refused for a reason nobody enumerated" is one review round away from "admitted because the
// enumeration had a hole". Each member below names a CONSTRUCT, and plan 27-63's historical corpus
// of every bypass shape from rounds 1 through 11 must land on a member of this set. That is what
// dissolves CR-01 and CR-02 instead of patching them.
//
// Exported as a readonly array so a consumer can ITERATE it: the reachability case walks this array
// and fails by name on any member no document reaches. A code added here without a document is the
// set-literal drift failure class this repository has already paid for once, with seven granted
// names and zero resolving files.
export const REFUSAL_CODES = [
  "no-opening-delimiter",
  "no-closing-delimiter",
  "empty-region",
  "tab-in-region",
  "control-character",
  "block-scalar",
  "node-property",
  "flow-collection",
  "single-quoted",
  "reserved-indicator",
  "bad-indentation",
  "unrecognized-line",
  "unknown-key",
  "duplicate-key",
  "dangling-empty-key",
  "orphan-sequence-item",
  "scalar-padding",
  "plain-scalar-charset",
  "unbalanced-parentheses",
  "quoted-on-plain-only-key",
  "unterminated-double-quote",
  "embedded-double-quote",
  "disallowed-escape",
] as const;

export type RefusalCode = (typeof REFUSAL_CODES)[number];

// The one refusal shape. Declared once and shared by both the document-level and the value-level
// verdicts, so a refusal raised deep inside a value can be returned by the entry point unchanged —
// there is no place where a refusal is re-wrapped, and therefore no place where a code can be
// rewritten on the way out.
export type Refusal = {
  readonly ok: false;
  readonly code: RefusalCode;
  readonly reason: string;
};

// The admission verdict. Two arms. No third. The result-shape convention follows `Parsed<T>` in
// `scripts/frontmatter.ts` so the tree keeps one idiom, with `code` added because a refusal that
// only carries prose cannot be asserted on.
export type Admission =
  | { readonly ok: true; readonly value: AdmittedDocument }
  | Refusal;

// The verdict on a single value. Same two-arm discipline one level down, and the same `Refusal`.
type ValueAdmission = { readonly ok: true; readonly scalar: string } | Refusal;

// ---------------------------------------------------------------------------
// The canonical schema and its alphabets — all enumerate-the-good
// ---------------------------------------------------------------------------

// THE TEN-KEY SCHEMA, AND WHY IT IS TEN AND NOT D-64'S STATED EIGHT.
//
// D-64 Part A's premise measurement scanned 31 files: it omitted the two packaging templates
// (`agent-factory/packaging/slash-command.template.md` and `subagent.frontmatter.md`), and with them
// the keys `kind` and `tier`. The live spawn-grant scan is 33 files, and the distinct key set across
// all 33 after fence-stripping is the ten below — measured this session, not restated from the
// decision's prose.
//
// The decision's own vacuity trap 1 is what settles the conflict: a canonical-form gate that REDS
// THE LIVE KIT is broken, not strict. Implementing the stated eight literally would refuse both
// packaging templates on `unknown-key`. So the grammar follows the measured corpus, and the
// divergence is written down here rather than smoothed over.
//
// An unknown key is REFUSED, not ignored. Ignoring an unknown key is how a document grows a second
// place to hide a grant.
export const CANONICAL_SCHEMA: readonly string[] = [
  "allowed-tools",
  "argument-hint",
  "coordinator",
  "description",
  "disable-model-invocation",
  "kind",
  "model",
  "name",
  "tier",
  "tools",
];

// The keys that carry a spawn grant. These are the only keys whose values can move a spawn verdict.
export const GRANT_KEYS: readonly string[] = ["tools", "allowed-tools"];

// THE ONLY TWO KEYS THAT MAY CARRY A DOUBLE-QUOTED SCALAR, AND THE SECOND DIVERGENCE FROM D-64.
//
// D-64's premise measurement never scanned for quote bytes, so it specified a plain-only alphabet.
// The live corpus carries 31 double-quoted scalars, on exactly two keys — `description` (17, the
// agent adapters, where the generator quotes unconditionally because the composed value always
// contains a colon-space) and `argument-hint` (14, both skill sides). A plain-only grammar would
// refuse 31 of the live kit's 33 files. So the value grammar carries a restricted double-quoted arm,
// admitted on these two keys and NOWHERE ELSE.
//
// NEITHER MEMBER IS A GRANT KEY, AND THAT IS THE POINT. The double-quoted escape alphabet — the
// whole D-30 attack family — is therefore permanently outside the path that renders a spawn verdict.
// A quoted value on `tools` or `allowed-tools` is a named refusal, and it is measured true on the
// live corpus today: zero quoted values on either grant key across all 33 files.
export const DOUBLE_QUOTED_KEYS: readonly string[] = [
  "description",
  "argument-hint",
];

// THE PLAIN-SCALAR ALPHABET — enumerate-the-good, the D-30 inversion applied at the DOCUMENT level.
//
// D-30 inverted the escape handling of `frontmatter.ts` from "refuse the sequences a finding
// reported" to "resolve the three sequences we can vouch for, refuse the complement", and that fix
// is one of exactly two in this phase that never had to be widened again. This constant applies the
// same inversion to the whole plain-scalar value space: a plain scalar carrying any byte outside
// this set is REFUSED BY NAME. Nothing here is a denylist, so there is no "next unenumerated
// spelling" to wait for.
//
// MEMBERSHIP IS DERIVED FROM THE LIVE CORPUS, NOT GUESSED. Measured across all 33 scanned files, the
// plain scalars use 49 distinct characters: SPACE, `( ) , - . ;`, the digit `2`, letters, and
// U+2014 EM DASH. The set below closes the two open CLASSES the corpus samples — it admits every
// ASCII letter and every ASCII digit, because a future role named `grugops-zebra` or a version
// string carrying a `7` must not red the gate for a reason that has nothing to do with safety — and
// enumerates the punctuation EXACTLY as measured, adding nothing the corpus does not spell.
//
// WHAT IS DELIBERATELY ABSENT, AND WHY THAT IS THE LOAD-BEARING PART. Every YAML-significant byte is
// outside this set: `:` `#` `&` `*` `!` `|` `>` `[` `]` `{` `}` `'` `"` `%` `@` backtick `?` `\` and
// every whitespace character other than the single SPACE. So a plain scalar cannot spell an anchor,
// an alias, a tag, a block header, a flow collection, a comment or an escape — not because a
// predicate looks for those, but because their bytes are not admissible. The node-start refusals
// below name such a construct SPECIFICALLY when it appears at a node start; this alphabet refuses it
// wherever else it appears. Two independent refusals, both loud, and no path between them that
// admits.
//
// WIDENING THIS SET IS A DELIBERATE, LOUD ACT. Adding a character here is adding it to the alphabet
// a spawn verdict is computed over. The safe direction for this module is a FALSE RED, which is
// visible; the unsafe direction is a quiet admit, which is what eleven rounds shipped.
export const PLAIN_SCALAR_ALPHABET: ReadonlySet<string> = new Set(
  [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    " ",
    "(),-.;",
    "—", // EM DASH — used in every skill `description` this kit ships
  ].join(""),
);

// THE NODE-START SIGILS, EACH MAPPED TO ITS OWN NAMED CODE.
//
// A YAML construct this module refuses to reason about is introduced by a single byte at a NODE
// START. Rather than trying to work out what such a construct means — which is what the block-scalar
// indentation landmark of CR-01 tried to do, and got wrong — this module names the construct and
// stops. The map is the enumeration; there is no fallthrough.
const REFUSED_NODE_SIGILS: ReadonlyMap<string, RefusalCode> = new Map([
  ["|", "block-scalar" as RefusalCode],
  [">", "block-scalar" as RefusalCode],
  ["&", "node-property" as RefusalCode],
  ["*", "node-property" as RefusalCode],
  ["!", "node-property" as RefusalCode],
  ["[", "flow-collection" as RefusalCode],
  ["{", "flow-collection" as RefusalCode],
  ["'", "single-quoted" as RefusalCode],
  ["%", "reserved-indicator" as RefusalCode],
  ["`", "reserved-indicator" as RefusalCode],
  ["@", "reserved-indicator" as RefusalCode],
  ["?", "reserved-indicator" as RefusalCode],
]);

// A human-readable name for each refused construct, so the refusal reason says what was found rather
// than only which byte was found.
const SIGIL_CONSTRUCT_NAME: ReadonlyMap<string, string> = new Map([
  ["|", "a literal block scalar header"],
  [">", "a folded block scalar header"],
  ["&", "a YAML anchor"],
  ["*", "a YAML alias"],
  ["!", "a YAML tag"],
  ["[", "a flow sequence"],
  ["{", "a flow mapping"],
  ["'", "a single-quoted scalar"],
  ["%", "a YAML directive indicator"],
  ["`", "the reserved indicator `` ` ``"],
  ["@", "the reserved indicator `@`"],
  ["?", "a complex mapping key indicator"],
]);

// The document delimiter, spelled once. A line is a delimiter if and only if it is these three bytes
// and nothing else — no leading residue, no trailing residue, no invisible characters. Every other
// spelling of "nearly a delimiter" is simply not one, which is why this module needs no character
// class to decide the question and no arm can sit between two arms.
const DELIMITER = "---";

// The two admitted indentation columns: 0 for a key line, 2 for a block-sequence item. Any other
// column is refused, so there is no indentation arithmetic anywhere in this module and therefore no
// landmark to compute from the wrong node.
const KEY_INDENT = 0;
const SEQUENCE_INDENT = 2;

// The three admitted line productions, spelled as constants so the test can assert the corpus uses
// exactly these three and no more.
export const LINE_PRODUCTIONS: readonly string[] = [
  "key: value",
  "key:",
  "  - item",
];

const KEY_NAME = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const KEY_WITH_VALUE = /^([A-Za-z_][A-Za-z0-9_-]*): (.+)$/;
const KEY_EMPTY = /^([A-Za-z_][A-Za-z0-9_-]*):$/;
const SEQUENCE_ITEM = /^ {2}- (.+)$/;

// ---------------------------------------------------------------------------
// Small reporting helpers (no decisions are taken here)
// ---------------------------------------------------------------------------

const excerpt = (s: string): string =>
  s.length > 60 ? `${s.slice(0, 57)}...` : s;

const codePointLabel = (c: string): string =>
  `U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;

// Every control character this module refuses on sight, other than the TAB, which has its own code
// because a tab is the single most common way an indentation-sensitive format is written wrong.
const isControl = (c: string): boolean => {
  const cp = c.codePointAt(0) ?? 0;
  return cp < 0x20 || cp === 0x7f || (cp >= 0x80 && cp <= 0x9f);
};

// ---------------------------------------------------------------------------
// <<< ADMISSION-CORE BEGIN >>>
//
// Everything between this marker and ADMISSION-CORE END is the admission verdict itself. The
// no-catch-all property is asserted over exactly this slice by a case in
// `canonical-frontmatter.test.ts`, which reads this file at run time, bounds itself by these two
// markers, strips comments so the negative reads code and not prose, and asserts a non-vacuity floor
// on what it scanned. Moving, renaming or duplicating a marker fails that case by name.
//
// EVERY REFUSAL IN THIS REGION GOES THROUGH `refuse` AND NOWHERE ELSE. The literal `ok: false`
// therefore appears exactly ONCE in this region, and the case asserts that count. That is what makes
// "there is no path that declines without assigning an enumerated code" a measured property of the
// source rather than a claim in a comment.
// ---------------------------------------------------------------------------

const refuse = (code: RefusalCode, reason: string): Refusal => ({
  ok: false,
  code,
  reason,
});

// The node-start offsets of one physical line: the first non-space column, and then the column after
// each block-sequence marker and each mapping-key prefix the line carries.
//
// THIS IS A REFUSAL-ONLY PRE-PASS, NOT A SECOND GRAMMAR. It can only ADD refusals; it can never
// admit anything, and no admitted value is ever computed from it. That is what makes it safe to ask
// a question here that the production pass also asks: the two cannot disagree in the unsafe
// direction, because this one has no success arm to disagree on.
//
// IT EXISTS BECAUSE CR-01 AND CR-02 WERE BOTH DEFECTS OF WHICH POSITIONS A PREDICATE WAS ASKED AT,
// not of what the predicate accepted. CR-01's block header sat under a bare dash on its own line;
// CR-02's anchor sat behind a sequence item's compact mapping. Both are node starts. This function
// enumerates node starts so a construct cannot escape by moving to a position nobody asked about,
// and it derives them from the line rather than from a list of the shapes findings happened to
// report.
const nodeStartOffsets = (line: string): number[] => {
  const offsets: number[] = [];
  let i = 0;
  while (i < line.length && line[i] === " ") i += 1;
  offsets.push(i);
  // Bounded rather than unbounded: a canonical line carries at most one sequence marker and one key
  // prefix, and a bound makes the loop total for every input including an adversarial one.
  for (let guard = 0; guard < 8; guard += 1) {
    const rest = line.slice(i);
    const dash = /^- +/.exec(rest);
    if (dash !== null) {
      i += dash[0].length;
      offsets.push(i);
      continue;
    }
    const key = /^[A-Za-z_][A-Za-z0-9_-]*: +/.exec(rest);
    if (key !== null) {
      i += key[0].length;
      offsets.push(i);
      continue;
    }
    break;
  }
  return offsets;
};

// Admit ONE value, plain or double-quoted, under the key that owns it.
//
// The refused node-start sigils are deliberately NOT re-tested here. A value position IS a node
// start, so the pre-pass has already refused every one of them before this function is reached;
// restating the test would add an arm that cannot fire, and an arm that cannot fire is an arm nobody
// maintains.
const admitValue = (
  key: string,
  raw: string,
  lineNo: number,
): ValueAdmission => {
  if (/^\s|\s$/.test(raw)) {
    return refuse(
      "scalar-padding",
      `line ${lineNo}: the value of \`${key}\` is written as \`${excerpt(raw)}\`, which begins or ends with whitespace; the canonical form is exactly one space after the colon and no trailing whitespace, so the bytes of the value are unambiguous`,
    );
  }

  if (raw.startsWith('"')) {
    if (!DOUBLE_QUOTED_KEYS.includes(key)) {
      return refuse(
        "quoted-on-plain-only-key",
        `line ${lineNo}: \`${key}\` carries a double-quoted value, and the only keys admitted to carry one are ${DOUBLE_QUOTED_KEYS.join(" and ")}; the grant-bearing keys ${GRANT_KEYS.join(" and ")} admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict`,
      );
    }
    if (raw.length < 2 || !raw.endsWith('"')) {
      return refuse(
        "unterminated-double-quote",
        `line ${lineNo}: the double-quoted value of \`${key}\` opens with \`"\` and the line does not close it`,
      );
    }
    const body = raw.slice(1, -1);
    let resolved = "";
    for (let i = 0; i < body.length; i += 1) {
      const c = body[i] as string;
      if (isControl(c)) {
        return refuse(
          "control-character",
          `line ${lineNo}: the double-quoted value of \`${key}\` carries the control character ${codePointLabel(c)}`,
        );
      }
      if (c === '"') {
        return refuse(
          "embedded-double-quote",
          `line ${lineNo}: the double-quoted value of \`${key}\` carries an unescaped \`"\` at offset ${i + 1} of its body, so the scalar this document expresses is not the text between the first and last quote on the line`,
        );
      }
      if (c !== "\\") {
        resolved += c;
        continue;
      }
      if (i + 1 >= body.length) {
        return refuse(
          "unterminated-double-quote",
          `line ${lineNo}: the double-quoted value of \`${key}\` ends with a backslash, so the \`"\` that appeared to close it was escaped and the scalar is not closed on this line`,
        );
      }
      const next = body[i + 1] as string;
      const sub = DQ_ESCAPE_ALLOWLIST.get(next);
      if (sub === undefined) {
        return refuse(
          "disallowed-escape",
          `line ${lineNo}: the double-quoted value of \`${key}\` carries the escape \`\\${next}\`, which is not one of the escapes this tree resolves (${[...DQ_ESCAPE_ALLOWLIST.keys()].map((k) => `\\${k}`).join(" ")}); resolving it would be this module decoding a document it deliberately does not decode`,
        );
      }
      resolved += sub;
      i += 1;
    }
    return { ok: true, scalar: resolved };
  }

  let depth = 0;
  for (const c of raw) {
    if (isControl(c)) {
      return refuse(
        "control-character",
        `line ${lineNo}: the value of \`${key}\` carries the control character ${codePointLabel(c)}`,
      );
    }
    if (!PLAIN_SCALAR_ALPHABET.has(c)) {
      return refuse(
        "plain-scalar-charset",
        `line ${lineNo}: the plain value of \`${key}\` carries \`${c}\` (${codePointLabel(c)}), which is outside the enumerated plain-scalar alphabet; the alphabet states what this module can vouch for, and every byte outside it is refused rather than interpreted`,
      );
    }
    if (c === "(") {
      depth += 1;
      if (depth > 1) {
        return refuse(
          "unbalanced-parentheses",
          `line ${lineNo}: the plain value of \`${key}\` nests \`(\` inside \`(\`; a nested parenthesis means the enumeration inside a scoped grant cannot be split on the comma the document wrote, so the names these bytes would be read as are not the names the document expresses`,
        );
      }
    } else if (c === ")") {
      depth -= 1;
      if (depth < 0) {
        return refuse(
          "unbalanced-parentheses",
          `line ${lineNo}: the plain value of \`${key}\` closes a \`)\` that was never opened`,
        );
      }
    }
  }
  if (depth !== 0) {
    return refuse(
      "unbalanced-parentheses",
      `line ${lineNo}: the plain value of \`${key}\` opens a \`(\` that is never closed, so any enumeration it introduces was never captured`,
    );
  }
  return { ok: true, scalar: raw };
};

// THE ADMISSION ENTRY POINT. Two outcomes. No third.
export function admit(text: string): Admission {
  // CRLF is normalized to LF before anything else, so a Windows checkout is not refused for a reason
  // that has nothing to do with safety. A lone CR that survives this is a control character and is
  // refused by name below.
  const normalized = text.split("\r\n").join("\n");
  const lines = stripFencedBlocks(normalized).split("\n");

  if (lines[0] !== DELIMITER) {
    return refuse(
      "no-opening-delimiter",
      `line 1 of the fence-stripped document is \`${excerpt(lines[0] ?? "")}\`, and the canonical form requires it to be exactly \`${DELIMITER}\`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped`,
    );
  }

  let close = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === DELIMITER) {
      close = i;
      break;
    }
  }
  if (close < 0) {
    return refuse(
      "no-closing-delimiter",
      `the frontmatter region opened at line 1 is never closed by a \`${DELIMITER}\` line`,
    );
  }

  const region = lines.slice(1, close);
  if (region.length === 0) {
    return refuse(
      "empty-region",
      "the frontmatter region is empty; a region carrying no keys is refused rather than admitted as an empty map, because `readable and empty` and `unreadable` must never be confusable",
    );
  }

  // Pass 1 — the whole region, for characters that make it unreadable.
  for (let r = 0; r < region.length; r += 1) {
    const line = region[r] as string;
    const lineNo = r + 2;
    if (line.includes("\t")) {
      return refuse(
        "tab-in-region",
        `line ${lineNo}: the frontmatter region carries a TAB character; indentation decides structure here and a tab has no defined column width`,
      );
    }
    for (const c of line) {
      if (isControl(c)) {
        return refuse(
          "control-character",
          `line ${lineNo}: the frontmatter region carries the control character ${codePointLabel(c)}`,
        );
      }
    }
  }

  // Pass 2 — every node start in the region, for a construct this module refuses to reason about.
  for (let r = 0; r < region.length; r += 1) {
    const line = region[r] as string;
    const lineNo = r + 2;
    for (const off of nodeStartOffsets(line)) {
      const first = line[off];
      if (first === undefined) continue;
      const code = REFUSED_NODE_SIGILS.get(first);
      if (code !== undefined) {
        return refuse(
          code,
          `line ${lineNo}: a node starting at column ${off + 1} is introduced by \`${first}\`, which opens ${SIGIL_CONSTRUCT_NAME.get(first) ?? "a construct outside the canonical form"}; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget`,
        );
      }
    }
  }

  // Pass 3 — the three admitted line productions, in order.
  const keys = new Map<string, AdmittedValue>();
  let pendingKey: string | null = null;
  let pendingItems: string[] = [];
  let pendingLineNo = 0;

  for (let r = 0; r < region.length; r += 1) {
    const line = region[r] as string;
    const lineNo = r + 2;

    let indent = 0;
    while (indent < line.length && line[indent] === " ") indent += 1;
    if (indent !== KEY_INDENT && indent !== SEQUENCE_INDENT) {
      return refuse(
        "bad-indentation",
        `line ${lineNo}: indented ${indent} column(s); the canonical form admits exactly two columns — ${KEY_INDENT} for a key line and ${SEQUENCE_INDENT} for a block-sequence item`,
      );
    }

    if (indent === SEQUENCE_INDENT) {
      const item = SEQUENCE_ITEM.exec(line);
      if (item === null) {
        return refuse(
          "unrecognized-line",
          `line ${lineNo}: \`${excerpt(line)}\` is indented as a block-sequence item and does not match the admitted production \`${LINE_PRODUCTIONS[2]}\``,
        );
      }
      if (pendingKey === null) {
        return refuse(
          "orphan-sequence-item",
          `line ${lineNo}: a block-sequence item appears where no key with an empty value precedes it; a sequence item must belong to a key the document wrote as \`${LINE_PRODUCTIONS[1]}\``,
        );
      }
      const v = admitValue(pendingKey, item[1] as string, lineNo);
      if (!v.ok) return v;
      pendingItems.push(v.scalar);
      continue;
    }

    // A key line closes any sequence that was open.
    if (pendingKey !== null) {
      if (pendingItems.length === 0) {
        return refuse(
          "dangling-empty-key",
          `line ${pendingLineNo}: \`${pendingKey}\` is written with an empty value and no block-sequence item follows it; the canonical form has no null value, so a key either carries a scalar or carries at least one item`,
        );
      }
      keys.set(pendingKey, { kind: "sequence", items: pendingItems });
      pendingKey = null;
      pendingItems = [];
    }

    const empty = KEY_EMPTY.exec(line);
    if (empty !== null) {
      const k = empty[1] as string;
      const bad = admitKeyName(k, keys, lineNo);
      if (bad !== null) return bad;
      pendingKey = k;
      pendingItems = [];
      pendingLineNo = lineNo;
      continue;
    }

    const kv = KEY_WITH_VALUE.exec(line);
    if (kv === null) {
      return refuse(
        "unrecognized-line",
        `line ${lineNo}: \`${excerpt(line)}\` matches none of the ${LINE_PRODUCTIONS.length} admitted line productions (${LINE_PRODUCTIONS.map((p) => `\`${p}\``).join(", ")})`,
      );
    }
    const k = kv[1] as string;
    const bad = admitKeyName(k, keys, lineNo);
    if (bad !== null) return bad;
    const v = admitValue(k, kv[2] as string, lineNo);
    if (!v.ok) return v;
    keys.set(k, { kind: "scalar", value: v.scalar });
  }

  if (pendingKey !== null) {
    if (pendingItems.length === 0) {
      return refuse(
        "dangling-empty-key",
        `line ${pendingLineNo}: \`${pendingKey}\` is written with an empty value and no block-sequence item follows it before the region closes`,
      );
    }
    keys.set(pendingKey, { kind: "sequence", items: pendingItems });
  }

  return { ok: true, value: keys };
}

// The two key-level refusals, factored out because both key productions ask them and asking them in
// two places is how one of them comes to be asked in only one — which is exactly CR-02.
function admitKeyName(
  key: string,
  seen: ReadonlyMap<string, AdmittedValue>,
  lineNo: number,
): Refusal | null {
  if (!KEY_NAME.test(key)) {
    return refuse(
      "unrecognized-line",
      `line ${lineNo}: \`${excerpt(key)}\` is not a canonical key name`,
    );
  }
  if (!CANONICAL_SCHEMA.includes(key)) {
    return refuse(
      "unknown-key",
      `line ${lineNo}: \`${key}\` is not one of the ${CANONICAL_SCHEMA.length} keys the canonical schema admits (${CANONICAL_SCHEMA.join(", ")}); an unknown key is refused rather than ignored, because an ignored key is a second place a document can hide a value`,
    );
  }
  if (seen.has(key)) {
    return refuse(
      "duplicate-key",
      `line ${lineNo}: \`${key}\` appears more than once in this region; a duplicate is refused rather than merged or resolved last-wins, so the admitted map is a faithful image of what the document wrote`,
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// <<< ADMISSION-CORE END >>>
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Grant predicates over an ADMITTED document
// ---------------------------------------------------------------------------
//
// EVERY FUNCTION BELOW TAKES AN `AdmittedDocument`, NEVER RAW TEXT. None of them can be called on a
// document that was never admitted, so no unadmitted byte can reach them. That is the structural
// difference from `frontmatter.ts`, whose grant predicates run over values an open grammar
// assembled and can therefore be handed a value the document does not express.
//
// ALL THREE ARE TOTAL: they return a value, never a result, and they cannot refuse. That is only
// sound because admission has already established the invariants they rely on — the plain-scalar
// alphabet contains no quote, no backslash and no flow delimiter, and parentheses in an admitted
// plain scalar are balanced and never nested. So the comma is reliably the separator the document
// wrote, and an enumeration can neither truncate nor split a name. The invariants live in ADMISSION,
// which is why these functions need no failure arm of their own; a failure arm here would be a third
// outcome by another name.

// The spawn token, declared locally and deliberately not imported. `frontmatter.ts` does not export
// it, and importing that module's grant predicates would give this new authority the reach of the
// eleven-round parser. The word boundary is what stops `Agents` or `SubAgent` from reading as a
// grant.
const SPAWN_TOKEN = /\b(?:Agent|Task)\b/;
const SCOPED_GRANT = /\b(?:Agent|Task)\(([^)]*)\)/g;

// Every flattened value living under a grant key, across both grant keys.
export function admittedGrantValues(doc: AdmittedDocument): string[] {
  const out: string[] = [];
  for (const k of GRANT_KEYS) {
    const v = doc.get(k);
    if (v === undefined) continue;
    if (v.kind === "scalar") out.push(v.value);
    else out.push(...v.items);
  }
  return out;
}

// Does this admitted document grant the spawn tool?
export function admittedHasSpawnGrant(doc: AdmittedDocument): boolean {
  return admittedGrantValues(doc).some((v) => SPAWN_TOKEN.test(v));
}

// The ENUMERATED names from a scoped grant, de-duplicated and sorted — the same output shape
// `keysGrantedAgentNames` produces in `scripts/frontmatter.ts`, computed over this module's admitted
// map so no unadmitted byte can reach it.
//
// An UNSCOPED grant (`tools: Read, Agent`) enumerates nothing and returns the EMPTY LIST. That is a
// real fact about the grant and not a failure: the document wrote a grant with no allowlist. The
// consumer that cares — the KIT-03 closure equality — treats a zero-length closure as its own named
// failure, and it must keep doing so.
export function admittedGrantedNames(doc: AdmittedDocument): string[] {
  const names = new Set<string>();
  for (const v of admittedGrantValues(doc)) {
    SCOPED_GRANT.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCOPED_GRANT.exec(v)) !== null) {
      for (const raw of (m[1] as string).split(",")) {
        const n = raw.trim();
        if (n !== "") names.add(n);
      }
    }
  }
  return [...names].sort();
}
