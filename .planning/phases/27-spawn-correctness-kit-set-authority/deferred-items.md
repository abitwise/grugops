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
