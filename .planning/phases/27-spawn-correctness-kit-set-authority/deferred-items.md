# Deferred Items — Phase 27

Out-of-scope discoveries logged during execution. Not fixed; recorded so they are not lost.

## D1 — `install/install.ts` carries a literal NUL byte, so `grep` classifies it as binary

- **STATUS: CLOSED in plan 27-13, Task 1.** The sentinel is now the printable
  `"<<grugops:dirs-differ>>/"`. `install/install.ts` and the committed `install/install.js` both
  hold zero NUL bytes, `grep -c "" install/install.ts` reports a line count instead of a
  binary-file notice, and `dirsSameContent()` was NOT redesigned — only the value changed. The
  replacement keeps the guaranteed mismatch: `<` and `>` are illegal in a Windows path element and
  the trailing `/` makes `join(root, sentinel)` unreadable as a file on POSIX, so even when both
  trees yield the sentinel the `sameContent()` compare still fails.

- **Found during:** plan 27-02, Task 1 (verifying the "no adapter name literal" acceptance criteria)
- **Where:** `install/install.ts` inside `dirsSameContent()` — the fail-safe sentinel
  `return ["\0differs"];` (the string literal contains a real 0x00 byte, not the two-character
  escape `\0`). The same byte is present in the committed `install/install.js`.
- **Pre-existing:** yes — confirmed present in `git show HEAD:install/install.ts` before any
  Phase-27 edit. Not introduced by this plan.
- **Impact:** functionally correct (a relative path can never contain NUL, so the sentinel does
  force the intended mismatch), but every `grep` in a C locale reports
  `Binary file install/install.ts matches` and suppresses line output. This silently defeats
  grep-based checks over the installer — including two of this plan's own acceptance criteria,
  which had to be run through `/usr/bin/grep -c` and a Node scan instead.
- **Why not fixed here:** the fix touches `dirsSameContent()`, a load-bearing fail-safe that plan
  27-02 explicitly instructs not to redesign, and the change is unrelated to KIT-02.
- **Suggested fix:** replace the embedded NUL with an ordinary impossible-path sentinel (for
  example `"\0"` written as an escape, or a plain marker such as `"<<differs>>"`), then rebuild.

## D2 — the coordinator announces its tier AFTER dispatching, not before

- **Found during:** plan 27-17, the SPAWN-03 runtime observation (session
  `9bcd8d66-091d-4387-aef0-04319f4d4015`, 2026-07-29).
- **Where:** `.claude/agents/grugops-orchestrator.md` — the generated adapter instructs
  **"Announce your tier before scheduling."**
- **What was observed:** the coordinator dispatched its three role agents at 14:46:21, 14:46:43 and
  14:47:06, and printed `**Tier: Full** — started via `--agent grugops-orchestrator`; the enumerated
  `Agent` allowlist is runtime-enforced on this path. Scheduled 3 agents in parallel at width
  **3/3**` only afterwards, as part of the closing decision write-up.
- **Impact:** low for correctness — the tier it named was the correct one, the grant was honoured,
  and width stayed at the cap. But the announcement exists so a *reader* knows which guarantee is in
  force **before** work is scheduled under it. Announced after the fact, it is a report rather than
  the disclosure the instruction intends.
- **Why not fixed here:** plan 27-17 is confined to recording the observation and the one
  requirement status it owns; it may change nothing else. Ordering the announcement is a change to
  the adapter body text, which is generator-owned (`scripts/generate-role-adapters.ts`) and gated by
  `adapters-freshness`.
- **Suggested fix:** make the ordering explicit in the generated body (e.g. "Announce your tier as
  the first output of your first turn, before any tool call"), and consider whether it can be pinned
  mechanically the way the tier labels and the command name already are.

## D3 — brownfield mapping chosen for a repository grugops itself created

- **Found during:** plan 27-17, the SPAWN-03 runtime observation. Raised by the observer.
- **What was observed:** asked to `audit current architecture`, the coordinator classified the
  request as `brownfield-bootstrap` and routed to `grugops-brownfield-mapper` — even though
  `cli-chess-example` was scaffolded *by grugops* and carries its own `plans/`, `memory-bank/` and
  `.grugops/` state plane, i.e. the factory's own record of what it built.
- **Impact:** not incorrect — brownfield mapping over a known repo still produces a valid map — but
  it is wasted work and it discards state grugops already holds. A repository carrying a populated
  grugops state plane is not an unknown repo; treating it as one re-derives what the board, the
  notes and the traceability trail already record.
- **Why not fixed here:** out of scope for phase 27 (spawn correctness and kit-set authority) and it
  is a routing/product decision, not a correctness defect.
- **Suggested direction:** give the coordinator a cheap, mechanical signal for "this repo is already
  a grugops repo" — the presence and non-emptiness of the state plane — and a documented third path
  between greenfield scaffolding and brownfield survey: **re-map from own state**, falling back to
  brownfield only where the state plane is absent, stale or contradicted by the tree. The detection
  must be a real check, not an inference from a filename, and the fallback must stay loud.

## From gap-closure round 4 planning (2026-07-31)

- **No shared test-helper module between `install/install.test.ts` and `scripts/kit-model.test.ts`.**
  Plans 27-31 and 27-32 need a symlink-DAG fixture builder on BOTH sides of the "one predicate, two
  sites, no import" boundary, so `makeSymlinkDag` is written twice, once per test file. That is a
  hand-synced duplicate helper — the same shape as the derivation pair D-28 collapsed and the marker
  pair D-37 collapses — and it will drift the same way.
  - **Why not fixed in round 4:** creating a shared test-helper module inside `install/` would couple
    the installer's tests to the scripts layer, which is exactly what D-18/D-28 keep decoupled; a
    third location would need its own home and its own freshness story. Deciding where it lives is a
    layout decision, not a defect fix, and round 4 is scoped to the eight round-3 findings.
  - **Suggested direction:** if a third consumer ever needs the same fixture, that is the forcing
    signal — collapse it then, and assert the two call sites produce byte-identical trees rather than
    promising they do.
  - **Not a reason to skip the round-4 cases:** two copies of a FIXTURE builder are a maintenance
    smell; two copies of a PREDICATE were the CR-02/CR-03 defect. The distinction is recorded here so
    a later reader does not conflate them.

## From 27-22 (WR-02)

- `scripts/kit-model.ts` `walkFilesRelative()` follows symlinks (deliberately) but keeps no
  visited-realpath set, so a symlink CYCLE under `.claude/agents` or `.claude/skills` recurses
  without bound — the same hang 27-22 closed in `install/install.ts` `srcNestedAdapterFiles()`.
  Every guard and oracle built on `listAgentAdapters` / `listSkillAdapters` inherits it.
  Not fixed in 27-22: the plan scoped `files_modified` to the installer surface, and editing the
  shared authority mid-phase would put 27-18 / 27-19 / 27-20 / 27-23 at risk.
  Reproduction: `ln -s .. .claude/agents/loop` then call `listAgentAdapters(root)`.

## From 27-30 (IN-02 / D-34) — found by adversarial probe, NOT by the plan

- **A UTF-8 BOM before the opening delimiter reaches the legitimately-keyless SUCCESS arm.**
  `parseFrontmatter` skips blank lines, then tests the directive pattern and the `---` delimiter
  against the raw line. A BOM (`EF BB BF`) sits at position 0, so `"\uFEFF---"` is neither a
  directive nor the delimiter, and the document takes the "NO block at all" arm:
  `{ ok: true, value: new Map() }` — no keys, no grant, no finding.
  - **Measured, both directions, against the committed `scripts/frontmatter.js`:**
    - `"\uFEFF%TAG !e! t\n---\nname: x\ntools: Read, Agent(o)\n---\n"` → `{"ok":true,"value":false}`
    - `"\uFEFF---\nname: x\ntools: Read, Agent(o)\n---\n"` → `{"ok":true,"value":false}`
    The second is the load-bearing one: it needs **no directive at all**. A BOM alone reaches the
    silent-success arm, so this is NOT a gap in D-34 — it sits one step in front of it.
  - **Confirmed PRE-EXISTING.** Byte-identical behavior against `5d040d4:scripts/frontmatter.js`
    (wave-1 HEAD, before this plan's first commit). Plan 27-30 neither introduced nor widened it.
  - **Live exposure today: zero.** No tracked `.md` file in the repo begins with a BOM (checked all
    tracked markdown via `head -c3 | od`). The generator does not emit one.
  - **Why not fixed in round 4:** adding a BOM arm is a DECISION, not a defect fix, and it carries its
    own `UNKNOWN - verify` of exactly the D-34 kind — whether Claude Code's own reader strips a BOM
    before looking for `---` decides whether such a file is inert or rogue, and that was not
    confirmed. There are two defensible answers (strip the BOM and parse normally, which is what most
    readers do and what a `\uFEFF`-tolerant loader would see; or refuse it by name as an undecodable
    prologue like D-34 does) and choosing between them is a planning decision with a reversibility
    note, not something an executor should settle mid-wave. Round 4 is scoped to the eight round-3
    findings and this is a ninth.
  - **Suggested direction for round 5:** prefer STRIPPING a single leading BOM before the directive
    and delimiter tests, then letting the existing three-outcome partition decide — that is the
    structural answer (normalize the input once, at the same place CRLF is already normalized) rather
    than a fourth refusal arm. Note that `text.replace(/\r\n/g, "\n")` already establishes the
    precedent of input normalization at exactly that point.
