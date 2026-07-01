// measure-cost.ts — the DOGF-03 aggregate token-cost measurement harness (D-10 / D-11).
//
// grugops claims a cost story for its dual-path factory. This harness is the HONEST instrument
// behind that claim: it parses the aggregate token-usage object that a Tier-2 authed
// `claude -p <request> --output-format json` run emits, so grugops's cost can one day be reported
// with grugops's OWN numbers and a recorded capture date.
//
// The single load-bearing honesty rule (D-10): when no aggregate usage object is present — OR when
// the usage field schema has not been confirmed against a real authed capture — this harness returns
// the honest `UNKNOWN - verify` note and NEVER a fabricated number. It also NEVER borrows an external
// tool's published cost-reduction benchmark and asserts it as grugops's own. A number appears here
// only after a real authed run's usage shape is mapped in and its capture date recorded — that is
// deliberately future work, not this session.
//
// STANDING ASSUMPTION (this session): the exact `claude --output-format json` usage field schema is
// `UNKNOWN - verify` — it was NOT captured this session (capturing-and-mapping a fabricated shape is
// the token-cost fabrication trap this harness exists to refuse). So `measureCost` reads the usage
// object DEFENSIVELY at candidate schema paths, never throws on a missing/unexpected shape, and — until
// the schema is confirmed — returns `UNKNOWN - verify` even for a usage-shaped input.
//
// This harness is pure and side-effect-free: it parses a value the caller already has. It does NOT
// invoke the live `claude` CLI (the real-number capture is a separate Tier-2 concern that does not
// gate this phase — D-11: cost never gates the retirement).
//
// Node stdlib only. Zero npm deps. Drives no I/O.

// The honest-default marker. Every path that cannot confirm a real number carries this string, so a
// caller (or a fixture test) can assert the harness refused to fabricate.
const UNKNOWN_VERIFY = "UNKNOWN - verify";

// The shape `measureCost` returns. The numeric fields are OPTIONAL and are populated ONLY once a real
// authed usage schema is confirmed and mapped (future work); until then only `note` is set, carrying
// the `UNKNOWN - verify` explanation. `note` is mandatory and is never empty.
export interface CostMeasurement {
  input?: number;
  output?: number;
  total?: number;
  note: string;
}

// Locate a candidate aggregate-usage object from a parsed `--output-format json` payload without ever
// throwing. Both candidate paths are `UNKNOWN - verify` until confirmed against a real authed capture:
//   - `json.usage`         — a top-level aggregate usage object, OR
//   - `json.result.usage`  — usage nested under a `result` envelope.
// Returns the first object-shaped candidate found, or `undefined` when none is present. Reads are fully
// defensive: any non-object input (null, string, number, array, garbage) simply yields `undefined`.
function locateUsage(json: unknown): Record<string, unknown> | undefined {
  if (json === null || typeof json !== "object") return undefined;
  const record = json as Record<string, unknown>;
  const candidates: unknown[] = [
    record.usage,
    (record.result as Record<string, unknown> | undefined)?.usage,
  ];
  for (const candidate of candidates) {
    if (candidate !== null && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }
  }
  return undefined;
}

// Measure aggregate token cost from a parsed `claude --output-format json` payload.
//
// Contract (D-10):
//   - No usage object located            → `{ note: "UNKNOWN - verify: ..." }`, no numeric fields.
//   - Usage object present but schema
//     unconfirmed this session           → STILL `{ note: "UNKNOWN - verify: ..." }`, no numeric fields.
//   - Malformed / garbage input          → never throws; `{ note: "UNKNOWN - verify: ..." }`.
// A numeric field is emitted ONLY after a real authed usage schema is confirmed and mapped here with a
// recorded capture date — never fabricated, and never an external tool's published benchmark.
export function measureCost(json: unknown): CostMeasurement {
  let usage: Record<string, unknown> | undefined;
  try {
    usage = locateUsage(json);
  } catch {
    // Defensive belt-and-braces: even an exotic getter that throws must not crash the harness.
    return {
      note: `${UNKNOWN_VERIFY}: could not read a usage object from the --output-format json payload`,
    };
  }

  if (usage === undefined) {
    return {
      note: `${UNKNOWN_VERIFY}: no aggregate usage object in the --output-format json output`,
    };
  }

  // A usage-shaped object is present, but the exact input/output/total field names are not confirmed
  // against a real authed capture this session. The honest default holds: return `UNKNOWN - verify`
  // and populate NO numeric field. Mapping real fields (with a recorded capture date) is future work.
  return {
    note: `${UNKNOWN_VERIFY}: usage field schema not confirmed against a real authed capture this session`,
  };
}
