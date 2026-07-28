---
phase: 18-browsable-docs-catalog
reviewed: 2026-06-15T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - docs/catalog/README.md
  - scripts/catalog-freshness.js
  - scripts/catalog-freshness.test.ts
  - scripts/catalog-freshness.ts
  - scripts/generate-catalog.js
  - scripts/generate-catalog.test.ts
  - scripts/generate-catalog.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-06-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Re-review of the browsable-docs-catalog tooling: a generator (`generate-catalog.ts`),
a drift gate (`catalog-freshness.ts`), their committed `.js` artifacts, two Vitest
oracles, and the generated `docs/catalog/README.md`.

**Prior-round verification (both hold, no regression):**
- **CR-01** (serialize FS-mutating gate tests) — verified resolved. `vitest.config.ts`
  sets `fileParallelism: false`; the catalog-freshness and generate-catalog oracles that
  mutate the real tree (`docs/catalog/README.md`, `agent-factory/roles/zzz-*.md`) no
  longer race across files.
- **CR-02** (fail-closed on unreadable committed catalog) — verified resolved. Removing
  the committed catalog and running the gate produced `Catalog freshness check FAILED …
  could not be read` and exit 1 (proven live during this review).

**Build-artifact drift:** the committed `.js` files are byte-faithful builds of their
`.ts` sources (re-ran `tsc`; freshness gate green). No source↔output drift.

**No BLOCKERs found.** The generator is read-only over fixed literal paths (no
argv/env/content-derived paths), uses Node stdlib only (zero host deps), and is
fail-closed on structural misses. The tree was left clean after all verification.

The findings below are correctness/robustness defects that are **dormant today only
because the current kit files happen to be authored in one specific style**. The most
important (WR-01) converts a benign authoring choice — a blank line after a section
heading — into a hard red build break, and the helper that causes it is mis-named and
does not do what its own comment claims.

## Warnings

### WR-01: `sectionBody` returns empty/truncated body — a blank line after `## One job` hard-fails the build

**File:** `scripts/generate-catalog.ts:72-76` (compiled: `scripts/generate-catalog.js:68-72`)
**Issue:**
The regex uses the multiline flag `"m"` with a `$` alternative in the lookahead:
```ts
const re = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "m");
```
Under `/m`, `$` matches **end of every line**, not end of file. Combined with the
non-greedy `([\s\S]*?)`, the capture stops at the first line boundary it can. Two
concrete consequences, both verified live:

1. **Empty capture → false fail-closed.** If a heading is followed by a blank line
   before the prose (`## One job\n\nReal text…`), `sectionBody` returns `""`. `""` is
   falsy, so `if (!body) fail(...)` fires and the generator **exits 1, refusing to
   build the catalog**, even though the section content is perfectly valid. Proven:
   ```
   Case A body: ""  => !body is true
   ```
2. **Truncated capture for last-in-file sections.** When the section is the last `## `
   in the file, `$` matches the first end-of-line, so `sectionBody` returns only the
   **first line**, never "up to … end of file" as the header comment on line 71 claims.
   The function is therefore mis-named and mis-documented.

Today this is dormant: every current kit file puts prose on the line *immediately* after
`## One job` / `## When to use`, and `firstSentence` only reads line 1, so (2) is masked.
But (1) is a foot-gun: the first author who formats a section as `## One job\n\n<text>`
turns the whole `freshness:catalog` build red with a confusing `no \`## One job\` section`
error that contradicts the file (the section is present).

**Fix:** Anchor the lookahead to true end-of-string, not end-of-line. Either drop the
`$` branch in favor of an explicit EOF assertion, or read to the next `## ` / EOF with a
`/s`-style approach. Minimal change:
```ts
function sectionBody(text: string, heading: string): string | null {
  // (?=\n## |$(?![\s\S])) — second branch is true end-of-input, not end-of-line.
  const re = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$(?![\\s\\S]))`, "m");
  const m = text.match(re);
  return m ? m[1] : null;
}
```
Then guard against a *whitespace-only* body explicitly so a blank-then-text section is
parsed correctly rather than tripping `!body`:
```ts
const body = sectionBody(text!, "One job");
if (body === null || body.trim() === "") fail(`${file}: empty \`## One job\` section …`);
```
Re-run `tsc` and commit the regenerated `.js` so the artifacts stay in sync.

### WR-02: Catalog source links are non-portable (root-absolute `/…`) — break outside github.com web view

**File:** `scripts/generate-catalog.ts:200,209` (compiled: `:177,185`); output `docs/catalog/README.md:13-50`
**Issue:**
Every row emits a root-absolute link:
```ts
`| ${r.name} | ${r.tier} | ${r.summary} | [${r.link}](/${r.link}) |`
// → [agent-factory/roles/orchestrator.md](/agent-factory/roles/orchestrator.md)
```
The leading `/` makes the link resolve against the **site/host root**, not the file's
location (`docs/catalog/README.md`, two directories deep). This breaks the catalog's
stated purpose ("Each row links to its source file", line 5 of the output) in every
context except GitHub's own web blob renderer:
- Local file viewers, VS Code markdown preview, plain CommonMark renderers, npm's README
  view → `/agent-factory/...` points outside the doc tree → dead link.
- The documented **minimal-install** path (drop the kit into a host repo) places
  `docs/catalog/README.md` at a non-root path; root-absolute links cannot find
  `agent-factory/` there at all.

This is the catalog's entire value proposition (a browsable index whose rows link to
source), so a non-portable link form materially degrades it.

**Fix:** Emit a relative link from the catalog's directory. From `docs/catalog/` the kit
is two levels up:
```ts
`| ${r.name} | ${r.tier} | ${r.summary} | [${r.link}](../../${r.link}) |`
```
This is the byte that changes the catalog, so regenerate and commit `docs/catalog/README.md`
plus the rebuilt `.js`. (If a root-absolute form is genuinely intended for a specific
host, document that constraint in the header comment.)

### WR-03: No markdown-cell escaping — a `|` or newline in any summary corrupts the table and the byte-diff

**File:** `scripts/generate-catalog.ts:199-201,207-211` (compiled: `:176-178,184-186`)
**Issue:**
`r.name`, `r.summary`, `w.name`, `w.cadence` are interpolated straight into pipe-delimited
table rows with zero escaping. A first sentence (or H1, or `cadence` value) that contains
a literal `|` would inject a spurious column; a value with an unexpected newline would
break the row entirely. No current source triggers this (verified: no `|` in any
catalogued first-line today), but the generator reads free-form authored prose, so this is
an input-validation gap waiting on the first author who writes a pipe in a `## One job`
sentence. The damage is silent table corruption that still passes the byte-diff gate
(because the committed file would have been regenerated from the same corrupt input).

**Fix:** Escape (or reject) cell content before interpolation:
```ts
const cell = (s: string): string => s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ");
// then: `| ${cell(r.name)} | ${r.tier} | ${cell(r.summary)} | … |`
```
Or fail-closed if a catalogued field contains `|`/newline, consistent with the
"refusing to write a partial catalog" stance elsewhere in the file.

### WR-04: Workflow filter accepts any `.md`, contradicting the "16 numbered files" contract → a stray file breaks the build

**File:** `scripts/generate-catalog.ts:132-134` (compiled: `:114-116`)
**Issue:**
The header comment (line 13) and inline comment (line 129) state the generator keeps "all
16 numbered files (00..15)", but the filter is only:
```ts
.filter((f) => f.endsWith(".md"))
```
Any non-workflow `.md` dropped into `agent-factory/workflows/` (a `README.md`, a stray
note, an `_draft.md`) is picked up, fails the `# Workflow:` H1 check, and hard-fails the
build (exit 1). The roles loop at least filters `_`-prefixed files (D-03); the workflows
loop applies no equivalent guard, so its behavior diverges from both its sibling loop and
its own documentation. A reader trusting the comment would be surprised when an unrelated
markdown file red-lines `freshness:catalog`.

**Fix:** Make the filter match the documented contract (numbered workflow files), e.g.:
```ts
.filter((f) => /^\d{2}-.+\.md$/.test(f) && !f.startsWith("_"))
```
or, if any-`.md` is genuinely intended, correct the two comments to say so and explain why
a stray `.md` is meant to fail the build.

## Info

### IN-01: Missing output-directory absence is an unhandled throw, not the documented fail-closed finding

**File:** `scripts/generate-catalog.ts:214` (compiled: `:188`)
**Issue:**
The header (lines 30-32) promises "a directory read failure prints a finding to stderr and
process.exit(1) WITHOUT writing." That covers read-side failures (which are wrapped in
try/catch + `fail`), but the **write** side is not: if `docs/catalog/` does not exist,
`writeFileSync(OUT, …)` throws `ENOENT` with a raw stack trace. Verified live:
```
Error: ENOENT: no such file or directory, open '…/docs/catalog/README.md'
    at writeFileSync (node:fs:2415:20)  …
Node.js v24.12.0
```
It still exits non-zero (so it is not a *safety* hole), but it surfaces a stack trace
instead of the clean `ERROR …` finding the rest of the script emits, breaking the "a
structural miss is a finding, never an unhandled throw" stance in the same header. The
freshness gate sidesteps this by pre-creating `<tmp>/docs/catalog`, which is why CI stays
green.
**Fix:** `mkdirSync(dirname(OUT), { recursive: true })` before the write, or wrap the
write in try/catch and route to `fail(...)`.

### IN-02: Freshness gate's second temp read (`rebuilt`) has no try/catch — leaks temp dir on the impossible-but-unguarded path

**File:** `scripts/catalog-freshness.ts:105` (compiled: `:81`)
**Issue:**
The committed read (lines 92-104) is now fail-closed (CR-02), but the mirror read
```ts
const rebuilt = readFileSync(join(tmp, "docs/catalog/README.md"));
```
is not guarded. If the mirrored generator ever exits 0 without producing the file, this
throws before `cleanup()` (line 107) runs, leaking the temp mirror and emitting a stack
trace. Today this is unreachable (the generator only exits 0 after `writeFileSync`), so it
is informational, but it is an asymmetry with the carefully guarded committed read directly
above it.
**Fix:** Wrap the `rebuilt` read in the same try/catch + `cleanup()` + fail-closed message
pattern used for `committed`.

### IN-03: `not.toContain("..")` is a brittle oracle for the double-period invariant

**File:** `scripts/generate-catalog.test.ts:213`
**Issue:**
Test (5) asserts the whole catalog `not.toContain("..")` to guard the incident-responder
single-sentence `..` edge. This passes today, but `..` is a substring that legitimately
appears in relative paths (`../../`) and ellipses (`...`). If WR-02's fix lands (relative
links with `../../`), this assertion would flip to a false failure; likewise any summary
containing an ellipsis. The test conflates "no fabricated double-period after a sentence"
with "the literal bytes `..` appear nowhere."
**Fix:** Scope the assertion to the table cells / sentence boundaries it actually targets,
e.g. assert no `. .`→`..` artifact via a focused regex on the One-job/When-to-use cells, or
assert `not.toMatch(/\w\.\.(\s|\|)/)` rather than a blanket substring check.

---

_Reviewed: 2026-06-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
