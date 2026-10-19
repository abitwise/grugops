# Stack Research — v2.1 Autonomous Factory

**Domain:** File-based agent factory (markdown kit + zero-runtime-dependency TypeScript tooling layer compiled to committed `.js`)
**Milestone:** v2.1 — Real Spawning, Controlled Language & Live Board
**Researched:** 2026-07-28
**Confidence:** MEDIUM-HIGH (every version number verified against live registries or official docs on 2026-07-28; three items explicitly marked `UNKNOWN - verify`)

> **Framing rule (carried).** grugops ships **no runtime, DB, queue, or app code**. The only code it ships is the TypeScript tooling layer compiled with `tsc` to committed `.js` that hosts run with **zero runtime dependencies installed** (Node 22+ prerequisite; dev-deps `{typescript, vitest, @types/node}` are dev/CI-only, never shipped). Everything else is markdown. This file covers **only the four NEW v2.1 capabilities** — the validated TypeScript / tsc-to-committed-`.js` / vitest / `node:fs` foundation is not re-researched.

---

## Headline Answer

**Three of the four new capabilities need ZERO new dependencies. The fourth needs a package the user's agent fetches with `npx` — never a grugops dependency.**

| # | Capability | Verdict | New host runtime deps |
|---|-----------|---------|----------------------|
| 1 | Board projector + CLI dashboard | **Node stdlib is sufficient.** `node:fs`, `node:util.styleText`, `node:readline`, `node:tty` cover it completely. | **0** |
| 2 | Agent-driven browser testing | **Playwright MCP (`@playwright/mcp@0.0.78`) via `npx`, plus plain Playwright specs as the evidence artifact.** Claude in Chrome is attended-only and cannot be gate evidence. | **0** (npx-invoked; never enters `package.json`) |
| 3 | ASD-STE100 controlled language | **Hand-written stdlib guard (`guard_ste`).** No open-source STE checker exists; the dictionary is not redistributable. | **0** |
| 4 | Claude Code subagent definition files | **Markdown + YAML frontmatter. No tooling at all.** But the schema moved materially since v2.0 — §4 contains the likely root cause of the spawn defect. | **0** |

**Net change to `package.json`: none required.** The existing `{typescript ~6.0.3, vitest ~4.1.8, @types/node ~22}` dev set is sufficient for the entire milestone.

---

## 1. Board Projector + CLI Dashboard

### Recommendation: stdlib only. Do not add a TUI library. Do not add a watcher library.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `node:fs` — `watch()` | Node 22+ stdlib | Primary change detection on `plans/board.md`, `.grugops/queue/**`, `.grugops/context/**` | OS-native (inotify / kqueue / ReadDirectoryChangesW). Near-zero cost when idle. **`recursive: true` works on macOS, Windows AND Linux** since Node v19.1.0 (PR #45098) — comfortably below the Node 22 floor, so it is usable on every supported platform *including Windows*. |
| `node:fs` — `watchFile()` | Node 22+ stdlib | Documented polling fallback | The Node docs name it as *the* fallback when native notification is unavailable. Default `interval` is **5007 ms** — far too slow for a dashboard; override it (see below). |
| `node:util` — `styleText()` | Node 22+ stdlib | ANSI colour | The reason no colour library is needed. It automatically honours `NO_COLOR`, `NODE_DISABLE_COLORS`, `FORCE_COLOR` **and** validates the target stream is a TTY. That is the entire feature set of `chalk`/`picocolors`, in stdlib. Verified present on the runtime. |
| `node:readline` — `cursorTo`, `moveCursor`, `clearLine`, `clearScreenDown` | Node 22+ stdlib | Flicker-free frame redraw | Full cursor control. The same methods also hang off `tty.WriteStream`. Verified present. |
| `node:tty` — `columns`, `rows`, `'resize'` | Node 22+ stdlib | Responsive layout | `process.stdout` emits `'resize'` when the terminal changes size; re-render on it. `isTTY` is `undefined` when piped — the natural signal to emit plain text instead of escapes. |
| `node:util` — `parseArgs()` | Node 22+ stdlib | `--watch`, `--once`, `--json`, `--poll` | Already the house convention in `install.ts`. No `commander`/`yargs`. |
| `node:http` — `createServer()` | Node 22+ stdlib | **Future** read-only local web view (deferred — see below) | A static HTML string + one JSON endpoint + Server-Sent Events is ~120 lines of stdlib. No framework, no `ws`. |

### Architecture seam: one projector, two renderers

The milestone brief already names the right shape, and research confirms it is achievable with zero dependencies:

```
scripts/board-projector.ts   → THE parse authority. Reads plans/board.md + .grugops/queue/** +
                               .grugops/context/**. Emits ONE typed BoardSnapshot.
                               Pure function of on-disk bytes. No rendering. No side effects.
scripts/dashboard.ts         → CLI renderer. Imports the projector. ANSI/readline output.
(future) scripts/dash-web.ts → node:http renderer. Imports the SAME projector, unchanged.
```

Both compile to committed `.js` and join the freshness twin set (currently 25/25 byte-matching a fresh rebuild — this becomes 27/27 or 28/28). That is the existing convention; no new build machinery, no new script in `package.json` beyond a `dashboard` entry.

**Do not let the projector become a second grammar.** The project's own closure doctrine — *"one format-aware authority per predicate; delete the second grammar rather than syncing it"* — applies directly here. If `validate-agent-factory.ts` or `check-foundation-guards.ts` currently parses `plans/board.md` independently, the projector must **replace** that parse, not sit beside it. Two board parsers that can disagree is precisely the failure mode that cost v2.0 eight rounds on three separate invariants.

### `fs.watch` reliability — the honest matrix

Verified from the Node 22 API documentation (§ *fs.watch → Caveats*):

| Environment | Reliability | Notes |
|---|---|---|
| **macOS** (kqueue) | Event: good. **Filename: poor.** | The `filename` callback argument "is not guaranteed to be provided" even on supported platforms. Never key logic on it. |
| **Linux** (inotify) | Good; `recursive: true` since v19.1.0 | inotify has a per-user watch limit (`fs.inotify.max_user_watches`). A recursive watch over a large tree can exhaust it. Watch only `.grugops/` and `plans/`, never the repo root. |
| **Windows** (ReadDirectoryChangesW) | Works; `recursive` supported | `filename` supported but still not guaranteed. Windows holds a handle on the watched directory, so watching a directory the factory may itself delete is a hazard. Watch stable parents only. |
| **NFS / SMB / network filesystems** | **Documented as "generally unreliable or impossible"** | Verbatim from the Node docs. Must fall back to polling. |
| **Docker / Vagrant / virtualized bind mounts** | **Documented as unreliable** | Same sentence in the Node docs names virtualized environments explicitly. Must fall back to polling. |
| **WSL2 with the repo on `/mnt/c/...`** | Unreliable in practice; **`UNKNOWN - verify`** | Not covered by the Node docs. Treat as a network filesystem until measured. Folds into the standing Windows-portability obligation. |

**Two failure modes that will bite *this* project specifically:**

1. **Inode rebinding kills a naive file watch.** The Node docs state that on Linux and macOS `fs.watch` resolves the path to an **inode** and watches that inode; if the path is deleted and recreated, the watch stays attached to the old inode. **grugops writes by atomic rename** — that is the documented behaviour of `context-io.ts` and of `claim.ts`'s `pending → claimed → done` transitions. Therefore `fs.watch('plans/board.md')` fires **exactly once** and then goes permanently, silently dead. → **Watch the containing directory, never the file.** This is not a theoretical risk; it is the guaranteed consequence of grugops's own write path.
2. **Event bursts.** One logical write emits several events (rename + change; the docs explicitly note a save fires twice on AIX). → **Trailing debounce of ~120 ms**, then re-project from scratch. Never attempt incremental or diff-based state.

### Polling fallback — recommended values

| Setting | Value | Rationale |
|---|---|---|
| Native-watch debounce | **120 ms** trailing | Coalesces the rename+change burst with no perceptible lag. |
| Polling fallback interval | **1000 ms** | `watchFile`'s 5007 ms default is tuned for cheap background monitoring, not a live view; 1 s is the human "feels live" threshold. **Do not go below ~250 ms** — `watchFile` `stat()`s every watched path every tick, and a busy factory has dozens. |
| Belt-and-braces full resync (even when native watch is working) | **10 s** | A native watch losing an event is a *silent* failure. A cheap periodic re-project turns a missed event into a 10-second delay instead of a permanently stale board. Cost is one `readdir` plus a few small `readFile`s. |
| Escape hatch | `--poll` flag **and** `GRUGOPS_DASHBOARD_POLL=<ms>` | Users on NFS / Docker / WSL must be able to force polling without a code change. |

**Fallback trigger logic:** `fs.watch` **throws** when native notification is unavailable — so `try { watch() } catch { watchFile() }` is the documented, honest detection. Additionally force polling when `--poll` is set. Do **not** attempt to auto-detect network filesystems by path sniffing; it is unreliable and cross-platform-hostile.

**Fail toward polling, and print which mode is active.** A dashboard that silently degraded to a frozen view is exactly the "silent green" class this project spent two milestones eliminating. The mode indicator is a one-line render cost and it is the difference between an honest tool and a lying one.

### The future web view — cost, stated plainly, and a recommendation to defer

**Smallest stdlib-only path:** `node:http.createServer()` serving (a) one embedded static HTML string, (b) `GET /snapshot` → `JSON.stringify(project())`, (c) `GET /events` as `Content-Type: text/event-stream` (Server-Sent Events) pushing on each projector change. SSE is one-way and text-based and needs nothing installed — unlike WebSockets, which would require `ws`.

| Constraint | Passes? | Detail |
|---|---|---|
| Zero runtime dependencies | ✅ Yes | `node:http` + SSE needs nothing installed. |
| Windows | ✅ Yes | `node:http` is cross-platform. |
| **No daemon** | ⚠️ **Brushes it** | A listening socket is the closest grugops has ever come to a daemon. Mitigations: bind `127.0.0.1` only (never `0.0.0.0`), explicit invocation only, **never** auto-start, die with the terminal, no PID file, no service install. |
| Read-only / file-is-source-of-truth | ✅ Yes, **if enforced structurally** | No `POST`/`PUT`/`PATCH`/`DELETE` handlers at all — not "unimplemented", **absent**, so there is no write path for the security role to audit. |
| Out-of-Scope amendment (ratified 2026-07-28) | ✅ Permitted | The amendment explicitly allows a read-only, derived, local view. |

**Recommendation: build the projector + CLI now; do NOT build the web view in this milestone.** The projector seam *is* the deliverable that makes a web view a later ~150-line addition. Shipping the HTTP server now spends the "no daemon" budget on a feature no one has asked to use yet, and every line of it becomes surface the security/NFR role must audit. Design for it; defer it.

### TUI library evaluation — the answer is NO, with evidence

| Library | Current version (verified 2026-07-28) | Verdict | Reasoning |
|---|---|---|---|
| **blessed** | **0.1.81**, last published **2024-10-22** | **NO** | ~21 months with no release. A still-`0.x`, effectively unmaintained ncurses emulation. Adopting it means owning its bugs. Breaks zero-dep for zero upside. |
| **ink** | **7.1.1** | **NO** | Pulls React + a custom reconciler + Yoga layout — dozens of transitive packages to render a read-only table. Categorically breaks zero-runtime-dependency and would force `npm install` onto every host: the single loudest thing grugops promises you never have to do. |
| **chokidar** | **5.0.0** | **NO** | The strongest candidate, and still no. Its three real values were (a) recursive watch where the platform lacked it — **stdlib since Node v19.1.0**, below the floor; (b) event de-duplication — **~15 lines of debounce**; (c) atomic-write/rename survival — **solved by watching the directory instead of the file**. Node 22 erased ~80% of its value for this use case. |
| **chalk / picocolors / kleur** | any | **NO** | `util.styleText` is stdlib and *better*: it validates the stream and honours `NO_COLOR`/`FORCE_COLOR` with no configuration. |
| **commander / yargs** | any | **NO** | `util.parseArgs` is stdlib and already the house convention. |

**No TUI library clears the bar.** The dashboard renders a few columns and a task list. `readline.cursorTo(stream, 0, 0)` + `clearScreenDown()` + a template string re-rendered on a 120 ms debounce is the whole implementation. If the render ever grows complex enough to genuinely *want* ink, that is a signal the dashboard has grown past "never load-bearing" and should be trimmed, not re-platformed.

---

## 2. Agent-Driven Browser Testing (autonomous manual / UAT)

### Recommendation: Playwright for machine-verifiable evidence; Claude in Chrome for attended human-assist only. They are not interchangeable.

### The three options, compared

| | **Claude in Chrome** | **Playwright MCP** | **Plain Playwright specs** |
|---|---|---|---|
| **Package / identity** | Built into Claude Code as the MCP server **`claude-in-chrome`**, driven by the **Claude in Chrome extension v1.0.36+** over a native-messaging host. Not on npm. | **`@playwright/mcp` — 0.0.78** (`latest`; `next` = `0.0.78-alpha-2026-07-28`). Apache-2.0. Node ≥18. | **`@playwright/test` — 1.62.0**, Apache-2.0. Plus **`@axe-core/playwright` — 4.12.1** (already templated in the §14 gate). |
| **Tool surface** | `mcp__claude-in-chrome__*` — `read_page`, `get_page_text`, `find`, `browser_batch`, `tabs_context_mcp`, screenshot, console/network readers, GIF recording. | `mcp__playwright__*`. `--caps` opts into `vision`, `pdf`, `devtools`, `network`, `storage`, `testing`. | None — the agent authors and runs `.spec.ts`. |
| **Headless?** | **NO.** Docs: *"Browser actions run in a visible Chrome window in real time."* Pauses and asks the human at login pages and CAPTCHAs. | **Yes, with `--headless`.** Note **the default is HEADED** — headless must be opted into. `--isolated` keeps the profile in memory. Docker instructions provided for CI. | **Yes**, headless by default. |
| **CI-capable?** | **NO.** Requires interactive `/login` on a direct Anthropic plan (Pro/Max/Team/Enterprise). **API-key auth and `claude setup-token` sessions have Chrome integration force-disabled even with `--chrome`** (before v2.1.216 they merely 403'd on every call). Unavailable via Bedrock / Google Agent Platform / Microsoft Foundry. **Not supported in WSL.** | **Yes.** | **Yes** — this is the existing §14 gate path. |
| **Available to Codex / Gemini CLI / OpenCode / Copilot CLI?** | **NO.** Claude Code + the Claude VS Code extension only. | **YES — all four.** Upstream documents install for Claude Code, Codex, Gemini CLI, GitHub Copilot CLI **and OpenCode** (plus Cursor, VS Code, Windsurf, Amp, Antigravity, Cline, Factory, Goose, Grok, Junie, Kiro, LM Studio, Qodo Gen, Warp). | **YES** — it is just a CLI; any agent that can run `npx` can run it. |
| **Install** | `claude --chrome`, or `/chrome` → "Enabled by default". | Claude Code: `claude mcp add playwright npx @playwright/mcp@latest`<br>Codex: `codex mcp add playwright npx "@playwright/mcp@latest"`<br>Copilot CLI: `/mcp add`, or `~/.copilot/mcp-config.json`<br>Gemini CLI / OpenCode: config-file `mcp` block (`type: "local"` for OpenCode) | `npx playwright test` |
| **Auth-state reuse** | **Best in class** — inherits the human's real logged-in browser session, so authenticated-SaaS UAT needs no credential handling. Its one genuine advantage. | Needs storage-state plumbing (`--caps storage`). | Needs storage-state plumbing. |
| **Context cost** | Docs warn enabling by default *"increases context usage since browser tools are always loaded."* | Large tool schemas + verbose accessibility trees. | Lowest — the agent reads a pass/fail report, not a DOM. |

### Verdict, and why the verify-before-write floor decides it

grugops's un-dialable floor admits a `finding` only against **a §14-gate verdict, a passing test, or a named human**. That floor settles this question; preference does not.

- **Claude in Chrome produces attended, human-witnessed observation.** It cannot run unattended, therefore it cannot be part of a gate run. Evidence from it is legitimately `verified_by: <named human>` — a human sat there and watched. It is **not** `§14-gate` evidence and must never be stamped as such. Its correct v2.1 role is **exploratory / assistive UAT on the human's own box**, and specifically UAT against authenticated third-party apps that Playwright would otherwise need credentials for.
- **Playwright is the machine-verifiable path.** A Playwright spec that fails is a red test; one that passes is a **passing test** — already one of the three admissible stamps, with no new mechanism to invent, no fourth stamp kind, and no new admission-guard surface.
- **Between Playwright MCP and plain specs, prefer the spec as the *evidence artifact*.** MCP is excellent for the agent to *explore* a page and *author* a spec; the committed `.spec.ts` is what the gate re-runs and what a human reviews in a diff. A spec file is auditable; an MCP tool-call transcript is not. **Use MCP to write the test; use the test as the evidence.** This also holds the four non-Claude CLIs at exact parity, since all five can run `npx playwright test`.

**Explicit warning for the roadmapper.** The tempting design — *let the agent drive the browser, then let it write a note saying it passed* — is precisely the self-attestation the entire v2.0 admission architecture exists to prevent. Browser automation must terminate either in an artifact the gate re-runs, or in a named human's signature. Never in an agent's narration of what it saw.

### Version and dependency notes

- `@playwright/mcp@0.0.78` is **pre-1.0**. Flags and tool names can change between patch releases. **Pin it** (`@playwright/mcp@0.0.78`) in any committed config rather than `@latest`, and treat the pin as a dependency with a documented review date.
- It is **`npx`-invoked, never installed into grugops.** It does not enter `package.json` and never lands in a host `node_modules` that grugops owns. **Zero-runtime-dependency: PASSES** — nothing is installed *by grugops*; the user's agent fetches an MCP server on demand exactly as it fetches any other.
- `npx playwright install` (browser binaries, several hundred MB) is a real prerequisite on any machine running browser tests. This is **already true** of the existing §14 UI/E2E lane, so it is not a new cost — but it must stay behind the `quality.ui_e2e` dial and must **loud-skip, never silently pass**, when browsers are absent. Identical discipline to the existing Tier-2 `claude --print` lane.

---

## 3. ASD-STE100 (Simplified Technical English)

### Recommendation: write `guard_ste` by hand in stdlib TypeScript. Do not vendor the dictionary. Do not add a prose linter.

### Licensing — the decisive finding

| Fact | Detail | Confidence |
|---|---|---|
| Current edition | **Issue 9, January 2025**. **53 writing rules + ~900 approved words.** Issue 10 due January 2028. | HIGH |
| Copyright holder | **ASD / STEMG.** `asd-ste100.org` carries "**© Copyright 2026 STEMG - All Rights Reserved**". | HIGH |
| Cost | **Free**, but gated behind a request form at `asd-ste100.org/STE_downloads.html`. PDF only. | HIGH |
| Published licence text | **None.** No OSI licence, no Creative Commons grant, no redistribution clause anywhere on the official site. | HIGH |
| The "open source" claim | `asd-europe.org`'s STE FAQ says *"It is an open-source standard and is free to download."* This **contradicts** the All-Rights-Reserved notice on the specification's own site. In context, "open" plainly means *openly available*, not *openly licensed*. | HIGH (the contradiction is verified; the reading is inference) |
| **May grugops redistribute or embed the ~900-word dictionary?** | **`UNKNOWN - verify`.** No published grant permits it and an explicit All-Rights-Reserved notice sits against it. Only STEMG (`stemg@asd-ste100.org`) can answer. **Assume NO until a written grant exists.** | — |
| Trademark | **ASD-STE100 is a registered EU trademark, No. 017966390.** | MEDIUM |
| ASD's stance on tooling | ASD **does not endorse** tools claiming *"full compliance"* with ASD-STE100. | MEDIUM |

**This maps exactly onto a legal posture grugops already ships.** The project already carries a non-affiliation disclaimer for the "Grug" children's books plus a grugbrain.dev attribution block, in README and NOTICE. The STE posture is the same shape — and prior art confirms it is the accepted one: the two public ASD-STE100 agent skills (`nuelcyoung/asd-ste100`, `danyuchn/asd-ste100-skill`) both **paraphrase the rules, refuse to reproduce the dictionary, link to the official free download, and ship an explicit non-affiliation + not-certified disclaimer.**

**So the milestone's own framing is already correct and should be held verbatim: an "ASD-STE100-*derived* writing profile."** Derived, inspired-by, paraphrased. Never a copy, never "STE-compliant", never "certified".

### What to build instead

| Component | Form | Why |
|---|---|---|
| The writing profile | A **grugops-authored** markdown rule set under `agent-factory/` — grugops's *own* small controlled vocabulary + sentence rules, acknowledging ASD-STE100 as the inspiration with a non-affiliation line. | Original text: no licence exposure, no trademark claim, and it can be tuned to the actual surfaces (workflow steps, checklists, memory-bank, shared-context notes, board, traceability) rather than to aircraft maintenance manuals. |
| `guard_ste` | A **hand-written stdlib TypeScript** guard in the existing `scripts/` family → committed `.js`, freshness-checked, wired into `check-foundation-guards.ts` as the **8th** guard. | Zero runtime deps. Runs on Windows. Same shape as the seven existing guards, so it inherits their harness, their fail-closed convention and their review discipline. |
| Rule coverage | Only what is mechanically decidable: max sentence length (STE uses 20 words procedural / 25 descriptive — grugops picks its own numbers), one instruction per sentence, active voice, no ambiguous pronoun openers, a banned-word list, an approved-term list, present tense. | These are the STE *ideas* a token/regex guard can actually decide. Semantic rules cannot be mechanically checked and must not be claimed to be. |

**Carry the v2.0 closure doctrine into this guard from day one.** The kickoff finding is that `guard_caveman_preserved` *"measures sentence shape, not voice"* and drifted green for an entire milestone — the project's own documented failure mode of a heuristic detector that is a strict **subset** of the real predicate. `guard_ste` is the same risk class. Design it so the predicate it enforces **is** the published rule set (one authority, format-aware), not a proxy for it — and prefer a rule that is small and exactly enforced over one that is ambitious and approximated.

### Adjacent tooling — evaluated, all rejected for the host path

| Tool | Version (verified 2026-07-28) | Licence | Runtime | Verdict |
|---|---|---|---|---|
| **Vale** | **3.15.2** (released 2026-07-23) | MIT | **Single Go binary — no Node deps** | **Rejected.** The best of the field, and still no. It is a *separate per-platform native binary download*, not something the committed `.js` can call. Shipping it means grugops installs a native binary on hosts — a bigger promise-break than an npm package. And **no ASD-STE100 style package exists** in Vale's registry, so grugops would author the rules anyway — at which point it is authoring rules for a tool it cannot ship. |
| **retext-simplify** | 8.0.0 (on `retext` 9.0.0 / `unified` 11.0.5) | MIT | Node, large dep tree | **Rejected** — breaks zero-runtime-dependency. Useful as *inspiration* for the banned-phrase list; read its rules, do not install it. |
| **retext-passive** | 5.0.0 | MIT | Node, dep tree | Rejected — same. Its passive-voice heuristic is worth reading before writing `guard_ste`'s active-voice rule. |
| **retext-readability** | 8.0.0 | MIT | Node, dep tree | Rejected — same. |
| **write-good** | 1.0.8 | MIT | Node | Rejected — small, but still a dependency, and its rules are weaker than a purpose-built guard. |
| **textlint** | 15.7.1 | MIT | Node + plugin ecosystem | Rejected — heaviest of the Node options. |
| **alex** | 11.0.1 | MIT | Node | Rejected — solves a different problem (insensitive language). |
| **proselint** | — | BSD | **Python** | Rejected — a second language runtime on hosts is a non-starter. |
| **LanguageTool** | — | LGPL | **Java**, or a network API | Rejected — a JVM, or an outbound network call from a tool that has no telemetry and no network dependency. Hard no. |

**Could any of these be used dev-only, in grugops's own CI?** Technically yes — Vale or retext could lint grugops's own markdown in GitHub Actions without ever touching a host. **Recommend against it anyway.** It would create a **second controlled-language authority** alongside `guard_ste`, and *"delete the second grammar rather than syncing it"* is the doctrine this project paid eight rounds, three times, to learn. One guard, running in both CI and on hosts, is strictly better than two that can disagree.

---

## 4. Claude Code Subagent Definition Files

### Recommendation: no new tooling — but the schema has moved, and **the root cause of the spawn defect is in here.**

Source: `code.claude.com/docs/en/sub-agents`, fetched 2026-07-28. Local Claude Code on the dev box: **2.1.220**.

### Authoritative frontmatter schema

**Only `name` and `description` are required.**

| Field | Required | Values / default |
|---|---|---|
| `name` | **Yes** | Lowercase letters + hyphens; unique across the whole tree. Hooks receive it as `agent_type`. **The filename does not have to match.** |
| `description` | **Yes** | When Claude should delegate here. This is the routing **trigger**, not a label. |
| `tools` | No | Allowlist. Omit to inherit. **From v2.1.208, if no entry resolves to a real tool the subagent refuses to launch** with an error naming the entries (before that, it launched tool-less and returned confusing output). |
| `disallowedTools` | No | Denylist, subtracted from the inherited or specified set. |
| `model` | No | `sonnet` \| `opus` \| `haiku` \| `fable` \| full ID (e.g. `claude-opus-5`) \| `inherit`. **Default `inherit`.** |
| `permissionMode` | No | `default` \| `acceptEdits` \| `auto` \| `dontAsk` \| `bypassPermissions` \| `plan` \| `manual` (alias for `default`, v2.1.200+). **Ignored for plugin subagents.** |
| `maxTurns` | No | Agentic-turn cap before the subagent stops. |
| `skills` | No | Skills preloaded into context at startup (full content injected, not just the description). |
| `mcpServers` | No | Named or inline MCP servers. **Ignored for plugin subagents.** |
| `hooks` | No | Subagent-scoped lifecycle hooks. **Ignored for plugin subagents.** |
| `memory` | No | `user` \| `project` \| `local` — cross-session persistence. |
| `background` | No | `true` forces background. **Unset means Claude chooses — and since v2.1.198 it runs subagents in the background by default.** |
| `effort` | No | `low` \| `medium` \| `high` \| `xhigh` \| `max`. |
| `isolation` | No | `worktree` — runs in a temporary git worktree branched from the default branch. |
| `color` | No | `red` \| `blue` \| `green` \| `yellow` \| `purple` \| `orange` \| `pink` \| `cyan`. |
| `initialPrompt` | No | Auto-submitted first user turn **only when the agent runs as the main session agent** (`--agent` or the `agent` setting). |

**Scope precedence (highest → lowest):** managed settings → `--agents` CLI flag → `.claude/agents/` (project; walks up from cwd, closest wins as of v2.1.178) → `~/.claude/agents/` → plugin `agents/` (lowest). Project and user dirs are scanned **recursively**; identity comes **only** from `name`. Claude Code watches both dirs and picks up edits within seconds — no restart. Duplicate `name` in one directory loads only one, chosen by filesystem read order (`/doctor` reports this as of v2.1.205).

### Findings that bear directly on the v2.1 spawn defect

Each of these is a **live discrepancy** with what grugops ships today, not general background.

#### ① `Agent(...)` allowlists are IGNORED inside a subagent definition

> *"The `Agent(agent_type)` allowlist syntax applies only to an agent running as the main thread with `claude --agent`. In a subagent definition, listing `Agent` in `tools` lets that subagent spawn subagents of its own while the depth limit allows it, but **any type list inside the parentheses is ignored**."*

`.claude/agents/grugops-orchestrator.md` declares `tools: Agent(grugops-software-engineer, grugops-qe-e2e, …)`. That allowlist enforces **only** when the orchestrator is the **main thread** — `claude --agent grugops-orchestrator`, or `settings.json` `{"agent": "grugops-orchestrator"}`. When it is reached the ordinary way — `@grugops-orchestrator`, or the `/grugops` skill delegating into it — it is a *subagent*, and the parenthesised list **evaporates**: it may spawn anything.

This is a **structural** problem, not a text problem, and it lands squarely on PAR-01/PAR-04 and on `guard_wr05`. That guard currently asserts *"exactly one coordinator grants `Agent(<allowlist>)`"* by inspecting frontmatter. The assertion is **true of the file and false of the runtime** on the subagent invocation path. Per the project's own doctrine the fix must be structural: the coordinator has to be **wired as the main-thread agent**, and the guard must assert *that wiring exists*, not merely that the token appears in frontmatter. A guard that passes on a file whose constraint the platform ignores is textbook "heuristic detector that is a strict subset of the real predicate".

#### ② The advertised Claude Code floor ("v2.1.172, depth ≤5") is now wrong

Nesting-depth history, verbatim from the docs:

| Version range | Default nesting depth | Changeable? |
|---|---|---|
| v2.1.172 – v2.1.216 | **5** | No |
| **v2.1.217 – v2.1.218** | **1** — i.e. **nesting effectively OFF** | Yes, via env var |
| **v2.1.219+** | **3** | Yes |

Controlled by `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (v2.1.217+); `1` disables nesting entirely. **A user on v2.1.217 or v2.1.218 gets a factory whose role agents cannot decompose at all, with no error** — the parent silently does the work itself. That is the *same observable symptom* as the reported defect, which makes it worth ruling in or out during the live capture.

The advertised floor should be restated as **v2.1.219+** (or v2.1.172–216 **and** v2.1.219+, with 217–218 documented as a known-bad window). grugops's `queue.wip_limit` rationale — currently written against *"the platform caps depth at 5"* — needs updating to **3**.

Two further platform caps to record: **200 subagents per session** (v2.1.212+, `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`) and **20 concurrent** (v2.1.217+, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`). grugops's width cap of 3 sits comfortably inside both.

#### ③ `coordinator: true` is not a supported frontmatter field

It does not appear in the documented table. Claude Code ignores it. If any grugops guard or role text treats it as configuring Claude Code, that is inaccurate. It is legitimate as a **grugops-internal marker** — but it must be described as such, not as platform configuration.

#### ④ Subagents run in the BACKGROUND by default since v2.1.198, which strips most built-in tools

A background subagent keeps **every MCP tool** but only these built-ins: `Read`, `Grep`, `Glob`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`, `ExitWorktree`, `Monitor`, `TaskStop`, `SendMessage`, `Artifact`. Everything else is removed **whether inherited or explicitly listed**, silently, unless the removal leaves the list resolving to nothing.

Good news for grugops: every tool the roles actually need is on that list, and MCP tools (Playwright MCP, the Phase-25 admission server) survive. `Agent` is exempt from this filter and follows the depth rules wherever it runs.

#### ⑤ `AskUserQuestion` is removed from EVERY subagent, unconditionally

It sits on the always-removed list alongside `EnterPlanMode`, `ExitPlanMode` (unless `permissionMode: plan`), `EndConversation`, `ScheduleWakeup`, `TaskOutput`, `WaitForMcpServers` and `Workflow`.

**This is load-bearing for the per-checkpoint autonomy feature.** A role subagent **structurally cannot prompt the human**. Therefore the named-human opt-in that lowers a safety floor **cannot be collected inside a role agent** — it must be held by the main thread, or collected out-of-band (a file the human edits, an env var the human sets, the existing PreToolUse-hook pattern the prod-deploy guard already uses).

Treat this as a **gift, not an obstacle**: it makes *"an agent cannot self-set the opt-in"* enforceable by the platform rather than by prose — which is precisely the structural-over-heuristic standard the closure doctrine demands. Design the autonomy matrix around it deliberately.

#### ⑥ Plugin subagents ignore `hooks`, `mcpServers` and `permissionMode`

For security. grugops ships **both** a standalone `.claude/` form and a plugin form. Any role adapter needing those three fields must live in `.claude/agents/`, and the plugin form must not silently promise them.

### Practical shape of the missing role adapters

Minimal, schema-correct, and single-source-preserving:

```yaml
---
name: grugops-software-engineer
description: >-
  Implements a ready ticket on a branch under the grugops factory rules.
  Use when the Orchestrator decomposes engineering work.
model: inherit
tools: Read, Grep, Glob, Bash, Edit, Write
---
```

Implementer notes:
- `tools` **omits `Agent`** for every non-coordinator role. That is the correct "this role cannot spawn" mechanism and — unlike `Agent(...)` — it works identically on the subagent path and the main-thread path.
- Keep bodies to a **thin pointer** at `agent-factory/roles/<role>.md`, per the single-source constraint.
- Given kickoff finding #2, the new adapters must not reintroduce handoff-era prose — which is exactly why the guard set must grep adapter **bodies**, not only frontmatter.
- `name` must be unique tree-wide; the filename need not match, but keeping them aligned is cheaper to audit.

---

## Installation

```bash
# Core: nothing.
# Supporting: nothing.
# Dev dependencies: nothing new.
#
# The existing set is sufficient for the entire v2.1 milestone:
#   typescript ~6.0.3, vitest ~4.1.8, @types/node ~22
```

Optional, **user-side, never a grugops dependency** — only when the user wants agent-driven browser exploration:

```bash
# Claude Code
claude mcp add playwright npx @playwright/mcp@0.0.78
# Codex CLI
codex mcp add playwright npx "@playwright/mcp@0.0.78"
# Gemini CLI / OpenCode / GitHub Copilot CLI: config-file `mcp` block (see §2)

# Browser binaries (already a §14 quality.ui_e2e prerequisite, not new):
npx playwright install --with-deps chromium
```

---

## Alternatives Considered

| Recommended | Alternative | When the alternative would win |
|---|---|---|
| stdlib `fs.watch` + debounce + polling fallback | `chokidar@5.0.0` | If grugops ever dropped below Node 19.1 (it will not — the floor is 22), or needed watching semantics far beyond "something under `.grugops/` changed". Neither applies. |
| stdlib `util.styleText` + `readline` | `ink@7.1.1` | If the dashboard grew interactive editing, focus management and forms — which would make it a **write path** and violate the read-only amendment. The moment ink is tempting, the design is wrong. |
| stdlib `util.styleText` + `readline` | `blessed@0.1.81` | Never. Last release 2024-10-22; effectively unmaintained. |
| Defer the web view; ship the projector seam | Ship `node:http` + SSE now | If a second consumer materialised in this milestone (it has not), or a stakeholder needs a non-terminal view to sign off. Otherwise the seam *is* the deliverable. |
| Playwright spec as the evidence artifact | Playwright MCP tool-transcript as the evidence | Never for admission. MCP is right for *authoring* the spec and for exploratory investigation. |
| Playwright (any form) | Claude in Chrome | When the target is an authenticated third-party SaaS the human is already logged into **and** a human is present to witness and sign. Then it is `verified_by: <named human>` — never `§14-gate`. |
| Hand-written `guard_ste` | Vale 3.15.2 + a custom style | Only if grugops ever accepted shipping a native binary to hosts. It does not. Vale remains the right recommendation *to users* — name it in the kit's guidance exactly as `linter-recommendations.md` already names ESLint/Biome/Ruff/golangci-lint. |
| grugops-authored "STE-derived" profile | Vendoring the ASD-STE100 dictionary | Only on written redistribution permission from STEMG. Until then: no. |
| Coordinator as main thread (`--agent` / `settings.json`) | Coordinator as a subagent with `Agent(...)` | Never — the allowlist is silently ignored on that path (finding ①). |

---

## What NOT to Use

| Avoid | Which hard constraint it breaks | Use instead |
|---|---|---|
| `chokidar`, `ink`, `blessed`, `chalk`, `picocolors`, `commander`, `yargs` | **Zero runtime dependencies.** Every one forces `npm install` onto host machines — the promise grugops makes loudest. | `node:fs.watch` + `node:util.styleText` + `node:readline` + `node:util.parseArgs`. All verified present on Node 22+. |
| `fs.watch('plans/board.md')` — watching a **file** | Correctness. grugops writes by atomic rename; on Linux/macOS the watch binds to the old inode and goes **silently dead** after one write. | `fs.watch(dir, { recursive: true })` on `.grugops/` and `plans/`, then re-project the whole snapshot. |
| `fs.watch` with **no** polling fallback | **Windows / cross-platform.** Docs: unreliable-or-impossible on NFS/SMB, Docker and Vagrant; `fs.watch` *throws* when native notification is unavailable. | `try { watch() } catch { watchFile({ interval: 1000 }) }`, plus a `--poll` escape hatch and a **visible** indicator of which mode is live. |
| Keying dashboard logic on the `filename` callback argument | Correctness. Docs: supported only on Linux/macOS/Windows/AIX and **"not guaranteed"** even there. | Treat every event as "something changed" and re-project. It is cheap; the board is a handful of small files. |
| Recursive `fs.watch` on the repo root | inotify watch-limit exhaustion on Linux; large event volume. | Watch only `.grugops/` and `plans/`. |
| `watchFile` intervals below ~250 ms | It `stat()`s every watched path every tick. | 1000 ms fallback + a 10 s belt-and-braces resync. |
| A web dashboard that binds `0.0.0.0`, auto-starts, or accepts any non-GET method | **No daemon**; the read-only amendment; file-is-source-of-truth. | If/when built: `127.0.0.1` only, explicit invocation, dies with the terminal, **no write handlers exist at all**. |
| Claude in Chrome as CI or gate evidence | Cannot run headless; force-disabled under API-key/`setup-token` auth; unavailable in WSL and via Bedrock/Vertex/Foundry; Claude-Code-only, so the other four CLIs have nothing — breaking "degrade, never break". | A Playwright spec re-run by the §14 gate. |
| An agent narrating *"I checked it in the browser and it passed"* as a `finding` | **Verify-before-write (un-dialable).** This is self-attestation. | A committed spec the gate re-runs, or a named human's signature. |
| Vendoring, embedding or reproducing the ASD-STE100 ~900-word dictionary | **No fabrication + legal.** All-Rights-Reserved, no published grant, registered EU trademark 017966390. | A grugops-authored derived profile plus a non-affiliation disclaimer, mirroring the existing Grug-books posture. Link users to the free official download. |
| Claiming grugops is "ASD-STE100 compliant" or "STE-certified" | Legal + no-fabrication. ASD explicitly does not endorse full-compliance claims. | "ASD-STE100-**derived** writing profile"; "inspired by"; "not affiliated with ASD or STEMG, and not certified by either". |
| `proselint` (Python) or `LanguageTool` (Java/API) | Zero runtime deps **and** no-network. A second language runtime, or an outbound call from a tool with no telemetry. | `guard_ste` in stdlib TypeScript. |
| Two controlled-language authorities (e.g. `guard_ste` **and** a Vale style in CI) | The closure doctrine — "delete the second grammar rather than syncing it". | One guard, run in both CI and on hosts. |
| Treating `coordinator: true` as Claude Code configuration | It is not a documented frontmatter field; CC ignores it. | Keep it (if useful) as an explicitly **grugops-internal** marker; wire the real coordinator via `claude --agent` / `settings.json` `{"agent": …}`. |
| Relying on `tools: Agent(a, b, c)` inside a **subagent** file to restrict spawning | **The parenthesised list is ignored on that path** — the restriction silently does not exist. | Run the coordinator as the main thread, **and omit `Agent` entirely** from every non-coordinator role (works on both paths). |
| Advertising "Claude Code v2.1.172+, depth ≤5" | Stale. v2.1.217–218 default the depth to **1** (nesting off); v2.1.219+ defaults to **3**. | Advertise **v2.1.219+**; document 217–218 as a known-bad window; restate the width-cap rationale against depth 3. |
| Designing a human checkpoint that a **role subagent** prompts for | `AskUserQuestion` is stripped from **every** subagent, unconditionally. The prompt will never appear. | Hold human gates on the main thread, or out-of-band (human-edited file / env var / PreToolUse hook) — which also makes "an agent cannot self-set the opt-in" platform-enforced. |

---

## Stack Patterns by Variant

**If the repo is on a local disk (macOS / Linux / Windows, Node 22+):**
- `fs.watch(dir, { recursive: true })` + 120 ms trailing debounce + 10 s resync.
- Because native notification is available and `recursive` is supported on all three platforms since Node v19.1.0.

**If the repo is on NFS/SMB, in Docker/Vagrant, or under WSL on `/mnt/c`:**
- `fs.watchFile(path, { interval: 1000 })`, entered via the `catch` on `fs.watch`'s throw or via `--poll`.
- Because the Node docs state native watching is "generally unreliable or impossible" there. The dashboard must **say** it is polling.

**If `process.stdout.isTTY` is falsy (piped, redirected, CI):**
- Render one plain-text snapshot to stdout and exit. No ANSI, no cursor control, no watch loop. `--json` emits the raw `BoardSnapshot`.
- Because `styleText` already suppresses colour, but cursor escapes would corrupt a log file — and this gives the projector a free machine-readable interface for tests and future consumers.

**If the host is Claude Code v2.1.219+:**
- Parallel role subagents, nesting depth 3, width capped at `queue.wip_limit`.

**If the host is Claude Code v2.1.217 or v2.1.218:**
- Nesting default is **1**. Either set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, or degrade to the sequential path. **Detect it and say so** — do not let it look like the current silent inline-completion defect.

**If the host is Codex CLI / Gemini CLI / OpenCode / GitHub Copilot CLI:**
- Sequential path unchanged. Playwright MCP is documented for all four, so browser UAT does **not** regress the "degrade, never break" contract. Claude in Chrome is unavailable — which is fine, because it was never gate evidence.

---

## Version Compatibility

| Item | Compatible with | Notes |
|---|---|---|
| `fs.watch` `{ recursive: true }` | Node **≥ 19.1.0** on Linux/AIX/IBMi; always on macOS/Windows | grugops's Node 22+ floor clears this on every supported platform. |
| `util.styleText` | Node 20.12+ / 22+ | Verified present. Honours `NO_COLOR` / `NODE_DISABLE_COLORS` / `FORCE_COLOR` and validates the stream. |
| `util.parseArgs` | Node 18.3+ | Already used by `install.ts`. |
| `node:http` + SSE | Node 22+ | No dependency needed for the deferred web view. |
| `@playwright/mcp` **0.0.78** | Node ≥ 18; Apache-2.0 | **Pre-1.0 — pin it.** Default is **HEADED**; pass `--headless` for CI. |
| `@playwright/test` **1.62.0** | `@axe-core/playwright` **4.12.1** | Both current. The kit's existing §14 pins are `1.60.0` / `4.11.3` — **both have moved**; refresh during the kit consistency audit. |
| Claude in Chrome | Claude Code + extension **≥ 1.0.36**; direct Anthropic plan; `/login` auth | Not WSL. Not Bedrock/Vertex/Foundry. Not API-key or `setup-token` sessions. Blockable org-wide via `deniedMcpServers`. |
| Claude Code nested spawning | **v2.1.219+** (default depth 3) | v2.1.172–216: depth 5, fixed. **v2.1.217–218: depth 1 — nesting off.** |
| Subagent `tools` strict-resolution error | v2.1.208+ | Earlier versions launched **tool-less** instead of erroring — a plausible contributor to silent inline completion on older hosts. |
| Background-by-default subagents | v2.1.198+ | Strips non-listed built-ins; keeps all MCP tools; `Agent` exempt. |
| Session / concurrency caps | 200 per session (v2.1.212+); 20 concurrent (v2.1.217+) | grugops's width cap of 3 is well inside both. |
| Nested-project agent resolution (closest wins) | v2.1.178+ | Relevant to the two-root install: `.claude/agents/` is discovered by walking up from cwd. |
| Vale | **3.15.2** (2026-07-23) | Reference only — recommended *to users*, never shipped. |
| `typescript ~6.0.3`, `vitest ~4.1.8`, `@types/node ~22` | unchanged | **No new dev dependency required for this milestone.** |

---

## Integration Points With the Existing Tooling Layer

| New artifact | Lands in | Wires into |
|---|---|---|
| `scripts/board-projector.ts` → committed `.js` | `scripts/` | The freshness twin set (25 → 26+). Becomes the **sole** board/queue parse authority — *replace*, do not duplicate, any existing board parse in the validator or guards. |
| `scripts/dashboard.ts` → committed `.js` | `scripts/` | Freshness twin set; a `dashboard` entry in `package.json` `scripts`; runs on hosts as `node scripts/dashboard.js` with nothing installed. |
| `scripts/guard-ste.ts` → committed `.js` | `scripts/` | `check-foundation-guards.ts` as the **8th** guard. Fail-closed. |
| Rebuilt voice guard | `scripts/` | Same aggregator. Must measure **voice**, not sentence shape (kickoff finding #4). |
| Extended `guard_wr05` | `scripts/` | Must additionally assert the **main-thread coordinator wiring exists** (finding ①), not just the frontmatter token — and must grep adapter **bodies** for handoff-era prose (kickoff finding #2). |
| ~10 new role adapters | `.claude/agents/` | Thin pointers to `agent-factory/roles/*.md`. `tools` omits `Agent` for every non-coordinator role. Also regenerate the two packaging templates so the next `--update` cannot reintroduce the drift. |
| STE-derived writing profile | `agent-factory/` (checklist or workflow reference) | Single-source: referenced by roles, restated by none. Carries the non-affiliation disclaimer. Appears in the docs catalog → `freshness:catalog` must be re-run. |
| Playwright MCP guidance | `agent-factory/checklists/` | Extends the existing `playwright-visual-regression-recipe.md` + `accessibility-checklist.md`; dialed by `quality.ui_e2e`; loud-skip when browsers are absent. |

---

## Open Questions / `UNKNOWN - verify`

1. **`UNKNOWN - verify` (blocking for any dictionary vendoring):** whether ASD/STEMG permits third-party redistribution or embedding of the ASD-STE100 approved-word dictionary. No published grant exists; an explicit All-Rights-Reserved notice exists against it. Resolve by written enquiry to `stemg@asd-ste100.org` — **or avoid the question entirely** by authoring an original derived profile, which is the recommendation.
2. **`UNKNOWN - verify`:** `fs.watch` behaviour under WSL2 with a Windows-drive-mounted repo (`/mnt/c/...`). Not covered by the Node docs. Treat as a network filesystem (force polling) until measured. Folds into the standing Windows-portability obligation.
3. **`UNKNOWN - verify`:** whether `mcp__claude-in-chrome__*` tools are reachable **from inside a subagent**. The docs state subagents inherit MCP tools and background subagents keep every MCP tool, which implies yes — but Chrome integration is session-scoped and gated on `--chrome`, and this specific combination is not documented. Verify before designing any UAT flow that depends on it. (The §2 recommendation does **not** depend on the answer.)
4. **Decision needed (human):** advertise a Claude Code floor of **v2.1.219+** (clean, but narrows the supported base again), **or** support v2.1.172+ with an explicit runtime check that detects the 217–218 depth-1 window and degrades **loudly** to sequential.
5. **Verify in-phase:** the §14 gate's Playwright pins. Research found `@playwright/test 1.62.0` and `@axe-core/playwright 4.12.1`; the kit currently pins `1.60.0` / `4.11.3`. Refresh as part of the kit consistency audit.

---

## Sources

| Source | What was verified | Confidence |
|---|---|---|
| `code.claude.com/docs/en/sub-agents` (fetched 2026-07-28) | Complete frontmatter table; scope precedence; **the `Agent(...)`-ignored-in-subagents rule**; nesting-depth version history (172–216 / 217–218 / 219+); `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`; session (200) and concurrency (20) caps; background-by-default tool stripping; **the unconditional `AskUserQuestion` removal**; plugin-subagent field restrictions; v2.1.208 zero-tools launch refusal | **HIGH** (primary vendor doc, quoted) |
| `code.claude.com/docs/en/chrome` (fetched 2026-07-28) | Claude in Chrome is the `claude-in-chrome` MCP server; visible-window-only; extension ≥1.0.36; direct-plan + `/login` requirement; API-key/`setup-token` force-disable; no WSL; not via Bedrock/Vertex/Foundry; `deniedMcpServers` blocking; context cost | **HIGH** (primary vendor doc) |
| Node.js v22 API docs via Context7 `/websites/nodejs_latest-v22_x_api` | `fs.watch` availability caveats (inotify/kqueue/ReadDirectoryChangesW; NFS/SMB/Docker/Vagrant unreliable; throws when unavailable); the **inode** caveat; `filename` not guaranteed; `fs.watchFile` default `interval: 5007`; `recursive` expanded to Linux/AIX/IBMi; `util.styleText` incl. `NO_COLOR`/`FORCE_COLOR`/stream validation; `readline` cursor APIs; `tty` `'resize'` | **MEDIUM-HIGH** (curated mirror of the official docs) |
| `github.com/nodejs/node/pull/45098` | Recursive `fs.watch` on Linux landed in **Node v19.1.0** | MEDIUM |
| Live `npm show` (2026-07-28) | `@playwright/mcp` 0.0.78 (Apache-2.0), `@playwright/test` 1.62.0, `@axe-core/playwright` 4.12.1, `blessed` 0.1.81 (last published 2024-10-22), `ink` 7.1.1, `chokidar` 5.0.0, `retext-simplify` 8.0.0, `retext` 9.0.0, `unified` 11.0.5, `retext-passive` 5.0.0, `retext-readability` 8.0.0, `write-good` 1.0.8, `textlint` 15.7.1, `alex` 11.0.1 — MIT unless noted | **HIGH** (registry is authoritative for versions) |
| `github.com/microsoft/playwright-mcp` README | Install commands for Claude Code / Codex / Gemini CLI / Copilot CLI / **OpenCode** (+15 more clients); **HEADED default**; `--headless` / `--isolated` / `--browser` / `--caps`; Docker/CI guidance; Apache-2.0; Node ≥18; the CLI-over-MCP token-efficiency note | MEDIUM-HIGH |
| `asd-ste100.org` (home / FAQ / downloads, fetched 2026-07-28) | Issue 9, January 2025; 53 rules + ~900 words; Issue 10 due 2028; "© Copyright 2026 STEMG - All Rights Reserved"; free but request-form-gated; **no published licence text** | **MEDIUM-HIGH** (primary source; the *absence* of a grant is itself the finding) |
| `asd-europe.org` STE FAQ | The "open-source standard and is free to download" phrasing that contradicts the All-Rights-Reserved notice | MEDIUM |
| `github.com/nuelcyoung/asd-ste100`, `github.com/danyuchn/asd-ste100-skill` | Prior art: both paraphrase the rules, refuse to reproduce the dictionary, link to the official download, ship a non-affiliation + not-certified disclaimer; ASD-STE100 is EU trademark 017966390 | MEDIUM |
| `api.github.com/repos/errata-ai/vale/releases/latest` | Vale **3.15.2**, released 2026-07-23 | **HIGH** |
| Local runtime probe (`node -e`, executed) | `util.styleText`, `util.parseArgs`, `readline.{cursorTo,moveCursor,clearLine,clearScreenDown}`, `http.createServer` all present; `isTTY` undefined when piped | **HIGH** (executed, not asserted) |
| Local `claude --version` | Claude Code **2.1.220** on the dev box (→ nesting depth default 3) | **HIGH** |
| Local repo inspection | `.claude/agents/` contains exactly one file; it declares `tools: Agent(<7 roles>)` plus the unsupported `coordinator: true`; handoff-era prose present in the body at the line the kickoff findings name | **HIGH** |

---
*Stack research for: grugops v2.1 — Autonomous Factory (Real Spawning, Controlled Language & Live Board)*
*Researched: 2026-07-28*
*Prior milestone's stack research archived at `.planning/research/archive/v2.0/STACK.md`*
