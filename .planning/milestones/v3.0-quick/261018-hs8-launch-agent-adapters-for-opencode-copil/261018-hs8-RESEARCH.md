# Quick Task 261018-hs8: Launch-agent adapters (OpenCode, Copilot CLI, Antigravity CLI, Pi) - Research

**Researched:** 2026-10-18
**Domain:** grugops installer registry (install/host-tools.ts), the whole-file entry pipeline (generator, install, uninstall, `--check`), and four hosts' agent-file formats
**Confidence:** HIGH for the codebase map; MEDIUM to HIGH for host formats (three of them probed on installed binaries)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 Agent name:** Every host uses the one name `grugops-orchestrator`, the same as the Claude Code adapter. The Copilot ID comes from the file name.
- **D-02 Pi launch file:** Pi gets `.pi/grugops-orchestrator.md`, passed with `--append-system-prompt`. Append is used, not `--system-prompt`, so Pi's own tool instructions stay. The installer never writes `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`: either one would make every Pi session the Orchestrator, the same reason the Claude Code settings `agent` key is not written (install/README.md §6). Pi does not auto-load the file. It takes effect only when the flag is passed.
- **D-03 Pre-existing user file at the path:** The installer gives these files the same conflict treatment as the existing per-host adapter files (for example `.opencode/commands/grugops.md`). It never clobbers a user's file and emits a note. On re-install, the D-32 backup rule applies. These files are recorded in the install marker or ledger (the owns(path) authority). They are removed by uninstall and by per-agent removal, and `--check` reports them.
- **D-04 Pointer body:** The body is a thin pointer with no role text, like the existing skill and command pointers. It says to read AGENTS.md, then the orchestrator role through the `kitRoot` route, and to act as the Orchestrator. This follows the single-source rule.

### Claude's Discretion
- Exact frontmatter fields per host: follow what the research finds in current docs, and mark unverified fields `UNKNOWN - verify`.
- Derive the file sets from the host-tools registry; do not hand-type them ("derive the set, assert the count").

### Deferred Ideas (OUT OF SCOPE)
None listed. (Out of scope by the task boundary: Codex CLI is unchanged, and no live host run is claimed.)
</user_constraints>

## Project Constraints (from CLAUDE.md)

- The tooling is TypeScript compiled with `tsc` to committed `.js`. Every `.ts` edit ships its rebuilt `.js` in the same commit (`npm run build`, then `npm run check:build-parity`).
- No runtime dependencies on hosts. Node 22+.
- **Single-source:** role text lives once. Adapters are thin pointers (D-04).
- **Installers:** idempotent, additive, dry-run-capable, reversible. They never overwrite or delete user content.
- **No fabrication:** anything not run on a live host is `UNKNOWN - verify`.
- Lowercase `grugops`. Clear voice in installer messages and docs.
- **GSD:** edits happen inside the `/gsd-quick` workflow.

## Summary

Every non-Claude entry today flows from one registry, `install/host-tools.ts`. Each host row has exactly one `adapter` kind. Two tables keyed by kind, `ROUTE_POINTERS` and `ADAPTER_FOOTPRINT` (host-tools.ts:481-509), say which files a kind writes and owns. The generator `scripts/generate-host-entries.ts` renders one committed file per kind from `agent-factory/packaging/host-entry.pointer.md`. Install copies those committed bytes (`writeWholeFileEntry`, install.ts:3564), and the ledger records them. Uninstall reverses them by record, scoped per agent through `entryOwners` (host-tools.ts:519-523). `--check` reports them as route carriers (`routeCarriers`, host-tools.ts:533-535).

**The central design fact:** the new Antigravity file must belong to Antigravity only, but Antigravity shares the `agent-skill` kind with Codex (host-tools.ts:189 and :210). If the four new paths were added to the per-kind `ROUTE_POINTERS` or `ADAPTER_FOOTPRINT`, Codex would own `.agents/agents/grugops-orchestrator.md`. Two things would then go wrong: `uninstall --codex` would remove it while Antigravity stays, and the generator's `outputRel` would refuse, because it requires exactly one path per kind (generate-host-entries.ts:148-152). So the launch file has to be a **per-host** fact. Add one required field to the `HostTool` row and two derived helpers. Then send every `ROUTE_POINTERS[h.adapter]` and `ADAPTER_FOOTPRINT[h.adapter]` consumer through those helpers.

**Primary recommendation:** add `launchAgent: string | null` to `HostTool`, plus `hostPointers(h)` and `hostFootprint(h)` in host-tools.ts. Rewire the eight product call sites listed below to them. Add a `LAUNCH_SHAPES` table keyed by host id to the generator, with a two-sided check against the registry. Commit the four rendered files. Then update the tests and docs that hand-type the old sets.

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|---|---|---|---|
| Which file a host's launch agent is, and who owns it | Registry (`install/host-tools.ts`) | — | One authority. Every consumer derives from it. |
| The bytes of the launch file (frontmatter + POINTER_LINE) | Generator (`scripts/generate-host-entries.ts`) | Freshness gate (`scripts/host-entries-freshness.ts`) | The text exists once, in the kit. Install never builds entry text (D-11). |
| Writing, refreshing, never clobbering | `install/install.ts` `writeWholeFileEntry` | `install-marker.ts` ledger | Existing whole-file rule. Same treatment as `.opencode/commands/grugops.md`. |
| Removal and per-agent scoping | `install/uninstall.ts` ledger walk + `inScope` | `entryOwners` | Delete by record (DC-2). Ownership comes from the footprint. |
| `--check` reporting | `install.ts` doctor via `routeCarriers` / `reachVia` | — | The launch file carries KIT_ROUTE, so it is a route carrier. |

## Codebase Map: how a whole-file host entry flows end to end

All values below were read this session.

**Registry (install/host-tools.ts)**
- Adapter kinds, host-tools.ts:29-35, verbatim: `"claude-kit", "copilot-pointer", "pi-prompt-template", "agent-skill", "opencode-command"` [VERIFIED: install/host-tools.ts:29-35]
- Paths, verbatim: `PI_PROMPT_REL = ".pi/prompts/grugops.md"` (:78), `AGENT_SKILL_REL = ".agents/skills/grugops/SKILL.md"` (:90), `OPENCODE_COMMAND_REL = ".opencode/commands/grugops.md"` (:98), `OPENCODE_CONFIG_REL = "opencode.json"` (:106) [VERIFIED: install/host-tools.ts]
- `POINTER_LINE = START_HERE_SENTENCE + " " + KIT_ROUTE` (:161). Its text is `grugops: read \`AGENTS.md\`, then \`agent-factory/roles/orchestrator.md\`, and act as the Orchestrator.` followed by KIT_ROUTE (:138-139, :153). This already satisfies D-04 word for word. [VERIFIED: install/host-tools.ts:138-161]
- `ROUTE_POINTERS` (:481-487): `"copilot-pointer": [".github/copilot-instructions.md"]`, `"pi-prompt-template": [PI_PROMPT_REL]`, `"agent-skill": [AGENT_SKILL_REL]`, `"opencode-command": [OPENCODE_COMMAND_REL]`. `ADAPTER_FOOTPRINT` (:503-509) is the same list plus `"claude-kit": [".claude/", "CLAUDE.md"]` and `OPENCODE_CONFIG_REL` for opencode. [VERIFIED]
- `entryOwners` (:519-523) is `HOST_TOOLS.filter((h) => ADAPTER_FOOTPRINT[h.adapter].some(owned))`, so ownership is per kind today. `routeCarriers` (:533-535) is `[...host.entryFiles, ...ROUTE_POINTERS[host.adapter]]`. [VERIFIED]
- `HOST_TOOL_COUNT = 6` (:591). It does not move, because no row is added. [VERIFIED]

**Generator and freshness**
- The generator renders one entry per kind with a non-null `ENTRY_SHAPES` (generate-host-entries.ts:87-108) at `outputRel(kind)`, which requires exactly one ROUTE_POINTERS path (:148-158). It refuses a template body that is not POINTER_LINE, or that holds `` !` `` or `@\S` (:121-135). It halts on drift unless run with `--overwrite-committed-host-entries` (:56). [VERIFIED: scripts/generate-host-entries.ts]
- The committed outputs sit at the repo root and are the kit source that install copies: `.agents/skills/grugops/SKILL.md`, `.opencode/commands/grugops.md`, `.pi/prompts/grugops.md` [VERIFIED: `git ls-files`].
- The freshness gate (`npm run freshness:host-entries`, wired in ci.yml) takes its set from whatever the mirrored generator wrote. Its SET half scans "every file under the judged tree in each parent directory of a rendered entry" (host-entries-freshness.ts:26-30). The new parents are `.opencode/agents`, `.github/agents`, `.agents/agents` and `.pi`. `.pi` holds `prompts/grugops.md`, which is rendered too, so it is not EXTRA. **No new generator or gate is needed.** The existing generator is extended, and the gate follows automatically. [VERIFIED: scripts/host-entries-freshness.ts:1-60]

**Install (install/install.ts)**
- `wholeFileEntryRels(hosts)` (install-marker.ts:960-962) is ROUTE_POINTERS of the hosts' kinds minus BLOCK_RELS. It is the one list install writes (install.ts:6823, `for (const rel of wholeFileEntryRels(SELECTION)) writeWholeFileEntry(PREVIOUS_LEDGER, rel);`) and the list uninstall reports unrecorded files from (uninstall.ts:2818-2846). [VERIFIED]
- `carrierSource(rel)` (install.ts:1491-1494) reads `GRUGOPS_SRC/<rel>` only for AGENTS.md and `wholeFileEntryRels(HOST_TOOLS)`. [VERIFIED]
- **Conflict rule (D-03):** in `writeWholeFileEntry` (install.ts:3564-3604), nothing at the path means create with `wx`, record a kit-false `file` entry, and record only the directories this run made. Install's own unedited copy (ledger `sha256:` still holds) is refreshed. Anything else (a user file, or install's copy that the user edited) is **left untouched and not recorded**, with a `skipped ... left untouched` line, and the route-note pass names it if it strands a host. DRY_RUN gives `would-add` or `would-refresh`. [VERIFIED: install/install.ts:3526-3604]
- **Correction to D-03's last sentence:** the D-32 backup rule (`--backup-edited-kit`, `<file>.grugops-edited-<stamp>`) covers only the Claude Code kit files `.claude/skills/grugops*/SKILL.md` and `.claude/agents/grugops-*.md` (install/README.md:104-108; `kitPreflight`, install.ts:5107, gated by `kitWriteDecision`, install.ts:5040-5052). The existing whole-file entries such as `.opencode/commands/grugops.md` are **not** under D-32. An edited copy is left alone, never backed up and overwritten. D-03's first sentence ("the same conflict treatment as `.opencode/commands/grugops.md`") is the rule the code supports. See Open Question 1.
- Other per-kind consumers that must move to the per-host helpers: `entryLabel` (install.ts:1441-1445, which would print " entry" for an unknown rel), `ENTRY_NOUN` (:1430-1436), `installedSplit` (:1739-1740), the doctor's nothing-installed note (:2126), and `agentClosingLines` prefixes (:7604). [VERIFIED]

**Uninstall (install/uninstall.ts)**
- Partial run: `inScope(e)` (uninstall.ts:2679-2683) reverses an entry only when a NAMED agent owns it and no REMAINING agent does, through `entryOwners`. Directory entries are owned by every agent whose footprint path lies under them (host-tools.ts:521). With per-host footprints, uninstalling Codex while Antigravity stays keeps `.agents/agents/...` (owner antigravity only) and `.agents` (both own it). Uninstalling Antigravity while Codex stays removes `.agents/agents/grugops-orchestrator.md` and the `.agents/agents` directory if install created it, and keeps `.agents/skills/...`. This is correct only if `entryOwners` reads `hostFootprint(h)`. [VERIFIED: uninstall.ts:2650-2683]
- `reportDirCandidates` (uninstall.ts:2772-2785) iterates `HOST_ADAPTER_KINDS × ADAPTER_FOOTPRINT`. Change it to `HOST_TOOLS.flatMap((h) => hostFootprint(h).flatMap(footprintDirs))` so that `.opencode/agents`, `.github/agents`, `.agents/agents` and `.pi` become candidates. [VERIFIED]
- `agentsToRecord` (install-marker.ts:1786-1796) uses `entryOwners`, so the marker's `agents` field follows automatically (REC-1). [VERIFIED]
- `LEGACY_ADAPTER_KINDS` (install-marker.ts:1677) needs no change: no pre-34.1 install wrote launch files. [VERIFIED]

**`--check`**
- `routeCarrierSet` (install.ts:1666-1668) and `hostReadsCarrier` (:1461-1463) both derive from `routeCarriers`. If `routeCarriers` uses `hostPointers(h)`, each launch file is reported in the reach line and gets its own carrier finding (ok, own-stale, user, absent). This is how "`--check` reports them" is met. **Keep the `routeCarriers` call-site pins**: host-tools.test.ts:852-890 pins `routeCarriers@hostReadsCarrier: 1` and `routeCarriers@routeCarrierSet: 1`, so change `routeCarriers`' body, not its callers. [VERIFIED]

### Recommended registry shape

```ts
// install/host-tools.ts (sketch; names are recommendations, not yet in the repo)
export const LAUNCH_AGENT_NAME = "grugops-orchestrator";                         // D-01
export const OPENCODE_AGENT_REL = `.opencode/agents/${LAUNCH_AGENT_NAME}.md`;
export const COPILOT_AGENT_REL = `.github/agents/${LAUNCH_AGENT_NAME}.agent.md`;
export const ANTIGRAVITY_AGENT_REL = `.agents/agents/${LAUNCH_AGENT_NAME}.md`;
export const PI_LAUNCH_REL = `.pi/${LAUNCH_AGENT_NAME}.md`;
// HostTool gains:  readonly launchAgent: string | null;   (required → every row must state it; compile error otherwise)
//   claude: null (its launch agent is the .claude/ kit adapter), codex: null (D: Codex unchanged)
export function hostPointers(h: HostTool): readonly string[] {
  return h.launchAgent === null ? ROUTE_POINTERS[h.adapter] : [...ROUTE_POINTERS[h.adapter], h.launchAgent];
}
export function hostFootprint(h: HostTool): readonly string[] {
  return h.launchAgent === null ? ADAPTER_FOOTPRINT[h.adapter] : [...ADAPTER_FOOTPRINT[h.adapter], h.launchAgent];
}
// entryOwners → hostFootprint(h).some(owned); routeCarriers → [...entryFiles, ...hostPointers(host)]
// install-marker.ts wholeFileEntryRels → hosts.flatMap((h) => hostPointers(h).filter(... !BLOCK_RELS ...))
```

In the generator, add `LAUNCH_SHAPES: Readonly<Record<string, EntryShape>>` keyed by host id. `renderAll` appends one entry per `HOST_TOOLS` row with `launchAgent !== null` at that path. It refuses (exit 1) when the key set does not equal the launch-bearing ids, in both directions. Launch shapes carry `argumentsLine: false`, because an agent definition gets no `$ARGUMENTS`. `renderEntry` must emit **no** `---` fence when the frontmatter list is empty (Pi).

The **product sites to rewire**, found by `grep '\[h\.adapter\]\|\[host\.adapter\]'` over non-test `install/*.ts` and `scripts/*.ts`: host-tools.ts:522 and :534, install-marker.ts:961, install.ts:1442, :1740, :2126 and :7604, plus uninstall.ts:2781 (over kinds). That is eight. `ENTRY_NOUN` (install.ts:1430) needs a launch noun; recommend that `entryLabel` return `<host name> launch agent` when `rel === h.launchAgent`. The plan should re-run that grep and assert zero remaining direct `ROUTE_POINTERS[...adapter]` and `ADAPTER_FOOTPRINT[...adapter]` uses outside the two helpers, with the count stated.

## Host Formats (verified 2026-10-18)

| Host | Path | Frontmatter to render | Launch | Evidence |
|---|---|---|---|---|
| **OpenCode** | `.opencode/agents/grugops-orchestrator.md` | `description: <ENTRY_DESCRIPTION>` (required), `mode: primary` | `opencode --agent grugops-orchestrator` per the docs; Tab switches agents in a session | Docs: "Per-project: `.opencode/agents/`"; "`description` ... is a **required** config option"; "`mode` ... `primary`, `subagent`, or `all` ... defaults to `all`"; "The markdown file name becomes the agent name" [CITED: opencode.ai/docs/agents/, retrieved 2026-10-18]. CLI docs list `--agent` ("Agent to use") for the default TUI command and for `opencode run` [CITED: opencode.ai/docs/cli/, retrieved 2026-10-18]. **Probe on installed OpenCode v2.0.28:** a scratch repo holding exactly that file gave, through `opencode debug agents --print-logs`, `{"id":"grugops-orchestrator","mode":"primary","description":"Route a software-delivery request through the grugops Orchestrator.","system":"grugops probe body."}`. So discovery, the primary mode and "body = system prompt" are confirmed [VERIFIED: local opencode v2.0.28]. `opencode run --help` and `opencode mini --help` list `--agent string  Agent to use`; **`opencode --help` (TUI) does not list `--agent`** in v2.0.28 (see Open Question 2). |
| **GitHub Copilot CLI** | `.github/agents/grugops-orchestrator.agent.md` | `name: grugops-orchestrator`, `description: <ENTRY_DESCRIPTION>` | `copilot --agent grugops-orchestrator`, or `/agent` in a session | "Each custom agent is defined by a Markdown file with an `.agent.md` extension"; Project location "`.github/agents/`"; "the ID is the file name without the `.agent.md` or `.md` extension"; `copilot --agent security-auditor --prompt "..."`; "Enter `/agent` in interactive mode" [CITED: docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli, retrieved 2026-10-18]. Property table: only `description` is **Required**; `name` "Optional"; `tools` "If unset, defaults to all tools" [CITED: docs.github.com/en/copilot/reference/custom-agents-configuration, retrieved 2026-10-18]. Copilot CLI is not installed here, so nothing was probed. Leave `tools`, `target` and `disable-model-invocation` unset: their effect on the CLI is `UNKNOWN - verify`. |
| **Antigravity CLI** | `.agents/agents/grugops-orchestrator.md` | `name: grugops-orchestrator` (required), `description: <ENTRY_DESCRIPTION>` (required), `mainAgent: true`, `subagent: false` | Pick it in the `/agents` panel. The installed `agy` 1.3.5 lists `--agent  Agent for the current CLI session` | "`.agents/agents/<name>.md`"; `name` and `description` "_(Required)_"; "`mainAgent` \| `boolean` \| `true` \| If `true`, allows selection as the primary agent in chat interfaces"; "`subagent` \| `boolean` \| `true` \| If `true`, allows invocation using the `invoke_subagent` tool"; "select custom agents directly as your primary agent in the `/agents` panel menu" [CITED: antigravity.google/docs/subagents/, retrieved 2026-10-18]. `agy --help` on 1.3.5 prints `--agent                         Agent for the current CLI session` [VERIFIED: local agy 1.3.5]. **Correction to CONTEXT:** the flag is not "third-party only", because the binary's help documents it. Whether `agy --agent grugops-orchestrator` picks up a *workspace* custom agent is still `UNKNOWN - verify`: `agy agent` printed nothing in a scratch repo, so there was no observation. `mainAgent: true` restates the default (kept for intent). `subagent: false` keeps the planner from delegating to the Orchestrator as a subagent. |
| **Pi** | `.pi/grugops-orchestrator.md` | **none.** Pi appends the whole file verbatim, so frontmatter would go into the prompt | `pi --append-system-prompt .pi/grugops-orchestrator.md`, started **at the repo root** | `pi --help` (1.1.0): `--append-system-prompt <text>  Append text or file contents to the system prompt (can be used multiple times)` [VERIFIED: local pi 1.1.0]. Source (earendil-works/pi main @ 482c1381, 2026-10-18, `packages/coding-agent/src/core/resource-loader.ts`): `resolvePromptInput` does `if (existsSync(input)) { return stripBom(readFileSync(input, "utf-8")); } ... return input;` (:167-182). A relative path resolves against the **process cwd**, and **a path that does not exist is appended as literal text, silently**. Discovery of `.pi/APPEND_SYSTEM.md` runs only `if (!appendSources)` (:663-667), so **passing the flag replaces a user's `.pi/APPEND_SYSTEM.md` (or the global one) for that session** [VERIFIED: source read]. The explicit flag path is not gated on project trust; only the discovery functions check `isProjectTrusted()` (:1213-1238). `.pi/SYSTEM.md` / `APPEND_SYSTEM.md` are auto-discovered from `<cwd>/.pi/` (:1214, :1228), which confirms D-02's reasoning. |

`ENTRY_DESCRIPTION` (generate-host-entries.ts:60) is `"Route a software-delivery request through the grugops Orchestrator."` Reuse it: it has no `: ` sequence, so it stays valid plain YAML. A description with a colon followed by a space would break YAML parsing on every host.

### `invoke` text (printed in install's closing notes, host-tools.ts:70, install.ts:7614)

Fold the launch form into each row's `invoke` rather than adding a second printed field. The closing-line format `— ${h.invoke}` is pinned by host-tools.test.ts:305 and :326. host-entry-docs.test.ts:316-319 then requires every backticked token to appear in that host's "Using grugops on <name>" section, which is a free docs check. Suggested wording:
- opencode: ``type `/grugops <request>`, or start the session as the Orchestrator with `opencode --agent grugops-orchestrator` ``
- copilot: ``start with `copilot --agent grugops-orchestrator`, or pick it with `/agent`; Copilot CLI also reads `.github/copilot-instructions.md` with its other instructions, and a live run is `UNKNOWN - verify` ``. Drop "no command is written".
- antigravity: ``type `/grugops <request>`, or pick `grugops-orchestrator` as the primary agent in the `/agents` panel``
- pi: ``start Pi at the repository root and type `/grugops <request>`, or start it as the Orchestrator with `pi --append-system-prompt .pi/grugops-orchestrator.md` ``

## Common Pitfalls

1. **Ownership by kind leaks Antigravity's file to Codex.** A path added to `ADAPTER_FOOTPRINT["agent-skill"]` makes `uninstall --codex` remove `.agents/agents/...` while Antigravity stays. *Avoid:* use per-host `hostFootprint`. *Test:* extend uninstall-removal.test.ts:708-735 ("uninstall Codex while Antigravity stays") so it asserts the launch file is byte-unchanged after `--codex` and gone after `--antigravity`. Add the converse row: `--antigravity` while Codex stays removes `.agents/agents/` and keeps `.agents/skills/grugops/SKILL.md`.
2. **Hand-typed sets that break or go silently incomplete** (set-literal drift):
   - install.test.ts:10590 `expect(filesUnder(join(target, ".pi"))).toEqual([PI_PROMPT_REL.slice(".pi/".length)])` breaks. Keep its D-02 intent: derive the expected set from `hostPointers(pi)` and assert that no `SYSTEM.md`, `APPEND_SYSTEM.md` or `settings.json` exists under `.pi/`.
   - scripts/host-entries-freshness.test.ts:41-46 `ENTRY_COUNT = 3` (derived from kinds only), install/host-entries.test.ts:50 `ENTRY_RELS` (from `ROUTE_POINTERS[h.adapter]`), and scripts/generate-host-entries.test.ts:34-38 all have to include launch entries. Derive them from one exported generator list (for example `renderedEntryRels()`), and pin the count at 7.
   - installer-write-set.test.ts:384 and :394 use `ROUTE_POINTERS[a.host.adapter]`: switch to `hostPointers`.
   - host-tools.test.ts:750-760 `expectedCarriers(adapter, entryFiles)` is an independent oracle, so give it the launch path too. host-entry-docs.test.ts:304 and :315 use `ROUTE_POINTERS[t.adapter]`: switch to `hostPointers(t)`, so that each usage section must name its launch file.
   - installer-dry-run.test.ts:112 `FLOW10_CREATED` is a hand list (a "contains" check, so it stays green but incomplete). Add the copilot and pi launch rels for the hosts that flow chooses.
3. **check-banned-claims coverage reds on the new tracked markdown.** check-banned-claims.ts:904-906 excludes the three generated entries by exact name, and check-banned-claims.test.ts:3298 pins `expect(exact.length).toBe(11)`. A coverage case requires every tracked text surface to be scanned or excluded (check-banned-claims.ts:772-776). Four new committed `.md` files will red it. *Recommend:* derive those exact paths from the generator's exported rel list, not four more hand-typed names. Move the pin to 15 and update the disposition comment at :811-823 in the same commit.
4. **One authority per rule.** No second launch-path list anywhere: docs tests, generator, install and uninstall all read `hostPointers` / `hostFootprint` / `LAUNCH_SHAPES`. Do not add a new `.ts` module. check-foundation-guards.test.ts:2205-2220 pins the tracked `.ts` module count (96).
5. **Pi silent failure modes (DOC-1, MSG-1).** Started from a subdirectory, Pi appends the literal string `.pi/grugops-orchestrator.md`, because `existsSync` fails against the process cwd. The flag also suppresses a user's own `APPEND_SYSTEM.md` for that session. Both belong in the install/README Pi section, with the source cited. The current sentence "The template is the only file it adds under `.pi/`" (install/README.md, Pi section) becomes false and must change.
6. **Template refusal applies to frontmatter too.** `templateProblem` (generate-host-entries.ts:121-135) checks only the body. Launch frontmatter is generator-typed data, so keep it free of `` !` ``, `@`, and `: ` inside values.
7. **Stale prose (DOC-1 sibling search):** README.md:63-66 (Start a session rows; Copilot "No command."), install/README.md "What the installer touches" (:389-470), the four "Using grugops on" sections (:696-813), §6 "Degraded — no `Agent` tool at all" (:1769-1776, which says Codex, Antigravity, OpenCode, Copilot and Pi have no spawn mechanism and that the kit "writes agent definitions to `.claude/agents/` alone"; this becomes false), agent-factory/packaging/adapters.md:39 ("no command is written") and :139-140, the comment headers in generate-host-entries.ts:4-8 and host-entries-freshness.ts:4-5 (which list three entries), and CHANGELOG `[Unreleased]` (:14). CLAUDE.md's per-tool table is a project file; update it only if the plan chooses to (note it as a sibling).
8. **Claim anchors.** The Start a session table (README.md:57-66) lies between the `C-28-006` and `C-28-007` blocks and is not anchored. Leave every `<!-- claim: -->` block byte-identical. `check-diff-disposition` was already red at base (52 findings). Record it and do not gate on it, as in quick 261018-0o7.
9. **Scratch installs need `GRUGOPS_HOME`.** Every manual install or uninstall run sets `GRUGOPS_HOME=<scratch>` (and `HOME`). Otherwise it overwrites the real `~/.grugops`.
10. **Never `npm test`:** it runs the live e2e lane. Use `npx vitest run --exclude '**/scripts/e2e/**'`. The 20 known base failures (stale `.planning/phases` paths, Node v26 `openAsBlobSync`) are the baseline. This machine runs Node v26.11.1.
11. **Committed `.js` freshness.** Each `.ts` edit needs `npm run build` and the rebuilt `.js` in the same commit, then `npm run check:build-parity` and `npm run typecheck`. Generated entries need `npm run generate:host-entries -- --overwrite-committed-host-entries`, then `npm run freshness:host-entries`.
12. **The Copilot file is also visible to Copilot's cloud agent and VS Code.** `target` unset means "both environments" [CITED: custom-agents-configuration]. That is acceptable, and the docs should say the file is shared.

## Recommended Task Split (≤3 tasks, sequential)

1. **Registry + generator + committed entries (TDD where the tests derive).** In host-tools.ts, add `LAUNCH_AGENT_NAME`, the four `*_REL` constants, the `launchAgent` field on all six rows, `hostPointers`, `hostFootprint`, and the new `invoke` texts. Rewire `entryOwners` and `routeCarriers`. Rewire `wholeFileEntryRels` in install-marker.ts. In the generator, add `LAUNCH_SHAPES` with the two-sided check, the empty-frontmatter render and an exported rendered-rel list, and update its header. Regenerate and commit the four files. Update generate-host-entries.test.ts, host-entries-freshness.test.ts, host-entries.test.ts and host-tools.test.ts (oracle and pins). Verify: build, typecheck, check:build-parity, freshness:host-entries, and the targeted vitest files.
2. **Install, uninstall and `--check` wiring + lifecycle tests.** Rewire install.ts (:1430/1442 label and noun, :1740, :2126, :7604) and uninstall.ts:2781. Then the tests: per-agent rows in uninstall-removal.test.ts (Codex↔Antigravity both directions; `--opencode`, `--copilot` and `--pi` each remove their launch file), a user's pre-existing file at each launch path (left untouched, not recorded, `skipped` line, survives uninstall), DRY_RUN `would-add`, a refresh of an unedited own copy, `--check` naming each launch file as a carrier, the derived `.pi` set in install.test.ts:10590, installer-write-set.test.ts:384/394, and installer-dry-run.test.ts FLOW10. Run a mutation proof for the ownership rule: put the Antigravity path in `ADAPTER_FOOTPRINT["agent-skill"]`, watch the Codex-while-Antigravity row go red, and record it. Verify: the targeted vitest files, then the full non-e2e suite.
3. **Docs + gates.** Update README.md Start a session (launch forms; the Copilot row is no longer "No command"), install/README.md (the touch list per agent, the four usage sections with dated sources, the Pi cwd and APPEND_SYSTEM caveats, the §6 "Degraded" paragraph, and the "What the installer deliberately does not write" Pi note), agent-factory/packaging/adapters.md, CHANGELOG `[Unreleased]` → Added, and the derived banned-claims exclusion with the pin 11→15. Run check-claim-anchors, check-banned-claims, check-public-docs-vocabulary, check-kit-refs, check-foundation-guards, check-nul-bytes, and host-entry-docs / host-tools-prose tests. Every live host claim stays `UNKNOWN - verify`.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | Copilot CLI honours `name`/`description` with no `tools` key (all tools) for a main-session `--agent` | Host formats | The agent loads without tools. Low risk: the documented default is all tools. |
| A2 | `agy --agent grugops-orchestrator` selects a workspace `.agents/agents/` agent | Host formats | The documented route is still the `/agents` panel. Keep the flag out of README, or mark it `UNKNOWN - verify`. |
| A3 | No other Pi loader reads loose `.pi/*.md` files (only `SYSTEM.md` and `APPEND_SYSTEM.md` were read in source) | Pi | If Pi auto-loaded the file, every session would become the Orchestrator, which D-02 forbids. The source read covers only the two discovery functions. |
| A4 | The opencode TUI accepts `--agent` despite the v2.0.28 help omission | OpenCode | The documented launch command may not work on v2. See Open Question 2. |

## Open Questions

1. **D-03 says "the D-32 backup rule applies" on re-install.** The code applies D-32 only to `.claude/` kit files. The comparable entries (`.opencode/commands/grugops.md`) use leave-if-edited, refresh-if-own-unedited, and no backup. *Recommendation:* use the existing whole-file rule (D-03's first sentence) and state in the plan that D-32 does not cover these files. Extending `--backup-edited-kit` to whole-file entries would be a new behaviour that needs a human decision.
2. **OpenCode `--agent` on the TUI.** The docs (retrieved 2026-10-18) list it for the default command. The installed v2.0.28 `opencode --help` omits it, while `opencode run` and `opencode mini` list it. Per the absent-evidence rule this proves nothing either way. *Recommendation:* print `opencode --agent grugops-orchestrator` with its docs citation and `UNKNOWN - verify`, and mention Tab switching as the in-session route.
3. **Antigravity `--agent`:** the flag exists in agy 1.3.5. Whether it resolves workspace custom agents could not be observed (`agy agent` printed nothing). *Recommendation:* lead with the `/agents` panel, and name `agy --agent grugops-orchestrator` as `UNKNOWN - verify`.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| node | build/tests | ✓ | v26.11.1 | — (the 20 known v26 baseline reds) |
| opencode | optional manual probe | ✓ | v2.0.28 | — |
| agy (Antigravity CLI) | optional manual probe | ✓ | 1.3.5 | — |
| pi | optional manual probe | ✓ | 1.1.0 | — |
| copilot | optional manual probe | ✗ | — | docs only, `UNKNOWN - verify` |

No live session run is needed or claimed. The probes above ran on discovery and help output only, with no model call.

## Validation Architecture

| Property | Value |
|---|---|
| Framework | vitest ~4.1.8 |
| Quick run | `npx vitest run install/host-tools.test.ts install/host-entries.test.ts install/uninstall-removal.test.ts scripts/generate-host-entries.test.ts scripts/host-entries-freshness.test.ts install/host-entry-docs.test.ts` |
| Full suite | `npx vitest run --exclude '**/scripts/e2e/**'` (never `npm test`) |
| Also | `npm run build && npm run check:build-parity && npm run typecheck && npm run freshness:host-entries` |

| Behaviour | Test | Exists? |
|---|---|---|
| Launch file owned by its host only (Codex↔Antigravity both directions) | uninstall-removal.test.ts per-agent block | extend |
| Each launch file written, recorded, removed; user file left untouched | host-entries.test.ts / install.test.ts lifecycle | extend |
| Generator renders 7 entries; LAUNCH_SHAPES ↔ registry two-sided | generate-host-entries.test.ts | extend |
| `--check` lists the launch files as carriers | host-tools.test.ts carrier oracle / kit-route.test.ts | extend |
| Usage sections name each launch path and invoke token | host-entry-docs.test.ts (derived) | switch to `hostPointers` |
| No `.pi/SYSTEM.md` / `APPEND_SYSTEM.md` written (D-02) | install.test.ts:10590 | rewrite as a derived guard |

## Security Domain

- **V5 input / V12 files:** output paths come from the registry only. The generator accepts no output argument (generate-host-entries.ts:20-22), and install writes with `wx` and never through a link, FIFO or device (`readForWrite`, DC-3). No install-time value reaches entry text (T-34-13): POINTER_LINE and the frontmatter are fixed literals.
- **Threat:** a committed launch file makes a host session run as the Orchestrator *only* when the user selects it. Nothing auto-selects it: OpenCode's default agent stays `build`, Pi needs the flag (D-02), and Copilot and Antigravity need `--agent` or a panel pick. Do not write a `default_agent` setting or any settings key, for the same reason given in install/README.md §6.

## Sources

- install/host-tools.ts, install/install.ts, install/uninstall.ts, install/install-marker.ts, scripts/generate-host-entries.ts, scripts/host-entries-freshness.ts, scripts/check-banned-claims.ts and the tests named above (read 2026-10-18)
- opencode.ai/docs/agents/, opencode.ai/docs/cli/ (retrieved 2026-10-18); local opencode v2.0.28 `--help` and `debug agents`
- docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli and docs.github.com/en/copilot/reference/custom-agents-configuration (retrieved 2026-10-18)
- antigravity.google/docs/subagents/, antigravity.google/docs/cli/using (retrieved 2026-10-18); local agy 1.3.5 `--help`
- github.com/earendil-works/pi `packages/coding-agent/docs/cli.md` and `src/core/resource-loader.ts` @ 482c1381 (2026-10-18); local pi 1.1.0 `--help`
- .planning/milestones/v2.1-phases/34.1-per-agent-installer/34.1-GAP-PLANNING-BRIEF.md (REC-1, MSG-1, DOC-1, CLEAN-1; §3 regression gate)

**Valid until:** 2026-11-01 (host CLIs move fast; re-check the four docs pages before release)
