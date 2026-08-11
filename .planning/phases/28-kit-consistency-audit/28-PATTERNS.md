# Phase 28: Kit Consistency Audit - Pattern Map

**Mapped:** 2026-08-11
**Files analyzed:** 11 new/modified (4 new `scripts/*.ts` + their `.js` + tests, 2 script edits, 3 new `docs/` artifacts, N drift-fix markdown edits)
**Analogs found:** 11 / 11 (every new file has a close in-repo analog; no file falls back to RESEARCH.md — none exists for this phase)

> **Repo-wide rule that governs every row below (CLAUDE.md hard constraint):** every `scripts/*.ts`
> ships with its **committed `.js`** built by `tsc`, and `scripts/freshness.ts` proves the pair.
> There is **no registration step** — see "Shared Patterns → Committed-`.js` obligation".

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/<audit-completeness>.ts` (D-05 register completeness gate) | gate/validator | file-I/O + set-equality | `scripts/check-foundation-guards.ts` § `guardKitCounts()` (L1400-1670) | exact |
| `scripts/<public-docs-vocabulary>.ts` (D-09 third `dead-vocabulary` consumer) | gate/validator | file-walk + grep-to-zero | `scripts/check-kit-refs.ts` L37-181 (SCAN/GH_SCAN + `walk()` + `grepSubstring()`) | exact |
| `scripts/<claim-anchors>.ts` (D-16 anchor↔row bijection + verbatim) | gate/validator | file-I/O + two-sided set equality | `guardKitCounts()` per-part **set** equality (L1560-1570) + `check-kit-refs` Assertion 3 | role-match |
| `scripts/<audit-prepass>.ts` (D-06 mechanical evidence pre-pass) | reporter (re-runnable) | file-walk + evidence rows | `scripts/check-uat-oracles.ts` `grepFiles()` (L86-99) over a derived 36-file set | role-match |
| `scripts/dead-vocabulary.ts` **(edit — D-10 header extension only)** | data module | declarative | itself (L1-49); do **not** add tokens | exact |
| `scripts/check-uat-oracles.ts` **(edit — D-20)** | oracle | line-grep | itself L86-134 + `kit-model.ts` `MAX_WALK_ENTRIES` for the input bound | exact |
| `scripts/canonical-frontmatter.ts` / `frontmatter.ts` **(edit — D-21, conditional)** | admission reader | transform | itself; harness = `scripts/frontmatter.test.ts` + `canonical-corpus.test.ts` | exact |
| `scripts/*.test.ts` (one per new script) | test | assertions | `scripts/kit-model.test.ts` L255-266, L668-678 | exact |
| `docs/<disposition-register>.md` (D-05) | durable artifact parsed by a gate | batch parse | `docs/catalog/README.md` (generated + gated by `catalog-freshness.ts`) | partial |
| `docs/<claim-registry>.md` (D-13) | durable artifact parsed by a gate | batch parse | same | partial |
| `docs/<safety-surface-exclusions>.md` (D-18) | **derived** artifact | batch parse | same — prefer *generated + freshness-gated* over hand-written | partial |
| `README.md`, `CLAUDE.md`, `AGENTS.md`, `agent-factory/README.md`, `examples/*.md` | content | n/a | n/a — prose edits driven by D-08/D-11 | n/a |

---

## Pattern Assignments

### 1. `scripts/<audit-completeness>.ts` — D-05, D-03's two equalities

**Analog:** `scripts/check-foundation-guards.ts` (`guardKitCounts`, L1400-1670)

**Imports pattern** — take the listers from the one authority, never re-derive:
```ts
// scripts/check-kit-refs.ts:43-45
// Phase 27 (KIT-02 / plan 27-11): the adapter set is derived ONCE, in scripts/kit-model.ts. This
// gate used to carry its own recursive copy of the rule; the copy is deleted, not kept in sync.
import { listAgentAdapters, listSkillAdapters } from "./kit-model.js";
```
For this gate: `import { listRoles, listWorkflows } from "./kit-model.js";`

**Root resolution + PASS/FAIL harness** (copy verbatim; `CHECK_ROOT` is load-bearing — the vitest
harness plants violations into a hermetic mirror and points `CHECK_ROOT` at it):
```ts
// scripts/check-uat-oracles.ts:64-79 (identical in check-kit-refs.ts:49-51,126-132)
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

let FAILS = 0;
const pass = (m: string): void => { process.stdout.write(`  PASS  ${m}\n`); };
const fail = (m: string): void => { process.stdout.write(`  FAIL  ${m}\n`); FAILS += 1; };
```

**Count-assertion shape** — accumulate into a `countFail` string, each message naming the derived
number, the expected number, and *what the author must walk before changing it*:
```ts
// check-foundation-guards.ts:1405-1410
if (ROLE_FILES.length !== ROLE_COUNT) {
  countFail += `\nkit count: derived ${ROLE_FILES.length} role files, expected exactly ${ROLE_COUNT} — walk every derived consumer (guard_voice, guard_caveman_preserved, guard_role_size, CTX_SCAN, roleCeiling) BEFORE updating ROLE_COUNT in scripts/kit-model.ts`;
}
```

**Equality that must be SET equality, not a count** (D-03's second equality and D-16 both need this
exact argument — quote it in the plan):
```ts
// check-foundation-guards.ts:1563-1567
if (inComposition.join("\n") !== expected.join("\n")) {
  const missing = expected.filter((f) => !inComposition.includes(f));
  const extra = inComposition.filter((f) => !expected.includes(f));
  countFail += `\nkit count: the spawn-grant scan composition's ${part.name} members are not exactly what ${part.prefix} derives — missing [${missing.join(", ")}], unexpected [${extra.join(", ")}]. This is SET equality on purpose: a count would pass while a decoy displaced a real member inside one part`;
}
```

**PASS line that names its inputs** (the D-05 requirement — *print the counts you actually read*):
```ts
// check-foundation-guards.ts:1656
pass(
  `kit counts: derived ${ROLE_FILES.length} roles, ${WORKFLOW_FILES.length} workflows, ${SKILL_ADAPTERS.length} skill adapters and ${PLUGIN_SKILL_RELS.length} plugin-form skill adapters (expected ${ROLE_COUNT} / ${WORKFLOW_COUNT} / ${SKILL_ADAPTER_COUNT} / ${PLUGIN_SKILL_ADAPTER_COUNT}); …`,
);
```
And the standing rule attached to it (`check-foundation-guards.ts:1648-1654`), which D-05's gate
inherits: *"A PASS line must never state a check that was not performed."*

**Where D-04's closed disposition set goes.** The `fourth value fails the gate` requirement has an
exact precedent in the exemption/partition floors: enumerate the legal set once, compute the
complement, and name a foreign member — see `kit-model.ts:488-496` (`pluginForbiddenComponentKeys`,
"COMPUTED … and NEVER written down a second time") and `partitionPluginComponentClaims` (L545-614)
for the `unclaimed` / `doubleClaimed` / `foreign` arm shape. Note the lesson recorded at L580-605:
**after splitting a predicate into arms, test their UNION.**

**Vacuity floor** — mandatory, and it must be written over the *derived* quantity:
```ts
// kit-model.ts:663-670
function refuseEmpty(files: string[], dir: string, kind: string): string[] {
  if (files.length === 0) {
    throw new Error(
      `kit-model: no ${kind} files found in ${dir} — refusing to return an empty set (a vacuous scan set passes every guard)`,
    );
  }
  return files;
}
```
plus the correction at `check-foundation-guards.ts:1250-1262`: the old floor tested the **total**
scanned (which always included an always-present literal) so the branch was unreachable — *"A floor
written over the wrong quantity is worse than no floor."*

---

### 2. `scripts/<public-docs-vocabulary>.ts` — D-09, third consumer of `dead-vocabulary.ts`

**Analogs:** `scripts/check-kit-refs.ts` L37-181 (consumer #1, PATH forms) and
`scripts/check-foundation-guards.ts` `guardAdapterBody()` L1170-1275 (consumer #2, PROSE forms).

**How consumer #1 imports the list:**
```ts
// scripts/check-kit-refs.ts:39-42
// Phase 27 (SPAWN-05 / D-24): the retired-vocabulary literals are single-source. This gate takes the
// PATH form; guard_adapter_body in check-foundation-guards.ts takes the PROSE forms. Two different
// predicates over two different inputs, one list.
import { RETIRED_PATH_FORMS } from "./dead-vocabulary.js";
```

**How consumer #2 imports and applies it** (case-insensitive on the negative half; the list stores
lowercase only):
```ts
// scripts/check-foundation-guards.ts:1189-1196
const lowered = body.toLowerCase();
for (const phrase of RETIRED_PROSE_FORMS) {
  if (lowered.includes(phrase)) {
    bodyFail += `\n${f}: carries retired memory-relay vocabulary "${phrase}" — the 17 static handoff templates were deleted in Phase 24 and the shared verified context replaced the relay`;
  }
}
```

**The scan-set / named-exclusion shape D-09 copies (and must NOT widen)** — quote this comment in
the plan, because it is the contract D-09 promises to leave untouched:
```ts
// scripts/check-kit-refs.ts:53-75
// ---------------------------------------------------------------------------
// Explicit SCAN path list — the D-08 "shipped kit + adapters + AGENTS.md". NEVER a repo-wide
// grep. By NOT listing them, this excludes scripts/fixtures/, agent-factory/examples/,
// agent-factory/README.md, install/, root README.md, CLAUDE.md, docs/, .planning/, and this
// script itself. …
// walk() below already recurses a directory entry, so naming the directory makes this membership
// self-deriving with no import at all. Every OTHER entry is unchanged: widening the scan is NOT
// what this change is for.
const SCAN = [
  "agent-factory/roles",
  "agent-factory/workflows",
  …
  "AGENTS.md",
];
```

**The walker + grep the new consumer reuses** (`check-kit-refs.ts:139-165`) — note it `.sort()`s
directory entries so two runs are byte-identical, and returns `path:lineno:line`:
```ts
function walk(rel: string, acc: string[]): string[] {
  const a = abs(rel);
  if (!existsSync(a)) return acc;
  const st = statSync(a);
  if (st.isDirectory()) {
    for (const entry of readdirSync(a).sort()) walk(join(rel, entry), acc);
  } else if (st.isFile()) acc.push(rel);
  return acc;
}

function grepSubstring(scan: string[], needle: string): string[] {
  const hits: string[] = [];
  for (const entry of scan) {
    for (const file of walk(entry, [])) {
      const lines = readText(file).split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(needle)) hits.push(`${file}:${i + 1}:${lines[i]}`);
      }
    }
  }
  return hits;
}
```
**D-09 difference:** membership is *derived* (root `*.md` via `readdirSync` filter, minus the
`CHANGELOG.md` exemption; plus `examples/` as a directory entry that self-derives through `walk()`;
plus `agent-factory/README.md` as a named literal) and **two-sided count-asserted**.

**The named-exemption idiom for `CHANGELOG.md` / `docs/`** — copy `DISTRIBUTION_PAIR_EXEMPT`
(`check-foundation-guards.ts:1700-1717`): a `readonly string[]`, its reason above it, its **bound**
stated, and the forbidden alternative named so it is not rediscovered as a good idea —
> *"THE FORBIDDEN ALTERNATIVE, NAMED SO IT IS NOT REDISCOVERED AS A GOOD IDEA: loosening the
> comparison so this one file passes … would delete the check for ALL SEVEN pairs to accommodate
> one. … If the divergence ever becomes structural, the answer is to widen the EXEMPTION LIST,
> never to weaken the assertion."*

and its PASS line reports the exemption inline:
```ts
// check-foundation-guards.ts:1817
pass(`D-40: ${compared} plugin/standalone skill pair(s) byte-identical …, ${exempted} exempted by name (${DISTRIBUTION_PAIR_EXEMPT.join(", ")} — <reason>; the exempted file is still inside the spawn-grant scan)`);
```

**D-10 header extension — the verbatim warning to extend** (`scripts/dead-vocabulary.ts:11-24`):
```ts
// ---------------------------------------------------------------------------------------------
// THE BOUNDARY A FUTURE EDITOR IS MOST LIKELY TO GET WRONG.
//
// SPAWN-05's own wording conflated two things that sit in the SAME surviving sentence. Only the
// memory-relay half is retired. The execution-topology half — "one window, prior context dropped
// between roles" — is STILL CORRECT: it describes how roles activate on the four non-spawning host
// CLIs, it is verbatim in agent-factory/packaging/subagent.frontmatter.md, and under the revised
// D-02 it is the degraded tier's own wording. NEVER add that phrasing, or any other "single window"
// prose, to RETIRED_PROSE_FORMS below: a guard banning it would fail red on text this project keeps
// on purpose, and the only way to go green again would be to delete correct text.
//
// What IS retired is the claim that a static artifact carries memory between roles. The shared
// verified context is the sole memory; nothing reopens that.
// ---------------------------------------------------------------------------------------------
```
D-10's `routes` warning goes **beside this block, in the same file**, in the same voice.
Also honor the module's self-exclusion note (`dead-vocabulary.ts:26-29`): *"THIS MODULE MUST NEVER BE
ADDED TO ANY GUARD'S SCAN SET"* — the new consumer's derived set must not reach `scripts/`.

---

### 3. `scripts/<claim-anchors>.ts` — D-16 bijection + verbatim-at-anchor

**Analogs:** the per-part SET equality above (`check-foundation-guards.ts:1563-1567`) for the
bijection message shape, and `check-kit-refs.ts` **Assertion 3** for the "derived legal set, equality
in BOTH directions" argument:
```ts
// scripts/check-kit-refs.ts:77-85
// The legal set is no longer enumerated here; it is DERIVED below (ghLegal) as "every
// adapter body carrying the resolver slot, plus the packaging template", and Assertion 3 now
// asserts set EQUALITY in both directions rather than mere absence from this negative scope.
```
Its file-set primitive is `grepFilesWithMatch()` (`check-kit-refs.ts:169-177`), the `grep -rln` form —
the right shape for "which docs carry an anchor".

**Message shape for the two directions** (an anchor with no row / a row with no anchor) — mirror the
`missing [...] / unexpected [...]` phrasing quoted in §1.

**Verbatim-at-anchor:** use exact byte comparison, not a normalized one, following
`freshness.ts:100-104` (`a.equals(b)`) and `guardDistributionPair`'s stance that the answer to a
legitimate divergence is a named exemption, never a loosened comparison.

**Record the D-16 residual in source, not only in the register.** Precedent for an
`UNKNOWN - verify` residual written into the module it belongs to:
```ts
// kit-model.ts:303-307
// RECORDED RESIDUAL, NOT CLAIMED AWAY (`UNKNOWN - verify`): this schema is derived from a document
// THIS repository maintains, and a document can lag a platform. A tenth component directory added
// platform-side would be outside this schema, and PLUGIN_MANIFEST_COMPONENT_COUNT cannot detect it —
// the count fires only when THIS repository's own list changes. That is a genuine residual of the
// shape, and it is written down rather than papered over.
```

---

### 4. `scripts/<audit-prepass>.ts` — D-06 mechanical evidence pre-pass

**Analog:** `scripts/check-uat-oracles.ts` `grepFiles()` — the `grep -rnE over an explicit file list`
primitive, which is what an evidence-row emitter is:
```ts
// scripts/check-uat-oracles.ts:86-99
// grep -rnE over an explicit file list: return the `path:lineno:line` hits (1-based line numbers,
// mirroring `grep -n`). Missing files are silently skipped here — callers must do their own CR-01
// missing-file fail-red FIRST (see each oracle below).
function grepFiles(files: string[], re: RegExp): string[] {
  const hits: string[] = [];
  for (const rel of files) {
    if (!fileExists(rel)) continue;
    const lines = readText(rel).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) hits.push(`${rel}:${i + 1}:${lines[i]}`);
    }
  }
  return hits;
}
```

**CR-01 missing-file fail-red, done FIRST** — mandatory for the 36-file set, since a missing role
would otherwise read as "no findings":
```ts
// scripts/check-uat-oracles.ts:177-186
let missing = false;
for (const f of [...WR05_SCAN, ...ASYM_TABLE_FILES]) {
  if (!fileExists(f)) { fail(`${f} missing (required WR-05 tracking/table doc)`); missing = true; }
}
if (missing) return;
```
The pre-pass's file list comes from `listRoles()` + `listWorkflows()` prefixed back to repo-relative
paths at the call site — see the prefix-at-the-call-site rule at `check-kit-refs.ts:208-212`
(*"the fixed subpath is prefixed back on HERE rather than the authority's pinned return shape being
changed for one consumer"*), and use `join()` not a `/` template so paths are Windows-identical.

**Beat/predicate table shape** for the greppable predicates (retired vocabulary, unresolvable refs,
stale counts, `UNKNOWN - verify`): `WR05_BEATS`-style `{ label, re }[]` (`check-uat-oracles.ts:121-134`)
or `ASYM_ROWS`-style `{ label, rowRe }[]` (L147-153). Emit a labeled evidence row per hit.

---

### 5. `scripts/check-uat-oracles.ts` **edit** — D-20 (the three pure-lookahead regexes)

**The exact target, verbatim (L110-134):**
```ts
const WR05_SCAN = [
  ".planning/PROJECT.md",
  ".planning/STATE.md",
  ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
  ".planning/RETROSPECTIVE.md",
];

// Per-beat tolerant regexes. Each requires BOTH the action token AND its phase on the SAME line
// (line-anchored lookaheads), case-insensitive, accommodating the differing prose across the four
// files (e.g. STATE.md's `guard_wr05` is followed by `(scripts/check-foundation-guards.sh)` before
// `in Phase 10`, so the beat2 regex must not require token adjacency).
const WR05_BEATS: { label: string; re: RegExp }[] = [
  { label: "beat1: spawn grant dropped in Phase 8",
    re: /(?=.*\bdropped\b)(?=.*\bPhase[ -]?8\b)/i },
  { label: "beat2: guarded by guard_wr05 in Phase 10",
    re: /(?=.*guard_wr05)(?=.*\bPhase[ -]?10\b)/i },
  { label: "beat3: re-verified GREEN after Phase 11",
    re: /(?=.*re-verified GREEN)(?=.*\bPhase[ -]?11\b)/i },
];
```

**The call path (L188-198)** — `re.test(line)` is reached once per line via `grepFiles`, and the
verdict is a *hit-count == file-count* equality, so an anchoring change must preserve
"file carries the beat on some line" exactly:
```ts
for (const beat of WR05_BEATS) {
  const hits = grepFiles(WR05_SCAN, beat.re);
  const filesWithBeat = new Set(hits.map((h) => h.split(":")[0]));
  if (filesWithBeat.size !== WR05_SCAN.length) {
    const absent = WR05_SCAN.filter((f) => !filesWithBeat.has(f));
    beatFail += `\n  ${beat.label} — missing in: ${absent.join(", ")}`;
  }
}
```
Anchoring pattern already used elsewhere in the same file for a consuming-atom regex:
`/^\|\s*\*\*Codex CLI\*\*/` (L148) and the lookbehind form `(?<!no )\bspawn` (L168) —
both note the **Node 22+ floor** explicitly.

**D-20 item 3 — the "bound the input, refuse loudly by name" shape.** The repo's one established
instance is `MAX_WALK_ENTRIES` in `kit-model.ts` (L150-170 comment, L800-809 enforcement). Quote both
halves; the comment carries the exact rationale D-20 rests on:
```ts
// kit-model.ts:160-163
// WHY THAT MATTERS MORE ON THIS SIDE. This walk runs inside scripts/check-foundation-guards.js in
// CI. A walk that does not terminate promptly HANGS THE GATE RATHER THAN FAILING IT, and a hung
// gate is not a red gate — it is a gate with no verdict at all. So the bound exists to convert an
// unbounded cost into a loud, named refusal.
```
```ts
// kit-model.ts:799-809 — exact integer comparison at the named constant
budget.examined += 1;
if (budget.examined > MAX_WALK_ENTRIES) {
  throw new Error(
    `kit-model: the walk of ${dir} examined more than MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES} ` +
      `directory entries, reaching ${here} — refusing to continue. … Returning ` +
      `the members collected so far would be a silent truncation, and a truncated scan set ` +
      `passes every downstream guard.`,
  );
}
```
**Floor difference to honor:** `kit-model.ts` is a *library* and throws; `check-uat-oracles.ts` is a
*gate* and must `fail(...)` naming the file (per its own `pass`/`fail` helpers), not throw — the same
throw-vs-report split documented at `kit-model.ts:744-753` (the `install/kit-source.ts` twin).

**D-20 item 2 — the permanent regression control** goes in `scripts/check-uat-oracles.test.ts`,
spawning the committed `.js` against a `CHECK_ROOT` mirror carrying a pathological long line, with
the RED-before / GREEN-after transcript recorded (`check-uat-oracles.ts:61-63` documents the harness
contract).

---

### 6. `scripts/canonical-frontmatter.ts` / `scripts/frontmatter.ts` **edit** — D-21 / D-22 (conditional)

**Entry points (module map, for locating where a fuzz harness attaches):**

| Module | Entry point | Line |
|---|---|---|
| `canonical-frontmatter.ts` | `admit(text, options?): Admission` | 538 |
| | `admitUnderProofWeakeningOnly(...)` | 815 |
| | `admittedHasSpawnGrant(doc)` / `admittedGrantedNames(doc)` | 898 / 910 |
| | `REFUSAL_CODES` (23 enumerated codes), `CANONICAL_SCHEMA`, `GRANT_KEYS`, `PLAIN_SCALAR_ALPHABET`, `LINE_PRODUCTIONS`, `REFUSED_NODE_SIGILS` | 93 / 177 / 191 / 239 / 264 / 330 |
| `frontmatter.ts` | `parseFrontmatter(text): Parsed<FrontmatterKeys>` | 3630 |
| | `stripFencedBlocks`, `stripComment`, `TOOLS_KEYS`, grant-occurrence types | 396 / 1272 / 3770 / 3820 |

**The established harness shape — the two-half non-vacuity pair (D-64), quote verbatim:**
```ts
// scripts/canonical-corpus.ts:12-22
// A canonical-form gate passes trivially by refusing everything. What makes its refusal meaningful is
// a PAIR of measurements, and this module is the second half of that pair:
//
//   * 27-62 measured that the reader ADMITS the live kit — 33 of 33 scanned files.
//   * THIS module is the corpus every bypass shape those eleven rounds actually REPRODUCED, so the
//     replay in `canonical-corpus.test.ts` can measure that each of them is now REFUSED, by a NAMED
//     code, with the refusal TEXT printed.
//
// That is D-64's vacuity trap 2. Neither half is evidence on its own: admitting everything and
// refusing everything are both trivially achievable, and only the two together say the grammar
// discriminates.
```
and the corpus-coverage rule (`canonical-corpus.ts:24-29`): round coverage asserted two-sided over
1..11, failing **by name** on a round with zero rows; row total pinned by `CORPUS_COUNT` in the same
file that owns the data.

**The parser-oracle (differential) shape D-22 demands** lives in `scripts/frontmatter.test.ts`: every
row carries a **loader column** naming the real YAML loader it was measured against —
`/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) — see L1719, L1908, L2100, L2390,
L2609. Any D-21 change attaches new rows in that same form.

**D-21's blockquote must survive into the plan verbatim** (CONTEXT.md:117):
> **Concern raised during discussion and overridden by the user:** that module took Phase 27
> **twelve gap-closure rounds**; rounds 10 and 11 each shipped a **new regression inside their own
> fix**; D-64's entire point at round 12 was to stop widening the parser and refuse everything
> outside a canonical form. Phase 27 closed it by **named user override**, with KIT-03 and SPAWN-04
> still `[ ]`. Phase 30 carries a red-team budget as scope; Phase 28 does not. **The accepted cost:
> this audit phase now carries an adversarial round.**

---

### 7. `docs/` durable artifacts — D-05 register, D-13 registry, D-18 exclusion list

**Analog:** `docs/catalog/README.md` — the one existing `docs/` markdown artifact a `scripts/` gate
reads, plus its parse contract.

**The contract, in three parts:**
1. **Generated, never hand-maintained** — `scripts/generate-catalog.ts:41`: `const OUT = join(ROOT, "docs/catalog/README.md");`
2. **A freshness gate proves the committed file matches a fresh regeneration** —
   `scripts/catalog-freshness.ts:94-117`: read the committed bytes, regenerate into a temp mirror,
   compare, and on drift print
   `STALE: docs/catalog/README.md — committed catalog differs from a fresh regeneration. Run \`npm run generate:catalog\` and commit the result.`
3. **`OUT` stays a fixed literal** even under the mirror; the *root* is redirected, not the path
   (`catalog-freshness.ts:23-27`) — same posture as `CHECK_ROOT`.

**Planner guidance:** D-18's exclusion list is **derived** (register `safety_surface` ∪ registry
`kind: safety`), so it should be **generated + freshness-gated** on this pattern rather than
hand-written. The register and registry are human-authored, so their gates (§1, §3) **parse** them
instead — in which case the parse must fail closed on an unparseable row, following
`kit-model.ts`'s refusal floor, never skip it.

---

### 8. `scripts/*.test.ts` — the two-sided count pin convention

**Location convention:** tests sit **beside** the source in `scripts/`, named `<module>.test.ts`
(there is no `tests/` directory).

**The two-sided pin, verbatim** (`scripts/kit-model.test.ts:668-678`):
```ts
it("exports PLUGIN_SKILL_ADAPTER_COUNT and the live tree derives exactly that many, both directions", () => {
  // The plugin tree has NO role corpus for the KIT-03 oracle to cross-check and no freshness gate,
  // so this count is its only deletion signal — the same argument SKILL_ADAPTER_COUNT makes, on a
  // surface with even less around it.
  expect(PLUGIN_SKILL_ADAPTER_COUNT).toBe(7);
  const live = listPluginSkillAdapters();
  expect(live.length).toBe(PLUGIN_SKILL_ADAPTER_COUNT);
  expect(live.length).not.toBe(PLUGIN_SKILL_ADAPTER_COUNT - 1);
  expect(live.length).not.toBe(PLUGIN_SKILL_ADAPTER_COUNT + 1);
});
```
and the constant-vs-live-tree pair (`kit-model.test.ts:256-266`):
```ts
it("exports the exact expected cardinalities (ROLE_COUNT 17 / WORKFLOW_COUNT 19)", () => {
  expect(ROLE_COUNT).toBe(17);
  expect(WORKFLOW_COUNT).toBe(19);
});

it("the live kit derives exactly ROLE_COUNT roles and WORKFLOW_COUNT workflows", () => {
  // Read-only over the real tree, and the forcing function that keeps the constants honest: land
  // role #18 without walking the derived consumers and this case goes red.
  expect(listRoles().length).toBe(ROLE_COUNT);
  expect(listWorkflows().length).toBe(WORKFLOW_COUNT);
});
```
Refusal-path case shape: `expect(() => listWorkflows(root)).toThrow(/refusing to return an empty set/);`
(`kit-model.test.ts:251-253`).

**Running tests:** `npx vitest run --exclude '**/scripts/e2e/**'` — plain `npm test` triggers the
live claude-CLI e2e lane.

---

## Shared Patterns

### Committed-`.js` obligation (applies to every new `scripts/*.ts`)

**Source:** `scripts/freshness.ts`
**Apply to:** all four new scripts

**There is no registration step — membership is derived.** `freshness.ts:41-60` walks
`OUTPUT_DIRS = ["install", "scripts", "hooks"]` and collects every committed `.js`, so a new
`scripts/foo.ts` enters the gate simply by having its `foo.js` committed:
```ts
// scripts/freshness.ts:41-43
// The directories whose committed .js outputs are build artifacts of committed
// .ts sources. Mirrors the tsconfig "include" set (install/scripts/hooks).
const OUTPUT_DIRS = ["install", "scripts", "hooks"];
```
It is two-sided: a committed `.js` with **no** rebuilt counterpart is itself drift
(`freshness.ts:94-99`), so an orphaned or hand-authored `.js` fails red.

**Executor obligation per new script:** run `npm run build` (`tsc`) and **commit the `.js`**; verify
with `npm run freshness`. Expected line: `All build outputs fresh: N committed .js file(s) match a
fresh tsc rebuild.`

### Gate registration in the aggregator

**Source:** `scripts/check-foundation-guards.ts:2551-2578`
**Apply to:** the D-05 completeness gate and the D-16 anchor gate, if they join the foundation gate

Guards are plain functions invoked in an explicit ordered list at the bottom of the file, each call
carrying a comment saying **why it sits where it sits**:
```ts
process.stdout.write("== Phase 10 foundation-guards gate (SDLC-02 / SC2) ==\n");
guardWr05();
…
// KIT-01: run the count guard AHEAD of the four role guards. A broken derivation is then named
// before four downstream guards report on a scan set they should never have received.
guardKitCounts();
…
FAILS += uatOracleFails();

process.stdout.write("\n== Result ==\n");
if (FAILS === 0) { process.stdout.write("ALL CHECKS PASSED\n"); process.exit(0); }
else { process.stdout.write(`${FAILS} CHECK(S) FAILED\n`); process.exit(1); }
```
Cross-file fail folding uses an exported accessor rather than a shared global
(`check-uat-oracles.ts:81-84`, `export const uatOracleFails = () => FAILS;`) — the pattern a
**standalone** new gate should offer if it is later aggregated.

**Sizing note for the planner:** `check-foundation-guards.ts` is already **2606 lines**. A standalone
new script + an `import`/fold is the lower-risk shape; D-06's packaging is explicitly Claude's
discretion.

### Module-header conventions (every new `scripts/*.ts`)

Every script in `scripts/` opens with a header stating, in this order: what it is and which
requirement/decision it serves; the invocation line and exit-code contract; the dependency floor
(`Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.`); and the voice rule
(*"Clear professional voice throughout (CLAUDE.md hard rule — this is a build-safety surface)"*).
See `check-kit-refs.ts:1-35`, `freshness.ts:1-25`, `kit-model.ts:1-93`.

### `UNKNOWN - verify`, never fabricate

**Source:** `kit-model.ts:327-331` (both `experimental.` spellings probed rather than one guessed)
**Apply to:** D-23's offline `npm show` fallback, D-06's unverifiable-read limit, D-16's residual.

### RED-first demonstration (D-24, D-25)

**Source:** the reproduce-then-fix transcripts embedded in source, e.g. `kit-model.ts:276-284`:
```
//     commands/rogue.md      exit 1   `1 CHECK(S) FAILED`   the planted stem named 1 time
//     outputStyles/rogue.md  exit 0   `ALL CHECKS PASSED`   the planted stem named 0 times
//     hooks/rogue.md         exit 0   `ALL CHECKS PASSED`   the planted stem named 0 times
```
**Apply to:** D-24's "guard lands first, RED against today's tree, hit counts recorded" and D-25's
false-claim-then-corrected trail. The transcript belongs in the plan's summary **and** in the
script's own header comment, in this measured-table form.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `<!-- claim: ID -->` anchors in `README.md` / `AGENTS.md` / `agent-factory/README.md` | markup in public docs | n/a | CONTEXT.md:206 records this correctly: *"the first markup this project has put into `README.md` for a mechanical purpose."* No precedent — but `stripHtmlComments()` already exists in `check-foundation-guards.ts` (used by `guardAdapterBody`'s positive half so a commented-out copy cannot stand in for live text). Any guard reading anchors must be aware of it: the anchors are the *only* HTML comments in these files that must NOT be stripped. |
| Hand-authored `docs/` markdown parsed by a gate | durable artifact | batch parse | `docs/catalog/README.md` is *generated*, not hand-authored, so its freshness contract is the analog for D-18 only; the register and registry need a **parse** contract this repo has no instance of. Fail-closed on an unparseable row (`kit-model.ts:663-670` shape). |

---

## Metadata

**Analog search scope:** `scripts/` (all 40 `.ts` modules + colocated `.test.ts`), `docs/`,
`package.json` scripts, repo-root markdown.
**Files scanned:** ~50; deep-read 6 (`dead-vocabulary.ts`, `kit-model.ts`, `check-kit-refs.ts`,
`check-uat-oracles.ts`, `freshness.ts`, `check-foundation-guards.ts` targeted sections).
**Pattern extraction date:** 2026-08-11
