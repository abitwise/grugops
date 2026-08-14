---
phase: 29-controlled-language-voice-guard-rebuild
reviewed: 2026-08-14T17:39:29Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - scripts/voice-model.ts
  - scripts/voice-model.test.ts
  - scripts/vacuity.ts
  - scripts/vacuity.test.ts
  - scripts/kit-model.ts
  - scripts/kit-model.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/check-imperative-lexicon.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.test.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-diff-disposition.test.ts
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/audit-model.ts
  - scripts/audit-model.test.ts
  - scripts/audit-prepass.ts
  - scripts/check-claim-anchors.test.ts
  - package.json
  - .github/workflows/ci.yml
findings:
  critical: 3
  warning: 8
  info: 4
  total: 15
status: issues_found
---

# Phase 29: Code Review Report

**Reviewed:** 2026-08-14T17:39:29Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

The phase ships four gates whose common thesis is "one format-aware authority per predicate,
derive the set and assert the count." The derivation discipline, the two-sided cardinality pins,
the named-refusal posture and the hermetic RED harnesses are genuinely strong, and the counters,
`reportMeasured`, `readRegistry` and the fence toggle in `frontmatter.ts` all fail closed where they
should.

Three findings are bypasses: inputs on which a guard prints `ALL CHECKS PASSED` while the condition
it names is violated. Each was reproduced against the committed `.js` on the live tree (plants
reverted; the working tree is unchanged at the end of this review):

1. `readCavemanFence` is described as locating "the section-anchored caveman fence" but scans to
   EOF for a delimiter. A role file whose `## Caveman prompt` section carries plain senior prose and
   no fence adopts an unrelated later code block as "the caveman block." Both `guard_voice` and
   `guard_caveman_voice` pass. This is the phase's own founding defect — the voice drifting out
   while the guard stays green — reintroduced through the new single reader.
2. `guard_diff_disposition`'s companion-edit rule is implemented as "changed anywhere since the
   recorded base," not "changed in the same commit." `docs/audit/28-claim-registry.md` has already
   changed in the live range, so the `registryAnchors` half of the frozen set is vacuous at HEAD
   today.
3. `guard_imperative_lexicon` cannot see an indented (≥4 space) bullet under `## Steps`; it is
   silently reclassified as descriptive prose, which also drops it out of WP-02's 20-word bound,
   WP-05 and WP-08.

Beyond those, the "one authority" thesis is incompletely delivered: three near-identical directory
walks exist with different guarantees, `reportMeasured`'s denominator floor is structurally dead at
three of five call sites, and `guard_voice` reports line numbers from a filtered buffer rather than
the source file (measured: real line 40 reported as line 34, in every role file).

## Critical Issues

### CR-01: `readCavemanFence` is not section-bounded — a de-fenced caveman block passes both voice guards

**File:** `scripts/voice-model.ts:105-121` (fence-open and fence-close scans), consumed at
`scripts/check-foundation-guards.ts:2045` and `:2194`

**Issue:**
The module header states the reader's predicate is "WHERE IS THE **SECTION-ANCHORED** CAVEMAN
FENCE, AND IS IT WELL-FORMED." The implementation is not section-anchored: after locating the
heading it scans forward to **end of file** for the first `FENCE_DELIMITER_LINE`, with no bound at
the next `## ` heading. Any later fenced block in the document is therefore adopted as "the caveman
block," and the reader returns `ok: true` rather than `missing`.

Minimal reproduction of the wrong-block selection (pure function, no guard):

```
## Caveman prompt
You grug smash rock.

## Reads
```
some code with grug and club
```

## Hard limits
You stop.
```
→ `{ ok: true, inside: "some code with grug and club", outside: "You grug smash rock.\n\n## Reads\n\n## Hard limits\nYou stop." }`

The real caveman prose leaks into `outside` (scanned by `guard_voice`) and an unrelated code block
becomes `inside` (measured by `guard_caveman_voice`).

**Reproduced end to end against the committed `.js` on the live tree.** Replace
`agent-factory/roles/uat-planner.md`'s fenced caveman block with an unfenced senior-prose line and
append any later fenced block carrying lexicon terms:

```
## Caveman prompt
You plan business acceptance for the delivery team and record the outcome.
...
## Notes
```
grug club rock cave
```
```

`node scripts/check-foundation-guards.js` output:

```
[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
  PASS  voice: clear-voice surfaces free of caveman markers
[guard_caveman_voice] every role's caveman block carries >= 2 of the 16 committed lexicon terms ...
        uat-planner.md: tokens 4 / content words 4, banned 0
  PASS  caveman voice: 0 findings over 17/17 elements
== Result ==
ALL CHECKS PASSED
```

`VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` and `node scripts/check-kit-refs.js`
also exit 0 on the same tree, so nothing else in the repository catches it. The measurement line
`tokens 4 / content words 4` is measuring `## Notes`, not the caveman section — the guard published
a number about the wrong bytes.

`orchestrator.md` already carries four fence delimiters, so a role file with a second fence is not
hypothetical.

Two related sub-defects in the same scan:
- The close scan has the same unbounded shape, so a nested ``` inside a legitimate caveman block
  closes it early and silently truncates `inside`.
- `CAVEMAN_HEADING_LINE = /^## Caveman prompt/` is a prefix match, so `## Caveman prompted` is a
  heading hit.

**Fix:** bound both scans to the caveman section, and refuse (rather than reach past) when the
section carries no fence:

```ts
const SECTION_END = /^## /;

export function readCavemanFence(text: string): CavemanFenceResult {
  const lines = text.split("\n");
  const headings: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (CAVEMAN_HEADING_LINE.test(lines[i])) headings.push(i);
  }
  if (headings.length > 1) return { ok: false, reason: "multiple" };
  if (headings.length === 0) return { ok: false, reason: "missing" };
  const heading = headings[0];

  // THE SECTION BOUND. The predicate is "the fence in THIS section"; a delimiter under a later
  // heading belongs to a different section and must never be adopted as this one's.
  let sectionEnd = lines.length;
  for (let i = heading + 1; i < lines.length; i++) {
    if (SECTION_END.test(lines[i])) { sectionEnd = i; break; }
  }

  let open = -1;
  for (let i = heading + 1; i < sectionEnd; i++) {
    if (FENCE_DELIMITER_LINE.test(lines[i])) { open = i; break; }
  }
  if (open === -1) return { ok: false, reason: "missing" };

  let close = -1;
  for (let i = open + 1; i < sectionEnd; i++) {
    if (FENCE_DELIMITER_LINE.test(lines[i])) { close = i; break; }
  }
  if (close === -1) return { ok: false, reason: "unterminated" };
  ...
}
```

Also anchor the heading: `/^## Caveman prompt\s*$/`. Add a permanent case to
`scripts/voice-model.test.ts` planting the document above (the existing FORM 3a case only returns
`missing` because its fixture happens to contain no other fence), and a full-gate case in
`check-foundation-guards.test.ts` that plants the de-fenced role and asserts exit 1.

---

### CR-02: `guard_diff_disposition`'s companion-edit rule is range-wide, not same-commit — the `registryAnchors` freeze is vacuous at HEAD

**File:** `scripts/check-diff-disposition.ts:1039-1041` (`allChangedFiles`), `:1142`, `:1147`

**Issue:**
`FROZEN_SOURCES.registryAnchors.companion` states the rule as *"docs/audit/28-claim-registry.md must
change in the **SAME commit**"*, and `positiveGuardLiterals.companion` as *"the guard's own source
must change in the **SAME commit**"*. The implementation is:

```ts
allChangedFiles = git(["diff", "--name-only", "-z", base]).split("\0")...
...
satisfied = allChangedFiles.includes("docs/audit/28-claim-registry.md");
```

`git diff --name-only <base>` is the whole range from the recorded base to the working tree, not one
commit. Once *any* commit in the range touches the companion file, every frozen clause from that
source is permanently satisfied for the rest of the phase — no disposition row, no per-clause
correspondence, no check at all.

**This is live on HEAD.** `docs/audit/29-style-dispositions/00-base.md` records
`base_commit: 4d2b8f0`, and `git diff --name-only 4d2b8f0 | grep 28-claim-registry` returns a hit.
So all 170 `registryAnchors` clauses in the frozen set are currently unprotected.

Reproduced against the committed `.js` on the live tree — delete a registry-anchored sentence from a
watched file (`AGENTS.md`, "The shared verified context is the memory."):

```
        frozen set: registry verbatim anchors 42/42, ... 416 frozen clause(s), 55 frozen region(s)
        38 watched file(s) changed since 4d2b8f0; 1887 changed clause(s) derived; 1532 disposition row(s)
  PASS  diff disposition: 0 findings over 1887/1887 elements
== Result ==
ALL CHECKS PASSED
```

The gate's own banner claims *"a frozen intersection carries its same-commit companion edit"* while
printing that line. (`check-claim-anchors.js` independently catches this particular deletion, but
that is a different predicate; this gate's own named condition was violated under a green.)

The harness cannot catch it: `makeMirror` builds exactly two commits, so "same commit" and "since
base" are indistinguishable in every fixture, and the `registryAnchors` case at
`check-diff-disposition.test.ts:423` passes only because the copied registry is never modified.

**Fix:** resolve the commit that actually carries each changed clause and require the companion in
that commit, or — if per-commit attribution is too costly — narrow the rule to the same *change set*
by pairing the companion with the specific clause:

```ts
// Per-clause pairing rather than a range-wide file-presence test.
} else if (source === "registryAnchors") {
  // The companion must be the registry row that FREEZES THIS CLAUSE, changed alongside it.
  const registryDiff = git(["diff", "--unified=0", "--no-color", base, "--",
                            "docs/audit/28-claim-registry.md"]);
  satisfied = registryDiff.split("\n").some(
    (l) => (l.startsWith("+") || l.startsWith("-")) &&
           normalizeSentence(l.slice(1)) === c.clause,
  );
}
```

Apply the same treatment to the `positiveGuardLiterals` arm (which is *not* satisfied today only
because `scripts/check-foundation-guards.ts` happens not to have changed in the range — it has the
identical shape and will go vacuous the moment it does). Add a three-commit harness case: companion
touched in commit 2, frozen clause changed in commit 3, expect exit 1.

Related, and worth stating in the same fix: CI runs `npm run build` (which writes every `.js` in the
tree) before this gate, so `allChangedFiles` also carries build output. Nothing depends on that
today, but a companion file that is itself generated would silently self-satisfy.

---

### CR-03: an indented bullet under `## Steps` escapes `guard_imperative_lexicon` and is downgraded to a descriptive sentence

**File:** `scripts/check-imperative-lexicon.ts:480` (`LIST_MARKER = /^ {0,3}(?:[-*+]|\d{1,3}[.)])\s+/`),
`:698-717` (`inSteps` / `isBullet` / `procedural`)

**Issue:**
`LIST_MARKER` admits at most three leading spaces. A CommonMark sub-bullet under a `1. ` step is
indented four or more, so it is:
- not counted as a `## Steps` bullet → invisible to `guard_imperative_lexicon` (WP-01) **and absent
  from its denominator**, so the loss leaves no trace;
- `procedural === false` → measured against WP-03's 25-word bound instead of WP-02's 20, and skipped
  entirely by WP-05 (modal in a procedural step) and WP-08 (more than one instruction).

The guard's banner asserts *"every `## Steps` bullet begins with a verb from the closed approved set
... at position zero."* That is not what it measures.

Reproduced against the committed `.js` on the live tree. Insert one line under
`agent-factory/workflows/00-bootstrap-greenfield.md`'s `## Steps`:

```
    - The reviewer should maybe glance at the diff whenever that seems convenient.
```

`node scripts/check-imperative-lexicon.js`:

```
        139 `## Steps` bullet(s) across 19 file(s); 43 approved verb(s); 76 derived Technical Name(s)
  PASS  imperative lexicon: 0 findings over 139/139 elements
        2167 sentence(s) — 414 procedural, 1753 descriptive; by finding kind: none
  PASS  sentence form: 0 findings over 2167/2167 elements
ALL CHECKS PASSED
```

The bullet count stays at **139**, the procedural count stays at **414** — a determiner subject, a
modal and a hedge, all unmeasured. (The live corpus carries zero such bullets today, so this is a
latent hole rather than a current under-count; it is also the cheapest available route to green for
the next rewrite plan.)

Same class, same lines: `HEADING_LINE` matches `### ` too, so any sub-heading under `## Steps` sets
`inSteps = false` and releases every bullet after it (`check-imperative-lexicon.ts:698-700`). The
live corpus has none, and nothing asserts it stays that way.

**Fix:** admit an indented bullet and keep the section anchor sticky across sub-headings:

```ts
/** A list marker at any nesting depth — a sub-bullet under `## Steps` is still a step. */
const LIST_MARKER = /^\s*(?:[-*+]|\d{1,3}[.)])\s+/;

// The section anchor is set by `## ` headings ONLY. A `### ` sub-heading structures a section; it
// does not leave it, and treating it as an exit silently releases every bullet below it.
if (HEADING_LINE.test(raw)) {
  if (/^## /.test(raw)) inSteps = STEPS_HEADING.test(raw);
  continue;
}
```

Then re-run the gate and disposition whatever new findings the widened denominator produces — the
bullet count moving from 139 is the acknowledgement, not the failure. Add a harness case planting a
four-space-indented non-conforming bullet and asserting exit 1 plus a bullet count of N+1.

## Warnings

### WR-01: `guard_voice` reports line numbers from the filtered remainder, not the source file

**File:** `scripts/check-foundation-guards.ts:2071-2078`; caused by
`scripts/voice-model.ts:124-126`

**Issue:** `readCavemanFence` builds `outside` by **deleting** the heading and fence lines, so every
line after the caveman block shifts up. `guard_voice` then reports `${i + 1}` of that filtered
buffer as a source line number. Every role file puts `## Caveman prompt` at line 11, so roughly 80%
of each file's lines are misreported.

Measured on the live tree: a caveman token planted at real line 40 of
`agent-factory/roles/uat-planner.md` is reported as:

```
agent-factory/roles/uat-planner.md:
34:Smash the rock.
```

A six-line offset that points a reader at innocent text.

**Fix:** return positions instead of a re-joined string, or carry the removed line indices so the
consumer can map back:

```ts
// voice-model.ts
export type CavemanFenceResult =
  | { ok: true; inside: string; outside: string; outsideLines: number[] } // 1-based source lines
  | { ok: false; reason: "missing" | "unterminated" | "multiple" };
```

```ts
// check-foundation-guards.ts — guard_voice
for (let i = 0; i < bodyLines.length; i++) {
  if (countLexiconTokens(bodyLines[i]) > 0) m.push(`${sourceLine[i]}:${bodyLines[i]}`);
}
```

The security surfaces (`SEC_VOICE_FILES`) take the `body = text` branch, where the mapping is the
identity, so no special case is needed.

---

### WR-02: `reportMeasured`'s denominator floor is structurally unreachable at three of five call sites

**File:** `scripts/check-imperative-lexicon.ts:1119-1121` and `:1169-1171`;
`scripts/check-diff-disposition.ts:1189-1190`

**Issue:** `vacuity.ts:80` (`if (m.visited !== m.expected)`) is documented as the collection-level
floor that reports a silently narrowed check. At three sites `expected` is derived from the very
array `visited` counts:

```ts
let bulletsVisited = 0;
for (const b of elements.bullets) { bulletsVisited += 1; ... }
... { visited: bulletsVisited, expected: elements.bullets.length, ... }
```

`visited === expected` by construction, so branch 2 can never fire and the only live floor is the
zero check. `kit-model.ts:128-140` makes exactly this argument about `SPAWN_GRANT_SCAN_COUNT`
("once both read THE SAME OBJECT, set equality between them compares an object with itself and can
never fail — so it is documentation of intent, never a check").

Contrast the two sites that are correct: `check-foundation-guards.ts:2235` uses `ROLE_COUNT`
(independent), and `check-banned-claims.ts:648` uses `scan.length` while an unreadable file
`continue`s without incrementing `visited`.

Concrete consequence: a governed corpus in which 17 of 47 files stopped producing `## Steps` bullets
is indistinguishable, in the gate's output, from one in which all 47 do.

**Fix:** give each element derivation an independent denominator, or drop the parameter rather than
pass a tautology:

```ts
// The bullets are derived only from the workflow part; the denominator is that part's size, not
// the array's own length.
const workflowMembers = GOVERNED_CORPUS_PARTS.find((p) => p.name === "workflows")!.members.length;
...
{ label: "imperative lexicon", visited: filesWithSteps, expected: workflowMembers, findings }
```

For `check-diff-disposition.ts`, `expected` should be the number of clauses the diff *should* have
produced (e.g. per-file clause counts summed independently), not `changed.clauses.length`.

---

### WR-03: three near-identical directory walks, two of which have no cycle answer

**File:** `scripts/kit-model.ts:859-920` (`walkFilesRelative`/`walkLevel`),
`scripts/check-imperative-lexicon.ts:252-278` (`walkFiles`),
`scripts/check-banned-claims.ts:350-376` (`walkFiles`)

**Issue:** The two gate copies are byte-for-byte the same function under two names, and both import
`MAX_WALK_ENTRIES` from `kit-model.ts` — i.e. they already depend on the authority they are
duplicating. Neither carries the `ancestors` symlink-cycle stack that `kit-model.ts:877-886`
documents at length as *"CYCLE TERMINATION IS THIS WALK'S CONTRACT, NOT AN ACCIDENT OF THE HOST"*.
A symlink cycle under `agent-factory/seed/` terminates in the gate copies only by exhausting the
10 000-entry budget, after up to 10 000 stack frames, and produces a work-bound refusal that names
the wrong cause.

This is the phase's own stated defect class — a second grammar over the same bytes, currently
consistent.

**Fix:** export `walkFilesRelative` from `kit-model.ts` (it is already the module whose header
argues it is "the mechanism, not the contract" — that argument covers consumers *re-deriving* the
adapter set, not consumers needing a walk), and delete both gate copies. If the throw-vs-report
floor difference matters, export a `walkFilesRelativeOrRefuse(dir): { files, refusal }` wrapper and
have `kit-model`'s own throwing entry point call it.

---

### WR-04: `GENERATED_EXEMPT` is pinned by cardinality only, with no membership assertion

**File:** `scripts/check-imperative-lexicon.ts:350-352`, `:1052-1060`

**Issue:** The exclusion is derived from a marker (good), but the only assertion is
`GENERATED_EXEMPT.length !== GENERATED_EXEMPT_COUNT`. `kit-model.ts:142-145` states the rule this
violates in its own words: *"THE COUNT ALONE IS NOT ENOUGH ... a swap between parts nets out to the
right total. The per-part assertion is SET equality against each lister, never a count."*

A file that gains the literal `GENERATED` in its first 20 lines while
`security-nfr-checklist.md` loses it holds the count at 1 and the corpus at 47, and silently swaps
which document is governed. (In practice the swap reds today because the 89 KB checklist re-entering
produces findings — so this is protection by accident, not by construction.)

**Fix:** pin the membership, not the number:

```ts
/** The one generated kit document, by path. Two-sided set equality, not a count. */
export const GENERATED_EXEMPT_EXPECTED: readonly string[] = [
  "agent-factory/checklists/security-nfr-checklist.md",
];
...
if (GENERATED_EXEMPT.join("\n") !== GENERATED_EXEMPT_EXPECTED.join("\n")) {
  fail(`the derived GENERATED exclusion is ${GENERATED_EXEMPT.join(", ") || "empty"}, expected ` +
       `${GENERATED_EXEMPT_EXPECTED.join(", ")} — a swap holds the count and changes the corpus`);
}
```

---

### WR-05: the "unfilled companion" sentinel is a single em dash, so any other placeholder satisfies a frozen structural change

**File:** `scripts/check-diff-disposition.ts:823` (`const UNFILLED = "—"`), `:1138-1140`

**Issue:**

```ts
satisfied = rows.some((r) => r.companion !== "" && r.companion !== UNFILLED);
```

A `companion` cell containing `-`, `--`, `n/a`, `N/A`, `TBD`, `?` or a single space-padded hyphen is
neither empty nor the em dash, so it satisfies the companion requirement for a change inside a
frozen `## Hard limits` / `## Stop conditions` / `## Commit` section. This is the one arm of the
frozen set that CR-02 does not already void, so it carries the whole positional freeze.

**Fix:** decide the cell by a canonical form and refuse everything outside it, rather than by
exclusion of one glyph:

```ts
/** A companion cell is FILLED only when it carries prose. Any placeholder is unfilled. */
const PLACEHOLDER = new Set(["", "—", "-", "--", "–", "n/a", "na", "tbd", "?", "none"]);
const isFilled = (c: string): boolean => {
  const t = c.trim().toLowerCase();
  return !PLACEHOLDER.has(t) && normalizeSentence(c).split(" ").filter(Boolean).length >= 4;
};
satisfied = rows.some((r) => isFilled(r.companion));
```

---

### WR-06: the frozen-region locator and the exemption locator are fence-blind, while a fence authority already exists and is used by a sibling gate

**File:** `scripts/check-diff-disposition.ts:476-493` (`locateSection`),
`scripts/check-banned-claims.ts:451-485` (`locateExemptRegion`),
`scripts/check-imperative-lexicon.ts:562-579` (`tableFirstCellsUnderHeading`)

**Issue:** All three decide "where does this section end" with a bare `startsWith("## ")` /
`/^## /` scan over raw lines. `frontmatter.ts:424` exports `fencedLineFlags`, the single fence
toggle, and `check-imperative-lexicon.ts:691` already consumes it for exactly this class of
question. A `## ` line inside a fenced example therefore truncates a frozen region in
`check-diff-disposition` (shrinking the frozen set with no failure) and truncates the banned-claim
exemption region (which fails closed, so that direction is safe).

Not currently reachable on the live corpus, but the frozen-region direction fails *open*, and the
phase's thesis is that a second grammar over the same bytes is a defect even when currently
consistent.

**Fix:** thread the flags through the three locators:

```ts
import { fencedLineFlags } from "./frontmatter.js";

export function locateSection(text: string, heading: string): { from: number; to: number } | null {
  const lines = text.split("\n");
  const fenced = fencedLineFlags(text);
  for (let i = 0; i < lines.length; i++) {
    if (fenced[i] || lines[i].trimEnd() !== heading) continue;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (!fenced[j] && lines[j].startsWith("## ")) { end = j; break; }
    }
    return { from: i + 1, to: end };
  }
  return null;
}
```

---

### WR-07: the positive-guard-literal extractor scrapes source with `indexOf`, and its module-load cache is keyed on string identity of the root

**File:** `scripts/check-diff-disposition.ts:349`, `:359-361`, `:377`, `:413`, `:655-657`

**Issue:** Two problems in one derivation:

1. `src.indexOf("const " + site.declaration)` and `src.indexOf("const X =")` take the **first**
   occurrence anywhere in the file, including inside a block comment or a string literal. The 2 900
   line aggregator is comment-dense and its own headers quote declaration names. A comment written
   above the real declaration silently retargets the extraction; only the two-sided count pin would
   notice, and only if the count moved.
2. `POSITIVE_GUARD_LITERAL_DERIVATION` is computed at module load for `ROOT`, and reused only when
   `root === ROOT` by string identity (`:655`). A caller passing the same directory with a trailing
   slash, or a resolved-vs-relative spelling, silently re-derives — two derivations of one fact,
   which is the class this module is written to delete.

**Fix:** anchor the declaration scan to line start, and key the cache on a resolved path:

```ts
const declAt = (src: string, name: string): number => {
  const re = new RegExp(`^(?:export )?const ${name}\\b`, "m");
  const m = re.exec(src);
  return m === null ? -1 : m.index;
};
```

```ts
import { resolve } from "node:path";
const positive = resolve(root) === resolve(ROOT)
  ? POSITIVE_GUARD_LITERAL_DERIVATION
  : derivePositiveGuardLiterals(root);
```

---

### WR-08: plan 29-04's path-literal de-duplication is incomplete — two more spellings remain

**File:** `scripts/check-imperative-lexicon.ts:181` (`WORKFLOWS_DIR = "agent-factory/workflows"`),
`:235` (`location: "agent-factory/roles/"`)

**Issue:** `scripts/kit-model.ts:190-191` exported `ROLES_SUBPATH` / `WORKFLOWS_SUBPATH` in this
phase specifically so *"a third consumer cannot inherit a second spelling"*, and the two local
copies in `audit-prepass.ts` were deleted in the same commit. `check-imperative-lexicon.ts` — which
already imports from `kit-model.js` — kept its own. The stated fix names the class and closes one
instance.

**Fix:**

```ts
import { listWorkflows, ROLES_SUBPATH, WORKFLOWS_SUBPATH, ... } from "./kit-model.js";
...
function workflowMembers(): string[] {
  return listWorkflows(ROOT).map((f) => `${WORKFLOWS_SUBPATH}/${f}`);
}
...
{ location: `${ROLES_SUBPATH}/`, label: "the role corpus", reason: "..." },
```

## Info

### IN-01: the mirror's role membership is derived from the real tree, not the mirror

**File:** `scripts/check-foundation-guards.test.ts` (`roleTextsIn`)

**Issue:** `roleTextsIn(root)` calls `listRoles()` with **no argument** (so it lists the real
repository's roles) and then reads each name from `root`. On a mirror whose role set differs — for
example the 18-role plant used two cases below — the derivation would silently miss or throw on the
planted file, and `voiceRedCountIn(raw)` would measure a set the guard did not.

**Fix:** `listRoles(root).map((n) => readFileSync(join(root, ROLES_SUBPATH, n), "utf8"))`.

---

### IN-02: `rows` is computed and discarded on two of three frozen-source branches

**File:** `scripts/check-diff-disposition.ts:1134`

**Issue:** `const rows = disposition.rows.filter((r) => rowMatches(r, c));` is evaluated for every
frozen clause, but only the `structuralSections` branch reads it. The `registryAnchors` and
`positiveGuardLiterals` branches ignore it entirely — which a reader can easily misread as "a row is
also required here." Move the computation inside the branch that uses it.

---

### IN-03: `neutralizePhrases` is case-sensitive while the lexicon counter is case-insensitive

**File:** `scripts/check-foundation-guards.ts:2015-2025` vs `scripts/voice-model.ts:249-256`

**Issue:** The three clear-voice neutralizations (`/grug`, `grug voice`, `grug wink`) match exactly,
but `countLexiconTokens` builds its patterns with the `i` flag. A sentence-initial `Grug voice` or
`Grug wink` in clear-voice prose survives neutralization and reds `guard_voice` on correct text. Add
`gi` to the three `replace` calls.

---

### IN-04: `countWords`'s replacement loop terminates only by an unstated argument

**File:** `scripts/check-imperative-lexicon.ts:641-645`

**Issue:** `while (t.includes(name)) t = t.replace(name, "TECHNICALNAME")` grows the string for any
Technical Name shorter than 13 characters. It does terminate — each iteration consumes one space
from the text and the replacement contains none — but that argument is nowhere in the source, and
`kit-model.ts:166-169` argues in this repository's own words that *"a walk that does not terminate
promptly HANGS THE GATE RATHER THAN FAILING IT, and a hung gate is not a red gate."* Replace with a
single non-overlapping pass (`t.split(name).join("TECHNICALNAME")`), which is both bounded and
obviously so.

---

_Reviewed: 2026-08-14T17:39:29Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
