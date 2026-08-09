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

## From 27-47 (D-54 / CR-01, round 9) — found by running the suite, NOT by the plan

- **The flattener applies the D-30 escape refusal to text libyaml never reads as a double-quoted
  scalar.** `.planning/phases/27-spawn-correctness-kit-set-authority/27-VERIFICATION.md` carried the
  two characters `\` `n` inside a `reason: >` FOLDED BLOCK SCALAR nested under `gaps:`. A folded
  block scalar performs no escape processing, so libyaml returns them literally and ACCEPTS the
  document; the module REFUSED the whole file with
  `carries the backslash sequence \n inside a double-quoted scalar`.
  - **Measured, both builds, on a `git archive HEAD` mirror of `62b8b53`:**
    pre-fix build arm `refuse`, post-fix build arm `refuse`, same reason — so this is **PRE-EXISTING
    and not caused by D-54**. The `27-47` repository-wide value map independently reports
    `new refusals: 0` over a run-time-derived corpus of 1149 tracked markdown files.
  - **Loader column:** `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) ACCEPTS the
    document and returns the backslash and the `n` literally. So the refusal is a FALSE RED on
    documentation a real loader accepts — the direction D-34 names as the worse of the two.
  - **Why it happens:** `flattenBlock` has no nesting. It collapses every continuation line of
    `gaps:` into ONE string, so `"` characters belonging to several different nested scalars are read
    as one double-quoted region and `unquoteChecked` applies D-30's allowlist to text that was never
    a double-quoted scalar.
  - **Why not fixed in 27-47:** the module-side cure is nesting awareness in the flattener, i.e. a
    YAML engine — which D-54 rejects by name, and which is a different root cause in a different
    function from CR-01. Folding it in would hide which edit closed which family. `27-47` unblocked
    its own gate by rewriting the ONE offending line into the `/` line-separator notation the rest of
    this phase already uses (no meaning changed), and records the defect here so the notation change
    does not stand in for the fix. **The D-49 false-red control was RED at HEAD for four commits
    (`c28f415` .. `62b8b53`) and nobody noticed** — which is itself the WR-01/WR-02 harness-integrity
    class `27-49` owns.
  - **Suggested direction:** decide explicitly whether the flattener refuses less (nesting), or the
    D-49 control's claim is scoped — "every tracked markdown file parses" is currently a claim over
    `.planning/` prose that exceeds this module's declared scope. Either is defensible; a suite that
    is red at HEAD is not.

- **`NODE_PROPERTY_AT_NODE_START`'s verbatim alternative admits whitespace — left wide, deliberately.**
  `<[^>]*>` admits `!<x #y>`, which YAML 1.2 § 5.6 does not define (`ns-uri-char` excludes
  whitespace) and libyaml rejects. Narrowing to `<[^\s>]*>` was tried and REVERTED: over the same
  148,656-cell single-line corpus the wide form moves 4 cells (all in the LENGTHEN direction, all on
  that one loader-rejected input) while the narrow form moves 24, of which 20 are positions the
  pre-edit build ALREADY reached and every one moves in the SHORTEN direction — deleting text at a
  `#`, which is this module's founding failure. The measurement is recorded in the constant's own doc
  block. A later round that wants the narrowing must first close the shorten direction it opens.

## From 27-47 — OPEN LIVE BYPASS found by the executor's own red team, on the POST-FIX build

- **A BLOCK-SCALAR HEADER IS RECOGNISED AT EXACTLY ONE OF THE PLACES YAML ALLOWS ONE.** This is the
  same failure class a tenth time, and it is the mirror of ledger entry ten's own standing question
  applied to a predicate's APPLICATION SET rather than to its conditions: `BLOCK_INDICATOR` is tested
  only against a TOP-LEVEL KEY LINE's value (`flattenBlock`'s baseline branch). A `|` or `>` header
  appearing as a NESTED mapping's value, as a SEQUENCE ITEM, or deeper is never recognised, so
  `cur.block` stays false and the block scalar's LITERAL content is passed through `stripComment` and
  through the item boundary — where a leading `#` is stripped as a comment and a leading `-` invents
  an item.
  - **Measured against the REBUILT (post-27-47) `scripts/frontmatter.js`,** with
    `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) as the loader column. Every
    row is a document the loader ACCEPTS with the grant plainly in the loaded value:

    | # | region under `tools:` | module | libyaml |
    |---|---|---|---|
    | G  | `  nested: >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}`, `nested: >- Read,` | `{"nested"=>"Read, # x, TOKEN"}` |
    | G2 | `  - >-` / `    Read,` / `    # x, TOKEN`       | `{ok:true,value:false}`, `>-, Read,,`      | `["Read, # x, TOKEN"]` |
    | g1 | `  nested: >2-` (indentation indicator)          | `{ok:true,value:false}` | `{"nested"=>"Read, # x, TOKEN"}` |
    | g2 | `  nested: \|+` (keep chomping)                   | `{ok:true,value:false}` | `{"nested"=>"Read,\n# x, TOKEN"}` |
    | g3 | `  nested: > # h` (header carries a comment)     | `{ok:true,value:false}` | `{"nested"=>"Read, # x, TOKEN"}` |
    | g4 | the same under `allowed-tools:`                  | `{ok:true,value:false}` | `{"nested"=>"Read, # x, TOKEN"}` |
    | g5 | `  nested: \|` / `    Agent(alpha, ga` / `    - mma)` | `ok:true`, names `["alpha","ga","mma"]` | `"Agent(alpha, ga\n- mma)"` — **`mma` is INVENTED and `ga` TRUNCATED** |

  - **PRE-EXISTING, byte-identical on both builds.** The same seven rows return the same verdicts
    against the committed `scripts/frontmatter.js` on a `git archive` mirror of `62b8b53`. D-54
    neither opened nor closed this family.
  - **REPRODUCED END TO END AT THE GATE**, the standard this phase set. Planted on BOTH distribution
    twins of the non-coordinator skill `plan` (`skills/plan/SKILL.md` and
    `.claude/skills/grugops-plan/SKILL.md`), on a hermetic `git archive` mirror of the post-fix
    commit `6891699`:

    ```
    CONTROL one-line grant                    :: exit=1 :: 1 CHECK(S) FAILED (WR-05 coordinator-spawn-grant violation)
    FAMILY A/B/C/F (closed by 27-47)          :: exit=1 :: 1 CHECK(S) FAILED (WR-05 coordinator-spawn-grant violation)
    FAMILY G  nested folded block scalar      :: exit=0 :: ALL CHECKS PASSED
    FAMILY G2 block scalar as a sequence item :: exit=0 :: ALL CHECKS PASSED
    ```

  - **Why not fixed in 27-47.** It is a DIFFERENT root cause in a DIFFERENT predicate's application
    set, and D-56's own reasoning applies: folding it in would hide which edit closed which family.
    A correct fix needs block-scalar INDENTATION tracking to know where the nested scalar ends —
    genuine nesting in the flattener, the YAML-engine direction D-54 rejects by name — and a hasty
    heuristic here is precisely what has failed for nine consecutive rounds. It needs its own plan,
    its own RED/GREEN corpus, its own repository-wide value map and its own gate transcripts.
  - **The false-red cost of the obvious alternative, MEASURED so round 10 starts from data.** The
    module's founding rule would route content it cannot account for to the FAILURE arm, i.e. REFUSE
    a nested block-scalar header. Over a run-time-derived corpus of 1149 tracked markdown files, 570
    carry a locatable frontmatter block and **4** already carry a nested block-scalar header on a
    continuation line — `.planning/milestones/v1.2-MILESTONE-AUDIT.md` (`evidence: >`),
    `.planning/milestones/v1.2-phases/15-typescript-tooling-migration/15-VERIFICATION.md` (`note: >`),
    `.planning/milestones/v2.0-phases/25-governance-on-a-dial/25-VERIFICATION.md` (`reason: >`) and
    `.planning/phases/27-spawn-correctness-kit-set-authority/27-VERIFICATION.md` (`reason: >`). None
    is an adapter, a skill or a packaging template; all four are documents libyaml accepts. So a
    blanket refusal is NOT free, and choosing between "refuse" and "recognise" is a planning decision
    with a reversibility note — not something an executor settles mid-plan.
  - **What was probed and did NOT reproduce**, so round 10 does not re-walk it: the explicit key's
    VALUE position, a mapping value on its own line, a sequence item's mapping with the value on the
    next line, a tab after the mapping separator, an explicit key whose value is a nested mapping, and
    a CRLF spelling of family A — all six return the GRANT arm and agree with the loader. A flow
    sequence opened inside a block mapping value (`nested: [Read,` / `  # x, TOKEN]`) is REJECTED by
    the loader, and the module is silent there — the safe direction, no value to disagree with.
