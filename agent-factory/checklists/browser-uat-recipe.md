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

A TESTINFO FIXTURE PARAMETER is canonicalised the same way, and for the same reason: the binding is
positional and the position is a literal in the source text. The second parameter of the function
passed as the second argument to a `test(...)`-headed call is the TestInfo fixture, so
`test("a", async ({ page }, testInfo) => { testInfo.skip(); })` is asked as `test.info().skip` — the
same path the call-link spelling produces, so the family has one spelling in the findings a reader
sees. An import rename of the framework binding wins over a fixture parameter of the same name.

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
- An aliased binding is not refused: `const t = test;` then a modifier call on `t`. The alias cannot be followed to its declaration without a type checker.
- A member computed from a non-literal expression is not refused: `test[name](...)` where `name` is a variable. The member name is absent from the source text.
- A rename or namespace that arrives through any module other than `@playwright/test` is not canonicalised: `import { test as it } from "./fixtures";` then `it.skip(...)`. Following a re-export across files needs module resolution this runnable does not ship, so the rename map is MODULE-SCOPED to the framework's own import declaration.
- A callee whose head is not an identifier is not resolved: a call on an object literal, or on `this`. There is no head segment to read, so no membership question can be put.
- A callee chain longer than the resolver's 512-step bound is not resolved. The bound is ONE allowance for a WHOLE resolution: every link spends a step, the descent into a call link included, so interleaving calls buys a chain no extra steps. It stops a pathological chain from spinning and from exhausting the interpreter. It is a stated LIMIT, not a silence. A chain that reaches it yields no path rather than a truncated one.
- An option is ENABLED only when the call's first argument is an object literal assigning it the `true` keyword. A variable argument enables nothing, and neither does a variable option value. This runnable parses and never evaluates.
- A parser that does not expose the import, object-literal or function-like node predicates yields no rename canonicalisation, no option reading and no fixture-parameter canonicalisation. The parser is the TARGET repository's (D-13), so its surface is not this runnable's to assume. The resolver degrades to the pre-D-18 behaviour for those shapes rather than throwing outside the exit-code contract.
- A TestInfo binding destructured in the callback's second parameter is not canonicalised: `test("a", async ({ page }, { skip }) => skip());`. A binding pattern names no single identifier to rewrite, so there is no head segment to canonicalise.
- The scope rule the canonicalisations ask is FILE-SCOPED, not lexically scoped. A head segment the file DECLARES — as a parameter, a `const`/`let`/`var` binding, a destructured binding element, a function name or a class name — is not rewritten through either map, and one such declaration anywhere in the file suppresses the rewrite for the whole file rather than for that declaration's own block. The one position that is NOT counted as a declaration is a function's SECOND parameter, because that is exactly where the TestInfo fixture map binds, so a name shadowed only at that position is still canonicalised. Real lexical scoping needs the binder this runnable deliberately does not ship (D-13).
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

Widening the rule is a new decision and a gap-closure round, never a quiet edit to the checker.

### The exit-code contract

| Exit code | Meaning |
|-----------|---------|
| 0 | pass — no findings |
| 1 | a finding — the quality gate blocks |
| 2 | could not run — the check was not performed |

A could-not-run leaves the UAT `pending`. Exit 2 is never read as a pass, because a check that did
not run has established nothing.

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
