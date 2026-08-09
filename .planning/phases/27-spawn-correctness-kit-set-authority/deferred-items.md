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

## From 27-48 (D-55 / CR-02, round 9) — the 27-47 family G/G2 bypass RE-MEASURED, still OPEN

- **`27-48` neither opened nor closed the nested-block-scalar family, and that is measured rather
  than assumed.** Re-run against the rebuilt `scripts/frontmatter.js`, with the pre-27-48 committed
  build (`89705ba`) as the control:

  | row | pre-27-48 | post-27-48 |
  |---|---|---|
  | G  `  nested: >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}` | `{ok:true,value:false}` — **STILL OPEN** |
  | G2 `  - >-` / `    Read,` / `    # x, TOKEN`       | `{ok:true,value:false}` | `{ok:true,value:false}` — **STILL OPEN** |
  | g5 `  nested: \|` / `    Agent(alpha, ga` / `    - mma)` | names `["alpha","ga","mma"]` | names `["alpha","ga - mma"]` |

  The GRANT-HIDING half of the family is untouched: `BLOCK_INDICATOR` is still tested at exactly one
  of the places YAML allows a block-scalar header, so a nested `|`/`>` scalar's literal content still
  reaches `stripComment` and a leading `#` still hides a token. Round 10 owns it, with the false-red
  cost of the obvious alternative already quantified in the `27-47` entry above.

  The INVENTED-NAME half of row g5 closes as a side effect and is recorded so the next reader does
  not re-derive it: the nested header is not recognised, so its content takes the ordinary
  continuation path, which D-55 taught to FOLD. The module now flattens it to
  `Agent(alpha, ga - mma)` where libyaml expresses `Agent(alpha, ga\n- mma)` — a SPACE where the
  loader has a line break, so the two name sets are `["alpha","ga - mma"]` against
  `["alpha","ga\n- mma"]`. **Still not equal**, and it is only not a third invented name because the
  header is being mis-read in the first place. Closing family G properly is what makes this row
  correct rather than merely less wrong.

## From 27-48 — an ACCOUNTED, NON-DEFECT divergence the repository-wide value map surfaced

- **Eleven of 649 loader-accepted `(file, key)` cells whose flattened value moved disagree with the
  loader's content signature on BOTH builds.** `PRE signature == loader 638 / POST 638 / both 638 /
  worse 0` over a run-time-derived corpus of 1150 tracked markdown files. The eleven are IDENTICAL on
  both builds, so `27-48` neither created nor closed them, and none is a `tools` / `allowed-tools` /
  `coordinator` / `name` key: `files whose GRANT verdict moved 0`, `files whose NAME SET moved 0`,
  `guard-read keys that moved 0`.
  - **Why not chased here:** they are the flattener's declared token-presence contract meeting deeply
    nested `.planning/` metadata (a value map is not a YAML tree), which is the same scope question
    the `27-47` entry above already raises — "the D-49 control's claim over `.planning/` prose exceeds
    this module's declared scope". Deciding that scope is a planning decision.
  - **Suggested direction:** settle the scope question ONCE, with the `27-47` flattener-nesting entry,
    rather than twice from two different symptoms.

## From 27-49 (D-56 / WR-01, round 9) — the family G/G2 bypass RE-MEASURED on this build, STILL OPEN, and now with its harness scope named

- **`27-49` touched only `scripts/frontmatter.test.ts`, so it neither opened nor closed anything. The
  family G/G2 bypass is re-measured here rather than assumed unchanged**, against the committed
  `scripts/frontmatter.js` at `d56aa7a`, with `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 /
  libyaml 0.2.1) as the loader column:

  | row | module | loader |
  |---|---|---|
  | G  `tools:` / `  nested: >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}` — **STILL OPEN** | `ACCEPT {"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` |
  | G2 `tools:` / `  - >-` / `    Read,` / `    # x, TOKEN`       | `{ok:true,value:false}` — **STILL OPEN** | `ACCEPT ["Read, # x, Agent(grugops-orchestrator)"]` |

- **AND THE NEW EXPRESSIBILITY FLOOR DOES NOT COVER IT, WHICH IS A PROPERTY OF THE FLOOR AND IS
  RECORDED RATHER THAN LEFT TO BE DISCOVERED.** `WR-01 the expressibility floor` derives its family
  list from the LEDGER in `scripts/frontmatter.ts`'s header, and the ledger records failures the
  module has CLOSED, each with its remedy. An OPEN bypass has no ledger entry, so it is outside the
  floor's derived set by construction. Family G/G2 is also not expressible by the D-52 generator's
  key-line axis, which carries the block indicators only at the TOP level.
  - **Why it was NOT added to the corpus here:** a corpus shape for a LIVE silent-no-grant would put
    the differential's never-exemptible direction into failure, and closing family G is round 10's
    work under a different root cause in a different function (`BLOCK_INDICATOR`'s single application
    point). `27-49`'s own prohibitions state that it adds corpus and assertions and decides nothing
    about whether a document grants. Adding the shape and exempting it would be worse than both.
  - **Suggested direction for round 10:** close family G first, then add the nested-block-scalar
    header to `AXIS_KEY_LINE` in the SAME plan, so the corpus grows with the fix rather than after it.

- **A residual this plan's own WR-04 disposition creates, named so it is not rediscovered as a
  finding.** Deleting the per-exemption `bound` gave up one narrow detection: the bound DID fire when
  a rule was edited to stop being a function of its declared axis flags and thereby matched more
  cells than its own product (measured — E1 rewritten to `() => true` takes matched to 565 against a
  bound of 48). The replacement corpus-level floor fires only past roughly half the loader-accepted
  corpus, so a decoupling that widens a rule to between those two figures is no longer caught there.
  - **Why not closed by restoring the bound:** a bound computed from the exemption's own inputs is a
    predicate acting as its own oracle, which is the shape this module deletes on sight, and the plan
    forbids keeping the old bound beside a new one.
  - **Suggested direction:** if round 10 wants it back, derive the per-rule ceiling from a quantity
    the rule does not read — for example the count of loader-accepted cells whose DISAGREEMENT the
    rule is stated about — rather than from the axis flags the rule itself matches on.

## From 27-50 (D-56 items 9 and 10, round 9) — TWO RECORDED DECISIONS, each with its reason

**These are DECISIONS, not defects, and neither is a silent drop.** They are written here rather
than only in a plan summary because a retirement or a deferral that lives only in a summary is
indistinguishable, to a later reader, from an item that was forgotten. Both answer a question the
round-8 verification record (`27-VERIFICATION.md` § `human_verification`) left explicitly open.

### DECISION 1 — the `27-43` acceptance criterion is RETIRED

- **The criterion, quoted verbatim** from `27-VERIFICATION.md:73`:

  > "`scripts/validate-agent-factory.ts` goes from exit 0 to a named non-zero failure on the
  > non-coordinator adapter surface"

  Its original form, from `27-43-PLAN.md:493`:

  > "A non-coordinator role-agent adapter carrying the family (a) shape takes both the foundation
  > gate and the validator from exit 0 to a named non-zero failure."

- **Status: RETIRED.** Carried open and owned by NO plan across `27-43` → `27-46`, with a consistent
  "retire it" recommendation in all four round-8 summaries. **User decision, ratified in the round-9
  decision block as D-56 item 9**, recorded here on **2026-08-09** by plan `27-50`.

- **REASON, PART ONE — MEASURED AT EXECUTION TIME, NOT ASSUMED.** The structure validator carries
  none of the spawn-grant vocabulary. Counted over `scripts/validate-agent-factory.ts` with comment
  lines excluded, at the time this record was written:

  ```
  node -e 'const fs=require("fs");
    const code=fs.readFileSync("scripts/validate-agent-factory.ts","utf8")
      .split("\n").filter(l=>!l.trimStart().startsWith("//")).join("\n");
    for (const t of ["spawn","Spawn","SPAWN","Agent(","frontmatter","Frontmatter",
                     "parseFrontmatter","hasSpawnGrant","grantedAgentNames",
                     "keysHaveSpawnGrant","keysGrantedAgentNames","WR-05","wr05",
                     "guard_wr05","coordinator"])
      console.log((code.split(t).length-1)+"  "+t);'
  ```

  | term | occurrences |
  |---|---|
  | `spawn` / `Spawn` / `SPAWN` | 0 / 0 / 0 |
  | `Agent(` | 0 |
  | `frontmatter` / `Frontmatter` | 0 / 0 |
  | `parseFrontmatter` | 0 |
  | `hasSpawnGrant` | 0 |
  | `grantedAgentNames` | 0 |
  | `keysHaveSpawnGrant` / `keysGrantedAgentNames` | 0 / 0 |
  | `WR-05` / `wr05` / `guard_wr05` | 0 / 0 / 0 |
  | `coordinator` | 0 |
  | **TOTAL over the 15-term vocabulary** | **0** |

  406 lines of code (of 584 lines in the file). Its ONLY in-repo import is `./kit-model.js` — it
  does not import `./frontmatter.js` at all, so it has no way to read a document's frontmatter, let
  alone adjudicate a grant in one. It is a **structure** validator: required files exist, role and
  workflow sections are present, the config parses, board and ticket statuses match, traceability is
  complete, packaging is present. It is not, and has never been, a spawn-grant surface.

- **REASON, PART TWO — SATISFYING IT WOULD BUILD THE SHAPE THIS PHASE HAS SPENT NINE ROUNDS
  DELETING.** The only way to make the criterion true is to add a spawn-grant predicate to a SECOND
  file. `guard_wr05` in `scripts/check-foundation-guards.ts` already holds that predicate, over the
  derived 33-member `spawnGrantScan()` composition. A second, necessarily weaker copy in a validator
  that cannot even parse frontmatter is a weaker duplicate that still votes — which this module's
  own record calls "worse than none" at four separate sites (the fence authority, the escape
  allowlist, D-44's deleted two-arm helper, D-51's collapsed node-start split). Nine rounds of this
  phase were spent deleting exactly that shape.

- **`scripts/validate-agent-factory.ts` IS DELIBERATELY UNTOUCHED by plan `27-50`.** It is absent
  from the plan's `files_modified`, and `git diff --name-only` for the plan's commits does not list
  it. The retirement is effected by this record, never by code.

- **What is NOT retired.** The foundation gate's half of the original `27-43` criterion stands and
  is exercised every round: a non-coordinator adapter or skill carrying a spawn grant takes
  `node scripts/check-foundation-guards.js` from exit 0 to exit 1 naming
  `WR-05 coordinator-spawn-grant violation`. Rounds `27-47` and `27-48` both re-reproduced that
  transcript. Only the VALIDATOR half is retired.

### DECISION 2 — SPAWN-03's live-platform capture stays DEFERRED to Phase 33 (GAP-D1)

- **The item, quoted verbatim** from `27-VERIFICATION.md:70-72`:

  > **test:** "Start a real Claude Code session with `claude --agent grugops-orchestrator` (or the
  > equivalent main-thread wiring) on this repository and observe whether the Orchestrator's
  > `Agent(<allowlist>)` grant is actually runtime-enforced — i.e., that it can spawn a role
  > subagent and that a role subagent cannot spawn a further subagent."
  >
  > **expected:** "The coordinator, running as the main-thread agent, successfully invokes the Agent
  > tool to delegate to a named role subagent; a role subagent invoked this way has no Agent tool
  > available to it."
  >
  > **why_human:** "This is a live-platform runtime behavior claim … that no static grep or gate can
  > confirm; the phase's own SUMMARYs mark it `UNKNOWN - verify` and defer the capture to Phase 33 /
  > GAP-D1."

- **Status: DEFERRED, and its status stays `UNKNOWN - verify`.** **User decision, ratified in the
  round-9 decision block as D-56 item 10**, recorded here on **2026-08-09** by plan `27-50`.

- **OWNER, read from `.planning/ROADMAP.md` rather than from memory:**

  | field | value | where it is stated |
  |---|---|---|
  | owning phase | **Phase 33: Live Capture & Windows Portability** | `ROADMAP.md:431` |
  | standing obligation | **GAP-D1** — "one captured live dual-path run → flip A3/DOG-02 + the coupled `examples/03-ticket-to-pr.md` edit" | `ROADMAP.md:106`, standing-obligations table row 1 |
  | requirement id | **CAP-01** (the discharge of GAP-D1); the capture itself is **CAP-03** | `ROADMAP.md:435`, success criteria 1 and 2 |
  | phase requirements | CAP-01, CAP-02, CAP-03 | `ROADMAP.md:435` |

- **REASON — NO STATIC GATE CAN PRODUCE IT, AND INVENTING ONE WOULD BE FABRICATION.** The claim is
  about what the Claude Code runtime does with an `Agent(<allowlist>)` grant on the main-thread path
  and on the subagent path. Every artifact this repository can inspect — the adapter files, the
  packaging templates, the platform's published documentation — is evidence about what was WRITTEN,
  never about what the platform DOES. `CLAUDE.md`'s constraints name this by name: *"Unknown commands
  are marked `UNKNOWN - verify`; never fake a passing gate, a test result, or a citation — the trace
  is the proof."* A static check standing in for a live capture would be a faked gate, and
  ROADMAP Phase 33's own success criterion 2 already states that **"a loud skip is never accepted as
  the capture."**

- **THIS IS NOT A SILENT DROP.** The item is open, owned, dated and reasoned. Phase 27 closes with
  Success Criterion 4's SPAWN-03 half explicitly unmet rather than quietly recorded as met, and this
  entry is the durable record of why — carried in the phase's own deferred-items artifact so it
  survives a milestone archive move rather than living only in a plan summary that scrolls out of
  view.

## From 27-50 (D-56 items 4-8, round 9) — the family G/G2 bypass RE-MEASURED, STILL OPEN

- **`27-50` touched `scripts/frontmatter.ts` (the `LeadingRun` residue arm and the leading-residue
  refusal's interpolation) and `scripts/kit-model.ts` (a constant's call sites and one filter
  domain), so it is re-measured here rather than assumed unchanged.** Against the rebuilt
  `scripts/frontmatter.js`, with the pre-`27-50` committed build (`b222de9`) as the control and
  `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) as the loader column:

  | row | region under `tools:` | pre-`27-50` (`b222de9`) | post-`27-50` | loader |
  |---|---|---|---|---|
  | G  | `  nested: >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}`, names `[]` | `{ok:true,value:false}`, names `[]` — **STILL OPEN** | `ACCEPT {"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` |
  | G2 | `  - >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}`, names `[]` | `{ok:true,value:false}`, names `[]` — **STILL OPEN** | `ACCEPT ["Read, # x, Agent(grugops-orchestrator)"]` |

  Byte-identical on both builds. **`27-50` neither opened nor closed this family**, and nothing in
  `27-50` may be read as evidence that the module is bypass-free. `BLOCK_INDICATOR` is still tested
  at exactly ONE of the places YAML allows a block-scalar header — `flattenBlock`'s top-level key
  line — so a nested `|` / `>` scalar's literal content still reaches `stripComment` and a leading
  `#` still hides a live spawn grant on the SUCCESS arm.

- **The WR-05 fix is orthogonal to it, and that is stated so the two are not conflated.** WR-05
  changes which code point a REFUSAL names; family G/G2 is a document that never refuses at all. A
  refusal's wording cannot reach a document that takes the silent no-grant arm.

- **Round 10 owns it.** The false-red cost of the obvious alternative is already quantified in the
  `27-47` entry above (4 of 570 frontmatter-bearing tracked markdown files carry a nested
  block-scalar header today, none of them an adapter, a skill or a packaging template), and the
  suggested direction from `27-49` stands: **close family G first, then add the nested-block-scalar
  header to `AXIS_KEY_LINE` in the SAME plan**, so the corpus grows with the fix rather than after
  it.

## From 27-50 — found by the executor's own red team, AFTER all three tasks were green

### R1 — the leading clause calls an INDENTATION run "residue", and names a code point inside the declared class

- **Measured over the 98,596-cell derived delimiter corpus, on the POST-`27-50` build**, modelling
  the document-level BOM strip the classifier's input passes through:

  ```
  cells carrying a leading clause, RESIDUE run    : 50868
    naming anything but the first outside code point (must be 0): 0
  cells carrying a leading clause, INDENTATION run:  1570
    the labels they name: ["U+0009","U+0020"]
  ```

  So WR-05's invariant holds totally on the arm it is about. The **1,570 indentation cells** are the
  residual: at the OPENING position an indented `---` still refuses with
  *"its leading **residue** renders no glyph of its own and begins with U+0020"*, and U+0020 is
  inside `DELIMITER_WS_CHAR`.

- **This is NOT a WR-05 recurrence, and the distinction is the reason it is recorded rather than
  fixed.** On the indentation arm the fault is POSITIONAL — the line begins with whitespace where
  the payload should begin — and the code point named is exactly the byte a reader must delete. The
  diagnosis is actionable and points at the right character. What is wrong is the **noun**: D-50
  declares three run kinds (`none`, `indentation`, `residue`) and this clause applies the word
  "residue" to a run the module itself labels `indentation`.

- **Why not fixed in `27-50`:** the plan's acceptance criteria require every OTHER delimiter
  refusal's wording to be byte-unchanged, proven over that corpus, and the `D-44 composite anchors`
  case pins the ` ----` row's leading label. Splitting the clause into a residue arm and an
  indentation arm changes that wording — a real change to a shipped refusal, and a DECISION about
  diagnosis text rather than a defect fix. Folding it into a plan whose whole proof is
  "7,536 reasons moved and every one of them is the residue shape" would have destroyed that proof.

- **Suggested direction:** if a later round splits it, say *"the delimiter is indented by U+0020, so
  it does not begin where the line begins"* on the indentation arm and keep the residue wording on
  the residue arm — and re-take the corpus comparison with the changed-reason count stated for BOTH
  shapes, so the two moves stay separable.

### R2 — a MEASURED CORRECTION to the round-8 IN-04 finding's stated mechanism

- **The review said** the fixture would *"silently start pinning a different refusal (or a
  successful parse) while staying green"* the day a fenced example gained a column-0 `---` or a
  column-0 key line. **Measured out of suite against the committed generator**, planting each shape
  inside `qe-e2e.md`'s fenced example and running BOTH fixtures:

  | plant inside the fenced example | OLD fixture (delimiters only) | NEW fixture (blocks WITH contents) |
  |---|---|---|
  | `---` | **RED, loudly** — 1 delimiter survives, the region closes early, diagnosis becomes `cannot read \`Break the feature — …\` as a frontmatter key line`; the case's own `is never closed by a \`---\` delimiter` needle FAILS | unterminated diagnosis, case green |
  | `...` | **RED, loudly** — same shape | unterminated diagnosis, case green |
  | `tools: Read, Agent(grugops-orchestrator)` | **GREEN, silently** — 0 delimiters survive, same unterminated diagnosis; the case passes over a role file whose frontmatter region now carries a **live spawn grant** it never looks at | grant removed with the block, case green |
  | `capabilities: read` | **GREEN, silently** — same | removed with the block, case green |

- **So the finding's SUBSTANCE holds and its stated MECHANISM does not.** The delimiter shapes make
  the old fixture fail LOUDLY, not silently. The genuinely silent shape is a column-0 **key line**,
  and its worst form is the one measured above: the fixture would have written a live
  `Agent(grugops-orchestrator)` into the frontmatter region of a non-coordinator role file, inside a
  suite that exists to detect exactly that, with every assertion green. The premise assertion
  `27-50` adds covers the delimiter shapes by construction; the KEY-LINE shape is covered because
  the fenced block is now removed with its contents, so no fenced line reaches the region at all.
- **The correction is recorded rather than left standing** because "this case would have silently
  drifted" was going to be repeated from the review into a summary, and the delimiter half of it is
  false. The executor's measurement governs.

### R3 — the red team's OWN oracle was defeated by not modelling its input, one round after that lesson was written down

- The first run of the corpus-wide WR-05 invariant reported **1,727 violations**, every one of them
  a line beginning with a BOM. They were not violations: `parseFrontmatter` strips ONE leading BOM
  at document position 0 (`scripts/frontmatter.ts:2229`), so at the OPENING position the classifier
  is handed a line the corpus row does not literally contain. The probe computed the expected label
  from the RAW row.
- **This is `27-47`'s own standing question — "ask what the predicate's INPUT is ASSEMBLED from" —
  landing on the red team's oracle instead of on the module.** Recorded because the near-miss was a
  false RED that could as easily have been a false GREEN: an oracle that models the wrong input is
  wrong in both directions, and this one was checked only because its answer was implausible.
- **Suggested direction:** any future corpus-wide oracle over this module should drive its expected
  value through the same normalization chain the parser applies (the BOM strip and the CRLF
  normalization at `frontmatter.ts:2229`), derived from the source rather than remembered.

## From 27-51 (round 10, 27-REVIEW § CR-01 + WR-01 + IN-02) — the CR-01 escape family CLOSED, family G/G2 RE-MEASURED and STILL OPEN

- **What `27-51` touched.** `scripts/frontmatter.ts` — one branch inside `stripComment`'s
  `else if (c === "'" && !dq)` arm — plus the rebuilt `scripts/frontmatter.js`,
  `scripts/frontmatter.test.ts` and `scripts/fixtures/frontmatter-singleline-pre-d54.json`. No other
  production source file was edited; no dependency was added; `package.json` is byte-unchanged.

- **CR-01, PRE and POST, with `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) as
  the loader column.** Every row is a document the loader ACCEPTS with `Agent(grugops-orchestrator)`
  plainly in the loaded value. PRE is the committed build at `d5c69e0` on a `git archive` mirror;
  POST is the rebuilt committed `.js`:

  | row | region under `tools:` | loader value | PRE (`d5c69e0`) | POST |
  |---|---|---|---|---|
  | A | `'Read'' s,` / `  # x, TOKEN'` | `"Read' s, # x, TOKEN"` | `{ok:true,value:false}`, names `[]` | `{ok:true,value:true}`, names `["grugops-orchestrator"]` |
  | B | `'Read''s,` / `  # x, TOKEN'` | `"Read's, # x, TOKEN"` | `{ok:true,value:false}`, names `[]` | `{ok:true,value:true}` |
  | C | `` / `  - 'Read'' s,` / `    # x, TOKEN'` | `["Read' s, # x, TOKEN"]` | `{ok:true,value:false}`, names `[]` | `{ok:true,value:true}` |
  | D | `['Read'' s,` / `  # x, TOKEN']` | `["Read' s, # x, TOKEN"]` | `{ok:true,value:false}`, names `[]` | `{ok:true,value:true}` |
  | F control (no `''`) | `'Read,` / `  # x, TOKEN'` | `"Read, # x, TOKEN"` | `{ok:true,value:true}` | `{ok:true,value:true}` — **byte-identical** |
  | `'a'''` control | — | `"a'"` | `{ok:true,value:false}` | `{ok:true,value:false}` — unmoved |
  | `''` control | — | `""` | `{ok:true,value:false}` | `{ok:true,value:false}` — unmoved |

  **At the gate**, on hermetic mirrors with the row planted on BOTH distribution twins of the
  non-coordinator `plan` skill (`skills/plan/SKILL.md` and `.claude/skills/grugops-plan/SKILL.md`),
  so the D-40 pair rule stays satisfied:

  ```
  PRE-FIX  unplanted   :: exit=0 :: ALL CHECKS PASSED
  PRE-FIX  row A       :: exit=0 :: ALL CHECKS PASSED      <-- the live bypass
  PRE-FIX  row F       :: exit=1 :: 1 CHECK(S) FAILED (WR-05)
  POST-FIX unplanted   :: exit=0 :: ALL CHECKS PASSED
  POST-FIX row A       :: exit=1 :: 1 CHECK(S) FAILED (WR-05 coordinator-spawn-grant violation)
  POST-FIX row F       :: exit=1 :: 1 CHECK(S) FAILED (WR-05)
  POST-FIX `'a'''`     :: exit=0 :: ALL CHECKS PASSED      <-- control unmoved
  POST-FIX `''`        :: exit=0 :: ALL CHECKS PASSED      <-- control unmoved
  ```

- **THE FAMILY G/G2 BYPASS RE-MEASURED AGAINST THIS BUILD, NOT ASSUMED UNCHANGED.** `27-51` edits the
  same file family G lives in, so it is measured rather than inherited:

  | row | region under `tools:` | module on THIS build | loader |
  |---|---|---|---|
  | G  | `  nested: >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}`, names `[]` — **STILL OPEN** | `ACCEPT "nested: Read, # x, TOKEN"` |
  | G2 | `  - >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}`, names `[]` — **STILL OPEN** | `ACCEPT ["Read, # x, TOKEN"]` |
  | g5 | `  nested: \|` / `    Agent(alpha, ga` / `    - mma)` | names `["alpha","ga - mma"]` | `["alpha","ga\n- mma"]` — **still not equal** |

  At the gate, on a hermetic mirror of the post-fix tree with the row planted on both distribution
  twins of the same non-coordinator skill:

  ```
  FAMILY G  nested folded block scalar      :: exit=0 :: ALL CHECKS PASSED   <-- STILL OPEN
  FAMILY G2 block scalar as a sequence item :: exit=0 :: ALL CHECKS PASSED   <-- STILL OPEN
  ```

  **`27-51` neither opened nor closed this family, and nothing in `27-51` may be read as evidence
  that the module is bypass-free.** `BLOCK_INDICATOR` is still tested at exactly ONE of the places
  YAML allows a block-scalar header. `27-52` owns it. The false-red cost of the obvious alternative
  is quantified in the `27-47` entry above and is unchanged.

- **THE HARNESS GAP THIS PLAN ALSO CLOSED, WITH ITS NUMBERS.** The D-52 differential's corpus opened a
  scalar mid-line nine times and spelled the DOUBLE quote every time, so CR-01's family was outside
  its shape space rather than untested. A quote-style axis and an in-scalar-escape axis, both DERIVED
  from the base shapes' own fields, take the key-line axis from 20 to 47 and the corpus from 960 to
  2256 cells (loader-accepted 565 -> 1285). Against a hermetic mirror of the pre-fix commit the SAME
  corpus (digest `7415d65727e61642`, printed by both runs) reports **180** cells in the
  never-exemptible `module=no-grant / loader=grant` direction and **90** name-set disagreements; the
  pre-change 960-cell corpus reported **0 of each** over the same live bypass. The non-vacuity floor
  is proven load-bearing: with both new axes collapsed it fails, naming `full 565 vs collapsed 565`.

### The two adversarial passes this plan ran, recorded whether or not they found anything

- **PASS (a) — *what does this predicate ENUMERATE that it must DERIVE?*** 20 probes over every
  remaining place `stripComment`'s character chain names a literal character: the double-quote escape
  arm (an escape at end-of-scalar, a dangling backslash), the comment condition (`#` after a comma,
  after a `[`, after a `:` with no space, after a tab), the flow-collection arms (a `]` at depth 0 —
  the underflow clamp), the node-property arm (a tag, a verbatim tag and an anchor standing in front
  of a single-quoted scalar carrying the escape), and the mapping separator's JSON-like route in
  BLOCK context. **0 unsafe.** The six refusals (`\` escapes, the three reference constructs, the
  no-space `:`) are D-30's declared refuse-by-default policy — the loud direction, never a hidden
  grant. The two block-context JSON-like-key probes are REJECTED by the loader, so the module's
  silence there agrees with a loader that has no value to grant from.

- **PASS (b) — *what is this predicate's INPUT ASSEMBLED from?*** 24 probes walking backwards from
  `hasSpawnGrant` through `grantedAgentNames`, the flush join, `unquoteChecked`, `flattenBlock`'s
  three seeding sites and `stripComment`: a `''` pair SPLIT by the line break, the second quote of a
  pair at offset 0 of a continuation, a value that merely LOOKS wrapped (`'a', 'b'`), an escape
  inside an enumerated name, an escape splitting the `Agent(` token, an open escape-carrying scalar
  reaching the block-sequence ITEM path (a `assertItemPathScalarClosed` throw would be a regression —
  none occurred), the `allowed-tools` spelling, and the eight UNION rows. **0 unsafe.**

- **THE UNION, run as its own set because splitting a predicate into arms demands testing their
  union (the round-8 lesson).** Eight documents that exercise the escape arm TOGETHER with an arm the
  fix did not touch — a nested block mapping's value, a block mapping inside a sequence item, a
  JSON-adjacent flow mapping, a block explicit key at continuation depth 3, a compact nested
  sequence, a flow mapping inside a flow sequence, both quote styles in one value, and a
  double-quote escape in the KEY beside a single-quote escape in the value. All eight are
  loader-ACCEPTED with the grant in the value and all eight now return the grant arm; three of them
  were planted at the gate on both distribution twins and each took it from exit 0 to exit 1. They
  ship as a committed case (`CR-01 round 10 UNION`).

### R1 — the red team's OWN oracle was defeated by not modelling its input, for the SECOND round running

- The first run of both passes reported **three** `module grants where the loader does not`
  divergences (`b4`, `b5`, `b23`). None was a module defect; all three were the probe's own oracle:
  - it read only the `tools` key, so a grant under `allowed-tools` read as a module invention;
  - it decided "the loader grants" with a substring test for ONE token spelling, while the module's
    predicate also grants on a BARE `Agent` — so `Agent'(x)` is a grant the substring missed.
- **This is `27-50`'s R3 entry happening again, in the same shape, one round later**, and it is
  recorded rather than quietly repaired. The fix is the one the D-52 harness already uses: DELEGATE
  the loader-side verdict to the module's own `keysHaveSpawnGrant` run over the LOADER'S flattened
  value, so the two sides differ only in whose value they read and never in how it was rendered.
  With the delegated oracle both passes report 0 unsafe over all 44 probes.
- **Suggested direction:** the delegation is written down in three places now (the D-52 differential,
  its named-region arm, and this plan's throwaway probe). A red team's oracle is a predicate like any
  other and should be built from the module's declared consumers rather than re-derived per session.

## From 27-52 (round 10, 27-REVIEW § family G/G2) — the nested block-scalar family CLOSED, and TWO further positions found by this plan's own red team

- **What `27-52` touched.** `scripts/frontmatter.ts` (a new `BLOCK_MAP_EXPLICIT` production beside
  `SEQ_ITEM`, a new `blockHeaderAt` recogniser that calls the existing `BLOCK_INDICATOR`, `KEY_LINE`
  and `BLOCK_MAP_EXPLICIT`, four new `Accumulator` fields and an `openBlock` helper called from the
  three header positions), the rebuilt `scripts/frontmatter.js`, `scripts/frontmatter.test.ts`, this
  ledger and `27-CONTEXT.md` (D-57). No other production source file; no dependency; `package.json`
  byte-unchanged.

### FAMILY G / G2 — **CLOSED**, with the gate transcripts that are the closure evidence

Loader column `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1). PRE is the
committed build at `bac7537` on a `git archive` mirror; POST is the rebuilt committed `.js`. Every
row is a document the loader ACCEPTS with `Agent(grugops-orchestrator)` plainly in the loaded value.

| row | region under `tools:` | PRE (`bac7537`) | POST | loader |
|---|---|---|---|---|
| G  | `  nested: >-` / `    Read,` / `    # x, TOKEN` | `no-grant`, names `[]` | **grant**, `["grugops-orchestrator"]` | `{"nested"=>"Read, # x, TOKEN"}` |
| G2 | `  - >-` / `    Read,` / `    # x, TOKEN` | `no-grant`, names `[]` | **grant** | `["Read, # x, TOKEN"]` |
| g1 | `  nested: >2-` (indentation indicator) | `no-grant` | **grant** | `{"nested"=>"Read, # x, TOKEN"}` |
| g2 | `  nested: \|+` (keep chomping) | `no-grant` | **grant** | `{"nested"=>"Read,\n# x, TOKEN\n"}` |
| g3 | `  nested: > # h` (header carries a comment) | `no-grant` | **grant** | `{"nested"=>"Read, # x, TOKEN\n"}` |
| g4 | the same under `allowed-tools:` | `no-grant` | **grant** | `{"nested"=>"Read, # x, TOKEN"}` |
| g5 | `  nested: \|` / `    Agent(alpha, ga` / `    - mma)` | names `["alpha","ga - mma"]` | **`refuse`** | `refuse` — **NAME SETS NOW EQUAL** |

Row g5 closes because the join is now derived from the indicator: YAML 1.2 § 8.1.2 (literal `|`)
PRESERVES a line break and § 8.1.3 (folded `>`) folds it to a space. The loader's value carries a
line break INSIDE the enumeration, which this module's own `ENUMERATION_LEGAL_CHARS` refuses — so
both sides refuse and the D-09 equality holds, instead of the module returning two names on the
success arm for a value the loader will not enumerate at all.

**Gate level, planted on BOTH distribution twins of the non-coordinator `plan` skill (D-40), hermetic
mirrors, `CHECK_ROOT` override.** The harness asserts the planted region is on disk AND that both
twins are NAMED in the failure — a red that is not the red under test is not evidence (see R1).

```
PRE-FIX  (git archive bac7537)
  unplanted                                :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2
  FAMILY G  nested mapping value           :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2   <-- the live bypass
  FAMILY G2 block-sequence item            :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2   <-- the live bypass
  FAMILY G3 header after a SIBLING map key :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2
  FAMILY G4 header in a seq item's map     :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2
  FAMILY G5 header two levels deep         :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2
  FAMILY G6 explicit mapping VALUE         :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2
  FAMILY G7 explicit mapping KEY           :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2
  UNION nested header + the '' escape      :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2
  CONTROL one-line grant                   :: exit=1 :: 1 CHECK(S) FAILED :: twins named 2/2
  CONTROL nested header, NO grant          :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2

POST-FIX (git ls-files mirror of the worktree)
  unplanted                                :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2
  every one of the eight family rows       :: exit=1 :: 1 CHECK(S) FAILED :: twins named 2/2   <-- CLOSED
  CONTROL one-line grant                   :: exit=1 :: 1 CHECK(S) FAILED :: twins named 2/2   <-- unmoved
  CONTROL nested header, NO grant          :: exit=0 :: ALL CHECKS PASSED :: twins named 0/2   <-- unmoved
```

### The D-52 corpus grew WITH the fix, and its NON-CIRCULARITY is measured

`AXIS_KEY_LINE_BASE` 20 -> 22 (the nested mapping value and the block-sequence item, both carrying
the header); derived `AXIS_KEY_LINE` 47 -> 49; cells 2258 -> 2354; loader-accepted 1285 -> 1381.
The exemption list is **byte-unchanged** — 2 rules, `E1=32` and `E2=52` matched before and after —
so nothing was exempted to make the new shapes pass.

The SAME corpus (digest `8948822e571be20f`, printed by both runs) against a hermetic mirror of the
pre-fix commit:

```
POST-FIX build : token-presence disagreements  78 | NAME-SET disagreements  0  -> PASSED
PRE-FIX  build : token-presence disagreements 102 | NAME-SET disagreements 24  -> FAILED
                 24 unexplained cells, EVERY ONE module=no-grant / loader=grant
```

**The corpus is proven able to see the family it was blind to for five consecutive plans.**

### The WR-01 expressibility floor's derived set GREW, and that is the mechanism working

`27-49` recorded that the floor derives its family list from the ledger in `scripts/frontmatter.ts`'s
header, that an OPEN bypass has no ledger row, and that family G was therefore outside the derived
set **by construction**. Closing the family earned it the eleventh ledger entry, which made the floor
DEMAND a corpus shape for it:

```
BEFORE : ledger family rows derived  9 | expressible 6 (family (a), family (b), A, B, C, F)      | outside 3 (d1, d2, d3)
AFTER  : ledger family rows derived 11 | expressible 8 (family (a), family (b), A, B, C, F, G, G2) | outside 3 (d1, d2, d3)
```

### The MEASURED false-red cost of D-57's option A: **0**

The four tracked documents the `27-47` entry names as already carrying a nested block-scalar header
were re-parsed against the post-fix build:

| document | key | PRE | POST |
|---|---|---|---|
| `.planning/milestones/v1.2-MILESTONE-AUDIT.md` | `evidence: >` | parses, `no-grant` | parses, `no-grant` — UNCHANGED |
| `.planning/milestones/v1.2-phases/15-typescript-tooling-migration/15-VERIFICATION.md` | `note: >` | parses, `no-grant` | parses, `no-grant` — UNCHANGED |
| `.planning/milestones/v2.0-phases/25-governance-on-a-dial/25-VERIFICATION.md` | `reason: >` | parses, `no-grant` | parses, `no-grant` — UNCHANGED |
| `.planning/phases/27-spawn-correctness-kit-set-authority/27-VERIFICATION.md` | `reason: >` | parses, `no-grant` | parses, `no-grant` — UNCHANGED |

**Option A predicted 0 false reds and measured 0.** Repository-wide, over a run-time-derived corpus
of 1158 tracked markdown files parsed by BOTH builds:

```
NEW refusals 0 | RECOVERED refusals 0 | GRANT verdict moved 0 | NAME SET moved 0
files whose value moved 4 | cells moved 5 | cells that got SHORTER 4
```

**The four shorter cells are adjudicated against the loader rather than reported as a length.** The
plan's prohibition is that no loader-ACCEPTED document newly returns a shorter value; the shortening
here is the block-scalar INDICATOR, which YAML says is not content, so the honest test is direction:

```
moved cells 5 :: TOWARD the loader 3 | AWAY from the loader 0 | loader-unconstrained 2
  15-VERIFICATION.md :: human_resolution  1021 -> 1019 (loader 1019)  TOWARD — now EQUAL to the loader
  15-VERIFICATION.md :: human_verification 2349 -> 2345 (loader 2345) TOWARD — now EQUAL to the loader
  27-VERIFICATION.md :: gaps               6038 -> 6017 (loader 6003) TOWARD
  v1.2-MILESTONE-AUDIT.md :: gaps          1133 -> 1133 (loader 1115) same length; PRE carried
    `evidence: > ` (bytes the loader never has), POST carries `evidence: B3` — which is what the
    loader carries. Reported by the crude substring metric as "unchanged distance"; adjudicated by
    hand and recorded here rather than left as a number.
  25-VERIFICATION.md :: gaps_history       8436 -> 8409  the loader REJECTS this region outright
    (`Psych::SyntaxError: mapping values are not allowed in this context`) on BOTH builds, same file
    text — so there is no loader value to move away from. Pre-existing; not caused by this plan.
```

### TWO FURTHER LIVE POSITIONS, found by this plan's OWN adversarial pass against its OWN post-fix build

**This is the finding this plan is proudest of and it must not be smoothed over.** The first build
closed families G and G2, all seven ledger rows went green, the gate flipped exit 0 -> exit 1 on both
twins, and the suite was 207/207. Asking pass (a)'s question — *which SET of positions does this
predicate apply to?* — against that FIXED build found the family still live at three more positions:

| position | first build | after |
|---|---|---|
| `tools:` / `  a: Read` / `  b: >-` (a SIBLING mapping key) | silent no-grant | grant |
| `tools:` / `  - k: v` / `    j: >-` (a sequence item's compact mapping) | silent no-grant | grant |
| `tools:` / `  ? k` / `  : >-` (the explicit mapping VALUE) | silent no-grant | grant |
| `tools:` / `  ? >-` / … / `  : v` (the explicit mapping KEY) | silent no-grant | grant |

The cause was the gate, not the recogniser: `startsNode` answers *"has THIS KEY's value node begun"*,
which is FALSE for every sibling entry of a nested collection. The remedy is DERIVED rather than
enumerated — a plain scalar cannot spell a mapping-VALUE indicator (YAML excludes `: ` from
`ns-plain-char`), so `key: <header>` and `: <header>` need only the carried scalar to be CLOSED,
while a bare `<header>` and `? <header>` — both of which a plain scalar CAN spell, measured:
`tools: see` / `  >-` loads as `"see >- q,"` and `tools: see` / `  ? >-` loads as `"see ? >- q,"` —
keep the full node-start gate. `BLOCK_MAP_EXPLICIT` was added beside `SEQ_ITEM` in the same shape,
so all FOUR of YAML's block-context node introductions (§ 8.2.1 `-`, § 8.2.2 `key:`, `?`, `:`) are
asked, and that set comes from the grammar rather than from the shapes a probe reported.

**Standing lesson for the next round:** a fix must be re-red-teamed against its OWN output. Closing a
family at one position and reopening it at the position immediately after is not a closure, and a
green suite over the newly-fixed build says nothing about it.

### The two adversarial passes, recorded whether or not they found anything

**PASS (a) — *which SET of positions does this predicate apply to?*** 23 probes enumerating the
positions YAML 1.2 gives a block scalar in block context: mapping value at depths 1-3, block-sequence
item, a later item, a sequence item's compact mapping value, a sibling key of that mapping, a sibling
key of a nested mapping, a sequence nested in a sequence, the explicit key's value, the explicit key
itself, immediately after another block scalar's content in both the mapping and the sequence
spelling, the literal/indentation-indicator/chomping/header-comment spellings at a nested position,
the `allowed-tools` key form, and the block scalar as the region's last and non-last key. **2 unsafe
on the first build (recorded above), 0 after.** 0 loader-rejected — every probe is a real document.

**PASS (b) — *what is this predicate's INPUT assembled from?*** 24 probes walking the value from the
header's recognition through `raw.trim()`, the BOM strip and CRLF normalisation, the fence strip, the
accumulator fold, the flush's `sawBlock` exemption, `unquoteChecked` and `grantedAgentNames`:
trailing whitespace after the header, a tab between key and header, CRLF throughout, tab-indented
block content, an indented `---` and `...` inside the block, a blank line inside the block, the two
UNION rows (a nested header whose content carries a single-quoted `''` escape and a double-quoted
`\"` escape), an escape OUTSIDE the block on the same key, a reference sigil and a dash inside block
content, a block item beside a plain item on one key, an enumeration split across a folded and a
literal break, a header as the region's last line, a header whose content never arrives, a
`coordinator` marker claimed through a nested block scalar, a header inside a fenced example, a
header at a deeper indent than its content, a duplicate `tools:` key, block content that is only a
comment line, a header under a non-tools key, and a header inside an open flow collection.
**0 unsafe.** 1 module refusal (the fenced example, whose region the loader also rejects) and 4
loader-rejected probes where the module has no value to disagree with.

**THE UNION (the round-8 lesson).** A nested block-scalar header whose content carries wave 1's
`AXIS_ESCAPE_IN_SCALAR` — the `''` escape inside a single-quoted scalar — is probed in both passes,
ships as a committed row of `D-57 family G/G2`, and was planted at the gate on both distribution
twins (exit 0 -> exit 1). Its loader column is
`{"nested"=>"'Read'' s, # x, Agent(grugops-orchestrator)'"}`.

### R1 — the red team's OWN harness was defeated by not modelling its input, for the THIRD round running

- The first gate-plant harness injected with `awk -v`, **which cannot carry a multi-line value**.
  Every plant was silently mangled; every row reported `2 CHECK(S) FAILED` and would have been
  written up as a closure. It was caught only because the CONTROL that must stay green was red too.
- The second version planted correctly but INSERTED a `tools:` block into a skill that already
  declares `allowed-tools:`. Every row went red on both builds — on
  `declares 2 DIFFERENT allow-list keys`, a **different** WR-05 sub-check, with **zero** twins named.
  A red that is not the red under test is not evidence.
- **This is `27-50`'s R3 and `27-51`'s R1 for the third consecutive round.** The harness now (a)
  reads the planted file back and asserts the region it wrote is on disk, (b) asserts the file is
  left with exactly ONE allow-list key, and (c) counts how many of the two twins are NAMED in the
  failure text rather than trusting the exit code.
- **Suggested direction:** a gate-plant harness should assert its own premise the way the module's
  own cases do — the `IN-03`/`IN-04` "assert the slice is the thing before inspecting it" discipline
  applies to throwaway probes, and three rounds of the same near-miss say it should be written once.

### Still OPEN, carried forward with its owner

- **The `27-49` WR-04 residual** — the deleted per-exemption bound gave up one narrow detection band,
  and the replacement corpus-level floor fires only past roughly half the loader-accepted corpus.
  `27-52` did not address it and does not claim to. Its suggested direction stands: derive the
  per-rule ceiling from a quantity the rule does not read.
- **The `27-50` R1 residual** — the leading clause calls an INDENTATION run "residue" on 1,570
  measured cells. Unchanged by this plan; a wording decision, not a defect.
- **SPAWN-03's live-platform capture** — deferred to Phase 33 (GAP-D1 / CAP-01) by the `27-50`
  DECISION 2 above. Unchanged.
- **The `27-48` scope question is SETTLED, not carried** — see D-57's closing paragraph in
  `27-CONTEXT.md`. Of the eleven loader-accepted cells whose flattened value disagreed with the
  loader's content signature on both builds, the block-scalar-bearing subset moved TOWARD the loader
  under the widened contract (measured above: 3 toward, 0 away, and two of the three now EQUAL the
  loader's value byte for byte); the residual is the flattener's declared token-presence contract
  meeting deeply nested metadata, which is IN scope for this module and explicitly NOT a defect,
  because a value map is not a YAML tree. It is not to be re-opened from a third symptom.

## From 27-53 (round 10, 27-REVIEW § WR-02 + WR-03 + IN-01) — three harness-integrity findings, all three instances of the SET-LITERAL-DRIFT class

Every one of round 9's own code-review findings was a hand-maintained set or a hand-scoped pin that
stayed green while the thing it claimed to bound grew. All three are closed here; the measurements
each closure rests on are recorded below rather than left implicit, because a closure whose
measurement is not written down is a claim again.

### WR-02 — the fence-authority scope, DERIVED, and the review's own hand-list measured INCOMPLETE

- **The claim that was false.** `scripts/frontmatter.ts:75` asserted that no second fence parser was
  written "here or anywhere", and `scripts/check-foundation-guards.ts:519` restated the same
  tree-wide uniqueness. Both were false when written.
- **The measurement.** The classifier (a delimiter RECOGNISER **and** a state TOGGLE in the same
  file, over comment-stripped code, across all **69** tracked `.ts`) returns **4** members:

  | # | member | recogniser | toggle | kind |
  |---|--------|-----------|--------|------|
  | 1 | `scripts/check-foundation-guards.test.ts` | anchored regex literal | fence-named counter | harness-local |
  | 2 | `scripts/check-foundation-guards.ts` | anchored regex literal | fence-named counter | production, `## Caveman prompt`-gated |
  | 3 | `scripts/frontmatter.ts` | anchored regex literal | self-negating flip | production, THE authority |
  | 4 | `scripts/generate-role-adapters.test.ts` | prefix test | self-negating flip | harness-local |

- **DISAGREEMENT WITH THE REVIEW, RECORDED.** The review proposed
  `{frontmatter.ts, generate-role-adapters.test.ts, check-foundation-guards.ts (x2)}` — **three**
  files. The measurement returns **four**: `scripts/check-foundation-guards.test.ts` carries three
  further fence-toggle sites (around `:2875`, `:2903`, `:2940`) and the review's list omits it
  entirely. Transcribing that list would have shipped the drift defect inside its own fix. The
  planner's independent measurement at HEAD had flagged the same omission; both agree.
- **The conjunction is proven to discriminate, by measurement.** `scripts/frontmatter.test.ts`
  matches the recogniser arm (it names the delimiter class twice **in code**, inside string literals
  in the WR-02 invariant case) and matches **no** toggle construct. It is therefore a textual
  REFERENCE and not a machine, and both halves of that are asserted.
- **Every construct is load-bearing on the LIVE corpus** — not merely on planted fixtures:

  | construct dropped | derived set becomes | moved |
  |---|---|---|
  | recogniser[0] anchored regex literal | 1 member (`generate-role-adapters.test.ts`) | yes |
  | recogniser[1] prefix test | 3 members (both guards files + `frontmatter.ts`) | yes |
  | toggle[0] self-negating flip | 2 members (both guards files) | yes |
  | toggle[1] fence-named counter/flag | 2 members (`frontmatter.ts` + `generate-role-adapters.test.ts`) | yes |

- **The pin is proven able to fail on the REAL tree**, not only in a temp directory. A fence state
  machine appended to the tracked `scripts/dead-vocabulary.ts` turned all three new cases red, each
  naming `scripts/dead-vocabulary.ts` in the diff; reverted with `git checkout --` on that one file.
  The temp-directory control passes first (the four copies alone reproduce the live answer at
  cardinality 4) so a planted-fifth failure is attributable to the plant.
- **Residual, named so it is not rediscovered as a finding.** The classifier is a FLOOR, and its
  disclosure lists what it misses: a recogniser built from concatenated fragments or `new RegExp`; a
  `slice(0, 3)` or `indexOf` form; a state variable neither self-negated nor named for the fence
  (`toggle[1]` is deliberately variable-name-sensitive, because the two awk-derived caveman scopers
  advance a counter rather than flip a boolean); and a machine in a language the scan does not read.
- **The single-spelling count at `frontmatter.test.ts` was KEPT, not replaced** — with its message
  narrowed. It still states something true (inside `frontmatter.ts` the class is declared exactly
  once, which is what keeps the region scan and the strip from disagreeing), but its old message read
  as a tree-wide claim. It now says so explicitly and points at the derived set for the tree-wide
  question.

### WR-03 — the assertion that could not fail, and a SECOND one found while replacing it

- The deleted assertion compared two calls of a pure function on one unmutated `readonly string[]`:
  `f(x) === f(x)`, green for every implementation. Its stated purpose — guarding the two sibling
  fixtures against drift — was also unmet, because the sibling never called the function.
- **Found while writing the replacement, and worth recording:** the review's own proposed
  replacement, "kept plus removed equals the input length", was ALSO vacuous as the code stood,
  because `linesRemoved` was DERIVED as `lines.length - kept.length` — an identity. The fix counts
  removals as the lines are dropped, and the source shape is pinned so the derivation cannot return.
- **Proven able to fail against broken variants**, run against the live fixture case and reverted:

  | variant | named assertion that went red |
  |---|---|
  | keeps the fence delimiter lines | `the unterminated-region fixture: no fence delimiter line may survive the strip: expected [ '```', '```' ] to deeply equal []` |
  | drops lines without counting them | `the unterminated-region fixture: the strip must PARTITION its input — kept plus removed is the input length…: expected 47 to be 52` |

- The sibling pair is now joined by `spliceClosingDelimiter()`, one construction both cases call,
  with the closing-delimiter index assertion travelling inside it; the stripped case asserts an
  independently built mirror yields byte-identical splice output.

### IN-01 — the dead local, and the compiler measurement

- **Pre-enable measurement, verbatim and complete** (`npx tsc --noEmit --noUnusedLocals --noUnusedParameters`
  on HEAD before the deletion), exit **2**:

  ```
  scripts/validate-agent-factory.ts(88,7): error TS6133: 'kitListDir' is declared but its value is never read.
  ```

  One error, and it AGREES with the review's claim that the tree is otherwise clean under both flags.
- `readdirSync` stays imported: `stateListDir` still uses it, confirmed by reading the function.
- **The flags are proven able to fire.** An unused function, an unused parameter and an unused local
  appended to a scratch copy of `scripts/freshness.ts` produced three `TS6133` errors
  (`'scratchProbe'`, `'unusedParam'`, `'unusedLocal'`); reverted, `tsc --noEmit` back to exit 0.
- **SCOPE, RECORDED RATHER THAN LEFT TO BE INFERRED.** `tsconfig.json` excludes `**/*.test.ts`, so
  the two flags cover the SHIPPED sources (`install/`, `scripts/`, `hooks/` non-test) and **not** the
  harness. An unused local in a `.test.ts` still passes `npx tsc --noEmit` today.
- `node scripts/validate-agent-factory.js` output is **byte-identical** before and after the
  deletion — one line, `ALL CHECKS PASSED`, sha256 `6852d6da8a2e1b3d2ca426438cb3473548fe1d9670ce0f64537e4a7d23d4ef9c`, exit 0 on both sides.

### Residual this plan's own dispositions create

- **The fence classifier's floor** (above) — it is not a proof that no fifth machine can exist, only
  that the four shapes it recognises are counted. Suggested direction if it ever matters: classify
  from a TypeScript AST rather than from source text, which would also delete the comment-stripping
  step and the string-literal false-positive it exists to suppress.
- **`toggle[1]` is variable-name-sensitive.** A caveman-style scoper written with a differently named
  counter would not be counted. It is recorded here rather than widened, because widening the toggle
  arm to any counter increment makes the conjunction stop discriminating (`frontmatter.test.ts` then
  enters the answer through its own `depth += 1` at an unrelated paren-balance loop — measured, not
  supposed).
- **The two compiler flags do not cover the harness** (above). Nothing in this plan claims they do.

## Round 10 disposition register (written 2026-08-10 by plan `27-54`) — every round-9 item accounted for

**Why this table exists.** A finding that leaves a round without a written disposition is
indistinguishable, to a later reader, from a finding that was forgotten — and this phase's own
recorded experience is that such an item returns one abstraction level down. The register is the
durable answer to *"what happened to everything round 9 raised?"*, carried in the phase's own
artifact so it survives a milestone archive move rather than living only in plan summaries that
scroll out of view. **There is no silent drop.**

| # | Item | Raised in | What happened | Artifact carrying the evidence | Disposition |
|---|---|---|---|---|---|
| 1 | **CR-01** — `stripComment` reads YAML's `''` escape inside an open single-quoted scalar as close-then-reopen, destroying node-start provenance; silent no-grant on the SUCCESS arm | `27-REVIEW.md` § Critical Issues | Closed STRUCTURALLY by `27-51`: the `''` pair is consumed by index arithmetic and `openedAtNodeStart` is never recomputed — the arm lost its ability to decide, rather than gaining a fifth condition | `deferred-items.md` § From 27-51; `27-51-SUMMARY.md` | **CLOSED** — gate exit 0 → exit 1 on both distribution twins; 180 never-exemptible cells reported by the same corpus digest against a pre-fix mirror; **re-measured again by `27-54` on the post-`27-53` build (below)** |
| 2 | **WR-01** — the D-52 loader differential's generated corpus cannot express CR-01's family while printing a completeness claim over it | `27-REVIEW.md` § Warnings | Closed by `27-51` (`AXIS_QUOTE_STYLE` + `AXIS_ESCAPE_IN_SCALAR`, both DERIVED from the base shapes' own fields: key-line axis 20 → 47, corpus 960 → 2256, loader-accepted 565 → 1285) and grown again by `27-52` (ledger entry eleven took the floor's derived family rows 9 → 11 and expressible 6 → 8) | `deferred-items.md` §§ From 27-51, From 27-52; `27-51-SUMMARY.md`, `27-52-SUMMARY.md` | **CLOSED** — the corpus is proven able to SEE the families it was blind to: same digest, pre-fix build reports 24 name-set disagreements, every one `module=no-grant / loader=grant`; non-vacuity floor proven load-bearing by axis collapse |
| 3 | **WR-02** — a second fence state machine exists, falsifying the "exactly one fence authority" claim, and the pin guarding that claim cannot see it | `27-REVIEW.md` § Warnings | Closed by `27-53` with a DERIVED, sorted, cardinality-pinned classifier over all 69 tracked `.ts`. **The review's own hand-list was measured INCOMPLETE** — it named 3 files, the measurement returns 4 (`check-foundation-guards.test.ts` carries three further fence-toggle sites the list omits). Transcribing the list would have shipped the drift defect inside its own fix | `deferred-items.md` § From 27-53; `27-53-SUMMARY.md` | **CLOSED** — every construct proven load-bearing on the LIVE corpus (dropping each moves the derived set); the pin proven able to fail on the REAL tree, not only in a temp directory |
| 4 | **WR-03** — an assertion that cannot fail, guarding a property it does not test | `27-REVIEW.md` § Warnings | Closed by `27-53`. **The review's own proposed replacement was ALSO vacuous** as the code stood (`linesRemoved` was derived as `lines.length - kept.length`, an identity); removals are now COUNTED as lines are dropped and the source shape is pinned so the derivation cannot return | `deferred-items.md` § From 27-53; `27-53-SUMMARY.md` | **CLOSED** — proven able to fail against two broken variants, each naming its own assertion |
| 5 | **IN-01** — dead local `kitListDir` declared and never read | `27-REVIEW.md` § Info | Closed by `27-53`: deleted, and `noUnusedLocals` + `noUnusedParameters` turned on over a measured-clean shipped-source tree | `deferred-items.md` § From 27-53; `27-53-SUMMARY.md` | **CLOSED** — pre-enable measurement exit 2 with exactly one `TS6133`; flags proven able to fire; `validate-agent-factory.js` output byte-identical before and after (sha256 `6852d6da…`) |
| 6 | **IN-02** — `stripComment`'s returned `state` is unasserted by every differential over it | `27-REVIEW.md` § Info | Closed by `27-51`: `scripts/fixtures/frontmatter-singleline-pre-d54.json` gained a `state` key captured from a hermetic `git archive` mirror of the pre-fix commit `d5c69e0`, and a new case compares `openQuote`, `flowDepth` and `nodeMayBegin` per cell over a corpus-derived moved-input set | `deferred-items.md` § From 27-51; `27-51-SUMMARY.md` | **CLOSED** — the scanner's returned `state` has its first differential |
| 7 | **Family G / G2** — a `\|`/`>` block-scalar header recognised at exactly one of the positions YAML allows one; nested header content reaches `stripComment` where a leading `#` hides a live grant | `27-VERIFICATION.md` § gaps_remaining; open in this ledger since `27-47`, re-measured byte-identical by `27-47`…`27-51` | Closed by `27-52` under **D-57**: `blockHeaderAt` calls the existing `BLOCK_INDICATOR` at all four of YAML's block-context node introductions (§ 8.2.1 `-`, § 8.2.2 `key:`, `?`, `:`), the scalar's end DERIVED from § 8.1's more-indented-block rule and the join from the indicator itself. **Re-red-teamed against its own post-fix build**, which found the family still live at three further positions — closed in the same plan | `deferred-items.md` § From 27-52; `27-52-SUMMARY.md`; `27-CONTEXT.md` D-57 | **CLOSED** — all eight family rows exit 0 → exit 1 with twins named 2/2; measured false-red cost **0** on the four tracked documents that already carry a nested header; **re-measured again by `27-54` on the post-`27-53` build (below)** |
| 8 | **The `REQUIREMENTS.md` traceability correction** — the table's Phase-27 rows contradicted the verification record, and no written rule governed them | `27-VERIFICATION.md` § gaps (truth 3) and § Anti-Patterns Found | Closed by `27-54` (this plan) under **D-58**: one written convention — a row is `[x]`/`Complete` exactly when the most recent verification records it SATISFIED with cited evidence — applied identically to all ten rows, with both surfaces asserted equal afterwards. **The verification's line citations were STALE**: it cited KIT-03 and SPAWN-04 as over-claimed `[x]`, but commit `47d7820` had already reverted both to `[ ]`/Gaps Found before this plan began. The file was re-read on disk and the real remaining defect was the missing RULE, not the row the report named | `27-CONTEXT.md` D-58; `.planning/REQUIREMENTS.md`; `27-54-SUMMARY.md` | **CLOSED** — 5 rows flipped on transcripts re-run in this plan, 2 held unflipped with the reason recorded in the row, 1 deferral re-affirmed; checkbox and table agree for all ten |
| 9 | **SPAWN-03's live-platform capture** — whether the main-thread coordinator's `Agent(<allowlist>)` grant is actually honoured by the Claude Code runtime | `27-VERIFICATION.md` § deferred and § human_verification | Re-affirmed unchanged by `27-54`. No static gate can produce this evidence, and inventing one would be the faked gate `CLAUDE.md` forbids by name. `ROADMAP.md` was NOT edited; the wording was confirmed to agree across all three records | `ROADMAP.md:431` + standing-obligations row 1; `deferred-items.md` § From 27-50 DECISION 2; `.planning/REQUIREMENTS.md` SPAWN-03 row | **DEFERRED** — owner **Phase 33** (GAP-D1, requirement **CAP-01**; the capture itself is CAP-03); dated **2026-08-09**, ratified as D-56 item 10; status stays `UNKNOWN - verify` |

### Completeness, asserted by count so a reader can check it

- Round-9 code-review findings raised (`27-REVIEW.md`): **6** — CR-01, WR-01, WR-02, WR-03, IN-01, IN-02.
- Round-9 verification gaps carried beyond those (`27-VERIFICATION.md`): **3** — family G/G2, the
  `REQUIREMENTS.md` traceability correction, SPAWN-03's deferral.
- **Total round-9 items raised: 9. Rows in the register above: 9. 9 == 9.**

If those two numbers ever differ, **the register is wrong, not the count** — this is the same
non-vacuity posture the harness applies to its own corpora, turned on the record itself. Dispositions
partition as **8 CLOSED + 1 DEFERRED + 0 OPEN**, and `8 + 1 + 0 == 9`.

### The two closures RE-MEASURED on this build, because `27-53` edited the file they live in

`27-53` modified `scripts/frontmatter.ts` and the rebuilt `scripts/frontmatter.js` **after** both
families were closed, so their closure is measured here rather than inherited — the discipline every
plan from `27-47` onward has applied to this ledger. Loader column `/usr/bin/ruby -ryaml`
(ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1). Every row is a document the loader ACCEPTS with
`Agent(grugops-orchestrator)` plainly in the loaded value.

| row | module on THIS build | loader | verdict |
|---|---|---|---|
| CONTROL one-line grant | `grant`, `["grugops-orchestrator"]` | `"Read, Agent(grugops-orchestrator)"` | premise: the probe CAN see a grant |
| CONTROL no grant | `no-grant`, `[]` | — | premise: the probe does not grant everything |
| CR-01 row A `'Read'' s,` / `  # x, TOKEN'` | `grant`, `["grugops-orchestrator"]` | `"Read' s, # x, Agent(grugops-orchestrator)"` | **STILL CLOSED** |
| FAMILY G `  nested: >-` / `    Read,` / `    # x, TOKEN` | `grant`, `["grugops-orchestrator"]` | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` | **STILL CLOSED** |
| FAMILY G2 `  - >-` / `    Read,` / `    # x, TOKEN` | `grant`, `["grugops-orchestrator"]` | `["Read, # x, Agent(grugops-orchestrator)"]` | **STILL CLOSED** |

**At the gate**, on hermetic `git archive HEAD` mirrors, planted into the EXISTING `allowed-tools:`
key of BOTH distribution twins of the non-coordinator `plan` skill (D-40) — never by adding a second
allow-list key, which is `27-52`'s R1 near-miss:

```
CONTROL one-line grant   :: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2
CONTROL no grant         :: exit=0 :: ALL CHECKS PASSED                 :: twins named 0/2
CR-01 row A ''-escape    :: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2
FAMILY G  nested map val :: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2
FAMILY G2 block-seq item :: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2
```

Failure text, verbatim, for the family G plant — both twins named:

```
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner …
skills/plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner …
```

**A near-miss in THIS plan's own harness, recorded rather than quietly repaired — the fourth
consecutive round.** The first counter reported `twins named 1/2` for the NO-GRANT control, which
would have read as a partial red. It was not: the counter matched the twin's path anywhere in the
output, and on a passing run the guard names that path in an ordinary `PASS … 1228B pointer-sized`
line. The exit code was 0 and `ALL CHECKS PASSED`. The count was re-taken over the FAILURE block
only. This is `27-50` R3 / `27-51` R1 / `27-52` R1 in the same shape once more: **a probe's oracle is
a predicate like any other, and it must model what its input actually contains.**

### Standing obligations this phase carries INTO its next verification

Written here, with a named owner each, so they survive a milestone archive move.

| Obligation | Measurement | Owner |
|---|---|---|
| **SPAWN-03's live-platform capture** | Not obtainable by any static gate. `node scripts/coordinator-resolution-precheck.js` exits 0 this round with `PRECONDITIONS HOLD`, and states in its own output that the two runtime steps are NOT PERFORMED by it | **Phase 33** — GAP-D1 / CAP-01 (capture itself CAP-03) |
| **KIT-03 and SPAWN-04 remain unflipped** | Both underlying bypasses re-measured CLOSED on this build (table above), but a requirement's verified status is a verification round's call (D-58 item 4) | **the next verification round** for phase 27 |
| **The `27-49` WR-04 residual** — the deleted per-exemption bound gave up one narrow detection band; the replacement corpus-level floor fires only past roughly half the loader-accepted corpus | Unchanged by `27-51`…`27-54`; none of them touched the exemption machinery, and `27-52` measured the exemption list byte-unchanged (2 rules, `E1=32`, `E2=52`, before and after). Carried figure, named as carried | **a later round** — direction stands: derive the per-rule ceiling from a quantity the rule does not read |
| **The `27-50` R1 residual** — the leading clause calls an INDENTATION run "residue" on 1,570 measured cells | A wording decision, not a defect; unchanged by `27-51`…`27-54`. Carried figure, named as carried | **a later round** — split the clause and re-take the corpus comparison for BOTH shapes |
| **The `27-53` fence-classifier floor** — it counts four recogniser/toggle shapes, and is not a proof that no fifth machine can exist | Its own disclosure enumerates what it misses (concatenated or `new RegExp` recognisers, `slice(0,3)`/`indexOf` forms, a counter neither self-negated nor fence-named, a machine in a language it does not read) | **a later round** — classify from a TypeScript AST |
| **`toggle[1]` is variable-name-sensitive**, and the two compiler flags do not cover `**/*.test.ts` | Both recorded with their reasons in § From 27-53; widening `toggle[1]` measurably makes the conjunction stop discriminating | **a later round**; nothing in `27-53` claims otherwise |
| **The `27-48` scope question is SETTLED, not carried** | Closed by D-57's closing paragraph and measured by `27-52` (3 cells moved TOWARD the loader, 0 away, 2 now byte-equal). Recorded here so it is not re-opened from a third symptom | **nobody — closed** |

### Round-wide specless-probe accounting, in one checkable place

**29 probe-surfaced rows == 26 resolved `explicit` + 3 resolved `backstop` + 0 unresolved + 0
dismissed.** Distributed across round 10's four plans: `27-51` **7**, `27-52` **0**, `27-53` **7**,
`27-54` **15** — and `7 + 0 + 7 + 15 == 29`. The 3 `backstop` rows are all SPAWN-03's (adjacency,
empty, ordering): they describe live Claude Code runtime behaviour that no static gate can reach,
which is consistent with row 9's Phase-33 deferral rather than a separate omission.
