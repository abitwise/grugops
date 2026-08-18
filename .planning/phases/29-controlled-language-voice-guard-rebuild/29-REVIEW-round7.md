---
phase: 29-controlled-language-voice-guard-rebuild
reviewed: 2026-08-18T13:20:00Z
depth: standard
round: 7
diff_base: 29f61e0
files_reviewed: 17
files_reviewed_list:
  - .github/workflows/ci.yml
  - agent-factory/writing-profile.md
  - docs/audit/28-claim-registry.md
  - scripts/audit-model.ts
  - scripts/audit-model.test.ts
  - scripts/catalog-freshness.ts
  - scripts/check-audit-register.ts
  - scripts/check-audit-register.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.test.ts
  - scripts/check-claim-anchors.ts
  - scripts/check-claim-anchors.test.ts
  - scripts/check-nul-bytes.ts
  - scripts/check-nul-bytes.test.ts
  - scripts/check-public-docs-vocabulary.ts
  - scripts/generate-catalog.ts
  - scripts/generate-catalog.test.ts
  - scripts/kit-model.ts
  - scripts/kit-model.test.ts
findings:
  critical: 2
  warning: 3
  info: 1
  total: 6
status: issues-found
---

# Phase 29 round 7: Code Review Report

**Reviewed:** 2026-08-18T13:20:00Z
**Depth:** standard (per-file, with live adversarial reproduction on `git archive HEAD` mirrors)
**Diff range:** `29f61e0..HEAD` (33 commits, plans 29-48 .. 29-55)
**Status:** issues-found — 2 critical, 3 warning, 1 info

## Summary

**D-54's central change holds.** I reproduced round-6 CR-01 on a hermetic mirror in both forms and
both now red by name: the single-line count-and-group-preserving substitution of the comprehension
denial (`agent-factory/writing-profile.md:292`) produces two findings at `file:line:column`, plus a
named divergence refusal for `C-28-046`, plus the suppressed pin at 12/14, plus the composition pin
at 2/4. An unreadable registry produces 20 refusals and 14 findings — fail-closed. A deleted
registry row reds by name with the surviving id list rendered. A zero-block region is a named
refusal. The conjunction's four arms (`inRegion` x `frozen`) were each walked and the union is
correct: only `inRegion && frozen` suppresses, and a frozen block whose lines fall outside the
region still yields findings.

**Build-twin hygiene is clean.** Every changed `.ts` in this range has its `.js` twin in the same
commit (checked mechanically over all 33 commits, zero misses), `npm run freshness` reports 48/48
fresh, `npm run typecheck` exits 0, and `npx vitest run --exclude '**/scripts/e2e/**'` is
52 files / 2127 passed / 2 skipped. `docs/audit/29-round7-residuals.md` is unusually honest — §7.2
states eight things the round does not claim, and §2.7 demonstrates its own surviving fail-open.

**What it still misses.** Two critical items. First, the CI job's own step ordering makes the
build-parity gate — the mechanism `CLAUDE.md` names as the reason committed `.js` cannot drift —
unable to fail, and the round's own sweep (`29-round7-residuals.md` §8.1) reproduces that ordering,
so the round's build-parity evidence is vacuous. Second, a live fail-open on the banned-claim
matcher's own **listed** literals: a multi-word literal split across a hard wrap is invisible, the
in-source justification for that residual is false against this corpus, and the residual register
records the hard-wrap axis as *closed by construction, 0, no subject*.

---

## Critical Issues

### CR-01: the build-parity gate cannot fail in CI — `npm run build` runs before `npm run freshness` and `tsc` emits over the committed `.js`

**Files:** `.github/workflows/ci.yml:58-59` and `:86-87`; `tsconfig.json:5` (`"outDir": "./"`);
`scripts/freshness.ts:93-101`
**Status:** CONFIRMED (traced + measured)

**Mechanism.**
- `tsconfig.json` sets `"outDir": "./"` and `"rootDir": "./"`, so `npm run build` (`tsc`) writes its
  output **over the tracked, committed `.js` files in the working tree**.
- `scripts/freshness.ts:93-100` reads each committed output from the **working tree**
  (`join(ROOT, rel)`) and compares it to a rebuild in a temp dir. It has no notion of git.
- `.github/workflows/ci.yml` runs `- name: Build (tsc → committed .js parity surface) / run: npm run build`
  at line 58-59, and `npm run freshness` at line 87 — after it. By then every committed `.js` in the
  runner's checkout has already been regenerated from the current `.ts`.

Therefore CI compares a fresh build against a fresh build. There is no `git diff --exit-code`,
`git status`, or dirty-tree assertion anywhere in `ci.yml` (grepped: zero hits).

**Scenario.** A developer edits `scripts/check-banned-claims.ts` and commits without running
`npm run build`. The repository now ships a committed `check-banned-claims.js` that is not a build of
its `.ts`. On push: `npm run build` silently repairs the runner's copy; every subsequent gate step
(`node scripts/check-banned-claims.js`, etc.) runs the **repaired** binary, not the committed one;
`npm run freshness` prints `All build outputs fresh: 48 committed .js file(s) match a fresh tsc
rebuild.` and exits 0. CI is green, and the artifact on `main` — the one host machines run with bare
Node under the zero-runtime-dependency contract — is stale. This is precisely the
`CLAUDE.md` constraint *"compiled with `tsc` to committed `.js`, and freshness-checked so the
committed output cannot drift from its source"* being unenforced.

**Measured.** `stat` on `scripts/check-banned-claims.js` before and after `npm run build`:
`2026-08-18 12:40:54` → `2026-08-18 12:59:19`. The tracked file is rewritten in place. (HEAD itself
is *not* drifted — `git status` stays clean after the rebuild — so there is no live stale artifact;
the defect is that nothing could tell you if there were.)

**Why it is in scope for round 7 even though the ordering predates it** (introduced with `ci.yml` in
`539573d`, phase 20): this round shipped nine `.ts`/`.js` pairs, and its own verification record
reproduces the self-nullifying order verbatim —
`docs/audit/29-round7-residuals.md:961-962` lists `npm run build` → exit 0 immediately followed by
`npm run freshness` → exit 0 with the `48 committed .js file(s)` output quoted as evidence. That row
proves nothing about the committed artifact. The same ordering appears in every
`<automated>` verification command in this phase's plans (e.g. `29-01-PLAN.md:464`,
`29-03-PLAN.md:345`, `29-13-PLAN.md:250`), so no plan in Phase 29 has ever actually exercised the
freshness gate. This is the prompt's failure class #8 — a verification satisfiable by a stale binary
— and it is currently satisfied by construction.

**Fix.** Two independent changes; do both.

1. Make the CI build non-destructive and assert the tree stays clean:

```yaml
      - name: Freshness (committed .js is a faithful build) — BEFORE any build
        run: npm run freshness

      - name: Build parity assertion (the tree must not move)
        run: |
          npm run build
          git diff --exit-code -- '*.js' \
            || { echo "committed .js drifted from its .ts — run npm run build and commit"; exit 1; }
```

   Running `freshness` **before** `build` restores the gate's subject; the `git diff --exit-code`
   makes the assertion two-sided and independent of step ordering surviving a future edit.

2. Make the gate ordering-independent so a future reorder cannot re-open this. In
   `scripts/freshness.ts`, read the committed side from git rather than the working tree:

```ts
  // The committed output, not the working-tree output. A build step earlier in the same job
  // rewrites the working tree in place (tsconfig outDir is "./"), which would make this
  // comparison compare a fresh build against itself.
  const a = execFileSync("git", ["show", `HEAD:${toPosix(rel)}`], {
    cwd: ROOT, maxBuffer: 1 << 28, encoding: "buffer",
  });
```

   and add a permanent case asserting that a hand-mutated `HEAD:` blob reds even after
   `npm run build` has run.

---

### CR-02: a banned literal hard-wrapped across a line boundary passes at exit 0 — on literals the list DOES contain — while the register records that axis as closed

**Files:** `scripts/check-banned-claims.ts:2018-2028` (`lineHits`), `:60-65` (the residual's stated
justification), `:382-399` (the multi-word members);
`docs/audit/29-round7-residuals.md:561` (`V-29-42-01` row)
**Status:** CONFIRMED (reproduced on a `git archive HEAD` mirror)

**Mechanism.** `lineHits(line)` matches each pinned literal against **one physical line**. 16 of the
22 pinned literals are multi-word. The `token-economy` group has 7 members and exactly **one**
single-token member (`token-economy`); the other six (`token economy`, `fewer tokens`,
`token savings`, `saves tokens`, `reduces token count`, `lowers token count`) are all defeated by a
newline falling between their words. The kit's prose is hard-wrapped at ~100 columns, so where a
wrap falls is decided by column arithmetic, not by the author.

**Reproduction.** Mirror of `HEAD` at `/tmp/gm3`, appended to
`agent-factory/workflows/13-incident.md`:

```
The caveman blocks are a token
economy: they mean the model reads fewer
tokens on every run, and this profile saves
tokens too.
```

Three occurrences of three separately pinned `token-economy` literals. Result:

```
PASS  banned claims: 0 findings over 117/117 elements
== Result ==
ALL CHECKS PASSED
```

Exit 0, planted file never named, `suppresses 14` / `reaches 66` unmoved.

**Why this is not `V-29-47-04`.** `V-29-47-04` is *"a claim in words the list does not contain"* —
an enumeration limit that cannot be derived away. This is different: the words ARE in the list. What
defeats the gate is what the predicate's **input is assembled from** (a physical line), which is a
choice the gate makes and could change.

**Why the recorded justification does not hold.** `scripts/check-banned-claims.ts:60-65` discloses
the residual and then argues: *"The literals are short enough to sit on one line, and a reviewer who
wraps one **mid-token** has written something no reader would parse as a claim either."* The plant
above wraps mid-**phrase**, not mid-token, and markdown soft-joins the lines, so a reader sees
exactly `The caveman blocks are a token economy: they mean the model reads fewer tokens on every run`
— a fully legible restatement of the claim this gate's founding D-44 transcript calls
*"the drift this gate exists for."* Measured over the kit's own corpus (60 tracked
`agent-factory/**/*.md` files, 2458 adjacent non-blank line pairs): **822 mid-sentence hard wraps**.
Mid-sentence wrapping is the house style, not an exotic authoring act.

**Why it is critical rather than merely disclosed.** `docs/audit/29-round7-residuals.md:561` records
`V-29-42-01` — *"a claim split across a hard wrap escapes the co-occurrence window"* — as
**closed by construction in round 6**, live count **`0, no subject`**. That row is accurate about the
co-occurrence window (which D-48/D-53 deleted) and misleading about the axis: a reader of the
register concludes the hard-wrap axis is closed with no subject, while the wider version of it
stands with three reproducible instances. Under this round's own WR-05/D-49 standard — *"it must
carry a `V-` id with its live count and its reach"* — this axis is unregistered and uncounted. The
register's §7.2 enumeration of what the round does not claim omits it.

**Fix.** Do not normalise whitespace globally (the source is right to refuse that — it would make
every comparison inexact). Instead give the matcher a **second, explicitly named input assembly**
for the multi-word members only, so the exactness argument survives:

```ts
/**
 * The WRAP-JOINED projection of the document: consecutive non-blank prose lines joined with a
 * single space, carrying a per-line index so a finding still reports the ORIGINATING line.
 * Asked ONLY of the multi-word members — the single-token members already see every line.
 * This is a SECOND ASSEMBLY, named, with its own case, not a relaxation of the comparison.
 */
function wrapJoinedHits(lines: readonly string[]): { at: number; member: BannedClaimLiteral }[] { … }
```

and, whichever way it is answered, either:
- open `V-29-55-01` in `docs/audit/29-round7-residuals.md` §4 with its live count (**16 of 22
  literals reachable; 6 of the 7 `token-economy` members; 0 live occurrences; 3 demonstrated
  plants**), its direction (**fail-OPEN**) and its reach, and add it to §7.2's list; and
- correct `scripts/check-banned-claims.ts:60-65` so the justification names *mid-phrase* wrapping and
  cites the 822 measured wraps, rather than asserting a shape no reader would parse.

---

## Warnings

### WR-01: the `BANNED_CLAIM_EXEMPT_ANCHORS` pin is one-sided against anchors, and the source comment claims otherwise

**File:** `scripts/check-banned-claims.ts:1693-1699`
**Status:** CONFIRMED (reproduced)

**Mechanism.** In `deriveExemptBlocks`, an anchor found inside the located region whose id has no
row naming the exemption file is silently skipped:

```ts
    const row = rows.get(anchor.id);
    if (row === undefined) {
      // …the cardinality assertion below reports the shortfall.
      continue;
    }
```

`ids` is not pushed to, so `ids.length` is unchanged and `BANNED_CLAIM_EXEMPT_ANCHORS` does not
move. The quoted comment is false for this branch: the cardinality assertion detects a **row**
removed, never an **anchor** added.

**Scenario.** Mirror of `HEAD` at `/tmp/gm5`. Replaced the blank line at
`agent-factory/writing-profile.md:236` (inside the region, line count preserved) with
`<!-- claim: C-28-950 -->` — an anchor id present in no registry row. Result:

```
$ CHECK_ROOT=/tmp/gm5 node scripts/check-banned-claims.js
== Result ==
ALL CHECKS PASSED
```

`check-claim-anchors` reds (1 failure, the bijection). So the compensating check for this shape
lives **entirely in a different gate** — which is the exact argument this module makes against its
own predecessor at `check-banned-claims.ts:1519-1522`: *"A carve-out whose only content bound lives
in another gate is a carve-out this gate cannot speak for."*

It is not a widening today (an unregistered anchor freezes nothing, so no line becomes newly exempt;
the direction is fail-closed). It is a false in-source claim about a mechanism plus a
half-derived cardinality.

**Fix.** Count the anchors inside the region as the denominator, and the rows-with-anchors as the
numerator, so both directions have an owner in this gate:

```ts
  let anchorsInRegion = 0;
  for (const anchor of scan.anchors) {
    if (anchor.index < region.headingAt || anchor.index >= region.endBefore) continue;
    anchorsInRegion += 1;
    const row = rows.get(anchor.id);
    if (row === undefined) {
      refusals.push(
        `${anchor.id} is anchored INSIDE the one named exemption region and names no row in ` +
          `docs/audit/28-claim-registry.md. An anchor with no row freezes nothing while reading ` +
          `as a frozen block; add its row in the SAME commit (D-01(a) / D-04) or delete the anchor`,
      );
      continue;
    }
    …
  }
```

and correct the comment at `:1695` so it does not assert a shortfall report that does not exist.

---

### WR-02: `deriveExemptBlocks` reports an OVERRUN as a byte divergence — a cause that is not there

**File:** `scripts/check-banned-claims.ts:1751-1763`
**Status:** CONFIRMED (reproduced, and contrasted with the sibling consumer of the same authority)

**Mechanism.** `anchoredBlockAt` (`scripts/audit-model.ts:1745-1762`) returns
`{ overruns: true, matches: false, text: "", documentBytes: 0 }` when a block needs a line the
document does not have. `deriveExemptBlocks` reads only `block.matches`, so an overrun lands in
`diverged` and is reported with:

> `<id>'s anchored block inside the one named exemption region no longer matches its registry row in
> docs/audit/28-claim-registry.md **byte for byte** … If the prose change is correct, update `<id>`'s
> verbatim in the SAME commit; if it is not, restore the bytes`

**Scenario.** Mirror at `/tmp/gm4`, `agent-factory/writing-profile.md` truncated after line 292 so
`C-28-046`'s two-line verbatim needs line 293 that no longer exists.
`check-banned-claims` says *"no longer matches its registry row … byte for byte"* and sends the
author to compare bytes. `check-claim-anchors` — the other consumer of the same authority — says the
truth for the same condition:

> `the anchor for C-28-046 sits at line 291 and its claim needs 2 line(s) below it, but the file ends
> at line 292`

Two consumers of one authority give two diagnoses for one condition. This is the same defect shape
plan 29-50 fixed elsewhere **in this round** when it split `EISDIR` out of `unreadable` in
`check-nul-bytes.ts` precisely because the old message named *"a cause that is not there"*.

**Fix.** In `deriveExemptBlocks`, branch on `block.overruns` before `block.matches` and reuse the
sibling's wording:

```ts
    if (block.overruns) {
      diverged.push(block.id);
      refusals.push(
        `${block.id}'s anchor sits at line ${block.anchorIndex + 1} inside the one named exemption ` +
          `region and its registry verbatim needs ${block.verbatimLineCount} line(s) below it, but ` +
          `the document ends at line ${scan.contentLineCount}. No comparison was performed, so its ` +
          `lines are NOT exempt. The remedy is to restore the truncated lines, never to shorten the row`,
      );
      continue;
    }
    if (!block.matches) { … }
```

---

### WR-03: a SECOND anchor grammar (and a third block-extent rule) live in the D-54 harness, in the round whose stated principle is one grammar per concept

**File:** `scripts/check-banned-claims.test.ts:481`, `:492-529`
**Status:** CONFIRMED (traced)

**Mechanism.** Plan 29-51's entire justification for moving the anchor grammar into `audit-model` is
recorded at `scripts/check-claim-anchors.ts:64-73`: *"Copying it into a second gate instead would
give this repository a SECOND GRAMMAR OVER THE SAME BYTES, which is the LANG-07 defect this
milestone has now closed three times at eight rounds each."* Plan 29-52's harness — the file that
holds the fix built on that authority — then declares:

```ts
const MIRROR_ANCHOR_RE = /^<!-- claim: (C-28-\d{3}) -->$/;
```

a byte-copy of the exported `CLAIM_ANCHOR_RE` (`scripts/audit-model.ts:1579`), which it could simply
import. `mirrorRegistry()` additionally invents a **third** block-extent rule — terminate at a blank
line or at the next anchor (`:507-511`) — where the authority's rule is *run for exactly as many
lines as the registry verbatim has* (`audit-model.ts:1727-1735`). The two agree only because the
harness generates the verbatim from its own extent rule, so no case in this file ever compares an
independently derived extent against the authority's.

**Scenario.** Widen `CLAIM_ANCHOR_RE` (say, to admit a four-digit id, or to tolerate a leading
space). Every D-54 case in `check-banned-claims.test.ts` continues to construct fixtures under the
old grammar, so the widened form is exercised by nothing, the fixtures still pass, and the harness
cannot witness the divergence it exists to police. The file's own `describe` at `:3818` asserts
*"no literal array of claim ids exists in the gate"*; nothing asserts *"no second anchor grammar
exists in the harness"*.

**Fix.** Import the authority and derive the extent from the row the harness is about to write:

```ts
import { CLAIM_ANCHOR_RE, scanAnchoredDocument } from "./audit-model.js";
…
function mirrorRegistry(profileText: string): string {
  const scan = scanAnchoredDocument(profileText);
  for (const anchor of scan.anchors) { … }   // no local regex, no local extent rule
}
```

and add a source-shape case beside the existing one:

```ts
  it("SOURCE SHAPE: the harness declares no anchor grammar of its own", () => {
    const src = readFileSync(HARNESS_TS, "utf8");
    expect(src.match(/\/\^<!--\s*claim/g) ?? []).toHaveLength(0);
    expect(src).toContain("CLAIM_ANCHOR_RE");
  });
```

---

## Info

### IN-01: the PASS line's coverage arithmetic can over-report, and can go negative, if a frozen block ever extends past the region's end

**File:** `scripts/check-banned-claims.ts:2542-2544`
**Status:** CONFIRMED by trace; **0 live subjects** on this tree

`exemptLineSet` holds `[block.start, block.end)` for every block whose **anchor** sits inside the
region (`:1687-1690`). A block whose anchor is near `endBefore` and whose verbatim runs past it
contributes indices outside the region. Those lines are correctly **not** exempt (the loop's
`inRegion` conjunct rejects them at `:2336`), so there is no fail-open. But the PASS line reports:

```
covering ${exemptLineSet.size} of the region's ${exemptExtent} line(s) — the other
${exemptExtent - exemptLineSet.size} stay freely editable and are SCANNED
```

which would over-state coverage and can render a negative remainder. Today all six blocks fit
(22 of 66), so there is nothing to see; the number is simply computed from a set that is not the
quantity the sentence names.

**Fix.** Project the set through the region before publishing it:

```ts
  const frozenInRegion =
    exemptRegion === null
      ? 0
      : [...exemptLineSet].filter(
          (i) => i >= exemptRegion.headingAt && i < exemptRegion.endBefore,
        ).length;
```

and report `frozenInRegion` in both clauses.

---

## What I checked and found sound (recorded so a later round does not re-derive it)

- **`.ts`/`.js` twin co-commit:** all 33 commits in `29f61e0..HEAD` walked mechanically; every
  non-test `.ts` change carries its `.js` twin in the same commit. Zero misses.
- **D-54 conjunction, all four arms:** `inRegion && frozen` → suppressed; `inRegion && !frozen` →
  finding carrying `UNFROZEN_IN_REGION_REMEDY`; `!inRegion && frozen` → finding;
  `!inRegion && !frozen` → finding. The union is fail-closed in every arm.
- **Fail-closed on every derivation failure I could construct:** empty root (12 refusals), deleted
  registry (20 refusals, 14 findings, `fail-CLOSED direction` named), zero anchored blocks in a
  located region (named refusal), unreadable exemption document (named refusal), missing exemption
  document (named refusal).
- **Coordinate-shear premise:** `deriveExemptBlocks`'s elementwise assertion against
  `scan.lines` / `callerLines` is correct, including the legal one-element difference the terminating
  newline produces, and refuses rather than reconciles.
- **`kit-model.isNumberedWorkflowFile` unification:** the three copies are now one; `kit-model.js`'s
  import closure is stdlib-only, so `catalog-freshness.ts`'s hand-maintained twin list is complete
  (verified by `grep '^import' scripts/kit-model.js`), and `freshness:catalog` is green.
- **`generate-catalog` duplicate-`order` refusal:** `order` genuinely comes from frontmatter (not the
  filename prefix), so collisions are representable; the refusal fires before the sort, `fail` is
  `never`/`process.exit(1)`, and buckets are walked in ascending value order so the message is
  machine-independent.
- **`check-audit-register` 28 → 32:** independently confirmed —
  `grep -c '^- kind: architecture' docs/audit/28-claim-registry.md` → 32, total rows 46, total
  `kind:` lines 46.
- **The four new registry rows' `line` fields:** `C-28-043` 247-250, `-044` 253-254, `-045` 281-282,
  `-046` 292-293 — all four verified correct against the anchors at 246/252/280/291.
- **`check-nul-bytes` round-7 refactor:** `nulOffsets` genuinely deleted (no second predicate
  survives); the NUL sub-class is projected from `bytes` at the single cross-check site; the
  reporting loop performs no filesystem read; `locate()` arithmetic unchanged; both cross-check arms
  remain correctly asymmetric.
- **Live gate run:** `check-public-docs`, `check-audit-register`, `check-claim-anchors`,
  `check-banned-claims`, `check-imperative-lexicon`, `check-nul-bytes`, `freshness`,
  `freshness:catalog`, `typecheck` — all exit 0; vitest 52 files / 2127 passed / 2 skipped.

---

_Reviewed: 2026-08-18T13:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Note: this file previously held the round-4 review; that version is preserved in git at `97e4928`._
