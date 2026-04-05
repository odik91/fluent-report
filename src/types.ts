export const REPORT_DEFINITION_VERSION = "1" as const;

export type PageFormat = "a4" | "a3" | "letter" | "legal";

export interface ReportMeta {
  title?: string;
  subject?: string;
  author?: string;
  keywords?: string;
  format?: PageFormat;
  orientation?: "portrait" | "landscape";
  marginMm?: { top?: number; right?: number; bottom?: number; left?: number };
  defaultFontSize?: number;
}

export type HAlign = "left" | "center" | "right";

export interface TextBand {
  type: "text";
  /** Static text and/or `{{path.to.field}}` placeholders against root `ReportData` */
  value: string;
  fontSize?: number;
  align?: HAlign;
  bold?: boolean;
  marginBottomMm?: number;
}

export interface SpacerBand {
  type: "spacer";
  heightMm: number;
}

export type ColumnFormat = "text" | "number" | "integer" | "currency" | "date" | "datetime";

export interface TableColumn {
  id: string;
  header: string;
  /** Path relative to each row object */
  field: string;
  /** Relative weight when distributing column width (default 1) */
  width?: number;
  align?: HAlign;
  format?: ColumnFormat;
  locale?: string;
  currency?: string;
  dateStyle?: "short" | "medium" | "long";
  timeStyle?: "short" | "medium" | "long";
}

export interface TableBand {
  type: "table";
  /** Dot path to an array on `ReportData`, e.g. `lines`. Use empty string when `ReportData` is itself a row array */
  dataPath: string;
  columns: TableColumn[];
  showHeader?: boolean;
  headerFillColor?: [number, number, number];
}

export type ReportBand = TextBand | SpacerBand | TableBand;

/**
 * Serializable report layout (store in DB / file). Process with `generateReportPdf`.
 */
export interface ReportDefinition {
  version: typeof REPORT_DEFINITION_VERSION;
  meta: ReportMeta;
  bands: ReportBand[];
}

export type ReportData = Record<string, unknown>;
