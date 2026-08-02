---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-08-02T00:00:00Z
depth: standard
round: 4
diff_base: 2138d8e
files_reviewed: 90
findings:
  critical: 3
  warning: 2
  info: 1
  total: 6
status: issues_found
path_note: >
  The workflow supplied review_path=27-REVIEW.md. That file is ROUND 1's report and 14 live
  source-code comments cite it by section (`27-REVIEW.md § CR-01`, `§ CR-02`, `§ WR-05`, ...) in
  scripts/frontmatter.ts, scripts/kit-model.ts, scripts/kit-model.test.ts,
  scripts/adapters-freshness.test.ts, scripts/check-foundation-guards.ts and install/install.test.ts.
  Overwriting it would silently invalidate every one of them. This report is therefore written to
  the phase's own established round-N path (27-REVIEW.md -> 27-REVIEW-GAPS.md -> -GAPS-2 -> -GAPS-3
  -> -GAPS-4). Cite this round's findings as `27-REVIEW-GAPS-4 § CR-01` etc.
files_reviewed_list:
  - .claude/agents/grugops-agents-md-scribe.md
  - .claude/agents/grugops-architect-design.md
  - .claude/agents/grugops-ba-pm.md
  - .claude/agents/grugops-brownfield-mapper.md
  - .claude/agents/grugops-compliance-officer.md
  - .claude/agents/grugops-factory-coach.md
  - .claude/agents/grugops-frontend-ui.md
  - .claude/agents/grugops-greenfield-mapper.md
  - .claude/agents/grugops-incident-responder.md
  - .claude/agents/grugops-installer.md
  - .claude/agents/grugops-orchestrator.md
  - .claude/agents/grugops-qe-e2e.md
  - .claude/agents/grugops-release-manager.md
  - .claude/agents/grugops-security-nfr.md
  - .claude/agents/grugops-software-engineer.md
  - .claude/agents/grugops-system-analyst.md
  - .claude/agents/grugops-uat-planner.md
  - .claude/skills/grugops-gate/SKILL.md
  - .claude/skills/grugops-map/SKILL.md
  - .claude/skills/grugops-plan/SKILL.md
  - .claude/skills/grugops-release/SKILL.md
  - .claude/skills/grugops-ticket/SKILL.md
  - .claude/skills/grugops-uat/SKILL.md
  - .claude/skills/grugops/SKILL.md
  - .github/workflows/ci.yml
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/roles/agents-md-scribe.md
  - agent-factory/roles/architect-design.md
  - agent-factory/roles/ba-pm.md
  - agent-factory/roles/brownfield-mapper.md
  - agent-factory/roles/compliance-officer.md
  - agent-factory/roles/factory-coach.md
  - agent-factory/roles/frontend-ui.md
  - agent-factory/roles/greenfield-mapper.md
  - agent-factory/roles/incident-responder.md
  - agent-factory/roles/installer.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/qe-e2e.md
  - agent-factory/roles/release-manager.md
  - agent-factory/roles/security-nfr.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/roles/system-analyst.md
  - agent-factory/roles/uat-planner.md
  - agent-factory/workflows/14-ui-design-to-build.md
  - agent-factory/workflows/15-security-audit.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - agent-factory/workflows/18-context-compaction.md
  - docs/catalog/README.md
  - install/install.js
  - install/install.test.ts
  - install/install.ts
  - install/kit-source.js
  - install/kit-source.ts
  - install/README.md
  - install/uninstall.js
  - install/uninstall.ts
  - package.json
  - scripts/adapters-freshness.js
  - scripts/adapters-freshness.test.ts
  - scripts/adapters-freshness.ts
  - scripts/check-foundation-guards.js
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-kit-refs.js
  - scripts/check-kit-refs.test.ts
  - scripts/check-kit-refs.ts
  - scripts/coordinator-resolution-precheck.js
  - scripts/coordinator-resolution-precheck.test.ts
  - scripts/coordinator-resolution-precheck.ts
  - scripts/dead-vocabulary.js
  - scripts/dead-vocabulary.ts
  - scripts/frontmatter.js
  - scripts/frontmatter.test.ts
  - scripts/frontmatter.ts
  - scripts/generate-role-adapters.js
  - scripts/generate-role-adapters.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/kit-model.js
  - scripts/kit-model.test.ts
  - scripts/kit-model.ts
  - scripts/validate-agent-factory.js
  - scripts/validate-agent-factory.ts
  - scripts/validate.test.ts
  - skills/gate/SKILL.md
  - skills/grugops/SKILL.md
  - skills/map/SKILL.md
  - skills/plan/SKILL.md
  - skills/release/SKILL.md
  - skills/ticket/SKILL.md
  - skills/uat/SKILL.md
---

# Phase 27: Code Review Report — Round 4

**Reviewed:** 2026-08-02
**Depth:** standard (adversarial, budget-weighted per the round-4 scope prioritization)
**Files Reviewed:** 90 in scope; deep read on the twelve round-4 sources plus their consumers
**Status:** issues_found

## Summary

Three reproduced blockers. Every one was reproduced end-to-end against the **committed `.js`**, and
two of the three end in `ALL CHECKS PASSED` / `exit 0` on a tree carrying a live rogue spawn grant.
The baseline the prompt supplied — 1015 tests passing, `check-foundation-guards.js` green,
32 fresh `.js` — was green for every one of them, exactly as it was green for the three prior rounds.

The headline is a **fourth spelling of the same fail-open in `scripts/frontmatter.ts`**, on the axis
the round-3 fix left open. Round 3 (D-30) correctly *inverted* the escape decision — allowlist the
three it resolves, refuse everything else by default — and the module header argues at length that
enumerating one more bad spelling is how you get round five. D-34 then landed thirty lines away and
did precisely that: it enumerated **one** bad prologue (`%directive`) in front of the opening
delimiter and left the whole complement of that test still falling into the keyless SUCCESS arm.
A three-byte UTF-8 BOM is the complement's most ordinary member, and it walks straight through.

The two other blockers are set-membership holes of the founding class this milestone exists to
delete: a directory the installer cannot read disappears with no name under `== install complete ==`
(the twin authority `kit-model.ts` throws naming it), and the **plugin-form `skills/` tree — real,
shipped, loaded by Claude Code via `.claude-plugin/plugin.json` — is in no spawn-grant scan set at
all**, while `guard_wr05`'s PASS line asserts "no non-coordinator does".

Corpus-level checks that came back clean and are worth recording: exactly **one** coordinator across
the derived adapter set (`.claude/agents/grugops-orchestrator.md`), it holds the grant, all 17
granted names resolve to an installed adapter, and the generator's `yamlQuote()`
(`scripts/generate-role-adapters.ts:139-141`) emits only `\\` and `\"` — both inside
`DQ_ESCAPE_ALLOWLIST` — so the generator cannot itself produce a document its own parser refuses.

## Critical Issues

### CR-01: A UTF-8 BOM (and any non-`[ \t]` byte adjoining the `---`) puts a live spawn grant in the silent no-grant SUCCESS arm — the fourth spelling

**File:** `scripts/frontmatter.ts:683-697` (`parseFrontmatter`), specifically the delimiter test at
`:695`; committed twin `scripts/frontmatter.js`.

**Issue.**
`parseFrontmatter` decides "is there a frontmatter block at all" with one byte-exact comparison:

```ts
if (i >= lines.length || lines[i].replace(/[ \t]+$/, "") !== "---") {
  return { ok: true, value: new Map() };      // <- the keyless SUCCESS arm
}
```

Only `[ \t]` is stripped, and only from the **end**. Anything else adjoining the delimiter — a
leading BOM, a trailing form feed, a trailing NBSP — misses the comparison and lands in
`{ ok: true, value: new Map() }`: no keys, no grant, no finding, a result byte-identical to a
body-only file. That is the module's own founding failure, stated in its header three times
("I could not read this" printed as "this carries no grant"), reached this round by prepending
three bytes instead of by editing a value.

Note precisely why the existing D-34 refusal does not cover it. D-34 added `YAML_DIRECTIVE`
**before** this test and argued (`:142-146`) that the test is "positional and takes no lookahead,
deliberately" so the two-directive prologue is caught too. That reasoning is sound *within the `%`
axis* and completely absent *across axes*: `%` was enumerated, and the complement of "is exactly
`---` after a trailing-`[ \t]` strip" was left as a silent success. This is the enumerate-the-bad
shape D-30 declined by name, re-entering the module one screen below where D-30 is argued.

`String.prototype.trim()` **does** strip U+FEFF (it is in ECMAScript's WhiteSpace set), so the
blank-skipping loop at `:686` walks past nothing and the BOM survives only into the comparison —
which is why the failure is silent rather than loud.

**Failure scenario.** A contributor on Windows edits or regenerates a skill adapter with any tool
that writes UTF-8-with-BOM (Windows PowerShell 5.1's `Set-Content`/`Out-File` do so by default;
several Windows editors do). The file's `allowed-tools` gains, or already carries, `Agent(...)`.
`guard_wr05` reads no frontmatter, records no grant, reports no parse failure, and prints its
both-direction PASS. Adversarially: this is the cheapest known way to plant a rogue spawner in this
tree. The repository already carries a standing Windows-portability obligation, so the input is not
hypothetical.

**Which surface is exposed.** Agent adapters are caught *incidentally* — `keys.has("name")` is false
so the `name` floor at `check-foundation-guards.ts:707` fires — but with a **wrong diagnosis**
("carries no `name` key in its frontmatter" on a file whose `name:` key is plainly present, which
sends the next author to fix the wrong thing). **Skill adapters have no `name` floor and no `tools`
floor** (both are scoped behind `isAgentAdapter` at `:706-722`), no freshness gate and no role
corpus to cross-check — the exact surface the module header itself names as the soft one in rounds
1, 2 and 3.

**Reproduction (parser level).**
```
$ node -e "import('./scripts/frontmatter.js').then(m => {
    const good = '---\nname: rogue\ntools: Read, Agent(grugops-orchestrator)\n---\nbody\n';
    console.log('no BOM  :', JSON.stringify(m.hasSpawnGrant(good)));
    console.log('with BOM:', JSON.stringify(m.hasSpawnGrant('﻿' + good)));
  });"
no BOM  : {"ok":true,"value":true}
with BOM: {"ok":true,"value":false}
```

**Reproduction (whole gate, hermetic mirror, byte-level control).** Mirror the live tree; set
`.claude/skills/grugops-map/SKILL.md`'s allow-list to
`allowed-tools: Read, Grep, Agent(grugops-orchestrator)`; run with and without a 3-byte BOM as the
**only** difference:

```
WITH BOM (EF BB BF at offset 0):
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js ; echo EXIT=$?
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does
        (23 non-coordinator adapter bodies + 2 packaging template(s) checked), ...
ALL CHECKS PASSED
EXIT=0

WITHOUT BOM (same bytes minus EF BB BF):
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js ; echo EXIT=$?
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-map/SKILL.md: non-coordinator carries a spawn grant — rogue spawner
        (only the coordinator: true file may hold the grant)
EXIT=1
```

A second, independent member of the same complement reproduces identically: replacing the opening
`---` with `--- ` (trailing NBSP) on the same planted file also yields `ALL CHECKS PASSED`,
exit 0.

**Coverage gap, measured.** `grep -c 'FEFF\|feff\|BOM\|\\ufeff'` over `scripts/frontmatter.test.ts`,
`scripts/check-foundation-guards.test.ts` and `scripts/validate.test.ts` returns **0, 0, 0**. There
is no encoding case anywhere in the suite.

**Fix.** Apply D-30's own remedy to this test instead of enumerating a second bad prologue. The
decision must invert: the head of the document either **is** a clean frontmatter opening, or it
**is** a clean body-only document, and everything else refuses by name — so the *fifth* spelling
refuses by default rather than being round five.

```ts
// scripts/frontmatter.ts — parseFrontmatter
export function parseFrontmatter(text: string): Parsed<FrontmatterKeys> {
  const lines = stripFencedBlocks(text.replace(/\r\n/g, "\n")).split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && YAML_DIRECTIVE.test(lines[i])) { /* D-34 refusal, unchanged */ }
  if (i < lines.length) {
    const head = lines[i];
    // THE COMPLEMENT REFUSES BY DEFAULT (the D-30 argument, applied to the delimiter test).
    // A line that TRIMS to the delimiter but is not BYTE-EQUAL to it carries bytes this module
    // does not decode — a BOM, a form feed, an NBSP, a stray CR. The platform's own frontmatter
    // reader very likely strips them (js-yaml and gray-matter both strip a leading BOM), so the
    // value the document EXPRESSES is not the value these bytes spell to this module. That is a
    // PARSE ARTIFACT and it goes to the ok:false arm, exactly like an anchor, a tag or an escape.
    if (head.trim() === "---" && head !== "---") {
      return {
        ok: false,
        reason: `the document's opening line \`${excerpt(head)}\` trims to the \`---\` delimiter ` +
          `but is not byte-equal to it (first code point U+${head.codePointAt(0)!
            .toString(16).toUpperCase().padStart(4, "0")}) — it carries bytes this module does not ` +
          `decode, so it is refused as unreadable rather than read as "no frontmatter, no keys"`,
      };
    }
  }
  if (i >= lines.length || lines[i] !== "---") {
    return { ok: true, value: new Map() };   // genuinely body-only — the one legitimate keyless arm
  }
  // ... unchanged from here
}
```

Apply the same byte-exactness to the CLOSING delimiter scan at `:700-706` (it strips `[ \t]+$` too,
so a `--- ` close line closes nothing and an otherwise-valid block reports "opened and never
closed" — a false red, but from the same unexamined assumption).

Then pin the property, not the row, the way D-30's exhaustive escape sweep does: sweep every
Unicode-whitespace and format code point in the pre- and post-delimiter position and assert
`ok === false` for every one, plus the two positive controls (`---` opens; a body-only document
succeeds with no keys). Add at least one **aggregator-level** case that plants a BOM'd rogue grant on
a **skill** adapter in a hermetic mirror and asserts the gate exits non-zero — the agent-adapter path
is caught by an unrelated floor and would give the case a false green.

Separately, correct the misdiagnosis: `check-foundation-guards.ts:707`'s `name`-floor message must
not assert "carries no `name` key" when the parse returned zero keys for the whole document. Those
are different facts, which is this module's own founding argument.

---

### CR-02: An unreadable directory under the source `.claude/agents/` disappears with no name, and the installer prints `== install complete ==` at exit 0

**File:** `install/kit-source.ts:349-354` (the `readdirSync` catch inside `srcNestedAdapterFiles`'s
`walk`) and `:335-340` (the `realpathSync` catch immediately above it). Committed twin:
`install/kit-source.js`.

**Issue.**
`srcNestedAdapterFiles` was rebuilt in round 4 (D-35/D-36) so the walk "reports what it could not do,
not just what it found" — it returns `{ files, cycles, overflow }` and `install.ts` surfaces all
three. Two arms were not given that treatment and still `return;` bare:

```ts
try { real = realpathSync(here); } catch { return; }   // :336-340 — no name, no report
...
try { names = readdirSync(here); } catch { return; }   // :349-354 — no name, no report
```

Neither writes into `cycles`, neither sets `overflow`, and `NestedWalkResult` has no third channel,
so the caller has nothing to report. The module's stated justification covers only the **root**:
"A read failure at any level yields [] here rather than null: an unreadable root is already the
`srcAdapterFiles()` null branch's finding" (`:241-242`). But `srcAdapterFiles()` reads only the
**top level** — it never touches a nested directory — so a nested read failure is reported *nowhere*.
The justification is written for the root and silently extended to "any level".

This violates two invariants this same file asserts in its own header: *"The installer must not be
the one place a file disappears silently"* (`:78`) and *"a member it cannot see is a member it
cannot refuse by name"* (`:261`). It also breaks the D-36 symmetry claim: the twin
`scripts/kit-model.ts:270` routes the identical condition through `readDirOrThrow`, which **throws
naming the directory**. Same predicate, two sites, one of them silent — the exact shape CR-03/D-29
closed for the cycle arm and left open here.

**Failure scenario.** A source checkout carries `.claude/agents/nested/` that cannot be enumerated
(a partial extract, a restrictive umask, a permissions-preserving tarball, an EACCES from a mounted
volume). A nested adapter with a live grant sits inside. The installer neither installs it (correct
— flat by contract) nor refuses it by name (the entire purpose of `srcNestedAdapterFiles`), and
closes with `== install complete ==` at exit 0. Every downstream consumer that keys on that exit
code — a `&& next-step` chain, CI, and `scripts/coordinator-resolution-precheck.ts:286-295`, which
checks the exit status *and* the banner — proceeds over a class the installer never examined. That is
a fabricated completion claim, against CLAUDE.md's no-fabrication hard rule and its
installer-reversibility constraint.

**Reproduction (twin divergence).**
```
$ mkdir -p $S/.claude/agents/nested
$ printf -- '---\nname: hidden\ntools: Read, Agent(x)\n---\nbody\n' > $S/.claude/agents/nested/hidden.md
$ chmod 000 $S/.claude/agents/nested

$ node -e "import('$S/install/kit-source.js').then(m=>console.log(JSON.stringify(m.srcNestedAdapterFiles('$S'))))"
{"files":[],"cycles":[],"overflow":null}          <- silent; nothing for the caller to report

$ node -e "import('./scripts/kit-model.js').then(m=>{try{m.listAgentAdapters('$S')}catch(e){console.log('THREW:',e.message)}})"
THREW: kit-model: cannot read kit directory .../.claude/agents/nested
```

**Reproduction (end-to-end, with control).**
```
DIRECTORY UNREADABLE (chmod 000):
$ GRUGOPS_HOME=$H node $S/install/install.js --target $T --yes ; echo EXIT=$?
== install complete ==
EXIT=0
$ grep -ci 'nested\|hidden' <captured output>   ->   0

SAME TREE, DIRECTORY READABLE (chmod 755) — the control:
$ GRUGOPS_HOME=$H node $S/install/install.js --target $T --yes ; echo EXIT=$?
  verify   .claude/agents/nested/hidden.md — the adapter directory is FLAT BY CONTRACT, so this
           nested adapter was NOT installed. ...
== install INCOMPLETE — 1 item(s) need verification ==
EXIT=3
```

Making the directory *less* readable makes the installer *more* confident. That inversion is the
defect.

**Fix.** Give the walk the fourth channel it needs and route both silent arms through it, mirroring
the `cycles` treatment D-36 already built:

```ts
// install/kit-source.ts
export interface NestedWalkResult {
  files: string[];
  cycles: string[];
  unreadable: string[];          // NEW — relative paths the walk could not enumerate
  overflow: NestedWalkOverflow | null;
}

const walk = (base: string, ancestors: readonly string[]): void => {
  ...
  try { real = realpathSync(here); } catch { unreadable.push(base || "."); return; }
  ...
  try { names = readdirSync(here); } catch { unreadable.push(base || "."); return; }
```

and in `install/install.ts`, beside the existing `cycles` loop at `:1490`:

```ts
for (const rel of SRC_NESTED.unreadable) {
  verify(
    `.claude/agents/${rel} — the nested-adapter walk COULD NOT READ this directory, so anything ` +
      `below it was neither installed nor refused by name. This is not the same fact as an empty ` +
      `directory and needs a different remedy: fix the permissions or restore the checkout, then ` +
      `re-run.`,
  );
}
```

Pin it with a harness case that `chmod 000`s a nested source directory and asserts `status === 3`
plus `stdout` naming the path. Also add the equality case the D-36 comment promises — that
`kit-model` and `kit-source` name the **same** relative path on this arm — which today cannot pass,
because one of them names nothing.

---

### CR-03: The shipped plugin-form `skills/` tree is in no spawn-grant scan set — a rogue grant there passes the whole gate while `guard_wr05` claims "no non-coordinator does"

**File:** `scripts/check-foundation-guards.ts:365-375` and `:458` (`SPAWN_GRANT_SCAN` derives from
`.claude/agents` ∪ `.claude/skills` ∪ packaging templates only). The uncovered surface is
`skills/{gate,grugops,map,plan,release,ticket,uat}/SKILL.md`.

**Issue.**
This repository ships a **real** Claude Code plugin: `.claude-plugin/plugin.json` exists with
`name: "grugops"`, and per this project's own stack notes (CLAUDE.md § "1. `plugin.json`")
*"Components live at plugin **root** (`agents/`, `commands/` or `skills/`, `hooks/`), never inside
`.claude-plugin/`"*. So `skills/*/SKILL.md` is a live, platform-loaded surface for every user who
installs via `/plugin install grugops@grugops` — the distribution form CLAUDE.md § "Stack Patterns
by Variant" prescribes alongside the standalone one.

`SPAWN_GRANT_SCAN` never sees it. Neither does anything else: `scripts/adapters-freshness.ts`
contains no `skills` reference at all, and `scripts/generate-role-adapters.ts` writes only to
`.claude/agents` (`OUT_DIR`, `:82`), so the plugin-form skills are neither generated nor
freshness-compared against their `.claude/skills/` twins. `scripts/check-kit-refs.ts:202-206`
explicitly reasons about this tree — but only for the *resolver-slot* predicate ("it carries no
resolver block ... it could only ever appear on the illegal side"). Nobody scoped it for **spawn
grants**, and the two predicates are unrelated.

The result is a false claim in the guard's own PASS line: it prints *"no non-coordinator does"* over
a scan that structurally cannot see seven shipped, platform-loaded skill files. This is the founding
defect class of the milestone — a membership set narrower than the fact it claims to describe —
surviving inside the guard the milestone rewrote to delete it.

**Failure scenario.** A grant is added to `skills/plan/SKILL.md` (hand-edit, bad merge, or a
contributor syncing the plugin mirror from a modified `.claude/skills/` twin). Every user on the
plugin distribution path gets a second spawner with an enumerated allowlist. CI is green, and the
divergence from `.claude/skills/grugops-plan/SKILL.md` is not caught either, because nothing compares
the two trees.

**Reproduction.** Mirror the live tree including `.claude-plugin/`; add one line to
`skills/plan/SKILL.md`:

```yaml
allowed-tools:
  - Agent(grugops-orchestrator, grugops-installer)
  - Read
  - Write
```

```
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js ; echo EXIT=$?
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does
        (23 non-coordinator adapter bodies + 2 packaging template(s) checked), ...
ALL CHECKS PASSED
EXIT=0

$ CHECK_ROOT=<mirror> node scripts/check-kit-refs.js ; echo EXIT=$?
ALL CHECKS PASSED
EXIT=0
```

**Fix.** Derive the plugin-form skill set from the same authority and fold it into the scan, so the
set follows the filesystem rather than a decision made once:

```ts
// scripts/kit-model.ts — one authority, one more consumer of the SAME walk
const PLUGIN_SKILLS_SUBPATH = "skills";
export const PLUGIN_SKILL_ADAPTER_COUNT = 7;
export function listPluginSkillAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
  const dir = join(kitRoot, PLUGIN_SKILLS_SUBPATH);
  return refuseEmpty(
    walkFilesRelative(dir).filter((rel) => rel.split("/").pop() === "SKILL.md").sort(),
    dir, "plugin-form skill adapter",
  );
}
```

```ts
// scripts/check-foundation-guards.ts
const PLUGIN_SKILL_DERIVATION = derive(() => listPluginSkillAdapters(ROOT));
const PLUGIN_SKILLS = PLUGIN_SKILL_DERIVATION.files.map((rel) => `skills/${rel}`);
const SPAWN_GRANT_SCAN = [...ADAPTERS, ...PLUGIN_SKILLS, ...PACKAGING_TEMPLATES];
```

Then make the claim honest: `guard_wr05`'s PASS line must **name the input it read** (the discipline
plan 27-20 already imposed on the tier-beat claim), i.e. report the plugin-skill count alongside the
adapter and template counts. Enforce `PLUGIN_SKILL_ADAPTER_COUNT` in `guardKitCounts` — the plugin
tree has no role corpus to cross-check, so a count is the only deletion signal, by the exact argument
`kit-model.ts:57-65` already makes for `SKILL_ADAPTER_COUNT`. Pin it with a plant case in
`check-foundation-guards.test.ts`.

If the considered decision is instead that this tree must be a byte-mirror of `.claude/skills/`, then
say so mechanically: add a freshness assertion pairing each `skills/<n>/SKILL.md` to its
`.claude/skills/grugops-<n>/SKILL.md`. Either answer is defensible; the current state — covered by
neither — is not.

## Warnings

### WR-01: The D-35 `process.exit()`-truncates-stdout fix was applied to one of the three files that end in exit-after-report, and `uninstall.ts` asserts a parity it does not have

**Files:** `install/uninstall.ts:730` (`process.exit(3)`; committed twin `install/uninstall.js:709`);
`scripts/coordinator-resolution-precheck.ts:598` (`process.exit(code)`).
**Related:** `install/install.ts:1570-1599`, `install/install.test.ts:2236-2247`.

**Issue.** Round 4 (plan 27-31, D-35) established, with a reproduction, that `process.exit()`
discards queued stdout when stdout is a **pipe** — 2 of 8 runs truncated at 223 102 and 520 729 bytes
against a full 1 065 689 — and replaced install.ts's tail with `process.exitCode = 3`.
`install.ts:1583-1588` then forbids spelling the old call *anywhere in that file, even in prose*, and
`install.test.ts:2236` pins its absence.

That pin loops over exactly two paths: `install.ts` and `install.js`. `uninstall.ts` still calls
`process.exit(3)` on the structurally identical INCOMPLETE-banner branch — while its own comment at
`:725-730` claims the opposite:

> "the same rule and the same code list as install.ts's tail ... Set on the SAME branch that prints
> the banner so the two signals cannot diverge. The two banners were written as one rule; applying
> the exit code to only one half would leave the pair disagreeing."

The pair *is* now disagreeing, and the comment asserting it cannot is the load-bearing part of this
finding: a future reader checking uninstall's tail is told it matches install's, and it does not.
`coordinator-resolution-precheck.ts:598` is brand-new round-4 code ending in the same call
immediately after ~40 `console.log` lines — written after the lesson, without it.

`install.ts:1596-1598` records a "KNOWN RESIDUAL" for its own six *mid-script* exit sites. It does
not mention either of these two, and neither is mid-script: both are the exact tail position the
D-35 fix was written for.

**Unreproduced, and flagged as such.** I did **not** reproduce truncation on either file. Both emit
kilobytes, not the ~1 MB of by-name refusals that made install.ts's race observable, so the practical
exposure today is low. The finding is the incomplete fix, the false parity claim, and the regression
scan's scope — all three of which are exact and verified.

**Fix.** Apply the same treatment to the same position:

```ts
// install/uninstall.ts — the INCOMPLETE branch tail (the if/else is the module's last statement)
process.exitCode = 3;
```

Extend `install.test.ts:2237-2240`'s loop to cover `uninstall.ts` and `uninstall.js` — the argument
in its own comment ("Both files are asserted because the committed .js is what runs on a host") is
already the argument for four rather than two. For `coordinator-resolution-precheck.ts:598`, use
`process.exitCode = code` (the `finally` has already run cleanup by then, so control flow is
unchanged), or route all three through the single `finish(code)` authority `install.ts:1598` says the
residual needs. Then either extend the residual note to name these two sites or delete the parity
claim in `uninstall.ts:725-730` — a comment describing a state the code is not in is worse than no
comment.

---

### WR-02: `keysGrantedAgentNames` silently drops and alters granted names, contradicting its own stated contract

**File:** `scripts/frontmatter.ts:730` (`SCOPED_GRANT`) and `:758-778` (`keysGrantedAgentNames`).

**Issue.** The doc block at `:753-757` states the contract explicitly:

> "a shorter or altered name list is a silent success, and the KIT-03 closure equality would then be
> computed over a set the document does not express ... a name is never silently dropped or altered."

Two inputs break it on the `ok: true` arm:

1. `SCOPED_GRANT = /\b(?:Agent|Task)\(([^)]*)\)/g` — `[^)]*` stops at the **first** `)`, so a nested
   paren truncates the capture and every name after it is **silently dropped**.
2. The capture is split on a bare `,` (`:764`) with no quote awareness, so a quoted name containing a
   comma is **split into two altered names** — and `unquoteChecked` returns each half unchanged on
   the success arm, because neither half is a *wholly*-quoted scalar.

**Reproduction.**
```
$ node -e "import('./scripts/frontmatter.js').then(m=>{
    console.log('nested paren:', JSON.stringify(m.grantedAgentNames('---\ntools: Agent(a(b), c)\n---\nx')));
    console.log('quoted comma:', JSON.stringify(m.grantedAgentNames('---\ntools: Agent(\"a,b\", c)\n---\nx')));
  });"
nested paren: {"ok":true,"value":["a(b"]}            <- `c` dropped, on the ok:true arm
quoted comma: {"ok":true,"value":["\"a","b\"","c"]}  <- `a,b` altered into two names, ok:true
```

**Failure scenario.** The consumers are the KIT-03 referential-integrity oracle
(`check-foundation-guards.ts`) and `coordinator-resolution-precheck.ts:402`, both of which compute a
**set equality** over the returned names. A dropped name makes the closure equality hold over a set
the document does not express; the precheck's `unresolved` computation at `:421` likewise never sees
the name it was supposed to resolve. There is no live cost in the committed tree — the generator
emits plain, comma-free, paren-free role names via `render()` — so this is a WARNING, not a blocker.
But the entire argument for D-32 returning a `Parsed<string[]>` was that this function must never
return a name list it cannot vouch for, and today it does, on the success arm.

**Fix.** Make both shapes refusals rather than quiet mutations, matching D-32's own reasoning:

```ts
// scripts/frontmatter.ts
export function keysGrantedAgentNames(keys: FrontmatterKeys): Parsed<string[]> {
  const names = new Set<string>();
  for (const v of toolsValues(keys)) {
    SCOPED_GRANT.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCOPED_GRANT.exec(v)) !== null) {
      const inner = m[1];
      // A nested `(` means the capture truncated at the wrong `)` and the tail of the enumeration
      // was silently discarded. A quote inside the enumeration means the `,` split is not the
      // document's own separator. Both are values this module cannot vouch for, so both refuse.
      if (/[("']/.test(inner)) {
        return {
          ok: false,
          reason: `the grant enumeration \`${excerpt(inner)}\` carries a nested parenthesis or a ` +
            `quoted name, so the comma split is not the separator this document expresses; the ` +
            `enumeration is refused rather than returned short or altered — a name is never ` +
            `silently dropped, on the same argument as an anchor or alias`,
        };
      }
      for (const raw of inner.split(",")) { /* ...unchanged... */ }
    }
  }
  return { ok: true, value: [...names].sort() };
}
```

Pin both spellings with cases asserting `ok === false`, in the same file as the existing D-32 escape
cases.

## Info

### IN-01: Two legal YAML spellings of a tool allow-list fail red

**File:** `scripts/frontmatter.ts:226` (`KEY_LINE`) and `:603` (the indentation-based continuation
rule).

**Issue.** The module's repeated primary control is that widened refusals must not fail red on
correct content ("Refusing there would fail red on correct content, which is the failure mode every
widened refusal risks", `:102-105`). Two ordinary, valid YAML spellings currently do:

```
tools:                  ->  refused: "cannot read `- Read` as a frontmatter key line or as a
- Read                               continuation of the previous key"
- Agent(x)                           (a block sequence at the parent key's indentation is legal YAML)

tools : Read, Agent(x)  ->  refused (YAML permits whitespace before the `:` in a plain key)
```

**Reproduction.**
```
$ node -e "import('./scripts/frontmatter.js').then(m=>{
    console.log(JSON.stringify(m.hasSpawnGrant('---\ntools:\n- Read\n- Agent(x)\n---\nb')));
    console.log(JSON.stringify(m.hasSpawnGrant('---\ntools : Read, Agent(x)\n---\nb')));
  });"
{"ok":false,"reason":"cannot read `- Read` as a frontmatter key line or as a continuation..."}
{"ok":false,"reason":"cannot read `tools : Read, Agent(x)` as a frontmatter key line or as..."}
```

Both are the **safe** direction (the guard goes red, a human decides) and neither is reachable from
the generator, which is why this is Info and not a Warning. It is recorded because a hand-authored
skill adapter — the surface with no generator — is exactly where a contributor is most likely to
write the zero-indent block sequence, and the remedy a red gate teaches is "reformat until it goes
green", which is the behaviour `:317-322` warns against.

**Fix (optional, if the shapes are to be accepted).** Treat a baseline-indent `- ` line as a sequence
item continuing the open accumulator rather than as an unreadable key line, and allow `[ \t]*` before
the `:` in `KEY_LINE`. Both are one-line changes and both widen toward accepting more valid YAML, so
neither can create a new silent-success arm. If instead the narrowing is deliberate, record it at
`KEY_LINE` with the false-red argument attached, the way every other narrowing in this module does.

---

_Reviewed: 2026-08-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard — adversarial, round 4_
_Every Critical was reproduced against the committed `.js`; the one unreproduced element (WR-01's
truncation) is flagged as unreproduced in place._
