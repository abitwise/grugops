// json-text.test.ts — the text edits install/json-text.ts makes to a user's JSON file (red-team B3 of
// plan 33.1-29, D-18): the tokenizer accepts exactly strict JSON, and every removal undoes exactly the
// insertion install makes, byte for byte, whatever the file's spacing, line ends or escapes.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import {
  addMember,
  appendElements,
  documentValue,
  keyCount,
  memberNamed,
  readJsonText,
  removeItems,
  replaceWithText,
  sameJsonValue,
  wrapInArray,
  type JsonNode,
} from "./json-text.js";

const read = (text: string): Extract<ReturnType<typeof readJsonText>, { ok: true }> => {
  const r = readJsonText(Buffer.from(text, "utf8"));
  if (!r.ok) throw new Error(`PREMISE: ${JSON.stringify(text)} ${r.why}`);
  return r;
};
const path = (root: JsonNode, keys: readonly string[]): JsonNode => {
  let n = root;
  for (const k of keys) {
    const m = memberNamed(n, k);
    if (m === null) throw new Error(`PREMISE: no member ${k}`);
    n = m.value;
  }
  return n;
};

// Documents in many layouts, each with an array at `arr` and an object at `obj`.
const LAYOUTS: readonly string[] = [
  '{"obj":{},"arr":[]}',
  '{"obj":{"a":1},"arr":["x"]}',
  '{ "obj" : { "a" : 1 , "b" : [ 2 ] } , "arr" : [ "x" , "y" ] }',
  '{\n  "obj": {\n    "a": 1\n  },\n  "arr": [\n    "x",\n    "y"\n  ]\n}\n',
  '{\r\n\t"obj": {\r\n\t\t"a": 12345678901234567890,\r\n\t\t"b": 1.50\r\n\t},\r\n\t"arr": [\r\n\t\t"\\u0078"\r\n\t]\r\n}',
  '\uFEFF{"obj": { }, "arr": [ ]}  \n\n',
  '{"arr":[\n"x"],"obj":{"z":null,\n    "y":true}}',
];

describe("json-text: every removal undoes exactly the insertion install makes (B3)", () => {
  for (const text of LAYOUTS) {
    it(`append then remove, add then remove, over ${JSON.stringify(text).slice(0, 60)}`, () => {
      const d = read(text);
      // appendElements → removeItems of the appended indices.
      const n0 = (path(d.root, ["arr"]) as Extract<JsonNode, { kind: "array" }>).elements.length;
      const appended = appendElements(d.text, path(d.root, ["arr"]), ["AGENTS.md", { k: [1, 2] }]);
      const d1 = read(appended);
      expect(documentValue(d1)).toEqual({ ...(documentValue(d) as object), arr: [...((documentValue(d) as { arr: unknown[] }).arr), "AGENTS.md", { k: [1, 2] }] });
      expect(removeItems(d1.text, path(d1.root, ["arr"]), new Set([n0, n0 + 1]))).toBe(text);
      // addMember → removeItems of that member.
      const added = addMember(d.text, path(d.root, ["obj"]), "fileName", ["AGENTS.md"]);
      const d2 = read(added);
      const obj2 = path(d2.root, ["obj"]) as Extract<JsonNode, { kind: "object" }>;
      expect(removeItems(d2.text, obj2, new Set([obj2.members.length - 1]))).toBe(text);
      // addMember at the root.
      const d3 = read(addMember(d.text, d.root, "context", { fileName: ["AGENTS.md"] }));
      const root3 = d3.root as Extract<JsonNode, { kind: "object" }>;
      expect(removeItems(d3.text, root3, new Set([root3.members.length - 1]))).toBe(text);
    });
  }

  it("wrapInArray then replaceWithText gives the string's own text back, in a compact and a pretty object", () => {
    for (const text of ['{"c":{"fileName":"G\\u0045MINI.md"}}', '{\n  "c": {\n    "fileName": ""\n  }\n}\n']) {
      const d = read(text);
      const obj = path(d.root, ["c"]);
      const wrapped = wrapInArray(d.text, obj, path(d.root, ["c", "fileName"]), ["AGENTS.md"]);
      const d1 = read(wrapped);
      const arr = path(d1.root, ["c", "fileName"]) as Extract<JsonNode, { kind: "array" }>;
      expect(arr.elements.length).toBe(2);
      expect(replaceWithText(d1.text, arr, arr.elements[0])).toBe(text);
    }
  });

  it("removing the first element, a middle run, and every element keeps the rest byte for byte", () => {
    const text = '[ 1 ,2,\n 3 , 4 ]';
    const d = read(text);
    expect(removeItems(d.text, d.root, new Set([0]))).toBe("[ 2,\n 3 , 4 ]");
    expect(removeItems(d.text, d.root, new Set([1, 2]))).toBe("[ 1 , 4 ]");
    expect(removeItems(d.text, d.root, new Set([0, 1, 2, 3]))).toBe("[ ]");
    expect(removeItems(d.text, d.root, new Set([0, 3]))).toBe("[ 2,\n 3 ]");
  });
});

describe("json-text: the tokenizer accepts exactly strict JSON (B3)", () => {
  const REFUSED = [
    '{"a":1,}',
    "[1,]",
    '{"a":1} // c',
    '{/* c */"a":1}',
    "{'a':1}",
    "[NaN]",
    "[01]",
    "[-]",
    "[1.]",
    '["a\tb"]',
    '["\\x"]',
    '["\\u12"]',
    "[1] [2]",
    "",
    "   ",
    '{"a" 1}',
    '{"a":}',
    "[".repeat(300) + "]".repeat(300),
  ];
  for (const t of REFUSED) {
    it(`refuses ${JSON.stringify(t).slice(0, 40)}`, () => {
      expect(readJsonText(Buffer.from(t, "utf8")).ok).toBe(false);
    });
  }
  it("refuses bytes that are not UTF-8", () => {
    expect(readJsonText(Buffer.from([0x5b, 0x22, 0xff, 0x22, 0x5d])).ok).toBe(false);
  });

  it("agrees with JSON.parse on a corpus and on every one-character mutation of it", () => {
    const seeds = [
      '{"a":[1,-2.5e+3,true,false,null,"x\\n\\u00e9"],"b":{"c":{}}}',
      '[ 0 , -0 , 1E2 , "\\/" ]',
      '{"k":"v","k":"w"}',
    ];
    const alphabet = ['"', "\\", "{", "}", "[", "]", ",", ":", " ", "0", "-", "e", ".", "a", "\n", "/", "t", "n"];
    let checked = 0;
    for (const seed of seeds) {
      const variants = [seed];
      for (let i = 0; i <= seed.length; i++) {
        variants.push(seed.slice(0, i) + seed.slice(i + 1));
        for (const c of alphabet) variants.push(seed.slice(0, i) + c + seed.slice(i + 1), seed.slice(0, i) + c + seed.slice(i));
      }
      for (const v of variants) {
        let parses = true;
        let value: unknown;
        try {
          value = JSON.parse(v);
        } catch {
          parses = false;
        }
        const r = readJsonText(Buffer.from(v, "utf8"));
        expect(r.ok, `disagreement with JSON.parse on ${JSON.stringify(v)}`).toBe(parses);
        if (r.ok) expect(sameJsonValue(documentValue(r), value), JSON.stringify(v)).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(3000);
  });

  it("keeps a byte order mark, and counts duplicate keys", () => {
    const d = read('\uFEFF{"a":1,"a":2,"b":3}');
    expect(keyCount(d.root, "a")).toBe(2);
    expect(keyCount(d.root, "b")).toBe(1);
    expect(d.text.charCodeAt(0)).toBe(0xfeff);
  });
});
