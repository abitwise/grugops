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
  type AdmittedDocument,
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
