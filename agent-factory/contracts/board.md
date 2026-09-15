---
kind: contract
contract: board-grammar
requirement: DASH-01
---

# Contract: the board grammar (DASH-01)

This document is the authoritative schema for `plans/board.md` — the single source of WIP truth
in a grugops repository. The schema is written in clear professional voice because it is a trace
and safety surface: the board is what a human reads to learn where work stands, and a parser that
quietly reinterprets it reports a state nobody wrote.

The only sanctioned reader of this grammar is `scripts/board-model.ts` (compiled to
`scripts/board-model.js`). No other module parses board headings or board rows. A second reader
would be free to disagree with this one, and a disagreement between two parsers is invisible until
it has already misreported the board.

The posture here is admission, not interpretation. A small canonical form is stated below, a
document written in exactly that form is admitted, and every other byte is refused by name. The
parser is never widened once per counter-example. Refusal is loud: a refused line is reported with
its line number, so a human sees what the projector declined to read.

## Headings

A **column heading** is a level-two ATX heading whose suffix is one of exactly three forms. The
suffix count is pinned two-sided in `scripts/board-model.ts` as `HEADING_SUFFIX_COUNT`. A fourth
form is a decision recorded here first, never a bumped constant.

| Form | Shape | Column kind | Numbers carried |
|------|-------|-------------|-----------------|
| Limited | `## <Name> (WIP <live>/<limit>)` | `limited` | `claimedLive`, `limit` |
| Unlimited | `## <Name> (WIP unlimited)` | `unlimited` | none |
| Blocked | `## Blocked (visible, time-tracked)` | `blocked` | none |

```markdown
## In Development (WIP 1/3)
## Backlog (WIP unlimited)
## Blocked (visible, time-tracked)
```

Rules that bound the three forms:

- `<Name>` is whatever precedes the suffix, trimmed. Two headings whose names match remain two
  separate columns, in the order they appear on disk.
- The Blocked form admits the single name `Blocked`. A heading such as `## Stuck (visible,
  time-tracked)` opens no column.
- A level-two heading whose suffix matches none of the three forms is a **non-column heading**. It
  opens no column, it closes any column already open, and its own lines belong to a non-column
  section. `## Columns (spec §6.1)`, `## Conventions` and `## Notes (bootstrap, 2026-06-05)` are
  all non-column headings.
- A heading at level three or deeper never opens a column, and never closes one.
- The heading scan is anchored at the start of the line. An indented heading opens no column,
  because indented example boards appear inside documentation blocks in this very file's sibling,
  `plans/board.md`.
- A comment-blanking pre-pass runs before the heading scan, so a heading inside an HTML comment is
  invisible to this grammar. See the Comments section below.

`## Blocked (2)` is **documented non-grammar**. The pre-Phase-32 builder specification showed that
shape, so it appears in real trees. It fails every form above, so it opens no column and its rows
are reported as unparsed lines. The projector shows the refusal rather than guessing at intent.

### Two deviations from the pre-Phase-32 validator, named rather than discovered

`scripts/validate-agent-factory.ts` carried its own column parser until Phase 32. It stripped
`\s*\(WIP[^)]*\)\s*$` from a `##` line and trimmed what was left. That helper is deleted and the
validator now imports this grammar, and the two behaviour changes the swap makes are recorded here
so a reader meets each as a decision rather than as a surprise.

| Heading | The old helper saw | This grammar sees |
|---------|--------------------|-------------------|
| `## Blocked (visible, time-tracked)` | a column named `Blocked (visible, time-tracked)`, so a ticket with `column: Blocked` was reported as being in no board column | the column `Blocked` |
| `## Columns (spec §6.1)` | a phantom column named `Columns (spec §6.1)`, which a ticket could claim and pass membership | a non-column heading, opening no column |

Both are defect fixes and both change what the validator reports. The kit's own board carries both
headings, so both defects were live on every repository the kit installs. What is preserved
unchanged is the rule that motivated the old helper — exact-name equality after the suffix strip,
never a bare prefix match — and the two board-to-ticket messages the validator prints.

### Column names and ticket status

A ticket file names its column in frontmatter as `column:` and its status as `status:`. The status
is the kebab-case form of the column name, computed by `kebab()` in `scripts/board-model.ts`.
Membership is decided by exact equality of the column name after the suffix strip. A bare prefix
match is refused: the column `In` does not match the heading `## In Development (WIP 0/3)`.

### Ticket documents

A ticket lives at `plans/tickets/<ID>.md` and opens with a frontmatter region between two `---`
lines. The region admits exactly eight keys, and the set is closed. A ninth key is a decision
recorded here first.

| Key | Carries |
|-----|---------|
| `id` | The ticket identifier. Absent, the file name without its extension is the identity. |
| `title` | The one-line description a human reads. |
| `status` | The kebab-case form of `column`. |
| `column` | The board column the ticket claims. |
| `size` | The sizing token, under the scheme `factory.config.json` names. |
| `priority` | The priority token, under the scheme `factory.config.json` names. |
| `epic` | The epic identifier this ticket belongs to. |
| `feature` | The feature identifier this ticket belongs to. |

A key outside that set is refused by name rather than ignored, because ignoring an unknown key
gives a document a second place to hide a value. A key written twice is refused, a region that
never closes is refused, and the remaining two refusals are told apart by what is wrong with the
line. A **control character** inside the region — a C0 byte other than the tab and the newline, or
DEL — is refused as `control-character`. Any other line that is not `key: value` or `key:` is
refused as `unrecognized-line`, **a tab anywhere in the line included**: after the colon, indenting
the line, inside the value or trailing it. A tab is refused because its rendered width is
renderer-dependent, so an indentation-significant region carrying one means different things to two
readers looking at the same bytes — not because nobody writes one. The body beneath the region is
the ticket's prose and is never interpreted.

A document is normalized before the grammar reads it, and exactly two things are normalized: a
single leading byte-order mark is removed, and Windows line endings are folded. Neither is
content — both are what an editor wrote around the document — and the same one authority does it
for board documents and ticket documents alike, so the projector and the structure validator cannot
disagree about what a document's first line is. A **second** byte-order mark is content: a document
carrying one is not a Windows save, and it is refused by the rules above rather than normalized
again.

The reader of this class is `parseTicketDocument` in `scripts/board-model.ts`. It is a different
document class from the kit adapter frontmatter that `scripts/canonical-frontmatter.ts` admits, and
the two key sets are deliberately separate: the adapter schema is the authority for a spawn grant,
and a ticket carries no grant.

The structure validator reads tickets through that one reader, and reports a refused document by
its refusal code without evaluating its column or its status: a value read out of a document the
grammar refused is a guess, and a guess is not a thing to validate a board against. So a ticket
carrying no frontmatter region — which an earlier validator read anyway, taking whatever `column:`
line it found in the prose — is now an error naming `no-opening-delimiter`, and a ticket whose
region names one key twice is an error naming `duplicate-key`, where both once passed silently.

`docs/initial/agent_factory_builder_spec_v2.md` shows a ticket template that disagrees with this
grammar, and agents read it. Its § 6.1 example — introduced as "carries a status line in its front
matter" — is a fence of six bare key lines with **no `---` delimiters**, and it is **documented
non-grammar** in exactly the sense the `## Blocked (2)` heading is. A ticket written in that shape
opens no frontmatter region, so it is refused by name as `no-opening-delimiter`, and since the
structure validator reads tickets through this one grammar that refusal is an error rather than a
warning. What to write instead: the same six key lines, between an opening `---` line and a closing
one, at the top of the file. The specification carries a pointer to this contract beside the
example; this paragraph is the authority it points at.

## Rows

A **ticket row** is a top-level bullet carrying a bracketed identifier, one space, and a title.

```markdown
- [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)
- [ABC-016] Empty-state UI
- [DOG-001] Project scaffold  (epic: EPIC-006, size: M, P0)  — merged 2026-06-06
```

The grammar is `- [<ID>] <title>` and nothing more. Everything after the title is opaque:

- The **parenthetical** opens at the first occurrence of two spaces followed by `(`, and runs to
  its balanced closing parenthesis. Its contents become one opaque string named `meta`. Nothing
  inside `meta` is interpreted, so nested parentheses are preserved verbatim.
- Everything after the balanced close becomes a second opaque string named `trailer`. Nothing
  inside `trailer` is interpreted either.
- A row with no parenthetical is legal. Its `meta` is null and its `trailer` is empty.
- A parenthetical that never closes leaves the whole remainder as the title, with a null `meta`.
  The row stays legal, because an unclosed parenthesis is a typing slip rather than a new shape.
- The row scan is anchored at the start of the line. An indented bullet is not a ticket row.

The two-space gap is what discriminates a real parenthetical from a title that happens to contain
parentheses. A title such as `Login 500 (runtime .env not loaded)` uses one space, so the split
lands on the later two-space group. The rule was measured against 141 rows drawn from two
agent-written boards, the builder specification, and the worked examples in this repository. All
141 rows are admitted under it.

### Identifiers

An identifier opens with a capital letter, continues in capitals and digits, and ends in a hyphen
followed by digits. `ABC-014`, `DOG-001` and `EPIC-006` are identifiers. Any other bracket content
makes the line unparsed.

Where `factory.config.json` carries `id_prefix`, a ticket identifier's prefix equals that value,
and a row whose prefix differs is an unparsed line rather than a conflict. The parser holds no
dial, so the read seam passes the configured value in; with no dial value the prefix rule has
nothing to compare against and every conforming identifier is admitted. Epic and feature
identifiers are exempt, because they carry their own fixed prefixes.

Identifiers prefixed `EPIC` or `FEAT` are a **second class**. They record epics and features rather
than tickets, they are collected separately, and they are never joined against `plans/tickets/`.
Epic rows do not count toward a column's WIP number.

## Comments

Every `<!-- … -->` span is blanked before any heading scan or row scan runs. Blanking replaces each
character of the span with a space, so every line number survives into the reported model. A
comment that opens without closing blanks the remainder of the file, which is the fail-closed
direction: a board renders visibly empty rather than partially and confidently.

The rule exists because `plans/board.md` ships a documentation block carrying a structurally valid
example board, indented by four spaces. Indentation alone is not the defence. One stray left-trim
in a parser would promote that example into live state.

## Update lines

A line matching `_Updated: <YYYY-MM-DD> by <actor>` is an update entry carrying a date, an actor,
and the remaining text. An `_Updated:` line in any other shape is an unparsed line. Update entries
are their own class, so they never become rows.

## Sections and the line partition

Every line of a board document lands in exactly one bucket. The partition is total and disjoint,
and `scripts/board-model.test.ts` asserts both halves over counts derived independently of the
parser's own loop.

| Bucket | What lands there |
|--------|------------------|
| `columns[].rows` | A legal ticket row under a column heading. |
| `epicRows` | A legal epic or feature row under a column heading. |
| `updates` | A canonical update line, wherever it appears. |
| `preamble` | A content line before the first level-two heading. |
| `nonColumnSections[].lines` | A content line inside a non-column section. |
| `unparsed` | Anything else with content, reported by line number. |
| no bucket | A blank line, and every level-two heading line. |

The parser applies these rules in order:

- A level-two heading is never content. A column heading opens a column, and any other level-two
  heading opens a non-column section. Either one closes whatever was open before it.
- A heading at level three opens nothing, so it becomes a content line of the current section.
- A blank line is never content.
- A canonical update line is an update entry wherever it appears.
- A legal row under a column heading becomes a ticket row or an epic row.
- A legal row outside every column is an unparsed line carrying a null column.
- Every remaining content line is classed by position. Inside a non-column section it is a section
  line, before the first heading it is a preamble line, and inside a column it is unparsed.

`preamble` ends at the first level-two heading rather than at the first column heading. A document
whose only heading is `## Notes (bootstrap, 2026-06-05)` carries no columns at all, and its prose
belongs to that named section.

One shape is named here as **not yet grammar**, so a reader meets it as a decision rather than as a
defect: a bullet nested beneath a ticket row is an unparsed line. A nesting grammar was considered
and not written this phase.

## Conflicts

A conflict is a disagreement between two sources that describe the same thing. The projector
reports every conflict and resolves none. Silent resolution is how a board and a ticket file drift
apart with nobody told.

There are exactly seven kinds. The set is closed, and an eighth kind is a decision recorded here
first.

| Kind | Raised when |
|------|-------------|
| `board-vs-ticket` | A ticket file names a different column, or a status that does not match. |
| `ticket-unplaced` | A ticket file exists with no row on the board. |
| `ticket-duplicated` | One identifier carries rows under two or more headings. |
| `row-without-file` | A board row names an identifier for which the reader holds no admitted ticket document. |
| `wip-limit` | A heading's stated limit differs from the configured limit. |
| `wip-count` | A heading's claimed live number differs from the rows counted. |
| `column-missing` | A configured column has no heading on the board. |

The conflict order is total and deterministic: kind in the order this table lists them, then ticket
identifier, then column, then the line the conflict was derived from. A committed golden whose
order depended on a filesystem listing would fail on another machine for a reason nobody could act
on.

Every conflict carries the same payload: a `kind`, an optional `ticketId`, an optional `column`, an
`expected` value, an `actual` value, and a `source` naming where the expectation came from.

A duplicated row renders under both headings, and the conflict names both. A row with no ticket
file still renders. The projector never hides a line in order to report a conflict about it.

**A conflict that depends on a complete listing is not raised while that listing is not `ok`.**
`row-without-file` and `ticket-unplaced` both assert something about every file in `plans/tickets/`,
so neither is derived unless the tickets source read cleanly. A conflict derived from a listing that
failed is an assertion about a filesystem nobody read. The badge reports the one thing that is true:
the listing failed. The other five kinds are unaffected — each is a claim about a document that was
read, or about the board and the dial alone.

**A refused document is never reported as an absent one.** `row-without-file` is raised when a board
row names an identifier for which the reader holds no admitted ticket document — which covers two
different facts, and the conflict's `actual` states which one it is. When no file on disk carries the
identifier, `actual` reads `no ticket file carries that identifier`. When a file does carry it and
the ticket grammar refused it, `actual` names the file and the refusal code instead, and asserts
nothing about the file's absence. A document the grammar refused also appears in `readErrors` with
its path and its refusal code, so the refusal survives on the channel a human reading stderr and a
consumer reading the document each have. The projector may say it could not read something; it may
not say something is not there when it is.

**Two ticket files claiming one identifier are reported by name, and the identifier is joined
once.** Ticket identifiers are unique, so a second file claiming one is a disagreement between two
documents rather than between a document and the board. It appears in `readErrors` with the code
`duplicate-id`, naming both files and saying which of the two is joined: the first by file name, a
rule that does not move with the order a filesystem lists a directory in. Neither file is modified
and neither is hidden. No conflict is invented for the second file — one identifier produces one
`board-vs-ticket` entry and one `ticket-unplaced` entry, never two identical ones, because every
derivation that consumes the ticket population reads the identifier once.

`ticket-unplaced` stays silent for a refused document. A refused document's identifier is the file's
stem rather than something the document stated, so reporting it as an unplaced ticket would be the
same false claim in the other direction — an assertion that a document nobody could read is a ticket.
Its refusal is reported once, in `readErrors`, where it is true.

Unparsed lines are not conflicts. They are a parser outcome rather than a disagreement between two
sources, so they live in `unparsed[]` and the renderer counts them per column.

### The column set

The board's headings decide which columns exist and in what order. `agent-factory/config/factory.config.json`
supplies the expected limit per column under `wip_limits`. A heading whose limit differs from that
dial raises `wip-limit`, and a dial column with no heading raises `column-missing`. A heading column
absent from the dial is legal, because an unlimited column and the Blocked column carry no limit.

### WIP counting

A limited heading states a live number and a limit. The live number is compared to the rows counted
under that heading, and a disagreement raises `wip-count`. Nothing is corrected. The renderer shows
the claimed number, the counted number and the limit together, so a human sees which one to fix.

Epic rows are a separate class, so they never count toward a column's WIP number.

## Staleness

Reading a source produces one of three outcomes, and the three are distinct.

| Outcome | Meaning |
|---------|---------|
| `ok` | The source was read cleanly, and the value is current. |
| `stale` | The source could not be read cleanly, so the previous good value is carried. |
| `unavailable` | The source is absent. The arm carries no value at all. |

The joined sources are `board`, `tickets`, `queue`, `context`, `traceability` and `config`. Each
carries its own `readAt` timestamp and its own `stale` record, which names a reason and the time of
the last good read. Staleness is per source, so a missing queue directory never hides a fresh board.

The header shows one badge naming every stale source and the age of its last good read. The
`--json` document carries the same per-source fields, so a pipeline sees what a terminal reader
sees.

**Absent is a legitimate state, and unreadable is stale.** A repository with no `.grugops/`
directory has no queue, which renders as "no queue" with no badge. An empty `plans/tickets/`
directory is an empty ticket list. A file that existed at the previous read and is now missing is
stale, as is a permission error and a torn read. In each of those cases the previous good value is
carried, and the badge says so. A directory the projector cannot list is stale for the same reason:
only a directory that does not exist is absent.

**A torn read and a file that will not decode are different findings.** A torn read is a statement
about a WRITER: the file changed between the two stats that bracket the read, so no read of it is
trustworthy. A file whose bytes are not valid UTF-8 is `unreadable`, not torn, because nobody
modified it — the bytes arrived and the content cannot be used. It is reported on the first read and
not re-read, since the bytes will not decode differently on a second attempt.

**Every path the projector reads is resolved to its real location and asserted inside the repository
root before it is opened, and a path that resolves outside the root is refused and reported rather
than read.** Resolution follows every link in the path, so a linked directory and a linked file are
the same question. A link whose target is inside the root is read normally, and a path that does not
exist is absent rather than refused.

**A refusal names the entry path and the destination it resolved to, and never quotes the content of
a file outside the root.** The refusal appears as a read error against the one source it belongs to,
which is stale for as long as the refusal stands; the other sources are unaffected. The rule is over
PATHS: a hard link created inside the repository to a file whose other name is outside it is a path
inside the root and is read, which the projector records rather than claims to prevent.

**Every claimed task the queue's listing hands the reader becomes either a row or a named read
error.** A task directory with no claim record, a record with no timestamp, a record carrying more
than one timestamp, and an entry whose name the reader will not walk are each reported with their
own code rather than skipped in silence. None of the four makes the queue stale: the reader obtained
what was there and refused it by name, which is a finding about a record rather than about a read.

There is no empty-board output state distinct from zero rows under real headings. A board whose
columns are all empty renders its columns with zero counts. A board that could not be read is stale
or unavailable, and the reader is told which of the two it is.

## Control characters on the way out

**Board content is untrusted input to a terminal emulator, and both output channels are held to that
rule.** A title, a meta, a file path quoted back in a refusal and the repository root taken from the
command line all reach a terminal that acts on control introducers. Every C0 code point, every C1
code point and DEL are removed from the plain frame's cells, from the `--json` document, and from
every diagnostic on the error channel. The C1 range is named explicitly because the 8-bit CSI and
OSC introducers are acted on by common terminals in UTF-8 mode and are not escaped by JSON
serialization, so a document that was serialized and not sanitized carries them verbatim.

The `--json` document is sanitized as serialized text rather than field by field, because a key in
that document can be content-derived: the per-column limits the dial records are keyed by column
name. Removal never touches JSON structure, since no structural character is a control character.

What this does not do is decode the document on a consumer's behalf. An escaped control code point
inside a string — the six-character form a JSON serializer writes — is text in the document and
stays text. It becomes a control character only if a consumer decodes the value and prints it, and
a consumer that prints board content to a terminal sanitizes it for the same reason the projector
does.

## Bounds

A large board degrades visibly. It is never refused, and no row is ever dropped.

Two ceilings are measured on every parse, each in a stated unit:

| Ceiling | Unit | Value |
|---------|------|-------|
| Board size | UTF-8 bytes of the input as given | 1,048,576 |
| Longest line | UTF-16 code units | 65,536 |

Passing either ceiling sets `bounds.exceeded`, and the header reports the measured size. A byte
count and a code-unit count disagree on any board carrying characters outside Latin-1, so each
number states its own unit: the header rounds the board size to bytes and prints the longest line as
a grouped count of characters. The snapshot carries both numbers unrounded.

Three opaque strings are held to a cap of 1,024 UTF-16 code units: a row's `meta`, a row's
`trailer`, and an update entry's `text` together with its `actor`. A string held at its cap ends in
a single-character ellipsis, and the record carrying it sets `truncated`. A cut lands before a
surrogate pair rather than between its halves, so no lone surrogate reaches a terminal.

A row's title is not capped. The title is what identifies the row to a human, and the long line
measured in the corpus was a parenthetical rather than a title.

These four numbers are decisions rather than tuning knobs. Raising one to accommodate a board that
grew is the move this contract refuses. The board is trimmed or split instead, and the projector's
job is to make the growth visible.

### The directory listing

A fifth bound sits below the four parse ceilings above and applies to directories rather than to a
document: every directory the projector lists is bounded at 10,000 entries, and the source whose
listing hit the bound is stale with the reason `bounded`.

**Which entries survive the bound is decided by name.** The entries are sorted before the bound is
applied, so a directory carrying more than 10,000 entries yields the first 10,000 by name — the
same entries on every machine, whatever order a filesystem happens to list them in. Two machines
reading one tree therefore report the same ticket set and the same conflicts. Applying the bound
first and sorting afterwards would make the order stable and leave the membership a function of the
filesystem, which is a difference nothing on the screen would show.

### The WIP number

A heading's WIP numbers are read as base-ten integers from an anchored digits-only shape. A heading
whose number is not a base-ten integer fails the heading form, so it opens no column and its rows
become unparsed lines. The number is never rounded, and it is never coerced to zero. A refusal a
reader can see beats a number nobody wrote.

## Reconciliation and non-goals

Two cross-checks are named here as **not performed this phase**, so a reader meets each as a
decision rather than as an omission. The per-ticket traceability cells — code, tests, UAT, release —
are read as opaque cells rather than joined against the ticket. And the projector states no opinion
about a ticket identifier that is well formed and absent from the traceability matrix; the
validator already warns about that one.

`docs/initial/agent_factory_builder_spec_v2.md` lists `web UI, dashboards, SaaS platform` among its
out-of-scope items. This contract serves a read-only terminal projector over files that already
exist on disk. It is not a web UI, not a hosted service, and not a listening socket. It opens no
port, it serves no page, and it writes no file.

`.planning/REQUIREMENTS.md` records the same boundary from the other side. A web renderer over the
published snapshot shape sits under future requirements, deliberately deferred. A write-capable
dashboard and any listening socket sit under the explicit out-of-scope exclusions for this
milestone. The builder specification's non-goal therefore stands unchanged.

That specification also shows a board example that disagrees with this grammar, and agents read it.
Its `## Blocked (2)` heading is **documented non-grammar**. The heading matches none of the three
forms, so it opens no column, and the rows beneath it become unparsed lines the renderer counts and
shows. Those rows are legal row shapes in themselves; what refuses them is the heading above them.

The refusal is loud by design. The alternative is a parser widened once per counter-example until
it admits everything and discriminates nothing.

## Provenance

This document is the single authority the board grammar derives from.

- `scripts/board-model.ts` is the only sanctioned reader of a board. It cites this contract in its
  header, and it states in code the shapes this document states in prose. No regular expression is
  restated here, because two spellings of one grammar is the drift class this repository has
  already paid for.
- The parse-oracle corpus derives its legal and illegal axes from the shapes named here. A legal
  axis is a shape this document admits, and an illegal axis is a shape this document refuses.
- The committed golden snapshot derives its fields from the shapes named here. A field the golden
  carries is a field this document states.

A newly admitted shape is recorded here first and implemented afterwards. A counter-example this
grammar refuses is a decision to take, never a pattern to widen.
