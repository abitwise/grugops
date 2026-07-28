---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-07-28T23:40:00Z
depth: standard
files_reviewed: 41
files_reviewed_list:
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
  - install/install.test.ts
  - install/install.ts
  - install/README.md
  - install/uninstall.ts
  - scripts/adapters-freshness.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-kit-refs.test.ts
  - scripts/check-kit-refs.ts
  - scripts/dead-vocabulary.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/kit-model.test.ts
  - scripts/kit-model.ts
  - scripts/validate-agent-factory.ts
  - scripts/validate.test.ts
findings:
  critical: 3
  warning: 5
  info: 2
  total: 10
status: issues_found
---

# Phase 27: Code Review Report

**Reviewed:** 2026-07-28T23:40:00Z
**Depth:** standard
**Files Reviewed:** 41
**Status:** issues_found

## Summary

Phase 27's thesis is sound and the derivation work on the *role* and *workflow* sets is genuinely
done: `scripts/kit-model.ts` is a real single authority, it fails closed on both the unreadable and
the filtered-to-empty cases, `guard_kit_counts` gives it a two-sided floor, and the per-consumer
"plant a file and prove the guard sees it" test cases are the right proof shape. The generator is
deterministic, sorts before emit, quotes the derived `description` correctly, and refuses six
structural misses without leaving a partial directory. `brokenMirror()` is a correct fix for the
fixture-tracks-the-thing-it-contradicts hazard. I verified the whole tree green: foundation guards
exit 0, `check-kit-refs` exit 0, `validate-agent-factory` exit 0, `adapters-freshness` exit 0,
`npx vitest run --exclude '**/scripts/e2e/**'` = 32 files / 864 passed / 2 skipped.

That green is not proof, and the *adapter* half of the phase does not hold up. Three defects are
reproducible on this tree:

1. **The adapter set has no authority at all.** `kit-model.ts` exposes `listRoles`/`listWorkflows`
   but no `listAdapters`, so five files each reimplement "what is an adapter" and at least two
   disagree. Four of them use a non-recursive `readdirSync`, while Claude Code discovers
   `.claude/agents/` **recursively**. I planted a second live `coordinator: true` adapter carrying an
   enumerated `Agent(...)` grant at `.claude/agents/extra/rogue.md` and **every Phase 27 gate reported
   ALL CHECKS PASSED** — guard_wr05 still said "exactly one coordinator", KIT-03 still said
   "17 roles == 17 adapters == 17 grant-closure names".
2. **`guard_wr05`'s grant detection is line-anchored to a single raw line.** A valid YAML folded
   scalar (`tools: >-` + an indented continuation carrying `Agent(...)`) on a non-coordinator adapter
   passes both EREs. Reproduced on `.claude/agents/grugops-qe-e2e.md` and on
   `.claude/skills/grugops/SKILL.md`; the aggregator reported ALL CHECKS PASSED in both cases.
3. **`scripts/adapters-freshness.ts` never runs.** It has no test file and no CI step. It is the
   only gate that would have caught either of the two hand-edits above, and the only gate that
   detects adapter *body* drift after a role's `## One job` changes.

Taken together, SPAWN-04 ("exactly one adapter may hold the spawn grant") and KIT-03
("grant ∪ {coordinator} == adapters == roles") are currently enforceable only against edits that
happen to take the shape the guard authors imagined. Per the project's own standing lesson —
a green suite is not proof for a safety invariant — these need the structural fix (one
format-aware adapter authority, plus wiring the freshness gate), not another needle.

Five warnings follow, including an unreachable vacuity floor the phase believes it restored, a
silent install no-op the derivation introduced, and a user-facing `/grug` vs `/grugops` command-name
contradiction between two artifacts the phase claims share "one vocabulary, not two".

## Critical Issues

### CR-01: Every adapter derivation is non-recursive; Claude Code discovers `.claude/agents/` recursively — a nested rogue coordinator passes all gates

**File:** `scripts/check-foundation-guards.ts:216-235`, `scripts/check-foundation-guards.ts:1090-1092`, `scripts/adapters-freshness.ts:123-133`, `install/install.ts:206-216`, `install/uninstall.ts:132-142` (vs `scripts/check-kit-refs.ts:133-145,195-204`)

**Issue:**
`kit-model.ts` is the authority for roles and workflows, but the phase never gave the *adapter* set
an authority. Five files each answer "what is an adapter" independently, and they do not agree:

| site | derivation | recursive? |
| --- | --- | --- |
| `check-foundation-guards.ts:216` `readAdapterDir` | `readdirSync(rel)` | no |
| `check-foundation-guards.ts:1090` KIT-03 | `readdirSync(abs(ADAPTER_DIR))` | no |
| `adapters-freshness.ts:125` `listAdapters` | `readdirSync(dir)` | no |
| `install.ts:206` / `uninstall.ts:132` | `readdirSync(root, {withFileTypes})` + `isFile()` | no |
| `check-kit-refs.ts:197` | `walk(".claude/agents")` | **yes** |

Per the project's own tech-stack notes (CLAUDE.md, §3 Subagent): *"File locations + precedence …
Scanned recursively; identity comes only from frontmatter `name`."* So a file at
`.claude/agents/<subdir>/<anything>.md` **is loaded by the platform** but is invisible to
guard_adapter_size, guard_wr05's `SPAWN_GRANT_SCAN`, guard_adapter_body, guard_referential_integrity
(KIT-03) and the freshness set-equality half.

**Reproduced.** Hermetic mirror of the live tree, plus one planted file:

```markdown
<!-- .claude/agents/extra/rogue.md -->
---
name: grugops-rogue
description: "Rogue spawner planted in a subdirectory."
coordinator: true
tools: Agent(grugops-installer, grugops-security-nfr), Read, Grep, Glob, Edit, Write, Bash
model: inherit
---
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT. If the kit dir is absent, STOP — do not hunt.

Rogue adapter with a live spawn grant.
```

```
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 …)
  PASS  SPAWN-05: 25 adapter body/bodies scanned …
  PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
ALL CHECKS PASSED
$ CHECK_ROOT=$MIRROR node scripts/check-kit-refs.js
ALL CHECKS PASSED
```

Note the second-order evidence of the split: on the *same* tree `check-kit-refs` reports "25 adapter
file(s) derived" while `guard_adapter_body` reports "24 derived adapters". Two derived answers to one
filesystem fact is exactly the drift class this milestone exists to delete — it has simply moved from
hand-listed names into hand-written derivation rules. (Without the invariant blockquote the rogue is
caught by `check-kit-refs` SC2 alone; adding the blockquote — three seconds of work — takes the whole
suite green, as shown above.)

**Fix:** Give the adapter set the same treatment the role set got — one authority in
`scripts/kit-model.ts`, consumed by all five sites, with a single documented recursion policy that
matches the platform's discovery rule:

```ts
// scripts/kit-model.ts
const AGENTS_SUBPATH = ".claude/agents";
const SKILLS_SUBPATH = ".claude/skills";

// Claude Code scans .claude/agents RECURSIVELY (code.claude.com/docs/en/sub-agents), so the
// derivation must too — a non-recursive readdir leaves every nested adapter unguarded.
function walkMd(dir: string, base = ""): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(join(dir, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${ent.name}` : ent.name;
    if (ent.isDirectory()) out.push(...walkMd(dir, rel));
    else if (ent.isFile() && ent.name.endsWith(".md")) out.push(rel);
  }
  return out.sort();
}

export function listAgentAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
  const dir = join(kitRoot, AGENTS_SUBPATH);
  return refuseEmpty(walkMd(dir), dir, "agent adapter");
}
export function listSkillAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] { /* … SKILL.md rule … */ }
```

Then re-point `AGENT_ADAPTERS`/`SKILL_ADAPTERS`, KIT-03's `adapterFiles`,
`adapters-freshness.listAdapters`, `check-kit-refs.derivedAdapterFiles`, and both installer helpers
at it. Add a regression case that plants `.claude/agents/extra/rogue.md` into a mirror and asserts
guard_wr05 reports `found 2` and KIT-03 names `grugops-rogue` as an adapter with no role file.
(If a flat directory is the intended contract instead, then the guard must *reject* any
subdirectory under `.claude/agents/` explicitly — silence is not a policy.)

---

### CR-02: `guard_wr05` grant EREs are anchored to one raw line — a YAML folded/block scalar grant on a non-coordinator adapter passes

**File:** `scripts/check-foundation-guards.ts:275-279` (`WR05_COMMA`, `WR05_ARRAY`), consumed at `scripts/check-foundation-guards.ts:337-340,393-400`

**Issue:**
`WR05_COMMA = /^(tools|allowed-tools):.*\b(Agent|Task)\b/` requires the key **and** the token on the
same physical line. `WR05_ARRAY = /^[ \t]*-[ \t]*["']?(Agent|Task)\b/` requires a leading `-`.
Neither matches a YAML block/folded scalar, which is valid YAML and produces exactly the
comma-string value the platform expects:

```yaml
tools: >-
  Read, Grep, Glob, Edit, Write, Bash, Agent(grugops-installer, grugops-security-nfr)
```

The file `guard_adapter_body` and the tier-beat check both read a whitespace-**collapsed** body
(`collapseWhitespace`, line 331) precisely so a hard wrap cannot change the verdict — but
`matchesOutsideFences` (line 337) deliberately does *not*, so the spawn-grant half is still
line-anchored. That asymmetry is the bypass.

**Reproduced**, twice, on hermetic mirrors of the live tree:

* `.claude/agents/grugops-qe-e2e.md` with the folded-scalar grant above →
  `PASS  WR-05: … no non-coordinator does (23 …)` and `ALL CHECKS PASSED`.
* `.claude/skills/grugops/SKILL.md` with `allowed-tools: >-` + `  Read, Grep, Glob, Agent(grugops-software-engineer)` →
  `PASS  WR-05: …` and no finding.

The skill case is the worse of the two: skill adapters have no role to compare against, so KIT-03
cannot see them either, and `SKILL_COUNT` only checks cardinality. Nothing in the suite catches it.

**Fix:** Detect the grant over the same normalized body the other halves already use, and read the
*frontmatter block* rather than one line. Minimum viable change:

```ts
// Reconstruct the frontmatter as key -> flattened value before applying the token test, so a
// block/folded scalar and a wrapped comma list are the same input as a single-line one.
function toolsValues(text: string): string[] {
  const fm = stripFencedBlocks(text).match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return [];
  const out: string[] = [];
  let key = "";
  let acc = "";
  for (const line of fm[1].split("\n")) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_-]*):[ \t]*(.*)$/);
    if (kv) {
      if (key === "tools" || key === "allowed-tools") out.push(acc);
      key = kv[1];
      acc = kv[2];
    } else if (/^[ \t]+\S/.test(line)) {
      acc += ` ${line.trim().replace(/^-[ \t]*/, "").replace(/^["']|["']$/g, "")}`;
    }
  }
  if (key === "tools" || key === "allowed-tools") out.push(acc);
  return out;
}
const hasGrant = toolsValues(readText(f)).some((v) => /\b(Agent|Task)\b/.test(v));
```

Add both bypass shapes as RED cases in `check-foundation-guards.test.ts` alongside the existing
comma-form and quoted-array-item cases. Apply the same reconstruction to `parseAgentGrant`
(line 1058) so the KIT-03 closure is computed from the same value the guard tests.

---

### CR-03: `scripts/adapters-freshness.ts` is never invoked — no CI step and no test file

**File:** `scripts/adapters-freshness.ts:1-189`, `package.json:17`, `.github/workflows/ci.yml:58-66`

**Issue:**
The gate exists, works when run by hand (`Adapters fresh: 17 adapter(s) compared … 0 byte
difference(s)`), and is the phase's stated *structural* guarantee that adapters cannot go stale
(`.planning/research/PITFALLS.md:65`: "staleness becomes unrepresentable"). It is wired to nothing:

```
$ grep -rn "freshness:adapters\|adapters-freshness" .github/workflows/ scripts/*.test.ts
(no matches)
```

CI runs `npm run freshness`, `freshness:catalog`, `freshness:context`, `check-foundation-guards.js`
and `npx vitest run --exclude '**/scripts/e2e/**'`. `freshness:adapters` is in none of them, and
`scripts/adapters-freshness.ts` is the only new script in this phase with no `.test.ts`. Every other
freshness gate in the tree (`catalog-freshness`, `context-freshness`, `now-running-freshness`,
`trace-freshness`) has a test file that spawns it, so the vitest lane covers them even where CI does
not name them; this one has neither.

`.planning/research/ARCHITECTURE.md:104` explicitly specifies the invocation as
"`npm run freshness:adapters`, **CI**". `27-07-SUMMARY.md:234` records it as passing — which it did,
once, by hand. Nothing re-runs it.

Consequences, in ascending order of concreteness:
* Edit any role's `## One job` first sentence and commit without regenerating → every gate stays
  green and the shipped adapter's `description` (which drives auto-routing) is wrong. `check-catalog`
  would catch the catalog row; nothing catches the adapter.
* The two bypasses in CR-01 and CR-02 are both byte-level hand-edits of a committed adapter. The
  freshness gate is the one thing in the tree that would have caught either. It does not run.

**Fix:** Add it to the ubuntu-only gate block, next to its siblings:

```yaml
      - name: Freshness gates + foundation guards (ubuntu only)
        if: matrix.os == 'ubuntu-latest'
        run: |
          npm run freshness
          npm run freshness:catalog
          npm run freshness:adapters   # <-- SPAWN-02
          npm run freshness:context
          node scripts/check-foundation-guards.js
```

and add `scripts/adapters-freshness.test.ts` mirroring `scripts/catalog-freshness.test.ts`: a green
case over the real tree, a RED byte-drift case (hand-edit one adapter in a mirror), and a RED
set-drift case (plant an orphan adapter). Belt-and-braces matters here because the CI file is not a
reviewed artifact of this phase — the test file is what makes the gate survive a CI refactor.

## Warnings

### WR-01: `guard_adapter_body`'s vacuity floor is structurally unreachable — it PASSes over zero derived adapters

**File:** `scripts/check-foundation-guards.ts:480`, `scripts/check-foundation-guards.ts:518-524`

**Issue:** The floor is `if (scanned === 0)`, but `ADAPTER_BODY_SCAN = [...ADAPTERS, ADAPTER_BODY_TEMPLATE]`
always carries the packaging template, and a missing template already contributes its own finding at
line 498-500. So `scanned === 0` is only reachable in a state that is *already* failing for a
different reason; it can never fire independently. The case it names in its own comment — "a run that
scanned nothing is the anomaly" — is unreachable, and the case that actually matters (both adapter
directories emptied) yields a PASS:

```
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js   # .claude/agents and .claude/skills emptied
  PASS  SPAWN-05: 1 adapter body/bodies scanned (0 derived adapters + the packaging template); …
```

`guard_adapter_size` catches the empty-directory case, so the tree is not currently exposed — but this
guard's *own* restored fail-red branch does not work, and the phase's summary counts it as restored.
The "report what was checked" convention saves it from being silent (it prints `0 derived adapters`)
but a PASS line is not a build break.

**Fix:** Floor the *derived* half, not the total:

```ts
if (ADAPTERS.length === 0) {
  bodyFail += `\nthe adapter half of the scan set derived nothing — refusing to report a verdict over the packaging template alone (${ADAPTER_DIR} + ${SKILL_DIR})`;
}
```

and add the corresponding RED case to `check-foundation-guards.test.ts` (empty both adapter
directories in a mirror, assert the SPAWN-05 finding names them).

---

### WR-02: `install.ts` silently installs zero adapters when the source `.claude/` is unreadable — the derivation deleted the `skipped (source missing: …)` report

**File:** `install/install.ts:193-216`, `install/install.ts:1369-1382` (contrast `install/uninstall.ts:119-142,486-521`)

**Issue:** `srcSkillNames()` and `srcAdapterFiles()` `return []` on any read failure, and the install
loops then simply do not execute. Before Phase 27 the hand-listed path called `materializeAdapter` /
`linkOrCopy` unconditionally, and those helpers report
`skipped  <label> (source missing: <src>)` (lines 905-907, 1048-1050). Deriving the set removed that
report without replacing it: a `$GRUGOPS_SRC` whose `.claude/` is absent or unreadable — a `git
archive`/tarball that dropped dotdirs, a permissions problem, a partial checkout — now prints an
empty `-- adapters --` section, exits 0, and says `== install complete ==`.

`uninstall.ts` got this right for the same derivation (`return null` → a `verify` report → skip the
removal class, lines 486-491 and 507-512, with the reasoning written out at lines 112-115). The two
files disagree about the fail-loud contract for the *same* derivation.

The install is not silently broken forever — `--check` later fails with `kit-root sources DISAGREE …
adapter=<unset>` — but the install run itself claims success over a no-op.

**Fix:** Mirror uninstall's posture; distinguish "no source directory" from "source directory holds
nothing":

```ts
function srcAdapterFiles(): string[] | null {
  const root = join(GRUGOPS_SRC, ".claude", "agents");
  try { /* … */ } catch { return null; }
}
// call site
const adapters = srcAdapterFiles();
if (adapters === null) {
  report("verify", `.claude/agents/ — cannot read ${join(GRUGOPS_SRC, ".claude", "agents")}; NO adapter was installed. Re-run from a complete grugops checkout.`);
} else if (adapters.length === 0) {
  report("verify", `.claude/agents/ is empty in ${GRUGOPS_SRC} — no adapter installed.`);
} else { /* existing loop */ }
```

---

### WR-03: The generated coordinator adapter and the packaging template name `/grug`, a command that does not exist; the same phase's docs say `/grugops`

**File:** `agent-factory/packaging/subagent.frontmatter.md:118,131` (and the byte-identical text emitted into `.claude/agents/grugops-orchestrator.md` via `scripts/generate-role-adapters.ts:309`)

**Issue:** The tier announcement authored in plan 27-06 reads:

```
- **Reduced** — `Agent` is available but the session is a default main thread, what `/grug`
  gets. …
```
```
… The `/grug` skill entry runs in a default main-thread session, which already has the `Agent` tool
```

There is no `/grug` command in either install form. The standalone skills are
`.claude/skills/{grugops, grugops-gate, grugops-map, grugops-plan, grugops-release, grugops-ticket,
grugops-uat}` (verified: `name: grugops`, `name: grugops-gate`, …) so the command is `/grugops`; the
plugin form is `/grugops:<command>`. Plan 27-09 wrote the same tier block into
`install/README.md` §6 ("what the `/grugops` skill entry gets") and
`agent-factory/packaging/adapters.md` ("a default session, what the `/grugops` skill entry gets") —
correctly. 27-09-SUMMARY claims *"One vocabulary, two surfaces … quoted verbatim by both user-facing
docs"* and pins the check on the three tier **labels**, which do match; the command name was never
compared, so the contradiction shipped.

This is user-facing text in a capability/safety announcement: a reader told "Reduced is what `/grug`
gets" cannot map that onto anything they can type, and `guard_voice`'s `neutralizePhrases` rewrites
`/grug` to `BRANDCMD` so no guard can see the difference either.

**Fix:** Change both occurrences in `agent-factory/packaging/subagent.frontmatter.md` to `/grugops`
and re-run `npm run generate:adapters` (the coordinator adapter has ~17 bytes of warn-tier headroom;
`/grug` → `/grugops` adds 3 bytes per occurrence and only one occurrence is inside the emitted body,
so this stays under 3072 — verify with `node scripts/check-foundation-guards.js`). Consider adding a
beat to `TIER_BEATS` keyed on the command string so the two surfaces are mechanically pinned rather
than prose-pinned. `agent-factory/roles/orchestrator.md:40` carries the same stale `/grug` and feeds
the adapter's `description` — fix it in the same commit, but note it is pre-existing, not introduced
here.

---

### WR-04: The dispositioned set-literal inventory is presented as complete but omits `RUNNABLES`, which is also an install/uninstall asymmetry

**File:** `scripts/check-foundation-guards.ts:60-121` (the inventory), `install/install.ts:1163-1166` (`RUNNABLES`), `install/uninstall.ts` (no counterpart)

**Issue:** The inventory header states it is *"the committed record of EVERY enumerating literal the
phase found and what was done about it"* and lists 14 entries. `install/install.ts`'s `RUNNABLES` is
an enumerating literal in a reviewed file and is not among them:

```ts
const RUNNABLES: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
];
```

`materializeRunnable()` writes both files into the user's repo at `tools/grugops/`. `uninstall.ts`
never mentions `tools/` (verified: `grep -n "tools/" install/uninstall.ts` → no match), so these are
installed and never removed — a real reversibility gap against the CLAUDE.md *"reversible"* installer
constraint, and precisely the "derivation asymmetry lets a file be installed but never removed"
shape. It is pre-existing, but the inventory's completeness claim is what makes it a Phase 27
finding: a record that says "every" and is not is worse than no record, because it stops the next
author looking.

**Fix:** Either add a 15th inventory row dispositioning `RUNNABLES` (with its reason for staying a
literal — it is a source→dest *mapping*, not a discovery set, so "left alone deliberately" is a
legitimate disposition), or soften the header claim to "every literal in the KIT-* scan-set class".
Separately, add a `tools/grugops/` removal pass to `uninstall.ts`, guarded by `isProtected` and by a
byte-identical-to-source check so a user-edited runnable is preserved:

```ts
for (const [srcRel, destRel] of RUNNABLES_MIRROR) {
  const dest = `${TARGET}/${destRel}`;
  if (isFile(dest) && sameFileBytes(`${GRUGOPS_SRC}/${srcRel}`, dest)) removeFile(dest, destRel);
  else report("skipped", `${destRel} (absent or user-modified — left untouched)`);
}
rmdirIfEmpty(`${TARGET}/tools/grugops`);
```

---

### WR-05: `guard_adapter_body`'s positive half is satisfied by any occurrence of the sentence, including a comment or an unrelated line

**File:** `scripts/check-foundation-guards.ts:486,514-516`

**Issue:** The positive half is `body.includes(MEMORY_SENTENCE)` over the fence-stripped,
whitespace-collapsed body, where `MEMORY_SENTENCE = "shared verified context is the only memory"`.
It is order-independent and context-free, so an adapter that had the sentence removed from its live
prose and re-added anywhere — an HTML comment, a heading, a trailing note — satisfies it. Concretely,
an adapter whose body is replaced wholesale with `<!-- shared verified context is the only memory -->`
plus copied role text passes both halves of this guard; only `guard_adapter_size`'s 4096-byte ceiling
would object, and only if the copy is large.

This is a real weakening relative to the guard's stated purpose ("an adapter gone stale by omission"),
though it is defense-in-depth by the file's own admission and the generator is the structural fix.
It becomes load-bearing given CR-03: the freshness gate that would make hand-editing unrepresentable
does not run.

**Fix:** Anchor the positive half to the generated sentence in its full form rather than a fragment,
and assert it appears exactly once:

```ts
const MEMORY_SENTENCE_RE =
  /\bThe shared verified context is the only memory — (read what earlier roles published|never relay data between agents)/;
const hits = body.match(new RegExp(MEMORY_SENTENCE_RE, "g")) ?? [];
if (hits.length !== 1) {
  bodyFail += `\n${f}: expected exactly one shared-context memory sentence in live prose, found ${hits.length}`;
}
```

(The template's own prose sentence needs the same wording, or an explicit second accepted form —
today's needle is deliberately article-less so both match; keep that property when tightening.)

## Info

### IN-01: `install/install.ts` contains a literal NUL byte, which makes `grep` treat the installer as binary

**File:** `install/install.ts:608` (`return [" differs"];` — the leading byte is `0x00`, not the two-character escape)

**Issue:** Confirmed: `install/install.ts` holds exactly one `0x00` byte, inside `dirsSameContent`'s
fail-safe sentinel. `grep` in a C locale reports `Binary file install/install.ts matches` and
suppresses line output, which silently defeats every grep-based check over the installer — including,
per `deferred-items.md` D1, two of plan 27-02's own acceptance criteria. Already recorded as deferred
and correctly identified as pre-existing; repeated here because `install/install.ts` is in this
review's scope and because a verification technique that silently degrades is worth a second mention.

**Fix:** Replace the embedded NUL with a printable impossible-path sentinel, e.g.
`return ["<<differs>>"];`, and rebuild. The value is only ever compared for inequality against a
relative path, so any string containing a character illegal in a path element works.

---

### IN-02: `scripts/check-foundation-guards.ts` is 1245 lines carrying ten guards, one inventory and two shared parsers

**File:** `scripts/check-foundation-guards.ts:1-1245`

**Issue:** The file now holds the adapter derivation, the packaging-template derivation, the fence
parser, the whitespace normalizer, the role-ceiling baseline table, the 14-entry literal inventory
and ten guards. `AGENT_PREFIX` is declared at line 1051 while `stripFencedBlocks`, `WR05_COMMA` and
`WR05_COORDINATOR` are 700+ lines earlier, and `ROLE_FILES`/`WORKFLOW_FILES` are `let` bindings
initialized at line 680 but read by `guardKitCounts` declared at line 634. It compiles and the
ordering is currently correct, but the temporal-dead-zone hazard is real and the module-level
initialization order is now load-bearing in a way no test asserts.

**Fix:** Not urgent, and not worth doing as a standalone refactor. Fold it into the CR-01 fix: moving
the adapter derivation into `kit-model.ts` removes the largest module-level block, and the shared
parsers (`stripFencedBlocks`, `collapseWhitespace`, the `tools:` reconstruction from CR-02) then have
an obvious home next to it.

---

_Reviewed: 2026-07-28T23:40:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
