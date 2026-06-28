// admission-server.ts — grugops structured admission channel (Plan 25-09, D-01 point-of-effect move).
//
// A zero-dependency Node 22 stdio MCP server exposing ONE tool, propose_note (full name
// mcp__grugops__propose_note). A role agent on Claude Code admits a verified context note by calling
// this STRUCTURED tool: the harness delivers the note's fields as final JSON arguments, with NO shell
// expansion. There is no agent-authored command string to obfuscate, so the entire shell-expansion
// bypass family (glob / brace / param-and-command substitution / word-split / extglob fragmentation /
// line-continuation / launcher-rename) disappears BY CONSTRUCTION — not by recognizing more spellings,
// but because the proxy the spellings attacked (a parsed Bash string) is gone.
//
// THE SERVER IS NOT THE GATE. Two facts (RESEARCH round 6) make this load-bearing:
//   1. The un-forgeable Claude Code gate is the PER-CALL PreToolUse hook on mcp__grugops__.* (Plan
//      25-10), which runs FRESH per call and reads the CURRENT human-set session env. An MCP server's
//      process.env is FROZEN at launch and cannot see a mid-session export, so the GATE must live in the
//      per-call hook, NOT in this server: only the per-call re-read lets a mid-session set/unset of the
//      grant take effect. The grant is honestly scoped as SESSION-SCOPED and per-note CAPABLE (D-07,
//      GAP-R6-3): a standing grant authorizes high-severity admissions under that name until unset — it
//      is not a mechanically-enforced per-note nonce, and the GOV-02 disposed_by accordingly means
//      "admitted under <name>'s session grant," not "individually reviewed each entry." So this server
//      reads NO approval env; it only forwards the structured args.
//   2. The single sanctioned writer stays context-io.appendNote. This server forks NO writer and parses
//      NO shell string: it builds a NoteInput from the structured args and calls
//      context-io.admitAndAppend, which decides admission then persists ONLY via appendNote.
//
// Session-grant disposition (D-07, conservative CC-only un-forgeability claim, honestly scoped): a human
// grants a high-severity disposition by exporting GRUGOPS_ADMISSION_APPROVED_BY=<name> in the launching
// shell; the per-call 25-10 hook validates the agent-supplied verified_by: human:<name> stamp against
// that FRESH env on every call, un-forgeably. The grant is session-scoped and per-note capable (the
// human controls granularity by setting/unsetting around a disposition), not a per-note nonce. The four
// non-CC CLIs degrade to the weaker self-settable D-05 tier (admitAndAppend's stamp check) and are NOT
// claimed un-forgeable. This server is the structured channel; the hook is the gate.
//
// Build model (D-13): node: stdlib ONLY — ZERO host runtime deps. Authored in TypeScript, compiled with
// tsc to a committed scripts/admission-server.js the host runs with bare Node; the freshness gate
// (OUTPUT_DIRS includes scripts/) proves the committed .js is a faithful build of this .ts.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — governance/safety surface, never
// caveman voice).
//
// MCP transport: newline-delimited JSON-RPC 2.0 over stdin/stdout (the MCP stdio transport). The minimal
// handshake implemented: initialize, notifications/initialized, tools/list, tools/call, ping.
import { createInterface } from "node:readline";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { admitAndAppend, NOTE_KINDS, } from "./context-io.js";
// The MCP server name. The full tool name a hook/agent sees is mcp__<server>__<tool>, so this name must
// match the mcpServers key in .claude-plugin/plugin.json → mcp__grugops__propose_note.
export const SERVER_NAME = "grugops";
const SERVER_VERSION = "0.1.0";
// The MCP protocol version we implement; we mirror a client's requested version when it sends one.
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";
// ── The ONE tool: propose_note. Its structured parameters ARE the note's provenance fields. ──────────
export const PROPOSE_NOTE_TOOL = {
    name: "propose_note",
    description: "Admit a verified context note through the grugops governance gate and persist it via the single " +
        "sanctioned writer (context-io.appendNote). The note's fields are STRUCTURED arguments — there is " +
        "no shell command string. A gated entry (a high-severity finding under an active human_admission " +
        "dial, or any finding under dial=all) requires a human:NAME disposition stamp in verified_by; on " +
        "Claude Code the per-call admission hook validates that stamp against the human-set session env. A " +
        "non-gated note must not carry a human:NAME stamp. On refusal nothing is written and the fault is " +
        "named.",
    inputSchema: {
        type: "object",
        properties: {
            task: {
                type: "string",
                description: "The task slug the note is filed under (^[A-Za-z0-9._-]+$).",
            },
            kind: {
                type: "string",
                enum: [...NOTE_KINDS],
                description: "One of the six note kinds. Only a finding is ever gated; soft kinds need no stamp.",
            },
            by: {
                type: "string",
                description: "The authoring role. Severity is derived from this (security-nfr / architect-design / " +
                    "release-manager are high-severity, D-06).",
            },
            at: { type: "string", description: "ISO-8601 timestamp — the authoritative replay sort key." },
            verified_by: {
                type: "string",
                description: "Empty, a §14-gate#<id> stamp (gate-verified), or a human:NAME stamp (a human disposition " +
                    "on a gated entry). A human:NAME stamp on a non-gated note is rejected (W3).",
            },
            confidence: { type: "string", description: "high | medium | low | UNKNOWN - verify." },
            refs: {
                type: "array",
                items: { type: "string" },
                description: "Requirement ids, file paths, ticket or gate refs.",
            },
            supersedes: {
                type: ["string", "null"],
                description: "A note id this note overrides, or null.",
            },
            body: { type: "string", description: "The markdown body of the note." },
        },
        required: ["task", "kind", "by", "at", "confidence", "body"],
    },
};
// ── The TRUSTED governance/persist root (GAP-R6-2, Plan 25-12). ──────────────────────────────────
// The dial / ledger root / context root MUST come from the SAME trusted source the per-call
// admission-guard hook reads (process.env.CLAUDE_PROJECT_DIR), NOT from agent-supplied tool args. An
// MCP server's process.env is launch-frozen, but the harness keeps CLAUDE_PROJECT_DIR stable per
// session, so the hook tier and this persist tier resolve the IDENTICAL root and cannot diverge. When
// CLAUDE_PROJECT_DIR is unset the fallback is the server's OWN resolved repo root (join(dirname, ".."))
// — equal to context-io's ROOT and to admitAndAppend's repoRoot default. Agent `repoRoot`/`contextRoot`
// are no longer in the inputSchema and are ignored here (the off-mode W3 defeat + forged disposed_by are
// closed: the agent can no longer point governance at a root it controls).
function trustedRepoRoot() {
    const fromEnv = process.env.CLAUDE_PROJECT_DIR;
    if (typeof fromEnv === "string" && fromEnv !== "")
        return fromEnv;
    return join(import.meta.dirname, "..");
}
export function handleProposeNote(args) {
    // Defensive shape coercion — the gate's decision logic lives in context-io, not here.
    const task = String(args.task ?? "");
    const note = {
        kind: args.kind,
        by: String(args.by ?? ""),
        at: String(args.at ?? ""),
        verified_by: String(args.verified_by ?? ""),
        confidence: String(args.confidence ?? ""),
        refs: Array.isArray(args.refs) ? args.refs.map((r) => String(r)) : [],
        supersedes: args.supersedes === undefined || args.supersedes === null ? null : String(args.supersedes),
    };
    const body = String(args.body ?? "");
    // GAP-R6-2: derive the governance/persist root from the trusted source (CLAUDE_PROJECT_DIR), NEVER
    // from agent-supplied args. The context root is the trusted root's .grugops/context subpath. Any
    // `args.repoRoot`/`args.contextRoot` an agent sends is ignored (they are no longer in the schema).
    const repoRoot = trustedRepoRoot();
    const contextRoot = join(repoRoot, ".grugops", "context");
    try {
        const result = admitAndAppend(task, note, body, contextRoot, repoRoot);
        if (result.findings.length > 0) {
            return { content: [{ type: "text", text: result.findings.join("\n") }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `admitted: note ${result.id} written via the single sanctioned writer (appendNote).`,
                },
            ],
        };
    }
    catch (e) {
        // A thrown error (e.g. an invalid task name) is a refusal, never a silent write.
        return { content: [{ type: "text", text: `admission FAIL: ${e.message}` }], isError: true };
    }
}
function reply(id, result) {
    return JSON.stringify({ jsonrpc: "2.0", id, result });
}
function replyError(id, code, message) {
    return JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } });
}
// Dispatch one parsed JSON-RPC message. Returns a JSON string to write back, or null for a notification
// (no id) that needs no response.
export function dispatch(msg) {
    const { method, id, params } = msg;
    // A message with no id is a notification (e.g. notifications/initialized) — no response.
    const isNotification = id === undefined;
    switch (method) {
        case "initialize": {
            const clientProto = params?.protocolVersion ?? DEFAULT_PROTOCOL_VERSION;
            return reply(id ?? null, {
                protocolVersion: clientProto,
                capabilities: { tools: {} },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
            });
        }
        case "notifications/initialized":
            return null; // notification — no response
        case "ping":
            return isNotification ? null : reply(id ?? null, {});
        case "tools/list":
            return reply(id ?? null, { tools: [PROPOSE_NOTE_TOOL] });
        case "tools/call": {
            const name = params?.name;
            const args = params?.arguments ?? {};
            if (name !== PROPOSE_NOTE_TOOL.name) {
                return replyError(id ?? null, -32602, `unknown tool "${name}"`);
            }
            return reply(id ?? null, handleProposeNote(args));
        }
        default:
            if (isNotification)
                return null;
            return replyError(id ?? null, -32601, `method not found: ${method}`);
    }
}
// ── stdio loop (only when run directly, never on import) ──────────────────────────────────────────
function main() {
    const rl = createInterface({ input: process.stdin });
    rl.on("line", (line) => {
        const trimmed = line.trim();
        if (trimmed === "")
            return;
        let msg;
        try {
            msg = JSON.parse(trimmed);
        }
        catch {
            // A malformed line gets a parse-error response with a null id (JSON-RPC convention).
            process.stdout.write(replyError(null, -32700, "parse error") + "\n");
            return;
        }
        const out = dispatch(msg);
        if (out !== null)
            process.stdout.write(out + "\n");
    });
}
// import.meta.url === the executed file's URL when run via `node admission-server.js`.
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain)
    main();
