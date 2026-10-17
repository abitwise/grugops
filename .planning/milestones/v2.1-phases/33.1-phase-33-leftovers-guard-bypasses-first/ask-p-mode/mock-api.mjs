// mock-api.mjs — a local stand-in for the Anthropic Messages API, for the zero-token ask-rule
// measurement of plan 33.1-03 (D-20 part (d)). No model is called: this process answers every
// request itself, on 127.0.0.1 only.
//
// Usage: node mock-api.mjs <port> <toolName> <inputJson> <logPath> [<firstToolJson>]
//
// Behaviour (four arguments, plan 33.1-03 — unchanged):
//   - The FIRST POST to /v1/messages whose `tools` includes <toolName> and whose messages carry no
//     `tool_result` is answered with one streamed `tool_use` of <toolName> with <inputJson> as input.
//   - Every later Messages request is answered with a streamed `end_turn` text ("done").
//   - Any other path (count_tokens, /api/hello, anything else) is answered with {"input_tokens":1}.
//   - One line per request is appended to <logPath>: `<method> <url> toolResult=<bool>`.
//   - When listening, the process prints `listening <port>` on stdout so the driver can start.
//
// Two-step subagent script (optional fifth argument, plan 33.1-13, D-33-R4-05):
//   <firstToolJson> is `{"name": "<first tool>", "input": {...}}`, normally an `Agent` tool use
//   carrying a short prompt. Then:
//   - the FIRST Messages request that offers <first tool> and carries no `tool_result` is answered
//     with that tool use (id `toolu_mock_first`) — the main thread spawning a subagent;
//   - <toolName> is issued (id `toolu_mock`) on the first LATER request that offers <toolName>,
//     carries no `tool_result`, and does not carry the id `toolu_mock_first` anywhere. The main
//     thread's own continuation always carries that id (its assistant turn holds the first tool use),
//     so the request this matches is the subagent's own conversation. (The plan's first sketch keyed
//     this on "does not offer the Agent tool"; on a platform that lets subagents nest, a subagent's
//     request may offer Agent too, so the id is the discriminator that does not depend on nesting.)
//   - every other Messages request is answered with `end_turn`;
//   - each issued tool use also appends `issued <name> <id>` to <logPath> (a line that never starts
//     with `POST`, so a driver counting `POST /v1/messages` lines is unaffected).
//
// Node stdlib only. It lives in the phase directory, not the suite, for the reason
// .planning/phases/32.1-board-dashboard-deferred-residuals/32.1-ledger-check.mjs states: a suite case
// that reads .planning/ reds the commit that writes it.

import { createServer } from "node:http";
import { appendFileSync } from "node:fs";

const [, , portArg, toolName, inputJson, logPath, firstToolJson] = process.argv;
if (!portArg || !toolName || !inputJson || !logPath) {
  process.stderr.write("usage: node mock-api.mjs <port> <toolName> <inputJson> <logPath> [<firstToolJson>]\n");
  process.exit(2);
}
const input = JSON.parse(inputJson);
const firstTool = firstToolJson ? JSON.parse(firstToolJson) : null;
if (firstTool !== null && (typeof firstTool.name !== "string" || typeof firstTool.input !== "object")) {
  process.stderr.write('mock-api.mjs: <firstToolJson> must be {"name": "<tool>", "input": {...}}\n');
  process.exit(2);
}
const FIRST_ID = "toolu_mock_first";
let issued = false;
let firstIssued = false;

const messageStart = {
  type: "message_start",
  message: {
    id: "msg_mock",
    type: "message",
    role: "assistant",
    model: "claude-mock",
    content: [],
    stop_reason: null,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  },
};

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    let j = {};
    try {
      j = JSON.parse(body);
    } catch {
      j = {};
    }
    const tools = Array.isArray(j.tools) ? j.tools.map((t) => t && t.name) : [];
    const hasResult = JSON.stringify(j.messages || []).includes('"tool_result"');
    appendFileSync(logPath, `${req.method} ${req.url} toolResult=${hasResult}\n`);

    const url = req.url || "";
    if (!url.startsWith("/v1/messages") || url.includes("count_tokens")) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"input_tokens":1}');
      return;
    }

    // Which tool use (if any) this request is answered with.
    let issue = null;
    if (firstTool === null) {
      if (!issued && tools.includes(toolName) && !hasResult) issue = { id: "toolu_mock", name: toolName, input };
    } else if (!firstIssued) {
      if (tools.includes(firstTool.name) && !hasResult) issue = { id: FIRST_ID, name: firstTool.name, input: firstTool.input };
    } else if (!issued && tools.includes(toolName) && !hasResult && !body.includes(FIRST_ID)) {
      issue = { id: "toolu_mock", name: toolName, input };
    }
    if (issue !== null) {
      if (issue.id === FIRST_ID) firstIssued = true;
      else issued = true;
      if (firstTool !== null) appendFileSync(logPath, `issued ${issue.name} ${issue.id}\n`);
    }
    const useTool = issue !== null;
    const blocks = useTool
      ? [
          [
            "content_block_start",
            {
              type: "content_block_start",
              index: 0,
              content_block: { type: "tool_use", id: issue.id, name: issue.name, input: {} },
            },
          ],
          [
            "content_block_delta",
            {
              type: "content_block_delta",
              index: 0,
              delta: { type: "input_json_delta", partial_json: JSON.stringify(issue.input) },
            },
          ],
        ]
      : [
          ["content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }],
          ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "done" } }],
        ];
    const frames = [
      ["message_start", messageStart],
      ...blocks,
      ["content_block_stop", { type: "content_block_stop", index: 0 }],
      [
        "message_delta",
        {
          type: "message_delta",
          delta: { stop_reason: useTool ? "tool_use" : "end_turn", stop_sequence: null },
          usage: { output_tokens: 1 },
        },
      ],
      ["message_stop", { type: "message_stop" }],
    ];
    res.writeHead(200, { "content-type": "text/event-stream" });
    for (const [event, data] of frames) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    res.end();
  });
});

server.listen(Number(portArg), "127.0.0.1", () => {
  process.stdout.write(`listening ${server.address().port}\n`);
});
