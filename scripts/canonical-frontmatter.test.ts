// canonical-frontmatter.test.ts — the two-sided cardinality pins and the refusal-vocabulary
// completeness pins for `scripts/canonical-frontmatter.ts` (plan 27-62, D-64 Part A).
//
// A GREEN RUN OF THIS FILE IS A FLOOR AND IS NOT CLOSURE EVIDENCE. Eleven consecutive review rounds
// of this phase ended with a live bypass while the suite was green, and two of them shipped a
// regression inside the fix for the previous one. What this file can prove is narrow and stated
// plainly: the live kit is ADMITTED, the admitted grammar has not drifted away from the corpus it
// governs, and every enumerated refusal code is reachable by a construct-specific document. It
// cannot prove that no unenumerated construct exists.
//
// EVERY CASE IMPORTS THE COMMITTED `.js`, never the `.ts`. That is this repository's resolution
// behaviour and it is deliberate: the artifact a gate will execute is the artifact under test. A
// change to the `.ts` that has not been rebuilt changes nothing any case here can see.
//
// EVERY CASE READS ITS CORPUS THROUGH `spawnGrantScan` FROM `scripts/kit-model.js`, the ONE
// authority for what is scanned. There is deliberately no directory listing in this file: a second
// derivation of the scan rule is precisely the drift this phase exists to refuse, and it would also
// let the admission side and the guard side disagree about what was checked.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  spawnGrantScan,
  SPAWN_GRANT_SCAN_PARTS,
  SPAWN_GRANT_SCAN_COUNT,
} from "./kit-model.js";

import {
  admit,
  admittedGrantedNames,
  admittedGrantValues,
  admittedHasSpawnGrant,
  CANONICAL_SCHEMA,
  DOUBLE_QUOTED_KEYS,
  GRANT_KEYS,
  LINE_PRODUCTIONS,
  REFUSAL_CODES,
  type AdmittedDocument,
  type RefusalCode,
} from "./canonical-frontmatter.js";

const ROOT = join(import.meta.dirname, "..");

// The measured baseline, from the premise measurement recorded in 27-62-PLAN.md and re-measured at
// execution time. These are per-PART pins, not a single total: three integer comparisons all pass
// while a decoy displaces a real member inside one part, and a swap BETWEEN parts nets out to the
// right total. `SPAWN_GRANT_SCAN_PARTS` supplies the prefixes so the partition is taken with the
// same literals the composition was built from.
const EXPECTED_PART_COUNTS: Readonly<Record<string, number>> = {
  agent: 17,
  skill: 7,
  "plugin-skill": 7,
  packaging: 2,
};

const SCAN = spawnGrantScan(ROOT);

type Admitted = { rel: string; doc: AdmittedDocument };

// Admit the whole live scan once, so every derivation below reads the SAME admitted image rather
// than re-admitting (and possibly re-deriving) its own.
function admitLiveScan(): { admitted: Admitted[]; refusals: string[] } {
  const admitted: Admitted[] = [];
  const refusals: string[] = [];
  for (const rel of SCAN) {
    const text = readFileSync(join(ROOT, rel), "utf8");
    const a = admit(text);
    if (a.ok) admitted.push({ rel, doc: a.value });
    else refusals.push(`${rel}: [${a.code}] ${a.reason}`);
  }
  return { admitted, refusals };
}

describe("canonical-frontmatter: two-sided cardinality over the live spawn-grant scan", () => {
  // THE NON-EMPTY FLOOR IS ITS OWN NAMED CASE, AND IT COMES FIRST.
  //
  // A scan that derived nothing makes "all files admitted" true and meaningless. Every other case in
  // this describe block loops over `SCAN`, and a loop over an empty array passes. Making the floor a
  // separate named case is what turns a vacuous run into a visible anomaly instead of a green line.
  it("floor: the derived spawn-grant scan is non-empty before any admission loop runs", () => {
    expect(SCAN.length).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: derived spawn-grant scan = ${SCAN.length} member(s)`,
    );
  });

  it("the composition is 17 + 7 + 7 + 2 = 33, per part and equal to the derived scan length", () => {
    const breakdown: string[] = [];
    let total = 0;
    for (const part of SPAWN_GRANT_SCAN_PARTS) {
      const members = SCAN.filter((f) => f.startsWith(part.prefix));
      breakdown.push(`${part.name} ${members.length}`);
      total += members.length;
      expect(
        members.length,
        `spawn-grant scan part \`${part.name}\` (prefix \`${part.prefix}\`) derived ${members.length} member(s), expected ${EXPECTED_PART_COUNTS[part.name]}`,
      ).toBe(EXPECTED_PART_COUNTS[part.name]);
    }
    // The parts must ACCOUNT FOR the whole composition: a member under no known prefix would
    // otherwise be scanned by the guard and counted by nobody.
    expect(
      total,
      `the four parts account for ${total} of the ${SCAN.length} derived members`,
    ).toBe(SCAN.length);
    expect(SCAN.length).toBe(SPAWN_GRANT_SCAN_COUNT);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: composition = ${breakdown.join(" + ")} = ${total} (SPAWN_GRANT_SCAN_COUNT ${SPAWN_GRANT_SCAN_COUNT})`,
    );
  });

  it("every live scanned file is ADMITTED, named per part", () => {
    const { admitted, refusals } = admitLiveScan();
    expect(
      refusals,
      `the canonical-form reader REFUSED live kit file(s):\n${refusals.join("\n")}`,
    ).toEqual([]);
    expect(admitted.length).toBe(SCAN.length);

    const breakdown = SPAWN_GRANT_SCAN_PARTS.map(
      (p) =>
        `${p.name} ${admitted.filter((a) => a.rel.startsWith(p.prefix)).length}`,
    ).join(" + ");
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: ADMITTED ${admitted.length}/${SCAN.length} live files — ${breakdown}`,
    );
  });

  it("the key union across the live corpus equals CANONICAL_SCHEMA, in both directions", () => {
    const { admitted } = admitLiveScan();
    expect(admitted.length).toBe(SCAN.length);
    const used = new Set<string>();
    for (const a of admitted) for (const k of a.doc.keys()) used.add(k);

    const notInSchema = [...used].filter((k) => !CANONICAL_SCHEMA.includes(k));
    const notInCorpus = CANONICAL_SCHEMA.filter((k) => !used.has(k));
    expect(
      notInSchema,
      `live file(s) carry key(s) the exported schema does not admit: ${notInSchema.join(", ")}`,
    ).toEqual([]);
    expect(
      notInCorpus,
      `the exported schema carries key(s) no live file uses: ${notInCorpus.join(", ")} — the schema has drifted away from the corpus it governs`,
    ).toEqual([]);
    expect(used.size).toBe(CANONICAL_SCHEMA.length);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: key union = ${[...used].sort().join(", ")} (${used.size})`,
    );
  });

  it("the line productions used across the live corpus equal LINE_PRODUCTIONS, in both directions", () => {
    const { admitted } = admitLiveScan();
    expect(admitted.length).toBe(SCAN.length);
    // The productions are derived from the ADMITTED image, never re-read from the raw region: a
    // scalar value was written `key: value`, and a sequence value was written `key:` followed by one
    // or more `  - item` lines. Re-deriving them from the bytes would be a second region grammar in
    // the file whose whole subject is that there must be one.
    const used = new Set<string>();
    for (const a of admitted) {
      for (const v of a.doc.values()) {
        if (v.kind === "scalar") used.add(LINE_PRODUCTIONS[0]);
        else {
          used.add(LINE_PRODUCTIONS[1]);
          expect(v.items.length).toBeGreaterThan(0);
          used.add(LINE_PRODUCTIONS[2]);
        }
      }
    }
    expect([...used].sort()).toEqual([...LINE_PRODUCTIONS].sort());
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: line productions in use = ${[...used].sort().map((p) => `\`${p}\``).join(", ")}`,
    );
  });

  it("the keys carrying a double-quoted value equal DOUBLE_QUOTED_KEYS exactly", () => {
    const { admitted } = admitLiveScan();
    expect(admitted.length).toBe(SCAN.length);
    const quotedKeys = new Set<string>();
    let quotedCount = 0;
    for (const a of admitted) {
      for (const [k, v] of a.doc) {
        if (v.kind === "scalar") {
          if (v.quoted) {
            quotedKeys.add(k);
            quotedCount += 1;
          }
        } else {
          for (const q of v.quotedItems) {
            if (q) {
              quotedKeys.add(k);
              quotedCount += 1;
            }
          }
        }
      }
    }
    const unexpected = [...quotedKeys].filter(
      (k) => !DOUBLE_QUOTED_KEYS.includes(k),
    );
    const unused = DOUBLE_QUOTED_KEYS.filter((k) => !quotedKeys.has(k));
    expect(
      unexpected,
      `key(s) carry a double-quoted value outside the exported permitted pair: ${unexpected.join(", ")}`,
    ).toEqual([]);
    expect(
      unused,
      `the exported permitted pair carries key(s) no live file quotes: ${unused.join(", ")}`,
    ).toEqual([]);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: ${quotedCount} double-quoted scalar(s) on exactly ${quotedKeys.size} key(s): ${[...quotedKeys].sort().join(", ")}`,
    );
  });

  it("ZERO grant-key values across the live corpus are quoted", () => {
    const { admitted } = admitLiveScan();
    expect(admitted.length).toBe(SCAN.length);
    const offenders: string[] = [];
    let grantValueCount = 0;
    for (const a of admitted) {
      for (const k of GRANT_KEYS) {
        const v = a.doc.get(k);
        if (v === undefined) continue;
        if (v.kind === "scalar") {
          grantValueCount += 1;
          if (v.quoted) offenders.push(`${a.rel}:${k}`);
        } else {
          grantValueCount += v.items.length;
          if (v.quotedItems.some((q) => q)) offenders.push(`${a.rel}:${k}`);
        }
      }
    }
    expect(
      offenders,
      `grant-key value(s) are quoted: ${offenders.join(", ")} — the grant keys admit plain scalars only, which is what keeps the double-quoted escape alphabet outside the spawn-verdict path`,
    ).toEqual([]);
    expect(grantValueCount).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: ${grantValueCount} grant-key value(s) across the live corpus, 0 quoted`,
    );
  });

  it("the coordinator is the one live file carrying a spawn grant, and its names enumerate", () => {
    const { admitted } = admitLiveScan();
    expect(admitted.length).toBe(SCAN.length);
    const granters = admitted.filter((a) => admittedHasSpawnGrant(a.doc));
    expect(granters.map((g) => g.rel)).toEqual([
      ".claude/agents/grugops-orchestrator.md",
    ]);
    const names = admittedGrantedNames((granters[0] as Admitted).doc);
    expect(names.length).toBeGreaterThan(0);
    expect(admittedGrantValues((granters[0] as Admitted).doc).length).toBe(1);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: 1 grant-carrying live file, ${names.length} enumerated name(s)`,
    );
  });

  // THE NON-VACUITY FLOOR FOR THE ALL-ADMITTED RESULT.
  //
  // "All 33 admitted" is only informative if the loop that produced it was CAPABLE of refusing. This
  // case narrows a COPY of the schema by one member and re-runs the same loop over the same live
  // corpus, asserting it then REFUSES — with the code `unknown-key` and the dropped key named in the
  // reason. The copy is constructed here rather than by mutating the module, so the proof is
  // hermetic and the production constant is untouched; `admit` intersects whatever it is given with
  // `CANONICAL_SCHEMA`, so the option can only ever narrow.
  it("floor: narrowing a COPY of the schema by one member makes the same loop REFUSE live files", () => {
    const dropped = "model";
    expect(CANONICAL_SCHEMA).toContain(dropped);
    const narrowed = CANONICAL_SCHEMA.filter((k) => k !== dropped);
    // The narrowing is asserted to be real BEFORE it is used: a no-op narrowing would produce a
    // perfectly convincing green over a corpus nothing was changed about.
    expect(narrowed.length).toBe(CANONICAL_SCHEMA.length - 1);
    expect(narrowed).not.toContain(dropped);

    const refused: string[] = [];
    for (const rel of SCAN) {
      const a = admit(readFileSync(join(ROOT, rel), "utf8"), {
        schema: narrowed,
      });
      if (!a.ok) {
        expect(a.code).toBe("unknown-key");
        expect(a.reason).toContain(dropped);
        refused.push(rel);
      }
    }
    expect(
      refused.length,
      `narrowing the schema by \`${dropped}\` refused nothing — the all-admitted result above is vacuous`,
    ).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: narrowed-schema floor — dropping \`${dropped}\` REFUSES ${refused.length}/${SCAN.length} live files by \`unknown-key\``,
    );
  });
});

// ---------------------------------------------------------------------------
// The refusal vocabulary: complete, named, construct-specific, and catch-all-free
// ---------------------------------------------------------------------------

const doc = (...lines: string[]): string => `${lines.join("\n")}\n`;

// Every invisible or control byte below is written as a SOURCE ESCAPE, never as a literal. A raw NUL
// byte checked into a test file of this phase was found once already, and a literal control
// character also makes `grep` classify the file as binary and silently report zero matches.
const TAB = String.fromCharCode(0x09);
const BOM = String.fromCharCode(0xfeff);
const NUL = String.fromCharCode(0x00);

// ONE DOCUMENT PER EXPORTED REFUSAL CODE, filed under the code it must produce.
//
// The reachability case below is a DERIVATION over `REFUSAL_CODES`, never a hand-kept list walked in
// parallel: it iterates the exported array and looks each member up here, failing BY NAME on any
// code with no document and on any document whose actual code differs from the code it is filed
// under. A code added to the module without a document fails by name — that is the set-literal drift
// failure class this repository has already paid for once, with seven granted names and zero
// resolving files.
const REFUSAL_DOCUMENTS: Readonly<Record<RefusalCode, string>> = {
  "no-opening-delimiter": doc(`${BOM}---`, "name: r", "---"),
  "no-closing-delimiter": doc("---", "name: r"),
  "empty-region": doc("---", "---"),
  "tab-in-region": doc("---", `name:${TAB}r`, "---"),
  "control-character": doc("---", `name: r${NUL}`, "---"),
  // CR-01 row A, verbatim from 27-REVIEW.md (round 11, CR-01) — the round-11 regression document.
  "block-scalar": doc(
    "---",
    "name: r",
    "tools:",
    "  -",
    "    >-2",
    "      Read,",
    "     # x, Agent(grugops-orchestrator)",
    "---",
  ),
  // CR-02's row, verbatim from 27-REVIEW.md (round 11, CR-02) — the alias reaching a grant through
  // a sequence item's compact mapping.
  "node-property": doc(
    "---",
    "name: r",
    "_x:",
    "  - k: &a Agent(grugops-orchestrator)",
    "allowed-tools:",
    "  - j: *a",
    "---",
  ),
  "flow-collection": doc("---", "tools: [Read]", "---"),
  "single-quoted": doc("---", "description: 'x'", "---"),
  "reserved-indicator": doc("---", "name: %x", "---"),
  "bad-indentation": doc("---", "name: r", "   model: inherit", "---"),
  "unrecognized-line": doc("---", "name: r", "tools:", "  -", "---"),
  "unknown-key": doc("---", "foo: bar", "---"),
  "duplicate-key": doc("---", "name: r", "name: s", "---"),
  "dangling-empty-key": doc("---", "tools:", "name: r", "---"),
  "orphan-sequence-item": doc("---", "name: r", "  - Read", "---"),
  "scalar-padding": doc("---", "name:  r", "---"),
  "plain-scalar-charset": doc("---", "name: r#x", "---"),
  "unbalanced-parentheses": doc("---", "tools: Agent(a", "---"),
  "quoted-on-plain-only-key": doc("---", 'tools: "Read"', "---"),
  "unterminated-double-quote": doc("---", 'description: "abc', "---"),
  "embedded-double-quote": doc("---", 'description: "a"b"', "---"),
  "disallowed-escape": doc("---", 'description: "a\\nb"', "---"),
};

// The four documents 27-REVIEW.md's two critical findings turn on, cited by round and finding id.
// These four are the MINIMUM here: plan 27-63 owns the full historical corpus of every bypass shape
// from rounds 1 through 11, and it must not be pre-empted or duplicated in this file.
const REVIEW_ROWS: readonly {
  label: string;
  text: string;
  code: RefusalCode;
}[] = [
  {
    label:
      "27-REVIEW round 11 CR-01 row A — `>-2` at a bare header under a dash (the regression)",
    text: REFUSAL_DOCUMENTS["block-scalar"],
    code: "block-scalar",
  },
  {
    label:
      "27-REVIEW round 11 CR-01 row B — bare `>-` under a dash, no explicit digit",
    text: doc(
      "---",
      "name: r",
      "tools:",
      "  -",
      "    >-",
      "   Read,",
      "   # x, Agent(grugops-orchestrator)",
      "---",
    ),
    code: "block-scalar",
  },
  {
    label:
      "27-REVIEW round 11 CR-02 — an alias reaching a grant through a sequence item's compact mapping",
    text: REFUSAL_DOCUMENTS["node-property"],
    code: "node-property",
  },
  {
    label:
      "27-REVIEW round 11 CR-02 control — the identical alias one spelling over, no dash",
    text: doc(
      "---",
      "name: r",
      "_x:",
      "  - k: &a Agent(grugops-orchestrator)",
      "allowed-tools:",
      "  j: *a",
      "---",
    ),
    code: "node-property",
  },
];

describe("canonical-frontmatter: the refusal vocabulary is complete, named and catch-all-free", () => {
  it("every exported refusal code is REACHABLE by a construct-specific document", () => {
    expect(REFUSAL_CODES.length).toBeGreaterThan(0);
    const missing: string[] = [];
    const misfiled: string[] = [];
    const produced = new Set<string>();
    for (const code of REFUSAL_CODES) {
      const text = REFUSAL_DOCUMENTS[code];
      if (text === undefined) {
        missing.push(code);
        continue;
      }
      const a = admit(text);
      if (a.ok) {
        misfiled.push(`${code}: the document filed under it was ADMITTED`);
        continue;
      }
      if (a.code !== code) {
        misfiled.push(
          `${code}: the document filed under it refused as \`${a.code}\``,
        );
        continue;
      }
      produced.add(a.code);
      // eslint-disable-next-line no-console
      console.log(`  [${a.code}] ${a.reason}`);
    }
    expect(
      missing,
      `exported refusal code(s) reached by no document: ${missing.join(", ")}`,
    ).toEqual([]);
    expect(
      misfiled,
      `document(s) do not produce the code they are filed under:\n${misfiled.join("\n")}`,
    ).toEqual([]);
    // ONTO AND ONE-TO-ONE. Every member is produced, and one distinct document produces each — which
    // a catch-all member could not satisfy, because a catch-all is by definition the code several
    // unrelated constructs would share.
    expect([...produced].sort()).toEqual([...REFUSAL_CODES].sort());
    expect(produced.size).toBe(REFUSAL_CODES.length);
    expect(Object.keys(REFUSAL_DOCUMENTS).length).toBe(REFUSAL_CODES.length);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: ${produced.size}/${REFUSAL_CODES.length} refusal codes reached by a construct-specific document`,
    );
  });

  it("no refusal produced by any document in this file carries a code outside the exported set", () => {
    const texts = [
      ...Object.values(REFUSAL_DOCUMENTS),
      ...REVIEW_ROWS.map((r) => r.text),
    ];
    expect(texts.length).toBeGreaterThan(0);
    const outside: string[] = [];
    for (const text of texts) {
      const a = admit(text);
      if (a.ok) continue;
      if (!(REFUSAL_CODES as readonly string[]).includes(a.code)) {
        outside.push(`${a.code}: ${a.reason}`);
      }
    }
    expect(
      outside,
      `refusal(s) carry a code outside REFUSAL_CODES:\n${outside.join("\n")}`,
    ).toEqual([]);
  });

  for (const row of REVIEW_ROWS) {
    it(`REFUSES: ${row.label}`, () => {
      const a = admit(row.text);
      expect(a.ok, "this document was ADMITTED — it must be refused").toBe(
        false,
      );
      if (a.ok) return;
      expect(a.code).toBe(row.code);
      // The refusal TEXT is printed, not merely the code: "it failed" and "it failed for the right
      // reason" are different claims, and this phase has confused them before.
      // eslint-disable-next-line no-console
      console.log(`  [${a.code}] ${a.reason}`);
      expect(a.reason.length).toBeGreaterThan(40);
    });
  }

  // THE BOUNDED, COMMENT-STRIPPED SOURCE ASSERTION FOR THE ABSENCE OF A CATCH-ALL.
  //
  // Follows the idiom 27-59 established for the `stripComment` call sites and 27-60 for the bounded
  // source slice: read the module at run time, bound the inspected region by an explicit section
  // marker asserted present BEFORE the slice is used, strip comments so the negative reads code and
  // not prose, and assert a non-vacuity floor on the length of what was scanned. A negative
  // assertion over an unbounded or comment-bearing slice is the brittleness round-10 IN-03 named,
  // and it is not reintroduced here.
  it("source: the admission core assigns an enumerated code on every decline, with no default branch", () => {
    const src = readFileSync(
      join(ROOT, "scripts", "canonical-frontmatter.ts"),
      "utf8",
    );
    const BEGIN = "<<< ADMISSION-CORE BEGIN >>>";
    const END = "<<< ADMISSION-CORE END >>>";
    // The markers are asserted present and UNIQUE before the slice is taken, so a moved, renamed or
    // duplicated marker fails by name instead of silently narrowing what was scanned to nothing.
    expect(src.split(BEGIN).length - 1, `marker \`${BEGIN}\``).toBe(1);
    expect(src.split(END).length - 1, `marker \`${END}\``).toBe(1);
    const region = src.slice(
      src.indexOf(BEGIN) + BEGIN.length,
      src.indexOf(END),
    );

    // Strip block comments then line comments, so every assertion below reads CODE.
    const code = region
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((l) => l.replace(/\/\/.*$/, ""))
      .join("\n");

    // NON-VACUITY FLOOR, stated rather than assumed: the slice must still contain the entry point
    // and a substantial amount of code, or a negative over it proves nothing.
    expect(code).toContain("export function admit(");
    expect(code).toContain("function admitKeyName(");
    const scanned = code.replace(/\s+/g, "").length;
    expect(
      scanned,
      "the comment-stripped admission core slice is too small to be the admission core",
    ).toBeGreaterThan(3000);

    // Every decline routes through `refuse`, so the literal `ok: false` appears exactly once in the
    // whole core — inside `refuse` itself. A second occurrence is a path that constructs a refusal
    // without going through the one place a code is required.
    expect(
      code.split("ok: false").length - 1,
      "the literal `ok: false` must appear exactly once in the admission core — inside `refuse`",
    ).toBe(1);

    // No default branch anywhere in the core: a `default:` is where an unenumerated construct would
    // acquire a code nobody chose for it.
    expect(code).not.toContain("default:");

    // A CODE IS ASSIGNED IN THE CORE IN EXACTLY TWO WAYS, AND BOTH ARE DERIVED FROM THE SOURCE.
    //
    // The first draft of this case looked only at `refuse("...")` literals and FAILED, naming the
    // five codes the node-start sigil table assigns — the pass-2 call site passes a variable, so
    // those five appear at no literal call site. That failure is the reason the table now lives
    // inside the marked region: a refusal decided by DATA is still a refusal decided by the core,
    // and a completeness claim that silently omits a whole assignment mechanism is the shape this
    // phase keeps paying for.
    const called = [...code.matchAll(/refuse\(\s*"([a-z-]+)"/g)].map(
      (m) => m[1] as string,
    );
    expect(called.length).toBeGreaterThan(0);

    // The sigil table, bounded by its own declaration and asserted present before it is sliced.
    const TABLE = "const REFUSED_NODE_SIGILS";
    expect(code.split(TABLE).length - 1, `declaration \`${TABLE}\``).toBe(1);
    const tableStart = code.indexOf(TABLE);
    const tableEnd = code.indexOf("]);", tableStart);
    expect(tableEnd, "the sigil table declaration is never closed").toBeGreaterThan(
      tableStart,
    );
    const tabled = [
      ...code
        .slice(tableStart, tableEnd)
        .matchAll(/,\s*"([a-z-]+)"\s*\]/g),
    ].map((m) => m[1] as string);
    expect(
      tabled.length,
      "the node-start sigil table yielded no code assignments",
    ).toBeGreaterThan(0);

    const assigned = [...called, ...tabled];
    const unknown = [...new Set(assigned)].filter(
      (c) => !(REFUSAL_CODES as readonly string[]).includes(c),
    );
    expect(
      unknown,
      `the admission core assigns code(s) outside REFUSAL_CODES: ${unknown.join(", ")}`,
    ).toEqual([]);
    // And every exported member is actually assigned somewhere in the core — an exported code no
    // assignment site produces is dead vocabulary.
    const unassigned = REFUSAL_CODES.filter((c) => !assigned.includes(c));
    expect(
      unassigned,
      `exported refusal code(s) assigned by no site in the admission core: ${unassigned.join(", ")}`,
    ).toEqual([]);
    // eslint-disable-next-line no-console
    console.log(
      `canonical-frontmatter: admission core scanned = ${scanned} non-space chars, ${called.length} refuse() literal site(s) + ${tabled.length} sigil-table site(s) = ${assigned.length} assignments over ${new Set(assigned).size} distinct codes, 1 \`ok: false\`, 0 default branches`,
    );
  });
});
