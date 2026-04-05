import type { ReportBand, ReportDefinition } from "../types";

export function newColumnId(): string {
  return `col_${Math.random().toString(36).slice(2, 9)}`;
}

export function replaceBands(def: ReportDefinition, bands: ReportBand[]): ReportDefinition {
  return { ...def, bands };
}

export function updateBandAt(def: ReportDefinition, index: number, band: ReportBand): ReportDefinition {
  const bands = def.bands.slice();
  bands[index] = band;
  return { ...def, bands };
}

export function insertBand(def: ReportDefinition, index: number, band: ReportBand): ReportDefinition {
  const bands = def.bands.slice();
  bands.splice(index, 0, band);
  return { ...def, bands };
}

export function removeBandAt(def: ReportDefinition, index: number): ReportDefinition {
  const bands = def.bands.filter((_, i) => i !== index);
  return { ...def, bands };
}

export function moveBand(def: ReportDefinition, from: number, to: number): ReportDefinition {
  if (to < 0 || to >= def.bands.length) return def;
  const bands = def.bands.slice();
  const [item] = bands.splice(from, 1);
  if (!item) return def;
  bands.splice(to, 0, item);
  return { ...def, bands };
}

export function updateMeta(def: ReportDefinition, meta: ReportDefinition["meta"]): ReportDefinition {
  return { ...def, meta: { ...meta } };
}
