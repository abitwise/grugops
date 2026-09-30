// json-text.ts — the ONE way the installer edits a JSON file the user owns (red-team of plan 33.1-29,
// B3; D-18, never overwrite user content). Used for `.gemini/settings.json` (context.fileName) and
// `.claude/settings.json` (permissions.ask), by install.ts and uninstall.ts alike.
//
// Cross-platform. ZERO npm dependencies and NO I/O: it imports nothing. The caller reads the bytes
// (readForWrite, brief DC-3) and writes the text this module returns; install/installer-fs-census
// scans install/ and finds no fs call here.
//
// WHY A SPLICE AND NOT JSON.stringify. The installer used to parse the file and write it back with
// JSON.stringify(json, null, 2). That rewrote every byte of the user's file: `12345678901234567890`
// became `12345678901234567000`, `1.50` became `1.5`, the integer-like keys "10" and "2" moved to the
// top in numeric order, tabs, CRLF line ends and the missing final newline were replaced, and of two
// duplicate keys the first was silently lost. The uninstaller restored the entry it removed, not the
// rest. So the file is now edited as TEXT: a small tokenizer (below) finds the exact span of the one
// value that changes, and only that span is replaced, or only new text is inserted beside it. Every
// other byte stays where it was.
//
// WHY THE ROUND TRIP IS BYTE-IDENTICAL. Install only INSERTS: an element after the last element of an
// array (or at the opening bracket of an empty one), a member after the last member of an object (or
// at the opening brace of an empty one), or `[` before and `, "AGENTS.md"]` after a string it turns
// into an array. Each removal here deletes exactly the kind of span an insertion adds: an element or
// member together with the separator in front of it (from the end of the item before it), or, for
// the first item, together with the separator after it (up to the start of the item after it), or,
// when every item goes, from the opening bracket to the end of the last item. Unwrapping replaces the
// array with the kept element's own text. So install → uninstall gives back the original bytes, and
// on a file the user edited since, only the recorded item and its separator go.
//
// WHAT IS REFUSED (the caller reports a counted verify and writes nothing). Bytes that are not valid
// UTF-8 (a decode and re-encode would change them); anything that is not strict JSON (comments, a
// trailing comma, single quotes, NaN, text after the value); nesting deeper than MAX_DEPTH. A leading
// byte order mark is kept as it is. Duplicate keys are counted with keyCount(); a caller refuses a
// duplicate on the path it edits, because which of two equal keys a reader uses is not known.
// Duplicates elsewhere are kept byte for byte.
//
// THE ORACLE. A caller computes the value it expects (the old parse-and-modify logic) and asks
// sameJsonValue(expected, value of the spliced text) before it writes; a mismatch is refused. So a
// defect in the splice can only refuse an edit, never write a wrong one.
//
// Clear professional voice: this is a safety surface (installer reversal).

/** A parsed JSON value with the UTF-16 span of its text. */
export type JsonNode =
  | { readonly kind: "object"; readonly start: number; readonly end: number; readonly members: readonly JsonMember[] }
  | { readonly kind: "array"; readonly start: number; readonly end: number; readonly elements: readonly JsonNode[] }
  | { readonly kind: "string" | "number" | "literal"; readonly start: number; readonly end: number };

export interface JsonMember {
  /** The decoded key. */
  readonly key: string;
  readonly keyStart: number;
  readonly value: JsonNode;
}

export type JsonTextRead = { readonly ok: true; readonly text: string; readonly root: JsonNode } | { readonly ok: false; readonly why: string };

const MAX_DEPTH = 256;

class JsonTextError extends Error {}

/**
 * Parse `bytes` as strict JSON (a leading byte order mark allowed) and keep every value's span.
 * `why` completes "<file> ..." (for example "is not valid JSON (a comment ...)").
 */
export function readJsonText(bytes: Buffer): JsonTextRead {
  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes)) return { ok: false, why: "is not valid UTF-8, so it cannot be edited without changing its bytes" };
  let root: JsonNode;
  try {
    root = new Parser(text).document();
  } catch (e) {
    if (e instanceof JsonTextError) return { ok: false, why: `is not valid JSON (${e.message})` };
    throw e;
  }
  try {
    JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch {
    return { ok: false, why: "is not valid JSON" };
  }
  return { ok: true, text, root };
}

class Parser {
  private i = 0;
  constructor(private readonly s: string) {}

  document(): JsonNode {
    if (this.s.charCodeAt(0) === 0xfeff) this.i = 1;
    this.ws();
    const root = this.value(0);
    this.ws();
    if (this.i !== this.s.length) this.fail("there is text after the JSON value");
    return root;
  }

  private fail(what: string): never {
    throw new JsonTextError(`${what}, at character ${this.i}`);
  }

  private ws(): void {
    for (;;) {
      const c = this.s.charCodeAt(this.i);
      if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) this.i++;
      else return;
    }
  }

  private value(depth: number): JsonNode {
    if (depth > MAX_DEPTH) this.fail(`it is nested more than ${MAX_DEPTH} levels deep`);
    const c = this.s[this.i];
    if (c === "{") return this.object(depth);
    if (c === "[") return this.array(depth);
    if (c === '"') return this.string();
    if (c === "-" || (c !== undefined && c >= "0" && c <= "9")) return this.number();
    for (const lit of ["true", "false", "null"]) {
      if (this.s.startsWith(lit, this.i)) {
        const start = this.i;
        this.i += lit.length;
        return { kind: "literal", start, end: this.i };
      }
    }
    if (c === "/") this.fail("a comment is not JSON");
    this.fail(c === undefined ? "the text ends where a value was expected" : "an unexpected character where a value was expected");
  }

  private string(): JsonNode {
    const start = this.i;
    this.i++;
    for (;;) {
      if (this.i >= this.s.length) this.fail("a string is not terminated");
      const c = this.s.charCodeAt(this.i);
      if (c === 0x22) {
        this.i++;
        return { kind: "string", start, end: this.i };
      }
      if (c < 0x20) this.fail("a string holds an unescaped control character");
      if (c === 0x5c) {
        const e = this.s[this.i + 1];
        if (e === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(this.s.slice(this.i + 2, this.i + 6))) this.fail("a \\u escape is not four hex digits");
          this.i += 6;
        } else if (e !== undefined && '"\\/bfnrt'.includes(e)) {
          this.i += 2;
        } else {
          this.fail("a string holds an invalid escape");
        }
        continue;
      }
      this.i++;
    }
  }

  private number(): JsonNode {
    const re = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
    re.lastIndex = this.i;
    const m = re.exec(this.s);
    if (m === null || m[0] === "" || m[0] === "-") this.fail("a number is malformed");
    const start = this.i;
    this.i += m[0].length;
    return { kind: "number", start, end: this.i };
  }

  private object(depth: number): JsonNode {
    const start = this.i;
    this.i++;
    const members: JsonMember[] = [];
    this.ws();
    if (this.s[this.i] === "}") {
      this.i++;
      return { kind: "object", start, end: this.i, members };
    }
    for (;;) {
      if (this.s[this.i] === "/") this.fail("a comment is not JSON");
      if (this.s[this.i] !== '"') this.fail("an object key is not a string (a trailing comma is not JSON)");
      const keyNode = this.string();
      const key = JSON.parse(this.s.slice(keyNode.start, keyNode.end)) as string;
      this.ws();
      if (this.s[this.i] !== ":") this.fail("a ':' is missing after an object key");
      this.i++;
      this.ws();
      const value = this.value(depth + 1);
      members.push({ key, keyStart: keyNode.start, value });
      this.ws();
      const c = this.s[this.i];
      if (c === ",") {
        this.i++;
        this.ws();
        continue;
      }
      if (c === "}") {
        this.i++;
        return { kind: "object", start, end: this.i, members };
      }
      if (c === "/") this.fail("a comment is not JSON");
      this.fail("a ',' or '}' is missing in an object");
    }
  }

  private array(depth: number): JsonNode {
    const start = this.i;
    this.i++;
    const elements: JsonNode[] = [];
    this.ws();
    if (this.s[this.i] === "]") {
      this.i++;
      return { kind: "array", start, end: this.i, elements };
    }
    for (;;) {
      if (this.s[this.i] === "]") this.fail("a trailing comma is not JSON");
      elements.push(this.value(depth + 1));
      this.ws();
      const c = this.s[this.i];
      if (c === ",") {
        this.i++;
        this.ws();
        continue;
      }
      if (c === "]") {
        this.i++;
        return { kind: "array", start, end: this.i, elements };
      }
      if (c === "/") this.fail("a comment is not JSON");
      this.fail("a ',' or ']' is missing in an array");
    }
  }
}

/** The JavaScript value of one node (JSON.parse of exactly its text). */
export function valueOf(text: string, node: JsonNode): unknown {
  return JSON.parse(text.slice(node.start, node.end));
}

/** How many members of `obj` are named `key` (more than one is a duplicate key). */
export function keyCount(obj: JsonNode, key: string): number {
  return obj.kind === "object" ? obj.members.filter((m) => m.key === key).length : 0;
}

/**
 * The first key that appears twice in one object anywhere in `node` (depth first, in text order), or
 * null when no object repeats a key. For a caller that refuses a whole document with a duplicate
 * (install-marker.ts: the marker is install's own file, written by JSON.stringify, which never repeats
 * a key). The depth is bounded by the tokenizer (MAX_DEPTH).
 */
export function firstDuplicateKey(node: JsonNode): string | null {
  if (node.kind === "object") {
    const seen = new Set<string>();
    for (const m of node.members) {
      if (seen.has(m.key)) return m.key;
      seen.add(m.key);
    }
    for (const m of node.members) {
      const d = firstDuplicateKey(m.value);
      if (d !== null) return d;
    }
    return null;
  }
  if (node.kind === "array") {
    for (const e of node.elements) {
      const d = firstDuplicateKey(e);
      if (d !== null) return d;
    }
  }
  return null;
}

/** The member of `obj` named `key` (the caller has refused duplicates), or null. */
export function memberNamed(obj: JsonNode, key: string): JsonMember | null {
  if (obj.kind !== "object") return null;
  return obj.members.find((m) => m.key === key) ?? null;
}

// ── LAYOUT: how new text is spaced, taken from the container it goes into ────────────────────────
interface Item {
  readonly start: number;
  readonly end: number;
}
const itemsOf = (c: JsonNode): Item[] =>
  c.kind === "object"
    ? c.members.map((m) => ({ start: m.keyStart, end: m.value.end }))
    : c.kind === "array"
      ? c.elements.map((e) => ({ start: e.start, end: e.end }))
      : [];

interface Layout {
  readonly nl: string;
  /** The indentation of the container's items. */
  readonly indent: string;
  /** One level of indentation. */
  readonly unit: string;
}

// The layout of a container whose last item starts on its own line: the line end, that item's
// indentation and one indentation unit (the item's indentation beyond the closing bracket's, or two
// spaces). A container written on one line, or an empty one, gets compact new text (null).
function layoutOf(text: string, c: JsonNode): Layout | null {
  const items = itemsOf(c);
  if (items.length === 0) return null;
  const last = items[items.length - 1];
  const from = items.length === 1 ? c.start + 1 : text.indexOf(",", items[items.length - 2].end) + 1;
  const gap = text.slice(from, last.start);
  const nlAt = gap.lastIndexOf("\n");
  if (nlAt < 0) return null;
  const nl = gap.includes("\r\n") ? "\r\n" : "\n";
  const indent = gap.slice(nlAt + 1);
  const tail = text.slice(last.end, c.end - 1);
  const closeAt = tail.lastIndexOf("\n");
  const closeIndent = closeAt < 0 ? "" : tail.slice(closeAt + 1);
  const unit = indent.length > closeIndent.length && indent.startsWith(closeIndent) ? indent.slice(closeIndent.length) : "  ";
  return { nl, indent, unit: /^[ \t]{1,10}$/.test(unit) ? unit : "  " };
}

/** `value` as JSON text for a position whose items are laid out as `layout` says. */
function render(value: unknown, layout: Layout | null): string {
  if (layout === null) return JSON.stringify(value);
  return JSON.stringify(value, null, layout.unit).split("\n").join(layout.nl + layout.indent);
}

const splice = (text: string, start: number, end: number, insert: string): string => text.slice(0, start) + insert + text.slice(end);

// ── THE EDITS (each returns the new text; the caller parses it again for a further edit) ──────────

/** Append `values` as new elements at the end of array `arr`. */
export function appendElements(text: string, arr: JsonNode, values: readonly unknown[]): string {
  if (arr.kind !== "array" || values.length === 0) return text;
  const layout = layoutOf(text, arr);
  if (arr.elements.length === 0) return splice(text, arr.start + 1, arr.start + 1, values.map((v) => JSON.stringify(v)).join(", "));
  const sep = layout === null ? ", " : `,${layout.nl}${layout.indent}`;
  const insert = values.map((v) => sep + render(v, layout)).join("");
  const at = arr.elements[arr.elements.length - 1].end;
  return splice(text, at, at, insert);
}

/** Add the member `"key": value` at the end of object `obj`. */
export function addMember(text: string, obj: JsonNode, key: string, value: unknown): string {
  if (obj.kind !== "object") return text;
  if (obj.members.length === 0) return splice(text, obj.start + 1, obj.start + 1, `${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  const layout = layoutOf(text, obj);
  const sep = layout === null ? ", " : `,${layout.nl}${layout.indent}`;
  const at = obj.members[obj.members.length - 1].value.end;
  return splice(text, at, at, `${sep}${JSON.stringify(key)}: ${render(value, layout)}`);
}

/**
 * Turn the string member value `node` (a member of `obj`) into an array holding its own text first and
 * then `values`. The original string's text is kept verbatim inside the new array.
 */
export function wrapInArray(text: string, obj: JsonNode, node: JsonNode, values: readonly unknown[]): string {
  const own = text.slice(node.start, node.end);
  const layout = layoutOf(text, obj);
  if (layout === null) return splice(text, node.start, node.end, `[${[own, ...values.map((v) => JSON.stringify(v))].join(", ")}]`);
  const inner = layout.nl + layout.indent + layout.unit;
  const items = [own, ...values.map((v) => JSON.stringify(v))].join(`,${inner}`);
  return splice(text, node.start, node.end, `[${inner}${items}${layout.nl}${layout.indent}]`);
}

/** Replace `node`'s text with the text of `keep` (an element inside it), verbatim. */
export function replaceWithText(text: string, node: JsonNode, keep: JsonNode): string {
  return splice(text, node.start, node.end, text.slice(keep.start, keep.end));
}

/**
 * Remove the items at `indices` (array elements or object members) from `container`, each with the
 * separator the header describes, so a removal undoes exactly what appendElements or addMember added.
 */
export function removeItems(text: string, container: JsonNode, indices: ReadonlySet<number>): string {
  const items = itemsOf(container);
  if (indices.size === 0 || items.length === 0) return text;
  const spans: Array<[number, number]> = [];
  if ([...items.keys()].every((k) => indices.has(k))) {
    spans.push([container.start + 1, items[items.length - 1].end]);
  } else {
    let k = 0;
    while (k < items.length) {
      if (!indices.has(k)) {
        k++;
        continue;
      }
      let j = k;
      while (j + 1 < items.length && indices.has(j + 1)) j++;
      spans.push(k > 0 ? [items[k - 1].end, items[j].end] : [items[k].start, items[j + 1].start]);
      k = j + 1;
    }
  }
  let out = text;
  for (const [s, e] of spans.reverse()) out = splice(out, s, e, "");
  return out;
}

/** Deep equality of two JSON values; object key order is not significant. */
export function sameJsonValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((x, k) => sameJsonValue(x, bb[k]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao);
  const bk = Object.keys(bo);
  return ak.length === bk.length && ak.every((k) => Object.prototype.hasOwnProperty.call(bo, k) && sameJsonValue(ao[k], bo[k]));
}

/** The value of a whole document read by readJsonText. */
export function documentValue(read: Extract<JsonTextRead, { ok: true }>): unknown {
  return valueOf(read.text, read.root);
}
