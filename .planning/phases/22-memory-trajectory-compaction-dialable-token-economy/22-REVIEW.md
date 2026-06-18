---
phase: 22-memory-trajectory-compaction-dialable-token-economy
reviewed: 2026-06-18T23:30:00Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - scripts/context-io.ts
  - scripts/compactor.ts
  - scripts/context-io.test.ts
  - scripts/compactor.test.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 22: Code Review Report (Round-5 CMP-02 gap-closure)

**Reviewed:** 2026-06-18
**Depth:** deep (cross-file)
**Files Reviewed:** 4
**Status:** issues_found — ROUND-5 ORACLE IS BYPASSABLE (the 5th bypass)

## Summary

This is the round-5 adversarial review of the CMP-02 carve-out safety invariant
(`checkCarveOut()` in `scripts/compactor.ts`), which has been bypassed four times across
rounds 1–4 despite each round shipping a fully green unit suite. The round-5 fix adds two
shared-layer fail-closed gates — gate (a) `parseNote.malformedLines` and gate (b) the shared
`validate()` — run on every raw and promoted note's verbatim bytes before any survival /
byte-equal decision.

**Pre-flight checks (all clean):**

- The committed `scripts/context-io.js` and `scripts/compactor.js` are a **byte-identical**
  build of their `.ts` sources (rebuilt with the project `tsconfig.json` to a temp dir and
  diffed). Analyzing the `.ts` is sound — the tests drive the `.js`.
- The full suite for both files is **green: 211 passed**.

**The round-5 fix is real and robust for the line-shape class it targets.** I confirmed, by
driving the committed CLI on hand-crafted notes, that the previously-bypassable vectors are now
closed: indented `verified_by`, `key : value` (space-before-colon), tab-after-colon,
trailing-whitespace, CRLF, lone-CR line-splitting (caught via duplicate-key/malformed),
body-`---` second fence, premature in-fence `---`, refs-item shaped like a key, relabel
finding→claim, and supersedes laundering are ALL refused (or correctly handled). The two-gate +
byte-equal core is airtight **for any note the oracle parses**.

**But a FIFTH bypass exists, and it is in the exact same family as rounds 1–4: a production
data shape the oracle's parser silently projects away.** The carve-out's read path
(`readNoteDir` → `parseNote`) parses only the FIRST `---...---` fence per `.md` file, while the
production write path (`writeThread` / `composeThreadNote`, same module) APPENDS multiple note
fences into a single `threads/<agent>.md` file. Every note after the first is swallowed into
the first note's `body` and is invisible to the oracle — bypassing both new gates, the
byte-equal loop, AND the required-survival set entirely. A §14-gate-verified finding or an
unconditionally-required failed-attempt buried as note #2+ can be silently dropped at exit 0
"carve-out intact". Constructible, reproduced below, classified **Critical**.

The reason all 211 tests stayed green: **every carve-out test writes exactly one note per
`.md` file.** The single test that calls `writeThread` (compactor.test.ts:729) writes one note
and never feeds the result to `checkCarveOut` — it only asserts two-tier separation. The corpus
never exercises the actual production raw-thread representation. This is the precise
"green suite necessary but not sufficient" failure mode.

## Critical Issues

### CR-01: Multi-note thread file — every note after the first is invisible to the carve-out (FIFTH CMP-02 bypass)

**File:** `scripts/compactor.ts:160-174` (`readNoteDir`), `scripts/compactor.ts:129-147`
(`readNoteFields`), `scripts/context-io.ts:197-259` (`parseNote`), produced by
`scripts/compactor.ts:517-564` (`writeThread` / `composeThreadNote`).

**Issue:**
`readNoteDir` reads each `.md` file and calls `readNoteFields` → `parseNote` **once** per file.
`parseNote`'s fence regex `/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/` (context-io.ts:204) is
non-greedy on the frontmatter group, so for a file containing multiple concatenated note
fences it parses **only the first fence** and folds the entire remainder — including every
subsequent note's frontmatter and body — into `m[2]`, the body of the first note.

The production raw-thread representation is exactly such a multi-note file. `writeThread`
(compactor.ts:517-542) appends each provenance-bearing note to a **single**
`threads/<agent>.md` file via `composeThreadNote`. The module's own contract comment
(compactor.ts:513-516) states the intent: *"each recorded note is appended as an id-BEARING
structured fence so the compaction step ... can parse the file into the per-note raw set the
carve-out reads."* No such splitter exists anywhere — `readNoteDir` does not split a
multi-fence file into per-note records. So the per-note raw set the carve-out is supposed to
read is silently truncated to the first note in each thread file.

Consequence: a §14-gate-verified finding (or an unconditionally-required failed-attempt) that
is the 2nd-or-later note in a thread file is **never seen** by the oracle. It cannot enter the
required-survival set, so dropping it from the promoted set is accepted. Both gate (a) and gate
(b) inspect only the first note; the buried notes are body text. Same class as the prior four
bypasses (a real on-disk byte present, projected away by the parser before any survival
decision keys on it).

**Reproduction (verified against the committed `scripts/compactor.js`):**

Raw thread `thread/engineer.md` (one file, two note fences — exactly what `writeThread`
produces after two calls):

```text
---
id: 20260617T142305Z-engineer-observation-o1
kind: observation
by: engineer
at: 2026-06-17T14:23:05Z
verified_by: 
confidence: low
refs:
  - X
supersedes: 
---

just an observation.
---
id: 20260617T150000Z-engineer-finding-CRITICAL
kind: finding
by: engineer
at: 2026-06-17T15:00:00Z
verified_by: §14-gate#RUN7
confidence: high
refs:
  - Y
supersedes: 
---

The SQL injection is fixed (gate-verified).
```

Promoted `promoted/o1.md` (keeps ONLY the first observation; the verified finding is entirely
absent):

```text
---
id: 20260617T142305Z-engineer-observation-o1
kind: observation
by: engineer
at: 2026-06-17T14:23:05Z
verified_by: 
confidence: low
refs:
  - X
supersedes: 
---

just an observation.
```

Result:

```text
$ node scripts/compactor.js check thread promoted
carve-out intact: every failed-attempt id survived and all load-bearing provenance fields are present.
EXIT=0
```

The §14-gate-verified finding was silently dropped. The same construction with a
`failed-attempt` buried as note #2 (the unconditionally-required class) also returns exit 0
"carve-out intact".

I also confirmed `writeThread` produces this shape in practice: two `writeThread` calls with
note provenance yield a single `threads/engineer.md` containing four `^---$` fence lines (two
complete notes), and `parseNote` of that file returns only the first note's scalars with the
second note buried in `.body` (and `malformedLines` empty — the body is not scanned).

**Fix:**
The read path must split a multi-note file into per-note records BEFORE parsing, so EVERY note
in a thread file reaches both gates and the required-survival set. The split must use the SAME
fence grammar `parseNote` uses (single source of truth, the IN-02 principle), and a trailing
non-blank, non-fence remainder must fail closed (it is an unparseable note, never a silent
drop). Sketch:

```ts
// In context-io.ts — a shared splitter yielding each note's verbatim bytes, reusing the same
// fence shape parseNote recognizes. A non-blank remainder that is not a fence is a structural
// fault the caller surfaces (fail closed), never dropped.
export function splitNotes(text: string): { notes: string[]; trailingMalformed: string | null } {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const notes: string[] = [];
  let rest = normalized;
  const FENCE = /^---\n[\s\S]*?\n---\n?/;
  let m: RegExpMatchArray | null;
  while ((m = rest.match(FENCE))) {
    notes.push(m[0]);
    rest = rest.slice(m[0].length);
  }
  return { notes, trailingMalformed: rest.trim() === "" ? null : rest };
}
```

Then `readNoteDir` iterates `splitNotes(fileText).notes`, keys each by its frozen id (or
`<file>#<n>`), runs BOTH gates and the byte-equal / required-survival logic per note, and pushes
a fail-closed finding for any `trailingMalformed` remainder. Until the carve-out reads the same
per-note set the write path emits, the invariant is bypassable.

**Mandatory test to close alongside the fix (this is WHY the bypass survived):** a held-out case
that builds the raw thread via `writeThread` (or a literal multi-fence file), drops a buried
verified finding / buried FA from the promoted set, and asserts the CLI refuses (exit 1) naming
the dropped id. A single-note-per-file corpus structurally cannot detect this class.

## Warnings

### WR-01: Free-scratch `writeThread` appends raw body with no fence — broadens the multi-note invisibility surface

**File:** `scripts/compactor.ts:534-536` (`writeThread`), `scripts/compactor.ts:160-174`
(`readNoteDir`).

**Issue:**
Called WITHOUT a `note` argument, `writeThread` appends `body + "\n"` as raw scratch
(compactor.ts:535-536) — no `---` fence. A thread file that mixes fenced notes with raw scratch
(or is entirely scratch) compounds CR-01: `parseNote` parses the first fence and swallows
everything after (any later structured note included), or returns null for an all-scratch file.
An all-scratch file is caught as `unparseable` (fail closed, good), but a fence-then-scratch
file silently hides any later note. Nothing on the write path enforces "only clean fenced
notes," yet the read path assumes it.

**Fix:** Fold into the CR-01 splitter; additionally give free-scratch a deterministic boundary
(or reject mixing scratch and fenced notes in one file) so the compaction step has unambiguous
per-note edges.

### WR-02: `readContext` silently skips an unparseable note (fail-open), diverging from the compactor's fail-closed posture

**File:** `scripts/context-io.ts:464-468`.

**Issue:**
`readContext` does `if (!parsed) continue;` — it silently drops any `notes/<id>.md` that
`parseNote` cannot parse (the inline comment says "skip an unparseable file rather than crash
the read"). The compactor deliberately does the OPPOSITE (WR-02, compactor.ts:160-174: record
unparseable and fail closed). `readContext` feeds `currentState`, `admit`, and `render` —
including the live-green-verdict cross-check in `admit` (context-io.ts:609). A note unparseable
for any reason (a future encoding edge the normalizer misses, a truncated write) vanishes from
admission and replay with no signal. For a safety-relevant read path this is fail-open. Not the
CMP-02 carve-out path (hence Warning), but it is the same anti-pattern the phase is eliminating.

**Fix:** Surface unparseable notes from `readContext` (e.g. a sibling list callers can fail
closed on, mirroring `NoteDirResult.unparseable`) rather than `continue`.

### WR-03: `readContext` id/filename divergence — code contradicts its comment and emits no signal

**File:** `scripts/context-io.ts:470-475`.

**Issue:**
`const id = s.id && s.id !== "" ? s.id : fileId;` (line 475) **prefers the frontmatter `id`**
when present, but the adjacent comment (lines 470-473) claims "the filename (the storage key)
wins for the read." The code and comment disagree. More importantly, when frontmatter `id` ≠
filename id — which the comment itself calls "the on-disk signature of a tampered identity" —
the divergence is resolved silently with NO finding. The comment defers to "validate() … on the
explicit path," but `validate()` only sees text, never the filename, so it cannot cross-check
`id` vs filename. Nothing surfaces the divergence. A latent identity seam on the context read
path (not the carve-out, hence Warning), plus a code/comment defect.

**Fix:** Decide the resolution rule, make code and comment agree, and emit a structural finding
(or fail closed in the relevant caller) when frontmatter `id` ≠ filename id.

## Info

### IN-01: Duplicated id-composition logic between `composeThreadNote` and `noteId` (drift hazard)

**File:** `scripts/compactor.ts:547-548` vs `scripts/context-io.ts:416-420`.

**Issue:**
`composeThreadNote` re-implements the id formula
(`${at.replace(...)}-${by}-${kind}-${randomUUID().slice(0,8)}`) inline instead of reusing
`context-io`'s `noteId`. This is the exact drift hazard the IN-02 unification killed for the
parser — the same single-source principle should apply to id composition. A future change to
`noteId`'s format would not propagate here, and a thread id could diverge from the
promoted-counterpart id format, defeating the id-keyed carve-out.

**Fix:** Export and reuse `noteId` (or a shared id helper) from `context-io.ts`.

### IN-02: `validate()` accepts arbitrary unknown frontmatter keys with no signal

**File:** `scripts/context-io.ts:235-248`, `scripts/context-io.ts:267-358`.

**Issue:**
The kv branch accepts any `^([A-Za-z_]+):` key into `scalars` (confirmed: `foo: bar` parses,
`validate()` returns 0 findings). Unknown keys are not load-bearing today, so not a bypass — but
a permissive surface: a future field that becomes load-bearing, or a typo of a real provenance
key (e.g. `verfied_by:`), is silently accepted while the real field reads as missing/empty.
Given the phase's "fail closed on the class, not the named shape" lesson, an allowlist of
recognized provenance keys (structural finding for anything else) would harden against the next
typo-shaped laundering vector.

**Fix:** Consider an allowlist of known provenance keys in `validate()`; emit a structural
finding for unrecognized keys. Lower priority than CR-01.

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
