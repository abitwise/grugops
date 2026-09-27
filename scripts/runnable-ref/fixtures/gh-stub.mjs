// gh-stub.mjs — a Node stand-in for the `gh` CLI, used ONLY by host-protection.test.ts and the
// installer test that runs the materialized host check. host-protection.js reaches it through its
// `--gh-script <path>` test seam (`node gh-stub.mjs <args…>` in place of `gh <args…>`), so no test
// ever calls the real `gh` or the network.
//
// Inputs (environment):
//   GH_STUB_FIXTURE — path to a JSON map from the space-joined argv to a response:
//                       "auth status"                          → { "exit": <n> }
//                       "api --method GET -i <path>"           → { "status": <n>, "body": <json>,
//                                                                  "link"?: <header>, "crlf"?: true,
//                                                                  "raw"?: <stdout>, "exit"?: <n> }
//   GH_STUB_LOG     — path to a file; every invocation appends JSON.stringify(argv) plus a newline,
//                     so a test can prove every call was a read.
//
// Output for an api call: `HTTP/2.0 <status> X`, a Content-Type header line (plus a Link line when
// given), a blank line and the body; exit 0 below status 400, else 1. `raw` replaces the whole
// stdout (for the unparseable-output case). An argv with no fixture entry prints nothing to stdout
// and exits 1.

import { appendFileSync, readFileSync } from "node:fs";

const argv = process.argv.slice(2);
if (process.env.GH_STUB_LOG) appendFileSync(process.env.GH_STUB_LOG, `${JSON.stringify(argv)}\n`);

const fixture = process.env.GH_STUB_FIXTURE ? JSON.parse(readFileSync(process.env.GH_STUB_FIXTURE, "utf8")) : {};
const entry = Object.prototype.hasOwnProperty.call(fixture, argv.join(" ")) ? fixture[argv.join(" ")] : undefined;
if (entry === undefined) process.exit(1);

if (argv[0] === "auth") process.exit(typeof entry.exit === "number" ? entry.exit : 0);

const status = typeof entry.status === "number" ? entry.status : 200;
if (typeof entry.raw === "string") {
  process.stdout.write(entry.raw);
} else {
  const eol = entry.crlf === true ? "\r\n" : "\n";
  const head = [`HTTP/2.0 ${status} X`, "Content-Type: application/json"];
  if (typeof entry.link === "string") head.push(`Link: ${entry.link}`);
  const body = typeof entry.body === "string" ? entry.body : JSON.stringify(entry.body ?? null);
  process.stdout.write(`${head.join(eol)}${eol}${eol}${body}`);
}
process.exit(typeof entry.exit === "number" ? entry.exit : status < 400 ? 0 : 1);
