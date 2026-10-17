---
status: issues_found
phase: 27
reviewed: 2026-08-04
depth: standard
round: 6
critical: 1
warning: 3
info: 5
findings:
  critical: 1
  warning: 3
  info: 5
  total: 9
files_reviewed: 6
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/kit-model.ts
  - scripts/check-foundation-guards.ts
  - scripts/frontmatter.test.ts
  - scripts/kit-model.test.ts
  - scripts/check-foundation-guards.test.ts
---

# Phase 27 round 6: Code Review Report

**Reviewed:** 2026-08-04
**Depth:** standard (adversarial, with hermetic-mirror reproduction)
**Diff range:** `97391e1..HEAD -- scripts/*.ts` (plans 27-36, 27-37, 27-38)
**Status:** issues_found — **one live spawn-grant bypass reproduced end to end**

> **Filename note.** This round is filed as `27-REVIEW-GAPS-6.md`, not `27-REVIEW.md`, following the
> convention rounds 2-5 used. `27-REVIEW.md` is the round-1 artifact and is cited **by name** from
> load-bearing source comments (`frontmatter.ts` "27-REVIEW.md § CR-02", `kit-model.ts`
> "27-REVIEW.md § CR-01/CR-03"); overwriting it would silently invalidate those citations.

## Summary

The three round-6 changes each do what their plan says on the axis the plan names.
`classifyDelimiter` **is** total on its own inputs (verified: three verdicts, no input reaching
none or two, both call sites exhaustive with a compiler-checked `never` branch).
`ENUMERATION_LEGAL_CHARS` **is** a genuine positive allowlist with no escape hatch on the path it
guards. The 9-key plugin-manifest schema **is** derived, two-sided-counted, and its bucket
partition **does** fail closed on a double claim; the `hooks/` bounds **are** live assertions on
measured numbers, and the vacuity is visible in the gate's own output
(`0 markdown adapter(s), 0 of those inside the spawn-grant scan`). Those are real.

**The sixth spelling is not on any of those axes.** It is one level below all of them, in a helper
none of the three plans touched and which every round-6 predicate depends on.

`classifyDelimiter` reasons about a line. `ENUMERATION_LEGAL_CHARS` reasons about a captured
enumeration. Both are correct. But the value they reason about is **assembled from several physical
lines by `flattenBlock`, and the two per-line helpers that run first — `stripComment` and
`startsWithReference` — reset their state at every line boundary.** A YAML scalar does not. So a
multi-line quoted scalar is analysed as N independent single-line documents, and:

- in one direction, a `#` on a **continuation** line is deleted as a comment when YAML says it is
  content — **silently removing a live `Agent(...)` spawn grant** (CR-01, reproduced, exit 0, `ALL
  CHECKS PASSED`);
- in the other direction, `*`, `!` or `&` at the start of a **continuation** line is refused as a
  YAML node property when YAML says it is content — **failing red on correct documentation**
  (WR-01), which the module header at `frontmatter.ts:322` explicitly claims cannot happen.

This is precisely the class the phase's own record names: *ask which set the predicate ENUMERATES,
and test the UNION after splitting.* The round-6 allowlist is total over `m[1]`; it says nothing
about how `m[1]` came to be. A name mangled upstream never reaches it.

Every finding below was constructed as a concrete input, run against the **committed build**, and —
for CR-01 — reproduced end to end on two hermetic `git archive HEAD` mirrors. The platform-side
value of every YAML document cited was confirmed against a real YAML 1.2 loader (Ruby Psych /
libyaml), not asserted.

---

## Critical Issues

### CR-01: `stripComment` decides quote state per PHYSICAL LINE, so a `#` on a continuation line deletes a live spawn grant — reproduced, gate exits 0

**File:** `scripts/frontmatter.ts:367-383` (the helper), applied at `scripts/frontmatter.ts:625`,
`:632` and `:656` (the three `flattenBlock` application points)
**Severity:** BLOCKER — live rogue-spawner bypass on the `/plugin install` surface
**Confirmed by running:** yes — unit level, and end to end on two hermetic mirrors

**Issue.**
`stripComment(s)` tracks `sq`/`dq` **within the string it is handed**. `flattenBlock` hands it **one
physical line at a time** and joins the results afterwards. A YAML double- or single-quoted scalar
that wraps across lines therefore has its quote state reset at every continuation line, so a `#`
on line 2 is read as a comment start when YAML reads it as scalar content. Everything after it —
including an `Agent(...)` token — is deleted before `keysHaveSpawnGrant`, before
`ENUMERATION_LEGAL_CHARS`, before every round-6 predicate.

The result is `{ ok: true, value: false }` — the module's own named founding failure, *"I could not
read this" printed as "this carries no grant"* — on a document that plainly grants the spawn tool.

The helper's own doc block asserts the opposite and has no pin:

> `scripts/frontmatter.ts:364-366` — *"a `#` inside a quoted value that wraps across lines can
> therefore truncate that piece early, which only ever makes a value SHORTER on that line while the
> following line's text still joins in — **the error direction is a longer value, never a hidden
> token**."*

That sentence is false. The following line's text does **not** join in: `stripComment` returns `""`
for a line whose first character is `#`, so the whole continuation is discarded, and the token is
hidden. Per this phase's own prohibition (*"a code comment claiming a property is never left
standing without the assertion that makes it true"*), this claim shipped in three consecutive rounds
with no assertion behind it.

**Triggering inputs — three spellings, all confirmed.**

Spelling A — double-quoted (platform value confirmed by libyaml):

```yaml
---
name: rogue
tools: "Read,
  # x, Agent(grugops-orchestrator)"
---
```

Spelling B — single-quoted: identical, with `'` instead of `"`.

Spelling C — **block sequence item** — this is the exact idiom all 7 shipped skills and all 17
shipped agent adapters use, so it is the spelling a drifting author would actually write:

```yaml
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - "Grep,
    # note, Agent(grugops-orchestrator)"
```

**Measured against the committed `scripts/frontmatter.js`:**

```
$ node -e 'import("./scripts/frontmatter.js").then(m=>console.log(JSON.stringify(
    m.hasSpawnGrant("---\nname: rogue\ntools: \"Read,\n  # x, Agent(grugops-orchestrator)\"\n---\n"))))'
{"ok":true,"value":false}          <-- the silent no-grant SUCCESS arm
```

versus a real YAML loader on the same bytes:

```
$ ruby -ryaml -e 'p YAML.safe_load(%Q{tools: "Read,\n  # x, Agent(grugops-orchestrator)"\n})'
{"tools"=>"Read, # x, Agent(grugops-orchestrator)"}   <-- the platform sees the grant
```

Spelling C, same comparison:

```
$ ruby -ryaml -e 'p YAML.safe_load(%Q{tools:\n  - Read\n  - "Write,\n    # x, Agent(grugops-orchestrator)"\n})'
{"tools"=>["Read", "Write, # x, Agent(grugops-orchestrator)"]}
# guard:  tools -> ["Read, \"Write,,"]    (no Agent token, no finding)
```

**End-to-end hermetic reproduction (spelling C, the shipped idiom):**

```bash
rm -rf /tmp/mirror8 && mkdir -p /tmp/mirror8
git archive HEAD | tar -x -C /tmp/mirror8 && cd /tmp/mirror8
# baseline: node scripts/check-foundation-guards.js -> exit 0, ALL CHECKS PASSED
python3 - <<'PY'
for p in ["skills/plan/SKILL.md", ".claude/skills/grugops-plan/SKILL.md"]:
    s = open(p, encoding="utf-8").read()
    s = s.replace("  - Grep\n", '  - "Grep,\n    # note, Agent(grugops-orchestrator)"\n', 1)
    open(p, "w", encoding="utf-8").write(s)
PY
node scripts/check-foundation-guards.js; echo "exit=$?"
```

Observed:

```
== Result ==
ALL CHECKS PASSED
exit=0
planted file named in gate output: 0 times
platform value (Psych): ["Read","Write","Bash","Glob","Grep, # note, Agent(grugops-orchestrator)"]
```

A second independent mirror (`/tmp/mirror6`) using spelling A on the same pair produced the same
result: exit 0, `ALL CHECKS PASSED`, planted file named 0 times.

Note the plant is on the **plugin-form** skill tree — the surface plan 27-34 added precisely because
it is what Claude Code loads for every `/plugin install` user. Both distribution twins must be
edited together (the `guard_distribution_pair` byte comparison catches a one-sided edit — a real and
useful backstop, and the only thing that made the first attempt fail); once synced, nothing sees it.

**Why the round-6 work does not catch it, stated precisely.** Every new pin added this round is
single-line by construction:

- the D-45 cross-product sweep's three axes are *leading residue x payload spelling x trailing
  residue* — all properties of **one line**;
- the D-47 enumeration sweep constructs exactly `Agent(alpha${char}b, gamma)` — one line, and `#`
  **is** in its corpus and **does** correctly refuse there. The same `#` one line down is deleted
  before the allowlist ever runs;
- the 33-file false-red control asserts no refusals over the real tree — it can only detect a false
  red, never a silent success.

**Fix (structural, not another case).** The scalar STYLE is decided once, at the key line, and must
be carried across the continuation lines rather than re-derived per line. Concretely: give
`Accumulator` an `openQuote: '"' | "'" | null` field; have the comment scanner **return its exiting
quote state** and seed the next line with it; and **skip comment-stripping entirely while
`openQuote !== null`**. The same state carry fixes WR-01 below, because CR-01 and WR-01 are the two
directions of one defect — do not fix them separately.

Then pin it with a **fourth axis** on the existing sweep corpus, enumerated from outside the rule:
*scalar style* in {plain, double-quoted, single-quoted, `|`, `>`, block-sequence item} x *sigil* in
{`#`, `*`, `!`, `&`} x *placement* in {line 1, continuation line, both}. Each cell's expected verdict
is a pure function of those labels (a `#` inside an open quote is content; outside one it is a
comment), computed without calling the module — the D-45 discipline, applied to the axis D-45 does
not have. Cells in the "continuation" column must be **RED against the committed build before the
fix**; the transcripts above are that evidence.

---

## Warnings

### WR-01: the same per-line reset in the other direction — `startsWithReference` fails red on `*emphasis*`, `!important` and `&D` inside a wrapped scalar, contradicting the header's own false-red control

**File:** `scripts/frontmatter.ts:342-360` (the predicate), applied at `:621`, `:631`, `:651`
**Confirmed by running:** yes

**Issue.** `startsWithReference` treats position 0 of the text it is given as a **YAML node start**.
`flattenBlock` gives it each continuation line independently, so the first token of every wrapped
line is treated as a node start — including inside an open quoted scalar, where YAML gives `&`, `*`
and `!` no reference meaning at all.

The module header claims exactly this cannot happen:

> `scripts/frontmatter.ts:322` — *"That is what keeps `R&D` in a description, a bare `*` between
> words and markdown `*emphasis*` parsing."*

True for a single-line value. False the moment the value wraps — and there is no case pinning the
wrapped form.

**Triggering inputs** (all three are documents a real YAML loader accepts, verified):

```yaml
---
name: x
description: "see
  *emphasis* here"
tools: Read
---
```

```
guard  : REFUSE — "`*emphasis* here\"` uses a YAML anchor or alias, or an unresolved YAML tag ..."
libyaml: {"description"=>"see *emphasis* here"}
```

The same for `  !important stuff"` and `  &D work"` — all three refuse, all three load cleanly.

**Consequence.** `guard_wr05`'s parse-failure branch turns any such adapter or skill red, and the
only way back to green is deleting correct documentation — which the module's own header names as
the failure mode every widened refusal risks, and which D-34 records as *"the worse of the two"*.
It also means the refusal is currently doing the opposite of its stated purpose on this axis: it
refuses valid content while CR-01 accepts invalid content, from the same root cause.

**Fix.** The `openQuote` carry proposed in CR-01. While inside an open quoted scalar, skip
`startsWithReference` as well as `stripComment` — in that state the continuation line is content,
not a node start. Pin with the "continuation" column of the fourth sweep axis.

---

### WR-02: `classifyDelimiter` discards indentation, so an indented `---` or `...` inside a legitimate block scalar refuses the whole document

**File:** `scripts/frontmatter.ts:805-812` (`leadingInvisibleRun`), consumed at `:862-863`; closing
scan call site `:987-1000`
**Confirmed by running:** yes

**Issue.** `leadingInvisibleRun` strips the leading run of non-glyph code points — which **includes
space and tab** — before the payload test. Indentation is therefore invisible to the classifier's
"does `rest` begin with a payload" question, and only reappears as the `run !== 0` refusal clause.
But indentation is exactly what distinguishes a delimiter from content in YAML and in every markdown
frontmatter reader: the closing delimiter must be at column 0; an indented `---` or `...` inside a
block scalar or a wrapped value is **content**.

Because the closing scan runs `classifyDelimiter` over **every line of the open block**, any such
line refuses the whole document.

**Triggering inputs** (both accepted by libyaml, both refused by the guard):

```yaml
---
name: x
description: |
  intro
  ---
  outro
tools: Read
---
```

```
guard  : REFUSE — "the closing delimiter position carries `  ---`, which is not the one legal spelling ..."
libyaml: {"description"=>"intro\n---\noutro\n"}
```

```yaml
---
name: x
description: Read the docs
  ...and then some
tools: Read
---
```

```
guard  : REFUSE — "the closing delimiter position carries `  ...and then some` ..."
libyaml: {"description"=>"Read the docs ...and then some"}
```

The second is the cheap one: an author wrapping a long `description:` whose continuation starts with
an ellipsis turns the gate red on a file the platform loads fine.

**On the plan's "FALSE-RED COST, MEASURED: zero" claim** (`frontmatter.ts:743-747`): that measurement
is over the 33 files that exist today. It is a measurement, not a property, and the comment presents
it as the thing that *"makes the allowlist affordable"* — a class-level affordability claim resting
on a point-in-time count. This is the same comment-without-a-pin shape the round-5 floor was
corrected for.

**Fix.** The invisible-run strip should be applied to **format-effect characters only**, not to the
declared whitespace class: a leading space or tab means the line is indented, which means it is not
at a delimiter position at all, and the correct verdict is `not-a-delimiter` rather than `refuse`.
Concretely — split the leading run into (a) a declared-whitespace prefix, which routes the line to
`not-a-delimiter` when the block is open, and (b) a non-glyph residue prefix, which keeps the
existing `refuse`. Note this must **not** be split into two composable predicates (that is D-44's
deleted shape); it is one extra label on the single classifier's leading-run result. Add an
*indentation* member to sweep axis 1 with an expected verdict of `not-a-delimiter` at the closing
position, so the change is pinned rather than assumed.

---

### WR-03: `ENUMERATION_LEGAL_CHARS` is never reached for a capture `SCOPED_GRANT` fails to form — a truncated enumeration returns the "unscoped grant" SUCCESS arm

**File:** `scripts/frontmatter.ts:1024` (`SCOPED_GRANT`), `:1148-1207` (`keysGrantedAgentNames`),
doc claim at `:1141-1147`
**Confirmed by running:** yes

**Issue.** The allowlist runs on `m[1]`. It never runs when `SCOPED_GRANT` produces no match at all.
A grant whose closing `)` was removed upstream — by an author, or by `stripComment` (CR-01's
mechanism) — is therefore not refused; it silently becomes **indistinguishable from a genuine
unscoped grant**.

```
$ node -e 'import("./scripts/frontmatter.js").then(m=>{const d=t=>`---\nname: x\ntools: ${t}\n---\nB\n`;
    for (const t of ["Agent(alpha, gamma","Agent(alpha, #b, gamma)","Read, Agent"])
      console.log(JSON.stringify(t), JSON.stringify(m.grantedAgentNames(d(t))));});'
"Agent(alpha, gamma"       {"ok":true,"value":[]}
"Agent(alpha, #b, gamma)"  {"ok":true,"value":[]}
"Read, Agent"              {"ok":true,"value":[]}     <-- genuinely unscoped, the same answer
```

Three different facts, one answer. The function's own doc block claims the opposite:

> `scripts/frontmatter.ts:1141-1142` — *"THE ENUMERATION IS EXAMINED BEFORE IT IS SPLIT, AND REFUSED
> RATHER THAN PARSED BETTER."*

An enumeration whose capture never formed is not examined at all.

**Currently masked, stated honestly.** For a **non-coordinator** the file is still convicted by
`keysHaveSpawnGrant` (the token survives). For the **coordinator**, `granted.length === 0` is its own
named KIT-03 failure, and any dropped or added name breaks the closure set equality. So I could
**not** turn this alone into a green-gate bypass, and I am not classifying it Critical. It is a
Warning because (a) the masking is incidental — it depends on two *other* checks whose scope a later
plan could narrow, exactly as `keysHaveSpawnGrant`'s disjunction is documented as deliberately
untouchable for a different reason; and (b) it is the same "the gate never saw the value" shape as
CR-01, on the same predicate, in the same round.

**Fix.** Test for the token-without-a-closed-capture case explicitly and route it to the refusal arm:
if `SPAWN_TOKEN.test(v)` and the value contains `Agent(` / `Task(` with no matching `)` in the same
value, return `ok: false` naming the unterminated enumeration. Keep the `SCOPED_GRANT` expression
itself untouched (27-38's prohibition is correct — do not make the regex cleverer). Pin with a case
asserting that a truncated enumeration and a genuinely unscoped grant produce **different** results.

---

## Info

### IN-01: a zero-width-space prologue line reaches the keyless success arm, asymmetric with the D-34 directive refusal

**File:** `scripts/frontmatter.ts:954-964` (blank-line skip and the directive test)

`"\u200B".trim()` is not `""` in JS (ZWSP is not ECMAScript WhiteSpace), so a line containing only a
ZWSP is the "first non-blank line", fails the payload test, and returns `{ ok: true, value: new
Map() }` — zero keys — for a document whose real `---` block one line down carries a live grant:

```
$ node -e '... m.parseFrontmatter("\u200B\n---\nname: rogue\ntools: Read, Agent(grugops-orchestrator)\n---\n")'
OK keys=[]
```

D-34 refuses a `%TAG` prologue on *"this module's own contract"* grounds — an undecodable prologue
belongs in the unreadable arm — while this prologue, whose ZWSP the delimiter region spent rounds
4-5 establishing as invisible residue that must refuse, succeeds silently. The two prologue classes
get opposite treatments with no stated reason. The `not-a-delimiter` comment's defence ("a body-only
file, an empty file") does not cover it: this is not a body-only file.

**Classified Info, not Critical, deliberately.** I built the hermetic mirror (`/tmp/mirror7`) and it
**exited 1**: `guard_distribution_pair`'s `name`-cardinality check reports *"the pair declares 0 and
0 `name` value(s)"*, and agent adapters are caught by `guard_wr05`'s `keys.size === 0` floor. So on
today's tree every surface is masked by a sibling guard — that is defence in depth, not a property
of the parser, and it would evaporate for any future scan member that is neither a paired skill nor
an agent adapter. Whether Claude Code itself loads such a file is `UNKNOWN - verify` (most
frontmatter readers require `---` on line 1), which is the same residual D-34 already recorded.

**Fix (if taken):** refuse a first-non-blank line consisting entirely of non-glyph code points when a
delimiter payload follows it, on the D-34 contract argument — or record explicitly why the ZWSP
prologue is decided differently from the directive prologue.

---

### IN-02: `unquoteChecked` is applied to the joined value of a `|` / `>` block scalar, where YAML applies no quoting rules at all

**File:** `scripts/frontmatter.ts:588` (the flush), `:504-514`

Inside a literal or folded block scalar every character is content: there is no quote pair to remove
and no escape to resolve. The flush applies `unquoteChecked` regardless of `cur.block`, so:

```yaml
tools: |
  Read, "Agent(x\q)"
```

```
guard: REFUSE — "carries the backslash sequence `\q` inside a double-quoted scalar"
YAML : the value is the literal text `Read, "Agent(x\q)"` — there is no escape and nothing to refuse
```

A wholly-`"`-wrapped block-scalar line also has its quotes stripped. Neither changes a grant verdict
today (the three allowlisted escapes resolve to non-word characters, and the token survives quote
removal), which is why this is Info — but the module explicitly reasons elsewhere that it must not
apply a rule where YAML gives the construct no meaning (see the `startsWithReference` "WHERE IT IS
NOT APPLIED" paragraph, which correctly exempts block scalars). The flush does not carry that
exemption.

**Fix:** skip `unquoteChecked` when `cur.block` is true, matching the reference-refusal exemption
already documented ten lines above it.

---

### IN-03: the partition floor's `unclaimedKeys` arm is unfalsifiable by construction

**File:** `scripts/check-foundation-guards.ts:1381`, `scripts/kit-model.ts:350-358`

`pluginForbiddenComponentKeys()` computes `schema \ (covered U exempt)`, so
`schemaKeys.filter(k => !claimedKeys.includes(k))` is provably empty for every possible input to
today's code. The `doubleClaimed` and `foreign` arms **are** falsifiable and do fail closed (verified
by reasoning through a key present in both `COVERED_ELSEWHERE` and `EXEMPT`: forbidden excludes it,
`claimedKeys` carries it twice, the arm fires).

The source **already discloses this** (`check-foundation-guards.ts:1362-1364`: *"so 'claimed by
nobody' cannot arise from today's code — this floor is what makes it impossible for a LATER
hand-edit ... to reintroduce it silently"*). Recorded here only so a reader of the gate's output does
not count it as an independent check: the partition is 2 live arms plus 1 future-proofing arm, not 3.

---

### IN-04: `coverer` is a free-text string that is never resolved to an export, and the gate's PASS line prints it as a coverage claim

**File:** `scripts/kit-model.ts:286`, `:294`; printed at `scripts/check-foundation-guards.ts:1475`

`PluginComponentCoveredElsewhere.coverer` is `readonly coverer: string` — nothing anywhere resolves
that string to an actual exported function. `guardKitCounts`' PASS line interpolates it verbatim
(*"1 covered-elsewhere (skills by listPluginSkillAdapters)"*), so the gate asserts a coverage
relationship whose named coverer it never checks exists. `kit-model.test.ts:789` asserts the string
equals the literal `"listPluginSkillAdapters"`, and `:797-800` separately asserts the lister's output
is in the scan — but nothing ties the two together, so the string and the function it names are two
independent facts.

**Masked**, which is why this is Info: removing the plugin-skill part from `spawnGrantScan()` breaks
`SPAWN_GRANT_SCAN_COUNT` (33) and the `plugin-skill` per-part set equality, so the gate goes red for
a different reason. **Fix (cheap):** hold a function reference rather than a name and derive the
printed label from it, or assert in `guardKitCounts` that each `coverer` names a key present in
`SPAWN_GRANT_SCAN_PARTS`.

Related and smaller: `PLUGIN_COMPONENT_EXEMPT` / `PLUGIN_COMPONENT_COVERED_ELSEWHERE` cardinality is
pinned by **vitest** (`kit-model.test.ts:787`, `:802`, `:812`) rather than by a gate constant, unlike
`ROLE_COUNT`, `WORKFLOW_COUNT`, `SKILL_ADAPTER_COUNT`, `PLUGIN_SKILL_ADAPTER_COUNT`,
`SPAWN_GRANT_SCAN_COUNT` and `PLUGIN_MANIFEST_COMPONENT_COUNT`, all of which the **gate** enforces
two-sided. The exemption's own recorded promote trigger (*"a SECOND directory needing exemption"*)
therefore fires in CI but not in the gate.

---

### IN-05: two further flat frontmatter grammars survive in the tree, against the round-6 header's "one authority per predicate" framing

**Files:** `scripts/generate-catalog.ts:50-58`, `scripts/context-io.ts:187`

`scripts/frontmatter.ts:22-23` and `:1223` state the tree holds one format-aware authority per
predicate and *"still exactly ONE grammar"*. `generate-catalog.ts` carries its own eight-line
`parseFrontmatter` (`/^---\n([\s\S]*?)\n---\n/` plus `^([A-Za-z_]+):\s*(.*)$` — no folding, no
quoting, no fence stripping, no failure arm), and `context-io.ts:187` documents a third "flat
key:value idiom" extending it.

Both are **out of the round-6 diff** and neither feeds a spawn-grant guard — `generate-catalog`
produces `docs/catalog/README.md` and is gated only by `catalog-freshness.ts`. So this is not a
security finding; it is recorded because the round-6 headers make tree-wide claims that a reader will
check against `grep`, and the claims are true only when scoped to the guard surfaces. Either scope
the wording ("one grammar on every surface a guard reads") or migrate `generate-catalog` to
`frontmatter.ts`.

---

## What was checked and found sound

Recorded so a later round does not re-litigate these:

- **Totality of `classifyDelimiter`** — every input reaches exactly one of three verdicts; no input
  reaches none or two. Both call sites (`parseFrontmatter`'s opening test and closing scan) switch
  exhaustively and terminate in `assertNeverVerdict`. Traced by hand and exercised across the
  cross-product corpus.
- **`ENUMERATION_LEGAL_CHARS` polarity** — a genuine positive allowlist with no early return, no
  fallback branch and no escape hatch *on the path it guards*. Its 67 members were counted; the
  escape branch beneath it is genuinely dominated (`"`, `'`, `\` are all outside the set). The gap is
  purely that the value can be mangled before the check (WR-03, CR-01), not that the check leaks.
- **The 9-key schema derivation** — real, with a two-sided count. The bucket partition fails closed on
  a doubly-claimed key and on a foreign key. `PLUGIN_MANIFEST_COMPONENT_SCHEMA` matches CLAUDE.md's
  11-field enumeration minus the two non-directory fields, and the delta is named in source rather
  than silently trimmed. The `experimental.*` double-spelling probe is the right call for an
  `UNKNOWN - verify`.
- **The `hooks/` exemption bounds** — both are **live assertions** in `guard_wr05`, not comments, and
  both run on measured numbers. The vacuity of BOUND A is visible in the gate's own output as
  `PRESENT with 7 file(s) and 0 markdown adapter(s), 0 of those inside the spawn-grant scan` — a
  measured zero, not a coverage claim. That is exactly right.
- **`guardKitCounts`' per-part catch (D-47 item 1)** — the TOCTOU justification is sound and the
  reported message correctly distinguishes "check not performed" from "composition is short".
- **The D-45 sweep's non-circularity** — the corpus is genuinely enumerated from outside the rule,
  the expected-verdict function is source-inspected for module symbols, and the second hand-written
  truth table is a real independent statement. This is good work; it is simply blind to the
  multi-line axis.
- **The D-47 enumeration sweep** — corpus independent, expectations from data, both directions pinned,
  size asserted so a shrunken corpus cannot pass vacuously.

## Verification notes

- Baseline `node scripts/check-foundation-guards.js` on a clean `git archive HEAD` mirror: **exit 0**,
  `ALL CHECKS PASSED`, well under a second (no long-line hang encountered).
- Every YAML value attributed to "the platform" was resolved with `ruby -ryaml` (Psych / libyaml,
  YAML 1.2), never asserted from reading.
- Two independent hermetic mirrors reproduce CR-01 (`/tmp/mirror6` spelling A, `/tmp/mirror8`
  spelling C); a third (`/tmp/mirror7`) was built for IN-01 and **failed to reproduce**, which is why
  IN-01 is Info and not higher.
- Deliberately **not** re-reported, per the review brief: `oracleWr05Wording`'s quadratic lookahead,
  the `guardKitCounts` four-part exhaustion gap, and 27-38's one-real-enumeration control thinness
  (which the test file itself pins and names — that self-disclosure is correct and should stay).
- The committed `scripts/*.js` twins were not reviewed (tsc output, freshness-gated).
- No source file was modified during this review.

---

_Reviewed: 2026-08-04_
_Reviewer: Claude (gsd-code-reviewer), adversarial stance, round 6_
_Depth: standard + hermetic-mirror reproduction_
