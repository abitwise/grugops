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
] as const;

/** One adapter kind, derived from the tuple above so the two cannot disagree. */
export type HostAdapterKind = (typeof HOST_ADAPTER_KINDS)[number];

/**
 * How a host runs the factory's roles: `spawn` means the host starts each role as its own agent
 * (Claude Code subagents); `sequential` means the Orchestrator loads each role file into its own
 * context in turn (the portable baseline).
 */
export type HostDispatch = "spawn" | "sequential";

export interface HostTool {
  /** The token installer output uses (`tools detected: <id> ...`). */
  readonly id: string;
  /** The display name: the bold first cell of every per-host table row. */
  readonly name: string;
  /** The word prose uses for this host. */
  readonly shortName: string;
  /** A POSIX path relative to the target root; its presence means the host is in use there. */
  readonly detect: string;
  /** The files this host reads to reach the Orchestrator. */
  readonly entryFiles: readonly string[];
  /** What the installer lays down for this host. */
  readonly adapter: HostAdapterKind;
  readonly dispatch: HostDispatch;
}

/**
 * The Pi prompt template the installer writes (D-16): Pi turns `.pi/prompts/<name>.md` into the
 * slash command `/<name>`, so this file yields `/grugops`, the one command spelling across hosts.
 * Every later consumer imports this constant rather than spelling the path again.
 */
export const PI_PROMPT_REL = ".pi/prompts/grugops.md";

/**
 * The supported hosts, in the order installer detection reports them. The order of the existing
 * rows is load-bearing: it keeps the `tools detected:` line byte-identical to the hand-written
 * detection it replaced.
 */
export const HOST_TOOLS: readonly HostTool[] = [
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
 * A pinned integer, not a derivation: install/host-tools.test.ts asserts it equals
 * HOST_TOOLS.length in both directions, so a row added or removed without moving this pin fails
 * red. It moves only in the commit that adds or removes a registry row.
 */
export const HOST_TOOL_COUNT = 6;
