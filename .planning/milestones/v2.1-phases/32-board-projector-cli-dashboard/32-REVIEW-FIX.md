---
phase: 32-board-projector-cli-dashboard
fixed_at: 2026-09-16T19:35:00Z
review_path: .planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 32: Code Review Fix Report

**Fixed at:** 2026-09-16T19:35:00Z
**Source review:** `.planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (CR-01, WR-01 … WR-07)
- Fixed: 8
- Skipped: 0
- Extra commits: 1 (a control-byte regression this session introduced and its own gate caught)

**Where verification ran:** the MAIN CHECKOUT on branch `main`. `.planning/config.json`
sets `workflow.use_worktrees: false`, so per the documented opt-out no worktree was created —
which is also the safe path here, since a hand-rolled worktree has no `node_modules` and could
not run these gates.

**Suite invocation:** `npx vitest run --exclude '**/scripts/e2e/**'` throughout.
**`npm test` was NEVER run** (it launches the live claude-CLI e2e lane).

**Final state:** `npm run build` then `git status --porcelain scripts/ install/ hooks/` → **clean**.
Full suite **75 files, 5137 passed, 2 skipped**. `node scripts/check-nul-bytes.js` → ALL CHECKS PASSED.

---

## Fixed Issues

### CR-01: `moduleSpecifiers` read ordinary string literals as import statements

**Files modified:** `scripts/js-import-closure.ts`, `scripts/js-import-closure.js`, `scripts/board-readonly.test.ts`
**Commit:** `d276f4e3`

**THE REVIEW'S LITERAL FIX SNIPPET IS WRONG, AND WAS NOT APPLIED.** It says to `blank(start, k - 1)`
the string-literal text in `stripNonCode`. Measured before writing anything: that blanks the
SPECIFIER'S OWN TEXT too, so `import { a } from "./a.js"` yields the specifier `"      "` (six
spaces), which classifies as `foreign` and would make `jsImportClosure` throw on **every file in the
repository that has an import**. Transcript of that probe is in the session log.

**What was applied instead** keeps the review's structural INTENT — make the scan's input actually be
code — in a form that works:

- `scanSource` blanks comments, template text AND ordinary string-literal text. The rule is TOTAL: it
  knows nothing about import grammar, so it cannot disagree with `SPECIFIER_PATTERNS` about what a
  specifier position is.
- It RECORDS each literal's text against its start offset. `moduleSpecifiers` matches positions in
  the blanked code (with the `d` flag) and recovers the real text by capture offset.
- One function owns the import grammar; one owns what counts as prose. `stripNonCode` stays exported
  as a view over `scanSource`.

**Both classes re-measured over all 65 tracked `.js`/`.mjs` against a real TypeScript parse:**

| | length preserved | missed | fabricated |
|---|---|---|---|
| before | 65/65 | 0 | **1** (`install/install.js` → `./model-tiers.js`, class `relative`) |
| after | 65/65 | 0 | **0** |

This independently reproduces the review's own number, including that the live false positive was in
the RELATIVE class the earlier census never counted.

**Required verifications, all done:**
- `jsImportClosure(ROOT, "install/install.js")` no longer throws (closure size 2).
- Every existing caller resolves the same closure: `CLOSURE_BASELINES` pins nine caller entries
  byte-for-byte and all nine pass.
- Two-sided parser oracle pinned in `board-readonly.test.ts` over a **git-derived** corpus
  (`git ls-files`), with a vacuity floor. Git rather than a directory walk, because a walk's corpus
  would depend on whether `.tmp-build/` happened to exist from a prior freshness run.

**RED-first proof:** all three new tests were run against the pre-fix scanner and failed for the
right reasons (the oracle naming the fabricated specifier); then GREEN.

**New arms probed (rule 5).** Six prose shapes now yield zero specifiers (double-quoted,
single-quoted, line comment, block comment, template text, and `"from " + "\"./evil.js\""`); six
legitimate forms still resolve (static, re-export, side-effect, dynamic, single-quoted, multiline,
and an import inside a template SUBSTITUTION). Two improvements the review did not name:

- `"from " + "\"./evil.js\""` previously FABRICATED a foreign specifier (a hard refusal); now zero.
- An escaped quote in a real specifier was previously captured TRUNCATED (`./a\` for `./a\".js`);
  it is now recovered whole. Strictly the safe direction.

---

### WR-01: `row-without-file` asserted a join that did not happen for a duplicate-id loser

**Files modified:** `scripts/board-model.ts`, `scripts/board-model.js`, `scripts/board-model.test.ts`, `agent-factory/contracts/board.md`
**Commit:** `dba9d72a`

`presenceOf` now MEASURES which document is joined (`byId.get(declaredId)?.stem`) and the arm carries
it as `joinedStem`. The loser gets its own sentence naming the file that claimed the identifier first.

The contract moved in the SAME commit, as the review requires — it carried the same false clause
verbatim, so it could not have been used to adjudicate the disagreement.

**Verified:** loser now says "joined under no identifier" (agreeing with `readErrors`); winner
unchanged byte-for-byte; the legitimate single-declaration case unchanged. RED proven by stashing the
model fix with the test in place.

---

### WR-02: the TAB a refusal quotes as evidence was deleted before the reader saw it

**Files modified:** `scripts/board-model.ts`, `scripts/board-model.js`, `scripts/board-dashboard.test.ts`
**Commit:** `e52cfb25` (control-byte follow-up in `0249d0c5`)

`visible()` escapes every byte a renderer deletes, at the point the diagnostic is BUILT, applied at
both sites that quote raw source bytes. The second site is the `no-opening-delimiter` arm, whose own
docblock already records this exact class — a line refused for not being `---` that rendered as a
bare `---`. That one is now `<U+000B>---`.

**Deviation from the review, deliberate:** notation is UNIFORM (`<U+0009>`), not the `<TAB>`
nickname the review sketched. A hand-kept table of friendly names is a set literal that rots.

**The two-authority risk the fix introduces is PINNED, not assumed.** `visible()` and `sanitizeCell`
live in different modules and must cover the same set or a byte escapes one and is deleted by the
other. The agreement is DERIVED over every code point from 0 to 0x00A5 (margin on both sides), with a
vacuity floor, plus an assertion that the escape text itself survives the sanitizer, plus an assertion
that `RENDER_STRIPPED` is WIDER than the grammar's `TICKET_CONTROL` with TAB as the difference — the
two answer different questions, and conflating them is what caused WR-02.

---

### WR-03: the watch arm checked the resolved path and opened the unresolved spelling

**Files modified:** `scripts/board-dashboard.ts`, `scripts/board-dashboard.js`, `scripts/board-dashboard.test.ts`, `scripts/board-watch.test.ts`
**Commit:** `70cbd447`

Seam widened to carry `Containment`; `arm` opens `decision.real`; the failure branch is on the CODE,
so an `EACCES`/`ELOOP` is RECORDED (nothing else reports it) while a containment refusal stays silent
(the reader reports it against its own source, and a second entry would list one finding twice).

**Verified:** three tests — opens the resolved path, records a non-containment refusal, and the
converse that a containment refusal stays silent. The first two proven RED against the pre-fix `arm`;
the converse is green either way, as it should be.

**NOTE — a trap that nearly cost a live defect.** Plain `grep` reported **ZERO** matches for
`contained:` in `scripts/board-dashboard.test.ts`, which `file -b` classifies as "c program text".
Two live fakes were found only with `grep -a`, and **`tsc` did not flag either**. All seven
implementations of the widened seam were then re-audited with `grep -a`.

---

### WR-04: file-scoped reader census, and the prototype-lookup exemption

**Files modified:** `scripts/validate.test.ts`
**Commit:** `7a3ae592`

**Scope.** Stated as a REFUSAL (the review's sanctioned cheaper option): the only way to assemble the
pair across files is for the key spellings to reach the scanning file through an import, so the join
is what gets asked about.

**THE BINDING IS THE SUBJECT, NOT THE MODULE — and finding that out was the work.** A first attempt
asked only "does a scanning file import from a file that names both keys" and flagged two live joins.
Both were investigated rather than exempted, and both are FALSE POSITIVES:

- `validate-agent-factory.ts` imports `parseBoard`/`parseTicketDocument` from the one grammar
  *precisely so that it is not a second authority* — its docblock records deleting its private column
  parser. Redding it would invert the rule.
- `checkpoints.ts` imports a section locator.

So the check asks whether the imported BINDING is itself a key-spelling table. **Proven to
discriminate:** the planted split reader is caught, the file-scoped census is asserted BLIND to it
(so the gap is real), and the legitimate import is asserted not to red.

**Lookup.** `Object.hasOwn` at both sites. **Recorded with its real reach, which is narrower than the
review states:** every name the census looks up is a filename ending in `.ts`, and `"toString.ts"` is
not a prototype member — so the defect is UNREACHABLE on the live scan set for exactly the structural
reason the review itself gives for IN-03. A first version of my test asserted a reachable exploit,
**passed against the unfixed code**, and was rewritten rather than kept. It now exercises the lookup
at bare names (RED-proven) and asserts the `.ts` premise the unreachability rests on.

---

### WR-05: a short row set short-circuits and never reaches the null arm

**Files modified:** `scripts/check-foundation-guards.test.ts`
**Commit:** `c5163183`

Runner STEPS are counted independently of the recognisers' path alphabet and the two are asserted to
agree.

**NOT the denominator the review sketched:** `(^|&&|\|\||;)\s*(node|npx|npm)\b` counts `npm run
build` and would have RED the live tree on `check:build-parity`.

**Running it found a real case the review's 90-character excerpt did not show:**
`check:build-parity` carries an inline `|| node -e "…"` failure message. An inline-eval step runs no
MODULE, so there is nothing for a reachability proof to be about; it is excluded BY DECISION and the
exclusion is pinned as exactly that narrow (an inline-eval step demands no row; a real module spelled
BESIDE one still does).

Both directions pinned: the two miss-spellings red, the four live shapes agree. Vacuity floors on both
the script count and the total step count. What it does not catch (`npm run check:x`) is stated in the
docblock rather than implied.

---

### WR-06: `classifySpecifier` refused legitimate bare package specifiers

**Files modified:** `scripts/js-import-closure.ts`, `scripts/js-import-closure.js`, `scripts/board-readonly.test.ts`
**Commit:** `3e2f254a`

`bare` is now the positive test the docblock claims (non-empty, first character not `.`/`/`/`\`/`#`/`%`),
and the docblock sentence was rewritten to match — the two sentences disagreeing *was* the finding.

**WIDENING A SAFETY PARTITION WAS PROVEN NOT TO WEAKEN THE GUARD, not assumed (rule 5).** All ten
spellings the foreign bucket exists for are asserted to STAY foreign (the load-bearing half, since
foreign is the arm that refuses), all 18 classifications were re-measured, and a live
`import { probeWrite } from "7zip-bin"` planted into `scripts/board-model.js` still **REDS
`board-readonly` (11 failed)**. The refusal relocates from the foreign/`acquisitions` premise to the
`ALLOWED_BUILTIN_SPECIFIERS` equality — which censuses EVERY bare specifier, not only builtins — and
both red. The plant was removed and `git status` verified clean.

---

### WR-07: `relativeSpecifiers` was a dead export with a false docblock claim

**Files modified:** `scripts/js-import-closure.ts`, `scripts/js-import-closure.js`
**Commit:** `3e2f254a`

Deleted. A repository-wide `grep -a` across `.ts`, `.js`, `.mjs`, `.md` (excluding `.planning/`) finds
the symbol only at its own two definition sites; it had no test, and `jsImportClosureFacts` walks
`moduleSpecifiers` directly, so the retention sentence had no referent. A note records why it went.

---

### EXTRA: literal control bytes introduced by the WR-02 commit

**Files modified:** `scripts/board-model.ts`, `scripts/board-model.js`, `scripts/board-dashboard.test.ts`
**Commit:** `0249d0c5`

Not a review finding — a regression THIS SESSION introduced and the tree's own gate caught. The
`\uXXXX` sequences in `RENDER_STRIPPED` and two WR-02 fixtures were interpreted into real characters
on the way to disk instead of being written as escape TEXT. `check:nul-bytes` refused with 8 bytes
across 3 tracked files including a NUL.

Worth recording because the gate's own message names the cost this session had already paid once: a
NUL makes plain `grep` return ZERO matches for strings that ARE present. Behaviour is unchanged; the
escapes denote the same characters at runtime.

---

## Not fixed — out of scope, flagged

The three **Info** findings were out of scope per the fix instruction and were NOT touched:

- **IN-01** `admitted-under-its-stem` is a false discriminant name.
- **IN-02** a dial column spelled `__proto__` is silently dropped.
- **IN-03** `TOOLCHAIN_CHECK_SCRIPTS[name] !== undefined` is the same prototype-lookup class as WR-04.

**IN-03 deserves a call-out.** The review explicitly asks that it be fixed *together with* WR-04 so
that "the two sites are fixed together rather than one being fixed and the other left as the copy
that still disagrees". WR-04's site is now `Object.hasOwn` and IN-03's is still a raw read, so the two
copies now **do** disagree. It is a one-line change in a file this session already edited
(`scripts/check-foundation-guards.test.ts`), and it is left undone only because Info was declared out
of scope. Recommend folding it in.

## `UNKNOWN - verify`

- Whether a write capability can reach the dashboard closure through `import.meta.resolve`, a writer
  value received at runtime, or a future `node_modules` dependency. Unchanged by this round; still
  outside what a syntactic pass can decide.
- `scripts/board-watch-live.test.ts`'s 350 ms delivery band on `windows-latest`. Not measurable here.
- A module reached through a nested runner other than `npm run check:x` is invisible to both sides of
  the WR-05 denominator.

---

_Fixed: 2026-09-16T19:35:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
