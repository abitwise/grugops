# Phase 43: Story and layered docs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-17
**Phase:** 43-story-and-layered-docs
**Areas discussed:** README story and length, Main docs layout, Reference page scope, Worked examples, CLAUDE.md /grug cleanup, Honesty sweep scope, Milestone UAT run

---

## README story and length

| Option | Description | Selected |
|--------|-------------|----------|
| Short front door | Tagline, short story, one quickstart, where-next list; host table and command list move to docs; ~3-4 KB | ✓ |
| Story on top, keep the rest | Replace the opener only; stays ~10 KB | |
| Medium | Story + Claude Code quickstart + one line per host | |

| Option (C-28-001) | Description | Selected |
|--------|-------------|----------|
| Move it to the concept page | Paragraph moves with anchor and id; README gets new ids | ✓ |
| Rewrite it in the README | Keep id in README, rewrite, history note | |
| Split it | One sentence stays, rest moves under a new id | |

| Option (C-28-002/003) | Description | Selected |
|--------|-------------|----------|
| Status dropped, replaced in place | Registry D-18 rule; new text gets new ids | ✓ |
| Reuse ids for new text | Update verbatim block, keep old as history | |
| You decide | | |

| Option (brand tone) | Description | Selected |
|--------|-------------|----------|
| One light line | Keep "> grug keep it simple." | |
| None in the body | Plain English throughout; grug only in art and attribution | ✓ |
| A bit more | Short grug aside in the story | |

| Option (quickstart) | Description | Selected |
|--------|-------------|----------|
| Claude Code only + host link | One Claude Code block | |
| Host-neutral install, then pick host | Install with checkbox list, pointer to per-host table | ✓ |
| Claude Code + one-liner per host | | |

| Option (how-it-works in README) | Description | Selected |
|--------|-------------|----------|
| 5 bullets, link to docs | Plain lines, no diagram | ✓ |
| Small diagram | Mermaid or ASCII | |
| Nothing, link only | | |

**User's choice:** short front door, C-28-001 moves to concepts, 002/003 dropped in place, no grug voice in body, host-neutral quickstart, 5 bullets.

---

## Main docs layout

| Option | Description | Selected |
|--------|-------------|----------|
| New docs/ pages | docs/README.md index + topic pages + reference/ | ✓ |
| Grow agent-factory/README.md | One deep in-kit guide | |
| Single docs/guide.md | One long page | |

| Option (concept vs mechanics) | Description | Selected |
|--------|-------------|----------|
| Two pages | concepts.md + how-it-works.md | ✓ |
| One page | | |

| Option (usage organization) | Description | Selected |
|--------|-------------|----------|
| By job, host-neutral | One section per job; host table once at top | ✓ |
| By lifecycle stage | | |
| By host | | |

| Option (kit README overlap) | Description | Selected |
|--------|-------------|----------|
| Kit README links, docs/ owns it | Written once in docs/; kit README keeps start-here | ✓ |
| Leave the kit README as is | | |
| Kit README becomes the usage page | | |

| Option (kit links, only agent-factory/ ships) | Description | Selected |
|--------|-------------|----------|
| Absolute GitHub URLs | | |
| Ship docs/ with the kit | Installer copies docs so relative links work everywhere | ✓ |
| Relative links, accept the gap | | |

| Option (ship scope) | Description | Selected |
|--------|-------------|----------|
| Only the public user docs | Derived list; audit/design/initial/runbooks stay checkout-only | ✓ |
| All of docs/ | | |
| Only docs/reference/ | | |

| Option (diagrams) | Description | Selected |
|--------|-------------|----------|
| Mermaid, sparingly | One flow diagram in how-it-works, plus text steps | ✓ |
| Text only | | |
| ASCII diagrams | | |

**Notes:** Claude flagged that the installer ships only `agent-factory/`, so relative links from the kit README to `../docs/` would be dead in an installed kit home; the user chose to ship the public docs.

---

## Reference page scope

| Option (agent pages) | Description | Selected |
|--------|-------------|----------|
| One page per role, levels inside | 19 role pages; engineer page has a levels section | ✓ |
| One page per Claude Code adapter | 21 pages | |
| Role pages + level stubs | | |

| Option (page content) | Description | Selected |
|--------|-------------|----------|
| Summary + extracted sections | Header facts + One job, Activates when, Output, Board moves, Hard limits, Stop when | ✓ |
| Full role text rendered | | |
| Thin card | | |

| Option (skill pages) | Description | Selected |
|--------|-------------|----------|
| One page per op, all spellings | 7 pages with every host invocation | ✓ |
| One page per skill file | | |
| One skills page | | |

| Option (catalog) | Description | Selected |
|--------|-------------|----------|
| Catalog becomes the reference index | One generator, one freshness gate; docs/catalog retired | ✓ |
| Keep catalog, add pages | | |
| Also page every workflow | | |

---

## Worked examples

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite to v3, link from usage | All five updated; examples/ joins hand-trace scan set | ✓ |
| New short examples in usage.md, retire examples/ | | |
| Fresh real capture | | |

| Option (real captures 01/03) | Description | Selected |
|--------|-------------|----------|
| Relabel as illustrative v3 | Illustrative banner + "based on a real run captured 2026-06-03" line | ✓ |
| Keep real, add v3 delta notes | | |
| Re-capture these two live | | |

| Option (coverage) | Description | Selected |
|--------|-------------|----------|
| Five is enough, flows link inline | Inline short examples for jobs without one | ✓ |
| Add 06: Tech Lead scoring | | |
| Add a parallel-work example | | |

---

## CLAUDE.md /grug cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Fix every /grug to what shipped | Live claims and research block corrected; a check refuses /grug | ✓ |
| Live claims only | | |
| Trim the research block | | |

---

## Honesty sweep scope

| Option | Description | Selected |
|--------|-------------|----------|
| Extend corpus + one GAP-D1 check | Existing banned-claims gate covers new pages; small GAP-D1 check; reader review | ✓ |
| Gates only | | |
| Full manual sweep too | | |

---

## Milestone UAT run

| Option | Description | Selected |
|--------|-------------|----------|
| Headless by me, you sign off | `claude --print` in a scratch repo, evidence, typed-name acceptance | ✓ |
| Live session you run | | |
| Both | | |

---

## Claude's Discretion

- README wording and the where-next list
- File names in docs/reference/ and index columns
- Kit-home location of shipped docs (recommended `$GRUGOPS_HOME/docs/`)
- Links from shipped pages to checkout-only files, plus a link check
- Delete vs pointer for retired docs/catalog/
- Wiring of the GAP-D1 and `/grug` checks
- How generated pages sit in the registry file set without anchors

## Deferred Ideas

- Tech Lead scoring walkthrough (06)
- Parallel-work walkthrough (needs GAP-D1 proven)
- Live re-capture of examples 01 and 03
- Per-workflow reference pages
- Full manual honesty sweep of every public doc and the kit
