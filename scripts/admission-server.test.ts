// admission-server.test.ts — the structured-channel write-path proof (Plan 25-09, GOV-01/GOV-02).
//
// Proves the COMBINER's persist-arbiter behavior through the MCP server's call path (the un-forgeable
// per-call HOOK gate is proven separately in Plan 25-10). It drives the COMMITTED server two ways,
// mirroring the repo's spawn-the-committed-.js discipline (floor-invariance.test.ts / hooks/guard.test.ts):
//   - imports the committed scripts/admission-server.js and calls its exported handleProposeNote (the
//     server's tools/call path) with STRUCTURED JSON args into temp contextRoot/repoRoot, and
//   - spawns the committed server over real stdio JSON-RPC to prove the channel end-to-end AND that the
//     server reads NO approval env (it ignores its own GRUGOPS_ADMISSION_APPROVED_BY — the gate is the
//     per-call 25-10 hook, not the server).
//
// All note I/O is into mkdtempSync temp dirs — nothing is written into the committed tree.
//
// CLEAR PROFESSIONAL VOICE (CLAUDE.md — governance/safety surface).
//
// vitest globals:false → import the test fns explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const SERVER_JS = join(ROOT, "scripts", "admission-server.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Import the committed server .js for the in-process call-handler path (the server's tools/call route).
const srv: typeof import("./admission-server.js") = await import(pathToFileURL(SERVER_JS).href);

// A factory.config.json under a temp repoRoot with the given context dial values; returns the root.
function repoWithGovernance(context: Record<string, string>): string {
  const root = freshTmp("asrv-repo-");
  mkdirSync(join(root, ".grugops"), { recursive: true });
  writeFileSync(join(root, ".grugops", "factory.config.json"), JSON.stringify({ context }, null, 2));
  return root;
}
function notesDir(contextRoot: string, task: string): string {
  return join(contextRoot, task, "notes");
}
function noteFiles(contextRoot: string, task: string): string[] {
  const d = notesDir(contextRoot, task);
  return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".md")) : [];
}
function ledgerLines(repoRoot: string): string[] {
  const p = join(repoRoot, ".grugops", "audit", "admissions.jsonl");
  return existsSync(p) ? readFileSync(p, "utf8").split("\n").filter((l) => l.trim() !== "") : [];
}

// Base structured args the cases override (the propose_note tool's parameters).
function args(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    task: "asrv",
    kind: "observation",
    by: "software-engineer",
    at: "2026-06-17T14:23:05Z",
    verified_by: "",
    confidence: "high",
    refs: [],
    supersedes: null,
    body: "a note proposed through the structured channel",
    ...over,
  };
}

describe("admission-server — structured-channel write path via the call handler (D-01)", () => {
  it("a clean routine propose_note persists exactly one note via the single writer (composed fence on disk)", () => {
    const contextRoot = freshTmp("asrv-clean-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "off" });
    const a = args({ task: "asrv-clean", contextRoot, repoRoot });
    const res = srv.handleProposeNote(a);
    expect(res.isError).toBeFalsy();
    const files = noteFiles(contextRoot, "asrv-clean");
    expect(files).toHaveLength(1);
    const text = readFileSync(join(notesDir(contextRoot, "asrv-clean"), files[0]), "utf8");
    expect(text.startsWith("---\n")).toBe(true); // composeNote fence
    expect(text).toContain("by: software-engineer");
  });

  it("GATED + valid human:alice (high-severity dial, retained): persists ONE note stamped human:alice and ledgers disposed_by:human:alice", () => {
    const contextRoot = freshTmp("asrv-gated-ok-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
    const a = args({
      task: "asrv-gated-ok",
      kind: "finding",
      by: "security-nfr",
      verified_by: "human:alice",
      body: "a high-severity finding, disposed by a named human",
      contextRoot,
      repoRoot,
    });
    const res = srv.handleProposeNote(a);
    expect(res.isError).toBeFalsy();
    const files = noteFiles(contextRoot, "asrv-gated-ok");
    expect(files).toHaveLength(1);
    const text = readFileSync(join(notesDir(contextRoot, "asrv-gated-ok"), files[0]), "utf8");
    expect(text).toContain("verified_by: human:alice");
    const lines = ledgerLines(repoRoot);
    expect(lines).toHaveLength(1);
    const event = JSON.parse(lines[0]);
    expect(event.disposed_by).toBe("human:alice");
    expect(event.severity).toBe("high");
  });

  it("GATED with NO valid human:NAME stamp (high-severity dial): persists NOTHING and names the fault", () => {
    const contextRoot = freshTmp("asrv-gated-nostamp-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
    const a = args({
      task: "asrv-gated-nostamp",
      kind: "finding",
      by: "security-nfr",
      verified_by: "",
      body: "a high-severity finding lacking a human disposition",
      contextRoot,
      repoRoot,
    });
    const res = srv.handleProposeNote(a);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(contextRoot, "asrv-gated-nostamp")).toHaveLength(0);
  });

  it("W5 backstop: a GATED routine note under `all` with no human:NAME stamp persists NOTHING and names the fault", () => {
    const contextRoot = freshTmp("asrv-w5-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "all" });
    const a = args({
      task: "asrv-w5",
      kind: "finding",
      by: "software-engineer",
      verified_by: "§14-gate#SEED-001",
      body: "a routine finding under all, no human disposition",
      contextRoot,
      repoRoot,
    });
    const res = srv.handleProposeNote(a);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(contextRoot, "asrv-w5")).toHaveLength(0);
  });

  it("W3: a NON-GATED note (by: software-engineer, high-severity dial) with verified_by: human:eve persists NOTHING and names the fault", () => {
    const contextRoot = freshTmp("asrv-w3-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
    const a = args({
      task: "asrv-w3",
      kind: "finding",
      by: "software-engineer",
      verified_by: "human:eve",
      body: "a routine finding forging a human disposition",
      contextRoot,
      repoRoot,
    });
    const res = srv.handleProposeNote(a);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/W3|must be empty|§14-gate/);
    expect(noteFiles(contextRoot, "asrv-w3")).toHaveLength(0);
    expect(ledgerLines(repoRoot)).toHaveLength(0); // no forged disposed_by entered the ledger
  });

  it("single-writer: the only artifact under contextRoot is the one note file (no second-writer / stray files)", () => {
    const contextRoot = freshTmp("asrv-single-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "off" });
    srv.handleProposeNote(args({ task: "asrv-single", contextRoot, repoRoot }));
    // The task dir holds exactly notes/<id>.md and nothing else (render is not invoked here).
    const taskDir = join(contextRoot, "asrv-single");
    const entries = readdirSync(taskDir);
    expect(entries).toEqual(["notes"]);
    expect(noteFiles(contextRoot, "asrv-single")).toHaveLength(1);
  });
});

// ── End-to-end over real stdio JSON-RPC, proving the server reads NO approval env. ───────────────────
describe("admission-server — end-to-end stdio JSON-RPC (the server is NOT the gate)", () => {
  // Drive the COMMITTED server over stdio: write newline-delimited JSON-RPC, collect the responses.
  function driveServer(messages: object[], extraEnv: Record<string, string> = {}) {
    const input = messages.map((m) => JSON.stringify(m)).join("\n") + "\n";
    const r = spawnSync("node", [SERVER_JS], {
      input,
      encoding: "utf8",
      env: { ...process.env, ...extraEnv },
    });
    const responses = r.stdout
      .split("\n")
      .filter((l) => l.trim() !== "")
      .map((l) => JSON.parse(l));
    return responses;
  }

  it("initialize + tools/list expose exactly one tool, propose_note", () => {
    const [init, list] = driveServer([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
    ]);
    expect(init.result.serverInfo.name).toBe("grugops");
    expect(list.result.tools).toHaveLength(1);
    expect(list.result.tools[0].name).toBe("propose_note");
  });

  it("the server IGNORES its own GRUGOPS_ADMISSION_APPROVED_BY env: a gated note with no stamp is STILL refused", () => {
    const contextRoot = freshTmp("asrv-env-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
    // Set the approval env in the SERVER's process — if the server (wrongly) read it, the gated note
    // might be admitted. The gate is the per-call 25-10 hook, NOT the server env, so it must REFUSE.
    const responses = driveServer(
      [
        { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "propose_note",
            arguments: args({
              task: "asrv-env",
              kind: "finding",
              by: "security-nfr",
              verified_by: "",
              body: "a high-severity finding with no human disposition",
              contextRoot,
              repoRoot,
            }),
          },
        },
      ],
      { GRUGOPS_ADMISSION_APPROVED_BY: "mallory" },
    );
    const call = responses.find((r) => r.id === 2);
    expect(call.result.isError).toBe(true);
    expect(call.result.content[0].text).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(contextRoot, "asrv-env")).toHaveLength(0);
  });

  it("a clean routine note persists end-to-end over stdio (the structured channel works)", () => {
    const contextRoot = freshTmp("asrv-e2e-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "off" });
    const responses = driveServer([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "propose_note",
          arguments: args({ task: "asrv-e2e", contextRoot, repoRoot }),
        },
      },
    ]);
    const call = responses.find((r) => r.id === 2);
    expect(call.result.isError).toBeFalsy();
    expect(call.result.content[0].text).toContain("admitted: note");
    expect(noteFiles(contextRoot, "asrv-e2e")).toHaveLength(1);
  });
});

// ── plugin.json wiring sanity (the manifest carries the mcpServers entry, still parses). ─────────────
describe("admission-server — plugin.json mcpServers wiring", () => {
  it("plugin.json parses and wires the committed server via ${CLAUDE_PLUGIN_ROOT}, keeping name/version/author/keywords", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "plugin.json"), "utf8"));
    expect(manifest.name).toBe("grugops");
    expect(manifest.version).toBeTruthy();
    expect(manifest.author).toBeTruthy();
    expect(Array.isArray(manifest.keywords)).toBe(true);
    const server = manifest.mcpServers?.grugops;
    expect(server).toBeTruthy();
    expect(server.command).toBe("node");
    expect(server.args).toContain("${CLAUDE_PLUGIN_ROOT}/scripts/admission-server.js");
  });
});
