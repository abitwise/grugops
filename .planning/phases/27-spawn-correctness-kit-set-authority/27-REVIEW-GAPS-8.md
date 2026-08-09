---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-08-09T15:45:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/kit-model.ts
  - scripts/frontmatter.test.ts
  - scripts/kit-model.test.ts
  - scripts/generate-role-adapters.test.ts
findings:
  critical: 2
  warning: 5
  info: 4
  total: 11
status: issues_found
---

# Phase 27: Code Review Report (gap-closure round 8)

**Reviewed:** 2026-08-09T15:45:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Round 8's four changes were reviewed adversarially against the grammar, not against the
suite. The suite is green (`npx vitest run scripts/frontmatter.test.ts scripts/kit-model.test.ts
scripts/generate-role-adapters.test.ts` → 244 passed, 1 skipped), `npm run typecheck` is clean and
`npm run freshness` reports all 32 committed `.js` outputs fresh. None of that is evidence, and the
round-8 defect is live.

**The ninth spelling of the founding failure is still open.** D-51 collapsed the node-start split into
one walk — correctly — but the walk's node-start set is still not total. `stripComment` recognises a
node start at offset 0 of a line, and mid-line only inside a **flow collection** after `[`, `{`, `,`,
`?` or a `: ` **followed by whitespace**. YAML defines node starts in four more places this walk does
not see: a block-mapping `key: value` on an indented line, a compact nested sequence `- - `, a block
explicit key `? `, and — inside the very flow collections D-51 claims to own — a JSON-like `:`
adjacency after a quoted key. All four were reproduced end to end: a live
`Agent(grugops-orchestrator)` planted on both distribution twins of the non-coordinator skill
`plan`, on hermetic `git archive HEAD` mirrors, with the whole foundation gate printing
`ALL CHECKS PASSED` at **exit 0**, while the identical grant on one line exits 1 naming
`WR-05 coordinator-spawn-grant violation`. One line break still flips a red gate green.

A second, independent defect sits one field over: `Accumulator.nodeOnKeyLine` is set exactly once, on
the key line (`frontmatter.ts:1161`), and is never raised when the node actually begins on a
continuation line. Every subsequent continuation line of such a scalar is therefore treated as a
fresh node start. That produces an **invented name on the `ok:true` arm** — the exact direction the
module's own header says D-48 closed — plus module-grants-where-libyaml-does-not, the direction the
new D-52 harness itself declares "NEVER exemptible".

Round 8's own new harnesses cannot see any of this: the D-52 differential moved the *expectation* to
the loader but left the *corpus* as three hand-listed axes fixed at "key line + exactly two
continuation lines", and the D-51 red-team sweep's universal claim ("no mid-line node start YAML
defines returns the SILENT no-grant arm") is backed by a hand-listed 11-member `CONTEXTS` array.
The `kit-model.ts` de-duplication (27-46) is correct; its only defects are documentation-level.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `stripComment`'s node-start set is still not the set of YAML node starts — four measured whole-gate bypasses at exit 0

**File:** `scripts/frontmatter.ts:650-679` (the flow-structure branch), `scripts/frontmatter.ts:1044`
(`startsNode`)

**Issue:**
The walk raises `mayBegin` only for flow constructs, and only in the spellings D-51's red-team
happened to enumerate:

```ts
} else if ((c === "," || c === "?") && depth > 0) {   // line 657
  mayBegin = true;
} else if (
  c === ":" &&
  depth > 0 &&                                        // FLOW ONLY
  (i + 1 >= s.length || /[ \t]/.test(s[i + 1]))       // AND A SPACE IS REQUIRED
) {
  mayBegin = true;
}
```

Four node-start positions YAML defines are outside that union:

1. **block-mapping `key: value` on an indented line** — the `:` arm is gated on `depth > 0`;
2. **compact nested sequence `- - `** — the second dash begins a node mid-line, and `SEQ_ITEM`
   (`frontmatter.ts:1051`) only consumes the first;
3. **block explicit key `? `** — the `?` arm is gated on `depth > 0`;
4. **JSON-like `:` adjacency inside a flow mapping** — YAML 1.2 permits `{"a":"v"}` with no space
   after the colon when the key is JSON-like; the arm above requires one.

In each case the quote that follows opens at a real node start, the walk records
`openedAtNodeStart = false`, the state dies at the line boundary, and the next line's `#` is stripped
as a comment — deleting the whole continuation and the grant with it. The result is
`{ ok: true, value: false }` on the SUCCESS arm.

Measured, module vs `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1). Every row is
a document the loader **accepts** and whose value plainly carries the token:

| # | region under `tools:` | module | libyaml |
|---|---|---|---|
| A | `tools:` / `␠␠nested: "Read,` / `␠␠# x, Agent(grugops-orchestrator)"` | `{ok:true,value:false}`, tools=`nested: "Read,` | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| B | `tools:` / `␠␠- - "Read,` / `␠␠␠␠# x, Agent(…)"` | `{ok:true,value:false}`, tools=`- "Read,,` | `[["Read, # x, Agent(grugops-orchestrator)"]]` |
| C | `tools: {"a":"Read,` / `␠␠# x, Agent(…)"}` | `{ok:true,value:false}`, tools=`{"a":"Read,` | `{"a"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| D | `tools:` / `␠␠- a: "Read,` / `␠␠␠␠# x, Agent(…)"` | `{ok:true,value:false}` | `[{"a"=>"Read, # x, Agent(…)"}]` |
| E | `tools:` / `␠␠a:` / `␠␠␠␠b: "Read,` / `␠␠␠␠# x, Agent(…)"` | `{ok:true,value:false}` | `{"a"=>{"b"=>"Read, # x, Agent(…)"}}` |
| F | `tools:` / `␠␠? "Read,` / `␠␠# x, Agent(…)"` / `␠␠: v` | `{ok:true,value:false}` | `{"Read, # x, Agent(…)"=>"v"}` |
| H | `tools: {"a" :"Read,` / `␠␠# x, Agent(…)"}` | `{ok:true,value:false}` | `{"a"=>"Read, # x, Agent(…)"}` |
| C2 | `tools: [{"a":"Read,` / `␠␠# x, Agent(…)"}]` | `{ok:true,value:false}` | `[{"a"=>"Read, # x, Agent(…)"}]` |

**Reproduced end to end at the gate**, the standard this phase set. On hermetic
`git archive HEAD` mirrors of the reviewed commit, with the plant written to **both** distribution
twins of the non-coordinator skill (`skills/plan/SKILL.md` and
`.claude/skills/grugops-plan/SKILL.md`, so `guard_distribution_pair` stays green):

```
CONTROL one-line grant           :: exit=1 :: 1 CHECK(S) FAILED   (FAIL WR-05 coordinator-spawn-grant violation)
FAMILY A nested block mapping    :: exit=0 :: ALL CHECKS PASSED
FAMILY B compact nested sequence :: exit=0 :: ALL CHECKS PASSED
FAMILY C flow-map JSON adjacency :: exit=0 :: ALL CHECKS PASSED
FAMILY F block explicit key      :: exit=0 :: ALL CHECKS PASSED
```

Scoped honestly, in this module's own idiom: **`UNKNOWN - verify`** whether Claude Code itself grants
the spawn tool when `tools:` / `allowed-tools:` loads to a *mapping* or a *nested sequence* rather
than a string or flat list. No platform-side grant was confirmed, and a later reader must not claim
one. What **is** confirmed and is not a matter of opinion: these are the module's own declared unsafe
direction ("a module NO-GRANT where the loader grants … has now been the finding in eight
consecutive rounds", `frontmatter.test.ts:5900-5903`), they reach the SUCCESS arm rather than the
refusal arm this module's founding rule requires for content it cannot account for, and they silence
`guard_wr05` completely.

Family C is the sharpest of the four because it is inside the flow-collection domain D-51 was written
to own: `frontmatter.test.ts:6946` pins `tools: {a: "Read,` (space after the colon) and nothing pins
the JSON-adjacent sibling one character away.

**Fix:**
Do not add four arms — that is the shape this module has now declined five times. Make the walk's
node-start answer a property of the **structural position**, decided in one place:

```ts
// 1. Drop the flow-only gate from the two block-legal indicators, and make the flow `:` rule
//    match YAML 1.2's actual separation rule (whitespace OR a JSON-like key just closed).
} else if (c === "," && depth > 0) {
  mayBegin = true;
} else if (c === "?" && (depth > 0 || atLineStructuralStart)) {
  mayBegin = true;                       // block explicit key is legal at depth 0
} else if (c === ":" && (i + 1 >= s.length || /[ \t]/.test(s[i + 1]) || (depth > 0 && jsonLikeKeyJustClosed))) {
  mayBegin = true;                       // block mapping value AND flow JSON adjacency
}
```

and teach the item path that a dash consumes only one level (`- - x` re-enters the item rule at the
second dash). Track `jsonLikeKeyJustClosed` in the same walk — set it when a quote closes or a
`]`/`}` closes at the current depth, clear it on any other content character — so there is still one
authority and no second opinion.

Whatever the mechanism, the acceptance evidence must be the four gate transcripts above flipping to
exit 1, plus a corpus that can express them (see WR-01 and WR-02 — neither current harness can).

---

### CR-02: `nodeOnKeyLine` is never raised once the node begins on a continuation line — an INVENTED NAME on the `ok:true` arm, and grants the loader does not see

**File:** `scripts/frontmatter.ts:1161` (the only assignment), `scripts/frontmatter.ts:1044`
(`startsNode`), `scripts/frontmatter.ts:879-896` (the field's contract)

**Issue:**
`cur.nodeOnKeyLine` is written exactly once, on the key line:

```ts
cur.nodeOnKeyLine = v !== "";      // line 1161 — the ONLY place it is ever true
```

When the key line carries no value, the node begins on the *first* continuation line — but nothing
records that. `startsNode = !inScalar && !cur.nodeOnKeyLine` therefore stays **true for every
continuation line of that key** for as long as no quote happens to be open. The field's own doc block
states the correct rule ("once a scalar has begun on the key line, every following more-indented line
CONTINUES it") and then implements it for exactly one of the two places a scalar can begin.

Three consequences, measured against `/usr/bin/ruby -ryaml`:

**(a) An INVENTED NAME on the success arm** — the direction the module's header calls out by name as
"the invented name again, on the success arm" and claims D-48 closed:

```
---
name: r
tools:
  Agent(alpha, ga
  - mma)
---
module : {ok:true}, tools = "Agent(alpha, ga, mma)"   grantedAgentNames = ["alpha","ga","mma"]
libyaml: tools = "Agent(alpha, ga - mma)"             the document expresses ["alpha", "ga - mma"]
```

The identical document **with the value on the key line** (`tools: Agent(alpha, ga` / `  - mma)`) is
correct: `["alpha","ga - mma"]`. The only difference is which line the node began on. The invented
`mma` and the truncated `ga` are fed straight into the KIT-03 closure equality and into
coordinator-resolution-precheck's set equality — "a name is never silently dropped or altered" is
promised at `frontmatter.ts:2168-2181` and is false here.

The same root cause invents a comma in plain prose:
`description:` / `  intro` / `  - not an item` flattens to `intro, not an item`
(libyaml: `intro - not an item`), because `SEQ_ITEM` is asked on a line that is scalar content.

**(b) Module GRANTS where the loader has none** — the D-52 harness's own never-exemptible direction
(`frontmatter.test.ts:6142-6146`):

```
tools:
  Read,
  "Write,
  # x, Agent(grugops-orchestrator)"
module : {ok:true, value:true}  tools = 'Read, "Write, # x, Agent(grugops-orchestrator)"'
libyaml: tools = 'Read, "Write,'          (the plain scalar began on line 2; the `#` is a comment)
```

and the block-sequence-item spelling of the same shape
(`tools:` / `  - Read,` / `    "Write,` / `    # x, Agent(…)`). Both would fail `guard_wr05` red on a
legitimate adapter.

**(c) False refusals** on documents libyaml loads cleanly:
`description:` / `  see the docs` / `  *emphasis* here` → REFUSED as "a YAML anchor or alias".
Ditto `&D work here` and `!important stuff`. libyaml: `"see the docs *emphasis* here"`.

Direction (c) **is** recorded — `frontmatter.test.ts:5009-5016` pins it as "the ONE named module
contract in this table … a measured, pre-existing divergence from libyaml in the safe direction".
That framing does not survive contact with (a) and (b), which share its root cause and are neither
safe nor recorded: (a) is a success-arm name invention and (b) is a red gate on correct content,
which D-34 records as the worse of the two directions. Enshrining (c) as a contract retired the only
signal that (a) and (b) existed.

**Fix:**
Rename the field to what it means and set it at both places the node can begin:

```ts
// Accumulator
nodeStarted: boolean;          // has this key's value node begun ANYWHERE yet?

// key line (line 1161)
cur.nodeStarted = v !== "";

// continuation path, after the line has been consumed as content
if (!cur.nodeStarted && text !== "") cur.nodeStarted = true;
```

with one deliberate exception, stated at the site: a **block sequence** continues to admit node
starts at each `- ` at the item indent, so the item path must set a separate `seqIndent` rather than
`nodeStarted`, and only lines at that indent beginning with `-` re-enter the item rule. Pin (a) with
a `grantedAgentNames` assertion (not a token-presence assertion — see WR-03), and pin (b) and (c)
against the loader.

---

## Warnings

### WR-01: the D-52 loader differential moved the EXPECTATION out of this file and left the CORPUS in it — neither CR-01 nor CR-02 is expressible in its 312 cells

**File:** `scripts/frontmatter.test.ts:5638-6168` (the describe), `:5664-5775` (`AXIS_KEY_LINE`),
`:5856-5867` (`buildCellRegion`)

**Issue:**
The block's own thesis is correct and well argued: "A CORPUS AND AN EXPECTATION BOTH WRITTEN BY HAND
OVER THE SAME AXES CANNOT FAIL ON AN AXIS NOBODY THOUGHT OF." The remedy applied only to the
expectation. The corpus is three hand-listed arrays (13 × 6 × 4) whose lengths are pinned
(`:6001-6003`) — pins the block correctly labels as floors against shrinking, "EXPLICITLY NOT the
completeness claim". But the sentence that follows — "the completeness claim is the loader" — does
not hold: a differential is complete only over the inputs it generates, and the loader is never asked
about an input the corpus cannot build.

Two structural limits, both fatal to this round's own defect:

1. `AXIS_KEY_LINE` carries no block-mapping, no compact-nested-sequence, no block-explicit-key and no
   JSON-adjacency shape. `flow-mapping opener` is `tools: {a: ${FIRST}` — the space-separated
   spelling only. CR-01's four families are therefore **not expressible**, not merely untested.
2. `buildCellRegion` emits exactly `keyLine.lines + one continuation + one continuation`. A value
   whose node begins on continuation 1 and is still going on continuation 3 cannot be built, so
   CR-02's directions (a) and (b) are not expressible either.

I ran the same harness shape over a wider axis set (20 key-line shapes × 6 × 2 = 240 cells, same
batched Ruby loader, same predicate): 98 loader-rejected, and **4 cells in the never-exemptible
`module=grant / loader=no-grant` direction**, plus the 8 silent-no-grant families of CR-01 when the
nested constructs are added. The harness as committed reports 0.

**Fix:**
Derive the key-line axis instead of listing it, or at minimum add the shapes YAML's grammar names
rather than the shapes a review reported: a nested block mapping, a compact nested sequence, a block
explicit key, a JSON-adjacent flow mapping, and a variable continuation count (2 and 3). Then make
the axis *depth* a fourth axis rather than a constant baked into `buildCellRegion`. A cheap
non-circularity floor to add alongside: assert that every family named in `frontmatter.ts`'s ledger
(entries one through nine) is expressible by the generator, by construction rather than by comment.

---

### WR-02: the mid-line node-start sweep makes a universal claim over a hand-listed 11-member array — and the claim is false

**File:** `scripts/frontmatter.test.ts:7007` (case title), `:7019-7041` (`CONTEXTS`)

**Issue:**
The case is titled **"D-51 red-team — no mid-line node start YAML defines returns the SILENT no-grant
arm"**. Its evidence is:

```ts
const CONTEXTS: readonly (readonly [string, string, string])[] = [
  ["flow explicit-key indicator",           "{? ",        ": v}"],
  ["flow explicit-key indicator, no space", "{?",         ": v}"],
  ["tag shorthand at a flow node start",    "[!!str ",    "]"],
  …
  ["three levels deep",                     "[a, [b, {c: ", "}]]"],
];
```

Eleven hand-written prefixes, no derivation, no cardinality pin, no statement of what set they
enumerate. This is the repository's own diagnosed second systemic failure class ("derive the set,
assert the count") wearing a safety label, and the title's quantifier is exactly the kind of claim a
hand list cannot support. Note that the list contains `{?` *without* a space (the `?` red-team
finding) but no `{"a":` (the `:` sibling) — the enumeration tracks the spellings a red-team reported,
not the grammar.

The claim is false: family C (`{"a":"Read,`) and family H (`{"a" :"Read,`) are mid-line node starts
YAML defines, inside a flow collection, and both return the silent no-grant arm (CR-01).

**Fix:**
Either derive the contexts (enumerate the flow-context node-start productions from YAML 1.2 §7.4 and
assert the count two-sided), or retitle the case to the subset it actually covers — "eleven named
flow contexts" — and move the universal claim to a generated corpus. Do not leave a universal title
over a literal; that is the shape the file's own commentary condemns three times.

---

### WR-03: every harness in this round agrees with the loader on TOKEN PRESENCE only, so a divergent NAME SET is structurally invisible

**File:** `scripts/frontmatter.test.ts:6100` (`verdict.value.includes(HARNESS_TOKEN)`),
`:5180` (the D-49 cross-check), `:4884-4885`

**Issue:**
The agreed predicate is `hasSpawnGrant`. But the fact the KIT-03 closure equality and
coordinator-resolution-precheck are computed over is `keysGrantedAgentNames` — the **name set**, not
the boolean. `frontmatter.ts`'s own header names the invented-name direction as one of the three
directions of the D-48 defect ("the name set feeding the KIT-03 closure equality had a name INVENTED
in it, on the `ok:true` arm"), and CR-02(a) is precisely that, reproduced. Both harnesses report
`grant=true` for it and pass.

The exclusion is disclosed and its stated reason is sound as far as it goes ("this module joins a
block sequence with a comma-space BY CONTRACT and the loader returns a real sequence"), but that
argues only against **byte** equality of the flattened value. It does not argue against comparing the
*name sets*, which are order-free, de-duplicated and directly comparable once the loader's value is
flattened the same way.

**Fix:**
Add a second predicate to both harnesses over the same already-loaded values:

```ts
const loaderNames = namesFrom(String(verdict.value));   // same SCOPED_GRANT extraction, applied to the loader's value
const moduleNames = grantedAgentNames(document);
// A module name set that is not EQUAL to the loader's is a divergence in the fact KIT-03 uses,
// regardless of whether the boolean agrees.
```

with the same three-verdict discipline (a module refusal is not folded into "no names").

---

### WR-04: the D-52 exemption bounds are arithmetically incapable of failing, and the disagreement/exemption equality pushes future edits toward narrowing an exemption

**File:** `scripts/frontmatter.test.ts:5926-5947` (`EXEMPTIONS`), `:6111-6120`, `:6137-6140`,
`:6148-6159`

**Issue:**
Two problems in the exemption machinery.

1. **The bounds are vacuous.** Each `bound` is the full cross-product the shape can produce
   (E1: `1 × 6 × 4 = 24`; E2: `4 × 1 × 4 = 16`), and each `matches` is a pure function of the same
   axis flags, so `matched` is by construction `≤ bound` for every possible corpus — it equals the
   product minus the loader-rejected cells. `expect(matched).toBeLessThanOrEqual(bound)` at `:6156`
   can never fail. The comment at `:5912-5913` says the bound exists "so a rule cannot silently come
   to cover more of the corpus than the shape it names can produce"; the bound *is* what that shape
   produces, so it bounds nothing. The `> 0` liveness check at `:6152` is the only assertion here
   doing work.
2. **The equality is the wrong shape for its purpose.** `expectedExempt` is pushed for every
   loader-accepted cell an exemption matches, whether or not the module and loader actually diverged
   there; the assertion at `:6137` then requires the disagreement set to *equal* it. So a future axis
   under which an exempt cell happens to **agree** turns the harness red, and the cheapest repair is
   to narrow `matches` — i.e. the assertion pressures a maintainer toward exemption-shaped edits. The
   honest predicate is "every disagreement is exempt AND every exemption matched at least one
   disagreement", which is what the comment describes.

The genuinely load-bearing safety here is the separate `unsafe` assertion at `:6142-6146` — it is not
exemptible and it is correct. That one is doing all the work; the bounds are decoration that reads
like a floor.

**Fix:**
Either derive the bound from something the exemption cannot control (e.g. assert the exempt cell
count is a strict *minority* of the loader-accepted corpus), or delete the bound and say so. For the
equality, split it:

```ts
const disagreeing = new Set(disagreements.map(d => d.split("\t")[0]));
const exemptSet   = new Set(expectedExempt);
expect([...disagreeing].filter(w => !exemptSet.has(w))).toEqual([]);   // no unexplained disagreement
for (const e of EXEMPTIONS) expect(rowsDisagreeing.get(e.label) ?? 0).toBeGreaterThan(0); // no dead exemption
```

---

### WR-05: `classifyDelimiter`'s leading-residue refusal names the first code point of the line, not the code point that made the run residue

**File:** `scripts/frontmatter.ts:1679-1683`

**Issue:**

```ts
if (run.kind !== "none") {
  faults.push(
    `its leading residue renders no glyph of its own and begins with ${codePointLabel(line.codePointAt(0) ?? 0)}, …`,
  );
}
```

For ` <ZWSP>---` the message reads *"its leading residue … begins with U+0020"* — pointing the reader
at an ordinary space, which is inside `DELIMITER_WS_CHAR` and is not why the line refused. The whole
point of the D-44/D-50 refusal wording is to name the offending byte so a reader is sent to the right
character; here they are sent to a legal one. `leadingInvisibleRun` already visits the offending code
point when it clears `allDeclared` and discards it.

**Fix:** Carry it. Widen `LeadingRun`'s residue arm to `{ kind: "residue"; length: number; firstOutsideDeclared: number }`,
set it at `frontmatter.ts:1581`, and interpolate that instead of `line.codePointAt(0)`.

---

## Info

### IN-01: `kit-model.ts`'s `MARKDOWN_EXT` comment states a fact the same file contradicts twice

**File:** `scripts/kit-model.ts:185-188`, contradicted at `:567` and `:728`

**Issue:** The comment reads *"Named once because two rules below turn on it — 'is this a
frontmatter-bearing adapter surface' and 'does the exempt directory carry an adapter' — and a second
spelling of one fact is the drift class this module deletes even when the fact is three characters
long."* The constant is referenced at exactly **one** site (`:851`), while the literal `".md"` is
spelled at `:567` (`listRoles`) and `:728` (`listAgentAdapters`). The anti-drift device drifted from
itself, in the file whose thesis is that a fact has one statement.

**Fix:** Use `MARKDOWN_EXT` at `:567` and `:728`, or correct the comment to say which single rule
turns on it and why the other two do not.

---

### IN-02: after 27-46, a foreign key claimed by two buckets loses its multiplicity entirely — `doubleClaimed` structurally cannot report it

**File:** `scripts/kit-model.ts:474-503`

**Issue:** `doubleClaimed` filters over `schemaKeys`, so it can only ever name a **schema** key claimed
twice. Before 27-46 the `foreign` arm's duplication was the only visible trace of a *non-schema* key
claimed by two buckets; the de-duplication removes it and nothing replaces it. The arm comment says
"Both arms now answer the membership question the same way" — true of de-duplication, but the two
arms cover different domains, and the multiplicity of a foreign double-claim is now unreportable
rather than reported once. The new case at `kit-model.test.ts:906` (`["agents"], ["themes"],
["themes"], []`) asserts `doubleClaimed: []` for exactly that input, pinning the blind spot as
expected behaviour.

**Fix (or record as a decision):** filter `doubleClaimed` over `new Set([...schemaKeys, ...claimedKeys])`
so a double-claimed foreign key lands in both arms once each, which is what a human reading the
guard's failure message needs in order to fix both buckets.

---

### IN-03: the "PURE BY CONSTRUCTION" case slices `frontmatter.ts` with `indexOf("\n}")` and never asserts the slice is the function

**File:** `scripts/frontmatter.test.ts:7299-7318`

**Issue:** The forbidden-substring checks run over `src.slice(start, src.indexOf("\n}", start))`. That
happens to be the function body today only because no `}` inside it sits at column 0. A future
reformat (a prettier width change, an object literal broken differently) can shrink the slice to a
few lines and every `expect(body).not.toContain(...)` then passes vacuously — the exact
"assertion that cannot fail" shape this plan closed twice elsewhere in the same round.

**Fix:** Assert the slice is the thing you meant to inspect before inspecting it:

```ts
expect(body).toContain("GRANT_OCCURRENCE_KINDS.reduce");
expect(body).toContain("balanced: false");
expect(body.split("\n").length).toBeGreaterThan(10);
```

---

### IN-04: the round-8 role-adapter fixture strips fence DELIMITERS and leaves fenced CONTENT live in the body

**File:** `scripts/generate-role-adapters.test.ts:489-491`

**Issue:**

```ts
const noFences = lines.filter((l) => !l.startsWith("```"));
expect(noFences.length).toBeLessThan(lines.length); // the fixture really did carry fences
writeFileSync(p, noFences.join("\n"));
```

Only the delimiter lines are removed; everything that was *inside* the fences becomes live prose in a
role file whose frontmatter region now runs to EOF. The only guard is that at least one line was
removed. Today the unterminated diagnosis fires; the day a fenced example inside `SAMPLE_ROLES` gains
a column-0 `---` or a column-0 key line, this case silently starts pinning a different refusal (or a
successful parse) while staying green. The sibling case added below it depends on the same fixture in
the opposite direction, so the two can drift apart without either failing.

**Fix:** Remove fenced blocks *and their contents* (drop lines between toggles, the same rule
`stripFencedBlocks` applies), and assert positively that the resulting file contains no `---` after
line 0 before writing it — so the case's premise is checked rather than assumed.

---

_Reviewed: 2026-08-09T15:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
