---
kind: contract
contract: build-request
requirement: BR-01
---

# Contract: build requests (BR-01 to BR-07)

A build request is a question or a change that a role needs from the owner of an upstream source.
A human carries it to that owner. grugops never writes into the upstream repository. This file
holds the forms of a build-request file and of the `requests` report. Workflow 20,
`agent-factory/workflows/20-upstream-sources.md`, holds the procedure. One grammar,
`scripts/build-request-model.ts`, decides every form below. The structure validator,
`tools/grugops/state-check.js` and `tools/grugops/upstream.js` all apply it.

## File

- A build request is one file, `memory-bank/plans/build-requests/BR-<n>.md`, one request per file.
- `<n>` is a number with no leading zero, so `BR-1` and `BR-01` cannot both exist.
- A new request takes the highest number in the folder plus one. A number is never reused:
  answered and withdrawn files stay in the folder.
- BA/PM is the only writer of a build-request file. No program writes one.
- When an upstream owner is fed by more than one repository, give the repository name with the ID
  when you carry the request, because `BR-3` names a different request in each repository.
- A name in the folder that is not `BR-<n>.md` is refused by its name and never opened. A name
  that starts with `.`, such as `.gitkeep`, is not a record.

## Frontmatter

The file opens with a `---` line, and the next `---` line closes the frontmatter. Each line is
`key: value`. The key set is closed, and each of the five keys appears once with a non-empty value:

| Key | Form |
|-----|------|
| `id` | `BR-` then a number with no leading zero, equal to the id in the file name |
| `status` | one of `open`, `carried`, `answered`, `withdrawn` |
| `source` | a declared source id: a lowercase letter, then up to 31 lowercase letters, digits and hyphens |
| `pin` | the full commit the request was raised at: a 40- or 64-character lowercase hex commit id |
| `raised` | the UTC date the request was raised, a calendar date written `YYYY-MM-DD` |

An unknown key is refused as `unknown-key`, a repeated key as `duplicate-key` and a missing key as
`missing-key`. A value outside its form is `bad-value`. An `id` that differs from the file name is
`id-mismatch`. Each refusal names the line and the rule, and never quotes text from the file.

## Sections

After the frontmatter come six level-two sections, each exactly once, in this order. At most one
level-one title line may come before `## Question`, and no other text or heading sits outside the
six sections. A heading inside a fenced block is not a heading.

| Section | Rule |
|---------|------|
| `## Question` | the question or change asked of upstream; not empty |
| `## Upstream IDs` | one `- <ID>` bullet per upstream ID, each once, or the single line `none` |
| `## Options` | at least one `- <text>` bullet; exactly one opens `- (recommended) `, the default |
| `## Blocks` | at least one `- <ticket ID>` bullet, each once; an ID with a reserved prefix is not a ticket |
| `## History` | one entry per line, in the forms of the History section below |
| `## Answer` | empty until the request is answered, and not empty once it is |

The reserved prefixes are `EPIC`, `FEAT`, `NFR`, `ADR`, `RISK`, `REL`, `INC`, `UAT` and `BR`.
The refusal codes are `bad-section`, `bad-upstream-ids`, `bad-options`, `bad-blocks` and
`bad-answer`. A History line outside the forms is `bad-history-line`.

The text of a request is structured, because the upstream owner's own agents may read it:

- It holds a question, the upstream IDs, options with one recommended default and the tickets it
  blocks.
- It holds no command and no request aimed at an agent.
- It quotes no upstream text by default. At most one short quoted line is allowed, when the
  question cannot be asked without it.

## History

Each entry is one line `- YYYY-MM-DD: <event>, by <actor>`, dated in UTC. The forms are closed:

- `- YYYY-MM-DD: open, by BA/PM`
- `- YYYY-MM-DD: edited, by BA/PM: <what changed>`
- `- YYYY-MM-DD: carried, by human:<name>`
- `- YYYY-MM-DD: answered, by human:<name>, pin <commit>`, optionally ending `, not-descendant`
- `- YYYY-MM-DD: withdrawn, by BA/PM: <reason>`, for an `open` request
- `- YYYY-MM-DD: withdrawn, by human:<name>: <reason>`, for an `open` or a `carried` request

The rules on these lines:

- The first entry is `open`, dated the frontmatter `raised`. `open` never appears again.
- Dates never decrease from one entry to the next. Two entries may share a date.
- `<name>` follows the note schema's stamp rule, `human:[A-Za-z0-9._-]+`, so a name holds no
  space and a role name never matches it.
- Only BA/PM opens a request and records an edit. Only a `human:<name>` entry records `carried`
  or `answered`, or withdraws a `carried` request. BA/PM or a named human withdraws an `open`
  request, and Workflow 20 says which `open` requests only a named human withdraws.
- A second `carried` entry after `carried` records a re-send.
- The answer pin is a full commit id of the same length as `pin`, and differs from it.
- `, not-descendant` records that the new pin does not descend from `pin` (see the
  Requests report section).
- An answered or withdrawn request takes no further entry.

An entry outside this order or these actors is refused as `bad-history-order` or `bad-transition`.
The frontmatter `status` equals the status the last entry other than `edited` implies, or the file
is refused as `status-mismatch`.

`human:<name>` is a prose-tier record that a named human gave their word. BA/PM writes it on that
human's word. It is not authentication, and no program checks who the human was. The git host and
review remain the checks on who changed the file.

"Changed since carried" is derived and never stored. A `carried` request is changed since carried
when an `edited` entry follows its last `carried` entry. A later `carried` entry clears it.

## Lifecycle

| From | To | Who | Entry |
|------|----|-----|-------|
| (none) | `open` | BA/PM | `open, by BA/PM` |
| `open` | `carried` | a named human | `carried, by human:<name>` |
| `carried` | `carried` | a named human | a second `carried` entry, a re-send |
| `carried` | `answered` | a named human, by setting a new pin | `answered, by human:<name>, pin <commit>` |
| `open` | `withdrawn` | BA/PM | `withdrawn, by BA/PM: <reason>` |
| `open` | `withdrawn` | a named human | `withdrawn, by human:<name>: <reason>` |
| `carried` | `withdrawn` | a named human | `withdrawn, by human:<name>: <reason>` |

- An `edited` entry by BA/PM may follow `open` or `carried`. It changes no status.
- An edit never removes a deviation or floor-conflict statement from `## Question`. It never
  removes from `## Blocks` a ticket that holds a human-stop bullet (Workflow 20).
- `answered` and `withdrawn` are terminal.
- An `open` request is never answered directly. Withdraw it instead.

## Requests report

`node tools/grugops/upstream.js requests [--root <dir>]` reads the declared sources and the
build-request folder, and prints the report below in one write. It writes nothing and never moves
a pin. Every value it prints is a build-request id, a source id, a date, a status, a number, an
upstream ID or a commit id. No line carries the question, an option, History text or the answer.

The config is read once. An absent config, or one with no `upstream` key, declares no source and
leaves the threshold at 10 days. Today is the UTC date, read once.

First, for each record the grammar or the reader refuses, in name order:

- `refused BR-<n>.md: <code>`, where `<code>` is a refusal code above or a reader code:
  `not-a-regular-file`, `above-ceiling` or `unopenable`. Only the code is printed.
- `refused <entry not named BR-<n>.md>: bad-file-name`, for a record not named `BR-<n>.md`.

Then, for each `open` or `carried` request in numeric order (`BR-2` before `BR-10`), its lines in
this order:

| Line | When |
|------|------|
| `carry <BR> <source>: open since <raised>` | the request is `open` |
| `carry <BR> <source>: changed since carried <date>` | the request is `carried` and changed since carried; `<date>` is its last `carried` date |
| `wait <BR> <source>: <status> for <n> days (escalation_days <m>)` | it has waited `<n>` whole UTC days since its last status move, and `<n>` is greater than `<m>` |
| `answer-candidate <BR> <source>: changed <ID>[, <ID>…] (raised at <pin>, pin now <commit>)` | the request is `carried`, the declared pin is not its `pin`, and a listed ID it names changed |
| `pin-moved <BR> <source>: no listed ID changed (raised at <pin>, pin now <commit>)` | as above, and no ID it names changed |
| `not-descendant <BR> <source>: pin now <commit> does not descend from <pin>` | after an answer line, when the pin now does not descend from `pin`; a warning only |
| `UNKNOWN - verify <BR> <source>: <reason>` | the program cannot decide; see below |

- The last status move is `raised` for an `open` request and the last `carried` date for a
  `carried` one. The threshold `<m>` is `upstream.escalation_days`.
- An ID changed when its status, its successor or its listed file's blob differs between `pin` and
  the pin now, or when it is listed at only one of the two. The IDs follow the request's order.
- `UNKNOWN - verify` is printed when the source is not declared, when `pin` has another length
  than the declared pin, or when a git read at either commit cannot be answered. No answer line
  is printed for the request in these cases.
- It is also printed when git cannot decide the ancestry, for example in a shallow clone:
  `UNKNOWN - verify <BR> <source>: shallow clone; ancestry cannot be decided`. A shallow clone
  never gives a `not-descendant` line.

Then one line per pair of `open` or `carried` requests for one source whose `## Upstream IDs`
share an ID, by the first id and then the second:

- `overlap <BR-a> <BR-b> <source>: <ID>[, <ID>…]`

When nothing above printed:

- `no build requests`, when the folder is absent or holds no record.
- `no build request needs a human (<n> on file)`, when the folder holds `<n>` records.

Exit codes:

- Exit 2 when any `refused` or `UNKNOWN - verify` line printed.
- Otherwise exit 1 when any other report line printed. Exit 1 is work for a human, not an error.
- Otherwise exit 0.
- A run that cannot start exits 2 with one `Error:` line on stderr and nothing on stdout. Examples
  are a bad argument, a config that cannot be used, and a folder that is a symbolic link, not a
  directory, or cannot be listed.

## Budget and checks

- Each file in the folder is at most 8192 UTF-8 bytes, `BUDGETS.buildRequestBytes` in the board
  contract's budget table. The budget applies per file, not to the folder in total.
- A reader opens a file of at most 65536 bytes. That number is a reader ceiling, not the budget.
- The structure validator and `tools/grugops/state-check.js` measure every file against the budget
  and parse every file with the grammar. The validator reports a refusal as an error naming the
  file, the code and the rule. state-check reports it as `build-request-refused` with the code.
- `tools/grugops/upstream.js requests` reports the carry list, the waits, the answer proposals and
  the overlaps, as listed above.
- An absent folder is no finding in any of the three programs.
