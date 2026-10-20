# [v3.0, D-10] Graph memory: not adopted

**Recorded:** 2026-10-20 · **Requirements:** GRAPH-01, GRAPH-02 · **Tool facts:** as of 2026-10-20 from `.planning/research/STACK.md` section (d), not re-checked; confidence labels kept as written there.

## Decision

Graph memory is not adopted for grugops, and nothing is built. Graphify and four comparable tools were evaluated (see the table below). No later phase builds, reserves or adds role text for graph memory: no state path, no role or workflow line, no installer step and no docs follow-up. This record is the only place the allowed posture for such tools is written (see "What a user and a role may do").

The decision ID is always written with its milestone tag, `[v3.0, D-10]`. PROJECT.md already holds a `[v2.0, D-10/D-11]` row about a different rule, so the bare `D-10` is ambiguous.

## Origin

The request is item 6 of `human-notes.txt`, at line 38. That file is cited here by path, line and item number only, and it is left unchanged. The request was answered by the graph memory research spike in `.planning/research/STACK.md` section (d), which this record turns into a decision.

## Tools evaluated (as of 2026-10-20)

Every cell comes from `.planning/research/STACK.md` section (d) and was not re-checked. Labels such as `LOW` and `UNKNOWN - verify` are kept on the row where STACK.md puts them.

| Tool | What it is | Runtime on host | Storage | License | Fits zero runtime deps and no database |
|---|---|---|---|---|---|
| **Graphify** (`Graphify-Labs/graphify`, formerly `safishamsi/graphify`; PyPI `graphifyy` 0.9.92) | A `/graphify` skill + CLI that parses code with tree-sitter (about 40 languages, "no LLM" for code) into a knowledge graph. Docs, PDFs and media take a semantic pass that calls the assistant's model or a configured API key. Leiden communities, `query`/`path`/`explain` commands | **Python ≥3.10 + uv or pipx**. Dependencies: `networkx`, `numpy`, `rapidfuzz`, `tree-sitter` + about 25 grammar wheels. Optional `[mcp]` extra, git hooks, `watch`. Writes skills into `.claude/skills/` and `.agents/skills/`. Logs every query to `~/.cache/graphify-queries.log` | **Files**: `graphify-out/graph.json`, `graph.html`, `GRAPH_REPORT.md` | Apache-2.0 | **No database: yes. Zero runtime deps: no** (Python toolchain + native wheels). |
| **CodeGraph** (`colbymchenry/codegraph` 1.6.2) | Pre-indexed code graph served to agents over MCP, auto-syncing on change | Bundled runtime binary (curl or PowerShell installer) or `npm i -g`. Configures MCP for many hosts | **SQLite** (`.codegraph/`). "SQLite database only" | MIT | **No.** It is a database |
| **code-graph-rag** (`vitali87/code-graph-rag`) | Graph RAG over a monorepo | Python + **Memgraph** graph DB (Docker, per the project description: `LOW`, README not read) | Graph DB | MIT | **No** |
| **Serena** (`oraios/serena`) | LSP-backed MCP toolkit for symbol retrieval and editing | Python/uv + language servers | None persistent (LSP) | GitHub API reports `NOASSERTION`: `UNKNOWN - verify` | **No** (runtime + MCP server). Overlaps CC's (Claude Code's) LSP plugins |
| **MCP memory server** (`@modelcontextprotocol/server-memory` 2.0.0) | An entity/relation "knowledge graph" the agent writes through MCP tools | Node, depends on `zod` and `@modelcontextprotocol/server` | JSONL file | Repo `NOASSERTION`: `UNKNOWN - verify` | File-based, but **breaks verify-before-write**: the agent writes memory with no verification stamp |

## Why it is not adopted

1. Every candidate adds a runtime (Python or Node packages, or a DB) to the host.
2. A code graph is *derived* data, not memory. If the shared context admitted its output, that output would carry no non-self verification stamp.
3. These tools target code-navigation reads. The size problem grugops has measured is in state files (the board, the NFR catalog and traceability), and Phase 37's per-file records, indexes and byte budgets address those files.

The per-tool reasons are in the table. The MCP memory server is file-based; it is excluded because it breaks verify-before-write, not because of a database.

The graph grugops does own is the markdown index layer Phase 37 adds (`nfr-catalog.md`, `traceability.md` and ticket links), checked by the validator. This record makes no claim about what that layer costs or spares.

## What a user and a role may do

- A user may install graphify, CodeGraph or any similar tool themselves.
- A role may read that tool's output as an exploration aid, the same way it reads grep output.
- Anything the role learns that way is verified before it enters the shared context.
- The tool's output itself never enters the shared context.

This record is the only place this posture is written. No role, workflow, doc or installer text names one of these tools or adds a line about derived indexes, so Phases 39-43 add nothing for graph memory. What such a tool sends to a model or writes to a log (see the Graphify row) is the user's own choice; grugops installs nothing.

## Verification-stamp rule

No graph-tool output enters the shared context without a verification stamp: the `verified_by` stamp that the writing agent cannot forge or self-set (PROJECT.md, Core Value). Under the posture above the stricter rule applies: the tool's output itself never enters the shared context. Only a fact that a role has verified enters, through the same admission as any other note.

## Vendor claims

Vendors self-report token savings for their tools. grugops has measured none.

## When to revisit

The decision is reopened only when both conditions hold:

- (a) A graph or code-index tool ships as plain files with zero host runtime dependencies (no Python toolchain, no native wheels, no SQLite, no graph DB, no server), and its output can carry a verification stamp before it enters the shared context.
- (b) After the Phase 37 byte budgets land, a measured dogfood run shows that code-navigation reads, not state files, are the main token cost.

Either condition alone does not reopen it. The trigger is event-based only: there is no date, no scheduled review and no milestone-audit step.

How (b) would be measured is `UNKNOWN - verify`. The only cost instrument, `scripts/measure-cost.ts`, reads an aggregate usage figure from a run and cannot separate code-navigation reads from state-file reads. Saying so creates no follow-up work and reserves no path.

## Not to be confused with

GSD, the planning tool used to build grugops, has an optional `gsd-graphify` command that writes `.planning/graphs/`; it is disabled in this repo and is not a grugops feature.
