export const SAMPLE_DEFINITION_JSON = `{
  "version": "1",
  "meta": {
    "title": "Playground — Daftar Barang",
    "subject": "Contoh ERP",
    "author": "Fluent Report",
    "format": "a4",
    "orientation": "portrait",
    "marginMm": { "top": 14, "right": 14, "bottom": 14, "left": 14 },
    "defaultFontSize": 10
  },
  "bands": [
    {
      "type": "text",
      "value": "{{company.name}}",
      "fontSize": 16,
      "bold": true,
      "align": "center",
      "marginBottomMm": 2
    },
    {
      "type": "text",
      "value": "{{company.address}} — {{report.generatedAt}}",
      "fontSize": 9,
      "align": "center",
      "marginBottomMm": 6
    },
    { "type": "spacer", "heightMm": 2 },
    {
      "type": "table",
      "dataPath": "lines",
      "showHeader": true,
      "headerFillColor": [230, 236, 245],
      "columns": [
        { "id": "sku", "header": "SKU", "field": "sku", "width": 1.2 },
        { "id": "name", "header": "Nama", "field": "name", "width": 2 },
        {
          "id": "qty",
          "header": "Qty",
          "field": "qty",
          "format": "integer",
          "align": "right",
          "width": 0.8
        },
        {
          "id": "price",
          "header": "Harga",
          "field": "price",
          "format": "currency",
          "currency": "IDR",
          "align": "right",
          "width": 1.2
        },
        {
          "id": "amount",
          "header": "Jumlah",
          "field": "amount",
          "format": "currency",
          "currency": "IDR",
          "align": "right",
          "width": 1.2
        }
      ]
    }
  ]
}`;

export const SAMPLE_DATA_JSON = `{
  "company": {
    "name": "PT Contoh ERP",
    "address": "Jl. Sudirman No. 1, Jakarta"
  },
  "report": {
    "generatedAt": "5 Apr 2026"
  },
  "lines": [
    { "sku": "BRG-001", "name": "Laptop 14 inch", "qty": 2, "price": 12000000, "amount": 24000000 },
    { "sku": "BRG-002", "name": "Monitor 27 inch", "qty": 1, "price": 4500000, "amount": 4500000 },
    { "sku": "BRG-003", "name": "Keyboard mekanik", "qty": 5, "price": 1200000, "amount": 6000000 }
  ]
}`;
