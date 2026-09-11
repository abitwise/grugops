---
kind: checklist
tier: enterprise
---
# Browser UAT Recipe

Apply this recipe whenever a ticket needs user-acceptance evidence produced from a real browser.
The recipe is a gate contract, so every sentence here is written in clear professional English.

The recipe is a reference how-to. The gate's UAT step points to this file by name; it does not
restate the recipe. Visual baselines live in `playwright-visual-regression-recipe.md`.

## What counts as evidence, and what does not

- The committed `*.uat.spec.ts` file, re-run by the §14 quality gate, is the evidence.
- An agent's narration of what it saw on a page is not evidence, and never earns a gate stamp.
- A browser MCP tool-call transcript is not evidence either, and never earns a gate stamp.
- A screenshot pasted into a report is a run product, not a re-runnable artifact.

The reason is reproducibility. A transcript cannot be re-run by a reviewer, and a narration cannot
be reviewed in a diff. A committed spec can be read, changed, and executed again by anyone.

## Spec location and naming

- Specs live under a `uat/` subfolder of the target repository's existing end-to-end directory.
- Each spec is named `<ticket-id>.uat.spec.ts`.
- Specs ride the existing `quality.ui_e2e` lane unchanged.
- No second Playwright project is created, and no new configuration path is introduced.

The `.uat.spec.ts` suffix is the recognition key. The provenance note and the spec-integrity checker
both key on that suffix, so a renamed spec leaves both mechanisms.

## Authoring through browser MCP

The agent explores the running application through a browser MCP server, then writes a spec by hand
from what it found. The server is an authoring tool, never a source of evidence.

### The pin

- `@playwright/mcp@0.0.78` — the browser MCP server the authoring agent drives.
  (version verified against the npm registry 2026-09-07; check for a newer one before you bump it)

The bullet above is the first pinned mention of the package in this file, and the foundation guard
reads the pin out of it. Every later pinned mention in the kit is compared against that one.

The package is pre-1.0. Flags and tool names can move between patch releases, so a committed
configuration carries the pinned version rather than a floating specifier. A floating specifier in a
committed configuration is the anti-pattern this pin exists to prevent.

The pin above is the single home of that version. A foundation guard asserts that every mention of
the package across the kit and the documentation equals it, so a bump is one edit plus a re-pin.

### The five host-CLI registrations

| Host CLI | Registration |
|----------|--------------|
| Claude Code | `claude mcp add playwright npx @playwright/mcp@0.0.78` |
| Codex CLI | `codex mcp add playwright npx "@playwright/mcp@0.0.78"`, or the TOML block below |
| Gemini CLI | an MCP block in Gemini's `settings.json`, shown below |
| OpenCode | an `mcp` block in `~/.config/opencode/opencode.json`, shown below |
| GitHub Copilot CLI | `/mcp add`, or an `mcpServers` entry in `~/.copilot/mcp-config.json`, shown below |

```toml
# ~/.codex/config.toml — the Codex CLI alternative to `codex mcp add`
[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@0.0.78"]
```

```json
// Gemini CLI settings.json — the standard MCP server block
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@0.0.78"]
    }
  }
}
```

```json
// ~/.config/opencode/opencode.json
{
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "@playwright/mcp@0.0.78"],
      "enabled": true
    }
  }
}
```

```json
// ~/.copilot/mcp-config.json
{
  "mcpServers": {
    "playwright": {
      "type": "local",
      "command": "npx",
      "args": ["@playwright/mcp@0.0.78"],
      "tools": ["*"]
    }
  }
}
```

### Behaviour facts

- The server is **headed by default**. Pass `--headless` to opt into a headless browser, which is
  the flag continuous integration needs.
- `--isolated` keeps the browser profile in memory rather than on disk.
- The server requires Node 18 or newer.

### What grugops installs for this

Nothing. The `package.json` of grugops gains no dependency and no script, because the server is
fetched by the user's own agent through `npx`. Browser binaries are a real prerequisite of the
target repository:

```bash
npx playwright install --with-deps chromium
```

## Provenance of the evidence note

Green evidence is recorded as a pair of context notes. A `finding` carries the gate stamp
`verified_by: §14-gate#<id>`, and an `artifact-ref` points at the committed spec.

| Field | Meaning |
|-------|---------|
| `sha` | the commit the referenced spec was run at |
| `gate_run` | the per-run id of the `§14-gate` verdict that certifies that run |
| `content_hash` | sha256 over the bytes of the committed `*.uat.spec.ts` file at `sha` |

The content hash is a recomputable integrity digest. Anyone holding the repository can recompute it
from the committed bytes and compare. The hash is **not tamper-proof** and it is **not a security
token**: an author who rewrites the spec and recomputes the digest produces a matching pair.

What the hash buys is a binding between a named artifact and a named gate run. An `artifact-ref`
whose `sha` differs from the SHA its `gate_run` verdict recorded is refused at write time.

The spec's transitive imports are **not** hashed. A helper file the spec imports can change without
invalidating the recorded evidence, which is a known limit of the digest as scoped here.

## The spec-integrity ban set

The ban is decided over the TypeScript abstract syntax tree by
`tools/grugops/uat-spec-integrity.js`, never by a textual matcher. The four lists below are quoted
by value from the constants of the same name in `scripts/runnable-ref/uat-spec-integrity.ts`, and
the two AST arms are quoted from the same file, so the claim here matches the mechanism there. The
callee-shape entries under "deliberately outside the rule" are quoted from
`UNRESOLVABLE_CALLEE_RESIDUALS` in that file, so the disclosed boundary comes from the same source as
the decided rule.

A modifier call is recognised by its callee's DOTTED PATH, so `test.skip(...)`, `test?.skip(...)`,
`(test).skip(...)` and `test["skip"](...)` are the same construct and are decided the same way.

A callee chain containing a CALL resolves too, as its inner path plus a parenthesis marker segment.
`test.info().skip(...)` is read as the path `test.info().skip`, whose head segment is `test` and
whose tail segment is `skip`, so the modifier rule below refuses it with nothing added to any list.

An INTERIOR marked segment is a ROUTING LINK, and it is not part of the membership question for ANY
of the three arms below. The rule's head-and-tail arm reads only the first and last segments, so a
routing link between them never mattered there. The two WHOLE-PATH arms — the banned exact paths and
the banned configured calls — compare the joined path, so the interior routing links are removed
before either arm is asked. `expect.configure({ retries: 2 }).soft(locator)` is therefore decided as
`expect.soft`, and `expect.configure({ retries: 2 }).configure({ soft: true })(locator)` as
`expect.configure` with `soft` enabled. One legitimate configuration link does not carry a soft
assertion past the ban.

A MARKED HEAD is a different construct, and it is what keeps a chained assertion legitimate. When the
FIRST segment carries the marker, a user value was passed into the chain rather than a routing link
being added to it, so nothing is removed: `expect(locator).soft` is read as `expect().soft`, whose
head is the marked call rather than the bare `expect` binding, and it is neither a banned exact path
nor a banned head. That separation is asserted in both directions —
`expect.configure().soft` is refused and `expect().soft` is not.

An import RENAME is canonicalised before the head segment is read, from the import declaration's own
literal text. `import { test as it } from "@playwright/test";` followed by `it.skip(...)` is asked as
`test.skip`, and `import * as pw from "@playwright/test";` followed by `pw.test.skip(...)` is asked
as `test.skip` as well. The canonicalisation is scoped to that module specifier.

A TESTINFO FIXTURE PARAMETER is decided by its DECLARED TYPE, at whatever argument position the
framework's own overload set puts the scenario body in. Both
`test("a", async ({ page }, testInfo) => { testInfo.skip(); })` and the three-argument tag form
`test("a", { tag: "@smoke" }, async ({ page }, testInfo) => { testInfo.skip(); })` are asked as
`test.info().skip` — the same path the call-link spelling produces, so the family has one spelling in
the findings a reader sees. A DESTRUCTURED fixture is decided too:
`async ({ page }, { skip }) => skip()` resolves to the property the pattern destructures, which is
the framework's own. No argument INDEX is read anywhere in this decision.

THE BAN IS DECIDED BY SYMBOL IDENTITY, NOT BY SPELLING. The checker built from the target
repository's own TypeScript is asked which symbol a callee resolves to, and a call is refused when
that symbol's DECLARATION comes from the framework itself and its name is a member of the lists
above. Identity is anchored on declaration FILES rather than on a module-specifier string, so a
re-export chain through any number of local modules resolves and a local module that merely names
itself `@playwright/test` does not. An alias (`const t = test;`), a renamed import, a namespace
import, a block-scoped shadow and a cross-module re-export are therefore all decided the same way,
because they all resolve to the same declaration.

THE CHECKER'S ANSWER HAS FOUR VALUES, AND THE TWO MIDDLE ONES ARE THE WHOLE DIFFERENCE BETWEEN A
LEGITIMATE SPEC AND A DISABLED ONE. When the symbol resolves to something the framework does NOT
declare, the next question is WHERE that symbol is declared.

If every declaration is in the program's own authored source — a helper's own parameter, a local
object with a `skip` member, a helper module the project wrote — the call is accepted and no further
rule is consulted, so a helper whose parameter happens to share a renamed import's local name cannot
be reported as a construct the file does not contain.

If any declaration comes from ANOTHER MODULE'S DECLARATION SURFACE — a `declare module "…"` block, or
a declaration file — the call is handed to the rule below. Such a declaration is another framework's or another
assertion library's own export. Such an export is the case the banned head `describe` exists for at all:
`@playwright/test` publishes no top-level `describe`, so the head is retained for a `describe`
imported from somewhere else. The same holds for `expect.soft` when `expect` comes from an assertion
library that is not Playwright's. A soft assertion records a failure and lets the scenario report
PASS, so a green lane certifies a scenario whose acceptance criterion failed; which library it came
from changes nothing about that.

When the checker resolves NOTHING at all, the same second rule answers: the head segment is
canonicalised through the framework's own import declarations unless the spec ITSELF declares that
name nearer than the reference. That second rule is what still refuses a reference sitting above its
own `let` or `const` declaration, and its ranges differ by declaration KIND — a `var` binding hoists
to its enclosing function, while a function declaration, a `let`, a `const`, a class, a `using` and
an `await using` are block-scoped and begin at their own declaration.

Read the pairing honestly. Two rules answering one question is a shape this recipe's own history
argues against, and it was kept anyway because identity alone would lose refusals the second rule
makes — and, since 2026-09-11, because identity alone was measured LOSING the two refusals above. It
is bounded: the second rule is asked at exactly two of the four answers, and never beside the other
two. It is named in the boundary list below, with the one direction in which it could be wrong, and
so is the one shape this split deliberately does not reach.

A TARGET THAT CANNOT ANSWER BLOCKS, IT DOES NOT PASS. A repository with no TypeScript configuration
file, one the compiler cannot read or parse, a compiler that throws, or framework declarations that
do not resolve, exits 2 with one named reason and an empty stdout. A check that could not run has
made no claim about the specs, and it never quietly makes a smaller one.

A SURFACE THE WALK COULD NOT FINISH IS THE SAME EVENT. Identity is decided against the framework's
declaration files, and those files are found by walking the framework's own exported surface under
the two bounds the boundary list below publishes by value. If the walk stops at either bound, some
of the framework's declarations were never reached, and a call on one of them would have been
decided as foreign — accepted — with nothing said. So the run exits 2 with the truncation cause
instead, which names both bounds and which one stopped the walk. What a reader does with it is what
they do with every exit 2: the UAT stays `pending`, the scenario is not signed off, and the reason
is recorded. It is a loud skip, never a pass.

**The modifier rule.** A modifier call is refused when the head segment of its dotted path is one of
the banned head segments AND the tail segment is one of the banned modifier segments, or when the
whole path is one of the banned exact paths. The segments in between — `describe`, `serial`,
`parallel`, and whatever routing segment the framework adds next — route the call; they do not
change what the tail does to the evidence a quality gate re-runs. Matching the head-and-tail pair
rather than the whole literal path is what makes this a rule rather than a list of paths, so
`test.describe.serial.only` is refused with nothing added to any list.

- Banned head segments, quoted from `BANNED_MODIFIER_HEADS`: `test`, `describe`.
- Banned modifier tail segments, quoted from `BANNED_MODIFIER_TAILS`: `skip`, `only`, `fixme`, `fail`.
- Banned exact paths, quoted from `BANNED_EXACT_PATHS`: `expect.soft`.
- Banned configured calls, quoted from `BANNED_CONFIGURED_PATHS`: `expect.configure` refused only when the call enables `soft`.

The last list is a PAIR, not a path, and the difference is load-bearing. `expect.configure` is a
legitimate call — `expect.configure({ retries: 2 })` re-runs a matcher and changes no result — so
refusing the path alone would refuse the legitimate spelling too. The call is refused only when its
first argument is an object literal that assigns the named option the `true` keyword. A value that is
not that literal, such as `expect.configure({ soft: isCi })`, enables nothing: this checker parses
and never evaluates.

The tail set carries the INVERTING modifier as well as the removing ones. A removing modifier drops
the scenario from the evidence; an inverting one runs the scenario and reports a failed assertion as
a pass, so the lane is green because the acceptance criterion failed. An inverted scenario is worse
for the evidence than a removed one, not milder, which is why it is decided rather than left unstated.

Refused in a `*.uat.spec.ts` file:

- An `expect` or `assert` call inside a `try` block, or inside a `catch` clause.
- An `expect` call under an `if`, under an `else`, or inside a conditional expression.
- An `expect` call as an operand of `||`, of `&&`, or of `??`.
- An `expect` call reached through an optional call.
- The four rows above read a CANONICALISED head, not the name written in the file. An import rename
  (`import { expect as check }`) and a namespace (`import * as pw`) both resolve to `expect` before
  the question is asked, and the same nearest-binding scope rule applies, so a local binding of the
  renamed name is not an assertion head.
- Any modifier call the rule above decides, including one reached through a call link
  (`test.info().skip(...)`), through a canonicalised import rename or namespace
  (`import { test as it }` / `import * as pw`), or through the TestInfo FIXTURE PARAMETER
  (`test("a", async ({ page }, testInfo) => { testInfo.skip(); })`).
- A configured soft assertion, whether or not a routing link stands between the configuration and the
  assertion: `expect.configure({ soft: true })(...)`,
  `expect.configure({ retries: 2 }).soft(...)`, and
  `expect.configure({ retries: 2 }).configure({ soft: true })(...)`.

Deliberately outside the rule, recorded here so the boundary is written down:

- An assertion inside a promise `.catch()` handler is **not** refused.
- An assertion inside a `finally` block is **not** refused; the third region of a `try` statement is
  named by no rule here.
- A spec body carrying **zero** assertions is **not** refused; vacuous evidence is deferred.
- A member computed from a non-literal expression is not decided by identity: `test[name](...)` where `name` is a variable. The checker resolves no symbol at that position. The call then falls to the spelling rule. That rule cannot read a member name the source text does not carry.
- An option is ENABLED only when the call's first argument is an object literal assigning it the `true` keyword. A variable argument enables nothing, and neither does a variable option value. This runnable parses and never evaluates.
- IDENTITY AND SPELLING ARE TWO RULES FOR ONE QUESTION. The pairing is a decision rather than an oversight. D-35 RE-TOOK this member against its own stated closing criterion. The criterion asked for a reproduced case in which the spelling rule REFUSES a construct identity would have called foreign. Two were reproduced. One was a `describe.skip` group. The other was an `expect.soft` assertion. Each arrived from a DECLARED non-Playwright module. Each was accepted at exit 0 by identity and refused by spelling. The answer was not to delete one of the two rules. The answer was to split the terminal arm in four. `framework` refuses. `foreign-local` accepts and the spelling rule is not consulted. A local binding is never canonicalised into a construct the file does not contain. `foreign-declared` and `unresolved` both ASK the spelling rule. So the second grammar is now asked at MORE positions than before, not fewer. It is asked where a callee's declaration comes from another module's declaration surface. It is also asked where the checker resolved no symbol at all. A temporal-dead-zone reference lives exactly in the second position. Keeping the pairing is what preserves D-27's refusals. It is still two grammars for one question. This file's own history says two grammars can drift apart. What would force it closed: a reproduced case in which the spelling rule refuses a construct identity would have called `foreign-local`. A refusal in that direction is still the only way the pairing can be wrong.
- A callee whose head is not an identifier is decided only where the checker resolves it. `({ test }).test.skip(...)` IS refused. Its member's declaration is the framework's own. A call on `this` yields no symbol and no head segment. So does a call on an object whose member the checker cannot resolve. No membership question can be put in either case.
- A target repository whose TypeScript cannot create a Program makes NO claim about the specs. The causes are named: no configuration file, one that cannot be read, one that cannot be parsed, or a compiler that throws. It exits 2 with PROGRAM_UNAVAILABLE_REASON and its own cause. A target whose framework declarations do not resolve is the same event and the same exit code. Neither is a pass. Neither is a quieter ban. A smaller ban applied without saying so is a gate lowering. This member replaces exactly that silent degrade. THE GRANULARITY IS WHOLE-RUN. Whole-run is coarser than D-28's per-file boundary. A file's own PARSE stays per-file. The compiler host's reader is wrapped, so one unparseable spec is one could-not-run reason. The denominator floor then names it. The BINDER runs over every root file at once. A single spec whose shape exhausts it blocks the whole run rather than one file. The measurement used a 4,000-link call chain. Blocking is the fail-closed direction and it is never a pass. What would force it closed: a way to bind one file at a time. The compiler's public API does not offer one today.
- Identity is decided against the framework's own DECLARATION FILES. The ambient-declaration route is MEASURED. The route means a `declare module "@playwright/test"` file inside the target's own program. The installed-package route is NOT measured here. In it those declarations arrive from `node_modules/@playwright/test`. It is reasoned from the same resolution the compiler performs. This repository's dependency set is fixed, so the package cannot be installed to measure it. It is an open `UNKNOWN - verify`, carried beside `R-07`.
- A HEAD THE SPEC FILE HAND-DECLARES FOR ITSELF is not decided. D-35 splits a non-framework callee by declaration provenance. A `declare module` block counts as another module's surface. A declaration file counts as one too. A `declare const describe: { skip(...): void }` written inside the spec's own source counts as NEITHER. So it answers `foreign-local` and the call is accepted at exit 0. MEASURED, on a file that type-checks clean. The shape stays open because it is structurally IDENTICAL to the control that keeps WR-26 closed. Both resolve to a property signature of an anonymous type literal inside a `declare` statement. A predicate that refuses the one refuses the other. A false refusal names a construct the file does not contain. Such a refusal is a failure this family has already paid for three times. What would force it closed: a discriminant separating a hand-declared module-scope head from a helper's own parameter type. Reading the head's NAME is not available, because the ban set would then decide its own scope.
- THE FRAMEWORK-SURFACE WALK IS BOUNDED IN DEPTH. `SURFACE_DEPTH_BOUND` is six property-or-call links from an export. A bound that is reached is a check that did not run. A node left unexpanded at that depth means framework declarations the walk never reached, and a call on one of them would have been decided as foreign rather than by identity. Foreign is accept. So a reached bound is never a verdict. The run takes the could-not-run route the Program member above already names, at exit 2, with `SURFACE_TRUNCATED_CAUSE` as its own cause, which names both bound values and which bound stopped the walk. A LEAF at the bound is not a truncation. A node carrying no properties and no call signatures cut nothing off. Reporting one would make every run that merely reached a `void` return a could-not-run. MEASURED against the transcribed surface this repository ships: seventeen recorded paths, deepest at depth two. The bound is not near it. The INSTALLED package is a different surface and is not measured here, because the dependency set is fixed. That magnitude is an open `UNKNOWN - verify`, carried beside the installed-package member above. What would force it closed: a walk whose cost does not grow with the declared surface, or a measurement over a real installed `@playwright/test` showing the bound is never approached.
- THE FRAMEWORK-SURFACE WALK IS BOUNDED IN SIZE. `SURFACE_NODE_BOUND` is 4096 distinct declared types. The bound used to sit in the walk's own loop condition, where a walk that stopped was indistinguishable from a walk that finished. It is now an explicit stop that records itself, and it takes the same route the depth bound takes: exit 2 with the truncation cause naming the bound reached. It is the SAME signal from a different limit, because a surface that is wide rather than deep leaves exactly as many declarations unreached. MEASURED against the transcribed surface this repository ships: seventeen types against a bound of 4096. What would force it closed: the same measurement over a real installed `@playwright/test` surface, which cannot be taken here.
- THE COMPILER'S OWN STANDARD LIBRARY IS NOT THE FRAMEWORK, and the walk stops at its edge. Before D-36 it did not: sixteen of the seventeen files identity was decided against were `node_modules/typescript/lib/*.d.ts`, and the depth budget was being spent on `String`, `Number`, `Array` and `Promise` rather than on the framework. Narrowing it is what leaves the two bounds any headroom at all. What the narrowing COSTS is this member. A framework type reachable ONLY through a standard-library container, such as a `TestInfo[]` or a `Promise<TestInfo>`, is no longer reached through that route. A member declared only behind one is absent from the surface, so a call on it answers foreign and is accepted, and nothing is emitted at run time to say so. The route is reasoned rather than measured: no member of the transcribed surface sits behind a container. What would force it closed: descending into a container's TYPE ARGUMENTS while still refusing the container's own members. The structural view of the checker this runnable declares does not read type arguments today.
- Completeness against the DECLARED framework surface is asserted in BOTH directions. Forward: every
  spelling the rule refuses is a construct that surface carries and that type-checks against it.
  Reverse: every member reached by walking that surface's declared types with the TypeScript checker
  is either refused by the rule or carries a written reason for not being refused. The reverse half
  is a total partition, not a spot-check — its two buckets are asserted disjoint, their union is
  asserted equal to the walked set, and their sizes are asserted to sum to that set's count, so a
  member that arrives and is decided by neither turns the check red and names itself.
- The reverse walk covers DECLARED PROPERTY CHAINS ONLY. It reads the properties of each declared
  type, does not descend through a call signature's RETURN TYPE, and reads no call signature's
  PARAMETER list, so a call-link spelling such as `test.info().skip` and a fixture-parameter spelling
  such as `testInfo.skip` are both outside its denominator. What the walk does carry is the accessor
  — `test.info` — as a member it must decide. Read this bullet as a statement about the DENOMINATOR
  and about nothing else: whether the rule refuses a given call-link spelling is decided by the three
  arms above, arm by arm, and this bullet makes no claim either way. Until round 4 it said the rule
  refused every such spelling, which was true of the head-and-tail arm and false of the two
  whole-path arms — the claim-broader-than-the-mechanism defect this recipe exists to prevent, made
  in the very paragraph that discloses a boundary. Extending the walk to descend return types would
  move the denominator of every coverage assertion above, so it is a separate decision rather than a
  quiet widening.
- The set of callee shapes the resolver still declines is DERIVED from the checker's own source
  rather than remembered: every position at which resolution ends without producing a path is read
  off the abstract syntax tree, its count is asserted, and each one is bound to a decided construct
  or to one of the residual sentences below, in both directions. A shape that nobody decided arrives
  as an unbound position and turns the check red naming itself.
- The declared surface is **not** the released package, and the paragraph above claims nothing about
  the package. `scripts/runnable-ref/fixtures/playwright-test.d.ts` is a hand transcription at the
  pin this recipe documents; its drift from a released Playwright is an open `UNKNOWN - verify` and
  nothing in this kit re-checks it, because the package is deliberately not installed here. A
  modifier the released package carries and that transcription does not is outside both directions,
  and it is the residual this ban set has left.
- The walk that produces the reverse half's denominator is bounded by a declared segment depth. The
  bound is stated in the harness with its reason and the walk asserts it reached that bound, so a
  truncation is a failed premise rather than a shorter set. A modifier family declared deeper than
  the bound would be outside the measurement.
- Directory names the walk never descends into, quoted from `SKIPPED_DIRECTORIES`: `node_modules`, `.git`, `dist`, `tools`, `.temp`.
  A uat spec under one of those names is not counted. It leaves the derived total before the total is
  reported. Neither floor can see that. The derived count and the visited count shrink together. So
  the runnable says what it skipped. One line on stderr names each skipped directory and its hit
  count. The line carries names and counts. It carries no path and no file content. The line appears
  only when the walk skipped something. A run that skipped nothing emits the bytes it emitted before.
  The disclosure moves no exit code and no finding count. It is a disclosure, never a result. `.temp`
  is this repository's own scratch name. The runnable ships to every host, so the narrowing is
  disclosed rather than assumed.

Widening the rule is a new decision and a gap-closure round, never a quiet edit to the checker.

### The exit-code contract

| Exit code | Meaning |
|-----------|---------|
| 0 | pass — no findings |
| 1 | a finding — the quality gate blocks |
| 2 | could not run — the check was not performed |

A could-not-run leaves the UAT `pending`. Exit 2 is never read as a pass, because a check that did
not run has established nothing.

A spec the checker cannot finish analysing is a could-not-run reason for that file, exactly like an
unreadable or unparseable one. It is named on stderr, it does not count towards the visited total,
and the short-scan-set floor then reports the run as covering less than the derived set.

The three codes are held by decision at TWO boundaries, and nowhere else.

- **Per file.** Everything the checker does with a spec's bytes — the read, the parse, the
  parse-diagnostics inspection and the walk over the syntax tree — is inside one could-not-run
  boundary. A file the parser cannot finish is a file the checker did not check, so it is named on
  stderr and it does not count towards the visited total.
- **Per process.** The runnable's whole body is inside one boundary that names the fault on stderr
  and returns 2. A legitimate 0 and a legitimate 1 pass through it untouched; only a throw becomes 2.
  The code is 2 rather than 1 because 1 means "a finding", which is a claim about the specs, and a
  runnable that could not complete has made no claim about them.

What remains outside every boundary is a fault that terminates the process without unwinding — an
out-of-memory kill, or a signal. No `try` catches those, and the checker claims nothing about them.
Whether the Windows leg of this behaviour matches the POSIX one is an open `UNKNOWN - verify`.

The caller decides that outcome, because the runnable cannot. `agent-factory/workflows/05-pr-quality-gate.md`
step 3 carries a fourth arm for a run with no exit code. It records could-not-run, naming the signal,
and never a pass and never a finding.

The partition is asserted over a corpus of pathological inputs generated at run time, one case per shape:

- a nesting depth the parser cannot finish
- the adjacent nesting depth the parser does finish
- a spec far larger than any ordinary one
- a spec carrying invalid UTF-8 byte sequences
- a spec opening with a byte-order mark
- a spec whose bytes are binary

Each case asserts both halves: the exit code is one of the three above, AND the measurement carrying
the visited and derived counts reached the stream its branch writes to. The two floors write to
stderr and return 2; the findings line and the pass line write to stdout and return 1 and 0. A
could-not-run run therefore carries its measurement on stderr with an empty stdout, by design. The
half that matters is that the measurement is reached at all: an exit code inside the contract with no
measurement on either stream is a check that never ran, reported as a check that found something.

## The loud skips

Two conditions stop the lane, and each one names itself in the output.

- **The parser could not be resolved from the target repository.** grugops ships no parser, so
  `typescript` is resolved from the target's own `node_modules`. An absent parser is exit 2.
- **The browser lane is unusable at either probe stage.** Stage 1 resolves `@playwright/test` from
  the target. Stage 2 checks that the Playwright browsers directory exists and is not empty.

A Playwright-lane skip is recorded as an **unstamped `observation` note** carrying the marker text
verbatim. No `finding` is written, no `artifact-ref` is written, and the board does not move. The
ticket stays `In UAT`, and the pack shows the scenario as pending with the recorded reason.

## The attended Chrome lane

Claude in Chrome is an optional second lane for a human who wants to watch a browser session. The
lane is attended by definition and is structurally unable to produce a gate stamp.

- The lane's only outputs are a human-stamped `finding` and an `artifact-ref` describing what a
  named person witnessed. Nothing in the lane reaches the gate's verdict emitter.
- The witnessing human's name arrives only through the existing admission grant,
  `GRUGOPS_ADMISSION_APPROVED_BY`, read by the `admission-guard` hook. The agent can never author
  the name, and there is no lane-specific variable.
- The lane runs in the main thread rather than in a spawned subagent. Loading browser tools costs
  context permanently, and an attended lane has a human present in the main thread anyway.
- Whether the Chrome tools are reachable from inside a spawned subagent is `UNKNOWN - verify`.
  Nothing in this recipe depends on the answer.

### The attended-only predicate

The probe reads `claude auth status --json` and requires every clause below to hold. `--json` is the
default output for that subcommand, so the explicit flag is belt-and-braces.

| Clause | Required value |
|--------|----------------|
| `loggedIn` | `true` |
| `apiKeySource` | absent, or `null` |
| `authMethod` | `claude.ai` |
| `apiProvider` | `firstParty` |
| `subscriptionType` | a non-empty string |

The predicate is stated positively and fails closed. Anything else is a loud skip naming the clause
that failed. An unrecognized shape, a parse failure, and a missing field are all loud skips.

`authMethod` alone is **not** sufficient. Measured on Claude Code 2.1.263, the field stayed
`claude.ai` on a box where an API key was active, so `apiKeySource` is the clause that fires.
`subscriptionType` collapsing to `null` is the second independent signal.

Two auth configurations were not reachable when the predicate was written, and both stay
`UNKNOWN - verify`: an API-key-only box with no interactive login, and a long-lived
`claude setup-token` session. The fail-closed shape means each one skips rather than opens.

### The vendor-side half

- Under API-key authentication, or under a long-lived token, the host keeps the browser integration
  off entirely, even when `--chrome` is passed.
- Browser actions run in a visible window in real time. The assistant pauses for a human on a login
  page or on a challenge.
- The integration is unsupported under Windows Subsystem for Linux.
- The integration is unavailable through third-party model providers.

### Absence on the other four hosts

On Codex CLI, Gemini CLI, OpenCode, and GitHub Copilot CLI the attended Chrome lane is absent by
design. No adapter for those hosts carries the lane's tool name, and no per-host skip line exists
anywhere in the kit. The absence is stated once, here.

The Playwright floor is available on all five hosts, so "degrade, never break" holds: every host can
produce machine-verifiable UAT evidence, and one host can additionally offer an attended session.

## Platform note

The Windows leg of every browser probe in this recipe is `UNKNOWN - verify`, per the standing
posture recorded in `WINDOWS.md`. Record that value rather than claiming a probe passed.
