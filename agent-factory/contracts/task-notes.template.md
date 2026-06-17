---
kind: contract
contract: task-notes-render-template
requirement: SCTX-04
---

# Contract: the consolidated task-notes render template (`index.md`)

This document defines the shape of `.grugops/context/<task>/index.md` — the human-facing
consolidated view of a task's context notes. It is written in clear professional voice
because it describes a trace surface.

`index.md` is a **derived artifact**, not an authored one. `scripts/context-io.ts` (compiled
to `scripts/context-io.js`) renders it as a pure deterministic function of the `notes/`
frontmatter. It is never hand-edited. The render is:

- **Zero-token** — it is a deterministic extraction and formatting of frontmatter, not an
  LLM summary. (Semantic distillation is the Phase-22 compaction layer, out of scope here.)
- **Byte-reproducible** — rendering the same `notes/` twice produces a byte-identical
  `index.md`. This is what lets the `freshness:context` drift gate (plan 20-03) prove the
  committed `index.md` matches a fresh regeneration.
- **Freshness-gated** — a committed `index.md` that has drifted from what the current `notes/`
  would render is caught by the drift gate and fails closed. The markdown `notes/` are the
  source of truth; on any conflict `index.md` is regenerated from them.

Wiring roles or workflows to call the render on task completion is **Phase 24, out of scope
here.** Phase 20 ships the render function, this template, and the freshness gate.

## Determinism rules (mandatory for byte-reproducibility)

The render is a pure function of the `notes/` frontmatter. To stay byte-reproducible it must:

- **Sort notes by `at`** (ISO-8601 lexicographic) with the **note id as a deterministic
  tiebreak** — never `readdir` order, never file modification time, never file position.
- **Fold out superseded notes** using the `at` + `supersedes` fields: a note whose id appears
  in a later note's `supersedes` is marked superseded in the current-state view. Superseded
  notes are retained in `notes/` (never pruned) and may be listed in a separate history
  section, but they are folded out of the live state. The supersede resolution is purely a
  function of `at` + `supersedes`, not of file order.
- **Emit no timestamps of its own** beyond the notes' own `at` values. The render must not
  embed "generated at" wall-clock time, a build counter, or anything that varies run to run.
- **End with exactly one trailing newline** (the `lines.join("\n")` + final-empty-element
  idiom used by the other generators in `scripts/`).

## Free-text cell escaping (markdown-injection mitigation)

Any free-text value from a note (the `by` author, the body excerpt, any `refs` entry) that is
rendered into a pipe-delimited markdown table cell must be escaped with the same `cell()` rule
the other generators use (cloned from `scripts/generate-catalog.ts`):

- backslash `\` becomes `\\` (escaped first so the escapes added next are not double-escaped),
- pipe `|` becomes `\|` (so a literal pipe cannot inject a spurious table column),
- any newline becomes a single space (so a stray newline cannot break the row).

This prevents a crafted note value from injecting rows or columns into the rendered table.

## Section shape

The exact internal layout is the renderer's discretion; the *existence* of a deterministic
template is what this contract locks. A conforming `index.md` contains, in order:

1. **A generated-file header** — a comment marking the file as generated and naming the
   regeneration command, so no human edits it by hand.
2. **A title** identifying the task whose context this consolidates.
3. **A current-state section** — the live notes after superseded notes are folded out,
   ordered by the `at` + note-id sort, each shown with its `kind`, `by`, `at`, `confidence`,
   and `verified_by` provenance and a short body excerpt. This is the at-a-glance answer to
   "what is the verified state of this task right now."
4. **A superseded / history section** (when any note has been superseded) — the folded-out
   notes, so the audit trail remains visible without cluttering the live state.

Every cell drawn from note free-text is escaped per the rule above. The render carries no
caveman voice — it is a trace surface.
