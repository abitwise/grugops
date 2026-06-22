// trace-render.ts — the requirement→code→test→release trace render (MIGR-03, D-01/D-04/D-06).
//
// The human-facing traceability matrix at plans/traceability.md is GENERATED, never hand-maintained:
// it is the deterministic product of `node scripts/trace-render.js`. The shared verified-context
// NOTES under .grugops/context/<task>/notes/ are the SOURCE OF TRUTH; their `refs` carry the
// requirement / code / test / UAT / release links a ticket accrues as work is done. traceability.md
// is the derived, human-readable mirror of those refs (D-01 Option A: it SURVIVES as a render of note
// refs — it is never hand-maintained and never deleted). This is the same render-family seam Phase 20
// deferred to Phase 24 (D-02), through which role output is published.
//
// One row per ticket id, keyed by the ticket-shaped ref a note carries; columns
//   Requirement | Code | Tests | UAT | Release
// are filled (D-04) from each note's `refs` (D-06), classified deterministically by ref shape — NOT
// from the index.md at/kind/by columns. Ticket ids appear verbatim in the rendered rows so the
// validator's `trace.includes(id)` completeness check (validate-agent-factory.ts) stays a minimal,
// path-unchanged re-point (A2).
//
//   node scripts/trace-render.js                 # regen plans/traceability.md (real roots)
//   node scripts/trace-render.js <ctxRoot> <plansRoot>   # explicit roots (tests pass temp dirs)
//
// Build model (D-13): node:fs + node:path ONLY (plus the readContext/atomicWrite helpers re-used from
// the committed context-io.js) — ZERO host runtime deps. Authored in TypeScript, compiled with `tsc`
// to a committed scripts/trace-render.js; the freshness.ts build-output gate proves the committed .js
// is a faithful build of this .ts.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this is a trace surface, never
// caveman voice).
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readContext, atomicWrite } from "./context-io.js";
// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");
const DEFAULT_CONTEXT_ROOT = join(ROOT, ".grugops", "context");
const DEFAULT_PLANS_ROOT = join(ROOT, "plans");
// ── cell(): escape free-text before it enters a pipe-delimited markdown table cell. ─────────────
// Cloned from context-io.ts (which cloned it from generate-catalog.ts): backslash first, then pipe,
// then flatten newlines to a space — so a ref carrying a literal `|` never breaks the table.
function cell(s) {
    return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
// ── Ref classification (D-06) ───────────────────────────────────────────────────────────────────
// The five trace columns are derived from each note's `refs` by ref SHAPE. The row KEY is the
// ticket-shaped ref the note carries. The classifier is deterministic and prefix-anchored so the
// render is byte-reproducible.
//
// Ticket id: a `<PREFIX>-<number>` ref whose prefix is NOT one of the reserved structural prefixes
// (EPIC / FEAT / NFR / ADR / RISK / REL / INC / UAT). This matches the traceability.md ID scheme
// (config id_prefix, default ABC) without hard-coding the project prefix.
const RESERVED_PREFIXES = new Set(["EPIC", "FEAT", "NFR", "ADR", "RISK", "REL", "INC", "UAT"]);
const ID_SHAPE = /^([A-Za-z][A-Za-z0-9]*)-(\d+)$/;
function isTicketRef(ref) {
    const m = ID_SHAPE.exec(ref);
    return m !== null && !RESERVED_PREFIXES.has(m[1].toUpperCase());
}
// A ref looks like a Tests link when it names a test file or an e2e path.
function isTestRef(ref) {
    return /(^|[\/.])(test|spec)([\/.]|$)/i.test(ref) || /(^|\/)e2e(\/|$)/i.test(ref);
}
// A ref looks like a Code link when it names a PR (#123) or a source file/path (and is NOT a test ref).
function isCodeRef(ref) {
    if (isTestRef(ref))
        return false;
    return /^#\d+$/.test(ref) || ref.includes("/") || /\.[A-Za-z0-9]+$/.test(ref);
}
function classify(ref) {
    const m = ID_SHAPE.exec(ref);
    const prefix = m ? m[1].toUpperCase() : "";
    if (prefix === "UAT")
        return "UAT";
    if (prefix === "REL")
        return "Release";
    if (prefix === "NFR" || prefix === "EPIC" || prefix === "FEAT")
        return "Requirement";
    if (isTestRef(ref))
        return "Tests";
    if (isTicketRef(ref))
        return null; // the row key, never a cell value
    if (isCodeRef(ref))
        return "Code";
    // A bare requirement-style token (e.g. REQ-ish ALL-CAPS-id that is not a structural prefix and not
    // a path) is treated as a Requirement link.
    if (m)
        return "Requirement";
    return null;
}
function emptyRow(id) {
    return { id, Requirement: [], Code: [], Tests: [], UAT: [], Release: [] };
}
// Append `value` to `bucket` only if not already present (preserve first-seen order; dedup keeps the
// render stable when the same ref appears on several notes).
function pushUnique(bucket, value) {
    if (!bucket.includes(value))
        bucket.push(value);
}
// ── List the task directories under a context root (each holds a notes/ dir). ───────────────────
function listTasks(contextRoot) {
    if (!existsSync(contextRoot))
        return [];
    return readdirSync(contextRoot, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort(); // deterministic task order
}
// ── Build the ticket rows from every note's refs across every task. ─────────────────────────────
// A note contributes to a ticket row when its refs carry a ticket-shaped id. Every OTHER ref on that
// note is classified into one of the five columns. A note with no ticket ref contributes nothing (it
// is a non-trace note — a soft observation/claim with no ticket linkage).
export function buildRows(contextRoot) {
    const rows = new Map();
    for (const task of listTasks(contextRoot)) {
        let notes;
        try {
            notes = readContext(task, contextRoot);
        }
        catch {
            continue; // a task name the allowlist rejects, or an unreadable notes dir — skip, never crash
        }
        for (const n of notes) {
            const ticketIds = n.refs.filter(isTicketRef);
            if (ticketIds.length === 0)
                continue;
            for (const ticketId of ticketIds) {
                let row = rows.get(ticketId);
                if (!row) {
                    row = emptyRow(ticketId);
                    rows.set(ticketId, row);
                }
                for (const ref of n.refs) {
                    if (ref === ticketId)
                        continue; // the key itself is never a cell
                    const col = classify(ref);
                    if (col !== null)
                        pushUnique(row[col], ref);
                }
            }
        }
    }
    // Deterministic row order: by ticket id (lexicographic).
    return [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
}
// ── render: read notes → emit byte-reproducible plans/traceability.md. ──────────────────────────
// GENERATED header naming the re-run command; the five-column table; deterministic ticket-id sort;
// cell()-escaped cells; single trailing newline via a trailing "" push; atomicWrite.
export function renderTraceability(contextRoot = DEFAULT_CONTEXT_ROOT, plansRoot = DEFAULT_PLANS_ROOT) {
    const rows = buildRows(contextRoot);
    const md = [];
    md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/trace-render.js -->");
    md.push("# Traceability Matrix");
    md.push("");
    md.push("| Requirement | Code | Tests | UAT | Release |");
    md.push("| --- | --- | --- | --- | --- |");
    for (const r of rows) {
        // The Requirement cell leads with the ticket id (verbatim, so the validator trace.includes(id)
        // re-point stays minimal — A2), followed by any requirement-shaped refs.
        const requirement = [r.id, ...r.Requirement].map(cell).join(", ");
        const code = r.Code.map(cell).join(", ");
        const tests = r.Tests.map(cell).join(", ");
        const uat = r.UAT.map(cell).join(", ");
        const release = r.Release.map(cell).join(", ");
        md.push(`| ${requirement} | ${code} | ${tests} | ${uat} | ${release} |`);
    }
    md.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(plansRoot, "traceability.md"), md.join("\n"));
}
// ── CLI entrypoint (only when run directly, never on import) ─────────────────────────────────────
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    const [ctxRoot, plansRoot] = process.argv.slice(2);
    try {
        renderTraceability(ctxRoot ?? DEFAULT_CONTEXT_ROOT, plansRoot ?? DEFAULT_PLANS_ROOT);
        console.log("rendered plans/traceability.md from the shared-context note refs.");
        process.exit(0);
    }
    catch (e) {
        console.error(`trace-render: ${e.message}`);
        process.exit(1);
    }
}
