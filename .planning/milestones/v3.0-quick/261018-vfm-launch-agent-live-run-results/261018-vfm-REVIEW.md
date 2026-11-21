---
phase: quick-261018-vfm
reviewed: 2026-10-19T10:40:00Z
depth: deep
diff_range: eba46ad5..b616733a
files_reviewed: 33
files_reviewed_list:
  - install/host-tools.ts
  - install/install.ts
  - install/install-marker.ts
  - install/uninstall.ts
  - scripts/generate-host-entries.ts
  - scripts/host-entries-freshness.ts
  - scripts/check-banned-claims.ts
  - .agents/agents/grugops-orchestrator.md
  - .github/agents/grugops-orchestrator.agent.md
  - .opencode/agents/grugops-orchestrator.md
  - .pi/grugops-orchestrator.md
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - examples/01-greenfield-bootstrap.md
  - README.md
  - install/README.md
  - CHANGELOG.md
  - install/host-tools.test.ts
  - install/host-entries.test.ts
  - install/host-entry-docs.test.ts
  - install/kit-route.test.ts
  - install/uninstall-removal.test.ts
  - install/install.test.ts
  - install/agents-record.test.ts
  - install/message-references.test.ts
  - install/installer-cross-version.test.ts
  - install/installer-dry-run.test.ts
  - install/installer-kit-home.test.ts
  - scripts/generate-host-entries.test.ts
  - scripts/host-entries-freshness.test.ts
  - scripts/model-dial-consistency.test.ts
  - scripts/check-banned-claims.test.ts
  - package.json
findings:
  critical: 0
  warning: 6
  info: 3
  total: 9
prior_findings:
  closed: [CR-01, WR-01, WR-03]
  partly_closed: [WR-02, IN-04, IN-08]
  open: [WR-04, IN-01, IN-02, IN-03, IN-05, IN-06, IN-07, IN-09, IN-10, IN-11]
status: issues_found
---

# Quick Tasks 261018-hs8 + 261018-vfm: Code Review Report

**Reviewed:** 2026-10-19T10:40:00Z
**Depth:** deep (cross-file, plus scratch install runs)
**Files Reviewed:** 33 (the product `.ts`, the four launch files, the docs, and the changed tests; the committed `.js` were checked for freshness only)
**Status:** issues_found

## Summary

Scope: `git diff eba46ad5..b616733a`. That covers hs8 (30992e0d, daf5d111, f48262c2, 1e8b3c2c), the hs8 fix commits (bbc8cc08, 8add25a0) and vfm (f4b11d1b, 498000fc). Context read first: the hs8 CONTEXT, SUMMARY, REVIEW and VERIFICATION, the vfm PLAN and SUMMARY, the 33.1 GAP-PLANNING-BRIEF and CLAUDE.md.

**What was run:**
- `npx vitest run install/host-tools.test.ts install/host-entry-docs.test.ts scripts/generate-host-entries.test.ts install/host-tools-prose.test.ts`: 175 passed.
- `npx vitest run install/kit-route.test.ts`: 162 passed.
- `npm run freshness`: 76/76 committed `.js` fresh. `npm run freshness:host-entries`: 7 entries, 0 byte differences. No `.js` differs from its `.ts`.
- Three scratch installs. GRUGOPS_HOME and HOME were both under `$TMPDIR/vfm-review`, removed afterwards. The real `~/.grugops` was not touched. `npm test` was not run.

**Results:**
- **CR-01 is closed.** A user AGENTS.md with no route, plus `--pi --opencode` and then a deleted Pi template, gives `--check --strict` exit 1 with `reach Pi: CANNOT reach the Orchestrator`. The launch file has its own `ok launch file` line. vfm's `LaunchForm` typing is clean:
  - no object is coerced into a string;
  - the per-kind oracle in host-tools.test.ts builds its expectations independently of the helpers;
  - the dated report pin matches the human's report.
- **The new defects are in the arms D-06 and WR-03 added, and in the docs vfm left unbound:**
  - step (f) of `kitRouteFindings` was not given the `routeResolves` gate that step (e) has (WR-07);
  - step (f) also judges a launch file by route presence, while the closing line judges it by ownership. So for the same file, `--check` says `ok` and install says no launch form is offered (WR-08);
  - the closing clause states a cause it never established when the ledger cannot be read (WR-09);
  - vfm made Copilot CLI explicitly `UNKNOWN - verify`, but five shipped sites and every `--check` launch line still state the Copilot launch as fact (WR-05);
  - the "verified live" set is typed by hand in about ten doc places, and the two-sided test reads only the install/README.md usage sections (WR-06);
  - the verified-live record names no host version (WR-10).

## Prior findings (hs8 REVIEW, taken at 1e8b3c2c)

| ID | Status at b616733a | Evidence |
|----|--------------------|----------|
| CR-01 | **Closed**. The fix created WR-07 and WR-08 | `routeCarriers` (host-tools.ts:693) is again `entryFiles` + kind `ROUTE_POINTERS`. Scratch run: exit 1, `Pi: CANNOT reach`. The launch file is reported only in step (f) (install.ts:2034-2063). |
| WR-01 | **Closed** | subagent.frontmatter.md:268 now says "no per-role agent definition ... the one launch agent ... carries no `model` or effort field". `SCOPE_SENTENCE` was re-pinned. A grep for "emits no agent definition" outside `.planning/` finds nothing. |
| WR-02 | **Partly closed** | The docs warn in five places (install/README.md:926-927 in bold, README.md:66, adapters.md, CHANGELOG.md:138-140). install's own output is the line users copy, and WR-02 named it as a site. It still prints the Pi command with no warning, and now adds "(verified live by a human on 2026-10-18)" to it. Seen in scratch: `Pi: ... or start the session as the Orchestrator with \`pi --append-system-prompt .pi/grugops-orchestrator.md\` from the repository root (verified live by a human on 2026-10-18)`. Remaining fix: append a short trust clause to the Pi `launchForm` text, or to `launchInvoke` when `h.id === "pi"`. A field on `LaunchForm` (for example `caution: string \| null`) keeps it data. See also WR-08. |
| WR-03 | **Closed** for the named arms. The fix created WR-09 | `launchClosingClause` (install.ts:7659-7667) gates on `owns`. Scratch: with the user's own `.opencode/agents/grugops-orchestrator.md`, the line says "no launch form is offered". |
| WR-04 | **Open**, and vfm added another member of the class (WR-06) | No test extracts the "files each host reads here" bullet (install/README.md:669-671). The kit-route tests check only that each carrier is named somewhere in the whole section (host-tools.test.ts:688-717), so the check is one-sided. The README "Start a session" table is still bound to no test. vfm's verify greps README rows, but those greps are plan-time checks, not tests. |
| IN-01 | Open | host-tools.test.ts:1278 still uses `refused.includes(rel)`, which is case-sensitive. `pathProblem` (generate-host-entries.ts:255) is unchanged. |
| IN-02 | Open | installer-cross-version.test.ts:49 still says "the 6 files install created" and lists 9. |
| IN-03 | Open | install/README.md:1001 and :1043 still say only "the runnables under `tools/grugops/`". |
| IN-04 | Partly closed | README.md:64: the OpenCode cell now opens with "Start OpenCode at the repository root", but still says "In any session: `/grugops <request>`". README.md:66: the Pi cell still ties "from the repository root" to the flag only. |
| IN-05 | Open | `entryLabel` (install.ts:1449) still labels Pi's file "Pi launch agent". |
| IN-06 | Open | install.ts:5553 "target has a different copy" (the `tools/grugops/LICENSE` arm), and uninstall.ts:2204 `KIT_VERSION_DIFFERS` "it may be from an earlier grugops version". |
| IN-07 | Open | The census (host-tools.test.ts:1418-1442) still counts only element accesses, and states no residual. |
| IN-08 | Partly closed | `stageAllEarlier` (kit-route.test.ts:1122) is back to its eba46ad5 body, so the hand-picked-hosts point is moot. The per-launch loop still uses `entryOwners` as its own oracle (uninstall-removal.test.ts:809). |
| IN-09 | Open | The CLAUDE.md §6 table (from `.planning/research/STACK.md`) still omits the four launch files. |
| IN-10 | Open, and widened | install/README.md:1912-1915 and subagent.frontmatter.md:256-258 are unchanged. Since vfm, these sentences hold by observation for three hosts but are still unqualified for Copilot CLI, and "main agent" is the wrong shape for Pi's appended file. More sites were found; see WR-05. |
| IN-11 | Open | `frontmatterProblem` (generate-host-entries.ts:196-206) is unchanged. |

## Warnings

### WR-05: The Copilot CLI launch is stated as fact in five shipped places and in every `--check` launch line, while vfm records it as `UNKNOWN - verify`

**File:**
- `README.md:65` (Copilot row: "With `--agent` or `/agent`, the launch agent starts the session as the Orchestrator.");
- `examples/01-greenfield-bootstrap.md:42-46` ("a launch agent, which starts a session as the Orchestrator, for each of ... GitHub Copilot CLI ...");
- `install/README.md:1912-1915` (§6 Degraded: the launch agents "make the Orchestrator pointer the session's main agent");
- `agent-factory/packaging/subagent.frontmatter.md:256-258` (the same claim);
- `install/host-tools.ts:723-727` (`launchSession`), as printed by `install/install.ts:2041`.

**Issue:** vfm's purpose was to separate what a human saw from what is unknown. Its README paragraph (README.md:68) says Copilot CLI's launch "is `UNKNOWN - verify`". Its registry says `verifiedLive: null` (host-tools.ts:355). Yet the Copilot row of the same table says, with no qualifier, that the launch agent "starts the session as the Orchestrator". That is a stronger claim than the verified rows make ("is the session's main agent"). The plan kept that row byte-identical on purpose (vfm PLAN Task 2 Step 2).

The `--check` launch line has the same gap. `launchSession` adds no live-or-unknown qualifier, unlike `launchInvoke`. So `--check` prints, as a verdict, "a session started with `copilot --agent grugops-orchestrator` ... reads it (GitHub Copilot CLI)" for a host nobody ran. The §6 and subagent.frontmatter.md sentences also say the Pi file makes the pointer "the session's main agent". Pi appends the file to the system prompt; there is no agent. This is the "docs claim not backed by code or `UNKNOWN - verify`" class in the brief, at more sites than IN-10 named.

**Fix:**
- README.md:65: "With `--agent` or `/agent`, the launch agent is documented to start the session as the Orchestrator (`UNKNOWN - verify`; no live run)."
- examples/01 and the two §6-style sentences: say "is meant to", and point to the usage sections for what was verified.
- For Pi, say "appends the Orchestrator pointer to the system prompt".
- In `launchSession`, append the state, so `--check` cannot state an unverified launch as fact:
```ts
const note = launchLiveNote(host);
return `${phrase}${note === null ? " (UNKNOWN - verify: no live run)" : ` (${note})`}`;
```
- Add a host-entry-docs case: no file in the docs set may pair a `verifiedLive: null` row's `launchForm.text` with "starts the session" unless the same sentence holds `UNKNOWN - verify`.

### WR-06: The verified-live host set is typed by hand in about ten doc places, and the two-sided test reads only the install/README.md usage sections

**File:**
- `README.md:63-66` (three rows) and `:68` ("on Antigravity CLI and OpenCode ... and on Pi ...; on GitHub Copilot CLI it is `UNKNOWN - verify`");
- `agent-factory/packaging/adapters.md:37,38,40`;
- `CHANGELOG.md:148-152`;
- `install/README.md:550-554` (the live-session paragraph) and `:573-574` (the closing-notes paragraph, which also types the date);
- the test: `install/host-entry-docs.test.ts:327-332`.

**Issue:** The registry holds `verifiedLive` once, and the two-sided check binds it only to `guideSection("Using grugops on <name>")`. Every other place that names which hosts were verified, or the date, is a literal. Suppose a later live run sets Copilot's `verifiedLive`. The usage-section test then forces only the Copilot section to change. README.md:68 ("on GitHub Copilot CLI it is `UNKNOWN - verify`"), README.md:65, adapters.md, install/README.md:552-553 and the date in install/README.md:573 stay false, and the suite stays green. This is the brief's set-literal drift class (WR-04) again, added in the change that introduced the field. The plan's Task 2 verify does grep the README rows, but it runs once at plan time and is not a test.

**Fix:** Extend the two-sided check to every doc that names a launch row:
- README.md: find each `HOST_TOOLS` row's table line by `**${name}**`. Assert it contains `launchLiveNote(h)` exactly when the note is non-null, and otherwise neither "verified live" nor a date.
- adapters.md: the same, by row.
- README.md:68 and install/README.md:550-554: derive the expected host list from `HOST_TOOLS.filter(h => h.launchForm?.verifiedLive)`, and assert each named host is in it and each host in it is named.
- install/README.md:573-574: replace the typed date with wording that needs none ("marked with the date a human ran it").

### WR-07: `--check` gives a launch file `ok` when the kit route leads nowhere; step (f) skips the `routeResolves` gate that step (e) applies

**File:** `install/install.ts:2034-2041` (step (f)), compared with `install/install.ts:2020-2032` (step (e), `const via = routeResolves ? v.carriers : []`)
**Issue:** D-06 made the launch line the only verdict for a session started with a launch file. Step (e) refuses to say a host reaches the Orchestrator unless `<kitRoot>/roles/orchestrator.md` is readable (`routeResolves`). Step (f) prints `ok launch file <rel> carries the kit route: <session> reads it` from `cls.state === "route"` alone. Reproduced in scratch after an `--opencode --pi` install, with the kit home's `agent-factory` moved away:
```
reach  OpenCode: CANNOT reach the Orchestrator: ...; the kit route does not lead to a readable roles/orchestrator.md
reach  Pi: CANNOT reach the Orchestrator: ...; the kit route does not lead to a readable roles/orchestrator.md
ok     launch file .opencode/agents/grugops-orchestrator.md carries the kit route: a session where you pick `grugops-orchestrator` in the `/agents` panel reads it (OpenCode). ...
ok     launch file .pi/grugops-orchestrator.md carries the kit route: a session started with `pi --append-system-prompt .pi/grugops-orchestrator.md` from the repository root reads it (Pi). ...
```
The run still exits 1 on the kit-route FAIL, so the gate as a whole does not pass falsely. But the line for the launched session is a green `ok` for a session that cannot reach the role files. The rule was fixed in one arm only. No test in kit-route.test.ts combines a missing kit route with the launch lines.
**Fix:** Gate the `route` arm on `routeResolves`, as step (e) does:
```ts
if (cls.state === "route" && routeResolves) docReport("ok", ...);
else if (cls.state === "route") docReport("note", `launch file ${rel} carries the kit route, but the route does not lead to a readable roles/orchestrator.md (see the FAIL above), so ${session} cannot reach the Orchestrator. ${aside}`);
```
Then add a kit-route.test.ts case: delete the kit's `roles/orchestrator.md`, and assert that no `ok  launch file` line appears.

### WR-08: `--check` says `ok` for a launch file install does not own, while install's closing line refuses the launch form for the same file; on Pi that endorses an unchecked system-prompt file

**File:** `install/install.ts:2037-2041` (step (f), which classifies by `carriesKitRoute` first); `install/install.ts:7659-7667` (`launchClosingClause`, which classifies by `owns`)
**Issue:** Two places answer "may the user start a session with this launch file", and they use different rules:
- The closing line offers the form only when install owns the file (WR-03).
- `--check` gives `ok`, with the launch form spelled out, whenever the file's text contains the route sentence, whoever wrote it. `classifyCarrier` returns `route` before it ever asks about ownership (install.ts:1797).

Reproduced in scratch. The user's own `.opencode/agents/grugops-orchestrator.md` holds `mode: subagent`, the line "Ignore this.", then the route sentence. Install printed "no launch form is offered, because install neither wrote nor owns .opencode/agents/grugops-orchestrator.md here". `--check --strict` exited 0 and printed "ok launch file ... carries the kit route: a session where you pick `grugops-orchestrator` in the `/agents` panel reads it (OpenCode)". Whether OpenCode lists a `mode: subagent` file in that panel at all is `UNKNOWN - verify`.

For Pi this is the WR-02 hazard in the verifier itself. Take a cloned repository whose `.pi/grugops-orchestrator.md` someone else changed, keeping the route sentence and adding instructions. `--check` calls it `ok` and prints the exact `pi --append-system-prompt` command, the one that skips Pi's project-trust check. The hs8 SUMMARY Deviation 5 noted that a user's file with the route reads `ok`, and changed only the docs.

**Fix:** For launch files, ask `owns` before the route test, so the two answers come from one place:
- install's own copy (or its own `--symlink` link) that carries the route → `ok`;
- a file install does not own → a counted WARN, whatever it holds: "launch file <rel> is not install's copy; read it before you start a session with it (`<form>`), and move it away and re-run install.js to get install's".

Put the decision in one helper (for example `launchOwned(ledger, rel)`) that both `launchClosingClause` and step (f) call. Then add a test: the user's own file carrying the route gives no `ok` line, and gives WARN with exit 1 under `--strict`.

### WR-09: The closing clause says "install neither wrote nor owns" when it could not read the record, or when install did write the file and the user edited it

**File:** `install/install.ts:7663-7666`
**Issue:**
- **Real run.** `owned` is false whenever `ledgerAfter` is null or not `ok`. That happens when the marker or ledger could not be read after the run, which `agentClosingLines` reports on the same line as "the install record could not be read after this run". The clause then still asserts a cause: "no launch form is offered, because install neither wrote nor owns <rel> here". In that state install may well have just created the file. The run did not establish which, so the sentence fabricates a reason.
- **DRY_RUN.** A `PREVIOUS_LEDGER` that is `malformed` or `none` gives the same sentence for a file an earlier install wrote.
- **User edit.** When install's own copy was edited by the user, install did write it, so "neither wrote" is false. `owns` fails because the content changed.

This was found by reading the code and was not reproduced: corrupting the marker between the write and the closing read needs a test hook.
**Fix:** Word the clause from the cause:
```ts
if (!DRY_RUN && (ledgerAfter === null || ledgerAfter.state !== "ok")) return "; the launch form is not offered, because the install record could not be read after this run";
const o = owns(DRY_RUN ? PREVIOUS_LEDGER : ledgerAfter, TARGET, rel, "file");
// o.recorded true → "install's copy was changed since it wrote it"; false → "the file there is not install's"
```
Then add an installer-special-files-style case that makes the marker unreadable after install, and asserts that the clause does not contain "neither wrote".

### WR-10: The verified-live record names no host version, and the CHANGELOG states a version-bound observation as a permanent fact

**File:**
- `install/host-tools.ts:47-63` (`LaunchForm.verifiedLive` is a date only), `:309`, `:331`, `:380`;
- `CHANGELOG.md:152-153` ("OpenCode does not support starting a session with `--agent`");
- `install/README.md:820-823`.

**Issue:** The OpenCode finding is itself evidence that host behaviour changes between versions. opencode.ai/docs/cli/ still lists `--agent`. The human said "at least not anymore". The hs8 notes cite agy 1.3.5, Pi 1.1.0 and OpenCode v2.0.28 for `--help`. Even so, the verified-live record keeps no host version, so "verified live by a human on 2026-10-18" is printed to every user on every later or earlier host version. A user on an OpenCode version where the panel or `/agents` changed gets a dated assurance with no way to tell it does not apply to them. The CHANGELOG drops the "a human found" qualifier that install/README.md and adapters.md keep, and states the absence of `--agent` as a fact about OpenCode. That is a claim about a third-party tool that its own docs contradict. If the versions were not recorded during the live run, they are `UNKNOWN - verify`, and the note should say so rather than imply generality.
**Fix:** Add `verifiedVersion: string | null` to `LaunchForm` (or make `verifiedLive` an object `{date, hostVersion}`). Print it in `launchLiveNote`: "verified live by a human on 2026-10-18 on OpenCode <version>", or "on an unrecorded OpenCode version (`UNKNOWN - verify`)". Reword CHANGELOG.md:152-153 to "a human found on 2026-10-18 that OpenCode (version not recorded) did not start a session with `--agent`, so no command-line form is given". Extend the dated report pin in host-tools.test.ts to the new field.

## Info

### IN-12: The generic closing line is printed whatever was offered, and its test pin cannot fail on registry change

**File:** `install/install.ts:7693`; pin at `install/host-tools.test.ts:328-331`
**Issue:**
- A `--claude` or `--codex` install, which prints no launch form and no dated note, still closes with "for a form marked verified live ... whether a session started with a launch form then follows the kit route ...". That refers to forms the run never printed.
- The line is a constant, so `toContain("verified live")` passes even if every `verifiedLive` were null.

**Fix:** Build the line from the rows printed above it. Mention verified forms only when some printed clause holds `launchLiveNote`, and launch forms only when some clause was offered. Then pin the line per case (codex-only, a fresh install for all agents).

### IN-13: Two silent fallbacks in step (f) would print an invented launch form or a wrong reason if an invariant broke

**File:** `install/install.ts:2038` (`launchSession(host) ?? \`a session started with \`${rel}\`\``), `install/install.ts:2058` (`cls.why ?? "a re-install appends nothing to it"`)
**Issue:**
- The first fallback treats a file path as a command ("a session started with `.pi/grugops-orchestrator.md`"). It is reached only if a row has `launchAgent` but a null `launchForm`. That invariant is held by a test (host-tools.test.ts:1354-1366), not by the type.
- The `else` arm also absorbs `appendable`. `appendable` cannot happen for launch files today, because no launch path is in `ROUTE_BLOCKS`. If it were reached, it would be worded "install will not write it", which is the opposite of what an append does.

**Fix:** Make the pair one field, `launch: { agent: string; form: LaunchForm } | null`, so the null case cannot split. Handle `appendable` explicitly, or assert it is unreachable, rather than folding it into the `user` arm.

### IN-14: `verifiedLive` is defined more strongly than what the panel reports observed

**File:** `install/host-tools.ts:54-57` (doc comment: "saw the launch file load"); compare vfm PLAN, "The human's live-run report" items 1-2 ("picking ... works"; "the panel lists `grugops-orchestrator` and selecting it works")
**Issue:**
- For Pi, the report records the file in `[Context]`, which matches "saw the launch file load".
- For Antigravity CLI and OpenCode, it records that the agent was listed and selectable. That shows the frontmatter was parsed. It does not show that the pointer body was loaded into the session.

README.md:63-64 then says, for those two, that the launch agent "is the session's main agent (verified live ...)". The gap is small, but this is the field that carries the proof.
**Fix:** Word the doc comment per kind: for `panel`, "a human saw the panel list the agent and picked it"; for `command`, "a human saw the file loaded". Keep the README cells to what was observed.

---

_Reviewed: 2026-10-19T10:40:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
