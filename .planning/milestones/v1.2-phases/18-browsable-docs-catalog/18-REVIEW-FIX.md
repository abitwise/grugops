---
phase: 18-browsable-docs-catalog
fixed_at: 2026-06-15T17:38:30Z
review_path: .planning/phases/18-browsable-docs-catalog/18-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 18: Code Review Fix Report

**Fixed at:** 2026-06-15T17:38:30Z
**Source review:** .planning/phases/18-browsable-docs-catalog/18-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (WR-01, WR-02, WR-03, WR-04 — all Warnings; 0 Critical/Blockers)
- Fixed: 4
- Skipped: 0
- Info findings IN-01/IN-02 were out of scope and not touched. IN-03 was fixed only as the mandatory collateral test change forced by WR-02 (see WR-02 below).

All fixes land in the TypeScript sources (`scripts/generate-catalog.ts`, `scripts/generate-catalog.test.ts`); the committed `.js` was rebuilt with `tsc` and staged in the same commit (D-13 freshness contract), and the generated `docs/catalog/README.md` was regenerated where the output bytes changed.

**Verification — all four gates green on the resulting HEAD (`73ea36f`):**
1. `npm run typecheck` — clean (tsc --noEmit)
2. `npm run test` — 136 passed, 1 pre-existing skip (vitest run), including the rescoped IN-03 oracle
3. `npm run freshness` — no committed-`.js` drift (12 files match a fresh rebuild)
4. `npm run freshness:catalog` — committed catalog matches a fresh regeneration

Working tree left clean. No gate was faked.

## Fixed Issues

### WR-01: `sectionBody` returns empty/truncated body — a blank line after `## One job` hard-fails the build

**Files modified:** `scripts/generate-catalog.ts`, `scripts/generate-catalog.js`
**Commit:** ddbcdc5
**Status:** fixed: requires human verification (logic/regex change)
**Applied fix:** Anchored the `sectionBody` lookahead's second branch to true end-of-input — `$(?![\s\S])` instead of a bare `$` under the `/m` flag (a bare `$` matches end-of-every-line, which truncated last-in-file sections to their first line and returned `""` for a blank-line-after-heading layout). Also replaced the falsy `if (!body)` guard in BOTH the roles loop and the workflows loop with an explicit `if (body === null || body.trim() === "")` so a present-but-blank-then-text section parses correctly instead of falsely tripping the fail-closed exit. Behaviorally verified live: blank-then-text now yields a non-empty body, a last-in-file multi-line section captures all lines, and the normal followed-by-`##` case is unchanged. Flagged for human verification because it is a regex/logic change.

### WR-04: Workflow filter accepts any `.md`, contradicting the "16 numbered files" contract

**Files modified:** `scripts/generate-catalog.ts`, `scripts/generate-catalog.js`
**Commit:** ec05488
**Status:** fixed: requires human verification (filter/logic change)
**Applied fix:** Changed the workflows `readdirSync` filter from `f.endsWith(".md")` to `/^\d{2}-.+\.md$/.test(f)`, matching the documented `NN-*.md` (00..15) contract and mirroring the roles loop's `_`-prefix guard. A stray `README.md` / `_draft.md` / `note.md` dropped into `agent-factory/workflows/` is now ignored rather than picked up and hard-failed on the `# Workflow:` H1 check. Behaviorally verified: numbered files kept; `README.md`, `_draft.md`, `note.md`, and single-digit `9-*.md` rejected. Output over the current kit (which contains only `NN-*.md`) is byte-identical, so `freshness:catalog` stayed green. Flagged for human verification because it changes selection logic.

### WR-03: No markdown-cell escaping — a `|` or newline in any summary corrupts the table and the byte-diff

**Files modified:** `scripts/generate-catalog.ts`, `scripts/generate-catalog.js`
**Commit:** 9078e41
**Applied fix:** Added a `cell()` helper that backslash-escapes `\` first (to avoid double-escaping), then `|`, then flattens any `\r?\n` to a space. Applied it to the authored content cells only — role name + summary; workflow name, cadence, and summary — and deliberately NOT to the constrained `tier`/`order` fields nor the Source link column (which is a controlled path I construct myself, so it must not be escaped — this preserves the relative links introduced by WR-02). On the current kit no field contains a pipe or newline, so escaping is a no-op and the catalog output is byte-identical (freshness:catalog green). Behaviorally verified: `a | b` → `a \| b`, embedded newline → space, clean text untouched.

### WR-02: Catalog source links are non-portable (root-absolute `/…`) — break outside github.com web view

**Files modified:** `scripts/generate-catalog.ts`, `scripts/generate-catalog.js`, `scripts/generate-catalog.test.ts`, `docs/catalog/README.md`
**Commit:** 73ea36f
**Applied fix:** Changed both row-emit loops from the root-absolute link form `[${link}](/${link})` to a relative form `[${link}](../../${link})` — two levels up from `docs/catalog/` to the repo root — so the links resolve in local file viewers, VS Code markdown preview, plain CommonMark renderers, and npm's README view, not only GitHub's blob renderer. Rebuilt the `.js` and regenerated `docs/catalog/README.md` (all 33 source links now read `../../agent-factory/...`); committed all three together so the freshness gates stay green.

**Mandatory collateral (IN-03), included in this commit:** WR-02's relative links introduce the literal substring `..` into the catalog, which would have flipped the blanket `expect(text).not.toContain("..")` oracle at `scripts/generate-catalog.test.ts:213` to a false failure. As instructed, that assertion was rescoped — not deleted — to a focused regex `expect(text).not.toMatch(/\w\.\.(\s|\||$)/m)` that still guards the original intent (no fabricated double-period after a sentence, e.g. the incident-responder single-sentence edge: `word..`) while correctly ignoring the legitimate `../../` in relative links and any `...` ellipsis. The `countRowsLinkingInto` row-count helper was verified to still return 17/16 under the new link form (its regex spans the `](...)` boundary, so it matches exactly once per row as before). Full `npm run test` passes (136) with the rescoped oracle.

---

_Fixed: 2026-06-15T17:38:30Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
