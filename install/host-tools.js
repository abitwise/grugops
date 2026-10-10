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
    "none",
    "gemini-settings",
    "copilot-pointer",
    "pi-prompt-template",
];
/**
 * The Pi prompt template the installer writes (D-16): Pi turns `.pi/prompts/<name>.md` into the
 * slash command `/<name>`, so this file yields `/grugops`, the one command spelling across hosts.
 * Every later consumer imports this constant rather than spelling the path again.
 */
export const PI_PROMPT_REL = ".pi/prompts/grugops.md";
/**
 * KIT_ROUTE (phase 34, D-26, the marker route): THE ONE AUTHORITY for the sentence that tells a host
 * with no Claude Code adapter where the grugops kit is after a scripted install. A scripted install
 * puts the kit in a separate kit home, never in the target, and writes the kit root into the
 * `kitRoot` field of `.grugops/install.json` on every install (install.ts writeMarker). The route
 * names that field; it never names the path itself.
 *
 * Carried VERBATIM, after the start-here sentence, by the pointers install writes (the Copilot pointer
 * and the Pi prompt template, which reuses it) and by the kit's AGENTS.md "Kit vs state" rule. It is
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
        adapter: "none",
        dispatch: "sequential",
    },
    {
        id: "gemini",
        name: "Gemini CLI",
        shortName: "Gemini",
        detect: ".gemini",
        entryFiles: ["AGENTS.md"],
        adapter: "gemini-settings",
        dispatch: "sequential",
    },
    {
        id: "opencode",
        name: "OpenCode",
        shortName: "OpenCode",
        detect: "opencode.json",
        entryFiles: ["AGENTS.md"],
        adapter: "none",
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
 * ROUTE_POINTERS (plan 34-28, D-26 point 3): the pointer files install writes for each adapter kind that
 * carry the start-here sentence and KIT_ROUTE, as POSIX paths relative to the target root. Keyed by
 * HostAdapterKind, so a new kind is a compile error until it is classified here. A kind that writes no
 * pointer (`gemini-settings` only adds AGENTS.md to Gemini's context.fileName; `none` writes nothing) has
 * none: its hosts reach the route through their entry files alone.
 */
export const ROUTE_POINTERS = {
    "claude-kit": ["CLAUDE.md"],
    none: [],
    "gemini-settings": [],
    "copilot-pointer": [".github/copilot-instructions.md"],
    "pi-prompt-template": [PI_PROMPT_REL],
};
/**
 * routeCarriers (plan 34-28, D-26 point 3): THE ONE DERIVATION of the files through which `host` can reach
 * the kit route: its entryFiles, then ROUTE_POINTERS[host.adapter], without duplicates, in that order.
 * Install's notes for a user's carrier without the route and `--check`'s per-host route findings both
 * derive from it, so the two cannot disagree about which hosts a carrier serves.
 */
export function routeCarriers(host) {
    return [...new Set([...host.entryFiles, ...ROUTE_POINTERS[host.adapter]])];
}
/**
 * hostsReading (plan 34-28, D-26 point 3): the registry hosts whose route carriers (routeCarriers) include
 * `rel`, in registry order. The one answer install and `--check` use to name the hosts a carrier serves.
 */
export function hostsReading(rel) {
    return HOST_TOOLS.filter((h) => routeCarriers(h).includes(rel));
}
/**
 * A pinned integer, not a derivation: install/host-tools.test.ts asserts it equals
 * HOST_TOOLS.length in both directions, so a row added or removed without moving this pin fails
 * red. It moves only in the commit that adds or removes a registry row.
 */
export const HOST_TOOL_COUNT = 6;
