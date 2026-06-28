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

// A factory.config.json under a temp root with the given context dial values; returns the root. This
// root is the TRUSTED project root (GAP-R6-2): the server derives the dial / ledger / context root from
// process.env.CLAUDE_PROJECT_DIR (set via withProjectDir below), NOT from agent-supplied tool args.
function repoWithGovernance(context: Record<string, string>): string {
  const root = freshTmp("asrv-repo-");
  mkdirSync(join(root, ".grugops"), { recursive: true });
  writeFileSync(join(root, ".grugops", "factory.config.json"), JSON.stringify({ context }, null, 2));
  return root;
}
// Notes persist under the trusted root's .grugops/context/<task>/notes (the server derives the context
// root from CLAUDE_PROJECT_DIR); the ledger under .grugops/audit/admissions.jsonl.
function notesDir(root: string, task: string): string {
  return join(root, ".grugops", "context", task, "notes");
}
function noteFiles(root: string, task: string): string[] {
  const d = notesDir(root, task);
  return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".md")) : [];
}
function ledgerLines(repoRoot: string): string[] {
  const p = join(repoRoot, ".grugops", "audit", "admissions.jsonl");
  return existsSync(p) ? readFileSync(p, "utf8").split("\n").filter((l) => l.trim() !== "") : [];
}
// Set process.env.CLAUDE_PROJECT_DIR (the trusted root) around a call, then restore it — the real trust
// model is a trusted ENV, never a tool arg (GAP-R6-2).
function withProjectDir<T>(root: string, fn: () => T): T {
  const prev = process.env.CLAUDE_PROJECT_DIR;
  process.env.CLAUDE_PROJECT_DIR = root;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR;
    else process.env.CLAUDE_PROJECT_DIR = prev;
  }
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
    const root = repoWithGovernance({ human_admission: "off" });
    const res = withProjectDir(root, () => srv.handleProposeNote(args({ task: "asrv-clean" })));
    expect(res.isError).toBeFalsy();
    const files = noteFiles(root, "asrv-clean");
    expect(files).toHaveLength(1);
    const text = readFileSync(join(notesDir(root, "asrv-clean"), files[0]), "utf8");
    expect(text.startsWith("---\n")).toBe(true); // composeNote fence
    expect(text).toContain("by: software-engineer");
  });

  it("GATED + valid human:alice (high-severity dial, retained): persists ONE note stamped human:alice and ledgers disposed_by:human:alice", () => {
    const root = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
    const res = withProjectDir(root, () =>
      srv.handleProposeNote(
        args({
          task: "asrv-gated-ok",
          kind: "finding",
          by: "security-nfr",
          verified_by: "human:alice",
          body: "a high-severity finding, disposed by a named human",
        }),
      ),
    );
    expect(res.isError).toBeFalsy();
    const files = noteFiles(root, "asrv-gated-ok");
    expect(files).toHaveLength(1);
    const text = readFileSync(join(notesDir(root, "asrv-gated-ok"), files[0]), "utf8");
    expect(text).toContain("verified_by: human:alice");
    const lines = ledgerLines(root);
    expect(lines).toHaveLength(1);
    const event = JSON.parse(lines[0]);
    expect(event.disposed_by).toBe("human:alice");
    expect(event.severity).toBe("high");
  });

  it("GATED with NO valid human:NAME stamp (high-severity dial): persists NOTHING and names the fault", () => {
    const root = repoWithGovernance({ human_admission: "high-severity" });
    const res = withProjectDir(root, () =>
      srv.handleProposeNote(
        args({
          task: "asrv-gated-nostamp",
          kind: "finding",
          by: "security-nfr",
          verified_by: "",
          body: "a high-severity finding lacking a human disposition",
        }),
      ),
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(root, "asrv-gated-nostamp")).toHaveLength(0);
  });

  it("W5 backstop: a GATED routine note under `all` with no human:NAME stamp persists NOTHING and names the fault", () => {
    const root = repoWithGovernance({ human_admission: "all" });
    const res = withProjectDir(root, () =>
      srv.handleProposeNote(
        args({
          task: "asrv-w5",
          kind: "finding",
          by: "software-engineer",
          verified_by: "§14-gate#SEED-001",
          body: "a routine finding under all, no human disposition",
        }),
      ),
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(root, "asrv-w5")).toHaveLength(0);
  });

  it("W3: a NON-GATED note (by: software-engineer, high-severity dial) with verified_by: human:eve persists NOTHING and names the fault", () => {
    const root = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
    const res = withProjectDir(root, () =>
      srv.handleProposeNote(
        args({
          task: "asrv-w3",
          kind: "finding",
          by: "software-engineer",
          verified_by: "human:eve",
          body: "a routine finding forging a human disposition",
        }),
      ),
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/W3|must be empty|§14-gate/);
    expect(noteFiles(root, "asrv-w3")).toHaveLength(0);
    expect(ledgerLines(root)).toHaveLength(0); // no forged disposed_by entered the ledger
  });

  it("GAP-R6-1: a propose_note SOFT-kind (claim) with a traversal `by` is refused and writes nothing into the VICTIM task", () => {
    const root = repoWithGovernance({ human_admission: "off" }); // off → a claim is non-gated
    // Plant VICTIM/notes so the escape is REAL: pre-fix the soft note lands here; the fix refuses.
    mkdirSync(notesDir(root, "VICTIM"), { recursive: true });
    const res = withProjectDir(root, () =>
      srv.handleProposeNote(
        args({
          task: "ATK",
          kind: "claim",
          by: "x/../../../VICTIM/notes/INJECTED",
          verified_by: "",
          body: "a soft note attempting cross-task injection through the sanctioned channel",
        }),
      ),
    );
    expect(res.isError).toBe(true);
    expect(noteFiles(root, "VICTIM")).toHaveLength(0); // no INJECTED file escaped into VICTIM
    expect(noteFiles(root, "ATK")).toHaveLength(0);
  });

  it("single-writer: the only artifact under contextRoot is the one note file (no second-writer / stray files)", () => {
    const root = repoWithGovernance({ human_admission: "off" });
    withProjectDir(root, () => srv.handleProposeNote(args({ task: "asrv-single" })));
    // The task dir holds exactly notes/<id>.md and nothing else (render is not invoked here).
    const taskDir = join(root, ".grugops", "context", "asrv-single");
    const entries = readdirSync(taskDir);
    expect(entries).toEqual(["notes"]);
    expect(noteFiles(root, "asrv-single")).toHaveLength(1);
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
    const root = repoWithGovernance({ human_admission: "high-severity" });
    // Set the approval env in the SERVER's process — if the server (wrongly) read it, the gated note
    // might be admitted. The gate is the per-call 25-10 hook, NOT the server env, so it must REFUSE.
    // CLAUDE_PROJECT_DIR is the trusted root the server derives the dial/persist root from (GAP-R6-2).
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
            }),
          },
        },
      ],
      { GRUGOPS_ADMISSION_APPROVED_BY: "mallory", CLAUDE_PROJECT_DIR: root },
    );
    const call = responses.find((r) => r.id === 2);
    expect(call.result.isError).toBe(true);
    expect(call.result.content[0].text).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(root, "asrv-env")).toHaveLength(0);
  });

  it("a clean routine note persists end-to-end over stdio (the structured channel works)", () => {
    const root = repoWithGovernance({ human_admission: "off" });
    const responses = driveServer(
      [
        { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "propose_note",
            arguments: args({ task: "asrv-e2e" }),
          },
        },
      ],
      { CLAUDE_PROJECT_DIR: root },
    );
    const call = responses.find((r) => r.id === 2);
    expect(call.result.isError).toBeFalsy();
    expect(call.result.content[0].text).toContain("admitted: note");
    expect(noteFiles(root, "asrv-e2e")).toHaveLength(1);
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

// ── GAP-R6-2 — the server derives the governance/persist root from CLAUDE_PROJECT_DIR, NOT args ───────
// (Plan 25-12). Before this plan the server read the dial/ledger/context root from agent-supplied
// `repoRoot`/`contextRoot` tool args while the hook read CLAUDE_PROJECT_DIR — so under a real `off` dial
// an agent could pass repoRoot=<a temp root with human_admission:all> + contextRoot=<the real context>
// to drive the gated branch and persist a forged human:NAME note (off-mode W3 defeat, forged
// disposed_by). The fix: the server derives BOTH roots from the SAME trusted source the hook uses
// (process.env.CLAUDE_PROJECT_DIR, fallback its own repo root), ignores agent roots, and removes them
// from the inputSchema. These RED-first tests set CLAUDE_PROJECT_DIR as the trusted env (never a tool
// arg) and prove the agent roots are inert.
describe("admission-server — GAP-R6-2 trusted-root derivation from CLAUDE_PROJECT_DIR (Plan 25-12)", () => {
  // Notes persist under the trusted root's .grugops/context; the ledger under .grugops/audit.
  function ctxNotesDir(root: string, task: string): string {
    return join(root, ".grugops", "context", task, "notes");
  }
  function ctxNoteFiles(root: string, task: string): string[] {
    const d = ctxNotesDir(root, task);
    return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".md")) : [];
  }
  function withProjectDir<T>(root: string, fn: () => T): T {
    const prev = process.env.CLAUDE_PROJECT_DIR;
    process.env.CLAUDE_PROJECT_DIR = root;
    try {
      return fn();
    } finally {
      if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR;
      else process.env.CLAUDE_PROJECT_DIR = prev;
    }
  }

  it("RED: real dial off, agent-supplied repoRoot(all)+contextRoot cannot force the gated branch (forged human:eve refused)", () => {
    const trustedOff = repoWithGovernance({ human_admission: "off" });
    const attackerAll = repoWithGovernance({ human_admission: "all", audit_retention: "retained" });
    const attackerCtx = freshTmp("asrv-r62-atkctx-");
    const res = withProjectDir(trustedOff, () =>
      srv.handleProposeNote(
        args({
          task: "asrv-r62",
          kind: "finding",
          by: "software-engineer",
          verified_by: "human:eve",
          body: "off-mode W3 defeat attempt via agent-supplied roots",
          // Attacker-supplied roots that the FIXED server must IGNORE:
          repoRoot: attackerAll,
          contextRoot: attackerCtx,
        }),
      ),
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/W3|must be empty|§14-gate/);
    // No forged note in EITHER root, and no forged disposed_by ledger line anywhere.
    expect(ctxNoteFiles(trustedOff, "asrv-r62")).toHaveLength(0);
    expect(noteFiles(attackerCtx, "asrv-r62")).toHaveLength(0);
    expect(ledgerLines(trustedOff)).toHaveLength(0);
    expect(ledgerLines(attackerAll)).toHaveLength(0);
  });

  it("RED (reverse): trusted dial high-severity, agent repoRoot(off) does NOT downgrade gating (high-sev finding refused)", () => {
    const trustedHigh = repoWithGovernance({ human_admission: "high-severity" });
    const attackerOff = repoWithGovernance({ human_admission: "off" });
    const res = withProjectDir(trustedHigh, () =>
      srv.handleProposeNote(
        args({
          task: "asrv-r62-rev",
          kind: "finding",
          by: "security-nfr",
          verified_by: "",
          body: "a high-severity finding; agent tries to downgrade via repoRoot=off",
          repoRoot: attackerOff,
        }),
      ),
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/human:NAME|human disposition/);
    expect(ctxNoteFiles(trustedHigh, "asrv-r62-rev")).toHaveLength(0);
  });

  it("POSITIVE: a legit note persists exactly once under the TRUSTED root derived from CLAUDE_PROJECT_DIR", () => {
    const trusted = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
    const res = withProjectDir(trusted, () =>
      srv.handleProposeNote(
        args({
          task: "asrv-r62-pos",
          kind: "finding",
          by: "security-nfr",
          verified_by: "human:alice",
          body: "a high-severity finding disposed by a named human, persisted to the trusted root",
        }),
      ),
    );
    expect(res.isError).toBeFalsy();
    expect(ctxNoteFiles(trusted, "asrv-r62-pos")).toHaveLength(1);
    const lines = ledgerLines(trusted);
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).disposed_by).toBe("human:alice");
  });

  it("the tool inputSchema no longer advertises repoRoot/contextRoot governance inputs", () => {
    const props = srv.PROPOSE_NOTE_TOOL.inputSchema.properties as Record<string, unknown>;
    expect(props.repoRoot).toBeUndefined();
    expect(props.contextRoot).toBeUndefined();
  });
});
