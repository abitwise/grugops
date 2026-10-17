---
phase: 28-kit-consistency-audit
reviewed: 2026-08-12T09:28:14Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - .claude-plugin/plugin.json
  - .github/workflows/ci.yml
  - package.json
  - scripts/audit-model.test.ts
  - scripts/audit-model.ts
  - scripts/audit-prepass.test.ts
  - scripts/audit-prepass.ts
  - scripts/check-audit-register.test.ts
  - scripts/check-audit-register.ts
  - scripts/check-claim-anchors.test.ts
  - scripts/check-claim-anchors.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-nul-bytes.test.ts
  - scripts/check-nul-bytes.ts
  - scripts/check-public-docs-vocabulary.test.ts
  - scripts/check-public-docs-vocabulary.ts
  - scripts/check-uat-oracles.test.ts
  - scripts/check-uat-oracles.ts
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/dead-vocabulary.ts
  - scripts/floor-invariance.test.ts
  - scripts/generate-safety-surface.test.ts
  - scripts/generate-safety-surface.ts
findings:
  critical: 4
  warning: 13
  info: 0
  total: 17
status: issues_found
---

# Phase 28: Code Review Report

**Reviewed:** 2026-08-12T09:28:14Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Phase 28 shipped four new fail-closed gates (`check-public-docs-vocabulary`, `check-audit-register`,
`check-claim-anchors`, `check-nul-bytes`), one new parse authority (`audit-model`), one generator
(`generate-safety-surface`), one reporter (`audit-prepass`), and byte-fidelity + termination fixes to
two existing modules. The derivation discipline is genuinely good in most places: `anchoredDocs()`,
`publicDocsScan()`, `auditSetFiles()` and `trackedPaths()` are all derived and count-pinned, and the
per-part vacuity floor in `check-public-docs-vocabulary` is written over the right quantity.

That said, this review found **four gates that return green while the condition they claim to check is
false** — the repository's own priority-1 defect class — and **all four were reproduced against the
committed `.js`, not argued from source**:

1. `oracleWr05Wording`'s asymmetry assertion passes when a tool row is *deleted*, and prints a PASS
   line asserting the flip is asymmetric.
2. `readRegistry()` silently last-wins on a duplicate metadata key, letting `status: false` be
   laundered into `status: true` and bypassing every D-17 disposition check downstream.
3. `check-claim-anchors` counts an **empty** verbatim fence as a byte-identical comparison and reports
   "1 verbatim comparison(s) performed, all byte-identical".
4. `check-audit-register`'s substantive-observation check does not treat `—`/`-` as blank, even though
   `audit-model.isBlank()` and `check-claim-anchors`' mechanism check both do — so a register of em
   dashes satisfies D-06.

Three of the four are the *same shape*: a gate whose vacuity floor exists at the collection level
(zero rows, zero docs, zero claims) but not at the element level (an empty row, an empty fence, a
placeholder glyph). That is worth naming as a class before fixing them one at a time.

Beyond those, the warnings cluster on two recurring patterns: parser leniency inside modules whose own
headers declare a "canonical form with a refusal outside it" doctrine (`Number.parseInt`, unrecognised
metadata lines, an unvalidated `line:` field), and harness premises that are broader than the contract
they encode (the fuzz carve-out, `consumingRemainder()`, the hardcoded Ruby path).

No security vulnerabilities were found. Path handling in the new modules is sound: `OUT`/`REGISTER_PATH`/
`REGISTRY_PATH` are fixed literals joined onto a root parameter, never taken from argv, env or content,
and `check-nul-bytes` correctly avoids `shell: true` and any decoder on the data path.

## Critical Issues

### CR-01: `oracleWr05Wording` passes vacuously when a 5-tool-table row is deleted, and prints a PASS line stating a check it did not perform

**File:** `scripts/check-uat-oracles.ts:334-335`
**Issue:**

```ts
const rows = lines.filter((l) => rowRe.test(l));
if (rows.length === 0) continue; // README's table omits headers some rows carry; absence is not drift here
```

The asymmetry assertion is the mechanism that keeps the WR-05 flip honest: only the Claude Code row
may carry spawn/coordinator wording, and the four other CLI rows must keep no-spawn wording. `continue`
on zero matches means **deleting a row satisfies the assertion**. There is no pin on how many tool rows
were found (the gate pins `rows.length > 1` but not `rows.length === 0`), so a bulk edit, a table
restructure, or a Phase 29 rewrite that drops a row leaves the gate green.

Worse, the gate then prints a PASS line that asserts the property it did not measure — directly against
the rule three sibling files in this same phase state explicitly ("A PASS line must never state a check
that was not performed", `check-audit-register.ts:272`, `check-nul-bytes.ts:397`).

**Reproduced** (committed `.js`, mirror at `/tmp/asymtest`, Claude Code row removed from *both*
`agent-factory/packaging/adapters.md` and `agent-factory/README.md`):

```
  PASS  WR-05 wording: closure beats present in all four tracking docs; the 5-tool-table flip is
        asymmetric (CC row spawns, four CLI rows stay no-spawn)
== Result ==
ALL CHECKS PASSED
```

**Fix:** make presence two-sided, exactly as `WR05_SCAN`'s beat scan already does (`filesWithBeat.size
!== WR05_SCAN.length`):

```ts
const rows = lines.filter((l) => rowRe.test(l));
if (rows.length !== 1) {
  asymFail +=
    `\n  ${file}: found ${rows.length} table row(s) for ${label} — expected exactly one. ` +
    `Zero rows is not "no drift": a deleted row satisfies every direction of this assertion ` +
    `vacuously, and the PASS line below would then state a check that was not performed`;
  continue;
}
```

If a per-file exception is genuinely needed (the comment gestures at README's table), express it as a
NAMED exemption pair `{file, label, reason}` — the shape `PUBLIC_DOCS_EXEMPT` and
`DISTRIBUTION_PAIR_EXEMPT` already use — never as a silent `continue`. Add a RED case to
`check-uat-oracles.test.ts` that deletes the Claude Code row and asserts exit 1; the current suite only
covers *gained* and *lost wording*, never *deleted row*.

---

### CR-02: `readRegistry()` silently last-wins on a duplicate metadata key — a `status: false` claim can be laundered into `status: true`

**File:** `scripts/audit-model.ts:838-842`
**Issue:**

```ts
const meta: Record<string, string> = {};
for (let i = start + 1; i < fenceStart; i++) {
  const m = CLAIM_META_RE.exec(lines[i].trim());
  if (m !== null) meta[m[1]] = m[2].trim();
}
```

Two problems in four lines, and both violate this module's own header ("every malformation enumerated
below throws… nothing is ever skipped"):

1. **Duplicate keys overwrite silently.** No `seen`/`dupes` tracking, no refusal. The sibling parser in
   this same repo — `context-io.parseNote` — records duplicate frontmatter keys precisely because "a
   duplicate provenance key is the on-disk signature of a field-injection forgery"
   (`context-io.ts:194-198`), and `readRegister()` itself refuses duplicate `file` keys and duplicate
   `finding_id`s twenty lines earlier. `readRegistry()` is the only one of the three that does not.
2. **Unrecognised lines are dropped** (`if (m !== null)`), where every other malformation in this file
   throws.

The consequence is not cosmetic. `check-claim-anchors.ts:293` short-circuits on `status === "true"`:

```ts
if (claim.status === "true") continue;   // skips disposition, finding_id and target_phase checks
```

so a duplicated `status:` key converts an `overstated`/`false` claim into a `true` one and skips every
D-17 obligation.

**Reproduced** (registry block carrying `- status: false` … `- status: true`):

```
claims: [{"id":"C-28-001","status":"true","disposition":""}]
```

**Fix:** mirror `readRegister`'s own duplicate refusal, and refuse an unrecognised in-fence-region line
rather than dropping it:

```ts
const meta: Record<string, string> = {};
const seen = new Set<string>();
for (let i = start + 1; i < fenceStart; i++) {
  const raw = lines[i];
  if (raw.trim() === "") continue;
  const m = CLAIM_META_RE.exec(raw.trim());
  if (m === null) {
    refuse(
      REGISTRY_PATH,
      `claim ${id} carries a line at ${i + 1} that is neither blank nor a \`- key: value\` ` +
        `metadata entry: ${JSON.stringify(raw)}. A line the parser cannot read is dropped ` +
        `silently otherwise, and a dropped key reads downstream as an absent one`,
    );
  }
  if (seen.has(m[1])) {
    refuse(
      REGISTRY_PATH,
      `claim ${id} carries duplicate metadata key \`${m[1]}\` at line ${i + 1}. The later line ` +
        `silently overrides the earlier one, so a duplicated \`status:\` launders a \`false\` ` +
        `claim into a \`true\` one and skips every D-17 obligation`,
    );
  }
  seen.add(m[1]);
  meta[m[1]] = m[2].trim();
}
```

Add the matching case to `audit-model.test.ts` — the file has a "refuses a duplicate claim id" case but
no duplicate-metadata-key case.

---

### CR-03: an EMPTY verbatim fence passes the D-16 byte comparison, and the gate reports it as a performed comparison

**File:** `scripts/check-claim-anchors.ts:249-269`; `scripts/audit-model.ts:892`
**Issue:** `readRegistry()` extracts `verbatim` byte-for-byte and never checks it is non-empty.
`check-claim-anchors` then does `want = claim.verbatim.split("\n")` — for `""` that is `[""]`, one
element — slices one line below the anchor, and compares `""` against it. If the line after the anchor
is blank (the normal markdown shape), the buffers compare equal, `comparisons += 1`, and the PASS line
reports a byte-identical comparison that proved nothing.

This is the same argument the gate makes at `check-claim-anchors.ts:154-164` for a registry with no
markdown rows ("a vacuous bijection is not a passing one: zero anchors and zero rows agree trivially"),
simply not applied at the row level.

**Reproduced** (mirror with a registry whose fence is `` ``` `` immediately followed by `` ``` ``):

```
  PASS  1 registry row(s) — 1 markdown, 0 unanchorable …;
        1 verbatim comparison(s) performed, all byte-identical; all 4 safety floor(s) mapped
ALL CHECKS PASSED
```

**Fix:** refuse an empty (or whitespace-only) verbatim block in the parse authority, where every other
malformation is refused:

```ts
const verbatim = lines.slice(fenceStart + 1, fenceEnd).join("\n");
if (verbatim.trim() === "") {
  refuse(
    REGISTRY_PATH,
    `claim ${id}'s fenced block is empty. An empty verbatim compares byte-identical against the ` +
      `blank line beneath its anchor, so the D-16 comparison is performed and proves nothing — ` +
      `the row-level form of the vacuous bijection this gate already refuses at the document level`,
  );
}
```

---

### CR-04: `check-audit-register` does not treat `—`/`-` as a blank observation, so a register of placeholder glyphs satisfies D-06

**File:** `scripts/check-audit-register.ts:93-119, 222-245`
**Issue:** `normalizeObservation()` trims, lowercases and strips `[.!;,]+$`. It does not map the em
dash to blank, and `BARE_OBSERVATIONS` does not contain `—` or `-`. So an observation of `—` is neither
blank nor bare and passes as substantive.

This is the *third* definition of "blank" inside one phase, and it is the only one that disagrees:

- `audit-model.isBlank()` (`audit-model.ts:709-711`) — `"" | "—" | "-"`, with the explicit rationale
  "writing an em dash where a reason belongs is an absent reason wearing a mark".
- `check-claim-anchors.ts:286` — `mech === "" || mech === "—" || mech === "-"`.
- `check-audit-register.normalizeObservation()` — `""` only.

The register's *own* schema uses `—` as its unfilled-value marker for `safety_surface`, so `—` is the
glyph an author is most likely to type into an unread row — exactly the T-28-14 unearned-observation
shape D-06 exists to refuse. The gate's D-18 arm catches `safety_surface: —` and its D-06 arm does not
catch `observation: —`.

**Reproduced:** `normalizeObservation("—") === "—"`; `blank? false`, `bare? false`. Same for `-`, `–`
and `?`.

**Fix:** consume the one authority instead of re-deriving the predicate — the single-source rule this
phase applies everywhere else. Export `isBlank` from `audit-model.ts` and use it:

```ts
// audit-model.ts
export function isBlank(cell: string): boolean { /* unchanged */ }

// check-audit-register.ts
import { readRegister, isBlank, REGISTER_PATH, … } from "./audit-model.js";
…
for (const row of register.rows) {
  if (isBlank(row.observation)) {
    blank.push(`${row.file} (line ${row.line})`);
    continue;
  }
  const norm = normalizeObservation(row.observation);
  if (BARE_OBSERVATIONS.includes(norm)) bare.push(…);
}
```

Add the `—` case to the existing `"fails a BARE-WORD observation"` loop in
`check-audit-register.test.ts:326` — it currently covers `clean`/`Clean.`/`none`/`n/a`/`no findings`/`OK`
but not the register's own placeholder glyph.

## Warnings

### WR-01: `check-public-docs-vocabulary` crashes with an unhandled `ENOENT` when `agent-factory/README.md` is absent, instead of reporting

**File:** `scripts/check-public-docs-vocabulary.ts:250-257, 174-183`
**Issue:** the `kitReadme` part is a bare literal `[KIT_README]` with no `existsSync` guard, and
`grepSubstring` calls `readText(file)` unguarded. The module's own header states the throw-versus-report
split ("kit-model throws… while a gate's own floor is to REPORT"), and
`check-audit-register.test.ts:371` asserts a sibling gate never emits `node:internal` frames. This one
does. Note also that the per-part vacuity floor structurally cannot fire for `kitReadme` (a literal is
always length 1), so this is the only path that can notice the file is gone — and it takes it as a crash.

**Reproduced:** deleting `agent-factory/README.md` from a mirror →
`Error: ENOENT … at readText (check-public-docs-vocabulary.js:75)` with a full Node stack trace, exit 1.

**Fix:**

```ts
function kitReadmeMembers(): string[] {
  if (!existsSync(abs(KIT_README))) {
    DERIVATION_REFUSALS.push(
      `${KIT_README} is a named member of the public-docs scan set and does not exist — refusing ` +
        `to report a verdict over a part whose one member could not be read`,
    );
    return [];
  }
  return [KIT_README];
}
// … { name: "kitReadme", members: kitReadmeMembers() },
```

That also makes the per-part vacuity floor reachable for this part for the first time.

---

### WR-02: `Number.parseInt` accepts trailing garbage in `findings` and `category`, contradicting the module's canonical-form doctrine

**File:** `scripts/audit-model.ts:544, 602`
**Issue:** `Number.parseInt(tl.cells[4], 10)` and `Number.parseInt(tl.cells[2], 10)` are lenient
prefix parsers. The module declares "A CANONICAL FORM WITH A REFUSAL OUTSIDE IT, never a parser widened
once per surprise" for its id regexes, but its numeric cells accept anything with a leading digit.

**Reproduced:** `findings: "0 abc"` → `0`; `findings: "1e9"` → `1`; `category: "6 (record-only)"` → `6`.
All three parse green. `1e9 → 1` is the sharp one: equality two then compares a number the author never
wrote against Table B's real count, and agrees or disagrees for the wrong reason.

**Fix:** an anchored form with a refusal outside it, matching the id treatment two lines away:

```ts
const NON_NEGATIVE_INT_RE = /^(?:0|[1-9]\d*)$/;
…
if (!NON_NEGATIVE_INT_RE.test(tl.cells[4])) {
  refuse(REGISTER_PATH, `Table A's row at line ${tl.line} carries \`findings\` value ` +
    `"${tl.cells[4]}", which is not a bare non-negative integer. \`Number.parseInt\` would read ` +
    `"1e9" as 1 and "0 abc" as 0, silently substituting a number the author did not write`);
}
```

Apply the same to `category`. Keep the existing `Number.isInteger` check as belt-and-braces; delete
neither.

---

### WR-03: `auditSetFiles()`'s `join()` rationale is inverted, and the resulting array mixes path separators on Windows

**File:** `scripts/audit-prepass.ts:100-109`
**Issue:** the comment reads "`join()` and not a `/` template, so the paths are byte-identical on
Windows and on Unix." That is backwards — `path.join` emits `\` on win32 and `/` on posix; a `/`
template is what would be byte-identical. Concretely, on Windows `auditSetFiles()` returns
`agent-factory\roles\x.md` for its derived members and `agent-factory/roles/_role-switch-protocol.md`
for `PROTOCOL_FILE` (a `/` literal at line 76) — mixed separators inside one array.

The sibling module `check-audit-register.ts:133-134` builds the *same* paths with a `/` template, so the
two Phase-28 modules disagree about path form on Windows, and the committed
`docs/audit/28-prepass-evidence.md` rows are not reproducible across platforms.

Functional impact is nil today (CI's audit lane is ubuntu-only and `fs` accepts both forms on Windows),
but the comment will mislead the next editor and the artifact is not platform-stable.

**Fix:** use the `/` template so both Phase-28 modules agree and the artifact is platform-stable, and
correct the rationale:

```ts
// A `/` template and NOT join(): these are repo-relative POSIX paths that must be byte-identical on
// Windows and Unix, because they land in a committed artifact and are set-compared against
// check-audit-register.ts's own `/`-templated derivation. path.join would emit `\` on win32.
const roles = listRoles(root).map((f) => `${ROLES_SUBPATH}/${f}`);
```

---

### WR-04: the pre-pass evidence artifact carries a wall-clock date, is not freshness-gated, and the module's determinism claim is false as written

**File:** `scripts/audit-prepass.ts:309-311, 343, 415`
**Issue:** line 311 states "Two runs over one tree are byte-identical, so a diff of the committed
evidence means a real change in the tree." `renderEvidence` writes `- **Generated:** ${today}` from
`new Date().toISOString()`, so two runs on different days differ regardless of the tree. The claim is
true of `runPrepass()`'s `rows` and false of the artifact the sentence is about.

Compounding it: `docs/audit/28-prepass-evidence.md` is committed but **not** wired into CI and has no
freshness gate — unlike `28-safety-surface-exclusions.md`, whose freshness is folded into
`check-audit-register`. So the artifact the module says "survives the phase precisely so a later `diff`
has something to compare against" can drift arbitrarily with nothing going red. The
`"re-runs BYTE-IDENTICALLY"` test at `audit-prepass.test.ts:258` passes only because both runs happen
within one day.

**Fix:** pick one. Either (a) drop the date line from the artifact and fold a `renderEvidence`-vs-
committed byte comparison into `check-audit-register` the way `renderSafetySurface` already is, or
(b) narrow the comment to what is true:

```ts
// Deterministic by construction: files in the DERIVED order, lines in file order, predicates in
// table order — so `runPrepass()`'s ROWS are identical across two runs over one tree. The rendered
// ARTIFACT is not, because it stamps the generation date; a diff of the committed evidence is
// therefore evidence of a tree change ONLY once that line is discounted. This file is NOT
// freshness-gated (`UNKNOWN - verify` whether it should be).
```

---

### WR-05: `check-claim-anchors` uses a different `isEntry` idiom and a different `ROOT` idiom from every sibling, and its comment cites a precedent it does not follow

**File:** `scripts/check-claim-anchors.ts:73, 374-379`
**Issue:** two single-line divergences from the pattern the other five new modules in this phase share.

```ts
const ROOT = process.env.CHECK_ROOT ?? join(import.meta.dirname, "..");   // line 73
…
const isEntry =
  process.argv[1] !== undefined && process.argv[1].endsWith("check-claim-anchors.js");  // line 378
```

`audit-prepass.ts`, `check-audit-register.ts`, `check-nul-bytes.ts`, `check-public-docs-vocabulary.ts`,
`check-uat-oracles.ts` and `generate-safety-surface.ts` all use `pathToFileURL(process.argv[1]).href`,
each carrying an explicit comment that the string form is wrong. This file's comment at line 374 says
"the check-uat-oracles.ts precedent" — which is the `pathToFileURL` form, not this one. The comment
describes code that is not here.

The `??` also differs: every sibling uses a truthiness ternary, so `CHECK_ROOT=""` degrades to the repo
root there and resolves paths against the process CWD here.

**Fix:** adopt the sibling form verbatim:

```ts
const ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : join(import.meta.dirname, "..");
…
const isEntry =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
```

(and add `import { pathToFileURL } from "node:url";`).

---

### WR-06: `grepSubstringInsensitive` lowercases the subject but not the needle — a mixed-case entry in the single-source list would silently never match

**File:** `scripts/check-public-docs-vocabulary.ts:188-202`
**Issue:**

```ts
if (lines[i].toLowerCase().includes(needle)) { … }
```

The lowercase-only invariant on `RETIRED_PROSE_FORMS` is documented in a comment in `dead-vocabulary.ts`
and nowhere enforced. Adding `"Handoff Packet"` to that array would make this gate match zero lines,
forever, silently — a live consumer of a single-source list whose enforcement quietly becomes a no-op.
The sibling consumer `audit-prepass.ts:156` builds its regex with the `i` flag and does not have this
hazard, so the two consumers of one list handle case differently.

The `expect(RETIRED_PROSE_FORMS).toEqual([…])` freeze in
`check-public-docs-vocabulary.test.ts:309` currently prevents this, but it is a freeze on the data, not
a guard on the consumer — and the freeze is exactly what a future editor updates when adding a literal.

**Fix:** make the consumer self-correcting rather than dependent on an unstated invariant:

```ts
function grepSubstringInsensitive(scan: readonly string[], needle: string): string[] {
  const lowered = needle.toLowerCase();   // the invariant is enforced here, not assumed upstream
  …
  if (lines[i].toLowerCase().includes(lowered)) { … }
}
```

---

### WR-07: the registry's `line:` field is required, never format-validated, and never consumed by any check

**File:** `scripts/audit-model.ts:732, 896`; `scripts/check-claim-anchors.ts`
**Issue:** `line` is in `CLAIM_REQUIRED_KEYS` and carried through as `ClaimRow.line: string`, but no
consumer reads it. `check-claim-anchors` reports positions from the anchor's actual index
(`line ${at + 2}`), never from the row. A registry row may therefore declare `line: 4` while its anchor
sits at line 900, and nothing notices — the field reads as authoritative provenance to a human and is
mechanically meaningless.

**Fix:** either verify it or say it is decorative. Verifying is cheap because the anchor index is
already in hand:

```ts
// in the verbatim loop, after `at` is resolved
const declared = claim.line.trim();
if (/^\d+$/.test(declared) && Number(declared) !== at + 2) {
  fail(
    `${doc}: ${claim.id} declares \`line: ${declared}\` but its anchor puts the claim at line ` +
      `${at + 2}. A declared position that disagrees with the anchor is a row a reader will trust ` +
      `and a gate never checked`,
  );
}
```

(Range forms like `7-8` need the same treatment or an explicit carve-out.)

---

### WR-08: non-markdown registry rows are exempt from ALL verification, not only from the anchor bijection — and the one such row is the file this phase edited

**File:** `scripts/check-claim-anchors.ts:122-124, 152`
**Issue:** `anchoredDocs()` filters to `.md`, and `unanchorable` rows are only *counted* in the PASS
line. `C-28-038` names `.claude-plugin/plugin.json` — whose `description` was rewritten in this very
phase — and its verbatim block is a single line that appears literally in that JSON file. The stated
reason for the exclusion ("a JSON file cannot carry an HTML comment") justifies dropping the *anchor*
requirement; it does not justify dropping the *verbatim* requirement, which needs no anchor at all.

The registry's own prose names the residual honestly, so this is not a hidden gap — but it is a
mechanically closable one, on the single row with no other protection, in the one file Phase 29 is most
likely to touch and forget.

**Fix:** verify unanchorable rows by substring rather than by position:

```ts
for (const claim of unanchorable) {
  const abs = join(ROOT, claim.file);
  if (!existsSync(abs)) { fail(`${claim.id} names ${claim.file}, which does not exist`); continue; }
  const bytes = readFileSync(abs);
  if (!bytes.includes(Buffer.from(claim.verbatim, "utf8"))) {
    fail(
      `${claim.file}: ${claim.id}'s verbatim text is not present in the file. An unanchorable row ` +
        `cannot be POSITION-checked, but it can be PRESENCE-checked, and presence is what Phase 30 ` +
        `needs before it voids the claim by id`,
    );
  }
  comparisons += 1;
}
```

Then narrow the PASS line's "its freshness is held by its registry row alone" claim accordingly.

---

### WR-09: the byte-fidelity fuzz harness's "documented blank drop" carve-out is broader than the contract it encodes

**File:** `scripts/context-io.test.ts` (residual-2 fuzz block)
**Issue:**

```ts
if (d < 0 && r.input.replace(/[^\n]/g, "").length > 0 && r.output.trim() === r.input.trim()) {
  blankNulled++;
  continue;
}
```

The contract this excuses is specific: `splitNotes` nulls a **purely-blank refused remainder** via
`refused.trim() === ""`. The predicate written excuses *any* negative delta whose lost bytes are
leading/trailing whitespace of the whole document — including a real regression that dropped the
trailing `\n` from an **admitted, recovered** note. The comment says the carve-out identifies cells "BY
THAT CONTRACT"; the code does not.

Given this phase spent a plan discovering that a harness written against a false premise reported 42
phantom failures, the premise here deserves the same scrutiny.

**Fix:** test the contract directly instead of a proxy:

```ts
const r2 = mod.splitNotes(r.input);
const documentedBlankDrop =
  r2.trailingMalformed === null &&                       // the remainder was nulled…
  d === -(lostBlankRegionLength(r.input, r2));           // …and exactly that region's bytes are gone
```

or, simplest and tight enough: assert that `r.output` is a *subsequence-preserving* prefix/suffix trim
AND that `r2.notes.join("")` is byte-unchanged from the recovered regions, so a loss inside an admitted
note can never land in this branch.

---

### WR-10: `consumingRemainder()` treats zero-width assertions as consuming atoms, so the "closed pure-lookahead class" control has a blind spot

**File:** `scripts/check-uat-oracles.test.ts:430-472, 522-540`
**Issue:** `consumingRemainder` strips `(?=…) (?!…) (?<=…) (?<!…)` and calls whatever survives "the
CONSUMING part". `^`, `$`, `\b` and `\B` all survive and are all zero-width. A regex such as
`/\b(?=.*a)(?=.*b)/` consumes nothing, has the exact quadratic retry behaviour this control exists to
close, and would be classified as consuming and never flagged.

The `WR05_BEATS`-specific case at line 512 does assert `startsWith("^")` and no `m` flag, which is the
real linearity argument for those three — but the repo-wide class scan at line 522 is the one that
claims the class is *closed*, and its premise about what "consuming" means is false.

**Fix:** strip zero-width assertions too, so the remainder really is the consuming part:

```ts
// after the lookaround strip, remove the remaining zero-width assertions before deciding
const ZERO_WIDTH = /\\[bB]|[\^$]/g;
return out.replace(ZERO_WIDTH, "").trim();
```

and keep the separate `startsWith("^")` assertion for `WR05_BEATS`, which answers a different question
(how many start positions are attempted) from this one (does a failed attempt rescan). Re-run the scan
afterwards: it may surface additional sites, each of which needs either a consuming atom or a NAMED
entry beside `SANCTIONED_PURE_LOOKAHEAD`.

---

### WR-11: `check-nul-bytes` can die with a stack trace outside a git worktree, and its `--eol` parse contradicts the `-z` rationale in its own header

**File:** `scripts/check-nul-bytes.ts:174-184, 210-234, 284-299`
**Issue:** three smaller points on one gate.

1. `execFileSync("git", …)` in `trackedPaths()` and `gitBinaryPaths()` is unguarded. Outside a git
   worktree (or with `NUL_SCAN_ROOT` pointed at a non-repo) git exits 128 and the gate dies with a Node
   stack trace rather than a reported verdict — the throw-versus-report split every sibling gate in this
   phase observes.
2. The header justifies `-z` because "a newline in a filename would corrupt a newline-delimited parse"
   — and then `gitBinaryPaths()` at line 216 does exactly that (`out.split("\n")`). The two views would
   disagree on count and the gate would red, so it fails closed, but the stated rationale is applied to
   one call and not its twin.
3. A tracked file deleted from the working tree (or a submodule gitlink) lands in `unreadable` and reds
   this gate for a reason unrelated to NUL bytes. Fail-closed is right; the message should say which
   case it is so a developer does not read it as a NUL finding.

**Fix:**

```ts
function git(args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 })
      .toString("utf8");
  } catch (e) {
    throw new Error(
      `\`git ${args.join(" ")}\` failed at ${ROOT} — ${(e as Error).message}. The tracked set ` +
        `cannot be derived, so no verdict is reported over it`,
    );
  }
}
```

wrap the `runAll()` derivation in a `try`/`fail()` pair, use `-z` for the `--eol` call as well
(`git ls-files --eol -z`), and split the `unreadable` message into "path missing from the working tree"
versus "path unreadable".

---

### WR-12: equality one constrains only `counted: yes` rows, leaving uncounted rows unbounded while they feed the D-18 exclusion list

**File:** `scripts/check-audit-register.ts:163-184, 248-268`
**Issue:** `countedPaths` is set-compared against the derived listers. `uncounted` rows are reported by
name but otherwise unconstrained: nothing checks the file exists on disk, nothing bounds how many there
may be, and nothing constrains their `kind`. Yet an uncounted row with `safety_surface: yes` enters
`safetySurfaceUnion()` (`generate-safety-surface.ts:83-90`) and therefore the exclusion list Phase 29
consults — and the `check-audit-register.test.ts` "second uncounted row" case proves adding one keeps
the gate green.

The protocol file is the intended single member, and `audit-prepass` does missing-file-check *its* copy
of that literal — but this gate does not.

**Fix:** at minimum, existence-check every register row's file, and pin the uncounted arm:

```ts
const missingOnDisk = register.rows.filter((r) => !existsSync(join(ROOT, r.file)));
if (missingOnDisk.length > 0) {
  fail(`${missingOnDisk.length} register row(s) name a file that does not exist on disk — ` +
       `${missingOnDisk.map((r) => `${r.file} (line ${r.line})`).join(", ")}`);
}
if (uncounted.length !== EXPECTED_UNCOUNTED_ROWS) {   // 1 today, the D-02 protocol file
  fail(`the register carries ${uncounted.length} uncounted row(s), expected exactly ` +
       `${EXPECTED_UNCOUNTED_ROWS}. An uncounted row is unconstrained by equality one yet feeds ` +
       `the D-18 exclusion list, so its cardinality is pinned rather than left open`);
}
```

---

### WR-13: the second (meaning) oracle in the residual-2 fuzz is bound to a hardcoded `/usr/bin/ruby` and degrades to a green pass when absent

**File:** `scripts/context-io.test.ts` (residual-2 fuzz block, `const RUBY = "/usr/bin/ruby"`)
**Issue:** the loader oracle probes an absolute interpreter path. On the `windows-latest` CI leg and on
any Linux image where Ruby is not at that exact path, the probe fails, the test `return`s after a
`console.log`, and the case reports **green** with only the primary byte-count oracle having run. A CI
log line is not a test signal — nothing asserts the loader ran on any platform.

**Fix:** resolve from `PATH` and make the skip visible in the result, not only in stdout:

```ts
const RUBY = process.env.YAML_ORACLE_RUBY ?? "ruby";
…
if (probe.status !== 0) {
  // Visible in the report, not only in a log line a green run buries.
  ctx.skip(`YAML loader oracle unavailable (${RUBY}); the byte-count oracle above still ran`);
}
```

(vitest's `it("…", (ctx) => …)` / `ctx.skip()` marks the case skipped rather than passed.) Alternatively
gate the whole `it` with `it.skipIf(!hasRuby)` so the suite summary shows a skip.

---

_Reviewed: 2026-08-12T09:28:14Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
