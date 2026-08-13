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

A note is a single markdown file: **YAML frontmatter followed by a markdown body**. Every
role, workflow, and skill file already uses the same CommonMark + frontmatter shape.

Notes live under a per-task folder:

```
.grugops/context/<task>/
  notes/        append-only raw note files — the source of truth, git-tracked, RETAINED
  index.md      DERIVED, human-facing consolidated render (deterministic, zero-token)
  index.jsonl   DERIVED, machine-parsable event index (one line per note)
```

The markdown files under `notes/` are the **source of truth**. `index.md` and `index.jsonl`
are derived, byte-reproducible renders of the `notes/` frontmatter. Neither carries any
information that is not already in `notes/`. On any conflict, the markdown notes win and the
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
| `id`          | string                     | The note's stable creation-time identity (`<at-compact>-<by>-<kind>-<nonce>`), frozen at write and equal to the `<id>.md` filename. Carried verbatim through compaction — a load-bearing field the carve-out matches raw→promoted on and byte-equal-checks. |
| `kind`        | one of the six values      | What kind of note this is. |
| `by`          | string                     | The authoring role or agent. |
| `at`          | ISO-8601 timestamp string  | When the note was recorded. The authoritative replay sort key. |
| `verified_by` | string (may be empty)      | What verified this note's claim. For a `finding` it must carry a real `§14-gate#<id>` stamp (gate-verified) or a `human:<name>` stamp (escalation); other kinds may leave it empty. |
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
field; it never silently accepts an incomplete note. The required-field rule is the
no-fabrication floor: an unstamped note cannot enter the verified context.

`supersedes` and `refs` **may be empty** on any note. `verified_by` **may be empty** only on a
soft or neutral kind (`claim` / `decision` / `failed-attempt` / `observation` / `artifact-ref`);
on a `finding` it is enforced. The admission rules that give `verified_by` teeth are now live in
`scripts/context-io.ts`: a `finding` is admitted only with a real verification stamp, and an
agent's self-set stamp is refused. Specifically, for a `finding` the validator is a structural
FAIL when `verified_by` is empty, is a literal `self` / `me` / `agent`, equals the note's own
`by` (self-stamp), is a DeLM invalid-evidence phrase, or matches neither accepted grammar — the
refuse-self FAIL set. A `verified_by: §14-gate#<id>` stamp additionally cross-checks a live GREEN
gate verdict carrying that per-run id (Posture B): a stamp that matches no live green verdict is
refused. A `human:<name>` stamp is accepted structurally; on Claude Code its un-forgeable human-set
signal is delivered by the separate PER-CALL PreToolUse `admission-guard` hook that gates the
STRUCTURED `mcp__grugops__propose_note` admission channel — a distinct process that reads the FRESH
session variable per call (the variable the agent's own child env cannot reach) and validates the
agent-supplied `human:<name>` stamp against it on every call (mirroring the prod-deploy guard). The
hook reads the FINAL structured tool arguments, not a Bash command string, so there is no command
text to obfuscate. The grant is session-scoped and per-note capable (D-07): once a named human
exports the approval variable, it authorizes high-severity admissions under that name for the rest of
the session, and the human controls granularity by setting/unsetting the grant around a specific
disposition (the per-call hook re-reads the fresh env, so an unset takes effect on the next call); it
is not a mechanically-enforced per-note nonce. The GOV-02 ledger's `disposed_by: human:<name>`
therefore means "admitted under <name>'s session grant," not "individually reviewed each entry." The structured channel routes its persistence through `context-io.ts`
(`admitAndAppend` → `appendNote`), so `context-io.ts` remains the single sanctioned writer. That hook
is the Claude Code primary tier, gated by the `human_admission` dial; the four non-CC CLIs degrade to
the in-script `admit()` refusal plus a prompt-level "stop, ask a named human," documented honestly as
not mechanically un-forgeable (D-04/D-05). The reserved `by: §14-gate` identity is itself
a structural FAIL on any note except the gate's own verdict emission — the one root-of-trust carve-out.

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

The `claim` note-KIND and the queue CLAIM are two unrelated concepts that happen to share the word
"claim". They must never be blurred in a single sentence, a shared field, or a shared code path.

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

**The `claim`-kind cannot satisfy a finding's admission (now enforced, VFY-04):** a `claim`-kind
note can never, on its own, satisfy a `finding`'s admission requirement. A claim is soft until
something verifies it; only a verified result is a `finding`. `scripts/context-io.ts` enforces
this: a `finding` is admitted only with a real verification stamp, so a claim cannot masquerade
as a verified finding. When a finding's stamp is refused, the agent honestly re-records the
result as a `claim` with `confidence: UNKNOWN - verify` — it never fakes a pass.

## Worked example: a valid note

```markdown
---
id: 20260617T142305Z-software-engineer-finding-a1b2
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
`kind` is one of the six values. `id` is the note's frozen creation-time identity and equals
the `<id>.md` filename. `verified_by` carries a gate stamp, `refs` is a YAML list, and
`supersedes` is empty (this note overrides nothing).
