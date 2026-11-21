---
phase: 40-plain-language-role-rewrite
reviewed: 2026-11-03T22:35:50Z
depth: standard
scope: incremental, fb336d6a..HEAD (gap-closure round 3, plans 40-22 to 40-25)
files_reviewed: 14
files_reviewed_list:
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/06-uat-pack.md
  - docs/audit/29-style-dispositions/40-23.md
  - docs/audit/29-style-dispositions/40-24.md
  - docs/audit/40-disposition-base-move.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/check-diff-disposition.js
  - scripts/check-diff-disposition.test.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-role-rules.js
  - scripts/check-role-rules.test.ts
  - scripts/check-role-rules.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 2
  warning: 3
  info: 3
  total: 8
status: issues_found
---

# Phase 40: Code Review Report (gap-closure round 3)

**Reviewed:** 2026-11-03T22:35:50Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

This review covers `git diff fb336d6a..HEAD` over the 14 files: WR-07 (rule 6 arm (d)), IN-05 (a shallow history FAILs), WR-08 and WR-09 (the named human's sign-off in `orchestrator.md` and Workflow 06), CR-04 (`rowMatches(row, c, addedKeys)`), CR-03 (the position hold in front of the D-30 stand-in), the disposition files 40-23.md and 40-24.md, and the hook manifest bump.

What holds:

- `node scripts/check-diff-disposition.js` and `node scripts/check-role-rules.js --check` are green on HEAD. `scripts/freshness.js` reports all 89 committed `.js` files fresh, and `hook-manifest-freshness.js` matches. The two new manifest hashes in `hooks/hook-entry.ts:258-259` equal `sha256sum` of the committed `.js` files.
- `check-role-rules.test.ts` and `tier-kit-text.test.ts` pass (291 tests).
- **The 40-23.md and 40-24.md rows are side-correct.** A script read all 325 rows in the two files and compared each one with `changedClauses(e8d7802, …)`. Every non-empty `before` is a removed clause and every non-empty `after` is an added clause in the current diff. Every "kept word for word" row has identical sides. No "removed" row names a clause the HEAD file still holds, and no "added" row names a clause the base file already held. The counts in the 40-24.md read aid are also correct: 309 rows; 37 kept, 159 removed, 113 added; 290 role rows; 287 rows with a filled companion. **The `designer.md:54` "12 coding rules" row is labeled correctly:** `git diff e8d7802 -- agent-factory/roles/designer.md` deletes that line and adds no replacement. The four `designer.md` Context I/O and Compaction rows are labeled "removed", and the read aid says the pointers moved, reworded, into `## Reads`. That label is accurate on the gate's terms. These are the named human's dispositions and this review does not question them.

What does not hold. Two demonstrated bypasses let a change inside a frozen role section reach a green gate with zero findings, even though CR-03 and CR-04 claim to hold it:

1. **CR-05.** A "kept word for word" row binds its `after` to the file, not to the frozen section. So a `## Hard limits` prohibition can be moved into an unfrozen section with no new row.
2. **CR-06.** A level-1 `# ` heading planted inside `## Hard limits` ends the frozen region. The role end-state check only looks at `## ` headings, so a fact-free permission added below the planted heading reaches the stand-in and is admitted.

Both were reproduced in a scratch worktree of HEAD. The worktree was removed afterwards and no source file in the repository was changed. Rule 6 arm (d) has false negatives on natural spellings (WR-10). Workflow 06's reworded dial paragraph contradicts its own stop condition and the `factory.config.md` definition of the cell (WR-11). The stand-in scope still includes `_role-switch-protocol.md`, a file the stand-in never inventories (WR-12).

## Critical Issues

### CR-05: A "kept" row approves moving a frozen `## Hard limits` sentence into an unfrozen section (CR-04 bypass)

**File:** `scripts/check-diff-disposition.ts:1536-1546` (`rowMatches`), `scripts/check-diff-disposition.ts:1968-1974` (`addedKeys`)
**Issue:** CR-04 refuses a row whose `after` "is not an added clause of the same file in the current diff". `addedKeys` is keyed by `attributionKey(file, clause)` only, so the region an added clause sits in is never checked. An identical-sides row recorded for a sentence kept on a rewritten line inside `## Hard limits` therefore still matches in two cases:

- the removed side of that sentence, after the sentence has been deleted from `## Hard limits`;
- the added side, after the same sentence has been pasted into any unfrozen section of the same role.

The removed clause has `region = ## Hard limits`. CR-03 holds it, the structural arm runs, and the human-read 40-24.md row with its filled companion satisfies it. The added clause has `region = null`, so it goes to the no-row arm, where `rowMatches` matches it through `after`.

Reproduced on HEAD. In `agent-factory/roles/tech-lead.md`, delete "Never make a structural decision, and never write production code." from `## Hard limits` and add it as the first line of `## Trace updates`. Then run the two gates:

```
PASS  945 role clause(s) admitted by the role-rule inventory stand-in (D-30) — `node scripts/check-role-rules.js --check` exited 0
PASS  diff disposition — changed watched file(s): 0 findings over 24/24 elements
ALL CHECKS PASSED
```

`check-role-rules --check` also exits 0, because the sentence carries no `SAFETY_RULE_FACTS` fact. (The same move of the fact-bearing "Merge and deploy stay with humans." is caught only by the inventory, which reports `lost fact human-merge-deploy`. The disposition gate passes that move as well.) The named human read "kept word for word on a rewritten line" with a `## Hard limits` companion. The gate now accepts a different change: the prohibition is demoted out of the safety section. This is the stale-approval class CR-04 was written to close. 14 fact-free identical-sides role rows in 40-24.md (`tech-lead.md:49` ×7, `release-manager.md:48` ×2, `security-nfr.md` ×2, `brownfield-mapper.md:41`, `compliance-officer.md:42`, `software-engineer.md:64`) can each be moved this way. No test covers a frozen-to-unfrozen relocation.
**Fix:** Make the match aware of the frozen region. Record the regions each added clause occurs in, and when the removed clause sat in a frozen region, require the row's `after` to occur in a frozen region:

```ts
// main(): one map instead of a set
const addedRegions = new Map<string, Set<string | null>>();
for (const c of changed.clauses) {
  if (c.side !== "added") continue;
  const k = attributionKey(c.file, c.clause);
  if (!addedRegions.has(k)) addedRegions.set(k, new Set());
  addedRegions.get(k)!.add(c.region?.heading ?? null);
}

export function rowMatches(row, c, addedRegions): boolean {
  if (row.file !== c.file) return false;
  const before = normalizeSentence(row.before);
  const after = normalizeSentence(row.after);
  const at = after === "" ? undefined : addedRegions.get(attributionKey(row.file, after));
  if (after !== "" && at === undefined) return false;
  // CR-05: a frozen removed clause is matched only when its `after` is still inside a frozen region
  if (c.side === "removed" && c.region !== null && after !== "" && ![...at!].some((h) => h !== null)) return false;
  return c.side === "removed" ? before !== "" && before === c.clause : after !== "" && after === c.clause;
}
```

Add a mirror case: delete a `HARD_LIMIT_SENTENCE` that has an identical-sides row with a filled companion, append it under `## Notes`, and expect a `(removed) — FROZEN by structuralSections` finding.

### CR-06: A `# ` heading inside `## Hard limits` ends the frozen region, and a permission below it reaches the stand-in (CR-03 bypass)

**File:** `scripts/check-diff-disposition.ts:2150-2153` (the `safetyHeld` position test relies on `c.region`), `scripts/check-diff-disposition.ts:1052-1062` (`sectionsIn` → `locateSection`), `scripts/check-role-rules.ts:848-873` (`checkHeadingOrder` only sees `## ` lines)
**Issue:** CR-03 holds a role clause "by position": `c.region !== null`. The region comes from `locateSection`, which by design (WR-06/WR-08) closes a section at the next unfenced heading of level one or two. Nothing in either gate refuses a new `# ` heading in a role file. `checkHeadingOrder` filters on `l.startsWith("## ")`, so a `# ` line is never checked against D-08. A `# ` heading inserted inside `## Hard limits` or `## Stop when` therefore does two things:

- Every line below it falls out of the frozen region. Fact-free added clauses there have `region === null` and reach the stand-in.
- The existing fact-free frozen sentences below it lose their positional freeze. Their lines are untouched, so no changed clause is derived for them.

Reproduced on HEAD. In `agent-factory/roles/tech-lead.md`, after "Merge and deploy stay with humans." inside `## Hard limits`, insert:

```
# Notes
You may skip the written scores when the ticket is small.
```

This directly contradicts the `## Hard limits` sentence "Never pick a level without the written scores". The result:

```
PASS  946 role clause(s) admitted by the role-rule inventory stand-in (D-30)   (945 on HEAD)
PASS  diff disposition — changed watched file(s): 0 findings over 24/24 elements
ALL CHECKS PASSED
```

The same plant spelled `## Notes` is caught (`` `## Notes` sits outside `## Responsibilities` .. `## Output` (D-08) ``), which confirms that the level-1 spelling is the gap. A fenced plant is caught too (1 finding), so fences are not a second route.
**Fix:** Refuse the heading, since a role has exactly one level-1 heading. In `checkHeadingOrder`, add:

```ts
const h1 = text.split("\n").filter((l, i) => !flags[i] && /^# /.test(l));
if (h1.length !== 1 || !h1[0].startsWith("# Role: ")) {
  out.push(`${role}: a role has exactly one \`# \` heading, its \`# Role: \` title; found ${h1.length} (CR-06)`);
}
```

As defence in depth in the disposition gate, refuse any added role clause that sits between a base frozen heading's line and the next `## ` heading on the added side. Or hold, under CR-03, every added role clause in a file whose unfenced `# ` heading count changed. Add a mirror test with the `# Notes` plant.

## Warnings

### WR-10: Rule 6 arm (d) misses common spellings of a board move, including the new glyphs inside one code span

**File:** `scripts/check-role-rules.ts:657-690` (`moveSpanFindings`)
**Issue:** Arm (d) adds `⇒` and `⟶`, but only to `spread`, which runs on the line after every non-column span is blanked. A single code span `` `In Development ⇒ Done` `` holds no exact column, so arm (d) blanks it. Arm (a) only refuses `->` and `=>`, and arm (b) only `→`. The most natural spelling with the new glyph, which mirrors the canonical form, is never read. `claimedPairs` ignores it too, so rule 4 never judges it. The WR-02 contract this arm extends ("a move spelled any other way than `X → Y` cannot slip past rule 4 unread") fails. A probe over `moveSpanFindings(doc(…), partitionModel(ROOT).columns, "p.md")` returned **0 findings** for each of these lines in `## Board moves`:

| Spelling | Findings |
|---|---|
| `` You own `In Development ⇒ Done`. `` / `` `In Development ⟶ Done` `` | 0 |
| ``Move it from the `In Development` column to `Done`.`` | 0 |
| ``Move it from `In Development` straight to `Done`.`` | 0 |
| ``You own `In Development` --> `Done`.`` | 0 |
| ``You own `In Development` ➜ `Done`.`` / `` ⟹ `` | 0 |
| ``You own `In Development` `` + newline + ``→ `Done`.`` (wrapped line) | 0 |
| ``…from `In Development` `` + newline + ``to `Done`.`` (wrapped line) | 0 |
| `You own **In Development** → **Done**.` / `*In Development* -> *Done*` / `"In Development" → "Done"` | 0 |

The emphasis and quote cases also escape arm (c), because `\s*` does not consume `*`, `_` or `"` between the column and the arrow. No test covers a single-span `⇒` or `⟶`, a wrapped line, or a from/to phrase with "the … column".
**Fix:**
- (a) In arm (a), refuse every code span that contains an arrow-like glyph and is not exactly `X → Y`. For example: `/->|=>|⇒|⟶|⟹|➜|➔|-->|→/.test(span) && !canonical`.
- (b) Run arms (c) and (d) over each paragraph, with its lines joined by a space, rather than per line.
- (c) Before matching, strip `*`, `_` and `"` that directly wrap a column.
- (d) Widen the prose form to `\bfrom\s+(?:the\s+)?${col}(?:\s+column)?\s+(?:\w+\s+)?(?:to|into)\s+(?:the\s+)?${col}`.

Add each row of the table above as a red case.

### WR-11: Workflow 06's reworded dial paragraph contradicts its own stop condition and the config definition of `sign_off_acceptance`

**File:** `agent-factory/workflows/06-uat-pack.md:33`, `agent-factory/workflows/06-uat-pack.md:46`, `agent-factory/config/factory.config.md:207` (and `:192-194`, the disposition meanings)
**Issue:** Line 33 now says: "The dial governs only how the Orchestrator records the lean close". Two other places give the cell a different scope:

- Line 46, in the same workflow, tags the UAT stop condition "The acceptance criteria are missing or ambiguous — stop and route the ticket back; never self-sign…" with `checkpoint: sign_off_acceptance`.
- `factory.config.md` defines the cell as "Signing off acceptance when the criteria are missing, ambiguous or unmet", with `off` meaning "the action proceeds silently". 40-23.md's own preamble cites that definition ("whose shipped definition fires only on missing, ambiguous or unmet criteria").

So the kit now gives `sign_off_acceptance` three meanings:

1. the missing-criteria stop, in both modes (line 46 and the config table);
2. only the record kept for the lean close (line 33);
3. nothing at all in enterprise mode (line 33: the move "waits for the named human's sign-off at every value").

An agent at `off` reading line 46 together with the config table can conclude that it may proceed past missing criteria, and line 33 says the dial governs nothing of the kind. Line 33 also covers `notify` and `off` but never says what `block` does to the close, although `block` is the default and "waits for a named human". The duty to record the close at `notify` lives only in Workflow 06. `orchestrator.md:68` no longer carries a `checkpoint:` pointer, so the role that does the close has no instruction to write the observation. `tier-kit-text.test.ts` pins the new line 33 sentences but no consistency with line 46 or the config row, so the contradiction is green.
**Fix:** Give the cell one meaning and state it everywhere. If the named human's sign-off is unconditional (decision 2), change the config row to name the lean-close record and remove `checkpoint: sign_off_acceptance` from line 46, which then reads as an unconditional stop. Otherwise reword line 33 so it does not say "only", for example: "Apart from the stop condition below, the dial governs how the Orchestrator records the lean close". Either way, add the `block` behaviour to line 33, and a pointer in `orchestrator.md` `## Board moves` such as "record the close per Workflow 06 at `notify`". Add a `tier-kit-text` case that ties line 33's scope to the line-46 tag and the config row.

### WR-12: The stand-in still admits changes to `_role-switch-protocol.md`, which it never inventories

**File:** `scripts/check-diff-disposition.ts:367` (`ROLE_STANDIN_SCOPE = "agent-factory/roles/"`), `:2113-2116` (`standinFor`), `:2150-2153` (`safetyHeld`)
**Issue:** The stand-in scope is the prefix `agent-factory/roles/`, which includes `agent-factory/roles/_role-switch-protocol.md`. That file is a `safety_surface: yes` register row. But `check-role-rules` derives facts only for `listRoles()`, which drops underscore-prefixed files, and its end-state checks also exclude the protocol (D-15). The `node scripts/check-role-rules.js --check` exit code therefore says nothing about the protocol file, but the gate still counts its changed clauses as "admitted by the role-rule inventory stand-in". The protocol has no `## Hard limits` or `## Stop when`, so CR-03's position hold never applies to it, and only the CR-01 fact predicate stands between it and admission.

Reproduced on HEAD: replacing "Only the coordinator spawns, and only on Claude Code." with "Any role may spawn role agents when the work is large." in `_role-switch-protocol.md` leaves the gate at `0 findings … ALL CHECKS PASSED`. The new clause has no matching row, and both sentences are fact-free. That reverses the spawn-authority invariant, which `orchestrator.md:79` relies on. This predates round 3, but the predicate this round rewrote is where it lives. `docs/audit/40-disposition-base-move.md:21-27` lists the protocol among the watched files without saying that the stand-in covers it, so the scope needs a named human's ruling, not an agent's.
**Fix:** Limit the stand-in to the files it inventories, for example in `standinFor` and `safetyHeld`:

```ts
const inStandinScope = (f: string): boolean =>
  f.startsWith(ROLE_STANDIN_SCOPE) && !f.slice(ROLE_STANDIN_SCOPE.length).startsWith("_");
```

Even better, derive the scope from `listRoles(ROOT)`. Then disposition the protocol's changed clauses in rows. If the named human rules that D-30 covers the protocol, record that ruling in `40-disposition-base-move.md`.

## Info

### IN-08: The CR-03 control assertion is conditional and passes if the count line disappears

**File:** `scripts/check-diff-disposition.test.ts:3853-3855`
**Issue:** `const held = positionHeldCount(stdout); if (held !== null) expect(held).toBe(0);`. In this case the stand-in key is declared (`baseExtraLines: [STANDIN_LINE]`), and the gate prints the CR-03 count line whenever the key is declared. So a regression that drops the line, or renames it so the regex no longer matches, makes the assertion vanish and the case stays green.
**Fix:** `expect(positionHeldCount(stdout)).toBe(0);`.

### IN-09: IN-05's shallow detection has edges where it gives a NOTE instead of a FAIL, or fires on a tree that is not shallow

**File:** `scripts/check-role-rules.ts:973-984` (`isShallowRepository`), `:1052-1065`
**Issue:**
- `git rev-parse --is-shallow-repository` needs git 2.15 or later. An older git echoes the flag literally, so the output is not `"true"` and the check falls back to the NOTE. A missing `git` also falls back to the NOTE.
- A history that is not shallow but lacks the start commit (grafted, `git replace`, or re-rooted) keeps the NOTE by design.
- `git -C ROOT` walks up the directory tree, so a hermetic mirror (a directory that is not a repository) under a shallow checkout's tree reads as shallow and turns red.

The risk is low, because the stand-in only runs under `check-diff-disposition`, which already requires the base commit to be reachable.
**Fix:**
- Treat any output other than `true` or `false` as a FAIL that names the git version.
- Before trusting the answer, confirm that `git -C ROOT rev-parse --show-toplevel` equals `ROOT`.

### IN-10: Dead fallback in the CR-03 note

**File:** `scripts/check-diff-disposition.ts:2171`
**Issue:** `safetySectionNote(region === null ? "" : region.heading)` runs only when `safetyHeld && !factHeld`, which implies `c.region !== null`. The `""` branch cannot run, and if it did it would print an empty heading in backticks.
**Fix:** Pass `region!.heading`, or assert non-null there, so a future change to `safetyHeld` fails loudly instead of printing ``(``)``.

---

_Reviewed: 2026-11-03T22:35:50Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
