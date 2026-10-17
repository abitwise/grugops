// run-write.mjs — the zero-token measurement of whether `claude -p --permission-mode default` denies
// an out-of-target `Write`, on the main thread and inside a subagent (plan 33.1-13, D-33-R4-05,
// D-11 part (a)). It decides whether the capture runner may pin `--permission-mode default`.
//
// Usage:
//   node run-write.mjs [--case main|subagent|inside] [--mode default|bypassPermissions] [--keep]
//     --case <c>   run one case only. Default: both, `main` then `subagent`. `inside` is a
//                  supplementary case, never in the default set: the main thread writes
//                  <target>/probe.txt, INSIDE the scoped `Edit(//<target>/**)` grant, to show whether
//                  the pinned mode still lets the grant's own writes through (its "outside-file" field
//                  then reports the in-target file).
//     --mode <m>   the --permission-mode passed to the child. Default: `default` (the measurement).
//                  `bypassPermissions` is the CONTROL: the same script must then read `ran`, which
//                  proves the harness can observe a write that happened, so a `denied` under
//                  `default` is the mode's doing and not a harness that cannot see writes.
//     --keep       keep each case's scratch directory and print its path (for reading the stream).
//
// Per case:
//   1. a mkdtemp scratch holding a git target (one commit on `main`) and a temporary
//      CLAUDE_CONFIG_DIR, plus a SEPARATE mkdtemp "outside" directory that is not under the target;
//   2. ../ask-p-mode/mock-api.mjs on 127.0.0.1 issues one `Write` tool use with
//      `file_path = <outside>/probe.txt`:
//        main      — on the main thread's first tool-bearing request;
//        subagent  — the mock's two-step script: the main thread first receives an `Agent` tool use
//                    (general-purpose, a short prompt), and the `Write` is issued inside the
//                    subagent's own conversation (see mock-api.mjs);
//   3. `claude -p write --setting-sources project --output-format stream-json --verbose
//      --permission-mode <mode> --allowedTools <liveAllowedTools(target)>` runs with cwd = target,
//      stdin empty, a 60 s bound, ANTHROPIC_BASE_URL pointed at the mock, a placeholder API key, and
//      every inherited CLAUDE* / ANTHROPIC* variable removed (no OAuth token, no parent session). The
//      grant is the one the live capture passes, imported from the BUILT scripts/capture-live.js, so
//      the measurement is of the runner's own list, not a copy of it;
//   4. the verdict is read from the filesystem (does <outside>/probe.txt exist) and the stream (the
//      Write tool call, its tool_result, and the result frame's permission_denials).
//
// Verdicts:
//   ran               the outside file exists;
//   denied            the outside file is absent, the transcript shows the Write tool call in the
//                     expected session (main: parent null; subagent: parent = the Agent spawn), and
//                     either a permission_denials entry names it or its tool_result is an error;
//   UNKNOWN - verify  anything else (for example the subagent's tool call never appears in the
//                     transcript). It is never counted as a deny.
//
// Zero-token by construction: the Messages API base URL is 127.0.0.1. A case whose mock log records
// no `POST /v1/messages` line cannot be shown to have run against the mock, so the harness REFUSES
// (exit 2) rather than report a verdict.
//
// Output: one line per case, `<case> outside-file=<absent|present> denials=<n> verdict=<denied|ran|
// UNKNOWN - verify>`, each followed by indented detail lines, then the `claude --version` string.
// Exit: 0 when every case printed a verdict line (whatever the verdict: this is a measurement, not a
// gate); 2 on refusal.
//
// Node stdlib only. It lives in the phase directory, not the suite (see ../ask-p-mode/mock-api.mjs).

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, realpathSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = import.meta.dirname;
const REPO_ROOT = resolve(HERE, "..", "..", "..", "..");
const MOCK = join(HERE, "..", "ask-p-mode", "mock-api.mjs");
const { liveAllowedTools } = await import(pathToFileURL(join(REPO_ROOT, "scripts", "capture-live.js")).href);
const CASES = ["main", "subagent", "inside"];
const DEFAULT_CASES = ["main", "subagent"];
const MODES = ["default", "bypassPermissions"];
const WRITE_ID = "toolu_mock";
const AGENT_ID = "toolu_mock_first";

let cases = [...DEFAULT_CASES];
let keep = false;
let mode = "default";
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--case") {
    const c = argv[++i];
    if (!CASES.includes(c)) {
      process.stderr.write(`run-write.mjs: unknown case: ${c} (expected one of ${CASES.join(", ")})\n`);
      process.exit(2);
    }
    cases = [c];
  } else if (a === "--mode") {
    const m = argv[++i];
    if (!MODES.includes(m)) {
      process.stderr.write(`run-write.mjs: unknown mode: ${m} (expected one of ${MODES.join(", ")})\n`);
      process.exit(2);
    }
    mode = m;
  } else if (a === "--keep") {
    keep = true;
  } else {
    process.stderr.write(`run-write.mjs: unknown argument: ${a}\n`);
    process.exit(2);
  }
}

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited ${r.status}: ${r.stderr || r.stdout}`);
  }
  return r.stdout;
}

function freePort() {
  return new Promise((res, rej) => {
    const s = createServer();
    s.on("error", rej);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => res(port));
    });
  });
}

function startMock(port, logPath, writeInput, firstTool) {
  return new Promise((res, rej) => {
    const args = [MOCK, String(port), "Write", JSON.stringify(writeInput), logPath];
    if (firstTool !== null) args.push(JSON.stringify(firstTool));
    const child = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    const timer = setTimeout(() => rej(new Error("mock did not start within 10 s")), 10_000);
    child.stdout.on("data", (d) => {
      out += d;
      if (out.includes("listening")) {
        clearTimeout(timer);
        res(child);
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      rej(new Error(`mock exited early with ${code}`));
    });
  });
}

// A child environment with every inherited CLAUDE* / ANTHROPIC* variable removed, then only the
// variables this measurement needs (the ask-p-mode harness's rule, plan 33.1-03).
function childEnv(port, configDir) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^(CLAUDE|ANTHROPIC)/.test(k)) continue;
    env[k] = v;
  }
  env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${port}`;
  env.ANTHROPIC_API_KEY = "sk-ant-mock-000";
  env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1";
  env.CLAUDE_CONFIG_DIR = configDir;
  return env;
}

function runClaude(args, cwd, env) {
  return new Promise((res) => {
    // stdin is never inherited: `claude -p` would otherwise consume the caller's stdin.
    const child = spawn("claude", args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => child.kill("SIGKILL"), 60_000);
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      res({ code, signal, stdout, stderr });
    });
  });
}

function frames(stdout) {
  const out = [];
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // not a JSON line; ignore
    }
  }
  return out;
}

function blocks(frame) {
  const content = frame && frame.message && Array.isArray(frame.message.content) ? frame.message.content : [];
  return content.filter((b) => b && typeof b === "object");
}

function resultText(block) {
  if (typeof block.content === "string") return block.content;
  if (Array.isArray(block.content)) return block.content.map((c) => (c && typeof c.text === "string" ? c.text : "")).join(" ");
  return "";
}

function readStream(stdout) {
  const fs = frames(stdout);
  const init = fs.find((f) => f.type === "system" && f.subtype === "init") ?? null;
  const result = [...fs].reverse().find((f) => f.type === "result") ?? null;
  let writeCall = null;
  let writeResult = null;
  let agentCall = null;
  for (const f of fs) {
    for (const b of blocks(f)) {
      if (b.type === "tool_use" && b.id === WRITE_ID && b.name === "Write") writeCall = { parent: f.parent_tool_use_id ?? null };
      if (b.type === "tool_use" && b.id === AGENT_ID) agentCall = { name: b.name, parent: f.parent_tool_use_id ?? null };
      if (b.type === "tool_result" && b.tool_use_id === WRITE_ID) {
        writeResult = { parent: f.parent_tool_use_id ?? null, isError: b.is_error === true, text: resultText(b).replace(/\s+/g, " ").slice(0, 240) };
      }
    }
  }
  const denials = result && Array.isArray(result.permission_denials) ? result.permission_denials : [];
  return {
    permissionMode: init ? String(init.permissionMode) : "(no init frame)",
    denials,
    writeCall,
    writeResult,
    agentCall,
  };
}

async function runCase(kind) {
  const scratch = mkdtempSync(join(tmpdir(), "grugops-write-"));
  const outside = realpathSync.native(mkdtempSync(join(tmpdir(), "grugops-write-outside-")));
  try {
    const target = join(scratch, "target");
    const configDir = join(scratch, "claude-config");
    const logPath = join(scratch, "mock.log");
    mkdirSync(target);
    mkdirSync(configDir);
    writeFileSync(logPath, "");

    sh("git", ["init", "-q", "-b", "main", target]);
    const gitId = ["-c", "user.name=grugops-probe", "-c", "user.email=probe@example.invalid"];
    writeFileSync(join(target, "README.md"), "write-deny probe target\n");
    sh("git", ["-C", target, "add", "README.md"]);
    sh("git", ["-C", target, ...gitId, "commit", "-q", "-m", "probe: initial commit"]);

    const probe = kind === "inside" ? join(realpathSync.native(target), "probe.txt") : join(outside, "probe.txt");
    const writeInput = { file_path: probe, content: "out-of-target write probe\n" };
    const firstTool =
      kind === "subagent"
        ? {
            name: "Agent",
            input: {
              description: "write probe",
              prompt: "SUBAGENT-WRITE-PROBE: write the probe file.",
              subagent_type: "general-purpose",
            },
          }
        : null;

    const grant = liveAllowedTools(target);
    const args = ["-p", "write", "--setting-sources", "project", "--output-format", "stream-json", "--verbose", "--permission-mode", mode, "--allowedTools", ...grant];

    const port = await freePort();
    const mock = await startMock(port, logPath, writeInput, firstTool);
    let run;
    try {
      run = await runClaude(args, target, childEnv(port, configDir));
    } finally {
      mock.kill("SIGTERM");
    }

    const log = readFileSync(logPath, "utf8");
    const posts = log.split("\n").filter((l) => l.startsWith("POST /v1/messages")).length;
    const issuedLines = log.split("\n").filter((l) => l.startsWith("issued "));
    if (posts === 0) {
      process.stderr.write(
        `run-write.mjs: REFUSED ${kind}: the mock recorded no POST /v1/messages, ` +
          `so this run cannot be shown to have been zero-token.\n` +
          `  claude exit=${run.code} signal=${run.signal}\n  stderr: ${run.stderr.slice(-1000)}\n`,
      );
      process.exit(2);
    }

    const s = readStream(run.stdout);
    const outsideFile = existsSync(probe) ? "present" : "absent";
    const expectedParent = kind === "subagent" ? AGENT_ID : null;
    const shown =
      (s.writeCall !== null && s.writeCall.parent === expectedParent) ||
      (s.writeResult !== null && s.writeResult.parent === expectedParent);
    const named = s.denials.some((d) => d && d.tool_use_id === WRITE_ID);
    let verdict = "UNKNOWN - verify";
    if (outsideFile === "present") verdict = "ran";
    else if (shown && (named || (s.writeResult !== null && s.writeResult.isError))) verdict = "denied";

    if (keep) process.stderr.write(`run-write.mjs: kept ${kind} scratch ${scratch} (outside ${outside})\n`);
    if (keep) writeFileSync(join(scratch, "stream.jsonl"), run.stdout);
    return {
      kind,
      outsideFile,
      denials: s.denials.length,
      verdict,
      details: [
        `init permissionMode=${s.permissionMode}; claude exit=${run.code} signal=${run.signal}; mock POST /v1/messages=${posts}${issuedLines.length ? `; ${issuedLines.join("; ")}` : ""}`,
        `Write tool call in transcript: ${s.writeCall === null ? "none" : `parent_tool_use_id=${s.writeCall.parent}`}; Agent spawn: ${s.agentCall === null ? "none" : `${s.agentCall.name} parent_tool_use_id=${s.agentCall.parent}`}`,
        `Write tool_result: ${s.writeResult === null ? "none" : `parent_tool_use_id=${s.writeResult.parent} is_error=${s.writeResult.isError} text="${s.writeResult.text}"`}`,
        `permission_denials naming the Write: ${named ? "yes" : "no"}; allowedTools=${JSON.stringify(grant.map((g) => g.replace(realpathSync.native(target).slice(1), "<target>").replace(target.slice(1), "<target>")))}`,
      ],
    };
  } finally {
    if (!keep) {
      rmSync(scratch, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  }
}

for (const kind of cases) {
  const r = await runCase(kind);
  console.log(`${mode === "default" ? "" : `[control --permission-mode ${mode}] `}${r.kind} outside-file=${r.outsideFile} denials=${r.denials} verdict=${r.verdict}`);
  for (const d of r.details) console.log(`  ${d}`);
}
console.log(spawnSync("claude", ["--version"], { encoding: "utf8" }).stdout.trim());
process.exitCode = 0;
