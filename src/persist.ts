import { REPORT_DEFINITION_VERSION, type ReportDefinition, type ReportBand } from "./types";

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function assertBand(b: unknown): asserts b is ReportBand {
  if (!isObject(b) || typeof b.type !== "string") throw new Error("Invalid band");
  if (b.type === "text") {
    if (typeof b.value !== "string") throw new Error("Text band requires string value");
    return;
  }
  if (b.type === "spacer") {
    if (typeof b.heightMm !== "number") throw new Error("Spacer band requires heightMm");
    return;
  }
  if (b.type === "table") {
    if (typeof b.dataPath !== "string") throw new Error("Table band requires dataPath");
    if (!Array.isArray(b.columns)) throw new Error("Table band requires columns array");
    for (const col of b.columns) {
      if (!isObject(col)) throw new Error("Invalid column");
      if (typeof col.id !== "string" || typeof col.header !== "string" || typeof col.field !== "string") {
        throw new Error("Column requires id, header, field");
      }
    }
    return;
  }
  throw new Error(`Unknown band type: ${b.type}`);
}

/**
 * Parse JSON stored from DB/API into a `ReportDefinition`. Throws on invalid shape.
 */
export function parseReportDefinition(json: string): ReportDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new Error("Invalid JSON");
  }
  if (!isObject(parsed)) throw new Error("Definition must be an object");
  if (parsed.version !== REPORT_DEFINITION_VERSION) {
    throw new Error(`Unsupported definition version: ${String(parsed.version)}`);
  }
  if (!isObject(parsed.meta)) throw new Error("Definition.meta required");
  if (!Array.isArray(parsed.bands)) throw new Error("Definition.bands must be an array");
  for (const band of parsed.bands) assertBand(band);
  return parsed as unknown as ReportDefinition;
}

export function serializeReportDefinition(definition: ReportDefinition): string {
  return JSON.stringify(definition);
}

export function cloneReportDefinition(definition: ReportDefinition): ReportDefinition {
  return JSON.parse(JSON.stringify(definition)) as ReportDefinition;
}
