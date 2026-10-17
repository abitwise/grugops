---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-07-30T00:00:00Z
depth: standard
round: 2
diff_base: aa91552aa0db973c4d28faca1e3eaa773178a648
files_reviewed: 14
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/adapters-freshness.ts
  - scripts/adapters-freshness.test.ts
  - scripts/coordinator-resolution-precheck.ts
  - install/install.ts
  - install/install.test.ts
  - install/uninstall.ts
  - install/README.md
  - .github/workflows/ci.yml
findings:
  critical: 4
  warning: 3
  info: 2
  total: 9
status: issues_found
---

# Phase 27 (round 2): Code Review Report

**Reviewed:** 2026-07-30
**Depth:** standard (adversarial, delta `aa91552..HEAD` only)
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Six plans (27-18..27-23) closed the ten round-1 findings. Each closure is real in the direction it
was aimed at, and the ones I could not break — 27-19's `name` cardinality pin, 27-20's shared
`stripHtmlComments`/`countOccurrences` composition and its unterminated-comment fail-closed arm,
27-23's generator-onto-`frontmatter.ts` deletion of the second grammar, the `adapters-freshness`
exit-handler cleanup, and the CI both-ends wiring — are solid and well pinned by cases.

The failures are all in the two classes this phase exists to delete, and **four of them are
reproduced end-to-end on hermetic fixtures, exit code and banner captured**:

1. **CR-01 (fail-open in the parser).** The 27-18 anchor/alias refusal is scoped to a sigil at
   position 0 of a node. A YAML **tag** in front of the node (`allowed-tools: !!seq [*t]`) walks
   straight past it and lands in the silent no-grant SUCCESS arm — the exact CR-01 shape, in a new
   spelling. Planted on a skill adapter, the whole gate printed `ALL CHECKS PASSED`, exit 0.
2. **CR-02 (two answers to one predicate, re-opened).** 27-22 moved `install.ts`'s three
   derivations onto `statSync`; `uninstall.ts`'s byte-identical pair — inventory entries #9/#10,
   declared a PAIR in `check-foundation-guards.ts`'s own set-literal record — was left on `Dirent`
   flags. A symlinked source adapter is installed and never removed, under `== uninstall complete ==`
   and exit 0.
3. **CR-03 (new-capability blast radius).** The 27-22 cycle guard's *global* visited set makes the
   nested walk BLIND to a member the authority sees, violating the invariant written 15 lines above
   it. Reproduced: authority sees `alias/x.md` + `real/x.md`; the installer refuses one and silently
   drops the other, with which one dropped decided by readdir order.
4. **CR-04 (exit-code contract).** The new README table asserts a self-checkout refusal for
   `uninstall.js` that does not exist. `uninstall.js --target <grugops checkout>` deleted 17
   adapters and 7 skills and exited 0.

Plus a guard self-consistency gap (WR-01): 27-19 pinned the **cardinality** of the `name` answer
because "which of the two the platform's YAML loader honours is not this oracle's to guess" — and
27-20, thirty lines away in the same function, added absence and emptiness arms to the `tools`
answer but no cardinality arm. A coordinator declaring two `tools:` keys passes both guards.

## Critical Issues

### CR-01: the YAML reference refusal is bypassed by a tag prefix — silent no-grant restored

**File:** `scripts/frontmatter.ts:180-213` (`YAML_REF`, `startsWithReference`), call sites `:329`,
`:335`, `:354`

**Issue:** `startsWithReference()` returns true only when a node's text *begins* with `&`/`*`, or
when the value opens with `[`/`{` and a fragment begins with one. A YAML **tag** is a legal node
property that may precede an anchor or a collection, so both of these are legal YAML and both slide
past the refusal:

```yaml
_t: !!str &t Read, Write, Bash, Glob, Grep, Agent(grugops-orchestrator)
allowed-tools: !!seq [*t]
```

`"!!str &t …"` does not start with a sigil (the anchor is behind the tag), and `"!!seq [*t]"` does
not start with `[`, so the `t.split(/[,[{]/)` branch is never entered. Both lines parse, and
`allowed-tools` flattens to the literal string `!!seq [*t]` → no spawn token →
`{ ok: true, value: false }`. That is the module header's own named failure — *"reading `*t` as the
plain two-character string `*t` is the silent no-grant arm"* — reached by adding two characters.

**Reproduced** (hermetic mirror of the live tree, plant on `.claude/skills/grugops-map/SKILL.md`,
the surface with no freshness gate):

```
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does
        (23 non-coordinator adapter bodies + 2 packaging template(s) checked) ...
== Result ==
ALL CHECKS PASSED        (exit 0)
```

Under any compliant loader the skill's `allowed-tools` resolves to a list containing
`Agent(grugops-orchestrator)` — a rogue spawner. If a given loader instead *rejects* the tag, the
file is an unloadable adapter — which is also not a clean verdict. Either way the guard returned a
pass over input it did not understand.

**Fix:** refuse the tag sigil at a node start by the same rule, and for the same reason (an
unresolved node property means the value expressed is not the text on the line). Extend the sigil
class and strip a leading tag before the collection test, so a tagged collection still reaches the
fragment split:

```ts
// `!` joins `&` and `*`: a tag is a node property this module does not resolve either, and a plain
// scalar cannot begin with it any more than it can begin with a sigil.
const YAML_REF = /^[&*!][^\s,[\]{}]/;

function startsWithReference(text: string): boolean {
  const t = text.trim();
  if (YAML_REF.test(t)) return true;
  // A tag may precede a collection (`!!seq [*t]`): strip one leading tag so the flow split below
  // still sees the collection it introduces.
  const afterTag = t.replace(/^![^\s]*\s+/, "");
  if (!/^[[{]/.test(afterTag)) return false;
  for (const fragment of afterTag.split(/[,[{]/)) { /* unchanged */ }
  return false;
}
```

Then add a tag-prefixed serializer to `REFUSED_FORMS` in `scripts/frontmatter.test.ts:237-272` and an
aggregator-level case (skill surface) mirroring the CR-01 case at
`scripts/check-foundation-guards.test.ts` line ~103.

---

### CR-02: 27-22 broke the install/uninstall derivation pair — a symlinked adapter is installed and never removable

**File:** `install/install.ts:247-271` (now `statSync`-following) vs `install/uninstall.ts:131-154`
(still `Dirent`-flag filtering)

**Issue:** 27-22 changed `srcSkillNames()` and `srcAdapterFiles()` in `install.ts` to follow symlinks
via `statSync`, and stated the invariant in the header at `install/install.ts:213-215`. The
byte-identical pair in `uninstall.ts` was not changed and still reads:

```ts
readdirSync(root, { withFileTypes: true })
  .filter((ent) => ent.isFile() && ent.name.endsWith(".md"))
```

A `Dirent` for a symlink is neither `isFile()` nor `isDirectory()`, so the removal set no longer
covers what the install set installs. `check-foundation-guards.ts:107-113` records these two as
inventory entries **#9 and #10 — a declared PAIR** ("a SECOND duplicated pair in a second file"),
which is precisely the drift this milestone deletes. This also violates the CLAUDE.md hard
constraint *"Installers: idempotent, additive, dry-run-capable, **reversible**"*.

**Reproduced** (synthetic source with one symlinked adapter, hermetic target + kit home):

```
$ ... node $S/install/install.js --target $T --yes
  materialized   .claude/agents/grugops-symlinked.md (KIT=.../home/agent-factory)
install exit=0

$ ... node $S/install/uninstall.js --target $T
uninstall exit=0
>>> NO MENTION of grugops-symlinked.md anywhere in uninstall output
--- leftover in target .claude/agents:
grugops-symlinked.md
== uninstall complete ==
```

The leftover is a materialized resolver adapter pointing at a kit home the uninstall just orphaned —
a live, broken grugops agent permanently in the user's repo, under a completion banner. The same
argument applies to a symlinked **skill directory** via `srcSkillNames()`.

**Fix:** lift the two helpers into `uninstall.ts` verbatim from `install.ts` (including
`isFileFollowing`/`isDirFollowing`), so the pair stays byte-identical as the inventory claims. Then
add the missing forcing function: extend the round-trip case at `install/install.test.ts:1324-1358`
to plant a symlinked adapter **and** a symlinked skill directory and assert both are gone after
uninstall — the current case iterates only `SYNTH_ADAPTERS`, which is why nothing caught this.

---

### CR-03: the cycle guard's global visited set makes the installer BLIND to a nested adapter the authority sees

**File:** `install/install.ts:302-330` (`srcNestedAdapterFiles`, `seen` at `:304`, `:309-314`)

**Issue:** the guard records the realpath of every directory it walks in a **global** `seen` set and
returns `[]` on a repeat. The header at `install/install.ts:298-301` justifies it as "a directory
already walked under an earlier path contributes no member the walk has not already seen". That is
false for this walk's purpose: members are reported at their **relative paths**, and the same
physical directory reached by two paths yields two different relative paths — each of which
`kit-model.listAgentAdapters()` (`scripts/kit-model.ts:160-193`, no cycle guard, `statSync`-following)
counts as a distinct member. The result directly violates the invariant stated at
`install/install.ts:213-215`: *"it may never be BLIND to a member the authority sees, because a member
it cannot see is a member it cannot refuse by name."*

**Reproduced** (`.claude/agents/real/x.md` plus `.claude/agents/alias -> real`):

```
authority sees: [ 'alias/x.md', 'real/x.md' ]
installer output:
  verify  .claude/agents/alias/x.md — the adapter directory is FLAT BY CONTRACT ...
  (real/x.md is never mentioned)
```

`real/x.md` — the actual on-disk nested adapter — is silently dropped. Which of the two survives the
refusal depends on `readdirSync` ordering, so the failure is nondeterministic across filesystems.

**Fix:** the cycle guard must be a **recursion-path stack**, not a global visited set — that bounds
recursion (which is all it is for) without deleting a distinct relative-path member:

```ts
function srcNestedAdapterFiles(): string[] {
  const root = join(GRUGOPS_SRC, ".claude", "agents");
  // On the CURRENT path only: revisiting a directory under a DIFFERENT path yields different
  // relative paths, and every one of them is a member the authority sees and this walk must refuse
  // by name. Only a repeat on the same path is a cycle.
  const walk = (base: string, ancestors: readonly string[]): string[] => {
    const out: string[] = [];
    const here = join(root, base);
    let real: string;
    try { real = realpathSync(here); } catch { return out; }
    if (ancestors.includes(real)) return out;      // cycle on this path — stop descending
    const nextAncestors = [...ancestors, real];
    let names: string[];
    try { names = readdirSync(here); } catch { return out; }
    for (const name of names) {
      const rel = base ? `${base}/${name}` : name;
      const full = join(here, name);
      if (isDirFollowing(full)) out.push(...walk(rel, nextAncestors));
      else if (name.endsWith(".md") && rel.includes("/") && isFileFollowing(full)) out.push(rel);
    }
    return out;
  };
  return [...new Set(walk("", []))].sort();
}
```

Add a case beside `install/install.test.ts:1591` (the nested-symlink case): two paths to one
directory must produce **two** refusals, not one.

---

### CR-04: the new exit-code table documents a self-checkout refusal `uninstall.js` does not implement — reproduced data loss

**File:** `install/README.md:64-82` (esp. `:67` "Both `install.js` and `uninstall.js` use the same
list" and `:72` "The self-checkout guard (target looks like the grugops source checkout) is the usual
cause"); `install/uninstall.ts` has no `ALLOW_SELF` / `looksLikeSource` branch anywhere.

**Issue:** the round-2 README addition is a published safety contract. `install.ts:676-687` has the
D-07 self-checkout guard; `uninstall.ts` has none, and it also has no `--check` doctor and no `exit 1`
path at all (its only exits are `2` at `:71` and `3` at `:668`). So the row documenting code 1 is
describing behaviour that exists in one of the two files the table claims to cover. Under the
project's own no-fabrication constraint, documenting a refusal that does not fire is worse than
documenting nothing.

**Reproduced** (on a throwaway copy of the source checkout):

```
$ GRUGOPS_SRC=$S2 node $S2/install/uninstall.js --target $S2
before: 18 adapters      after: 1 adapter        exit=0
  removed   .claude/skills/grugops/SKILL.md
  removed   .claude/skills/grugops-gate/SKILL.md
  ... (26 `removed` lines; the 7 skills and 17 committed adapters)
```

No refusal, no prompt, exit 0. `isProtected()` covers `agent-factory/`, `plans/`, `.planning/`,
`docs/`, `src/` — but not `.claude/`, which is where the kit's own committed adapters live.

**Fix:** implement the guard rather than weaken the doc — port the D-07 block from
`install/install.ts:676-687` into `uninstall.ts` ahead of the removal sequence, exiting `1` on
refusal, with the same `--allow-self` override:

```ts
if (!ALLOW_SELF) {
  const looksLikeSource =
    TARGET === toPosix(GRUGOPS_SRC) ||
    (existsSync(join(TARGET, "install", "install.sh")) &&
      existsSync(join(TARGET, "agent-factory", "VERSION")));
  if (looksLikeSource) {
    process.stderr.write(
      "refusing: target looks like the grugops source checkout — uninstalling here would delete the kit's own committed adapters and skills. Pass --allow-self to override.\n",
    );
    process.exit(1);
  }
}
```

Pin it with a case mirroring `install/install.test.ts:479-499` (refusal on stderr, exit 1, target
untouched).

## Warnings

### WR-01: the `tools` answer's cardinality is not pinned, while the `name` answer's is — same function, same round

**File:** `scripts/check-foundation-guards.ts:611-616` (the tools floor) and `:569`
(`keysHaveSpawnGrant`); contrast `:1640-1645` (the `name` cardinality refusal)

**Issue:** 27-19 refused a `name` key carrying anything other than exactly one value, with an
explicit rationale: *"which of the two the platform's YAML loader honours (first, last, or a
duplicate-key throw) is not this oracle's to guess."* 27-20 gave `tools` an absence arm and an
emptiness arm but no cardinality arm, and `keysHaveSpawnGrant()` is deliberately an `.some()` over
**all** occurrences. For the rogue direction that is correctly fail-safe. For the
coordinator-must-hold-the-grant direction it is fail-open: a document whose *later* `tools:` key
drops the grant reads as granting.

**Reproduced** (duplicate `tools:` on the coordinator adapter in a hermetic mirror; a last-wins YAML
loader sees no `Agent(...)` at all):

```yaml
tools: Agent(grugops-agents-md-scribe, ...), Read, Grep, Glob, Edit, Write, Bash
tools: Read, Grep, Glob, Edit, Write, Bash
```
```
  PASS  WR-05: exactly one coordinator holds the spawn grant ...
  PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
ALL CHECKS PASSED   (exit 0)
```

The freshness gate mitigates this on a *generated* adapter (byte comparison), but
`check-foundation-guards.js` is asserted to stand alone, and the skill surface has no freshness gate.

**Fix:** apply the 27-19 rule to the same predicate, in the same loop:

```ts
const declaredToolsValues = TOOLS_KEYS.flatMap((k) => keys.get(k) ?? []);
// ... existing absent / empty arms ...
for (const k of TOOLS_KEYS) {
  const occurrences = keys.get(k) ?? [];
  if (occurrences.length > 1) {
    wr05Fail += `\n${f}: declares the \`${k}\` key ${occurrences.length} times — a tool allow-list has ONE authority and must have ONE answer; which occurrence the platform's YAML loader honours is not this guard's to guess`;
  }
}
```

---

### WR-02: the WR-02 case claims symlinked-skill coverage it does not have

**File:** `install/install.test.ts:1473-1474`

**Issue:**

```ts
// A symlinked SKILL directory is a skill for the same reason, and by the same test.
expect(installedSkills(target)).toEqual(listSkillAdapters(src));
```

The fixture creates exactly one symlink (`linkName`, under `.claude/agents`). No symlinked skill
directory exists, so this assertion compares two *unmodified* derivations and would pass identically
if `srcSkillNames()` had never been changed. `srcSkillNames()`'s new `isDirFollowing` behaviour —
one of the three helpers 27-22 changed — has no test at all. This is the "green while the set rots"
shape the phase names.

**Fix:** build the fixture the comment describes before asserting on it:

```ts
mkdirSync(join(src, "outside-skill"), { recursive: true });
writeFileSync(join(src, "outside-skill", "SKILL.md"), "---\nname: linked-skill\n---\nbody\n");
symlinkSync(join(src, "outside-skill"), join(src, ".claude", "skills", "linked-skill"));
// ... run install ...
expect(installedSkills(target)).toEqual(listSkillAdapters(src));
expect(installedSkills(target)).toContain("linked-skill/SKILL.md");
expect(installedSkills(target).length).toBe(8);
```

---

### WR-03: the refused-forms product claims "every YAML reference form" over five spellings of one shape

**File:** `scripts/frontmatter.test.ts:327` (case title) and `:237-272` (`REFUSED_FORMS`)

**Issue:** the case is titled *"REFUSES every YAML reference form x indents x values"* and the
cardinality pin at `:352` locks the table at five entries. All five place a **bare** `&`/`*` at a node
start; none places a node property in front of one. CR-01 is exactly the form this table's own claim
excludes, which is the over-claiming shape the module header warns about ("This record already failed
once by claiming more than it held"). A cardinality pin over an incomplete axis pins the wrong thing.

**Fix:** either add the tag axis to the product (a `tagged` variant of each existing serializer, with
the count updated) or narrow the title to what the table covers — *"refuses every placement of a bare
anchor/alias sigil"* — and record the tag axis as an explicit open edge beside it.

## Info

### IN-01: the exit-code table's code-0 row describes only the install run

**File:** `install/README.md:71`

**Issue:** `0` is documented as "every class installed (or removed); the run printed
`== install complete ==`". Four paths exit 0 without that banner: `--check` on a clean doctor
(`install.ts:634`), `--update` (`:653`), `--prune-old-kit` (`:669`), and `--migrate` on an
already-migrated repo (`:1495`). A script reading the table would expect the banner on those runs.

**Fix:** add a clause — "the non-install modes (`--check`, `--update`, `--prune-old-kit`,
already-migrated `--migrate`) also exit `0` and print their own completion banner."

---

### IN-02: `importClosure()` matches only double-quoted specifiers

**File:** `scripts/generate-role-adapters.test.ts:66-74`

**Issue:** the derivation regex is `/from\s+"\.\/([A-Za-z0-9._-]+\.js)"/g` — single-quoted or dynamic
`import("./x.js")` specifiers are invisible. Today `tsc` emits double quotes so the closure is
complete, and the `< 2` floor plus a loud `ERR_MODULE_NOT_FOUND` keep the failure direction safe. It
is still a shape-dependent parser with only a floor, not a derived cardinality — the same trade
`parseMappingBody()` (`install/install.test.ts`) was rewritten this round to stop making.

**Fix:** widen to `/from\s+["'\`]\.\/([A-Za-z0-9._-]+\.js)["'\`]/g` and, if the closure is ever
expected to be exhaustive, add a declared-versus-parsed check comparing the count of `from "./`
occurrences against the recovered set, the way `parseMappingBody()` now does.

---

_Reviewed: 2026-07-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard — adversarial, round 2, delta `aa91552..HEAD`_
_All four Critical findings and WR-01/WR-02 were reproduced on hermetic fixtures; commands and
captured output are quoted inline._
