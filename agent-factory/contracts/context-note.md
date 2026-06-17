---
kind: contract
contract: context-note-schema
requirement: SCTX-01
---

# Contract: the shared-context note schema (SCTX-01)

This document is the authoritative schema for a **context note** — the typed,
provenance-stamped unit of the shared verified context. Every note that an agent records is
one of these. The schema is written in clear professional voice because it is a trace and
safety surface: the notes are the auditable record on which later work is built, and the
validator that admits or rejects a note enforces exactly the rules stated here.

The only sanctioned writer of context notes is `scripts/context-io.ts` (compiled to
`scripts/context-io.js`). Roles and workflows never write the shared context by any other
path. This document defines the format that `context-io.ts` composes and validates against.

## Storage model

A note is a single markdown file: **YAML frontmatter followed by a markdown body**. This is
the same CommonMark + frontmatter shape every role, workflow, and skill file already uses.

Notes live under a per-task folder:

```
.grugops/context/<task>/
  notes/        append-only raw note files — the source of truth, git-tracked, RETAINED
  index.md      DERIVED, human-facing consolidated render (deterministic, zero-token)
  index.jsonl   DERIVED, machine-parsable event index (one line per note)
```

The markdown files under `notes/` are the **source of truth**. `index.md` and `index.jsonl`
are derived, byte-reproducible renders of the `notes/` frontmatter and carry no information
that is not already in `notes/`. On any conflict, the markdown notes win and the derived
files are regenerated from them.

A note file is **append-only**: recording a note writes one new file. An existing note file
is never mutated or deleted. Correcting or replacing an earlier note is done by writing a new
note whose `supersedes` field names the earlier note's id (see below) — the earlier file
stays in `notes/` as part of the permanent audit trail.

## Note identity

A note's id and filename are:

```
<at-compact>-<by>-<kind>-<nonce>.md
```

for example `20260617T142305Z-engineer-finding-a1b2.md`, where:

- `<at-compact>` is the note's `at` timestamp with separators stripped (a legible `ls`
  timeline);
- `<by>` is the authoring role or agent;
- `<kind>` is the note kind (one of the six values below);
- `<nonce>` is a short slice of `crypto.randomUUID()` (from `node:crypto`).

The `<nonce>` is a **collision-avoidance nonce, not a security token**. Its only job is to
keep two writers that record a note in the same millisecond from choosing the same filename
and clobbering each other. No secrecy, unforgeability, or authentication property is claimed
of it; it must never be treated as a credential or capability token.

The filename is for storage and legibility only. **The authoritative order of the trace is
the `at` and `supersedes` fields, never the filename, never `ls`/`readdir` order, and never
file modification time.** Replay (reconstructing current state) sorts by `at` (ISO-8601
lexicographic) with the note id as a deterministic tiebreak, then folds out any note named in
a later note's `supersedes`. See SCTX-04.

## The provenance fence (frontmatter keys)

Every note's frontmatter carries exactly these provenance keys:

| Key           | Type                       | Meaning |
| ------------- | -------------------------- | ------- |
| `kind`        | one of the six values      | What kind of note this is. |
| `by`          | string                     | The authoring role or agent. |
| `at`          | ISO-8601 timestamp string  | When the note was recorded. The authoritative replay sort key. |
| `verified_by` | string (may be empty)      | What verified this note's claim (e.g. a `§14-gate#<id>` stamp or a named human). Empty in Phase 20. |
| `confidence`  | string                     | The author's confidence (e.g. `high` / `medium` / `low` / `UNKNOWN - verify`). |
| `refs`        | YAML list (may be empty)   | References this note points at — requirement ids, file paths, ticket refs. The trace-migration substrate (SCTX-04). |
| `supersedes`  | note-id ref, or empty      | The id of an earlier note this one overrides. Empty when the note supersedes nothing. |

### Required-field rule (the validator contract)

A note is **structurally valid** only if all four of these required fields are present:

- `kind`
- `by`
- `at`
- `confidence`

A note missing any one of them is a **structural FAIL**. The validator names the missing
field; it never silently accepts an incomplete note. This is the no-fabrication floor: an
unstamped note cannot enter the verified context.

`verified_by`, `supersedes`, and `refs` **may be empty** in Phase 20. They are recorded on
every note so the schema is stable, but Phase 20 does not enforce their contents. The
admission rules that give `verified_by` teeth — requiring a real verification stamp before a
note is treated as verified, and refusing an agent's self-set stamp — are **Phase 21 (VFY),
out of scope here**. Phase 20 records the field; Phase 21 admits on it.

## The six note kinds

`kind` is exactly one of these six values. A `kind` outside this set is a structural FAIL
that names the offending value.

| Kind             | What it records |
| ---------------- | --------------- |
| `claim`          | A soft, unverified assertion the author believes but has not proven. |
| `finding`        | A verified result — something established by evidence (e.g. a passing gate). |
| `decision`       | A choice made, with its rationale, that constrains later work. |
| `failed-attempt` | An approach that was tried and did not work, recorded so it is not retried. |
| `observation`    | A neutral fact noticed during the work, not asserted as a claim or proven as a finding. |
| `artifact-ref`   | A pointer to a produced artifact (a file, a PR, a report) by reference. |

## CRITICAL DISTINCTION: the `claim` note-KIND is NOT the queue CLAIM

These are two unrelated concepts that happen to share the word "claim". They must never be
blurred in a single sentence, a shared field, or a shared code path.

**The `claim` note-KIND** is one of the six `kind:` values above. It is a soft, unverified
assertion recorded as a note file under `.grugops/context/<task>/notes/`. It carries no
ownership and grants no exclusivity. It lives entirely inside the shared-context substrate.

**The queue CLAIM** is hard work-ownership. An agent claims a task by atomically creating the
directory `.grugops/queue/claimed/<task>/` (via `mkdirSync`) and writing a `claim.md` record
inside it (CLAIM-01 / CLAIM-02, delivered in plan 20-02). A second agent's `mkdir` on the
same path throws `EEXIST`, which is the unambiguous "claim lost" signal. The queue CLAIM is a
filesystem ownership primitive; it is not a note and has no `kind`.

A `claim`-kind note is an *assertion in the context*; a queue CLAIM is *ownership of work in
the queue*. They are different mechanisms with different files, different directories, and
different purposes.

**Forward reference (Phase 21, VFY-04 — not implemented here):** a `claim`-kind note can
never, on its own, satisfy a `finding`'s admission requirement. A claim is soft until
something verifies it; only a verified result is a `finding`. Phase 20 records the `claim`
kind faithfully; Phase 21 enforces that a claim does not masquerade as a verified finding.

## Worked example: a valid note

```markdown
---
kind: finding
by: software-engineer
at: 2026-06-17T14:23:05Z
verified_by: §14-gate#ABC-001
confidence: high
refs:
  - AUTH-01
  - src/api/auth.ts
supersedes: 
---

The login endpoint rejects an expired token with a 401 and an audit log line.
Verified by the §14 quality gate run ABC-001 (lint + tests + UI/E2E all green).
```

This note is structurally valid: `kind`, `by`, `at`, and `confidence` are all present and
`kind` is one of the six values. `verified_by` carries a gate stamp, `refs` is a YAML list,
and `supersedes` is empty (this note overrides nothing).
