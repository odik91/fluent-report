import { useCallback, useState } from "react";

import { generateReportPdfBlob } from "../engine";
import type { ReportData, ReportDefinition } from "../types";

export interface UseFluentReportResult {
  isGenerating: boolean;
  error: Error | null;
  lastBlob: Blob | null;
  generatePdf: () => Promise<Blob | null>;
  downloadPdf: (filename?: string) => Promise<void>;
}

/**
 * Generate or download a PDF from a stored definition and runtime ERP payload.
 */
export function useFluentReport(
  definition: ReportDefinition | null | undefined,
  data: ReportData | null | undefined,
  options?: { defaultFilename?: string },
): UseFluentReportResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);

  const generatePdf = useCallback(async (): Promise<Blob | null> => {
    if (!definition || !data) {
      setError(new Error("definition and data are required"));
      return null;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const blob = generateReportPdfBlob(definition, data);
      setLastBlob(blob);
      return blob;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [definition, data]);

  const downloadPdf = useCallback(
    async (filename?: string) => {
      const blob = await generatePdf();
      if (!blob) return;
      const name =
        filename ??
        options?.defaultFilename ??
        `${definition?.meta.title?.replace(/\s+/g, "-") || "report"}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name.endsWith(".pdf") ? name : `${name}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    [definition?.meta.title, generatePdf, options?.defaultFilename],
  );

  return { isGenerating, error, lastBlob, generatePdf, downloadPdf };
}
