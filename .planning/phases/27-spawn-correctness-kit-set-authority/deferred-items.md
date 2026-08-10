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

---

## From 27-55 — CR-01-new: the block-scalar quoting exemption was KEY-wide, not REGION-wide (round 11)

**What was closed.** D-57 moved the block-scalar quoting exemption off the per-value `block` fact and
onto a **sticky per-key** flag, so one nested block scalar anywhere in a key switched the D-30 escape
refusal off for **every other part of that key**. Adding two unrelated lines to a document moved a
refusal to the silent no-grant arm over a live grant. Closed **structurally**: the flag is deleted,
`Accumulator.parts` is a list of REGIONS (`Part`), and the flush resolves maximal **runs of like-kind
regions** on their own terms. Recorded as **D-59** in `27-CONTEXT.md`.

### RED / GREEN, with the loader column

Loader for every row: `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1).
RED taken against the committed build `3c7930b` on a `git archive HEAD` mirror BEFORE the edit.

| Row | Document (frontmatter region) | RED (`3c7930b`) | GREEN (this build) | Loader |
|---|---|---|---|---|
| **U2** control | `tools:` / `  a: "\x41gent(grugops-orchestrator)"` | REFUSED, names `\x` | REFUSED, **reason byte-identical** | `{"a"=>"Agent(grugops-orchestrator)"}` |
| **U1** the finding | U2 + `  b: >-` / `    x` | `{"ok":true,"value":false}` | REFUSED, names `\x` | `{"a"=>"Agent(grugops-orchestrator)","b"=>"x"}` |
| **U3** asymmetry control | `  - "\x41gent(…)"` / `  - >-` / `    x` | REFUSED | REFUSED (unchanged) | `["Agent(grugops-orchestrator)","x"]` |
| **U4** adjacency | `  b: >-` / `    x` / `  a: "\x41gent(…)"` | `{"ok":true,"value":false}` | REFUSED, names `\x` | `{"b"=>"x","a"=>"Agent(grugops-orchestrator)"}` |
| **U5** empty region | `  b: >-` / `  a: "\x41gent(…)"` | `{"ok":true,"value":false}` | REFUSED, names `\x` | `{"b"=>"","a"=>"Agent(grugops-orchestrator)"}` |
| **U5b** empty alone | `  b: >-` | `{"ok":true,"value":false}`, flat `b:` | **unchanged** | `{"b"=>""}` |
| **U6** fail-safe | `  b: >-` / `    Read, "Agent(x\q)"` | grants, no refusal | **unchanged** | `{"b"=>"Read, \"Agent(x\\q)\""}` |
| **U6b** fail-safe, top level | `tools: \|` / `  Read, "Agent(x\q)"` | grants, no refusal | **unchanged** | `"Read, \"Agent(x\\q)\"\n"` |
| **U7** allowlisted escape | `  a: "\/Agent(…)"` / `  b: >-` / `    x` | grants | **unchanged** | `{"a"=>"/Agent(grugops-orchestrator)","b"=>"x"}` |
| **U8** intro region | `  "\x41gent(…)": >-` / `    x` | REFUSED | REFUSED (unchanged) | `{"Agent(grugops-orchestrator)"=>"x"}` |

Exactly **three** rows moved — U1, U4, U5 — and all three moved from the silent no-grant arm to a
named refusal. Seven rows are byte-identical before and after.

### Gate exit codes

| Mirror | Build | `node scripts/check-foundation-guards.js` |
|---|---|---|
| `git archive HEAD` (`3c7930b`), **unplanted** | pre-fix | **exit 0** |
| same mirror, **unplanted** | post-fix | **exit 0** |
| real working tree, **unplanted** | post-fix | **exit 0** |
| same mirror, **U1's shape planted in the EXISTING `allowed-tools:` key of BOTH twins** of the non-coordinator `plan` skill | pre-fix | **exit 0** — `ALL CHECKS PASSED` over a live grant |
| same plant, byte-identical files (sha1 `37e33e78…` / `cd07098d…` on both mirrors) | post-fix | **exit 1** — `2 CHECK(S) FAILED` |

The plant never adds a second allow-list key; it replaces the block-sequence value of the existing
`allowed-tools:` with U1's mapping shape. The loader reads that key as
`{"a"=>"Agent(grugops-orchestrator)", "b"=>"x"}` — a live grant on a non-coordinator surface (D-40:
both distribution twins).

Failure text, verbatim, from the post-fix planted run:

```
[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-plan/SKILL.md: frontmatter parse failure — `allowed-tools: a: "\x41gent(grugops-orchestrator)" b: x` carries the backslash sequence `\x` inside a double-quoted scalar, and that sequence is not one of the three escapes this module resolves; the value this document expresses is not the text these bytes spell, so it is refused on the same argument as an anchor or alias — never read as "carries no grant". An unreadable adapter cannot be reported on, so it is NEVER read as "carries no grant"
skills/plan/SKILL.md: frontmatter parse failure — `allowed-tools: a: "\x41gent(grugops-orchestrator)" b: x` carries the backslash sequence `\x` inside a double-quoted scalar, and that sequence is not one of the three escapes this module resolves; the value this document expresses is not the text these bytes spell, so it is refused on the same argument as an anchor or alias — never read as "carries no grant". An unreadable adapter cannot be reported on, so it is NEVER read as "carries no grant"

[guard_distribution_pair] plugin-form and standalone skills are byte-identical modulo the `name` value (D-40)
  FAIL  D-40 distribution-pair violation:
skills/plan/SKILL.md: frontmatter parse failure — `allowed-tools: a: "\x41gent(grugops-orchestrator)" b: x` carries the backslash sequence `\x` … An unreadable side is NEVER read as "the pair matches"
```

**Twins named, counted over the FAILURE block only and not over the whole output: 2** —
`.claude/skills/grugops-plan/SKILL.md` and `skills/plan/SKILL.md`.

### Repository-wide value map

`git ls-files '*.md'` flattened under both builds and compared entry by entry:

```
files scanned (pre / post): 1170 / 1170
files whose verdict or flattened value MOVED: 0
NEW refusals (ok -> refused): 0
refusals LIFTED (refused -> ok): 0
```

### Axis cardinalities, before and after

There was **no** region-kind x escape-kind x spelling axis before `27-55`; it is new, so the "before"
figure is **0 axes / 0 cells**. After:

| Axis | Length | Derived from |
|---|---|---|
| `AXIS_REGION_KIND` | 4 | block-owned / double-quoted / single-quoted / plain |
| `AXIS_ESCAPE_KIND` | **6** | `1 + DQ_ESCAPE_ALLOWLIST.size (3) + 1 non-allowlisted + 1 doubled single quote` |
| `AXIS_SPELLING` | 3 | top-level / nested-mapping sibling / block-sequence item |
| **cells** | **72** | asserted EQUAL to `4 x 6 x 3`, with the derivation in the assertion message |

The escape axis is **live**, not transcribed: adding a member to `DQ_ESCAPE_ALLOWLIST` lengthens it by
one, narrowing it to a single member shortens it to 4, and putting `x` on the allowlist moves the
non-allowlisted arm from `\x41` to `A`. All three are asserted.

Differential against the post-fix build, printed by the case:

```
[D-59 union axis] cells=72 loader-rejected(skipped)=3 adjudicated=69 refuses-while-loader-grants=3
  SKIPPED (loader rejects) [plain region] [the doubled single-quote pair ''] [top-level key value]
  SKIPPED (loader rejects) [plain region] [the doubled single-quote pair ''] [nested mapping sibling of a block scalar]
  SKIPPED (loader rejects) [plain region] [the doubled single-quote pair ''] [block-sequence item beside a block-scalar item]
  LOUD (module refuses, loader grants) [double-quoted region] [non-allowlisted double-quote escape \x41] [top-level key value]
  LOUD (module refuses, loader grants) [double-quoted region] [non-allowlisted double-quote escape \x41] [nested mapping sibling of a block scalar]
  LOUD (module refuses, loader grants) [double-quoted region] [non-allowlisted double-quote escape \x41] [block-sequence item beside a block-scalar item]
```

Both never-exemptible partitions are **empty**. The loud arm is **3** and is reported with its count,
never folded into "no names" — a refusal where the loader grants is D-30's declared policy.
**No exemption rule was added to make any cell pass; this axis declares no exemption machinery at
all, asserted by a case that searches its own block for one.** The D-52 differential's exemption list
is untouched at **2 rules**, before and after.

### Non-circularity, MEASURED against a pre-fix mirror

The identical axis, the identical loader batch and the identical partition function run against a
hermetic `git archive` mirror of `3c7930b`:

```
[D-59 union axis, pre-fix mirror 3c7930b] silent-no-grant=1 module-grant-loader-none=0 skipped=3
  UNSAFE on the pre-fix build [double-quoted region] [non-allowlisted double-quote escape \x41] [nested mapping sibling of a block scalar]	module=no-grant	loader=grant	flat="a: Agent(grugops-orchestrator), b: x"
```

**1** never-exemptible cell on the pre-fix build, **0** after. The case also asserts the mirror really
is the older build (it still carries the deleted flag), so a wrong commit cannot make it pass
vacuously. **Stated honestly: 1 of 72 is a thin margin.** The axis's three spellings all place the
block sibling AFTER the payload, so the block-BEFORE ordering is not in its shape space; that
direction is pinned by the U4 adjacency case instead, and by the adversarial probes below (where the
pre-fix build fails 13 of 20).

### Mutation control — the pin is PROVEN able to fail

The region-scoping decision reverted **alone** (the `Part` record, `regionText`, the fold assertion and
the intro split all kept; only the flush's run walk replaced by D-57's key-wide
`parts.some(p => p.block)`), rebuilt, suite re-run, then restored and re-verified against `git diff`
and `npm run freshness`:

**6 cases red**, each naming its own assertion:

1. `D-59 U1/U2 — an unrelated \`b: >-\` sibling cannot switch off the escape refusal…`
2. `D-59 three-spelling agreement…`
3. `D-59 U4 — a block-owned region immediately FOLLOWED by a quoted sibling region…`
4. `D-59 U5 — a nested block scalar consuming ZERO content lines…`
5. `D-59 three regions under one key…`
6. `D-59 the union differential — both never-exemptible directions are EMPTY against the post-fix build`

One failure message verbatim, showing the case names its own assertion rather than failing generically:

```
AssertionError: NEVER EXEMPTIBLE — the silent no-grant arm: the module reports no grant where the loader grants: expected [ Array(1) ] to deeply equal []
- []
+ [
+   "[double-quoted region] [non-allowlisted double-quote escape \\x41] [nested mapping sibling of a block scalar]	module=no-grant	loader=grant	flat=\"a: Agent(grugops-orchestrator), b: x\"",
+ ]
```

**A note worth carrying:** the first attempt at this mutation control PASSED, and it passed for a
harness reason and not a code reason — vitest resolves the test file's `./frontmatter.js` import to
the **committed `.js`**, so mutating only the `.ts` mutated nothing the suite could see. Assert the
harness's own premise: the mutation was only real after `npm run build`.

### Adversarial pass (a) — *what is this predicate's INPUT assembled from?*

Walked one key's value from each region's creation, through the fold, the run partition and the join,
to the enumeration, asking at each hop what the next stage assumes. Eight shapes probed, all with two
regions of DIFFERENT kinds adjacent at every boundary the flattener can produce:

| Probe | Post-fix | Pre-fix |
|---|---|---|
| a1 block region then quoted region, quote SPANNING the run boundary | agree (no-grant/no-grant) | agree |
| a2 block body ENDING with an open quote, sibling after | agree | agree |
| a3 escape at the OUTER level, block scalar one level DEEPER | refuse / loader grants (loud) | **UNSAFE — silent** |
| a4 block scalar OUTER, escape one level DEEPER | refuse (loud) | **UNSAFE — silent** |
| a5 a block header INSIDE a block scalar's content (not a header at all) | agree | agree |
| a6 a RUN of two block regions then a quoted region with the escape | refuse (loud) | **UNSAFE — silent** |
| a7 quoted-with-escape BETWEEN two block regions | refuse (loud) | **UNSAFE — silent** |
| a8 folded continuation of a quoted region FOLLOWING a block region | refuse (loud) | **UNSAFE — silent** |

**Finding:** nothing new. The one hop worth naming is the run partition: two adjacent regions of the
same kind are resolved as one text, which is deliberate — resolving each region individually
contradicts **D-33** (the unquote runs on the JOINED value) and was measured moving two shipped
values before being rejected. See D-59's rationale.

### Adversarial pass (b) — *which set does the exemption ENUMERATE, and at WHICH positions is it asked?*

The exemption is `Part.block === true`. Counted over non-comment lines of `scripts/frontmatter.ts`:

- `block: true` is written at **1** site — inside `openBlock`, and nowhere else.
- `openBlock(cur, …)` is called from **3** sites — the three positions D-57 enumerated.
- `.parts.push(` appears at **4** sites; exactly one of them (`openBlock`) creates a block region.
- a region's `body` is mutated at **2** sites — the block content fold and the continuation fold — and
  the second asserts its target is **not** block-owned before touching it.

So the exemption reaches exactly `{ the body of a region created by openBlock }`: not a sibling, not
an earlier region, not the `key:` introduction printed in front of the scalar. Twelve positions probed
against the loader:

| Probe | Post-fix | Pre-fix |
|---|---|---|
| b1 position 1 — top-level key-line header | agree | agree |
| b2 position 2 — block-sequence item header, escape in a sibling item | refuse (loud) | agree (the item path already resolved at push) |
| b3 position 2 — COMPACT nested sequence header | refuse (loud) | agree |
| b4 position 3 — nested mapping value header | refuse (loud) | **UNSAFE — silent** |
| b5 position 3 — explicit key header `? >-` | refuse (loud) | **UNSAFE — silent** |
| b6 position 3 — explicit value header `: >-` | refuse (loud) | **UNSAFE — silent** |
| b7 the header's own INTRO carrying the escape | refuse (loud) | **UNSAFE — silent** |
| b8 literal `\|` header rather than folded | refuse (loud) | **UNSAFE — silent** |
| b9 indentation-indicator header `>2-` | refuse (loud) | **UNSAFE — silent** |
| b10 header with a trailing comment | refuse (loud) | **UNSAFE — silent** |
| b11 escape inside a FLOW collection beside a block sibling | refuse (loud) | **UNSAFE — silent** |
| b12 ALLOWLISTED escape in the same shape | **grant** (not a refusal) | grant |

**Across all 20 probes: 0 never-exemptible disagreements on this build; 13 on the pre-fix build.**

**Finding, and it is a real one that this pass closed rather than merely reported.** Position b7 — the
`key:` a nested header prints in FRONT of the scalar — was inside the exemption under D-57 and would
have stayed inside it under a naive "one flag per region" fix, because the introduction was stored as
the first bytes of the block region's own body. It is now a separate field validated through
`unquoteChecked`. Today's `KEY_LINE` alphabet (`[A-Za-z_][A-Za-z0-9_-]*`) makes that validation a
provable no-op, so no value moves; it is checked anyway so the rule does not rest on an alphabet
declared two hundred lines away.

### Still OPEN, with a named owner

| Item | Measurement | Owner |
|---|---|---|
| **The union axis's spelling arm places the block sibling only AFTER the payload** | 3 spellings, so block-BEFORE ordering is outside its shape space; covered instead by the U4 adjacency case and by probes a4/a6/a7 | **a later round** — add an ORDERING member to `AXIS_SPELLING` and re-take the pre-fix-mirror count (expected to rise well above 1 of 72) |
| **The pre-fix-mirror non-circularity count is 1 of 72** | Non-empty, so the axis provably sees the defect, but thin. Stated rather than presented as a margin it is not | **the same later round** as the row above |
| **`27-49` WR-04 residual, `27-50` R1 residual, `27-53` fence-classifier floor, `toggle[1]` sensitivity** | Untouched by `27-55`; it changed no exemption machinery, no fence classifier and no toggle | **carried, unchanged** |

### Specless-probe accounting for this plan

**3 probe rows == 3 authored `explicit` + 0 backstop + 0 unresolved + 0 dismissed** — KIT-03 ordering
(the region-identity truth), KIT-03 adjacency (the touching-regions truth) and KIT-03 empty (the
zero-content-line block scalar truth), all authored as plain strings in `must_haves.truths` and all
carrying a case in `scripts/frontmatter.test.ts`. Round equality is stated once, in `27-61`.

### The regression suite is a FLOOR

`npx vitest run --exclude '**/scripts/e2e/**'` reports **1302 passed | 2 skipped, 0 failed**. That is a
floor and not the closure evidence. The closure evidence is the gate plant moving exit 0 → exit 1 on
both distribution twins, the pre-fix-mirror non-circularity result, the mutation control, and the two
adversarial passes above.

---

## From 27-56 — CR-03: the header recogniser borrowed the TOP-LEVEL key grammar for the NESTED question (round 11)

**Class.** Neither a condition bug (D-54) nor a position bug (D-57). **One grammar doing two jobs.**
`blockHeaderAt`'s implicit-key introduction asked `KEY_LINE`, the deliberately narrow grammar for the
**top-level** keys a frontmatter block may declare, where narrowness is an *intended refusal*.
Borrowing it silently transferred that narrowness to **nested** mapping keys, where YAML allows any
scalar. The module's own comment said the recogniser "CALLS the one constant rather than restating it
… nothing here decides what a header LOOKS like" — true of the *indicator*, false of the *position*.

Loader column throughout: `/usr/bin/ruby -ryaml`, **ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1**.
Pre-fix build = commit `ac6653c` (the wave-1 build). Post-fix build = commit `0131600`.

### 1. RED, against the wave-1 build, with both columns

Every row is `---` / `name: x` / `tools:` / `<header line>` / `    Read,` / `    # x, Agent(grugops-orchestrator)` / `---`.

| Row | header line | module (pre-fix) | `/usr/bin/ruby -ryaml` |
|---|---|---|---|
| V1 quoted | `  "a b": >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V2 dotted | `  a.b: >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a.b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V3 digit-leading | `  1a: >-` | `{"ok":true,"value":false}` | `{"tools"=>{"1a"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V4 space-containing | `  a b: >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V5a single-quoted | `  'a b': >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V5b colon in quotes | `  "a: b": >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a: b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V6a multi-byte | `  été: >-` (precomposed, 9 code units / 11 bytes) | `{"ok":true,"value":false}` | `{"tools"=>{"été"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V6b combining mark | `  été: >-` (decomposed, 11 code units / 13 bytes) | `{"ok":true,"value":false}` | `{"tools"=>{"été"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| C1 bare nested key | `  nested: >-` | `{"ok":true,"value":true}` | `{"tools"=>{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| C2 top-level refusal | `1bad: value` at the baseline | `{"ok":false,"reason":"cannot read \`1bad: value\` as a frontmatter key line or as a continuation of the previous key"}` | `{"1bad"=>"value"}` |
| C3 plain-scalar lookalike | `description: see` / `  foo: >-` | `{"ok":true,"value":false}`, value `see foo: Read, # x, Agent(grugops-orchestrator)` | **REJECT** `Psych::SyntaxError: mapping values are not allowed in this context` |

**Eight live silent no-grants.** C1 and C2 are the byte-unchanged controls.

*C3's plan wording is corrected here rather than repeated:* the plan describes `description: see` /
`  foo: >-` as a document "the loader reads as one scalar". Measured, libyaml **REJECTS** it. The
row that libyaml really reads as one scalar is `tools: see` / `  >-`, which loads as `see >- q,` —
that is the true one-scalar control and it is asserted separately (see §4, rows g7/g8).

### 2. GREEN, against the post-fix build, same table

V1–V6b all move to `{"ok":true,"value":true}` and `grantedAgentNames` returns exactly
`["grugops-orchestrator"]` for each. C1, C2 and C3 are **byte-identical**, including C2's reason
string.

### 3. The key-end disposition, adjudicated against the loader (D-60)

| Row | header line | module (post-fix) | `/usr/bin/ruby -ryaml` | reading |
|---|---|---|---|---|
| K1 | `  a: b: >-` | no header, value `a: b: >- Read,` | **REJECT** *mapping values are not allowed in this context* | FIRST predicts this; LAST does not |
| K5 | `  a b: c: >-` | no header, value `a b: c: >- Read,` | **REJECT** *same* | FIRST predicts this; LAST does not |
| K4 | `  a:b: >-` | grant | `{"a:b"=>"Read, # x, Agent(…)"}` | a colon with no separation is key text |
| K3 | `  "a b" : >-` | grant | `{"a b"=>"Read, # x, Agent(…)"}` | separation may precede the indicator |
| K6 | `  "": >-` | grant | `{""=>"Read, # x, Agent(…)"}` | the empty quoted key |
| K8 | `  'a''b': >-` | grant | `{"a'b"=>"Read, # x, Agent(…)"}` | YAML's `''` escape inside the key |
| K13 | `  "a":"b": >-` | no header, byte-unchanged | **REJECT** *did not find expected key* | no separation after the quoted key |
| K14 | `  'a b: >-` | byte-unchanged (grants, as pre-fix) | **REJECT** *unexpected end of stream while scanning a quoted scalar* | an unterminated quote closes nothing |
| K9 | `  "a\x41b": >-` | **REFUSES**, naming `` `\x` `` | `{"aAb"=>"Read, # x, Agent(…)"}` | the loud arm; see §7 |
| K10 | `  a:` / `    b c: >-` | grant | `{"a"=>{"b c"=>"Read, # x, Agent(…)"}}` | two levels down |
| K11 | `  - k: v` / `    j.x: >-` | grant | `[{"k"=>"v","j.x"=>"Read, # x, Agent(…)"}]` | inside a sequence item |
| K12 | `  a b: >- # c` | grant | `{"a b"=>"Read, # x, Agent(…)"}` | trailing comment after the indicator |

**CHOSEN: FIRST.** **REJECTED: LAST**, on K1 and K5 — two documents libyaml refuses outright, which
is exactly what FIRST predicts. FIRST is also the direction that removes no bytes from any value.

### 4. The eight `mappingValueIndicator` position-gate rows, re-run post-fix

| Row | document | module value | loader |
|---|---|---|---|
| g1 | `tools:` / `  a: Read` / `  b: >-` / `    q,` | `a: Read b: q,` | `{"a"=>"Read","b"=>"q,"}` |
| g2 | `tools:` / `  - k: v` / `    j: >-` / `      q,` | `k: v, j: q,` | `[{"k"=>"v","j"=>"q,"}]` |
| g3 | `tools:` / `  ? k` / `  : >-` / `    q,` | `? k : q,` | `{"k"=>"q,"}` |
| g4 | `tools:` / `  ? >-` / `    q,` / `  : v` | `? q, : v` | `{"q,"=>"v"}` |
| g5 | `tools: see` / `  foo: >-` / `    q,` | `see foo: q,` | **REJECT** — no loader value; recognising costs nothing |
| g6 | `tools: see` / `  : >-` / `    q,` | `see : q,` | **REJECT** — same |
| g7 | `tools: see` / `  >-` / `    q,` | `see >- q,` | `"see >- q,"` — **CONTENT, not a header** |
| g8 | `tools: see` / `  ? >-` / `    q,` | `see ? >- q,` | `"see ? >- q,"` — **CONTENT, not a header** |

**All eight keep their recorded verdicts.** The gate is byte-unchanged; only which KEYS reach it moved.

### 5. The gate plant, on hermetic `git archive` mirrors

Planted into the **EXISTING** `allowed-tools:` key of **both** distribution twins of the
non-coordinator `plan` skill — never by adding a second allow-list key:

```
allowed-tools:
  a b: >-
    Read,
    # x, Agent(grugops-orchestrator)
```

| Mirror | build | `node scripts/check-foundation-guards.js` |
|---|---|---|
| planted | pre-fix `ac6653c` | **exit 0** — `ALL CHECKS PASSED` over a live grant |
| planted | post-fix | **exit 1** — `1 CHECK(S) FAILED` |
| unplanted | pre-fix | exit 0 |
| unplanted | post-fix | exit 0 |
| the real tree | post-fix | exit 0 |

Verbatim failure text:

```
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
skills/plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
```

**Twins named, counted over the FAILURE block only: 2.**

### 6. The repository-wide value map

`git ls-files '*.md'` → **1171** files, parsed by both builds and compared as full key/value maps:
**0 moved, 0 new refusals, 0 lifted.** Re-run after the task-2 test edits: unchanged.

### 7. The one refusal whose MESSAGE moved, stated rather than hidden

K9 (`  "a\x41b": >-`) refuses on **both** builds, naming `` `\x` `` on both. The embedded excerpt in
the reason changed, because post-fix the flattened text the reason quotes is the block scalar's real
content:

- pre-fix: ``` `tools: "a\x41b": >- Read,` carries the backslash sequence `\x` … ```
- post-fix: ``` `tools: "a\x41b": Read, # x, Agent(grugops-orchestrator)` carries the backslash sequence `\x` … ```

Refusal → refusal, same named escape. This is the *only* verdict-adjacent string this plan moves, and
the repository-wide map above confirms no tracked document is affected.

### 8. The derived axis (task 2)

`AXIS_NESTED_KEY_SPELLING` (8) × `AXIS_BLOCK_INDICATOR_FORM` (26, **derived**) ×
`AXIS_HEADER_POSITION` (3) = **624** generated cells, plus **28** union cells crossing wave 1's
region axis = **652** regions, adjudicated cell by cell against `/usr/bin/ruby -ryaml` in one batched
process.

```
D-60 axis differential [corpus 4c50004dedcc7e81, ruby=2.6.10 psych=3.1.0 libyaml=0.2.1] — 624 generated cells (8 x 26 x 3) + 28 union cells | loader-rejected and SKIPPED 0 | adjudicated 652 | loud refusal arm 14 | name-set disagreements 0
```

- Both never-exemptible partitions **EMPTY**: `silentWhileLoaderGrants` 0, `moduleGrantsWhileLoaderDoesNot` 0.
- Loader-rejected **skip count printed: 0**.
- Loud refusal arm **14** — the 14 union cells whose sibling region carries a non-allowlisted `\x41`,
  which D-59 requires to refuse even though a block scalar is present in the same key.
- Name-set disagreements **0** (the second fact, over the same already-loaded value — D-09 / KIT-03).
- **The indicator axis is DERIVED, not transcribed.** Candidates are composed from the three things
  `BLOCK_INDICATOR`'s own pattern names (indicator character, indentation digit, chomping sign, in
  either order) and then FILTERED through the exported constant. Liveness is proven by re-filtering
  the identical candidate set through a deliberately narrowed copy and asserting the axis gets
  strictly shorter — a transcription would not move.
- **The union cells are 28** = 7 spellings × 2 escape kinds × 2 orderings, count asserted as that
  arithmetic. They cross D-59 at exactly the point the two fixes meet: a block region introduced by a
  key spelling that could not produce one before, adjacent to a quoted sibling carrying an escape.

### 9. NON-CIRCULARITY, measured against a hermetic pre-`27-56` mirror

The **identical corpus** (same digest `4c50004dedcc7e81`, dumped from the suite itself via
`GRUGOPS_D60_DUMP_CORPUS` and fed to the mirror run, so "the outside run used the same corpus" is a
measurement and not a claim):

| build | regions | skipped | agreed | loud | **SILENT-no-grant** | module-grant-loader-none |
|---|---|---|---|---|---|---|
| pre-fix mirror `ac6653c` | 652 | 0 | 78 | 14 | **560** | 0 |
| post-fix `0131600` | 652 | 0 | 638 | 14 | **0** | 0 |

Also committed as an in-suite case (`D-60 the identical axis reports a NON-EMPTY never-exemptible
partition against a hermetic mirror of the pre-27-56 commit`), which asserts the mirror really
pre-dates the production before believing anything it reports:

```
[D-60 axis, pre-fix mirror ac6653c] regions=652 skipped=0 SILENT-no-grant=560 module-grant-loader-none=0
```

**560 of 652.** `27-55` recorded its own count of **1 of 72** as thin and stated rather than
presented as a margin; this one is not thin, and the difference is that the axis crosses the defect's
own dimension (the key spelling) rather than meeting it incidentally.

### 10. MUTATION CONTROL — the pin is proven able to FAIL

In a scratch copy, the nested production was reverted **alone** (`blockHeaderAt`'s introduction 2 put
back onto `KEY_LINE`, everything else byte-identical) **and the copy was rebuilt with `tsc`**.

**The harness premise was asserted first.** vitest resolves the test file's `./frontmatter.js` import
to the **committed `.js`**, so a mutation applied only to the `.ts` mutates nothing the suite can see.
Before running the suite, the mutated build was probed directly and confirmed to return
`{"ok":true,"value":false}` for V1–V4. This is the eighth instance in this phase of the
"assert the verification harness's own premise" lesson.

**And the control was itself controlled.** An UNMUTATED scratch copy was run first, because the copy
has no `.git` and nine cases read `git ls-files` / `git archive`:

| run | cases red |
|---|---|
| unmutated scratch copy (harness baseline) | **9** — all of them `git`-dependent, red for a copy reason and not a code reason |
| mutated scratch copy | **15** |
| **attributable to the mutation** | **6** |

The six, by name:

1. `D-60 V1-V4 — a quoted, dotted, digit-leading or space-containing nested key carries a header …`
2. `D-60 V6 encoding — a multi-byte nested key and a combining-mark nested key …`
3. `D-60 the key-end disposition — the key ends at the FIRST colon carrying a separation …`
4. `D-60 the production is reached at EVERY position the recogniser knows about — adversarial pass (a) …`
5. `D-52 loader differential — every loader-accepted cell of a GENERATED corpus agrees with a real YAML 1.2 loader …`
6. `D-60 the derived key-spelling x indicator x position axis — every loader-accepted cell agrees …`

One failure message, quoted, showing the case names its own assertion:

```
AssertionError: NEVER EXEMPTIBLE: the module read a live grant as `carries no grant`. This is the
direction the whole phase exists to close and no reason may be written for it.
```

Had the naive count of **15** been reported, it would have overstated the control by more than
double. Recorded because the overstatement was available and was measured away.

### 11. The expressibility floor, before and after, measured by running it

| | ledger family rows derived | expressible | outside the generator's shape space |
|---|---|---|---|
| before | **11** | 8 | 3 (d1, d2, d3) |
| after | **12** | **9** | 3 (d1, d2, d3) |

```
WR-01 expressibility floor — ledger family rows derived 12 | expressible 9 (G3, family (a), family (b), A, B, C, F, G, G2) | outside the generator's shape space 3 (d1, d2, d3)
```

**The floor did its job unprompted, and that is the fact worth recording.** The G3 ledger row landed
with task 1's fix, and the floor immediately went **red by name** — `a failure family named in the
module's ledger with NO axis-member combination that builds it` — before any corpus member was added.
`AXIS_KEY_LINE_BASE` grew **22 → 23** and the derived key-line axis **49 → 50**, both by the same
identity the file already asserts.

### 12. ADVERSARIAL PASS (a) — which set of nested keys does the production ENUMERATE, and at which positions is it asked?

**The positions are enumerated from the code, not remembered.** `blockHeaderAt` is called at exactly
**two** sites (`scripts/frontmatter.ts:1936` the block-sequence item path, `:2009` the continuation
path). The third header position — the top-level key line — asks `BLOCK_INDICATOR` directly and its
key is `KEY_LINE`'s by contract, so the nested production is correctly *not* asked there.

| probe | shape | result |
|---|---|---|
| a1 | continuation at depth 1 | grants |
| a2 | two levels down (`  a:` / `    b c: >-`) | grants |
| a3 | after a sibling mapping key (`  a: Read` / `  b.c: >-`) | grants |
| a4 | immediately after another block scalar's content | grants |
| a5 | inside a block-sequence item's compact mapping | grants |
| a6 | inside a **compact nested** sequence (`  - - a b: >-`) | grants; loader REJECTS the document |
| a7 | inside a flow collection | **NOT** recognised — the flow gate holds; byte-identical pre and post; loader REJECTS |

**Pass (a) found nothing new**, and is recorded with its question and its shapes anyway. All seven are
committed as cases.

### 13. ADVERSARIAL PASS (b) — what is the production's INPUT assembled from?

Walked one line from the raw block into the recogniser and asked what each stage had already consumed:

1. `raw.trim()` (continuation path) — removes leading **and** trailing whitespace using
   `String.prototype.trim`'s alphabet (Unicode WhiteSpace ∪ LineTerminator), which is **wider than
   this module's own declared `[ \t]` class**.
2. `indentOf(raw)` counts leading `[ \t]` only; a tab counts as 1.
3. `SEQ_ITEM` (item path) — the dashes are consumed before `blockHeaderAt` sees the text.
4. `stripComment` has **not** run: the header is recognised first (D-57), so a `#` inside the key text
   is intact.
5. `stripFencedBlocks` is no longer applied to the frontmatter region at all (D-53).

| probe | shape | module (post) | loader |
|---|---|---|---|
| b1 | NBSP before the key | grants; key text `a b` | `{" a b"=>…}` — key text differs by one character |
| b2 | NBSP after the indicator | grants | **REJECT** |
| b3 | ZWNBSP after the indicator | grants | **REJECT** |
| b4 | TAB indentation on the header line | grants | **REJECT** |
| b5 | `#` inside a bare key (`a#b`) | grants | `{"a#b"=>…}` — agrees |
| b6 | `#` inside a quoted key (`"a #b"`) | grants | `{"a #b"=>…}` — agrees |
| b7 | compact nested sequence | grants | **REJECT** |
| b8 | trailing spaces after the indicator | grants | agrees |
| b9 | CRLF on the header line | grants | agrees |
| b10 | `' ': >-` (a whitespace-only quoted key) | grants | `{" "=>…}` — agrees |

**Finding, stated as OPEN rather than closed here.** The production's input has already had
`String.prototype.trim`'s Unicode whitespace set removed from both ends, and that alphabet is wider
than the `[ \t]` class this module declares. Two measured consequences: b1, where the module's
flattened key text differs from the loader's by one character on a document the loader **accepts**;
and b2/b3, where the module sees a clean indicator on documents the loader **rejects**.

**It is not a new defect and not this plan's.** `raw.trim()` is byte-unchanged and fed `KEY_LINE`
identically before D-60 — measured: b1's pre-fix flattened value is already `a b: >- Read,` with the
NBSP gone. Neither consequence is in the silent-no-grant direction: b1 moves a value by one character
without moving the grant, and b2/b3/b4/b7 make the module *more* willing than the loader on documents
no platform loads, which is over-refusal at the gate rather than a bypass. Owner named below.

### Still OPEN, with a named owner

| Item | Measurement | Owner |
|---|---|---|
| **`raw.trim()`'s alphabet is wider than the module's declared `[ \t]` class** | b1 (value differs by one character on a loader-ACCEPTED document), b2/b3 (module recognises an indicator on loader-REJECTED documents). Pre-existing, byte-unchanged by this plan, never in the silent-no-grant direction | **a later round** — decide whether the continuation path's trim should use the module's declared class (D-50's `firstOutsideDeclaredWs` already exists for the delimiter scan) and take the repository-wide value map before and after |
| **`AXIS_HEADER_POSITION` has 3 members and does not reach a compact nested sequence** | Covered instead by probe a6, which the loader rejects anyway | **a later round** — add the member if a loader-accepted spelling of it is found |
| **`27-55`'s two open items** (the union axis's ORDERING arm, and its 1-of-72 mirror count) | Untouched by `27-56` | **carried, unchanged** |
| **`27-49` WR-04 residual, `27-50` R1 residual, `27-53` fence-classifier floor, `toggle[1]` sensitivity** | Untouched by `27-56`; it changed no exemption machinery, no fence classifier and no toggle | **carried, unchanged** |
| **KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found`** | Not promoted by this plan | **the next verification round** (D-58 item 4 — an executing plan never promotes a row because its own tasks targeted that requirement's defect) |

### A harness-premise note worth carrying, found by this plan

**This repository's vitest intercepts console output, so every `console.log` this file calls for a
"PRINTED, never silent" skip is invisible on a default `npx vitest run`.** Measured: the D-52 corpus
dump (`GRUGOPS_D52_DUMP_CORPUS`) and the WR-01 floor's summary line both produce **zero** lines
without `--disableConsoleIntercept` on vitest 4.1.8. The prints are real and reappear with that flag.
The D-60 corpus dump added by this plan therefore writes to a **caller-named file** rather than to
stdout, so a dump that cannot be seen cannot be mistaken for a dump that happened. The existing
`console.log`-based skips are left as they are (changing them is out of this plan's scope) and are
recorded here so the next round does not read "PRINTED" as "visible".

### Specless-probe accounting for this plan

**1 probe row == 1 authored `explicit` + 0 backstop + 0 unresolved + 0 dismissed** — KIT-03 encoding
(key equality and key length inside the nested-key production are decided in ONE declared unit,
measured against the loader for a multi-byte key and a combining mark). Authored as a plain string in
`must_haves.truths` and carrying a case (`D-60 V6 encoding`). Round equality is stated once, in `27-61`.

### The regression suite is a FLOOR

`npx vitest run --exclude '**/scripts/e2e/**'` reports **1312 passed | 2 skipped | 0 failed**. That is
a floor and not the closure evidence. The closure evidence is the gate plant moving exit 0 → exit 1 on
both distribution twins, the 560-of-652 pre-fix-mirror non-circularity result, the mutation control
with its own control, and the two adversarial passes above.

---

## From 27-57 — CR-02: a legal YAML node PROPERTY stood in front of the block indicator (round 11)

**Class.** Not the predicate's conditions (D-54), not its positions (D-57), not whose question it was
answering (D-60). **Something the grammar permits stood IN FRONT of the thing the authority
recognises.** YAML 1.2 § 6.9 lets a node's properties — its tag and/or its anchor — precede the node's
content, so the text `blockHeaderAt` handed `BLOCK_INDICATOR` began with the property. The constant —
correctly — did not match, `block` stayed false, the scalar's literal content reached `stripComment`,
and a leading `#` deleted the rest of the line: **D-57's exact mechanism, one property over.**

And the refusal arm did not catch it either. `startsWithReference` was asked at offset 0 of the
physical line and at each flow fragment; a BLOCK mapping's separator introduces a node start too, and
nobody asked. So the document did not fail red — it **succeeded with no grant**.

Loader column throughout: `/usr/bin/ruby -ryaml`, **ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1**.
Pre-fix build = commit `6189744` (the wave-2 build). Post-fix build = commit `6e25695`.

### 1. RED, against the wave-2 build, with both columns

Every row is `---` / `name: x` / `<region>` / `---`. Content line is
`Read, # x, Agent(grugops-orchestrator)` throughout, abbreviated `Read, # x, Agent(o)` in the table.

| Row | region | module (pre-fix) | `/usr/bin/ruby -ryaml` |
|---|---|---|---|
| A anchor, implicit nested key | `tools:` / `  nested: &a >-` / content | `{"ok":true,"value":false}` | `{"tools"=>{"nested"=>"Read, # x, Agent(o)"}}` |
| B shorthand tag, implicit nested key | `tools:` / `  nested: !!str >-` / content | `{"ok":true,"value":false}` | `{"tools"=>{"nested"=>"Read, # x, Agent(o)"}}` |
| F anchor, explicit block-mapping VALUE | `tools:` / `  ? k` / `  : &a >-` / content | `{"ok":true,"value":false}` | `{"tools"=>{"k"=>"Read, # x, Agent(o)"}}` |
| Q anchor, explicit block-mapping KEY | `tools:` / `  ? &a >-` / content / `  : v` | `{"ok":true,"value":false}` | `{"tools"=>{"Read, # x, Agent(o)"=>"v"}}` |
| T tag THEN anchor | `tools:` / `  nested: !!str &a >-` / content | `{"ok":true,"value":false}` | `{"tools"=>{"nested"=>"Read, # x, Agent(o)"}}` |
| T2 anchor THEN tag | `tools:` / `  nested: &a !!str >-` / content | `{"ok":true,"value":false}` | `{"tools"=>{"nested"=>"Read, # x, Agent(o)"}}` |
| R2 the bare non-specific tag | `tools:` / `  nested: ! >-` / content | `{"ok":true,"value":false}` | `{"tools"=>{"nested"=>"Read, # x, Agent(o)"}}` |
| T3 TWO anchors (YAML forbids) | `tools:` / `  nested: &a &b >-` / content | `{"ok":true,"value":false}` | **REJECT** *did not find expected key while parsing a block mapping* |
| R CONTROL, an alias the strip cannot handle | `tools:` / `  nested: *a >-` / content | `{"ok":true,"value":false}` | **REJECT** *did not find expected key while parsing a block mapping* |
| P CONTROL, a BARE header + anchor | `tools:` / `  &a >-` / content | `{"ok":false,"reason":"`&a >-` uses a YAML anchor or alias, …"}` | `{"tools"=>"Read, # x, Agent(o)"}` |
| S the block-SEQUENCE item + anchor | `tools:` / `  - &a >-` / content | `{"ok":false,"reason":"`- &a >-` uses a YAML anchor or alias, …"}` | `{"tools"=>["Read, # x, Agent(o)"]}` |
| M1 CONTROL, sigil MID-scalar | `tools: Read & Write, Agent(x)` | `{"ok":true,"value":true}`, `["x"]` | `{"tools"=>"Read & Write, Agent(x)"}` |
| M2 CONTROL, sigil on a continuation line | `description: see` / `  R&D *notes* here` | `{"ok":true,"value":false}`, value `see R&D *notes* here` | `{"description"=>"see R&D *notes* here"}` |
| M3 CONTROL, sigil inside a block scalar | `tools: >-` / `  Read, &a *b !c, Agent(x)` | `{"ok":true,"value":true}`, `["x"]` | `{"tools"=>"Read, &a *b !c, Agent(x)"}` |

**SEVEN live silent no-grants on loader-ACCEPTED documents** (A, B, F, Q, T, T2, R2). Two further
silent successes (T3, R) on documents libyaml **rejects outright** — "carries no grant" over a
document that cannot be read at all, which is this module's founding failure.

### 2. GREEN, against the post-fix build, same table

A, B, F, Q, T, T2 and R2 all move to `{"ok":true,"value":true}`, and `grantedAgentNames` returns
exactly `["grugops-orchestrator"]` for each. T3 and R move from the SILENT success arm to the **LOUD**
refusal arm, each naming its own line. P, S, M1, M2 and M3 are **byte-identical**, including P's and
S's reason strings.

**Rows S and T adjudicated, and no grant claim is made where the module and the loader differ.** The
loader ACCEPTS `  - &a >-` and reads the grant (`{"tools"=>["Read, # x, Agent(o)"]}`); this module
REFUSES it, on both builds, byte-identically. That disagreement is in the **LOUD** direction and it is
the same disposition control P records: at a bare header and at a sequence item the sigil IS at offset
0 of the node, so the module's standing anchor/alias refusal reaches it first — which is precisely the
contrast that proves the finding is about the introduction set and not about the sigil test. T and T2
(one tag and one anchor, either order) are loader-ACCEPTED and now grant; T3 (two of a kind) is
loader-REJECTED and is left unstripped so it fails loud.

### 3. The end-to-end reproduction, REPLAYED ON A HERMETIC MIRROR AND INVERTED

The verifier's own method, reproduced rather than reinvented: `git archive <commit>` into a temp dir,
the plant written into the **EXISTING** `allowed-tools:` key of **both** distribution twins of the
non-coordinator `map` skill — `.claude/skills/grugops-map/SKILL.md` and `skills/map/SKILL.md` — never
by adding a second allow-list key, and the real `node scripts/check-foundation-guards.js` run against
the mirror with `CHECK_ROOT` pointed at it.

The round-10 reproduction's exact planted text:

```
allowed-tools:
  nested: &a >-
    Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)
```

| Spelling | pre-fix `6189744` | post-fix `6e25695` |
|---|---|---|
| anchor / implicit nested key (**the round-10 reproduction**) | `:: exit=0 :: planted 2/2 :: one allow-list key :: twins named 0/2 :: ALL CHECKS PASSED` | `:: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2 :: 1 CHECK(S) FAILED` |
| shorthand tag / implicit nested key | `:: exit=0 :: planted 2/2 :: one allow-list key :: twins named 0/2 :: ALL CHECKS PASSED` | `:: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2 :: 1 CHECK(S) FAILED` |
| anchor / explicit block-mapping VALUE | `:: exit=0 :: planted 2/2 :: one allow-list key :: twins named 0/2 :: ALL CHECKS PASSED` | `:: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2 :: 1 CHECK(S) FAILED` |
| anchor / explicit block-mapping KEY | `:: exit=0 :: planted 2/2 :: one allow-list key :: twins named 0/2 :: ALL CHECKS PASSED` | `:: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2 :: 1 CHECK(S) FAILED` |
| CROSS with `27-56`: anchor behind a QUOTED nested key `"a b": &a >-` | `:: exit=0 :: planted 2/2 :: one allow-list key :: twins named 0/2 :: ALL CHECKS PASSED` | `:: exit=1 :: planted 2/2 :: one allow-list key :: twins named 2/2 :: 1 CHECK(S) FAILED` |

**The round-10 end-to-end reproduction is INVERTED: exit 0 → exit 1.**

Verbatim failure block (identical for all five spellings):

```
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-map/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
skills/map/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
```

**Twins named, counted over the FAILURE block only: 2.** This ledger's recorded near-miss from
`27-54` is honoured mechanically: the extractor takes the FAIL stanza alone and stops at the next
guard heading, `PASS`/`WARN` line or blank line, because on a **passing** run the guard names those
same two paths in ordinary `PASS  … pointer-sized` lines and a whole-transcript count would report
`2` for a green gate.

### 4. THE HARNESS'S OWN PREMISE, ASSERTED — three controls in the same session

This round's record shows the probe's oracle producing a false result in six instances across four
straight rounds, so the plant is never believed on its own.

| Control | question it answers | pre-fix | post-fix |
|---|---|---|---|
| (a) a one-line plain grant on both twins | can this probe SEE a grant at all? | **exit 1**, twins named 2/2 | **exit 1**, twins named 2/2 |
| (b) an unplanted mirror | is the plant what moved it? | **exit 0** | **exit 0** |
| (c) the same YAML SHAPE with a harmless tool list (`# x, WebFetch`) | is the shape alone what reds the gate? | **exit 0** | **exit 0** |

Control (c) is the one that matters most here: it is byte-for-byte the winning plant with the grant
token swapped for `WebFetch`, and it stays green on **both** builds — so the post-fix red is the
grant being read, not the anchor being noticed.

### 5. The loader column PER PLANT

A plant nobody checked against a loader is a claim, not evidence. Every planted twin was loaded with
`/usr/bin/ruby -ryaml` and its `allowed-tools` value quoted:

```
anchor / implicit nested key
  .claude/skills/grugops-map/SKILL.md -> {"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}
  skills/map/SKILL.md                 -> {"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}
shorthand tag / implicit nested key
  both twins -> {"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}
anchor / explicit block-mapping VALUE
  both twins -> {"k"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}
anchor / explicit block-mapping KEY
  both twins -> {"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"=>"v"}
CROSS with 27-56, quoted nested key
  both twins -> {"a b"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}
CONTROL (a) one-line plain grant
  both twins -> "Read, Write, Bash, Glob, Grep, Agent(grugops-orchestrator)"
CONTROL (c) same shape, harmless list
  both twins -> {"nested"=>"Read, Write, Bash, Glob, Grep, # x, WebFetch"}
```

### 6. The `UNKNOWN - verify` platform bound, carried forward VERBATIM

Whether **Claude Code itself** honours a mapping under an allow-list key as a tool grant was **NOT**
confirmed against the platform. That stays `UNKNOWN - verify`; **no live platform escalation is
claimed here**. The finding stands on this module's own stated contract — the token is in the loaded
value of the allow-list key and the guard read it as a no-grant, which is the guard's own failure
regardless of what the platform does with the mapping.

### 7. The gate on the REAL tree, and the sibling gates

`node scripts/check-foundation-guards.js` → **exit 0**, `ALL CHECKS PASSED` on the real, unmodified
tree after every plant was cleaned up (each plant lives in its own `mktemp` mirror, deleted at the end
of its own row). `node scripts/adapters-freshness.js` → exit 0 (17 adapters, 0 byte differences).
`node scripts/coordinator-resolution-precheck.js` → exit 0. `npm run freshness` → exit 0 (32 committed
`.js` match a fresh `tsc` rebuild). `npx tsc --noEmit` → exit 0.

### 8. The repository-wide value map

`git ls-files '*.md'` → **1172** files, parsed by the pre-fix build `6189744` and the post-fix build
and compared as full key/value maps: **0 moved, 0 new refusals, 0 lifted.** The strip's result is used
for exactly one thing — asking `BLOCK_INDICATOR` — and is discarded when the answer is no, so the only
reachable effect is that MORE headers are recognised, never that a value gets shorter.

### 9. The eight `mappingValueIndicator` position-gate rows, re-run

All **8** keep their recorded verdicts on the post-fix build, byte-identical to the pre-fix build,
including the two the loader reads as CONTENT (g7 `tools: see` / `  >-` → `see >- q,` and g8
`tools: see` / `  ? >-` → `see ? >- q,`) and the two the loader REJECTS (g5, g6).

### 10. The DERIVED property-form x introduction axis

Both axes are derived, neither transcribed. The property axis is candidate spellings **filtered
through** the module's own `NODE_PROPERTY_AT_NODE_START` (exported for this, on `SEQ_ITEM`'s and
`BLOCK_INDICATOR`'s recorded argument); the introduction axis is read out of the module's own
`HEADER_INTRODUCTIONS` declaration **at run time**, so a fifth introduction changes the axis length
and a builder missing for it fails by name.

```
D-61 axis differential [corpus 54a6d803a62cb0e4, ruby=2.6.10 psych=3.1.0 libyaml=0.2.1] —
28 generated cells (7 property forms x 4 introductions) + 48 union cells |
loader-rejected and SKIPPED 0 | adjudicated 76 | loud refusal arm 29 | name-set disagreements 0
```

| Fact | Value |
|---|---|
| `AXIS_NODE_PROPERTY_FORM` | **7** (none, anchor, shorthand tag, verbatim tag, bare non-specific tag, tag-then-anchor, anchor-then-tag), two-sided |
| `AXIS_HEADER_INTRODUCTION` | **4**, read from `HEADER_INTRODUCTIONS` at run time, two-sided |
| generated cells | **28**, asserted EQUAL to the product, distinct by `where` **and** by rendered region |
| three-fix UNION cells | **48** = 4 key spellings only `27-56` admits x 6 properties only `27-57` strips x 2 escape kinds only `27-55` region-resolves, count DERIVED |
| loader-rejected, PRINTED skip count | **0** |
| both never-exemptible partitions | **EMPTY** |
| loud refusal arm | **29** (5 bare-introduction property cells + 24 union sibling-escape refusals) |
| name-set disagreements | **0** |
| derivation liveness (property axis) | the same candidates filtered through a deliberately narrowed copy yield a strictly SHORTER axis |
| derivation liveness (introduction axis) | the builder map's keys are asserted set-equal to the names read from the module's source |

### 11. NON-CIRCULARITY, MEASURED against a hermetic pre-`27-57` mirror

```
[D-61 axis, pre-fix mirror 6189744] regions=76 skipped=0 SILENT-no-grant=43 module-grant-loader-none=0
```

**43 of 76** cells are live silent-no-grants on the build that shipped the defect; **0** post-fix. The
mirror's identity is asserted rather than trusted — the case fails by name if the archived build
already carries `HEADER_INTRODUCTIONS`.

### 12. TWO mutation controls, each with ITS OWN control — and the harness premise producing a FALSE result for the NINTH time

**The baseline first.** An UNMUTATED scratch copy of the same tree reports **11** red cases, every one
of them a case that shells out to `git ls-files` / `git archive`, red because the copy has no `.git`.
Every count below has that baseline subtracted, exactly as `27-56` recorded.

**THE NINTH INSTANCE OF THE HARNESS-PREMISE LESSON, AND IT WAS CAUGHT ONLY BY PROBING THE BUILD.** The
first attempt at mutation control 1 deleted the strip's call site. `tsc` then failed with
`error TS6133: 'stripNodeProperties' is declared but its value is never read`, emitted nothing, and
left the **unmutated** `scripts/frontmatter.js` in place. The suite duly reported the **same 11**
baseline failures — i.e. **0 attributable**, which would have been reported as "the pin cannot see
this mutation" and is entirely false. It was caught because the mutated build was probed DIRECTLY,
before the suite was believed: rows A/B/F/Q still granted, which a truly mutated build cannot do. The
mutation was rewritten to keep the symbol referenced (`split.node.length >= 0 ? split.node : strip(…)`)
so `tsc` emits, and the build-exit code is now checked. **Assert the harness's own premise — and
assert the BUILD STEP'S EXIT CODE, not only the harness's resolution path.**

| Control | mutation | build | red cases | baseline | **attributable** |
|---|---|---|---|---|---|
| 1 | the property strip reverted alone | exit 0, probe confirms A/B/F/Q now REFUSE | 14 | 11 | **3** |
| 2 | the fourth reference-refusal application point reverted alone | exit 0, probe confirms R and T3 return to the SILENT arm | 13 | 11 | **2** |

Control 1's three: `D-61 rows A, B, F, Q`, `D-61 the derived property-form x introduction axis`, and
the `D-52 loader differential` (whose corpus now carries the G4 member). One quoted failure, showing
the case naming its own assertion:

```
AssertionError: A implicit nested key + anchor: expected { ok: false, …(1) } to deeply equal { ok: true, value: true }
+   "reason": "`nested: &a >-` uses a YAML anchor or alias, or an unresolved YAML tag standing in front of one; …"
```

Control 2's two: `D-61 CONTROL R` and `D-61 the strip honours YAML's OWN BOUND`. One quoted failure:

```
AssertionError: the SILENT success arm is the one thing this must never be: expected true to be false
 ❯ scripts/frontmatter.test.ts  const alias = d61Doc(`tools:\n  nested: *a >-\n    ${D61_CONTENT}`)
```

**A finding worth recording from control 1.** With the strip reverted ALONE, rows A/B/F/Q do **not**
return to the silent no-grant arm — they go to the **LOUD** arm, because the fourth application point
now catches the property the strip no longer consumes. The two edits are complementary: the strip
turns a legal header into a grant, and the fourth application point guarantees that whatever the strip
cannot consume fails loud rather than quiet. Testing only their conjunction could not have said that.

### 13. The expressibility floor, measured before and after by RUNNING it

```
WR-01 expressibility floor — ledger family rows derived 13 | expressible 10
(G3, family (a), family (b), A, B, C, F, G, G2, G4) | outside the generator's shape space 3 (d1, d2, d3)
```

| Fact | before | after |
|---|---|---|
| ledger family rows derived | 12 | **13** |
| expressible (`inside`) | 9 | **10** |
| `AXIS_KEY_LINE_BASE` | 23 | **24** |

**The floor went RED BY NAME, unprompted, for the third consecutive round**, and it is recorded
because that is the whole point of the mechanism. With ledger entry thirteen landed and the
`EXPRESSED_BY` entry deliberately withheld, the floor reported:

```
AssertionError: a failure family named in the module's ledger with NO axis-member combination that
builds it — the corpus cannot express a defect the module has already shipped:
+   "G4  `tools:` / `  nested: &a >-` / `    Read,` / `    # x, Agent(o)`   a node property",
```

**The exemption list is UNCHANGED: 2 → 2**, membership asserted, in a case of this plan's own.

### 14. Adversarial pass (a) — AT WHICH POSITIONS is the strip even ASKED?

Asked of the FIXED build rather than declared closed once the reported rows went green. **It found
SEVEN further live silent-no-grants beyond the four the review named**, all closed by the same edit
rather than by seven additions. Each row's pre-fix column is the committed build `6189744`.

| Probe | pre-fix | post-fix | libyaml |
|---|---|---|---|
| a1 inside a sequence item's compact mapping | silent-no-grant | **GRANT** | `[{"k"=>"v","j"=>"Read, # x, Agent(o)"}]` |
| a2 two levels down | silent-no-grant | **GRANT** | `{"a"=>{"b"=>"Read, # x, Agent(o)"}}` |
| a3 after a sibling mapping key | silent-no-grant | **GRANT** | `{"a"=>"Read","b"=>"Read, # x, Agent(o)"}` |
| a4 after another block scalar's content | silent-no-grant | **GRANT** | `{"a"=>"Read","b"=>"Read, # x, Agent(o)"}` |
| a5 after `27-56`'s nested production (a quoted key) | silent-no-grant | **GRANT** | `{"a b"=>"Read, # x, Agent(o)"}` |
| a9 the explicit KEY form, two levels down | silent-no-grant | **GRANT** | `{"a"=>{"Read, # x, Agent(o)"=>"v"}}` |
| a10 a TAG on the explicit VALUE form, two levels down | silent-no-grant | **GRANT** | `{"a"=>{"k"=>"Read, # x, Agent(o)"}}` |
| a6 compact nested sequence item | LOUD | LOUD (byte-unchanged) | `[["Read, # x, Agent(o)"]]` |
| a8 the item path, property at offset 0 | LOUD | LOUD (byte-unchanged) | `["Read, # x, Agent(o)"]` |
| a7 inside a flow collection | not recognised | not recognised (byte-unchanged) | **REJECT** |

a6 and a8 are control P's argument at the positions the review did not name: on the item path the
property sits at offset 0 of the item's own node, so the standing anchor/alias refusal reaches it
first. The disagreement with the loader there is in the **LOUD** direction and no grant claim is made.

### 15. Adversarial pass (b) — what is the strip's INPUT ASSEMBLED FROM?

One line walked from the raw block through `raw.trim()`, `indentOf`, `SEQ_ITEM`'s dash consumption,
D-60's key/value split and the strip, asking at each stage what it has already consumed and whether
any stage can hand the strip a string whose offset 0 is not the node start it assumes.

| Probe | post-fix | libyaml | reading |
|---|---|---|---|
| b1 trailing space after the indicator | GRANT | grants | the split hands the strip the text intact |
| b2 trailing comment after the indicator | GRANT | grants | `BLOCK_INDICATOR` owns the comment tail, unchanged |
| b3 TAB between property and indicator | GRANT | grants | the declared `[ \t]` class covers the tab |
| b5 quoted key whose TEXT contains `: ` | GRANT | `{"a: b"=>…}` | D-60's self-delimiting quoted key, crossed |
| b8 indicator with a digit and a chomping marker | GRANT | grants | the indicator constant is untouched |
| b4 NBSP between property and indicator | **LOUD** | **REJECT** | pre-fix: silent-no-grant |
| b9 property butted against a flow opener | **LOUD** | **REJECT** | pre-fix: silent-no-grant |
| b10 two TAGS on one node | **LOUD** | **REJECT** | pre-fix: silent-no-grant; the one-of-each bound holds |
| b6 a property whose name ends in a colon (`&a: b >-`) | LOUD | `{nil=>"b >- Read,"}` | **byte-unchanged both builds — pre-existing, not D-61's** |
| b7 leading NBSP where the separation would be | silent-no-grant, value `nested: &a >- Read,` | `"nested: &a >- Read,"` | **the module's value EQUALS the loader's** |

**b7 is the finding, and it VINDICATES a choice rather than opening a gap.** `27-56` left OPEN that
`raw.trim()`'s alphabet (Unicode WhiteSpace ∪ LineTerminator) is wider than this module's declared
`[ \t]` class. D-61 therefore consumes the separation after a property with the **declared** class and
not with `String.prototype.trimStart`. Measured consequence: with a NBSP standing where the
separation after the key's colon would be, **neither libyaml nor this module sees a mapping entry**,
so the whole line is one plain scalar to both — and this module's flattened value is byte-identical to
libyaml's, `# …` dropped as a plain-scalar comment on both sides. Had the strip reached for
`trimStart`, the module would have read structure libyaml does not. The 27-56 open item is
**unchanged** and is carried, not closed.

**b6 is recorded and is NOT this plan's defect.** `tools:` / `  &a: b >-` is a document libyaml
ACCEPTS (as `{nil=>"b >- Read,"}`, carrying no grant) and this module REFUSES. The verdict is
**byte-identical on both builds**, so it is pre-existing; it is in the LOUD direction; and it is
carried with a named owner below rather than closed here.

### 16. The regression suite is a FLOOR, not the closure evidence

`npx vitest run --exclude '**/scripts/e2e/**'` reports **1324 passed | 2 skipped | 0 failed**. A green
suite proves nothing about a safety invariant. The closure evidence is the inverted end-to-end gate
replay with its three controls (§3, §4), the 43-of-76 pre-fix-mirror non-circularity result (§11), the
two mutation controls each with its own baseline (§12), and the two adversarial passes (§14, §15).

### 17. Still OPEN, with a named owner

| Item | Owner |
|---|---|
| `raw.trim()`'s alphabet is wider than the module's declared `[ \t]` class (pre-existing; D-61 declined to extend it to a new site, and b7 measures why) | a later round — carried from `27-56`, unchanged |
| `tools:` / `  &a: b >-` refuses where libyaml reads a no-grant value (pre-existing, byte-identical on both builds, LOUD direction) | a later round — decide whether a property whose name ends in a colon should be readable at all, and re-take the repository-wide value map |
| The block-sequence item and bare-header introductions REFUSE a property libyaml accepts and grants (control P / S / a6 / a8) — deliberate, byte-unchanged, and the contrast the diagnosis rests on | not open as a defect; recorded so a later round does not read it as one |
| `27-55` and `27-56`'s open items | carried, unchanged — `27-57` touched no exemption machinery, no fence classifier and no toggle |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4) |

---

## From 27-58 — WR-01 / WR-02 / IN-01: the block-scalar machinery measured from the wrong landmarks (round 11)

**Class.** Not the predicate's conditions (D-54), not its positions (D-57), not whose question it was
answering (D-60), not what stood in front of it (D-61). **The predicate was asked about the wrong
NUMBER.** A boundary can be at the right position, be asked the right question, and still be measured
from the wrong landmark — and a landmark that USUALLY coincides with the right one is the worst kind,
because it makes the corpus agree.

Loader column for every row below is `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 /
libyaml 0.2.1). The pre-fix build is the committed `17c1b58`; the post-fix build is this plan's.

### 1. RED — the three findings, measured on `17c1b58`

| Row | region | module (pre-fix) | loader |
|---|---|---|---|
| **W1** over-indented first content line | `tools:` / `  nested: >-` / `        Read,` / `    # x, Agent(o)` | **GRANT**, names `["grugops-orchestrator"]` | `{"nested"=>"Read,"}` — ACCEPTED, **no grant** |
| **W3** the same, one column less | `tools:` / `  nested: >-` / `      Read,` / `     # x, Agent(o)` | **GRANT**, names `["grugops-orchestrator"]` | `{"nested"=>"Read,"}` — ACCEPTED, **no grant** |
| **W7** the same at the TOP-LEVEL key line | `tools: >-` / `      Read,` / `  # x, Agent(o)` | **GRANT**, names `["grugops-orchestrator"]` | `"Read,"` — ACCEPTED, **no grant** |
| **B1** folded, a blank line inside | `tools: >` / `  Agent(alpha, ga` / (blank) / `  mma)` | names `["alpha","ga mma"]` — one **INVENTED** | `"Agent(alpha, ga\nmma)\n"` — the enumeration alphabet **REFUSES** the break |
| **B2** literal, a blank line inside (IN-01) | `tools: \|` / `  Agent(alpha, ga` / (blank) / `  mma)` | `"Agent(alpha, ga\nmma)"` — one break SHORT | `"Agent(alpha, ga\n\nmma)\n"` |
| **b4** the fold across a MORE-INDENTED line (found by this plan's own adversarial pass, post-blank-line build) | `tools: >-` / `  Agent(alpha, ga` / `    mma)` | names `["alpha","ga mma"]` — one **INVENTED** | `"Agent(alpha, ga\n  mma)"` — the enumeration **REFUSES** |

W1/W3/W7 are the direction the module's own doc block names **never exemptible** — a module grant the
loader does not have. B1 and b4 are the **D-09 / KIT-03** direction — a name the document does not
express, returned on the success arm.

### 2. GREEN — the same table on this build

| Row | module (post-fix) | verdict |
|---|---|---|
| W1 | `{ok:true,value:false}`, names `[]`, value `"nested: Read, "` | agrees with the loader; the one trailing space is the module's **pre-existing** flattening of a comment-only sibling line, byte-identical on both builds (control E2) |
| W3 | `{ok:true,value:false}`, names `[]` | agrees |
| W7 | `{ok:true,value:false}`, names `[]` | agrees |
| W2 (boundary, INSIDE) | `{ok:true,value:true}`, names `["grugops-orchestrator"]` | agrees — a line exactly **AT** the detected indent is inside |
| B1 | names **REFUSE** (`outside the legal character set`) | the LOUD arm, which is the loader-faithful answer; value `"Agent(alpha, ga\nmma)"` |
| B2 (`\|-`) | value `"Agent(alpha, ga\n\nmma)"` | **byte-equal to the loader** |
| b4 | names **REFUSE** | the LOUD arm |

### 3. The boundary, measured on BOTH sides (KIT-03's `boundary` probe row)

Detected content indentation **6**, one row per column:

| content line at | loader | module (post-fix) |
|---|---|---|
| 6 | `{"nested"=>"Read, # x, Agent(o)"}` — INSIDE | grant, names `["grugops-orchestrator"]` |
| 5 | `{"nested"=>"Read,"}` — OUTSIDE | no grant |
| 4 | `{"nested"=>"Read,"}` — OUTSIDE | no grant |

### 4. The explicit indentation digit — HONOURED, and the alternative REJECTED BY MEASUREMENT

`BLOCK_INDICATOR` has always matched `[0-9]` and nothing read it. Under the new threshold that stops
being free. The base the digit is added to is the **header line's own indent**, measured on eight rows
across all three positions a header can appear at:

```
tools: >-2 / `  a` / ` b`            -> "a,"                content indent 0+2 = 2
tools: >-2 / `    a` / `   b`        -> "  a,\n b"          content indent 0+2 = 2
tools: >-1 / `  a` / ` b`            -> " a,\n# b"          content indent 0+1 = 1
tools: / `  nested: >-2` / 6 / 5     -> "  Read,\n # x"     content indent 2+2 = 4
tools: / `  nested: >-2` / 4 / 3     -> "Read,"             content indent 2+2 = 4
tools: / `  nested: >-4` / 6 / 5     -> "Read,"             content indent 2+4 = 6
tools: / `  nested: >-1` / 6 / 5     -> "   Read,\n  # x"   content indent 2+1 = 3
tools: / `  - >-2` / 6 / 5           -> ["  Read,\n # x"]   content indent 2+2 = 4
```

**W5, the row that forces the disposition.** `tools:` / `  nested: >-2` / `      Read,` /
`     # x, Agent(grugops-orchestrator)` loads as
`{"nested"=>"  Read,\n # x, Agent(grugops-orchestrator)"}` — **the loader ACCEPTS it and its value
carries the grant.** Auto-detecting would put the content indent at 8, end the scalar at the line
indented 7 and return `Read,` alone: a **silent no-grant created by the fix for an over-inclusion**.
So the digit is read. Both orders § 8.1.1 permits are read (`>2-` and `>-2`, adjudicated). `>-0` and
`>-10` are documents the loader REJECTS outright (*"an indentation indicator equal to 0"*, *"did not
find expected comment or line break"*), so the reader returns `null` and the scalar auto-detects.

The reader is **derived** from `BLOCK_INDICATOR` rather than transcribed beside it: candidate
spellings are generated, filtered through the real constant, and the reader must agree with the
constant's own digit run on every survivor.

### 5. The indentation UNIT, and the tab measurement (KIT-03's `precision` / `backstop` probe row)

The unit is `indentOf`'s: a count of leading `[ \t]` characters, one column per character, a tab
counted as **ONE**. Both sides of the comparison are taken by that one helper from the raw line, so no
rounding, truncation or unit mismatch is possible — they are the same function of the same shape of
input. A tab **inside** an indentation run is not a case that has to survive, and that is a recorded
verdict rather than an assumption:

```
tools: >-                REJECT  found a tab character where an indentation space is expected
  Read,                          while scanning a block scalar
<TAB>  # x, Agent(o)

tools: >-                REJECT  the same error, tab on the FIRST content line
<TAB>Read, Agent(o)
```

There is **no loader value** for this module to agree or disagree with at either spelling. The
module's own answer for both is recorded (`{ok:true,value:true}`) rather than asserted correct.

### 6. The break-run rule, measured rather than derived from prose

`n` = the number of breaks between two content lines (one blank line between them is **two** breaks):

| | n=1 | n=2 | n=3 |
|---|---|---|---|
| folded `>` | `" "` | `"\n"` | `"\n\n"` |
| literal `\|` | `"\n"` | `"\n\n"` | `"\n\n\n"` |

**Leading** blanks are a different rule and the loader says so: before the first content line there is
no preceding line to fold against, so `k` leading blanks are `k` literal breaks in **both** styles
(`>-` / blank / `Read,` / `# x` -> `"\nRead, # x"`; `|-` -> `"\nRead,\n# x"`). The two arms are written
separately because they are two YAML rules; writing them as one would be a coincidence, not a
derivation.

**The fold is suppressed at a more-indented boundary** (§ 8.1.3: a more-indented line is
`s-nb-spaced-text` and the breaks either side of it are literal). Seven rows, break positions
byte-agreeing with the loader after the fix: `f1` normal/MORE, `f3` normal/MORE/normal, `f4`
normal/MORE/MORE, `f5` normal/normal (the fold **survives**), `f6` normal/blank/MORE, `f7`
normal/MORE/blank/normal, `f8` literal/normal/MORE.

### 7. The chomping spellings, adjudicated — divergence stated as a number

A break run still pending when the scalar ends is **discarded**, which is the `-` (strip) reading and
what the flush has always done.

| indicator | loader | module | agree? |
|---|---|---|---|
| `>` (clip) | `"Read, Agent(o)\n"` | `"Read, Agent(o)"` | trailing break only |
| `>-` (strip) | `"Read, Agent(o)"` | `"Read, Agent(o)"` | **yes** |
| `>+` (keep) | `"Read, Agent(o)\n\n"` | `"Read, Agent(o)"` | trailing breaks only |
| `\|` (clip) | `"Read, Agent(o)\n"` | `"Read, Agent(o)"` | trailing break only |
| `\|+` (keep) | `"Read, Agent(o)\n\n"` | `"Read, Agent(o)"` | trailing breaks only |

**Divergence: 3 of 5 spellings, and in every case it is a TRAILING run of line breaks and nothing
else.** A trailing break is a non-word character at the end of the value, outside every enumerated
region, so it can neither create nor destroy a `\bAgent\b` / `\bTask\b` boundary — the name sets agree
on all five. Recorded as a property of the flattener; changing it is a value-map re-cut this plan does
not take.

### 8. The gate, on a hermetic mirror — the WR-01 direction INVERTED

`git archive <commit>` into a temp dir, the plant written into the **EXISTING** `allowed-tools:` key of
**both** distribution twins of the non-coordinator `map` skill (`.claude/skills/grugops-map/SKILL.md`
and `skills/map/SKILL.md`), never by adding a second key, and the real
`node scripts/check-foundation-guards.js` run with `CHECK_ROOT` pointed at the mirror. Twins counted
over the **FAILURE block only**.

```
allowed-tools:
  nested: >-
        Read, Write, Bash, Glob, Grep,
    # x, Agent(grugops-orchestrator)

/usr/bin/ruby -ryaml -> {"allowed-tools"=>{"nested"=>"Read, Write, Bash, Glob, Grep,"}}
                        the loader's value carries NO grant
```

| build | result |
|---|---|
| pre-fix `17c1b58` | `:: exit=1 :: planted 2/2 :: twins named 2/2 :: 1 CHECK(S) FAILED` — a **FALSE RED** over a grant the loader does not express |
| post-fix HEAD | `:: exit=0 :: planted 2/2 :: twins named 0/2 :: ALL CHECKS PASSED` |

**Harness-premise controls, because a gate that goes green is exactly the result a broken harness also
produces:**

| control | pre-fix | post-fix |
|---|---|---|
| unplanted mirror | — | `exit=0 :: ALL CHECKS PASSED` |
| a plain one-line grant | — | `exit=1 :: twins named 2/2` — the probe can see a grant |
| **W6 — a GENUINE grant at the over-indented shape** (`        # x, Agent(o)` at the DETECTED indent; loader `{"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}`) | `exit=1 :: twins named 2/2` | `exit=1 :: twins named 2/2` — **the fix removes an over-inclusion, not a grant** |
| the same SHAPE with a harmless tool list (`# x, WebFetch`) | `exit=0` | `exit=0` — the shape alone is not what moves the gate |

**The earlier rounds' plants are RE-MEASURED on this build, never inherited.** All seven still red the
gate at `exit=1 :: planted 2/2 :: twins named 2/2`: `27-52`'s G (nested mapping value), `27-56`'s G3
(a nested key YAML allows), and `27-57`'s five (anchor/implicit key — the round-10 reproduction —
shorthand tag/implicit key, anchor/explicit VALUE, anchor/explicit KEY, and the `27-56` cross with a
quoted nested key).

**No gate inversion is claimed for WR-02.** The blank-line drop changes the NAME SET, not the grant
boolean, so the foundation gate does not move on it and none is manufactured. Its evidence is the
module-level RED/GREEN table (§1, §2) and mutation control 2 (§10).

### 9. Repository-wide value map, taken separately per edit

`git ls-files '*.md'`, every tracked markdown file parsed and its whole flattened value map compared.

| after | files | moved | new refusals | lifted | shorter |
|---|---|---|---|---|---|
| task 1 (the threshold + the digit) | **1173** | **0** | **0** | **0** | **0** |
| task 2 (the blank line + the fold suppression + the block-run trim) | **1173** | **0** | **0** | **0** | **0** |
| both, against the pre-plan baseline | **1173** | **0** | **0** | **0** | **0** |

**The list of files whose value got SHORTER is EMPTY**, so the "each shortened file confirmed as a
move toward the loader" obligation is discharged over a set of size zero, which is stated as the
number it is rather than as a pass.

### 10. Two mutation controls, one per fix — each with its own baseline

The scratch copy's **unmutated** baseline is **11 red**, every one a case shelling out to
`git ls-files` / `git archive`, red because the copy has no `.git`. Reporting raw totals would have
overstated both controls. `27-56` and `27-57` recorded this; it is paid forward.

| control | build exit | direct probe of the mutated build | raw red | **attributable** |
|---|---|---|---|---|
| **1 — task 1's threshold reverted** (`indent > cur.blockIndent`) | **0** | W1 `hasSpawnGrant {ok:true,value:true}`, names `["grugops-orchestrator"]` — genuinely mutated | 15 | **4** |
| **2 — task 2's blank-line handling reverted** | **0** (see below) | B1 names `["alpha","ga mma"]` — genuinely mutated; **W1 still `false`**, so task 1 is independent | 16 | **5** |

Control 1's attributable cases: `D-62 row W1`, `D-62 rows W2 / W3`, `D-62 rows W4 / W6`, and the
**D-52 loader differential** itself. Quoted failure:

```
FAIL scripts/frontmatter.test.ts > D-62 row W1 — a block scalar ends at its OWN detected content
     indentation, so the over-included sibling line stops granting
AssertionError: expected { ok: true, value: true } to deeply equal { ok: true, value: false }
```

Control 2's attributable cases: `D-62 row B1`, `D-62 row B2 (IN-01)`, `D-62 row B3`, and both
adversarial-pass cases. Quoted failure:

```
FAIL scripts/frontmatter.test.ts > D-62 row B1 — a folded scalar's blank line is a LINE BREAK, so the
     module stops inventing a name
AssertionError: the loader's value carries a line break the enumeration alphabet REFUSES, so the
module must refuse too — the LOUD arm is the correct answer here, not a name set:
expected true to be false
```

**THE HARNESS PREMISE PRODUCED A FALSE RESULT FOR THE TENTH TIME IN THIS PHASE — AND IT WAS CAUGHT.**
Mutation 2's first spelling was `if (cur !== null && cur.block && false)`. `tsc` failed with
`error TS18047: 'cur' is possibly 'null'`, **emitted nothing**, and the direct probe read the
**unmutated** `.js`: B1 still refused, which a truly mutated build cannot do. The suite would have
reported the 11-case baseline — **0 attributable**, entirely false. `27-57`'s lesson ("assert the
BUILD STEP'S EXIT CODE, not only the harness's resolution path") is what caught it, and it advances
one notch: **assert the exit code AND probe the built artifact directly, because a mutation can also
compile and simply not bite.**

**And the two edits are independent, which only per-edit reverts can show.** With task 2 reverted,
W1 still returns `{ok:true,value:false}` — task 1's threshold holds on its own. With task 1 reverted,
the B rows stay green. Testing only their conjunction could not have said either.

### 11. Adversarial pass (a) — WHICH LINES does the open-scalar fact now reach?

Asked of the **fixed** build. Every shape the paragraph-break skip used to consume, classified:

| shape | loader | module | verdict |
|---|---|---|---|
| a1 empty line, top-level folded | `"Agent(alpha, ga\nmma)"` | identical | **inside**, agrees |
| a2 spaces-only line MORE indented than the content indent | `"Read,\n    \nAgent(o)"` | `"Read,\nAgent(o)"` | inside; diverges in the **whitespace-only content** the module's per-line trim cannot express |
| a3 spaces-only line LESS indented | `"Read,\nAgent(o)"` | identical | **inside**, agrees |
| a4 **NBSP**-only line | **REJECT** *could not find expected ':'* | `"Read,\nAgent(o)"` | the pre-existing `raw.trim()` wide-alphabet item, reaching a NEW site — carried OPEN below |
| a5 **ZWSP**-only line | **REJECT** | **REFUSES** — `cannot read … as a frontmatter key line` | agrees, in the **LOUD** direction; D-50's asymmetry working at a site it did not anticipate |
| a6 blank while NO key is open | `"Read, Agent(o)"` | identical | byte-unchanged |
| a7 blank while a key is open but NOT a block scalar | `"Read,\nAgent(o)"` | `"Read, Agent(o)"` | byte-unchanged on both builds — **outside** the change's scope, carried OPEN below |
| a8 the scalar is a SEQUENCE ITEM | `["Agent(alpha, ga\nmma)"]` | `"Agent(alpha, ga\nmma)"` | agrees |
| a9 the scalar is a NESTED mapping value | `{"nested"=>"Agent(alpha, ga\nmma)"}` | `"nested: Agent(alpha, ga\nmma)"` | agrees |
| a10 a blank, then the line that ENDS the scalar | `"Read,"` | identical | agrees |
| a11 a blank between TWO block scalars of one key | `{"a"=>"Read,","b"=>"Agent(o)"}` | `"a: Read, b: Agent(o)"` | agrees |
| a12 a blank inside a scalar with an EXPLICIT digit | `"Read,\nAgent(o)"` | identical | agrees — the two tasks meet here |

### 12. Adversarial pass (b) — what is the JOIN'S INPUT assembled from?

One folded scalar walked from its header through every content and blank line into the join, the
flush and the enumeration, asking at each hop what the next stage assumes about separators.

**It found a LIVE residual the reported rows did not reach, and it is closed by the same construct**
(row b4 in §1, the seven `f` rows in §6): the fold must be **suppressed at a more-indented boundary**.
The join's input is not "the previous body plus one break" — it is the previous body, the **count** of
breaks, and **whether either side of the boundary is more indented than the content indentation**.
Two of those three facts did not exist before this plan.

**One further finding, recorded and NOT closed here.** At the flush hop, the run assembly's `.trim()`
was eating the leading line breaks the loader itself expresses (`tools: >-` / blank / content). It is
now scoped to **non-block** runs, where it is byte-unchanged. On a block-owned run it was **provably a
no-op** before D-62 (every content line arrives `raw.trim()`ed and an `intro` is a key or one
punctuation character), so nothing else moved: the repository-wide map after that edit is 1173 files,
0 moved. The name sets on that row agree on **both** builds — the break stands outside the enumerated
region — so this closes a **value** divergence and no name was invented; that is stated exactly rather
than claimed as a rescue.

### 13. What the corpus member does and does not buy — stated because it would otherwise read as more

The **G6** key-line member puts a blank-line-inside-a-block-scalar into the generated corpus, which no
member could spell before (the builder emits every continuation from `indent` + text and never emits
an empty one). But the D-52 loader differential is **NOT** what catches mutation 2: on the G6 cell both
builds grant and both refuse the enumeration — for different reasons — so the differential sees no
disagreement. **Making a construct expressible is not the same as making every defect in it
detectable.** The D-62 rows are what catch it, and that is recorded rather than left for a later round
to discover by finding a green differential over a live defect.

### 14. The expressibility floor did its job UNPROMPTED for the FOURTH consecutive round

Both family rows landed with their fixes and this case went red **by name** before either corpus
member existed:

```
AssertionError: family rows derived from scripts/frontmatter.ts's header:
  … G5  `tools:` / `  nested: >-` / `      Read,` / `    # x, Agent(o)`   an over-indented first line
    G6  `tools: >` / `  Agent(alpha, ga` / `` / `  mma)`   a blank line inside an open scalar
: expected 15 to be 13
```

Ledger family rows **13 -> 15**, expressible **10 -> 12**, `AXIS_KEY_LINE_BASE` **24 -> 26**. The
`outside`-the-shape-space set is **unchanged at 3** (`d1`, `d2`, `d3`), so the exclusion did not grow
into a place to hide a new family.

**The order argument, in its mirror image.** `27-52`, `27-56` and `27-57` added their members only
after closing the family, because a corpus shape for a live **silent no-grant** would put the
differential's never-exemptible `silentWhileLoaderGrants` direction into failure. G5 is the OPPOSITE
direction — a module grant the loader does not have — so a shape before the fix would have failed the
differential's OTHER never-exemptible direction. Same conclusion by the mirror-image argument.

### 15. The regression suite is a FLOOR, not the closure evidence

`npx vitest run --exclude '**/scripts/e2e/**'` reports **1337 passed | 2 skipped | 0 failed**. A green
suite proves nothing about a safety invariant. The closure evidence is the inverted gate replay with
its four controls (§8), the seven re-measured earlier plants (§8), the two mutation controls each with
its own baseline and its own direct probe (§10), the two adversarial passes (§11, §12), and the
per-edit repository-wide value maps (§9).

### 16. Still OPEN, with a named owner

| Item | Owner |
|---|---|
| **A blank line inside an open PLAIN (non-block) scalar is still folded to a space.** `tools: Agent(alpha, ga` / (blank) / `  mma)` returns names `["alpha","ga mma"]` where the loader expresses `"Agent(alpha, ga\nmma)"`, whose enumeration REFUSES — the **invented-name direction, on a loader-ACCEPTED document**. NOT closed here: the fix lives in the continuation-fold path, not in the block-scalar construct D-62 scopes itself to, and widening the paragraph-break skip for lines outside an open block scalar is a prohibition this plan carries. **Pinned at its current answer by a named case**, so a later round cannot read the green suite as coverage of it. | a later round — the continuation fold, with its own repository-wide value map |
| A whitespace-only line MORE indented than the content indentation is CONTENT to the loader (`"Read,\n    \nAgent(o)"`) and a break run to this module (`"Read,\nAgent(o)"`). Whitespace only; the module's per-line `raw.trim()` cannot express it. | not open as a defect; recorded so a later round does not read it as one |
| Trailing break runs: `clip` and `keep` chomping keep breaks this module discards (3 of 5 spellings, §7). Trailing non-word characters only; the name sets agree on all five. | a later round, if a consumer ever needs the trailing break — a value-map re-cut |
| `raw.trim()`'s alphabet is wider than the module's declared `[ \t]` class — and it now has a NEW consequence (a4: an NBSP-only line inside an open scalar becomes a break run on a document libyaml REJECTS). Byte-different from the pre-fix build, same arm (a value on an unreadable document). | a later round — carried from `27-56` / `27-57`, now with a second site |
| `tools:` / `  &a: b >-` refuses where libyaml reads a no-grant value (pre-existing, byte-identical, LOUD direction) | a later round — carried from `27-57`, unchanged |
| `27-55`, `27-56` and `27-57`'s open items | carried, unchanged — `27-58` touched no exemption machinery, no fence classifier, no toggle and no introduction set |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4 — an executing plan never promotes a row because its own tasks targeted that requirement's defect) |

## From 27-59 (round 11, WR-01 + WR-03) — the corpus grows by DERIVATION, and the round's fixes are swept one at a time

`27-59` changes **no shipped behaviour**. It touches `scripts/frontmatter.test.ts` and
`scripts/fixtures/frontmatter-singleline-pre-d54.json` only. No production source file was edited, no
dependency was added, `package.json` is byte-unchanged, and the exemption list is the same length
before and after.

### 1. The corpus cardinalities, before and after

| | before | after | how |
|---|---|---|---|
| `AXIS_KEY_LINE_BASE` (hand-written base shapes) | **26** | **26** — DELIBERATELY UNMOVED | the widening is a derivation, not one row per reported family |
| header-derived shapes | (n/a) | **321** | 18 non-declaring pass-through + 4 nested keyed shapes x (4 key spellings x 3 properties x 3 indicators x 2 siblings) + 1 sequence-item shape x (1 x 1 x 3 x 2) + 3 top-level shapes x (1 x 1 x 3 x 1) |
| derived key-line axis (after the quote crossing) | **53** | **348** | `(321 - 9) + 9 x 2 styles x 2 escapes` |
| enumerated cells | **2,544** | **16,704** | `348 x 6 x 4 x 2` |
| loader-REJECTED (printed skips) | — | **4,355** | printed per cell with its axis labels and error class |
| loader-ACCEPTED | **1,526** | **12,349** | |
| token-presence disagreements | — | **78** | every one covered by E1 or E2 |
| NAME-SET disagreements | — | **0** | |
| exemption list length | **2** | **2** | asserted, by a case of this plan's own |

The base length staying at 26 while the corpus grows sixfold **is** the claim. The five previous
rounds each closed a "the corpus could not express this" report by adding ONE member for the ONE shape
a review named; that is a corpus grown per reported family, circular over the family structure exactly
as a per-arm corpus was circular over the arm structure.

### 2. The three round-11 families, MECHANICALLY expressible

Predicates over the shapes' **declared** facts (`blockHeader`, `siblingQuotedRegion`), never over
their labels or their text. Each asserted non-empty; the counts are PRINTED on every run:

```
D-52 EXPRESSIBILITY (27-59) — 27-55  shapes=147 cells=7056 | 27-56  shapes=234 cells=11232 | 27-57  shapes=216 cells=10368
```

The **crossing of all three at once** is also asserted non-empty — the shape no per-family row set can
reach, because three rows written for three reported families produce three cells and never a product.

### 3. Non-circularity against a pre-round-11 mirror (`git archive 3c7930b`)

```
27-59 PRE-ROUND-11 MIRROR 3c7930b — cells 16704 | loader-rejected 4355 | pre-build refusals 78
  | NEVER-EXEMPTIBLE 2526 (silent-while-loader-grants 2520, grants-while-loader-does-not 6)
  by family: 27-55 — a block-owned region beside a QUOTED region carrying an escape -> 1263 cell(s)
  by family: 27-56 — a NESTED mapping key outside the plain top-level alphabet     -> 2160 cell(s)
  by family: 27-57 — a node PROPERTY between the introduction and the indicator    -> 2016 cell(s)
```

The mirror is asserted to BE the pre-round build (it must still carry `sawBlock`, the flag D-59
deleted), so the case cannot pass by comparing the build with itself.

### 4. The axis-collapse non-vacuity floor still discriminates

```
WR-01 non-vacuity floor — key-line shapes 348 full vs 26 all-collapsed vs 53 header-collapsed
  | cells 16704 vs 1248 vs 2544 | LOADER-ACCEPTED 12349 full vs 806 all-collapsed vs 1526 header-collapsed
```

Two comparisons, not one. `full > all-collapsed` (12,349 > 806) is the old floor extended; the new
`full > header-collapsed` (12,349 > 1,526) measures the FOUR HEADER AXES **on their own**, because a
floor that passes with the new dimensions collapsed is not measuring them. Collapsing all six new axes
is asserted to reproduce `AXIS_KEY_LINE_BASE` **byte for byte**.

### 5. The 1,440 loud refusals the widening surfaced — generated, adjudicated, NOT exempted

The header product scopes its property crossing to the **mapping-separator** introduction. At the
BARE-HEADER (`tools: &p >-`) and BLOCK-SEQUENCE-ITEM (`  - &p >-`) introductions the property sits at
offset 0 of the node, D-30's standing anchor/alias refusal reaches it first, and this module REFUSES
BY NAME where libyaml accepts and grants. Measured directly:

| document | module | loader |
|---|---|---|
| `tools:` / `  nested: &p >-` / … | `{ok:true,value:true}` | grants |
| `tools:` / `  nested: !!str >-` / … | `{ok:true,value:true}` | grants |
| `tools: &p >-` / … | **REFUSE by name** | grants |
| `tools: !!str >-` / … | **REFUSE by name** | grants |
| `tools:` / `  - &p >-` / … | **REFUSE by name** | grants |

`27-57` recorded exactly this as its controls P and S — *"deliberate, byte-unchanged, and the contrast
the diagnosis rests on … not open as a defect"*. Covering 1,440 such cells inside the D-52 product
would have required a THIRD exemption rule, which this plan is forbidden to add. They are **not swept**:
the SAME `deriveHeaderShapes` produces them through its complement predicate and a case of this plan's
own adjudicates them against the same loader, asserting the complement is DISJOINT from the product:

```
27-59 LOUD-ARM adjudication — shapes 30 | cells 1440 | loader-rejected (skipped) 0
  | module REFUSES 1440 | grants-while-loader-does-not 0 | silent-while-loader-grants 0
```

### 6. WR-03 — the state differential's two inputs become two axes

`stripComment` takes the ENTERING state (whose `nodeMayBegin` is carried from the previous line) and,
separately, the caller's offset-zero node-start answer. The loop passed **one variable as both**.

| | before | after |
|---|---|---|
| state vectors | **24** | **48** — `3 entering quotes x 2 depths x 2 carried node-may-begin x 2 offset-zero node-start x 2 line-start` |
| comparisons per differential | 148,656 | **297,312** |
| STATE differential moved cells | 286 | **572** across 36 inputs, provenance RECOVERED 572, LOST **0** |
| TEXT differential moved cells | 4 | **4**, still the single input `a: !<x #y> z` |

**The live call sites, read from the module and named.** The call-site LIST is derived from
`scripts/frontmatter.ts` at run time and its contents pinned, so a fourth site fails by name:

| site | source | (carried `nodeMayBegin`, `nodeStartAtOffsetZero`, `lineStartAtOffsetZero`) |
|---|---|---|
| key line | `stripComment(rest, FRESH_NODE, true, false)` | (true, true, false) |
| item path | `stripComment(itemText, cur.state, true, true)` | (true, true, true) **and (FALSE, true, true)** |
| continuation | `stripComment(t, cur.state, startsNode, startsNode)` | all four crossings, incl. **(FALSE, true, true)** and **(TRUE, false, false)** |

**The negative control fires.** Re-coupling the two axes (`nodeStart: mayBegin`) reds the coverage rule
and NAMES the three combinations it can no longer reach — verbatim:

```
AssertionError: an argument combination a LIVE call site produces that the differential never
generates — the corpus would agree with the capture not because the module agrees but because it
never asked: expected [ …(3) ] to deeply equal []
+ [
+   "item path, carried node-may-begin FALSE: mayBegin=false nodeStart=true lineStart=true",
+   "continuation, carried FALSE / line answers TRUE: mayBegin=false nodeStart=true lineStart=true",
+   "continuation, carried TRUE / line answers false: mayBegin=true nodeStart=false lineStart=false",
+ ]
```

And re-coupling the two **differential loops** (while the fixture carries all 48 states) reds both
halves: TEXT moved **4 -> 12** cells, STATE moved **572 -> 6,340** cells. The widened capture really
pins the decoupling.

### 7. The capture's provenance — and the COMPOSITE nobody had written down

`scripts/fixtures/frontmatter-singleline-pre-d54.json` was **REGENERATED**, never hand-edited and never
extrapolated. Regenerating it exposed a fact no summary states in one place: **the fixture is a
COMPOSITE of two builds.** Measured over the committed 24-state cross product:

| mirror | reproduces `shortened` | reproduces `state` |
|---|---|---|
| `git archive 62b8b53` (pre-D-54) | **0 mismatches** | 1,514 mismatches |
| `git archive d5c69e0` (pre-`27-51`) | 4 mismatches | **0 mismatches** |

Regenerating both halves from ONE commit would have silently re-baselined the other — the "the build
equals itself" tautology this file rejects by name. So **each half was regenerated at its own commit**,
and the fixture now records both in a `provenance` key a case asserts (including that both commits are
real objects in this repository).

**The command, quoted:**

```
git archive 62b8b53 | tar -x -C <textMirror>
git archive d5c69e0 | tar -x -C <stateMirror>
node regen48.mjs <textMirror> <stateMirror> 62b8b53 d5c69e0 <out>
```

**The regeneration is verified against the capture it replaces.** The new 48-state capture's COUPLED
sub-slice (the cells where `nodeStartAtOffsetZero === entering.nodeMayBegin`) equals the committed
24-state capture exactly: **0 text mismatches, 0 state mismatches, 0 sparse-presence mismatches** over
all 6,194 inputs. Nothing is `UNKNOWN - verify`; every cell of the new dimension was OBSERVED.

### 8. The five-row revert sweep, with its two premise controls

Method: a hermetic `git clone --no-hardlinks` of this repository (so the git-dependent cases keep
working — `.git` is present and the unmutated baseline is therefore **0**, not the 6-to-15-case noise a
`.git`-less scratch copy produces), one edit reverted at a time, `npx tsc` rebuilt, the built artifact
**probed directly**, then the widened corpus run. Every step's exit code is asserted.

| # | revert | mutate | build | shared corpus: never-exemptible partition | family | one quoted message |
|---|---|---|---|---|---|---|
| C1 | **revert NOTHING** | 0 | 0 | both **EMPTY** (78 disagreements, all exemption-covered; NAME-SET 0) | — | *(green — 268 passed)* |
| C2 | **revert a COMMENT-ONLY change** (2 comment lines) | 0 | 0 | both **EMPTY**, corpus digest `0087999390cb4258` unchanged | — | *(green — 268 passed)* |
| R1 | `27-55` / D-59 — the region-scoped quoting exemption made STICKY again | 0 | 0 | **both EMPTY — NOT PINNED** (78 / 0, unchanged) | 27-55 | `a union cell whose verdict contradicts D-59's declared region scoping: expected [ …(14) ] to deeply equal []` (its OWN axis, not the shared corpus) |
| R2 | `27-56` / D-60 — the nested key restricted to the top-level alphabet | 0 | 0 | **silent-while-loader-grants = 2,160** cells, plus **2,160 NAME-SET** disagreements | 27-56 | `V1 quoted: expected { ok: true, value: false } to deeply equal { ok: true, value: true }` |
| R3 | `27-57` / D-61 edit A — the node-property strip | 0 | 0 | never-exemptible **EMPTY**; **8,112 unexplained disagreements** (8,064 refuse-while-loader-grants + 48 refuse-while-loader-no-grant) — RED, in the LOUD direction | 27-57 | `a disagreement with the loader that NO named exemption covers …` |
| R4 | `27-57` / D-61 edit B — the reference refusal's 4th application point | 0 | 0 | **both EMPTY — NOT PINNED** (78 / 0) | 27-57 | `the SILENT success arm is the one thing this must never be: expected true to be false` (its OWN axis) |
| R5 | `27-58` / D-62 edit A — the block-scalar end condition | 0 | 0 | **grants-while-loader-does-not = 72** cells, plus **72 NAME-SET** disagreements | 27-58 | `a disagreement with the loader that NO named exemption covers …` |
| R6 | `27-58` / D-62 edit B — a blank line inside an open block scalar | 0 | 0 | **both EMPTY — NOT PINNED** (78 / 0) | 27-58 | `B2 literal, one blank — the loader reads this as "Agent(alpha, ga\n\nmma)": expected [ 'Agent(alpha, ga\nmma)' ] to deeply equal [ 'Agent(alpha, ga\n\nmma)' ]` (its OWN axis) |

**Both premise controls hold**, so the sweep is measuring the EDIT and not the rebuild.

### 9. The harness premise produced a FALSE result TWICE MORE, and both were caught

This is the eleventh and twelfth instance in this phase, and neither would have been visible without
the exit-code assertions the record already demands.

1. **The inverse-patch approach silently did not apply.** `git show 8a2f435 -- scripts/frontmatter.ts |
   git apply -R` failed (`patch does not apply` — later commits moved the same regions), and the row
   still printed **`268 passed`**. Read without `mutate exit=1` it says *"the corpus does not pin
   27-55"* — which happens to be TRUE, but for entirely the wrong reason. Replaced by targeted
   mutations that assert their own target text before and after.
2. **`npx tsc` failed with `TS6133: 'stripNodeProperties' is declared but its value is never read`**,
   emitted NOTHING, left the UNMUTATED `scripts/frontmatter.js` in place, and the row printed
   **`268 passed`**. The direct probe caught it in the same breath: `27-57 property` still returned
   `{ok:true,value:true}`, which a truly mutated build cannot do. After adding a `void
   stripNodeProperties;` reference so the build EMITS, the same revert reds with **8,190** disagreements
   and the probe returns a refusal.

**And a third, smaller one, recorded because it produced a wrong number in a transcript.** `diff` is a
shell FUNCTION in this environment (`git diff --no-index --color-words`), so `diff a b | grep -c '^>'`
counted **0** for a mutation that had plainly applied — git's diff marks lines with `+`/`-`. Every
later comparison uses `cmp -s` or `/usr/bin/diff`.

### 10. A harness-premise fact about the gate itself

`tsconfig.json` **excludes `**/*.test.ts`**, so `npx tsc --noEmit` — which this plan's `<verify>` block
lists and which is green — **does not typecheck `scripts/frontmatter.test.ts` at all**, and Vitest's
oxc transform strips types without checking them. A type error in the largest test file in this
repository is therefore caught by NOTHING in the standard gate. This plan's test-file changes were
typechecked explicitly and pass:

```
npx tsc --noEmit --ignoreConfig --skipLibCheck --module nodenext --moduleResolution nodenext \
  --target es2022 --strict --types node scripts/frontmatter.test.ts     ->  exit 0
```

Recorded as a gap in the gate, not as a defect in this plan.

### 11. Gate results on the restored tree

| check | result |
|---|---|
| `npx tsc --noEmit` | **exit 0** |
| explicit typecheck of `scripts/frontmatter.test.ts` | **exit 0** |
| `npm run freshness` | **exit 0** |
| `node scripts/check-foundation-guards.js` | **exit 0** (`ALL CHECKS PASSED`) |
| the fixture parses | yes, `48` states |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1,342 passed / 2 skipped / 0 failed** |

**The regression suite is a FLOOR, not the closure evidence.** The evidence is §3's pre-round mirror,
§4's two-comparison floor, §6's negative control and §8's revert sweep with its two premise controls.

### 12. Still OPEN, with a named owner

| Item | Owner |
|---|---|
| **The shared D-52 corpus does NOT pin `27-55`'s edit (R1).** With D-59's region scoping made sticky again, the corpus's two never-exemptible partitions stay EMPTY and its NAME-SET differential stays at 0. The revert is caught only by `27-55`'s own union axis (14 cells) and by the D-60/D-61 derived axes. **The construct is expressible (7,056 cells) and the defect in it is not detectable** — `27-58` recorded that distinction and this is a second instance of it. | a later round — either a token-carrying QUOTED sibling (the current sibling's escape sits outside the enumerated region, so its resolution moves no name and no boolean), or an explicit acceptance that the shared corpus defers this family to its own axis |
| **The shared D-52 corpus does NOT pin `27-57`'s edit B (R4)** — the reference refusal's fourth application point. Caught only by three cases on `27-57`'s own axis. The corpus generates no `*alias`-before-a-header shape, because a property form that is an ALIAS was not among this plan's three derived members. | a later round — an alias member on `AXIS_HEADER_PROPERTY_FORM`, whose loader verdict must be measured first (`nested: *a >-` is loader-REJECTED without a matching anchor) |
| **The shared D-52 corpus does NOT pin `27-58`'s edit B (R6)** — the blank line inside an open block scalar. Caught only by five cases on `27-58`'s own axis. **This CONFIRMS a finding `27-58` recorded in advance**: on the G6 cell both builds grant and both refuse the enumeration, for different reasons, so the differential sees no disagreement. | a later round — the differential compares token presence and the NAME SET; this family moves neither, so pinning it in the shared corpus needs a third compared fact (the VALUE), which is a decision rather than an addition |
| A node property at the BARE-HEADER and BLOCK-SEQUENCE-ITEM introductions refuses where libyaml grants (1,440 cells, §5) | not open as a defect — `27-57`'s recorded, deliberate, byte-unchanged behaviour; adjudicated by its own case and REPORTED rather than exempted |
| `tsconfig.json` excludes `**/*.test.ts`, so no gate typechecks the test files (§10) | a later round — either add a test-file typecheck lane or record the exclusion as deliberate |
| `27-55`, `27-56`, `27-57` and `27-58`'s open items | carried, unchanged — `27-59` edited no production source file, no exemption machinery, no fence classifier, no toggle and no introduction set |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4) |

---

## From 27-60 (round 11, WR-04 + IN-02 + IN-03) — three controls that read as floors and could not hold the weight

This plan changes **no shipped behaviour**. Every committed `.js` output is byte-identical before and
after (32/32 hashes), `tsconfig.json` is byte-unchanged, `devDependencies` is byte-unchanged and no
package-manager install ran.

### 1. WR-04 — the dead-code flags reached NOTHING, measured on both sides

`tsconfig.json` turned on `noUnusedLocals` / `noUnusedParameters` and excluded `**/*.test.ts`. The
reach, taken by listing the files the compiler actually loads:

| target | `.test.ts` files compiled | total repo-local `.ts` loaded |
|---|---|---|
| `tsc --noEmit` (shipped source) | **0** of 36 tracked | 199 |
| `tsc -p tsconfig.tests.json` (new) | **36** of 36 tracked | — |

Vitest's transform strips types without checking them, so before this plan the harness was
type-checked by nothing anywhere.

**The finding under the finding: there was no `typecheck` step in CI at all.** The review proposed
wiring the new target "into the same gate that runs typecheck"; that gate did not exist. Shipped
source was type-checked only as a side effect of `npm run build`. `.github/workflows/ci.yml` now
carries an explicit `npm run typecheck` step on both OS legs.

### 2. WR-04 — the target is PROVEN able to fail, and the contrast is the finding

An unused local planted at the end of `scripts/frontmatter.test.ts`:

```
new target      exit=2   scripts/frontmatter.test.ts(14531,7): error TS6133:
                         'grugops2760UnusedPlant' is declared but its value is never read.
shipped target  exit=0   <- the SAME plant, the SAME flags, seen by nothing
plant removed   exit=0   (restore verified byte-identical with cmp -s)
```

### 3. WR-04 — SIX real violations, each fixed AT ITS SITE

No exemption was added, no flag was loosened, no test was deleted or weakened, and the shipped-source
config's exclude list is byte-unchanged (`["node_modules", ".tmp-build", "**/*.test.ts"]` before and
after). The review had measured "no violations today"; that measurement is now stale — round 11's own
plans grew the harness past it.

| file | diagnostic | fix |
|---|---|---|
| `install/install.test.ts:41` | TS6133 `statSync` | dead import removed; `lstatSync` is the one actually used |
| `scripts/generate-catalog.test.ts:46` | TS6133 `out` | dead helper removed, plus its now-unused `SpawnSyncReturns` type import; every call site already inlined `${r.stdout}${r.stderr}` |
| `scripts/context-io.test.ts:545` (x2) | **TS2741** `body` missing | two object literals handed to `currentState()` were not `NoteRecord`s. A REAL type error, supplied at the site; the interface was not widened |
| `scripts/context-freshness.test.ts:43` | TS6133 `indexMd` | the unused local was the tell for a **missing case**. The gate compares BOTH `["index.md", "index.jsonl"]` (`context-freshness.ts:125`) and only the `.jsonl` half had a planted-drift case. Added **Test 2b**, the `.md` twin |
| `scripts/check-foundation-guards.test.ts:184` | TS6133 `MEMORY_SENTENCE_COORDINATOR` | the literal's own comment claimed the duplication "fails closed". True for the specialist form (nine fixtures embed it), **false** for the coordinator form, which was read by nothing — a wording contract with no consumer, this repository's set-literal class in miniature. Made true by a case asserting BOTH forms appear verbatim in the guard source |

Both ADDED cases proven able to fail, in a hermetic `git clone --no-hardlinks` (baseline **153 passed
/ 0 failed**; two mutations produced exactly **2** attributable reds):

```
PLANT A  derivedNames narrowed to ["index.jsonl"] in the built context-freshness.js
  x Test 2b (planted-drift STALE, the .md half): expected +0 not to be +0
    ...and Test 2 (the .jsonl half) stayed GREEN, so 2b measures the .md half specifically

PLANT B  the guard's coordinator em-dash drifted to a hyphen
  x AssertionError: the coordinator memory sentence this harness mirrors is no longer present
    verbatim in scripts/check-foundation-guards.ts — the wording contract drifted on one side
    only. Re-cut the template, the generator and this fixture together.
```

### 4. IN-02 — the fence claim's prose half, mechanised

The derived fence set stays at **4** members. What changed is that the "does it answer the GENERAL
question" half is now checked by properties instead of asserted by a comment:

| class | property, mechanically | member(s) |
|---|---|---|
| `authority` | exports `stripFencedBlocks` — any consumer can hand it any document | `scripts/frontmatter.ts` |
| `heading-gated` | ≥1 `## Caveman prompt` gate AND gate count **equals** delimiter-site count | `scripts/check-foundation-guards.ts` (2 sites / 2 gates), `scripts/check-foundation-guards.test.ts` (3 / 3) |
| `harness-local` | a `.test.ts` file that **no non-test module in the tracked tree imports** | `scripts/generate-role-adapters.test.ts`, `scripts/check-foundation-guards.test.ts` |

The importer corpus is **derived** — `git ls-files "*.ts"` minus `*.test.ts` minus the member itself,
33 non-test modules — never hand-listed, and comments are stripped before matching so a comment
mentioning an import is not counted as one.

**The classification is a MEASUREMENT, not a partition, and that is a correction this case made to
itself.** It was first written as "every member matches EXACTLY ONE class" and the live tree refused:
`check-foundation-guards.test.ts` matches **both** `heading-gated` and `harness-local`, and both are
true of it — it MIRRORS the guard's own scopers, which is the point of it. A partition would have had
to suppress one true fact to keep its own arithmetic. What is asserted is what the claim actually
needs, and it is total:

- exactly one member is the `authority`, and it carries **neither** disqualifier — it really is
  general (no heading gate) and really is reachable (3 non-test modules import it);
- every one of the other **3** members carries **at least one** disqualifier, so none can be a second
  general answer;
- a member matching **no** class reds the case by name.

**NON-VACUITY OF THE IMPORTER SCAN, ASSERTED FIRST.** "No non-test module imports it" is evidence only
if the same scan can find an importer. It is asked about the authority module and must return
`scripts/check-foundation-guards.ts` among ≥2 hits — otherwise every harness-local verdict is a broken
regular expression reported as a safety property.

### 5. IN-02 — the fail-proof, and the harness-premise failure it caught (instance 14)

**The first plant did NOT red, and that is the finding.** A planted
`import "./generate-role-adapters.test.js";` in the non-test module `scripts/kit-model.ts` left the
case at **270 passed**. The scan matched `from "…"` and `import("…")` and missed the **bare
side-effect import**, which carries neither `from` nor a parenthesis — the cheapest way there is to
reach a module. Read without the plant's own outcome asserted, that green says *"nothing imports the
harness-local machines"*, which is true today for entirely the wrong reason.

With the side-effect arm added, the same plant reds by name:

```
FAIL  scripts/frontmatter.test.ts > 27-60 IN-02 — every member of the derived fence set is
      classified MECHANICALLY, the classification is TOTAL, and harness-local is checked as
      `imported by no non-test module`
AssertionError: every member of the derived fence set must be accounted for by at least one
MECHANICAL class; a member with [] is excused by nothing but a comment
+ [ "scripts/generate-role-adapters.test.ts" ]
```

Plant removed (`git checkout --`, verified by grep) → mirror back to **270 passed**. The temp-dir
control case now exercises all five importer spellings — named, default, side-effect, re-export and
dynamic — each asserted SEEN, plus a comment-only control asserted NOT seen.

**WHAT THIS FLOOR WOULD MISS, named rather than left undisclosed:** a specifier assembled at run time
(`import("./gen" + "erate-role-adapters.test.js")`), an importer written in a language this scan does
not read, and a consumer that re-implements a member's machine rather than importing it. It is a floor
against the shapes a real importer plausibly takes, not a proof that none can exist.

**No narrowing of the claim in `scripts/frontmatter.ts` was required** — all three non-authority
members are mechanically disqualified, so the claim's scope is now fully backed. That file is
byte-unchanged by this plan.

### 6. IN-03 — the source-scan pin: an asserted bound, an identity check, and a negative that reads code

The pin at `scripts/generate-role-adapters.test.ts` reads the TEXT of `stripFencedBlockLines`, because
a correct implementation is behaviourally identical whether it COUNTS removals or DERIVES them and
only the source tells the two apart. It was brittle in two measured ways, and both are repaired:

| before | after |
|---|---|
| `src.slice(start, src.indexOf("\n}", start))` — assumes no body line begins at column 0 with `}` | bounded by the explicit marker `\n// ── end stripFencedBlockLines`, **asserted present before the slice is used**, with a message naming the marker |
| the slice was never checked to BE the function | head (`startsWith("function stripFencedBlockLines(")`), tail (`unterminatedFence: inside,`) and no-overrun (`0` following top-level `function `) asserted before any negative runs |
| `.not.toContain("lines.length - kept.length")` matched COMMENTS as well as code | the negative runs over `codeOnly` — a local twin of `codeLinesOf` — plus a floor asserting the strip left >200 characters of code behind, so a strip that ate everything cannot make the negative vacuous |

**THE MARKER IS ADDED, NOT REPURPOSED, AND THAT IS STATED RATHER THAN GLOSSED.** The nearest
pre-existing `// ──` section rule sits 76 lines past the function and would have swallowed two other
helpers — including the block comment that quotes the forbidden shape verbatim. So a section rule in
this file's own idiom is added immediately after the function's closing brace. Deleting or moving it
reds the bound assertion by name; it is not decoration.

### 7. IN-03 — the three plants, in a hermetic clone (baseline **25 passed / 1 skipped / 0 failed**)

```
PLANT 1  the forbidden shape as CODE inside the function
         (`const derived = lines.length - kept.length;` feeding `linesRemoved`)
  x AssertionError: stripFencedBlockLines must COUNT removals as it makes them, never derive
    them from kept.length — deriving turns the partition assertion into a second thing that
    cannot fail: expected 'function stripFencedBlockLines(lines:…' not to contain
    'lines.length - kept.length'
                                                          -> 1 failed | 24 passed

PLANT 2  the end marker line deleted
  x AssertionError: PREMISE — the stripFencedBlockLines body must be bounded by its own section
    rule `// ── end stripFencedBlockLines`; without it this pin does not know where the function
    ends and every assertion below is about an arbitrary slice: expected -1 to be greater than 9412
                                                          -> 1 failed | 24 passed

PLANT 3  the forbidden shape as a COMMENT inside the function
         (`// NOTE: never write `lines.length - kept.length` here — see the block below for why.`)
  ✓ 25 passed | 1 skipped | 0 failed   <- the false-red mode the repair exists to remove
```

Each plant restored and the restore verified (`cmp -s`, byte-identical) before the next.

**PLANT 3 IS ONLY EVIDENCE BECAUSE THE OLD PIN IS SHOWN TO FAIL ON IT.** A comment-only plant staying
green proves nothing if the old pin would also have stayed green. Measured directly, on the same
planted text, running both pin shapes side by side:

```
PRE-REPAIR pin on the comment-only plant  -> negative assertion would FALSE-RED
POST-REPAIR pin on the same plant         -> negative assertion STAYS GREEN
and the comment IS inside the post-repair slice: true
```

### 8. IN-03 — the derived scan for other pins sharing either brittleness mode

A derived scan over all **36** tracked `.test.ts` files (not a hand look), building the set of
identifiers transitively derived from reading a `.ts` SOURCE file — **62** such identifiers, carrying a
"was comment-stripped" flag through the derivation chain — and then asking two questions of them.

| mode | question | raw hits |
|---|---|---|
| **A** | a `.slice()` over such an identifier bounded by an `indexOf(...)` whose result is never `expect`ed | **5**, all in `scripts/frontmatter.test.ts` |
| **B** | a `.not.toContain` / `.not.toMatch` whose receiver is such an identifier that was never stripped (receiver resolved by walking back to its own `expect(`, not by a proximity window) | **16** negatives found over source identifiers, of which **11** unstripped, across **8** distinct receiver names |

**THE SCAN'S OWN PREMISE FAILED FIRST, AND THE ASSERTION CAUGHT IT — instance 15.** The first
paren-matching walk reported `negative assertions over them: 0`, i.e. it found no negative source
assertions ANYWHERE in 36 files, which is plainly false. The backward walk was off by one (it
decremented at the matching `(` and kept going to an earlier one). Reported as a count rather than as
a bare "no other hits found", the zero was visibly wrong; as a PASS line it would have read as
reassurance. Fixed, the same scan reports 16.

**Adjudicated, with the reasons stated:**

- `truncated` (mode A and B) — a **deliberate fixture**. The round-9 IN-03 proof case CONSTRUCTS a
  truncated slice precisely to show the purity case would pass over it. True negative by design.
- `authority` and `guardsRaw` (mode B) — **stripping would BREAK them.** These pin a PROSE claim
  ABSENT (`not.toContain("No second fence parser is written, here or anywhere")`), and the claim
  lives in a comment. Mode B's premise is not universal: a negative deliberately about comment text
  must not be comment-stripped. Stated here so a later round does not "fix" them into vacuity.
- `body` in `scripts/generate-role-adapters.test.ts` (mode B) — a **scan artifact**. That `body` is a
  `.md` adapter file read at line 427; the scan is name-based, not scope-aware, and shadowed it with
  the `.ts` slice at line 866. This plan's repaired negative uses `codeOnly`, which IS stripped, and
  is correctly not a hit.
- **`iface` in the D-59 accumulator case (`scripts/frontmatter.test.ts:14245-14247`) — CONFIRMED
  GENUINE, on BOTH modes at once**, and recorded OPEN below rather than fixed silently.

### 9. Still OPEN from 27-60, with a named owner

| Item | Owner |
|---|---|
| **`scripts/frontmatter.test.ts:14245-14247` shares BOTH brittleness modes.** `const body = src.slice(src.indexOf("\ninterface Accumulator {"))` then `const iface = body.slice(0, body.indexOf("\n}\n"))` — neither index is asserted, the slice is never checked to BE the interface, and `expect(iface).not.toContain("sawBlock")` runs over UNSTRIPPED text while the SAME case asserts `expect(src).toContain("sawBlock")` (the deletion must stay narrated). So a comment inside the `Accumulator` interface that mentions `sawBlock` false-reds it, and a reformat that moves the closing brace makes `indexOf` return `-1`, silently slicing to `src.length - 1`. | a later round — apply this plan's three repairs (asserted bound, identity check, comment strip) to that pin; it is a `27-58`/`27-59`-owned case and was deliberately not edited here, since `27-60` must not smuggle changes into another plan's evidence |
| **The remaining mode-A hits are NOT adjudicated:** `branch` and `block` in `scripts/frontmatter.test.ts`. Both slice a `.ts` source on an unasserted `indexOf`. Neither was inspected here. | a later round — adjudicate each as fixture, deliberate, or genuine, using the same three questions |
| **The remaining mode-B hits are NOT adjudicated:** `source`, `body` and `block` in `scripts/frontmatter.test.ts`. | a later round — for each, decide whether the negative is about CODE (strip) or about COMMENT TEXT (do not strip), and state which at the site |
| The derived scan is a **floor with known false positives** — it is name-based rather than scope-aware, and it cannot see a bound hoisted through a helper. It is not committed as a gate. | a later round — if it is ever promoted to a gate, it needs scope resolution first, or it will red on shadowed names |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4) |
| `27-55` … `27-59`'s open items | carried, unchanged — `27-60` edited no production source file, no parser, no guard and no grant computation |

### 10. Gate results

| check | result |
|---|---|
| `npm run typecheck` (BOTH targets) | **exit 0** |
| `npm run freshness` | **exit 0** — 32 committed `.js` fresh, hashes IDENTICAL to the pre-plan baseline |
| `npm run freshness:adapters` | **exit 0** |
| `node scripts/check-foundation-guards.js` | **exit 0** (`ALL CHECKS PASSED`) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1,346 passed / 2 skipped / 0 failed** |

**The regression suite is a FLOOR, not the closure evidence.** The evidence is §2's two-sided reach
measurement and planted TS6133, §3's two mutation reds, §5's planted-import red (and the green that
preceded it), and §7's three plants with the pre-versus-post pin comparison.

---

## From 27-61 (round 11) — the CONSOLIDATED mutation sweep, on the FINAL build

Six plans (`27-55` … `27-60`) each carried its own local mutation control, and each was taken on the
build that plan produced. Five later plans then edited the same files. **A closure inherited across
six edits is a memory, not a measurement**, so every pin this round added is re-proved here, once, on
the shipped build — `ff68c31`, `scripts/frontmatter.js` as committed, `/usr/bin/ruby -ryaml`
(ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) as the loader column throughout.

**Method, with every step's own premise asserted.** A hermetic `git clone --no-hardlinks` of this
repository — `.git` present, so the git-dependent cases keep working and the unmutated baseline is
**0**, not the 6-to-15-case noise a `.git`-less scratch copy produces (`27-56` / `27-57` measured
that). One edit reverted at a time. Each mutation **asserts its own target text occurs exactly once
before it is applied and is absent afterwards**, so a mutation that silently did not apply cannot be
read as "the pin does not exist" (`27-59`'s eleventh false result). For every source edit `npx tsc`
runs and **its exit code is asserted** (`27-57`'s ninth), and the **built artifact is probed
directly** before the suite is believed (`27-58`'s tenth). The tree is restored with
`git checkout -- <path>` between reverts; `git clean` is never used.

### 1. The two premise controls, recorded FIRST — the sweep measures the EDIT, not the rebuild

A sweep that reds on any rebuild certifies nothing. Both controls were taken before any revert result
was looked at, and the order here is the order they were run in.

| # | control | rebuild | suite |
|---|---|---|---|
| **C1** | **revert NOTHING** — the clone as cloned | `npx tsc` exit **0** | **35 files, 1346 passed / 2 skipped / 0 failed** |
| **C2** | **revert a COMMENT-ONLY change** — D-60's three-line "THIS GATE IS UNCHANGED, AND THAT IS THE POINT" comment block deleted, and the `.js` rebuilt from it | `npx tsc` exit **0** | **35 files, 1346 passed / 2 skipped / 0 failed** |

C1 also fixes the attributable baseline at **0**: every red below is the mutation's, with nothing to
subtract.

### 2. The ten reverts

`scripts/frontmatter.js` is what vitest resolves the tests' `./frontmatter.js` import to, so every
source revert is rebuilt before it is measured; the four test/config reverts are seen directly.

| # | edit reverted | file | build | direct probe of the MUTATED artifact | suite | named assertion that reds |
|---|---|---|---|---|---|---|
| **R1** | `27-55` / **D-59** — the region-scoped quoting exemption made STICKY per key again | `frontmatter.ts` | exit **0** | U1 → `{"ok":true,"value":false}` — **the original CR-01-new silent no-grant, reproduced** (control still grants) | **8 failed** / 1338 passed | `D-59 U1/U2 — an unrelated \`b: >-\` sibling cannot switch off the escape refusal…` |
| **R2** | `27-56` / **D-60** — the nested key restricted back to the top-level `KEY_LINE` alphabet | `frontmatter.ts` | exit **0** | V4 → `{"ok":true,"value":false}` — the original CR-03 silent no-grant | **9 failed** / 1337 passed | `D-60 V1-V4 — a quoted, dotted, digit-leading or space-containing nested key carries a header…` |
| **R3** | `27-57` edit A / **D-61** — the node-property strip removed at the header position | `frontmatter.ts` | exit **0** | A → `{ok:false, "…uses a YAML anchor or alias…"}` — the **LOUD** arm, not the silent one | **5 failed** / 1341 passed | `D-61 rows A, B, F, Q — a node property in front of a block indicator no longer hides the header, at EVERY introduction` |
| **R4** | `27-57` edit B / **D-61** — the reference refusal's FOURTH application point removed | `frontmatter.ts` | exit **0** | `nested: *a >-` → `{"ok":true,"value":false}` — silent success on a document libyaml **REJECTS** | **3 failed** / 1343 passed | `D-61 CONTROL R — a property the strip CANNOT handle fails LOUD, at the node start after a mapping separator` |
| **R5** | `27-58` edit A / **D-62** — the end condition measured from the HEADER LINE again | `frontmatter.ts` | exit **0** | W1 → `GRANT ["grugops-orchestrator"]` for a value the loader reads as `{"nested"=>"Read,"}` — the original WR-01 never-exemptible direction | **4 failed** / 1342 passed | `D-62 row W1 — a block scalar ends at its OWN detected content indentation, so the over-included sibling line stops granting` |
| **R6** | `27-58` edit B / **D-62** — a blank line inside an open scalar consumed again | `frontmatter.ts` | exit **0** | B1 → names `["alpha","ga mma"]` — the original WR-02 **INVENTED** name | **5 failed** / 1341 passed | `D-62 row B1 — a folded scalar's blank line is a LINE BREAK, so the module stops inventing a name` |
| **R7** | `27-59` — the offset-zero node-start axis RE-COUPLED to the entering state | `frontmatter.test.ts` | (test file — seen directly) | — | **1 failed** / 1345 passed | `IN-02 single-line differential — …every move RECOVERS a scalar's provenance rather than losing one`, message: **`6340 cell(s) moved`** of 297,312 |
| **R8** | `27-60` — the test-inclusive typecheck target removed from the gate | `package.json` | (config) | — | **0 failed** — see §3 | none — assertion-shaped edit, pinned by the paired plant |
| **R9** | `27-60` — the fence claim's mechanical harness-local discriminator weakened | `frontmatter.test.ts` | (test file) | — | **0 failed** — see §3 | none — assertion-shaped edit, pinned by the paired plant |
| **R10** | `27-60` — the IN-03 source-scan pin's section-rule bound reverted to `indexOf("\n}")` | `generate-role-adapters.test.ts` | (test file) | — | **0 failed** — see §3 | none — assertion-shaped edit, pinned by the paired plant |

**Verbatim failure messages**, one per red revert, showing each names its own family or property
rather than failing somewhere generic:

```
R1   AssertionError: expected 'ok:[["name",["probe"]],["tools",["a: …' to be 'REFUSED'
     Received: "ok:[[\"name\",[\"probe\"]],[\"tools\",[\"a: \\\"\\\\x41gent(grugops-orchestrator)\\\" b: x\"]]]"
     ❯ scripts/frontmatter.test.ts:14116:25
R1   AssertionError: a union cell whose verdict contradicts D-59's declared region scoping:
     expected [ …(14) ] to deeply equal []
R2   AssertionError: V1 quoted: expected { ok: true, value: false } to deeply equal { ok: true, value: true }
R2   AssertionError: "  été: >-": expected { ok: true, value: false } to deeply equal { ok: true, value: true }
R3   AssertionError: A implicit nested key + anchor: expected { ok: false, …(1) } to deeply equal { ok: true, value: true }
R3   AssertionError: a1 inside a sequence item's compact mapping: expected { ok: false, …(1) } to deeply equal { ok: true, value: true }
R4   AssertionError: the SILENT success arm is the one thing this must never be: expected true to be false
R4   AssertionError: two properties of a kind must not reach the success arm: expected true to be false
R5   AssertionError: one column less: OUTSIDE the scalar: expected { ok: true, value: true } to deeply equal { ok: true, value: false }
R6   AssertionError: the loader's value carries a line break the enumeration alphabet REFUSES, so the
     module must refuse too — the LOUD arm is the correct answer here, not a name set: expected true to be false
R6   AssertionError: B2 literal, one blank — the loader reads this as "Agent(alpha, ga\n\nmma)":
     expected [ 'Agent(alpha, ga\nmma)' ] to deeply equal [ 'Agent(alpha, ga\n\nmma)' ]
R7   AssertionError: within-line STATE differential over 6194 input(s) x 48 state(s) = 297312
     comparison(s); 6340 cell(s) moved: "\"" entering=null depth=0 mayBegin=false nodeStart=true …
```

**R1 and R6 reconcile a difference with `27-59`'s sweep rather than contradict it.** `27-59` measured
R1, R4 and R6 as **NOT PINNED** — and that measurement was over the **shared D-52 corpus only**. This
sweep runs the **whole suite**, and all three are pinned there: R1 by `27-55`'s own region-kind ×
escape-kind × spelling union axis (exactly the owner `27-59` named), R4 by `27-57`'s CONTROL R, R6 by
`27-58`'s own B rows. **`27-59`'s three OPEN items stand unchanged** — the shared corpus still cannot
see these three families, which is the property `27-59` was measuring and this sweep does not touch.

### 3. The three assertion-shaped edits, pinned by their paired plant

`R8`, `R9` and `R10` are not behaviour changes; they are **assertions and gate reach**. Reverting an
assertion cannot red anything — that is a tautology, not a finding. So each is measured in the shape
that can carry evidence: **plant the defect the edit exists to catch, and compare the outcome with the
edit present and with it reverted.** Recorded here as OPEN under the plan's own rule (revert-alone
green) with the paired result stated beside it, rather than dressed up as a red.

| # | plant | edit PRESENT | edit REVERTED |
|---|---|---|---|
| **R8** | an unused local (`const unread = 1;`) added to `scripts/context-io.test.ts` | `npm run typecheck` **exit 2** — `scripts/context-io.test.ts(2100,9): error TS6133: 'unread' is declared but its value is never read.` | **exit 0** — the same plant, seen by nothing |
| **R9** | `import "./generate-role-adapters.test.js";` appended to the non-test module `scripts/kit-model.ts` | **exit 1**, `every member of the derived fence set must be accounted for by at least one MECHANICAL class; a member with [] is excused by nothing but a comment` | **exit 1** *still* — caught by a SECOND, independent statement of the same property in the same case |
| **R10** mode A | the `// ── end stripFencedBlockLines` section rule deleted | **exit 1**, `PREMISE — the stripFencedBlockLines body must be bounded by its own section rule …; expected -1 to be greater than 9412` | **exit 0** — 25 passed, undetected |
| **R10** mode B | the forbidden shape `lines.length - kept.length` planted as a **COMMENT** inside the pin's own slice | **exit 0** — correctly stays green | **exit 1** — **FALSE RED**: `expected 'function stripFencedBlockLines(lines:…' not to contain 'lines.length - kept.length'` |

**R9's result is a finding worth stating exactly.** The harness-local property is asserted **twice** —
once as a condition inside `classifyFenceMachine`, and once as a direct loop over the claimed
harness-local members. Reverting either arm alone still catches the plant through the other. Blinding
**both** (the classifier condition removed *and* the direct loop replaced by `void nonTestImportersOf;`)
takes the same plant to **exit 0, 9 passed** — measured, so the redundancy is a measured fact and not
an assumption. `R10`'s mode-A plant and the `PLANT 3` premise were both re-asserted before use, and
one of those assertions **fired**: the first attempt looked for the end marker in
`scripts/generate-role-adapters.ts` when the pinned twin lives in
`scripts/generate-role-adapters.test.ts`. It halted with `PLANT-2 PREMISE FAILED: marker absent`
instead of quietly measuring a plant that was never applied. **That is the sixteenth instance of this
phase's harness-premise lesson, and the first in which the assertion caught the error before a number
was written down rather than after.**

### 4. The gate, on the four parser edits — hermetic mirror, exit code before and after

Planted into the **EXISTING** `allowed-tools:` key of BOTH distribution twins of the non-coordinator
`plan` skill (D-40), never by adding a second allow-list key (`27-52`'s R1 near-miss). Twins counted
over the **FAILURE block only** (`27-54`'s near-miss: a passing run names the same paths in ordinary
`PASS … pointer-sized` lines). Every plant's loaded value is quoted from the loader rather than assumed.

| plant | shape | FINAL BUILD | edit REVERTED | loader reads |
|---|---|---|---|---|
| — | unplanted mirror | **exit 0** | **exit 0** under every one of R1…R5 | — |
| CTL | one-line `Read, …, Agent(grugops-orchestrator)` | **exit 1**, twins 2/2 | — | `"Read, Write, Bash, Glob, Grep, Agent(grugops-orchestrator)"` |
| CTLSHAPE | the same YAML SHAPE, harmless tool list | **exit 0**, twins 0/2 | — | `{"nested"=>"… # x, WebFetch"}` |
| **P55** | `a: "\x41gent(…)"` + `b: >-` sibling | **exit 1**, twins 2/2 | **exit 0**, twins 0/2 — the bypass reopens | `{"a"=>"Agent(grugops-orchestrator)", "b"=>"x"}` |
| **P56** | `a b: >-` spaced nested key | **exit 1**, twins 2/2 | **exit 0**, twins 0/2 — the bypass reopens | `{"a b"=>"… # x, Agent(grugops-orchestrator)"}` |
| **P57** | `nested: &a >-` node property | **exit 1**, twins 2/2 | **exit 1**, twins 2/2 — **the gate does NOT move** | `{"nested"=>"… # x, Agent(grugops-orchestrator)"}` |
| **P57B** | `nested: *a >-` alias | **exit 1**, twins 2/2 | **exit 0**, twins 0/2 — the silent arm reopens | **REJECT** *did not find expected key* |
| **P58** | over-indented first content line | **exit 0**, twins 0/2 — **correct: the loader carries NO grant** | **exit 1**, twins 2/2 — the **FALSE RED** reopens | `{"nested"=>"Read, Write, Bash, Glob, Grep,"}` |

**P57's gate not moving under R3 is a result, not a hole, and it confirms at the GATE what `27-57`
argued at the module level.** With the strip reverted, the property the strip no longer consumes is
caught by the **fourth application point** (R4's edit) and the document fails **LOUD** — so the gate
stays red for a different and correct reason. The two edits are complementary rather than redundant,
which is exactly why `27-57` insisted on two separate controls; `P57B` under `R4` is the other half of
that pair and does reopen the silent arm.

**`R6` is measured at the module level only, and the reason is stated rather than left as a gap.** Its
divergence is a **value / name-set** divergence, not a token-presence one — `27-58` recorded this in
advance and `27-59`'s R6 confirmed it — so `check-foundation-guards`, which asks about the grant token
and the name set, is not the instrument that can see it. Pinning it at the gate needs a third compared
fact (the VALUE), which is a decision rather than an addition. Owner: **a later round**, carried from
`27-59` unchanged.

### 5. Every family closed by rounds 9, 10 and 11, RE-MEASURED on the final build

Loader column `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1), taken against the
real tree at `ff68c31`, not against a mirror.

| round | family / row | module on THIS build | loader | verdict |
|---|---|---|---|---|
| — | CONTROL one-line grant | `GRANT ["grugops-orchestrator"]` | `"Read, Agent(grugops-orchestrator)"` | premise: the probe CAN see a grant |
| — | CONTROL no grant | `no-grant []` | `"Read, Write"` | premise: it does not grant everything |
| 9 | **CR-01** `'Read'' s,` / `  # x, TOKEN'` | `GRANT ["grugops-orchestrator"]` | `"Read' s, # x, Agent(grugops-orchestrator)"` | **STILL CLOSED** |
| 10 | **FAMILY G** nested mapping value | `GRANT ["grugops-orchestrator"]` | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` | **STILL CLOSED** |
| 10 | **FAMILY G2** block-sequence item | `GRANT ["grugops-orchestrator"]` | `["Read, # x, Agent(grugops-orchestrator)"]` | **STILL CLOSED** |
| 11 | **CR-01-new** (`27-55`) U1 | `REFUSE` (loud, naming `\x`) | `{"a"=>"Agent(grugops-orchestrator)", "b"=>"x"}` | **STILL CLOSED** |
| 11 | **CR-03** (`27-56`) V4 spaced key | `GRANT ["grugops-orchestrator"]` | `{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}` | **STILL CLOSED** |
| 11 | **CR-03** (`27-56`) V1 quoted key | `GRANT ["grugops-orchestrator"]` | `{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}` | **STILL CLOSED** |
| 11 | **CR-02** (`27-57`) A anchor | `GRANT ["grugops-orchestrator"]` | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` | **STILL CLOSED** |
| 11 | **CR-02** (`27-57`) B shorthand tag | `GRANT ["grugops-orchestrator"]` | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` | **STILL CLOSED** |
| 11 | **CR-02** (`27-57`) R alias | `REFUSE` (loud) | **REJECT** *did not find expected key* | **STILL CLOSED** |
| 11 | **WR-01** (`27-58`) W1 over-indent | `no-grant []` | `{"nested"=>"Read,"}` | **STILL CLOSED** |
| 11 | **WR-01** (`27-58`) W2 at-indent | `GRANT ["grugops-orchestrator"]` | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` | **STILL CLOSED** — both sides of the threshold |
| 11 | **WR-02** (`27-58`) B1 folded blank | `names REFUSE` (loud) | `"Agent(alpha, ga\nmma)\n"` | **STILL CLOSED** |
| 11 | **IN-01** (`27-58`) B2 literal blank | `names REFUSE` (loud) | `"Agent(alpha, ga\n\nmma)"` | **STILL CLOSED** |

**Fifteen rows, fifteen still closed. Not one closure was inherited.**

### 6. Restoration — the sweep leaves no residue

`git status --short` on the real tree reports only the two pre-existing, unrelated entries
(`M human-notes.txt`, `?? .gsd/`). Neither was touched by this plan. On the restored tree:

| gate | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **35 files, 1346 passed / 2 skipped / 0 failed** |
| `npm run typecheck` (both targets) | **exit 0** |
| `npm run freshness` | **exit 0**, 32 committed `.js` match a fresh rebuild |
| `node scripts/check-foundation-guards.js` | **exit 0**, `ALL CHECKS PASSED` |
| `node scripts/adapters-freshness.js` | **exit 0** |
| `node scripts/coordinator-resolution-precheck.js` | **exit 0** |

**The green suite is a FLOOR, not the closure evidence.** The closure evidence in this section is the
transcripts and the gate exit codes: the two premise controls, the seven reverts that red a named
assertion, the four paired plants, the eight gate rows with their loader column, and the fifteen-row
final-build re-measurement.

---

## Round 11 disposition register (written 2026-08-10 by plan `27-61`) — every round-10 item accounted for

**Why this table exists.** A finding that leaves a round without a written disposition is
indistinguishable, to a later reader, from a finding that was forgotten — and this phase's own recorded
experience is that such an item returns one abstraction level down. The register is the durable answer
to *"what happened to everything round 10 raised?"*, carried in the phase's own artifact so it survives
a milestone archive move rather than living only in plan summaries that scroll out of view. **There is
no silent drop.**

**Every FIXED row below cites a transcript taken on the FINAL build of this round** — § From 27-61 § 5,
not a figure carried forward from the plan that made the claim. Five later plans edited the same files
after the first closure landed.

**The review's own tally reconciles.** `27-REVIEW.md`'s frontmatter declares `critical: 3, warning: 4,
info: 3, total: 10`; counting the headings in the document body gives CR-01 / CR-02 / CR-03,
WR-01 / WR-02 / WR-03 / WR-04, IN-01 / IN-02 / IN-03 — **3 + 4 + 3 = 10**. The two agree, so no
disagreement row is owed. The review spells its first critical **CR-01**; `27-VERIFICATION.md` and this
register spell it **CR-01-new**, to keep it distinct from round 9's separate CR-01.

### Part one — the ten review items

| # | Item | Raised in | What happened | Artifact carrying the evidence | Disposition |
|---|---|---|---|---|---|
| 1 | **CR-01-new** — the D-57 quoting exemption keys off the sticky `sawBlock`, so one nested block scalar anywhere in a key switches the D-30 escape refusal off for **every other part of that key**. A NEW regression, shipped inside round 10's own fix | `27-REVIEW.md` § Critical (as CR-01) | Closed STRUCTURALLY by `27-55` under **D-59**: the exemption becomes a property of the REGION the scalar covers, resolved in maximal RUNS of like-kind regions; the sticky flag is **DELETED**, not tuned. The review's proposed `blockParts: Set<number>` shape was **not** adopted — a per-region fact stored apart from its region makes handle-stability a property somebody must keep proving; storing it ON the region dissolves the question | `deferred-items.md` § From 27-55; `27-55-SUMMARY.md`; `27-CONTEXT.md` D-59 | **FIXED** — gate plant P55 **exit 0 → exit 1**, twins 2/2, loader `{"a"=>"Agent(grugops-orchestrator)","b"=>"x"}`; **re-measured on the final build** (§ From 27-61 § 5, row *CR-01-new U1*) and **still closed**; revert R1 reds **8** cases naming D-59 |
| 2 | **CR-02** — a YAML node property (§ 6.9 tag / anchor) between the mapping indicator and the block indicator defeats `blockHeaderAt`; **reproduced end-to-end through the full gate at `ALL CHECKS PASSED`, exit 0** | `27-REVIEW.md` § Critical | Closed by `27-57` under **D-61**: `HEADER_INTRODUCTIONS` becomes the position vocabulary and BOTH questions iterate it, so a fifth introduction inherits the strip by construction. The review's own scope was **measured too narrow** — it named two of the four introductions; the explicit-key and explicit-value forms were live silent-no-grants too, and adversarial pass (a) found **seven further** positions, all closed by the same edit | `deferred-items.md` § From 27-57; `27-57-SUMMARY.md`; `27-CONTEXT.md` D-61 | **FIXED** — the round-10 end-to-end reproduction **INVERTED**: gate plant P57 **exit 0 → exit 1**, twins 2/2; **re-measured on the final build** (rows *CR-02 A anchor*, *B tag*) and **still closed** |
| 3 | **CR-03** — `blockHeaderAt` reuses `KEY_LINE`, the TOP-LEVEL frontmatter key grammar, for the NESTED mapping-key question: four more silent no-grants | `27-REVIEW.md` § Critical | Closed by `27-56` under **D-60**: the nested question gets its own production (`blockMapImplicitEntry`) derived from YAML's mapping-value rule; `KEY_LINE` loses its second job rather than gaining a wider alphabet. The review's proposed `NESTED_MAP_ENTRY` used the **LAST** separating colon; LAST was **REJECTED by measurement** on two loader-REJECTED rows, and FIRST adopted | `deferred-items.md` § From 27-56; `27-56-SUMMARY.md`; `27-CONTEXT.md` D-60 | **FIXED** — **8 of 11** rows moved from the silent no-grant arm to the grant arm; gate plant P56 **exit 0 → exit 1**, twins 2/2; **re-measured on the final build** (rows *CR-03 V4*, *V1*) and **still closed** |
| 4 | **WR-01** — a more-indented first content line makes the module report a GRANT the loader does not have — the direction its own harness calls never exemptible | `27-REVIEW.md` § Warnings | Closed by `27-58` under **D-62**: the scalar ends at its OWN detected content indentation (§ 8.1.1.1), with the header line's indent kept as the FLOOR. The explicit indentation-indicator digit is now **read** rather than matched-and-discarded, because discarding it under the new threshold would have created a **silent no-grant** — measured, and the alternative rejected on that measurement | `deferred-items.md` § From 27-58; `27-58-SUMMARY.md`; `27-CONTEXT.md` D-62 | **FIXED** — the gate's **FALSE RED** inverted: plant P58 **exit 1 → exit 0** over a loader value of `{"nested"=>"Read, Write, Bash, Glob, Grep,"}` which carries no grant; **re-measured on the final build** (rows *WR-01 W1*, *W2* — both sides of the threshold) and **still closed** |
| 5 | **WR-02** — the `\|`/`>` line-break derivation was applied to the indicator but not to the blank line, so a folded scalar still INVENTS names | `27-REVIEW.md` § Warnings | Closed by `27-58` in the same decision (**D-62** item 5): a blank line inside an open scalar is CONTENT, handled before the paragraph-break skip and folded through the line break the indicator already derives — the axis is extended, no second opinion about joins is written. This plan's own adversarial pass then found the fold surviving one line-shape further over (a MORE-INDENTED boundary) and closed that in the same construct | `deferred-items.md` § From 27-58; `27-58-SUMMARY.md` | **FIXED** — **re-measured on the final build** (row *WR-02 B1 folded blank*): the module now takes the LOUD arm where the loader's `"Agent(alpha, ga\nmma)\n"` carries a break the enumeration alphabet refuses; revert R6 reds **5** cases naming D-62 |
| 6 | **WR-03** — the new `state` differential couples two independent inputs, so it never generates the combination the live call site produces | `27-REVIEW.md` § Warnings | Closed by `27-59`: `nodeStartAtOffsetZero` becomes its own axis (**24 → 48** state vectors, 297,312 comparisons), the pre-fix capture was **REGENERATED**, and the live call-site LIST is derived from `scripts/frontmatter.ts` at run time so a fourth site fails by name. Regenerating exposed that the fixture was a **COMPOSITE** of two builds nobody had written down; each half was regenerated at its own commit | `deferred-items.md` § From 27-59; `27-59-SUMMARY.md` | **FIXED** — the negative control names all **3** missing combinations verbatim; **re-measured on the final build**: `IN-02 STATE differential — 6194 input(s) x 48 state(s) = 297312 cell(s) \| moved 572 \| provenance RECOVERED 572 \| provenance LOST 0`; revert R7 reds with **6,340** cells moved |
| 7 | **WR-04** — `noUnusedLocals` / `noUnusedParameters` were enabled on a config that excludes every test file | `27-REVIEW.md` § Warnings | Closed by `27-60`: `tsconfig.tests.json` extends the shipped-source config and overrides only the exclude list; reach goes **0 of 36 → 36 of 36** tracked `.test.ts`. **The review's "there are no violations today" was measured STALE** — round 11's own plans grew the harness past it and **SIX** real violations were found, each fixed AT ITS SITE with no exemption added and no flag loosened. Two were tells for MISSING cases, not dead weight | `deferred-items.md` § From 27-60; `27-60-SUMMARY.md` | **FIXED** — planted TS6133: new target **exit 2** naming the symbol, shipped target **exit 0** on the same plant; **re-measured on the final build** (§ From 27-61 § 3, row R8) |
| 8 | **IN-01** — blank lines inside a `\|` block scalar are dropped, so the flattened value is not the loader's | `27-REVIEW.md` § Info | Closed by `27-58` **in the same edit as row 5 (WR-02)** — the review itself said "fixing WR-02 fixes this", and it did. **This row exists because a merged disposition is still a disposition; a missing row is a silent drop.** The literal spelling was additionally pinned as a VALUE equality with the loader so the two axes stay tied together, which is what the review asked for beyond the shared fix | `deferred-items.md` § From 27-58; `27-58-SUMMARY.md` | **FIXED** — merged into **row 5**'s fix; **re-measured on the final build** (row *IN-01 B2 literal blank*): loader `"Agent(alpha, ga\n\nmma)"`, module takes the LOUD arm on the name set |
| 9 | **IN-02** — the narrowed fence-authority claim is derived for "is there a fence machine" but still PROSE for "does it answer the GENERAL question" | `27-REVIEW.md` § Info | Closed by `27-60`: `importsModule` / `nonTestImportersOf` / `classifyFenceMachine` turn the prose half into a property over a **derived 33-module importer corpus**. Written first as "exactly one class per member", the live tree **refused** — one member legitimately carries two true properties — so the assertion became the one the claim needs (exactly one `authority` carrying neither disqualifier, every other member carrying at least one) rather than suppressing a true fact to preserve a partition | `deferred-items.md` § From 27-60; `27-60-SUMMARY.md` | **FIXED** — the fail-proof's own first green was a **FALSE PASS** (the scan missed the bare side-effect import, the cheapest spelling); with the arm added the plant reds by name. **Re-measured on the final build** (§ From 27-61 § 3, row R9), where the property proved to be asserted **twice** |
| 10 | **IN-03** — the WR-03 source-scan pin is brittle in two ways: an unasserted `indexOf("\n}")` bound, and a negative matching COMMENTS as well as code | `27-REVIEW.md` § Info | Closed by `27-60`: bounded by an added `// ── end stripFencedBlockLines` section rule **asserted present before the slice is used**, head/tail/no-overrun identity checks, and the negative run over comment-stripped code with a >200-char non-vacuity floor. The marker was **added** in the file's own idiom rather than an existing one repurposed, and the reason is written at the site | `deferred-items.md` § From 27-60; `27-60-SUMMARY.md` | **FIXED** — **re-measured on the final build** (§ From 27-61 § 3, row R10): mode-A plant reds **by name** with the repair and is **undetected** without it; mode-B plant correctly stays green with the repair and **FALSE-REDS** without it |

### Part one (continued) — the items round 10's VERIFICATION raised beyond the review

`27-VERIFICATION.md` § gaps carries four named `missing` fixes and § deferred carries one item. Three
of the four restate criticals above; each still gets its own row **naming the row it merged into**,
because a merged disposition is still a disposition.

| # | Item | Raised in | What happened | Artifact carrying the evidence | Disposition |
|---|---|---|---|---|---|
| V1 | `missing` — "CR-01-new's fix: track which parts of a key's value a block scalar actually owns (a region property) rather than exempting the whole key" | `27-VERIFICATION.md` § gaps[].missing[0] | Delivered by `27-55`. **Merged into row 1.** The region-property direction is exactly what D-59 adopted; only the storage shape differs from the review's sketch, and that difference is recorded with its reason | `27-CONTEXT.md` D-59; `27-55-SUMMARY.md` | **FIXED** — merged into **row 1** |
| V2 | `missing` — "CR-02's fix: strip a node property at every header-introduction position, and ask `startsWithReference` about the node start that follows a recognised mapping separator" | `27-VERIFICATION.md` § gaps[].missing[1] | Delivered by `27-57` as **two** edits, exactly as stated. **Merged into row 2.** The two were proven **independent and complementary** by separate mutation controls, and § From 27-61 § 4 shows the same at the GATE: reverting the strip alone leaves the gate red (the fourth application point catches it LOUD), while reverting the fourth point alone reopens the silent arm | `27-CONTEXT.md` D-61; `27-57-SUMMARY.md`; § From 27-61 § 4 | **FIXED** — merged into **row 2** |
| V3 | `missing` — "CR-03's fix: give `blockHeaderAt` a nested-key production derived from YAML's own rule … and pin it with a DERIVED axis over key spellings, not four enumerated rows" | `27-VERIFICATION.md` § gaps[].missing[2] | Delivered by `27-56`. **Merged into row 3.** The axis is derived by **filtering** candidate spellings through the real exported `BLOCK_INDICATOR`, with liveness proven by re-filtering through a deliberately narrowed copy — 624 cells + 28 union cells, not four rows | `27-CONTEXT.md` D-60; `27-56-SUMMARY.md` | **FIXED** — merged into **row 3** |
| V4 | `missing` — "a widened D-52 loader-differential corpus that can express all three families **before** they are called closed" | `27-VERIFICATION.md` § gaps[].missing[3] | Delivered by `27-59`, and **not** by the shape five earlier rounds used. Adding one base member per reported family is circular over the FAMILY structure exactly as a per-arm corpus was circular over the ARM structure, so `27-59` adds **no base member at all**: the header is declared as PARTS and the parts are crossed. `AXIS_KEY_LINE_BASE` stays at **26** while cells go **2,544 → 16,704** | `deferred-items.md` § From 27-59; `27-59-SUMMARY.md` | **FIXED** — per-family expressibility measured on the final build: `27-55` 7,056 · `27-56` 11,232 · `27-57` 10,368 cells, with a non-empty three-way crossing; pre-round-11 mirror `3c7930b` reports **2,526** never-exemptible cells |
| V5 | **SPAWN-03's live-platform capture** — whether the main-thread coordinator's `Agent(<allowlist>)` grant is actually honoured by the Claude Code runtime | `27-VERIFICATION.md` § deferred and § Human Verification Required | Re-affirmed unchanged by `27-61` (this plan). No static gate can produce this evidence, and inventing one would be the faked gate `CLAUDE.md` forbids by name. `ROADMAP.md` was NOT edited and the wording agrees across all three records | `ROADMAP.md` standing-obligations row 1 (GAP-D1); `27-CONTEXT.md` D-56 item 10 / D-58 item 5; `.planning/REQUIREMENTS.md` SPAWN-03 row | **DEFERRED** — owner **Phase 33** (GAP-D1, requirement **CAP-01**; the capture itself is CAP-03); dated **2026-08-09**; status stays `UNKNOWN - verify` |

### Part two — completeness, asserted by count so a reader can check it

- Round-10 code-review findings raised (`27-REVIEW.md`): **10** — CR-01-new, CR-02, CR-03, WR-01,
  WR-02, WR-03, WR-04, IN-01, IN-02, IN-03. (Frontmatter tally `3 + 4 + 3 = 10`; body headings counted
  independently, also 10. Reconciled — they agree.)
- Round-10 verification items carried beyond those (`27-VERIFICATION.md`): **5** — the four named
  `missing` fixes and the SPAWN-03 deferral.
- **Total round-10 items raised: 15. Rows in the register above: 15. 15 == 15.**

If those two numbers ever differ, **the register is wrong, not the count** — the same non-vacuity
posture the harness applies to its own corpora, turned on the record itself.

- Dispositions partition as **14 FIXED + 1 DEFERRED + 0 REJECTED + 0 OPEN**, and
  **`14 + 1 + 0 + 0 == 15`.**

**No item is REJECTED.** Two *proposed remedies* inside otherwise-fixed rows were rejected by
measurement and are recorded in their rows rather than as rows of their own, because the ITEM was
closed either way: the review's `blockParts: Set<number>` storage shape (row 1) and its LAST-colon
key-end rule (row 3). A third, D-59's individual-region resolution, was implemented, measured and
rejected inside row 1's own work.

### Part three — the re-measurement

Every closure row above cites a transcript taken on the **FINAL build of this round**, `ff68c31`, not
on the build the plan that made the claim produced. The full table — **fifteen rows, fifteen still
closed**, with the `/usr/bin/ruby -ryaml` loader column — is § **From 27-61 § 5** and is not duplicated
here. It is not inherited: six plans edited these files after the first closure landed.

### Part four — standing obligations this phase carries INTO its next verification

Written here with a named owner each, so they survive a milestone archive move. Each is either
**measured on this build** or explicitly named as **carried**.

| Obligation | Measurement | Owner |
|---|---|---|
| **SPAWN-03's live-platform capture** | Not obtainable by any static gate. `node scripts/coordinator-resolution-precheck.js` exits **0** on this build, and states in its own output that the two runtime steps are NOT PERFORMED by it. **Measured this build** | **Phase 33** — GAP-D1 / CAP-01 (capture itself CAP-03) |
| **KIT-03 and SPAWN-04 remain unflipped** | All five underlying round-11 bypasses re-measured CLOSED on the final build (§ From 27-61 § 5), but a requirement's verified status is a verification round's call (D-58 item 4). **Measured this build; the rows are deliberately NOT moved** | **the next verification round** for phase 27 |
| **The `27-49` WR-04 exemption-bound residual** — the deleted per-exemption bound gave up one narrow detection band; the replacement corpus-level floor fires only past roughly half the loader-accepted corpus | Exemption list length **2**, membership unchanged, and the accounting **measured this build**: `loader-accepted 12349 \| exempt cells 78 \| disagreements 78 \| per-rule matched E1=32 E2=52 \| the DELETED bounds would have been E1=48 E2=64`. Direction unchanged | **a later round** — derive the per-rule ceiling from a quantity the rule does not read |
| **The `27-50` R1 wording residual** — the leading clause calls an INDENTATION run "residue" on 1,570 measured cells | A wording decision, not a defect; untouched by `27-55`…`27-61`. **Carried figure, named as carried** | **a later round** — split the clause and re-take the corpus comparison for BOTH shapes |
| **The `27-53` fence-classifier floor** | **MOVED by `27-60`, and here is exactly what moved.** The derived set is still **4** members and the "classify from a TypeScript AST" direction is unchanged — but the half the review called prose is now mechanical: `harness-local` is checked as *imported by no non-test module* over a derived 33-module corpus, all **3** non-authority members are mechanically disqualified, and a member matching no class reds by name. The floor's own disclosure (concatenated / `new RegExp` recognisers, `slice(0,3)` forms, a machine in a language it does not read) is **unchanged**. **Measured this build** | **a later round** — classify from a TypeScript AST |
| **`toggle[1]` is variable-name-sensitive** | **Carried, unchanged** — no plan in round 11 touched the toggle; `scripts/frontmatter.ts`'s fence claim is byte-unchanged by `27-60` | **a later round** |
| **"the two compiler flags do not cover `**/*.test.ts`"** — the second half of the same `27-53` obligation | **CLOSED by `27-60`.** `tsconfig.tests.json` reaches **36 of 36** tracked `.test.ts`, `npm run typecheck` runs both targets, and CI gained an explicit `typecheck` step where **none existed at all**. `npm run typecheck` exits **0** on this build | **nobody — closed** |
| **`27-55`** — the union axis's spelling arm places the block sibling only AFTER the payload, so block-BEFORE ordering is outside its shape space; and the pre-fix-mirror non-circularity count is **1 of 72**, non-empty but thin | **Carried, unchanged** — no later plan touched `AXIS_SPELLING` | **a later round** — add an ORDERING member to `AXIS_SPELLING` |
| **`27-56`** — `raw.trim()`'s alphabet (Unicode WhiteSpace ∪ LineTerminator) is wider than the module's declared `[ \t]` class; `AXIS_HEADER_POSITION` has 3 members and does not reach a compact nested sequence | **Carried**, and `27-57` measured that D-61 deliberately declined to extend `trimStart` to a new site (probe b7 measures why), while `27-58` added a **second site** (an NBSP-only line inside an open scalar becomes a break run on a document libyaml REJECTS). Named as carried, with the second site named | **a later round** — decide whether the continuation path should use `firstOutsideDeclaredWs`, with the repository-wide value map taken before and after |
| **`27-56`** — this repository's vitest **intercepts console output**, so the file's "PRINTED, never silent" skips are invisible on a default run | **RE-MEASURED this build**, and still true: `npx vitest run scripts/frontmatter.test.ts` prints **0** of the three headline measurement lines; the same run with `--disableConsoleIntercept` prints **3**. The D-60 dump `27-56` added writes to a caller-named file instead; the pre-existing console-based skips are unchanged | **a later round** — switch them to a caller-named file, or set the flag in the test script |
| **`27-57`** — `tools:` / `  &a: b >-` refuses where libyaml reads a no-grant value (pre-existing, byte-identical on both builds, LOUD direction) | **Carried, unchanged** | **a later round** — decide whether a property whose name ends in a colon should be readable at all, and re-take the repository-wide value map |
| **`27-58`** — **a blank line inside an open PLAIN (non-block) scalar is still folded to a space**, inventing a name on a loader-ACCEPTED document | **Carried, and PINNED at its current wrong answer by a named case** so a later round cannot read the green suite as coverage of it. The fix lives in the continuation-fold path, outside the construct D-62 scopes itself to | **a later round** — the continuation fold, with its own repository-wide value map |
| **`27-58`** — trailing break runs: `clip` and `keep` chomping keep breaks this module discards (3 of 5 spellings); a whitespace-only MORE-indented line is content to the loader and a break run here | **Carried, unchanged.** Trailing / whitespace-only characters only; name sets agree on all five chomping spellings | **a later round**, if a consumer ever needs the trailing break |
| **`27-59`** — the shared D-52 corpus does **not** pin `27-55`'s edit (R1), `27-57`'s edit B (R4) or `27-58`'s edit B (R6) | **RE-MEASURED and RECONCILED this build.** All three ARE pinned by the whole suite (§ From 27-61 § 2 — R1 by `27-55`'s own union axis, R4 by `27-57`'s CONTROL R, R6 by `27-58`'s B rows), which is the owner `27-59` itself named. **The obligation stands unchanged**: the SHARED corpus still cannot see these three families, and that is the property `27-59` was measuring | **a later round** — a token-carrying quoted sibling; an alias member on the property axis; and for R6 a third compared fact (the VALUE), which is a decision rather than an addition |
| **`27-59`** — the pre-fix capture is a COMPOSITE regenerated at two different commits | **Carried as a recorded FACT, not a defect.** Both commits are asserted to be real objects, the provenance is recorded IN the fixture, and the coupled sub-slice matches the capture it replaces with **0/0/0** mismatches | **nobody — recorded so it is not rediscovered** |
| **`27-60`** — `scripts/frontmatter.test.ts:14245-14247` shares BOTH IN-03 brittleness modes | **Carried, unchanged.** `27-60` deliberately did not edit it, so it would not change another plan's evidence; `27-61` does not either, for the same reason | **a later round** — apply `27-60`'s three repairs there |
| **`27-60`** — five further brittleness-scan hits (mode-A `branch`, `block`; mode-B `source`, `body`, `block`) are **NOT ADJUDICATED**; the scan itself is a name-based floor with known false positives and is not committed as a gate; the IN-02 importer scan has its own named floor | **Carried, unchanged** | **a later round** — classify each hit as fixture, deliberate or genuine; the scan needs scope resolution before it could be promoted |
| **`27-61`** — the three assertion-shaped round-11 edits (R8, R9, R10) leave the suite green when reverted alone | **Measured this build** (§ From 27-61 § 3). Not a missing pin but a category fact — removing an assertion cannot red anything — and each is pinned by a paired plant instead. R9's property proved to be asserted **twice**, measured by blinding both | **a later round** — if a stronger claim is ever wanted, promote the paired plants into committed cases |
| **The `27-48` scope question is SETTLED, not carried** | Closed by D-57's closing paragraph and measured by `27-52`. Recorded so it is not re-opened from a third symptom | **nobody — closed** |

### Part five — the round-wide specless-probe equality, in one checkable place

**Scoping.** The coverage report carries **27** rows across the ten requirement IDs. **20** belong to
requirements already verified clean or validly deferred, whose edge and prohibition predicates were
authored across plans `27-01` … `27-54`; they are not re-authored in round 11, and that is a **scoping
decision, not a drop**. **7** bear on the round-11 gap surface — KIT-03's six and SPAWN-04's one.

**The equality:**

`7 gap-surface probe rows == 5 authored explicit + 1 backstop + 1 unresolved-and-flagged + 0 dismissed`

**Per-plan distribution:** `27-55` **3** (KIT-03 ordering, adjacency, empty — all explicit) ·
`27-56` **1** (KIT-03 encoding — explicit) · `27-57` **1** (SPAWN-04 unclassified — unresolved,
surfaced as a flagged planner assumption) · `27-58` **2** (KIT-03 boundary explicit, KIT-03 precision
backstop) · `27-59` **0** · `27-60` **0** · `27-61` **0**.

**`3 + 1 + 1 + 2 + 0 + 0 + 0 == 7`**, and **`5 + 1 + 1 + 0 == 7`**. Both sums are 7.

**SPAWN-04's flagged planner assumption, restated verbatim from `27-57` so a reader does not have to
hunt it:**

> **THE PLATFORM BOUND, RESTATED VERBATIM AND NOT INFERRED AWAY: `UNKNOWN - verify`.** Whether Claude
> Code itself honours a mapping under an allow-list key as a tool grant was **not** confirmed against
> the platform, and no live platform escalation is claimed. The finding stands on this module's own
> stated contract — the token is in the loaded value of the allow-list key and the guard read it as a
> no-grant, which is the guard's own failure regardless of what the platform does with the mapping.

Its acceptance evidence is `27-57`'s inverted end-to-end gate replay, re-run on the final build as
plant **P57** in § From 27-61 § 4.
