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
  /**
   * The files this host reads to reach the Orchestrator. A host reads each of them whenever it is present: the one
   * conditional entry file (AGENTS.md read through a `.gemini/settings.json` merge) left with that merge and its
   * entry gate (phase 34.1, D-12).
   */
  readonly entryFiles: readonly string[];
  /** What the installer lays down for this host. */
  readonly adapter: HostAdapterKind;
  readonly dispatch: HostDispatch;
  /**
   * How a user starts grugops on this host, as the host's own documentation gives it (phase 34.1, D-21). Each row
   * names its source in a comment beside the value. Install's closing notes print it for every chosen agent
   * (install.ts agentClosingLines); grugops has not run it on a live host, and the notes say so (UNKNOWN - verify).
   */
  readonly invoke: string;
}

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
 * OPENCODE_CONFIG_REL (phase 34.1, D-14): the project config OpenCode reads at the repository root
 * (opencode.ai/docs/config/, retrieved 2026-10-11). Install merges the OpenCode external_directory rule into it (a
 * `permission.external_directory` allow rule for the kit root, recorded by the `opencode-permission` ledger kind,
 * install-marker.ts); ADAPTER_FOOTPRINT gives it to the `opencode-command` kind.
 */
export const OPENCODE_CONFIG_REL = "opencode.json";

/**
 * OPENCODE_RULE_SCOPE (phase 34.1, D-27): THE ONE SENTENCE for what the OpenCode `external_directory` rule install
 * writes allows. install.ts prints it beside every line that writes, finds or proposes the rule, and install/README.md
 * carries it word for word (opencode-permission.test.ts compares the two with whitespace collapsed).
 *
 * What it rests on: OpenCode asks before any tool call that touches a path outside the working directory unless a
 * `permission.external_directory` rule allows it (opencode.ai/docs/permissions/, retrieved 2026-10-11), so an allow
 * rule for the kit path covers every such tool call, edits included, not only reads. Whether OpenCode's separate
 * `edit` permission still asks before an edit on that path was not checked, so the sentence says `UNKNOWN - verify`;
 * the live OpenCode check is a human item (D-19).
 */
export const OPENCODE_RULE_SCOPE =
  "The rule allows every tool call OpenCode gates by `external_directory` on the kit path, edits included; " +
  "whether OpenCode's separate `edit` permission still asks before an edit there is `UNKNOWN - verify`.";

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
export const KIT_ROUTE =
  "After a scripted install the grugops kit is not in this repository: its root is the directory named by the `kitRoot` field of `.grugops/install.json`, and each `agent-factory/…` path is read under it, so `agent-factory/roles/orchestrator.md` is `<kitRoot>/roles/orchestrator.md`.";

/**
 * Whether `text` carries the kit route: true exactly when it contains KIT_ROUTE byte for byte. The one
 * predicate for "this carrier names the route" (D-26), so the doctor and the tests cannot disagree.
 */
export function carriesKitRoute(text: string): boolean {
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
export const HOST_TOOLS: readonly HostTool[] = [
  {
    id: "claude",
    name: "Claude Code",
    shortName: "Claude Code",
    detect: ".claude",
    entryFiles: ["CLAUDE.md", "AGENTS.md"],
    adapter: "claude-kit",
    dispatch: "spawn",
    // The standalone skill `.claude/skills/grugops/SKILL.md` gives the slash command `/grugops`
    // (code.claude.com/docs/en/skills).
    invoke: "type `/grugops <request>`",
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
    // Codex does not turn skills into slash commands: a skill is invoked by its name with `$`, or picked from the
    // `/skills` list (learn.chatgpt.com/docs/build-skills, retrieved 2026-10-11; D-21).
    invoke: "type `$grugops <request>`, or pick it from `/skills`",
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
    // A workspace skill is invoked as a slash command by its name (antigravity.google/docs/skills/, retrieved
    // 2026-10-11).
    invoke: "type `/grugops <request>`",
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
    // "The markdown file name becomes the command name" (opencode.ai/docs/commands/, retrieved 2026-10-11).
    invoke: "type `/grugops <request>`",
  },
  {
    id: "copilot",
    name: "GitHub Copilot CLI",
    shortName: "Copilot",
    // DETECT SIGNAL (phase 34.1, D-24): the Copilot instructions file, not the `.github` directory. A bare `.github`
    // exists in most GitHub repositories (workflows, issue templates), so it must not select Copilot for an unattended
    // install or pre-check it in the agent list.
    detect: ".github/copilot-instructions.md",
    entryFiles: ["AGENTS.md", ".github/copilot-instructions.md"],
    adapter: "copilot-pointer",
    dispatch: "sequential",
    // No command is written for this host: it reads `.github/copilot-instructions.md` together with its other
    // instruction files (docs.github.com, "Adding repository custom instructions for GitHub Copilot"). No live run
    // was made (D-19), so the text says `UNKNOWN - verify`.
    invoke: "no command is written; Copilot CLI reads `.github/copilot-instructions.md` with its other instructions, and a live run is `UNKNOWN - verify`",
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
    // A project prompt template `.pi/prompts/<name>.md` is the slash command `/<name>`, loaded from the directory Pi
    // starts in (34-RESEARCH.md § B, github.com/earendil-works/pi prompt-templates.md, retrieved 2026-10-06).
    invoke: "start Pi at the repository root and type `/grugops <request>`",
  },
];

/**
 * THE ONE AUTHORITY for the per-agent flag spelling (D-01): a new registry row gets its flag with no installer edit;
 * there is no all-agents flag. The flag is `--` followed by the row's id, so `--claude`, `--codex` and so on. Both
 * binaries and the test support read flags through this function and hostForFlag; nothing else spells one.
 */
export function agentFlag(host: HostTool): string {
  return "--" + host.id;
}

/**
 * The registry row an argument names as an agent flag, or null. Exact string equality against agentFlag of each
 * row: no prefix, no case folding, no `=value` form, so `--all`, `--`, `-codex` and `--Codex` are not agent flags and
 * stay unknown arguments (exit 2).
 */
export function hostForFlag(arg: string): HostTool | null {
  for (const host of HOST_TOOLS) {
    if (agentFlag(host) === arg) return host;
  }
  return null;
}

/** A path or value that is one POSIX shell word as it is: printed bare by shellWord. */
const SHELL_SAFE_WORD = /^[A-Za-z0-9_./,@%+=-]+$/;

/**
 * One POSIX shell word for `s` (T-34.1-28, T-34.1-45): `s` as it is when it is made only of SHELL_SAFE_WORD's
 * characters, otherwise single-quoted with each `'` written as `'\''`, so a path with a space or a shell character
 * stays one argument. The one quoting rule of a printed command: the target, the script path and the kit home all
 * pass through it.
 */
function shellWord(s: string): string {
  return SHELL_SAFE_WORD.test(s) ? s : "'" + s.split("'").join("'\\''") + "'";
}

/**
 * CommandContext (phase 34.1 gap round 2, D-33, review WR-19): how the run that prints a command was invoked, so the
 * command it prints runs the same way from any directory. `scriptDir` is the absolute directory of the running
 * script (install.js and uninstall.js sit side by side in it); `kitHome` is the kit home the run used, or null when
 * it is the default `~/.grugops`; `symlink` is whether the run was a symlink install.
 */
export interface CommandContext {
  readonly scriptDir: string;
  readonly kitHome: string | null;
  readonly symlink: boolean;
}

/**
 * The CommandContext of a run (D-33): `kitHome` is null when it equals `defaultKitHome`, and the value otherwise.
 * The callers spell both paths with user-file.ts canonicalPathSpelling, so the comparison is between two values in
 * the one spelling. Pure: no I/O.
 */
export function commandContext(scriptDir: string, kitHome: string, defaultKitHome: string, symlink = false): CommandContext {
  return { scriptDir, kitHome: kitHome === defaultKitHome ? null : kitHome, symlink };
}

/**
 * scriptCommand (D-33, WR-19): the invocation words of a printed command, before its arguments. For install.js:
 * `GRUGOPS_HOME=<kit home>` when the context's kit home is not the default, then `node`, then the absolute path of
 * install.js, then `--symlink` when the run was a symlink install. For uninstall.js: `node` and the absolute path of
 * uninstall.js only, whatever the context holds, because uninstall.js removes by the install record alone and never
 * reads or removes the kit (the kit home and install mode in its own COMMAND_CONTEXT word only the install commands
 * it prints), and it refuses `--symlink` as an unknown argument (exit 2).
 * The script path and the kit home pass through shellWord. Pure: no I/O.
 */
export function scriptCommand(binary: "install.js" | "uninstall.js", ctx: CommandContext): string {
  let dir = ctx.scriptDir;
  while (dir.length > 1 && dir.endsWith("/")) dir = dir.slice(0, -1);
  const script = shellWord(dir + "/" + binary);
  if (binary === "uninstall.js") return ["node", script].join(" ");
  const env = ctx.kitHome === null ? [] : ["GRUGOPS_HOME=" + shellWord(ctx.kitHome)];
  return [...env, "node", script, ...(ctx.symlink ? ["--symlink"] : [])].join(" ");
}

/** The install.js modes a printed command may carry after its agent flags (D-33). */
export type CommandMode = "--check" | "--migrate" | "--prune-old-kit";

/**
 * agentCommand (phase 34.1, D-26, D-33; brief MSG-1, §2.2): THE ONE BUILDER of a printed command that names agents.
 * With a context it returns scriptCommand(binary, ctx) (so the script is printed by its absolute path and the command
 * runs from any directory), then `--target <target>`, then agentFlag(h) for each host in the order given, then each
 * mode. An install command carries `GRUGOPS_HOME=<dir>` when the run used a kit home other than the default and
 * `--symlink` when the run was a symlink install, so a command run as printed uses the kit and the mode the run used
 * and never writes a second kit into `~/.grugops` (WR-19). An uninstall command carries neither, because uninstall.js
 * reads neither. The flag spelling is agentFlag's and nothing else spells one into a remedy. No hosts gives no flag:
 * the flag-less form, which on uninstall removes every agent (D-05), so a caller passes [] only when that is what it
 * means. The target is one shell word (shellWord).
 *
 * It throws an Error naming the combination for a command install.js or uninstall.js would refuse: an agent flag with
 * `--check` or `--prune-old-kit` (exit 2 under D-25), or any mode on an uninstall.js command.
 *
 * TRANSITIONAL (plans 34.1-22 and 34.1-23): with no context it returns the earlier words, `node install/<binary>
 * --target <target> <flags>`, which run only from the checkout root with the default kit home. Plan 34.1-24 makes the
 * context required and removes this form. Pure: no I/O.
 */
export function agentCommand(
  binary: "install.js" | "uninstall.js",
  target: string,
  hosts: readonly HostTool[],
  ctx?: CommandContext,
  modes: readonly CommandMode[] = [],
): string {
  if (binary === "uninstall.js" && modes.length > 0) {
    throw new Error(`agentCommand: ${binary} takes no mode (${modes.join(" ")})`);
  }
  const agentless = modes.filter((m) => m === "--check" || m === "--prune-old-kit");
  if (hosts.length > 0 && agentless.length > 0) {
    throw new Error(`agentCommand: agent flags (${hosts.map(agentFlag).join(" ")}) cannot be combined with ${agentless.join(" ")}`);
  }
  const head = ctx === undefined ? "node install/" + binary : scriptCommand(binary, ctx);
  return [head, "--target", shellWord(target), ...hosts.map(agentFlag), ...modes].join(" ");
}

/**
 * ROUTE_POINTERS (plan 34-28, D-26 point 3): the pointer files install writes for each adapter kind that
 * carry the start-here sentence and KIT_ROUTE, as POSIX paths relative to the target root. Keyed by
 * HostAdapterKind, so a new kind is a compile error until it is classified here. Two kinds may name the same
 * pointer: two rows on `agent-skill` share AGENT_SKILL_REL (D-20). (Phase 34.1 deleted the kind `none`, once Codex
 * CLI and OpenCode got entries of their own, and the kind `gemini-settings`, with the Gemini merge, D-12.)
 */
export const ROUTE_POINTERS: Readonly<Record<HostAdapterKind, readonly string[]>> = {
  "claude-kit": ["CLAUDE.md"],
  "copilot-pointer": [".github/copilot-instructions.md"],
  "pi-prompt-template": [PI_PROMPT_REL],
  "agent-skill": [AGENT_SKILL_REL],
  "opencode-command": [OPENCODE_COMMAND_REL],
};

/**
 * ADAPTER_FOOTPRINT (phase 34.1, D-05, D-06, D-20): the target paths each adapter kind writes, as POSIX paths relative
 * to the target root. A path ending in "/" is a prefix: every path under it belongs to the kind (Claude Code's
 * `.claude/` covers its skills, its adapters and the ask rules in `.claude/settings.json`). Keyed by HostAdapterKind,
 * so a new kind is a compile error until its footprint is written here. Every ROUTE_POINTERS value of a kind is in its
 * footprint (asserted by install/host-tools.test.ts). `opencode.json` is OpenCode's permission merge (D-14).
 *
 * A path no kind claims is the SHARED footprint of D-06: the kit's AGENTS.md copy, `tools/grugops/`, the install marker
 * under `.grugops/`, and an earlier install's `.gemini/settings.json` change (D-23). Per-agent uninstall never removes
 * a shared path; only a flag-less uninstall, or the removal of the last installed agent, does (D-05).
 *
 * This answers which agent a path belongs to, never whether install wrote it or whether it still holds what install
 * wrote: the install ledger and install-marker.ts owns answer those, and uninstall asks them before every reversal.
 */
export const ADAPTER_FOOTPRINT: Readonly<Record<HostAdapterKind, readonly string[]>> = {
  "claude-kit": [".claude/", "CLAUDE.md"],
  "copilot-pointer": [".github/copilot-instructions.md"],
  "pi-prompt-template": [PI_PROMPT_REL],
  "agent-skill": [AGENT_SKILL_REL],
  "opencode-command": [OPENCODE_COMMAND_REL, OPENCODE_CONFIG_REL],
};

/**
 * entryOwners (phase 34.1, D-05, D-20): THE ONE ANSWER to "which agents own this install-ledger entry". The ids, in
 * registry order, of the HOST_TOOLS rows whose adapter kind's ADAPTER_FOOTPRINT holds a path p such that p equals
 * entry.path, or p ends in "/" and entry.path starts with p, or entry.kind is "dir" and p starts with entry.path + "/"
 * (a directory on the way to the agent's file). Two rows on one kind both own its paths (Codex CLI and Antigravity CLI
 * share AGENT_SKILL_REL), so a file two agents share stays while either is installed. `[]` for a shared path.
 * Pure: it reads the entry's path and kind only, never the disk.
 */
export function entryOwners(entry: { readonly path: string; readonly kind: string }): readonly string[] {
  const owned = (p: string): boolean =>
    p === entry.path || (p.endsWith("/") && entry.path.startsWith(p)) || (entry.kind === "dir" && p.startsWith(entry.path + "/"));
  return HOST_TOOLS.filter((h) => ADAPTER_FOOTPRINT[h.adapter].some(owned)).map((h) => h.id);
}

/**
 * routeCarriers (plan 34-28, D-26 point 3): THE ONE DERIVATION of the files through which `host` can reach
 * the kit route: its entryFiles, then ROUTE_POINTERS[host.adapter], without duplicates, in that order.
 * Install's notes for a user's carrier without the route and `--check`'s per-host route findings both
 * derive from it, so the two cannot disagree about which hosts a carrier serves. A host reads every one of these
 * carriers that is present (phase 34.1, D-12 deleted the one entry gate); install.ts hostReadsCarrier is the one
 * owner of that answer, and every verdict site asks it.
 */
export function routeCarriers(host: HostTool): readonly string[] {
  return [...new Set([...host.entryFiles, ...ROUTE_POINTERS[host.adapter]])];
}

/**
 * RouteFacts (plan 34-33, D-27 point 2): what one run found, as the inputs of reachVia and strandedBy. Each caller
 * builds them from its own reads, and none of them does I/O here:
 *   reads(host, rel):     whether `host` reads carrier `rel` (install.ts hostReadsCarrier: `rel` is one of the
 *                         host's routeCarriers);
 *   holds(rel):           whether `rel` is a readable regular file whose whole text carries KIT_ROUTE;
 *   adapterReaches(host): whether the host has an adapter route of its own (Claude Code's adapters' KIT= line
 *                         names a real kit).
 */
export interface RouteFacts {
  reads(host: HostTool, rel: string): boolean;
  holds(rel: string): boolean;
  adapterReaches(host: HostTool): boolean;
}

/**
 * reachVia (plan 34-33, D-27 point 2): how `host` has the kit route here: the routeCarriers(host) entries it reads
 * and that hold the route, in routeCarriers order, and whether its adapter reaches. Whether the route itself
 * resolves (the marker's kitRoot leads to a readable roles/orchestrator.md) is a separate question and a separate
 * FAIL; the doctor's reach line asks it beside this.
 */
export function reachVia(host: HostTool, facts: RouteFacts): { readonly carriers: readonly string[]; readonly adapter: boolean } {
  return {
    carriers: routeCarriers(host).filter((rel) => facts.reads(host, rel) && facts.holds(rel)),
    adapter: facts.adapterReaches(host),
  };
}

/**
 * strandedBy (plan 34-33; the host set, phase 34.1 D-07): THE ONE DERIVATION of the hosts a carrier leaves without a
 * route (D-27 point 2), among the agents installed in the target. The doctor and install both ask it; the route
 * target's resolution is a separate FAIL and is not an input here. `hosts` is REQUIRED: the caller's installed set
 * (the doctor's from install-marker.ts installedAgents, or the agents detected when nothing is recorded; install's
 * from the agents installed after its run), so an agent nobody installed here is never named as stranded.
 * `[]` when `rel` holds the route. Otherwise the HOST_TOOLS rows in `hosts`, in registry order whatever order `hosts`
 * is in, that read `rel` here (it is one of their routeCarriers and facts.reads answers yes), read no carrier that
 * holds the route (reachVia's carriers are empty), and have no adapter route. A carrier for which this is empty is
 * never counted.
 */
export function strandedBy(rel: string, facts: RouteFacts, hosts: readonly HostTool[]): readonly HostTool[] {
  if (facts.holds(rel)) return [];
  return HOST_TOOLS.filter((h) => {
    if (!hosts.includes(h)) return false;
    if (!routeCarriers(h).includes(rel) || !facts.reads(h, rel)) return false;
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
