import type { CSSProperties, ReactNode } from "react";

import type { ReportData, ReportDefinition } from "../types";
import { useFluentReport } from "./useFluentReport";

export interface FluentReportDownloadProps {
  definition: ReportDefinition;
  data: ReportData;
  label?: ReactNode;
  filename?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

/**
 * Button that downloads a PDF built from a persisted definition + data.
 */
export function FluentReportDownload({
  definition,
  data,
  label = "Download PDF",
  filename,
  className,
  style,
  disabled,
}: FluentReportDownloadProps) {
  const { downloadPdf, isGenerating, error } = useFluentReport(definition, data, {
    defaultFilename: filename,
  });

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        className={className}
        style={style}
        disabled={disabled || isGenerating}
        onClick={() => void downloadPdf(filename)}
      >
        {isGenerating ? "…" : label}
      </button>
      {error ? (
        <span style={{ color: "crimson", fontSize: 12 }} role="alert">
          {error.message}
        </span>
      ) : null}
    </span>
  );
}
