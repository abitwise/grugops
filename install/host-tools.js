// host-tools.ts — the one registry of the host coding-agent CLIs grugops supports (phase 34, D-11).
//
// WHAT THIS OWNS. The supported host set, and for each host: its id, its display name (the bold
// first cell every per-host table uses), the short name prose uses, the target-root path whose
// presence means the host is in use, the files the host reads to reach the Orchestrator, the
// adapter kind the installer lays down for it, and how it dispatches roles. Every consumer that
// enumerates hosts derives its list from HOST_TOOLS: installer detection (install.ts detectTools()
// and the closing host line), and, in later plans of phase 34, the asymmetric-table oracle, the
// validator, the doc-table checks and the prose count-word scan. A host missing from one consumer,
// or a stale count anywhere, then fails red instead of drifting silently (set-literal drift is a
// known failure class in this repository).
//
// A NEW HOST IS ADDED HERE FIRST, as one row, in the same commit that moves HOST_TOOL_COUNT.
//
// IMPORT EDGES. This module is pure data and imports nothing: no node:fs (the installer fs census
// scans every install/*.ts) and nothing from scripts/ (install/ never imports scripts/, 33.1
// D-18/D-28). The reverse edge is allowed and deliberate: a scripts/*.ts module may import
// ../install/host-tools.js to read the registry (34-RESEARCH.md assumption A5).
//
// DETECTION. Every `detect` value is a POSIX path relative to the TARGET repository root. Detection
// never consults a user-level location (for example a home-directory config dir); a host that is
// configured only for the user and not in this repository is not reported, the same rule for every
// row.
/**
 * The closed set of adapter kinds the installer can lay down for a host. Every row's `adapter` is a
 * member, and every member is used by at least one row (asserted by install/host-tools.test.ts).
 */
export const HOST_ADAPTER_KINDS = [
    "claude-kit",
    "copilot-pointer",
    "pi-prompt-template",
    "agent-skill",
    "opencode-command",
];
/**
 * The Pi prompt template the installer writes (D-16): Pi turns `.pi/prompts/<name>.md` into the
 * slash command `/<name>`, so this file yields `/grugops`, the one command spelling across hosts.
 * Every later consumer imports this constant rather than spelling the path again.
 */
export const PI_PROMPT_REL = ".pi/prompts/grugops.md";
/**
 * AGENT_SKILL_REL (phase 34.1, D-08 as amended by D-20): the one project-level skill path Codex CLI and Antigravity
 * CLI both read. Codex CLI loads repository skills from `.agents/skills/` (learn.chatgpt.com/docs/build-skills,
 * retrieved 2026-10-11) and Antigravity CLI loads workspace skills from `<workspace-root>/.agents/skills/`
 * (antigravity.google/docs/skills/, retrieved 2026-10-11). Antigravity's migration page moves Gemini CLI's
 * `.gemini/skills/` to `.agents/skills/` (antigravity.google/docs/cli/gcli-migration/, retrieved 2026-10-11), so
 * `.gemini/skills/` is refuted as an entry path and is never written. The file is a whole-file entry rendered by
 * scripts/generate-host-entries.ts and copied by install from the kit source; every consumer imports this constant
 * rather than spelling the path again.
 */
export const AGENT_SKILL_REL = ".agents/skills/grugops/SKILL.md";
/**
 * OPENCODE_COMMAND_REL (phase 34.1, D-08): the project command file OpenCode reads. OpenCode loads project commands
 * from `.opencode/commands/`, and "the markdown file name becomes the command name" (opencode.ai/docs/commands/,
 * retrieved 2026-10-11), so this file gives `/grugops`. A whole-file entry rendered by
 * scripts/generate-host-entries.ts and copied by install from the kit source.
 */
export const OPENCODE_COMMAND_REL = ".opencode/commands/grugops.md";
/**
 * KIT_ROUTE (phase 34, D-26, the marker route): THE ONE AUTHORITY for the sentence that tells a host
 * with no Claude Code adapter where the grugops kit is after a scripted install. A scripted install
 * puts the kit in a separate kit home, never in the target, and writes the kit root into the
 * `kitRoot` field of `.grugops/install.json` on every install (install.ts writeMarker). The route
 * names that field; it never names the path itself.
 *
 * Carried VERBATIM, after the start-here sentence, by the pointers install writes (POINTER_LINE below: the
 * Copilot block and every whole-file entry scripts/generate-host-entries.ts renders) and by the kit's
 * AGENTS.md "Kit vs state" rule. It is
 * fixed literal text, the same on every machine: no config, argv, environment or other install-time
 * value reaches instruction text through it (T-34-13), and it names no kit-home environment variable
 * (check-kit-refs Assertion 3). A pointer that drops it is found by carriesKitRoute below, which the
 * doctor (`--check`) asks of each route carrier.
 */
export const KIT_ROUTE = "After a scripted install the grugops kit is not in this repository: its root is the directory named by the `kitRoot` field of `.grugops/install.json`, and each `agent-factory/…` path is read under it, so `agent-factory/roles/orchestrator.md` is `<kitRoot>/roles/orchestrator.md`.";
/**
 * Whether `text` carries the kit route: true exactly when it contains KIT_ROUTE byte for byte. The one
 * predicate for "this carrier names the route" (D-26), so the doctor and the tests cannot disagree.
 */
export function carriesKitRoute(text) {
    return text.includes(KIT_ROUTE);
}
/**
 * START_HERE_SENTENCE (phase 34.1, D-09): the start-here sentence every non-Claude entry and the Copilot block open
 * with. Fixed literal text: no install-time value reaches it (T-34-13).
 */
export const START_HERE_SENTENCE = "grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.";
/**
 * POINTER_LINE (phase 34.1, D-09, D-11): THE ONE AUTHORITY for the pointer line every non-Claude entry and the Copilot
 * block carry (D-09, T-34-13): START_HERE_SENTENCE, one space, then KIT_ROUTE, on one line. The kit's pointer
 * template (agent-factory/packaging/host-entry.pointer.md) must equal it byte for byte, which
 * scripts/generate-host-entries.ts asserts before it renders anything, and install's Copilot block is this line.
 */
export const POINTER_LINE = START_HERE_SENTENCE + " " + KIT_ROUTE;
/**
 * The supported hosts, in the order installer detection reports them. The order of the existing
 * rows is load-bearing: it keeps the `tools detected:` line byte-identical to the hand-written
 * detection it replaced.
 */
export const HOST_TOOLS = [
    {
        id: "claude",
        name: "Claude Code",
        shortName: "Claude Code",
        detect: ".claude",
        entryFiles: ["CLAUDE.md", "AGENTS.md"],
        adapter: "claude-kit",
        dispatch: "spawn",
    },
    {
        id: "codex",
        name: "Codex CLI",
        shortName: "Codex",
        detect: ".codex",
        entryFiles: ["AGENTS.md"],
        // Codex CLI reads the agent skill at AGENT_SKILL_REL (phase 34.1, D-08); users invoke it as `$grugops` (or pick it
        // from `/skills`): Codex does not turn skills into slash commands (D-21).
        adapter: "agent-skill",
        dispatch: "sequential",
    },
    {
        // Antigravity CLI (phase 34.1, D-12; it replaces the discontinued Gemini CLI row). It reads AGENTS.md and GEMINI.md
        // natively (antigravity.google/docs/rules/ and antigravity.google/docs/cli/gcli-migration/, retrieved 2026-10-11)
        // and loads workspace skills from `.agents/skills/` (antigravity.google/docs/skills/, retrieved 2026-10-11), so it
        // shares the agent skill at AGENT_SKILL_REL with Codex CLI ("two rows, one entry", D-20). Install never reads or
        // writes `.gemini/settings.json` and never writes `.gemini/skills/`.
        // DETECT SIGNAL: `.gemini` is UNKNOWN - verify (D-13, D-22). It is the old Gemini CLI signal; no project-level
        // `.gemini/` use by Antigravity CLI was found in its docs. `.agents/` is Antigravity's documented project
        // directory, but it is not a detect signal: Codex CLI, GitHub Copilot CLI, OpenCode and Pi read it too, and
        // grugops itself creates it.
        id: "antigravity",
        name: "Antigravity CLI",
        shortName: "Antigravity",
        detect: ".gemini",
        entryFiles: ["AGENTS.md"],
        adapter: "agent-skill",
        dispatch: "sequential",
    },
    {
        id: "opencode",
        name: "OpenCode",
        shortName: "OpenCode",
        detect: "opencode.json",
        entryFiles: ["AGENTS.md"],
        // OpenCode reads the command at OPENCODE_COMMAND_REL (phase 34.1, D-08): `/grugops <request>`.
        adapter: "opencode-command",
        dispatch: "sequential",
    },
    {
        id: "copilot",
        name: "GitHub Copilot CLI",
        shortName: "Copilot",
        detect: ".github",
        entryFiles: ["AGENTS.md", ".github/copilot-instructions.md"],
        adapter: "copilot-pointer",
        dispatch: "sequential",
    },
    // Pi (34-RESEARCH.md §B): reads one context file per directory and prefers AGENTS.md over
    // CLAUDE.md; loads project prompt templates from <cwd>/.pi/prompts/; ships no sub-agents, so it
    // dispatches sequentially. Detected by a `.pi` entry in the target root, like the rows above.
    {
        id: "pi",
        name: "Pi",
        shortName: "Pi",
        detect: ".pi",
        entryFiles: ["AGENTS.md"],
        adapter: "pi-prompt-template",
        dispatch: "sequential",
    },
];
/**
 * THE ONE AUTHORITY for the per-agent flag spelling (D-01): a new registry row gets its flag with no installer edit;
 * there is no all-agents flag. The flag is `--` followed by the row's id, so `--claude`, `--codex` and so on. Both
 * binaries and the test support read flags through this function and hostForFlag; nothing else spells one.
 */
export function agentFlag(host) {
    return "--" + host.id;
}
/**
 * The registry row an argument names as an agent flag, or null. Exact string equality against agentFlag of each
 * row: no prefix, no case folding, no `=value` form, so `--all`, `--`, `-codex` and `--Codex` are not agent flags and
 * stay unknown arguments (exit 2).
 */
export function hostForFlag(arg) {
    for (const host of HOST_TOOLS) {
        if (agentFlag(host) === arg)
            return host;
    }
    return null;
}
/**
 * ROUTE_POINTERS (plan 34-28, D-26 point 3): the pointer files install writes for each adapter kind that
 * carry the start-here sentence and KIT_ROUTE, as POSIX paths relative to the target root. Keyed by
 * HostAdapterKind, so a new kind is a compile error until it is classified here. Two kinds may name the same
 * pointer: two rows on `agent-skill` share AGENT_SKILL_REL (D-20). (Phase 34.1 deleted the kind `none`, once Codex
 * CLI and OpenCode got entries of their own, and the kind `gemini-settings`, with the Gemini merge, D-12.)
 */
export const ROUTE_POINTERS = {
    "claude-kit": ["CLAUDE.md"],
    "copilot-pointer": [".github/copilot-instructions.md"],
    "pi-prompt-template": [PI_PROMPT_REL],
    "agent-skill": [AGENT_SKILL_REL],
    "opencode-command": [OPENCODE_COMMAND_REL],
};
/**
 * routeCarriers (plan 34-28, D-26 point 3): THE ONE DERIVATION of the files through which `host` can reach
 * the kit route: its entryFiles, then ROUTE_POINTERS[host.adapter], without duplicates, in that order.
 * Install's notes for a user's carrier without the route and `--check`'s per-host route findings both
 * derive from it, so the two cannot disagree about which hosts a carrier serves. A host reads every one of these
 * carriers that is present (phase 34.1, D-12 deleted the one entry gate); install.ts hostReadsCarrier is the one
 * owner of that answer, and every verdict site asks it.
 */
export function routeCarriers(host) {
    return [...new Set([...host.entryFiles, ...ROUTE_POINTERS[host.adapter]])];
}
/**
 * reachVia (plan 34-33, D-27 point 2): how `host` has the kit route here: the routeCarriers(host) entries it reads
 * and that hold the route, in routeCarriers order, and whether its adapter reaches. Whether the route itself
 * resolves (the marker's kitRoot leads to a readable roles/orchestrator.md) is a separate question and a separate
 * FAIL; the doctor's reach line asks it beside this.
 */
export function reachVia(host, facts) {
    return {
        carriers: routeCarriers(host).filter((rel) => facts.reads(host, rel) && facts.holds(rel)),
        adapter: facts.adapterReaches(host),
    };
}
/**
 * strandedBy (plan 34-33): THE ONE DERIVATION of the hosts a carrier leaves without a route (D-27 point 2). The
 * doctor and install both ask it; the route target's resolution is a separate FAIL and is not an input here.
 * `[]` when `rel` holds the route. Otherwise the HOST_TOOLS rows, in registry order, that read `rel` here (it is
 * one of their routeCarriers and facts.reads answers yes), read no carrier that holds the route (reachVia's
 * carriers are empty), and have no adapter route. A carrier for which this is empty is never counted.
 */
export function strandedBy(rel, facts) {
    if (facts.holds(rel))
        return [];
    return HOST_TOOLS.filter((h) => {
        if (!routeCarriers(h).includes(rel) || !facts.reads(h, rel))
            return false;
        const via = reachVia(h, facts);
        return via.carriers.length === 0 && !via.adapter;
    });
}
/**
 * A pinned integer, not a derivation: install/host-tools.test.ts asserts it equals
 * HOST_TOOLS.length in both directions, so a row added or removed without moving this pin fails
 * red. It moves only in the commit that adds or removes a registry row.
 */
export const HOST_TOOL_COUNT = 6;
