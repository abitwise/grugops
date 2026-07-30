---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-07-30T00:00:00Z
depth: standard
scope: gap-closure half only (plans 27-10 … 27-17, diff 7f8d016..HEAD)
files_reviewed: 17
files_reviewed_list:
  - scripts/kit-model.ts
  - scripts/kit-model.test.ts
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-kit-refs.ts
  - scripts/check-kit-refs.test.ts
  - scripts/adapters-freshness.ts
  - scripts/adapters-freshness.test.ts
  - scripts/coordinator-resolution-precheck.ts
  - scripts/coordinator-resolution-precheck.test.ts
  - scripts/generate-role-adapters.ts
  - install/install.ts
  - install/install.test.ts
  - install/uninstall.ts
  - .github/workflows/ci.yml
findings:
  critical: 3
  warning: 5
  info: 2
  total: 10
status: issues_found
---

# Phase 27 gap-closure: Code Review Report

**Reviewed:** 2026-07-30
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

The four prior findings this diff set out to close are genuinely closed, and I verified each one
adversarially rather than taking the summaries' word for it:

* **CR-01 (nested adapter) — CLOSED.** `kit-model.listAgentAdapters()` recurses, returns
  forward-slash relative paths, throws on unreadable/empty/filtered-to-empty, and is now the only
  answer to "what is an agent adapter" for `check-foundation-guards`, `check-kit-refs`,
  `adapters-freshness` and the new precheck. The nested plant is a member, is refused by name in
  `guard_adapter_size`, and appears as an extra member in the freshness set half.
* **CR-02 (folded scalar) — CLOSED for the folded/wrapped/quoted/sequence forms.** The two
  line-anchored EREs and `matchesOutsideFences()` are deleted, not kept as a second opinion.
  `frontmatter.test.ts` is a real oracle (13 forms × 2 indents × 6 values = 156 asserted cases with
  the product size pinned), not a case list.
* **CR-03 (unreachable gate) — CLOSED at both ends.** `npm run freshness:adapters` is in
  `ci.yml:69` and `adapters-freshness.test.ts` spawns the committed `.js`, so a workflow refactor
  cannot silently un-gate it.
* **WR-01/WR-02/WR-03/WR-04/IN-01 — CLOSED.** The vacuity floor moved onto `ADAPTERS.length`, the
  installer's derivations now return `null` and branch on three states, `/grug` → `/grugops` is
  pinned as a sixth beat, `RUNNABLES` has a mirrored guarded removal pass, and the NUL byte is gone.
* **IN-02 — partially closed, and honestly dispositioned.** `check-foundation-guards.ts` grew from
  1245 to 1583 lines rather than shrinking; the deferral is recorded.

That said, **three bypasses of named invariants in this diff are reproducible on hermetic mirrors of
the live tree, each printing `ALL CHECKS PASSED`**, and all three are instances of failure classes
this phase names in its own lessons:

1. A **YAML anchor/alias** grant is read as *no grant*. `frontmatter.ts`'s header explicitly claims
   an anchor form "lands in the parse-failure arm"; it does not — it lands in the silent-no-grant arm,
   which is the exact class the module exists to refuse. Reproduced on a **skill** adapter, the one
   surface with no freshness gate and no role corpus to cross-check.
2. **KIT-03 equates two different namespaces.** It compares *filename stems* against the
   coordinator's *frontmatter names* without ever asserting the two agree. I renamed one adapter's
   `name:` key and the oracle printed `17 roles == 17 adapters == 17 grant-closure names` over a tree
   whose coordinator grants a name no installed agent carries — the milestone's founding defect,
   reproduced with its own oracle green. `coordinator-resolution-precheck.ts` in the same diff does
   this correctly *by name*, so there are now two answers to "what is an adapter's identity" and the
   weaker one is the one guarding CI.
3. **`guard_wr05`'s tier-beat check is satisfiable by a comment.** It is a bare `.includes()` over a
   fence-stripped but **not** comment-stripped, **not** occurrence-counted body — literally the
   WR-05 hole plan 27-14 closed in `guard_adapter_body`'s positive half, left open in the sibling
   check inside the same function. Wrapping the entire tier announcement in `<!-- -->` yields
   `PASS … the coordinator body carries all 6 tier-announcement beats`.

Five warnings follow, the two most consequential being that **both installers print `INCOMPLETE` and
exit 0** (so the fail-loud contract is loud only to a human reader, and the new precheck's
`r.status !== 0` check reads a no-op install as clean), and a **derivation asymmetry on symlinks**
between the installer and the authority that makes a source adapter vanish with no report — the exact
silent disappearance `srcNestedAdapterFiles()` was added to prevent.

All empirical work was done in `/tmp` mirrors; `git status --porcelain` is clean and every mirror was
removed. The committed `.js` files were not reviewed as source; nothing in the findings below would
fail to survive `tsc` regeneration.

## Critical Issues

### CR-01: A YAML anchor/alias spawn grant is read as *no grant* — `frontmatter.ts` claims it fails red and it does not

**File:** `scripts/frontmatter.ts:49-53` (the false claim), `scripts/frontmatter.ts:316-333`
(`TOOLS_KEYS` / `keysHaveSpawnGrant`), `scripts/frontmatter.test.ts:1-546` (no anchor case exists)

**Issue:**
The module header states:

> DELIBERATELY NOT A YAML ENGINE. Anchors, aliases and merge keys are not resolved. … An anchor form
> lands in the parse-failure arm (an unrecognized key shape is unreadable, never a silent no-grant),
> which is the correct place for it.

That is false. `KEY_LINE` matches `_t: &t …` and `tools: *t` perfectly well, so the parse *succeeds*
and the flattened value of `tools` is the literal string `*t`, which carries no spawn token. The
result is `{ ok: true, value: false }` — the silent-no-grant arm the module was written to make
impossible. Verified directly against the committed `frontmatter.js`:

```
$ node -e '…parseFrontmatter(doc)…'
ok: true [ …, [ '_t', [ '&t Read, Grep, Agent(grugops-installer)' ] ], [ 'tools', [ '*t' ] ], … ]
hasSpawnGrant:      { ok: true, value: false }
grantedAgentNames:  { ok: true, value: [] }
```

**Reproduced through the whole gate**, on a hermetic mirror of the live tree, planted on the skill
adapter — deliberately the worst case, because a skill has no role to compare against (KIT-03 is
structurally blind to it), `SKILL_ADAPTER_COUNT` only checks cardinality, and `adapters-freshness`
covers `.claude/agents` only:

```yaml
# <MIRROR>/.claude/skills/grugops-gate/SKILL.md
---
name: grugops-gate
description: Run the grugops PR quality gate — …
argument-hint: "<request>"
_tools: &t Read, Write, Bash, Glob, Grep, Agent(grugops-software-engineer)
allowed-tools: *t
---
```

```
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 …)
  PASS  SPAWN-05: 24 adapter bodies + 2 template body shapes checked; …
ALL CHECKS PASSED
$ CHECK_ROOT=$MIRROR node scripts/check-kit-refs.js        → ALL CHECKS PASSED
$ CHECK_ROOT=$MIRROR node scripts/adapters-freshness.js    → Adapters fresh: 17 adapter(s) …
```

Anchors and aliases are standard YAML 1.1/1.2; any real YAML parser resolves `tools: *t` to
`Read, Write, Bash, Glob, Grep, Agent(grugops-software-engineer)`. Whether the platform grants on it
depends on its parser, but the guard's own contract does not: **the specified behaviour was refuse,
and the implemented behaviour is a clean no-grant verdict.** The parser oracle cannot catch this
because its serializer table has no anchor/alias form, and the product only generates documents it
already asserts `ok === true` for.

**Fix:** Detect the two constructs and route them to the failure arm the header promises, in
`flattenBlock()` — before the value is flattened, so the refusal cannot be bypassed by where the
anchor sits:

```ts
// An anchor, an alias or a merge key means the VALUE this document expresses is not the value these
// lines carry. Refusing is the only honest reading: resolving them would be a second grammar with
// more surface, and treating them as plain text is a silent no-grant — the arm this module exists
// to delete.
const YAML_REF = /(^|[\s,[{])[&*][A-Za-z0-9_-]/;
if (YAML_REF.test(rest) || cur?.parts.some((p) => YAML_REF.test(p))) {
  return {
    ok: false,
    reason: `\`${excerpt(t)}\` uses a YAML anchor/alias; the value it expresses is not the text on this line, and this module deliberately does not resolve one — refusing rather than reading it as "no grant"`,
  };
}
```

Add three RED cases to `frontmatter.test.ts`: the alias-grant shape above, a `<<: *x` merge key, and
an anchor on the `tools` key itself. Add one aggregator-level RED case to
`check-foundation-guards.test.ts` using the existing `reshapeToolsKey()` helper (it already exists
for exactly this shape of plant) against `.claude/skills/grugops/SKILL.md`.

---

### CR-02: KIT-03 compares filename stems against frontmatter names — two namespaces, never asserted equal; the founding defect reproduces with the oracle green

**File:** `scripts/check-foundation-guards.ts:1360-1364` (`AGENT_PREFIX` / `stem`),
`scripts/check-foundation-guards.ts:1395` (`adapterNames`),
`scripts/check-foundation-guards.ts:1465-1482` (coordinator + `granted`), contrast
`scripts/coordinator-resolution-precheck.ts:393-403`

**Issue:**
Set 2 of the three-way equality is built from **filenames**:

```ts
const adapterNames = adapterFiles.map(stem);            // "grugops-installer.md" -> "grugops-installer"
```

Set 3 is built from the coordinator's **frontmatter grant**, i.e. from platform *agent names*:

```ts
const granted = keysGrantedAgentNames(parsedAdapters.get(coordinators[0])!);
```

Claude Code takes agent identity **only from frontmatter** — this file says so itself twice
(`:537-538`, `:1350-1352`). Nothing anywhere asserts that an adapter's `name:` value equals its
filename stem. `guard_wr05`'s new floor at `:533-540` checks only that a `name` key *exists*, not
what it says. So the equality is computed across two namespaces that are merely assumed to coincide.

**Reproduced.** Hermetic mirror of the live tree; one byte-level edit to one adapter's `name:` value
and nothing else:

```
$ sed -i 's/^name: grugops-installer$/name: totally-different-name/' \
      $MIRROR/.claude/agents/grugops-installer.md
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 …)
  PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
ALL CHECKS PASSED
$ CHECK_ROOT=$MIRROR node scripts/check-kit-refs.js  → ALL CHECKS PASSED
```

The coordinator's `Agent(…, grugops-installer, …)` now enumerates a name that **no installed agent
carries**, and the guard whose entire reason for existing is *"a coordinator grant naming SEVEN
agents of which ZERO resolved to anything"* (`:1306-1308`) reports the equality holds. This is the
milestone's founding defect in a namespace the oracle does not look at.

Two aggravating facts:

* **A surviving second grammar for the identity predicate.** `coordinator-resolution-precheck.ts`
  resolves the closure **by frontmatter name** (`installedNames` at `:395-398`) and correctly fails
  on the same mirror. So this diff ships two answers to "what is an adapter's identity", and the
  weaker one is the one wired into CI while the stronger one is a human-invoked precheck.
* **No fixture pins it.** Every KIT-03 fixture (`consistentMirror()`, `plantPlainAdapter()`,
  `plantNestedRogue()`) writes `name:` equal to the filename stem by construction, so all eleven
  KIT-03 cases would pass identically against a comparison that ignored `name` entirely.

`adapters-freshness` does catch this in-repo (byte drift, exit 1) — but that is a *different*
invariant, this file's own header calls a sibling guard's reliance on regeneration
"DEFENSE IN DEPTH, NEVER THE STRUCTURAL FIX" (`:585`), and an **installed target repo** has no
generator and therefore no freshness gate at all.

**Fix:** Make the oracle compare the namespace the platform uses, and assert the mapping it relies
on rather than assuming it:

```ts
// Identity comes from frontmatter, never from a filename — so assert the two agree BEFORE any set
// comparison mixes them. Without this, the grant closure (names) and the adapter set (filenames)
// are two namespaces and the equality below is over the wrong members.
const nameMismatch = adapterFiles.filter((f) => {
  const declared = (parsedAdapters.get(f)!.get("name") ?? [])[0] ?? "";
  return declared !== `${AGENT_PREFIX}${stem(basename(f))}`;
});
if (nameMismatch.length > 0) {
  fail(
    `KIT-03: ${nameMismatch.length} adapter(s) whose frontmatter \`name\` does not equal \`${AGENT_PREFIX}<filename stem>\` — the platform resolves the coordinator's grant by NAME while this oracle compares FILENAMES, so the equality below would hold over two different namespaces: ${nameMismatch.sort().join(", ")}`,
  );
  return;
}
```

(Note this must run after the existing parse loop at `:1452-1464` so it reads the same parse.) Add
the reproduction above as a RED case, and add the mismatch to `consistentMirror()`'s inverse so at
least one fixture would fail if the assertion were deleted.

---

### CR-03: `guard_wr05`'s tier-announcement beats are satisfiable by an HTML comment — the WR-05 hole, reopened in the sibling check

**File:** `scripts/check-foundation-guards.ts:552-563`, contrast
`scripts/check-foundation-guards.ts:673-676, 720-732`

**Issue:**
Plan 27-14 closed the prior review's WR-05 ("the positive half is satisfied by any occurrence of the
sentence, including a comment") in `guard_adapter_body` by adding `stripHtmlComments()` and an
occurrence **count** (`found === 1`). The tier-beat check — inside the *same aggregator*, reading the
*same coordinator body*, 160 lines earlier — got neither:

```ts
const coordinatorBody = collapseWhitespace(stripFencedBlocks(readText(coordinators[0])));
for (const beat of TIER_BEATS) {
  if (!coordinatorBody.includes(beat.needle)) { … }
}
```

`stripHtmlComments` is applied only to `guard_adapter_body`'s positive half (its own comment at
`:637-638` says so). So a coordinator that has lost its live tier announcement entirely still
satisfies all six beats as long as the bytes survive in a comment — and the PASS line then makes a
false claim about a capability-and-safety announcement, which is precisely the T-27-34 spoofing
threat the guard names at `:429-432`.

**Reproduced.** Hermetic mirror; the entire tier announcement block in
`.claude/agents/grugops-orchestrator.md` wrapped in `<!-- … -->` and nothing else changed:

```
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 …),
        and the coordinator body carries all 6 tier-announcement beats
ALL CHECKS PASSED     (exit 0)
```

Zero of the six beats are live text the agent reads. As with CR-02, `adapters-freshness` catches this
byte drift in-repo but not in an installed target, and the guard's own claim is false either way. The
same body is also satisfiable by a blockquote or a "what this used to say" note — the check is
context-free.

**Fix:** Reuse the two mechanisms already in the file, so there is one treatment for one predicate
rather than two:

```ts
// Same input shape guard_adapter_body's positive half uses: one fence authority, then comments
// removed, then COUNTED. A comment quoting the announcement is not an announcement, and a body
// stating a beat twice is not a body the generator produces.
const coordinatorBody = collapseWhitespace(
  stripHtmlComments(stripFencedBlocks(readText(coordinators[0]))),
);
for (const beat of TIER_BEATS) {
  const n = countOccurrences(coordinatorBody, beat.needle);
  if (n !== 1) {
    wr05Fail += `\n${coordinators[0]}: tier-announcement beat "${beat.label}" appears ${n} time(s) in live, non-fenced, non-commented text — exactly 1 is required (expected \`${beat.needle}\`) — ${beat.why ?? BEAT_DEFAULT_WHY}`;
  }
}
```

`countOccurrences` and `stripHtmlComments` are declared below `guardWr05()` today (`:676`, `:681`) —
both are hoistable `const`/`function` at module scope but only read at call time, so no move is
strictly required; if you prefer the declarations to precede the reader, hoist them next to
`collapseWhitespace`. Add the reproduction above as a RED case in
`check-foundation-guards.test.ts` beside the existing five beat-removal cases, which are all
*deletion* cases and therefore blind to this.

## Warnings

### WR-01: Both installers print `INCOMPLETE` and exit **0** — the fail-loud contract is loud only to a human, and the new precheck reads a no-op install as clean

**File:** `install/install.ts:1578-1586`, `install/uninstall.ts:657-665`,
`scripts/coordinator-resolution-precheck.ts:278-283`, `install/install.test.ts` (`toBe(0)` in every
fail-loud case)

**Issue:** Plan 27-13's stated goal was that a run which installed nothing must not claim
completion. The banner is now conditional, but the **exit code is not**: neither script has a
`process.exit(VERIFY_FINDINGS > 0 ? 1 : 0)` and neither sets `process.exitCode`. Verified:

```
$ INSTALL_MODE=copy GRUGOPS_SRC=/tmp/gsrc GRUGOPS_HOME=/tmp/ghome TARGET=/tmp/gtgt \
    node /tmp/gsrc/install/install.js --yes          # .claude/agents replaced with a file
  verify         .claude/agents/ — cannot read /tmp/gsrc/.claude/agents, so the install set is …
== install INCOMPLETE — 1 item(s) need verification ==
EXITCODE=0
```

The four new install cases pin this (`expect(r.status).toBe(0)`), so it reads as deliberate — but it
defeats the contract for every non-human consumer: `install.js && next-step`, a CI step, the
documented scripted-install path, and specifically the new precheck, whose
`runScratchInstall()` gate is `if (r.status !== 0)`. It then prints
`scratch install: the installer ran cleanly into <target>`, which is false, and can reach
`PRECONDITIONS HOLD` over an install that refused a whole class. A nested source adapter is the
concrete input: verify finding, `INCOMPLETE` banner, exit 0, seventeen flat adapters installed, so
every downstream observation succeeds.

**Fix:** Make the machine-readable signal agree with the banner, and give the reader a distinct code
so "incomplete" is not confused with "crashed":

```ts
// install.ts tail
if (VERIFY_FINDINGS > 0) {
  console.log(`\n== install INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
  console.log("  Each `verify` line above names what was NOT installed and the remedy for it.");
  process.exit(3);   // 0 = complete, 1 = refused/aborted, 2 = bad usage, 3 = incomplete
}
```

Update the four `toBe(0)` assertions to `toBe(3)` (they are the pin, so they must move with the
contract), mirror it in `uninstall.ts`, and tighten `runScratchInstall()` to fail on any non-zero
status *and* on the `install INCOMPLETE` banner so the precheck cannot narrate a clean run over one.

---

### WR-02: The installer's source derivation does not follow symlinks and the authority does — a symlinked source adapter is neither installed nor reported

**File:** `install/install.ts:206-218` (`srcSkillNames`), `install/install.ts:220-230`
(`srcAdapterFiles`), `install/install.ts:254-271` (`srcNestedAdapterFiles`),
`scripts/kit-model.ts:160-179` (`walkFilesRelative`)

**Issue:** `srcAdapterFiles()` filters on `ent.isFile()` from `withFileTypes`, which is **false for a
symlink** (it reports `isSymbolicLink()`). `kit-model.walkFilesRelative()` deliberately uses
`statSync`, which **follows** symlinks — its own comment says so, "matching how the platform would
resolve a symlinked adapter". The two derivations therefore disagree, proven:

```
$ ls .claude/agents            # real.md, linked.md -> real.md
install-style (isFile + .md): [ 'real.md' ]
authority (statSync):         [ 'linked.md', 'real.md' ]
```

`srcNestedAdapterFiles()` does not cover the gap either: its own filter is
`ent.isFile() && … && rel.includes("/")`, so a top-level symlink fails both conditions and a nested
symlinked *directory* is skipped by `ent.isDirectory()`. The result is exactly the failure
`srcNestedAdapterFiles()` was written to prevent — *"The installer must not be the one place a file
disappears silently"* (`:262-263`): the file is not installed, not refused by name, not counted, and
the run still prints `== install complete ==`.

The `source derivation` conformance case that is supposed to buy back the D-18 duplication cannot see
this, because `makeSyntheticSrc()` builds only regular files. Its assertion
`installedAdapters(target)).toEqual(authorityAdapters)` would fail loudly on a symlinked fixture —
which is what makes adding one worthwhile.

**Fix:** Either align the installer on the authority's semantics, or refuse the shape by name:

```ts
// Match the authority: it uses statSync BECAUSE the platform resolves a symlinked adapter. A Dirent
// that is a symlink is neither installed nor reported today, which is the silent disappearance the
// nested check exists to prevent.
function srcAdapterFiles(): string[] | null {
  const root = join(GRUGOPS_SRC, ".claude", "agents");
  try {
    return readdirSync(root)
      .filter((n) => n.endsWith(".md") && statSync(join(root, n)).isFile())
      .sort();
  } catch { return null; }
}
```

and add a symlinked-adapter fixture to the `source derivation` conformance case so the two
derivations are asserted equal over the shape that currently splits them.

---

### WR-03: `generate-role-adapters.ts` keeps a second frontmatter grammar — and it is the surface that emits the `tools:` grant line

**File:** `scripts/generate-role-adapters.ts:75-85`, contrast `scripts/frontmatter.ts:1-57`

**Issue:** `frontmatter.ts` declares itself "the single authority for *what does this file's
frontmatter SAY*". The generator, in the same diff's dependency graph, keeps its own:

```ts
const m = text.match(/^---\n([\s\S]*?)\n---\n/);
for (const line of m[1].split("\n")) {
  const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
  if (kv) fm[kv[1]] = kv[2].trim();       // last occurrence wins
}
```

Three concrete divergences from the authority: the key charset excludes digits and hyphens; `\s*`
accepts `capabilities:read` (which the authority deliberately treats as a plain scalar and refuses);
and a duplicate key silently keeps the **last** value where the authority retains **all** of them
with the explicit reasoning that discarding one is a bypass. This is the second answer to one
predicate that lesson 1 of this phase is about, and it is uncovered by the parser oracle.

Today every divergence happens to land in the generator's fail-closed branches (an unrecognized
`capabilities:` value produces a token outside `VOCABULARY` or an empty value, both of which exit 1
without writing) — which is why this is a WARNING rather than a BLOCKER. But it is the code path that
**composes the shipped `tools:` line**, i.e. the spawn grant itself, from a grammar nothing tests.

**Fix:** Read the role's frontmatter through the authority — the generator already imports
`./kit-model.js`, so importing `./frontmatter.js` adds no new dependency and no new file:

```ts
import { parseFrontmatter } from "./frontmatter.js";
// …
const parsed = parseFrontmatter(text!);
if (!parsed.ok) fail(`${file}: frontmatter is unreadable — ${parsed.reason}`);
const caps = parsed.value.get("capabilities") ?? [];
if (caps.length !== 1) {
  fail(`${file}: expected exactly one \`capabilities:\` key, found ${caps.length}`);
}
const rawCaps = caps[0].trim();
```

Then delete the local `parseFrontmatter`. If the local parser must stay for a reason not visible here,
record the reason in the set-literal inventory as a 16th disposition — the inventory is now the place
this project records a deliberate duplicate.

---

### WR-04: `install.test.ts`'s "derive the set, assert the count" derives the set with a regex over TypeScript source and hardcodes the count

**File:** `install/install.test.ts:1530-1536`, `install/install.test.ts:1538-1555`

**Issue:** The case correctly refuses to keep a third hand-copy of `RUNNABLES`, but it recovers the
mapping by regex-scraping the `.ts` sources:

```ts
const block = new RegExp(`const ${constName}: Array<\\[string, string\\]> = \\[([\\s\\S]*?)\\n\\];`).exec(src);
return [...block[1].matchAll(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g)].map((m) => m[2]).sort();
```

An entry written in any other shape — single quotes, a template literal, a trailing comment between
the brackets, or a prettier reflow that puts the closing `];` on the same line as the last entry — is
invisible to the pair matcher. If a third runnable is added **to both files** in an unmatched shape,
`mirror` and `RUNNABLE_RELS` both come back as the same two members, `expect(…length).toBe(2)`
still passes, and the new runnable is covered by **none** of the five cases below it (round-trip,
user-modified, protected-path, unreadable-source, DRY_RUN) because they are all driven off
`RUNNABLE_RELS`. That is a count assertion passing over a degenerate set, which is the class this
phase's lesson 2 names.

**Fix:** Derive the *cardinality* from the block rather than restating it, so a missed entry fails the
count instead of shrinking coverage silently:

```ts
function mappingDests(file: string, constName: string): string[] {
  const src = readFileSync(join(import.meta.dirname, file), "utf8");
  const block = new RegExp(`const ${constName}: Array<\\[string, string\\]> = \\[([\\s\\S]*?)\\n\\];`).exec(src);
  if (!block) throw new Error(`${file}: could not find the ${constName} mapping literal`);
  const pairs = [...block[1].matchAll(/\[\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]\s*\]/g)];
  // The number of `[` openings in the block is the number of entries the AUTHOR wrote; if the pair
  // matcher recovered fewer, an entry is in a shape this test cannot see and coverage would shrink
  // silently. Fail instead.
  const declared = (block[1].match(/\[/g) ?? []).length;
  if (pairs.length !== declared) {
    throw new Error(`${file}: ${constName} declares ${declared} entr(ies) but only ${pairs.length} were parsed — an entry is in a shape this test cannot read`);
  }
  return pairs.map((m) => m[2]).sort();
}
```

Keep the `toBe(2)` alongside it as the "somebody added one" forcing function.

---

### WR-05: `guard_wr05` has no floor requiring an agent adapter to *declare* a `tools` key — and an absent key is a grant by inheritance

**File:** `scripts/check-foundation-guards.ts:523-540`, `scripts/check-foundation-guards.ts:515-521`

**Issue:** Per this project's own stack notes (`CLAUDE.md`, §3 Subagent): *"`tools` (optional):
comma-separated allow-list. **Omit to inherit all main-conversation tools.**"* So a sub-agent adapter
with **no** `tools` key inherits everything, `Agent` included. `keysHaveSpawnGrant()` returns `false`
for a missing key, so the non-coordinator direction reads it as compliant:

```
$ sed -i '/^tools:/d' $MIRROR/.claude/agents/grugops-qe-e2e.md
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 …)
ALL CHECKS PASSED     (exit 0)
```

This is the same argument that justified the `name`-key floor added two lines above it — *"'no
frontmatter' and 'no grant' would otherwise print the same silence"* (`:526-527`). An absent `tools`
key and a declared no-spawn `tools` key print the same silence and mean opposite things. As with
CR-02/CR-03, `adapters-freshness` catches it in-repo but not in an installed target, and the guard's
PASS line asserts something it did not check.

**Fix:** Extend the existing floor loop, which already has the parse in hand:

```ts
for (const f of AGENT_ADAPTERS) {
  if (!fileExists(f)) continue;
  const keys = parsedScan.get(f);
  if (keys === undefined) continue;
  if (!keys.has("name")) { /* existing finding */ }
  // An ABSENT tools key is not "no grant": the platform grants the sub-agent every
  // main-conversation tool, `Agent` included. Only a DECLARED allow-list can be checked.
  if (!TOOLS_KEYS.some((k) => keys.has(k))) {
    wr05Fail += `\n${f}: agent adapter declares no \`tools\` key — omitting it makes the platform grant every main-conversation tool INCLUDING the spawn tool, so an absent key is a grant by inheritance and this guard cannot report on it`;
  }
}
```

`TOOLS_KEYS` is already exported from `frontmatter.ts:316` and is not yet imported here; add it to
the existing import list rather than restating the two key names.

## Info

### IN-01: `adapters-freshness.ts` leaks its temp mirror on any uncaught throw

**File:** `scripts/adapters-freshness.ts:100-110, 127-142, 229`

**Issue:** `cleanup()` runs only on the `die()` paths and on the two success/stale tails. The three
`cpSync` calls at module top level and the `readFileSync` of the rebuilt adapter at `:229` are
unguarded, so an absent `agent-factory/packaging` in a `CHECK_ROOT` mirror throws before any handler
and leaves `<tmpdir>/grugops-adapters-fresh-*` behind. The new precheck test proves it cleans up
after itself (Case 7); this gate has no equivalent and no `try/finally`.

**Fix:** Wrap the body in `try { … } finally { cleanup(); }`, or register
`process.on("exit", cleanup)` immediately after `mkdtempSync`. Add a case asserting the temp prefix
is absent after a fail-closed run, mirroring `coordinator-resolution-precheck.test.ts` Case 7.

---

### IN-02: `check-kit-refs` and `validate-agent-factory` are still absent from `ci.yml`, unlike the four freshness gates

**File:** `.github/workflows/ci.yml:60-70`

**Issue:** Plan 27-11's lesson was "wire at both ends, so a workflow refactor cannot un-gate it", and
`freshness:adapters` was correctly wired at both. `scripts/check-kit-refs.js` and
`scripts/validate-agent-factory.js` remain wired at **one** end only — they run in CI solely as a
side effect of their `.test.ts` files spawning them inside the vitest step. That is the state
`adapters-freshness` was in minus the missing test, and it is one `--exclude` pattern away from being
un-gated. Pre-existing, but the phase's own lesson makes it worth recording.

**Fix:** Add the two to the ubuntu-only gate block beside `check-foundation-guards.js`:

```yaml
          node scripts/check-kit-refs.js
          node scripts/validate-agent-factory.js
```

---

_Reviewed: 2026-07-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Scope: 7f8d016..HEAD (plans 27-10 … 27-17). Prior findings CR-01/CR-02/CR-03/WR-01…WR-05/IN-01 from 27-REVIEW.md were re-tested adversarially and are closed; IN-02 is partially closed with the residual dispositioned._
