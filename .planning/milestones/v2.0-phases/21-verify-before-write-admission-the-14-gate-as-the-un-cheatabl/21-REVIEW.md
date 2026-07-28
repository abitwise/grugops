---
phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
reviewed: 2026-06-17T16:58:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - scripts/context-io.ts
  - scripts/context-io.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/generate-catalog.test.ts
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/contracts/context-note.md
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
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-06-17T16:58:00Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

The substantive logic lives in `scripts/context-io.ts` (the verify-before-write admission path:
`validate` / `emitVerdict` / `admit`, plus `parseNote` / `readContext` / `currentState` /
`render`). It is carefully written and the threat-model comments are unusually thorough — the
field-injection defense (`assertSingleLine`), the duplicate-key detector, the non-substring
DeLM phrase matcher, and the reserved-identity carve-out are all implemented as documented and
exercised by 26 passing tests. The 17 role files received one benign WF16 pointer line each;
they are well-formed and consistent with the workflow they reference.

The review nonetheless surfaces one BLOCKER: a CRLF line-ending asymmetry between the loud
`validate` path and the silent `readContext` path that can make a green gate verdict invisible
to the admission cross-check on Windows — a named first-class platform — wrongly refusing a
legitimate finding (an availability/correctness defect that also weakens the very admission
guarantee this phase exists to establish). Four warnings and three info items follow.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: CRLF note files are silently dropped by `readContext` but loudly rejected by `validate` — a verdict normalized to CRLF becomes invisible and wrongly refuses a legitimate finding

**File:** `scripts/context-io.ts:183-185, 404-410, 533-543`

**Issue:**
`parseNote` anchors its frontmatter fence on LF only:
```ts
const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
if (!m) return null;
```
A note file with CRLF (`\r\n`) line endings does not match (`---\r\n` ≠ `---\n`), so `parseNote`
returns `null`. The two consumers then diverge:

- The CLI `validate <file>` path treats `null` as a loud structural FAIL (line 236-237) — good.
- `readContext` *silently skips* the file: `if (!parsed) continue;` (line 410).

This was verified empirically: a CRLF-encoded note round-trips to `[]` from `readContext` while
the same bytes produce `structural FAIL: no YAML frontmatter fence` from `validate`.

Why this is a BLOCKER, not cosmetic: `readContext` feeds `currentState`, which `admit` uses to
find the live green verdict (lines 542-543). CLAUDE.md names **Windows as a first-class target**
("including Windows, where POSIX shell cannot run"), and git `core.autocrlf=true` or a Windows
editor will normalize committed `notes/*.md` to CRLF. The concrete failure: a green
`§14-gate` verdict note that gets CRLF-normalized becomes invisible to `admit`, so a downstream
`finding` stamped `§14-gate#<id>` is **wrongly refused** even though a real green verdict exists
on disk. That is exactly the "honest result blocked by tooling" failure the phase is meant to
prevent, and it degrades silently (the verdict simply isn't seen) rather than failing loud.
A CRLF green verdict can also never be *folded out* as superseded, and `render` silently omits
the note from `index.md`/`index.jsonl`, breaking the byte-reproducible audit trail on Windows.

**Fix:** Normalize line endings on read before matching the fence, so the LF-only assumption
holds regardless of how the file was stored:
```ts
function parseNote(text: string): ParsedFrontmatter | null {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  // ... unchanged, operating on `normalized`
}
```
Add a CRLF round-trip test to `context-io.test.ts` covering both `validate` (still loud FAIL or
now-accepted, per chosen contract) and, critically, `readContext`/`admit` so a CRLF green verdict
admits the matching finding. Whichever way the contract resolves CRLF, the two paths must agree —
the current split where `validate` rejects but `readContext` silently ignores is the defect.

## Warnings

### WR-01: `at` is the authoritative replay sort key but is never format-validated — a non-ISO `at` corrupts replay ordering while passing validation

**File:** `scripts/context-io.ts:249-253, 430-433`

**Issue:** The contract (`context-note.md` line 78) and the code comments (line 60) both call
`at` "the authoritative replay sort key" and require ISO-8601. But `validate` only checks `at` is
present and non-empty (line 249-253); any string passes. `currentState`/`render` then sort by
`a.at.localeCompare(b.at)`. A note with `at: banana` or `at: 9999` (verified to pass `validate`)
sorts lexicographically against real ISO timestamps and silently reorders the trace — a `finding`
could be folded the wrong way relative to its `supersedes` chain, or a stale note could sort after
a newer one. Because replay determinism is the SCTX-04 guarantee, an unvalidated sort key
undermines it. This is agent-authored data, exactly the surface the phase distrusts elsewhere.

**Fix:** Add a structural check that `at` parses as a valid ISO-8601 instant, e.g.:
```ts
if (scalars.at && Number.isNaN(Date.parse(scalars.at))) {
  findings.push(`structural FAIL: at "${scalars.at}" is not a valid ISO-8601 timestamp`);
}
```
(`Date.parse` is lenient; for a strict contract use an anchored ISO regex.) Cover with a RED test.

### WR-02: `readContext` silently swallows every unparseable note instead of surfacing it

**File:** `scripts/context-io.ts:410`

**Issue:** `if (!parsed) continue;` drops any note `parseNote` cannot read — not only the CRLF case
of CR-01 but a truncated fence, a corrupted write, or a hand-edited mistake. The comment
("skip an unparseable file rather than crash the read") justifies not crashing, but silently
*excluding* a note from the verified state is itself a fabrication smell: replay/admission then
operate on an incomplete view with no signal. A dropped green verdict (CR-01) or a dropped
superseding note both change the answer admission gives, invisibly.

**Fix:** Don't crash, but don't hide. Collect the skipped filenames and surface them — at minimum
to stderr, ideally as a structural signal the caller can act on:
```ts
if (!parsed) { process.stderr.write(`context-io: WARNING unparseable note skipped: ${file}\n`); continue; }
```
Consider having `admit`/`render` treat any unparseable note under the task as a hard FAIL, so a
corrupt note cannot silently change the admitted set.

### WR-03: forged verdict notes planted directly under `notes/` bypass `validate` because `readContext` never re-validates

**File:** `scripts/context-io.ts:401-425, 457-464, 542-543`

**Issue:** `isLiveGreenVerdict` trusts any record returned by `readContext` whose `by === "§14-gate"`,
`kind === "finding"`, `refs` includes `§14-gate#<id>`, and body contains the marker (lines 457-464).
But `readContext` (lines 401-425) does **not** run `validate` on the notes it parses — it only
projects scalars. A `by: §14-gate` note can never pass `validate` on the write path (the
reserved-identity rule, lines 267-273), yet a file hand-planted directly into `notes/` (out of
band, not through `emitVerdict`) is read back and accepted by `isLiveGreenVerdict` as a live green
verdict. `admit` would then admit a finding against a forged verdict. The trust boundary is "the
filesystem under `.grugops/context/`", so this is partly by-design, but it is undocumented at the
`admit`/`isLiveGreenVerdict` site and defeats the reserved-identity defense for anyone who can
write a file (the same actor the rest of the module is hardened against via `assertSingleLine` and
the duplicate-key check).

**Fix:** Re-validate verdict candidates inside the admission cross-check before trusting them, so
the reserved-identity and structural rules apply to read-back verdicts too. Reconstruct the note
text (or have `readContext` retain raw text) and require `validate(raw, /*trustedGateEmission*/ true)`
to pass — a `by: §14-gate` finding with a duplicate key or a non-grammar ref is then refused as a
verdict, matching the write-path guarantee. At minimum, document the filesystem trust boundary
explicitly at `isLiveGreenVerdict`.

### WR-04: `admit` parses the note text twice and re-derives state on every call without guarding an empty/garbage `id` slice

**File:** `scripts/context-io.ts:530-543`

**Issue:** `admit` calls `validate(text)` (which internally calls `parseNote`) and then calls
`parseNote(text)` again (line 533) — a minor redundancy. More substantively, after confirming
`GATE_STAMP_RE.test(vb)`, it derives `const id = vb.slice(\`${GATE_IDENTITY}#\`.length)` (line 541).
`GATE_STAMP_RE` (`/^§14-gate#[A-Za-z0-9._-]+$/`) guarantees at least one id char, so `id` is
non-empty here — but the derivation depends entirely on that regex staying in lockstep with the
slice offset. If the prefix constant and the regex ever drift (e.g. a future grammar tweak), the
slice silently produces a wrong id and `admit` cross-checks the wrong verdict. There is no
assertion tying the two together.

**Fix:** Derive the id from a capture group instead of a length-based slice, removing the implicit
coupling:
```ts
const m = vb.match(/^§14-gate#([A-Za-z0-9._-]+)$/);
if (scalars.kind === "finding" && m) {
  const id = m[1];
  ...
}
```
Optionally cache the single `parseNote(text)` result and pass `scalars` into `validate` to avoid
the double parse.

## Info

### IN-01: `assertSingleLine` rejects CR or LF but `composeNote` still interpolates other control characters raw

**File:** `scripts/context-io.ts:160-166, 345-360`

**Issue:** The field-injection guard blocks `\r`/`\n`, which is the documented forgery vector. But
a field value containing other YAML-significant bytes (a leading `#`, a stray `:` not on the key,
or a unicode line separator U+2028/U+2029 that some YAML readers treat as a break) is interpolated
raw into the fence. The home-grown `parseNote` won't mis-read these today, but the comment claims
the fence is the contract for any reader; a stricter allowlist would harden against a future YAML
parser. Low risk given the bespoke parser.

**Fix:** Consider extending `assertSingleLine` to also reject U+2028/U+2029, or document that the
fence is only ever read by this module's `parseNote`, never a general YAML library.

### IN-02: `emitVerdict` default `at = new Date().toISOString()` makes the verdict note non-reproducible across renders

**File:** `scripts/context-io.ts:477, 498`

**Issue:** When called without an explicit `at`, `emitVerdict` stamps wall-clock time. That is fine
for production, but it means a verdict note's `id` and `at` are non-deterministic, so two emissions
are not byte-reproducible. The render is byte-reproducible *given fixed notes*, but the verdict
emission itself is not — worth noting against the "byte-reproducible" framing. Tests pin `at` only
indirectly (the green test does not assert verdict bytes), so a regression in the `at` default
would not be caught.

**Fix:** None required for correctness; consider a test that emits a verdict with a fixed `at` and
asserts the note bytes, to lock the verdict format.

### IN-03: redundant `contextRoot ?? DEFAULT_CONTEXT_ROOT` in the CLI `admit`/`render` branches

**File:** `scripts/context-io.ts:672, 686`

**Issue:** `admit` and `render` already default `contextRoot` to `DEFAULT_CONTEXT_ROOT` in their
signatures (lines 526, 584). The CLI dispatcher re-applies `contextRoot ?? DEFAULT_CONTEXT_ROOT`
when calling them (lines 672, 686). Harmless duplication, but it obscures the single default and
invites drift if the default ever changes in only one place.

**Fix:** Pass `contextRoot` straight through (it is `undefined` when omitted, which the function
signature already defaults), or drop the signature default — pick one source of the default.

---

_Reviewed: 2026-06-17T16:58:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
