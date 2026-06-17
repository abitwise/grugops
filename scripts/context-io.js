// context-io.ts — the ONLY sanctioned write path into the shared verified context (SCTX-01/02/04).
//
// Provides readContext / appendNote / atomicWrite, a deterministic zero-token index.md +
// index.jsonl render, and a structural validator that fails on a missing provenance field.
// Roles and workflows never raw-write .grugops/context/ — they call this helper (enforced by the
// guard_context_writes foundation guard, plan 20-03). The note files under notes/ are the markdown
// source of truth; index.md + index.jsonl are derived, byte-reproducible, freshness-gated renders.
//
// Schema (the contract): agent-factory/contracts/context-note.md. A note is YAML frontmatter +
// markdown body. The provenance fence keys are kind / by / at / verified_by / confidence / refs
// (a YAML list) / supersedes (a note-id ref or empty). The six kinds are claim / finding / decision
// / failed-attempt / observation / artifact-ref. Required fields: kind, by, at, confidence.
//
// Build model (D-13): node:fs + node:crypto + node:path ONLY — ZERO host runtime deps. Authored in
// TypeScript, compiled with `tsc` to a committed scripts/context-io.js that host machines and CI run
// with bare Node; the freshness.ts build-output gate (OUTPUT_DIRS includes scripts/) proves the
// committed .js is a faithful build of this .ts.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — trace + safety surface, never
// caveman voice).
//
// CLI (so plan-03's freshness gate can mirror-spawn the render, and the oracle can drive it):
//   node scripts/context-io.js validate <noteFile>           # exit 0 = valid, 1 = structural FAIL
//   node scripts/context-io.js render <task> [contextRoot]   # regen index.md + index.jsonl
//
// Path-traversal mitigation (ASVS V12, T-20-01): the task name is validated against a strict
// allowlist (^[A-Za-z0-9._-]+$, rejecting .. / separators / absolute paths) before it is joined
// under the context root. The context root itself is a fixed literal (.grugops/context) in
// production; tests pass an explicit temp root.
import { randomUUID } from "node:crypto";
import { writeFileSync, readFileSync, readdirSync, renameSync, unlinkSync, mkdirSync, existsSync, } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// ── The six note kinds (SCTX-01) ──────────────────────────────────────────────────────────────
export const NOTE_KINDS = [
    "claim",
    "finding",
    "decision",
    "failed-attempt",
    "observation",
    "artifact-ref",
];
// ── Fixed context root (production). Tests pass an explicit root. ───────────────────────────────
const ROOT = join(import.meta.dirname, "..");
const DEFAULT_CONTEXT_ROOT = join(ROOT, ".grugops", "context");
// ── Task-name allowlist (path-traversal mitigation, T-20-01) ────────────────────────────────────
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeTask(task) {
    // Reject empty, `.`/`..`, path separators, absolute paths, and anything outside the allowlist.
    if (!TASK_NAME_RE.test(task) || task === "." || task === "..") {
        throw new Error(`context-io: invalid task name "${task}" — must match ^[A-Za-z0-9._-]+$ ` +
            "(no path separators, no .., no absolute paths)");
    }
}
function parseNote(text) {
    const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m)
        return null; // no frontmatter fence → caller treats as a structural fail
    const fmLines = m[1].split("\n");
    const body = m[2] ?? "";
    const scalars = {};
    let refs = [];
    for (let i = 0; i < fmLines.length; i++) {
        const line = fmLines[i];
        // A `refs:` key with no inline value starts a YAML list block: consume following `  - x` lines.
        const refsBlock = line.match(/^refs:\s*$/);
        if (refsBlock) {
            const collected = [];
            while (i + 1 < fmLines.length && /^\s*-\s+/.test(fmLines[i + 1])) {
                collected.push(fmLines[++i].replace(/^\s*-\s+/, "").trim());
            }
            refs = collected;
            continue;
        }
        const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
        if (kv) {
            const key = kv[1];
            const val = kv[2].trim();
            if (key === "refs") {
                // Single-line comma form: `refs: a, b, c` (empty → []).
                refs = val === "" ? [] : val.split(",").map((s) => s.trim()).filter((s) => s !== "");
            }
            else {
                scalars[key] = val;
            }
        }
    }
    return { scalars, refs, body };
}
// ── Validate a note's structure (SC-1). Returns a finding string array; empty = valid. ──────────
export function validate(text) {
    const findings = [];
    const parsed = parseNote(text);
    if (!parsed) {
        return ["structural FAIL: no YAML frontmatter fence (--- ... ---) found"];
    }
    const { scalars } = parsed;
    // Required provenance fields: a missing one is a structural FAIL naming the field.
    for (const field of ["kind", "by", "at", "confidence"]) {
        if (scalars[field] === undefined || scalars[field] === "") {
            findings.push(`structural FAIL: missing required provenance field "${field}"`);
        }
    }
    // kind, when present, must be one of the six values; a bad kind names the offending value.
    if (scalars.kind !== undefined && scalars.kind !== "") {
        if (!NOTE_KINDS.includes(scalars.kind)) {
            findings.push(`structural FAIL: kind "${scalars.kind}" is not one of the six values ` +
                `(${NOTE_KINDS.join(", ")})`);
        }
    }
    return findings;
}
// ── atomicWrite: write a unique temp sibling, then rename onto the final path. ──────────────────
// POSIX: rename atomically replaces. Windows (MoveFileEx): not atomic and fails with
// EPERM/EEXIST/EACCES when the destination already exists — the unlink-then-rename branch handles
// that. For note publication the final path is ALWAYS fresh/unique so the Windows branch never
// fires; it exists for the single-writer derived-artifact (index.*) regen, which is freshness-gated.
export function atomicWrite(finalPath, data) {
    const tmp = `${finalPath}.tmp-${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    writeFileSync(tmp, data, "utf8");
    try {
        renameSync(tmp, finalPath);
    }
    catch (e) {
        const code = e.code;
        if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
            // Windows branch: remove the destination, then retry the rename.
            try {
                unlinkSync(finalPath);
            }
            catch {
                /* not-present is fine */
            }
            renameSync(tmp, finalPath);
        }
        else {
            // Any other error: best-effort temp cleanup, then rethrow.
            try {
                unlinkSync(tmp);
            }
            catch {
                /* best-effort */
            }
            throw e;
        }
    }
}
// ── Compose a note's frontmatter + body from a validated NoteInput. ─────────────────────────────
function composeNote(note, body) {
    const refsBlock = note.refs.length === 0 ? "refs:\n" : "refs:\n" + note.refs.map((r) => `  - ${r}`).join("\n") + "\n";
    return ("---\n" +
        `kind: ${note.kind}\n` +
        `by: ${note.by}\n` +
        `at: ${note.at}\n` +
        `verified_by: ${note.verified_by}\n` +
        `confidence: ${note.confidence}\n` +
        refsBlock +
        `supersedes: ${note.supersedes ?? ""}\n` +
        "---\n\n" +
        (body.endsWith("\n") ? body : body + "\n"));
}
// ── Note id: <at-compact>-<by>-<kind>-<nonce>. The nonce is a collision nonce, NOT a security token.
function noteId(note) {
    const atCompact = note.at.replace(/[-:]/g, "").replace(/\.\d+/, ""); // 2026-06-17T14:23:05Z → 20260617T142305Z
    const nonce = randomUUID().slice(0, 8); // node:crypto — lock-free same-millisecond uniqueness
    return `${atCompact}-${note.by}-${note.kind}-${nonce}`;
}
// ── appendNote: validate → compose → atomicWrite to a FRESH unique notes/<id>.md (append-only). ──
// Writes one NEW file; never mutates a shared file (SCTX-04). The publish target is always unique,
// so the cross-platform rename-onto-existing hazard does not apply to note publication.
export function appendNote(task, note, body, contextRoot = DEFAULT_CONTEXT_ROOT) {
    assertSafeTask(task);
    const text = composeNote(note, body);
    const findings = validate(text);
    if (findings.length > 0) {
        throw new Error(`context-io.appendNote: refusing to write an invalid note:\n${findings.join("\n")}`);
    }
    const notesDir = join(contextRoot, task, "notes");
    mkdirSync(notesDir, { recursive: true });
    const id = noteId(note);
    atomicWrite(join(notesDir, `${id}.md`), text);
    return id;
}
// ── readContext: parse every notes/<id>.md into a NoteRecord[] (id from the filename). ──────────
export function readContext(task, contextRoot = DEFAULT_CONTEXT_ROOT) {
    assertSafeTask(task);
    const notesDir = join(contextRoot, task, "notes");
    if (!existsSync(notesDir))
        return [];
    const records = [];
    for (const file of readdirSync(notesDir)) {
        if (!file.endsWith(".md"))
            continue;
        const text = readFileSync(join(notesDir, file), "utf8");
        const parsed = parseNote(text);
        if (!parsed)
            continue; // skip an unparseable file rather than crash the read
        const s = parsed.scalars;
        records.push({
            id: file.replace(/\.md$/, ""),
            kind: s.kind ?? "",
            by: s.by ?? "",
            at: s.at ?? "",
            verified_by: s.verified_by ?? "",
            confidence: s.confidence ?? "",
            refs: parsed.refs,
            supersedes: s.supersedes && s.supersedes !== "" ? s.supersedes : null,
            body: parsed.body.trim(),
        });
    }
    return records;
}
// ── currentState: deterministic replay (SCTX-04). Sort by at (ISO lexicographic) with note-id ──
// tiebreak; fold out any note whose id appears in another note's supersedes. NEVER file position
// or mtime.
export function currentState(notes) {
    const ordered = [...notes].sort((a, b) => a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id));
    const superseded = new Set(ordered.map((n) => n.supersedes).filter((x) => x !== null && x !== ""));
    return ordered.filter((n) => !superseded.has(n.id));
}
// ── cell(): escape free-text before it enters a pipe-delimited markdown table cell (T-20-02). ───
// Cloned from generate-catalog.ts: backslash first, then pipe, then flatten newlines to a space.
function cell(s) {
    return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
// ── First line of a body, for a compact excerpt in the index.md table. ──────────────────────────
function bodyExcerpt(body) {
    return body.trim().split("\n")[0]?.trim() ?? "";
}
// ── Deterministic JSONL event line: FIXED key order, body excluded (event index only). ──────────
function toJsonl(n) {
    return JSON.stringify({
        id: n.id,
        kind: n.kind,
        by: n.by,
        at: n.at,
        verified_by: n.verified_by,
        confidence: n.confidence,
        refs: n.refs,
        supersedes: n.supersedes,
    });
}
// ── render: read notes/ → emit byte-reproducible index.md + index.jsonl (SCTX-03/04). ──────────
// Sorted by at (ISO lexicographic) with note-id tiebreak; no wall-clock timestamps of its own;
// single trailing newline. Superseded notes are folded out of the live state and listed in a
// history section so the audit trail stays visible. Conforms to task-notes.template.md.
export function render(task, contextRoot = DEFAULT_CONTEXT_ROOT) {
    assertSafeTask(task);
    const taskDir = join(contextRoot, task);
    const all = readContext(task, contextRoot);
    // Deterministic order for ALL notes (drives both the JSONL emit and the supersede fold).
    const ordered = [...all].sort((a, b) => a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id));
    const supersededIds = new Set(ordered.map((n) => n.supersedes).filter((x) => x !== null && x !== ""));
    const live = ordered.filter((n) => !supersededIds.has(n.id));
    const history = ordered.filter((n) => supersededIds.has(n.id));
    // ── index.jsonl: one event line per note, in the deterministic order, body excluded. ──
    const jsonlLines = ordered.map(toJsonl);
    jsonlLines.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(taskDir, "index.jsonl"), jsonlLines.join("\n"));
    // ── index.md: generated header + title + current-state table + history table. ──
    const md = [];
    md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/context-io.js render <task> -->");
    md.push(`# Context: ${cell(task)}`);
    md.push("");
    md.push("## Current state");
    md.push("");
    md.push("| at | kind | by | confidence | verified_by | note |");
    md.push("| --- | --- | --- | --- | --- | --- |");
    for (const n of live) {
        md.push(`| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(n.confidence)} | ` +
            `${cell(n.verified_by)} | ${cell(bodyExcerpt(n.body))} |`);
    }
    if (history.length > 0) {
        md.push("");
        md.push("## Superseded (history)");
        md.push("");
        md.push("| at | kind | by | superseded-by | note |");
        md.push("| --- | --- | --- | --- | --- |");
        // For each superseded note, name the latest note that supersedes it (deterministic).
        for (const n of history) {
            const supersededBy = ordered
                .filter((o) => o.supersedes === n.id)
                .map((o) => o.id)
                .sort()
                .join(", ");
            md.push(`| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(supersededBy)} | ` +
                `${cell(bodyExcerpt(n.body))} |`);
        }
    }
    md.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(taskDir, "index.md"), md.join("\n"));
}
// ── CLI entrypoint (only when run directly, never on import) ────────────────────────────────────
// import.meta.url === the executed file's URL when run via `node context-io.js ...`.
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    const [cmd, ...rest] = process.argv.slice(2);
    try {
        if (cmd === "validate") {
            const noteFile = rest[0];
            if (!noteFile) {
                console.error("usage: context-io.js validate <noteFile>");
                process.exit(1);
            }
            const findings = validate(readFileSync(noteFile, "utf8"));
            if (findings.length > 0) {
                for (const f of findings)
                    console.error(f);
                process.exit(1);
            }
            console.log("note valid: all required provenance fields present, kind is one of the six.");
            process.exit(0);
        }
        else if (cmd === "render") {
            const task = rest[0];
            const contextRoot = rest[1]; // optional explicit root (tests pass a temp dir)
            if (!task) {
                console.error("usage: context-io.js render <task> [contextRoot]");
                process.exit(1);
            }
            render(task, contextRoot ?? DEFAULT_CONTEXT_ROOT);
            console.log(`rendered index.md + index.jsonl for task "${task}".`);
            process.exit(0);
        }
        else {
            console.error("usage: context-io.js <validate <noteFile> | render <task> [contextRoot]>");
            process.exit(1);
        }
    }
    catch (e) {
        console.error(`context-io: ${e.message}`);
        process.exit(1);
    }
}
