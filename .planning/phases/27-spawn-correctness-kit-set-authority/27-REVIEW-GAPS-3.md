---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-07-31T00:00:00Z
depth: deep
round: 3
diff_base: a9cfdad7ad116c4c2737a762a4af3745641824fc
files_reviewed: 17
files_reviewed_list:
  - install/README.md
  - install/install.ts
  - install/install.js
  - install/install.test.ts
  - install/kit-source.ts
  - install/kit-source.js
  - install/uninstall.ts
  - install/uninstall.js
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.js
  - scripts/check-foundation-guards.test.ts
  - scripts/frontmatter.ts
  - scripts/frontmatter.js
  - scripts/frontmatter.test.ts
  - scripts/kit-model.ts
  - scripts/kit-model.js
  - scripts/kit-model.test.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 27 (round 3): Code Review Report

**Reviewed:** 2026-07-31
**Depth:** deep (adversarial, delta `a9cfdad..HEAD` only, cross-file call-chain analysis)
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Five plans (27-24..27-28) closed the four round-2 Critical findings and WR-01. **All five closures
are real, and four of them I verified by reproduction on hermetic fixtures rather than by reading:**

| Round-2 finding | Closure | Evidence I captured |
|---|---|---|
| CR-01 (tag in front of a sigil) | **CLOSED for the node-property axis** | `_t: !!str &t … Agent(o)` / `allowed-tools: !!seq [*t]` now return `{ok:false}`. I walked the whole tag axis — `!!seq[*t]` butted, `!<tag:…> [*t]` verbatim, `! &t` bare, two stacked tags, tag on a continuation line, tag on a block-sequence item, tag inside a nested flow mapping, tag with a trailing comment — **every one refuses**. An alias needs an anchor in the same document, and any anchor-carrying line is now refused first, so the axis is genuinely shut, not the reported spelling. |
| CR-02 (install/uninstall derivation pair) | **CLOSED structurally** | The five helpers exist once, in `install/kit-source.ts`; the `Dirent` twins are gone from `uninstall.ts`; both binaries import the same module. Bodies are byte-identical to the pre-move `install.ts` forms apart from `GRUGOPS_SRC` → `srcRoot`. Every call site passes `GRUGOPS_SRC` as the single argument; there is no order to get wrong (each helper takes exactly one). |
| CR-03 (global visited set) | **CLOSED at both sites** | On `.claude/agents/real/x.md` + `alias -> real`: `srcNestedAdapterFiles` → `["alias/x.md","real/x.md"]`, `listAgentAdapters` → `["alias/x.md","real/x.md","top.md"]`. Adding `real/loop -> ..` changes neither answer and both return in 1 ms. The two ancestor stacks answer the predicate identically on every fixture I built. |
| CR-04 (undocumented refusal) | **CLOSED** | On a throwaway copy of the checkout: `--target <copy>`, `--target <copy>/.`, `--target <symlink-to-copy>`, no-args-from-inside, and `DRY_RUN=1` all exit **1** with **zero bytes on stdout** and 17/17 adapters intact. |
| WR-01 (tools cardinality) | **CLOSED** | A duplicate `allowed-tools` on a skill and a duplicate `tools` on the coordinator each red the gate by name. |

**The `kit-model` / `kit-source` divergence the prompt asked about is correct, not a defect.**
`kit-model` deliberately does not copy `catch { return out; }`: an unresolvable realpath there
carries no cycle key and falls through to `readDirOrThrow`, which throws naming the directory.
Copying the installer's swallow would have converted a named read failure into a silent `[]` and
broken this module's D-21 tier-1 fail-closed posture. The executor's recorded reasoning matches the
code.

**What is still open is one fail-open of exactly the recurring class, plus four residuals that are
the same "closed the spelling, not the axis" shape one level up.**

The Critical finding is the CR-01 fail-open returning a **third** time, on the axis nobody
enumerated: **YAML escape resolution**. The refusal machinery was widened twice for *node
properties* (`&`, `*`, `!`) while `unquote()` — which the module already *acts* on, stripping
backslashes — mangles YAML's numeric escapes into a value **no compliant loader produces**.
`allowed-tools: ["\x41gent(grugops-orchestrator)"]` flattens to `x41gent(grugops-orchestrator)`, no
spawn token, `{ok: true, value: false}` — the silent no-grant SUCCESS arm the module header names as
its own founding failure. Planted on a skill adapter in a hermetic mirror of the live tree, the whole
gate printed **ALL CHECKS PASSED, exit 0**.

The four warnings are: the D-29 ancestor stack traded a correctness bug for **exponential** walk cost
(measured: 51 s and 131 072 members from 18 directories, where the retired global visited set was
linear); the self-checkout marker pair is still a **hand-maintained literal with no forcing
function** — every fixture writes its own `install/install.ts` stub, which is precisely how
`install/install.sh` stayed dead long enough to become CR-04; the doctrine comment that *justifies*
the surviving duplicate walk (`install.test.ts:53`, "the installer stays a self-contained single
file") is now literally false and was not amended; and the cycle arm drops members with no `verify`
line, against `kit-source.ts`'s own stated invariant.

---

## Critical Issues

### CR-01: `unquote()` mangles YAML escape sequences — the silent no-grant arm, third spelling

**File:** `scripts/frontmatter.ts:297-305` (`unquote`, the `.replace(/\\(.)/g, "$1")` at `:299`),
reached from `:362` (`flush`), `:393` (block-sequence item) and `:504` (`keysGrantedAgentNames`);
identically in the committed `scripts/frontmatter.js`.

**Issue.** The module's contract is stated in its own header: *"The platform reads the VALUE the YAML
expresses; the guard read the bytes of one line. That asymmetry was the whole defect."* Rounds 1 and
2 widened the refusal over **node properties** — anchor, alias, and now tag. Nobody enumerated the
**escape** axis, and on that axis the module does not read the bytes *and* does not read the value:
it produces a third string that is neither.

YAML 1.2 double-quoted scalars carry numeric escapes — `\xNN` (8-bit), `\uNNNN` (16-bit), `\UNNNNNNNN`
(32-bit) — alongside `\n`, `\t`, `\"`. `unquote()` handles the *single-character* escapes correctly
by accident (`\\(.)` → `$1` gives `\"` → `"`, `\\` → `\`) and destroys the numeric ones: it deletes
the backslash and leaves the hex digits as literal text. So `"\x41gent(grugops-orchestrator)"`
becomes `x41gent(grugops-orchestrator)` — the `\bAgent\b` token is gone, `keysHaveSpawnGrant()`
returns false, and the result is `{ ok: true, value: false }`: the SUCCESS arm, on a document whose
allow-list resolves to `Agent(grugops-orchestrator)` under any loader that implements the spec.

Note what this is *not*: it is not the module "leaving a quoted literal alone", which the header
argues is safe (`tools: "*t"` correctly grants nothing). The module actively rewrites the string and
gets the rewrite wrong. There is no reading of YAML under which `"\x41gent(x)"` means `x41gent(x)`.

**Reproduced end-to-end** (hermetic mirror of the live tree at `CHECK_ROOT`, plant on
`.claude/skills/grugops-map/SKILL.md` — the surface with no freshness gate and no role corpus to
cross-check, the same surface rounds 1 and 2 used):

```yaml
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - "\x41gent(grugops-orchestrator)"      # ONE backslash; bytes verified with od -c
```

```
$ node -e '… frontmatter.js …'
hasSpawnGrant: {"ok":true,"value":false}
allowed-tools flattened: ["Read, Write, Bash, Glob, Grep, x41gent(grugops-orchestrator)"]

$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does
        (23 non-coordinator adapter bodies + 2 packaging template(s) checked) ...
== Result ==
ALL CHECKS PASSED                      (exit 0)
```

`Agent(...)` reproduces identically. The mirror was restored byte-for-byte afterwards; the live
tree was never modified.

The direction is the dangerous one: a **rogue spawner hides**. (The mirror-image — a coordinator
whose grant is escaped — fails red, which is safe, and the adapters-freshness byte gate covers the
generated agent adapters anyway. The skill surface has neither protection, which is why the plant
goes there.)

**`UNKNOWN - verify`:** I could not execute a third-party YAML loader in this environment (no
`js-yaml`/`PyYAML` available, and I did not install one), so "Claude Code's own frontmatter loader
resolves `\x41`" is stated from the YAML 1.2 spec (§5.7 Escaped Characters) and from the behaviour of
js-yaml / PyYAML / SnakeYAML / go-yaml, not measured here. That caveat does not soften the finding:
whichever way the platform's loader goes, `x41gent` is not the value it computes, so the guard
returned a verdict over input it did not understand — the module's own definition of a parse artifact.

**Fix.** Refuse rather than resolve, exactly as the module does for every other construct it declines
to implement — a numeric escape means the value expressed is not the text on the line, which is the
same argument the header already makes three times:

```ts
// A numeric escape (\xNN, \uNNNN, \UNNNNNNNN) means the value this document expresses is not the
// text on this line. Resolving it would be this module decoding a document it deliberately does not
// decode; deleting the backslash (what `\\(.)` did) produces a string NO loader computes and lands
// in the silent no-grant SUCCESS arm. So it is a PARSE ARTIFACT, like an anchor, alias or tag.
const NUMERIC_ESCAPE = /\\(?:x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/;
```

Test it at the same node starts `startsWithReference` is applied to (key-line value, continuation
line, block-sequence item), *before* flattening, and return the existing `refuseRef`-shaped failure
arm with a reason naming the escape. Keep the substring `anchor or alias` in the reason (two shipped
assertions match on it) and add the escape clause beside the tag clause.

Then extend the axis enumeration rather than adding one row: add `\x41`, `A`, `\U00000041`,
mid-value and leading placements, single-quoted (`'\x41gent'` — where the backslash is **literal** in
YAML and must NOT be refused, the false-red control) and the `\\x41` double-backslash control, to
`REFUSED_FORMS` / the accepted-forms table in `scripts/frontmatter.test.ts`, and add an
aggregator-level skill-surface case in `scripts/check-foundation-guards.test.ts` mirroring the CR-01
round-1 and round-2 cases.

**Also worth enumerating in the same pass, since the axis is "what does `unquote` do that YAML does
not":** `unquote` is applied to the **joined** value (`:362`), so a multi-line double-quoted scalar's
escape processing already happens after the join, and YAML's line-folding-with-`\`-continuation rules
are approximated by a space join. I did not find a grant-hiding shape through that today, but it is
the same class and it is unpinned.

---

## Warnings

### WR-01: the D-29 ancestor stack made both walks exponential in paths — a linear cycle guard was replaced with an unbounded one

**File:** `install/kit-source.ts:191-219` (`srcNestedAdapterFiles`, `ancestors` at `:193`, `:202-203`)
and `scripts/kit-model.ts:190-217` (`walkFilesRelative`, `:199`, `:200`); both committed `.js` twins.

**Issue.** The retired global `seen` set visited each physical directory **once** — O(dirs). The
per-path ancestor stack is correct for membership (that is CR-03, properly closed) but it removes the
only thing bounding *work*: the walk now enumerates every distinct symlink **path**, and that count is
exponential in the number of cross-links. Both headers claim the guard is "for bounding recursion";
it bounds recursion **depth** only. The plans considered the correctness axis and not the cost axis.

**Measured** (18 directories under `.claude/agents`, each holding forward symlinks to its successors
— 153 symlinks total, one leaf `.md`, no cycle at all):

```
$ node -e 'srcNestedAdapterFiles(root)'
members: 131072   ms: 51263
```

131 072 result strings and 51.3 s from a 153-link tree; the count doubles per added directory, so 24
directories is ~55 minutes and 8.4 M retained strings before it OOMs. `scripts/kit-model.ts` has the
identical shape and runs inside `check-foundation-guards.js` in CI, so the same tree hangs the gate
rather than failing it — and a gate that hangs is a gate that gets killed and re-run, not read.

This is not a hypothetical about the committed tree (`.claude/agents` is flat). The installer walks
whatever `$GRUGOPS_SRC` points at, which is a user-supplied root.

**Fix.** Keep the per-path ancestor stack for the cycle answer and add a **separate, explicit
bound** — the two concerns are different and conflating them is what produced both the old defect and
this one:

```ts
// The ancestor stack answers "is this a cycle on THIS path" and nothing else. A symlink DAG has no
// cycle and still yields exponentially many paths, so the walk also needs a work bound. Exceeding it
// is a REPORTED refusal, never a silent truncation — a member dropped without a name is the failure
// this module exists to prevent.
const MAX_WALK_ENTRIES = 10_000;
```

and surface the overflow as a `verify(...)` line in the installer and as a thrown, named error in
`kit-model` (matching each side's documented floor). Pin it with a case that builds a small DAG and
asserts the refusal fires by name and the walk returns in bounded time.

---

### WR-02: the corrected marker pair is still a hand-maintained set literal with no forcing function — CR-04's root cause is untouched

**File:** `install/install.ts:568-571` and `install/uninstall.ts:535-538`
(`existsSync(join(TARGET, "install", "install.ts")) && existsSync(join(TARGET, "agent-factory", "VERSION"))`);
fixtures at `install/install.test.ts:475`, `:520`, `:572`.

**Issue.** CR-04's finding was that `install/install.sh` had not existed since `f9dab9f`, so the
marker half of the D-07 guard could never fire — and nothing noticed for the whole intervening
period. 27-28 corrected the *filename*. It did not add the thing whose absence let the dead marker
survive: **nothing asserts that the file the guard names exists in the real repository.**

All three fixtures create their own stub:

```ts
writeFileSync(join(fake, "install", "install.ts"), "// throwaway source-marker stub\n");
```

so every assertion is about the *predicate over a fixture*, and every one of them stays green if
`install/install.ts` is renamed or relocated in the real tree. Grepping the whole tooling layer,
`install/install.ts` appears only inside comments — no guard, no freshness check, no test reads it as
a fact. This repository's own terminal lesson is *derive the set, assert the count*; here the set is
two hand-written strings with neither.

**Concrete recurrence, not a hypothetical.** Move the TypeScript sources under a `src/` rootDir while
the emitted artifacts stay at `install/install.js` (a routine tsconfig change; the compiled `.js` is
what hosts run and the CLAUDE.md contract only pins *that*). `install/install.ts` no longer exists,
both marker halves go permanently dead, both binaries fall back to path-equality only — so a second
checkout named by `--target` is destroyed again — and `npx vitest run` stays 100 % green because the
fixtures manufacture the stub. That is CR-04, verbatim, with a different filename.

**Related, same root:** the guard names the **source** file rather than the **runtime** artifact.
`install/install.js` is the file that is by definition present wherever `uninstall.js` can run;
`install/install.ts` is present only because this repository happens to commit both.

**Fix.** Derive the marker from a fact the tooling already depends on, and assert it:

```ts
// The marker names files this repository is CONTRACTED to contain. Asserted, not assumed — the
// previous marker named install/install.sh for ~100 commits after that file was deleted (CR-04),
// and no case could see it because every fixture wrote its own stub.
const SOURCE_MARKERS = ["install/install.js", "agent-factory/VERSION"] as const;
```

and add a case in `install/install.test.ts` that asserts, over `REPO_ROOT` (read-only, no fixture),
that every entry of `SOURCE_MARKERS` exists — importing the constant from the module rather than
restating it, so a rename cannot pass. Prefer `install.js` over `install.ts` (or require either) so
the marker names the artifact whose presence the run already proves.

---

### WR-03: the recorded justification for the surviving duplicate walk is now false, in a file this round edited

**File:** `install/install.test.ts:45-59` (the comment above the `kit-model` import, esp. `:53`).

**Issue.** That comment is the *locked-decision record* for why the same predicate is answered twice:

> `install.ts` deliberately does NOT import `scripts/kit-model.ts`: the locked decision is that the
> **installer stays a self-contained single file**, so two implementations of "what is an adapter"
> continue to exist. That is a deliberate exception to the one-authority-per-predicate doctrine …

As of this round it is false in both halves. `install.js` imports `./kit-source.js`, so the installer
is two files; and D-28 explicitly **amended** the rationale — `install/kit-source.ts:29-35` now says
D-18's real reason was decoupling from the `scripts/` layout, not file count. `install.test.ts` was
edited three times this round and this comment was not touched.

This is not cosmetic. It is the only place a future reader finds the argument for keeping
`kit-source.srcNestedAdapterFiles()` and `kit-model.walkFilesRelative()` as two implementations of
one predicate — the duplication that produced CR-03 (two sites, two *different* wrong cycle answers).
A rationale that no longer holds is how a deliberate exception quietly becomes an accident. Both new
headers even concede the point, in the same words, at `install/kit-source.ts:184-190` and
`scripts/kit-model.ts` ("ONE PREDICATE, TWO SITES, NO IMPORT … CR-03 is what answering one predicate
in two places produced").

**Fix.** Amend the comment to the D-28 rationale it is now downstream of, and state the equality
contract explicitly:

```ts
// install.ts does NOT import scripts/kit-model.ts because D-18/D-28 keep the installer decoupled
// from the scripts/ LAYOUT — not because it is one file (since D-28 it is two: install.js +
// kit-source.js). The exception costs one duplicated predicate, and this import plus the `source
// derivation` conformance case and the two CR-03 cycle cases are what buy the equality back.
```

Then add the equality case those headers promise but no file makes: assert
`srcNestedAdapterFiles(src)` equals the nested subset of `listAgentAdapters(src)` **over the CR-03
two-path fixture and over the `loop -> ..` cycle fixture**. Today the two walks are asserted equal
only over flat and simple-nested trees; the shapes their shared cycle answer exists for are pinned
independently at each site, which is exactly how the two answers drifted last time.

---

### WR-04: the cycle arm drops members silently, against `kit-source.ts`'s own stated invariant

**File:** `install/kit-source.ts:202` (`if (ancestors.includes(real)) return out;`) and
`scripts/kit-model.ts:199`.

**Issue.** Both headers state, twice, that the installer *"must not be the one place a file
disappears silently"* and that it *"may never be BLIND to a member … because a member it cannot see
is a member it cannot refuse by name."* The cycle arm returns an empty array with no report, no
`verify` line, and no name.

**Reproduced.** With `.claude/agents/real/x.md` and `.claude/agents/real/loop -> ..`:

```
kit-source nested: ["alias/x.md","real/x.md"]
kit-model:         ["alias/x.md","real/x.md","top.md"]
```

`real/loop/agents/x.md` and `real/loop/agents/top.md` are dropped by both walks, in silence. The run
then reports `INCOMPLETE` for the members it *did* refuse and says nothing at all about the ones it
declined to look at.

Scope, stated precisely so the finding is not over-claimed: because **both** sites drop the same set,
the "blind to a member the *authority* sees" invariant is not violated and install/uninstall stay
symmetric — this is strictly weaker than CR-03. The gap is against the *platform*, which discovers
`.claude/agents/` recursively and would encounter those paths. **`UNKNOWN - verify`:** I did not
measure what Claude Code does with a symlink loop under `.claude/agents/`, so "the platform would load
them" is the modules' own premise applied consistently, not something I confirmed.

**Fix.** Make the cycle a reported event rather than a silent one — the same treatment the nested
adapter already gets:

```ts
if (ancestors.includes(real)) {
  cyclesFound.push(base);   // surfaced by the caller as a `verify` line naming the relative path
  return out;
}
```

and in `kit-model`, where the floor is throw-not-report, raise the named error the module's other
floors raise. Pin it with a case asserting the installer *names* the cycle path and does not print
`== install complete ==`.

---

## Info

### IN-01: the `isAgentAdapter` scoping gate is a no-op on the live tree and has no case

**File:** `scripts/check-foundation-guards.ts:706` (`const isAgentAdapter = AGENT_ADAPTERS.includes(f)`),
`:711`, `:718`, `:720`.

**Issue.** 27-26 widened the loop to `SPAWN_GRANT_SCAN` and gated the absence/emptiness arms behind
`isAgentAdapter` to preserve their prior firing set. All seven committed skills declare
`allowed-tools`, so `declaredToolsValues` is non-empty for every skill today — deleting the gate would
change nothing on the live tree, and I found no case in
`scripts/check-foundation-guards.test.ts` that plants a skill with **no** `allowed-tools` and asserts
it stays green. The scoping decision the plan calls load-bearing is therefore unexercised: whether a
future skill that omits the key reds the gate is decided by an untested branch. (Path spellings do
match — both arrays are built from the same `kit-model` output with different fixed prefixes — so
`includes` cannot silently mis-compare.)

**Fix.** Add the negative control: a skill fixture with no `allowed-tools` (guard stays green, scoping
proven) beside the existing agent-adapter absence case (guard reds).

---

### IN-02: a YAML directive line before `---` yields "no frontmatter, no keys" — a silent SUCCESS

**File:** `scripts/frontmatter.ts:439-445` (`parseFrontmatter`).

**Issue.** `parseFrontmatter` requires the first non-blank line to be exactly `---`. A document opening
with a `%YAML`/`%TAG` directive (legal YAML prologue) therefore takes the *no block at all* arm and
returns `{ ok: true, value: new Map() }` — no keys, no grant, no finding. Verified:
`"%TAG !e! tag:x,2000:\n---\nname: x\ntools: Read, Agent(o)\n---\n"` → `{"ok":true,"value":false}`.
The same input's `tools` value is plainly a grant.

**`UNKNOWN - verify`:** most markdown frontmatter readers also require `---` on line 1, so the platform
probably sees no frontmatter either and the file is inert rather than rogue. I did not confirm this
against Claude Code. Given the module's stated three-outcome contract, "a directive-prefixed document"
belongs in the *unreadable* arm rather than the *legitimately keyless* one.

**Fix.** Either refuse a leading `%`-directive line by name, or record it as an explicit open edge in
the header beside the other named non-goals so the next reader does not have to rediscover it.

---

### IN-03: `DRY_RUN=1 node install/uninstall.js` inside a checkout now exits 1 with no output

**File:** `install/uninstall.ts:533-542`; `install/README.md:152-160`.

**Issue.** The guard is always-on and deliberately not exempted by `DRY_RUN` (correct for a mechanical
safety check). The consequence is that the *preview* path inside a grugops checkout now produces zero
stdout and exit 1, where it previously printed a full plan. Verified on the throwaway copy. The exit
table documents code 1, but the reversal section at `README:152-160` still presents
`DRY_RUN=1 node install/uninstall.js` as an unconditional preview.

**Fix.** One clause in the reversal section: "the self-checkout refusal is always on and is not
exempted by `DRY_RUN` — previewing inside a grugops checkout also exits `1` and prints nothing; pass
`--allow-self` to preview there."

---

## Verification notes (methodology, so the claims above are checkable)

- All destructive probes ran against `scratchpad/checkout`, a `cp -R` throwaway; the live checkout was
  never a `--target`.
- Guard reproductions ran against `scratchpad/mirror` via `CHECK_ROOT=`, restored byte-for-byte after
  each plant. Baseline on the untouched mirror: `ALL CHECKS PASSED`, exit 0.
- `npm test` was **not** run (live claude-CLI e2e lane). No source file was modified.

---

_Reviewed: 2026-07-31_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep — adversarial, round 3, delta `a9cfdad..HEAD`_
_CR-01 is reproduced end-to-end (parser verdict, flattened value and gate banner captured). WR-01 is
measured (member count and wall clock). WR-02/WR-03/WR-04 are traced in code with the reproducing
shape stated. Every claim I could not execute is marked `UNKNOWN - verify` rather than asserted._
