// mock-api.mjs — a local stand-in for the Anthropic Messages API, for the zero-token ask-rule
// measurement of plan 33.1-03 (D-20 part (d)). No model is called: this process answers every
// request itself, on 127.0.0.1 only.
//
// Usage: node mock-api.mjs <port> <toolName> <inputJson> <logPath>
//
// Behaviour:
//   - The FIRST POST to /v1/messages whose `tools` includes <toolName> and whose messages carry no
//     `tool_result` is answered with one streamed `tool_use` of <toolName> with <inputJson> as input.
//   - Every later Messages request is answered with a streamed `end_turn` text ("done").
//   - Any other path (count_tokens, /api/hello, anything else) is answered with {"input_tokens":1}.
//   - One line per request is appended to <logPath>: `<method> <url> toolResult=<bool>`.
//   - When listening, the process prints `listening <port>` on stdout so the driver can start.
//
// Node stdlib only. It lives in the phase directory, not the suite, for the reason
// .planning/phases/32.1-board-dashboard-deferred-residuals/32.1-ledger-check.mjs states: a suite case
// that reads .planning/ reds the commit that writes it.

import { createServer } from "node:http";
import { appendFileSync } from "node:fs";

const [, , portArg, toolName, inputJson, logPath] = process.argv;
if (!portArg || !toolName || !inputJson || !logPath) {
  process.stderr.write("usage: node mock-api.mjs <port> <toolName> <inputJson> <logPath>\n");
  process.exit(2);
}
const input = JSON.parse(inputJson);
let issued = false;

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

    const useTool = !issued && tools.includes(toolName) && !hasResult;
    if (useTool) issued = true;
    const blocks = useTool
      ? [
          [
            "content_block_start",
            {
              type: "content_block_start",
              index: 0,
              content_block: { type: "tool_use", id: "toolu_mock", name: toolName, input: {} },
            },
          ],
          [
            "content_block_delta",
            {
              type: "content_block_delta",
              index: 0,
              delta: { type: "input_json_delta", partial_json: JSON.stringify(input) },
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
