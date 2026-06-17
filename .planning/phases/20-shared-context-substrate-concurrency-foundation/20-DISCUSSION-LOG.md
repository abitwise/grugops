# Phase 20: Shared-Context Substrate & Concurrency Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 20-shared-context-substrate-concurrency-foundation
**Areas discussed:** Concurrent-append safety, Note / provenance format, Cross-platform proof, Queue & claim mechanics

---

## Concurrent-append safety — write model

| Option | Description | Selected |
|--------|-------------|----------|
| Per-note files | SoT = directory of atomic per-note markdown files; `<task>.md` + `.jsonl` both derived; zero append contention; reuses atomic-rename primitive | ✓ |
| Append to shared `<task>.md` | Single SoT file appended to; O_APPEND atomic only <PIPE_BUF (note body exceeds it → torn writes on NFS/Windows) or mkdir-lock RMW | |
| Mkdir-lock + RMW | Single `<task>.md` guarded by mkdirSync lock; serializes all writes; reintroduces a mini lock-manager | |

**User's choice:** Per-note files.
**Notes:** Choice was reinforced by the DeLM verification (below) — `asyncio.Lock` is in-process-only and does not port to grugops's separate-process agents, so the filesystem (atomic rename of per-note files) is the correct serialization. User later constrained the durable shape (see Queue & claim) so the raw nonce files are an audit substrate, not the human-facing artifact.

## Concurrent-append safety — note identity

| Option | Description | Selected |
|--------|-------------|----------|
| Time + by + nonce | `<at>-<by>-<kind>-<nonce>.md`; time-sortable, human-scannable `ls`, nonce = lock-free uniqueness; truth in the at/supersedes fence (SCTX-04) | ✓ |
| Opaque ULID | `<ulid>.md`; unique + time-sortable but unscannable | |
| Monotonic seq | `<seq>-<kind>.md`; clean ordering but atomic allocation reintroduces contention | |

**User's choice:** Time + by + nonce.
**Notes:** Filename is storage/convenience only; authoritative ordering stays in the fence.

## Note / provenance format

| Option | Description | Selected |
|--------|-------------|----------|
| YAML frontmatter | `---`-delimited fence + markdown body; idiomatic to the whole kit; validator reuses frontmatter parsing; refs as YAML list; JSONL = frontmatter→JSON | ✓ (proposed) |
| HTML-comment pipe-fence | Research's original sketch; compact but bespoke parser + fragile pipe-delimiting; only made sense for the rejected shared-file model | |
| Visible key:value block | Legible but non-standard parser | |

**User's choice:** Accepted as part of the consolidated structure proposal (frontmatter per note file). User redirected the conversation toward overall structure before formally selecting; the structured per-task model (frontmatter notes + deterministic templated `index.md` consolidation + retained `notes/` audit substrate) was confirmed.
**Notes:** Per-note-files choice changed this question — frontmatter became available and is kit-idiomatic, superseding the research's HTML-comment sketch.

## Queue & claim mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Staleness: generous configurable wall-clock TTL + explicit sweep | DeLM-aligned (TTL/expire-at-read), portable, NFS-safe; default must exceed a real agent turn; heartbeat/lease deferred to v2.x PAR-05 | ✓ |
| Staleness: heartbeat / lease now | More precise but doesn't fit single-shot LLM-turn agents; v2.x PAR-05 | |
| Claim record fields | `by` + `at` + task-ref in `claimed/<task>/claim.md` = the "now-running" registry | ✓ |
| Subtask file shape | Thin but self-contained (what-to-do + ref to context folder + originating ticket), not a fat ticket duplicate | ✓ |

**User's choice:** All confirmed. User raised the "now-running" state question directly; resolved as `ls claimed/` + `claim.md` (`by`/`at`) being the registry, with the human-facing board projection deferred to Phase 23.
**Notes:** pid/host liveness rejected (not portable cross-machine/NFS). Per-delegation claim cap (DeLM `MAX_CLAIMS_PER_DELEGATION=2`) noted for Phase 23.

## Cross-platform proof

| Option | Description | Selected |
|--------|-------------|----------|
| Windows real + NFS deterministic/UNKNOWN | windows-latest CI leg runs the real unlink-then-rename branch; NFS unit-tested deterministically + honestly marked `UNKNOWN - verify` until DOGF-02 | ✓ |
| Real Windows + NFS CI matrix | Real proof for both, but NFS in CI is heavy/flaky (needs a mount/server) | |
| Both | Deterministic now + real CI lane as stretch | |

**User's choice:** Windows real (windows-latest), NFS deterministic + `UNKNOWN - verify` until the DOGF-02 dogfood.
**Notes:** Honors Constraint #6 (no-fabrication); mirrors Phase 19's "real where runnable, loud-honest where not" posture.

---

## DeLM verification (mid-discussion research)

User asked to confirm a detailed paraphrase of DeLM's conflict-prevention against the real `github.com/yuzhenmao/DeLM` source. A research subagent confirmed all claims accurate, with one load-bearing correction: DeLM's blackboard is an in-memory list serialized by `asyncio.Lock` (authoritative), with the per-task `.jsonl` a non-authoritative best-effort sidecar. Conclusion folded into the design: `asyncio.Lock` does not port to grugops's multi-process model → per-note files + atomic rename is the filesystem-native serialization; grugops inverts DeLM's authority (markdown durable SoT, JSONL derived) as the auditable differentiator. Full record in CONTEXT.md `<specifics>`.

## Claude's Discretion

- Exact nonce length / token format against `node:crypto` specifics.
- Exact derived-artifact filenames (`index.md` vs `<task>.md`; `index.jsonl` vs `events.jsonl`) + per-task vs rolled JSONL granularity.
- Internal section structure of the consolidated `index.md` / task-notes template.

## Deferred Ideas

- DeLM invalid-evidence phrase list → Phase 21 (VFY-02 refuse-self-set / note-hygiene).
- Per-delegation claim cap (`MAX_CLAIMS_PER_DELEGATION=2`) → Phase 23.
- Heartbeat / advisory-lease claim liveness → v2.x (PAR-05).
- Human-facing "now-running" board projection + WIP width cap → Phase 23.
- Semantic (LLM) distillation of task notes → Phase 22 (CMP).
