import { REPORT_DEFINITION_VERSION, type ReportDefinition } from "../types";

export function createDefaultReportDefinition(): ReportDefinition {
  return {
    version: REPORT_DEFINITION_VERSION,
    meta: {
      title: "Laporan baru",
      format: "a4",
      orientation: "portrait",
      marginMm: { top: 14, right: 14, bottom: 14, left: 14 },
      defaultFontSize: 10,
    },
    bands: [
      {
        type: "text",
        value: "{{judul}}",
        fontSize: 14,
        bold: true,
        align: "center",
        marginBottomMm: 4,
      },
      { type: "spacer", heightMm: 4 },
      {
        type: "table",
        dataPath: "rows",
        showHeader: true,
        headerFillColor: [230, 236, 245],
        columns: [
          { id: "col_1", header: "Kolom 1", field: "a" },
          { id: "col_2", header: "Kolom 2", field: "b" },
        ],
      },
    ],
  };
}
