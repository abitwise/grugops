# Phase 44: Upstream source declaration and pin check - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-24
**Phase:** 44-upstream-source-declaration-and-pin-check
**Areas discussed:** Names (S-06 gate), Upstream export shape, Pin check and reader, Location/scope/access

---

## Names (S-06 gate)

| Option | Description | Selected |
|--------|-------------|----------|
| `upstream.sources[]` | `upstream` object holding a `sources` array; room for upstream-wide settings | ✓ |
| Flat `upstream_sources[]` | Top-level array; later settings need more top-level keys | |
| `design_sources[]` | Names the content; ref prefix would still be `upstream:` | |

**User's choice:** `upstream.sources[]`

| Option | Description | Selected |
|--------|-------------|----------|
| id, path, commit, entry, entry_blob, owns | Matches UP-01 wording; `entry_blob` unambiguous | ✓ |
| name, path, commit, entry, blob, scope | Research sketch spelling | |
| You decide | | |

**User's choice:** id, path, commit, entry, entry_blob, owns

| Option | Description | Selected |
|--------|-------------|----------|
| `consult.mode`: single \| panel | Object, room for `consult.lenses` | ✓ |
| Flat `consult` | Scalar like `cadence` | |
| `consult.mode`: off \| single \| panel | Explicit off; conflicts with CON-02 on-request rule | |

**User's choice:** `consult.mode`: single | panel

| Option | Description | Selected |
|--------|-------------|----------|
| open, carried, answered, withdrawn | `carried` separates the carry list | ✓ |
| + declined | Conflicts with BR-05 (answered only by a new pin) | |
| open, answered, withdrawn | Minimal; can't tell carried from not | |

**User's choice:** open, carried, answered, withdrawn

**More on names:** user asked for more. `tools/grugops/upstream.js`, Workflow 20 and `BR-<n>` were accepted without objection.

| Option | Description | Selected |
|--------|-------------|----------|
| `Build-request:` / `Consult:` body prefixes | WF04 Title-case prefix convention; six kinds stay closed | ✓ |
| Uppercase prefixes | Matches `CONSULT` wording, breaks convention | |
| New note kinds | Reopens the closed kind schema | |

**User's choice:** Title-case body prefixes

| Option | Description | Selected |
|--------|-------------|----------|
| `upstream.escalation_days`, default 10 | One default sprint length | ✓ |
| `upstream.escalation_days`, default 5 | One working week | |
| Name only, default in Phase 45 | | |

**User's choice:** `upstream.escalation_days`, default 10

| Option | Description | Selected |
|--------|-------------|----------|
| `memory-bank/plans/build-requests/BR-<n>.md` | Next to tickets/epics/uat; `BUILD_REQUESTS_REL` | ✓ |
| `.grugops/build-requests/BR-<n>.md` | Machine-state folder | |
| You decide | | |

**User's choice:** `memory-bank/plans/build-requests/`

---

## Upstream export shape

| Option | Description | Selected |
|--------|-------------|----------|
| grugops publishes a minimal contract | Upstream conforms; one parser | ✓ |
| Upstream defines it; per-source adapter | Configurable parser, more red-team surface | |
| Wait for upstream | Defer manifest parsing to Phase 45 | |

**User's choice:** grugops publishes a minimal contract

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown with a fixed table | Readable; small table reader | ✓ |
| JSON | Trivial parse, machine file | |
| Markdown with YAML frontmatter list | Needs a new YAML parser | |

**User's choice:** Markdown with a fixed table

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed `PREFIX-number` grammar | Same shape as ticket IDs | ✓ |
| Broader safe charset | Prefix scope gets fuzzy | |
| Manifest declares its own regex | Injection/ReDoS surface | |

**User's choice:** Fixed `PREFIX-number`

| Option | Description | Selected |
|--------|-------------|----------|
| `locked` \| `superseded` + `Superseded by` | Only approved items; follow the chain | ✓ |
| `locked` \| `open` \| `superseded` | Lists open upstream questions too | |
| No status column | Can't tell superseded from typo | |

**User's choice:** `locked` | `superseded` with `Superseded by`

---

## Pin check and reader

| Option | Description | Selected |
|--------|-------------|----------|
| Drift = head-moved or blob-mismatch | head-moved informational; UNKNOWN for missing path/git/commit | ✓ |
| Only blob mismatch is drift | Human never learns upstream moved | |
| Any difference is UNKNOWN | Loses cause | |

**User's choice:** Drift = head-moved or blob-mismatch

| Option | Description | Selected |
|--------|-------------|----------|
| Graded by cause | head-moved continues at pin; mismatch/UNKNOWN blocks that source's work | ✓ |
| Any non-match stops upstream work | Stalls on every upstream commit | |
| Report only, never block | Conflicts with UP-04 | |

**User's choice:** Graded by cause

| Option | Description | Selected |
|--------|-------------|----------|
| By ID, plus manifest-listed paths | No traversal; no second containment check | ✓ |
| By any path inside the source | Needs a containment authority | |
| By ID with section anchor | Needs a section splitter | |

**User's choice:** By ID, plus manifest-listed paths

| Option | Description | Selected |
|--------|-------------|----------|
| 64 KiB per read, refuse over it | Named refusal; build-request candidate | ✓ |
| 64 KiB, truncate with marker | Half a document | |
| Configurable per source | Guard can be dialed away | |

**User's choice:** 64 KiB, refuse

| Option | Description | Selected |
|--------|-------------|----------|
| BEGIN/END keyed by blob hash | Unforgeable and deterministic | ✓ |
| Random nonce per read | Nondeterministic output | |
| Plain fixed markers | Spoofable | |

**User's choice:** Blob-hash-keyed fence

**More:** user moved on; checkpoint id for pin changes and SHA-256 left to research/discretion.

---

## Location, scope and access

| Option | Description | Selected |
|--------|-------------|----------|
| Areas from a closed list, plus ID prefixes | Validator refuses typos; prefixes tie IDs to owner | ✓ |
| Areas only, free text | Judgement call | |
| Closed areas only | Coarser with several sources | |

**User's choice:** Closed areas plus ID prefixes

| Option | Description | Selected |
|--------|-------------|----------|
| product, ux, visual, audio, architecture, content | Six generic areas | ✓ |
| product, ux, architecture | Coarser | |
| You decide | | |

**User's choice:** product, ux, visual, audio, architecture, content

| Option | Description | Selected |
|--------|-------------|----------|
| No override: committed relative path only | One reader; refuse absolute, `~`, in-repo | ✓ |
| Optional uncommitted local override | Second reader to red-team | |
| Environment variable override | Hard to verify across hosts | |

**User's choice:** No override

| Option | Description | Selected |
|--------|-------------|----------|
| Reader is the only path; no new host rules | Shell call to `upstream.js`; document prompts | ✓ |
| Installer writes read rules for sources | Invites direct reads bypassing the fence | |
| Document per-host setup only | Invites working-tree reads | |

**User's choice:** Reader is the only path

---

## Claude's Discretion

- Source `id` grammar, hex form and length of `commit`/`entry_blob`, uniqueness of areas/prefixes across sources
- Pin-change checkpoint id vs prose rule
- SHA-256 repositories, CRLF, cross-repo reads without fetch (research)
- Adversarial fixture construction (UP-05)
- Exact `AGENTS.md` third-root line

## Deferred Ideas

- Section-anchor reads
- Machine-local path override
- Installer-written host read rules for sources
