import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { getByPath, renderTemplate } from "./template";
import type { ReportBand, ReportData, ReportDefinition, TableColumn } from "./types";

function marginDefaults(meta: ReportDefinition["meta"]) {
  const m = meta.marginMm ?? {};
  return {
    top: m.top ?? 14,
    right: m.right ?? 14,
    bottom: m.bottom ?? 14,
    left: m.left ?? 14,
  };
}

function getTableRows(data: ReportData, dataPath: string): Record<string, unknown>[] {
  const path = dataPath.trim();
  if (!path) {
    const root = data as unknown;
    if (Array.isArray(root)) return root as Record<string, unknown>[];
    return [];
  }
  const v = getByPath(data, path);
  if (!Array.isArray(v)) return [];
  return v as Record<string, unknown>[];
}

function formatColumnValue(row: Record<string, unknown>, col: TableColumn): string {
  const raw = getByPath(row, col.field);
  if (raw == null) return "";

  const locale = col.locale ?? "id-ID";
  const fmt = col.format ?? "text";

  if (fmt === "text") return String(raw);

  if (fmt === "integer") {
    const n = Number(raw);
    if (!Number.isFinite(n)) return String(raw);
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  }

  if (fmt === "number") {
    const n = Number(raw);
    if (!Number.isFinite(n)) return String(raw);
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(n);
  }

  if (fmt === "currency") {
    const n = Number(raw);
    if (!Number.isFinite(n)) return String(raw);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: col.currency ?? "IDR",
      maximumFractionDigits: 2,
    }).format(n);
  }

  if (fmt === "date" || fmt === "datetime") {
    const d = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: col.dateStyle ?? "medium",
      timeStyle: fmt === "datetime" ? col.timeStyle ?? "short" : undefined,
    }).format(d);
  }

  return String(raw);
}

function lineHeightMm(fontSizePt: number): number {
  return fontSizePt * 0.352778 * 1.2;
}

function applyTextBand(
  doc: jsPDF,
  band: Extract<ReportBand, { type: "text" }>,
  data: ReportData,
  y: number,
  marginLeft: number,
  innerWidth: number,
  defaultFontSize: number,
): number {
  const fs = band.fontSize ?? defaultFontSize;
  doc.setFont("helvetica", band.bold ? "bold" : "normal");
  doc.setFontSize(fs);
  const text = renderTemplate(band.value, data);
  const lines = doc.splitTextToSize(text, innerWidth);
  const lh = lineHeightMm(fs);
  const align = band.align ?? "left";
  const pdfAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
  // jsPDF: untuk center/right, x adalah titik acuan (tengah / tepi kanan blok), bukan margin kiri.
  const anchorX =
    align === "center"
      ? marginLeft + innerWidth / 2
      : align === "right"
        ? marginLeft + innerWidth
        : marginLeft;
  doc.text(lines, anchorX, y, { maxWidth: innerWidth, align: pdfAlign });
  const height = Math.max(1, lines.length) * lh;
  return y + height + (band.marginBottomMm ?? 2);
}

function columnStylesForBand(
  band: Extract<ReportBand, { type: "table" }>,
  innerWidth: number,
): Record<number, { cellWidth?: number; halign?: "left" | "center" | "right" }> {
  const weights = band.columns.map((c) => (c.width != null && c.width > 0 ? c.width : 1));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const out: Record<number, { cellWidth?: number; halign?: "left" | "center" | "right" }> = {};
  band.columns.forEach((col, i) => {
    const w = (weights[i]! / sum) * innerWidth;
    out[i] = {
      cellWidth: w,
      halign: col.align ?? "left",
    };
  });
  return out;
}

/**
 * Build a PDF from a stored definition and runtime data (browser or Node with DOM libs).
 */
export function generateReportPdf(definition: ReportDefinition, data: ReportData): jsPDF {
  const { meta, bands } = definition;
  const m = marginDefaults(meta);

  const doc = new jsPDF({
    orientation: meta.orientation ?? "portrait",
    unit: "mm",
    format: meta.format ?? "a4",
  });

  doc.setProperties({
    title: meta.title,
    subject: meta.subject,
    author: meta.author,
    keywords: meta.keywords,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const innerW = pageW - m.left - m.right;
  let y = m.top;
  const defaultFs = meta.defaultFontSize ?? 10;

  for (const band of bands) {
    if (band.type === "spacer") {
      y += band.heightMm;
      continue;
    }

    if (band.type === "text") {
      y = applyTextBand(doc, band, data, y, m.left, innerW, defaultFs);
      continue;
    }

    if (band.type === "table") {
      const rows = getTableRows(data, band.dataPath);
      const body = rows.map((row) => band.columns.map((col) => formatColumnValue(row, col)));
      const showHead = band.showHeader !== false;
      const head = showHead ? [band.columns.map((c) => c.header)] : undefined;

      autoTable(doc, {
        startY: y,
        head: head as never,
        body,
        theme: "striped",
        margin: { left: m.left, right: m.right },
        tableWidth: innerW,
        columnStyles: columnStylesForBand(band, innerW),
        headStyles: band.headerFillColor
          ? { fillColor: band.headerFillColor }
          : { fillColor: [240, 240, 240] },
        styles: { fontSize: defaultFs, cellPadding: 1.5 },
      });

      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY;
      y = (finalY ?? y) + 6;
    }
  }

  return doc;
}

export function generateReportPdfBlob(
  definition: ReportDefinition,
  data: ReportData,
): Blob {
  const doc = generateReportPdf(definition, data);
  return doc.output("blob");
}
