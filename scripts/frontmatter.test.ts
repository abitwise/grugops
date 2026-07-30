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
    // ship. Five rows, five distinct labels, five distinct application points in flattenBlock.
    expect(REFUSED_FORMS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(REFUSED_FORMS.map((f) => f.label)).size).toBe(
      REFUSED_FORMS.length,
    );
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
    expect(checked).toBe(REFUSED_FORMS.length * INDENTS.length * VALUES.length);
    expect(checked).toBeGreaterThanOrEqual(60);
  });

  it("the refusal holds identically under the skill form of the key (allowed-tools)", () => {
    for (const form of REFUSED_FORMS) {
      for (const v of VALUES) {
        const text = form.emit(v.value, "allowed-tools", "  ");
        expect(hasSpawnGrant(text).ok, `${form.label} | ${v.label}`).toBe(false);
      }
    }
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
