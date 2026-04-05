# @alishoddiqien/fluent-report

Definisi laporan berbasis JSON (mirip konsep template iReport) dan generator PDF yang cocok untuk aplikasi **React 18+ / 19** dan **ERP**: simpan template di API/database, muat di banyak modul, isi data saat runtime.

## Instal

```bash
npm install @alishoddiqien/fluent-report
```

Di aplikasi React, pastikan `react` dan `react-dom` (^18 atau ^19) sudah terpasang.

## Menyimpan & memuat definisi (ERP)

```ts
import {
  parseReportDefinition,
  serializeReportDefinition,
  type ReportDefinition,
} from "@alishoddiqien/fluent-report";

// Simpan ke DB / file
const json = serializeReportDefinition(definition);
await api.saveReportTemplate({ id, json });

// Muat kembali
const loaded: ReportDefinition = parseReportDefinition(row.json);
```

## Generate PDF (tanpa React)

```ts
import { generateReportPdfBlob, type ReportData } from "@alishoddiqien/fluent-report";

const blob = generateReportPdfBlob(definition, data as ReportData);
```

## React (hook + tombol unduh)

```tsx
import {
  parseReportDefinition,
  type ReportData,
} from "@alishoddiqien/fluent-report";
import { FluentReportDownload } from "@alishoddiqien/fluent-report/react";

function InvoiceActions({ definitionJson, payload }: Props) {
  const definition = parseReportDefinition(definitionJson);
  return (
    <FluentReportDownload
      definition={definition}
      data={payload as ReportData}
      label="Unduh PDF"
      filename="invoice.pdf"
    />
  );
}
```

Atau hook:

```tsx
import { useFluentReport } from "@alishoddiqien/fluent-report/react";

const { downloadPdf, isGenerating, error } = useFluentReport(definition, data, {
  defaultFilename: "laporan.pdf",
});
```

## Bentuk definisi (versi `1`)

- `meta`: judul PDF, ukuran halaman, orientasi, margin.
- `bands`: urutan dari atas ke bawah:
  - `text` — teks statis + placeholder `{{path.ke.field}}` pada objek data root.
  - `spacer` — jarak vertikal (mm).
  - `table` — `dataPath` menuju array baris; `columns` memetakan kolom ke `field` per baris dengan format angka/mata uang/tanggal.

Contoh minimal:

```json
{
  "version": "1",
  "meta": {
    "title": "Daftar Barang",
    "format": "a4",
    "orientation": "portrait",
    "marginMm": { "top": 14, "right": 14, "bottom": 14, "left": 14 }
  },
  "bands": [
    { "type": "text", "value": "{{company.name}}", "fontSize": 14, "bold": true },
    { "type": "spacer", "heightMm": 4 },
    {
      "type": "table",
      "dataPath": "lines",
      "columns": [
        { "id": "sku", "header": "SKU", "field": "sku" },
        { "id": "qty", "header": "Qty", "field": "qty", "format": "integer", "align": "right" },
        {
          "id": "amount",
          "header": "Jumlah",
          "field": "amount",
          "format": "currency",
          "currency": "IDR",
          "align": "right"
        }
      ]
    }
  ]
}
```

Data runtime (contoh):

```json
{
  "company": { "name": "PT Contoh" },
  "lines": [
    { "sku": "A1", "qty": 2, "amount": 150000 },
    { "sku": "B2", "qty": 1, "amount": 99000 }
  ]
}
```

## Publish ke npm

1. Ganti `name` di `package.json` ke scope npm Anda, misalnya `@npmuser/fluent-report`.
2. Sesuaikan `repository.url`.
3. `npm login` lalu `npm publish --access public`.

## Build lokal

```bash
npm run build
```

Output ada di folder `dist/`.
