// run-ask.mjs — the zero-token measurement of what an installed Claude Code `ask` rule does in
// `claude -p` mode (plan 33.1-03, D-20 part (d)).
//
// Usage:
//   node run-ask.mjs [--mode <m>] [--all] [--control]
//     --mode <m>   default | auto | acceptEdits | dontAsk | bypassPermissions | none
//                  (`none` passes no --permission-mode flag). Default: default.
//     --all        run every mode above, in that order.
//     --control    the target's configuration lowers protected_branch_merge to `off`, so the
//                  installer writes no push rule and the push must RUN. This proves the rule, not
//                  the harness, causes the deny.
//
// Per case:
//   1. a mkdtemp scratch holding a git target (one commit on `main`) and a bare remote `origin`;
//   2. for --control, .grugops/factory.config.json with checkpoints.protected_branch_merge = "off";
//   3. the REAL installer from this checkout (install/install.js --yes, INSTALL_MODE=copy, a
//      temporary GRUGOPS_HOME) writes the target's .claude/settings.json;
//   4. the settings file is checked for `Bash(git push *)` (present for an ask case, absent for a
//      control case);
//   5. mock-api.mjs on 127.0.0.1 answers the first tool-bearing request with one Bash tool use,
//      `git push origin main`;
//   6. `claude -p push --setting-sources project --output-format stream-json --verbose
//      [--permission-mode <m>] --allowedTools "Bash(git push *)"` runs with cwd = target, stdin
//      empty, a 60 s bound, ANTHROPIC_BASE_URL pointed at the mock, a placeholder API key, and every
//      inherited CLAUDE* / ANTHROPIC* variable removed (so no OAuth token and no parent session can
//      reach the child). The command is allow-listed, so only the ask rule can stop it.
//   7. The result frame's permission_denials and the bare remote's refs/heads/main decide the case.
//
// Zero-token by construction: the Messages API base URL is 127.0.0.1. A case whose mock log records
// no `POST /v1/messages` line cannot be shown to have run against the mock, so the harness REFUSES
// it (exit 2) rather than report a verdict.
//
// Output: one line per case, `<mode> <ask|control> remote-main=<absent|present> denials=<n>
// verdict=<denied|ran|inconclusive>`, then the `claude --version` string. `inconclusive` means the
// push neither ran nor was recorded as denied (for example the tool call was never made); it is
// never counted as a pass.
// Exit: 0 iff every ask case reads denied and every control case reads ran; 1 otherwise; 2 on refusal.
//
// Node stdlib only. It lives in the phase directory, not the suite (see mock-api.mjs).

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const HERE = import.meta.dirname;
const REPO_ROOT = resolve(HERE, "..", "..", "..", "..");
const INSTALL_JS = join(REPO_ROOT, "install", "install.js");
const MOCK = join(HERE, "mock-api.mjs");
const MODES = ["default", "auto", "acceptEdits", "dontAsk", "bypassPermissions", "none"];
const RULE = "Bash(git push *)";
const COMMAND = "git push origin main";

let modes = ["default"];
let control = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--mode") {
    const m = argv[++i];
    if (!MODES.includes(m)) {
      process.stderr.write(`run-ask.mjs: unknown mode: ${m} (expected one of ${MODES.join(", ")})\n`);
      process.exit(2);
    }
    modes = [m];
  } else if (a === "--all") {
    modes = [...MODES];
  } else if (a === "--control") {
    control = true;
  } else {
    process.stderr.write(`run-ask.mjs: unknown argument: ${a}\n`);
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

function startMock(port, logPath) {
  return new Promise((res, rej) => {
    const input = JSON.stringify({ command: COMMAND, description: "push main to origin" });
    const child = spawn(process.execPath, [MOCK, String(port), "Bash", input, logPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });
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
// variables this measurement needs. Removing them all (not only the two auth tokens the plan names)
// also cuts any link to a parent Claude Code session this harness may be running under.
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

function runClaude(mode, cwd, env) {
  return new Promise((res) => {
    const args = ["-p", "push", "--setting-sources", "project", "--output-format", "stream-json", "--verbose"];
    if (mode !== "none") args.push("--permission-mode", mode);
    args.push("--allowedTools", RULE);
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

function resultFrame(stdout) {
  let frame = null;
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    try {
      const j = JSON.parse(line);
      if (j && j.type === "result") frame = j;
    } catch {
      // not a JSON line; ignore
    }
  }
  return frame;
}

async function runCase(mode) {
  const scratch = mkdtempSync(join(tmpdir(), "grugops-ask-"));
  try {
    const target = join(scratch, "target");
    const remote = join(scratch, "remote.git");
    const home = join(scratch, "grugops-home");
    const configDir = join(scratch, "claude-config");
    const logPath = join(scratch, "mock.log");
    mkdirSync(target);
    mkdirSync(configDir);
    writeFileSync(logPath, "");

    sh("git", ["init", "--bare", "-q", remote]);
    sh("git", ["init", "-q", "-b", "main", target]);
    const gitId = ["-c", "user.name=grugops-probe", "-c", "user.email=probe@example.invalid"];
    writeFileSync(join(target, "README.md"), "ask-rule probe target\n");
    sh("git", ["-C", target, "add", "README.md"]);
    sh("git", ["-C", target, ...gitId, "commit", "-q", "-m", "probe: initial commit"]);
    sh("git", ["-C", target, "remote", "add", "origin", remote]);

    if (control) {
      mkdirSync(join(target, ".grugops"), { recursive: true });
      writeFileSync(
        join(target, ".grugops", "factory.config.json"),
        JSON.stringify({ checkpoints: { protected_branch_merge: "off" } }, null, 2) + "\n",
      );
    }

    // The REAL installer from this checkout.
    const inst = spawnSync(process.execPath, [INSTALL_JS, "--yes"], {
      encoding: "utf8",
      env: { ...process.env, TARGET: target, GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, INSTALL_MODE: "copy" },
    });
    if (inst.status !== 0) {
      throw new Error(`installer exited ${inst.status}: ${inst.stderr}\n${inst.stdout.slice(-2000)}`);
    }
    const settingsPath = join(target, ".claude", "settings.json");
    const settings = existsSync(settingsPath) ? readFileSync(settingsPath, "utf8") : "";
    const hasRule = settings.includes(JSON.stringify(RULE));
    if (control && hasRule) throw new Error(`control target's settings contain ${RULE}; the config-off mapping failed`);
    if (!control && !hasRule) throw new Error(`ask target's settings do not contain ${RULE}`);

    const port = await freePort();
    const mock = await startMock(port, logPath);
    let run;
    try {
      run = await runClaude(mode, target, childEnv(port, configDir));
    } finally {
      mock.kill("SIGTERM");
    }

    const log = readFileSync(logPath, "utf8");
    const posts = log.split("\n").filter((l) => l.startsWith("POST /v1/messages")).length;
    if (posts === 0) {
      process.stderr.write(
        `run-ask.mjs: REFUSED ${mode} ${control ? "control" : "ask"}: the mock recorded no POST /v1/messages, ` +
          `so this run cannot be shown to have been zero-token.\n` +
          `  claude exit=${run.code} signal=${run.signal}\n  stderr: ${run.stderr.slice(-1000)}\n`,
      );
      process.exit(2);
    }

    const frame = resultFrame(run.stdout);
    const denials = frame && Array.isArray(frame.permission_denials) ? frame.permission_denials.length : 0;
    const remoteMain =
      spawnSync("git", ["--git-dir", remote, "rev-parse", "--verify", "-q", "refs/heads/main"], { stdio: "ignore" })
        .status === 0
        ? "present"
        : "absent";
    let verdict = "inconclusive";
    if (remoteMain === "present") verdict = "ran";
    else if (denials > 0) verdict = "denied";
    return { mode, kind: control ? "control" : "ask", remoteMain, denials, verdict, posts };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

let ok = true;
for (const mode of modes) {
  const r = await runCase(mode);
  console.log(`${r.mode} ${r.kind} remote-main=${r.remoteMain} denials=${r.denials} verdict=${r.verdict}`);
  const want = control ? "ran" : "denied";
  if (r.verdict !== want) ok = false;
}
console.log(spawnSync("claude", ["--version"], { encoding: "utf8" }).stdout.trim());
process.exitCode = ok ? 0 : 1;
