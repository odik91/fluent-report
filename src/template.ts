import type { ReportData } from "./types";

export function getByPath(obj: unknown, path: string): unknown {
  const p = path.trim();
  if (!p) return obj;
  const parts = p.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const key of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export function renderTemplate(template: string, data: ReportData): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, raw: string) => {
    const v = getByPath(data, raw.trim());
    if (v == null) return "";
    if (typeof v === "object") {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    }
    return String(v);
  });
}
