# `board-snapshot` — the fixture the committed golden is rendered from

This is a miniature repository, not a validator fixture. It carries no `AGENTS.md`, no role corpus
and no packaging, so `scripts/validate-agent-factory.ts` is never pointed at it;
`scripts/validate.test.ts` declares it in the non-repository half with that reason.

It exists because **seven conflict kinds cannot all be found in the wild**. Plan 32-05's research
measured every real board reachable from this machine and found zero WIP mismatches: not one
heading's claimed live number disagrees with its row count, and not one heading's limit disagrees
with the dial. A suite that replayed only real boards would report green over a comparison that had
never once been evaluated. So every kind below is manufactured here, and
`scripts/board-model.test.ts` asserts the golden's distinct-kind set equals `CONFLICT_KINDS` in
both directions.

## Which file and which line manufactures which conflict kind

| Kind | Manufactured by |
|------|-----------------|
| `board-vs-ticket` (column) | `plans/board.md:36` places `ABC-102` under `Ready`; `plans/tickets/ABC-102.md:5` names `In Review`. |
| `board-vs-ticket` (status) | `plans/tickets/ABC-103.md:4` says `ready` where `kebab()` of its own `column:` on line 5 is `in-development`. |
| `ticket-unplaced` | `plans/tickets/ABC-200.md` exists and no row on `plans/board.md` names it. |
| `ticket-duplicated` | `plans/board.md:51` and `plans/board.md:55` both carry `ABC-105`, under `In Review` and under `Done`. |
| `row-without-file` | `plans/board.md:43` names `ABC-999` and `plans/tickets/ABC-999.md` does not exist. |
| `wip-limit` | `plans/board.md:49` claims a limit of 3; `agent-factory/config/factory.config.json:8` configures 2. |
| `wip-count` | `plans/board.md:39` claims 2 live and three ticket rows follow it on lines 41-43. |
| `column-missing` | `agent-factory/config/factory.config.json:9` configures `Ready to Release` and no heading opens it. |

The duplicated row also produces a third `board-vs-ticket`: its `Done` placement disagrees with the
`In Review` its file names. That is the honest answer rather than a special case — one row can be
wrong in two ways at once, and the projector reports both.

## What else the tree exercises

| Shape | Where | Why it is here |
|-------|-------|----------------|
| The comment pre-pass | `plans/board.md:12-23` | A four-space-indented mini-board inside an HTML comment. No column, row or update in the golden carries a line number from that span. Blanking is the defence; the indentation is a second one. |
| The kit placeholder update | `plans/board.md:3` | `_Updated: <ISO date> by <role>_` is not the canonical shape, so it is preamble rather than a finding on a fresh install. |
| The canonical update | `plans/board.md:10` | The one `updates[]` entry. |
| Preamble | `plans/board.md:3-8` | The `preamble[]` bucket, non-empty. |
| A non-column section | `plans/board.md:25` | `## Notes (fixture)` opens no column; its prose is section content rather than unparsed. |
| Unparsed lines | `plans/board.md:37`, `46-47` | A foreign-prefix row refused by `id_prefix`, and a prose paragraph inside a column. |
| An epic row | `plans/board.md:44` | A second class (D-02): never joined against `plans/tickets/`, never counted toward WIP. Remove it and `wip-count` still reads `counted 3`. |
| The three heading kinds | `plans/board.md:30`, `34`, `39`, `49`, `53`, `57` | `unlimited`, `limited` and the single legal `blocked` heading. |
| A well-formed claim | `.grugops/queue/claimed/abc-104-implement/claim.md` | The queue source reads it and the row reaches the snapshot. |
| A tampered claim | `.grugops/queue/claimed/abc-105-tampered/claim.md` | Two `at:` lines. The record is skipped and the path is named in `readErrors`, so the tamper skip is reached by a committed artifact. |
| A context task | `.grugops/context/abc-104-implement/` | Two notes, one superseding the other, so the supersede fold reports two notes and one live. `index.jsonl` is the derived render. |
| The traceability comment | `plans/traceability.md:3-14` | An example table row inside the file's own HTML comment. It contributes no row, because the traceability reader runs the board's comment pre-pass first. |

## Regenerating `expected-snapshot.json`

One command, so a legitimate shape change is never a hand edit:

```sh
npm run build && GRUGOPS_UPDATE_BOARD_GOLDEN=1 npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "golden"
```

The golden case rewrites this file when `GRUGOPS_UPDATE_BOARD_GOLDEN` is set and compares against it
when the variable is absent. Production callers set nothing, and the comparison is what runs in CI.

Every `readAt` and every `stale.since` in the golden is the fixed placeholder
`1970-01-01T00:00:00.000Z`, and `repoRoot` and `generatedAt` are normalized the same way. A golden
that embedded the wall clock or an absolute path would fail on the second run, and on every other
machine, for a reason nobody could act on.

Any change to the snapshot's shape bumps `SCHEMA_VERSION` in `scripts/board-model.ts` and
regenerates this golden in the same commit (D-19).
