#!/usr/bin/env node
// 38-fixture-tools.mjs — census and trim of a local copy of a pre-v3 repository (phase 38, plan 38-01, D-15, D-16).
//
//   node .planning/phases/38-install-migrate-v3/38-fixture-tools.mjs census <copy>
//   node .planning/phases/38-install-migrate-v3/38-fixture-tools.mjs trim <copy> <out>
//
// `census` prints markdown: the shapes a hand-written pre-v3 board, ticket set, NFR catalog, trace file, progress file
// and context root hold, with the counts the later plans of phase 38 decide on. `trim` writes the frozen fixture
// (install/fixtures/pre-v3-chess/) from the same copy, under the rules TRIM_RULES states, and prints what it kept.
//
// READ-ONLY ON THE COPY. Every fs call that names a path under <copy> is readdirSync, lstatSync or readFileSync (and
// `git rev-parse HEAD` / `git status --porcelain`, which read). Writes go only under <out>, which must not lie inside
// <copy>; `trim` refuses before any write when it does.
//
// No package. It imports the committed builds scripts/board-model.js (the row grammar: splitRow, isTicketId,
// boardColumnName, stripHtmlComments, normalizeDocument) and install/state-layout.js (every path and budget), so the
// grammar and the paths have one owner. Run `npm run build` first. Clear voice: this is test infrastructure.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const model = await import(pathToFileURL(join(REPO, "scripts", "board-model.js")).href);
const layout = await import(pathToFileURL(join(REPO, "install", "state-layout.js")).href);
const { splitRow, isTicketId, boardColumnName, stripHtmlComments, normalizeDocument } = model;
const { LEGACY_STATE_ROOT_REL, LEGACY_BOARD_REL, PROGRESS_REL, CONTEXT_REL, QUEUE_REL, BUDGETS } = layout;

// ── Shared grammar (copied shapes are named, never re-guessed) ─────────────────────────────────────────────────────
const ROW = /^- \[([^\]]{1,64})\] (.*)$/; // scripts/board-model.ts ROW
const EPIC_ID = /^(?:EPIC|FEAT)-\d{1,9}$/; // scripts/board-model.ts EPIC_ID
const META_GAP = "  ("; // scripts/board-model.ts META_GAP
const DATED_HEADING = /^## [0-9]{4}-[0-9]{2}-[0-9]{2}(?: |$)/; // scripts/runnable-ref/state-roll.ts DATED_HEADING
const NFR_ID = /NFR-\d{1,9}/g;
const TRAILER_DASH = /\s(?:—|–|--?)\s/;
/** Secret shapes (T-38-01). A line matching one is named by file and line only and never written into the fixture. */
const SECRET_SHAPES = [/-----BEGIN/, /ghp_/, /github_pat_/, /AKIA/, /sk-\w{20,}/];
/** Extensions .gitattributes pins to LF (check-nul-bytes refuses a tracked text file that is not pinned). */
const PINNED_EXT = new Set([".md", ".txt", ".json", ".jsonl", ".yml", ".yaml"]);
const FIXTURE_MAX_BYTES = 512 * 1024;
const PROGRESS_MAX_BYTES = 40 * 1024;
const NFR_WHOLE_MAX_BYTES = 64 * 1024;
const OTHER_TOP_LEVEL_MAX_BYTES = 16 * 1024;
const ROWS_PER_COLUMN = 6;
const DONE_ROWS_KEPT = 24;
const TRACE_ROWS_KEPT = 30;
/** A trace row longer than this is not one of the 30 short rows; the copy's first rows run to 58 KB each. */
const TRACE_SHORT_ROW_MAX_BYTES = 4 * 1024;
const NFR_SECTIONS_KEPT = 8;
const CONTEXT_FOLDERS_KEPT = 8;

const TRAILER_CAP = model.MAX_META_CHARS; // parseBoard's 1,024-character cap: reported, never used to cut

const bytes = (s) => Buffer.byteLength(s, "utf8");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const isSecretLine = (line) => SECRET_SHAPES.some((re) => re.test(line));
const posix = (p) => p.split(sep).join("/");

// ── Read-only walk of the copy ────────────────────────────────────────────────────────────────────────────────────
/** Every entry under `abs` (lstat, links never followed): { rel, kind: file|dir|link|other, size, target }. */
function walk(abs, relBase = "") {
  const out = [];
  let ents;
  try {
    ents = readdirSync(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  ents.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of ents) {
    const childAbs = join(abs, e.name);
    const rel = relBase ? `${relBase}/${e.name}` : e.name;
    const st = lstatSync(childAbs);
    if (st.isSymbolicLink()) out.push({ rel, abs: childAbs, kind: "link", size: 0, target: readlinkSync(childAbs) });
    else if (st.isDirectory()) {
      out.push({ rel, abs: childAbs, kind: "dir", size: 0 });
      out.push(...walk(childAbs, rel));
    } else if (st.isFile()) out.push({ rel, abs: childAbs, kind: "file", size: st.size });
    else out.push({ rel, abs: childAbs, kind: "other", size: 0 });
  }
  return out;
}

function readText(abs) {
  return readFileSync(abs, "utf8");
}

/** Line-ending class of a byte buffer: lf, crlf, mixed, cr (lone CR only) or none (no line break). */
function lineEndingClass(buf) {
  let crlf = 0;
  let lf = 0;
  let cr = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0d) {
      if (buf[i + 1] === 0x0a) {
        crlf++;
        i++;
      } else cr++;
    } else if (buf[i] === 0x0a) lf++;
  }
  const kinds = [lf > 0, crlf > 0, cr > 0].filter(Boolean).length;
  if (kinds === 0) return "none";
  if (kinds > 1) return "mixed";
  return lf > 0 ? "lf" : crlf > 0 ? "crlf" : "cr";
}

function isValidUtf8(buf) {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buf);
    return true;
  } catch {
    return false;
  }
}

// ── The board ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** One row's shape classes. The trailer is cut by the splitRow rule; parseBoard's cap is never applied. */
function rowClasses(id, rest) {
  const parts = splitRow(rest);
  const hasGap = rest.includes(META_GAP);
  const epic = EPIC_ID.test(id);
  const classes = [];
  if (!hasGap) classes.push(TRAILER_DASH.test(rest) ? "dash-no-parenthetical" : "no-parenthetical");
  else if (parts.meta === null) classes.push("unbalanced-parenthetical");
  else if (parts.trailer === "") classes.push("meta-no-trailer");
  else classes.push(parts.trailer.length > TRAILER_CAP ? "meta-long-trailer" : "meta-trailer");
  if (epic) classes.push(parts.trailer !== "" ? "epic-with-trailer" : "epic-no-trailer");
  return { classes, parts, epic };
}

function analyzeBoard(text) {
  const normalized = normalizeDocument(text);
  const orig = normalized.split("\n");
  const stripped = stripHtmlComments(normalized).split("\n");
  const rows = [];
  const updates = [];
  const multiLineUpdates = [];
  const doneNonRows = [];
  const headings = [];
  const commentBlocks = [];
  let column = null;
  let section = null;
  // HTML comment spans, by line.
  {
    let open = -1;
    for (let i = 0; i < orig.length; i++) {
      const line = orig[i];
      let pos = 0;
      for (;;) {
        if (open === -1) {
          const s = line.indexOf("<!--", pos);
          if (s === -1) break;
          open = i;
          pos = s + 4;
        } else {
          const e = line.indexOf("-->", pos);
          if (e === -1) break;
          commentBlocks.push({ start: open, end: i });
          open = -1;
          pos = e + 3;
        }
      }
    }
    if (open !== -1) commentBlocks.push({ start: open, end: orig.length - 1, unterminated: true });
  }
  for (let i = 0; i < stripped.length; i++) {
    const s = stripped[i];
    if (/^#{1,6} /.test(s)) {
      headings.push(i);
      if (s.startsWith("## ")) {
        column = boardColumnName(s);
        section = s;
      }
      continue;
    }
    const m = ROW.exec(s);
    if (m) {
      const { classes, parts, epic } = rowClasses(m[1], m[2]);
      rows.push({ i, id: m[1], column, section, classes, parts, epic, bytes: bytes(orig[i]), line: orig[i] });
      continue;
    }
    if (s.startsWith("_Updated:")) {
      updates.push({ i, bytes: bytes(orig[i]) + 1 });
      const next = stripped[i + 1];
      if (next !== undefined && next.trim() !== "" && !/^(_Updated:|#|- \[|>|\|)/.test(next)) {
        let j = i + 1;
        while (j < stripped.length && stripped[j].trim() !== "" && !/^(_Updated:|#|- \[)/.test(stripped[j])) j++;
        multiLineUpdates.push({ start: i, end: j - 1 });
      }
      continue;
    }
    if (column === "Done" && s.trim() !== "") doneNonRows.push({ i, text: s });
  }
  return { orig, stripped, rows, updates, multiLineUpdates, doneNonRows, headings, commentBlocks };
}

// ── Tickets ───────────────────────────────────────────────────────────────────────────────────────────────────────
function frontmatterId(text) {
  const t = normalizeDocument(text);
  if (!t.startsWith("---\n")) return null;
  const end = t.indexOf("\n---", 4);
  if (end === -1) return null;
  for (const line of t.slice(4, end).split("\n")) {
    const m = /^id:\s*(.*)$/.exec(line);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

/** The ticket file a row's ID joins to: `{ID}.md` or `{ID}-*.md` directly under tickets/. */
function ticketFileFor(id, ticketFiles) {
  return ticketFiles.find((f) => f.name === `${id}.md` || (f.name.startsWith(`${id}-`) && f.name.endsWith(".md"))) ?? null;
}

// ── The copy, read once ───────────────────────────────────────────────────────────────────────────────────────────
function readCopy(copy) {
  const legacyRoot = join(copy, LEGACY_STATE_ROOT_REL);
  const boardAbs = join(copy, LEGACY_BOARD_REL);
  if (!existsSync(boardAbs)) throw new Error(`no pre-v3 board at ${boardAbs}`);
  const boardBuf = readFileSync(boardAbs);
  const board = analyzeBoard(boardBuf.toString("utf8"));
  const rootEntries = walk(legacyRoot);
  const ticketsDir = join(legacyRoot, "tickets");
  const ticketEntries = readdirSync(ticketsDir, { withFileTypes: true });
  const ticketFiles = ticketEntries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => ({ name: e.name, abs: join(ticketsDir, e.name), size: lstatSync(join(ticketsDir, e.name)).size }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  const ticketOtherFiles = ticketEntries.filter((e) => e.isFile() && !e.name.endsWith(".md")).map((e) => e.name);
  const nestedDirs = ticketEntries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const abs = join(ticketsDir, e.name);
      const files = walk(abs).filter((x) => x.kind === "file");
      return { name: e.name, abs, files };
    });
  const progressAbs = join(copy, PROGRESS_REL);
  const contextAbs = join(copy, CONTEXT_REL);
  const queueAbs = join(copy, QUEUE_REL);
  return { copy, legacyRoot, boardAbs, boardBuf, board, rootEntries, ticketsDir, ticketFiles, ticketOtherFiles, nestedDirs, progressAbs, contextAbs, queueAbs };
}

function analyzeNfr(text) {
  const lines = normalizeDocument(text).split("\n");
  const stripped = stripHtmlComments(normalizeDocument(text)).split("\n");
  let headerAt = -1;
  for (let i = 0; i < stripped.length - 1; i++) {
    if (stripped[i].startsWith("|") && /^\|[\s:|-]+\|\s*$/.test(stripped[i + 1])) {
      headerAt = i;
      break;
    }
  }
  const headerCells = headerAt === -1 ? [] : stripped[headerAt].split("|").slice(1, -1).map((c) => c.trim());
  const nfrRows = [];
  if (headerAt !== -1) {
    for (let i = headerAt + 2; i < stripped.length && stripped[i].startsWith("|"); i++) {
      const first = stripped[i].split("|")[1]?.trim() ?? "";
      nfrRows.push({ i, id: first });
    }
  }
  const ids = nfrRows.map((r) => r.id);
  const duplicates = [...new Set(ids.filter((id, k) => ids.indexOf(id) !== k))];
  const sections = [];
  for (let i = 0; i < stripped.length; i++) {
    if (!stripped[i].startsWith("## ")) continue;
    let end = i + 1;
    while (end < stripped.length && !stripped[end].startsWith("## ")) end++;
    const named = [...new Set(stripped[i].match(NFR_ID) ?? [])];
    const sub = [];
    for (let k = i + 1; k < end; k++) if (stripped[k].startsWith("### ")) sub.push(k);
    const sectionBytes = lines.slice(i, end).reduce((n, l) => n + bytes(l) + 1, 0);
    sections.push({ start: i, end: end - 1, named, sub: sub.length, bytes: sectionBytes, kind: named.length === 0 ? "none" : named.length === 1 ? "one" : "several" });
  }
  const firstSection = sections.length ? sections[0].start : lines.length;
  return { lines, stripped, headerAt, headerCells, nfrRows, duplicates, sections, firstSection };
}

function analyzeTrace(text) {
  const lines = normalizeDocument(text).split("\n");
  let headerAt = -1;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith("|") && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      headerAt = i;
      break;
    }
  }
  const rows = [];
  if (headerAt !== -1) for (let i = headerAt + 2; i < lines.length; i++) if (lines[i].startsWith("|")) rows.push(i);
  const updates = lines.filter((l) => l.startsWith("_Updated:")).length;
  const headerBytes = lines.slice(0, Math.max(headerAt, 0)).reduce((n, l) => n + bytes(l) + 1, 0);
  return { lines, headerAt, rows, updates, headerBytes };
}

function analyzeProgress(text) {
  const lines = normalizeDocument(text).split("\n");
  const sections = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^(```|~~~)/.test(lines[i])) fence = !fence;
    if (fence || !/^##(?: |$)/.test(lines[i])) continue;
    sections.push({ start: i, heading: lines[i], dated: DATED_HEADING.test(lines[i]) });
  }
  for (let k = 0; k < sections.length; k++) sections[k].end = (k + 1 < sections.length ? sections[k + 1].start : lines.length) - 1;
  for (const s of sections) s.bytes = lines.slice(s.start, s.end + 1).reduce((n, l) => n + bytes(l) + 1, 0);
  const preambleEnd = sections.length ? sections[0].start : lines.length;
  return { lines, sections, preambleEnd };
}

function queueStages(queueAbs) {
  const stages = [];
  if (!existsSync(queueAbs)) return stages;
  for (const e of readdirSync(queueAbs, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (!e.isDirectory()) continue;
    const names = readdirSync(join(queueAbs, e.name));
    const entryNames = new Set(names.map((n) => n.replace(/\.claim\.md$/, "").replace(/\.md$/, "")));
    stages.push({ stage: e.name, entries: names.length, entryNames });
  }
  return stages;
}

/** Ticket IDs a context folder name holds as delimited tokens, ignoring case (D-20). */
function idsInFolderName(name, knownIds) {
  const lower = name.toLowerCase();
  const found = [];
  for (const id of knownIds) {
    const needle = id.toLowerCase();
    let at = lower.indexOf(needle);
    while (at !== -1) {
      const before = at === 0 ? "" : lower[at - 1];
      const after = lower[at + needle.length] ?? "";
      if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) {
        found.push(id);
        break;
      }
      at = lower.indexOf(needle, at + 1);
    }
  }
  return found;
}
/** The same IDs written without their hyphen (`abc016` for ABC-016): an observation for plan 38-09, not D-20's rule. */
function hyphenlessIdsInFolderName(name, knownIds) {
  return idsInFolderName(name, knownIds.map((id) => id.replace("-", "")));
}

function analyzeContext(contextAbs, knownIds, doneIds, stages) {
  const folders = [];
  if (!existsSync(contextAbs)) return folders;
  for (const e of readdirSync(contextAbs, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const abs = join(contextAbs, e.name);
    const st = lstatSync(abs);
    if (!st.isDirectory() || st.isSymbolicLink()) {
      folders.push({ name: e.name, abs, kind: st.isSymbolicLink() ? "link" : "file", ids: [], files: [] });
      continue;
    }
    const entries = walk(abs);
    const files = entries.filter((x) => x.kind === "file");
    const ids = idsInFolderName(e.name, knownIds);
    const hyphenless = hyphenlessIdsInFolderName(e.name, knownIds);
    const queued = stages.filter((s) => s.entryNames.has(e.name)).map((s) => s.stage);
    folders.push({
      name: e.name,
      abs,
      kind: "dir",
      ids,
      hyphenless,
      allDone: ids.length > 0 && ids.every((id) => doneIds.has(id)),
      someDone: ids.some((id) => doneIds.has(id)),
      queued,
      files,
      entries,
      bytes: files.reduce((n, f) => n + f.size, 0),
      nested: entries.some((x) => x.kind === "dir"),
      odd: entries.some((x) => x.kind === "link" || x.kind === "other"),
    });
  }
  return folders;
}

// ── census ────────────────────────────────────────────────────────────────────────────────────────────────────────
function gitRead(copy, args) {
  const r = spawnSync("git", ["-C", copy, ...args], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trimEnd() : `UNKNOWN - verify (git ${args.join(" ")} exit ${r.status})`;
}

function census(copyArg) {
  const copy = resolve(copyArg);
  const c = readCopy(copy);
  const out = [];
  const zeros = [];
  const say = (s = "") => out.push(s);
  /** A counted shape; a zero is listed under `## Shapes not in the copy`. */
  const count = (label, n, note = "") => {
    say(`| ${label} | ${n} |${note ? ` ${note}` : ""}`);
    if (n === 0) zeros.push(label);
  };

  say("# Phase 38: fixture census of the pre-v3 copy (plan 38-01, D-15, D-16)");
  say("");
  say("Generated by `node .planning/phases/38-install-migrate-v3/38-fixture-tools.mjs census <copy>`; every count below is");
  say("read from the copy by that run, nothing is typed. Paths are relative to the copy root. The copy was only read.");
  say("");
  say("## Copy");
  say("");
  say(`- Path: \`${copy}\``);
  say(`- Git HEAD of the copy: \`${gitRead(copy, ["rev-parse", "HEAD"])}\``);
  say(`- Board: \`${LEGACY_BOARD_REL}\`, ${c.boardBuf.length} bytes, sha256 \`${sha256(c.boardBuf)}\``);
  say("");

  // Sizes
  say("## Sizes");
  say("");
  say(`### Every file under \`${LEGACY_STATE_ROOT_REL}/\``);
  say("");
  say("| Path | Bytes |");
  say("|------|-------|");
  let rootBytes = 0;
  for (const e of c.rootEntries) {
    if (e.kind === "file") {
      rootBytes += e.size;
      say(`| \`${LEGACY_STATE_ROOT_REL}/${e.rel}\` | ${e.size} |`);
    } else if (e.kind !== "dir") say(`| \`${LEGACY_STATE_ROOT_REL}/${e.rel}\` | ${e.kind}${e.target ? ` -> ${e.target}` : ""} |`);
  }
  say(`| **total (${c.rootEntries.filter((e) => e.kind === "file").length} files)** | ${rootBytes} |`);
  say("");
  const progressBuf = existsSync(c.progressAbs) ? readFileSync(c.progressAbs) : null;
  say(`### Progress file and context root`);
  say("");
  say("| Path | Bytes |");
  say("|------|-------|");
  say(`| \`${PROGRESS_REL}\` | ${progressBuf ? progressBuf.length : "absent"} |`);
  const ctxEntries = walk(c.contextAbs);
  const ctxFiles = ctxEntries.filter((e) => e.kind === "file");
  say(`| \`${CONTEXT_REL}/\` (${ctxFiles.length} files) | ${ctxFiles.reduce((n, f) => n + f.size, 0)} |`);
  say("");

  // Board
  const b = c.board;
  const ticketRows = b.rows.filter((r) => !r.epic);
  const classCounts = {};
  for (const r of b.rows) for (const k of r.classes) classCounts[k] = (classCounts[k] ?? 0) + 1;
  const longest = b.rows.reduce((m, r) => (m === null || r.bytes > m.bytes ? r : m), null);
  const withTrailer = b.rows.filter((r) => r.parts.trailer !== "");
  say("## Board");
  say("");
  say("Rows are lines matching the board grammar's row shape outside HTML comments. A trailer is everything after the");
  say("balanced parenthetical, cut by `splitRow`; parseBoard's 1,024-character cap is never applied to cut it.");
  say("");
  say("| Shape | Count |");
  say("|-------|-------|");
  count("board rows total", b.rows.length);
  count("rows outside every column", b.rows.filter((r) => r.column === null).length);
  count("rows with a trailer (splitRow rule)", withTrailer.length);
  count(`rows with a trailer over ${TRAILER_CAP} characters`, withTrailer.filter((r) => r.parts.trailer.length > TRAILER_CAP).length);
  say(`| longest row bytes | ${longest ? `${longest.bytes} (\`${longest.id}\`, line ${longest.i + 1})` : 0} |`);
  count("rows with no two-space parenthetical and no dash", classCounts["no-parenthetical"] ?? 0);
  count("rows with a trailer-like dash but no two-space parenthetical", classCounts["dash-no-parenthetical"] ?? 0);
  count("rows with an unbalanced parenthetical", classCounts["unbalanced-parenthetical"] ?? 0);
  count("rows with meta and no trailer", classCounts["meta-no-trailer"] ?? 0);
  count("epic and feature rows", b.rows.filter((r) => r.epic).length);
  count("epic and feature rows with trailers", classCounts["epic-with-trailer"] ?? 0);
  count("Done-column lines that are not rows", b.doneNonRows.length);
  count("`_Updated:` lines outside HTML comments", b.updates.length);
  say(`| \`_Updated:\` bytes (lines plus newline) | ${b.updates.reduce((n, u) => n + u.bytes, 0)} |`);
  count("`_Updated:` paragraphs spanning several lines", b.multiLineUpdates.length);
  count("HTML comment blocks", b.commentBlocks.length);
  count("HTML comment blocks spanning several lines", b.commentBlocks.filter((x) => x.end > x.start).length);
  count("unterminated HTML comments", b.commentBlocks.filter((x) => x.unterminated).length);
  say("");
  say("Rows per column:");
  say("");
  say("| Column | Rows | With trailer |");
  say("|--------|------|--------------|");
  const colOrder = [];
  for (const r of b.rows) if (!colOrder.includes(r.column)) colOrder.push(r.column);
  for (const col of colOrder) {
    const rs = b.rows.filter((r) => r.column === col);
    say(`| ${col ?? "(outside every column)"} | ${rs.length} | ${rs.filter((r) => r.parts.trailer !== "").length} |`);
  }
  say("");

  // Tickets
  const orphanRows = ticketRows.filter((r) => isTicketId(r.id) && ticketFileFor(r.id, c.ticketFiles) === null);
  const nonTicketIdRows = ticketRows.filter((r) => !isTicketId(r.id));
  const idMismatch = [];
  let noFrontmatterId = 0;
  for (const f of c.ticketFiles) {
    const id = frontmatterId(readText(f.abs));
    const stem = f.name.slice(0, -3);
    if (id === null) noFrontmatterId++;
    else if (stem !== id && !stem.startsWith(`${id}-`)) idMismatch.push(`${f.name} (id \`${id}\`)`);
  }
  const ticketsWithNotes = new Set(withTrailer.filter((r) => !r.epic && ticketFileFor(r.id, c.ticketFiles) !== null).map((r) => r.id));
  say("## Tickets");
  say("");
  say("| Shape | Count |");
  say("|-------|-------|");
  count("ticket `.md` files directly under `tickets/`", c.ticketFiles.length);
  say(`| ticket bytes total | ${c.ticketFiles.reduce((n, f) => n + f.size, 0)} |`);
  say(`| largest ticket bytes | ${Math.max(0, ...c.ticketFiles.map((f) => f.size))} |`);
  count(`tickets over BUDGETS.ticketBytes (${BUDGETS.ticketBytes})`, c.ticketFiles.filter((f) => f.size > BUDGETS.ticketBytes).length);
  count("other files directly under `tickets/`", c.ticketOtherFiles.length, c.ticketOtherFiles.map((n) => `\`${n}\``).join(", "));
  count("nested directories under `tickets/`", c.nestedDirs.length, c.nestedDirs.map((d) => `\`${d.name}/\` (${d.files.length} files)`).join(", "));
  count("tickets that would get `## Board notes` (a row with a trailer joins the file)", ticketsWithNotes.size);
  count("rows whose ticket ID has no ticket file (orphan rows)", orphanRows.length, orphanRows.map((r) => `\`${r.id}\``).join(", "));
  count("rows whose ID is not a ticket ID and not an epic or feature ID", nonTicketIdRows.length, nonTicketIdRows.map((r) => `\`${r.id}\``).join(", "));
  count("ticket files with no frontmatter `id`", noFrontmatterId);
  count("ticket files whose frontmatter `id` differs from their stem", idMismatch.length, idMismatch.join(", "));
  say("");

  // NFR
  const nfrAbs = join(c.legacyRoot, "nfr-catalog.md");
  say("## NFR catalog");
  say("");
  if (existsSync(nfrAbs)) {
    const n = analyzeNfr(readText(nfrAbs));
    const byKind = (k) => n.sections.filter((s) => s.kind === k);
    say(`Table header cells (${n.headerCells.length}): ${n.headerCells.map((h) => `\`${h}\``).join(", ")}`);
    say("");
    say("| Shape | Count |");
    say("|-------|-------|");
    count("NFR table rows", n.nfrRows.length);
    count("duplicate NFR IDs in the table", n.duplicates.length, n.duplicates.join(", "));
    count("`##` sections naming exactly one NFR ID", byKind("one").length);
    count("`##` sections naming no NFR ID", byKind("none").length);
    count("`##` sections naming several NFR IDs", byKind("several").length);
    count("`###` headings under one-ID sections", byKind("one").reduce((k, s) => k + s.sub, 0));
    count("`###` headings under no-ID sections", byKind("none").reduce((k, s) => k + s.sub, 0));
    count("`###` headings under several-ID sections", byKind("several").reduce((k, s) => k + s.sub, 0));
    say("");
  } else {
    say("No NFR catalog in the copy.");
    zeros.push("NFR catalog");
    say("");
  }

  // Trace
  const traceAbs = join(c.legacyRoot, "traceability.md");
  say("## Traceability");
  say("");
  if (existsSync(traceAbs)) {
    const t = analyzeTrace(readText(traceAbs));
    say("| Shape | Count |");
    say("|-------|-------|");
    count("trace rows", t.rows.length);
    count("`_Updated:` lines", t.updates);
    say(`| bytes before the table header | ${t.headerBytes} |`);
    say("");
  } else {
    say("No traceability file in the copy.");
    zeros.push("traceability file");
    say("");
  }

  // Progress
  say("## Progress");
  say("");
  if (progressBuf) {
    const p = analyzeProgress(progressBuf.toString("utf8"));
    const dated = p.sections.filter((s) => s.dated);
    say("| Shape | Count |");
    say("|-------|-------|");
    count("dated `##` entries (state-roll's DATED_HEADING)", dated.length);
    say(`| dated entry bytes | ${dated.reduce((k, s) => k + s.bytes, 0)} |`);
    count("standing `##` sections", p.sections.filter((s) => !s.dated).length);
    say(`| progress bytes | ${progressBuf.length} (BUDGETS.progressBytes ${BUDGETS.progressBytes}) |`);
    say("");
  } else {
    say("No progress file in the copy.");
    zeros.push("progress file");
    say("");
  }

  // Encoding
  const textFiles = [
    ...c.rootEntries.filter((e) => e.kind === "file").map((e) => ({ rel: `${LEGACY_STATE_ROOT_REL}/${e.rel}`, abs: e.abs })),
    ...(progressBuf ? [{ rel: PROGRESS_REL, abs: c.progressAbs }] : []),
    ...ctxFiles.map((e) => ({ rel: `${CONTEXT_REL}/${e.rel}`, abs: e.abs })),
  ];
  const endings = { lf: 0, crlf: 0, mixed: 0, cr: 0, none: 0 };
  const endingExamples = { crlf: [], mixed: [], cr: [] };
  const boms = [];
  const invalid = [];
  const nul = [];
  const secrets = [];
  for (const f of textFiles) {
    const buf = readFileSync(f.abs);
    const k = lineEndingClass(buf);
    endings[k]++;
    if (endingExamples[k] && endingExamples[k].length < 5) endingExamples[k].push(f.rel);
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) boms.push(f.rel);
    if (!isValidUtf8(buf)) invalid.push(f.rel);
    if (buf.includes(0)) nul.push(f.rel);
    buf
      .toString("utf8")
      .split("\n")
      .forEach((line, n) => {
        if (isSecretLine(line)) secrets.push(`${f.rel}:${n + 1}`);
      });
  }
  const links = [...c.rootEntries.map((e) => ({ ...e, rel: `${LEGACY_STATE_ROOT_REL}/${e.rel}` })), ...ctxEntries.map((e) => ({ ...e, rel: `${CONTEXT_REL}/${e.rel}` }))].filter(
    (e) => e.kind === "link" || e.kind === "other",
  );
  say("## Encoding and file kinds");
  say("");
  say(`Over ${textFiles.length} files: every file under \`${LEGACY_STATE_ROOT_REL}/\`, the progress file and every file under \`${CONTEXT_REL}/\`.`);
  say("");
  say("| Shape | Count |");
  say("|-------|-------|");
  count("files with LF line endings only", endings.lf);
  count("files with CRLF line endings only", endings.crlf, endingExamples.crlf.join(", "));
  count("files with mixed line endings", endings.mixed, endingExamples.mixed.join(", "));
  count("files with lone CR line endings", endings.cr, endingExamples.cr.join(", "));
  count("files with no line break", endings.none);
  count("files with a leading byte-order mark", boms.length, boms.join(", "));
  count("files that are not valid UTF-8", invalid.length, invalid.slice(0, 10).join(", "));
  count("files holding a NUL byte", nul.length, nul.slice(0, 10).join(", "));
  count("links and special files", links.length, links.map((e) => `\`${e.rel}\` (${e.kind})`).join(", "));
  say("");

  // Queue and context
  const stages = queueStages(c.queueAbs);
  const knownIds = [...new Set([...ticketRows.filter((r) => isTicketId(r.id)).map((r) => r.id), ...c.ticketFiles.map((f) => /^([A-Z][A-Z0-9]{0,15}-\d{1,9})/.exec(f.name)?.[1]).filter(Boolean)])].sort();
  const doneIds = new Set(b.rows.filter((r) => r.column === "Done").map((r) => r.id));
  const folders = analyzeContext(c.contextAbs, knownIds, doneIds, stages);
  const dirs = folders.filter((f) => f.kind === "dir");
  const named = dirs.filter((f) => f.ids.length > 0);
  const allDone = dirs.filter((f) => f.allDone);
  say("## Queue");
  say("");
  say("| Stage | Entries |");
  say("|-------|---------|");
  for (const s of stages) say(`| \`${QUEUE_REL}/${s.stage}/\` | ${s.entries} |`);
  if (stages.length === 0) zeros.push("queue stages");
  say("");
  say("## Context folders");
  say("");
  say("A folder names a ticket ID when the ID is a delimited token of its name, ignoring case (D-20). Known IDs are the");
  say(`board's ticket-ID rows plus the ticket files' leading IDs (${knownIds.length}). Done IDs are the Done column's rows (${doneIds.size}).`);
  say("");
  say("| Shape | Count |");
  say("|-------|-------|");
  count("context entries total", folders.length);
  count("context entries that are not real directories", folders.filter((f) => f.kind !== "dir").length);
  count("folders naming at least one ticket ID (D-20)", named.length);
  count("folders naming exactly one ticket ID", named.filter((f) => f.ids.length === 1).length);
  count("folders naming several ticket IDs", named.filter((f) => f.ids.length > 1).length);
  count("folders naming no ticket ID", dirs.length - named.length);
  count("folders whose named IDs are all Done", allDone.length);
  count("folders naming a Done ID and a not-Done ID", named.filter((f) => f.someDone && !f.allDone).length);
  count("folders naming only not-Done IDs", named.filter((f) => !f.someDone).length);
  count("folders naming no ID by D-20 but an ID without its hyphen (e.g. `abc016`)", dirs.filter((f) => f.ids.length === 0 && f.hyphenless.length > 0).length);
  count("folders holding a nested directory", dirs.filter((f) => f.nested).length);
  count("folders holding a link or special file", dirs.filter((f) => f.odd).length);
  say("");
  say("Of the folders whose named IDs are all Done, how many have a queue entry of the same name in each stage (the");
  say("input for the plan 38-09 decision):");
  say("");
  say("| Stage | All-Done folders with an entry |");
  say("|-------|--------------------------------|");
  for (const s of stages) say(`| \`${s.stage}\` | ${allDone.filter((f) => f.queued.includes(s.stage)).length} |`);
  say(`| (no stage) | ${allDone.filter((f) => f.queued.length === 0).length} |`);
  say("");

  // Secrets
  say("## Secret-shaped lines");
  say("");
  say("Shapes: `-----BEGIN`, `ghp_`, `github_pat_`, `AKIA`, `sk-` followed by 20 or more word characters. Named by file and");
  say("line only; the line is never printed and never written into the fixture.");
  say("");
  if (secrets.length === 0) {
    say("None found.");
    zeros.push("secret-shaped lines");
  } else for (const s of secrets) say(`- \`${s}\``);
  say("");

  say("## Trim rules");
  say("");
  for (const r of TRIM_RULES) say(`- ${r}`);
  say("");
  say("## Shapes not in the copy");
  say("");
  say("Every shape class above whose count is zero. None of these is written into the fixture; a later plan that needs one");
  say("makes it by mutating the materialized fixture at test time.");
  say("");
  for (const z of zeros) say(`- ${z}`);
  say("");
  process.stdout.write(out.join("\n"));
}

// ── trim ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const TRIM_RULES = [
  "`board-root/board.md` keeps, in the copy's order: every heading line; the first HTML comment block; the first three `_Updated:` lines outside comments plus one `_Updated:` paragraph spanning several lines when the copy has one; up to two Done-column lines that are not rows; the longest row; per non-Done column up to six rows, chosen so every row shape class the census found is present at least once (cheapest row by row bytes plus ticket bytes first); and 24 rows of the Done column (more than BUDGETS.doneRows), the shape classes first, then the cheapest. Where the copy has one or more blank lines between two kept lines, one blank line is written.",
  "`board-root/tickets/` keeps the ticket file of every kept ticket-ID row, except that when the copy has fewer than two orphan rows of its own, the two most expensive kept non-Done rows' ticket files are left out so orphan rows exist; orphan rows the copy has of its own are counted as a shape class and kept. One nested `tickets/` subdirectory is kept with its two smallest files when the copy has one.",
  "`board-root/traceability.md` keeps the title line, the first three `_Updated:` lines, the table header and separator rows, the first 30 table rows of at most 4 KiB each, and the smallest table row over BUDGETS.traceBytes (8,192 bytes); every other line before the table (mostly `_Updated:` lines) is not kept. The copy's first table rows run to tens of kilobytes each, so the first 30 rows by position would not fit the 512 KiB fixture.",
  "`board-root/nfr-catalog.md` is kept whole when it is at most 64 KiB; otherwise it keeps the title line, the first three `_Updated:` lines, the first HTML comment block, the table (header, separator, every row), and up to eight `##` sections whole, the smallest of each kind (one NFR ID, no NFR ID, several NFR IDs, and one with a `###` heading under it) first, then the smallest remaining.",
  "Every other top-level file of the pre-v3 root under 16 KiB is kept whole.",
  "`progress.md` keeps the preamble before the first `##` heading, then whole `##` sections in the copy's order (dated entries oldest and newest first, then standing sections), skipping any section that would pass 40 KiB, until the file exceeds BUDGETS.progressBytes (16,384 bytes).",
  "`context/` keeps up to eight task folders whole, the smallest of each class first: one naming one Done ticket, one naming a ticket that is not Done, one naming two IDs of which one is Done, one naming no ID, then one per other class the census found (all IDs Done with a queue entry, all IDs Done with no queue entry, an ID written without its hyphen, a nested directory, several IDs all Done). A class with no candidate is reported, not made up. A folder is a candidate only when every file in it has an extension .gitattributes pins to LF and that no gate compiles or runs (`.md`, `.txt`, `.json`, `.jsonl`, `.yml`, `.yaml`), it holds no NUL byte, no link and no special file, and no entry in it is named for the pre-v3 root.",
  "A line matching a secret shape is never written. Every CR byte is dropped and every file ends LF-only (check-nul-bytes forbids 0x0d; CRLF shapes are made at test time). A leading byte-order mark is dropped for the same reason. The total fixture is at most 512 KiB; trim refuses with exit 1 otherwise.",
];

function cleanBytes(text, dropped, rel) {
  let t = text.replace(/^﻿/, "").replace(/\r/g, "");
  const lines = t.split("\n");
  const kept = [];
  lines.forEach((l, n) => {
    if (isSecretLine(l)) dropped.push(`${rel}:${n + 1}`);
    else kept.push(l);
  });
  t = kept.join("\n");
  if (!t.endsWith("\n")) t += "\n";
  return t;
}

function emitLines(orig, keep) {
  const idx = [...keep].sort((a, b) => a - b);
  const out = [];
  for (let k = 0; k < idx.length; k++) {
    if (k > 0) {
      let blank = false;
      for (let j = idx[k - 1] + 1; j < idx[k]; j++) if (orig[j].trim() === "") blank = true;
      if (blank) out.push("");
    }
    out.push(orig[idx[k]]);
  }
  return `${out.join("\n")}\n`;
}

function trim(copyArg, outArg) {
  const copy = resolve(copyArg);
  const outDir = resolve(outArg);
  const relOut = relative(copy, outDir);
  if (relOut === "" || (!relOut.startsWith("..") && !relOut.startsWith(sep) && !/^[A-Za-z]:/.test(relOut))) {
    process.stderr.write(`trim refused: the output ${outDir} lies inside the copy ${copy}; the copy is read-only. Nothing was written.\n`);
    process.exit(2);
  }
  if (existsSync(outDir) && readdirSync(outDir).length > 0) {
    process.stderr.write(`trim refused: ${outDir} is not empty. Nothing was written.\n`);
    process.exit(2);
  }
  const c = readCopy(copy);
  const b = c.board;
  const report = [];
  const dropped = [];
  const files = new Map(); // fixture-relative POSIX path → text

  // ---- board rows
  const ticketCost = (r) => {
    if (r.epic || !isTicketId(r.id)) return 0;
    const f = ticketFileFor(r.id, c.ticketFiles);
    return f ? f.size : 0;
  };
  const cost = (r) => r.bytes + ticketCost(r);
  const isOrphan = (r) => !r.epic && isTicketId(r.id) && ticketFileFor(r.id, c.ticketFiles) === null;
  const classesOf = (r) => [...r.classes, ...(isOrphan(r) ? ["orphan"] : [])];
  const allClasses = new Set(b.rows.flatMap(classesOf));
  const covered = new Set();
  const keptRows = new Set();
  const keepRow = (r) => {
    keptRows.add(r);
    for (const k of classesOf(r)) covered.add(k);
  };
  const longest = b.rows.reduce((m, r) => (m === null || r.bytes > m.bytes ? r : m), null);
  if (longest) keepRow(longest);
  const columns = [];
  for (const r of b.rows) if (!columns.includes(r.column)) columns.push(r.column);
  const pickFrom = (rs, limit) => {
    const byCost = [...rs].sort((x, y) => cost(x) - cost(y) || x.i - y.i);
    let n = rs.filter((r) => keptRows.has(r)).length;
    for (const k of allClasses) {
      if (n >= limit || covered.has(k)) continue;
      const r = byCost.find((x) => !keptRows.has(x) && classesOf(x).includes(k));
      if (r) {
        keepRow(r);
        n++;
      }
    }
    for (const r of byCost) {
      if (n >= limit) break;
      if (!keptRows.has(r)) {
        keepRow(r);
        n++;
      }
    }
  };
  // Done first, so its 24 rows cover what they can before the other columns pick.
  pickFrom(b.rows.filter((r) => r.column === "Done"), DONE_ROWS_KEPT);
  for (const col of columns) if (col !== "Done") pickFrom(b.rows.filter((r) => r.column === col), ROWS_PER_COLUMN);

  const keep = new Set();
  for (const h of b.headings) keep.add(h);
  if (b.commentBlocks.length) for (let i = b.commentBlocks[0].start; i <= b.commentBlocks[0].end; i++) keep.add(i);
  for (const u of b.updates.slice(0, 3)) keep.add(u.i);
  if (b.multiLineUpdates.length) {
    const m = b.multiLineUpdates.reduce((best, x) => (best === null || x.end - x.start < best.end - best.start ? x : best), null);
    for (let i = m.start; i <= m.end; i++) keep.add(i);
  }
  for (const d of b.doneNonRows.slice(0, 2)) keep.add(d.i);
  for (const r of keptRows) keep.add(r.i);
  files.set("board-root/board.md", emitLines(b.orig, keep));

  // ---- tickets
  const ownOrphans = b.rows.filter(isOrphan).length;
  const keptTicketRows = [...keptRows].filter((r) => !r.epic && isTicketId(r.id) && ticketFileFor(r.id, c.ticketFiles) !== null).sort((x, y) => x.i - y.i);
  const leftOut = new Set();
  if (ownOrphans < 2) {
    const candidates = keptTicketRows.filter((r) => r.column !== "Done" && r !== longest).sort((x, y) => ticketCost(y) - ticketCost(x));
    for (const r of candidates.slice(0, 2 - ownOrphans)) leftOut.add(r.id);
  }
  const seenTicket = new Set();
  for (const r of keptTicketRows) {
    if (leftOut.has(r.id)) continue;
    const f = ticketFileFor(r.id, c.ticketFiles);
    if (seenTicket.has(f.name)) continue;
    seenTicket.add(f.name);
    files.set(`board-root/tickets/${f.name}`, cleanBytes(readText(f.abs), dropped, `${LEGACY_STATE_ROOT_REL}/tickets/${f.name}`));
  }
  if (c.nestedDirs.length) {
    const d = c.nestedDirs[0];
    for (const f of [...d.files].sort((x, y) => x.size - y.size || (x.rel < y.rel ? -1 : 1)).slice(0, 2)) {
      files.set(`board-root/tickets/${d.name}/${f.rel}`, cleanBytes(readText(f.abs), dropped, `${LEGACY_STATE_ROOT_REL}/tickets/${d.name}/${f.rel}`));
    }
  }

  // ---- traceability
  const traceAbs = join(c.legacyRoot, "traceability.md");
  if (existsSync(traceAbs)) {
    const t = analyzeTrace(readText(traceAbs));
    const k = new Set([0]);
    t.lines.forEach((l, i) => {
      if (l.startsWith("_Updated:") && [...k].filter((x) => t.lines[x].startsWith("_Updated:")).length < 3) k.add(i);
    });
    if (t.headerAt !== -1) {
      k.add(t.headerAt);
      k.add(t.headerAt + 1);
      for (const i of t.rows.filter((i) => bytes(t.lines[i]) <= TRACE_SHORT_ROW_MAX_BYTES).slice(0, TRACE_ROWS_KEPT)) k.add(i);
      // One long row as well: the smallest row over BUDGETS.traceBytes, so a row no per-ticket trace file could hold is present.
      const long = t.rows.filter((i) => bytes(t.lines[i]) > BUDGETS.traceBytes).sort((x, y) => bytes(t.lines[x]) - bytes(t.lines[y]) || x - y)[0];
      if (long !== undefined) {
        k.add(long);
        report.push(`- long trace row kept: line ${long + 1}, ${bytes(t.lines[long])} bytes`);
      }
    }
    files.set("board-root/traceability.md", cleanBytes(emitLines(t.lines, k), dropped, `${LEGACY_STATE_ROOT_REL}/traceability.md`));
  }

  // ---- NFR catalog
  const nfrAbs = join(c.legacyRoot, "nfr-catalog.md");
  if (existsSync(nfrAbs)) {
    const raw = readText(nfrAbs);
    if (bytes(raw) <= NFR_WHOLE_MAX_BYTES) files.set("board-root/nfr-catalog.md", cleanBytes(raw, dropped, `${LEGACY_STATE_ROOT_REL}/nfr-catalog.md`));
    else {
      const n = analyzeNfr(raw);
      const k = new Set([0]);
      let ups = 0;
      for (let i = 0; i < n.firstSection; i++) if (n.stripped[i].startsWith("_Updated:") && ups < 3) (k.add(i), ups++);
      // first HTML comment block
      for (let i = 0, open = -1; i < n.lines.length; i++) {
        if (open === -1 && n.lines[i].includes("<!--")) open = i;
        if (open !== -1) {
          k.add(i);
          if (n.lines[i].includes("-->")) break;
        }
      }
      if (n.headerAt !== -1) {
        k.add(n.headerAt);
        k.add(n.headerAt + 1);
        for (const r of n.nfrRows) k.add(r.i);
      }
      const chosen = [];
      const bySize = [...n.sections].sort((x, y) => x.bytes - y.bytes || x.start - y.start);
      for (const want of [(s) => s.kind === "one", (s) => s.kind === "none", (s) => s.kind === "several", (s) => s.sub > 0]) {
        if (chosen.length >= NFR_SECTIONS_KEPT) break;
        if (chosen.some(want)) continue;
        const s = bySize.find((x) => want(x) && !chosen.includes(x));
        if (s) chosen.push(s);
      }
      for (const s of bySize) {
        if (chosen.length >= NFR_SECTIONS_KEPT) break;
        if (!chosen.includes(s)) chosen.push(s);
      }
      for (const s of chosen) for (let i = s.start; i <= s.end; i++) k.add(i);
      files.set("board-root/nfr-catalog.md", cleanBytes(emitLines(n.lines, k), dropped, `${LEGACY_STATE_ROOT_REL}/nfr-catalog.md`));
      report.push(`- NFR sections kept: ${chosen.map((s) => `line ${s.start + 1} (${s.kind}${s.sub ? `, ${s.sub} ###` : ""}, ${s.bytes} bytes)`).join("; ")}`);
    }
  }

  // ---- other top-level files
  const skipTop = new Set(["board.md", "traceability.md", "nfr-catalog.md"]);
  for (const e of c.rootEntries) {
    if (e.kind !== "file" || e.rel.includes("/") || skipTop.has(e.rel)) continue;
    if (e.size < OTHER_TOP_LEVEL_MAX_BYTES) files.set(`board-root/${e.rel}`, cleanBytes(readText(e.abs), dropped, `${LEGACY_STATE_ROOT_REL}/${e.rel}`));
    else report.push(`- not kept (at least 16 KiB): \`${LEGACY_STATE_ROOT_REL}/${e.rel}\` (${e.size} bytes)`);
  }

  // ---- progress
  if (existsSync(c.progressAbs)) {
    const p = analyzeProgress(readText(c.progressAbs));
    const k = new Set();
    for (let i = 0; i < p.preambleEnd; i++) k.add(i);
    let total = p.lines.slice(0, p.preambleEnd).reduce((n, l) => n + bytes(l) + 1, 0);
    const dated = p.sections.filter((s) => s.dated);
    const order = [...(dated.length ? [dated[0], dated[dated.length - 1]] : []), ...p.sections.filter((s) => !s.dated)];
    const used = new Set();
    for (const s of order) {
      if (total > BUDGETS.progressBytes) break;
      if (used.has(s) || total + s.bytes > PROGRESS_MAX_BYTES) continue;
      used.add(s);
      total += s.bytes;
      for (let i = s.start; i <= s.end; i++) k.add(i);
    }
    const text = cleanBytes(p.lines.filter((_, i) => k.has(i)).join("\n"), dropped, PROGRESS_REL);
    files.set("progress.md", text);
    report.push(`- progress sections kept: ${[...used].map((s) => `line ${s.start + 1}${s.dated ? " (dated)" : ""}`).join(", ")}`);
  }

  // ---- context
  const stages = queueStages(c.queueAbs);
  const ticketRows = b.rows.filter((r) => !r.epic);
  const knownIds = [...new Set([...ticketRows.filter((r) => isTicketId(r.id)).map((r) => r.id), ...c.ticketFiles.map((f) => /^([A-Z][A-Z0-9]{0,15}-\d{1,9})/.exec(f.name)?.[1]).filter(Boolean)])].sort();
  const doneIds = new Set(b.rows.filter((r) => r.column === "Done").map((r) => r.id));
  const folders = analyzeContext(c.contextAbs, knownIds, doneIds, stages).filter(
    (f) =>
      f.kind === "dir" &&
      !f.odd &&
      f.files.length > 0 &&
      f.files.every((x) => PINNED_EXT.has(x.rel.slice(x.rel.lastIndexOf(".")))) &&
      f.entries.every((x) => !x.rel.split("/").includes(LEGACY_STATE_ROOT_REL)) &&
      f.files.every((x) => !readFileSync(x.abs).includes(0)),
  );
  const bySize = [...folders].sort((x, y) => x.bytes - y.bytes || (x.name < y.name ? -1 : 1));
  const wants = [
    ["one Done ticket", (f) => f.ids.length === 1 && f.allDone],
    ["a ticket that is not Done", (f) => f.ids.length === 1 && !f.someDone],
    ["two IDs, one Done", (f) => f.ids.length === 2 && f.someDone && !f.allDone],
    ["no ID", (f) => f.ids.length === 0 && f.hyphenless.length === 0],
    ["all IDs Done, with a queue entry", (f) => f.allDone && f.queued.length > 0],
    ["all IDs Done, with no queue entry", (f) => f.allDone && f.queued.length === 0],
    ["an ID written without its hyphen", (f) => f.ids.length === 0 && f.hyphenless.length > 0],
    ["a nested directory", (f) => f.nested],
    ["several IDs, all Done", (f) => f.ids.length > 1 && f.allDone],
  ];
  const pickedCtx = [];
  for (const [label, want] of wants) {
    if (pickedCtx.length >= CONTEXT_FOLDERS_KEPT) break;
    const f = bySize.find((x) => want(x) && !pickedCtx.some((p) => p.f === x));
    if (f) pickedCtx.push({ label, f });
    else report.push(`- context class not found among candidates: ${label}`);
  }
  for (const { f } of pickedCtx) {
    for (const x of f.files) files.set(`context/${f.name}/${x.rel}`, cleanBytes(readText(x.abs), dropped, `${CONTEXT_REL}/${f.name}/${x.rel}`));
  }

  // ---- size gate, then write
  let total = 0;
  for (const t of files.values()) total += bytes(t);
  if (total > FIXTURE_MAX_BYTES) {
    process.stderr.write(`trim refused: the fixture would be ${total} bytes, over ${FIXTURE_MAX_BYTES}. Nothing was written.\n`);
    const byPart = new Map();
    for (const [p, t] of files) {
      const part = p.startsWith("board-root/tickets/") ? "board-root/tickets/" : p.startsWith("context/") ? "context/" : p;
      byPart.set(part, (byPart.get(part) ?? 0) + bytes(t));
    }
    for (const [p, n] of [...byPart].sort((x, y) => y[1] - x[1])) process.stderr.write(`  ${n}  ${p}\n`);
    process.exit(1);
  }
  for (const [p, t] of [...files].sort((x, y) => (x[0] < y[0] ? -1 : 1))) {
    const abs = join(outDir, ...p.split("/"));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, t);
  }

  // ---- report
  const say = [];
  say.push("## Trim output");
  say.push("");
  say.push(`Written by \`node .planning/phases/38-install-migrate-v3/38-fixture-tools.mjs trim <copy> install/fixtures/pre-v3-chess\`: ${files.size} files, ${total} bytes.`);
  say.push("");
  say.push("| Fixture path | Bytes |");
  say.push("|--------------|-------|");
  for (const [p, t] of [...files].sort((x, y) => (x[0] < y[0] ? -1 : 1))) say.push(`| \`${p}\` | ${bytes(t)} |`);
  say.push("");
  say.push(`- board rows kept: ${keptRows.size} (${[...keptRows].sort((x, y) => x.i - y.i).map((r) => `\`${r.id}\` ${r.column ?? "outside"} [${classesOf(r).join(", ")}]`).join("; ")})`);
  say.push(`- row shape classes in the copy: ${[...allClasses].sort().join(", ")}; covered by the kept rows: ${[...covered].filter((k) => allClasses.has(k)).sort().join(", ")}`);
  say.push(`- longest row kept: \`${longest?.id}\`, ${longest?.bytes} bytes`);
  say.push(`- orphan rows: ${ownOrphans} of the copy's own${leftOut.size ? `; ticket files left out to make orphans: ${[...leftOut].map((id) => `\`${id}\``).join(", ")}` : ""}`);
  say.push(`- context folders kept: ${pickedCtx.map(({ label, f }) => `\`${f.name}\` (${label}, ${f.bytes} bytes)`).join("; ")}`);
  say.push(...report);
  say.push(`- secret-shaped lines left out: ${dropped.length ? dropped.map((d) => `\`${d}\``).join(", ") : "none"}`);
  say.push("");
  process.stdout.write(say.join("\n"));
}

// ── entry ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const [cmd, ...args] = process.argv.slice(2);
if (cmd === "census" && args.length === 1) census(args[0]);
else if (cmd === "trim" && args.length === 2) trim(args[0], args[1]);
else {
  process.stderr.write("usage: 38-fixture-tools.mjs census <copy> | trim <copy> <out>\n");
  process.exit(2);
}
