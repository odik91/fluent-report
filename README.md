# @alishoddiqien/fluent-report

Definisi laporan berbasis JSON (mirip konsep template iReport) dan generator PDF yang cocok untuk aplikasi **React 18+ / 19** dan **ERP**: simpan template di API/database, muat di banyak modul, isi data saat runtime.

## Instal

```bash
npm install @alishoddiqien/fluent-report
```

Di aplikasi React, pastikan `react` dan `react-dom` (^18 atau ^19) sudah terpasang.

## Report builder (GUI, seperti *Gui Based* di [fluentReports demo](https://fluentreports.com/demo.html))

Komponen `ReportBuilder` membangun `ReportDefinition` secara visual (panel **Properti** + **Kanvas** band, garis margin merah, tombol **+ Gambar** untuk logo). Setiap `onChange` menghasilkan objek baru — serialkan ke JSON untuk disimpan di API/DB. Root memakai class `fr-report-builder`; di CSS Anda bisa override grid (playground memakai satu kolom di layar sempit).

```tsx
import { useState } from "react";
import type { ReportDefinition } from "@alishoddiqien/fluent-report";
import {
  ReportBuilder,
  createDefaultReportDefinition,
  serializeReportDefinition,
} from "@alishoddiqien/fluent-report/builder";

export function ReportDesignerRoute() {
  const [definition, setDefinition] = useState<ReportDefinition>(() => createDefaultReportDefinition());

  async function save() {
    const json = serializeReportDefinition(definition);
    await fetch("/api/report-templates", { method: "POST", body: json });
  }

  return (
    <>
      <ReportBuilder value={definition} onChange={setDefinition} />
      <button type="button" onClick={() => void save()}>
        Simpan template (JSON)
      </button>
    </>
  );
}
```

Entry point: `@alishoddiqien/fluent-report/builder` (ikut ter-bundle ke aplikasi Anda). Dari **npm**, impor subpath ini biasanya langsung berfungsi lewat field `exports` pada `package.json`.

Jika Anda **meng-alias** seluruh paket ke satu file (monorepo / `file:..`), di **Vite** urutkan alias agar `@…/fluent-report/builder` dan `@…/fluent-report/react` dicocokkan **sebelum** `@…/fluent-report` (lihat `playground/vite.config.ts`).

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
  - `image` — logo/gambar: `src` berisi **data URL** (`data:image/png;base64,...`), plus `widthMm`, `heightMm`, `align`. Untuk PDF andal di ERP, hindari URL eksternal mentah (CORS); simpan base64 atau URL yang Anda resolve ke data URL di server.
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

## Playground (UI demo)

Aplikasi Vite + React di folder `playground/` meniru pola [fluentReports Live Demo](https://fluentreports.com/demo.html): tab **Berbasis GUI** (`ReportBuilder`), **Berbasis JSON**, dan **Pratinjau PDF**.

Pertama kali, pasang dependensi playground:

```bash
cd playground && npm install && cd ..
```

Lalu dari akar repo:

```bash
npm run playground
```

Atau langsung:

```bash
cd playground && npm run dev
```

Buka `http://localhost:5174` (port default Vite di `playground/vite.config.ts`).

## Publish ke npm

1. Ganti `name` di `package.json` ke scope npm Anda, misalnya `@npmuser/fluent-report`.
2. Sesuaikan `repository.url`.
3. `npm login` lalu `npm publish --access public`.

## Build lokal

```bash
npm run build
```

Output ada di folder `dist/`.
